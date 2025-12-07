# TSVAvatarGenerator Integration Setup Guide

## ✅ What's Integrated

Your **TSVAvatarGenerator** service (https://lipsync-creator-3.emergent.host/) is now integrated with the StoryTime feature! All video generation will route through your custom avatar generator instead of HeyGen.

---

## 📋 What You Need to Do (3 Steps)

### Step 1: Get API Keys

Your TSVAvatarGenerator needs these API keys to work:

1. **RunwayML API Key** (REQUIRED)
   - Go to: https://runwayml.com
   - Sign up → Settings → API Keys → Create
   - Copy the key (starts with `rw_`)
   - Cost: ~$0.25-$0.50 per 5-second video

2. **ElevenLabs API Key** (REQUIRED for voice)
   - Go to: https://elevenlabs.io
   - Sign up → Profile → API Keys → Create
   - Copy the key
   - Cost: Free tier (10k chars/month), then $5/month

---

### Step 2: Upload Character Images

You need to upload your character images to a publicly accessible URL (or to TSVAvatarGen itself):

**Option A: Use Your Own Image Hosting**
1. Upload character images to:
   - Imgur
   - CloudFlare R2
   - AWS S3
   - Any CDN/hosting service
2. Get the public URLs
3. Update `/app/backend/tsvavatar_integration.py`:

```python
AVATAR_IMAGE_MAPPING = {
    # Evil Victoria
    "738db1645bc140beb1b476231a8b79f4": {
        "name": "Evil Victoria",
        "image_url": "https://your-cdn.com/evil-victoria.png"  # ← UPDATE THIS
    },
    # Binary
    "d8d16687495340c5805ad9821046be3a": {
        "name": "Binary",
        "image_url": "https://your-cdn.com/binary.png"  # ← UPDATE THIS
    },
    # Harmony
    "783e82f2b06948d5b2f882fa351337fd": {
        "name": "Harmony",
        "image_url": "https://your-cdn.com/harmony.png"  # ← UPDATE THIS
    },
    # Victoria Black
    "faa3f1fcdc0b49b79bb0a3fa11595754": {
        "name": "Victoria Black",
        "image_url": "https://your-cdn.com/victoria-black.png"  # ← UPDATE THIS
    },
}
```

**Option B: Upload to TSVAvatarGen**
1. Go to: https://lipsync-creator-3.emergent.host/
2. Upload each character image through the UI
3. Get the avatar IDs from TSVAvatarGen
4. Update the mapping accordingly

---

### Step 3: Add API Keys to .env

Edit `/app/backend/.env`:

```bash
# TSVAvatarGenerator Integration
TSVAVATAR_BASE_URL=https://lipsync-creator-3.emergent.host
TSVAVATAR_MODE=true
TSVAVATAR_RUNWAYML_KEY=rw_your_runwayml_key_here
TSVAVATAR_ELEVENLABS_KEY=your_elevenlabs_key_here
```

Then restart:
```bash
sudo supervisorctl restart backend
```

---

## 🎯 How It Works

**Video Generation Flow:**
```
User clicks story in StoryTime
     ↓
Terminal detects TSVAVATAR_MODE=true
     ↓
Fetches character image from your mapping
     ↓
Sends to TSVAvatarGenerator API:
  - Image
  - Story text (narration)
  - Character voice ID
  - Duration (10 seconds)
     ↓
TSVAvatarGenerator generates video:
  - Uses RunwayML for animation
  - Uses ElevenLabs for voice
  - Merges audio + video
     ↓
Returns task_id
     ↓
Terminal polls for status
     ↓
Video plays in StoryTime UI
```

---

## 🔧 Testing Your Setup

1. **Check Mode Status:**
```bash
curl http://localhost:8001/api/storytime/test-mode-status
```

Should return:
```json
{
  "mode": "tsvavatar",
  "message": "Using TSVAvatarGenerator service (your custom generator)",
  "tsvavatar_mode_enabled": true
}
```

2. **Test Video Generation:**
- Go to StoryTime in your terminal
- Select Binary
- Click any AITA story
- Watch for:
  - Green badge: "🤖 TSVAVATAR MODE"
  - Video generation starts
  - Progress updates (may take 2-10 minutes)
  - Video plays when complete

3. **Check Backend Logs:**
```bash
tail -f /var/log/supervisor/backend.*.log | grep TSVAVATAR
```

---

## 💡 Current Configuration

**Files Created/Modified:**
- `/app/backend/tsvavatar_integration.py` - Integration logic
- `/app/backend/storytime.py` - Routes to TSVAvatar
- `/app/backend/.env` - Configuration

**Mode Priority (in order):**
1. TEST MODE (`HEYGEN_TEST_MODE=true`) - Pre-recorded videos
2. **TSVAVATAR MODE** (`TSVAVATAR_MODE=true`) ← **YOU ARE HERE**
3. AUTOMATION MODE (`HEYGEN_AUTOMATION_MODE=true`) - Browser automation
4. API MODE (default) - HeyGen API

---

## ⚙️ Advanced Configuration

**Adjust Video Duration:**
Edit `/app/backend/storytime.py`, line ~90 and ~320:
```python
duration=10,  # Change to 5, 15, 30, etc. (max 300 seconds)
```

**Disable Voice Narration:**
```python
enable_audio=False  # Generates silent video
```

**Change Video Engine:**
Edit `/app/backend/tsvavatar_integration.py`, line ~95:
```python
"video_engine": "runwayml",  # Options: "runwayml", "deepvid_fast", "deepvid_quality"
```

---

## 🐛 Troubleshooting

### "Avatar not configured in TSVAvatarGen mapping"
- You haven't updated `AVATAR_IMAGE_MAPPING` in `tsvavatar_integration.py`
- Add your character image URLs

### "Failed to fetch avatar image"
- Image URL is incorrect or inaccessible
- Make sure images are publicly accessible
- Try accessing the URL in your browser

### "TSVAvatarGen API error"
- Check API keys are correct in `.env`
- Verify TSVAvatarGenerator service is running at https://lipsync-creator-3.emergent.host/
- Check you have sufficient credits (RunwayML, ElevenLabs)

### Videos take too long
- First video: 2-10 minutes (normal for RunwayML)
- Reduce duration to 5 seconds for testing
- Check RunwayML dashboard for queue status

### TSVAvatar fallback to test mode
- If TSVAvatar fails, system automatically uses pre-recorded test videos
- Check logs to see why it failed
- Common causes: missing API keys, invalid image URLs, no credits

---

## 💰 Cost Estimation

**Per 10-second video:**
- RunwayML: ~$0.50
- ElevenLabs: ~$0.001
- **Total: ~$0.50 per video**

**Monthly estimate (if generating 100 videos/month):**
- RunwayML: ~$50
- ElevenLabs: ~$5 (or free tier)
- **Total: ~$50-55/month**

**Cost Saving Tips:**
- Use shorter durations (5 seconds instead of 10)
- Disable voice for non-critical content
- Use DeepVid Fast instead of RunwayML (cheaper but lower quality)

---

## 🎨 Character Images Best Practices

**Image Requirements:**
- Format: PNG, JPG, JPEG, GIF, WEBP
- Size: Under 10MB
- Resolution: 1024x1024 or higher recommended
- Background: Transparent or solid color
- Face: Clear, forward-facing
- Expression: Neutral (animation will add expressions)

**For Best Results:**
- High contrast
- Good lighting
- Clean edges
- Single character per image
- No text or watermarks

---

## 🚀 What's Next?

1. ✅ **You:** Add API keys to `.env`
2. ✅ **You:** Upload character images and update mapping
3. ✅ **You:** Restart backend
4. ✅ **Me (if needed):** Help debug any issues

Once setup is complete, **every StoryTime video will use your TSVAvatarGenerator** - no more HeyGen API, no more credits, just your own custom service!

---

**Current Status:**
- ✅ Integration code complete
- ⏳ Waiting for: API keys + character image URLs
- 🎯 Ready to generate videos once configured!
