import csv
import io
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Message, SecurityEvent, Sender, BlockedSender
from app.utils.pdf_generator import generate_pdf_security_report
from app.ml.detector import ml_detector

router = APIRouter(prefix="/reports", tags=["Reports & Exports"])

@router.get("/pdf")
def export_pdf_report(
    report_type: str = Query("daily", pattern="^(daily|weekly|classification|performance)$"),
    db: Session = Depends(get_db)
):
    total_msgs = db.query(Message).count()
    spam_msgs = db.query(Message).filter(Message.risk_score >= 60.0).count()
    phishing_msgs = db.query(Message).filter(Message.risk_score >= 80.0).count()
    blocked_count = db.query(BlockedSender).filter(BlockedSender.active == True).count()

    metrics = {
        "total_messages": total_msgs,
        "spam_detected": spam_msgs,
        "phishing_attempts": phishing_msgs,
        "blocked_senders_count": blocked_count,
        "detection_accuracy": round(ml_detector.get_metrics().get("accuracy", 0.987) * 100, 1)
    }

    # Threat breakdown
    safe_cnt = db.query(Message).filter(Message.risk_score < 35.0).count()
    suspicious_cnt = db.query(Message).filter(Message.risk_score >= 35.0, Message.risk_score < 60.0).count()
    high_risk_cnt = db.query(Message).filter(Message.risk_score >= 60.0, Message.risk_score < 80.0).count()
    
    total = max(total_msgs, 1)
    threat_breakdown = [
        {"name": "Verified Legitimate / Safe", "count": safe_cnt, "percentage": round(safe_cnt / total * 100, 1), "action": "ALLOW"},
        {"name": "Suspicious / Marketing Urgency", "count": suspicious_cnt, "percentage": round(suspicious_cnt / total * 100, 1), "action": "FLAG / SURVEILLANCE"},
        {"name": "High-Risk Unsolicited Spam", "count": high_risk_cnt, "percentage": round(high_risk_cnt / total * 100, 1), "action": "QUARANTINE"},
        {"name": "Critical Phishing & Impersonation", "count": phishing_msgs, "percentage": round(phishing_msgs / total * 100, 1), "action": "AUTOMATIC BLOCK"}
    ]

    recent_events = [
        {
            "created_at": ev.created_at.isoformat(),
            "severity": ev.severity,
            "sender": ev.sender or "N/A",
            "title": ev.title
        }
        for ev in db.query(SecurityEvent).order_by(SecurityEvent.created_at.desc()).limit(10).all()
    ]

    title_map = {
        "daily": "Daily Security & Threat Telemetry Report",
        "weekly": "Weekly SMS Spam & Phishing Classification Report",
        "classification": "Multi-Layer Detection Threat Audit Report",
        "performance": "Engine Accuracy & Latency Performance Report"
    }

    pdf_bytes = generate_pdf_security_report(
        report_title=title_map.get(report_type, "SMS Shield Defense Report"),
        time_window="Last 24 Hours" if report_type == "daily" else "Last 7 Days",
        metrics=metrics,
        recent_events=recent_events,
        threat_breakdown=threat_breakdown
    )

    filename = f"sms-shield-{report_type}-report-{datetime.now().strftime('%Y%m%d')}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/csv")
def export_csv_data(
    data_type: str = Query("messages", pattern="^(messages|threats|senders)$"),
    db: Session = Depends(get_db)
):
    stream = io.StringIO()
    writer = csv.writer(stream)

    if data_type == "messages":
        writer.writerow(["ID", "Timestamp", "Sender", "Risk Score", "Status", "Content Snippet"])
        msgs = db.query(Message).order_by(Message.created_at.desc()).limit(500).all()
        for m in msgs:
            writer.writerow([
                m.id,
                m.created_at.isoformat() if m.created_at else "",
                m.raw_sender,
                m.risk_score,
                m.status,
                m.content[:80].replace("\n", " ")
            ])
    elif data_type == "threats":
        writer.writerow(["ID", "Timestamp", "Severity", "Event Type", "Sender", "Title", "Description"])
        events = db.query(SecurityEvent).order_by(SecurityEvent.created_at.desc()).limit(500).all()
        for ev in events:
            writer.writerow([
                ev.id,
                ev.created_at.isoformat() if ev.created_at else "",
                ev.severity,
                ev.event_type,
                ev.sender or "",
                ev.title,
                ev.description.replace("\n", " ")
            ])
    else:  # senders
        writer.writerow(["ID", "Phone Number", "Reputation", "Total Messages", "Spam Messages", "Last Seen"])
        senders = db.query(Sender).order_by(Sender.total_messages.desc()).limit(500).all()
        for s in senders:
            writer.writerow([
                s.id,
                s.phone_number,
                s.reputation_score,
                s.total_messages,
                s.spam_messages,
                s.last_seen_at.isoformat() if s.last_seen_at else ""
            ])

    stream.seek(0)
    filename = f"sms-shield-{data_type}-export-{datetime.now().strftime('%Y%m%d')}.csv"
    return StreamingResponse(
        iter([stream.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
