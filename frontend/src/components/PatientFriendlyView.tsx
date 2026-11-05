import React, { useRef } from 'react';
import { BrainViewer3D } from './BrainViewer3D';
import { Upload, FileText, MapPin, Ruler, Stethoscope, CheckCircle, Info, ArrowUpRight } from 'lucide-react';

interface PatientFriendlyViewProps {
  meshes: any;
  explanation: any;
  metrics: any;
  loading: boolean;
  onFileUpload: (file: File) => void;
  onLoadDemo: () => void;
  onDownloadReport: () => void;
  filename?: string;
  theme?: 'light' | 'dark';
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
  theme = 'dark',
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
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full">
      {/* 1. Clinical Welcome & Study Ingestion Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-7 shadow-sm transition-colors">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex flex-col gap-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-400">
              <span className="w-2 h-2 rounded-full bg-sky-500" />
              Patient Consultation & Visual Education
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
              Understanding Your Brain Scan in 3D
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Medical scans can feel overwhelming. This interactive 3D model translates complex multi-slice MRI data into a clear anatomical view so you can easily understand its location, volume, and depth with your physician.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 w-full md:w-auto shrink-0">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".nii,.nii.gz,.jpg,.jpeg,.png,.webp"
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="px-5 py-3 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              Upload MRI Scan or Photo
            </button>

            <button
              onClick={onLoadDemo}
              disabled={loading}
              className="px-5 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              Load Sample Patient Case
            </button>
          </div>
        </div>

        {/* Accepted Formats Footer */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
          <span>Supported Formats: <strong>DICOM/NIfTI</strong> (.nii, .nii.gz) and <strong>Photographic MRI Slices</strong> (.jpg, .png)</span>
          <span className="text-slate-400">Zero data retention • HIPAA-safe local compute</span>
        </div>
      </div>

      {/* 2. Interactive 3D Model Viewport */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm transition-colors">
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Interactive 3D Brain Anatomy
            </h3>
            {filename && (
              <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded font-mono border border-slate-200 dark:border-slate-700">
                {filename}
              </span>
            )}
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
            Drag with left mouse to rotate • Scroll to zoom
          </span>
        </div>

        <div className="p-3">
          <BrainViewer3D meshes={meshes} loading={loading} simplifiedMode={true} theme={theme} />
        </div>
      </div>

      {/* 3. Plain-Language Clinical Summary Cards */}
      {explanation && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Anatomical Location */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col gap-3 shadow-sm transition-colors">
            <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
              <div className="p-2 bg-sky-50 dark:bg-sky-950/60 rounded-lg border border-sky-100 dark:border-sky-900">
                <MapPin className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              </div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Anatomical Location</h4>
            </div>

            <div className="flex flex-col gap-1.5 flex-1">
              <div className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {friendly.location_title || 'Identified Region'}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {friendly.location_role || 'The scan has identified an area of clinical interest in the specified cranial region.'}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
              Corresponds with the amber highlight in the 3D viewer.
            </div>
          </div>

          {/* Card 2: Size & Physical Measurements */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col gap-3 shadow-sm transition-colors">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 rounded-lg border border-emerald-100 dark:border-emerald-900">
                <Ruler className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Estimated Size</h4>
            </div>

            <div className="flex flex-col gap-1.5 flex-1">
              <div className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {friendly.analogy_title || (isDetected ? 'Measurable lesion' : 'No mass effect')}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-mono">
                {friendly.analogy_desc || `Estimated volume: ${metrics?.volumes?.whole_tumor_cm3 || 0} cm³.`}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
              Calculated via true voxel integration across scanner axes.
            </div>
          </div>

          {/* Card 3: Consultation Preparation */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col gap-3 shadow-sm transition-colors">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 rounded-lg border border-indigo-100 dark:border-indigo-900">
                <Stethoscope className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Doctor Consultation</h4>
            </div>

            <div className="flex flex-col gap-1.5 flex-1">
              <div className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Recommended Questions
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Take this 3D model to your appointment. Many detected areas represent benign tissue, fluid collections, or post-inflammatory changes.
              </p>
            </div>

            <button
              onClick={onDownloadReport}
              className="mt-1 w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              Download Consultation PDF
            </button>
          </div>
        </div>
      )}

      {/* 4. Ethical Medical Notice */}
      <div className="bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-start gap-3 text-xs text-slate-600 dark:text-slate-400">
        <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Patient Advisory:</strong> NeuroVision 3D is an educational consultation aid. Segmentation boundaries and volume calculations are quantitative estimations generated by deep learning models. Final diagnosis, grading, and management plans must always be confirmed by your licensed neuro-oncology physician.
        </p>
      </div>
    </div>
  );
};
