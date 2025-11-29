import os
import base64
from typing import Optional
from fastapi import HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

from emergentintegrations.llm.openai.image_generation import OpenAIImageGeneration

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")

class OutfitRequest(BaseModel):
    character_name: str
    character_description: str
    outfit_description: str
    reference_image_url: Optional[str] = None
    reference_image_base64: Optional[str] = None

async def generate_outfit_image(request: OutfitRequest) -> dict:
    """Generate an image of a character in a specific outfit using OpenAI"""
    
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="EMERGENT_LLM_KEY not configured")
    
    # Create detailed prompt
    prompt = f"""Full body portrait of {request.character_name}, a beautiful anime character.
Character details: {request.character_description}

Outfit: {request.outfit_description}

Style: High quality anime art, full body shot, standing pose, clean white background, detailed clothing, professional character design."""
    
    try:
        image_gen = OpenAIImageGeneration(api_key=EMERGENT_LLM_KEY)
        
        images = await image_gen.generate_images(
            prompt=prompt,
            model="gpt-image-1",
            number_of_images=1
        )
        
        if images and len(images) > 0:
            image_base64 = base64.b64encode(images[0]).decode('utf-8')
            return {
                "success": True,
                "image_base64": image_base64,
                "prompt_used": prompt
            }
        else:
            raise HTTPException(status_code=500, detail="No image was generated")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image generation failed: {str(e)}")
