"""
Pydantic schemas for interview sessions and dynamic questioning engine.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class QuestionResponse(BaseModel):
    question_id: str
    question_text: str
    localized_text: Optional[str] = None
    audio_hint: Optional[str] = None
    quick_options: List[str] = []
    response_type: str = "single_choice"  # single_choice, multi_choice, scale, speech_freeform
    is_last: bool = False


class PatientAnswer(BaseModel):
    session_id: str
    question_id: str
    answer_text: str
    input_mode: str = "touch"  # touch, voice, text
    confidence: Optional[float] = 1.0


class InterviewSession(BaseModel):
    session_id: str
    patient_id: str
    language: str = "hi"
    current_step: int = 1
    total_steps: int = 6
    is_completed: bool = False
