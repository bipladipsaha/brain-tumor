import numpy as np
from scipy import ndimage
import nibabel as nib
import os
from typing import Tuple

def generate_synthetic_brain_mri(
    shape: Tuple[int, int, int] = (128, 128, 96),
    voxel_spacing: Tuple[float, float, float] = (1.0, 1.0, 1.0),
    tumor_radius: float = 14.0
) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    Generates a realistic synthetic 3D brain phantom with multi-channel BraTS tumor labels:
    - Channel 0: Whole Tumor (WT)
    - Channel 1: Tumor Core (TC)
    - Channel 2: Enhancing Tumor (ET)
    
    Returns:
        (mri_volume, multi_channel_mask, affine_matrix)
    """
    D, H, W = shape
    z, y, x = np.ogrid[:D, :H, :W]
    
    # 1. Realistic Brain Ellipsoid
    center_brain = (D // 2, H // 2, W // 2)
    rx, ry, rz = W * 0.42, H * 0.40, D * 0.38
    dist_brain = ((x - center_brain[2]) / rx) ** 2 + ((y - center_brain[1]) / ry) ** 2 + ((z - center_brain[0]) / rz) ** 2
    brain_parenchyma = dist_brain <= 1.0
    
    # Add gyri/sulci structural textures
    noise = np.random.normal(0.5, 0.08, shape)
    structural_waves = 0.15 * np.sin(x / 4.0) * np.cos(y / 4.0) * np.sin(z / 4.0)
    mri_volume = (0.55 + structural_waves + noise) * brain_parenchyma
    mri_volume = np.clip(mri_volume, 0.0, 1.0)
    
    # 2. Place an Irregular Tumor in Right Frontal/Parietal region
    tumor_center = (
        int(center_brain[0] + D * 0.12),
        int(center_brain[1] + H * 0.10),
        int(center_brain[2] + W * 0.15)
    )
    
    dist_tumor = np.sqrt(
        (x - tumor_center[2]) ** 2 + 
        (y - tumor_center[1]) ** 2 + 
        (z - tumor_center[0]) ** 2
    )
    
    # Tumor Subregions:
    # Outer: Edema / Whole Tumor (radius ~ tumor_radius)
    # Middle: Active Enhancing Rim (radius ~ 0.65 * tumor_radius)
    # Inner: Necrotic Core (radius ~ 0.35 * tumor_radius)
    wt_mask = (dist_tumor <= tumor_radius) & brain_parenchyma
    tc_mask = (dist_tumor <= tumor_radius * 0.65) & brain_parenchyma
    et_mask = (dist_tumor <= tumor_radius * 0.65) & (dist_tumor >= tumor_radius * 0.30) & brain_parenchyma
    
    # Add organic irregularity to tumor borders via deformation
    random_pert = ndimage.gaussian_filter(np.random.normal(0, 1, shape), sigma=2.0)
    wt_mask = (dist_tumor + random_pert * 3.0 <= tumor_radius) & brain_parenchyma
    tc_mask = (dist_tumor + random_pert * 2.0 <= tumor_radius * 0.65) & brain_parenchyma
    et_mask = tc_mask & ((dist_tumor >= tumor_radius * 0.28) | (random_pert > 0.5))
    
    # Modify MRI intensity to simulate hyperintensity (FLAIR edema & T1ce enhancing ring)
    mri_volume[wt_mask] = np.clip(mri_volume[wt_mask] + 0.35, 0.0, 1.0)
    mri_volume[et_mask] = 1.0 # Hyperintense contrast uptake
    
    # Stack into multi-channel BraTS format (3, D, H, W)
    multi_channel_mask = np.stack([wt_mask, tc_mask, et_mask], axis=0).astype(np.float32)
    
    # 4x4 Affine Matrix
    affine = np.diag([voxel_spacing[0], voxel_spacing[1], voxel_spacing[2], 1.0])
    affine[:3, 3] = [-shape[0] / 2.0, -shape[1] / 2.0, -shape[2] / 2.0]
    
    return mri_volume, multi_channel_mask, affine


def save_synthetic_sample_nifti(output_dir: str):
    """Saves a synthetic NIfTI volume and mask for testing."""
    os.makedirs(output_dir, exist_ok=True)
    mri_vol, mask, affine = generate_synthetic_brain_mri()
    
    # Save MRI as NIfTI
    mri_nii = nib.Nifti1Image(mri_vol, affine)
    mri_path = os.path.join(output_dir, "sample_brain_flair.nii.gz")
    nib.save(mri_nii, mri_path)
    
    # Save composite BraTS discrete mask (1=TC, 2=Edema, 4=ET)
    discrete_mask = np.zeros_like(mri_vol, dtype=np.uint8)
    wt, tc, et = mask[0] > 0.5, mask[1] > 0.5, mask[2] > 0.5
    discrete_mask[wt] = 2       # Edema default
    discrete_mask[tc] = 1       # Non-enhancing / Necrotic
    discrete_mask[et] = 4       # Enhancing
    
    seg_nii = nib.Nifti1Image(discrete_mask, affine)
    seg_path = os.path.join(output_dir, "sample_brain_seg.nii.gz")
    nib.save(seg_nii, seg_path)
    
    return mri_path, seg_path

