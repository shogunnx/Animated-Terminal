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

NEXUS_BASE_URL = "https://nexus-multiverse.emergent.host"

@api_router.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"])
async def proxy_to_nexus(request: Request, path: str):
    # Construct the target URL
    # The path here captures everything after /api/
    # e.g. /api/nexus/status -> path="nexus/status"
    # Target: https://nexus-multiverse.emergent.host/api/nexus/status
    
    target_url = f"{NEXUS_BASE_URL}/api/{path}"
    
    logger.info(f"Proxying request: {request.method} {request.url.path} -> {target_url}")
    
    async with httpx.AsyncClient() as client:
        try:
            # Forward headers (excluding host)
            headers = dict(request.headers)
            headers.pop("host", None)
            headers.pop("content-length", None) # Let httpx handle this
            
            # Read body
            body = await request.body()
            
            response = await client.request(
                method=request.method,
                url=target_url,
                headers=headers,
                content=body,
                params=request.query_params,
                timeout=30.0
            )
            
            # Return response
            return Response(
                content=response.content,
                status_code=response.status_code,
                headers=dict(response.headers)
            )
            
        except httpx.RequestError as exc:
            logger.error(f"Proxy error: {exc}")
            raise HTTPException(status_code=502, detail=f"Nexus Proxy Error: {exc}")
        except Exception as exc:
            logger.error(f"Proxy unexpected error: {exc}")
            raise HTTPException(status_code=500, detail=str(exc))

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
