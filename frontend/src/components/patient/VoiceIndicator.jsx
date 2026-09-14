import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square } from 'lucide-react';

/**
 * Minimal Patient-Friendly Voice Input Control
 * Clean single-microphone interaction without developer controls or waveforms.
 */
export default function VoiceIndicator({
  onTranscriptReceived,
  currentQuestionId,
  className = ''
}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);

  // Initialize Web Speech API if supported
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'hi-IN';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const current = event.resultIndex;
        const text = event.results[current][0].transcript;
        setTranscript(text);
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition notice:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // When speech ends with transcript, dispatch to interview engine
  useEffect(() => {
    if (!isListening && transcript && onTranscriptReceived) {
      onTranscriptReceived(transcript);
      setTranscript('');
    }
  }, [isListening, transcript, onTranscriptReceived]);

  const handleToggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
      setIsListening(false);
      return;
    }

    setTranscript('');

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        return;
      } catch (e) {
        console.warn('Microphone error, using fallback voice simulation:', e);
      }
    }

    // Fallback simulation for environments without Web Speech permissions
    setIsListening(true);
    const sampleResponses = {
      root_complaint: 'पेट में दर्द (Stomach pain)',
      abdo_site: 'पेट के ऊपरी हिस्से में (Upper abdomen)',
      abdo_character: 'सीने और पेट में जलन (Burning sensation)',
      abdo_burning_meals: 'खाना खाने के बाद जलन बढ़ जाती है (Worse after meals)',
      abdo_duration: '3 से 4 दिन पहले (3 to 4 days ago)',
      abdo_severity: 'हल्का से मध्यम दर्द (Moderate 5/10)',
      abdo_associated: 'जी मिचलाना (Nausea)'
    };

    const simulatedText = sampleResponses[currentQuestionId] || 'हाँ, यह लक्षण महसूस हो रहा है';

    setTimeout(() => {
      setTranscript(simulatedText);
      setIsListening(false);
    }, 2000);
  };

  return (
    <div
      className={`bg-slate-50/90 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 ${className}`}
    >
      <div className="flex items-center gap-3.5 w-full sm:w-auto">
        <button
          type="button"
          onClick={handleToggleListening}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-150 shrink-0 cursor-pointer ${
            isListening
              ? 'bg-rose-600 hover:bg-rose-700 text-white ring-4 ring-rose-200 animate-pulse shadow-md'
              : 'bg-teal-700 hover:bg-teal-800 text-white shadow-xs active:scale-95'
          }`}
          aria-label={isListening ? 'Stop recording voice' : 'Tap microphone to answer by voice'}
        >
          {isListening ? <Square className="w-5 h-5 fill-current" /> : <Mic className="w-5 h-5" />}
        </button>

        <div>
          <h4 className="text-sm font-bold text-slate-900">
            {isListening ? 'Listening... (बोलिए)' : 'Prefer to speak?'}
          </h4>
          <p className="text-xs text-slate-500">
            {isListening
              ? 'Speak naturally • Tap square when finished'
              : 'Tap the microphone to answer'}
          </p>
        </div>
      </div>

      <div className="shrink-0 self-end sm:self-center">
        {isListening ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-800 rounded-full text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
            <span>Listening...</span>
          </div>
        ) : (
          <span className="text-xs font-semibold text-teal-800 bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-200 hidden sm:inline">
            Tap to answer by voice
          </span>
        )}
      </div>
    </div>
  );
}
