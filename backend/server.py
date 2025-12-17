import os
import time
from pathlib import Path
from typing import Optional, Dict, Any

import httpx
import feedparser
from fastapi import FastAPI, Request, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from dotenv import load_dotenv

from dressing_room import generate_outfit_image, OutfitRequest, BaseImageRequest
from teach_mode_routes import router as teach_mode_router
from fastapi import HTTPException
import base64

# DeviantArt Integration
import deviantart

# -----------------------
# Settings
# -----------------------
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env', override=False)

def env(name: str, default: str = "") -> str:
    v = os.environ.get(name)
    return v.strip() if isinstance(v, str) else default

NEXUS_BASE_URL = env("NEXUS_BASE_URL", "https://nexus-multiverse.emergent.host").rstrip("/")
GIRLSMIND_BASE_URL = env("GIRLSMIND_BASE_URL", "").rstrip("/")
GIRLSMIND_API_KEY = env("GIRLSMIND_API_KEY", "")
CORS_ORIGINS = env("CORS_ORIGINS", "*")

# DeviantArt RSS
DEVIANTART_USERNAME = env("DEVIANTART_USERNAME", "")
DEVIANTART_RSS_URL = env("DEVIANTART_RSS_URL", "").strip()

def resolve_deviantart_rss() -> str:
    if DEVIANTART_RSS_URL:
        return DEVIANTART_RSS_URL
    if DEVIANTART_USERNAME:
        return f"https://www.deviantart.com/{DEVIANTART_USERNAME}/rss.xml"
    return ""

# -----------------------
# App init
# -----------------------
app = FastAPI(title="TSV Terminal", version="1.0.0")

if CORS_ORIGINS == "*":
    origins = ["*"]
else:
    origins = [o.strip() for o in CORS_ORIGINS.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api = APIRouter(prefix="/api")

# -----------------------
# Health / Root
# -----------------------
@api.get("/health")
def health():
    return {"status": "ok"}

@api.get("/status")
async def status():
    """
    Pings Nexus/GirlsMind/DeviantArt quickly.
    """
    out: Dict[str, Any] = {
        "ok": True,
        "time": int(time.time()),
        "nexus": {"configured": bool(NEXUS_BASE_URL), "base": NEXUS_BASE_URL},
        "girlsmind": {"configured": bool(GIRLSMIND_BASE_URL), "base": GIRLSMIND_BASE_URL},
        "deviantart": {"configured": bool(resolve_deviantart_rss()), "rss": resolve_deviantart_rss()},
    }

    async def ping(url: str, headers: Optional[dict] = None) -> Dict[str, Any]:
        if not url:
            return {"ok": False, "error": "not_configured"}
        try:
            async with httpx.AsyncClient(timeout=6.0, follow_redirects=True) as c:
                r = await c.get(url, headers=headers)
                return {"ok": r.status_code < 500, "status": r.status_code}
        except Exception as e:
            return {"ok": False, "error": str(e)}

    # Nexus: try root
    out["nexus"]["ping"] = await ping(NEXUS_BASE_URL + "/")
    # GirlsMind: optional
    gm_headers = {"Authorization": f"Bearer {GIRLSMIND_API_KEY}"} if GIRLSMIND_API_KEY else None
    out["girlsmind"]["ping"] = await ping(GIRLSMIND_BASE_URL + "/", headers=gm_headers) if GIRLSMIND_BASE_URL else {"ok": False, "error": "not_configured"}
    # DeviantArt RSS
    out["deviantart"]["ping"] = await ping(resolve_deviantart_rss())

    return out

# -----------------------
# Dressing Room - AI Image Generation
# -----------------------
@api.post("/dressing-room/generate")
async def generate_dressing_room_image(request: OutfitRequest):
    """Generate an outfit image for a character"""
    return await generate_outfit_image(request)

@api.post("/dressing-room/save-base")
async def save_base_image_endpoint(request: BaseImageRequest):
    """Save a base image for a character"""
    from dressing_room import save_base_image
    try:
        image_data = base64.b64decode(request.image_base64.split(',')[-1])
        save_base_image(request.character_id, image_data)
        return {"success": True, "message": f"Base image saved for {request.character_id}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save base image: {str(e)}")

@api.get("/dressing-room/has-base/{character_id}")
async def check_base_image(character_id: str):
    """Check if a character has a stored base image"""
    from dressing_room import has_base_image
    return {"has_base_image": has_base_image(character_id)}

@api.get("/dressing-room/get-base/{character_id}")
async def get_base_image_endpoint(character_id: str):
    """Get stored base image for a character"""
    from dressing_room import get_base_image
    image_data = get_base_image(character_id)
    if image_data:
        image_base64 = base64.b64encode(image_data).decode('utf-8')
        return {"success": True, "image_base64": image_base64}
    else:
        raise HTTPException(status_code=404, detail="No base image found for this character")

# -----------------------
# Generic proxy helper
# -----------------------
async def proxy_request(request: Request, target_base: str, path: str, inject_headers: Optional[dict] = None) -> Response:
    url = f"{target_base}/{path}".rstrip("/")
    headers = dict(request.headers)
    headers.pop("host", None)
    headers.pop("content-length", None)

    if inject_headers:
        headers.update(inject_headers)

    body = await request.body()

    async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as c:
        r = await c.request(
            method=request.method,
            url=url,
            params=dict(request.query_params),
            content=body,
            headers=headers,
        )

    resp_headers = dict(r.headers)
    for h in ["content-encoding", "transfer-encoding", "connection"]:
        resp_headers.pop(h, None)

    return Response(
        content=r.content,
        status_code=r.status_code,
        headers=resp_headers,
        media_type=r.headers.get("content-type"),
    )

# -----------------------
# Nexus proxy
# -----------------------
@api.api_route("/nexus/{path:path}", methods=["GET","POST","PUT","PATCH","DELETE","OPTIONS"])
async def nexus_proxy(path: str, request: Request):
    return await proxy_request(request, NEXUS_BASE_URL, path)

# -----------------------
# Nexus Characters Endpoint
# -----------------------
_characters_cache = {"at": 0, "data": None}

@api.get("/characters")
async def get_characters():
    """Fetch character data from Nexus API with caching"""
    # Cache for 5 minutes
    if _characters_cache["data"] and time.time() - _characters_cache["at"] < 300:
        return _characters_cache["data"]
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as c:
            r = await c.get(f"{NEXUS_BASE_URL}/api/characters")
            r.raise_for_status()
            characters = r.json()
            
            # Transform to frontend format
            transformed = []
            for char in characters:
                transformed.append({
                    "id": char.get("id"),
                    "name": char.get("displayName"),
                    "role": char.get("voice", {}).get("description") if isinstance(char.get("voice"), dict) else str(char.get("voice", ""))[:100],
                    "avatar": char.get("avatar_image"),
                    "accent": "#00ffff",  # Default accent color
                    "subdomain": char.get("subdomain"),
                })
            
            result = {"characters": transformed}
            _characters_cache["at"] = time.time()
            _characters_cache["data"] = result
            return result
            
    except Exception as e:
        return JSONResponse(
            {"error": f"Failed to fetch characters: {str(e)}"},
            status_code=500
        )

# -----------------------
# GirlsMind proxy
# -----------------------
@api.api_route("/girlsmind/{path:path}", methods=["GET","POST","PUT","PATCH","DELETE","OPTIONS"])
async def girlsmind_proxy(path: str, request: Request):
    if not GIRLSMIND_BASE_URL:
        return JSONResponse({"error": "GIRLSMIND_BASE_URL not configured"}, status_code=400)

    inject = {}
    if GIRLSMIND_API_KEY:
        inject["Authorization"] = f"Bearer {GIRLSMIND_API_KEY}"

    return await proxy_request(request, GIRLSMIND_BASE_URL, path, inject_headers=inject)

# -----------------------
# DeviantArt RSS fetch
# -----------------------
_rss_cache = {"at": 0, "data": None}
@api.get("/deviantart/latest")
async def deviantart_latest(limit: int = 10):
    rss = resolve_deviantart_rss()
    if not rss:
        return JSONResponse({"error": "DEVIANTART_USERNAME or DEVIANTART_RSS_URL not configured"}, status_code=400)

    # simple cache to avoid hammering
    if _rss_cache["data"] and time.time() - _rss_cache["at"] < 60:
        data = _rss_cache["data"]
        return {"rss": rss, "items": data[:limit]}

    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        async with httpx.AsyncClient(timeout=12.0, follow_redirects=True) as c:
            r = await c.get(rss, headers=headers)
            r.raise_for_status()
        feed = feedparser.parse(r.text)
    except Exception as e:
        return JSONResponse({"error": f"Failed to fetch DeviantArt RSS: {str(e)}", "rss": rss}, status_code=500)
    items = []
    for e in feed.entries[: max(1, min(50, limit))]:
        items.append({
            "title": getattr(e, "title", ""),
            "link": getattr(e, "link", ""),
            "published": getattr(e, "published", ""),
            "summary": getattr(e, "summary", ""),
            "media_thumbnail": (e.get("media_thumbnail") or [{}])[0].get("url") if isinstance(e.get("media_thumbnail"), list) else None,
        })

    _rss_cache["at"] = time.time()
    _rss_cache["data"] = items
    return {"rss": rss, "items": items[:limit]}

# -----------------------
# DeviantArt OAuth & Posting API
# -----------------------
@api.get("/deviantart/auth-status")
async def deviantart_auth_status():
    """Check if DeviantArt is authenticated"""
    return deviantart.is_authenticated()

@api.get("/deviantart/auth-url")
async def get_deviantart_auth_url():
    """Get DeviantArt OAuth2 authorization URL"""
    return deviantart.get_authorization_url()

@api.get("/deviantart/callback")
async def deviantart_oauth_callback(code: str = None, state: str = None, error: str = None):
    """Handle OAuth2 callback from DeviantArt"""
    if error:
        return JSONResponse({"error": error}, status_code=400)
    
    if not code:
        return JSONResponse({"error": "No authorization code received"}, status_code=400)
    
    await deviantart.exchange_code_for_token(code)
    
    # Return HTML that closes the popup and notifies the parent
    html_response = """
    <!DOCTYPE html>
    <html>
    <head><title>DeviantArt Authorization</title></head>
    <body>
        <h2>Authorization Successful!</h2>
        <p>You can close this window now.</p>
        <script>
            if (window.opener) {{
                window.opener.postMessage({{ type: 'deviantart_auth_success' }}, '*');
                setTimeout(() => window.close(), 1500);
            }}
        </script>
    </body>
    </html>
    """
    return Response(content=html_response, media_type="text/html")

@api.get("/deviantart/galleries")
async def get_deviantart_galleries():
    """Get list of user galleries"""
    galleries = await deviantart.get_user_galleries()
    return {"galleries": galleries}

@api.post("/deviantart/galleries/create")
async def create_deviantart_gallery(request: deviantart.DeviantArtGalleryCreate):
    """Create a new DeviantArt gallery"""
    return await deviantart.create_gallery(request.name, request.description)

@api.post("/deviantart/post-outfit")
async def post_outfit_to_deviantart(request: deviantart.DeviantArtPostRequest):
    """Post a generated outfit to DeviantArt"""
    return await deviantart.post_outfit_to_deviantart(request)

@api.get("/deviantart/view-url/{character_name}")
async def get_deviantart_view_url(character_name: str):
    """Get the DeviantArt gallery URL for a character"""
    return await deviantart.get_deviation_url(character_name)

app.include_router(api)

# StoryTime routes
from storytime import router as storytime_router
app.include_router(storytime_router)

# Mount Teach Mode router
app.include_router(teach_mode_router)
