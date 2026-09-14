import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import AudioPromptBar from '../../components/patient/AudioPromptBar';
import VoiceIndicator from '../../components/patient/VoiceIndicator';
import { MOCK_INTERVIEW_STEPS } from '../../data/mockData';
import { ArrowRight, ArrowLeft, CheckCircle2, Volume2, Sparkles } from 'lucide-react';

export default function InterviewPage() {
  const navigate = useNavigate();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [voiceSpoken, setVoiceSpoken] = useState('');

  const currentQuestion = MOCK_INTERVIEW_STEPS[currentStepIndex];
  const isLast = currentStepIndex === MOCK_INTERVIEW_STEPS.length - 1;

  const handleSelectOption = (optionLabel) => {
    setAnswers({
      ...answers,
      [currentQuestion.step]: optionLabel,
    });
  };

  const handleVoiceTranscript = (transcript) => {
    setVoiceSpoken(transcript);
    setAnswers({
      ...answers,
      [currentQuestion.step]: `[Voice] ${transcript}`,
    });
  };

  const handleNext = () => {
    if (isLast) {
      navigate('/patient/documents');
    } else {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    } else {
      navigate('/patient/language');
    }
  };

  const selectedAnswer = answers[currentQuestion.step];

  return (
    <div className="flex-1 flex flex-col justify-between max-w-3xl mx-auto w-full py-2 space-y-6">
      {/* Audio narration bar with active question */}
      <AudioPromptBar
        text={currentQuestion.question}
        hindiText={currentQuestion.hindi_question}
      />

      {/* Main Question Container */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
            Question {currentStepIndex + 1} of {MOCK_INTERVIEW_STEPS.length}
          </span>
          <span className="text-xs text-slate-400 font-medium">Adaptive Clinical Branching</span>
        </div>

        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
            {currentQuestion.question}
          </h2>
          <p className="text-lg sm:text-xl font-bold text-teal-800 mt-1">
            {currentQuestion.hindi_question}
          </p>
          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>{currentQuestion.audio_hint}</span>
          </p>
        </div>

        {/* Quick Touch Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {currentQuestion.options.map((opt, idx) => {
            const isSelected = selectedAnswer === opt.label;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectOption(opt.label)}
                className={`p-4 rounded-2xl border-2 text-left font-bold text-base sm:text-lg transition-all active:scale-[0.98] flex items-center justify-between shadow-2xs ${
                  isSelected
                    ? 'border-teal-700 bg-teal-50 text-teal-900 ring-4 ring-teal-700/20 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-teal-400 text-slate-800'
                }`}
              >
                <span>{opt.label}</span>
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ml-2 ${
                    isSelected ? 'border-teal-700 bg-teal-700 text-white' : 'border-slate-300'
                  }`}
                >
                  {isSelected && <CheckCircle2 className="w-5 h-5" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Voice Input Indicator for Non-Typing / Elderly Patients */}
        <div className="pt-2 border-t border-slate-100">
          <VoiceIndicator
            prompt="Prefer to Speak? Tap Mic (बोलने के लिए माइक दबाएं)"
            subPrompt="Our AI converts your spoken words into doctor-ready notes"
            onTranscriptReceived={handleVoiceTranscript}
          />
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <Button
          variant="outline"
          size="lg"
          icon={ArrowLeft}
          onClick={handlePrev}
        >
          Previous (पिछला)
        </Button>

        <Button
          variant="kiosk"
          size="lg"
          icon={ArrowRight}
          iconPosition="right"
          onClick={handleNext}
          className="min-w-[200px]"
        >
          {isLast ? 'Upload Documents (कागज़ात जोड़ें)' : 'Next Question (अगला प्रश्न)'}
        </Button>
      </div>
    </div>
  );
}
