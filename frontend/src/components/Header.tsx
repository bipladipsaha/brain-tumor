import React from 'react';
import { Brain, UserCheck, Stethoscope } from 'lucide-react';

interface HeaderProps {
  viewMode: 'patient' | 'clinician';
  onViewModeChange: (mode: 'patient' | 'clinician') => void;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  onViewModeChange,
}) => {
  return (
    <header className="w-full bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-6 py-4 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        {/* Brand & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">NeuroVision 3D</h1>
            </div>
            <p className="text-xs text-slate-400">
              AI-Powered Brain Tumour Detection & 3D Visualization
            </p>
          </div>
        </div>

        {/* View Switcher: Patient Friendly (Default) vs Clinician / Advanced */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => onViewModeChange('patient')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium transition cursor-pointer ${
              viewMode === 'patient'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Patient View
          </button>
          <button
            onClick={() => onViewModeChange('clinician')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium transition cursor-pointer ${
              viewMode === 'clinician'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            Clinician / Research View
          </button>
        </div>
      </div>
    </header>
  );
};
