import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import AudioPromptBar from '../../components/patient/AudioPromptBar';
import { ArrowRight, ArrowLeft, ShieldCheck, CheckSquare, Square, Lock, Info } from 'lucide-react';

export default function ConsentPage() {
  const navigate = useNavigate();
  const [consentGranted, setConsentGranted] = useState(true);
  const [dataSharingGranted, setDataSharingGranted] = useState(true);

  const handleContinue = () => {
    if (!consentGranted) {
      alert('Consent is required to proceed with pre-consultation intake. You may consult the doctor directly without using this kiosk.');
      return;
    }
    navigate('/patient/language');
  };

  return (
    <div className="flex-1 flex flex-col justify-between max-w-2xl mx-auto w-full py-2 space-y-6">
      <AudioPromptBar
        text="Please review and grant consent for your pre-consultation information."
        hindiText="कृपया परामर्श-पूर्व जानकारी के लिए सहमति की समीक्षा करें और सहमति दें।"
      />

      <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-200 shadow-sm space-y-5">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              Consent & Privacy (सहमति और गोपनीयता)
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Digital Personal Data Protection (DPDP) Act 2023 & ABDM Consent Framework
            </p>
          </div>
        </div>

        {/* Clear Clinical Disclaimer Alert */}
        <Alert variant="disclaimer" title="Important Notice on AI Assistance">
          CaseFlow prepares clinical documentation to assist your doctor. It does <strong>not</strong> make medical diagnoses or prescribe medications. Your doctor reviews and verifies all information.
        </Alert>

        {/* Granular Consent Checkboxes */}
        <div className="space-y-3.5 pt-2">
          {/* Main Intake Consent */}
          <div
            onClick={() => setConsentGranted(!consentGranted)}
            className={`p-4 rounded-2xl border-2 transition cursor-pointer select-none flex items-start gap-3.5 ${
              consentGranted
                ? 'border-teal-700 bg-teal-50/60 ring-2 ring-teal-600/20'
                : 'border-slate-300 bg-white hover:border-slate-400'
            }`}
          >
            <div className="mt-0.5 shrink-0 text-teal-700">
              {consentGranted ? <CheckSquare className="w-6 h-6" /> : <Square className="w-6 h-6 text-slate-400" />}
            </div>
            <div>
              <p className="text-base font-bold text-slate-900">
                I agree to share my health history for today's doctor consultation
              </p>
              <p className="text-sm font-medium text-slate-600 mt-0.5">
                मैं आज के डॉक्टर परामर्श के लिए अपना स्वास्थ्य विवरण साझा करने के लिए सहमत हूँ।
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Your data is stored securely and used only for your medical care today.
              </p>
            </div>
          </div>

          {/* ABDM Data Linking Consent */}
          <div
            onClick={() => setDataSharingGranted(!dataSharingGranted)}
            className={`p-4 rounded-2xl border-2 transition cursor-pointer select-none flex items-start gap-3.5 ${
              dataSharingGranted
                ? 'border-teal-700 bg-teal-50/60 ring-2 ring-teal-600/20'
                : 'border-slate-300 bg-white hover:border-slate-400'
            }`}
          >
            <div className="mt-0.5 shrink-0 text-teal-700">
              {dataSharingGranted ? <CheckSquare className="w-6 h-6" /> : <Square className="w-6 h-6 text-slate-400" />}
            </div>
            <div>
              <p className="text-base font-bold text-slate-900">
                Link to my ABHA Health Record (Optional)
              </p>
              <p className="text-sm font-medium text-slate-600 mt-0.5">
                मेरे आभा स्वास्थ्य रिकॉर्ड से जोड़ने की अनुमति दें (वैकल्पिक)।
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Enables paperless record retrieval across government hospitals under Ayushman Bharat.
              </p>
            </div>
          </div>
        </div>

        {/* Privacy badge */}
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <Lock className="w-4 h-4 text-slate-400 shrink-0" />
          <span>
            Shared Kiosk Protection: All session memory is automatically erased when you finish or if the screen is idle.
          </span>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <Button
          variant="outline"
          size="lg"
          icon={ArrowLeft}
          onClick={() => navigate('/patient/register')}
        >
          Back
        </Button>

        <Button
          variant="kiosk"
          size="lg"
          icon={ArrowRight}
          iconPosition="right"
          onClick={handleContinue}
          disabled={!consentGranted}
          className="min-w-[200px]"
        >
          I Agree (मैं सहमत हूँ)
        </Button>
      </div>
    </div>
  );
}
