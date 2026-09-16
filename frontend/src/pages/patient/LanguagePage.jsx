import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import BigOptionCard from '../../components/patient/BigOptionCard';
import AudioPromptBar from '../../components/patient/AudioPromptBar';
import { patientService } from '../../services/patientService';
import { ArrowRight, ArrowLeft, Globe2, Languages } from 'lucide-react';

const LANGUAGES = [
  { id: 'hi', title: 'हिन्दी', subtitle: 'Hindi (हिंदी में बातचीत करें)', badge: 'Voice + Text', status: 'Ready' },
  { id: 'en', title: 'English', subtitle: 'Standard Clinical English', badge: 'Voice + Text', status: 'Ready' },
  { id: 'hinglish', title: 'Hinglish', subtitle: 'Hindi + English Mix (मिश्रित भाषा)', badge: 'Voice + Text', status: 'Ready' },
  { id: 'mr', title: 'मराठी', subtitle: 'Marathi (लवकरच येत आहे)', badge: 'Indian Language', status: 'Planned' },
  { id: 'gu', title: 'ગુજરાતી', subtitle: 'Gujarati (ટૂંક समयમાં આવી રહ્યું છે)', badge: 'Indian Language', status: 'Planned' },
  { id: 'bn', title: 'বাংলা', subtitle: 'Bengali (শীঘ্রই আসছে)', badge: 'Indian Language', status: 'Planned' },
];

export default function LanguagePage() {
  const navigate = useNavigate();
  const [selectedLang, setSelectedLang] = useState(() => patientService.getPatientLanguage() || 'hi');

  const handleContinue = () => {
    patientService.setPatientLanguage(selectedLang);
    navigate('/patient/interview');
  };

  return (
    <div className="flex-1 flex flex-col justify-between max-w-3xl mx-auto w-full py-2 space-y-6">
      <AudioPromptBar
        text="Please select your preferred language for the interview."
        hindiText="कृपया साक्षात्कार के लिए अपनी पसंदीदा भाषा चुनें।"
      />

      <div className="space-y-4">
        <div className="text-center sm:text-left">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            Select Language (भाषा चुनें)
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Choose the language you feel most comfortable speaking or reading.
          </p>
        </div>

        {/* Large Touch Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {LANGUAGES.map((lang) => (
            <BigOptionCard
              key={lang.id}
              title={lang.title}
              subtitle={lang.subtitle}
              badge={lang.badge}
              selected={selectedLang === lang.id}
              onClick={() => setSelectedLang(lang.id)}
            />
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <Button
          variant="outline"
          size="lg"
          icon={ArrowLeft}
          onClick={() => navigate('/patient/consent')}
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
