import { Clinic } from '../../types';
import { appStorage } from '../storage/appStorage';
import { httpClient } from '../api/httpClient';
import { API_CONFIG } from '../api/config';
import { auditService } from '../audit/auditService';

const delay = (ms: number = 200) => new Promise((resolve) => setTimeout(resolve, ms));

export const clinicService = {
  async getClinics(search?: string, regionFilter?: string, typeFilter?: string): Promise<Clinic[]> {
    if (API_CONFIG.useBackendApi) {
      try {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (regionFilter && regionFilter !== 'ALL') params.set('region', regionFilter);
        if (typeFilter && typeFilter !== 'ALL') params.set('type', typeFilter);
        return await httpClient.get<Clinic[]>(`/clinics?${params.toString()}`);
      } catch {
        // Fallback
      }
    }

    await delay(150);
    const clinics = appStorage.getClinics();
    return clinics.filter((c) => {
      const q = search?.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.nameUz && c.nameUz.toLowerCase().includes(q)) ||
        (c.nameRu && c.nameRu.toLowerCase().includes(q)) ||
        c.address.toLowerCase().includes(q) ||
        c.region.toLowerCase().includes(q) ||
        c.adminName.toLowerCase().includes(q);

      const matchesRegion =
        !regionFilter ||
        regionFilter === 'ALL' ||
        c.regionKey === regionFilter ||
        c.region.toLowerCase().includes(regionFilter.toLowerCase());

      const matchesType = !typeFilter || typeFilter === 'ALL' || c.organizationType === typeFilter;

      return matchesSearch && matchesRegion && matchesType;
    });
  },

  async getClinicById(id: string): Promise<Clinic | undefined> {
    if (API_CONFIG.useBackendApi) {
      try {
        return await httpClient.get<Clinic>(`/clinics/${id}`);
      } catch {
        // Fallback
      }
    }

    await delay(100);
    return appStorage.getClinics().find((c) => c.id === id);
  },

  async createClinic(data: Omit<Clinic, 'id'>): Promise<Clinic> {
    const newId = `cln_${Date.now().toString(36)}`;
    const newClinic: Clinic = {
      ...data,
      id: newId,
    };

    if (API_CONFIG.useBackendApi) {
      try {
        const res = await httpClient.post<Clinic>('/clinics', newClinic);
        if (res) return res;
      } catch {
        // Fallback
      }
    }

    await delay(200);
    const clinics = appStorage.getClinics();
    appStorage.setClinics([newClinic, ...clinics]);

    await auditService.logEvent({
      action: 'CREATE',
      resourceType: 'CLINIC',
      resourceId: newId,
      details: `Registered medical facility ${newClinic.name} (${newClinic.region})`,
    });

    return newClinic;
  },

  async updateClinic(id: string, updates: Partial<Clinic>): Promise<Clinic | undefined> {
    if (API_CONFIG.useBackendApi) {
      try {
        return await httpClient.put<Clinic>(`/clinics/${id}`, updates);
      } catch {
        // Fallback
      }
    }

    await delay(180);
    const clinics = appStorage.getClinics();
    const index = clinics.findIndex((c) => c.id === id);
    if (index > -1) {
      const updated: Clinic = {
        ...clinics[index],
        ...updates,
      };
      clinics[index] = updated;
      appStorage.setClinics(clinics);

      await auditService.logEvent({
        action: 'UPDATE',
        resourceType: 'CLINIC',
        resourceId: id,
        details: `Updated clinic institutional parameters for ${updated.name}`,
      });

      return updated;
    }
    return undefined;
  },

  async deleteClinic(id: string): Promise<boolean> {
    if (API_CONFIG.useBackendApi) {
      try {
        await httpClient.delete(`/clinics/${id}`);
      } catch {
        // Fallback
      }
    }

    await delay(150);
    const clinics = appStorage.getClinics();
    const target = clinics.find((c) => c.id === id);
    const filtered = clinics.filter((c) => c.id !== id);
    appStorage.setClinics(filtered);

    if (target) {
      await auditService.logEvent({
        action: 'DELETE',
        resourceType: 'CLINIC',
        resourceId: id,
        details: `Removed healthcare facility record: ${target.name} (${id})`,
      });
    }

    return filtered.length < clinics.length;
  },
};
