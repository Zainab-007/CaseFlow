import React from 'react';
import { CheckCircle2, AlertTriangle, ArrowRight, RotateCcw, FileText } from 'lucide-react';
import Button from '../ui/Button';

/**
 * Interview Summary Modal
 * Shows structured findings before advancing to medical documents upload.
 */
export default function InterviewSummaryModal({
  isOpen,
  chiefComplaint,
  extractedHistory = {},
  redFlags = [],
  onConfirm,
  onEdit
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">
              Interview Complete (बातचीत पूरी हुई)
            </h3>
            <p className="text-xs sm:text-sm font-semibold text-slate-500">
              Review your structured clinical information before continuing
            </p>
          </div>
        </div>

        {/* Red Flag Alert if present */}
        {redFlags && redFlags.length > 0 && (
          <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-black text-rose-900 uppercase tracking-wide">
                  Clinical Alert Flagged for Physician
                </h4>
                <p className="text-xs font-semibold text-rose-700 mt-1">
                  {redFlags.join(', ')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Structured Summary Card */}
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider pb-2 border-b border-slate-200">
            <FileText className="w-4 h-4 text-teal-600" />
            <span>Doctor Briefing Card (डॉक्टर हेतु सारांश)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="font-semibold text-slate-500">Chief Complaint:</span>
              <p className="font-black text-slate-900 text-sm mt-0.5">{chiefComplaint || 'Abdominal pain'}</p>
            </div>
            <div>
              <span className="font-semibold text-slate-500">Pain Location:</span>
              <p className="font-black text-slate-900 text-sm mt-0.5">{extractedHistory.site || 'Upper abdomen'}</p>
            </div>
            <div>
              <span className="font-semibold text-slate-500">Duration:</span>
              <p className="font-bold text-slate-900 mt-0.5">{extractedHistory.onset || '3-4 days'}</p>
            </div>
            <div>
              <span className="font-semibold text-slate-500">Character:</span>
              <p className="font-bold text-slate-900 mt-0.5">{extractedHistory.character || 'Burning'}</p>
            </div>
            <div>
              <span className="font-semibold text-slate-500">Meal Relationship:</span>
              <p className="font-bold text-slate-900 mt-0.5">{extractedHistory.aggravatingFactors || 'N/A'}</p>
            </div>
            <div>
              <span className="font-semibold text-slate-500">Radiation:</span>
              <p className="font-bold text-slate-900 mt-0.5">{extractedHistory.radiation || 'None'}</p>
            </div>
            <div>
              <span className="font-semibold text-slate-500">Severity:</span>
              <p className="font-bold text-slate-900 mt-0.5">{extractedHistory.severity || '6/10'}</p>
            </div>
            <div>
              <span className="font-semibold text-slate-500">Associated Symptoms:</span>
              <p className="font-bold text-slate-900 mt-0.5">{extractedHistory.associatedSymptoms || 'None'}</p>
            </div>
            <div className="sm:col-span-2">
              <span className="font-semibold text-slate-500">Medications & Allergies:</span>
              <p className="font-bold text-slate-900 mt-0.5">{extractedHistory.medications || 'None reported'}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            size="lg"
            icon={RotateCcw}
            onClick={onEdit}
            className="w-full sm:w-auto"
          >
            Edit Answers (बदलाव करें)
          </Button>

          <Button
            type="button"
            variant="kiosk"
            size="lg"
            icon={ArrowRight}
            iconPosition="right"
            onClick={onConfirm}
            className="w-full sm:w-auto min-w-[220px]"
          >
            Confirm & Continue (आगे बढ़ें)
          </Button>
        </div>
      </div>
    </div>
  );
}
