import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  Download,
  ChevronRight,
  ScanLine,
  Stethoscope,
  HeartPulse,
  MoreVertical,
  SlidersHorizontal,
} from 'lucide-react';
import { Patient, RiskLevel, ScreeningStatus } from '../../types';
import { patientService } from '../../services/api';
import { RiskBadge } from '../common/RiskBadge';
import { StatusBadge } from '../common/StatusBadge';
import { CreatePatientModal } from './CreatePatientModal';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

interface PatientListProps {
  onSelectPatient: (patientId: string) => void;
  onNavigateScreening?: (tool: 'xray' | 'symptoms' | 'cough', patientId: string) => void;
  onScreenPatient?: (patientId: string) => void;
}

export const PatientList: React.FC<PatientListProps> = ({
  onSelectPatient,
  onNavigateScreening,
  onScreenPatient,
}) => {
  const { t } = useLanguage();
  const { isPatient } = useAuth();

  const handleScreen = (tool: 'xray' | 'symptoms' | 'cough', patientId: string) => {
    if (onNavigateScreening) {
      onNavigateScreening(tool, patientId);
    } else if (onScreenPatient) {
      onScreenPatient(patientId);
    }
  };

  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [regionFilter, setRegionFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'riskScore' | 'name' | 'date'>('riskScore');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    setLoading(true);
    try {
      const data = await patientService.getPatients();
      setPatients(data);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePatient = async (newPatientData: Omit<Patient, 'id' | 'createdAt' | 'updatedAt' | 'riskScore' | 'riskLevel' | 'status' | 'treatmentStatus'>) => {
    const created = await patientService.createPatient(newPatientData);
    setPatients((prev) => [created, ...prev]);
  };

  // Export cohort as CSV
  const handleExportCSV = () => {
    const headers = ['ID,National ID,Name,Age,Gender,Phone,Region,Risk Level,Risk Score %,Status,Registration Date'];
    const rows = patients.map(
      (p) =>
        `"${p.id}","${p.nationalId}","${p.firstName} ${p.lastName}",${p.age},"${p.gender}","${p.phone}","${p.region}","${p.riskLevel}",${p.riskScore},"${p.status}","${p.createdAt || new Date().toISOString().split('T')[0]}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tbdetect_cohort_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered & Sorted
  const filteredPatients = patients
    .filter((p) => {
      const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
      const matchesSearch =
        fullName.includes(searchQuery.toLowerCase()) ||
        p.nationalId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.phone.includes(searchQuery);

      const matchesRisk = riskFilter === 'ALL' || p.riskLevel === riskFilter;
      const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
      const matchesRegion = regionFilter === 'ALL' || p.region === regionFilter;

      return matchesSearch && matchesRisk && matchesStatus && matchesRegion;
    })
    .sort((a, b) => {
      if (sortBy === 'riskScore') return b.riskScore - a.riskScore;
      if (sortBy === 'name') return a.lastName.localeCompare(b.lastName);
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

  return (
    <div className="space-y-6 pb-12">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {t.patients.title}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-700">
              {filteredPatients.length} Active Dossiers
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {t.patients.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold shadow-2xs transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>

          {!isPatient && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>{t.patients.newPatientBtn}</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Filter Strip */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="lg:col-span-2 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, National ID, or phone..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-600 outline-none"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          {/* Risk Level Filter */}
          <div>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:border-blue-600 outline-none"
            >
              <option value="ALL">All Risk Tiers</option>
              <option value="CRITICAL">Critical Risk (85%+)</option>
              <option value="HIGH">High Risk (65-84%)</option>
              <option value="MODERATE">Moderate Risk (35-64%)</option>
              <option value="LOW">Low Risk (&lt;35%)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:border-blue-600 outline-none"
            >
              <option value="ALL">All Screening Statuses</option>
              <option value="PENDING_REVIEW">Pending Review</option>
              <option value="REVIEWED">Doctor Reviewed</option>
              <option value="ACTIVE">Active DOTS Care</option>
              <option value="FOLLOW_UP_REQUIRED">Follow-up Required</option>
              <option value="DISCHARGED">Discharged</option>
            </select>
          </div>

          {/* Sort selector */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:border-blue-600 outline-none font-mono"
            >
              <option value="riskScore">Sort: Highest AI Risk</option>
              <option value="name">Sort: Patient Name (A-Z)</option>
              <option value="date">Sort: Newest Registered</option>
            </select>
          </div>
        </div>
      </div>

      {/* Patient Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3.5 pl-4">Patient Dossier</th>
                <th className="py-3.5">National ID</th>
                <th className="py-3.5">Age / Gender</th>
                <th className="py-3.5">Region</th>
                <th className="py-3.5">AI Risk Tier</th>
                <th className="py-3.5">Clinical Status</th>
                <th className="py-3.5 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700">No patients matched the criteria</p>
                    <p className="text-xs text-slate-400 mt-0.5">Try resetting search filters or register a new patient.</p>
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient) => (
                  <tr
                    key={patient.id}
                    onClick={() => onSelectPatient(patient.id)}
                    className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                  >
                    {/* Patient Name & Initials */}
                    <td className="py-4 pl-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-slate-100 to-slate-200 flex items-center justify-center text-slate-800 font-bold text-xs shadow-2xs group-hover:from-blue-600 group-hover:to-cyan-600 group-hover:text-white transition-all">
                          {patient.firstName[0]}{patient.lastName[0]}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-xs">
                            {patient.firstName} {patient.lastName}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono">
                            {patient.phone}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* National ID */}
                    <td className="py-4 font-mono text-slate-500 font-semibold text-xs">
                      {patient.nationalId}
                    </td>

                    {/* Age / Gender */}
                    <td className="py-4 text-slate-600">
                      {patient.age} yrs • {patient.gender === 'MALE' ? 'Male' : 'Female'}
                    </td>

                    {/* Region */}
                    <td className="py-4 text-slate-600">
                      {patient.region}
                    </td>

                    {/* AI Risk */}
                    <td className="py-4">
                      <RiskBadge level={patient.riskLevel} score={patient.riskScore} showScore />
                    </td>

                    {/* Status */}
                    <td className="py-4">
                      <StatusBadge status={patient.status} />
                    </td>

                    {/* Actions */}
                    <td className="py-4 pr-4 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleScreen('xray', patient.id)}
                          title="Screen Chest Radiograph"
                          className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                        >
                          <ScanLine className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleScreen('symptoms', patient.id)}
                          title="WHO Symptom Screener"
                          className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                        >
                          <Stethoscope className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onSelectPatient(patient.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-blue-600 hover:text-white rounded-xl text-[11px] font-bold text-slate-700 transition-all ml-1"
                        >
                          <span>Dossier</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Patient Modal */}
      <CreatePatientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreatePatient}
      />
    </div>
  );
};
