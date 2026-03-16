"""
Agent Controller — orchestrates the ScreenPilot multimodal agent loop.

Responsibilities:
  - Receive user goal
  - Capture screenshot
  - Call Gemini to generate a structured action plan
  - Validate each step before execution
  - Execute actions via BrowserEngine
  - Retry failed steps (up to MAX_RETRIES)
  - Track session state in memory
"""

import base64
import io
import json
import logging
import re
from typing import Optional

import PIL.Image

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Improved Gemini prompt
# ---------------------------------------------------------------------------
AGENT_PROMPT = """You are an AI UI navigation agent controlling a web browser.

User Goal: "{goal}"

Steps completed so far: {completed_steps}

Analyze the current screenshot and determine the NEXT set of actions needed to make progress toward the goal.

Rules:
- Only interact with elements that are VISIBLE in the screenshot.
- Do NOT hallucinate elements that are not visible.
- Keep actions minimal and focused — one logical step at a time.
- If the goal is already achieved, set status to "completed".
- If the task is impossible given the current screen, set status to "failed".
- Return ONLY valid JSON — no markdown, no code fences, no extra text.

Return exactly this JSON structure:
{{
  "thought": "Brief reasoning about the current UI state and what to do next",
  "actions": [
    {{
      "type": "click|fill|navigate|scroll|wait",
      "selector": "CSS selector, placeholder text, button label, or link text",
      "value": "value if needed (text for fill, URL for navigate, pixels for scroll, seconds for wait)",
      "description": "Short human-readable description of this action"
    }}
  ],
  "status": "executing|completed|failed"
}}"""

# ---------------------------------------------------------------------------
# In-memory session store
# ---------------------------------------------------------------------------
sessions: dict = {}


def get_or_create_session(session_id: str, goal: str) -> dict:
    if session_id not in sessions:
        sessions[session_id] = {
            "goal": goal,
            "steps": [],
            "current_step": 0,
            "last_screenshot": None,
            "status": "starting",
        }
    return sessions[session_id]


# ---------------------------------------------------------------------------
# Agent Controller
# ---------------------------------------------------------------------------
class AgentController:
    MAX_ITERATIONS = 15  # Guard against infinite loops
    MAX_RETRIES = 2       # Retries per failed step

    def __init__(self, model, browser_engine):
        self.model = model
        self.browser = browser_engine

    async def run(self, task_id: str, goal: str, task_store: dict):
        """Main agent loop: capture → plan → validate → execute → repeat."""
        session = get_or_create_session(task_id, goal)
        task_store[task_id]["logs"].append(f"Goal received: {goal}")
        logger.info("[%s] Goal received: %s", task_id, goal)

        retry_count = 0

        for iteration in range(1, self.MAX_ITERATIONS + 1):
            # Respect external stop/failure
            if task_store[task_id]["status"] in ("stopped", "failed"):
                logger.info("[%s] Task externally terminated.", task_id)
                break

            # --- Capture screenshot ---
            task_store[task_id]["status"] = "analyzing"
            logger.info("[%s] Capturing screenshot (iteration %d).", task_id, iteration)

            screenshot_bytes = await self.browser.get_screenshot()
            if not screenshot_bytes:
                task_store[task_id]["logs"].append("Error: Screenshot capture failed.")
                task_store[task_id]["status"] = "failed"
                logger.error("[%s] Screenshot capture failed.", task_id)
                break

            session["last_screenshot"] = screenshot_bytes
            task_store[task_id]["last_screenshot"] = base64.b64encode(screenshot_bytes).decode("utf-8")
            task_store[task_id]["logs"].append("Screenshot captured.")

            # --- Generate plan ---
            task_store[task_id]["status"] = "planning"
            task_store[task_id]["logs"].append("Analyzing UI and generating action plan...")
            logger.info("[%s] Requesting plan from Gemini.", task_id)

            plan = await self._generate_plan(goal, session["steps"], screenshot_bytes)
            if plan is None:
                retry_count += 1
                if retry_count <= self.MAX_RETRIES:
                    task_store[task_id]["logs"].append(
                        f"Plan generation failed. Retrying ({retry_count}/{self.MAX_RETRIES})..."
                    )
                    logger.warning("[%s] Plan generation failed. Retry %d.", task_id, retry_count)
                    continue
                task_store[task_id]["logs"].append("Error: Could not generate a valid plan after retries.")
                task_store[task_id]["status"] = "failed"
                break

            retry_count = 0  # Reset on successful plan

            thought = plan.get("thought", "")
            task_store[task_id]["logs"].append(f"AI Thought: {thought}")
            logger.info("[%s] Thought: %s", task_id, thought)

            plan_status = plan.get("status")

            if plan_status == "completed":
                task_store[task_id]["logs"].append("Task completed successfully!")
                task_store[task_id]["status"] = "completed"
                session["status"] = "completed"
                logger.info("[%s] Task completed.", task_id)
                break

            if plan_status == "failed":
                task_store[task_id]["logs"].append("AI indicated the task cannot be completed.")
                task_store[task_id]["status"] = "failed"
                break

            actions = plan.get("actions", [])
            if not actions:
                task_store[task_id]["logs"].append("No actions returned; assuming task complete.")
                task_store[task_id]["status"] = "completed"
                break

            # --- Execute actions ---
            task_store[task_id]["status"] = "executing"
            step_failed = False

            for action in actions:
                if task_store[task_id]["status"] == "stopped":
                    break

                desc = action.get("description") or action.get("type", "action")

                # Validate selector before executing
                if not await self._validate_action(action):
                    task_store[task_id]["logs"].append(
                        f"Validation failed for '{desc}'. Requesting updated plan..."
                    )
                    logger.warning("[%s] Validation failed: %s", task_id, action)
                    step_failed = True
                    break

                task_store[task_id]["logs"].append(f"Executing: {desc}")
                logger.info("[%s] Executing: %s", task_id, desc)

                success, msg = await self.browser.execute_action(action)
                if success:
                    session["steps"].append(desc)
                    session["current_step"] += 1
                    logger.info("[%s] Step succeeded: %s", task_id, desc)
                else:
                    task_store[task_id]["logs"].append(f"Step failed: {msg}")
                    logger.error("[%s] Step failed: %s", task_id, msg)
                    retry_count += 1
                    step_failed = True
                    if retry_count > self.MAX_RETRIES:
                        task_store[task_id]["logs"].append("Max retries reached. Task failed.")
                        task_store[task_id]["status"] = "failed"
                    break

            if task_store[task_id]["status"] in ("failed", "stopped", "completed"):
                break

        else:
            # for-loop exhausted without break → max iterations reached
            task_store[task_id]["logs"].append(f"Max iterations ({self.MAX_ITERATIONS}) reached. Stopping.")
            task_store[task_id]["status"] = "completed"
            logger.warning("[%s] Max iterations reached.", task_id)

        # Ensure status is never left as a transient state
        if task_store[task_id]["status"] in ("analyzing", "planning", "executing"):
            task_store[task_id]["status"] = "completed"

    async def _generate_plan(
        self, goal: str, completed_steps: list, screenshot_bytes: bytes
    ) -> Optional[dict]:
        """Call Gemini with the screenshot and goal; return parsed JSON plan."""
        raw = ""
        try:
            pil_image = PIL.Image.open(io.BytesIO(screenshot_bytes))
            completed = ", ".join(completed_steps) if completed_steps else "None"
            prompt = AGENT_PROMPT.format(goal=goal, completed_steps=completed)

            response = self.model.generate_content([prompt, pil_image])
            raw = response.text.strip()

            # Strip markdown code fences (```json ... ``` or ``` ... ```)
            cleaned = re.sub(r"^```(?:json)?\s*\n?", "", raw, flags=re.MULTILINE)
            cleaned = re.sub(r"\n?```\s*$", "", cleaned, flags=re.MULTILINE)
            cleaned = cleaned.strip()

            return json.loads(cleaned)

        except json.JSONDecodeError as e:
            logger.error("JSON parse error: %s. Raw snippet: %.300s", e, raw)
            return None
        except Exception as e:
            logger.error("Gemini API error: %s", e)
            return None

    async def _validate_action(self, action: dict) -> bool:
        """
        Lightweight pre-execution check: confirm the target element exists.
        Actions that don't target a DOM element (navigate, wait, scroll) always pass.
        """
        action_type = action.get("type")
        selector = action.get("selector")

        # These action types don't need a selector
        if action_type in ("navigate", "wait", "scroll") or not selector:
            return True

        if self.browser.page is None:
            return False

        # Try the selector as-is, then as a text locator
        for sel in (selector, f"text={selector}"):
            try:
                element = await self.browser.page.wait_for_selector(
                    sel, timeout=2000, state="attached"
                )
                if element:
                    return True
            except Exception:
                continue

        return False
