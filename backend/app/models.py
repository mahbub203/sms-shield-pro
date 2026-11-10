import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.database import Base

def utc_now():
    return datetime.datetime.now(datetime.timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="analyst", nullable=False)  # admin, analyst, viewer
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)

class Sender(Base):
    __tablename__ = "senders"

    id = Column(Integer, primary_key=True, index=True)
    phone_number = Column(String(64), unique=True, index=True, nullable=False)
    display_name = Column(String(128), nullable=True)
    country_code = Column(String(10), default="+1")
    is_shortcode = Column(Boolean, default=False)
    reputation_score = Column(Float, default=100.0)  # 0 (malicious) to 100 (trusted)
    total_messages = Column(Integer, default=0)
    spam_messages = Column(Integer, default=0)
    last_seen_at = Column(DateTime, default=utc_now)
    created_at = Column(DateTime, default=utc_now)

    messages = relationship("Message", back_populates="sender_rel")

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("senders.id"), nullable=True)
    raw_sender = Column(String(64), index=True, nullable=False)
    recipient = Column(String(64), default="+10000000000")
    content = Column(Text, nullable=False)
    content_hash = Column(String(64), index=True, nullable=True)
    status = Column(String(32), default="allowed")  # allowed, quarantined, blocked
    risk_score = Column(Float, default=0.0)
    session_id = Column(Integer, ForeignKey("test_sessions.id"), nullable=True)
    created_at = Column(DateTime, default=utc_now, index=True)

    sender_rel = relationship("Sender", back_populates="messages")
    detection_result = relationship("DetectionResult", back_populates="message", uselist=False, cascade="all, delete-orphan")
    session = relationship("TestSession", back_populates="messages")

class DetectionResult(Base):
    __tablename__ = "detection_results"

    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(Integer, ForeignKey("messages.id"), unique=True, nullable=False)
    layer1_score = Column(Float, default=0.0)  # Rule-based score
    layer2_score = Column(Float, default=0.0)  # Statistical score
    layer3_score = Column(Float, default=0.0)  # Machine learning score
    composite_score = Column(Float, default=0.0)  # Overall 0-100
    risk_level = Column(String(32), default="SAFE")  # SAFE, SUSPICIOUS, HIGH_RISK, PHISHING_THREAT
    matched_rules = Column(JSON, default=list)  # List of triggered rules
    statistical_flags = Column(JSON, default=list)  # Velocity, duplicate, entropy flags
    ml_model_name = Column(String(64), default="LogisticRegression+TFIDF")
    ml_confidence = Column(Float, default=0.0)
    recommended_action = Column(String(32), default="ALLOW")  # ALLOW, QUARANTINE, BLOCK, ALERT_ADMIN
    processing_time_ms = Column(Float, default=0.0)
    created_at = Column(DateTime, default=utc_now)

    message = relationship("Message", back_populates="detection_result")

class BlockedSender(Base):
    __tablename__ = "blocked_senders"

    id = Column(Integer, primary_key=True, index=True)
    pattern = Column(String(64), unique=True, index=True, nullable=False)
    reason = Column(String(255), default="Manual block or threat threshold breach")
    blocked_by = Column(String(128), default="System")
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)
    expires_at = Column(DateTime, nullable=True)

class AllowedSender(Base):
    __tablename__ = "allowed_senders"

    id = Column(Integer, primary_key=True, index=True)
    pattern = Column(String(64), unique=True, index=True, nullable=False)
    description = Column(String(255), default="Verified sender")
    added_by = Column(String(128), default="System")
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)

class SecurityEvent(Base):
    __tablename__ = "security_events"

    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String(64), index=True, nullable=False)
    severity = Column(String(32), default="LOW")  # LOW, MEDIUM, HIGH, CRITICAL
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    sender = Column(String(64), index=True, nullable=True)
    message_snippet = Column(String(255), nullable=True)
    metadata_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=utc_now, index=True)

class TestSession(Base):
    __tablename__ = "test_sessions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    scenario = Column(String(64), nullable=False)  # normal, bank_phishing, delivery_scam, urgent_wire, bulk_burst, mixed
    message_count = Column(Integer, default=10)
    frequency_per_sec = Column(Float, default=2.0)
    status = Column(String(32), default="idle")  # idle, running, completed, failed
    total_processed = Column(Integer, default=0)
    total_spam = Column(Integer, default=0)
    total_phishing = Column(Integer, default=0)
    total_blocked = Column(Integer, default=0)
    avg_latency_ms = Column(Float, default=0.0)
    created_at = Column(DateTime, default=utc_now)
    completed_at = Column(DateTime, nullable=True)

    messages = relationship("Message", back_populates="session")

class SystemSetting(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(64), unique=True, index=True, nullable=False)
    value = Column(String(255), nullable=False)
    description = Column(String(255), nullable=True)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

# ==================== NEW AUTOMATION & CONSENT MODELS ====================

class Recipient(Base):
    __tablename__ = "recipients"

    id = Column(Integer, primary_key=True, index=True)
    phone_number = Column(String(64), unique=True, index=True, nullable=False)
    name = Column(String(128), nullable=False)
    verification_status = Column(String(32), default="unverified")  # unverified, verified, failed
    verification_code = Column(String(16), nullable=True)
    verification_expires_at = Column(DateTime, nullable=True)
    consent_status = Column(String(32), default="PENDING")  # PENDING, OPTED_IN, REVOKED
    consent_date = Column(DateTime, nullable=True)
    consent_ip = Column(String(64), nullable=True)
    opt_out_date = Column(DateTime, nullable=True)
    preferred_language = Column(String(16), default="en")  # en, bn
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    consent_records = relationship("ConsentRecord", back_populates="recipient_rel", cascade="all, delete-orphan")
    automation_jobs = relationship("AutomationJob", back_populates="recipient_rel")

class ConsentRecord(Base):
    __tablename__ = "consent_records"

    id = Column(Integer, primary_key=True, index=True)
    recipient_id = Column(Integer, ForeignKey("recipients.id"), nullable=False)
    action = Column(String(64), nullable=False)  # CONSENT_REQUESTED, CONSENT_CONFIRMED, CONSENT_REVOKED
    ip_address = Column(String(64), default="127.0.0.1")
    method = Column(String(64), default="AUTHORIZED_OTP_VERIFICATION")
    details = Column(String(255), nullable=True)
    timestamp = Column(DateTime, default=utc_now, index=True)

    recipient_rel = relationship("Recipient", back_populates="consent_records")

class MessageTemplate(Base):
    __tablename__ = "message_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(128), unique=True, nullable=False)
    content = Column(Text, nullable=False)
    category = Column(String(64), default="TRANSACTIONAL")  # TRANSACTIONAL, NOTIFICATION, SECURITY_ALERT, OTP, BENGALI_NOTICE
    is_unicode = Column(Boolean, default=False)
    char_count = Column(Integer, default=0)
    segment_count = Column(Integer, default=1)
    created_by = Column(String(128), default="Admin")
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    automation_jobs = relationship("AutomationJob", back_populates="template_rel")

class AutomationJob(Base):
    __tablename__ = "automation_jobs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    recipient_id = Column(Integer, ForeignKey("recipients.id"), nullable=False)
    template_id = Column(Integer, ForeignKey("message_templates.id"), nullable=True)
    custom_message = Column(Text, nullable=True)
    target_count = Column(Integer, default=1)  # Strict permitted test quantity (e.g. 1 to 10)
    sent_count = Column(Integer, default=0)
    failed_count = Column(Integer, default=0)
    interval_seconds = Column(Float, default=10.0)  # Rate pacing
    status = Column(String(32), default="PENDING")  # PENDING, RUNNING, PAUSED, COMPLETED, CANCELLED, FAILED
    execution_mode = Column(String(32), default="MOCK_GATEWAY")  # MOCK_GATEWAY, PROVIDER_SANDBOX, AUTHORIZED_LIVE
    provider_rate_limit_per_min = Column(Integer, default=10)
    scheduled_at = Column(DateTime, nullable=True)
    last_run_at = Column(DateTime, nullable=True)
    next_run_at = Column(DateTime, nullable=True)
    created_by = Column(String(128), default="SecOps Admin")
    created_at = Column(DateTime, default=utc_now)

    recipient_rel = relationship("Recipient", back_populates="automation_jobs")
    template_rel = relationship("MessageTemplate", back_populates="automation_jobs")
    executions = relationship("AutomationExecution", back_populates="job_rel", cascade="all, delete-orphan")
    deliveries = relationship("DeliveryEvent", back_populates="job_rel")

class AutomationExecution(Base):
    __tablename__ = "automation_executions"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("automation_jobs.id"), nullable=False)
    execution_number = Column(Integer, default=1)
    status = Column(String(32), default="SUCCESS")  # SUCCESS, FAILED, RATE_LIMITED, EMERGENCY_BLOCKED
    provider_message_id = Column(String(128), nullable=True)
    latency_ms = Column(Float, default=0.0)
    error_message = Column(Text, nullable=True)
    executed_at = Column(DateTime, default=utc_now)

    job_rel = relationship("AutomationJob", back_populates="executions")

class DeliveryEvent(Base):
    __tablename__ = "delivery_events"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("automation_jobs.id"), nullable=True)
    recipient_phone = Column(String(64), index=True, nullable=False)
    message_content = Column(Text, nullable=False)
    provider_message_id = Column(String(128), unique=True, index=True, nullable=False)
    delivery_status = Column(String(32), default="SIMULATED_DELIVERED")  # SIMULATED_DELIVERED, PROVIDER_CONFIRMED, FAILED, UNDELIVERED
    provider_name = Column(String(64), default="MockSMSGateway")
    is_simulated = Column(Boolean, default=True)
    cost_usd = Column(Float, default=0.0)
    error_code = Column(String(64), nullable=True)
    timestamp = Column(DateTime, default=utc_now, index=True)

    job_rel = relationship("AutomationJob", back_populates="deliveries")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    user_email = Column(String(255), default="admin@smsshield.io")
    action = Column(String(64), index=True, nullable=False)  # JOB_CREATED, JOB_STARTED, JOB_PAUSED, JOB_CANCELLED, EMERGENCY_LOCKDOWN_ENABLED, etc.
    resource_type = Column(String(64), nullable=False)
    resource_id = Column(String(64), nullable=True)
    ip_address = Column(String(64), default="127.0.0.1")
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=utc_now, index=True)
