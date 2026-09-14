"""
API endpoints for Patient registration, OPD queue, clinical details, and verification.
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from app.schemas.patient import PatientQueueItem, PatientCreate, VerificationUpdate
from app.services.base_patient_service import MockPatientService

router = APIRouter(prefix="/patients", tags=["Patients"])
patient_service = MockPatientService()

# Detailed mock clinical history records for demoing the Doctor Dashboard
MOCK_CLINICAL_DETAILS = {
    "CF-2026-001": {
        "id": "CF-2026-001",
        "queue_token": "OPD-104",
        "demographics": {
            "name": "Ramesh Chandra Sharma",
            "age": 62,
            "gender": "Male",
            "abha_id": "91-4829-1029-4821",
            "contact": "+91 98450 12345",
            "blood_group": "B+",
            "arrived_at": "10:15 AM",
            "consultation_type": "Follow-up & Acute Symptom Intake"
        },
        "triage": {
            "priority": "Priority",
            "badge_color": "amber",
            "vitals_summary": "BP 148/92 mmHg, Pulse 88 bpm, SpO2 94% on room air"
        },
        "chief_complaint": {
            "title": "Persistent productive cough and progressive shortness of breath on climbing stairs",
            "duration": "10 days",
            "source": "patient-reported"
        },
        "ai_clinical_summary": (
            "62-year-old male with long-standing Type 2 Diabetes and Hypertension presenting with a 10-day history of "
            "productive cough (white sputum) accompanied by progressive exertional dyspnea (NYHA Class II). Patient reports "
            "mild bilateral ankle puffiness over past week. Denies fever, chest pain, or hemoptysis. Prior prescription shows "
            "Telmisartan and Metformin. Current presentation warrants evaluation for heart failure vs lower respiratory infection."
        ),
        "red_flag": {
            "detected": True,
            "title": "Exertional Breathlessness in Hypertensive Patient (NYHA II/III)",
            "rule_trigger": "Symptom: Dyspnea on exertion + Known Cardiac/HTN History",
            "nlp_trigger": "Patient mentions difficulty lying flat without 2 pillows (orthopnea pattern)",
            "physician_action": "Immediate clinical auscultation and baseline ECG advised before OPD discharge"
        },
        "structured_history": {
            "hpi": {
                "onset": "Gradual onset over 10 days",
                "character": "Non-pleuritic, accompanied by heaviness in chest during exertion",
                "aggravating_factors": "Walking briskly, climbing stairs, cold weather",
                "relieving_factors": "Resting for 10-15 minutes",
                "severity": "Moderate (6/10 on functional impact scale)",
                "sputum": "White mucoid, non-foul smelling, no hemoptysis"
            },
            "past_medical_history": [
                {"condition": "Type 2 Diabetes Mellitus", "diagnosed": "2018 (8 years)", "control": "Fair (HbA1c 7.4% in Aug 2026)", "source": "document-extracted"},
                {"condition": "Essential Hypertension", "diagnosed": "2015 (11 years)", "control": "Sub-optimal", "source": "document-extracted"},
                {"condition": "No history of Asthma / Tuberculosis", "diagnosed": "None", "control": "N/A", "source": "patient-reported"}
            ],
            "current_medications": [
                {"name": "Tab. Telmisartan", "dose": "40 mg", "frequency": "Once daily (morning)", "adherence": "Regular", "source": "document-extracted"},
                {"name": "Tab. Metformin", "dose": "500 mg", "frequency": "Twice daily after meals", "adherence": "Regular", "source": "document-extracted"},
                {"name": "Over-the-counter Cough Syrup (Dextromethorphan)", "dose": "10 ml", "frequency": "As needed for 4 days", "adherence": "Intermittent", "source": "patient-reported"}
            ],
            "allergies": [
                {"allergen": "Sulfa Drugs", "reaction": "Cutaneous maculopapular rash", "severity": "Moderate"}
            ],
            "family_history": [
                "Father: Myocardial infarction at age 65 (deceased)",
                "Mother: Type 2 Diabetes"
            ],
            "personal_social": {
                "smoking": "Ex-smoker (Quit 12 years ago, 15 pack-years)",
                "alcohol": "Non-drinker",
                "diet": "Vegetarian, moderate salt intake"
            },
            "review_of_systems": {
                "cardiovascular": "Shortness of breath on exertion, mild ankle swelling; denies palpitations or syncope",
                "respiratory": "Cough present with sputum; denies wheezing or stridor",
                "gastrointestinal": "Normal appetite, regular bowel habits",
                "urinary": "Mild nocturia (1-2 times/night), no dysuria",
                "neurological": "No dizziness, normal gait"
            }
        },
        "timeline": [
            {
                "date": "14 Sep 2026",
                "time": "10:15 AM",
                "title": "CaseFlow Pre-Consultation Kiosk Intake",
                "category": "Intake",
                "description": "Patient completed bilingual interview in Hindi/English. Reported cough and exertional dyspnea. Scanned prior lab records.",
                "source": "patient-reported"
            },
            {
                "date": "20 Aug 2026",
                "time": "11:30 AM",
                "title": "Diagnostic Lab: Complete Blood Count & HbA1c",
                "category": "Lab Investigation",
                "description": "Hb 11.2 g/dL, Platelets 220,000, HbA1c 7.4%, Serum Creatinine 1.1 mg/dL.",
                "source": "document-extracted"
            },
            {
                "date": "15 Aug 2026",
                "time": "04:00 PM",
                "title": "Chest Radiograph (PA View)",
                "category": "Radiology",
                "description": "Mild bilateral basal peribronchial thickening. Normal cardiothoracic ratio.",
                "source": "document-extracted"
            },
            {
                "date": "10 Jun 2026",
                "time": "10:00 AM",
                "title": "Cardio-Diabetic OPD Follow-up",
                "category": "Consultation",
                "description": "Follow-up consultation. BP recorded 142/88. Telmisartan 40mg continued.",
                "source": "hospital-ehr"
            }
        ],
        "documents": [
            {
                "id": "DOC-001",
                "title": "Complete Blood Count & Metabolic Profile",
                "date": "20 Aug 2026",
                "type": "Lab Report",
                "extracted_entities": ["Hb: 11.2 g/dL", "HbA1c: 7.4%", "Creatinine: 1.1 mg/dL"],
                "ocr_confidence": "98%"
            },
            {
                "id": "DOC-002",
                "title": "Chest X-Ray Digital Scan",
                "date": "15 Aug 2026",
                "type": "Radiology",
                "extracted_entities": ["Mild peribronchial thickening", "No pneumothorax", "CTR normal"],
                "ocr_confidence": "95%"
            },
            {
                "id": "DOC-003",
                "title": "Previous Prescription Slip",
                "date": "10 Jun 2026",
                "type": "Prescription",
                "extracted_entities": ["Tab. Telmisartan 40mg OD", "Tab. Metformin 500mg BD"],
                "ocr_confidence": "92%"
            }
        ],
        "verification_status": "Pending Review",
        "doctor_notes": None
    }
}


@router.get("/queue", response_model=List[PatientQueueItem])
async def get_patient_queue(department: Optional[str] = Query(None)):
    """Retrieve the current OPD patient waiting queue."""
    return await patient_service.get_opd_queue(department)


@router.get("/{patient_id}")
async def get_patient_detail(patient_id: str):
    """Retrieve detailed clinical history, timeline, documents, and AI brief for a patient."""
    if patient_id in MOCK_CLINICAL_DETAILS:
        return MOCK_CLINICAL_DETAILS[patient_id]
    
    # Fallback lookup from base queue
    patient = await patient_service.get_patient_by_id(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Synthesize standard detail structure
    return {
        "id": patient["id"],
        "queue_token": patient["queue_token"],
        "demographics": {
            "name": patient["name"],
            "age": patient["age"],
            "gender": patient["gender"],
            "abha_id": patient.get("abha_id", "N/A"),
            "contact": "+91 99887 66554",
            "blood_group": "O+",
            "arrived_at": patient["arrived_at"],
            "consultation_type": "Standard OPD Intake"
        },
        "triage": {
            "priority": patient["triage_priority"],
            "badge_color": "red" if patient["triage_priority"] == "Urgent" else "emerald",
            "vitals_summary": "Vitals recorded at triage nursing desk"
        },
        "chief_complaint": {
            "title": patient["chief_complaint"],
            "duration": "Recent",
            "source": "patient-reported"
        },
        "ai_clinical_summary": f"Patient reports {patient['chief_complaint']}. Structured interview completed via kiosk.",
        "red_flag": {
            "detected": patient["red_flag_detected"],
            "title": patient["red_flag_note"] or "No critical red flags flagged",
            "rule_trigger": "Standard safety check",
            "nlp_trigger": "Clinical NLP screen",
            "physician_action": "Standard clinical consultation"
        },
        "structured_history": {
            "hpi": {"onset": "Recent", "severity": "Moderate"},
            "past_medical_history": [],
            "current_medications": [],
            "allergies": [],
            "family_history": [],
            "personal_social": {},
            "review_of_systems": {}
        },
        "timeline": [],
        "documents": [],
        "verification_status": patient["verification_status"],
        "doctor_notes": None
    }


@router.post("/register")
async def register_patient(patient_data: PatientCreate):
    """Kiosk patient registration endpoint."""
    return await patient_service.create_patient(patient_data.model_dump())


@router.post("/{patient_id}/verify")
async def verify_patient_record(patient_id: str, update: VerificationUpdate):
    """Doctor verification action (Verify & Accept, Edit, Reject)."""
    if patient_id in MOCK_CLINICAL_DETAILS:
        MOCK_CLINICAL_DETAILS[patient_id]["verification_status"] = update.status
        MOCK_CLINICAL_DETAILS[patient_id]["doctor_notes"] = update.notes
    return await patient_service.update_verification_status(
        patient_id=patient_id,
        status=update.status,
        notes=update.notes,
        doctor_id=update.doctor_id
    )
