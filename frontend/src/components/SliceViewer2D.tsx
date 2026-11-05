import React, { useState, useEffect, useRef } from 'react';
import { Layers, Eye, EyeOff, Sliders } from 'lucide-react';

interface SliceViewer2DProps {
  sessionId: string | null;
}

export const SliceViewer2D: React.FC<SliceViewer2DProps> = ({ sessionId }) => {
  const [view, setView] = useState<'axial' | 'coronal' | 'sagittal'>('axial');
  const [sliceIndex, setSliceIndex] = useState<number>(32);
  const [maxSlices, setMaxSlices] = useState<number>(64);
  const [showOverlay, setShowOverlay] = useState<boolean>(true);
  const [overlayOpacity, setOverlayOpacity] = useState<number>(0.75);
  const [loading, setLoading] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Reset slice index whenever a new scan is loaded
  useEffect(() => {
    setSliceIndex(32);
  }, [sessionId]);

  // Fetch slice data from API
  useEffect(() => {
    if (!sessionId) return;
    let isCancelled = false;
    setLoading(true);

    fetch(`/api/analysis/${sessionId}/slices?view=${view}&slice_index=${sliceIndex}`)
      .then((res) => res.json())
      .then((data) => {
        if (isCancelled) return;
        setMaxSlices(data.max_slices);
        if (sliceIndex >= data.max_slices) {
          setSliceIndex(Math.floor(data.max_slices / 2));
        }
        renderSlice(data.mri_matrix, data.mask_matrix);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching slice:', err);
        setLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [sessionId, view, sliceIndex, showOverlay, overlayOpacity]);

  const renderSlice = (mri: number[][], mask: number[][]) => {
    const canvas = canvasRef.current;
    if (!canvas || !mri || mri.length === 0) return;

    const height = mri.length;
    const width = mri[0].length;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        const idx = (r * width + c) * 4;
        const val = mri[r][c];
        const isTumor = mask && mask[r] && mask[r][c] > 0;

        if (showOverlay && isTumor) {
          const alpha = overlayOpacity;
          // Glowing bright coral-red highlight
          data[idx] = Math.min(255, val * (1 - alpha) + 245 * alpha); // R
          data[idx + 1] = Math.min(255, val * (1 - alpha) + 50 * alpha); // G
          data[idx + 2] = Math.min(255, val * (1 - alpha) + 50 * alpha); // B
          data[idx + 3] = 255;
        } else {
          data[idx] = val;
          data[idx + 1] = val;
          data[idx + 2] = val;
          data[idx + 3] = 255;
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
  };

  const clampedIndex = Math.min(sliceIndex, Math.max(0, maxSlices - 1));

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
      {/* View Selector & Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-slate-200">2D Multi-Planar Slice View</h3>
        </div>

        {/* Plane Selector */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          {(['axial', 'coronal', 'sagittal'] as const).map((plane) => (
            <button
              key={plane}
              onClick={() => {
                setView(plane);
                setSliceIndex(Math.floor(maxSlices / 2));
              }}
              className={`px-3 py-1 rounded-md font-medium capitalize transition cursor-pointer ${
                view === plane ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {plane}
            </button>
          ))}
        </div>
      </div>

      {/* 2D Slice Canvas Display */}
      <div className="relative aspect-square max-h-[380px] w-full bg-black rounded-lg border border-slate-800 flex items-center justify-center overflow-hidden">
        {loading && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
            <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          </div>
        )}

        <canvas ref={canvasRef} className="max-h-full max-w-full object-contain" />

        <span className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] font-mono text-slate-400 bg-black/70 px-1.5 py-0.5 rounded">
          {view === 'axial' ? 'Anterior (A)' : 'Superior (S)'}
        </span>
        <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-mono text-slate-400 bg-black/70 px-1.5 py-0.5 rounded">
          {view === 'axial' ? 'Posterior (P)' : 'Inferior (I)'}
        </span>
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 bg-black/70 px-1.5 py-0.5 rounded">
          {view === 'sagittal' ? 'Anterior (A)' : 'Right (R)'}
        </span>
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 bg-black/70 px-1.5 py-0.5 rounded">
          {view === 'sagittal' ? 'Posterior (P)' : 'Left (L)'}
        </span>
      </div>

      {/* Slice Scrubber & Controls */}
      <div className="flex flex-col gap-2 pt-1 text-xs text-slate-300">
        <div className="flex items-center justify-between font-mono">
          <span>Slice: {clampedIndex} / {Math.max(0, maxSlices - 1)}</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowOverlay(!showOverlay)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] border transition cursor-pointer ${
                showOverlay ? 'bg-red-500/20 text-red-300 border-red-500/40' : 'bg-slate-800 text-slate-500 border-slate-700'
              }`}
            >
              {showOverlay ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              AI Mask Overlay
            </button>
            <div className="flex items-center gap-1.5">
              <Sliders className="w-3 h-3 text-slate-400" />
              <input
                type="range"
                min="0.2"
                max="1.0"
                step="0.05"
                value={overlayOpacity}
                onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
                className="w-16 accent-red-500 cursor-pointer"
                title="Overlay Opacity"
              />
            </div>
          </div>
        </div>

        <input
          type="range"
          min="0"
          max={Math.max(0, maxSlices - 1)}
          value={clampedIndex}
          onChange={(e) => setSliceIndex(parseInt(e.target.value))}
          className="w-full accent-blue-500 cursor-pointer"
        />
      </div>
    </div>
  );
};
