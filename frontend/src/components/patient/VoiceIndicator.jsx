import React, { useState } from 'react';
import { Mic, MicOff, Sparkles } from 'lucide-react';

/**
 * Prominent Voice Indicator button for multimodal kiosk interaction.
 * Elderly and non-typing patients can speak their complaints.
 */
export default function VoiceIndicator({
  onTranscriptReceived,
  prompt = 'Tap to Speak (बोलने के लिए दबाएं)',
  subPrompt = 'Speak in Hindi, English, or your mother tongue',
  className = '',
}) {
  const [isListening, setIsListening] = useState(false);
  const [spokenText, setSpokenText] = useState('');

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
    } else {
      setIsListening(true);
      // Simulate realistic voice recognition response for prototype kiosk
      setTimeout(() => {
        const mockVoiceTranscript = "मुझे पिछले चार दिनों से खांसी और चलने पर सांस फूलने की समस्या हो रही है।";
        setSpokenText(mockVoiceTranscript);
        setIsListening(false);
        if (onTranscriptReceived) {
          onTranscriptReceived(mockVoiceTranscript);
        }
      }, 2500);
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center text-center p-6 bg-slate-50 border-2 border-dashed border-slate-300 rounded-3xl ${className}`}>
      {/* Big Touch Target Mic Button */}
      <button
        type="button"
        onClick={toggleListening}
        aria-label={prompt}
        className={`w-28 h-28 rounded-full flex items-center justify-center transition-all duration-200 shadow-xl select-none ${
          isListening
            ? 'bg-rose-600 text-white ring-8 ring-rose-300 animate-pulse scale-105'
            : 'bg-teal-700 hover:bg-teal-800 active:scale-95 text-white ring-8 ring-teal-600/20'
        }`}
      >
        {isListening ? <Mic className="w-12 h-12" /> : <Mic className="w-12 h-12" />}
      </button>

      {/* Voice Status Text */}
      <div className="mt-4">
        <h4 className="text-xl font-bold text-slate-900">
          {isListening ? 'Listening... कृपया बोलें' : prompt}
        </h4>
        <p className="text-sm font-medium text-slate-600 mt-1">{subPrompt}</p>
      </div>

      {/* Spoken result preview */}
      {spokenText && (
        <div className="mt-4 p-4 bg-teal-50 border border-teal-200 rounded-2xl max-w-md w-full text-left">
          <div className="flex items-center gap-1.5 text-xs font-bold text-teal-800 uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4 text-teal-600" />
            <span>Voice Input Captured (पहचाना गया स्वर)</span>
          </div>
          <p className="text-slate-900 text-sm font-medium italic">"{spokenText}"</p>
        </div>
      )}
    </div>
  );
}
