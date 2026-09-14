import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import RedFlagBanner from '../../components/doctor/RedFlagBanner';
import ClinicalTimeline from '../../components/doctor/ClinicalTimeline';
import VerificationActionBar from '../../components/doctor/VerificationActionBar';
import { MOCK_PATIENT_DETAILS } from '../../data/mockData';
import {
  User,
  Clock,
  Activity,
  FileText,
  Calendar,
  Sparkles,
  AlertCircle,
  FileCheck2,
  Heart,
  Pill,
  Shield,
  Layers,
  Sparkle
} from 'lucide-react';

export default function PatientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const patient = MOCK_PATIENT_DETAILS[id] || MOCK_PATIENT_DETAILS['CF-2026-001'];

  const [activeTab, setActiveTab] = useState('structured'); // 'structured' | 'timeline' | 'documents' | 'ayush'
  const [verificationStatus, setVerificationStatus] = useState(patient.verification_status);
  const [ayushEnabled, setAyushEnabled] = useState(false);

  const handleStatusChange = (newStatus, notes) => {
    setVerificationStatus(newStatus);
    alert(`Record status updated to "${newStatus}". Final documentation authority logged under Dr. S. K. Mehta.`);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6 pb-28">
      {/* Patient Demographic Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-800 text-white flex items-center justify-center text-xl font-bold shadow-xs">
            {patient.demographics.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-800 rounded-md border border-slate-200">
                Token: {patient.queue_token}
              </span>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                {patient.demographics.name}
              </h2>
              <Badge variant={patient.triage.priority.toLowerCase()} size="sm">
                {patient.triage.priority} Priority
              </Badge>
              <Badge
                variant={
                  verificationStatus === 'Verified'
                    ? 'verified'
                    : verificationStatus === 'Edited'
                    ? 'edited'
                    : 'pending'
                }
                size="sm"
              >
                {verificationStatus}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-600 font-medium">
              <span>{patient.demographics.age} Years • {patient.demographics.gender}</span>
              <span>Blood Group: <strong>{patient.demographics.blood_group}</strong></span>
              <span>Contact: {patient.demographics.contact}</span>
              <span className="font-mono text-teal-800">ABHA: {patient.demographics.abha_id}</span>
            </div>
          </div>
        </div>

        {/* Triage Vitals Summary */}
        <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs space-y-1 w-full md:w-auto">
          <span className="font-bold text-slate-500 uppercase tracking-wider block text-[10px]">
            Triage Desk Vitals
          </span>
          <p className="font-bold text-slate-800">{patient.triage.vitals_summary}</p>
          <span className="text-slate-400 block text-[11px]">{patient.triage.triage_nurse}</span>
        </div>
      </div>

      {/* Red-Flag Alert Component */}
      <RedFlagBanner redFlag={patient.red_flag} />

      {/* AI Clinical Brief Card */}
      <Card className="border-teal-200/80 bg-teal-50/20">
        <CardHeader className="bg-teal-50/60 border-b border-teal-100">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-teal-700" />
            <CardTitle className="text-teal-950 font-bold">
              AI-Generated Clinical Summary
            </CardTitle>
            <span className="text-[11px] font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-md border border-teal-200">
              Pre-Consultation Brief
            </span>
          </div>
          <span className="text-xs text-slate-500 italic hidden sm:inline">
            Synthesized from kiosk interview & 3 prior documents
          </span>
        </CardHeader>
        <CardContent>
          <p className="text-slate-900 text-sm leading-relaxed font-normal">
            {patient.ai_clinical_summary}
          </p>
          <div className="mt-3 pt-3 border-t border-teal-100/80 flex flex-wrap items-center justify-between gap-2 text-xs text-teal-900">
            <span className="flex items-center gap-1.5 font-medium">
              <AlertCircle className="w-3.5 h-3.5 text-teal-700" />
              Pre-consultation support note. The examining doctor must verify findings during consultation.
            </span>
            <div className="flex items-center gap-2">
              <Badge variant="source-patient" size="sm">Patient-reported</Badge>
              <Badge variant="source-doc" size="sm">Document-extracted</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clinical Tabs Bar */}
      <div className="border-b border-slate-200 flex items-center justify-between gap-4">
        <div className="flex items-center gap-1 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('structured')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition whitespace-nowrap ${
              activeTab === 'structured'
                ? 'border-teal-700 text-teal-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Structured Clinical History</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('timeline')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition whitespace-nowrap ${
              activeTab === 'timeline'
                ? 'border-teal-700 text-teal-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Patient Timeline ({patient.timeline.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('documents')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition whitespace-nowrap ${
              activeTab === 'documents'
                ? 'border-teal-700 text-teal-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Prior Documents ({patient.documents.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ayush')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition whitespace-nowrap ${
              activeTab === 'ayush'
                ? 'border-teal-700 text-teal-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>AYUSH Intake Mode</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Structured History */}
      {activeTab === 'structured' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Chief Complaint & HPI */}
          <Card>
            <CardHeader>
              <CardTitle>Chief Complaint & History of Present Illness (HPI)</CardTitle>
              <Badge variant="source-patient" size="sm">Patient-reported</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-xs font-bold uppercase text-slate-500 block mb-1">
                  Primary Presentation:
                </span>
                <p className="text-base font-bold text-slate-900">
                  {patient.chief_complaint.title} ({patient.chief_complaint.duration})
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-500 font-bold block">Onset & Course</span>
                  <span className="text-xs text-slate-800 font-semibold">{patient.structured_history.hpi.onset}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-500 font-bold block">Severity & Impact</span>
                  <span className="text-xs text-slate-800 font-semibold">{patient.structured_history.hpi.severity}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-500 font-bold block">Sputum Character</span>
                  <span className="text-xs text-slate-800 font-semibold">{patient.structured_history.hpi.sputum}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-500 font-bold block">Aggravating Factors</span>
                  <span className="text-xs text-slate-800 font-semibold">{patient.structured_history.hpi.aggravating_factors}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-500 font-bold block">Relieving Factors</span>
                  <span className="text-xs text-slate-800 font-semibold">{patient.structured_history.hpi.relieving_factors}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-500 font-bold block">Quality & Character</span>
                  <span className="text-xs text-slate-800 font-semibold">{patient.structured_history.hpi.character}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Past History & Medications Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Past Medical History */}
            <Card>
              <CardHeader>
                <CardTitle>Past Medical & Surgical History</CardTitle>
                <Badge variant="source-doc" size="sm">Document-extracted</Badge>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2.5 text-xs">
                  {patient.structured_history.past_medical_history.map((item, idx) => (
                    <li key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex justify-between items-center">
                      <div>
                        <span className="font-bold text-slate-900 block">{item.condition}</span>
                        <span className="text-slate-500">Diagnosed: {item.diagnosed} • Control: {item.control}</span>
                      </div>
                      <Badge variant={item.source === 'document-extracted' ? 'source-doc' : 'source-patient'} size="sm">
                        {item.source}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Current Medications */}
            <Card>
              <CardHeader>
                <CardTitle>Current Daily Medications</CardTitle>
                <span className="text-xs font-semibold text-slate-500">Reconciled List</span>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2.5 text-xs">
                  {patient.structured_history.current_medications.map((med, idx) => (
                    <li key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex justify-between items-center">
                      <div>
                        <span className="font-bold text-slate-900 block">{med.name} {med.dose}</span>
                        <span className="text-slate-500">{med.frequency} • Adherence: {med.adherence}</span>
                      </div>
                      <Badge variant={med.source === 'document-extracted' ? 'source-doc' : 'source-patient'} size="sm">
                        {med.source}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Allergies, Family & Social, ROS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Allergies */}
            <Card>
              <CardHeader>
                <CardTitle>Allergies & Sensitivities</CardTitle>
              </CardHeader>
              <CardContent>
                {patient.structured_history.allergies.map((all, idx) => (
                  <div key={idx} className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl text-xs">
                    <span className="font-bold text-rose-950 block">{all.allergen}</span>
                    <p className="text-rose-800 mt-0.5">Reaction: {all.reaction}</p>
                    <span className="text-[11px] font-semibold text-rose-700 mt-1 block">Severity: {all.severity}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Family & Social History */}
            <Card>
              <CardHeader>
                <CardTitle>Family & Social</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div>
                  <span className="font-bold text-slate-700 block mb-0.5">Family History:</span>
                  <ul className="list-disc pl-4 text-slate-600 space-y-0.5">
                    {patient.structured_history.family_history.map((f, idx) => (
                      <li key={idx}>{f}</li>
                    ))}
                  </ul>
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <span className="font-bold text-slate-700 block mb-0.5">Social Habits:</span>
                  <p className="text-slate-600">Smoking: {patient.structured_history.personal_social.smoking}</p>
                  <p className="text-slate-600">Diet: {patient.structured_history.personal_social.diet}</p>
                </div>
              </CardContent>
            </Card>

            {/* Review of Systems (ROS) */}
            <Card>
              <CardHeader>
                <CardTitle>Review of Systems (ROS)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-slate-700">
                <div>
                  <span className="font-bold text-slate-800 block">Cardiovascular:</span>
                  <span className="text-slate-600">{patient.structured_history.review_of_systems.cardiovascular}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-800 block">Respiratory:</span>
                  <span className="text-slate-600">{patient.structured_history.review_of_systems.respiratory}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-800 block">Genitourinary:</span>
                  <span className="text-slate-600">{patient.structured_history.review_of_systems.urinary}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Tab 2: Patient Timeline */}
      {activeTab === 'timeline' && (
        <div className="animate-in fade-in duration-150 space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Longitudinal Patient Timeline</h3>
              <p className="text-xs text-slate-500">Combines physical documents, hospital EHR encounters, and today's pre-consultation intake.</p>
            </div>
            <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
              4 Events Tracked
            </span>
          </div>
          <ClinicalTimeline events={patient.timeline} />
        </div>
      )}

      {/* Tab 3: Documents */}
      {activeTab === 'documents' && (
        <div className="animate-in fade-in duration-150 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {patient.documents.map((doc) => (
              <Card key={doc.id}>
                <CardHeader>
                  <CardTitle className="text-sm truncate">{doc.title}</CardTitle>
                  <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                    {doc.type}
                  </span>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Date: {doc.date}</span>
                    <span>OCR Conf: {doc.ocr_confidence}</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      OCR Extracted Entities:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {doc.extracted_entities.map((ent, idx) => (
                        <span key={idx} className="text-xs bg-white text-slate-800 border border-slate-300 px-2 py-0.5 rounded-md font-mono">
                          {ent}
                        </span>
                      ))}
                    </div>
                  </div>

                  <Button variant="outline" size="sm" className="w-full">
                    View Scanned File
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: AYUSH Mode */}
      {activeTab === 'ayush' && (
        <div className="animate-in fade-in duration-150 space-y-4">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Configurable AYUSH Mode (Module 13)</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Optional clinical history extension for Ayurveda, Yoga, Unani, Siddha, and Homeopathy OPDs.
                </p>
              </div>
              <Button
                variant={ayushEnabled ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setAyushEnabled(!ayushEnabled)}
              >
                {ayushEnabled ? 'AYUSH Intake Active' : 'Enable AYUSH Mode'}
              </Button>
            </CardHeader>
            <CardContent>
              {ayushEnabled ? (
                <div className="space-y-4 text-xs">
                  <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-950 font-medium">
                    Ashtavidha Pariksha (अष्टविध परीक्षा) parameters configured for Ayurvedic clinical intake.
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl border bg-slate-50">
                      <span className="font-bold block text-slate-900">1. Nadi (नाड़ी / Pulse)</span>
                      <span className="text-slate-500">Vata-Pitta dominant</span>
                    </div>
                    <div className="p-3 rounded-xl border bg-slate-50">
                      <span className="font-bold block text-slate-900">2. Mutra (मूत्र / Urine)</span>
                      <span className="text-slate-500">Normal frequency</span>
                    </div>
                    <div className="p-3 rounded-xl border bg-slate-50">
                      <span className="font-bold block text-slate-900">3. Mala (मल / Bowel)</span>
                      <span className="text-slate-500">Vibandha (mild constipation)</span>
                    </div>
                    <div className="p-3 rounded-xl border bg-slate-50">
                      <span className="font-bold block text-slate-900">4. Jihwa (जिह्वा / Tongue)</span>
                      <span className="text-slate-500">Lipta (mild coating)</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  AYUSH mode is currently inactive for this consultation. Click "Enable AYUSH Mode" above to toggle Ayurvedic/Homeopathic history capture.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Doctor Bottom Verification & Authority Bar */}
      <VerificationActionBar
        patientId={patient.id}
        currentStatus={verificationStatus}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
