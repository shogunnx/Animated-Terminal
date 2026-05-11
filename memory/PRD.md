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
- Standard generation via `fal-ai/flux-pro/kontext`
- Pairs Mode via `fal-ai/flux-2-pro/edit`
- Categorized TryOn: Dress / Top / Bottom / Shoes / Accessories (FASHN v1.6 + FLUX Kontext Max hybrid)
- Headshot mode (4 variations)
- Foot-to-Head mode (5 progression shots)
- Community OC upload slot

### 2. StoryTime (`/storytime`)
- HeyGen talking-photo video generation
- Multiple story categories
- Q&A flow with character lore + LLM rewrite
- Credit display

### 3. Terminal Analytics, Game Room, External Service Integrations (Nexus, GirlsMind, DeviantArt OAuth + RSS)

## Key API Endpoints
- `POST /api/dressing-room/generate | tryon | headshot | foot-to-head`
- `POST /api/storytime/generate-narrated | qa`
- `GET /api/storytime/status/{video_id} | credit-status | dynamic-content | video-history`
- `GET /api/status`

## Recent Changes

### Feb 11, 2026 — PER-CHARACTER HEYGEN FACE OVERRIDE
- **Why**: VixenVictoria's video was showing Evil Victoria's face because they share an avatar_id (intentional — for the shared deep sensual voice). User wants distinct face.
- **HeyGen API auto-upload blocked**: `POST /v1/talking_photo` returned "exceeded limit of 3 photo avatars" — this account has a per-period upload quota that's already used.
- **Solution**: Manual paste flow at `/admin/voices`:
  1. User creates the Photo Avatar inside HeyGen's dashboard (app.heygen.com/avatars)
  2. Copies the resulting `talking_photo_id`
  3. Pastes it into the new "📸 CHARACTER FACE" section on `/admin/voices`
- **Backend**:
  - New MongoDB collection `character_avatar_overrides` keyed by `character_id`
  - `POST /api/storytime/character-avatars/set` — upsert manually
  - `POST /api/storytime/talking-photo/upload` — auto-upload (currently blocked by HeyGen quota; ready when quota frees)
  - `GET /api/storytime/character-avatars` — list all overrides
  - `DELETE /api/storytime/character-avatars/{character_id}` — clear an override
- **Frontend**:
  - StoryTime now fetches overrides on mount and uses `characterAvatarOverrides[selectedNarrator] ?? AVATARS[selectedNarrator].id` as the avatar_id for both Q&A and story generation
  - New admin section in `/admin/voices` with paste-input rows for VixenVictoria + 6 other characters
- **Bonus**: `heygen_api.upload_talking_photo_from_url()` is implemented and tested (downloads source image, POSTs raw bytes with correct Content-Type to HeyGen) — works the moment the HeyGen quota refreshes or the user upgrades their plan.

### Feb 11, 2026 — VIXENVICTORIA'S ARCHIVE WIDGET
- New rotating daily-blurb widget mounted at the top of `/storytime`
- Backend `vixen_archive.py`: 20 curated paragraphs in VixenVictoria's voice (in-lore: Nexus spire, Sadala, Classified chamber outer vestibule, Goddess Vanessa's first temple, Veronica's childhood garden, Wargirl's arcade, Harmony's first lab, Binary's cradle, Fusion Door, Sands of Time Page 7 + real-world: Pompeii, Library of Alexandria, Aleppo souq, Notre-Dame, Palmyra, Hagia Sophia, Lighthouse of Alexandria, Buddhas of Bamiyan, Roman Baths of Caracalla, Detroit Michigan Central)
- Endpoint `GET /api/storytime/vixen-archive/today` rotates deterministically by day-of-year (everyone sees the same entry today, refreshes at midnight without a cron)
- Endpoint `GET /api/storytime/vixen-archive/{index}` for prev/next browsing
- Frontend `VixenArchiveWidget.jsx` with ‹ · TODAY · › navigation, soft silver/lilac aesthetic matching VixenVictoria's accent color, fails silently if backend unavailable (won't break the page)
- Verified: widget renders, today's entry is *Buddhas of Bamiyan / March 2001*, NEXT button advances to *Veronica's Childhood Garden*

### Feb 11, 2026 — NEW HOST: VIXENVICTORIA
- Added **VixenVictoria** as a new StoryTime narrator in the slot previously occupied by the broken-image Victoria Black Blaster card
- Portrait: user-provided artifact (silver curls, gold halter, willow tree backdrop)
- Voice: reuses Evil Victoria's HeyGen avatar (`738db1645bc140beb1b476231a8b79f4` → voice `d74c1480d47e457d9181cb0b61d56eb0`) so she shares the deep sensual voice as requested
- Personality (in `storytime_qa.CHARACTER_LORE['vixen_victoria']`): calm, distracted, deeply human-feeling, vast librarian-like knowledge, husky pauses, **aphrodisiac for nostalgia / decayed ruins / past destruction of sacred memories & landmarks**. Signature speech patterns like *"Mmm... I remember that one."* and *"funny, isn't it, how the most sacred places fall the softest..."*
- Lore-grounded via her existing VixenVictoria wiki page (5'11", softly curvy, etc.)
- Verified Q&A: asked "Tell me about a place you miss" → answered with abandoned-amusement-park imagery, chipped carousel horses, dusk light, scent of old popcorn, mid-thought trail-offs. Sources pill includes VixenVictoria first.

### Feb 11, 2026 — Q&A INTERNAL HTTP BUG FIXED
- **Bug**: Production Q&A on Railway failed with `"Failed to generate Q&A response: ... All connection attempts failed"` even though the LLM text generation succeeded. Root cause: `create_qa_video()` was doing an internal HTTP POST to `http://127.0.0.1:8001/api/storytime/generate-narrated`, but Railway containers don't allow loopback to the same service port.
- **Fix**: Replaced the internal HTTP call with a direct in-process function call to `_generate_video_with_voice_fallback()` using the resolved voice_id chain. Faster, no httpx, no port assumptions.
- **Graceful HeyGen failure**: When HeyGen rejects the video (credits/voice/etc), `create_qa_video()` now returns `success: True` with `video_id: None` and `heygen_error: "..."`, so the frontend's text+TTS+sources fallback panel still renders the lore-grounded answer.
- Verified: "how tall is VixenVictoria" → lore-grounded answer (5'11" per VixenVictoria wiki page) with 4 source pills.

### Feb 11, 2026 — VOICE PICKER ADMIN PAGE
- New page **`/admin/voices`** (linked from a 🎙️ VOICES button in the StoryTime header)
- Backend: `voice_mapping.py` — MongoDB-backed persistent avatar→voice overrides, in-process 30s cache so production reads are cheap
- New endpoints:
  - `GET /api/storytime/voices/list` — all 2400+ voices from your HeyGen account
  - `GET /api/storytime/voices/mappings` — current overrides + hardcoded defaults + known-dead voice IDs
  - `POST /api/storytime/voices/mappings` — upsert avatar→voice
  - `DELETE /api/storytime/voices/mappings/{avatar_id}` — remove override
- Resolution chain in `storytime.py._resolve_voice_id`: **DB override → hardcoded mapping → default**
- Voice fallback helper now also catches **"failed to process"** (broken voice clones) in addition to "not found / invalid voice"
- UI features: per-row search across 2400 voices, preview-audio play button, save/reset controls, prominent **DEAD — falls back to default** red badge on rows whose hardcoded voice is in `KNOWN_INVALID_VOICE_IDS`
- Verified end-to-end: list → search → save override → next generation uses override → broken clone triggers auto-fallback → delete override → resolution falls back to hardcoded

### Feb 11, 2026 — VOICE-ID FALLBACK
- HeyGen rejected Vanessa's voice (`6fa2fa767bf148fc939c0bbba7306760` → "Voice not found"), blocking story generation for Vanessa narrator.
- New `_generate_video_with_voice_fallback()` in `storytime.py`: catches "Voice not found / Invalid voice_id" errors and retries once with `DEFAULT_VOICE_ID`. Maintains a process-level `KNOWN_INVALID_VOICE_IDS` cache pre-seeded with Vanessa + Wargirl IDs so the first attempt for those characters skips the dead voice entirely.
- Both story and narrated-story endpoints route through the helper.
- Verified: Vanessa + Wargirl narrators now return 200 with video_id on first call.

### Feb 11, 2026 — DIRECT OPENAI + SOURCE ATTRIBUTION
- **Direct OpenAI primary path**: `storytime_qa.py` now uses `openai.AsyncOpenAI` with `OPENAI_API_KEY` (works on any host, including Railway). Falls back to `EMERGENT_LLM_KEY` only when `OPENAI_API_KEY` is not set or the direct call fails. Verified locally — gpt-4o answers Q&A in ~6s.
- **Source attribution UI**: `/api/storytime/qa` now returns a `sources: [{title, url}]` array — the top 4 lore wiki pages used to ground the answer. Frontend renders them as pill-style links under both the fallback panel (`[data-testid='qa-fallback-sources']`) and the success card (`[data-testid='qa-response-sources']`). Every Q&A doubles as a wiki SEO funnel — fans can click straight through to the canonical pages.

### Feb 11, 2026 — LORE-GROUNDED Q&A (RAG)
- New `/app/backend/lore_wiki.py` — scrapes all 56 pages from the official **TheSaiyanVictoria Fandom Wiki** (`thesaiyanvictoria-universe.fandom.com`) via MediaWiki `action=parse`, strips HTML to plain text, stores in MongoDB collection `lore_wiki_pages`
- `storytime_qa.py` — `generate_character_response()` now calls `build_lore_context(question, character_name)` which retrieves the top 4 most relevant pages via weighted keyword scoring (title hits worth 100×, content frequency 1×) and injects them as authoritative system context. LLM is instructed to answer STRICTLY from these excerpts and flag any speculation explicitly.
- New admin endpoints:
  - `POST /api/storytime/lore/refresh` — force re-scrape (call after wiki edits)
  - `GET /api/storytime/lore/status` — cache size
  - `GET /api/storytime/lore/search?q=...&character=...` — diagnostic retrieval preview
- Cache auto-primes on backend startup
- Verified: "Where did Binary come from?" now returns the canon answer — Vegeta deal, Super Saiyan God Vegeta battle, Merged Zamasu extraction, nuclear-powered evolved form — pulled directly from the Binary wiki page. No more fabrication.

### Feb 11, 2026 — GRACEFUL Q&A FALLBACK CHAIN
- **New behavior**: When user asks a Q&A question, the flow now degrades gracefully:
  1. Try HeyGen video (existing)
  2. If HeyGen status='failed' (commonly: 0 credits) OR credits already low → trigger Web Speech API TTS to read the AI text response aloud, with full text shown in the video space
  3. If TTS unavailable in browser → just show the formatted text response
- New `triggerQAFallback()` helper, `qaFallback` state, and a styled `[data-testid='qa-fallback-panel']` UI block in the video area
- Bonus fix: `QARequest.video_url` was `str = None` (Pydantic v2 rejects null) → now `Optional[str] = None`
- Bonus fix: Added a "GENERATING Q&A RESPONSE..." loading state in the main video area (was previously empty during polling)

### Feb 11, 2026 — CRITICAL CORS + URL FIXES (continued)
- **Bug: `[object Object]` alert on Q&A** — frontend passed Pydantic/error objects to `new Error()` which renders as `[object Object]`.
- **Fix**: Added `formatErrorDetail()` helper in StoryTime.jsx that handles strings, Pydantic arrays, generic objects, and recognizes two known cases:
  1. `FREE_USER_EXTERNAL_ACCESS_DENIED` → "AI text key blocked: your Emergent Universal Key is free-tier and can't be used outside Emergent. Add a direct OPENAI_API_KEY on Railway, or upgrade your Emergent plan."
  2. `Insufficient credit` → "HeyGen credits are exhausted. Please top up your HeyGen account."
- Backend `storytime_qa.py` now also surfaces the FREE_USER message cleanly instead of the long litellm trace.
- ⚠️ **Root cause of Q&A failure on Railway**: `EMERGENT_LLM_KEY` is on the free tier — Emergent's gateway blocks external (non-Emergent-platform) calls. Two fix paths for the user:
  1. Upgrade Emergent plan (universal key works everywhere)
  2. Add a direct `OPENAI_API_KEY` on Railway and switch `storytime_qa.py` to use it directly

### Feb 11, 2026 — CRITICAL CORS + URL FIXES
- **Bug: "The string did not match the expected pattern"** in StoryTime — root cause: frontend (Cloudflare Pages) was calling relative `/api/*` paths which Cloudflare served as static index.html (POST=405 with empty body). iOS Safari throws this exact error when parsing empty body as JSON.
- **Fix 1**: Updated `StoryTime.jsx`, `Home.jsx`, `TeachMode.jsx`, `DressingRoomAnalytics.jsx`, `RelationshipPanel.jsx`, and `lib/api.js` to use `${VITE_BACKEND_URL}/api/...` (matching the pattern already used in DressingRoom.jsx).
- **Fix 2**: Backend `server.py` CORS — `allow_credentials=True` combined with `allow_origins=["*"]` was silently breaking CORS (FastAPI/Starlette refuses to send `Access-Control-Allow-Origin: *` with credentials). Now auto-disables credentials when origins is wildcard.
- **Fix 3**: StoryTime polling now surfaces "HeyGen credits exhausted" message instead of generic "Video generation failed" when HeyGen returns insufficient credit error.
- ⚠️ **HeyGen credits = 0 on Railway** — user needs to top up HeyGen account; otherwise generation requests are accepted but final video status will be `failed` with "Insufficient credit".

### Feb 10, 2026
- Verified all production endpoints (status indicators GREEN, generate, headshot 4-var ~49s, foot-to-head 5-shot ~43s).

### Feb 9-10, 2026 (previous fork)
- Migrated env vars `REACT_APP_` → `VITE_`
- Implemented categorized TryOn, Headshot, Foot-to-Head modes

## Project Health (Feb 11, 2026)
- ✅ Cloudflare/Railway deployments
- ✅ Fal.ai image generation (all modes)
- ✅ Status indicators (Nexus / GirlsMind / DeviantArt)
- ⚠️ HeyGen credits exhausted — generation requests will fail until top-up
- ✅ Code now correctly handles cross-origin Cloudflare↔Railway calls

## Backlog / Future Tasks

### P0 (High Priority)
- [ ] **Top-up HeyGen account** to restore StoryTime/Q&A video generation
- [ ] **Deploy fix to Railway + Cloudflare Pages** (frontend rebuild + backend restart)
- [ ] Implement Secret "Classified" Folder UI (UnlockTracker already wired)
- [ ] Gamify Game Room with Data Fragments
- [ ] Fix invalid HeyGen voice IDs for Wargirl (`1a9bfb4ec9bc43d59ab64a4e66fe467c`) and Vanessa (`6fa2fa767bf148fc939c0bbba7306760`) — both currently return "Voice not found"
- [ ] Fix invalid HeyGen avatar IDs for Victoria Black Blaster (`1992da07-...`) and Victoria Black Goddess (`1afb71c7-...`) — both UUIDs return "avatar look not found"

### P1
- [ ] Outfit Likes counter surfacing
- [ ] Idle Terminal Messages
- [ ] Leaderboard

### P2
- [ ] Broadcast Mode (X/Twitter)
- [ ] Konami Code Easter Egg
- [ ] Activate Relationship/Memory System (requires GirlsMind API)
- [ ] Implement Full Games
- [ ] Parallax Effect

### Refactoring
- [ ] Split `dressing_room.py` (1002 lines) into `generators/`
- [ ] Split `DressingRoom.jsx` (2050 lines) into smaller components
- [ ] Move backend routes from `server.py` into `/app/backend/routes/`

## Known Issues
- HeyGen credits exhausted (P0)
- Some HeyGen avatar/voice IDs invalid in `AVATARS` map (StoryTime.jsx)
- StoryTime AITA stories don't expand correctly (minor UI)
