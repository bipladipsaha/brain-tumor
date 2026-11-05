import React from 'react';
import { Activity, Box, Compass, Maximize, AlertCircle, CheckCircle2 } from 'lucide-react';

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
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex items-center justify-center text-slate-500 text-sm">
        No scan analysis loaded.
      </div>
    );
  }

  const { volumes, dimensions_mm, centroid_physical_mm, anatomical_location, tumor_detected } = metrics;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col gap-4 shadow-sm transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Quantitative Morphometrics
          </h3>
        </div>
        <span
          className={`text-xs px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1.5 ${
            tumor_detected
              ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900'
          }`}
        >
          {tumor_detected ? (
            <>
              <AlertCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
              <span>Suspicious Region Segmented</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span>No Significant Lesion</span>
            </>
          )}
        </span>
      </div>

      {/* Volumetric Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700/80">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Whole Tumor (WT)
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono">
            {volumes.whole_tumor_cm3} <span className="text-xs font-normal text-slate-500">cm³</span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            {metrics.voxel_counts.whole_tumor.toLocaleString()} voxels
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700/80">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 mb-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Tumor Core (TC)
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono">
            {volumes.tumor_core_cm3} <span className="text-xs font-normal text-slate-500">cm³</span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            {metrics.voxel_counts.tumor_core.toLocaleString()} voxels
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700/80">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 mb-1">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            Enhancing (ET)
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono">
            {volumes.enhancing_tumor_cm3} <span className="text-xs font-normal text-slate-500">cm³</span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            {metrics.voxel_counts.enhancing_tumor.toLocaleString()} voxels
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700/80">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 mb-1">
            <span className="w-2 h-2 rounded-full bg-sky-500" />
            Edema
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono">
            {volumes.edema_cm3} <span className="text-xs font-normal text-slate-500">cm³</span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            {metrics.voxel_counts.edema.toLocaleString()} voxels
          </div>
        </div>
      </div>

      {/* Spatial Localization Table */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Spatial Dimensions */}
        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700/70">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            <Maximize className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            Physical Dimensions
          </div>
          {dimensions_mm ? (
            <div className="font-mono text-xs text-slate-800 dark:text-slate-200">
              {dimensions_mm.length_x_mm} × {dimensions_mm.width_y_mm} × {dimensions_mm.height_z_mm} <span className="text-[10px] text-slate-500">mm</span>
              <div className="text-[10px] text-slate-500 font-sans mt-0.5">Along RAS scanner axes</div>
            </div>
          ) : (
            <span className="text-xs text-slate-400">N/A</span>
          )}
        </div>

        {/* Physical Centroid */}
        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700/70">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            <Compass className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Tumor Centroid
          </div>
          {centroid_physical_mm ? (
            <div className="font-mono text-xs text-slate-800 dark:text-slate-200">
              [{centroid_physical_mm.map((v) => v.toFixed(1)).join(', ')}] <span className="text-[10px] text-slate-500">mm</span>
              <div className="text-[10px] text-slate-500 font-sans mt-0.5">Scanner origin center of mass</div>
            </div>
          ) : (
            <span className="text-xs text-slate-400">N/A</span>
          )}
        </div>

        {/* Anatomical Region */}
        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700/70">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            <Box className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            Anatomical Localization
          </div>
          <div className="text-xs text-slate-800 dark:text-slate-200 font-medium leading-snug">
            {anatomical_location || 'Not localized'}
          </div>
        </div>
      </div>
    </div>
  );
};
