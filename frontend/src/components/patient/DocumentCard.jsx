import React from 'react';
import { FileText, CheckCircle2, AlertCircle, Edit3, Trash2, Clock, Sparkles } from 'lucide-react';

/**
 * Interactive Card for an attached medical document, showing processing status,
 * extraction badges, and review triggers.
 */
export default function DocumentCard({
  document,
  onInspect,
  onDelete
}) {
  const isConfirmed = document.confirmed || document.processing_status === 'confirmed';
  const isProcessing = document.processing_status === 'processing_ocr';

  const medCount = document.medications?.length || 0;
  const labCount = document.lab_findings?.length || 0;

  return (
    <div className={`p-4 sm:p-5 rounded-3xl border-2 transition-all duration-200 ${
      isConfirmed
        ? 'border-teal-300 bg-teal-50/40 shadow-xs'
        : 'border-slate-200 bg-white hover:border-teal-300 shadow-xs'
    }`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Document Icon & Title Info */}
        <div className="flex items-start gap-3.5">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 ${
            document.file_type === 'pdf'
              ? 'bg-rose-100 text-rose-800'
              : 'bg-teal-100 text-teal-800'
          }`}>
            <FileText className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-base font-black text-slate-900 leading-tight">
                {document.title || document.file_name}
              </h4>

              {/* Status Badge */}
              {isConfirmed ? (
                <span className="text-[11px] font-bold text-teal-800 bg-teal-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-teal-700" />
                  Confirmed by Patient
                </span>
              ) : isProcessing ? (
                <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                  <Clock className="w-3 h-3" />
                  Scanning OCR...
                </span>
              ) : (
                <span className="text-[11px] font-bold text-blue-800 bg-blue-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  OCR Extracted
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 font-medium">
              File: <span className="font-semibold text-slate-700">{document.file_name}</span>
              {document.date_detected && (
                <span> • Dated: <strong className="text-slate-800">{document.date_detected}</strong></span>
              )}
            </p>

            {/* Extracted Entity Summary Badges */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {medCount > 0 && (
                <span className="text-[11px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md">
                  💊 {medCount} Meds Extracted
                </span>
              )}
              {labCount > 0 && (
                <span className="text-[11px] font-bold px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded-md">
                  🔬 {labCount} Lab Findings
                </span>
              )}
              {document.confidence_score && (
                <span className="text-[11px] font-bold px-2 py-0.5 bg-purple-50 text-purple-800 border border-purple-200 rounded-md">
                  ⚡ {Math.round(document.confidence_score * 100)}% Confidence
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <button
            type="button"
            onClick={() => onInspect && onInspect(document)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-teal-600 hover:bg-teal-50 text-teal-800 font-bold text-xs transition shadow-2xs cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isConfirmed ? 'Inspect / Edit' : 'Review Extraction'}</span>
          </button>

          <button
            type="button"
            onClick={() => onDelete && onDelete(document.document_id)}
            className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 border border-transparent hover:border-rose-200 transition cursor-pointer"
            title="Delete Document"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
