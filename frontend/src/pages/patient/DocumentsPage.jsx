import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import AudioPromptBar from '../../components/patient/AudioPromptBar';
import { ArrowRight, ArrowLeft, Camera, UploadCloud, FileText, CheckCircle2, Trash2 } from 'lucide-react';

export default function DocumentsPage() {
  const navigate = useNavigate();
  const [scannedFiles, setScannedFiles] = useState([
    {
      id: 'doc-1',
      name: 'Previous_OPD_Prescription.jpg',
      type: 'Prescription Slip',
      status: 'OCR Ready',
      extractedText: 'Extracted: Tab. Telmisartan 40mg OD, Tab. Metformin 500mg BD',
    },
    {
      id: 'doc-2',
      name: 'CBC_Lab_Report_Aug.pdf',
      type: 'Laboratory Blood Report',
      status: 'OCR Ready',
      extractedText: 'Extracted: Hb 11.2 g/dL, HbA1c 7.4%, Platelets 220k',
    }
  ]);

  const handleSimulateScan = () => {
    const newDoc = {
      id: `doc-${scannedFiles.length + 1}`,
      name: `Physical_Slip_Scan_${scannedFiles.length + 1}.jpg`,
      type: 'Medical Record Scan',
      status: 'OCR Scanned',
      extractedText: 'Extracted: OPD consultation note with blood pressure recording 148/92',
    };
    setScannedFiles([...scannedFiles, newDoc]);
  };

  const handleRemoveDoc = (id) => {
    setScannedFiles(scannedFiles.filter((d) => d.id !== id));
  };

  return (
    <div className="flex-1 flex flex-col justify-between max-w-3xl mx-auto w-full py-2 space-y-6">
      <AudioPromptBar
        text="Place any previous doctor prescriptions or lab reports on the kiosk scanner."
        hindiText="कृपया अपनी पुरानी पर्ची या जांच रिपोर्ट कियोस्क स्कैनर पर रखें।"
      />

      <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-200 shadow-sm space-y-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            Medical Documents & Scans (कागज़ात और रिपोर्ट)
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            CaseFlow's OCR module extracts medicines, tests, and diagnoses from prior physical papers.
          </p>
        </div>

        {/* Big Kiosk Scan Button / Dropzone */}
        <div
          onClick={handleSimulateScan}
          className="border-3 border-dashed border-teal-300 hover:border-teal-500 bg-teal-50/50 hover:bg-teal-50 rounded-3xl p-8 text-center cursor-pointer transition active:scale-[0.99] select-none"
        >
          <div className="w-16 h-16 rounded-2xl bg-teal-700 text-white flex items-center justify-center mx-auto shadow-md mb-3">
            <Camera className="w-8 h-8" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
            Tap to Scan Paper (कागज़ स्कैन करने के लिए दबाएं)
          </h3>
          <p className="text-sm text-slate-600 font-medium mt-1">
            Place paper slip facing down on the scanner glass or tap to attach document
          </p>
          <span className="inline-block mt-3 text-xs font-bold text-teal-800 bg-teal-200/80 px-3 py-1 rounded-full">
            + Add Document
          </span>
        </div>

        {/* Extracted Document List */}
        {scannedFiles.length > 0 && (
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Attached Documents ({scannedFiles.length})
            </h4>

            {scannedFiles.map((doc) => (
              <div
                key={doc.id}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-start justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{doc.name}</span>
                      <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {doc.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{doc.type}</p>
                    <p className="text-xs text-teal-900 bg-teal-50 border border-teal-200 rounded-md p-1.5 mt-2 font-mono">
                      {doc.extractedText}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveDoc(doc.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white transition"
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <Button
          variant="outline"
          size="lg"
          icon={ArrowLeft}
          onClick={() => navigate('/patient/interview')}
        >
          Back
        </Button>

        <Button
          variant="kiosk"
          size="lg"
          icon={ArrowRight}
          iconPosition="right"
          onClick={() => navigate('/patient/review')}
          className="min-w-[200px]"
        >
          Review & Submit (समीक्षा करें)
        </Button>
      </div>
    </div>
  );
}
