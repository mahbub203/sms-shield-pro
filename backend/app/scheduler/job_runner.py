import threading
import time
import datetime
import collections
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import AutomationJob, AuditLog
from app.execution.execution_manager import execution_manager

class BackgroundJobScheduler:
    def __init__(self):
        self._running = False
        self._paused = False
        self._thread = None
        self.worker_status = "INITIALIZING"
        self.start_time = datetime.datetime.now(datetime.timezone.utc)
        self.total_ticks_executed = 0
        self._recent_ticks = collections.deque(maxlen=2000)
        self._lock = threading.Lock()

    def start(self):
        with self._lock:
            if self._running:
                return
            self._running = True
            self._paused = False
            self.worker_status = "HEALTHY_ACTIVE"
            self.start_time = datetime.datetime.now(datetime.timezone.utc)
            self._thread = threading.Thread(target=self._loop, daemon=True, name="SMSShieldWorkerThread")
            self._thread.start()
            print("[Scheduler] Automation background worker daemon started.")

    def stop(self):
        with self._lock:
            self._running = False
            self.worker_status = "STOPPED"

    def pause_worker(self):
        with self._lock:
            self._paused = True
            self.worker_status = "PAUSED"

    def resume_worker(self):
        with self._lock:
            self._paused = False
            self.worker_status = "HEALTHY_ACTIVE"

    def restart_worker(self):
        self.stop()
        time.sleep(0.3)
        self.start()

    def _loop(self):
        while self._running:
            try:
                if not self._paused:
                    self._check_and_execute_due_jobs()
            except Exception as e:
                print(f"[Scheduler] Exception in scheduler loop: {e}")
            time.sleep(0.2)

    def _check_and_execute_due_jobs(self):
        db: Session = SessionLocal()
        try:
            now = datetime.datetime.now(datetime.timezone.utc)
            # Find running jobs where target has not been reached
            due_jobs = db.query(AutomationJob).filter(
                AutomationJob.status == "RUNNING",
                AutomationJob.sent_count < AutomationJob.target_count
            ).all()

            for job in due_jobs:
                is_due = False
                if not job.next_run_at:
                    is_due = True
                elif job.next_run_at.replace(tzinfo=datetime.timezone.utc) <= now:
                    is_due = True

                if is_due:
                    # Execute primary tick
                    success, msg = execution_manager.execute_job_tick(db, job.id)
                    now_ts = time.time()
                    self._recent_ticks.append(now_ts)
                    self.total_ticks_executed += 1

                    # High-frequency simulation burst: if interval <= 0.2s and simulated mode, process extra ticks
                    if (
                        job.execution_mode in ["SIMULATION_ENGINE", "MOCK_GATEWAY"]
                        and job.interval_seconds <= 0.25
                        and job.status == "RUNNING"
                        and job.sent_count < job.target_count
                    ):
                        burst_count = min(4, job.target_count - job.sent_count)
                        for _ in range(burst_count):
                            execution_manager.execute_job_tick(db, job.id)
                            self._recent_ticks.append(time.time())
                            self.total_ticks_executed += 1
        finally:
            db.close()

    def get_throughput(self) -> float:
        now_ts = time.time()
        window_seconds = 5.0
        recent = [t for t in self._recent_ticks if (now_ts - t) <= window_seconds]
        if not recent:
            return 0.0
        return round(len(recent) / window_seconds, 1)

    def get_worker_health(self, db: Session) -> Dict[str, Any]:
        now = datetime.datetime.now(datetime.timezone.utc)
        uptime = round((now - self.start_time).total_seconds(), 1)
        active_jobs = db.query(AutomationJob).filter(AutomationJob.status == "RUNNING").count()
        queue_depth = db.query(AutomationJob).filter(AutomationJob.status.in_(["RUNNING", "PENDING"])).count()
        is_alive = self._thread.is_alive() if self._thread else False

        return {
            "status": self.worker_status,
            "uptime_seconds": uptime,
            "total_ticks_executed": self.total_ticks_executed,
            "current_throughput_per_sec": self.get_throughput(),
            "active_jobs_count": active_jobs,
            "is_thread_alive": is_alive,
            "queue_depth": queue_depth
        }

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
        self._recent_ticks.append(time.time())
        self.total_ticks_executed += 1
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

    def stop_job(self, db: Session, job_id: int, user_email: str = "admin@smsshield.io") -> bool:
        return self.cancel_job(db, job_id, user_email)

    def cancel_job(self, db: Session, job_id: int, user_email: str = "admin@smsshield.io") -> bool:
        job = db.query(AutomationJob).filter(AutomationJob.id == job_id).first()
        if not job:
            return False

        job.status = "CANCELLED"
        job.next_run_at = None
        audit = AuditLog(
            user_email=user_email,
            action="JOB_CANCELLED",
            resource_type="AutomationJob",
            resource_id=str(job.id),
            details=f"Job '{job.name}' STOPPED/CANCELLED by operator."
        )
        db.add(audit)
        db.commit()
        return True

job_scheduler = BackgroundJobScheduler()
