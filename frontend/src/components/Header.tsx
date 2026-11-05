import React from 'react';
import { Activity, UserCheck, Stethoscope, Database, CheckCircle2 } from 'lucide-react';

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
    <header className="w-full bg-[#0E1D21] border-b border-[#244C56] px-4 sm:px-6 py-3.5 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Left: Hospital / Clinical Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#122E34] text-[#F1F5F9] border border-[#244C56] flex items-center justify-center font-bold shadow-xs">
            <Activity className="w-5 h-5 text-[#3B7E8C] stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-[#F1F5F9]">
                NeuroVision
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-[#122E34] text-[#ABAFB5] border border-[#244C56]">
                Clinical Suite
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-[#122E34] px-2 py-0.5 rounded border border-emerald-900/60">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                PACS Online
              </span>
            </div>
            <p className="text-xs text-[#677E8A] font-normal">
              Department of Neuroradiology & Volumetric Neuro-Oncology
            </p>
          </div>
        </div>

        {/* Center: Active Study Badge (Desktop) */}
        {filename && (
          <div className="hidden lg:flex items-center gap-2 bg-[#122E34] px-3 py-1.5 rounded-md border border-[#244C56] text-xs">
            <Database className="w-3.5 h-3.5 text-[#677E8A]" />
            <span className="text-[#677E8A] font-medium">Active Study:</span>
            <span className="font-mono font-semibold text-[#F1F5F9] truncate max-w-xs">
              {filename}
            </span>
          </div>
        )}

        {/* Right: View Switcher */}
        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <div className="inline-flex bg-[#091518] p-1 rounded-lg border border-[#244C56] text-xs">
            <button
              onClick={() => onViewModeChange('patient')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md font-medium transition cursor-pointer ${
                viewMode === 'patient'
                  ? 'bg-[#122E34] text-[#F1F5F9] shadow-xs font-semibold border border-[#3B7E8C]/80'
                  : 'text-[#677E8A] hover:text-[#ABAFB5]'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              Patient Consultation
            </button>
            <button
              onClick={() => onViewModeChange('clinician')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md font-medium transition cursor-pointer ${
                viewMode === 'clinician'
                  ? 'bg-[#122E34] text-[#F1F5F9] shadow-xs font-semibold border border-[#3B7E8C]/80'
                  : 'text-[#677E8A] hover:text-[#ABAFB5]'
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
