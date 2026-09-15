"""
Automated Test for CaseFlow Patient Data Flow & Source-of-Truth Architecture
SIH26047 — AI-Powered Patient Case-Taking Software

Implements the mandatory 9-step scenario:
STEP 1: Register new patient (Zainab Demo, 20, Female, "Headache")
STEP 2: Persist the patient
STEP 3: Start an interview using THAT patient's patient_id
STEP 4: Answer the complaint question with "Headache"
STEP 5: Verify the interview extraction contains chief_complaint = "Headache"
STEP 6: Fetch the patient from GET /api/v1/patients/{patient_id} and verify demographics
STEP 7: Verify patient's clinical information contains "Headache"
STEP 8: Fetch doctor review data for that patient and verify:
        - Name = Zainab Demo
        - Chief complaint = Headache
        - No Ramesh cough/breathlessness data
        - No Ramesh red flags
        - No Ramesh documents
        - No Ramesh timeline events
STEP 9: Fetch existing seeded demo patient CF-2026-001 and verify original demo clinical history is intact.
"""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_complete_patient_data_flow_and_isolation():
    print("\n========================================================")
    print("RUNNING MANDATORY PATIENT DATA FLOW & SOURCE-OF-TRUTH TEST")
    print("========================================================")

    # STEP 1 & 2: Register & persist new patient
    print("\n--- STEP 1 & 2: Register and persist Zainab Demo ---")
    reg_payload = {
        "name": "Zainab Demo",
        "age": 20,
        "gender": "Female",
        "phone": "+91 98765 43210",
        "abha_id": "91-2026-9999-0001",
        "chief_complaint": "Headache",
        "department": "General Medicine",
        "preferred_language": "Hindi / English"
    }
    reg_res = client.post("/api/v1/patients/register", json=reg_payload)
    assert reg_res.status_code == 200, f"Registration failed: {reg_res.text}"
    patient = reg_res.json()
    patient_id = patient["id"]
    print(f"Registered patient: id={patient_id}, name={patient['name']}, complaint={patient['chief_complaint']}")
    assert patient["name"] == "Zainab Demo"
    assert patient["age"] == 20
    assert patient["gender"] == "Female"
    assert patient["chief_complaint"] == "Headache"
    assert patient_id != "CF-2026-001", "New patient must have their own unique ID, not Ramesh's"

    # STEP 3: Start interview using THAT patient's patient_id
    print(f"\n--- STEP 3: Start interview session for patient_id={patient_id} ---")
    start_payload = {
        "patient_id": patient_id,
        "language": "hi"
    }
    start_res = client.post("/api/v1/interviews/start", json=start_payload)
    assert start_res.status_code == 200, f"Interview start failed: {start_res.text}"
    session = start_res.json()
    session_id = session["session_id"]
    print(f"Interview session started: session_id={session_id}, patient_id={session['patient_id']}")
    assert session["patient_id"] == patient_id, f"Session must be bound to {patient_id}"

    # STEP 4: Answer the complaint question with "Headache"
    print("\n--- STEP 4: Answer root complaint with 'Headache' ---")
    answer_payload = {
        "answer_text": "Headache",
        "input_mode": "touch"
    }
    ans_res = client.post(f"/api/v1/interviews/{session_id}/respond", json=answer_payload)
    assert ans_res.status_code == 200, f"Answer respond failed: {ans_res.text}"
    session_state = ans_res.json()

    # STEP 5: Verify interview extraction contains chief_complaint = "Headache"
    print("\n--- STEP 5: Verify interview extraction contains chief_complaint = 'Headache' ---")
    print(f"Interview chief_complaint: {session_state.get('chief_complaint')}")
    assert session_state.get("chief_complaint") == "Headache", "Chief complaint in interview must be 'Headache'"

    # STEP 6: Fetch the patient from GET /api/v1/patients/{patient_id} and verify demographics
    print(f"\n--- STEP 6: GET /api/v1/patients/{patient_id} ---")
    get_res = client.get(f"/api/v1/patients/{patient_id}")
    assert get_res.status_code == 200, f"Fetch patient failed: {get_res.text}"
    fetched = get_res.json()
    print(f"Fetched Patient: {fetched['name']}, Age={fetched['age']}, Gender={fetched['gender']}")
    assert fetched["name"] == "Zainab Demo"
    assert fetched["age"] == 20
    assert fetched["gender"] == "Female"
    assert fetched["phone"] == "+91 98765 43210"

    # STEP 7: Verify patient's clinical information contains "Headache"
    print("\n--- STEP 7: Verify clinical information contains 'Headache' ---")
    print(f"Patient chief_complaint: {fetched.get('chief_complaint')}")
    print(f"Patient AI Clinical Summary: {fetched.get('ai_clinical_summary')}")
    assert "headache" in fetched.get("chief_complaint", "").lower(), "Clinical chief_complaint must contain Headache"
    assert "headache" in fetched.get("ai_clinical_summary", "").lower(), "AI summary must mention headache"

    # STEP 8: Fetch doctor review data for that patient and verify strict isolation
    print("\n--- STEP 8: Doctor review verification for Zainab Demo ---")
    # Verify name & chief complaint
    assert fetched["name"] == "Zainab Demo"
    assert fetched["chief_complaint"] == "Headache"

    # Verify NO Ramesh cough / breathlessness
    summary_lower = fetched.get("ai_clinical_summary", "").lower()
    hpi_character = str(fetched.get("structured_history", {}).get("hpi", {}).get("character", "")).lower()
    assert "cough" not in summary_lower, "Zainab Demo summary must NOT contain Ramesh's cough"
    assert "breathlessness" not in summary_lower, "Zainab Demo summary must NOT contain Ramesh's breathlessness"
    assert "dyspnea" not in summary_lower, "Zainab Demo summary must NOT contain Ramesh's dyspnea"
    assert "cough" not in hpi_character, "HPI character must NOT contain Ramesh's cough"

    # Verify NO Ramesh red flags
    red_flag = fetched.get("red_flag", {})
    rf_title = red_flag.get("title", "").lower() if red_flag else ""
    assert "hypertensive" not in rf_title, "Zainab Demo must not have Ramesh's hypertensive red flag"
    assert "exertional" not in rf_title, "Zainab Demo must not have Ramesh's exertional breathlessness red flag"

    # Verify NO Ramesh documents
    documents = fetched.get("documents", [])
    print(f"Zainab Demo attached documents: {len(documents)}")
    for doc in documents:
        assert doc.get("patient_id") == patient_id, f"Document leaked from another patient: {doc}"
        assert "CF-2026-001" not in doc.get("patient_id", ""), "Ramesh's document leaked to Zainab Demo"

    # Verify NO Ramesh timeline events
    timeline = fetched.get("timeline", [])
    for ev in timeline:
        desc_lower = ev.get("description", "").lower()
        assert "cough" not in desc_lower, "Timeline leaked Ramesh's cough event"
        assert "breathlessness" not in desc_lower, "Timeline leaked Ramesh's breathlessness event"

    print("Zainab Demo clinical review verified: zero Ramesh data leakage!")

    # STEP 9: Fetch existing seeded demo patient CF-2026-001 and verify original demo clinical history is intact
    print("\n--- STEP 9: Verify seeded demo patient CF-2026-001 is intact ---")
    ramesh_res = client.get("/api/v1/patients/CF-2026-001")
    assert ramesh_res.status_code == 200, "CF-2026-001 must exist"
    ramesh = ramesh_res.json()
    print(f"Ramesh Sharma record: {ramesh['name']}, Age={ramesh['age']}")
    assert ramesh["name"] == "Ramesh Chandra Sharma"
    assert ramesh["age"] == 62
    assert ramesh["gender"] == "Male"
    assert "cough" in ramesh["chief_complaint"].lower(), "Ramesh's original cough complaint must remain intact"
    assert "dyspnea" in ramesh["chief_complaint"].lower() or "cough" in ramesh["chief_complaint"].lower()
    assert ramesh["red_flag_detected"] is True, "Ramesh's original red flag must remain intact"
    assert len(ramesh.get("documents", [])) >= 2, "Ramesh's original documents must remain attached"
    print("CF-2026-001 seeded demo clinical history is completely intact!")

    # STEP 10: Register second new patient (Rahul Demo, 35, Male, Fever) & verify mutual isolation
    print("\n--- STEP 10: Register Rahul Demo and verify mutual isolation with Zainab Demo ---")
    rahul_payload = {
        "name": "Rahul Demo",
        "age": 35,
        "gender": "Male",
        "phone": "+91 91234 56789",
        "abha_id": "91-2026-8888-0002",
        "chief_complaint": "Fever",
        "department": "General Medicine",
        "preferred_language": "Hindi"
    }
    rahul_res = client.post("/api/v1/patients/register", json=rahul_payload)
    assert rahul_res.status_code == 200, f"Rahul registration failed: {rahul_res.text}"
    rahul = rahul_res.json()
    rahul_id = rahul["id"]
    print(f"Registered second patient: id={rahul_id}, name={rahul['name']}")
    assert rahul_id != patient_id, "Rahul must have a distinct patient ID from Zainab"
    assert rahul["name"] == "Rahul Demo"
    assert rahul["age"] == 35
    assert rahul["chief_complaint"] == "Fever"

    # Start interview for Rahul
    rahul_session_res = client.post("/api/v1/interviews/start", json={"patient_id": rahul_id, "language": "hi"})
    assert rahul_session_res.status_code == 200
    rahul_session_id = rahul_session_res.json()["session_id"]
    assert rahul_session_res.json()["patient_id"] == rahul_id

    # Rahul answers "Fever & Chills"
    rahul_ans_res = client.post(f"/api/v1/interviews/{rahul_session_id}/respond", json={"answer_text": "Fever & Chills", "input_mode": "touch"})
    assert rahul_ans_res.status_code == 200
    assert rahul_ans_res.json()["chief_complaint"] == "Fever"

    # Fetch Rahul clinical detail
    rahul_get = client.get(f"/api/v1/patients/{rahul_id}").json()
    assert rahul_get["name"] == "Rahul Demo"
    assert "fever" in rahul_get["chief_complaint"].lower()
    assert "fever" in rahul_get["ai_clinical_summary"].lower()
    # Rahul must NOT have Zainab's headache or Ramesh's cough
    assert "headache" not in rahul_get["chief_complaint"].lower(), "Rahul must NOT have Zainab's headache"
    assert "cough" not in rahul_get["chief_complaint"].lower(), "Rahul must NOT have Ramesh's cough"
    assert "headache" not in rahul_get["ai_clinical_summary"].lower()
    assert "cough" not in rahul_get["ai_clinical_summary"].lower()

    # Re-fetch Zainab to guarantee Rahul's data did not bleed into Zainab
    zainab_refetch = client.get(f"/api/v1/patients/{patient_id}").json()
    assert zainab_refetch["name"] == "Zainab Demo"
    assert "headache" in zainab_refetch["chief_complaint"].lower()
    assert "fever" not in zainab_refetch["chief_complaint"].lower(), "Zainab must NOT have Rahul's fever"
    assert "fever" not in zainab_refetch["ai_clinical_summary"].lower(), "Zainab summary must NOT have Rahul's fever"

    print("Mutual non-leakage confirmed: Rahul Demo and Zainab Demo clinical data are 100% isolated!")

    print("\n========================================================")
    print("ALL 10 STEPS PASSED SUCCESSFULLY: SINGLE SOURCE OF TRUTH VERIFIED")
    print("========================================================")


if __name__ == "__main__":
    test_complete_patient_data_flow_and_isolation()
