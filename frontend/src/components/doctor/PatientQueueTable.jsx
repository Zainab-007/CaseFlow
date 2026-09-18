import React from 'react';
import { useNavigate } from 'react-router-dom';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { deriveRedFlagState } from '../../services/patientService';
import { Clock, ShieldAlert, ChevronRight, User, AlertCircle } from 'lucide-react';

/**
 * OPD Patient Queue table component for Doctor Clinical Dashboard.
 */
export default function PatientQueueTable({ patients = [] }) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs tracking-wider uppercase">
              <th className="py-3.5 px-4">Token & Patient</th>
              <th className="py-3.5 px-4">Age / Sex</th>
              <th className="py-3.5 px-4">Chief Complaint & Intake Summary</th>
              <th className="py-3.5 px-4">Triage Priority</th>
              <th className="py-3.5 px-4">Red Flags</th>
              <th className="py-3.5 px-4">Time Arrived</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {patients.map((patient) => {
              const priorityVariant =
                patient.triage_priority === 'Urgent'
                  ? 'urgent'
                  : patient.triage_priority === 'Priority'
                  ? 'priority'
                  : 'routine';

              const statusVariant =
                patient.verification_status === 'Verified'
                  ? 'verified'
                  : patient.verification_status === 'Edited'
                  ? 'edited'
                  : 'pending';

              return (
                <tr
                  key={patient.id}
                  onClick={() => navigate(`/doctor/patient/${patient.id}`)}
                  className="hover:bg-teal-50/40 cursor-pointer transition duration-150 group"
                >
                  {/* Token & Patient Name */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold px-2 py-1 bg-slate-100 text-slate-800 rounded-md border border-slate-200">
                        {patient.queue_token}
                      </span>
                      <div>
                        <div className="font-bold text-slate-900 group-hover:text-teal-800 transition">
                          {patient.name}
                        </div>
                        <div className="text-xs text-slate-400 font-mono">
                          ABHA: {patient.abha_id || 'Not linked'}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Age / Gender */}
                  <td className="py-4 px-4 text-slate-700 whitespace-nowrap">
                    {patient.age}y / {patient.gender}
                  </td>

                  {/* Chief Complaint */}
                  <td className="py-4 px-4 max-w-sm">
                    <p className="font-medium text-slate-900 line-clamp-1">
                      {patient.chief_complaint}
                    </p>
                    <span className="text-[11px] text-slate-400 font-normal">
                      Intake: {patient.intake_status} • {patient.language}
                    </span>
                  </td>

                  {/* Triage Priority */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    <Badge variant={priorityVariant} size="sm">
                      {patient.triage_priority}
                    </Badge>
                  </td>

                  {/* Red Flag Indicator — lifecycle-aware: only ACTIVE flags show "Flagged";
                      REVIEWED/RESOLVED history stays in Patient Detail */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    {deriveRedFlagState(patient).hasActive ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                        Flagged
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">None</span>
                    )}
                  </td>

                  {/* Arrived Time */}
                  <td className="py-4 px-4 whitespace-nowrap text-slate-600 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {patient.arrived_at}
                    </div>
                  </td>

                  {/* Verification Status */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    <Badge variant={statusVariant} size="sm">
                      {patient.verification_status}
                    </Badge>
                  </td>

                  {/* Action */}
                  <td className="py-4 px-4 text-right whitespace-nowrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/doctor/patient/${patient.id}`);
                      }}
                      className="group-hover:bg-teal-700 group-hover:text-white group-hover:border-teal-700 transition"
                    >
                      <span>Review</span>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
