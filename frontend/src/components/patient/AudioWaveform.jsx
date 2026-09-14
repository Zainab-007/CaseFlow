import React from 'react';

/**
 * Animated audio waveform visualizer for the LISTENING state.
 * Displays dynamic pulsating frequency bars mimicking human speech audio.
 */
export default function AudioWaveform({ barCount = 18, color = 'emerald' }) {
  const colorMap = {
    emerald: 'bg-emerald-500',
    teal: 'bg-teal-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500'
  };

  const bgClass = colorMap[color] || 'bg-emerald-500';

  // Array of heights for varied bar animation heights
  const heights = [
    'h-3', 'h-6', 'h-10', 'h-7', 'h-12', 'h-8', 'h-14', 'h-9',
    'h-11', 'h-16', 'h-10', 'h-13', 'h-7', 'h-12', 'h-8', 'h-5',
    'h-4', 'h-2'
  ];

  return (
    <div className="flex items-center justify-center gap-1.5 h-16 px-4 py-2 bg-slate-900/5 rounded-2xl border border-slate-200/80">
      {Array.from({ length: barCount }).map((_, i) => {
        const heightClass = heights[i % heights.length];
        const animationDelay = `${(i * 0.08).toFixed(2)}s`;

        return (
          <span
            key={i}
            className={`w-1.5 rounded-full ${bgClass} animate-pulse transition-all duration-300`}
            style={{
              animationDuration: `${0.6 + (i % 5) * 0.15}s`,
              animationDelay,
              minHeight: '8px'
            }}
          />
        );
      })}
    </div>
  );
}
