"""
Pydantic schemas for medical document upload, OCR processing,
and clinical entity extraction.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class ExtractedMedication(BaseModel):
    name: str
    dose: Optional[str] = None
    frequency: Optional[str] = None
    duration: Optional[str] = None
    instructions: Optional[str] = None
    confidence: float = 0.90
    source: str = "ocr"


class ExtractedLabFinding(BaseModel):
    parameter: Optional[str] = None
    name: Optional[str] = None
    value: str
    unit: Optional[str] = None
    status: Optional[str] = "Normal"  # Normal, Elevated, Low, Critical
    reference_range: Optional[str] = None
    confidence: float = 0.92
    source: str = "ocr"


class TimelineEventMetadata(BaseModel):
    date: str
    time: Optional[str] = "10:00 AM"
    title: str
    category: str  # Lab Investigation, Prescription, Radiology, Consultation
    description: str
    source: str = "document-extracted"
    extracted_entities: List[str] = []


class DocumentOCRResult(BaseModel):
    document_id: str
    patient_id: str
    file_name: str
    file_type: str  # pdf, jpeg, png
    document_type: str  # prescription, lab_report, radiology, discharge_summary
    title: Optional[str] = None
    date_detected: Optional[str] = None
    confidence_score: float = 0.90
    processing_status: str = "extracted"  # uploaded, processing_ocr, extracted, confirmed, error
    status: Optional[str] = "extracted"
    confirmed: bool = False
    raw_text: Optional[str] = None
    medications: List[ExtractedMedication] = []
    lab_findings: List[ExtractedLabFinding] = []
    diagnoses: List[str] = []
    timeline_metadata: Optional[TimelineEventMetadata] = None
    upload_timestamp: Optional[str] = None
    uploaded_at: Optional[str] = None
    source: str = "ocr"
    extracted_data: Optional[Dict[str, Any]] = None


class DocumentUpdateRequest(BaseModel):
    document_type: Optional[str] = None
    title: Optional[str] = None
    date_detected: Optional[str] = None
    medications: Optional[List[ExtractedMedication]] = None
    lab_findings: Optional[List[ExtractedLabFinding]] = None
    diagnoses: Optional[List[str]] = None
    extracted_data: Optional[Dict[str, Any]] = None
    confirmed: bool = True
