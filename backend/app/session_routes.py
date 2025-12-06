"""FastAPI routes for yoga session management"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from .session_generator import generate_session, get_session_preview
from .body_parts import BODY_PART_POSES

router = APIRouter(prefix="/session", tags=["session"])

# In-memory storage (replace with database in production)
sessions_db: Dict[str, Dict] = {}


class SessionGenerateRequest(BaseModel):
    """Request to generate a new yoga session"""
    pain_areas: List[str] = Field(default=[], description="Body parts experiencing pain")
    improvement_areas: List[str] = Field(default=[], description="Body parts to improve")
    duration_minutes: int = Field(ge=10, le=90, description="Session duration in minutes")


class SessionPose(BaseModel):
    """Individual pose in a session"""
    pose_name: str
    duration: int
    order: int
    is_pain_target: bool = False
    is_improvement_target: bool = False


class SessionResponse(BaseModel):
    """Yoga session response"""
    id: str
    poses: List[SessionPose]
    total_duration: int
    num_poses: int
    pain_areas: List[str]
    improvement_areas: List[str]


class SessionPreviewResponse(BaseModel):
    """Preview of session before generation"""
    estimated_poses: int
    targets_pain: bool
    targets_improvement: bool


class SessionCompleteRequest(BaseModel):
    """Request to mark a session as completed"""
    completed_poses: int = Field(description="Number of poses actually completed")
    total_time: int = Field(description="Actual session duration in seconds")


@router.post("/generate", response_model=SessionResponse)
async def create_session(request: SessionGenerateRequest):
    """
    Generate a personalized yoga session based on user inputs

    Args:
        request: Session generation parameters

    Returns:
        Generated session with pose sequence and durations
    """
    try:
        session = generate_session(
            pain_areas=request.pain_areas,
            improvement_areas=request.improvement_areas,
            duration_minutes=request.duration_minutes
        )

        # Store session in memory
        sessions_db[session['id']] = session

        return session

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate session: {str(e)}")


@router.post("/preview", response_model=SessionPreviewResponse)
async def preview_session(request: SessionGenerateRequest):
    """
    Get a preview of the session without generating it

    Args:
        request: Session parameters

    Returns:
        Preview with estimated pose count
    """
    try:
        preview = get_session_preview(
            pain_areas=request.pain_areas,
            improvement_areas=request.improvement_areas
        )
        return preview

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to preview session: {str(e)}")


@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(session_id: str):
    """
    Retrieve a session by ID

    Args:
        session_id: Session identifier

    Returns:
        Session details
    """
    if session_id not in sessions_db:
        raise HTTPException(status_code=404, detail="Session not found")

    return sessions_db[session_id]


@router.post("/{session_id}/complete")
async def complete_session(session_id: str, request: SessionCompleteRequest):
    """
    Mark a session as completed

    Args:
        session_id: Session identifier
        request: Completion details

    Returns:
        Success message
    """
    if session_id not in sessions_db:
        raise HTTPException(status_code=404, detail="Session not found")

    session = sessions_db[session_id]
    session['completed'] = True
    session['completed_poses'] = request.completed_poses
    session['actual_duration'] = request.total_time

    return {
        "message": "Session completed successfully",
        "session_id": session_id,
        "completed_poses": request.completed_poses,
        "total_poses": session['num_poses']
    }


@router.get("/body-parts/list")
async def list_body_parts():
    """
    Get list of available body parts for selection

    Returns:
        List of body part names
    """
    return {
        "body_parts": list(BODY_PART_POSES.keys())
    }
