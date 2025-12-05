# HeyGen Browser Automation Guide

## Overview
This system allows you to generate HeyGen videos without using API credits by automating the HeyGen website through browser automation (Playwright).

## Current Status

### ✅ What's Implemented
1. **Credentials Storage** - Email and password saved securely in `.env`
2. **Mode Switching** - Toggle between API, Test, and Automation modes
3. **Browser Automation Framework** - Playwright setup for headless browser control
4. **Login System** - Automated login to HeyGen account
5. **UI Indicators** - Visual badges showing which mode is active
6. **Fallback System** - Falls back to test mode if automation fails

### ⚠️ What Needs Completion
The browser automation skeleton is in place, but **requires HeyGen UI inspection** to complete:

1. **Video Creation Flow** - Need to map HeyGen's UI elements:
   - How to navigate to video creation page
   - How to select "Talking Photo" mode
   - How to input/select talking photo ID
   - How to enter script text
   - How to select voice ID
   - How to click "Generate" button

2. **Video Status Monitoring** - Need to:
   - Detect when video generation starts
   - Monitor generation progress
   - Extract final video ID/URL when complete

3. **Error Handling** - Need to handle:
   - Login failures
   - Generation errors
   - Timeout scenarios

## Configuration

### Files to Know
- `/app/backend/.env` - Credentials and mode settings
- `/app/backend/heygen_automation.py` - Browser automation logic
- `/app/backend/storytime.py` - Integration with video generation

### Environment Variables

```bash
# Automation Mode (set to true to use browser automation)
HEYGEN_AUTOMATION_MODE=true

# HeyGen Account Credentials
HEYGEN_EMAIL=Shogunnx@gmail.com
HEYGEN_PASSWORD=Iverson1982!!!

# Test Mode (fallback when automation not ready)
HEYGEN_TEST_MODE=false

# API Mode (original method, uses credits)
HEYGEN_API_KEY=your_api_key_here
```

## How to Complete the Implementation

### Step 1: Inspect HeyGen UI
1. Log into HeyGen manually: https://app.heygen.com
2. Navigate through the video creation flow
3. Note the following:
   - URL of video creation page
   - CSS selectors for each form field
   - Button selectors
   - Any modal dialogs or loading states

### Step 2: Update `heygen_automation.py`

The file has a placeholder `generate_video()` function. You need to:

```python
async def generate_video(self, talking_photo_id, script_text, voice_id, title):
    # 1. Navigate to video creation
    await page.goto("https://app.heygen.com/videos/create")  # Update this URL
    
    # 2. Select talking photo mode
    await page.click('button[data-mode="talking-photo"]')  # Update selector
    
    # 3. Enter talking photo ID
    await page.fill('input[name="avatar-id"]', talking_photo_id)  # Update selector
    
    # 4. Enter script
    await page.fill('textarea[name="script"]', script_text)  # Update selector
    
    # 5. Select voice
    await page.select('select[name="voice"]', voice_id)  # Update selector
    
    # 6. Click generate
    await page.click('button[type="submit"]')
    
    # 7. Wait for generation to complete and extract video ID
    video_element = await page.wait_for_selector('.video-result')
    video_url = await video_element.get_attribute('src')
    
    return {"success": True, "video_id": extract_id(video_url)}
```

### Step 3: Test the Flow

```bash
# Enable automation mode
echo "HEYGEN_AUTOMATION_MODE=true" >> /app/backend/.env

# Restart backend
sudo supervisorctl restart backend

# Test in UI or via curl
curl -X POST http://localhost:8001/api/storytime/generate-narrated \
  -H "Content-Type: application/json" \
  -d '{
    "avatar_id": "d8d16687495340c5805ad9821046be3a",
    "character_id": "binary",
    "character_name": "Binary",
    "story_text": "Test story",
    "story_title": "Test",
    "use_character_voice": true
  }'
```

### Step 4: Debug with Screenshots

The automation saves debug screenshots to `/tmp/heygen_debug.png`. Use these to:
- See what page the automation is on
- Identify correct selectors
- Spot errors in the flow

## Mode Priority

The system checks modes in this order:

1. **Test Mode** (if `HEYGEN_TEST_MODE=true`)
   - Uses pre-recorded videos
   - No API calls, no automation
   - Instant results

2. **Automation Mode** (if `HEYGEN_AUTOMATION_MODE=true`)
   - Uses browser automation
   - No API credits consumed
   - Falls back to test mode if automation fails

3. **API Mode** (default)
   - Uses HeyGen API directly
   - Consumes API credits
   - Most reliable when credits available

## Troubleshooting

### Automation Not Working
1. Check backend logs: `tail -f /var/log/supervisor/backend.*.log`
2. Look for debug screenshot: `ls -la /tmp/heygen_debug.png`
3. Verify credentials: `grep HEYGEN /app/backend/.env`
4. Check Playwright install: `playwright --version`

### Login Failing
- Verify credentials in `.env` are correct
- Check if HeyGen changed their login page
- Update selectors in `login()` function

### UI Elements Not Found
- HeyGen may have updated their UI
- Use browser devtools to find new selectors
- Update selectors in `generate_video()` function

## Security Notes

- Credentials are stored in `.env` (not committed to git)
- Browser runs in headless mode (no visible window)
- No credentials are logged or exposed in API responses

## Next Steps for Production

1. **Complete UI mapping** - Inspect HeyGen and update selectors
2. **Add video polling** - Monitor generation status
3. **Implement retry logic** - Handle transient failures
4. **Add rate limiting** - Respect HeyGen's usage limits
5. **Session persistence** - Keep browser logged in between requests
6. **Error monitoring** - Alert on automation failures

## Alternative: Manual Workflow

If automation proves too complex, you can:
1. Generate videos manually on HeyGen
2. Note the video IDs
3. Add them to `HEYGEN_TEST_VIDEOS` in `.env`
4. Use test mode with your own videos

---

**Current Mode:** 🤖 Automation (waiting for UI implementation)
**Fallback:** 🎬 Test Mode (pre-recorded videos)
**Ready for:** Full automation once HeyGen UI is mapped
