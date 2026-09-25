import { LabResult, TimelineEvent } from '../../types';
import { appStorage } from '../storage/appStorage';
import { httpClient } from '../api/httpClient';
import { API_CONFIG } from '../api/config';
import { auditService } from '../audit/auditService';
import { notificationService } from '../notifications/notificationService';

const delay = (ms: number = 200) => new Promise((resolve) => setTimeout(resolve, ms));

export const labService = {
  getLabsByPatientId(patientId: string): Promise<LabResult[]> {
    return this.getLabResultsByPatientId(patientId);
  },

  async getLabResultsByPatientId(patientId: string): Promise<LabResult[]> {
    if (API_CONFIG.useBackendApi) {
      try {
        return await httpClient.get<LabResult[]>(`/patients/${patientId}/labs`);
      } catch {
        // Fallback
      }
    }
    await delay(120);
    return appStorage.getLabs().filter((l) => l.patientId === patientId);
  },

  async getAllLabs(search?: string, testType?: string, status?: string): Promise<LabResult[]> {
    if (API_CONFIG.useBackendApi) {
      try {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (testType && testType !== 'ALL') params.set('testType', testType);
        if (status && status !== 'ALL') params.set('status', status);
        return await httpClient.get<LabResult[]>(`/labs?${params.toString()}`);
      } catch {
        // Fallback
      }
    }

    await delay(150);
    const labs = appStorage.getLabs();
    return labs.filter((l) => {
      const q = search?.toLowerCase().trim();
      const matchesSearch =
        !q ||
        l.patientName.toLowerCase().includes(q) ||
        l.testName.toLowerCase().includes(q) ||
        l.result.toLowerCase().includes(q) ||
        l.laboratoryName.toLowerCase().includes(q);

      const matchesType = !testType || testType === 'ALL' || l.testType === testType;
      const matchesStatus = !status || status === 'ALL' || l.status === status;

      return matchesSearch && matchesType && matchesStatus;
    });
  },

  async getLabById(id: string): Promise<LabResult | undefined> {
    if (API_CONFIG.useBackendApi) {
      try {
        return await httpClient.get<LabResult>(`/labs/${id}`);
      } catch {
        // Fallback
      }
    }
    await delay(100);
    return appStorage.getLabs().find((l) => l.id === id);
  },

  addLabResult(data: Omit<LabResult, 'id'> | (Omit<LabResult, 'id' | 'reportedDate'> & { id?: string; reportedDate?: string })): Promise<LabResult> {
    return this.createLabResult(data);
  },

  async createLabResult(data: (Omit<LabResult, 'id'> | Omit<LabResult, 'id' | 'reportedDate'>) & { id?: string; reportedDate?: string }): Promise<LabResult> {
    const newId = data.id || `lab_${Date.now().toString(36)}`;
    const newLab: LabResult = {
      ...data,
      id: newId,
      reportedDate: data.reportedDate || new Date().toISOString(),
    } as LabResult;

    if (API_CONFIG.useBackendApi) {
      try {
        const res = await httpClient.post<LabResult>(`/patients/${data.patientId}/labs`, newLab);
        if (res) return res;
      } catch {
        // Fallback
      }
    }

    await delay(200);
    const labs = appStorage.getLabs();
    appStorage.setLabs([newLab, ...labs]);

    // Timeline event
    const evt: TimelineEvent = {
      id: `evt_lab_${Date.now().toString(36)}`,
      patientId: data.patientId,
      timestamp: new Date().toISOString(),
      type: 'LAB_RESULT_RECEIVED',
      title: `Lab Result: ${data.testName}`,
      description: `Result: ${data.result}. Status: ${data.status}. Lab: ${data.laboratoryName}.`,
      authorName: data.technicianName || 'Laboratory Tech',
      authorRole: 'Lab Technician',
      severity: data.isAbnormal ? 'alert' : 'info',
    };
    appStorage.setTimeline([evt, ...appStorage.getTimeline()]);

    // Audit log
    await auditService.logEvent({
      action: 'CREATE',
      resourceType: 'LAB_RESULT',
      resourceId: newId,
      patientId: data.patientId,
      patientName: data.patientName,
      details: `Entered lab result: ${data.testName} (${data.result})`,
    });

    // Notification
    await notificationService.emitNotification({
      title: 'Lab Result Received',
      message: `${data.testName} for ${data.patientName}: ${data.result}`,
      type: 'LAB_READY',
      patientId: data.patientId,
      patientName: data.patientName,
      severity: data.isAbnormal ? 'critical' : 'info',
    });

    return newLab;
  },

  async updateLabResult(id: string, updates: Partial<LabResult>): Promise<LabResult | undefined> {
    if (API_CONFIG.useBackendApi) {
      try {
        return await httpClient.put<LabResult>(`/labs/${id}`, updates);
      } catch {
        // Fallback
      }
    }

    await delay(180);
    const labs = appStorage.getLabs();
    const index = labs.findIndex((l) => l.id === id);
    if (index > -1) {
      const updated: LabResult = {
        ...labs[index],
        ...updates,
      };
      labs[index] = updated;
      appStorage.setLabs(labs);

      await auditService.logEvent({
        action: 'UPDATE',
        resourceType: 'LAB_RESULT',
        resourceId: id,
        patientId: updated.patientId,
        patientName: updated.patientName,
        details: `Updated lab result ${updated.testName} (${id})`,
      });

      return updated;
    }
    return undefined;
  },

  async deleteLabResult(id: string): Promise<boolean> {
    if (API_CONFIG.useBackendApi) {
      try {
        await httpClient.delete(`/labs/${id}`);
      } catch {
        // Fallback
      }
    }

    await delay(150);
    const labs = appStorage.getLabs();
    const target = labs.find((l) => l.id === id);
    const filtered = labs.filter((l) => l.id !== id);
    appStorage.setLabs(filtered);

    if (target) {
      await auditService.logEvent({
        action: 'DELETE',
        resourceType: 'LAB_RESULT',
        resourceId: id,
        patientId: target.patientId,
        patientName: target.patientName,
        details: `Deleted lab report ${target.testName} (${id})`,
      });
    }

    return filtered.length < labs.length;
  },
};
