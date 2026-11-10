import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Radio,
  TrendingDown,
  Activity,
  Lock,
  Layers,
  ArrowUpRight,
  RefreshCw
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { api } from '../../services/api';
import { DashboardMetrics, ThreatTimelineItem, RiskDistributionItem, SecurityEvent } from '../../types';
import { StatCard } from '../Common/StatCard';
import { RiskBadge } from '../Common/RiskBadge';

interface DashboardViewProps {
  onNavigateTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigateTab }) => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [timeline, setTimeline] = useState<ThreatTimelineItem[]>([]);
  const [distribution, setDistribution] = useState<RiskDistributionItem[]>([]);
  const [recentEvents, setRecentEvents] = useState<SecurityEvent[]>([]);
  const [daysFilter, setDaysFilter] = useState<number>(7);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchData = async () => {
    try {
      setIsRefreshing(true);
      const [m, t, d, e] = await Promise.all([
        api.getDashboardMetrics(),
        api.getThreatTimeline(daysFilter),
        api.getRiskDistribution(),
        api.getRecentEvents(6)
      ]);
      setMetrics(m);
      setTimeline(t);
      setDistribution(d);
      setRecentEvents(e);
    } catch (err) {
      console.error('Error fetching dashboard telemetry:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [daysFilter]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
        <p className="text-sm text-slate-400 font-mono tracking-wide">Syncing cybersecurity telemetry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Notice: Sandbox Indicator */}
      <div className="bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-navy-900 border border-cyan-500/20 rounded-xl px-5 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Active Telemetry & Multi-Layer AI Defense</h4>
            <p className="text-xs text-slate-400">
              Live traffic, threat heuristics, and real-time behavioral surveillance operating within authorized parameters.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700 transition-colors border border-slate-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Grid (6 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Messages"
          value={metrics?.total_messages.toLocaleString() || '0'}
          subtitle="Ingested traffic"
          icon={Radio}
          accentColor="blue"
        />
        <StatCard
          title="Spam Detected"
          value={metrics?.spam_detected.toLocaleString() || '0'}
          subtitle={`Spam rate: ${metrics?.spam_rate_pct || 0}%`}
          icon={AlertTriangle}
          accentColor="amber"
          badgeText="FLAGGED"
        />
        <StatCard
          title="Phishing Attempts"
          value={metrics?.phishing_attempts.toLocaleString() || '0'}
          subtitle="Critical vectors"
          icon={ShieldAlert}
          accentColor="red"
          badgeText="INTERCEPTED"
        />
        <StatCard
          title="High-Risk Events"
          value={metrics?.high_risk_events.toLocaleString() || '0'}
          subtitle="Threshold breaches"
          icon={Activity}
          accentColor="red"
        />
        <StatCard
          title="Protected Senders"
          value={metrics?.protected_senders.toLocaleString() || '0'}
          subtitle={`${metrics?.blocked_senders_count || 0} blocked`}
          icon={ShieldCheck}
          accentColor="emerald"
        />
        <StatCard
          title="Engine Accuracy"
          value={`${metrics?.detection_accuracy || 98.7}%`}
          subtitle="Held-out F1: 0.986"
          icon={Layers}
          accentColor="cyan"
          badgeText="TRAINED"
        />
      </div>

      {/* Interactive Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Threat Activity Timeline (2 cols) */}
        <div className="lg:col-span-2 rounded-xl bg-navy-900 border border-slate-800 p-5 shadow-card">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">Threat Ingestion & Classification Activity</h3>
              <p className="text-xs text-slate-400">Volume distribution of analyzed SMS traffic over time</p>
            </div>
            {/* Date Filter Tabs */}
            <div className="flex items-center gap-1 bg-navy-950 p-1 rounded-lg border border-slate-800 text-xs font-medium">
              {[7, 14, 30].map((d) => (
                <button
                  key={d}
                  onClick={() => setDaysFilter(d)}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    daysFilter === d
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {d}D
                </button>
              ))}
            </div>
          </div>

          <div className="h-72 mt-4 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPhishing" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorSpam" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorSafe" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0b1120',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
                  }}
                  itemStyle={{ color: '#cbd5e1' }}
                />
                <Area
                  type="monotone"
                  dataKey="phishing"
                  name="Phishing Threats"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorPhishing)"
                />
                <Area
                  type="monotone"
                  dataKey="spam"
                  name="Suspicious Spam"
                  stroke="#f59e0b"
                  strokeWidth={1.5}
                  fillOpacity={1}
                  fill="url(#colorSpam)"
                />
                <Area
                  type="monotone"
                  dataKey="safe"
                  name="Safe / Legitimate"
                  stroke="#06b6d4"
                  strokeWidth={1.5}
                  fillOpacity={1}
                  fill="url(#colorSafe)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center gap-6 mt-3 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Phishing Threats</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Suspicious Spam</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <span>Safe Verified</span>
            </span>
          </div>
        </div>

        {/* Risk Distribution Donut (1 col) */}
        <div className="rounded-xl bg-navy-900 border border-slate-800 p-5 shadow-card flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">Threat Severity Distribution</h3>
            <p className="text-xs text-slate-400">Proportional risk tier breakdown</p>
          </div>

          <div className="h-52 w-full my-auto flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="count"
                >
                  {distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#070b14" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0b1120',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            {distribution.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-slate-300">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span>{item.name}</span>
                </span>
                <span className="font-mono text-slate-400 font-medium">
                  {item.count} <span className="opacity-60">({item.percentage}%)</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Security Events & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Events Table (2 cols) */}
        <div className="lg:col-span-2 rounded-xl bg-navy-900 border border-slate-800 p-5 shadow-card">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">Recent Security Events & Interceptions</h3>
              <p className="text-xs text-slate-400">High-priority alerts logged by multi-layer detection</p>
            </div>
            <button
              onClick={() => onNavigateTab('threat-monitoring')}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
            >
              <span>View All Events</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800/60 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Severity</th>
                  <th className="py-2.5 px-3">Sender</th>
                  <th className="py-2.5 px-3">Title / Threat Signature</th>
                  <th className="py-2.5 px-3 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {recentEvents.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500">
                      No security incidents recorded. System running normally.
                    </td>
                  </tr>
                ) : (
                  recentEvents.map((ev) => (
                    <tr key={ev.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold tracking-wider font-mono ${
                            ev.severity === 'CRITICAL'
                              ? 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
                              : ev.severity === 'HIGH'
                              ? 'bg-orange-950/80 text-orange-300 border border-orange-500/40'
                              : 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                          }`}
                        >
                          {ev.severity}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-300">{ev.sender || 'Unknown'}</td>
                      <td className="py-2.5 px-3 text-slate-300 max-w-xs truncate" title={ev.description}>
                        {ev.title}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                        {new Date(ev.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Launch & Testing Operations Card */}
        <div className="rounded-xl bg-navy-900 border border-slate-800 p-5 shadow-card space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">Quick Operations</h3>
            <p className="text-xs text-slate-400">Shortcuts to security tooling</p>
          </div>

          <div className="space-y-2.5">
            <button
              onClick={() => onNavigateTab('advanced-console')}
              className="w-full p-3 rounded-lg bg-navy-950 hover:bg-slate-800/80 border border-cyan-800/60 hover:border-cyan-500/50 text-left transition-all group flex items-start justify-between shadow-sm"
            >
              <div>
                <p className="text-xs font-semibold text-cyan-400 group-hover:text-cyan-300 transition-colors flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  Advanced Automation Console (Mode A/B)
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  High-throughput simulation engine, pacing interval controls & live activity counter
                </p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-cyan-400 transition-colors" />
            </button>

            <button
              onClick={() => onNavigateTab('automation-center')}
              className="w-full p-3 rounded-lg bg-navy-950 hover:bg-slate-800/80 border border-slate-800 text-left transition-all group flex items-start justify-between"
            >
              <div>
                <p className="text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors">
                  SMS Automation Center & Recipient Registry
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Verify recipient consent, compose Bengali/Unicode SMS, and configure jobs
                </p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
            </button>

            <button
              onClick={() => onNavigateTab('automation-scheduler')}
              className="w-full p-3 rounded-lg bg-navy-950 hover:bg-slate-800/80 border border-slate-800 text-left transition-all group flex items-start justify-between"
            >
              <div>
                <p className="text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors">
                  Automation Scheduler & Delivery Telemetry
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Monitor active jobs, cloud worker health, and carrier receipts
                </p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
            </button>

            <button
              onClick={() => onNavigateTab('testing-lab')}
              className="w-full p-3 rounded-lg bg-navy-950 hover:bg-slate-800/80 border border-slate-800 text-left transition-all group flex items-start justify-between"
            >
              <div>
                <p className="text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors">
                  Launch SMS Simulation Lab
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Inject synthetic banking, courier, and bulk spam scenarios
                </p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
            </button>

            <button
              onClick={() => onNavigateTab('detection')}
              className="w-full p-3 rounded-lg bg-navy-950 hover:bg-slate-800/80 border border-slate-800 text-left transition-all group flex items-start justify-between"
            >
              <div>
                <p className="text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors">
                  Inspect Custom SMS Payload
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Test SMS through rule heuristics and machine learning
                </p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
            </button>

            <button
              onClick={() => onNavigateTab('reports')}
              className="w-full p-3 rounded-lg bg-navy-950 hover:bg-slate-800/80 border border-slate-800 text-left transition-all group flex items-start justify-between"
            >
              <div>
                <p className="text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors">
                  Export Security Defense Report
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Download executive PDF audit or raw CSV threat records
                </p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
