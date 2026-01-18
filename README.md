# Rapid Capsule - AI-Powered Telemedicine Platform

<p align="center">
  <strong>Connecting Patients with Healthcare Professionals through AI-Driven Technology</strong>
</p>

<p align="center">
  <a href="https://rapidcapsule.com">Live Platform</a> •
  <a href="https://rapidcapsule.com/rc-architecture">Architecture Documentation</a> •
  <a href="https://admin.rapidcapsule.com">Admin Portal</a>
</p>

---

## Overview

**Rapid Capsule** is a comprehensive telemedicine platform that leverages artificial intelligence to democratize healthcare access. The platform connects patients with medical specialists through multiple channels while providing AI-powered health assessments, prescription management, and integrated pharmacy services.

### Platform Statistics

| Metric | Count |
|--------|-------|
| Total Services | 4 |
| Backend Modules | 46+ |
| API Endpoints | 100+ |
| Frontend Components | 273 |
| Database Collections | 20+ |
| External Integrations | 10+ |

---

## Key Innovations

### 1. AI-Powered Diagnostics
Integration with **Infermedica's medical AI** for intelligent symptom parsing, interview-based diagnosis, and triage assessment. Features include:
- Natural Language Processing for symptom description
- Adaptive interview engine with follow-up questions
- Evidence-based condition matching
- Emergency detection and triage recommendations

### 2. LLM Health Intelligence
**Claude AI (Anthropic)** integration for generating patient-friendly health summaries:
- Medical document analysis
- Vision-based prescription OCR
- Comprehensive health reports
- Personalized health recommendations

### 3. 6-Domain Health Score System
Proprietary **digital health twin** with weighted metrics:
- Cardiovascular Health (20%)
- Metabolic Function (20%)
- Mental Health (15%)
- Lifestyle Factors (15%)
- Physical Fitness (15%)
- Preventive Care (15%)

### 4. 5-Level OCR Pipeline
**AWS Textract** integration for prescription digitization:
1. Line Extraction
2. Block Analysis
3. Form Detection
4. Table Extraction
5. Key-Value Pair Recognition

### 5. WhatsApp Conversational Commerce
State machine architecture for pharmacy ordering via WhatsApp:
```
IDLE → VERIFICATION → MENU → PRESCRIPTION_UPLOAD → OCR_PROCESSING → ORDER_CREATION → PAYMENT_PENDING → PHARMACIST_CHAT
```

### 6. Multi-Channel Telehealth
Six consultation types supported:
- **Video** - Zoom API integration
- **Voice** - Twilio voice calls
- **Chat** - Real-time in-app messaging
- **In-Person** - Clinic appointments
- **Home Visit** - Healthcare at doorstep
- **Emergency** - Urgent care access

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           RAPID CAPSULE PLATFORM                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐   ┌─────────────┐ │
│   │   Patient   │    │  Specialist │    │  Lifeguard  │   │    Admin    │ │
│   │    App      │    │    App      │    │    App      │   │   Portal    │ │
│   └──────┬──────┘    └──────┬──────┘    └──────┬──────┘   └──────┬──────┘ │
│          │                  │                  │                 │         │
│          └──────────────────┼──────────────────┼─────────────────┘         │
│                             │                  │                           │
│                             ▼                  ▼                           │
│   ┌─────────────────────────────────────────────────────────────────────┐ │
│   │                        API GATEWAY / NGINX                          │ │
│   │              (SSL Termination, Load Balancing, Routing)             │ │
│   └─────────────────────────────┬───────────────────────────────────────┘ │
│                                 │                                         │
│          ┌──────────────────────┼──────────────────────┐                 │
│          ▼                      ▼                      ▼                 │
│   ┌─────────────┐        ┌─────────────┐        ┌─────────────┐         │
│   │   Patient   │        │    Admin    │        │  WebSocket  │         │
│   │   Backend   │◄──────►│   Backend   │◄──────►│   Server    │         │
│   │  (Port 5020)│        │  (Port 5021)│        │             │         │
│   └──────┬──────┘        └──────┬──────┘        └─────────────┘         │
│          │                      │                                        │
│          └──────────┬───────────┘                                        │
│                     ▼                                                    │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                       MongoDB Atlas Database                     │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
rapidcapsule/
├── RC/                      # Patient Frontend (Vue.js 3)
│   ├── src/
│   │   ├── views/
│   │   │   ├── Mainapp/     # Core features
│   │   │   │   ├── HealthCheckup/
│   │   │   │   ├── Appointments/
│   │   │   │   ├── Prescriptions/
│   │   │   │   └── Health-monitor/
│   │   │   └── Public/
│   │   ├── components/      # 102 reusable components
│   │   ├── store/           # Vuex state (11 modules)
│   │   └── services/        # API factory (22,775 lines)
│
├── RC-Backend/              # Patient Backend (NestJS)
│   └── src/
│       └── modules/         # 32 feature modules
│           ├── auth/
│           ├── health-checkup/
│           ├── appointments/
│           ├── vitals/
│           ├── prescriptions/
│           ├── payments/
│           ├── whatsapp/
│           └── ...
│
├── RC_Admin_UI/             # Admin Frontend (Vue.js 3 + Vuetify 3)
│   └── src/
│       ├── views/
│       ├── components/
│       └── stores/          # Pinia stores (9 modules)
│
├── RC_Admin_Backend/        # Admin Backend (NestJS)
│   └── src/
│       └── modules/         # 14 modules
│           ├── dashboard/   # 1,916 lines service
│           ├── patients/
│           ├── specialists/
│           └── ...
│
└── docs/
    ├── ARCHITECTURE.md
    └── DIAGRAMS.md
```

---

## Technology Stack

### Frontend
| Technology | Usage |
|------------|-------|
| Vue.js 3 | Core framework with Composition API |
| Vuetify 3 | Material Design components (Admin) |
| Vuex 4 | State management (Patient) |
| Pinia | State management (Admin) |
| PWA | Progressive Web App capabilities |

### Backend
| Technology | Usage |
|------------|-------|
| NestJS 9 | Node.js framework |
| TypeScript | Type safety |
| Mongoose | MongoDB ODM |
| Passport.js | Authentication |
| Socket.io | Real-time communications |

### Database & Storage
| Technology | Usage |
|------------|-------|
| MongoDB Atlas | Primary database |
| Redis | Session & caching |
| AWS S3 | File storage |

### AI & External Services
| Service | Usage |
|---------|-------|
| Infermedica API | Symptom analysis & diagnosis |
| Claude AI (Anthropic) | Health summaries & reports |
| AWS Textract | Prescription OCR |
| Zoom API | Video consultations |
| Twilio | Voice calls & SMS |
| Paystack | Payment processing |
| Gupshup | WhatsApp Business API |
| Brevo | Email services |

---

## Security Architecture

- **Authentication**: JWT with refresh tokens, OAuth 2.0 (Google, Apple)
- **Encryption**: AES-256 for sensitive data, bcrypt for passwords
- **API Security**: Rate limiting, CORS, helmet.js, CSRF protection
- **Infrastructure**: Cloudflare DDoS protection, SSL/TLS 1.3
- **Access Control**: Role-based (Patient, Specialist, Lifeguard, Admin)
- **Data Protection**: Input sanitization, SQL injection prevention
- **Audit**: Comprehensive logging and activity tracking

---

## Service Configuration

| Service | Port | Domain |
|---------|------|--------|
| Patient Frontend | 3000 | rapidcapsule.com |
| Patient Backend | 5020 | api.rapidcapsule.com |
| Admin Frontend | 8080 | admin.rapidcapsule.com |
| Admin Backend | 5021 | Internal API |

---

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v5.0 or higher)
- Redis (v6.0 or higher)
- yarn or npm

### Installation

```bash
# Clone the repository
git clone https://github.com/eyobassey/rapidcapsule.git
cd rapidcapsule

# Install dependencies for all services
cd RC && yarn install && cd ..
cd RC-Backend && yarn install && cd ..
cd RC_Admin_UI && yarn install && cd ..
cd RC_Admin_Backend && yarn install && cd ..

# Configure environment variables
cp RC-Backend/.env.example RC-Backend/.env
cp RC_Admin_Backend/.env.example RC_Admin_Backend/.env

# Start development servers
cd RC-Backend && yarn start:dev     # Patient API on 5020
cd RC && yarn serve                 # Patient UI on 3000
cd RC_Admin_Backend && yarn start:dev  # Admin API on 5021
cd RC_Admin_UI && yarn dev          # Admin UI on 8080
```

### Production Deployment

```bash
# Build all services
cd RC && yarn build
cd RC-Backend && yarn build
cd RC_Admin_UI && yarn build
cd RC_Admin_Backend && yarn build

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
```

---

## Live URLs

| Service | URL |
|---------|-----|
| Patient App | https://rapidcapsule.com |
| Admin Portal | https://admin.rapidcapsule.com |
| Patient API | https://api.rapidcapsule.com |
| Architecture Docs | https://rapidcapsule.com/rc-architecture |

---

## Author

**Bassey Eyo**
*Founder & CTO*

- Email: eyobassey@gmail.com
- GitHub: [@eyobassey](https://github.com/eyobassey)

---

## License

This project is proprietary software. All rights reserved.

© 2024-2026 Rapid Capsule
