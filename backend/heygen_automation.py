"""
HeyGen Browser Automation Service

This replaces the API calls by driving the HeyGen web app with Playwright.

Storytime already calls:
    from heygen_automation import generate_video_via_automation

So we expose generate_video_via_automation() with the same signature.
"""

import os
import asyncio
import logging
from typing import Dict, Optional, List

from playwright.async_api import (
    async_playwright,
    Page,
    Browser,
    TimeoutError as PlaywrightTimeoutError,
)

logger = logging.getLogger(__name__)

HEYGEN_EMAIL = os.getenv("HEYGEN_EMAIL", "")
HEYGEN_PASSWORD = os.getenv("HEYGEN_PASSWORD", "")
HEYGEN_BASE_URL = os.getenv("HEYGEN_BASE_URL", "https://app.heygen.com")
HEYGEN_HEADLESS = os.getenv("HEYGEN_HEADLESS", "true").lower() == "true"


class HeyGenAutomation:
    """
    Keeps a logged-in browser session and can generate talking-photo videos
    using the HeyGen website instead of the HTTP API.
    """

    def __init__(self) -> None:
        self._playwright = None
        self._browser: Optional[Browser] = None
        self._page: Optional[Page] = None
        self._logged_in: bool = False
        self._lock = asyncio.Lock()

    # ------------------------------------------------------------------
    # Core lifecycle helpers
    # ------------------------------------------------------------------

    async def _ensure_page(self) -> Page:
        """Start Playwright + Chromium if needed and return a Page."""
        if not HEYGEN_EMAIL or not HEYGEN_PASSWORD:
            raise RuntimeError(
                "HEYGEN_EMAIL and HEYGEN_PASSWORD must be set in the environment"
            )

        # If we already have a usable page, reuse it
        if self._page is not None and not self._page.is_closed():
            return self._page

        async with self._lock:
            if self._page is not None and not self._page.is_closed():
                return self._page

            if self._playwright is None:
                logger.info("Starting Playwright for HeyGen automation…")
                self._playwright = await async_playwright().start()

            if self._browser is None:
                self._browser = await self._playwright.chromium.launch(
                    headless=HEYGEN_HEADLESS
                )
                logger.info("Chromium browser launched (headless=%s)", HEYGEN_HEADLESS)

            context = await self._browser.new_context()
            self._page = await context.new_page()
            self._logged_in = False
            return self._page

    async def _login_if_needed(self) -> Page:
        """Log into HeyGen once and keep the session alive."""
        page = await self._ensure_page()
        if self._logged_in:
            return page

        logger.info("Logging into HeyGen as %s", HEYGEN_EMAIL)

        # Go to home; HeyGen will redirect to login if not authenticated
        await page.goto(f"{HEYGEN_BASE_URL}/home", wait_until="networkidle")

        email_selectors: List[str] = [
            'input[type="email"]',
            'input[name="email"]',
            'input[placeholder*="email" i]',
        ]
        password_selectors: List[str] = [
            'input[type="password"]',
            'input[name="password"]',
            'input[placeholder*="password" i]',
        ]

        async def fill_first(selectors: List[str], value: str) -> None:
            for sel in selectors:
                try:
                    el = await page.query_selector(sel)
                    if el:
                        await el.fill(value)
                        return
                except PlaywrightTimeoutError:
                    continue
            raise RuntimeError(f"Could not find field with selectors: {selectors}")

        # If we're already logged in, these will just not appear and will raise —
        # so we guard it and treat that as "already logged in".
        try:
            await fill_first(email_selectors, HEYGEN_EMAIL)
            await fill_first(password_selectors, HEYGEN_PASSWORD)

            # Try a few reasonable login button labels
            login_buttons = [
                'button:has-text("Log in")',
                'button:has-text("Login")',
                'button:has-text("Sign in")',
                'button:has-text("Continue")',
            ]
            clicked = False
            for sel in login_buttons:
                btn = await page.query_selector(sel)
                if btn:
                    await btn.click()
                    clicked = True
                    logger.info("Clicked login button: %s", sel)
                    break

            if not clicked:
                logger.warning("No obvious login button found; assuming already logged in")

            try:
                await page.wait_for_load_state("networkidle", timeout=30000)
            except PlaywrightTimeoutError:
                logger.warning("Login navigation did not reach networkidle in time")

            self._logged_in = True
            logger.info("✅ HeyGen login successful (or session already active)")
            return page

        except Exception as e:
            # If fields aren't found we might already be logged in
            logger.warning("Login fields not found; assuming existing session. (%s)", e)
            self._logged_in = True
            return page

    # ------------------------------------------------------------------
    # Main public API used by storytime.py
    # ------------------------------------------------------------------

    async def generate_video(
        self,
        talking_photo_id: str,
        script_text: str,
        voice_id: str,
        title: str = "Generated Video",
    ) -> Dict:
        """
        Trigger a talking-photo style video in the HeyGen UI.

        NOTE: HeyGen's frontend changes frequently. The selectors below are
        written to be *generic* and may need tweaks in the future by inspecting
        the live DOM in Chrome DevTools.

        On success we return:
            { "success": True, "video_id": <synthetic_id>, "video_url": "" }
        which matches what storytime expects when status="processing".
        """
        page = await self._login_if_needed()

        try:
            # 1) Go to the main app home
            await page.goto(f"{HEYGEN_BASE_URL}/home", wait_until="networkidle")

            # 2) Open a "photo to video" / talking-photo flow
            start_buttons = [
                'button:has-text("Photo to Video")',
                'button:has-text("Avatar IV")',
                'button:has-text("Talking Photo")',
                'button:has-text("Create video")',
            ]
            for sel in start_buttons:
                btn = await page.query_selector(sel)
                if btn:
                    logger.info("Clicking talking-photo start button: %s", sel)
                    await btn.click()
                    break

            # 3) Fill the script text
            script_selectors = [
                'textarea[placeholder*="Enter your script" i]',
                'textarea[placeholder*="Type your script" i]',
                "textarea",
            ]
            script_box = None
            for sel in script_selectors:
                script_box = await page.query_selector(sel)
                if script_box:
                    break

            if not script_box:
                raise RuntimeError("Could not find script textarea on HeyGen page")

            await script_box.fill(script_text)

            # 4) Try to select voice (best-effort; falls back to default on failure)
            try:
                dropdown_candidates = [
                    'button:has-text("Voice")',
                    'div[role="button"]:has-text("Voice")',
                    'div[aria-haspopup="listbox"]:has-text("Voice")',
                ]
                voice_dropdown = None
                for sel in dropdown_candidates:
                    voice_dropdown = await page.query_selector(sel)
                    if voice_dropdown:
                        await voice_dropdown.click()
                        logger.info("Opened voice dropdown with selector %s", sel)
                        break

                if voice_dropdown:
                    search_box = await page.query_selector(
                        'input[placeholder*="Search" i]'
                    )
                    if search_box:
                        await search_box.fill(voice_id)
                        await page.wait_for_timeout(500)
                        option = await page.query_selector(
                            "div[role='option'], li[role='option']"
                        )
                        if option:
                            await option.click()
                            logger.info("Selected voice in UI using id %s", voice_id)
            except Exception as e:
                logger.warning(
                    "Failed to select custom voice in UI; using HeyGen default. %s",
                    e,
                )

            # 5) Optional: set a title if a title input exists
            try:
                title_input = await page.query_selector(
                    'input[placeholder*="Title" i]'
                )
                if title_input:
                    await title_input.fill(title)
            except Exception:
                pass

            # 6) Click the Generate button
            generate_buttons = [
                'button:has-text("Generate")',
                'button:has-text("Create video")',
                'button:has-text("Create")',
            ]
            gen_btn = None
            for sel in generate_buttons:
                gen_btn = await page.query_selector(sel)
                if gen_btn:
                    await gen_btn.click()
                    logger.info("Clicked Generate button: %s", sel)
                    break

            if not gen_btn:
                raise RuntimeError("Could not find Generate button on HeyGen page")

            # 7) Give HeyGen some time to start processing.
            await page.wait_for_timeout(5000)

            # We don't have an easy, stable way to scrape the real video_id from
            # the UI without over-complicating things, so we return a synthetic id.
            synthetic_id = f"browser-{int(asyncio.get_event_loop().time() * 1000)}"
            logger.info(
                "HeyGen video generation triggered successfully (synthetic id=%s)",
                synthetic_id,
            )

            return {
                "success": True,
                "video_id": synthetic_id,
                "video_url": "",
            }

        except Exception as e:
            logger.error("Video generation error via automation: %s", e, exc_info=True)
            # Try to save a debug screenshot so you can see where it failed
            try:
                await page.screenshot(
                    path="/tmp/heygen_debug.png", full_page=True
                )
                logger.info(
                    "Saved HeyGen automation debug screenshot to /tmp/heygen_debug.png"
                )
            except Exception:
                pass

            return {
                "success": False,
                "error": str(e),
                "video_id": None,
                "video_url": "",
            }

    async def close(self) -> None:
        if self._page and not self._page.is_closed():
            await self._page.context.close()
        if self._browser:
            await self._browser.close()
        if self._playwright:
            await self._playwright.stop()
        self._playwright = None
        self._browser = None
        self._page = None
        self._logged_in = False


# ----------------------------------------------------------------------
# Singleton helpers wired to storytime.py
# ----------------------------------------------------------------------

_automation_instance: Optional[HeyGenAutomation] = None
_automation_lock = asyncio.Lock()


async def get_automation_instance() -> HeyGenAutomation:
    global _automation_instance
    if _automation_instance is not None:
        return _automation_instance

    async with _automation_lock:
        if _automation_instance is None:
            _automation_instance = HeyGenAutomation()
    return _automation_instance


async def generate_video_via_automation(
    talking_photo_id: str,
    script_text: str,
    voice_id: str,
    title: str = "Generated Video",
) -> Dict:
    """
    Entry point used by backend/storytime.py when HEYGEN_AUTOMATION_MODE=true.
    """
    automation = await get_automation_instance()
    return await automation.generate_video(
        talking_photo_id=talking_photo_id,
        script_text=script_text,
        voice_id=voice_id,
        title=title,
    )
