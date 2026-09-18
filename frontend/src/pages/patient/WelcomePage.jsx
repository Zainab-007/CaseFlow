import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Button from '../../components/ui/Button';
import AudioPromptBar from '../../components/patient/AudioPromptBar';
import { patientService } from '../../services/patientService';
import { Play, Mic, ShieldCheck, Languages, ArrowRight, HeartPulse, Clock } from 'lucide-react';

export default function WelcomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState(Boolean(location.state?.sessionExpired));

  return (
    <div className="flex-1 flex flex-col justify-center items-center text-center max-w-2xl mx-auto w-full py-6 space-y-8">
      {/* Session Expired Privacy Banner */}
      {sessionExpiredNotice && (
        <div className="w-full p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-900 flex items-center justify-between text-left shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-200 text-amber-800 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div className="text-xs space-y-0.5">
              <p className="font-bold">Session ended due to inactivity to protect patient privacy.</p>
              <p className="text-amber-800 font-medium">गोपनीयता सुरक्षा हेतु पिछला सत्र स्वतः रीसेट कर दिया गया।</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSessionExpiredNotice(false)}
            className="text-amber-700 hover:text-amber-900 font-bold px-2.5 py-1 text-sm cursor-pointer"
            title="Dismiss notice"
          >
            ✕
          </button>
        </div>
      )}

      {/* Audio narration bar on by default */}
      <AudioPromptBar
        text="Welcome to CaseFlow. Let's prepare your information before you meet the doctor."
        hindiText="केस-फ़्लो में आपका स्वागत है। डॉक्टर से मिलने से पहले आइए आपकी जानकारी तैयार करें।"
        className="w-full text-left"
      />

      {/* Main Welcome Hero */}
      <div className="space-y-4">
        <div className="w-20 h-20 rounded-3xl bg-teal-700 text-white flex items-center justify-center mx-auto shadow-xl ring-8 ring-teal-600/20">
          <HeartPulse className="w-10 h-10 animate-pulse" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-teal-800 bg-teal-100 px-3 py-1 rounded-full">
            Outpatient Department • OPD Intake
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Welcome to CaseFlow
          </h2>
          <p className="text-xl sm:text-2xl font-bold text-teal-800">
            नमस्ते! डॉक्टर से मिलने से पहले अपनी जानकारी दर्ज करें
          </p>
          <p className="text-base text-slate-600 max-w-lg mx-auto font-medium">
            Answer a few simple questions through touch or voice. Your doctor will review this summary to provide faster, more focused care.
          </p>
        </div>
      </div>

      {/* Key Kiosk Guarantees */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full text-left">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-teal-700 font-bold text-sm mb-1 flex items-center gap-1.5">
            <Mic className="w-4 h-4" />
            <span>Voice or Touch</span>
          </div>
          <p className="text-xs text-slate-500 font-medium">Speak in your language or tap large buttons. No typing required.</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-teal-700 font-bold text-sm mb-1 flex items-center gap-1.5">
            <Languages className="w-4 h-4" />
            <span>Multilingual</span>
          </div>
          <p className="text-xs text-slate-500 font-medium">Available in Hindi, English, and regional Indian languages.</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-teal-700 font-bold text-sm mb-1 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>Doctor Verified</span>
          </div>
          <p className="text-xs text-slate-500 font-medium">Prepares notes for your doctor. Final decisions remain with your doctor.</p>
        </div>
      </div>

      {/* Big Kiosk Action Button */}
      <div className="w-full pt-4">
        <Button
          variant="kiosk"
          size="kiosk-xl"
          icon={ArrowRight}
          iconPosition="right"
          onClick={() => {
            patientService.clearCurrentPatient();
            navigate('/patient/register');
          }}
          className="w-full py-6 text-2xl"
        >
          Start Intake (शुरू करें)
        </Button>
      </div>
    </div>
  );
}
