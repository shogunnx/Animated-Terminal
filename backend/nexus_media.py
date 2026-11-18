import os
import re
import time
import difflib
from typing import Optional

import httpx
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response

router = APIRouter(prefix="/api/nexus-library", tags=["nexus-library"])

_CACHE = {"at": 0.0, "items": []}
_CACHE_TTL = 60
_MAX_BYTES = 25 * 1024 * 1024


def _cfg():
    base = os.environ.get("NEXUS_MEDIA_API_URL", "").rstrip("/")
    token = os.environ.get("NEXUS_MEDIA_TOKEN", "")
    if not base or not token:
        raise HTTPException(status_code=503, detail="Nexus Media Library is not configured on this server")
    return base, {"Authorization": f"Bearer {token}"}


def _is_public_image(item: dict) -> bool:
    return item.get("kind") == "image" and item.get("visibility") == "approved" and item.get("status", "active") == "active"


def _public(item: dict) -> dict:
    aid = item["id"]
    return {
        "id": aid,
        "title": item.get("title") or item.get("filename"),
        "filename": item.get("filename"),
        "description": item.get("description") or "",
        "tags": item.get("tags") or [],
        "characters": item.get("characters") or [],
        "width": item.get("width"),
        "height": item.get("height"),
        "thumb_url": f"/api/nexus-library/file/{aid}?thumb=1",
        "preview_url": f"/api/nexus-library/file/{aid}",
    }


async def _all_items() -> list:
    if time.time() - _CACHE["at"] < _CACHE_TTL:
        return _CACHE["items"]
    base, headers = _cfg()
    items, page = [], 1
    async with httpx.AsyncClient(timeout=20) as c:
        while page <= 10:
            r = await c.get(f"{base}/api/nexus-media", headers=headers,
                            params={"kind": "image", "status": "active", "limit": 100, "page": page})
            if r.status_code != 200:
                raise HTTPException(status_code=502, detail=f"Nexus Media Library returned {r.status_code}")
            data = r.json()
            items.extend(data.get("items", []))
            if page >= (data.get("pages") or 1):
                break
            page += 1
    _CACHE.update(at=time.time(), items=[i for i in items if _is_public_image(i)])
    return _CACHE["items"]


def _norm(s: str) -> str:
    return re.sub(r"[^a-z0-9]", "", (s or "").lower())


def _haystack(i: dict) -> list:
    fields = i.get("fields") or {}
    return [i.get("id", ""), i.get("title", ""), i.get("filename", ""), i.get("description", ""),
            *(i.get("tags") or []), *(i.get("characters") or []), *[str(v) for v in fields.values()]]


def _score(i: dict, q: str) -> float:
    nq = _norm(q)
    best = 0.0
    for h in _haystack(i):
        nh = _norm(h)
        if not nh:
            continue
        if nq in nh:
            return 1.0
        best = max(best, difflib.SequenceMatcher(None, nq, nh).ratio())
    return best


def _char_match(i: dict, character: str) -> bool:
    nc = _norm(character)
    return any(nc in _norm(c) or _norm(c) in nc for c in (i.get("characters") or []) if _norm(c))


@router.get("/media")
async def list_media(q: str = "", character: str = "", page: int = Query(1, ge=1), limit: int = Query(24, ge=1, le=60)):
    items = await _all_items()
    if character:
        items = [i for i in items if _char_match(i, character)]
    fuzzy = False
    if q.strip():
        scored = [(s, i) for i in items if (s := _score(i, q.strip())) >= 0.6]
        fuzzy = bool(scored) and all(s < 1.0 for s, _ in scored)
        items = [i for s, i in sorted(scored, key=lambda x: -x[0])]
    total = len(items)
    start = (page - 1) * limit
    return {
        "items": [_public(i) for i in items[start:start + limit]],
        "total": total,
        "page": page,
        "pages": max(1, -(-total // limit)),
        "fuzzy": fuzzy,
    }


async def _resolve(asset_id: str) -> dict:
    if not re.fullmatch(r"[A-Za-z0-9-]{1,64}", asset_id or ""):
        raise HTTPException(status_code=400, detail="Invalid media asset ID")
    base, headers = _cfg()
    async with httpx.AsyncClient(timeout=20) as c:
        r = await c.get(f"{base}/api/nexus-media/{asset_id}", headers=headers)
    if r.status_code == 404:
        raise HTTPException(status_code=404, detail="Media asset not found")
    if r.status_code != 200:
        raise HTTPException(status_code=502, detail=f"Nexus Media Library returned {r.status_code}")
    item = r.json()
    if not _is_public_image(item):
        raise HTTPException(status_code=403, detail="This media asset is not available")
    return item


async def _download(asset_id: str, thumb: bool = False) -> tuple:
    base, headers = _cfg()
    async with httpx.AsyncClient(timeout=45, follow_redirects=True) as c:
        r = await c.get(f"{base}/api/nexus-media/file/{asset_id}", headers=headers, params={"thumb": 1} if thumb else None)
    if r.status_code != 200 or len(r.content) > _MAX_BYTES:
        raise HTTPException(status_code=502, detail="Could not load the media file from Nexus")
    return r.content, r.headers.get("content-type", "image/jpeg")


async def fetch_asset_bytes(asset_id: str) -> bytes:
    """Securely resolve an approved Nexus asset to its full-size image bytes."""
    await _resolve(asset_id)
    data, _ = await _download(asset_id)
    return data


@router.get("/file/{asset_id}")
async def media_file(asset_id: str, thumb: Optional[int] = 0):
    await _resolve(asset_id)
    data, ctype = await _download(asset_id, bool(thumb))
    return Response(content=data, media_type=ctype, headers={"Cache-Control": "public, max-age=300"})
