from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import SecurityEvent, Message
from app.schemas import SecurityEventOut, MessageOut, DetectionResultOut

router = APIRouter(prefix="/threats", tags=["Threat Monitoring"])

@router.get("/events", response_model=List[SecurityEventOut])
def get_threat_events(
    severity: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    query = db.query(SecurityEvent).order_by(SecurityEvent.created_at.desc())
    if severity and severity != "ALL":
        query = query.filter(SecurityEvent.severity == severity.upper())
    if search:
        query = query.filter(
            (SecurityEvent.title.ilike(f"%{search}%")) |
            (SecurityEvent.description.ilike(f"%{search}%")) |
            (SecurityEvent.sender.ilike(f"%{search}%"))
        )
    return query.limit(limit).all()

@router.get("/live-feed", response_model=List[MessageOut])
def get_live_threat_feed(limit: int = 15, db: Session = Depends(get_db)):
    """Returns high-risk and phishing messages for the live real-time monitoring feed."""
    threat_messages = db.query(Message).filter(Message.risk_score >= 40.0).order_by(Message.created_at.desc()).limit(limit).all()
    out = []
    for msg in threat_messages:
        res = msg.detection_result
        det_out = None
        if res:
            det_out = DetectionResultOut(
                id=res.id,
                message_id=msg.id,
                sender=msg.raw_sender,
                content=msg.content,
                layer1_score=res.layer1_score,
                layer2_score=res.layer2_score,
                layer3_score=res.layer3_score,
                composite_score=res.composite_score,
                risk_level=res.risk_level,
                matched_rules=res.matched_rules or [],
                statistical_flags=res.statistical_flags or [],
                ml_model_name=res.ml_model_name,
                ml_confidence=res.ml_confidence,
                recommended_action=res.recommended_action,
                processing_time_ms=res.processing_time_ms,
                created_at=res.created_at
            )
        out.append(MessageOut(
            id=msg.id,
            raw_sender=msg.raw_sender,
            content=msg.content,
            status=msg.status,
            risk_score=msg.risk_score,
            created_at=msg.created_at,
            detection_result=det_out
        ))
    return out

@router.delete("/events")
def clear_events(db: Session = Depends(get_db)):
    deleted_count = db.query(SecurityEvent).delete()
    db.commit()
    return {"status": "cleared", "deleted_count": deleted_count}
