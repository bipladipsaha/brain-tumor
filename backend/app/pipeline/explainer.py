from typing import Dict, Any, List

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

def get_friendly_location_desc(location: str) -> Dict[str, Any]:
    loc_lower = location.lower()
    side = "Right side" if "right" in loc_lower else "Left side" if "left" in loc_lower else "Central"
    
    if "frontal" in loc_lower or "anterior" in loc_lower:
        region = "Frontal Lobe (Anterior Area)"
        role = "Governs executive decision-making, voluntary motor coordination, planning, and personality."
        symptoms = [
            "Changes in concentration, executive planning, or mood stability",
            "Morning dull headaches or sensation of pressure",
            "Subtle weakness, tingling, or heaviness in the contralateral limb"
        ]
        eloquence = "High Functional Eloquence (near premotor & supplementary motor cortex)"
    elif "posterior" in loc_lower or "occipital" in loc_lower:
        region = "Occipital Lobe (Posterior Area)"
        role = "Primary visual processing cortex responsible for spatial perspective, color, shapes, and reading."
        symptoms = [
            "Visual field blind spots (hemianopia) or blurred visual acuity",
            "Transient visual sensations, flashes, or geometric light patterns",
            "Difficulty recognizing familiar objects or reading text fluently"
        ]
        eloquence = "High Eloquence (primary visual cortex & optic radiation territory)"
    elif "superior" in loc_lower or "parietal" in loc_lower:
        region = "Parietal Lobe (Superior Area)"
        role = "Integrates sensory perception including touch, temperature, spatial navigation, and body coordinates."
        symptoms = [
            "Numbness, altered sensation, or tingling in fingers or feet",
            "Mild spatial disorientation or misjudging object distances",
            "Difficulty with fine motor tasks such as buttoning or writing"
        ]
        eloquence = "High Eloquence (primary somatosensory cortex territory)"
    else:
        region = "Temporal Lobe (Lateral Area)"
        role = "Manages language comprehension, auditory processing, emotion, and long-term memory formation."
        symptoms = [
            "Word-finding hesitation or speech comprehension delays",
            "Episodes of unusual smells, metallic taste, or intense deja-vu sensations",
            "Short-term memory lapses or difficulty recalling recent conversations"
        ]
        eloquence = "High Eloquence (speech processing & hippocampus proximity)"
        
    return {
        "simple_title": f"{side}, {region}",
        "brain_function": role,
        "symptoms_to_monitor": symptoms,
        "functional_importance": eloquence
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
                "Good news! The volumetric scan analysis did not identify any obvious abnormal mass, "
                "suspicious hyperintensity, or space-occupying swelling within the brain parenchyma."
            ),
            "clinician_summary": (
                "Negative finding for volumetric mass lesions or hyperintense neoplastic tissue within model sensitivity bounds."
            ),
            "friendly_details": {
                "headline": "No Significant Abnormality Detected",
                "location_title": "Normal Cranial Scan",
                "location_role": "Brain parenchyma appears symmetric and within expected tissue intensity limits.",
                "size_comparison": "0.0 cm³",
                "volume_str": "0.0 cm³",
                "dimensions_str": "0.0 × 0.0 × 0.0 mm",
                "status_badge": "Normal / Clear",
                "status_color": "emerald",
                "symptoms_to_monitor": [],
                "consultation_questions": [
                    "Discuss any ongoing symptoms (such as chronic migraines, sinus pressure, or fatigue).",
                    "Keep a digital archive of this scan for baseline comparative imaging."
                ]
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
    dims = metrics.get("dimensions_mm") or {"length_x_mm": 0, "width_y_mm": 0, "height_z_mm": 0}
    location = metrics.get("anatomical_location", "Cranial Cavity")
    comp = metrics.get("tissue_composition", {})
    structural = metrics.get("structural_impact", {})
    
    wt_vol = vols["whole_tumor_cm3"]
    tc_vol = vols["tumor_core_cm3"]
    et_vol = vols["enhancing_tumor_cm3"]
    edema_vol = vols["edema_cm3"]
    
    size_comparison = get_friendly_size_comparison(wt_vol)
    friendly_loc = get_friendly_location_desc(location)
    
    # Differential Diagnosis Assessment
    if et_vol > 0.4 * wt_vol or comp.get("edema_to_core_ratio", 0) > 1.2:
        diff_diag = (
            "Primary differential includes High-Grade Neuroepithelial Neoplasm (Glioblastoma / High-Grade Astrocytoma) "
            "vs Solitary Cerebral Metastasis. Prominent vascularized contrast enhancement and peritumoral vasogenic edema identified."
        )
        subtype_label = "High-Grade Infiltrative Profile"
    elif tc_vol > 0.0:
        diff_diag = (
            "Primary differential includes Diffuse Lower-Grade Glioma (Astrocytoma / Oligodendroglioma WHO Grade 2-3) "
            "vs Subacute Demyelinating / Post-Ischemic reactive lesion."
        )
        subtype_label = "Diffuse Lower-Grade Glial Profile"
    else:
        diff_diag = (
            "Focal localized signal abnormality without gross internal necrosis. Differential includes low-grade glial "
            "focus, focal cerebritis, vascular malformation (cavernoma), or benign cystic nodule."
        )
        subtype_label = "Localized Focal Lesion"

    patient_text = (
        f"The AI highlighted a localized area in the {friendly_loc['simple_title']}. "
        f"The total estimated volume of this area is approximately {wt_vol} cm³ ({size_comparison}). "
        f"In the 3D model, your brain is shown as a semi-transparent outline with the detected spot highlighted inside. "
        f"A space-occupying spot on an MRI is not always malignant; many represent benign fluid collections or slow-growing lesions."
    )
    
    clinician_text = (
        f"Automated 3D deep learning segmentation identified a space-occupying lesion in the {location}. "
        f"Volumetric breakdown: Whole Tumor (WT) = {wt_vol} cm³; Tumor Core (TC) = {tc_vol} cm³; "
        f"Active Contrast-Enhancing Core (ET) = {et_vol} cm³; Peritumoral Vasogenic Edema = {edema_vol} cm³. "
        f"Principal bounding dimensions: {dims['length_x_mm']} mm (X) × {dims['width_y_mm']} mm (Y) × {dims['height_z_mm']} mm (Z). "
        f"Mass effect rating: {structural.get('mass_effect', 'Mild')}. Eloquence: {structural.get('eloquence_rating', 'Near-Eloquent')}."
    )
    
    consultation_questions = [
        "What specific type of lesion (e.g. glioma, meningioma, cyst, or inflammation) is most consistent with the scan?",
        "Is specialized advanced neuroimaging (such as MR Perfusion rCBV or MR Spectroscopy) needed before deciding on treatment?",
        "Does the swelling surrounding the lesion require anti-edema medication like dexamethasone?",
        "If a biopsy or surgery is considered, are any critical motor or speech pathways nearby (requiring fMRI or DTI tractography)?",
        "Will molecular and genetic testing (e.g. IDH1 mutation, 1p/19q codeletion, MGMT promoter methylation) be performed on any tissue sample?"
    ]

    molecular_recommendations = [
        {"biomarker": "IDH1 / IDH2 Status", "role": "Determines primary glioma subtype and favorable prognostic trajectory (WHO 2021)."},
        {"biomarker": "1p/19q Co-deletion", "role": "Essential to confirm oligodendroglial lineage vs astrocytic lineage."},
        {"biomarker": "MGMT Promoter Methylation", "role": "Predicts sensitivity to alkylating chemotherapy (Temozolomide)."},
        {"biomarker": "TERT Promoter / EGFR", "role": "Molecular criteria for upgrading diffuse astrocytic tumors to Grade 4 equivalent."}
    ]

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
            "meaning": "Active, vascularized tissue that absorbs intravenous gadolinium contrast."
        },
        {
            "subregion": "Tumor Core (TC)",
            "color": "#F59E0B",
            "hex": "#F59E0B",
            "meaning": "Dense tumor core, including non-enhancing tissue and central active mass."
        },
        {
            "subregion": "Whole Tumor / Edema (WT)",
            "color": "#10B981",
            "hex": "#10B981",
            "meaning": "Complete perimeter including reactive peritumoral vasogenic fluid swelling."
        }
    ]
    
    return {
        "patient_summary": patient_text,
        "clinician_summary": clinician_text,
        "friendly_details": {
            "headline": "Suspicious Region Identified for Doctor Review",
            "location_title": friendly_loc["simple_title"],
            "location_role": friendly_loc["brain_function"],
            "functional_importance": friendly_loc["functional_importance"],
            "symptoms_to_monitor": friendly_loc["symptoms_to_monitor"],
            "size_comparison": size_comparison,
            "volume_str": f"{wt_vol} cm³",
            "dimensions_str": f"{dims['length_x_mm']} × {dims['width_y_mm']} × {dims['height_z_mm']} mm",
            "status_badge": "Action Needed: Consult Specialist",
            "status_color": "amber",
            "consultation_questions": consultation_questions,
            "understanding_lesion": (
                "An abnormal spot on an MRI is referred to by doctors as a lesion or space-occupying finding. "
                "Not all lesions are malignant; many are benign fluid cysts, slow-growing non-cancerous nodules, or "
                "temporary post-inflammatory swelling. A physical biopsy and specialist consultation are always required for confirmation."
            )
        },
        "clinical_dossier": {
            "subtype_profile": subtype_label,
            "differential_diagnosis": diff_diag,
            "molecular_recommendations": molecular_recommendations,
            "structural_impact": structural,
            "rano_summary": f"Max Diameter: {dims.get('length_x_mm', 0)} mm; Cross-Section: {dims.get('width_y_mm', 0)} mm",
            "surgical_considerations": (
                "Pre-operative functional MRI (fMRI) and DTI tractography recommended to map adjacent corticospinal or "
                "arcuate fasciculus fibers. Contrast MRI within 48 hours post-op to evaluate extent of resection (EOR)."
            )
        },
        "color_guide": color_guide,
        "limitations": limitations_list,
        "next_steps": [
            "Download your 3D Analysis Report using the button above to bring to your consultation.",
            "Schedule an appointment with a Neurologist or Neurosurgeon for expert evaluation.",
            "Remember: An AI detection is not a diagnosis. Many brain spots turn out to be benign cysts or fluid collections."
        ],
        "disclaimer": (
            "NOTICE: NeuroVision 3D is designed to help patients and doctors understand medical imaging, "
            "but it is not a diagnosis. A qualified healthcare professional must review your full medical history and scan."
        )
    }
