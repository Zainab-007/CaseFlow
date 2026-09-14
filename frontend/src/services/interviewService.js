/**
 * CaseFlow Adaptive Interview Service
 * SIH26047 — AI-Powered Patient Case-Taking System
 *
 * Communicates with the FastAPI backend (/api/v1/interviews) with a robust
 * client-side fallback state machine implementing the SOCRATES decision tree.
 */

import { QUESTION_ONTOLOGY, getInitialExtractedHistory } from '../data/adaptiveQuestionOntology';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1/interviews';

// In-memory client fallback session
let clientFallbackSession = null;

function initClientFallback(patientId = 'CF-PAT-01', language = 'hi') {
  clientFallbackSession = {
    session_id: 'client-' + Math.random().toString(36).substring(2, 9),
    patient_id: patientId,
    language: language,
    chief_complaint: null,
    current_question_id: 'root_complaint',
    question_stack: ['root_complaint'],
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

  return {
    session_id: clientFallbackSession.session_id,
    patient_id: clientFallbackSession.patient_id,
    language: clientFallbackSession.language,
    chief_complaint: clientFallbackSession.chief_complaint,
    current_step: clientFallbackSession.history.length + 1,
    total_estimated_steps: 7,
    completed: clientFallbackSession.completed,
    current_question: currentQ,
    history: clientFallbackSession.history,
    extracted_history: clientFallbackSession.extracted_history,
    red_flags: clientFallbackSession.red_flags
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
      opt => opt.value.toLowerCase() === answerText.toLowerCase() ||
             opt.label.toLowerCase() === answerText.toLowerCase() ||
             answerText.toLowerCase().includes(opt.value.toLowerCase())
    );
    session.chief_complaint = match ? match.complaint : answerText;
  }

  if (qNode.field_key) {
    session.extracted_history[qNode.field_key] = answerText;
  }

  // Red-flag detection
  const lowerAnswer = answerText.toLowerCase();
  if (
    lowerAnswer.includes('blood') ||
    lowerAnswer.includes('black stool') ||
    lowerAnswer.includes('melena') ||
    lowerAnswer.includes('खून') ||
    lowerAnswer.includes('hematemesis')
  ) {
    const flag = 'Potential gastrointestinal bleeding symptom reported';
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
      nextQId = qNode.default_next || 'abdo_site';
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

  return formatClientState();
}

export const interviewService = {
  /**
   * Start a new adaptive interview session
   */
  async startSession(patientId = 'CF-PAT-01', language = 'hi') {
    try {
      const response = await fetch(`${API_BASE_URL}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient_id: patientId, language })
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.warn('Backend interview API unavailable, using client fallback engine:', err.message);
    }
    return initClientFallback(patientId, language);
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
          return await response.json();
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
          return await response.json();
        }
      } catch (err) {
        console.warn('Backend interview complete error:', err.message);
      }
    }
    if (clientFallbackSession) {
      clientFallbackSession.completed = true;
      return formatClientState();
    }
    return null;
  }
};
