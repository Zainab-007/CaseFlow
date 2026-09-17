"""
Backend Persistence & Patient Isolation Test Suite
SIH26047 — AI-Powered Patient Case-Taking Software

Tests:
1. Create Patient A and Patient B.
2. Update Patient A's intake details.
3. Verify Patient A contains the updated details.
4. Verify Patient B remains unchanged.
5. Fetch Patient A and Patient B separately.
6. Verify their returned data is different and correctly associated.
7. Create documents/interview data for both patients and verify they do not cross over.
8. Open/retrieve doctor review data for each patient and verify the correct patient-specific record is returned.
"""

import io
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_persistence_and_isolation():
    print("=== 1. Create Patient A and Patient B ===")
    payload_a = {
        "name": "Aarav Sharma",
        "age": 35,
        "gender": "Male",
        "phone": "+91 91234 56789",
        "abha_id": "91-1111-2222-3333",
        "preferred_language": "Hindi",
        "department": "General Medicine"
    }
    res_a = client.post("/api/v1/patients/register", json=payload_a)
    assert res_a.status_code == 200, f"Register A failed: {res_a.text}"
    patient_a = res_a.json()
    id_a = patient_a["id"]
    print(f"Patient A created: ID={id_a}, Name={patient_a['name']}")

    payload_b = {
        "name": "Bhavna Patel",
        "age": 52,
        "gender": "Female",
        "phone": "+91 99887 11223",
        "abha_id": "91-4444-5555-6666",
        "preferred_language": "Gujarati",
        "department": "General Medicine"
    }
    res_b = client.post("/api/v1/patients/register", json=payload_b)
    assert res_b.status_code == 200, f"Register B failed: {res_b.text}"
    patient_b = res_b.json()
    id_b = patient_b["id"]
    print(f"Patient B created: ID={id_b}, Name={patient_b['name']}")
    assert id_a != id_b, "Patient IDs must be unique"

    print("\n=== 2. Update Patient A's Intake Details ===")
    update_payload_a = {
        "name": "Aarav Sharma (Edited)",
        "age": 36,
        "gender": "Male",
        "phone": "+91 91234 99999",
        "chief_complaint": "Persistent acid reflux and stomach cramps",
        "intake_status": "Intake In Progress"
    }
    res_update_a = client.put(f"/api/v1/patients/{id_a}", json=update_payload_a)
    assert res_update_a.status_code == 200, f"Update A failed: {res_update_a.text}"
    updated_a = res_update_a.json()
    print("Patient A updated successfully.")

    print("\n=== 3. Verify Patient A Contains Updated Details ===")
    res_get_a = client.get(f"/api/v1/patients/{id_a}")
    assert res_get_a.status_code == 200
    fetched_a = res_get_a.json()
    assert fetched_a["name"] == "Aarav Sharma (Edited)"
    assert fetched_a["age"] == 36
    assert fetched_a["phone"] == "+91 91234 99999"
    assert fetched_a["chief_complaint"] == "Persistent acid reflux and stomach cramps"
    assert fetched_a["demographics"]["name"] == "Aarav Sharma (Edited)"
    assert fetched_a["demographics"]["age"] == 36
    print("Verified: Patient A persisted updated details in both root and demographics.")

    print("\n=== 4. Verify Patient B Remains Unchanged ===")
    res_get_b = client.get(f"/api/v1/patients/{id_b}")
    assert res_get_b.status_code == 200
    fetched_b = res_get_b.json()
    assert fetched_b["name"] == "Bhavna Patel", f"Expected Bhavna Patel, got {fetched_b['name']}"
    assert fetched_b["age"] == 52
    assert fetched_b["gender"] == "Female"
    assert fetched_b["phone"] == "+91 99887 11223"
    assert fetched_b["chief_complaint"] != fetched_a["chief_complaint"]
    print("Verified: Patient B remained completely unchanged after Patient A update.")

    print("\n=== 5. Fetch Patient A and Patient B Separately ===")
    assert fetched_a["id"] == id_a
    assert fetched_b["id"] == id_b
    assert fetched_a["id"] != fetched_b["id"]

    print("\n=== 6. Verify Returned Data is Different and Correctly Associated ===")
    assert fetched_a["name"] != fetched_b["name"]
    assert fetched_a["gender"] != fetched_b["gender"]
    assert fetched_a["demographics"]["contact"] != fetched_b["demographics"]["contact"]
    print(f"Verified: Patient A ({fetched_a['name']}) and Patient B ({fetched_b['name']}) have distinct records.")

    print("\n=== 7. Create Documents & Interviews for Both Patients (No Cross-Over) ===")
    # Patient A Document
    img_a = b"PATIENT_A_PRESCRIPTION_FILE_CONTENT"
    res_doc_a = client.post(
        "/api/v1/documents/upload",
        files={"file": ("Prescription_Aarav.jpg", io.BytesIO(img_a), "image/jpeg")},
        data={"patient_id": id_a, "document_type": "prescription"}
    )
    assert res_doc_a.status_code == 200
    doc_a_id = res_doc_a.json()["document_id"]

    # Patient B Document
    img_b = b"PATIENT_B_CBC_FILE_CONTENT"
    res_doc_b = client.post(
        "/api/v1/documents/upload",
        files={"file": ("CBC_Report_Bhavna.pdf", io.BytesIO(img_b), "application/pdf")},
        data={"patient_id": id_b, "document_type": "lab_report"}
    )
    assert res_doc_b.status_code == 200
    doc_b_id = res_doc_b.json()["document_id"]

    # Patient A & B Consent
    client.post(f"/api/v1/patients/{id_a}/consent", json={"given": True})
    client.post(f"/api/v1/patients/{id_b}/consent", json={"given": True})

    # Patient A Interview
    res_int_a = client.post("/api/v1/interviews/start", json={"patient_id": id_a, "language": "hi"})
    session_a = res_int_a.json()["session_id"]
    client.post(f"/api/v1/interviews/{session_a}/respond", json={"answer_text": "Stomach Pain / Abdominal Pain", "input_mode": "touch"})

    # Patient B Interview
    res_int_b = client.post("/api/v1/interviews/start", json={"patient_id": id_b, "language": "gu"})
    session_b = res_int_b.json()["session_id"]
    client.post(f"/api/v1/interviews/{session_b}/respond", json={"answer_text": "Fever & Chills", "input_mode": "touch"})

    # Check Document Isolation
    docs_for_a = client.get(f"/api/v1/documents/patient/{id_a}").json()
    docs_for_b = client.get(f"/api/v1/documents/patient/{id_b}").json()

    a_doc_ids = [d["document_id"] for d in docs_for_a]
    b_doc_ids = [d["document_id"] for d in docs_for_b]

    assert doc_a_id in a_doc_ids, "Patient A document missing from Patient A list"
    assert doc_b_id not in a_doc_ids, "Patient B document leaked into Patient A list!"
    assert doc_b_id in b_doc_ids, "Patient B document missing from Patient B list"
    assert doc_a_id not in b_doc_ids, "Patient A document leaked into Patient B list!"
    print("Verified: Documents strictly isolated between Patient A and Patient B without leakage.")

    print("\n=== 8. Open Doctor Review Data for Each Patient (Accurate Patient Record) ===")
    review_a = client.get(f"/api/v1/patients/{id_a}").json()
    review_b = client.get(f"/api/v1/patients/{id_b}").json()

    assert review_a["demographics"]["name"] == "Aarav Sharma (Edited)"
    assert review_b["demographics"]["name"] == "Bhavna Patel"
    assert len(review_a.get("documents", [])) >= 1
    assert any(d["document_id"] == doc_a_id for d in review_a.get("documents", []))
    assert not any(d["document_id"] == doc_b_id for d in review_a.get("documents", []))

    # Also verify seed patients are all distinct
    p1 = client.get("/api/v1/patients/CF-2026-001").json()
    p2 = client.get("/api/v1/patients/CF-2026-002").json()
    p3 = client.get("/api/v1/patients/CF-2026-003").json()
    p4 = client.get("/api/v1/patients/CF-2026-004").json()

    assert p1["demographics"]["name"] == "Ramesh Chandra Sharma"
    assert p2["demographics"]["name"] == "Sunita Devi Verma"
    assert p3["demographics"]["name"] == "Ananya Mukherjee"
    assert p4["demographics"]["name"] == "Mohammad Irfan"

    assert p1["chief_complaint"] != p2["chief_complaint"]
    assert p2["chief_complaint"] != p3["chief_complaint"]
    assert p3["chief_complaint"] != p4["chief_complaint"]

    assert p1["triage"]["priority"] == "Priority"
    assert p2["triage"]["priority"] == "Routine"
    assert p3["triage"]["priority"] == "Routine"
    assert p4["triage"]["priority"] == "Urgent"

    print("Verified: Doctor review records for all seed patients are completely distinct.")
    print("\n>>> ALL PERSISTENCE AND ISOLATION TESTS PASSED (100% OK) <<<")


if __name__ == "__main__":
    test_persistence_and_isolation()
