"""
TSVAvatarGenerator Integration
Routes StoryTime video generation to your custom avatar generator service
Hosted at: https://lipsync-creator-3.emergent.host/
"""

import os
import asyncio
import logging
from typing import Dict, Optional
import httpx
import base64

logger = logging.getLogger(__name__)

TSVAVATAR_BASE_URL = os.getenv("TSVAVATAR_BASE_URL", "https://lipsync-creator-3.emergent.host")
TSVAVATAR_RUNWAYML_KEY = os.getenv("TSVAVATAR_RUNWAYML_KEY", "")
TSVAVATAR_ELEVENLABS_KEY = os.getenv("TSVAVATAR_ELEVENLABS_KEY", "")

# Map HeyGen avatar IDs to TSVAvatarGen avatar IDs (or image paths)
# You'll need to upload your character images to TSVAvatarGen first
AVATAR_IMAGE_MAPPING = {
    # Evil Victoria
    "738db1645bc140beb1b476231a8b79f4": {
        "name": "Evil Victoria",
        "image_url": "https://your-storage/evil-victoria.png"  # UPDATE THIS
    },
    # Binary
    "d8d16687495340c5805ad9821046be3a": {
        "name": "Binary",
        "image_url": "https://your-storage/binary.png"  # UPDATE THIS
    },
    # Harmony
    "783e82f2b06948d5b2f882fa351337fd": {
        "name": "Harmony",
        "image_url": "https://your-storage/harmony.png"  # UPDATE THIS
    },
    # Victoria Black
    "faa3f1fcdc0b49b79bb0a3fa11595754": {
        "name": "Victoria Black",
        "image_url": "https://your-storage/victoria-black.png"  # UPDATE THIS
    },
    # Add other avatars here...
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
    
    Args:
        avatar_id: HeyGen avatar ID (will be mapped to TSVAvatar image)
        script_text: Story text to narrate
        voice_id: ElevenLabs voice ID (optional)
        title: Video title
        duration: Video duration in seconds
        enable_audio: Whether to include voice narration
    
    Returns:
        {"success": True/False, "task_id": str, "video_url": str, "error": str}
    """
    
    # Get avatar image mapping
    avatar_info = AVATAR_IMAGE_MAPPING.get(avatar_id)
    if not avatar_info:
        logger.error(f"Avatar ID {avatar_id} not found in mapping")
        return {
            "success": False,
            "error": f"Avatar {avatar_id} not configured in TSVAvatarGen mapping"
        }
    
    try:
        # Fetch avatar image and convert to base64
        async with httpx.AsyncClient() as client:
            img_response = await client.get(avatar_info["image_url"], timeout=30.0)
            if img_response.status_code != 200:
                raise Exception(f"Failed to fetch avatar image: {img_response.status_code}")
            
            image_base64 = base64.b64encode(img_response.content).decode('utf-8')
        
        # Build animation prompt based on character
        animation_prompt = f"Animate {avatar_info['name']} speaking and narrating with natural expressions and lip sync"
        
        # TSVAvatarGen has APIs configured, we just send the data
        payload = {
            "image_data": image_base64,
            "prompt_text": animation_prompt,
            "video_engine": "runwayml",  # TSVAvatarGen will use its configured RunwayML key
            "voice_engine": "elevenlabs" if enable_audio else None,  # TSVAvatarGen will use its configured ElevenLabs key
            "audio_script": script_text if enable_audio else None,
            "duration": min(duration, 300),  # Max 5 minutes
            "user_id": "storytime",
            "voice_id": voice_id  # ElevenLabs voice ID for this character
        }
        
        logger.info(f"Sending video generation request to TSVAvatarGen for {avatar_info['name']}")
        
        # Call TSVAvatarGen API
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{TSVAVATAR_BASE_URL}/api/generate",
                json=payload
            )
            
            if response.status_code != 200:
                error_text = response.text
                logger.error(f"TSVAvatarGen API error: {response.status_code} - {error_text}")
                return {
                    "success": False,
                    "error": f"TSVAvatarGen API error: {error_text}"
                }
            
            result = response.json()
            task_id = result.get("task_id")
            
            if not task_id:
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
    
    except Exception as e:
        logger.error(f"Error calling TSVAvatarGen: {e}")
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
