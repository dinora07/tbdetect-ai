import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  User,
  FileText,
  Activity,
  Stethoscope,
  ChevronRight,
  X,
  BookOpen,
  Building2,
  Shield,
  Bot,
  Layers,
  Settings,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { patientService } from '../../services/api';
import { Patient } from '../../types';

interface CommandSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (view: string, id?: string) => void;
  onSelectPatient?: (patientId: string) => void;
  onSelectView?: (view: string) => void;
}

export const CommandSearch: React.FC<CommandSearchProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onSelectPatient,
  onSelectView,
}) => {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      patientService.getPatients().then(setPatients);
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  const handleSelectNav = (view: string, id?: string) => {
    if (view === 'patient-detail' && id && onSelectPatient) {
      onSelectPatient(id);
    }
    if (onSelectView) {
      onSelectView(view);
    }
    if (onNavigate) {
      onNavigate(view, id);
    }
    onClose();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredPatients = query.trim()
    ? patients.filter(
        (p) =>
          p.firstName.toLowerCase().includes(query.toLowerCase()) ||
          p.lastName.toLowerCase().includes(query.toLowerCase()) ||
          p.nationalId.toLowerCase().includes(query.toLowerCase()) ||
          p.region.toLowerCase().includes(query.toLowerCase())
      )
    : patients.slice(0, 5);

  const clinicalViews = [
    { label: t.nav.overview, view: 'dashboard', icon: Activity, desc: 'Triage overview & facility indicators' },
    { label: t.nav.patients, view: 'patients', icon: User, desc: 'Patient registry & clinical cohort list' },
    { label: t.nav.xrayAnalysis, view: 'xray', icon: Activity, desc: 'Upload radiograph for Deep CNN inference' },
    { label: t.nav.symptoms, view: 'symptoms', icon: Stethoscope, desc: 'WHO algorithmic symptom assessment' },
    { label: t.nav.coughAi, view: 'cough', icon: Activity, desc: 'Acoustic waveform & spectrogram capture' },
    { label: t.nav.laboratory, view: 'labs', icon: FileText, desc: 'GeneXpert MTB/RIF & smear microscopy' },
    { label: t.nav.treatment, view: 'treatment', icon: Layers, desc: 'DOTS adherence & medication regimens' },
    { label: t.nav.aiAssistant, view: 'ai-assistant', icon: Bot, desc: 'Interactive TB Clinical Copilot' },
    { label: t.nav.analytics, view: 'analytics', icon: Activity, desc: 'Epidemiological trends & heatmaps' },
    { label: t.nav.users, view: 'admin-users', icon: User, desc: 'Staff directory & RBAC access control' },
    { label: t.nav.clinics, view: 'admin-clinics', icon: Building2, desc: 'Facility network & tenant management' },
    { label: t.nav.auditLog, view: 'admin-audit', icon: Shield, desc: 'Compliance audit trail & access history' },
    { label: t.nav.system, view: 'admin-system', icon: Activity, desc: 'System node status & live telemetry' },
    { label: t.nav.settings, view: 'settings', icon: Settings, desc: 'System configuration & preferences' },
  ];

  const filteredViews = query.trim()
    ? clinicalViews.filter(
        (v) =>
          v.label.toLowerCase().includes(query.toLowerCase()) ||
          v.desc.toLowerCase().includes(query.toLowerCase()) ||
          v.view.toLowerCase().includes(query.toLowerCase())
      )
    : clinicalViews.slice(0, 4);

  const protocols = [
    {
      title: 'WHO Rapid Diagnostic Protocol 2024',
      code: 'WHO-TB-2024-01',
      category: 'Diagnostic Guideline',
      action: 'labs',
    },
    {
      title: 'GeneXpert MTB/RIF Ultra Diagnostic Thresholds',
      code: 'GX-REF-442',
      category: 'Laboratory SOP',
      action: 'labs',
    },
    {
      title: 'Directly Observed Therapy (DOTS) Intensive Regimen',
      code: 'DOTS-REG-6M',
      category: 'Treatment Protocol',
      action: 'treatment',
    },
  ].filter(
    (p) =>
      !query.trim() ||
      p.title.toLowerCase().includes(query.toLowerCase()) ||
      p.code.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-20 p-4 bg-slate-900/60 backdrop-blur-2xs transition-opacity animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50/60">
          <Search className="w-5 h-5 text-blue-600 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search patients, X-rays, laboratory tests, or medical navigation..."
            className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[11px] font-mono font-medium text-slate-400 bg-white rounded border border-slate-200 shadow-2xs">
            ESC
          </kbd>
        </div>

        {/* Search Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {/* Navigation / Views */}
          {filteredViews.length > 0 && (
            <div>
              <p className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {query ? 'Matching Navigation' : 'Quick Access Modules'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-1">
                {filteredViews.map((act) => {
                  const Icon = act.icon;
                  return (
                    <button
                      key={act.view}
                      onClick={() => handleSelectNav(act.view)}
                      className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-blue-50/60 hover:border-blue-200 transition-all text-left border border-slate-100 group bg-slate-50/40"
                    >
                      <div className="p-2 rounded-xl bg-white text-blue-600 shadow-2xs group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                          {act.label}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">{act.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Patients Section */}
          <div>
            <p className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {query ? `Matching Patients (${filteredPatients.length})` : 'Active Patient Dossiers'}
            </p>
            <div className="space-y-1.5 mt-1">
              {filteredPatients.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-400">
                  No matching patients found for "{query}"
                </div>
              ) : (
                filteredPatients.map((patient) => (
                  <button
                    key={patient.id}
                    onClick={() => handleSelectNav('patient-detail', patient.id)}
                    className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-100">
                        {patient.firstName[0]}
                        {patient.lastName[0]}
                      </div>
                      <div className="text-left min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                            {patient.firstName} {patient.lastName}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                            {patient.nationalId}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">
                          {patient.age} yrs • {patient.gender} • {patient.region}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full ${
                          patient.riskScore >= 70
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : patient.riskScore >= 40
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {patient.riskScore}% AI Risk
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Clinical Guidelines / Protocols Section */}
          {protocols.length > 0 && (
            <div>
              <p className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Clinical Reference Protocols
              </p>
              <div className="space-y-1 mt-1">
                {protocols.map((proto, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectNav(proto.action)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <BookOpen className="w-4 h-4 text-indigo-500 shrink-0" />
                      <div className="truncate">
                        <p className="text-xs font-semibold text-slate-800 truncate">{proto.title}</p>
                        <p className="text-[10px] text-slate-400">{proto.category} • {proto.code}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-md shrink-0">
                      Open Module →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span>
              Navigate: <kbd className="px-1.5 py-0.5 bg-white border rounded font-mono">↑</kbd>{' '}
              <kbd className="px-1.5 py-0.5 bg-white border rounded font-mono">↓</kbd>
            </span>
            <span>
              Select: <kbd className="px-1.5 py-0.5 bg-white border rounded font-mono">↵</kbd>
            </span>
          </div>
          <span className="font-medium text-slate-500">TBDetect AI Unified Command Center</span>
        </div>
      </div>
    </div>
  );
};
