"""
CaseFlow FHIR R4-Compatible Serializer & ABDM Interoperability Service.
SIH26047 — AI-Powered Patient Case-Taking System.

Converts canonical CaseFlow patient clinical records into standard FHIR R4 Bundles
for interoperable electronic health record exchange and simulated ABHA push.
Does NOT invent clinical information — derives strictly from existing record attributes.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime
import uuid


class FhirService:
    """
    Serializes canonical CaseFlow patient records into FHIR R4-compatible JSON Bundles.
    Preserves provenance, timestamps, and patient isolation.
    """

    @staticmethod
    def patient_to_fhir_bundle(patient: Dict[str, Any]) -> Dict[str, Any]:
        """
        Converts a canonical patient dictionary into a FHIR R4 collection Bundle.
        Guarantees:
        - Deterministic Bundle ID
        - Patient isolation (only resources belonging to this patient)
        - Faithful representation of demographics, observations, vitals, labs, medications, documents, and consent.
        """
        patient_id = patient.get("id") or "UNKNOWN"
        now_iso = datetime.now().isoformat()

        bundle: Dict[str, Any] = {
            "resourceType": "Bundle",
            "id": f"bundle-{patient_id}",
            "type": "collection",
            "timestamp": now_iso,
            "meta": {
                "lastUpdated": now_iso,
                "profile": ["https://nrces.in/ndhm/fhir/r4/StructureDefinition/DocumentBundle"]
            },
            "entry": []
        }

        # 1. Patient Resource
        gender_raw = patient.get("gender") or patient.get("demographics", {}).get("gender") or "unknown"
        gender_fhir = str(gender_raw).strip().lower()
        if gender_fhir not in ("male", "female", "other", "unknown"):
            gender_fhir = "unknown"

        identifiers = [
            {
                "system": "https://caseflow.health/patient-id",
                "value": patient_id
            }
        ]
        abha_id = patient.get("abha_id") or patient.get("demographics", {}).get("abha_id")
        if abha_id and str(abha_id).strip().lower() not in ("not linked", "none", ""):
            identifiers.insert(0, {
                "system": "https://healthid.ndhm.gov.in",
                "value": str(abha_id).strip()
            })

        patient_name = patient.get("name") or patient.get("demographics", {}).get("name") or "Patient"

        telecom = []
        phone = patient.get("phone") or patient.get("demographics", {}).get("contact")
        if phone:
            telecom.append({
                "system": "phone",
                "value": str(phone).strip()
            })

        patient_resource: Dict[str, Any] = {
            "resourceType": "Patient",
            "id": patient_id,
            "identifier": identifiers,
            "name": [
                {
                    "use": "official",
                    "text": patient_name
                }
            ],
            "gender": gender_fhir
        }
        if telecom:
            patient_resource["telecom"] = telecom

        age = patient.get("age") or patient.get("demographics", {}).get("age")
        if age:
            try:
                approx_year = 2026 - int(age)
                patient_resource["birthDate"] = f"{approx_year}-01-01"
            except (ValueError, TypeError):
                pass

        bundle["entry"].append({
            "fullUrl": f"urn:uuid:patient-{patient_id}",
            "resource": patient_resource
        })

        subject_ref = {"reference": f"Patient/{patient_id}", "display": patient_name}

        # 2. Chief Complaint Observation
        complaint = patient.get("chief_complaint") or patient.get("demographics", {}).get("chief_complaint")
        complaint_text = complaint.get("title") if isinstance(complaint, dict) else complaint
        if complaint_text and str(complaint_text).strip():
            bundle["entry"].append({
                "fullUrl": f"urn:uuid:obs-complaint-{patient_id}",
                "resource": {
                    "resourceType": "Observation",
                    "id": f"obs-complaint-{patient_id}",
                    "status": "final",
                    "category": [
                        {
                            "coding": [
                                {
                                    "system": "http://terminology.hl7.org/CodeSystem/observation-category",
                                    "code": "exam",
                                    "display": "Exam"
                                }
                            ]
                        }
                    ],
                    "code": {"text": "Chief Complaint"},
                    "subject": subject_ref,
                    "valueString": str(complaint_text).strip()
                }
            })

        # 3. Triage Vitals Observation
        vitals_summary = patient.get("triage", {}).get("vitals_summary")
        if vitals_summary and str(vitals_summary).strip():
            bundle["entry"].append({
                "fullUrl": f"urn:uuid:obs-vitals-{patient_id}",
                "resource": {
                    "resourceType": "Observation",
                    "id": f"obs-vitals-{patient_id}",
                    "status": "final",
                    "category": [
                        {
                            "coding": [
                                {
                                    "system": "http://terminology.hl7.org/CodeSystem/observation-category",
                                    "code": "vital-signs",
                                    "display": "Vital Signs"
                                }
                            ]
                        }
                    ],
                    "code": {"text": "Triage Vitals Summary"},
                    "subject": subject_ref,
                    "valueString": str(vitals_summary).strip()
                }
            })

        # 4. Lab Findings Observations
        labs = list(patient.get("labs") or patient.get("structured_history", {}).get("labs") or [])
        # Include lab findings from confirmed documents if not already present
        existing_lab_keys = {
            (l.get("name") or l.get("parameter") or "").strip().lower()
            for l in labs if isinstance(l, dict)
        }
        for doc in (patient.get("documents") or []):
            if isinstance(doc, dict) and (doc.get("confirmed") or doc.get("processing_status") == "confirmed"):
                for lab_item in doc.get("lab_findings", []):
                    if isinstance(lab_item, dict):
                        param = (lab_item.get("parameter") or lab_item.get("name") or "").strip()
                        if param and param.lower() not in existing_lab_keys:
                            item_copy = dict(lab_item)
                            if "source" not in item_copy:
                                item_copy["source"] = "ocr"
                            labs.append(item_copy)
                            existing_lab_keys.add(param.lower())

        for idx, lab in enumerate(labs):
            if not isinstance(lab, dict):
                continue
            lab_name = lab.get("name") or lab.get("parameter") or f"Lab Item {idx+1}"
            lab_val = lab.get("value")
            if lab_val is None:
                continue

            obs_lab: Dict[str, Any] = {
                "resourceType": "Observation",
                "id": f"obs-lab-{patient_id}-{idx+1}",
                "status": "final",
                "category": [
                    {
                        "coding": [
                            {
                                "system": "http://terminology.hl7.org/CodeSystem/observation-category",
                                "code": "laboratory",
                                "display": "Laboratory"
                            }
                        ]
                    }
                ],
                "code": {"text": lab_name},
                "subject": subject_ref,
                "valueString": f"{lab_val} {lab.get('unit', '')}".strip()
            }
            if lab.get("reference_range"):
                obs_lab["referenceRange"] = [{"text": str(lab["reference_range"])}]
            if lab.get("status"):
                obs_lab["interpretation"] = [{"text": str(lab["status"])}]
            if lab.get("source"):
                obs_lab["meta"] = {"tag": [{"code": str(lab["source"])}]}

            bundle["entry"].append({
                "fullUrl": f"urn:uuid:obs-lab-{patient_id}-{idx+1}",
                "resource": obs_lab
            })

        # 5. Medications (MedicationStatement)
        meds = list(patient.get("medications") or patient.get("structured_history", {}).get("current_medications") or [])
        # Include medications from confirmed documents if not already present
        existing_med_keys = {
            (m.get("name") or "").strip().lower()
            for m in meds if isinstance(m, dict)
        }
        for doc in (patient.get("documents") or []):
            if isinstance(doc, dict) and (doc.get("confirmed") or doc.get("processing_status") == "confirmed"):
                for med_item in doc.get("medications", []):
                    if isinstance(med_item, dict):
                        m_name = (med_item.get("name") or "").strip()
                        if m_name and m_name.lower() not in existing_med_keys:
                            item_copy = dict(med_item)
                            if "source" not in item_copy:
                                item_copy["source"] = "document-extracted"
                            meds.append(item_copy)
                            existing_med_keys.add(m_name.lower())

        for idx, med in enumerate(meds):
            if not isinstance(med, dict):
                continue
            med_name = med.get("name")
            if not med_name:
                continue

            dosage_text = f"{med.get('dose', '')} {med.get('frequency', '')}".strip()
            med_stmt: Dict[str, Any] = {
                "resourceType": "MedicationStatement",
                "id": f"med-{patient_id}-{idx+1}",
                "status": "active",
                "medicationCodeableConcept": {"text": str(med_name).strip()},
                "subject": subject_ref
            }
            if dosage_text:
                med_stmt["dosage"] = [{"text": dosage_text}]
            if med.get("source"):
                med_stmt["meta"] = {"tag": [{"code": str(med["source"])}]}

            bundle["entry"].append({
                "fullUrl": f"urn:uuid:med-{patient_id}-{idx+1}",
                "resource": med_stmt
            })

        # 6. AYUSH Observations (if patient reported)
        ayush = patient.get("ayush")
        if isinstance(ayush, dict):
            for param in ["nadi", "mutra", "mala", "jihwa"]:
                item = ayush.get(param)
                if isinstance(item, dict):
                    val = item.get("value")
                    src = item.get("source", "patient-reported")
                else:
                    val = item
                    src = "patient-reported"

                if val and str(val).strip() and str(val).strip() != "Not provided":
                    bundle["entry"].append({
                        "fullUrl": f"urn:uuid:obs-ayush-{param}-{patient_id}",
                        "resource": {
                            "resourceType": "Observation",
                            "id": f"obs-ayush-{param}-{patient_id}",
                            "status": "final",
                            "category": [
                                {
                                    "coding": [
                                        {
                                            "system": "https://ayush.gov.in/fhir",
                                            "code": "ayush-intake",
                                            "display": "AYUSH Clinical Intake"
                                        }
                                    ]
                                }
                            ],
                            "code": {"text": f"AYUSH {param.capitalize()} Observation"},
                            "subject": subject_ref,
                            "valueString": str(val).strip(),
                            "meta": {"tag": [{"code": str(src)}]}
                        }
                    })

        # 7. Red Flag Clinical Safety Alerts (Observation)
        red_flags = patient.get("red_flags") or []
        for idx, rf in enumerate(red_flags):
            if not isinstance(rf, dict):
                continue
            rf_title = rf.get("title") or rf.get("message") or "Clinical Safety Alert"
            rf_status = rf.get("status", "ACTIVE")
            bundle["entry"].append({
                "fullUrl": f"urn:uuid:obs-redflag-{patient_id}-{idx+1}",
                "resource": {
                    "resourceType": "Observation",
                    "id": f"obs-redflag-{patient_id}-{idx+1}",
                    "status": "final",
                    "category": [
                        {
                            "coding": [
                                {
                                    "system": "http://terminology.hl7.org/CodeSystem/observation-category",
                                    "code": "survey",
                                    "display": "Clinical Safety Alert"
                                }
                            ]
                        }
                    ],
                    "code": {"text": rf_title},
                    "subject": subject_ref,
                    "valueString": f"Lifecycle Status: {rf_status}; Trigger: {rf.get('rule_trigger', 'Deterministic Clinical Screen')}",
                    "note": [{"text": rf.get("physician_action")}] if rf.get("physician_action") else []
                }
            })

        # 8. Document References
        docs = patient.get("documents") or []
        for idx, doc in enumerate(docs):
            if not isinstance(doc, dict):
                continue
            doc_id = doc.get("document_id") or f"{patient_id}-doc-{idx+1}"
            doc_title = doc.get("title") or doc.get("file_name") or "Medical Record"
            content_type = "application/pdf" if str(doc.get("file_type")).lower() == "pdf" else "image/jpeg"

            bundle["entry"].append({
                "fullUrl": f"urn:uuid:doc-{doc_id}",
                "resource": {
                    "resourceType": "DocumentReference",
                    "id": f"doc-{doc_id}",
                    "status": "current",
                    "type": {"text": str(doc.get("document_type") or "clinical-note")},
                    "subject": subject_ref,
                    "date": doc.get("date_detected") or doc.get("upload_timestamp") or now_iso,
                    "content": [
                        {
                            "attachment": {
                                "title": doc_title,
                                "contentType": content_type
                            }
                        }
                    ]
                }
            })

        # 9. Consent
        consent = patient.get("consent")
        if isinstance(consent, dict) and consent.get("given"):
            bundle["entry"].append({
                "fullUrl": f"urn:uuid:consent-{patient_id}",
                "resource": {
                    "resourceType": "Consent",
                    "id": f"consent-{patient_id}",
                    "status": "active",
                    "scope": {
                        "coding": [
                            {
                                "system": "http://terminology.hl7.org/CodeSystem/consentscope",
                                "code": "patient-privacy",
                                "display": "Privacy Consent"
                            }
                        ]
                    },
                    "dateTime": consent.get("timestamp") or now_iso,
                    "patient": subject_ref
                }
            })

        return bundle

    @classmethod
    def simulate_mock_abha_push(cls, patient: Dict[str, Any]) -> Dict[str, Any]:
        """
        Simulates a successful ABDM / ABHA FHIR gateway push locally.
        Guarantees:
        - Zero external HTTP calls or real credential transmission.
        - Returns a mock transaction/reference ID and pushed_at timestamp.
        - Generates the complete FHIR Bundle for verification and inspection.
        """
        patient_id = patient.get("id") or "UNKNOWN"
        bundle = cls.patient_to_fhir_bundle(patient)
        mock_tx_id = f"TXN-ABHA-MOCK-{patient_id}-{uuid.uuid4().hex[:8].upper()}"
        now_iso = datetime.now().isoformat()

        return {
            "success": True,
            "patient_id": patient_id,
            "mock_transaction_id": mock_tx_id,
            "pushed_at": now_iso,
            "resource_type": "Bundle",
            "bundle_id": bundle["id"],
            "fhir_bundle": bundle,
            "message": (
                "Mock ABHA push successful. FHIR Bundle generated and simulated successfully "
                "(Prototype/Simulation only — no external ABDM service contacted)."
            )
        }


fhir_service = FhirService()
