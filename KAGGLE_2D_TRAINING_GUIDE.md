# NeuroVision 3D: 2D JPG/PNG MRI Training Quickstart Guide
### Train in 3 to 5 Minutes on Kaggle GPU

This guide explains how to train the **2D U-Net** on patient MRI pictures (`.jpg`, `.png`, `.tif`) using the popular **Brain MRI Segmentation** dataset.

---

## 1. Create Notebook on Kaggle
1. Go to [kaggle.com](https://www.kaggle.com) and click **+ Create** $\rightarrow$ **New Notebook**.
2. Click **File** $\rightarrow$ **Import Notebook** $\rightarrow$ upload:
   ```
   c:\Users\bipla\Downloads\mri\neurovision_2d_jpg_training.ipynb
   ```

---

## 2. Add the 2D Dataset
1. In the right panel under **Input**, click **+ Add Input**.
2. In the search box, search for:
   ```text
   lgg-mri-segmentation
   ```
   *(Dataset title: **Brain MRI segmentation** by user **Mateusz Buda** - contains 3,929 MRI slices with ground truth masks)*.
3. Click the **`+`** button to mount it.

---

## 3. Enable GPU & Run
1. In the right-hand panel, set **Accelerator** to **GPU T4** (or P100) and **Internet** to **On**.
2. Click **Run** $\rightarrow$ **Run All**.
3. **Training Time:** It will run for 10 epochs and finish in **just 3 to 5 minutes!**

---

## 4. Download Model Weights
1. In the right-hand panel under **Output** (`/kaggle/working/checkpoints_2d/`):
   - Download **`neurovision_2d_unet.pth`**.
2. Save it directly into your local project folder:
   ```
   c:\Users\bipla\Downloads\mri\model_weights\neurovision_2d_unet.pth
   ```

Now, whenever a patient uploads a standard JPG or PNG MRI image to your website, the system automatically uses this 2D U-Net to segment the tumor and reconstruct it into the interactive 3D brain!

