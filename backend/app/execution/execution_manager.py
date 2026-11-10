import datetime
from typing import Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session

from app.models import (
    Recipient, AutomationJob, AutomationExecution, DeliveryEvent,
    AuditLog, SystemSetting, SecurityEvent
)
from app.execution.mock_gateway import mock_gateway
from app.execution.provider_sandbox import provider_sandbox
from app.execution.live_adapter import live_adapter
from app.execution.base_adapter import DeliveryResult

class ExecutionManager:
    """Central Automation Dispatcher with Strict Compliance & Emergency Gates"""

    def is_emergency_mode_active(self, db: Session) -> bool:
        setting = db.query(SystemSetting).filter(SystemSetting.key == "emergency_lockdown_mode").first()
        return setting.value.lower() == "true" if setting else False

    def execute_job_tick(self, db: Session, job_id: int) -> Tuple[bool, str]:
        job = db.query(AutomationJob).filter(AutomationJob.id == job_id).first()
        if not job:
            return False, "Job not found"

        # 1. Gate: Emergency Mode Verification
        if self.is_emergency_mode_active(db):
            job.status = "PAUSED"
            db.commit()
            
            # Log security event
            sec_ev = SecurityEvent(
                event_type="EMERGENCY_DISPATCH_HALTED",
                severity="CRITICAL",
                title=f"Outbound Delivery Blocked: Job {job.name}",
                description="Emergency Lockdown posture active. Suspended outbound SMS transmission.",
                sender="SYSTEM",
                metadata_json={"job_id": job.id}
            )
            db.add(sec_ev)
            db.commit()
            return False, "Emergency Lockdown is active. Outbound delivery suspended."

        # 2. Gate: Job Status
        if job.status not in ["RUNNING", "PENDING"]:
            return False, f"Job is in '{job.status}' state and not eligible for dispatch."

        # 3. Gate: Target Count Reached
        if job.sent_count >= job.target_count:
            job.status = "COMPLETED"
            db.commit()
            return True, "Job already reached permitted target quota."

        # 4. Gate: Recipient Verification & Consent
        recipient = db.query(Recipient).filter(Recipient.id == job.recipient_id).first()
        if not recipient:
            job.status = "FAILED"
            db.commit()
            return False, "Target recipient does not exist."

        if recipient.consent_status != "OPTED_IN":
            job.status = "FAILED"
            db.commit()
            audit = AuditLog(
                user_email=job.created_by,
                action="CONSENT_VIOLATION_BLOCKED",
                resource_type="AutomationJob",
                resource_id=str(job.id),
                details=f"Attempted dispatch to recipient without consent: {recipient.phone_number} (Status: {recipient.consent_status})"
            )
            db.add(audit)
            db.commit()
            return False, f"Delivery rejected: Recipient consent status is '{recipient.consent_status}'."

        # 5. Resolve Content
        content = job.custom_message
        if not content and job.template_rel:
            content = job.template_rel.content
        if not content:
            content = "Authorized SMS notification from SMS Shield Pro."

        # 6. Select Adapter
        if job.execution_mode == "PROVIDER_SANDBOX":
            adapter = provider_sandbox
        elif job.execution_mode == "AUTHORIZED_LIVE":
            adapter = live_adapter
        else:
            adapter = mock_gateway

        # 7. Execute Dispatch
        res: DeliveryResult = adapter.send(recipient.phone_number, content)

        now = datetime.datetime.now(datetime.timezone.utc)

        # 8. Record Delivery Event
        event = DeliveryEvent(
            job_id=job.id,
            recipient_phone=recipient.phone_number,
            message_content=content,
            provider_message_id=res.provider_message_id,
            delivery_status=res.status,
            provider_name=res.provider_name,
            is_simulated=res.is_simulated,
            cost_usd=res.cost_usd,
            error_code=res.error_message,
            timestamp=now
        )
        db.add(event)

        # 9. Record Automation Execution Record
        execution = AutomationExecution(
            job_id=job.id,
            execution_number=job.sent_count + 1,
            status="SUCCESS" if res.success else "FAILED",
            provider_message_id=res.provider_message_id,
            latency_ms=res.latency_ms,
            error_message=res.error_message,
            executed_at=now
        )
        db.add(execution)

        # 10. Update Job State
        if res.success:
            job.sent_count += 1
        else:
            job.failed_count += 1

        job.last_run_at = now

        if job.sent_count >= job.target_count:
            job.status = "COMPLETED"
            job.next_run_at = None
        else:
            job.status = "RUNNING"
            job.next_run_at = now + datetime.timedelta(seconds=job.interval_seconds)

        db.commit()
        db.refresh(job)

        return res.success, f"Dispatched via {res.provider_name}. Message ID: {res.provider_message_id}"

execution_manager = ExecutionManager()
