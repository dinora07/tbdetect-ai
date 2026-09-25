import React from 'react';
import { ScreeningStatus, TreatmentStatus } from '../../types';

interface StatusBadgeProps {
  status: ScreeningStatus | TreatmentStatus | string;
  type?: 'screening' | 'treatment';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'screening' }) => {
  const getBadgeConfig = () => {
    switch (status) {
      case 'PENDING_REVIEW':
        return { bg: 'bg-amber-50 text-amber-800 border-amber-200', label: 'Pending Review' };
      case 'REVIEWED':
        return { bg: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Doctor Reviewed' };
      case 'REFERRED':
        return { bg: 'bg-purple-50 text-purple-700 border-purple-200', label: 'Referred to Specialist' };
      case 'FOLLOW_UP_REQUIRED':
        return { bg: 'bg-rose-50 text-rose-700 border-rose-200', label: 'Follow-up Due' };
      case 'DISCHARGED':
        return { bg: 'bg-slate-100 text-slate-700 border-slate-200', label: 'Discharged' };
      
      // Treatment
      case 'ACTIVE':
        return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Active DOTS Care' };
      case 'COMPLETED':
        return { bg: 'bg-teal-50 text-teal-700 border-teal-200', label: 'Treatment Completed' };
      case 'NOT_STARTED':
        return { bg: 'bg-slate-100 text-slate-600 border-slate-200', label: 'Not Started' };
      case 'DEFAULTED':
        return { bg: 'bg-rose-50 text-rose-800 border-rose-300', label: 'Defaulted / Interrupted' };
      case 'SUSPENDED':
        return { bg: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Suspended (Adverse FX)' };
      
      default:
        return { bg: 'bg-slate-100 text-slate-700 border-slate-200', label: String(status) };
    }
  };

  const config = getBadgeConfig();

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg}`}
    >
      {config.label}
    </span>
  );
};
