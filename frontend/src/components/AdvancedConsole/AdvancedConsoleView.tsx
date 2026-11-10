import React, { useState, useEffect, useCallback } from 'react';
import {
  Terminal,
  Zap,
  Play,
  Pause,
  RotateCcw,
  Square,
  Trash2,
  Clock,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Server,
  Layers,
  Send,
  Smartphone,
  RefreshCw,
  Sliders,
  Calendar,
  Lock,
  FileText,
  UserCheck,
  ShieldCheck,
  ExternalLink,
  Info
} from 'lucide-react';
import { api } from '../../services/api';
import {
  AutomationJob,
  AutomationStats,
  WorkerHealth,
  DeliveryEvent,
  MessageTemplate,
  Recipient,
  UnicodeInspectResult
} from '../../types';

export const AdvancedConsoleView: React.FC = () => {
  // Mode selection: SIMULATION_ENGINE (Mode A) vs AUTHORIZED_LIVE (Mode B)
  const [executionMode, setExecutionMode] = useState<'SIMULATION_ENGINE' | 'AUTHORIZED_LIVE'>('SIMULATION_ENGINE');

  // Input state
  const [jobName, setJobName] = useState<string>('Synthetic Threat Simulation Run #1');
  const [recipientPhone, setRecipientPhone] = useState<string>('+12025550188');
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>('');
  const [customMessage, setCustomMessage] = useState<string>('SMS Shield Security Alert: Suspicious token access attempt detected on port 8088.');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [messageQuantity, setMessageQuantity] = useState<number>(50);
  const [sendingInterval, setSendingInterval] = useState<number>(0.5);
  const [scheduleType, setScheduleType] = useState<'immediate' | 'scheduled'>('immediate');
  const [scheduledTime, setScheduledTime] = useState<string>('');

  // Unicode & SMS analysis
  const [unicodeInfo, setUnicodeInfo] = useState<UnicodeInspectResult | null>(null);

  // Data telemetry state
  const [stats, setStats] = useState<AutomationStats | null>(null);
  const [workerHealth, setWorkerHealth] = useState<WorkerHealth | null>(null);
  const [jobs, setJobs] = useState<AutomationJob[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryEvent[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);

  // UI state
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [historyTab, setHistoryTab] = useState<'jobs' | 'deliveries' | 'worker'>('jobs');

  // Fetch initial telemetry
  const fetchTelemetry = useCallback(async () => {
    try {
      const [statsRes, workerRes, jobsRes, delivRes, tmplRes, recRes] = await Promise.all([
        api.getSchedulerStats(),
        api.getWorkerHealth(),
        api.getJobs(),
        api.getDeliveries(30),
        api.getTemplates(),
        api.getRecipients()
      ]);
      setStats(statsRes);
      setWorkerHealth(workerRes);
      setJobs(jobsRes);
      setDeliveries(delivRes);
      setTemplates(tmplRes);
      setRecipients(recRes);
    } catch (err: any) {
      console.error('Failed to fetch console telemetry:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 3500); // 3.5s auto-polling
    return () => clearInterval(interval);
  }, [fetchTelemetry]);

  // Inspect message content whenever customMessage changes
  useEffect(() => {
    if (!customMessage.trim()) {
      setUnicodeInfo(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const info = await api.inspectUnicode(customMessage);
        setUnicodeInfo(info);
      } catch (e) {
        console.error('Unicode inspection failed:', e);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [customMessage]);

  // Handle template selection
  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (!templateId) return;
    const found = templates.find((t) => String(t.id) === templateId);
    if (found) {
      setCustomMessage(found.content);
    }
  };

  // Handle recipient selection
  const handleSelectRecipient = (recId: string) => {
    setSelectedRecipientId(recId);
    if (!recId) return;
    const found = recipients.find((r) => String(r.id) === recId);
    if (found) {
      setRecipientPhone(found.phone_number);
    }
  };

  // Quick Dispatch / Launch Job
  const handleLaunchExecution = async () => {
    setIsSubmitting(true);
    setStatusMessage(null);
    try {
      // Validate recipient phone
      const cleanPhone = recipientPhone.trim();
      if (!cleanPhone.startsWith('+')) {
        throw new Error('Recipient number must start with + in E.164 format (e.g. +12025550188 or +8801712345678).');
      }

      if (executionMode === 'AUTHORIZED_LIVE') {
        // Mode B checks
        if (messageQuantity > 50) {
          throw new Error('Authorized Live Gateway is capped at 50 messages per batch to safeguard carrier quotas.');
        }
        const existing = recipients.find((r) => r.phone_number === cleanPhone);
        if (!existing || existing.consent_status !== 'OPTED_IN') {
          throw new Error('Mode B (Authorized Live Gateway) requires a verified recipient with OPTED_IN consent. Please verify phone ownership via OTP first.');
        }
      }

      const payload = {
        name: jobName.trim() || `Automation Job - ${new Date().toLocaleTimeString()}`,
        recipient_phone: cleanPhone,
        custom_message: customMessage.trim() || 'Authorized alert dispatch from SMS Shield PRO.',
        target_count: messageQuantity,
        interval_seconds: sendingInterval,
        execution_mode: executionMode,
        provider_rate_limit_per_min: 60,
        scheduled_at: scheduleType === 'scheduled' && scheduledTime ? new Date(scheduledTime).toISOString() : null
      };

      const result = await api.quickDispatch(payload);
      setStatusMessage({
        type: 'success',
        text: `Execution initiated successfully in ${executionMode === 'SIMULATION_ENGINE' ? 'Mode A (Simulation)' : 'Mode B (Authorized Gateway)'}! Target: ${messageQuantity} SMS.`
      });
      await fetchTelemetry();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to dispatch automation job.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Job Controls: Start, Pause, Resume, Stop, Delete
  const handleJobAction = async (jobId: number, action: 'start' | 'pause' | 'resume' | 'stop' | 'delete') => {
    try {
      if (action === 'start') await api.startJob(jobId);
      else if (action === 'pause') await api.pauseJob(jobId);
      else if (action === 'resume') await api.resumeJob(jobId);
      else if (action === 'stop') await api.stopJob(jobId);
      else if (action === 'delete') await api.deleteJob(jobId);

      setStatusMessage({ type: 'info', text: `Job #${jobId} action [${action.toUpperCase()}] executed.` });
      await fetchTelemetry();
    } catch (err: any) {
      alert(`Action failed: ${err.message}`);
    }
  };

  // Worker controls
  const handleWorkerAction = async (action: 'restart' | 'pause' | 'resume') => {
    try {
      if (action === 'restart') await api.restartWorker();
      else if (action === 'pause') await api.pauseWorker();
      else if (action === 'resume') await api.resumeWorker();
      setStatusMessage({ type: 'info', text: `Background worker ${action} command sent successfully.` });
      await fetchTelemetry();
    } catch (err: any) {
      alert(`Worker command failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Mode Switcher */}
      <div className="bg-navy-900 border border-slate-800/80 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <Terminal className="w-5 h-5" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Advanced Automation Console
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-700/50 font-mono">
                  ENGINE v2.6
                </span>
              </h1>
            </div>
            <p className="text-sm text-slate-400 max-w-2xl">
              High-throughput SMS event synthesis, background queue management, and authorized carrier gateway integration with sub-second interval scheduling.
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center p-1.5 rounded-xl bg-navy-950 border border-slate-800">
            <button
              onClick={() => {
                setExecutionMode('SIMULATION_ENGINE');
                setJobName('Synthetic Threat Simulation Run #1');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                executionMode === 'SIMULATION_ENGINE'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-glow-cyan'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-4 h-4" />
              Mode A: Simulation Engine
            </button>
            <button
              onClick={() => {
                setExecutionMode('AUTHORIZED_LIVE');
                setJobName('Authorized Production Dispatch #1');
                if (messageQuantity > 50) setMessageQuantity(20);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                executionMode === 'AUTHORIZED_LIVE'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Mode B: Authorized Gateway
            </button>
          </div>
        </div>

        {/* Status notification banner */}
        {statusMessage && (
          <div
            className={`mt-4 p-3 rounded-xl border text-xs flex items-center justify-between ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                : statusMessage.type === 'error'
                ? 'bg-rose-950/60 border-rose-500/50 text-rose-300'
                : 'bg-blue-950/60 border-blue-500/50 text-blue-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : statusMessage.type === 'error' ? (
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              ) : (
                <Info className="w-4 h-4 text-blue-400 flex-shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-slate-400 hover:text-white px-2 py-0.5"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* Real-time KPI Activity Counters */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Active Jobs */}
        <div className="bg-navy-900/90 border border-slate-800/80 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Active Jobs</span>
            <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-400">
            {stats?.active_jobs ?? 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Running in queue</div>
        </div>

        {/* Processing Throughput */}
        <div className="bg-navy-900/90 border border-slate-800/80 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Throughput</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">
            {workerHealth?.current_throughput_per_sec ?? stats?.current_throughput_per_sec ?? 0}{' '}
            <span className="text-xs font-normal text-slate-400">msg/s</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Real-time processing rate</div>
        </div>

        {/* Simulated Delivered */}
        <div className="bg-navy-900/90 border border-slate-800/80 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Simulated Events</span>
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-blue-400">
            {stats?.total_simulated_delivered ?? 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Synthetic SMS generated</div>
        </div>

        {/* Provider Confirmed */}
        <div className="bg-navy-900/90 border border-slate-800/80 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Provider Confirmed</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {stats?.total_provider_confirmed ?? 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Live carrier receipts</div>
        </div>

        {/* Completed Jobs */}
        <div className="bg-navy-900/90 border border-slate-800/80 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Completed</span>
            <CheckCircle2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-200">
            {stats?.completed_jobs ?? 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Finished test batches</div>
        </div>

        {/* Background Worker Health */}
        <div className="bg-navy-900/90 border border-slate-800/80 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Worker State</span>
            <Server className="w-4 h-4 text-teal-400" />
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                workerHealth?.status === 'HEALTHY_ACTIVE'
                  ? 'bg-emerald-400 animate-pulse'
                  : workerHealth?.status === 'PAUSED'
                  ? 'bg-amber-400'
                  : 'bg-rose-500'
              }`}
            />
            <span className="text-sm font-bold font-mono text-slate-200">
              {workerHealth?.status === 'HEALTHY_ACTIVE'
                ? 'HEALTHY'
                : workerHealth?.status || 'ACTIVE'}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Uptime: {Math.floor((workerHealth?.uptime_seconds ?? 0) / 60)}m{' '}
            {Math.floor((workerHealth?.uptime_seconds ?? 0) % 60)}s
          </div>
        </div>
      </div>

      {/* Main Console Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Automation Form & Configuration (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-navy-900 border border-slate-800/80 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-5">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <h2 className="text-base font-bold text-white">Execution Parameters</h2>
              </div>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-md font-mono font-medium ${
                  executionMode === 'SIMULATION_ENGINE'
                    ? 'bg-blue-950 text-blue-400 border border-blue-800/50'
                    : 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                }`}
              >
                {executionMode === 'SIMULATION_ENGINE' ? 'SYNTHETIC SIMULATOR' : 'AUTHORIZED LIVE GATEWAY'}
              </span>
            </div>

            <div className="space-y-4">
              {/* Job Name */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Job Label / Description
                </label>
                <input
                  type="text"
                  value={jobName}
                  onChange={(e) => setJobName(e.target.value)}
                  placeholder="e.g. Synthetic Stress Test #4"
                  className="w-full bg-navy-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent font-medium"
                />
              </div>

              {/* Recipient Selection & Direct Phone Input */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-slate-300">
                      Recipient Number (E.164)
                    </label>
                    <span className="text-[10px] text-slate-500 font-mono">+CountryCode</span>
                  </div>
                  <input
                    type="text"
                    value={recipientPhone}
                    onChange={(e) => {
                      setRecipientPhone(e.target.value);
                      setSelectedRecipientId('');
                    }}
                    placeholder="+12025550188"
                    className="w-full bg-navy-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm font-mono text-cyan-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Or Select Verified Recipient
                  </label>
                  <select
                    value={selectedRecipientId}
                    onChange={(e) => handleSelectRecipient(e.target.value)}
                    className="w-full bg-navy-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="">-- Choose from Directory --</option>
                    {recipients.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.phone_number}) — {r.consent_status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Template Selection */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Message Template Preset
                </label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => handleSelectTemplate(e.target.value)}
                  className="w-full bg-navy-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">-- Custom Message (Or select preset template) --</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      [{t.category}] {t.name} ({t.segment_count} seg)
                    </option>
                  ))}
                </select>
              </div>

              {/* Message Composer */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-300">Message Content</label>
                  {unicodeInfo && (
                    <div className="flex items-center gap-2 text-[11px] font-mono">
                      <span className="text-slate-400">
                        {unicodeInfo.char_count} chars
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="text-cyan-400 font-bold">
                        {unicodeInfo.segment_count} segment(s)
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 text-[10px]">
                        {unicodeInfo.encoding}
                      </span>
                      {unicodeInfo.is_bengali && (
                        <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px]">
                          বাংলা Native
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <textarea
                  rows={3}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Enter SMS payload or template text..."
                  className="w-full bg-navy-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none font-mono"
                />
              </div>

              {/* Message Quantity & Sending Interval */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Quantity */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-slate-300">
                      Permitted Event Quantity
                    </label>
                    <span className="text-[11px] font-mono text-cyan-400 font-bold">
                      {messageQuantity} SMS
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5 mb-2">
                    {[10, 50, 100, 500, 1000].map((qty) => (
                      <button
                        key={qty}
                        type="button"
                        disabled={executionMode === 'AUTHORIZED_LIVE' && qty > 50}
                        onClick={() => setMessageQuantity(qty)}
                        className={`py-1 rounded text-xs font-mono font-medium border transition-colors ${
                          messageQuantity === qty
                            ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                            : 'bg-navy-950 border-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed'
                        }`}
                      >
                        {qty}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={executionMode === 'AUTHORIZED_LIVE' ? 50 : 10000}
                    value={messageQuantity}
                    onChange={(e) => setMessageQuantity(parseInt(e.target.value) || 1)}
                    className="w-full bg-navy-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm font-mono text-slate-200"
                  />
                  {executionMode === 'AUTHORIZED_LIVE' && (
                    <p className="text-[10px] text-amber-400/90 mt-1">
                      * Mode B limit: 50 SMS max per batch for safe authorized delivery.
                    </p>
                  )}
                </div>

                {/* Sending Interval */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-slate-300">
                      Sending Interval (Pacing)
                    </label>
                    <span className="text-[11px] font-mono text-amber-400 font-bold">
                      {sendingInterval}s{' '}
                      <span className="text-[10px] text-slate-400 font-normal">
                        ({(1 / sendingInterval).toFixed(1)}/s)
                      </span>
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5 mb-2">
                    {[0.1, 0.25, 0.5, 1.0, 5.0].map((intv) => (
                      <button
                        key={intv}
                        type="button"
                        onClick={() => setSendingInterval(intv)}
                        className={`py-1 rounded text-xs font-mono font-medium border transition-colors ${
                          sendingInterval === intv
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                            : 'bg-navy-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {intv}s
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    step="0.05"
                    min={0.05}
                    max={3600}
                    value={sendingInterval}
                    onChange={(e) => setSendingInterval(parseFloat(e.target.value) || 0.1)}
                    className="w-full bg-navy-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm font-mono text-slate-200"
                  />
                </div>
              </div>

              {/* Schedule Type */}
              <div className="pt-2">
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  Dispatch Schedule Mode
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setScheduleType('immediate')}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border text-xs font-semibold transition-all ${
                      scheduleType === 'immediate'
                        ? 'bg-cyan-500/10 border-cyan-500/60 text-cyan-300'
                        : 'bg-navy-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    Immediate Start
                  </button>
                  <button
                    type="button"
                    onClick={() => setScheduleType('scheduled')}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border text-xs font-semibold transition-all ${
                      scheduleType === 'scheduled'
                        ? 'bg-cyan-500/10 border-cyan-500/60 text-cyan-300'
                        : 'bg-navy-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    Cloud Scheduled Start
                  </button>
                </div>
                {scheduleType === 'scheduled' && (
                  <div className="mt-3">
                    <input
                      type="datetime-local"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full bg-navy-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono"
                    />
                  </div>
                )}
              </div>

              {/* Launch Action Button */}
              <div className="pt-4">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleLaunchExecution}
                  className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm tracking-wide flex items-center justify-center gap-2 shadow-lg transition-all ${
                    executionMode === 'SIMULATION_ENGINE'
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-cyan-900/40 hover:shadow-cyan-800/60'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-emerald-900/40'
                  } disabled:opacity-50`}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Initializing Dispatch Engine...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      Launch Automation Engine ({executionMode === 'SIMULATION_ENGINE' ? 'Mode A: Synthetic' : 'Mode B: Live'})
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Phone Preview & Worker Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Live Mobile Device Preview */}
          <div className="bg-navy-900 border border-slate-800/80 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Live Endpoint SMS Preview</h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Simulated Handset</span>
            </div>

            {/* Smartphone frame */}
            <div className="mx-auto max-w-[280px] bg-slate-900 border-4 border-slate-700 rounded-[32px] p-3 shadow-2xl relative">
              {/* Speaker / Camera notch */}
              <div className="w-24 h-4 bg-slate-800 rounded-full mx-auto mb-3 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-slate-900 mr-2" />
                <div className="w-8 h-1 rounded-full bg-slate-700" />
              </div>

              {/* Handset screen */}
              <div className="bg-navy-950 rounded-2xl p-3 min-h-[220px] flex flex-col justify-between border border-slate-800">
                <div className="text-center pb-2 border-b border-slate-800/60">
                  <div className="text-[11px] font-bold text-white">SMS SHIELD PRO</div>
                  <div className="text-[10px] text-slate-400 font-mono">{recipientPhone || '+1 (202) 555-0188'}</div>
                </div>

                <div className="my-3 space-y-2">
                  <div className="bg-blue-600/90 text-white p-2.5 rounded-xl rounded-tl-none text-xs leading-relaxed shadow-sm font-sans">
                    {customMessage || 'Waiting for message input...'}
                  </div>
                  <div className="text-[9px] text-slate-500 text-right font-mono">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Delivered
                  </div>
                </div>

                <div className="text-center pt-2 border-t border-slate-800/60 text-[9px] text-slate-500 font-mono">
                  {unicodeInfo?.is_bengali ? 'UCS-2 Bengali' : unicodeInfo?.encoding || 'GSM 7-bit'} • {unicodeInfo?.char_count ?? 0} chars
                </div>
              </div>
            </div>
          </div>

          {/* Worker Controller Card */}
          <div className="bg-navy-900 border border-slate-800/80 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-teal-400" />
                <h3 className="text-sm font-bold text-white">Background Worker Controller</h3>
              </div>
              <button
                onClick={fetchTelemetry}
                className="p-1 rounded text-slate-400 hover:text-white"
                title="Refresh stats"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-800/40">
                <span className="text-slate-400">Worker Status</span>
                <span className="font-mono font-semibold text-emerald-400">
                  {workerHealth?.status || 'HEALTHY_ACTIVE'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/40">
                <span className="text-slate-400">Active Thread</span>
                <span className="font-mono text-cyan-300">
                  {workerHealth?.is_thread_alive ? 'RUNNING (Thread-Safe)' : 'INACTIVE'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/40">
                <span className="text-slate-400">Total Ticks Processed</span>
                <span className="font-mono text-slate-200">
                  {workerHealth?.total_ticks_executed ?? stats?.total_simulated_delivered ?? 0}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/40">
                <span className="text-slate-400">Active Queue Depth</span>
                <span className="font-mono text-amber-400">
                  {workerHealth?.queue_depth ?? 0} queued tasks
                </span>
              </div>
            </div>

            {/* Worker Action Buttons */}
            <div className="grid grid-cols-3 gap-2 mt-4">
              <button
                type="button"
                onClick={() => handleWorkerAction('restart')}
                className="py-2 px-2 rounded-lg bg-navy-950 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                Restart
              </button>
              <button
                type="button"
                onClick={() => handleWorkerAction('pause')}
                className="py-2 px-2 rounded-lg bg-navy-950 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Pause className="w-3.5 h-3.5 text-amber-400" />
                Pause
              </button>
              <button
                type="button"
                onClick={() => handleWorkerAction('resume')}
                className="py-2 px-2 rounded-lg bg-navy-950 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Play className="w-3.5 h-3.5 text-emerald-400" />
                Resume
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Execution History & Telemetry Section */}
      <div className="bg-navy-900 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80 mb-5">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-base font-bold text-white">Execution Telemetry & Task Controls</h2>
              <p className="text-xs text-slate-400">Monitor live batch states, pause/resume, and inspect carrier receipts</p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-1 rounded-lg bg-navy-950 border border-slate-800 text-xs">
            <button
              onClick={() => setHistoryTab('jobs')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                historyTab === 'jobs'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Automation Jobs ({jobs.length})
            </button>
            <button
              onClick={() => setHistoryTab('deliveries')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                historyTab === 'deliveries'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Delivery Log ({deliveries.length})
            </button>
          </div>
        </div>

        {/* Tab 1: Automation Jobs */}
        {historyTab === 'jobs' && (
          <div className="overflow-x-auto">
            {jobs.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Layers className="w-8 h-8 mx-auto mb-2 opacity-40 text-cyan-400" />
                <p className="text-sm">No automation jobs yet.</p>
                <p className="text-xs text-slate-600">Configure parameters above and click Launch Automation Engine.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono">
                    <th className="pb-3 font-semibold">JOB / RECIPIENT</th>
                    <th className="pb-3 font-semibold">MODE</th>
                    <th className="pb-3 font-semibold">PROGRESS</th>
                    <th className="pb-3 font-semibold">PACING</th>
                    <th className="pb-3 font-semibold">STATUS</th>
                    <th className="pb-3 font-semibold text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {jobs.map((job) => {
                    const percent = Math.min(100, Math.round((job.sent_count / (job.target_count || 1)) * 100));
                    return (
                      <tr key={job.id} className="hover:bg-navy-950/40 transition-colors">
                        <td className="py-3">
                          <div className="font-semibold text-slate-100">{job.name}</div>
                          <div className="text-[11px] font-mono text-cyan-400">
                            {job.recipient_rel?.phone_number || 'Direct Number'}
                          </div>
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                              job.execution_mode === 'SIMULATION_ENGINE' || job.execution_mode === 'MOCK_GATEWAY'
                                ? 'bg-blue-950 text-blue-300 border border-blue-800/50'
                                : 'bg-emerald-950 text-emerald-300 border border-emerald-800/50'
                            }`}
                          >
                            {job.execution_mode}
                          </span>
                        </td>
                        <td className="py-3">
                          <div className="w-32">
                            <div className="flex justify-between text-[11px] font-mono mb-1">
                              <span className="text-slate-300">{job.sent_count} / {job.target_count}</span>
                              <span className="text-cyan-400">{percent}%</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  job.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-cyan-500'
                                }`}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 font-mono text-slate-300">
                          {job.interval_seconds}s
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                              job.status === 'RUNNING'
                                ? 'bg-cyan-950 text-cyan-400 border border-cyan-800 animate-pulse'
                                : job.status === 'COMPLETED'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : job.status === 'PAUSED'
                                ? 'bg-amber-950 text-amber-400 border border-amber-800'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {job.status}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {job.status === 'PENDING' && (
                              <button
                                onClick={() => handleJobAction(job.id, 'start')}
                                className="p-1.5 rounded bg-navy-950 hover:bg-cyan-600/30 text-cyan-400 border border-slate-700"
                                title="Start Execution"
                              >
                                <Play className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {job.status === 'RUNNING' && (
                              <button
                                onClick={() => handleJobAction(job.id, 'pause')}
                                className="p-1.5 rounded bg-navy-950 hover:bg-amber-600/30 text-amber-400 border border-slate-700"
                                title="Pause Execution"
                              >
                                <Pause className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {job.status === 'PAUSED' && (
                              <button
                                onClick={() => handleJobAction(job.id, 'resume')}
                                className="p-1.5 rounded bg-navy-950 hover:bg-emerald-600/30 text-emerald-400 border border-slate-700"
                                title="Resume Execution"
                              >
                                <Play className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {job.status !== 'COMPLETED' && job.status !== 'CANCELLED' && (
                              <button
                                onClick={() => handleJobAction(job.id, 'stop')}
                                className="p-1.5 rounded bg-navy-950 hover:bg-rose-600/30 text-rose-400 border border-slate-700"
                                title="Stop Execution"
                              >
                                <Square className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleJobAction(job.id, 'delete')}
                              className="p-1.5 rounded bg-navy-950 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-800"
                              title="Delete Job"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab 2: Delivery Log */}
        {historyTab === 'deliveries' && (
          <div className="overflow-x-auto">
            {deliveries.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Send className="w-8 h-8 mx-auto mb-2 opacity-40 text-blue-400" />
                <p className="text-sm">No delivery events recorded yet.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono">
                    <th className="pb-3 font-semibold">RECIPIENT</th>
                    <th className="pb-3 font-semibold">STATUS</th>
                    <th className="pb-3 font-semibold">GATEWAY / PROVIDER</th>
                    <th className="pb-3 font-semibold">MESSAGE ID</th>
                    <th className="pb-3 font-semibold">PAYLOAD SNIPPET</th>
                    <th className="pb-3 font-semibold text-right">TIMESTAMP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {deliveries.map((del) => (
                    <tr key={del.id} className="hover:bg-navy-950/40 transition-colors">
                      <td className="py-2.5 font-mono text-cyan-300 font-medium">
                        {del.recipient_phone}
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            del.delivery_status === 'PROVIDER_CONFIRMED'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : del.delivery_status === 'SIMULATED_DELIVERED'
                              ? 'bg-blue-950 text-blue-300 border border-blue-800'
                              : 'bg-rose-950 text-rose-400 border border-rose-800'
                          }`}
                        >
                          {del.delivery_status}
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-300 font-mono text-[11px]">
                        {del.provider_name}
                      </td>
                      <td className="py-2.5 font-mono text-slate-400 text-[11px]">
                        {del.provider_message_id}
                      </td>
                      <td className="py-2.5 text-slate-400 max-w-[200px] truncate">
                        {del.message_content}
                      </td>
                      <td className="py-2.5 text-right font-mono text-slate-500 text-[11px]">
                        {new Date(del.timestamp).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
