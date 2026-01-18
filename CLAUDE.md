# Rapid Capsule Project Guide

## Project Overview
**Rapid Capsule** is a telemedicine platform connecting patients with medical specialists. Features include AI-powered health checkups (Infermedica), appointments, prescriptions, vital monitoring, video consultations (Zoom), and admin oversight.

---

## Architecture Overview

### System Architecture
- **Patient Frontend**: Vue.js 3 SPA (`RC/`)
- **Admin Frontend**: Vue.js 3 + Vuetify 3 (`RC_Admin_UI/`)
- **Patient Backend**: NestJS REST API + WebSocket (`RC-Backend/`)
- **Admin Backend**: NestJS REST API (`RC_Admin_Backend/`)
- **Database**: MongoDB (Mongoose ODM) - Shared
- **Auth**: JWT + OAuth (Google, Apple)
- **External**: AWS S3, Brevo SMTP, Paystack, Zoom, Twilio, Infermedica

### Service Ports
| Service | Port | PM2 Name | Domain |
|---------|------|----------|--------|
| Patient Frontend | 3000 | RC-Frontend | rapidcapsule.com |
| Patient Backend | 5020 | RC-Backend | api.rapidcapsule.com |
| Admin Frontend | 8080 | RC-Admin-Frontend | admin.rapidcapsule.com |
| Admin Backend | 5021 | RC-Backend-Admin | (internal) |

### Key Directory Structure
```
/home/username/development/
├── RC/                          # Patient Frontend
│   └── src/views/Mainapp/       # Core features (HealthCheckup/, Appointments/, etc.)
├── RC_Admin_UI/                 # Admin Frontend
│   └── src/components/PatientProfile/  # Patient management components
├── RC-Backend/                  # Patient Backend
│   └── src/modules/             # Feature modules (auth, health-checkup, appointments, etc.)
└── RC_Admin_Backend/            # Admin Backend
    └── src/modules/dashboard/   # Admin services & controllers
```

---

## User Types
1. **Patients** - Main users, book appointments, health checkups
2. **Specialists** - Healthcare providers, video consultations
3. **Lifeguards** - Emergency response personnel
4. **Administrators** - Platform oversight via admin.rapidcapsule.com

---

## Core Features & Key Files

### Authentication
- Patient: `RC-Backend/src/modules/auth/`, `RC/src/views/Login/`
- Admin: `RC_Admin_Backend/src/modules/auth/`, `RC_Admin_UI/src/views/Login/`

### Health Checkup (Infermedica AI)
- Backend: `RC-Backend/src/modules/health-checkup/`
- Frontend: `RC/src/views/Mainapp/HealthCheckup/`
- Admin view: `RC_Admin_UI/src/components/PatientProfile/MedicalHistory.vue`

### Appointments
- Backend: `RC-Backend/src/modules/appointments/`
- Frontend: `RC/src/views/Mainapp/Appointments/`
- Video: `RC/src/views/Mainapp/Appointments/Meetings.vue`

### Prescriptions & Vitals
- Prescriptions: `RC-Backend/src/modules/prescriptions/`, `RC/src/views/Mainapp/Prescriptions/`
- Vitals: `RC-Backend/src/modules/vitals/`, `RC/src/views/Mainapp/Health-monitor/Vitals.vue`

### Payments
- Backend: `RC-Backend/src/modules/payments/`, `cards/`, `subscriptions/`, `wallets/`

### Admin Patient Profile Components
- `MedicalHistory.vue` - Healthcare dashboard with clickable reports
- `ActivityTimeline.vue` - Patient interaction timeline
- `HealthStatusOverview.vue` - Visual health analytics
- `QuickActions.vue` - Admin action panel
- `CommunicationHistory.vue` - Communication tracking
- `NotesSection.vue` - Admin notes management
- `AccountManagement.vue` - Account status controls
- `BioPanel.vue` - Patient bio display

---

## API Endpoints

### Patient API (`/api/`) - Port 5020
- Auth: `POST /login`, `/otp/verify`, `/google`, `/apple`, `/forgot-password`, `/reset-password`
- Users: `GET /me`, `PATCH /:id`, `/change-password`
- Health: `POST /`, `/risk-factors`, `/diagnosis`, `GET /search`, `/results/:userId`
- Appointments: `POST /`, `GET /`, `/available-specialists`, `/available-times`, `PATCH /:id/reschedule`
- Vitals: `POST /`, `GET /`, `/recent`, `/chart-data`
- Payments: `POST /initialize`, `/verify`, `GET /transactions`

### Admin API (`/admin-api/`) - Port 5021
- Dashboard: `GET /metrics`, `/trends`, `/health-checkup-trends`, `/recent-activities`
- Patient: `GET /patient/:id/health-checkups`, `/activity-timeline`, `/vitals`, `/stats`
- Actions: `PATCH /patient/:id/status`, `/suspend`, `/deactivate`
- Tools: `POST /patient/:id/reset-password`, `/send-verification`

---

## Database Schema (MongoDB)

### Users Collection
```javascript
{
  _id, email, password (hashed),
  user_type: "Patient" | "Specialist" | "Lifeguard" | "Admin",
  status: "Active" | "Suspended" | "Deactivated" | "Pending",
  profile: { first_name, last_name, phone_number, date_of_birth, gender,
             emergency_contacts, medical_history, health_risk_factors, profile_image },
  is_email_verified, is_active, is_suspended, suspension_reason,
  last_login_at, created_at, updated_at
}
```

### Health Checkups Collection
```javascript
{
  _id, user: ObjectId, health_check_for,
  patient_info: { age, gender, medical_history },
  request: { interview_token, symptoms, risk_factors },
  response: { data: { conditions, triage_level, has_emergency_evidence, specialist_recommendations } },
  created_at, updated_at
}
```

---

## Development Commands

```bash
# Local Development
cd RC-Backend && yarn start:dev     # Patient API on 5020
cd RC && yarn serve                 # Patient UI on 3000
cd RC_Admin_Backend && yarn start:dev  # Admin API on 5021
cd RC_Admin_UI && yarn dev          # Admin UI on 8080

# Production Build & Deploy
cd RC && yarn build
cd RC-Backend && yarn build
cd RC_Admin_UI && yarn build
cd RC_Admin_Backend && yarn build
pm2 start ecosystem.config.js && pm2 save

# Common Operations
pm2 restart all
pm2 logs [service-name]
pm2 status
```

---

## Troubleshooting

### Common Issues
1. **Permission denied** - Check nginx file permissions
2. **Port conflicts** - Ensure 3000, 5020, 5021, 8080 are available
3. **SSL issues** - Using Cloudflare SSL termination
4. **Payment webhooks** - Check Paystack configuration

### Debugging
```bash
pm2 logs RC-Backend-Admin
sudo tail -f /var/log/nginx/rapidcapsule_error.log
curl -I https://rapidcapsule.com/api/
curl -I https://admin.rapidcapsule.com/admin-api/
```

---

## Infermedica API Integration

### Configuration
- **API Version**: v3 (https://api.infermedica.com/v3)
- **Enable Duration**: `enable_symptom_duration` in extras
- **Units**: `'hour'`, `'day'`, `'week'`, `'minute'` (singular)

### Duration Mapping
```javascript
{
  'hours': { value: 1, unit: 'hour' },
  'days_1_3': { value: 2, unit: 'day' },
  'days_4_7': { value: 5, unit: 'day' },
  'weeks_1_2': { value: 10, unit: 'day' },
  'weeks_2_4': { value: 21, unit: 'day' },
  'months': { value: 60, unit: 'day' }
}
```

### Evidence Source Tracking
- Initial symptoms: `"source": "initial"`
- Interview answers: `"source": "interview"`
- Auto-generated: No source field

### Question Types
- `single`: Yes/No/Don't know
- `group_single`: Choose one (mutually exclusive)
- `group_multiple`: Select multiple symptoms
- `duration`: Symptom duration (when enabled)

### Key Notes
- Minimum age: 12 years (pediatric requires paid subscription)
- Interview token required for session continuity
- 400 errors indicate malformed duration objects
- Features: `triage_focused`, enhanced NLP, emergency detection

---

## Code Standards
- **Backend**: TypeScript, NestJS modules, Class Validator
- **Frontend**: Vue 3 Composition API, Vuex (patient), Pinia (admin)
- **Admin UI**: Vuetify 3 Material Design
- **Naming**: RC prefix (patient), standard (admin)
- **Commits**: Conventional commits format

---

**Last Updated**: September 11, 2025 | **Version**: 2.1.0
