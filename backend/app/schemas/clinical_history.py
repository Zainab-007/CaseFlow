"""
Pydantic schemas for structured clinical history, HPI, timelines, and doctor summaries.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class TimelineEvent(BaseModel):
    id: str
    date: str
    title: str
    category: str  # diagnosis, medication, lab, hospitalization, procedure
    description: str
    source: str  # patient-reported, document-extracted, ehr


class MedicationItem(BaseModel):
    name: str
    dosage: str
    frequency: str
    source: str = "patient-reported"


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
    associated_symptoms: List[str]
    past_medical_history: List[str]
    past_surgical_history: List[str]
    current_medications: List[MedicationItem]
    allergies: List[AllergyItem]
    family_history: List[str]
    personal_social_history: Dict[str, Any]
    review_of_systems: Dict[str, str]
    red_flag: RedFlagItem
    ai_summary: str
    timeline: List[TimelineEvent]
