"""
Base Document Service Interface for CaseFlow.
Handles attachment of scanned physical medical records, prior prescriptions, and diagnostic labs.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional


class BaseDocumentService(ABC):
    """Abstract interface for managing uploaded medical documents."""

    @abstractmethod
    async def upload_document(
        self,
        patient_id: str,
        file_name: str,
        file_bytes: bytes,
        document_type: str = "general"
    ) -> Dict[str, Any]:
        """Saves document and registers reference."""
        pass

    @abstractmethod
    async def get_patient_documents(self, patient_id: str) -> List[Dict[str, Any]]:
        """Retrieves list of documents attached to a patient."""
        pass


class MockDocumentService(BaseDocumentService):
    """Placeholder mock document service."""

    async def upload_document(
        self,
        patient_id: str,
        file_name: str,
        file_bytes: bytes,
        document_type: str = "general"
    ) -> Dict[str, Any]:
        return {
            "document_id": "DOC-2026-901",
            "patient_id": patient_id,
            "file_name": file_name,
            "document_type": document_type,
            "status": "ready_for_ocr",
            "upload_timestamp": "2026-09-14T10:18:00Z"
        }

    async def get_patient_documents(self, patient_id: str) -> List[Dict[str, Any]]:
        return [
            {
                "document_id": "DOC-2026-801",
                "patient_id": patient_id,
                "file_name": "Chest_XRay_Report_Aug2026.pdf",
                "document_type": "radiology",
                "date": "2026-08-15",
                "summary": "Mild bilateral basal peribronchial thickening. No focal consolidation."
            },
            {
                "document_id": "DOC-2026-802",
                "patient_id": patient_id,
                "file_name": "Previous_Prescription_Cardio.jpg",
                "document_type": "prescription",
                "date": "2026-06-10",
                "summary": "Tab. Telmisartan 40mg OD, Tab. Metformin 500mg BD"
            }
        ]
