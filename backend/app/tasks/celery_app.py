import os
from celery import Celery

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "sms_shield_tasks",
    broker=REDIS_URL,
    backend=REDIS_URL
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,
    task_soft_time_limit=180
)

@celery_app.task(bind=True, max_retries=3, default_retry_delay=10)
def process_scheduled_sms_job(self, job_id: int):
    """Celery background worker task for high-throughput cloud automation."""
    from app.database import SessionLocal
    from app.execution.execution_manager import execution_manager

    db = SessionLocal()
    try:
        success, msg = execution_manager.execute_job_tick(db, job_id)
        if not success:
            print(f"[Celery] Job {job_id} tick status: {msg}")
        return {"job_id": job_id, "success": success, "message": msg}
    except Exception as exc:
        print(f"[Celery] Job {job_id} failed with error: {exc}. Retrying...")
        raise self.retry(exc=exc)
    finally:
        db.close()
