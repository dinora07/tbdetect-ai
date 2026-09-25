<div align="center">

<img src="assets/readme/tbdetect-banner.svg" alt="TBDetect AI" width="100%"/>

# 🫁 TBDetect AI

### AI-Powered Tuberculosis Detection & Patient Monitoring Platform

**Early Screening • Multimodal Clinical Intelligence • Patient-Centered Care**

<p>
  <img src="https://img.shields.io/badge/AI-MedTech-00B8D9?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/React-TypeScript-3178C6?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Java-Spring%20Boot-6DB33F?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/PostgreSQL-Database-4169E1?style=for-the-badge"/>
</p>

</div>

---

# 🩺 About TBDetect AI

**TBDetect AI** is an AI-powered MedTech platform designed to support **early tuberculosis screening, multimodal clinical assessment, and patient treatment monitoring** through a unified digital healthcare workflow.

Instead of keeping X-ray examinations, symptoms, cough recordings, laboratory results and treatment information in separate systems, TBDetect AI brings these clinical data sources together around a **single patient-centered profile**.

The platform is designed to help healthcare professionals:

- identify potential TB-related signals earlier;
- organize complex patient information;
- review multimodal clinical data in one place;
- monitor treatment progress and adherence;
- maintain a longitudinal patient timeline;
- use AI-assisted information as part of clinical decision support.

> **TBDetect AI is designed to support healthcare professionals. It does not replace medical diagnosis or the professional judgment of a qualified clinician.**

---

# 🎯 Our Mission

### **Make tuberculosis screening faster, smarter and more connected.**

TBDetect AI focuses on a simple but important principle:

> **The earlier a potential TB signal is identified, the sooner appropriate clinical evaluation can begin.**

Our goal is to build a digital platform where clinical information can move through a structured workflow:

```text
Patient
   ↓
Clinical Data
   ↓
AI-Assisted Analysis
   ↓
Professional Review
   ↓
Clinical Follow-Up
   ↓
Treatment Monitoring
🚨 The Problem

Tuberculosis screening and follow-up can involve multiple information sources and clinical workflows.

Healthcare professionals may need to work with:

chest X-ray examinations;
patient symptoms;
cough-related information;
laboratory results;
treatment records;
medication adherence;
previous clinical history.

When these data sources are fragmented, reviewing the complete patient picture can become more difficult.

TBDetect AI addresses this challenge by creating a unified patient-centered workflow.
💡 The Solution

TBDetect AI combines several clinical workflows into one platform:

🩻 X-Ray AI

Patient-linked chest X-ray workflow prepared for AI-assisted image analysis.

🩺 Symptoms Intelligence

Structured collection and assessment of patient symptoms.

🎙️ Cough Voice AI

Digital cough recording and audio-analysis workflow.

🧪 Laboratory

Patient-linked laboratory results, reference ranges, statuses and attachments.

💊 Treatment Monitoring

Treatment plans, medication schedules, adherence and follow-up tracking.

🤖 Clinical AI Assistant

An AI-assisted interface designed to help users work with clinical information.

👥 Patient Management

Centralized patient profiles, clinical history and longitudinal timelines.

🏥 Clinic Network

Healthcare institution information and clinic discovery workflow.

📊 Analytics

Structured operational and clinical workflow analytics.

🔐 Audit Log

Traceable administrative and system activity.

🧠 Multimodal Clinical Intelligence
<img src="assets/readme/tbdetect-architecture.svg" alt="TBDetect AI Clinical Data Flow" width="100%"/>

TBDetect AI is designed around a multimodal approach.

Instead of relying on a single data source, the platform organizes different clinical inputs around the same patient:

              ┌──────────────────┐
              │     PATIENT      │
              └────────┬─────────┘
                       │
        ┌──────────────┼──────────────┐
        ↓              ↓              ↓
     X-Ray         Symptoms         Cough
        │              │              │
        └──────────────┼──────────────┘
                       ↓
                 Laboratory
                       ↓
                AI Processing
                       ↓
             Clinical Information
                       ↓
              Professional Review
                       ↓
            Treatment & Monitoring

This architecture creates a foundation for a more complete view of the patient journey.

✨ Core Features
🩻 X-Ray AI

The imaging workflow is designed around a patient-linked study model.

Workflow
Select Patient
      ↓
Upload Chest X-Ray
      ↓
Validate Image
      ↓
Create Imaging Study
      ↓
Backend / AI Processing
      ↓
Analysis Result
      ↓
Professional Review
      ↓
Save to Patient History

The frontend is designed to distinguish between:

uploaded;
validating;
processing;
completed;
failed;
verification-required;
demo/synthetic states.

Medical findings should come from the actual backend/model pipeline rather than being invented by the frontend.

🎙️ Cough Voice AI

The platform provides a digital workflow for cough-related data collection.

Supported workflow
microphone permission handling;
recording;
pause/resume;
stop;
playback;
re-record;
audio upload;
patient association;
study association;
historical review.

The architecture is prepared for integration with a dedicated cough-analysis model.

🧪 Laboratory Management

TBDetect AI provides a structured laboratory workflow connected to the patient.

Supported clinical test workflows include:

GeneXpert MTB/RIF Ultra;
AFB smear;
MGIT culture;
QuantiFERON IGRA;
hs-CRP;
ESR;
CBC;
LFT;
Urine TB-LAM.

Each laboratory record can contain:

Patient
Study
Test Type
Date
Result
Units
Reference Range
Status
Facility
Technician
Pathologist
Notes
Attachments
💊 Treatment Monitoring

TBDetect AI is designed to track treatment progress rather than only screening.

The treatment workflow can contain:

treatment plan;
start date;
treatment phase;
medication;
dosage;
frequency;
responsible doctor;
healthcare facility;
adherence;
missed doses;
side effects;
progress timeline.

Example:

Treatment Plan
      ↓
Medication Schedule
      ↓
Daily Status
      ↓
Adherence Calculation
      ↓
Missed Dose Detection
      ↓
Side Effect Monitoring
      ↓
Clinical Follow-Up
👥 Patient-Centered Architecture

The patient is the central object of the platform.

Clinical information is designed to remain connected to the patient:

Patient
 ├── Profile
 ├── X-Ray Studies
 ├── Symptoms
 ├── Cough Studies
 ├── Laboratory Results
 ├── Treatment Plans
 ├── Clinical Timeline
 └── Follow-Up History

This allows healthcare professionals to review the patient's journey from screening through monitoring.

🏥 Clinic Network

TBDetect AI includes a healthcare institution workflow designed to organize clinic information.

The architecture supports:

region selection;
city/district filtering;
clinic search;
clinic type;
TB/phthisiology/pulmonology filtering;
contact information;
website;
directions;
verification status.

The product direction is to use verified healthcare institution information rather than fabricated clinic data.

🤖 Clinical AI Assistant

The Clinical AI Assistant is designed as an AI-supported interface for working with clinical information.

Potential workflows include:

patient information summaries;
clinical workflow assistance;
structured information retrieval;
explanation of platform data;
follow-up support;
contextual assistance.

AI output should remain subject to professional review and should not be presented as an autonomous medical diagnosis.

🌍 Multilingual Platform

TBDetect AI is designed for a multilingual healthcare environment.

Supported languages

🇺🇿 O‘zbek

🇷🇺 Русский

🇬🇧 English

The application architecture uses centralized translation dictionaries so that interface elements can be localized consistently across:

navigation;
dashboards;
forms;
tables;
dialogs;
notifications;
settings;
analytics;
patient workflows;
clinical modules.
🔐 Security & Privacy Direction

Healthcare applications require strong security and privacy practices.

The production architecture is designed around:

authentication;
role-based access control;
JWT-based authorization;
patient data isolation;
audit logging;
secure API communication;
secure file handling;
environment-based secrets;
controlled access to clinical information.
Important

Patient data, API keys, passwords and other sensitive information must never be committed to GitHub.

👨‍⚕️ Role-Based Access

The platform is designed to support different healthcare roles.

Potential roles include:

SYSTEM ADMINISTRATOR
        │
        ├── User Management
        ├── Clinic Management
        ├── Audit Logs
        └── System Monitoring

DOCTOR / CLINICIAN
        │
        ├── Patients
        ├── X-Ray
        ├── Symptoms
        ├── Laboratory
        └── Treatment

PATIENT
        │
        ├── Personal Profile
        ├── Results
        └── Treatment Monitoring

The exact production permission model will be enforced by the backend.

📊 Analytics

TBDetect AI includes an analytics layer designed to transform operational data into useful insights.

Potential metrics include:

patient volume;
imaging studies;
pending reviews;
laboratory activity;
treatment monitoring;
cough studies;
screening trends;
workflow performance.

Production analytics should be calculated from real backend/database data rather than static frontend numbers.

🔄 Complete Clinical Workflow
┌─────────────────────┐
│  CREATE / SELECT    │
│      PATIENT        │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ CLINICAL ASSESSMENT │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ X-RAY / COUGH / LAB │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│     VALIDATION      │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│  BACKEND PROCESSING │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│     AI ANALYSIS     │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ PROFESSIONAL REVIEW │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ PATIENT TIMELINE    │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ TREATMENT MONITORING│
└─────────────────────┘
🏗️ Technology Architecture
Frontend
React
TypeScript
Vite
Tailwind CSS
Lucide React
REST API Service Layer
Backend
Java
Spring Boot
Spring Security
REST API
JWT
Validation
JPA / Hibernate
Database
PostgreSQL
AI Layer
X-Ray AI
Cough Analysis AI
Clinical AI Assistant
Infrastructure
Secure File Storage
API Gateway / Backend
Authentication
Monitoring
Logging
Deployment Infrastructure
🔌 API Architecture

The frontend is structured around service modules prepared for backend integration.

Planned domains include:

/api/auth
/api/patients
/api/imaging
/api/symptoms
/api/cough
/api/laboratory
/api/treatment
/api/clinics
/api/users
/api/audit
/api/analytics

Example imaging workflow:

POST   /api/imaging/studies
POST   /api/imaging/studies/{studyId}/analyze
GET    /api/imaging/studies/{studyId}
GET    /api/imaging/studies/{studyId}/result
GET    /api/patients/{patientId}/imaging
DELETE /api/imaging/studies/{studyId}

The frontend should consume structured backend responses and must not fabricate clinical findings.

🗂️ Project Structure
tbdetect-ai/
│
├── assets/
│   └── readme/
│
├── src/
│   ├── components/
│   │   ├── admin/
│   │   ├── ai-assistant/
│   │   ├── analytics/
│   │   ├── auth/
│   │   ├── clinics/
│   │   ├── common/
│   │   ├── dashboard/
│   │   ├── laboratory/
│   │   ├── patients/
│   │   ├── profile/
│   │   ├── screening/
│   │   ├── settings/
│   │   └── treatment/
│   │
│   ├── context/
│   ├── i18n/
│   ├── services/
│   ├── types/
│   └── utils/
│
├── package.json
├── package-lock.json
├── tsconfig.json
└── vite.config.ts
💻 Run Locally
1. Clone the repository
git clone https://github.com/dinora07/tbdetect-ai.git
cd tbdetect-ai
2. Install dependencies
npm install
3. Configure environment variables

Create your local environment configuration from:

.env.example

Never commit real secrets or API keys.

4. Start development server
npm run dev
🧪 Demo Mode vs Production Mode

TBDetect AI can use synthetic data during product demonstrations and UI development.

Demo information must remain clearly identified as:

DEMO / SYNTHETIC DATA

Production clinical operation requires:

real backend infrastructure;
PostgreSQL persistence;
secure file storage;
validated AI models;
authentication;
authorization;
clinical validation;
appropriate regulatory processes;
monitoring and security controls;
qualified healthcare professional oversight.
🛡️ Medical Safety

TBDetect AI is a clinical decision-support platform concept.

It does not independently diagnose tuberculosis.

AI-generated information must be interpreted and reviewed by an appropriately qualified healthcare professional before being used in clinical decision-making.

The platform should clearly distinguish:

AI Prediction
≠
Medical Diagnosis
🗺️ Development Roadmap
Stage	Status
Frontend architecture	✅ Completed
Patient-centered workflow	✅ Completed
Clinical modules	✅ Completed
Multilingual interface	✅ Implemented
GitHub version control	✅ Completed
Spring Boot backend	🔄 In development
PostgreSQL persistence	🔄 Planned
Authentication & RBAC	🔄 Planned
Real AI inference	🔄 Planned
Secure medical file storage	🔄 Planned
Clinical validation	🔄 Planned
Production deployment	🔄 Planned
Pilot / clinical partnerships	🔄 Future
🌟 Product Vision

TBDetect AI is being developed with a broader vision:

From a university project to a scalable MedTech platform.

The long-term direction is to create a system capable of connecting:

Patients
     ↓
Clinics
     ↓
Clinical Data
     ↓
AI Services
     ↓
Healthcare Professionals
     ↓
Treatment Monitoring

with a focus on accessibility, structured clinical workflows and responsible AI.

👩‍💻 Author
Dinora Sharipova

Software Engineering Student | Java Backend Developer

Technical Interests

Java • Spring Boot • PostgreSQL • REST API • AI • MedTech • React • TypeScript • Full-Stack Development

Project

TBDetect AI — AI-Powered Tuberculosis Detection & Patient Monitoring Platform

📌 Project Status

Current Status: Active Development 🚀

The frontend foundation is implemented and version-controlled.

The next major development stage is the integration of:

Java Spring Boot + PostgreSQL + Authentication + Real AI Inference

<div align="center">
🫁 Early Detection. Better Decisions. Smarter Care.
TBDetect AI

Technology designed to support the fight against tuberculosis.

