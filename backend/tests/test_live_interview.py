import urllib.request
import json

def post(url, data):
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode(),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(req) as res:
        return json.loads(res.read().decode())

def run_interview_test():
    start = post("http://127.0.0.1:8000/api/v1/interviews/start", {"patient_id": "CF-PAT-01", "language": "hi"})
    sid = start["session_id"]
    print(f"1. Started interview session: {sid}")
    print(f"   Q1: {start['current_question']['question']}")

    # Answer Q1
    res1 = post(f"http://127.0.0.1:8000/api/v1/interviews/{sid}/respond", {"answer_text": "Severe stomach pain", "input_mode": "touch"})
    print(f"2. Q2: {res1['current_question']['question']}")
    print(f"   Chief Complaint Extracted: {res1['chief_complaint']}")
    assert "stomach" in res1["chief_complaint"].lower() or "abdomin" in res1["chief_complaint"].lower()

    # Answer Q2 (Site)
    res2 = post(f"http://127.0.0.1:8000/api/v1/interviews/{sid}/respond", {"answer_text": "Upper Abdomen (Below Ribs)", "input_mode": "touch"})
    print(f"3. Q3: {res2['current_question']['question']}")
    print(f"   Site Extracted: {res2['extracted_history']['site']}")
    assert "upper abdomen" in res2["extracted_history"]["site"].lower()

    # Answer Q3 (Onset)
    res3 = post(f"http://127.0.0.1:8000/api/v1/interviews/{sid}/respond", {"answer_text": "3 to 4 days ago", "input_mode": "touch"})
    print(f"4. Q4: {res3['current_question']['question']}")
    print(f"   Onset Extracted: {res3['extracted_history']['onset']}")
    assert "3" in res3["extracted_history"]["onset"]

    # Answer Q4 (Character)
    res4 = post(f"http://127.0.0.1:8000/api/v1/interviews/{sid}/respond", {"answer_text": "Burning sensation (जलन)", "input_mode": "touch"})
    print(f"5. Q5 (Adaptive branch): {res4['current_question']['question']}")
    print("   Character Extracted successfully")
    assert "burn" in res4["extracted_history"]["character"].lower()
    assert "meals" in res4["current_question"]["id"]

    # Test Undo
    undo_res = post(f"http://127.0.0.1:8000/api/v1/interviews/{sid}/back", {})
    print(f"6. Stepped back (Undo) to: {undo_res['current_question']['question']}")
    assert undo_res["current_question"]["id"] == "abdo_character"

    print("\n>>> ALL LIVE INTERVIEW FLOW TESTS PASSED 100% <<<")

if __name__ == "__main__":
    run_interview_test()
