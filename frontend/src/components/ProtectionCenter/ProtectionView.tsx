import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Plus,
  Trash2,
  AlertOctagon,
  Lock,
  Unlock,
  Sliders,
  CheckCircle,
  RotateCw,
  Search
} from 'lucide-react';
import { api } from '../../services/api';
import { BlockedSender, AllowedSender, ProtectionStatus } from '../../types';

interface ProtectionViewProps {
  emergencyMode: boolean;
  onToggleEmergencyMode: (enabled: boolean) => void;
}

export const ProtectionView: React.FC<ProtectionViewProps> = ({
  emergencyMode,
  onToggleEmergencyMode
}) => {
  const [status, setStatus] = useState<ProtectionStatus | null>(null);
  const [blocklist, setBlocklist] = useState<BlockedSender[]>([]);
  const [allowlist, setAllowlist] = useState<AllowedSender[]>([]);

  // Add Block modal / inputs
  const [blockPattern, setBlockPattern] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [isAddingBlock, setIsAddingBlock] = useState(false);

  // Add Allow modal / inputs
  const [allowPattern, setAllowPattern] = useState('');
  const [allowDesc, setAllowDesc] = useState('');
  const [isAddingAllow, setIsAddingAllow] = useState(false);

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = async () => {
    try {
      const [st, bl, al] = await Promise.all([
        api.getProtectionStatus(),
        api.getBlocklist(),
        api.getAllowlist()
      ]);
      setStatus(st);
      setBlocklist(bl);
      setAllowlist(al);
    } catch (err) {
      console.error('Failed to load protection settings:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockPattern.trim()) return;
    try {
      await api.addToBlocklist(blockPattern.trim(), blockReason.trim() || 'Manual Security Block');
      setBlockPattern('');
      setBlockReason('');
      setIsAddingBlock(false);
      loadData();
    } catch (err: any) {
      alert(`Error adding to blocklist: ${err.message}`);
    }
  };

  const handleDeleteBlock = async (id: number) => {
    if (!confirm('Remove sender pattern from active blocklist?')) return;
    try {
      await api.removeFromBlocklist(id);
      loadData();
    } catch (err: any) {
      alert(`Error removing blocklist entry: ${err.message}`);
    }
  };

  const handleAddAllow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allowPattern.trim()) return;
    try {
      await api.addToAllowlist(allowPattern.trim(), allowDesc.trim() || 'Verified Gateway');
      setAllowPattern('');
      setAllowDesc('');
      setIsAddingAllow(false);
      loadData();
    } catch (err: any) {
      alert(`Error adding to allowlist: ${err.message}`);
    }
  };

  const handleDeleteAllow = async (id: number) => {
    if (!confirm('Remove sender from verified allowlist?')) return;
    try {
      await api.removeFromAllowlist(id);
      loadData();
    } catch (err: any) {
      alert(`Error removing allowlist entry: ${err.message}`);
    }
  };

  const filteredBlocklist = blocklist.filter(
    (b) =>
      b.pattern.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAllowlist = allowlist.filter(
    (a) =>
      a.pattern.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Emergency Mode Banner */}
      <div
        className={`rounded-xl border p-5 transition-all ${
          emergencyMode
            ? 'bg-rose-950/70 border-rose-500/60 shadow-glow-danger'
            : 'bg-navy-900 border-slate-800 shadow-card'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className={`p-3 rounded-xl border ${
                emergencyMode
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {emergencyMode ? <Lock className="w-6 h-6" /> : <Unlock className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-wide">
                  Emergency Defense Lockdown Mode
                </h3>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider ${
                    emergencyMode
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {emergencyMode ? 'ACTIVE LOCKDOWN' : 'STANDBY'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {emergencyMode
                  ? 'High-threat incident containment active. All SMS from unregistered or unverified senders are strictly quarantined or blocked.'
                  : 'Normal multi-layer filtering posture. Standard rule heuristics, statistical rate limits, and ML classification are active.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => onToggleEmergencyMode(!emergencyMode)}
            className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition-all shadow-sm ${
              emergencyMode
                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-glow-cyan'
            }`}
          >
            {emergencyMode ? 'Disengage Lockdown' : 'Activate Lockdown'}
          </button>
        </div>
      </div>

      {/* Policy Statistics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-navy-900 border border-slate-800 shadow-card flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider">Active Blocklist</p>
            <p className="text-2xl font-bold font-mono text-rose-400">{blocklist.length} Patterns</p>
          </div>
          <div className="p-3 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-navy-900 border border-slate-800 shadow-card flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider">Verified Allowlist</p>
            <p className="text-2xl font-bold font-mono text-emerald-400">{allowlist.length} Senders</p>
          </div>
          <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-navy-900 border border-slate-800 shadow-card flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider">Velocity Rate Limit</p>
            <p className="text-2xl font-bold font-mono text-cyan-400">
              {status?.rate_limit_per_minute || 5} msgs / min
            </p>
          </div>
          <div className="p-3 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Sliders className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search Bar for Tables */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter blocklist and allowlist entries by phone number or keyword..."
          className="w-full bg-navy-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono"
        />
      </div>

      {/* Blocklist and Allowlist 2-Column Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Blocklist Column */}
        <div className="rounded-xl bg-navy-900 border border-slate-800 p-5 shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">Sender Blocklist Rules</h3>
              <p className="text-xs text-slate-400">Exact phone numbers or wildcard patterns to reject</p>
            </div>
            <button
              onClick={() => setIsAddingBlock(!isAddingBlock)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-950 text-rose-300 border border-rose-700/50 hover:bg-rose-900/60 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Pattern</span>
            </button>
          </div>

          {/* Inline Add Block Form */}
          {isAddingBlock && (
            <form onSubmit={handleAddBlock} className="p-3.5 rounded-lg bg-navy-950 border border-rose-500/30 space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Pattern / Number (e.g. +1800555* or +12025550199)
                </label>
                <input
                  type="text"
                  value={blockPattern}
                  onChange={(e) => setBlockPattern(e.target.value)}
                  placeholder="+1888*"
                  required
                  className="w-full bg-navy-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Reason / Threat Signature</label>
                <input
                  type="text"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Suspected wire scam campaign"
                  className="w-full bg-navy-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingBlock(false)}
                  className="px-3 py-1 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 rounded-md text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white"
                >
                  Save Rule
                </button>
              </div>
            </form>
          )}

          {/* Blocklist Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800/60 font-semibold">
                <tr>
                  <th className="py-2 px-3">Pattern</th>
                  <th className="py-2 px-3">Reason</th>
                  <th className="py-2 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {filteredBlocklist.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-slate-500">
                      No matching blocked patterns.
                    </td>
                  </tr>
                ) : (
                  filteredBlocklist.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-rose-300">{item.pattern}</td>
                      <td className="py-2.5 px-3 text-slate-300 max-w-xs truncate" title={item.reason}>
                        {item.reason}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handleDeleteBlock(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                          title="Unblock pattern"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Allowlist Column */}
        <div className="rounded-xl bg-navy-900 border border-slate-800 p-5 shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">Verified Allowlist Senders</h3>
              <p className="text-xs text-slate-400">Trusted gateways and bypass routes (e.g. 2FA, OTPs)</p>
            </div>
            <button
              onClick={() => setIsAddingAllow(!isAddingAllow)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-700/50 hover:bg-emerald-900/60 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Verified</span>
            </button>
          </div>

          {/* Inline Add Allow Form */}
          {isAddingAllow && (
            <form onSubmit={handleAddAllow} className="p-3.5 rounded-lg bg-navy-950 border border-emerald-500/30 space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Pattern / Phone Number (e.g. +18005550100)
                </label>
                <input
                  type="text"
                  value={allowPattern}
                  onChange={(e) => setAllowPattern(e.target.value)}
                  placeholder="+18005550100"
                  required
                  className="w-full bg-navy-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Service Description</label>
                <input
                  type="text"
                  value={allowDesc}
                  onChange={(e) => setAllowDesc(e.target.value)}
                  placeholder="Verified GitHub Security 2FA Gateway"
                  className="w-full bg-navy-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingAllow(false)}
                  className="px-3 py-1 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 rounded-md text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  Save Verified
                </button>
              </div>
            </form>
          )}

          {/* Allowlist Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800/60 font-semibold">
                <tr>
                  <th className="py-2 px-3">Pattern</th>
                  <th className="py-2 px-3">Description</th>
                  <th className="py-2 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {filteredAllowlist.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-slate-500">
                      No verified allowlist patterns found.
                    </td>
                  </tr>
                ) : (
                  filteredAllowlist.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-300">{item.pattern}</td>
                      <td className="py-2.5 px-3 text-slate-300 max-w-xs truncate" title={item.description}>
                        {item.description}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handleDeleteAllow(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                          title="Remove from allowlist"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
  );
};
