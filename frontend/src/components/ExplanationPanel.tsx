import React, { useState } from 'react';
import { UserCheck, Stethoscope, AlertTriangle, ShieldCheck, Palette, FileText } from 'lucide-react';

interface ExplanationData {
  patient_summary?: string;
  clinician_summary?: string;
  color_guide?: Array<{
    subregion: string;
    color: string;
    hex: string;
    meaning: string;
  }>;
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
  const limitations = explanation.limitations || [
    "Segmentation boundaries are estimated using deep learning feature representations.",
    "Edema boundaries on FLAIR may encompass both reactive vasogenic edema and microscopic infiltration.",
    "This model does not establish histopathological tumor grade or cancer diagnosis."
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col gap-4 shadow-sm transition-colors">
      {/* Header & Mode Selector */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Clinical Finding Interpretation
          </h3>
        </div>

        {/* Tab Toggle */}
        <div className="inline-flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
          <button
            onClick={() => setActiveTab('clinician')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition cursor-pointer ${
              activeTab === 'clinician'
                ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            Radiologist Note
          </button>
          <button
            onClick={() => setActiveTab('patient')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition cursor-pointer ${
              activeTab === 'patient'
                ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            Patient Summary
          </button>
        </div>
      </div>

      {/* Structured Clinical Impression Text */}
      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700/70">
        <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans">
          {activeTab === 'clinician' ? explanation.clinician_summary : explanation.patient_summary}
        </p>
      </div>

      {/* 3D Color Guide Legend */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <Palette className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          Anatomical Segmentation Mapping
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {colorGuide.map((item, idx) => (
            <div
              key={idx}
              className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700/60 text-xs"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.hex }} />
                <span className="font-semibold text-slate-900 dark:text-slate-100">{item.subregion}</span>
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                {item.meaning}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Clinical Advisory & Diagnostic Limitations */}
      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-lg p-3 text-xs flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
        <div className="flex flex-col gap-1 text-amber-900 dark:text-amber-200/90">
          <span className="font-semibold">Diagnostic Limitations & Methodology Notice:</span>
          <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-800 dark:text-amber-300/80">
            {limitations.map((lim, i) => (
              <li key={i}>{lim}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
