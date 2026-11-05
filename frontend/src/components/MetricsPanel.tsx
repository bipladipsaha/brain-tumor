import React from 'react';
import { Activity, Box, Compass, Maximize, AlertCircle } from 'lucide-react';

interface MetricsData {
  tumor_detected: boolean;
  volumes: {
    whole_tumor_cm3: number;
    tumor_core_cm3: number;
    enhancing_tumor_cm3: number;
    edema_cm3: number;
  };
  voxel_counts: {
    whole_tumor: number;
    tumor_core: number;
    enhancing_tumor: number;
    edema: number;
  };
  dimensions_mm?: {
    length_x_mm: number;
    width_y_mm: number;
    height_z_mm: number;
  };
  bounding_box_voxels?: {
    min: number[];
    max: number[];
  };
  centroid_physical_mm?: number[];
  anatomical_location?: string;
  voxel_spacing_mm?: number[];
}

interface MetricsPanelProps {
  metrics: MetricsData | null;
}

export const MetricsPanel: React.FC<MetricsPanelProps> = ({ metrics }) => {
  if (!metrics) {
    return (
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 flex items-center justify-center text-slate-500 text-sm">
        No scan analysis loaded.
      </div>
    );
  }

  const { volumes, dimensions_mm, centroid_physical_mm, anatomical_location, tumor_detected } = metrics;

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-slate-200">Quantitative Morphometrics</h3>
        </div>
        <span
          className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
            tumor_detected
              ? 'bg-red-500/10 text-red-400 border border-red-500/30'
              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
          }`}
        >
          {tumor_detected ? 'Suspicious Region Segmented' : 'No Tumor Detected'}
        </span>
      </div>

      {/* Volumetric Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Whole Tumor (WT)
          </div>
          <div className="text-lg font-bold text-slate-100 font-mono">
            {volumes.whole_tumor_cm3} <span className="text-xs font-normal text-slate-400">cm³</span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            {metrics.voxel_counts.whole_tumor.toLocaleString()} voxels
          </div>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Tumor Core (TC)
          </div>
          <div className="text-lg font-bold text-slate-100 font-mono">
            {volumes.tumor_core_cm3} <span className="text-xs font-normal text-slate-400">cm³</span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            {metrics.voxel_counts.tumor_core.toLocaleString()} voxels
          </div>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            Active Enhancing (ET)
          </div>
          <div className="text-lg font-bold text-slate-100 font-mono">
            {volumes.enhancing_tumor_cm3} <span className="text-xs font-normal text-slate-400">cm³</span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            {metrics.voxel_counts.enhancing_tumor.toLocaleString()} voxels
          </div>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <span className="w-2 h-2 rounded-full bg-cyan-500" />
            Peritumoral Edema
          </div>
          <div className="text-lg font-bold text-slate-100 font-mono">
            {volumes.edema_cm3} <span className="text-xs font-normal text-slate-400">cm³</span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            {metrics.voxel_counts.edema.toLocaleString()} voxels
          </div>
        </div>
      </div>

      {/* Spatial Dimensions & Localization Grid */}
      {dimensions_mm && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800/60 flex items-start gap-2.5">
            <Maximize className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
            <div>
              <div className="font-semibold text-slate-300">Spatial Dimensions (mm)</div>
              <div className="font-mono text-slate-200 mt-1">
                {dimensions_mm.length_x_mm} × {dimensions_mm.width_y_mm} × {dimensions_mm.height_z_mm} mm
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">(L × W × H along RAS axes)</div>
            </div>
          </div>

          <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800/60 flex items-start gap-2.5">
            <Compass className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <div className="font-semibold text-slate-300">Tumor Centroid (Physical)</div>
              <div className="font-mono text-slate-200 mt-1">
                [{centroid_physical_mm?.join(', ')}] mm
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Center of mass in scanner space</div>
            </div>
          </div>

          <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800/60 flex items-start gap-2.5">
            <Box className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
            <div>
              <div className="font-semibold text-slate-300">Anatomical Region</div>
              <div className="text-slate-200 mt-1 font-medium">
                {anatomical_location}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">RAS coordinate mapping</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

