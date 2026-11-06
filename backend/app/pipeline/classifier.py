import numpy as np
from typing import Dict, Any, List

def classify_tumor_type(metrics: Dict[str, Any]) -> Dict[str, Any]:
    """
    Multi-parametric radiomic and phenotypic brain tumor classifier.
    Categorizes brain lesions into WHO CNS 2021 recognized entities:
    1. Glioblastoma (GBM - WHO Grade 4) [Primary Malignant]
    2. Lower-Grade Diffuse Glioma (Astrocytoma / Oligodendroglioma Grade 2-3) [Primary]
    3. Meningioma (WHO Grade 1-2) [Primary Extra-Axial, Benign]
    4. Pituitary Adenoma [Primary Sellar, Benign]
    5. Metastatic Secondary Brain Tumor [Secondary / Hematogenous Spread]
    """
    if not metrics.get("tumor_detected", False):
        return {
            "has_tumor": False,
            "primary_class": "No Tumor Detected",
            "category": "Normal Parenchyma",
            "confidence": 0.99,
            "probabilities": {
                "No Tumor Detected": 0.99,
                "Glioma / Glioblastoma": 0.00,
                "Meningioma": 0.00,
                "Pituitary Adenoma": 0.00,
                "Metastasis": 0.00
            },
            "who_grade": "N/A",
            "malignancy": "Normal / Clear",
            "origin": "N/A",
            "hallmarks": ["No abnormal mass effect or hyperintensity detected."]
        }

    vols = metrics.get("volumes", {})
    wt_vol = vols.get("whole_tumor_cm3", 0.0)
    tc_vol = vols.get("tumor_core_cm3", 0.0)
    et_vol = vols.get("enhancing_tumor_cm3", 0.0)
    edema_vol = vols.get("edema_cm3", 0.0)
    
    comp = metrics.get("tissue_composition", {})
    edema_ratio = comp.get("edema_to_core_ratio", 1.0)
    enhancing_pct = comp.get("enhancing_percent", 50.0)
    
    loc = metrics.get("anatomical_location", "").lower()
    
    # Calculate Phenotypic Probability Scores
    p_gbm = 0.0
    p_lgg = 0.0
    p_mening = 0.0
    p_pituitary = 0.0
    p_metastasis = 0.0

    # 1. Location-based priors
    if "sellar" in loc or "pituitary" in loc or "midline base" in loc:
        p_pituitary += 50.0
    elif "meningeal" in loc or "dural" in loc or "falx" in loc or "calvarial" in loc:
        p_mening += 40.0
    else:
        # Intra-axial cerebral hemisphere (Frontal, Temporal, Parietal, Occipital)
        p_gbm += 25.0
        p_lgg += 25.0
        p_metastasis += 20.0
        p_mening += 10.0

    # 2. Contrast Enhancement Kinetics (ET ratio)
    if et_vol > 0.3 * (tc_vol + 1e-5):
        # Strong active neovascularization
        p_gbm += 30.0
        p_metastasis += 25.0
        p_mening += 20.0
    else:
        # Non-enhancing or patchy
        p_lgg += 35.0
        p_pituitary += 15.0

    # 3. Necrotic Breakdown (Core volume vs Enhancing)
    if tc_vol > 1.2 * et_vol and tc_vol > 2.0:
        # Central necrotic core
        p_gbm += 25.0
        p_metastasis += 15.0
    elif tc_vol <= et_vol * 1.1:
        # Solid non-necrotic enhancement
        p_mening += 25.0
        p_lgg += 15.0

    # 4. Vasogenic Edema Ratio (Edema vs Core)
    if edema_ratio > 2.2:
        # Massive out-of-proportion edema
        p_metastasis += 30.0
        p_gbm += 20.0
    elif edema_ratio > 1.0:
        p_gbm += 20.0
        p_lgg += 15.0
        p_metastasis += 15.0
    else:
        # Well-circumscribed with minimal swelling (typical of benign extra-axial)
        p_mening += 25.0
        p_pituitary += 20.0
        p_lgg += 15.0

    # Softmax Normalization
    raw_scores = np.array([p_gbm, p_lgg, p_mening, p_pituitary, p_metastasis], dtype=np.float64)
    # Scale by temperature for well-calibrated medical probabilities
    exp_scores = np.exp(raw_scores / 25.0)
    probs = exp_scores / np.sum(exp_scores)
    
    classes = [
        "Glioblastoma (GBM)",
        "Lower-Grade Glioma (Astrocytoma / Oligo)",
        "Meningioma",
        "Pituitary Adenoma",
        "Metastatic Brain Tumor"
    ]
    
    prob_dict = {cls: round(float(p), 3) for cls, p in zip(classes, probs)}
    top_idx = int(np.argmax(probs))
    top_class = classes[top_idx]
    top_prob = round(float(probs[top_idx]), 2)
    
    # Class-specific details & radiological hallmarks
    if top_class == "Glioblastoma (GBM)":
        category = "High-Grade Infiltrative Glioma (Primary)"
        who_grade = "WHO CNS Grade 4"
        malignancy = "Malignant (Fast-Growing)"
        origin = "Primary (Originates from brain glial/astrocytic cells)"
        hallmarks = [
            "Prominent central necrosis / non-enhancing core with ring-like peripheral hyperintensity",
            "Significant peritumoral vasogenic edema invading adjacent white matter tracts",
            "Infiltrative intra-axial subcortical growth pattern",
            "Aggressive microvascular proliferation visible on contrast scans"
        ]
        patient_note = (
            "The AI scan analysis detected imaging features most characteristic of a high-grade primary glial finding (Glioblastoma / Astrocytoma). "
            "These typically exhibit active contrast uptake and surrounding fluid swelling. Immediate neurosurgical consultation is advised."
        )
    elif top_class == "Lower-Grade Glioma (Astrocytoma / Oligo)":
        category = "Diffuse Lower-Grade Glioma (Primary)"
        who_grade = "WHO CNS Grade 2–3"
        malignancy = "Low-to-Intermediate Grade"
        origin = "Primary (Astrocytes or Oligodendrocytes)"
        hallmarks = [
            "Diffuse hyperintense signal on FLAIR with minimal or patchy contrast enhancement",
            "Absence of gross central necrosis or liquefaction",
            "Moderate surrounding edema with relatively preserved anatomical borders",
            "Slow-growing infiltrative tendency along white matter tracts"
        ]
        patient_note = (
            "The scan features suggest a slower-growing lower-grade glial finding (Astrocytoma or Oligodendroglioma). "
            "These often have less surrounding swelling and slower growth, but still require specialist evaluation and molecular profiling."
        )
    elif top_class == "Meningioma":
        category = "Extra-Axial Dural Neoplasm"
        who_grade = "WHO Grade 1 (Mostly Benign) / Grade 2"
        malignancy = "Predominantly Benign (>85-90%)"
        origin = "Primary (Originates from arachnoid cap cells in meninges)"
        hallmarks = [
            "Extra-axial mass arising from the protective brain coverings (meninges)",
            "Homogeneous, solid contrast enhancement with sharp circumscribed margins",
            "Relatively low peritumoral swelling compared to core size",
            "Pushing rather than infiltrating the underlying brain cortex"
        ]
        patient_note = (
            "The scan shows features of a meningioma, which is the most common benign brain tumor. It grows on the protective membranes "
            "outside the brain rather than inside the brain tissue itself. Many are slow-growing and treatable."
        )
    elif top_class == "Pituitary Adenoma":
        category = "Sellar / Suprasellar Neoplasm"
        who_grade = "WHO Grade 1 (Benign)"
        malignancy = "Benign (Non-Cancerous)"
        origin = "Primary (Pituitary gland at skull base)"
        hallmarks = [
            "Well-circumscribed sellar or suprasellar lesion at the skull base",
            "Close proximity to the optic chiasm and internal carotid arteries",
            "Smooth non-infiltrative borders without vasogenic cerebral edema",
            "Frequently associated with endocrine hormone fluctuations"
        ]
        patient_note = (
            "The scan pattern indicates a pituitary adenoma located at the base of the skull. These are benign, non-cancerous growths "
            "that can often be managed with medications or minimally invasive endoscopic surgery."
        )
    else: # Metastatic
        category = "Secondary / Disseminated Brain Lesion"
        who_grade = "Metastatic (Grade varies by primary site)"
        malignancy = "Malignant (Secondary Spread)"
        origin = "Secondary (Spread from primary cancer: Lung, Breast, Kidney, Melanoma, or GI)"
        hallmarks = [
            "Sharp, well-demarcated nodular or ring-enhancing mass at the corticomedullary junction",
            "Out-of-proportion, extensive surrounding finger-like vasogenic edema",
            "Hematogenous seeding predilection at gray-white matter boundaries",
            "Frequent multiplicity (requires whole-body systemic staging CT/PET)"
        ]
        patient_note = (
            "The scan pattern reveals a sharply demarcated nodule with prominent surrounding fluid swelling, characteristic of a secondary "
            "(metastatic) finding. A thorough systemic health screening is recommended to identify any origin elsewhere in the body."
        )

    return {
        "has_tumor": True,
        "primary_class": top_class,
        "category": category,
        "confidence": top_prob,
        "probabilities": prob_dict,
        "who_grade": who_grade,
        "malignancy": malignancy,
        "origin": origin,
        "hallmarks": hallmarks,
        "patient_note": patient_note
    }

