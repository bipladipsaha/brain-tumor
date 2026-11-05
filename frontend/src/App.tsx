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
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [meshes, setMeshes] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [explanation, setExplanation] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [currentFilename, setCurrentFilename] = useState<string>('Sample_Patient_Scan.nii');

  useEffect(() => {
    handleLoadDemo();
  }, []);

  const handleLoadDemo = async () => {
    setLoading(true);
    setStatusMessage('Reconstructing 3D anatomical surfaces and calculating volumetrics...');
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
    setStatusMessage(`Analyzing ${file.name} with neural segmentation models...`);
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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Medical Header */}
      <Header
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        filename={currentFilename}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        {/* Loading Banner */}
        {loading && statusMessage && (
          <div className="bg-sky-50 border border-sky-200 text-sky-900 px-4 py-3 rounded-lg text-xs flex items-center gap-2.5 animate-pulse shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-600 animate-ping" />
            <span className="font-semibold">{statusMessage}</span>
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
          />
        ) : (
          /* 2. CLINICIAN & RADIOLOGIST DIAGNOSTIC VIEW */
          <div className="flex flex-col gap-6">
            {/* Top Clinical Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white border border-slate-200 p-4 rounded-xl shadow-sm gap-3">
              <div className="flex items-center gap-3 text-xs">
                <span className="font-semibold text-slate-500">Active Study:</span>
                <span className="font-mono bg-slate-100 px-2.5 py-1 rounded border border-slate-200 text-slate-800 font-medium">
                  {currentFilename}
                </span>
                <span className="hidden md:inline text-slate-300">•</span>
                <span className="hidden md:inline text-slate-600 font-medium">Voxel Spacing: 1.0 × 1.0 × 1.0 mm</span>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={handleLoadDemo}
                  disabled={loading}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-xs rounded-lg text-slate-700 border border-slate-300 flex items-center gap-1.5 font-medium transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  Reload Benchmark
                </button>
                <button
                  onClick={handleDownloadReport}
                  disabled={!sessionId}
                  className="px-3.5 py-1.5 bg-sky-700 hover:bg-sky-800 disabled:opacity-50 text-xs rounded-lg text-white font-medium flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Export Clinical PDF Report
                </button>
              </div>
            </div>

            {/* Upper Dual-Viewport (3D Mesh + 2D MPR Slices) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left: 3D Surface Reconstruction */}
              <div className="lg:col-span-7 flex flex-col gap-2">
                <div className="flex items-center justify-between px-1 text-xs">
                  <div className="flex items-center gap-2 font-semibold text-slate-800 uppercase tracking-wider">
                    <Box className="w-4 h-4 text-sky-700" />
                    3D Isosurface Surface Reconstruction
                  </div>
                  <span className="text-[11px] text-slate-500">Marching Cubes • 60 FPS WebGL</span>
                </div>
                <BrainViewer3D meshes={meshes} loading={loading} simplifiedMode={false} />
              </div>

              {/* Right: Multi-Planar Slice Scrubber */}
              <div className="lg:col-span-5 flex flex-col gap-2">
                <div className="flex items-center justify-between px-1 text-xs">
                  <div className="flex items-center gap-2 font-semibold text-slate-800 uppercase tracking-wider">
                    <Layers className="w-4 h-4 text-emerald-700" />
                    Multi-Planar Reconstruction (MPR)
                  </div>
                  <span className="text-[11px] text-slate-500">Axial / Coronal / Sagittal</span>
                </div>
                <SliceViewer2D sessionId={sessionId} />
              </div>
            </div>

            {/* Lower Diagnostic Grid (Morphometrics + Clinical Report) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 flex flex-col gap-2">
                <div className="flex items-center gap-2 px-1 text-xs font-semibold text-slate-800 uppercase tracking-wider">
                  <BarChart3 className="w-4 h-4 text-sky-700" />
                  Volumetric Morphometrics Table
                </div>
                <MetricsPanel metrics={metrics} />
              </div>

              <div className="lg:col-span-7 flex flex-col gap-2">
                <div className="flex items-center gap-2 px-1 text-xs font-semibold text-slate-800 uppercase tracking-wider">
                  <HelpCircle className="w-4 h-4 text-indigo-700" />
                  Clinical Findings & Decision Support
                </div>
                <ExplanationPanel explanation={explanation} />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Institutional Footer */}
      <footer className="w-full border-t border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-500">
        NeuroVision Clinical Suite • Volumetric Neuro-Oncology & 3D Modeling • Hospital Decision Support & Patient Consultation
      </footer>
    </div>
  );
}
