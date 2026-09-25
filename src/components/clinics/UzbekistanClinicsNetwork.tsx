import React, { useState, useMemo } from 'react';
import {
  Building2,
  MapPin,
  Phone,
  Globe,
  Navigation,
  Search,
  Filter,
  CheckCircle2,
  Activity,
  Users,
  Calendar,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Stethoscope,
  ChevronRight,
  Info,
  X,
  PhoneCall,
  Copy,
  Layers,
  Hospital,
  Compass,
} from 'lucide-react';
import { Clinic, UzbekistanRegionKey } from '../../types';
import {
  REAL_UZBEKISTAN_CLINICS,
  UZBEKISTAN_REGIONS,
} from '../../services/uzbekistanClinicsData';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';

interface UzbekistanClinicsNetworkProps {
  onSelectClinicForReferral?: (clinic: Clinic) => void;
}

export const UzbekistanClinicsNetwork: React.FC<UzbekistanClinicsNetworkProps> = ({
  onSelectClinicForReferral,
}) => {
  const { t, language } = useLanguage();
  const { success, info } = useToast();

  // Filters State
  const [selectedRegionKey, setSelectedRegionKey] = useState<UzbekistanRegionKey | 'ALL'>('ALL');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [tbOnlyFilter, setTbOnlyFilter] = useState<boolean>(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Selected Clinic for Details Modal
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);

  // Available districts based on current region
  const availableDistricts = useMemo(() => {
    if (selectedRegionKey === 'ALL') {
      const districtsSet = new Set<string>();
      REAL_UZBEKISTAN_CLINICS.forEach((c) => {
        if (c.cityOrDistrict) districtsSet.add(c.cityOrDistrict);
      });
      return Array.from(districtsSet).sort();
    }
    const regionClinics = REAL_UZBEKISTAN_CLINICS.filter((c) => c.regionKey === selectedRegionKey);
    const districtsSet = new Set<string>();
    regionClinics.forEach((c) => {
      if (c.cityOrDistrict) districtsSet.add(c.cityOrDistrict);
    });
    return Array.from(districtsSet).sort();
  }, [selectedRegionKey]);

  // Filtered Clinics
  const filteredClinics = useMemo(() => {
    return REAL_UZBEKISTAN_CLINICS.filter((clinic) => {
      // Region filter
      if (selectedRegionKey !== 'ALL' && clinic.regionKey !== selectedRegionKey) {
        return false;
      }

      // District filter
      if (selectedDistrict !== 'ALL' && clinic.cityOrDistrict !== selectedDistrict) {
        return false;
      }

      // Type filter
      if (selectedType !== 'ALL' && clinic.organizationType !== selectedType) {
        return false;
      }

      // TB Specialized Only
      if (tbOnlyFilter && !clinic.isTbSpecialized) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'ALL' && clinic.status !== selectedStatus) {
        return false;
      }

      // Search Query (name, address, cityOrDistrict, phone)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = clinic.name.toLowerCase().includes(q);
        const matchesAddress = clinic.address.toLowerCase().includes(q);
        const matchesDistrict = clinic.cityOrDistrict?.toLowerCase().includes(q) || false;
        const matchesRegion = clinic.region.toLowerCase().includes(q);
        const matchesPhone = clinic.contactPhone?.toLowerCase().includes(q) || false;
        const matchesAdmin = clinic.adminName?.toLowerCase().includes(q) || false;
        if (
          !matchesName &&
          !matchesAddress &&
          !matchesDistrict &&
          !matchesRegion &&
          !matchesPhone &&
          !matchesAdmin
        ) {
          return false;
        }
      }

      return true;
    });
  }, [selectedRegionKey, selectedDistrict, selectedType, tbOnlyFilter, selectedStatus, searchQuery]);

  // Statistics across current view
  const stats = useMemo(() => {
    const total = REAL_UZBEKISTAN_CLINICS.length;
    const tbCount = REAL_UZBEKISTAN_CLINICS.filter((c) => c.isTbSpecialized).length;
    const coveredRegions = UZBEKISTAN_REGIONS.length;
    return { total, tbCount, coveredRegions };
  }, []);

  const handleCopyPhone = (phone?: string) => {
    if (!phone) {
      info(language === 'uz' ? "Telefon raqami mavjud emas" : "Phone number not available");
      return;
    }
    navigator.clipboard.writeText(phone);
    success(
      language === 'uz'
        ? `Telefon nusxalandi: ${phone}`
        : language === 'ru'
        ? `Телефон скопирован: ${phone}`
        : `Phone copied: ${phone}`
    );
  };

  const handleGetDirections = (clinic: Clinic) => {
    const query = encodeURIComponent(`${clinic.name}, ${clinic.address}`);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
    window.open(mapsUrl, '_blank', 'noopener,noreferrer');
  };

  const handleOpenWebsite = (website?: string) => {
    if (!website) {
      info(
        language === 'uz'
          ? "Ushbu muassasaning rasmiy veb-sayti mavjud emas"
          : language === 'ru'
          ? "Официальный веб-сайт для учреждения не указан"
          : "Official website is not available for this facility"
      );
      return;
    }
    const fullUrl = website.startsWith('http') ? website : `https://${website}`;
    window.open(fullUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-blue-800/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 text-xs font-semibold uppercase tracking-wider backdrop-blur-md">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-300" />
              <span>O'zbekiston Respublikasi Sog'liqni Saqlash Vazirligi</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span>{t.clinicNetwork?.title || "O'ZBEKISTON KLINIKALAR TARMOQI"}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-medium">
                14/14 Qamrov
              </span>
            </h1>
            <p className="text-sm text-blue-100/80 leading-relaxed">
              {t.clinicNetwork?.subtitle ||
                "Respublikaning barcha 14 ta ma'muriy hududidagi ftiziatriya va pulmonologiya markazlari hamda silga qarshi dispanserlarning yagona davlat monitoring katalogi"}
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 text-center">
              <p className="text-[11px] font-medium text-blue-200 uppercase tracking-wider">
                {t.clinicNetwork?.facilitiesCount || "Muassasalar"}
              </p>
              <p className="text-2xl font-black text-white">{stats.total}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 text-center">
              <p className="text-[11px] font-medium text-blue-200 uppercase tracking-wider">
                {t.clinicNetwork?.tbCentersCount || "TB Markazlari"}
              </p>
              <p className="text-2xl font-black text-emerald-300">{stats.tbCount}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 text-center">
              <p className="text-[11px] font-medium text-blue-200 uppercase tracking-wider">
                {t.clinicNetwork?.regionSelector || "Viloyatlar"}
              </p>
              <p className="text-2xl font-black text-cyan-300">{stats.coveredRegions}</p>
            </div>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-16 -bottom-16 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/2 -top-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 14 Regions Horizontal Carousel / Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Compass className="w-4 h-4 text-blue-600" />
            <span>{t.clinicNetwork?.regionalCoverage || "Respublika qamrovi (14 ta ma'muriy hudud)"}</span>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {selectedRegionKey === 'ALL'
              ? language === 'uz'
                ? 'Barcha hududlar tanlangan'
                : 'All regions selected'
              : UZBEKISTAN_REGIONS.find((r) => r.key === selectedRegionKey)?.nameUz}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
          {/* ALL Regions Pill */}
          <button
            onClick={() => {
              setSelectedRegionKey('ALL');
              setSelectedDistrict('ALL');
            }}
            className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
              selectedRegionKey === 'ALL'
                ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-white border-slate-200/80 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold truncate">
                {language === 'uz' ? 'Barchasi' : language === 'ru' ? 'Все' : 'All'}
              </span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full font-bold ${
                  selectedRegionKey === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {stats.total}
              </span>
            </div>
            <p
              className={`text-[10px] mt-1 truncate ${
                selectedRegionKey === 'ALL' ? 'text-blue-100' : 'text-slate-400'
              }`}
            >
              14/14 Hudud
            </p>
          </button>

          {/* Individual Regions */}
          {UZBEKISTAN_REGIONS.map((region) => {
            const isSelected = selectedRegionKey === region.key;
            const regionClinicsCount = REAL_UZBEKISTAN_CLINICS.filter(
              (c) => c.regionKey === region.key
            ).length;
            const displayName =
              language === 'ru'
                ? region.nameRu
                : language === 'en'
                ? region.nameEn
                : region.nameUz;

            return (
              <button
                key={region.key}
                onClick={() => {
                  setSelectedRegionKey(region.key);
                  setSelectedDistrict('ALL');
                }}
                className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-white border-slate-200/80 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
                title={displayName}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold truncate">{displayName}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full font-bold ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {regionClinicsCount}
                  </span>
                </div>
                <p
                  className={`text-[10px] mt-1 truncate ${
                    isSelected ? 'text-blue-100' : 'text-slate-400'
                  }`}
                >
                  {language === 'ru' ? region.centerRu : language === 'en' ? region.centerEn : region.centerUz}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Input */}
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                t.clinicNetwork?.searchPlaceholder ||
                "Klinika nomi, manzil, tuman yoki telefon orqali qidirish..."
              }
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:bg-white focus:border-blue-500 outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Region Dropdown */}
          <div className="md:col-span-3">
            <select
              value={selectedRegionKey}
              onChange={(e) => {
                setSelectedRegionKey(e.target.value as any);
                setSelectedDistrict('ALL');
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-700 outline-none focus:bg-white focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">
                {t.clinicNetwork?.allRegions || "Barcha 14 ta ma'muriy hudud"}
              </option>
              {UZBEKISTAN_REGIONS.map((r) => (
                <option key={r.key} value={r.key}>
                  {language === 'ru' ? r.nameRu : language === 'en' ? r.nameEn : r.nameUz}
                </option>
              ))}
            </select>
          </div>

          {/* District / City Dropdown */}
          <div className="md:col-span-3">
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-700 outline-none focus:bg-white focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">
                {t.clinicNetwork?.allDistricts || "Barcha tuman va shaharlar"}
              </option>
              {availableDistricts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Facility Type Filter */}
          <div className="md:col-span-2">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-700 outline-none focus:bg-white focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">{t.clinicNetwork?.allTypes || "Barcha muassasa turlari"}</option>
              <option value="PULMONOLOGY_CENTER">
                {language === 'uz'
                  ? 'Ilmiy-amaliy tibbiyot markazi'
                  : language === 'ru'
                  ? 'Научно-практический центр'
                  : 'Specialized Center'}
              </option>
              <option value="REGIONAL_HOSPITAL">
                {language === 'uz'
                  ? 'Viloyat shifoxonasi'
                  : language === 'ru'
                  ? 'Областная больница'
                  : 'Regional Hospital'}
              </option>
              <option value="TB_DISPENSARY">
                {language === 'uz'
                  ? 'Silga qarshi dispanser'
                  : language === 'ru'
                  ? 'Противотуберкулезный диспансер'
                  : 'TB Dispensary'}
              </option>
              <option value="PRIMARY_HEALTH_CLINIC">
                {language === 'uz'
                  ? 'Birlamchi poliklinika'
                  : language === 'ru'
                  ? 'Первичная поликлиника'
                  : 'Primary Clinic'}
              </option>
              <option value="MOBILE_SCREENING_UNIT">
                {language === 'uz'
                  ? 'Ko‘chma skrining stansiyasi'
                  : language === 'ru'
                  ? 'Мобильный комплекс'
                  : 'Mobile Unit'}
              </option>
            </select>
          </div>
        </div>

        {/* Secondary Toggles Row */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {/* TB Specialized Checkbox */}
            <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50/70 border border-blue-200/70 rounded-xl cursor-pointer text-blue-900 font-semibold select-none hover:bg-blue-50">
              <input
                type="checkbox"
                checked={tbOnlyFilter}
                onChange={(e) => setTbOnlyFilter(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-0 cursor-pointer"
              />
              <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
              <span>
                {t.clinicNetwork?.tbSpecializedOnly ||
                  "Faqat silga qarshi ixtisoslashgan muassasalar"}
              </span>
            </label>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium outline-none cursor-pointer"
            >
              <option value="ALL">{t.clinicNetwork?.statusAll || "Barcha holatlar"}</option>
              <option value="ACTIVE">{t.clinicNetwork?.statusActive || "Ochiq / Ish faoliyatida"}</option>
            </select>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            <span>
              {language === 'uz'
                ? `Topildi: ${filteredClinics.length} ta muassasa`
                : language === 'ru'
                ? `Найдено: ${filteredClinics.length} учреждений`
                : `Found: ${filteredClinics.length} facilities`}
            </span>
          </div>
        </div>
      </div>

      {/* Clinics Card Grid */}
      {filteredClinics.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Building2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            {language === 'uz'
              ? 'Hech qanday tibbiy muassasa topilmadi'
              : language === 'ru'
              ? 'Учреждения не найдены'
              : 'No facilities found'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {language === 'uz'
              ? "Qidiruv so'rovingiz yoki filtrlarni o'zgartirib ko'ring"
              : "Try adjusting your search criteria or resetting filters"}
          </p>
          <button
            onClick={() => {
              setSelectedRegionKey('ALL');
              setSelectedDistrict('ALL');
              setSearchQuery('');
              setSelectedType('ALL');
              setTbOnlyFilter(false);
              setSelectedStatus('ALL');
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            {language === 'uz' ? 'Filtrlarni tozalash' : 'Reset Filters'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClinics.map((clinic) => {
            const hasWebsite = Boolean(clinic.website && clinic.website !== 'Ma\'lumot mavjud emas');
            const hasPhone = Boolean(clinic.contactPhone && clinic.contactPhone !== 'Ma\'lumot mavjud emas');

            return (
              <div
                key={clinic.id}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between p-5 space-y-4"
              >
                {/* Card Header */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-50 to-indigo-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                        <Hospital className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600">
                          {clinic.cityOrDistrict || clinic.region}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2 mt-0.5">
                          {clinic.name}
                        </h3>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                        clinic.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {clinic.status === 'ACTIVE'
                        ? t.clinicNetwork?.statusActive || 'Ochiq'
                        : clinic.status}
                    </span>
                  </div>

                  {/* Region & Address */}
                  <div className="space-y-1 text-xs text-slate-600 pt-1">
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="text-[11px] leading-relaxed text-slate-700">
                        {clinic.address}
                      </span>
                    </div>

                    {/* Phone Number */}
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {hasPhone ? (
                        <a
                          href={`tel:${clinic.contactPhone}`}
                          className="text-[11px] font-mono font-medium text-blue-600 hover:underline"
                        >
                          {clinic.contactPhone}
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">
                          {t.clinicNetwork?.noData || "Ma'lumot mavjud emas"}
                        </span>
                      )}
                    </div>

                    {/* Website */}
                    <div className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {hasWebsite ? (
                        <a
                          href={clinic.website?.startsWith('http') ? clinic.website : `https://${clinic.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-medium text-blue-600 hover:underline truncate max-w-[200px]"
                        >
                          {clinic.website?.replace(/^https?:\/\//, '')}
                        </a>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-400 italic">
                          {t.clinicNetwork?.noData || "Ma'lumot mavjud emas"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Services Tags */}
                  {clinic.services && clinic.services.length > 0 && (
                    <div className="pt-2 border-t border-slate-100">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                        {t.clinicNetwork?.specializedServices || "Xizmatlar"}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {clinic.services.slice(0, 3).map((service, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-medium"
                          >
                            {service}
                          </span>
                        ))}
                        {clinic.services.length > 3 && (
                          <span className="px-1.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 text-[10px] font-bold">
                            +{clinic.services.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Verification Source Badge */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>{clinic.verifiedSource || "O'zR SSV / RIFP IATM"}</span>
                    </span>
                    <span className="font-mono">{clinic.lastVerifiedDate || "2026-08"}</span>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="pt-3 border-t border-slate-100 grid grid-cols-3 gap-1.5 text-xs">
                  {/* View Details Modal */}
                  <button
                    onClick={() => setSelectedClinic(clinic)}
                    className="py-2 px-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>{t.clinicNetwork?.viewDetails || "Ko'rish"}</span>
                  </button>

                  {/* Contact / Phone */}
                  <button
                    onClick={() => {
                      if (hasPhone) {
                        handleCopyPhone(clinic.contactPhone);
                      } else {
                        info(t.clinicNetwork?.noData || "Ma'lumot mavjud emas");
                      }
                    }}
                    className={`py-2 px-2 rounded-xl font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                      hasPhone
                        ? 'bg-blue-50 hover:bg-blue-100 text-blue-700'
                        : 'bg-slate-50 text-slate-300 cursor-not-allowed'
                    }`}
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>{t.clinicNetwork?.contact || "Aloqa"}</span>
                  </button>

                  {/* Directions / Maps */}
                  <button
                    onClick={() => handleGetDirections(clinic)}
                    className="py-2 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    title={t.clinicNetwork?.openInMaps || "Google Xaritalarda ochish"}
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>{t.clinicNetwork?.directions || "Xarita"}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Clinic Detail Modal */}
      {selectedClinic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-md p-6 border-b border-slate-100 flex items-start justify-between gap-4 z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                  <Hospital className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600">
                    {selectedClinic.region} • {selectedClinic.cityOrDistrict}
                  </span>
                  <h2 className="text-lg font-bold text-slate-900 leading-tight">
                    {selectedClinic.name}
                  </h2>
                </div>
              </div>
              <button
                onClick={() => setSelectedClinic(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6 text-xs text-slate-700">
              {/* Institution Key Specs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold uppercase text-slate-400">
                    {t.clinicNetwork?.statusFilter || "Holati"}
                  </p>
                  <p className="text-xs font-bold text-emerald-600 mt-1">
                    {selectedClinic.status === 'ACTIVE'
                      ? t.clinicNetwork?.statusActive || 'Faol / Ochiq'
                      : selectedClinic.status}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold uppercase text-slate-400">
                    {t.clinicNetwork?.registeredPatients || "Bemorlar soni"}
                  </p>
                  <p className="text-sm font-bold text-blue-600 mt-0.5">
                    {selectedClinic.totalPatientsCount || 0}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold uppercase text-slate-400">
                    {t.clinicNetwork?.monthlyScreenings || "Oylik skrininglar"}
                  </p>
                  <p className="text-sm font-bold text-indigo-600 mt-0.5">
                    {selectedClinic.activeScreeningsCount || 0}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold uppercase text-slate-400">
                    {language === 'uz' ? 'Shifokorlar' : 'Doctors'}
                  </p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">
                    {selectedClinic.activeUsersCount || 0}
                  </p>
                </div>
              </div>

              {/* Facility Details & Contacts */}
              <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                <h4 className="font-bold text-slate-900 flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-600" />
                  <span>
                    {language === 'uz' ? "Muassasa ma'lumotlari" : "Facility Information"}
                  </span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-400">
                      {t.clinicNetwork?.address || "Aniq manzil"}
                    </p>
                    <p className="font-medium text-slate-800 mt-0.5">{selectedClinic.address}</p>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-400">
                      {t.clinicNetwork?.phone || "Aloqa telefoni"}
                    </p>
                    <p className="font-medium text-slate-800 mt-0.5 font-mono">
                      {selectedClinic.contactPhone || t.clinicNetwork?.noData || "Ma'lumot mavjud emas"}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-400">
                      {t.clinicNetwork?.website || "Rasmiy veb-sayt"}
                    </p>
                    <p className="font-medium text-slate-800 mt-0.5">
                      {selectedClinic.website && selectedClinic.website !== "Ma'lumot mavjud emas" ? (
                        <a
                          href={selectedClinic.website.startsWith('http') ? selectedClinic.website : `https://${selectedClinic.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <span>{selectedClinic.website}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-slate-400 italic">
                          {t.clinicNetwork?.noData || "Ma'lumot mavjud emas"}
                        </span>
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-400">
                      {t.clinicNetwork?.chiefPhysician || "Bosh shifokor / Mas'ul"}
                    </p>
                    <p className="font-medium text-slate-800 mt-0.5">
                      {selectedClinic.adminName || t.clinicNetwork?.noData || "Ma'lumot mavjud emas"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Clinical Services Provided */}
              {selectedClinic.services && selectedClinic.services.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-emerald-600" />
                    <span>
                      {t.clinicNetwork?.specializedServices || "Mavjud ixtisoslashtirilgan xizmatlar"}
                    </span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedClinic.services.map((svc, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center gap-2 text-xs"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="font-medium text-slate-800">{svc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Data Verification Info */}
              <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-200/60 flex items-center justify-between text-[11px] text-emerald-900">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    {language === 'uz'
                      ? `Tasdiqlangan manba: ${selectedClinic.verifiedSource || "O'zbekiston Respublikasi SSV"}`
                      : `Verified source: ${selectedClinic.verifiedSource || "Ministry of Health of Uzbekistan"}`}
                  </span>
                </div>
                <span className="font-mono text-emerald-700">
                  {selectedClinic.lastVerifiedDate || '2026-08'}
                </span>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="sticky bottom-0 bg-white/95 backdrop-blur-md p-4 border-t border-slate-100 flex items-center justify-end gap-3 z-10">
              <button
                onClick={() => setSelectedClinic(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors cursor-pointer"
              >
                {language === 'uz' ? 'Yopish' : 'Close'}
              </button>

              {selectedClinic.contactPhone && selectedClinic.contactPhone !== "Ma'lumot mavjud emas" && (
                <a
                  href={`tel:${selectedClinic.contactPhone}`}
                  className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Phone className="w-4 h-4" />
                  <span>{t.clinicNetwork?.callClinic || "Qo'ng'iroq qilish"}</span>
                </a>
              )}

              <button
                onClick={() => handleGetDirections(selectedClinic)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Navigation className="w-4 h-4" />
                <span>{t.clinicNetwork?.openInMaps || "Google Xaritalarda ko'rish"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
