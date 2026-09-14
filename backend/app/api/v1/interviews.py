"""
API endpoints for kiosk adaptive interview sessions.
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from app.schemas.interview import QuestionResponse, PatientAnswer

router = APIRouter(prefix="/interviews", tags=["Interviews"])

# Mock conversational question bank for kiosk interview flow
MOCK_QUESTIONS = [
    {
        "question_id": "q1",
        "question_text": "What is the primary discomfort or symptom bringing you to the hospital today?",
        "localized_text": "आज अस्पताल आने का आपका मुख्य कारण या तकलीफ़ क्या है?",
        "audio_hint": "Please speak clearly or tap one of the common reasons below.",
        "quick_options": ["Cough & Cold", "Chest Pain", "Stomach Ache", "Fever", "Headache", "Body Ache"],
        "response_type": "speech_or_choice",
        "is_last": False
    },
    {
        "question_id": "q2",
        "question_text": "How long have you been experiencing this problem?",
        "localized_text": "आपको यह परेशानी कितने समय से हो रही है?",
        "audio_hint": "Select the duration or tell us in days or weeks.",
        "quick_options": ["Started Today", "2 to 3 Days", "1 Week", "2 to 4 Weeks", "More than a Month"],
        "response_type": "single_choice",
        "is_last": False
    },
    {
        "question_id": "q3",
        "question_text": "How severe is your discomfort right now?",
        "localized_text": "इस समय आपको कितनी तकलीफ़ या दर्द महसूस हो रहा है?",
        "audio_hint": "Tap the level that matches how you feel.",
        "quick_options": ["Mild (Noticeable)", "Moderate (Affects Work)", "Severe (Hard to Manage)", "Extreme"],
        "response_type": "scale",
        "is_last": False
    },
    {
        "question_id": "q4",
        "question_text": "Do you have any known long-term health conditions?",
        "localized_text": "क्या आपको पहले से कोई पुरानी बीमारी या समस्या है?",
        "audio_hint": "Select all that apply.",
        "quick_options": ["Diabetes (Sugar)", "High BP", "Asthma / Breathing Issue", "Heart Condition", "None"],
        "response_type": "multi_choice",
        "is_last": False
    },
    {
        "question_id": "q5",
        "question_text": "Are you currently taking any daily medicines or have any medicine allergies?",
        "localized_text": "क्या आप रोज़ाना कोई दवाई लेते हैं या किसी दवाई से एलर्जी है?",
        "audio_hint": "Speak your medicines or tap the closest option.",
        "quick_options": ["Taking BP/Sugar Meds", "Taking Inhaler", "Allergic to Penicillin/Sulfa", "No Regular Meds"],
        "response_type": "speech_or_choice",
        "is_last": True
    }
]


@router.get("/questions/{index}", response_model=QuestionResponse)
async def get_interview_question(index: int):
    """Retrieve interview question step for kiosk intake."""
    if 0 <= index < len(MOCK_QUESTIONS):
        return MOCK_QUESTIONS[index]
    raise HTTPException(status_code=404, detail="Question step not found")


@router.post("/respond")
async def record_patient_response(answer: PatientAnswer):
    """Record patient touch/voice response for session."""
    return {
        "status": "recorded",
        "question_id": answer.question_id,
        "input_mode": answer.input_mode,
        "extracted_entity": f"Acknowledge: {answer.answer_text}"
    }
