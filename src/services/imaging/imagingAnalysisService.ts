import {
  XRayAnalysis,
  ImagingStudyMetadata,
  ImagingAnalysisRequest,
  ImagingAnalysisResponse,
  TimelineEvent,
  AnalysisStatus,
} from '../../types';
import { appStorage } from '../storage/appStorage';
import { httpClient } from '../api/httpClient';
import { API_CONFIG } from '../api/config';
import { auditService } from '../audit/auditService';
import { notificationService } from '../notifications/notificationService';
import { BUILT_IN_DEMO_SCANS, isBuiltInDemoAsset } from '../imageValidationService';

const delay = (ms: number = 200) => new Promise((resolve) => setTimeout(resolve, ms));

export const imagingAnalysisService = {
  /**
   * Universal Study Registration
   * Associates an uploaded radiograph with a patient and creates the initial study record.
   * Sends multipart/form-data with file, patientId, studyId to POST /imaging/studies
   */
  async createStudy(metadata: ImagingStudyMetadata, fileOrUrl?: File | string): Promise<XRayAnalysis> {
    const isSample = metadata.sourceOrigin === 'BUILT_IN_DEMO';
    const now = new Date().toISOString();

    const imageUrl = typeof fileOrUrl === 'string' ? fileOrUrl : (fileOrUrl ? URL.createObjectURL(fileOrUrl) : '');

    const newStudy: XRayAnalysis = {
      id: metadata.studyId,
      studyId: metadata.studyId,
      patientId: metadata.patientId,
      patientName: metadata.patientName,
      imageUrl,
      thumbnailUrl: imageUrl,
      sourceOrigin: metadata.sourceOrigin,
      fileName: metadata.fileName,
      fileType: metadata.fileType,
      fileSize: metadata.fileSize,
      fileSizeFormatted: metadata.fileSizeFormatted,
      uploadedAt: metadata.uploadedAt || now,
      uploadedBy: metadata.uploadedBy || 'Clinical Staff',
      analyzedAt: now,
      status: metadata.status === 'COMPLETED' ? 'COMPLETED' : 'READY',
      analysisStatus: metadata.status,
      riskScore: undefined,
      confidence: undefined,
      findings: [],
      impression: isSample
        ? 'Demo reference radiograph registered for clinical demonstration.'
        : 'Thoracic radiograph registered in patient archive. Ready for neural inference or physician sign-off.',
      modelVersion: 'TBDetect-Spring-Inference-v3.4',
      dicomMetadata: {
        viewPosition: metadata.viewPosition || 'PA (Posteroanterior)',
        kvp: isSample ? '120 kVp' : 'Standard Clinical',
        exposureTime: isSample ? '12 ms' : 'Auto',
        manufacturer: isSample ? 'Carestream DRX-Evolution (Demo)' : 'Clinical Digital Radiography',
      },
      isDemoSimulation: isSample,
    };

    // If connected to Spring Boot backend, persist via REST API (multipart/form-data: file, patientId, studyId)
    if (API_CONFIG.useBackendApi) {
      try {
        const formData = new FormData();
        formData.append('patientId', metadata.patientId);
        formData.append('studyId', metadata.studyId);
        formData.append('fileName', metadata.fileName);
        formData.append('fileType', metadata.fileType || 'image/jpeg');
        formData.append('fileSize', String(metadata.fileSize || 0));
        if (metadata.viewPosition) formData.append('viewPosition', metadata.viewPosition);
        if (metadata.sourceOrigin) formData.append('sourceOrigin', metadata.sourceOrigin);

        if (fileOrUrl instanceof File) {
          formData.append('file', fileOrUrl);
        } else if (typeof fileOrUrl === 'string') {
          formData.append('fileUrl', fileOrUrl);
        }

        const backendRes = await httpClient.post<XRayAnalysis>(`/imaging/studies`, formData);
        if (backendRes && (backendRes.id || backendRes.studyId)) {
          Object.assign(newStudy, backendRes);
        }
      } catch (err) {
        console.warn('[imagingAnalysisService] Backend POST /imaging/studies call failed, saving to local store:', err);
      }
    }

    // Persist in patient study store
    const existing = appStorage.getXRays();
    const filtered = existing.filter((s) => s.id !== newStudy.id && s.studyId !== newStudy.studyId);
    appStorage.setXRays([newStudy, ...filtered]);

    // Add Timeline Event
    const evt: TimelineEvent = {
      id: `evt_std_${Date.now().toString(36)}`,
      patientId: metadata.patientId,
      timestamp: now,
      type: 'XRAY_UPLOADED',
      title: 'Radiograph Study Registered',
      description: `Study ${metadata.studyId} registered for ${metadata.patientName}. File: ${metadata.fileName} (${metadata.fileSizeFormatted}). Origin: ${metadata.sourceOrigin}.`,
      authorName: metadata.uploadedBy || 'Staff Radiographer',
      authorRole: 'Medical Staff',
      severity: 'info',
    };
    appStorage.setTimeline([evt, ...appStorage.getTimeline()]);

    // Audit Log
    await auditService.logEvent({
      action: 'UPLOAD',
      resourceType: 'XRAY',
      resourceId: metadata.studyId,
      patientId: metadata.patientId,
      patientName: metadata.patientName,
      details: `Registered radiograph study: ${metadata.fileName} (${metadata.fileSizeFormatted}) [${metadata.studyId}]`,
    });

    return newStudy;
  },

  /**
   * Real Imaging Analysis Engine
   * Executes AI analysis pipeline for the study.
   *
   * Endpoint: POST /api/imaging/studies/{studyId}/analyze
   *
   * STRICT SAFETY DIRECTIVES:
   * 1. If real backend is connected (VITE_USE_BACKEND_API=true):
   *    Sends multipart POST to /api/imaging/studies/{studyId}/analyze and renders the real returned analysis.
   * 2. If real backend is NOT connected:
   *    - For DEMO cards (sourceOrigin === 'BUILT_IN_DEMO'):
   *      Renders explicit demo reference results clearly badged as SIMULATED.
   *    - For REAL USER UPLOADS (sourceOrigin === 'USER_UPLOAD'):
   *      NEVER invent fake TB scores or fake lesions! Returns status 'VERIFICATION_REQUIRED'
   *      with riskScore: null/undefined, findings: [], allowing clinical radiologist manual sign-off.
   */
  async analyzeStudy(request: ImagingAnalysisRequest): Promise<ImagingAnalysisResponse> {
    const isSample = request.sourceOrigin === 'BUILT_IN_DEMO';
    const now = new Date().toISOString();

    // 1. If backend API is active, call real Spring Boot neural inference endpoint: POST /api/imaging/studies/{studyId}/analyze
    if (API_CONFIG.useBackendApi) {
      try {
        const formData = new FormData();
        formData.append('patientId', request.patientId);
        formData.append('studyId', request.studyId);
        if (request.file) {
          formData.append('file', request.file);
        } else if (request.fileUrl) {
          formData.append('fileUrl', request.fileUrl);
        }

        const backendResult = await httpClient.post<ImagingAnalysisResponse>(
          `/imaging/studies/${request.studyId}/analyze`,
          formData
        );

        if (backendResult) {
          // Update study record in storage
          await this.updateStudyRecord(request.studyId, {
            status: backendResult.status === 'COMPLETED' ? 'COMPLETED' : 'VERIFICATION_REQUIRED',
            analysisStatus: backendResult.status,
            riskScore: backendResult.riskScore ?? undefined,
            riskLevel: backendResult.riskLevel ?? undefined,
            confidence: backendResult.confidence ?? undefined,
            findings: backendResult.findings || [],
            impression: backendResult.impression || 'AI analysis completed by clinical server.',
            heatmapUrl: backendResult.heatmapUrl,
            heatmapCoordinates: backendResult.heatmapCoordinates,
            modelVersion: backendResult.modelVersion || 'Spring-ResNet-CXR-v3.4',
            analyzedAt: backendResult.analyzedAt || now,
          });

          return backendResult;
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Inference service network failure';
        console.error('[imagingAnalysisService] Backend analysis error:', err);
        
        await this.updateStudyRecord(request.studyId, {
          status: 'FAILED',
          analysisStatus: 'FAILED',
          errorMessage: msg,
        });

        return {
          studyId: request.studyId,
          patientId: request.patientId,
          status: 'FAILED',
          analyzedAt: now,
          errorMessage: msg,
          isBackendConnected: true,
          isDemoSimulation: false,
        };
      }
    }

    // 2. Standalone / Sandbox Flow
    await delay(1000);

    // DEMO FLOW: Only for built-in sample reference scans explicitly chosen by user
    if (isSample) {
      const match = BUILT_IN_DEMO_SCANS.find((s) => s.url === request.fileUrl || s.id === request.fileUrl);
      const score = match?.score ?? 84;
      const riskLevel = match?.riskLevel ?? 'HIGH';
      const title = match?.title ?? 'Reference Demo Radiograph';

      const demoResponse: ImagingAnalysisResponse = {
        studyId: request.studyId,
        patientId: request.patientId,
        status: 'COMPLETED',
        riskScore: score,
        riskLevel,
        confidence: 0.92,
        findings: [
          {
            zone: 'UPPER_RIGHT_LOBE',
            description: `[DEMO SIMULATION] ${title}: Apical fibro-cavitary consolidation with parenchymal infiltration.`,
            confidence: 0.89,
            boundingPoly: { x: 52, y: 16, width: 34, height: 30 },
          },
        ],
        impression: `[DEMO SIMULATION] ${title}. Reference pattern demonstrates high radiological suspicion of active pulmonary mycobacterial infection.`,
        heatmapCoordinates: [{ x: 68, y: 32, radius: 26, intensity: 0.88 }],
        modelVersion: 'TBDetect-DemoRef-v3.4 (Simulated)',
        analyzedAt: now,
        isBackendConnected: false,
        isDemoSimulation: true,
      };

      await this.updateStudyRecord(request.studyId, {
        status: 'COMPLETED',
        analysisStatus: 'COMPLETED',
        riskScore: score,
        riskLevel,
        confidence: 0.92,
        findings: demoResponse.findings,
        impression: demoResponse.impression,
        heatmapCoordinates: demoResponse.heatmapCoordinates,
        modelVersion: demoResponse.modelVersion,
        analyzedAt: now,
        isDemoSimulation: true,
      });

      return demoResponse;
    }

    // REAL USER UPLOAD FLOW: Strict medical integrity
    // The frontend NEVER invents fake TB scores or fake red lesions for arbitrary images!
    const truthfulResponse: ImagingAnalysisResponse = {
      studyId: request.studyId,
      patientId: request.patientId,
      status: 'VERIFICATION_REQUIRED',
      riskScore: undefined, // Not available
      confidence: undefined,
      findings: [], // No fake lesions or cavities
      impression:
        'Chest radiograph validated and archived. Deep neural inference requires live connection to clinical AI inference server (VITE_USE_BACKEND_API). Radiograph is ready for physician radiologist diagnostic sign-off.',
      modelVersion: 'TBDetect-PACS-Interface-v3.4',
      analyzedAt: now,
      isBackendConnected: false,
      isDemoSimulation: false,
    };

    await this.updateStudyRecord(request.studyId, {
      status: 'VERIFICATION_REQUIRED',
      analysisStatus: 'VERIFICATION_REQUIRED',
      riskScore: undefined,
      confidence: undefined,
      findings: [],
      impression: truthfulResponse.impression,
      modelVersion: truthfulResponse.modelVersion,
      analyzedAt: now,
      isDemoSimulation: false,
    });

    // Notify staff
    await notificationService.emitNotification({
      title: 'Radiograph Ready for Radiologist Review',
      message: `Study ${request.studyId} for patient is archived and pending specialist clinical evaluation.`,
      type: 'REVIEW_PENDING',
      patientId: request.patientId,
      patientName: 'Patient Dossier',
      severity: 'info',
    });

    return truthfulResponse;
  },

  /**
   * Fetch specific study result: GET /api/imaging/studies/{studyId}/result
   */
  async getStudyResult(studyId: string): Promise<ImagingAnalysisResponse | null> {
    if (API_CONFIG.useBackendApi) {
      try {
        return await httpClient.get<ImagingAnalysisResponse>(`/imaging/studies/${studyId}/result`);
      } catch (err) {
        console.warn(`[imagingAnalysisService] GET /imaging/studies/${studyId}/result failed:`, err);
      }
    }
    const study = await this.getStudyById(studyId);
    if (!study) return null;
    return {
      studyId: study.studyId || study.id,
      patientId: study.patientId,
      status: study.analysisStatus || study.status as AnalysisStatus,
      riskScore: study.riskScore,
      riskLevel: study.riskLevel,
      confidence: study.confidence,
      findings: study.findings || [],
      impression: study.impression,
      heatmapUrl: study.heatmapUrl,
      heatmapCoordinates: study.heatmapCoordinates,
      modelVersion: study.modelVersion,
      analyzedAt: study.analyzedAt,
      isBackendConnected: API_CONFIG.useBackendApi,
      isDemoSimulation: study.isDemoSimulation,
    };
  },

  /**
   * Helper to update an existing study record in local storage
   */
  async updateStudyRecord(studyId: string, updates: Partial<XRayAnalysis>): Promise<XRayAnalysis | undefined> {
    const xrays = appStorage.getXRays();
    const index = xrays.findIndex((x) => x.id === studyId || x.studyId === studyId);
    if (index > -1) {
      const updated = { ...xrays[index], ...updates };
      xrays[index] = updated;
      appStorage.setXRays(xrays);
      return updated;
    }
    return undefined;
  },

  /**
   * Retrieve a specific study by ID
   */
  async getStudyById(studyId: string): Promise<XRayAnalysis | undefined> {
    if (API_CONFIG.useBackendApi) {
      try {
        return await httpClient.get<XRayAnalysis>(`/imaging/studies/${studyId}`);
      } catch {
        // Fallback to local store
      }
    }
    await delay(60);
    return appStorage.getXRays().find((x) => x.id === studyId || x.studyId === studyId);
  },

  /**
   * Retrieve all studies for a specific patient
   */
  async getStudiesByPatientId(patientId: string): Promise<XRayAnalysis[]> {
    if (API_CONFIG.useBackendApi) {
      try {
        return await httpClient.get<XRayAnalysis[]>(`/patients/${patientId}/imaging`);
      } catch {
        // Fallback to local store
      }
    }
    await delay(80);
    return appStorage
      .getXRays()
      .filter((x) => x.patientId === patientId)
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  },

  /**
   * Remove a study from patient records with confirmation
   */
  async deleteStudy(studyId: string, patientId?: string): Promise<boolean> {
    if (API_CONFIG.useBackendApi) {
      try {
        await httpClient.delete(`/imaging/studies/${studyId}`);
      } catch {
        // Fallback
      }
    }
    await delay(120);
    const xrays = appStorage.getXRays();
    const target = xrays.find((x) => x.id === studyId || x.studyId === studyId);
    const filtered = xrays.filter((x) => x.id !== studyId && x.studyId !== studyId);
    appStorage.setXRays(filtered);

    if (target) {
      await auditService.logEvent({
        action: 'DELETE',
        resourceType: 'XRAY',
        resourceId: studyId,
        patientId: patientId || target.patientId,
        patientName: target.patientName,
        details: `Deleted imaging study ${studyId}`,
      });
    }

    return filtered.length < xrays.length;
  },
};
