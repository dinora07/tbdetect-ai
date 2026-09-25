import React, { useState, useEffect } from 'react';
import {
  Activity,
  ScanLine,
  Users,
  LayoutDashboard,
  Stethoscope,
  Mic,
  FileText,
  HeartPulse,
  Bot,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ChevronRight,
  Server,
  Layers,
  BarChart3,
  ExternalLink,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { patientService, timelineService } from '../../services/api';
import { Patient, TimelineEvent } from '../../types';

interface HomePageProps {
  onNavigate: (view: string, patientId?: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { t } = useLanguage();
  const { user, isDoctor } = useAuth();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [recentEvents, setRecentEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    setLoading(true);
    try {
      const [pts, events] = await Promise.all([
        patientService.getPatients(),
        timelineService.getTimelineByPatientId('pat_001'),
      ]);
      setPatients(pts);
      setRecentEvents(events.slice(0, 5));
    } finally {
      setLoading(false);
    }
  };

  const highRiskCount = patients.filter(
    (p) => p.riskLevel === 'HIGH' || p.riskLevel === 'CRITICAL'
  ).length;

  return (
    <div className="space-y-6 pb-16">
      {/* Brand Hero / Platform Overview Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white p-6 sm:p-8 border border-slate-800 shadow-xl">
        {/* Background decorative glow */}
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-20 w-64 h-64 rounded-full bg-blue-600/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-mono text-cyan-300">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>National Multimodal TB AI Platform</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            TBDetect <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">AI</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 font-medium leading-relaxed max-w-2xl">
            {t.brand.tagline} • An advanced multimodal clinical platform combining Deep CNN chest X-ray detection, WHO symptom intelligence, acoustic cough biomarker analysis, and longitudinal DOTS monitoring for early tuberculosis triage.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('xray')}
              className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 active:from-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-cyan-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <ScanLine className="w-4 h-4" />
              <span>{t.nav.newScreening}</span>
            </button>

            <button
              onClick={() => onNavigate('patients')}
              className="inline-flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 active:bg-white/25 text-white border border-white/20 rounded-xl text-xs sm:text-sm font-bold backdrop-blur-md transition-all cursor-pointer"
            >
              <Users className="w-4 h-4 text-cyan-300" />
              <span>{t.nav.patients}</span>
            </button>

            <button
              onClick={() => onNavigate('dashboard')}
              className="inline-flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 active:bg-white/25 text-white border border-white/20 rounded-xl text-xs sm:text-sm font-bold backdrop-blur-md transition-all cursor-pointer"
            >
              <LayoutDashboard className="w-4 h-4 text-indigo-300" />
              <span>{t.nav.overview} (Dashboard)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Real-time System Status Strip (Honest Demo Environment Transparency) */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {t.nav.system}
              </h2>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                DEMO SANDBOX
              </span>
            </div>
            <p className="text-sm font-bold text-slate-800 flex items-center gap-2 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              Clinical Workspace Engine Active • Simulated Node
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto text-xs font-mono text-slate-500">
          <span className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            Cohort: <strong className="text-slate-900">{patients.length} Patients</strong>
          </span>
          <span className="bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 text-rose-700">
            Triage: <strong>{highRiskCount} Flagged</strong>
          </span>
          <button
            onClick={() => onNavigate('admin-system')}
            className="text-blue-600 hover:text-blue-700 font-bold hover:underline inline-flex items-center gap-1 ml-1"
          >
            <span>Telemetry</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Clinical Workspace Shortcuts Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-400">
            Clinical Workspace Shortcuts
          </h2>
          <span className="text-xs text-slate-400">Quick-access diagnostic modules</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => onNavigate('xray')}
            className="group bg-white p-5 rounded-3xl border border-slate-200/80 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer space-y-3"
          >
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <ScanLine className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {t.nav.xrayAnalysis}
                </h3>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">AI</span>
              </div>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                Deep learning radiograph screening with heatmap localization, DICOM parser, and doctor review sign-off.
              </p>
            </div>
          </div>

          <div
            onClick={() => onNavigate('symptoms')}
            className="group bg-white p-5 rounded-3xl border border-slate-200/80 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer space-y-3"
          >
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {t.nav.symptoms}
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                WHO guideline symptom assessment questionnaire with clinical risk factor weighting matrix.
              </p>
            </div>
          </div>

          <div
            onClick={() => onNavigate('cough')}
            className="group bg-white p-5 rounded-3xl border border-slate-200/80 hover:border-teal-300 hover:shadow-md transition-all cursor-pointer space-y-3"
          >
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-colors">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-teal-600 transition-colors">
                  {t.nav.coughAi}
                </h3>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-100 text-teal-700">Audio</span>
              </div>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                Acoustic cough recording, spectrogram visualization, and explosive phase feature extraction.
              </p>
            </div>
          </div>

          <div
            onClick={() => onNavigate('labs')}
            className="group bg-white p-5 rounded-3xl border border-slate-200/80 hover:border-amber-300 hover:shadow-md transition-all cursor-pointer space-y-3"
          >
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                  {t.nav.laboratory}
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                GeneXpert MTB/RIF, Sputum Smear Microscopy (AFB), and Culture result management with document attachments.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Recent Clinical Activity + Quick Cohort Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Clinical Activity Feed */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent Clinical Stream</h2>
              <p className="text-xs text-slate-500">Live feed of patient screenings and triage events</p>
            </div>
            <button
              onClick={() => onNavigate('dashboard')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>Full Stream</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentEvents.map((evt) => (
              <div key={evt.id} className="py-3.5 flex items-start gap-3.5 first:pt-0 last:pb-0">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Activity className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-slate-900 truncate">{evt.title}</p>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">
                      {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-0.5 line-clamp-2">{evt.description}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400">
                    <span>Author: <strong className="text-slate-600">{evt.authorName}</strong></span>
                    <button
                      onClick={() => onNavigate('patient-detail', evt.patientId)}
                      className="text-blue-600 hover:underline font-bold"
                    >
                      View Dossier →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Patients Mini-List */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Priority Triage Cases</h2>
              <p className="text-xs text-slate-500">Cases requiring prompt medical evaluation</p>
            </div>
            <button
              onClick={() => onNavigate('patients')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>All Patients</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {patients.slice(0, 4).map((patient) => (
              <div
                key={patient.id}
                onClick={() => onNavigate('patient-detail', patient.id)}
                className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200/70 flex items-center justify-between transition-colors cursor-pointer text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    {patient.firstName[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">
                      {patient.firstName} {patient.lastName}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {patient.nationalId} • {patient.age} y/o
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      patient.riskLevel === 'HIGH' || patient.riskLevel === 'CRITICAL'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : patient.riskLevel === 'MODERATE'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {patient.riskLevel}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div
            onClick={() => onNavigate('ai-assistant')}
            className="p-3.5 bg-blue-50/70 hover:bg-blue-100/70 border border-blue-200/80 rounded-2xl text-[11px] text-blue-900 flex items-start justify-between gap-2.5 cursor-pointer transition-all group shadow-2xs"
          >
            <div className="flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
              <p>
                Need clinical decision support? Launch the <strong className="text-blue-700 underline decoration-blue-300">Clinical AI Assistant</strong> to consult pulmonary TB differential guidelines or drug-resistance protocols.
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-blue-600 shrink-0 mt-0.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
};
