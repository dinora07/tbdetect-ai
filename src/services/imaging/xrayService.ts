import { XRayAnalysis, TimelineEvent, FileValidationResult, RiskLevel } from '../../types';
import { appStorage } from '../storage/appStorage';
import { httpClient } from '../api/httpClient';
import { API_CONFIG } from '../api/config';
import { auditService } from '../audit/auditService';
import { notificationService } from '../notifications/notificationService';
import { isBuiltInDemoAsset, BUILT_IN_DEMO_SCANS, imageValidationService } from '../imageValidationService';

const delay = (ms: number = 200) => new Promise((resolve) => setTimeout(resolve, ms));

export const xrayService = {
  async validateFile(
    fileOrUrl: File | string,
    fileName?: string,
    fileSize?: number
  ): Promise<FileValidationResult> {
    return imageValidationService.validateFile(fileOrUrl, fileName, fileSize);
  },

  async getXRaysByPatientId(patientId: string): Promise<XRayAnalysis[]> {
    if (API_CONFIG.useBackendApi) {
      try {
        return await httpClient.get<XRayAnalysis[]>(`/patients/${patientId}/xrays`);
      } catch {
        // Fallback
      }
    }
    await delay(120);
    return appStorage.getXRays().filter((x) => x.patientId === patientId);
  },

  async getAllXRays(): Promise<XRayAnalysis[]> {
    if (API_CONFIG.useBackendApi) {
      try {
        return await httpClient.get<XRayAnalysis[]>('/xrays');
      } catch {
        // Fallback
      }
    }
    await delay(150);
    return appStorage.getXRays();
  },

  async getXRayById(id: string): Promise<XRayAnalysis | undefined> {
    if (API_CONFIG.useBackendApi) {
      try {
        return await httpClient.get<XRayAnalysis>(`/xrays/${id}`);
      } catch {
        // Fallback
      }
    }
    await delay(100);
    return appStorage.getXRays().find((x) => x.id === id);
  },

  async analyzeDemoXray(
    patientId: string,
    imageUrl: string,
    uploadedBy: string = 'Dr. Sarah Chen, MD',
    sampleMeta?: {
      score?: number;
      riskLevel?: RiskLevel;
      title?: string;
      viewPosition?: string;
    }
  ): Promise<XRayAnalysis> {
    const patients = appStorage.getPatients();
    const patient = patients.find((p) => p.id === patientId);
    const patientName = patient ? `${patient.firstName} ${patient.lastName}` : 'Screened Patient';

    const match = BUILT_IN_DEMO_SCANS.find((s) => s.url === imageUrl || s.id === imageUrl);
    const score = sampleMeta?.score ?? match?.score ?? 78;
    const riskLevel = sampleMeta?.riskLevel ?? match?.riskLevel ?? 'HIGH';
    const viewPosition = sampleMeta?.viewPosition ?? match?.viewPosition ?? 'PA (Posteroanterior)';
    const title = sampleMeta?.title ?? match?.title ?? 'Reference Demo Radiograph';

    const newId = `xray_${Date.now().toString(36)}`;
    const now = new Date().toISOString();

    const demoStudy: XRayAnalysis = {
      id: newId,
      patientId,
      patientName,
      imageUrl,
      thumbnailUrl: imageUrl,
      sourceOrigin: 'BUILT_IN_DEMO',
      isDemoSimulation: true,
      uploadedAt: now,
      uploadedBy,
      analyzedAt: now,
      status: 'COMPLETED',
      riskScore: score,
      riskLevel,
      confidence: 0.91,
      findings: [
        {
          zone: 'UPPER_RIGHT_LOBE',
          description: `[DEMO SIMULATION] ${title}: Apical fibro-cavitary opacification identified with localized parenchymal consolidation.`,
          confidence: 0.89,
          boundingPoly: { x: 52, y: 16, width: 34, height: 30 },
        },
      ],
      impression: `[DEMO SIMULATION] Radiological presentation: ${title}. High sensitivity screening marker. Requires molecular correlation.`,
      heatmapCoordinates: [{ x: 68, y: 32, radius: 26, intensity: 0.88 }],
      dicomMetadata: {
        viewPosition,
        kvp: '120 kVp',
        exposureTime: '12 ms',
        manufacturer: 'Carestream DRX-Evolution (Demo Mode)',
      },
    };

    const xrays = appStorage.getXRays();
    appStorage.setXRays([demoStudy, ...xrays]);

    // Timeline event
    const evt: TimelineEvent = {
      id: `evt_xray_${Date.now().toString(36)}`,
      patientId,
      timestamp: now,
      type: 'AI_ANALYSIS_COMPLETED',
      title: 'Demo CXR Analyzed (Simulated)',
      description: `Analysis completed for ${title}. Score: ${score}% (${riskLevel}). Source: Built-in reference sample.`,
      authorName: uploadedBy,
      authorRole: 'Screening Radiologist',
      severity: riskLevel === 'HIGH' || riskLevel === 'CRITICAL' ? 'alert' : 'info',
    };
    appStorage.setTimeline([evt, ...appStorage.getTimeline()]);

    await auditService.logEvent({
      action: 'CREATE',
      resourceType: 'XRAY',
      resourceId: newId,
      patientId,
      patientName,
      details: `Loaded demo sample CXR analysis: ${title} (${score}%)`,
    });

    return demoStudy;
  },

  /**
   * Creates a new radiograph study.
   * Safety rule: Real user uploads are never assigned a fabricated AI diagnosis.
   * If the real neural inference backend is not connected, the study remains PENDING/VERIFICATION_REQUIRED.
   */
  async createStudy(studyData: {
    patientId: string;
    patientName: string;
    imageUrl: string;
    thumbnailUrl?: string;
    viewPosition?: string;
    uploadedBy?: string;
  }): Promise<XRayAnalysis> {
    const isSample = isBuiltInDemoAsset(studyData.imageUrl);
    const newId = `xray_${Date.now().toString(36)}`;
    const now = new Date().toISOString();

    let newStudy: XRayAnalysis;

    if (isSample) {
      const match = BUILT_IN_DEMO_SCANS.find((s) => s.url === studyData.imageUrl || s.id === studyData.imageUrl);
      newStudy = {
        id: newId,
        patientId: studyData.patientId,
        patientName: studyData.patientName,
        imageUrl: studyData.imageUrl,
        thumbnailUrl: studyData.thumbnailUrl || studyData.imageUrl,
        sourceOrigin: 'BUILT_IN_DEMO',
        isDemoSimulation: true,
        uploadedAt: now,
        uploadedBy: studyData.uploadedBy || 'Dr. Sarah Chen, MD',
        analyzedAt: now,
        status: 'COMPLETED',
        riskScore: match?.score ?? 78,
        riskLevel: match?.riskLevel ?? 'HIGH',
        confidence: 0.89,
        findings: [
          {
            zone: 'UPPER_RIGHT_LOBE',
            description: `${match?.title || 'Sample CXR'}: Reticulonodular opacities identified (Demo Reference Scan).`,
            confidence: 0.88,
            boundingPoly: { x: 55, y: 18, width: 32, height: 28 },
          },
        ],
        impression: `[DEMO REFERENCE SCAN] Simulated presentation: ${match?.title || 'Radiological pattern'}. Requires clinical correlation.`,
        heatmapCoordinates: [{ x: 68, y: 32, radius: 24, intensity: 0.85 }],
        dicomMetadata: {
          viewPosition: studyData.viewPosition || 'PA (Posteroanterior)',
          kvp: '120 kVp',
          exposureTime: '12 ms',
          manufacturer: 'Carestream DRX-Evolution (Demo Calibration)',
        },
      };
    } else {
      // Real user-uploaded scan: Clean, truthful clinical workflow
      // Marked as PENDING or VERIFICATION_REQUIRED; NO fake fabricated findings!
      newStudy = {
        id: newId,
        patientId: studyData.patientId,
        patientName: studyData.patientName,
        imageUrl: studyData.imageUrl,
        thumbnailUrl: studyData.thumbnailUrl || studyData.imageUrl,
        sourceOrigin: 'USER_UPLOAD',
        isDemoSimulation: false,
        uploadedAt: now,
        uploadedBy: studyData.uploadedBy || 'Clinical Staff',
        analyzedAt: now,
        status: 'PENDING',
        riskScore: 0,
        riskLevel: 'LOW',
        confidence: 0,
        findings: [],
        impression: 'Radiograph uploaded. Waiting for Spring Boot neural inference or physician radiologist review.',
        dicomMetadata: {
          viewPosition: studyData.viewPosition || 'PA (Posteroanterior)',
          kvp: 'Standard Clinical',
          exposureTime: 'Auto-Exposure',
          manufacturer: 'Hospital PACS / Direct User Upload',
        },
      };
    }

    if (API_CONFIG.useBackendApi) {
      try {
        const backendRes = await httpClient.post<XRayAnalysis>(`/patients/${studyData.patientId}/xrays`, newStudy);
        if (backendRes) newStudy = backendRes;
      } catch {
        // Fallback
      }
    }

    await delay(250);
    const xrays = appStorage.getXRays();
    appStorage.setXRays([newStudy, ...xrays]);

    // Timeline event
    const evt: TimelineEvent = {
      id: `evt_xray_${Date.now().toString(36)}`,
      patientId: studyData.patientId,
      timestamp: now,
      type: 'XRAY_UPLOADED',
      title: 'Chest Radiograph Uploaded',
      description: `New radiograph registered for ${studyData.patientName}. Status: ${newStudy.status}. Source: ${newStudy.sourceOrigin}.`,
      authorName: studyData.uploadedBy || 'Staff Radiographer',
      authorRole: 'Medical Staff',
      severity: isSample ? 'warning' : 'info',
    };
    appStorage.setTimeline([evt, ...appStorage.getTimeline()]);

    // Audit log
    await auditService.logEvent({
      action: 'UPLOAD',
      resourceType: 'XRAY',
      resourceId: newId,
      patientId: studyData.patientId,
      patientName: studyData.patientName,
      details: `Registered chest radiograph (${newStudy.dicomMetadata?.viewPosition || 'PA'}). Origin: ${newStudy.sourceOrigin}`,
    });

    // Notification
    await notificationService.emitNotification({
      title: 'Radiograph Study Uploaded',
      message: `Chest radiograph for ${studyData.patientName} is ready for physician triage.`,
      type: 'REVIEW_PENDING',
      patientId: studyData.patientId,
      patientName: studyData.patientName,
      severity: 'info',
    });

    return newStudy;
  },

  async submitDoctorReview(
    xrayId: string,
    review: {
      clinicalDecision: 'CONFIRMED_SUSPICION' | 'NEGATIVE' | 'INCONCLUSIVE_REFER' | 'REQUEST_ADDITIONAL_TESTS';
      notes: string;
      doctorName: string;
      reviewedBy?: string;
    }
  ): Promise<XRayAnalysis | undefined> {
    if (API_CONFIG.useBackendApi) {
      try {
        return await httpClient.post<XRayAnalysis>(`/xrays/${xrayId}/review`, review);
      } catch {
        // Fallback
      }
    }

    await delay(200);
    const xrays = appStorage.getXRays();
    const index = xrays.findIndex((x) => x.id === xrayId);
    if (index > -1) {
      const now = new Date().toISOString();
      const updated: XRayAnalysis = {
        ...xrays[index],
        status: 'COMPLETED',
        doctorReview: {
          clinicalDecision: review.clinicalDecision,
          notes: review.notes,
          doctorName: review.doctorName,
          reviewedBy: review.reviewedBy || 'usr_doc_0',
          reviewedAt: now,
          signed: true,
        },
      };
      xrays[index] = updated;
      appStorage.setXRays(xrays);

      const revEvt: TimelineEvent = {
        id: `evt_rev_${Date.now().toString(36)}`,
        patientId: updated.patientId,
        timestamp: now,
        type: 'DOCTOR_REVIEW',
        title: 'Physician Review Signed',
        description: `Decision: ${review.clinicalDecision.replace(/_/g, ' ')}. Reviewed by ${review.doctorName}. Notes: "${review.notes}"`,
        authorName: review.doctorName,
        authorRole: 'Attending Pulmonologist',
        severity: review.clinicalDecision === 'CONFIRMED_SUSPICION' ? 'alert' : 'info',
      };
      appStorage.setTimeline([revEvt, ...appStorage.getTimeline()]);

      await auditService.logEvent({
        action: 'UPDATE',
        resourceType: 'XRAY',
        resourceId: xrayId,
        patientId: updated.patientId,
        patientName: updated.patientName,
        details: `Signed clinical review: ${review.clinicalDecision}. Doctor: ${review.doctorName}`,
      });

      return updated;
    }
    return undefined;
  },

  async deleteStudy(xrayId: string): Promise<boolean> {
    if (API_CONFIG.useBackendApi) {
      try {
        await httpClient.delete(`/xrays/${xrayId}`);
      } catch {
        // Fallback
      }
    }

    await delay(150);
    const xrays = appStorage.getXRays();
    const target = xrays.find((x) => x.id === xrayId);
    const filtered = xrays.filter((x) => x.id !== xrayId);
    appStorage.setXRays(filtered);

    if (target) {
      await auditService.logEvent({
        action: 'DELETE',
        resourceType: 'XRAY',
        resourceId: xrayId,
        patientId: target.patientId,
        patientName: target.patientName,
        details: `Deleted radiograph study ${xrayId}`,
      });
    }

    return filtered.length < xrays.length;
  },

  deleteXray(xrayId: string): Promise<boolean> {
    return this.deleteStudy(xrayId);
  },
};
