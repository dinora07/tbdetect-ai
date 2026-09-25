/**
 * Central API & Service Layer Abstraction for TBDetect AI
 * 
 * Supports both:
 * 1. Java Spring Boot REST + PostgreSQL backend integration (via VITE_USE_BACKEND_API & httpClient)
 * 2. High-performance persistent offline/sandbox execution (via appStorage & localStorage)
 */

import {
  TimelineEvent,
  AiChatMessage,
  Clinic,
  User,
  AuditLog,
} from '../types';
import { appStorage } from './storage/appStorage';
import { auditService } from './audit/auditService';
import { userService } from './users/userService';
import { clinicService } from './clinics/clinicService';

// Re-export modular services
export * from './api/config';
export * from './api/httpClient';
export * from './storage/appStorage';
export * from './audit/auditService';
export * from './notifications/notificationService';
export * from './patients/patientService';
export * from './imaging/xrayService';
export * from './imaging/imagingAnalysisService';
export * from './imaging/coughService';
export * from './laboratory/labService';
export * from './treatment/treatmentService';
export * from './users/userService';
export * from './clinics/clinicService';
export * from './symptoms/symptomService';
export * from './analytics/analyticsService';
export * from './imageValidationService';

const delay = (ms: number = 200) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Timeline Service
 */
export const timelineService = {
  async getTimelineByPatientId(patientId: string): Promise<TimelineEvent[]> {
    await delay(120);
    return appStorage
      .getTimeline()
      .filter((e) => e.patientId === patientId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  async addTimelineEvent(eventData: Omit<TimelineEvent, 'id' | 'timestamp'>): Promise<TimelineEvent> {
    const newEvent: TimelineEvent = {
      ...eventData,
      id: `evt_${Date.now().toString(36)}`,
      timestamp: new Date().toISOString(),
    };
    const timeline = appStorage.getTimeline();
    appStorage.setTimeline([newEvent, ...timeline]);
    return newEvent;
  },
};

/**
 * Admin Service (aggregates user, clinic, and audit operations)
 */
export const adminService = {
  async getUsers(search?: string, roleFilter?: string): Promise<User[]> {
    return userService.getUsers(search, roleFilter);
  },

  async getClinics(search?: string, regionFilter?: string, typeFilter?: string): Promise<Clinic[]> {
    return clinicService.getClinics(search, regionFilter, typeFilter);
  },

  async getAuditLogs(filter?: { resourceType?: string; action?: string; search?: string }): Promise<AuditLog[]> {
    return auditService.getAuditLogs(filter);
  },

  async createUser(userData: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    return userService.createUser(userData);
  },

  async updateUser(userId: string, data: Partial<User>): Promise<User | undefined> {
    return userService.updateUser(userId, data);
  },

  async toggleUserStatus(userId: string): Promise<User | undefined> {
    return userService.toggleUserStatus(userId);
  },

  async deleteUser(userId: string): Promise<boolean> {
    return userService.deleteUser(userId);
  },

  async createClinic(clinicData: Omit<Clinic, 'id'>): Promise<Clinic> {
    return clinicService.createClinic(clinicData);
  },

  async updateClinic(clinicId: string, data: Partial<Clinic>): Promise<Clinic | undefined> {
    return clinicService.updateClinic(clinicId, data);
  },

  async deleteClinic(clinicId: string): Promise<boolean> {
    return clinicService.deleteClinic(clinicId);
  },
};

/**
 * Clinical AI Decision Support Assistant
 */
export const aiAssistantService = {
  async sendMessage(userMessage: string, patientContextId?: string): Promise<AiChatMessage> {
    await delay(600);
    const patients = appStorage.getPatients();
    const targetPatient = patientContextId ? patients.find((p) => p.id === patientContextId) : patients[0];
    const lower = userMessage.toLowerCase();
    let responseText = '';
    const suggestedActions: { label: string; actionType: string; payload?: unknown }[] = [];

    if (lower.includes('summarize') || lower.includes('profile') || lower.includes('rustam') || (targetPatient && lower.includes(targetPatient.firstName.toLowerCase()))) {
      responseText = `**Clinical Dossier Summary for ${targetPatient?.firstName} ${targetPatient?.lastName} (${targetPatient?.nationalId}):**\n\n` +
        `• **Demographics:** ${targetPatient?.age}-year-old ${targetPatient?.gender.toLowerCase()}, Region: ${targetPatient?.region}.\n` +
        `• **Multimodal AI Risk Index:** **${targetPatient?.riskScore}% (${targetPatient?.riskLevel} Risk)**.\n` +
        `• **Screening Status:** ${targetPatient?.status} | Treatment: ${targetPatient?.treatmentStatus}.\n` +
        `• **Comorbidities:** ${targetPatient?.comorbidities.join(', ') || 'None recorded'}.\n\n` +
        `*Clinical Protocol Note:* Ensure standard mycobacteriological molecular tests (GeneXpert MTB/RIF) and contact tracing are documented.`;

      suggestedActions.push({ label: 'View Patient Dossier', actionType: 'NAVIGATE_PATIENT', payload: targetPatient?.id });
      suggestedActions.push({ label: 'Open Radiograph Viewer', actionType: 'NAVIGATE_XRAY', payload: targetPatient?.id });
    } else if (lower.includes('risk') || lower.includes('score') || lower.includes('multimodal')) {
      responseText = `**Multimodal AI Risk Stratification Architecture:**\n\n` +
        `1. **Radiological Model (42% Weight):** ResNet/DenseNet Deep CNN trained on 140,000+ validated posterior-anterior radiographs.\n` +
        `2. **WHO Symptom Matrix (28% Weight):** Algorithmic scoring of cough duration (>14 days), hemoptysis, night sweats, and unexplained fever.\n` +
        `3. **Acoustic Cough Biomarkers (18% Weight):** Spectral density, glottal explosive phase, and harmonic-to-noise ratios.\n` +
        `4. **Epidemiological Risk (12% Weight):** Household contact history, immunocompromise, and regional prevalence.\n\n` +
        `⚠️ *Safety Directive:* AI classifications serve exclusively as screening triage aids and require confirmation by licensed pulmonologists.`;
    } else if (lower.includes('protocol') || lower.includes('who') || lower.includes('regimen') || lower.includes('treatment')) {
      responseText = `**WHO 2024 Guidelines for Drug-Susceptible Pulmonary Tuberculosis:**\n\n` +
        `• **Intensive Phase (2 Months):** Daily 4-FDC consisting of Isoniazid (H), Rifampicin (R), Pyrazinamide (Z), and Ethambutol (E) (2HRZE).\n` +
        `• **Continuation Phase (4 Months):** Daily 2-FDC consisting of Isoniazid and Rifampicin (4HR).\n` +
        `• **Directly Observed Therapy (DOTS):** Daily dose adherence verification with smart reminder logs.\n` +
        `• **Baseline Monitoring:** LFTs (ALT, AST, Bilirubin), visual acuity test for Ethambutol, and renal panel.`;
    } else if (lower.includes('backend') || lower.includes('spring') || lower.includes('postgres') || lower.includes('api')) {
      responseText = `**TBDetect Backend Integration Architecture:**\n\n` +
        `• **Framework:** Java 21 / Spring Boot 3.3.x with Spring Security 6 & Spring Data JPA\n` +
        `• **Database:** PostgreSQL 16 with pgvector extension for high-dimensional medical feature embeddings\n` +
        `• **Authentication:** JWT Bearer token via Authorization header with RBAC role enforcement\n` +
        `• **Endpoints:** Fully mapped REST controllers for /api/patients, /api/xrays, /api/labs, /api/treatments, /api/audit, and /api/clinics.`;
    } else {
      responseText = `Welcome to TBDetect Clinical AI Assistant. How can I assist your clinical triage today?\n\n` +
        `• **Patient Dossier Synthesis:** Ask to summarize any patient's screening trajectory (e.g. "Summarize patient ${targetPatient?.nationalId || 'pat_001'}").\n` +
        `• **WHO Guidelines:** Ask for current 2HRZE / 4HR dosing regimens or pediatric protocols.\n` +
        `• **Diagnostic Risk Calibration:** Learn how radiograph CNN heatmaps and acoustic features combine.\n` +
        `• **Backend Architecture:** Inquire about Spring Boot REST API integration endpoints.`;
    }

    return {
      id: `ai_${Date.now().toString(36)}`,
      sender: 'assistant',
      timestamp: new Date().toISOString(),
      content: responseText,
      suggestedActions: suggestedActions.length > 0 ? suggestedActions : undefined,
    };
  },
};
