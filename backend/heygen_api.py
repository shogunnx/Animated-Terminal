"""
HeyGen API Integration

Direct API integration with HeyGen for video generation.
Documentation: https://docs.heygen.com/reference/generate-video
"""

import os
import logging
import httpx
from typing import Dict, Optional

logger = logging.getLogger(__name__)

HEYGEN_API_KEY = os.getenv("HEYGEN_API_KEY", "")
HEYGEN_API_BASE = "https://api.heygen.com"

# Avatar ID to Voice ID mapping (HeyGen avatar IDs)
HEYGEN_VOICE_MAPPING = {
    # Evil Victoria
    '738db1645bc140beb1b476231a8b79f4': 'd74c1480d47e457d9181cb0b61d56eb0',
    'd33267ddfad14fc2a8820f1d00eb713c': 'd74c1480d47e457d9181cb0b61d56eb0',
    '94fd37e9ad0b42efb9d828edf5be22ee': 'd74c1480d47e457d9181cb0b61d56eb0',
    # Wargirl
    'c8680d9549744019809f0acc04faac65': '1a9bfb4ec9bc43d59ab64a4e66fe467c',
    # Victoria Black
    'faa3f1fcdc0b49b79bb0a3fa11595754': '1bd001e7e50f421d891986aad5158bc8',
    # Vanessa
    'f81fa68314f84acb8fe6e527d90adc07': '6fa2fa767bf148fc939c0bbba7306760',
    # Binary
    'd8d16687495340c5805ad9821046be3a': 'bdf61355b6744465a4f6060cbde19939',
    # Harmony
    '783e82f2b06948d5b2f882fa351337fd': 'a4272ae62e804b9d8660935d3df96459',
}

DEFAULT_VOICE_ID = '1bd001e7e50f421d891986aad5158bc8'


def get_headers() -> Dict[str, str]:
    """Get headers for HeyGen API requests"""
    return {
        "X-Api-Key": HEYGEN_API_KEY,
        "Content-Type": "application/json",
        "Accept": "application/json"
    }


async def generate_video_heygen(
    avatar_id: str,
    script_text: str,
    voice_id: Optional[str] = None,
    title: str = "TSV Story",
    test_mode: bool = False
) -> Dict:
    """
    Generate a video using HeyGen API v2
    
    Args:
        avatar_id: HeyGen avatar ID
        script_text: Text for the avatar to speak
        voice_id: Optional voice ID (will use mapping if not provided)
        title: Video title
        test_mode: If True, generates a test video (faster, lower quality)
    
    Returns:
        Dict with video_id and status
    """
    if not HEYGEN_API_KEY:
        return {
            "success": False,
            "error": "HEYGEN_API_KEY not configured"
        }
    
    # Get voice ID from mapping if not provided
    if not voice_id:
        voice_id = HEYGEN_VOICE_MAPPING.get(avatar_id, DEFAULT_VOICE_ID)
    
    # Build the request payload for HeyGen API v2
    payload = {
        "video_inputs": [
            {
                "character": {
                    "type": "avatar",
                    "avatar_id": avatar_id,
                    "avatar_style": "normal"
                },
                "voice": {
                    "type": "text",
                    "input_text": script_text,
                    "voice_id": voice_id,
                    "speed": 1.0
                }
            }
        ],
        "dimension": {
            "width": 1280,
            "height": 720
        },
        "test": test_mode,
        "title": title
    }
    
    logger.info(f"Generating HeyGen video for avatar {avatar_id}")
    logger.debug(f"Payload: {payload}")
    
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{HEYGEN_API_BASE}/v2/video/generate",
                headers=get_headers(),
                json=payload
            )
            
            logger.info(f"HeyGen API response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                video_id = data.get("data", {}).get("video_id")
                
                if video_id:
                    logger.info(f"HeyGen video generation started: {video_id}")
                    return {
                        "success": True,
                        "video_id": video_id,
                        "status": "processing"
                    }
                else:
                    logger.error(f"No video_id in response: {data}")
                    return {
                        "success": False,
                        "error": "No video_id returned from HeyGen"
                    }
            else:
                error_data = response.json() if response.content else {}
                error_msg = error_data.get("message", response.text)
                logger.error(f"HeyGen API error: {response.status_code} - {error_msg}")
                return {
                    "success": False,
                    "error": f"HeyGen API error: {error_msg}"
                }
                
    except httpx.TimeoutException:
        logger.error("HeyGen API timeout")
        return {
            "success": False,
            "error": "HeyGen API request timed out"
        }
    except Exception as e:
        logger.error(f"HeyGen API exception: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }


async def check_video_status_heygen(video_id: str) -> Dict:
    """
    Check the status of a HeyGen video generation
    
    Args:
        video_id: The video ID returned from generate_video_heygen
    
    Returns:
        Dict with status, video_url (if completed), and progress
    """
    if not HEYGEN_API_KEY:
        return {
            "status": "failed",
            "error": "HEYGEN_API_KEY not configured"
        }
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{HEYGEN_API_BASE}/v1/video_status.get",
                headers=get_headers(),
                params={"video_id": video_id}
            )
            
            if response.status_code == 200:
                data = response.json()
                video_data = data.get("data", {})
                
                status = video_data.get("status", "processing")
                video_url = video_data.get("video_url", "")
                
                # Map HeyGen status to our standard status
                status_map = {
                    "pending": "processing",
                    "processing": "processing",
                    "completed": "completed",
                    "failed": "failed"
                }
                
                return {
                    "status": status_map.get(status, status),
                    "video_url": video_url,
                    "progress": 100.0 if status == "completed" else 50.0,
                    "error": video_data.get("error")
                }
            else:
                error_data = response.json() if response.content else {}
                return {
                    "status": "failed",
                    "error": error_data.get("message", f"API error: {response.status_code}")
                }
                
    except Exception as e:
        logger.error(f"Error checking HeyGen video status: {str(e)}")
        return {
            "status": "failed",
            "error": str(e)
        }


async def list_avatars() -> Dict:
    """
    List available avatars from HeyGen
    
    Returns:
        Dict with list of avatars
    """
    if not HEYGEN_API_KEY:
        return {
            "success": False,
            "error": "HEYGEN_API_KEY not configured"
        }
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{HEYGEN_API_BASE}/v2/avatars",
                headers=get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "success": True,
                    "avatars": data.get("data", {}).get("avatars", [])
                }
            else:
                return {
                    "success": False,
                    "error": f"API error: {response.status_code}"
                }
                
    except Exception as e:
        logger.error(f"Error listing HeyGen avatars: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }


async def list_voices() -> Dict:
    """
    List available voices from HeyGen
    
    Returns:
        Dict with list of voices
    """
    if not HEYGEN_API_KEY:
        return {
            "success": False,
            "error": "HEYGEN_API_KEY not configured"
        }
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{HEYGEN_API_BASE}/v2/voices",
                headers=get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "success": True,
                    "voices": data.get("data", {}).get("voices", [])
                }
            else:
                return {
                    "success": False,
                    "error": f"API error: {response.status_code}"
                }
                
    except Exception as e:
        logger.error(f"Error listing HeyGen voices: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }
