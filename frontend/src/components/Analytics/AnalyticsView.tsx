import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Cpu,
  Clock,
  ShieldAlert,
  ShieldCheck,
  Zap,
  RotateCw,
  Layers
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { api } from '../../services/api';
import { AnalyticsOverview, SenderAnalytics } from '../../types';

export const AnalyticsView: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [senders, setSenders] = useState<SenderAnalytics[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadData = async () => {
    try {
      const [an, sn] = await Promise.all([
        api.getAnalyticsOverview(),
        api.getSenderAnalytics()
      ]);
      setAnalytics(an);
      setSenders(sn);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
        <p className="text-sm text-slate-400 font-mono tracking-wide">Compiling analytics telemetry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Latency & Processing Performance Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-navy-900 border border-slate-800 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Median Latency (p50)</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-cyan-300 mt-2">
            {analytics?.performance.p50_latency_ms || 2.4} ms
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">50th percentile execution</span>
        </div>

        <div className="p-4 rounded-xl bg-navy-900 border border-slate-800 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">95th Percentile (p95)</span>
            <Zap className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-blue-300 mt-2">
            {analytics?.performance.p95_latency_ms || 5.8} ms
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">High load response time</span>
        </div>

        <div className="p-4 rounded-xl bg-navy-900 border border-slate-800 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">99th Percentile (p99)</span>
            <Cpu className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-purple-300 mt-2">
            {analytics?.performance.p99_latency_ms || 8.2} ms
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Outlier threshold speed</span>
        </div>

        <div className="p-4 rounded-xl bg-navy-900 border border-slate-800 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Peak Throughput</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-emerald-300 mt-2">
            {analytics?.performance.peak_throughput_msgs_sec || 340} / sec
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Multi-threaded engine ceiling</span>
        </div>
      </div>

      {/* Threat Categories Breakdown Chart */}
      <div className="rounded-xl bg-navy-900 border border-slate-800 p-5 shadow-card">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">Threat Category Classification Breakdown</h3>
            <p className="text-xs text-slate-400">Distribution of ingested SMS payloads by threat typology</p>
          </div>
          <button
            onClick={loadData}
            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        <div className="h-72 mt-4 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={analytics?.threat_categories || []}
              layout="vertical"
              margin={{ top: 10, right: 20, left: 140, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
              <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis
                type="category"
                dataKey="category"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                width={130}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0b1120',
                  borderColor: '#334155',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {analytics?.threat_categories.map((entry, index) => (
                  <Cell key={`bar-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Senders Reputation & Volumetrics Table */}
      <div className="rounded-xl bg-navy-900 border border-slate-800 p-5 shadow-card space-y-4">
        <div>
          <h3 className="text-sm font-bold text-white tracking-wide">Sender Reputation & Traffic Telemetry</h3>
          <p className="text-xs text-slate-400">
            Historical trust rating, message volume, and spam propensity per telephone identity
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800/60 font-semibold">
              <tr>
                <th className="py-2.5 px-3">Sender Phone Number</th>
                <th className="py-2.5 px-3">Reputation Rating</th>
                <th className="py-2.5 px-3 text-center">Total Traffic</th>
                <th className="py-2.5 px-3 text-center">Spam Count</th>
                <th className="py-2.5 px-3 text-center">Spam Ratio</th>
                <th className="py-2.5 px-3 text-right">Last Detected</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {senders.map((s) => (
                <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-semibold text-white">
                    {s.phone_number}
                    {s.is_shortcode && (
                      <span className="ml-1.5 px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-400">
                        SHORTCODE
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            s.reputation_score >= 75
                              ? 'bg-emerald-400'
                              : s.reputation_score >= 45
                              ? 'bg-amber-400'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${s.reputation_score}%` }}
                        />
                      </div>
                      <span className="font-mono text-slate-300 font-medium">
                        {s.reputation_score}/100
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-slate-300">
                    {s.total_messages}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-rose-400">
                    {s.spam_messages}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono">
                    <span
                      className={`font-semibold ${
                        s.spam_ratio_pct > 50
                          ? 'text-rose-400'
                          : s.spam_ratio_pct > 15
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {s.spam_ratio_pct}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                    {new Date(s.last_seen_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
