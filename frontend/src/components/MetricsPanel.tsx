import React from 'react';
import { Activity, Box, Compass, Maximize, AlertCircle, CheckCircle2, Layers } from 'lucide-react';

interface MetricsData {
  tumor_detected: boolean;
  volumes: {
    whole_tumor_cm3: number;
    tumor_core_cm3: number;
    enhancing_tumor_cm3: number;
    edema_cm3: number;
  };
  tissue_composition?: {
    enhancing_percent: number;
    core_percent: number;
    edema_percent: number;
    edema_to_core_ratio: number;
  };
  rano_metrics?: {
    longest_diameter_mm: number;
    perpendicular_diameter_mm: number;
    bidimensional_product_mm2: number;
    morphology: string;
  };
  structural_impact?: {
    mass_effect: string;
    ventricular_compression: string;
    eloquence_rating: string;
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
      <div className="bg-[#122E34] border border-[#244C56] rounded-xl p-5 flex items-center justify-center text-[#677E8A] text-sm">
        No scan analysis loaded.
      </div>
    );
  }

  const { volumes, dimensions_mm, centroid_physical_mm, anatomical_location, tumor_detected, tissue_composition, rano_metrics, structural_impact } = metrics;

  return (
    <div className="bg-[#122E34] border border-[#244C56] rounded-xl p-5 flex flex-col gap-4 shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#244C56] pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#3B7E8C]" />
          <h3 className="text-sm font-semibold text-[#F1F5F9]">
            Quantitative Volumetric Morphometrics
          </h3>
        </div>
        <span
          className={`text-xs px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1.5 ${
            tumor_detected
              ? 'bg-rose-950/70 text-rose-300 border border-rose-800'
              : 'bg-emerald-950/70 text-emerald-300 border border-emerald-800'
          }`}
        >
          {tumor_detected ? (
            <>
              <AlertCircle className="w-3 h-3 text-rose-400" />
              <span>Suspicious Region Segmented</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>No Significant Lesion</span>
            </>
          )}
        </span>
      </div>

      {/* Volumetric Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#0E1D21] p-3 rounded-lg border border-[#244C56]">
          <div className="flex items-center gap-1.5 text-xs text-[#ABAFB5] mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Whole Tumor (WT)
          </div>
          <div className="text-lg font-bold text-[#F1F5F9] font-mono">
            {volumes.whole_tumor_cm3} <span className="text-xs font-normal text-[#677E8A]">cm³</span>
          </div>
          <div className="text-[10px] text-[#677E8A] font-mono mt-0.5">
            {metrics.voxel_counts.whole_tumor.toLocaleString()} voxels
          </div>
        </div>

        <div className="bg-[#0E1D21] p-3 rounded-lg border border-[#244C56]">
          <div className="flex items-center gap-1.5 text-xs text-[#ABAFB5] mb-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Tumor Core (TC)
          </div>
          <div className="text-lg font-bold text-[#F1F5F9] font-mono">
            {volumes.tumor_core_cm3} <span className="text-xs font-normal text-[#677E8A]">cm³</span>
          </div>
          <div className="text-[10px] text-[#677E8A] font-mono mt-0.5">
            {metrics.voxel_counts.tumor_core.toLocaleString()} voxels
          </div>
        </div>

        <div className="bg-[#0E1D21] p-3 rounded-lg border border-[#244C56]">
          <div className="flex items-center gap-1.5 text-xs text-[#ABAFB5] mb-1">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            Enhancing (ET)
          </div>
          <div className="text-lg font-bold text-[#F1F5F9] font-mono">
            {volumes.enhancing_tumor_cm3} <span className="text-xs font-normal text-[#677E8A]">cm³</span>
          </div>
          <div className="text-[10px] text-[#677E8A] font-mono mt-0.5">
            {metrics.voxel_counts.enhancing_tumor.toLocaleString()} voxels
          </div>
        </div>

        <div className="bg-[#0E1D21] p-3 rounded-lg border border-[#244C56]">
          <div className="flex items-center gap-1.5 text-xs text-[#ABAFB5] mb-1">
            <span className="w-2 h-2 rounded-full bg-[#3B7E8C]" />
            Edema
          </div>
          <div className="text-lg font-bold text-[#F1F5F9] font-mono">
            {volumes.edema_cm3} <span className="text-xs font-normal text-[#677E8A]">cm³</span>
          </div>
          <div className="text-[10px] text-[#677E8A] font-mono mt-0.5">
            {metrics.voxel_counts.edema.toLocaleString()} voxels
          </div>
        </div>
      </div>

      {/* RANO / RECIST 2.0 & Tissue Proportions (Clinician Grade) */}
      {tissue_composition && (
        <div className="bg-[#0E1D21] p-3 rounded-lg border border-[#244C56] flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-semibold text-[#F1F5F9]">
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#3B7E8C]" />
              RANO 2.0 / Tissue Proportions
            </div>
            <span className="font-mono text-[11px] text-[#677E8A]">
              Edema/Core Ratio: {tissue_composition.edema_to_core_ratio}:1
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2 bg-[#122E34] rounded border border-[#244C56]">
              <span className="text-[10px] text-[#677E8A] block">Longest Diameter</span>
              <span className="font-mono font-bold text-[#F1F5F9]">
                {rano_metrics?.longest_diameter_mm || dimensions_mm?.length_x_mm || 0} mm
              </span>
            </div>
            <div className="p-2 bg-[#122E34] rounded border border-[#244C56]">
              <span className="text-[10px] text-[#677E8A] block">Perpendicular Axis</span>
              <span className="font-mono font-bold text-[#F1F5F9]">
                {rano_metrics?.perpendicular_diameter_mm || dimensions_mm?.width_y_mm || 0} mm
              </span>
            </div>
            <div className="p-2 bg-[#122E34] rounded border border-[#244C56]">
              <span className="text-[10px] text-[#677E8A] block">Bidimensional (L×W)</span>
              <span className="font-mono font-bold text-[#F1F5F9]">
                {rano_metrics?.bidimensional_product_mm2 || 0} mm²
              </span>
            </div>
            <div className="p-2 bg-[#122E34] rounded border border-[#244C56]">
              <span className="text-[10px] text-[#677E8A] block">Active Enhancing %</span>
              <span className="font-mono font-bold text-[#F1F5F9]">
                {tissue_composition.enhancing_percent}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Structural Compression & Eloquence Risk */}
      {structural_impact && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="bg-[#0E1D21] p-3 rounded-lg border border-[#244C56]">
            <span className="text-[11px] font-semibold text-[#677E8A] block mb-1">
              Mass Effect & Ventricles:
            </span>
            <span className="text-[#F1F5F9] font-medium leading-snug block">
              {structural_impact.mass_effect}
            </span>
            <span className="text-[11px] text-[#677E8A] block mt-0.5">
              {structural_impact.ventricular_compression}
            </span>
          </div>

          <div className="bg-[#0E1D21] p-3 rounded-lg border border-[#244C56]">
            <span className="text-[11px] font-semibold text-[#677E8A] block mb-1">
              Functional Eloquence Rating:
            </span>
            <span className="text-[#F1F5F9] font-medium leading-snug block">
              {structural_impact.eloquence_rating}
            </span>
            <span className="text-[11px] text-[#677E8A] block mt-0.5">
              Spetzler-Martin / Lacroix surgical risk framework
            </span>
          </div>
        </div>
      )}

      {/* Spatial Localization Table */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Spatial Dimensions */}
        <div className="bg-[#0E1D21] p-3 rounded-lg border border-[#244C56]">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#F1F5F9] mb-1.5">
            <Maximize className="w-3.5 h-3.5 text-[#3B7E8C]" />
            Physical 3D Bounds
          </div>
          {dimensions_mm ? (
            <div className="font-mono text-xs text-[#F1F5F9]">
              {dimensions_mm.length_x_mm} × {dimensions_mm.width_y_mm} × {dimensions_mm.height_z_mm} <span className="text-[10px] text-[#677E8A]">mm</span>
              <div className="text-[10px] text-[#677E8A] font-sans mt-0.5">Along RAS scanner axes</div>
            </div>
          ) : (
            <span className="text-xs text-[#677E8A]">N/A</span>
          )}
        </div>

        {/* Physical Centroid */}
        <div className="bg-[#0E1D21] p-3 rounded-lg border border-[#244C56]">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#F1F5F9] mb-1.5">
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            Tumor Centroid
          </div>
          {centroid_physical_mm ? (
            <div className="font-mono text-xs text-[#F1F5F9]">
              [{centroid_physical_mm.map((v) => v.toFixed(1)).join(', ')}] <span className="text-[10px] text-[#677E8A]">mm</span>
              <div className="text-[10px] text-[#677E8A] font-sans mt-0.5">Scanner origin center of mass</div>
            </div>
          ) : (
            <span className="text-xs text-[#677E8A]">N/A</span>
          )}
        </div>

        {/* Anatomical Region */}
        <div className="bg-[#0E1D21] p-3 rounded-lg border border-[#244C56]">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#F1F5F9] mb-1.5">
            <Box className="w-3.5 h-3.5 text-[#3B7E8C]" />
            Anatomical Localization
          </div>
          <div className="text-xs text-[#ABAFB5] font-medium leading-snug">
            {anatomical_location || 'Not localized'}
          </div>
        </div>
      </div>
    </div>
  );
};
