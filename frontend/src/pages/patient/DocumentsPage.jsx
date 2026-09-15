import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import AudioPromptBar from '../../components/patient/AudioPromptBar';
import DocumentUploadZone from '../../components/patient/DocumentUploadZone';
import DocumentCard from '../../components/patient/DocumentCard';
import ExtractionPreviewModal from '../../components/patient/ExtractionPreviewModal';
import { documentService } from '../../services/documentService';
import { patientService } from '../../services/patientService';
import {
  ArrowRight,
  ArrowLeft,
  FileCheck2,
  Sparkles,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

export default function DocumentsPage() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedDocForPreview, setSelectedDocForPreview] = useState(null);

  // Load patient documents on mount
  useEffect(() => {
    let isMounted = true;
    async function loadDocs() {
      try {
        const patientId = patientService.getCurrentPatientId();
        if (patientId) {
          const docs = await documentService.getPatientDocuments(patientId);
          if (isMounted) {
            setDocuments(docs || []);
          }
        } else {
          if (isMounted) {
            setDocuments([]);
          }
        }
      } catch (err) {
        console.error('Error fetching documents:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadDocs();
    return () => {
      isMounted = false;
    };
  }, []);

  // Handle new document upload / scan
  const handleFileUpload = async (file) => {
    setIsProcessing(true);
    try {
      const patientId = patientService.getCurrentPatientId();
      if (!patientId) {
        console.warn('Cannot upload document: No active patient in session');
        return;
      }
      const newDoc = await documentService.uploadDocument(file, patientId);
      if (newDoc) {
        setDocuments((prev) => [newDoc, ...prev]);
        // Automatically pop up extraction preview so patient can verify!
        setSelectedDocForPreview(newDoc);
      }
    } catch (err) {
      console.error('Document processing error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle document confirmation and corrections
  const handleConfirmExtraction = async (documentId, updates) => {
    try {
      const updated = await documentService.confirmDocument(documentId, updates);
      if (updated) {
        setDocuments((prev) =>
          prev.map((d) => (d.document_id === documentId ? updated : d))
        );
      }
    } catch (err) {
      console.error('Error confirming document extraction:', err);
    }
  };

  // Handle document deletion
  const handleDeleteDoc = async (documentId) => {
    try {
      await documentService.deleteDocument(documentId);
      setDocuments((prev) => prev.filter((d) => d.document_id !== documentId));
    } catch (err) {
      console.error('Error deleting document:', err);
    }
  };

  const confirmedCount = documents.filter((d) => d.confirmed).length;

  return (
    <div className="flex-1 flex flex-col justify-between max-w-4xl mx-auto w-full py-2 space-y-6">
      {/* Audio narration guidance bar */}
      <AudioPromptBar
        text="Place any previous doctor prescriptions or lab reports on the kiosk scanner."
        hindiText="कृपया अपनी पुरानी पर्ची या जांच रिपोर्ट कियोस्क स्कैनर पर रखें।"
      />

      {/* Main Container */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-200 shadow-sm space-y-6">
        {/* Page Title & Clinical Subheading */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Medical Documents & OCR (कागज़ात और जांच)
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-0.5">
              CaseFlow's OCR module extracts medicines, tests, and diagnoses from prior physical papers.
            </p>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 bg-teal-50 border border-teal-200 rounded-full text-xs font-bold text-teal-800 shrink-0">
            <FileCheck2 className="w-4 h-4 text-teal-700" />
            <span>{documents.length} Records Attached ({confirmedCount} Verified)</span>
          </div>
        </div>

        {/* Big Kiosk Scan Button / Dropzone */}
        <DocumentUploadZone
          onFileUpload={handleFileUpload}
          isProcessing={isProcessing}
        />

        {/* Attached & OCR-Extracted Document List */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
              Attached Medical Records ({documents.length})
            </h4>
            <span className="text-[11px] font-semibold text-slate-400">
              Tap review on any card to edit extracted items
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs font-bold text-slate-500">
              Loading attached records...
            </div>
          ) : documents.length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 font-medium text-xs">
              No previous documents scanned yet. You can scan papers above or continue to review.
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <DocumentCard
                  key={doc.document_id}
                  document={doc}
                  onInspect={(d) => setSelectedDocForPreview(d)}
                  onDelete={handleDeleteDoc}
                />
              ))}
            </div>
          )}
        </div>

        {/* Privacy & Non-diagnostic reassurance notice */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-2 text-xs text-slate-600 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Scanned physical papers are digitized on-device with privacy protection and are attached to your OPD visit token for the doctor's review.
          </span>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="flex items-center justify-between gap-4 pt-1">
        <Button
          variant="outline"
          size="lg"
          icon={ArrowLeft}
          onClick={() => navigate('/patient/interview')}
        >
          Previous (पिछला)
        </Button>

        <Button
          variant="kiosk"
          size="lg"
          icon={ArrowRight}
          iconPosition="right"
          onClick={() => navigate('/patient/review')}
          className="min-w-[220px]"
        >
          Review & Submit (समीक्षा करें)
        </Button>
      </div>

      {/* Extraction Preview & Correction Modal */}
      <ExtractionPreviewModal
        isOpen={!!selectedDocForPreview}
        document={selectedDocForPreview}
        onClose={() => setSelectedDocForPreview(null)}
        onConfirm={handleConfirmExtraction}
      />
    </div>
  );
}
