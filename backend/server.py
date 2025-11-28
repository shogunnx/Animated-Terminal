from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import random

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

class ChatMessage(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str
    character: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class NexusStatus(BaseModel):
    status: str
    mood: str
    energy: str
    active_nodes: int

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@app.on_event("startup")
async def create_indexes():
    await db.status_checks.create_index([("timestamp", -1)])

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks(skip: int = 0, limit: int = 100):
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).sort("timestamp", -1).skip(skip).limit(limit).to_list(limit)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks

# --- NEXUS API ENDPOINTS (MOCKED FOR PROTOTYPE) ---

@api_router.get("/nexus/status", response_model=NexusStatus)
async def get_nexus_status():
    return {
        "status": "ONLINE",
        "mood": random.choice(["Stable", "Fluctuating", "High Energy", "Calculating"]),
        "energy": f"{random.randint(80, 100)}%",
        "active_nodes": random.randint(1000, 5000)
    }

@api_router.get("/chat/{character_id}/history")
async def get_chat_history(character_id: str):
    # In a real app, fetch from DB
    return [
        {"role": "assistant", "content": f"Connection established with {character_id}."},
        {"role": "assistant", "content": "Waiting for input..."}
    ]

@api_router.post("/chat/{character_id}", response_model=ChatResponse)
async def send_chat(character_id: str, chat: ChatMessage):
    # Mock responses based on character
    responses = {
        "victoria_black": [
            "Interesting proposal.",
            "Do not waste my time.",
            "The timeline is fragile, be careful.",
            "I am listening."
        ],
        "wargirl": [
            "Let's fight!",
            "Boring...",
            "Is that all you got?",
            "Hmph."
        ],
        "default": [
            "Processing...",
            "Data received.",
            "Acknowledged."
        ]
    }
    
    reply_text = random.choice(responses.get(character_id, responses["default"]))
    
    return {
        "reply": reply_text,
        "character": character_id,
        "timestamp": datetime.now(timezone.utc)
    }

@api_router.get("/memories/fetch")
async def get_memories(character: str):
    return {
        "memory_id": str(uuid.uuid4()),
        "content": f"Recovered memory fragment for {character}: [REDACTED]",
        "integrity": "85%"
    }

@api_router.get("/memories/relationship")
async def get_relationship(character: str):
    return {
        "target": character,
        "affinity": random.randint(0, 100),
        "status": random.choice(["Neutral", "Ally", "Hostile", "Unknown"])
    }

@api_router.get("/characters/{character_id}/status")
async def get_character_status(character_id: str):
    return {
        "id": character_id,
        "status": "ACTIVE",
        "location": "Sector 7",
        "power_level": random.randint(5000, 90000)
    }

@api_router.get("/videos/latest")
async def get_latest_videos():
    return [
        {"id": "vid_1", "title": "Raid Log 001", "url": "#"},
        {"id": "vid_2", "title": "Training Session", "url": "#"}
    ]

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
