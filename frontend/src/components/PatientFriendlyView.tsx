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
  const classification = explanation?.classification;
  const isDetected = metrics?.tumor_detected;
  const comp = metrics?.tissue_composition || { core_percent: 60, edema_percent: 40 };
  const symptoms = friendly.symptoms_to_monitor || [];
  const questions = friendly.consultation_questions || [];

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full">
      {/* 1. Welcoming Hero Ingestion Card */}
      <div className="bg-[#122E34] border border-[#244C56] rounded-xl p-6 sm:p-7 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex flex-col gap-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#3B7E8C]">
              <span className="w-2 h-2 rounded-full bg-[#3B7E8C]" />
              Patient Consultation & Visual Education
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#F1F5F9]">
              Understanding Your Brain Scan in 3D
            </h2>
            <p className="text-sm text-[#ABAFB5] leading-relaxed">
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
              className="px-5 py-3 rounded-lg bg-[#3B7E8C] hover:bg-[#4B92A1] disabled:opacity-50 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              Upload MRI Scan or Photo
            </button>

            <button
              onClick={onLoadDemo}
              disabled={loading}
              className="px-5 py-2.5 rounded-lg bg-[#183840] hover:bg-[#244C56] text-[#F1F5F9] border border-[#244C56] text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              Load Sample Patient Case
            </button>
          </div>
        </div>

        {/* Accepted Formats Footer */}
        <div className="mt-5 pt-4 border-t border-[#244C56]/70 flex flex-wrap items-center justify-between text-xs text-[#677E8A] gap-2">
          <span>Supported Formats: <strong className="text-[#ABAFB5]">DICOM/NIfTI</strong> (.nii, .nii.gz) and <strong className="text-[#ABAFB5]">Photographic MRI Slices</strong> (.jpg, .png)</span>
          <span className="text-[#677E8A]">Zero data retention • HIPAA-safe local compute</span>
        </div>
      </div>

      {/* 2. Interactive 3D Model Centerpiece */}
      <div className="bg-[#122E34] border border-[#244C56] rounded-xl overflow-hidden shadow-md">
        <div className="px-5 py-3.5 border-b border-[#244C56] flex items-center justify-between bg-[#0E1D21]/60">
          <div className="flex items-center gap-2.5">
            <h3 className="text-sm font-semibold text-[#F1F5F9]">
              Interactive 3D Brain Anatomy
            </h3>
            {filename && (
              <span className="text-xs bg-[#0E1D21] text-[#ABAFB5] px-2 py-0.5 rounded font-mono border border-[#244C56]">
                {filename}
              </span>
            )}
          </div>
          <span className="text-xs text-[#677E8A] hidden sm:inline">
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
          <div className="bg-[#122E34] border border-[#244C56] rounded-xl p-5 flex flex-col gap-3 shadow-md">
            <div className="flex items-center gap-2 text-[#3B7E8C]">
              <div className="p-2 bg-[#0E1D21] rounded-lg border border-[#244C56]">
                <MapPin className="w-4 h-4 text-[#3B7E8C]" />
              </div>
              <h4 className="text-sm font-semibold text-[#F1F5F9]">Anatomical Location</h4>
            </div>

            <div className="flex flex-col gap-1.5 flex-1">
              <div className="text-base font-semibold text-[#F1F5F9]">
                {friendly.location_title || 'Identified Region'}
              </div>
              <p className="text-xs text-[#ABAFB5] leading-relaxed">
                {friendly.location_role || 'The scan has identified an area of clinical interest in the specified cranial region.'}
              </p>
            </div>

            <div className="pt-3 border-t border-[#244C56]/70 text-[11px] text-[#677E8A]">
              Corresponds with the highlighted spot in the 3D model.
            </div>
          </div>

          {/* Card 2: Size & Physical Measurements */}
          <div className="bg-[#122E34] border border-[#244C56] rounded-xl p-5 flex flex-col gap-3 shadow-md">
            <div className="flex items-center gap-2 text-emerald-400">
              <div className="p-2 bg-[#0E1D21] rounded-lg border border-[#244C56]">
                <Ruler className="w-4 h-4 text-emerald-400" />
              </div>
              <h4 className="text-sm font-semibold text-[#F1F5F9]">Estimated Size</h4>
            </div>

            <div className="flex flex-col gap-1.5 flex-1">
              <div className="text-base font-semibold text-[#F1F5F9]">
                {friendly.size_comparison || (isDetected ? 'Measurable lesion' : 'No mass effect')}
              </div>
              <p className="text-xs text-[#ABAFB5] leading-relaxed font-mono">
                Volume: <strong className="text-[#F1F5F9]">{metrics?.volumes?.whole_tumor_cm3 || 0} cm³</strong>
                {metrics?.dimensions_mm && (
                  <span className="block text-[11px] text-[#677E8A] mt-1">
                    Span: {metrics.dimensions_mm.length_x_mm} × {metrics.dimensions_mm.width_y_mm} × {metrics.dimensions_mm.height_z_mm} mm
                  </span>
                )}
              </p>
            </div>

            <div className="pt-3 border-t border-[#244C56]/70 text-[11px] text-[#677E8A]">
              Calculated via true 3D voxel integration.
            </div>
          </div>

          {/* Card 3: Doctor Consultation */}
          <div className="bg-[#122E34] border border-[#244C56] rounded-xl p-5 flex flex-col gap-3 shadow-md">
            <div className="flex items-center gap-2 text-[#3B7E8C]">
              <div className="p-2 bg-[#0E1D21] rounded-lg border border-[#244C56]">
                <Stethoscope className="w-4 h-4 text-[#3B7E8C]" />
              </div>
              <h4 className="text-sm font-semibold text-[#F1F5F9]">Doctor Consultation</h4>
            </div>

            <div className="flex flex-col gap-1.5 flex-1">
              <div className="text-base font-semibold text-[#F1F5F9]">
                Specialist Evaluation
              </div>
              <p className="text-xs text-[#ABAFB5] leading-relaxed">
                Take this 3D model and PDF report to your appointment with a neurosurgeon or neuro-oncologist.
              </p>
            </div>

            <button
              onClick={onDownloadReport}
              className="mt-1 w-full py-2 px-3 rounded-lg bg-[#3B7E8C] hover:bg-[#4B92A1] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm"
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
            {/* AI Classification & Characterization Card */}
            {classification && classification.has_tumor && (
              <div className="bg-[#122E34] border border-[#244C56] rounded-xl p-5 shadow-md flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-[#244C56]/70 pb-2.5">
                  <div className="flex items-center gap-2 text-[#3B7E8C]">
                    <ShieldCheck className="w-4 h-4 text-[#3B7E8C]" />
                    <h4 className="text-sm font-semibold text-[#F1F5F9]">
                      AI Finding Characterization & Predicted Type
                    </h4>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#183840] text-[#3B7E8C] border border-[#244C56]">
                    {(classification.confidence * 100).toFixed(0)}% Likelihood Match
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-[#F1F5F9]">
                      {classification.primary_class}
                    </span>
                    <span className="text-xs text-amber-300 font-medium px-2 py-0.5 rounded bg-[#0E1D21] border border-amber-900/60">
                      {classification.who_grade}
                    </span>
                  </div>
                  <p className="text-xs text-[#ABAFB5] leading-relaxed">
                    {classification.patient_note}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                  <div className="p-2.5 rounded-lg bg-[#0E1D21] border border-[#244C56]">
                    <span className="text-[10px] text-[#677E8A] block">Origin / Pathway</span>
                    <span className="text-[#F1F5F9] font-medium">{classification.origin}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#0E1D21] border border-[#244C56]">
                    <span className="text-[10px] text-[#677E8A] block">Growth Behavior</span>
                    <span className="text-amber-400 font-medium">{classification.malignancy}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Functional Brain Map & Symptoms */}
            <div className="bg-[#122E34] border border-[#244C56] rounded-xl p-5 shadow-md">
              <div className="flex items-center gap-2 text-[#3B7E8C] pb-3 border-b border-[#244C56]/70">
                <Activity className="w-4 h-4 text-[#3B7E8C]" />
                <h4 className="text-sm font-semibold text-[#F1F5F9]">
                  Brain Function & Clinical Symptoms to Monitor
                </h4>
              </div>

              <div className="mt-3.5 flex flex-col gap-3">
                <div className="p-3 bg-[#0E1D21] border border-[#244C56] rounded-lg text-xs">
                  <span className="font-semibold text-[#F1F5F9]">Area Responsibilities: </span>
                  <span className="text-[#ABAFB5]">{friendly.location_role}</span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-[#F1F5F9]">
                    Specific Symptoms to Note & Report to Your Care Team:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                    {symptoms.map((symptom: string, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 bg-[#0E1D21] p-2.5 rounded-lg border border-[#244C56] text-xs text-[#ABAFB5]"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#3B7E8C] shrink-0 mt-0.5" />
                        <span className="leading-snug">{symptom}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Understanding Lesions & Fluid Swelling (Demystifying Fear) */}
            <div className="bg-[#122E34] border border-[#244C56] rounded-xl p-5 shadow-md">
              <div className="flex items-center gap-2 text-[#3B7E8C] pb-3 border-b border-[#244C56]/70">
                <HelpCircle className="w-4 h-4 text-[#3B7E8C]" />
                <h4 className="text-sm font-semibold text-[#F1F5F9]">
                  Understanding What This Finding Means
                </h4>
              </div>

              <div className="mt-3 text-xs text-[#ABAFB5] leading-relaxed flex flex-col gap-2.5">
                <p>
                  {friendly.understanding_lesion}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <div className="p-2.5 rounded-lg bg-[#0E1D21] border border-[#244C56]">
                    <span className="font-semibold text-[#F1F5F9] block mb-0.5">Benign Tissue</span>
                    <span className="text-[11px] text-[#677E8A]">Non-cancerous growths, cysts, or calcifications that grow slowly.</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#0E1D21] border border-[#244C56]">
                    <span className="font-semibold text-[#F1F5F9] block mb-0.5">Surrounding Swelling</span>
                    <span className="text-[11px] text-[#677E8A]">Fluid buildup (edema) around the core, often treated with medications.</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#0E1D21] border border-[#244C56]">
                    <span className="font-semibold text-[#F1F5F9] block mb-0.5">Histopathology</span>
                    <span className="text-[11px] text-[#677E8A]">Microscopic laboratory tissue analysis confirms the final grade.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Tissue Composition & Doctor Checklist (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            {/* Tissue Subregion Breakdown */}
            <div className="bg-[#122E34] border border-[#244C56] rounded-xl p-5 shadow-md">
              <div className="flex items-center gap-2 text-emerald-400 pb-3 border-b border-[#244C56]/70">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h4 className="text-sm font-semibold text-[#F1F5F9]">
                  Tissue Composition Breakdown
                </h4>
              </div>

              <div className="mt-3 flex flex-col gap-3">
                {/* Visual Proportion Bar */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs font-medium text-[#ABAFB5]">
                    <span>Core vs Swelling Ratio</span>
                    <span className="font-mono text-[11px] text-[#677E8A]">
                      Core: {comp.core_percent}% | Edema: {comp.edema_percent}%
                    </span>
                  </div>
                  <div className="w-full h-3 bg-[#0E1D21] rounded-full overflow-hidden flex border border-[#244C56]">
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
                  <div className="p-2.5 rounded-lg bg-[#0E1D21] border border-amber-900/60">
                    <div className="flex items-center gap-1.5 text-amber-300 font-semibold mb-0.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      Tumor Core (TC)
                    </div>
                    <div className="font-mono text-[#F1F5F9] font-bold">
                      {metrics?.volumes?.tumor_core_cm3 || 0} cm³
                    </div>
                    <div className="text-[10px] text-[#677E8A] mt-0.5">Central dense lesion</div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#0E1D21] border border-emerald-900/60">
                    <div className="flex items-center gap-1.5 text-emerald-300 font-semibold mb-0.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Fluid Edema
                    </div>
                    <div className="font-mono text-[#F1F5F9] font-bold">
                      {metrics?.volumes?.edema_cm3 || 0} cm³
                    </div>
                    <div className="text-[10px] text-[#677E8A] mt-0.5">Reactive tissue swelling</div>
                  </div>
                </div>

                <div className="text-[11px] text-[#ABAFB5] bg-[#0E1D21] p-2.5 rounded-lg border border-[#244C56]">
                  <strong className="text-[#F1F5F9]">Clinical Note:</strong> A significant portion of brain MRI volume is often vasogenic fluid swelling rather than actual tumor mass.
                </div>
              </div>
            </div>

            {/* Questions to Ask Doctor Checklist */}
            <div className="bg-[#122E34] border border-[#244C56] rounded-xl p-5 shadow-md">
              <div
                onClick={() => setShowChecklist(!showChecklist)}
                className="flex items-center justify-between cursor-pointer select-none pb-2 border-b border-[#244C56]/70"
              >
                <div className="flex items-center gap-2 text-[#3B7E8C]">
                  <Stethoscope className="w-4 h-4 text-[#3B7E8C]" />
                  <h4 className="text-sm font-semibold text-[#F1F5F9]">
                    Questions for Your Consultation
                  </h4>
                </div>
                {showChecklist ? <ChevronUp className="w-4 h-4 text-[#677E8A]" /> : <ChevronDown className="w-4 h-4 text-[#677E8A]" />}
              </div>

              {showChecklist && (
                <div className="mt-3 flex flex-col gap-2">
                  <p className="text-[11px] text-[#677E8A]">
                    Click each item or bring this list to your appointment:
                  </p>
                  <div className="flex flex-col gap-2">
                    {questions.map((q: string, idx: number) => (
                      <label
                        key={idx}
                        className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#0E1D21] hover:bg-[#183840] border border-[#244C56] text-xs text-[#ABAFB5] cursor-pointer transition"
                      >
                        <input type="checkbox" className="mt-0.5 accent-[#3B7E8C] rounded cursor-pointer" />
                        <span className="leading-snug">{q}</span>
                      </label>
                    ))}
                  </div>

                  <button
                    onClick={onDownloadReport}
                    className="mt-2 w-full py-2.5 rounded-lg bg-[#3B7E8C] hover:bg-[#4B92A1] text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
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
      <div className="bg-[#0E1D21]/80 border border-[#244C56] rounded-xl p-4 flex items-start gap-3 text-xs text-[#677E8A]">
        <Info className="w-4 h-4 text-[#3B7E8C] shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-[#ABAFB5]">Patient Advisory:</strong> NeuroVision 3D is an educational consultation aid. Segmentation boundaries and volume calculations are quantitative estimations generated by deep learning models. Final diagnosis, grading, and management plans must always be confirmed by your licensed neuro-oncology physician.
        </p>
      </div>
    </div>
  );
};
