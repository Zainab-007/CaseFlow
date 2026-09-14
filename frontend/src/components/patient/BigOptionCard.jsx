import React from 'react';
import { CheckCircle2 } from 'lucide-react';

/**
 * Large touch option card for kiosk single-touch selection.
 * Designed with large font and high-contrast border for elderly and low-literacy users.
 */
export default function BigOptionCard({
  title,
  hindiTitle,
  subtitle,
  icon: Icon,
  selected = false,
  onClick,
  badge,
  color = 'teal',
  className = '',
}) {
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={`relative p-5 sm:p-6 rounded-2xl border-2 transition-all duration-150 cursor-pointer select-none flex items-center justify-between text-left shadow-xs ${
        selected
          ? 'border-teal-700 bg-teal-50/70 ring-4 ring-teal-700/20 shadow-md scale-[1.01]'
          : 'border-slate-200 bg-white hover:border-teal-400 hover:bg-slate-50/80 active:scale-[0.99]'
      } ${className}`}
    >
      <div className="flex items-center gap-4">
        {Icon && (
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
              selected ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            <Icon className="w-7 h-7" />
          </div>
        )}

        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {title}
            </h4>
            {badge && (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {badge}
              </span>
            )}
          </div>
          {hindiTitle && (
            <p className="text-base sm:text-lg font-medium text-slate-600 mt-0.5">
              {hindiTitle}
            </p>
          )}
          {subtitle && (
            <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="shrink-0 ml-3">
        <div
          className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition ${
            selected
              ? 'border-teal-700 bg-teal-700 text-white'
              : 'border-slate-300 bg-white text-transparent'
          }`}
        >
          <CheckCircle2 className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
