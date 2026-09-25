import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
    label?: string;
  };
  variant?: 'blue' | 'teal' | 'violet' | 'amber' | 'rose' | 'emerald';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'blue',
  onClick,
}) => {
  const variantStyles = {
    blue: 'from-sky-500/10 to-blue-500/5 text-blue-700 bg-blue-50/50 border-blue-100',
    teal: 'from-teal-500/10 to-emerald-500/5 text-teal-700 bg-teal-50/50 border-teal-100',
    violet: 'from-indigo-500/10 to-violet-500/5 text-indigo-700 bg-indigo-50/50 border-indigo-100',
    amber: 'from-amber-500/10 to-orange-500/5 text-amber-700 bg-amber-50/50 border-amber-100',
    rose: 'from-rose-500/10 to-pink-500/5 text-rose-700 bg-rose-50/50 border-rose-100',
    emerald: 'from-emerald-500/10 to-teal-500/5 text-emerald-700 bg-emerald-50/50 border-emerald-100',
  }[variant];

  const iconBgStyles = {
    blue: 'bg-blue-600 text-white shadow-blue-500/20',
    teal: 'bg-teal-600 text-white shadow-teal-500/20',
    violet: 'bg-indigo-600 text-white shadow-indigo-500/20',
    amber: 'bg-amber-600 text-white shadow-amber-500/20',
    rose: 'bg-rose-600 text-white shadow-rose-500/20',
    emerald: 'bg-emerald-600 text-white shadow-emerald-500/20',
  }[variant];

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs transition-all duration-200 hover:shadow-md hover:border-slate-300 ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
            {title}
          </p>
          <p className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
            {value}
          </p>
        </div>
        <div className={`p-2.5 rounded-xl shadow-md ${iconBgStyles}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs pt-2 border-t border-slate-100">
        {subtitle && <span className="text-slate-500">{subtitle}</span>}
        {trend && (
          <div
            className={`flex items-center gap-1 font-medium ${
              trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {trend.isPositive ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" />
            )}
            <span>{trend.value}</span>
            {trend.label && <span className="text-slate-400 font-normal">{trend.label}</span>}
          </div>
        )}
      </div>
    </div>
  );
};
