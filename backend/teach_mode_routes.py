"""
Teach Mode API Routes
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Optional
import logging

from teach_mode import get_recorder, TeachModePlayer

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/teach-mode", tags=["teach-mode"])

class StartRecordingRequest(BaseModel):
    sequence_name: str

class RecordActionRequest(BaseModel):
    action_type: str
    data: Dict

class ReplayRequest(BaseModel):
    sequence_name: str
    variables: Optional[Dict] = None

@router.post("/start-recording")
async def start_recording(request: StartRecordingRequest):
    """Start recording a new teach mode sequence"""
    try:
        recorder = get_recorder()
        recorder.start_recording(request.sequence_name)
        
        return {
            "success": True,
            "message": f"Started recording '{request.sequence_name}'",
            "sequence_name": request.sequence_name
        }
    except Exception as e:
        logger.error(f"Error starting recording: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/record-action")
async def record_action(request: RecordActionRequest):
    """Record a single action during teach mode"""
    try:
        recorder = get_recorder()
        recorder.record_action(request.action_type, request.data)
        
        return {
            "success": True,
            "message": "Action recorded"
        }
    except Exception as e:
        logger.error(f"Error recording action: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/stop-recording")
async def stop_recording():
    """Stop recording and save the sequence"""
    try:
        recorder = get_recorder()
        result = recorder.stop_recording()
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result.get("error", "Not recording"))
        
        return result
    except Exception as e:
        logger.error(f"Error stopping recording: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sequences")
async def get_sequences():
    """Get all saved teach mode sequences"""
    try:
        sequences = TeachModePlayer.get_all_sequences()
        
        return {
            "success": True,
            "sequences": sequences,
            "count": len(sequences)
        }
    except Exception as e:
        logger.error(f"Error getting sequences: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sequences/{sequence_name}")
async def get_sequence(sequence_name: str):
    """Get a specific sequence by name"""
    try:
        sequence = TeachModePlayer.get_sequence(sequence_name)
        
        if not sequence:
            raise HTTPException(status_code=404, detail=f"Sequence '{sequence_name}' not found")
        
        return {
            "success": True,
            "sequence": sequence
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting sequence: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/replay")
async def replay_sequence(request: ReplayRequest):
    """Replay a saved sequence"""
    try:
        result = await TeachModePlayer.replay_sequence(
            sequence_name=request.sequence_name,
            variables=request.variables
        )
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result.get("error", "Replay failed"))
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error replaying sequence: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status")
async def get_status():
    """Get current teach mode status"""
    try:
        recorder = get_recorder()
        
        return {
            "recording": recorder.recording,
            "current_sequence": recorder.current_sequence_name if recorder.recording else None,
            "action_count": len(recorder.actions) if recorder.recording else 0
        }
    except Exception as e:
        logger.error(f"Error getting status: {e}")
        raise HTTPException(status_code=500, detail=str(e))
