# TSV Terminal - Product Requirements Document

## Original Problem Statement
The TSV Terminal is a full-stack React/FastAPI application featuring multiple interactive modules centered around fictional characters. Key features include a Dressing Room (AI-generated outfit images), StoryTime (video generation with HeyGen), Terminal Analytics, and Game Room.

## Tech Stack
- Frontend: React + Vite (env vars use `VITE_` prefix)
- Backend: FastAPI on Railway
- Frontend hosting: Cloudflare Pages
- Database: MongoDB
- Image Generation: Fal.ai (FLUX Kontext, FLUX 2 Pro Edit, FASHN v1.6)
- Video Generation: HeyGen API
- Auth: DeviantArt OAuth2

## Core Features Implemented

### 1. Dressing Room (`/dressing-room`)
- **Standard generation**: text-to-outfit with character identity preservation via `fal-ai/flux-pro/kontext`
- **Pairs Mode**: two characters in one cohesive scene via `fal-ai/flux-2-pro/edit`
- **Categorized TryOn**: Upload Dress / Top / Bottom / Shoes / Accessories — hybrid pipeline (FASHN v1.6 for clothing, FLUX Kontext Max multi-image for shoes/accessories)
- **Headshot mode**: 4 close-up portrait variations from base image
- **Foot-to-Head mode**: 5 sequential progression shots (shoes_feet → legs_knees → waist_hips → chest_bust → headshot)
- **Community OC**: Upload-your-own character slot

### 2. StoryTime (`/storytime`)
- HeyGen talking-photo video generation (verified working)
- Multiple story categories
- Credit display on homepage

### 3. Terminal Analytics (`/terminal-analytics`)
- Page view, feature usage, IP tracking

### 4. Game Room (`/gameroom`)
- Game grid + Coach/Rival/Date modes
- External Fractured Power link

### 5. External Service Integrations
- Nexus proxy (`/api/nexus/*`)
- GirlsMind proxy (`/api/girlsmind/*`)
- DeviantArt OAuth + RSS + posting

## Character Roster (Dressing Room)
1. Victoria Black, 2. Victoria Black Goddess, 3. Community OC,
4. Wargirl, 5. Binary, 6. Vanessa, 7. Harmony, 8. Evil Victoria, 9. Veronica

## Key Files
- `/app/frontend/src/pages/DressingRoom.jsx` - Main dressing room UI (1900+ lines, ripe for refactor)
- `/app/frontend/src/pages/StoryTime.jsx`
- `/app/frontend/src/components/Shell.jsx` & `StatusBar.jsx`
- `/app/backend/dressing_room.py` - All image generation pipelines
- `/app/backend/server.py` - API routes & external proxies
- `/app/backend/heygen_api.py` - HeyGen integration
- `/app/backend/storytime.py`

## Key API Endpoints
- `POST /api/dressing-room/generate` — standard outfit
- `POST /api/dressing-room/tryon` — categorized garment try-on
- `POST /api/dressing-room/headshot` — 4 headshot variations
- `POST /api/dressing-room/foot-to-head` — 5 progression shots
- `POST /api/dressing-room/save-base`, `GET /api/dressing-room/has-base/{id}`, `GET /api/dressing-room/get-base/{id}`
- `GET /api/status` — Nexus / GirlsMind / DeviantArt health
- `GET /api/storytime/generate-narrated`

## 3rd Party Integrations
- Fal.ai (Image Generation) — User API Key on Railway
- HeyGen (Video Generation) — User API Key on Railway
- DeviantArt (Image Posting) — OAuth2
- MongoDB (Database)
- Emergent LLM Key — Personality text generation

## Recent Changes

### Feb 10, 2026 (this session)
- Verified production end-to-end: status indicators all GREEN, image generation restored after Fal.ai top-up
- Verified `headshot` endpoint (4 variations, ~49s) and `foot-to-head` endpoint (5 shots, ~43s) on production
- TryOn endpoint validation confirmed
- No code changes — diagnostic verification session

### Feb 9-10, 2026 (previous fork)
- Migrated frontend env from `REACT_APP_` → `VITE_` (Cloudflare Pages compatibility)
- Standard outfit generation upgraded to `fal-ai/flux-pro/kontext`
- Implemented categorized TryOn (hybrid FASHN + FLUX Kontext Max)
- Implemented Headshot and Foot-to-Head modes
- Verified StoryTime HeyGen integration working

## Project Health (Feb 10, 2026)
- ✅ Cloudflare/Railway deployments
- ✅ HeyGen StoryTime
- ✅ Fal.ai image generation (all modes)
- ✅ Nexus / GirlsMind / DeviantArt status indicators

## Backlog / Future Tasks

### P0 (High Priority)
- [ ] Live UI smoke-test of TryOn / Headshot / Foot-to-Head (manual user verification)
- [ ] Implement Secret "Classified" Folder (partial — UnlockTracker exists, dedicated folder UI pending)
- [ ] Gamify Game Room with Data Fragments

### P1 (Medium Priority)
- [ ] Add "Outfit Likes" Counter (visual surfacing)
- [ ] Add Idle Terminal Messages
- [ ] Add Leaderboard

### P2 (Lower Priority)
- [ ] Add "Broadcast Mode" (X/Twitter integration)
- [ ] Add Konami Code Easter Egg
- [ ] Activate Relationship/Memory System (requires GirlsMind API)
- [ ] Implement Full Games (replace placeholders)
- [ ] Implement Parallax Effect

### Refactoring
- [ ] Split `dressing_room.py` (1000+ lines) into `generators/flux.py`, `generators/fashn.py`, `generators/kontext.py`
- [ ] Split `DressingRoom.jsx` (1900+ lines) into `TryOnPanel.jsx`, `HeadshotPanel.jsx`, `FootToHeadPanel.jsx`, `ResultGrid.jsx`
- [ ] Move backend routes from `server.py` into `/app/backend/routes/`

## Known Issues
- Production custom domain `thesaiyanvictoria.com` not DNS-resolvable from this container (works for end users; container has no DNS for that hostname)
- Minor UI bug in StoryTime.jsx — AITA stories don't expand correctly
