import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Patient, SymptomAssessment } from '../../types';
import { patientService, symptomService } from '../../services/api';
import { RiskGauge } from '../common/RiskGauge';
import { MedicalDisclaimer } from '../common/MedicalDisclaimer';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

interface SymptomIntelligenceViewProps {
  initialPatientId?: string;
  onNavigateScreening?: (tool: 'xray' | 'cough' | 'labs', patientId: string) => void;
}

export const SymptomIntelligenceView: React.FC<SymptomIntelligenceViewProps> = ({
  initialPatientId,
  onNavigateScreening,
}) => {
  const { t } = useLanguage();
  const { user } = useAuth();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>(initialPatientId || 'pat_001');

  // Form Questionnaire state
  const [coughDays, setCoughDays] = useState(21);
  const [hasFever, setHasFever] = useState(true);
  const [hasNightSweats, setHasNightSweats] = useState(true);
  const [hasWeightLoss, setHasWeightLoss] = useState(true);
  const [hasHemoptysis, setHasHemoptysis] = useState(true);
  const [hasChestPain, setHasChestPain] = useState(true);
  const [hasFatigue, setHasFatigue] = useState(true);
  const [hasLossOfAppetite, setHasLossOfAppetite] = useState(true);
  const [hasShortnessOfBreath, setHasShortnessOfBreath] = useState(false);

  const [closeContactWithTB, setCloseContactWithTB] = useState(true);
  const [smoker, setSmoker] = useState(true);
  const [diabetic, setDiabetic] = useState(false);
  const [immunocompromised, setImmunocompromised] = useState(false);
  const [livingInCrowdedArea, setLivingInCrowdedArea] = useState(false);

  // Assessment results
  const [assessmentResult, setAssessmentResult] = useState<SymptomAssessment | null>(null);
  const [evaluating, setEvaluating] = useState(false);

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    if (selectedPatientId) {
      loadPatientSymptoms(selectedPatientId);
    }
  }, [selectedPatientId]);

  const loadPatients = async () => {
    const pts = await patientService.getPatients();
    setPatients(pts);
  };

  const loadPatientSymptoms = async (patientId: string) => {
    const existing = await symptomService.getSymptomsByPatientId(patientId);
    if (existing.length > 0) {
      setAssessmentResult(existing[0]);
      const s = existing[0].symptoms;
      const rf = existing[0].riskFactors;
      setCoughDays(s.coughDurationDays ?? 14);
      setHasFever(s.hasFever ?? false);
      setHasNightSweats(s.hasNightSweats ?? false);
      setHasWeightLoss(s.hasWeightLoss ?? false);
      setHasHemoptysis(s.hasHemoptysis ?? false);
      setHasChestPain(s.hasChestPain ?? false);
      setHasFatigue(s.hasFatigue ?? false);
      setHasLossOfAppetite(s.hasLossOfAppetite ?? false);
      setHasShortnessOfBreath(s.hasShortnessOfBreath ?? false);
      setCloseContactWithTB(rf.closeContactWithTB ?? false);
      setSmoker(rf.smoker ?? false);
      setDiabetic(rf.diabetic ?? false);
      setImmunocompromised(rf.immunocompromised ?? false);
      setLivingInCrowdedArea(rf.livingInCrowdedArea ?? false);
    } else {
      setAssessmentResult(null);
      // Reset form to defaults
      setCoughDays(14);
      setHasFever(false);
      setHasNightSweats(false);
      setHasWeightLoss(false);
      setHasHemoptysis(false);
      setHasChestPain(false);
      setHasFatigue(false);
      setHasLossOfAppetite(false);
      setHasShortnessOfBreath(false);
      setCloseContactWithTB(false);
      setSmoker(false);
      setDiabetic(false);
      setImmunocompromised(false);
      setLivingInCrowdedArea(false);
    }
  };

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    setEvaluating(true);

    const targetPatient = patients.find((p) => p.id === selectedPatientId);

    const result = await symptomService.assessSymptoms({
      patientId: selectedPatientId,
      patientName: targetPatient ? `${targetPatient.firstName} ${targetPatient.lastName}` : 'Patient',
      assessedBy: user?.name || 'Clinical Staff',
      symptoms: {
        coughDurationDays: coughDays,
        hasHemoptysis,
        hasFever,
        hasNightSweats,
        hasWeightLoss,
        hasChestPain,
        hasFatigue,
        hasLossOfAppetite,
        hasShortnessOfBreath,
      },
      riskFactors: {
        closeContactWithTB,
        smoker,
        diabetic,
        immunocompromised,
        livingInCrowdedArea,
      },
    });

    setAssessmentResult(result);
    setEvaluating(false);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {t.symptoms.title}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              WHO 4-Symptom Algorithmic Matrix
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {t.symptoms.subtitle}
          </p>
        </div>

        {/* Patient Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-600">{t.symptoms.patientLabel}:</label>
          <select
            value={selectedPatientId}
            onChange={(e) => {
              setSelectedPatientId(e.target.value);
              setAssessmentResult(null);
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 outline-none"
          >
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.firstName} {p.lastName} ({p.nationalId})
              </option>
            ))}
          </select>
        </div>
      </div>

      <MedicalDisclaimer variant="compact" />

      {/* Main Grid: Questionnaire & Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: WHO Symptom Matrix (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {t.symptoms.coughSection}
              </h2>
              <p className="text-xs text-slate-500">
                Systematic symptom evaluation for pulmonary tuberculosis
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 text-xs font-mono font-bold">
              Standard Matrix
            </span>
          </div>

          <form onSubmit={handleEvaluate} className="space-y-4">
            {/* Cough Duration Slider */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="font-bold text-slate-800">
                  {t.symptoms.coughDuration}:
                </label>
                <span className="font-mono font-bold px-2 py-0.5 bg-white rounded border text-blue-700">
                  {coughDays} Days {coughDays >= 14 ? '(WHO Flag >14d)' : ''}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                step="1"
                value={coughDays}
                onChange={(e) => setCoughDays(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>0 Days</span>
                <span>14 Days (Threshold)</span>
                <span>60 Days</span>
              </div>
            </div>

            {/* Core WHO 4-Symptoms Checklist */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Primary Cardinal Indicators:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { label: t.symptoms.hemoptysis, state: hasHemoptysis, setter: setHasHemoptysis, note: t.symptoms.hemoptysisDesc },
                  { label: t.symptoms.fever, state: hasFever, setter: setHasFever, note: 'Persistent >2 weeks' },
                  { label: t.symptoms.nightSweats, state: hasNightSweats, setter: setHasNightSweats, note: t.symptoms.nightSweatsDesc },
                  { label: t.symptoms.weightLoss, state: hasWeightLoss, setter: setHasWeightLoss, note: 'Unexplained >5% loss' },
                  { label: t.symptoms.chestPain, state: hasChestPain, setter: setHasChestPain, note: 'Pleuritic on inspiration' },
                  { label: t.symptoms.closeContact, state: closeContactWithTB, setter: setCloseContactWithTB, note: 'Household exposure' },
                ].map((item, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => item.setter(!item.state)}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-start justify-between ${
                      item.state
                        ? 'bg-blue-50/80 border-blue-400 text-blue-900 ring-1 ring-blue-400 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold">{item.label}</p>
                      <p className="text-[10px] text-slate-400">{item.note}</p>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        item.state ? 'bg-blue-600 text-white' : 'border border-slate-300'
                      }`}
                    >
                      {item.state && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={evaluating}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{evaluating ? 'Computing Clinical Tensor Score...' : t.symptoms.calculateRisk}</span>
            </button>
          </form>
        </div>

        {/* Right Panel: Algorithmic Result & Recommendations (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs text-center space-y-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              {t.symptoms.resultTitle}
            </h3>

            {assessmentResult ? (
              <RiskGauge
                score={assessmentResult.calculatedRiskScore}
                riskLevel={assessmentResult.riskLevel}
                size="lg"
              />
            ) : (
              <div className="py-12 text-slate-400 text-xs">
                <Stethoscope className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                <p>Complete the questionnaire and calculate to view clinical algorithm score.</p>
              </div>
            )}

            {assessmentResult && (
              <div className="space-y-4 pt-4 border-t border-slate-100 text-left text-xs">
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 space-y-1">
                  <p className="font-bold flex items-center gap-1.5 text-xs text-rose-950">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    {t.symptoms.recommendation}:
                  </p>
                  <p className="text-[11px] leading-relaxed text-rose-800">
                    {assessmentResult.summary}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                    Recommended Next Diagnostic Steps:
                  </p>
                  <button
                    onClick={() => onNavigateScreening && onNavigateScreening('xray', selectedPatientId)}
                    className="w-full p-2.5 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 rounded-xl font-bold flex items-center justify-between transition-colors"
                  >
                    <span>Proceed to Chest X-Ray AI Analysis</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onNavigateScreening && onNavigateScreening('labs', selectedPatientId)}
                    className="w-full p-2.5 bg-purple-50 hover:bg-purple-600 hover:text-white text-purple-700 rounded-xl font-bold flex items-center justify-between transition-colors"
                  >
                    <span>Order GeneXpert MTB/RIF Sputum Assay</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
