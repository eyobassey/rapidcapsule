# Rapid Capsule - System Architecture Documentation

> AI-Powered Telemedicine Platform Architecture Guide

---

## Table of Contents
1. [System Overview](#1-system-overview)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Service Architecture](#3-service-architecture)
4. [Data Flow Diagrams](#4-data-flow-diagrams)
5. [Integration Architecture](#5-integration-architecture)
6. [Security Architecture](#6-security-architecture)
7. [Database Schema](#7-database-schema)
8. [Technology Stack](#8-technology-stack)
9. [Innovative Healthcare Features](#9-innovative-healthcare-features)
   - [9.1 Advanced Health Score System](#91-advanced-health-score-system)
   - [9.2 Prescription & Pharmacy System](#92-prescription--pharmacy-system)
   - [9.3 WhatsApp Pharmacy Integration](#93-whatsapp-pharmacy-integration)
   - [9.4 Compliance & Safety Features](#94-compliance--safety-features)
10. [Innovation Summary for Global Talent Visa](#10-innovation-summary-for-global-talent-visa)

---

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           RAPID CAPSULE PLATFORM                                │
│                     AI-Powered Telemedicine Ecosystem                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│   │   Patient   │    │  Specialist │    │  Lifeguard  │    │    Admin    │     │
│   │    App      │    │    App      │    │    App      │    │   Portal    │     │
│   └──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘     │
│          │                  │                  │                  │             │
│          └──────────────────┼──────────────────┼──────────────────┘             │
│                             │                  │                                │
│                             ▼                  ▼                                │
│   ┌─────────────────────────────────────────────────────────────────────┐      │
│   │                        API GATEWAY / NGINX                          │      │
│   │              (SSL Termination, Load Balancing, Routing)             │      │
│   └─────────────────────────────┬───────────────────────────────────────┘      │
│                                 │                                               │
│          ┌──────────────────────┼──────────────────────┐                       │
│          ▼                      ▼                      ▼                       │
│   ┌─────────────┐        ┌─────────────┐        ┌─────────────┐               │
│   │   Patient   │        │    Admin    │        │  WebSocket  │               │
│   │   Backend   │◄──────►│   Backend   │◄──────►│   Server    │               │
│   │  (Port 5020)│        │  (Port 5021)│        │             │               │
│   └──────┬──────┘        └──────┬──────┘        └─────────────┘               │
│          │                      │                                              │
│          └──────────┬───────────┘                                              │
│                     ▼                                                          │
│   ┌─────────────────────────────────────────────────────────────────────┐      │
│   │                         MongoDB Database                            │      │
│   │                    (Shared Data Layer)                              │      │
│   └─────────────────────────────────────────────────────────────────────┘      │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Platform Statistics

| Metric | Value |
|--------|-------|
| Total Services | 4 |
| Backend Modules | 46+ |
| API Endpoints | 100+ |
| Frontend Components | 273 |
| Database Collections | 20+ |
| External Integrations | 10+ |

---

## 2. High-Level Architecture

```
                                    ┌─────────────────────────────────────┐
                                    │         EXTERNAL SERVICES           │
                                    ├─────────────────────────────────────┤
                                    │  ┌─────────┐  ┌─────────┐  ┌─────┐ │
                                    │  │Infermed-│  │ Claude  │  │Zoom │ │
                                    │  │  ica AI │  │   AI    │  │ API │ │
                                    │  └────┬────┘  └────┬────┘  └──┬──┘ │
                                    │       │           │          │     │
                                    │  ┌────┴───┐  ┌────┴────┐  ┌──┴──┐ │
                                    │  │Paystack│  │ Twilio  │  │ AWS │ │
                                    │  │Payment │  │SMS/Voice│  │ S3  │ │
                                    │  └────┬───┘  └────┬────┘  └──┬──┘ │
                                    └───────┼──────────┼──────────┼─────┘
                                            │          │          │
┌───────────────────────────────────────────┼──────────┼──────────┼─────────────────┐
│                                           ▼          ▼          ▼                 │
│  ┌──────────────────────────────────────────────────────────────────────────┐    │
│  │                         INTEGRATION LAYER                                 │    │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────┐ │    │
│  │  │ Infermedica│ │  Claude    │ │   Zoom     │ │  Paystack  │ │ Twilio │ │    │
│  │  │  Adapter   │ │  Adapter   │ │  Adapter   │ │  Adapter   │ │Adapter │ │    │
│  │  └─────┬──────┘ └─────┬──────┘ └─────┬──────┘ └─────┬──────┘ └───┬────┘ │    │
│  └────────┼──────────────┼──────────────┼──────────────┼────────────┼──────┘    │
│           │              │              │              │            │            │
│           └──────────────┴──────────────┴──────┬───────┴────────────┘            │
│                                                │                                  │
│  ┌─────────────────────────────────────────────┴────────────────────────────┐    │
│  │                          SERVICE LAYER                                    │    │
│  │                                                                           │    │
│  │   ┌─────────────────────────────┐    ┌─────────────────────────────┐    │    │
│  │   │      PATIENT BACKEND        │    │       ADMIN BACKEND         │    │    │
│  │   │        (NestJS)             │    │        (NestJS)             │    │    │
│  │   │                             │    │                             │    │    │
│  │   │  ┌───────┐ ┌───────┐       │    │  ┌───────┐ ┌───────┐       │    │    │
│  │   │  │ Auth  │ │Health │       │    │  │ Auth  │ │Dashbd │       │    │    │
│  │   │  │Module │ │Checkup│       │    │  │Module │ │Module │       │    │    │
│  │   │  └───────┘ └───────┘       │    │  └───────┘ └───────┘       │    │    │
│  │   │  ┌───────┐ ┌───────┐       │    │  ┌───────┐ ┌───────┐       │    │    │
│  │   │  │Appoint│ │Vitals │       │    │  │Patient│ │Analyst│       │    │    │
│  │   │  │ments  │ │Module │       │    │  │Manage │ │Module │       │    │    │
│  │   │  └───────┘ └───────┘       │    │  └───────┘ └───────┘       │    │    │
│  │   │  ┌───────┐ ┌───────┐       │    │  ┌───────┐ ┌───────┐       │    │    │
│  │   │  │Payment│ │Prescr-│       │    │  │Special│ │Claude │       │    │    │
│  │   │  │Module │ │iptions│       │    │  │ists   │ │Summary│       │    │    │
│  │   │  └───────┘ └───────┘       │    │  └───────┘ └───────┘       │    │    │
│  │   │         + 26 more          │    │        + 8 more            │    │    │
│  │   └─────────────────────────────┘    └─────────────────────────────┘    │    │
│  └───────────────────────────────────────────────────────────────────────────┘    │
│                                                                                    │
│  ┌───────────────────────────────────────────────────────────────────────────┐    │
│  │                           DATA LAYER                                       │    │
│  │   ┌─────────────────────────────────────────────────────────────────┐    │    │
│  │   │                      MongoDB (Mongoose ODM)                      │    │    │
│  │   │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐       │    │    │
│  │   │  │ Users  │ │Appoint-│ │ Health │ │ Vitals │ │Payments│       │    │    │
│  │   │  │        │ │ ments  │ │Checkups│ │        │ │        │       │    │    │
│  │   │  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘       │    │    │
│  │   │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐       │    │    │
│  │   │  │Prescr- │ │Wallets │ │Subscr- │ │Referr- │ │Clinical│       │    │    │
│  │   │  │iptions │ │        │ │iptions │ │  als   │ │ Notes  │       │    │    │
│  │   │  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘       │    │    │
│  │   └─────────────────────────────────────────────────────────────────┘    │    │
│  └───────────────────────────────────────────────────────────────────────────┘    │
│                                                                                    │
│  ┌───────────────────────────────────────────────────────────────────────────┐    │
│  │                        PRESENTATION LAYER                                  │    │
│  │                                                                            │    │
│  │   ┌─────────────────────────────┐    ┌─────────────────────────────┐     │    │
│  │   │     PATIENT FRONTEND        │    │      ADMIN FRONTEND         │     │    │
│  │   │      (Vue.js 3 SPA)         │    │   (Vue.js 3 + Vuetify 3)    │     │    │
│  │   │                             │    │                             │     │    │
│  │   │  • Health Checkup Wizard    │    │  • Analytics Dashboard      │     │    │
│  │   │  • Appointment Booking      │    │  • Patient Management       │     │    │
│  │   │  • Video Consultations      │    │  • Specialist Oversight     │     │    │
│  │   │  • Vitals Monitoring        │    │  • Health Score Calculator  │     │    │
│  │   │  • Prescription Management  │    │  • Reporting & Exports      │     │    │
│  │   │                             │    │                             │     │    │
│  │   │  Components: 171            │    │  Components: 102            │     │    │
│  │   │  Vuex Modules: 11           │    │  Pinia Stores: 9            │     │    │
│  │   └─────────────────────────────┘    └─────────────────────────────┘     │    │
│  └───────────────────────────────────────────────────────────────────────────┘    │
│                                                                                    │
└────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Service Architecture

### 3.1 Patient Backend Architecture (RC-Backend)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        PATIENT BACKEND (NestJS)                                 │
│                              Port: 5020                                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                           CORE LAYER                                     │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │   │
│  │  │   Guards     │  │ Interceptors │  │    Pipes     │  │ Decorators  │ │   │
│  │  │              │  │              │  │              │  │             │ │   │
│  │  │• IsAuthorized│  │• Response    │  │• Validation  │  │• @Match()   │ │   │
│  │  │• IsUserActive│  │  Interceptor │  │  Pipe        │  │• @User()    │ │   │
│  │  │• IsEmailVer- │  │              │  │              │  │             │ │   │
│  │  │  ified       │  │              │  │              │  │             │ │   │
│  │  │• DoesUserEx- │  │              │  │              │  │             │ │   │
│  │  │  ist         │  │              │  │              │  │             │ │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                        MODULE LAYER (32 Modules)                         │   │
│  │                                                                          │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐    │   │
│  │  │                    AUTHENTICATION & USERS                        │    │   │
│  │  │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐   │    │   │
│  │  │  │  Auth  │  │ Users  │  │ Tokens │  │Life-   │  │User-   │   │    │   │
│  │  │  │        │  │        │  │        │  │guards  │  │Settings│   │    │   │
│  │  │  │• Login │  │• CRUD  │  │• JWT   │  │        │  │        │   │    │   │
│  │  │  │• OAuth │  │• Profile│ │• Refresh│ │        │  │• 2FA   │   │    │   │
│  │  │  │• 2FA   │  │• Hash  │  │        │  │        │  │• Prefs │   │    │   │
│  │  │  └────────┘  └────────┘  └────────┘  └────────┘  └────────┘   │    │   │
│  │  └─────────────────────────────────────────────────────────────────┘    │   │
│  │                                                                          │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐    │   │
│  │  │                      HEALTH SERVICES                             │    │   │
│  │  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌───────────┐ │    │   │
│  │  │  │  Health    │  │   Vitals   │  │  Clinical  │  │ Advanced  │ │    │   │
│  │  │  │  Checkup   │  │            │  │   Notes    │  │ Health    │ │    │   │
│  │  │  │            │  │            │  │            │  │ Score     │ │    │   │
│  │  │  │• Infermed- │  │• BP, Temp  │  │• Zoom Sync │  │           │ │    │   │
│  │  │  │  ica AI    │  │• Pulse     │  │• Custom    │  │• 6 Domain │ │    │   │
│  │  │  │• Diagnosis │  │• Weight    │  │  Notes     │  │  Scoring  │ │    │   │
│  │  │  │• Triage    │  │• Charts    │  │            │  │• Claude   │ │    │   │
│  │  │  │• Duration  │  │            │  │            │  │  Reports  │ │    │   │
│  │  │  └────────────┘  └────────────┘  └────────────┘  └───────────┘ │    │   │
│  │  └─────────────────────────────────────────────────────────────────┘    │   │
│  │                                                                          │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐    │   │
│  │  │                     APPOINTMENTS                                 │    │   │
│  │  │  ┌────────────────────────────────────────────────────────────┐ │    │   │
│  │  │  │                   Appointments Module                       │ │    │   │
│  │  │  │                                                             │ │    │   │
│  │  │  │  • Multi-Channel Support (6 channels)                       │ │    │   │
│  │  │  │  • Double-Booking Prevention                                │ │    │   │
│  │  │  │  • Timezone Management                                      │ │    │   │
│  │  │  │  • Zoom Meeting Creation                                    │ │    │   │
│  │  │  │  • Google Calendar Integration                              │ │    │   │
│  │  │  │  • Referral System                                          │ │    │   │
│  │  │  │  • Payment Integration                                      │ │    │   │
│  │  │  └────────────────────────────────────────────────────────────┘ │    │   │
│  │  └─────────────────────────────────────────────────────────────────┘    │   │
│  │                                                                          │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐    │   │
│  │  │                   PAYMENTS & FINANCE                             │    │   │
│  │  │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐   │    │   │
│  │  │  │Payments│  │Wallets │  │ Cards  │  │Subscr- │  │ Banks  │   │    │   │
│  │  │  │        │  │        │  │        │  │iptions │  │        │   │    │   │
│  │  │  │•Paystack│ │•Balance│  │•Tokeniz│  │•Plans  │  │•Resolve│   │    │   │
│  │  │  │•Verify  │ │•Transfer│ │•Charge │  │•Billing│  │•Payout │   │    │   │
│  │  │  └────────┘  └────────┘  └────────┘  └────────┘  └────────┘   │    │   │
│  │  └─────────────────────────────────────────────────────────────────┘    │   │
│  │                                                                          │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐    │   │
│  │  │                   ADDITIONAL MODULES                             │    │   │
│  │  │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐   │    │   │
│  │  │  │Prescr- │  │Pharmacy│  │Referr- │  │Rewards │  │Webhooks│   │    │   │
│  │  │  │iptions │  │        │  │  als   │  │        │  │        │   │    │   │
│  │  │  └────────┘  └────────┘  └────────┘  └────────┘  └────────┘   │    │   │
│  │  │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐   │    │   │
│  │  │  │WhatsApp│  │Remind- │  │Transac-│  │Claude  │  │Analytics│  │    │   │
│  │  │  │        │  │  ers   │  │ tions  │  │Summary │  │        │   │    │   │
│  │  │  └────────┘  └────────┘  └────────┘  └────────┘  └────────┘   │    │   │
│  │  └─────────────────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                        WEBSOCKET LAYER                                   │   │
│  │  ┌──────────────────────────────────────────────────────────────────┐  │   │
│  │  │  WebSocket Gateway (Socket.io)                                    │  │   │
│  │  │  • Namespace: /websockets                                         │  │   │
│  │  │  • Real-time Events: Payment updates, Notifications               │  │   │
│  │  │  • CORS Enabled                                                   │  │   │
│  │  └──────────────────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Admin Backend Architecture (RC_Admin_Backend)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         ADMIN BACKEND (NestJS)                                  │
│                              Port: 5021                                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                        MODULE LAYER (14 Modules)                         │   │
│  │                                                                          │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐    │   │
│  │  │                      CORE MODULES                                │    │   │
│  │  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │    │   │
│  │  │  │      Auth       │  │    Dashboard    │  │    Analytics    │ │    │   │
│  │  │  │                 │  │                 │  │                 │ │    │   │
│  │  │  │ • JWT Strategy  │  │ • 30+ Endpoints │  │ • Patient Stats │ │    │   │
│  │  │  │ • Local Strategy│  │ • Metrics       │  │ • Specialist    │ │    │   │
│  │  │  │ • Admin Roles   │  │ • Trends        │  │   Analytics     │ │    │   │
│  │  │  │                 │  │ • Activities    │  │ • Graph Data    │ │    │   │
│  │  │  └─────────────────┘  └─────────────────┘  └─────────────────┘ │    │   │
│  │  └─────────────────────────────────────────────────────────────────┘    │   │
│  │                                                                          │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐    │   │
│  │  │                   MANAGEMENT MODULES                             │    │   │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │    │   │
│  │  │  │  Patients   │  │ Specialists │  │  Lifeguards │              │    │   │
│  │  │  │             │  │             │  │             │              │    │   │
│  │  │  │• CRUD       │  │• Verification│ │• Management │              │    │   │
│  │  │  │• Status Mgmt│  │• Documents  │  │• Beneficiary│              │    │   │
│  │  │  │• Suspension │  │• Profile    │  │             │              │    │   │
│  │  │  │• Profile Ed.│  │             │  │             │              │    │   │
│  │  │  └─────────────┘  └─────────────┘  └─────────────┘              │    │   │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │    │   │
│  │  │  │Appointments │  │   Claude    │  │  Referrals  │              │    │   │
│  │  │  │             │  │   Summary   │  │             │              │    │   │
│  │  │  │• Admin Book │  │• Plans CRUD │  │• Analytics  │              │    │   │
│  │  │  │• Overview   │  │• Credits    │  │• Settings   │              │    │   │
│  │  │  │             │  │• Analytics  │  │• Tracking   │              │    │   │
│  │  │  └─────────────┘  └─────────────┘  └─────────────┘              │    │   │
│  │  └─────────────────────────────────────────────────────────────────┘    │   │
│  │                                                                          │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐    │   │
│  │  │              DASHBOARD SERVICE CAPABILITIES                      │    │   │
│  │  │                        (1,916 lines)                             │    │   │
│  │  │                                                                  │    │   │
│  │  │  ┌─────────────────────────────────────────────────────────┐    │    │   │
│  │  │  │ Metrics & Analytics                                      │    │    │   │
│  │  │  │ • getComprehensiveMetrics() - 16 parallel DB queries     │    │    │   │
│  │  │  │ • getWeeklyTrends() - Configurable date ranges           │    │    │   │
│  │  │  │ • getHealthCheckupTrends() - 30-day rolling analytics    │    │    │   │
│  │  │  │ • getRecentActivities() - Activity feed aggregation      │    │    │   │
│  │  │  └─────────────────────────────────────────────────────────┘    │    │   │
│  │  │  ┌─────────────────────────────────────────────────────────┐    │    │   │
│  │  │  │ Patient Management                                       │    │    │   │
│  │  │  │ • getPatientHealthCheckups() - Full health history       │    │    │   │
│  │  │  │ • getPatientActivityTimeline() - 50 recent activities    │    │    │   │
│  │  │  │ • getPatientVitals() - Latest readings per type          │    │    │   │
│  │  │  │ • suspendPatient() / deactivatePatient()                 │    │    │   │
│  │  │  │ • updatePatientProfile() - 25+ fields                    │    │    │   │
│  │  │  │ • createAppointmentForPatient()                          │    │    │   │
│  │  │  └─────────────────────────────────────────────────────────┘    │    │   │
│  │  │  ┌─────────────────────────────────────────────────────────┐    │    │   │
│  │  │  │ Specialist Management                                    │    │    │   │
│  │  │  │ • updateSpecialistProfile() - Documents & Awards upload  │    │    │   │
│  │  │  │ • suspendSpecialist() / updateSpecialistStatus()         │    │    │   │
│  │  │  │ • getSpecialistAppointments()                            │    │    │   │
│  │  │  └─────────────────────────────────────────────────────────┘    │    │   │
│  │  └─────────────────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Patient Frontend Architecture (RC)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      PATIENT FRONTEND (Vue.js 3)                                │
│                              Port: 3000                                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         APPLICATION LAYER                                │   │
│  │                                                                          │   │
│  │   main.js (253 lines)                                                   │   │
│  │   ├── Vue 3 App Instance                                                │   │
│  │   ├── Plugin Registration (25+ plugins)                                 │   │
│  │   ├── Global Components (VLoaderSpinner, Icons)                         │   │
│  │   ├── Custom Directives                                                 │   │
│  │   └── HTTP Service Injection                                            │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         STATE MANAGEMENT (Vuex 4)                        │   │
│  │                                                                          │   │
│  │   ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │   │                    ROOT STORE (data-store.js)                    │   │   │
│  │   │   State: token, userProfile, userSettings, recentVitals,        │   │   │
│  │   │          activeSub, cards, referral, loading                    │   │   │
│  │   │   Actions: authenticate() - 7 parallel API calls                │   │   │
│  │   └─────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                          │   │
│  │   ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │   │               NAMESPACED MODULES (11 modules)                    │   │   │
│  │   │                                                                  │   │   │
│  │   │   ┌───────────────┐  ┌───────────────┐  ┌───────────────┐      │   │   │
│  │   │   │ userRegAuth   │  │    vitals     │  │ prescriptions │      │   │   │
│  │   │   │ (300 lines)   │  │               │  │               │      │   │   │
│  │   │   │               │  │               │  │               │      │   │   │
│  │   │   │ • signup      │  │ • CRUD        │  │ • Management  │      │   │   │
│  │   │   │ • login       │  │ • Charts      │  │ • Upload      │      │   │   │
│  │   │   │ • OAuth       │  │ • Recent      │  │               │      │   │   │
│  │   │   │ • 2FA/OTP     │  │               │  │               │      │   │   │
│  │   │   └───────────────┘  └───────────────┘  └───────────────┘      │   │   │
│  │   │   ┌───────────────┐  ┌───────────────┐  ┌───────────────┐      │   │   │
│  │   │   │   pharmacy    │  │   whatsapp    │  │    orders     │      │   │   │
│  │   │   │   (58KB)      │  │               │  │               │      │   │   │
│  │   │   └───────────────┘  └───────────────┘  └───────────────┘      │   │   │
│  │   │   ┌───────────────┐  ┌───────────────┐  ┌───────────────┐      │   │   │
│  │   │   │ profileSetup  │  │userAcctSettings│ │ passwordReset │      │   │   │
│  │   │   └───────────────┘  └───────────────┘  └───────────────┘      │   │   │
│  │   └─────────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                           VIEW LAYER (171 Components)                    │   │
│  │                                                                          │   │
│  │   ┌──────────────────────────────────────────────────────────────────┐  │   │
│  │   │                    HEALTH CHECKUP FLOW                            │  │   │
│  │   │   HealthCheckup.vue (96 lines) - Multi-step wizard container     │  │   │
│  │   │   ├── Step 0: Entry                                               │  │   │
│  │   │   ├── Step 1: Gender Selection                                    │  │   │
│  │   │   ├── Step 2: Age Selection                                       │  │   │
│  │   │   ├── Step 3: Confirm Info                                        │  │   │
│  │   │   ├── Step 4: Risk Factors                                        │  │   │
│  │   │   ├── Step 5: Observations                                        │  │   │
│  │   │   ├── Step 6: Body Region Selection                               │  │   │
│  │   │   ├── Step 7: Symptom Selection (AI-suggested)                    │  │   │
│  │   │   ├── Step 8: Diagnosis Evaluator (Infermedica Interview)         │  │   │
│  │   │   ├── Step 9: DiagnosisReport.vue (1,269 lines)                   │  │   │
│  │   │   └── Step 10: History                                            │  │   │
│  │   │                                                                    │  │   │
│  │   │   State: provide/inject pattern for cross-component sharing       │  │   │
│  │   │   - $_PATIENT_INFO, $_NAVIGATOR, $_DIAGNOSIS, $_RECOMMENDATION    │  │   │
│  │   └──────────────────────────────────────────────────────────────────┘  │   │
│  │                                                                          │   │
│  │   ┌──────────────────────────────────────────────────────────────────┐  │   │
│  │   │                   APPOINTMENT BOOKING FLOW                        │  │   │
│  │   │   Appointments.vue (309 lines) - 6-step booking wizard           │  │   │
│  │   │   ├── Step 1: Service Type Selection                              │  │   │
│  │   │   ├── Step 2: Agreement / Terms                                   │  │   │
│  │   │   ├── Step 3: Specialist Category                                 │  │   │
│  │   │   ├── Step 4: Date/Time Selection                                 │  │   │
│  │   │   ├── Step 5: Specialist Selection                                │  │   │
│  │   │   └── Step 6: Summary & Confirm                                   │  │   │
│  │   │                                                                    │  │   │
│  │   │   Meetings.vue (502 lines) - Video consultation interface         │  │   │
│  │   │   • Video/Mic controls                                            │  │   │
│  │   │   • Chat sidebar                                                  │  │   │
│  │   │   • Notes sidebar                                                 │  │   │
│  │   └──────────────────────────────────────────────────────────────────┘  │   │
│  │                                                                          │   │
│  │   ┌──────────────────────────────────────────────────────────────────┐  │   │
│  │   │                     ACCOUNT MANAGEMENT                            │  │   │
│  │   │   Account/index.vue (1,300+ lines)                               │  │   │
│  │   │   ├── Profile Tab: User info, contacts, dependents               │  │   │
│  │   │   ├── Wallet Tab: Balance, plans, transactions, payment methods  │  │   │
│  │   │   └── Security Tab: Password, 2FA, WhatsApp settings             │  │   │
│  │   └──────────────────────────────────────────────────────────────────┘  │   │
│  │                                                                          │   │
│  │   ┌──────────────────────────────────────────────────────────────────┐  │   │
│  │   │                     OTHER KEY VIEWS                               │  │   │
│  │   │   • patient-dashboard.vue (3,624 lines) - Main dashboard         │  │   │
│  │   │   • Vitals.vue (54KB) - Health monitoring with charts            │  │   │
│  │   │   • Prescriptions/Patient.vue (34KB) - Prescription management   │  │   │
│  │   │   • specialist-dashboard.vue (54KB) - Specialist interface       │  │   │
│  │   │   • AdvancedHealthScore/ - Premium health analytics              │  │   │
│  │   └──────────────────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                      REUSABLE COMPONENTS (102)                           │   │
│  │   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │   │
│  │   │RCButton │ │ RCTab   │ │RCModal  │ │RCCombo  │ │RCSelect │          │   │
│  │   └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘          │   │
│  │   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │   │
│  │   │Body     │ │Region   │ │DropDown│ │Cards    │ │Inputs   │          │   │
│  │   │Avatar   │ │Map      │ │Search   │ │         │ │(8 types)│          │   │
│  │   └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                        SERVICE LAYER                                     │   │
│  │   apiFactory.js (22,775 lines) - 100+ endpoint methods                  │   │
│  │   http.js (25 lines) - Axios interceptors, auth injection               │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 3.4 Admin Frontend Architecture (RC_Admin_UI)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     ADMIN FRONTEND (Vue.js 3 + Vuetify 3)                       │
│                              Port: 8080                                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         STATE MANAGEMENT (Pinia)                         │   │
│  │                                                                          │   │
│  │   ┌───────────────┐  ┌───────────────┐  ┌───────────────┐              │   │
│  │   │    patient    │  │  specialist   │  │advancedHealth │              │   │
│  │   │   (105 lines) │  │               │  │Score (279 ln) │              │   │
│  │   │               │  │               │  │               │              │   │
│  │   │• fetchPatients│  │• CRUD         │  │• Settings     │              │   │
│  │   │• updateStatus │  │• Verify       │  │• Questions    │              │   │
│  │   │• Countries    │  │• Documents    │  │• Analytics    │              │   │
│  │   └───────────────┘  └───────────────┘  └───────────────┘              │   │
│  │   ┌───────────────┐  ┌───────────────┐  ┌───────────────┐              │   │
│  │   │ claudeSummary │  │   referrals   │  │  appointment  │              │   │
│  │   │               │  │  (129 lines)  │  │               │              │   │
│  │   │• Plans CRUD   │  │• Analytics    │  │• Scheduling   │              │   │
│  │   │• Credits      │  │• Click Track  │  │• Management   │              │   │
│  │   │• Analytics    │  │• Settings     │  │               │              │   │
│  │   └───────────────┘  └───────────────┘  └───────────────┘              │   │
│  │   ┌───────────────┐  ┌───────────────┐  ┌───────────────┐              │   │
│  │   │   lifeguard   │  │whatsappQueue  │  │   settings    │              │   │
│  │   │               │  │   (9.7KB)     │  │               │              │   │
│  │   └───────────────┘  └───────────────┘  └───────────────┘              │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         PAGE COMPONENTS (42+)                            │   │
│  │                                                                          │   │
│  │   ┌──────────────────────────────────────────────────────────────────┐  │   │
│  │   │                    DASHBOARD (index.vue - 703 lines)              │  │   │
│  │   │   ┌─────────────────────────────────────────────────────────┐    │  │   │
│  │   │   │  KPI CARDS (5)                                           │    │  │   │
│  │   │   │  • Total Users    • Today's Appointments                 │    │  │   │
│  │   │   │  • Specialists    • Lifeguards    • AI Health Checkups   │    │  │   │
│  │   │   └─────────────────────────────────────────────────────────┘    │  │   │
│  │   │   ┌─────────────────────────────────────────────────────────┐    │  │   │
│  │   │   │  CHARTS (Chart.js)                                       │    │  │   │
│  │   │   │  • Platform Activity (Line) - Patients, Appointments     │    │  │   │
│  │   │   │  • Health Checkup Trends (Bar) - 30-day view             │    │  │   │
│  │   │   └─────────────────────────────────────────────────────────┘    │  │   │
│  │   │   ┌─────────────────────────────────────────────────────────┐    │  │   │
│  │   │   │  WIDGETS                                                 │    │  │   │
│  │   │   │  • Recent Activities (5 types with icons)                │    │  │   │
│  │   │   │  • Pending Specialist Approvals                          │    │  │   │
│  │   │   └─────────────────────────────────────────────────────────┘    │  │   │
│  │   └──────────────────────────────────────────────────────────────────┘  │   │
│  │                                                                          │   │
│  │   ┌──────────────────────────────────────────────────────────────────┐  │   │
│  │   │              PATIENT PROFILE (/patients/[id].vue)                 │  │   │
│  │   │                                                                    │  │   │
│  │   │   ┌────────────────────────────────────────────────────────────┐  │  │   │
│  │   │   │  10 TAB SECTIONS                                           │  │  │   │
│  │   │   │  1. BioPanel            6. HealthStatusOverview            │  │  │   │
│  │   │   │  2. QuickActions        7. CommunicationHistory            │  │  │   │
│  │   │   │  3. PatientDependents   8. NotesSection                    │  │  │   │
│  │   │   │  4. PatientBilling      9. AccountManagement               │  │  │   │
│  │   │   │  5. MedicalHistory     10. ClaudeSummaryCredits            │  │  │   │
│  │   │   └────────────────────────────────────────────────────────────┘  │  │   │
│  │   │                                                                    │  │   │
│  │   │   ┌────────────────────────────────────────────────────────────┐  │  │   │
│  │   │   │  QuickActions.vue (1,619 lines) - 5 Dialogs                │  │  │   │
│  │   │   │  • Suspend/Deactivate Account                              │  │  │   │
│  │   │   │  • Message Patient                                         │  │  │   │
│  │   │   │  • Edit Profile (25+ fields)                               │  │  │   │
│  │   │   │  • Schedule Appointment (calendar, specialists, channels)  │  │  │   │
│  │   │   └────────────────────────────────────────────────────────────┘  │  │   │
│  │   └──────────────────────────────────────────────────────────────────┘  │   │
│  │                                                                          │   │
│  │   ┌──────────────────────────────────────────────────────────────────┐  │   │
│  │   │                    OTHER KEY PAGES                                │  │   │
│  │   │  • /specialists/         - Specialist management                  │  │   │
│  │   │  • /lifeguards/          - Lifeguard oversight                    │  │   │
│  │   │  • /appointments/        - Appointment management                 │  │   │
│  │   │  • /health-checkups/[id] - Detailed checkup view                  │  │   │
│  │   │  • /advanced-health-score/ - Analytics + Questions + Settings     │  │   │
│  │   │  • /claude-summary/      - AI summary plan management             │  │   │
│  │   │  • /pharmacy/            - 8 sub-modules (inventory, orders...)   │  │   │
│  │   │  • /referrals/           - Referral analytics & tracking          │  │   │
│  │   └──────────────────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                        UTILITY FUNCTIONS                                 │   │
│  │   health-score-calculator.js (635 lines)                                │   │
│  │   ├── calculateBMIScore()           - Weight category scoring           │   │
│  │   ├── calculateBloodPressureScore() - BP stage assessment               │   │
│  │   ├── calculatePulseRateScore()     - Heart rate analysis               │   │
│  │   ├── calculateTemperatureScore()   - Fever detection                   │   │
│  │   ├── calculateBloodSugarScore()    - Glucose level assessment          │   │
│  │   ├── calculateTriageScore()        - Infermedica triage integration    │   │
│  │   ├── calculateRiskFactorsScore()   - Lifestyle risk assessment         │   │
│  │   └── calculateDataCompletenessBonus() - Profile completeness reward    │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Data Flow Diagrams

### 4.1 AI Health Checkup Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      AI-POWERED HEALTH CHECKUP FLOW                             │
└─────────────────────────────────────────────────────────────────────────────────┘

   ┌─────────┐                                                      ┌─────────────┐
   │ Patient │                                                      │ Infermedica │
   │ (Vue.js)│                                                      │     AI      │
   └────┬────┘                                                      └──────┬──────┘
        │                                                                  │
        │  1. Start Health Checkup                                         │
        │  (gender, age, health_check_for)                                 │
        ├──────────────────────────────────────────────────────────────►   │
        │                                                                  │
        │                    ┌───────────────────┐                         │
        │                    │   RC-Backend      │                         │
        │                    │                   │                         │
        │  2. POST /api/     │ ┌───────────────┐ │  3. POST /v3/parse      │
        │     health-checkup │ │HealthCheckup  │ ├─────────────────────────►
        ├───────────────────►│ │   Service     │ │                         │
        │                    │ │               │ │  4. Parsed symptoms     │
        │                    │ │ • Interview   │ ◄─────────────────────────┤
        │                    │ │   Token Gen   │ │                         │
        │                    │ │ • Duration    │ │                         │
        │                    │ │   Mapping     │ │                         │
        │                    │ └───────────────┘ │                         │
        │                    └─────────┬─────────┘                         │
        │                              │                                   │
        │  5. Suggested symptoms       │                                   │
        ◄──────────────────────────────┤                                   │
        │                              │                                   │
        │  6. User selects symptoms    │                                   │
        │     + duration per symptom   │                                   │
        ├──────────────────────────────►                                   │
        │                              │                                   │
        │                              │  7. POST /v3/diagnosis            │
        │                              │     (with enable_symptom_duration)│
        │                              ├──────────────────────────────────►│
        │                              │                                   │
        │                              │  8. Question or Conditions        │
        │                              ◄──────────────────────────────────┤│
        │                              │                                   │
   ┌────┴────────────────────────────────────────────────────────────────────┐
   │                        INTERVIEW LOOP                                    │
   │                                                                          │
   │    ┌──────────────────────────────────────────────────────────────┐    │
   │    │  While (question exists && !should_stop):                     │    │
   │    │    1. Display question to patient                             │    │
   │    │    2. Collect answer (single/group_single/group_multiple)     │    │
   │    │    3. Add evidence with source: "interview"                   │    │
   │    │    4. POST /v3/diagnosis with updated evidence                │    │
   │    │    5. Receive next question OR final conditions               │    │
   │    └──────────────────────────────────────────────────────────────┘    │
   └──────────────────────────────────────────────────────────────────────────┘
        │                              │                                   │
        │  9. Final Diagnosis          │                                   │
        │     {                        │                                   │
        │       conditions: [...],     │                                   │
        │       triage_level,          │                                   │
        │       has_emergency_evidence,│                                   │
        │       specialist_recs        │                                   │
        │     }                        │                                   │
        ◄──────────────────────────────┤                                   │
        │                              │                                   │
        │                    ┌─────────┴─────────┐                         │
        │                    │     MongoDB       │                         │
        │                    │  HealthCheckups   │                         │
        │                    │    Collection     │                         │
        │                    └───────────────────┘                         │
        │                              │                                   │
        │                    ┌─────────┴─────────┐         ┌─────────────┐
        │                    │   Claude AI       │◄────────│  Anthropic  │
        │                    │   Summary Gen     │         │    API      │
        │                    └─────────┬─────────┘         └─────────────┘
        │                              │
        │  10. AI Health Summary       │
        │      (plain language)        │
        ◄──────────────────────────────┤
        │                              │
   ┌────▼────┐                         │
   │Diagnosis│                         │
   │ Report  │                         │
   │  View   │                         │
   └─────────┘                         │
```

### 4.2 Appointment Booking Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        APPOINTMENT BOOKING FLOW                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Patient │     │  RC-Backend │     │   Paystack  │     │    Zoom     │
│ Frontend│     │ Appointments│     │   Payment   │     │     API     │
└────┬────┘     └──────┬──────┘     └──────┬──────┘     └──────┬──────┘
     │                 │                   │                   │
     │ 1. Select Specialist Category       │                   │
     ├────────────────►│                   │                   │
     │                 │                   │                   │
     │ 2. GET /available-specialists       │                   │
     ├────────────────►│                   │                   │
     │                 │                   │                   │
     │ 3. Specialist List                  │                   │
     ◄────────────────┤│                   │                   │
     │                 │                   │                   │
     │ 4. Select Specialist + Date         │                   │
     ├────────────────►│                   │                   │
     │                 │                   │                   │
     │ 5. GET /available-times             │                   │
     │    (Double-booking check)           │                   │
     ├────────────────►│                   │                   │
     │                 │                   │                   │
     │                 │ ┌───────────────────────────────────┐ │
     │                 │ │ MongoDB Aggregation Pipeline      │ │
     │                 │ │                                   │ │
     │                 │ │ $or: [                            │ │
     │                 │ │   // 3 overlap scenarios          │ │
     │                 │ │   { start <= requested &&         │ │
     │                 │ │     end > requested },            │ │
     │                 │ │   { start < req_end &&            │ │
     │                 │ │     end >= req_end },             │ │
     │                 │ │   { start >= requested &&         │ │
     │                 │ │     end <= req_end }              │ │
     │                 │ │ ]                                 │ │
     │                 │ └───────────────────────────────────┘ │
     │                 │                   │                   │
     │ 6. Available Time Slots             │                   │
     ◄────────────────┤│                   │                   │
     │                 │                   │                   │
     │ 7. Select Time + Meeting Channel    │                   │
     │    (Zoom/Meet/Teams/WhatsApp/Phone) │                   │
     ├────────────────►│                   │                   │
     │                 │                   │                   │
     │ 8. POST /appointments (create)      │                   │
     ├────────────────►│                   │                   │
     │                 │                   │                   │
     │                 │ 9. Initialize     │                   │
     │                 │    Payment        │                   │
     │                 ├──────────────────►│                   │
     │                 │                   │                   │
     │                 │ 10. Auth URL      │                   │
     │                 ◄──────────────────┤│                   │
     │                 │                   │                   │
     │ 11. Redirect to Paystack            │                   │
     ◄────────────────┤│                   │                   │
     │                 │                   │                   │
     │ ══════════════ PAYMENT FLOW ══════════════             │
     │                 │                   │                   │
     │ 12. Payment Complete                │                   │
     ├────────────────────────────────────►│                   │
     │                 │                   │                   │
     │                 │ 13. Webhook       │                   │
     │                 ◄──────────────────┤│                   │
     │                 │                   │                   │
     │                 │ 14. If channel == ZOOM               │
     │                 │     Create Meeting│                   │
     │                 ├──────────────────────────────────────►│
     │                 │                   │                   │
     │                 │ 15. Meeting Details (join_url, etc)  │
     │                 ◄──────────────────────────────────────┤│
     │                 │                   │                   │
     │                 │ ┌─────────────────────────────────┐  │
     │                 │ │ Update Appointment:             │  │
     │                 │ │ • payment_status: SUCCESSFUL    │  │
     │                 │ │ • meeting_platform_data: {...}  │  │
     │                 │ │ • status: OPEN                  │  │
     │                 │ └─────────────────────────────────┘  │
     │                 │                   │                   │
     │ 16. Confirmation + Calendar Invite  │                   │
     ◄────────────────┤│                   │                   │
     │                 │                   │                   │
     │                 │ 17. Google Calendar Event            │
     │                 ├─────────────────────────────────────►│
     │                 │    (with Google Meet if applicable)  │
     │                 │                   │                   │
   ──┴──               │                   │                   │
```

### 4.3 Admin Patient Management Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     ADMIN PATIENT MANAGEMENT FLOW                               │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    Admin    │     │ Admin       │     │   Shared    │     │   Patient   │
│   Frontend  │     │ Backend     │     │  MongoDB    │     │   Backend   │
│  (Vuetify)  │     │ (5021)      │     │             │     │   (5020)    │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │                   │
       │ 1. View Patient Profile               │                   │
       ├──────────────────►│                   │                   │
       │                   │                   │                   │
       │                   │ 2. 16 Parallel Queries (Promise.all) │
       │                   ├──────────────────►│                   │
       │                   │                   │                   │
       │                   │  • Users.findById │                   │
       │                   │  • HealthCheckups │                   │
       │                   │  • Appointments   │                   │
       │                   │  • Vitals         │                   │
       │                   │  • Subscriptions  │                   │
       │                   │  • Transactions   │                   │
       │                   │                   │                   │
       │ 3. Complete Patient Profile           │                   │
       ◄──────────────────┤│                   │                   │
       │                   │                   │                   │
       │   ┌───────────────────────────────────────────────────┐  │
       │   │           ADMIN DASHBOARD VIEW                     │  │
       │   │  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │  │
       │   │  │  BioPanel   │  │ QuickActions│  │ Medical    │ │  │
       │   │  │             │  │             │  │ History    │ │  │
       │   │  │ • Name      │  │ • Message   │  │            │ │  │
       │   │  │ • Contact   │  │ • Call      │  │ • Checkups │ │  │
       │   │  │ • Status    │  │ • Suspend   │  │ • Notes    │ │  │
       │   │  └─────────────┘  │ • Edit      │  │ • BMI      │ │  │
       │   │                   │ • Schedule  │  └────────────┘ │  │
       │   │  ┌─────────────┐  └─────────────┘  ┌────────────┐ │  │
       │   │  │Health Score │                   │ Activity   │ │  │
       │   │  │  Overview   │                   │ Timeline   │ │  │
       │   │  │             │                   │            │ │  │
       │   │  │ Basic: 72   │                   │ • 50 items │ │  │
       │   │  │ Premium: 85 │                   │ • Types    │ │  │
       │   │  └─────────────┘                   └────────────┘ │  │
       │   └───────────────────────────────────────────────────┘  │
       │                   │                   │                   │
       │ 4. Suspend Patient                    │                   │
       ├──────────────────►│                   │                   │
       │                   │                   │                   │
       │                   │ 5. Update User    │                   │
       │                   │    is_suspended:  │                   │
       │                   │    true           │                   │
       │                   ├──────────────────►│                   │
       │                   │                   │                   │
       │                   │ 6. Send Email     │                   │
       │                   │    (Brevo SMTP)   │                   │
       │                   │                   │                   │
       │ 7. Confirmation   │                   │                   │
       ◄──────────────────┤│                   │                   │
       │                   │                   │                   │
       │ 8. Schedule Appointment for Patient   │                   │
       ├──────────────────►│                   │                   │
       │                   │                   │                   │
       │                   │ 9. Create Appointment                │
       │                   │    (created_by_admin: true)          │
       │                   ├──────────────────►│                   │
       │                   │                   │                   │
       │                   │                   │ 10. Trigger       │
       │                   │                   │     Notification  │
       │                   │                   ├──────────────────►│
       │                   │                   │                   │
       │ 11. Success       │                   │                   │
       ◄──────────────────┤│                   │                   │
       │                   │                   │                   │
```

---

## 5. Integration Architecture

### 5.1 External Services Integration Map

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                       EXTERNAL SERVICES INTEGRATION                             │
└─────────────────────────────────────────────────────────────────────────────────┘

                              ┌─────────────────────┐
                              │   RAPID CAPSULE     │
                              │      BACKEND        │
                              └──────────┬──────────┘
                                         │
         ┌───────────────────────────────┼───────────────────────────────┐
         │                               │                               │
         ▼                               ▼                               ▼
┌─────────────────┐           ┌─────────────────┐           ┌─────────────────┐
│   AI SERVICES   │           │   COMMUNICATION │           │    PAYMENTS     │
├─────────────────┤           ├─────────────────┤           ├─────────────────┤
│                 │           │                 │           │                 │
│ ┌─────────────┐ │           │ ┌─────────────┐ │           │ ┌─────────────┐ │
│ │ Infermedica │ │           │ │    Zoom     │ │           │ │  Paystack   │ │
│ │     AI      │ │           │ │             │ │           │ │             │ │
│ │             │ │           │ │ • OAuth     │ │           │ │ • Init      │ │
│ │ • Parse     │ │           │ │ • Meetings  │ │           │ │ • Verify    │ │
│ │ • Diagnose  │ │           │ │ • Clinical  │ │           │ │ • Tokenize  │ │
│ │ • Triage    │ │           │ │   Notes     │ │           │ │ • Transfer  │ │
│ │ • Explain   │ │           │ └─────────────┘ │           │ │ • Webhook   │ │
│ └─────────────┘ │           │                 │           │ └─────────────┘ │
│                 │           │ ┌─────────────┐ │           │                 │
│ ┌─────────────┐ │           │ │   Twilio    │ │           └─────────────────┘
│ │  Claude AI  │ │           │ │             │ │
│ │ (Anthropic) │ │           │ │ • SMS OTP   │ │           ┌─────────────────┐
│ │             │ │           │ │ • Voice     │ │           │    STORAGE      │
│ │ • Health    │ │           │ │ • Verify    │ │           ├─────────────────┤
│ │   Summaries │ │           │ └─────────────┘ │           │                 │
│ │ • Reports   │ │           │                 │           │ ┌─────────────┐ │
│ └─────────────┘ │           │ ┌─────────────┐ │           │ │   AWS S3    │ │
│                 │           │ │   Brevo     │ │           │ │             │ │
└─────────────────┘           │ │   (SMTP)    │ │           │ │ • Documents │ │
                              │ │             │ │           │ │ • Images    │ │
                              │ │ • Transac-  │ │           │ │ • Presigned │ │
                              │ │   tional    │ │           │ │   URLs      │ │
                              │ │ • Templates │ │           │ └─────────────┘ │
                              │ └─────────────┘ │           │                 │
                              │                 │           └─────────────────┘
                              │ ┌─────────────┐ │
                              │ │  Gupshup    │ │           ┌─────────────────┐
                              │ │ (WhatsApp)  │ │           │   CALENDAR      │
                              │ │             │ │           ├─────────────────┤
                              │ │ • Messages  │ │           │                 │
                              │ │ • Templates │ │           │ ┌─────────────┐ │
                              │ └─────────────┘ │           │ │   Google    │ │
                              │                 │           │ │  Calendar   │ │
                              └─────────────────┘           │ │             │ │
                                                            │ │ • Events    │ │
                                                            │ │ • Meet Link │ │
                                                            │ └─────────────┘ │
                                                            │                 │
                                                            └─────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────┐
│                         INTEGRATION DETAILS                                     │
├────────────────┬────────────────────────────────────────────────────────────────┤
│ Service        │ Integration Details                                            │
├────────────────┼────────────────────────────────────────────────────────────────┤
│ Infermedica    │ API v3, Interview tokens, Duration support, Triage mode        │
│ Claude AI      │ @anthropic-ai/sdk v0.71.2, Health summaries, Document analysis │
│ Zoom           │ Server-to-Server OAuth, Meeting CRUD, Clinical notes sync      │
│ Twilio         │ Verify API for SMS/Voice OTP                                   │
│ Paystack       │ Payment init/verify, Card tokenization, Specialist transfers   │
│ AWS S3         │ Document storage, Presigned URLs (1hr expiry)                  │
│ Brevo          │ Transactional emails, Template-based notifications             │
│ Gupshup        │ WhatsApp Business messaging, Appointment reminders             │
│ Google Cal     │ Service account auth, Event creation, Google Meet integration  │
└────────────────┴────────────────────────────────────────────────────────────────┘
```

### 5.2 Authentication Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        AUTHENTICATION ARCHITECTURE                              │
└─────────────────────────────────────────────────────────────────────────────────┘

                                    ┌─────────────┐
                                    │   Client    │
                                    │ (Vue.js)    │
                                    └──────┬──────┘
                                           │
                    ┌──────────────────────┼──────────────────────┐
                    │                      │                      │
                    ▼                      ▼                      ▼
           ┌───────────────┐      ┌───────────────┐      ┌───────────────┐
           │    Local      │      │    Google     │      │    Apple      │
           │    Login      │      │    OAuth      │      │   Sign-In     │
           └───────┬───────┘      └───────┬───────┘      └───────┬───────┘
                   │                      │                      │
                   │                      ▼                      │
                   │              ┌───────────────┐              │
                   │              │ Google OAuth  │              │
                   │              │   Server      │              │
                   │              └───────┬───────┘              │
                   │                      │                      │
                   │                      ▼                      ▼
                   │              ┌───────────────┐      ┌───────────────┐
                   │              │ Token Decode  │      │  Apple JWT    │
                   │              │ & Validate    │      │   Validate    │
                   │              └───────┬───────┘      └───────┬───────┘
                   │                      │                      │
                   └──────────────────────┼──────────────────────┘
                                          │
                                          ▼
                              ┌─────────────────────┐
                              │    AUTH SERVICE     │
                              │                     │
                              │  ┌───────────────┐  │
                              │  │ validateUser  │  │
                              │  │ (email/pass)  │  │
                              │  │    OR         │  │
                              │  │ validateOAuth │  │
                              │  └───────┬───────┘  │
                              │          │          │
                              │          ▼          │
                              │  ┌───────────────┐  │
                              │  │ Check 2FA     │  │
                              │  │ Enabled?      │  │
                              │  └───────┬───────┘  │
                              └──────────┼──────────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    │ NO                 │                YES │
                    ▼                    │                    ▼
           ┌───────────────┐             │           ┌───────────────┐
           │  Generate     │             │           │  2FA Methods  │
           │  JWT Token    │             │           │               │
           └───────┬───────┘             │           │ • Email OTP   │
                   │                     │           │ • SMS OTP     │
                   │                     │           │ • TOTP App    │
                   │                     │           └───────┬───────┘
                   │                     │                   │
                   │                     │                   ▼
                   │                     │           ┌───────────────┐
                   │                     │           │ Verify OTP    │
                   │                     │           │ /2fa/verify   │
                   │                     │           └───────┬───────┘
                   │                     │                   │
                   │                     └───────────────────┘
                   │                               │
                   └───────────────────────────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   JWT Response      │
                         │                     │
                         │ {                   │
                         │   token: "xxx...",  │
                         │   user: {...}       │
                         │ }                   │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   Subsequent        │
                         │   Requests          │
                         │                     │
                         │ Authorization:      │
                         │ Bearer <token>      │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   GUARD CHAIN       │
                         │                     │
                         │ 1. JwtAuthGuard     │
                         │ 2. IsAuthorized     │
                         │ 3. IsEmailVerified  │
                         │ 4. IsUserActive     │
                         └─────────────────────┘
```

---

## 6. Security Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          SECURITY ARCHITECTURE                                  │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              NETWORK LAYER                                      │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         Cloudflare (SSL/TLS)                             │   │
│  │  • DDoS Protection    • WAF Rules    • SSL Termination                  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                          │
│                                      ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                             NGINX Proxy                                  │   │
│  │  • Rate Limiting      • Request Filtering    • Header Security          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            APPLICATION LAYER                                    │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                        GLOBAL MIDDLEWARE                                 │   │
│  │                                                                          │   │
│  │   ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐       │   │
│  │   │  Helmet()  │  │   CORS()   │  │BodyParser  │  │  Morgan()  │       │   │
│  │   │            │  │            │  │  (50MB)    │  │  Logging   │       │   │
│  │   │• CSP       │  │• Origins   │  │            │  │            │       │   │
│  │   │• XSS       │  │• Headers   │  │            │  │            │       │   │
│  │   │• HSTS      │  │• Methods   │  │            │  │            │       │   │
│  │   └────────────┘  └────────────┘  └────────────┘  └────────────┘       │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                          AUTHENTICATION                                  │   │
│  │                                                                          │   │
│  │   ┌──────────────────────────────────────────────────────────────────┐  │   │
│  │   │                     JWT + Passport.js                             │  │   │
│  │   │                                                                   │  │   │
│  │   │   Strategies:                                                     │  │   │
│  │   │   • LocalStrategy    (email/password)                             │  │   │
│  │   │   • JwtStrategy      (Bearer token)                               │  │   │
│  │   │   • GoogleStrategy   (OAuth 2.0)                                  │  │   │
│  │   │   • AppleStrategy    (Sign in with Apple)                         │  │   │
│  │   └──────────────────────────────────────────────────────────────────┘  │   │
│  │                                                                          │   │
│  │   ┌──────────────────────────────────────────────────────────────────┐  │   │
│  │   │                   Two-Factor Authentication                       │  │   │
│  │   │                                                                   │  │   │
│  │   │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │  │   │
│  │   │   │  Email OTP  │  │   SMS OTP   │  │  TOTP App   │              │  │   │
│  │   │   │             │  │  (Twilio)   │  │  (otplib)   │              │  │   │
│  │   │   └─────────────┘  └─────────────┘  └─────────────┘              │  │   │
│  │   └──────────────────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         AUTHORIZATION GUARDS                             │   │
│  │                                                                          │   │
│  │   Request Flow:                                                         │   │
│  │                                                                          │   │
│  │   ┌──────────┐    ┌──────────────┐    ┌────────────────┐    ┌────────┐ │   │
│  │   │  JWT     │───►│ IsAuthorized │───►│ IsEmailVerified│───►│IsUser  │ │   │
│  │   │  Auth    │    │ (user exists)│    │                │    │Active  │ │   │
│  │   │  Guard   │    │              │    │                │    │        │ │   │
│  │   └──────────┘    └──────────────┘    └────────────────┘    └────────┘ │   │
│  │                                                                          │   │
│  │   Additional Guards:                                                    │   │
│  │   • DoesUserExist     - Pre-registration check                          │   │
│  │   • DoesUserHaveCard  - Payment method validation                       │   │
│  │   • AdminOrJwtGuard   - Dual authentication                             │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                           INPUT VALIDATION                               │   │
│  │                                                                          │   │
│  │   ┌──────────────────────────────────────────────────────────────────┐  │   │
│  │   │                    ValidationPipe (Global)                        │  │   │
│  │   │                                                                   │  │   │
│  │   │   • class-validator    - DTO validation                           │  │   │
│  │   │   • class-transformer  - Type casting                             │  │   │
│  │   │   • @Match() decorator - Password confirmation                    │  │   │
│  │   │   • Whitelist mode     - Strip unknown properties                 │  │   │
│  │   └──────────────────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                               DATA LAYER                                        │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                        PASSWORD SECURITY                                 │   │
│  │                                                                          │   │
│  │   ┌────────────────────────────────────────────────────────────────┐    │   │
│  │   │  Bcrypt Hashing (10 salt rounds)                               │    │   │
│  │   │                                                                 │    │   │
│  │   │  const salt = await bcrypt.genSalt(10);                        │    │   │
│  │   │  return await bcrypt.hash(password, salt);                     │    │   │
│  │   └────────────────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                     SENSITIVE DATA HANDLING                              │   │
│  │                                                                          │   │
│  │   Excluded from API responses:                                          │   │
│  │   • profile.password                                                    │   │
│  │   • security (2FA secrets)                                              │   │
│  │   • twoFA_secret                                                        │   │
│  │                                                                          │   │
│  │   Environment Variables:                                                │   │
│  │   • JWTKEY, JWT_EXPIRY                                                  │   │
│  │   • API keys (Infermedica, Zoom, Paystack, etc.)                        │   │
│  │   • Database credentials                                                 │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                      DATABASE SECURITY                                   │   │
│  │                                                                          │   │
│  │   • Unique indexes (email, phone)                                       │   │
│  │   • Soft deletes (deleted_at field)                                     │   │
│  │   • Enum constraints (status, user_type)                                │   │
│  │   • Required field validation                                           │   │
│  │   • Mongoose schema validation                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Database Schema

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          DATABASE SCHEMA (MongoDB)                              │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              USERS COLLECTION                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  {                                                                              │
│    _id: ObjectId,                                                               │
│    profile: {                                                                   │
│      first_name: String,                        ┌─────────────────────────┐    │
│      last_name: String,                         │     RELATIONSHIPS       │    │
│      gender: "male" | "female",                 ├─────────────────────────┤    │
│      date_of_birth: Date,                       │                         │    │
│      password: String (hashed),                 │  Users ──┬──► Appointments   │
│      marital_status: String,                    │          │    (patient)  │    │
│      profile_photo: String (S3 URL),            │          │              │    │
│      contact: {                                 │          ├──► Appointments   │
│        email: String (unique, indexed),         │          │    (specialist)│   │
│        phone: {                                 │          │              │    │
│          country_code: String,                  │          ├──► HealthCheckups │
│          number: String (unique)                │          │              │    │
│        },                                       │          ├──► Vitals     │    │
│        address: String,                         │          │              │    │
│        state: String,                           │          ├──► Prescriptions  │
│        country: String                          │          │              │    │
│      },                                         │          ├──► Payments   │    │
│      basic_health_info: {                       │          │              │    │
│        height: { value: Number, unit: String }, │          └──► Wallet     │    │
│        weight: { value: Number, unit: String }  │                         │    │
│      },                                         └─────────────────────────┘    │
│      health_risk_factors: {                                                     │
│        is_smoker: Boolean,                                                      │
│        weight_status: String,                                                   │
│        has_recent_injuries: Boolean                                             │
│      },                                                                         │
│      emergency_contacts: [{                                                     │
│        name: String,                                                            │
│        phone: String,                                                           │
│        relationship: String                                                     │
│      }],                                                                        │
│      twoFA_secret: String                                                       │
│    },                                                                           │
│    user_type: "Patient" | "Specialist" | "Lifeguard" | "Admin",                │
│    reg_medium: "GOOGLE" | "APPLE" | "LOCAL",                                   │
│    status: "ACTIVE" | "INACTIVE" | "CANCELLED" | "SUSPENDED",                  │
│    verification_status: "VERIFIED" | "UNVERIFIED" | "SUSPENDED",               │
│    is_email_verified: Boolean,                                                  │
│    is_active: Boolean,                                                          │
│    is_suspended: Boolean,                                                       │
│    suspension_reason: String,                                                   │
│    suspended_by: ObjectId,                                                      │
│    suspended_at: Date,                                                          │
│    last_login_at: Date,                                                         │
│    created_at: Date,                                                            │
│    updated_at: Date                                                             │
│  }                                                                              │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                           HEALTH CHECKUPS COLLECTION                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  {                                                                              │
│    _id: ObjectId,                                                               │
│    user: ObjectId (ref: Users),               ─────────────────────────────    │
│    health_check_for: "SELF" | "DEPENDANT" | "THIRD_PARTY",                     │
│    checkup_owner_id: ObjectId,                                                  │
│    patient_info: {                                                              │
│      age: Number,                                                               │
│      gender: String,                                                            │
│      medical_history: [String]                                                  │
│    },                                                                           │
│    request: {                              ┌──────────────────────────────────┐│
│      interview_token: String (indexed),    │     INFERMEDICA RESPONSE        ││
│      evidence: [{                          ├──────────────────────────────────┤│
│        id: String,                         │ conditions: [{                   ││
│        choice_id: String,                  │   id: String,                    ││
│        source: "initial"|"interview",      │   name: String,                  ││
│        duration: {                         │   probability: Number,           ││
│          value: Number,                    │   common_name: String            ││
│          unit: "hour"|"day"|"week"         │ }],                              ││
│        }                                   │ triage_level: String,            ││
│      }]                                    │ has_emergency_evidence: Boolean, ││
│    },                                      │ specialist_recommendations: []   ││
│    response: {                             └──────────────────────────────────┘│
│      data: { ... }  // Infermedica response                                    │
│    },                                                                           │
│    interview_duration: Number,                                                  │
│    considered_diagnoses: Number,                                                │
│    has_symptom_duration: Boolean,                                               │
│    is_triage_focused: Boolean,                                                  │
│    claude_summary: {                       ┌──────────────────────────────────┐│
│      generated_at: Date,                   │     CLAUDE AI SUMMARY            ││
│      model: String,                        ├──────────────────────────────────┤│
│      content: {                            │ Human-readable health            ││
│        overview: String,                   │ explanation generated by         ││
│        key_findings: [String],             │ Claude AI for patient            ││
│        possible_conditions: [String],      │ accessibility                    ││
│        recommendations: [String],          │                                  ││
│        when_to_seek_care: String           │                                  ││
│      }                                     └──────────────────────────────────┘│
│    },                                                                           │
│    deleted_at: Date (soft delete),                                              │
│    created_at: Date,                                                            │
│    updated_at: Date                                                             │
│  }                                                                              │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                           APPOINTMENTS COLLECTION                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  {                                                                              │
│    _id: ObjectId,                                                               │
│    category: String,                                                            │
│    start_time: Date (immutable),                                                │
│    timezone: String,                                                            │
│    appointment_type: String,                                                    │
│    call_duration: {                                                             │
│      time_taken: Number,                                                        │
│      unit: String,                                                              │
│      formatted_string: String                                                   │
│    },                                                                           │
│    patient: ObjectId (ref: Users),          ───────────────────────────────    │
│    specialist: ObjectId (ref: Users),       ───────────────────────────────    │
│    meeting_channel: "ZOOM" | "GOOGLE_MEET" | "TEAMS" |                         │
│                     "WHATSAPP" | "PHONE" | "IN_PERSON",                         │
│    meeting_platform_data: {                 ┌──────────────────────────────┐   │
│      join_url: String,                      │  ZOOM MEETING DATA           │   │
│      start_url: String,                     │  (when channel = ZOOM)       │   │
│      meeting_id: String,                    │                              │   │
│      password: String                       │  Created via Zoom OAuth      │   │
│    },                                       └──────────────────────────────┘   │
│    clinical_notes: [{                                                           │
│      note_id: String,                                                           │
│      content: String,                                                           │
│      created_at: Date,                                                          │
│      completed: Boolean,                                                        │
│      platform: String                                                           │
│    }],                                                                          │
│    appointment_fee: Number,                                                     │
│    payment_status: "SUCCESSFUL" | "FAILED" | "PENDING",                        │
│    status: "COMPLETED" | "OPEN" | "CLOSED" | "CANCELLED" |                     │
│            "FAILED" | "ONGOING" | "RESCHEDULED",                                │
│    meeting_type: "AUDIO_ONLY" | "VIDEO_AUDIO",                                 │
│    patient_notes: String,                                                       │
│    specialist_notes: String,                                                    │
│    created_by_admin: Boolean,                                                   │
│    created_at: Date,                                                            │
│    updated_at: Date                                                             │
│  }                                                                              │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────┐  ┌────────────────────────────────────┐
│         VITALS COLLECTION          │  │       PAYMENTS COLLECTION          │
├────────────────────────────────────┤  ├────────────────────────────────────┤
│ {                                  │  │ {                                  │
│   _id: ObjectId,                   │  │   _id: ObjectId,                   │
│   userId: ObjectId (ref: Users),   │  │   userId: ObjectId (ref: Users),   │
│   body_temp: [{                    │  │   reference: String (Paystack),    │
│     value: Number,                 │  │   amount: Number,                  │
│     unit: String,                  │  │   payment_for: "APPOINTMENT" |     │
│     updatedAt: Date                │  │                "SUBSCRIPTION" |    │
│   }],                              │  │                "PRESCRIPTION",     │
│   blood_pressure: [{               │  │   status: "SUCCESSFUL" | "FAILED"  │
│     systolic: Number,              │  │           | "PENDING",             │
│     diastolic: Number,             │  │   metadata: {},                    │
│     updatedAt: Date                │  │   currency: String,                │
│   }],                              │  │   created_at: Date                 │
│   blood_sugar_level: [{...}],      │  │ }                                  │
│   body_weight: [{...}],            │  └────────────────────────────────────┘
│   pulse_rate: [{...}],             │
│   created_at: Date,                │  ┌────────────────────────────────────┐
│   updated_at: Date                 │  │        WALLETS COLLECTION          │
│ }                                  │  ├────────────────────────────────────┤
└────────────────────────────────────┘  │ {                                  │
                                        │   _id: ObjectId,                   │
┌────────────────────────────────────┐  │   user: ObjectId (Specialist),     │
│     PRESCRIPTIONS COLLECTION       │  │   balance: Number,                 │
├────────────────────────────────────┤  │   transactions: [{                 │
│ {                                  │  │     type: "CREDIT" | "DEBIT",      │
│   _id: ObjectId,                   │  │     amount: Number,                │
│   patient: ObjectId,               │  │     reference: String,             │
│   specialist: ObjectId,            │  │     description: String,           │
│   appointment: ObjectId,           │  │     created_at: Date               │
│   medications: [{                  │  │   }],                              │
│     name: String,                  │  │   created_at: Date                 │
│     dosage: String,                │  │ }                                  │
│     frequency: String,             │  └────────────────────────────────────┘
│     duration: String               │
│   }],                              │  ┌────────────────────────────────────┐
│   files: [String (S3 URLs)],       │  │   CLAUDE_SUMMARY_CREDITS           │
│   notes: String,                   │  ├────────────────────────────────────┤
│   status: String,                  │  │ {                                  │
│   created_at: Date                 │  │   user: ObjectId,                  │
│ }                                  │  │   free_credits: Number (5/month),  │
└────────────────────────────────────┘  │   purchased_credits: Number,       │
                                        │   gifted_credits: Number,          │
                                        │   unlimited_until: Date,           │
                                        │   last_free_reset: Date            │
                                        │ }                                  │
                                        └────────────────────────────────────┘
```

---

## 8. Technology Stack

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            TECHNOLOGY STACK                                     │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                               FRONTEND                                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  PATIENT APP (RC/)                      ADMIN APP (RC_Admin_UI/)               │
│  ─────────────────                      ─────────────────────────               │
│                                                                                 │
│  ┌─────────────────────────┐            ┌─────────────────────────┐            │
│  │ Framework               │            │ Framework               │            │
│  │ • Vue.js 3              │            │ • Vue.js 3              │            │
│  │ • Composition API       │            │ • Composition API       │            │
│  │ • Vue CLI 5             │            │ • Vite 4.1.0            │            │
│  └─────────────────────────┘            └─────────────────────────┘            │
│                                                                                 │
│  ┌─────────────────────────┐            ┌─────────────────────────┐            │
│  │ State Management        │            │ State Management        │            │
│  │ • Vuex 4                │            │ • Pinia 2.0.24          │            │
│  │ • 11 modules            │            │ • 9 stores              │            │
│  └─────────────────────────┘            └─────────────────────────┘            │
│                                                                                 │
│  ┌─────────────────────────┐            ┌─────────────────────────┐            │
│  │ UI Components           │            │ UI Components           │            │
│  │ • Custom components     │            │ • Vuetify 3             │            │
│  │ • oh-vue-icons          │            │ • Material Design       │            │
│  │ • v-calendar            │            │ • Chart.js 4.1.2        │            │
│  │ • Chart.js              │            │ • ApexCharts            │            │
│  └─────────────────────────┘            └─────────────────────────┘            │
│                                                                                 │
│  ┌─────────────────────────┐            ┌─────────────────────────┐            │
│  │ Utilities               │            │ Utilities               │            │
│  │ • Axios                 │            │ • html2pdf.js           │            │
│  │ • date-fns / Moment.js  │            │ • jwt-decode            │            │
│  │ • Vuelidate 2           │            │ • CASL (permissions)    │            │
│  │ • Socket.io-client      │            │ • moment.js             │            │
│  │ • vue-paystack          │            │ • v-calendar            │            │
│  └─────────────────────────┘            └─────────────────────────┘            │
│                                                                                 │
│  ┌─────────────────────────┐            ┌─────────────────────────┐            │
│  │ Authentication          │            │ Authentication          │            │
│  │ • vue3-google-login     │            │ • JWT tokens            │            │
│  │ • Apple Sign-In         │            │ • localStorage          │            │
│  │ • vue-recaptcha         │            │                         │            │
│  └─────────────────────────┘            └─────────────────────────┘            │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                               BACKEND                                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Core Framework                                                           │   │
│  │ • NestJS 9.x                                                             │   │
│  │ • TypeScript 4.7                                                         │   │
│  │ • Express.js                                                             │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Database                                                                 │   │
│  │ • MongoDB                                                                │   │
│  │ • Mongoose ODM 6.8.1                                                     │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Authentication & Security                                                │   │
│  │ • Passport.js (JWT, Local, Google, Apple strategies)                     │   │
│  │ • bcrypt (password hashing)                                              │   │
│  │ • otplib (TOTP 2FA)                                                      │   │
│  │ • Helmet (security headers)                                              │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Real-time                                                                │   │
│  │ • Socket.io                                                              │   │
│  │ • @nestjs/websockets                                                     │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Validation                                                               │   │
│  │ • class-validator                                                        │   │
│  │ • class-transformer                                                      │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Task Scheduling                                                          │   │
│  │ • @nestjs/schedule                                                       │   │
│  │ • cron                                                                   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                            EXTERNAL SERVICES                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐             │
│  │ AI/ML            │  │ Communication    │  │ Payments         │             │
│  │                  │  │                  │  │                  │             │
│  │ • Infermedica    │  │ • Zoom           │  │ • Paystack       │             │
│  │   (Diagnosis AI) │  │   (Video)        │  │   (Payment       │             │
│  │ • Anthropic      │  │ • Twilio         │  │    Processing)   │             │
│  │   Claude AI      │  │   (SMS/Voice)    │  │                  │             │
│  │                  │  │ • Brevo (Email)  │  │                  │             │
│  │                  │  │ • Gupshup        │  │                  │             │
│  │                  │  │   (WhatsApp)     │  │                  │             │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘             │
│                                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐             │
│  │ Storage          │  │ Calendar         │  │ Authentication   │             │
│  │                  │  │                  │  │                  │             │
│  │ • AWS S3         │  │ • Google         │  │ • Google OAuth   │             │
│  │   (Documents,    │  │   Calendar API   │  │ • Apple Sign-In  │             │
│  │    Images)       │  │ • Google Meet    │  │                  │             │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘             │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                            INFRASTRUCTURE                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐             │
│  │ Web Server       │  │ SSL/Security     │  │ Process Manager  │             │
│  │                  │  │                  │  │                  │             │
│  │ • NGINX          │  │ • Cloudflare     │  │ • PM2            │             │
│  │   (Reverse Proxy,│  │   (SSL, DDoS,    │  │   (4 services)   │             │
│  │    Load Balancer)│  │    WAF)          │  │                  │             │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘             │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Innovative Healthcare Features

This section highlights the novel healthcare innovations that differentiate Rapid Capsule in the telemedicine space.

### 9.1 Advanced Health Score System

A comprehensive AI-powered health assessment that creates a "digital health twin" for longitudinal tracking.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      ADVANCED HEALTH SCORE SYSTEM                               │
│                    6-Domain AI-Powered Health Assessment                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         6 HEALTH DOMAINS                                 │   │
│  │                                                                          │   │
│  │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                    │   │
│  │   │CARDIOVASCULAR│ │  METABOLIC  │  │   MENTAL    │                    │   │
│  │   │             │  │             │  │  WELLBEING  │                    │   │
│  │   │ • BP History│  │ • Weight    │  │             │                    │   │
│  │   │ • Heart Rate│  │ • Energy    │  │ • Stress    │                    │   │
│  │   │ • Chest Pain│  │ • Diabetes  │  │ • Sleep     │                    │   │
│  │   │ • Circulation│ │ • Blood Sugar│ │ • Mood      │                    │   │
│  │   └─────────────┘  └─────────────┘  └─────────────┘                    │   │
│  │                                                                          │   │
│  │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                    │   │
│  │   │  LIFESTYLE  │  │  PHYSICAL   │  │ PREVENTIVE  │                    │   │
│  │   │             │  │  SYMPTOMS   │  │    CARE     │                    │   │
│  │   │ • Exercise  │  │             │  │             │                    │   │
│  │   │ • Diet      │  │ • Pain      │  │ • Checkups  │                    │   │
│  │   │ • Alcohol   │  │ • Vision    │  │ • Vaccines  │                    │   │
│  │   │ • Tobacco   │  │ • Digestion │  │ • Monitoring│                    │   │
│  │   └─────────────┘  └─────────────┘  └─────────────┘                    │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                        DATA SOURCES INTEGRATION                          │   │
│  │                                                                          │   │
│  │   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐           │   │
│  │   │ Questionnaire│     │   Profile    │     │    Vitals    │           │   │
│  │   │  25 Questions│     │  Data        │     │  BP, Glucose │           │   │
│  │   │  Weighted    │────►│  Age, BMI    │────►│  Pulse, Temp │           │   │
│  │   │  -10 to +10  │     │  Conditions  │     │              │           │   │
│  │   └──────────────┘     └──────────────┘     └──────────────┘           │   │
│  │           │                    │                    │                    │   │
│  │           └────────────────────┼────────────────────┘                    │   │
│  │                                ▼                                          │   │
│  │   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐           │   │
│  │   │  Infermedica │     │   Uploaded   │     │  Claude AI   │           │   │
│  │   │   Checkups   │     │  Documents   │     │   Analysis   │           │   │
│  │   │              │────►│              │────►│              │           │   │
│  │   │ Triage Level │     │ Lab Results  │     │ Health Report│           │   │
│  │   │ Conditions   │     │ Medical Recs │     │ 0-100 Score  │           │   │
│  │   └──────────────┘     └──────────────┘     └──────────────┘           │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    CLAUDE AI REPORT GENERATION                           │   │
│  │                                                                          │   │
│  │   Input:                          Output:                                │   │
│  │   • 25 questionnaire answers      • Overall Score (0-100)                │   │
│  │   • Profile snapshot              • 6 Domain Scores                      │   │
│  │   • Recent vitals                 • Priority Actions (High/Med/Low)      │   │
│  │   • Infermedica checkups          • Detailed Analysis                    │   │
│  │   • Uploaded documents            • Lifestyle Tips                       │   │
│  │                                   • When to See Doctor                   │   │
│  │   Triage Impact:                  • Confidence Level                     │   │
│  │   • Emergency: -15 to -20 pts     • Data Sources Used                    │   │
│  │   • Consultation 24h: -10 to -12                                         │   │
│  │   • Consultation: -5 to -7                                               │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    DOCUMENT VERIFICATION (Claude Vision)                 │   │
│  │                                                                          │   │
│  │   1. Patient uploads medical document (PDF/Image)                        │   │
│  │   2. Claude Vision extracts names from document                          │   │
│  │   3. System validates patient name appears in document                   │   │
│  │   4. Prevents fraudulent document uploads                                │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  Key Innovation: Longitudinal health tracking with profile snapshots           │
│  stored at each assessment, enabling health trend analysis over time.          │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Key Files:**
- Service: `RC-Backend/src/modules/advanced-health-score/advanced-health-score.service.ts` (1,194 lines)
- Questions: `RC-Backend/src/modules/advanced-health-score/data/seed-questions.ts` (371 lines)
- Types: `RC-Backend/src/modules/advanced-health-score/types/advanced-score.types.ts`

---

### 9.2 Prescription & Pharmacy System

A comprehensive prescription management system supporting multiple input channels with OCR verification.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     PRESCRIPTION & PHARMACY SYSTEM                              │
│              Multi-Channel Prescription Processing with OCR                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    PRESCRIPTION INPUT CHANNELS                           │   │
│  │                                                                          │   │
│  │   ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐      │   │
│  │   │   SPECIALIST    │   │  PATIENT UPLOAD │   │    WHATSAPP     │      │   │
│  │   │  PRESCRIPTION   │   │  (Photo/PDF)    │   │   SUBMISSION    │      │   │
│  │   │                 │   │                 │   │                 │      │   │
│  │   │ Digital entry   │   │ Camera/Gallery  │   │ Send photo via  │      │   │
│  │   │ by doctor       │   │ upload          │   │ WhatsApp chat   │      │   │
│  │   │                 │   │                 │   │                 │      │   │
│  │   │ Status: DRAFT   │   │ Status: PENDING │   │ Status: PENDING │      │   │
│  │   └────────┬────────┘   └────────┬────────┘   └────────┬────────┘      │   │
│  │            │                     │                     │               │   │
│  │            └─────────────────────┼─────────────────────┘               │   │
│  │                                  ▼                                      │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                     AWS TEXTRACT OCR PIPELINE                            │   │
│  │                                                                          │   │
│  │   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐             │   │
│  │   │   Document   │    │   Text &     │    │  Medication  │             │   │
│  │   │   Upload     │───►│   Form       │───►│  Extraction  │             │   │
│  │   │              │    │   Detection  │    │              │             │   │
│  │   │ PDF/JPEG/PNG │    │  FORMS+TABLES│    │ 5 Strategies │             │   │
│  │   └──────────────┘    └──────────────┘    └──────────────┘             │   │
│  │                                                                          │   │
│  │   5-Level Medication Extraction Strategy:                               │   │
│  │   ┌────────────────────────────────────────────────────────────────┐   │   │
│  │   │ Strategy 1: Structured Format (95% confidence)                  │   │   │
│  │   │   Pattern: "Drug Name → Strength → Quantity → Directions"       │   │   │
│  │   ├────────────────────────────────────────────────────────────────┤   │   │
│  │   │ Strategy 2: Inline PDF Format (95% confidence)                  │   │   │
│  │   │   Pattern: "PRESCRIBED MEDICATION: DrugName Strength: Xmg..."   │   │   │
│  │   ├────────────────────────────────────────────────────────────────┤   │   │
│  │   │ Strategy 3: Common Medication Patterns (80% confidence)         │   │   │
│  │   │   Pattern: "Tab./Cap./Syrup + DrugName + Dosage"                │   │   │
│  │   ├────────────────────────────────────────────────────────────────┤   │   │
│  │   │ Strategy 4: Medication Section Detection (90% confidence)       │   │   │
│  │   │   Pattern: Look for explicit "MEDICATIONS" section              │   │   │
│  │   ├────────────────────────────────────────────────────────────────┤   │   │
│  │   │ Strategy 5: Fallback Pattern Matching (70% confidence)          │   │   │
│  │   │   Pattern: Simple drug name + mg/ml pattern                     │   │   │
│  │   └────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                          │   │
│  │   Extracted Data:                                                       │   │
│  │   • Doctor Name, License Number    • Prescription Date                  │   │
│  │   • Clinic Name, Address           • Validity Period                    │   │
│  │   • Patient Name                   • Medications (name, dosage, qty)    │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    PRESCRIPTION STATUS WORKFLOW                          │   │
│  │                                                                          │   │
│  │   DRAFT ──► PENDING_ACCEPTANCE ──► ACCEPTED ──► PENDING_PAYMENT         │   │
│  │                                                        │                 │   │
│  │                                                        ▼                 │   │
│  │   DELIVERED ◄── SHIPPED ◄── DISPENSED ◄── PROCESSING ◄── PAID           │   │
│  │                                                                          │   │
│  │   Alternative: CANCELLED / EXPIRED (at any stage)                        │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                      STOCK MANAGEMENT (FEFO)                             │   │
│  │                                                                          │   │
│  │   First Expiry First Out (FEFO) Batch Selection:                        │   │
│  │                                                                          │   │
│  │   1. Sort batches by expiry date (earliest first)                       │   │
│  │   2. Check available = batch.quantity - batch.reserved                  │   │
│  │   3. Reserve stock with 6-hour hold window                              │   │
│  │   4. Auto-release if payment not completed                              │   │
│  │                                                                          │   │
│  │   Stock Reservation Record:                                              │   │
│  │   • prescription_id    • batch_id    • quantity                         │   │
│  │   • reserved_at        • expires_at (6 hours)                           │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                      PICKUP CENTER SYSTEM                                │   │
│  │                                                                          │   │
│  │   • Unique 6-character pickup code: PU-XXXXXX                           │   │
│  │   • Multi-pharmacy pickup network                                        │   │
│  │   • Real-time ready-for-pickup notifications                            │   │
│  │   • Staff confirmation with code verification                           │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                      REFILL MANAGEMENT                                   │   │
│  │                                                                          │   │
│  │   • Configurable refill counts per prescription                         │   │
│  │   • Days supply tracking                                                 │   │
│  │   • Next refill date calculation                                        │   │
│  │   • Automated refill reminders                                          │   │
│  │   • Refill eligibility verification                                     │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Key Files:**
- Entity: `RC-Backend/src/modules/prescriptions/entities/specialist-prescription.entity.ts` (573 lines)
- Service: `RC-Backend/src/modules/prescriptions/specialist-prescription.service.ts`
- OCR: `RC-Backend/src/modules/pharmacy/services/textract.service.ts`
- Document Processor: `RC-Backend/src/modules/pharmacy/services/document-processor.service.ts`

---

### 9.3 WhatsApp Pharmacy Integration

A novel conversational commerce system enabling prescription submission and medication ordering entirely through WhatsApp - designed for emerging markets where WhatsApp is the dominant communication platform.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     WHATSAPP PHARMACY INTEGRATION                               │
│            Conversational Healthcare for Emerging Markets                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    CONVERSATION FLOW STATE MACHINE                       │   │
│  │                                                                          │   │
│  │   ┌──────────┐                                                          │   │
│  │   │   IDLE   │◄─────────────────────────────────────────────────────┐   │   │
│  │   │  (Menu)  │                                                      │   │   │
│  │   └────┬─────┘                                                      │   │   │
│  │        │ "hi" or any message                                        │   │   │
│  │        ▼                                                            │   │   │
│  │   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐       │   │   │
│  │   │ VERIFICATION │────►│ PRESCRIPTION │────►│    ORDER     │       │   │   │
│  │   │              │     │    UPLOAD    │     │   CREATION   │       │   │   │
│  │   │ • Link phone │     │              │     │              │       │   │   │
│  │   │ • OTP verify │     │ • Send photo │     │ • 5-step flow│       │   │   │
│  │   │ • 3 attempts │     │ • OCR process│     │ • Payment    │       │   │   │
│  │   └──────────────┘     │ • Queue      │     │ • Delivery   │       │   │   │
│  │                        └──────────────┘     └──────┬───────┘       │   │   │
│  │                                                    │               │   │   │
│  │                        ┌──────────────┐            │               │   │   │
│  │                        │  PHARMACIST  │◄───────────┘               │   │   │
│  │                        │    CHAT      │     (escalation)           │   │   │
│  │                        │              │                            │   │   │
│  │                        │ • Human help │────────────────────────────┘   │   │
│  │                        │ • SLA tracked│                                │   │
│  │                        └──────────────┘                                │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    PRESCRIPTION UPLOAD FLOW                              │   │
│  │                                                                          │   │
│  │   Patient                    System                         Backend      │   │
│  │      │                         │                               │         │   │
│  │      │  "Upload prescription"  │                               │         │   │
│  │      │────────────────────────►│                               │         │   │
│  │      │                         │                               │         │   │
│  │      │  "Send clear photo"     │                               │         │   │
│  │      │◄────────────────────────│                               │         │   │
│  │      │                         │                               │         │   │
│  │      │  [Sends prescription    │                               │         │   │
│  │      │   photo via WhatsApp]   │                               │         │   │
│  │      │────────────────────────►│                               │         │   │
│  │      │                         │                               │         │   │
│  │      │                         │  Download from Twilio         │         │   │
│  │      │                         │─────────────────────────────► │         │   │
│  │      │                         │                               │         │   │
│  │      │                         │  Upload to S3                 │         │   │
│  │      │                         │  prescriptions/{userId}/      │         │   │
│  │      │                         │  whatsapp/{uuid}.{ext}        │         │   │
│  │      │                         │─────────────────────────────► │         │   │
│  │      │                         │                               │         │   │
│  │      │                         │  AWS Textract OCR             │         │   │
│  │      │                         │─────────────────────────────► │         │   │
│  │      │                         │                               │         │   │
│  │      │                         │  Create Queue Item            │         │   │
│  │      │                         │  (OCR_REVIEW / MANUAL_ENTRY)  │         │   │
│  │      │                         │─────────────────────────────► │         │   │
│  │      │                         │                               │         │   │
│  │      │  "Processing... We'll   │                               │         │   │
│  │      │   notify you when ready"│                               │         │   │
│  │      │◄────────────────────────│                               │         │   │
│  │      │                         │                               │         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                      5-STEP ORDER CREATION                               │   │
│  │                                                                          │   │
│  │   Step 0: ORDER SUMMARY                                                  │   │
│  │   ├── Display OCR-extracted medications                                  │   │
│  │   ├── Show estimated prices                                              │   │
│  │   └── "Confirm to proceed"                                               │   │
│  │                                                                          │   │
│  │   Step 1: DELIVERY METHOD                                                │   │
│  │   ├── "1. Delivery" (₦1,500 fee)                                         │   │
│  │   └── "2. Pickup" (default pharmacy)                                     │   │
│  │                                                                          │   │
│  │   Step 2: ADDRESS SELECTION                                              │   │
│  │   ├── Show saved addresses                                               │   │
│  │   └── Enter new address (street, city, state)                            │   │
│  │                                                                          │   │
│  │   Step 3: ORDER CONFIRMATION                                             │   │
│  │   ├── Fetch wallet balance                                               │   │
│  │   └── Show payment options based on balance                              │   │
│  │                                                                          │   │
│  │   Step 4: PAYMENT PROCESSING                                             │   │
│  │   ├── Full wallet payment (if sufficient)                                │   │
│  │   ├── Split payment (wallet + card)                                      │   │
│  │   └── Card only (Paystack link)                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    PHARMACIST QUEUE MANAGEMENT                           │   │
│  │                                                                          │   │
│  │   Queue Types:                           Priority Levels:                │   │
│  │   ┌────────────────────────────┐        ┌─────────────────┐             │   │
│  │   │ OCR_REVIEW (70-89% conf)   │        │ URGENT (red)    │             │   │
│  │   │ MANUAL_ENTRY (50-69% conf) │        │ HIGH (orange)   │             │   │
│  │   │ CONTROLLED_SUBSTANCE       │        │ NORMAL (blue)   │             │   │
│  │   │ VERIFICATION_FAILED        │        │ LOW (gray)      │             │   │
│  │   │ PHARMACIST_ESCALATION      │        └─────────────────┘             │   │
│  │   │ CLARIFICATION_RESPONSE     │                                        │   │
│  │   └────────────────────────────┘                                        │   │
│  │                                                                          │   │
│  │   SLA Tracking:                                                         │   │
│  │   • Different SLAs per queue type and priority                          │   │
│  │   • Auto-escalation within 5 minutes of deadline                        │   │
│  │   • Color indicators: Red (<15min), Orange (<60min), Green (>1hr)       │   │
│  │   • SLA breach tracking and alerts                                      │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    HUMAN HANDOFF SYSTEM                                  │   │
│  │                                                                          │   │
│  │   Trigger: Patient types "human" or "help"                              │   │
│  │                                                                          │   │
│  │   1. Create pharmacist queue item                                        │   │
│  │   2. Show queue position and estimated wait                              │   │
│  │   3. Pharmacist claims item from dashboard                               │   │
│  │   4. All messages forwarded between patient ↔ pharmacist                 │   │
│  │   5. 30-minute SLA for initial response                                  │   │
│  │   6. Full conversation history preserved                                 │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    PROVIDER INTEGRATION                                  │   │
│  │                                                                          │   │
│  │   Primary: Twilio WhatsApp Business API                                 │   │
│  │   ├── Webhook signature validation                                       │   │
│  │   ├── Media download with Basic Auth                                     │   │
│  │   ├── Template messages for notifications                                │   │
│  │   └── Button/List message formatting                                     │   │
│  │                                                                          │   │
│  │   Alternative: Gupshup WhatsApp Business API                            │   │
│  │   ├── Text, image, document message types                               │   │
│  │   └── Template message support                                           │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  Innovation: Meets users where they are - WhatsApp is the dominant             │
│  communication platform in Nigeria/Africa, enabling healthcare access          │
│  for users with limited tech literacy or smartphone capabilities.              │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Key Files:**
- Webhook: `RC-Backend/src/modules/whatsapp/controllers/whatsapp-webhook.controller.ts`
- Prescription Flow: `RC-Backend/src/modules/whatsapp/handlers/prescription-flow.handler.ts` (590 lines)
- Order Flow: `RC-Backend/src/modules/whatsapp/handlers/order-flow.handler.ts` (715 lines)
- Queue Service: `RC-Backend/src/modules/whatsapp/services/whatsapp-queue.service.ts` (536 lines)
- Twilio Service: `RC-Backend/src/modules/whatsapp/services/whatsapp-twilio.service.ts` (402 lines)

---

### 9.4 Compliance & Safety Features

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     COMPLIANCE & SAFETY ARCHITECTURE                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                PRESCRIPTION VERIFICATION WORKFLOW                        │   │
│  │                                                                          │   │
│  │   PENDING ──► TIER1_PROCESSING ──► TIER1_PASSED ──► TIER2_PROCESSING    │   │
│  │                     │                                      │             │   │
│  │                     ▼                                      ▼             │   │
│  │              TIER1_FAILED                           TIER2_PASSED         │   │
│  │                     │                                      │             │   │
│  │                     ▼                                      ▼             │   │
│  │              PHARMACIST_REVIEW ◄───────────────── TIER2_FAILED          │   │
│  │                     │                                                    │   │
│  │          ┌──────────┼──────────┐                                        │   │
│  │          ▼          ▼          ▼                                        │   │
│  │      APPROVED   REJECTED    EXPIRED                                     │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                CONTROLLED SUBSTANCE HANDLING                             │   │
│  │                                                                          │   │
│  │   • Automatic detection of Schedule II-IV drugs                         │   │
│  │   • Queue type: CONTROLLED_SUBSTANCE                                     │   │
│  │   • Priority: URGENT (automatic)                                         │   │
│  │   • Strict SLA tracking for compliance                                   │   │
│  │   • Audit logging for all actions                                        │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    FRAUD DETECTION                                       │   │
│  │                                                                          │   │
│  │   • Risk level scoring with fraud_score percentage                       │   │
│  │   • Fraud flags with descriptions and severity                           │   │
│  │   • Alert system: Open → Investigating → Resolved                        │   │
│  │   • Comprehensive audit logging                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    CLARIFICATION PROCESS                                 │   │
│  │                                                                          │   │
│  │   1. System/Pharmacist requests clarification                            │   │
│  │   2. Patient receives notification with deadline                         │   │
│  │   3. Patient submits response + supporting documents                     │   │
│  │   4. Auto-escalation if deadline missed                                  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 10. Innovation Summary for Global Talent Visa

| Feature | Innovation Category | Technical Complexity | Healthcare Impact |
|---------|---------------------|---------------------|-------------------|
| **AI Health Checkup (Infermedica)** | Medical AI | Symptom duration tracking, triage optimization | Democratizes diagnostic AI |
| **Claude AI Health Summaries** | LLM Application | Multi-source analysis, personalized reports | Patient-friendly explanations |
| **Advanced Health Score** | Health Analytics | 6-domain scoring, longitudinal tracking | Health digital twin concept |
| **WhatsApp Prescription Flow** | Conversational Commerce | State machine, OCR pipeline, queue management | Healthcare access for emerging markets |
| **AWS Textract OCR** | Document Intelligence | 5-level extraction strategy, confidence scoring | Prescription digitization |
| **Multi-Channel Appointments** | Platform Engineering | 6 channels, double-booking prevention | Flexible healthcare delivery |
| **Stock Reservation (FEFO)** | Inventory Management | Batch tracking, 6-hour holds, auto-release | Medication safety |
| **Pickup Center Network** | Logistics | Unique codes, multi-pharmacy support | Convenience & accessibility |

---

## Document Information

| Field | Value |
|-------|-------|
| Version | 2.0.0 |
| Last Updated | January 2026 |
| Author | Rapid Capsule Engineering |
| Project | Rapid Capsule Telemedicine Platform |

---

*This document is intended for technical documentation and Global Talent Visa application purposes.*
