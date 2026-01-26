from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx
import os
import logging

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
        from heygen_api import generate_video_heygen
        
        voice_id = AVATAR_VOICE_MAPPING.get(request.avatar_id, DEFAULT_VOICE_ID)
        
        logger.info(f"Generating video via HeyGen API for avatar {request.avatar_id}")
        result = await generate_video_heygen(
            avatar_id=request.avatar_id,
            script_text=request.story_text,
            voice_id=voice_id,
            title=request.story_title,
            test_mode=False
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
        from heygen_api import generate_video_heygen
        
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
        
        voice_id = AVATAR_VOICE_MAPPING.get(request.avatar_id, DEFAULT_VOICE_ID)
        
        logger.info(f"Generating narrated video via HeyGen API for avatar {request.avatar_id}")
        result = await generate_video_heygen(
            avatar_id=request.avatar_id,
            script_text=final_story_text,
            voice_id=voice_id,
            title=request.story_title,
            test_mode=False
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
    video_url: str = None  # Optional YouTube or video URL for analysis
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
            "character_name": result["character_name"]
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
        
        # Check remaining credits via HeyGen API
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{HEYGEN_API_BASE}/v1/user/remaining_quota",
                headers=get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                remaining = data.get("data", {}).get("remaining_quota", 0)
                
                return {
                    "status": "ok",
                    "message": f"HeyGen credits remaining: {remaining}",
                    "credits_low": remaining < 10,
                    "remaining_credits": remaining
                }
            else:
                return {
                    "status": "ok",
                    "message": "HeyGen API connected",
                    "credits_low": False
                }
                
    except Exception as e:
        return {
            "status": "error",
            "message": f"Error checking HeyGen status: {str(e)}",
            "credits_low": False
        }
