from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import TestSession, Message
from app.schemas import (
    SimulationStartRequest, SimulationSessionOut, MessageOut, DetectionResultOut
)
from app.simulation.simulator import simulation_engine, SCENARIO_TEMPLATES

router = APIRouter(prefix="/simulation", tags=["SMS Testing Lab"])

@router.get("/scenarios")
def get_scenarios():
    return [
        {
            "id": "mixed",
            "name": "Composite Enterprise Threat Mix",
            "description": "Realistic blend of normal communication, banking phishing, courier scams, and rapid spam.",
            "sample_count": len(SCENARIO_TEMPLATES["normal"]) + len(SCENARIO_TEMPLATES["bank_phishing"])
        },
        {
            "id": "bank_phishing",
            "name": "Financial Credential & Account Lockdown Phishing",
            "description": "High-urgency bank impersonation targeting Chase, Wells Fargo, BofA, and Citibank accounts.",
            "sample_count": len(SCENARIO_TEMPLATES["bank_phishing"])
        },
        {
            "id": "delivery_scam",
            "name": "Parcel Courier & Redelivery Fee Phishing",
            "description": "USPS, FedEx, and UPS tracking notices with fraudulent payment or address update links.",
            "sample_count": len(SCENARIO_TEMPLATES["delivery_scam"])
        },
        {
            "id": "urgent_wire",
            "name": "Emergency Wire, Crypto & Tax Solicitations",
            "description": "IRS legal threats, family emergencies, and cryptocurrency giveaway solicitations.",
            "sample_count": len(SCENARIO_TEMPLATES["urgent_wire"])
        },
        {
            "id": "bulk_burst",
            "name": "High-Velocity Duplicate Flooding (Rate Limit Test)",
            "description": "Bursts of identical loan spam from single sender to verify velocity throttling and duplicate filters.",
            "sample_count": len(SCENARIO_TEMPLATES["bulk_burst"])
        },
        {
            "id": "normal",
            "name": "Benign / Normal Everyday SMS Traffic",
            "description": "Legitimate two-factor OTP codes, appointment reminders, flight updates, and conversational text.",
            "sample_count": len(SCENARIO_TEMPLATES["normal"])
        }
    ]

@router.post("/start", response_model=SimulationSessionOut)
def start_simulation(payload: SimulationStartRequest, db: Session = Depends(get_db)):
    session = simulation_engine.run_simulation(
        db=db,
        name=payload.name,
        scenario=payload.scenario,
        count=payload.message_count,
        frequency_per_sec=payload.frequency_per_sec
    )
    return session

@router.get("/sessions", response_model=List[SimulationSessionOut])
def get_simulation_sessions(limit: int = 20, db: Session = Depends(get_db)):
    return db.query(TestSession).order_by(TestSession.created_at.desc()).limit(limit).all()

@router.get("/sessions/{session_id}", response_model=SimulationSessionOut)
def get_session_details(session_id: int, db: Session = Depends(get_db)):
    session = db.query(TestSession).filter(TestSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@router.get("/sessions/{session_id}/messages", response_model=List[MessageOut])
def get_session_messages(session_id: int, db: Session = Depends(get_db)):
    messages = db.query(Message).filter(Message.session_id == session_id).order_by(Message.created_at.desc()).all()
    out = []
    for msg in messages:
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
