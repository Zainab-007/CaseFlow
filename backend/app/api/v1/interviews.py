"""
API endpoints for kiosk adaptive interview sessions.
SIH26047 — AI-Powered Patient Case-Taking System.
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any, Optional
from app.schemas.interview import (
    StartSessionRequest,
    SubmitAnswerRequest,
    AdaptiveSessionState,
    QuestionResponse,
    PatientAnswer,
)
from app.services.interview_engine import interview_engine, QUESTION_TREE

router = APIRouter(prefix="/interviews", tags=["Interviews"])


@router.post("/start", response_model=AdaptiveSessionState)
async def start_adaptive_interview(payload: StartSessionRequest):
    """
    Initialize a new adaptive interview session.
    Starts at the root question: 'What brings you to the doctor today?'
    """
    return interview_engine.start_session(
        patient_id=payload.patient_id,
        language=payload.language
    )


@router.get("/{session_id}", response_model=AdaptiveSessionState)
async def get_session_state(session_id: str):
    """Retrieve the current interview state, active question, and live extracted history."""
    state = interview_engine.get_session(session_id)
    if not state:
        raise HTTPException(status_code=404, detail="Interview session not found")
    return state


@router.post("/{session_id}/respond", response_model=AdaptiveSessionState)
async def submit_patient_response(session_id: str, payload: SubmitAnswerRequest):
    """
    Submit an answer via touch, voice, or text.
    Updates the extracted clinical entities and computes the next adaptive branching question.
    """
    try:
        return interview_engine.submit_answer(
            session_id=session_id,
            answer_text=payload.answer_text,
            input_mode=payload.input_mode
        )
    except KeyError:
        raise HTTPException(status_code=404, detail="Interview session not found")


@router.post("/{session_id}/back", response_model=AdaptiveSessionState)
async def step_back_question(session_id: str):
    """Undo the last answer and return to the previous question."""
    try:
        return interview_engine.step_back(session_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Interview session not found")


@router.post("/{session_id}/complete", response_model=AdaptiveSessionState)
async def complete_interview(session_id: str):
    """Mark the interview complete and prepare structured summary."""
    try:
        return interview_engine.complete_session(session_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Interview session not found")


# Backward-compatible endpoints for initial scaffold
@router.get("/questions/{index}", response_model=QuestionResponse)
async def get_interview_question_legacy(index: int):
    """Legacy question step index."""
    q_keys = list(QUESTION_TREE.keys())
    if 0 <= index < len(q_keys):
        q = QUESTION_TREE[q_keys[index]]
        return {
            "question_id": q["id"],
            "question_text": q["question"],
            "localized_text": q.get("hindi_question"),
            "audio_hint": q.get("audio_hint"),
            "quick_options": [opt["label"] for opt in q.get("quick_options", [])],
            "response_type": q.get("input_type", "choice"),
            "is_last": q.get("is_terminal", False)
        }
    raise HTTPException(status_code=404, detail="Question index out of range")
