import React, { useState, useRef } from 'react';
import { Camera, UploadCloud, FileText, Sparkles, AlertCircle, Loader2 } from 'lucide-react';

/**
 * Large Touch Dropzone for Kiosk Medical Document Upload
 * Supports real PDF/JPG/PNG files as well as one-touch sample medical records.
 */
export default function DocumentUploadZone({
  onFileUpload,
  isProcessing = false,
  className = ''
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    setErrorMsg('');

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    setErrorMsg('');
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file) => {
    const validExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
    const lowerName = file.name.toLowerCase();
    const isValid = validExtensions.some((ext) => lowerName.endsWith(ext));

    if (!isValid) {
      setErrorMsg('Please upload a valid PDF, JPG, or PNG document.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg('File size exceeds the 15MB limit.');
      return;
    }

    if (onFileUpload) {
      onFileUpload(file);
    }
  };

  const handleSampleClick = (sampleType) => {
    setErrorMsg('');
    let sampleFile;

    if (sampleType === 'cbc_pdf') {
      sampleFile = new File(
        ['%PDF-1.4 sample CBC lab report text content with Hemoglobin: 11.2 g/dL and HbA1c: 7.4%'],
        'Diagnostic_Lab_CBC_Report.pdf',
        { type: 'application/pdf' }
      );
    } else if (sampleType === 'prescription_jpg') {
      sampleFile = new File(
        ['fake_image_bytes_prescription_slip'],
        'OPD_Prescription_Cardio.jpg',
        { type: 'image/jpeg' }
      );
    } else {
      sampleFile = new File(
        ['fake_image_bytes_chest_xray'],
        'Chest_XRay_Radiology_Report.pdf',
        { type: 'application/pdf' }
      );
    }

    if (onFileUpload) {
      onFileUpload(sampleFile);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Hidden native file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Main Kiosk Dropzone */}
      <div
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative overflow-hidden border-3 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all duration-200 select-none ${
          isProcessing
            ? 'border-amber-400 bg-amber-50/40 pointer-events-none'
            : isDragOver
            ? 'border-teal-600 bg-teal-100/50 scale-[1.01]'
            : 'border-teal-300 hover:border-teal-500 bg-teal-50/40 hover:bg-teal-50/70 active:scale-[0.99]'
        }`}
      >
        {/* Animated Laser Scanning Effect when processing OCR */}
        {isProcessing && (
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-teal-500 to-transparent animate-pulse duration-700" />
        )}

        <div className="w-16 h-16 rounded-2xl bg-teal-700 text-white flex items-center justify-center mx-auto shadow-md mb-3">
          {isProcessing ? (
            <Loader2 className="w-8 h-8 animate-spin" />
          ) : (
            <Camera className="w-8 h-8" />
          )}
        </div>

        <h3 className="text-xl sm:text-2xl font-black text-slate-900">
          {isProcessing
            ? 'Scanning Document with OCR Pipeline...'
            : 'Tap to Scan Paper or Upload (कागज़ स्कैन करें)'}
        </h3>

        <p className="text-xs sm:text-sm text-slate-600 font-semibold mt-1">
          {isProcessing
            ? 'Extracting medications, test parameters, and clinical dates'
            : 'Place prescription slip on scanner glass, or click / drag & drop PDF, JPG, PNG'}
        </p>

        <div className="flex items-center justify-center gap-2 mt-3">
          <span className="text-[11px] font-bold text-teal-800 bg-teal-200/80 px-3 py-1 rounded-full flex items-center gap-1">
            <UploadCloud className="w-3.5 h-3.5" />
            PDF / JPG / PNG (Max 15MB)
          </span>
          <span className="text-[11px] font-bold text-slate-700 bg-slate-200/80 px-2.5 py-1 rounded-full">
            Modular OCR Engine
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-800">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Quick Sample Document Chips for Kiosk Testing */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            Quick Sample Medical Records (परीक्षण हेतु नमूना पर्ची)
          </span>
          <span className="text-[10px] text-slate-400 font-medium">1-Tap Kiosk Demo</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => handleSampleClick('prescription_jpg')}
            className="text-xs font-bold px-3 py-2 rounded-xl bg-white border border-slate-200 hover:border-teal-500 hover:bg-teal-50 text-slate-800 transition shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            📄 + OPD Prescription Slip (JPG)
          </button>
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => handleSampleClick('cbc_pdf')}
            className="text-xs font-bold px-3 py-2 rounded-xl bg-white border border-slate-200 hover:border-teal-500 hover:bg-teal-50 text-slate-800 transition shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            🧪 + CBC & HbA1c Lab Report (PDF)
          </button>
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => handleSampleClick('xray_pdf')}
            className="text-xs font-bold px-3 py-2 rounded-xl bg-white border border-slate-200 hover:border-teal-500 hover:bg-teal-50 text-slate-800 transition shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            🩻 + Chest X-Ray Report (PDF)
          </button>
        </div>
      </div>
    </div>
  );
}
