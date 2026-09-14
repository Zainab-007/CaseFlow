import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Progress from '../components/ui/Progress';
import EmergencyHelpModal from '../components/patient/EmergencyHelpModal';
import { RotateCcw, AlertTriangle, Languages, Building2, HelpCircle } from 'lucide-react';
import { patientService } from '../services/patientService';

const KIOSK_STEPS = [
  { path: '/patient', label: 'Welcome' },
  { path: '/patient/register', label: 'Register' },
  { path: '/patient/consent', label: 'Consent' },
  { path: '/patient/language', label: 'Language' },
  { path: '/patient/interview', label: 'Interview' },
  { path: '/patient/documents', label: 'Documents' },
  { path: '/patient/review', label: 'Token' },
];

export default function PatientKioskLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [helpOpen, setHelpOpen] = useState(false);

  // Determine current step number based on route
  const currentStepIndex = KIOSK_STEPS.findIndex((s) => s.path === location.pathname);
  const currentStep = currentStepIndex >= 0 ? currentStepIndex + 1 : 1;

  const handleRestartSession = () => {
    if (window.confirm('Reset this session? All temporary kiosk information will be cleared for the next patient.')) {
      patientService.clearCurrentPatient();
      navigate('/patient');
    }
  };

  const isWidePage =
    location.pathname === '/patient/interview' ||
    location.pathname === '/patient/documents' ||
    location.pathname === '/patient/review';

  return (
    <div className="flex-1 flex flex-col bg-slate-100 min-h-0 select-none">
      {/* Kiosk Header */}
      <header className="bg-white border-b-2 border-slate-200 px-6 py-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-700 text-white flex items-center justify-center font-bold shadow-sm">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">CaseFlow Kiosk</h1>
              <span className="text-xs bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-md border border-slate-200">
                Unit #03
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">District Hospital OPD • Self-Service History Intake</p>
          </div>
        </div>

        {/* Right Header Actions: Emergency Help & Reset Session */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setHelpOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-sm shadow-xs transition active:scale-95"
          >
            <HelpCircle className="w-5 h-5 text-amber-600" />
            <span>Help / सहायता</span>
          </button>

          <button
            type="button"
            onClick={handleRestartSession}
            title="Clear all kiosk data and start fresh"
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-300 transition active:scale-95"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Start Over (नई शुरुआत)</span>
          </button>
        </div>
      </header>

      {/* Linear Kiosk Progress Indicator */}
      {location.pathname !== '/patient' && (
        <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3">
          <div className={`${isWidePage ? 'max-w-7xl' : 'max-w-4xl'} mx-auto w-full`}>
            <Progress
              currentStep={currentStep}
              totalSteps={KIOSK_STEPS.length}
              stepTitles={KIOSK_STEPS.map((s) => s.label)}
            />
          </div>
        </div>
      )}

      {/* Main Kiosk Viewport */}
      <div className={`flex-1 flex flex-col justify-between p-4 sm:p-6 lg:p-8 ${isWidePage ? 'max-w-7xl' : 'max-w-4xl'} mx-auto w-full`}>
        <Outlet />
      </div>

      {/* Kiosk Safety Footer */}
      <footer className="bg-slate-200/80 border-t border-slate-300 py-3 px-6 text-center text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-medium">
          <span className="w-2 h-2 rounded-full bg-teal-600 inline-block"></span>
          <span>DPDP Act 2023 Compliant • Automatic kiosk reset on idle</span>
        </div>
        <span className="font-semibold text-slate-700">
          For critical chest pain or breathing failure, report to Emergency Room immediately
        </span>
      </footer>

      {/* Help Modal */}
      <EmergencyHelpModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
