import React from 'react';
import {
  LayoutDashboard,
  SendHorizontal,
  CalendarClock,
  FlaskConical,
  Scan,
  ShieldCheck,
  Activity,
  BarChart3,
  FileText,
  Settings,
  ShieldAlert,
  Radio,
  Lock
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  emergencyMode: boolean;
}

interface NavItem {
  id: string;
  label: string;
  icon: any;
  badge?: string;
  isLive?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  emergencyMode
}) => {
  const navSections: NavSection[] = [
    {
      title: 'Operations',
      items: [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'automation-center', label: 'SMS Automation Center', icon: SendHorizontal, badge: 'PRO' },
        { id: 'automation-scheduler', label: 'Automation Scheduler', icon: CalendarClock },
        { id: 'testing-lab', label: 'SMS Testing Lab', icon: FlaskConical },
      ]
    },
    {
      title: 'Cybersecurity Defense',
      items: [
        { id: 'detection', label: 'Spam Detection', icon: Scan },
        { id: 'protection', label: 'Protection Center', icon: ShieldCheck },
        { id: 'threat-monitoring', label: 'Threat Monitoring', icon: Activity, isLive: true },
      ]
    },
    {
      title: 'Intelligence & Admin',
      items: [
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        { id: 'reports', label: 'Reports', icon: FileText },
        { id: 'settings', label: 'Settings', icon: Settings },
      ]
    }
  ];

  return (
    <aside className="w-64 bg-navy-900 border-r border-slate-800/80 flex flex-col h-screen fixed left-0 top-0 z-30 select-none">
      {/* Brand Header */}
      <div className="h-16 px-5 border-b border-slate-800/80 flex items-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-sky-400 p-0.5 flex items-center justify-center shadow-glow-cyan">
            <div className="w-full h-full bg-navy-950 rounded-[10px] flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
          </span>
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="font-bold text-base tracking-wider text-white">SMS SHIELD</h1>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/50">PRO</span>
          </div>
          <p className="text-[11px] text-slate-400">Cybersecurity & Automation</p>
        </div>
      </div>

      {/* Emergency Mode Alert Strip */}
      {emergencyMode && (
        <div className="mx-3 mt-3 px-3 py-2 rounded-lg bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2">
          <Lock className="w-4 h-4 text-rose-400 animate-pulse flex-shrink-0" />
          <span className="font-medium text-[11px] leading-tight">EMERGENCY LOCKDOWN ACTIVE</span>
        </div>
      )}

      {/* Navigation Links Grouped by Section */}
      <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
        {navSections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              {section.title}
            </div>
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-lg text-xs font-medium transition-all duration-150 text-left ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/15 via-blue-500/10 to-transparent text-cyan-300 border-l-2 border-cyan-400 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/40 font-bold">
                      {item.badge}
                    </span>
                  )}
                  {item.isLive && (
                    <span className="ml-auto flex items-center gap-1 text-[10px] text-rose-400 bg-rose-950/50 px-1.5 py-0.5 rounded border border-rose-800/30 font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                      LIVE
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Security Status Footprint */}
      <div className="p-3 border-t border-slate-800/80 bg-navy-950/60">
        <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              Engine & Worker
            </span>
            <span className="text-emerald-400 font-mono text-[11px] font-semibold">ONLINE</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
            <div className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full w-[98.7%]" />
          </div>
          <p className="text-[10px] text-slate-500 mt-1.5 flex justify-between">
            <span>Accuracy: 98.7%</span>
            <span>v1.2.0 PRO</span>
          </p>
        </div>
      </div>
    </aside>
  );
};
