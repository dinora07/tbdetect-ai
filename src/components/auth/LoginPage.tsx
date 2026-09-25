import React, { useState } from 'react';
import {
  Activity,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Stethoscope,
  Building,
  Users,
  HeartPulse,
  Globe,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Role } from '../../types';

interface LoginPageProps {
  onSuccess?: () => void;
  onNavigateRegister?: () => void;
  onForgotPassword?: () => void;
  onBackToLanding?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onSuccess,
  onNavigateRegister,
  onForgotPassword,
  onBackToLanding,
}) => {
  const { login, switchDemoRole } = useAuth();
  const { t, language, setLanguage } = useLanguage();

  const [email, setEmail] = useState('sarah.chen@tbdetect.ai');
  const [password, setPassword] = useState('DoctorSecret2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter your institutional email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(email);
      if (onSuccess) onSuccess();
    } catch {
      setError('Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (role: Role, demoEmail: string) => {
    switchDemoRole(role);
    setEmail(demoEmail);
    login(demoEmail, role);
    if (onSuccess) onSuccess();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-cyan-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 mb-4">
          <Activity className="w-7 h-7" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {t.auth.loginTitle}
        </h2>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          {t.auth.loginSub}
        </p>

        {/* Language pill */}
        <div className="mt-3 flex items-center justify-center gap-1.5 text-xs font-mono font-bold">
          <Globe className="w-3.5 h-3.5 text-slate-400" />
          <button
            onClick={() => setLanguage('en')}
            className={`px-2 py-0.5 rounded ${language === 'en' ? 'bg-blue-100 text-blue-700 font-bold' : 'text-slate-500'}`}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage('ru')}
            className={`px-2 py-0.5 rounded ${language === 'ru' ? 'bg-blue-100 text-blue-700 font-bold' : 'text-slate-500'}`}
          >
            RU
          </button>
          <button
            onClick={() => setLanguage('uz')}
            className={`px-2 py-0.5 rounded ${language === 'uz' ? 'bg-blue-100 text-blue-700 font-bold' : 'text-slate-500'}`}
          >
            UZ
          </button>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-8 shadow-xl rounded-3xl border border-slate-200/80 space-y-6">
          {/* Quick Demo Access Bar */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-2">
            <p className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              {t.auth.quickDemo}
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickDemo('DOCTOR', 'sarah.chen@tbdetect.ai')}
                className="p-2 bg-white hover:bg-indigo-100/50 border border-indigo-200 rounded-xl text-left font-semibold text-slate-800 transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
                <span className="truncate">{t.auth.doctorDemo}</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('CLINIC_ADMIN', 'admin.bekzod@tbdetect.ai')}
                className="p-2 bg-white hover:bg-indigo-100/50 border border-indigo-200 rounded-xl text-left font-semibold text-slate-800 transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <Building className="w-3.5 h-3.5 text-indigo-600" />
                <span className="truncate">{t.auth.adminDemo}</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('MEDICAL_STAFF', 'elena.staff@tbdetect.ai')}
                className="p-2 bg-white hover:bg-indigo-100/50 border border-indigo-200 rounded-xl text-left font-semibold text-slate-800 transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <Users className="w-3.5 h-3.5 text-teal-600" />
                <span className="truncate">{t.auth.staffDemo}</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('PATIENT', 'rustam.karimov@example.uz')}
                className="p-2 bg-white hover:bg-indigo-100/50 border border-indigo-200 rounded-xl text-left font-semibold text-slate-800 transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <HeartPulse className="w-3.5 h-3.5 text-rose-600" />
                <span className="truncate">{t.auth.patientDemo}</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.auth.email}
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all pl-10"
                  required
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  {t.auth.password}
                </label>
                <button
                  type="button"
                  onClick={onForgotPassword}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                >
                  {t.auth.forgotPassword}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all pl-10 pr-10"
                  required
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="remember-me" className="ml-2 text-xs text-slate-600 font-medium">
                {t.auth.rememberMe}
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Verifying credentials...</span>
              ) : (
                <>
                  <span>{t.auth.signInBtn}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-2 border-t border-slate-100 space-y-2">
            <p className="text-xs text-slate-500">
              {t.auth.noAccount}{' '}
              <button
                type="button"
                onClick={() => onNavigateRegister && onNavigateRegister()}
                className="font-bold text-blue-600 hover:text-blue-800"
              >
                {t.auth.registerPrompt}
              </button>
            </p>
            {onBackToLanding && (
              <button
                type="button"
                onClick={onBackToLanding}
                className="text-xs text-slate-400 hover:text-slate-600 block mx-auto underline"
              >
                ← Back to Overview
              </button>
            )}
          </div>
        </div>

        {/* Regulatory note */}
        <p className="text-center text-[11px] text-slate-400 mt-6 max-w-sm mx-auto leading-relaxed">
          {t.brand.disclaimerShort}
        </p>
      </div>
    </div>
  );
};
