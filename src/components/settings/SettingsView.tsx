import React, { useState, useEffect } from 'react';
import {
  Globe,
  Sliders,
  Bell,
  Shield,
  Building,
  CheckCircle2,
  Lock,
  User as UserIcon,
  Camera,
  Moon,
  Sun,
  Laptop,
  Volume2,
  VolumeX,
  Smartphone,
  Mail,
  KeyRound,
  Sparkles,
  Eye,
  EyeOff,
  Save,
  Clock,
  AlertCircle,
  Trash2,
  MapPin,
  BadgeCheck,
  FileText,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Language, User } from '../../types';
import { UZBEKISTAN_REGIONS } from '../../services/uzbekistanClinicsData';

export const SettingsView: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const { user, updateUser, updateAvatar } = useAuth();
  const { success, error, info } = useToast();

  // Active Settings Tab
  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'language' | 'notifications' | 'security' | 'ai'>('profile');

  // Profile Form State
  const [firstName, setFirstName] = useState(
    user?.firstName || (user?.name?.includes(' ') ? user.name.split(' ')[1] : 'Dinora')
  );
  const [lastName, setLastName] = useState(
    user?.lastName || (user?.name?.includes(' ') ? user.name.split(' ')[0] : 'Sharipova')
  );
  const [email, setEmail] = useState(user?.email || '2007sharipova@gmail.com');
  const [phone, setPhone] = useState(user?.phone || '+998 90 987 6543');
  const [telegram, setTelegram] = useState(user?.telegram || '@javaa_backend');
  const [specialty, setSpecialty] = useState(user?.specialty || 'Lead Pulmonology Specialist');
  const [position, setPosition] = useState(
    user?.position || 'Bosh ftiziatr-pulmonolog / Lead Pulmonologist'
  );
  const [department, setDepartment] = useState(
    user?.department || "Ftiziatriya va Pulmonologiya Bo'limi"
  );
  const [clinicName, setClinicName] = useState(
    user?.clinicName || 'Respublika Ixtisoslashtirilgan Ftiziatriya va Pulmonologiya Markazi (RIFP IATM)'
  );
  const [region, setRegion] = useState(user?.region || 'Toshkent shahri');
  const [licenseNumber, setLicenseNumber] = useState(user?.licenseNumber || 'MD-UZ-77201');
  const [bio, setBio] = useState(
    user?.bio ||
      "O'zbekistonda sil kasalligini erta aniqlash va sun'iy intellekt asosida multimodal diagnostika bo'yicha mas'ul mutaxassis."
  );
  const [avatarUrl, setAvatarUrl] = useState(
    user?.avatarUrl || 'https://images.unsplash.com/photo-1594824813593-c418c322b270?auto=format&fit=crop&w=256&q=80'
  );
  const [customAvatarInput, setCustomAvatarInput] = useState('');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  // Sync state when user object changes
  useEffect(() => {
    if (user) {
      if (user.firstName) setFirstName(user.firstName);
      if (user.lastName) setLastName(user.lastName);
      if (user.email) setEmail(user.email);
      if (user.phone) setPhone(user.phone);
      if (user.telegram) setTelegram(user.telegram);
      if (user.specialty) setSpecialty(user.specialty);
      if (user.position) setPosition(user.position);
      if (user.department) setDepartment(user.department);
      if (user.clinicName) setClinicName(user.clinicName);
      if (user.region) setRegion(user.region);
      if (user.licenseNumber) setLicenseNumber(user.licenseNumber);
      if (user.bio) setBio(user.bio);
      if (user.avatarUrl) setAvatarUrl(user.avatarUrl);
    }
  }, [user]);

  // Appearance State
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>(() => {
    return (localStorage.getItem('tbdetect_theme') as 'light' | 'dark' | 'system') || 'light';
  });

  // Notifications State
  const [emailAlerts, setEmailAlerts] = useState(() => {
    return localStorage.getItem('tbdetect_pref_email') !== 'false';
  });
  const [smsAlerts, setSmsAlerts] = useState(() => {
    return localStorage.getItem('tbdetect_pref_sms') !== 'false';
  });
  const [criticalPush, setCriticalPush] = useState(() => {
    return localStorage.getItem('tbdetect_pref_push') !== 'false';
  });
  const [soundEffects, setSoundEffects] = useState(() => {
    return localStorage.getItem('tbdetect_pref_sound') !== 'false';
  });

  // Security State
  const [twoFactorAuth, setTwoFactorAuth] = useState(() => {
    return localStorage.getItem('tbdetect_pref_2fa') === 'true';
  });
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState<number>(() => {
    return parseInt(localStorage.getItem('tbdetect_pref_timeout') || '30', 10);
  });
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // AI & Demo Settings
  const [sensitivity, setSensitivity] = useState<number>(() => {
    return parseInt(localStorage.getItem('tbdetect_ai_sensitivity') || '85', 10);
  });
  const [specificity, setSpecificity] = useState<number>(() => {
    return parseInt(localStorage.getItem('tbdetect_ai_specificity') || '90', 10);
  });
  const [autoFlagThreshold, setAutoFlagThreshold] = useState<number>(() => {
    return parseInt(localStorage.getItem('tbdetect_ai_autoflag') || '75', 10);
  });
  const [showDemoBadges, setShowDemoBadges] = useState(() => {
    return localStorage.getItem('tbdetect_show_demo_badges') !== 'false';
  });

  // Avatar presets
  const avatarPresets = [
    'https://images.unsplash.com/photo-1594824813593-c418c322b270?auto=format&fit=crop&w=256&q=80',
    'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=256&q=80',
    'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=256&q=80',
    'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=256&q=80',
    'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=256&q=80',
  ];

  // Save Profile Handler
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      error(
        t.profile?.requiredFields ||
          (language === 'uz'
            ? 'Ism, familiya va elektron pochta kiritilishi shart.'
            : 'Please enter your first name, last name, and email address.')
      );
      return;
    }
    const computedFullName = `${lastName} ${firstName}`;
    updateUser({
      name: computedFullName,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      telegram: telegram.trim(),
      specialty: specialty.trim(),
      position: position.trim(),
      department: department.trim(),
      clinicName: clinicName.trim(),
      region: region,
      licenseNumber: licenseNumber.trim(),
      bio: bio.trim(),
      avatarUrl,
    });
    success(
      t.profile?.changesSavedSuccess ||
        (language === 'uz'
          ? "✓ Profil ma'lumotlari muvaffaqiyatli saqlandi"
          : '✓ Changes saved successfully')
    );
  };

  const handleRemovePhoto = () => {
    setAvatarUrl('');
    updateAvatar('');
    info(
      t.profile?.photoRemovedSuccess ||
        (language === 'uz'
          ? "Profil rasmi olib tashlandi. Bosh harflar ko'rsatiladi."
          : 'Profile photo removed. Showing default initials.')
    );
  };

  // Save Appearance Handler
  const handleSaveTheme = (mode: 'light' | 'dark' | 'system') => {
    setThemeMode(mode);
    localStorage.setItem('tbdetect_theme', mode);
    info(`Appearance mode set to ${mode.toUpperCase()}.`);
  };

  // Save Language Handler
  const handleSaveLanguage = (lang: Language) => {
    setLanguage(lang);
    success(`Language updated to ${lang.toUpperCase()}.`);
  };

  // Save Notifications
  const handleToggleNotification = (key: 'email' | 'sms' | 'push' | 'sound', currentVal: boolean) => {
    const nextVal = !currentVal;
    if (key === 'email') {
      setEmailAlerts(nextVal);
      localStorage.setItem('tbdetect_pref_email', String(nextVal));
    } else if (key === 'sms') {
      setSmsAlerts(nextVal);
      localStorage.setItem('tbdetect_pref_sms', String(nextVal));
    } else if (key === 'push') {
      setCriticalPush(nextVal);
      localStorage.setItem('tbdetect_pref_push', String(nextVal));
    } else if (key === 'sound') {
      setSoundEffects(nextVal);
      localStorage.setItem('tbdetect_pref_sound', String(nextVal));
    }
    info('Notification preferences updated.');
  };

  // Save Security Settings
  const handleToggle2FA = () => {
    const next = !twoFactorAuth;
    setTwoFactorAuth(next);
    localStorage.setItem('tbdetect_pref_2fa', String(next));
    if (next) {
      success('Two-factor authentication (2FA via TOTP/SMS) enabled.');
    } else {
      info('Two-factor authentication disabled.');
    }
  };

  const handleChangeTimeout = (minutes: number) => {
    setSessionTimeoutMinutes(minutes);
    localStorage.setItem('tbdetect_pref_timeout', String(minutes));
    info(`Session inactivity timeout set to ${minutes} minutes.`);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      error('Please enter your current password.');
      return;
    }
    if (newPassword.length < 6) {
      error('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      error('New password and confirmation do not match.');
      return;
    }

    setIsPasswordModalOpen(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    success('Password changed successfully.');
  };

  // Save AI Settings
  const handleSaveAiSettings = () => {
    localStorage.setItem('tbdetect_ai_sensitivity', String(sensitivity));
    localStorage.setItem('tbdetect_ai_specificity', String(specificity));
    localStorage.setItem('tbdetect_ai_autoflag', String(autoFlagThreshold));
    localStorage.setItem('tbdetect_show_demo_badges', String(showDemoBadges));
    success('AI inference thresholds & sandbox badge visibility saved.');
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {t.settings.title}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
              Settings & Preferences
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">{t.settings.subtitle}</p>
        </div>

        {/* Tab switcher */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-2xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'profile' ? 'bg-white text-blue-700 shadow-2xs font-black' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.settings.tabs.profile || 'Profile'}
          </button>
          <button
            onClick={() => setActiveTab('appearance')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'appearance' ? 'bg-white text-blue-700 shadow-2xs font-black' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.settings.tabs.appearance || 'Appearance'}
          </button>
          <button
            onClick={() => setActiveTab('language')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'language' ? 'bg-white text-blue-700 shadow-2xs font-black' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.settings.tabs.language || 'Language'}
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'notifications' ? 'bg-white text-blue-700 shadow-2xs font-black' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.settings.tabs.notifications || 'Notifications'}
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'security' ? 'bg-white text-blue-700 shadow-2xs font-black' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.settings.tabs.security || 'Security'}
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'ai' ? 'bg-white text-blue-700 shadow-2xs font-black' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            AI & Demo
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PROFILE SETTINGS */}
      {/* ========================================================================= */}
      {activeTab === 'profile' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-100 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  {t.profile?.title || 'Foydalanuvchi profili'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <BadgeCheck className="w-3 h-3" />
                  <span>Tasdiqlangan shifokor</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {t.profile?.subtitle ||
                  "Shaxsiy ma'lumotlar, ftiziatrik ixtisoslik, klinik lavozim va hududiy muassasa bog'lanishi"}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-xl text-xs font-mono font-bold">
                {t.profile?.idLabel || 'ID'}: {user?.id || 'usr_doc_0'}
              </span>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-5 bg-gradient-to-r from-slate-50 via-blue-50/30 to-indigo-50/20 rounded-2xl border border-slate-200/80">
              <div className="relative shrink-0">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={`${lastName} ${firstName}`}
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-white shadow-md"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xl flex items-center justify-center border-2 border-white shadow-md">
                    {lastName[0] || 'S'}
                    {firstName[0] || 'D'}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                  className="absolute -bottom-1 -right-1 p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md cursor-pointer transition-colors"
                  title={t.profile?.changePhoto || 'Rasmni o‘zgartirish'}
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-base font-bold text-slate-900 truncate">
                    {lastName} {firstName}
                  </p>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-100/80 text-blue-800 font-bold uppercase tracking-wider shrink-0">
                    {user?.role || 'DOCTOR'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-blue-700">{position}</span>
                  <span className="text-slate-300">•</span>
                  <span>{clinicName}</span>
                </p>

                <div className="flex items-center gap-3 pt-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                    className="font-bold text-blue-600 hover:text-blue-700 underline cursor-pointer"
                  >
                    {showAvatarPicker
                      ? language === 'uz'
                        ? 'Tanlovni yopish'
                        : 'Close picker'
                      : t.profile?.changePhoto || 'Rasmni tanlash'}
                  </button>

                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="font-medium text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t.profile?.removePhoto || 'Rasmni olib tashlash'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Avatar Presets & Custom URL Picker */}
            {showAvatarPicker && (
              <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-4">
                <p className="text-xs font-bold text-slate-700">
                  {language === 'uz'
                    ? "Tayyor shifokor suratlaridan birini tanlang:"
                    : "Select a medical professional avatar:"}
                </p>
                <div className="flex flex-wrap gap-3">
                  {avatarPresets.map((preset, idx) => (
                    <img
                      key={idx}
                      src={preset}
                      alt="Preset avatar"
                      onClick={() => {
                        setAvatarUrl(preset);
                        updateAvatar(preset);
                      }}
                      className={`w-14 h-14 rounded-2xl object-cover border-2 cursor-pointer transition-all ${
                        avatarUrl === preset
                          ? 'border-blue-600 ring-4 ring-blue-200 scale-105 shadow-md'
                          : 'border-white hover:opacity-80'
                      }`}
                      referrerPolicy="no-referrer"
                    />
                  ))}
                </div>

                <div className="pt-2 flex items-center gap-2 text-xs">
                  <input
                    type="url"
                    value={customAvatarInput}
                    onChange={(e) => setCustomAvatarInput(e.target.value)}
                    placeholder={
                      language === 'uz'
                        ? "Yoki rasm URL manzilini kiriting (https://...)"
                        : "Or enter custom photo URL (https://...)"
                    }
                    className="flex-1 px-3.5 py-2 bg-white border border-slate-200 rounded-xl outline-none text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customAvatarInput) {
                        setAvatarUrl(customAvatarInput);
                        updateAvatar(customAvatarInput);
                        setCustomAvatarInput('');
                        success(
                          language === 'uz'
                            ? 'Maxsus profil rasmi qo‘yildi.'
                            : 'Custom avatar applied.'
                        );
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer transition-colors"
                  >
                    {language === 'uz' ? 'Qo‘llash' : 'Apply URL'}
                  </button>
                </div>
              </div>
            )}

            {/* Profile Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              {/* Last Name */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {t.profile?.lastName || 'Familiya'} *
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-blue-500 outline-none transition-colors"
                />
              </div>

              {/* First Name */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {t.profile?.firstName || 'Ism'} *
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-blue-500 outline-none transition-colors"
                />
              </div>

              {/* Email Address */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {t.profile?.email || 'Elektron pochta'} *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-blue-500 outline-none transition-colors"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {t.profile?.phone || 'Telefon raqam'}
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+998 90 987 6543"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-blue-500 outline-none transition-colors font-mono"
                />
              </div>

              {/* Telegram Username */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {t.profile?.telegram || 'Telegram profil'}
                </label>
                <input
                  type="text"
                  value={telegram}
                  onChange={(e) => setTelegram(e.target.value)}
                  placeholder="@username"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-blue-500 outline-none transition-colors"
                />
              </div>

              {/* Medical License Number */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {t.profile?.licenseNumber || 'Shifokor litsenziya raqami'}
                </label>
                <input
                  type="text"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="MD-UZ-77201"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-blue-500 outline-none transition-colors font-mono"
                />
              </div>

              {/* Clinical Role / Position */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {t.profile?.position || 'Klinik lavozim'}
                </label>
                <input
                  type="text"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-blue-500 outline-none transition-colors"
                />
              </div>

              {/* Department */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {t.profile?.department || "Bo'lim"}
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-blue-500 outline-none transition-colors"
                />
              </div>

              {/* Clinical Specialty */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {t.profile?.specialty || 'Ixtisosligi'}
                </label>
                <input
                  type="text"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-blue-500 outline-none transition-colors"
                />
              </div>

              {/* Region (14 Regions of Uzbekistan) */}
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="block font-bold text-slate-700 mb-1">
                  {t.profile?.region || "O'zbekiston ma'muriy hududi"}
                </label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-blue-500 outline-none transition-colors cursor-pointer"
                >
                  {UZBEKISTAN_REGIONS.map((r) => (
                    <option key={r.key} value={r.nameUz}>
                      {language === 'ru' ? r.nameRu : language === 'en' ? r.nameEn : r.nameUz}
                    </option>
                  ))}
                </select>
              </div>

              {/* Hospital / Clinic Affiliation */}
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">
                  {t.profile?.clinic || 'Tibbiyot muassasasi (Klinika / Markaz)'}
                </label>
                <input
                  type="text"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-blue-500 outline-none transition-colors"
                />
              </div>

              {/* Professional Bio */}
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block font-bold text-slate-700 mb-1">
                  {t.profile?.bio || 'Kasbiy biografiya / Klinika tavsifi'}
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-blue-500 outline-none transition-colors resize-none"
                />
              </div>
            </div>

            {/* Sandbox Notice Banner */}
            <div className="p-3.5 bg-cyan-50/70 border border-cyan-200/80 rounded-2xl flex items-center justify-between text-xs text-cyan-900">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-cyan-200 text-cyan-900 shrink-0">
                  DEMO PROFILE PERSISTENCE
                </span>
                <span className="text-[11px] leading-relaxed">
                  {t.profile?.demoSandboxNotice ||
                    "Profil o'zgarishlari mahalliy doimiy xotirada saqlanadi va butun tizim bo'ylab aks etadi."}
                </span>
              </div>
              <span className="font-mono text-[10px] text-cyan-700 shrink-0">Local State</span>
            </div>

            {/* Submit Action */}
            <div className="flex items-center justify-end pt-4 border-t border-slate-100 gap-3">
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-500/20 cursor-pointer transition-all"
              >
                <Save className="w-4 h-4" />
                <span>{t.profile?.saveChanges || "O'zgarishlarni saqlash"}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: APPEARANCE (Light / Dark / System) */}
      {/* ========================================================================= */}
      {activeTab === 'appearance' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Appearance & Theme</h2>
            <p className="text-xs text-slate-500">Configure visual themes and display preferences for clinical workstations</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Light Mode */}
            <div
              onClick={() => handleSaveTheme('light')}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer space-y-3 ${
                themeMode === 'light'
                  ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Light Mode</p>
                <p className="text-xs text-slate-500 mt-0.5">High-contrast daytime clinical reading layout</p>
              </div>
              {themeMode === 'light' && (
                <span className="inline-block text-[11px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                  Active
                </span>
              )}
            </div>

            {/* Dark Mode */}
            <div
              onClick={() => handleSaveTheme('dark')}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer space-y-3 ${
                themeMode === 'dark'
                  ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                <Moon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Dark Mode</p>
                <p className="text-xs text-slate-500 mt-0.5">Dimmed radiance for radiology viewing rooms</p>
              </div>
              {themeMode === 'dark' && (
                <span className="inline-block text-[11px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                  Active
                </span>
              )}
            </div>

            {/* System */}
            <div
              onClick={() => handleSaveTheme('system')}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer space-y-3 ${
                themeMode === 'system'
                  ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <Laptop className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">System Match</p>
                <p className="text-xs text-slate-500 mt-0.5">Follow operating system day/night rhythm</p>
              </div>
              {themeMode === 'system' && (
                <span className="inline-block text-[11px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                  Active
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: LANGUAGE (UZ / RU / EN) */}
      {/* ========================================================================= */}
      {activeTab === 'language' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Language & Regional Localization</h2>
            <p className="text-xs text-slate-500">Choose your preferred clinical terminology and UI language</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Uzbek */}
            <div
              onClick={() => handleSaveLanguage('uz')}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer space-y-2 ${
                language === 'uz'
                  ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">🇺🇿</span>
                {language === 'uz' && (
                  <span className="text-[11px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                    Faol
                  </span>
                )}
              </div>
              <p className="text-sm font-bold text-slate-900">O‘zbekcha</p>
              <p className="text-xs text-slate-500">Milliy klinik standartlar va atamalar</p>
            </div>

            {/* Russian */}
            <div
              onClick={() => handleSaveLanguage('ru')}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer space-y-2 ${
                language === 'ru'
                  ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">🇷🇺</span>
                {language === 'ru' && (
                  <span className="text-[11px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                    Активен
                  </span>
                )}
              </div>
              <p className="text-sm font-bold text-slate-900">Русский</p>
              <p className="text-xs text-slate-500">Клиническая терминология и протоколы</p>
            </div>

            {/* English */}
            <div
              onClick={() => handleSaveLanguage('en')}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer space-y-2 ${
                language === 'en'
                  ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">🇬🇧</span>
                {language === 'en' && (
                  <span className="text-[11px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                    Active
                  </span>
                )}
              </div>
              <p className="text-sm font-bold text-slate-900">English</p>
              <p className="text-xs text-slate-500">International WHO TB Guidelines & Terminology</p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: NOTIFICATIONS */}
      {/* ========================================================================= */}
      {activeTab === 'notifications' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Notification & Alert Channels</h2>
            <p className="text-xs text-slate-500">Configure how urgent case notifications and system alerts are delivered</p>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {/* Email */}
            <div className="py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-800">Email Notifications</p>
                  <p className="text-slate-500">Send daily triage summaries and sign-off reminders to {email}</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={() => handleToggleNotification('email', emailAlerts)}
                className="w-5 h-5 text-blue-600 rounded cursor-pointer"
              />
            </div>

            {/* SMS */}
            <div className="py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-800">SMS Alerts</p>
                  <p className="text-slate-500">Send instant text alerts for critical/MDR-TB positive microbiological results</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={smsAlerts}
                onChange={() => handleToggleNotification('sms', smsAlerts)}
                className="w-5 h-5 text-blue-600 rounded cursor-pointer"
              />
            </div>

            {/* Critical Push */}
            <div className="py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-800">Critical In-App Push Alerts</p>
                  <p className="text-slate-500">Show high-priority red popups when patient risk score exceeds 85%</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={criticalPush}
                onChange={() => handleToggleNotification('push', criticalPush)}
                className="w-5 h-5 text-blue-600 rounded cursor-pointer"
              />
            </div>

            {/* Sound Effects */}
            <div className="py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  {soundEffects ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </div>
                <div>
                  <p className="font-bold text-slate-800">Acoustic Audio Chimes</p>
                  <p className="text-slate-500">Play subtle auditory cues on scan completion and cough analysis</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={soundEffects}
                onChange={() => handleToggleNotification('sound', soundEffects)}
                className="w-5 h-5 text-blue-600 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: SECURITY (Password, 2FA, Session Timeout) */}
      {/* ========================================================================= */}
      {activeTab === 'security' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Security & Authentication</h2>
            <p className="text-xs text-slate-500">Institutional cryptographic security, password policies, and session protection</p>
          </div>

          <div className="space-y-4 text-xs">
            {/* Password section */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-800">Password</p>
                  <p className="text-slate-500">Last changed 42 days ago • Institutional policy mandates 90-day cycle</p>
                </div>
              </div>
              <button
                onClick={() => setIsPasswordModalOpen(true)}
                className="px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl font-bold transition-colors cursor-pointer"
              >
                Change Password
              </button>
            </div>

            {/* 2FA section */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-800">Two-Factor Authentication (2FA)</p>
                  <p className="text-slate-500">Require an authenticator code (TOTP) or SMS token on new workstation login</p>
                </div>
              </div>
              <button
                onClick={handleToggle2FA}
                className={`px-3.5 py-2 rounded-xl font-bold transition-colors cursor-pointer ${
                  twoFactorAuth
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                {twoFactorAuth ? '2FA Enabled' : 'Enable 2FA'}
              </button>
            </div>

            {/* Session Timeout */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-800">Session Inactivity Lock</p>
                  <p className="text-slate-500">Automatically lock workstation when left unattended</p>
                </div>
              </div>
              <select
                value={sessionTimeoutMinutes}
                onChange={(e) => handleChangeTimeout(parseInt(e.target.value, 10))}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 outline-none cursor-pointer"
              >
                <option value={15}>15 Minutes</option>
                <option value={30}>30 Minutes</option>
                <option value={60}>60 Minutes</option>
                <option value={240}>4 Hours</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: AI / DEMO SETTINGS */}
      {/* ========================================================================= */}
      {activeTab === 'ai' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">AI Inference Engine & Demo Controls</h2>
            <p className="text-xs text-slate-500">Adjust computer vision sensitivity, specificity bias, and prototype UI indicators</p>
          </div>

          <div className="space-y-5 text-xs">
            {/* Sensitivity */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <div className="flex justify-between items-center">
                <label className="font-bold text-slate-800">
                  Screening AI Sensitivity (Recall Bias): <span className="text-blue-600 font-mono">{sensitivity}%</span>
                </label>
                <span className="text-[10px] text-slate-400">Default: 85%</span>
              </div>
              <p className="text-slate-500 text-[11px]">
                Higher sensitivity reduces false negatives, ensuring subtle pulmonary infiltrates and apical lesions are flagged.
              </p>
              <input
                type="range"
                min="50"
                max="99"
                value={sensitivity}
                onChange={(e) => setSensitivity(parseInt(e.target.value, 10))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            {/* Specificity */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <div className="flex justify-between items-center">
                <label className="font-bold text-slate-800">
                  Model Specificity: <span className="text-indigo-600 font-mono">{specificity}%</span>
                </label>
                <span className="text-[10px] text-slate-400">Default: 90%</span>
              </div>
              <p className="text-slate-500 text-[11px]">
                Controls discrimination against non-TB pulmonary opacities, bacterial pneumonia, and benign granulomas.
              </p>
              <input
                type="range"
                min="50"
                max="99"
                value={specificity}
                onChange={(e) => setSpecificity(parseInt(e.target.value, 10))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>

            {/* Auto-flag threshold */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <div className="flex justify-between items-center">
                <label className="font-bold text-slate-800">
                  High-Risk Triage Auto-Flag Threshold: <span className="text-rose-600 font-mono">{autoFlagThreshold}%</span>
                </label>
                <span className="text-[10px] text-slate-400">Default: 75%</span>
              </div>
              <p className="text-slate-500 text-[11px]">
                Combined multimodal risk scores above this cutoff trigger urgent doctor sign-off queue alerts.
              </p>
              <input
                type="range"
                min="50"
                max="95"
                value={autoFlagThreshold}
                onChange={(e) => setAutoFlagThreshold(parseInt(e.target.value, 10))}
                className="w-full accent-rose-600 cursor-pointer"
              />
            </div>

            {/* Show Demo Badges Toggle */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-800">Show Synthetic Demo Badges in UI</p>
                <p className="text-slate-500 text-[11px]">
                  Display &quot;DEMO / SYNTHETIC DATA&quot; tags on mock registries and simulated services for transparency.
                </p>
              </div>
              <input
                type="checkbox"
                checked={showDemoBadges}
                onChange={(e) => setShowDemoBadges(e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded cursor-pointer"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleSaveAiSettings}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save AI Engine Settings</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Change Account Password</h3>
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Current Password *</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">New Password *</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Confirm New Password *</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-blue-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPassword ? 'Hide Characters' : 'Show Characters'}</span>
                </button>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
