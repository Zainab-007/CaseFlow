import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import VoiceIndicator from '../../components/patient/VoiceIndicator';
import LiveExtractedPanel from '../../components/patient/LiveExtractedPanel';
import InterviewSummaryModal from '../../components/patient/InterviewSummaryModal';
import { interviewService } from '../../services/interviewService';
import { patientService } from '../../services/patientService';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  GitBranch,
  Volume2
} from 'lucide-react';

export default function InterviewPage() {
  const navigate = useNavigate();

  // Session state
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState(null);
  const [lastUpdatedField, setLastUpdatedField] = useState(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  // Initialize interview on mount with isolated patient_id
  useEffect(() => {
    let isMounted = true;
    async function initInterview() {
      try {
        let patientId = patientService.getCurrentPatientId();
        let patientRecord = null;
        // If no patientId or if pointing to demo patient, provision an isolated patient
        if (!patientId || patientService.isDemoPatient(patientId)) {
          const newPat = await patientService.registerPatient({
            name: 'New Patient',
            age: 30,
            gender: 'Female',
            chief_complaint: 'Routine medical intake'
          });
          patientId = newPat.id;
          patientService.setCurrentPatientId(patientId);
          patientRecord = newPat;
        } else {
          patientRecord = await patientService.getPatient(patientId);
        }

        const registeredComplaint = patientRecord?.chief_complaint;
        const initialSession = await interviewService.startSession(patientId, 'hi', registeredComplaint);
        if (isMounted) {
          setSession(initialSession);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to start interview session:', err);
        setLoading(false);
      }
    }
    initInterview();
    return () => {
      isMounted = false;
    };
  }, []);

  // Current question data
  const currentQuestion = session?.current_question;
  const isTerminal = currentQuestion?.is_terminal || session?.completed;

  // Unified answer processing pipeline: touch and voice take the EXACT SAME path
  const submitInterviewResponse = async (answerText, inputMode = 'touch', option = null) => {
    if (!answerText) return;

    if (option) {
      setSelectedOption(option.value || option.label);
    }

    const fieldKey =
      currentQuestion?.field_key ||
      (currentQuestion?.id === 'root_complaint' ? 'chiefComplaint' : null);

    if (fieldKey) {
      setLastUpdatedField(fieldKey);
    }

    // Immediately update local clinical notes before network request resolves
    setSession((prev) => {
      if (!prev) return prev;
      const updatedExtracted = { ...(prev.extracted_history || {}) };
      let updatedCC = prev.chief_complaint;

      if (currentQuestion?.id === 'root_complaint') {
        updatedCC = option?.complaint || option?.value || option?.label || answerText.trim();
      } else if (currentQuestion?.field_key) {
        updatedExtracted[currentQuestion.field_key] = option?.value || option?.label || answerText.trim();
      }

      return {
        ...prev,
        chief_complaint: updatedCC,
        extracted_history: updatedExtracted
      };
    });

    try {
      const updatedSession = await interviewService.submitAnswer(
        session?.session_id,
        answerText,
        inputMode
      );
      setSelectedOption(null);
      setSession(updatedSession);

      if (session?.patient_id) {
        await patientService.syncInterviewData(session.patient_id, {
          chiefComplaint: updatedSession.chief_complaint,
          extractedHistory: updatedSession.extracted_history,
          redFlags: updatedSession.red_flags,
          sessionCompleted: updatedSession.completed
        });
      }

      if (updatedSession.completed) {
        setShowSummaryModal(true);
      }
    } catch (err) {
      console.error('Error submitting interview answer:', err);
    }
  };

  const handleSelectOption = (option) => {
    submitInterviewResponse(option.label, 'touch', option);
  };

  const handleVoiceTranscript = (transcript) => {
    submitInterviewResponse(transcript, 'voice', null);
  };

  // Step back / undo last question
  const handleStepBack = async () => {
    if (!session) return;
    if (session.history.length === 0) {
      navigate('/patient/language');
      return;
    }

    try {
      const updatedSession = await interviewService.stepBack(session.session_id);
      setSelectedOption(null);
      setLastUpdatedField(null);
      setSession(updatedSession);
      setShowSummaryModal(false);
    } catch (err) {
      console.error('Error stepping back:', err);
    }
  };

  // Optional voice playback for question (accessibility for low-literacy patients)
  const handleSpeakQuestion = () => {
    if ('speechSynthesis' in window && currentQuestion) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(
        `${currentQuestion.hindi_question || ''}. ${currentQuestion.question}`
      );
      utterance.lang = 'hi-IN';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Advance on Next Button
  const handleNextClick = () => {
    if (isTerminal || session?.completed) {
      setShowSummaryModal(true);
    } else if (selectedOption) {
      const opt = currentQuestion?.quick_options?.find(
        (o) => o.value === selectedOption || o.label === selectedOption
      );
      if (opt) handleSelectOption(opt);
    }
  };

  if (loading || !session) {
    return (
      <div className="flex-1 flex items-center justify-center py-24">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-teal-700 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-600">
            Initializing Clinical Intake...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col w-full py-2">
      {/* Spacious 2-Column Layout: Main Question (70-75%) + Compact Notes (25-30%) */}
      <div className="flex flex-col lg:flex-row gap-8 items-start w-full">
        {/* ======================================================== */}
        {/* MAIN QUESTION AREA (70-75%)                              */}
        {/* ======================================================== */}
        <div className="w-full lg:w-[72%] space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-10 border-2 border-slate-200 shadow-sm space-y-6">
            {/* Step Hierarchy: Small question counter */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-teal-800 bg-teal-50 px-3 py-1 rounded-md border border-teal-200">
                  Question {session.current_step} of ~{session.total_estimated_steps}
                </span>

                {currentQuestion?.branch_badge && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-purple-800 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-200">
                    <GitBranch className="w-3.5 h-3.5" />
                    {currentQuestion.branch_badge}
                  </span>
                )}
              </div>

              {currentQuestion && (
                <button
                  type="button"
                  onClick={handleSpeakQuestion}
                  title="Listen to question (प्रश्न सुनें)"
                  className="flex items-center gap-1.5 text-xs font-bold text-teal-800 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-xl border border-teal-200 transition cursor-pointer"
                >
                  <Volume2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Listen (सुनें)</span>
                </button>
              )}
            </div>

            {/* Active Question Prompt */}
            {currentQuestion ? (
              <div className="space-y-1.5">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-snug">
                  {currentQuestion.question}
                </h1>
                <p className="text-lg sm:text-xl font-bold text-teal-800">
                  {currentQuestion.hindi_question}
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle2 className="w-14 h-14 text-emerald-600 mx-auto mb-3" />
                <h2 className="text-2xl font-black text-slate-900">
                  All Questions Completed
                </h2>
                <p className="text-sm font-semibold text-slate-600 mt-1">
                  Click Review Case to inspect your summary before continuing.
                </p>
              </div>
            )}

            {/* Answer Cards: Clean 2-Column Grid with Large Touch Targets */}
            {currentQuestion?.quick_options && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {currentQuestion.quick_options.map((opt, idx) => {
                  const isSelected = selectedOption === (opt.value || opt.label);

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectOption(opt)}
                      className={`p-5 sm:p-6 rounded-2xl border-2 text-left transition-all duration-150 active:scale-[0.99] flex items-center justify-between cursor-pointer select-none ${
                        isSelected
                          ? 'border-teal-700 bg-teal-50/80 text-teal-950 ring-4 ring-teal-700/20 shadow-md'
                          : opt.is_red_flag
                          ? 'border-rose-200 bg-rose-50/40 hover:border-rose-300 hover:bg-rose-50/80 text-slate-900'
                          : 'border-slate-200 bg-white hover:border-teal-500 hover:bg-slate-50/70 text-slate-900 shadow-2xs'
                      }`}
                    >
                      <div className="space-y-1 pr-3">
                        <span className="block text-base sm:text-lg font-bold leading-tight">
                          {opt.label}
                        </span>
                        {opt.hindi && (
                          <span className="block text-xs sm:text-sm font-semibold text-teal-800">
                            {opt.hindi}
                          </span>
                        )}
                      </div>

                      <div
                        className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition ${
                          isSelected
                            ? 'border-teal-700 bg-teal-700 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Minimal Patient-Friendly Voice Control */}
            <div className="pt-2 border-t border-slate-100">
              <VoiceIndicator
                currentQuestionId={currentQuestion?.id}
                language={session?.language || 'hi'}
                onTranscriptReceived={handleVoiceTranscript}
              />
            </div>
          </div>

          {/* Navigation Bar: Previous / Undo and Next Question */}
          <div className="flex items-center justify-between gap-4 pt-1">
            <Button
              variant="outline"
              size="lg"
              icon={ArrowLeft}
              onClick={handleStepBack}
              className="px-6"
            >
              Previous (पिछला)
            </Button>

            <Button
              variant="kiosk"
              size="lg"
              icon={ArrowRight}
              iconPosition="right"
              onClick={handleNextClick}
              className="min-w-[210px] px-8"
            >
              {isTerminal || session.completed
                ? 'Review Case (समीक्षा करें)'
                : 'Next Question (अगला)'}
            </Button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* CLINICAL NOTES SIDEBAR (25-30%)                          */}
        {/* ======================================================== */}
        <div className="w-full lg:w-[28%] shrink-0">
          <LiveExtractedPanel
            chiefComplaint={session.chief_complaint}
            extractedHistory={session.extracted_history}
            redFlags={session.red_flags}
            lastUpdatedField={lastUpdatedField}
          />
        </div>
      </div>

      {/* Review Modal on Complete */}
      <InterviewSummaryModal
        isOpen={showSummaryModal}
        chiefComplaint={session.chief_complaint}
        extractedHistory={session.extracted_history}
        redFlags={session.red_flags}
        onConfirm={async () => {
          if (session?.session_id) {
            await interviewService.completeSession(session.session_id);
          }
          if (session?.patient_id) {
            await patientService.syncInterviewData(session.patient_id, {
              chiefComplaint: session.chief_complaint,
              extractedHistory: session.extracted_history,
              redFlags: session.red_flags,
              sessionCompleted: true
            });
          }
          setShowSummaryModal(false);
          navigate('/patient/documents');
        }}
        onEdit={() => {
          setShowSummaryModal(false);
        }}
      />
    </div>
  );
}
