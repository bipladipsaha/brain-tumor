from typing import Dict, Any

def get_friendly_size_comparison(volume_cm3: float) -> str:
    if volume_cm3 <= 0.1:
        return "Tiny speck (sub-millimeter)"
    elif volume_cm3 < 2.0:
        return "Small marble or blueberry (~1 to 1.5 cm across)"
    elif volume_cm3 < 7.0:
        return "Large grape or cherry (~2 cm across)"
    elif volume_cm3 < 20.0:
        return "Small walnut (~2.5 to 3 cm across)"
    elif volume_cm3 < 45.0:
        return "Golf ball or small lime (~3.5 to 4 cm across)"
    else:
        return "Medium fruit (~4.5+ cm across)"

def get_friendly_location_desc(location: str) -> Dict[str, str]:
    loc_lower = location.lower()
    side = "Right side" if "right" in loc_lower else "Left side" if "left" in loc_lower else "Central"
    
    if "frontal" in loc_lower or "anterior" in loc_lower:
        region = "Front part of the brain (Frontal Area)"
        role = "This area typically helps with decision-making, focus, and movement."
    elif "posterior" in loc_lower or "occipital" in loc_lower:
        region = "Back part of the brain (Occipital Area)"
        role = "This area is primarily involved in processing vision and visual perception."
    elif "superior" in loc_lower or "parietal" in loc_lower:
        region = "Upper side of the brain (Parietal Area)"
        role = "This area helps process touch, spatial awareness, and navigation."
    else:
        region = "Side part of the brain (Temporal Area)"
        role = "This area helps with understanding speech and memory."
        
    return {
        "simple_title": f"{side}, {region}",
        "brain_function": role
    }

def generate_ai_explanation(metrics: Dict[str, Any]) -> Dict[str, Any]:
    limitations_list = [
        "Segmentation boundaries are estimated using deep learning volumetric features and may vary across scanner field strengths (1.5T vs 3.0T).",
        "Edema boundaries on FLAIR may encompass both reactive vasogenic edema and microscopic infiltration.",
        "This deep learning model does not establish histopathological tumor grade or cancer diagnosis."
    ]

    if not metrics.get("tumor_detected", False):
        return {
            "patient_summary": (
                "Good news! The AI scan did not identify any obvious abnormal swelling, mass, or "
                "suspicious spot in this brain scan."
            ),
            "clinician_summary": (
                "Negative finding for volumetric hyperintense mass lesions within model sensitivity bounds."
            ),
            "friendly_details": {
                "headline": "No Significant Abnormality Detected",
                "location_title": "Normal Scan",
                "location_role": "Brain structures appear symmetric and within regular tissue density limits.",
                "size_comparison": "0.0 cm³",
                "status_badge": "Normal / Clear",
                "status_color": "emerald"
            },
            "color_guide": [
                {
                    "subregion": "Brain Shell",
                    "color": "#60A5FA",
                    "hex": "#60A5FA",
                    "meaning": "Anatomical cranial boundary."
                }
            ],
            "limitations": limitations_list,
            "next_steps": [
                "Keep a copy of your MRI scan for future medical records.",
                "If you are having symptoms (such as persistent headaches or dizziness), always consult a physician."
            ],
            "disclaimer": (
                "Notice: NeuroVision 3D is an educational and clinical decision-support tool. "
                "It does not replace a confirmed diagnosis by a medical doctor."
            )
        }
        
    vols = metrics["volumes"]
    dims = metrics["dimensions_mm"]
    location = metrics["anatomical_location"]
    
    wt_vol = vols["whole_tumor_cm3"]
    tc_vol = vols["tumor_core_cm3"]
    et_vol = vols["enhancing_tumor_cm3"]
    edema_vol = vols["edema_cm3"]
    
    size_comparison = get_friendly_size_comparison(wt_vol)
    friendly_loc = get_friendly_location_desc(location)
    
    patient_text = (
        f"The AI highlighted a suspicious area located in the {friendly_loc['simple_title']}. "
        f"The total estimated volume of this area is approximately {wt_vol} cm³ ({size_comparison}). "
        f"In the 3D model, your brain is shown as a semi-transparent outline so you can easily "
        f"turn it around with your mouse and see exactly where the spot is located."
    )
    
    clinician_text = (
        f"Automated 3D SegResNet volumetric segmentation identified a space-occupying lesion situated in the "
        f"{location}. Quantitative volumetric breakdown: Whole Tumor (WT) = {wt_vol} cm³; "
        f"Tumor Core (TC) = {tc_vol} cm³; Active Contrast-Enhancing Core (ET) = {et_vol} cm³; "
        f"Peritumoral Infiltrative Edema = {edema_vol} cm³. "
        f"Principal bounding dimensions: {dims['length_x_mm']} mm (X) × {dims['width_y_mm']} mm (Y) × {dims['height_z_mm']} mm (Z)."
    )
    
    color_guide = [
        {
            "subregion": "Brain Shell",
            "color": "#60A5FA",
            "hex": "#60A5FA",
            "meaning": "Anatomical cranial boundary showing relative internal orientation."
        },
        {
            "subregion": "Enhancing Tumor (ET)",
            "color": "#EF4444",
            "hex": "#EF4444",
            "meaning": "Active, vascularized portion of the lesion that absorbs contrast agent."
        },
        {
            "subregion": "Tumor Core (TC)",
            "color": "#F59E0B",
            "hex": "#F59E0B",
            "meaning": "Central core, including necrotic/non-enhancing tissue and active tumor."
        },
        {
            "subregion": "Whole Tumor / Edema (WT)",
            "color": "#10B981",
            "hex": "#10B981",
            "meaning": "Complete boundary including surrounding swelling/edema."
        }
    ]
    
    return {
        "patient_summary": patient_text,
        "clinician_summary": clinician_text,
        "friendly_details": {
            "headline": "Suspicious Region Identified for Doctor Review",
            "location_title": friendly_loc["simple_title"],
            "location_role": friendly_loc["brain_function"],
            "size_comparison": size_comparison,
            "volume_str": f"{wt_vol} cm³",
            "dimensions_str": f"{dims['length_x_mm']} × {dims['width_y_mm']} × {dims['height_z_mm']} mm",
            "status_badge": "Action Needed: Consult Specialist",
            "status_color": "amber"
        },
        "color_guide": color_guide,
        "limitations": limitations_list,
        "next_steps": [
            "Download your 3D Analysis Report using the button above to bring to your consultation.",
            "Schedule an appointment with a Neurologist or Neurosurgeon for expert evaluation.",
            "Remember: An AI detection is not a diagnosis. Many brain spots turn out to be benign cysts or fluid collections."
        ],
        "disclaimer": (
            "NOTICE: NeuroVision 3D is designed to help patients understand medical imaging, "
            "but it is not a doctor. A qualified healthcare professional must review your full medical history and scan."
        )
    }
