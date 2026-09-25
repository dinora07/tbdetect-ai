import React, { useState } from 'react';
import {
  Activity,
  UserCheck,
  Building,
  Stethoscope,
  Users,
  HeartPulse,
  Mail,
  Lock,
  Phone,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';

interface RegisterPageProps {
  onSuccess?: () => void;
  onNavigateLogin?: () => void;
  onBackToLanding?: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onSuccess,
  onNavigateLogin,
  onBackToLanding,
}) => {
  const { t } = useLanguage();
  const { login } = useAuth();

  const [selectedRole, setSelectedRole] = useState<Role>('DOCTOR');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    clinicName: 'Tashkent Pulmonary Center',
    organizationType: 'PULMONOLOGY_CENTER',
    licenseNumber: '',
    specialty: 'Pulmonology',
    dateOfBirth: '1985-06-15',
    gender: 'MALE',
    region: 'Tashkent City',
    agreeTerms: true,
  });

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.agreeTerms) return;

    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSuccess(true);
      setTimeout(() => {
        login(formData.email || 'doctor@tbdetect.ai', selectedRole);
        if (onSuccess) onSuccess();
      }, 1000);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-500/20 mb-3">
          <Activity className="w-6 h-6" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {t.auth.registerTitle}
        </h2>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          {t.auth.registerSub}
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl rounded-3xl border border-slate-200/80 space-y-6">
          {/* Role selector tabs */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              {t.auth.userType}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { role: 'DOCTOR', label: t.roles.DOCTOR, icon: Stethoscope },
                { role: 'CLINIC_ADMIN', label: t.roles.CLINIC_ADMIN, icon: Building },
                { role: 'MEDICAL_STAFF', label: t.roles.MEDICAL_STAFF, icon: Users },
                { role: 'PATIENT', label: t.roles.PATIENT, icon: HeartPulse },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = selectedRole === item.role;
                return (
                  <button
                    key={item.role}
                    type="button"
                    onClick={() => setSelectedRole(item.role as Role)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 text-blue-900 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                    <p className="text-xs font-bold leading-tight">{item.label}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Legal Name</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. Dr. Azizbek Rahmonov"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-600 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Medical / Contact Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@clinic.uz"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-600 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+998 90 123 4567"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-600 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Security Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Minimum 8 characters"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-600 outline-none"
                  required
                />
              </div>
            </div>

            {/* Role-specific fields */}
            {selectedRole === 'CLINIC_ADMIN' && (
              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-3">
                <p className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                  {t.auth.clinicInfo}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">{t.auth.clinicName}</label>
                    <input
                      type="text"
                      value={formData.clinicName}
                      onChange={(e) => setFormData({ ...formData, clinicName: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">{t.auth.orgType}</label>
                    <select
                      value={formData.organizationType}
                      onChange={(e) => setFormData({ ...formData, organizationType: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                    >
                      <option value="PULMONOLOGY_CENTER">Pulmonology & TB Center</option>
                      <option value="REGIONAL_HOSPITAL">Regional Multi-Profile Hospital</option>
                      <option value="PRIMARY_HEALTH_CLINIC">Primary Health Center</option>
                      <option value="MOBILE_SCREENING_UNIT">Mobile Radiology Unit</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {(selectedRole === 'DOCTOR' || selectedRole === 'MEDICAL_STAFF') && (
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-3">
                <p className="text-xs font-bold text-blue-950 uppercase tracking-wider">
                  Clinical Credentials
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Medical License ID</label>
                    <input
                      type="text"
                      value={formData.licenseNumber}
                      onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                      placeholder="e.g. MD-UZ-99412"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Specialty / Role</label>
                    <input
                      type="text"
                      value={formData.specialty}
                      onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Terms checkbox */}
            <div className="flex items-start pt-2">
              <input
                id="terms"
                type="checkbox"
                checked={formData.agreeTerms}
                onChange={(e) => setFormData({ ...formData, agreeTerms: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 mt-0.5"
                required
              />
              <label htmlFor="terms" className="ml-2 text-xs text-slate-600 leading-relaxed font-medium">
                {t.auth.agreeTerms}
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
            >
              {submitting ? (
                <span>Registering clinical account...</span>
              ) : success ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Account Created Successfully!</span>
                </>
              ) : (
                <>
                  <span>{t.auth.createAccount}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-2 border-t border-slate-100 space-y-2">
            <p className="text-xs text-slate-500">
              {t.auth.alreadyHaveAccount}{' '}
              <button
                type="button"
                onClick={() => onNavigateLogin && onNavigateLogin()}
                className="font-bold text-blue-600 hover:text-blue-800"
              >
                {t.auth.signInBtn}
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
      </div>
    </div>
  );
};
