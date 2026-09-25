import React, { useState, useEffect } from 'react';
import {
  Search,
  Bell,
  Globe,
  ShieldCheck,
  ChevronDown,
  LogOut,
  User,
  Camera,
  Edit3,
  Building2,
  Sparkles,
  Menu,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Language, Role } from '../../types';
import { notificationService } from '../../services/api';
import { ProfileDetailModal } from '../profile/ProfileDetailModal';
import { EditProfileModal } from '../profile/EditProfileModal';
import { ChangeAvatarModal } from '../profile/ChangeAvatarModal';

interface HeaderProps {
  onOpenSearch?: () => void;
  onOpenCommandSearch?: () => void;
  onOpenNotifications?: () => void;
  onToggleSidebar?: () => void;
  onToggleMobileMenu?: () => void;
  onNavigate?: (view: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSearch,
  onOpenCommandSearch,
  onOpenNotifications,
  onToggleSidebar,
  onToggleMobileMenu,
  onNavigate,
}) => {
  const { user, role, switchDemoRole, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Modals state
  const [showProfileDetail, setShowProfileDetail] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangeAvatar, setShowChangeAvatar] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);

  useEffect(() => {
    notificationService.getNotifications().then((list) => {
      const count = list.filter((n) => !n.read).length;
      setUnreadCount(count);
    });
  }, []);

  const handleOpenSearch = () => {
    if (onOpenSearch) onOpenSearch();
    else if (onOpenCommandSearch) onOpenCommandSearch();
  };

  const handleToggleSidebar = () => {
    if (onToggleSidebar) onToggleSidebar();
    else if (onToggleMobileMenu) onToggleMobileMenu();
  };

  const handleNavigate = (view: string) => {
    if (onNavigate) onNavigate(view);
  };

  const rolesList: { role: Role; label: string; desc: string }[] = [
    { role: 'DOCTOR', label: t.roles.DOCTOR, desc: 'Review radiographs, sign clinical reviews, triage' },
    { role: 'CLINIC_ADMIN', label: t.roles.CLINIC_ADMIN, desc: 'Manage clinic staff, patient registry, exports' },
    { role: 'MEDICAL_STAFF', label: t.roles.MEDICAL_STAFF, desc: 'Patient intake, upload X-rays, record cough' },
    { role: 'PATIENT', label: t.roles.PATIENT, desc: 'View own screening history & DOTS progress' },
    { role: 'ADMIN', label: t.roles.ADMIN, desc: 'Full system health, clinic tenants & audit logs' },
  ];

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'en', label: 'English (US)', flag: '🇺🇸' },
    { code: 'ru', label: 'Русский (RU)', flag: '🇷🇺' },
    { code: 'uz', label: "O'zbekcha (UZ)", flag: '🇺🇿' },
  ];

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 md:px-6 backdrop-blur-md">
        {/* Left side: Mobile menu toggle + Global Search */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleSidebar}
            className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl"
            aria-label="Toggle mobile sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <button
            onClick={handleOpenSearch}
            className="flex items-center gap-3 px-3.5 py-1.5 bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200 rounded-xl text-slate-500 text-xs font-medium transition-all w-48 sm:w-72 lg:w-80 group shadow-2xs"
          >
            <Search className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
            <span className="truncate text-left flex-1">{t.common.search}</span>
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white border border-slate-200 rounded shadow-2xs">
              ⌘K
            </kbd>
          </button>

          {/* Demo environment badge */}
          <div className="hidden xl:flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{t.brand.demoEnvironment}</span>
          </div>
        </div>

        {/* Right side controls: Role switcher, Language, Notifications, User Menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Role Switcher Pill */}
          <div className="relative">
            <button
              onClick={() => {
                setShowRoleMenu(!showRoleMenu);
                setShowLangMenu(false);
                setShowUserMenu(false);
              }}
              className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50/80 hover:bg-indigo-100/80 border border-indigo-200 rounded-xl text-indigo-900 text-xs font-semibold transition-all shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden md:inline font-bold">Role:</span>
              <span className="truncate max-w-[120px]">{t.roles[role] || role}</span>
              <ChevronDown className="w-3.5 h-3.5 text-indigo-400" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-fade-in">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Switch Demo Persona (RBAC)
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Simulate different medical & administrative viewpoints:
                  </p>
                </div>
                <div className="space-y-1 mt-1">
                  {rolesList.map((r) => (
                    <button
                      key={r.role}
                      onClick={() => {
                        switchDemoRole(r.role);
                        setShowRoleMenu(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl text-xs transition-colors flex items-start justify-between ${
                        role === r.role
                          ? 'bg-indigo-50/90 text-indigo-900 font-bold border border-indigo-100'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <p className="font-semibold">{r.label}</p>
                        <p className="text-[11px] text-slate-400 font-normal leading-tight mt-0.5">
                          {r.desc}
                        </p>
                      </div>
                      {role === r.role && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600 mt-1" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Language Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowLangMenu(!showLangMenu);
                setShowRoleMenu(false);
                setShowUserMenu(false);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs font-semibold transition-colors shadow-2xs"
            >
              <Globe className="w-4 h-4 text-slate-500" />
              <span className="uppercase font-mono">{language}</span>
            </button>

            {showLangMenu && (
              <div className="absolute right-0 mt-2 w-44 bg-white rounded-2xl shadow-xl border border-slate-200 p-1.5 z-50 animate-fade-in">
                {languages.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setLanguage(l.code);
                      setShowLangMenu(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors ${
                      language === l.code
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{l.flag}</span>
                      <span>{l.label}</span>
                    </div>
                    {language === l.code && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications Icon Button with Dynamic Count */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-2xs transition-colors"
            title="Clinical Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white rounded-full text-[10px] font-black flex items-center justify-center ring-2 ring-white shadow-xs">
                {unreadCount}
              </span>
            )}
          </button>

          {/* User Profile Menu */}
          <div className="relative">
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowRoleMenu(false);
                setShowLangMenu(false);
              }}
              className="flex items-center gap-2 p-1 pl-1.5 hover:bg-slate-50 border border-slate-200/80 rounded-xl transition-all"
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 rounded-lg object-cover ring-1 ring-slate-200"
                />
              ) : (
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                  {user?.name?.[0] || 'U'}
                </div>
              )}
              <div className="hidden lg:block text-left pr-1">
                <p className="text-xs font-bold text-slate-900 truncate max-w-[130px] leading-tight">
                  {user?.name || 'Medical User'}
                </p>
                <p className="text-[10px] text-slate-400 truncate max-w-[130px] leading-tight">
                  {user?.clinicName || 'Central Pulmonology'}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-fade-in">
                <div className="p-3 border-b border-slate-100 flex items-start gap-3">
                  <img
                    src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                    alt={user?.name}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-200 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black text-slate-900 truncate">{user?.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                    <span className="text-[10px] font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md inline-block mt-1 font-bold">
                      {t.roles[role] || role}
                    </span>
                  </div>
                </div>

                <div className="space-y-0.5 py-1.5">
                  <button
                    onClick={() => {
                      setShowProfileDetail(true);
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2.5 font-medium"
                  >
                    <User className="w-4 h-4 text-blue-600" />
                    <span>View Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowEditProfile(true);
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2.5 font-medium"
                  >
                    <Edit3 className="w-4 h-4 text-indigo-600" />
                    <span>Edit Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowChangeAvatar(true);
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2.5 font-medium"
                  >
                    <Camera className="w-4 h-4 text-teal-600" />
                    <span>Change Photo</span>
                  </button>

                  <button
                    onClick={() => {
                      handleNavigate('settings');
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2.5 font-medium"
                  >
                    <Building2 className="w-4 h-4 text-slate-500" />
                    <span>{t.nav.settings}</span>
                  </button>

                  <button
                    onClick={() => {
                      handleNavigate('landing');
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2.5 font-medium"
                  >
                    <ShieldCheck className="w-4 h-4 text-slate-500" />
                    <span>{t.nav.landingPage}</span>
                  </button>
                </div>

                <div className="pt-1.5 border-t border-slate-100">
                  <button
                    onClick={() => {
                      logout();
                      handleNavigate('login');
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-2.5 font-semibold"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t.nav.logout}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Profile Modals */}
      <ProfileDetailModal
        isOpen={showProfileDetail}
        onClose={() => setShowProfileDetail(false)}
        onOpenEdit={() => setShowEditProfile(true)}
        onOpenChangeAvatar={() => setShowChangeAvatar(true)}
      />

      <EditProfileModal
        isOpen={showEditProfile}
        onClose={() => setShowEditProfile(false)}
      />

      <ChangeAvatarModal
        isOpen={showChangeAvatar}
        onClose={() => setShowChangeAvatar(false)}
      />
    </>
  );
};
