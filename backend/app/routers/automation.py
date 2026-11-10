import datetime
import random
import re
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Recipient, ConsentRecord, MessageTemplate, AutomationJob, AuditLog
from app.schemas import (
    RecipientCreate, RecipientOut, RecipientVerifyRequest, ConsentUpdate,
    MessageTemplateCreate, MessageTemplateOut, UnicodeInspectRequest, UnicodeInspectResponse,
    AutomationJobCreate, AutomationJobOut
)
from app.utils.sms_counter import calculate_sms_segments
from app.scheduler.job_runner import job_scheduler

router = APIRouter(prefix="/automation", tags=["SMS Automation Center"])

# E.164 phone regex e.g. +8801712345678 or +12025550143
PHONE_REGEX = re.compile(r'^\+[1-9]\d{6,14}$')

# ================= RECIPIENTS =================
@router.get("/recipients", response_model=List[RecipientOut])
def get_recipients(db: Session = Depends(get_db)):
    return db.query(Recipient).order_by(Recipient.created_at.desc()).all()

@router.post("/recipients", response_model=RecipientOut)
def add_recipient(payload: RecipientCreate, db: Session = Depends(get_db)):
    cleaned_phone = payload.phone_number.strip().replace(" ", "").replace("-", "")
    if not PHONE_REGEX.match(cleaned_phone):
        raise HTTPException(
            status_code=400,
            detail="Invalid phone number. Must follow international E.164 standard (e.g., +8801712345678 or +12025550143)."
        )

    existing = db.query(Recipient).filter(Recipient.phone_number == cleaned_phone).first()
    if existing:
        raise HTTPException(status_code=400, detail="Recipient phone number already registered.")

    # Generate 6-digit OTP verification token
    verification_code = f"{random.randint(100000, 999999)}"
    now = datetime.datetime.now(datetime.timezone.utc)
    expires = now + datetime.timedelta(minutes=15)

    recipient = Recipient(
        phone_number=cleaned_phone,
        name=payload.name,
        verification_status="unverified",
        verification_code=verification_code,
        verification_expires_at=expires,
        consent_status="PENDING",
        preferred_language=payload.preferred_language,
        notes=payload.notes,
        created_at=now
    )
    db.add(recipient)
    db.commit()
    db.refresh(recipient)

    # Record consent initiation
    consent_record = ConsentRecord(
        recipient_id=recipient.id,
        action="VERIFICATION_CODE_ISSUED",
        details=f"Verification code issued (Code: {verification_code} for authorized verification)",
        timestamp=now
    )
    db.add(consent_record)
    db.commit()

    return recipient

@router.post("/recipients/{recipient_id}/verify", response_model=RecipientOut)
def verify_recipient(recipient_id: int, payload: RecipientVerifyRequest, db: Session = Depends(get_db)):
    recipient = db.query(Recipient).filter(Recipient.id == recipient_id).first()
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found.")

    if recipient.verification_code != payload.code.strip():
        raise HTTPException(status_code=400, detail="Invalid verification code.")

    now = datetime.datetime.now(datetime.timezone.utc)
    recipient.verification_status = "verified"
    recipient.consent_status = "OPTED_IN"
    recipient.consent_date = now

    consent_record = ConsentRecord(
        recipient_id=recipient.id,
        action="CONSENT_CONFIRMED_VIA_OTP",
        details="Recipient successfully verified phone ownership via OTP token.",
        timestamp=now
    )
    db.add(consent_record)
    db.commit()
    db.refresh(recipient)
    return recipient

@router.post("/recipients/{recipient_id}/consent", response_model=RecipientOut)
def update_recipient_consent(recipient_id: int, payload: ConsentUpdate, db: Session = Depends(get_db)):
    recipient = db.query(Recipient).filter(Recipient.id == recipient_id).first()
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found.")

    now = datetime.datetime.now(datetime.timezone.utc)
    recipient.consent_status = payload.consent_status.upper()
    if recipient.consent_status == "OPTED_IN":
        recipient.consent_date = now
    elif recipient.consent_status == "REVOKED":
        recipient.opt_out_date = now

    consent_record = ConsentRecord(
        recipient_id=recipient.id,
        action=f"CONSENT_CHANGED_TO_{recipient.consent_status}",
        method=payload.method or "ADMIN_CONSOLE",
        details=f"Consent status manually updated to {recipient.consent_status}.",
        timestamp=now
    )
    db.add(consent_record)
    db.commit()
    db.refresh(recipient)
    return recipient

@router.delete("/recipients/{recipient_id}")
def delete_recipient(recipient_id: int, db: Session = Depends(get_db)):
    recipient = db.query(Recipient).filter(Recipient.id == recipient_id).first()
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found.")
    db.delete(recipient)
    db.commit()
    return {"status": "deleted", "id": recipient_id}

# ================= TEMPLATES & UNICODE =================
@router.get("/templates", response_model=List[MessageTemplateOut])
def get_templates(db: Session = Depends(get_db)):
    return db.query(MessageTemplate).order_by(MessageTemplate.created_at.desc()).all()

@router.post("/templates", response_model=MessageTemplateOut)
def create_template(payload: MessageTemplateCreate, db: Session = Depends(get_db)):
    existing = db.query(MessageTemplate).filter(MessageTemplate.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="A template with this name already exists.")

    segments_info = calculate_sms_segments(payload.content)
    now = datetime.datetime.now(datetime.timezone.utc)

    template = MessageTemplate(
        name=payload.name,
        content=payload.content,
        category=payload.category,
        is_unicode=segments_info["is_unicode"],
        char_count=segments_info["char_count"],
        segment_count=segments_info["segment_count"],
        created_at=now,
        updated_at=now
    )
    db.add(template)
    db.commit()
    db.refresh(template)
    return template

@router.post("/templates/inspect-unicode", response_model=UnicodeInspectResponse)
def inspect_unicode_content(payload: UnicodeInspectRequest):
    info = calculate_sms_segments(payload.text)
    return UnicodeInspectResponse(**info)

@router.delete("/templates/{template_id}")
def delete_template(template_id: int, db: Session = Depends(get_db)):
    template = db.query(MessageTemplate).filter(MessageTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found.")
    db.delete(template)
    db.commit()
    return {"status": "deleted", "id": template_id}

# ================= AUTOMATION JOBS =================
@router.get("/jobs", response_model=List[AutomationJobOut])
def get_jobs(db: Session = Depends(get_db)):
    return db.query(AutomationJob).order_by(AutomationJob.created_at.desc()).all()

@router.post("/jobs", response_model=AutomationJobOut)
def create_automation_job(payload: AutomationJobCreate, db: Session = Depends(get_db)):
    recipient = db.query(Recipient).filter(Recipient.id == payload.recipient_id).first()
    if not recipient:
        raise HTTPException(status_code=400, detail="Invalid recipient ID.")

    if recipient.consent_status != "OPTED_IN":
        raise HTTPException(
            status_code=400,
            detail=f"Cannot schedule automation for recipient without verified consent (Status: {recipient.consent_status})."
        )

    now = datetime.datetime.now(datetime.timezone.utc)
    job = AutomationJob(
        name=payload.name,
        recipient_id=payload.recipient_id,
        template_id=payload.template_id,
        custom_message=payload.custom_message,
        target_count=payload.target_count,
        sent_count=0,
        failed_count=0,
        interval_seconds=payload.interval_seconds,
        status="PENDING",
        execution_mode=payload.execution_mode,
        provider_rate_limit_per_min=payload.provider_rate_limit_per_min,
        scheduled_at=payload.scheduled_at or now,
        created_at=now
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    audit = AuditLog(
        action="JOB_CREATED",
        resource_type="AutomationJob",
        resource_id=str(job.id),
        details=f"Automation job '{job.name}' created for {recipient.phone_number} (Target: {job.target_count} SMS, Mode: {job.execution_mode})."
    )
    db.add(audit)
    db.commit()

    return job

@router.post("/jobs/{job_id}/start")
def start_job(job_id: int, db: Session = Depends(get_db)):
    success = job_scheduler.start_job(db, job_id)
    if not success:
        raise HTTPException(status_code=400, detail="Unable to start job. Check job state or emergency lockdown mode.")
    return {"status": "started", "job_id": job_id}

@router.post("/jobs/{job_id}/pause")
def pause_job(job_id: int, db: Session = Depends(get_db)):
    success = job_scheduler.pause_job(db, job_id)
    if not success:
        raise HTTPException(status_code=400, detail="Unable to pause job.")
    return {"status": "paused", "job_id": job_id}

@router.post("/jobs/{job_id}/resume")
def resume_job(job_id: int, db: Session = Depends(get_db)):
    success = job_scheduler.resume_job(db, job_id)
    if not success:
        raise HTTPException(status_code=400, detail="Unable to resume job.")
    return {"status": "resumed", "job_id": job_id}

@router.post("/jobs/{job_id}/cancel")
def cancel_job(job_id: int, db: Session = Depends(get_db)):
    success = job_scheduler.cancel_job(db, job_id)
    if not success:
        raise HTTPException(status_code=400, detail="Unable to cancel job.")
    return {"status": "cancelled", "job_id": job_id}
