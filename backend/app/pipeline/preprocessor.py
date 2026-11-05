import numpy as np
import nibabel as nib
import cv2
from PIL import Image
from scipy import ndimage
from typing import Tuple, Dict, Any, Optional

def load_and_preprocess_mri(
    file_path: str,
    target_spacing: Tuple[float, float, float] = (1.0, 1.0, 1.0)
) -> Dict[str, Any]:
    """
    Robust medical preprocessor supporting:
    1. 3D Volumetric NIfTI (.nii, .nii.gz)
    2. 2D Photographic Brain MRI Images (.jpg, .png, .jpeg)
    
    For 2D images, it applies skull-stripping and reconstructs an anatomically
    closed 3D cranial vault so Marching Cubes produces a complete, smooth 3D brain.
    """
    lower = file_path.lower()
    
    if lower.endswith(".nii") or lower.endswith(".nii.gz"):
        nii = nib.load(file_path)
        nii = nib.as_closest_canonical(nii)
        data = nii.get_fdata().astype(np.float32)
        affine = nii.affine
        zooms = nii.header.get_zooms()
        voxel_spacing = (float(zooms[0]), float(zooms[1]), float(zooms[2]))
        
        # Normalize
        mask = data > (0.05 * data.max())
        mean = float(data[mask].mean()) if np.any(mask) else 0.0
        std = float(data[mask].std()) if np.any(mask) else 1.0
        normalized_data = (data - mean) / (std + 1e-8)
        
        d_min, d_max = data.min(), data.max()
        display_data = (data - d_min) / (d_max - d_min + 1e-8)
        
        return {
            "raw_volume": data,
            "normalized_volume": normalized_data,
            "display_volume": display_data,
            "affine": affine,
            "voxel_spacing": voxel_spacing,
            "shape": list(data.shape),
            "is_2d": False
        }
        
    else:
        # 2D Photographic Image (.jpg, .png, .jpeg)
        img_bgr = cv2.imread(file_path)
        if img_bgr is None:
            raise ValueError(f"Could not read image file {file_path}")
            
        # Standardize dimension to 256x256
        img_resized = cv2.resize(img_bgr, (256, 256), interpolation=cv2.INTER_AREA)
        gray = cv2.cvtColor(img_resized, cv2.COLOR_BGR2GRAY)
        
        # 1. Skull-Stripping / Brain Contour Extraction
        # Filter background air & borders
        _, thresh = cv2.threshold(gray, 18, 255, cv2.THRESH_BINARY)
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        brain_mask_2d = np.zeros_like(gray, dtype=np.uint8)
        if contours:
            c_largest = max(contours, key=cv2.contourArea)
            cv2.drawContours(brain_mask_2d, [c_largest], -1, 255, -1)
            # Morphological fill & smooth
            brain_mask_2d = cv2.morphologyEx(brain_mask_2d, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))
        else:
            brain_mask_2d = (gray > 20).astype(np.uint8) * 255
            
        # Mask out black background borders
        gray_brain = cv2.bitwise_and(gray, gray, mask=brain_mask_2d)
        
        # 2. Adaptive Contrast Enhancement (CLAHE) for clear tissue differentiation
        clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
        enhanced_2d = clahe.apply(gray_brain).astype(np.float32) / 255.0
        
        # 3. Reconstruct Closed 3D Cranial Vault (D=72 slices)
        # Using ellipsoid curvature profile: r(t) = sqrt(max(0, 1 - t^2))
        # This guarantees the 3D brain is a completely CLOSED, smooth anatomical skull
        D = 72
        H, W = 256, 256
        volume_3d = np.zeros((H, W, D), dtype=np.float32)
        
        mid_z = D / 2.0
        rad_z = D * 0.44
        
        for z in range(D):
            dist_z = (z - mid_z) / rad_z
            if abs(dist_z) < 1.0:
                scale_r = np.sqrt(1.0 - dist_z ** 2)
                # Keep center slice as exact uploaded slice, smoothly tapering to poles
                scale = float(np.clip(scale_r, 0.15, 1.0))
                
                # Rescale slice towards center
                scaled_slice = cv2.resize(enhanced_2d, (0, 0), fx=scale, fy=scale, interpolation=cv2.INTER_LINEAR)
                sh, sw = scaled_slice.shape
                
                # Paste centered into volume slice
                y1 = max(0, (H - sh) // 2)
                x1 = max(0, (W - sw) // 2)
                slice_canvas = np.zeros((H, W), dtype=np.float32)
                slice_canvas[y1:y1 + sh, x1:x1 + sw] = scaled_slice
                
                # Multiply by smooth Z-profile so surfaces taper organically
                volume_3d[:, :, z] = slice_canvas * float(np.sin(np.pi * (z / float(D))))
                
        voxel_spacing = (1.0, 1.0, 1.0)
        affine = np.diag([1.0, 1.0, 1.0, 1.0])
        affine[:3, 3] = [-H / 2.0, -W / 2.0, -D / 2.0]
        
        return {
            "raw_volume": volume_3d,
            "normalized_volume": volume_3d,
            "display_volume": volume_3d,
            "enhanced_2d": enhanced_2d,
            "brain_mask_2d": (brain_mask_2d > 0),
            "affine": affine,
            "voxel_spacing": voxel_spacing,
            "shape": [H, W, D],
            "is_2d": True
        }
