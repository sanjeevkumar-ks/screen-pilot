import asyncio
import logging
from playwright.async_api import async_playwright

logger = logging.getLogger(__name__)


class BrowserEngine:
    def __init__(self):
        self.browser = None
        self.context = None
        self.page = None

    async def start(self):
        self.playwright = await async_playwright().start()
        self.browser = await self.playwright.chromium.launch(headless=True)
        self.context = await self.browser.new_context()
        self.page = await self.context.new_page()
        logger.info("BrowserEngine started.")

    async def stop(self):
        if self.browser:
            await self.browser.close()
        if hasattr(self, "playwright"):
            await self.playwright.stop()
        logger.info("BrowserEngine stopped.")

    async def execute_action(self, action: dict) -> tuple:
        """
        Execute a single Playwright action.
        Returns (success: bool, message: str).
        """
        action_type = action.get("type")
        selector = action.get("selector")
        value = action.get("value")

        logger.info("execute_action: type=%s selector=%s value=%s", action_type, selector, value)

        try:
            if action_type == "navigate":
                await self.page.goto(value, wait_until="domcontentloaded")

            elif action_type == "click":
                await self._click(selector)

            elif action_type == "fill":
                await self._fill(selector, value or "")

            elif action_type == "scroll":
                pixels = int(value or 300)
                await self.page.evaluate(f"window.scrollBy(0, {pixels})")

            elif action_type == "wait":
                await asyncio.sleep(float(value or 2))

            else:
                return False, f"Unknown action type: {action_type}"

            return True, "Action completed"

        except Exception as e:
            logger.error("Action failed (%s): %s", action_type, e)
            return False, str(e)

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------
    async def _click(self, selector: str):
        """Click an element. Tries CSS selector first, falls back to text locator."""
        if self._is_css_selector(selector):
            await self.page.click(selector)
        else:
            try:
                await self.page.click(f"text={selector}")
            except Exception:
                # Last resort: role-based locators
                await self.page.get_by_role("button", name=selector).click()

    async def _fill(self, selector: str, value: str):
        """
        Fill an input field.
        Tries multiple strategies for non-CSS selectors because
        `text=` locates by text content (labels/divs), NOT input fields.
        """
        if self._is_css_selector(selector):
            await self.page.fill(selector, value)
            return

        # Try common input locator strategies in order
        strategies = [
            f'[placeholder*="{selector}"]',
            f'[name="{selector}"]',
            f'[aria-label*="{selector}"]',
            f'[id*="{selector}"]',
        ]
        for strat in strategies:
            try:
                await self.page.fill(strat, value)
                return
            except Exception:
                continue

        # Playwright locator API fallbacks
        try:
            await self.page.get_by_placeholder(selector).fill(value)
            return
        except Exception:
            pass

        try:
            await self.page.get_by_label(selector).fill(value)
            return
        except Exception:
            pass

        raise RuntimeError(f"Could not locate input for selector: '{selector}'")

    @staticmethod
    def _is_css_selector(selector: str) -> bool:
        """Heuristic: strings containing CSS-specific chars are treated as CSS selectors."""
        return any(c in selector for c in ("#", ".", "[", ">", ":"))

    async def get_screenshot(self) -> bytes | None:
        if self.page:
            return await self.page.screenshot()
        return None
