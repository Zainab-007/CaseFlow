"""
CaseFlow Backend Verification Test Suite
"""
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def run_tests():
    print("=== 1. Checking System Health ===")
    res = client.get("/api/health")
    assert res.status_code == 200, f"Health failed: {res.text}"
    print("Health OK:", res.json())

    print("\n=== 2. Checking Patient Queue Endpoints ===")
    res = client.get("/api/v1/patients/queue")
    assert res.status_code == 200
    queue = res.json()
    print(f"Queue OK: {len(queue)} patients found")

    res = client.get("/api/v1/patients/CF-2026-001")
    assert res.status_code == 200, f"Patient lookup failed: {res.text}"
    pat = res.json()
    print(f"Patient CF-2026-001 OK: {pat.get('demographics', {}).get('name')}")

    res = client.post("/api/v1/patients/CF-2026-001/verify", json={"status": "verified", "notes": "Doctor verification test"})
    assert res.status_code == 200, f"Verify failed: {res.text}"
    print("Verification update OK:", res.json())

    print("\n=== 3. Checking Adaptive Interview Engine Endpoints ===")
    # Start session
    res = client.post("/api/v1/interviews/start", json={"patient_id": "CF-PAT-01", "language": "hi"})
    assert res.status_code == 200
    session = res.json()
    session_id = session["session_id"]
    print("Interview Started. Session ID:", session_id)
    assert session["current_question"]["id"] == "root_complaint"

    # Step 1: Chief complaint
    res = client.post(f"/api/v1/interviews/{session_id}/respond", json={"answer_text": "Stomach Pain / Abdominal Pain", "input_mode": "touch"})
    assert res.status_code == 200
    state = res.json()
    assert state["chief_complaint"] == "Abdominal pain"
    assert state["current_question"]["id"] == "abdo_site"
    print("Step 1: Root Complaint resolved -> Chief Complaint:", state["chief_complaint"])

    # Step 2: Site
    res = client.post(f"/api/v1/interviews/{session_id}/respond", json={"answer_text": "Upper Abdomen (Below Ribs)", "input_mode": "touch"})
    assert res.status_code == 200
    state = res.json()
    assert state["extracted_history"]["site"] == "Upper Abdomen (Below Ribs)"
    assert state["current_question"]["id"] == "abdo_duration"
    print("Step 2: Site recorded ->", state["extracted_history"]["site"])

    # Step 3: Duration
    res = client.post(f"/api/v1/interviews/{session_id}/respond", json={"answer_text": "3 to 4 days ago", "input_mode": "touch"})
    assert res.status_code == 200
    state = res.json()
    assert state["extracted_history"]["onset"] == "3 to 4 days ago"
    assert state["current_question"]["id"] == "abdo_character"
    print("Step 3: Duration recorded ->", state["extracted_history"]["onset"])

    # Step 4: Character (BRANCHING NODE: Burning)
    res = client.post(f"/api/v1/interviews/{session_id}/respond", json={"answer_text": "Burning sensation (जलन)", "input_mode": "touch"})
    assert res.status_code == 200
    state = res.json()
    assert state["current_question"]["id"] == "abdo_burning_meals", f"Expected abdo_burning_meals, got {state['current_question']['id']}"
    print("Step 4: Branching verified! Next Question is adaptive branch:", state["current_question"]["id"])

    # Step 5: Meal Timing
    res = client.post(f"/api/v1/interviews/{session_id}/respond", json={"answer_text": "Worse after eating spicy/oily food", "input_mode": "touch"})
    assert res.status_code == 200
    state = res.json()
    assert state["extracted_history"]["aggravatingFactors"] == "Worse after eating spicy/oily food"
    assert state["current_question"]["id"] == "abdo_radiation"
    print("Step 5: Aggravating factor recorded ->", state["extracted_history"]["aggravatingFactors"])

    # Step 6: Step Back (Undo)
    res = client.post(f"/api/v1/interviews/{session_id}/back")
    assert res.status_code == 200
    state = res.json()
    assert state["current_question"]["id"] == "abdo_burning_meals"
    print("Step 6: Undo step back verified! Returned to:", state["current_question"]["id"])

    # Re-submit meal timing
    res = client.post(f"/api/v1/interviews/{session_id}/respond", json={"answer_text": "Worse when fasting / Relieved by food", "input_mode": "touch"})
    state = res.json()

    # Radiation
    res = client.post(f"/api/v1/interviews/{session_id}/respond", json={"answer_text": "Radiates towards the back", "input_mode": "touch"})
    state = res.json()
    assert state["current_question"]["id"] == "abdo_severity"

    # Severity
    res = client.post(f"/api/v1/interviews/{session_id}/respond", json={"answer_text": "Severe (7 - 8)", "input_mode": "touch"})
    state = res.json()
    assert state["current_question"]["id"] == "abdo_associated"

    # Associated symptoms with Red Flag test
    res = client.post(f"/api/v1/interviews/{session_id}/respond", json={"answer_text": "Vomiting blood or black stools (Red Flag)", "input_mode": "touch"})
    state = res.json()
    assert len(state["red_flags"]) > 0, "Expected red flag to be captured"
    print("Step 7: Red-flag safety rule verified! Red flags:", state["red_flags"])

    # Complete interview
    res = client.post(f"/api/v1/interviews/{session_id}/complete")
    assert res.status_code == 200
    state = res.json()
    assert state["completed"] is True
    print("Step 8: Interview marked completed.")

    # Check legacy endpoint backward compatibility
    res = client.get("/api/v1/interviews/questions/0")
    assert res.status_code == 200
    print("Legacy questions endpoint OK:", res.json()["question_id"])

    print("\n>>> ALL BACKEND CHECKS AND ENDPOINTS PASSED CLEANLY (100% OK) <<<")

if __name__ == "__main__":
    run_tests()
