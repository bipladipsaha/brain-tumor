import os
import torch
import numpy as np
import cv2
from typing import Optional, Dict, Any

from monai.networks.nets import SegResNet, UNet
from monai.inferers import sliding_window_inference

class BrainTumorInferenceEngine:
    """
    Dual-Engine Inference Manager:
    1. 3D SegResNet for volumetric NIfTI (.nii, .nii.gz) scans.
    2. 2D U-Net for standard photographic MRI pictures (.jpg, .png).
    """
    def __init__(self, model_weights_path_3d: Optional[str] = None, model_weights_path_2d: Optional[str] = None):
        self.device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
        self.model_weights_path_3d = model_weights_path_3d
        self.model_weights_path_2d = model_weights_path_2d
        self._model_3d = None
        self._model_2d = None
        self.weights_loaded_3d = False
        self.weights_loaded_2d = False
        self.roi_size = (128, 128, 128)
        
    def _init_model_3d(self):
        if self._model_3d is None:
            self._model_3d = SegResNet(
                spatial_dims=3,
                in_channels=4,
                out_channels=3,
                init_filters=16,
                blocks_down=[1, 2, 2, 4],
                blocks_up=[1, 1, 1],
                dropout_prob=0.2,
            ).to(self.device)

    def _init_model_2d(self):
        if self._model_2d is None:
            self._model_2d = UNet(
                spatial_dims=2,
                in_channels=3,
                out_channels=1,
                channels=(16, 32, 64, 128, 256),
                strides=(2, 2, 2, 2),
                num_res_units=2,
            ).to(self.device)

    @property
    def model_3d(self):
        if self._model_3d is None:
            self._init_model_3d()
            if self.model_weights_path_3d and os.path.exists(self.model_weights_path_3d):
                self.load_weights_3d(self.model_weights_path_3d)
        return self._model_3d

    @property
    def model_2d(self):
        if self._model_2d is None:
            self._init_model_2d()
            if self.model_weights_path_2d and os.path.exists(self.model_weights_path_2d):
                self.load_weights_2d(self.model_weights_path_2d)
        return self._model_2d

    def load_weights_3d(self, weights_path: str):
        try:
            self._init_model_3d()
            state_dict = torch.load(weights_path, map_location=self.device)
            self._model_3d.load_state_dict(state_dict)
            self._model_3d.eval()
            self.weights_loaded_3d = True
            print(f"✅ Loaded 3D SegResNet weights from {weights_path}")
        except Exception as e:
            print(f"⚠️ Error loading 3D weights: {e}")
            self.weights_loaded_3d = False

    def load_weights_2d(self, weights_path: str):
        try:
            self._init_model_2d()
            state_dict = torch.load(weights_path, map_location=self.device)
            self._model_2d.load_state_dict(state_dict)
            self._model_2d.eval()
            self.weights_loaded_2d = True
            print(f"✅ Loaded 2D U-Net weights from {weights_path}")
        except Exception as e:
            print(f"⚠️ Error loading 2D weights: {e}")
            self.weights_loaded_2d = False

    @property
    def weights_loaded(self) -> bool:
        return self.weights_loaded_3d or self.weights_loaded_2d

    def predict_2d_image(self, img_rgb: np.ndarray) -> np.ndarray:
        """
        Runs 2D U-Net inference on a single JPG/PNG image.
        Args:
            img_rgb: (H, W, 3) or (H, W) uint8 or float32 image.
        Returns:
            Binary mask (H, W) with tumor contours.
        """
        if img_rgb.ndim == 2:
            img_rgb = np.stack([img_rgb] * 3, axis=-1)
            
        orig_h, orig_w = img_rgb.shape[:2]
        resized = cv2.resize(img_rgb, (256, 256))
        
        if resized.max() > 1.0:
            resized = resized.astype(np.float32) / 255.0
            
        tensor_in = torch.from_numpy(resized).permute(2, 0, 1).unsqueeze(0).float().to(self.device)
        
        if self.weights_loaded_2d:
            with torch.no_grad():
                pred = self.model_2d(tensor_in)
                pred_mask = (torch.sigmoid(pred) > 0.5).float().cpu().numpy()[0, 0]
        else:
            # High-intensity clustering fallback for 2D images
            gray = cv2.cvtColor((resized * 255).astype(np.uint8), cv2.COLOR_RGB2GRAY)
            thresh = np.percentile(gray[gray > 30], 92) if np.any(gray > 30) else 200
            pred_mask = (gray > thresh).astype(np.float32)
            
        # Resize back to original dimensions
        mask_full = cv2.resize(pred_mask, (orig_w, orig_h), interpolation=cv2.INTER_NEAREST)
        return (mask_full > 0.5).astype(np.float32)

    def predict(self, mri_volume_4ch: np.ndarray) -> np.ndarray:
        """
        Executes sliding-window inference across a 3D volume.
        """
        if mri_volume_4ch.ndim == 3:
            mri_volume_4ch = np.stack([mri_volume_4ch] * 4, axis=0)
            
        if self.weights_loaded_3d:
            input_tensor = torch.from_numpy(mri_volume_4ch).unsqueeze(0).float().to(self.device)
            with torch.no_grad():
                preds = sliding_window_inference(
                    inputs=input_tensor,
                    roi_size=self.roi_size,
                    sw_batch_size=1,
                    predictor=self.model_3d,
                    overlap=0.5,
                    mode="gaussian"
                )
                pred_binary = (torch.sigmoid(preds) > 0.5).float().cpu().numpy()[0]
            return pred_binary
        else:
            flair = mri_volume_4ch[0]
            return self._heuristic_candidate_segmentation(flair)
            
    def _heuristic_candidate_segmentation(self, volume: np.ndarray) -> np.ndarray:
        from scipy import ndimage
        v_norm = (volume - volume.min()) / (volume.max() - volume.min() + 1e-8)
        brain_mask = v_norm > 0.15
        if np.any(brain_mask):
            thresh = np.percentile(v_norm[brain_mask], 93)
            high_intensity = (v_norm > thresh) & brain_mask
        else:
            high_intensity = np.zeros_like(volume, dtype=bool)
            
        opened = ndimage.binary_opening(high_intensity, iterations=2)
        labeled, num_features = ndimage.label(opened)
        
        if num_features > 0:
            sizes = ndimage.sum(opened, labeled, range(1, num_features + 1))
            largest_label = np.argmax(sizes) + 1
            wt_mask = (labeled == largest_label)
            wt_mask = ndimage.binary_dilation(wt_mask, iterations=3)
            tc_mask = ndimage.binary_erosion(wt_mask, iterations=2)
            et_mask = tc_mask & (v_norm > np.percentile(v_norm[brain_mask], 96))
        else:
            wt_mask = np.zeros_like(volume, dtype=bool)
            tc_mask = np.zeros_like(volume, dtype=bool)
            et_mask = np.zeros_like(volume, dtype=bool)
            
        return np.stack([wt_mask, tc_mask, et_mask], axis=0).astype(np.float32)
