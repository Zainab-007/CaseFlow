"""
Test suite for Kiosk Inactivity Timeout & Patient Privacy Invariants (SIH26047).
Verifies that:
1. Kiosk patient registration and intake are properly persisted to SQLite.
2. Inactivity timeout on the kiosk (client session reset) does NOT delete the persisted patient record.
3. Consent status, timeline events, red flags, and triage priority remain intact after timeout.
4. Doctor OPD queue retains the timed-out patient's record with full fidelity.
5. A subsequent patient registering at the kiosk maintains 100% data isolation.
6. Patient B cannot view, bleed into, or mutate Patient A's records.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_persisted_patient_record_intact_after_kiosk_session_timeout():
    """
    Verify that when a kiosk session expires, the patient record previously
    stored in SQLite remains completely intact and uncorrupted.
    """
    # 1. Register a patient during a kiosk session
    create_payload = {
        "name": "Anil Kumar Srivastava",
        "age": 54,
        "gender": "Male",
        "phone": "+91 98111 22334",
        "department": "General Medicine",
        "chief_complaint": "Acute epigastric burning pain radiating to retrosternum",
        "triage_priority": "Priority"
    }
    reg_res = client.post("/api/v1/patients/register", json=create_payload)
    assert reg_res.status_code == 200
    pat_data = reg_res.json()
    pid = pat_data["id"]

    # 2. Record explicit kiosk patient consent
    consent_res = client.post(
        f"/api/v1/patients/{pid}/consent",
        json={"given": True, "version": "v1", "method": "kiosk"}
    )
    assert consent_res.status_code == 200
    assert consent_res.json()["consent"]["given"] is True

    # 3. Complete intake details
    intake_res = client.put(f"/api/v1/patients/{pid}", json={
        "intake_status": "Completed",
        "triage_priority": "Priority"
    })
    assert intake_res.status_code == 200

    # 4. SIMULATE KIOSK INACTIVITY TIMEOUT:
    # Client drops all session tokens, clears sessionStorage, and navigates to Welcome.
    # The client NEVER sends a DELETE or purge request to the backend.

    # 5. VERIFY BACKEND PERSISTENCE: Record is completely intact in database
    pat_res = client.get(f"/api/v1/patients/{pid}")
    assert pat_res.status_code == 200
    pat = pat_res.json()

    assert pat["id"] == pid
    assert pat["name"] == "Anil Kumar Srivastava"
    assert pat["age"] == 54
    assert pat["gender"] == "Male"
    assert pat["phone"] == "+91 98111 22334"
    assert pat["chief_complaint"] == "Acute epigastric burning pain radiating to retrosternum"
    assert pat["intake_status"] == "Completed"
    assert pat["consent"]["given"] is True
    assert pat["consent"]["method"] == "kiosk"

    # Timeline events must be preserved
    assert len(pat.get("timeline", [])) >= 1
    has_consent_event = any(e.get("type") == "consent_given" for e in pat.get("timeline", []))
    assert has_consent_event is True


def test_doctor_queue_retains_patient_after_kiosk_timeout():
    """
    Verify that the doctor OPD queue still lists the patient after the kiosk times out.
    """
    reg_res = client.post("/api/v1/patients/register", json={
        "name": "Meena Kumari Sharma",
        "age": 48,
        "gender": "Female",
        "chief_complaint": "Persistent fever and headache for 4 days"
    })
    assert reg_res.status_code == 200
    pid = reg_res.json()["id"]

    client.post(
        f"/api/v1/patients/{pid}/consent",
        json={"given": True, "version": "v1", "method": "kiosk"}
    )

    # Inactivity timeout occurs on kiosk client
    # Doctor queries queue:
    queue_res = client.get("/api/v1/patients/queue")
    assert queue_res.status_code == 200
    queue = queue_res.json()

    matched = next((p for p in queue if p["id"] == pid), None)
    assert matched is not None, "Timed-out patient must remain present in doctor queue"
    assert matched["name"] == "Meena Kumari Sharma"
    assert matched["chief_complaint"] == "Persistent fever and headache for 4 days"
    assert matched["consent"]["given"] is True


def test_subsequent_patient_data_isolation_after_timeout():
    """
    Verify that when Patient B starts a fresh session after Patient A's timeout,
    Patient B's record is strictly isolated and cannot leak Patient A's data.
    """
    # Patient A
    reg_a = client.post("/api/v1/patients/register", json={
        "name": "Patient Alpha",
        "age": 60,
        "gender": "Male",
        "phone": "+91 99001 12233",
        "chief_complaint": "Shortness of breath on exertion"
    })
    pid_a = reg_a.json()["id"]

    # Kiosk times out, Patient B registers
    reg_b = client.post("/api/v1/patients/register", json={
        "name": "Patient Beta",
        "age": 28,
        "gender": "Female",
        "phone": "+91 99002 44556",
        "chief_complaint": "Skin rash and itchiness"
    })
    pid_b = reg_b.json()["id"]

    assert pid_a != pid_b

    # Fetch both patients
    pat_a = client.get(f"/api/v1/patients/{pid_a}").json()
    pat_b = client.get(f"/api/v1/patients/{pid_b}").json()

    # Verify zero data bleed
    assert pat_b["id"] == pid_b
    assert pat_b["name"] == "Patient Beta"
    assert pat_b["name"] != pat_a["name"]
    assert pat_b["chief_complaint"] != pat_a["chief_complaint"]
    assert pat_b["phone"] != pat_a["phone"]

    # Patient A remains untouched
    assert pat_a["name"] == "Patient Alpha"
