import React from 'react';
import { ShieldAlert, ShieldCheck, AlertTriangle, ShieldX } from 'lucide-react';
import { RiskLevel } from '../../types';

interface RiskBadgeProps {
  level: RiskLevel | string;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, score, size = 'md' }) => {
  let bg = 'bg-slate-800 text-slate-300 border-slate-700';
  let Icon = ShieldCheck;
  let text = level;

  switch (level) {
    case 'SAFE':
      bg = 'bg-emerald-950/70 text-emerald-300 border-emerald-500/30';
      Icon = ShieldCheck;
      text = 'SAFE';
      break;
    case 'SUSPICIOUS':
      bg = 'bg-amber-950/70 text-amber-300 border-amber-500/30';
      Icon = AlertTriangle;
      text = 'SUSPICIOUS';
      break;
    case 'HIGH_RISK':
      bg = 'bg-orange-950/70 text-orange-300 border-orange-500/30';
      Icon = AlertTriangle;
      text = 'HIGH RISK';
      break;
    case 'PHISHING_THREAT':
    case 'CRITICAL_BLOCKED':
      bg = 'bg-rose-950/80 text-rose-300 border-rose-500/40 shadow-glow-danger';
      Icon = ShieldAlert;
      text = level === 'CRITICAL_BLOCKED' ? 'BLOCKED' : 'PHISHING THREAT';
      break;
    case 'EMERGENCY_LOCKDOWN_HELD':
      bg = 'bg-red-950/90 text-red-200 border-red-500/50';
      Icon = ShieldX;
      text = 'LOCKDOWN HELD';
      break;
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-semibold',
    lg: 'px-3 py-1.5 text-sm font-semibold'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${bg} ${sizeClasses[size]}`}>
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{text}</span>
      {typeof score === 'number' && (
        <span className="opacity-75 font-mono text-[11px] ml-0.5">({Math.round(score)})</span>
      )}
    </span>
  );
};
