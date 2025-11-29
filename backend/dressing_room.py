import os
import base64
import io
from typing import Optional
from fastapi import HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
import httpx
from openai import OpenAI
from PIL import Image

load_dotenv()

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")

class OutfitRequest(BaseModel):
    character_name: str
    character_description: str
    outfit_description: str
    reference_image_url: Optional[str] = None
    reference_image_base64: Optional[str] = None

async def download_image(url: str) -> bytes:
    """Download image from URL"""
    async with httpx.AsyncClient() as client:
        response = await client.get(url, timeout=30.0)
        response.raise_for_status()
        return response.content

def prepare_image_for_openai(image_data: bytes) -> bytes:
    """Convert image to PNG with RGBA and ensure it's under 4MB and square"""
    img = Image.open(io.BytesIO(image_data))
    
    # Convert to RGBA (required by OpenAI image editing)
    if img.mode != 'RGBA':
        # For RGB, add full opacity alpha channel
        if img.mode == 'RGB':
            img = img.convert('RGBA')
        # For grayscale or other modes, convert to RGBA
        elif img.mode in ('L', 'LA'):
            img = img.convert('RGBA')
        else:
            img = img.convert('RGBA')
    
    # Make image square by cropping/padding to center
    width, height = img.size
    size = min(width, height)
    left = (width - size) // 2
    top = (height - size) // 2
    img = img.crop((left, top, left + size, top + size))
    
    # Resize if too large (OpenAI prefers 1024x1024 for editing)
    if size != 1024:
        img = img.resize((1024, 1024), Image.Resampling.LANCZOS)
    
    # Save as PNG with RGBA
    output = io.BytesIO()
    img.save(output, format='PNG')
    return output.getvalue()

def analyze_image_for_character_description(image_bytes: bytes) -> str:
    """Analyze image to extract character features"""
    try:
        img = Image.open(io.BytesIO(image_bytes))
        # For now, return a generic description
        # In future, could use vision API to analyze
        return "beautiful anime character with long flowing hair"
    except:
        return "anime character"

async def generate_outfit_image(request: OutfitRequest) -> dict:
    """Generate an image of a character in a specific outfit using OpenAI"""
    
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY not configured")
    
    # Get base image for character description reference
    base_image_bytes = None
    if request.reference_image_base64:
        base_image_bytes = base64.b64decode(request.reference_image_base64.split(',')[-1])
    elif request.reference_image_url:
        try:
            base_image_bytes = await download_image(request.reference_image_url)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to download reference image: {str(e)}")
    
    if not base_image_bytes:
        raise HTTPException(status_code=400, detail="No reference image provided.")
    
    # Analyze image for character features
    character_features = analyze_image_for_character_description(base_image_bytes)
    
    # Create detailed prompt for text-to-image generation
    # This approach gives better control over outfit changes
    prompt = f"""Full body portrait of {request.character_name}, {character_features}.

Character wearing: {request.outfit_description}

Style: High quality anime art, professional character illustration, full body shot, standing pose, detailed clothing design, vibrant colors, clean background, 8k quality, trending on artstation"""
    
    try:
        client = OpenAI(api_key=OPENAI_API_KEY)
        
        # Use DALL-E 3 for better quality (or DALL-E 2 if 3 not available)
        try:
            # Try DALL-E 3 first
            response = client.images.generate(
                model="dall-e-3",
                prompt=prompt,
                n=1,
                size="1024x1024",
                quality="standard"
            )
        except Exception as e:
            # Fallback to DALL-E 2 if DALL-E 3 fails
            response = client.images.generate(
                model="dall-e-2",
                prompt=prompt,
                n=1,
                size="1024x1024"
            )
        
        if response.data and len(response.data) > 0:
            # Get the URL of the generated image
            image_url = response.data[0].url
            
            # Download the generated image
            async with httpx.AsyncClient() as http_client:
                img_response = await http_client.get(image_url, timeout=30.0)
                img_response.raise_for_status()
                generated_image_bytes = img_response.content
            
            # Encode as base64
            image_base64 = base64.b64encode(generated_image_bytes).decode('utf-8')
            
            return {
                "success": True,
                "image_base64": image_base64,
                "prompt_used": prompt,
                "model_used": response.model if hasattr(response, 'model') else "dall-e"
            }
        else:
            raise HTTPException(status_code=500, detail="No image was generated")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image generation failed: {str(e)}")
