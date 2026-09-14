import React, { useState } from 'react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { Check, Edit3, XCircle, Share2, ShieldCheck, CheckCircle2 } from 'lucide-react';

/**
 * Doctor Verification & Sign-off Action Bar.
 * Enforces the core product principle: doctor retains final authority over the clinical record.
 */
export default function VerificationActionBar({
  patientId,
  currentStatus = 'Pending Review',
  onStatusChange,
}) {
  const [modalType, setModalType] = useState(null); // 'verify' | 'edit' | 'reject' | 'fhir'
  const [doctorNotes, setDoctorNotes] = useState('');
  const [fhirSynced, setFhirSynced] = useState(false);

  const handleAction = (status) => {
    onStatusChange?.(status, doctorNotes);
    setModalType(null);
  };

  const handleFhirSync = () => {
    setFhirSynced(true);
    setModalType('fhir');
  };

  return (
    <>
      <div className="sticky bottom-0 z-20 bg-white/95 backdrop-blur-md border-t border-slate-200 px-6 py-4 shadow-lg flex flex-wrap items-center justify-between gap-4">
        {/* Current status display */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase text-slate-500">Record Authority:</span>
            <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
              Dr. S. K. Mehta (MCI-48201)
            </span>
          </div>
          <span className="text-slate-300">|</span>
          <span className="text-xs text-slate-600 font-medium">
            Status: <strong className="text-slate-900">{currentStatus}</strong>
          </span>
        </div>

        {/* Clinical Action Buttons */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="md"
            icon={XCircle}
            onClick={() => setModalType('reject')}
            className="text-rose-700 hover:bg-rose-50 border-rose-200"
          >
            Reject Intake
          </Button>

          <Button
            variant="outline"
            size="md"
            icon={Edit3}
            onClick={() => setModalType('edit')}
          >
            Edit Record
          </Button>

          <Button
            variant="primary"
            size="md"
            icon={Check}
            onClick={() => setModalType('verify')}
            className="bg-emerald-700 hover:bg-emerald-800 border-emerald-800"
          >
            Verify & Accept
          </Button>

          <Button
            variant="outline"
            size="md"
            icon={Share2}
            onClick={handleFhirSync}
            title="Push to Hospital HIS and ABDM / ABHA PHR"
            className="border-slate-300 text-slate-700"
          >
            Push to ABHA
          </Button>
        </div>
      </div>

      {/* Verify Modal */}
      <Modal
        isOpen={modalType === 'verify'}
        onClose={() => setModalType(null)}
        title="Verify & Accept Intake Record"
        subtitle="Confirm that you have reviewed the AI-extracted patient history."
        footer={
          <>
            <Button variant="outline" onClick={() => setModalType(null)}>Cancel</Button>
            <Button variant="success" onClick={() => handleAction('Verified')}>
              Confirm & Sign Record
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-sm text-slate-700">
          <p>
            By verifying, you confirm that you have clinically evaluated the patient's complaints,
            associated history, and flagged alerts. This verified record will form the basis of today's consultation.
          </p>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Physician Consultation Notes / Additions (Optional):
            </label>
            <textarea
              rows={3}
              value={doctorNotes}
              onChange={(e) => setDoctorNotes(e.target.value)}
              placeholder="e.g. Chest auscultation shows bilateral basal crepitations. Requisition for 12-lead ECG issued."
              className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
            />
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={modalType === 'edit'}
        onClose={() => setModalType(null)}
        title="Edit Clinical Intake Summary"
        subtitle="Amend or correct any patient-reported or AI-extracted detail."
        footer={
          <>
            <Button variant="outline" onClick={() => setModalType(null)}>Cancel</Button>
            <Button variant="primary" onClick={() => handleAction('Edited')}>
              Save Clinical Edits
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-sm">
          <p className="text-xs text-slate-500">
            You can overwrite any inaccurate symptom description or amend the clinical summary:
          </p>
          <textarea
            rows={5}
            defaultValue="Patient clarifies that breathlessness only occurs when climbing more than 2 flights of stairs, not at rest. Productive cough ongoing for 10 days."
            className="w-full text-xs p-3 rounded-lg border border-slate-300 font-sans"
          />
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={modalType === 'reject'}
        onClose={() => setModalType(null)}
        title="Reject Pre-Consultation Record"
        subtitle="Mark intake invalid and route patient for fresh history taking."
        footer={
          <>
            <Button variant="outline" onClick={() => setModalType(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => handleAction('Rejected')}>
              Confirm Rejection
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-700">
          Rejecting this intake will archive the AI-generated brief and flag the patient's token for manual bedside history taking.
        </p>
      </Modal>

      {/* FHIR / ABDM Confirmation Modal */}
      <Modal
        isOpen={modalType === 'fhir'}
        onClose={() => setModalType(null)}
        title="ABDM / FHIR Bundle Dispatch (Mocked)"
        subtitle="Interoperable clinical data push to Ayushman Bharat Digital Mission"
        footer={
          <Button variant="primary" onClick={() => setModalType(null)}>
            Done
          </Button>
        }
      >
        <div className="space-y-3">
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-900 text-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>FHIR R4 DiagnosticReport & Encounter payload dispatched successfully to ABHA Gateway.</span>
          </div>
          <div className="bg-slate-900 text-slate-200 p-3 rounded-xl text-xs font-mono overflow-x-auto max-h-48">
            <pre>{`{
  "resourceType": "Bundle",
  "type": "document",
  "timestamp": "2026-09-14T10:15:00Z",
  "identifier": { "system": "https://abdm.gov.in/fhir", "value": "CF-OPD-104" },
  "entry": [
    { "resource": { "resourceType": "Patient", "id": "CF-2026-001", "name": "Ramesh Chandra Sharma" } },
    { "resource": { "resourceType": "Condition", "code": "Cough with dyspnea", "clinicalStatus": "active" } },
    { "resource": { "resourceType": "Verification", "status": "doctor-verified", "practitioner": "Dr. S. K. Mehta" } }
  ]
}`}</pre>
          </div>
        </div>
      </Modal>
    </>
  );
}
