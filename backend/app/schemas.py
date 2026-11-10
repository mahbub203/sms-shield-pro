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
    scenario: str = Field(default="mixed") # normal, bank_phishing, delivery_scam, urgent_wire, bulk_burst, mixed
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
