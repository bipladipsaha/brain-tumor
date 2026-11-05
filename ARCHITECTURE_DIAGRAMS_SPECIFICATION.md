# NeuroVision 3D: Architecture Diagram & System Specification
### Guide for Project Reports, PPT Slides, and Academic Viva Defense

This document provides the complete structural specification for drawing the architecture diagrams of **NeuroVision 3D**.

---

## 1. System Architecture Overview

NeuroVision 3D is designed as a **decoupled, 5-tier architecture**:

1. **Presentation Layer (Frontend):** React 18, Three.js WebGL, Tailwind CSS. Supports dual persona views: *Patient-Friendly View* and *Clinician/Research View*.
2. **API & Communication Layer:** FastAPI (ASGI Uvicorn), asynchronous REST endpoints, CORS middleware.
3. **Medical Preprocessing Layer:** NiBabel & PIL normalizer, Canonical RAS orientation transformation, Z-score intensity normalization, voxel spacing extractor ($dx, dy, dz$).
4. **Deep Learning Core Layer:** PyTorch & MONAI 3D SegResNet, patch-based sliding-window inference with Gaussian blending.
5. **Geometric & Morphometric Engine:** Marching Cubes isosurface extraction, Laplacian smoothing, quadric decimation, physical volume integration ($cm^3$), ReportLab PDF generation.

---

## 2. Diagram 1: End-to-End System & Dataflow Architecture

### Component Breakdown Table (Use this for slide bullet points):

| Layer | Component Name | Technology | Inputs | Outputs | Primary Responsibility |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. UI** | Client Application | React 18, Vite | User clicks, file uploads | Interactive 3D Canvas, 2D Slices | Renders 3D brain mesh and plain-language patient explanations. |
| **2. API** | Gateway Service | FastAPI / Uvicorn | Multipart HTTP Form Data | JSON responses, Binary PDF | Directs incoming scans, runs validation, handles session caching. |
| **3. Preproc** | Spatial & Intensity Normalizer | NiBabel, NumPy, SciPy | Raw NIfTI (.nii) or Image (JPG) | Normalized array ($4 \times D \times H \times W$) | Standardizes voxel dimensions, aligns to RAS space, normalizes contrast. |
| **4. AI Core** | 3D SegResNet Engine | PyTorch, MONAI | 4-Channel MRI Tensor | Probability Mask ($3 \times D \times H \times W$) | Performs volumetric sliding-window segmentation for WT, TC, and ET. |
| **5. Mesh Engine** | Isosurface Reconstruction | scikit-image, Trimesh | 3D Binary Voxel Arrays | Vertex & Face Buffer Arrays | Converts discrete voxels into smooth polygon meshes via Marching Cubes. |
| **6. Analytics** | Morphometric Calculator | Pure Python / NumPy | Prediction coordinates + Affine | Structured Metrics Dictionary | Computes true volume ($cm^3$), centroid, bounding box, dimensions ($mm$). |
| **7. Reporting** | Clinical Report Synthesizer | ReportLab | Metrics + AI Findings | Structured PDF Document | Generates downloadable diagnostic summaries with disclaimers. |

---

## 3. Diagram 2: 3D SegResNet Deep Learning Network Architecture

### Layer-by-Layer Tensor Dimensions Table (For Deep Learning Defense):

| Stage | Layer / Operation | Kernel Size | Stride | Input Tensor Shape | Output Tensor Shape | Learnable Parameters / Syllabus Topic |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Input** | Multimodal MRI | - | - | - | $(4, 128, 128, 128)$ | 4 Sequences: FLAIR, T1ce, T1, T2 |
| **Init** | Initial Convolution | $3 \times 3 \times 3$ | 1 | $(4, 128, 128, 128)$ | $(16, 128, 128, 128)$ | Weight sharing, biological receptive fields |
| **Enc 1** | ResNet Block 1 | $3 \times 3 \times 3$ | 1 | $(16, 128, 128, 128)$ | $(16, 128, 128, 128)$ | Identity skip connection: $F(x) + x$ |
| **Enc 2** | Strided Conv + 2x Res | $3 \times 3 \times 3$ | 2 | $(16, 128, 128, 128)$ | $(32, 64, 64, 64)$ | Strided Conv replaces MaxPool |
| **Enc 3** | Strided Conv + 2x Res | $3 \times 3 \times 3$ | 2 | $(32, 64, 64, 64)$ | $(64, 32, 32, 32)$ | Hierarchical feature abstraction |
| **Enc 4** | Strided Conv + 4x Res | $3 \times 3 \times 3$ | 2 | $(64, 32, 32, 32)$ | $(128, 16, 16, 16)$ | Deep semantic representation |
| **Bottleneck** | Dense + VAE Branch | - | - | $(128, 16, 16, 16)$ | Mean $\mu$, Log-Variance $\log \sigma^2$ | Reparameterization Trick: $z = \mu + \sigma \odot \epsilon$ |
| **Dec 3** | Transposed Conv + Skip | $3 \times 3 \times 3$ | 2 | $(128, 16, 16, 16)$ | $(64, 32, 32, 32)$ | Backprop as transposed filter convolution |
| **Dec 2** | Transposed Conv + Skip | $3 \times 3 \times 3$ | 2 | $(64, 32, 32, 32)$ | $(32, 64, 64, 64)$ | U-Net Skip Connection adds Enc 2 features |
| **Dec 1** | Transposed Conv + Skip | $3 \times 3 \times 3$ | 2 | $(32, 64, 64, 64)$ | $(16, 128, 128, 128)$ | Restores original spatial resolution |
| **Output** | Final $1 \times 1 \times 1$ Conv + Sigmoid | $1 \times 1 \times 1$ | 1 | $(16, 128, 128, 128)$ | $(3, 128, 128, 128)$ | Multi-label output for WT, TC, and ET |

---

## 4. Key Mathematical Formulas to Display Beside the Diagram

1. **Soft Dice Loss (Optimization Objective):**
   $$\mathcal{L}_{\text{Dice}} = 1 - \frac{2 \sum_{i=1}^N p_i y_i + \epsilon}{\sum_{i=1}^N p_i^2 + \sum_{i=1}^N y_i^2 + \epsilon}$$

2. **VAE Regularization Loss (Bottleneck):**
   $$\mathcal{L}_{\text{total}} = \mathcal{L}_{\text{Dice}} + \alpha \mathcal{L}_{\text{recon}} + \beta D_{\text{KL}}(\mathcal{N}(\mu, \sigma^2) \parallel \mathcal{N}(0, I))$$

3. **Physical Volume Calculation:**
   $$\text{Volume } (cm^3) = \frac{\sum \text{Foreground Voxels} \times (dx \times dy \times dz)}{1000}$$

4. **Residual Addition (Vanishing Gradient Prevention):**
   $$y = \mathcal{F}(x, \{W_i\}) + x$$

---

## 5. How to Draw This in Draw.io / PowerPoint:

1. **Color Coding Strategy:**
   - **Blue (#3B82F6):** Preprocessing & Input Data.
   - **Purple (#8B5CF6):** 3D Neural Network (Encoder & Decoder).
   - **Amber (#F59E0B):** Marching Cubes & 3D Geometric Processing.
   - **Green (#10B981):** Final Outputs (3D WebGL Canvas, Patient Cards, PDF).
2. **Arrows:**
   - Solid arrows for feedforward data pipeline.
   - Dashed arrows for U-Net skip connections (from Encoder blocks to corresponding Decoder blocks).

