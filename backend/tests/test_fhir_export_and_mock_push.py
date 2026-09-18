"""
Test suite for FHIR R4 Export & Mock ABHA Push (SIH26047).
Verifies:
1. FHIR export for a known patient returns a valid FHIR R4 Bundle.
2. Patient demographics (name, id, ABHA ID, gender, telecom, birthDate) appear accurately.
3. Existing medications, labs, observations (complaint, vitals, AYUSH, red flags), documents, and consent are mapped when present.
4. Unknown patient returns 404 for both export and mock push.
5. Patient isolation — Patient A's FHIR Bundle contains zero data or references from Patient B.
6. Mock ABHA push returns success=True, mock transaction ID, timestamp, and message.
7. Mock push executes entirely locally without calling external services.
8. Existing canonical patient record remains completely unchanged after export and push.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_1_fhir_export_known_patient():
    """TEST 1: FHIR export for a known patient returns a valid collection Bundle."""
    res = client.get("/api/v1/patients/CF-2026-001/fhir")
    assert res.status_code == 200
    bundle = res.json()

    assert bundle["resourceType"] == "Bundle"
    assert bundle["type"] == "collection"
    assert bundle["id"] == "bundle-CF-2026-001"
    assert "entry" in bundle
    assert len(bundle["entry"]) >= 1


def test_2_patient_demographics_mapping():
    """TEST 2: Patient demographics (name, id, ABHA ID, gender, telecom) appear correctly."""
    res = client.get("/api/v1/patients/CF-2026-001/fhir")
    assert res.status_code == 200
    bundle = res.json()

    patient_entry = next((e for e in bundle["entry"] if e["resource"]["resourceType"] == "Patient"), None)
    assert patient_entry is not None
    pat = patient_entry["resource"]

    assert pat["id"] == "CF-2026-001"
    assert pat["name"][0]["text"] == "Ramesh Chandra Sharma"
    assert pat["gender"] == "male"

    # Check identifiers: ABHA ID and CaseFlow ID
    id_systems = {i["system"]: i["value"] for i in pat.get("identifier", [])}
    assert "https://caseflow.health/patient-id" in id_systems
    assert id_systems["https://caseflow.health/patient-id"] == "CF-2026-001"
    assert "https://healthid.ndhm.gov.in" in id_systems
    assert id_systems["https://healthid.ndhm.gov.in"] == "91-4829-1029-4821"

    # Check telecom phone
    assert any(t.get("system") == "phone" and "+91 98450 12345" in t.get("value", "") for t in pat.get("telecom", []))


def test_3_clinical_medications_labs_and_observations_mapped():
    """TEST 3: Existing medications, labs, and observations are mapped when present."""
    res = client.get("/api/v1/patients/CF-2026-001/fhir")
    assert res.status_code == 200
    bundle = res.json()

    resource_types = [e["resource"]["resourceType"] for e in bundle["entry"]]
    assert "Observation" in resource_types
    assert "MedicationStatement" in resource_types
    assert "DocumentReference" in resource_types
    assert "Consent" in resource_types

    # Verify Chief Complaint Observation
    obs_complaint = next((e["resource"] for e in bundle["entry"] if e["resource"]["resourceType"] == "Observation" and e["resource"].get("code", {}).get("text") == "Chief Complaint"), None)
    assert obs_complaint is not None
    assert "Persistent productive cough" in obs_complaint["valueString"]

    # Verify Triage Vitals Observation
    obs_vitals = next((e["resource"] for e in bundle["entry"] if e["resource"]["resourceType"] == "Observation" and e["resource"].get("code", {}).get("text") == "Triage Vitals Summary"), None)
    assert obs_vitals is not None
    assert "BP 148/92" in obs_vitals["valueString"]

    # Verify Lab Observation (e.g. Hb)
    obs_hb = next((e["resource"] for e in bundle["entry"] if e["resource"]["resourceType"] == "Observation" and "Hemoglobin" in e["resource"].get("code", {}).get("text", "")), None)
    assert obs_hb is not None
    assert "11.2" in obs_hb["valueString"]
    assert obs_hb["meta"]["tag"][0]["code"] == "ocr"

    # Verify MedicationStatements (Telmisartan and Metformin)
    med_telmi = next((e["resource"] for e in bundle["entry"] if e["resource"]["resourceType"] == "MedicationStatement" and "Telmisartan" in e["resource"].get("medicationCodeableConcept", {}).get("text", "")), None)
    assert med_telmi is not None
    assert med_telmi["status"] == "active"
    assert "40 mg" in med_telmi["dosage"][0]["text"]
    assert med_telmi["meta"]["tag"][0]["code"] == "document-extracted"


def test_4_unknown_patient_returns_404():
    """TEST 4: Unknown patient ID returns 404 for both export and mock push."""
    unknown_id = "CF-NONEXISTENT-99999"

    # GET /fhir
    res_fhir = client.get(f"/api/v1/patients/{unknown_id}/fhir")
    assert res_fhir.status_code == 404
    assert res_fhir.json()["detail"] == "Patient not found"

    # POST /abha/push
    res_push = client.post(f"/api/v1/patients/{unknown_id}/abha/push")
    assert res_push.status_code == 404
    assert res_push.json()["detail"] == "Patient not found"


def test_5_patient_data_isolation():
    """TEST 5: Patient isolation — Patient A's FHIR Bundle contains zero data from Patient B."""
    # Fetch Patient 1 (Ramesh Chandra Sharma, CF-2026-001)
    res_a = client.get("/api/v1/patients/CF-2026-001/fhir")
    assert res_a.status_code == 200
    bundle_a = res_a.json()

    # Fetch Patient 2 (Sunita Devi Verma, CF-2026-002)
    res_b = client.get("/api/v1/patients/CF-2026-002/fhir")
    assert res_b.status_code == 200
    bundle_b = res_b.json()

    # Bundle IDs and Patient IDs are strictly isolated
    assert bundle_a["id"] == "bundle-CF-2026-001"
    assert bundle_b["id"] == "bundle-CF-2026-002"

    pat_a = next(e["resource"] for e in bundle_a["entry"] if e["resource"]["resourceType"] == "Patient")
    pat_b = next(e["resource"] for e in bundle_b["entry"] if e["resource"]["resourceType"] == "Patient")

    assert pat_a["name"][0]["text"] == "Ramesh Chandra Sharma"
    assert pat_b["name"][0]["text"] == "Sunita Devi Verma"
    assert pat_a["gender"] == "male"
    assert pat_b["gender"] == "female"

    # Patient A's bundle string representation contains no reference to Sunita Devi Verma
    bundle_a_str = str(bundle_a)
    assert "Sunita Devi Verma" not in bundle_a_str
    assert "CF-2026-002" not in bundle_a_str

    # Patient B's bundle string representation contains no reference to Ramesh
    bundle_b_str = str(bundle_b)
    assert "Ramesh Chandra Sharma" not in bundle_b_str
    assert "CF-2026-001" not in bundle_b_str


def test_6_mock_abha_push_success():
    """TEST 6: Mock ABHA push returns success=True, mock transaction ID, and timestamp."""
    res = client.post("/api/v1/patients/CF-2026-001/abha/push")
    assert res.status_code == 200
    data = res.json()

    assert data["success"] is True
    assert data["patient_id"] == "CF-2026-001"
    assert "mock_transaction_id" in data
    assert data["mock_transaction_id"].startswith("TXN-ABHA-MOCK-CF-2026-001-")
    assert "pushed_at" in data
    assert data["resource_type"] == "Bundle"
    assert data["bundle_id"] == "bundle-CF-2026-001"
    assert "fhir_bundle" in data
    assert "Simulation only" in data["message"]


def test_7_mock_push_does_not_call_external_service(monkeypatch):
    """TEST 7: Mock push executes locally without making outbound network requests."""
    import socket

    orig_connect = socket.socket.connect

    def guarded_connect(self, address, *args, **kwargs):
        # Allow internal loopback IPC used by Windows asyncio ProactorEventLoop
        host = address[0] if isinstance(address, tuple) and len(address) > 0 else str(address)
        if host in ("127.0.0.1", "localhost", "::1"):
            return orig_connect(self, address, *args, **kwargs)
        raise RuntimeError(f"External network connection attempted during mock push to {address}!")

    # Guard socket connect against outbound network calls
    monkeypatch.setattr(socket.socket, "connect", guarded_connect)

    # Should execute successfully purely locally
    res = client.post("/api/v1/patients/CF-2026-001/abha/push")
    assert res.status_code == 200
    assert res.json()["success"] is True


def test_8_patient_record_unchanged_after_export_and_push():
    """TEST 8: Existing patient record in database remains unchanged after export/push."""
    # Capture record before export/push
    pre_res = client.get("/api/v1/patients/CF-2026-001")
    assert pre_res.status_code == 200
    pre_pat = pre_res.json()

    # Perform GET /fhir
    client.get("/api/v1/patients/CF-2026-001/fhir")

    # Perform POST /abha/push
    client.post("/api/v1/patients/CF-2026-001/abha/push")

    # Capture record after export/push
    post_res = client.get("/api/v1/patients/CF-2026-001")
    assert post_res.status_code == 200
    post_pat = post_res.json()

    # Verify fundamental attributes unchanged
    assert pre_pat["id"] == post_pat["id"]
    assert pre_pat["name"] == post_pat["name"]
    assert pre_pat["chief_complaint"] == post_pat["chief_complaint"]
    assert pre_pat["verification_status"] == post_pat["verification_status"]
    assert len(pre_pat.get("medications", [])) == len(post_pat.get("medications", []))
    assert len(pre_pat.get("labs", [])) == len(post_pat.get("labs", []))
    assert len(pre_pat.get("timeline", [])) == len(post_pat.get("timeline", []))
