"""
Regression Tests for AYUSH Kiosk Intake & SQLite Persistence
SIH26047 — AI-Powered Patient Case-Taking System
"""

import os
import tempfile
import pytest
from app.services.base_patient_service import StatefulPatientService


@pytest.fixture
def temp_db_path():
    """Provides a temporary SQLite database file path cleaned up after test execution."""
    fd, path = tempfile.mkstemp(suffix="_ayush_test.db")
    os.close(fd)
    yield path
    if os.path.exists(path):
        try:
            os.remove(path)
        except OSError:
            pass


@pytest.mark.anyio
async def test_1_record_ayush_intake_and_retrieval(temp_db_path):
    """TEST 1: AYUSH data can be recorded and is returned with canonical patient record."""
    service = StatefulPatientService(db_path=temp_db_path)
    created = await service.create_patient({"name": "AYUSH Test Patient 1", "age": 45})
    patient_id = created["id"]

    ayush_payload = {
        "nadi": {"value": "Fast / Rapid pulse", "source": "patient-reported"},
        "mutra": {"value": "Burning sensation", "source": "patient-reported"},
        "mala": {"value": "Constipation / Hard stools", "source": "patient-reported"},
        "jihwa": {"value": "White coating", "source": "patient-reported"}
    }

    recorded = service.record_ayush_intake(patient_id, ayush_payload)
    assert recorded is not None
    assert "ayush" in recorded
    assert recorded["ayush"]["nadi"]["value"] == "Fast / Rapid pulse"
    assert recorded["ayush"]["mutra"]["value"] == "Burning sensation"
    assert recorded["ayush"]["mala"]["value"] == "Constipation / Hard stools"
    assert recorded["ayush"]["jihwa"]["value"] == "White coating"
    assert recorded["ayush"]["nadi"]["source"] == "patient-reported"

    # Retrieve canonical record via service method
    fetched = await service.get_patient_by_id(patient_id)
    assert fetched["ayush"]["nadi"]["value"] == "Fast / Rapid pulse"
    assert fetched["ayush"]["mutra"]["value"] == "Burning sensation"


@pytest.mark.anyio
async def test_2_ayush_data_survives_sqlite_restart(temp_db_path):
    """TEST 2: AYUSH data survives backend/service restart."""
    service1 = StatefulPatientService(db_path=temp_db_path)
    created = await service1.create_patient({"name": "AYUSH Restart Patient", "age": 38})
    patient_id = created["id"]

    ayush_payload = {
        "nadi": "Slow / Weak pulse",
        "mutra": "Dark / Yellowish color",
        "mala": "Normal / Regular",
        "jihwa": "Dry / Pale appearance"
    }
    service1.record_ayush_intake(patient_id, ayush_payload)

    # Reinitialize service pointing to same DB (simulating backend restart)
    service2 = StatefulPatientService(db_path=temp_db_path)
    restarted_patient = await service2.get_patient_by_id(patient_id)

    assert restarted_patient is not None
    assert restarted_patient["ayush"]["nadi"]["value"] == "Slow / Weak pulse"
    assert restarted_patient["ayush"]["mutra"]["value"] == "Dark / Yellowish color"
    assert restarted_patient["ayush"]["mala"]["value"] == "Normal / Regular"
    assert restarted_patient["ayush"]["jihwa"]["value"] == "Dry / Pale appearance"


@pytest.mark.anyio
async def test_3_ayush_patient_isolation(temp_db_path):
    """TEST 3: AYUSH data remains strictly isolated between Patient A and Patient B."""
    service = StatefulPatientService(db_path=temp_db_path)
    pA = await service.create_patient({"name": "Patient Alpha"})
    pB = await service.create_patient({"name": "Patient Beta"})

    service.record_ayush_intake(pA["id"], {"nadi": "Fast / Rapid pulse", "mutra": "Burning sensation"})
    service.record_ayush_intake(pB["id"], {"nadi": "Slow / Weak pulse", "mutra": "Normal"})

    pA_fetched = await service.get_patient_by_id(pA["id"])
    pB_fetched = await service.get_patient_by_id(pB["id"])

    assert pA_fetched["ayush"]["nadi"]["value"] == "Fast / Rapid pulse"
    assert pB_fetched["ayush"]["nadi"]["value"] == "Slow / Weak pulse"
    assert pA_fetched["ayush"]["nadi"]["value"] != pB_fetched["ayush"]["nadi"]["value"]


@pytest.mark.anyio
async def test_4_skipped_fields_remain_not_provided(temp_db_path):
    """TEST 4: Skipped AYUSH fields remain 'Not provided' without inventing values."""
    service = StatefulPatientService(db_path=temp_db_path)
    created = await service.create_patient({"name": "Partial AYUSH Patient"})
    patient_id = created["id"]

    # Only answer nadi and mala, skip mutra and jihwa
    service.record_ayush_intake(patient_id, {
        "nadi": "Irregular rhythm",
        "mala": "Loose stools"
    })

    fetched = await service.get_patient_by_id(patient_id)
    assert fetched["ayush"]["nadi"]["value"] == "Irregular rhythm"
    assert fetched["ayush"]["mala"]["value"] == "Loose stools"
    assert fetched["ayush"]["mutra"]["value"] == "Not provided"
    assert fetched["ayush"]["jihwa"]["value"] == "Not provided"


@pytest.mark.anyio
async def test_5_ayush_update_does_not_overwrite_existing_clinical_data(temp_db_path):
    """TEST 5: Existing consent, HPI, medications, and labs are preserved when AYUSH is updated."""
    service = StatefulPatientService(db_path=temp_db_path)
    created = await service.create_patient({"name": "Preservation Test Patient", "age": 60})
    patient_id = created["id"]

    # Record consent & update clinical history
    service.record_consent(patient_id, given=True)
    await service.update_patient(patient_id, {
        "chief_complaint": "Productive cough for 5 days",
        "medications": [{"name": "Amoxicillin", "dose": "500 mg"}],
        "labs": [{"parameter": "HbA1c", "value": "6.8"}]
    })

    # Perform AYUSH intake update
    service.record_ayush_intake(patient_id, {"jihwa": "White coating"})

    # Verify everything remains intact
    fetched = await service.get_patient_by_id(patient_id)
    assert fetched["consent"]["given"] is True
    assert fetched["chief_complaint"] == "Productive cough for 5 days"
    assert len(fetched["medications"]) == 1 and fetched["medications"][0]["name"] == "Amoxicillin"
    assert len(fetched["labs"]) == 1 and fetched["labs"][0]["parameter"] == "HbA1c"
    assert fetched["ayush"]["jihwa"]["value"] == "White coating"


def test_6_ayush_endpoint_e2e_data_flow():
    """TEST 6: Submitted AYUSH values reach canonical patient record via HTTP API endpoints."""
    from fastapi.testclient import TestClient
    from app.main import app
    client = TestClient(app)

    reg_res = client.post("/api/v1/patients/register", json={
        "name": "E2E API AYUSH Patient",
        "age": 30,
        "gender": "Female",
        "chief_complaint": "Fatigue"
    })
    assert reg_res.status_code == 200
    patient_id = reg_res.json()["id"]

    ayush_payload = {
        "nadi": "Fast / Rapid pulse",
        "mutra": "Burning sensation",
        "mala": "Constipation / Hard stools",
        "jihwa": "White coating"
    }

    ayush_res = client.post(f"/api/v1/patients/{patient_id}/ayush", json=ayush_payload)
    assert ayush_res.status_code == 200

    detail_res = client.get(f"/api/v1/patients/{patient_id}")
    assert detail_res.status_code == 200
    patient_record = detail_res.json()

    assert patient_record.get("ayush") is not None
    assert patient_record["ayush"]["nadi"]["value"] == "Fast / Rapid pulse"
    assert patient_record["ayush"]["mutra"]["value"] == "Burning sensation"
    assert patient_record["ayush"]["mala"]["value"] == "Constipation / Hard stools"
    assert patient_record["ayush"]["jihwa"]["value"] == "White coating"


def test_7_full_kiosk_interview_sync_flow():
    """TEST 7: Complete kiosk flow (Register -> Consent -> AYUSH -> Interview Sync PUT -> Doctor GET)."""
    from fastapi.testclient import TestClient
    from app.main import app
    client = TestClient(app)

    # 1. Kiosk Registration
    reg_res = client.post("/api/v1/patients/register", json={
        "name": "Kiosk Full Flow Patient",
        "age": 32,
        "gender": "Female",
        "chief_complaint": "Acute headache"
    })
    assert reg_res.status_code == 200
    patient_id = reg_res.json()["id"]

    # 2. Consent
    consent_res = client.post(f"/api/v1/patients/{patient_id}/consent", json={"given": True, "version": "v1", "method": "kiosk"})
    assert consent_res.status_code == 200

    # 3. AYUSH Intake
    ayush_res = client.post(f"/api/v1/patients/{patient_id}/ayush", json={
        "nadi": "Fast / Rapid pulse",
        "mutra": "Burning sensation",
        "mala": "Constipation / Hard stools",
        "jihwa": "White coating"
    })
    assert ayush_res.status_code == 200

    # 4. Interview Sync (PUT request sent during subsequent adaptive interview steps)
    sync_res = client.put(f"/api/v1/patients/{patient_id}", json={
        "chief_complaint": "Severe throbbing right temporal headache",
        "intake_status": "Interview in progress",
        "language": "hi"
    })
    assert sync_res.status_code == 200

    # 5. Doctor GET patient record
    detail_res = client.get(f"/api/v1/patients/{patient_id}")
    assert detail_res.status_code == 200
    record = detail_res.json()

    assert record["ayush"]["nadi"]["value"] == "Fast / Rapid pulse"
    assert record["ayush"]["mutra"]["value"] == "Burning sensation"
    assert record["ayush"]["mala"]["value"] == "Constipation / Hard stools"
    assert record["ayush"]["jihwa"]["value"] == "White coating"


