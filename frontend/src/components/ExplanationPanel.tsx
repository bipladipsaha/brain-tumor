import React, { useState } from 'react';
import { UserCheck, Stethoscope, AlertTriangle, ShieldCheck, Palette, Dna, Compass } from 'lucide-react';

interface ExplanationData {
  patient_summary?: string;
  clinician_summary?: string;
  color_guide?: Array<{
    subregion: string;
    color: string;
    hex: string;
    meaning: string;
  }>;
  clinical_dossier?: {
    subtype_profile?: string;
    differential_diagnosis?: string;
    molecular_recommendations?: Array<{
      biomarker: string;
      role: string;
    }>;
    surgical_considerations?: string;
    rano_summary?: string;
  };
  limitations?: string[];
  disclaimer?: string;
}

interface ExplanationPanelProps {
  explanation: ExplanationData | null;
}

export const ExplanationPanel: React.FC<ExplanationPanelProps> = ({ explanation }) => {
  const [activeTab, setActiveTab] = useState<'clinician' | 'patient'>('clinician');

  if (!explanation) {
    return null;
  }

  const colorGuide = explanation.color_guide || [];
  const dossier = explanation.clinical_dossier || {};
  const molecular = dossier.molecular_recommendations || [];
  const limitations = explanation.limitations || [
    "Segmentation boundaries are estimated using deep learning feature representations.",
    "Edema boundaries on FLAIR may encompass both reactive vasogenic edema and microscopic infiltration.",
    "This model does not establish histopathological tumor grade or cancer diagnosis."
  ];

  return (
    <div className="bg-[#122E34] border border-[#244C56] rounded-xl p-5 flex flex-col gap-4 shadow-md">
      {/* Header & Mode Selector */}
      <div className="flex items-center justify-between border-b border-[#244C56] pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#3B7E8C]" />
          <h3 className="text-sm font-semibold text-[#F1F5F9]">
            Clinical Finding Interpretation & Diagnostic Dossier
          </h3>
        </div>

        {/* Tab Toggle */}
        <div className="inline-flex bg-[#0E1D21] p-0.5 rounded-lg border border-[#244C56] text-xs">
          <button
            onClick={() => setActiveTab('clinician')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition cursor-pointer ${
              activeTab === 'clinician'
                ? 'bg-[#183840] text-[#F1F5F9] shadow-xs font-semibold border border-[#3B7E8C]'
                : 'text-[#677E8A] hover:text-[#ABAFB5]'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            Radiologist Note
          </button>
          <button
            onClick={() => setActiveTab('patient')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition cursor-pointer ${
              activeTab === 'patient'
                ? 'bg-[#183840] text-[#F1F5F9] shadow-xs font-semibold border border-[#3B7E8C]'
                : 'text-[#677E8A] hover:text-[#ABAFB5]'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            Patient Summary
          </button>
        </div>
      </div>

      {/* Structured Clinical Impression Text */}
      <div className="bg-[#0E1D21] p-4 rounded-lg border border-[#244C56]">
        <p className="text-xs sm:text-sm text-[#ABAFB5] leading-relaxed font-sans">
          {activeTab === 'clinician' ? explanation.clinician_summary : explanation.patient_summary}
        </p>
      </div>

      {/* Differential Diagnosis & Imaging Profile (Clinician Mode) */}
      {dossier.differential_diagnosis && (
        <div className="p-3.5 rounded-lg bg-[#0E1D21] border border-[#244C56] text-xs flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-[#F1F5F9] flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-[#3B7E8C]" />
              Differential Diagnosis & Phenotypic Pattern
            </span>
            {dossier.subtype_profile && (
              <span className="px-2 py-0.5 rounded bg-[#183840] text-[#ABAFB5] text-[10px] font-semibold border border-[#244C56]">
                {dossier.subtype_profile}
              </span>
            )}
          </div>
          <p className="text-[#ABAFB5] leading-relaxed">
            {dossier.differential_diagnosis}
          </p>
        </div>
      )}

      {/* WHO CNS 2021 Molecular Biomarkers Protocol */}
      {molecular.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#F1F5F9]">
            <Dna className="w-3.5 h-3.5 text-[#3B7E8C]" />
            WHO CNS 2021 Recommended Molecular Workup
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {molecular.map((m, idx) => (
              <div
                key={idx}
                className="bg-[#0E1D21] p-2.5 rounded-lg border border-[#244C56] flex flex-col gap-0.5"
              >
                <span className="font-semibold text-[#F1F5F9] text-[11px]">{m.biomarker}</span>
                <span className="text-[10px] text-[#677E8A] leading-tight">{m.role}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pre-Surgical Neuronavigation & Planning Notes */}
      {dossier.surgical_considerations && (
        <div className="p-3 rounded-lg bg-[#0E1D21] border border-[#244C56] text-xs flex flex-col gap-1">
          <span className="font-semibold text-[#F1F5F9] flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            Neuronavigation & Surgical Planning Notes
          </span>
          <p className="text-[#ABAFB5] text-[11px] leading-relaxed">
            {dossier.surgical_considerations}
          </p>
        </div>
      )}

      {/* 3D Color Guide Legend */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#F1F5F9]">
          <Palette className="w-3.5 h-3.5 text-[#3B7E8C]" />
          Anatomical Segmentation Mapping
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {colorGuide.map((item, idx) => (
            <div
              key={idx}
              className="bg-[#0E1D21] p-2.5 rounded-lg border border-[#244C56] text-xs"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.hex }} />
                <span className="font-semibold text-[#F1F5F9]">{item.subregion}</span>
              </div>
              <div className="text-[11px] text-[#677E8A] leading-snug">
                {item.meaning}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Clinical Advisory & Diagnostic Limitations */}
      <div className="bg-[#0E1D21] border border-amber-900/60 rounded-lg p-3 text-xs flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div className="flex flex-col gap-1 text-amber-300">
          <span className="font-semibold text-amber-200">Diagnostic Limitations & Methodology Notice:</span>
          <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-300/80">
            {limitations.map((lim, i) => (
              <li key={i}>{lim}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
