import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import AudioPromptBar from '../../components/patient/AudioPromptBar';
import { patientService } from '../../services/patientService';
import { ArrowRight, ArrowLeft, ShieldCheck, CheckSquare, Square, Lock, Info, XCircle, AlertTriangle } from 'lucide-react';

export default function ConsentPage() {
  const navigate = useNavigate();
  const [consentGranted, setConsentGranted] = useState(false);
  const [dataSharingGranted, setDataSharingGranted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [declinedNotice, setDeclinedNotice] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleContinue = async () => {
    setErrorMessage(null);
    if (!consentGranted) {
      setDeclinedNotice(true);
      return;
    }
    setSaving(true);
    try {
      const patientId = patientService.getCurrentPatientId();
      console.log('[ConsentPage] Recording consent for patient_id:', patientId);
      if (!patientId) {
        throw new Error('No active patient session found. Please register first.');
      }
      const result = await patientService.recordConsent(patientId, {
        given: true,
        version: 'v1',
        method: 'kiosk'
      });
      console.log('[ConsentPage] Consent recorded response:', result);
      if (!result || !result.consent || result.consent.given !== true) {
        throw new Error('Consent could not be verified in the patient record.');
      }
      navigate('/patient/language');
    } catch (err) {
      console.error('[ConsentPage] Error recording consent:', err);
      setErrorMessage(err.message || 'Unable to record consent. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDecline = async () => {
    setConsentGranted(false);
    setDeclinedNotice(true);
    setErrorMessage(null);
    try {
      const patientId = patientService.getCurrentPatientId();
      console.log('[ConsentPage] Declining consent for patient_id:', patientId);
      if (patientId) {
        await patientService.recordConsent(patientId, {
          given: false,
          version: 'v1',
          method: 'kiosk'
        });
      }
    } catch (err) {
      console.error('[ConsentPage] Error recording declined consent:', err);
    }
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

        {/* Visible Error Banner if consent recording fails */}
        {errorMessage && (
          <div className="p-4 bg-rose-50 border-2 border-rose-200 rounded-2xl flex items-start gap-3 text-rose-900">
            <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs font-medium space-y-1">
              <p className="font-bold text-sm text-rose-950">
                {errorMessage}
              </p>
              <p>
                कृपया पुनः प्रयास करें। यदि समस्या बनी रहे तो ओपीडी सहायक से संपर्क करें।
              </p>
            </div>
          </div>
        )}

        {/* Declined Warning Banner if patient declines or attempts bypass without consent */}
        {declinedNotice && !consentGranted && (
          <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-2xl flex items-start gap-3 text-amber-900">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs font-medium space-y-1">
              <p className="font-bold text-sm text-amber-950">
                Consent is required to continue with the CaseFlow intake.
              </p>
              <p>
                बिना सहमति के केसफ्लो डिजिटल साक्षात्कार जारी नहीं रखा जा सकता। आप सीधे ओपीडी परामर्श कक्ष में डॉक्टर से मिल सकते हैं।
              </p>
            </div>
          </div>
        )}

        {/* Granular Consent Checkboxes */}
        <div className="space-y-3.5 pt-2">
          {/* Main Intake Consent */}
          <div
            onClick={() => {
              setConsentGranted(!consentGranted);
              if (!consentGranted) setDeclinedNotice(false);
            }}
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

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleDecline}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 px-3 py-2 rounded-xl transition cursor-pointer"
          >
            Decline (अस्वीकार करें)
          </button>

          <Button
            variant="kiosk"
            size="lg"
            icon={ArrowRight}
            iconPosition="right"
            onClick={handleContinue}
            disabled={!consentGranted || saving}
            className="min-w-[200px]"
          >
            {saving ? 'Recording...' : 'I Agree (मैं सहमत हूँ)'}
          </Button>
        </div>
      </div>
    </div>
  );
}
