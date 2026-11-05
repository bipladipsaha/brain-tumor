import React, { useRef, useState } from 'react';
import { BrainViewer3D } from './BrainViewer3D';
import { 
  Upload, FileText, MapPin, Ruler, Stethoscope, CheckCircle2, 
  Info, Activity, ShieldCheck, HelpCircle, ChevronDown, ChevronUp 
} from 'lucide-react';

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
  const [showChecklist, setShowChecklist] = useState<boolean>(true);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  const friendly = explanation?.friendly_details || {};
  const isDetected = metrics?.tumor_detected;
  const comp = metrics?.tissue_composition || { core_percent: 60, edema_percent: 40 };
  const symptoms = friendly.symptoms_to_monitor || [];
  const questions = friendly.consultation_questions || [];

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full">
      {/* 1. Welcoming Hero Ingestion Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex flex-col gap-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-700">
              <span className="w-2 h-2 rounded-full bg-sky-500" />
              Patient Consultation & Visual Education
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
              Understanding Your Brain Scan in 3D
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
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
              className="px-5 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              Load Sample Patient Case
            </button>
          </div>
        </div>

        {/* Accepted Formats Footer */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
          <span>Supported Formats: <strong>DICOM/NIfTI</strong> (.nii, .nii.gz) and <strong>Photographic MRI Slices</strong> (.jpg, .png)</span>
          <span className="text-slate-400">Zero data retention • HIPAA-safe local compute</span>
        </div>
      </div>

      {/* 2. Interactive 3D Model Centerpiece */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <h3 className="text-sm font-semibold text-slate-900">
              Interactive 3D Brain Anatomy
            </h3>
            {filename && (
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono border border-slate-200">
                {filename}
              </span>
            )}
          </div>
          <span className="text-xs text-slate-500 hidden sm:inline">
            Drag with left mouse to rotate • Scroll to zoom
          </span>
        </div>

        <div className="p-3">
          <BrainViewer3D meshes={meshes} loading={loading} simplifiedMode={true} />
        </div>
      </div>

      {/* 3. Primary Plain-English Summary Cards */}
      {explanation && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Anatomical Location */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-3 shadow-sm">
            <div className="flex items-center gap-2 text-sky-600">
              <div className="p-2 bg-sky-50 rounded-lg border border-sky-100">
                <MapPin className="w-4 h-4 text-sky-600" />
              </div>
              <h4 className="text-sm font-semibold text-slate-900">Anatomical Location</h4>
            </div>

            <div className="flex flex-col gap-1.5 flex-1">
              <div className="text-base font-semibold text-slate-900">
                {friendly.location_title || 'Identified Region'}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {friendly.location_role || 'The scan has identified an area of clinical interest in the specified cranial region.'}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500">
              Corresponds with the highlighted spot in the 3D model.
            </div>
          </div>

          {/* Card 2: Size & Physical Measurements */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-3 shadow-sm">
            <div className="flex items-center gap-2 text-emerald-600">
              <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-100">
                <Ruler className="w-4 h-4 text-emerald-600" />
              </div>
              <h4 className="text-sm font-semibold text-slate-900">Estimated Size</h4>
            </div>

            <div className="flex flex-col gap-1.5 flex-1">
              <div className="text-base font-semibold text-slate-900">
                {friendly.size_comparison || (isDetected ? 'Measurable lesion' : 'No mass effect')}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-mono">
                Volume: <strong>{metrics?.volumes?.whole_tumor_cm3 || 0} cm³</strong>
                {metrics?.dimensions_mm && (
                  <span className="block text-[11px] text-slate-500 mt-1">
                    Span: {metrics.dimensions_mm.length_x_mm} × {metrics.dimensions_mm.width_y_mm} × {metrics.dimensions_mm.height_z_mm} mm
                  </span>
                )}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500">
              Calculated via true 3D voxel integration.
            </div>
          </div>

          {/* Card 3: Doctor Consultation */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-3 shadow-sm">
            <div className="flex items-center gap-2 text-indigo-600">
              <div className="p-2 bg-indigo-50 rounded-lg border border-indigo-100">
                <Stethoscope className="w-4 h-4 text-indigo-600" />
              </div>
              <h4 className="text-sm font-semibold text-slate-900">Doctor Consultation</h4>
            </div>

            <div className="flex flex-col gap-1.5 flex-1">
              <div className="text-base font-semibold text-slate-900">
                Specialist Evaluation
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Take this 3D model and PDF report to your appointment with a neurosurgeon or neuro-oncologist.
              </p>
            </div>

            <button
              onClick={onDownloadReport}
              className="mt-1 w-full py-2 px-3 rounded-lg bg-sky-700 hover:bg-sky-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              Download Consultation PDF
            </button>
          </div>
        </div>
      )}

      {/* 4. EXTENSIVE CLINICAL INTELLIGENCE DOSSIER */}
      {isDetected && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Brain Function & Symptoms to Watch (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            {/* Functional Brain Map & Symptoms */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 text-sky-700 pb-3 border-b border-slate-100">
                <Activity className="w-4 h-4 text-sky-700" />
                <h4 className="text-sm font-semibold text-slate-900">
                  Brain Function & Clinical Symptoms to Monitor
                </h4>
              </div>

              <div className="mt-3.5 flex flex-col gap-3">
                <div className="p-3 bg-sky-50 border border-sky-100 rounded-lg text-xs">
                  <span className="font-semibold text-sky-900">Area Responsibilities: </span>
                  <span className="text-sky-800">{friendly.location_role}</span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-slate-700">
                    Specific Symptoms to Note & Report to Your Care Team:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                    {symptoms.map((symptom: string, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs text-slate-700"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
                        <span className="leading-snug">{symptom}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Understanding Lesions & Fluid Swelling (Demystifying Fear) */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 text-indigo-700 pb-3 border-b border-slate-100">
                <HelpCircle className="w-4 h-4 text-indigo-700" />
                <h4 className="text-sm font-semibold text-slate-900">
                  Understanding What This Finding Means
                </h4>
              </div>

              <div className="mt-3 text-xs text-slate-600 leading-relaxed flex flex-col gap-2.5">
                <p>
                  {friendly.understanding_lesion}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="font-semibold text-slate-900 block mb-0.5">Benign Tissue</span>
                    <span className="text-[11px] text-slate-500">Non-cancerous growths, cysts, or calcifications that grow very slowly.</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="font-semibold text-slate-900 block mb-0.5">Surrounding Swelling</span>
                    <span className="text-[11px] text-slate-500">Fluid buildup (edema) around the core, often treated with medications.</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="font-semibold text-slate-900 block mb-0.5">Histopathology</span>
                    <span className="text-[11px] text-slate-500">Only a laboratory tissue analysis under a microscope confirms the exact grade.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Tissue Composition & Doctor Checklist (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            {/* Tissue Subregion Breakdown */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 text-emerald-700 pb-3 border-b border-slate-100">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <h4 className="text-sm font-semibold text-slate-900">
                  Tissue Composition Breakdown
                </h4>
              </div>

              <div className="mt-3 flex flex-col gap-3">
                {/* Visual Proportion Bar */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs font-medium text-slate-700">
                    <span>Core vs Swelling Ratio</span>
                    <span className="font-mono text-[11px] text-slate-500">
                      Core: {comp.core_percent}% | Edema: {comp.edema_percent}%
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${comp.core_percent}%` }}
                      className="bg-amber-500 h-full"
                      title={`Tumor Core: ${comp.core_percent}%`}
                    />
                    <div
                      style={{ width: `${comp.edema_percent}%` }}
                      className="bg-emerald-500 h-full"
                      title={`Edema (Swelling): ${comp.edema_percent}%`}
                    />
                  </div>
                </div>

                {/* Subregion stats */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200">
                    <div className="flex items-center gap-1.5 text-amber-800 font-semibold mb-0.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      Tumor Core (TC)
                    </div>
                    <div className="font-mono text-slate-900 font-bold">
                      {metrics?.volumes?.tumor_core_cm3 || 0} cm³
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Central dense lesion</div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
                    <div className="flex items-center gap-1.5 text-emerald-800 font-semibold mb-0.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Fluid Edema
                    </div>
                    <div className="font-mono text-slate-900 font-bold">
                      {metrics?.volumes?.edema_cm3 || 0} cm³
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Reactive tissue swelling</div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <strong>Clinical Note:</strong> A significant portion of brain MRI volume is often vasogenic fluid swelling rather than actual tumor mass.
                </div>
              </div>
            </div>

            {/* Questions to Ask Doctor Checklist */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div
                onClick={() => setShowChecklist(!showChecklist)}
                className="flex items-center justify-between cursor-pointer select-none pb-2 border-b border-slate-100"
              >
                <div className="flex items-center gap-2 text-indigo-700">
                  <Stethoscope className="w-4 h-4 text-indigo-700" />
                  <h4 className="text-sm font-semibold text-slate-900">
                    Questions for Your Consultation
                  </h4>
                </div>
                {showChecklist ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </div>

              {showChecklist && (
                <div className="mt-3 flex flex-col gap-2">
                  <p className="text-[11px] text-slate-500">
                    Click each item or bring this list to your appointment:
                  </p>
                  <div className="flex flex-col gap-2">
                    {questions.map((q: string, idx: number) => (
                      <label
                        key={idx}
                        className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs text-slate-700 cursor-pointer transition"
                      >
                        <input type="checkbox" className="mt-0.5 accent-sky-600 rounded cursor-pointer" />
                        <span className="leading-snug">{q}</span>
                      </label>
                    ))}
                  </div>

                  <button
                    onClick={onDownloadReport}
                    className="mt-2 w-full py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Download Complete Patient Report (PDF)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. Ethical Medical Advisory */}
      <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 flex items-start gap-3 text-xs text-slate-600">
        <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Patient Advisory:</strong> NeuroVision 3D is an educational consultation aid. Segmentation boundaries and volume calculations are quantitative estimations generated by deep learning models. Final diagnosis, grading, and management plans must always be confirmed by your licensed neuro-oncology physician.
        </p>
      </div>
    </div>
  );
};
