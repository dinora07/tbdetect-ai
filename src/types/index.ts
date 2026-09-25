export type Role = 'ADMIN' | 'CLINIC_ADMIN' | 'DOCTOR' | 'MEDICAL_STAFF' | 'PATIENT';

export type Language = 'en' | 'ru' | 'uz';

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export type ScreeningStatus = 'PENDING_REVIEW' | 'REVIEWED' | 'REFERRED' | 'FOLLOW_UP_REQUIRED' | 'DISCHARGED';

export type TreatmentStatus = 'NOT_STARTED' | 'ACTIVE' | 'COMPLETED' | 'DEFAULTED' | 'SUSPENDED';

export type TestType =
  | 'GENEXPERT_MTB'
  | 'SPUTUM_SMEAR'
  | 'CULTURE'
  | 'IGRA'
  | 'CBC'
  | 'CRP'
  | 'ESR'
  | 'LFT'
  | 'URINE_LAM'
  | 'CHEST_XRAY'
  | 'COUGH_AI'
  | 'OTHER';

export interface User {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: Role;
  clinicId: string;
  clinicName: string;
  specialty?: string;
  position?: string;
  department?: string;
  avatarUrl?: string;
  phone?: string;
  telegram?: string;
  title?: string;
  bio?: string;
  region?: string;
  licenseNumber?: string;
  active: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface PatientDocument {
  id: string;
  patientId: string;
  name: string;
  type: 'XRAY' | 'LAB_REPORT' | 'DISCHARGE_SUMMARY' | 'PRESCRIPTION' | 'ID_DOCUMENT' | 'OTHER';
  fileSize: string;
  mimeType: string;
  uploadedAt: string;
  uploadedBy: string;
  url: string;
}

export interface Patient {
  id: string;
  nationalId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  phone: string;
  email?: string;
  address: string;
  region: string;
  riskScore: number; // 0 - 100
  riskLevel: RiskLevel;
  status: ScreeningStatus;
  treatmentStatus: TreatmentStatus;
  assignedDoctorId: string;
  assignedDoctorName: string;
  clinicId: string;
  clinicName: string;
  tbHistory: 'NONE' | 'PREVIOUS_CURED' | 'HOUSEHOLD_CONTACT' | 'KNOWN_EXPOSURE';
  comorbidities: string[]; // e.g. ["Diabetes Mellitus", "HIV negative", "Smoker"]
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  occupation?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  lastScreeningDate?: string;
  avatar?: string;
}

export type AnalysisStatus =
  | 'UPLOADED'
  | 'VALIDATING'
  | 'VERIFICATION_REQUIRED'
  | 'READY'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED';

export type ImageWorkflowState =
  | 'EMPTY'
  | 'FILE_SELECTED'
  | 'FILE_VALID'
  | 'VALIDATING'
  | 'MEDICAL_VALIDATION_PENDING'
  | 'MEDICAL_IMAGE_VERIFIED'
  | 'ANALYZING'
  | 'ANALYSIS_COMPLETE'
  | 'INVALID_IMAGE'
  | 'FAILED'
  | 'ERROR';

export type ImageSourceOrigin = 'BUILT_IN_DEMO' | 'USER_UPLOAD';

export interface FileValidationCheck {
  id: 'format' | 'size' | 'readable' | 'dimensions' | 'aspectRatio';
  label: string;
  status: 'passed' | 'failed' | 'pending';
  detail?: string;
}

export interface FileValidationResult {
  isValid: boolean;
  fileName: string;
  fileSizeFormatted: string;
  mimeType: string;
  dimensions?: { width: number; height: number };
  aspectRatio?: number;
  isDicom?: boolean;
  dicomHeader?: {
    patientName?: string;
    patientId?: string;
    modality?: string;
    viewPosition?: string;
    studyDate?: string;
    manufacturer?: string;
  };
  checks: FileValidationCheck[];
  errorMessage?: string;
}

export interface BackendValidationResponse {
  valid: boolean;
  imageType: 'CHEST_XRAY' | 'NORMAL_PHOTOGRAPH' | 'LANDSCAPE_NON_MEDICAL' | 'NON_CHEST_MEDICAL' | 'UNSUPPORTED';
  confidence: number;
  message?: string;
  isBackendConnected: boolean;
}

export interface XRayFinding {
  zone: 'UPPER_RIGHT_LOBE' | 'LOWER_RIGHT_LOBE' | 'UPPER_LEFT_LOBE' | 'LOWER_LEFT_LOBE' | 'BILATERAL_APICAL' | 'HILAR_LYMPHADENOPATHY';
  description: string;
  confidence: number;
  boundingPoly?: { x: number; y: number; width: number; height: number };
}

export interface ImagingStudyMetadata {
  studyId: string;
  patientId: string;
  patientName: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileSizeFormatted: string;
  uploadedAt: string;
  uploadedBy: string;
  status: AnalysisStatus;
  viewPosition?: string;
  sourceOrigin: ImageSourceOrigin;
}

export interface ImagingAnalysisRequest {
  patientId: string;
  studyId: string;
  file?: File;
  fileUrl?: string;
  sourceOrigin?: ImageSourceOrigin;
}

export interface ImagingAnalysisResponse {
  studyId: string;
  patientId: string;
  status: AnalysisStatus;
  findings?: XRayFinding[];
  confidence?: number;
  riskScore?: number;
  riskLevel?: RiskLevel;
  heatmapUrl?: string;
  heatmapCoordinates?: { x: number; y: number; radius: number; intensity: number }[];
  impression?: string;
  modelVersion?: string;
  analyzedAt: string;
  errorMessage?: string;
  isBackendConnected?: boolean;
  isDemoSimulation?: boolean;
}

export interface XRayAnalysis {
  id: string;
  studyId?: string;
  patientId: string;
  patientName: string;
  imageUrl: string;
  thumbnailUrl?: string;
  sourceOrigin?: ImageSourceOrigin;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  fileSizeFormatted?: string;
  uploadedAt: string;
  uploadedBy: string;
  analyzedAt: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'VERIFICATION_REQUIRED' | 'READY';
  analysisStatus?: AnalysisStatus;
  riskScore?: number; // 0 - 100, undefined if not available
  riskLevel?: RiskLevel;
  confidence?: number; // 0.0 - 1.0, undefined if not available
  findings: XRayFinding[];
  impression: string;
  modelVersion?: string;
  heatmapUrl?: string;
  errorMessage?: string;
  isDemoSimulation?: boolean;
  heatmapCoordinates?: { x: number; y: number; radius: number; intensity: number }[];
  dicomMetadata?: {
    viewPosition: string;
    kvp: string;
    exposureTime: string;
    manufacturer: string;
  };
  doctorReview?: {
    reviewedBy: string;
    doctorName: string;
    reviewedAt: string;
    clinicalDecision: 'CONFIRMED_SUSPICION' | 'NEGATIVE' | 'INCONCLUSIVE_REFER' | 'REQUEST_ADDITIONAL_TESTS';
    notes: string;
    signed: boolean;
  };
}

export interface SymptomAssessment {
  id: string;
  patientId: string;
  patientName: string;
  assessedAt: string;
  assessedBy: string;
  symptoms: {
    coughDurationDays: number;
    hasHemoptysis: boolean; // Blood in sputum
    hasFever: boolean;
    feverDurationDays?: number;
    hasNightSweats: boolean;
    hasWeightLoss: boolean;
    weightLossKg?: number;
    hasChestPain: boolean;
    hasFatigue: boolean;
    hasLossOfAppetite: boolean;
    hasShortnessOfBreath: boolean;
  };
  riskFactors: {
    closeContactWithTB: boolean;
    smoker: boolean;
    diabetic: boolean;
    immunocompromised: boolean;
    livingInCrowdedArea: boolean;
  };
  calculatedRiskScore: number; // 0 - 100
  riskLevel: RiskLevel;
  summary: string;
}

export interface CoughAnalysis {
  id: string;
  patientId: string;
  patientName: string;
  recordedAt: string;
  durationSeconds: number;
  audioUrl?: string;
  audioWaveformData: number[];
  explosivePhaseDurationMs: number;
  energySpectralDensity: number;
  tbAcousticScore: number; // 0 - 100
  riskLevel: RiskLevel;
  confidence: number;
  interpretation: string;
  acousticClassification?: string;
  impression?: string;
  status?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  isDemoSimulation?: boolean;
}

export interface LabResult {
  id: string;
  patientId: string;
  patientName: string;
  testType: TestType;
  testName: string;
  performedDate: string;
  reportedDate: string;
  laboratoryName: string;
  technicianName: string;
  result: string; // e.g., "MTB DETECTED, RIF RESISTANCE NOT DETECTED" or "Acid-Fast Bacilli (AFB) 2+"
  isAbnormal: boolean;
  referenceRange?: string;
  units?: string;
  quantitativeValue?: number;
  status: 'PENDING' | 'COMPLETED' | 'FLAGGED';
  notes?: string;
  documentUrl?: string;
  documentName?: string;
  documentSize?: string;
  documentMimeType?: string;
  isDemoSimulation?: boolean;
}

export type DoseStatus = 'TAKEN' | 'MISSED' | 'SKIPPED' | 'UNKNOWN';

export interface DailyDoseRecord {
  id: string;
  treatmentPlanId: string;
  patientId: string;
  date: string;
  medicationName: string;
  status: DoseStatus;
  patientNote?: string;
  doctorNote?: string;
  loggedAt?: string;
  isDemoSimulation?: boolean;
}

export type SideEffectSeverity = 'MILD' | 'MODERATE' | 'SEVERE';
export type SideEffectStatus = 'REPORTED' | 'MONITORING' | 'RESOLVED';

export interface SideEffectRecord {
  id: string;
  treatmentPlanId: string;
  patientId: string;
  symptom: string;
  severity: SideEffectSeverity;
  date: string;
  notes?: string;
  status: SideEffectStatus;
  reportedBy?: string;
  doctorActionNote?: string;
  isDemoSimulation?: boolean;
}

export interface MedicationItem {
  id?: string;
  name: string;
  dosage: string;
  frequency: string;
  notes?: string;
}

export interface TreatmentPlan {
  id: string;
  patientId: string;
  patientName: string;
  regimenName: string; // e.g. "WHO Standard First-Line: 2HRZE / 4HR (Fixed-Dose Combination)"
  startDate: string;
  plannedDurationMonths?: number; // e.g. 6 or 9
  estimatedEndDate: string;
  currentPhase: 'INTENSIVE_PHASE' | 'CONTINUATION_PHASE' | 'MAINTENANCE';
  status: TreatmentStatus;
  adherenceRate: number; // e.g., 94.2%
  dosesPrescribed: number;
  dosesTaken: number;
  missedDoses: number;
  facility?: string;
  supervisingDoctor: string;
  notes?: string;
  medications: MedicationItem[];
  doseLogs?: DailyDoseRecord[];
  sideEffects?: SideEffectRecord[];
  weightLog?: { date: string; weightKg: number }[];
  symptomSeverityScoreLog?: { date: string; score: number }[];
  nextAppointmentDate?: string;
  isDemoSimulation?: boolean;
}

export type TimelineEventType =
  | 'PATIENT_REGISTERED'
  | 'SYMPTOM_ASSESSMENT'
  | 'XRAY_UPLOADED'
  | 'AI_ANALYSIS_COMPLETED'
  | 'COUGH_ANALYSIS'
  | 'LAB_RESULT_RECEIVED'
  | 'DOCTOR_REVIEW'
  | 'TREATMENT_STARTED'
  | 'DOSE_TAKEN'
  | 'DOSE_MISSED'
  | 'SIDE_EFFECT_REPORTED'
  | 'PHASE_CHANGED'
  | 'TREATMENT_COMPLETED'
  | 'DOCTOR_NOTE'
  | 'MEDICATION_MILESTONE'
  | 'FOLLOWUP_SCHEDULED'
  | 'REPEAT_SCREENING'
  | 'CLINICAL_NOTE';

export interface TimelineEvent {
  id: string;
  patientId: string;
  timestamp: string;
  type: TimelineEventType;
  title: string;
  description: string;
  authorName: string;
  authorRole: string;
  severity?: 'info' | 'warning' | 'alert' | 'success';
  metadata?: Record<string, unknown>;
  attachments?: { name: string; url?: string; type: string }[];
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'HIGH_RISK_ALERT' | 'REVIEW_PENDING' | 'LAB_READY' | 'FOLLOWUP_DUE' | 'TREATMENT_MILESTONE' | 'SYSTEM';
  read: boolean;
  patientId?: string;
  patientName?: string;
  actionUrl?: string;
  severity: 'info' | 'warning' | 'critical' | 'success';
}

export type UzbekistanRegionKey =
  | 'tashkent_city'
  | 'tashkent_region'
  | 'andijan'
  | 'bukhara'
  | 'fergana'
  | 'jizzakh'
  | 'namangan'
  | 'navoiy'
  | 'qashqadaryo'
  | 'samarkand'
  | 'sirdaryo'
  | 'surxondaryo'
  | 'xorazm'
  | 'karakalpakstan'
  | string;

export interface Clinic {
  id: string;
  name: string;
  nameUz?: string;
  nameRu?: string;
  nameEn?: string;
  organizationType: 'REGIONAL_HOSPITAL' | 'PULMONOLOGY_CENTER' | 'PRIMARY_HEALTH_CLINIC' | 'MOBILE_SCREENING_UNIT' | 'DISPENSARY';
  region: string;
  regionKey?: string;
  district?: string;
  cityOrDistrict?: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
  website?: string;
  adminName: string;
  activeUsersCount: number;
  totalPatientsCount: number;
  activeScreeningsCount: number;
  status: 'ACTIVE' | 'TRIAL' | 'SUSPENDED';
  licenseExpiry: string;
  isTbSpecialized?: boolean;
  services?: string[];
  lastVerifiedDate?: string;
  verificationSource?: string;
  googleMapsQuery?: string;
  isDemoSimulation?: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: Role;
  action: string; // e.g. "CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT", "UPLOAD", "DOWNLOAD", "ANALYSIS_STARTED", "ANALYSIS_COMPLETED"
  resourceType: 'PATIENT' | 'XRAY' | 'COUGH' | 'LAB_RESULT' | 'TREATMENT' | 'USER' | 'CLINIC' | 'SYSTEM_CONFIG' | 'AUTH' | 'NOTIFICATION';
  resourceId: string;
  patientId?: string;
  patientName?: string;
  module?: string;
  ipAddress: string;
  status: 'SUCCESS' | 'DENIED' | 'FAILED';
  details: string;
}

export interface AnalyticsSummary {
  totalPatients: number;
  screeningsThisMonth: number;
  highRiskCases: number;
  pendingDoctorReviews: number;
  activeTreatments: number;
  adherenceRateAverage: number;
  avgReviewTurnaroundHours: number;
  monthlyTrend: { month: string; screenings: number; highRisk: number; confirmed: number }[];
  riskDistribution: { name: string; value: number; color: string }[];
  symptomFrequency: { symptom: string; count: number; percentage: number }[];
  modalityContribution: { name: string; weight: number }[];
}

export interface AiChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  content: string;
  suggestedActions?: { label: string; actionType: string; payload?: unknown }[];
  references?: string[];
}

export interface ApiConfig {
  baseUrl: string;
  useBackendApi: boolean;
  timeoutMs: number;
  tokenKey: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp?: string;
  statusCode?: number;
}

export interface BackendIntegrationState {
  isConnected: boolean;
  apiBaseUrl: string;
  authMode: 'JWT_BEARER' | 'SANDBOX_SESSION';
  lastPingTime?: string;
  serverVersion?: string;
  databaseEngine?: string;
}
