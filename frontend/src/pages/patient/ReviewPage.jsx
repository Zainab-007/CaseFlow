import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import AudioPromptBar from '../../components/patient/AudioPromptBar';
import { documentService } from '../../services/documentService';
import { patientService } from '../../services/patientService';
import {
  CheckCircle2,
  Ticket,
  ArrowLeft,
  RotateCcw,
  Clock,
  MapPin,
  FileCheck,
  Pill,
  Activity
} from 'lucide-react';

export default function ReviewPage() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [countdown, setCountdown] = useState(15);
  const [documents, setDocuments] = useState([]);
  const [patient, setPatient] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const patientId = patientService.getCurrentPatientId();
        const [patData, docs] = await Promise.all([
          patientService.getPatient(patientId),
          documentService.getPatientDocuments(patientId)
        ]);
        if (isMounted) {
          setPatient(patData);
          setDocuments(docs || []);
        }
      } catch (err) {
        console.error('Error fetching review data:', err);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = () => {
    setSubmitted(true);
    // Simulate auto-reset countdown for shared kiosk privacy
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/patient');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Compute aggregated extracted entities across confirmed documents
  const allMeds = documents.flatMap((d) => d.medications || []);
  const allLabs = documents.flatMap((d) => d.lab_findings || []);

  if (submitted) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center text-center max-w-xl mx-auto w-full py-6 space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-md">
          <CheckCircle2 className="w-12 h-12" />
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
            Intake Completed Successfully
          </span>
          <h2 className="text-3xl font-black text-slate-900 mt-2">
            Your Information is Ready for the Doctor
          </h2>
          <p className="text-base text-slate-600 font-medium mt-1">
            आपकी जानकारी डॉक्टर को भेज दी गई है।
          </p>
        </div>

        {/* Printed OPD Token Card */}
        <div className="bg-white border-2 border-dashed border-teal-500 rounded-3xl p-6 sm:p-8 w-full shadow-lg text-left relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-teal-700 text-white text-[11px] font-bold px-4 py-1 rounded-bl-xl uppercase tracking-wider">
            OPD Intake Token
          </div>

          <div className="flex items-center gap-3 mb-4">
            <Ticket className="w-8 h-8 text-teal-700" />
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Queue Token</p>
              <h3 className="text-3xl sm:text-4xl font-black text-teal-900 font-mono">
                {patient?.queue_token || 'CF-OPD-104'}
              </h3>
            </div>
          </div>

          <div className="space-y-2 border-t border-slate-100 pt-4 text-sm text-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-500">Patient:</span>
              <strong className="text-slate-900">
                {patient?.name || patient?.demographics?.name || 'Patient'} ({patient?.age || patient?.demographics?.age || '—'}y / {patient?.gender?.[0] || '—'})
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Department:</span>
              <strong className="text-slate-900">{patient?.department || 'General Medicine'} (OPD Desk 4)</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Attached Documents:</span>
              <strong className="text-slate-900">{documents.length} Records OCR-Indexed</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Assigned Room:</span>
              <strong className="text-teal-700 flex items-center gap-1 font-bold">
                <MapPin className="w-4 h-4" /> Room 12, First Floor
              </strong>
            </div>
          </div>

          <div className="mt-5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 text-center">
            Please proceed to <strong>Waiting Area 4</strong>. The doctor will call your token number.
          </div>
        </div>

        {/* Kiosk Auto-Reset Notice */}
        <div className="text-xs text-slate-500 flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-400" />
          <span>
            Shared kiosk will reset in <strong>{countdown}s</strong> for the next patient.
          </span>
        </div>

        <div className="flex items-center gap-3 w-full">
          <Button
            variant="kiosk"
            size="lg"
            icon={RotateCcw}
            onClick={() => navigate('/patient')}
            className="w-full py-4 text-lg"
          >
            Finish & Reset Now (समाप्त करें)
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col justify-between max-w-2xl mx-auto w-full py-2 space-y-6">
      <AudioPromptBar
        text="Please check your details before submitting to the doctor's screen."
        hindiText="कृपया डॉक्टर की स्क्रीन पर भेजने से पहले अपने विवरण की जांच करें।"
      />

      <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-200 shadow-sm space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            Review Information (जानकारी की समीक्षा)
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Confirm your answers and scanned records before doctor submission.
          </p>
        </div>

        <div className="space-y-3 text-sm">
          {/* Patient Identity */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Patient Identity (रोगी)
            </span>
            <p className="text-lg font-bold text-slate-900">
              {patient?.name || patient?.demographics?.name || 'Patient'}{patient?.age ? `, ${patient.age} Years` : ''} ({patient?.gender || '—'})
            </p>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              ABHA ID: {patient?.abha_id || patient?.demographics?.abha_id || 'Not linked'}
            </p>
          </div>

          {/* Primary Symptoms */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Primary Symptom & Duration (लक्षण और अवधि)
            </span>
            <p className="text-base font-bold text-slate-900">
              {patient?.chief_complaint || 'General consultation'}
            </p>
            <span className="inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
              Severity: Moderate to Severe (Affects Daily Work)
            </span>
          </div>

          {/* Attached Medical Records & OCR Extractions */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Medical Records Attached (संलग्न रिकॉर्ड — {documents.length})
              </span>
              <span className="text-[11px] font-bold text-teal-800 bg-teal-100/80 px-2 py-0.5 rounded">
                OCR Indexed
              </span>
            </div>

            <p className="text-sm font-semibold text-slate-800">
              {documents.length > 0
                ? documents.map((d) => d.title || d.file_name).join(' • ')
                : 'No prior documents attached'}
            </p>

            {/* Extracted medication tags */}
            {allMeds.length > 0 && (
              <div className="pt-2 border-t border-slate-200/70">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1 flex items-center gap-1">
                  <Pill className="w-3 h-3 text-teal-700" /> Extracted Medications:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {allMeds.slice(0, 4).map((m, i) => (
                    <span key={i} className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {m.name} {m.dose || ''}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Extracted lab values tags */}
            {allLabs.length > 0 && (
              <div className="pt-2 border-t border-slate-200/70">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1 flex items-center gap-1">
                  <Activity className="w-3 h-3 text-blue-700" /> Key Lab Findings:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {allLabs.slice(0, 3).map((l, i) => (
                    <span key={i} className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200">
                      {l.parameter}: {l.value} {l.unit || ''}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <Button
          variant="outline"
          size="lg"
          icon={ArrowLeft}
          onClick={() => navigate('/patient/documents')}
        >
          Back to Documents
        </Button>

        <Button
          variant="kiosk"
          size="lg"
          icon={CheckCircle2}
          iconPosition="right"
          onClick={handleSubmit}
          className="min-w-[220px]"
        >
          Submit & Get Token (टोकन लें)
        </Button>
      </div>
    </div>
  );
}
