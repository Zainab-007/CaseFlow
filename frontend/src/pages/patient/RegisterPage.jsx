import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import AudioPromptBar from '../../components/patient/AudioPromptBar';
import { ArrowRight, ArrowLeft, User, QrCode } from 'lucide-react';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('Ramesh Sharma');
  const [age, setAge] = useState('62');
  const [gender, setGender] = useState('Male');
  const [abhaOrPhone, setAbhaOrPhone] = useState('91-4829-1029-4821');

  const handleContinue = (e) => {
    e.preventDefault();
    navigate('/patient/consent');
  };

  return (
    <div className="flex-1 flex flex-col justify-between max-w-2xl mx-auto w-full py-2 space-y-6">
      {/* Voice Prompt Bar */}
      <AudioPromptBar
        text="Please enter your basic information or scan your ABHA health card."
        hindiText="कृपया अपनी बुनियादी जानकारी दर्ज करें या अपना आभा कार्ड स्कैन करें।"
      />

      <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-200 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            Patient Information (रोगी की जानकारी)
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Fill in your details below. You can ask the kiosk attendant for assistance if needed.
          </p>
        </div>

        <form onSubmit={handleContinue} className="space-y-5">
          {/* Patient Full Name */}
          <Input
            kiosk
            label="Full Name"
            hindiLabel="पूरा नाम"
            placeholder="e.g. Ramesh Sharma"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Age */}
            <Input
              kiosk
              type="number"
              label="Age (Years)"
              hindiLabel="उम्र"
              placeholder="e.g. 62"
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
                    className={`py-4 text-base font-bold rounded-xl border-2 transition active:scale-95 ${
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
          icon={ArrowRight}
          iconPosition="right"
          onClick={handleContinue}
          className="min-w-[200px]"
        >
          Continue (आगे बढ़ें)
        </Button>
      </div>
    </div>
  );
}
