import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { ToastProvider } from './context/ToastContext';

// Components
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { CommandSearch } from './components/common/CommandSearch';
import { NotificationDrawer } from './components/common/NotificationDrawer';
import { LandingPage } from './components/landing/LandingPage';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { ForgotPasswordModal } from './components/auth/ForgotPasswordModal';
import { MainDashboard } from './components/dashboard/MainDashboard';
import { HomePage } from './components/home/HomePage';
import { PatientList } from './components/patients/PatientList';
import { PatientDetail } from './components/patients/PatientDetail';
import { XRayAnalysisView } from './components/screening/XRayAnalysisView';
import { SymptomIntelligenceView } from './components/screening/SymptomIntelligenceView';
import { CoughAnalysisView } from './components/screening/CoughAnalysisView';
import { LaboratoryView } from './components/laboratory/LaboratoryView';
import { TreatmentMonitoringView } from './components/treatment/TreatmentMonitoringView';
import { AiAssistantView } from './components/ai-assistant/AiAssistantView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { SettingsView } from './components/settings/SettingsView';

function AppContent() {
  const { isAuthenticated, loginAsDemo } = useAuth();
  const { t } = useLanguage();

  // Navigation State
  const [authView, setAuthView] = useState<'landing' | 'login' | 'register'>('landing');
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState<string>('pat_001');

  // UI Drawers & Overlays
  const [isCommandSearchOpen, setIsCommandSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Global Keyboard shortcut for Command Search (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Normalizer for canonical routes & synonyms
  const normalizeView = (rawView: string): string => {
    let v = rawView.toLowerCase().trim();
    if (v.startsWith('admin-admin-')) {
      v = v.replace('admin-admin-', 'admin-');
    }
    if (v === 'assistant' || v === 'ai' || v === 'clinical-assistant' || v === 'copilot') {
      return 'ai-assistant';
    }
    if (v === 'clinics' || v === 'clinic-network') {
      return 'admin-clinics';
    }
    if (v === 'audit' || v === 'audit-log') {
      return 'admin-audit';
    }
    if (v === 'users' || v === 'user-management') {
      return 'admin-users';
    }
    if (v === 'system' || v === 'system-status') {
      return 'admin-system';
    }
    if (v === 'x-ray' || v === 'xray-ai' || v === 'screening') {
      return 'xray';
    }
    if (v === 'symptom' || v === 'symptom-ai' || v === 'symptoms-ai') {
      return 'symptoms';
    }
    if (v === 'cough-ai' || v === 'cough-analysis' || v === 'audio') {
      return 'cough';
    }
    if (v === 'lab' || v === 'laboratory') {
      return 'labs';
    }
    if (v === 'dots' || v === 'treatment-monitoring') {
      return 'treatment';
    }
    if (v === 'login') {
      setAuthView('login');
      return 'landing';
    }
    if (v === 'register') {
      setAuthView('register');
      return 'landing';
    }
    return v;
  };

  // Handler for navigation from command search or sub-components
  const handleNavigate = (view: string, patientId?: string) => {
    const canonical = normalizeView(view);
    setCurrentView(canonical);
    if (patientId) {
      setSelectedPatientId(patientId);
    }
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If not authenticated, render Public Landing or Auth Views
  if (!isAuthenticated) {
    if (authView === 'landing') {
      return (
        <LandingPage
          onEnterApp={() => {
            loginAsDemo('DOCTOR');
          }}
          onGetStarted={() => {
            loginAsDemo('DOCTOR');
          }}
          onNavigateAuth={(mode) => setAuthView(mode)}
          onSignIn={() => setAuthView('login')}
          onRegister={() => setAuthView('register')}
        />
      );
    }

    if (authView === 'login') {
      return (
        <>
          <LoginPage
            onSuccess={() => setAuthView('landing')}
            onNavigateRegister={() => setAuthView('register')}
            onForgotPassword={() => setIsForgotOpen(true)}
            onBackToLanding={() => setAuthView('landing')}
          />
          <ForgotPasswordModal
            isOpen={isForgotOpen}
            onClose={() => setIsForgotOpen(false)}
          />
        </>
      );
    }

    if (authView === 'register') {
      return (
        <RegisterPage
          onSuccess={() => setAuthView('landing')}
          onNavigateLogin={() => setAuthView('login')}
          onBackToLanding={() => setAuthView('landing')}
        />
      );
    }
  }

  // Authenticated Application Shell
  return (
    <div className="min-h-screen bg-slate-950/2 flex text-slate-900 font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onNavigate={(view) => handleNavigate(view)}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <Header
          onOpenSearch={() => setIsCommandSearchOpen(true)}
          onOpenCommandSearch={() => setIsCommandSearchOpen(true)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onToggleSidebar={() => setMobileMenuOpen(!mobileMenuOpen)}
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
          onNavigate={(view) => handleNavigate(view)}
        />

        {/* Dynamic Main Body Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {(currentView === 'home' || currentView === 'landing') && (
            <HomePage onNavigate={(view, pId) => handleNavigate(view, pId)} />
          )}

          {currentView === 'dashboard' && (
            <MainDashboard
              onNavigate={(view, pId) => handleNavigate(view, pId)}
            />
          )}

          {currentView === 'patients' && (
            <PatientList
              onSelectPatient={(pId) => handleNavigate('patient-detail', pId)}
              onNavigateScreening={(tool, pId) => handleNavigate(tool, pId)}
              onScreenPatient={(pId) => handleNavigate('xray', pId)}
            />
          )}

          {currentView === 'patient-detail' && (
            <PatientDetail
              patientId={selectedPatientId}
              onBack={() => handleNavigate('patients')}
              onNavigateScreening={(tool, pId) => handleNavigate(tool, pId)}
            />
          )}

          {currentView === 'xray' && (
            <XRayAnalysisView
              initialPatientId={selectedPatientId}
              onNavigatePatient={(pId) => handleNavigate('patient-detail', pId)}
            />
          )}

          {currentView === 'symptoms' && (
            <SymptomIntelligenceView
              initialPatientId={selectedPatientId}
              onNavigateScreening={(tool, pId) => handleNavigate(tool, pId)}
            />
          )}

          {currentView === 'cough' && (
            <CoughAnalysisView
              initialPatientId={selectedPatientId}
              onNavigateScreening={(tool, pId) => handleNavigate(tool, pId)}
            />
          )}

          {currentView === 'labs' && (
            <LaboratoryView
              initialPatientId={selectedPatientId}
              onSelectPatient={(pId) => handleNavigate('patient-detail', pId)}
            />
          )}

          {currentView === 'treatment' && (
            <TreatmentMonitoringView
              initialPatientId={selectedPatientId}
              onSelectPatient={(pId) => handleNavigate('patient-detail', pId)}
            />
          )}

          {currentView === 'ai-assistant' && <AiAssistantView />}

          {currentView === 'analytics' && <AnalyticsView />}

          {(currentView === 'admin' ||
            currentView === 'admin-users' ||
            currentView === 'admin-clinics' ||
            currentView === 'admin-audit' ||
            currentView === 'admin-system') && (
            <AdminDashboard
              initialTab={
                currentView === 'admin-clinics'
                  ? 'clinics'
                  : currentView === 'admin-audit'
                  ? 'audit'
                  : currentView === 'admin-system'
                  ? 'system'
                  : 'users'
              }
              onNavigateTab={(tab) => handleNavigate(tab.startsWith('admin-') ? tab : `admin-${tab}`)}
              onSelectPatient={(pId) => handleNavigate('patient-detail', pId)}
            />
          )}

          {currentView === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Global Command Search (Cmd+K) */}
      <CommandSearch
        isOpen={isCommandSearchOpen}
        onClose={() => setIsCommandSearchOpen(false)}
        onNavigate={(view, pId) => handleNavigate(view, pId)}
      />

      {/* Real-time Notifications Drawer */}
      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onNavigate={(view, pId) => handleNavigate(view, pId)}
        onSelectPatient={(pId) => handleNavigate('patient-detail', pId)}
      />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <ToastProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ToastProvider>
    </LanguageProvider>
  );
}
