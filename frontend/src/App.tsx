import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { PatientFriendlyView } from './components/PatientFriendlyView';
import { BrainViewer3D } from './components/BrainViewer3D';
import { SliceViewer2D } from './components/SliceViewer2D';
import { MetricsPanel } from './components/MetricsPanel';
import { ExplanationPanel } from './components/ExplanationPanel';
import { Box, Layers, BarChart3, HelpCircle, FileText, RotateCcw } from 'lucide-react';

export default function App() {
  const [viewMode, setViewMode] = useState<'patient' | 'clinician'>('patient');
  const [theme, setTheme] = useState<'light' | 'dark'>('light'); // Default to clean modern Clinical Light
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [meshes, setMeshes] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [explanation, setExplanation] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [currentFilename, setCurrentFilename] = useState<string>('Sample_Patient_Scan.nii');

  // Sync theme with document class
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    handleLoadDemo();
  }, []);

  const handleLoadDemo = async () => {
    setLoading(true);
    setStatusMessage('Reconstructing 3D brain surfaces and calculating physical metrics...');
    try {
      const res = await fetch('/api/analysis/demo', { method: 'POST' });
      const data = await res.json();
      setSessionId(data.session_id);
      setMetrics(data.metrics);
      setExplanation(data.explanation);
      setCurrentFilename(data.filename || 'Sample_Patient_Scan.nii');

      const meshRes = await fetch(`/api/analysis/${data.session_id}/3d-mesh`);
      const meshData = await meshRes.json();
      setMeshes(meshData);
    } catch (err) {
      console.error('Failed to load demo:', err);
    } finally {
      setLoading(false);
      setStatusMessage('');
    }
  };

  const handleFileUpload = async (file: File) => {
    setLoading(true);
    setStatusMessage(`Processing ${file.name} with deep learning models...`);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/mri/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Upload failed');
      }

      const data = await res.json();
      setSessionId(data.session_id);
      setMetrics(data.metrics);
      setExplanation(data.explanation);
      setCurrentFilename(file.name);

      const meshRes = await fetch(`/api/analysis/${data.session_id}/3d-mesh`);
      const meshData = await meshRes.json();
      setMeshes(meshData);
    } catch (err: any) {
      alert(`Upload error: ${err.message}`);
    } finally {
      setLoading(false);
      setStatusMessage('');
    }
  };

  const handleDownloadReport = () => {
    if (!sessionId) return;
    window.open(`/api/analysis/${sessionId}/report`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Institutional Header with Mode & Theme Switcher */}
      <Header
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        theme={theme}
        onToggleTheme={toggleTheme}
        filename={currentFilename}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        {/* Loading Banner */}
        {loading && statusMessage && (
          <div className="bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-200 px-4 py-3 rounded-lg text-xs flex items-center gap-2.5 animate-pulse shadow-sm">
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping" />
            <span className="font-medium">{statusMessage}</span>
          </div>
        )}

        {/* 1. PATIENT CONSULTATION VIEW */}
        {viewMode === 'patient' ? (
          <PatientFriendlyView
            meshes={meshes}
            explanation={explanation}
            metrics={metrics}
            loading={loading}
            onFileUpload={handleFileUpload}
            onLoadDemo={handleLoadDemo}
            onDownloadReport={handleDownloadReport}
            filename={currentFilename}
            theme={theme}
          />
        ) : (
          /* 2. CLINICIAN & RESEARCH VIEW (AUTHENTIC PACS WORKSTATION) */
          <div className="flex flex-col gap-6">
            {/* Top Clinical Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm gap-3 transition-colors">
              <div className="flex items-center gap-3 text-xs">
                <span className="font-semibold text-slate-500 dark:text-slate-400">Study Series:</span>
                <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                  {currentFilename}
                </span>
                <span className="hidden md:inline text-slate-400">•</span>
                <span className="hidden md:inline text-slate-500 dark:text-slate-400">Voxel: 1.0 × 1.0 × 1.0 mm</span>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={handleLoadDemo}
                  disabled={loading}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs rounded-lg text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 font-medium transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  Reload Benchmark
                </button>
                <button
                  onClick={handleDownloadReport}
                  disabled={!sessionId}
                  className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-xs rounded-lg text-white font-medium flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Export Medical PDF Report
                </button>
              </div>
            </div>

            {/* Upper Dual-Viewport (3D Mesh + 2D MPR Slices) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left: 3D Surface Reconstruction */}
              <div className="lg:col-span-7 flex flex-col gap-2">
                <div className="flex items-center justify-between px-1 text-xs">
                  <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    <Box className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    3D Isosurface Surface Reconstruction
                  </div>
                  <span className="text-[11px] text-slate-400">Marching Cubes • 60 FPS WebGL</span>
                </div>
                <BrainViewer3D meshes={meshes} loading={loading} simplifiedMode={false} theme={theme} />
              </div>

              {/* Right: Multi-Planar Slice Scrubber */}
              <div className="lg:col-span-5 flex flex-col gap-2">
                <div className="flex items-center justify-between px-1 text-xs">
                  <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Multi-Planar Reconstruction (MPR)
                  </div>
                  <span className="text-[11px] text-slate-400">Axial / Coronal / Sagittal</span>
                </div>
                <SliceViewer2D sessionId={sessionId} />
              </div>
            </div>

            {/* Lower Diagnostic Grid (Morphometrics + Clinical Report) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 flex flex-col gap-2">
                <div className="flex items-center gap-2 px-1 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  <BarChart3 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  Volumetric Morphometrics Table
                </div>
                <MetricsPanel metrics={metrics} />
              </div>

              <div className="lg:col-span-7 flex flex-col gap-2">
                <div className="flex items-center gap-2 px-1 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  <HelpCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Clinical Findings & Decision Support
                </div>
                <ExplanationPanel explanation={explanation} />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Institutional Footer */}
      <footer className="w-full border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-4 px-6 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors">
        NeuroVision Clinical Suite • Volumetric Neuro-Oncology & 3D Modeling • For Clinical Decision Support & Patient Consultation
      </footer>
    </div>
  );
}
