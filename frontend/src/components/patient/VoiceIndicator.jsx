import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, AlertCircle, Volume2 } from 'lucide-react';

/**
 * End-to-End Real Voice Input Control
 * Implements Web Speech API with complete lifecycle management:
 * - Browser support detection
 * - Permission denied / audio capture / network / no-speech error handling
 * - Accurate transcript accumulation (interim + final)
 * - Multilingual speech recognition (hi-IN / en-IN)
 * - Safe transition to the exact same answer pipeline as touch/click
 */
export default function VoiceIndicator({
  onTranscriptReceived,
  currentQuestionId,
  language = 'hi',
  className = ''
}) {
  const [isListening, setIsListening] = useState(false);
  const [liveText, setLiveText] = useState('');
  const [statusNotice, setStatusNotice] = useState(null);
  const [isSupported, setIsSupported] = useState(true);

  const recognitionRef = useRef(null);
  const transcriptRef = useRef('');
  const isManuallyStoppedRef = useRef(false);

  // Initialize SpeechRecognition on mount if supported
  useEffect(() => {
    const SpeechRecognition =
      typeof window !== 'undefined' &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.lang = language === 'en' ? 'en-IN' : 'hi-IN';

      recognition.onstart = () => {
        setIsListening(true);
        setStatusNotice(null);
        transcriptRef.current = '';
        setLiveText('');
      };

      recognition.onresult = (event) => {
        let accumulatedFinal = '';
        let accumulatedInterim = '';

        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            accumulatedFinal += result[0].transcript + ' ';
          } else {
            accumulatedInterim += result[0].transcript;
          }
        }

        const combined = (accumulatedFinal + accumulatedInterim).trim();
        if (combined) {
          transcriptRef.current = combined;
          setLiveText(combined);
        }
      };

      recognition.onerror = (event) => {
        setIsListening(false);
        const err = event.error;
        console.warn('Speech recognition event:', err);

        if (err === 'not-allowed' || err === 'service-not-allowed') {
          setStatusNotice(
            language === 'en'
              ? 'Microphone permission blocked. Please allow mic access in your browser.'
              : 'माइक्रोफ़ोन की अनुमति ब्लॉक है। कृपया ब्राउज़र में माइक की अनुमति दें।'
          );
        } else if (err === 'no-speech') {
          setStatusNotice(
            language === 'en'
              ? 'No speech detected. Please tap the mic and try speaking again.'
              : 'कोई आवाज़ नहीं सुनाई दी। कृपया दोबारा बोलें।'
          );
        } else if (err === 'audio-capture') {
          setStatusNotice(
            language === 'en'
              ? 'No microphone found on this device.'
              : 'डिवाइस पर कोई माइक्रोफ़ोन नहीं मिला।'
          );
        } else if (err === 'network') {
          setStatusNotice(
            language === 'en'
              ? 'Speech service network error. Please try again or tap an option.'
              : 'इंटरनेट संपर्क त्रुटि। कृपया विकल्प पर टैप करें।'
          );
        } else if (err !== 'aborted') {
          setStatusNotice(
            language === 'en'
              ? `Voice input note: ${err}. Please tap an option below.`
              : 'कृपया नीचे दिए गए विकल्प पर टैप करें।'
          );
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        const finalRecorded = transcriptRef.current.trim();

        if (finalRecorded) {
          if (onTranscriptReceived) {
            onTranscriptReceived(finalRecorded);
          }
          transcriptRef.current = '';
          setLiveText('');
        } else if (!isManuallyStoppedRef.current) {
          // If stopped without transcript and no prior error set
          setStatusNotice((prev) =>
            prev ||
            (language === 'en'
              ? 'No speech captured. Tap mic to speak or select an option below.'
              : 'कोई आवाज़ रिकॉर्ड नहीं हुई। बोलकर उत्तर देने के लिए माइक दबाएं।')
          );
        }
        isManuallyStoppedRef.current = false;
      };

      recognitionRef.current = recognition;
    } catch (e) {
      console.warn('Failed to initialize speech recognition:', e);
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // ignore
        }
      }
    };
  }, [language, onTranscriptReceived]);

  const handleToggleListening = () => {
    setStatusNotice(null);

    if (!isSupported) {
      setStatusNotice(
        language === 'en'
          ? 'Voice recognition is not supported in this browser. Please tap your answer below.'
          : 'यह ब्राउज़र आवाज़ पहचान का समर्थन नहीं करता। कृपया नीचे दिए गए विकल्प को चुनें।'
      );
      return;
    }

    if (isListening) {
      isManuallyStoppedRef.current = true;
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

    transcriptRef.current = '';
    setLiveText('');
    isManuallyStoppedRef.current = false;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.lang = language === 'en' ? 'en-IN' : 'hi-IN';
        recognitionRef.current.start();
      } catch (err) {
        if (err.name !== 'InvalidStateError') {
          console.warn('Recognition start error:', err);
          setStatusNotice(
            language === 'en'
              ? 'Unable to access microphone. Please select an answer on screen.'
              : 'माइक्रोफ़ोन शुरू करने में समस्या। कृपया स्क्रीन पर विकल्प चुनें।'
          );
        }
      }
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="bg-slate-50/90 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
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
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              {isListening ? (
                <>
                  <Volume2 className="w-4 h-4 text-rose-600 animate-bounce" />
                  <span>Listening... (बोलिए)</span>
                </>
              ) : (
                <span>Prefer to speak? (बोलकर बताएं)</span>
              )}
            </h4>
            <p className="text-xs text-slate-500">
              {isListening
                ? liveText
                  ? `"${liveText}"`
                  : 'Speak naturally • Tap square when finished'
                : 'Tap microphone to speak your answer in Hindi or English'}
            </p>
          </div>
        </div>

        <div className="shrink-0 self-end sm:self-center">
          {isListening ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-800 rounded-full text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
              <span>Recording Live</span>
            </div>
          ) : (
            <span className="text-xs font-semibold text-teal-800 bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-200 hidden sm:inline">
              Tap to answer by voice
            </span>
          )}
        </div>
      </div>

      {/* Real error or warning notice */}
      {statusNotice && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="flex-1">{statusNotice}</span>
          <button
            type="button"
            onClick={() => setStatusNotice(null)}
            className="text-amber-700 hover:text-amber-900 font-bold ml-2 underline"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
