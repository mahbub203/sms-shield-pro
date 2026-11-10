import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertOctagon,
  LogOut,
  User as UserIcon,
  Clock,
  KeyRound,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  activeTab: string;
  emergencyMode: boolean;
  onToggleEmergencyMode: (enabled: boolean) => void;
  onOpenLoginModal: () => void;
}

const titlesMap: Record<string, { title: string; subtitle: string }> = {
  overview: {
    title: 'Security Operations Center',
    subtitle: 'Global SMS threat activity, detection telemetry & KPIs'
  },
  'testing-lab': {
    title: 'SMS Testing Lab',
    subtitle: 'High-fidelity sandboxed SMS simulation & stress-testing environment'
  },
  detection: {
    title: 'Multi-Layer Spam Detection Engine',
    subtitle: 'Heuristic rules, statistical velocity & ML-driven SMS inspection'
  },
  protection: {
    title: 'Protection Center & Policy Enforcement',
    subtitle: 'Dynamic allowlists, blocklists, sliding rate limits & emergency lockdown'
  },
  'threat-monitoring': {
    title: 'Real-Time Threat Monitoring',
    subtitle: 'Live stream of intercepted phishing vectors and high-risk SMS events'
  },
  analytics: {
    title: 'Intelligence & Performance Analytics',
    subtitle: 'Threat category distributions, sender reputation & latency percentiles'
  },
  reports: {
    title: 'Compliance & Threat Reports',
    subtitle: 'Executive summaries, classification audits & downloadable PDF/CSV artifacts'
  },
  settings: {
    title: 'System Settings & Defense Thresholds',
    subtitle: 'Risk score sensitivities, rate limiting parameters & operational policies'
  }
};

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  emergencyMode,
  onToggleEmergencyMode,
  onOpenLoginModal
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const meta = titlesMap[activeTab] || titlesMap.overview;

  return (
    <header className="h-16 bg-navy-900/90 backdrop-blur-md border-b border-slate-800/80 px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Title & Section Subtitle */}
      <div>
        <h2 className="text-base font-bold text-white tracking-wide">{meta.title}</h2>
        <p className="text-xs text-slate-400 hidden sm:block">{meta.subtitle}</p>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Real-time UTC Clock */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400 font-mono bg-navy-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>{time}</span>
        </div>

        {/* Emergency Lockdown Toggle */}
        <button
          onClick={() => onToggleEmergencyMode(!emergencyMode)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
            emergencyMode
              ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-glow-danger animate-pulse'
              : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700'
          }`}
          title="Emergency mode strictly halts or quarantines messages from unknown senders"
        >
          {emergencyMode ? (
            <>
              <AlertOctagon className="w-4 h-4 text-white" />
              <span>LOCKDOWN ACTIVE</span>
            </>
          ) : (
            <>
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Emergency Mode</span>
            </>
          )}
        </button>

        {/* Documentation Link */}
        <a
          href="/docs"
          target="_blank"
          rel="noreferrer"
          className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-cyan-300 hover:bg-slate-800/60 border border-slate-800 transition-colors"
          title="View OpenAPI / Swagger interactive documentation"
        >
          <span>API Docs</span>
          <ExternalLink className="w-3 h-3" />
        </a>

        {/* User Auth Info */}
        {isAuthenticated && user ? (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="flex items-center gap-2 bg-navy-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
              <div className="w-6 h-6 rounded-full bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-300 text-xs font-bold">
                {user.full_name.charAt(0)}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-medium text-slate-200 leading-tight">{user.full_name}</p>
                <span className="text-[10px] uppercase font-mono text-cyan-400">{user.role}</span>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenLoginModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-medium transition-all shadow-glow-cyan"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>SecOps Login</span>
          </button>
        )}
      </div>
    </header>
  );
};
