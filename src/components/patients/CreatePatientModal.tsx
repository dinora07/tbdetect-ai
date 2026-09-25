import React, { useState } from 'react';
import { X, UserPlus, Heart, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Patient, RiskLevel, ScreeningStatus, TreatmentStatus } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface CreatePatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (patient: Omit<Patient, 'id' | 'createdAt' | 'updatedAt' | 'riskScore' | 'riskLevel' | 'status' | 'treatmentStatus'>) => void;
}

export const CreatePatientModal: React.FC<CreatePatientModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    nationalId: '',
    dateOfBirth: '1988-04-12',
    age: 36,
    gender: 'MALE' as 'MALE' | 'FEMALE' | 'OTHER',
    phone: '+998 90 123 4567',
    email: '',
    address: 'Amir Temur Avenue 45',
    region: 'Tashkent City',
    tbHistory: 'NONE' as 'NONE' | 'PREVIOUS_CURED' | 'HOUSEHOLD_CONTACT' | 'KNOWN_EXPOSURE',
    comorbidities: [] as string[],
    emergencyName: 'Dilshod Karimov',
    emergencyRel: 'Brother',
    emergencyPhone: '+998 90 987 6543',
    occupation: 'Factory Worker',
    notes: 'Intake screening for chronic cough and fatigue.',
  });

  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleCheckboxToggle = (value: string) => {
    setFormData((prev) => {
      const list = prev.comorbidities;
      if (list.includes(value)) {
        return { ...prev, comorbidities: list.filter((i) => i !== value) };
      } else {
        return { ...prev, comorbidities: [...list, value] };
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.nationalId) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const newPatientData: Omit<Patient, 'id' | 'createdAt' | 'updatedAt' | 'riskScore' | 'riskLevel' | 'status' | 'treatmentStatus'> = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        nationalId: formData.nationalId,
        dateOfBirth: formData.dateOfBirth,
        age: Number(formData.age),
        gender: formData.gender,
        phone: formData.phone,
        email: formData.email || undefined,
        address: formData.address,
        region: formData.region,
        assignedDoctorId: 'usr_doc_1',
        assignedDoctorName: 'Dr. Sarah Chen, MD',
        clinicId: 'cln_001',
        clinicName: 'Tashkent Central Pulmonology Center',
        tbHistory: formData.tbHistory,
        comorbidities: formData.comorbidities,
        emergencyContact: {
          name: formData.emergencyName,
          relationship: formData.emergencyRel,
          phone: formData.emergencyPhone,
        },
        occupation: formData.occupation,
        notes: formData.notes || 'Registered in clinical cohort. Awaiting initial multimodal radiograph & sputum assay.',
        lastScreeningDate: new Date().toISOString().split('T')[0],
      };
      onSubmit(newPatientData);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {t.patients.createModal.title}
              </h2>
              <p className="text-xs text-slate-500">
                {t.patients.createModal.subtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {t.patients.createModal.firstName} *
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="e.g. Jasur"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 outline-none font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {t.patients.createModal.lastName} *
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="e.g. Alimov"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 outline-none font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {t.patients.createModal.nationalId} *
              </label>
              <input
                type="text"
                required
                value={formData.nationalId}
                onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                placeholder="e.g. AA 1234567"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 outline-none font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {t.patients.createModal.gender}
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 outline-none font-medium"
              >
                <option value="MALE">{t.patients.createModal.male}</option>
                <option value="FEMALE">{t.patients.createModal.female}</option>
                <option value="OTHER">{t.patients.createModal.other}</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Age
              </label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {t.patients.createModal.phone}
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {t.patients.createModal.region}
              </label>
              <select
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              >
                <option value="Tashkent City">Tashkent City</option>
                <option value="Samarkand Region">Samarkand Region</option>
                <option value="Fergana Valley">Fergana Valley</option>
                <option value="Bukhara Region">Bukhara Region</option>
                <option value="Karakalpakstan">Karakalpakstan</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {t.patients.createModal.tbHistory}
              </label>
              <select
                value={formData.tbHistory}
                onChange={(e) => setFormData({ ...formData, tbHistory: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
              >
                <option value="NONE">{t.patients.createModal.none}</option>
                <option value="PREVIOUS_CURED">{t.patients.createModal.previousCured}</option>
                <option value="HOUSEHOLD_CONTACT">{t.patients.createModal.householdContact}</option>
                <option value="KNOWN_EXPOSURE">{t.patients.createModal.knownExposure}</option>
              </select>
            </div>
          </div>

          {/* Comorbidities */}
          <div className="space-y-1.5 pt-2">
            <label className="block font-bold text-slate-700">
              {t.patients.createModal.comorbidities}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                'Diabetes Mellitus',
                'Smoker / Tobacco',
                'Immunocompromised',
                'HIV Negative',
                'Chronic Bronchitis',
                'Malnutrition',
              ].map((c) => (
                <label
                  key={c}
                  className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer ${
                    formData.comorbidities.includes(c)
                      ? 'bg-blue-50 border-blue-300 text-blue-800'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.comorbidities.includes(c)}
                    onChange={() => handleCheckboxToggle(c)}
                    className="w-3.5 h-3.5 text-blue-600 rounded"
                  />
                  <span>{c}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Clinical notes */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              {t.patients.createModal.notes}
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 outline-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{loading ? t.patients.createModal.submitting : t.patients.createModal.submitBtn}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
