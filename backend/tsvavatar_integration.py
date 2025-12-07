"""
TSVAvatarGenerator Integration
Routes StoryTime video generation to your custom avatar generator service
Hosted at: https://lipsync-creator-3.emergent.host/

The TSVAvatarGenerator service already has the avatars stored on its end.
We only need to send:
1. Character identifier (which girl)
2. Script text (what they're talking about)
"""

import os
import logging
from typing import Dict, Optional
import httpx

logger = logging.getLogger(__name__)

TSVAVATAR_BASE_URL = os.getenv("TSVAVATAR_BASE_URL", "https://lipsync-creator-3.emergent.host")

# Map HeyGen avatar IDs to character names/identifiers
# The TSVAvatarGenerator service uses these character names to look up the avatars
AVATAR_CHARACTER_MAPPING = {
    # Evil Victoria
    "738db1645bc140beb1b476231a8b79f4": "Evil Victoria",
    "d33267ddfad14fc2a8820f1d00eb713c": "Evil Victoria",
    "94fd37e9ad0b42efb9d828edf5be22ee": "Evil Victoria",
    
    # Binary
    "d8d16687495340c5805ad9821046be3a": "Binary",
    
    # Harmony
    "783e82f2b06948d5b2f882fa351337fd": "Harmony",
    
    # Victoria Black
    "faa3f1fcdc0b49b79bb0a3fa11595754": "Victoria Black",
    
    # Wargirl
    "c8680d9549744019809f0acc04faac65": "Wargirl",
    
    # Vanessa
    "f81fa68314f84acb8fe6e527d90adc07": "Vanessa",
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
        # Simple payload: just character and script
        payload = {
            "character_id": character_name,
            "script_text": script_text
        }
        
        logger.info(f"🎬 Sending video generation request to TSVAvatarGen")
        logger.info(f"   Character: {character_name}")
        logger.info(f"   Script length: {len(script_text)} chars")
        
        # Call TSVAvatarGen API
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{TSVAVATAR_BASE_URL}/api/generate",
                json=payload
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


# Singleton for managing avatar uploads
_avatar_cache = {}

async def ensure_avatar_uploaded(avatar_id: str, avatar_info: Dict) -> str:
    """
    Ensure avatar image is uploaded to TSVAvatarGen
    Returns the TSVAvatarGen avatar_id
    """
    if avatar_id in _avatar_cache:
        return _avatar_cache[avatar_id]
    
    try:
        # Fetch image
        async with httpx.AsyncClient() as client:
            img_response = await client.get(avatar_info["image_url"], timeout=30.0)
            if img_response.status_code != 200:
                raise Exception(f"Failed to fetch avatar image: {img_response.status_code}")
            
            image_base64 = base64.b64encode(img_response.content).decode('utf-8')
        
        # Upload to TSVAvatarGen
        payload = {
            "name": avatar_info["name"],
            "description": f"Avatar for {avatar_info['name']}",
            "image_data": image_base64,
            "user_id": "storytime"
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{TSVAVATAR_BASE_URL}/api/avatars/create",
                json=payload
            )
            
            if response.status_code != 200:
                raise Exception(f"Failed to upload avatar: {response.text}")
            
            result = response.json()
            tsv_avatar_id = result.get("avatar_id")
            
            # Cache the mapping
            _avatar_cache[avatar_id] = tsv_avatar_id
            logger.info(f"✅ Avatar {avatar_info['name']} uploaded to TSVAvatarGen: {tsv_avatar_id}")
            
            return tsv_avatar_id
    
    except Exception as e:
        logger.error(f"Error uploading avatar: {e}")
        raise
