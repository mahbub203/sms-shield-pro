import {
  AuthResponse, DashboardMetrics, ThreatTimelineItem, RiskDistributionItem,
  DetectionResult, MessageItem, MLMetrics, SimulationScenario, SimulationSession,
  BlockedSender, AllowedSender, ProtectionStatus, SecurityEvent, AnalyticsOverview,
  SenderAnalytics, SystemSetting, Recipient, MessageTemplate, UnicodeInspectResult,
  AutomationJob, DeliveryEvent, AutomationStats, WorkerHealth
} from '../types';

const BASE_URL = '/api/v1';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('sms_shield_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || `Request failed with status ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return handleResponse<AuthResponse>(res);
  },

  async getMe() {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  // Dashboard
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const res = await fetch(`${BASE_URL}/dashboard/metrics`, {
      headers: getAuthHeaders()
    });
    return handleResponse<DashboardMetrics>(res);
  },

  async getThreatTimeline(days: number = 7): Promise<ThreatTimelineItem[]> {
    const res = await fetch(`${BASE_URL}/dashboard/threat-timeline?days=${days}`, {
      headers: getAuthHeaders()
    });
    return handleResponse<ThreatTimelineItem[]>(res);
  },

  async getRiskDistribution(): Promise<RiskDistributionItem[]> {
    const res = await fetch(`${BASE_URL}/dashboard/risk-distribution`, {
      headers: getAuthHeaders()
    });
    return handleResponse<RiskDistributionItem[]>(res);
  },

  async getRecentEvents(limit: number = 10): Promise<SecurityEvent[]> {
    const res = await fetch(`${BASE_URL}/dashboard/recent-events?limit=${limit}`, {
      headers: getAuthHeaders()
    });
    return handleResponse<SecurityEvent[]>(res);
  },

  // Automation Center: Recipients
  async getRecipients(): Promise<Recipient[]> {
    const res = await fetch(`${BASE_URL}/automation/recipients`, {
      headers: getAuthHeaders()
    });
    return handleResponse<Recipient[]>(res);
  },

  async addRecipient(phone_number: string, name: string, preferred_language: string = 'bn', notes?: string): Promise<Recipient> {
    const res = await fetch(`${BASE_URL}/automation/recipients`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ phone_number, name, preferred_language, notes })
    });
    return handleResponse<Recipient>(res);
  },

  async verifyRecipient(id: number, code: string): Promise<Recipient> {
    const res = await fetch(`${BASE_URL}/automation/recipients/${id}/verify`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ code })
    });
    return handleResponse<Recipient>(res);
  },

  async updateConsent(id: number, consent_status: string): Promise<Recipient> {
    const res = await fetch(`${BASE_URL}/automation/recipients/${id}/consent`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ consent_status })
    });
    return handleResponse<Recipient>(res);
  },

  async deleteRecipient(id: number): Promise<void> {
    const res = await fetch(`${BASE_URL}/automation/recipients/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    await handleResponse(res);
  },

  // Automation Center: Templates & Unicode
  async getTemplates(): Promise<MessageTemplate[]> {
    const res = await fetch(`${BASE_URL}/automation/templates`, {
      headers: getAuthHeaders()
    });
    return handleResponse<MessageTemplate[]>(res);
  },

  async createTemplate(name: string, content: string, category: string): Promise<MessageTemplate> {
    const res = await fetch(`${BASE_URL}/automation/templates`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name, content, category })
    });
    return handleResponse<MessageTemplate>(res);
  },

  async deleteTemplate(id: number): Promise<void> {
    const res = await fetch(`${BASE_URL}/automation/templates/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    await handleResponse(res);
  },

  async inspectUnicode(text: string): Promise<UnicodeInspectResult> {
    const res = await fetch(`${BASE_URL}/automation/templates/inspect-unicode`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ text })
    });
    return handleResponse<UnicodeInspectResult>(res);
  },

  // Automation Jobs
  async getAutomationJobs(): Promise<AutomationJob[]> {
    const res = await fetch(`${BASE_URL}/automation/jobs`, {
      headers: getAuthHeaders()
    });
    return handleResponse<AutomationJob[]>(res);
  },

  async getJobs(): Promise<AutomationJob[]> {
    return this.getAutomationJobs();
  },

  async createAutomationJob(payload: {
    name: string;
    recipient_id: number;
    template_id?: number;
    custom_message?: string;
    target_count: number;
    interval_seconds: number;
    execution_mode: string;
    provider_rate_limit_per_min?: number;
  }): Promise<AutomationJob> {
    const res = await fetch(`${BASE_URL}/automation/jobs`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse<AutomationJob>(res);
  },

  async startJob(id: number): Promise<void> {
    const res = await fetch(`${BASE_URL}/automation/jobs/${id}/start`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    await handleResponse(res);
  },

  async pauseJob(id: number): Promise<void> {
    const res = await fetch(`${BASE_URL}/automation/jobs/${id}/pause`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    await handleResponse(res);
  },

  async resumeJob(id: number): Promise<void> {
    const res = await fetch(`${BASE_URL}/automation/jobs/${id}/resume`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    await handleResponse(res);
  },

  async stopJob(id: number): Promise<void> {
    const res = await fetch(`${BASE_URL}/automation/jobs/${id}/stop`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    await handleResponse(res);
  },

  async cancelJob(id: number): Promise<void> {
    const res = await fetch(`${BASE_URL}/automation/jobs/${id}/cancel`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    await handleResponse(res);
  },

  async deleteJob(id: number): Promise<void> {
    const res = await fetch(`${BASE_URL}/automation/jobs/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    await handleResponse(res);
  },

  async quickDispatch(payload: any): Promise<any> {
    const res = await fetch(`${BASE_URL}/automation/jobs/quick-dispatch`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  // Scheduler & Telemetry
  async getSchedulerStats(): Promise<AutomationStats> {
    const res = await fetch(`${BASE_URL}/scheduler/stats`, {
      headers: getAuthHeaders()
    });
    return handleResponse<AutomationStats>(res);
  },

  async getWorkerHealth(): Promise<WorkerHealth> {
    const res = await fetch(`${BASE_URL}/scheduler/worker/health`, {
      headers: getAuthHeaders()
    });
    return handleResponse<WorkerHealth>(res);
  },

  async restartWorker(): Promise<{ status: string; worker_status: string }> {
    const res = await fetch(`${BASE_URL}/scheduler/worker/restart`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async pauseWorker(): Promise<{ status: string; worker_status: string }> {
    const res = await fetch(`${BASE_URL}/scheduler/worker/pause`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async resumeWorker(): Promise<{ status: string; worker_status: string }> {
    const res = await fetch(`${BASE_URL}/scheduler/worker/resume`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async getDeliveries(limit: number = 50, status?: string): Promise<DeliveryEvent[]> {
    const params = new URLSearchParams({ limit: String(limit) });
    if (status && status !== 'ALL') params.append('status', status);
    const res = await fetch(`${BASE_URL}/scheduler/deliveries?${params.toString()}`, {
      headers: getAuthHeaders()
    });
    return handleResponse<DeliveryEvent[]>(res);
  },

  // Detection Engine
  async analyzeMessage(sender: string, content: string, recipient?: string): Promise<DetectionResult> {
    const res = await fetch(`${BASE_URL}/detection/analyze`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ sender, content, recipient })
    });
    return handleResponse<DetectionResult>(res);
  },

  async getMLMetrics(): Promise<MLMetrics> {
    const res = await fetch(`${BASE_URL}/detection/metrics`, {
      headers: getAuthHeaders()
    });
    return handleResponse<MLMetrics>(res);
  },

  async getAnalysisHistory(limit: number = 25, search?: string, status?: string): Promise<MessageItem[]> {
    const params = new URLSearchParams({ limit: String(limit) });
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    const res = await fetch(`${BASE_URL}/detection/history?${params.toString()}`, {
      headers: getAuthHeaders()
    });
    return handleResponse<MessageItem[]>(res);
  },

  // Simulation Lab
  async getScenarios(): Promise<SimulationScenario[]> {
    const res = await fetch(`${BASE_URL}/simulation/scenarios`, {
      headers: getAuthHeaders()
    });
    return handleResponse<SimulationScenario[]>(res);
  },

  async startSimulation(name: string, scenario: string, count: number, frequency: number): Promise<SimulationSession> {
    const res = await fetch(`${BASE_URL}/simulation/start`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        name,
        scenario,
        message_count: count,
        frequency_per_sec: frequency
      })
    });
    return handleResponse<SimulationSession>(res);
  },

  async getSimulationSessions(): Promise<SimulationSession[]> {
    const res = await fetch(`${BASE_URL}/simulation/sessions`, {
      headers: getAuthHeaders()
    });
    return handleResponse<SimulationSession[]>(res);
  },

  async getSessionMessages(sessionId: number): Promise<MessageItem[]> {
    const res = await fetch(`${BASE_URL}/simulation/sessions/${sessionId}/messages`, {
      headers: getAuthHeaders()
    });
    return handleResponse<MessageItem[]>(res);
  },

  // Protection Center
  async getProtectionStatus(): Promise<ProtectionStatus> {
    const res = await fetch(`${BASE_URL}/protection/status`, {
      headers: getAuthHeaders()
    });
    return handleResponse<ProtectionStatus>(res);
  },

  async toggleEmergencyMode(enabled: boolean): Promise<{ emergency_lockdown_mode: boolean }> {
    const res = await fetch(`${BASE_URL}/protection/emergency-mode`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ enabled })
    });
    return handleResponse(res);
  },

  async getBlocklist(): Promise<BlockedSender[]> {
    const res = await fetch(`${BASE_URL}/protection/blocklist`, {
      headers: getAuthHeaders()
    });
    return handleResponse<BlockedSender[]>(res);
  },

  async addToBlocklist(pattern: string, reason: string): Promise<BlockedSender> {
    const res = await fetch(`${BASE_URL}/protection/blocklist`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ pattern, reason })
    });
    return handleResponse<BlockedSender>(res);
  },

  async removeFromBlocklist(id: number): Promise<void> {
    const res = await fetch(`${BASE_URL}/protection/blocklist/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    await handleResponse(res);
  },

  async getAllowlist(): Promise<AllowedSender[]> {
    const res = await fetch(`${BASE_URL}/protection/allowlist`, {
      headers: getAuthHeaders()
    });
    return handleResponse<AllowedSender[]>(res);
  },

  async addToAllowlist(pattern: string, description: string): Promise<AllowedSender> {
    const res = await fetch(`${BASE_URL}/protection/allowlist`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ pattern, description })
    });
    return handleResponse<AllowedSender>(res);
  },

  async removeFromAllowlist(id: number): Promise<void> {
    const res = await fetch(`${BASE_URL}/protection/allowlist/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    await handleResponse(res);
  },

  // Threat Monitoring
  async getThreatEvents(severity?: string, search?: string): Promise<SecurityEvent[]> {
    const params = new URLSearchParams();
    if (severity && severity !== 'ALL') params.append('severity', severity);
    if (search) params.append('search', search);
    const res = await fetch(`${BASE_URL}/threats/events?${params.toString()}`, {
      headers: getAuthHeaders()
    });
    return handleResponse<SecurityEvent[]>(res);
  },

  async getLiveFeed(): Promise<MessageItem[]> {
    const res = await fetch(`${BASE_URL}/threats/live-feed`, {
      headers: getAuthHeaders()
    });
    return handleResponse<MessageItem[]>(res);
  },

  async clearThreatEvents(): Promise<void> {
    const res = await fetch(`${BASE_URL}/threats/events`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    await handleResponse(res);
  },

  // Analytics
  async getAnalyticsOverview(): Promise<AnalyticsOverview> {
    const res = await fetch(`${BASE_URL}/analytics/overview`, {
      headers: getAuthHeaders()
    });
    return handleResponse<AnalyticsOverview>(res);
  },

  async getSenderAnalytics(): Promise<SenderAnalytics[]> {
    const res = await fetch(`${BASE_URL}/analytics/senders`, {
      headers: getAuthHeaders()
    });
    return handleResponse<SenderAnalytics[]>(res);
  },

  // Settings
  async getSettings(): Promise<SystemSetting[]> {
    const res = await fetch(`${BASE_URL}/settings`, {
      headers: getAuthHeaders()
    });
    return handleResponse<SystemSetting[]>(res);
  },

  async updateSetting(key: string, value: string): Promise<SystemSetting> {
    const res = await fetch(`${BASE_URL}/settings/${key}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ value })
    });
    return handleResponse<SystemSetting>(res);
  },

  // Reports Export URLs
  getPdfReportUrl(type: string): string {
    return `${BASE_URL}/reports/pdf?report_type=${type}`;
  },

  getCsvExportUrl(type: string): string {
    return `${BASE_URL}/reports/csv?data_type=${type}`;
  }
};
