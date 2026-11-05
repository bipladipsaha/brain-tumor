import React, { useState, useEffect, useRef } from 'react';
import { Layers, Eye, EyeOff, Sliders, ChevronLeft, ChevronRight } from 'lucide-react';

interface SliceViewer2DProps {
  sessionId: string | null;
}

export const SliceViewer2D: React.FC<SliceViewer2DProps> = ({ sessionId }) => {
  const [view, setView] = useState<'axial' | 'coronal' | 'sagittal'>('axial');
  const [sliceIndex, setSliceIndex] = useState<number>(36);
  const [maxSlices, setMaxSlices] = useState<number>(72);
  const [showOverlay, setShowOverlay] = useState<boolean>(true);
  const [overlayOpacity, setOverlayOpacity] = useState<number>(0.75);
  const [loading, setLoading] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Reset slice index whenever a new scan is loaded
  useEffect(() => {
    setSliceIndex(36);
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
          // Clean surgical coral red
          data[idx] = Math.min(255, val * (1 - alpha) + 239 * alpha); // R
          data[idx + 1] = Math.min(255, val * (1 - alpha) + 68 * alpha); // G
          data[idx + 2] = Math.min(255, val * (1 - alpha) + 68 * alpha); // B
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
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col gap-3 shadow-sm transition-colors">
      {/* View Selector & Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Multi-Planar Reconstruction (MPR)
          </h3>
        </div>

        {/* Plane Selector Tabs */}
        <div className="inline-flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-md text-xs border border-slate-200 dark:border-slate-700">
          {(['axial', 'coronal', 'sagittal'] as const).map((p) => (
            <button
              key={p}
              onClick={() => {
                setView(p);
                setSliceIndex(Math.floor(maxSlices / 2));
              }}
              className={`px-2.5 py-1 rounded capitalize font-medium transition cursor-pointer ${
                view === p
                  ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Radiological Canvas Viewport with DICOM Overlay */}
      <div className="relative w-full aspect-square bg-black rounded-lg overflow-hidden flex items-center justify-center border border-slate-800">
        <canvas ref={canvasRef} className="max-w-full max-h-full object-contain" />

        {/* DICOM Radiological Headings */}
        <div className="absolute top-2 left-2.5 pointer-events-none font-mono text-[10px] text-slate-400/90 leading-tight">
          <div>SERIES: 01</div>
          <div className="uppercase">{view} VIEW</div>
        </div>

        <div className="absolute top-2 right-2.5 pointer-events-none font-mono text-[10px] text-slate-400/90 text-right leading-tight">
          <div>FOV: 256 mm</div>
          <div>THK: 1.0 mm</div>
        </div>

        {/* Anatomical Orientation Watermarks */}
        <div className="absolute top-1.5 inset-x-0 text-center pointer-events-none text-[10px] font-bold text-slate-500 uppercase">
          Anterior (A)
        </div>
        <div className="absolute bottom-1.5 inset-x-0 text-center pointer-events-none text-[10px] font-bold text-slate-500 uppercase">
          Posterior (P)
        </div>
        <div className="absolute inset-y-0 left-2 flex items-center pointer-events-none text-[10px] font-bold text-slate-500">
          R
        </div>
        <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-[10px] font-bold text-slate-500">
          L
        </div>

        {/* Bottom DICOM Metadata */}
        <div className="absolute bottom-2 left-2.5 pointer-events-none font-mono text-[10px] text-slate-400/90">
          W: 1024 L: 512
        </div>
        <div className="absolute bottom-2 right-2.5 pointer-events-none font-mono text-[10px] text-emerald-400 font-semibold">
          Slice: {clampedIndex + 1} / {maxSlices}
        </div>

        {loading && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Slice Navigation Controls */}
      <div className="flex flex-col gap-2 pt-1">
        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSliceIndex(Math.max(0, sliceIndex - 1))}
              disabled={sliceIndex <= 0}
              className="p-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-30 border border-slate-200 dark:border-slate-700 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
              {clampedIndex + 1} / {maxSlices}
            </span>
            <button
              onClick={() => setSliceIndex(Math.min(maxSlices - 1, sliceIndex + 1))}
              disabled={sliceIndex >= maxSlices - 1}
              className="p-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-30 border border-slate-200 dark:border-slate-700 cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* AI Mask Overlay Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowOverlay(!showOverlay)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border transition cursor-pointer ${
                showOverlay
                  ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                  : 'text-slate-400 border-slate-200 dark:border-slate-800'
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>AI Mask</span>
            </button>

            {showOverlay && (
              <input
                type="range"
                min="0.2"
                max="1.0"
                step="0.05"
                value={overlayOpacity}
                onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
                className="w-16 h-1 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-600"
                title="Mask Opacity"
              />
            )}
          </div>
        </div>

        {/* Slice Scrubber Track */}
        <input
          type="range"
          min="0"
          max={Math.max(0, maxSlices - 1)}
          value={clampedIndex}
          onChange={(e) => setSliceIndex(parseInt(e.target.value))}
          className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-600"
        />
      </div>
    </div>
  );
};
