import React, { useState, useEffect, useRef } from 'react';
import {
  FlaskConical,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Download,
  Calendar,
  X,
  Trash2,
  Edit3,
  Eye,
  Upload,
  Paperclip,
  Building2,
  User as UserIcon,
  Filter,
  FileImage,
  Sparkles,
  Layers,
  ArrowRight,
  RefreshCw,
  Clock,
  Check,
} from 'lucide-react';
import { LabResult, Patient, TestType } from '../../types';
import { labService, patientService } from '../../services/api';
import { MedicalDisclaimer } from '../common/MedicalDisclaimer';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';

interface LaboratoryViewProps {
  initialPatientId?: string;
  onSelectPatient?: (patientId: string) => void;
}

// Preset standard TB & infectious diagnostic test profiles
interface TestPreset {
  type: TestType;
  name: string;
  defaultFacility: string;
  defaultTechnician: string;
  defaultUnits?: string;
  defaultRefRange?: string;
  defaultResult: string;
  defaultStatus: 'COMPLETED' | 'FLAGGED' | 'PENDING';
  isAbnormal: boolean;
  defaultNotes: string;
}

const TEST_PRESETS: TestPreset[] = [
  {
    type: 'GENEXPERT_MTB',
    name: 'GeneXpert MTB/RIF Ultra Molecular Assay',
    defaultFacility: 'Central Reference TB Microbiology Lab, Tashkent',
    defaultTechnician: 'Dr. Mansur Zokirov, Senior Pathologist',
    defaultUnits: 'log10 CFU/mL eq',
    defaultRefRange: 'MTB Not Detected',
    defaultResult: 'MTB DETECTED (High Load); RIFAMPICIN RESISTANCE NOT DETECTED',
    defaultStatus: 'FLAGGED',
    isAbnormal: true,
    defaultNotes: 'Automated real-time PCR cartidge assay. Validated rpoB wild-type locus (Rifampicin susceptible).',
  },
  {
    type: 'SPUTUM_SMEAR',
    name: 'Ziehl-Neelsen Acid-Fast Bacilli (AFB) Smear Microscopy',
    defaultFacility: 'Regional Mycobacteriology Laboratory',
    defaultTechnician: 'A. Safarova, Certified Lab Technician',
    defaultRefRange: 'Negative / 0 AFB per 100 oil immersion fields',
    defaultResult: 'POSITIVE 3+ (AFB > 10 per oil immersion field)',
    defaultStatus: 'COMPLETED',
    isAbnormal: true,
    defaultNotes: 'Direct sputum smear examination under 1000x magnification. High bacillary load.',
  },
  {
    type: 'CULTURE',
    name: 'MGIT Liquid Mycobacterial Culture & Phenotypic DST',
    defaultFacility: 'National Center of Tuberculosis & Pulmonology',
    defaultTechnician: 'Dr. K. Boboev, Senior Microbiologist',
    defaultUnits: 'Days to Positivity',
    defaultRefRange: 'No Growth after 42 Days',
    defaultResult: 'Mycobacterium tuberculosis Complex Growth Detected (Day 8); Susceptible to H, R, Z, E',
    defaultStatus: 'COMPLETED',
    isAbnormal: true,
    defaultNotes: 'BACTEC MGIT 960 automated fluorescence detection system. First-line DST panel confirmed.',
  },
  {
    type: 'IGRA',
    name: 'QuantiFERON-TB Gold Plus (IGRA IFN-γ Release Assay)',
    defaultFacility: 'Central Immunodiagnostic Laboratory',
    defaultTechnician: 'Dr. N. Karimova, Clinical Immunologist',
    defaultUnits: 'IU/mL',
    defaultRefRange: '< 0.35 IU/mL (Negative)',
    defaultResult: 'POSITIVE (TB Antigen - Nil: 4.82 IU/mL; Mitogen Control Valid)',
    defaultStatus: 'COMPLETED',
    isAbnormal: true,
    defaultNotes: 'Cellular mediated immune response indicating active or latent TB infection.',
  },
  {
    type: 'CRP',
    name: 'C-Reactive Protein (High Sensitivity hs-CRP)',
    defaultFacility: 'Central Reference TB Lab Tashkent',
    defaultTechnician: 'N. Karimova, Clinical Biochemist',
    defaultUnits: 'mg/L',
    defaultRefRange: '< 5.0 mg/L',
    defaultResult: '48.6 mg/L (Significantly Elevated)',
    defaultStatus: 'COMPLETED',
    isAbnormal: true,
    defaultNotes: 'Acute-phase reactant marker indicating active systemic inflammatory response.',
  },
  {
    type: 'ESR',
    name: 'Erythrocyte Sedimentation Rate (Westergren Method)',
    defaultFacility: 'Central Reference TB Lab Tashkent',
    defaultTechnician: 'N. Karimova, Clinical Biochemist',
    defaultUnits: 'mm/hr',
    defaultRefRange: '0 - 15 mm/hr (Male) / 0 - 20 mm/hr (Female)',
    defaultResult: '62 mm/hr (Elevated)',
    defaultStatus: 'COMPLETED',
    isAbnormal: true,
    defaultNotes: 'Non-specific marker for chronic inflammatory and infectious progression.',
  },
  {
    type: 'CBC',
    name: 'Complete Blood Count (CBC with Automated Differential)',
    defaultFacility: 'Clinical Hematology Department',
    defaultTechnician: 'O. Yusupov, Hematology Specialist',
    defaultUnits: 'Comprehensive Panel',
    defaultRefRange: 'WBC: 4.0-10.0 x10^9/L, Hb: 130-170 g/L',
    defaultResult: 'WBC 11.8 x10^9/L (Mild Leukocytosis), Lymphocytes 14%, Hb 118 g/L (Mild Anemia of Chronic Disease)',
    defaultStatus: 'COMPLETED',
    isAbnormal: true,
    defaultNotes: 'Microcytic hypochromic mild anemia secondary to chronic pulmonary infection.',
  },
  {
    type: 'LFT',
    name: 'Liver Function Test Baseline Panel (ALT, AST, Total Bilirubin)',
    defaultFacility: 'Clinical Biochemistry Laboratory',
    defaultTechnician: 'S. Khasanov, Biochemist',
    defaultUnits: 'U/L, µmol/L',
    defaultRefRange: 'ALT: < 45 U/L, AST: < 35 U/L, T.Bili: < 21 µmol/L',
    defaultResult: 'ALT 28 U/L (Normal), AST 24 U/L (Normal), Total Bilirubin 14.2 µmol/L (Normal)',
    defaultStatus: 'COMPLETED',
    isAbnormal: false,
    defaultNotes: 'Baseline hepatic profile satisfactory prior to initiation of hepatotoxic TB regimen.',
  },
  {
    type: 'URINE_LAM',
    name: 'FujiLAM Urine Lipoarabinomannan Lateral Flow Assay',
    defaultFacility: 'Point-of-Care Rapid Diagnostic Station',
    defaultTechnician: 'Clinical Screening Team',
    defaultRefRange: 'Negative (No test line)',
    defaultResult: 'POSITIVE (Distinct Test Band Detected)',
    defaultStatus: 'FLAGGED',
    isAbnormal: true,
    defaultNotes: 'Non-invasive mycobacterial glycolipid detection in urine specimen.',
  },
];

export const LaboratoryView: React.FC<LaboratoryViewProps> = ({
  initialPatientId,
  onSelectPatient,
}) => {
  const { t } = useLanguage();
  const { success, error: toastError, info } = useToast();

  // Patients & Patient Isolation State
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>(initialPatientId || 'pat_001');
  const [patientLabs, setPatientLabs] = useState<LabResult[]>([]);
  const [allLabsCount, setAllLabsCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [testTypeFilter, setTestTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL'); // ALL, ABNORMAL, NORMAL, FLAGGED, PENDING
  const [viewScope, setViewScope] = useState<'PATIENT_ONLY' | 'ALL_PATIENTS'>('PATIENT_ONLY');

  // Modal State (Create / Edit Form)
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);

  // Form Fields State
  const [formPatientId, setFormPatientId] = useState<string>(selectedPatientId);
  const [formStudyId, setFormStudyId] = useState<string>('');
  const [formTestType, setFormTestType] = useState<TestType>('GENEXPERT_MTB');
  const [formTestName, setFormTestName] = useState<string>('GeneXpert MTB/RIF Ultra Molecular Assay');
  const [formPerformedDate, setFormPerformedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formResult, setFormResult] = useState<string>('');
  const [formUnits, setFormUnits] = useState<string>('');
  const [formReferenceRange, setFormReferenceRange] = useState<string>('');
  const [formEvaluation, setFormEvaluation] = useState<'NORMAL' | 'ABNORMAL' | 'CRITICAL' | 'PENDING'>('ABNORMAL');
  const [formLabFacility, setFormLabFacility] = useState<string>('Central Reference TB Lab Tashkent');
  const [formTechnician, setFormTechnician] = useState<string>('Dr. Mansur Zokirov, Pathologist');
  const [formNotes, setFormNotes] = useState<string>('');

  // Attachment State
  const [formAttachmentUrl, setFormAttachmentUrl] = useState<string | undefined>(undefined);
  const [formAttachmentName, setFormAttachmentName] = useState<string | undefined>(undefined);
  const [formAttachmentSize, setFormAttachmentSize] = useState<string | undefined>(undefined);
  const [formAttachmentMime, setFormAttachmentMime] = useState<string | undefined>(undefined);

  // Validation Error State
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Document Preview Modal State
  const [previewDoc, setPreviewDoc] = useState<{
    url: string;
    name: string;
    mime?: string;
    testName: string;
    patientName: string;
    date: string;
    result: string;
  } | null>(null);

  // Deletion Confirmation Modal State
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    testName: string;
    patientName: string;
  } | null>(null);

  // Reference for file picker
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load patients and initial data
  useEffect(() => {
    loadPatients();
  }, []);

  // When selectedPatientId or viewScope changes: isolate patient data
  useEffect(() => {
    if (selectedPatientId) {
      loadLabs();
    }
  }, [selectedPatientId, viewScope]);

  const loadPatients = async () => {
    try {
      const pts = await patientService.getPatients();
      setPatients(pts);
      if (pts.length > 0 && !selectedPatientId) {
        setSelectedPatientId(pts[0].id);
      }
    } catch {
      toastError('Failed to load patient registry.');
    }
  };

  const loadLabs = async () => {
    setLoading(true);
    try {
      const all = await labService.getAllLabs();
      setAllLabsCount(all.length);

      if (viewScope === 'PATIENT_ONLY') {
        const patientData = await labService.getLabsByPatientId(selectedPatientId);
        setPatientLabs(patientData);
      } else {
        setPatientLabs(all);
      }
    } catch {
      toastError('Failed to load laboratory records.');
    } finally {
      setLoading(false);
    }
  };

  const handlePatientSelectChange = (newPatientId: string) => {
    setSelectedPatientId(newPatientId);
    setFormPatientId(newPatientId);
    if (onSelectPatient) {
      onSelectPatient(newPatientId);
    }
  };

  // Open modal for creating new record
  const handleOpenCreateModal = (preset?: TestPreset) => {
    setEditingRecordId(null);
    setFormErrors({});

    const pId = selectedPatientId || (patients.length > 0 ? patients[0].id : 'pat_001');
    setFormPatientId(pId);
    setFormStudyId(`lab_${Date.now().toString(36)}`);
    setFormPerformedDate(new Date().toISOString().split('T')[0]);

    if (preset) {
      setFormTestType(preset.type);
      setFormTestName(preset.name);
      setFormLabFacility(preset.defaultFacility);
      setFormTechnician(preset.defaultTechnician);
      setFormUnits(preset.defaultUnits || '');
      setFormReferenceRange(preset.defaultRefRange || '');
      setFormResult(preset.defaultResult);
      setFormEvaluation(preset.defaultStatus === 'FLAGGED' ? 'CRITICAL' : preset.isAbnormal ? 'ABNORMAL' : 'NORMAL');
      setFormNotes(preset.defaultNotes);
    } else {
      setFormTestType('GENEXPERT_MTB');
      setFormTestName('GeneXpert MTB/RIF Ultra Molecular Assay');
      setFormLabFacility('Central Reference TB Lab Tashkent');
      setFormTechnician('Dr. Mansur Zokirov, Pathologist');
      setFormUnits('log10 CFU/mL eq');
      setFormReferenceRange('MTB Not Detected');
      setFormResult('MTB DETECTED (High Load); RIFAMPICIN RESISTANCE NOT DETECTED');
      setFormEvaluation('CRITICAL');
      setFormNotes('Automated real-time PCR cartidge assay. Ready for clinical review.');
    }

    setFormAttachmentUrl(undefined);
    setFormAttachmentName(undefined);
    setFormAttachmentSize(undefined);
    setFormAttachmentMime(undefined);

    setIsFormModalOpen(true);
  };

  // Open modal for editing existing record
  const handleOpenEditModal = (lab: LabResult) => {
    setEditingRecordId(lab.id);
    setFormErrors({});

    setFormPatientId(lab.patientId);
    setFormStudyId(lab.id);
    setFormTestType(lab.testType);
    setFormTestName(lab.testName);
    setFormPerformedDate(lab.performedDate);
    setFormResult(lab.result);
    setFormUnits(lab.units || '');
    setFormReferenceRange(lab.referenceRange || '');

    if (lab.status === 'PENDING') {
      setFormEvaluation('PENDING');
    } else if (lab.status === 'FLAGGED') {
      setFormEvaluation('CRITICAL');
    } else if (lab.isAbnormal) {
      setFormEvaluation('ABNORMAL');
    } else {
      setFormEvaluation('NORMAL');
    }

    setFormLabFacility(lab.laboratoryName);
    setFormTechnician(lab.technicianName);
    setFormNotes(lab.notes || '');

    setFormAttachmentUrl(lab.documentUrl);
    setFormAttachmentName(lab.documentName);
    setFormAttachmentSize(lab.documentSize);
    setFormAttachmentMime(lab.documentMimeType);

    setIsFormModalOpen(true);
  };

  // Handle Preset Selection in Form
  const handleApplyPreset = (preset: TestPreset) => {
    setFormTestType(preset.type);
    setFormTestName(preset.name);
    setFormLabFacility(preset.defaultFacility);
    setFormTechnician(preset.defaultTechnician);
    setFormUnits(preset.defaultUnits || '');
    setFormReferenceRange(preset.defaultRefRange || '');
    setFormResult(preset.defaultResult);
    setFormEvaluation(preset.defaultStatus === 'FLAGGED' ? 'CRITICAL' : preset.isAbnormal ? 'ABNORMAL' : 'NORMAL');
    setFormNotes(preset.defaultNotes);
    info(`Applied standard profile for "${preset.name}".`);
  };

  // File Upload Handling with FileReader for durable base64 persistence across navigation
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: 15MB
    if (file.size > 15 * 1024 * 1024) {
      toastError('File exceeds 15MB maximum size limit.');
      return;
    }

    const sizeFormatted =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setFormAttachmentUrl(dataUrl);
      setFormAttachmentName(file.name);
      setFormAttachmentSize(sizeFormatted);
      setFormAttachmentMime(file.type || 'application/octet-stream');
      success(`Attached laboratory report: "${file.name}" (${sizeFormatted}).`);
    };
    reader.onerror = () => {
      toastError('Failed to read selected file.');
    };
    reader.readAsDataURL(file);

    // Reset input value so re-selecting same file triggers change
    e.target.value = '';
  };

  const handleRemoveAttachment = () => {
    setFormAttachmentUrl(undefined);
    setFormAttachmentName(undefined);
    setFormAttachmentSize(undefined);
    setFormAttachmentMime(undefined);
    info('Report attachment removed from form.');
  };

  // Validate form fields
  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!formPatientId) errors.patientId = 'Patient is required';
    if (!formTestName.trim()) errors.testName = 'Test Name is required';
    if (!formPerformedDate) errors.performedDate = 'Test Date is required';
    if (!formResult.trim()) errors.result = 'Result / Value is required';
    if (!formLabFacility.trim()) errors.laboratoryName = 'Laboratory facility is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save / Update Handler
  const handleSaveLabResult = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toastError('Please fill in all required laboratory fields.');
      return;
    }

    setFormSubmitting(true);
    try {
      const targetPatient = patients.find((p) => p.id === formPatientId);
      const patientFullName = targetPatient
        ? `${targetPatient.firstName} ${targetPatient.lastName}`
        : 'Patient Record';

      const isAbnormal = formEvaluation === 'ABNORMAL' || formEvaluation === 'CRITICAL';
      const status: 'PENDING' | 'COMPLETED' | 'FLAGGED' =
        formEvaluation === 'PENDING'
          ? 'PENDING'
          : formEvaluation === 'CRITICAL'
          ? 'FLAGGED'
          : 'COMPLETED';

      const labPayload: Omit<LabResult, 'id' | 'reportedDate'> & { id?: string } = {
        id: editingRecordId || formStudyId || `lab_${Date.now().toString(36)}`,
        patientId: formPatientId,
        patientName: patientFullName,
        testType: formTestType,
        testName: formTestName.trim(),
        performedDate: formPerformedDate,
        result: formResult.trim(),
        isAbnormal,
        status,
        units: formUnits.trim() || undefined,
        referenceRange: formReferenceRange.trim() || undefined,
        laboratoryName: formLabFacility.trim(),
        technicianName: formTechnician.trim() || 'Laboratory Specialist',
        notes: formNotes.trim() || undefined,
        documentUrl: formAttachmentUrl,
        documentName: formAttachmentName,
        documentSize: formAttachmentSize,
        documentMimeType: formAttachmentMime,
        isDemoSimulation: true,
      };

      if (editingRecordId) {
        await labService.updateLabResult(editingRecordId, labPayload);
        success(`Laboratory record "${formTestName}" updated successfully.`);
      } else {
        await labService.addLabResult(labPayload);
        success(`Laboratory assay "${formTestName}" saved to patient dossier.`);
      }

      setIsFormModalOpen(false);
      await loadLabs();
    } catch {
      toastError('Failed to save laboratory record.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Delete Record Handlers
  const promptDeleteRecord = (lab: LabResult, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDeleteTarget({
      id: lab.id,
      testName: lab.testName,
      patientName: lab.patientName,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await labService.deleteLabResult(deleteTarget.id);
      success(`Laboratory assay "${deleteTarget.testName}" deleted successfully.`);
      setDeleteTarget(null);
      await loadLabs();
    } catch {
      toastError('Failed to delete laboratory assay.');
    }
  };

  // Download Attachment or Generated Report
  const handleDownloadAttachment = (lab: LabResult, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    if (lab.documentUrl) {
      const a = document.createElement('a');
      a.href = lab.documentUrl;
      a.download = lab.documentName || `Lab_Report_${lab.id}.pdf`;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      success(`Downloading attached report: ${lab.documentName || lab.id}`);
      return;
    }

    // If no direct file attached, generate a structured clinical PDF/text laboratory report
    const textContent = `========================================================
TBDetect AI — OFFICIAL CLINICAL LABORATORY REPORT
========================================================
Study ID: ${lab.id}
Patient Name: ${lab.patientName} (ID: ${lab.patientId})
Date Performed: ${lab.performedDate}
Reported Date: ${lab.reportedDate}
Laboratory: ${lab.laboratoryName}
Technician / Pathologist: ${lab.technicianName}

--------------------------------------------------------
DIAGNOSTIC TEST DETAILS
--------------------------------------------------------
Test Name: ${lab.testName}
Assay Type: ${lab.testType}
Clinical Result: ${lab.result}
Evaluation Flag: ${lab.isAbnormal ? 'ABNORMAL / PATHOLOGICAL' : 'NORMAL / NEGATIVE'}
Status: ${lab.status}
Units: ${lab.units || 'N/A'}
Reference Range: ${lab.referenceRange || 'N/A'}

--------------------------------------------------------
LABORATORY & CLINICAL NOTES
--------------------------------------------------------
${lab.notes || 'Routine diagnostic verification completed according to national microbiology protocols.'}

========================================================
Notice: This document is an automated electronic clinical record 
generated for patient medical dossiers in TBDetect AI.
========================================================`;

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Lab_Report_${lab.patientId}_${lab.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    success('Generated laboratory clinical summary downloaded.');
  };

  // Filtered List
  const filteredLabs = patientLabs.filter((l) => {
    const matchesSearch =
      (l.patientName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.testName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.result || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.laboratoryName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.id || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = testTypeFilter === 'ALL' || l.testType === testTypeFilter;

    let matchesStatus = true;
    if (statusFilter === 'ABNORMAL') matchesStatus = l.isAbnormal && l.status !== 'FLAGGED';
    else if (statusFilter === 'FLAGGED') matchesStatus = l.status === 'FLAGGED';
    else if (statusFilter === 'NORMAL') matchesStatus = !l.isAbnormal && l.status === 'COMPLETED';
    else if (statusFilter === 'PENDING') matchesStatus = l.status === 'PENDING';

    return matchesSearch && matchesType && matchesStatus;
  });

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  return (
    <div className="space-y-6 pb-16">
      {/* Hidden file input for report attachment */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.webp"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {t.labs.title}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200">
              {viewScope === 'PATIENT_ONLY'
                ? `${patientLabs.length} Assays for ${selectedPatient?.firstName || 'Patient'}`
                : `${allLabsCount} Clinic Assays`}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">{t.labs.subtitle}</p>
        </div>

        {/* Action Buttons & Patient Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-2xl">
            <UserIcon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <label className="text-xs font-bold text-slate-600">Active Patient:</label>
            <select
              value={selectedPatientId}
              onChange={(e) => handlePatientSelectChange(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-900 outline-none cursor-pointer"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName} ({p.nationalId})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => handleOpenCreateModal()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-500/20 transition-all self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>{t.labs.addLabBtn}</span>
          </button>
        </div>
      </div>

      <MedicalDisclaimer variant="compact" />

      {/* Patient-Bound Laboratory Safety & Transparency Banner */}
      <div className="p-3.5 bg-gradient-to-r from-purple-50/90 via-indigo-50/70 to-slate-50 border border-purple-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-purple-950">
          <FlaskConical className="w-4 h-4 text-purple-600 shrink-0" />
          <span>
            <strong>Patient-Bound Laboratory Dossier:</strong> All diagnostic records, molecular assays (GeneXpert/PCR), and report attachments are tied strictly to{' '}
            <strong>
              {selectedPatient?.firstName} {selectedPatient?.lastName} ({selectedPatient?.nationalId})
            </strong>
            .
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Scope Toggle: Patient vs All */}
          <div className="flex items-center bg-white border border-purple-200 rounded-xl p-0.5 text-[11px] font-bold">
            <button
              onClick={() => setViewScope('PATIENT_ONLY')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                viewScope === 'PATIENT_ONLY'
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Patient Only ({selectedPatient?.firstName})
            </button>
            <button
              onClick={() => setViewScope('ALL_PATIENTS')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                viewScope === 'ALL_PATIENTS'
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Clinic Records ({allLabsCount})
            </button>
          </div>
        </div>
      </div>

      {/* Quick Diagnostic Presets Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            Quick Add Standard Diagnostic Assays:
          </span>
          <span className="text-[10px] text-slate-400 font-mono">WHO / National Guidelines</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {TEST_PRESETS.slice(0, 6).map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handleOpenCreateModal(preset)}
              className="px-3 py-1.5 bg-slate-50 hover:bg-purple-50 hover:border-purple-300 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:text-purple-900 transition-all flex items-center gap-1.5 group"
            >
              <Plus className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600" />
              <span>{preset.name.split(' (')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Search & Filter Strip */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[260px]">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by test, result, facility, study ID, or patient..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-purple-600 outline-none"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <select
            value={testTypeFilter}
            onChange={(e) => setTestTypeFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white outline-none"
          >
            <option value="ALL">All Diagnostic Assays</option>
            <option value="GENEXPERT_MTB">GeneXpert MTB/RIF</option>
            <option value="SPUTUM_SMEAR">Sputum Smear (AFB)</option>
            <option value="CULTURE">Mycobacterial Culture</option>
            <option value="IGRA">QuantiFERON IGRA</option>
            <option value="CBC">Complete Blood Count (CBC)</option>
            <option value="CRP">C-Reactive Protein (CRP)</option>
            <option value="ESR">ESR Westergren</option>
            <option value="LFT">Liver Function (LFT)</option>
            <option value="URINE_LAM">Urine TB-LAM</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="FLAGGED">Critical / Flagged</option>
            <option value="ABNORMAL">Abnormal</option>
            <option value="NORMAL">Normal / Negative</option>
            <option value="PENDING">Pending Analysis</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadLabs()}
            className="p-2 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
            title="Refresh laboratory records"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Lab Results Table & List */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-purple-600 animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-600">Loading laboratory assays...</p>
          </div>
        ) : filteredLabs.length === 0 ? (
          <div className="py-16 px-6 text-center space-y-4 max-w-md mx-auto">
            <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-3xl flex items-center justify-center mx-auto border border-purple-100">
              <FlaskConical className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {searchQuery || testTypeFilter !== 'ALL' || statusFilter !== 'ALL'
                  ? 'No matching laboratory records found'
                  : viewScope === 'PATIENT_ONLY'
                  ? `No lab assays recorded for ${selectedPatient?.firstName} ${selectedPatient?.lastName}`
                  : 'No laboratory assays recorded'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {viewScope === 'PATIENT_ONLY'
                  ? 'Add a GeneXpert molecular assay, sputum smear microscopy, or blood panel for this patient.'
                  : 'Start recording diagnostic assays or upload laboratory reports to the clinic system.'}
              </p>
            </div>
            <button
              onClick={() => handleOpenCreateModal()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Record First Assay for {selectedPatient?.firstName || 'Patient'}</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3.5 pl-6">{t.labs.table.test}</th>
                  <th className="py-3.5">{t.labs.table.patient}</th>
                  <th className="py-3.5">{t.labs.table.result}</th>
                  <th className="py-3.5">{t.labs.table.date}</th>
                  <th className="py-3.5">{t.labs.table.lab}</th>
                  <th className="py-3.5">Report / Attachment</th>
                  <th className="py-3.5">Status</th>
                  <th className="py-3.5 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredLabs.map((l) => (
                  <tr
                    key={l.id}
                    className="hover:bg-purple-50/20 transition-colors group"
                  >
                    {/* Test Info */}
                    <td className="py-4 pl-6">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{l.testName}</span>
                          {l.isDemoSimulation && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              DEMO
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                          <span>ID: {l.id}</span>
                          <span>•</span>
                          <span>{l.testType}</span>
                        </div>
                      </div>
                    </td>

                    {/* Patient */}
                    <td className="py-4">
                      <div
                        onClick={() => onSelectPatient && onSelectPatient(l.patientId)}
                        className="cursor-pointer hover:text-purple-600 transition-colors"
                      >
                        <span className="font-bold text-slate-900 block">{l.patientName}</span>
                        <span className="text-[10px] font-mono text-slate-400">ID: {l.patientId}</span>
                      </div>
                    </td>

                    {/* Result */}
                    <td className="py-4 max-w-xs">
                      <div className="space-y-1">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-lg font-mono font-bold text-xs ${
                            l.status === 'FLAGGED'
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : l.isAbnormal
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : l.status === 'PENDING'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {l.result}
                        </span>

                        {(l.units || l.referenceRange) && (
                          <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2">
                            {l.units && <span>Units: {l.units}</span>}
                            {l.referenceRange && <span>Ref: {l.referenceRange}</span>}
                          </div>
                        )}

                        {l.notes && (
                          <p className="text-[11px] text-slate-500 italic line-clamp-1">{l.notes}</p>
                        )}
                      </div>
                    </td>

                    {/* Date */}
                    <td className="py-4 font-mono text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{l.performedDate}</span>
                      </div>
                    </td>

                    {/* Laboratory Center */}
                    <td className="py-4 text-slate-600">
                      <div className="space-y-0.5">
                        <span className="block font-medium text-slate-800 line-clamp-1">
                          {l.laboratoryName}
                        </span>
                        <span className="block text-[10px] text-slate-400 line-clamp-1">
                          {l.technicianName}
                        </span>
                      </div>
                    </td>

                    {/* Report Attachment */}
                    <td className="py-4">
                      {l.documentUrl || l.documentName ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewDoc({
                                url: l.documentUrl || '',
                                name: l.documentName || `Lab_Report_${l.id}`,
                                mime: l.documentMimeType,
                                testName: l.testName,
                                patientName: l.patientName,
                                date: l.performedDate,
                                result: l.result,
                              });
                            }}
                            className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1"
                            title="Preview attached document"
                          >
                            <Eye className="w-3 h-3" />
                            <span className="truncate max-w-[100px]">
                              {l.documentName ? l.documentName.split('.').slice(0, -1).join('.') : 'Report'}
                            </span>
                          </button>

                          <button
                            onClick={(e) => handleDownloadAttachment(l, e)}
                            className="p-1 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Download attachment"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => handleDownloadAttachment(l, e)}
                          className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-[10px] font-semibold transition-colors flex items-center gap-1"
                          title="Generate text report"
                        >
                          <Download className="w-3 h-3 text-slate-400" />
                          <span>Report Summary</span>
                        </button>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-4">
                      {l.status === 'FLAGGED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          Critical Flag
                        </span>
                      ) : l.isAbnormal ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-rose-50 text-rose-700 border border-rose-200">
                          <AlertCircle className="w-3 h-3 text-rose-500" />
                          Abnormal
                        </span>
                      ) : l.status === 'PENDING' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-500" />
                          Pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Normal
                        </span>
                      )}
                    </td>

                    {/* Row Actions */}
                    <td className="py-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEditModal(l)}
                          className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Edit this laboratory record"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => promptDeleteRecord(l, e)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record / Edit Laboratory Assay Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <FlaskConical className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingRecordId ? 'Edit Laboratory Diagnostic Record' : t.labs.addModal.title}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Study ID: {formStudyId || 'auto-generated'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Profile Selector for Modal */}
            {!editingRecordId && (
              <div className="p-3 bg-purple-50/60 border border-purple-200/80 rounded-2xl space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-900 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-600" />
                  Apply Clinical Test Profile:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {TEST_PRESETS.slice(0, 5).map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyPreset(p)}
                      className="px-2 py-1 bg-white hover:bg-purple-100/80 text-purple-900 border border-purple-200 rounded-lg text-[10px] font-bold transition-colors"
                    >
                      {p.name.split(' (')[0]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSaveLabResult} className="space-y-4 text-xs">
              {/* Row 1: Patient & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {t.labs.addModal.selectPatient} *
                  </label>
                  <select
                    value={formPatientId}
                    onChange={(e) => setFormPatientId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-purple-600 outline-none"
                  >
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.firstName} {p.lastName} ({p.nationalId})
                      </option>
                    ))}
                  </select>
                  {formErrors.patientId && (
                    <p className="text-[10px] text-rose-600 mt-0.5">{formErrors.patientId}</p>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {t.labs.addModal.date} *
                  </label>
                  <input
                    type="date"
                    required
                    value={formPerformedDate}
                    onChange={(e) => setFormPerformedDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-purple-600 outline-none"
                  />
                  {formErrors.performedDate && (
                    <p className="text-[10px] text-rose-600 mt-0.5">{formErrors.performedDate}</p>
                  )}
                </div>
              </div>

              {/* Row 2: Test Type & Test Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {t.labs.addModal.testType} *
                  </label>
                  <select
                    value={formTestType}
                    onChange={(e) => {
                      const newType = e.target.value as TestType;
                      setFormTestType(newType);
                      const matching = TEST_PRESETS.find((p) => p.type === newType);
                      if (matching) {
                        setFormTestName(matching.name);
                        setFormUnits(matching.defaultUnits || '');
                        setFormReferenceRange(matching.defaultRefRange || '');
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-purple-600 outline-none"
                  >
                    <option value="GENEXPERT_MTB">GeneXpert MTB/RIF Ultra</option>
                    <option value="SPUTUM_SMEAR">Sputum Smear Microscopy (AFB)</option>
                    <option value="CULTURE">Mycobacterial Culture & DST</option>
                    <option value="IGRA">QuantiFERON IGRA (IFN-γ)</option>
                    <option value="CBC">Complete Blood Count (CBC)</option>
                    <option value="CRP">C-Reactive Protein (CRP)</option>
                    <option value="ESR">ESR (Westergren Method)</option>
                    <option value="LFT">Liver Function Panel (LFT)</option>
                    <option value="URINE_LAM">Urine Lipoarabinomannan (LAM)</option>
                    <option value="OTHER">Other Laboratory Assay</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {t.labs.addModal.testName} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTestName}
                    onChange={(e) => setFormTestName(e.target.value)}
                    placeholder="e.g. GeneXpert MTB/RIF Ultra Molecular Assay"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-purple-600 outline-none"
                  />
                  {formErrors.testName && (
                    <p className="text-[10px] text-rose-600 mt-0.5">{formErrors.testName}</p>
                  )}
                </div>
              </div>

              {/* Row 3: Result Description */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {t.labs.addModal.resultText} *
                </label>
                <textarea
                  required
                  rows={2}
                  value={formResult}
                  onChange={(e) => setFormResult(e.target.value)}
                  placeholder="e.g. MTB DETECTED (High Load); RIFAMPICIN RESISTANCE NOT DETECTED"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-900 focus:bg-white focus:border-purple-600 outline-none"
                />
                {formErrors.result && (
                  <p className="text-[10px] text-rose-600 mt-0.5">{formErrors.result}</p>
                )}
              </div>

              {/* Row 4: Units, Reference Range & Evaluation Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Units (Optional)</label>
                  <input
                    type="text"
                    value={formUnits}
                    onChange={(e) => setFormUnits(e.target.value)}
                    placeholder="e.g. mg/L, mm/hr, CFU/mL"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Reference Range</label>
                  <input
                    type="text"
                    value={formReferenceRange}
                    onChange={(e) => setFormReferenceRange(e.target.value)}
                    placeholder="e.g. < 5.0 mg/L or Not Detected"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status / Severity *</label>
                  <select
                    value={formEvaluation}
                    onChange={(e) =>
                      setFormEvaluation(
                        e.target.value as 'NORMAL' | 'ABNORMAL' | 'CRITICAL' | 'PENDING'
                      )
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white outline-none"
                  >
                    <option value="NORMAL">Normal / Negative</option>
                    <option value="ABNORMAL">Abnormal / Pathological</option>
                    <option value="CRITICAL">Critical Flag / Action Required</option>
                    <option value="PENDING">Pending Final Validation</option>
                  </select>
                </div>
              </div>

              {/* Row 5: Facility & Technician */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {t.labs.addModal.labName} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formLabFacility}
                    onChange={(e) => setFormLabFacility(e.target.value)}
                    placeholder="e.g. Central Reference TB Lab Tashkent"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {t.labs.addModal.technician}
                  </label>
                  <input
                    type="text"
                    value={formTechnician}
                    onChange={(e) => setFormTechnician(e.target.value)}
                    placeholder="e.g. Dr. Mansur Zokirov, Pathologist"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white outline-none"
                  />
                </div>
              </div>

              {/* Row 6: Report File Attachment Section */}
              <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-purple-600" />
                    <span>Laboratory Report Document / Image Attachment:</span>
                  </label>
                  <span className="text-[10px] text-slate-400">PDF, JPG, PNG up to 15MB</span>
                </div>

                {formAttachmentName ? (
                  <div className="p-3 bg-white rounded-xl border border-purple-200 flex items-center justify-between gap-2 shadow-2xs">
                    <div className="flex items-center gap-2 min-w-0">
                      {formAttachmentMime?.includes('image') ? (
                        <FileImage className="w-5 h-5 text-purple-600 shrink-0" />
                      ) : (
                        <Paperclip className="w-5 h-5 text-purple-600 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {formAttachmentName}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {formAttachmentSize} • {formAttachmentMime}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition-colors"
                      >
                        Replace
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveAttachment}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Remove attachment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-3 bg-white hover:bg-purple-50/50 border border-dashed border-slate-300 hover:border-purple-400 rounded-xl text-xs font-semibold text-slate-600 hover:text-purple-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Upload className="w-4 h-4 text-purple-600" />
                    <span>Click to Upload Laboratory PDF Report or Micrograph Image</span>
                  </button>
                )}
              </div>

              {/* Row 7: Clinical Notes */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {t.labs.addModal.notes}
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Clinical interpretations, mutation details, or therapeutic monitoring instructions..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-purple-600 outline-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-bold shadow-md shadow-purple-500/20 flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  {formSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving Record...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{editingRecordId ? 'Update Record' : t.labs.addModal.submit}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">{previewDoc.testName}</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 font-mono">
                    Report Preview
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Patient: {previewDoc.patientName || 'Patient'} • Date: {previewDoc.date}
                </p>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Content Box */}
            <div className="flex-1 min-h-[300px] max-h-[500px] overflow-auto bg-slate-950 rounded-2xl p-4 flex items-center justify-center border border-slate-800">
              {previewDoc.url && (previewDoc.mime?.includes('image') || previewDoc.url.startsWith('data:image') || previewDoc.url.includes('images.unsplash') || /\.(png|jpg|jpeg|webp)$/i.test(previewDoc.name)) ? (
                <img
                  src={previewDoc.url}
                  alt={previewDoc.name}
                  className="max-h-[460px] max-w-full object-contain rounded-lg shadow-lg"
                />
              ) : (
                <div className="text-center p-8 space-y-3 bg-slate-900 rounded-xl border border-slate-800 max-w-md">
                  <Paperclip className="w-12 h-12 text-purple-400 mx-auto" />
                  <div>
                    <h4 className="text-sm font-bold text-white">{previewDoc.name}</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Result: <span className="text-rose-400 font-mono font-bold">{previewDoc.result}</span>
                    </p>
                  </div>
                  <p className="text-xs text-slate-500 font-mono">
                    PDF / Clinical Document Ready for Download & Printing
                  </p>
                </div>
              )}
            </div>

            {/* Document Preview Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-500 font-mono">{previewDoc.name}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = previewDoc.url;
                    a.download = previewDoc.name;
                    a.target = '_blank';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    success(`Downloading ${previewDoc.name}`);
                  }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Report</span>
                </button>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Delete Laboratory Record?</h3>
                <p className="text-xs text-slate-500 font-mono">ID: {deleteTarget.id}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete the laboratory assay record{' '}
              <strong>"{deleteTarget.testName}"</strong> for <strong>{deleteTarget.patientName || 'Patient'}</strong>?
              This record will be removed from the patient's diagnostic history.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
