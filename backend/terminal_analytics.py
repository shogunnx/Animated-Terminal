"""
Terminal Usage Analytics

Tracks user interactions across the entire TSV Terminal application.
Records page visits, clicks, navigation patterns, and engagement metrics.
"""

import os
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from dotenv import load_dotenv
from uuid import uuid4

load_dotenv()

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "tsv")

# MongoDB client
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]
events_collection = db["terminal_events"]
sessions_collection = db["terminal_sessions"]


class TerminalEvent(BaseModel):
    """Model for tracking terminal events"""
    event_type: str  # page_view, click, navigation, feature_use, etc.
    page: str  # Current page/section
    element: Optional[str] = None  # Button/element clicked
    details: Optional[Dict[str, Any]] = None  # Additional context
    session_id: Optional[str] = None
    user_agent: Optional[str] = None


class SessionStart(BaseModel):
    """Model for starting a new session"""
    user_agent: Optional[str] = None
    referrer: Optional[str] = None
    screen_width: Optional[int] = None
    screen_height: Optional[int] = None


async def start_session(data: SessionStart, ip_address: Optional[str] = None) -> dict:
    """Create a new tracking session"""
    session_id = str(uuid4())
    
    doc = {
        "session_id": session_id,
        "started_at": datetime.now(timezone.utc).isoformat(),
        "last_activity": datetime.now(timezone.utc).isoformat(),
        "ip_address": ip_address,
        "user_agent": data.user_agent,
        "referrer": data.referrer,
        "screen_width": data.screen_width,
        "screen_height": data.screen_height,
        "page_views": 0,
        "clicks": 0,
        "features_used": []
    }
    
    await sessions_collection.insert_one(doc)
    
    return {"session_id": session_id}


async def track_event(event: TerminalEvent, ip_address: Optional[str] = None) -> dict:
    """Log a terminal event"""
    
    doc = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "event_type": event.event_type,
        "page": event.page,
        "element": event.element,
        "details": event.details or {},
        "session_id": event.session_id,
        "user_agent": event.user_agent,
        "ip_address": ip_address
    }
    
    result = await events_collection.insert_one(doc)
    
    # Update session stats if session_id provided
    if event.session_id:
        update_fields = {"last_activity": datetime.now(timezone.utc).isoformat()}
        
        if event.event_type == "page_view":
            update_fields["$inc"] = {"page_views": 1}
        elif event.event_type == "click":
            update_fields["$inc"] = {"clicks": 1}
        elif event.event_type == "feature_use":
            update_fields["$addToSet"] = {"features_used": event.page}
        
        if "$inc" in update_fields or "$addToSet" in update_fields:
            inc_fields = update_fields.pop("$inc", {})
            add_fields = update_fields.pop("$addToSet", {})
            await sessions_collection.update_one(
                {"session_id": event.session_id},
                {"$set": update_fields, "$inc": inc_fields, "$addToSet": add_fields}
            )
        else:
            await sessions_collection.update_one(
                {"session_id": event.session_id},
                {"$set": update_fields}
            )
    
    return {"success": True, "event_id": str(result.inserted_id)}


async def get_analytics_summary(days: int = 7) -> dict:
    """Get analytics summary for the terminal"""
    
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    cutoff_str = cutoff.isoformat()
    
    # Total events
    total_events = await events_collection.count_documents(
        {"timestamp": {"$gte": cutoff_str}}
    )
    
    # Total sessions
    total_sessions = await sessions_collection.count_documents(
        {"started_at": {"$gte": cutoff_str}}
    )
    
    # Page views by page
    page_views_pipeline = [
        {"$match": {"timestamp": {"$gte": cutoff_str}, "event_type": "page_view"}},
        {"$group": {"_id": "$page", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 20}
    ]
    page_views_cursor = events_collection.aggregate(page_views_pipeline)
    page_views = await page_views_cursor.to_list(length=20)
    
    # Clicks by element
    clicks_pipeline = [
        {"$match": {"timestamp": {"$gte": cutoff_str}, "event_type": "click"}},
        {"$group": {"_id": {"page": "$page", "element": "$element"}, "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 20}
    ]
    clicks_cursor = events_collection.aggregate(clicks_pipeline)
    clicks = await clicks_cursor.to_list(length=20)
    
    # Feature usage
    feature_pipeline = [
        {"$match": {"timestamp": {"$gte": cutoff_str}, "event_type": "feature_use"}},
        {"$group": {"_id": "$page", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    feature_cursor = events_collection.aggregate(feature_pipeline)
    features = await feature_cursor.to_list(length=10)
    
    # Events by day
    daily_pipeline = [
        {"$match": {"timestamp": {"$gte": cutoff_str}}},
        {"$addFields": {"date": {"$substr": ["$timestamp", 0, 10]}}},
        {"$group": {"_id": "$date", "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}}
    ]
    daily_cursor = events_collection.aggregate(daily_pipeline)
    daily_events = await daily_cursor.to_list(length=30)
    
    # Events by hour (for today)
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    hourly_pipeline = [
        {"$match": {"timestamp": {"$gte": today}}},
        {"$addFields": {"hour": {"$substr": ["$timestamp", 11, 2]}}},
        {"$group": {"_id": "$hour", "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}}
    ]
    hourly_cursor = events_collection.aggregate(hourly_pipeline)
    hourly_events = await hourly_cursor.to_list(length=24)
    
    # Recent activity
    recent_cursor = events_collection.find(
        {"timestamp": {"$gte": cutoff_str}},
        {"_id": 0, "timestamp": 1, "event_type": 1, "page": 1, "element": 1}
    ).sort("timestamp", -1).limit(50)
    recent_events = await recent_cursor.to_list(length=50)
    
    # Character popularity (from page views to dressing room)
    character_pipeline = [
        {"$match": {
            "timestamp": {"$gte": cutoff_str}, 
            "event_type": "page_view",
            "page": {"$regex": "^/dressing-room/"}
        }},
        {"$addFields": {"character": {"$arrayElemAt": [{"$split": ["$page", "/"]}, 2]}}},
        {"$group": {"_id": "$character", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    character_cursor = events_collection.aggregate(character_pipeline)
    popular_characters = await character_cursor.to_list(length=10)
    
    return {
        "period_days": days,
        "total_events": total_events,
        "total_sessions": total_sessions,
        "page_views": [{"page": p["_id"], "count": p["count"]} for p in page_views],
        "top_clicks": [{"page": c["_id"]["page"], "element": c["_id"]["element"], "count": c["count"]} for c in clicks],
        "feature_usage": [{"feature": f["_id"], "count": f["count"]} for f in features],
        "daily_events": [{"date": d["_id"], "count": d["count"]} for d in daily_events],
        "hourly_events": [{"hour": h["_id"], "count": h["count"]} for h in hourly_events],
        "recent_activity": recent_events,
        "popular_characters": [{"character": c["_id"], "visits": c["count"]} for c in popular_characters]
    }


async def get_live_stats() -> dict:
    """Get real-time stats (last 5 minutes)"""
    
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=5)
    cutoff_str = cutoff.isoformat()
    
    # Active sessions (activity in last 5 min)
    active_sessions = await sessions_collection.count_documents(
        {"last_activity": {"$gte": cutoff_str}}
    )
    
    # Recent events count
    recent_events = await events_collection.count_documents(
        {"timestamp": {"$gte": cutoff_str}}
    )
    
    # Current pages being viewed
    current_pages_pipeline = [
        {"$match": {"timestamp": {"$gte": cutoff_str}, "event_type": "page_view"}},
        {"$group": {"_id": "$page", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 5}
    ]
    current_cursor = events_collection.aggregate(current_pages_pipeline)
    current_pages = await current_cursor.to_list(length=5)
    
    return {
        "active_sessions": active_sessions,
        "events_last_5min": recent_events,
        "current_pages": [{"page": p["_id"], "viewers": p["count"]} for p in current_pages],
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
