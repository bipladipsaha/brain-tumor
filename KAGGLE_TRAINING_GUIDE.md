# NeuroVision 3D – Kaggle Training Quickstart Guide

This guide walks you through training the **NeuroVision 3D** volumetric segmentation model on Kaggle using a free GPU (NVIDIA T4 or P100).

---

## 1. Create a New Notebook on Kaggle
1. Go to [kaggle.com](https://www.kaggle.com) and log in.
2. Click **+ Create** -> **New Notebook**.
3. In the notebook editor, click **File** -> **Import Notebook** and upload:
   ```
   c:\Users\bipla\Downloads\mri\neurovision_brats_training.ipynb
   ```

---

## 2. Add the BraTS Dataset
In your Kaggle notebook:
1. In the right-hand panel, look for **Input** -> Click **+ Add Input**.
2. In the search box, search for:
   `brats20-dataset-training-validation` (by user *awsaf49*)
   or search `brats 2020` / `brats 2021`.
3. Click the **+** (Add) icon next to the dataset.
4. Once added, it will be mounted at `/kaggle/input/...`. The notebook automatically discovers NIfTI files (`.nii` and `.nii.gz`) inside `/kaggle/input`.

---

## 3. Enable GPU Accelerator & Internet
In the right-hand settings panel:
- **Accelerator**: Select **GPU T4 x2** or **GPU P100**.
- **Internet**: Toggle **On** (required to download `monai` and `nibabel`).
- **Persistence**: Variables & files (optional, but helpful).

---

## 4. Run the Training
1. Click **Run All** (or run cells sequentially from top to bottom).
2. **What happens during execution:**
   - **Cells 1–2**: Installs MONAI & checks that CUDA is active.
   - **Cell 3**: Detects the BraTS cases and pairs the 4 MRI sequences (`FLAIR`, `T1`, `T1ce`, `T2`) with the segmentation labels.
   - **Cells 4–6**: Prepares MONAI data pipelines and instantiates the **3D SegResNet** model.
   - **Cell 7**: Runs mixed-precision training (`torch.cuda.amp`) with patch crops ($128 \times 128 \times 128$). Every 2 epochs, it evaluates Dice score via sliding-window inference across the whole 3D brain and saves the best model checkpoint.
   - **Cells 8–9**: Plots training curves and renders sample axial slices showing Ground Truth vs Prediction.
   - **Cell 10**: Exports the model checkpoint and sample validation volume.

---

## 5. Download the Exported Artifacts
After training finishes, check the right panel under **Output** -> `/kaggle/working/`:
1. `neurovision_checkpoints/neurovision_3d_best_model.pth` *(The trained PyTorch model weights)*
2. `sample_test_volume.npz` *(Sample volumetric test case for local 3D testing)*
3. `neurovision_metadata.json` *(Model hyperparameters and validation Dice scores)*

Download these files to your local `c:\Users\bipla\Downloads\mri\` directory under a folder named `model_weights/`:
```
c:\Users\bipla\Downloads\mri\
├── model_weights/
│   ├── neurovision_3d_best_model.pth
│   ├── sample_test_volume.npz
│   └── neurovision_metadata.json
```

Once downloaded, we will immediately use them in **Phase 2** to build the **3D Marching Cubes mesh extractor** and **Phase 3** for the **FastAPI & React/Three.js web application**!

