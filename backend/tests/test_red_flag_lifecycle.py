"""
Test suite for Red-Flag Lifecycle Management (SIH26047).
Verifies:
1. Red flag starts ACTIVE
2. Transition ACTIVE -> REVIEWED
3. Transition REVIEWED -> RESOLVED
4. Invalid status rejected (HTTP 400)
5. Unknown red flag ID rejected (HTTP 404)
6. Unknown patient ID rejected (HTTP 404)
7. Audit timeline event created for each transition
8. No duplicate timeline events on repeated or non-transition calls
9. Strict patient isolation (Patient A cannot update Patient B's red flag)
10. Dashboard active red-flag queue count updates accurately
11. Persistence across SQLite service restart
"""

import os
import tempfile
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.base_patient_service import StatefulPatientService, patient_service

client = TestClient(app)


def test_red_flag_starts_active():
    """Verify that seeded patients and newly detected alerts start with ACTIVE status."""
    res = client.get("/api/v1/patients/CF-2026-004")
    assert res.status_code == 200
    p = res.json()
    assert p["red_flag_detected"] is True
    assert "red_flags" in p
    assert len(p["red_flags"]) >= 1
    rf = p["red_flags"][0]
    assert rf["status"] == "ACTIVE"
    assert rf["reviewed_at"] is None
    assert rf["resolved_at"] is None


def test_active_to_reviewed_transition():
    """Verify transition from ACTIVE -> REVIEWED updates timestamps, attribution, and returns updated record."""
    pid = "CF-2026-004"
    rf_id = "RF-CF-2026-004-1"

    # Set to REVIEWED
    res = client.patch(
        f"/api/v1/patients/{pid}/red-flags/{rf_id}",
        json={"status": "REVIEWED", "doctor_id": "Dr. S. K. Mehta (Reg: MCI-48201)"}
    )
    assert res.status_code == 200
    p = res.json()
    target = next((rf for rf in p["red_flags"] if rf["id"] == rf_id), None)
    assert target is not None
    assert target["status"] == "REVIEWED"
    assert target["reviewed_at"] is not None
    assert "Dr. S. K. Mehta" in target["reviewed_by"]

    # Verify timeline event
    tl_events = [e for e in p["timeline"] if e.get("red_flag_id") == rf_id and e.get("new_status") == "REVIEWED"]
    assert len(tl_events) == 1
    assert tl_events[0]["title"] == "Red flag reviewed"
    assert tl_events[0]["source"] == "doctor"


def test_reviewed_to_resolved_transition():
    """Verify transition from REVIEWED -> RESOLVED updates status and adds timeline event."""
    pid = "CF-2026-004"
    rf_id = "RF-CF-2026-004-1"

    # Set to RESOLVED
    res = client.patch(
        f"/api/v1/patients/{pid}/red-flags/{rf_id}",
        json={"status": "RESOLVED", "doctor_id": "Dr. S. K. Mehta (Reg: MCI-48201)"}
    )
    assert res.status_code == 200
    p = res.json()
    target = next((rf for rf in p["red_flags"] if rf["id"] == rf_id), None)
    assert target is not None
    assert target["status"] == "RESOLVED"
    assert target["resolved_at"] is not None
    assert "Dr. S. K. Mehta" in target["resolved_by"]

    # When all red flags are resolved, patient.red_flag_detected should be False
    assert p["red_flag_detected"] is False

    # Verify timeline event
    tl_events = [e for e in p["timeline"] if e.get("red_flag_id") == rf_id and e.get("new_status") == "RESOLVED"]
    assert len(tl_events) == 1
    assert tl_events[0]["title"] == "Red flag resolved"
    assert tl_events[0]["source"] == "doctor"


def test_invalid_status_rejected():
    """Verify that invalid statuses (e.g. CLOSED, DISMISSED, INVALID) are rejected with 400."""
    pid = "CF-2026-004"
    rf_id = "RF-CF-2026-004-1"

    res = client.patch(
        f"/api/v1/patients/{pid}/red-flags/{rf_id}",
        json={"status": "DISMISSED"}
    )
    assert res.status_code == 400
    assert "Must be one of: ACTIVE, REVIEWED, RESOLVED" in res.json()["detail"]


def test_unknown_red_flag_rejected():
    """Verify 404 when red flag ID does not exist on the given patient."""
    pid = "CF-2026-004"
    res = client.patch(
        f"/api/v1/patients/{pid}/red-flags/RF-NONEXISTENT-999",
        json={"status": "REVIEWED"}
    )
    assert res.status_code == 404
    assert "not found" in res.json()["detail"].lower()


def test_unknown_patient_rejected():
    """Verify 404 when patient ID does not exist."""
    res = client.patch(
        "/api/v1/patients/CF-GHOST-PATIENT/red-flags/RF-001",
        json={"status": "REVIEWED"}
    )
    assert res.status_code == 404
    assert "patient not found" in res.json()["detail"].lower()


def test_no_duplicate_timeline_events():
    """Verify repeated transitions with same status do not produce duplicate audit events."""
    pid = "CF-2026-004"
    rf_id = "RF-CF-2026-004-1"

    # First transition: ACTIVE -> REVIEWED
    res1 = client.patch(
        f"/api/v1/patients/{pid}/red-flags/{rf_id}",
        json={"status": "REVIEWED"}
    )
    assert res1.status_code == 200
    count_1 = len([e for e in res1.json()["timeline"] if e.get("red_flag_id") == rf_id])

    # Second call with same status (idempotent / refresh simulation)
    res2 = client.patch(
        f"/api/v1/patients/{pid}/red-flags/{rf_id}",
        json={"status": "REVIEWED"}
    )
    assert res2.status_code == 200
    count_2 = len([e for e in res2.json()["timeline"] if e.get("red_flag_id") == rf_id])

    assert count_1 == count_2, "No duplicate timeline events should be generated for no-op transitions"


def test_patient_isolation_red_flags():
    """Verify Patient A cannot modify Patient B's red flag, and updating Patient A never modifies Patient B."""
    pid_a = "CF-2026-001"
    pid_b = "CF-2026-004"
    rf_b = "RF-CF-2026-004-1"

    # Attempt to update Patient B's flag via Patient A's route
    res = client.patch(
        f"/api/v1/patients/{pid_a}/red-flags/{rf_b}",
        json={"status": "RESOLVED"}
    )
    assert res.status_code == 404

    # Ensure Patient B's red flag is still intact and not altered
    res_b = client.get(f"/api/v1/patients/{pid_b}")
    assert res_b.status_code == 200
    target_b = next(rf for rf in res_b.json()["red_flags"] if rf["id"] == rf_b)
    # B was REVIEWED in previous test, must not be RESOLVED
    assert target_b["status"] != "RESOLVED"


def test_dashboard_active_red_flag_count():
    """Verify that queue statistics count ONLY currently ACTIVE red flags."""
    # Reset CF-2026-004 to known ACTIVE state
    client.patch("/api/v1/patients/CF-2026-004/red-flags/RF-CF-2026-004-1", json={"status": "ACTIVE"})

    # Check initial queue active count
    q_res = client.get("/api/v1/patients/queue")
    assert q_res.status_code == 200
    queue = q_res.json()
    initial_active_count = sum(1 for p in queue if p.get("red_flag_detected"))
    assert initial_active_count >= 1

    # Mark CF-2026-004 as REVIEWED (no longer active)
    client.patch("/api/v1/patients/CF-2026-004/red-flags/RF-CF-2026-004-1", json={"status": "REVIEWED"})

    # Queue should now decrease active red flag count by 1
    q_res2 = client.get("/api/v1/patients/queue")
    queue2 = q_res2.json()
    active_rf_count2 = sum(1 for p in queue2 if p.get("red_flag_detected"))
    assert active_rf_count2 == initial_active_count - 1

    # Mark CF-2026-004 as RESOLVED (still not active)
    client.patch("/api/v1/patients/CF-2026-004/red-flags/RF-CF-2026-004-1", json={"status": "RESOLVED"})
    q_res3 = client.get("/api/v1/patients/queue")
    queue3 = q_res3.json()
    active_rf_count3 = sum(1 for p in queue3 if p.get("red_flag_detected"))
    assert active_rf_count3 == initial_active_count - 1

    # Reset back to ACTIVE for subsequent test consistency
    client.patch("/api/v1/patients/CF-2026-004/red-flags/RF-CF-2026-004-1", json={"status": "ACTIVE"})
    q_res4 = client.get("/api/v1/patients/queue")
    active_rf_count4 = sum(1 for p in q_res4.json() if p.get("red_flag_detected"))
    assert active_rf_count4 == initial_active_count


@pytest.mark.anyio
async def test_sqlite_persistence_across_service_restart():
    """Verify red flag lifecycle transitions persist to SQLite across service restart."""
    fd, temp_db = tempfile.mkstemp(suffix=".db")
    os.close(fd)

    try:
        service1 = StatefulPatientService(db_path=temp_db)
        pid = "TEST-PATIENT-RF"

        # Create patient via interview with red flag
        service1.sync_interview_data(
            patient_id=pid,
            chief_complaint="Chest pressure with diaphoresis",
            extracted_history={"onset": "1 hour ago", "severity": "9/10"},
            red_flags=["Suspected acute coronary syndrome"],
            session_completed=True
        )

        p1 = await service1.get_patient_by_id(pid)
        assert p1["red_flag_detected"] is True
        assert len(p1["red_flags"]) == 1
        rf_id = p1["red_flags"][0]["id"]
        assert p1["red_flags"][0]["status"] == "ACTIVE"

        # Transition ACTIVE -> REVIEWED
        service1.update_red_flag_status(
            patient_id=pid,
            red_flag_id=rf_id,
            status="REVIEWED",
            doctor_id="Dr. Test Specialist"
        )

        # Transition REVIEWED -> RESOLVED
        service1.update_red_flag_status(
            patient_id=pid,
            red_flag_id=rf_id,
            status="RESOLVED",
            doctor_id="Dr. Test Specialist"
        )

        # Simulate service restart: create a new service instance pointing to the same SQLite DB
        service2 = StatefulPatientService(db_path=temp_db)
        p2 = await service2.get_patient_by_id(pid)

        assert p2 is not None
        assert p2["red_flag_detected"] is False
        assert len(p2["red_flags"]) == 1
        saved_rf = p2["red_flags"][0]
        assert saved_rf["status"] == "RESOLVED"
        assert saved_rf["resolved_at"] is not None
        assert saved_rf["resolved_by"] == "Dr. Test Specialist"

        # Verify timeline events persisted
        tl_reviewed = [e for e in p2["timeline"] if e.get("new_status") == "REVIEWED"]
        tl_resolved = [e for e in p2["timeline"] if e.get("new_status") == "RESOLVED"]
        assert len(tl_reviewed) == 1
        assert len(tl_resolved) == 1

    finally:
        if os.path.exists(temp_db):
            try:
                os.remove(temp_db)
            except OSError:
                pass
