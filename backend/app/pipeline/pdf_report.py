import io
import time
from typing import Dict, Any, Optional
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def generate_pdf_report(
    analysis_id: str,
    metrics: Dict[str, Any],
    explanation: Dict[str, Any],
    model_info: Optional[Dict[str, Any]] = None
) -> bytes:
    """
    Generates a structured medical neuroimaging analysis report in PDF format.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )
    
    styles = getSampleStyleSheet()
    
    # Custom Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0F172A'),
        fontName='Helvetica-Bold'
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#64748B')
    )
    
    heading2_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontSize=13,
        leading=16,
        textColor=colors.HexColor('#1E293B'),
        spaceBefore=12,
        spaceAfter=6,
        fontName='Helvetica-Bold'
    )
    
    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontSize=9.5,
        leading=14,
        textColor=colors.HexColor('#334155')
    )
    
    disclaimer_style = ParagraphStyle(
        'Disclaimer',
        parent=styles['Italic'],
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#DC2626')
    )

    story = []
    
    # Header Banner
    story.append(Paragraph("NeuroVision 3D - AI Neuroimaging Analysis Report", title_style))
    story.append(Paragraph(f"Analysis Session ID: {analysis_id}  |  Generated: {time.strftime('%Y-%m-%d %H:%M:%S')}", subtitle_style))
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#2563EB'), spaceAfter=12))
    
    # Section 1: Scan & Model Metadata
    story.append(Paragraph("1. Examination & System Specifications", heading2_style))
    meta_data = [
        [Paragraph("<b>Primary Architecture:</b>", body_style), Paragraph("3D SegResNet (MONAI volumetric)", body_style),
         Paragraph("<b>Target Modalities:</b>", body_style), Paragraph("FLAIR, T1ce, T1, T2", body_style)],
        [Paragraph("<b>Coordinate Space:</b>", body_style), Paragraph("RAS (Right-Anterior-Superior)", body_style),
         Paragraph("<b>Voxel Spacing:</b>", body_style), Paragraph(f"{metrics.get('voxel_spacing_mm', [1,1,1])} mm", body_style)],
    ]
    meta_table = Table(meta_data, colWidths=[130, 140, 120, 140])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 10))
    
    # Section 2: Quantitative Volumetric Measurements
    story.append(Paragraph("2. Volumetric & Morphometric Analysis", heading2_style))
    vols = metrics.get("volumes", {})
    dims = metrics.get("dimensions_mm", {})
    
    vol_data = [
        [Paragraph("<b>Subregion / Parameter</b>", body_style), Paragraph("<b>Estimated Volume (cm³)</b>", body_style), Paragraph("<b>Voxel Count</b>", body_style)],
        [Paragraph("Whole Tumor (WT)", body_style), str(vols.get("whole_tumor_cm3", 0.0)), str(metrics.get("voxel_counts", {}).get("whole_tumor", 0))],
        [Paragraph("Tumor Core (TC)", body_style), str(vols.get("tumor_core_cm3", 0.0)), str(metrics.get("voxel_counts", {}).get("tumor_core", 0))],
        [Paragraph("Active Enhancing Rim (ET)", body_style), str(vols.get("enhancing_tumor_cm3", 0.0)), str(metrics.get("voxel_counts", {}).get("enhancing_tumor", 0))],
        [Paragraph("Peritumoral Edema", body_style), str(vols.get("edema_cm3", 0.0)), str(metrics.get("voxel_counts", {}).get("edema", 0))],
    ]
    vol_table = Table(vol_data, colWidths=[200, 160, 170])
    vol_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#EFF6FF')),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8FAFC')]),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(vol_table)
    story.append(Spacer(1, 10))
    
    # Spatial Dimensions & Centroid
    if dims:
        spatial_data = [
            [Paragraph(f"<b>Estimated Dimensions:</b> {dims.get('length_x_mm', 0)} mm (L) × {dims.get('width_y_mm', 0)} mm (W) × {dims.get('height_z_mm', 0)} mm (H)", body_style)],
            [Paragraph(f"<b>Centroid (Physical):</b> {metrics.get('centroid_physical_mm', 'N/A')} mm", body_style)],
            [Paragraph(f"<b>Anatomical Localization:</b> {metrics.get('anatomical_location', 'N/A')}", body_style)]
        ]
        sp_table = Table(spatial_data, colWidths=[530])
        sp_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F1F5F9')),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        story.append(sp_table)
        story.append(Spacer(1, 10))
        
    # Section 3: AI Clinical Summary & Plain-Language Explanation
    story.append(Paragraph("3. AI Findings & Patient Explanation", heading2_style))
    story.append(Paragraph(f"<b>Plain Language Summary:</b> {explanation.get('patient_summary', '')}", body_style))
    story.append(Spacer(1, 6))
    story.append(Paragraph(f"<b>Clinical Impression:</b> {explanation.get('clinician_summary', '')}", body_style))
    story.append(Spacer(1, 12))
    
    # Section 4: System Limitations & Disclaimer
    story.append(Paragraph("4. Methodological Limitations & Medical Disclaimer", heading2_style))
    for lim in explanation.get("limitations", []):
        story.append(Paragraph(f"• {lim}", body_style))
    story.append(Spacer(1, 8))
    
    story.append(Paragraph(explanation.get("disclaimer", ""), disclaimer_style))
    
    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()

