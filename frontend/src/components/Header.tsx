import React from 'react';
import { Activity, UserCheck, Stethoscope, Database, Hospital, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  viewMode: 'patient' | 'clinician';
  onViewModeChange: (mode: 'patient' | 'clinician') => void;
  filename?: string;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  onViewModeChange,
  filename,
}) => {
  return (
    <header className="w-full bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5 sticky top-0 z-50 shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Left: Hospital / Clinical Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sky-700 text-white flex items-center justify-center font-bold shadow-xs">
            <Activity className="w-5 h-5 text-white stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-slate-900">
                NeuroVision
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200">
                Clinical Suite
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                PACS Online
              </span>
            </div>
            <p className="text-xs text-slate-500 font-normal">
              Department of Neuroradiology & Volumetric Neuro-Oncology
            </p>
          </div>
        </div>

        {/* Center: Active Study Badge (Desktop) */}
        {filename && (
          <div className="hidden lg:flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200 text-xs">
            <Database className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-medium">Active Study:</span>
            <span className="font-mono font-semibold text-slate-800 truncate max-w-xs">
              {filename}
            </span>
          </div>
        )}

        {/* Right: View Switcher */}
        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <div className="inline-flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => onViewModeChange('patient')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md font-medium transition cursor-pointer ${
                viewMode === 'patient'
                  ? 'bg-white text-sky-800 shadow-xs font-semibold border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              Patient Consultation
            </button>
            <button
              onClick={() => onViewModeChange('clinician')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md font-medium transition cursor-pointer ${
                viewMode === 'clinician'
                  ? 'bg-white text-sky-800 shadow-xs font-semibold border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              Diagnostic MPR
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
