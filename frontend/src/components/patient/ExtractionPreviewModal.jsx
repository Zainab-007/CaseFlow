import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Pill,
  Activity,
  Plus,
  Trash2,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import Button from '../ui/Button';

/**
 * Extraction Preview & Patient Correction Modal
 * Allows patients to verify, correct, or remove OCR-extracted medications and lab values.
 */
export default function ExtractionPreviewModal({
  isOpen,
  document,
  onClose,
  onConfirm
}) {
  const [medications, setMedications] = useState([]);
  const [labFindings, setLabFindings] = useState([]);
  const [showRawText, setShowRawText] = useState(false);
  const [newMedName, setNewMedName] = useState('');
  const [newMedDose, setNewMedDose] = useState('');

  useEffect(() => {
    if (document) {
      setMedications(document.medications ? [...document.medications] : []);
      setLabFindings(document.lab_findings ? [...document.lab_findings] : []);
      setShowRawText(false);
    }
  }, [document]);

  if (!isOpen || !document) return null;

  const handleMedChange = (index, field, value) => {
    const updated = [...medications];
    updated[index][field] = value;
    setMedications(updated);
  };

  const handleRemoveMed = (index) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const handleAddMedication = () => {
    if (!newMedName.trim()) return;
    setMedications([
      ...medications,
      {
        name: newMedName.trim(),
        dose: newMedDose.trim() || 'Standard dose',
        frequency: 'Once daily',
        confidence: 1.0
      }
    ]);
    setNewMedName('');
    setNewMedDose('');
  };

  const handleLabChange = (index, field, value) => {
    const updated = [...labFindings];
    updated[index][field] = value;
    setLabFindings(updated);
  };

  const handleRemoveLab = (index) => {
    setLabFindings(labFindings.filter((_, i) => i !== index));
  };

  const handleSaveAndConfirm = () => {
    if (onConfirm) {
      onConfirm(document.document_id, {
        medications,
        lab_findings: labFindings,
        confirmed: true
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                  Verify Extracted Details
                </h3>
                <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  {Math.round((document.confidence_score || 0.94) * 100)}% Confidence
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-0.5">
                {document.title || document.file_name} • Dated: {document.date_detected || 'Recent'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informational Guidance */}
        <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-2xl flex items-start gap-2.5 text-xs text-teal-900 font-medium">
          <Sparkles className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
          <span>
            CaseFlow automatically identified the following clinical items. You can edit any value, remove mistakes, or add missing medications.
          </span>
        </div>

        {/* SECTION 1: Extracted Medications */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Pill className="w-3.5 h-3.5 text-teal-700" />
              <span>Extracted Medications (दवाइयाँ — {medications.length})</span>
            </h4>
          </div>

          {medications.length > 0 ? (
            <div className="space-y-2">
              {medications.map((med, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-2.5"
                >
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={med.name}
                      onChange={(e) => handleMedChange(idx, 'name', e.target.value)}
                      placeholder="Drug Name"
                      className="text-xs font-bold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-teal-600"
                    />
                    <input
                      type="text"
                      value={med.dose || ''}
                      onChange={(e) => handleMedChange(idx, 'dose', e.target.value)}
                      placeholder="Dose (e.g. 40mg)"
                      className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-teal-600"
                    />
                    <input
                      type="text"
                      value={med.frequency || ''}
                      onChange={(e) => handleMedChange(idx, 'frequency', e.target.value)}
                      placeholder="Frequency (e.g. Once daily)"
                      className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-teal-600"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveMed(idx)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white transition cursor-pointer"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No medications detected in this document.</p>
          )}

          {/* Add Medication Row */}
          <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
            <input
              type="text"
              value={newMedName}
              onChange={(e) => setNewMedName(e.target.value)}
              placeholder="+ Add missing drug name"
              className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white w-full sm:w-1/2 focus:outline-teal-600"
            />
            <input
              type="text"
              value={newMedDose}
              onChange={(e) => setNewMedDose(e.target.value)}
              placeholder="Dose (e.g. 500mg)"
              className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white w-full sm:w-1/3 focus:outline-teal-600"
            />
            <button
              type="button"
              onClick={handleAddMedication}
              className="text-xs font-bold px-3 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white transition flex items-center justify-center gap-1 w-full sm:w-auto shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          </div>
        </div>

        {/* SECTION 2: Extracted Lab Findings */}
        {labFindings.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-blue-700" />
              <span>Laboratory Results & Biomarkers ({labFindings.length})</span>
            </h4>

            <div className="space-y-2">
              {labFindings.map((lab, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{lab.parameter}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        lab.status === 'Elevated'
                          ? 'bg-rose-100 text-rose-800'
                          : lab.status === 'Low'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {lab.status || 'Normal'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="text"
                        value={lab.value}
                        onChange={(e) => handleLabChange(idx, 'value', e.target.value)}
                        className="text-xs font-bold px-2 py-1 rounded border border-slate-200 bg-white w-20 focus:outline-teal-600"
                      />
                      <span className="text-xs text-slate-500 font-semibold">{lab.unit}</span>
                      {lab.reference_range && (
                        <span className="text-[11px] text-slate-400 font-medium">
                          (Ref: {lab.reference_range})
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveLab(idx)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white transition cursor-pointer"
                    title="Remove finding"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Collapsible Raw Text View */}
        {document.raw_text && (
          <div className="border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={() => setShowRawText(!showRawText)}
              className="flex items-center justify-between w-full text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              <span>View Raw OCR Document Text</span>
              {showRawText ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showRawText && (
              <pre className="mt-2 p-3 bg-slate-100 rounded-xl text-[11px] text-slate-700 font-mono whitespace-pre-wrap max-h-36 overflow-y-auto">
                {document.raw_text}
              </pre>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="kiosk"
            size="lg"
            icon={CheckCircle2}
            onClick={handleSaveAndConfirm}
            className="w-full sm:w-auto min-w-[220px]"
          >
            Confirm & Save (पुष्टि करें)
          </Button>
        </div>
      </div>
    </div>
  );
}
