import os
import base64
import re
from contextlib import asynccontextmanager
from typing import List, Optional, Dict
from fastapi import FastAPI, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
from dotenv import load_dotenv
import sys
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Add automation directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
from automation.browser_engine import BrowserEngine
from agent_controller import AgentController

# Load .env from the same directory as this file
env_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path=env_path)

api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    logger.error("GOOGLE_API_KEY not found in environment or .env file.")
else:
    logger.info("API key found (starts with: %s...).", str(api_key)[:4])

genai.configure(api_key=api_key)
# gemini-flash-latest has verified quota in this environment
model = genai.GenerativeModel("gemini-flash-latest")

# ---------------------------------------------------------------------------
# App lifecycle (replaces deprecated @app.on_event)
# ---------------------------------------------------------------------------
browser_engine = BrowserEngine()
agent_controller = AgentController(model, browser_engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting browser engine...")
    await browser_engine.start()
    yield
    logger.info("Stopping browser engine...")
    await browser_engine.stop()


app = FastAPI(title="ScreenPilot API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Pydantic models (kept for documentation / future typed responses)
# ---------------------------------------------------------------------------
class Action(BaseModel):
    type: str  # click, fill, navigate, scroll, wait
    selector: Optional[str] = None
    value: Optional[str] = None
    description: str


class AgentResponse(BaseModel):
    thought: str
    actions: List[Action]
    status: str


class TaskStatus(BaseModel):
    task_id: str
    status: str  # analyzing | planning | executing | completed | failed | stopped
    logs: List[str]
    last_screenshot: Optional[str] = None


# ---------------------------------------------------------------------------
# In-memory task store
# ---------------------------------------------------------------------------
tasks: Dict[str, dict] = {}

# ---------------------------------------------------------------------------
# Rule-based intent detection (fast-path for simple commands)
# ---------------------------------------------------------------------------
def detect_intent(command: str) -> Optional[dict]:
    cmd = command.lower().strip().rstrip(".?!")

    if any(p in cmd for p in ("hi", "hello", "hey", "greetings")):
        return {
            "thought": "Greeting detected.",
            "actions": [],
            "status": "completed",
            "message": "Hello! I am ScreenPilot. How can I help you navigate the web today?",
        }

    if any(p in cmd for p in ("who are you", "what is screenpilot")):
        return {
            "thought": "Identity question detected.",
            "actions": [],
            "status": "completed",
            "message": "I am ScreenPilot, your multimodal AI UI navigator. Give me a web task and I'll handle it.",
        }

    if any(p in cmd for p in ("thanks", "thank you", "cool", "awesome")):
        return {
            "thought": "Gratitude detected.",
            "actions": [],
            "status": "completed",
            "message": "You're welcome! Ready for your next task.",
        }

    if any(p in cmd for p in ("help", "what can you do", "capabilities", "how to use")):
        return {
            "thought": "Help request detected.",
            "actions": [],
            "status": "completed",
            "message": "I can navigate websites, search Google, click buttons, and fill forms based on your commands.",
        }

    if any(p in cmd for p in ("status", "system status", "health")):
        return {
            "thought": "Status request detected.",
            "actions": [],
            "status": "completed",
            "message": "System: Operational. Engine: Hybrid (Intent + LLM). Latency: Minimal.",
        }

    # Direct navigation intent
    nav_match = re.search(
        r"(?:go to|navigate to|open|browse to|visit)\s+(https?://\S+|www\.\S+|\S+\.\S+)", cmd
    )
    if nav_match:
        url = nav_match.group(1).rstrip("/ ")
        if not url.startswith("http"):
            url = "https://" + url
        return {
            "thought": f"Direct navigation to {url}.",
            "actions": [{"type": "navigate", "value": url, "description": f"Navigating to {url}"}],
            "status": "completed",
        }

    # Search intent
    search_match = re.search(r"(?:search for|google|find|look up)\s+(.*)", cmd)
    if search_match:
        query = search_match.group(1)
        url = f"https://www.google.com/search?q={query.replace(' ', '+')}"
        return {
            "thought": f"Search request for '{query}'.",
            "actions": [{"type": "navigate", "value": url, "description": f"Searching for {query}"}],
            "status": "completed",
        }

    return None


# ---------------------------------------------------------------------------
# API Endpoints
# ---------------------------------------------------------------------------
@app.post("/execute-task")
async def execute_task(background_tasks: BackgroundTasks, command: str = Form(...)):
    """Start a new agent task. Returns a task_id for polling."""
    task_id = f"task_{len(tasks) + 1}"
    tasks[task_id] = {"status": "starting", "logs": [], "last_screenshot": None}
    background_tasks.add_task(run_agent_loop, task_id, command)
    logger.info("Task %s created for command: %s", task_id, command)
    return {"task_id": task_id}


@app.get("/task/{task_id}")
async def get_task_status(task_id: str):
    """Poll for task status, logs, and latest screenshot."""
    if task_id not in tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    return tasks[task_id]


@app.post("/stop-task")
async def stop_task(task_id: str = Form(...)):
    """Signal the agent loop to stop a running task."""
    if task_id not in tasks:
        return {"status": "error", "message": "Task not found"}
    tasks[task_id]["status"] = "stopped"
    tasks[task_id]["logs"].append("Stop command received. Terminating protocol.")
    logger.info("Task %s stop requested.", task_id)
    return {"status": "success", "message": "Task stopped"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


# ---------------------------------------------------------------------------
# Agent loop (background task)
# ---------------------------------------------------------------------------
async def run_agent_loop(task_id: str, command: str):
    tasks[task_id]["status"] = "running"
    tasks[task_id]["logs"].append(f"User: {command}")
    logger.info("[%s] Agent loop started.", task_id)

    # Fast-path: handle simple intents without calling Gemini
    intent_result = detect_intent(command)
    if intent_result:
        # Purely conversational — no actions needed
        if not intent_result.get("actions") and "message" in intent_result:
            tasks[task_id]["logs"].append(f"Agent: {intent_result['message']}")
            tasks[task_id]["status"] = "completed"
            return

        tasks[task_id]["logs"].append(f"System: {intent_result['thought']}")
        for action in intent_result["actions"]:
            tasks[task_id]["logs"].append(f"Executing: {action['description']}")
            await browser_engine.execute_action(action)

        if "message" in intent_result:
            tasks[task_id]["logs"].append(f"Agent: {intent_result['message']}")

        tasks[task_id]["status"] = "completed"
        return

    # Full agent loop — delegate to AgentController
    await agent_controller.run(task_id, command, tasks)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
