import React from 'react';
import {
  ScanLine,
  FileText,
  Mic,
  Stethoscope,
  HeartPulse,
  Pill,
  Calendar,
  UserCheck,
  CheckCircle2,
} from 'lucide-react';
import { TimelineEvent } from '../../types';

interface PatientTimelineViewProps {
  events: TimelineEvent[];
  patientName?: string;
  onSelectEvent?: (event: TimelineEvent) => void;
}

export const PatientTimelineView: React.FC<PatientTimelineViewProps> = ({
  events,
  patientName,
  onSelectEvent,
}) => {
  const getEventIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'XRAY_UPLOADED':
      case 'AI_ANALYSIS_COMPLETED':
        return { icon: ScanLine, bg: 'bg-blue-600 text-white', border: 'border-blue-200' };
      case 'SYMPTOM_ASSESSMENT':
        return { icon: Stethoscope, bg: 'bg-indigo-600 text-white', border: 'border-indigo-200' };
      case 'LAB_RESULT_RECEIVED':
        return { icon: FileText, bg: 'bg-purple-600 text-white', border: 'border-purple-200' };
      case 'DOCTOR_REVIEW':
        return { icon: UserCheck, bg: 'bg-amber-600 text-white', border: 'border-amber-200' };
      case 'TREATMENT_STARTED':
      case 'MEDICATION_MILESTONE':
        return { icon: HeartPulse, bg: 'bg-emerald-600 text-white', border: 'border-emerald-200' };
      case 'PATIENT_REGISTERED':
        return { icon: CheckCircle2, bg: 'bg-teal-600 text-white', border: 'border-teal-200' };
      default:
        return { icon: Calendar, bg: 'bg-slate-600 text-white', border: 'border-slate-200' };
    }
  };

  return (
    <div className="space-y-4">
      {patientName && (
        <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Longitudinal Medical Journey</h3>
            <p className="text-xs text-slate-500">Immutable chronological record for {patientName}</p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-xl">
            {events.length} Recorded Events
          </span>
        </div>
      )}

      <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
        {events.map((event, idx) => {
          const config = getEventIcon(event.type);
          const Icon = config.icon;

          return (
            <div
              key={event.id || idx}
              onClick={() => onSelectEvent && onSelectEvent(event)}
              className={`relative group ${
                onSelectEvent ? 'cursor-pointer' : ''
              }`}
            >
              {/* Node bullet */}
              <div
                className={`absolute -left-6 sm:-left-8 top-1 w-6 h-6 rounded-full flex items-center justify-center shadow-xs ${config.bg} border-2 border-white ring-2 ${config.border}`}
              >
                <Icon className="w-3 h-3" />
              </div>

              {/* Event card */}
              <div className="bg-slate-50 hover:bg-slate-100/80 p-4 rounded-2xl border border-slate-200/80 transition-all space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-900">
                    {event.title}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {new Date(event.timestamp).toLocaleString()}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {event.description}
                </p>

                <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                  <span>Author: <strong className="text-slate-600">{event.authorName}</strong> ({event.authorRole})</span>
                  {event.severity && (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      event.severity === 'alert' ? 'bg-rose-100 text-rose-800' :
                      event.severity === 'warning' ? 'bg-amber-100 text-amber-800' :
                      event.severity === 'success' ? 'bg-emerald-100 text-emerald-800' :
                      'bg-slate-200 text-slate-700'
                    }`}>
                      {event.severity}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
