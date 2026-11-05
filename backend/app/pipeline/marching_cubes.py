import numpy as np
from scipy import ndimage
from skimage import measure
import trimesh
from typing import Dict, Any, Tuple, Optional

def extract_mesh_marching_cubes(
    binary_mask: np.ndarray,
    spacing: Tuple[float, float, float] = (1.0, 1.0, 1.0),
    level: float = 0.5,
    step_size: int = 2,
    smooth_iterations: int = 2,
    target_faces: Optional[int] = 12000,
) -> Dict[str, Any]:
    """
    Fast, optimized Marching Cubes extraction for WebGL 60 FPS.
    """
    if not np.any(binary_mask):
        return {
            "vertices": [],
            "faces": [],
            "normals": [],
            "vertex_count": 0,
            "face_count": 0,
            "empty": True
        }
        
    try:
        # Smooth mask slightly
        smoothed = ndimage.gaussian_filter(binary_mask.astype(np.float32), sigma=0.6)
        verts, faces, normals, _ = measure.marching_cubes(
            smoothed,
            level=level,
            spacing=spacing,
            step_size=step_size,
            allow_degenerate=False
        )
    except Exception as e:
        return {
            "vertices": [],
            "faces": [],
            "normals": [],
            "vertex_count": 0,
            "face_count": 0,
            "error": str(e),
            "empty": True
        }

    mesh = trimesh.Trimesh(vertices=verts, faces=faces, vertex_normals=normals, process=False)
    
    if smooth_iterations > 0 and len(mesh.faces) > 0:
        try:
            trimesh.smoothing.filter_laplacian(mesh, iterations=smooth_iterations)
        except Exception:
            pass
        
    if target_faces and len(mesh.faces) > target_faces:
        try:
            mesh = mesh.simplify_quadric_decimation(face_count=target_faces)
        except Exception:
            pass
            
    mesh.fix_normals()
    
    return {
        "vertices": mesh.vertices.tolist(),
        "faces": mesh.faces.tolist(),
        "normals": mesh.vertex_normals.tolist(),
        "vertex_count": len(mesh.vertices),
        "face_count": len(mesh.faces),
        "empty": False
    }


def extract_brain_and_tumor_surfaces(
    mri_volume: np.ndarray,
    pred_mask: np.ndarray,
    spacing: Tuple[float, float, float] = (1.0, 1.0, 1.0),
    center_mesh: bool = True
) -> Dict[str, Any]:
    results = {}
    
    # 1. Brain Envelope Extraction
    mri_norm = (mri_volume - np.min(mri_volume)) / (np.max(mri_volume) - np.min(mri_volume) + 1e-8)
    brain_mask = mri_norm > 0.10
    brain_mask = ndimage.binary_closing(brain_mask, iterations=2)
    brain_mask = ndimage.binary_fill_holes(brain_mask)
    
    brain_mesh = extract_mesh_marching_cubes(
        brain_mask,
        spacing=spacing,
        step_size=2,
        smooth_iterations=2,
        target_faces=16000
    )
    results["brain_shell"] = brain_mesh
    
    # 2. Extract Tumor Subregions
    if pred_mask.ndim == 4:
        wt_mask = pred_mask[0] > 0.3
        tc_mask = pred_mask[1] > 0.3
        et_mask = pred_mask[2] > 0.3
    else:
        wt_mask = np.isin(pred_mask, [1, 2, 4])
        tc_mask = np.isin(pred_mask, [1, 4])
        et_mask = (pred_mask == 4)
        
    results["whole_tumor"] = extract_mesh_marching_cubes(
        wt_mask, spacing=spacing, step_size=2, smooth_iterations=2, target_faces=8000
    )
    results["tumor_core"] = extract_mesh_marching_cubes(
        tc_mask, spacing=spacing, step_size=2, smooth_iterations=2, target_faces=6000
    )
    results["enhancing_tumor"] = extract_mesh_marching_cubes(
        et_mask, spacing=spacing, step_size=2, smooth_iterations=2, target_faces=5000
    )
    
    # Center all meshes relative to brain center of mass
    if center_mesh and not brain_mesh.get("empty", True):
        b_verts = np.array(brain_mesh["vertices"])
        center_offset = (b_verts.max(axis=0) + b_verts.min(axis=0)) / 2.0
        
        for key in ["brain_shell", "whole_tumor", "tumor_core", "enhancing_tumor"]:
            if not results[key].get("empty", True):
                v = np.array(results[key]["vertices"]) - center_offset
                results[key]["vertices"] = v.tolist()
                
        results["center_offset"] = center_offset.tolist()
        
    return results
