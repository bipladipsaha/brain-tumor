import React, { useState } from 'react';
import { UserCheck, Stethoscope, AlertTriangle, ShieldCheck, Palette } from 'lucide-react';

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
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
      {/* Header & Mode Selector */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-slate-200">AI Clinical Finding Interpretation</h3>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('clinician')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition cursor-pointer ${
              activeTab === 'clinician'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            Clinician Report
          </button>
          <button
            onClick={() => setActiveTab('patient')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition cursor-pointer ${
              activeTab === 'patient'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            Patient Summary
          </button>
        </div>
      </div>

      {/* Explanation Text */}
      <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800/80">
        <p className="text-sm text-slate-300 leading-relaxed font-mono">
          {activeTab === 'clinician' ? explanation.clinician_summary : explanation.patient_summary}
        </p>
      </div>

      {/* 3D Color Guide Legend */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
          <Palette className="w-3.5 h-3.5 text-purple-400" />
          3D Highlighting & Color Guide
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {colorGuide.map((item, idx) => (
            <div key={idx} className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60 text-xs">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.hex }} />
                <span className="font-semibold text-slate-200">{item.subregion}</span>
              </div>
              <div className="text-[11px] text-slate-400 leading-snug">{item.meaning}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Limitations & Legal Disclaimer */}
      <div className="bg-amber-950/20 border border-amber-900/40 rounded-lg p-3 text-xs flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div className="flex flex-col gap-1 text-amber-200/90">
          <div className="font-semibold text-amber-400">Decision-Support Notice & Limitations</div>
          <div>{explanation.disclaimer || "Notice: For educational and clinical decision-support only."}</div>
          <ul className="list-disc list-inside text-[11px] text-amber-300/70 mt-1">
            {limitations.map((lim, i) => (
              <li key={i}>{lim}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
