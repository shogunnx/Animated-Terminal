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
    # Evil Victoria - Cassidy voice (mature, sexy) - Using Group ID
    '130c202a4e7a47898dfc6f434c86dc24': 'e0cc82c22f414c95b1f25696c732f058',  # Cassidy
    # Evil Victoria - original individual ID (fallback)
    'd33267ddfad14fc2a8820f1d00eb713c': 'e0cc82c22f414c95b1f25696c732f058',  # Cassidy
    # Evil Victoria Talking Head - Cassidy voice
    '94fd37e9ad0b42efb9d828edf5be22ee': 'e0cc82c22f414c95b1f25696c732f058',  # Cassidy
    # Wargirl - updated voice ID
    'c8680d9549744019809f0acc04faac65': '1a9bfb4ec9bc43d59ab64a4e66fe467c',
    # Victoria Black - default avatar ID
    '04ace9b9356e42a2831ec0a764e70bcc': '1bd001e7e50f421d891986aad5158bc8',
    # Vanessa - custom voice ID
    'f81fa68314f84acb8fe6e527d90adc07': '6fa2fa767bf148fc939c0bbba7306760',
    # Binary - custom voice ID
    'f76abbcae95e4fc1b6935841608c9fe3': 'bdf61355b6744465a4f6060cbde19939',
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
        # Get the appropriate voice for this avatar
        voice_id = AVATAR_VOICE_MAPPING.get(request.avatar_id, DEFAULT_VOICE_ID)
        
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
                        "voice_id": voice_id
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

# Q&A Request Model
class QARequest(BaseModel):
    character_id: str
    character_name: str
    avatar_id: str
    question: str

@router.post("/qa")
async def generate_qa_response(request: QARequest):
    """
    Generate Q&A video response using character lore + AI
    """
    try:
        from storytime_qa import create_qa_video
        
        result = await create_qa_video(
            character_id=request.character_id,
            character_name=request.character_name,
            question=request.question,
            avatar_id=request.avatar_id,
            heygen_api_key=HEYGEN_API_KEY
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
