import os
import base64
import io
from typing import Optional
from fastapi import HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
import httpx
import fal_client
from PIL import Image
from pathlib import Path

load_dotenv()

FAL_KEY = os.environ.get("FAL_KEY", "")
os.environ["FAL_KEY"] = FAL_KEY  # Ensure fal_client can access it
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
    # Pairs mode fields
    second_character_id: Optional[str] = None
    second_character_name: Optional[str] = None
    is_pairs_mode: Optional[bool] = False

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
    
    # Balanced mask - keep face and top of head, edit body
    # Top 20% opaque (face), middle 70% transparent (body/clothes), bottom 10% semi (feet)
    for y in range(200, 924):  # From 20% to 90% (body area)
        for x in range(1024):
            # Fully transparent in clothing area for complete replacement
            pixels[x, y] = (255, 255, 255, 0)
    
    # Make bottom area (shoes) semi-transparent for better shoe rendering
    for y in range(924, 1024):
        for x in range(1024):
            pixels[x, y] = (255, 255, 255, 128)  # Semi-transparent
    
    # Save mask
    output = io.BytesIO()
    mask.save(output, format='PNG')
    return output.getvalue()

def analyze_base_image_features(image_bytes: bytes) -> str:
    """Extract visual features from base image for prompt"""
    try:
        img = Image.open(io.BytesIO(image_bytes))
        # Analyze image to get basic features
        # This is a simple approach - could be enhanced with vision API
        width, height = img.size
        aspect = "tall" if height > width * 1.2 else "standard"
        return f"{aspect} proportions"
    except Exception:
        return "standard proportions"

async def upload_image_to_fal(image_bytes: bytes) -> str:
    """Upload image to Fal.ai and get URL"""
    try:
        # Fal.ai requires base64 data URL format
        image_base64 = base64.b64encode(image_bytes).decode('utf-8')
        # Determine format
        img = Image.open(io.BytesIO(image_bytes))
        format_str = img.format.lower() if img.format else 'png'
        data_url = f"data:image/{format_str};base64,{image_base64}"
        return data_url
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to prepare image for upload: {str(e)}")

async def generate_outfit_image(request: OutfitRequest) -> dict:
    """Generate an image of a character in a specific outfit using Fal.ai image editing"""
    
    if not FAL_KEY:
        raise HTTPException(status_code=500, detail="FAL_KEY not configured")
    
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
        except Exception:
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
    
    # Upload base image to Fal.ai
    try:
        image_url = await upload_image_to_fal(base_image_bytes)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to upload image: {str(e)}")
    
    # Create editing instruction for FLUX.2 Edit
    # For Pairs mode, generate both characters together
    if request.is_pairs_mode and request.second_character_name:
        prompt = f"""Two beautiful anime girls together in one scene: {request.character_name} and {request.second_character_name}.
{request.outfit_description}.
Both characters are clearly visible side by side, facing the viewer.
High quality anime art style, detailed, vibrant colors."""
        
        # Use text-to-image generation for Pairs mode
        try:
            handler = await fal_client.submit_async(
                "fal-ai/flux/dev",  # Use FLUX dev for text-to-image
                arguments={
                    "prompt": prompt,
                    "image_size": "landscape_16_9",  # Better for two characters
                    "num_inference_steps": 28,
                    "guidance_scale": 3.5,
                    "enable_safety_checker": True
                }
            )
            
            result = await handler.get()
            
            if result and result.get("images") and len(result["images"]) > 0:
                generated_image_url = result["images"][0]["url"]
                
                async with httpx.AsyncClient() as http_client:
                    img_response = await http_client.get(generated_image_url, timeout=30.0)
                    img_response.raise_for_status()
                    generated_image_bytes = img_response.content
                
                image_base64 = base64.b64encode(generated_image_bytes).decode('utf-8')
                
                return {
                    "success": True,
                    "image_base64": image_base64,
                    "prompt_used": prompt,
                    "image_source": "pairs_generation",
                    "base_image_saved": False,
                    "model": "fal-ai/flux/dev",
                    "is_pairs": True
                }
            else:
                raise HTTPException(status_code=500, detail="No image was generated for pairs mode")
                
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Pairs image generation failed: {str(e)}")
    
    # Regular single character editing mode
    prompt = f"""Change this person's outfit to: {request.outfit_description}.
Keep everything else the same - same face, same hair, same background, same pose.
Only change the clothing."""
    
    try:
        # Use Fal.ai FLUX.2 [dev] Edit - designed for image editing while preserving the person
        handler = await fal_client.submit_async(
            "fal-ai/flux-2/edit",
            arguments={
                "image_urls": [image_url],  # Array of image URLs (base image to edit)
                "prompt": prompt,
                "strength": 0.85,  # How much to change (0.85 = strong edit but preserve person)
                "guidance_scale": 3.5,
                "num_inference_steps": 28,
                "enable_safety_checker": True
            }
        )
        
        # Get result
        result = await handler.get()
        
        if result and result.get("images") and len(result["images"]) > 0:
            # Download the generated image from Fal.ai
            generated_image_url = result["images"][0]["url"]
            
            async with httpx.AsyncClient() as http_client:
                img_response = await http_client.get(generated_image_url, timeout=30.0)
                img_response.raise_for_status()
                generated_image_bytes = img_response.content
            
            # Encode as base64
            image_base64 = base64.b64encode(generated_image_bytes).decode('utf-8')
            
            return {
                "success": True,
                "image_base64": image_base64,
                "prompt_used": prompt,
                "image_source": image_source,
                "base_image_saved": request.save_as_base and image_source == "upload",
                "model": "fal-ai/flux-general"
            }
        else:
            raise HTTPException(status_code=500, detail="No image was generated")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image generation failed: {str(e)}")
