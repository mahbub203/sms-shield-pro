from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import AutomationJob, DeliveryEvent, SystemSetting
from app.schemas import AutomationStatsOut, DeliveryEventOut
from app.scheduler.job_runner import job_scheduler

router = APIRouter(prefix="/scheduler", tags=["Automation Scheduler & Telemetry"])

@router.get("/stats", response_model=AutomationStatsOut)
def get_automation_stats(db: Session = Depends(get_db)):
    total_jobs = db.query(AutomationJob).count()
    active_jobs = db.query(AutomationJob).filter(AutomationJob.status == "RUNNING").count()
    completed_jobs = db.query(AutomationJob).filter(AutomationJob.status == "COMPLETED").count()
    paused_jobs = db.query(AutomationJob).filter(AutomationJob.status == "PAUSED").count()
    failed_jobs = db.query(AutomationJob).filter(AutomationJob.status == "FAILED").count()

    simulated_delivered = db.query(DeliveryEvent).filter(DeliveryEvent.delivery_status == "SIMULATED_DELIVERED").count()
    provider_confirmed = db.query(DeliveryEvent).filter(DeliveryEvent.delivery_status == "PROVIDER_CONFIRMED").count()
    failures = db.query(DeliveryEvent).filter(DeliveryEvent.delivery_status.in_(["FAILED", "UNDELIVERED"])).count()

    last_event = db.query(DeliveryEvent).order_by(DeliveryEvent.timestamp.desc()).first()

    emergency_setting = db.query(SystemSetting).filter(SystemSetting.key == "emergency_lockdown_mode").first()
    emergency_active = emergency_setting.value.lower() == "true" if emergency_setting else False

    return AutomationStatsOut(
        total_jobs=total_jobs,
        active_jobs=active_jobs,
        completed_jobs=completed_jobs,
        paused_jobs=paused_jobs,
        failed_jobs=failed_jobs,
        total_simulated_delivered=simulated_delivered,
        total_provider_confirmed=provider_confirmed,
        total_delivery_failures=failures,
        last_execution_time=last_event.timestamp if last_event else None,
        worker_status=job_scheduler.worker_status,
        emergency_lockdown_active=emergency_active
    )

@router.get("/deliveries", response_model=List[DeliveryEventOut])
def get_deliveries(
    limit: int = Query(50, ge=1, le=200),
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(DeliveryEvent).order_by(DeliveryEvent.timestamp.desc())
    if status and status != "ALL":
        query = query.filter(DeliveryEvent.delivery_status == status)
    return query.limit(limit).all()
