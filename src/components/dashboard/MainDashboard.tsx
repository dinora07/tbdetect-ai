import React, { useState, useEffect } from 'react';
import {
  Users,
  ScanLine,
  AlertTriangle,
  FileCheck,
  FileText,
  HeartPulse,
  TrendingUp,
  Activity,
  ArrowRight,
  Stethoscope,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { StatCard } from '../common/StatCard';
import { RiskBadge } from '../common/RiskBadge';
import { StatusBadge } from '../common/StatusBadge';
import { MedicalDisclaimer } from '../common/MedicalDisclaimer';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Patient, AnalyticsSummary, TimelineEvent } from '../../types';
import { patientService, analyticsService, timelineService } from '../../services/api';

interface MainDashboardProps {
  onNavigate: (view: string, id?: string) => void;
}

export const MainDashboard: React.FC<MainDashboardProps> = ({ onNavigate }) => {
  const { t } = useLanguage();
  const { user, isDoctor, isPatient } = useAuth();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [recentEvents, setRecentEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [pts, stats, events] = await Promise.all([
        patientService.getPatients(),
        analyticsService.getAnalytics(),
        timelineService.getTimelineByPatientId('pat_001'),
      ]);
      setPatients(pts);
      setAnalytics(stats);
      setRecentEvents(events.slice(0, 5));
    } finally {
      setLoading(false);
    }
  };

  // High risk patients requiring urgent doctor review
  const priorityCases = patients.filter(
    (p) => p.riskLevel === 'HIGH' || p.riskLevel === 'CRITICAL' || p.status === 'PENDING_REVIEW'
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Dashboard Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {t.dashboard.title}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Live Clinical Node
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {t.dashboard.subtitle} • {user?.clinicName}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('xray')}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <ScanLine className="w-4 h-4" />
            <span>{t.nav.newScreening}</span>
          </button>

          <button
            onClick={() => onNavigate('patients')}
            className="inline-flex items-center gap-2 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-2xs transition-colors cursor-pointer"
          >
            <Users className="w-4 h-4 text-slate-500" />
            <span>{t.nav.newPatient}</span>
          </button>

          <button
            onClick={() => onNavigate('labs')}
            className="inline-flex items-center gap-2 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-2xs transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4 text-amber-500" />
            <span>{t.nav.laboratory}</span>
          </button>

          <button
            onClick={() => onNavigate('treatment')}
            className="inline-flex items-center gap-2 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-2xs transition-colors cursor-pointer"
          >
            <HeartPulse className="w-4 h-4 text-emerald-500" />
            <span>{t.nav.treatment}</span>
          </button>
        </div>
      </div>

      {/* Medical Safety Disclaimer Notice & Synthetic Data Transparency */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-indigo-100 text-indigo-800">
            DEMO / SYNTHETIC DATA
          </span>
          <span>Displayed metrics and cohort timelines are synthetic demo models for clinical workflow evaluation.</span>
        </div>
        <span className="font-mono text-[11px] text-slate-400">Not connected to live MoH registry</span>
      </div>

      <MedicalDisclaimer variant="compact" />

      {/* AI Surveillance Insights Callout */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50 via-blue-50 to-cyan-50 border border-indigo-100 flex items-start gap-3.5 shadow-2xs">
        <div className="p-2 rounded-xl bg-indigo-600 text-white shrink-0 mt-0.5 shadow-xs">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0 text-xs">
          <div className="flex items-center gap-2">
            <p className="font-bold text-indigo-950">{t.dashboard.aiInsights}</p>
            <span className="text-[10px] font-mono font-bold bg-indigo-200/60 text-indigo-800 px-1.5 py-0.5 rounded">
              Epidemic Signal
            </span>
          </div>
          <p className="text-indigo-900/90 mt-0.5 leading-relaxed">
            {t.dashboard.aiInsightsText}
          </p>
        </div>
      </div>

      {/* Stat Cards Grid - 6 Key Modules */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title={t.dashboard.totalPatients}
          value={analytics?.totalPatients || 1480}
          subtitle="Registered cohort"
          icon={Users}
          variant="blue"
          trend={{ value: '+12.4%', isPositive: true, label: 'vs last mo' }}
          onClick={() => onNavigate('patients')}
        />
        <StatCard
          title="X-ray Studies"
          value={analytics?.screeningsThisMonth || 342}
          subtitle="Chest radiographs (AI)"
          icon={ScanLine}
          variant="teal"
          trend={{ value: '+18.2%', isPositive: true }}
          onClick={() => onNavigate('xray')}
        />
        <StatCard
          title="Pending Reviews"
          value={analytics?.pendingDoctorReviews || 12}
          subtitle="Doctor sign-off needed"
          icon={FileCheck}
          variant="amber"
          trend={{ value: '4 urgent', isPositive: false }}
          onClick={() => onNavigate('xray')}
        />
        <StatCard
          title="Laboratory Tests"
          value={286}
          subtitle="GeneXpert / AFB Smear"
          icon={FileText}
          variant="rose"
          trend={{ value: '+9 today', isPositive: true }}
          onClick={() => onNavigate('labs')}
        />
        <StatCard
          title="Treatment Monitoring"
          value={analytics?.activeTreatments || 86}
          subtitle="Under 6-mo DOTS"
          icon={HeartPulse}
          variant="emerald"
          trend={{ value: '94.8% adher.', isPositive: true }}
          onClick={() => onNavigate('treatment')}
        />
        <StatCard
          title="Cough Studies"
          value={194}
          subtitle="Audio acoustic assays"
          icon={Activity}
          variant="violet"
          trend={{ value: '+24 this wk', isPositive: true }}
          onClick={() => onNavigate('cough')}
        />
      </div>

      {/* Priority Triage: Cases Requiring Attention */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                {t.dashboard.priorityTriage}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">
                {priorityCases.length} Cases Flagged
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {t.dashboard.priorityDesc}
            </p>
          </div>

          <button
            onClick={() => onNavigate('patients')}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 self-start sm:self-auto"
          >
            View all patients <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Priority Patients List Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                <th className="pb-3 pl-2">Patient Dossier</th>
                <th className="pb-3">Age / Gender</th>
                <th className="pb-3">Multimodal AI Score</th>
                <th className="pb-3">Key Radiographic / Lab Flag</th>
                <th className="pb-3">Screening Status</th>
                <th className="pb-3 pr-2 text-right">Clinical Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {priorityCases.slice(0, 5).map((patient) => (
                <tr
                  key={patient.id}
                  className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                  onClick={() => onNavigate('patient-detail', patient.id)}
                >
                  <td className="py-3.5 pl-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-xs">
                        {patient.firstName[0]}{patient.lastName[0]}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {patient.firstName} {patient.lastName}
                        </p>
                        <p className="text-[10px] font-mono text-slate-400">
                          {patient.nationalId} • {patient.region}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5">
                    {patient.age} yrs • {patient.gender === 'MALE' ? 'Male' : 'Female'}
                  </td>

                  <td className="py-3.5">
                    <RiskBadge level={patient.riskLevel} score={patient.riskScore} showScore />
                  </td>

                  <td className="py-3.5 max-w-xs truncate text-slate-600 text-[11px]">
                    {patient.notes}
                  </td>

                  <td className="py-3.5">
                    <StatusBadge status={patient.status} />
                  </td>

                  <td className="py-3.5 pr-2 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate('xray', patient.id);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-xl font-bold text-xs transition-all shadow-2xs group-hover:bg-blue-600 group-hover:text-white"
                    >
                      <span>{t.dashboard.reviewNow}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Analytics Charts & Longitudinal Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Screening Trends Area Chart */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                {t.dashboard.screeningTrends}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Monthly AI screening volume vs high-risk tuberculosis detections
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <span className="text-slate-600">Total Screenings</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-slate-600">High Risk Flagged</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics?.monthlyTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScreenings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorHighRisk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="screenings" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorScreenings)" name="Screenings" />
                <Area type="monotone" dataKey="highRisk" stroke="#f43f5e" strokeWidth={2.5} fillOpacity={1} fill="url(#colorHighRisk)" name="High Risk TB" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Distribution Breakdown */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight">
              {t.dashboard.riskDistribution}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Stratification of 1,480 cohort evaluations
            </p>
          </div>

          <div className="h-44 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics?.riskDistribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {(analytics?.riskDistribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
            {(analytics?.riskDistribution || []).map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-slate-600 truncate">{item.name}: <strong className="text-slate-900">{item.value}%</strong></span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
