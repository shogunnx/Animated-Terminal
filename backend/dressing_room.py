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
from pathlib import Path

load_dotenv()

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
BASE_IMAGES_DIR = Path("/app/backend/base_images")
BASE_IMAGES_DIR.mkdir(exist_ok=True)

class OutfitRequest(BaseModel):
    character_name: str
    character_id: str
    character_description: str
    outfit_description: str
    reference_image_url: Optional[str] = None
    reference_image_base64: Optional[str] = None
    save_as_base: Optional[bool] = False

class BaseImageRequest(BaseModel):
    character_id: str
    image_base64: str

async def download_image(url: str) -> bytes:
    """Download image from URL"""
    async with httpx.AsyncClient() as client:
        response = await client.get(url, timeout=30.0)
        response.raise_for_status()
        return response.content

def save_base_image(character_id: str, image_data: bytes) -> str:
    """Save base image for a character"""
    file_path = BASE_IMAGES_DIR / f"{character_id}.png"
    with open(file_path, "wb") as f:
        f.write(image_data)
    return str(file_path)

def get_base_image(character_id: str) -> Optional[bytes]:
    """Get stored base image for a character"""
    file_path = BASE_IMAGES_DIR / f"{character_id}.png"
    if file_path.exists():
        with open(file_path, "rb") as f:
            return f.read()
    return None

def has_base_image(character_id: str) -> bool:
    """Check if character has a stored base image"""
    file_path = BASE_IMAGES_DIR / f"{character_id}.png"
    return file_path.exists()

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
    # Create 1024x1024 mask
    mask = Image.new('RGBA', (1024, 1024), (255, 255, 255, 255))
    pixels = mask.load()
    
    # More aggressive mask - only keep face area (top 15%)
    # Make everything from neck down transparent for better outfit changes
    for y in range(150, 1024):  # From 15% down (neck and below)
        for x in range(1024):
            alpha = 0  # Fully transparent - allows complete outfit replacement
            pixels[x, y] = (255, 255, 255, alpha)
    
    # Save mask
    output = io.BytesIO()
    mask.save(output, format='PNG')
    return output.getvalue()

async def generate_outfit_image(request: OutfitRequest) -> dict:
    """Generate an image of a character in a specific outfit using OpenAI image editing"""
    
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY not configured")
    
    # Priority system for base images:
    # 1. Nexus API (if reference_image_url provided)
    # 2. Stored base image for this character
    # 3. Uploaded image (reference_image_base64)
    
    base_image_bytes = None
    image_source = None
    
    # Priority 1: Try Nexus URL if provided
    if request.reference_image_url:
        try:
            base_image_bytes = await download_image(request.reference_image_url)
            image_source = "nexus"
        except Exception as e:
            pass  # Fall through to next priority
    
    # Priority 2: Try stored base image
    if not base_image_bytes:
        stored_image = get_base_image(request.character_id)
        if stored_image:
            base_image_bytes = stored_image
            image_source = "stored"
    
    # Priority 3: Use uploaded image
    if not base_image_bytes and request.reference_image_base64:
        base_image_bytes = base64.b64decode(request.reference_image_base64.split(',')[-1])
        image_source = "upload"
        
        # Save uploaded image as base image for this character
        if request.save_as_base:
            save_base_image(request.character_id, base_image_bytes)
    
    if not base_image_bytes:
        raise HTTPException(status_code=400, detail="No reference image available. Please upload a base image.")
    
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
    
    # Create prompt for high-quality single full-body image
    prompt = f"""A beautiful full body portrait of this woman wearing {request.outfit_description}.
Show her from head to toe in a single elegant pose.
Keep her exact face, hair color, and body type.
High quality anime art style, detailed outfit, professional lighting, clean background.
Full body visible with top of head and complete shoes showing."""
    
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
                "prompt_used": prompt,
                "image_source": image_source,
                "base_image_saved": request.save_as_base and image_source == "upload"
            }
        else:
            raise HTTPException(status_code=500, detail="No image was generated")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image generation failed: {str(e)}")
