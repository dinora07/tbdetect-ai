import {
  TreatmentPlan,
  DailyDoseRecord,
  SideEffectRecord,
  DoseStatus,
  SideEffectStatus,
  TimelineEvent,
} from '../../types';
import { appStorage } from '../storage/appStorage';
import { httpClient } from '../api/httpClient';
import { API_CONFIG } from '../api/config';
import { auditService } from '../audit/auditService';
import { notificationService } from '../notifications/notificationService';

const delay = (ms: number = 200) => new Promise((resolve) => setTimeout(resolve, ms));

export const treatmentService = {
  async getTreatmentPlansByPatientId(patientId: string): Promise<TreatmentPlan[]> {
    if (API_CONFIG.useBackendApi) {
      try {
        return await httpClient.get<TreatmentPlan[]>(`/patients/${patientId}/treatments`);
      } catch {
        // Fallback
      }
    }
    await delay(120);
    const list = appStorage.getTreatments().filter((t) => t.patientId === patientId);
    return list.map((plan) => ({
      ...plan,
      adherenceRate: appStorage.calculateAdherence(plan),
    }));
  },

  async getTreatmentByPatientId(patientId: string): Promise<TreatmentPlan | undefined> {
    const plans = await this.getTreatmentPlansByPatientId(patientId);
    return plans.find((p) => p.status === 'ACTIVE') || plans[0];
  },

  async getAllTreatments(): Promise<TreatmentPlan[]> {
    if (API_CONFIG.useBackendApi) {
      try {
        return await httpClient.get<TreatmentPlan[]>('/treatments');
      } catch {
        // Fallback
      }
    }
    await delay(150);
    return appStorage.getTreatments().map((plan) => ({
      ...plan,
      adherenceRate: appStorage.calculateAdherence(plan),
    }));
  },

  async getTreatmentById(id: string): Promise<TreatmentPlan | undefined> {
    if (API_CONFIG.useBackendApi) {
      try {
        return await httpClient.get<TreatmentPlan>(`/treatments/${id}`);
      } catch {
        // Fallback
      }
    }
    await delay(100);
    const plan = appStorage.getTreatments().find((t) => t.id === id);
    if (plan) {
      return {
        ...plan,
        adherenceRate: appStorage.calculateAdherence(plan),
      };
    }
    return undefined;
  },

  async createTreatmentPlan(data: Partial<TreatmentPlan> & {
    patientId: string;
    patientName: string;
    regimenName: string;
    startDate: string;
    estimatedEndDate: string;
    currentPhase: 'INTENSIVE_PHASE' | 'CONTINUATION_PHASE' | 'MAINTENANCE';
    status: 'NOT_STARTED' | 'ACTIVE' | 'COMPLETED' | 'DEFAULTED' | 'SUSPENDED';
    supervisingDoctor: string;
    medications: TreatmentPlan['medications'];
  }): Promise<TreatmentPlan> {
    const newId = `rx_${Date.now().toString(36)}`;
    const newPlan: TreatmentPlan = {
      id: newId,
      patientId: data.patientId,
      patientName: data.patientName,
      regimenName: data.regimenName,
      startDate: data.startDate,
      plannedDurationMonths: data.plannedDurationMonths || 6,
      estimatedEndDate: data.estimatedEndDate,
      currentPhase: data.currentPhase,
      status: data.status,
      adherenceRate: data.adherenceRate ?? 100,
      dosesPrescribed: data.dosesPrescribed ?? 180,
      dosesTaken: data.dosesTaken ?? 0,
      missedDoses: data.missedDoses ?? 0,
      facility: data.facility || "Respublika Ixtisoslashtirilgan Ftiziatriya va Pulmonologiya Markazi",
      supervisingDoctor: data.supervisingDoctor,
      notes: data.notes,
      medications: data.medications || [],
      doseLogs: data.doseLogs || [],
      sideEffects: data.sideEffects || [],
      nextAppointmentDate: data.nextAppointmentDate,
      isDemoSimulation: data.isDemoSimulation ?? false,
    };

    if (API_CONFIG.useBackendApi) {
      try {
        const res = await httpClient.post<TreatmentPlan>(`/patients/${data.patientId}/treatments`, newPlan);
        if (res) return res;
      } catch {
        // Fallback
      }
    }

    await delay(200);
    const plans = appStorage.getTreatments();
    appStorage.setTreatments([newPlan, ...plans]);

    // Update patient treatment status
    const patients = appStorage.getPatients();
    const patientIdx = patients.findIndex((p) => p.id === data.patientId);
    if (patientIdx > -1) {
      patients[patientIdx].treatmentStatus = data.status || 'ACTIVE';
      appStorage.setPatients(patients);
    }

    // Timeline event
    const evt: TimelineEvent = {
      id: `evt_tx_${Date.now().toString(36)}`,
      patientId: data.patientId,
      timestamp: new Date().toISOString(),
      type: 'TREATMENT_STARTED',
      title: 'TB Regimen Prescribed',
      description: `Regimen: ${data.regimenName}. Phase: ${data.currentPhase.replace(/_/g, ' ')}. Supervising: ${data.supervisingDoctor}.`,
      authorName: data.supervisingDoctor,
      authorRole: 'Attending Physician',
      severity: 'info',
    };
    appStorage.setTimeline([evt, ...appStorage.getTimeline()]);

    // Audit log
    await auditService.logEvent({
      action: 'CREATE',
      resourceType: 'TREATMENT',
      resourceId: newId,
      patientId: data.patientId,
      patientName: data.patientName,
      details: `Initiated treatment plan: ${data.regimenName} for ${data.patientName}`,
    });

    return newPlan;
  },

  async updateTreatmentPlan(id: string, updates: Partial<TreatmentPlan>): Promise<TreatmentPlan | undefined> {
    if (API_CONFIG.useBackendApi) {
      try {
        return await httpClient.put<TreatmentPlan>(`/treatments/${id}`, updates);
      } catch {
        // Fallback
      }
    }

    await delay(180);
    const plans = appStorage.getTreatments();
    const index = plans.findIndex((t) => t.id === id);
    if (index > -1) {
      const updated: TreatmentPlan = {
        ...plans[index],
        ...updates,
      };
      updated.adherenceRate = appStorage.calculateAdherence(updated);
      plans[index] = updated;
      appStorage.setTreatments(plans);

      await auditService.logEvent({
        action: 'UPDATE',
        resourceType: 'TREATMENT',
        resourceId: id,
        patientId: updated.patientId,
        patientName: updated.patientName,
        details: `Updated treatment plan details (${updated.regimenName})`,
      });

      return updated;
    }
    return undefined;
  },

  async deleteTreatmentPlan(id: string): Promise<boolean> {
    if (API_CONFIG.useBackendApi) {
      try {
        await httpClient.delete(`/treatments/${id}`);
      } catch {
        // Fallback
      }
    }

    await delay(150);
    const plans = appStorage.getTreatments();
    const target = plans.find((t) => t.id === id);
    const filtered = plans.filter((t) => t.id !== id);
    appStorage.setTreatments(filtered);

    if (target) {
      await auditService.logEvent({
        action: 'DELETE',
        resourceType: 'TREATMENT',
        resourceId: id,
        patientId: target.patientId,
        patientName: target.patientName,
        details: `Deleted treatment regimen ${target.regimenName} (${id})`,
      });
    }

    return filtered.length < plans.length;
  },

  /**
   * Logs a daily medication dose and recalculates live adherence dynamically.
   */
  async logDailyDose(
    treatmentPlanId: string,
    dose: {
      patientId: string;
      date: string;
      medicationName: string;
      status: DoseStatus;
      patientNote?: string;
      doctorNote?: string;
      isDemoSimulation?: boolean;
    }
  ): Promise<{ updatedPlan: TreatmentPlan; doseRecord: DailyDoseRecord } | undefined> {
    const plans = appStorage.getTreatments();
    const index = plans.findIndex((t) => t.id === treatmentPlanId);
    if (index === -1) return undefined;

    const plan = plans[index];
    const doseLogs = plan.doseLogs ? [...plan.doseLogs] : [];

    const existingDoseIndex = doseLogs.findIndex((d) => d.date === dose.date && d.medicationName === dose.medicationName);
    const now = new Date().toISOString();

    const doseRecord: DailyDoseRecord = {
      id: existingDoseIndex > -1 ? doseLogs[existingDoseIndex].id : `dose_${Date.now().toString(36)}`,
      treatmentPlanId,
      patientId: dose.patientId,
      date: dose.date,
      medicationName: dose.medicationName,
      status: dose.status,
      patientNote: dose.patientNote,
      doctorNote: dose.doctorNote,
      loggedAt: now,
      isDemoSimulation: dose.isDemoSimulation,
    };

    if (existingDoseIndex > -1) {
      doseLogs[existingDoseIndex] = doseRecord;
    } else {
      doseLogs.unshift(doseRecord);
    }

    const takenCount = doseLogs.filter((d) => d.status === 'TAKEN').length;
    const missedCount = doseLogs.filter((d) => d.status === 'MISSED' || d.status === 'SKIPPED').length;

    const updatedPlan: TreatmentPlan = {
      ...plan,
      doseLogs,
      dosesTaken: takenCount,
      missedDoses: missedCount,
    };
    updatedPlan.adherenceRate = appStorage.calculateAdherence(updatedPlan);

    plans[index] = updatedPlan;
    appStorage.setTreatments(plans);

    // Audit log
    await auditService.logEvent({
      action: 'UPDATE',
      resourceType: 'TREATMENT',
      resourceId: treatmentPlanId,
      patientId: dose.patientId,
      patientName: plan.patientName,
      details: `Logged dose: ${dose.medicationName} on ${dose.date} as ${dose.status}. New Adherence: ${updatedPlan.adherenceRate}%`,
    });

    if (dose.status === 'MISSED') {
      await notificationService.emitNotification({
        title: 'Missed Medication Dose',
        message: `${plan.patientName} missed prescribed dose of ${dose.medicationName} on ${dose.date}.`,
        type: 'TREATMENT_MILESTONE',
        patientId: dose.patientId,
        patientName: plan.patientName,
        severity: 'warning',
      });
    }

    return { updatedPlan, doseRecord };
  },

  /**
   * Updates clinical follow-up note on a missed dose
   */
  async updateMissedDoseNote(
    treatmentPlanId: string,
    doseId: string,
    doctorNote: string
  ): Promise<DailyDoseRecord | undefined> {
    const plans = appStorage.getTreatments();
    const index = plans.findIndex((t) => t.id === treatmentPlanId);
    if (index === -1) return undefined;

    const plan = plans[index];
    let updatedRecord: DailyDoseRecord | undefined;
    const doseLogs = (plan.doseLogs || []).map((d) => {
      if (d.id === doseId) {
        updatedRecord = { ...d, doctorNote };
        return updatedRecord;
      }
      return d;
    });

    plans[index] = { ...plan, doseLogs };
    appStorage.setTreatments(plans);

    return updatedRecord;
  },

  /**
   * Adds or updates a side effect observation.
   */
  async addSideEffect(
    treatmentPlanId: string,
    sideEffect: {
      patientId: string;
      symptom: string;
      severity: 'MILD' | 'MODERATE' | 'SEVERE';
      date: string;
      notes?: string;
      status: SideEffectStatus;
      reportedBy?: string;
      doctorActionNote?: string;
      isDemoSimulation?: boolean;
    }
  ): Promise<{ newRecord: SideEffectRecord; updatedPlan: TreatmentPlan }> {
    const plans = appStorage.getTreatments();
    const index = plans.findIndex((t) => t.id === treatmentPlanId);
    if (index === -1) throw new Error('Treatment plan not found');

    const newRecord: SideEffectRecord = {
      ...sideEffect,
      id: `se_${Date.now().toString(36)}`,
      treatmentPlanId,
    };

    const sideEffects = plans[index].sideEffects ? [...plans[index].sideEffects, newRecord] : [newRecord];
    const updatedPlan: TreatmentPlan = {
      ...plans[index],
      sideEffects,
    };
    plans[index] = updatedPlan;
    appStorage.setTreatments(plans);

    // Add timeline event
    const evt: TimelineEvent = {
      id: `evt_se_${Date.now().toString(36)}`,
      patientId: sideEffect.patientId,
      timestamp: new Date().toISOString(),
      type: 'SIDE_EFFECT_REPORTED',
      title: `Adverse Effect Reported: ${sideEffect.symptom}`,
      description: `Severity: ${sideEffect.severity}. Status: ${sideEffect.status}. Notes: "${sideEffect.notes || 'None'}"`,
      authorName: sideEffect.reportedBy || 'Patient / Clinic',
      authorRole: 'Clinical Intake',
      severity: sideEffect.severity === 'SEVERE' ? 'alert' : 'warning',
    };
    appStorage.setTimeline([evt, ...appStorage.getTimeline()]);

    // Audit log
    await auditService.logEvent({
      action: 'CREATE',
      resourceType: 'TREATMENT',
      resourceId: newRecord.id,
      patientId: sideEffect.patientId,
      patientName: plans[index].patientName,
      details: `Reported side effect: ${sideEffect.symptom} (${sideEffect.severity})`,
    });

    return { newRecord, updatedPlan };
  },

  async updateSideEffectStatus(
    treatmentPlanId: string,
    sideEffectId: string,
    status: SideEffectStatus,
    doctorActionNote?: string
  ): Promise<TreatmentPlan | undefined> {
    const plans = appStorage.getTreatments();
    const index = plans.findIndex((t) => t.id === treatmentPlanId);
    if (index === -1) return undefined;

    const sideEffects = (plans[index].sideEffects || []).map((se) =>
      se.id === sideEffectId
        ? {
            ...se,
            status,
            doctorActionNote: doctorActionNote || se.doctorActionNote,
          }
        : se
    );

    const updatedPlan: TreatmentPlan = {
      ...plans[index],
      sideEffects,
    };
    plans[index] = updatedPlan;
    appStorage.setTreatments(plans);

    await auditService.logEvent({
      action: 'UPDATE',
      resourceType: 'TREATMENT',
      resourceId: sideEffectId,
      patientId: plans[index].patientId,
      patientName: plans[index].patientName,
      details: `Updated adverse effect ${sideEffectId} to ${status}. Doctor note: ${doctorActionNote || 'None'}`,
    });

    return updatedPlan;
  },
};
