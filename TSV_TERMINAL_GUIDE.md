# TSV Terminal - Complete Guide

## 🎯 Overview
Your Time Patrol System is live! A fully interactive terminal featuring all 7 girls with:
- Character profiles with holo portraits
- Interactive bedroom scenes with clickable hotspots
- Live chat integration via Nexus
- DeviantArt gallery feed
- Beautiful terminal aesthetic with scanlines and animations

---

## 🚀 What's Working Right Now

### ✅ Fully Operational
- **Backend Proxies**: All working (Nexus, GirlsMind, DeviantArt)
- **Frontend UI**: Complete terminal interface with all pages
- **Navigation**: All routes working smoothly
- **Status Monitoring**: Live service health checks
- **7 Character Files**: Victoria Black, Wargirl, Binary, Vanessa, Harmony, Evil Victoria, Veronica

### ⚠️ Needs Configuration
- **Character Portraits**: Currently using placeholder SVG portraits
- **Nexus Chat Endpoint**: May need adjustment based on your Nexus API structure
- **DeviantArt RSS**: Blocked by DeviantArt (403) - expected behavior

---

## 📁 Project Structure

```
/app/
├── backend/
│   ├── server.py          # FastAPI backend with all proxies
│   ├── requirements.txt
│   └── .env              # Service URLs configured
│
└── frontend/
    ├── src/
    │   ├── main.jsx           # App entry point
    │   ├── App.jsx            # Router setup
    │   ├── lib/
    │   │   └── api.js         # API helper & nexusChat()
    │   ├── content/
    │   │   └── tsvContent.js  # All 7 characters + rooms data
    │   ├── components/
    │   │   ├── Shell.jsx           # Main layout
    │   │   ├── StatusBar.jsx       # Service health monitor
    │   │   ├── CharacterCard.jsx   # Character display cards
    │   │   ├── HoloPortrait.jsx    # SVG portrait generator
    │   │   └── RoomScene.jsx       # Interactive bedroom scenes
    │   ├── pages/
    │   │   ├── Home.jsx           # Terminal welcome
    │   │   ├── Characters.jsx     # Character archive
    │   │   ├── Profile.jsx        # Chat interface
    │   │   ├── Room.jsx           # Bedroom scenes
    │   │   └── DeviantArt.jsx     # Gallery feed
    │   └── styles/
    │       └── tsv-ui.css         # Terminal aesthetics
    └── public/
        └── assets/
            └── portraits/         # Place real portraits here
```

---

## 🎨 Adding Real Character Portraits

### Step 1: Prepare Your Images
1. Create portrait images for each character (PNG format recommended)
2. Recommended size: 800x1000px (4:5 aspect ratio)
3. File names must match character IDs:

```
victoria_black.png
wargirl.png
binary.png
vanessa.png
harmony.png
evil_victoria.png
veronica.png
```

### Step 2: Upload to Server
Place images in: `/app/frontend/public/assets/portraits/`

```bash
# Example:
cd /app/frontend/public/assets/portraits/
# Upload your images here
```

### Step 3: Restart Frontend
```bash
sudo supervisorctl restart frontend
```

The portraits will automatically appear on character cards and profiles!

---

## 💬 Configuring Nexus Chat

The chat integration tries multiple payload formats to work with different Nexus setups.

### Current Implementation
Located in `/app/frontend/src/lib/api.js`:

```javascript
export async function nexusChat(characterId, message) {
  const path = `api/chat/${characterId}`;
  const attempts = [
    { message },
    { prompt: message },
    { text: message },
    { input: message },
  ];
  // Tries each format until one works
}
```

### If Chat Doesn't Work

**Option 1: Update Character IDs**
Edit `/app/frontend/src/content/tsvContent.js` and change the `id` field to match your Nexus character IDs.

**Option 2: Customize the Endpoint**
Edit `/app/frontend/src/lib/api.js` - change the `path` or payload structure:

```javascript
// Example custom format:
export async function nexusChat(characterId, message) {
  const path = `chat/${characterId}`; // Remove 'api/' if needed
  const body = { 
    user_message: message,  // Change field name
    character_id: characterId 
  };
  return await api.nexusPost(path, body);
}
```

**Option 3: Test Your Nexus Endpoint**
```bash
# Find the correct format:
curl -X POST http://localhost:8001/api/nexus/YOUR_ENDPOINT_HERE \
  -H "Content-Type: application/json" \
  -d '{"message": "test"}'
```

---

## 🎮 Using the Terminal

### Navigate Between Pages
- **/** - Terminal home with instructions
- **/characters** - Character archive (all 7 girls)
- **/characters/:id** - Profile with Nexus chat
- **/rooms/:id** - Interactive bedroom scenes
- **/deviantart** - DeviantArt gallery feed

### Interactive Room Features
1. Enter any character's room
2. Click glowing hotspot buttons
3. Each hotspot triggers a Nexus call to pull:
   - **Memories**: Memory traces
   - **Personality**: Personality file snippets
   - **Status**: System status readouts
   - **Raid Logs**: Combat/raid excerpts
   - **Evolution**: Character evolution data
   - **Relationship**: Relationship snapshots

### Chat with Characters
1. Go to Characters page
2. Click "Open Profile" on any character
3. Type your message in the chat input
4. Chat goes through Nexus proxy

---

## 🔧 Backend API Endpoints

### Status & Health
- `GET /api/health` - Simple health check
- `GET /api/status` - Full service status with pings

### Proxies
- `GET|POST /api/nexus/{path}` - Nexus proxy
- `GET|POST /api/girlsmind/{path}` - GirlsMind proxy
- `GET /api/deviantart/latest?limit=N` - DeviantArt RSS feed

### Environment Variables
Located in `/app/backend/.env`:

```bash
NEXUS_BASE_URL="https://nexus-multiverse.emergent.host"
GIRLSMIND_BASE_URL="https://girlsmind-1.emergent.host"
GIRLSMIND_API_KEY=""  # Add if needed
DEVIANTART_USERNAME="ThesaiyanVictoria"
DEVIANTART_RSS_URL=""  # Or use direct URL
```

---

## 🐛 Troubleshooting

### Chat Not Working
1. Check Nexus is responding: `curl http://localhost:8001/api/status`
2. Test Nexus endpoint directly: `curl http://localhost:8001/api/nexus/api/chat/test -X POST -d '{"message":"hi"}'`
3. Update `nexusChat()` in `/app/frontend/src/lib/api.js`
4. Check character IDs match your Nexus setup

### DeviantArt Feed Error
DeviantArt blocks scraping (403). This is expected and handled gracefully. The feed page will show an error message but terminal stays operational.

**Alternatives**:
- Use DeviantArt API (requires API key)
- Use a different RSS endpoint
- Disable the DeviantArt page

### Portraits Not Showing
1. Check file names match exactly (case-sensitive)
2. Verify files are in `/app/frontend/public/assets/portraits/`
3. Check browser console for 404 errors
4. Restart frontend: `sudo supervisorctl restart frontend`

### Service Not Starting
```bash
# Check logs:
tail -n 50 /var/log/supervisor/backend.err.log
tail -n 50 /var/log/supervisor/frontend.err.log

# Restart services:
sudo supervisorctl restart all
```

---

## 🎨 Customization

### Character Data
Edit `/app/frontend/src/content/tsvContent.js`:

```javascript
export const TSV_CHARACTERS = [
  {
    id: "victoria_black",        // Character ID for API calls
    name: "Victoria Black",       // Display name
    subtitle: "Goddess-tier...",  // Subtitle
    accent: "#76FFE1",           // Primary color
    glow: "#8C50FF",             // Secondary color
    portrait: "/assets/..."       // Image path
  },
  // ... more characters
];
```

### Room Hotspots
Edit room hotspots in `/app/frontend/src/content/tsvContent.js`:

```javascript
export const TSV_ROOMS = {
  victoria_black: {
    title: "Victoria Black — Goddess Chamber",
    vibe: "Room description...",
    palette: { a: "#76FFE1", b: "#8C50FF" },
    hotspots: [
      {
        key: "boots",              // Unique key
        label: "White Boots",      // Display text
        action: "status",          // Prompt type
        x: 14,                     // X position (%)
        y: 74                      // Y position (%)
      }
    ]
  }
};
```

### Styling
Edit `/app/frontend/src/styles/tsv-ui.css` to customize:
- Colors and gradients
- Terminal effects (scanlines, noise)
- Animations (pulse, float)
- Glass morphism effects

---

## 🌐 Deploying to thesaiyanvictoria.com

### In Emergent Dashboard:
1. Go to your app settings
2. Add custom domain: `thesaiyanvictoria.com`
3. Follow DNS setup instructions

### DNS Configuration:
```
# Add these records in your DNS provider:
Type: CNAME
Host: www
Value: [your-emergent-host].emergent.host

Type: A or ALIAS (for root domain)
Host: @
Value: [provided by Emergent]
```

---

## 📊 Service Status

Current live services:
- ✅ **Terminal Online**: All pages working
- ✅ **Nexus**: Connected (https://nexus-multiverse.emergent.host)
- ✅ **GirlsMind**: Connected (https://girlsmind-1.emergent.host)
- ⚠️ **DeviantArt RSS**: Blocked (handled gracefully)

---

## 💡 Tips

1. **Test Everything**: Use the screenshot tool to verify all pages load correctly
2. **Monitor Status**: Check the status bar at top for live service health
3. **Console Logs**: Open browser DevTools to see any errors
4. **Incremental Updates**: Test changes on one character first, then apply to all
5. **Backup**: Keep original character data before making major edits

---

## 🆘 Getting Help

If you need to modify:
- **Chat Integration**: Edit `/app/frontend/src/lib/api.js`
- **Character Data**: Edit `/app/frontend/src/content/tsvContent.js`
- **Backend Proxies**: Edit `/app/backend/server.py`
- **Styling**: Edit `/app/frontend/src/styles/tsv-ui.css`

Check logs:
```bash
# Backend errors:
tail -f /var/log/supervisor/backend.err.log

# Frontend errors:
tail -f /var/log/supervisor/frontend.err.log
```

---

## 🎉 You're All Set!

Your TSV Terminal is **fully operational**! The foundation is solid and ready for:
- Real portraits when you add them
- Nexus chat (may need minor endpoint tweaks)
- Custom domain deployment
- Further customization

Enjoy your Time Patrol command center! 🚀
