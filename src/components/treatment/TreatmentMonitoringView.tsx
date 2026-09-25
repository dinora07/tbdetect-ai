import React, { useState, useEffect, useMemo } from 'react';
import {
  HeartPulse,
  Pill,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Scale,
  TrendingUp,
  X,
  Plus,
  Clock,
  User,
  Building2,
  FileText,
  Edit2,
  Trash2,
  Activity,
  Check,
  AlertCircle,
  ShieldAlert,
  ArrowRight,
  ChevronRight,
  History,
  MessageSquare,
  Sparkles,
  Info,
  Layers,
  Search,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  TreatmentPlan,
  Patient,
  DailyDoseRecord,
  SideEffectRecord,
  DoseStatus,
  SideEffectSeverity,
  SideEffectStatus,
  TimelineEvent,
  MedicationItem,
} from '../../types';
import {
  treatmentService,
  patientService,
  timelineService,
} from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface TreatmentMonitoringViewProps {
  initialPatientId?: string;
  onSelectPatient?: (patientId: string) => void;
}

// WHO Standard Regimen Presets
const WHO_REGIMEN_PRESETS = [
  {
    name: 'WHO Standard First-Line: 2HRZE / 4HR',
    phase: 'INTENSIVE_PHASE' as const,
    durationMonths: 6,
    medications: [
      {
        name: 'Rifampicin (R) + Isoniazid (H) + Pyrazinamide (Z) + Ethambutol (E) 4-FDC',
        dosage: '150mg/75mg/400mg/275mg (4 tablets daily)',
        frequency: 'Once daily morning (Directly Observed)',
        notes: 'Take on empty stomach with full glass of water. Monitor baseline hepatic panel (ALT/AST).',
      },
      {
        name: 'Pyridoxine (Vitamin B6)',
        dosage: '50 mg once daily',
        frequency: 'Once daily with morning dose',
        notes: 'Peripheral neuropathy prophylaxis.',
      },
    ],
    notes: 'Standard 6-month regimen for drug-susceptible pulmonary tuberculosis under DOTS guidelines.',
  },
  {
    name: 'WHO Continuation Phase: 4HR (2-FDC)',
    phase: 'CONTINUATION_PHASE' as const,
    durationMonths: 4,
    medications: [
      {
        name: 'Rifampicin + Isoniazid (2-FDC HR)',
        dosage: '150mg/75mg (3 tablets daily)',
        frequency: 'Once daily (Directly Observed / Weekly blister count)',
        notes: 'Initiated following 2-month intensive phase sputum smear conversion to negative.',
      },
      {
        name: 'Pyridoxine (Vitamin B6)',
        dosage: '25 mg once daily',
        frequency: 'Daily',
        notes: 'Neuropathy prevention.',
      },
    ],
    notes: 'Continuation phase for fully drug-susceptible TB following culture/smear conversion.',
  },
  {
    name: 'WHO All-Oral BPaLM Regimen (6-Month MDR-TB)',
    phase: 'INTENSIVE_PHASE' as const,
    durationMonths: 6,
    medications: [
      {
        name: 'Bedaquiline (B) + Pretomanid (Pa) + Linezolid (L) + Moxifloxacin (M)',
        dosage: 'Bedaquiline 400mg, Pretomanid 200mg, Linezolid 600mg, Moxifloxacin 400mg',
        frequency: 'Daily observed ingestion under specialist supervision',
        notes: 'Strict ECG QTc interval monitoring and complete blood count (CBC) surveillance weekly.',
      },
    ],
    notes: 'WHO guideline all-oral shortened regimen for confirmed Rifampicin-Resistant or Multidrug-Resistant TB (MDR/RR-TB).',
  },
];

export const TreatmentMonitoringView: React.FC<TreatmentMonitoringViewProps> = ({
  initialPatientId,
  onSelectPatient,
}) => {
  const { t } = useLanguage();
  const { isDoctor, user } = useAuth();
  const { success, error: toastError, info } = useToast();

  // Primary Data State
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [treatmentPlan, setTreatmentPlan] = useState<TreatmentPlan | null>(null);
  const [allTreatments, setAllTreatments] = useState<TreatmentPlan[]>([]);
  const [patientTimeline, setPatientTimeline] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // View Controls
  const [viewMode, setViewMode] = useState<'PATIENT_DETAIL' | 'COHORT_OVERVIEW'>('PATIENT_DETAIL');
  const [doseFilter, setDoseFilter] = useState<'ALL' | 'MISSED' | 'TAKEN'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals State
  const [isPlanModalOpen, setIsPlanModalOpen] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [isLogDoseModalOpen, setIsLogDoseModalOpen] = useState<boolean>(false);
  const [isSideEffectModalOpen, setIsSideEffectModalOpen] = useState<boolean>(false);
  const [isMissedNoteModalOpen, setIsMissedNoteModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [selectedDoseForNote, setSelectedDoseForNote] = useState<DailyDoseRecord | null>(null);

  // Form States - Treatment Plan
  const [formRegimenName, setFormRegimenName] = useState<string>('');
  const [formStartDate, setFormStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formDurationMonths, setFormDurationMonths] = useState<number>(6);
  const [formEndDate, setFormEndDate] = useState<string>('');
  const [formPhase, setFormPhase] = useState<'INTENSIVE_PHASE' | 'CONTINUATION_PHASE' | 'MAINTENANCE'>('INTENSIVE_PHASE');
  const [formStatus, setFormStatus] = useState<TreatmentPlan['status']>('ACTIVE');
  const [formDoctor, setFormDoctor] = useState<string>('Dr. Sarah Chen, MD');
  const [formFacility, setFormFacility] = useState<string>('National Center of Tuberculosis & Pulmonology');
  const [formNotes, setFormNotes] = useState<string>('');
  const [formMedications, setFormMedications] = useState<MedicationItem[]>([
    {
      name: 'Rifampicin + Isoniazid + Pyrazinamide + Ethambutol 4-FDC',
      dosage: '150mg/75mg/400mg/275mg (4 tablets)',
      frequency: 'Once daily morning',
      notes: 'Take with water on empty stomach',
    },
  ]);

  // Form States - Dose Log
  const [doseDate, setDoseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [doseMedName, setDoseMedName] = useState<string>('');
  const [doseStatus, setDoseStatus] = useState<DoseStatus>('TAKEN');
  const [dosePatientNote, setDosePatientNote] = useState<string>('');
  const [doseDoctorNote, setDoseDoctorNote] = useState<string>('');

  // Form States - Side Effect
  const [seSymptom, setSeSymptom] = useState<string>('');
  const [seSeverity, setSeSeverity] = useState<SideEffectSeverity>('MILD');
  const [seDate, setSeDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [seNotes, setSeNotes] = useState<string>('');
  const [seStatus, setSeStatus] = useState<SideEffectStatus>('REPORTED');
  const [seDoctorNote, setSeDoctorNote] = useState<string>('');

  // Form States - Missed Dose Note
  const [doctorMissedNoteText, setDoctorMissedNoteText] = useState<string>('');

  // Form Submitting indicator
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Initialize and Load Data
  useEffect(() => {
    loadPatients();
  }, []);

  // When patients loaded or initialPatientId changes
  useEffect(() => {
    if (patients.length > 0) {
      if (initialPatientId && patients.some((p) => p.id === initialPatientId)) {
        setSelectedPatientId(initialPatientId);
      } else if (!selectedPatientId) {
        setSelectedPatientId(patients[0].id);
      }
    }
  }, [patients, initialPatientId]);

  // When active patient changes, enforce patient isolation and reload patient-specific treatment data
  useEffect(() => {
    if (selectedPatientId) {
      loadPatientTreatmentData(selectedPatientId);
    }
  }, [selectedPatientId]);

  // Auto calculate end date when start date or duration changes in plan form
  useEffect(() => {
    if (formStartDate && formDurationMonths) {
      try {
        const start = new Date(formStartDate);
        const end = new Date(start);
        end.setMonth(start.getMonth() + Number(formDurationMonths));
        setFormEndDate(end.toISOString().split('T')[0]);
      } catch {
        // ignore date error
      }
    }
  }, [formStartDate, formDurationMonths]);

  const loadPatients = async () => {
    setIsLoading(true);
    try {
      const pts = await patientService.getPatients();
      setPatients(pts);
      const allTx = await treatmentService.getAllTreatments();
      setAllTreatments(allTx);
    } catch (err) {
      toastError('Failed to load patient records.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPatientTreatmentData = async (pId: string) => {
    setIsLoading(true);
    try {
      const [tx, timeline, allTx] = await Promise.all([
        treatmentService.getTreatmentByPatientId(pId),
        timelineService.getTimelineByPatientId(pId),
        treatmentService.getAllTreatments(),
      ]);
      setTreatmentPlan(tx || null);
      setPatientTimeline(timeline || []);
      setAllTreatments(allTx || []);
    } catch (err) {
      toastError('Failed to load treatment plan for patient.');
    } finally {
      setIsLoading(false);
    }
  };

  const activePatient = useMemo(() => {
    return patients.find((p) => p.id === selectedPatientId) || null;
  }, [patients, selectedPatientId]);

  // Derived Treatment Metrics
  const treatmentMetrics = useMemo(() => {
    if (!treatmentPlan) return null;

    const startDate = new Date(treatmentPlan.startDate);
    const today = new Date();
    const endDate = new Date(treatmentPlan.estimatedEndDate);

    const msPerDay = 1000 * 60 * 60 * 24;
    const daysCompleted = Math.max(0, Math.floor((today.getTime() - startDate.getTime()) / msPerDay));
    const totalDaysPlanned = Math.max(1, Math.floor((endDate.getTime() - startDate.getTime()) / msPerDay));
    const daysRemaining = Math.max(0, Math.floor((endDate.getTime() - today.getTime()) / msPerDay));
    const progressPercent = Math.min(100, Math.round((daysCompleted / totalDaysPlanned) * 100));

    const doseLogs = treatmentPlan.doseLogs || [];
    const missedDosesList = doseLogs.filter((d) => d.status === 'MISSED' || d.status === 'SKIPPED');
    const takenDosesList = doseLogs.filter((d) => d.status === 'TAKEN');

    const totalDosesLogged = doseLogs.length;
    const adherence = totalDosesLogged > 0
      ? Math.min(100, Math.round((takenDosesList.length / totalDosesLogged) * 1000) / 10)
      : treatmentPlan.adherenceRate || 100;

    const sideEffects = treatmentPlan.sideEffects || [];
    const activeSideEffects = sideEffects.filter((se) => se.status !== 'RESOLVED');

    return {
      daysCompleted,
      daysRemaining,
      totalDaysPlanned,
      progressPercent,
      missedDosesList,
      takenDosesList,
      adherence,
      activeSideEffects,
      totalSideEffects: sideEffects.length,
    };
  }, [treatmentPlan]);

  // Filtered dose logs for patient
  const filteredDoseLogs = useMemo(() => {
    if (!treatmentPlan || !treatmentPlan.doseLogs) return [];
    let list = treatmentPlan.doseLogs;
    if (doseFilter === 'MISSED') {
      list = list.filter((d) => d.status === 'MISSED' || d.status === 'SKIPPED');
    } else if (doseFilter === 'TAKEN') {
      list = list.filter((d) => d.status === 'TAKEN');
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (d) =>
          d.medicationName.toLowerCase().includes(q) ||
          d.date.includes(q) ||
          (d.patientNote && d.patientNote.toLowerCase().includes(q)) ||
          (d.doctorNote && d.doctorNote.toLowerCase().includes(q))
      );
    }
    return list;
  }, [treatmentPlan, doseFilter, searchQuery]);

  // Treatment timeline events
  const treatmentTimelineEvents = useMemo(() => {
    return patientTimeline.filter((ev) =>
      [
        'TREATMENT_STARTED',
        'DOSE_TAKEN',
        'DOSE_MISSED',
        'SIDE_EFFECT_REPORTED',
        'DOCTOR_NOTE',
        'PHASE_CHANGED',
        'TREATMENT_COMPLETED',
        'MEDICATION_MILESTONE',
      ].includes(ev.type)
    );
  }, [patientTimeline]);

  // Open Create Plan Modal
  const handleOpenCreatePlan = () => {
    if (!activePatient) {
      toastError('Please select a patient first.');
      return;
    }
    setIsEditMode(false);
    setFormRegimenName('WHO Standard First-Line: 2HRZE / 4HR');
    setFormStartDate(new Date().toISOString().split('T')[0]);
    setFormDurationMonths(6);
    setFormPhase('INTENSIVE_PHASE');
    setFormStatus('ACTIVE');
    setFormDoctor(user?.name ? `Dr. ${user.name}` : 'Dr. Sarah Chen, MD');
    setFormFacility('National Center of Tuberculosis & Pulmonology');
    setFormNotes('Initiated under Directly Observed Therapy (DOTS) intensive phase.');
    setFormMedications([
      {
        name: 'Rifampicin (R) + Isoniazid (H) + Pyrazinamide (Z) + Ethambutol (E) 4-FDC',
        dosage: '150mg/75mg/400mg/275mg (4 tablets daily)',
        frequency: 'Once daily morning (Directly Observed)',
        notes: 'Take on empty stomach with water. Monitor liver function enzymes.',
      },
      {
        name: 'Pyridoxine (Vitamin B6)',
        dosage: '50 mg once daily',
        frequency: 'Daily',
        notes: 'Peripheral neuropathy prophylaxis.',
      },
    ]);
    setIsPlanModalOpen(true);
  };

  // Open Edit Plan Modal
  const handleOpenEditPlan = () => {
    if (!treatmentPlan) return;
    setIsEditMode(true);
    setFormRegimenName(treatmentPlan.regimenName);
    setFormStartDate(treatmentPlan.startDate);
    setFormDurationMonths(treatmentPlan.plannedDurationMonths || 6);
    setFormEndDate(treatmentPlan.estimatedEndDate);
    setFormPhase(treatmentPlan.currentPhase);
    setFormStatus(treatmentPlan.status);
    setFormDoctor(treatmentPlan.supervisingDoctor);
    setFormFacility(treatmentPlan.facility || 'Clinical Facility');
    setFormNotes(treatmentPlan.notes || '');
    setFormMedications(
      treatmentPlan.medications && treatmentPlan.medications.length > 0
        ? treatmentPlan.medications
        : [
            {
              name: 'Standard TB Regimen Medication',
              dosage: 'Standard dose',
              frequency: 'Daily',
              notes: '',
            },
          ]
    );
    setIsPlanModalOpen(true);
  };

  // Apply Regimen Preset
  const handleApplyPreset = (presetIndex: number) => {
    const preset = WHO_REGIMEN_PRESETS[presetIndex];
    if (!preset) return;
    setFormRegimenName(preset.name);
    setFormPhase(preset.phase);
    setFormDurationMonths(preset.durationMonths);
    setFormNotes(preset.notes);
    setFormMedications([...preset.medications]);
    info(`Applied standard profile: "${preset.name}".`);
  };

  // Add Medication Row
  const handleAddMedicationRow = () => {
    setFormMedications([
      ...formMedications,
      { name: '', dosage: '', frequency: 'Once daily', notes: '' },
    ]);
  };

  // Update Medication Row
  const handleUpdateMedicationRow = (
    index: number,
    field: keyof MedicationItem,
    value: string
  ) => {
    const updated = [...formMedications];
    updated[index] = { ...updated[index], [field]: value };
    setFormMedications(updated);
  };

  // Remove Medication Row
  const handleRemoveMedicationRow = (index: number) => {
    if (formMedications.length <= 1) {
      toastError('At least one medication is required in a treatment regimen.');
      return;
    }
    setFormMedications(formMedications.filter((_, i) => i !== index));
  };

  // Save Treatment Plan (Create / Update)
  const handleSaveTreatmentPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePatient) {
      toastError('No active patient selected.');
      return;
    }

    if (!formRegimenName.trim()) {
      toastError('Regimen name is required.');
      return;
    }

    if (!formStartDate) {
      toastError('Start date is required.');
      return;
    }

    // Filter valid medications
    const validMeds = formMedications.filter((m) => m.name.trim().length > 0);
    if (validMeds.length === 0) {
      toastError('Please provide at least one medication name.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditMode && treatmentPlan) {
        const updated = await treatmentService.updateTreatmentPlan(treatmentPlan.id, {
          regimenName: formRegimenName,
          startDate: formStartDate,
          plannedDurationMonths: Number(formDurationMonths),
          estimatedEndDate: formEndDate,
          currentPhase: formPhase,
          status: formStatus,
          supervisingDoctor: formDoctor,
          facility: formFacility,
          notes: formNotes,
          medications: validMeds,
        });
        if (updated) {
          success(`Updated treatment plan for ${activePatient.firstName} ${activePatient.lastName}.`);
          setTreatmentPlan(updated);
        }
      } else {
        const newPlan = await treatmentService.createTreatmentPlan({
          patientId: activePatient.id,
          patientName: `${activePatient.firstName} ${activePatient.lastName}`,
          regimenName: formRegimenName,
          startDate: formStartDate,
          plannedDurationMonths: Number(formDurationMonths),
          estimatedEndDate: formEndDate,
          currentPhase: formPhase,
          status: formStatus,
          adherenceRate: 100,
          dosesPrescribed: formDurationMonths * 30,
          dosesTaken: 0,
          missedDoses: 0,
          supervisingDoctor: formDoctor,
          facility: formFacility,
          notes: formNotes,
          medications: validMeds,
          isDemoSimulation: true,
        });
        success(`Enrolled ${activePatient.firstName} ${activePatient.lastName} in DOTS treatment plan.`);
        setTreatmentPlan(newPlan);
      }

      // Reload timeline and treatments
      const [tl, allTx] = await Promise.all([
        timelineService.getTimelineByPatientId(activePatient.id),
        treatmentService.getAllTreatments(),
      ]);
      setPatientTimeline(tl);
      setAllTreatments(allTx);
      setIsPlanModalOpen(false);
    } catch (err) {
      toastError('Failed to save treatment plan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Treatment Plan
  const handleDeleteTreatmentPlan = async () => {
    if (!treatmentPlan) return;
    setIsSubmitting(true);
    try {
      const planId = treatmentPlan.id;
      const patientName = activePatient ? `${activePatient.firstName} ${activePatient.lastName}` : 'Patient';
      const ok = await treatmentService.deleteTreatmentPlan(planId);
      if (ok) {
        success(`Deleted treatment plan ${planId} for ${patientName}. Patient record preserved.`);
        setTreatmentPlan(null);
        setIsDeleteModalOpen(false);
        const allTx = await treatmentService.getAllTreatments();
        setAllTreatments(allTx);
      } else {
        toastError('Failed to delete treatment plan.');
      }
    } catch (err) {
      toastError('Error during deletion.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Log Dose Modal
  const handleOpenLogDose = () => {
    if (!treatmentPlan) {
      toastError('Please create a treatment plan before logging doses.');
      return;
    }
    const defaultMed = treatmentPlan.medications[0]?.name || 'Standard 4-FDC';
    setDoseDate(new Date().toISOString().split('T')[0]);
    setDoseMedName(defaultMed);
    setDoseStatus('TAKEN');
    setDosePatientNote('');
    setDoseDoctorNote('');
    setIsLogDoseModalOpen(true);
  };

  // Save Daily Dose Log
  const handleSaveDoseLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!treatmentPlan || !activePatient) return;

    if (!doseMedName.trim()) {
      toastError('Medication name is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await treatmentService.logDailyDose(treatmentPlan.id, {
        patientId: activePatient.id,
        date: doseDate,
        medicationName: doseMedName,
        status: doseStatus,
        patientNote: dosePatientNote.trim() || undefined,
        doctorNote: doseDoctorNote.trim() || undefined,
        isDemoSimulation: true,
      });

      if (res) {
        setTreatmentPlan(res.updatedPlan);
        const tl = await timelineService.getTimelineByPatientId(activePatient.id);
        setPatientTimeline(tl);
        success(`Recorded dose (${doseStatus}) for ${doseMedName} on ${doseDate}.`);
        setIsLogDoseModalOpen(false);
      }
    } catch (err) {
      toastError('Failed to log medication dose.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Side Effect Modal
  const handleOpenSideEffect = () => {
    if (!treatmentPlan) {
      toastError('Please create a treatment plan first.');
      return;
    }
    setSeSymptom('');
    setSeSeverity('MILD');
    setSeDate(new Date().toISOString().split('T')[0]);
    setSeNotes('');
    setSeStatus('REPORTED');
    setSeDoctorNote('');
    setIsSideEffectModalOpen(true);
  };

  // Save Side Effect
  const handleSaveSideEffect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!treatmentPlan || !activePatient) return;

    if (!seSymptom.trim()) {
      toastError('Symptom or adverse effect description is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await treatmentService.addSideEffect(treatmentPlan.id, {
        patientId: activePatient.id,
        symptom: seSymptom.trim(),
        severity: seSeverity,
        date: seDate,
        notes: seNotes.trim() || undefined,
        status: seStatus,
        reportedBy: user?.name ? `${user.name} (${user.role})` : 'DOTS Clinical Nurse',
        doctorActionNote: seDoctorNote.trim() || undefined,
        isDemoSimulation: true,
      });

      if (res) {
        setTreatmentPlan(res.updatedPlan);
        const tl = await timelineService.getTimelineByPatientId(activePatient.id);
        setPatientTimeline(tl);
        success(`Logged adverse effect "${seSymptom}" (${seSeverity}).`);
        setIsSideEffectModalOpen(false);
      }
    } catch (err) {
      toastError('Failed to record side effect.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Side Effect Status (Reported -> Monitoring -> Resolved)
  const handleUpdateSideEffectStatus = async (
    seId: string,
    newStatus: SideEffectStatus
  ) => {
    if (!treatmentPlan) return;
    try {
      const updated = await treatmentService.updateSideEffectStatus(
        treatmentPlan.id,
        seId,
        newStatus
      );
      if (updated) {
        const updatedSEList = (treatmentPlan.sideEffects || []).map((s) =>
          s.id === seId ? updated : s
        );
        setTreatmentPlan({ ...treatmentPlan, sideEffects: updatedSEList });
        info(`Updated side effect status to "${newStatus}".`);
      }
    } catch (err) {
      toastError('Failed to update side effect status.');
    }
  };

  // Open Missed Dose Note Modal
  const handleOpenMissedDoseNote = (dose: DailyDoseRecord) => {
    setSelectedDoseForNote(dose);
    setDoctorMissedNoteText(dose.doctorNote || '');
    setIsMissedNoteModalOpen(true);
  };

  // Save Doctor Note on Missed Dose
  const handleSaveMissedDoseNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!treatmentPlan || !selectedDoseForNote || !activePatient) return;

    setIsSubmitting(true);
    try {
      const updated = await treatmentService.updateMissedDoseNote(
        treatmentPlan.id,
        selectedDoseForNote.id,
        doctorMissedNoteText.trim()
      );
      if (updated) {
        const updatedLogs = (treatmentPlan.doseLogs || []).map((d) =>
          d.id === selectedDoseForNote.id ? updated : d
        );
        setTreatmentPlan({ ...treatmentPlan, doseLogs: updatedLogs });
        const tl = await timelineService.getTimelineByPatientId(activePatient.id);
        setPatientTimeline(tl);
        success('Clinical follow-up note attached to missed dose.');
        setIsMissedNoteModalOpen(false);
      }
    } catch (err) {
      toastError('Failed to update dose note.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner & Patient Context Switcher */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <HeartPulse className="w-6 h-6 text-emerald-600 shrink-0" />
              <span>{t.treatment.title}</span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              WHO 6-Month DOTS Surveillance
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-amber-600" />
              DEMO SIMULATION
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Strictly patient-bound directly observed therapy, adherence surveillance, and adverse effect tracking.
          </p>
        </div>

        {/* View Mode and Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              onClick={() => setViewMode('PATIENT_DETAIL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'PATIENT_DETAIL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Patient Dossier</span>
            </button>
            <button
              onClick={() => setViewMode('COHORT_OVERVIEW')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'COHORT_OVERVIEW'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Cohort Roster ({allTreatments.length})</span>
            </button>
          </div>

          {treatmentPlan ? (
            <>
              <button
                onClick={handleOpenLogDose}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
              >
                <Pill className="w-4 h-4" />
                <span>Log Daily Dose</span>
              </button>
              <button
                onClick={handleOpenSideEffect}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition-all"
              >
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Record Side Effect</span>
              </button>
            </>
          ) : (
            <button
              onClick={handleOpenCreatePlan}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Treatment Plan</span>
            </button>
          )}
        </div>
      </div>

      {/* Patient Selector Bar */}
      <div className="bg-slate-900 text-white p-4 rounded-3xl shadow-md flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-black shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Active Clinical Context:
              </span>
              {activePatient && (
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                  {activePatient.id}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-bold text-base text-white">
                {activePatient ? `${activePatient.firstName} ${activePatient.lastName}` : 'No Patient Selected'}
              </span>
              {activePatient && (
                <span className="text-xs text-slate-400">
                  • {activePatient.age} y/o ({activePatient.gender}) • Status: {activePatient.treatmentStatus}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-300 font-medium whitespace-nowrap">Switch Patient:</label>
          <select
            value={selectedPatientId}
            onChange={(e) => {
              setSelectedPatientId(e.target.value);
              if (onSelectPatient) onSelectPatient(e.target.value);
            }}
            className="px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-500"
          >
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.firstName} {p.lastName} ({p.id}) — {p.treatmentStatus}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Cohort Overview Mode */}
      {viewMode === 'COHORT_OVERVIEW' && (
        <div className="space-y-6">
          {/* Cohort Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Regimens</p>
              <p className="text-2xl font-extrabold text-slate-900 font-mono">{allTreatments.length} Enrolled</p>
              <p className="text-[11px] text-emerald-600 font-medium">Under DOTS direct observation</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mean Adherence</p>
              <p className="text-2xl font-extrabold text-emerald-600 font-mono">
                {allTreatments.length > 0
                  ? (
                      allTreatments.reduce((acc, curr) => acc + curr.adherenceRate, 0) /
                      allTreatments.length
                    ).toFixed(1)
                  : '0'}%
              </p>
              <p className="text-[11px] text-slate-500">Above WHO 90% target</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Intensive Phase</p>
              <p className="text-2xl font-extrabold text-blue-600 font-mono">
                {allTreatments.filter((t) => t.currentPhase === 'INTENSIVE_PHASE').length} Cases
              </p>
              <p className="text-[11px] text-slate-500">Daily 2HRZE / BPaLM surveillance</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Continuation Phase</p>
              <p className="text-2xl font-extrabold text-teal-600 font-mono">
                {allTreatments.filter((t) => t.currentPhase === 'CONTINUATION_PHASE').length} Cases
              </p>
              <p className="text-[11px] text-slate-500">Bi-weekly pill count supervision</p>
            </div>
          </div>

          {/* All Plans Roster Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">All Registered Treatment Plans</h3>
                <p className="text-xs text-slate-500">Click any patient row to open their dedicated treatment dossier</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3.5 pl-6">Patient</th>
                    <th className="py-3.5">Plan ID</th>
                    <th className="py-3.5">Regimen Name</th>
                    <th className="py-3.5">Phase</th>
                    <th className="py-3.5">Adherence</th>
                    <th className="py-3.5">Doses (Taken / Missed)</th>
                    <th className="py-3.5">Doctor & Facility</th>
                    <th className="py-3.5 pr-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {allTreatments.map((tr) => (
                    <tr
                      key={tr.id}
                      onClick={() => {
                        setSelectedPatientId(tr.patientId);
                        setViewMode('PATIENT_DETAIL');
                      }}
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="py-4 pl-6 font-bold text-slate-900">
                        <div>{tr.patientName || 'Patient'}</div>
                        <span className="font-mono text-[10px] text-slate-400">{tr.patientId}</span>
                      </td>
                      <td className="py-4 font-mono font-bold text-slate-800">{tr.id}</td>
                      <td className="py-4 font-medium text-slate-800 max-w-xs truncate">{tr.regimenName}</td>
                      <td className="py-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                            tr.currentPhase === 'INTENSIVE_PHASE'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-teal-50 text-teal-700 border border-teal-200'
                          }`}
                        >
                          {tr.currentPhase === 'INTENSIVE_PHASE' ? 'Intensive' : 'Continuation'}
                        </span>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                tr.adherenceRate >= 90 ? 'bg-emerald-500' : 'bg-amber-500'
                              }`}
                              style={{ width: `${tr.adherenceRate}%` }}
                            />
                          </div>
                          <span className="font-mono font-bold text-slate-900">{tr.adherenceRate}%</span>
                        </div>
                      </td>
                      <td className="py-4 font-mono text-xs">
                        <span className="text-emerald-700 font-bold">{tr.dosesTaken || 0}</span> /{' '}
                        <span className="text-rose-600 font-bold">{tr.missedDoses || 0}</span>
                      </td>
                      <td className="py-4 text-slate-500">
                        <div>{tr.supervisingDoctor}</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-xs">{tr.facility}</div>
                      </td>
                      <td className="py-4 pr-6 text-right">
                        <span className="text-emerald-600 font-bold hover:underline inline-flex items-center gap-1">
                          Open Dossier <ChevronRight className="w-3.5 h-3.5" />
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

      {/* Patient Detail Mode */}
      {viewMode === 'PATIENT_DETAIL' && (
        <>
          {/* If No Treatment Plan Exists for Active Patient */}
          {!treatmentPlan ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-10 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center border border-emerald-100">
                <HeartPulse className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-lg font-bold text-slate-900">
                  No Active DOTS Regimen for {activePatient ? `${activePatient.firstName} ${activePatient.lastName}` : 'Patient'}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Patient {activePatient?.id} has not yet been initiated into a structured Directly Observed Therapy (DOTS) care plan.
                </p>
              </div>
              <div className="pt-2 flex flex-wrap justify-center gap-3">
                <button
                  onClick={handleOpenCreatePlan}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold shadow-xs transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Initiate Standard WHO Treatment Plan</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Progress Dashboard KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Adherence Card */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">DOTS Adherence</p>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        (treatmentMetrics?.adherence || 0) >= 90
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      Target: ≥90%
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-black text-slate-900 font-mono">
                      {treatmentMetrics?.adherence}%
                    </p>
                  </div>
                  <p className="text-xs text-slate-600 font-mono">
                    Taken: <span className="text-emerald-600 font-bold">{treatmentPlan.dosesTaken}</span> • Missed: <span className="text-rose-600 font-bold">{treatmentPlan.missedDoses}</span>
                  </p>
                </div>

                {/* 2. Phase & Duration Card */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Phase</p>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black text-blue-700">
                      {treatmentPlan.currentPhase === 'INTENSIVE_PHASE' ? 'Intensive Phase' : 'Continuation Phase'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono">
                    Start: <span className="text-slate-800 font-bold">{treatmentPlan.startDate}</span>
                  </p>
                </div>

                {/* 3. Days Completed / Remaining */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Timeline Progression</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-black text-slate-900 font-mono">
                      {treatmentMetrics?.daysCompleted}d
                    </p>
                    <span className="text-xs text-slate-500 font-mono">
                      / {treatmentMetrics?.daysRemaining}d left
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all"
                      style={{ width: `${treatmentMetrics?.progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* 4. Active Side Effects & Flags */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Adverse Events</p>
                  <div className="flex items-baseline gap-2">
                    <p
                      className={`text-3xl font-black font-mono ${
                        (treatmentMetrics?.activeSideEffects.length || 0) > 0 ? 'text-amber-600' : 'text-slate-900'
                      }`}
                    >
                      {treatmentMetrics?.activeSideEffects.length || 0} Active
                    </p>
                    <span className="text-xs text-slate-400">
                      ({treatmentMetrics?.totalSideEffects} total)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {(treatmentMetrics?.activeSideEffects.length || 0) > 0
                      ? 'Clinical monitoring in progress'
                      : 'No adverse flags currently active'}
                  </p>
                </div>
              </div>

              {/* Treatment Plan Header Card & Details */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                        {treatmentPlan.id}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {treatmentPlan.status}
                      </span>
                    </div>
                    <h2 className="text-lg font-black text-slate-900">{treatmentPlan.regimenName}</h2>
                    <p className="text-xs text-slate-500 flex flex-wrap items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {treatmentPlan.facility || 'Central Reference TB Hospital'}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        Supervising: {treatmentPlan.supervisingDoctor}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Target Completion: {treatmentPlan.estimatedEndDate}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleOpenEditPlan}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Plan</span>
                    </button>
                    <button
                      onClick={() => setIsDeleteModalOpen(true)}
                      className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Plan</span>
                    </button>
                  </div>
                </div>

                {/* Prescribed Medications */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Pill className="w-4 h-4 text-emerald-600" />
                      Active Daily Prescriptions ({treatmentPlan.medications.length})
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {treatmentPlan.medications.map((med, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-xs text-slate-900">{med.name}</p>
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-mono text-[10px] font-bold">
                            {med.frequency}
                          </span>
                        </div>
                        <p className="text-xs font-mono text-emerald-700 font-bold">{med.dosage}</p>
                        {med.notes && (
                          <p className="text-[11px] text-slate-500 italic">{med.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {treatmentPlan.notes && (
                  <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 text-xs text-slate-700 flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-blue-900">Clinical Protocol Notes: </span>
                      <span>{treatmentPlan.notes}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Two Column Layout: Missed Doses & Side Effects */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. Missed Doses Surveillance Box */}
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                        <AlertCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Missed Doses Surveillance</h3>
                        <p className="text-[11px] text-slate-500">
                          {treatmentMetrics?.missedDosesList.length || 0} flagged non-adherence events
                        </p>
                      </div>
                    </div>
                  </div>

                  {(!treatmentMetrics?.missedDosesList || treatmentMetrics.missedDosesList.length === 0) ? (
                    <div className="p-8 text-center bg-emerald-50/40 rounded-2xl border border-dashed border-emerald-200 text-emerald-800 text-xs space-y-1">
                      <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                      <p className="font-bold">Perfect Adherence Recorded</p>
                      <p className="text-[11px] text-emerald-600">No missed or skipped medication doses on file.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {treatmentMetrics.missedDosesList.map((missed) => (
                        <div
                          key={missed.id}
                          className="p-4 bg-rose-50/40 rounded-2xl border border-rose-200 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-slate-900">{missed.date}</span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                {missed.status}
                              </span>
                            </div>
                            <button
                              onClick={() => handleOpenMissedDoseNote(missed)}
                              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 shadow-xs"
                            >
                              <MessageSquare className="w-3 h-3 text-slate-500" />
                              <span>{missed.doctorNote ? 'Edit Note' : '+ Doctor Note'}</span>
                            </button>
                          </div>

                          <p className="text-xs font-medium text-slate-800">{missed.medicationName}</p>

                          {missed.patientNote && (
                            <p className="text-[11px] text-slate-600 bg-white/80 p-2 rounded-xl border border-rose-100">
                              <span className="font-bold text-slate-700">Patient statement: </span>
                              {missed.patientNote}
                            </p>
                          )}

                          {missed.doctorNote && (
                            <p className="text-[11px] text-blue-900 bg-blue-50/80 p-2 rounded-xl border border-blue-200">
                              <span className="font-bold text-blue-800">Physician follow-up: </span>
                              {missed.doctorNote}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Side Effects & Adverse Events */}
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Adverse Symptoms & Toxicities</h3>
                        <p className="text-[11px] text-slate-500">
                          {treatmentPlan.sideEffects?.length || 0} adverse reaction reports
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleOpenSideEffect}
                      className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Record</span>
                    </button>
                  </div>

                  {(!treatmentPlan.sideEffects || treatmentPlan.sideEffects.length === 0) ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 text-xs">
                      No adverse drug reactions or side effects recorded for this patient.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {treatmentPlan.sideEffects.map((se) => (
                        <div
                          key={se.id}
                          className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-slate-900">{se.symptom}</span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  se.severity === 'SEVERE'
                                    ? 'bg-rose-100 text-rose-800'
                                    : se.severity === 'MODERATE'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                {se.severity}
                              </span>
                            </div>

                            {/* Status cycle button */}
                            <select
                              value={se.status}
                              onChange={(e) =>
                                handleUpdateSideEffectStatus(
                                  se.id,
                                  e.target.value as SideEffectStatus
                                )
                              }
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${
                                se.status === 'RESOLVED'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : se.status === 'MONITORING'
                                  ? 'bg-blue-50 text-blue-800 border-blue-300'
                                  : 'bg-amber-50 text-amber-800 border-amber-300'
                              }`}
                            >
                              <option value="REPORTED">Reported</option>
                              <option value="MONITORING">Monitoring</option>
                              <option value="RESOLVED">Resolved</option>
                            </select>
                          </div>

                          <div className="text-[11px] text-slate-500 flex items-center gap-2">
                            <span>Date: {se.date}</span>
                            {se.reportedBy && <span>• Reported by: {se.reportedBy}</span>}
                          </div>

                          {se.notes && (
                            <p className="text-xs text-slate-600 bg-white p-2 rounded-xl border border-slate-200">
                              {se.notes}
                            </p>
                          )}

                          {se.doctorActionNote && (
                            <p className="text-[11px] text-indigo-950 bg-indigo-50/70 p-2 rounded-xl border border-indigo-200">
                              <span className="font-bold text-indigo-900">Clinical Action: </span>
                              {se.doctorActionNote}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Daily Dose Logs History */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Directly Observed Dose Logs</h3>
                    <p className="text-xs text-slate-500">
                      Chronological history of patient-specific pill ingestions and observations
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search logs..."
                        className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                      <button
                        onClick={() => setDoseFilter('ALL')}
                        className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                          doseFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                        }`}
                      >
                        All ({treatmentPlan.doseLogs?.length || 0})
                      </button>
                      <button
                        onClick={() => setDoseFilter('TAKEN')}
                        className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                          doseFilter === 'TAKEN' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500'
                        }`}
                      >
                        Taken ({treatmentPlan.dosesTaken || 0})
                      </button>
                      <button
                        onClick={() => setDoseFilter('MISSED')}
                        className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                          doseFilter === 'MISSED' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-500'
                        }`}
                      >
                        Missed ({treatmentPlan.missedDoses || 0})
                      </button>
                    </div>

                    <button
                      onClick={handleOpenLogDose}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Log Dose</span>
                    </button>
                  </div>
                </div>

                {filteredDoseLogs.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 text-xs">
                    No medication dose records match the selected filter.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                          <th className="py-3 pl-4">Date</th>
                          <th className="py-3">Medication</th>
                          <th className="py-3">Status</th>
                          <th className="py-3">Patient Observation / Reason</th>
                          <th className="py-3">Doctor / Worker Note</th>
                          <th className="py-3 pr-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {filteredDoseLogs.map((dose) => (
                          <tr key={dose.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3.5 pl-4 font-mono font-bold text-slate-900">
                              {dose.date}
                            </td>
                            <td className="py-3.5 font-bold text-slate-800">{dose.medicationName}</td>
                            <td className="py-3.5">
                              <span
                                className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                                  dose.status === 'TAKEN'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : dose.status === 'MISSED'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}
                              >
                                {dose.status}
                              </span>
                            </td>
                            <td className="py-3.5 text-slate-600 max-w-xs truncate">
                              {dose.patientNote || '—'}
                            </td>
                            <td className="py-3.5 text-blue-900 max-w-xs truncate font-medium">
                              {dose.doctorNote || '—'}
                            </td>
                            <td className="py-3.5 pr-4 text-right">
                              {(dose.status === 'MISSED' || dose.status === 'SKIPPED') && (
                                <button
                                  onClick={() => handleOpenMissedDoseNote(dose)}
                                  className="text-blue-600 hover:underline font-bold text-[11px]"
                                >
                                  {dose.doctorNote ? 'Edit Note' : 'Add Note'}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Patient Treatment Timeline Events */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <History className="w-4 h-4 text-emerald-600" />
                      Treatment Care Timeline ({treatmentTimelineEvents.length})
                    </h3>
                    <p className="text-xs text-slate-500">
                      Audit trail of treatment milestones, dose ingestions, side effects, and phase transitions
                    </p>
                  </div>
                </div>

                {treatmentTimelineEvents.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 text-xs">
                    No treatment timeline events logged yet for this patient.
                  </div>
                ) : (
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {treatmentTimelineEvents.slice(0, 10).map((ev) => (
                      <div key={ev.id} className="relative space-y-1">
                        <div
                          className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 border-white shadow-xs ${
                            ev.type === 'TREATMENT_STARTED' || ev.type === 'TREATMENT_COMPLETED'
                              ? 'bg-emerald-500'
                              : ev.type === 'DOSE_MISSED' || ev.severity === 'alert'
                              ? 'bg-rose-500'
                              : ev.type === 'SIDE_EFFECT_REPORTED'
                              ? 'bg-amber-500'
                              : 'bg-blue-500'
                          }`}
                        />
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">{ev.title}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(ev.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{ev.description}</p>
                        <p className="text-[11px] text-slate-400">
                          By: <span className="font-bold text-slate-600">{ev.authorName}</span> ({ev.authorRole})
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: Create / Edit Treatment Plan Modal */}
      {/* ========================================================================= */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Pill className="w-5 h-5 text-emerald-600" />
                  <span>{isEditMode ? 'Edit Treatment Plan' : 'Initiate DOTS Treatment Plan'}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Patient: {activePatient?.firstName} {activePatient?.lastName} ({activePatient?.id})
                </p>
              </div>
              <button
                onClick={() => setIsPlanModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick WHO Preset Selection */}
            {!isEditMode && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>WHO Guideline Treatment Profiles (1-Click Fill):</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {WHO_REGIMEN_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyPreset(idx)}
                      className="p-2.5 text-left bg-slate-50 hover:bg-emerald-50/60 border border-slate-200 hover:border-emerald-300 rounded-xl transition-all space-y-1"
                    >
                      <p className="font-bold text-[11px] text-slate-900 line-clamp-1">{preset.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {preset.durationMonths} Mo • {preset.phase === 'INTENSIVE_PHASE' ? 'Intensive' : 'Continuation'}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSaveTreatmentPlan} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Regimen Name / Protocol <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formRegimenName}
                    onChange={(e) => setFormRegimenName(e.target.value)}
                    placeholder="e.g. WHO Standard First-Line: 2HRZE / 4HR"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Start Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Planned Duration (Months)
                  </label>
                  <select
                    value={formDurationMonths}
                    onChange={(e) => setFormDurationMonths(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                  >
                    <option value={4}>4 Months (Continuation / Shortened)</option>
                    <option value={6}>6 Months (WHO Standard DOTS)</option>
                    <option value={9}>9 Months (Extended TB Regimen)</option>
                    <option value={18}>18 Months (Long MDR-TB Regimen)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Calculated Completion Date
                  </label>
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Care Phase <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formPhase}
                    onChange={(e) => setFormPhase(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                  >
                    <option value="INTENSIVE_PHASE">Intensive Phase (Daily 4-FDC / BPaLM)</option>
                    <option value="CONTINUATION_PHASE">Continuation Phase (2-FDC HR)</option>
                    <option value="MAINTENANCE">Maintenance / Prophylaxis</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Prescribing Doctor</label>
                  <input
                    type="text"
                    value={formDoctor}
                    onChange={(e) => setFormDoctor(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Clinical Facility</label>
                  <input
                    type="text"
                    value={formFacility}
                    onChange={(e) => setFormFacility(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Dynamic Medication List */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800">
                    Medication Prescriptions <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddMedicationRow}
                    className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Drug</span>
                  </button>
                </div>

                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {formMedications.map((med, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          placeholder="Medication name (e.g. Rifampicin + Isoniazid)"
                          value={med.name}
                          onChange={(e) =>
                            handleUpdateMedicationRow(idx, 'name', e.target.value)
                          }
                          className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:border-emerald-500"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveMedicationRow(idx)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Dosage (e.g. 4 tablets daily / 300mg)"
                          value={med.dosage}
                          onChange={(e) =>
                            handleUpdateMedicationRow(idx, 'dosage', e.target.value)
                          }
                          className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                        />
                        <input
                          type="text"
                          placeholder="Frequency (e.g. Daily morning DOTS)"
                          value={med.frequency}
                          onChange={(e) =>
                            handleUpdateMedicationRow(idx, 'frequency', e.target.value)
                          }
                          className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Clinical Instructions & Notes</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={2}
                  placeholder="Direct observation protocol, liver enzyme surveillance notes..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-xs transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{isEditMode ? 'Update Care Plan' : 'Save Treatment Plan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: Log Daily Dose Modal */}
      {/* ========================================================================= */}
      {isLogDoseModalOpen && treatmentPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Pill className="w-5 h-5 text-emerald-600" />
                  <span>Log Medication Dose (DOTS)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Patient: {activePatient?.firstName} {activePatient?.lastName}
                </p>
              </div>
              <button
                onClick={() => setIsLogDoseModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDoseLog} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Observation Date:</label>
                <input
                  type="date"
                  value={doseDate}
                  onChange={(e) => setDoseDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Medication:</label>
                <select
                  value={doseMedName}
                  onChange={(e) => setDoseMedName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:border-emerald-500"
                >
                  {treatmentPlan.medications.map((m, idx) => (
                    <option key={idx} value={m.name}>
                      {m.name} ({m.dosage})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Ingestion Status:</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['TAKEN', 'MISSED', 'SKIPPED', 'UNKNOWN'] as DoseStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setDoseStatus(st)}
                      className={`py-2 rounded-xl text-center font-bold text-xs border transition-all ${
                        doseStatus === st
                          ? st === 'TAKEN'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : st === 'MISSED'
                            ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                            : 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Patient Observation / Statement:</label>
                <input
                  type="text"
                  value={dosePatientNote}
                  onChange={(e) => setDosePatientNote(e.target.value)}
                  placeholder={
                    doseStatus === 'TAKEN'
                      ? 'Swallowed under nurse supervision with water'
                      : 'Patient missed due to transportation delay...'
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Healthcare Worker / Doctor Note:</label>
                <input
                  type="text"
                  value={doseDoctorNote}
                  onChange={(e) => setDoseDoctorNote(e.target.value)}
                  placeholder="Supervised at clinic / home visit completed"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsLogDoseModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirm Ingestion Log</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: Record Side Effect Modal */}
      {/* ========================================================================= */}
      {isSideEffectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <span>Record Adverse Side Effect</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Patient: {activePatient?.firstName} {activePatient?.lastName}
                </p>
              </div>
              <button
                onClick={() => setIsSideEffectModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSideEffect} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Symptom / Side Effect <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={seSymptom}
                  onChange={(e) => setSeSymptom(e.target.value)}
                  placeholder="e.g. Nausea, Peripheral tingling, Rash, Jaundice"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Severity:</label>
                  <select
                    value={seSeverity}
                    onChange={(e) => setSeSeverity(e.target.value as SideEffectSeverity)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:border-emerald-500"
                  >
                    <option value="MILD">Mild (No regimen change)</option>
                    <option value="MODERATE">Moderate (Requires symptom therapy)</option>
                    <option value="SEVERE">Severe (Potential hepatotoxicity)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Onset Date:</label>
                  <input
                    type="date"
                    value={seDate}
                    onChange={(e) => setSeDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Status:</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['REPORTED', 'MONITORING', 'RESOLVED'] as SideEffectStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setSeStatus(st)}
                      className={`py-1.5 rounded-xl text-center font-bold text-xs border transition-all ${
                        seStatus === st
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Patient Description:</label>
                <textarea
                  value={seNotes}
                  onChange={(e) => setSeNotes(e.target.value)}
                  rows={2}
                  placeholder="Patient describes transient nausea 45 minutes after taking 4-FDC tablets..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Physician Action Plan:</label>
                <input
                  type="text"
                  value={seDoctorNote}
                  onChange={(e) => setSeDoctorNote(e.target.value)}
                  placeholder="Advised to take with light snack; order repeat ALT/AST in 7 days"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSideEffectModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Side Effect</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: Doctor Note on Missed Dose Modal */}
      {/* ========================================================================= */}
      {isMissedNoteModalOpen && selectedDoseForNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                  <span>Physician Follow-up Note</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Missed Dose: {selectedDoseForNote.date} ({selectedDoseForNote.medicationName})
                </p>
              </div>
              <button
                onClick={() => setIsMissedNoteModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMissedDoseNote} className="space-y-3.5 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <p className="text-slate-500 text-[11px]">Patient reported statement:</p>
                <p className="text-slate-800 font-medium mt-0.5">
                  {selectedDoseForNote.patientNote || 'No statement provided.'}
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Doctor Clinical Assessment / Intervention:
                </label>
                <textarea
                  value={doctorMissedNoteText}
                  onChange={(e) => setDoctorMissedNoteText(e.target.value)}
                  rows={3}
                  placeholder="Contacted patient via phone. Re-emphasized strict adherence; next dose scheduled with DOTS nurse..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsMissedNoteModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Clinical Note</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: Delete Treatment Plan Confirmation Modal */}
      {/* ========================================================================= */}
      {isDeleteModalOpen && treatmentPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Treatment Plan?</h3>
                <p className="text-xs text-slate-500">
                  Patient: {activePatient?.firstName} {activePatient?.lastName} ({activePatient?.id})
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-200 text-xs text-rose-900 space-y-1">
              <p className="font-bold">Important Patient Safety Confirmation:</p>
              <p className="leading-relaxed">
                This will delete only the treatment plan (<span className="font-mono">{treatmentPlan.id}</span>) and its associated dose logs. The patient master record and diagnostic history will remain completely intact.
              </p>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteTreatmentPlan}
                disabled={isSubmitting}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-xs transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Confirm Plan Deletion</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
