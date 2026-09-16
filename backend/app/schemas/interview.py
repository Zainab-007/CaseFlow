"""
Pydantic schemas for adaptive interview sessions and dynamic questioning engine.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class QuickOptionItem(BaseModel):
    label: str
    hindi: Optional[str] = None
    value: str
    complaint: Optional[str] = None


class AdaptiveQuestion(BaseModel):
    id: str
    question: str
    hindi_question: Optional[str] = None
    audio_hint: Optional[str] = None
    input_type: str = "choice"  # choice, scale, speech_or_choice, text
    field_key: Optional[str] = None
    quick_options: List[Dict[str, Any]] = []
    branch_map: Optional[Dict[str, str]] = None
    next_question: Optional[str] = None
    is_terminal: Optional[bool] = False


class HistoryTurn(BaseModel):
    question_id: str
    question_text: str
    hindi_question: Optional[str] = None
    answer_text: str
    input_mode: str = "touch"


class StartSessionRequest(BaseModel):
    patient_id: str = "CF-PAT-01"
    language: str = "en"
    chief_complaint: Optional[str] = None


class SubmitAnswerRequest(BaseModel):
    answer_text: str
    input_mode: str = "touch"  # touch, voice, text


class AdaptiveSessionState(BaseModel):
    session_id: str
    patient_id: str
    language: str
    chief_complaint: Optional[str] = None
    current_step: int
    total_estimated_steps: int = 7
    completed: bool = False
    current_question: Optional[Dict[str, Any]] = None
    history: List[Dict[str, Any]] = []
    extracted_history: Dict[str, Any]
    red_flags: List[str] = []
    completion_message: Optional[Dict[str, str]] = None


# Backward compatibility schemas
class QuestionResponse(BaseModel):
    question_id: str
    question_text: str
    localized_text: Optional[str] = None
    audio_hint: Optional[str] = None
    quick_options: List[str] = []
    response_type: str = "single_choice"
    is_last: bool = False


class PatientAnswer(BaseModel):
    session_id: str
    question_id: str
    answer_text: str
    input_mode: str = "touch"
    confidence: Optional[float] = 1.0


class InterviewSession(BaseModel):
    session_id: str
    patient_id: str
    language: str = "en"
    current_step: int = 1
    total_steps: int = 6
    is_completed: bool = False

