# TSVAvatarGenerator Quick Setup (2 Steps)

## ✅ What's Done

Your Terminal is fully wired to send video generation requests to your TSVAvatarGenerator service at:
**https://lipsync-creator-3.emergent.host/**

Since your TSVAvatarGen already has RunwayML and ElevenLabs APIs configured, the Terminal just:
1. Relays character image + story script
2. Polls for completion
3. Plays the video

---

## 🎯 What You Need to Do (2 Steps)

### Step 1: Upload Character Images (30 min)

Upload your character portrait images to any public hosting:
- **Imgur** (easiest): https://imgur.com/upload
- **CloudFlare R2**
- **AWS S3**
- **Your own CDN**

You need images for:
- Evil Victoria
- Binary  
- Harmony
- Victoria Black
- Veronica
- Wargirl
- Vanessa
- Victoria Chaser

**Image Requirements:**
- Format: PNG or JPG
- Size: Under 10MB
- Resolution: 1024x1024 recommended
- Face: Clear, forward-facing
- Background: Any (transparent preferred)

**Example:**
Upload `evil-victoria.png` to Imgur → Get URL:
`https://i.imgur.com/abc123.png`

---

### Step 2: Update Image Mapping (5 min)

Edit `/app/backend/tsvavatar_integration.py` (lines 16-45):

```python
AVATAR_IMAGE_MAPPING = {
    # Evil Victoria
    "738db1645bc140beb1b476231a8b79f4": {
        "name": "Evil Victoria",
        "image_url": "https://i.imgur.com/your-image.png"  # ← PASTE YOUR URL HERE
    },
    # Binary
    "d8d16687495340c5805ad9821046be3a": {
        "name": "Binary",
        "image_url": "https://i.imgur.com/your-image.png"  # ← PASTE YOUR URL HERE
    },
    # Harmony
    "783e82f2b06948d5b2f882fa351337fd": {
        "name": "Harmony",
        "image_url": "https://i.imgur.com/your-image.png"  # ← PASTE YOUR URL HERE
    },
    # Victoria Black
    "faa3f1fcdc0b49b79bb0a3fa11595754": {
        "name": "Victoria Black",
        "image_url": "https://i.imgur.com/your-image.png"  # ← PASTE YOUR URL HERE
    },
    # Add other characters as needed...
}
```

Then:
```bash
# Enable TSVAvatar mode
echo "TSVAVATAR_MODE=true" >> /app/backend/.env

# Restart backend
sudo supervisorctl restart backend
```

---

## ✨ That's It!

**Test it:**
1. Go to StoryTime
2. Select Binary
3. Click any AITA story
4. Watch the Terminal send the request to your TSVAvatarGen
5. Video generates (2-10 minutes)
6. Video plays automatically

**Check Status:**
```bash
curl http://localhost:8001/api/storytime/test-mode-status
```

Should show:
```json
{
  "mode": "tsvavatar",
  "message": "Using TSVAvatarGenerator service (your custom generator)"
}
```

---

## 📊 What Gets Sent to TSVAvatarGen:

```json
{
  "image_data": "<base64_encoded_character_image>",
  "prompt_text": "Animate Binary speaking and narrating with natural expressions and lip sync",
  "video_engine": "runwayml",
  "voice_engine": "elevenlabs",
  "audio_script": "My grandmother left me everything in her will...",
  "duration": 10,
  "user_id": "storytime",
  "voice_id": "bdf61355b6744465a4f6060cbde19939"
}
```

**TSVAvatarGen Response:**
```json
{
  "task_id": "abc-123-def-456",
  "status": "processing"
}
```

**Terminal Polls:**
```
GET https://lipsync-creator-3.emergent.host/api/status/abc-123-def-456
```

**When Complete:**
```json
{
  "status": "completed",
  "video_url": "https://...",
  "progress": 100
}
```

---

## 🐛 Troubleshooting:

**"Avatar not configured"**
- You haven't added image URLs to `AVATAR_IMAGE_MAPPING`

**"Failed to fetch avatar image"**  
- Image URL is wrong or not public
- Test URL in browser first

**"TSVAvatarGen API error"**
- Your TSVAvatarGen service might be down
- Check: https://lipsync-creator-3.emergent.host/
- Verify RunwayML/ElevenLabs keys are configured on TSVAvatar side

**Videos take forever**
- First video: 2-10 minutes is normal for RunwayML
- Check your TSVAvatarGen dashboard for queue status

---

## 💡 Voice Mapping (Already Configured):

Each character already has a voice ID mapped:

- **Evil Victoria**: `d74c1480d47e457d9181cb0b61d56eb0`
- **Binary**: `bdf61355b6744465a4f6060cbde19939`
- **Harmony**: `a4272ae62e804b9d8660935d3df96459`
- **Victoria Black**: `1bd001e7e50f421d891986aad5158bc8`

These are automatically sent to your TSVAvatarGen service!

---

## 🎯 Current Status:

✅ **Integration**: 100% complete  
✅ **API routing**: Working  
✅ **Status polling**: Working  
✅ **Voice mapping**: Configured  
⏳ **Waiting for**: Character image URLs  

**Once you add image URLs:**
- Every StoryTime video routes to YOUR TSVAvatarGen
- No HeyGen API needed
- No HeyGen credits used
- Full control of video generation

---

**Ready to test?** Just add those image URLs and enable the mode! 🚀
