"""
Tests for Bilingual (English/Hindi) Adaptive Interview Engine
SIH26047 — AI-Powered Patient Case-Taking System
"""

import pytest
from app.services.interview_engine import (
    AdaptiveInterviewEngine,
    canonical_language,
    COMPLETION_MESSAGES,
    interview_engine,
)
from app.services.base_patient_service import patient_service


def test_canonical_language_normalization():
    assert canonical_language("hi") == "hi"
    assert canonical_language("HI") == "hi"
    assert canonical_language(" Hindi ") == "hi"
    assert canonical_language("हिंदी") == "hi"
    assert canonical_language("hin") == "hi"

    assert canonical_language("en") == "en"
    assert canonical_language("EN") == "en"
    assert canonical_language(" English ") == "en"
    assert canonical_language("en-US") == "en"
    assert canonical_language(None) == "en"
    assert canonical_language("") == "en"
    assert canonical_language("invalid_lang") == "en"


def test_bilingual_symptom_intent_classification():
    engine = AdaptiveInterviewEngine()

    # English phrases
    assert engine.classify_symptom_intent("bleeding from mouth") == "bleeding_onset"
    assert engine.classify_symptom_intent("crushing chest pain") == "chest_character"
    assert engine.classify_symptom_intent("cough with phlegm") == "cough_type"
    assert engine.classify_symptom_intent("high fever and chills") == "fever_pattern"
    assert engine.classify_symptom_intent("throbbing migraine headache") == "headache_type"
    assert engine.classify_symptom_intent("severe abdominal burning pain") == "abdo_site"

    # Hindi (Devanagari) phrases
    assert engine.classify_symptom_intent("उल्टी में खून आ रहा है") == "bleeding_onset"
    assert engine.classify_symptom_intent("छाती में भारीपन और सीने में दर्द") == "chest_character"
    assert engine.classify_symptom_intent("तीन दिन से लगातार खांसी है") == "cough_type"
    assert engine.classify_symptom_intent("तेज़ बुखार और ठंड लग रही है") == "fever_pattern"
    assert engine.classify_symptom_intent("सुबह से तेज़ सिरदर्द हो रहा है") == "headache_type"
    assert engine.classify_symptom_intent("पेट में बहुत तेज़ दर्द है") == "abdo_site"

    # Generic fallback
    assert engine.classify_symptom_intent("unspecified weakness and dizziness") == "generic_onset"


def test_start_session_bilingual_and_completion_message():
    engine = AdaptiveInterviewEngine()

    # Hindi session
    hi_session = engine.start_session(
        patient_id="TEST-PAT-HI",
        language="hi",
        chief_complaint="पेट में दर्द"
    )
    assert hi_session["language"] == "hi"
    assert hi_session["chief_complaint"] == "पेट में दर्द"
    assert hi_session["completed"] is False
    assert hi_session["completion_message"] is None

    # Complete session and verify Hindi completion message
    completed_hi = engine.complete_session(hi_session["session_id"])
    assert completed_hi["completed"] is True
    assert completed_hi["completion_message"] == COMPLETION_MESSAGES["hi"]
    assert "सभी प्रश्न पूरे हो चुके हैं" in completed_hi["completion_message"]["title"]

    # English session
    en_session = engine.start_session(
        patient_id="TEST-PAT-EN",
        language="en",
        chief_complaint="Chest tightness"
    )
    assert en_session["language"] == "en"
    completed_en = engine.complete_session(en_session["session_id"])
    assert completed_en["completed"] is True
    assert completed_en["completion_message"] == COMPLETION_MESSAGES["en"]
    assert "All Questions Completed" in completed_en["completion_message"]["title"]


def test_interview_sync_persists_language_to_patient():
    engine = AdaptiveInterviewEngine()
    test_pid = "TEST-SYNC-PAT-01"

    # Start session with Hindi
    session = engine.start_session(
        patient_id=test_pid,
        language="hi",
        chief_complaint="खांसी और बलगम"
    )

    pat = patient_service._patients.get(test_pid)
    assert pat is not None
    assert pat["language"] == "Hindi"
    assert pat["chief_complaint"] == "खांसी और बलगम"

    # Answer question
    session_res = engine.submit_answer(
        session_id=session["session_id"],
        answer_text="Dry hacking cough",
        input_mode="voice"
    )
    assert session_res["language"] == "hi"
    assert patient_service._patients[test_pid]["language"] == "Hindi"
