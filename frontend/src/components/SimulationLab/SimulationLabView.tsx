import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  Play,
  RotateCw,
  CheckCircle,
  AlertOctagon,
  Clock,
  ShieldAlert,
  ShieldCheck,
  ChevronRight,
  Eye,
  Sliders,
  Radio
} from 'lucide-react';
import { api } from '../../services/api';
import { SimulationScenario, SimulationSession, MessageItem } from '../../types';
import { RiskBadge } from '../Common/RiskBadge';

export const SimulationLabView: React.FC = () => {
  const [scenarios, setScenarios] = useState<SimulationScenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<string>('mixed');
  const [sessionName, setSessionName] = useState<string>('Simulated Threat Influx 1');
  const [messageCount, setMessageCount] = useState<number>(15);
  const [frequency, setFrequency] = useState<number>(2.0);

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [activeSession, setActiveSession] = useState<SimulationSession | null>(null);
  const [pastSessions, setPastSessions] = useState<SimulationSession[]>([]);

  // Modal for viewing session messages
  const [selectedSessionMessages, setSelectedSessionMessages] = useState<MessageItem[] | null>(null);
  const [isViewingMessages, setIsViewingMessages] = useState<boolean>(false);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);

  const loadScenariosAndSessions = async () => {
    try {
      const [scList, sessList] = await Promise.all([
        api.getScenarios(),
        api.getSimulationSessions()
      ]);
      setScenarios(scList);
      setPastSessions(sessList);
    } catch (err) {
      console.error('Error loading simulation lab data:', err);
    }
  };

  useEffect(() => {
    loadScenariosAndSessions();
  }, []);

  const handleStartSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRunning(true);
    try {
      const session = await api.startSimulation(
        sessionName,
        selectedScenario,
        messageCount,
        frequency
      );
      setActiveSession(session);
      // Refresh list
      const sessList = await api.getSimulationSessions();
      setPastSessions(sessList);
    } catch (err: any) {
      alert(`Simulation error: ${err.message || 'Execution failed'}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleInspectSession = async (session: SimulationSession) => {
    setIsViewingMessages(true);
    setLoadingMessages(true);
    try {
      const msgs = await api.getSessionMessages(session.id);
      setSelectedSessionMessages(msgs);
    } catch (err) {
      console.error('Failed to load session messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Simulation Notice */}
      <div className="bg-navy-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Safe Sandboxed SMS Simulation Lab</h3>
            <p className="text-xs text-slate-400">
              Generate realistic spam vectors, bank phishing campaigns, and bulk burst floods to validate detection thresholds.
            </p>
          </div>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          AIR-GAPPED SIMULATION
        </span>
      </div>

      {/* Main Grid: Control Panel (1/3) & Telemetry / History (2/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Simulation Configuration Form */}
        <div className="rounded-xl bg-navy-900 border border-slate-800 p-5 shadow-card space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <h4 className="text-sm font-bold text-white tracking-wide">Test Scenario Parameters</h4>
          </div>

          <form onSubmit={handleStartSimulation} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Session Identifier</label>
              <input
                type="text"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                required
                className="w-full bg-navy-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Threat Scenario Vector</label>
              <select
                value={selectedScenario}
                onChange={(e) => setSelectedScenario(e.target.value)}
                className="w-full bg-navy-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              >
                {scenarios.map((sc) => (
                  <option key={sc.id} value={sc.id}>
                    {sc.name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                {scenarios.find((s) => s.id === selectedScenario)?.description}
              </p>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Message Volume:</span>
                <span className="font-mono text-cyan-400 font-bold">{messageCount} SMS</span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                step="5"
                value={messageCount}
                onChange={(e) => setMessageCount(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                <span>5 (Quick test)</span>
                <span>25 (Standard)</span>
                <span>50 (Stress burst)</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Injection Frequency:</span>
                <span className="font-mono text-cyan-400 font-bold">{frequency} msg/sec</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="10"
                step="0.5"
                value={frequency}
                onChange={(e) => setFrequency(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                <span>0.5/s (Gentle)</span>
                <span>5/s (Medium)</span>
                <span>10/s (High velocity)</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isRunning}
              className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs tracking-wider uppercase transition-all shadow-glow-cyan flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isRunning ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Processing Stream...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>Execute Simulation Run</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Section: Active Telemetry & History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active / Latest Session Telemetry Banner */}
          {activeSession && (
            <div className="rounded-xl bg-gradient-to-br from-navy-900 to-navy-950 border border-cyan-500/30 p-5 shadow-card space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Latest Session Telemetry: {activeSession.name}
                  </h4>
                </div>
                <button
                  onClick={() => handleInspectSession(activeSession)}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspect Batch Payloads</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
                <div className="p-2.5 rounded-lg bg-navy-950 border border-slate-800/80">
                  <p className="text-[10px] text-slate-400 uppercase">Processed</p>
                  <p className="text-lg font-mono font-bold text-white">{activeSession.total_processed}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-navy-950 border border-slate-800/80">
                  <p className="text-[10px] text-amber-400 uppercase">Spam Identified</p>
                  <p className="text-lg font-mono font-bold text-amber-300">{activeSession.total_spam}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-navy-950 border border-slate-800/80">
                  <p className="text-[10px] text-rose-400 uppercase">Phishing Vectors</p>
                  <p className="text-lg font-mono font-bold text-rose-300">{activeSession.total_phishing}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-navy-950 border border-slate-800/80">
                  <p className="text-[10px] text-rose-400 uppercase">Blocked Senders</p>
                  <p className="text-lg font-mono font-bold text-rose-400">{activeSession.total_blocked}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-navy-950 border border-slate-800/80">
                  <p className="text-[10px] text-cyan-400 uppercase">Avg Latency</p>
                  <p className="text-lg font-mono font-bold text-cyan-300">{activeSession.avg_latency_ms} ms</p>
                </div>
              </div>
            </div>
          )}

          {/* Past Simulation Sessions Table */}
          <div className="rounded-xl bg-navy-900 border border-slate-800 p-5 shadow-card">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-white tracking-wide">Simulation Execution History</h4>
                <p className="text-xs text-slate-400">Past test sessions and detection breakdown</p>
              </div>
              <button
                onClick={loadScenariosAndSessions}
                className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
                title="Refresh sessions"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800/60 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Session Name</th>
                    <th className="py-2.5 px-3">Scenario</th>
                    <th className="py-2.5 px-3 text-center">Volume</th>
                    <th className="py-2.5 px-3 text-center">Spam / Phish</th>
                    <th className="py-2.5 px-3 text-center">Blocked</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {pastSessions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No previous test sessions executed. Configure parameters to launch a run.
                      </td>
                    </tr>
                  ) : (
                    pastSessions.map((sess) => (
                      <tr key={sess.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-3 font-medium text-white">{sess.name}</td>
                        <td className="py-2.5 px-3">
                          <span className="font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded text-[11px] border border-cyan-800/30">
                            {sess.scenario}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-300">
                          {sess.total_processed}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono">
                          <span className="text-amber-400">{sess.total_spam}</span> /{' '}
                          <span className="text-rose-400 font-bold">{sess.total_phishing}</span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-rose-400">
                          {sess.total_blocked}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => handleInspectSession(sess)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded transition-colors"
                          >
                            <span>Inspect</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Inspect Generated Messages for a Session */}
      {isViewingMessages && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-3xl max-h-[85vh] rounded-2xl bg-navy-900 border border-slate-700 p-6 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white">Simulated Session Messages</h3>
                <p className="text-xs text-slate-400">Individual payloads and multi-layer detection decisions</p>
              </div>
              <button
                onClick={() => setIsViewingMessages(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto mt-4 space-y-3 pr-1">
              {loadingMessages ? (
                <div className="py-12 text-center text-slate-400">Loading batch messages...</div>
              ) : !selectedSessionMessages || selectedSessionMessages.length === 0 ? (
                <div className="py-12 text-center text-slate-500">No messages found for this session.</div>
              ) : (
                selectedSessionMessages.map((msg) => (
                  <div key={msg.id} className="p-3.5 rounded-lg bg-navy-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-cyan-300">{msg.raw_sender}</span>
                        <RiskBadge
                          level={msg.detection_result?.risk_level || 'SAFE'}
                          score={msg.risk_score}
                          size="sm"
                        />
                      </div>
                      <span className="font-mono text-[11px] text-slate-400">
                        {msg.detection_result?.processing_time_ms} ms
                      </span>
                    </div>

                    <p className="text-xs text-slate-200 bg-slate-900/60 p-2.5 rounded border border-slate-800/60 font-mono">
                      {msg.content}
                    </p>

                    {msg.detection_result?.matched_rules && msg.detection_result.matched_rules.length > 0 && (
                      <div className="text-[11px] text-slate-400 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-500">Matched Rules:</span>
                        <ul className="list-disc list-inside text-rose-300/90 space-y-0.5">
                          {msg.detection_result.matched_rules.map((rule, idx) => (
                            <li key={idx}>{rule}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
