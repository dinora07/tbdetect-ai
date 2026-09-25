import { AnalyticsSummary } from '../../types';
import { appStorage } from '../storage/appStorage';
import { httpClient } from '../api/httpClient';
import { API_CONFIG } from '../api/config';

const delay = (ms: number = 200) => new Promise((resolve) => setTimeout(resolve, ms));

export const analyticsService = {
  getAnalytics(): Promise<AnalyticsSummary> {
    return this.getSummary();
  },

  async getSummary(): Promise<AnalyticsSummary> {
    if (API_CONFIG.useBackendApi) {
      try {
        return await httpClient.get<AnalyticsSummary>('/analytics/summary');
      } catch {
        // Fallback
      }
    }
    await delay(150);
    return appStorage.computeAnalyticsSummary();
  },

  async getEpidemiologyReport(period: 'month' | 'quarter' | 'year' = 'month'): Promise<{
    period: string;
    totalScreenings: number;
    confirmedCases: number;
    treatmentSuccessRate: number;
    regionBreakdown: { region: string; cases: number; rate: number }[];
  }> {
    if (API_CONFIG.useBackendApi) {
      try {
        return await httpClient.get(`/analytics/epidemiology?period=${period}`);
      } catch {
        // Fallback
      }
    }
    await delay(150);
    const patients = appStorage.getPatients();
    const regionMap: Record<string, number> = {};
    patients.forEach((p) => {
      const reg = p.region || 'Toshkent shahri';
      regionMap[reg] = (regionMap[reg] || 0) + 1;
    });

    return {
      period,
      totalScreenings: appStorage.getXRays().length + appStorage.getCoughs().length,
      confirmedCases: patients.filter((p) => p.riskLevel === 'HIGH' || p.riskLevel === 'CRITICAL').length,
      treatmentSuccessRate: 92.4,
      regionBreakdown: Object.entries(regionMap).map(([region, cases]) => ({
        region,
        cases,
        rate: Math.round((cases / Math.max(1, patients.length)) * 100),
      })),
    };
  },
};
