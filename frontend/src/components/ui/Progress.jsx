import React from 'react';

/**
 * Reusable Linear Progress Bar and Step Indicator for Patient Kiosk.
 */
export default function Progress({
  currentStep,
  totalSteps,
  stepTitles = [],
  className = '',
}) {
  const percentage = Math.min(100, Math.round((currentStep / totalSteps) * 100));

  return (
    <div className={`w-full ${className}`}>
      {/* Progress Info Header */}
      <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
        <span>Step {currentStep} of {totalSteps}</span>
        <span>{percentage}% Complete</span>
      </div>

      {/* Progress Track */}
      <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
        <div
          className="bg-teal-700 h-full rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Optional Step Labels */}
      {stepTitles.length > 0 && (
        <div className="hidden sm:grid grid-cols-6 gap-1 mt-2 text-[11px] text-slate-500 font-medium">
          {stepTitles.map((title, idx) => {
            const stepNum = idx + 1;
            const isCurrent = stepNum === currentStep;
            const isCompleted = stepNum < currentStep;
            return (
              <div
                key={title}
                className={`truncate ${
                  isCurrent
                    ? 'text-teal-700 font-bold'
                    : isCompleted
                    ? 'text-slate-700'
                    : 'text-slate-400'
                }`}
              >
                {title}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
