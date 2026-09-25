import { CoughAnalysis, TimelineEvent } from '../../types';
import { appStorage } from '../storage/appStorage';
import { httpClient } from '../api/httpClient';
import { API_CONFIG } from '../api/config';
import { auditService } from '../audit/auditService';
import { notificationService } from '../notifications/notificationService';

const delay = (ms: number = 200) => new Promise((resolve) => setTimeout(resolve, ms));

export const coughService = {
  getCoughByPatientId(patientId: string): Promise<CoughAnalysis[]> {
    return this.getCoughsByPatientId(patientId);
  },

  async getCoughsByPatientId(patientId: string): Promise<CoughAnalysis[]> {
    if (API_CONFIG.useBackendApi) {
      try {
        return await httpClient.get<CoughAnalysis[]>(`/patients/${patientId}/cough-analyses`);
      } catch {
        // Fallback
      }
    }
    await delay(120);
    return appStorage.getCoughs().filter((c) => c.patientId === patientId);
  },

  async getCoughById(id: string): Promise<CoughAnalysis | undefined> {
    if (API_CONFIG.useBackendApi) {
      try {
        return await httpClient.get<CoughAnalysis>(`/cough-analyses/${id}`);
      } catch {
        // Fallback
      }
    }
    await delay(100);
    return appStorage.getCoughs().find((c) => c.id === id);
  },

  async saveCoughRecording(data: {
    patientId: string;
    patientName: string;
    durationSeconds: number;
    audioUrl?: string;
    waveformData?: number[];
    isSampleDemo?: boolean;
    tbAcousticScore?: number;
    riskLevel?: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
    confidence?: number;
    interpretation?: string;
  }): Promise<CoughAnalysis> {
    const newId = `cough_${Date.now().toString(36)}`;
    const now = new Date().toISOString();
    const isSample = Boolean(data.isSampleDemo);

    let newAnalysis: CoughAnalysis;

    if (isSample) {
      // Demo preset sample
      newAnalysis = {
        id: newId,
        patientId: data.patientId,
        patientName: data.patientName,
        recordedAt: now,
        durationSeconds: data.durationSeconds || 4.2,
        audioUrl: data.audioUrl,
        audioWaveformData: data.waveformData || [12, 45, 89, 72, 34, 18, 92, 85, 41, 15, 6],
        explosivePhaseDurationMs: 148,
        energySpectralDensity: 0.82,
        tbAcousticScore: data.tbAcousticScore ?? 74,
        riskLevel: data.riskLevel ?? 'HIGH',
        confidence: data.confidence ?? 0.86,
        interpretation: data.interpretation || 'High acoustic energy in 1.5–3 kHz frequency band matching TB cavitation profile.',
        acousticClassification: 'Pathological Explosive Cough Pattern',
        impression: 'Biomarker features indicate substantial glottal vibration irregularity.',
        status: 'COMPLETED',
        isDemoSimulation: true,
      };
    } else {
      // Real user microphone recording: Status is PENDING / AWAITING_BACKEND. No fake diagnosis!
      newAnalysis = {
        id: newId,
        patientId: data.patientId,
        patientName: data.patientName,
        recordedAt: now,
        durationSeconds: data.durationSeconds || 3.0,
        audioUrl: data.audioUrl,
        audioWaveformData: data.waveformData || [10, 25, 40, 60, 45, 30, 15],
        explosivePhaseDurationMs: 0,
        energySpectralDensity: 0,
        tbAcousticScore: 0,
        riskLevel: 'LOW',
        confidence: 0,
        interpretation: 'Audio sample recorded and encrypted. Waiting for Spring Boot acoustic AI inference server.',
        acousticClassification: 'Acoustic Processing Pending',
        impression: 'Awaiting spectral neural feature extraction.',
        status: 'PENDING',
        isDemoSimulation: false,
      };
    }

    if (API_CONFIG.useBackendApi) {
      try {
        const res = await httpClient.post<CoughAnalysis>(`/patients/${data.patientId}/cough-analyses`, newAnalysis);
        if (res) newAnalysis = res;
      } catch {
        // Fallback
      }
    }

    await delay(200);
    const coughs = appStorage.getCoughs();
    appStorage.setCoughs([newAnalysis, ...coughs]);

    // Timeline event
    const evt: TimelineEvent = {
      id: `evt_cough_${Date.now().toString(36)}`,
      patientId: data.patientId,
      timestamp: now,
      type: 'COUGH_ANALYSIS',
      title: 'Acoustic Cough Biomarker Recorded',
      description: `Duration: ${newAnalysis.durationSeconds}s. Status: ${newAnalysis.status}. ${isSample ? '[Demo Reference Audio]' : '[Clinical Audio Sample]'}`,
      authorName: 'Acoustic Screening Module',
      authorRole: 'Screening Device',
      severity: isSample ? 'warning' : 'info',
    };
    appStorage.setTimeline([evt, ...appStorage.getTimeline()]);

    // Audit log
    await auditService.logEvent({
      action: 'CREATE',
      resourceType: 'COUGH',
      resourceId: newId,
      patientId: data.patientId,
      patientName: data.patientName,
      details: `Saved cough acoustic study (${newAnalysis.durationSeconds}s). Status: ${newAnalysis.status}`,
    });

    if (newAnalysis.riskLevel === 'HIGH' || newAnalysis.riskLevel === 'CRITICAL') {
      await notificationService.emitNotification({
        title: 'High Cough Acoustic Risk',
        message: `Acoustic biomarker score for ${data.patientName}: ${newAnalysis.tbAcousticScore}/100.`,
        type: 'HIGH_RISK_ALERT',
        patientId: data.patientId,
        patientName: data.patientName,
        severity: 'warning',
      });
    }

    return newAnalysis;
  },

  saveCough(data: Partial<CoughAnalysis> & { patientId: string }): Promise<CoughAnalysis> {
    return this.saveCoughRecording({
      patientId: data.patientId,
      patientName: data.patientName || 'Screened Patient',
      durationSeconds: data.durationSeconds || 4.0,
      audioUrl: data.audioUrl,
      waveformData: data.audioWaveformData,
      isSampleDemo: data.isDemoSimulation,
      tbAcousticScore: data.tbAcousticScore,
      riskLevel: data.riskLevel,
      confidence: data.confidence,
      interpretation: data.interpretation,
    });
  },

  async deleteCough(id: string): Promise<boolean> {
    if (API_CONFIG.useBackendApi) {
      try {
        await httpClient.delete(`/cough-analyses/${id}`);
      } catch {
        // Fallback
      }
    }

    await delay(150);
    const coughs = appStorage.getCoughs();
    const target = coughs.find((c) => c.id === id);
    const filtered = coughs.filter((c) => c.id !== id);
    appStorage.setCoughs(filtered);

    if (target) {
      await auditService.logEvent({
        action: 'DELETE',
        resourceType: 'COUGH',
        resourceId: id,
        patientId: target.patientId,
        patientName: target.patientName,
        details: `Deleted cough acoustic record ${id}`,
      });
    }

    return filtered.length < coughs.length;
  },
};
