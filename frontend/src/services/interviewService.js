/**
 * CaseFlow Adaptive Interview Service
 * SIH26047 — AI-Powered Patient Case-Taking System
 *
 * Communicates with the FastAPI backend (/api/v1/interviews) with a robust
 * client-side fallback state machine implementing the SOCRATES decision tree.
 */

import { QUESTION_ONTOLOGY, getInitialExtractedHistory, classifySymptomIntent } from '../data/adaptiveQuestionOntology.js';
import { patientService } from './patientService.js';

const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL)
  ? `${import.meta.env.VITE_API_BASE_URL}/interviews`
  : 'http://127.0.0.1:8000/api/v1/interviews';

export function canonicalLanguage(lang) {
  if (!lang || typeof lang !== 'string') return 'en';
  const cleaned = lang.trim().toLowerCase();
  if (['hi', 'hindi', 'हिंदी', 'hin'].includes(cleaned)) return 'hi';
  if (['en', 'english', 'en-us', 'en-in'].includes(cleaned)) return 'en';
  return 'en';
}

export const COMPLETION_MESSAGES = {
  en: {
    title: 'All Questions Completed',
    subtitle: 'Thank you. Your initial assessment is complete. Please inspect your summary before continuing.'
  },
  hi: {
    title: 'सभी प्रश्न पूरे हो चुके हैं',
    subtitle: 'धन्यवाद। आपका प्रारंभिक मूल्यांकन पूरा हो गया है। जारी रखने से पहले कृपया अपना विवरण देखें।'
  }
};

// In-memory client fallback session
let clientFallbackSession = null;

function initClientFallback(patientId = null, language = 'en', chiefComplaint = null) {
  const targetPatientId = patientId || patientService.getCurrentPatientId() || 'CF-2026-005';
  const canonicalLang = canonicalLanguage(language);

  let cleanedCC = chiefComplaint && String(chiefComplaint).trim() ? String(chiefComplaint).trim() : null;

  let initialQId = 'root_complaint';
  if (cleanedCC) {
    initialQId = classifySymptomIntent(cleanedCC);
    if (initialQId === 'root_complaint') {
      initialQId = 'generic_onset';
    }
  }

  clientFallbackSession = {
    session_id: 'client-' + Math.random().toString(36).substring(2, 9),
    patient_id: targetPatientId,
    language: canonicalLang,
    chief_complaint: cleanedCC || null,
    current_question_id: initialQId,
    question_stack: [initialQId],
    history: [],
    extracted_history: getInitialExtractedHistory(),
    red_flags: [],
    completed: false
  };
  return formatClientState();
}

function formatClientState() {
  if (!clientFallbackSession) return null;
  const currentQId = clientFallbackSession.current_question_id;
  const currentQ = currentQId ? QUESTION_ONTOLOGY[currentQId] : null;
  const isCompleted = clientFallbackSession.completed;
  const lang = canonicalLanguage(clientFallbackSession.language);
  const completionMsg = isCompleted ? (COMPLETION_MESSAGES[lang] || COMPLETION_MESSAGES.en) : null;

  return {
    session_id: clientFallbackSession.session_id,
    patient_id: clientFallbackSession.patient_id,
    language: lang,
    chief_complaint: clientFallbackSession.chief_complaint,
    current_step: clientFallbackSession.history.length + 1,
    total_estimated_steps: 7,
    completed: isCompleted,
    current_question: currentQ,
    history: clientFallbackSession.history,
    extracted_history: clientFallbackSession.extracted_history,
    red_flags: clientFallbackSession.red_flags,
    completion_message: completionMsg
  };
}

function clientSubmitAnswer(answerText, inputMode = 'touch') {
  if (!clientFallbackSession) initClientFallback();
  const session = clientFallbackSession;
  const currentQId = session.current_question_id;
  const qNode = QUESTION_ONTOLOGY[currentQId] || QUESTION_ONTOLOGY.root_complaint;

  // Extract clinical field
  if (qNode.id === 'root_complaint') {
    const match = (qNode.quick_options || []).find(
      (opt) =>
        opt.value.toLowerCase() === answerText.toLowerCase() ||
        opt.label.toLowerCase() === answerText.toLowerCase() ||
        (opt.complaint && answerText.toLowerCase() === opt.complaint.toLowerCase())
    );
    session.chief_complaint = match ? match.complaint : answerText.trim();
  }

  if (qNode.field_key) {
    session.extracted_history[qNode.field_key] = answerText;
  }

  // Red-flag detection
  const lowerAnswer = answerText.toLowerCase();
  if (
    lowerAnswer.includes('blood') ||
    lowerAnswer.includes('bleed') ||
    lowerAnswer.includes('black stool') ||
    lowerAnswer.includes('melena') ||
    lowerAnswer.includes('खून') ||
    lowerAnswer.includes('hematemesis')
  ) {
    const flag = 'Potential bleeding / hemorrhage symptom reported';
    if (!session.red_flags.includes(flag)) {
      session.red_flags.push(flag);
    }
  }
  if (
    (lowerAnswer.includes('dizziness') || lowerAnswer.includes('faint') || lowerAnswer.includes('presyncope') || lowerAnswer.includes('चक्कर')) &&
    (session.chief_complaint || '').toLowerCase().includes('bleed')
  ) {
    const flag = 'Dizziness or presyncope associated with bleeding (Risk of hemodynamic instability)';
    if (!session.red_flags.includes(flag)) {
      session.red_flags.push(flag);
    }
  }
  if (lowerAnswer.includes('extreme (10/10)') || lowerAnswer.includes('thunderclap')) {
    const flag = 'Acute high-severity onset reported (10/10)';
    if (!session.red_flags.includes(flag)) {
      session.red_flags.push(flag);
    }
  }

  // History turn
  session.history.push({
    question_id: currentQId,
    question_text: qNode.question,
    hindi_question: qNode.hindi_question,
    answer_text: answerText,
    input_mode: inputMode,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });

  // Branching resolution
  let nextQId = null;
  if (qNode.branch_map) {
    for (const [key, targetId] of Object.entries(qNode.branch_map)) {
      if (answerText.toLowerCase().includes(key.toLowerCase())) {
        nextQId = targetId;
        break;
      }
    }
  }

  if (!nextQId) {
    if (qNode.id === 'root_complaint') {
      nextQId = classifySymptomIntent(answerText);
    } else {
      nextQId = qNode.next_question;
    }
  }

  if (!nextQId || qNode.is_terminal) {
    session.completed = true;
    session.current_question_id = null;
  } else {
    session.current_question_id = nextQId;
    session.question_stack.push(nextQId);
  }

  // Synchronize extracted clinical information to patient record
  patientService.syncInterviewData(session.patient_id, {
    chiefComplaint: session.chief_complaint,
    extractedHistory: session.extracted_history,
    redFlags: session.red_flags,
    sessionCompleted: session.completed
  });

  return formatClientState();
}

function clientStepBack() {
  if (!clientFallbackSession || clientFallbackSession.question_stack.length <= 1) {
    return formatClientState();
  }
  const session = clientFallbackSession;
  session.question_stack.pop();
  const prevQId = session.question_stack[session.question_stack.length - 1];
  session.current_question_id = prevQId;
  session.completed = false;

  if (session.history.length > 0) {
    const popped = session.history.pop();
    if (popped.question_id === 'root_complaint') {
      session.chief_complaint = null;
    }
  }

  // Synchronize step-back to patient record
  patientService.syncInterviewData(session.patient_id, {
    chiefComplaint: session.chief_complaint,
    extractedHistory: session.extracted_history,
    redFlags: session.red_flags,
    sessionCompleted: false
  });

  return formatClientState();
}

export const interviewService = {
  /**
   * Start a new adaptive interview session bound to patientId
   */
  async startSession(patientId = null, language = 'en', chiefComplaint = null) {
    const targetPatientId = patientId || patientService.getCurrentPatientId() || 'CF-2026-005';
    const canonicalLang = canonicalLanguage(language);
    try {
      const response = await fetch(`${API_BASE_URL}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: targetPatientId,
          language: canonicalLang,
          chief_complaint: chiefComplaint || undefined
        })
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.warn('Backend interview API unavailable, using client fallback engine:', err.message);
    }
    return initClientFallback(targetPatientId, language, chiefComplaint);
  },

  /**
   * Submit an answer for the current question
   */
  async submitAnswer(sessionId, answerText, inputMode = 'touch') {
    if (sessionId && !sessionId.startsWith('client-')) {
      try {
        const response = await fetch(`${API_BASE_URL}/${sessionId}/respond`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answer_text: answerText, input_mode: inputMode })
        });
        if (response.ok) {
          const res = await response.json();
          // Sync to patient record on client
          if (res.patient_id) {
            patientService.syncInterviewData(res.patient_id, {
              chiefComplaint: res.chief_complaint,
              extractedHistory: res.extracted_history,
              redFlags: res.red_flags,
              sessionCompleted: res.completed
            });
          }
          return res;
        }
      } catch (err) {
        console.warn('Backend interview respond error, continuing with fallback:', err.message);
      }
    }
    return clientSubmitAnswer(answerText, inputMode);
  },

  /**
   * Step back to the previous question
   */
  async stepBack(sessionId) {
    if (sessionId && !sessionId.startsWith('client-')) {
      try {
        const response = await fetch(`${API_BASE_URL}/${sessionId}/back`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        if (response.ok) {
          return await response.json();
        }
      } catch (err) {
        console.warn('Backend interview back error, continuing with fallback:', err.message);
      }
    }
    return clientStepBack();
  },

  /**
   * Mark session as complete
   */
  async completeSession(sessionId) {
    if (sessionId && !sessionId.startsWith('client-')) {
      try {
        const response = await fetch(`${API_BASE_URL}/${sessionId}/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        if (response.ok) {
          const res = await response.json();
          if (res.patient_id) {
            patientService.syncInterviewData(res.patient_id, {
              chiefComplaint: res.chief_complaint,
              extractedHistory: res.extracted_history,
              redFlags: res.red_flags,
              sessionCompleted: true
            });
          }
          return res;
        }
      } catch (err) {
        console.warn('Backend interview complete error:', err.message);
      }
    }
    if (clientFallbackSession) {
      clientFallbackSession.completed = true;
      patientService.syncInterviewData(clientFallbackSession.patient_id, {
        chiefComplaint: clientFallbackSession.chief_complaint,
        extractedHistory: clientFallbackSession.extracted_history,
        redFlags: clientFallbackSession.red_flags,
        sessionCompleted: true
      });
      return formatClientState();
    }
    return null;
  }
};
