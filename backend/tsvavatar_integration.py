"""
TSVAvatarGenerator Integration
Routes StoryTime video generation to your custom avatar generator service
Hosted at: https://lipsync-creator-3.emergent.host/

The TSVAvatarGenerator service already has the avatars stored on its end.
Endpoint: /api/generate/system (JSON endpoint for TSVTerminal integration)
Authentication: X-System-Key header
"""

import os
import logging
from typing import Dict, Optional
import httpx

logger = logging.getLogger(__name__)

TSVAVATAR_BASE_URL = os.getenv("TSVAVATAR_BASE_URL", "https://lipsync-creator-3.emergent.host")
TSVAVATAR_SYSTEM_KEY = os.getenv("TSVAVATAR_SYSTEM_KEY", "tsv-terminal-secure-key-2024")

# Map HeyGen avatar IDs to TSVAvatarGenerator character NAMES (PRODUCTION DEPLOYMENT)
# The API expects character names like "Binary", "Victoria Black", etc.
AVATAR_CHARACTER_MAPPING = {
    # Binary - DEPLOYED
    "d8d16687495340c5805ad9821046be3a": "Binary",
    
    # Victoria Black - DEPLOYED
    "faa3f1fcdc0b49b79bb0a3fa11595754": "Victoria Black",
    
    # Veronica - DEPLOYED
    "783e82f2b06948d5b2f882fa351337fd": "Veronica",
    "c8680d9549744019809f0acc04faac65": "Veronica",
    
    # Vanessa - DEPLOYED  
    "f81fa68314f84acb8fe6e527d90adc07": "Vanessa",
    
    # Evil Victoria - NOT YET DEPLOYED (need to add to TSVAvatarGenerator)
    "738db1645bc140beb1b476231a8b79f4": "Evil Victoria",
    "d33267ddfad14fc2a8820f1d00eb713c": "Evil Victoria",
    "94fd37e9ad0b42efb9d828edf5be22ee": "Evil Victoria",
}


async def generate_video_with_tsvavatar(
    avatar_id: str,
    script_text: str,
    voice_id: Optional[str] = None,
    title: str = "Generated Video",
    duration: int = 10,
    enable_audio: bool = True
) -> Dict:
    """
    Generate video using TSVAvatarGenerator service
    
    The service already has the avatars, so we only send:
    - character_id: Which character/girl to use
    - script_text: What they're talking about
    
    Args:
        avatar_id: HeyGen avatar ID (will be mapped to character name)
        script_text: Story text to narrate
        voice_id: ElevenLabs voice ID (optional, for future use)
        title: Video title
        duration: Video duration in seconds
        enable_audio: Whether to include voice narration
    
    Returns:
        {"success": True/False, "task_id": str, "video_url": str, "error": str}
    """
    
    # Get character name from avatar ID
    character_name = AVATAR_CHARACTER_MAPPING.get(avatar_id)
    if not character_name:
        logger.error(f"Avatar ID {avatar_id} not found in character mapping")
        return {
            "success": False,
            "error": f"Avatar {avatar_id} not configured in TSVAvatarGen mapping"
        }
    
    try:
        # Build payload for TSVAvatarGenerator /api/generate/system endpoint
        # Expects: character_name (string like "Binary"), audio_script, duration (optional)
        payload = {
            "character_name": character_name,
            "audio_script": script_text,
            "duration": min(duration, 300) if duration else 10  # Default 10 seconds, max 300
        }
        
        # Prepare headers with system authentication key
        headers = {
            "Content-Type": "application/json",
            "X-System-Key": TSVAVATAR_SYSTEM_KEY
        }
        
        logger.info(f"🎬 Sending video generation request to TSVAvatarGen")
        logger.info(f"   Character: {character_name}")
        logger.info(f"   Script length: {len(script_text)} chars")
        logger.info(f"   Duration: {payload['duration']}s")
        logger.info(f"   Target URL: {TSVAVATAR_BASE_URL}/api/generate/system")
        
        # Call TSVAvatarGen API (system endpoint)
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{TSVAVATAR_BASE_URL}/api/generate/system",
                json=payload,
                headers=headers
            )
            
            if response.status_code != 200:
                error_text = response.text
                logger.error(f"❌ TSVAvatarGen API error: {response.status_code} - {error_text}")
                return {
                    "success": False,
                    "error": f"TSVAvatarGen API error: {error_text}"
                }
            
            result = response.json()
            task_id = result.get("task_id")
            
            if not task_id:
                logger.error(f"❌ No task_id returned from TSVAvatarGen: {result}")
                return {
                    "success": False,
                    "error": "No task_id returned from TSVAvatarGen"
                }
            
            logger.info(f"✅ TSVAvatarGen task created: {task_id}")
            
            return {
                "success": True,
                "task_id": task_id,
                "video_url": "",  # Will be available via status endpoint
                "status": "processing"
            }
    
    except httpx.TimeoutException as e:
        logger.error(f"⏱️ Timeout calling TSVAvatarGen: {e}")
        return {
            "success": False,
            "error": f"Request timeout: {str(e)}"
        }
    except httpx.HTTPError as e:
        logger.error(f"🌐 HTTP error calling TSVAvatarGen: {e}")
        return {
            "success": False,
            "error": f"HTTP error: {str(e)}"
        }
    except Exception as e:
        logger.error(f"❌ Error calling TSVAvatarGen: {e}")
        return {
            "success": False,
            "error": str(e)
        }


async def check_tsvavatar_status(task_id: str) -> Dict:
    """
    Check video generation status from TSVAvatarGen
    
    Returns:
        {"status": str, "progress": float, "video_url": str, "error": str}
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{TSVAVATAR_BASE_URL}/api/status/{task_id}"
            )
            
            if response.status_code != 200:
                return {
                    "status": "failed",
                    "error": f"Status check failed: {response.status_code}"
                }
            
            data = response.json()
            
            # Map TSVAvatarGen status to HeyGen-like status
            tsv_status = data.get("status", "pending")
            video_url = data.get("final_video_url") or data.get("video_url", "")
            
            status_mapping = {
                "pending": "processing",
                "processing_video": "processing",
                "processing_audio": "processing",
                "merging": "processing",
                "completed": "completed",
                "failed": "failed"
            }
            
            return {
                "status": status_mapping.get(tsv_status, "processing"),
                "progress": data.get("progress", 0.0),
                "video_url": video_url,
                "error": data.get("error")
            }
    
    except Exception as e:
        logger.error(f"Error checking TSVAvatarGen status: {e}")
        return {
            "status": "failed",
            "error": str(e)
        }
