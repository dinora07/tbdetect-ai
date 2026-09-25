import { Patient, PatientDocument, RiskLevel, TimelineEvent } from '../../types';
import { appStorage } from '../storage/appStorage';
import { httpClient } from '../api/httpClient';
import { API_CONFIG } from '../api/config';
import { auditService } from '../audit/auditService';
import { notificationService } from '../notifications/notificationService';

const delay = (ms: number = 200) => new Promise((resolve) => setTimeout(resolve, ms));

export const patientService = {
  async getPatients(search?: string, riskFilter?: string, statusFilter?: string): Promise<Patient[]> {
    if (API_CONFIG.useBackendApi) {
      try {
        const queryParams = new URLSearchParams();
        if (search) queryParams.set('search', search);
        if (riskFilter && riskFilter !== 'ALL') queryParams.set('risk', riskFilter);
        if (statusFilter && statusFilter !== 'ALL') queryParams.set('status', statusFilter);
        return await httpClient.get<Patient[]>(`/patients?${queryParams.toString()}`);
      } catch {
        // Fallback
      }
    }

    await delay(150);
    const patients = appStorage.getPatients();
    return patients.filter((p) => {
      const q = search?.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.firstName.toLowerCase().includes(q) ||
        p.lastName.toLowerCase().includes(q) ||
        p.nationalId.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        p.address.toLowerCase().includes(q);

      const matchesRisk = !riskFilter || riskFilter === 'ALL' || p.riskLevel === riskFilter;
      const matchesStatus = !statusFilter || statusFilter === 'ALL' || p.status === statusFilter;

      return matchesSearch && matchesRisk && matchesStatus;
    });
  },

  async getPatientById(id: string): Promise<Patient | undefined> {
    if (API_CONFIG.useBackendApi) {
      try {
        return await httpClient.get<Patient>(`/patients/${id}`);
      } catch {
        // Fallback
      }
    }

    await delay(100);
    const patients = appStorage.getPatients();
    return patients.find((p) => p.id === id);
  },

  async createPatient(
    patientData: Omit<Patient, 'id' | 'createdAt' | 'updatedAt' | 'riskScore' | 'riskLevel' | 'status' | 'treatmentStatus'> & {
      id?: string;
      riskScore?: number;
      riskLevel?: RiskLevel;
    }
  ): Promise<Patient> {
    const newId = patientData.id || `pat_${Date.now().toString(36)}`;
    const newPatient: Patient = {
      ...patientData,
      id: newId,
      riskScore: patientData.riskScore ?? 15,
      riskLevel: patientData.riskLevel ?? 'LOW',
      status: 'PENDING_REVIEW',
      treatmentStatus: 'NOT_STARTED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (API_CONFIG.useBackendApi) {
      try {
        return await httpClient.post<Patient>('/patients', newPatient);
      } catch {
        // Fallback
      }
    }

    await delay(250);
    const patients = appStorage.getPatients();
    appStorage.setPatients([newPatient, ...patients]);

    // Timeline event
    const regEvent: TimelineEvent = {
      id: `evt_reg_${Date.now().toString(36)}`,
      patientId: newId,
      timestamp: new Date().toISOString(),
      type: 'PATIENT_REGISTERED',
      title: 'Patient Dossier Registered',
      description: `Patient ${newPatient.firstName} ${newPatient.lastName} registered. National ID: ${newPatient.nationalId}. Region: ${newPatient.region}.`,
      authorName: 'Medical Intake Desk',
      authorRole: 'Clinical Staff',
      severity: 'info',
    };
    const timeline = appStorage.getTimeline();
    appStorage.setTimeline([regEvent, ...timeline]);

    // Audit log
    await auditService.logEvent({
      action: 'CREATE',
      resourceType: 'PATIENT',
      resourceId: newId,
      patientId: newId,
      patientName: `${newPatient.firstName} ${newPatient.lastName}`,
      details: `Created new patient dossier ${newPatient.firstName} ${newPatient.lastName} (ID: ${newPatient.nationalId})`,
    });

    // Notification
    await notificationService.emitNotification({
      title: 'New Patient Registered',
      message: `${newPatient.firstName} ${newPatient.lastName} (${newPatient.nationalId}) has been added to the registry.`,
      type: 'SYSTEM',
      patientId: newId,
      patientName: `${newPatient.firstName} ${newPatient.lastName}`,
      severity: 'info',
    });

    return newPatient;
  },

  async updatePatient(patientId: string, updatedFields: Partial<Patient>): Promise<Patient | undefined> {
    if (API_CONFIG.useBackendApi) {
      try {
        return await httpClient.put<Patient>(`/patients/${patientId}`, updatedFields);
      } catch {
        // Fallback
      }
    }

    await delay(200);
    const patients = appStorage.getPatients();
    const index = patients.findIndex((p) => p.id === patientId);
    if (index > -1) {
      const updated: Patient = {
        ...patients[index],
        ...updatedFields,
        updatedAt: new Date().toISOString(),
      };
      patients[index] = updated;
      appStorage.setPatients(patients);

      await auditService.logEvent({
        action: 'UPDATE',
        resourceType: 'PATIENT',
        resourceId: patientId,
        patientId: patientId,
        patientName: `${updated.firstName} ${updated.lastName}`,
        details: `Updated profile attributes for ${updated.firstName} ${updated.lastName}`,
      });

      return updated;
    }
    return undefined;
  },

  async deletePatient(patientId: string): Promise<boolean> {
    if (API_CONFIG.useBackendApi) {
      try {
        await httpClient.delete(`/patients/${patientId}`);
      } catch {
        // Fallback
      }
    }

    await delay(250);
    const patients = appStorage.getPatients();
    const target = patients.find((p) => p.id === patientId);
    const filtered = patients.filter((p) => p.id !== patientId);
    appStorage.setPatients(filtered);

    // Cascade clear records referencing patientId
    appStorage.setXRays(appStorage.getXRays().filter((x) => x.patientId !== patientId));
    appStorage.setCoughs(appStorage.getCoughs().filter((c) => c.patientId !== patientId));
    appStorage.setLabs(appStorage.getLabs().filter((l) => l.patientId !== patientId));
    appStorage.setTreatments(appStorage.getTreatments().filter((t) => t.patientId !== patientId));
    appStorage.setTimeline(appStorage.getTimeline().filter((t) => t.patientId !== patientId));
    appStorage.setDocuments(appStorage.getDocuments().filter((d) => d.patientId !== patientId));

    if (target) {
      await auditService.logEvent({
        action: 'DELETE',
        resourceType: 'PATIENT',
        resourceId: patientId,
        patientId,
        patientName: `${target.firstName} ${target.lastName}`,
        details: `Permanently deleted dossier and associated records for ${target.firstName} ${target.lastName}`,
      });
    }

    return filtered.length < patients.length;
  },

  async updatePatientRisk(patientId: string, riskScore: number, riskLevel: RiskLevel): Promise<Patient | undefined> {
    const patients = appStorage.getPatients();
    const index = patients.findIndex((p) => p.id === patientId);
    if (index > -1) {
      const prev = patients[index];
      const updated: Patient = {
        ...prev,
        riskScore,
        riskLevel,
        updatedAt: new Date().toISOString(),
      };
      patients[index] = updated;
      appStorage.setPatients(patients);

      if (riskLevel === 'HIGH' || riskLevel === 'CRITICAL') {
        await notificationService.emitNotification({
          title: `High Risk Stratification (${riskScore}%)`,
          message: `Patient ${updated.firstName} ${updated.lastName} elevated to ${riskLevel} risk tier. Clinical review recommended.`,
          type: 'HIGH_RISK_ALERT',
          patientId: updated.id,
          patientName: `${updated.firstName} ${updated.lastName}`,
          severity: 'critical',
        });
      }

      return updated;
    }
    return undefined;
  },
};

export const documentService = {
  async getDocumentsByPatientId(patientId: string): Promise<PatientDocument[]> {
    if (API_CONFIG.useBackendApi) {
      try {
        return await httpClient.get<PatientDocument[]>(`/patients/${patientId}/documents`);
      } catch {
        // Fallback
      }
    }
    await delay(100);
    return appStorage.getDocuments().filter((d) => d.patientId === patientId);
  },

  async uploadDocument(doc: Omit<PatientDocument, 'id' | 'uploadedAt'>): Promise<PatientDocument> {
    const newDoc: PatientDocument = {
      ...doc,
      id: `doc_${Date.now().toString(36)}`,
      uploadedAt: new Date().toISOString(),
    };

    if (API_CONFIG.useBackendApi) {
      try {
        return await httpClient.post<PatientDocument>(`/patients/${doc.patientId}/documents`, newDoc);
      } catch {
        // Fallback
      }
    }

    await delay(200);
    const docs = appStorage.getDocuments();
    appStorage.setDocuments([newDoc, ...docs]);

    await auditService.logEvent({
      action: 'UPLOAD',
      resourceType: 'PATIENT',
      resourceId: newDoc.id,
      patientId: doc.patientId,
      details: `Uploaded document ${doc.name} (${doc.type}, ${doc.fileSize})`,
    });

    return newDoc;
  },

  async deleteDocument(documentId: string): Promise<boolean> {
    if (API_CONFIG.useBackendApi) {
      try {
        await httpClient.delete(`/documents/${documentId}`);
      } catch {
        // Fallback
      }
    }
    await delay(150);
    const docs = appStorage.getDocuments();
    const filtered = docs.filter((d) => d.id !== documentId);
    appStorage.setDocuments(filtered);
    return filtered.length < docs.length;
  },
};
