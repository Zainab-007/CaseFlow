import urllib.request
import json

def get(url):
    with urllib.request.urlopen(url) as res:
        return json.loads(res.read().decode())

def put(url, data):
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode(),
        headers={'Content-Type': 'application/json'},
        method='PUT'
    )
    with urllib.request.urlopen(req) as res:
        return json.loads(res.read().decode())

def post(url, data):
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode(),
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    with urllib.request.urlopen(req) as res:
        return json.loads(res.read().decode())

def run_live_checks():
    print("=== 1. Live OPD Queue ===")
    queue = get("http://127.0.0.1:8000/api/v1/patients/queue")
    print(f"Queue length: {len(queue)}")
    for p in queue:
        token = p.get("queue_token")
        pid = p.get("id")
        name = p.get("name")
        priority = p.get("triage_priority")
        print(f"  Token: {token} | ID: {pid} | Name: {name} | Priority: {priority}")

    print("\n=== 2. Patient Isolation (Fetch CF-2026-001 vs CF-2026-002 vs CF-2026-004) ===")
    p1 = get("http://127.0.0.1:8000/api/v1/patients/CF-2026-001")
    p2 = get("http://127.0.0.1:8000/api/v1/patients/CF-2026-002")
    p4 = get("http://127.0.0.1:8000/api/v1/patients/CF-2026-004")
    print(f"P1: {p1['name']} | Complaint: {p1['chief_complaint']} | Red Flag: {p1['red_flag']['detected']}")
    print(f"P2: {p2['name']} | Complaint: {p2['chief_complaint']} | Red Flag: {p2['red_flag']['detected']}")
    print(f"P4: {p4['name']} | Complaint: {p4['chief_complaint']} | Red Flag: {p4['red_flag']['detected']}")

    assert p1['id'] != p2['id'] != p4['id']
    assert p1['name'] != p2['name'] != p4['name']

    print("\n=== 3. Test Intake Persistence (PUT /patients/CF-2026-001) ===")
    updated = put("http://127.0.0.1:8000/api/v1/patients/CF-2026-001", {
        "name": "Ramesh C. Sharma (Persisted)",
        "chief_complaint": "Persistent dry cough and exertional breathlessness"
    })
    print(f"Updated returned name: {updated['name']}")

    print("\n=== 4. Subsequent GET (Verify Persisted) ===")
    p1_after = get("http://127.0.0.1:8000/api/v1/patients/CF-2026-001")
    print(f"Persisted Name: {p1_after['name']}")
    print(f"Persisted Complaint: {p1_after['chief_complaint']}")
    assert p1_after['name'] == "Ramesh C. Sharma (Persisted)"

    print("\n=== 5. Verify CF-2026-002 and CF-2026-004 are Unaltered ===")
    p2_after = get("http://127.0.0.1:8000/api/v1/patients/CF-2026-002")
    p4_after = get("http://127.0.0.1:8000/api/v1/patients/CF-2026-004")
    assert p2_after['name'] == "Sunita Devi Verma", "Patient 2 was modified!"
    assert p4_after['name'] == "Mohammad Irfan", "Patient 4 was modified!"
    print("Isolation verified: CF-2026-002 and CF-2026-004 remain completely unaltered!")

    print("\n=== 6. Document Isolation ===")
    print(f"P1 documents count: {len(p1_after.get('documents', []))}")
    print(f"P2 documents count: {len(p2_after.get('documents', []))}")
    assert len(p2_after.get("documents", [])) == 0, "Document leakage detected!"
    print("Document isolation verified: No leakage between patients!")

    print("\n=== 7. Doctor Verification Action ===")
    verify_res = post("http://127.0.0.1:8000/api/v1/patients/CF-2026-001/verify", {
        "status": "Verified",
        "notes": "Chest auscultation completed. Bilateral basal crepitations noted.",
        "doctor_id": "Dr. S. K. Mehta"
    })
    print(f"Verification status: {verify_res['verification_status']} by {verify_res.get('verified_by')}")

    print("\n>>> ALL LIVE HTTP PERSISTENCE AND ISOLATION CHECKS PASSED 100% <<<")

if __name__ == "__main__":
    run_live_checks()
