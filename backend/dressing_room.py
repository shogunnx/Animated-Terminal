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
    """Convert image to PNG and ensure it's under 4MB and square"""
    img = Image.open(io.BytesIO(image_data))
    
    # Convert RGBA to RGB if needed
    if img.mode == 'RGBA':
        background = Image.new('RGB', img.size, (255, 255, 255))
        background.paste(img, mask=img.split()[3])
        img = background
    elif img.mode != 'RGB':
        img = img.convert('RGB')
    
    # Make image square by cropping/padding to center
    width, height = img.size
    size = min(width, height)
    left = (width - size) // 2
    top = (height - size) // 2
    img = img.crop((left, top, left + size, top + size))
    
    # Resize if too large (OpenAI max is 4MB, keep under 1024x1024 for safety)
    if size > 1024:
        img = img.resize((1024, 1024), Image.Resampling.LANCZOS)
    
    # Save as PNG
    output = io.BytesIO()
    img.save(output, format='PNG')
    return output.getvalue()

async def generate_outfit_image(request: OutfitRequest) -> dict:
    """Generate an image of a character in a specific outfit using OpenAI image editing"""
    
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY not configured")
    
    # Get base image
    base_image_bytes = None
    if request.reference_image_base64:
        # Decode base64 image
        base_image_bytes = base64.b64decode(request.reference_image_base64.split(',')[-1])
    elif request.reference_image_url:
        # Download image from URL
        try:
            base_image_bytes = await download_image(request.reference_image_url)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to download reference image: {str(e)}")
    
    if not base_image_bytes:
        raise HTTPException(status_code=400, detail="No reference image provided. Base image is required for outfit generation.")
    
    # Prepare image for OpenAI
    try:
        prepared_image = prepare_image_for_openai(base_image_bytes)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to prepare image: {str(e)}")
    
    # Create prompt for outfit modification
    prompt = f"""Transform this character to wear: {request.outfit_description}. 
Keep the character's face, body type, and overall appearance the same. 
Only change the clothing and accessories to match the description. 
High quality anime art style, detailed clothing."""
    
    try:
        client = OpenAI(api_key=OPENAI_API_KEY)
        
        # Create a file-like object for the image
        image_file = io.BytesIO(prepared_image)
        image_file.name = "base_image.png"
        
        # Use OpenAI's image editing API (dall-e-2 supports image editing)
        response = client.images.edit(
            image=image_file,
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
                "prompt_used": prompt
            }
        else:
            raise HTTPException(status_code=500, detail="No image was generated")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image generation failed: {str(e)}")
