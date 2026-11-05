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
    <div className="min-h-screen bg-[#0E1D21] text-[#ABAFB5] flex flex-col font-sans selection:bg-[#3B7E8C] selection:text-white">
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
          <div className="bg-[#122E34] border border-[#3B7E8C] text-[#F1F5F9] px-4 py-3 rounded-lg text-xs flex items-center gap-2.5 animate-pulse shadow-md">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3B7E8C] animate-ping" />
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-[#122E34] border border-[#244C56] p-4 rounded-xl shadow-md gap-3">
              <div className="flex items-center gap-3 text-xs">
                <span className="font-semibold text-[#677E8A]">Active Study:</span>
                <span className="font-mono bg-[#0E1D21] px-2.5 py-1 rounded border border-[#244C56] text-[#F1F5F9] font-medium">
                  {currentFilename}
                </span>
                <span className="hidden md:inline text-[#244C56]">•</span>
                <span className="hidden md:inline text-[#677E8A] font-medium">Voxel Spacing: 1.0 × 1.0 × 1.0 mm</span>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={handleLoadDemo}
                  disabled={loading}
                  className="px-3.5 py-1.5 bg-[#183840] hover:bg-[#244C56] text-xs rounded-lg text-[#F1F5F9] border border-[#244C56] flex items-center gap-1.5 font-medium transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#677E8A]" />
                  Reload Benchmark
                </button>
                <button
                  onClick={handleDownloadReport}
                  disabled={!sessionId}
                  className="px-3.5 py-1.5 bg-[#3B7E8C] hover:bg-[#4B92A1] disabled:opacity-50 text-xs rounded-lg text-white font-medium flex items-center gap-1.5 shadow-sm transition cursor-pointer"
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
                  <div className="flex items-center gap-2 font-semibold text-[#F1F5F9] uppercase tracking-wider">
                    <Box className="w-4 h-4 text-[#3B7E8C]" />
                    3D Isosurface Surface Reconstruction
                  </div>
                  <span className="text-[11px] text-[#677E8A]">Marching Cubes • 60 FPS WebGL</span>
                </div>
                <BrainViewer3D meshes={meshes} loading={loading} simplifiedMode={false} />
              </div>

              {/* Right: Multi-Planar Slice Scrubber */}
              <div className="lg:col-span-5 flex flex-col gap-2">
                <div className="flex items-center justify-between px-1 text-xs">
                  <div className="flex items-center gap-2 font-semibold text-[#F1F5F9] uppercase tracking-wider">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    Multi-Planar Reconstruction (MPR)
                  </div>
                  <span className="text-[11px] text-[#677E8A]">Axial / Coronal / Sagittal</span>
                </div>
                <SliceViewer2D sessionId={sessionId} />
              </div>
            </div>

            {/* Lower Diagnostic Grid (Morphometrics + Clinical Report) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 flex flex-col gap-2">
                <div className="flex items-center gap-2 px-1 text-xs font-semibold text-[#F1F5F9] uppercase tracking-wider">
                  <BarChart3 className="w-4 h-4 text-[#3B7E8C]" />
                  Volumetric Morphometrics Table
                </div>
                <MetricsPanel metrics={metrics} />
              </div>

              <div className="lg:col-span-7 flex flex-col gap-2">
                <div className="flex items-center gap-2 px-1 text-xs font-semibold text-[#F1F5F9] uppercase tracking-wider">
                  <HelpCircle className="w-4 h-4 text-[#3B7E8C]" />
                  Clinical Findings & Decision Support
                </div>
                <ExplanationPanel explanation={explanation} />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Institutional Footer */}
      <footer className="w-full border-t border-[#244C56] bg-[#0E1D21] py-4 px-6 text-center text-xs text-[#677E8A]">
        NeuroVision Clinical Suite • Volumetric Neuro-Oncology & 3D Modeling • Hospital Decision Support & Patient Consultation
      </footer>
    </div>
  );
}
