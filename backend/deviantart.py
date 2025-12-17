"""
DeviantArt Integration for TSV Dressing Room

Handles OAuth2 authentication and posting generated outfits to DeviantArt galleries.
"""

import os
import base64
import httpx
from typing import Optional, List
from fastapi import HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
import urllib.parse

load_dotenv()

# DeviantArt OAuth2 Configuration
DEVIANTART_CLIENT_ID = os.environ.get("DEVIANTART_CLIENT_ID", "")
DEVIANTART_CLIENT_SECRET = os.environ.get("DEVIANTART_CLIENT_SECRET", "")
DEVIANTART_REDIRECT_URI = os.environ.get("DEVIANTART_REDIRECT_URI", "")
DEVIANTART_USERNAME = os.environ.get("DEVIANTART_USERNAME", "")

# OAuth2 Endpoints
DA_AUTH_URL = "https://www.deviantart.com/oauth2/authorize"
DA_TOKEN_URL = "https://www.deviantart.com/oauth2/token"
DA_API_BASE = "https://www.deviantart.com/api/v1/oauth2"

# Token storage (in production, use database)
_token_storage = {
    "access_token": None,
    "refresh_token": None,
    "expires_in": None
}

class DeviantArtAuthRequest(BaseModel):
    code: str

class DeviantArtPostRequest(BaseModel):
    image_base64: str
    character_name: str
    title: str
    description: Optional[str] = None
    is_mature: Optional[bool] = False
    tags: Optional[List[str]] = None

class DeviantArtGalleryCreate(BaseModel):
    name: str
    description: Optional[str] = None

def get_headers():
    """Get headers with access token"""
    if not _token_storage["access_token"]:
        raise HTTPException(status_code=401, detail="DeviantArt not authenticated. Please authorize first.")
    
    return {
        "Authorization": f"Bearer {_token_storage['access_token']}",
        "User-Agent": "TSVTerminal/1.0"
    }

def get_authorization_url() -> dict:
    """Generate OAuth2 authorization URL"""
    if not DEVIANTART_CLIENT_ID:
        raise HTTPException(status_code=500, detail="DEVIANTART_CLIENT_ID not configured")
    
    if not DEVIANTART_REDIRECT_URI:
        raise HTTPException(status_code=500, detail="DEVIANTART_REDIRECT_URI not configured")
    
    params = {
        "client_id": DEVIANTART_CLIENT_ID,
        "redirect_uri": DEVIANTART_REDIRECT_URI,
        "response_type": "code",
        "scope": "user.manage browse gallery",
        "state": "tsv_dressing_room"
    }
    
    auth_url = f"{DA_AUTH_URL}?{urllib.parse.urlencode(params)}"
    
    return {
        "auth_url": auth_url,
        "client_id": DEVIANTART_CLIENT_ID,
        "redirect_uri": DEVIANTART_REDIRECT_URI
    }

async def exchange_code_for_token(code: str) -> dict:
    """Exchange authorization code for access token"""
    if not DEVIANTART_CLIENT_ID or not DEVIANTART_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="DeviantArt credentials not configured")
    
    data = {
        "grant_type": "authorization_code",
        "client_id": DEVIANTART_CLIENT_ID,
        "client_secret": DEVIANTART_CLIENT_SECRET,
        "redirect_uri": DEVIANTART_REDIRECT_URI,
        "code": code
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            DA_TOKEN_URL,
            data=data,
            headers={"User-Agent": "TSVTerminal/1.0"},
            timeout=30.0
        )
        
        if response.status_code != 200:
            error_detail = response.text
            raise HTTPException(status_code=400, detail=f"Token exchange failed: {error_detail}")
        
        token_data = response.json()
        
        # Store tokens
        _token_storage["access_token"] = token_data.get("access_token")
        _token_storage["refresh_token"] = token_data.get("refresh_token")
        _token_storage["expires_in"] = token_data.get("expires_in")
        
        return {
            "success": True,
            "message": "DeviantArt authorization successful!",
            "expires_in": token_data.get("expires_in")
        }

async def refresh_access_token() -> dict:
    """Refresh the access token using refresh token"""
    if not _token_storage["refresh_token"]:
        raise HTTPException(status_code=401, detail="No refresh token available. Please re-authorize.")
    
    data = {
        "grant_type": "refresh_token",
        "client_id": DEVIANTART_CLIENT_ID,
        "client_secret": DEVIANTART_CLIENT_SECRET,
        "refresh_token": _token_storage["refresh_token"]
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            DA_TOKEN_URL,
            data=data,
            headers={"User-Agent": "TSVTerminal/1.0"},
            timeout=30.0
        )
        
        if response.status_code != 200:
            _token_storage["access_token"] = None
            _token_storage["refresh_token"] = None
            raise HTTPException(status_code=401, detail="Token refresh failed. Please re-authorize.")
        
        token_data = response.json()
        _token_storage["access_token"] = token_data.get("access_token")
        _token_storage["refresh_token"] = token_data.get("refresh_token")
        _token_storage["expires_in"] = token_data.get("expires_in")
        
        return {"success": True, "message": "Token refreshed"}

def is_authenticated() -> dict:
    """Check if DeviantArt is authenticated"""
    return {
        "authenticated": _token_storage["access_token"] is not None,
        "username": DEVIANTART_USERNAME if _token_storage["access_token"] else None
    }

async def get_user_galleries() -> List[dict]:
    """Get list of user's galleries"""
    headers = get_headers()
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{DA_API_BASE}/gallery/folders",
                headers=headers,
                params={"username": DEVIANTART_USERNAME, "limit": 50},
                timeout=30.0
            )
            
            if response.status_code == 401:
                # Try to refresh token
                await refresh_access_token()
                headers = get_headers()
                response = await client.get(
                    f"{DA_API_BASE}/gallery/folders",
                    headers=headers,
                    params={"username": DEVIANTART_USERNAME, "limit": 50},
                    timeout=30.0
                )
            
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail=f"Failed to fetch galleries: {response.text}")
            
            data = response.json()
            galleries = data.get("results", [])
            
            return [{
                "folderid": g.get("folderid"),
                "name": g.get("name"),
                "size": g.get("size", 0)
            } for g in galleries]
            
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="DeviantArt API timeout")

async def create_gallery(name: str, description: Optional[str] = None) -> dict:
    """Create a new gallery folder"""
    headers = get_headers()
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{DA_API_BASE}/gallery/folders/create",
                headers=headers,
                data={
                    "folder": name,
                    "description": description or f"AI-generated outfits for {name}"
                },
                timeout=30.0
            )
            
            if response.status_code == 401:
                await refresh_access_token()
                headers = get_headers()
                response = await client.post(
                    f"{DA_API_BASE}/gallery/folders/create",
                    headers=headers,
                    data={
                        "folder": name,
                        "description": description or f"AI-generated outfits for {name}"
                    },
                    timeout=30.0
                )
            
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail=f"Failed to create gallery: {response.text}")
            
            data = response.json()
            return {
                "success": True,
                "folderid": data.get("folderid"),
                "name": name
            }
            
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="DeviantArt API timeout")

async def find_or_create_character_gallery(character_name: str) -> str:
    """Find existing gallery for character or create one"""
    galleries = await get_user_galleries()
    
    # Normalize character name for comparison
    normalized_name = character_name.lower().replace("_", " ")
    
    for gallery in galleries:
        if gallery["name"].lower() == normalized_name:
            return gallery["folderid"]
    
    # Gallery not found, create it
    result = await create_gallery(character_name.replace("_", " ").title())
    return result["folderid"]

async def upload_deviation(image_base64: str, title: str, gallery_id: str, description: Optional[str] = None, tags: Optional[List[str]] = None, is_mature: bool = False) -> dict:
    """Upload an image to DeviantArt using stash then publish"""
    headers = get_headers()
    
    # Decode base64 image
    if "," in image_base64:
        image_base64 = image_base64.split(",")[1]
    
    image_bytes = base64.b64decode(image_base64)
    
    async with httpx.AsyncClient() as client:
        try:
            # Step 1: Upload to stash
            files = {
                "file": ("outfit.png", image_bytes, "image/png")
            }
            
            stash_response = await client.post(
                f"{DA_API_BASE}/stash/submit",
                headers={**headers},
                files=files,
                data={
                    "title": title,
                    "artist_comments": description or "AI-generated outfit from TSV Terminal Dressing Room",
                    "tags": ",".join(tags) if tags else "ai-art,digital-art,character,outfit"
                },
                timeout=120.0
            )
            
            if stash_response.status_code == 401:
                await refresh_access_token()
                headers = get_headers()
                stash_response = await client.post(
                    f"{DA_API_BASE}/stash/submit",
                    headers={**headers},
                    files=files,
                    data={
                        "title": title,
                        "artist_comments": description or "AI-generated outfit from TSV Terminal Dressing Room",
                        "tags": ",".join(tags) if tags else "ai-art,digital-art,character,outfit"
                    },
                    timeout=120.0
                )
            
            if stash_response.status_code != 200:
                raise HTTPException(status_code=stash_response.status_code, detail=f"Stash upload failed: {stash_response.text}")
            
            stash_data = stash_response.json()
            itemid = stash_data.get("itemid")
            
            if not itemid:
                raise HTTPException(status_code=500, detail="No stash item ID returned")
            
            # Step 2: Publish from stash to gallery
            publish_response = await client.post(
                f"{DA_API_BASE}/stash/publish",
                headers=headers,
                data={
                    "itemid": itemid,
                    "is_mature": "1" if is_mature else "0",
                    "agree_tos": "1",
                    "agree_submission": "1",
                    "catpath": "digitalart/drawings",
                    "galleryids[]": gallery_id
                },
                timeout=60.0
            )
            
            if publish_response.status_code != 200:
                raise HTTPException(status_code=publish_response.status_code, detail=f"Publish failed: {publish_response.text}")
            
            publish_data = publish_response.json()
            
            return {
                "success": True,
                "deviation_url": publish_data.get("url"),
                "deviationid": publish_data.get("deviationid"),
                "message": f"Successfully posted to DeviantArt!"
            }
            
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="Upload timeout. Please try again.")

async def post_outfit_to_deviantart(request: DeviantArtPostRequest) -> dict:
    """Main function to post an outfit to DeviantArt"""
    
    # Find or create gallery for the character
    gallery_id = await find_or_create_character_gallery(request.character_name)
    
    # Upload the deviation
    result = await upload_deviation(
        image_base64=request.image_base64,
        title=request.title,
        gallery_id=gallery_id,
        description=request.description,
        tags=request.tags,
        is_mature=request.is_mature
    )
    
    return result

async def get_deviation_url(character_name: str) -> dict:
    """Get DeviantArt gallery URL for a character"""
    username = DEVIANTART_USERNAME
    # Format gallery name for URL (lowercase, spaces to dashes)
    gallery_slug = character_name.lower().replace("_", "-").replace(" ", "-")
    
    return {
        "gallery_url": f"https://www.deviantart.com/{username}/gallery/0/{gallery_slug}",
        "profile_url": f"https://www.deviantart.com/{username}"
    }

# Manual token setter for persistent tokens (loaded from env)
def set_tokens_from_env():
    """Load tokens from environment if available"""
    access_token = os.environ.get("DEVIANTART_ACCESS_TOKEN")
    refresh_token = os.environ.get("DEVIANTART_REFRESH_TOKEN")
    
    if access_token:
        _token_storage["access_token"] = access_token
    if refresh_token:
        _token_storage["refresh_token"] = refresh_token

# Initialize tokens on module load
set_tokens_from_env()
