import React from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { PhoneCall, UserCheck, AlertTriangle } from 'lucide-react';

/**
 * Emergency & Staff Assistance dialog for Kiosk users.
 */
export default function EmergencyHelpModal({ isOpen, onClose }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Need Assistance? (सहायता चाहिए?)"
      subtitle="Hospital staff is available to help you at this kiosk."
      maxWidth="max-w-md"
      footer={
        <Button variant="primary" size="lg" className="w-full" onClick={onClose}>
          I Understand / Return (वापस जाएं)
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-900">
            <p className="font-bold">Severe or Life-Threatening Emergency?</p>
            <p className="mt-1 text-xs text-amber-800">
              If you have sudden severe chest pain, extreme breathlessness, or collapse, please proceed immediately to the <strong>Emergency Room (Casualty)</strong> or alert the nearest nurse.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Kiosk Attendant Support</p>
              <p className="text-xs text-slate-500">Ask the counter staff or volunteer in blue jacket</p>
            </div>
          </div>
          <span className="text-xs bg-teal-50 text-teal-700 font-bold px-2 py-1 rounded-md border border-teal-200">
            Station #2
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">OPD Helpdesk Helpline</p>
              <p className="text-xs text-slate-500">Dial Ext. 102 from kiosk intercom</p>
            </div>
          </div>
          <span className="text-xs bg-slate-200 text-slate-700 font-bold px-2 py-1 rounded-md">
            Ext: 102
          </span>
        </div>
      </div>
    </Modal>
  );
}
