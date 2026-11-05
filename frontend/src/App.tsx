import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { PatientFriendlyView } from './components/PatientFriendlyView';
import { BrainViewer3D } from './components/BrainViewer3D';
import { SliceViewer2D } from './components/SliceViewer2D';
import { MetricsPanel } from './components/MetricsPanel';
import { ExplanationPanel } from './components/ExplanationPanel';
import { Box, Layers, BarChart3, HelpCircle, Upload, Sparkles, FileText } from 'lucide-react';

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
    setStatusMessage('Reconstructing 3D brain and calculating metrics...');
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
    setStatusMessage(`Analyzing ${file.name}...`);
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
    <div className="min-h-screen bg-[#080C14] text-slate-100 flex flex-col font-sans">
      {/* Top Navbar with Mode Switcher */}
      <Header viewMode={viewMode} onViewModeChange={setViewMode} />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        {/* Loading Message Banner */}
        {loading && statusMessage && (
          <div className="bg-blue-950/60 border border-blue-800 text-blue-200 px-5 py-3 rounded-xl text-xs flex items-center gap-2 animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* 1. PATIENT-FRIENDLY VIEW (DEFAULT) */}
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
          /* 2. CLINICIAN & RESEARCH VIEW (FOR EVALUATORS & DOCTORS) */
          <div className="flex flex-col gap-6">
            {/* Top Toolbar in Clinician Mode */}
            <div className="flex items-center justify-between bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
              <div className="text-xs text-slate-300">
                Active Scan: <span className="font-mono text-blue-400">{currentFilename}</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleLoadDemo}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs rounded-lg text-slate-300 border border-slate-700 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Reload Demo
                </button>
                <button
                  onClick={handleDownloadReport}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-xs rounded-lg text-white font-medium flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Export Medical PDF
                </button>
              </div>
            </div>

            {/* Top 3D & 2D Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7 flex flex-col gap-2">
                <div className="flex items-center gap-2 px-1 text-xs font-semibold text-slate-300 uppercase tracking-wide">
                  <Box className="w-4 h-4 text-blue-400" />
                  3D Isosurface Mesh Reconstruction
                </div>
                <BrainViewer3D meshes={meshes} loading={loading} simplifiedMode={false} />
              </div>

              <div className="lg:col-span-5 flex flex-col gap-2">
                <div className="flex items-center gap-2 px-1 text-xs font-semibold text-slate-300 uppercase tracking-wide">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  Multi-Planar Slice Inspection (MPR)
                </div>
                <SliceViewer2D sessionId={sessionId} />
              </div>
            </div>

            {/* Bottom Morphometrics & Technical Explanation */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 flex flex-col gap-2">
                <div className="flex items-center gap-2 px-1 text-xs font-semibold text-slate-300 uppercase tracking-wide">
                  <BarChart3 className="w-4 h-4 text-purple-400" />
                  Quantitative Morphometrics
                </div>
                <MetricsPanel metrics={metrics} />
              </div>

              <div className="lg:col-span-7 flex flex-col gap-2">
                <div className="flex items-center gap-2 px-1 text-xs font-semibold text-slate-300 uppercase tracking-wide">
                  <HelpCircle className="w-4 h-4 text-amber-400" />
                  Clinical Impression & Limitations
                </div>
                <ExplanationPanel explanation={explanation} />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-900 bg-slate-950/80 py-4 px-6 text-center text-xs text-slate-500">
        NeuroVision 3D • Academic Neural Networks & Deep Learning Implementation • 3D SegResNet & Marching Cubes
      </footer>
    </div>
  );
}
