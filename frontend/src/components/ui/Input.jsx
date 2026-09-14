import React from 'react';

/**
 * Reusable Input component supporting clinical and large kiosk touch modes.
 */
export default function Input({
  label,
  hindiLabel,
  hint,
  error,
  kiosk = false,
  className = '',
  id,
  type = 'text',
  ...props
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : 'input');

  const kioskStyles = kiosk
    ? 'text-xl py-4 px-5 rounded-xl border-2 border-slate-300 focus:border-teal-600 focus:ring-4 focus:ring-teal-600/20 placeholder:text-slate-400 font-medium'
    : 'text-sm py-2.5 px-3.5 rounded-lg border border-slate-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20';

  return (
    <div className="w-full">
      {(label || hindiLabel) && (
        <label htmlFor={inputId} className="block mb-1.5">
          <span className={`font-semibold text-slate-800 ${kiosk ? 'text-lg' : 'text-sm'}`}>
            {label}
          </span>
          {hindiLabel && (
            <span className={`ml-2 text-slate-500 font-normal ${kiosk ? 'text-base' : 'text-xs'}`}>
              ({hindiLabel})
            </span>
          )}
        </label>
      )}

      <input
        id={inputId}
        type={type}
        className={`w-full bg-white text-slate-900 transition duration-150 outline-none ${kioskStyles} ${
          error ? 'border-rose-500 focus:border-rose-600 focus:ring-rose-500/20' : ''
        } ${className}`}
        {...props}
      />

      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>}
    </div>
  );
}
