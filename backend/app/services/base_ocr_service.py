"""
Base OCR Service Interface for CaseFlow.
Supports future integration of Tesseract, Google Cloud Vision, AWS Textract, or multimodal vision models
for extracting prior medical prescriptions, lab reports, and discharge summaries.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional


class BaseOCRService(ABC):
    """
    Abstract contract for medical document digitization and entity extraction.
    """

    @abstractmethod
    async def extract_text(
        self,
        document_bytes: bytes,
        file_type: str = "image/jpeg"
    ) -> str:
        """Extracts raw textual content from image or PDF."""
        pass

    @abstractmethod
    async def parse_medical_document(
        self,
        document_bytes: bytes,
        file_type: str = "image/jpeg"
    ) -> Dict[str, Any]:
        """
        Extracts structured clinical information from document:
        - Document type (lab_report, prescription, discharge_summary)
        - Investigation dates
        - Key findings (e.g. HbA1c, Blood Pressure, Hemoglobin)
        - Medications listed
        """
        pass


class MockOCRService(BaseOCRService):
    """Placeholder mock OCR service for foundation phase."""

    async def extract_text(
        self,
        document_bytes: bytes,
        file_type: str = "image/jpeg"
    ) -> str:
        return "Complete Blood Count: Hb 11.2 g/dL, TLC 8,400 /uL, Platelets 220,000 /uL"

    async def parse_medical_document(
        self,
        document_bytes: bytes,
        file_type: str = "image/jpeg"
    ) -> Dict[str, Any]:
        return {
            "document_type": "lab_report",
            "date": "2026-08-20",
            "findings": [
                {"parameter": "Hemoglobin", "value": "11.2", "unit": "g/dL", "status": "Normal"},
                {"parameter": "HbA1c", "value": "7.4", "unit": "%", "status": "Elevated"}
            ],
            "source": "document-extracted"
        }
