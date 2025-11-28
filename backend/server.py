from fastapi import FastAPI, APIRouter, Request, HTTPException, Response
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
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

@app.get("/")
async def health_check():
    return {"status": "ok", "service": "anime-terminal-backend"}

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Define Models (Keep these for the local status checks if needed)
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

# --- LOCAL ROUTES ---

@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@app.on_event("startup")
async def create_indexes():
    await db.status_checks.create_index([("timestamp", -1)])

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks(skip: int = 0, limit: int = 100):
    status_checks = await db.status_checks.find({}, {"_id": 0}).sort("timestamp", -1).skip(skip).limit(limit).to_list(limit)
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    return status_checks

# --- PROXY TO REAL NEXUS ---

NEXUS_BASE_URL = os.environ.get("NEXUS_BASE_URL", "https://nexus-multiverse.emergent.host").rstrip("/")

proxy_router = APIRouter(prefix="/nexus")

@proxy_router.api_route("/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
async def proxy_to_nexus(path: str, request: Request):
    target_url = f"{NEXUS_BASE_URL}/{path}"

    headers = dict(request.headers)
    headers.pop("host", None)
    headers.pop("content-length", None)

    body = await request.body()

    async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as c:
        r = await c.request(
            method=request.method,
            url=target_url,
            params=dict(request.query_params),
            content=body,
            headers=headers,
        )

    resp_headers = dict(r.headers)
    resp_headers.pop("content-encoding", None)
    resp_headers.pop("transfer-encoding", None)
    resp_headers.pop("connection", None)

    return Response(
        content=r.content,
        status_code=r.status_code,
        headers=resp_headers,
        media_type=r.headers.get("content-type"),
    )

app.include_router(proxy_router)

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
