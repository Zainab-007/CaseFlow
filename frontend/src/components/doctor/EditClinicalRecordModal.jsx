import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import {
  Activity,
  Pill,
  FileText,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  Save,
  CheckCircle2
} from 'lucide-react';

export default function EditClinicalRecordModal({
  isOpen,
  onClose,
  patient,
  onSave
}) {
  const [activeTab, setActiveTab] = useState('clinical'); // 'clinical' | 'medications' | 'labs'
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Form state
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [hpi, setHpi] = useState({
    onset: '',
    severity: '',
    character: '',
    aggravating_factors: '',
    relieving_factors: '',
    sputum: ''
  });
  const [pastMedical, setPastMedical] = useState([]);
  const [allergies, setAllergies] = useState([]);
  const [medications, setMedications] = useState([]);
  const [labs, setLabs] = useState([]);

  // Populate from patient prop when opened
  useEffect(() => {
    if (patient && isOpen) {
      setError(null);
      setSaving(false);
      setActiveTab('clinical');

      const compTitle =
        typeof patient.chief_complaint === 'object' && patient.chief_complaint !== null
          ? patient.chief_complaint.title
          : patient.chief_complaint || '';
      setChiefComplaint(compTitle);

      const pHpi = patient.structured_history?.hpi || {};
      setHpi({
        onset: pHpi.onset || '',
        severity: pHpi.severity || '',
        character: pHpi.character || compTitle,
        aggravating_factors: pHpi.aggravating_factors || '',
        relieving_factors: pHpi.relieving_factors || '',
        sputum: pHpi.sputum || ''
      });

      const pPast = patient.structured_history?.past_medical_history || [];
      setPastMedical(pPast.map(p => typeof p === 'string' ? { condition: p, diagnosed: '', control: '' } : { ...p }));

      const pAllergies = patient.structured_history?.allergies || [];
      setAllergies(pAllergies.map(a => typeof a === 'string' ? { allergen: a, reaction: '', severity: 'Moderate' } : { ...a }));

      const pMeds = patient.structured_history?.current_medications || patient.medications || [];
      setMedications(pMeds.map(m => ({
        name: m.name || '',
        dose: m.dose || m.dosage || '',
        frequency: m.frequency || '',
        duration: m.duration || '',
        source: m.source || 'patient-reported',
        verified_by: m.verified_by || null
      })));

      const pLabs = patient.structured_history?.labs || patient.labs || [];
      setLabs(pLabs.map(l => ({
        parameter: l.parameter || l.name || '',
        name: l.parameter || l.name || '',
        value: String(l.value ?? ''),
        unit: l.unit || '',
        status: l.status || 'Normal',
        reference_range: l.reference_range || '',
        source: l.source || 'ocr',
        verified_by: l.verified_by || null
      })));
    }
  }, [patient, isOpen]);

  // Past medical history handlers
  const handleAddPastCondition = () => {
    setPastMedical([...pastMedical, { condition: '', diagnosed: '', control: '', source: 'doctor' }]);
  };
  const handleUpdatePastCondition = (idx, field, val) => {
    const updated = [...pastMedical];
    updated[idx][field] = val;
    setPastMedical(updated);
  };
  const handleRemovePastCondition = (idx) => {
    setPastMedical(pastMedical.filter((_, i) => i !== idx));
  };

  // Allergies handlers
  const handleAddAllergy = () => {
    setAllergies([...allergies, { allergen: '', reaction: '', severity: 'Moderate', source: 'doctor' }]);
  };
  const handleUpdateAllergy = (idx, field, val) => {
    const updated = [...allergies];
    updated[idx][field] = val;
    setAllergies(updated);
  };
  const handleRemoveAllergy = (idx) => {
    setAllergies(allergies.filter((_, i) => i !== idx));
  };

  // Medication handlers
  const handleAddMedication = () => {
    setMedications([...medications, {
      name: '',
      dose: '',
      frequency: '',
      duration: '',
      source: 'doctor',
      verified_by: 'doctor'
    }]);
  };
  const handleUpdateMedication = (idx, field, val) => {
    const updated = [...medications];
    updated[idx][field] = val;
    setMedications(updated);
  };
  const handleRemoveMedication = (idx) => {
    setMedications(medications.filter((_, i) => i !== idx));
  };

  // Lab handlers
  const handleAddLab = () => {
    setLabs([...labs, {
      parameter: '',
      name: '',
      value: '',
      unit: '',
      status: 'Normal',
      source: 'doctor',
      verified_by: 'doctor'
    }]);
  };
  const handleUpdateLab = (idx, field, val) => {
    const updated = [...labs];
    updated[idx][field] = val;
    if (field === 'parameter') updated[idx].name = val;
    setLabs(updated);
  };
  const handleRemoveLab = (idx) => {
    setLabs(labs.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!chiefComplaint.trim()) {
      setError('Chief complaint cannot be empty.');
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      chief_complaint: chiefComplaint.trim(),
      hpi: {
        ...hpi,
        character: chiefComplaint.trim()
      },
      past_medical_history: pastMedical.filter(p => p.condition && p.condition.trim()),
      allergies: allergies.filter(a => a.allergen && a.allergen.trim()),
      current_medications: medications.filter(m => m.name && m.name.trim()),
      labs: labs.filter(l => (l.parameter || l.name) && (l.parameter || l.name).trim())
    };

    try {
      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save clinical edits. Please check network connection.');
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Clinical Record"
      subtitle={`Physician editing authority for ${patient?.name || 'Patient'} (${patient?.id || ''})`}
      maxWidth="max-w-3xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-slate-500 font-medium">
            {error && (
              <span className="text-rose-600 flex items-center gap-1 font-semibold">
                <AlertCircle className="w-4 h-4" /> {error}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={saving ? Loader2 : Save}
              onClick={handleSave}
              disabled={saving}
              className="bg-teal-700 hover:bg-teal-800"
            >
              {saving ? 'Saving Changes...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('clinical')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'clinical'
                ? 'bg-teal-50 text-teal-800 border border-teal-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Clinical Info & HPI
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('medications')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'medications'
                ? 'bg-teal-50 text-teal-800 border border-teal-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Pill className="w-3.5 h-3.5" />
            Medications ({medications.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('labs')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'labs'
                ? 'bg-teal-50 text-teal-800 border border-teal-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Lab Findings ({labs.length})
          </button>
        </div>

        {/* Tab 1: Clinical Info & HPI */}
        {activeTab === 'clinical' && (
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Chief Complaint <span className="text-rose-500">*</span>:
              </label>
              <input
                type="text"
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                placeholder="e.g. Persistent productive cough, progressive dyspnea"
                className="w-full p-2.5 rounded-lg border border-slate-300 font-medium text-slate-900 focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
              />
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-3">
              <span className="font-bold text-slate-700 uppercase tracking-wider block text-[11px]">
                History of Present Illness (HPI)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Onset & Duration:</label>
                  <input
                    type="text"
                    value={hpi.onset}
                    onChange={(e) => setHpi({ ...hpi, onset: e.target.value })}
                    placeholder="e.g. Gradual onset over 10 days"
                    className="w-full p-2 rounded-md border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Severity & Impact:</label>
                  <input
                    type="text"
                    value={hpi.severity}
                    onChange={(e) => setHpi({ ...hpi, severity: e.target.value })}
                    placeholder="e.g. Moderate (6/10)"
                    className="w-full p-2 rounded-md border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Aggravating Factors:</label>
                  <input
                    type="text"
                    value={hpi.aggravating_factors}
                    onChange={(e) => setHpi({ ...hpi, aggravating_factors: e.target.value })}
                    placeholder="e.g. Climbing stairs, cold weather"
                    className="w-full p-2 rounded-md border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Relieving Factors:</label>
                  <input
                    type="text"
                    value={hpi.relieving_factors}
                    onChange={(e) => setHpi({ ...hpi, relieving_factors: e.target.value })}
                    placeholder="e.g. Resting sitting upright"
                    className="w-full p-2 rounded-md border border-slate-300 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Past Medical History */}
            <div className="border border-slate-200 p-3 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  Past Medical History
                </span>
                <button
                  type="button"
                  onClick={handleAddPastCondition}
                  className="text-teal-700 font-bold hover:text-teal-800 flex items-center gap-1 text-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Condition
                </button>
              </div>
              {pastMedical.length === 0 ? (
                <p className="text-slate-400 italic text-[11px]">No conditions added.</p>
              ) : (
                <div className="space-y-2">
                  {pastMedical.map((pm, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={pm.condition || ''}
                        onChange={(e) => handleUpdatePastCondition(idx, 'condition', e.target.value)}
                        placeholder="Condition (e.g. Type 2 Diabetes)"
                        className="flex-1 p-1.5 rounded-md border border-slate-300 text-xs"
                      />
                      <input
                        type="text"
                        value={pm.diagnosed || ''}
                        onChange={(e) => handleUpdatePastCondition(idx, 'diagnosed', e.target.value)}
                        placeholder="Year (e.g. 2018)"
                        className="w-24 p-1.5 rounded-md border border-slate-300 text-xs"
                      />
                      <input
                        type="text"
                        value={pm.control || ''}
                        onChange={(e) => handleUpdatePastCondition(idx, 'control', e.target.value)}
                        placeholder="Control (e.g. Fair)"
                        className="w-28 p-1.5 rounded-md border border-slate-300 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePastCondition(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Allergies */}
            <div className="border border-slate-200 p-3 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  Allergies & Sensitivities
                </span>
                <button
                  type="button"
                  onClick={handleAddAllergy}
                  className="text-teal-700 font-bold hover:text-teal-800 flex items-center gap-1 text-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Allergy
                </button>
              </div>
              {allergies.length === 0 ? (
                <p className="text-slate-400 italic text-[11px]">No known drug allergies reported (NKDA).</p>
              ) : (
                <div className="space-y-2">
                  {allergies.map((all, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={all.allergen || ''}
                        onChange={(e) => handleUpdateAllergy(idx, 'allergen', e.target.value)}
                        placeholder="Allergen (e.g. Penicillin)"
                        className="flex-1 p-1.5 rounded-md border border-slate-300 text-xs"
                      />
                      <input
                        type="text"
                        value={all.reaction || ''}
                        onChange={(e) => handleUpdateAllergy(idx, 'reaction', e.target.value)}
                        placeholder="Reaction (e.g. Urticaria)"
                        className="flex-1 p-1.5 rounded-md border border-slate-300 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveAllergy(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Medications */}
        {activeTab === 'medications' && (
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                Reconciled Daily Medications
              </span>
              <Button
                variant="outline"
                size="sm"
                icon={Plus}
                onClick={handleAddMedication}
                className="text-teal-700 border-teal-200"
              >
                Add Medication
              </Button>
            </div>

            {medications.length === 0 ? (
              <p className="text-slate-400 italic text-center py-6">No current medications listed.</p>
            ) : (
              <div className="space-y-2.5">
                {medications.map((med, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col md:flex-row md:items-center gap-2.5"
                  >
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block">Drug Name</label>
                        <input
                          type="text"
                          value={med.name}
                          onChange={(e) => handleUpdateMedication(idx, 'name', e.target.value)}
                          placeholder="e.g. Paracetamol"
                          className="w-full p-1.5 rounded border border-slate-300 font-semibold text-slate-800 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block">Dose</label>
                        <input
                          type="text"
                          value={med.dose}
                          onChange={(e) => handleUpdateMedication(idx, 'dose', e.target.value)}
                          placeholder="e.g. 500 mg"
                          className="w-full p-1.5 rounded border border-slate-300 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block">Frequency</label>
                        <input
                          type="text"
                          value={med.frequency}
                          onChange={(e) => handleUpdateMedication(idx, 'frequency', e.target.value)}
                          placeholder="e.g. Twice daily"
                          className="w-full p-1.5 rounded border border-slate-300 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block">Duration</label>
                        <input
                          type="text"
                          value={med.duration}
                          onChange={(e) => handleUpdateMedication(idx, 'duration', e.target.value)}
                          placeholder="e.g. 5 days"
                          className="w-full p-1.5 rounded border border-slate-300 text-xs"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200">
                      <Badge
                        variant={med.source === 'ocr' || med.source === 'document' ? 'source-doc' : (med.source === 'doctor' ? 'verified' : 'source-patient')}
                        size="sm"
                      >
                        {med.source === 'ocr' || med.source === 'document' ? 'Source: Document' : (med.source === 'doctor' ? 'Source: Doctor' : 'Source: Patient')}
                      </Badge>

                      <button
                        type="button"
                        onClick={() => handleRemoveMedication(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1 transition"
                        title="Remove medication"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Labs */}
        {activeTab === 'labs' && (
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                Laboratory & Diagnostic Investigations
              </span>
              <Button
                variant="outline"
                size="sm"
                icon={Plus}
                onClick={handleAddLab}
                className="text-teal-700 border-teal-200"
              >
                Add Lab Finding
              </Button>
            </div>

            {labs.length === 0 ? (
              <p className="text-slate-400 italic text-center py-6">No laboratory findings recorded.</p>
            ) : (
              <div className="space-y-2.5">
                {labs.map((lab, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col md:flex-row md:items-center gap-2.5"
                  >
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block">Test Name</label>
                        <input
                          type="text"
                          value={lab.parameter || lab.name}
                          onChange={(e) => handleUpdateLab(idx, 'parameter', e.target.value)}
                          placeholder="e.g. Hemoglobin"
                          className="w-full p-1.5 rounded border border-slate-300 font-semibold text-slate-800 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block">Value</label>
                        <input
                          type="text"
                          value={lab.value}
                          onChange={(e) => handleUpdateLab(idx, 'value', e.target.value)}
                          placeholder="e.g. 13.8"
                          className="w-full p-1.5 rounded border border-slate-300 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block">Unit</label>
                        <input
                          type="text"
                          value={lab.unit}
                          onChange={(e) => handleUpdateLab(idx, 'unit', e.target.value)}
                          placeholder="e.g. g/dL"
                          className="w-full p-1.5 rounded border border-slate-300 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block">Status</label>
                        <select
                          value={lab.status}
                          onChange={(e) => handleUpdateLab(idx, 'status', e.target.value)}
                          className="w-full p-1.5 rounded border border-slate-300 text-xs bg-white"
                        >
                          <option value="Normal">Normal</option>
                          <option value="High">High</option>
                          <option value="Low">Low</option>
                          <option value="Critical">Critical</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200">
                      <Badge
                        variant={lab.source === 'ocr' || lab.source === 'document' ? 'source-doc' : 'verified'}
                        size="sm"
                      >
                        {lab.source === 'ocr' || lab.source === 'document' ? 'Source: Document' : 'Source: Doctor'}
                      </Badge>

                      <button
                        type="button"
                        onClick={() => handleRemoveLab(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1 transition"
                        title="Remove lab finding"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
