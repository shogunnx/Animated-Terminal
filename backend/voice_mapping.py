"""
Persistent avatar -> voice mapping stored in MongoDB.

Overrides the hardcoded AVATAR_VOICE_MAPPING in storytime.py so non-developers
can fix dead voice IDs through the admin UI without a code push.
"""

import os
import logging
import time
from typing import Optional, Dict, List
from datetime import datetime, timezone

from pymongo import MongoClient

logger = logging.getLogger(__name__)

_mongo = MongoClient(os.environ["MONGO_URL"])
_db = _mongo[os.environ.get("DB_NAME", "tsv")]
_col = _db["avatar_voice_mappings"]
_col.create_index("avatar_id", unique=True)

# Tiny in-process cache so we don't hit Mongo on every video request.
_CACHE_TTL_SEC = 30
_cache: Dict[str, str] = {}
_cache_loaded_at: float = 0.0


def _reload_cache() -> None:
    global _cache, _cache_loaded_at
    _cache = {
        doc["avatar_id"]: doc["voice_id"]
        for doc in _col.find({}, {"_id": 0, "avatar_id": 1, "voice_id": 1})
        if doc.get("voice_id")
    }
    _cache_loaded_at = time.time()


def get_voice_for_avatar(avatar_id: str) -> Optional[str]:
    """Return the persisted override voice_id for this avatar, or None."""
    if time.time() - _cache_loaded_at > _CACHE_TTL_SEC:
        try:
            _reload_cache()
        except Exception as e:
            logger.warning(f"voice mapping reload failed: {e}")
    return _cache.get(avatar_id)


def set_voice_for_avatar(avatar_id: str, voice_id: str) -> Dict:
    """Upsert the mapping and invalidate cache."""
    now_iso = datetime.now(timezone.utc).isoformat()
    _col.update_one(
        {"avatar_id": avatar_id},
        {"$set": {"avatar_id": avatar_id, "voice_id": voice_id, "updated_at": now_iso}},
        upsert=True,
    )
    _reload_cache()
    return {"avatar_id": avatar_id, "voice_id": voice_id, "updated_at": now_iso}


def list_all_mappings() -> List[Dict]:
    return list(_col.find({}, {"_id": 0}))


def delete_mapping(avatar_id: str) -> bool:
    res = _col.delete_one({"avatar_id": avatar_id})
    _reload_cache()
    return res.deleted_count > 0


# Prime cache at import time so first request is fast
try:
    _reload_cache()
except Exception as e:
    logger.warning(f"initial voice mapping cache load failed: {e}")
