"""
HeyGen Browser Automation Service
Uses Playwright to automate video generation through HeyGen website
"""

import os
import asyncio
import logging
from typing import Optional, Dict
from playwright.async_api import async_playwright, Page, Browser

logger = logging.getLogger(__name__)

HEYGEN_EMAIL = os.getenv("HEYGEN_EMAIL", "")
HEYGEN_PASSWORD = os.getenv("HEYGEN_PASSWORD", "")

class HeyGenAutomation:
    """Automate HeyGen video generation through browser"""
    
    def __init__(self):
        self.browser: Optional[Browser] = None
        self.logged_in = False
        
    async def initialize_browser(self):
        """Initialize Playwright browser"""
        if self.browser:
            return
            
        playwright = await async_playwright().start()
        self.browser = await playwright.chromium.launch(
            headless=True,
            args=['--no-sandbox', '--disable-setuid-sandbox']
        )
        logger.info("Browser initialized")
    
    async def login(self, page: Page) -> bool:
        """Log into HeyGen account"""
        try:
            logger.info("Navigating to HeyGen login page")
            await page.goto("https://app.heygen.com/login", timeout=30000)
            await page.wait_for_load_state("networkidle")
            
            # Fill in email
            email_input = await page.wait_for_selector('input[type="email"], input[name="email"], input[placeholder*="email" i]', timeout=10000)
            await email_input.fill(HEYGEN_EMAIL)
            logger.info(f"Email entered: {HEYGEN_EMAIL}")
            
            # Fill in password
            password_input = await page.wait_for_selector('input[type="password"]', timeout=10000)
            await password_input.fill(HEYGEN_PASSWORD)
            logger.info("Password entered")
            
            # Click login button
            login_button = await page.wait_for_selector('button[type="submit"], button:has-text("Sign in"), button:has-text("Login")', timeout=10000)
            await login_button.click()
            logger.info("Login button clicked")
            
            # Wait for navigation after login
            await page.wait_for_load_state("networkidle", timeout=30000)
            
            # Check if we're logged in (look for dashboard or account elements)
            try:
                await page.wait_for_selector('text=/Create|Dashboard|Video/i', timeout=10000)
                self.logged_in = True
                logger.info("✅ Login successful")
                return True
            except:
                logger.error("Login may have failed - dashboard not detected")
                return False
                
        except Exception as e:
            logger.error(f"Login error: {e}")
            return False
    
    async def generate_video(
        self,
        talking_photo_id: str,
        script_text: str,
        voice_id: str,
        title: str = "Generated Video"
    ) -> Dict:
        """
        Generate video using HeyGen website automation
        Returns: {"success": bool, "video_id": str, "error": str}
        """
        try:
            await self.initialize_browser()
            
            context = await self.browser.new_context(
                viewport={"width": 1920, "height": 1080}
            )
            page = await context.new_page()
            
            # Login if not already logged in
            if not self.logged_in:
                login_success = await self.login(page)
                if not login_success:
                    return {"success": False, "error": "Login failed"}
            
            logger.info("Navigating to video creation page")
            
            # Navigate to create video page (this URL might vary)
            await page.goto("https://app.heygen.com/videos", timeout=30000)
            await page.wait_for_load_state("networkidle")
            
            # Look for "Create Video" or similar button
            try:
                create_button = await page.wait_for_selector('button:has-text("Create"), a:has-text("Create")', timeout=10000)
                await create_button.click()
                await page.wait_for_timeout(2000)
            except:
                logger.warning("Could not find Create button, may already be on creation page")
            
            # This is a simplified flow - actual HeyGen UI may differ
            # You'll need to inspect HeyGen's actual UI and adjust selectors
            
            logger.info(f"Setting up video generation for talking photo {talking_photo_id}")
            
            # Note: The actual implementation would need to:
            # 1. Select talking photo mode
            # 2. Enter or select the talking_photo_id
            # 3. Enter the script text
            # 4. Select the voice_id
            # 5. Click generate
            # 6. Wait for generation to complete
            # 7. Extract the video URL or ID
            
            # For now, return a placeholder since we need to inspect HeyGen's actual UI
            logger.warning("⚠️ HeyGen automation is not fully implemented - UI inspection required")
            
            # Take screenshot for debugging
            await page.screenshot(path="/tmp/heygen_debug.png")
            logger.info("Screenshot saved to /tmp/heygen_debug.png for debugging")
            
            await context.close()
            
            return {
                "success": False,
                "error": "Automation not fully implemented - needs HeyGen UI inspection",
                "video_id": None
            }
            
        except Exception as e:
            logger.error(f"Video generation error: {e}")
            return {"success": False, "error": str(e)}
    
    async def close(self):
        """Close browser"""
        if self.browser:
            await self.browser.close()
            self.browser = None
            logger.info("Browser closed")


# Singleton instance
_automation_instance: Optional[HeyGenAutomation] = None

async def get_automation_instance() -> HeyGenAutomation:
    """Get or create automation instance"""
    global _automation_instance
    if _automation_instance is None:
        _automation_instance = HeyGenAutomation()
    return _automation_instance


async def generate_video_via_automation(
    talking_photo_id: str,
    script_text: str,
    voice_id: str,
    title: str = "Generated Video"
) -> Dict:
    """
    Main entry point for video generation via browser automation
    """
    automation = await get_automation_instance()
    return await automation.generate_video(
        talking_photo_id=talking_photo_id,
        script_text=script_text,
        voice_id=voice_id,
        title=title
    )
