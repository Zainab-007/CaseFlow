"""
Pydantic schemas for structured clinical history, HPI, timelines, and doctor summaries.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class TimelineEvent(BaseModel):
    id: str
    patient_id: Optional[str] = None
    type: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    timestamp: Optional[str] = None
    title: str
    category: Optional[str] = "Intake"  # diagnosis, medication, lab, hospitalization, procedure, Prescription, Lab Investigation
    description: str
    source: str = "patient-reported"  # patient-reported, document-extracted, document, ocr, interview, registration, doctor


class MedicationItem(BaseModel):
    name: str
    dosage: Optional[str] = None
    dose: Optional[str] = None
    frequency: Optional[str] = None
    duration: Optional[str] = None
    source: str = "patient-reported"
    verified_by: Optional[str] = None


class LabResultItem(BaseModel):
    name: str
    parameter: Optional[str] = None
    value: str
    unit: Optional[str] = None
    status: Optional[str] = None
    reference_range: Optional[str] = None
    source: str = "ocr"
    verified_by: Optional[str] = None


class AllergyItem(BaseModel):
    allergen: str
    reaction: str
    severity: str


class RedFlagItem(BaseModel):
    detected: bool
    trigger_type: str  # rule-based, llm-detected, hybrid
    title: str
    description: str
    recommended_action: str = "Physician immediate review recommended"


class StructuredClinicalHistory(BaseModel):
    patient_id: str
    chief_complaint: str
    hpi: Dict[str, Any]  # onset, duration, character, radiation, severity, aggravating, relieving
    associated_symptoms: List[str] = []
    past_medical_history: List[Any] = []
    past_surgical_history: List[str] = []
    current_medications: List[MedicationItem] = []
    labs: List[LabResultItem] = []
    allergies: List[AllergyItem] = []
    family_history: List[str] = []
    personal_social_history: Dict[str, Any] = {}
    review_of_systems: Dict[str, str] = {}
    red_flag: Optional[RedFlagItem] = None
    ai_summary: Optional[str] = None
    timeline: List[TimelineEvent] = []
