# Nexus Media Library proxy endpoints (list/search/file/security). No paid generation here.
import os
import requests
import pytest

BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or os.environ.get("PREVIEW_URL")).rstrip("/")
TARGET = "44c17bfd-e3aa-4cd9-97fc-ca6f7fdbadf8"
PRIVATE = "c730bf19-57b9-4d5b-be4f-79fb4c88a267"


@pytest.fixture(scope="module")
def s():
    return requests.Session()


# Listing: only approved images
def test_list_all(s):
    r = s.get(f"{BASE_URL}/api/nexus-library/media", timeout=60)
    assert r.status_code == 200
    d = r.json()
    assert d["total"] >= 1 and isinstance(d["items"], list)
    titles = [i["title"] for i in d["items"]]
    assert "TemporalVixen rooftop test" not in titles
    assert PRIVATE not in [i["id"] for i in d["items"]]
    for i in d["items"]:
        assert i["thumb_url"].startswith("/api/nexus-library/file/")
    print("total", d["total"], titles)


# Fuzzy search
def test_fuzzy_search(s):
    r = s.get(f"{BASE_URL}/api/nexus-library/media", params={"q": "temporalposing"}, timeout=60)
    assert r.status_code == 200
    d = r.json()
    assert d["fuzzy"] is True
    assert TARGET in [i["id"] for i in d["items"]]


def test_exact_search_title(s):
    d = s.get(f"{BASE_URL}/api/nexus-library/media", params={"q": "temporalvixenpose1"}, timeout=60).json()
    assert d["items"][0]["id"] == TARGET and d["fuzzy"] is False


def test_search_by_asset_id(s):
    d = s.get(f"{BASE_URL}/api/nexus-library/media", params={"q": TARGET[:8]}, timeout=60).json()
    assert TARGET in [i["id"] for i in d["items"]]


def test_search_empty(s):
    d = s.get(f"{BASE_URL}/api/nexus-library/media", params={"q": "zzzzqqq"}, timeout=60).json()
    assert d["total"] == 0 and d["items"] == []


def test_pagination(s):
    d = s.get(f"{BASE_URL}/api/nexus-library/media", params={"limit": 2, "page": 1}, timeout=60).json()
    assert len(d["items"]) <= 2 and d["pages"] == max(1, -(-d["total"] // 2))
    bad = s.get(f"{BASE_URL}/api/nexus-library/media", params={"page": 0}, timeout=60)
    assert bad.status_code == 422


# File proxy
def test_thumb(s):
    r = s.get(f"{BASE_URL}/api/nexus-library/file/{TARGET}", params={"thumb": 1}, timeout=60)
    assert r.status_code == 200 and r.headers["content-type"].startswith("image/") and len(r.content) > 1000


def test_full(s):
    r = s.get(f"{BASE_URL}/api/nexus-library/file/{TARGET}", timeout=90)
    assert r.status_code == 200 and r.headers["content-type"].startswith("image/")


def test_private_403(s):
    r = s.get(f"{BASE_URL}/api/nexus-library/file/{PRIVATE}", timeout=60)
    assert r.status_code == 403


def test_invalid_id(s):
    r = s.get(f"{BASE_URL}/api/nexus-library/file/abc..x", timeout=30)
    assert r.status_code == 400
    r2 = s.get(f"{BASE_URL}/api/nexus-library/file/abc%2F..%2Fx", timeout=30)
    assert r2.status_code in (400, 404)


def test_unknown_id_404(s):
    r = s.get(f"{BASE_URL}/api/nexus-library/file/00000000-0000-0000-0000-000000000000", timeout=30)
    assert r.status_code == 404


# Generation with private asset must be refused before any paid call
def test_generate_private_asset_rejected(s):
    r = s.post(f"{BASE_URL}/api/dressing-room/generate", json={
        "character_id": "vixen_victoria", "character_name": "Vixen Victoria", "character_description": "TEST_",
        "outfit_description": "TEST_ red dress", "nexus_asset_id": PRIVATE}, timeout=60)
    assert r.status_code == 403, r.text


# Generation with malformed asset id rejected (400) before paid call
def test_generate_invalid_asset_rejected(s):
    r = s.post(f"{BASE_URL}/api/dressing-room/generate", json={
        "character_id": "vixen_victoria", "character_name": "Vixen Victoria", "character_description": "TEST_",
        "outfit_description": "TEST_ red dress", "nexus_asset_id": "abc/../x"}, timeout=60)
    assert r.status_code == 400, r.text
