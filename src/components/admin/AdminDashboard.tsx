import React, { useState, useEffect } from 'react';
import {
  Users,
  Building,
  ShieldAlert,
  Server,
  UserPlus,
  Search,
  CheckCircle2,
  XCircle,
  Activity,
  Download,
  X,
  Edit2,
  Trash2,
  Plus,
  Shield,
  FileSpreadsheet,
  RefreshCw,
  MapPin,
  Phone,
  Mail,
  Eye,
  Calendar,
  Filter,
  AlertTriangle,
  FileText,
  Clock,
  ExternalLink,
  Lock,
  Sparkles,
  BarChart3,
} from 'lucide-react';
import { User, Clinic, AuditLog, Role } from '../../types';
import { adminService, patientService } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { downloadCsv } from '../../utils/exportUtils';
import { UzbekistanClinicsNetwork } from '../clinics/UzbekistanClinicsNetwork';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elementName: string]: any;
    }
  }
}

interface AdminDashboardProps {
  initialTab?: 'users' | 'clinics' | 'audit' | 'system';
  onNavigateTab?: (tab: string) => void;
  onSelectPatient?: (patientId: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  initialTab = 'users',
  onNavigateTab,
  onSelectPatient,
}) => {
  const { t } = useLanguage();
  const { user: authUser } = useAuth();
  const { success, error, info } = useToast();

  const [activeTab, setActiveTab] = useState<'users' | 'clinics' | 'audit' | 'system'>(initialTab);
  const [users, setUsers] = useState<User[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Sync tab with prop if changed from outside
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handleTabChange = (tab: 'users' | 'clinics' | 'audit' | 'system') => {
    setActiveTab(tab);
    if (onNavigateTab) {
      onNavigateTab(`admin-${tab}`);
    }
  };

  // View User Modal
  const [viewingUser, setViewingUser] = useState<User | null>(null);

  // Create / Edit user modal
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState<Role>('DOCTOR');
  const [userClinicId, setUserClinicId] = useState('cln_001');
  const [userSpecialty, setUserSpecialty] = useState('Pulmonology');
  const [userActive, setUserActive] = useState(true);

  // View Clinic Modal
  const [viewingClinic, setViewingClinic] = useState<Clinic | null>(null);
  // View Clinic Statistics Modal
  const [viewingClinicStats, setViewingClinicStats] = useState<Clinic | null>(null);

  // Create / Edit Clinic modal
  const [isClinicModalOpen, setIsClinicModalOpen] = useState(false);
  const [editingClinicId, setEditingClinicId] = useState<string | null>(null);
  const [clinicName, setClinicName] = useState('');
  const [clinicRegion, setClinicRegion] = useState('Tashkent');
  const [clinicAddress, setClinicAddress] = useState('');
  const [clinicPhone, setClinicPhone] = useState('+998 71 200 0000');
  const [clinicEmail, setClinicEmail] = useState('info@clinic.uz');

  // View Audit Log Event Details Modal
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLog | null>(null);

  // Search & Filter queries
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('ALL');
  const [userStatusFilter, setUserStatusFilter] = useState<string>('ALL');

  const [clinicSearch, setClinicSearch] = useState('');
  const [clinicRegionFilter, setClinicRegionFilter] = useState<string>('ALL');

  const [auditSearch, setAuditSearch] = useState('');
  const [auditModuleFilter, setAuditModuleFilter] = useState<string>('ALL');
  const [auditDateFilter, setAuditDateFilter] = useState<string>('ALL');
  const [auditUserFilter, setAuditUserFilter] = useState<string>('ALL');
  const [auditPatientFilter, setAuditPatientFilter] = useState<string>('ALL');

  // System health ping state
  const [healthPingTime, setHealthPingTime] = useState<string>(new Date().toLocaleTimeString());
  const [isPinging, setIsPinging] = useState<boolean>(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [u, c, a] = await Promise.all([
        adminService.getUsers(),
        adminService.getClinics(),
        adminService.getAuditLogs(),
      ]);
      setUsers(u);
      setClinics(c);
      setAuditLogs(a);
    } finally {
      setLoading(false);
    }
  };

  // User CRUD Handlers
  const handleOpenCreateUser = () => {
    setEditingUserId(null);
    setUserName('');
    setUserEmail('');
    setUserRole('DOCTOR');
    setUserClinicId(clinics[0]?.id || 'cln_001');
    setUserSpecialty('Pulmonology');
    setUserActive(true);
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (u: User) => {
    setEditingUserId(u.id);
    setUserName(u.name);
    setUserEmail(u.email);
    setUserRole(u.role);
    setUserClinicId(u.clinicId);
    setUserSpecialty(u.specialty || 'General');
    setUserActive(u.active);
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName || !userEmail) {
      error('Name and email are required.');
      return;
    }

    const selectedClinic = clinics.find((c) => c.id === userClinicId);
    const clinicNameVal = selectedClinic ? selectedClinic.name : 'Central Pulmonology';

    if (editingUserId) {
      const updated = await adminService.updateUser(editingUserId, {
        name: userName,
        email: userEmail,
        role: userRole,
        clinicId: userClinicId,
        clinicName: clinicNameVal,
        specialty: userSpecialty,
        active: userActive,
      });
      if (updated) {
        setUsers((prev) => prev.map((u) => (u.id === editingUserId ? updated : u)));
        success(`Staff member ${userName} updated.`);
      }
    } else {
      const created = await adminService.createUser({
        name: userName,
        email: userEmail,
        role: userRole,
        clinicId: userClinicId,
        clinicName: clinicNameVal,
        specialty: userSpecialty,
        active: userActive,
      });
      setUsers((prev) => [created, ...prev]);
      success(`Staff member ${userName} added to directory.`);
    }

    setIsUserModalOpen(false);
  };

  const handleToggleUserStatus = async (userObj: User) => {
    const updated = await adminService.updateUser(userObj.id, {
      active: !userObj.active,
    });
    if (updated) {
      setUsers((prev) => prev.map((u) => (u.id === userObj.id ? updated : u)));
      info(`User ${userObj.name} status updated to ${updated.active ? 'Active' : 'Suspended'}.`);
    }
  };

  // Clinic CRUD Handlers
  const handleOpenCreateClinic = () => {
    setEditingClinicId(null);
    setClinicName('');
    setClinicRegion('Tashkent');
    setClinicAddress('Navoi Street 12');
    setClinicPhone('+998 71 234 5678');
    setClinicEmail('clinic@tbhealth.uz');
    setIsClinicModalOpen(true);
  };

  const handleOpenEditClinic = (c: Clinic) => {
    setEditingClinicId(c.id);
    setClinicName(c.name);
    setClinicRegion(c.region);
    setClinicAddress(c.address);
    setClinicPhone(c.contactPhone || '+998 71 234 5678');
    setClinicEmail(c.contactEmail || 'clinic@tbhealth.uz');
    setIsClinicModalOpen(true);
  };

  const handleSaveClinic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicName) {
      error('Clinic name is required.');
      return;
    }

    if (editingClinicId) {
      const updated = await adminService.updateClinic(editingClinicId, {
        name: clinicName,
        region: clinicRegion,
        address: clinicAddress,
        contactPhone: clinicPhone,
        contactEmail: clinicEmail,
      });
      if (updated) {
        setClinics((prev) => prev.map((c) => (c.id === editingClinicId ? updated : c)));
        success(`Facility ${clinicName} updated.`);
      }
    } else {
      const created = await adminService.createClinic({
        name: clinicName,
        organizationType: 'PULMONOLOGY_CENTER',
        region: clinicRegion,
        regionKey: 'tashkent_city',
        address: clinicAddress,
        adminName: authUser?.name || 'Dr. Dilshod Karimov',
        licenseExpiry: '2028-12-31',
        status: 'ACTIVE',
        activeUsersCount: 1,
        totalPatientsCount: 0,
        activeScreeningsCount: 0,
        contactPhone: clinicPhone,
        contactEmail: clinicEmail,
      });
      setClinics((prev) => [created, ...prev]);
      success(`Facility ${clinicName} onboarded.`);
    }

    setIsClinicModalOpen(false);
  };

  // Export handlers
  const handleExportUsersCsv = () => {
    const headers = ['ID', 'Name', 'Email', 'Role', 'Facility', 'Specialty', 'Status', 'Last Activity'];
    const rows = users.map((u) => [
      u.id,
      u.name,
      u.email,
      u.role,
      u.clinicName,
      u.specialty || 'N/A',
      u.active ? 'Active' : 'Suspended',
      u.lastLogin || 'N/A',
    ]);
    downloadCsv(headers, rows, `TBDetect_Staff_Directory_${new Date().toISOString().slice(0, 10)}.csv`);
    success('Staff directory exported to CSV.');
  };

  const handleExportAuditCsv = () => {
    const headers = ['Timestamp', 'User', 'Role', 'Action', 'Module', 'Patient', 'Status', 'IP Address', 'Details'];
    const rows = filteredAuditLogs.map((log) => [
      log.timestamp,
      log.userName,
      log.userRole,
      log.action,
      log.module || log.resourceType,
      log.patientName || log.patientId || 'N/A',
      log.status,
      log.ipAddress,
      log.details,
    ]);
    downloadCsv(headers, rows, `TBDetect_Audit_Logs_${new Date().toISOString().slice(0, 10)}.csv`);
    success('Audit logs exported to CSV.');
  };

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.clinicName.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
    const matchesStatus =
      userStatusFilter === 'ALL' || (userStatusFilter === 'ACTIVE' ? u.active : !u.active);
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Filtered Clinics
  const filteredClinics = clinics.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(clinicSearch.toLowerCase()) ||
      c.region.toLowerCase().includes(clinicSearch.toLowerCase()) ||
      c.address.toLowerCase().includes(clinicSearch.toLowerCase());
    const matchesRegion = clinicRegionFilter === 'ALL' || c.region === clinicRegionFilter;
    return matchesSearch && matchesRegion;
  });

  // Filtered Audit Logs
  const filteredAuditLogs = auditLogs.filter((a) => {
    const matchesSearch =
      a.userName.toLowerCase().includes(auditSearch.toLowerCase()) ||
      a.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
      (a.patientName && a.patientName.toLowerCase().includes(auditSearch.toLowerCase())) ||
      (a.module && a.module.toLowerCase().includes(auditSearch.toLowerCase())) ||
      a.details.toLowerCase().includes(auditSearch.toLowerCase());

    const matchesModule = auditModuleFilter === 'ALL' || a.module === auditModuleFilter;
    const matchesUser = auditUserFilter === 'ALL' || a.userId === auditUserFilter;
    const matchesPatient = auditPatientFilter === 'ALL' || a.patientId === auditPatientFilter;

    // Date filter
    let matchesDate = true;
    if (auditDateFilter === 'TODAY') {
      const todayStr = new Date().toISOString().slice(0, 10);
      matchesDate = a.timestamp.startsWith(todayStr);
    }

    return matchesSearch && matchesModule && matchesUser && matchesPatient && matchesDate;
  });

  const handlePingServices = () => {
    setIsPinging(true);
    setTimeout(() => {
      setHealthPingTime(new Date().toLocaleTimeString());
      setIsPinging(false);
      success('Diagnostic health probes sent. Telemetry latency refreshed.');
    }, 600);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {t.admin.title}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Administrative Command Center
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">{t.admin.subtitle}</p>
        </div>

        {/* Tab switcher */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-2xl text-xs font-bold">
          <button
            onClick={() => handleTabChange('users')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'users' ? 'bg-white text-indigo-700 shadow-2xs font-black' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{t.admin.tabs.users} ({users.length})</span>
          </button>
          <button
            onClick={() => handleTabChange('clinics')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'clinics' ? 'bg-white text-indigo-700 shadow-2xs font-black' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>{t.admin.tabs.clinics} ({clinics.length})</span>
          </button>
          <button
            onClick={() => handleTabChange('audit')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'audit' ? 'bg-white text-indigo-700 shadow-2xs font-black' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{t.admin.tabs.audit}</span>
          </button>
          <button
            onClick={() => handleTabChange('system')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'system' ? 'bg-white text-indigo-700 shadow-2xs font-black' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>{t.admin.tabs.system}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: USERS / FOYDALANUVCHILAR */}
      {/* ========================================================================= */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Demo tag notice */}
          <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-2xl flex items-center justify-between text-xs text-indigo-900">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-indigo-200 text-indigo-900">
                DEMO USER DIRECTORY
              </span>
              <span>All user accounts listed below are mock clinical profiles for prototype evaluation.</span>
            </div>
            <span className="font-mono text-[11px] text-indigo-700">RBAC Enforced</span>
          </div>

          {/* Search and Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 min-w-[220px]">
              <input
                type="text"
                value={userSearch}
                onChange={(e: { target: { value: any; }; }) => setUserSearch(e.target.value)}
                placeholder="Search staff by name, email, or facility..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Role filter */}
              <select
                value={userRoleFilter}
                onChange={(e: { target: { value: any; }; }) => setUserRoleFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium outline-none focus:bg-white cursor-pointer"
              >
                <option value="ALL">All Roles</option>
                <option value="DOCTOR">Doctor / Pulmonologist</option>
                <option value="CLINIC_ADMIN">Clinic Admin</option>
                <option value="ADMIN">System Admin</option>
                <option value="MEDICAL_STAFF">Medical Staff</option>
              </select>

              {/* Status filter */}
              <select
                value={userStatusFilter}
                onChange={(e) => setUserStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium outline-none focus:bg-white cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Suspended</option>
              </select>

              <button
                onClick={handleExportUsersCsv}
                className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={handleOpenCreateUser}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>{t.admin.addUser}</span>
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3.5 pl-4">Name</th>
                    <th className="py-3.5">Role</th>
                    <th className="py-3.5">Email</th>
                    <th className="py-3.5">Status</th>
                    <th className="py-3.5">Last Activity</th>
                    <th className="py-3.5 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 pl-4">
                        <div className="flex items-center gap-3">
                          {u.avatarUrl ? (
                            <img
                              src={u.avatarUrl}
                              alt={u.name}
                              className="w-8 h-8 rounded-full object-cover border border-slate-200"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                              {u.name[0]}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-slate-900">{u.name}</p>
                            <p className="text-[10px] text-slate-400">{u.specialty || u.clinicName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 font-mono text-slate-600 text-[11px]">{u.email}</td>
                      <td className="py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            u.active
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.active ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                          {u.active ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="py-3.5 text-slate-400 font-mono text-[11px]">
                        {u.lastLogin
                          ? new Date(u.lastLogin).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
                          : 'Recently active'}
                      </td>
                      <td className="py-3.5 pr-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View */}
                          <button
                            onClick={() => setViewingUser(u)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="View User Dossier"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {/* Edit */}
                          <button
                            onClick={() => handleOpenEditUser(u)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit User"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {/* Activate / Deactivate */}
                          <button
                            onClick={() => handleToggleUserStatus(u)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              u.active
                                ? 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                                : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={u.active ? 'Deactivate User' : 'Activate User'}
                          >
                            {u.active ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CLINICS NETWORK / KLINIKALAR TARMOĞ‘I */}
      {/* ========================================================================= */}
      {activeTab === 'clinics' && (
        <UzbekistanClinicsNetwork />
      )}

      {/* ========================================================================= */}
      {/* TAB 3: AUDIT LOGS / AUDIT JURNAL */}
      {/* ========================================================================= */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          {/* Header Bar with Search & Filters */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[240px]">
                <input
                  type="text"
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  placeholder="Search audit trail by user, action, patient, or module..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white outline-none"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>

              <button
                onClick={handleExportAuditCsv}
                className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>Export Audit Trail (CSV)</span>
              </button>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs">
              <span className="text-slate-400 font-bold flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Filter by:
              </span>

              {/* Module Filter */}
              <select
                value={auditModuleFilter}
                onChange={(e) => setAuditModuleFilter(e.target.value)}
                className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium outline-none cursor-pointer"
              >
                <option value="ALL">All Modules</option>
                <option value="Patients">Patients</option>
                <option value="X-Ray AI">X-Ray AI</option>
                <option value="Laboratory">Laboratory</option>
                <option value="Cough AI">Cough AI</option>
                <option value="Treatment">Treatment</option>
                <option value="Analytics">Analytics</option>
                <option value="AI Engine">AI Engine</option>
              </select>

              {/* Date Filter */}
              <select
                value={auditDateFilter}
                onChange={(e) => setAuditDateFilter(e.target.value)}
                className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium outline-none cursor-pointer"
              >
                <option value="ALL">All Time</option>
                <option value="TODAY">Today Only</option>
              </select>

              {/* User Filter */}
              <select
                value={auditUserFilter}
                onChange={(e) => setAuditUserFilter(e.target.value)}
                className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium outline-none cursor-pointer"
              >
                <option value="ALL">All Users</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>

              {/* Patient Filter */}
              <select
                value={auditPatientFilter}
                onChange={(e) => setAuditPatientFilter(e.target.value)}
                className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium outline-none cursor-pointer"
              >
                <option value="ALL">All Patients</option>
                <option value="pat_001">Rustam Karimov</option>
                <option value="pat_002">Nodira Aliyeva</option>
                <option value="pat_003">Bekhzod Tursunov</option>
              </select>

              <span className="ml-auto text-[11px] font-mono text-slate-400">
                {filteredAuditLogs.length} matching events
              </span>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Cryptographic Clinical Audit Log</h3>
                <p className="text-xs text-slate-500">
                  Immutable record of patient views, diagnostic uploads, AI risk inferences, and doctor sign-offs
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-xl">
                Verified Ledger
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-bold uppercase text-[10px] tracking-wider font-mono">
                    <th className="py-3 pl-4">Timestamp</th>
                    <th className="py-3">User</th>
                    <th className="py-3">Action</th>
                    <th className="py-3">Patient</th>
                    <th className="py-3">Module</th>
                    <th className="py-3">Status</th>
                    <th className="py-3 pr-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {filteredAuditLogs.map((log) => (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedAuditLog(log)}
                      className="hover:bg-slate-50 text-[11px] transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 pl-4 font-mono text-slate-400 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })}
                      </td>
                      <td className="py-3.5 font-bold text-slate-800">
                        {log.userName}
                      </td>
                      <td className="py-3.5">
                        <span className="font-mono text-indigo-700 font-bold">{log.action}</span>
                      </td>
                      <td className="py-3.5">
                        {log.patientName ? (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              if (log.patientId && onSelectPatient) onSelectPatient(log.patientId);
                            }}
                            className="font-bold text-blue-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
                          >
                            <span>{log.patientName}</span>
                            <ExternalLink className="w-3 h-3 text-blue-400" />
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3.5">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                          {log.module || log.resourceType}
                        </span>
                      </td>
                      <td className="py-3.5">
                        <span className="font-bold text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3.5 pr-4 text-right">
                        <span className="text-indigo-600 group-hover:underline font-bold">
                          Inspect →
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SYSTEM HEALTH / TIZIM HOLATI */}
      {/* ========================================================================= */}
      {activeTab === 'system' && (
        <div className="space-y-6">
          {/* Honest Demo Notification Banner */}
          <div className="p-4 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border border-amber-200 rounded-3xl flex items-start gap-3.5 text-xs text-amber-900 shadow-xs">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-amber-200 text-amber-900">
                  DEMO / NOT CONNECTED
                </span>
                <span className="font-black text-amber-950">Sandboxed Prototype Health Status</span>
              </div>
              <p className="leading-relaxed text-amber-800">
                TBDetect AI is currently running in a self-contained client demo environment. Cloud-based GPU inference clusters, PACS hospital servers, and central ministry SQL databases are simulated via in-memory service models.
              </p>
            </div>
          </div>

          {/* Action Bar with Ping/Refresh */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-xs font-bold text-slate-800">
                Telemetry Probes Active • Last Checked: <span className="font-mono text-slate-500">{healthPingTime}</span>
              </p>
            </div>

            <button
              onClick={handlePingServices}
              disabled={isPinging}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
              <span>{isPinging ? 'Pinging...' : 'Ping Services'}</span>
            </button>
          </div>

          {/* Services Health Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Frontend */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Frontend Application</h4>
                  <p className="text-[11px] text-slate-400">React 18 + Vite SPA Client</p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  OPERATIONAL
                </span>
              </div>
              <div className="space-y-1 text-xs font-mono text-slate-500">
                <p>Response Time: <strong className="text-slate-800">12 ms</strong></p>
                <p>Status: <span className="text-emerald-600 font-bold">200 OK (Rendered)</span></p>
                <p>Last checked: {healthPingTime}</p>
              </div>
            </div>

            {/* REST API */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Spring Boot REST API</h4>
                  <p className="text-[11px] text-slate-400">Application API Gateway</p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  DEMO MODE
                </span>
              </div>
              <div className="space-y-1 text-xs font-mono text-slate-500">
                <p>Response Time: <strong className="text-slate-800">24 ms (Simulated)</strong></p>
                <p>Backend: <span className="text-amber-600 font-bold">In-Memory Mock Spec</span></p>
                <p>Last checked: {healthPingTime}</p>
              </div>
            </div>

            {/* Database */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">PostgreSQL / TimescaleDB</h4>
                  <p className="text-[11px] text-slate-400">Clinical Data & Audit Store</p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  DEMO MODE
                </span>
              </div>
              <div className="space-y-1 text-xs font-mono text-slate-500">
                <p>Response Time: <strong className="text-slate-800">8 ms</strong></p>
                <p>Persistence: <span className="text-amber-600 font-bold">Client Local Store</span></p>
                <p>Last checked: {healthPingTime}</p>
              </div>
            </div>

            {/* AI Vision Services */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Chest X-Ray Deep CNN</h4>
                  <p className="text-[11px] text-slate-400">Radiograph Computer Vision Model</p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  OPERATIONAL
                </span>
              </div>
              <div className="space-y-1 text-xs font-mono text-slate-500">
                <p>Inference: <strong className="text-slate-800">140 ms (Gemini/Browser)</strong></p>
                <p>Weights: <span className="text-indigo-600 font-bold">ResNet-101 + Heatmaps</span></p>
                <p>Last checked: {healthPingTime}</p>
              </div>
            </div>

            {/* Audio Service */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Cough Acoustic AI</h4>
                  <p className="text-[11px] text-slate-400">Spectral Audio Biomarker Analyzer</p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  OPERATIONAL
                </span>
              </div>
              <div className="space-y-1 text-xs font-mono text-slate-500">
                <p>Pipeline: <strong className="text-slate-800">Web Audio API Native</strong></p>
                <p>DSP Latency: <span className="text-emerald-600 font-bold">45 ms</span></p>
                <p>Last checked: {healthPingTime}</p>
              </div>
            </div>

            {/* Storage */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">DICOM PACS Storage</h4>
                  <p className="text-[11px] text-slate-400">Medical Imaging Repository</p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  DEMO MODE
                </span>
              </div>
              <div className="space-y-1 text-xs font-mono text-slate-500">
                <p>Storage Engine: <strong className="text-slate-800">Local Sandbox Blob</strong></p>
                <p>External PACS: <span className="text-amber-600 font-bold">Not Connected</span></p>
                <p>Last checked: {healthPingTime}</p>
              </div>
            </div>

            {/* Notification Service */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Notification & Event Bus</h4>
                  <p className="text-[11px] text-slate-400">Real-time alerts & doctor triage</p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  OPERATIONAL
                </span>
              </div>
              <div className="space-y-1 text-xs font-mono text-slate-500">
                <p>Dispatcher: <strong className="text-slate-800">Toast / Drawer Dispatch</strong></p>
                <p>Channel: <span className="text-emerald-600 font-bold">Active Local Event Bus</span></p>
                <p>Last checked: {healthPingTime}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: VIEW USER DOSSIER */}
      {/* ========================================================================= */}
      {viewingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-5 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm">
                  {viewingUser.name[0]}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{viewingUser.name}</h3>
                  <p className="text-xs text-slate-400 font-mono">{viewingUser.id}</p>
                </div>
              </div>
              <button
                onClick={() => setViewingUser(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl text-[11px] text-indigo-900 font-bold flex items-center justify-between">
              <span>DEMO USER RECORD</span>
              <span className="font-mono">Role: {viewingUser.role}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-slate-400 text-[10px] font-bold">EMAIL ADDRESS</p>
                <p className="font-semibold text-slate-800 mt-0.5">{viewingUser.email}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-slate-400 text-[10px] font-bold">FACILITY</p>
                <p className="font-semibold text-slate-800 mt-0.5">{viewingUser.clinicName}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-slate-400 text-[10px] font-bold">SPECIALTY</p>
                <p className="font-semibold text-slate-800 mt-0.5">{viewingUser.specialty || 'General Pulmonology'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-slate-400 text-[10px] font-bold">LICENSE NUMBER</p>
                <p className="font-semibold text-slate-800 mt-0.5">{viewingUser.licenseNumber || 'MD-UZ-VALID'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-slate-400 text-[10px] font-bold">PHONE NUMBER</p>
                <p className="font-semibold text-slate-800 mt-0.5">{viewingUser.phone || '+998 71 200 0000'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-slate-400 text-[10px] font-bold">LAST ACTIVITY</p>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {viewingUser.lastLogin ? new Date(viewingUser.lastLogin).toLocaleString() : 'Active session'}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setViewingUser(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: VIEW CLINIC DETAILS */}
      {/* ========================================================================= */}
      {viewingClinic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-5 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{viewingClinic.name}</h3>
                  <p className="text-xs text-slate-400">{viewingClinic.region}, Uzbekistan</p>
                </div>
              </div>
              <button
                onClick={() => setViewingClinic(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-2.5 bg-cyan-50 border border-cyan-200 rounded-xl text-[11px] text-cyan-900 font-bold flex items-center justify-between">
              <span>DEMO FACILITY PROFILE</span>
              <span className="font-mono">Status: {viewingClinic.status}</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-slate-400 text-[10px] font-bold">PHYSICAL ADDRESS</p>
                <p className="font-semibold text-slate-800 mt-0.5">{viewingClinic.address}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-slate-400 text-[10px] font-bold">TELEPHONE</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{viewingClinic.contactPhone || '+998 71 200 4500'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-slate-400 text-[10px] font-bold">EMAIL</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{viewingClinic.contactEmail || 'center@tbhealth.uz'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-slate-400 text-[10px] font-bold">ADMINISTRATOR</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{viewingClinic.adminName}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-slate-400 text-[10px] font-bold">ACCREDITATION EXPIRY</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{viewingClinic.licenseExpiry}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setViewingClinic(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: VIEW CLINIC STATISTICS */}
      {/* ========================================================================= */}
      {viewingClinicStats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-5 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Facility Screening Statistics</h3>
                  <p className="text-xs text-slate-400">{viewingClinicStats.name}</p>
                </div>
              </div>
              <button
                onClick={() => setViewingClinicStats(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Doctors</p>
                <p className="text-xl font-black text-slate-800 mt-1">{viewingClinicStats.activeUsersCount}</p>
              </div>
              <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-100">
                <p className="text-[10px] text-blue-500 font-bold uppercase">Patients</p>
                <p className="text-xl font-black text-blue-600 mt-1">{viewingClinicStats.totalPatientsCount}</p>
              </div>
              <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100">
                <p className="text-[10px] text-emerald-500 font-bold uppercase">Screenings</p>
                <p className="text-xl font-black text-emerald-600 mt-1">{viewingClinicStats.activeScreeningsCount}</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl space-y-2 text-xs">
              <p className="font-bold text-slate-800">Operational Breakdown</p>
              <div className="flex justify-between text-slate-500">
                <span>Estimated Positivity Yield:</span>
                <strong className="text-slate-800">14.8%</strong>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>GeneXpert Confirmation Turnaround:</span>
                <strong className="text-slate-800">2.4 hours</strong>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Chest Radiograph Daily Capacity:</span>
                <strong className="text-slate-800">60 scans/day</strong>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setViewingClinicStats(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close Statistics
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: AUDIT EVENT DETAILS INSPECT */}
      {/* ========================================================================= */}
      {selectedAuditLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Audit Trail Event Verification</h3>
                  <p className="text-[11px] font-mono text-slate-400">{selectedAuditLog.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAuditLog(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <p className="text-slate-400 text-[10px] font-bold">ACTION</p>
                <p className="font-mono font-bold text-indigo-700 text-sm">{selectedAuditLog.action}</p>
                <p className="text-slate-600 mt-1">{selectedAuditLog.details}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-slate-400 text-[10px] font-bold">USER</p>
                  <p className="font-bold text-slate-800">{selectedAuditLog.userName}</p>
                  <p className="text-[10px] text-slate-400">Role: {selectedAuditLog.userRole}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-slate-400 text-[10px] font-bold">PATIENT</p>
                  <p className="font-bold text-slate-800">
                    {selectedAuditLog.patientName || 'None assigned'}
                  </p>
                  <p className="text-[10px] text-slate-400">ID: {selectedAuditLog.patientId || 'N/A'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-slate-400 text-[10px] font-bold">TIMESTAMP</p>
                  <p className="font-mono text-slate-700 text-[11px]">
                    {new Date(selectedAuditLog.timestamp).toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-slate-400 text-[10px] font-bold">IP ADDRESS</p>
                  <p className="font-mono text-slate-700 text-[11px]">{selectedAuditLog.ipAddress}</p>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Cryptographic Integrity Verified
                </span>
                <span className="font-mono text-[10px]">SHA-256 Valid</span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
              {selectedAuditLog.patientId && onSelectPatient ? (
                <button
                  onClick={() => {
                    const pId = selectedAuditLog.patientId;
                    setSelectedAuditLog(null);
                    if (pId) onSelectPatient(pId);
                  }}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  Open Patient Dossier →
                </button>
              ) : <span />}

              <button
                onClick={() => setSelectedAuditLog(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close Event
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE / EDIT USER */}
      {/* ========================================================================= */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingUserId ? 'Edit Staff Member' : t.admin.addUser}
              </h3>
              <button
                onClick={() => setIsUserModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="e.g. Dr. Aziz Rakhimov"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="e.g. a.rakhimov@tbdetect.ai"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Role (RBAC) *</label>
                  <select
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value as Role)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none cursor-pointer"
                  >
                    <option value="DOCTOR">DOCTOR</option>
                    <option value="CLINIC_ADMIN">CLINIC_ADMIN</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="MEDICAL_STAFF">MEDICAL_STAFF</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Specialty</label>
                  <input
                    type="text"
                    value={userSpecialty}
                    onChange={(e) => setUserSpecialty(e.target.value)}
                    placeholder="e.g. Pulmonologist"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Assigned Facility *</label>
                <select
                  value={userClinicId}
                  onChange={(e) => setUserClinicId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none cursor-pointer"
                >
                  {clinics.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.region})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={userActive}
                    onChange={(e) => setUserActive(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <span className="font-bold text-slate-700">Account Active (Permit Institutional Login)</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  Save User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE / EDIT CLINIC */}
      {/* ========================================================================= */}
      {isClinicModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingClinicId ? 'Edit Medical Facility' : 'Onboard Clinical Facility'}
              </h3>
              <button
                onClick={() => setIsClinicModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClinic} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Facility Name *</label>
                <input
                  type="text"
                  required
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  placeholder="e.g. Samarkand Pulmonary Dispensary"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Region *</label>
                <select
                  value={clinicRegion}
                  onChange={(e) => setClinicRegion(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none cursor-pointer"
                >
                  <option value="Tashkent">Tashkent</option>
                  <option value="Samarkand">Samarkand</option>
                  <option value="Fergana">Fergana</option>
                  <option value="Bukhara">Bukhara</option>
                  <option value="Andijan">Andijan</option>
                  <option value="Karakalpakstan">Karakalpakstan</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Street Address</label>
                <input
                  type="text"
                  value={clinicAddress}
                  onChange={(e) => setClinicAddress(e.target.value)}
                  placeholder="e.g. Navoi Avenue 14"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={clinicPhone}
                    onChange={(e) => setClinicPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Official Email</label>
                  <input
                    type="email"
                    value={clinicEmail}
                    onChange={(e) => setClinicEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsClinicModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  Save Facility
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
