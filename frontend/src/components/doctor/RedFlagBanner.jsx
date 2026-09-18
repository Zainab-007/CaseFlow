import React from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, Eye, Clock, Check } from 'lucide-react';

/**
 * Auditable Red-Flag Clinical Alert Component with Lifecycle Management (SIH26047).
 * Lifecycle: ACTIVE -> REVIEWED -> RESOLVED
 * Does NOT state a definitive medical diagnosis — only flags symptoms for physician review.
 * Doctor retains final clinical authority.
 */
export default function RedFlagBanner({ redFlag, redFlags = [], onUpdateStatus, isUpdating = false }) {
  // Normalize flags list
  const flags = (Array.isArray(redFlags) && redFlags.length > 0
    ? redFlags
    : (redFlag && redFlag.detected ? [redFlag] : [])
  ).filter(Boolean);

  if (flags.length === 0) {
    return (
      <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 flex items-center gap-3 text-emerald-900 text-xs">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
        <span className="font-semibold">No critical red-flag triggers identified in pre-consultation intake.</span>
      </div>
    );
  }

  const hasActive = flags.some((f) => (f?.status || 'ACTIVE').toUpperCase() === 'ACTIVE');
  const allResolved = flags.length > 0 && flags.every((f) => (f?.status || '').toUpperCase() === 'RESOLVED');

  const containerClasses = allResolved
    ? 'bg-slate-50 border-2 border-slate-300 rounded-2xl p-5 shadow-xs'
    : hasActive
    ? 'bg-rose-50 border-2 border-rose-300 rounded-2xl p-5 shadow-xs'
    : 'bg-blue-50/80 border-2 border-blue-200 rounded-2xl p-5 shadow-xs';

  const iconBgClasses = allResolved
    ? 'bg-slate-600 text-white'
    : hasActive
    ? 'bg-rose-600 text-white'
    : 'bg-blue-600 text-white';

  return (
    <div className={containerClasses}>
      <div className="flex items-start gap-3.5">
        <div className={`w-10 h-10 rounded-xl ${iconBgClasses} flex items-center justify-center shrink-0 shadow-sm mt-0.5`}>
          <ShieldAlert className="w-6 h-6" />
        </div>

        <div className="flex-1 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md ${
                allResolved ? 'bg-slate-700 text-white' : (hasActive ? 'bg-rose-600 text-white' : 'bg-blue-700 text-white')
              }`}>
                {allResolved ? 'Clinical Alert: Resolved' : 'Clinical Alert: Physician Review Recommended'}
              </span>
              <span className="text-xs font-medium text-slate-600 bg-white/80 px-2 py-0.5 rounded-md border border-slate-200">
                Hybrid Safety Logic (OR Rule)
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              Administrative Safety Review Workflow
            </span>
          </div>

          {flags.map((rf, idx) => {
            const status = (rf?.status || 'ACTIVE').toUpperCase();
            const rfId = rf?.id || `RF-${idx + 1}`;
            const isCurrentUpdating = isUpdating === rfId || isUpdating === true;

            return (
              <div key={rfId || idx} className="space-y-3 pt-1">
                {/* Header row with Title, Status Badge, and Action Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {status === 'ACTIVE' && (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-600 text-white shadow-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          Active
                        </span>
                      )}
                      {status === 'REVIEWED' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-300">
                          <Check className="w-3 h-3 text-blue-700" />
                          Reviewed
                        </span>
                      )}
                      {status === 'RESOLVED' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                          Resolved
                        </span>
                      )}

                      {rf?.id && (
                        <span className="font-mono text-[10px] text-slate-500 bg-white/70 px-1.5 py-0.5 rounded border border-slate-200">
                          {rf.id}
                        </span>
                      )}
                    </div>

                    <h4 className={`text-base font-bold ${
                      allResolved ? 'text-slate-800' : 'text-rose-950'
                    }`}>
                      {rf?.title || rf?.message}
                    </h4>
                  </div>

                  {/* Lifecycle Action Buttons */}
                  <div className="shrink-0 flex items-center gap-2">
                    {status === 'ACTIVE' && (
                      <button
                        type="button"
                        onClick={() => onUpdateStatus && onUpdateStatus(rfId, 'REVIEWED')}
                        disabled={isCurrentUpdating}
                        className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-50"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{isCurrentUpdating ? 'Updating...' : 'Mark as Reviewed'}</span>
                      </button>
                    )}

                    {status === 'REVIEWED' && (
                      <button
                        type="button"
                        onClick={() => onUpdateStatus && onUpdateStatus(rfId, 'RESOLVED')}
                        disabled={isCurrentUpdating}
                        className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isCurrentUpdating ? 'Updating...' : 'Mark as Resolved'}</span>
                      </button>
                    )}

                    {status === 'RESOLVED' && (
                      <span className="text-xs text-slate-500 font-medium italic flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline" />
                        Resolved
                      </span>
                    )}
                  </div>
                </div>

                {/* Audit & Transition Trail Info */}
                {(rf.reviewed_by || rf.resolved_by) && (
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600 bg-white/60 p-2 rounded-lg border border-slate-200/70 font-medium">
                    {rf.reviewed_by && (
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3 text-blue-600" />
                        Reviewed by: <strong>{rf.reviewed_by}</strong>
                      </span>
                    )}
                    {rf.resolved_by && (
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Resolved by: <strong>{rf.resolved_by}</strong>
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 italic">
                      (Does not replace clinical diagnostic evaluation)
                    </span>
                  </div>
                )}

                {/* Auditable Trigger Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-200/80 text-xs text-slate-800">
                  {rf.rule_trigger && (
                    <div className="bg-white/90 p-2.5 rounded-xl border border-slate-200">
                      <span className="font-bold block text-slate-900 mb-0.5">Deterministic Safety Rule:</span>
                      <span>{rf.rule_trigger}</span>
                    </div>
                  )}
                  {rf.nlp_trigger && (
                    <div className="bg-white/90 p-2.5 rounded-xl border border-slate-200">
                      <span className="font-bold block text-slate-900 mb-0.5">NLP Symptom Extraction:</span>
                      <span>{rf.nlp_trigger}</span>
                    </div>
                  )}
                </div>

                {rf.physician_action && (
                  <div className="text-xs font-semibold text-rose-900 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Recommended Action: {rf.physician_action}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
