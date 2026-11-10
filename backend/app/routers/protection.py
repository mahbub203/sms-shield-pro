from datetime import datetime, timedelta, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import BlockedSender, AllowedSender, SystemSetting, SecurityEvent
from app.schemas import (
    BlocklistCreate, BlocklistOut, AllowlistCreate, AllowlistOut
)

router = APIRouter(prefix="/protection", tags=["Protection Center"])

@router.get("/status")
def get_protection_status(db: Session = Depends(get_db)):
    em_setting = db.query(SystemSetting).filter(SystemSetting.key == "emergency_lockdown_mode").first()
    emergency_active = em_setting.value.lower() == "true" if em_setting else False
    
    blocked_count = db.query(BlockedSender).filter(BlockedSender.active == True).count()
    allowed_count = db.query(AllowedSender).filter(AllowedSender.active == True).count()

    rate_limit = db.query(SystemSetting).filter(SystemSetting.key == "rate_limit_per_minute").first()
    rate_val = int(rate_limit.value) if rate_limit else 5

    return {
        "emergency_lockdown_mode": emergency_active,
        "active_blocklist_count": blocked_count,
        "active_allowlist_count": allowed_count,
        "rate_limit_per_minute": rate_val,
        "protection_status": "LOCKED_DOWN" if emergency_active else "ACTIVE_DEFENSE",
        "last_policy_sync": datetime.now(timezone.utc).isoformat()
    }

@router.post("/emergency-mode")
def toggle_emergency_mode(
    enabled: bool = Body(..., embed=True),
    db: Session = Depends(get_db)
):
    setting = db.query(SystemSetting).filter(SystemSetting.key == "emergency_lockdown_mode").first()
    if not setting:
        setting = SystemSetting(
            key="emergency_lockdown_mode",
            value="true" if enabled else "false",
            description="Emergency Lockdown Mode"
        )
        db.add(setting)
    else:
        setting.value = "true" if enabled else "false"

    # Log security event
    event = SecurityEvent(
        event_type="EMERGENCY_MODE_TOGGLED",
        severity="CRITICAL" if enabled else "MEDIUM",
        title=f"Emergency Lockdown {'ACTIVATED' if enabled else 'DEACTIVATED'}",
        description=f"Administrator toggled emergency lockdown posture to {enabled}. All unknown traffic {'will be strictly intercepted' if enabled else 'returned to standard multi-layer filtering'}.",
        sender="SYSTEM",
        metadata_json={"enabled": enabled}
    )
    db.add(event)
    db.commit()

    return {"emergency_lockdown_mode": enabled, "status": "updated"}

# Blocklist Endpoints
@router.get("/blocklist", response_model=List[BlocklistOut])
def get_blocklist(db: Session = Depends(get_db)):
    return db.query(BlockedSender).filter(BlockedSender.active == True).order_by(BlockedSender.created_at.desc()).all()

@router.post("/blocklist", response_model=BlocklistOut)
def add_to_blocklist(payload: BlocklistCreate, db: Session = Depends(get_db)):
    existing = db.query(BlockedSender).filter(BlockedSender.pattern == payload.pattern).first()
    if existing:
        existing.active = True
        existing.reason = payload.reason
        db.commit()
        db.refresh(existing)
        return existing

    expires_at = None
    if payload.expires_in_hours:
        expires_at = datetime.now(timezone.utc) + timedelta(hours=payload.expires_in_hours)

    entry = BlockedSender(
        pattern=payload.pattern,
        reason=payload.reason,
        blocked_by="SecOps Admin",
        active=True,
        expires_at=expires_at
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry

@router.delete("/blocklist/{entry_id}")
def remove_from_blocklist(entry_id: int, db: Session = Depends(get_db)):
    entry = db.query(BlockedSender).filter(BlockedSender.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Blocklist entry not found")
    db.delete(entry)
    db.commit()
    return {"status": "deleted", "id": entry_id}

# Allowlist Endpoints
@router.get("/allowlist", response_model=List[AllowlistOut])
def get_allowlist(db: Session = Depends(get_db)):
    return db.query(AllowedSender).filter(AllowedSender.active == True).order_by(AllowedSender.created_at.desc()).all()

@router.post("/allowlist", response_model=AllowlistOut)
def add_to_allowlist(payload: AllowlistCreate, db: Session = Depends(get_db)):
    existing = db.query(AllowedSender).filter(AllowedSender.pattern == payload.pattern).first()
    if existing:
        existing.active = True
        existing.description = payload.description
        db.commit()
        db.refresh(existing)
        return existing

    entry = AllowedSender(
        pattern=payload.pattern,
        description=payload.description,
        added_by="SecOps Admin",
        active=True
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry

@router.delete("/allowlist/{entry_id}")
def remove_from_allowlist(entry_id: int, db: Session = Depends(get_db)):
    entry = db.query(AllowedSender).filter(AllowedSender.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Allowlist entry not found")
    db.delete(entry)
    db.commit()
    return {"status": "deleted", "id": entry_id}
