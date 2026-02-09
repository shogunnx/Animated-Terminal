# TSV Terminal - Product Requirements Document

## Original Problem Statement
The TSV Terminal is a full-stack React/FastAPI application featuring multiple interactive modules centered around fictional characters. Key features include a Dressing Room (AI-generated outfit images), StoryTime (video generation with HeyGen), Terminal Analytics, and Game Room.

## Core Features Implemented

### 1. Dressing Room
- AI-generated outfit images using Fal.ai (flux models)
- Pairs Mode: Generate two characters in a single cohesive scene using `fal-ai/flux-2-pro/edit`
- Character selection with base image management
- DeviantArt integration for posting generated outfits
- **Community OC**: Upload your own character option (NEW - Feb 9, 2026)

### 2. StoryTime
- Video generation using HeyGen API (talking photo)
- Multiple story categories
- Credit display on homepage

### 3. Terminal Analytics
- Page view tracking
- Feature usage tracking
- IP-based visitor tracking
- Admin dashboard at `/terminal-analytics`

### 4. Fractured Power Game
- External game link with click tracking
- Navigation button in Shell component

## Character Roster (Dressing Room)
1. Victoria Black - Goddess-tier archive profile
2. Victoria Black Goddess - Divine elegance supreme
3. **Community OC** - Upload your own character (NEW)
4. Wargirl - SSJ3 raid specialist
5. Binary - Core reactor entity
6. Vanessa - Pinup warrior suite
7. Harmony - Tech loft & fusion lab
8. Evil Victoria - Forbidden chamber
9. Veronica - Human ally quarters

**Removed**: Victoria Black Blaster (replaced with Community OC)

## Tech Stack
- Frontend: React + Vite
- Backend: FastAPI
- Database: MongoDB
- Image Generation: Fal.ai (flux-2-pro/edit, flux/dev)
- Video Generation: HeyGen API
- Auth: DeviantArt OAuth2

## Key Files
- `/app/frontend/src/pages/DressingRoom.jsx` - Main dressing room UI
- `/app/frontend/src/content/tsvContent.js` - Character definitions
- `/app/backend/dressing_room.py` - Image generation logic
- `/app/backend/heygen_api.py` - HeyGen integration
- `/app/backend/terminal_analytics.py` - Analytics system
- `/app/backend/server.py` - Main FastAPI server

## Recent Changes (Feb 9, 2026)
- Removed "Victoria Black Blaster" character
- Added "Community OC" character with upload requirement
- Updated CHARACTER_APPEARANCES in backend
- Enhanced UI for upload-required characters

## Backlog / Future Tasks

### P0 (High Priority)
- [ ] Implement Secret "Classified" Folder
- [ ] Gamify Game Room with Data Fragments

### P1 (Medium Priority)
- [ ] Add "Outfit Likes" Counter
- [ ] Add Idle Terminal Messages
- [ ] Add Leaderboard

### P2 (Lower Priority)
- [ ] Add "Broadcast Mode" (X/Twitter integration)
- [ ] Add Konami Code Easter Egg
- [ ] Activate Relationship/Memory System (requires GirlsMind API)
- [ ] Implement Full Games
- [ ] Implement Parallax Effect

## Known Issues
- Production URLs (thesaiyanvictoria.com, nexus-multiverse.emergent.host) may serve cached versions
- Minor UI bug in StoryTime.jsx - AITA stories don't expand correctly

## 3rd Party Integrations
- Fal.ai (Image Generation) - User API Key required
- HeyGen (Video Generation) - User API Key in .env
- DeviantArt (Image Posting) - OAuth2 with Client ID/Secret
- MongoDB (Database) - localhost:27017
- Emergent LLM Key - For personality text generation
