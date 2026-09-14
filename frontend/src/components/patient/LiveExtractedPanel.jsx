import React from 'react';
import { Activity, MapPin, Clock, Flame, Zap, AlertTriangle, ShieldCheck, HeartPulse, Pill } from 'lucide-react';

/**
 * Live Extracted Clinical Information Panel
 * Visibly mirrors structured medical facts extracted in real-time as the patient speaks or taps.
 */
export default function LiveExtractedPanel({
  chiefComplaint,
  extractedHistory = {},
  redFlags = [],
  lastUpdatedField = null,
  className = ''
}) {
  const items = [
    {
      key: 'chiefComplaint',
      label: 'Chief Complaint (मुख्य समस्या)',
      value: chiefComplaint || 'Listening for complaint...',
      icon: Activity,
      color: 'text-teal-700 bg-teal-50 border-teal-200'
    },
    {
      key: 'site',
      label: 'Site / Location (जगह)',
      value: extractedHistory.site,
      icon: MapPin,
      color: 'text-blue-700 bg-blue-50 border-blue-200'
    },
    {
      key: 'onset',
      label: 'Onset & Duration (अवधि)',
      value: extractedHistory.onset,
      icon: Clock,
      color: 'text-amber-700 bg-amber-50 border-amber-200'
    },
    {
      key: 'character',
      label: 'Pain Character (प्रकृति)',
      value: extractedHistory.character,
      icon: Flame,
      color: 'text-orange-700 bg-orange-50 border-orange-200'
    },
    {
      key: 'aggravatingFactors',
      label: 'Relation to Meals (भोजन से संबंध)',
      value: extractedHistory.aggravatingFactors,
      icon: Zap,
      color: 'text-purple-700 bg-purple-50 border-purple-200',
      showOnlyIfPresent: true
    },
    {
      key: 'radiation',
      label: 'Radiation (दर्द का फैलाव)',
      value: extractedHistory.radiation,
      icon: HeartPulse,
      color: 'text-cyan-700 bg-cyan-50 border-cyan-200'
    },
    {
      key: 'severity',
      label: 'Pain Severity (तीव्रता)',
      value: extractedHistory.severity,
      icon: Activity,
      color: 'text-rose-700 bg-rose-50 border-rose-200'
    },
    {
      key: 'associatedSymptoms',
      label: 'Associated Symptoms (अन्य लक्षण)',
      value: extractedHistory.associatedSymptoms,
      icon: AlertTriangle,
      color: 'text-indigo-700 bg-indigo-50 border-indigo-200'
    },
    {
      key: 'medications',
      label: 'Medications / Allergies (दवाएं)',
      value: extractedHistory.medications,
      icon: Pill,
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200'
    }
  ];

  return (
    <div className={`bg-white rounded-3xl border-2 border-slate-200 p-5 shadow-sm space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
            Live Clinical Notes (लाइव सारांश)
          </h3>
        </div>
        <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
          SOCRATES Engine
        </span>
      </div>

      {/* Red Flag Warning Banner if detected */}
      {redFlags && redFlags.length > 0 ? (
        <div className="p-3 bg-rose-50 border-2 border-rose-300 rounded-2xl animate-bounce-short">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h5 className="text-xs font-black text-rose-900 uppercase tracking-wide">
                Safety Alert: Physician Review Required
              </h5>
              <p className="text-xs font-semibold text-rose-700 mt-0.5">
                {redFlags.join('; ')}
              </p>
              <p className="text-[10px] text-rose-600 mt-1 font-medium">
                CaseFlow operates with conservative non-diagnostic safety guardrails.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-2.5 bg-emerald-50/60 border border-emerald-200/80 rounded-xl flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="text-xs font-medium text-emerald-800">
            No emergency triage red-flags currently identified.
          </span>
        </div>
      )}

      {/* Extracted Entity Cards */}
      <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
        {items.map((item) => {
          const isProvided = item.value && item.value !== 'Not yet specified' && item.value !== 'Not yet provided';
          if (item.showOnlyIfPresent && !isProvided) return null;

          const isRecentlyUpdated = lastUpdatedField === item.key;
          const Icon = item.icon;

          return (
            <div
              key={item.key}
              className={`p-3 rounded-2xl border transition-all duration-300 ${
                isRecentlyUpdated
                  ? 'ring-2 ring-teal-500 scale-[1.01] bg-teal-50/80 border-teal-300'
                  : isProvided
                  ? 'bg-slate-50/90 border-slate-200'
                  : 'bg-slate-50/40 border-dashed border-slate-200 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    {item.label}
                  </span>
                </div>
                {isProvided && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                    Extracted
                  </span>
                )}
              </div>
              <p className={`text-sm font-bold mt-1 ${isProvided ? 'text-slate-900' : 'text-slate-400 italic'}`}>
                {item.value || 'Pending answer...'}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
