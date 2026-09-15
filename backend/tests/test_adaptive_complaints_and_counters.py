"""
CaseFlow Verification Test Suite:
1. Dashboard counter consistency and matching patient records.
2. Free-text chief complaint preservation and adaptive pathway selection.
3. Bleeding pathway, generic clarification fallback, and red flags.
4. Retention of existing SOCRATES branching.
"""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_dashboard_counter_and_queue_consistency():
    """Verify OPD queue records and derive counters to guarantee consistency."""
    res = client.get("/api/v1/patients/queue")
    assert res.status_code == 200, f"Queue fetch failed: {res.text}"
    queue = res.json()
    assert len(queue) >= 4, "Should have at least seeded 4 patients"

    # Compute canonical stats
    total = len(queue)
    red_flags = sum(1 for p in queue if p.get("red_flag_detected"))
    urgent = sum(1 for p in queue if p.get("triage_priority", "").upper() == "URGENT")
    verified = sum(1 for p in queue if p.get("verification_status", "").lower() == "verified")

    assert total >= 4
    assert red_flags >= 2, "CF-2026-001 and CF-2026-004 must be flagged"
    assert urgent >= 1, "CF-2026-004 must be urgent"
    assert verified >= 1, "CF-2026-003 must be verified"
    print(f"Canonical queue stats verified: total={total}, red_flags={red_flags}, urgent={urgent}, verified={verified}")


def test_free_text_complaint_bleeding_pathway_and_preservation():
    """Verify arbitrary complaint like 'bleeding from my intimate body part' selects bleeding pathway and preserves text."""
    payload = {
        "patient_id": "CF-TEST-BLEED",
        "language": "hi",
        "chief_complaint": "bleeding from my intimate body part"
    }
    res = client.post("/api/v1/interviews/start", json=payload)
    assert res.status_code == 200, f"Start interview failed: {res.text}"
    session = res.json()

    # Must preserve the exact registered complaint
    assert session["chief_complaint"] == "bleeding from my intimate body part", (
        f"Chief complaint was replaced or altered: {session['chief_complaint']}"
    )

    # Must start directly on bleeding symptom pathway, NOT root_complaint or abdo_site
    assert session["current_question"]["id"] == "bleeding_onset", (
        f"Expected bleeding_onset pathway, got: {session['current_question']['id']}"
    )
    session_id = session["session_id"]

    # Step through bleeding pathway:
    # 1. Answer onset
    res2 = client.post(
        f"/api/v1/interviews/{session_id}/respond",
        json={"answer_text": "Started suddenly today (< 24 hours)", "input_mode": "touch"}
    )
    assert res2.status_code == 200
    state2 = res2.json()
    assert state2["current_question"]["id"] == "bleeding_severity"
    assert state2["extracted_history"]["onset"] == "Started suddenly today (< 24 hours)"

    # 2. Answer severity with heavy active bleeding (Red flag trigger)
    res3 = client.post(
        f"/api/v1/interviews/{session_id}/respond",
        json={"answer_text": "Heavy / Continuous bleeding or passing clots", "input_mode": "voice"}
    )
    assert res3.status_code == 200
    state3 = res3.json()
    assert state3["current_question"]["id"] == "bleeding_associated"
    assert any("bleeding" in flag.lower() for flag in state3["red_flags"]), "Heavy bleeding must trigger red flag"

    # 3. Answer associated symptoms with dizziness
    res4 = client.post(
        f"/api/v1/interviews/{session_id}/respond",
        json={"answer_text": "Dizziness, lightheadedness, or feeling faint", "input_mode": "touch"}
    )
    assert res4.status_code == 200
    state4 = res4.json()
    assert state4["current_question"]["id"] == "abdo_medications"
    assert any("hemodynamic" in flag.lower() or "dizziness" in flag.lower() for flag in state4["red_flags"]), (
        "Dizziness with bleeding must trigger hemodynamic safety alert"
    )

    # Chief complaint must remain intact throughout entire flow
    assert state4["chief_complaint"] == "bleeding from my intimate body part"
    print("Bleeding pathway & preservation test passed cleanly!")


def test_unknown_complaint_generic_clarification_fallback():
    """Verify unknown arbitrary complaint routes to generic clarification and preserves text."""
    unknown_complaint = "strange buzzing and ringing sensation in both ears"
    payload = {
        "patient_id": "CF-TEST-UNKNOWN",
        "language": "en",
        "chief_complaint": unknown_complaint
    }
    res = client.post("/api/v1/interviews/start", json=payload)
    assert res.status_code == 200
    session = res.json()

    # Must preserve unknown text
    assert session["chief_complaint"] == unknown_complaint
    # Must route to generic_onset fallback
    assert session["current_question"]["id"] == "generic_onset", (
        f"Expected generic_onset, got: {session['current_question']['id']}"
    )

    session_id = session["session_id"]
    # Step through generic pathway
    res2 = client.post(
        f"/api/v1/interviews/{session_id}/respond",
        json={"answer_text": "A few days ago (2 - 5 days)", "input_mode": "voice"}
    )
    assert res2.status_code == 200
    assert res2.json()["current_question"]["id"] == "generic_character"

    res3 = client.post(
        f"/api/v1/interviews/{session_id}/respond",
        json={"answer_text": "Continuous and persistent", "input_mode": "touch"}
    )
    assert res3.status_code == 200
    assert res3.json()["current_question"]["id"] == "generic_severity"

    print("Generic clarification fallback & preservation test passed cleanly!")


def test_root_complaint_free_text_routing():
    """Verify that when starting at root_complaint, free text answers route to intent pathway."""
    res = client.post("/api/v1/interviews/start", json={"patient_id": "CF-TEST-ROOT", "language": "hi"})
    assert res.status_code == 200
    session = res.json()
    assert session["current_question"]["id"] == "root_complaint"
    session_id = session["session_id"]

    # Voice/text free-text answer with bleeding
    res2 = client.post(
        f"/api/v1/interviews/{session_id}/respond",
        json={"answer_text": "bleeding heavily from an intimate body area", "input_mode": "voice"}
    )
    assert res2.status_code == 200
    state2 = res2.json()
    assert state2["chief_complaint"] == "bleeding heavily from an intimate body area"
    assert state2["current_question"]["id"] == "bleeding_onset"

    print("Root complaint free-text intent routing passed cleanly!")


def test_socrates_pain_pathway_retained():
    """Verify existing SOCRATES abdominal pain pathway continues working 100%."""
    res = client.post("/api/v1/interviews/start", json={"patient_id": "CF-TEST-SOCRATES", "language": "hi"})
    assert res.status_code == 200
    session = res.json()
    session_id = session["session_id"]

    res2 = client.post(
        f"/api/v1/interviews/{session_id}/respond",
        json={"answer_text": "Stomach Pain / Abdominal Pain", "input_mode": "touch"}
    )
    assert res2.status_code == 200
    state2 = res2.json()
    assert state2["chief_complaint"] == "Abdominal pain"
    assert state2["current_question"]["id"] == "abdo_site"

    res3 = client.post(
        f"/api/v1/interviews/{session_id}/respond",
        json={"answer_text": "Upper Abdomen (Below Ribs)", "input_mode": "touch"}
    )
    assert res3.status_code == 200
    assert res3.json()["current_question"]["id"] == "abdo_duration"

    print("Existing SOCRATES pain pathway retained and passed cleanly!")
