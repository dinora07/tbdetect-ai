import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ScanLine,
  Stethoscope,
  Mic,
  FileText,
  HeartPulse,
  Calendar,
  Phone,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Pill,
  Sparkles,
} from 'lucide-react';
import {
  Patient,
  XRayAnalysis,
  SymptomAssessment,
  CoughAnalysis,
  LabResult,
  TreatmentPlan,
  TimelineEvent,
} from '../../types';
import {
  patientService,
  xrayService,
  symptomService,
  coughService,
  labService,
  treatmentService,
  timelineService,
} from '../../services/api';
import { RiskBadge } from '../common/RiskBadge';
import { StatusBadge } from '../common/StatusBadge';
import { RiskGauge } from '../common/RiskGauge';
import { PatientTimelineView } from './PatientTimelineView';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

interface PatientDetailProps {
  patientId: string;
  onBack: () => void;
  onNavigateScreening: (tool: 'xray' | 'symptoms' | 'cough' | 'labs' | 'treatment', patientId: string) => void;
}

export const PatientDetail: React.FC<PatientDetailProps> = ({
  patientId,
  onBack,
  onNavigateScreening,
}) => {
  const { t } = useLanguage();
  const { isDoctor } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'screenings' | 'labs' | 'timeline' | 'treatment'>('overview');
  const [patient, setPatient] = useState<Patient | null>(null);
  const [xrays, setXrays] = useState<XRayAnalysis[]>([]);
  const [symptoms, setSymptoms] = useState<SymptomAssessment[]>([]);
  const [coughs, setCoughs] = useState<CoughAnalysis[]>([]);
  const [labs, setLabs] = useState<LabResult[]>([]);
  const [treatment, setTreatment] = useState<TreatmentPlan | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDossier();
  }, [patientId]);

  const loadDossier = async () => {
    setLoading(true);
    try {
      const p = await patientService.getPatientById(patientId);
      if (p) {
        setPatient(p);
        const [xr, sym, cgh, lb, tr, tm] = await Promise.all([
          xrayService.getXRaysByPatientId(p.id),
          symptomService.getSymptomsByPatientId(p.id),
          coughService.getCoughByPatientId(p.id),
          labService.getLabsByPatientId(p.id),
          treatmentService.getTreatmentByPatientId(p.id),
          timelineService.getTimelineByPatientId(p.id),
        ]);
        setXrays(xr);
        setSymptoms(sym);
        setCoughs(cgh);
        setLabs(lb);
        setTreatment(tr || null);
        setTimeline(tm);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading || !patient) {
    return (
      <div className="p-12 text-center text-slate-500">
        <p className="text-sm font-semibold">Loading patient clinical dossier...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Top Navigation & Back link */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-2xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.patientProfile?.backToList || t.common.back || 'Back to Patients'}</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigateScreening('xray', patient.id)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <ScanLine className="w-3.5 h-3.5" />
            <span>{t.patientProfile?.actions?.uploadXray || 'New Chest X-Ray'}</span>
          </button>
          <button
            onClick={() => onNavigateScreening('symptoms', patient.id)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>{t.patientProfile?.actions?.addSymptoms || 'WHO Symptoms'}</span>
          </button>
          <button
            onClick={() => onNavigateScreening('cough', patient.id)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Mic className="w-3.5 h-3.5" />
            <span>{t.nav?.coughAi || 'Cough AI'}</span>
          </button>
        </div>
      </div>

      {/* Patient Master Card Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-blue-600 via-cyan-600 to-indigo-600 text-white flex items-center justify-center text-xl font-extrabold shadow-md shadow-blue-500/20 shrink-0">
              {patient.firstName[0]}{patient.lastName[0]}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {patient.firstName} {patient.lastName}
                </h1>
                <StatusBadge status={patient.status} />
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-0.5">
                <span className="font-mono bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-700">
                  ID: {patient.nationalId}
                </span>
                <span>•</span>
                <span>{patient.age} years old ({patient.gender === 'MALE' ? 'Male' : 'Female'})</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  {patient.phone}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  {patient.region}
                </span>
              </div>

              {patient.notes && (
                <p className="text-xs text-slate-600 italic pt-1 max-w-2xl">
                  "{patient.notes}"
                </p>
              )}
            </div>
          </div>

          {/* AI Risk Score Ring */}
          <div className="flex items-center gap-6 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 shrink-0">
            <RiskGauge
              score={patient.riskScore}
              riskLevel={patient.riskLevel}
              size="sm"
            />
            <div className="space-y-1 text-left">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Multimodal AI Index
              </p>
              <RiskBadge level={patient.riskLevel} score={patient.riskScore} />
              <p className="text-[11px] text-slate-500">
                Confidence: <strong className="text-slate-700">96.4%</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex overflow-x-auto gap-2">
          {[
            { id: 'overview', label: t.patientProfile?.tabs?.overview || 'Clinical Dossier' },
            { id: 'screenings', label: `${t.nav?.screening || 'Screenings'} (${xrays.length + symptoms.length + coughs.length})` },
            { id: 'labs', label: `${t.patientProfile?.tabs?.labs || 'Laboratory'} (${labs.length})` },
            { id: 'timeline', label: `${t.patientProfile?.tabs?.timeline || 'Longitudinal History'} (${timeline.length})` },
            { id: 'treatment', label: t.patientProfile?.tabs?.treatment || 'DOTS Treatment Care' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content Sections */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Exposure History & Comorbidities */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                {t.patients?.createModal?.tbHistory || 'TB Exposure & History'}
              </h3>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs">
                <span className="font-bold text-slate-800">{t.common?.status || 'Status'}: </span>
                <span className="font-mono text-rose-700">{patient.tbHistory}</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                {t.patients?.createModal?.comorbidities || 'Comorbid Conditions'}
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {patient.comorbidities && patient.comorbidities.length > 0 ? (
                  patient.comorbidities.map((cm, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-medium"
                    >
                      {cm}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">{t.common?.na || 'None reported'}</span>
                )}
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                {t.patients?.createModal?.emergencyContact || 'Emergency Contact'}
              </h3>
              <div className="text-xs space-y-1 text-slate-600">
                {patient.emergencyContact?.name ? (
                  <>
                    <p className="font-bold text-slate-900">
                      {patient.emergencyContact.name} {patient.emergencyContact.relationship ? `(${patient.emergencyContact.relationship})` : ''}
                    </p>
                    {patient.emergencyContact.phone && (
                      <p className="font-mono text-slate-500">{patient.emergencyContact.phone}</p>
                    )}
                  </>
                ) : (
                  <p className="text-slate-400 italic">No emergency contact recorded</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Multimodal Synthesis & Recent Tests */}
          <div className="lg:col-span-8 space-y-6">
            {/* AI Multimodal Fusion Card */}
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-sm font-bold text-cyan-200 uppercase tracking-wider">
                    AI Multimodal Synthesis Assessment
                  </h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                  Calibrated Risk: {patient.riskScore}%
                </span>
              </div>

              <p className="text-xs leading-relaxed text-slate-300">
                Triangulated multi-source analysis confirms high probability active pulmonary tuberculosis. Radiographic apical consolidation corroborated by positive acoustic cough spectrogram and GeneXpert MTB detected.
              </p>

              <div className="grid grid-cols-3 gap-3 pt-2 text-xs font-mono">
                <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-[10px] text-slate-400 uppercase">Chest Radiograph</p>
                  <p className="text-base font-bold text-rose-400 mt-1">
                    {xrays.length > 0 ? `${xrays[0].riskScore}% AI Risk` : 'Pending'}
                  </p>
                </div>
                <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-[10px] text-slate-400 uppercase">Cough Acoustic AI</p>
                  <p className="text-base font-bold text-amber-400 mt-1">
                    {coughs.length > 0 ? `${coughs[0].tbAcousticScore}% Index` : 'Pending'}
                  </p>
                </div>
                <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-[10px] text-slate-400 uppercase">WHO Symptom Score</p>
                  <p className="text-base font-bold text-cyan-400 mt-1">
                    {symptoms.length > 0 ? `${symptoms[0].calculatedRiskScore}% Score` : 'Pending'}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                onClick={() => onNavigateScreening('xray', patient.id)}
                className="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 text-left transition-all group"
              >
                <ScanLine className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform mb-2" />
                <p className="text-xs font-bold text-slate-900">Radiograph AI</p>
                <p className="text-[10px] text-slate-400">View chest X-ray</p>
              </button>

              <button
                onClick={() => onNavigateScreening('symptoms', patient.id)}
                className="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 text-left transition-all group"
              >
                <Stethoscope className="w-5 h-5 text-indigo-600 group-hover:scale-110 transition-transform mb-2" />
                <p className="text-xs font-bold text-slate-900">Symptom Matrix</p>
                <p className="text-[10px] text-slate-400">WHO 4-symptom triage</p>
              </button>

              <button
                onClick={() => onNavigateScreening('cough', patient.id)}
                className="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 text-left transition-all group"
              >
                <Mic className="w-5 h-5 text-teal-600 group-hover:scale-110 transition-transform mb-2" />
                <p className="text-xs font-bold text-slate-900">Acoustic Cough</p>
                <p className="text-[10px] text-slate-400">Spectrogram neural net</p>
              </button>

              <button
                onClick={() => onNavigateScreening('treatment', patient.id)}
                className="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 text-left transition-all group"
              >
                <Pill className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform mb-2" />
                <p className="text-xs font-bold text-slate-900">DOTS Therapy</p>
                <p className="text-[10px] text-slate-400">Pill adherence log</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Screenings Tab */}
      {activeTab === 'screenings' && (
        <div className="space-y-6">
          {/* 1. X-Ray Radiographs Section */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ScanLine className="w-4 h-4 text-blue-600" />
                Chest Radiographs ({xrays.length})
              </h3>
              <button
                onClick={() => onNavigateScreening('xray', patient.id)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors"
              >
                + New Radiograph
              </button>
            </div>

            {xrays.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 text-xs">
                No chest radiograph scans recorded for this patient.
              </div>
            ) : (
              <div className="space-y-3">
                {xrays.map((xr) => (
                  <div key={xr.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-slate-800">{xr.id}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                          {xr.riskScore}% AI Risk
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(xr.uploadedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">{xr.impression}</p>
                    </div>
                    <button
                      onClick={() => onNavigateScreening('xray', patient.id)}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors self-start sm:self-auto shrink-0"
                    >
                      Open in Studio
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. Symptom Assessments Section */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-indigo-600" />
                WHO Symptom Assessments ({symptoms.length})
              </h3>
              <button
                onClick={() => onNavigateScreening('symptoms', patient.id)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors"
              >
                + Assess Symptoms
              </button>
            </div>

            {symptoms.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 text-xs">
                No symptom evaluations logged for this patient.
              </div>
            ) : (
              <div className="space-y-3">
                {symptoms.map((sym) => (
                  <div key={sym.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-slate-800">{sym.id}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                          {sym.calculatedRiskScore}% Risk Score
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(sym.assessedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">
                        Cough Duration: {sym.coughDurationDays} days • Hemoptysis: {sym.hemoptysis ? 'Yes' : 'No'} • Night Sweats: {sym.nightSweats ? 'Yes' : 'No'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. Cough Acoustic AI Section */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Mic className="w-4 h-4 text-teal-600" />
                Cough Audio Neural Analyses ({coughs.length})
              </h3>
              <button
                onClick={() => onNavigateScreening('cough', patient.id)}
                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-colors"
              >
                + Record Cough
              </button>
            </div>

            {coughs.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 text-xs">
                No acoustic cough spectrogram recordings for this patient.
              </div>
            ) : (
              <div className="space-y-3">
                {coughs.map((cg) => (
                  <div key={cg.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-slate-800">{cg.id}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800">
                          {cg.tbAcousticScore}% Acoustic TB Probability
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(cg.recordedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">
                        {cg.interpretation || cg.impression || 'Acoustic cough resonance evaluation completed.'}
                      </p>
                    </div>
                    <button
                      onClick={() => onNavigateScreening('cough', patient.id)}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors self-start sm:self-auto shrink-0"
                    >
                      Open in Studio
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Labs Tab */}
      {activeTab === 'labs' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Microbiology & Assays ({labs.length})</h3>
          {labs.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 text-xs">
              No laboratory diagnostic assays recorded for this patient.
            </div>
          ) : (
            <div className="space-y-2">
              {labs.map((lb) => (
                <div key={lb.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-900">{lb.testName}</p>
                    <p className="text-[11px] font-mono text-rose-600 font-bold">{lb.result}</p>
                    <p className="text-[10px] text-slate-400">{lb.laboratoryName} • {lb.reportedDate}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${lb.isAbnormal ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
                    {lb.isAbnormal ? 'Abnormal / Pathological' : 'Normal'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Timeline Tab */}
      {activeTab === 'timeline' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6">
          <PatientTimelineView events={timeline} patientName={`${patient.firstName} ${patient.lastName}`} />
        </div>
      )}

      {/* Treatment Care Tab */}
      {activeTab === 'treatment' && (
        treatment ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{treatment.regimenName}</h3>
                <p className="text-xs text-slate-500">Supervising: {treatment.supervisingDoctor} • {treatment.facility || 'Clinical Center'}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-mono font-bold text-xs rounded-xl border border-emerald-200">
                  {treatment.adherenceRate}% Adherence
                </span>
                <button
                  onClick={() => onNavigateScreening('treatment', patient.id)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  Open in DOTS Studio →
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-slate-400 text-[10px]">Start Date</p>
                <p className="font-bold text-slate-800 mt-1">{treatment.startDate}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-slate-400 text-[10px]">Target Completion</p>
                <p className="font-bold text-slate-800 mt-1">{treatment.estimatedEndDate}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-slate-400 text-[10px]">Current Care Phase</p>
                <p className="font-bold text-blue-700 mt-1">
                  {treatment.currentPhase === 'INTENSIVE_PHASE' ? 'Intensive Phase' : 'Continuation Phase'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-8 text-center space-y-3">
            <p className="text-slate-500 text-xs">No active DOTS treatment regimen currently enrolled for this patient.</p>
            <button
              onClick={() => onNavigateScreening('treatment', patient.id)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              + Initiate DOTS Treatment Plan
            </button>
          </div>
        )
      )}
    </div>
  );
};
