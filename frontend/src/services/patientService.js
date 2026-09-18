/**
 * CaseFlow Patient & OPD Queue Service
 * SIH26047 — AI-Powered Patient Case-Taking Software
 *
 * Communicates with FastAPI backend (/api/v1/patients) with complete
 * patient-isolation and client-side fallback state machine.
 */

const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL)
  ? `${import.meta.env.VITE_API_BASE_URL}/patients`
  : 'http://127.0.0.1:8000/api/v1/patients';

const CURRENT_PATIENT_KEY = 'caseflow_current_patient_id';

// Client-side fallback store maintaining 4 distinct patient records
let clientFallbackPatients = {
  'CF-2026-001': {
    id: 'CF-2026-001',
    queue_token: 'OPD-104',
    name: 'Ramesh Chandra Sharma',
    age: 62,
    gender: 'Male',
    abha_id: '91-4829-1029-4821',
    phone: '+91 98450 12345',
    department: 'General Medicine',
    triage_priority: 'Priority',
    chief_complaint: 'Persistent productive cough, progressive dyspnea on exertion for 10 days',
    intake_status: 'Completed',
    red_flag_detected: true,
    red_flag_note: 'Orthopnea and exertional breathlessness in known hypertensive patient',
    language: 'Hindi / English',
    arrived_at: '10:15 AM',
    verification_status: 'Pending Review',
    demographics: {
      name: 'Ramesh Chandra Sharma',
      age: 62,
      gender: 'Male',
      abha_id: '91-4829-1029-4821',
      contact: '+91 98450 12345',
      blood_group: 'B+',
      arrived_at: '10:15 AM',
      consultation_type: 'Follow-up & Acute Intake',
      ayush_mode: 'Allopathic Standard (AYUSH Inactive)'
    },
    triage: {
      priority: 'Priority',
      vitals_summary: 'BP 148/92 mmHg, Pulse 88 bpm, SpO2 94% on room air, Temp 98.4°F',
      triage_nurse: 'Staff Nurse Priya (Station 2)'
    },
    ai_clinical_summary:
      '62-year-old male with long-standing Type 2 Diabetes and Hypertension presenting with a 10-day history of ' +
      'productive cough accompanied by progressive exertional dyspnea (NYHA Class II). Denies fever, chest pain, or hemoptysis.',
    red_flag: {
      detected: true,
      id: 'RF-CF-2026-001-1',
      status: 'ACTIVE',
      title: 'Exertional Breathlessness in Hypertensive Patient (NYHA II/III)',
      rule_trigger: 'Rule #C12: Dyspnea on exertion + Known Cardiac/HTN History',
      nlp_trigger: 'NLP pattern: Patient mentions difficulty sleeping flat without 2 pillows',
      physician_action: 'Immediate clinical chest auscultation and 12-lead ECG advised before OPD sign-off'
    },
    red_flags: [
      {
        id: 'RF-CF-2026-001-1',
        type: 'cardiac_respiratory_alert',
        message: 'Exertional Breathlessness in Hypertensive Patient (NYHA II/III)',
        severity: 'High',
        status: 'ACTIVE',
        detected_at: '2026-09-14T10:15:00',
        reviewed_at: null,
        resolved_at: null,
        reviewed_by: null,
        resolved_by: null,
        title: 'Exertional Breathlessness in Hypertensive Patient (NYHA II/III)',
        rule_trigger: 'Rule #C12: Dyspnea on exertion + Known Cardiac/HTN History',
        nlp_trigger: 'NLP pattern: Patient mentions difficulty sleeping flat without 2 pillows',
        physician_action: 'Immediate clinical chest auscultation and 12-lead ECG advised before OPD sign-off'
      }
    ],
    structured_history: {
      hpi: {
        onset: 'Gradual onset over 10 days',
        character: 'Productive cough with non-pleuritic chest heaviness',
        aggravating_factors: 'Climbing stairs, brisk walking',
        relieving_factors: 'Resting sitting upright for 10-15 minutes',
        severity: 'Moderate (6/10)',
        sputum: 'White mucoid, non-foul smelling'
      },
      past_medical_history: [
        { condition: 'Type 2 Diabetes Mellitus', diagnosed: '2018', control: 'Fair (HbA1c 7.4%)', source: 'document-extracted' },
        { condition: 'Essential Hypertension', diagnosed: '2015', control: 'Sub-optimal (BP 148/92)', source: 'document-extracted' }
      ],
      current_medications: [
        { name: 'Tab. Telmisartan', dose: '40 mg', frequency: 'Once daily (morning)', adherence: 'Regular', source: 'document-extracted' },
        { name: 'Tab. Metformin', dose: '500 mg', frequency: 'Twice daily after meals', adherence: 'Regular', source: 'document-extracted' }
      ],
      allergies: [
        { allergen: 'Sulfa Antibiotics', reaction: 'Cutaneous maculopapular rash & pruritus', severity: 'Moderate' }
      ],
      family_history: ['Father: Myocardial infarction at age 65 (deceased)', 'Mother: Type 2 Diabetes'],
      personal_social: { smoking: 'Ex-smoker (Quit 12 years ago)', alcohol: 'Non-drinker', diet: 'Vegetarian' },
      review_of_systems: { cardiovascular: 'Shortness of breath on exertion', respiratory: 'Cough present with sputum' }
    },
    timeline: [
      {
        date: '14 Sep 2026',
        time: '10:15 AM',
        title: 'CaseFlow Pre-Consultation Kiosk Intake',
        category: 'Intake',
        description: 'Patient completed bilingual intake. Reported cough and exertional dyspnea.',
        source: 'patient-reported'
      }
    ]
  },

  'CF-2026-002': {
    id: 'CF-2026-002',
    queue_token: 'OPD-105',
    name: 'Sunita Devi Verma',
    age: 48,
    gender: 'Female',
    abha_id: '91-3310-9281-7712',
    phone: '+91 97112 33445',
    department: 'General Medicine',
    triage_priority: 'Routine',
    chief_complaint: 'Epigastric burning sensation and postprandial fullness for 3 weeks',
    intake_status: 'Completed',
    red_flag_detected: false,
    red_flag_note: null,
    language: 'Hindi',
    arrived_at: '10:22 AM',
    verification_status: 'Pending Review',
    demographics: {
      name: 'Sunita Devi Verma',
      age: 48,
      gender: 'Female',
      abha_id: '91-3310-9281-7712',
      contact: '+91 97112 33445',
      blood_group: 'A+',
      arrived_at: '10:22 AM',
      consultation_type: 'New Symptom Consultation',
      ayush_mode: 'Allopathic Standard (AYUSH Inactive)'
    },
    triage: {
      priority: 'Routine',
      vitals_summary: 'BP 122/78 mmHg, Pulse 74 bpm, SpO2 99% on room air, Temp 98.2°F',
      triage_nurse: 'Staff Nurse Anita (Station 1)'
    },
    ai_clinical_summary:
      '48-year-old female presenting with a 3-week history of upper abdominal burning and postprandial heaviness. ' +
      'Symptoms are aggravated by spicy food and relieved by cold milk and antacids. Denies vomiting, melena, or weight loss.',
    red_flag: {
      detected: false,
      title: 'No Acute Red Flags Detected',
      rule_trigger: 'Rule #GI01: Gastrointestinal Bleeding Screen Negative',
      nlp_trigger: 'Patient denies black stools or hematemesis',
      physician_action: 'Standard outpatient gastrointestinal evaluation and dietary guidance'
    },
    structured_history: {
      hpi: {
        onset: 'Gradual over 3 weeks',
        character: 'Burning epigastric discomfort, acid reflux sensation',
        aggravating_factors: 'Spicy or oily food, fasting longer than 5 hours',
        relieving_factors: 'Cold milk, OTC antacid gel',
        severity: 'Mild to Moderate (4/10)',
        sputum: 'None'
      },
      past_medical_history: [
        { condition: 'Hypothyroidism', diagnosed: '2021', control: 'Euthyroid on Thyroxine 50mcg', source: 'patient-reported' }
      ],
      current_medications: [
        { name: 'Tab. Thyroxine', dose: '50 mcg', frequency: 'Once daily (fasting)', adherence: 'Regular', source: 'patient-reported' },
        { name: 'Tab. Pantoprazole', dose: '40 mg', frequency: 'As needed (SOS)', adherence: 'Intermittent', source: 'patient-reported' }
      ],
      allergies: [],
      family_history: ['Mother: Gallstones (cholecystectomy at age 52)'],
      personal_social: { smoking: 'Never smoked', alcohol: 'Non-drinker', diet: 'Vegetarian' },
      review_of_systems: { gastrointestinal: 'Heartburn and sour eructations; normal bowel habit' }
    },
    timeline: [
      {
        date: '14 Sep 2026',
        time: '10:22 AM',
        title: 'CaseFlow Pre-Consultation Kiosk Intake',
        category: 'Intake',
        description: 'Patient completed Hindi kiosk intake. Reported 3-week burning epigastric discomfort.',
        source: 'patient-reported'
      }
    ]
  },

  'CF-2026-003': {
    id: 'CF-2026-003',
    queue_token: 'OPD-106',
    name: 'Ananya Mukherjee',
    age: 29,
    gender: 'Female',
    abha_id: '91-6623-1192-5034',
    phone: '+91 98201 55667',
    department: 'General Medicine',
    triage_priority: 'Routine',
    chief_complaint: 'Low-grade evening fever, generalized malaise, sore throat for 4 days',
    intake_status: 'Completed',
    red_flag_detected: false,
    red_flag_note: null,
    language: 'English',
    arrived_at: '10:35 AM',
    verification_status: 'Verified',
    demographics: {
      name: 'Ananya Mukherjee',
      age: 29,
      gender: 'Female',
      abha_id: '91-6623-1192-5034',
      contact: '+91 98201 55667',
      blood_group: 'O+',
      arrived_at: '10:35 AM',
      consultation_type: 'Acute Outpatient Care',
      ayush_mode: 'Allopathic Standard (AYUSH Inactive)'
    },
    triage: {
      priority: 'Routine',
      vitals_summary: 'BP 116/74 mmHg, Pulse 82 bpm, SpO2 98% on room air, Temp 100.2°F',
      triage_nurse: 'Staff Nurse Priya (Station 2)'
    },
    ai_clinical_summary:
      '29-year-old female presenting with a 4-day history of low-grade fever, painful swallowing, and generalized myalgia. ' +
      'Reports rhinorrhea and mild dry cough. Clinical picture is suggestive of acute viral pharyngitis.',
    red_flag: {
      detected: false,
      title: 'No Red Flags Detected',
      rule_trigger: 'Rule #ID02: Sepsis / Severe Systemic Infection Screen Negative',
      nlp_trigger: 'No altered sensorium, stiff neck, or rash',
      physician_action: 'Oropharyngeal examination and symptomatic relief'
    },
    structured_history: {
      hpi: {
        onset: 'Acute onset 4 days ago',
        character: 'Scratchy throat with painful swallowing, generalized body aches',
        aggravating_factors: 'Swallowing dry food',
        relieving_factors: 'Warm salt water gargles, Paracetamol',
        severity: 'Mild (3/10)',
        sputum: 'None'
      },
      past_medical_history: [],
      current_medications: [
        { name: 'Tab. Paracetamol', dose: '650 mg', frequency: 'SOS for fever', adherence: 'Intermittent', source: 'patient-reported' },
        { name: 'Tab. Cetirizine', dose: '10 mg', frequency: 'Once daily at night', adherence: 'Regular', source: 'patient-reported' }
      ],
      allergies: [{ allergen: 'Penicillin', reaction: 'Skin hives & urticaria', severity: 'Moderate' }],
      family_history: ['No chronic illnesses reported'],
      personal_social: { smoking: 'Non-smoker', alcohol: 'Occasional', diet: 'Non-vegetarian' },
      review_of_systems: { ent: 'Sore throat and rhinorrhea' }
    },
    timeline: [
      {
        date: '14 Sep 2026',
        time: '10:35 AM',
        title: 'CaseFlow Pre-Consultation Kiosk Intake',
        category: 'Intake',
        description: 'Patient completed English kiosk intake. Reported 4-day sore throat and low-grade fever.',
        source: 'patient-reported'
      }
    ]
  },

  'CF-2026-004': {
    id: 'CF-2026-004',
    queue_token: 'OPD-107',
    name: 'Mohammad Irfan',
    age: 55,
    gender: 'Male',
    abha_id: '91-1182-9023-4411',
    phone: '+91 99345 77889',
    department: 'General Medicine',
    triage_priority: 'Urgent',
    chief_complaint: 'Acute retrosternal heaviness radiating to left shoulder, onset 2 hours ago',
    intake_status: 'Completed',
    red_flag_detected: true,
    red_flag_note: '⚠️ High Risk: Retrosternal pressure with diaphoresis — immediate triage recommended',
    language: 'Hindi',
    arrived_at: '10:48 AM',
    verification_status: 'Pending Review',
    demographics: {
      name: 'Mohammad Irfan',
      age: 55,
      gender: 'Male',
      abha_id: '91-1182-9023-4411',
      contact: '+91 99345 77889',
      blood_group: 'AB+',
      arrived_at: '10:48 AM',
      consultation_type: 'Acute Chest Triage',
      ayush_mode: 'Allopathic Standard (AYUSH Inactive)'
    },
    triage: {
      priority: 'Urgent',
      vitals_summary: 'BP 164/102 mmHg, Pulse 104 bpm, SpO2 95% on room air, Temp 98.6°F',
      triage_nurse: 'Staff Nurse Anita (Station 1)'
    },
    ai_clinical_summary:
      '55-year-old male presenting with acute severe retrosternal squeezing pressure (8/10) radiating to left shoulder, ' +
      'accompanied by cold sweating starting 2 hours prior to arrival. Urgent physician evaluation and STAT 12-lead ECG indicated.',
    red_flag: {
      detected: true,
      id: 'RF-CF-2026-004-1',
      status: 'ACTIVE',
      title: 'Suspected Acute Coronary Syndrome / High-Risk Chest Pain',
      rule_trigger: 'Rule #CARD01: Retrosternal pressure + Radiation + Diaphoresis',
      nlp_trigger: 'Patient describes heavy crushing retrosternal weight with sweating',
      physician_action: 'STAT 12-lead ECG within 10 minutes, sublingual nitrate, emergency room transfer'
    },
    red_flags: [
      {
        id: 'RF-CF-2026-004-1',
        type: 'acute_coronary_syndrome',
        message: 'Suspected Acute Coronary Syndrome / High-Risk Chest Pain',
        severity: 'Critical',
        status: 'ACTIVE',
        detected_at: '2026-09-14T10:48:00',
        reviewed_at: null,
        resolved_at: null,
        reviewed_by: null,
        resolved_by: null,
        title: 'Suspected Acute Coronary Syndrome / High-Risk Chest Pain',
        rule_trigger: 'Rule #CARD01: Retrosternal pressure + Radiation + Diaphoresis',
        nlp_trigger: 'Patient describes heavy crushing retrosternal weight with sweating',
        physician_action: 'STAT 12-lead ECG within 10 minutes, sublingual nitrate, emergency room transfer'
      }
    ],
    structured_history: {
      hpi: {
        onset: 'Sudden onset 2 hours ago while climbing stairs',
        character: 'Heavy retrosternal crushing pain radiating to left arm',
        aggravating_factors: 'Exertion, walking',
        relieving_factors: 'None',
        severity: 'Severe (8/10)',
        sputum: 'None'
      },
      past_medical_history: [
        { condition: 'Hypertension', diagnosed: 'Known for 5 years', control: 'Irregular', source: 'patient-reported' }
      ],
      current_medications: [
        { name: 'Tab. Amlodipine', dose: '5 mg', frequency: 'Once daily', adherence: 'Irregular', source: 'patient-reported' }
      ],
      allergies: [],
      family_history: ['Elder brother: CABG at age 52'],
      personal_social: { smoking: 'Active smoker (20 cigs/day)', alcohol: 'Non-drinker', diet: 'Non-vegetarian' },
      review_of_systems: { cardiovascular: 'Severe chest tightness, diaphoresis' }
    },
    timeline: [
      {
        date: '14 Sep 2026',
        time: '10:48 AM',
        title: 'CaseFlow Pre-Consultation Kiosk Intake (Urgent Triage)',
        category: 'Intake',
        description: 'Patient completed acute kiosk intake with attendant help. Red-flag triggered for chest pain.',
        source: 'patient-reported'
      }
    ]
  }
};

// Seeded demo patients (CF-2026-001 through CF-2026-004) represent existing verified OPD patients with consent
Object.values(clientFallbackPatients).forEach(p => {
  p.consent = {
    given: true,
    timestamp: '2026-09-14T10:15:00',
    version: 'v1',
    method: 'kiosk'
  };
});

const DEMO_PATIENT_IDS = ['CF-2026-001', 'CF-2026-002', 'CF-2026-003', 'CF-2026-004'];

// ============================================================================
// Canonical Red-Flag Lifecycle helpers (SIH26047)
// Lifecycle: ACTIVE -> REVIEWED -> RESOLVED
// Single source of truth for dashboard stats AND queue rows — they cannot
// disagree because both derive from these functions. Historical (REVIEWED /
// RESOLVED) records are preserved, never deleted.
// ============================================================================

export const RED_FLAG_STATUSES = { ACTIVE: 'ACTIVE', REVIEWED: 'REVIEWED', RESOLVED: 'RESOLVED' };

/**
 * True if a single red-flag record is currently ACTIVE (not REVIEWED/RESOLVED).
 * Legacy records without a status field default to ACTIVE.
 */
export function redFlagIsActive(rf) {
  if (!rf || typeof rf !== 'object') return false;
  return String(rf.status || 'ACTIVE').trim().toUpperCase() === RED_FLAG_STATUSES.ACTIVE;
}

/**
 * Canonical lifecycle-aware derivation for a patient record.
 * Normalizes legacy shapes (red_flag / red_flag_detected / red_flags) without
 * mutating or deleting any historical lifecycle records.
 * Returns { hasActive, redFlags, activeCount, reviewedCount, resolvedCount }.
 */
export function deriveRedFlagState(patient) {
  if (!patient || typeof patient !== 'object') {
    return { hasActive: false, redFlags: [], activeCount: 0, reviewedCount: 0, resolvedCount: 0 };
  }

  // 1. Canonical historical list
  let redFlags = [];
  const rawFlags = patient.red_flags;
  if (Array.isArray(rawFlags)) {
    redFlags = rawFlags.filter((rf) => rf && typeof rf === 'object');
  } else if (rawFlags && typeof rawFlags === 'object') {
    redFlags = [rawFlags];
  }

  // 2. Legacy normalization: synthesize a historical record from legacy
  //    red_flag / red_flag_detected fields ONLY when no list exists.
  if (redFlags.length === 0) {
    const legacyRf = patient.red_flag;
    if (legacyRf && typeof legacyRf === 'object' && legacyRf.detected) {
      redFlags = [{
        id: legacyRf.id || `RF-${patient.id || 'UNKNOWN'}-1`,
        type: legacyRf.type || 'clinical_safety_alert',
        message: legacyRf.title || patient.red_flag_note || 'Clinical Alert',
        title: legacyRf.title || patient.red_flag_note || 'Clinical Alert',
        severity: legacyRf.severity || 'High',
        status: String(legacyRf.status || 'ACTIVE').toUpperCase(),
        detected_at: legacyRf.detected_at || patient.arrived_at || null,
        reviewed_at: legacyRf.reviewed_at || null,
        resolved_at: legacyRf.resolved_at || null,
        reviewed_by: legacyRf.reviewed_by || null,
        resolved_by: legacyRf.resolved_by || null,
        rule_trigger: legacyRf.rule_trigger || null,
        nlp_trigger: legacyRf.nlp_trigger || null,
        physician_action: legacyRf.physician_action || null
      }];
    } else if (patient.red_flag_detected) {
      redFlags = [{
        id: `RF-${patient.id || 'UNKNOWN'}-1`,
        type: 'clinical_safety_alert',
        message: patient.red_flag_note || 'Clinical Alert',
        title: patient.red_flag_note || 'Clinical Alert',
        severity: 'High',
        status: RED_FLAG_STATUSES.ACTIVE,
        detected_at: patient.arrived_at || null
      }];
    }
  }

  const activeCount = redFlags.filter(redFlagIsActive).length;
  const reviewedCount = redFlags.filter((rf) => String(rf.status || '').toUpperCase() === RED_FLAG_STATUSES.REVIEWED).length;
  const resolvedCount = redFlags.filter((rf) => String(rf.status || '').toUpperCase() === RED_FLAG_STATUSES.RESOLVED).length;

  return {
    hasActive: activeCount > 0,
    redFlags,
    activeCount,
    reviewedCount,
    resolvedCount
  };
}

export const patientService = {
  isDemoPatient(id) {
    return DEMO_PATIENT_IDS.includes(id);
  },

  getCurrentPatientId() {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem(CURRENT_PATIENT_KEY);
      // If stored ID is a demo patient, clear it so kiosk intake stays isolated
      if (stored && this.isDemoPatient(stored)) {
        sessionStorage.removeItem(CURRENT_PATIENT_KEY);
        return null;
      }
      return stored || null;
    }
    return null;
  },

  setCurrentPatientId(id) {
    if (typeof window !== 'undefined') {
      if (id) {
        sessionStorage.setItem(CURRENT_PATIENT_KEY, id);
      } else {
        sessionStorage.removeItem(CURRENT_PATIENT_KEY);
      }
    }
  },

  clearCurrentPatient() {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(CURRENT_PATIENT_KEY);
      sessionStorage.removeItem('caseflow_patient_lang');
    }
  },

  getPatientLanguage(patientId = null) {
    if (typeof window !== 'undefined') {
      const storedLang = sessionStorage.getItem('caseflow_patient_lang');
      if (storedLang) return storedLang;
    }
    const targetId = patientId || this.getCurrentPatientId();
    if (targetId && clientFallbackPatients[targetId]?.language) {
      const l = clientFallbackPatients[targetId].language.toLowerCase();
      if (l.includes('hi')) return 'hi';
      if (l.includes('en')) return 'en';
    }
    return 'en';
  },

  setPatientLanguage(language, patientId = null) {
    const cleaned = language === 'hi' || language === 'hindi' ? 'hi' : 'en';
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('caseflow_patient_lang', cleaned);
    }
    const targetId = patientId || this.getCurrentPatientId();
    if (targetId && clientFallbackPatients[targetId]) {
      clientFallbackPatients[targetId].language = cleaned === 'hi' ? 'Hindi' : 'English';
    }
  },

  /**
   * Record explicit patient consent and append a single consent_given timeline event.
   */
  async recordConsent(patientId, { given = true, version = 'v1', method = 'kiosk' } = {}) {
    const targetId = patientId || this.getCurrentPatientId();
    if (!targetId) {
      console.error('[patientService.recordConsent] Target patient ID is null');
      return null;
    }
    console.log(`[patientService.recordConsent] patient_id: ${targetId}, given: ${given}`);

    try {
      const res = await fetch(`${API_BASE_URL}/${targetId}/consent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ given: Boolean(given), version: version || 'v1', method: method || 'kiosk' })
      });
      if (res.ok) {
        const updated = await res.json();
        clientFallbackPatients[targetId] = updated;
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('caseflow-queue-updated'));
        }
        return updated;
      } else {
        const errJson = await res.json().catch(() => ({}));
        console.error(`[patientService.recordConsent] Backend status ${res.status}:`, errJson);
      }
    } catch (err) {
      console.warn('Backend consent record failed, using client fallback:', err.message);
    }

    let p = clientFallbackPatients[targetId];
    if (!p) {
      p = {
        id: targetId,
        queue_token: `OPD-${104 + Object.keys(clientFallbackPatients).length}`,
        name: 'Patient',
        age: 30,
        gender: 'Other',
        department: 'General Medicine',
        triage_priority: 'Routine',
        chief_complaint: 'Routine medical intake',
        intake_status: 'Registered',
        verification_status: 'Pending Review',
        demographics: { name: 'Patient', age: 30, gender: 'Other' },
        structured_history: { hpi: {}, past_medical_history: [], current_medications: [], labs: [], allergies: [] },
        medications: [],
        labs: [],
        timeline: []
      };
      clientFallbackPatients[targetId] = p;
    }

    const nowIso = new Date().toISOString();
    const nowDt = new Date();
    p.consent = {
      given: Boolean(given),
      timestamp: given ? nowIso : null,
      version: version || 'v1',
      method: method || 'kiosk'
    };

    if (given) {
      if (!p.timeline) p.timeline = [];
      const existingConsent = p.timeline.some((e) => e.type === 'consent_given');
      if (!existingConsent) {
        p.timeline.push({
          id: `TL-CONSENT-${targetId}`,
          patient_id: targetId,
          type: 'consent_given',
          source: 'patient',
          category: 'Consent',
          title: 'Patient consent recorded',
          description: 'Patient provided consent to continue the CaseFlow intake',
          timestamp: nowIso,
          date: nowDt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          time: nowDt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('caseflow-queue-updated'));
    }
    return p;
  },

  hasPatientConsent(patientId = null) {
    const targetId = patientId || this.getCurrentPatientId();
    if (!targetId) return false;
    const p = clientFallbackPatients[targetId];
    return Boolean(
      p?.consent?.given ||
      p?.consent === true ||
      p?.consent_given ||
      p?.consent_obtained ||
      (Array.isArray(p?.timeline) && p.timeline.some((e) => e.type === 'consent_given' || e.category === 'Consent'))
    );
  },

  /**
   * Canonical queue statistics calculator (lifecycle-aware)
   * Guarantees 100% agreement between header counters, metric cards, and patient table:
   * all of them derive from the same canonical deriveRedFlagState() helper.
   * RESOLVED / REVIEWED red flags are NOT counted as active red flags,
   * but remain persisted as historical lifecycle records.
   */
  computeQueueStats(queue = []) {
    const list = Array.isArray(queue) ? queue : [];
    return {
      total: list.length,
      redFlags: list.filter((p) => deriveRedFlagState(p).hasActive).length,
      urgent: list.filter((p) => (p.triage_priority || '').toUpperCase() === 'URGENT').length,
      verified: list.filter((p) => (p.verification_status || '').toLowerCase() === 'verified').length,
      pending: list.filter((p) => (p.verification_status || '').toLowerCase() !== 'verified').length
    };
  },

  /**
   * Retrieve active patient queue
   */
  async getQueue(department = null) {
    try {
      const url = department ? `${API_BASE_URL}/queue?department=${encodeURIComponent(department)}` : `${API_BASE_URL}/queue`;
      const res = await fetch(url);
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Backend queue fetch failed, using client fallback:', err.message);
    }

    return Object.values(clientFallbackPatients).map((p) => {
      // Same canonical lifecycle-aware derivation as computeQueueStats()
      const rfState = deriveRedFlagState(p);

      return {
        id: p.id,
        queue_token: p.queue_token,
        name: p.name,
        age: p.age,
        gender: p.gender,
        abha_id: p.abha_id,
        department: p.department,
        triage_priority: p.triage_priority,
        chief_complaint: p.chief_complaint,
        intake_status: p.intake_status,
        red_flag_detected: rfState.hasActive,
        red_flag_note: p.red_flag_note,
        red_flags: rfState.redFlags,
        language: p.language,
        arrived_at: p.arrived_at,
        verification_status: p.verification_status,
        consent: p.consent || { given: false, timestamp: null, version: 'v1', method: 'kiosk' }
      };
    });
  },

  /**
   * Retrieve detailed patient clinical record by ID
   * Strictly isolates patient data: never silently falls back to CF-2026-001.
   */
  async getPatient(id) {
    const targetId = id || this.getCurrentPatientId();
    if (!targetId) return null;

    try {
      const res = await fetch(`${API_BASE_URL}/${targetId}`);
      if (res.ok) {
        const patientData = await res.json();
        clientFallbackPatients[targetId] = patientData;
        return patientData;
      }
    } catch (err) {
      console.warn(`Backend patient fetch for ${targetId} failed, using client fallback:`, err.message);
    }

    // Return the matching record or null. NEVER return another patient's data!
    return clientFallbackPatients[targetId] || null;
  },

  /**
   * Update patient intake demographics and complaint
   */
  async updatePatient(id, updateData) {
    const targetId = id || this.getCurrentPatientId();
    if (!targetId) return null;

    // Safety guard: Demo patients are immutable from kiosk registration
    if (this.isDemoPatient(targetId) && !updateData.is_doctor_edit) {
      console.warn(`Prevented overwriting seeded demo patient ${targetId}. Creating isolated patient instead.`);
      return this.registerPatient(updateData);
    }

    try {
      const res = await fetch(`${API_BASE_URL}/${targetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      if (res.ok) {
        const updated = await res.json();
        clientFallbackPatients[targetId] = updated;
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('caseflow-queue-updated'));
        }
        return updated;
      }
    } catch (err) {
      console.warn(`Backend patient update for ${targetId} failed, using client fallback:`, err.message);
    }

    // Client fallback update
    let p = clientFallbackPatients[targetId];
    if (!p) {
      p = {
        id: targetId,
        queue_token: `OPD-${104 + Object.keys(clientFallbackPatients).length}`,
        name: updateData.name || 'Patient',
        age: Number(updateData.age) || 30,
        gender: updateData.gender || 'Other',
        phone: updateData.phone || '+91 99000 00000',
        abha_id: updateData.abha_id || 'Not linked',
        department: 'General Medicine',
        triage_priority: 'Routine',
        chief_complaint: updateData.chief_complaint || 'Routine intake',
        intake_status: updateData.intake_status || 'Registered',
        verification_status: 'Pending Review',
        consent: {
          given: false,
          timestamp: null,
          version: 'v1',
          method: 'kiosk'
        },
        demographics: {
          name: updateData.name || 'Patient',
          age: Number(updateData.age) || 30,
          gender: updateData.gender || 'Other'
        },
        triage: { priority: 'Routine', vitals_summary: 'Pending triage' },
        structured_history: { hpi: {}, past_medical_history: [], current_medications: [], labs: [], allergies: [] },
        medications: [],
        labs: [],
        timeline: [],
        documents: []
      };
      clientFallbackPatients[targetId] = p;
    }

    if (updateData.name) {
      p.name = updateData.name;
      if (p.demographics) p.demographics.name = updateData.name;
    }
    if (updateData.age) {
      p.age = Number(updateData.age);
      if (p.demographics) p.demographics.age = Number(updateData.age);
    }
    if (updateData.gender) {
      p.gender = updateData.gender;
      if (p.demographics) p.demographics.gender = updateData.gender;
    }
    if (updateData.phone) {
      p.phone = updateData.phone;
      if (p.demographics) p.demographics.contact = updateData.phone;
    }
    if (updateData.abha_id) {
      p.abha_id = updateData.abha_id;
      if (p.demographics) p.demographics.abha_id = updateData.abha_id;
    }
    if (!p.structured_history) {
      p.structured_history = { hpi: {}, past_medical_history: [], current_medications: [], labs: [], allergies: [] };
    }
    if (updateData.chief_complaint) {
      p.chief_complaint = updateData.chief_complaint;
      if (p.structured_history.hpi) p.structured_history.hpi.character = updateData.chief_complaint;
    }
    if (updateData.hpi && typeof updateData.hpi === 'object') {
      p.structured_history.hpi = { ...(p.structured_history.hpi || {}), ...updateData.hpi };
    }
    if (Array.isArray(updateData.past_medical_history)) {
      p.structured_history.past_medical_history = updateData.past_medical_history;
    }
    if (Array.isArray(updateData.allergies)) {
      p.structured_history.allergies = updateData.allergies;
    }

    // Update medications with provenance preservation
    const medsIn = updateData.current_medications || updateData.medications;
    if (Array.isArray(medsIn)) {
      const existingMeds = p.structured_history.current_medications || [];
      const norm = (n) => (n || '').toLowerCase().replace(/^(tab\.|cap\.|syp\.|inj\.)\s*/i, '').trim();
      const updatedMeds = medsIn.map(m => {
        const match = existingMeds.find(em => norm(em.name) === norm(m.name));
        return {
          name: m.name,
          dose: m.dose || m.dosage || '',
          frequency: m.frequency || '',
          duration: m.duration || '',
          source: m.source || match?.source || 'doctor',
          verified_by: m.verified_by || 'doctor'
        };
      });
      p.structured_history.current_medications = updatedMeds;
      p.medications = updatedMeds;
    }

    // Update labs with provenance preservation
    if (Array.isArray(updateData.labs)) {
      const existingLabs = p.structured_history.labs || [];
      const normLab = (n) => (n || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const updatedLabs = updateData.labs.map(l => {
        const pName = l.parameter || l.name;
        const match = existingLabs.find(el => normLab(el.parameter || el.name) === normLab(pName));
        return {
          name: pName,
          parameter: pName,
          value: String(l.value || ''),
          unit: l.unit || '',
          status: l.status || 'Normal',
          reference_range: l.reference_range || '',
          source: l.source || match?.source || 'doctor',
          verified_by: l.verified_by || 'doctor'
        };
      });
      p.structured_history.labs = updatedLabs;
      p.labs = updatedLabs;
    }

    if (updateData.is_doctor_edit) {
      if (!p.timeline) p.timeline = [];
      p.timeline.push({
        id: `TL-DOC-${Date.now()}`,
        patient_id: targetId,
        type: 'doctor_edit',
        category: 'Doctor Edit',
        source: 'doctor',
        title: 'Record updated by doctor',
        description: 'Clinical record edited and saved by physician',
        timestamp: new Date().toISOString(),
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    }

    p.ai_clinical_summary = this.generateClientClinicalSummary(p);

    if (updateData.intake_status) {
      p.intake_status = updateData.intake_status;
      if (updateData.intake_status === 'Completed') {
        if (!p.timeline) p.timeline = [];
        const hasInterview = p.timeline.some(e => e.title?.toLowerCase().includes('interview'));
        if (!hasInterview) {
          p.timeline.push({
            id: `TL-INT-${targetId}`,
            patient_id: targetId,
            type: 'interview_completed',
            category: 'Intake',
            title: 'Interview completed',
            description: `Pre-consultation intake completed. Reason: ${p.chief_complaint || 'General intake'}`,
            timestamp: new Date().toISOString(),
            date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            source: 'interview'
          });
        }
      }
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('caseflow-queue-updated'));
    }
    return p;
  },

  /**
   * Register a new patient at the kiosk with guaranteed unique patient_id
   */
  async registerPatient(patientData) {
    try {
      const res = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patientData)
      });
      if (res.ok) {
        const created = await res.json();
        this.setCurrentPatientId(created.id);
        clientFallbackPatients[created.id] = created;
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('caseflow-queue-updated'));
        }
        return created;
      }
    } catch (err) {
      console.warn('Backend patient register failed, using client fallback:', err.message);
    }

    // Determine next unique ID avoiding demo IDs (CF-2026-001 through CF-2026-004)
    let maxNum = 4;
    Object.keys(clientFallbackPatients).forEach((k) => {
      const match = k.match(/CF-2026-(\d+)/);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxNum) maxNum = n;
      }
    });

    const newId = `CF-2026-${String(maxNum + 1).padStart(3, '0')}`;
    const newRecord = {
      id: newId,
      queue_token: `OPD-${104 + Object.keys(clientFallbackPatients).length}`,
      name: patientData.name || 'New Patient',
      age: Number(patientData.age) || 30,
      gender: patientData.gender || 'Other',
      abha_id: patientData.abha_id || 'Not linked',
      phone: patientData.phone || '+91 99000 00000',
      department: patientData.department || 'General Medicine',
      triage_priority: 'Routine',
      chief_complaint: patientData.chief_complaint || 'Routine medical intake',
      intake_status: 'Registered',
      red_flag_detected: false,
      red_flag_note: null,
      language: patientData.preferred_language || 'Hindi',
      arrived_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      verification_status: 'Pending Review',
      consent: {
        given: false,
        timestamp: null,
        version: 'v1',
        method: 'kiosk'
      },
      demographics: {
        name: patientData.name || 'New Patient',
        age: Number(patientData.age) || 30,
        gender: patientData.gender || 'Other',
        abha_id: patientData.abha_id || 'Not linked',
        contact: patientData.phone || '+91 99000 00000',
        blood_group: 'Unknown',
        arrived_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        consultation_type: 'New Kiosk Intake',
        ayush_mode: 'Allopathic Standard (AYUSH Inactive)'
      },
      triage: {
        priority: 'Routine',
        vitals_summary: 'Vitals pending triage station check',
        triage_nurse: 'Station 1'
      },
      ai_clinical_summary: `${Number(patientData.age) || 30}-year-old ${String(patientData.gender || 'patient').toLowerCase()} presenting with ${(patientData.chief_complaint || 'routine intake').toLowerCase()}. No acute emergency red-flags identified during pre-consultation intake.`,
      red_flag: {
        detected: false,
        title: 'No emergency triage red-flags currently identified.',
        rule_trigger: 'Initial intake screen',
        nlp_trigger: 'None',
        physician_action: 'Standard clinical consultation'
      },
      structured_history: {
        hpi: {
          onset: 'Recent',
          character: patientData.chief_complaint || 'New intake',
          severity: 'Mild (3/10)'
        },
        past_medical_history: [],
        current_medications: [],
        labs: [],
        allergies: [],
        family_history: [],
        personal_social: {},
        review_of_systems: {}
      },
      medications: [],
      labs: [],
      timeline: [
        {
          id: `TL-REG-${newId}`,
          patient_id: newId,
          type: 'patient_registered',
          date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: new Date().toISOString(),
          title: 'Patient registered',
          category: 'Intake',
          description: `Patient registered at kiosk. Reason: ${patientData.chief_complaint || 'Routine intake'}`,
          source: 'registration'
        }
      ],
      documents: []
    };

    clientFallbackPatients[newId] = newRecord;
    this.setCurrentPatientId(newId);
    return newRecord;
  },

  /**
   * Synchronize patient interview responses and clinical extractions to the patient record
   */
  async syncInterviewData(patientId, { chiefComplaint, extractedHistory = {}, redFlags = [], sessionCompleted = false, language = null }) {
    if (!patientId) return null;

    // 1. Synchronize to backend if accessible
    try {
      const updatePayload = {};
      if (chiefComplaint) updatePayload.chief_complaint = chiefComplaint;
      if (sessionCompleted) updatePayload.intake_status = 'Completed';
      if (language) updatePayload.language = language;

      await fetch(`${API_BASE_URL}/${patientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload)
      });
    } catch (err) {
      // client fallback continues seamlessly
    }

    // 2. Synchronize to client fallback store
    let p = clientFallbackPatients[patientId];
    if (!p) {
      const langDisplay = language === 'hi' ? 'Hindi' : (language === 'en' ? 'English' : (language || 'Hindi / English'));
      p = {
        id: patientId,
        queue_token: `OPD-${104 + Object.keys(clientFallbackPatients).length}`,
        name: 'Patient',
        age: 30,
        gender: 'Other',
        department: 'General Medicine',
        triage_priority: 'Routine',
        chief_complaint: chiefComplaint || 'General consultation',
        intake_status: sessionCompleted ? 'Completed' : 'Interview in progress',
        red_flag_detected: false,
        red_flag_note: null,
        language: langDisplay,
        arrived_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        verification_status: 'Pending Review',
        consent: {
          given: false,
          timestamp: null,
          version: 'v1',
          method: 'kiosk'
        },
        demographics: {
          name: 'Patient',
          age: 30,
          gender: 'Other'
        },
        triage: { priority: 'Routine', vitals_summary: 'Pending triage' },
        structured_history: { hpi: {}, past_medical_history: [], current_medications: [], labs: [], allergies: [] },
        medications: [],
        labs: [],
        timeline: [],
        documents: []
      };
      clientFallbackPatients[patientId] = p;
    }

    if (language) {
      p.language = language === 'hi' ? 'Hindi' : (language === 'en' ? 'English' : language);
    }

    // Update chief complaint
    if (chiefComplaint && chiefComplaint !== 'Not yet provided') {
      p.chief_complaint = chiefComplaint;
      if (p.demographics) p.demographics.chief_complaint = chiefComplaint;
      if (p.structured_history?.hpi) p.structured_history.hpi.character = chiefComplaint;
    }

    // Update HPI from extractedHistory
    if (!p.structured_history) p.structured_history = {};
    if (!p.structured_history.hpi) p.structured_history.hpi = {};
    const hpi = p.structured_history.hpi;
    if (extractedHistory.onset && extractedHistory.onset !== 'Not yet provided') hpi.onset = extractedHistory.onset;
    if (extractedHistory.character && extractedHistory.character !== 'Not yet provided') hpi.character = extractedHistory.character;
    if (extractedHistory.severity && extractedHistory.severity !== 'Not yet provided') hpi.severity = extractedHistory.severity;
    if (extractedHistory.site && extractedHistory.site !== 'Not yet provided') hpi.site = extractedHistory.site;
    if (extractedHistory.aggravatingFactors && extractedHistory.aggravatingFactors !== 'Not yet provided') hpi.aggravating_factors = extractedHistory.aggravatingFactors;
    if (extractedHistory.relievingFactors && extractedHistory.relievingFactors !== 'Not yet provided') hpi.relieving_factors = extractedHistory.relievingFactors;

    // Update Red Flags
    if (redFlags && redFlags.length > 0) {
      p.red_flag_detected = true;
      p.red_flag_note = redFlags.join('; ');
      p.red_flag = {
        detected: true,
        title: `Symptom Red Flag: ${redFlags[0]}`,
        rule_trigger: 'Patient Interview Safety Screen',
        nlp_trigger: redFlags.join('; '),
        physician_action: 'Urgent physician evaluation indicated'
      };
      p.triage_priority = 'Urgent';
    } else if (!p.red_flag_detected) {
      p.red_flag_detected = false;
      p.red_flag_note = null;
      p.red_flag = {
        detected: false,
        title: 'No emergency triage red-flags currently identified.'
      };
    }

    // Dynamic AI summary generation based strictly on THIS patient's findings
    p.ai_clinical_summary = this.generateClientClinicalSummary(p, extractedHistory, redFlags);

    if (sessionCompleted) {
      p.intake_status = 'Completed';
      if (!p.timeline) p.timeline = [];
      const hasInterviewEvent = p.timeline.some(e => e.title?.toLowerCase().includes('interview'));
      if (!hasInterviewEvent) {
        p.timeline.push({
          id: `TL-INT-${patientId}`,
          patient_id: patientId,
          type: 'interview_completed',
          date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: new Date().toISOString(),
          title: 'Interview completed',
          category: 'Intake',
          description: `Pre-consultation adaptive interview completed. Reason: ${p.chief_complaint || 'General consultation'}`,
          source: 'interview'
        });
      }
    }

    return p;
  },

  /**
   * Record optional patient-reported AYUSH intake parameters (Nadi, Mutra, Mala, Jihwa)
   */
  async recordAyushIntake(patientId, ayushData) {
    if (!patientId) return null;
    try {
      const res = await fetch(`${API_BASE_URL}/${patientId}/ayush`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ayushData)
      });
      if (res.ok) {
        const updated = await res.json();
        clientFallbackPatients[patientId] = updated;
        return updated;
      }
    } catch (err) {
      console.warn('Backend recordAyushIntake failed, using client fallback:', err.message);
    }

    // Client fallback
    let p = clientFallbackPatients[patientId];
    if (!p) {
      p = { id: patientId, ayush: {} };
      clientFallbackPatients[patientId] = p;
    }

    p.ayush = {
      nadi: { value: ayushData?.nadi?.value || ayushData?.nadi || 'Not provided', source: 'patient-reported' },
      mutra: { value: ayushData?.mutra?.value || ayushData?.mutra || 'Not provided', source: 'patient-reported' },
      mala: { value: ayushData?.mala?.value || ayushData?.mala || 'Not provided', source: 'patient-reported' },
      jihwa: { value: ayushData?.jihwa?.value || ayushData?.jihwa || 'Not provided', source: 'patient-reported' },
      completed_at: new Date().toISOString()
    };

    if (p.demographics) {
      p.demographics.ayush_mode = 'AYUSH Kiosk Intake Active';
    }

    if (!p.timeline) p.timeline = [];
    if (!p.timeline.some(e => e.id === `TL-AYUSH-${patientId}`)) {
      p.timeline.push({
        id: `TL-AYUSH-${patientId}`,
        patient_id: patientId,
        type: 'ayush_intake_completed',
        category: 'AYUSH Intake',
        title: 'AYUSH intake recorded',
        description: 'Patient completed optional AYUSH intake (Nadi, Mutra, Mala, Jihwa)',
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: new Date().toISOString(),
        source: 'patient-reported'
      });
    }

    return p;
  },

  /**
   * Update the lifecycle state of a specific red flag (ACTIVE, REVIEWED, RESOLVED).
   */
  async updateRedFlagStatus(patientId, redFlagId, status, doctorId = 'Dr. S. K. Mehta (Reg: MCI-48201)') {
    const targetId = patientId || this.getCurrentPatientId();
    if (!targetId || !redFlagId) return null;
    const normStatus = (status || '').trim().toUpperCase();

    try {
      const res = await fetch(`${API_BASE_URL}/${targetId}/red-flags/${redFlagId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: normStatus, doctor_id: doctorId })
      });
      if (res.ok) {
        const updated = await res.json();
        clientFallbackPatients[targetId] = updated;
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('caseflow-queue-updated'));
        }
        return updated;
      }

      // Backend reached but rejected request (404, 400, 500, etc.)
      // The frontend must NOT silently present a successful lifecycle update when backend returns error.
      const errDetail = await res.json().catch(() => ({}));
      const errMsg = errDetail?.detail || `HTTP ${res.status}: Failed to update red flag status`;
      console.error(`Backend updateRedFlagStatus rejected [${res.status}]:`, errMsg);
      throw new Error(errMsg);
    } catch (err) {
      if (err.message && (err.message.startsWith('HTTP ') || err.message.includes('not found') || err.message.includes('Invalid'))) {
        throw err;
      }
      console.warn('Backend updateRedFlagStatus network error, using client fallback:', err.message);
    }

    // Client fallback
    let p = clientFallbackPatients[targetId];
    if (!p) return null;

    if (!Array.isArray(p.red_flags)) {
      p.red_flags = [];
    }

    let targetRf = p.red_flags.find((rf) => rf.id === redFlagId);
    if (!targetRf && (p.red_flag?.id === redFlagId || p.red_flag_detected)) {
      targetRf = {
        id: redFlagId,
        type: 'clinical_safety_alert',
        message: p.red_flag?.title || p.red_flag_note || 'High Risk Clinical Symptom Flagged',
        severity: 'High',
        status: 'ACTIVE',
        detected_at: p.arrived_at || new Date().toISOString(),
        title: p.red_flag?.title || p.red_flag_note || 'High Risk Clinical Symptom Flagged',
        rule_trigger: p.red_flag?.rule_trigger || 'Safety Rule Triggered',
        nlp_trigger: p.red_flag?.nlp_trigger || p.red_flag_note,
        physician_action: p.red_flag?.physician_action || 'Immediate physician evaluation required'
      };
      p.red_flags.push(targetRf);
    }

    if (!targetRf) return null;

    const prevStatus = targetRf.status || 'ACTIVE';
    const nowIso = new Date().toISOString();
    const nowDt = new Date();

    targetRf.status = normStatus;
    if (normStatus === 'REVIEWED') {
      targetRf.reviewed_at = nowIso;
      targetRf.reviewed_by = doctorId;
    } else if (normStatus === 'RESOLVED') {
      targetRf.resolved_at = nowIso;
      targetRf.resolved_by = doctorId;
      if (!targetRf.reviewed_at) {
        targetRf.reviewed_at = nowIso;
        targetRf.reviewed_by = doctorId;
      }
    } else if (normStatus === 'ACTIVE') {
      targetRf.reviewed_at = null;
      targetRf.reviewed_by = null;
      targetRf.resolved_at = null;
      targetRf.resolved_by = null;
    }

    if (p.red_flag && (p.red_flag.id === redFlagId || p.red_flags.length === 1)) {
      p.red_flag.status = normStatus;
    }

    p.red_flag_detected = p.red_flags.some((rf) => (rf.status || 'ACTIVE').toUpperCase() === 'ACTIVE');

    if (prevStatus !== normStatus) {
      if (!p.timeline) p.timeline = [];
      const title = normStatus === 'REVIEWED' ? 'Red flag reviewed' : (normStatus === 'RESOLVED' ? 'Red flag resolved' : 'Red flag reactivated');
      p.timeline.push({
        id: `TL-RF-${redFlagId}-${normStatus}-${Date.now().toString(36).toUpperCase()}`,
        patient_id: targetId,
        type: `red_flag_${normStatus.toLowerCase()}`,
        category: 'Safety Alert',
        source: 'doctor',
        title,
        description: `Clinical safety alert '${targetRf.title || targetRf.message}' status changed from ${prevStatus} to ${normStatus} by ${doctorId}.`,
        timestamp: nowIso,
        date: nowDt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        time: nowDt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        red_flag_id: redFlagId,
        previous_status: prevStatus,
        new_status: normStatus,
        doctor: doctorId,
        verified_by: doctorId
      });
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('caseflow-queue-updated'));
    }
    return p;
  },

  /**
   * Merges confirmed document extractions (medications, labs, timeline) into canonical patient record
   */
  mergeConfirmedDocumentData(patientId, documentData) {
    if (!patientId || !documentData) return null;
    let p = clientFallbackPatients[patientId];
    if (!p) {
      p = {
        id: patientId,
        queue_token: `OPD-${104 + Object.keys(clientFallbackPatients).length}`,
        name: 'Patient',
        age: 30,
        gender: 'Other',
        department: 'General Medicine',
        triage_priority: 'Routine',
        chief_complaint: 'Routine medical intake',
        intake_status: 'Completed',
        verification_status: 'Pending Review',
        consent: {
          given: false,
          timestamp: null,
          version: 'v1',
          method: 'kiosk'
        },
        demographics: { name: 'Patient', age: 30, gender: 'Other' },
        structured_history: { current_medications: [], labs: [], past_medical_history: [], hpi: {} },
        medications: [],
        labs: [],
        timeline: [
          {
            id: `TL-REG-${patientId}`,
            patient_id: patientId,
            type: 'patient_registered',
            category: 'Intake',
            title: 'Patient registered',
            description: 'Patient registered at kiosk',
            timestamp: new Date().toISOString(),
            date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            source: 'registration'
          },
          {
            id: `TL-INT-${patientId}`,
            patient_id: patientId,
            type: 'interview_completed',
            category: 'Intake',
            title: 'Interview completed',
            description: 'Pre-consultation adaptive interview completed',
            timestamp: new Date().toISOString(),
            date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            source: 'interview'
          }
        ]
      };
      clientFallbackPatients[patientId] = p;
    }

    if (!p.structured_history) p.structured_history = {};
    if (!p.structured_history.current_medications) p.structured_history.current_medications = [];
    if (!p.structured_history.labs) p.structured_history.labs = [];
    if (!p.timeline) p.timeline = [];

    const normalizeMed = (name) => (name || '')
      .toLowerCase()
      .replace(/^(tab\.|cap\.|syp\.|inj\.)\s*/i, '')
      .replace(/\s*\d+(\.\d+)?\s*(mg|g|ml|mcg)\b.*$/i, '')
      .trim();

    // 1. Merge medications
    const meds = documentData.medications || documentData.extracted_data?.medications || [];
    meds.forEach(rawMed => {
      if (!rawMed || !rawMed.name) return;
      const norm = normalizeMed(rawMed.name);
      const existing = p.structured_history.current_medications.find(m => normalizeMed(m.name) === norm);
      if (existing) {
        if (rawMed.dose && !existing.dose) existing.dose = rawMed.dose;
        if (rawMed.frequency && !existing.frequency) existing.frequency = rawMed.frequency;
        if (rawMed.duration && !existing.duration) existing.duration = rawMed.duration;
        if (!existing.source || existing.source === 'patient-reported') existing.source = rawMed.source || 'ocr';
      } else {
        const cleanName = (rawMed.name || '').replace(/^(tab\.|cap\.|syp\.|inj\.)\s*/i, '').trim();
        p.structured_history.current_medications.push({
          name: cleanName,
          dose: rawMed.dose || '',
          frequency: rawMed.frequency || '',
          duration: rawMed.duration || '',
          source: rawMed.source || 'ocr'
        });
      }
    });

    // 2. Merge labs
    const labs = documentData.lab_findings || documentData.extracted_data?.labs || documentData.labs || [];
    labs.forEach(rawLab => {
      if (!rawLab) return;
      const param = (rawLab.parameter || rawLab.name || '').trim();
      if (!param) return;
      const normParam = param.toLowerCase().replace(/[^a-z0-9]/g, '');
      const existingLab = p.structured_history.labs.find(l => (l.parameter || l.name || '').toLowerCase().replace(/[^a-z0-9]/g, '') === normParam);
      if (existingLab) {
        existingLab.value = String(rawLab.value || '');
        if (rawLab.unit) existingLab.unit = rawLab.unit;
        if (rawLab.status) existingLab.status = rawLab.status;
        if (rawLab.reference_range) existingLab.reference_range = rawLab.reference_range;
        existingLab.source = rawLab.source || 'ocr';
      } else {
        p.structured_history.labs.push({
          name: param,
          parameter: param,
          value: String(rawLab.value || ''),
          unit: rawLab.unit || '',
          status: rawLab.status || 'Normal',
          reference_range: rawLab.reference_range || '',
          source: rawLab.source || 'ocr'
        });
      }
    });

    p.medications = p.structured_history.current_medications;
    p.labs = p.structured_history.labs;

    // 3. Add timeline event
    const docId = documentData.document_id || 'DOC';
    const timelineEventId = `TL-${docId}`;
    const docType = (documentData.document_type || 'prescription').toLowerCase();
    const isLab = docType.includes('lab') || docType.includes('cbc');

    if (!p.timeline.some(e => e.id === timelineEventId)) {
      p.timeline.push({
        id: timelineEventId,
        patient_id: patientId,
        type: 'document_uploaded',
        category: isLab ? 'Lab Investigation' : 'Prescription',
        title: isLab ? 'Lab report uploaded' : 'Prescription uploaded',
        description: isLab ? 'Lab report processed and confirmed' : 'Prescription document processed and confirmed',
        timestamp: new Date().toISOString(),
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'document'
      });
    }

    p.ai_clinical_summary = this.generateClientClinicalSummary(p);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('caseflow-queue-updated'));
    }
    return p;
  },

  /**
   * Deterministic client-side clinical summary generator ensuring ZERO data leakage
   */
  generateClientClinicalSummary(patient, extracted = {}, redFlags = []) {
    const age = patient.age || patient.demographics?.age || '';
    const gender = patient.gender || patient.demographics?.gender || '';
    const complaint = patient.chief_complaint || 'general medical consultation';
    const hpi = patient.structured_history?.hpi || {};

    const onset = extracted.onset || hpi.onset;
    const character = extracted.character || hpi.character;
    const site = extracted.site || hpi.site;
    const severity = extracted.severity || hpi.severity;

    const intro = age && gender
      ? `${age}-year-old ${String(gender).toLowerCase()} presenting with ${String(complaint).toLowerCase()}.`
      : `Patient presenting with ${complaint}.`;

    const details = [];
    if (site && !site.includes('Not')) details.push(`localized to ${site.toLowerCase()}`);
    if (onset && !onset.includes('Not')) details.push(`starting ${onset.toLowerCase()}`);
    if (character && !character.includes('Not') && character.toLowerCase() !== complaint.toLowerCase()) {
      details.push(`described as ${character.toLowerCase()}`);
    }
    if (severity && !severity.includes('Not')) details.push(`severity rated ${severity.toLowerCase()}`);

    const body = details.length > 0 ? ` Symptom details: ${details.join(', ')}.` : '';

    let alertPart = ' No acute emergency red-flags identified during pre-consultation intake.';
    if (redFlags && redFlags.length > 0) {
      alertPart = ` Clinical Alert: Flagged for physician review regarding ${redFlags.join('; ')}.`;
    } else if (patient.red_flag?.detected) {
      alertPart = ` Clinical Alert: ${patient.red_flag.title}.`;
    }

    return `${intro}${body}${alertPart}`;
  },

  /**
   * Doctor verification action
   */
  async verifyPatient(id, status, notes = '', doctorId = 'Dr. S. K. Mehta') {
    const targetId = id || this.getCurrentPatientId();
    try {
      const res = await fetch(`${API_BASE_URL}/${targetId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes, doctor_id: doctorId })
      });
      if (res.ok) {
        const result = await res.json();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('caseflow-queue-updated'));
        }
        return result;
      }
    } catch (err) {
      console.warn('Backend verify failed, using client fallback:', err.message);
    }
    if (clientFallbackPatients[targetId]) {
      clientFallbackPatients[targetId].verification_status = status;
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('caseflow-queue-updated'));
      }
      return clientFallbackPatients[targetId];
    }
    return null;
  }
};
