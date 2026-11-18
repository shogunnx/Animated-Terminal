# DeviantArt per-visitor OAuth integration tests (auth-url, callback, status, galleries, post-outfit, disconnect)
import os
import hashlib
import secrets
import urllib.parse
from datetime import datetime, timezone, timedelta

import pytest
import requests
from pymongo import MongoClient

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api/deviantart"


def _mongo():
    env = {}
    for line in open("/app/backend/.env"):
        if "=" in line and not line.strip().startswith("#"):
            k, v = line.strip().split("=", 1)
            env[k] = v.strip('"')
    return MongoClient(env["MONGO_URL"])[env.get("DB_NAME", "tsv")]


def _sid():
    return "TEST_" + secrets.token_urlsafe(24)


@pytest.fixture(scope="module")
def db():
    return _mongo()


@pytest.fixture
def fake_session(db):
    sid = _sid()
    h = hashlib.sha256(sid.encode()).hexdigest()
    db.da_sessions.insert_one({"_id": h, "access_token": "TEST_fake", "refresh_token": None, "username": "TEST_user",
                               "expires_at": (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()})
    yield sid, h
    db.da_sessions.delete_one({"_id": h})


# Auth status
def test_auth_status_no_header():
    r = requests.get(f"{API}/auth-status")
    assert r.status_code == 200
    assert r.json() == {"authenticated": False, "username": None}


def test_auth_status_unknown_session():
    r = requests.get(f"{API}/auth-status", headers={"X-DA-Session": _sid()})
    assert r.status_code == 200 and r.json()["authenticated"] is False


def test_auth_status_fake_session(fake_session):
    sid, _ = fake_session
    r = requests.get(f"{API}/auth-status", headers={"X-DA-Session": sid})
    assert r.json() == {"authenticated": True, "username": "TEST_user"}


# Auth URL
def test_auth_url_no_header():
    assert requests.get(f"{API}/auth-url").status_code == 401


def test_auth_url_short_session():
    assert requests.get(f"{API}/auth-url", headers={"X-DA-Session": "short"}).status_code == 401


def test_auth_url_valid(db):
    sid = _sid()
    r = requests.get(f"{API}/auth-url", headers={"X-DA-Session": sid})
    assert r.status_code == 200
    d = r.json()
    q = urllib.parse.parse_qs(urllib.parse.urlparse(d["auth_url"]).query)
    assert d["auth_url"].startswith("https://www.deviantart.com/oauth2/authorize")
    assert q["client_id"] == ["55907"]
    assert q["scope"] == ["user browse stash publish gallery"]
    assert q["response_type"] == ["code"]
    assert q["redirect_uri"] == [f"{BASE_URL}/api/deviantart/callback"]
    assert len(q["state"][0]) > 20
    st = db.da_oauth_states.find_one({"_id": q["state"][0]})
    assert st and st["sid"] == hashlib.sha256(sid.encode()).hexdigest()
    # second call gives a different state
    r2 = requests.get(f"{API}/auth-url", headers={"X-DA-Session": sid}).json()
    s2 = urllib.parse.parse_qs(urllib.parse.urlparse(r2["auth_url"]).query)["state"][0]
    assert s2 != q["state"][0]
    # state is single use: callback with bogus code consumes it
    state = q["state"][0]
    c1 = requests.get(f"{API}/callback", params={"code": "TEST_bogus", "state": state})
    assert db.da_oauth_states.find_one({"_id": state}) is None
    assert "deviantart_auth_error" in c1.text
    c2 = requests.get(f"{API}/callback", params={"code": "TEST_bogus", "state": state})
    assert "expired" in c2.text
    db.da_oauth_states.delete_one({"_id": s2})


# Callback
def test_callback_bogus_state():
    r = requests.get(f"{API}/callback", params={"code": "x", "state": "bogus"})
    assert "text/html" in r.headers["content-type"]
    assert "sign-in link expired" in r.text
    assert "deviantart_auth_error" in r.text
    assert "postMessage" in r.text
    assert "{{" not in r.text


def test_callback_xss_escaped():
    r = requests.get(f"{API}/callback", params={"error": "access_denied", "error_description": "<script>alert(1)</script>"})
    assert "<script>alert(1)</script>" not in r.text
    assert "&lt;script&gt;" in r.text
    assert "deviantart_auth_error" in r.text


# Galleries / post with unknown session
def test_galleries_unknown_session():
    assert requests.get(f"{API}/galleries", headers={"X-DA-Session": _sid()}).status_code == 401


def test_galleries_no_header():
    assert requests.get(f"{API}/galleries").status_code == 401


def test_post_outfit_unknown_session():
    r = requests.post(f"{API}/post-outfit", headers={"X-DA-Session": _sid()},
                      json={"image_base64": "aGVsbG8=", "title": "TEST"})
    assert r.status_code == 401


def test_post_outfit_mature_no_level(fake_session):
    sid, _ = fake_session
    r = requests.post(f"{API}/post-outfit", headers={"X-DA-Session": sid},
                      json={"image_base64": "aGVsbG8=", "title": "TEST", "is_mature": True})
    assert r.status_code == 400
    assert "mature" in r.json()["detail"].lower()


def test_post_outfit_title_too_long(fake_session):
    sid, _ = fake_session
    r = requests.post(f"{API}/post-outfit", headers={"X-DA-Session": sid},
                      json={"image_base64": "aGVsbG8=", "title": "x" * 51})
    assert r.status_code == 422


def test_post_outfit_invalid_b64(fake_session):
    sid, _ = fake_session
    r = requests.post(f"{API}/post-outfit", headers={"X-DA-Session": sid},
                      json={"image_base64": "!!!notb64###", "title": "TEST"})
    assert r.status_code == 400


def test_post_outfit_fake_token_rejected(fake_session, db):
    sid, h = fake_session
    r = requests.post(f"{API}/post-outfit", headers={"X-DA-Session": sid},
                      json={"image_base64": "iVBORw0KGgo=", "title": "TEST", "folder_id": "f2"})
    assert r.status_code in (401, 502)
    if r.status_code == 401:
        assert db.da_sessions.find_one({"_id": h}) is None


def test_galleries_fake_token(fake_session):
    sid, _ = fake_session
    r = requests.get(f"{API}/galleries", headers={"X-DA-Session": sid})
    assert r.status_code in (401, 502)


# Disconnect
def test_disconnect(fake_session, db):
    sid, h = fake_session
    r = requests.post(f"{API}/disconnect", headers={"X-DA-Session": sid})
    assert r.status_code == 200 and r.json()["success"] is True
    assert db.da_sessions.find_one({"_id": h}) is None
    assert requests.get(f"{API}/auth-status", headers={"X-DA-Session": sid}).json()["authenticated"] is False


# View URL
def test_view_url_default():
    r = requests.get(f"{API}/view-url/VixenVictoria")
    assert r.status_code == 200
    assert r.json()["gallery_url"] == "https://www.deviantart.com/TheSaiyanVictoria/gallery"


def test_view_url_with_session(fake_session):
    sid, _ = fake_session
    r = requests.get(f"{API}/view-url/VixenVictoria", headers={"X-DA-Session": sid})
    assert r.json()["gallery_url"] == "https://www.deviantart.com/TEST_user/gallery"
