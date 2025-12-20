"""
Dressing Room Usage Analytics

Tracks user interactions with the Dressing Room feature and provides summary reports.
"""

import os
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "tsv")

# MongoDB client
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]
usage_collection = db["dressing_room_usage"]

class UsageEvent(BaseModel):
    character_id: str
    character_name: str
    outfit_description: str
    selections: Dict[str, str]  # category -> selected item
    has_second_character: bool = False
    second_character_name: Optional[str] = None
    pair_activity: Optional[str] = None
    generated_successfully: bool = True
    user_agent: Optional[str] = None
    session_id: Optional[str] = None

class UsageEventResponse(BaseModel):
    success: bool
    event_id: str

async def track_usage(event: UsageEvent, ip_address: Optional[str] = None) -> dict:
    """Log a usage event to the database"""
    
    doc = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "character_id": event.character_id,
        "character_name": event.character_name,
        "outfit_description": event.outfit_description,
        "selections": event.selections,
        "has_second_character": event.has_second_character,
        "second_character_name": event.second_character_name,
        "pair_activity": event.pair_activity,
        "generated_successfully": event.generated_successfully,
        "user_agent": event.user_agent,
        "session_id": event.session_id,
        "ip_hash": hash(ip_address) if ip_address else None  # Privacy: only store hash
    }
    
    result = await usage_collection.insert_one(doc)
    
    return {
        "success": True,
        "event_id": str(result.inserted_id)
    }

async def get_analytics_summary(days: int = 30) -> dict:
    """Get analytics summary for the specified time period"""
    
    cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
    cutoff_str = cutoff_date.isoformat()
    
    # Get all events in the time period
    cursor = usage_collection.find(
        {"timestamp": {"$gte": cutoff_str}},
        {"_id": 0}
    )
    events = await cursor.to_list(length=10000)
    
    total_generations = len(events)
    
    if total_generations == 0:
        return {
            "period_days": days,
            "total_generations": 0,
            "unique_sessions": 0,
            "characters_used": {},
            "top_presets": [],
            "top_backgrounds": [],
            "top_positions": [],
            "top_gestures": [],
            "pairs_usage": {"total": 0, "mature": 0, "fun": 0},
            "daily_breakdown": [],
            "recent_activity": []
        }
    
    # Character breakdown
    characters_used = {}
    for e in events:
        char = e.get("character_name", "Unknown")
        characters_used[char] = characters_used.get(char, 0) + 1
    
    # Selection breakdowns
    presets = {}
    backgrounds = {}
    positions = {}
    gestures = {}
    tops = {}
    bottoms = {}
    shoes = {}
    pairs_mature = {}
    pairs_fun = {}
    
    for e in events:
        selections = e.get("selections", {})
        
        if selections.get("presetCostumes"):
            item = selections["presetCostumes"]
            presets[item] = presets.get(item, 0) + 1
        
        if selections.get("backgrounds"):
            item = selections["backgrounds"]
            backgrounds[item] = backgrounds.get(item, 0) + 1
        
        if selections.get("positions"):
            item = selections["positions"]
            positions[item] = positions.get(item, 0) + 1
        
        if selections.get("gestures"):
            item = selections["gestures"]
            gestures[item] = gestures.get(item, 0) + 1
        
        if selections.get("tops"):
            item = selections["tops"]
            tops[item] = tops.get(item, 0) + 1
        
        if selections.get("bottoms"):
            item = selections["bottoms"]
            bottoms[item] = bottoms.get(item, 0) + 1
        
        if selections.get("shoes"):
            item = selections["shoes"]
            shoes[item] = shoes.get(item, 0) + 1
        
        if selections.get("pairsMature"):
            item = selections["pairsMature"]
            pairs_mature[item] = pairs_mature.get(item, 0) + 1
        
        if selections.get("pairsFun"):
            item = selections["pairsFun"]
            pairs_fun[item] = pairs_fun.get(item, 0) + 1
    
    # Sort and get top items
    def top_items(d: dict, n: int = 10) -> List[dict]:
        sorted_items = sorted(d.items(), key=lambda x: x[1], reverse=True)[:n]
        return [{"item": k, "count": v} for k, v in sorted_items]
    
    # Pairs usage summary
    pairs_total = sum(1 for e in events if e.get("has_second_character"))
    pairs_mature_count = sum(1 for e in events if e.get("selections", {}).get("pairsMature"))
    pairs_fun_count = sum(1 for e in events if e.get("selections", {}).get("pairsFun"))
    
    # Daily breakdown
    daily = {}
    for e in events:
        date = e.get("timestamp", "")[:10]  # YYYY-MM-DD
        daily[date] = daily.get(date, 0) + 1
    
    daily_breakdown = [{"date": k, "count": v} for k, v in sorted(daily.items(), reverse=True)][:14]
    
    # Unique sessions
    unique_sessions = len(set(e.get("session_id") for e in events if e.get("session_id")))
    
    # Recent activity (last 20 events)
    recent = sorted(events, key=lambda x: x.get("timestamp", ""), reverse=True)[:20]
    recent_activity = []
    for e in recent:
        recent_activity.append({
            "timestamp": e.get("timestamp"),
            "character": e.get("character_name"),
            "outfit": e.get("outfit_description", "")[:100] + ("..." if len(e.get("outfit_description", "")) > 100 else ""),
            "has_pair": e.get("has_second_character", False)
        })
    
    return {
        "period_days": days,
        "total_generations": total_generations,
        "unique_sessions": unique_sessions,
        "characters_used": characters_used,
        "top_presets": top_items(presets),
        "top_backgrounds": top_items(backgrounds),
        "top_positions": top_items(positions),
        "top_gestures": top_items(gestures),
        "top_tops": top_items(tops),
        "top_bottoms": top_items(bottoms),
        "top_shoes": top_items(shoes),
        "top_pairs_mature": top_items(pairs_mature),
        "top_pairs_fun": top_items(pairs_fun),
        "pairs_usage": {
            "total": pairs_total,
            "mature": pairs_mature_count,
            "fun": pairs_fun_count
        },
        "daily_breakdown": daily_breakdown,
        "recent_activity": recent_activity
    }

async def get_all_events(limit: int = 100, skip: int = 0) -> List[dict]:
    """Get all usage events with pagination"""
    
    cursor = usage_collection.find(
        {},
        {"_id": 0}
    ).sort("timestamp", -1).skip(skip).limit(limit)
    
    events = await cursor.to_list(length=limit)
    total = await usage_collection.count_documents({})
    
    return {
        "events": events,
        "total": total,
        "limit": limit,
        "skip": skip
    }
