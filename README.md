# 🧠 NeuroVision 3D: AI-Powered Brain Tumour Detection & 3D Interactive Visualization

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.0+-EE4C2C.svg?logo=pytorch&logoColor=white)](https://pytorch.org)
[![MONAI](https://img.shields.io/badge/MONAI-1.3+-2088FF.svg)](https://monai.io)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL-black.svg?logo=three.js)](https://threejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4+-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)

**NeuroVision 3D** is an end-to-end medical deep learning platform that bridges the gap between advanced volumetric neuro-oncology segmentation and patient-accessible communication. 

By unifying **3D Deep Learning (SegResNet on BraTS 2020)** and **2D Photographic DL (U-Net on LGG MRI)** with real-time **Marching Cubes isosurface extraction** and an interactive **WebGL Three.js canvas**, NeuroVision 3D transforms complex 2D scan slices into intuitive, tangible 3D anatomical models.

---

## 🌟 Key Features

### 1. Dual-Engine Neural Architecture
- **3D Volumetric Engine (NIfTI `.nii`, `.nii.gz`):** Powered by **3D SegResNet** trained on the BraTS 2020 benchmark. Performs multi-channel subregion segmentation across Whole Tumor (WT), Tumor Core (TC), and Enhancing Tumor (ET) using mixed precision and sliding-window inference.
- **2D Photographic Engine (`.jpg`, `.png`, `.jpeg`):** Powered by an accelerated **2D U-Net** trained on the LGG MRI dataset. Reconstructs a closed 3D cranial vault using ellipsoidal radius profiling ($r(t) = \sqrt{\max(0, 1 - t^2)}$) and automated Otsu parenchyma skull stripping.

### 2. Real-Time 3D WebGL Visualization
- Sub-second **Lorensen & Cline Marching Cubes** mesh generation optimized with Laplacian smoothing and quadric decimation.
- 60 FPS Three.js viewer with interactive orbit controls, semi-transparent glass brain envelope, and glowing subregion shaders.
- Independent visibility and opacity controls for Brain Shell, Whole Tumor, Tumor Core, and Enhancing Tumor.

### 3. Quantitative Physical Morphometrics
- Computes true physical measurements:
  - **Volume in $cm^3$:** $V = \frac{N \times dx \times dy \times dz}{1000}$
  - **3D Bounding Box Dimensions:** Length $\times$ Width $\times$ Height ($mm$) along patient RAS scanner axes.
  - **Tumor Centroid Coordinates & Anatomical Localization:** Identifies hemisphere (Right/Left), cranial lobe (Frontal, Parietal, Temporal, Occipital), and axial depth (Superior/Inferior).

### 4. Dual-Persona Clinical & Patient Interface
- **Patient-Friendly View:** Empathetic, jargon-free explanations with real-world analogies (e.g., *"size of a small walnut"*, *"located near the area helping with vision"*), interactive 3D rotation, and plain-language summary cards.
- **Clinician / Research View:** Multi-Planar Reconstruction (MPR) 2D slice scrubber (Axial, Coronal, Sagittal) with synced red mask overlay, quantitative tensor metrics table, and technical clinical impression.

### 5. Automated Clinical PDF Synthesis
- One-click neuroimaging report generation via **ReportLab**, complete with patient ID, quantitative subregion breakdown, 3D spatial bounds, clinician interpretation, and medical decision-support disclaimers.

---

## 📁 Repository Structure

```
├── backend/
│   ├── app/
│   │   ├── pipeline/
│   │   │   ├── explainer.py         # Patient analogies & clinical report generator
│   │   │   ├── inference.py         # Dual-Engine PyTorch/MONAI inference manager
│   │   │   ├── marching_cubes.py    # Fast 3D isosurface extraction & smoothing
│   │   │   ├── metrics.py           # Physical volume (cm³), bounding box, centroid
│   │   │   ├── pdf_report.py        # ReportLab neuroimaging PDF synthesis
│   │   │   └── preprocessor.py      # NIfTI normalization & 2D skull-stripping / 3D vault
│   │   ├── utils/
│   │   │   └── sample_generator.py  # Synthetic brain MRI generator for instant demo
│   │   └── main.py                  # FastAPI REST endpoints
│   ├── requirements.txt             # Python dependencies
│   └── run_server.py                # Uvicorn launcher (port 8001, auto-reload)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── BrainViewer3D.tsx    # Three.js WebGL canvas & shaders
│   │   │   ├── SliceViewer2D.tsx    # MPR Axial / Coronal / Sagittal slice scrubber
│   │   │   ├── PatientFriendlyView.tsx # Patient persona interface
│   │   │   ├── MetricsPanel.tsx     # Quantitative measurements panel
│   │   │   ├── ExplanationPanel.tsx # Clinical impression & limitations
│   │   │   └── Header.tsx           # Dual-persona mode switcher
│   │   ├── App.tsx                  # Main application state orchestrator
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts               # Vite proxy to backend port 8001
├── model_weights/
│   ├── neurovision_3d_best_model.pth # 3D SegResNet trained on BraTS 2020 (18.8 MB)
│   └── neurovision_2d_unet.pth       # 2D U-Net trained on LGG MRI (6.5 MB)
├── neurovision_brats_training.ipynb  # Kaggle notebook for 3D SegResNet
├── neurovision_2d_jpg_training.ipynb # Kaggle notebook for 2D U-Net
├── ARCHITECTURE_DIAGRAMS_SPECIFICATION.md # Full architecture diagrams & tensor specs
├── PRESENTATION_MASTER_SLIDES.md     # 16-slide presentation deck & viva speaker scripts
├── SYLLABUS_MAPPING_AND_DEFENSE.md   # Academic viva defense & syllabus alignment
├── run_app.bat                       # One-click Windows launcher
└── run_app.py                        # Cross-platform Python launcher
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python 3.10+** (PyTorch, MONAI, FastAPI, Uvicorn, Trimesh, OpenCV, ReportLab)
- **Node.js 18+** (React 18, Vite, Three.js, Tailwind CSS)
- **Git**

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/bipladipsaha/brain-tumor.git
   cd brain-tumor
   ```

2. **Set up the Backend:**
   ```bash
   cd backend
   pip install -r requirements.txt
   cd ..
   ```

3. **Set up the Frontend:**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

---

### Running the System

#### Option A: One-Click Windows Launcher (Recommended)
Double-click [`run_app.bat`](run_app.bat) or run in terminal:
```cmd
run_app.bat
```
This automatically starts:
- **Backend API:** `http://127.0.0.1:8001`
- **Frontend UI:** `http://localhost:3000`

#### Option B: Manual Startup

**Terminal 1 (Backend):**
```bash
cd backend
python run_server.py
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

Open your browser at **`http://localhost:3000`**.

---

## 🧪 Model Training & Datasets

- **3D SegResNet (BraTS 2020):**
  - Dataset: Multimodal Brain Tumor Segmentation Benchmark (T1, T1ce, T2, FLAIR).
  - Architecture: Encoder-Decoder with residual bottleneck and variational regularizer.
  - Training Notebook: [`neurovision_brats_training.ipynb`](neurovision_brats_training.ipynb)
- **2D U-Net (LGG MRI Dataset):**
  - Dataset: Lower Grade Glioma MRI Dataset with binary segmentation masks.
  - Architecture: 5-level U-Net with skip connections, batch size 64, AMP FP16.
  - Training Notebook: [`neurovision_2d_jpg_training.ipynb`](neurovision_2d_jpg_training.ipynb)

---

## ⚖️ Medical Disclaimer
NeuroVision 3D is designed for research, educational, and clinical decision-support purposes. It is not an autonomous diagnostic instrument. All segmentations and quantitative volumetrics should be reviewed by a board-certified radiologist or neurosurgeon in conjunction with clinical histopathology.

---

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

