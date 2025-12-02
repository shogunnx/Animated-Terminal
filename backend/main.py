import os
import time
from pathlib import Path
from typing import Optional, Dict, Any

import httpx
import feedparser
from fastapi import FastAPI, Request, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response, FileResponse
from fastapi.staticfiles import StaticFiles

# -----------------------
# Settings
# -----------------------
def env(name: str, default: str = "") -> str:
    v = os.environ.get(name)
    return v.strip() if isinstance(v, str) else default

NEXUS_BASE_URL = env("NEXUS_BASE_URL", "https://nexus-multiverse.emergent.host").rstrip("/")
GIRLSMIND_BASE_URL = env("GIRLSMIND_BASE_URL", "").rstrip("/")
GIRLSMIND_API_KEY = env("GIRLSMIND_API_KEY", "")
CORS_ORIGINS = env("CORS_ORIGINS", "*")

# DeviantArt: easiest reliable “live” is RSS.
# If you know your DA username, set DEVIANTART_USERNAME.
DEVIANTART_USERNAME = env("DEVIANTART_USERNAME", "")
DEVIANTART_RSS_URL = env("DEVIANTART_RSS_URL", "").strip()

def resolve_deviantart_rss() -> str:
    if DEVIANTART_RSS_URL:
        return DEVIANTART_RSS_URL
    if DEVIANTART_USERNAME:
        # DeviantArt RSS format (commonly works):
        # Note: Some accounts/feeds differ; you can override with DEVIANTART_RSS_URL.
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

    # Nexus: try root (some apps 200), else just check it resolves
    out["nexus"]["ping"] = await ping(NEXUS_BASE_URL + "/")
    # GirlsMind: optional
    gm_headers = {"Authorization": f"Bearer {GIRLSMIND_API_KEY}"} if GIRLSMIND_API_KEY else None
    out["girlsmind"]["ping"] = await ping(GIRLSMIND_BASE_URL + "/", headers=gm_headers) if GIRLSMIND_BASE_URL else {"ok": False, "error": "not_configured"}
    # DeviantArt RSS
    out["deviantart"]["ping"] = await ping(resolve_deviantart_rss())

    # overall ok if backend itself ok; external can fail without killing terminal
    return out

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
    # Example: frontend calls /api/nexus/api/chat/binary ...
    return await proxy_request(request, NEXUS_BASE_URL, path)

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
# DeviantArt RSS fetch (no auth needed)
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

    async with httpx.AsyncClient(timeout=12.0, follow_redirects=True) as c:
        r = await c.get(rss)
        r.raise_for_status()

    feed = feedparser.parse(r.text)
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

app.include_router(api)

# StoryTime routes
try:
    from routes.storytime import router as storytime_router
    app.include_router(storytime_router)
    print("✅ StoryTime routes loaded successfully")
except Exception as e:
    print(f"❌ Failed to load StoryTime routes: {e}")
    import traceback
    traceback.print_exc()

# -----------------------
# Serve frontend (self-contained)
# -----------------------
# In local dev/preview, we might not have frontend_dist if we are running separately.
# But for the "One-service deploy", we expect it at /app/frontend_dist (from Dockerfile)
# OR we can look in /app/frontend/dist if we built it locally.

DIST = Path("/app/frontend_dist")
if not DIST.exists():
    DIST = Path("/app/frontend/dist")

ASSETS = DIST / "assets"
INDEX = DIST / "index.html"

if ASSETS.exists():
    app.mount("/assets", StaticFiles(directory=str(ASSETS)), name="assets")

@app.get("/")
def spa_root():
    if INDEX.exists():
        return FileResponse(str(INDEX))
    return JSONResponse({"status": "ok", "note": "frontend not built"}, status_code=200)

@app.get("/{full_path:path}")
def spa_fallback(full_path: str):
    # serve file if exists in dist, else return index.html for SPA routing
    candidate = DIST / full_path
    if candidate.exists() and candidate.is_file():
        return FileResponse(str(candidate))
    if INDEX.exists():
        return FileResponse(str(INDEX))
    return JSONResponse({"status": "ok", "note": "frontend not built"}, status_code=200)
