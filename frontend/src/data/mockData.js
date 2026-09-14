/**
 * Mock Clinical Dataset for CaseFlow Foundation
 * SIH26047 — AI-Powered Patient Case-Taking System
 * Contains realistic OPD patient queues, structured clinical history,
 * red-flag findings, timelines, and document OCR extracts.
 */

export const MOCK_PATIENTS_QUEUE = [
  {
    id: "CF-2026-001",
    queue_token: "OPD-104",
    name: "Ramesh Chandra Sharma",
    age: 62,
    gender: "Male",
    abha_id: "91-4829-1029-4821",
    department: "General Medicine",
    triage_priority: "Priority", // Urgent | Priority | Routine
    chief_complaint: "Persistent productive cough, progressive dyspnea on exertion for 10 days",
    intake_status: "Completed",
    red_flag_detected: true,
    red_flag_note: "Orthopnea & exertional dyspnea in known hypertensive patient",
    language: "Hindi / English",
    arrived_at: "10:15 AM",
    verification_status: "Pending Review", // Pending Review | Verified | Edited | Rejected
  },
  {
    id: "CF-2026-002",
    queue_token: "OPD-105",
    name: "Sunita Devi Verma",
    age: 48,
    gender: "Female",
    abha_id: "91-3310-9281-7712",
    department: "General Medicine",
    triage_priority: "Routine",
    chief_complaint: "Epigastric burning sensation and postprandial fullness for 3 weeks",
    intake_status: "Completed",
    red_flag_detected: false,
    red_flag_note: null,
    language: "Hindi",
    arrived_at: "10:22 AM",
    verification_status: "Pending Review",
  },
  {
    id: "CF-2026-003",
    queue_token: "OPD-106",
    name: "Mohammad Irfan",
    age: 55,
    gender: "Male",
    abha_id: "91-1182-9023-4411",
    department: "General Medicine",
    triage_priority: "Urgent",
    chief_complaint: "Acute retrosternal heaviness radiating to left shoulder, onset 2 hours ago",
    intake_status: "Completed",
    red_flag_detected: true,
    red_flag_note: "⚠️ High Risk: Retrosternal pressure with diaphoresis — immediate triage recommended",
    language: "Hindi",
    arrived_at: "10:48 AM",
    verification_status: "Pending Review",
  },
  {
    id: "CF-2026-004",
    queue_token: "OPD-107",
    name: "Ananya Mukherjee",
    age: 29,
    gender: "Female",
    abha_id: "91-6623-1192-5034",
    department: "General Medicine",
    triage_priority: "Routine",
    chief_complaint: "Low-grade evening fever, generalized malaise, sore throat for 4 days",
    intake_status: "Completed",
    red_flag_detected: false,
    red_flag_note: null,
    language: "English",
    arrived_at: "10:55 AM",
    verification_status: "Verified",
  }
];

export const MOCK_PATIENT_DETAILS = {
  "CF-2026-001": {
    id: "CF-2026-001",
    queue_token: "OPD-104",
    demographics: {
      name: "Ramesh Chandra Sharma",
      age: 62,
      gender: "Male",
      abha_id: "91-4829-1029-4821",
      contact: "+91 98450 12345",
      blood_group: "B+",
      arrived_at: "10:15 AM",
      consultation_type: "Follow-up & Acute Intake",
      ayush_mode: "Allopathic Standard (AYUSH Inactive)"
    },
    triage: {
      priority: "Priority",
      vitals_summary: "BP 148/92 mmHg, Pulse 88 bpm, SpO2 94% on room air, Temp 98.4°F",
      triage_nurse: "Staff Nurse Priya (Station 2)"
    },
    chief_complaint: {
      title: "Persistent productive cough and shortness of breath on exertion for 10 days",
      duration: "10 days",
      source: "patient-reported"
    },
    ai_clinical_summary: (
      "62-year-old male with long-standing Type 2 Diabetes and Hypertension presenting with a 10-day history of " +
      "productive cough (white mucoid sputum) accompanied by progressive exertional dyspnea (NYHA Class II). Patient reports " +
      "mild bilateral ankle puffiness over past week. Denies fever, chest pain, or hemoptysis. Prior prescription shows " +
      "Telmisartan and Metformin. Current presentation warrants evaluation for heart failure vs lower respiratory infection."
    ),
    red_flag: {
      detected: true,
      title: "Exertional Breathlessness in Hypertensive Patient (NYHA II/III)",
      rule_trigger: "Rule #C12: Dyspnea on exertion + Known Cardiac/HTN History",
      nlp_trigger: "NLP pattern: Patient mentions difficulty sleeping flat without 2 pillows (orthopnea equivalent)",
      physician_action: "Immediate clinical chest auscultation and 12-lead ECG advised before OPD sign-off"
    },
    structured_history: {
      hpi: {
        onset: "Gradual onset over 10 days",
        character: "Productive cough with non-pleuritic chest heaviness during walking",
        aggravating_factors: "Climbing stairs, brisk walking, colder morning air",
        relieving_factors: "Resting sitting upright for 10-15 minutes",
        severity: "Moderate (6/10 on functional activity impact scale)",
        sputum: "White mucoid, non-foul smelling, no hemoptysis"
      },
      past_medical_history: [
        { condition: "Type 2 Diabetes Mellitus", diagnosed: "2018 (8 years)", control: "Fair (HbA1c 7.4% in Aug 2026)", source: "document-extracted" },
        { condition: "Essential Hypertension", diagnosed: "2015 (11 years)", control: "Sub-optimal (BP 148/92 today)", source: "document-extracted" },
        { condition: "Asthma / Tuberculosis", diagnosed: "No history reported", control: "N/A", source: "patient-reported" }
      ],
      current_medications: [
        { name: "Tab. Telmisartan", dose: "40 mg", frequency: "Once daily (morning)", adherence: "Regular", source: "document-extracted" },
        { name: "Tab. Metformin", dose: "500 mg", frequency: "Twice daily after meals", adherence: "Regular", source: "document-extracted" },
        { name: "OTC Cough Syrup (Dextromethorphan)", dose: "10 ml", frequency: "As needed for 4 days", adherence: "Intermittent", source: "patient-reported" }
      ],
      allergies: [
        { allergen: "Sulfa Antibiotics", reaction: "Cutaneous maculopapular rash & pruritus", severity: "Moderate" }
      ],
      family_history: [
        "Father: Myocardial infarction at age 65 (deceased)",
        "Mother: Type 2 Diabetes, Diabetic Nephropathy"
      ],
      personal_social: {
        smoking: "Ex-smoker (Quit 12 years ago; 15 pack-years)",
        alcohol: "Non-drinker",
        diet: "Vegetarian, moderate salt consumption"
      },
      review_of_systems: {
        cardiovascular: "Shortness of breath on exertion, mild dependent bilateral ankle edema; denies palpitations or syncope",
        respiratory: "Productive cough with white sputum; denies wheezing or stridor",
        gastrointestinal: "Normal appetite, regular bowel habits",
        urinary: "Mild nocturia (1-2 times per night), no dysuria",
        neurological: "Normal alertness, no focal deficit or dizziness"
      }
    },
    timeline: [
      {
        date: "14 Sep 2026",
        time: "10:15 AM",
        title: "CaseFlow Pre-Consultation Kiosk Intake",
        category: "Intake",
        description: "Patient completed bilingual interview in Hindi/English. Reported cough and exertional dyspnea. Scanned prior lab records.",
        source: "patient-reported"
      },
      {
        date: "20 Aug 2026",
        time: "11:30 AM",
        title: "Diagnostic Lab: Complete Blood Count & HbA1c",
        category: "Lab Investigation",
        description: "Hb 11.2 g/dL, Platelets 220,000 /uL, HbA1c 7.4%, Serum Creatinine 1.1 mg/dL.",
        source: "document-extracted"
      },
      {
        date: "15 Aug 2026",
        time: "04:00 PM",
        title: "Chest Radiograph (PA View)",
        category: "Radiology",
        description: "Mild bilateral basal peribronchial thickening. Normal cardiothoracic ratio.",
        source: "document-extracted"
      },
      {
        date: "10 Jun 2026",
        time: "10:00 AM",
        title: "Cardio-Diabetic OPD Follow-up",
        category: "Consultation",
        description: "Follow-up consultation. BP recorded 142/88. Telmisartan 40mg continued.",
        source: "hospital-ehr"
      }
    ],
    documents: [
      {
        id: "DOC-001",
        title: "Complete Blood Count & Metabolic Profile",
        date: "20 Aug 2026",
        type: "Lab Report",
        extracted_entities: ["Hb: 11.2 g/dL (Normal)", "HbA1c: 7.4% (Elevated)", "Serum Creatinine: 1.1 mg/dL"],
        ocr_confidence: "98%"
      },
      {
        id: "DOC-002",
        title: "Chest X-Ray Digital Scan",
        date: "15 Aug 2026",
        type: "Radiology",
        extracted_entities: ["Peribronchial thickening", "No consolidation", "CTR within normal limits"],
        ocr_confidence: "95%"
      },
      {
        id: "DOC-003",
        title: "Previous OPD Prescription Slip",
        date: "10 Jun 2026",
        type: "Prescription",
        extracted_entities: ["Tab. Telmisartan 40mg OD", "Tab. Metformin 500mg BD"],
        ocr_confidence: "92%"
      }
    ],
    verification_status: "Pending Review",
    doctor_notes: ""
  }
};

export const MOCK_INTERVIEW_STEPS = [
  {
    step: 1,
    title: "Chief Complaint",
    question: "What brings you to the hospital today?",
    hindi_question: "आज अस्पताल आने का आपका मुख्य कारण या तकलीफ़ क्या है?",
    audio_hint: "Tap on your symptom or press Speak to say it in your own words.",
    options: [
      { label: "Cough & Cold", icon: "Activity", tag: "Respiratory" },
      { label: "Chest Heaviness / Pain", icon: "Heart", tag: "Cardio" },
      { label: "Stomach Ache / Acidity", icon: "Compass", tag: "GI" },
      { label: "Fever & Chills", icon: "Thermometer", tag: "General" },
      { label: "Headache / Dizziness", icon: "AlertCircle", tag: "Neuro" },
      { label: "Body Pain / Joint Pain", icon: "Zap", tag: "Musculoskeletal" }
    ]
  },
  {
    step: 2,
    title: "Duration",
    question: "How long have you been experiencing this problem?",
    hindi_question: "आपको यह परेशानी कितने समय से हो रही है?",
    audio_hint: "Choose the duration that best fits your condition.",
    options: [
      { label: "Started Today (Under 24h)", icon: "Clock", tag: "Acute" },
      { label: "2 to 3 Days", icon: "Clock", tag: "Acute" },
      { label: "1 Week (5-7 Days)", icon: "Calendar", tag: "Subacute" },
      { label: "2 to 4 Weeks", icon: "Calendar", tag: "Subacute" },
      { label: "More than a Month", icon: "Calendar", tag: "Chronic" }
    ]
  },
  {
    step: 3,
    title: "Severity Level",
    question: "How severe is your discomfort right now?",
    hindi_question: "इस समय आपको कितनी तकलीफ़ या दर्द महसूस हो रहा है?",
    audio_hint: "Select your comfort level from mild to extreme.",
    options: [
      { label: "Mild (Noticeable but easy to manage)", level: 1, color: "emerald" },
      { label: "Moderate (Interferes with daily work)", level: 2, color: "amber" },
      { label: "Severe (Difficult to tolerate)", level: 3, color: "orange" },
      { label: "Extreme / Intolerable", level: 4, color: "red" }
    ]
  },
  {
    step: 4,
    title: "Pre-existing Conditions",
    question: "Do you have any known long-term health conditions?",
    hindi_question: "क्या आपको पहले से कोई पुरानी बीमारी है?",
    audio_hint: "Select any conditions you currently take medicines for.",
    options: [
      { label: "Diabetes (Sugar)", icon: "Droplet" },
      { label: "High Blood Pressure (BP)", icon: "Activity" },
      { label: "Asthma / Breathing Trouble", icon: "Wind" },
      { label: "Heart Condition / Prior Surgery", icon: "Heart" },
      { label: "Thyroid Disorder", icon: "Shield" },
      { label: "None / First Time Visit", icon: "CheckCircle2" }
    ]
  },
  {
    step: 5,
    title: "Daily Medications",
    question: "Are you taking any daily medicines or have drug allergies?",
    hindi_question: "क्या आप रोज़ाना कोई दवाई लेते हैं या किसी दवाई से एलर्जी है?",
    audio_hint: "You can speak your medicines or scan your prescription in the next step.",
    options: [
      { label: "Taking Regular BP or Diabetes Tablets", icon: "Pill" },
      { label: "Using Inhaler or Nebulizer", icon: "Wind" },
      { label: "Allergic to Penicillin or Sulfa drugs", icon: "AlertTriangle" },
      { label: "I brought my previous prescription slip", icon: "FileText" },
      { label: "No regular medicines", icon: "Check" }
    ]
  }
];
