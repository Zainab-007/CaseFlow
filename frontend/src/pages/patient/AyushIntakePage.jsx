import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import AudioPromptBar from '../../components/patient/AudioPromptBar';
import { patientService } from '../../services/patientService';
import {
  ArrowRight,
  ArrowLeft,
  Activity,
  Droplets,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  SkipForward
} from 'lucide-react';

const QUESTIONS = [
  {
    id: 'nadi',
    titleEn: '1. Pulse Observation (Nadi / नाड़ी)',
    titleHi: '1. नाड़ी (पल्स) का अवलोकन',
    questionEn: 'Do you have any information or observation about your pulse?',
    questionHi: 'क्या आपने अपनी नाड़ी (पल्स) के बारे में कोई अवलोकन देखा है?',
    icon: Activity,
    options: [
      { id: 'Normal / Not known', labelEn: 'Normal / Not known', labelHi: 'सामान्य / जानकारी नहीं', descEn: 'Regular steady pulse', descHi: 'सामान्य स्थिर गति' },
      { id: 'Fast / Rapid pulse', labelEn: 'Fast or Racing pulse', labelHi: 'तेज़ गति से चलने वाली नाड़ी', descEn: 'Noticeably rapid heart rate', descHi: 'तेज़ धड़कन महसूस होना' },
      { id: 'Slow / Weak pulse', labelEn: 'Slow or Weak pulse', labelHi: 'धीमी या कमजोर नाड़ी', descEn: 'Faint or unusually slow pulse', descHi: 'धीमी या हल्की धड़कन' },
      { id: 'Irregular rhythm', labelEn: 'Irregular rhythm', labelHi: 'अनियमित गति (गैपिंग पल्स)', descEn: 'Skipping beats or uneven rhythm', descHi: 'अनियमित धड़कन महसूस होना' }
    ]
  },
  {
    id: 'mutra',
    titleEn: '2. Urine Observation (Mutra / मूत्र)',
    titleHi: '2. मूत्र (पेशाब) का अवलोकन',
    questionEn: 'Have you noticed anything unusual about your urine?',
    questionHi: 'क्या आपने अपने मूत्र (पेशाब) में कोई बदलाव देखा है?',
    icon: Droplets,
    options: [
      { id: 'Normal', labelEn: 'Normal', labelHi: 'सामान्य (कोई बदलाव नहीं)', descEn: 'Clear, pale yellow without pain', descHi: 'बिना जलन या दर्द के सामान्य पेशाब' },
      { id: 'Burning sensation', labelEn: 'Burning sensation', labelHi: 'पेशाब करते समय जलन', descEn: 'Discomfort or heat during urination', descHi: 'पेशाब के दौरान जलन या गर्माहट' },
      { id: 'Increased frequency', labelEn: 'Increased frequency', labelHi: 'बार-बार पेशाब आना', descEn: 'Needing to urinate much more often', descHi: 'सामान्य से अधिक बार पेशाब जाना' },
      { id: 'Dark / Yellowish color', labelEn: 'Dark / Yellowish color', labelHi: 'गहरा या पीला रंग', descEn: 'Concentrated or reddish tint', descHi: 'गहरा पीला या भूरा रंग' }
    ]
  },
  {
    id: 'mala',
    titleEn: '3. Bowel Observation (Mala / मल)',
    titleHi: '3. मल (पाचन व पेट साफ होने का अवलोकन)',
    questionEn: 'Have you noticed anything unusual about your bowel movements?',
    questionHi: 'क्या आपने अपने मल (पेट साफ होने) में कोई समस्या देखी है?',
    icon: HelpCircle,
    options: [
      { id: 'Normal / Regular', labelEn: 'Normal / Regular', labelHi: 'सामान्य / नियमित पेट साफ', descEn: 'Daily smooth bowel movement', descHi: 'नियमित और आसान पाचन' },
      { id: 'Constipation / Hard stools', labelEn: 'Constipation / Hard stools', labelHi: 'कब्ज / कड़ा मल (विबंध)', descEn: 'Difficulty passing stool or dryness', descHi: 'कठिनाई से मल त्याग होना' },
      { id: 'Loose stools', labelEn: 'Loose stools / Diarrhea', labelHi: 'दस्त / पतला मल', descEn: 'Frequent watery or soft stools', descHi: 'बार-बार दस्त या पतला मल होना' },
      { id: 'Irregular / Bloating', labelEn: 'Irregular / Bloating & Gas', labelHi: 'अनियमित / पेट में गैस व भारीपन', descEn: 'Excess gas, heaviness or cramps', descHi: 'पेट में गैस, अफ़ारा या दर्द' }
    ]
  },
  {
    id: 'jihwa',
    titleEn: '4. Tongue Observation (Jihwa / जिह्वा)',
    titleHi: '4. जिह्वा (जीभ) का अवलोकन',
    questionEn: 'Have you noticed anything unusual about the appearance of your tongue?',
    questionHi: 'क्या आपने अपनी जीभ की सतह पर कोई बदलाव देखा है?',
    icon: Sparkles,
    options: [
      { id: 'Normal / Clean', labelEn: 'Normal / Clean', labelHi: 'सामान्य / साफ जीभ', descEn: 'Pink surface without thick coating', descHi: 'गुलाबी और साफ सतह' },
      { id: 'White coating', labelEn: 'White coating on tongue', labelHi: 'जीभ पर सफेद परत', descEn: 'Layer of white/cream coating', descHi: 'सफेद परत या जमाव' },
      { id: 'Dry / Pale appearance', labelEn: 'Dry / Pale appearance', labelHi: 'सूखी या हल्की पीली जीभ', descEn: 'Lack of moisture or pale color', descHi: 'नमी की कमी या पीलापन' },
      { id: 'Redness / Soreness', labelEn: 'Redness or Soreness', labelHi: 'लालिमा या जलन / छाले', descEn: 'Red spots, raw feeling or pain', descHi: 'लाल रंग या जलन महसूस होना' }
    ]
  }
];

export default function AyushIntakePage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({
    nadi: 'Not provided',
    mutra: 'Not provided',
    mala: 'Not provided',
    jihwa: 'Not provided'
  });
  const [saving, setSaving] = useState(false);

  const lang = patientService.getPatientLanguage() || 'hi';
  const isHindi = lang === 'hi' || lang === 'hinglish';
  const currentQ = QUESTIONS[currentStep];

  const answersRef = React.useRef(answers);
  answersRef.current = answers;

  const handleSelectOption = (optionId) => {
    const updated = {
      ...answersRef.current,
      [currentQ.id]: optionId
    };
    answersRef.current = updated;
    setAnswers(updated);
    return updated;
  };

  const handleSkipQuestion = () => {
    const updated = {
      ...answersRef.current,
      [currentQ.id]: 'Not provided'
    };
    answersRef.current = updated;
    setAnswers(updated);
    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      submitAyushIntake(updated);
    }
  };

  const goNext = () => {
    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      submitAyushIntake(answersRef.current);
    }
  };

  const goBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    } else {
      navigate('/patient/language');
    }
  };

  const submitAyushIntake = async (overridePayload = null) => {
    setSaving(true);
    const payload = overridePayload || answersRef.current || answers;
    try {
      const patientId = patientService.getCurrentPatientId();
      if (patientId) {
        await patientService.recordAyushIntake(patientId, payload);
      }
    } catch (err) {
      console.warn('[AyushIntakePage] Save error, continuing flow:', err);
    } finally {
      setSaving(false);
      navigate('/patient/interview');
    }
  };

  const handleSkipEntireIntake = async () => {
    navigate('/patient/interview');
  };

  return (
    <div className="flex-1 flex flex-col justify-between max-w-3xl mx-auto w-full py-2 space-y-5">
      <AudioPromptBar
        text="Optional AYUSH Pre-Consultation Intake: Please record any observations regarding your pulse, urine, digestion, or tongue."
        hindiText="वैकल्पिक आयुष परामर्श-पूर्व विवरण: कृपया अपनी नाड़ी, पेशाब, पाचन या जीभ से संबंधित कोई भी अवलोकन दर्ज करें।"
      />

      <div className="space-y-4">
        {/* Step Header with Banner */}
        <div className="bg-gradient-to-r from-teal-900 to-emerald-800 text-white rounded-3xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-teal-200 uppercase tracking-wide bg-teal-800/60 px-3 py-1 rounded-full border border-teal-700/50">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isHindi ? 'वैकल्पिक आयुष विवरण (AYUSH Intake)' : 'Optional AYUSH Intake'}</span>
            </div>
            <span className="text-xs font-bold text-teal-100 bg-emerald-950/60 px-3 py-1 rounded-full">
              {isHindi ? `चरण ${currentStep + 1} / ${QUESTIONS.length}` : `Step ${currentStep + 1} of ${QUESTIONS.length}`}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white">
            {isHindi ? currentQ.titleHi : currentQ.titleEn}
          </h2>
          <p className="text-xs text-teal-100 font-medium">
            {isHindi ? currentQ.questionHi : currentQ.questionEn}
          </p>

          {/* Progress Bar */}
          <div className="w-full bg-teal-950/60 rounded-full h-2 mt-2 overflow-hidden border border-teal-700/40">
            <div
              className="bg-emerald-400 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / QUESTIONS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Disclaimer Note */}
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-amber-900 text-xs">
          <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            {isHindi
              ? 'यह विवरण रोगी द्वारा दिए गए सामान्य अवलोकन मात्र हैं। केसफ्लो कोई आयुर्वेदिक निदान (Diagnosis) नहीं करता है।'
              : 'These are simple patient-reported observations for your doctor. CaseFlow does not perform medical diagnosis.'}
          </span>
        </div>

        {/* Touch Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {currentQ.options.map((opt) => {
            const isSelected = answers[currentQ.id] === opt.id;
            return (
              <div
                key={opt.id}
                onClick={() => handleSelectOption(opt.id)}
                className={`p-4 sm:p-5 rounded-2xl border-2 transition cursor-pointer select-none flex flex-col justify-between space-y-2 ${
                  isSelected
                    ? 'border-teal-700 bg-teal-50/80 ring-2 ring-teal-600/20 shadow-md'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-black text-base text-slate-900 leading-tight">
                    {isHindi ? opt.labelHi : opt.labelEn}
                  </span>
                  <div className="shrink-0 text-teal-700">
                    {isSelected ? (
                      <CheckCircle2 className="w-6 h-6 text-teal-700 fill-teal-100" />
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-slate-300" />
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  {isHindi ? opt.descHi : opt.descEn}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation Buttons Bar */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <Button
          variant="outline"
          size="lg"
          icon={ArrowLeft}
          onClick={goBack}
        >
          {isHindi ? 'पीछे' : 'Back'}
        </Button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSkipQuestion}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 px-3 py-2.5 rounded-xl transition cursor-pointer border border-slate-200 bg-slate-50"
          >
            {isHindi ? 'यह सवाल छोड़ें' : 'Skip Question'}
          </button>

          <Button
            variant="kiosk"
            size="lg"
            icon={ArrowRight}
            iconPosition="right"
            onClick={goNext}
            disabled={saving}
            className="min-w-[160px]"
          >
            {saving
              ? (isHindi ? 'सहेज रहे हैं...' : 'Saving...')
              : currentStep < QUESTIONS.length - 1
              ? (isHindi ? 'अगला (Next)' : 'Next Step')
              : (isHindi ? 'पूरा करें (Finish)' : 'Complete AYUSH')}
          </Button>
        </div>
      </div>

      {/* Skip Entire AYUSH Intake Link */}
      <div className="text-center pt-1">
        <button
          type="button"
          onClick={handleSkipEntireIntake}
          className="text-xs font-bold text-slate-400 hover:text-slate-700 underline transition cursor-pointer"
        >
          {isHindi
            ? 'आयुष विवरण छोड़ें और सीधे मुख्य साक्षात्कार पर जाएं (Skip AYUSH Intake)'
            : 'Skip AYUSH intake and proceed directly to main interview'}
        </button>
      </div>
    </div>
  );
}
