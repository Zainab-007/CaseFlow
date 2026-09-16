
"""
Unit & Integration Tests for CaseFlow Medical Document Intake + Modular OCR Pipeline
SIH26047 — AI-Powered Patient Case-Taking System
"""

import io
import fitz  # PyMuPDF
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def create_sample_pdf() -> bytes:
    """Generates a valid PDF in-memory with clinical laboratory and prescription text."""
    doc = fitz.open()
    page = doc.new_page()
    text = (
        "APOLLO DIAGNOSTICS & CLINICAL LAB\n"
        "Patient: Ramesh Chandra Sharma | Age: 62 / Male\n"
        "Date: 20 Aug 2026\n"
        "\n"
        "COMPLETE BLOOD COUNT & METABOLIC REPORT\n"
        "Hemoglobin: 11.2 g/dL (Ref: 12.0 - 16.0 g/dL)\n"
        "Glycated Hemoglobin (HbA1c): 7.4 % (Ref: < 5.7 %)\n"
        "Platelet count: 220,000 /uL (Ref: 150,000 - 450,000 /uL)\n"
        "Serum Creatinine: 1.1 mg/dL (Ref: 0.6 - 1.2 mg/dL)\n"
        "\n"
        "Current Medications Noted:\n"
        "Tab. Telmisartan 40mg OD\n"
        "Tab. Metformin 500mg BD\n"
    )
    page.insert_text((50, 72), text, fontsize=11)
    pdf_bytes = doc.write()
    doc.close()
    return pdf_bytes


def run_tests():
    print("=== 1. Testing Document Upload with Digital PDF (PyMuPDF Extraction) ===")
    pdf_bytes = create_sample_pdf()
    files = {
        "file": ("Apollo_CBC_Report.pdf", io.BytesIO(pdf_bytes), "application/pdf")
    }
    data = {"patient_id": "CF-PAT-TEST", "document_type": "lab_report"}
    res = client.post("/api/v1/documents/upload", files=files, data=data)
    assert res.status_code == 200, f"Upload failed: {res.text}"
    doc_data = res.json()
    doc_id = doc_data["document_id"]
    print(f"Uploaded PDF Document ID: {doc_id}")
    print(f"Document Type: {doc_data['document_type']} | Title: {doc_data['title']}")
    print(f"Confidence: {doc_data['confidence_score']}")
    print(f"Medications Extracted: {len(doc_data['medications'])}")
    print(f"Lab Findings Extracted: {len(doc_data['lab_findings'])}")

    # Verify entities extracted from real PDF text
    param_names = [f["parameter"] for f in doc_data["lab_findings"]]
    assert any("Hemoglobin" in p for p in param_names), "Hemoglobin missing from extraction"
    assert any("HbA1c" in p for p in param_names), "HbA1c missing from extraction"
    assert any("Platelet" in p for p in param_names), "Platelets missing from extraction"

    med_names = [m["name"] for m in doc_data["medications"]]
    assert "Telmisartan" in med_names, "Telmisartan missing from extraction"
    assert "Metformin" in med_names, "Metformin missing from extraction"

    # Verify timeline metadata payload
    timeline_meta = doc_data.get("timeline_metadata")
    assert timeline_meta is not None, "Timeline metadata missing"
    assert timeline_meta["category"] == "Lab Investigation"
    print("Timeline Metadata prepared:", timeline_meta["title"], "| Category:", timeline_meta["category"])

    print("\n=== 2. Testing Document Upload with Image Slip (Modular OCR Pipeline) ===")
    img_bytes = b"FAKE_JPG_CONTENT_FOR_PRESCRIPTION_TEST"
    files = {
        "file": ("Prescription_Slip_Cardio.jpg", io.BytesIO(img_bytes), "image/jpeg")
    }
    data = {"patient_id": "CF-PAT-TEST", "document_type": "prescription"}
    res = client.post("/api/v1/documents/upload", files=files, data=data)
    assert res.status_code == 200, f"JPG Upload failed: {res.text}"
    img_doc = res.json()
    img_doc_id = img_doc["document_id"]
    print(f"Uploaded Image Document ID: {img_doc_id}")
    assert img_doc["file_type"] == "image"
    assert len(img_doc["medications"]) > 0, "Image OCR should extract medications"

    print("\n=== 3. Testing Patient Correction & Confirmation (PUT) ===")
    update_payload = {
        "title": "Verified Apollo Laboratory Report",
        "medications": [
            {"name": "Telmisartan", "dose": "80 mg", "frequency": "Once daily", "confidence": 1.0}
        ],
        "confirmed": True
    }
    res = client.put(f"/api/v1/documents/{doc_id}/confirm", json=update_payload)
    assert res.status_code == 200, f"Confirm failed: {res.text}"
    updated_doc = res.json()
    assert updated_doc["confirmed"] is True
    assert updated_doc["processing_status"] == "confirmed"
    assert updated_doc["medications"][0]["dose"] == "80 mg"
    print("Document successfully updated and confirmed by patient!")

    print("\n=== 4. Testing Document Retrieval by Patient ID ===")
    res = client.get("/api/v1/documents/patient/CF-PAT-TEST")
    assert res.status_code == 200
    pat_docs = res.json()
    assert len(pat_docs) >= 2, f"Expected at least 2 docs for patient, found {len(pat_docs)}"
    print(f"Patient Documents Retrieved: {len(pat_docs)} records associated with session")

    print("\n=== 5. Testing Document Deletion ===")
    res = client.delete(f"/api/v1/documents/{img_doc_id}")
    assert res.status_code == 200
    assert res.json()["status"] == "deleted"
    print("Deleted document:", img_doc_id)

    print("\n>>> ALL MEDICAL DOCUMENT INTAKE & OCR TESTS PASSED CLEANLY (100% OK) <<<")


if __name__ == "__main__":
    run_tests()
