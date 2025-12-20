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

# Character appearance descriptions for Pairs mode - with distinctive visual identifiers
CHARACTER_APPEARANCES = {
    "victoria_black": {
        "full": "Victoria Black, a stunning anime woman with long flowing black hair with teal highlights, piercing violet eyes, wearing elegant goddess attire, teal and purple color scheme, confident powerful pose",
        "hair": "long flowing black hair with teal highlights",
        "identifier": "the woman with black and teal hair"
    },
    "victoria_black_blaster": {
        "full": "Victoria Black Blaster, fierce anime woman with wild black and red hair, glowing golden eyes, wearing battle armor with red and gold accents, explosive energy aura",
        "hair": "wild black and red hair",
        "identifier": "the woman with black and red hair"
    },
    "victoria_black_goddess": {
        "full": "Victoria Black Goddess, divine anime woman with ethereal golden-white hair, radiant eyes, wearing ornate golden goddess robes with pink accents, heavenly glow",
        "hair": "ethereal golden-white hair",
        "identifier": "the woman with golden-white hair"
    },
    "wargirl": {
        "full": "Wargirl, energetic anime woman with super long spiky blonde SSJ3 hair reaching her legs, fierce pink eyes, wearing pink and gold battle outfit, warrior princess aesthetic",
        "hair": "super long spiky golden blonde SSJ3 hair reaching her legs",
        "identifier": "the woman with the super long golden blonde hair"
    },
    "binary": {
        "full": "Binary, beautiful anime woman with long purple-silver hair with glitch effects, glowing lavender eyes, angel wings, wearing futuristic purple bodysuit with silver accents, digital goddess aesthetic",
        "hair": "long sparkling purple-silver hair with glitch effects, angel wings",
        "identifier": "the woman with purple hair and angel wings"
    },
    "vanessa": {
        "full": "Vanessa, bold sexy anime pinup woman with fiery red-orange hair, confident amber eyes, wearing red and gold warrior bikini armor, sword warrior aesthetic",
        "hair": "fiery red-orange hair",
        "identifier": "the woman with red-orange hair"
    },
    "harmony": {
        "full": "Harmony, cute anime woman with short blue hair with cyan highlights, bright blue eyes, wearing tech-style blue outfit with neon accents, DJ headphones, futuristic vibe",
        "hair": "short blue hair with cyan highlights, DJ headphones",
        "identifier": "the woman with short blue hair"
    },
    "evil_victoria": {
        "full": "Evil Victoria, seductive dark anime woman with long black hair with red streaks, menacing red glowing eyes, wearing revealing black and red gothic outfit, dark queen aesthetic, silver eye marking",
        "hair": "long black hair with red streaks, silver eye marking",
        "identifier": "the woman with black hair and red streaks"
    },
    "veronica": {
        "full": "Veronica, warm friendly anime woman with wavy orange-brown hair, kind hazel eyes, wearing casual orange and blue outfit, human ally aesthetic",
        "hair": "wavy orange-brown hair",
        "identifier": "the woman with orange-brown hair"
    }
}

def get_character_appearance(character_id: str, character_name: str) -> str:
    """Get detailed appearance description for a character"""
    char_data = CHARACTER_APPEARANCES.get(character_id, {})
    if isinstance(char_data, dict):
        return char_data.get("full", f"{character_name}, beautiful anime woman")
    return char_data

def get_character_identifier(character_id: str) -> str:
    """Get the distinctive visual identifier for a character (e.g., 'the woman with purple hair')"""
    char_data = CHARACTER_APPEARANCES.get(character_id, {})
    if isinstance(char_data, dict):
        return char_data.get("identifier", "the woman")
    return "the woman"

def get_character_hair(character_id: str) -> str:
    """Get the hair description for a character"""
    char_data = CHARACTER_APPEARANCES.get(character_id, {})
    if isinstance(char_data, dict):
        return char_data.get("hair", "beautiful hair")
    return "beautiful hair"

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

async def generate_single_character_image(character_id: str, character_name: str, outfit_description: str, base_image_bytes: bytes) -> bytes:
    """Generate a single character image using their base image as reference.
    Uses very low strength to preserve character likeness."""
    
    # Prepare the base image
    prepared_image = prepare_image_for_openai(base_image_bytes)
    image_url = await upload_image_to_fal(prepared_image)
    
    # Get character appearance for prompt
    char_appearance = get_character_appearance(character_id, character_name)
    
    # Create prompt that emphasizes keeping the character's likeness
    prompt = f"""{char_appearance}, {outfit_description}.
Maintain exact facial features, hair color, eye color, and overall appearance.
High quality anime art style, detailed, vibrant colors, beautiful composition."""

    # Use image-to-image with very low strength to preserve character likeness
    handler = await fal_client.submit_async(
        "fal-ai/flux/dev/image-to-image",
        arguments={
            "prompt": prompt,
            "image_url": image_url,
            "strength": 0.35,  # Very low strength to preserve original character appearance
            "num_inference_steps": 30,
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
            return img_response.content
    
    raise HTTPException(status_code=500, detail=f"Failed to generate image for {character_name}")


async def generate_pairs_image_blended(request: OutfitRequest) -> dict:
    """
    Generate Pairs Mode image using smart composite approach:
    1. Create a side-by-side composite of both base images
    2. Generate an intelligent prompt describing both characters by their visual features
    3. Use image-to-image on the composite to create a unified scene with both characters interacting
    """
    
    # Get base images for both characters
    char1_base = get_base_image(request.character_id)
    char2_base = get_base_image(request.second_character_id)
    
    if not char1_base:
        raise HTTPException(status_code=400, detail=f"No base image found for {request.character_name}. Please upload one first.")
    if not char2_base:
        raise HTTPException(status_code=400, detail=f"No base image found for {request.second_character_name}. Please upload one first.")
    
    # Get the distinctive visual identifiers for each character
    char1_identifier = get_character_identifier(request.character_id)
    char2_identifier = get_character_identifier(request.second_character_id)
    char1_hair = get_character_hair(request.character_id)
    char2_hair = get_character_hair(request.second_character_id)
    
    # Parse the activity from the request
    activity = request.outfit_description
    
    # Step 1: Create a side-by-side composite of both base images
    try:
        img1 = Image.open(io.BytesIO(char1_base)).convert('RGB')
        img2 = Image.open(io.BytesIO(char2_base)).convert('RGB')
        
        # Resize to same height for consistent composite
        target_height = 768
        img1_ratio = target_height / img1.height
        img2_ratio = target_height / img2.height
        img1 = img1.resize((int(img1.width * img1_ratio), target_height), Image.Resampling.LANCZOS)
        img2 = img2.resize((int(img2.width * img2_ratio), target_height), Image.Resampling.LANCZOS)
        
        # Create landscape composite (side by side)
        total_width = img1.width + img2.width
        composite = Image.new('RGB', (total_width, target_height), (0, 0, 0))
        composite.paste(img1, (0, 0))
        composite.paste(img2, (img1.width, 0))
        
        # Convert to base64 for upload
        composite_buffer = io.BytesIO()
        composite.save(composite_buffer, format='PNG')
        composite_bytes = composite_buffer.getvalue()
        composite_url = await upload_image_to_fal(composite_bytes)
        
        print(f"[PAIRS MODE] Created composite reference image: {total_width}x{target_height}")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create composite: {str(e)}")
    
    # Step 2: Generate a SMART prompt that describes both characters interacting
    # The key is to identify each character by their distinctive visual features (hair, etc.)
    smart_prompt = f"""Two beautiful anime women together in an intimate scene, {activity}.
On the left is {char1_identifier} with {char1_hair}.
On the right is {char2_identifier} with {char2_hair}.
They are interacting together in the scene - facing each other, close together, {activity}.
Keep their exact hair colors, facial features, and distinctive appearances.
High quality anime art, detailed faces, vibrant colors, romantic composition, beautiful lighting."""

    print(f"[PAIRS MODE] Smart prompt: {smart_prompt}")
    
    # Step 3: Use image-to-image on the composite with moderate strength
    # This will transform the scene while preserving character likenesses
    try:
        handler = await fal_client.submit_async(
            "fal-ai/flux/dev/image-to-image",
            arguments={
                "prompt": smart_prompt,
                "image_url": composite_url,
                "strength": 0.50,  # Moderate strength - enough to change scene but preserve characters
                "num_inference_steps": 35,
                "guidance_scale": 4.0,
                "enable_safety_checker": False  # Disable safety checker for anime content
            }
        )
        
        result = await handler.get()
        print(f"[PAIRS MODE] Fal.ai result keys: {result.keys() if result else 'None'}")
        
        if result and result.get("images") and len(result["images"]) > 0:
            generated_image_url = result["images"][0]["url"]
            print(f"[PAIRS MODE] Generated image URL: {generated_image_url[:100]}...")
            
            async with httpx.AsyncClient() as http_client:
                img_response = await http_client.get(generated_image_url, timeout=30.0)
                img_response.raise_for_status()
                generated_image_bytes = img_response.content
            
            print(f"[PAIRS MODE] Downloaded image size: {len(generated_image_bytes)} bytes")
            image_base64 = base64.b64encode(generated_image_bytes).decode('utf-8')
            
            print("[PAIRS MODE] Generated unified scene successfully!")
            
            return {
                "success": True,
                "image_base64": image_base64,
                "prompt_used": smart_prompt,
                "image_source": "pairs_smart_composite",
                "base_image_saved": False,
                "model": "fal-ai/flux/dev/image-to-image",
                "is_pairs": True,
                "used_reference_images": True,
                "generation_method": "smart_composite_transform",
                "char1_identifier": char1_identifier,
                "char2_identifier": char2_identifier
            }
        else:
            raise HTTPException(status_code=500, detail="No image was generated for pairs mode")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pairs image generation failed: {str(e)}")


async def generate_outfit_image(request: OutfitRequest) -> dict:
    """Generate an image of a character in a specific outfit using Fal.ai image editing"""
    
    if not FAL_KEY:
        raise HTTPException(status_code=500, detail="FAL_KEY not configured")
    
    # For Pairs mode, use the new 3-step blended approach
    if request.is_pairs_mode and request.second_character_name and request.second_character_id:
        return await generate_pairs_image_blended(request)
    
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
