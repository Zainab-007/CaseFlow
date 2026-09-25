"""
CaseFlow SQLite Persistence Integration Tests
SIH26047 — AI-Powered Patient Case-Taking Software

Verifies end-to-end SQLite persistence and service reinitialization safety for:
1. Patient registration and retrieval across backend restart
2. Patient updates (demographics, HPI, medications, labs) across backend restart
3. Patient consent preservation across restart
4. Interview clinical history synchronization across restart
5. Medications, labs, timeline events preservation across restart
6. Document upload and document metadata preservation across restart
7. Patient isolation across restart (no data leak between patients)
8. Demo patient preservation and non-duplication across re-initialization
"""

import os
import tempfile
import pytest
from app.services.base_patient_service import StatefulPatientService
from app.services.base_document_service import StatefulDocumentService
from app.db.sqlite_db import load_all_patients_from_db, load_all_documents_from_db, get_connection


@pytest.fixture
def temp_db_path():
    """Provides a temporary SQLite database file path cleaned up after test execution."""
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    yield path
    if os.path.exists(path):
        try:
            os.remove(path)
        except OSError:
            pass


@pytest.mark.anyio
async def test_patient_registration_and_restart_retrieval(temp_db_path):
    """Register patient -> save to SQLite -> reinitialize service -> retrieve patient."""
    service1 = StatefulPatientService(db_path=temp_db_path)
    
    new_patient_data = {
        "name": "Persistence Test Patient",
        "age": 42,
        "gender": "Female",
        "contact": "+91 98765 43210",
        "chief_complaint": "Persistent headache and fever",
        "preferred_language": "English"
    }
    
    created = await service1.create_patient(new_patient_data)
    patient_id = created["id"]
    assert patient_id.startswith("CF-2026-")
    assert created["name"] == "Persistence Test Patient"

    # Simulate backend service restart by creating a new StatefulPatientService instance pointing to same DB
    service2 = StatefulPatientService(db_path=temp_db_path)
    retrieved = await service2.get_patient_by_id(patient_id)
    
    assert retrieved is not None
    assert retrieved["id"] == patient_id
    assert retrieved["name"] == "Persistence Test Patient"
    assert retrieved["age"] == 42
    assert retrieved["chief_complaint"] == "Persistent headache and fever"


@pytest.mark.anyio
async def test_patient_update_and_restart_persistence(temp_db_path):
    """Update patient -> reinitialize service -> retrieve updated patient fields."""
    service1 = StatefulPatientService(db_path=temp_db_path)
    
    # Create patient
    created = await service1.create_patient({"name": "Update Test Patient", "age": 50})
    patient_id = created["id"]
    
    # Update patient demographics, medications, labs
    update_payload = {
        "phone": "+91 91111 22222",
        "chief_complaint": "Severe epigastric pain",
        "medications": [
            {"name": "Pantoprazole", "dose": "40 mg", "frequency": "Once daily", "source": "doctor"}
        ],
        "labs": [
            {"parameter": "Serum Amylase", "value": "120", "unit": "U/L", "status": "Elevated", "source": "doctor"}
        ]
    }
    updated = await service1.update_patient(patient_id, update_payload)
    assert updated["phone"] == "+91 91111 22222"
    assert updated["chief_complaint"] == "Severe epigastric pain"
    
    # Simulate service restart
    service2 = StatefulPatientService(db_path=temp_db_path)
    retrieved = await service2.get_patient_by_id(patient_id)
    
    assert retrieved is not None
    assert retrieved["phone"] == "+91 91111 22222"
    assert retrieved["chief_complaint"] == "Severe epigastric pain"
    assert len(retrieved["medications"]) == 1
    assert retrieved["medications"][0]["name"] == "Pantoprazole"
    assert len(retrieved["labs"]) == 1
    assert retrieved["labs"][0]["parameter"] == "Serum Amylase"


@pytest.mark.anyio
async def test_consent_persists_after_restart(temp_db_path):
    """Consent remains persisted after restart."""
    service1 = StatefulPatientService(db_path=temp_db_path)
    
    created = await service1.create_patient({"name": "Consent Test Patient"})
    patient_id = created["id"]
    assert created["consent"]["given"] is False
    
    # Record explicit consent
    consented = service1.record_consent(patient_id, given=True, version="v1", method="kiosk")
    assert consented["consent"]["given"] is True
    
    # Simulate service restart
    service2 = StatefulPatientService(db_path=temp_db_path)
    retrieved = await service2.get_patient_by_id(patient_id)
    
    assert retrieved["consent"]["given"] is True
    assert retrieved["consent"]["version"] == "v1"
    # Verify consent timeline event survived restart
    consent_timeline = [e for e in retrieved.get("timeline", []) if e.get("type") == "consent_given"]
    assert len(consent_timeline) == 1


@pytest.mark.anyio
async def test_interview_clinical_data_persists_after_restart(temp_db_path):
    """Interview & clinical data synchronization remains persisted after restart."""
    service1 = StatefulPatientService(db_path=temp_db_path)
    
    patient_id = "CF-2026-INT-TEST"
    extracted_history = {
        "onset": "3 days ago",
        "character": "Sharp throbbing pain",
        "severity": "7/10",
        "site": "Left temporal region",
        "aggravatingFactors": "Bright light",
        "relievingFactors": "Dark room and rest"
    }
    red_flags = ["Sudden onset severe headache with visual disturbance"]
    
    service1.sync_interview_data(
        patient_id=patient_id,
        chief_complaint="Unilateral severe migraine",
        extracted_history=extracted_history,
        red_flags=red_flags,
        session_completed=True,
        language="hi"
    )
    
    # Simulate service restart
    service2 = StatefulPatientService(db_path=temp_db_path)
    retrieved = await service2.get_patient_by_id(patient_id)
    
    assert retrieved is not None
    assert retrieved["chief_complaint"] == "Unilateral severe migraine"
    assert retrieved["red_flag_detected"] is True
    assert "Sudden onset" in retrieved["red_flag_note"]
    hpi = retrieved["structured_history"]["hpi"]
    assert hpi["onset"] == "3 days ago"
    assert hpi["character"] == "Sharp throbbing pain"
    assert hpi["severity"] == "7/10"


@pytest.mark.anyio
async def test_medications_labs_timeline_persist_after_restart(temp_db_path):
    """Medications, labs, and timeline events remain persisted."""
    patient_service1 = StatefulPatientService(db_path=temp_db_path)
    
    created = await patient_service1.create_patient({"name": "Clinical Data Patient"})
    patient_id = created["id"]
    
    doc_data = {
        "document_id": "DOC-TEST-999",
        "patient_id": patient_id,
        "document_type": "lab_report",
        "medications": [
            {"name": "Amlodipine 5mg", "dose": "5 mg", "frequency": "Once daily", "source": "ocr"}
        ],
        "lab_findings": [
            {"parameter": "Hemoglobin", "value": "13.5", "unit": "g/dL", "status": "Normal", "source": "ocr"}
        ]
    }
    
    patient_service1.merge_document_extraction(patient_id, doc_data)
    
    # Verify in service 1
    p1 = await patient_service1.get_patient_by_id(patient_id)
    assert len(p1["medications"]) == 1
    assert len(p1["labs"]) == 1
    assert len(p1["timeline"]) >= 2 # registration + document timeline
    
    # Simulate service restart
    patient_service2 = StatefulPatientService(db_path=temp_db_path)
    p2 = await patient_service2.get_patient_by_id(patient_id)
    
    assert len(p2["medications"]) == 1
    assert p2["medications"][0]["name"] == "Amlodipine 5mg"
    assert len(p2["labs"]) == 1
    assert p2["labs"][0]["parameter"] == "Hemoglobin"
    assert len(p2["timeline"]) == len(p1["timeline"])


@pytest.mark.anyio
async def test_documents_persist_after_restart(temp_db_path):
    """Documents metadata remains persisted across restart."""
    doc_service1 = StatefulDocumentService(db_path=temp_db_path)
    
    uploaded = await doc_service1.upload_document(
        patient_id="CF-2026-001",
        file_name="Test_Lab_Report.pdf",
        file_bytes=b"%PDF-1.4 test content",
        file_type="application/pdf",
        document_type="lab_report"
    )
    doc_id = uploaded["document_id"]
    assert doc_id is not None
    
    # Update document confirmation
    doc_service1.update_document(doc_id, {"confirmed": True, "title": "Updated Lab Report"})
    
    # Simulate service restart
    doc_service2 = StatefulDocumentService(db_path=temp_db_path)
    retrieved_docs = await doc_service2.get_patient_documents("CF-2026-001")
    
    doc_ids = [d["document_id"] for d in retrieved_docs]
    assert doc_id in doc_ids
    matched = next(d for d in retrieved_docs if d["document_id"] == doc_id)
    assert matched["title"] == "Updated Lab Report"
    assert matched["confirmed"] is True


@pytest.mark.anyio
async def test_patient_isolation_survives_restart(temp_db_path):
    """Patient isolation survives restart — Patient A never receives Patient B data."""
    service1 = StatefulPatientService(db_path=temp_db_path)
    
    pA = await service1.create_patient({"name": "Patient Alpha", "chief_complaint": "Chest pain"})
    pB = await service1.create_patient({"name": "Patient Beta", "chief_complaint": "Knee pain"})
    
    # Add unique medication to A and B
    await service1.update_patient(pA["id"], {"medications": [{"name": "Medication Alpha", "dose": "10mg"}]})
    await service1.update_patient(pB["id"], {"medications": [{"name": "Medication Beta", "dose": "20mg"}]})
    
    # Simulate restart
    service2 = StatefulPatientService(db_path=temp_db_path)
    pA_res = await service2.get_patient_by_id(pA["id"])
    pB_res = await service2.get_patient_by_id(pB["id"])
    
    assert pA_res["name"] == "Patient Alpha"
    assert pA_res["medications"][0]["name"] == "Medication Alpha"
    assert not any(m["name"] == "Medication Beta" for m in pA_res["medications"])
    
    assert pB_res["name"] == "Patient Beta"
    assert pB_res["medications"][0]["name"] == "Medication Beta"
    assert not any(m["name"] == "Medication Alpha" for m in pB_res["medications"])


@pytest.mark.anyio
async def test_demo_patients_intact_and_not_duplicated_on_restart(temp_db_path):
    """Existing demo patients remain intact and re-initializing DB does not duplicate seeded records."""
    service1 = StatefulPatientService(db_path=temp_db_path)
    
    # Initially 3 seeded demo patients
    queue1 = await service1.get_opd_queue()
    assert len(queue1) == 3
    demo_ids = [p["id"] for p in queue1]
    assert "CF-2026-001" in demo_ids
    assert "CF-2026-002" in demo_ids
    assert "CF-2026-004" in demo_ids
    
    # Register 1 new patient
    new_p = await service1.create_patient({"name": "New Registered Patient"})
    assert new_p["id"] == "CF-2026-005"
    
    # Reinitialize service 5 times
    for _ in range(5):
        s = StatefulPatientService(db_path=temp_db_path)
        q = await s.get_opd_queue()
        # Should still be exactly 4 patients total, not duplicated!
        assert len(q) == 4
        ids = [p["id"] for p in q]
        assert ids.count("CF-2026-001") == 1
        assert ids.count("CF-2026-005") == 1
