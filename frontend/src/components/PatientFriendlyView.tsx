import React, { useRef } from 'react';
import { BrainViewer3D } from './BrainViewer3D';
import { Upload, Sparkles, MapPin, Ruler, Stethoscope, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

interface PatientFriendlyViewProps {
  meshes: any;
  explanation: any;
  metrics: any;
  loading: boolean;
  onFileUpload: (file: File) => void;
  onLoadDemo: () => void;
  onDownloadReport: () => void;
  filename?: string;
}

export const PatientFriendlyView: React.FC<PatientFriendlyViewProps> = ({
  meshes,
  explanation,
  metrics,
  loading,
  onFileUpload,
  onLoadDemo,
  onDownloadReport,
  filename,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  const friendly = explanation?.friendly_details || {};
  const isDetected = metrics?.tumor_detected;

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full">
      {/* 1. Welcoming Hero Upload Banner */}
      <div className="bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="flex flex-col gap-2 max-w-xl text-center md:text-left">
          <div className="inline-flex items-center gap-2 self-center md:self-start bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            AI-Powered 3D Brain Analysis
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Understand Your Brain Scan in 3D
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Upload your MRI picture or scan. Our AI will locate any suspicious spots and build an interactive 3D model so you can clearly see its size, depth, and location.
          </p>
        </div>

        {/* Upload Buttons */}
        <div className="flex flex-col sm:flex-row md:flex-col gap-3 w-full md:w-auto shrink-0">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".nii,.nii.gz,.jpg,.jpeg,.png"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            Upload MRI Picture / Scan
          </button>

          <button
            onClick={onLoadDemo}
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-slate-700/80 text-xs font-medium flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            Try Example Patient Scan
          </button>
        </div>
      </div>

      {/* 2. Interactive 3D Model Centerpiece */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-white">Your Interactive 3D Model</h3>
            {filename && (
              <span className="text-xs bg-slate-800 text-slate-400 px-2.5 py-0.5 rounded-full font-mono">
                {filename}
              </span>
            )}
          </div>
          <span className="text-xs text-slate-400 hidden sm:inline">
            Use your mouse or finger to rotate the brain
          </span>
        </div>

        <BrainViewer3D meshes={meshes} loading={loading} simplifiedMode={true} />
      </div>

      {/* 3. Plain-English Summary Cards */}
      {explanation && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Where is it? */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col gap-3 shadow-lg">
            <div className="flex items-center gap-2.5 text-blue-400">
              <div className="p-2 bg-blue-500/10 rounded-xl">
                <MapPin className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-semibold text-white">Where is it located?</h4>
            </div>

            <div className="flex flex-col gap-1">
              <div className="text-base font-bold text-slate-100">
                {friendly.location_title || 'N/A'}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {friendly.location_role || 'Positioned within the displayed brain region.'}
              </p>
            </div>
          </div>

          {/* Card 2: How big is it? */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col gap-3 shadow-lg">
            <div className="flex items-center gap-2.5 text-amber-400">
              <div className="p-2 bg-amber-500/10 rounded-xl">
                <Ruler className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-semibold text-white">Approximate Size</h4>
            </div>

            <div className="flex flex-col gap-1">
              <div className="text-base font-bold text-slate-100">
                {friendly.size_comparison || '0.0 cm³'}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Estimated volume is {friendly.volume_str || '0.0 cm³'} (approx. {friendly.dimensions_str || 'N/A'}).
              </p>
            </div>
          </div>

          {/* Card 3: What does this mean? */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col gap-3 shadow-lg">
            <div className="flex items-center gap-2.5 text-emerald-400">
              <div className="p-2 bg-emerald-500/10 rounded-xl">
                <Stethoscope className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-semibold text-white">Doctor Evaluation</h4>
            </div>

            <div className="flex flex-col gap-1">
              <div className="text-base font-bold text-slate-100">
                {isDetected ? 'Ready for Doctor Review' : 'No Clear Lesion'}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isDetected
                  ? 'Keep this 3D model for your doctor visit. Many detected spots are benign or fluid collections.'
                  : 'The AI scan found no obvious abnormal tissue in this volume.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 4. Next Steps & Download Report */}
      {explanation && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-400" />
              What to do next with this scan:
            </h4>
            <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
              {explanation.next_steps?.map((step: string, i: number) => (
                <li key={i}>{step}</li>
              ))}
            </ul>
          </div>

          <button
            onClick={onDownloadReport}
            className="px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm flex items-center gap-2 shrink-0 shadow-lg shadow-emerald-600/25 transition cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            Download Summary Report (PDF)
          </button>
        </div>
      )}
    </div>
  );
};

