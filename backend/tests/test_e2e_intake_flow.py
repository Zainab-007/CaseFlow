"""
Full End-to-End Integration Test for CaseFlow Kiosk Intake Flow:
Interview -> Documents -> OCR Pipeline -> Extraction Preview/Correction -> Confirm -> Review
"""

import io
import fitz
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_complete_intake_flow():
    patient_id = "CF-E2E-PATIENT"

    print(">>> 1. START ADAPTIVE INTERVIEW <<<")
    res = client.post("/api/v1/interviews/start", json={"patient_id": patient_id, "language": "hi"})
    assert res.status_code == 200
    session_id = res.json()["session_id"]
    print(f"Interview session started: {session_id}")

    # Root complaint -> Abdominal pain
    res = client.post(f"/api/v1/interviews/{session_id}/respond", json={"answer_text": "Stomach Pain / Abdominal Pain", "input_mode": "touch"})
    assert res.json()["chief_complaint"] == "Abdominal pain"

    # Site -> Upper abdomen
    res = client.post(f"/api/v1/interviews/{session_id}/respond", json={"answer_text": "Upper Abdomen (Below Ribs)", "input_mode": "touch"})
    assert res.json()["extracted_history"]["site"] == "Upper Abdomen (Below Ribs)"

    # Duration -> 3-4 days
    res = client.post(f"/api/v1/interviews/{session_id}/respond", json={"answer_text": "3 to 4 days ago", "input_mode": "touch"})

    # Character -> Burning -> Verify branch to abdo_burning_meals
    res = client.post(f"/api/v1/interviews/{session_id}/respond", json={"answer_text": "Burning sensation (जलन)", "input_mode": "touch"})
    assert res.json()["current_question"]["id"] == "abdo_burning_meals"
    print("Adaptive branch verified in interview!")

    # Complete interview
    res = client.post(f"/api/v1/interviews/{session_id}/complete")
    assert res.json()["completed"] is True
    print("Interview completed.")

    print("\n>>> 2. DOCUMENT UPLOAD & OCR EXTRACTION <<<")
    # Upload digital lab PDF
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((50, 72), "COMPLETE BLOOD COUNT REPORT\nHemoglobin: 11.2 g/dL\nGlycated Hemoglobin (HbA1c): 7.4 %\nPlatelets: 220,000 /uL\nDate: 20 Aug 2026\nRx: Tab. Telmisartan 40mg OD\nTab. Metformin 500mg BD")
    pdf_bytes = doc.write()
    doc.close()

    upload_res = client.post(
        "/api/v1/documents/upload",
        files={"file": ("Lab_CBC_Report.pdf", io.BytesIO(pdf_bytes), "application/pdf")},
        data={"patient_id": patient_id, "document_type": "lab_report"}
    )
    assert upload_res.status_code == 200
    doc_ocr = upload_res.json()
    doc_id = doc_ocr["document_id"]
    print(f"Document uploaded and parsed. Doc ID: {doc_id}")
    print(f"Extracted Meds: {[m['name'] for m in doc_ocr['medications']]}")
    print(f"Extracted Labs: {[l['parameter'] for l in doc_ocr['lab_findings']]}")
    assert len(doc_ocr["medications"]) >= 2
    assert len(doc_ocr["lab_findings"]) >= 3

    print("\n>>> 3. PATIENT CORRECTION & CONFIRMATION <<<")
    # Patient corrects a dosage and confirms
    confirm_res = client.put(
        f"/api/v1/documents/{doc_id}/confirm",
        json={
            "medications": [
                {"name": "Telmisartan", "dose": "40 mg", "frequency": "Once daily", "confidence": 1.0},
                {"name": "Metformin", "dose": "1000 mg", "frequency": "Twice daily", "confidence": 1.0}
            ],
            "confirmed": True
        }
    )
    assert confirm_res.status_code == 200
    confirmed_doc = confirm_res.json()
    assert confirmed_doc["confirmed"] is True
    assert confirmed_doc["processing_status"] == "confirmed"
    assert confirmed_doc["medications"][1]["dose"] == "1000 mg"
    print("Patient confirmation & correction verified.")

    print("\n>>> 4. RETRIEVE ASSOCIATED PATIENT DOCUMENTS FOR REVIEW <<<")
    list_res = client.get(f"/api/v1/documents/patient/{patient_id}")
    assert list_res.status_code == 200
    patient_docs = list_res.json()
    assert len(patient_docs) >= 1
    assert any(d["document_id"] == doc_id for d in patient_docs)
    print(f"Verified {len(patient_docs)} document(s) associated with patient session.")

    print("\n>>> 5. PREPARATION OF TIMELINE METADATA <<<")
    meta = confirmed_doc["timeline_metadata"]
    assert meta["category"] == "Lab Investigation"
    assert "date" in meta and meta["date"]
    print(f"Timeline event prepared: '{meta['title']}' ({meta['date']})")

    print("\n=============================================================")
    print("SUCCESS: COMPLETE END-TO-END FLOW VERIFIED CLEANLY (100% OK)!")
    print("Interview -> Documents -> OCR -> Preview -> Confirm -> Review")
    print("=============================================================")


if __name__ == "__main__":
    test_complete_intake_flow()
