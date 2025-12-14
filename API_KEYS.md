# API Keys Reference

This document stores all API keys used in the application for easy reference.

## Image Generation

### FAL.AI (Dressing Room)
- **Service:** fal.ai image generation (FLUX.2 Edit model)
- **Current Key:** `dfd5e279-7559-4253-942c-f187af785896:bb6bf01fbea22745463f55b7f9efc1e7`
- **Location:** `/app/backend/.env` → `FAL_KEY`
- **Dashboard:** https://fal.ai/dashboard/keys
- **Used For:** Character outfit generation in Dressing Room

## LLM / Text Generation

### Emergent LLM Key (Universal)
- **Service:** Emergent universal key (OpenAI, Anthropic, Google)
- **Current Key:** `sk-emergent-3A6Ea89Ad00D72b461`
- **Location:** `/app/backend/.env` → `EMERGENT_LLM_KEY`
- **Used For:** 
  - Q&A text generation
  - Personality-infused responses
  - Story rewriting

## Video Generation

### TSVAvatarGenerator Service
- **Service:** Custom video generation service
- **Base URL:** `https://lipsync-creator-3.emergent.host`
- **System Key:** `tsv-terminal-secure-key-2024`
- **Location:** `/app/backend/.env` → `TSVAVATAR_SYSTEM_KEY`
- **Used For:** Full video generation (voice + lip-sync)

**External Dependencies (managed by TSVAvatarGenerator service):**
- ElevenLabs (Voice synthesis)
- Replicate (Video/lip-sync)

## Personality & Character Data

### Nexus API
- **Service:** Character personality database
- **Base URL:** `https://anime-terminal.emergent.host/`
- **Location:** `/app/backend/.env` → `NEXUS_BASE_URL`
- **Used For:** Fetching character personalities for Q&A

## Database

### MongoDB
- **Connection:** Managed by Emergent platform
- **Location:** `/app/backend/.env` → `MONGO_URL`
- **Database Name:** `tsv`

---

## Key Management Notes

1. **Never commit this file to public repos**
2. **Rotate keys periodically for security**
3. **Keep this file updated when keys change**
4. **Backup this file securely**

Last Updated: December 10, 2025
