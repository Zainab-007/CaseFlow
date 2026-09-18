import React from 'react';
import { Clock, ShieldAlert, CheckCircle2, LogOut } from 'lucide-react';
import Button from '../ui/Button';

/**
 * Hospital Kiosk Inactivity Privacy Warning Modal (SIH26047)
 * Displays a bilingual warning before session expiry with an active countdown.
 */
export default function KioskInactivityModal({
  isOpen,
  remainingSeconds = 20,
  onContinue,
  onEndSession
}) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="inactivity-warning-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-3xl border-2 border-amber-400 shadow-2xl max-w-lg w-full p-6 sm:p-8 text-center space-y-6 animate-in zoom-in-95 duration-200">
        {/* Top Warning Badge & Icon */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-20 h-20 rounded-3xl bg-amber-500 text-white flex items-center justify-center shadow-lg ring-8 ring-amber-400/20">
              <Clock className="w-10 h-10 animate-pulse" />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-rose-600 text-white text-[11px] font-black px-2 py-0.5 rounded-full shadow-xs border border-white">
              Privacy / गोपनीयता
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-amber-800 bg-amber-100 px-3 py-0.5 rounded-full">
              Kiosk Session Timeout • समय सीमा चेतावनी
            </span>
            <h2
              id="inactivity-warning-title"
              className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight"
            >
              Session will end due to inactivity.
            </h2>
            <p className="text-xl sm:text-2xl font-bold text-teal-800">
              निष्क्रियता के कारण सत्र समाप्त हो जाएगा।
            </p>
          </div>
        </div>

        {/* Live Countdown Display */}
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 flex items-center justify-center gap-4">
          <div className="text-4xl sm:text-5xl font-black text-amber-700 font-mono tracking-tight">
            {remainingSeconds}s
          </div>
          <div className="text-left text-xs font-semibold text-slate-700 leading-snug">
            <p>To protect your privacy, this kiosk will reset automatically.</p>
            <p className="text-teal-900 font-medium">आपकी गोपनीयता सुरक्षा हेतु कियोस्क स्वतः रीसेट हो जाएगा।</p>
          </div>
        </div>

        {/* Explanatory Context */}
        <div className="flex items-start gap-2.5 text-left bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600">
          <ShieldAlert className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <p>
            Your registered information is safely saved for your doctor. Resetting only clears the screen for the next waiting patient.
          </p>
        </div>

        {/* Big Touch Action Buttons */}
        <div className="space-y-3 pt-2">
          <Button
            type="button"
            variant="kiosk"
            size="kiosk-lg"
            icon={CheckCircle2}
            onClick={onContinue}
            className="w-full py-4 text-lg bg-teal-700 hover:bg-teal-800 text-white shadow-md active:scale-98"
          >
            Continue Session (सत्र जारी रखें)
          </Button>

          <Button
            type="button"
            variant="outline"
            size="lg"
            icon={LogOut}
            onClick={onEndSession}
            className="w-full py-3 text-slate-700 border-slate-300 hover:bg-slate-100 font-bold"
          >
            End Session Now (सत्र समाप्त करें)
          </Button>
        </div>
      </div>
    </div>
  );
}
