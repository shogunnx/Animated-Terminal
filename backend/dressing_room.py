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
    """Convert image to PNG with RGBA, ensure full body visible (head to toe)"""
    img = Image.open(io.BytesIO(image_data))
    
    # Convert to RGBA (required by OpenAI image editing)
    if img.mode != 'RGBA':
        if img.mode == 'RGB':
            img = img.convert('RGBA')
        elif img.mode in ('L', 'LA'):
            img = img.convert('RGBA')
        else:
            img = img.convert('RGBA')
    
    # Make image square by PADDING (not cropping) to preserve full body
    width, height = img.size
    
    if width != height:
        # Create square canvas with padding to fit entire image
        size = max(width, height)
        square_img = Image.new('RGBA', (size, size), (255, 255, 255, 0))
        
        # Paste original image centered
        paste_x = (size - width) // 2
        paste_y = (size - height) // 2
        square_img.paste(img, (paste_x, paste_y))
        img = square_img
    
    # Resize to 1024x1024
    if img.size[0] != 1024:
        img = img.resize((1024, 1024), Image.Resampling.LANCZOS)
    
    # Save as PNG with RGBA
    output = io.BytesIO()
    img.save(output, format='PNG')
    return output.getvalue()

def create_clothing_mask(image_bytes: bytes) -> bytes:
    """Create a mask for clothing area (transparent where clothes should be edited)"""
    img = Image.open(io.BytesIO(image_bytes))
    
    # Ensure RGBA
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    # Make square
    width, height = img.size
    size = min(width, height)
    left = (width - size) // 2
    top = (height - size) // 2
    img = img.crop((left, top, left + size, top + size))
    
    # Resize to 1024x1024
    if size != 1024:
        img = img.resize((1024, 1024), Image.Resampling.LANCZOS)
    
    # Create a mask - make the clothing area transparent
    # Rough approximation: transparent in middle/body area, opaque at face (top 30%)
    mask = Image.new('RGBA', (1024, 1024), (255, 255, 255, 255))
    pixels = mask.load()
    
    # Make bottom 70% semi-transparent (where body/clothes typically are)
    for y in range(300, 1024):  # From 30% down
        for x in range(1024):
            # Create a soft gradient mask
            alpha = 0  # Fully transparent in clothing area
            pixels[x, y] = (255, 255, 255, alpha)
    
    # Save mask
    output = io.BytesIO()
    mask.save(output, format='PNG')
    return output.getvalue()

async def generate_outfit_image(request: OutfitRequest) -> dict:
    """Generate an image of a character in a specific outfit using OpenAI image editing"""
    
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY not configured")
    
    # Get base image
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
    
    # Prepare base image
    try:
        prepared_image = prepare_image_for_openai(base_image_bytes)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to prepare image: {str(e)}")
    
    # Create mask for clothing area
    try:
        mask_bytes = create_clothing_mask(base_image_bytes)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to create mask: {str(e)}")
    
    # Create prompt that references "this woman" or "this person"
    prompt = f"""Replace this woman's current clothes with: {request.outfit_description}. 
Remove all current clothing and dress her in: {request.outfit_description}. 
Keep her exact face, hair, and body the same. 
High quality, detailed clothing, accurate colors."""
    
    try:
        client = OpenAI(api_key=OPENAI_API_KEY)
        
        # Create file-like objects
        image_file = io.BytesIO(prepared_image)
        image_file.name = "image.png"
        
        mask_file = io.BytesIO(mask_bytes)
        mask_file.name = "mask.png"
        
        # Use image editing with mask
        response = client.images.edit(
            image=image_file,
            mask=mask_file,
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
