"""
API endpoints for medical document upload, modular OCR extraction,
patient confirmation/correction, and metadata indexing.
SIH26047 — AI-Powered Patient Case-Taking System.
"""

from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.schemas.document import DocumentOCRResult, DocumentUpdateRequest
from app.services.base_document_service import document_service

router = APIRouter(prefix="/documents", tags=["Documents"])


@router.post("/upload", response_model=DocumentOCRResult)
async def upload_document(
    patient_id: str = Form("CF-PAT-01"),
    document_type: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None)
):
    """
    Receives patient physical document scan or digital file (PDF, JPG, PNG).
    Runs modular OCR pipeline and extracts structured clinical entities (medications, labs, dates).
    """
    if file:
        file_name = file.filename
        file_type = file.content_type or ("application/pdf" if file_name.lower().endswith(".pdf") else "image/jpeg")
        file_bytes = await file.read()
    else:
        # Fallback simulation slip if called without multipart payload
        file_name = "Prescription_Slip_Scan.jpg"
        file_type = "image/jpeg"
        file_bytes = b""

    result = await document_service.upload_document(
        patient_id=patient_id,
        file_name=file_name,
        file_bytes=file_bytes,
        file_type=file_type,
        document_type=document_type
    )
    return result


@router.get("/patient/{patient_id}", response_model=List[DocumentOCRResult])
async def get_patient_documents(patient_id: str):
    """Retrieve all OCR-processed medical documents attached to a patient."""
    return await document_service.get_patient_documents(patient_id)


@router.get("/{document_id}", response_model=DocumentOCRResult)
async def get_document_detail(document_id: str):
    """Retrieve extraction details and raw OCR content for a specific document."""
    doc = document_service.get_document_by_id(document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@router.put("/{document_id}/confirm", response_model=DocumentOCRResult)
async def confirm_document_extraction(document_id: str, payload: DocumentUpdateRequest):
    """
    Patient or staff confirmation and correction endpoint.
    Allows editing or deleting extracted medications and lab findings before final doctor review.
    """
    updates = payload.model_dump(exclude_unset=True)
    # Ensure nested items are dumped as dicts if Pydantic objects
    if "medications" in updates and updates["medications"]:
        updates["medications"] = [m if isinstance(m, dict) else m.model_dump() for m in updates["medications"]]
    if "lab_findings" in updates and updates["lab_findings"]:
        updates["lab_findings"] = [l if isinstance(l, dict) else l.model_dump() for l in updates["lab_findings"]]

    updated = document_service.update_document(document_id, updates)
    if not updated:
        raise HTTPException(status_code=404, detail="Document not found")
    return updated


@router.delete("/{document_id}")
async def delete_document(document_id: str):
    """Remove an attached medical record."""
    deleted = document_service.delete_document(document_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"status": "deleted", "document_id": document_id}
