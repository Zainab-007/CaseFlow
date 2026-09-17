"""
Regression Tests for Feature: OCR -> Canonical Patient Record -> Structured History + Timeline
SIH26047 — CaseFlow AI-Powered Patient Case-Taking Software

Tests the 8 required scenarios:
TEST 1: Upload/confirm prescription for Patient A -> medication appears in Patient A record.
TEST 2: Upload/confirm lab report for Patient A -> lab appears in Patient A structured history.
TEST 3: Document confirmation -> timeline event is created.
TEST 4: Existing registration + interview timeline events remain intact.
TEST 5: Patient A document data does not appear in Patient B.
TEST 6: Duplicate medication is not blindly duplicated (e.g., Paracetamol vs Paracetamol 500 mg).
TEST 7: Unconfirmed OCR extraction does NOT enter the canonical clinical record.
TEST 8: Existing patient-data isolation tests continue to pass.
"""

import io
import fitz  # PyMuPDF
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def create_prescription_pdf(med_name="Paracetamol 500mg", freq="twice daily") -> bytes:
    """Helper to generate a prescription PDF with custom medication details."""
    doc = fitz.open()
    page = doc.new_page()
    text = (
        "CITY MULTISPECIALITY CLINIC\n"
        "Outpatient Department Prescription Slip\n"
        "Date: 15 Sep 2026\n"
        "Rx:\n"
        f"Tab. {med_name} -- {freq}\n"
        "Advice: Take after meals for 3 days.\n"
    )
    page.insert_text((50, 72), text, fontsize=11)
    pdf_bytes = doc.write()
    doc.close()
    return pdf_bytes


def create_lab_pdf(hb_val="12.4", hba1c_val="6.2") -> bytes:
    """Helper to generate a laboratory diagnostic PDF."""
    doc = fitz.open()
    page = doc.new_page()
    text = (
        "NATIONAL PATHOLOGY & DIAGNOSTIC LAB\n"
        "Clinical Laboratory Report\n"
        "Date: 14 Sep 2026\n"
        f"Hemoglobin: {hb_val} g/dL (Reference: 12.0 - 16.0 g/dL)\n"
        f"Glycated Hemoglobin (HbA1c): {hba1c_val} % (Reference: < 5.7 %)\n"
        "Platelet count: 240,000 /uL (Reference: 150,000 - 450,000 /uL)\n"
        "Serum Creatinine: 0.9 mg/dL (Reference: 0.6 - 1.2 mg/dL)\n"
    )
    page.insert_text((50, 72), text, fontsize=11)
    pdf_bytes = doc.write()
    doc.close()
    return pdf_bytes


def test_ocr_canonical_history_integration_suite():
    print("\n==================================================================")
    print("STARTING TEST SUITE: OCR -> CANONICAL RECORD -> STRUCTURED HISTORY + TIMELINE")
    print("==================================================================")

    # -------------------------------------------------------------
    # SETUP: Register Patient A (Aarav Sharma, 32, Male, Cough)
    # -------------------------------------------------------------
    reg_a = client.post("/api/v1/patients/register", json={
        "name": "Aarav Sharma",
        "age": 32,
        "gender": "Male",
        "phone": "+91 98111 22222",
        "abha_id": "91-0000-1111-2222",
        "chief_complaint": "Persistent cough and mild fever",
        "department": "General Medicine",
        "preferred_language": "Hindi / English"
    }).json()
    pat_a_id = reg_a["id"]
    print(f"Registered Patient A: {pat_a_id} ({reg_a['name']})")

    # Record consent for Patient A
    client.post(f"/api/v1/patients/{pat_a_id}/consent", json={"given": True})

    # Complete interview for Patient A with Paracetamol already reported
    int_a = client.post("/api/v1/interviews/start", json={
        "patient_id": pat_a_id,
        "language": "en"
    }).json()
    session_a_id = int_a["session_id"]

    # Submit interview answers
    client.post(f"/api/v1/interviews/{session_a_id}/respond", json={
        "answer_text": "Persistent cough",
        "input_mode": "touch"
    })
    # Complete session -> should generate "Interview completed" timeline event
    client.post(f"/api/v1/interviews/{session_a_id}/complete")

    # Add a pre-existing medication to Patient A's structured history via patient service
    from app.services.base_patient_service import patient_service
    pat_a_record = patient_service._patients[pat_a_id]
    pat_a_record["structured_history"]["current_medications"].append({
        "name": "Paracetamol",
        "dose": "",
        "frequency": "",
        "source": "interview"
    })
    pat_a_record["medications"] = pat_a_record["structured_history"]["current_medications"]

    # -------------------------------------------------------------
    # TEST 7: Unconfirmed OCR extraction does NOT enter canonical record
    # -------------------------------------------------------------
    print("\n--- TEST 7: Unconfirmed OCR extraction does NOT enter canonical clinical record ---")
    rx_pdf_bytes = create_prescription_pdf("Paracetamol 500mg", "twice daily")
    upload_res = client.post(
        "/api/v1/documents/upload",
        files={"file": ("Rx_Prescription_Aarav.pdf", io.BytesIO(rx_pdf_bytes), "application/pdf")},
        data={"patient_id": pat_a_id, "document_type": "prescription"}
    )
    assert upload_res.status_code == 200, f"Upload failed: {upload_res.text}"
    doc_rx = upload_res.json()
    doc_rx_id = doc_rx["document_id"]
    assert doc_rx["confirmed"] is False
    assert doc_rx["status"] == "extracted"

    # Fetch Patient A record BEFORE confirmation
    pat_a_pre = client.get(f"/api/v1/patients/{pat_a_id}").json()
    meds_pre = pat_a_pre["structured_history"]["current_medications"]
    # Paracetamol dose should NOT be updated yet!
    paracetamol_pre = next(m for m in meds_pre if "paracetamol" in m["name"].lower())
    assert paracetamol_pre["dose"] == "", "Unconfirmed OCR must not update medication dose!"

    # Verify no document timeline event yet
    timeline_pre = pat_a_pre["timeline"]
    doc_events_pre = [e for e in timeline_pre if e.get("type") == "document_uploaded"]
    assert len(doc_events_pre) == 0, "Unconfirmed OCR must not create a document timeline event!"
    print("TEST 7 PASSED: Unconfirmed OCR extraction correctly isolated from canonical record.")

    # -------------------------------------------------------------
    # TEST 1 & TEST 6: Confirm prescription & duplicate normalization
    # -------------------------------------------------------------
    print("\n--- TEST 1 & TEST 6: Confirm prescription & avoid duplicate Paracetamol ---")
    confirm_rx_res = client.put(f"/api/v1/documents/{doc_rx_id}/confirm", json={
        "document_type": "prescription",
        "medications": [
            {
                "name": "Paracetamol",
                "dose": "500 mg",
                "frequency": "twice daily",
                "duration": "3 days",
                "source": "ocr"
            }
        ],
        "confirmed": True
    })
    assert confirm_rx_res.status_code == 200
    assert confirm_rx_res.json()["confirmed"] is True

    # Fetch updated Patient A record
    pat_a_post_rx = client.get(f"/api/v1/patients/{pat_a_id}").json()
    meds_post_rx = pat_a_post_rx["structured_history"]["current_medications"]

    # Verify only ONE Paracetamol exists (duplicate avoided)
    paracetamol_entries = [m for m in meds_post_rx if "paracetamol" in m["name"].lower()]
    assert len(paracetamol_entries) == 1, f"Expected exactly 1 Paracetamol entry, found {len(paracetamol_entries)}"

    paracetamol = paracetamol_entries[0]
    assert paracetamol["dose"] == "500 mg", "Paracetamol dose must be updated to 500 mg"
    assert "twice daily" in paracetamol["frequency"].lower(), "Paracetamol frequency must be updated"
    assert paracetamol.get("source") in ["ocr", "interview"], "Medication source provenance must be retained"
    print(f"Patient A Meds after confirmation: {meds_post_rx}")
    print("TEST 1 & TEST 6 PASSED: Medication merged with normalized deduplication.")

    # -------------------------------------------------------------
    # TEST 2: Upload/confirm lab report -> lab appears in structured history
    # -------------------------------------------------------------
    print("\n--- TEST 2: Upload/confirm lab report for Patient A ---")
    lab_pdf_bytes = create_lab_pdf(hb_val="12.4", hba1c_val="6.2")
    upload_lab_res = client.post(
        "/api/v1/documents/upload",
        files={"file": ("Lab_CBC_Report_Aarav.pdf", io.BytesIO(lab_pdf_bytes), "application/pdf")},
        data={"patient_id": pat_a_id, "document_type": "lab_report"}
    )
    assert upload_lab_res.status_code == 200
    doc_lab = upload_lab_res.json()
    doc_lab_id = doc_lab["document_id"]

    # Confirm lab extraction
    confirm_lab_res = client.put(f"/api/v1/documents/{doc_lab_id}/confirm", json={
        "document_type": "lab_report",
        "lab_findings": [
            {
                "name": "Hemoglobin",
                "parameter": "Hemoglobin",
                "value": "12.4",
                "unit": "g/dL",
                "status": "Normal",
                "reference_range": "12.0 - 16.0 g/dL",
                "source": "ocr"
            }
        ],
        "confirmed": True
    })
    assert confirm_lab_res.status_code == 200

    # Fetch updated Patient A record
    pat_a_post_lab = client.get(f"/api/v1/patients/{pat_a_id}").json()
    labs = pat_a_post_lab["structured_history"].get("labs", [])
    assert len(labs) >= 1, "Labs list in structured_history must not be empty"

    hb_lab = next((l for l in labs if "hemoglobin" in l.get("name", "").lower() or "hemoglobin" in l.get("parameter", "").lower()), None)
    assert hb_lab is not None, "Hemoglobin must be present in structured_history.labs"
    assert hb_lab["value"] == "12.4", "Hemoglobin value must be exactly 12.4"
    assert hb_lab["unit"] == "g/dL", "Hemoglobin unit must be g/dL"
    assert hb_lab["source"] == "ocr", "Lab source provenance must be 'ocr'"
    print(f"Patient A Labs after confirmation: {labs}")
    print("TEST 2 PASSED: Lab results merged into structured history.")

    # -------------------------------------------------------------
    # TEST 3 & TEST 4: Timeline events created and previous intact
    # -------------------------------------------------------------
    print("\n--- TEST 3 & TEST 4: Document events in timeline & previous events intact ---")
    timeline = pat_a_post_lab["timeline"]
    print(f"Patient A Timeline Events ({len(timeline)} total):")
    for t in timeline:
        print(f"  - [{t.get('source')}] {t.get('title')}: {t.get('description')}")

    # Check that Registration event exists
    reg_events = [t for t in timeline if "registered" in t.get("title", "").lower()]
    assert len(reg_events) >= 1, "Registration timeline event must be preserved"

    # Check that Interview event exists
    int_events = [t for t in timeline if "interview" in t.get("title", "").lower()]
    assert len(int_events) >= 1, "Interview completed timeline event must be preserved"

    # Check that Document events exist
    doc_events = [t for t in timeline if t.get("type") == "document_uploaded" or "uploaded" in t.get("title", "").lower()]
    assert len(doc_events) >= 2, f"Expected at least 2 document events (Rx + Lab), found {len(doc_events)}"

    # Check timeline event structure
    rx_event = next(e for e in doc_events if "prescription" in e["title"].lower())
    assert rx_event["patient_id"] == pat_a_id, "Timeline event must bind to patient_id"
    assert rx_event["source"] == "document", "Timeline event source must be 'document'"
    assert "timestamp" in rx_event, "Timeline event must have timestamp"

    lab_event = next(e for e in doc_events if "lab" in e["title"].lower())
    assert lab_event["patient_id"] == pat_a_id
    assert lab_event["source"] == "document"

    # Check explicit timeline endpoint
    get_timeline_res = client.get(f"/api/v1/patients/{pat_a_id}/timeline")
    assert get_timeline_res.status_code == 200
    assert len(get_timeline_res.json()) == len(timeline)
    print("TEST 3 & TEST 4 PASSED: Timeline events created and history preserved.")

    # -------------------------------------------------------------
    # TEST 5: Patient A document data does NOT appear in Patient B
    # -------------------------------------------------------------
    print("\n--- TEST 5: Patient A document data does NOT leak to Patient B ---")
    reg_b = client.post("/api/v1/patients/register", json={
        "name": "Bhavna Patel",
        "age": 27,
        "gender": "Female",
        "phone": "+91 98333 44444",
        "abha_id": "91-0000-3333-4444",
        "chief_complaint": "Acidity and indigestion",
        "department": "General Medicine",
        "preferred_language": "Hindi"
    }).json()
    pat_b_id = reg_b["id"]
    print(f"Registered Patient B: {pat_b_id} ({reg_b['name']})")

    # Fetch Patient B record
    pat_b = client.get(f"/api/v1/patients/{pat_b_id}").json()

    # Patient B must NOT have Patient A's Paracetamol
    pat_b_meds = pat_b["structured_history"].get("current_medications", [])
    assert not any("paracetamol" in m.get("name", "").lower() for m in pat_b_meds), "Patient A's medication leaked to Patient B!"

    # Patient B must NOT have Patient A's Hemoglobin lab
    pat_b_labs = pat_b["structured_history"].get("labs", [])
    assert not any("hemoglobin" in l.get("name", "").lower() for l in pat_b_labs), "Patient A's lab leaked to Patient B!"

    # Patient B must NOT have Patient A's documents
    pat_b_docs = pat_b.get("documents", [])
    assert len(pat_b_docs) == 0, f"Patient B should have 0 documents, found {len(pat_b_docs)}"

    # Patient B timeline must NOT have Patient A's prescription or lab events
    pat_b_timeline = pat_b.get("timeline", [])
    assert not any(pat_a_id in t.get("patient_id", "") for t in pat_b_timeline)
    assert not any("prescription" in t.get("title", "").lower() for t in pat_b_timeline)
    assert not any("lab report" in t.get("title", "").lower() for t in pat_b_timeline)
    print("TEST 5 PASSED: Strict patient isolation confirmed: Zero Patient A data in Patient B.")

    # -------------------------------------------------------------
    # TEST 8: Seeded demo patient CF-2026-001 remains intact
    # -------------------------------------------------------------
    print("\n--- TEST 8: Seeded demo patient CF-2026-001 remains intact ---")
    ramesh = client.get("/api/v1/patients/CF-2026-001").json()
    assert ramesh["name"] == "Ramesh Chandra Sharma"
    assert "cough" in ramesh["chief_complaint"].lower()
    assert len(ramesh["structured_history"]["current_medications"]) >= 2
    assert len(ramesh["documents"]) >= 2
    print("TEST 8 PASSED: Seeded demo patients completely unaltered.")

    print("\n==================================================================")
    print("ALL 8 INTEGRATION TESTS PASSED SUCCESSFULLY!")
    print("==================================================================")


def test_confirmed_ocr_reaches_canonical_patient_record_and_timeline():
    """
    Direct regression test for the exact manual test bug:
    1. Create Patient A.
    2. Upload/attach document to Patient A.
    3. Confirm document.
    4. Fetch Patient A.
    5. Assert Paracetamol exists in medications.
    6. Assert Cetirizine exists in medications.
    7. Assert Hemoglobin exists in labs.
    8. Assert document timeline event exists.
    9. Create Patient B.
    10. Assert none of Patient A's document data exists in Patient B.
    """
    # 1. Create Patient A
    reg_a = client.post("/api/v1/patients/register", json={
        "name": "Manual Test Patient A",
        "age": 28,
        "gender": "Female",
        "phone": "+91 98765 43210",
        "chief_complaint": "Viral fever and throat irritation"
    }).json()
    pat_a_id = reg_a["id"]
    assert pat_a_id.startswith("CF-2026-")

    # Mark intake completed to add interview completed event
    client.put(f"/api/v1/patients/{pat_a_id}", json={"intake_status": "Completed"})

    # 2. Upload/attach document to Patient A
    doc_pdf_bytes = create_prescription_pdf("Paracetamol 500 mg\nTab. Cetirizine 10 mg\nHemoglobin: 13.8 g/dL")
    upload_res = client.post(
        "/api/v1/documents/upload",
        files={"file": ("CaseFlow_Fake_Prescription.pdf", io.BytesIO(doc_pdf_bytes), "application/pdf")},
        data={"patient_id": pat_a_id, "document_type": "prescription"}
    )
    assert upload_res.status_code == 200
    doc_data = upload_res.json()
    doc_id = doc_data["document_id"]
    assert doc_data["patient_id"] == pat_a_id

    # 3. Confirm document
    confirm_res = client.put(f"/api/v1/documents/{doc_id}/confirm", json={
        "medications": [
            {"name": "Paracetamol", "dose": "500 mg", "frequency": "Twice daily", "source": "ocr"},
            {"name": "Cetirizine", "dose": "10 mg", "frequency": "Once daily", "source": "ocr"}
        ],
        "lab_findings": [
            {"parameter": "Hemoglobin (Hb)", "value": "13.8", "unit": "g/dL", "status": "Normal", "source": "ocr"}
        ],
        "confirmed": True
    })
    assert confirm_res.status_code == 200
    confirmed_doc = confirm_res.json()
    assert confirmed_doc["confirmed"] is True
    assert confirmed_doc["status"] == "confirmed"

    # 4. Fetch Patient A
    pat_a = client.get(f"/api/v1/patients/{pat_a_id}").json()

    # 5. Assert Paracetamol exists in medications
    meds = pat_a.get("structured_history", {}).get("current_medications", [])
    top_meds = pat_a.get("medications", [])
    paracetamol = next((m for m in meds if "paracetamol" in m.get("name", "").lower()), None)
    assert paracetamol is not None, "Paracetamol must exist in structured_history.current_medications"
    assert paracetamol.get("dose") == "500 mg"
    assert paracetamol.get("source") == "ocr"
    assert any("paracetamol" in m.get("name", "").lower() for m in top_meds), "Paracetamol must exist in patient.medications mirror"

    # 6. Assert Cetirizine exists in medications
    cetirizine = next((m for m in meds if "cetirizine" in m.get("name", "").lower()), None)
    assert cetirizine is not None, "Cetirizine must exist in structured_history.current_medications"
    assert cetirizine.get("dose") == "10 mg"
    assert cetirizine.get("source") == "ocr"

    # 7. Assert Hemoglobin exists in labs
    labs = pat_a.get("structured_history", {}).get("labs", [])
    top_labs = pat_a.get("labs", [])
    hb_lab = next((l for l in labs if "hemoglobin" in l.get("parameter", "").lower() or "hemoglobin" in l.get("name", "").lower()), None)
    assert hb_lab is not None, "Hemoglobin must exist in structured_history.labs"
    assert hb_lab.get("value") == "13.8"
    assert hb_lab.get("unit") == "g/dL"
    assert hb_lab.get("source") == "ocr"
    assert any("hemoglobin" in (l.get("parameter") or l.get("name", "")).lower() for l in top_labs), "Hemoglobin must exist in patient.labs mirror"

    # 8. Assert document timeline event exists
    timeline = pat_a.get("timeline", [])
    doc_timeline = [e for e in timeline if e.get("source") == "document" or "uploaded" in e.get("title", "").lower()]
    assert len(doc_timeline) >= 1, "Timeline must contain a document event"
    assert doc_timeline[0].get("patient_id") == pat_a_id
    assert len(timeline) >= 3, f"Expected 3 timeline events (Registration, Interview completed, Document confirmed), got {len(timeline)}"

    # 9. Create Patient B
    reg_b = client.post("/api/v1/patients/register", json={
        "name": "Manual Test Patient B",
        "age": 45,
        "gender": "Male",
        "phone": "+91 91234 56789",
        "chief_complaint": "Routine checkup"
    }).json()
    pat_b_id = reg_b["id"]
    assert pat_b_id != pat_a_id

    # 10. Assert none of Patient A's document data exists in Patient B
    pat_b = client.get(f"/api/v1/patients/{pat_b_id}").json()
    pat_b_meds = pat_b.get("structured_history", {}).get("current_medications", [])
    pat_b_labs = pat_b.get("structured_history", {}).get("labs", [])
    pat_b_timeline = pat_b.get("timeline", [])

    assert not any("paracetamol" in m.get("name", "").lower() for m in pat_b_meds), "Patient A Paracetamol leaked to Patient B!"
    assert not any("cetirizine" in m.get("name", "").lower() for m in pat_b_meds), "Patient A Cetirizine leaked to Patient B!"
    assert not any("hemoglobin" in (l.get("parameter") or l.get("name", "")).lower() for l in pat_b_labs), "Patient A Hemoglobin leaked to Patient B!"
    assert not any(t.get("source") == "document" for t in pat_b_timeline), "Patient A document event leaked to Patient B!"


if __name__ == "__main__":
    test_ocr_canonical_history_integration_suite()
    test_confirmed_ocr_reaches_canonical_patient_record_and_timeline()

