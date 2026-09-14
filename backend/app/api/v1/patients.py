"""
API endpoints for Patient registration, intake updates, OPD queue,
clinical details, and doctor verification.
SIH26047 — AI-Powered Patient Case-Taking System.
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from app.schemas.patient import (
    PatientQueueItem,
    PatientCreate,
    PatientUpdate,
    VerificationUpdate
)
from app.services.base_patient_service import patient_service

router = APIRouter(prefix="/patients", tags=["Patients"])


@router.get("/queue", response_model=List[PatientQueueItem])
async def get_patient_queue(department: Optional[str] = Query(None)):
    """Retrieve the current active OPD patient waiting queue."""
    return await patient_service.get_opd_queue(department)


@router.get("/{patient_id}")
async def get_patient_detail(patient_id: str):
    """
    Retrieve detailed clinical history, timeline, documents, and AI brief for a specific patient.
    Guarantees patient isolation: Patient A and Patient B return their own distinct clinical records.
    """
    patient = await patient_service.get_patient_by_id(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


@router.post("/register")
async def register_patient(patient_data: PatientCreate):
    """Kiosk patient registration endpoint creating a new patient record."""
    return await patient_service.create_patient(patient_data.model_dump())


@router.put("/{patient_id}")
async def update_patient_intake(patient_id: str, update_data: PatientUpdate):
    """
    Patient intake edit/persistence endpoint.
    Updates demographic and clinical information for a specific patient.
    Persists changes across subsequent GET and reload requests without affecting other patients.
    """
    updated = await patient_service.update_patient(
        patient_id=patient_id,
        update_data=update_data.model_dump(exclude_unset=True)
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Patient not found")
    return updated


@router.post("/{patient_id}/verify")
async def verify_patient_record(patient_id: str, update: VerificationUpdate):
    """Doctor verification action (Verify & Accept, Edit, Reject)."""
    return await patient_service.update_verification_status(
        patient_id=patient_id,
        status=update.status,
        notes=update.notes,
        doctor_id=update.doctor_id
    )
