import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import AudioPromptBar from '../../components/patient/AudioPromptBar';
import { CheckCircle2, Ticket, ArrowLeft, RotateCcw, Clock, MapPin, Printer } from 'lucide-react';

export default function ReviewPage() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [countdown, setCountdown] = useState(15);

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
                CF-OPD-104
              </h3>
            </div>
          </div>

          <div className="space-y-2 border-t border-slate-100 pt-4 text-sm text-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-500">Patient:</span>
              <strong className="text-slate-900">Ramesh Chandra Sharma (62y / M)</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Department:</span>
              <strong className="text-slate-900">General Medicine (OPD Desk 4)</strong>
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
            Confirm your answers. You can go back if you need to make any changes.
          </p>
        </div>

        <div className="space-y-3 text-sm">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Patient Identity (रोगी)
            </span>
            <p className="text-lg font-bold text-slate-900">Ramesh Chandra Sharma, 62 Years (Male)</p>
            <p className="text-xs text-slate-500 font-mono mt-0.5">ABHA ID: 91-4829-1029-4821</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Primary Symptom & Duration (लक्षण और अवधि)
            </span>
            <p className="text-base font-bold text-slate-900">
              Productive cough and breathlessness on walking (10 days duration)
            </p>
            <span className="inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
              Severity: Moderate (Affects Daily Work)
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Medical Records Attached (संलग्न रिकॉर्ड)
            </span>
            <p className="text-sm font-semibold text-slate-800">
              2 Documents: Previous OPD Prescription + CBC/HbA1c Lab Report
            </p>
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
          Back
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
