from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

# ----------------- Auth & Users -----------------
class UserLogin(BaseModel):
    email: str = Field(..., description="User email address")
    password: str

class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str
    role: str = "analyst"

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

# ----------------- Messages & Detection -----------------
class MessageAnalyzeRequest(BaseModel):
    sender: str = Field(..., description="Originating sender phone or shortcode")
    content: str = Field(..., description="SMS content")
    recipient: Optional[str] = Field(default="+10000000000", description="Recipient number")

class BatchAnalyzeRequest(BaseModel):
    messages: List[MessageAnalyzeRequest]

class DetectionResultOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: Optional[int] = None
    message_id: Optional[int] = None
    sender: str
    content: str
    layer1_score: float
    layer2_score: float
    layer3_score: float
    composite_score: float
    risk_level: str
    matched_rules: List[str]
    statistical_flags: List[str]
    ml_model_name: str
    ml_confidence: float
    recommended_action: str
    processing_time_ms: float
    created_at: datetime

class MessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    raw_sender: str
    content: str
    status: str
    risk_score: float
    created_at: datetime
    detection_result: Optional[DetectionResultOut] = None

# ----------------- Simulation -----------------
class SimulationStartRequest(BaseModel):
    name: str = Field(default="Security Test Run 1")
    scenario: str = Field(default="mixed")
    message_count: int = Field(default=15, ge=1, le=200)
    frequency_per_sec: float = Field(default=2.0, ge=0.5, le=20.0)

class SimulationSessionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    scenario: str
    message_count: int
    frequency_per_sec: float
    status: str
    total_processed: int
    total_spam: int
    total_phishing: int
    total_blocked: int
    avg_latency_ms: float
    created_at: datetime
    completed_at: Optional[datetime] = None

# ----------------- Protection -----------------
class BlocklistCreate(BaseModel):
    pattern: str = Field(..., description="Pattern e.g. +1800555* or exact number")
    reason: str = Field(default="Identified malicious threat vector")
    expires_in_hours: Optional[int] = None

class BlocklistOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    pattern: str
    reason: str
    blocked_by: str
    active: bool
    created_at: datetime
    expires_at: Optional[datetime] = None

class AllowlistCreate(BaseModel):
    pattern: str = Field(..., description="Pattern e.g. +18004321000")
    description: str = Field(default="Verified service gateway")

class AllowlistOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    pattern: str
    description: str
    added_by: str
    active: bool
    created_at: datetime

# ----------------- Security Events -----------------
class SecurityEventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    event_type: str
    severity: str
    title: str
    description: str
    sender: Optional[str] = None
    message_snippet: Optional[str] = None
    metadata_json: Optional[Dict[str, Any]] = None
    created_at: datetime

# ----------------- Dashboard & Analytics -----------------
class DashboardMetricsOut(BaseModel):
    total_messages: int
    spam_detected: int
    phishing_attempts: int
    high_risk_events: int
    protected_senders: int
    blocked_senders_count: int
    detection_accuracy: float
    emergency_mode: bool
    threat_change_pct: float
    spam_rate_pct: float

class ThreatTimelineItem(BaseModel):
    date: str
    safe: int
    spam: int
    phishing: int
    blocked: int

class RiskDistributionItem(BaseModel):
    name: str
    count: int
    percentage: float
    color: str

class MLPerformanceMetrics(BaseModel):
    model_name: str
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    confusion_matrix: List[List[int]]
    dataset_size: int
    training_timestamp: str

# ----------------- Settings -----------------
class SystemSettingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    key: str
    value: str
    description: Optional[str] = None
    updated_at: datetime

class SystemSettingUpdate(BaseModel):
    value: str

# ==================== NEW AUTOMATION SCHEMAS ====================

class RecipientCreate(BaseModel):
    phone_number: str = Field(..., description="E.164 phone number e.g. +8801712345678")
    name: str = Field(..., description="Recipient display name e.g. Mahbub Alam")
    preferred_language: str = Field(default="bn", description="en or bn")
    notes: Optional[str] = None

class RecipientVerifyRequest(BaseModel):
    code: str = Field(..., description="OTP verification token")

class ConsentUpdate(BaseModel):
    consent_status: str = Field(..., description="OPTED_IN or REVOKED")
    method: Optional[str] = "ADMIN_CONSOLE"

class RecipientOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    phone_number: str
    name: str
    verification_status: str
    consent_status: str
    consent_date: Optional[datetime] = None
    preferred_language: str
    notes: Optional[str] = None
    created_at: datetime

class MessageTemplateCreate(BaseModel):
    name: str
    content: str
    category: str = "TRANSACTIONAL"

class MessageTemplateOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    content: str
    category: str
    is_unicode: bool
    char_count: int
    segment_count: int
    created_by: str
    created_at: datetime

class UnicodeInspectRequest(BaseModel):
    text: str

class UnicodeInspectResponse(BaseModel):
    char_count: int
    encoding: str
    is_unicode: bool
    is_bengali: bool
    segment_count: int
    max_per_segment: int
    remaining_in_segment: int

class AutomationJobCreate(BaseModel):
    name: str
    recipient_id: Optional[int] = None
    recipient_phone: Optional[str] = None
    recipient_name: Optional[str] = None
    template_id: Optional[int] = None
    custom_message: Optional[str] = None
    target_count: int = Field(default=10, ge=1, le=10000, description="Permitted quantity (up to 10k for simulation)")
    interval_seconds: float = Field(default=1.0, ge=0.05, le=3600.0, description="Interval in seconds (sub-second supported for simulation)")
    execution_mode: str = Field(default="SIMULATION_ENGINE", description="SIMULATION_ENGINE, MOCK_GATEWAY, PROVIDER_SANDBOX, AUTHORIZED_LIVE")
    provider_rate_limit_per_min: int = Field(default=60, ge=1, le=600)
    scheduled_at: Optional[datetime] = None

class WorkerHealthOut(BaseModel):
    status: str
    uptime_seconds: float
    total_ticks_executed: int
    current_throughput_per_sec: float
    active_jobs_count: int
    is_thread_alive: bool
    queue_depth: int

class AutomationJobOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    recipient_id: int
    template_id: Optional[int] = None
    custom_message: Optional[str] = None
    target_count: int
    sent_count: int
    failed_count: int
    interval_seconds: float
    status: str
    execution_mode: str
    provider_rate_limit_per_min: int
    scheduled_at: Optional[datetime] = None
    last_run_at: Optional[datetime] = None
    next_run_at: Optional[datetime] = None
    created_by: str
    created_at: datetime
    recipient_rel: Optional[RecipientOut] = None
    template_rel: Optional[MessageTemplateOut] = None

class DeliveryEventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    job_id: Optional[int] = None
    recipient_phone: str
    message_content: str
    provider_message_id: str
    delivery_status: str
    provider_name: str
    is_simulated: bool
    cost_usd: float
    error_code: Optional[str] = None
    timestamp: datetime

class AutomationStatsOut(BaseModel):
    total_jobs: int
    active_jobs: int
    completed_jobs: int
    paused_jobs: int
    failed_jobs: int
    total_simulated_delivered: int
    total_provider_confirmed: int
    total_delivery_failures: int
    last_execution_time: Optional[datetime] = None
    worker_status: str
    emergency_lockdown_active: bool
    current_throughput_per_sec: Optional[float] = 0.0
