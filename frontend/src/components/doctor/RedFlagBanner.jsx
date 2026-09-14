import React from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2 } from 'lucide-react';

/**
 * Auditable Red-Flag Clinical Alert Component.
 * Implements the hybrid rule + NLP alert layer specified in SIH26047.
 * Does NOT state a definitive medical diagnosis — only flags symptoms for physician review.
 */
export default function RedFlagBanner({ redFlag }) {
  if (!redFlag || !redFlag.detected) {
    return (
      <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 flex items-center gap-3 text-emerald-900 text-xs">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
        <span className="font-semibold">No critical red-flag triggers identified in pre-consultation intake.</span>
      </div>
    );
  }

  return (
    <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-5 shadow-xs">
      <div className="flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm">
          <ShieldAlert className="w-6 h-6" />
        </div>

        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="bg-rose-600 text-white text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md">
              Clinical Alert: Physician Review Recommended
            </span>
            <span className="text-xs font-medium text-rose-800 bg-rose-100 px-2 py-0.5 rounded-md">
              Hybrid Safety Logic (OR Rule)
            </span>
          </div>

          <h4 className="text-base font-bold text-rose-950 mt-1">
            {redFlag.title}
          </h4>

          {/* Auditable Trigger Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 pt-3 border-t border-rose-200/80 text-xs text-rose-900">
            {redFlag.rule_trigger && (
              <div className="bg-white/80 p-2.5 rounded-lg border border-rose-200">
                <span className="font-bold block text-rose-950 mb-0.5">Deterministic Safety Rule:</span>
                <span>{redFlag.rule_trigger}</span>
              </div>
            )}
            {redFlag.nlp_trigger && (
              <div className="bg-white/80 p-2.5 rounded-lg border border-rose-200">
                <span className="font-bold block text-rose-950 mb-0.5">NLP Symptom Extraction:</span>
                <span>{redFlag.nlp_trigger}</span>
              </div>
            )}
          </div>

          {redFlag.physician_action && (
            <div className="mt-3 text-xs font-semibold text-rose-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Recommended Action: {redFlag.physician_action}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
