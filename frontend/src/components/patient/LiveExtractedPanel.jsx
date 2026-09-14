import React from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * Compact Live Clinical Notes sidebar for patient intake kiosk.
 * Displays real-time clinical extractions in a clean, non-intrusive vertical list.
 */
export default function LiveExtractedPanel({
  chiefComplaint,
  extractedHistory = {},
  redFlags = [],
  lastUpdatedField = null,
  className = ''
}) {
  const isProvided = (val) => {
    if (!val) return false;
    const str = String(val).trim().toLowerCase();
    return (
      str !== '' &&
      str !== 'not yet provided' &&
      str !== 'not provided' &&
      str !== 'not yet specified' &&
      str !== 'listening for complaint...'
    );
  };

  const fields = [
    {
      key: 'chiefComplaint',
      label: 'Chief Complaint',
      value: chiefComplaint,
    },
    {
      key: 'site',
      label: 'Site / Location',
      value: extractedHistory.site,
    },
    {
      key: 'onset',
      label: 'Onset & Duration',
      value: extractedHistory.onset,
    },
    {
      key: 'character',
      label: 'Pain Character',
      value: extractedHistory.character,
    },
    {
      key: 'severity',
      label: 'Pain Severity',
      value: extractedHistory.severity,
    },
    {
      key: 'aggravatingFactors',
      label: 'Relation to Meals',
      value: extractedHistory.aggravatingFactors,
      optional: true,
    },
    {
      key: 'radiation',
      label: 'Radiation / Spread',
      value: extractedHistory.radiation,
      optional: true,
    },
    {
      key: 'associatedSymptoms',
      label: 'Associated Symptoms',
      value: extractedHistory.associatedSymptoms,
      optional: true,
    },
    {
      key: 'medications',
      label: 'Medications / Prior Care',
      value: extractedHistory.medications,
      optional: true,
    },
  ];

  return (
    <div className={`bg-white rounded-3xl border-2 border-slate-200 p-5 shadow-xs space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
            Live Clinical Notes
          </h3>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
            लाइव सारांश • Auto-extracted
          </p>
        </div>
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Live sync" />
      </div>

      {/* Red-Flag Alert if detected */}
      {redFlags && redFlags.length > 0 && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] font-black uppercase text-rose-900 tracking-wider block">
                Flagged for Physician
              </span>
              <p className="text-xs font-semibold text-rose-700 mt-0.5">
                {redFlags.join('; ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Compact List */}
      <div className="space-y-1 divide-y divide-slate-100 text-xs">
        {fields.map((field) => {
          const provided = isProvided(field.value);
          if (field.optional && !provided) return null;

          const isRecentlyUpdated = lastUpdatedField === field.key;

          return (
            <div
              key={field.key}
              className={`pt-2.5 pb-2 transition-all duration-300 ${
                isRecentlyUpdated ? 'bg-teal-50/70 -mx-2 px-2 rounded-xl' : ''
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 shrink-0">
                  {provided ? (
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-black">
                      ✓
                    </span>
                  ) : (
                    <span className="inline-flex items-center justify-center w-4 h-4 text-slate-300 text-sm leading-none">
                      ○
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className={`text-xs font-semibold ${provided ? 'text-slate-700' : 'text-slate-500'}`}>
                      {field.label}
                    </span>
                    <span
                      className={`text-[10px] font-bold ${
                        provided ? 'text-emerald-700' : 'text-slate-400 font-normal'
                      }`}
                    >
                      {provided ? '✓ Extracted' : '○ Not provided'}
                    </span>
                  </div>

                  <p
                    className={`mt-0.5 text-xs leading-relaxed ${
                      provided
                        ? 'font-bold text-slate-900'
                        : 'text-slate-400 italic font-normal'
                    }`}
                  >
                    {provided ? field.value : 'Not provided'}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
