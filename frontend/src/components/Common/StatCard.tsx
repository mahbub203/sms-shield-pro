import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: string;
  isPositive?: boolean;
  icon: LucideIcon;
  accentColor?: 'cyan' | 'blue' | 'red' | 'amber' | 'emerald';
  badgeText?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  change,
  isPositive,
  icon: Icon,
  accentColor = 'cyan',
  badgeText
}) => {
  const colorMap = {
    cyan: {
      border: 'hover:border-cyan-500/40',
      iconBg: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
      glow: 'group-hover:shadow-[0_0_25px_-5px_rgba(6,182,212,0.25)]'
    },
    blue: {
      border: 'hover:border-blue-500/40',
      iconBg: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
      glow: 'group-hover:shadow-[0_0_25px_-5px_rgba(59,130,246,0.25)]'
    },
    red: {
      border: 'hover:border-rose-500/40',
      iconBg: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
      glow: 'group-hover:shadow-[0_0_25px_-5px_rgba(244,63,94,0.25)]'
    },
    amber: {
      border: 'hover:border-amber-500/40',
      iconBg: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      glow: 'group-hover:shadow-[0_0_25px_-5px_rgba(245,158,11,0.25)]'
    },
    emerald: {
      border: 'hover:border-emerald-500/40',
      iconBg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      glow: 'group-hover:shadow-[0_0_25px_-5px_rgba(16,185,129,0.25)]'
    }
  };

  const scheme = colorMap[accentColor];

  return (
    <div className={`group relative overflow-hidden rounded-xl bg-navy-900/90 border border-slate-800/90 p-5 transition-all duration-200 shadow-card ${scheme.border} ${scheme.glow}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold tracking-tight text-white font-mono">{value}</h3>
            {badgeText && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-cyan-400 border border-cyan-500/30">
                {badgeText}
              </span>
            )}
          </div>
        </div>
        <div className={`p-3 rounded-lg ${scheme.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {(subtitle || change) && (
        <div className="mt-3 flex items-center justify-between text-xs border-t border-slate-800/60 pt-2.5">
          {subtitle && <span className="text-slate-400 truncate max-w-[170px]">{subtitle}</span>}
          {change && (
            <span className={`font-medium ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {change}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
