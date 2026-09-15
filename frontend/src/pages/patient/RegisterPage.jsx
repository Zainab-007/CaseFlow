import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import AudioPromptBar from '../../components/patient/AudioPromptBar';
import { patientService } from '../../services/patientService';
import { ArrowRight, ArrowLeft, QrCode, CheckCircle2, Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Female');
  const [abhaOrPhone, setAbhaOrPhone] = useState('');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [persistedNotice, setPersistedNotice] = useState(false);

  // Load current patient intake data on mount only if resuming an in-progress kiosk session
  useEffect(() => {
    let isMounted = true;
    async function loadCurrentPatient() {
      try {
        const patientId = patientService.getCurrentPatientId();
        // NEVER populate or edit seeded demo patients (CF-2026-001 through CF-2026-004)
        if (patientId && !patientService.isDemoPatient(patientId)) {
          const data = await patientService.getPatient(patientId);
          if (isMounted && data) {
            setName(data.name || data.demographics?.name || '');
            setAge(String(data.age || data.demographics?.age || ''));
            setGender(data.gender || data.demographics?.gender || 'Female');
            setAbhaOrPhone(
              data.abha_id || data.phone || data.demographics?.abha_id || data.demographics?.contact || ''
            );
            setChiefComplaint(data.chief_complaint || '');
          }
        } else if (patientId && patientService.isDemoPatient(patientId)) {
          // Clear demo patient from active kiosk session
          patientService.clearCurrentPatient();
        }
      } catch (err) {
        console.error('Error loading patient data in RegisterPage:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadCurrentPatient();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleContinue = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const currentId = patientService.getCurrentPatientId();
      // If currentId is an in-progress non-demo draft, update it.
      // Otherwise, register a brand new patient with a unique patient_id!
      if (currentId && !patientService.isDemoPatient(currentId)) {
        await patientService.updatePatient(currentId, {
          name: name.trim(),
          age: parseInt(age, 10) || 30,
          gender: gender,
          phone: abhaOrPhone.trim() || '+91 99000 00000',
          abha_id: abhaOrPhone.trim() || 'Not linked',
          chief_complaint: chiefComplaint.trim() || 'Routine medical intake'
        });
      } else {
        const created = await patientService.registerPatient({
          name: name.trim(),
          age: parseInt(age, 10) || 30,
          gender: gender,
          phone: abhaOrPhone.trim() || '+91 99000 00000',
          abha_id: abhaOrPhone.trim() || 'Not linked',
          chief_complaint: chiefComplaint.trim() || 'Routine medical intake',
          preferred_language: 'Hindi / English'
        });
        if (created?.id) {
          patientService.setCurrentPatientId(created.id);
        }
      }
      setPersistedNotice(true);
      navigate('/patient/consent');
    } catch (err) {
      console.error('Error saving patient intake in RegisterPage:', err);
      navigate('/patient/consent');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-teal-700 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-600">Loading patient intake profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col justify-between max-w-2xl mx-auto w-full py-2 space-y-6">
      {/* Voice Prompt Bar */}
      <AudioPromptBar
        text="Please enter your basic information or scan your ABHA health card."
        hindiText="कृपया अपनी बुनियादी जानकारी दर्ज करें या अपना आभा कार्ड स्कैन करें।"
      />

      <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-200 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              Patient Information (रोगी की जानकारी)
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Fill in your details below. Changes are saved directly to your clinical record.
            </p>
          </div>
          <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
            {patientService.getCurrentPatientId() ? `ID: ${patientService.getCurrentPatientId()}` : 'New Registration (नया पंजीकरण)'}
          </span>
        </div>

        <form onSubmit={handleContinue} className="space-y-5">
          {/* Patient Full Name */}
          <Input
            kiosk
            label="Full Name"
            hindiLabel="पूरा नाम"
            placeholder="e.g. Zainab Shaikh"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          {/* Chief Complaint / Primary Symptom */}
          <Input
            kiosk
            label="Chief Complaint / Primary Concern"
            hindiLabel="मुख्य समस्या / तकलीफ़"
            placeholder="e.g. Headache, Abdominal pain, Fever"
            value={chiefComplaint}
            onChange={(e) => setChiefComplaint(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Age */}
            <Input
              kiosk
              type="number"
              label="Age (Years)"
              hindiLabel="उम्र"
              placeholder="e.g. 20"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              required
            />

            {/* Gender Big Touch Buttons */}
            <div>
              <label className="block mb-1.5 font-semibold text-slate-800 text-lg">
                Gender <span className="ml-1 text-slate-500 font-normal text-base">(लिंग)</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Male', 'Female', 'Other'].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={`py-4 text-base font-bold rounded-xl border-2 transition active:scale-95 cursor-pointer ${
                      gender === g
                        ? 'border-teal-700 bg-teal-50 text-teal-800 ring-2 ring-teal-600/20'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {g === 'Male' ? 'पुरुष (M)' : g === 'Female' ? 'महिला (F)' : 'अन्य (O)'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ABHA ID or Mobile */}
          <div>
            <Input
              kiosk
              label="Mobile Number or ABHA Address (Optional)"
              hindiLabel="मोबाइल नंबर या आभा आईडी"
              placeholder="e.g. 9876543210 or 91-4829-1029-4821"
              value={abhaOrPhone}
              onChange={(e) => setAbhaOrPhone(e.target.value)}
            />
            <div className="mt-2 flex items-center gap-2 text-xs text-teal-800 bg-teal-50 p-2.5 rounded-lg border border-teal-200">
              <QrCode className="w-4 h-4 text-teal-600 shrink-0" />
              <span>
                Tip: If you have an Ayushman Bharat Health Card (ABHA), your hospital record links automatically.
              </span>
            </div>
          </div>
        </form>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <Button
          variant="outline"
          size="lg"
          icon={ArrowLeft}
          onClick={() => navigate('/patient')}
        >
          Back
        </Button>

        <Button
          variant="kiosk"
          size="lg"
          icon={saving ? Loader2 : ArrowRight}
          iconPosition="right"
          disabled={saving}
          onClick={handleContinue}
          className="min-w-[200px]"
        >
          {saving ? 'Saving...' : 'Continue (आगे बढ़ें)'}
        </Button>
      </div>
    </div>
  );
}
