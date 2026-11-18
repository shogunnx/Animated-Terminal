"""DeviantArt integration: each visitor connects their own DA account and posts to their own gallery."""

import os
import re
import json
import html
import base64
import hashlib
import secrets
import urllib.parse
from datetime import datetime, timezone, timedelta
from typing import Optional, List

import httpx
from fastapi import APIRouter, HTTPException, Request, Header
from fastapi.responses import HTMLResponse
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/deviantart", tags=["deviantart"])

DA_AUTH_URL = "https://www.deviantart.com/oauth2/authorize"
DA_TOKEN_URL = "https://www.deviantart.com/oauth2/token"
DA_API = "https://www.deviantart.com/api/v1/oauth2"
DA_SCOPES = "user browse stash publish gallery"
UA = {"User-Agent": "TSVTerminal/1.0", "dA-minor-version": "20240701"}

_db = AsyncIOMotorClient(os.environ["MONGO_URL"])[os.environ.get("DB_NAME", "tsv")]
_sessions = _db["da_sessions"]
_states = _db["da_oauth_states"]


def _creds():
    cid, secret = os.environ.get("DEVIANTART_CLIENT_ID", ""), os.environ.get("DEVIANTART_CLIENT_SECRET", "")
    if not cid or not secret:
        raise HTTPException(status_code=503, detail="DeviantArt is not configured on this server")
    return cid, secret


def _redirect_uri(request: Request) -> str:
    env_uri = os.environ.get("DEVIANTART_REDIRECT_URI", "").strip()
    if env_uri:
        return env_uri
    proto = request.headers.get("x-forwarded-proto", request.url.scheme).split(",")[0].strip()
    host = request.headers.get("x-forwarded-host") or request.headers.get("host") or request.url.netloc
    return f"{proto}://{host.split(',')[0].strip()}/api/deviantart/callback"


def _hash(session_id: str) -> str:
    if not session_id or not re.fullmatch(r"[A-Za-z0-9_-]{20,128}", session_id):
        raise HTTPException(status_code=401, detail="Connect your DeviantArt account first")
    return hashlib.sha256(session_id.encode()).hexdigest()


async def _token_request(data: dict) -> dict:
    async with httpx.AsyncClient(timeout=30) as c:
        r = await c.post(DA_TOKEN_URL, data=data, headers=UA)
    body = r.json() if r.headers.get("content-type", "").startswith("application/json") else {}
    if r.status_code != 200 or body.get("status") == "error":
        raise HTTPException(status_code=401, detail=body.get("error_description") or "DeviantArt sign-in failed. Please connect again.")
    return body


async def _store_tokens(sid_hash: str, tok: dict, username: Optional[str] = None):
    doc = {
        "access_token": tok["access_token"],
        "refresh_token": tok.get("refresh_token"),
        "expires_at": (datetime.now(timezone.utc) + timedelta(seconds=int(tok.get("expires_in", 3600)) - 60)).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    if username:
        doc["username"] = username
    await _sessions.update_one({"_id": sid_hash}, {"$set": doc}, upsert=True)


async def _access_token(sid_hash: str) -> str:
    doc = await _sessions.find_one({"_id": sid_hash})
    if not doc:
        raise HTTPException(status_code=401, detail="Connect your DeviantArt account first")
    if datetime.fromisoformat(doc["expires_at"]) > datetime.now(timezone.utc):
        return doc["access_token"]
    if not doc.get("refresh_token"):
        await _sessions.delete_one({"_id": sid_hash})
        raise HTTPException(status_code=401, detail="Your DeviantArt session expired. Please connect again.")
    cid, secret = _creds()
    try:
        tok = await _token_request({"grant_type": "refresh_token", "client_id": cid, "client_secret": secret, "refresh_token": doc["refresh_token"]})
    except HTTPException:
        await _sessions.delete_one({"_id": sid_hash})
        raise HTTPException(status_code=401, detail="Your DeviantArt session expired. Please connect again.")
    await _store_tokens(sid_hash, tok)
    return tok["access_token"]


async def _da(method: str, path: str, sid_hash: str, **kw) -> dict:
    token = await _access_token(sid_hash)
    async with httpx.AsyncClient(timeout=120) as c:
        r = await c.request(method, f"{DA_API}{path}", headers={**UA, "Authorization": f"Bearer {token}"}, **kw)
    body = r.json() if r.headers.get("content-type", "").startswith("application/json") else {}
    if r.status_code == 401:
        await _sessions.delete_one({"_id": sid_hash})
        raise HTTPException(status_code=401, detail="DeviantArt rejected your session. Please connect again.")
    if r.status_code != 200 or body.get("status") == "error":
        raise HTTPException(status_code=502, detail=f"DeviantArt: {body.get('error_description') or body.get('error') or r.status_code}")
    return body


@router.get("/auth-url")
async def auth_url(request: Request, x_da_session: str = Header("")):
    cid, _ = _creds()
    sid_hash = _hash(x_da_session)
    state = secrets.token_urlsafe(24)
    redirect = _redirect_uri(request)
    await _states.insert_one({"_id": state, "sid": sid_hash, "redirect_uri": redirect, "created_at": datetime.now(timezone.utc).isoformat()})
    params = {"client_id": cid, "redirect_uri": redirect, "response_type": "code", "scope": DA_SCOPES, "state": state}
    return {"auth_url": f"{DA_AUTH_URL}?{urllib.parse.urlencode(params)}", "redirect_uri": redirect}


def _popup_html(ok: bool, message: str) -> HTMLResponse:
    payload = json.dumps({"type": "deviantart_auth_success" if ok else "deviantart_auth_error", "message": message}).replace("<", "\\u003c")
    message = html.escape(message)
    color = "#00FF88" if ok else "#ff6b6b"
    return HTMLResponse(f"""<!DOCTYPE html><html><head><title>DeviantArt</title></head>
<body style="background:#05060f;color:{color};font-family:monospace;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center">
<div><h2>{'Connected to DeviantArt' if ok else 'DeviantArt connection failed'}</h2><p style="color:#ccc">{message}</p></div>
<script>try{{if(window.opener){{window.opener.postMessage({payload},"*");setTimeout(function(){{window.close()}},1200);}}}}catch(e){{}}</script>
</body></html>""", status_code=200 if ok else 400)


@router.get("/callback")
async def callback(code: Optional[str] = None, state: Optional[str] = None, error: Optional[str] = None, error_description: Optional[str] = None):
    if error:
        return _popup_html(False, error_description or error)
    st = await _states.find_one_and_delete({"_id": state or ""})
    if not code or not st:
        return _popup_html(False, "This sign-in link expired. Close this window and press Connect again.")
    cid, secret = _creds()
    try:
        tok = await _token_request({"grant_type": "authorization_code", "client_id": cid, "client_secret": secret,
                                    "redirect_uri": st["redirect_uri"], "code": code})
        async with httpx.AsyncClient(timeout=30) as c:
            who = (await c.get(f"{DA_API}/user/whoami", headers={**UA, "Authorization": f"Bearer {tok['access_token']}"})).json()
    except HTTPException as e:
        return _popup_html(False, e.detail)
    await _store_tokens(st["sid"], tok, who.get("username"))
    return _popup_html(True, f"Signed in as {who.get('username', 'your account')}. You can close this window.")


@router.get("/auth-status")
async def auth_status(x_da_session: str = Header("")):
    if not x_da_session:
        return {"authenticated": False, "username": None}
    doc = await _sessions.find_one({"_id": _hash(x_da_session)})
    return {"authenticated": bool(doc), "username": doc.get("username") if doc else None}


@router.post("/disconnect")
async def disconnect(x_da_session: str = Header("")):
    await _sessions.delete_one({"_id": _hash(x_da_session)})
    return {"success": True}


@router.get("/galleries")
async def galleries(x_da_session: str = Header("")):
    sid = _hash(x_da_session)
    folders, offset = [], 0
    while offset is not None and len(folders) < 200:
        data = await _da("GET", "/gallery/folders", sid, params={"limit": 50, "offset": offset, "calculate_size": "false"})
        folders += [{"folderid": f["folderid"], "name": f["name"]} for f in data.get("results", [])]
        offset = data.get("next_offset") if data.get("has_more") else None
    return {"galleries": folders}


class DeviantArtPostRequest(BaseModel):
    image_base64: str
    title: str = Field(min_length=1, max_length=50)
    description: str = Field("", max_length=5000)
    tags: List[str] = []
    folder_id: Optional[str] = None
    new_folder_name: Optional[str] = Field(None, max_length=50)
    is_mature: bool = False
    mature_level: Optional[str] = None
    mature_classification: List[str] = []
    allow_comments: bool = True
    noai: bool = True


def _clean_tags(tags: List[str]) -> List[str]:
    out = []
    for t in tags:
        t = re.sub(r"[^A-Za-z0-9_]", "", t.replace(" ", "_").replace("-", "_"))[:50]
        if t and t.lower() not in [o.lower() for o in out]:
            out.append(t)
    return out[:30]


@router.post("/post-outfit")
async def post_outfit(body: DeviantArtPostRequest, x_da_session: str = Header("")):
    sid = _hash(x_da_session)
    if body.is_mature and body.mature_level not in ("moderate", "strict"):
        raise HTTPException(status_code=400, detail="Pick a mature level (moderate or strict)")
    try:
        image = base64.b64decode(body.image_base64.split(",")[-1], validate=True)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image data")
    ext, mime = ("jpg", "image/jpeg") if image.startswith(b"\xff\xd8") else ("png", "image/png")

    folder_id = body.folder_id
    if not folder_id and body.new_folder_name:
        created = await _da("POST", "/gallery/folders/create", sid, data={"folder": body.new_folder_name.strip()})
        folder_id = created.get("folderid")

    tags = _clean_tags(body.tags)
    stash = await _da("POST", "/stash/submit", sid,
                      files={"file": (f"outfit.{ext}", image, mime)},
                      data={"title": body.title, "artist_comments": body.description, "is_ai_generated": "true",
                            "noai": "true" if body.noai else "false", **{f"tags[{i}]": t for i, t in enumerate(tags)}})
    if not stash.get("itemid"):
        raise HTTPException(status_code=502, detail="DeviantArt did not accept the upload")

    publish = {"itemid": stash["itemid"], "is_mature": "true" if body.is_mature else "false", "is_ai_generated": "true",
               "noai": "true" if body.noai else "false", "allow_comments": "true" if body.allow_comments else "false",
               "agree_tos": "true", "agree_submission": "true"}
    if body.is_mature:
        publish["mature_level"] = body.mature_level
        for i, c in enumerate([c for c in body.mature_classification if c in ("nudity", "sexual", "gore", "language", "ideology")]):
            publish[f"mature_classification[{i}]"] = c
    if folder_id:
        publish["galleryids[0]"] = folder_id
    result = await _da("POST", "/stash/publish", sid, data=publish)
    return {"success": True, "deviation_url": result.get("url"), "deviationid": result.get("deviationid"), "folder_id": folder_id}


@router.get("/view-url/{character_name}")
async def view_url(character_name: str, x_da_session: str = Header("")):
    username = os.environ.get("DEVIANTART_USERNAME", "")
    if x_da_session:
        doc = await _sessions.find_one({"_id": _hash(x_da_session)})
        username = (doc or {}).get("username") or username
    return {"gallery_url": f"https://www.deviantart.com/{username}/gallery", "profile_url": f"https://www.deviantart.com/{username}"}
