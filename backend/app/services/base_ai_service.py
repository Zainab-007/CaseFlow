"""
Base AI Service Interface for CaseFlow.
Follows modular service design: do NOT hardcode to any specific LLM provider.
Future implementations can integrate OpenAI, Anthropic, Gemini, Groq, Ollama, or local models.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional


class BaseAIService(ABC):
    """
    Abstract contract for clinical AI interactions.
    Handles dynamic questioning, clinical NLP extraction, and clinical summarization.
    
    IMPORTANT: System operates strictly as a clinical documentation assistant.
    Must never make definitive autonomous diagnosis or prescriptive decisions.
    """

    @abstractmethod
    async def generate_next_question(
        self,
        chief_complaint: str,
        conversation_history: List[Dict[str, str]],
        language: str = "en",
        extracted_entities: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Dynamically determine the next relevant clinical question based on prior responses.
        Returns question text, localized audio prompt hint, quick choice options, and completion status.
        """
        pass

    @abstractmethod
    async def extract_clinical_entities(
        self,
        raw_transcript: str,
        language: str = "en"
    ) -> Dict[str, Any]:
        """
        Converts patient's natural language responses into structured clinical entities:
        - Chief Complaint
        - History of Present Illness (HPI) (onset, duration, severity, character, triggers)
        - Associated Symptoms
        - Past Medical / Surgical History
        - Current Medications & Allergies
        """
        pass

    @abstractmethod
    async def generate_clinical_summary(
        self,
        patient_data: Dict[str, Any],
        documents_data: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Synthesizes structured history and prior records into a doctor-ready clinical brief.
        Includes auditable source tagging (patient-reported vs document-extracted).
        """
        pass


class MockAIService(BaseAIService):
    """Placeholder mock implementation for foundation phase."""

    async def generate_next_question(
        self,
        chief_complaint: str,
        conversation_history: List[Dict[str, str]],
        language: str = "en",
        extracted_entities: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        return {
            "question_id": "q_mock_001",
            "question_text": "How many days have you been experiencing this symptom?",
            "localized_text": "आपको यह लक्षण कितने दिनों से महसूस हो रहा है?",
            "quick_options": ["1-2 days", "3-5 days", "1-2 weeks", "More than a month"],
            "allow_free_speech": True,
            "is_last_question": False
        }

    async def extract_clinical_entities(
        self,
        raw_transcript: str,
        language: str = "en"
    ) -> Dict[str, Any]:
        return {
            "chief_complaint": "Persistent cough with mild breathlessness",
            "duration": "5 days",
            "severity": "Moderate",
            "source": "patient-reported"
        }

    async def generate_clinical_summary(
        self,
        patient_data: Dict[str, Any],
        documents_data: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        return {
            "brief_summary": "Patient reports 5-day history of productive cough and exertion-related breathlessness. No fever reported.",
            "source_attribution": ["patient-reported", "document-extracted"],
            "verification_status": "pending_doctor_review"
        }
