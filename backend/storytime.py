from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import httpx
import os
import logging
from lore_wiki import refresh_lore_cache, cached_page_count, search_lore
import voice_mapping

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/storytime", tags=["storytime"])

# Check if we should use HeyGen or TSVAvatar
USE_HEYGEN = os.getenv("HEYGEN_API_KEY", "") != ""

# Voice ID mappings for different avatars (HeyGen IDs)
AVATAR_VOICE_MAPPING = {
    # Evil Victoria - Main avatar
    '738db1645bc140beb1b476231a8b79f4': 'd74c1480d47e457d9181cb0b61d56eb0',
    # Evil Victoria - original individual ID (fallback)
    'd33267ddfad14fc2a8820f1d00eb713c': 'd74c1480d47e457d9181cb0b61d56eb0',
    # Evil Victoria Talking Head
    '94fd37e9ad0b42efb9d828edf5be22ee': 'd74c1480d47e457d9181cb0b61d56eb0',
    # Wargirl - updated voice ID
    'c8680d9549744019809f0acc04faac65': '1a9bfb4ec9bc43d59ab64a4e66fe467c',
    # Victoria Black - default avatar ID
    'faa3f1fcdc0b49b79bb0a3fa11595754': '1bd001e7e50f421d891986aad5158bc8',
    # Vanessa - custom voice ID
    'f81fa68314f84acb8fe6e527d90adc07': '6fa2fa767bf148fc939c0bbba7306760',
    # Binary - custom voice ID
    'd8d16687495340c5805ad9821046be3a': 'bdf61355b6744465a4f6060cbde19939',
    # Harmony - younger voice ID
    '783e82f2b06948d5b2f882fa351337fd': 'a4272ae62e804b9d8660935d3df96459',
}

# Default voice if avatar not in mapping
DEFAULT_VOICE_ID = '1bd001e7e50f421d891986aad5158bc8'

# Voices known to be invalid (HeyGen "Voice not found") — process-level cache so
# we only eat the failed-then-retry hop once per voice per backend lifetime.
# Pre-seeded with voices we've already confirmed are dead on HeyGen.
KNOWN_INVALID_VOICE_IDS = {
    '6fa2fa767bf148fc939c0bbba7306760',  # Vanessa (verified Feb 11 2026)
    '1a9bfb4ec9bc43d59ab64a4e66fe467c',  # Wargirl (verified Feb 11 2026)
}


def _resolve_voice_id(avatar_id: str) -> str:
    """Look up voice in priority order: DB override -> hardcoded mapping -> default."""
    return (
        voice_mapping.get_voice_for_avatar(avatar_id)
        or AVATAR_VOICE_MAPPING.get(avatar_id)
        or DEFAULT_VOICE_ID
    )


async def _generate_video_with_voice_fallback(
    *, avatar_id: str, script_text: str, voice_id: str, title: str, test_mode: bool = False
):
    """Call HeyGen with the configured voice. If HeyGen returns 'Voice not
    found' (a recurring issue with stale voice IDs in AVATAR_VOICE_MAPPING),
    retry once with DEFAULT_VOICE_ID and remember the bad voice."""
    from heygen_api import generate_video_heygen

    effective = DEFAULT_VOICE_ID if voice_id in KNOWN_INVALID_VOICE_IDS else voice_id

    result = await generate_video_heygen(
        avatar_id=avatar_id,
        script_text=script_text,
        voice_id=effective,
        title=title,
        test_mode=test_mode,
    )

    err = (result or {}).get("error", "") or ""
    err_lower = err.lower()
    is_voice_error = (
        not result.get("success")
        and "voice" in err_lower
        and (
            "not found" in err_lower
            or "invalid voice" in err_lower
            or "failed to process" in err_lower
        )
    )
    if is_voice_error and effective != DEFAULT_VOICE_ID:
        logger.warning(
            f"HeyGen rejected voice_id={effective} for avatar={avatar_id} "
            f"({err!r}); retrying with DEFAULT_VOICE_ID={DEFAULT_VOICE_ID}"
        )
        KNOWN_INVALID_VOICE_IDS.add(effective)
        result = await generate_video_heygen(
            avatar_id=avatar_id,
            script_text=script_text,
            voice_id=DEFAULT_VOICE_ID,
            title=title,
            test_mode=test_mode,
        )
    return result


class StoryGenerationRequest(BaseModel):
    avatar_id: str
    story_text: str
    story_title: str

class StoryGenerationResponse(BaseModel):
    video_url: str
    video_id: str
    status: str

class NarratedStoryRequest(BaseModel):
    avatar_id: str
    character_id: str
    character_name: str
    story_text: str
    story_title: str
    use_character_voice: bool = True

@router.post("/generate", response_model=StoryGenerationResponse)
async def generate_story_video(request: StoryGenerationRequest):
    """
    Generate a story video using HeyGen API
    """
    try:
        voice_id = _resolve_voice_id(request.avatar_id)

        logger.info(f"Generating video via HeyGen API for avatar {request.avatar_id}")
        result = await _generate_video_with_voice_fallback(
            avatar_id=request.avatar_id,
            script_text=request.story_text,
            voice_id=voice_id,
            title=request.story_title,
            test_mode=False,
        )
        
        if result["success"] and result.get("video_id"):
            return StoryGenerationResponse(
                video_url="",
                video_id=result["video_id"],
                status="processing"
            )
        else:
            raise HTTPException(
                status_code=500,
                detail=f"HeyGen API failed: {result.get('error', 'Unknown error')}"
            )
    except Exception as e:
        logger.error(f"Error generating story video: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

@router.get("/status/{video_id}")
async def check_video_status(video_id: str):
    """
    Check video generation status from HeyGen API
    """
    try:
        from heygen_api import check_video_status_heygen
        
        heygen_result = await check_video_status_heygen(video_id)
        
        # Return in standard format
        return {
            "data": {
                "video_id": video_id,
                "status": heygen_result.get("status", "processing"),
                "video_url": heygen_result.get("video_url", ""),
                "progress": heygen_result.get("progress", 0.0),
                "error": heygen_result.get("error")
            }
        }

    except Exception as e:
        logger.error(f"Error checking video status: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@router.post("/generate-narrated", response_model=StoryGenerationResponse)
async def generate_narrated_story_video(request: NarratedStoryRequest):
    """
    Generate a story video with in-character narration using HeyGen API
    Rewrites the story in the character's voice before generating video
    """
    try:
        # Rewrite story in character's voice if requested
        final_story_text = request.story_text
        if request.use_character_voice:
            try:
                from storytime_qa import rewrite_story_in_character_voice
                final_story_text = await rewrite_story_in_character_voice(
                    character_id=request.character_id,
                    character_name=request.character_name,
                    story_text=request.story_text,
                    story_title=request.story_title
                )
                logger.info(f"Story rewritten in {request.character_name}'s voice")
            except Exception as e:
                logger.warning(f"Character voice rewrite failed: {e}")

        voice_id = _resolve_voice_id(request.avatar_id)

        logger.info(f"Generating narrated video via HeyGen API for avatar {request.avatar_id}")
        result = await _generate_video_with_voice_fallback(
            avatar_id=request.avatar_id,
            script_text=final_story_text,
            voice_id=voice_id,
            title=request.story_title,
            test_mode=False,
        )
        
        if result["success"] and result.get("video_id"):
            return StoryGenerationResponse(
                video_url="",
                video_id=result["video_id"],
                status="processing"
            )
        else:
            raise HTTPException(
                status_code=500,
                detail=f"HeyGen API failed: {result.get('error', 'Unknown error')}"
            )
    
    except Exception as e:
        logger.error(f"Error generating narrated story video: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

class QARequest(BaseModel):
    character_id: str
    character_name: str
    avatar_id: str
    question: str
    video_url: Optional[str] = None  # Optional YouTube or video URL for analysis
    duration: int = 10  # Video duration in seconds (default 10)

@router.post("/qa")
async def generate_qa_response(request: QARequest):
    """
    Generate Q&A video response using character lore + AI (with optional video analysis)
    Now supports custom video duration for TSVAvatarGenerator
    """
    try:
        from storytime_qa import create_qa_video
        
        result = await create_qa_video(
            character_id=request.character_id,
            character_name=request.character_name,
            question=request.question,
            avatar_id=request.avatar_id,
            video_url=request.video_url,
            duration=request.duration
        )
        
        return {
            "success": True,
            "video_id": result["video_id"],
            "response_text": result["response_text"],
            "question": result["question"],
            "character_name": result["character_name"],
            "sources": result.get("sources", []),
        }
        
    except Exception as e:
        logger.error(f"Error generating Q&A response: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate Q&A response: {str(e)}"
        )


@router.get("/video-history")
async def get_video_history():
    """
    Fetch completed video history from TSVAvatarGenerator
    Returns list of all completed videos
    """
    try:
        tsvavatar_base_url = os.getenv("TSVAVATAR_BASE_URL", "https://lipsync-creator-3.emergent.host")
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{tsvavatar_base_url}/api/tasks")
            
            if response.status_code != 200:
                raise HTTPException(status_code=500, detail="Failed to fetch video history")
            
            data = response.json()
            tasks = data.get("tasks", [])
            
            # Filter only completed videos and format them
            completed_videos = []
            for task in tasks:
                if task.get("status") == "completed" and task.get("final_video_url"):
                    completed_videos.append({
                        "video_id": task.get("task_id"),
                        "video_url": task.get("final_video_url"),
                        "created_at": task.get("created_at"),
                        "character": task.get("ai_interpretation", {}).get("avatar_name", "Unknown"),
                        "script": task.get("ai_interpretation", {}).get("audio_script", ""),
                        "duration": task.get("ai_interpretation", {}).get("duration", 10)
                    })
            
            # Sort by created_at descending (newest first)
            completed_videos.sort(key=lambda x: x["created_at"], reverse=True)
            
            return {
                "success": True,
                "total_videos": len(completed_videos),
                "videos": completed_videos
            }
    
    except Exception as e:
        logger.error(f"Error fetching video history: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch video history: {str(e)}"
        )

@router.get("/dynamic-content")
async def get_dynamic_content():
    """
    Fetch dynamic content for StoryTime (AITA from Reddit + YouTube Storytimes)
    """
    try:
        from content_fetcher import fetch_all_dynamic_content
        
        content = await fetch_all_dynamic_content()
        
        return {
            "success": True,
            "content": content
        }
        
    except Exception as e:
        logger.error(f"Error fetching dynamic content: {str(e)}")
        # Return fallback content on error
        from content_fetcher import get_fallback_aita_content, get_fallback_youtube_content
        
        return {
            "success": True,
            "content": {
                "aita": get_fallback_aita_content(),
                "youtube": get_fallback_youtube_content()
            },
            "fallback": True
        }


@router.get("/test-mode-status")
async def get_test_mode_status():
    """
    Check current video generation mode - HeyGen API
    """
    return {
        "mode": "heygen",
        "message": "Using HeyGen API for AI video generation"
    }

@router.get("/credit-status")
async def get_credit_status():
    """
    Check HeyGen API credit status
    """
    try:
        from heygen_api import HEYGEN_API_KEY, get_headers, HEYGEN_API_BASE
        import httpx
        
        if not HEYGEN_API_KEY:
            return {
                "status": "error",
                "message": "HeyGen API key not configured",
                "credits_low": True
            }
        
        # Check remaining credits via HeyGen API v2
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{HEYGEN_API_BASE}/v2/user/remaining_quota",
                headers=get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Check if there's an error in the response
                if data.get("error"):
                    # API returned error, but we know the key works
                    return {
                        "status": "ok",
                        "message": "HeyGen API connected",
                        "credits_low": False,
                        "remaining_credits": "N/A"
                    }
                
                remaining = data.get("data", {}).get("remaining_quota", 0)
                details = data.get("data", {}).get("details", {})
                
                # Determine if credits are low (less than 50)
                credits_low = remaining < 50
                
                return {
                    "status": "low" if credits_low else "ok",
                    "message": f"HeyGen credits: {remaining}" if not credits_low else f"⚠️ LOW CREDITS: {remaining}",
                    "credits_low": credits_low,
                    "remaining_credits": remaining,
                    "details": details
                }
            else:
                return {
                    "status": "ok",
                    "message": "HeyGen API connected",
                    "credits_low": False
                }
                
    except Exception as e:
        return {
            "status": "ok",
            "message": "HeyGen API connected",
            "credits_low": False
        }



# ---------------------- Lore wiki (RAG) admin endpoints ----------------------

@router.post("/lore/refresh")
async def refresh_lore_endpoint():
    """Force-refresh the cached Fandom wiki lore. Call after wiki updates."""
    try:
        result = await refresh_lore_cache()
        return {"success": True, **result}
    except Exception as e:
        logger.exception("Lore refresh failed")
        raise HTTPException(status_code=500, detail=f"Lore refresh failed: {e}")


@router.get("/lore/status")
async def lore_status():
    """Number of cached lore pages — used to verify RAG is primed."""
    return {"cached_pages": cached_page_count()}


@router.get("/lore/search")
async def lore_search(q: str, character: str = "", top_n: int = 4):
    """Diagnostic: see which lore pages a question retrieves."""
    pages = search_lore(q, character, top_n=top_n)
    return {
        "query": q,
        "results": [
            {"title": p["title"], "url": p["url"], "preview": p["content"][:300]}
            for p in pages
        ],
    }



# ---------------------- Voice mapping admin endpoints ----------------------

class VoiceMappingUpsertRequest(BaseModel):
    avatar_id: str
    voice_id: str


@router.get("/voices/list")
async def voices_list():
    """List every voice available in your HeyGen account."""
    from heygen_api import list_voices
    result = await list_voices()
    if not result.get("success"):
        raise HTTPException(status_code=502, detail=result.get("error", "HeyGen voices fetch failed"))
    return {"voices": result.get("voices", [])}


@router.get("/voices/mappings")
async def voices_mappings():
    """Return all configured avatar -> voice overrides + hardcoded defaults."""
    db_overrides = voice_mapping.list_all_mappings()
    return {
        "overrides": db_overrides,
        "hardcoded_defaults": [
            {"avatar_id": aid, "voice_id": vid}
            for aid, vid in AVATAR_VOICE_MAPPING.items()
        ],
        "default_voice_id": DEFAULT_VOICE_ID,
        "known_invalid_voice_ids": sorted(KNOWN_INVALID_VOICE_IDS),
    }


@router.post("/voices/mappings")
async def voices_mappings_upsert(req: VoiceMappingUpsertRequest):
    """Save an avatar -> voice mapping. Takes effect within 30s (cache TTL)."""
    if not req.avatar_id or not req.voice_id:
        raise HTTPException(status_code=400, detail="avatar_id and voice_id are required")
    # If this voice was previously marked dead, clear it so we actually try it
    KNOWN_INVALID_VOICE_IDS.discard(req.voice_id)
    saved = voice_mapping.set_voice_for_avatar(req.avatar_id, req.voice_id)
    return {"success": True, **saved}


@router.delete("/voices/mappings/{avatar_id}")
async def voices_mappings_delete(avatar_id: str):
    """Remove an override so the avatar falls back to hardcoded / default."""
    deleted = voice_mapping.delete_mapping(avatar_id)
    return {"success": True, "deleted": deleted}
