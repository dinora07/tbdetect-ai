import {
  Patient,
  PatientDocument,
  XRayAnalysis,
  SymptomAssessment,
  CoughAnalysis,
  LabResult,
  TreatmentPlan,
  TimelineEvent,
  NotificationItem,
  User,
  Clinic,
  AuditLog,
  AnalyticsSummary,
} from '../../types';
import {
  mockPatients,
  mockXRays,
  mockSymptomAssessments,
  mockCoughAnalyses,
  mockLabResults,
  mockTreatmentPlans,
  mockTimelineEvents,
  mockNotifications,
  mockUsers,
  mockClinics,
  mockAuditLogs,
} from '../mockData';

const STORAGE_KEYS = {
  PATIENTS: 'tbdetect_patients_v2',
  XRAYS: 'tbdetect_xrays_v2',
  SYMPTOMS: 'tbdetect_symptoms_v2',
  COUGHS: 'tbdetect_coughs_v2',
  LABS: 'tbdetect_labs_v2',
  TREATMENTS: 'tbdetect_treatments_v2',
  TIMELINE: 'tbdetect_timeline_v2',
  NOTIFICATIONS: 'tbdetect_notifications_v2',
  USERS: 'tbdetect_users_v2',
  CLINICS: 'tbdetect_clinics_v2',
  AUDIT_LOGS: 'tbdetect_audit_logs_v2',
  DOCUMENTS: 'tbdetect_documents_v2',
};

function loadFromStorage<T>(key: string, fallback: T[]): T[] {
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Storage read error fallback
  }
  return [...fallback];
}

function saveToStorage<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Storage write error
  }
}

// Initial in-memory reactive state loaded from persistent storage or initial seeds
let patients: Patient[] = loadFromStorage<Patient>(STORAGE_KEYS.PATIENTS, mockPatients);
let xrays: XRayAnalysis[] = loadFromStorage<XRayAnalysis>(STORAGE_KEYS.XRAYS, mockXRays);
let symptoms: SymptomAssessment[] = loadFromStorage<SymptomAssessment>(STORAGE_KEYS.SYMPTOMS, mockSymptomAssessments);
let coughAnalyses: CoughAnalysis[] = loadFromStorage<CoughAnalysis>(STORAGE_KEYS.COUGHS, mockCoughAnalyses);
let labResults: LabResult[] = loadFromStorage<LabResult>(STORAGE_KEYS.LABS, mockLabResults);
let treatments: TreatmentPlan[] = loadFromStorage<TreatmentPlan>(STORAGE_KEYS.TREATMENTS, mockTreatmentPlans);
let timelineEvents: TimelineEvent[] = loadFromStorage<TimelineEvent>(STORAGE_KEYS.TIMELINE, mockTimelineEvents);
let notifications: NotificationItem[] = loadFromStorage<NotificationItem>(STORAGE_KEYS.NOTIFICATIONS, mockNotifications);
let users: User[] = loadFromStorage<User>(STORAGE_KEYS.USERS, mockUsers);
let clinics: Clinic[] = loadFromStorage<Clinic>(STORAGE_KEYS.CLINICS, mockClinics);
let auditLogs: AuditLog[] = loadFromStorage<AuditLog>(STORAGE_KEYS.AUDIT_LOGS, mockAuditLogs);

// Initial documents
const initialDocuments: PatientDocument[] = [
  {
    id: 'doc_001',
    patientId: 'pat_001',
    name: 'Chest_XRay_PA_Initial_Scan.jpg',
    type: 'XRAY',
    fileSize: '3.4 MB',
    mimeType: 'image/jpeg',
    uploadedAt: '2026-08-18T10:14:00Z',
    uploadedBy: 'Dr. Sarah Chen, MD',
    url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'doc_002',
    patientId: 'pat_001',
    name: 'GeneXpert_MTB_RIF_Molecular_Report.pdf',
    type: 'LAB_REPORT',
    fileSize: '1.2 MB',
    mimeType: 'application/pdf',
    uploadedAt: '2026-08-18T14:30:00Z',
    uploadedBy: 'Central Mycobacteriology Lab',
    url: '#',
  },
  {
    id: 'doc_003',
    patientId: 'pat_001',
    name: 'WHO_DOTS_Treatment_Enrolment_Form.pdf',
    type: 'DISCHARGE_SUMMARY',
    fileSize: '840 KB',
    mimeType: 'application/pdf',
    uploadedAt: '2026-08-19T09:00:00Z',
    uploadedBy: 'Elena Smirnova, RN',
    url: '#',
  },
];
let patientDocuments: PatientDocument[] = loadFromStorage<PatientDocument>(STORAGE_KEYS.DOCUMENTS, initialDocuments);

export const appStorage = {
  // Patients
  getPatients(): Patient[] {
    return [...patients];
  },
  setPatients(newList: Patient[]): void {
    patients = [...newList];
    saveToStorage(STORAGE_KEYS.PATIENTS, patients);
  },

  // Documents
  getDocuments(): PatientDocument[] {
    return [...patientDocuments];
  },
  setDocuments(newList: PatientDocument[]): void {
    patientDocuments = [...newList];
    saveToStorage(STORAGE_KEYS.DOCUMENTS, patientDocuments);
  },

  // XRays
  getXRays(): XRayAnalysis[] {
    return [...xrays];
  },
  setXRays(newList: XRayAnalysis[]): void {
    xrays = [...newList];
    saveToStorage(STORAGE_KEYS.XRAYS, xrays);
  },

  // Symptoms
  getSymptoms(): SymptomAssessment[] {
    return [...symptoms];
  },
  setSymptoms(newList: SymptomAssessment[]): void {
    symptoms = [...newList];
    saveToStorage(STORAGE_KEYS.SYMPTOMS, symptoms);
  },

  // Coughs
  getCoughs(): CoughAnalysis[] {
    return [...coughAnalyses];
  },
  setCoughs(newList: CoughAnalysis[]): void {
    coughAnalyses = [...newList];
    saveToStorage(STORAGE_KEYS.COUGHS, coughAnalyses);
  },

  // Labs
  getLabs(): LabResult[] {
    return [...labResults];
  },
  setLabs(newList: LabResult[]): void {
    labResults = [...newList];
    saveToStorage(STORAGE_KEYS.LABS, labResults);
  },

  // Treatments
  getTreatments(): TreatmentPlan[] {
    return [...treatments];
  },
  setTreatments(newList: TreatmentPlan[]): void {
    treatments = [...newList];
    saveToStorage(STORAGE_KEYS.TREATMENTS, treatments);
  },

  // Timeline
  getTimeline(): TimelineEvent[] {
    return [...timelineEvents];
  },
  setTimeline(newList: TimelineEvent[]): void {
    timelineEvents = [...newList];
    saveToStorage(STORAGE_KEYS.TIMELINE, timelineEvents);
  },

  // Notifications
  getNotifications(): NotificationItem[] {
    return [...notifications];
  },
  setNotifications(newList: NotificationItem[]): void {
    notifications = [...newList];
    saveToStorage(STORAGE_KEYS.NOTIFICATIONS, notifications);
  },

  // Users
  getUsers(): User[] {
    return [...users];
  },
  setUsers(newList: User[]): void {
    users = [...newList];
    saveToStorage(STORAGE_KEYS.USERS, users);
  },

  // Clinics
  getClinics(): Clinic[] {
    return [...clinics];
  },
  setClinics(newList: Clinic[]): void {
    clinics = [...newList];
    saveToStorage(STORAGE_KEYS.CLINICS, clinics);
  },

  // Audit Logs
  getAuditLogs(): AuditLog[] {
    return [...auditLogs];
  },
  setAuditLogs(newList: AuditLog[]): void {
    auditLogs = [...newList];
    saveToStorage(STORAGE_KEYS.AUDIT_LOGS, auditLogs);
  },

  // Real-time calculated adherence for a treatment plan
  calculateAdherence(plan: TreatmentPlan): number {
    const doses = plan.doseLogs || [];
    if (doses.length === 0) {
      const taken = plan.dosesTaken || 0;
      const missed = plan.missedDoses || 0;
      const total = taken + missed;
      return total > 0 ? Math.min(100, Math.round((taken / total) * 1000) / 10) : 100;
    }
    const takenCount = doses.filter((d) => d.status === 'TAKEN').length;
    const missedCount = doses.filter((d) => d.status === 'MISSED' || d.status === 'SKIPPED').length;
    const totalCount = takenCount + missedCount;
    return totalCount > 0 ? Math.min(100, Math.round((takenCount / totalCount) * 1000) / 10) : 100;
  },

  // Calculate live analytics summary from current stored records
  computeAnalyticsSummary(): AnalyticsSummary {
    const totalPatients = patients.length;
    const highRiskCases = patients.filter((p) => p.riskLevel === 'HIGH' || p.riskLevel === 'CRITICAL').length;
    const pendingDoctorReviews = xrays.filter((x) => !x.doctorReview?.signed).length;
    const activeTreatments = treatments.filter((t) => t.status === 'ACTIVE').length;

    // Calculate real average adherence across active treatments
    let totalAdherence = 0;
    let activeWithAdherence = 0;
    treatments.forEach((t) => {
      const rate = this.calculateAdherence(t);
      totalAdherence += rate;
      activeWithAdherence++;
    });
    const adherenceRateAverage =
      activeWithAdherence > 0
        ? Math.round((totalAdherence / activeWithAdherence) * 10) / 10
        : 95.0;

    const riskDistribution = [
      { name: 'Low Risk (<40%)', value: patients.filter((p) => p.riskLevel === 'LOW').length, color: '#10B981' },
      { name: 'Moderate (40-69%)', value: patients.filter((p) => p.riskLevel === 'MODERATE').length, color: '#F59E0B' },
      { name: 'High Risk (70-84%)', value: patients.filter((p) => p.riskLevel === 'HIGH').length, color: '#F97316' },
      { name: 'Critical (85-100%)', value: patients.filter((p) => p.riskLevel === 'CRITICAL').length, color: '#EF4444' },
    ];

    const symptomFrequency = [
      { symptom: 'Persistent Cough (>2 weeks)', count: symptoms.filter((s) => s.symptoms.coughDurationDays > 14).length, percentage: 88 },
      { symptom: 'Nocturnal Diaphoresis (Night Sweats)', count: symptoms.filter((s) => s.symptoms.hasNightSweats).length, percentage: 72 },
      { symptom: 'Unexplained Weight Loss', count: symptoms.filter((s) => s.symptoms.hasWeightLoss).length, percentage: 65 },
      { symptom: 'Low-Grade Evening Fever', count: symptoms.filter((s) => s.symptoms.hasFever).length, percentage: 58 },
      { symptom: 'Hemoptysis (Blood in Sputum)', count: symptoms.filter((s) => s.symptoms.hasHemoptysis).length, percentage: 34 },
      { symptom: 'Pleuritic Chest Pain', count: symptoms.filter((s) => s.symptoms.hasChestPain).length, percentage: 41 },
    ];

    return {
      totalPatients,
      screeningsThisMonth: xrays.length + coughAnalyses.length,
      highRiskCases,
      pendingDoctorReviews,
      activeTreatments,
      adherenceRateAverage,
      avgReviewTurnaroundHours: 3.4,
      monthlyTrend: [
        { month: 'Mar', screenings: 18, highRisk: 4, confirmed: 3 },
        { month: 'Apr', screenings: 24, highRisk: 6, confirmed: 5 },
        { month: 'May', screenings: 31, highRisk: 7, confirmed: 6 },
        { month: 'Jun', screenings: 29, highRisk: 5, confirmed: 4 },
        { month: 'Jul', screenings: 38, highRisk: 9, confirmed: 8 },
        { month: 'Aug', screenings: Math.max(12, xrays.length + 5), highRisk: highRiskCases, confirmed: Math.min(highRiskCases, activeTreatments) },
      ],
      riskDistribution,
      symptomFrequency,
      modalityContribution: [
        { name: 'Chest Radiograph (Deep CNN)', weight: 42 },
        { name: 'WHO Clinical Symptom Algorithm', weight: 28 },
        { name: 'Acoustic Cough Biomarkers', weight: 18 },
        { name: 'Epidemiological Contact History', weight: 12 },
      ],
    };
  },

  // Reset to initial demo sandbox state if user requests
  resetToSandboxSeeds(): void {
    Object.values(STORAGE_KEYS).forEach((k) => {
      try {
        localStorage.removeItem(k);
      } catch {
        // Ignore
      }
    });
    patients = [...mockPatients];
    xrays = [...mockXRays];
    symptoms = [...mockSymptomAssessments];
    coughAnalyses = [...mockCoughAnalyses];
    labResults = [...mockLabResults];
    treatments = [...mockTreatmentPlans];
    timelineEvents = [...mockTimelineEvents];
    notifications = [...mockNotifications];
    users = [...mockUsers];
    clinics = [...mockClinics];
    auditLogs = [...mockAuditLogs];
    patientDocuments = [...initialDocuments];
  },
};
