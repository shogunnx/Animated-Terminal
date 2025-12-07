# TSVAvatarGenerator Deployment & Integration Guide

## 🎯 Current Situation

### Two Separate Environments:

**1. Preview Environment** (Development)
- URL: `https://animpix.preview.emergentagent.com`
- Status: ✅ Working perfectly
- Avatars: 4 avatars with working images
- Database: Contains all latest data

**2. Deployment Environment** (Production)
- URL: `https://lipsync-creator-3.emergent.host`
- Status: ❌ Has outdated data
- Avatars: 3 old avatars with broken images
- Database: Needs to be synced with preview

---

## 📊 Avatar Mapping

### Preview Environment (Current Working State):
| Character       | UUID Short | Full UUID                              | Status     |
|----------------|-----------|----------------------------------------|------------|
| Binary         | 31b5ad65  | 31b5ad65-d654-4436-8cf1-163537df7bc5   | ✅ Working |
| Veronica       | bac2469c  | bac2469c-f5dd-411c-851c-0a76e1fb6ed8   | ✅ Working |
| Victoria Black | 829a9db9  | 829a9db9-c2fe-48ef-9436-5b81a8210ded   | ✅ Working |
| Evil Victoria  | 0a50b0ea  | 0a50b0ea-c111-47df-83c7-d17b8a5abad3   | ✅ Working |

### Deployment Environment (Outdated):
| Character      | UUID Short | Status           |
|---------------|-----------|------------------|
| Vanessa       | 0ed38b72  | ❌ Broken image  |
| Old Binary    | 9d2bce89  | ❌ Broken image  |
| Old Veronica  | f7adf7f6  | ❌ Broken image  |

---

## 🔧 Solution: Redeploy Application

### ⭐ Option 1: Redeploy (Recommended - Simple & Fast)

1. **Go to your Emergent dashboard**
2. **Click the "Deploy" button** for the TSVAvatarGenerator app
3. **Wait for deployment to complete** (usually 2-3 minutes)
4. **Verify** by visiting `https://lipsync-creator-3.emergent.host`

✅ **Result:** All 4 working avatars from preview will be live in production!

### Option 2: Manual Recreation (If Option 1 Fails)

If redeployment doesn't sync the avatars:

1. Visit `https://lipsync-creator-3.emergent.host`
2. Delete the 3 broken avatars (Vanessa, Old Binary, Old Veronica)
3. Re-upload the 4 avatar images using the "Create Avatar" button:
   - Binary
   - Veronica
   - Victoria Black
   - Evil Victoria

---

## 🎬 TSVTerminal Integration Status

### ✅ Integration Code - COMPLETED

The integration has been updated in `/app/backend/tsvavatar_integration.py`:

**Endpoint:** `/api/generate/system` (JSON endpoint)
**Authentication:** `X-System-Key: tsv-terminal-secure-key-2024`

**Avatar Mapping (HeyGen ID → TSVAvatar UUID):**
```python
AVATAR_CHARACTER_MAPPING = {
    # Binary
    "d8d16687495340c5805ad9821046be3a": "31b5ad65-d654-4436-8cf1-163537df7bc5",
    
    # Evil Victoria
    "738db1645bc140beb1b476231a8b79f4": "0a50b0ea-c111-47df-83c7-d17b8a5abad3",
    
    # Victoria Black
    "faa3f1fcdc0b49b79bb0a3fa11595754": "829a9db9-c2fe-48ef-9436-5b81a8210ded",
    
    # Veronica
    "bac2469c-f5dd-411c-851c-0a76e1fb6ed8": "bac2469c-f5dd-411c-851c-0a76e1fb6ed8",
}
```

**Request Payload:**
```json
{
  "character_name": "31b5ad65-d654-4436-8cf1-163537df7bc5",
  "audio_script": "Binary here! Watch me demonstrate my powers!",
  "duration": 10
}
```

**Expected Response:**
```json
{
  "task_id": "uuid-here",
  "status": "pending",
  "progress": 0.0
}
```

### Environment Variables (Already Set):
```bash
TSVAVATAR_BASE_URL=https://lipsync-creator-3.emergent.host
TSVAVATAR_MODE=true
TSVAVATAR_SYSTEM_KEY=tsv-terminal-secure-key-2024
```

---

## 🧪 Testing After Redeployment

### Step 1: Test API Directly
```bash
curl -X POST https://lipsync-creator-3.emergent.host/api/generate/system \
  -H "Content-Type: application/json" \
  -H "X-System-Key: tsv-terminal-secure-key-2024" \
  -d '{
    "character_name": "31b5ad65-d654-4436-8cf1-163537df7bc5",
    "audio_script": "I am Binary, the most powerful AI in existence! My computational abilities surpass anything you have ever seen.",
    "duration": 10
  }'
```

**Expected:** Should return `task_id` without errors

### Step 2: Test via TSVTerminal Backend
```bash
curl -X POST http://localhost:8001/api/storytime/generate-narrated \
  -H "Content-Type: application/json" \
  -d '{
    "avatar_id": "d8d16687495340c5805ad9821046be3a",
    "character_id": "binary",
    "character_name": "Binary",
    "story_text": "Binary was analyzing data patterns when she discovered an anomaly in the system.",
    "story_title": "Binary Investigation",
    "use_character_voice": false
  }'
```

**Expected:** Should return `task_id` from TSVAvatarGenerator

### Step 3: Check Video Status
```bash
curl https://lipsync-creator-3.emergent.host/api/status/<task_id>
```

**Expected Response:**
```json
{
  "task_id": "...",
  "status": "completed",
  "progress": 1.0,
  "final_video_url": "https://..."
}
```

---

## 📝 Why This Happened

- **Preview** and **Deployment** use **separate databases**
- Preview was updated with new avatars (31b5ad65, bac2469c, etc.)
- Deployment still has old avatar records (9d2bce89, 0ed38b72, etc.)
- Changes in preview don't automatically sync to deployment

---

## ✅ Next Steps

1. **Redeploy TSVAvatarGenerator** (click Deploy button)
2. **Wait 2-3 minutes** for deployment to complete
3. **Test the integration** using the curl commands above
4. **Verify from TSVTerminal** that video generation works end-to-end

---

## 🚀 Expected After Deployment

✅ Deployment URL will have all 4 working avatars
✅ Avatar thumbnails will display correctly
✅ Voice Library will be available
✅ System API for TSVTerminal will work
✅ Video generation will complete successfully

---

## 🆘 If Issues Persist

If after redeployment you still see broken avatars or errors:

1. Check deployment logs for errors
2. Verify avatar UUIDs match the mapping above
3. Test each avatar individually using curl
4. Consider manual recreation (Option 2)

---

**Status:** Integration code is ready. Waiting for TSVAvatarGenerator redeployment.
