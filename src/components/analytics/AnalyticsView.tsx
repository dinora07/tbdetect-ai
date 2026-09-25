import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  Layers,
  MapPin,
  PieChart as PieIcon,
  ShieldCheck,
  CheckCircle2,
  ScanLine,
  FileText,
  Mic,
  HeartPulse,
  Users,
  AlertCircle,
  Clock,
  Filter,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { AnalyticsSummary, Patient } from '../../types';
import { analyticsService, patientService } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { downloadCsv } from '../../utils/exportUtils';
import { useToast } from '../../context/ToastContext';

export const AnalyticsView: React.FC = () => {
  const { t } = useLanguage();
  const { success } = useToast();

  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [timeRange, setTimeRange] = useState<'1M' | '3M' | '6M' | '1Y'>('6M');
  const [selectedPatientId, setSelectedPatientId] = useState<string>('all');
  const [selectedStudyType, setSelectedStudyType] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [stats, pts] = await Promise.all([
        analyticsService.getAnalytics(),
        patientService.getPatients(),
      ]);
      setAnalytics(stats);
      setPatients(pts);
    } finally {
      setLoading(false);
    }
  };

  // Screening volume data adjusted by time range
  const trendData = (analytics?.monthlyTrend || []).slice(
    timeRange === '1M' ? -1 : timeRange === '3M' ? -3 : timeRange === '6M' ? -6 : 0
  );

  // Modality Breakdown
  const modalityData = [
    { name: 'Chest X-Ray AI', count: 342, percentage: 41, fill: '#2563eb' },
    { name: 'Sputum GeneXpert / AFB', count: 286, percentage: 34, fill: '#f59e0b' },
    { name: 'Cough Sound AI', count: 194, percentage: 23, fill: '#0d9488' },
    { name: 'WHO Symptoms Matrix', count: 410, percentage: 49, fill: '#8b5cf6' },
  ];

  // Adherence Cohort Trend
  const adherenceTrendData = [
    { month: 'Mar', adherence: 91.2, missedDoses: 28, patients: 64 },
    { month: 'Apr', adherence: 92.5, missedDoses: 22, patients: 72 },
    { month: 'May', adherence: 93.8, missedDoses: 19, patients: 78 },
    { month: 'Jun', adherence: 94.1, missedDoses: 16, patients: 81 },
    { month: 'Jul', adherence: 94.4, missedDoses: 14, patients: 84 },
    { month: 'Aug', adherence: 94.8, missedDoses: 11, patients: 86 },
  ];

  // Patient Cohort Growth
  const growthData = [
    { month: 'Mar', registered: 94, discharged: 18, total: 1210 },
    { month: 'Apr', registered: 112, discharged: 24, total: 1298 },
    { month: 'May', registered: 128, discharged: 29, total: 1397 },
    { month: 'Jun', registered: 135, discharged: 32, total: 1500 },
    { month: 'Jul', registered: 142, discharged: 36, total: 1606 },
    { month: 'Aug', registered: 154, discharged: 41, total: 1719 },
  ];

  // Regional epidemiology data
  const regionalData = [
    { region: 'Tashkent City', cases: 48, rate: '32.4 / 100k', positivity: '14.2%' },
    { region: 'Samarkand', cases: 34, rate: '28.1 / 100k', positivity: '11.8%' },
    { region: 'Fergana Valley', cases: 42, rate: '36.8 / 100k', positivity: '16.5%' },
    { region: 'Bukhara', cases: 19, rate: '22.5 / 100k', positivity: '9.4%' },
    { region: 'Andijan', cases: 28, rate: '30.2 / 100k', positivity: '13.1%' },
    { region: 'Karakalpakstan', cases: 38, rate: '44.1 / 100k', positivity: '18.9%' },
  ];

  const handleExportAnalyticsCsv = () => {
    const headers = ['Month', 'Total Screenings', 'High Risk Cases', 'Confirmed Diagnosis'];
    const rows = trendData.map((t) => [t.month, t.screenings, t.highRisk, t.confirmed]);
    downloadCsv(headers, rows, `TBDetect_Analytics_Summary_${timeRange}_${new Date().toISOString().slice(0, 10)}.csv`);
    success('Epidemiological analytics report downloaded (CSV).');
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {t.analytics.title}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Clinical Intelligence Suite
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {t.analytics.subtitle} • Real-time multimodal screening and treatment adherence analytics
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Time range switcher */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs font-mono font-bold">
            {(['1M', '3M', '6M', '1Y'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  timeRange === range
                    ? 'bg-white text-blue-700 shadow-2xs font-black'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportAnalyticsCsv}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Synthetic Demo Disclaimer Notice */}
      <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-900">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-bold">Synthetic Clinical Demonstration Data</p>
          <p className="text-[11px] text-amber-800/90 leading-relaxed">
            All screening counts, AI recall rates, and prevalence distributions shown below are synthetic benchmark data for software verification. They do not represent official epidemiological statistics of the Ministry of Health.
          </p>
        </div>
      </div>

      {/* Filter Bar: Patient & Study Type */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-500 font-medium">
          <Filter className="w-4 h-4 text-slate-400" />
          <span>Active Filters:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Patient Filter */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold">Patient:</span>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium outline-none focus:bg-white cursor-pointer"
            >
              <option value="all">Entire Cohort ({patients.length} patients)</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName} ({p.nationalId})
                </option>
              ))}
            </select>
          </div>

          {/* Study Type Filter */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold">Study Type:</span>
            <select
              value={selectedStudyType}
              onChange={(e) => setSelectedStudyType(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium outline-none focus:bg-white cursor-pointer"
            >
              <option value="all">All Modalities</option>
              <option value="xray">Chest X-Ray Deep CNN</option>
              <option value="labs">Laboratory (GeneXpert / AFB)</option>
              <option value="cough">Cough Acoustic AI</option>
              <option value="symptoms">WHO Symptom Intelligence</option>
              <option value="treatment">Treatment & DOTS</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid - 5 Core Clinical Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Screening Volume</p>
          <p className="text-2xl font-black text-blue-600 font-mono">
            {selectedPatientId === 'all' ? (analytics?.screeningsThisMonth || 342) : 4}
          </p>
          <p className="text-[11px] text-slate-500">Multimodal assays conducted</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI Sensitivity / Recall</p>
          <p className="text-2xl font-black text-emerald-600 font-mono">98.2%</p>
          <p className="text-[11px] text-slate-500">Microbiologically confirmed</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Reviews</p>
          <p className="text-2xl font-black text-amber-600 font-mono">
            {selectedPatientId === 'all' ? (analytics?.pendingDoctorReviews || 12) : 1}
          </p>
          <p className="text-[11px] text-slate-500">Doctor sign-off queue</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">DOTS Completion Rate</p>
          <p className="text-2xl font-black text-teal-600 font-mono">94.8%</p>
          <p className="text-[11px] text-slate-500">6-month successful adherence</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Average Triage Latency</p>
          <p className="text-2xl font-black text-indigo-600 font-mono">1.8 Hrs</p>
          <p className="text-[11px] text-slate-500">Scan upload to sign-off</p>
        </div>
      </div>

      {/* Row 1: Screening Trends & Modality Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Monthly Trend Area Chart */}
        <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {t.analytics.monthlyVolume} ({timeRange})
              </h3>
              <p className="text-xs text-slate-500">
                Multimodal screening volume vs. high-risk tuberculosis cases flagged
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-400 bg-slate-100 px-2.5 py-1 rounded-xl">
              Model v3.4 CNN-Acoustic
            </span>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="scColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="hrColor" x1="0" y1="0" x2="0" y2="1">
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
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="screenings"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#scColor)"
                  name="Total Screenings"
                />
                <Area
                  type="monotone"
                  dataKey="highRisk"
                  stroke="#f43f5e"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#hrColor)"
                  name="High Risk Flagged"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Modality Contribution / Breakdown */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Assay Modality Volume</h3>
            <p className="text-xs text-slate-500">Distribution across diagnostic pathways</p>
          </div>

          <div className="space-y-3 pt-2">
            {modalityData.map((item, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5 text-xs">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-slate-800">{item.name}</span>
                  <span className="font-mono text-slate-600">{item.count} tests</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${item.percentage}%`, backgroundColor: item.fill }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Treatment Adherence Overview & Patient Growth */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Treatment Adherence Overview */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Treatment Adherence Overview</h3>
              <p className="text-xs text-slate-500">DOTS pill-count compliance & missed dosage trends</p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
              Avg 94.8%
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={adherenceTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis domain={[80, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="adherence"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#10b981' }}
                  name="Adherence %"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Patient Cohort Growth */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Patient Cohort Growth</h3>
              <p className="text-xs text-slate-500">Monthly newly registered patients vs. successfully completed treatments</p>
            </div>
            <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-200">
              +154 this mo
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={growthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="registered" fill="#3b82f6" radius={[6, 6, 0, 0]} name="New Registrations" />
                <Bar dataKey="discharged" fill="#10b981" radius={[6, 6, 0, 0]} name="Completed & Cured" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Regional Incidence Breakdown */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Regional TB Prevalence & Clinic Yield</h3>
            <p className="text-xs text-slate-500">Geographical notification rate per 100k population</p>
          </div>
          <span className="text-xs text-slate-400 font-mono">6 Connected Regions</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {regionalData.map((item, idx) => (
            <div key={idx} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                <div>
                  <span className="font-bold text-slate-900 block">{item.region}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{item.rate}</span>
                </div>
              </div>
              <div className="text-right font-mono">
                <span className="font-bold text-rose-600 block">{item.cases} positive</span>
                <span className="text-[10px] text-slate-500">{item.positivity} yield</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
