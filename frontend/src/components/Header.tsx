import React from 'react';
import { Activity, UserCheck, Stethoscope, Sun, Moon, Database } from 'lucide-react';

interface HeaderProps {
  viewMode: 'patient' | 'clinician';
  onViewModeChange: (mode: 'patient' | 'clinician') => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  filename?: string;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  onViewModeChange,
  theme,
  onToggleTheme,
  filename,
}) => {
  return (
    <header className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3.5 sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Left: Institutional Logo & Details */}
        <div className="flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold shadow-sm">
            <Activity className="w-5 h-5 text-white stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                NeuroVision
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                Clinical Suite
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Diagnostic Neuro-Oncology & Volumetric 3D Modeling
            </p>
          </div>
        </div>

        {/* Center: Active Study Badge (Desktop) */}
        {filename && (
          <div className="hidden lg:flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-xs">
            <Database className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span className="text-slate-500 dark:text-slate-400">Active Study:</span>
            <span className="font-mono font-medium text-slate-800 dark:text-slate-200 truncate max-w-xs">
              {filename}
            </span>
          </div>
        )}

        {/* Right: Mode Switcher & Theme Toggle */}
        <div className="flex items-center gap-2.5 self-end md:self-auto">
          {/* View Mode Segmented Control */}
          <div className="inline-flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => onViewModeChange('patient')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${
                viewMode === 'patient'
                  ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              Patient View
            </button>
            <button
              onClick={() => onViewModeChange('clinician')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${
                viewMode === 'clinician'
                  ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              Diagnostic MPR
            </button>
          </div>

          {/* Theme Toggle (Clinical Light / PACS Dark) */}
          <button
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Switch to Clinical Light mode' : 'Switch to PACS Dark mode'}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </div>
      </div>
    </header>
  );
};
