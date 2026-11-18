# StoryTime HeyGen wallet / Q&A guard regression tests
import os
import sys
import asyncio
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from dotenv import load_dotenv  # noqa: E402
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))


# Credit status reads real v3 wallet
class TestCreditStatus:
    def test_credit_status_wallet(self):
        r = requests.get(f"{BASE_URL}/api/storytime/credit-status", timeout=30)
        assert r.status_code == 200
        d = r.json()
        print(d)
        assert isinstance(d["remaining_usd"], (int, float))
        assert d["remaining_usd"] < 5
        assert d["estimated_minutes"] == round(d["remaining_usd"] / 1.0, 1)
        assert d["credits_low"] == (d["remaining_usd"] < 1.0)
        assert f"${d['remaining_usd']:.2f}" in d["message"]
        assert "min of video" in d["message"]
        assert "undefined" not in d["message"]


# Status of the known failed video
class TestStatus:
    def test_past_failure_status(self):
        r = requests.get(f"{BASE_URL}/api/storytime/status/2deb532753b3496daf1c0a4a6bab310d", timeout=30)
        assert r.status_code == 200
        d = r.json()["data"]
        print(d)
        assert d["status"] == "failed"
        assert d["error"]["code"] == "MOVIO_PAYMENT_INSUFFICIENT_CREDIT"

    def test_main_agent_qa_video_status(self):
        r = requests.get(f"{BASE_URL}/api/storytime/status/bcb3332c119846b4881d87fe21060ba7", timeout=30)
        assert r.status_code == 200
        print(r.json())
        assert r.json()["data"]["status"] in ("completed", "processing", "pending", "waiting", "failed")


# Unit: wallet guard & max_words (no HeyGen spend, everything stubbed)
class TestQAGuardUnit:
    def _run(self, monkeypatch, balance, words=50, duration=20):
        import storytime_qa
        import heygen_api
        captured = {}

        async def fake_gen(cid, cname, q, vurl, max_words=200):
            captured["max_words"] = max_words
            return " ".join(["word"] * words)

        async def fake_bal():
            return balance

        async def boom(**kw):
            captured["submitted"] = True
            return {"success": True, "video_id": "fake"}

        monkeypatch.setattr(storytime_qa, "generate_character_response", fake_gen)
        monkeypatch.setattr(heygen_api, "get_wallet_balance", fake_bal)
        import storytime
        monkeypatch.setattr(storytime, "_generate_video_with_voice_fallback", boom)
        res = asyncio.get_event_loop().run_until_complete(storytime_qa.create_qa_video(
            character_id="binary", character_name="Binary", question="Hi?",
            avatar_id="d8d16687495340c5805ad9821046be3a", duration=duration))
        return res, captured

    def test_guard_blocks_low_wallet(self, monkeypatch):
        res, cap = self._run(monkeypatch, 0.10, words=50)
        assert cap["max_words"] == 50
        assert res["video_id"] is None
        assert "submitted" not in cap
        assert "$0.10" in res["heygen_error"] and "Top up" in res["heygen_error"]
        assert res["response_text"]

    def test_guard_allows_when_enough(self, monkeypatch):
        res, cap = self._run(monkeypatch, 0.72, words=50)
        assert cap.get("submitted") is True
        assert res["video_id"] == "fake"


# One real Q&A call (spends HeyGen money) - opt-in only
@pytest.mark.skipif(os.environ.get("RUN_REAL_QA") != "1", reason="real HeyGen spend; opt-in")
def test_real_qa_once():
    r = requests.post(f"{BASE_URL}/api/storytime/qa", json={
        "character_id": "binary", "character_name": "Binary",
        "avatar_id": "d8d16687495340c5805ad9821046be3a",
        "question": "Hi?", "duration": 20}, timeout=120)
    print(r.status_code, r.text)
    assert r.status_code == 200
    d = r.json()
    assert d["success"] is True
    assert len(d["response_text"].split()) <= 60
    assert "heygen_error" in d
    assert d["video_id"] or d["heygen_error"]
