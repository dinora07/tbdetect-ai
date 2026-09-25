import { SymptomAssessment, RiskLevel, TimelineEvent } from '../../types';
import { appStorage } from '../storage/appStorage';
import { httpClient } from '../api/httpClient';
import { API_CONFIG } from '../api/config';
import { auditService } from '../audit/auditService';
import { patientService } from '../patients/patientService';

const delay = (ms: number = 200) => new Promise((resolve) => setTimeout(resolve, ms));

export const symptomService = {
  assessSymptoms(assessmentData: {
    patientId: string;
    patientName: string;
    assessedBy: string;
    symptoms: SymptomAssessment['symptoms'];
    riskFactors: SymptomAssessment['riskFactors'];
  }): Promise<SymptomAssessment> {
    return this.recordAssessment(assessmentData);
  },

  async getSymptomsByPatientId(patientId: string): Promise<SymptomAssessment[]> {
    if (API_CONFIG.useBackendApi) {
      try {
        return await httpClient.get<SymptomAssessment[]>(`/patients/${patientId}/symptoms`);
      } catch {
        // Fallback
      }
    }
    await delay(120);
    return appStorage.getSymptoms().filter((s) => s.patientId === patientId);
  },

  async calculateRisk(
    symptoms: SymptomAssessment['symptoms'],
    riskFactors: SymptomAssessment['riskFactors']
  ): Promise<{ calculatedRiskScore: number; riskLevel: RiskLevel; summary: string }> {
    let score = 0;

    // WHO Standard Clinical Weights
    if (symptoms.coughDurationDays >= 14) score += 30;
    else if (symptoms.coughDurationDays >= 7) score += 15;

    if (symptoms.hasHemoptysis) score += 25;
    if (symptoms.hasFever) score += 15;
    if (symptoms.hasNightSweats) score += 15;
    if (symptoms.hasWeightLoss) score += 15;
    if (symptoms.hasChestPain) score += 10;
    if (symptoms.hasLossOfAppetite) score += 8;
    if (symptoms.hasShortnessOfBreath) score += 8;
    if (symptoms.hasFatigue) score += 6;

    if (riskFactors.closeContactWithTB) score += 20;
    if (riskFactors.immunocompromised) score += 20;
    if (riskFactors.diabetic) score += 10;
    if (riskFactors.smoker) score += 8;
    if (riskFactors.livingInCrowdedArea) score += 8;

    const normalizedScore = Math.min(100, Math.max(5, score));
    let riskLevel: RiskLevel = 'LOW';
    if (normalizedScore >= 85) riskLevel = 'CRITICAL';
    else if (normalizedScore >= 70) riskLevel = 'HIGH';
    else if (normalizedScore >= 40) riskLevel = 'MODERATE';

    let summary = 'Mild/non-specific presentation. Standard symptomatic follow-up.';
    if (riskLevel === 'CRITICAL') {
      summary = 'Urgent priority: Quad-symptom positivity with epidemiological exposure. Immediate molecular diagnostic referral indicated.';
    } else if (riskLevel === 'HIGH') {
      summary = 'Classical cardinal signs of active pulmonary tuberculosis. Sputum smear/GeneXpert and chest radiograph required.';
    } else if (riskLevel === 'MODERATE') {
      summary = 'Intermediate clinical probability. Repeat symptom screening in 7 days and obtain baseline CXR.';
    }

    return { calculatedRiskScore: normalizedScore, riskLevel, summary };
  },

  async recordAssessment(assessmentData: {
    patientId: string;
    patientName: string;
    assessedBy: string;
    symptoms: SymptomAssessment['symptoms'];
    riskFactors: SymptomAssessment['riskFactors'];
  }): Promise<SymptomAssessment> {
    const { calculatedRiskScore, riskLevel, summary } = await this.calculateRisk(
      assessmentData.symptoms,
      assessmentData.riskFactors
    );

    const newId = `sym_${Date.now().toString(36)}`;
    const now = new Date().toISOString();

    const assessment: SymptomAssessment = {
      id: newId,
      patientId: assessmentData.patientId,
      patientName: assessmentData.patientName,
      assessedAt: now,
      assessedBy: assessmentData.assessedBy,
      symptoms: assessmentData.symptoms,
      riskFactors: assessmentData.riskFactors,
      calculatedRiskScore,
      riskLevel,
      summary,
    };

    if (API_CONFIG.useBackendApi) {
      try {
        const res = await httpClient.post<SymptomAssessment>(`/patients/${assessmentData.patientId}/symptoms`, assessment);
        if (res) return res;
      } catch {
        // Fallback
      }
    }

    await delay(200);
    const symptomsList = appStorage.getSymptoms();
    appStorage.setSymptoms([assessment, ...symptomsList]);

    // Update patient risk
    await patientService.updatePatientRisk(assessmentData.patientId, calculatedRiskScore, riskLevel);

    // Timeline event
    const evt: TimelineEvent = {
      id: `evt_sym_${Date.now().toString(36)}`,
      patientId: assessmentData.patientId,
      timestamp: now,
      type: 'SYMPTOM_ASSESSMENT',
      title: `WHO Symptom Assessment (${riskLevel})`,
      description: `Risk Score: ${calculatedRiskScore}%. Cough: ${assessmentData.symptoms.coughDurationDays} days. Hemoptysis: ${assessmentData.symptoms.hasHemoptysis ? 'YES' : 'NO'}.`,
      authorName: assessmentData.assessedBy,
      authorRole: 'Screening Clinician',
      severity: riskLevel === 'HIGH' || riskLevel === 'CRITICAL' ? 'alert' : 'info',
    };
    appStorage.setTimeline([evt, ...appStorage.getTimeline()]);

    // Audit log
    await auditService.logEvent({
      action: 'CREATE',
      resourceType: 'PATIENT',
      resourceId: newId,
      patientId: assessmentData.patientId,
      patientName: assessmentData.patientName,
      details: `Completed WHO symptom assessment (${riskLevel}, ${calculatedRiskScore}%)`,
    });

    return assessment;
  },
};
