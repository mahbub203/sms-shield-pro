import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="analyst", nullable=False)  # admin, analyst, viewer
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

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
    last_seen_at = Column(DateTime, default=datetime.datetime.utcnow)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

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
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

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
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    message = relationship("Message", back_populates="detection_result")

class BlockedSender(Base):
    __tablename__ = "blocked_senders"

    id = Column(Integer, primary_key=True, index=True)
    pattern = Column(String(64), unique=True, index=True, nullable=False)
    reason = Column(String(255), default="Manual block or threat threshold breach")
    blocked_by = Column(String(128), default="System")
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)

class AllowedSender(Base):
    __tablename__ = "allowed_senders"

    id = Column(Integer, primary_key=True, index=True)
    pattern = Column(String(64), unique=True, index=True, nullable=False)
    description = Column(String(255), default="Verified sender")
    added_by = Column(String(128), default="System")
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

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
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

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
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    messages = relationship("Message", back_populates="session")

class SystemSetting(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(64), unique=True, index=True, nullable=False)
    value = Column(String(255), nullable=False)
    description = Column(String(255), nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
