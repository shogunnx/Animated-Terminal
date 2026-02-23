# TSV Terminal - Complete Feature Documentation

## Overview
TSV Terminal is an interactive AI-powered application featuring fictional characters. Users can generate AI outfits, create videos, play games, and interact with various character-based features.

---

## 1. DRESSING ROOM (`/dressing-room`)

### What It Does
Generate AI-powered outfit images for characters using Fal.ai's Flux models.

### Characters Available
| Character | ID | Description |
|-----------|-----|-------------|
| Victoria Black | `victoria_black` | Goddess-tier archive profile |
| Victoria Black Goddess | `victoria_black_goddess` | Divine elegance supreme |
| **Community OC** | `community_oc` | Upload YOUR own character (requires image upload) |
| Wargirl | `wargirl` | SSJ3 raid specialist |
| Binary | `binary` | Core reactor entity |
| Vanessa | `vanessa` | Pinup warrior suite |
| Harmony | `harmony` | Tech loft & fusion lab |
| Evil Victoria | `evil_victoria` | Forbidden chamber |
| Veronica | `veronica` | Human ally quarters |

### Features

#### Single Character Mode
- Select outfit items from dropdowns (tops, bottoms, shoes, accessories, etc.)
- OR write a **custom prompt** in the text area for full control
- 60+ art styles including:
  - Anime styles (Anime, Manga, Studio Ghibli, etc.)
  - **30 Realistic styles** (8K Ultra Realistic, Photorealistic, DSLR Photography, etc.)
- Backgrounds, poses, and positions

#### Pairs Mode
- Generate TWO characters together in ONE image
- Characters interact in the same scene
- Select activity (hugging, dancing, fighting, etc.)

#### Community OC (Custom Character)
- Upload ANY image as your base character
- System uses YOUR uploaded image for all generations
- **No pre-set base image** - you MUST upload first
- Uses higher strength (0.70) to allow outfit changes while preserving face

#### DeviantArt Integration
- Post generated outfits directly to DeviantArt
- Requires DeviantArt OAuth login

### How Generation Works
1. Base image (from Nexus, upload, or stored)
2. Your prompt/selections converted to text
3. Sent to Fal.ai `flux/dev/image-to-image` model
4. Settings:
   - Community OC: strength=0.70, guidance=6.0
   - Regular + hair/pose: strength=0.75, guidance=5.0
   - Regular outfit only: strength=0.55, guidance=3.5
5. Safety checker: **DISABLED** (uncensored output)

### Art Styles (60+)
**Anime/Cartoon:**
- Anime Style, Manga Style, Semi-Realistic Anime, Chibi, Kawaii
- Disney Style, Pixar 3D, Studio Ghibli, Makoto Shinkai
- Comic Book, Marvel Comics, DC Comics, Graphic Novel

**Realistic (30 styles):**
- 8K Ultra Realistic, 8K Photorealistic Portrait, 8K Cinematic
- 8K Fashion Photography, Cinema Quality 8K
- Hyperrealistic, Photorealistic, Ultra Realistic 4K
- DSLR Photography, Studio Portrait Photography
- Fashion Magazine Editorial, Vogue Cover Style
- High Fashion Photoshoot, Glamour Photography
- Beauty Photography, Professional Headshot
- Red Carpet Photography, Cinematic Film Still
- HDR Photography, RAW Photo Style
- Natural Light Portrait, Golden Hour Photography
- Dramatic Studio Lighting, Rembrandt Lighting
- High Key Photography, Low Key Photography
- Fine Art Photography, Editorial Beauty
- Realistic Digital Painting, Hyper Detailed Realistic

---

## 2. STORYTIME (`/storytime`)

### What It Does
Generate AI videos with characters narrating stories using HeyGen API.

### Features
- Multiple story categories
- AI-generated talking head videos
- Character voices and animations
- HeyGen credit tracking (displayed on homepage)

### Categories
- AITA from Reddit
- Custom stories
- Character narratives

---

## 3. TERMINAL ANALYTICS (`/terminal-analytics`)

### What It Does
Track usage statistics for the entire application.

### Metrics Tracked
- Page views (by page)
- Feature usage (what users interact with)
- Unique visitors (by IP address)
- Session tracking
- Fractured Power Game clicks

### Dashboard Shows
- Total page views
- Unique visitors
- Most popular pages
- Feature usage breakdown
- Visitor IP tracking (distinguish your visits from others)

---

## 4. GAME ROOM (`/game-room`)

### What It Does
Collection of mini-games and interactive experiences.

### Games Available
- Asteroids-style game
- Character interactions
- (More games planned)

### Fractured Power Game
- External +18 game link
- Click tracking in analytics
- Navigation button in header

---

## 5. HOME PAGE (`/`)

### Features
- Character showcase
- StoryTime credits remaining display
- Navigation to all sections
- Fractured Power Game section
- Terminal status

---

## 6. API ENDPOINTS

### Dressing Room
```
POST /api/dressing-room/generate     - Generate outfit image
POST /api/dressing-room/generate-pairs - Generate pairs image
GET  /api/dressing-room/has-base/{id} - Check if base image exists
GET  /api/dressing-room/get-base/{id} - Get stored base image
POST /api/dressing-room/track        - Track usage
```

### StoryTime
```
GET  /api/storytime/credit-status    - Get HeyGen credits remaining
POST /api/storytime/generate         - Generate video
```

### Analytics
```
POST /api/analytics/track            - Track an event
GET  /api/analytics/stats            - Get all statistics
GET  /api/analytics/visitors         - Get visitor data
```

### DeviantArt
```
GET  /api/deviantart/auth-url        - Get OAuth URL
GET  /api/deviantart/callback        - OAuth callback
POST /api/deviantart/post            - Post image to DeviantArt
GET  /api/deviantart/auth-status     - Check auth status
```

---

## 7. CONFIGURATION

### Environment Variables (Backend - `/app/backend/.env`)
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=app_db
FAL_KEY=your-fal-ai-key
HEYGEN_API_KEY=your-heygen-key
DEVIANTART_CLIENT_ID=your-client-id
DEVIANTART_CLIENT_SECRET=your-secret
NEXUS_BASE_URL=https://anime-terminal.emergent.host
```

### Vite Config (Frontend)
- Hot reload: DISABLED (production mode)
- Allowed hosts: emergentagent.com, emergent.host, emergentcf.cloud

---

## 8. DATABASE COLLECTIONS

### `terminal_events`
- session_id, event_type, details, timestamp, visitor_ip

### `dressing_room_events`
- Outfit generation tracking

### `base_images/`
- Stored character base images (filesystem)

---

## 9. KNOWN LIMITATIONS

### Image Generation
- **Face preservation vs outfit change tradeoff**: Higher strength = more outfit change but less face preservation
- Community OC uses 0.70 strength as balance
- Very dramatic changes (complete outfit overhaul) may alter face slightly

### Production Deployment
- Live URLs may serve cached versions
- Platform-level routing can cause API issues

---

## 10. FILE STRUCTURE

```
/app
├── backend/
│   ├── server.py              # Main FastAPI server
│   ├── dressing_room.py       # Outfit generation logic
│   ├── heygen_api.py          # HeyGen video API
│   ├── terminal_analytics.py  # Analytics tracking
│   ├── deviantart.py          # DeviantArt OAuth
│   ├── storytime.py           # Story generation
│   └── base_images/           # Stored character images
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── DressingRoom.jsx
│   │   │   ├── StoryTime.jsx
│   │   │   ├── Home.jsx
│   │   │   ├── TerminalAnalytics.jsx
│   │   │   └── GameRoom.jsx
│   │   ├── content/
│   │   │   └── tsvContent.js  # Character definitions
│   │   └── components/
│   │       └── Shell.jsx      # Main layout
│   └── vite.config.js
└── memory/
    └── PRD.md                 # Product requirements
```

---

## 11. THIRD-PARTY INTEGRATIONS

| Service | Purpose | Key Location |
|---------|---------|--------------|
| Fal.ai | Image generation | `FAL_KEY` in .env |
| HeyGen | Video generation | `HEYGEN_API_KEY` in .env |
| DeviantArt | Image posting | OAuth credentials in .env |
| MongoDB | Database | `MONGO_URL` in .env |

---

## 12. UPCOMING FEATURES (Backlog)

### P0 - High Priority
- [ ] Secret "Classified" Folder
- [ ] Gamify Game Room with Data Fragments

### P1 - Medium Priority
- [ ] Outfit Likes Counter
- [ ] Idle Terminal Messages
- [ ] Leaderboard

### P2 - Lower Priority
- [ ] Broadcast Mode (X/Twitter)
- [ ] Konami Code Easter Egg
- [ ] Relationship/Memory System
- [ ] Full Games Implementation
- [ ] Parallax Effect
