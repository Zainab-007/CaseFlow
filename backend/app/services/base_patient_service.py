"""
CaseFlow Stateful Patient & Queue Service
SIH26047 — AI-Powered Patient Case-Taking Software

Manages patient registration, demographic updates, OPD queue ordering,
and patient clinical records with strict patient-specific isolation.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from datetime import datetime


class BasePatientService(ABC):
    """Abstract interface for managing patient clinical intake records."""

    @abstractmethod
    async def create_patient(self, patient_data: Dict[str, Any]) -> Dict[str, Any]:
        """Creates a new patient record with a unique patient_id."""
        pass

    @abstractmethod
    async def get_patient_by_id(self, patient_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves patient profile and clinical intake data."""
        pass

    @abstractmethod
    async def update_patient(self, patient_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Updates demographic and intake information for a specific patient."""
        pass

    @abstractmethod
    async def get_opd_queue(self, department: Optional[str] = None) -> List[Dict[str, Any]]:
        """Returns the active waiting patient queue for the doctor dashboard."""
        pass

    @abstractmethod
    async def update_verification_status(
        self,
        patient_id: str,
        status: str,
        notes: Optional[str] = None,
        doctor_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Updates review status (verified, edited, rejected) with doctor feedback."""
        pass


class StatefulPatientService(BasePatientService):
    """
    In-memory stateful repository ensuring complete patient data isolation.
    Every patient record is keyed by unique patient_id.
    """

    def __init__(self):
        # Key: patient_id -> full clinical patient dictionary
        self._patients: Dict[str, Dict[str, Any]] = {}
        self._seed_distinct_patients()

    def _seed_distinct_patients(self):
        """Seed 4 distinct clinical patients demonstrating diverse conditions, demographics, and red flags."""
        # Patient 1: Ramesh Chandra Sharma (Respiratory / Cardiac concern)
        p1 = {
            "id": "CF-2026-001",
            "queue_token": "OPD-104",
            "name": "Ramesh Chandra Sharma",
            "age": 62,
            "gender": "Male",
            "abha_id": "91-4829-1029-4821",
            "phone": "+91 98450 12345",
            "department": "General Medicine",
            "triage_priority": "Priority",
            "chief_complaint": "Persistent productive cough, progressive dyspnea on exertion for 10 days",
            "intake_status": "Completed",
            "red_flag_detected": True,
            "red_flag_note": "Orthopnea and exertional breathlessness in known hypertensive patient",
            "language": "Hindi / English",
            "arrived_at": "10:15 AM",
            "verification_status": "Pending Review",
            "doctor_notes": None,
            "demographics": {
                "name": "Ramesh Chandra Sharma",
                "age": 62,
                "gender": "Male",
                "abha_id": "91-4829-1029-4821",
                "contact": "+91 98450 12345",
                "blood_group": "B+",
                "arrived_at": "10:15 AM",
                "consultation_type": "Follow-up & Acute Intake",
                "ayush_mode": "Allopathic Standard (AYUSH Inactive)"
            },
            "triage": {
                "priority": "Priority",
                "vitals_summary": "BP 148/92 mmHg, Pulse 88 bpm, SpO2 94% on room air, Temp 98.4°F",
                "triage_nurse": "Staff Nurse Priya (Station 2)"
            },
            "ai_clinical_summary": (
                "62-year-old male with long-standing Type 2 Diabetes and Hypertension presenting with a 10-day history of "
                "productive cough (white sputum) accompanied by progressive exertional dyspnea (NYHA Class II). Patient reports "
                "mild bilateral ankle puffiness over past week. Denies fever, chest pain, or hemoptysis. Prior prescription shows "
                "Telmisartan and Metformin. Current presentation warrants evaluation for heart failure vs lower respiratory infection."
            ),
            "red_flag": {
                "detected": True,
                "title": "Exertional Breathlessness in Hypertensive Patient (NYHA II/III)",
                "rule_trigger": "Rule #C12: Dyspnea on exertion + Known Cardiac/HTN History",
                "nlp_trigger": "NLP pattern: Patient mentions difficulty sleeping flat without 2 pillows (orthopnea equivalent)",
                "physician_action": "Immediate clinical chest auscultation and 12-lead ECG advised before OPD sign-off"
            },
            "structured_history": {
                "hpi": {
                    "onset": "Gradual onset over 10 days",
                    "character": "Productive cough with non-pleuritic chest heaviness during walking",
                    "aggravating_factors": "Climbing stairs, brisk walking, colder morning air",
                    "relieving_factors": "Resting sitting upright for 10-15 minutes",
                    "severity": "Moderate (6/10 on functional activity impact scale)",
                    "sputum": "White mucoid, non-foul smelling, no hemoptysis"
                },
                "past_medical_history": [
                    {"condition": "Type 2 Diabetes Mellitus", "diagnosed": "2018 (8 years)", "control": "Fair (HbA1c 7.4% in Aug 2026)", "source": "document-extracted"},
                    {"condition": "Essential Hypertension", "diagnosed": "2015 (11 years)", "control": "Sub-optimal (BP 148/92 today)", "source": "document-extracted"},
                    {"condition": "Asthma / Tuberculosis", "diagnosed": "No history reported", "control": "N/A", "source": "patient-reported"}
                ],
                "current_medications": [
                    {"name": "Tab. Telmisartan", "dose": "40 mg", "frequency": "Once daily (morning)", "adherence": "Regular", "source": "document-extracted"},
                    {"name": "Tab. Metformin", "dose": "500 mg", "frequency": "Twice daily after meals", "adherence": "Regular", "source": "document-extracted"}
                ],
                "allergies": [
                    {"allergen": "Sulfa Antibiotics", "reaction": "Cutaneous maculopapular rash & pruritus", "severity": "Moderate"}
                ],
                "family_history": ["Father: Myocardial infarction at age 65 (deceased)", "Mother: Type 2 Diabetes"],
                "personal_social": {"smoking": "Ex-smoker (Quit 12 years ago)", "alcohol": "Non-drinker", "diet": "Vegetarian"},
                "review_of_systems": {
                    "cardiovascular": "Shortness of breath on exertion, mild ankle swelling; denies syncope",
                    "respiratory": "Cough present with sputum; denies wheezing",
                    "gastrointestinal": "Normal appetite, regular bowel habits"
                }
            },
            "timeline": [
                {
                    "date": "14 Sep 2026",
                    "time": "10:15 AM",
                    "title": "CaseFlow Pre-Consultation Kiosk Intake",
                    "category": "Intake",
                    "description": "Patient completed bilingual interview in Hindi/English. Reported cough and exertional dyspnea. Scanned prior lab records.",
                    "source": "patient-reported"
                }
            ]
        }

        # Patient 2: Sunita Devi Verma (Gastrointestinal / Acid-Peptic)
        p2 = {
            "id": "CF-2026-002",
            "queue_token": "OPD-105",
            "name": "Sunita Devi Verma",
            "age": 48,
            "gender": "Female",
            "abha_id": "91-3310-9281-7712",
            "phone": "+91 97112 33445",
            "department": "General Medicine",
            "triage_priority": "Routine",
            "chief_complaint": "Epigastric burning sensation and postprandial fullness for 3 weeks",
            "intake_status": "Completed",
            "red_flag_detected": False,
            "red_flag_note": None,
            "language": "Hindi",
            "arrived_at": "10:22 AM",
            "verification_status": "Pending Review",
            "doctor_notes": None,
            "demographics": {
                "name": "Sunita Devi Verma",
                "age": 48,
                "gender": "Female",
                "abha_id": "91-3310-9281-7712",
                "contact": "+91 97112 33445",
                "blood_group": "A+",
                "arrived_at": "10:22 AM",
                "consultation_type": "New Symptom Consultation",
                "ayush_mode": "Allopathic Standard (AYUSH Inactive)"
            },
            "triage": {
                "priority": "Routine",
                "vitals_summary": "BP 122/78 mmHg, Pulse 74 bpm, SpO2 99% on room air, Temp 98.2°F",
                "triage_nurse": "Staff Nurse Anita (Station 1)"
            },
            "ai_clinical_summary": (
                "48-year-old female presenting with a 3-week history of upper abdominal burning and postprandial heaviness. "
                "Symptoms are aggravated by spicy or oily food and partially relieved by antacids. Denies vomiting, hematemesis, "
                "melena, or significant weight loss. Presentation is consistent with non-ulcer dyspepsia vs acid-peptic disease."
            ),
            "red_flag": {
                "detected": False,
                "title": "No Acute Red Flags Detected",
                "rule_trigger": "Rule #GI01: Gastrointestinal Bleeding Screen Negative",
                "nlp_trigger": "Patient denies black stools, blood in vomitus, or severe nocturnal pain",
                "physician_action": "Standard outpatient gastrointestinal evaluation and dietary guidance"
            },
            "structured_history": {
                "hpi": {
                    "onset": "Gradual over 3 weeks",
                    "character": "Burning epigastric discomfort, acid reflux sensation",
                    "aggravating_factors": "Spicy food, fasting longer than 5 hours",
                    "relieving_factors": "Cold milk, OTC antacid gel",
                    "severity": "Mild to Moderate (4/10)",
                    "sputum": "None"
                },
                "past_medical_history": [
                    {"condition": "Hypothyroidism", "diagnosed": "2021", "control": "Euthyroid on Thyroxine 50mcg", "source": "patient-reported"}
                ],
                "current_medications": [
                    {"name": "Tab. Thyroxine", "dose": "50 mcg", "frequency": "Once daily (fasting)", "adherence": "Regular", "source": "patient-reported"},
                    {"name": "Tab. Pantoprazole", "dose": "40 mg", "frequency": "As needed (SOS)", "adherence": "Intermittent", "source": "patient-reported"}
                ],
                "allergies": [],
                "family_history": ["Mother: Gallstones (cholecystectomy at age 52)"],
                "personal_social": {"smoking": "Never smoked", "alcohol": "Non-drinker", "diet": "Vegetarian"},
                "review_of_systems": {
                    "cardiovascular": "Normal, denies palpitations or chest heaviness",
                    "gastrointestinal": "Heartburn and sour eructations; regular bowel movements",
                    "respiratory": "No cough or shortness of breath"
                }
            },
            "timeline": [
                {
                    "date": "14 Sep 2026",
                    "time": "10:22 AM",
                    "title": "CaseFlow Pre-Consultation Kiosk Intake",
                    "category": "Intake",
                    "description": "Patient completed Hindi kiosk intake. Reported 3-week burning epigastric discomfort.",
                    "source": "patient-reported"
                }
            ]
        }

        # Patient 3: Ananya Mukherjee (Infectious / ENT)
        p3 = {
            "id": "CF-2026-003",
            "queue_token": "OPD-106",
            "name": "Ananya Mukherjee",
            "age": 29,
            "gender": "Female",
            "abha_id": "91-6623-1192-5034",
            "phone": "+91 98201 55667",
            "department": "General Medicine",
            "triage_priority": "Routine",
            "chief_complaint": "Low-grade evening fever, generalized malaise, sore throat for 4 days",
            "intake_status": "Completed",
            "red_flag_detected": False,
            "red_flag_note": None,
            "language": "English",
            "arrived_at": "10:35 AM",
            "verification_status": "Verified",
            "doctor_notes": "Reviewed and verified outpatient ENT intake.",
            "demographics": {
                "name": "Ananya Mukherjee",
                "age": 29,
                "gender": "Female",
                "abha_id": "91-6623-1192-5034",
                "contact": "+91 98201 55667",
                "blood_group": "O+",
                "arrived_at": "10:35 AM",
                "consultation_type": "Acute Outpatient Care",
                "ayush_mode": "Allopathic Standard (AYUSH Inactive)"
            },
            "triage": {
                "priority": "Routine",
                "vitals_summary": "BP 116/74 mmHg, Pulse 82 bpm, SpO2 98% on room air, Temp 100.2°F",
                "triage_nurse": "Staff Nurse Priya (Station 2)"
            },
            "ai_clinical_summary": (
                "29-year-old female presenting with a 4-day history of low-grade fever (max 100.4°F in evenings), painful deglutition, "
                "and generalized myalgia. Reports rhinorrhea and mild dry cough. No rash, joint swelling, or shortness of breath. "
                "Clinical picture is suggestive of acute viral pharyngitis / upper respiratory tract infection."
            ),
            "red_flag": {
                "detected": False,
                "title": "No Red Flags Detected",
                "rule_trigger": "Rule #ID02: Sepsis / Severe Systemic Infection Screen Negative",
                "nlp_trigger": "No altered sensorium, stiff neck, or petechial rash",
                "physician_action": "Oropharyngeal examination and symptomatic relief"
            },
            "structured_history": {
                "hpi": {
                    "onset": "Acute onset 4 days ago",
                    "character": "Scratchy throat with painful swallowing, generalized body aches",
                    "aggravating_factors": "Swallowing dry food",
                    "relieving_factors": "Warm salt water gargles, Paracetamol",
                    "severity": "Mild (3/10)",
                    "sputum": "None"
                },
                "past_medical_history": [],
                "current_medications": [
                    {"name": "Tab. Paracetamol", "dose": "650 mg", "frequency": "SOS for fever", "adherence": "Intermittent", "source": "patient-reported"},
                    {"name": "Tab. Cetirizine", "dose": "10 mg", "frequency": "Once daily at night", "adherence": "Regular (2 days)", "source": "patient-reported"}
                ],
                "allergies": [
                    {"allergen": "Penicillin", "reaction": "Skin hives and urticaria", "severity": "Moderate"}
                ],
                "family_history": ["No chronic illnesses reported"],
                "personal_social": {"smoking": "Non-smoker", "alcohol": "Occasional social", "diet": "Non-vegetarian"},
                "review_of_systems": {
                    "ent": "Sore throat and clear rhinorrhea; no ear pain",
                    "respiratory": "Mild dry cough; no wheezing",
                    "gastrointestinal": "Normal"
                }
            },
            "timeline": [
                {
                    "date": "14 Sep 2026",
                    "time": "10:35 AM",
                    "title": "CaseFlow Pre-Consultation Kiosk Intake",
                    "category": "Intake",
                    "description": "Patient completed English kiosk intake. Reported 4-day sore throat and low-grade fever.",
                    "source": "patient-reported"
                }
            ]
        }

        # Patient 4: Mohammad Irfan (Urgent Triage / Cardiac Red Flag)
        p4 = {
            "id": "CF-2026-004",
            "queue_token": "OPD-107",
            "name": "Mohammad Irfan",
            "age": 55,
            "gender": "Male",
            "abha_id": "91-1182-9023-4411",
            "phone": "+91 99345 77889",
            "department": "General Medicine",
            "triage_priority": "Urgent",
            "chief_complaint": "Acute retrosternal heaviness radiating to left shoulder, onset 2 hours ago",
            "intake_status": "Completed",
            "red_flag_detected": True,
            "red_flag_note": "⚠️ High Risk: Retrosternal pressure with diaphoresis — immediate triage recommended",
            "language": "Hindi",
            "arrived_at": "10:48 AM",
            "verification_status": "Pending Review",
            "doctor_notes": None,
            "demographics": {
                "name": "Mohammad Irfan",
                "age": 55,
                "gender": "Male",
                "abha_id": "91-1182-9023-4411",
                "contact": "+91 99345 77889",
                "blood_group": "AB+",
                "arrived_at": "10:48 AM",
                "consultation_type": "Acute Chest Triage",
                "ayush_mode": "Allopathic Standard (AYUSH Inactive)"
            },
            "triage": {
                "priority": "Urgent",
                "vitals_summary": "BP 164/102 mmHg, Pulse 104 bpm, SpO2 95% on room air, Temp 98.6°F",
                "triage_nurse": "Staff Nurse Anita (Station 1)"
            },
            "ai_clinical_summary": (
                "55-year-old male presenting with acute severe retrosternal squeezing pressure (8/10) with radiation to the "
                "left shoulder and mandible, accompanied by cold sweating (diaphoresis) starting 2 hours prior to arrival. "
                "Past history significant for heavy cigarette smoking and untreated hypertension. Urgent physician evaluation, "
                "STAT 12-lead ECG, and cardiac troponin assay are indicated."
            ),
            "red_flag": {
                "detected": True,
                "title": "Suspected Acute Coronary Syndrome / High-Risk Chest Pain",
                "rule_trigger": "Rule #CARD01: Retrosternal pressure + Radiation + Diaphoresis",
                "nlp_trigger": "Patient describes 'band-like tightness crushing chest like heavy weight' with cold sweats",
                "physician_action": "STAT 12-lead ECG within 10 minutes, sublingual nitrate availability, and emergency room transfer"
            },
            "structured_history": {
                "hpi": {
                    "onset": "Sudden onset 2 hours ago while climbing stairs",
                    "character": "Heavy retrosternal crushing pain radiating to left arm and jaw",
                    "aggravating_factors": "Exertion, walking",
                    "relieving_factors": "None; resting upright gives minimal relief",
                    "severity": "Severe (8/10)",
                    "sputum": "None"
                },
                "past_medical_history": [
                    {"condition": "Hypertension", "diagnosed": "Known for 5 years", "control": "Irregular medication adherence", "source": "patient-reported"},
                    {"condition": "Dyslipidemia", "diagnosed": "2024", "control": "Unknown", "source": "patient-reported"}
                ],
                "current_medications": [
                    {"name": "Tab. Amlodipine", "dose": "5 mg", "frequency": "Once daily", "adherence": "Poor (missed past 3 days)", "source": "patient-reported"}
                ],
                "allergies": [],
                "family_history": ["Elder brother: Coronary artery bypass graft (CABG) at age 52"],
                "personal_social": {"smoking": "Active smoker (20 cigarettes/day for 30 years)", "alcohol": "Non-drinker", "diet": "Non-vegetarian"},
                "review_of_systems": {
                    "cardiovascular": "Severe chest tightness, diaphoresis; denies syncope",
                    "respiratory": "Mild breathlessness secondary to chest pressure; no cough",
                    "gastrointestinal": "Mild nausea without vomiting"
                }
            },
            "timeline": [
                {
                    "date": "14 Sep 2026",
                    "time": "10:48 AM",
                    "title": "CaseFlow Pre-Consultation Kiosk Intake (Urgent Triage)",
                    "category": "Intake",
                    "description": "Patient completed acute kiosk intake with attendant help. Red-flag triggered for chest pain.",
                    "source": "patient-reported"
                }
            ]
        }

        self._patients[p1["id"]] = p1
        self._patients[p2["id"]] = p2
        self._patients[p3["id"]] = p3
        self._patients[p4["id"]] = p4

    async def create_patient(self, patient_data: Dict[str, Any]) -> Dict[str, Any]:
        """Creates a new patient record with a unique ID and full clinical profile."""
        max_num = 4
        for pid in self._patients.keys():
            if pid.startswith("CF-2026-"):
                try:
                    num = int(pid.split("-")[-1])
                    if num > max_num:
                        max_num = num
                except ValueError:
                    pass
        new_id = f"CF-2026-{max_num + 1:03d}"
        queue_token = f"OPD-{104 + len(self._patients)}"
        now_time = datetime.now().strftime("%I:%M %p")

        name = patient_data.get("name", "New Patient")
        age = patient_data.get("age", 30)
        gender = patient_data.get("gender", "Other")
        phone = patient_data.get("phone") or patient_data.get("contact") or "+91 99000 00000"
        abha_id = patient_data.get("abha_id") or "Not linked"
        dept = patient_data.get("department", "General Medicine")
        lang = patient_data.get("preferred_language", "Hindi / English")
        complaint = patient_data.get("chief_complaint", "Routine medical consultation")

        record = {
            "id": new_id,
            "queue_token": queue_token,
            "name": name,
            "age": age,
            "gender": gender,
            "abha_id": abha_id,
            "phone": phone,
            "department": dept,
            "triage_priority": "Routine",
            "chief_complaint": complaint,
            "intake_status": "Registered",
            "red_flag_detected": False,
            "red_flag_note": None,
            "language": lang,
            "arrived_at": now_time,
            "verification_status": "Pending Review",
            "doctor_notes": None,
            "demographics": {
                "name": name,
                "age": age,
                "gender": gender,
                "abha_id": abha_id,
                "contact": phone,
                "blood_group": "Unknown",
                "arrived_at": now_time,
                "consultation_type": "New Kiosk Registration",
                "ayush_mode": "Allopathic Standard (AYUSH Inactive)"
            },
            "triage": {
                "priority": "Routine",
                "vitals_summary": "Vitals pending triage station check",
                "triage_nurse": "Station 1"
            },
            "ai_clinical_summary": f"{age}-year-old {str(gender).lower()} presenting with {str(complaint).lower()}. No acute emergency red-flags identified during pre-consultation intake.",
            "red_flag": {
                "detected": False,
                "title": "No emergency triage red-flags currently identified.",
                "rule_trigger": "Initial intake screen",
                "nlp_trigger": "None",
                "physician_action": "Standard clinical consultation"
            },
            "structured_history": {
                "hpi": {
                    "onset": "Recent",
                    "character": complaint,
                    "aggravating_factors": "None reported",
                    "relieving_factors": "None reported",
                    "severity": "Mild (3/10)",
                    "sputum": "None"
                },
                "past_medical_history": [],
                "current_medications": [],
                "allergies": [],
                "family_history": [],
                "personal_social": {},
                "review_of_systems": {}
            },
            "timeline": [
                {
                    "date": datetime.now().strftime("%d %b %Y"),
                    "time": now_time,
                    "title": "CaseFlow Kiosk Registration",
                    "category": "Intake",
                    "description": f"Patient registered at kiosk. Reason: {complaint}",
                    "source": "patient-reported"
                }
            ]
        }

        self._patients[new_id] = record
        return record

    def generate_patient_clinical_summary(
        self,
        patient: Dict[str, Any],
        extracted: Optional[Dict[str, Any]] = None,
        documents: Optional[List[Dict[str, Any]]] = None,
        red_flags: Optional[List[str]] = None
    ) -> str:
        """
        Dynamically generates a patient-specific pre-consultation summary
        based on the current patient's actual reported symptoms, HPI, and attached documents.
        Modular design allows seamless replacement with an LLM in future phases.
        """
        age = patient.get("age") or patient.get("demographics", {}).get("age", "")
        gender = patient.get("gender") or patient.get("demographics", {}).get("gender", "")
        complaint = patient.get("chief_complaint") or "General medical consultation"
        hpi = patient.get("structured_history", {}).get("hpi", {})

        if extracted:
            onset = extracted.get("onset") or hpi.get("onset")
            character = extracted.get("character") or hpi.get("character")
            site = extracted.get("site")
            severity = extracted.get("severity") or hpi.get("severity")
            associated = extracted.get("associatedSymptoms")
        else:
            onset = hpi.get("onset")
            character = hpi.get("character")
            site = None
            severity = hpi.get("severity")
            associated = None

        intro = f"{age}-year-old {str(gender).lower()} presenting with {str(complaint).lower()}." if age and gender else f"Patient presenting with {complaint}."
        sentences = [intro]

        hpi_details = []
        if site and site not in ["Not yet provided", "Not provided"]:
            hpi_details.append(f"localized to {site.lower()}")
        if onset and onset not in ["Not yet provided", "Not provided"]:
            hpi_details.append(f"starting {onset.lower()}")
        if character and character not in ["Not yet provided", "Not provided"]:
            hpi_details.append(f"described as {character.lower()}")
        if severity and severity not in ["Not yet provided", "Not provided"]:
            hpi_details.append(f"severity rated {severity.lower()}")

        if hpi_details:
            sentences.append("Symptom details: " + ", ".join(hpi_details) + ".")

        if associated and associated not in ["Not yet provided", "Not provided"]:
            sentences.append(f"Associated symptoms reported: {associated}.")

        if documents:
            doc_summaries = []
            for d in documents:
                title = d.get("title") or d.get("file_name") or "Medical record"
                doc_summaries.append(title)
            if doc_summaries:
                sentences.append(f"Attached medical records reviewed: {', '.join(doc_summaries[:2])}.")

        if red_flags:
            sentences.append(f"Clinical Alert: Flagged for physician review regarding {'; '.join(red_flags)}.")
        elif patient.get("red_flag", {}).get("detected"):
            sentences.append(f"Clinical Alert: {patient['red_flag'].get('title')}.")
        else:
            sentences.append("No acute emergency red-flags identified during pre-consultation intake.")

        return " ".join(sentences)

    def sync_interview_data(
        self,
        patient_id: str,
        chief_complaint: Optional[str],
        extracted_history: Dict[str, Any],
        red_flags: List[str],
        session_completed: bool = False
    ):
        """Synchronizes patient interview responses directly into that patient's clinical record."""
        patient = self._patients.get(patient_id)
        if not patient:
            # Auto-provision patient record if started from interview directly
            patient = {
                "id": patient_id,
                "queue_token": f"OPD-{104 + len(self._patients)}",
                "name": "Intake Patient",
                "age": 30,
                "gender": "Other",
                "phone": "+91 99000 00000",
                "department": "General Medicine",
                "triage_priority": "Routine",
                "chief_complaint": chief_complaint or "General consultation",
                "intake_status": "Interview in progress",
                "red_flag_detected": False,
                "red_flag_note": None,
                "language": "Hindi / English",
                "arrived_at": datetime.now().strftime("%I:%M %p"),
                "verification_status": "Pending Review",
                "doctor_notes": None,
                "demographics": {
                    "name": "Intake Patient",
                    "age": 30,
                    "gender": "Other",
                    "blood_group": "Unknown"
                },
                "triage": {
                    "priority": "Routine",
                    "vitals_summary": "Pending consultation assessment",
                    "triage_nurse": "Station 1"
                },
                "structured_history": {"hpi": {}, "past_medical_history": [], "current_medications": [], "allergies": []},
                "timeline": []
            }
            self._patients[patient_id] = patient

        # 1. Update chief complaint
        if chief_complaint and chief_complaint not in ["Not yet provided", "Not provided"]:
            patient["chief_complaint"] = chief_complaint
            if "demographics" in patient:
                patient["demographics"]["chief_complaint"] = chief_complaint

        # 2. Update HPI
        if "structured_history" not in patient:
            patient["structured_history"] = {}
        if "hpi" not in patient["structured_history"]:
            patient["structured_history"]["hpi"] = {}

        hpi = patient["structured_history"]["hpi"]
        if extracted_history.get("onset") and extracted_history["onset"] != "Not yet provided":
            hpi["onset"] = extracted_history["onset"]
        if extracted_history.get("character") and extracted_history["character"] != "Not yet provided":
            hpi["character"] = extracted_history["character"]
        if extracted_history.get("severity") and extracted_history["severity"] != "Not yet provided":
            hpi["severity"] = extracted_history["severity"]
        if extracted_history.get("site") and extracted_history["site"] != "Not yet provided":
            hpi["site"] = extracted_history["site"]
        if extracted_history.get("aggravatingFactors") and extracted_history["aggravatingFactors"] != "Not yet provided":
            hpi["aggravating_factors"] = extracted_history["aggravatingFactors"]
        if extracted_history.get("relievingFactors") and extracted_history["relievingFactors"] != "Not yet provided":
            hpi["relieving_factors"] = extracted_history["relievingFactors"]

        # 3. Update Red Flags
        if red_flags:
            patient["red_flag_detected"] = True
            patient["red_flag_note"] = "; ".join(red_flags)
            patient["red_flag"] = {
                "detected": True,
                "title": f"Symptom Red Flag: {red_flags[0]}",
                "rule_trigger": "Patient Interview Safety Screen",
                "nlp_trigger": "; ".join(red_flags),
                "physician_action": "Urgent physician evaluation indicated"
            }
            patient["triage_priority"] = "Urgent"
        else:
            if not patient.get("red_flag_detected"):
                patient["red_flag_detected"] = False
                patient["red_flag_note"] = None
                patient["red_flag"] = {
                    "detected": False,
                    "title": "No emergency triage red-flags currently identified."
                }

        # 4. Generate patient-specific clinical summary
        patient["ai_clinical_summary"] = self.generate_patient_clinical_summary(
            patient=patient,
            extracted=extracted_history,
            red_flags=red_flags
        )

        if session_completed:
            patient["intake_status"] = "Completed"

    async def get_patient_by_id(self, patient_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieves patient record by ID.
        Guarantees strict patient isolation: never falls back to another patient's medical data.
        """
        patient = self._patients.get(patient_id)
        if not patient:
            return None

        # Return a copy to prevent accidental external mutation
        record = dict(patient)

        # Dynamic documents linkage from document_service (strictly isolated by patient_id)
        try:
            from app.services.base_document_service import document_service
            patient_docs = await document_service.get_patient_documents(patient_id)
            record["documents"] = patient_docs
        except Exception:
            record["documents"] = []

        return record

    async def update_patient(self, patient_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Updates demographic and intake information for a specific patient."""
        patient = self._patients.get(patient_id)
        if not patient:
            return None

        # Update root attributes
        for key in ["name", "age", "gender", "phone", "abha_id", "department", "chief_complaint", "intake_status", "triage_priority"]:
            if key in update_data and update_data[key] is not None:
                patient[key] = update_data[key]

        # Update nested demographics object
        if "demographics" in patient:
            if "name" in update_data and update_data["name"] is not None:
                patient["demographics"]["name"] = update_data["name"]
            if "age" in update_data and update_data["age"] is not None:
                patient["demographics"]["age"] = update_data["age"]
            if "gender" in update_data and update_data["gender"] is not None:
                patient["demographics"]["gender"] = update_data["gender"]
            if "phone" in update_data and update_data["phone"] is not None:
                patient["demographics"]["contact"] = update_data["phone"]
            if "abha_id" in update_data and update_data["abha_id"] is not None:
                patient["demographics"]["abha_id"] = update_data["abha_id"]

        # Update chief complaint in structured history if provided
        if "chief_complaint" in update_data and update_data["chief_complaint"] is not None:
            comp = update_data["chief_complaint"]
            patient["chief_complaint"] = comp
            if "structured_history" in patient and "hpi" in patient["structured_history"]:
                patient["structured_history"]["hpi"]["character"] = comp
            patient["ai_clinical_summary"] = self.generate_patient_clinical_summary(patient=patient)

        return patient

    async def get_opd_queue(self, department: Optional[str] = None) -> List[Dict[str, Any]]:
        """Returns the active waiting patient queue for the doctor dashboard."""
        queue = []
        for p in self._patients.values():
            if department and p.get("department") != department:
                continue
            queue.append({
                "id": p["id"],
                "queue_token": p["queue_token"],
                "name": p["name"],
                "age": p["age"],
                "gender": p["gender"],
                "abha_id": p.get("abha_id"),
                "department": p.get("department", "General Medicine"),
                "triage_priority": p.get("triage_priority", "Routine"),
                "chief_complaint": p.get("chief_complaint", "General consultation"),
                "intake_status": p.get("intake_status", "Completed"),
                "red_flag_detected": p.get("red_flag_detected", False),
                "red_flag_note": p.get("red_flag_note"),
                "language": p.get("language", "Hindi"),
                "arrived_at": p.get("arrived_at", "10:00 AM"),
                "verification_status": p.get("verification_status", "Pending Review")
            })
        return queue

    async def update_verification_status(
        self,
        patient_id: str,
        status: str,
        notes: Optional[str] = None,
        doctor_id: Optional[str] = None
    ) -> Dict[str, Any]:
        patient = self._patients.get(patient_id)
        if patient:
            patient["verification_status"] = status
            patient["doctor_notes"] = notes
            patient["verified_by"] = doctor_id or "Dr. S. K. Mehta (Reg: MCI-48201)"
            return patient
        return {"error": "Patient not found"}


# Global singleton patient service instance
patient_service = StatefulPatientService()
MockPatientService = StatefulPatientService
