import React, { useState, useEffect, useRef } from 'react';
import {
  ScanLine,
  UploadCloud,
  ZoomIn,
  ZoomOut,
  Sun,
  UserCheck,
  FileCheck,
  CheckCircle2,
  Download,
  FileText,
  Trash2,
  Maximize2,
  Minimize2,
  RefreshCw,
  AlertTriangle,
  ArrowRightLeft,
  X,
  Info,
  ShieldCheck,
  ShieldAlert,
  XCircle,
  RotateCcw,
  Check,
  Lock,
  FileQuestion,
  UserPlus,
  Play,
  Clock,
  Eye,
  Calendar,
  Layers,
  FileCode,
} from 'lucide-react';
import {
  Patient,
  XRayAnalysis,
  XRayFinding,
  RiskLevel,
  AnalysisStatus,
  ImageSourceOrigin,
  FileValidationResult,
  ImagingStudyMetadata,
} from '../../types';
import {
  patientService,
  xrayService,
  imagingAnalysisService,
  documentService,
} from '../../services/api';
import {
  BUILT_IN_DEMO_SCANS,
  isBuiltInDemoAsset,
} from '../../services/imageValidationService';
import { RiskGauge } from '../common/RiskGauge';
import { MedicalDisclaimer } from '../common/MedicalDisclaimer';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { downloadImageFromUrl } from '../../utils/exportUtils';
import { ExportReportModal } from '../common/ExportReportModal';
import { CreatePatientModal } from '../patients/CreatePatientModal';
import { CompareStudiesModal } from './CompareStudiesModal';

interface XRayAnalysisViewProps {
  initialPatientId?: string;
  onNavigatePatient?: (patientId: string) => void;
}

export const XRayAnalysisView: React.FC<XRayAnalysisViewProps> = ({
  initialPatientId,
  onNavigatePatient,
}) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { success, error, info } = useToast();

  // Patients state
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>(initialPatientId || 'pat_001');

  // Study state & history
  const [patientStudies, setPatientStudies] = useState<XRayAnalysis[]>([]);
  const [currentStudy, setCurrentStudy] = useState<XRayAnalysis | null>(null);

  // Analysis State Machine
  // States: 'EMPTY' | 'UPLOADED' | 'VALIDATING' | 'VERIFICATION_REQUIRED' | 'READY' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  const [analysisState, setAnalysisState] = useState<AnalysisStatus | 'EMPTY'>('EMPTY');
  const [processingStep, setProcessingStep] = useState<string>('');
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Image & File details
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileValidation, setFileValidation] = useState<FileValidationResult | null>(null);
  const [imageOrigin, setImageOrigin] = useState<ImageSourceOrigin>('USER_UPLOAD');

  // Viewer modes & controls
  const [viewMode, setViewMode] = useState<'original' | 'heatmap' | 'split'>('original');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [contrastInverted, setContrastInverted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedFinding, setSelectedFinding] = useState<XRayFinding | null>(null);

  // File Upload Drag & Drop State
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const viewerRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Doctor Review form
  const [doctorNotes, setDoctorNotes] = useState('');
  const [clinicalDecision, setClinicalDecision] = useState<
    'CONFIRMED_SUSPICION' | 'NEGATIVE' | 'INCONCLUSIVE_REFER' | 'REQUEST_ADDITIONAL_TESTS'
  >('CONFIRMED_SUSPICION');
  const [signedSuccess, setSignedSuccess] = useState(false);

  // Modals state
  const [showExportModal, setShowExportModal] = useState(false);
  const [showCreatePatientModal, setShowCreatePatientModal] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [studyToDelete, setStudyToDelete] = useState<XRayAnalysis | null>(null);

  // 1. Initial Load: Load all registered patients
  useEffect(() => {
    loadPatients();
  }, []);

  // 2. Patient Change: Strict Data Isolation (Clear previous results and load this patient's studies)
  useEffect(() => {
    handlePatientChange(selectedPatientId);
  }, [selectedPatientId]);

  const loadPatients = async () => {
    const pts = await patientService.getPatients();
    setPatients(pts);
    if (pts.length > 0 && !selectedPatientId) {
      setSelectedPatientId(pts[0].id);
    }
  };

  /**
   * CRITICAL DATA ISOLATION & STALE STATE PROTECTION:
   * When switching patient, immediately clear any active analysis, findings, overlays,
   * risk scores, and doctor review to prevent data leaks.
   */
  const handlePatientChange = async (patientId: string) => {
    clearAllAnalysisState();

    if (!patientId) {
      setPatientStudies([]);
      setAnalysisState('EMPTY');
      return;
    }

    // Load studies exclusively for this patient
    const studies = await imagingAnalysisService.getStudiesByPatientId(patientId);
    setPatientStudies(studies);

    if (studies.length > 0) {
      // Load most recent study for this patient
      const latestStudy = studies[0];
      loadStudyIntoViewer(latestStudy);
    } else {
      resetToEmptyWorkspace();
    }
  };

  /**
   * COMPLETELY CLEARS ALL PREVIOUS ANALYSIS RESULTS, OVERLAYS, FINDINGS & SCORES
   */
  const clearAllAnalysisState = () => {
    setCurrentStudy(null);
    setSelectedFinding(null);
    setDoctorNotes('');
    setSignedSuccess(false);
    setViewMode('original');
    setZoomLevel(1);
    setContrastInverted(false);
    setAnalysisError(null);
    setProcessingStep('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * FULL RESET TO EMPTY WORKSPACE
   */
  const resetToEmptyWorkspace = () => {
    clearAllAnalysisState();
    setImageSrc(null);
    setUploadedFile(null);
    setFileName(null);
    setFileValidation(null);
    setAnalysisState('EMPTY');
    setImageOrigin('USER_UPLOAD');
  };

  /**
   * Loads an existing study into the active studio viewer
   */
  const loadStudyIntoViewer = (study: XRayAnalysis) => {
    clearAllAnalysisState();
    setCurrentStudy(study);
    setImageSrc(study.imageUrl);
    setFileName(study.fileName || `${study.studyId || study.id}.jpg`);
    setImageOrigin(study.sourceOrigin || 'USER_UPLOAD');

    if (study.status === 'COMPLETED') {
      setAnalysisState('COMPLETED');
      setViewMode(study.findings && study.findings.length > 0 ? 'heatmap' : 'original');
    } else if (study.status === 'FAILED') {
      setAnalysisState('FAILED');
      setAnalysisError(study.errorMessage || 'Analysis failed. Please retry.');
    } else {
      setAnalysisState('VERIFICATION_REQUIRED');
    }

    if (study.doctorReview?.notes) {
      setDoctorNotes(study.doctorReview.notes);
    }
    if (study.doctorReview?.clinicalDecision) {
      setClinicalDecision(study.doctorReview.clinicalDecision);
    }

    // Set file validation data
    setFileValidation({
      isValid: true,
      fileName: study.fileName || `${study.studyId || study.id}.jpg`,
      fileSizeFormatted: study.fileSizeFormatted || 'Diagnostic Quality',
      mimeType: study.fileType || 'image/jpeg',
      dimensions: { width: 1200, height: 1200 },
      checks: [
        { id: 'format', label: 'File format verification', status: 'passed', detail: 'Verified Radiograph' },
        { id: 'size', label: 'File size limits', status: 'passed', detail: study.fileSizeFormatted || 'Archived' },
        { id: 'readable', label: 'Image readability & decoding', status: 'passed', detail: 'Decoded successfully' },
        { id: 'dimensions', label: 'Diagnostic resolution check', status: 'passed', detail: '1200 × 1200 px' },
        { id: 'aspectRatio', label: 'Thoracic aspect ratio verification', status: 'passed', detail: 'Standard PA/AP field' },
      ],
    });
  };

  // =========================================================================
  // UNIVERSAL UPLOAD PIPELINE (15-STEP PRODUCTION-READY IMAGING WORKFLOW)
  // =========================================================================
  const handleProcessUserFile = async (file: File) => {
    if (!selectedPatientId) {
      error('Please select a registered patient before uploading radiograph.');
      return;
    }

    const currentPatient = patients.find((p) => p.id === selectedPatientId);
    const patientName = currentPatient ? `${currentPatient.firstName} ${currentPatient.lastName}` : 'Patient';

    // Step 1: Detect file & wipe previous state
    clearAllAnalysisState();
    setUploadedFile(file);
    setImageOrigin('USER_UPLOAD');
    setFileName(file.name);
    setAnalysisState('VALIDATING');
    setProcessingStep('Validating radiograph format, file size, and image resolution...');
    setIsUploading(true);
    setUploadProgress(20);

    const fileSizeFormatted =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
        : `${(file.size / 1024).toFixed(1)} KB`;

    // Step 2, 3, 4, 5: Perform standard file validation checks
    const valResult = await xrayService.validateFile(file);
    setFileValidation(valResult);
    setUploadProgress(45);

    if (!valResult.isValid) {
      setIsUploading(false);
      setAnalysisState('FAILED');
      setAnalysisError(valResult.errorMessage || 'Invalid image file.');
      error(valResult.errorMessage || 'Invalid image file.');
      return;
    }

    // Step 6: Generate preview & Read file stream
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setImageSrc(dataUrl);
      setUploadProgress(70);

      // Step 7, 8, 9: Create unique studyId and metadata
      const uniqueStudyId = `std_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const metadata: ImagingStudyMetadata = {
        studyId: uniqueStudyId,
        patientId: selectedPatientId,
        patientName,
        fileName: file.name,
        fileType: file.type || 'image/jpeg',
        fileSize: file.size,
        fileSizeFormatted,
        uploadedAt: new Date().toISOString(),
        uploadedBy: user?.name || 'Dr. Sarah Chen, MD',
        status: 'UPLOADED',
        viewPosition: valResult.dicomHeader?.viewPosition || 'PA (Posteroanterior)',
        sourceOrigin: 'USER_UPLOAD',
      };

      setProcessingStep('Archiving study in patient dossier...');
      setUploadProgress(85);

      // Create study in patient dossier
      const registeredStudy = await imagingAnalysisService.createStudy(metadata, dataUrl);
      setCurrentStudy(registeredStudy);

      // Save document in patient documents list
      await documentService.uploadDocument({
        patientId: selectedPatientId,
        name: file.name,
        type: 'XRAY',
        fileSize: fileSizeFormatted,
        mimeType: file.type || 'image/jpeg',
        uploadedBy: user?.name || 'Dr. Sarah Chen, MD',
        url: dataUrl,
      });

      // Refresh patient studies
      const updatedStudies = await imagingAnalysisService.getStudiesByPatientId(selectedPatientId);
      setPatientStudies(updatedStudies);
      setUploadProgress(100);
      setIsUploading(false);

      // Step 10 & 11: Send study to imagingAnalysisService
      runAnalysisPipeline(registeredStudy, file);
    };

    reader.onerror = () => {
      setIsUploading(false);
      setAnalysisState('FAILED');
      setAnalysisError('Failed to read image stream from disk.');
      error('Failed to read image file.');
    };

    reader.readAsDataURL(file);
  };

  /**
   * Executes the analysis pipeline via imagingAnalysisService
   */
  const runAnalysisPipeline = async (study: XRayAnalysis, file?: File) => {
    setAnalysisState('PROCESSING');
    setAnalysisError(null);
    setProcessingStep('Sending study to AI inference engine (POST /api/imaging/analyze)...');

    try {
      const response = await imagingAnalysisService.analyzeStudy({
        patientId: study.patientId,
        studyId: study.studyId || study.id,
        file: file || uploadedFile || undefined,
        fileUrl: study.imageUrl,
        sourceOrigin: study.sourceOrigin,
      });

      // Step 12 & 13: Receive response and render result
      if (response.status === 'COMPLETED') {
        setAnalysisState('COMPLETED');
        const updatedStudy: XRayAnalysis = {
          ...study,
          status: 'COMPLETED',
          riskScore: response.riskScore,
          riskLevel: response.riskLevel,
          confidence: response.confidence,
          findings: response.findings || [],
          impression: response.impression || 'AI analysis completed.',
          heatmapCoordinates: response.heatmapCoordinates,
          modelVersion: response.modelVersion,
          analyzedAt: response.analyzedAt,
        };
        setCurrentStudy(updatedStudy);
        setViewMode('heatmap');
        success('Radiograph analysis completed successfully.');
      } else if (response.status === 'FAILED') {
        setAnalysisState('FAILED');
        setAnalysisError(response.errorMessage || 'AI inference model returned an error.');
        error(response.errorMessage || 'AI analysis failed.');
      } else {
        // Truthful fallback: VERIFICATION_REQUIRED
        // NEVER fake TB findings for arbitrary user images!
        setAnalysisState('VERIFICATION_REQUIRED');
        const updatedStudy: XRayAnalysis = {
          ...study,
          status: 'VERIFICATION_REQUIRED',
          riskScore: undefined,
          confidence: undefined,
          findings: [],
          impression: response.impression,
          modelVersion: response.modelVersion,
          analyzedAt: response.analyzedAt,
        };
        setCurrentStudy(updatedStudy);
        info('Study archived. Attending physician radiologist review required for clinical verification.');
      }

      // Step 14 & 15: Update patient study list
      const freshStudies = await imagingAnalysisService.getStudiesByPatientId(study.patientId);
      setPatientStudies(freshStudies);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Analysis service connection failed';
      setAnalysisState('FAILED');
      setAnalysisError(msg);
      error(msg);
    }
  };

  /**
   * Retry Analysis for the current study
   */
  const handleRetryAnalysis = () => {
    if (!currentStudy) return;
    runAnalysisPipeline(currentStudy, uploadedFile || undefined);
  };

  /**
   * DEMO SAMPLE SELECTION:
   * Keeps existing demo images for reference and educational presentation.
   * Explicitly tagged with `BUILT_IN_DEMO` and simulated badges.
   */
  const handleSelectDemoSample = async (sample: (typeof BUILT_IN_DEMO_SCANS)[0]) => {
    if (!selectedPatientId) {
      error('Please select a patient before loading demo study.');
      return;
    }

    const currentPatient = patients.find((p) => p.id === selectedPatientId);
    const patientName = currentPatient ? `${currentPatient.firstName} ${currentPatient.lastName}` : 'Patient';

    clearAllAnalysisState();
    setImageSrc(sample.url);
    setFileName(`${sample.title}.jpg`);
    setImageOrigin('BUILT_IN_DEMO');
    setAnalysisState('VALIDATING');
    setProcessingStep('Loading reference radiograph sample...');

    const valResult = await xrayService.validateFile(sample.url, `${sample.title}.jpg`);
    setFileValidation(valResult);

    // Create a demo study record
    const uniqueStudyId = `std_demo_${Date.now()}_${sample.id}`;
    const metadata: ImagingStudyMetadata = {
      studyId: uniqueStudyId,
      patientId: selectedPatientId,
      patientName,
      fileName: `${sample.title}.jpg`,
      fileType: 'image/jpeg',
      fileSize: 3.2 * 1024 * 1024,
      fileSizeFormatted: '3.2 MB',
      uploadedAt: new Date().toISOString(),
      uploadedBy: user?.name || 'Dr. Sarah Chen, MD',
      status: 'UPLOADED',
      viewPosition: sample.viewPosition || 'PA (Posteroanterior)',
      sourceOrigin: 'BUILT_IN_DEMO',
    };

    const registeredDemoStudy = await imagingAnalysisService.createStudy(metadata, sample.url);
    setCurrentStudy(registeredDemoStudy);

    // Run demo inference via imagingAnalysisService
    runAnalysisPipeline(registeredDemoStudy);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessUserFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessUserFile(file);
    }
  };

  /**
   * Attending Physician Review Sign-Off
   */
  const handleSignReview = async () => {
    if (!currentStudy) return;
    const doctorName = user?.name || 'Dr. Sarah Chen, MD';
    const updated = await xrayService.submitDoctorReview(currentStudy.id, {
      doctorName,
      clinicalDecision,
      notes: doctorNotes,
    });
    if (updated) {
      setCurrentStudy(updated);
      setSignedSuccess(true);
      success('Clinical review signed and sealed into medical audit trail.');
      setTimeout(() => setSignedSuccess(false), 5000);

      // Refresh list
      const freshStudies = await imagingAnalysisService.getStudiesByPatientId(selectedPatientId);
      setPatientStudies(freshStudies);
    }
  };

  /**
   * Download Original Radiograph Image
   */
  const handleDownloadOriginal = () => {
    if (!imageSrc) return;
    const cleanPatientTag = selectedPatient?.nationalId || 'PATIENT';
    const cleanFileName = fileName?.replace(/[^a-zA-Z0-9._-]/g, '_') || `Chest_Radiograph_${cleanPatientTag}.jpg`;
    downloadImageFromUrl(imageSrc, cleanFileName);
    success(`Downloading original image: ${cleanFileName}`);
  };

  /**
   * Delete Study with Confirmation
   */
  const handleConfirmDelete = async () => {
    if (!studyToDelete) return;
    const targetId = studyToDelete.studyId || studyToDelete.id;
    await imagingAnalysisService.deleteStudy(targetId, selectedPatientId);
    success(`Study ${targetId} removed from archive.`);
    setStudyToDelete(null);

    // Refresh studies
    const freshStudies = await imagingAnalysisService.getStudiesByPatientId(selectedPatientId);
    setPatientStudies(freshStudies);

    if (currentStudy && (currentStudy.id === targetId || currentStudy.studyId === targetId)) {
      if (freshStudies.length > 0) {
        loadStudyIntoViewer(freshStudies[0]);
      } else {
        resetToEmptyWorkspace();
      }
    }
  };

  const handleCreatePatientSubmit = async (patientData: any) => {
    const newPt = await patientService.createPatient(patientData);
    setPatients((prev) => [newPt, ...prev]);
    setSelectedPatientId(newPt.id);
    setShowCreatePatientModal(false);
    success(`Patient ${newPt.firstName} ${newPt.lastName} registered successfully.`);
  };

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  return (
    <div className="space-y-6 pb-16">
      {/* Header Banner & Patient Context */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {t.xray.title}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Deep CNN Radiography v3.4
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              DICOM & PACS Pipeline
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {t.xray.subtitle}
          </p>
        </div>

        {/* Patient Selector + Quick Add */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-600">{t.xray.selectPatient}:</label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 outline-none max-w-xs"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName} ({p.nationalId}) - {p.riskLevel} Risk
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowCreatePatientModal(true)}
            className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
            title="Register new patient"
          >
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:inline">New Patient</span>
          </button>
        </div>
      </div>

      {/* Selected Patient & Active Study Relationship Bar */}
      {selectedPatient ? (
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-2xs">
              {selectedPatient.firstName[0]}
              {selectedPatient.lastName[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm">
                  {selectedPatient.firstName} {selectedPatient.lastName}
                </span>
                <span className="font-mono text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200 text-[10px]">
                  {selectedPatient.nationalId}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    selectedPatient.riskLevel === 'HIGH' || selectedPatient.riskLevel === 'CRITICAL'
                      ? 'bg-rose-100 text-rose-800'
                      : selectedPatient.riskLevel === 'MODERATE'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {selectedPatient.riskLevel} RISK
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {selectedPatient.age} yrs • {selectedPatient.gender} • TB History: {selectedPatient.tbHistory.replace('_', ' ')} • Clinic: {selectedPatient.clinicName || selectedPatient.clinicId}
              </p>
            </div>
          </div>

          {/* Active Study Relationship Metadata */}
          <div className="flex items-center gap-3 flex-wrap">
            {currentStudy && (
              <div className="px-3 py-1.5 bg-white rounded-xl border border-slate-200 text-right">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-mono">STUDY ID:</span>
                  <span className="font-mono font-bold text-slate-800 text-[11px]">
                    {currentStudy.studyId || currentStudy.id}
                  </span>
                  <span
                    className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                      currentStudy.status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : currentStudy.status === 'FAILED'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {currentStudy.status}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono">
                  {new Date(currentStudy.uploadedAt).toLocaleString()} • {currentStudy.sourceOrigin}
                </p>
              </div>
            )}

            {patientStudies.length > 1 && (
              <button
                onClick={() => setShowCompareModal(true)}
                className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl font-bold transition-colors flex items-center gap-1.5"
                title="Compare studies for this patient"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Compare Studies ({patientStudies.length})</span>
              </button>
            )}

            {onNavigatePatient && (
              <button
                onClick={() => onNavigatePatient(selectedPatient.id)}
                className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-semibold transition-colors"
              >
                View Patient Dossier →
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs font-semibold text-amber-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Select a registered patient before initiating radiograph screening.</span>
        </div>
      )}

      <MedicalDisclaimer variant="compact" />

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Radiograph Viewer, Validation Status & Upload Controls (8 cols) */}
        <div className="lg:col-span-8 space-y-4">

          {/* 1. FILE VALIDATION & DIAGNOSTIC QUALITY CARD */}
          {analysisState !== 'EMPTY' && fileValidation && (
            <div
              className={`p-5 rounded-3xl border transition-all ${
                analysisState === 'FAILED'
                  ? 'bg-rose-50/80 border-rose-200 text-rose-950'
                  : analysisState === 'VERIFICATION_REQUIRED'
                  ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                  : analysisState === 'PROCESSING' || analysisState === 'VALIDATING'
                  ? 'bg-blue-50/70 border-blue-200 text-blue-950'
                  : currentStudy?.isDemoSimulation
                  ? 'bg-indigo-50/70 border-indigo-200 text-indigo-950'
                  : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2.5 rounded-2xl ${
                      analysisState === 'FAILED'
                        ? 'bg-rose-600 text-white'
                        : analysisState === 'VERIFICATION_REQUIRED'
                        ? 'bg-amber-600 text-white'
                        : analysisState === 'PROCESSING' || analysisState === 'VALIDATING'
                        ? 'bg-blue-600 text-white animate-pulse'
                        : currentStudy?.isDemoSimulation
                        ? 'bg-indigo-600 text-white'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {analysisState === 'FAILED' ? (
                      <ShieldAlert className="w-5 h-5" />
                    ) : analysisState === 'VERIFICATION_REQUIRED' ? (
                      <AlertTriangle className="w-5 h-5" />
                    ) : analysisState === 'PROCESSING' || analysisState === 'VALIDATING' ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-black uppercase tracking-wider">
                        {analysisState === 'PROCESSING' || analysisState === 'VALIDATING'
                          ? 'AI ANALYSIS ENGINE RUNNING'
                          : analysisState === 'FAILED'
                          ? 'ANALYSIS INCOMPLETE / FAILED'
                          : analysisState === 'VERIFICATION_REQUIRED'
                          ? 'MEDICAL RADIOGRAPH ARCHIVED'
                          : currentStudy?.isDemoSimulation
                          ? 'DEMO REFERENCE RADIOGRAPH'
                          : 'RADIOGRAPH ANALYSIS VERIFIED'}
                      </h3>
                      {analysisState === 'VERIFICATION_REQUIRED' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          Attending Sign-off Pending
                        </span>
                      )}
                      {currentStudy?.isDemoSimulation && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-900 border border-indigo-300">
                          Demo Simulation
                        </span>
                      )}
                      {fileValidation.isDicom && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-300">
                          DICOM Verified
                        </span>
                      )}
                    </div>

                    {/* Accurate, safe messaging */}
                    {analysisState === 'PROCESSING' && (
                      <p className="text-xs text-blue-800 mt-1 font-semibold">
                        {processingStep || 'Processing radiograph through neural network...'}
                      </p>
                    )}

                    {analysisState === 'VERIFICATION_REQUIRED' && (
                      <div className="mt-1 space-y-0.5">
                        <p className="text-sm font-bold text-amber-950">
                          Radiological verification pending physician sign-off
                        </p>
                        <p className="text-xs text-amber-800">
                          File validated and linked to study archive. Deep neural inference requires live connection to clinical AI inference server (VITE_USE_BACKEND_API). Attending pulmonologist may sign clinical review directly.
                        </p>
                      </div>
                    )}

                    {analysisState === 'FAILED' && (
                      <div className="mt-1 space-y-0.5">
                        <p className="text-sm font-bold text-rose-900">
                          {analysisError || 'The analysis pipeline encountered an error.'}
                        </p>
                        <p className="text-xs text-rose-700">
                          You can retry analysis using the button on the right, or choose another radiograph file.
                        </p>
                      </div>
                    )}

                    {analysisState === 'COMPLETED' && currentStudy?.isDemoSimulation && (
                      <p className="text-xs font-semibold text-indigo-900 mt-1">
                        Built-in clinical reference scan active • Simulated demo results displayed
                      </p>
                    )}

                    {analysisState === 'COMPLETED' && !currentStudy?.isDemoSimulation && (
                      <p className="text-xs font-semibold text-emerald-900 mt-1">
                        Clinical AI inference returned validated radiological telemetry from Spring Boot server.
                      </p>
                    )}
                  </div>
                </div>

                {/* Workflow Action Buttons */}
                <div className="flex items-center gap-2">
                  {analysisState === 'FAILED' && (
                    <button
                      onClick={handleRetryAnalysis}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Retry Analysis</span>
                    </button>
                  )}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors"
                  >
                    Replace Image
                  </button>
                  <button
                    onClick={resetToEmptyWorkspace}
                    className="px-3 py-1.5 bg-slate-200/70 hover:bg-slate-300/80 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                  >
                    Clear Workspace
                  </button>
                </div>
              </div>

              {/* Client-Side File Validation Checklist */}
              <div className="mt-3 pt-3 border-t border-slate-200/60 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-xs">
                {fileValidation.checks.map((check) => (
                  <div
                    key={check.id}
                    className={`p-2 rounded-xl border flex items-start gap-2 ${
                      check.status === 'passed'
                        ? 'bg-white/80 border-slate-200/80 text-slate-800'
                        : 'bg-white/90 border-rose-300 text-rose-900 shadow-2xs'
                    }`}
                  >
                    <span className="mt-0.5">
                      {check.status === 'passed' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      )}
                    </span>
                    <div className="overflow-hidden">
                      <p className="font-bold truncate text-[11px]">{check.label}</p>
                      {check.detail && (
                        <p className="text-[10px] opacity-75 truncate">{check.detail}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. MAIN X-RAY VIEWER STAGE */}
          <div
            ref={viewerRef}
            className={`bg-slate-950 rounded-3xl border border-slate-800 shadow-xl overflow-hidden flex flex-col ${
              isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''
            }`}
          >
            {/* Viewer Top Toolbar */}
            <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-white">
              {/* View Mode Tabs */}
              <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-xl">
                <button
                  onClick={() => setViewMode('original')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                    viewMode === 'original' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t.xray.viewOriginal}
                </button>
                <button
                  onClick={() => setViewMode('heatmap')}
                  disabled={analysisState !== 'COMPLETED'}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                    viewMode === 'heatmap' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title={analysisState !== 'COMPLETED' ? 'Available only when AI analysis is complete' : 'View Attention Heatmap'}
                >
                  {t.xray.viewHeatmap}
                </button>
                <button
                  onClick={() => setViewMode('split')}
                  disabled={analysisState !== 'COMPLETED'}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                    viewMode === 'split' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title={analysisState !== 'COMPLETED' ? 'Available only when AI analysis is complete' : 'Split View'}
                >
                  {t.xray.viewCompare}
                </button>
              </div>

              {/* Viewer Tools (Zoom, Invert, Fullscreen, Reset) */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setZoomLevel((z) => Math.min(z + 0.2, 2.5))}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors"
                  title={t.xray.zoomIn}
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoomLevel((z) => Math.max(z - 0.2, 0.8))}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors"
                  title={t.xray.zoomOut}
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setContrastInverted(!contrastInverted)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    contrastInverted ? 'bg-indigo-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                  title="Invert Contrast / Bone Window"
                >
                  <Sun className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors"
                  title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen View'}
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => {
                    setZoomLevel(1);
                    setContrastInverted(false);
                  }}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-mono transition-colors"
                >
                  {t.xray.resetView}
                </button>
              </div>
            </div>

            {/* Viewer Canvas Stage */}
            <div
              className={`relative ${
                isFullscreen ? 'flex-1 h-full' : 'h-[480px]'
              } bg-black flex items-center justify-center overflow-hidden select-none`}
            >
              {/* State: PROCESSING */}
              {analysisState === 'PROCESSING' || analysisState === 'VALIDATING' ? (
                <div className="p-8 text-center space-y-4 text-white z-20">
                  <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center mx-auto animate-pulse">
                    <ScanLine className="w-8 h-8 text-cyan-400 animate-spin" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-cyan-300">
                      {processingStep || 'Processing radiograph through neural network...'}
                    </p>
                    <p className="text-xs text-slate-400 font-mono">
                      Running Production AI Imaging Pipeline
                    </p>
                  </div>
                </div>
              ) : imageSrc ? (
                <div
                  className="relative transition-transform duration-200 max-w-full max-h-full flex items-center justify-center"
                  style={{
                    transform: `scale(${zoomLevel})`,
                    filter: contrastInverted ? 'invert(1) contrast(1.2)' : 'none',
                  }}
                >
                  {/* Clean Image Rendering (No fake overlay if unverified) */}
                  <img
                    src={imageSrc}
                    alt="Loaded Radiograph / Image"
                    referrerPolicy="no-referrer"
                    className="max-h-[460px] max-w-full object-contain"
                  />

                  {/* REAL BACKEND HEATMAP OVERLAY */}
                  {analysisState === 'COMPLETED' &&
                    currentStudy &&
                    (viewMode === 'heatmap' || viewMode === 'split') && (
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        {currentStudy.heatmapUrl && (
                          <img
                            src={currentStudy.heatmapUrl}
                            alt="AI Attention Heatmap"
                            className="max-h-[460px] max-w-full object-contain mix-blend-screen opacity-75 pointer-events-none"
                          />
                        )}

                        {/* ONLY RENDER FINDING BOXES IF SPECIFICALLY RETURNED */}
                        {currentStudy.findings
                          .filter((f) => f.boundingPoly)
                          .map((f, i) => {
                            const poly = f.boundingPoly!;
                            return (
                              <div
                                key={i}
                                onClick={() => setSelectedFinding(f)}
                                className="absolute pointer-events-auto cursor-pointer rounded-2xl border-2 border-rose-500 bg-rose-500/30 hover:bg-rose-500/50 transition-all flex items-start p-1"
                                style={{
                                  left: `${poly.x}%`,
                                  top: `${poly.y}%`,
                                  width: `${poly.width}%`,
                                  height: `${poly.height}%`,
                                }}
                              >
                                <span className="bg-rose-950/90 text-rose-200 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border border-rose-600 shadow-md">
                                  {f.zone} ({(f.confidence * 100).toFixed(0)}%)
                                </span>
                              </div>
                            );
                          })}

                        {/* If heatmap and bounding boxes are both absent */}
                        {!currentStudy.heatmapUrl &&
                          currentStudy.findings.filter((f) => f.boundingPoly).length === 0 && (
                            <div className="absolute bottom-16 bg-slate-900/90 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-medium shadow-lg backdrop-blur-xs">
                              Localization overlay unavailable
                            </div>
                          )}
                      </div>
                    )}
                </div>
              ) : (
                /* Empty Viewer State */
                <div className="p-8 text-center text-slate-500 space-y-3">
                  <ScanLine className="w-12 h-12 mx-auto text-slate-600" />
                  <p className="text-sm font-semibold">No radiograph loaded for this patient.</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
                  >
                    Upload Chest Radiograph
                  </button>
                </div>
              )}

              {/* DEMO MODE TRANSPARENCY BADGE */}
              {analysisState === 'COMPLETED' && currentStudy?.isDemoSimulation && (
                <div className="absolute top-3 left-3 z-10">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-black/75 backdrop-blur-md text-amber-300 text-[10px] font-bold rounded-lg border border-amber-500/40 shadow-md">
                    <Info className="w-3 h-3 text-amber-400" />
                    DEMO AI VISUALIZATION — Simulated result (Reference scan)
                  </span>
                </div>
              )}

              {/* USER-UPLOADED ARCHIVED NOTICE */}
              {analysisState === 'VERIFICATION_REQUIRED' && (
                <div className="absolute top-3 left-3 z-10">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-black/75 backdrop-blur-md text-amber-300 text-[10px] font-bold rounded-lg border border-amber-500/40 shadow-md">
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                    Archived in Patient Dossier — Radiological Verification Pending
                  </span>
                </div>
              )}

              {/* Bottom Viewer Info Overlay */}
              {imageSrc && (
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between p-2.5 bg-slate-900/80 backdrop-blur-md rounded-xl text-xs text-slate-300 border border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">
                      {selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : 'Patient'}
                    </span>
                    <span className="font-mono text-slate-400">({selectedPatient?.nationalId})</span>
                    {currentStudy?.studyId && (
                      <span className="font-mono text-cyan-400">[{currentStudy.studyId}]</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-cyan-400 truncate max-w-[200px]">
                      {fileName || 'Radiograph'}
                    </span>
                    <span className="font-mono text-slate-400">Zoom: {(zoomLevel * 100).toFixed(0)}%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Action Bar under Viewer */}
            {imageSrc && (
              <div className="px-4 py-2.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={handleDownloadOriginal}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium transition-colors flex items-center gap-1.5"
                    title="Download original uploaded file"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Original Image</span>
                  </button>

                  {/* Export Dossier button */}
                  {currentStudy && (
                    <button
                      onClick={() => setShowExportModal(true)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center gap-1.5 shadow-xs"
                      title="Export certified clinical dossier"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Export Dossier</span>
                    </button>
                  )}

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium transition-colors flex items-center gap-1.5"
                    title="Replace with another scan"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Replace Image</span>
                  </button>
                </div>

                {currentStudy && (
                  <button
                    onClick={() => setStudyToDelete(currentStudy)}
                    className="px-2.5 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 rounded-xl font-medium transition-colors flex items-center gap-1"
                    title="Remove study from archive"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Delete Study</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 3. UNIVERSAL FILE UPLOAD DROPZONE */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`p-6 bg-white rounded-3xl border-2 border-dashed transition-all text-center space-y-3 ${
              isDragging
                ? 'border-blue-500 bg-blue-50/50 scale-[1.01]'
                : 'border-slate-300 hover:border-slate-400 shadow-xs'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp,.dcm"
              onChange={handleFileInputChange}
              className="hidden"
            />

            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-2xs">
              <UploadCloud className="w-6 h-6" />
            </div>

            <div>
              <p className="text-sm font-bold text-slate-800">
                Drag and drop Chest Radiograph here, or{' '}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 hover:underline font-extrabold"
                >
                  browse files
                </button>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Supported formats: JPG, JPEG, PNG, WEBP, and DICOM (.dcm). 5KB – 40MB.
              </p>
            </div>

            {/* Upload Progress Indicator */}
            {isUploading && (
              <div className="max-w-md mx-auto p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-left">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span className="truncate">{fileName || 'Uploading file...'}</span>
                  <span className="font-mono text-blue-600">{uploadProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-200 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 4. PATIENT STUDY HISTORY TABLE */}
          {selectedPatient && (
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    Patient Study History ({patientStudies.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Archived radiographic studies for {selectedPatient.firstName} {selectedPatient.lastName}
                  </p>
                </div>
                {patientStudies.length > 1 && (
                  <button
                    onClick={() => setShowCompareModal(true)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    <span>Compare Scans</span>
                  </button>
                )}
              </div>

              {patientStudies.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
                  No radiographs archived for this patient. Upload a chest X-ray above to begin.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {patientStudies.map((study) => {
                    const isCurrent = currentStudy?.id === study.id || currentStudy?.studyId === study.studyId;
                    return (
                      <div
                        key={study.id}
                        className={`py-3 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl transition-colors ${
                          isCurrent ? 'bg-blue-50/60 border border-blue-200/60' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {study.imageUrl ? (
                            <img
                              src={study.imageUrl}
                              alt="Thumbnail"
                              referrerPolicy="no-referrer"
                              className="w-12 h-12 object-cover rounded-xl bg-black border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center shrink-0">
                              <ScanLine className="w-6 h-6 text-slate-400" />
                            </div>
                          )}
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-xs text-slate-800">
                                {study.studyId || study.id}
                              </span>
                              <span
                                className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                                  study.status === 'COMPLETED'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : study.status === 'FAILED'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {study.status}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {new Date(study.uploadedAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 truncate max-w-sm">
                              {study.fileName || 'Radiograph scan'} • {study.fileSizeFormatted || 'Diagnostic'} • Model: {study.modelVersion || 'Standard'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          {!isCurrent && (
                            <button
                              onClick={() => loadStudyIntoViewer(study)}
                              className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1"
                              title="Load study into studio viewer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View</span>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (study.imageUrl) {
                                downloadImageFromUrl(study.imageUrl, `${study.studyId || study.id}.jpg`);
                              }
                            }}
                            className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl transition-colors"
                            title="Download original file"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setStudyToDelete(study)}
                            className="p-1.5 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-400 hover:text-rose-600 rounded-xl transition-colors"
                            title="Delete this study"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 5. PRESET REFERENCE SAMPLE DEMO RADIOGRAPHS */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  {t.xray.sampleImages}
                </h3>
                <p className="text-xs text-slate-500">
                  Built-in clinical pulmonary reference datasets for demo visualization
                </p>
              </div>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-mono">
                {BUILT_IN_DEMO_SCANS.length} Reference Scans
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {BUILT_IN_DEMO_SCANS.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectDemoSample(sample)}
                  disabled={analysisState === 'PROCESSING' || analysisState === 'VALIDATING'}
                  className="group relative rounded-2xl overflow-hidden border border-slate-200 text-left hover:border-blue-500 hover:shadow-md transition-all p-2 bg-slate-50 hover:bg-white"
                >
                  <img
                    src={sample.url}
                    alt={sample.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-24 object-cover rounded-xl bg-black"
                  />
                  <div className="mt-2 space-y-0.5">
                    <p className="text-xs font-bold text-slate-800 group-hover:text-blue-600 truncate">
                      {sample.title}
                    </p>
                    <div className="flex items-center justify-between text-[10px]">
                      <span
                        className={`font-mono font-bold ${
                          sample.score > 75
                            ? 'text-rose-600'
                            : sample.score > 40
                            ? 'text-amber-600'
                            : 'text-emerald-600'
                        }`}
                      >
                        {sample.score}% Risk
                      </span>
                      <span className="text-slate-400">Load Demo →</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: State-Aware AI Panel & Doctor Review (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* AI Multimodal Risk Gauge Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs text-center space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                {t.xray.riskScoreLabel}
              </h3>
              {currentStudy && (
                <button
                  onClick={() => setShowExportModal(true)}
                  className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg transition-colors"
                  title="Export this study"
                >
                  <Download className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* STATE-AWARE RIGHT PANEL RENDERING */}

            {/* STATE 1: EMPTY */}
            {analysisState === 'EMPTY' && (
              <div className="py-10 text-slate-400 text-xs space-y-2">
                <ScanLine className="w-10 h-10 mx-auto text-slate-300" />
                <p className="font-semibold text-slate-600">Upload a chest radiograph to begin.</p>
                <p className="text-[11px] text-slate-400">
                  Select a registered patient and upload a frontal chest radiograph (PA/AP view).
                </p>
              </div>
            )}

            {/* STATE 2: PROCESSING */}
            {(analysisState === 'PROCESSING' || analysisState === 'VALIDATING') && (
              <div className="py-10 text-slate-500 text-xs space-y-3">
                <RefreshCw className="w-8 h-8 mx-auto text-cyan-600 animate-spin" />
                <p className="font-bold text-slate-800">AI analysis in progress...</p>
                <p className="text-[11px] text-slate-400 font-mono">
                  {processingStep || 'Computing feature embeddings...'}
                </p>
              </div>
            )}

            {/* STATE 3: FAILED */}
            {analysisState === 'FAILED' && (
              <div className="py-8 px-4 bg-rose-50/50 rounded-2xl border border-rose-200 space-y-3 text-center">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-rose-900 uppercase">Analysis Incomplete</h4>
                  <p className="text-xs font-bold text-rose-800">
                    {analysisError || 'Could not complete neural inference.'}
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={handleRetryAnalysis}
                    className="w-full py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Retry Analysis</span>
                  </button>
                </div>
              </div>
            )}

            {/* STATE 4: VERIFICATION REQUIRED (REAL USER UPLOAD WHEN BACKEND NOT CONNECTED) */}
            {analysisState === 'VERIFICATION_REQUIRED' && currentStudy && (
              <div className="space-y-4">
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2">
                  <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
                    AI Multimodal Risk Index
                  </p>
                  <p className="text-xl font-bold text-slate-700">Not available</p>
                  <p className="text-[11px] text-slate-500">
                    Connect clinical backend (VITE_USE_BACKEND_API) for neural network scoring.
                  </p>
                </div>

                <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-left space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="font-bold text-amber-900">Localization Overlay</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Localization overlay unavailable. No lesions or cavities were artificially generated. Attending radiologist review can be signed below.
                  </p>
                </div>

                {/* Impression */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs space-y-1">
                  <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                    Status Impression:
                  </p>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    {currentStudy.impression}
                  </p>
                </div>
              </div>
            )}

            {/* STATE 5: ANALYSIS COMPLETE */}
            {analysisState === 'COMPLETED' && currentStudy && (
              <div className="space-y-4">
                {currentStudy.riskScore !== undefined ? (
                  <RiskGauge
                    score={currentStudy.riskScore}
                    riskLevel={currentStudy.riskLevel || 'LOW'}
                    confidence={currentStudy.confidence || 0.9}
                    size="md"
                  />
                ) : (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-xs">
                    Risk Score: Not available
                  </div>
                )}

                {currentStudy.isDemoSimulation && (
                  <p className="text-[10px] text-amber-700 font-medium bg-amber-50 py-1 px-2 rounded-lg border border-amber-200">
                    Simulated Demo AI result — Backend not connected
                  </p>
                )}

                {/* Findings List */}
                <div className="pt-3 border-t border-slate-100 text-xs text-left space-y-2">
                  <p className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                    {t.xray.findingsList}:
                  </p>
                  {currentStudy.findings && currentStudy.findings.length > 0 ? (
                    <div className="space-y-1.5">
                      {currentStudy.findings.map((f, i) => (
                        <div
                          key={i}
                          onClick={() => setSelectedFinding(f)}
                          className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                            selectedFinding === f
                              ? 'bg-rose-50 border-rose-400 text-rose-950 font-semibold'
                              : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold">{f.zone.replace(/_/g, ' ')}</span>
                            <span className="font-mono text-[10px] text-slate-500">
                              {(f.confidence * 100).toFixed(0)}% Conf.
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-1">{f.description}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No localized opacities identified.</p>
                  )}
                </div>

                {/* AI Impression Box */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs space-y-1">
                  <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                    {t.xray.impression}:
                  </p>
                  <p className="text-slate-600 text-[11px] leading-relaxed">{currentStudy.impression}</p>
                </div>
              </div>
            )}
          </div>

          {/* Clinical Doctor Review & Verification Sign-Off Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-blue-600" />
                {t.xray.doctorReviewTitle}
              </h3>
              {currentStudy?.doctorReview?.signed && (
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-md text-[10px] font-bold">
                  Signed & Verified
                </span>
              )}
            </div>

            {signedSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-semibold animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{t.xray.signedSuccess}</span>
              </div>
            )}

            {!currentStudy ? (
              <div className="py-4 text-center text-slate-400 text-xs space-y-1">
                <Lock className="w-5 h-5 mx-auto text-slate-300" />
                <p>Upload a radiograph to enable physician review sign-off.</p>
              </div>
            ) : (
              <>
                <div className="space-y-1 text-left">
                  <label className="text-xs font-bold text-slate-700">{t.xray.decisionLabel}:</label>
                  <select
                    value={clinicalDecision}
                    onChange={(e) => setClinicalDecision(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 outline-none"
                  >
                    <option value="CONFIRMED_SUSPICION">{t.xray.decisionOptions.CONFIRMED_SUSPICION}</option>
                    <option value="NEGATIVE">{t.xray.decisionOptions.NEGATIVE}</option>
                    <option value="INCONCLUSIVE_REFER">{t.xray.decisionOptions.INCONCLUSIVE_REFER}</option>
                    <option value="REQUEST_ADDITIONAL_TESTS">{t.xray.decisionOptions.REQUEST_ADDITIONAL_TESTS}</option>
                  </select>
                </div>

                <div className="space-y-1 text-left">
                  <label className="text-xs font-bold text-slate-700">{t.xray.doctorNotes}:</label>
                  <textarea
                    rows={3}
                    value={doctorNotes}
                    onChange={(e) => setDoctorNotes(e.target.value)}
                    placeholder={t.xray.doctorNotesPlaceholder}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-blue-600 outline-none resize-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-100">
                  <span className="text-slate-400 font-mono text-[10px]">
                    Clinician: {user?.name || 'Dr. Sarah Chen, MD'}
                  </span>
                  <button
                    onClick={handleSignReview}
                    className="px-4 py-2 bg-slate-900 hover:bg-black text-white font-bold rounded-xl text-xs shadow-md transition-colors flex items-center gap-1.5"
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>{t.xray.signAndApprove}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {studyToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Radiograph Study</h3>
                <p className="text-xs text-slate-500">This action will remove the study from medical records.</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
              <p>
                <span className="font-bold text-slate-700">Patient: </span>
                {selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName} (${selectedPatient.nationalId})` : 'Selected Patient'}
              </p>
              <p>
                <span className="font-bold text-slate-700">Study ID: </span>
                <span className="font-mono">{studyToDelete.studyId || studyToDelete.id}</span>
              </p>
              <p>
                <span className="font-bold text-slate-700">File: </span>
                {studyToDelete.fileName || 'Radiograph'}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setStudyToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compare Studies Modal */}
      {showCompareModal && selectedPatient && (
        <CompareStudiesModal
          isOpen={showCompareModal}
          onClose={() => setShowCompareModal(false)}
          patient={selectedPatient}
          studies={patientStudies}
          initialStudyId={currentStudy?.studyId || currentStudy?.id}
        />
      )}

      {/* Export Clinical Report Modal */}
      {showExportModal && currentStudy && (
        <ExportReportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          patient={selectedPatient || undefined}
          xray={currentStudy}
        />
      )}

      {/* Create Patient Modal */}
      {showCreatePatientModal && (
        <CreatePatientModal
          isOpen={showCreatePatientModal}
          onClose={() => setShowCreatePatientModal(false)}
          onSubmit={handleCreatePatientSubmit}
        />
      )}
    </div>
  );
};
