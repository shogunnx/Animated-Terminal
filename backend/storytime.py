from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx
import os
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/storytime", tags=["storytime"])

HEYGEN_API_KEY = "sk_V2_hgu_kJ4OIR7bc3W_Ijv4zuugjHrMH4InRyg7QbrsPe6Atb1h"
HEYGEN_API_URL = "https://api.heygen.com/v2/video/generate"

# Voice ID mappings for different avatars
AVATAR_VOICE_MAPPING = {
    # Evil Victoria - mature, sexy voice
    'd33267ddfad14fc2a8820f1d00eb713c': 'f72f75e7b88649d08af89dff1fa0f641',  # Premium female voice
    # Wargirl - default voice
    'c8680d9549744019809f0acc04faac65': '1bd001e7e50f421d891986aad5158bc8',
    # Victoria Black - default voice
    '84516b469b1f44dbb126c40aa24b2df0': '1bd001e7e50f421d891986aad5158bc8',
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

@router.post("/generate", response_model=StoryGenerationResponse)
async def generate_story_video(request: StoryGenerationRequest):
    """
    Generate a story video using HeyGen API V2
    """
    try:
        # Prepare HeyGen API request for talking photo
        heygen_payload = {
            "video_inputs": [
                {
                    "character": {
                        "type": "talking_photo",
                        "talking_photo_id": request.avatar_id
                    },
                    "voice": {
                        "type": "text",
                        "input_text": request.story_text,
                        "voice_id": "1bd001e7e50f421d891986aad5158bc8"  # English female voice
                    }
                }
            ],
            "dimension": {
                "width": 1280,
                "height": 720
            },
            "test": False,  # Set to True for testing without using credits
            "title": request.story_title
        }

        headers = {
            "accept": "application/json",
            "content-type": "application/json",
            "x-api-key": HEYGEN_API_KEY
        }

        # Make request to HeyGen API V2
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                HEYGEN_API_URL,
                json=heygen_payload,
                headers=headers
            )

        response_data = response.json()
        
        if response.status_code != 200:
            error_msg = response_data.get("error", {}).get("message", response.text) if isinstance(response_data, dict) else response.text
            logger.error(f"HeyGen API error: {response.status_code} - {error_msg}")
            raise HTTPException(
                status_code=response.status_code,
                detail=f"{response.status_code}: HeyGen API error: {error_msg}"
            )

        # Extract video_id from response
        video_id = response_data.get("data", {}).get("video_id")
        
        if not video_id:
            logger.error(f"No video_id in response: {response_data}")
            raise HTTPException(
                status_code=500,
                detail="Failed to get video_id from HeyGen response"
            )

        logger.info(f"Video generation started successfully. Video ID: {video_id}")

        # Return response with video_id
        # Frontend will need to poll the status endpoint to get the final video URL
        return StoryGenerationResponse(
            video_url="",  # Will be populated after video is ready
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
    Returns the video URL when ready
    """
    try:
        status_url = f"https://api.heygen.com/v1/video_status.get?video_id={video_id}"
        headers = {
            "accept": "application/json",
            "x-api-key": HEYGEN_API_KEY
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(status_url, headers=headers)

        response_data = response.json()
        
        if response.status_code != 200:
            error_msg = response_data.get("error", {}).get("message", response.text) if isinstance(response_data, dict) else response.text
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Failed to check video status: {error_msg}"
            )

        # HeyGen status response format:
        # {
        #   "data": {
        #     "video_id": "...",
        #     "status": "processing" | "completed" | "failed",
        #     "video_url": "..." (only when completed)
        #   }
        # }
        return response_data

    except Exception as e:
        logger.error(f"Error checking video status: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )
