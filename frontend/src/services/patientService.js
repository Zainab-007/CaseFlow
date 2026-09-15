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
      title: 'Exertional Breathlessness in Hypertensive Patient (NYHA II/III)',
      rule_trigger: 'Rule #C12: Dyspnea on exertion + Known Cardiac/HTN History',
      nlp_trigger: 'NLP pattern: Patient mentions difficulty sleeping flat without 2 pillows',
      physician_action: 'Immediate clinical chest auscultation and 12-lead ECG advised before OPD sign-off'
    },
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
      title: 'Suspected Acute Coronary Syndrome / High-Risk Chest Pain',
      rule_trigger: 'Rule #CARD01: Retrosternal pressure + Radiation + Diaphoresis',
      nlp_trigger: 'Patient describes heavy crushing retrosternal weight with sweating',
      physician_action: 'STAT 12-lead ECG within 10 minutes, sublingual nitrate, emergency room transfer'
    },
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

const DEMO_PATIENT_IDS = ['CF-2026-001', 'CF-2026-002', 'CF-2026-003', 'CF-2026-004'];

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
    }
  },

  /**
   * Canonical queue statistics calculator
   * Guarantees 100% agreement between header counters, metric cards, and patient table.
   */
  computeQueueStats(queue = []) {
    const list = Array.isArray(queue) ? queue : [];
    return {
      total: list.length,
      redFlags: list.filter((p) => Boolean(p.red_flag_detected)).length,
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

    return Object.values(clientFallbackPatients).map((p) => ({
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
      red_flag_detected: p.red_flag_detected,
      red_flag_note: p.red_flag_note,
      language: p.language,
      arrived_at: p.arrived_at,
      verification_status: p.verification_status
    }));
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
        return await res.json();
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
    if (this.isDemoPatient(targetId)) {
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
        return await res.json();
      }
    } catch (err) {
      console.warn(`Backend patient update for ${targetId} failed, using client fallback:`, err.message);
    }

    // Client fallback update
    const p = clientFallbackPatients[targetId];
    if (p) {
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
      if (updateData.chief_complaint) {
        p.chief_complaint = updateData.chief_complaint;
        if (p.structured_history?.hpi) p.structured_history.hpi.character = updateData.chief_complaint;
        p.ai_clinical_summary = this.generateClientClinicalSummary(p);
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('caseflow-queue-updated'));
      }
      return p;
    }
    return null;
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
        allergies: [],
        family_history: [],
        personal_social: {},
        review_of_systems: {}
      },
      timeline: [
        {
          date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          title: 'CaseFlow Kiosk Registration',
          category: 'Intake',
          description: `Patient registered at kiosk. Reason: ${patientData.chief_complaint || 'Routine intake'}`,
          source: 'patient-reported'
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
  async syncInterviewData(patientId, { chiefComplaint, extractedHistory = {}, redFlags = [], sessionCompleted = false }) {
    if (!patientId) return null;

    // 1. Synchronize to backend if accessible
    try {
      const updatePayload = {};
      if (chiefComplaint) updatePayload.chief_complaint = chiefComplaint;
      if (sessionCompleted) updatePayload.intake_status = 'Completed';

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
        language: 'Hindi',
        arrived_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        verification_status: 'Pending Review',
        demographics: {
          name: 'Patient',
          age: 30,
          gender: 'Other'
        },
        triage: { priority: 'Routine', vitals_summary: 'Pending triage' },
        structured_history: { hpi: {}, past_medical_history: [], current_medications: [], allergies: [] },
        timeline: [],
        documents: []
      };
      clientFallbackPatients[patientId] = p;
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
