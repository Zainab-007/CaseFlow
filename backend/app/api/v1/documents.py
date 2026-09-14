"""
API endpoints for document scanning and upload.
"""

from fastapi import APIRouter, UploadFile, File, Form
from typing import Optional

router = APIRouter(prefix="/documents", tags=["Documents"])


@router.post("/upload")
async def upload_document(
    patient_id: str = Form(...),
    document_type: str = Form("prescription"),
    file: Optional[UploadFile] = File(None)
):
    """
    Mock endpoint for receiving patient physical document scans.
    Future phases connect this to Tesseract / Vision OCR pipeline.
    """
    filename = file.filename if file else "scanned_slip.jpg"
    return {
        "status": "success",
        "document_id": "DOC-2026-MOCK-99",
        "patient_id": patient_id,
        "file_name": filename,
        "document_type": document_type,
        "ocr_preview": {
            "title": "Hospital OPD Prescription Slip",
            "findings": ["Telmisartan 40mg OD", "Metformin 500mg BD"],
            "date_detected": "2026-08-15"
        }
    }
