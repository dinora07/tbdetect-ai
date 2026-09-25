import React from 'react';
import { RiskLevel } from '../../types';
import { ShieldCheck, AlertTriangle, AlertCircle, Flame } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface RiskBadgeProps {
  level: RiskLevel;
  score?: number;
  showScore?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  level,
  score,
  showScore = false,
  size = 'md',
}) => {
  const { t } = useLanguage();

  const config = {
    LOW: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/20',
      icon: ShieldCheck,
      label: t.common.low,
      dot: 'bg-emerald-500',
    },
    MODERATE: {
      bg: 'bg-amber-50 text-amber-800 border-amber-200 ring-amber-500/20',
      icon: AlertTriangle,
      label: t.common.moderate,
      dot: 'bg-amber-500',
    },
    HIGH: {
      bg: 'bg-orange-50 text-orange-800 border-orange-200 ring-orange-500/20',
      icon: AlertCircle,
      label: t.common.high,
      dot: 'bg-orange-500',
    },
    CRITICAL: {
      bg: 'bg-rose-50 text-rose-800 border-rose-200 ring-rose-500/20',
      icon: Flame,
      label: t.common.critical,
      dot: 'bg-rose-500 animate-pulse',
    },
  }[level] || {
    bg: 'bg-slate-50 text-slate-700 border-slate-200 ring-slate-500/20',
    icon: ShieldCheck,
    label: level,
    dot: 'bg-slate-400',
  };

  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs font-semibold px-2.5 py-1 gap-1.5',
    lg: 'text-sm font-semibold px-3 py-1.5 gap-2',
  }[size];

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-2xs font-medium tracking-tight ${config.bg} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <Icon className={iconSizes} />
      <span>{config.label}</span>
      {showScore && score !== undefined && (
        <span className="ml-0.5 opacity-85 font-mono">({score}%)</span>
      )}
    </span>
  );
};
