import os
import base64
import io
from typing import Optional, List
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
BASE_IMAGES_DIR = Path("base_images")
BASE_IMAGES_DIR.mkdir(exist_ok=True, parents=True)

# Character appearance descriptions for Pairs mode - with distinctive visual identifiers
CHARACTER_APPEARANCES = {
    "victoria_black": {
        "full": "Victoria Black, a stunning anime woman with long flowing black hair with teal highlights, piercing violet eyes, wearing elegant goddess attire, teal and purple color scheme, confident powerful pose",
        "hair": "long flowing black hair with teal highlights",
        "identifier": "the woman with black and teal hair"
    },
    "community_oc": {
        "full": "custom uploaded character, beautiful person",
        "hair": "distinctive hair",
        "identifier": "the uploaded character"
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

class TryOnRequest(BaseModel):
    """Request for virtual try-on with actual garment images by category"""
    model_image_url: Optional[str] = None
    model_image_base64: Optional[str] = None
    # Separate garment categories
    top_image_url: Optional[str] = None
    top_image_base64: Optional[str] = None
    bottom_image_url: Optional[str] = None
    bottom_image_base64: Optional[str] = None
    dress_image_url: Optional[str] = None  # Full outfit/dress (replaces top+bottom)
    dress_image_base64: Optional[str] = None
    shoes_image_url: Optional[str] = None
    shoes_image_base64: Optional[str] = None
    accessory_image_url: Optional[str] = None
    accessory_image_base64: Optional[str] = None
    num_samples: int = 4

class HeadshotRequest(BaseModel):
    """Request for headshot/close-up generation"""
    character_name: str
    character_id: str
    reference_image_url: Optional[str] = None
    reference_image_base64: Optional[str] = None
    background: str = "neutral"  # neutral, studio, blurred, none
    expression: str = "neutral"  # neutral, smile, serious, friendly

class FootToHeadRequest(BaseModel):
    """Request for foot-to-head progression shots"""
    character_name: str
    character_id: str
    reference_image_url: Optional[str] = None
    reference_image_base64: Optional[str] = None

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

def preprocess_image(image_bytes: bytes) -> bytes:
    """Preprocess image for AI generation - resize and normalize"""
    try:
        img = Image.open(io.BytesIO(image_bytes))
        # Convert to RGB if needed
        if img.mode != 'RGB':
            img = img.convert('RGB')
        # Resize to reasonable size for API
        max_size = 1024
        if max(img.size) > max_size:
            ratio = max_size / max(img.size)
            new_size = (int(img.size[0] * ratio), int(img.size[1] * ratio))
            img = img.resize(new_size, Image.Resampling.LANCZOS)
        output = io.BytesIO()
        img.save(output, format='PNG')
        return output.getvalue()
    except Exception:
        return image_bytes

def create_clothing_mask(image_bytes: bytes) -> bytes:
    """Create a mask for clothing area - WHITE = inpaint (clothes), BLACK = preserve (face)"""
    # Create 1024x1024 mask - RGB format for inpainting
    mask = Image.new('RGB', (1024, 1024), (0, 0, 0))  # Start all black (preserve all)
    pixels = mask.load()
    
    # Make clothing area WHITE (to be inpainted)
    # Keep top 22% black (face/hair), make middle 68% white (body/clothes), keep bottom 10% black (feet)
    for y in range(220, 900):  # From 22% to 88% (body/clothing area)
        for x in range(1024):
            pixels[x, y] = (255, 255, 255)  # White = inpaint this area
    
    # Save mask as PNG
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
            "enable_safety_checker": False  # Disabled for uncensored output
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
    Generate Pairs Mode image using FLUX.2 Pro Edit with multi-reference support.
    This model can combine multiple images into ONE unified scene.
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
    
    # Upload both base images
    try:
        img1_url = await upload_image_to_fal(char1_base)
        img2_url = await upload_image_to_fal(char2_base)
        print("[PAIRS MODE] Uploaded both character images")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload images: {str(e)}")
    
    # Create prompt that references both images and asks for unified scene
    smart_prompt = f"""Combine these two anime women into ONE unified scene where they are {activity}.

The woman from image 1 has {char1_hair}.
The woman from image 2 has {char2_hair}.

Put them TOGETHER in the SAME room with ONE continuous background.
They should be close together, interacting, {activity}.
Keep their exact faces, hair colors, and distinctive features from the reference images.
Single unified scene, same lighting, high quality anime art."""

    print("[PAIRS MODE] Using FLUX.2 Pro Edit with multi-reference")
    print(f"[PAIRS MODE] Prompt: {smart_prompt[:200]}...")
    
    # Try FLUX.2 Pro Edit with multiple images
    try:
        handler = await fal_client.submit_async(
            "fal-ai/flux-2-pro/edit",
            arguments={
                "image_urls": [img1_url, img2_url],  # Multiple reference images
                "prompt": smart_prompt,
                "num_inference_steps": 40,
                "guidance_scale": 5.0,
                "enable_safety_checker": False
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
                "image_source": "pairs_flux2_pro_edit",
                "base_image_saved": False,
                "model": "fal-ai/flux-2-pro/edit",
                "is_pairs": True,
                "used_reference_images": True,
                "generation_method": "multi_reference_edit",
                "char1_identifier": char1_identifier,
                "char2_identifier": char2_identifier
            }
        else:
            raise HTTPException(status_code=500, detail="No image was generated for pairs mode")
            
    except Exception as e:
        error_msg = str(e)
        print(f"[PAIRS MODE] FLUX.2 Pro Edit failed: {error_msg}")
        
        # Fallback to regular image-to-image with composite
        print("[PAIRS MODE] Falling back to composite approach...")
        return await generate_pairs_fallback(request, char1_base, char2_base, char1_hair, char2_hair, activity, char1_identifier, char2_identifier)


async def generate_pairs_fallback(request, char1_base, char2_base, char1_hair, char2_hair, activity, char1_identifier, char2_identifier):
    """Fallback method using composite image-to-image"""
    
    # Create composite
    img1 = Image.open(io.BytesIO(char1_base)).convert('RGBA')
    img2 = Image.open(io.BytesIO(char2_base)).convert('RGBA')
    
    target_height = 768
    img1_ratio = target_height / img1.height
    img2_ratio = target_height / img2.height
    img1 = img1.resize((int(img1.width * img1_ratio), target_height), Image.Resampling.LANCZOS)
    img2 = img2.resize((int(img2.width * img2_ratio), target_height), Image.Resampling.LANCZOS)
    
    # Significant overlap
    overlap = int(min(img1.width, img2.width) * 0.4)
    total_width = img1.width + img2.width - overlap
    
    composite = Image.new('RGBA', (total_width, target_height), (50, 40, 60, 255))
    composite.paste(img1, (0, 0), img1)
    composite.paste(img2, (img1.width - overlap, 0), img2)
    final_composite = composite.convert('RGB')
    
    composite_buffer = io.BytesIO()
    final_composite.save(composite_buffer, format='PNG')
    composite_url = await upload_image_to_fal(composite_buffer.getvalue())
    
    smart_prompt = f"""Two anime women {activity} in ONE room with unified background.
Left: {char1_hair}. Right: {char2_hair}.
Same room, same lighting, interacting together.
High quality anime art, single unified scene."""

    handler = await fal_client.submit_async(
        "fal-ai/flux/dev/image-to-image",
        arguments={
            "prompt": smart_prompt,
            "image_url": composite_url,
            "strength": 0.55,
            "num_inference_steps": 40,
            "guidance_scale": 4.5,
            "enable_safety_checker": False
        }
    )
    
    result = await handler.get()
    
    if result and result.get("images") and len(result["images"]) > 0:
        generated_image_url = result["images"][0]["url"]
        async with httpx.AsyncClient() as http_client:
            img_response = await http_client.get(generated_image_url, timeout=30.0)
            generated_image_bytes = img_response.content
        
        return {
            "success": True,
            "image_base64": base64.b64encode(generated_image_bytes).decode('utf-8'),
            "prompt_used": smart_prompt,
            "image_source": "pairs_fallback_composite",
            "model": "fal-ai/flux/dev/image-to-image",
            "is_pairs": True,
            "used_reference_images": True,
            "generation_method": "fallback_composite"
        }
    
    raise HTTPException(status_code=500, detail="Pairs generation failed")


async def generate_outfit_image(request: OutfitRequest) -> dict:
    """Generate an image of a character in a specific outfit using Fal.ai image editing"""
    
    if not FAL_KEY:
        raise HTTPException(status_code=500, detail="FAL_KEY not configured")
    
    # For Pairs mode, use the new 3-step blended approach
    if request.is_pairs_mode and request.second_character_name and request.second_character_id:
        return await generate_pairs_image_blended(request)
    
    # Priority system for base images:
    # 1. Uploaded image (reference_image_base64) - highest priority, user just uploaded
    # 2. Nexus API (if reference_image_url provided)
    # 3. Stored base image for this character
    
    base_image_bytes = None
    image_source = None
    
    # Priority 1: Use uploaded image first (user explicitly provided it)
    if request.reference_image_base64:
        base_image_bytes = base64.b64decode(request.reference_image_base64.split(',')[-1])
        image_source = "upload"
        
        # Save uploaded image as base image for this character
        if request.save_as_base:
            save_base_image(request.character_id, base_image_bytes)
    
    # Priority 2: Try Nexus URL if provided
    if not base_image_bytes and request.reference_image_url:
        try:
            base_image_bytes = await download_image(request.reference_image_url)
            image_source = "nexus"
        except Exception:
            pass  # Fall through to next priority
    
    # Priority 3: Try stored base image
    if not base_image_bytes:
        stored_image = get_base_image(request.character_id)
        if stored_image:
            base_image_bytes = stored_image
            image_source = "stored"
    
    if not base_image_bytes:
        raise HTTPException(status_code=400, detail="No reference image available. Please upload a base image.")
    
    # Upload base image to Fal.ai
    try:
        image_url = await upload_image_to_fal(base_image_bytes)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to upload image: {str(e)}")
    
    # Use FLUX Kontext for identity-preserving outfit changes
    prompt = f"""Change the clothing/outfit to: {request.outfit_description}.
Maintain the EXACT same face, same facial features, same hair, same pose.
Only change the clothing. High quality, detailed clothing."""
    
    print(f"[DRESSING ROOM] Character: {request.character_id}")
    print(f"[DRESSING ROOM] Using FLUX Kontext for identity-preserving edit")
    print(f"[DRESSING ROOM] Generating 4 variations...")
    print(f"[DRESSING ROOM] Prompt: {prompt[:80]}...")
    
    try:
        # Generate 4 variations by making parallel requests
        import asyncio
        
        async def generate_single():
            handler = await fal_client.submit_async(
                "fal-ai/flux-pro/kontext",
                arguments={
                    "image_url": image_url,
                    "prompt": prompt,
                }
            )
            return await handler.get()
        
        # Run 4 generations in parallel
        results = await asyncio.gather(
            generate_single(),
            generate_single(),
            generate_single(),
            generate_single(),
            return_exceptions=True
        )
        
        # Collect successful results
        all_images = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                print(f"[DRESSING ROOM] Generation {i+1} failed: {result}")
                continue
            if result and result.get("images") and len(result["images"]) > 0:
                img_url = result["images"][0]["url"]
                try:
                    async with httpx.AsyncClient() as http_client:
                        img_response = await http_client.get(img_url, timeout=30.0)
                        img_response.raise_for_status()
                        img_bytes = img_response.content
                    all_images.append({
                        "image_base64": base64.b64encode(img_bytes).decode('utf-8'),
                        "url": img_url
                    })
                    print(f"[DRESSING ROOM] Generation {i+1} complete")
                except Exception as e:
                    print(f"[DRESSING ROOM] Failed to download image {i+1}: {e}")
        
        if not all_images:
            raise HTTPException(status_code=500, detail="No images were generated")
        
        print(f"[DRESSING ROOM] Total images generated: {len(all_images)}")
        
        return {
            "success": True,
            "image_base64": all_images[0]["image_base64"],  # First image for backwards compatibility
            "images": all_images,  # All images for new UI
            "total_generated": len(all_images),
            "prompt_used": prompt,
            "image_source": image_source,
            "base_image_saved": request.save_as_base and image_source == "upload",
            "model": "fal-ai/flux-pro/kontext"
        }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image generation failed: {str(e)}")


async def generate_tryon_images(request: TryOnRequest) -> dict:
    """Generate virtual try-on images with layered garments.
    Uses FASHN for clothing (dress/top/bottom) and FLUX Kontext for shoes/accessories."""
    
    # Get model (person) image
    if request.model_image_base64:
        model_image_bytes = base64.b64decode(request.model_image_base64)
    elif request.model_image_url:
        model_image_bytes = await download_image(request.model_image_url)
    else:
        raise HTTPException(status_code=400, detail="Model image required (URL or base64)")
    
    # Preprocess model image
    model_image_bytes = preprocess_image(model_image_bytes)
    
    # Upload model image to Fal.ai
    try:
        current_model_url = await upload_image_to_fal(model_image_bytes)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to upload model image: {str(e)}")
    
    # Helper to get garment URL from request
    async def get_garment_url(url: Optional[str], b64: Optional[str]) -> Optional[str]:
        if url:
            return url
        elif b64:
            garment_bytes = base64.b64decode(b64)
            return await upload_image_to_fal(garment_bytes)
        return None
    
    # Collect clothing items (FASHN supported: dress, top, bottom)
    clothing_items = []
    shoes_url = None
    accessory_url = None
    
    # Check for dress first (full outfit)
    dress_url = await get_garment_url(request.dress_image_url, request.dress_image_base64)
    if dress_url:
        clothing_items.append({"url": dress_url, "type": "dress"})
    else:
        # If no dress, check for top and bottom separately
        top_url = await get_garment_url(request.top_image_url, request.top_image_base64)
        if top_url:
            clothing_items.append({"url": top_url, "type": "top"})
        
        bottom_url = await get_garment_url(request.bottom_image_url, request.bottom_image_base64)
        if bottom_url:
            clothing_items.append({"url": bottom_url, "type": "bottom"})
    
    # Get shoes and accessories (will use FLUX Kontext)
    shoes_url = await get_garment_url(request.shoes_image_url, request.shoes_image_base64)
    accessory_url = await get_garment_url(request.accessory_image_url, request.accessory_image_base64)
    
    if not clothing_items and not shoes_url and not accessory_url:
        raise HTTPException(status_code=400, detail="At least one garment image required")
    
    applied_items = []
    final_result_url = current_model_url
    
    # Step 1: Apply clothing items using FASHN v1.6 (better quality)
    for item in clothing_items:
        print(f"[TRYON] Applying {item['type']} using FASHN v1.6...")
        try:
            handler = await fal_client.submit_async(
                "fal-ai/fashn/tryon/v1.6",
                arguments={
                    "model_image": final_result_url,
                    "garment_image": item["url"],
                    "garment_photo_type": "auto",
                    "mode": "quality"
                }
            )
            
            result = await handler.get()
            
            img_url = None
            if result:
                if result.get("image"):
                    img_url = result["image"].get("url") if isinstance(result["image"], dict) else result["image"]
                elif result.get("images") and len(result["images"]) > 0:
                    img_data = result["images"][0]
                    img_url = img_data.get("url") if isinstance(img_data, dict) else img_data
            
            if img_url:
                final_result_url = img_url
                applied_items.append(item['type'])
                print(f"[TRYON] Successfully applied {item['type']}")
            else:
                print(f"[TRYON] Warning: No result for {item['type']}")
                
        except Exception as e:
            print(f"[TRYON] Error applying {item['type']}: {e}")
            continue
    
    # Step 2: Apply shoes using FLUX.2 Pro with multi-image reference
    if shoes_url:
        print(f"[TRYON] Applying shoes using FLUX.2 Pro multi-reference...")
        try:
            # Use FLUX.2 Pro with both images - model and shoes as references
            shoes_prompt = """Take the person from @image1 and put the exact shoes from @image2 on their feet.
Keep everything else exactly the same - same outfit, same pose, same face, same background.
Only replace the footwear with the exact shoes shown in @image2.
Match the shoe design, color, and style precisely. High detail rendering of the shoes."""
            
            handler = await fal_client.submit_async(
                "fal-ai/flux-2-pro/edit",
                arguments={
                    "image_url": [final_result_url, shoes_url],
                    "prompt": shoes_prompt,
                }
            )
            
            result = await handler.get()
            
            if result and result.get("images") and len(result["images"]) > 0:
                final_result_url = result["images"][0]["url"]
                applied_items.append("shoes")
                print(f"[TRYON] Successfully applied shoes with FLUX.2 Pro")
            else:
                print(f"[TRYON] Warning: No result for shoes")
                
        except Exception as e:
            print(f"[TRYON] Error applying shoes: {e}")
    
    # Step 3: Apply accessories using FLUX.2 Pro with multi-image reference
    if accessory_url:
        print(f"[TRYON] Applying accessory using FLUX.2 Pro multi-reference...")
        try:
            accessory_prompt = """Take the person from @image1 and add the exact accessory from @image2.
Keep everything else exactly the same - same outfit, same pose, same face.
Add the accessory from @image2 in a natural position.
Match the accessory design exactly. High detail."""
            
            handler = await fal_client.submit_async(
                "fal-ai/flux-2-pro/edit",
                arguments={
                    "image_url": [final_result_url, accessory_url],
                    "prompt": accessory_prompt,
                }
            )
            
            result = await handler.get()
            
            if result and result.get("images") and len(result["images"]) > 0:
                final_result_url = result["images"][0]["url"]
                applied_items.append("accessory")
                print(f"[TRYON] Successfully applied accessory with FLUX.2 Pro")
            else:
                print(f"[TRYON] Warning: No result for accessory")
                
        except Exception as e:
            print(f"[TRYON] Error applying accessory: {e}")
    
    if not applied_items:
        raise HTTPException(status_code=500, detail="Failed to apply any items. Please try with different images.")
    
    # Download final result
    try:
        async with httpx.AsyncClient() as http_client:
            img_response = await http_client.get(final_result_url, timeout=30.0)
            img_response.raise_for_status()
            final_image_bytes = img_response.content
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to download final image: {str(e)}")
    
    final_base64 = base64.b64encode(final_image_bytes).decode('utf-8')
    
    print(f"[TRYON] Complete! Applied: {', '.join(applied_items)}")
    
    return {
        "success": True,
        "images": [{"image_base64": final_base64, "applied_items": applied_items}],
        "total_generated": 1,
        "applied_items": applied_items,
        "models_used": {
            "clothing": "fal-ai/fashn/tryon/v1.6",
            "shoes_accessories": "fal-ai/flux-pro/kontext"
        }
    }



async def generate_headshot(request: HeadshotRequest) -> dict:
    """Generate a headshot/close-up portrait from a base image"""
    
    # Get base image
    if request.reference_image_base64:
        base_image_bytes = base64.b64decode(request.reference_image_base64)
        image_source = "upload"
    elif request.reference_image_url:
        base_image_bytes = await download_image(request.reference_image_url)
        image_source = "url"
    else:
        raise HTTPException(status_code=400, detail="Reference image required (URL or base64)")
    
    # Preprocess image
    base_image_bytes = preprocess_image(base_image_bytes)
    
    # Upload to Fal.ai
    try:
        image_url = await upload_image_to_fal(base_image_bytes)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to upload image: {str(e)}")
    
    # Build prompt for headshot
    bg_prompts = {
        "neutral": "plain neutral gray background",
        "studio": "professional photography studio background with soft lighting",
        "blurred": "softly blurred bokeh background",
        "none": "same background as original"
    }
    
    expr_prompts = {
        "neutral": "neutral expression",
        "smile": "warm friendly smile",
        "serious": "serious professional expression",
        "friendly": "approachable friendly expression"
    }
    
    background_desc = bg_prompts.get(request.background, bg_prompts["neutral"])
    expression_desc = expr_prompts.get(request.expression, expr_prompts["neutral"])
    
    prompt = f"""Close-up headshot portrait, head and shoulders only, cropped tight to face.
Same person, same face, same hair, same features - just zoomed in as a professional headshot.
{expression_desc}, {background_desc}.
Professional portrait photography style, soft flattering lighting, sharp focus on face.
Perfect for video calls or profile picture."""
    
    print(f"[HEADSHOT] Character: {request.character_id}")
    print(f"[HEADSHOT] Background: {request.background}, Expression: {request.expression}")
    print(f"[HEADSHOT] Generating 4 headshot variations...")
    
    try:
        import asyncio
        
        async def generate_single():
            handler = await fal_client.submit_async(
                "fal-ai/flux-pro/kontext",
                arguments={
                    "image_url": image_url,
                    "prompt": prompt,
                }
            )
            return await handler.get()
        
        # Generate 4 variations in parallel
        results = await asyncio.gather(
            generate_single(),
            generate_single(),
            generate_single(),
            generate_single(),
            return_exceptions=True
        )
        
        # Collect successful results
        all_images = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                print(f"[HEADSHOT] Generation {i+1} failed: {result}")
                continue
            if result and result.get("images") and len(result["images"]) > 0:
                img_url = result["images"][0]["url"]
                try:
                    async with httpx.AsyncClient() as http_client:
                        img_response = await http_client.get(img_url, timeout=30.0)
                        img_response.raise_for_status()
                        img_bytes = img_response.content
                    all_images.append({
                        "image_base64": base64.b64encode(img_bytes).decode('utf-8'),
                        "url": img_url
                    })
                    print(f"[HEADSHOT] Generation {i+1} complete")
                except Exception as e:
                    print(f"[HEADSHOT] Failed to download image {i+1}: {e}")
        
        if not all_images:
            raise HTTPException(status_code=500, detail="No headshot images were generated")
        
        return {
            "success": True,
            "image_base64": all_images[0]["image_base64"],
            "images": all_images,
            "total_generated": len(all_images),
            "model": "fal-ai/flux-pro/kontext"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Headshot generation failed: {str(e)}")



async def generate_foot_to_head(request: FootToHeadRequest) -> dict:
    """Generate 5 progression shots from feet to head - detailed close-ups at each body point"""
    
    # Get base image
    if request.reference_image_base64:
        base_image_bytes = base64.b64decode(request.reference_image_base64)
        image_source = "upload"
    elif request.reference_image_url:
        base_image_bytes = await download_image(request.reference_image_url)
        image_source = "url"
    else:
        raise HTTPException(status_code=400, detail="Reference image required (URL or base64)")
    
    # Preprocess image
    base_image_bytes = preprocess_image(base_image_bytes)
    
    # Upload to Fal.ai
    try:
        image_url = await upload_image_to_fal(base_image_bytes)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to upload image: {str(e)}")
    
    # Define the 5 progression shots
    shots = [
        {
            "name": "shoes_feet",
            "prompt": """Extreme close-up shot of this person's feet and shoes only.
Show detailed view of the footwear - the shoe design, heel, straps, and texture.
Same person, same outfit, just zoomed in tight on the feet/shoes area.
High fashion photography style, sharp focus on the shoes, professional lighting."""
        },
        {
            "name": "legs_knees",
            "prompt": """Close-up shot from knees to feet of this same person.
Show the legs, calves, and how the outfit/dress falls.
Same person, same outfit, cropped to show lower legs to feet.
High fashion photography style, elegant pose, professional lighting."""
        },
        {
            "name": "waist_hips",
            "prompt": """Close-up shot of this same person from waist to knees.
Show the waist, hips, and how the outfit fits the midsection.
Same person, same outfit, cropped to show waist/hip area.
High fashion photography style, flattering angle, professional lighting."""
        },
        {
            "name": "chest_bust",
            "prompt": """Close-up shot of this same person from chest to waist.
Show the bust, shoulders, and upper body details of the outfit.
Same person, same outfit, cropped to show chest/torso area.
High fashion photography style, elegant composition, professional lighting."""
        },
        {
            "name": "headshot",
            "prompt": """Professional headshot close-up of this same person.
Head and shoulders only, capturing face, hair, and expression.
Same person, same styling, tight crop on face.
Professional portrait photography, soft flattering lighting, sharp focus on face."""
        }
    ]
    
    print(f"[FOOT-TO-HEAD] Generating 5 progression shots for {request.character_id}")
    
    all_images = []
    
    # Generate each shot
    import asyncio
    
    async def generate_shot(shot):
        try:
            handler = await fal_client.submit_async(
                "fal-ai/flux-pro/kontext",
                arguments={
                    "image_url": image_url,
                    "prompt": shot["prompt"],
                }
            )
            result = await handler.get()
            
            if result and result.get("images") and len(result["images"]) > 0:
                img_url = result["images"][0]["url"]
                async with httpx.AsyncClient() as http_client:
                    img_response = await http_client.get(img_url, timeout=30.0)
                    img_response.raise_for_status()
                    img_bytes = img_response.content
                return {
                    "name": shot["name"],
                    "image_base64": base64.b64encode(img_bytes).decode('utf-8'),
                    "url": img_url
                }
        except Exception as e:
            print(f"[FOOT-TO-HEAD] Error generating {shot['name']}: {e}")
            return None
    
    # Generate all 5 shots in parallel
    results = await asyncio.gather(*[generate_shot(shot) for shot in shots])
    
    # Collect successful results in order
    for result in results:
        if result:
            all_images.append(result)
            print(f"[FOOT-TO-HEAD] Generated: {result['name']}")
    
    if not all_images:
        raise HTTPException(status_code=500, detail="Failed to generate any progression shots")
    
    print(f"[FOOT-TO-HEAD] Complete! Generated {len(all_images)} shots")
    
    return {
        "success": True,
        "images": all_images,
        "total_generated": len(all_images),
        "shot_names": [img["name"] for img in all_images],
        "model": "fal-ai/flux-pro/kontext"
    }