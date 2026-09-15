import React, { useState, useEffect } from 'react';
import PatientQueueTable from '../../components/doctor/PatientQueueTable';
import Card, { CardContent } from '../../components/ui/Card';
import Alert from '../../components/ui/Alert';
import { patientService } from '../../services/patientService';
import { Users, ShieldAlert, Clock, Search, Filter, Stethoscope, RefreshCw } from 'lucide-react';

export default function DoctorDashboardPage() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('ALL');

  const fetchQueue = async () => {
    try {
      const data = await patientService.getQueue();
      if (data && Array.isArray(data)) {
        setPatients(data);
      }
    } catch (err) {
      console.error('Failed to load queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();

    const handleQueueUpdated = () => {
      fetchQueue();
    };

    window.addEventListener('caseflow-queue-updated', handleQueueUpdated);
    return () => {
      window.removeEventListener('caseflow-queue-updated', handleQueueUpdated);
    };
  }, []);

  const filteredPatients = patients.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.queue_token.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.chief_complaint.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPriority =
      filterPriority === 'ALL' || p.triage_priority.toUpperCase() === filterPriority;

    return matchesSearch && matchesPriority;
  });

  const queueStats = patientService.computeQueueStats(patients);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Top Clinical Header & Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active OPD Queue
            </p>
            <h3 className="text-3xl font-black text-slate-900 mt-1">
              {queueStats.total} <span className="text-xs font-medium text-slate-500">{queueStats.total === 1 ? 'Patient' : 'Patients'}</span>
            </h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-rose-600">
              Urgent Triage
            </p>
            <h3 className="text-3xl font-black text-rose-700 mt-1">
              {queueStats.urgent} <span className="text-xs font-medium text-rose-600">Immediate</span>
            </h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-700">
              Red Flags Detected
            </p>
            <h3 className="text-3xl font-black text-amber-900 mt-1">
              {queueStats.redFlags} <span className="text-xs font-medium text-amber-700">Flagged</span>
            </h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Avg History Time Saved
            </p>
            <h3 className="text-3xl font-black text-teal-700 mt-1">
              4.2 <span className="text-xs font-medium text-teal-700">min/patient</span>
            </h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-700 flex items-center justify-center font-bold">
            <Stethoscope className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Triage & Clinical Disclaimer Banner */}
      <Alert variant="disclaimer" title="CaseFlow Clinical Documentation Support">
        All patient histories, timelines, and entity extractions presented below were captured via self-service kiosk intake.
        The examining physician retains absolute diagnostic and prescriptive authority. Click on any patient record to review, edit, or verify.
      </Alert>

      {/* Queue Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search patient name, token, symptom..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
          />
        </div>

        {/* Priority Filter Buttons */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500 mr-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Priority:
          </span>
          {['ALL', 'URGENT', 'PRIORITY', 'ROUTINE'].map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setFilterPriority(filter)}
              className={`text-xs px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
                filterPriority === filter
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {filter}
            </button>
          ))}
          <button
            type="button"
            onClick={fetchQueue}
            title="Refresh OPD Queue"
            className="text-xs p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition flex items-center gap-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Patient Queue Table */}
      <PatientQueueTable patients={filteredPatients} />
    </div>
  );
}
