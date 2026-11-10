import React, { useState, useEffect } from 'react';
import {
  CalendarClock,
  Play,
  Pause,
  RotateCw,
  XCircle,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Cpu,
  Layers,
  Send,
  ExternalLink,
  ShieldAlert,
  Server
} from 'lucide-react';
import { api } from '../../services/api';
import { AutomationJob, AutomationStats, DeliveryEvent } from '../../types';

export const SchedulerView: React.FC = () => {
  const [stats, setStats] = useState<AutomationStats | null>(null);
  const [jobs, setJobs] = useState<AutomationJob[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryEvent[]>([]);
  const [deliveryFilter, setDeliveryFilter] = useState<string>('ALL');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [autoPoll, setAutoPoll] = useState<boolean>(true);

  const fetchData = async () => {
    try {
      setIsRefreshing(true);
      const [st, jb, dl] = await Promise.all([
        api.getSchedulerStats(),
        api.getAutomationJobs(),
        api.getDeliveries(35, deliveryFilter)
      ]);
      setStats(st);
      setJobs(jb);
      setDeliveries(dl);
    } catch (err) {
      console.error('Error fetching scheduler data:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [deliveryFilter]);

  useEffect(() => {
    if (!autoPoll) return;
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, [autoPoll, deliveryFilter]);

  const handleStart = async (id: number) => {
    try {
      await api.startJob(id);
      fetchData();
    } catch (err: any) {
      alert(`Error starting job: ${err.message}`);
    }
  };

  const handlePause = async (id: number) => {
    try {
      await api.pauseJob(id);
      fetchData();
    } catch (err: any) {
      alert(`Error pausing job: ${err.message}`);
    }
  };

  const handleResume = async (id: number) => {
    try {
      await api.resumeJob(id);
      fetchData();
    } catch (err: any) {
      alert(`Error resuming job: ${err.message}`);
    }
  };

  const handleCancel = async (id: number) => {
    if (!confirm('Are you sure you want to cancel this automation job?')) return;
    try {
      await api.cancelJob(id);
      fetchData();
    } catch (err: any) {
      alert(`Error cancelling job: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Worker Health Status */}
      <div className="bg-navy-900 border border-slate-800 rounded-xl p-5 shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <CalendarClock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-wide">
                Automation Scheduler & Cloud Execution Engine
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/40 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                WORKER {stats?.worker_status || 'ACTIVE'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Independent background scheduler processing authorized SMS delivery jobs, pacing intervals, and delivery telemetry.
            </p>
          </div>
        </div>

        {/* Polling / Manual refresh */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoPoll(!autoPoll)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              autoPoll
                ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${autoPoll ? 'text-cyan-400 animate-pulse' : ''}`} />
            <span>Live Polling (4s)</span>
          </button>
          <button
            onClick={fetchData}
            disabled={isRefreshing}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors disabled:opacity-50"
          >
            <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Scheduler KPIs (6 Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl bg-navy-900 border border-slate-800 shadow-card">
          <span className="text-[10px] uppercase font-semibold text-slate-400">Total Jobs</span>
          <p className="text-xl font-bold font-mono text-white mt-1">{stats?.total_jobs || 0}</p>
        </div>
        <div className="p-3.5 rounded-xl bg-navy-900 border border-slate-800 shadow-card">
          <span className="text-[10px] uppercase font-semibold text-cyan-400">Active (Running)</span>
          <p className="text-xl font-bold font-mono text-cyan-300 mt-1">{stats?.active_jobs || 0}</p>
        </div>
        <div className="p-3.5 rounded-xl bg-navy-900 border border-slate-800 shadow-card">
          <span className="text-[10px] uppercase font-semibold text-emerald-400">Completed</span>
          <p className="text-xl font-bold font-mono text-emerald-300 mt-1">{stats?.completed_jobs || 0}</p>
        </div>
        <div className="p-3.5 rounded-xl bg-navy-900 border border-slate-800 shadow-card">
          <span className="text-[10px] uppercase font-semibold text-amber-400">Paused</span>
          <p className="text-xl font-bold font-mono text-amber-300 mt-1">{stats?.paused_jobs || 0}</p>
        </div>
        <div className="p-3.5 rounded-xl bg-navy-900 border border-slate-800 shadow-card">
          <span className="text-[10px] uppercase font-semibold text-blue-400">Simulated Sent</span>
          <p className="text-xl font-bold font-mono text-blue-300 mt-1">{stats?.total_simulated_delivered || 0}</p>
        </div>
        <div className="p-3.5 rounded-xl bg-navy-900 border border-slate-800 shadow-card">
          <span className="text-[10px] uppercase font-semibold text-purple-400">Provider Confirmed</span>
          <p className="text-xl font-bold font-mono text-purple-300 mt-1">{stats?.total_provider_confirmed || 0}</p>
        </div>
      </div>

      {/* Active Jobs Management Table */}
      <div className="rounded-xl bg-navy-900 border border-slate-800 p-5 shadow-card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">Automated SMS Jobs Queue</h3>
            <p className="text-xs text-slate-400">State machines and real-time execution controls</p>
          </div>
          <span className="text-xs text-slate-500 font-mono">{jobs.length} registered jobs</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800/60 font-semibold">
              <tr>
                <th className="py-2.5 px-3">Job Name</th>
                <th className="py-2.5 px-3">Recipient Phone</th>
                <th className="py-2.5 px-3 text-center">Progress (Sent/Total)</th>
                <th className="py-2.5 px-3 text-center">Interval</th>
                <th className="py-2.5 px-3 text-center">Mode</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No active automation jobs. Create a job in SMS Automation Center to begin.
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-medium text-white">{job.name}</td>
                    <td className="py-3 px-3 font-mono text-cyan-300">
                      {job.recipient_rel?.phone_number || `Recipient #${job.recipient_id}`}
                    </td>
                    <td className="py-3 px-3 text-center font-mono">
                      <span className="text-emerald-400 font-bold">{job.sent_count}</span> / {job.target_count}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-400">
                      {job.interval_seconds}s
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {job.execution_mode}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono tracking-wider ${
                          job.status === 'RUNNING'
                            ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 animate-pulse'
                            : job.status === 'COMPLETED'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                            : job.status === 'PAUSED'
                            ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                            : job.status === 'CANCELLED'
                            ? 'bg-slate-800 text-slate-400 border border-slate-700'
                            : 'bg-blue-950 text-blue-300 border border-blue-500/40'
                        }`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {job.status === 'PENDING' && (
                          <button
                            onClick={() => handleStart(job.id)}
                            className="p-1.5 rounded bg-cyan-950 text-cyan-300 hover:bg-cyan-900 border border-cyan-700/50"
                            title="Start Job"
                          >
                            <Play className="w-3.5 h-3.5 fill-cyan-400" />
                          </button>
                        )}
                        {job.status === 'RUNNING' && (
                          <button
                            onClick={() => handlePause(job.id)}
                            className="p-1.5 rounded bg-amber-950 text-amber-300 hover:bg-amber-900 border border-amber-700/50"
                            title="Pause Job"
                          >
                            <Pause className="w-3.5 h-3.5 fill-amber-400" />
                          </button>
                        )}
                        {job.status === 'PAUSED' && (
                          <button
                            onClick={() => handleResume(job.id)}
                            className="p-1.5 rounded bg-emerald-950 text-emerald-300 hover:bg-emerald-900 border border-emerald-700/50"
                            title="Resume Job"
                          >
                            <Play className="w-3.5 h-3.5 fill-emerald-400" />
                          </button>
                        )}
                        {job.status !== 'COMPLETED' && job.status !== 'CANCELLED' && (
                          <button
                            onClick={() => handleCancel(job.id)}
                            className="p-1.5 rounded bg-slate-800 text-rose-400 hover:bg-rose-950 border border-slate-700"
                            title="Cancel Job"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Carrier Delivery Telemetry Log */}
      <div className="rounded-xl bg-navy-900 border border-slate-800 p-5 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">Live Delivery Audit Feed</h3>
            <p className="text-xs text-slate-400">
              Carrier receipts clearly distinguishing simulated virtual deliveries from official provider-confirmed receipts
            </p>
          </div>

          <div className="flex items-center gap-1 bg-navy-950 p-1 rounded-lg border border-slate-800 text-xs font-semibold">
            {['ALL', 'SIMULATED_DELIVERED', 'PROVIDER_CONFIRMED', 'FAILED'].map((st) => (
              <button
                key={st}
                onClick={() => setDeliveryFilter(st)}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  deliveryFilter === st
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {st === 'ALL' ? 'ALL' : st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800/60 font-semibold">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Delivery Status</th>
                <th className="py-2.5 px-3">Recipient</th>
                <th className="py-2.5 px-3">Provider Gateway</th>
                <th className="py-2.5 px-3">Provider Message ID</th>
                <th className="py-2.5 px-3">Message Payload Snippet</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {deliveries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No delivery events recorded yet.
                  </td>
                </tr>
              ) : (
                deliveries.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-slate-400 whitespace-nowrap">
                      {new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          d.delivery_status === 'PROVIDER_CONFIRMED'
                            ? 'bg-purple-950/80 text-purple-300 border border-purple-500/40'
                            : d.delivery_status === 'SIMULATED_DELIVERED'
                            ? 'bg-blue-950/80 text-blue-300 border border-blue-500/40'
                            : 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        {d.is_simulated ? (
                          <span>SIMULATED VIRTUAL</span>
                        ) : (
                          <span>CONFIRMED REAL</span>
                        )}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-cyan-300 whitespace-nowrap">
                      {d.recipient_phone}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-300 whitespace-nowrap">
                      {d.provider_name}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {d.provider_message_id}
                    </td>
                    <td className="py-2.5 px-3 text-slate-200 max-w-xs truncate" title={d.message_content}>
                      {d.message_content}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
