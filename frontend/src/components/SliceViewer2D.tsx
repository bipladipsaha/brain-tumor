import React, { useState, useEffect, useRef } from 'react';
import { Layers, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

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

  useEffect(() => {
    setSliceIndex(36);
  }, [sessionId]);

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
          // Surgical coral red indicator
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
    <div className="bg-[#122E34] border border-[#244C56] rounded-xl p-4 flex flex-col gap-3 shadow-md">
      {/* View Selector & Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#3B7E8C]" />
          <h3 className="text-sm font-semibold text-[#F1F5F9]">
            Multi-Planar Reconstruction (MPR)
          </h3>
        </div>

        {/* Plane Selector Tabs */}
        <div className="inline-flex bg-[#0E1D21] p-0.5 rounded-md text-xs border border-[#244C56]">
          {(['axial', 'coronal', 'sagittal'] as const).map((p) => (
            <button
              key={p}
              onClick={() => {
                setView(p);
                setSliceIndex(Math.floor(maxSlices / 2));
              }}
              className={`px-2.5 py-1 rounded capitalize font-medium transition cursor-pointer ${
                view === p
                  ? 'bg-[#183840] text-[#F1F5F9] shadow-xs font-semibold border border-[#3B7E8C]'
                  : 'text-[#677E8A] hover:text-[#ABAFB5]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Radiological Canvas Viewport with DICOM Overlay */}
      <div className="relative w-full aspect-square bg-[#0E1D21] rounded-lg overflow-hidden flex items-center justify-center border border-[#244C56]">
        <canvas ref={canvasRef} className="max-w-full max-h-full object-contain" />

        {/* DICOM Radiological Headings */}
        <div className="absolute top-2 left-2.5 pointer-events-none font-mono text-[10px] text-[#677E8A] leading-tight">
          <div>SERIES: 01</div>
          <div className="uppercase">{view} VIEW</div>
        </div>

        <div className="absolute top-2 right-2.5 pointer-events-none font-mono text-[10px] text-[#677E8A] text-right leading-tight">
          <div>FOV: 256 mm</div>
          <div>THK: 1.0 mm</div>
        </div>

        {/* Anatomical Orientation Watermarks */}
        <div className="absolute top-1.5 inset-x-0 text-center pointer-events-none text-[10px] font-bold text-[#677E8A] uppercase">
          Anterior (A)
        </div>
        <div className="absolute bottom-1.5 inset-x-0 text-center pointer-events-none text-[10px] font-bold text-[#677E8A] uppercase">
          Posterior (P)
        </div>
        <div className="absolute inset-y-0 left-2 flex items-center pointer-events-none text-[10px] font-bold text-[#677E8A]">
          R
        </div>
        <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-[10px] font-bold text-[#677E8A]">
          L
        </div>

        {/* Bottom DICOM Metadata */}
        <div className="absolute bottom-2 left-2.5 pointer-events-none font-mono text-[10px] text-[#677E8A]">
          W: 1024 L: 512
        </div>
        <div className="absolute bottom-2 right-2.5 pointer-events-none font-mono text-[10px] text-emerald-400 font-semibold">
          Slice: {clampedIndex + 1} / {maxSlices}
        </div>

        {loading && (
          <div className="absolute inset-0 bg-[#0E1D21]/80 backdrop-blur-[1px] flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-[#3B7E8C] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Slice Navigation Controls */}
      <div className="flex flex-col gap-2 pt-1">
        <div className="flex items-center justify-between text-xs text-[#ABAFB5]">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSliceIndex(Math.max(0, sliceIndex - 1))}
              disabled={sliceIndex <= 0}
              className="p-1 rounded bg-[#0E1D21] hover:bg-[#183840] disabled:opacity-30 border border-[#244C56] cursor-pointer text-[#ABAFB5]"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono font-medium text-[#F1F5F9]">
              {clampedIndex + 1} / {maxSlices}
            </span>
            <button
              onClick={() => setSliceIndex(Math.min(maxSlices - 1, sliceIndex + 1))}
              disabled={sliceIndex >= maxSlices - 1}
              className="p-1 rounded bg-[#0E1D21] hover:bg-[#183840] disabled:opacity-30 border border-[#244C56] cursor-pointer text-[#ABAFB5]"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* AI Mask Overlay Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowOverlay(!showOverlay)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium border transition cursor-pointer ${
                showOverlay
                  ? 'bg-rose-950/70 text-rose-300 border-rose-800 font-semibold'
                  : 'text-[#677E8A] border-[#244C56]'
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
                className="w-16 h-1 bg-[#0E1D21] rounded-lg appearance-none cursor-pointer accent-rose-500"
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
          className="w-full h-1.5 bg-[#0E1D21] rounded-lg appearance-none cursor-pointer accent-[#3B7E8C]"
        />
      </div>
    </div>
  );
};
