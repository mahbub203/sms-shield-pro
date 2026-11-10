import threading
import time
import datetime
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import AutomationJob, AuditLog
from app.execution.execution_manager import execution_manager

class BackgroundJobScheduler:
    def __init__(self):
        self._running = False
        self._thread = None
        self.worker_status = "INITIALIZING"

    def start(self):
        if self._running:
            return
        self._running = True
        self.worker_status = "HEALTHY_ACTIVE"
        self._thread = threading.Thread(target=self._loop, daemon=True)
        self._thread.start()
        print("[Scheduler] Automation background worker daemon started.")

    def stop(self):
        self._running = False
        self.worker_status = "STOPPED"

    def _loop(self):
        while self._running:
            try:
                self._check_and_execute_due_jobs()
            except Exception as e:
                print(f"[Scheduler] Exception in scheduler loop: {e}")
            time.sleep(2.0)

    def _check_and_execute_due_jobs(self):
        db: Session = SessionLocal()
        try:
            now = datetime.datetime.now(datetime.timezone.utc)
            # Find running jobs where next_run_at has arrived
            due_jobs = db.query(AutomationJob).filter(
                AutomationJob.status == "RUNNING",
                AutomationJob.sent_count < AutomationJob.target_count
            ).all()

            for job in due_jobs:
                # Check scheduled interval
                is_due = False
                if not job.next_run_at:
                    is_due = True
                elif job.next_run_at.replace(tzinfo=datetime.timezone.utc) <= now:
                    is_due = True

                if is_due:
                    execution_manager.execute_job_tick(db, job.id)

        finally:
            db.close()

    def start_job(self, db: Session, job_id: int, user_email: str = "admin@smsshield.io") -> bool:
        job = db.query(AutomationJob).filter(AutomationJob.id == job_id).first()
        if not job or job.status in ["COMPLETED", "CANCELLED"]:
            return False

        now = datetime.datetime.now(datetime.timezone.utc)
        job.status = "RUNNING"
        job.next_run_at = now
        
        audit = AuditLog(
            user_email=user_email,
            action="JOB_STARTED",
            resource_type="AutomationJob",
            resource_id=str(job.id),
            details=f"Job '{job.name}' set to RUNNING. Pacing: {job.interval_seconds}s"
        )
        db.add(audit)
        db.commit()

        # Fire immediately on start
        execution_manager.execute_job_tick(db, job.id)
        return True

    def pause_job(self, db: Session, job_id: int, user_email: str = "admin@smsshield.io") -> bool:
        job = db.query(AutomationJob).filter(AutomationJob.id == job_id).first()
        if not job or job.status != "RUNNING":
            return False

        job.status = "PAUSED"
        audit = AuditLog(
            user_email=user_email,
            action="JOB_PAUSED",
            resource_type="AutomationJob",
            resource_id=str(job.id),
            details=f"Job '{job.name}' PAUSED by operator."
        )
        db.add(audit)
        db.commit()
        return True

    def resume_job(self, db: Session, job_id: int, user_email: str = "admin@smsshield.io") -> bool:
        job = db.query(AutomationJob).filter(AutomationJob.id == job_id).first()
        if not job or job.status != "PAUSED":
            return False

        now = datetime.datetime.now(datetime.timezone.utc)
        job.status = "RUNNING"
        job.next_run_at = now
        audit = AuditLog(
            user_email=user_email,
            action="JOB_RESUMED",
            resource_type="AutomationJob",
            resource_id=str(job.id),
            details=f"Job '{job.name}' RESUMED."
        )
        db.add(audit)
        db.commit()
        return True

    def cancel_job(self, db: Session, job_id: int, user_email: str = "admin@smsshield.io") -> bool:
        job = db.query(AutomationJob).filter(AutomationJob.id == job_id).first()
        if not job:
            return False

        job.status = "CANCELLED"
        audit = AuditLog(
            user_email=user_email,
            action="JOB_CANCELLED",
            resource_type="AutomationJob",
            resource_id=str(job.id),
            details=f"Job '{job.name}' CANCELLED."
        )
        db.add(audit)
        db.commit()
        return True

job_scheduler = BackgroundJobScheduler()
