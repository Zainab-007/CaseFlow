import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import RedFlagBanner from '../../components/doctor/RedFlagBanner';
import ClinicalTimeline from '../../components/doctor/ClinicalTimeline';
import VerificationActionBar from '../../components/doctor/VerificationActionBar';
import { patientService } from '../../services/patientService';
import { documentService } from '../../services/documentService';
import {
  User,
  Clock,
  Activity,
  FileText,
  Calendar,
  Sparkles,
  AlertCircle,
  FileCheck2,
  CheckCircle2,
  Heart,
  Pill,
  Shield,
  Layers,
  ArrowLeft,
  Loader2
} from 'lucide-react';

export default function PatientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('structured'); // 'structured' | 'timeline' | 'documents' | 'ayush'
  const [verificationStatus, setVerificationStatus] = useState('Pending Review');
  const [ayushEnabled, setAyushEnabled] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadPatientRecord() {
      setLoading(true);
      try {
        const data = await patientService.getPatient(id);
        if (isMounted && data) {
          if (!data.documents || data.documents.length === 0) {
            try {
              const docs = await documentService.getPatientDocuments(data.id || id);
              if (docs && docs.length > 0) {
                data.documents = docs;
              }
            } catch (dErr) {
              // ignore
            }
          }
          setPatient(data);
          setVerificationStatus(data.verification_status || 'Pending Review');
        }
      } catch (err) {
        console.error('Failed to load patient record:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadPatientRecord();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const [successToast, setSuccessToast] = useState(null);

  const handleStatusChange = async (newStatus, notes) => {
    setVerificationStatus(newStatus);
    try {
      await patientService.verifyPatient(patient?.id || id, newStatus, notes);
    } catch (err) {
      console.warn('Status update sync failed:', err);
    }
    alert(`Record status updated to "${newStatus}". Final documentation authority logged under Dr. S. K. Mehta.`);
  };

  const handleSaveDoctorEdit = async (editedData) => {
    try {
      const updated = await patientService.updatePatient(patient?.id || id, {
        ...editedData,
        is_doctor_edit: true
      });
      if (updated) {
        if (!updated.documents || updated.documents.length === 0) {
          updated.documents = patient?.documents || [];
        }
        setPatient(updated);
        setSuccessToast('Record updated successfully.');
        setTimeout(() => setSuccessToast(null), 4000);
      }
    } catch (err) {
      console.error('Failed to save doctor edits:', err);
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-16 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-9 h-9 text-teal-700 animate-spin" />
        <p className="text-sm font-semibold text-slate-600">Loading patient clinical record...</p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/doctor')}>
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to OPD Queue
        </Button>
        <Alert variant="warning" title="Patient Record Not Found">
          No clinical record exists for Patient ID "{id}". Please return to the OPD Queue.
        </Alert>
      </div>
    );
  }

  // Safe field extraction
  const patientName = patient.demographics?.name || patient.name || 'Unknown Patient';
  const initials = patientName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const queueToken = patient.queue_token || 'OPD-000';
  const triagePriority = patient.triage?.priority || patient.triage_priority || 'Routine';
  const age = patient.demographics?.age ?? patient.age ?? '—';
  const gender = patient.demographics?.gender || patient.gender || '—';
  const bloodGroup = patient.demographics?.blood_group || 'Unknown';
  const contact = patient.demographics?.contact || patient.phone || '—';
  const abhaId = patient.demographics?.abha_id || patient.abha_id || 'Not linked';
  const vitalsSummary = patient.triage?.vitals_summary || 'Vitals assessment pending';
  const triageNurse = patient.triage?.triage_nurse || 'Station 1';

  const redFlagData = patient.red_flag || (patient.red_flag_detected ? {
    detected: true,
    title: patient.red_flag_note || 'High Risk Clinical Symptom Flagged',
    rule_trigger: 'Safety Rule Triggered',
    nlp_trigger: patient.red_flag_note,
    physician_action: 'Immediate physician evaluation required'
  } : { detected: false });

  const aiSummary = patient.ai_clinical_summary || 'Intake completed. Clinical summary pending physician review.';

  // Chief complaint normalization
  const complaintTitle =
    typeof patient.chief_complaint === 'object' && patient.chief_complaint !== null
      ? patient.chief_complaint.title
      : patient.chief_complaint || 'Clinical information not yet available';

  const complaintDuration =
    typeof patient.chief_complaint === 'object' && patient.chief_complaint !== null
      ? patient.chief_complaint.duration
      : null;

  // Structured history items
  const hpi = patient.structured_history?.hpi || {};
  const pastMedical = patient.structured_history?.past_medical_history || [];
  const currentMeds = patient.structured_history?.current_medications || patient.medications || [];
  const labs = patient.structured_history?.labs || patient.structured_history?.lab_findings || patient.labs || [];
  const allergies = patient.structured_history?.allergies || [];
  const familyHistory = patient.structured_history?.family_history || [];
  const personalSocial = patient.structured_history?.personal_social || {};
  const ros = patient.structured_history?.review_of_systems || {};
  const timelineEvents = patient.timeline || [];
  const documents = patient.documents || [];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6 pb-28">
      {/* Navigation & Patient Demographic Banner */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => navigate('/doctor')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to OPD Queue
        </button>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-800 text-white flex items-center justify-center text-xl font-bold shadow-xs">
              {initials}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-800 rounded-md border border-slate-200">
                  Token: {queueToken}
                </span>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {patientName}
                </h2>
                <Badge variant={triagePriority.toLowerCase()} size="sm">
                  {triagePriority} Priority
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
                <span>{age} Years • {gender}</span>
                <span>Blood Group: <strong>{bloodGroup}</strong></span>
                <span>Contact: {contact}</span>
                <span className="font-mono text-teal-800">ABHA: {abhaId}</span>
              </div>
            </div>
          </div>

          {/* Triage Vitals Summary */}
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs space-y-1 w-full md:w-auto">
            <span className="font-bold text-slate-500 uppercase tracking-wider block text-[10px]">
              Triage Desk Vitals
            </span>
            <p className="font-bold text-slate-800">{vitalsSummary}</p>
            <span className="text-slate-400 block text-[11px]">{triageNurse}</span>
          </div>
        </div>
      </div>

      {/* Red-Flag Alert Component */}
      <RedFlagBanner redFlag={redFlagData} />

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
            Synthesized from kiosk interview & verified clinical data
          </span>
        </CardHeader>
        <CardContent>
          <p className="text-slate-900 text-sm leading-relaxed font-normal">
            {aiSummary}
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
            <span>Patient Timeline ({timelineEvents.length})</span>
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
            <span>Attached Documents ({documents.length})</span>
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
                  {complaintTitle}{complaintDuration ? ` (${complaintDuration})` : ''}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-500 font-bold block">Onset & Course</span>
                  <span className="text-xs text-slate-800 font-semibold">
                    {hpi.onset || 'Clinical information not yet available'}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-500 font-bold block">Severity & Impact</span>
                  <span className="text-xs text-slate-800 font-semibold">
                    {hpi.severity || 'Clinical information not yet available'}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-500 font-bold block">Sputum / Secretions</span>
                  <span className="text-xs text-slate-800 font-semibold">
                    {hpi.sputum || 'None reported'}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-500 font-bold block">Aggravating Factors</span>
                  <span className="text-xs text-slate-800 font-semibold">
                    {hpi.aggravating_factors || 'None identified'}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-500 font-bold block">Relieving Factors</span>
                  <span className="text-xs text-slate-800 font-semibold">
                    {hpi.relieving_factors || 'None identified'}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-500 font-bold block">Quality & Character</span>
                  <span className="text-xs text-slate-800 font-semibold">
                    {hpi.character || complaintTitle}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Past History & Medications Grid */}
          {/* Past History, Medications & Lab Findings Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Past Medical History */}
            <Card>
              <CardHeader>
                <CardTitle>Past Medical History</CardTitle>
                <Badge variant="source-doc" size="sm">Document-extracted</Badge>
              </CardHeader>
              <CardContent>
                {pastMedical.length > 0 ? (
                  <ul className="space-y-2.5 text-xs">
                    {pastMedical.map((item, idx) => (
                      <li key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex justify-between items-center">
                        <div>
                          <span className="font-bold text-slate-900 block">{item.condition}</span>
                          <span className="text-slate-500">
                            Diagnosed: {item.diagnosed || '—'} • Control: {item.control || '—'}
                          </span>
                        </div>
                        <Badge variant={item.source === 'document-extracted' || item.source === 'ocr' ? 'source-doc' : 'source-patient'} size="sm">
                          {item.source === 'ocr' || item.source === 'document-extracted' ? 'Source: Document' : (item.source || 'reported')}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-500 py-3">No prior chronic medical conditions reported.</p>
                )}
              </CardContent>
            </Card>

            {/* Current Medications */}
            <Card>
              <CardHeader>
                <CardTitle>Current Daily Medications</CardTitle>
                <span className="text-xs font-semibold text-slate-500">Reconciled List</span>
              </CardHeader>
              <CardContent>
                {currentMeds.length > 0 ? (
                  <ul className="space-y-2.5 text-xs">
                    {currentMeds.map((med, idx) => (
                      <li key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex justify-between items-center">
                        <div>
                          <span className="font-bold text-slate-900 block">
                            {med.name} {med.dose || ''} {med.frequency ? `— ${med.frequency}` : ''}
                          </span>
                          <span className="text-slate-500">
                            {med.duration ? `Duration: ${med.duration} • ` : ''}Adherence: {med.adherence || 'Regular'}
                          </span>
                        </div>
                        <Badge variant={med.source === 'document-extracted' || med.source === 'ocr' || med.source === 'document' ? 'source-doc' : 'source-patient'} size="sm">
                          {med.source === 'ocr' || med.source === 'document' || med.source === 'document-extracted' ? 'Source: Document' : (med.source === 'interview' ? 'Source: Interview' : (med.source || 'reported'))}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-500 py-3">No regular daily medications reported.</p>
                )}
              </CardContent>
            </Card>

            {/* Laboratory & Diagnostic Findings */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle>Laboratory Findings</CardTitle>
                  {labs.length > 0 && (
                    <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                      {labs.length} Result{labs.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <Badge variant="source-doc" size="sm">Source: Document</Badge>
              </CardHeader>
              <CardContent>
                {labs.length > 0 ? (
                  <ul className="space-y-2.5 text-xs">
                    {labs.map((lab, idx) => (
                      <li key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex justify-between items-center">
                        <div>
                          <span className="font-bold text-slate-900 block">{lab.parameter || lab.name}</span>
                          <span className="text-slate-600 font-mono text-xs">
                            Value: <strong>{lab.value}</strong> {lab.unit || ''}
                            {lab.reference_range && ` • Ref: ${lab.reference_range}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {lab.status && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                              lab.status.toLowerCase() === 'normal'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}>
                              {lab.status}
                            </span>
                          )}
                          <Badge variant={lab.source === 'ocr' || lab.source === 'document' || lab.source === 'document-extracted' ? 'source-doc' : 'source-patient'} size="sm">
                            {lab.source === 'ocr' || lab.source === 'document' || lab.source === 'document-extracted' ? 'Source: Document' : (lab.source || 'reported')}
                          </Badge>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-500 py-3">No laboratory investigations uploaded.</p>
                )}
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
                {allergies.length > 0 ? (
                  allergies.map((all, idx) => (
                    <div key={idx} className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl text-xs mb-2 last:mb-0">
                      <span className="font-bold text-rose-950 block">{all.allergen}</span>
                      <p className="text-rose-800 mt-0.5">Reaction: {all.reaction}</p>
                      <span className="text-[11px] font-semibold text-rose-700 mt-1 block">
                        Severity: {all.severity || 'Moderate'}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 py-2">No known drug allergies reported (NKDA).</p>
                )}
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
                  {familyHistory.length > 0 ? (
                    <ul className="list-disc pl-4 text-slate-600 space-y-0.5">
                      {familyHistory.map((f, idx) => (
                        <li key={idx}>{f}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-500">None reported</p>
                  )}
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <span className="font-bold text-slate-700 block mb-0.5">Social Habits:</span>
                  <p className="text-slate-600">Smoking: {personalSocial.smoking || 'Non-smoker'}</p>
                  <p className="text-slate-600">Diet: {personalSocial.diet || 'Standard'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Review of Systems (ROS) */}
            <Card>
              <CardHeader>
                <CardTitle>Review of Systems (ROS)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-slate-700">
                {Object.keys(ros).length > 0 ? (
                  Object.entries(ros).map(([system, findings], idx) => (
                    <div key={idx}>
                      <span className="font-bold text-slate-800 capitalize block">{system}:</span>
                      <span className="text-slate-600">{findings}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500">System review negative except for chief complaint.</p>
                )}
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
              <p className="text-xs text-slate-500">
                Synthesizes physical documents, hospital encounters, and today's pre-consultation intake.
              </p>
            </div>
            <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
              {timelineEvents.length} Events Tracked
            </span>
          </div>
          {timelineEvents.length > 0 ? (
            <ClinicalTimeline events={timelineEvents} />
          ) : (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
              <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">No Historical Timeline Events</p>
              <p className="mt-1">Initial consultation registered today.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Documents */}
      {activeTab === 'documents' && (
        <div className="animate-in fade-in duration-150 space-y-4">
          {documents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {documents.map((doc) => {
                const docId = doc.document_id || doc.id || 'doc';
                const docTitle = doc.title || doc.file_name || 'Medical Document';
                const docType = doc.document_type || doc.type || 'Clinical Record';
                const docDate = doc.date_detected || doc.date || 'Recent';
                const docConf =
                  doc.confidence_score !== undefined
                    ? `${Math.round(doc.confidence_score * 100)}%`
                    : doc.ocr_confidence || '95%';

                let entityList = [];
                if (Array.isArray(doc.extracted_entities)) {
                  entityList = doc.extracted_entities;
                } else {
                  if (doc.diagnoses) entityList.push(...doc.diagnoses);
                  if (doc.medications) {
                    entityList.push(...doc.medications.map((m) => `${m.name} ${m.dose || ''}`.trim()));
                  }
                  if (doc.lab_findings) {
                    entityList.push(...doc.lab_findings.map((l) => `${l.parameter}: ${l.value} ${l.unit || ''}`.trim()));
                  }
                }

                return (
                  <Card key={docId}>
                    <CardHeader>
                      <CardTitle className="text-sm truncate">{docTitle}</CardTitle>
                      <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                        {docType}
                      </span>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Date: {docDate}</span>
                        <span>OCR Conf: {docConf}</span>
                      </div>

                      <div className="flex items-center gap-3 py-1 text-xs">
                        <span className="flex items-center gap-1 text-emerald-700 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Processed
                        </span>
                        {(doc.confirmed || doc.processing_status === 'confirmed' || doc.status === 'confirmed') ? (
                          <span className="flex items-center gap-1 text-emerald-700 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed
                          </span>
                        ) : (
                          <span className="text-amber-600 font-medium">
                            Pending Confirmation
                          </span>
                        )}
                      </div>

                      {entityList.length > 0 && (
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                            OCR Extracted Entities:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {entityList.slice(0, 5).map((ent, idx) => (
                              <span
                                key={idx}
                                className="text-xs bg-white text-slate-800 border border-slate-300 px-2 py-0.5 rounded-md font-mono"
                              >
                                {ent}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <Button variant="outline" size="sm" className="w-full">
                        View Scanned Record
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
              <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">No Prior Documents Attached</p>
              <p className="mt-1">No scanned prescriptions or lab reports associated with Patient {patient.id}.</p>
            </div>
          )}
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

      {/* Success Notification Banner */}
      {successToast && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-700 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Doctor Bottom Verification & Authority Bar */}
      <VerificationActionBar
        patient={patient}
        patientId={patient.id}
        currentStatus={verificationStatus}
        onStatusChange={handleStatusChange}
        onSaveDoctorEdit={handleSaveDoctorEdit}
      />
    </div>
  );
}
