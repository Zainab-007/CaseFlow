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
    VerificationUpdate,
    ConsentRequest,
    RedFlagStatusUpdate
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


@router.post("/{patient_id}/consent")
async def record_patient_consent(patient_id: str, consent_data: ConsentRequest):
    """
    Record explicit patient consent for clinical intake and audit timeline.
    Gating: clinical interview requires given=True.
    """
    updated = patient_service.record_consent(
        patient_id=patient_id,
        given=consent_data.given,
        version=consent_data.version,
        method=consent_data.method
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Patient not found")
    return updated


@router.post("/{patient_id}/ayush")
async def record_ayush_intake(patient_id: str, ayush_data: dict):
    """
    Record optional patient-reported AYUSH intake observations (Nadi, Mutra, Mala, Jihwa).
    Does NOT infer Ayurvedic diagnosis or dosha imbalance.
    """
    updated = patient_service.record_ayush_intake(patient_id=patient_id, ayush_data=ayush_data)
    if not updated:
        raise HTTPException(status_code=404, detail="Patient not found")
    return updated


@router.patch("/{patient_id}/red-flags/{red_flag_id}")
async def update_red_flag_lifecycle(
    patient_id: str,
    red_flag_id: str,
    payload: RedFlagStatusUpdate
):
    """
    Updates a red flag's lifecycle status (ACTIVE, REVIEWED, RESOLVED).
    Guarantees strict patient isolation and audit trail persistence.
    """
    status = payload.status.strip().upper()
    if status not in ("ACTIVE", "REVIEWED", "RESOLVED"):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid red flag status '{payload.status}'. Must be one of: ACTIVE, REVIEWED, RESOLVED"
        )

    updated = patient_service.update_red_flag_status(
        patient_id=patient_id,
        red_flag_id=red_flag_id,
        status=status,
        doctor_id=payload.doctor_id
    )
    if updated is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    if isinstance(updated, dict) and "error" in updated:
        raise HTTPException(status_code=404, detail=updated["error"])
    return updated


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


@router.get("/{patient_id}/timeline")
async def get_patient_timeline(patient_id: str):
    """Retrieve chronological clinical timeline events for a specific patient."""
    patient = await patient_service.get_patient_by_id(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient.get("timeline", [])
