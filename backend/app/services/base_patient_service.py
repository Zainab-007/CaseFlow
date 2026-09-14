"""
Base Patient Service Interface for CaseFlow.
Handles registration, patient queue retrieval, and record persistence.
Designed to use SQLite for prototype and smoothly migrate to PostgreSQL/SQLAlchemy later.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional


class BasePatientService(ABC):
    """Abstract interface for managing patient clinical intake records."""

    @abstractmethod
    async def create_patient(self, patient_data: Dict[str, Any]) -> Dict[str, Any]:
        """Creates a new patient record or looks up existing ABHA/hospital ID."""
        pass

    @abstractmethod
    async def get_patient_by_id(self, patient_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves patient profile and clinical intake data."""
        pass

    @abstractmethod
    async def get_opd_queue(self, department: Optional[str] = None) -> List[Dict[str, Any]]:
        """Returns the active waiting patient queue for the doctor dashboard."""
        pass

    @abstractmethod
    async def update_verification_status(
        self,
        patient_id: str,
        status: str,
        notes: Optional[str] = None,
        doctor_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Updates review status (verified, edited, rejected) with doctor feedback."""
        pass


class MockPatientService(BasePatientService):
    """In-memory mock implementation for foundation phase."""

    def __init__(self):
        self._queue = [
            {
                "id": "CF-2026-001",
                "queue_token": "OPD-104",
                "name": "Ramesh Chandra Sharma",
                "age": 62,
                "gender": "Male",
                "abha_id": "91-4829-1029-4821",
                "department": "General Medicine",
                "triage_priority": "Priority",
                "chief_complaint": "Persistent productive cough, progressive dyspnea on exertion for 10 days",
                "intake_status": "Completed",
                "red_flag_detected": True,
                "red_flag_note": "Orthopnea and exertional breathlessness in known hypertensive patient",
                "language": "Hindi / English",
                "arrived_at": "10:15 AM",
                "verification_status": "Pending Review"
            },
            {
                "id": "CF-2026-002",
                "queue_token": "OPD-105",
                "name": "Sunita Devi Verma",
                "age": 48,
                "gender": "Female",
                "abha_id": "91-3310-9281-7712",
                "department": "General Medicine",
                "triage_priority": "Routine",
                "chief_complaint": "Epigastric burning sensation and postprandial fullness for 3 weeks",
                "intake_status": "Completed",
                "red_flag_detected": False,
                "red_flag_note": None,
                "language": "Hindi",
                "arrived_at": "10:22 AM",
                "verification_status": "Pending Review"
            },
            {
                "id": "CF-2026-003",
                "queue_token": "OPD-106",
                "name": "Ananya Mukherjee",
                "age": 29,
                "gender": "Female",
                "abha_id": "91-6623-1192-5034",
                "department": "General Medicine",
                "triage_priority": "Routine",
                "chief_complaint": "Low-grade evening fever, generalized malaise, sore throat for 4 days",
                "intake_status": "Completed",
                "red_flag_detected": False,
                "red_flag_note": None,
                "language": "English",
                "arrived_at": "10:35 AM",
                "verification_status": "Pending Review"
            },
            {
                "id": "CF-2026-004",
                "queue_token": "OPD-107",
                "name": "Mohammad Irfan",
                "age": 55,
                "gender": "Male",
                "abha_id": "91-1182-9023-4411",
                "department": "General Medicine",
                "triage_priority": "Urgent",
                "chief_complaint": "Acute retrosternal heaviness radiating to left shoulder, onset 2 hours ago",
                "intake_status": "Completed",
                "red_flag_detected": True,
                "red_flag_note": "⚠️ High Risk: Retrosternal pressure with diaphoresis — immediate triage recommended",
                "language": "Hindi",
                "arrived_at": "10:48 AM",
                "verification_status": "Pending Review"
            }
        ]

    async def create_patient(self, patient_data: Dict[str, Any]) -> Dict[str, Any]:
        new_id = f"CF-2026-{len(self._queue) + 1:03d}"
        record = {**patient_data, "id": new_id, "verification_status": "Pending Review"}
        self._queue.append(record)
        return record

    async def get_patient_by_id(self, patient_id: str) -> Optional[Dict[str, Any]]:
        for p in self._queue:
            if p["id"] == patient_id:
                return p
        return None

    async def get_opd_queue(self, department: Optional[str] = None) -> List[Dict[str, Any]]:
        return self._queue

    async def update_verification_status(
        self,
        patient_id: str,
        status: str,
        notes: Optional[str] = None,
        doctor_id: Optional[str] = None
    ) -> Dict[str, Any]:
        p = await self.get_patient_by_id(patient_id)
        if p:
            p["verification_status"] = status
            p["doctor_notes"] = notes
            p["verified_by"] = doctor_id or "Dr. S. K. Mehta (Reg: MCI-48201)"
            return p
        return {"error": "Patient not found"}
