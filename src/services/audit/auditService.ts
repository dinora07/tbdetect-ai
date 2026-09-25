import { AuditLog, Role } from '../../types';
import { appStorage } from '../storage/appStorage';
import { httpClient } from '../api/httpClient';
import { API_CONFIG } from '../api/config';

const delay = (ms: number = 200) => new Promise((resolve) => setTimeout(resolve, ms));

export const auditService = {
  async getAuditLogs(filter?: {
    resourceType?: string;
    action?: string;
    search?: string;
  }): Promise<AuditLog[]> {
    if (API_CONFIG.useBackendApi) {
      try {
        const queryParams = new URLSearchParams();
        if (filter?.resourceType) queryParams.set('resourceType', filter.resourceType);
        if (filter?.action) queryParams.set('action', filter.action);
        if (filter?.search) queryParams.set('search', filter.search);
        return await httpClient.get<AuditLog[]>(`/audit/logs?${queryParams.toString()}`);
      } catch {
        // Fallback to local
      }
    }

    await delay(150);
    const logs = appStorage.getAuditLogs();
    return logs
      .filter((l) => {
        const matchesType = !filter?.resourceType || filter.resourceType === 'ALL' || l.resourceType === filter.resourceType;
        const matchesAction = !filter?.action || filter.action === 'ALL' || l.action.toLowerCase().includes(filter.action.toLowerCase());
        const matchesSearch =
          !filter?.search ||
          l.userName.toLowerCase().includes(filter.search.toLowerCase()) ||
          l.details.toLowerCase().includes(filter.search.toLowerCase()) ||
          l.resourceId.toLowerCase().includes(filter.search.toLowerCase());
        return matchesType && matchesAction && matchesSearch;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  async logEvent(event: {
    userId?: string;
    userName?: string;
    userRole?: Role;
    action: string;
    resourceType: 'PATIENT' | 'XRAY' | 'COUGH' | 'LAB_RESULT' | 'TREATMENT' | 'USER' | 'CLINIC' | 'SYSTEM_CONFIG' | 'AUTH' | 'NOTIFICATION';
    resourceId: string;
    patientId?: string;
    patientName?: string;
    module?: string;
    status?: 'SUCCESS' | 'DENIED' | 'FAILED';
    details: string;
  }): Promise<AuditLog> {
    const newLog: AuditLog = {
      id: `aud_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      userId: event.userId || 'usr_doc_0',
      userName: event.userName || 'Sharipova Dinora',
      userRole: event.userRole || 'DOCTOR',
      action: event.action,
      resourceType: event.resourceType,
      resourceId: event.resourceId,
      patientId: event.patientId,
      patientName: event.patientName,
      module: event.module || event.resourceType,
      ipAddress: '127.0.0.1 (Frontend Session)',
      status: event.status || 'SUCCESS',
      details: event.details,
    };

    if (API_CONFIG.useBackendApi) {
      try {
        await httpClient.post<AuditLog>('/audit/logs', newLog);
      } catch {
        // Fallback to storage
      }
    }

    const current = appStorage.getAuditLogs();
    appStorage.setAuditLogs([newLog, ...current]);

    // Dispatch global event for listeners
    window.dispatchEvent(new CustomEvent('tbdetect_audit_logged', { detail: newLog }));

    return newLog;
  },
};
