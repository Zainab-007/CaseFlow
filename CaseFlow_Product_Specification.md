# CaseFlow — Product Specification (v3)
### SIH26047 — AI-Powered Patient Case-Taking Software

---

## 1. Product Overview

CaseFlow is an AI-powered pre-consultation clinical intake system that reduces the time doctors spend collecting patient history in high-volume Indian hospitals.

The system interacts with patients through voice, text, or touch, dynamically asks relevant follow-up questions, digitizes previous medical documents via OCR, and converts everything into a structured, doctor-ready clinical summary — pushed toward the hospital's system and the ABDM ecosystem before the consultation begins.

The system is a clinical documentation and decision-support tool, not an autonomous diagnostic system. The doctor retains final authority over the record.

---

## 2. Problem Being Solved

- OPD consultation time in Indian government/tertiary hospitals is frequently 2–5 minutes per patient.
- History-taking consumes a disproportionate share of that time.
- Compounding factors: multilingual/multi-accent patients, elderly and low-literacy populations, paper-based and handwritten prior records, fragmented documentation, repeated re-collection of the same history across visits.
- AYUSH OPDs face an added burden: Trividha/Ashtavidha/Dashavidha Pariksha requires a far more extensive intake than allopathic history-taking.

CaseFlow moves history-taking before the consultation, and digitizes prior records at the point of entry.

---

## 3. Target Users

**Primary — Patient**: elderly, low-literacy, multilingual, first-visit, or record-carrying patients, using a **shared kiosk device with zero training**.

**Primary — Doctor**: receives a structured, editable summary instead of starting from zero.

**Secondary — Hospital staff**: manage intake, queues, and records; receive red-flag priority alerts.

---

## 4. Core Product Flow

```
PATIENT
   ↓
Registration
   ↓
Consent (DPDP Act 2023 + ABDM consent framework, ABHA ID login)
   ↓
Language Selection
   ↓
Voice / Touch / Text
   ↓
Language Processing (STT → Language Adapter → NLP → TTS)
   ↓
Dynamic Questioning Engine
   ↓
Clinical Information
   ↓
   ┌────────────┴────────────┐
   ↓                         ↓
Conversation              Documents
   ↓                         ↓
Clinical NLP                OCR
   └────────────┬────────────┘
                ↓
        Patient Timeline
                ↓
        Structured History
                ↓
         Red-Flag Layer (rules + LLM, hybrid, OR logic)
                ↓
        Doctor Dashboard
                ↓
       Doctor Verification
         ↙            ↘
  Edit / Accept   Reject / Correct
         └──────┬──────┘
                ↓
        Final Patient Record
                ↓
   FHIR push → Hospital HIS / ABHA PHR
```

---

## 5. Major Product Modules

### Module 1 — Patient Registration
Patient ID, name, age, gender, preferred language, contact info (if required), existing patient ID lookup. Kiosk-appropriate: large buttons, simple language, minimal typing.

### Module 2 — Consent & Privacy (core, not optional)
- Explain why information is being collected, with audio explanation for low-literacy patients.
- ABHA ID authentication (mocked for prototype).
- Explicit, granular, revocable consent — compliant with the **Digital Personal Data Protection Act 2023** and the **ABDM consent framework**.
- Clearly indicate AI assists with documentation, not diagnosis.
- Patient can withdraw/stop the interview at any point.
- **Hard session reset** after submission or on idle timeout — required because this is a shared public device, not a personal one.

### Module 3 — Multimodal Patient Interaction
Voice, text, touch (severity scales, yes/no, multiple choice, language selection). Never force a patient to type medical information.

### Module 4 — Language Processing (with Language Adapter)
```
Patient Speech
      ↓
Speech-to-Text
      ↓
Language Adapter
   ├── Hindi
   ├── English
   └── [Future Indian languages]
      ↓
Translation / Normalization → canonical internal representation
      ↓
Clinical NLP
      ↓
Structured Information
```
- **Prototype approach:** translate-to-canonical-English then run one NLP pipeline. Documented tradeoff: faster to build, but idiom/severity phrasing can lose nuance in translation — v2 could run native clinical NLP per language instead.
- Original patient response is preserved alongside the processed version so the doctor can verify what was actually said.
- Demo scope: Hindi/Hinglish + English, built end-to-end and polished. Architecture is adapter-based so additional Indian languages are a plug-in, not a rebuild.

### Module 5 — Dynamic Questioning Engine (core differentiator)
`Patient answer → understand → identify missing info → select next relevant question → repeat`
No fixed questionnaire. SOCRATES-style branching driven by chief complaint and prior answers.

### Module 6 — Clinical NLP
Converts free-form narration into structured fields (chief complaint, duration, location, severity, associated symptoms). Tags each field's source: patient-reported / document-extracted / AI-inferred.

### Module 7 — Medical Document OCR
`Image/PDF → OCR → text extraction → clinical entity extraction → patient timeline`
Extracts test names, values, dates, medicines, doctor notes, prior diagnoses. Handles handwritten and printed, multilingual documents.

### Module 8 — Patient Timeline
Chronological organization of all documents and the current interview into one coherent history.

### Module 9 — Structured Patient History
Standard clinical format: chief complaint → HPI → past medical/surgical → medications → allergies → family/personal history → ROS → prior investigations → source tagging.

### Module 10 — Red-Flag Layer (hybrid: rules + LLM)
```
Patient Response
      ↓
Rule-based safety checks  +  LLM structured extraction
      ↓
Red Flag Engine (OR logic — either layer can raise a flag)
      ↓
⚠️ Physician review recommended
```
- Rule layer: short, hardcoded, human-authored list (e.g. chest pain + breathlessness, sudden severe headache, stroke-pattern symptoms). Deterministic and auditable.
- LLM layer: catches natural-language patterns rules would miss.
- **OR logic only** — the LLM can never suppress a rule-based flag; the rule layer is never the sole gate. Bias toward over-flagging: a false positive costs a doctor a glance, a false negative costs a missed symptom.
- **Never states a diagnosis.** Always "potential red-flag information detected, physician review recommended," never a named condition.

### Module 11 — Doctor Dashboard
Single view: demographics, chief complaint, structured history, timeline, documents, red flags, AI summary, verification controls — **Verify / Edit / Reject**. Doctor has final authority.

### Module 12 — AI Summary
A few-sentence, doctor-readable brief generated from the full structured history.

### Module 13 — AYUSH Mode (configurable)
Optional consultation-type toggle enabling Trividha, Ashtavidha, or Dashavidha Pariksha history capture. Selected per consultation type, not hardcoded into every interview.

### Module 14 — ABDM / FHIR Integration
Pushes the doctor-verified record to the hospital HIS and the patient's ABHA Personal Health Record via FHIR APIs. Mocked for the prototype (show the JSON payload shape + a "pushed to ABHA PHR" confirmation screen), but stays visible in architecture and demo — the original PS treats this as a core module, not a stretch goal.

---

## 6. Kiosk-First UI Requirements

This is a shared, walk-up, zero-training device — not a personal smartphone app or a SaaS dashboard. The interface must reflect that:

- **Voice-first, large-button, icon-driven.** One decision per screen — no multi-field forms.
- **Audio narration on by default**, not opt-in — each screen is spoken aloud unless muted.
- **Touch targets sized generously** for elderly users or limited dexterity.
- **No reliance on browser back/forward.** Always-visible "start over" control and a linear progress indicator instead.
- **Hard session reset** after submission or idle timeout — required both for the next patient's privacy and DPDP compliance.
- **Tone:** calm, simple, reassuring language. Example opening: *"Namaste. Let's prepare your information for the doctor."*

---

## 7. Accessibility Principles
Large buttons and text, simple language, minimal typing, voice-first interaction, visual icons, clear progress indicator, Hindi + English at launch, architecture ready for additional Indian languages.

---

## 8. Technical Stack

| Layer | Choice | Responsibility |
|---|---|---|
| Frontend | React + Tailwind CSS | Kiosk patient interface, interview UI, document upload, doctor dashboard |
| Backend | Python + FastAPI | Patient records, interview sessions, AI orchestration, OCR processing, timeline generation, doctor verification |
| Database | SQLite (prototype) → PostgreSQL later | Patients, interviews, responses, extracted data, documents, timeline events, verification status |
| AI layer | Modular service (swappable provider) | Language processing, clinical NLP, dynamic questioning, summarization |
| OCR | Modular OCR service (swappable engine) | Document digitization |

---

## 9. Build Order

1. Adaptive interview engine (text input first, defines the data contract)
1. Voice (STT/TTS layered on top — text input remains a fallback if voice is unreliable on demo day)
1. OCR + extraction
1. Timeline
1. Structured summary
1. Red-flag layer (hybrid)
1. Doctor dashboard
1. Consent + ABHA/ABDM mock (screen order ≠ build order — this is shown first to the patient even though built later)
1. AYUSH mode
1. Demo polish

**Before step 1:** define one shared JSON data contract (field names, source tags) used by the questioning engine, OCR, and NLP modules, so integrating them into the dashboard later is wiring, not a rewrite.

---

## 10. Prototype Scope Boundaries

**🔴 Must work:** registration, consent (mocked ABHA), AI interview, dynamic questioning, clinical extraction, structured history, doctor dashboard, doctor verification.

**🟡 Second priority:** OCR, patient timeline, red-flag layer.

**🟢 Present in demo, can be simplified/mocked:** voice, Hindi+English only, AYUSH mode (3–4 parameters), FHIR/ABHA push confirmation screen.

**⚪ Out of scope:** real ABDM sandbox integration, production multilingual ASR beyond the demo pair, full 10-parameter Dashavidha Pariksha, real hospital HIS integration, offline functionality.

---

## 11. Product USP

**Not building:** a medical chatbot, an AI doctor, a diagnosis app, or a simple online form.

**Building:** an AI-powered pre-consultation clinical intake system that listens to the patient, intelligently collects their history, organizes prior records, and gives the doctor a verified, structured patient brief — designed for the shared-device, first-visit, zero-training patient, not the smartphone user.