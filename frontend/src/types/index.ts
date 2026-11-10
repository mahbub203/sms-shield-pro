export type UserRole = 'admin' | 'analyst' | 'viewer';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface DashboardMetrics {
  total_messages: number;
  spam_detected: number;
  phishing_attempts: number;
  high_risk_events: number;
  protected_senders: number;
  blocked_senders_count: number;
  detection_accuracy: number;
  emergency_mode: boolean;
  threat_change_pct: number;
  spam_rate_pct: number;
}

export interface ThreatTimelineItem {
  date: string;
  safe: number;
  spam: number;
  phishing: number;
  blocked: number;
}

export interface RiskDistributionItem {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

export type RiskLevel = 'SAFE' | 'SUSPICIOUS' | 'HIGH_RISK' | 'PHISHING_THREAT' | 'CRITICAL_BLOCKED' | 'EMERGENCY_LOCKDOWN_HELD';
export type RecommendedAction = 'ALLOW' | 'FLAG' | 'QUARANTINE' | 'BLOCK' | 'ALERT_ADMIN';

export interface DetectionResult {
  id?: number;
  message_id?: number;
  sender: string;
  content: string;
  layer1_score: number;
  layer2_score: number;
  layer3_score: number;
  composite_score: number;
  risk_level: RiskLevel;
  matched_rules: string[];
  statistical_flags: string[];
  ml_model_name: string;
  ml_confidence: number;
  recommended_action: RecommendedAction;
  processing_time_ms: number;
  created_at: string;
}

export interface MessageItem {
  id: number;
  raw_sender: string;
  content: string;
  status: 'allowed' | 'quarantined' | 'blocked';
  risk_score: number;
  created_at: string;
  detection_result?: DetectionResult;
}

export interface MLMetrics {
  model_name: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  confusion_matrix: number[][];
  dataset_size: number;
  training_timestamp: string;
}

export interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  sample_count: number;
}

export interface SimulationSession {
  id: number;
  name: string;
  scenario: string;
  message_count: number;
  frequency_per_sec: number;
  status: 'idle' | 'running' | 'completed' | 'failed';
  total_processed: number;
  total_spam: number;
  total_phishing: number;
  total_blocked: number;
  avg_latency_ms: number;
  created_at: string;
  completed_at?: string;
}

export interface BlockedSender {
  id: number;
  pattern: string;
  reason: string;
  blocked_by: string;
  active: boolean;
  created_at: string;
  expires_at?: string;
}

export interface AllowedSender {
  id: number;
  pattern: string;
  description: string;
  added_by: string;
  active: boolean;
  created_at: string;
}

export interface ProtectionStatus {
  emergency_lockdown_mode: boolean;
  active_blocklist_count: number;
  active_allowlist_count: number;
  rate_limit_per_minute: number;
  protection_status: string;
  last_policy_sync: string;
}

export interface SecurityEvent {
  id: number;
  event_type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  sender?: string;
  message_snippet?: string;
  metadata_json?: Record<string, any>;
  created_at: string;
}

export interface AnalyticsOverview {
  total_analyzed: number;
  spam_percentage: number;
  threat_categories: Array<{
    category: string;
    count: number;
    color: string;
  }>;
  reputation_distribution: Array<{
    name: string;
    count: number;
  }>;
  performance: {
    avg_latency_ms: number;
    p50_latency_ms: number;
    p95_latency_ms: number;
    p99_latency_ms: number;
    peak_throughput_msgs_sec: number;
  };
}

export interface SenderAnalytics {
  id: number;
  phone_number: string;
  display_name?: string;
  reputation_score: number;
  total_messages: number;
  spam_messages: number;
  spam_ratio_pct: number;
  is_shortcode: boolean;
  last_seen_at: string;
}

export interface SystemSetting {
  id: number;
  key: string;
  value: string;
  description?: string;
  updated_at: string;
}

// ================= AUTOMATION & RECIPIENTS =================

export interface Recipient {
  id: number;
  phone_number: string;
  name: string;
  verification_status: 'unverified' | 'verified' | 'failed';
  consent_status: 'PENDING' | 'OPTED_IN' | 'REVOKED';
  consent_date?: string;
  preferred_language: string;
  notes?: string;
  created_at: string;
}

export interface MessageTemplate {
  id: number;
  name: string;
  content: string;
  category: string;
  is_unicode: boolean;
  char_count: number;
  segment_count: number;
  created_by: string;
  created_at: string;
}

export interface UnicodeInspectResult {
  char_count: number;
  encoding: string;
  is_unicode: boolean;
  is_bengali: boolean;
  segment_count: number;
  max_per_segment: number;
  remaining_in_segment: number;
}

export interface AutomationJob {
  id: number;
  name: string;
  recipient_id: number;
  template_id?: number;
  custom_message?: string;
  target_count: number;
  sent_count: number;
  failed_count: number;
  interval_seconds: number;
  status: 'PENDING' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'CANCELLED' | 'FAILED' | 'STOPPED';
  execution_mode: 'SIMULATION_ENGINE' | 'MOCK_GATEWAY' | 'PROVIDER_SANDBOX' | 'AUTHORIZED_LIVE';
  provider_rate_limit_per_min: number;
  scheduled_at?: string;
  last_run_at?: string;
  next_run_at?: string;
  created_by: string;
  created_at: string;
  recipient_rel?: Recipient;
  template_rel?: MessageTemplate;
}

export interface DeliveryEvent {
  id: number;
  job_id?: number;
  recipient_phone: string;
  message_content: string;
  provider_message_id: string;
  delivery_status: 'SIMULATED_DELIVERED' | 'PROVIDER_CONFIRMED' | 'FAILED' | 'UNDELIVERED' | 'RATE_LIMITED';
  provider_name: string;
  is_simulated: boolean;
  cost_usd: number;
  error_code?: string;
  timestamp: string;
}

export interface AutomationStats {
  total_jobs: number;
  active_jobs: number;
  completed_jobs: number;
  paused_jobs: number;
  failed_jobs: number;
  total_simulated_delivered: number;
  total_provider_confirmed: number;
  total_delivery_failures: number;
  last_execution_time?: string;
  worker_status: string;
  emergency_lockdown_active: boolean;
  current_throughput_per_sec?: number;
}

export interface WorkerHealth {
  status: string;
  uptime_seconds: number;
  total_ticks_executed: number;
  current_throughput_per_sec: number;
  active_jobs_count: number;
  is_thread_alive: boolean;
  queue_depth: number;
}
