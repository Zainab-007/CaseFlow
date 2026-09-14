import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Stethoscope, User, HelpCircle, Activity } from 'lucide-react';

/**
 * Root Layout with top-level switcher between Patient Kiosk and Doctor Clinical Dashboard.
 */
export default function RootLayout() {
  const location = useLocation();
  const isPatientMode = location.pathname.startsWith('/patient');
  const isDoctorMode = location.pathname.startsWith('/doctor');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Demo Bar for Mode Navigation */}
      <header className="bg-slate-900 text-slate-200 px-4 py-2 text-xs border-b border-slate-800 flex items-center justify-between z-30 select-none">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 font-bold tracking-wider text-teal-400">
            <Activity className="w-4 h-4" />
            <span>CaseFlow</span>
          </div>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400 hidden sm:inline">
            SIH26047 Pre-Consultation System
          </span>
        </div>

        {/* Quick Mode Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-800 p-0.5 rounded-lg">
          <NavLink
            to="/patient"
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-1 rounded-md transition font-medium ${
                isPatientMode
                  ? 'bg-teal-700 text-white shadow-xs font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`
            }
          >
            <User className="w-3.5 h-3.5" />
            <span>Patient Kiosk</span>
          </NavLink>

          <NavLink
            to="/doctor"
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-1 rounded-md transition font-medium ${
                isDoctorMode
                  ? 'bg-teal-700 text-white shadow-xs font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`
            }
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Doctor Dashboard</span>
          </NavLink>
        </div>

        <div className="text-[11px] text-slate-400 hidden md:flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-ping"></span>
          <span>Prototype Foundation Active</span>
        </div>
      </header>

      {/* Main Outlet */}
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}
