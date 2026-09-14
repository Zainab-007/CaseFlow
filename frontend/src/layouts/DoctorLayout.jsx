import React from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Stethoscope, Users, FileCheck2, ShieldAlert, ArrowLeft, RefreshCw } from 'lucide-react';
import Badge from '../components/ui/Badge';

export default function DoctorLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const isDetailView = location.pathname.includes('/doctor/patient/');

  return (
    <div className="flex-1 flex flex-col bg-slate-100 min-h-0">
      {/* Doctor Clinical Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between sticky top-0 z-20 shadow-xs">
        <div className="flex items-center gap-4">
          {isDetailView ? (
            <button
              type="button"
              onClick={() => navigate('/doctor')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to OPD Queue</span>
            </button>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-teal-800 text-white flex items-center justify-center font-bold shadow-xs">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base font-bold text-slate-900 tracking-tight">
                  Clinical Intake Dashboard
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  OPD Desk 4 • General Medicine • AI Pre-Consultation Summaries
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Doctor & OPD Live Stats */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-3 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
            <div className="flex items-center gap-1.5 text-slate-700">
              <Users className="w-4 h-4 text-teal-700" />
              <span>Queue: <strong>4 Patients</strong></span>
            </div>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1.5 text-rose-700 font-bold">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>1 Red Flag</span>
            </div>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1.5 text-emerald-700">
              <FileCheck2 className="w-4 h-4 text-emerald-600" />
              <span>1 Verified</span>
            </div>
          </div>

          <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold">
              SM
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-bold text-slate-900 leading-tight">Dr. S. K. Mehta</div>
              <div className="text-[11px] text-slate-500 font-mono">MCI-48201</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Clinical Outlet */}
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}
