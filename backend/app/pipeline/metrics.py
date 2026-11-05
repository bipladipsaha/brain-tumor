import numpy as np
from typing import Dict, Any, Tuple, Optional

def compute_tumor_metrics(
    pred_mask: np.ndarray,
    voxel_spacing: Tuple[float, float, float] = (1.0, 1.0, 1.0),
    affine: Optional[np.ndarray] = None
) -> Dict[str, Any]:
    """
    Computes rigorous physical metrics and spatial localization from 3D tumor segmentation.
    
    Args:
        pred_mask: 3D or 4D array of tumor predictions:
                   - If 4D with shape (3, D, H, W): [0]=WT, [1]=TC, [2]=ET
                   - If 3D with BraTS classes: 1=TC/NCR, 2=Edema, 4=ET
        voxel_spacing: (dx, dy, dz) in millimeters
        affine: 4x4 NIfTI affine matrix for mapping to scanner/anatomical space
        
    Returns:
        Structured dictionary of quantitative measurements.
    """
    dx, dy, dz = voxel_spacing
    voxel_volume_mm3 = dx * dy * dz
    voxel_volume_cm3 = voxel_volume_mm3 / 1000.0  # 1 cm³ = 1000 mm³
    
    # Extract binary masks
    if pred_mask.ndim == 4:
        wt_mask = (pred_mask[0] > 0.5)
        tc_mask = (pred_mask[1] > 0.5)
        et_mask = (pred_mask[2] > 0.5)
    else:
        wt_mask = np.isin(pred_mask, [1, 2, 4])
        tc_mask = np.isin(pred_mask, [1, 4])
        et_mask = (pred_mask == 4)
        
    wt_voxels = int(np.sum(wt_mask))
    tc_voxels = int(np.sum(tc_mask))
    et_voxels = int(np.sum(et_mask))
    edema_voxels = max(0, wt_voxels - tc_voxels)
    
    # Calculate physical volumes in cm³
    wt_vol_cm3 = round(wt_voxels * voxel_volume_cm3, 3)
    tc_vol_cm3 = round(tc_voxels * voxel_volume_cm3, 3)
    et_vol_cm3 = round(et_voxels * voxel_volume_cm3, 3)
    edema_vol_cm3 = round(edema_voxels * voxel_volume_cm3, 3)
    
    # If no tumor detected
    if wt_voxels == 0:
        return {
            "tumor_detected": False,
            "volumes": {
                "whole_tumor_cm3": 0.0,
                "tumor_core_cm3": 0.0,
                "enhancing_tumor_cm3": 0.0,
                "edema_cm3": 0.0,
            },
            "voxel_counts": {
                "whole_tumor": 0,
                "tumor_core": 0,
                "enhancing_tumor": 0,
                "edema": 0,
            },
            "bounding_box": None,
            "centroid": None,
            "dimensions_mm": None,
            "anatomical_location": "No suspicious region identified"
        }
        
    # Spatial Bounding Box & Dimensions (Whole Tumor)
    coords = np.argwhere(wt_mask)
    min_coords = coords.min(axis=0)
    max_coords = coords.max(axis=0)
    
    # Voxel bounding box: [x_min, y_min, z_min] to [x_max, y_max, z_max]
    bbox_voxels = {
        "min": [int(x) for x in min_coords],
        "max": [int(x) for x in max_coords],
    }
    
    # Physical dimensions in mm (span along each axis)
    span_voxels = max_coords - min_coords + 1
    dim_x_mm = round(float(span_voxels[0] * dx), 1)
    dim_y_mm = round(float(span_voxels[1] * dy), 1)
    dim_z_mm = round(float(span_voxels[2] * dz), 1)
    
    # Voxel Centroid (center of mass)
    centroid_vox = coords.mean(axis=0)
    centroid_voxel_coords = [round(float(c), 1) for c in centroid_vox]
    
    # Map Centroid to Physical Coordinates using Affine if available
    if affine is not None:
        c_homog = np.array([centroid_vox[0], centroid_vox[1], centroid_vox[2], 1.0])
        physical_centroid = np.dot(affine, c_homog)[:3]
        centroid_physical = [round(float(c), 1) for c in physical_centroid]
    else:
        centroid_physical = [
            round(float(centroid_vox[0] * dx), 1),
            round(float(centroid_vox[1] * dy), 1),
            round(float(centroid_vox[2] * dz), 1)
        ]
        
    # Determine Anatomical Orientation & Hemisphere
    # BraTS scans are resampled to standard RAS (Right, Anterior, Superior)
    # Center of typical standard volume is ~ (120, 120, 78)
    vol_shape = wt_mask.shape
    mid_x = vol_shape[0] / 2.0
    mid_y = vol_shape[1] / 2.0
    mid_z = vol_shape[2] / 2.0
    
    hemisphere = "Right" if centroid_vox[0] > mid_x else "Left"
    ant_post = "Anterior (Frontal)" if centroid_vox[1] > mid_y else "Posterior (Occipital/Parietal)"
    sup_inf = "Superior (Upper)" if centroid_vox[2] > mid_z else "Inferior (Lower/Basal)"
    
    anatomical_desc = f"{hemisphere} Hemisphere, {ant_post}, {sup_inf} region"
    
    # Advanced Tissue Biomarkers & Percentages
    safe_wt = max(wt_vol_cm3, 1e-4)
    et_pct = round(min(100.0, (et_vol_cm3 / safe_wt) * 100.0), 1)
    tc_pct = round(min(100.0, (tc_vol_cm3 / safe_wt) * 100.0), 1)
    edema_pct = round(max(0.0, 100.0 - tc_pct), 1)
    edema_ratio = round(edema_vol_cm3 / max(tc_vol_cm3, 0.05), 2)
    
    # RANO / RECIST 2.0 Sizing Metrics
    dims_sorted = sorted([dim_x_mm, dim_y_mm, dim_z_mm], reverse=True)
    d_max = dims_sorted[0]
    d_perp = dims_sorted[1]
    bidimensional_product = round(d_max * d_perp, 1)
    
    # Mass Effect & Structural Compression Assessment
    if wt_vol_cm3 < 3.0:
        mass_effect = "Minimal / No mass effect"
        ventricle_risk = "Normal ventricular configuration"
    elif wt_vol_cm3 < 15.0:
        mass_effect = "Mild local sulcal effacement"
        ventricle_risk = "No significant ventricular compression"
    elif wt_vol_cm3 < 40.0:
        mass_effect = "Moderate regional mass effect"
        ventricle_risk = "Possible ipsilateral lateral ventricle compression"
    else:
        mass_effect = "Significant mass effect with local tissue distortion"
        ventricle_risk = "High risk of lateral ventricular effacement and subfalcine displacement"

    # Functional Eloquence Assessment (Spetzler-Martin classification context)
    is_eloquent = ("frontal" in anatomical_desc.lower() and "superior" in anatomical_desc.lower()) or \
                  ("parietal" in anatomical_desc.lower()) or \
                  ("left" in anatomical_desc.lower() and "anterior" in anatomical_desc.lower())
    eloquence_rating = "Eloquent Cortex Territory (High Functional Importance)" if is_eloquent else "Near-Eloquent / Associative Cortex"

    return {
        "tumor_detected": True,
        "volumes": {
            "whole_tumor_cm3": wt_vol_cm3,
            "tumor_core_cm3": tc_vol_cm3,
            "enhancing_tumor_cm3": et_vol_cm3,
            "edema_cm3": edema_vol_cm3,
        },
        "tissue_composition": {
            "enhancing_percent": et_pct,
            "core_percent": tc_pct,
            "edema_percent": edema_pct,
            "edema_to_core_ratio": edema_ratio
        },
        "rano_metrics": {
            "longest_diameter_mm": d_max,
            "perpendicular_diameter_mm": d_perp,
            "bidimensional_product_mm2": bidimensional_product,
            "morphology": "Circumscribed nodular" if edema_ratio < 1.0 else "Infiltrative with peritumoral halo"
        },
        "structural_impact": {
            "mass_effect": mass_effect,
            "ventricular_compression": ventricle_risk,
            "eloquence_rating": eloquence_rating
        },
        "voxel_counts": {
            "whole_tumor": wt_voxels,
            "tumor_core": tc_voxels,
            "enhancing_tumor": et_voxels,
            "edema": edema_voxels,
        },
        "bounding_box_voxels": bbox_voxels,
        "dimensions_mm": {
            "length_x_mm": dim_x_mm,
            "width_y_mm": dim_y_mm,
            "height_z_mm": dim_z_mm,
        },
        "centroid_voxels": centroid_voxel_coords,
        "centroid_physical_mm": centroid_physical,
        "anatomical_location": anatomical_desc,
        "voxel_spacing_mm": [dx, dy, dz]
    }

