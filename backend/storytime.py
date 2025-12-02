from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx
import os
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/storytime", tags=["storytime"])

HEYGEN_API_KEY = "sk_V2_hgu_kM0bbGKHQ6L_3Kx43dqxIDZiByuxdfn0QtaZVDa9xYTz"
HEYGEN_API_URL = "https://api.heygen.com/v2/video/generate"

class StoryGenerationRequest(BaseModel):
    avatar_id: str
    story_text: str
    story_title: str

class StoryGenerationResponse(BaseModel):
    video_url: str
    video_id: str
    status: str

@router.post("/generate", response_model=StoryGenerationResponse)
async def generate_story_video(request: StoryGenerationRequest):
    """
    Generate a story video using HeyGen API
    """
    try:
        # Prepare HeyGen API request
        heygen_payload = {
            "video_inputs": [
                {
                    "character": {
                        "type": "avatar",
                        "avatar_id": request.avatar_id,
                        "avatar_style": "normal"
                    },
                    "voice": {
                        "type": "text",
                        "input_text": request.story_text,
                        "voice_id": "en-US-JennyNeural"  # Default voice, can be customized
                    },
                    "background": {
                        "type": "color",
                        "value": "#1a1a2e"  # Dark background
                    }
                }
            ],
            "dimension": {
                "width": 1280,
                "height": 720
            },
            "aspect_ratio": "16:9",
            "title": request.story_title
        }

        headers = {
            "X-Api-Key": HEYGEN_API_KEY,
            "Content-Type": "application/json"
        }

        # Make request to HeyGen API
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                HEYGEN_API_URL,
                json=heygen_payload,
                headers=headers
            )

        if response.status_code != 200:
            logger.error(f"HeyGen API error: {response.status_code} - {response.text}")
            raise HTTPException(
                status_code=response.status_code,
                detail=f"HeyGen API error: {response.text}"
            )

        result = response.json()
        
        # HeyGen returns a video_id that needs to be checked for status
        # In production, you'd poll for completion or use webhooks
        video_id = result.get("data", {}).get("video_id")
        
        if not video_id:
            raise HTTPException(
                status_code=500,
                detail="Failed to get video_id from HeyGen"
            )

        # For now, return a placeholder response
        # In production, you'd check video status and return the actual URL
        return StoryGenerationResponse(
            video_url=f"https://api.heygen.com/v1/video/{video_id}",  # Placeholder
            video_id=video_id,
            status="processing"
        )

    except httpx.HTTPError as e:
        logger.error(f"HTTP error while calling HeyGen: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to connect to HeyGen API: {str(e)}"
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
    Check the status of a HeyGen video generation
    """
    try:
        status_url = f"https://api.heygen.com/v1/video_status.get?video_id={video_id}"
        headers = {
            "X-Api-Key": HEYGEN_API_KEY
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(status_url, headers=headers)

        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail="Failed to check video status"
            )

        return response.json()

    except Exception as e:
        logger.error(f"Error checking video status: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )
