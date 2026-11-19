import os
import re
import time
import difflib
from typing import Optional

import base64
from collections import defaultdict, deque
from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import Response
from pydantic import BaseModel, Field

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
    return item.get("kind") == "image" and item.get("visibility") in ("approved", "public") and item.get("status", "active") == "active"


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
    try:
        return await _fetch_all_items()
    except httpx.HTTPError:
        if _CACHE["items"]:
            return _CACHE["items"]
        raise HTTPException(status_code=502, detail="Can't reach the Nexus Media Library right now. Please try again in a moment.")


async def _fetch_all_items() -> list:
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
    try:
        async with httpx.AsyncClient(timeout=20) as c:
            r = await c.get(f"{base}/api/nexus-media/{asset_id}", headers=headers)
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="Can't reach the Nexus Media Library right now. Please try again in a moment.")
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
    try:
        async with httpx.AsyncClient(timeout=45, follow_redirects=True) as c:
            r = await c.get(f"{base}/api/nexus-media/file/{asset_id}", headers=headers, params={"thumb": 1} if thumb else None)
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="Could not load the media file from Nexus")
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


_SUBMIT_LIMIT = 10
_SUBMIT_WINDOW = 3600
_submits = defaultdict(deque)


class LibrarySubmission(BaseModel):
    image: str
    character_id: str = Field(max_length=80)
    character_name: str = Field(max_length=80)
    mode: str = Field("outfit", max_length=30)
    outfit: str = Field("", max_length=3000)
    items: dict = {}
    source_asset_id: Optional[str] = Field(None, max_length=64)
    submitter_name: str = Field("", max_length=60)
    note: str = Field("", max_length=500)


def _client_ip(request: Request) -> str:
    fwd = request.headers.get("x-forwarded-for", "")
    return fwd.split(",")[0].strip() or (request.client.host if request.client else "unknown")


def _check_rate(ip: str) -> None:
    q, now = _submits[ip], time.time()
    while q and now - q[0] > _SUBMIT_WINDOW:
        q.popleft()
    if len(q) >= _SUBMIT_LIMIT:
        wait = int((_SUBMIT_WINDOW - (now - q[0])) / 60) + 1
        raise HTTPException(status_code=429, detail=f"You've sent {_SUBMIT_LIMIT} outfits this hour. Try again in about {wait} min.")
    q.append(now)


async def _image_bytes(image: str) -> bytes:
    try:
        data = base64.b64decode(image.split(",")[-1], validate=True)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image data")
    if len(data) > _MAX_BYTES:
        raise HTTPException(status_code=400, detail="Image is too large")
    if not (data.startswith(b"\x89PNG") or data.startswith(b"\xff\xd8") or (data[:4] == b"RIFF" and data[8:12] == b"WEBP")):
        raise HTTPException(status_code=400, detail="Only PNG, JPEG or WEBP images can be sent")
    return data


async def _nexus_upload(data: bytes, filename: str, meta: dict) -> dict:
    base, headers = _cfg()
    async with httpx.AsyncClient(timeout=60) as c:
        r = await c.post(f"{base}/api/nexus-media/uploads", headers=headers, json={"filename": filename, "size": len(data)})
        if r.status_code != 200:
            raise HTTPException(status_code=502, detail=f"Nexus upload failed ({r.status_code})")
        up = r.json()
        for i in range(up["chunks"]):
            chunk = data[i * up["chunk_size"]:(i + 1) * up["chunk_size"]]
            cr = await c.put(f"{base}/api/nexus-media/uploads/{up['upload_id']}/chunk/{i}", headers=headers, content=chunk)
            if cr.status_code != 200:
                raise HTTPException(status_code=502, detail=f"Nexus upload chunk {i + 1} failed")
        done = await c.post(f"{base}/api/nexus-media/uploads/{up['upload_id']}/complete", headers=headers, json=meta)
    if done.status_code != 200:
        raise HTTPException(status_code=502, detail=f"Nexus upload could not be completed ({done.status_code})")
    return done.json().get("asset", {})


@router.post("/submit")
async def submit_to_library(body: LibrarySubmission, request: Request):
    """Send a generated outfit to Nexus as a private asset awaiting admin approval."""
    data = await _image_bytes(body.image)
    _check_rate(_client_ip(request))
    ext = "jpg" if data.startswith(b"\xff\xd8") else "webp" if data[:4] == b"RIFF" else "png"
    stamp = datetime.now(timezone.utc)
    items = {k: str(v)[:200] for k, v in (body.items or {}).items() if v and isinstance(v, (str, int, float))}
    item_text = "; ".join(f"{k}: {v}" for k, v in items.items())
    by = body.submitter_name.strip() or "Anonymous visitor"
    description = "\n".join(x for x in [
        f"Terminal DressingRoom submission ({body.mode}) for {body.character_name}.",
        f"Outfit: {body.outfit.strip()}" if body.outfit.strip() else "",
        f"Selections: {item_text}" if item_text else "",
        f"Source Nexus asset: {body.source_asset_id}" if body.source_asset_id else "",
        f"Submitted by: {by}",
        f"Note: {body.note.strip()}" if body.note.strip() else "",
        f"Submitted at: {stamp.isoformat()}",
    ] if x)
    meta = {
        "title": f"{body.character_name} outfit by {by}"[:120],
        "description": description,
        "tags": ["terminal-submission", "pending-approval", f"mode-{body.mode}"],
        "characters": [body.character_name],
        "visibility": "private",
        "fields": {
            "clothing": (body.outfit.strip() or item_text)[:500],
            "pose": items.get("positions") or items.get("villainessPoses") or "",
            "location": items.get("backgrounds", ""),
            "purpose": "Terminal visitor submission awaiting approval",
        },
    }
    asset = await _nexus_upload(data, f"tsv-{body.character_id}-{int(stamp.timestamp())}.{ext}", meta)
    return {"success": True, "asset_id": asset.get("id"), "status": "pending_approval"}
