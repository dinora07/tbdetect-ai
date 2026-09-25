import React from 'react';
import {
  Home,
  LayoutDashboard,
  Users,
  ScanLine,
  Activity,
  Stethoscope,
  Mic,
  FileText,
  HeartPulse,
  Bot,
  BarChart3,
  Bell,
  Settings,
  ShieldAlert,
  Building,
  Server,
  PlusCircle,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  collapsed?: boolean;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  collapsed = false,
  mobileOpen = false,
  onCloseMobile,
}) => {
  const { role, isPatient, isDoctor, canManageUsers, isAdmin } = useAuth();
  const { t } = useLanguage();

  const handleNav = (viewId: string) => {
    onNavigate(viewId);
    if (onCloseMobile) onCloseMobile();
  };

  const mainNavItems = [
    {
      id: 'home',
      label: t.nav.home || "Asosiy sahifa",
      icon: Home,
      roles: ['ADMIN', 'CLINIC_ADMIN', 'DOCTOR', 'MEDICAL_STAFF', 'PATIENT'],
    },
    {
      id: 'dashboard',
      label: t.nav.overview,
      icon: LayoutDashboard,
      roles: ['ADMIN', 'CLINIC_ADMIN', 'DOCTOR', 'MEDICAL_STAFF', 'PATIENT'],
    },
    {
      id: 'patients',
      label: t.nav.patients,
      icon: Users,
      badge: '8',
      roles: ['ADMIN', 'CLINIC_ADMIN', 'DOCTOR', 'MEDICAL_STAFF'],
    },
    {
      id: 'xray',
      label: t.nav.xrayAnalysis,
      icon: ScanLine,
      badge: 'AI',
      badgeColor: 'bg-indigo-500 text-white',
      roles: ['ADMIN', 'CLINIC_ADMIN', 'DOCTOR', 'MEDICAL_STAFF'],
    },
    {
      id: 'symptoms',
      label: t.nav.symptoms,
      icon: Stethoscope,
      roles: ['ADMIN', 'CLINIC_ADMIN', 'DOCTOR', 'MEDICAL_STAFF', 'PATIENT'],
    },
    {
      id: 'cough',
      label: t.nav.coughAi,
      icon: Mic,
      badge: 'AI',
      badgeColor: 'bg-teal-500 text-white',
      roles: ['ADMIN', 'CLINIC_ADMIN', 'DOCTOR', 'MEDICAL_STAFF', 'PATIENT'],
    },
    {
      id: 'labs',
      label: t.nav.laboratory,
      icon: FileText,
      roles: ['ADMIN', 'CLINIC_ADMIN', 'DOCTOR', 'MEDICAL_STAFF'],
    },
    {
      id: 'treatment',
      label: t.nav.treatment,
      icon: HeartPulse,
      roles: ['ADMIN', 'CLINIC_ADMIN', 'DOCTOR', 'MEDICAL_STAFF', 'PATIENT'],
    },
    {
      id: 'ai-assistant',
      label: t.nav.aiAssistant,
      icon: Bot,
      badge: 'GPT',
      badgeColor: 'bg-violet-500 text-white',
      roles: ['ADMIN', 'CLINIC_ADMIN', 'DOCTOR', 'MEDICAL_STAFF'],
    },
    {
      id: 'analytics',
      label: t.nav.analytics,
      icon: BarChart3,
      roles: ['ADMIN', 'CLINIC_ADMIN', 'DOCTOR'],
    },
  ];

  const adminNavItems = [
    {
      id: 'admin-users',
      label: t.nav.users,
      icon: Users,
      roles: ['ADMIN', 'CLINIC_ADMIN'],
    },
    {
      id: 'admin-clinics',
      label: t.nav.clinics,
      icon: Building,
      roles: ['ADMIN', 'CLINIC_ADMIN', 'DOCTOR'],
    },
    {
      id: 'admin-audit',
      label: t.nav.auditLog,
      icon: ShieldAlert,
      roles: ['ADMIN', 'CLINIC_ADMIN', 'DOCTOR'],
    },
    {
      id: 'admin-system',
      label: t.nav.system,
      icon: Server,
      roles: ['ADMIN'],
    },
  ];

  const allowedMainItems = mainNavItems.filter((item) => item.roles.includes(role));
  const allowedAdminItems = adminNavItems.filter((item) => item.roles.includes(role));

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 md:relative md:z-0 flex flex-col border-r border-slate-200/80 bg-white transition-all duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${collapsed ? 'w-20' : 'w-64'} shrink-0`}
      >
        {/* Brand Header */}
        <div
          onClick={() => handleNav('home')}
          className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50/80 transition-colors border-b border-slate-100"
        >
          <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-cyan-600 to-indigo-600 text-white shadow-md shadow-cyan-500/20">
            <Activity className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="text-base font-extrabold text-slate-900 tracking-tight leading-none flex items-center gap-1.5">
                <span>TBDetect</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 text-sm font-black">
                  AI
                </span>
              </h1>
              <p className="text-[10px] text-slate-400 font-medium truncate mt-1">
                {t.brand.tagline}
              </p>
            </div>
          )}
        </div>

        {/* Quick Action Button */}
        {!collapsed && !isPatient && (
          <div className="p-3 border-b border-slate-100">
            <button
              onClick={() => handleNav('xray')}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 active:from-blue-800 active:to-cyan-800 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all group"
            >
              <PlusCircle className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
              <span>{t.nav.newScreening}</span>
            </button>
          </div>
        )}

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-6">
          {/* Core Clinical Modules */}
          <div className="space-y-1">
            {!collapsed && (
              <p className="px-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Clinical Workspace
              </p>
            )}
            {allowedMainItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border border-blue-100/80 shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive
                          ? 'text-blue-600'
                          : 'text-slate-400 group-hover:text-slate-700'
                      }`}
                    />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </div>

                  {!collapsed && item.badge && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                        item.badgeColor || 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Administration Section */}
          {allowedAdminItems.length > 0 && (
            <div className="space-y-1 pt-2 border-t border-slate-100">
              {!collapsed && (
                <p className="px-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {t.nav.admin}
                </p>
              )}
              {allowedAdminItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNav(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-100/80 shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                    }`}
                    title={collapsed ? item.label : undefined}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive
                            ? 'text-indigo-600'
                            : 'text-slate-400 group-hover:text-slate-700'
                        }`}
                      />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Navigation: Settings & Landing */}
        <div className="p-3 border-t border-slate-100 space-y-1 bg-slate-50/50">
          <button
            onClick={() => handleNav('settings')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              currentView === 'settings'
                ? 'bg-blue-50 text-blue-700 font-bold'
                : 'text-slate-600 hover:bg-white hover:text-slate-900'
            }`}
            title="Settings"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            {!collapsed && <span>{t.nav.settings}</span>}
          </button>

          <button
            onClick={() => handleNav('landing')}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-500 hover:bg-white hover:text-slate-800 transition-colors"
            title="Landing Page"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-cyan-600" />
              {!collapsed && <span>{t.nav.landingPage}</span>}
            </div>
            {!collapsed && <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
          </button>
        </div>
      </aside>
    </>
  );
};
