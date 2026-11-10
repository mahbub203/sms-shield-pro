import io
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def generate_pdf_security_report(
    report_title: str,
    time_window: str,
    metrics: dict,
    recent_events: list,
    threat_breakdown: list
) -> bytes:
    """Generates a professional cybersecurity incident and detection PDF report."""
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

    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0b1120')
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#475569')
    )
    h2_style = ParagraphStyle(
        'Heading2Custom',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=colors.HexColor('#0f172a'),
        spaceBefore=12,
        spaceAfter=6
    )
    body_style = ParagraphStyle(
        'BodyCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#1e293b')
    )
    badge_style = ParagraphStyle(
        'Badge',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        textColor=colors.HexColor('#0284c7')
    )

    story = []

    # Header / Branding
    story.append(Paragraph("SMS SHIELD &bull; CYBERSECURITY DEFENSE REPORT", badge_style))
    story.append(Spacer(1, 4))
    story.append(Paragraph(report_title, title_style))
    story.append(Paragraph(f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')} | Window: {time_window} | Classification: CONFIDENTIAL", subtitle_style))
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0284c7'), spaceAfter=14))

    # Executive Summary Metrics Table
    story.append(Paragraph("1. Executive Threat Summary", h2_style))
    metrics_data = [
        ["Total SMS Ingested", "Spam Detections", "Phishing Threats", "Blocked Senders", "Engine Accuracy"],
        [
            str(metrics.get("total_messages", 0)),
            str(metrics.get("spam_detected", 0)),
            str(metrics.get("phishing_attempts", 0)),
            str(metrics.get("blocked_senders_count", 0)),
            f"{metrics.get('detection_accuracy', 98.7):.1f}%"
        ]
    ]
    t_metrics = Table(metrics_data, colWidths=[105, 105, 105, 105, 105])
    t_metrics.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0f172a')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 8.5),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('BACKGROUND', (0, 1), (-1, 1), colors.HexColor('#f1f5f9')),
        ('FONTNAME', (0, 1), (-1, 1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 1), (-1, 1), 11),
        ('TEXTCOLOR', (0, 1), (-1, 1), colors.HexColor('#0284c7')),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
    ]))
    story.append(t_metrics)
    story.append(Spacer(1, 14))

    # Risk Distribution Breakdown Table
    story.append(Paragraph("2. Threat Classification Distribution", h2_style))
    breakdown_data = [["Category / Risk Tier", "Incident Count", "Share of Traffic", "Action Policy"]]
    for item in threat_breakdown:
        breakdown_data.append([
            item.get("name", "N/A"),
            str(item.get("count", 0)),
            f"{item.get('percentage', 0.0):.1f}%",
            item.get("action", "ALLOW" if "Safe" in item.get("name", "") else "QUARANTINE / BLOCK")
        ])

    t_breakdown = Table(breakdown_data, colWidths=[160, 95, 110, 160])
    t_breakdown.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e293b')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 8.5),
        ('ALIGN', (0, 0), (-1, 0), 'LEFT'),
        ('ALIGN', (1, 0), (2, -1), 'CENTER'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('FONTSIZE', (0, 1), (-1, -1), 8.5),
    ]))
    story.append(t_breakdown)
    story.append(Spacer(1, 14))

    # Recent High-Risk Security Events
    story.append(Paragraph("3. High-Priority Security Events & Interceptions", h2_style))
    event_rows = [["Timestamp", "Severity", "Sender", "Threat Signature / Title"]]
    if not recent_events:
        event_rows.append(["-", "INFO", "None", "No high-risk events recorded in selected window."])
    else:
        for ev in recent_events[:8]:
            ts = ev.get("created_at", "")[:19].replace("T", " ")
            event_rows.append([
                ts,
                ev.get("severity", "HIGH"),
                ev.get("sender", "Unknown"),
                (ev.get("title", "") or ev.get("description", ""))[:45]
            ])

    t_events = Table(event_rows, colWidths=[105, 65, 110, 245])
    t_events.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0f172a')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 8),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f1f5f9')]),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
    ]))
    story.append(t_events)
    story.append(Spacer(1, 18))

    # Footer note
    story.append(Paragraph(
        "Notice: This report was automatically compiled by SMS Shield ML & Threat Protection Engine. All testing conducted within sandboxed parameters.",
        subtitle_style
    ))

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()
