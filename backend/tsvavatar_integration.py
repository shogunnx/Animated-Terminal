"""
TSVAvatarGenerator Integration
Routes StoryTime video generation to your custom avatar generator service
Hosted at: https://lipsync-creator-3.emergent.host/

Integration Specs:
- Endpoint: /api/generate/system (FORM DATA, not JSON)
- Authentication: system_api_key in form data
- Status Check: /api/tasks?user_id={user_id}
"""

import os
import logging
from typing import Dict, Optional
import httpx

logger = logging.getLogger(__name__)

TSVAVATAR_BASE_URL = os.getenv("TSVAVATAR_BASE_URL", "https://lipsync-creator-3.emergent.host")
TSVAVATAR_SYSTEM_KEY = os.getenv("TSVAVATAR_SYSTEM_KEY", "tsv-terminal-secure-key-2024")

# Map HeyGen avatar IDs to TSVAvatarGenerator 3D avatar IDs and voice IDs
AVATAR_CHARACTER_MAPPING = {
    # Binary - 3D avatar (CORRECT ID)
    "d8d16687495340c5805ad9821046be3a": {
        "avatar3d_id": "325aa060-9a99-4c27-9140-d2f33f88100a",
        "voice_id": "binary-voice",
        "name": "Binary"
    },
    
    # Victoria Black - needs 3D avatar setup
    "faa3f1fcdc0b49b79bb0a3fa11595754": {
        "avatar3d_id": "victoria-black-3d-id",  # TODO: Get from TSVAvatarGenerator
        "voice_id": "victoria-black-voice",
        "name": "Victoria Black"
    },
    
    # Veronica
    "783e82f2b06948d5b2f882fa351337fd": {
        "avatar3d_id": "veronica-3d-id",
        "voice_id": "veronica-voice",
        "name": "Veronica"
    },
    "c8680d9549744019809f0acc04faac65": {
        "avatar3d_id": "veronica-3d-id",
        "voice_id": "veronica-voice",
        "name": "Veronica"
    },
    
    # Vanessa
    "f81fa68314f84acb8fe6e527d90adc07": {
        "avatar3d_id": "vanessa-3d-id",
        "voice_id": "vanessa-voice",
        "name": "Vanessa"
    },
    
    # Evil Victoria
    "738db1645bc140beb1b476231a8b79f4": {
        "avatar3d_id": "evil-victoria-3d-id",
        "voice_id": "evil-victoria-voice",
        "name": "Evil Victoria"
    },
    "d33267ddfad14fc2a8820f1d00eb713c": {
        "avatar3d_id": "evil-victoria-3d-id",
        "voice_id": "evil-victoria-voice",
        "name": "Evil Victoria"
    },
    "94fd37e9ad0b42efb9d828edf5be22ee": {
        "avatar3d_id": "evil-victoria-3d-id",
        "voice_id": "evil-victoria-voice",
        "name": "Evil Victoria"
    },
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
    
    # Get character data from avatar ID
    character_data = AVATAR_CHARACTER_MAPPING.get(avatar_id)
    if not character_data:
        logger.error(f"Avatar ID {avatar_id} not found in character mapping")
        return {
            "success": False,
            "error": f"Avatar {avatar_id} not configured in TSVAvatarGen mapping"
        }
    
    avatar3d_id = character_data["avatar3d_id"]
    voice_id = character_data["voice_id"]
    character_name = character_data["name"]
    
    try:
        # Build FORM DATA payload for TSVAvatarGenerator /api/generate/system endpoint
        # Uses multipart/form-data, NOT JSON
        form_data = {
            "avatar3d_id": avatar3d_id,
            "voice_id": voice_id,
            "audio_script": script_text,
            "video_engine": "omnihuman" if duration > 15 else "sadtalker",  # omnihuman for longer videos
            "system_api_key": TSVAVATAR_SYSTEM_KEY,
            "user_id": "storytime_terminal"
        }
        
        logger.info(f"🎬 Sending video generation request to TSVAvatarGen")
        logger.info(f"   Character: {character_name}")
        logger.info(f"   Avatar3D ID: {avatar3d_id}")
        logger.info(f"   Voice ID: {voice_id}")
        logger.info(f"   Script length: {len(script_text)} chars")
        logger.info(f"   Video engine: {form_data['video_engine']}")
        logger.info(f"   Target URL: {TSVAVATAR_BASE_URL}/api/generate/system")
        
        # Call TSVAvatarGen API with MULTIPART FORM DATA
        # Using 'files' parameter with text-only fields creates multipart/form-data
        # This is equivalent to curl's -F flag
        files_data = {key: (None, str(value)) for key, value in form_data.items()}
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{TSVAVATAR_BASE_URL}/api/generate/system",
                files=files_data  # Creates multipart/form-data format
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
    Uses /api/tasks?user_id=storytime_terminal to get task status
    
    Returns:
        {"status": str, "progress": float, "video_url": str, "error": str}
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{TSVAVATAR_BASE_URL}/api/tasks?user_id=storytime_terminal"
            )
            
            if response.status_code != 200:
                return {
                    "status": "failed",
                    "error": f"Status check failed: {response.status_code}"
                }
            
            data = response.json()
            tasks = data.get("tasks", [])
            
            # Find the task with matching task_id
            task = next((t for t in tasks if t.get("task_id") == task_id), None)
            
            if not task:
                return {
                    "status": "processing",
                    "progress": 0.0,
                    "video_url": "",
                    "error": None
                }
            
            # Map TSVAvatarGen status to HeyGen-like status
            tsv_status = task.get("status", "queued")
            video_url = task.get("final_video_url") or task.get("video_url", "")
            
            status_mapping = {
                "queued": "processing",
                "processing_audio": "processing",
                "lip_syncing": "processing",
                "completed": "completed",
                "failed": "failed"
            }
            
            return {
                "status": status_mapping.get(tsv_status, "processing"),
                "progress": task.get("progress", 0.0),
                "video_url": video_url,
                "error": task.get("error")
            }
    
    except Exception as e:
        logger.error(f"Error checking TSVAvatarGen status: {e}")
        return {
            "status": "failed",
            "error": str(e)
        }
