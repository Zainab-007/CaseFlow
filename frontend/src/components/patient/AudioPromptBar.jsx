import React, { useState } from 'react';
import { Volume2, VolumeX, RotateCcw } from 'lucide-react';

/**
 * Prominent audio narration bar for elderly & low-literacy kiosk patients.
 * Audio is on by default in hospital kiosks to guide patients through each step.
 */
export default function AudioPromptBar({
  text = 'Please listen to the instructions or read below.',
  hindiText = 'कृपया निर्देशों को सुनें या नीचे पढ़ें।',
  className = '',
}) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (!isMuted) setIsPlaying(false);
  };

  const replayAudio = () => {
    setIsMuted(false);
    setIsPlaying(true);
  };

  return (
    <div
      className={`bg-teal-50/90 border-2 border-teal-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs ${className}`}
    >
      <div className="flex items-center gap-3.5 w-full sm:w-auto">
        <div className="w-12 h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-sm">
          {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6 animate-pulse" />}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-200/60 px-2 py-0.5 rounded-md">
              {isMuted ? 'Audio Paused' : 'Voice Assistance Active'}
            </span>
          </div>
          <p className="text-base font-semibold text-slate-900 mt-1">{text}</p>
          {hindiText && <p className="text-sm font-medium text-slate-600">{hindiText}</p>}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
        <button
          type="button"
          onClick={replayAudio}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-teal-800 bg-white border border-teal-300 rounded-xl hover:bg-teal-50 shadow-xs transition"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Replay (फिर से सुनें)</span>
        </button>
        <button
          type="button"
          onClick={toggleMute}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 shadow-xs transition"
        >
          {isMuted ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          <span>{isMuted ? 'Turn Sound On' : 'Mute'}</span>
        </button>
      </div>
    </div>
  );
}
