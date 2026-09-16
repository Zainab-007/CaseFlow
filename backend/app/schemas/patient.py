"""
Pydantic schemas for patient demographics, registration, and queue records.
Designed with ABDM/FHIR alignment in mind.
"""

from typing import Optional, List, Any
from pydantic import BaseModel, Field


class PatientBase(BaseModel):
    name: str = Field(..., example="Ramesh Chandra Sharma")
    age: int = Field(..., ge=0, le=125, example=62)
    gender: str = Field(..., example="Male")
    phone: Optional[str] = Field(None, example="9876543210")
    abha_id: Optional[str] = Field(None, example="91-4829-1029-4821")
    preferred_language: str = Field(default="Hindi", example="Hindi")
    language: Optional[str] = Field(default="en", example="en")
    department: str = Field(default="General Medicine", example="General Medicine")
    chief_complaint: Optional[str] = Field(None, example="Headache")


class PatientCreate(PatientBase):
    consent_obtained: bool = Field(True, description="Explicit DPDP Act 2023 & ABDM consent")


class PatientQueueItem(BaseModel):
    id: str
    queue_token: str
    name: str
    age: int
    gender: str
    abha_id: Optional[str] = None
    department: str
    triage_priority: str  # Urgent, Priority, Routine
    chief_complaint: str
    intake_status: str
    red_flag_detected: bool = False
    red_flag_note: Optional[str] = None
    language: str
    arrived_at: str
    verification_status: str = "Pending Review"


class VerificationUpdate(BaseModel):
    status: str = Field(..., example="Verified")  # Verified, Edited, Rejected
    notes: Optional[str] = Field(None, example="Agreed with patient-reported dyspnea. Added ECG requisition.")
    doctor_id: Optional[str] = Field(default="Dr. S. K. Mehta", example="Dr. S. K. Mehta")


class PatientUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    abha_id: Optional[str] = None
    preferred_language: Optional[str] = None
    language: Optional[str] = None
    department: Optional[str] = None
    chief_complaint: Optional[str] = None
    intake_status: Optional[str] = None
    hpi: Optional[dict] = None
    past_medical_history: Optional[List[Any]] = None
    allergies: Optional[List[Any]] = None
    current_medications: Optional[List[dict]] = None
    medications: Optional[List[dict]] = None
    labs: Optional[List[dict]] = None
    structured_history: Optional[dict] = None
    is_doctor_edit: Optional[bool] = False

