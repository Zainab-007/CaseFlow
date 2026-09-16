"""
Regression Tests for Feature: Doctor Edit Record — Persist Changes to Canonical Patient Record
SIH26047 — CaseFlow AI-Powered Patient Case-Taking Software

Tests all 11 required scenarios:
TEST 1: Fetch Patient A. Edit chief complaint. Save. Fetch Patient A. Assert updated chief complaint.
TEST 2: Edit existing medication. Assert updated medication persists.
TEST 3: Add medication. Assert it appears in canonical record.
TEST 4: Remove medication. Assert it is removed.
TEST 5: Edit laboratory result. Assert updated value persists.
TEST 6: Add laboratory result. Assert it appears.
TEST 7: Successful doctor edit creates exactly ONE doctor_edit timeline event.
TEST 8: Doctor edit does NOT automatically change Pending Review -> Verified.
TEST 9: Patient A edits do not affect Patient B.
TEST 10: Existing OCR-derived medication/lab data remains intact and its provenance is preserved.
TEST 11: Existing patient-data isolation tests still pass.
"""

from fastapi.testclient import TestClient
from app.main import app
from app.services.base_patient_service import patient_service

client = TestClient(app)


def test_doctor_edit_record_comprehensive_suite():
    # ----------------------------------------------------
    # Setup: Create Patient A and Patient B via API
    # ----------------------------------------------------
    res_a = client.post("/api/v1/patients/register", json={
        "name": "Arjun Singhania",
        "age": 42,
        "gender": "Male",
        "phone": "+91 98765 43210",
        "department": "General Medicine",
        "chief_complaint": "Persistent Dry Cough",
        "intake_status": "Completed"
    })
    assert res_a.status_code == 200
    pat_a_id = res_a.json()["id"]

    res_b = client.post("/api/v1/patients/register", json={
        "name": "Bhavna Patel",
        "age": 35,
        "gender": "Female",
        "phone": "+91 91234 56789",
        "department": "General Medicine",
        "chief_complaint": "Mild Migraine",
        "intake_status": "Completed"
    })
    assert res_b.status_code == 200
    pat_b_id = res_b.json()["id"]

    # Preload Patient A with OCR-extracted prescription and lab via service
    ocr_doc = {
        "document_id": "DOC-OCR-001",
        "document_type": "prescription",
        "extracted_data": {
            "medications": [
                {"name": "Paracetamol", "dose": "500 mg", "frequency": "twice daily", "source": "ocr"},
                {"name": "Cetirizine", "dose": "10 mg", "frequency": "once daily", "source": "ocr"}
            ],
            "labs": [
                {"name": "Hemoglobin (Hb)", "parameter": "Hemoglobin (Hb)", "value": "13.8", "unit": "g/dL", "source": "ocr"}
            ]
        }
    }
    patient_service.merge_document_extraction(pat_a_id, ocr_doc)

    # ----------------------------------------------------
    # TEST 1: Fetch Patient A. Edit chief complaint. Save. Fetch Patient A. Assert updated.
    # ----------------------------------------------------
    res_get_a = client.get(f"/api/v1/patients/{pat_a_id}")
    assert res_get_a.status_code == 200
    p_a = res_get_a.json()
    assert p_a["chief_complaint"] == "Persistent Dry Cough"

    res_edit_1 = client.put(f"/api/v1/patients/{pat_a_id}", json={
        "chief_complaint": "Severe Productive Cough with Nocturnal Wheeze",
        "is_doctor_edit": True
    })
    assert res_edit_1.status_code == 200
    p_a_updated = client.get(f"/api/v1/patients/{pat_a_id}").json()
    assert p_a_updated["chief_complaint"] == "Severe Productive Cough with Nocturnal Wheeze"
    assert p_a_updated["structured_history"]["hpi"]["character"] == "Severe Productive Cough with Nocturnal Wheeze"

    # ----------------------------------------------------
    # TEST 2: Edit existing medication. Assert updated medication persists.
    # ----------------------------------------------------
    current_meds = p_a_updated["structured_history"]["current_medications"]
    updated_meds_list = []
    for m in current_meds:
        if "paracetamol" in m["name"].lower():
            updated_meds_list.append({
                **m,
                "dose": "650 mg",
                "frequency": "thrice daily"
            })
        else:
            updated_meds_list.append(m)

    res_edit_2 = client.put(f"/api/v1/patients/{pat_a_id}", json={
        "current_medications": updated_meds_list,
        "is_doctor_edit": True
    })
    assert res_edit_2.status_code == 200

    p_a_after_med_edit = client.get(f"/api/v1/patients/{pat_a_id}").json()
    para = next((m for m in p_a_after_med_edit["structured_history"]["current_medications"] if "paracetamol" in m["name"].lower()), None)
    assert para is not None
    assert para["dose"] == "650 mg"
    assert para["frequency"] == "thrice daily"
    # Root mirror check
    root_para = next((m for m in p_a_after_med_edit["medications"] if "paracetamol" in m["name"].lower()), None)
    assert root_para is not None and root_para["dose"] == "650 mg"

    # ----------------------------------------------------
    # TEST 3: Add medication. Assert it appears in canonical record.
    # ----------------------------------------------------
    new_med = {
        "name": "Amoxicillin",
        "dose": "500 mg",
        "frequency": "three times daily",
        "duration": "7 days"
    }
    meds_with_new = list(p_a_after_med_edit["structured_history"]["current_medications"]) + [new_med]
    res_edit_3 = client.put(f"/api/v1/patients/{pat_a_id}", json={
        "current_medications": meds_with_new,
        "is_doctor_edit": True
    })
    assert res_edit_3.status_code == 200

    p_a_after_med_add = client.get(f"/api/v1/patients/{pat_a_id}").json()
    amox = next((m for m in p_a_after_med_add["structured_history"]["current_medications"] if "amoxicillin" in m["name"].lower()), None)
    assert amox is not None
    assert amox["dose"] == "500 mg"
    assert amox["source"] == "doctor"
    assert amox["verified_by"] == "doctor"

    # ----------------------------------------------------
    # TEST 4: Remove medication. Assert it is removed.
    # ----------------------------------------------------
    meds_without_cetirizine = [m for m in p_a_after_med_add["structured_history"]["current_medications"] if "cetirizine" not in m["name"].lower()]
    res_edit_4 = client.put(f"/api/v1/patients/{pat_a_id}", json={
        "current_medications": meds_without_cetirizine,
        "is_doctor_edit": True
    })
    assert res_edit_4.status_code == 200

    p_a_after_med_rem = client.get(f"/api/v1/patients/{pat_a_id}").json()
    cetz = next((m for m in p_a_after_med_rem["structured_history"]["current_medications"] if "cetirizine" in m["name"].lower()), None)
    assert cetz is None
    assert not any("cetirizine" in m["name"].lower() for m in p_a_after_med_rem["medications"])

    # ----------------------------------------------------
    # TEST 5: Edit laboratory result. Assert updated value persists.
    # ----------------------------------------------------
    existing_labs = p_a_after_med_rem["structured_history"]["labs"]
    updated_labs = []
    for l in existing_labs:
        if "hemoglobin" in (l.get("parameter") or l.get("name") or "").lower():
            updated_labs.append({
                **l,
                "value": "14.1",
                "status": "Normal"
            })
        else:
            updated_labs.append(l)

    res_edit_5 = client.put(f"/api/v1/patients/{pat_a_id}", json={
        "labs": updated_labs,
        "is_doctor_edit": True
    })
    assert res_edit_5.status_code == 200

    p_a_after_lab_edit = client.get(f"/api/v1/patients/{pat_a_id}").json()
    hb = next((l for l in p_a_after_lab_edit["structured_history"]["labs"] if "hemoglobin" in (l.get("parameter") or l.get("name") or "").lower()), None)
    assert hb is not None
    assert hb["value"] == "14.1"
    root_hb = next((l for l in p_a_after_lab_edit["labs"] if "hemoglobin" in (l.get("parameter") or l.get("name") or "").lower()), None)
    assert root_hb is not None and root_hb["value"] == "14.1"

    # ----------------------------------------------------
    # TEST 6: Add laboratory result. Assert it appears.
    # ----------------------------------------------------
    new_lab = {
        "name": "Fasting Blood Sugar",
        "parameter": "Fasting Blood Sugar",
        "value": "98",
        "unit": "mg/dL",
        "status": "Normal"
    }
    labs_with_new = list(p_a_after_lab_edit["structured_history"]["labs"]) + [new_lab]
    res_edit_6 = client.put(f"/api/v1/patients/{pat_a_id}", json={
        "labs": labs_with_new,
        "is_doctor_edit": True
    })
    assert res_edit_6.status_code == 200

    p_a_after_lab_add = client.get(f"/api/v1/patients/{pat_a_id}").json()
    fbs = next((l for l in p_a_after_lab_add["structured_history"]["labs"] if "fasting blood sugar" in (l.get("parameter") or l.get("name") or "").lower()), None)
    assert fbs is not None
    assert fbs["value"] == "98"
    assert fbs["source"] == "doctor"
    assert fbs["verified_by"] == "doctor"

    # ----------------------------------------------------
    # TEST 7: Successful doctor edit creates exactly ONE doctor_edit timeline event per edit action.
    # ----------------------------------------------------
    fresh_res = client.post("/api/v1/patients/register", json={
        "name": "Fresh Test Patient",
        "age": 50,
        "gender": "Male",
        "department": "General Medicine",
        "chief_complaint": "Chest Discomfort",
        "intake_status": "Completed"
    })
    fresh_id = fresh_res.json()["id"]
    p_fresh = client.get(f"/api/v1/patients/{fresh_id}").json()
    initial_doctor_events = [e for e in p_fresh.get("timeline", []) if e.get("type") == "doctor_edit"]
    assert len(initial_doctor_events) == 0

    # Perform exactly 1 doctor edit
    client.put(f"/api/v1/patients/{fresh_id}", json={
        "chief_complaint": "Atypical Left Sided Chest Tightness",
        "is_doctor_edit": True
    })
    p_fresh_after_one = client.get(f"/api/v1/patients/{fresh_id}").json()
    doctor_events_after = [e for e in p_fresh_after_one.get("timeline", []) if e.get("type") == "doctor_edit"]
    assert len(doctor_events_after) == 1
    assert doctor_events_after[0]["title"] == "Record updated by doctor"
    assert doctor_events_after[0]["source"] == "doctor"

    # ----------------------------------------------------
    # TEST 8: Doctor edit does NOT automatically change Pending Review -> Verified.
    # ----------------------------------------------------
    assert p_fresh_after_one["verification_status"] == "Pending Review"

    # ----------------------------------------------------
    # TEST 9: Patient A edits do not affect Patient B.
    # ----------------------------------------------------
    p_b = client.get(f"/api/v1/patients/{pat_b_id}").json()
    assert p_b["chief_complaint"] == "Mild Migraine"
    assert len(p_b.get("structured_history", {}).get("current_medications", [])) == 0
    assert len(p_b.get("structured_history", {}).get("labs", [])) == 0
    assert not any(e.get("type") == "doctor_edit" for e in p_b.get("timeline", []))

    # ----------------------------------------------------
    # TEST 10: Existing OCR-derived medication/lab data remains intact and its provenance is preserved.
    # ----------------------------------------------------
    para_final = next((m for m in p_a_after_lab_add["structured_history"]["current_medications"] if "paracetamol" in m["name"].lower()), None)
    assert para_final is not None
    assert para_final["source"] == "ocr"
    assert para_final["verified_by"] == "doctor"

    hb_final = next((l for l in p_a_after_lab_add["structured_history"]["labs"] if "hemoglobin" in (l.get("parameter") or l.get("name") or "").lower()), None)
    assert hb_final is not None
    assert hb_final["source"] == "ocr"
    assert hb_final["verified_by"] == "doctor"

    # ----------------------------------------------------
    # TEST 11: Existing patient-data isolation tests still pass.
    # ----------------------------------------------------
    demo_p1 = client.get("/api/v1/patients/CF-2026-001").json()
    assert demo_p1["name"] == "Ramesh Chandra Sharma"
    assert not any("amoxicillin" in m.get("name", "").lower() for m in demo_p1.get("structured_history", {}).get("current_medications", []))
