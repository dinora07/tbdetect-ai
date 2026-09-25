import React, { useState } from 'react';
import {
  Activity,
  ScanLine,
  Mic,
  Stethoscope,
  FileText,
  HeartPulse,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Users,
  Building,
  Lock,
  Globe,
  ChevronRight,
  TrendingUp,
  Cpu,
  Layers,
  AlertTriangle,
  Play,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';

interface LandingPageProps {
  onEnterApp?: () => void;
  onGetStarted?: () => void;
  onNavigateAuth?: (mode: 'login' | 'register') => void;
  onSignIn?: () => void;
  onRegister?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterApp,
  onGetStarted,
  onNavigateAuth,
  onSignIn,
  onRegister,
}) => {
  const { t, language, setLanguage } = useLanguage();
  const { switchDemoRole } = useAuth();
  const [activePipelineStep, setActivePipelineStep] = useState(1);
  const [interactiveHeatmap, setInteractiveHeatmap] = useState(true);

  const handleEnterApp = () => {
    if (onEnterApp) {
      onEnterApp();
    } else if (onGetStarted) {
      onGetStarted();
    }
  };

  const handleNavigateAuth = (mode: 'login' | 'register') => {
    if (onNavigateAuth) {
      onNavigateAuth(mode);
    } else if (mode === 'login' && onSignIn) {
      onSignIn();
    } else if (mode === 'register' && onRegister) {
      onRegister();
    }
  };

  const handleDemoLogin = (role: Role) => {
    switchDemoRole(role);
    handleEnterApp();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-cyan-500/20 selection:text-cyan-900 font-sans">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-cyan-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-slate-900">
                TBDetect <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">AI</span>
              </span>
              <span className="hidden sm:inline-block text-[11px] font-semibold text-slate-400 ml-2.5 border-l border-slate-200 pl-2.5">
                {t.brand.tagline}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Language switch */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-mono font-semibold">
              <button
                onClick={() => setLanguage('en')}
                className={`px-2 py-1 rounded-lg transition-all ${language === 'en' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('ru')}
                className={`px-2 py-1 rounded-lg transition-all ${language === 'ru' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                RU
              </button>
              <button
                onClick={() => setLanguage('uz')}
                className={`px-2 py-1 rounded-lg transition-all ${language === 'uz' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                UZ
              </button>
            </div>

            <button
              onClick={() => handleNavigateAuth('login')}
              className="text-xs font-bold text-slate-700 hover:text-slate-900 px-3 py-2"
            >
              {t.auth.signInBtn}
            </button>

            <button
              onClick={handleEnterApp}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-md shadow-blue-500/25 transition-all group"
            >
              <span>{t.landing.startScreening}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 overflow-hidden bg-gradient-to-b from-blue-50/40 via-white to-slate-50 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-800 text-xs font-bold shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>{t.landing.badge}</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-950 tracking-tight leading-[1.1]">
              {t.landing.heroTitle1}{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-600 to-indigo-600">
                {t.landing.heroTitle2}
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
              {t.landing.heroDesc}
            </p>

            <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={handleEnterApp}
                className="px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2"
              >
                <span>{t.landing.startScreening}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleNavigateAuth('register')}
                className="px-5 py-3 text-sm font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-2xs transition-all"
              >
                {t.landing.bookDemo}
              </button>
            </div>

            {/* Quick Demo Mode Selector */}
            <div className="pt-6">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                {t.landing.demoRoles}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
                <button
                  onClick={() => handleDemoLogin('DOCTOR')}
                  className="px-3 py-1.5 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg font-semibold text-slate-700 hover:text-blue-700 transition-colors shadow-2xs flex items-center gap-1.5"
                >
                  <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
                  <span>{t.auth.doctorDemo}</span>
                </button>
                <button
                  onClick={() => handleDemoLogin('CLINIC_ADMIN')}
                  className="px-3 py-1.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-lg font-semibold text-slate-700 hover:text-indigo-700 transition-colors shadow-2xs flex items-center gap-1.5"
                >
                  <Building className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{t.auth.adminDemo}</span>
                </button>
                <button
                  onClick={() => handleDemoLogin('MEDICAL_STAFF')}
                  className="px-3 py-1.5 bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-300 rounded-lg font-semibold text-slate-700 hover:text-teal-700 transition-colors shadow-2xs flex items-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5 text-teal-600" />
                  <span>{t.auth.staffDemo}</span>
                </button>
                <button
                  onClick={() => handleDemoLogin('PATIENT')}
                  className="px-3 py-1.5 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-lg font-semibold text-slate-700 hover:text-emerald-700 transition-colors shadow-2xs flex items-center gap-1.5"
                >
                  <HeartPulse className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{t.auth.patientDemo}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Hero AI Multimodal Visualization Sandbox */}
          <div className="mt-12 max-w-5xl mx-auto bg-slate-900 rounded-3xl p-4 sm:p-6 shadow-2xl border border-slate-800 text-white relative overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Sandbox Top Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500" />
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="ml-2 font-mono text-slate-400">
                  TBDetect Multimodal Live Inference Pipeline v3.4
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-[11px] font-mono text-emerald-400 font-semibold">TENSOR CORE ACTIVE</span>
              </div>
            </div>

            {/* Grid Layout: Radiograph + AI Attention + Clinical Decision */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 items-center">
              {/* Radiograph Visualizer */}
              <div className="lg:col-span-7 relative rounded-2xl bg-black border border-slate-800 overflow-hidden group shadow-inner">
                <img
                  src="https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80"
                  alt="Chest X-Ray Radiograph"
                  referrerPolicy="no-referrer"
                  className="w-full h-80 object-cover opacity-80 filter contrast-125"
                />

                {/* Laser scanline animation */}
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-scanline opacity-80 shadow-[0_0_15px_#22d3ee]" />

                {/* Heatmap overlay */}
                {interactiveHeatmap && (
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Upper right lobe cavitation highlight */}
                    <div className="absolute top-[20%] right-[25%] w-28 h-28 rounded-full bg-rose-500/40 blur-md border-2 border-rose-400/80 animate-pulse-subtle flex items-center justify-center">
                      <span className="text-[10px] font-mono font-bold bg-rose-950/90 text-rose-300 px-2 py-0.5 rounded border border-rose-600">
                        Cavitation 96%
                      </span>
                    </div>

                    {/* Apical pleural thickening */}
                    <div className="absolute top-[15%] left-[28%] w-24 h-20 rounded-full bg-amber-500/30 blur-sm border border-amber-400/60" />
                  </div>
                )}

                {/* Controls overlay */}
                <div className="absolute bottom-3 inset-x-3 flex items-center justify-between p-2 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-700 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-300 font-bold">Patient: Rustam K. (48M)</span>
                    <span className="px-1.5 py-0.5 text-[10px] bg-slate-800 text-slate-300 rounded font-mono">
                      PA Chest View
                    </span>
                  </div>
                  <button
                    onClick={() => setInteractiveHeatmap(!interactiveHeatmap)}
                    className="px-2.5 py-1 rounded-lg bg-blue-600/80 hover:bg-blue-600 text-white text-[11px] font-semibold transition-colors"
                  >
                    {interactiveHeatmap ? 'Toggle Original' : 'Toggle AI Heatmap'}
                  </button>
                </div>
              </div>

              {/* AI Inference & Clinical Triage Panel */}
              <div className="lg:col-span-5 space-y-4">
                {/* Risk Gauge Metric Card */}
                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                        Multimodal AI Risk Index
                      </p>
                      <p className="text-3xl font-black text-rose-400 font-mono tracking-tight mt-0.5">
                        84% <span className="text-xs font-bold text-rose-300 ml-1 px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/30">HIGH RISK</span>
                      </p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-700/60">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Deep CNN Radiograph:</span>
                      <span className="font-mono font-bold text-rose-300">Cavitation (0.96)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Acoustic Cough Biomarker:</span>
                      <span className="font-mono font-bold text-amber-300">Explosive 142ms (81%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">WHO Symptoms Index:</span>
                      <span className="font-mono font-bold text-orange-300">88% (Hemoptysis +)</span>
                    </div>
                  </div>
                </div>

                {/* Doctor Decision Card */}
                <div className="p-4 rounded-2xl bg-blue-950/60 border border-blue-800/80 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                    <span>Doctor Review & Clinical Confirmation</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Dr. Sarah Chen, MD confirmed high suspicion of active cavitary TB. GeneXpert MTB confirmed. 2HRZE DOTS regimen prescribed.
                  </p>
                  <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-mono">Signed: MD-UZ-84920</span>
                    <span className="text-emerald-400 font-bold">Clinical Care Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Multimodal Diagnostic Pipeline Section */}
      <section className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-blue-600 uppercase tracking-widest">
              End-to-End Clinical Architecture
            </h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-2">
              {t.landing.pipelineTitle}
            </p>
            <p className="text-slate-600 text-sm sm:text-base mt-3 leading-relaxed">
              {t.landing.pipelineSub}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              {
                step: 1,
                title: t.landing.step1,
                desc: t.landing.step1Desc,
                icon: Users,
                color: 'from-blue-600 to-cyan-600',
              },
              {
                step: 2,
                title: t.landing.step2,
                desc: t.landing.step2Desc,
                icon: Cpu,
                color: 'from-cyan-600 to-teal-600',
              },
              {
                step: 3,
                title: t.landing.step3,
                desc: t.landing.step3Desc,
                icon: Activity,
                color: 'from-indigo-600 to-violet-600',
              },
              {
                step: 4,
                title: t.landing.step4,
                desc: t.landing.step4Desc,
                icon: Stethoscope,
                color: 'from-blue-600 to-indigo-600',
              },
              {
                step: 5,
                title: t.landing.step5,
                desc: t.landing.step5Desc,
                icon: HeartPulse,
                color: 'from-emerald-600 to-teal-600',
              },
            ].map((p) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.step}
                  className="relative p-5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-all shadow-xs group"
                >
                  <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-800 mb-3 shadow-2xs group-hover:scale-105 transition-transform">
                    {p.step}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">{p.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{p.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Core Diagnostic Modules Grid */}
      <section className="py-20 bg-slate-50/70 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-blue-600 uppercase tracking-widest">
              Clinical Modalities
            </h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-2">
              Multimodal Fusion for Unmatched Screening Precision
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* X-Ray AI */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-2xs">
                <ScanLine className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{t.nav.xrayAnalysis}</h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Deep convolutional neural networks detect apical consolidation, cavitary lesions, and pleural effusions with millisecond latency.
                </p>
              </div>
              <ul className="text-xs text-slate-600 space-y-1.5 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>DICOM & High-res JPEG support</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Localized attention heatmap overlay</span>
                </li>
              </ul>
            </div>

            {/* Cough Sound AI */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shadow-2xs">
                <Mic className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{t.nav.coughAi}</h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Neural acoustic spectrogram analysis examines explosive phase duration and harmonic spectral energy distribution.
                </p>
              </div>
              <ul className="text-xs text-slate-600 space-y-1.5 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                  <span>Real-time microphone audio capture</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                  <span>Mel-spectrogram acoustic classifier</span>
                </li>
              </ul>
            </div>

            {/* Symptom Intelligence */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-2xs">
                <Stethoscope className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{t.nav.symptoms}</h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  WHO-compliant algorithmic screening matrix evaluating cough chronicity, hemoptysis, nocturnal hyperhidrosis, and weight loss.
                </p>
              </div>
              <ul className="text-xs text-slate-600 space-y-1.5 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Epidemiological exposure scoring</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Comorbidity risk multipliers</span>
                </li>
              </ul>
            </div>

            {/* Continuous DOTS Care */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-2xs">
                <HeartPulse className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{t.nav.treatment}</h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Longitudinal 6-month Directly Observed Therapy (DOTS) monitoring, pill adherence tracking, and weight recovery surveillance.
                </p>
              </div>
              <ul className="text-xs text-slate-600 space-y-1.5 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Missed dose automated triage</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Longitudinal recovery timeline</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Institutional Security & Readiness */}
      <section className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                <Lock className="w-3.5 h-3.5 text-blue-600" />
                <span>Enterprise Clinical Governance</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                {t.landing.securityTitle}
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Designed for regional hospital networks, national tuberculosis control programs, and private diagnostic facilities.
              </p>

              <div className="space-y-3 pt-2">
                {[
                  t.landing.sec1,
                  t.landing.sec2,
                  t.landing.sec3,
                  t.landing.sec4,
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-xs font-semibold text-slate-800">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900 text-white space-y-4 shadow-xl border border-slate-800">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-300">Backend Ready Architecture</span>
                <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                  Java Spring Boot REST API
                </span>
              </div>
              <div className="space-y-2 font-mono text-xs text-slate-300">
                <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700 flex justify-between">
                  <span className="text-emerald-400 font-bold">POST</span>
                  <span className="text-slate-300">/api/xray/analyze</span>
                  <span className="text-slate-500">200 OK</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700 flex justify-between">
                  <span className="text-blue-400 font-bold">GET</span>
                  <span className="text-slate-300">/api/patients/{'{id}'}/timeline</span>
                  <span className="text-slate-500">200 OK</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700 flex justify-between">
                  <span className="text-emerald-400 font-bold">POST</span>
                  <span className="text-slate-300">/api/cough/analyze</span>
                  <span className="text-slate-500">200 OK</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-800 leading-relaxed">
                Clean TypeScript DTO and API service contracts decouple the frontend UI from the future PostgreSQL / Spring Boot deployment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-tr from-blue-700 via-blue-800 to-indigo-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            {t.landing.ctaTitle}
          </h2>
          <p className="text-blue-100 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            {t.landing.ctaDesc}
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={handleEnterApp}
              className="px-8 py-3.5 text-sm font-bold text-blue-900 bg-white hover:bg-blue-50 rounded-xl shadow-xl transition-all"
            >
              {t.landing.ctaBtn}
            </button>
            <button
              onClick={() => handleNavigateAuth('login')}
              className="px-6 py-3.5 text-sm font-bold text-white bg-blue-900/60 hover:bg-blue-900 border border-blue-500/40 rounded-xl transition-all"
            >
              {t.auth.signInBtn}
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
            <span className="font-bold text-white tracking-tight">TBDetect AI</span>
            <span>— {t.brand.tagline}</span>
          </div>
          <p className="text-slate-500 text-center sm:text-right">
            {t.landing.footerRights}
          </p>
        </div>
      </footer>
    </div>
  );
};
