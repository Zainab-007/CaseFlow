import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import AudioPromptBar from '../../components/patient/AudioPromptBar';
import VoiceIndicator from '../../components/patient/VoiceIndicator';
import LiveExtractedPanel from '../../components/patient/LiveExtractedPanel';
import ConversationHistory from '../../components/patient/ConversationHistory';
import InterviewSummaryModal from '../../components/patient/InterviewSummaryModal';
import { interviewService } from '../../services/interviewService';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  GitBranch,
  RotateCcw,
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

  // Initialize interview on mount
  useEffect(() => {
    let isMounted = true;
    async function initInterview() {
      try {
        const initialSession = await interviewService.startSession('CF-PAT-01', 'hi');
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

  // Handle option selection
  const handleSelectOption = async (option) => {
    setSelectedOption(option.value || option.label);
    const answerText = option.label;

    if (currentQuestion?.field_key) {
      setLastUpdatedField(currentQuestion.field_key);
    } else if (currentQuestion?.id === 'root_complaint') {
      setLastUpdatedField('chiefComplaint');
    }

    try {
      const updatedSession = await interviewService.submitAnswer(
        session?.session_id,
        answerText,
        'touch'
      );
      setSelectedOption(null);
      setSession(updatedSession);

      if (updatedSession.completed) {
        setShowSummaryModal(true);
      }
    } catch (err) {
      console.error('Error submitting answer:', err);
    }
  };

  // Handle voice transcript received from VoiceIndicator
  const handleVoiceTranscript = async (transcript) => {
    if (!transcript) return;

    if (currentQuestion?.field_key) {
      setLastUpdatedField(currentQuestion.field_key);
    } else if (currentQuestion?.id === 'root_complaint') {
      setLastUpdatedField('chiefComplaint');
    }

    try {
      const updatedSession = await interviewService.submitAnswer(
        session?.session_id,
        transcript,
        'voice'
      );
      setSession(updatedSession);

      if (updatedSession.completed) {
        setShowSummaryModal(true);
      }
    } catch (err) {
      console.error('Error submitting voice answer:', err);
    }
  };

  // Step back / undo
  const handleStepBack = async () => {
    if (!session) return;
    if (session.history.length === 0) {
      navigate('/patient/language');
      return;
    }

    try {
      const updatedSession = await interviewService.stepBack(session.session_id);
      setSelectedOption(null);
      setSession(updatedSession);
      setShowSummaryModal(false);
    } catch (err) {
      console.error('Error stepping back:', err);
    }
  };

  // Advance on Next Button
  const handleNextClick = () => {
    if (isTerminal || session?.completed) {
      setShowSummaryModal(true);
    } else if (selectedOption) {
      // Find matching option object or pass string
      const opt = currentQuestion?.quick_options?.find(
        (o) => o.value === selectedOption || o.label === selectedOption
      );
      if (opt) handleSelectOption(opt);
    }
  };

  if (loading || !session) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-teal-700 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-600">
            Initializing Adaptive Clinical Interview...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full py-2 space-y-6">
      {/* Top Audio Prompt Bar */}
      {currentQuestion && (
        <AudioPromptBar
          text={currentQuestion.question}
          hindiText={currentQuestion.hindi_question}
        />
      )}

      {/* Main Grid: Left Interview Interaction + Right Live Clinical Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Question, Options, Voice Input */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-200 shadow-sm space-y-6">
            {/* Step Counter & Branching Indicator */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
                  Question {session.current_step} of ~{session.total_estimated_steps}
                </span>
                {currentQuestion?.branch_badge && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-800 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-200 animate-pulse">
                    <GitBranch className="w-3 h-3" />
                    {currentQuestion.branch_badge}
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-400 font-medium">
                SOCRATES Clinical Tree
              </span>
            </div>

            {/* Active Question Prompt */}
            {currentQuestion ? (
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                  {currentQuestion.question}
                </h2>
                <p className="text-lg sm:text-xl font-bold text-teal-800 mt-1">
                  {currentQuestion.hindi_question}
                </p>
                <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5 font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span>{currentQuestion.audio_hint}</span>
                </p>
              </div>
            ) : (
              <div className="text-center py-6">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
                <h3 className="text-xl font-black text-slate-900">
                  All Clinical Questions Answered
                </h3>
                <p className="text-sm text-slate-600 mt-1">
                  Click review to inspect your generated case file.
                </p>
              </div>
            )}

            {/* Touch Option Cards */}
            {currentQuestion?.quick_options && (
              <div
                className={`grid gap-3 pt-2 ${
                  currentQuestion.input_type === 'scale'
                    ? 'grid-cols-1 sm:grid-cols-2'
                    : 'grid-cols-1 sm:grid-cols-2'
                }`}
              >
                {currentQuestion.quick_options.map((opt, idx) => {
                  const isSelected = selectedOption === (opt.value || opt.label);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectOption(opt)}
                      className={`p-4 rounded-2xl border-2 text-left font-bold text-base transition-all active:scale-[0.98] flex items-center justify-between shadow-2xs group cursor-pointer ${
                        isSelected
                          ? 'border-teal-700 bg-teal-50 text-teal-900 ring-4 ring-teal-700/20 shadow-sm'
                          : opt.is_red_flag
                          ? 'border-rose-300 bg-rose-50/50 hover:border-rose-400 hover:bg-rose-50 text-slate-800'
                          : 'border-slate-200 bg-white hover:border-teal-400 hover:bg-teal-50/20 text-slate-800'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <span className="block text-slate-900 group-hover:text-teal-900">
                          {opt.label}
                        </span>
                        {opt.hindi && (
                          <span className="block text-xs font-semibold text-teal-800">
                            {opt.hindi}
                          </span>
                        )}
                        {opt.branch_desc && (
                          <span className="block text-[10px] text-purple-700 font-semibold italic">
                            ↳ {opt.branch_desc}
                          </span>
                        )}
                      </div>
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ml-2 ${
                          isSelected
                            ? 'border-teal-700 bg-teal-700 text-white'
                            : 'border-slate-300 group-hover:border-teal-500'
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-5 h-5" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* 4-State Microphone & Speech Section */}
            <div className="pt-2 border-t border-slate-100">
              <VoiceIndicator
                currentQuestionId={currentQuestion?.id}
                prompt="Prefer to Speak? Tap Mic (बोलने के लिए माइक दबाएं)"
                subPrompt="Speak naturally in Hindi or English — AI maps it to the clinical tree"
                onTranscriptReceived={handleVoiceTranscript}
              />
            </div>
          </div>

          {/* Bottom Action / Navigation Bar */}
          <div className="flex items-center justify-between gap-4 pt-1">
            <Button
              variant="outline"
              size="lg"
              icon={ArrowLeft}
              onClick={handleStepBack}
            >
              Previous (पिछला)
            </Button>

            <Button
              variant="kiosk"
              size="lg"
              icon={ArrowRight}
              iconPosition="right"
              onClick={handleNextClick}
              className="min-w-[210px]"
            >
              {isTerminal || session.completed
                ? 'Review Case (समीक्षा करें)'
                : 'Next Question (अगला प्रश्न)'}
            </Button>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Extracted Notes & Dialogue Record */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          <LiveExtractedPanel
            chiefComplaint={session.chief_complaint}
            extractedHistory={session.extracted_history}
            redFlags={session.red_flags}
            lastUpdatedField={lastUpdatedField}
          />

          <ConversationHistory
            history={session.history}
            onStepBack={handleStepBack}
          />
        </div>
      </div>

      {/* Structured Review Modal before proceeding */}
      <InterviewSummaryModal
        isOpen={showSummaryModal}
        chiefComplaint={session.chief_complaint}
        extractedHistory={session.extracted_history}
        redFlags={session.red_flags}
        onConfirm={() => {
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
