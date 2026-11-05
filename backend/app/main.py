import os
import uuid
import numpy as np
import io
import cv2
from PIL import Image
from scipy import ndimage
from fastapi import FastAPI, UploadFile, File, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any, Optional

from app.pipeline.marching_cubes import extract_brain_and_tumor_surfaces
from app.pipeline.metrics import compute_tumor_metrics
from app.pipeline.explainer import generate_ai_explanation
from app.pipeline.preprocessor import load_and_preprocess_mri
from app.pipeline.inference import BrainTumorInferenceEngine
from app.pipeline.pdf_report import generate_pdf_report
from app.utils.sample_generator import generate_synthetic_brain_mri

app = FastAPI(
    title="NeuroVision 3D API",
    description="AI-Powered Brain Tumour Detection, Segmentation and 3D Visualization System",
    version="1.0.0"
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJECT_DIR = os.path.dirname(BASE_DIR)
WEIGHTS_DIR = os.path.join(PROJECT_DIR, "model_weights")
WEIGHTS_PATH_3D = os.path.join(WEIGHTS_DIR, "neurovision_3d_best_model.pth")
WEIGHTS_PATH_2D = os.path.join(WEIGHTS_DIR, "neurovision_2d_unet.pth")
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(WEIGHTS_DIR, exist_ok=True)

# Initialize Dual-Engine Inference Engine (3D SegResNet + 2D U-Net)
engine = BrainTumorInferenceEngine(
    model_weights_path_3d=WEIGHTS_PATH_3D,
    model_weights_path_2d=WEIGHTS_PATH_2D
)

SESSIONS: Dict[str, Dict[str, Any]] = {}

@app.get("/")
def root():
    return {
        "system": "NeuroVision 3D API",
        "status": "Online",
        "model_3d_loaded": engine.weights_loaded_3d,
        "model_2d_loaded": engine.weights_loaded_2d
    }

@app.get("/api/model/status")
def model_status():
    if os.path.exists(WEIGHTS_PATH_3D) and not engine.weights_loaded_3d:
        engine.load_weights_3d(WEIGHTS_PATH_3D)
    if os.path.exists(WEIGHTS_PATH_2D) and not engine.weights_loaded_2d:
        engine.load_weights_2d(WEIGHTS_PATH_2D)
        
    return {
        "engine_3d": {
            "architecture": "3D SegResNet",
            "weights_loaded": engine.weights_loaded_3d,
            "weights_path": WEIGHTS_PATH_3D
        },
        "engine_2d": {
            "architecture": "2D U-Net (JPG/PNG)",
            "weights_loaded": engine.weights_loaded_2d,
            "weights_path": WEIGHTS_PATH_2D
        },
        "device": str(engine.device)
    }

@app.post("/api/analysis/demo")
def run_demo_analysis():
    session_id = str(uuid.uuid4())
    mri_vol, pred_mask, affine = generate_synthetic_brain_mri()
    spacing = (1.0, 1.0, 1.0)
    
    metrics = compute_tumor_metrics(pred_mask, voxel_spacing=spacing, affine=affine)
    explanation = generate_ai_explanation(metrics)
    meshes = extract_brain_and_tumor_surfaces(mri_vol, pred_mask, spacing=spacing, center_mesh=True)
    
    SESSIONS[session_id] = {
        "mri_volume": mri_vol,
        "pred_mask": pred_mask,
        "metrics": metrics,
        "explanation": explanation,
        "meshes": meshes,
        "affine": affine,
        "spacing": spacing,
        "filename": "Sample_Patient_Scan.nii"
    }
    
    return {
        "session_id": session_id,
        "status": "Success",
        "filename": "Sample_Patient_Scan.nii",
        "metrics": metrics,
        "explanation": explanation,
        "mesh_summary": {
            "brain_vertices": meshes["brain_shell"]["vertex_count"],
            "tumor_vertices": meshes["whole_tumor"]["vertex_count"],
        }
    }

@app.post("/api/mri/upload")
async def upload_and_analyze(file: UploadFile = File(...)):
    """
    Accepts MRI upload:
    - 2D Photographs (.jpg, .jpeg, .png): Processed with 2D U-Net with skull-stripping.
    - 3D Scans (.nii, .nii.gz): Processed with 3D SegResNet.
    """
    fname = file.filename.lower()
    valid_exts = [".nii", ".nii.gz", ".jpg", ".jpeg", ".png", ".webp"]
    if not any(fname.endswith(ext) for ext in valid_exts):
        raise HTTPException(status_code=400, detail="Please upload an MRI file (.nii, .nii.gz) or image (.jpg, .png).")
        
    session_id = str(uuid.uuid4())
    saved_path = os.path.join(UPLOADS_DIR, f"{session_id}_{file.filename}")
    
    with open(saved_path, "wb") as f:
        content = await file.read()
        f.write(content)
        
    try:
        prep = load_and_preprocess_mri(saved_path)
        mri_vol = prep["display_volume"]
        spacing = prep["voxel_spacing"]
        affine = prep["affine"]
        
        if prep.get("is_2d", False):
            # 1. 2D Image Pipeline: Run 2D U-Net directly on patient picture
            img_bgr = cv2.imread(saved_path)
            img_resized = cv2.resize(img_bgr, (256, 256), interpolation=cv2.INTER_AREA)
            pred_2d = engine.predict_2d_image(img_resized)
            
            # Constrain prediction strictly to the brain parenchyma (remove skull bone / background)
            pred_2d_masked = (pred_2d > 0.5) & prep["brain_mask_2d"]
            
            H, W, D = mri_vol.shape
            vol_tumor_wt = np.zeros((H, W, D), dtype=np.float32)
            vol_tumor_tc = np.zeros((H, W, D), dtype=np.float32)
            vol_tumor_et = np.zeros((H, W, D), dtype=np.float32)
            
            if np.any(pred_2d_masked):
                mid_z = D // 2
                span_z = 8
                for z in range(D):
                    dz = abs(z - mid_z)
                    if dz <= span_z:
                        r = np.sqrt(max(0.0, 1.0 - (dz / (span_z + 1.0)) ** 2))
                        if dz == 0:
                            current_mask = pred_2d_masked
                        else:
                            erode_iters = int((1.0 - r) * 3)
                            if erode_iters > 0:
                                current_mask = ndimage.binary_erosion(pred_2d_masked, iterations=erode_iters)
                            else:
                                current_mask = pred_2d_masked
                        vol_tumor_wt[:, :, z] = current_mask.astype(np.float32)
                        tc_eroded = ndimage.binary_erosion(current_mask, iterations=1) if np.sum(current_mask) > 50 else current_mask
                        vol_tumor_tc[:, :, z] = tc_eroded.astype(np.float32)
                        vol_tumor_et[:, :, z] = tc_eroded.astype(np.float32)
                            
            pred_mask = np.stack([vol_tumor_wt, vol_tumor_tc, vol_tumor_et], axis=0)
            
        else:
            # 2. 3D NIfTI Pipeline: Run 3D SegResNet
            pred_mask = engine.predict(prep["normalized_volume"])
            
        metrics = compute_tumor_metrics(pred_mask, voxel_spacing=spacing, affine=affine)
        explanation = generate_ai_explanation(metrics)
        meshes = extract_brain_and_tumor_surfaces(mri_vol, pred_mask, spacing=spacing, center_mesh=True)
        
        SESSIONS[session_id] = {
            "mri_volume": mri_vol,
            "pred_mask": pred_mask,
            "metrics": metrics,
            "explanation": explanation,
            "meshes": meshes,
            "affine": affine,
            "spacing": spacing,
            "filename": file.filename
        }
        
        return {
            "session_id": session_id,
            "status": "Success",
            "filename": file.filename,
            "metrics": metrics,
            "explanation": explanation,
            "mesh_summary": {
                "brain_vertices": meshes["brain_shell"]["vertex_count"],
                "tumor_vertices": meshes["whole_tumor"]["vertex_count"],
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.get("/api/analysis/{session_id}/3d-mesh")
def get_3d_mesh(session_id: str):
    if session_id not in SESSIONS:
        raise HTTPException(status_code=404, detail="Session not found.")
    return SESSIONS[session_id]["meshes"]

@app.get("/api/analysis/{session_id}/metrics")
def get_metrics(session_id: str):
    if session_id not in SESSIONS:
        raise HTTPException(status_code=404, detail="Session not found.")
    return SESSIONS[session_id]["metrics"]

@app.get("/api/analysis/{session_id}/explanation")
def get_explanation(session_id: str):
    if session_id not in SESSIONS:
        raise HTTPException(status_code=404, detail="Session not found.")
    return SESSIONS[session_id]["explanation"]

@app.get("/api/analysis/{session_id}/slices")
def get_2d_slice_data(session_id: str, view: str = "axial", slice_index: Optional[int] = None):
    if session_id not in SESSIONS:
        raise HTTPException(status_code=404, detail="Session not found.")
        
    mri = SESSIONS[session_id]["mri_volume"]
    mask = SESSIONS[session_id]["pred_mask"]
    
    # shape: (H, W, D)
    if view == "axial":
        max_slices = mri.shape[2]
        idx = max_slices // 2 if slice_index is None else min(max(0, slice_index), max_slices - 1)
        mri_slice = mri[:, :, idx]
        mask_slice = mask[0, :, :, idx] if mask.ndim == 4 else mask[:, :, idx]
    elif view == "coronal":
        max_slices = mri.shape[0]
        idx = max_slices // 2 if slice_index is None else min(max(0, slice_index), max_slices - 1)
        mri_slice = mri[idx, :, :]
        mask_slice = mask[0, idx, :, :] if mask.ndim == 4 else mask[idx, :, :]
    elif view == "sagittal":
        max_slices = mri.shape[1]
        idx = max_slices // 2 if slice_index is None else min(max(0, slice_index), max_slices - 1)
        mri_slice = mri[:, idx, :]
        mask_slice = mask[0, :, idx, :] if mask.ndim == 4 else mask[:, idx, :]
    else:
        raise HTTPException(status_code=400, detail="View must be axial, coronal, or sagittal.")
        
    return {
        "view": view,
        "slice_index": idx,
        "max_slices": max_slices,
        "mri_matrix": (mri_slice * 255).astype(int).tolist(),
        "mask_matrix": (mask_slice > 0.5).astype(int).tolist()
    }

@app.get("/api/analysis/{session_id}/report")
def download_report(session_id: str):
    if session_id not in SESSIONS:
        raise HTTPException(status_code=404, detail="Session not found.")
        
    sess = SESSIONS[session_id]
    pdf_bytes = generate_pdf_report(
        analysis_id=session_id[:8].upper(),
        metrics=sess["metrics"],
        explanation=sess["explanation"]
    )
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=NeuroVision3D_Report_{session_id[:8]}.pdf"}
    )
