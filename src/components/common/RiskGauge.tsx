import React from 'react';
import { RiskLevel } from '../../types';

interface RiskGaugeProps {
  score: number; // 0 - 100
  riskLevel: RiskLevel;
  confidence?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({
  score,
  riskLevel,
  confidence,
  size = 'md',
  showLabel = true,
}) => {
  const radius = size === 'sm' ? 36 : size === 'md' ? 56 : 72;
  const stroke = size === 'sm' ? 6 : size === 'md' ? 9 : 12;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getColor = () => {
    if (score >= 85) return { stroke: '#e11d48', text: 'text-rose-600', label: 'CRITICAL RISK', bg: 'bg-rose-500/10' };
    if (score >= 65) return { stroke: '#ea580c', text: 'text-orange-600', label: 'HIGH RISK', bg: 'bg-orange-500/10' };
    if (score >= 35) return { stroke: '#d97706', text: 'text-amber-600', label: 'MODERATE RISK', bg: 'bg-amber-500/10' };
    return { stroke: '#059669', text: 'text-emerald-600', label: 'LOW RISK', bg: 'bg-emerald-500/10' };
  };

  const config = getColor();

  const dimension = radius * 2;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative flex items-center justify-center" style={{ width: dimension, height: dimension }}>
        <svg height={dimension} width={dimension} className="rotate-[-90deg]">
          {/* Background circle */}
          <circle
            stroke="#e2e8f0"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          {/* Animated Progress circle */}
          <circle
            stroke={config.stroke}
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={circumference + ' ' + circumference}
            style={{
              strokeDashoffset,
              transition: 'stroke-dashoffset 1s ease-in-out',
              strokeLinecap: 'round',
            }}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className={`font-bold font-mono tracking-tight ${config.text} ${size === 'sm' ? 'text-lg' : size === 'md' ? 'text-2xl' : 'text-4xl'}`}>
            {score}%
          </span>
          {size !== 'sm' && (
            <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
              AI Index
            </span>
          )}
        </div>
      </div>
      {showLabel && (
        <div className="mt-2 text-center">
          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide ${config.text} ${config.bg}`}>
            {config.label}
          </span>
          {confidence !== undefined && (
            <p className="text-[11px] text-slate-500 mt-1">
              Confidence: <span className="font-semibold text-slate-700">{(confidence * 100).toFixed(0)}%</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
};
