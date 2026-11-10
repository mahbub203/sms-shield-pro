import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertOctagon,
  ShieldAlert,
  RotateCw,
  Search,
  Filter,
  Eye,
  Trash2,
  Clock,
  Radio,
  ExternalLink
} from 'lucide-react';
import { api } from '../../services/api';
import { SecurityEvent, MessageItem } from '../../types';
import { RiskBadge } from '../Common/RiskBadge';

export const ThreatMonitoringView: React.FC = () => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [liveFeed, setLiveFeed] = useState<MessageItem[]>([]);
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Inspector modal for single event/message
  const [inspectedMessage, setInspectedMessage] = useState<MessageItem | null>(null);

  const fetchThreatData = async () => {
    try {
      setIsRefreshing(true);
      const [evList, feedList] = await Promise.all([
        api.getThreatEvents(severityFilter, searchTerm),
        api.getLiveFeed()
      ]);
      setEvents(evList);
      setLiveFeed(feedList);
    } catch (err) {
      console.error('Failed to fetch threat telemetry:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchThreatData();
  }, [severityFilter, searchTerm]);

  // Polling loop when autoRefresh is enabled
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchThreatData();
    }, 4000);
    return () => clearInterval(interval);
  }, [autoRefresh, severityFilter, searchTerm]);

  const handleClearLogs = async () => {
    if (!confirm('Are you sure you want to clear all security event logs?')) return;
    try {
      await api.clearThreatEvents();
      fetchThreatData();
    } catch (err: any) {
      alert(`Error clearing logs: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Threat Ticker & Polling Bar */}
      <div className="bg-navy-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-card">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-wide">Live Threat Surveillance Stream</h3>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800/40">
                ACTIVE RADAR
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Continuous monitoring for credential harvest URLs, shortcode impersonation, and flood bursts
            </p>
          </div>
        </div>

        {/* Polling & Refresh Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
              autoRefresh
                ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${autoRefresh ? 'text-cyan-400 animate-pulse' : ''}`} />
            <span>Auto-Poll (4s)</span>
          </button>

          <button
            onClick={fetchThreatData}
            disabled={isRefreshing}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors disabled:opacity-50"
            title="Refresh now"
          >
            <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          <button
            onClick={handleClearLogs}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-700 transition-colors"
            title="Clear all event logs"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Live Threat Feed Carousel / Grid */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <span>Intercepted Threat Feed (Latest Hits)</span>
          <span className="font-mono text-cyan-400">{liveFeed.length} Vectors Intercepted</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {liveFeed.slice(0, 3).map((item) => (
            <div
              key={item.id}
              onClick={() => setInspectedMessage(item)}
              className="p-4 rounded-xl bg-navy-900 border border-rose-500/30 hover:border-rose-400/60 transition-all cursor-pointer shadow-card space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-rose-300">{item.raw_sender}</span>
                <RiskBadge
                  level={item.detection_result?.risk_level || 'HIGH_RISK'}
                  score={item.risk_score}
                  size="sm"
                />
              </div>
              <p className="text-xs text-slate-300 line-clamp-2 font-mono bg-navy-950 p-2 rounded border border-slate-800">
                {item.content}
              </p>
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>Action: {item.detection_result?.recommended_action || 'QUARANTINE'}</span>
                <span className="font-mono">{new Date(item.created_at).toLocaleTimeString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Events Log Card */}
      <div className="rounded-xl bg-navy-900 border border-slate-800 p-5 shadow-card space-y-4">
        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          {/* Severity Tabs */}
          <div className="flex items-center gap-1 bg-navy-950 p-1 rounded-lg border border-slate-800 text-xs font-semibold">
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-3 py-1 rounded-md transition-colors ${
                  severityFilter === sev
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter threat logs by keyword or sender..."
              className="w-full bg-navy-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>
        </div>

        {/* Security Events Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800/60 font-semibold">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Sender</th>
                <th className="py-2.5 px-3">Event Signature / Title</th>
                <th className="py-2.5 px-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {events.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    No security events matching current criteria.
                  </td>
                </tr>
              ) : (
                events.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-slate-400 whitespace-nowrap">
                      {new Date(ev.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
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
                    <td className="py-2.5 px-3 font-mono font-semibold text-cyan-300 whitespace-nowrap">
                      {ev.sender || 'Unknown'}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-white whitespace-nowrap">{ev.title}</td>
                    <td className="py-2.5 px-3 text-slate-300 max-w-md truncate" title={ev.description}>
                      {ev.description}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Message Modal */}
      {inspectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-2xl bg-navy-900 border border-slate-700 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                <h3 className="text-sm font-bold text-white">Threat Payload Telemetry</h3>
              </div>
              <button
                onClick={() => setInspectedMessage(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Originating Sender:</span>
                <span className="font-mono text-cyan-300 font-bold">{inspectedMessage.raw_sender}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Risk Evaluation:</span>
                <div className="flex items-center gap-2 mt-1">
                  <RiskBadge
                    level={inspectedMessage.detection_result?.risk_level || 'HIGH_RISK'}
                    score={inspectedMessage.risk_score}
                    size="md"
                  />
                  <span className="text-rose-400 font-mono font-bold">
                    Action: {inspectedMessage.detection_result?.recommended_action || 'BLOCK'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Raw SMS Content:</span>
                <div className="p-3 rounded-lg bg-navy-950 border border-slate-800 font-mono text-slate-200 mt-1 whitespace-pre-wrap">
                  {inspectedMessage.content}
                </div>
              </div>

              {inspectedMessage.detection_result?.matched_rules && (
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Triggered Heuristics:</span>
                  <ul className="list-disc list-inside text-rose-300 space-y-0.5 mt-1">
                    {inspectedMessage.detection_result.matched_rules.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
