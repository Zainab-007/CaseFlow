"""
CaseFlow Stateful Medical Document Service
SIH26047 — AI-Powered Patient Case-Taking Software

Manages attached patient medical records, triggers OCR pipelines,
stores structured extractions, handles patient confirmation/corrections,
and prepares timeline metadata.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from datetime import datetime
from app.services.base_ocr_service import ocr_service
from app.db.sqlite_db import init_db, save_document_to_db, load_all_documents_from_db, delete_document_from_db


class BaseDocumentService(ABC):
    """Abstract interface for managing uploaded medical documents."""

    @abstractmethod
    async def upload_document(
        self,
        patient_id: str,
        file_name: str,
        file_bytes: bytes,
        file_type: str = "application/pdf",
        document_type: Optional[str] = None
    ) -> Dict[str, Any]:
        """Processes and stores medical document."""
        pass

    @abstractmethod
    async def get_patient_documents(self, patient_id: str) -> List[Dict[str, Any]]:
        """Retrieves list of documents attached to a patient."""
        pass


class StatefulDocumentService(BaseDocumentService):
    """
    In-memory stateful repository for patient documents.
    Links documents to patient sessions and provides CRUD operations.
    """

    def __init__(self, db_path: Optional[str] = None):
        self.db_path = db_path
        # Key: document_id -> document dict
        self._documents: Dict[str, Dict[str, Any]] = {}
        init_db(self.db_path)
        db_docs = load_all_documents_from_db(self.db_path)
        if db_docs:
            self._documents.update(db_docs)
        self._seed_initial_records()

    def _seed_initial_records(self):
        doc1 = {
            "document_id": "DOC-SEED-001",
            "patient_id": "CF-2026-001",
            "file_name": "CBC_Metabolic_Report_Aug2026.pdf",
            "file_type": "pdf",
            "document_type": "lab_report",
            "title": "Complete Blood Count & Metabolic Profile",
            "date_detected": "20 Aug 2026",
            "confidence_score": 0.98,
            "processing_status": "confirmed",
            "confirmed": True,
            "raw_text": "Complete Blood Count: Hb 11.2 g/dL, HbA1c 7.4%, Platelets 220,000 /uL, Creatinine 1.1 mg/dL",
            "medications": [],
            "lab_findings": [
                {"parameter": "Hemoglobin (Hb)", "value": "11.2", "unit": "g/dL", "status": "Low", "reference_range": "12.0 - 16.0 g/dL", "confidence": 0.98},
                {"parameter": "Glycated Hemoglobin (HbA1c)", "value": "7.4", "unit": "%", "status": "Elevated", "reference_range": "< 5.7 %", "confidence": 0.97},
                {"parameter": "Platelet Count", "value": "220,000", "unit": "/uL", "status": "Normal", "reference_range": "150,000 - 450,000 /uL", "confidence": 0.95},
                {"parameter": "Serum Creatinine", "value": "1.1", "unit": "mg/dL", "status": "Normal", "reference_range": "0.6 - 1.2 mg/dL", "confidence": 0.94}
            ],
            "diagnoses": ["Type 2 Diabetes Mellitus"],
            "timeline_metadata": {
                "date": "20 Aug 2026",
                "time": "11:30 AM",
                "title": "Diagnostic Lab: Complete Blood Count & HbA1c",
                "category": "Lab Investigation",
                "description": "Hb 11.2 g/dL (Low), HbA1c 7.4% (Elevated), Creatinine 1.1 mg/dL.",
                "source": "document-extracted",
                "extracted_entities": ["Hb: 11.2 g/dL", "HbA1c: 7.4%", "Creatinine: 1.1 mg/dL"]
            },
            "upload_timestamp": "2026-08-20T11:30:00Z"
        }

        doc2 = {
            "document_id": "DOC-SEED-002",
            "patient_id": "CF-2026-001",
            "file_name": "Previous_Prescription_Cardio.jpg",
            "file_type": "image",
            "document_type": "prescription",
            "title": "Cardio-Diabetic OPD Prescription Slip",
            "date_detected": "10 Jun 2026",
            "confidence_score": 0.94,
            "processing_status": "confirmed",
            "confirmed": True,
            "raw_text": "Hospital OPD Prescription Slip\nRx:\nTab. Telmisartan 40mg OD\nTab. Metformin 500mg BD",
            "medications": [
                {"name": "Telmisartan", "dose": "40 mg", "frequency": "Once daily (OD)", "instructions": "Morning after breakfast", "confidence": 0.95},
                {"name": "Metformin", "dose": "500 mg", "frequency": "Twice daily (BD)", "instructions": "After lunch and dinner", "confidence": 0.93}
            ],
            "lab_findings": [],
            "diagnoses": ["Essential Hypertension", "Type 2 Diabetes Mellitus"],
            "timeline_metadata": {
                "date": "10 Jun 2026",
                "time": "10:00 AM",
                "title": "Previous Prescription Slip",
                "category": "Prescription",
                "description": "Tab. Telmisartan 40mg OD, Tab. Metformin 500mg BD",
                "source": "document-extracted",
                "extracted_entities": ["Tab. Telmisartan 40mg OD", "Tab. Metformin 500mg BD"]
            },
            "upload_timestamp": "2026-06-10T10:00:00Z"
        }

        if doc1["document_id"] not in self._documents:
            self._documents[doc1["document_id"]] = doc1
            save_document_to_db(doc1, db_path=self.db_path)

        if doc2["document_id"] not in self._documents:
            self._documents[doc2["document_id"]] = doc2
            save_document_to_db(doc2, db_path=self.db_path)

    async def upload_document(
        self,
        patient_id: str,
        file_name: str,
        file_bytes: bytes,
        file_type: str = "application/pdf",
        document_type: Optional[str] = None
    ) -> Dict[str, Any]:
        """Triggers modular OCR pipeline and stores resulting document."""
        ocr_result = await ocr_service.parse_medical_document(
            document_bytes=file_bytes,
            file_name=file_name,
            file_type=file_type,
            patient_id=patient_id
        )

        if document_type:
            ocr_result["document_type"] = document_type

        self._documents[ocr_result["document_id"]] = ocr_result
        save_document_to_db(ocr_result, db_path=self.db_path)
        return ocr_result

    async def get_patient_documents(self, patient_id: str) -> List[Dict[str, Any]]:
        """Returns all documents attached strictly to patient_id with zero cross-patient leakage."""
        return [
            doc for doc in self._documents.values()
            if doc.get("patient_id") == patient_id
        ]

    def get_document_by_id(self, document_id: str) -> Optional[Dict[str, Any]]:
        return self._documents.get(document_id)

    def update_document(self, document_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        doc = self._documents.get(document_id)
        if not doc:
            return None

        for k, v in updates.items():
            if v is not None:
                doc[k] = v

        is_confirmed = updates.get("confirmed", True)
        doc["processing_status"] = "confirmed" if is_confirmed else doc.get("processing_status", "extracted")
        doc["status"] = "confirmed" if is_confirmed else doc.get("status", "extracted")
        doc["confirmed"] = is_confirmed

        # Update timeline metadata summary and extracted_data if medications or labs changed
        if "medications" in updates or "lab_findings" in updates:
            meds = doc.get("medications", [])
            labs = doc.get("lab_findings", [])
            if "extracted_data" not in doc or not isinstance(doc["extracted_data"], dict):
                doc["extracted_data"] = {}
            doc["extracted_data"]["medications"] = meds
            doc["extracted_data"]["labs"] = labs

            summary_parts = []
            if meds:
                summary_parts.append("Meds: " + ", ".join(f"{m.get('name')} {m.get('dose', '')}" for m in meds[:3]))
            if labs:
                summary_parts.append("Labs: " + ", ".join(f"{l.get('parameter') or l.get('name')}: {l.get('value')}" for l in labs[:3]))
            if doc.get("timeline_metadata"):
                doc["timeline_metadata"]["description"] = " | ".join(summary_parts) if summary_parts else doc["timeline_metadata"]["description"]

        # Merge confirmed clinical data into the patient's canonical record
        if is_confirmed:
            try:
                from app.services.base_patient_service import patient_service
                patient_id = doc.get("patient_id")
                if patient_id:
                    patient_service.merge_document_extraction(patient_id, doc)
            except Exception as e:
                print(f"[DocumentService] Patient merge notice: {e}")

        save_document_to_db(doc, db_path=self.db_path)
        return doc

    def delete_document(self, document_id: str) -> bool:
        if document_id in self._documents:
            del self._documents[document_id]
            delete_document_from_db(document_id, db_path=self.db_path)
            return True
        return False


# Singleton document service instance
document_service = StatefulDocumentService()
# Alias for backward compatibility
MockDocumentService = StatefulDocumentService
