"""
Comprehensive Regression Tests for Persistent Patient Consent & Consent Audit
SIH26047 — AI-Powered Patient Case-Taking System
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.base_patient_service import patient_service
from app.services.interview_engine import interview_engine

client = TestClient(app)


def test_1_new_patient_starts_without_consent():
    """TEST 1: New patient starts with consent.given = False."""
    res = client.post("/api/v1/patients/register", json={
        "name": "Consent Test Patient 1",
        "age": 35,
        "gender": "Female",
        "chief_complaint": "Fatigue and weakness",
        "preferred_language": "Hindi"
    })
    assert res.status_code == 200
    data = res.json()
    pat_id = data["id"]

    pat_detail = client.get(f"/api/v1/patients/{pat_id}").json()
    assert "consent" in pat_detail
    assert pat_detail["consent"]["given"] is False
    assert pat_detail["consent"]["timestamp"] is None
    assert pat_detail["consent"]["version"] == "v1"
    assert pat_detail["consent"]["method"] == "kiosk"


def test_2_to_5_explicit_consent_persistence_and_attributes():
    """
    TEST 2: Explicit consent sets given = True.
    TEST 3: Consent stores valid ISO timestamp.
    TEST 4: Consent stores version = "v1".
    TEST 5: Consent stores method = "kiosk".
    """
    reg_res = client.post("/api/v1/patients/register", json={
        "name": "Consent Test Patient 2",
        "age": 42,
        "gender": "Male",
        "chief_complaint": "Joint pain"
    })
    pat_id = reg_res.json()["id"]

    # Explicit consent acceptance via dedicated endpoint
    consent_res = client.post(f"/api/v1/patients/{pat_id}/consent", json={
        "given": True,
        "version": "v1",
        "method": "kiosk"
    })
    assert consent_res.status_code == 200
    consent_data = consent_res.json()["consent"]

    assert consent_data["given"] is True
    assert consent_data["timestamp"] is not None
    assert "T" in consent_data["timestamp"]
    assert consent_data["version"] == "v1"
    assert consent_data["method"] == "kiosk"

    # Verify retrieval
    get_res = client.get(f"/api/v1/patients/{pat_id}").json()
    assert get_res["consent"]["given"] is True
    assert get_res["consent"]["timestamp"] == consent_data["timestamp"]


def test_6_and_7_single_timeline_event_no_duplicates():
    """
    TEST 6: Exactly one consent_given timeline event is created.
    TEST 7: Refreshing/re-consenting does not create duplicate consent events.
    """
    reg_res = client.post("/api/v1/patients/register", json={
        "name": "Consent Test Patient 3",
        "age": 50,
        "gender": "Female",
        "chief_complaint": "Dizziness"
    })
    pat_id = reg_res.json()["id"]

    # Record consent 1st time
    client.post(f"/api/v1/patients/{pat_id}/consent", json={"given": True, "version": "v1"})
    timeline_1 = client.get(f"/api/v1/patients/{pat_id}/timeline").json()
    consent_events_1 = [e for e in timeline_1 if e.get("type") == "consent_given"]
    assert len(consent_events_1) == 1
    assert consent_events_1[0]["title"] == "Patient consent recorded"
    assert consent_events_1[0]["source"] == "patient"

    # Record consent 2nd time (simulate page reload / re-submission)
    client.post(f"/api/v1/patients/{pat_id}/consent", json={"given": True, "version": "v1"})
    timeline_2 = client.get(f"/api/v1/patients/{pat_id}/timeline").json()
    consent_events_2 = [e for e in timeline_2 if e.get("type") == "consent_given"]
    assert len(consent_events_2) == 1


def test_8_declining_consent_creates_no_timeline_event():
    """TEST 8: Declining consent does not create a consent_given event."""
    reg_res = client.post("/api/v1/patients/register", json={
        "name": "Consent Decline Patient",
        "age": 28,
        "gender": "Male",
        "chief_complaint": "Fever"
    })
    pat_id = reg_res.json()["id"]

    # Explicit decline
    res = client.post(f"/api/v1/patients/{pat_id}/consent", json={"given": False, "version": "v1"})
    assert res.status_code == 200
    assert res.json()["consent"]["given"] is False

    timeline = client.get(f"/api/v1/patients/{pat_id}/timeline").json()
    consent_events = [e for e in timeline if e.get("type") == "consent_given"]
    assert len(consent_events) == 0


def test_9_and_10_interview_gating_before_and_after_consent():
    """
    TEST 9: Interview cannot start without consent (HTTP 403).
    TEST 10: Interview can start after consent (HTTP 200).
    """
    reg_res = client.post("/api/v1/patients/register", json={
        "name": "Gating Test Patient",
        "age": 33,
        "gender": "Female",
        "chief_complaint": "Upper abdominal burning"
    })
    pat_id = reg_res.json()["id"]

    # Attempt to start interview without consent -> must return 403
    start_unconsented = client.post("/api/v1/interviews/start", json={
        "patient_id": pat_id,
        "language": "en",
        "chief_complaint": "Upper abdominal burning"
    })
    assert start_unconsented.status_code == 403
    assert "consent" in start_unconsented.json()["detail"].lower()

    # Grant explicit consent
    client.post(f"/api/v1/patients/{pat_id}/consent", json={"given": True, "version": "v1"})

    # Attempt start interview with consent -> must succeed with 200
    start_consented = client.post("/api/v1/interviews/start", json={
        "patient_id": pat_id,
        "language": "en",
        "chief_complaint": "Upper abdominal burning"
    })
    assert start_consented.status_code == 200
    assert start_consented.json()["patient_id"] == pat_id


def test_11_patient_consent_isolation():
    """
    TEST 11: Patient A consent does NOT affect Patient B.
    """
    res_a = client.post("/api/v1/patients/register", json={"name": "Patient A", "age": 40, "gender": "Female"})
    res_b = client.post("/api/v1/patients/register", json={"name": "Patient B", "age": 45, "gender": "Male"})
    pat_a = res_a.json()["id"]
    pat_b = res_b.json()["id"]

    # Patient A accepts consent
    client.post(f"/api/v1/patients/{pat_a}/consent", json={"given": True})

    # Verify Patient A is consented
    detail_a = client.get(f"/api/v1/patients/{pat_a}").json()
    assert detail_a["consent"]["given"] is True

    # Verify Patient B remains unconsented
    detail_b = client.get(f"/api/v1/patients/{pat_b}").json()
    assert detail_b["consent"]["given"] is False

    # Patient A can start interview; Patient B is blocked
    start_a = client.post("/api/v1/interviews/start", json={"patient_id": pat_a, "language": "en"})
    assert start_a.status_code == 200

    start_b = client.post("/api/v1/interviews/start", json={"patient_id": pat_b, "language": "en"})
    assert start_b.status_code == 403
