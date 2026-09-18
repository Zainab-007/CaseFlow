import React, { useState } from 'react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import EditClinicalRecordModal from './EditClinicalRecordModal';
import { Check, Edit3, XCircle, Share2, ShieldCheck, CheckCircle2, Code2, Copy, Loader2, Info } from 'lucide-react';
import { patientService } from '../../services/patientService';

const SpinningLoader = (props) => <Loader2 className="animate-spin" {...props} />;

/**
 * Doctor Verification & Sign-off Action Bar.
 * Enforces the core product principle: doctor retains final authority over the clinical record.
 */
export default function VerificationActionBar({
  patient,
  patientId,
  currentStatus = 'Pending Review',
  onStatusChange,
  onSaveDoctorEdit,
}) {
  const [modalType, setModalType] = useState(null); // 'verify' | 'edit' | 'reject' | 'fhir' | 'fhir_preview'
  const [doctorNotes, setDoctorNotes] = useState('');
  const [isPushing, setIsPushing] = useState(false);
  const [isLoadingFhir, setIsLoadingFhir] = useState(false);
  const [pushResult, setPushResult] = useState(null);
  const [fhirPreviewBundle, setFhirPreviewBundle] = useState(null);
  const [copiedToast, setCopiedToast] = useState(false);

  const handleAction = (status) => {
    onStatusChange?.(status, doctorNotes);
    setModalType(null);
  };

  const handleFhirSync = async () => {
    const targetId = patient?.id || patientId;
    if (!targetId) return;

    try {
      setIsPushing(true);
      const res = await patientService.pushPatientToAbha(targetId);
      setPushResult(res);
      setModalType('fhir');
    } catch (err) {
      console.error('Failed to simulate ABHA push:', err);
    } finally {
      setIsPushing(false);
    }
  };

  const handleViewFhir = async () => {
    const targetId = patient?.id || patientId;
    if (!targetId) return;

    try {
      setIsLoadingFhir(true);
      const bundle = await patientService.getPatientFhirBundle(targetId);
      setFhirPreviewBundle(bundle);
      setModalType('fhir_preview');
    } catch (err) {
      console.error('Failed to load FHIR bundle:', err);
    } finally {
      setIsLoadingFhir(false);
    }
  };

  const handleCopyJson = (data) => {
    try {
      navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2000);
    } catch (err) {
      console.warn('Failed to copy to clipboard:', err);
    }
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
            icon={isLoadingFhir ? SpinningLoader : Code2}
            onClick={handleViewFhir}
            disabled={isLoadingFhir || isPushing}
            title="Inspect FHIR R4 Bundle JSON"
            className="border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            {isLoadingFhir ? 'Loading...' : 'View FHIR'}
          </Button>

          <Button
            variant="outline"
            size="md"
            icon={isPushing ? SpinningLoader : Share2}
            onClick={handleFhirSync}
            disabled={isPushing}
            title="Simulate push to Hospital HIS and ABDM / ABHA PHR"
            className="border-teal-300 text-teal-800 hover:bg-teal-50"
          >
            {isPushing ? 'Pushing...' : 'Push to ABHA'}
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
            <Button variant="outline" onClick={() => setModalType(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => handleAction('Verified')}>
              Sign & Accept
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-700">
            You are verifying this clinical summary as the treating physician. This will stamp your MCI registration number and lock the intake state.
          </p>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="text-xs font-bold text-slate-700">Signing Physician:</span>
            <p className="text-sm font-semibold text-slate-900">Dr. S. K. Mehta</p>
            <p className="text-xs text-slate-500">Reg: MCI-48201 • OPD General Medicine</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Physician Consultation Notes (Optional):
            </label>
            <textarea
              value={doctorNotes}
              onChange={(e) => setDoctorNotes(e.target.value)}
              placeholder="Add physician instructions, differential impressions, or prescription notes..."
              rows={3}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-600 focus:outline-hidden"
            />
          </div>
        </div>
      </Modal>

      {/* Edit Clinical Record Modal */}
      <EditClinicalRecordModal
        isOpen={modalType === 'edit'}
        onClose={() => setModalType(null)}
        patient={patient}
        onSave={(editedData) => {
          onSaveDoctorEdit?.(editedData);
          setModalType(null);
        }}
      />

      {/* Reject Modal */}
      <Modal
        isOpen={modalType === 'reject'}
        onClose={() => setModalType(null)}
        title="Reject Intake Record"
        subtitle="Flag this record as inaccurate or incomplete."
        footer={
          <>
            <Button variant="outline" onClick={() => setModalType(null)}>
              Cancel
            </Button>
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

      {/* Mock ABHA Push Confirmation Modal */}
      <Modal
        isOpen={modalType === 'fhir'}
        onClose={() => setModalType(null)}
        title="Mock ABHA Push Successful"
        subtitle="Simulated ABDM / ABHA Gateway Transmission (Prototype Demonstration)"
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-xs text-slate-500 font-medium">
              Simulation mode — no external network transmission
            </span>
            <Button variant="primary" onClick={() => setModalType(null)}>
              Done
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-left">
          {/* Success Banner */}
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 text-emerald-950 text-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold text-emerald-900 text-sm">Mock ABHA push successful</p>
              <p className="text-emerald-800">
                FHIR Bundle generated and simulated successfully. Payload ready for ABDM Health Information Provider (HIP) gateway.
              </p>
            </div>
          </div>

          {/* Prototype / Simulation Notice */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-900 text-xs font-medium">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <span>
              This is a prototype simulation. No real ABDM sandbox or production network calls were made. No credentials or external transmission occurred.
            </span>
          </div>

          {/* Transaction Metadata Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Mock Transaction ID:</span>
              <code className="bg-white border border-slate-300 px-2 py-0.5 rounded font-mono font-bold text-teal-800">
                {pushResult?.mock_transaction_id || 'TXN-ABHA-MOCK-PENDING'}
              </code>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Pushed Timestamp:</span>
              <span className="font-mono text-slate-700">{pushResult?.pushed_at || new Date().toISOString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Resource Type:</span>
              <span className="font-semibold text-slate-800">Bundle (type: collection)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Status:</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Simulated 200 OK
              </span>
            </div>
          </div>

          {/* FHIR Bundle JSON Viewer */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Generated FHIR R4 Bundle:</span>
              <button
                type="button"
                onClick={() => handleCopyJson(pushResult?.fhir_bundle)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedToast ? 'Copied!' : 'Copy JSON'}</span>
              </button>
            </div>
            <div className="bg-slate-900 text-slate-200 p-3 rounded-xl text-xs font-mono overflow-x-auto max-h-56">
              <pre>{JSON.stringify(pushResult?.fhir_bundle || {}, null, 2)}</pre>
            </div>
          </div>
        </div>
      </Modal>

      {/* Standalone FHIR Bundle Preview Modal */}
      <Modal
        isOpen={modalType === 'fhir_preview'}
        onClose={() => setModalType(null)}
        title="FHIR R4 Bundle Preview"
        subtitle="Interoperable clinical data bundle serialized directly from canonical patient record"
        footer={
          <div className="flex items-center justify-between w-full">
            <button
              type="button"
              onClick={() => handleCopyJson(fhirPreviewBundle)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-800 cursor-pointer"
            >
              <Copy className="w-4 h-4" />
              <span>{copiedToast ? 'Copied to Clipboard!' : 'Copy Bundle JSON'}</span>
            </button>
            <Button variant="primary" onClick={() => setModalType(null)}>
              Close
            </Button>
          </div>
        }
      >
        <div className="space-y-3 text-left">
          <p className="text-xs text-slate-600">
            Standard FHIR R4 collection Bundle mapping Patient demographics, chief complaint, triage vitals, lab findings, medications, documents, and consent.
          </p>
          <div className="bg-slate-900 text-slate-200 p-3.5 rounded-xl text-xs font-mono overflow-x-auto max-h-72">
            <pre>{JSON.stringify(fhirPreviewBundle || {}, null, 2)}</pre>
          </div>
        </div>
      </Modal>
    </>
  );
}
