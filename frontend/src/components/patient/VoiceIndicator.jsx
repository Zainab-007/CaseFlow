import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Sparkles, CheckCircle2, Loader2, Volume2 } from 'lucide-react';
import AudioWaveform from './AudioWaveform';

export const VOICE_STATES = {
  IDLE: 'IDLE',
  LISTENING: 'LISTENING',
  PROCESSING: 'PROCESSING',
  RESPONSE_RECEIVED: 'RESPONSE_RECEIVED'
};

/**
 * 4-State Multimodal Kiosk Voice Interaction Component
 * Supports live Web Speech API recognition with simulated rapid chips for elderly testing.
 */
export default function VoiceIndicator({
  onTranscriptReceived,
  currentQuestionId,
  suggestedPhrases = [],
  prompt = 'Prefer to Speak? Tap Mic (बोलने के लिए माइक दबाएं)',
  subPrompt = 'Speak in Hindi, English or Hinglish — AI will structure your words',
  className = ''
}) {
  const [voiceState, setVoiceState] = useState(VOICE_STATES.IDLE);
  const [transcript, setTranscript] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const recognitionRef = useRef(null);

  // Initialize Web Speech API if supported
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'hi-IN'; // default Hindi/Indian English

      recognition.onstart = () => {
        setVoiceState(VOICE_STATES.LISTENING);
        setErrorMessage('');
      };

      recognition.onresult = (event) => {
        const current = event.resultIndex;
        const text = event.results[current][0].transcript;
        setTranscript(text);
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition notice:', event.error);
        if (event.error === 'not-allowed') {
          setErrorMessage('Microphone access denied. You can tap quick voice sample chips below.');
        }
      };

      recognition.onend = () => {
        // When speech finishes, transition through PROCESSING to RESPONSE_RECEIVED
        setVoiceState((prevState) => {
          if (prevState === VOICE_STATES.LISTENING) {
            return VOICE_STATES.PROCESSING;
          }
          return prevState;
        });
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // Handle processing delay effect
  useEffect(() => {
    if (voiceState === VOICE_STATES.PROCESSING) {
      const timer = setTimeout(() => {
        setVoiceState(VOICE_STATES.RESPONSE_RECEIVED);
        if (transcript && onTranscriptReceived) {
          onTranscriptReceived(transcript);
        }
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [voiceState, transcript, onTranscriptReceived]);

  const handleStartListening = () => {
    setErrorMessage('');
    setTranscript('');
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setVoiceState(VOICE_STATES.LISTENING);
        return;
      } catch (e) {
        console.warn('Recognition start exception, using simulated voice stream:', e);
      }
    }

    // Fallback simulated listening for browsers/environments without Speech API mic permissions
    setVoiceState(VOICE_STATES.LISTENING);
    const sampleResponses = {
      root_complaint: 'मुझे पेट में बहुत तेज दर्द हो रहा है (I have severe stomach pain)',
      abdo_site: 'पेट के ऊपरी हिस्से में पसलियों के नीचे दर्द है (Upper abdomen)',
      abdo_character: 'सीने और पेट में खट्टी जलन महसूस होती है (Burning sensation)',
      abdo_burning_meals: 'खाना खाने के बाद जलन ज्यादा बढ़ जाती है (Worse after meals)',
      abdo_duration: 'यह दर्द लगभग 3 से 4 दिन पहले शुरू हुआ था',
      abdo_severity: 'दर्द बहुत ज्यादा है, लगभग 8 नंबर का गंभीर दर्द',
      abdo_associated: 'जी मिचला रहा है और हल्की उल्टी भी हुई'
    };

    const simulatedText = sampleResponses[currentQuestionId] || 'पेट में जलन और मरोड़ महसूस हो रही है';

    setTimeout(() => {
      setTranscript(simulatedText);
      setVoiceState(VOICE_STATES.PROCESSING);
    }, 2400);
  };

  const handleStopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
    setVoiceState(VOICE_STATES.PROCESSING);
  };

  const handleQuickChipSelect = (text) => {
    setTranscript(text);
    setVoiceState(VOICE_STATES.PROCESSING);
  };

  const handleReset = () => {
    setVoiceState(VOICE_STATES.IDLE);
    setTranscript('');
  };

  return (
    <div className={`flex flex-col items-center justify-center text-center p-5 bg-gradient-to-b from-slate-50 to-teal-50/30 border border-slate-200 rounded-3xl ${className}`}>
      {/* State 1: IDLE */}
      {voiceState === VOICE_STATES.IDLE && (
        <div className="flex flex-col items-center space-y-3 w-full">
          <button
            type="button"
            onClick={handleStartListening}
            aria-label="Tap to speak"
            className="w-24 h-24 rounded-full bg-teal-700 hover:bg-teal-800 active:scale-95 text-white flex items-center justify-center transition-all duration-200 shadow-lg shadow-teal-700/25 ring-8 ring-teal-600/15"
          >
            <Mic className="w-10 h-10" />
          </button>
          <div>
            <h4 className="text-lg font-black text-slate-900">{prompt}</h4>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">{subPrompt}</p>
          </div>
        </div>
      )}

      {/* State 2: LISTENING */}
      {voiceState === VOICE_STATES.LISTENING && (
        <div className="flex flex-col items-center space-y-3 w-full animate-fade-in">
          <button
            type="button"
            onClick={handleStopListening}
            aria-label="Stop speaking"
            className="w-24 h-24 rounded-full bg-rose-600 hover:bg-rose-700 active:scale-95 text-white flex items-center justify-center transition-all duration-200 shadow-xl shadow-rose-600/30 ring-8 ring-rose-400/30 animate-pulse"
          >
            <Square className="w-9 h-9 fill-current" />
          </button>

          <div className="w-full max-w-sm">
            <AudioWaveform barCount={20} color="rose" />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-800 rounded-full text-xs font-bold uppercase tracking-wider mb-1">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
              <span>Listening... कृपया बोलें</span>
            </div>
            <p className="text-xs text-slate-600 font-medium">Tap square or pause when you finish speaking</p>
          </div>

          {transcript && (
            <div className="p-3 bg-white/90 border border-slate-200 rounded-xl max-w-md w-full text-sm font-semibold text-slate-800 italic">
              "{transcript}"
            </div>
          )}
        </div>
      )}

      {/* State 3: PROCESSING */}
      {voiceState === VOICE_STATES.PROCESSING && (
        <div className="flex flex-col items-center space-y-3 py-3 w-full">
          <div className="w-20 h-20 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/25 ring-8 ring-amber-400/20">
            <Loader2 className="w-9 h-9 animate-spin" />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-900">Processing Audio & Structuring Symptoms...</h4>
            <p className="text-xs text-slate-500 font-medium">Extracting clinical entities according to SOCRATES ontology</p>
          </div>
        </div>
      )}

      {/* State 4: RESPONSE_RECEIVED */}
      {voiceState === VOICE_STATES.RESPONSE_RECEIVED && (
        <div className="flex flex-col items-center space-y-3 w-full animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 ring-4 ring-emerald-500/20">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="p-4 bg-emerald-50 border-2 border-emerald-200 rounded-2xl max-w-md w-full text-left">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1.5">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Spoken Input Captured
              </span>
              <span className="text-[10px] bg-emerald-200/70 px-2 py-0.5 rounded text-emerald-900">Structured</span>
            </div>
            <p className="text-slate-900 text-sm font-semibold italic">"{transcript}"</p>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="text-xs font-bold text-teal-800 hover:text-teal-900 underline cursor-pointer"
          >
            Speak Again (दोबारा बोलें)
          </button>
        </div>
      )}

      {/* Quick Simulated Voice Chips for kiosk demo */}
      <div className="mt-4 pt-3 border-t border-slate-200/80 w-full text-left">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
            <Volume2 className="w-3.5 h-3.5 text-teal-600" />
            Quick Voice Simulation Chips (आवाज़ के नमूने)
          </span>
          <span className="text-[10px] text-slate-400 font-medium">Tap to simulate patient speech</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[
            'पेट में खट्टी जलन हो रही है (Burning)',
            'अचानक आज दर्द शुरू हुआ (<24h)',
            'सीने व नाभि के बीच तेज़ मरोड़',
            'खाना खाने के बाद दर्द बढ़ जाता है',
            'दर्द 8 नंबर का बहुत तेज़ है'
          ].map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleQuickChipSelect(chip)}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-teal-400 hover:bg-teal-50 text-slate-700 transition-colors shadow-2xs"
            >
              🎙️ {chip}
            </button>
          ))}
        </div>
      </div>

      {errorMessage && (
        <p className="text-xs text-amber-800 mt-2 bg-amber-50 px-3 py-1 rounded-md border border-amber-200">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
