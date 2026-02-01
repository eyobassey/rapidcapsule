# Specialist Appointments Module - Implementation Plan

## Executive Summary

This document outlines the comprehensive implementation plan for the new **SpecialistAppointments** module, adapting the 23-screen specification from the design document while using the established Rapid Capsule design system (Sky Blue #4FC3F7 + Orange #FF9800, light mode, card-based layouts).

**Key Platform Integrations**: This module deeply integrates with existing Rapid Capsule features including Prescriptions, Health Scores (Basic & Advanced), Infermedica Health Checkup History, Vitals, and Patient Records to give specialists a 360° view of their patients.

---

## Rapid Capsule Platform Integrations

### 1. Prescriptions Integration
| Feature | Description | Location in Module |
|---------|-------------|-------------------|
| Active Prescriptions | View patient's current medications | Patient Profile Panel, Appointment Detail |
| Prescription History | Full history of past prescriptions | Patient Records Tab |
| Create Prescription | Write new prescriptions during/after appointment | Post-Appointment Actions, Quick Actions |
| e-Prescribe | Send to pharmacy directly | Prescription Modal |
| Drug Interactions | AI-powered interaction warnings | Prescription Creation Form |
| Refill Requests | Handle patient refill requests | Dashboard Alerts, Notifications |

### 2. Health Scores (Basic & Advanced)
| Feature | Description | Location in Module |
|---------|-------------|-------------------|
| Basic Health Score | Overall health rating (0-100) | Patient Card, Patient Profile Header |
| Advanced Health Score | Detailed breakdown by category | Patient Detail View, Health Tab |
| Score Trends | Historical score changes over time | Patient Analytics Chart |
| Risk Indicators | Visual alerts for declining scores | Patient Card Badge, Dashboard Alerts |
| Score Breakdown | Categories: Cardio, Mental, Lifestyle, etc. | Health Score Expanded View |

### 3. Infermedica Health Checkup History
| Feature | Description | Location in Module |
|---------|-------------|-------------------|
| Checkup List | All AI health checkups performed | Patient Health History Tab |
| Triage Levels | Emergency, Consultation, Self-Care results | Patient Card Indicator, Alerts |
| Condition Predictions | AI-predicted conditions with probability | Patient Profile, Pre-Appointment Brief |
| Symptom History | Symptoms reported across checkups | Patient Timeline |
| Specialist Recommendations | AI-suggested specialist types | Appointment Type Suggestions |
| Checkup Details | Full checkup flow and responses | Expandable Checkup Card |

### 4. Vitals Integration
| Feature | Description | Location in Module |
|---------|-------------|-------------------|
| Recent Vitals | Latest BP, Heart Rate, Weight, etc. | Patient Quick View, Appointment Detail |
| Vitals Trends | Charts showing vitals over time | Patient Health Tab |
| Abnormality Alerts | Flags for out-of-range readings | Dashboard Alerts, Patient Card Badge |
| Wearables Data | Apple Health, Fitbit integration | Vitals Panel (if connected) |
| Pre-Appointment Vitals | Prompt patient to log before visit | Appointment Reminders |

### 5. Clinical Notes & Documents
| Feature | Description | Location in Module |
|---------|-------------|-------------------|
| Past Consultation Notes | Notes from previous appointments | Patient Records Tab |
| Lab Results | Uploaded lab work with AI analysis | Documents Tab |
| Imaging Records | X-rays, MRIs, etc. | Documents Tab |
| AI Note Summarization | Summarize long clinical histories | Patient Brief Generator |

---

## Design System Adaptation

### Original Document Theme vs Our Adaptation

| Aspect | Document Spec | Our Adaptation |
|--------|---------------|----------------|
| Mode | Dark holographic | Light mode (matching onboarding) |
| Primary | #00D9FF Electric Cyan | #4FC3F7 Sky Blue |
| Secondary | #FF006E Magenta | #FF9800 Orange |
| Background | #0D1117 Dark | #F8FAFC Light Gray |
| Cards | Glassmorphism dark | White with subtle shadows |
| Typography | SF Pro Display | Poppins (headers), Inter (body) |
| Effects | Neon glow, holographic | Subtle shadows, smooth transitions |

### Color Palette (SpecialistAppointments)

```scss
// Primary Colors
$sa-sky: #4FC3F7;
$sa-sky-light: #E1F5FE;
$sa-sky-dark: #0288D1;

// Action Colors
$sa-orange: #FF9800;
$sa-orange-light: #FFF3E0;
$sa-orange-dark: #F57C00;

// Status Colors
$sa-success: #4CAF50;
$sa-success-light: #E8F5E9;
$sa-warning: #FFB800;
$sa-warning-light: #FFF8E1;
$sa-error: #EF4444;
$sa-error-light: #FEE2E2;
$sa-info: #3B82F6;
$sa-info-light: #EFF6FF;

// Neutrals
$sa-navy: #1A365D;
$sa-gray-900: #1E293B;
$sa-gray-700: #334155;
$sa-gray-500: #64748B;
$sa-gray-300: #CBD5E1;
$sa-gray-100: #F1F5F9;
$sa-white: #FFFFFF;
$sa-bg: #F8FAFC;

// Priority Colors
$sa-priority-critical: #DC2626; // P1
$sa-priority-urgent: #F97316;   // P2
$sa-priority-high: #EAB308;     // P3
$sa-priority-normal: #22C55E;   // P4
```

---

## Screen Consolidation Strategy

The original 23 screens can be consolidated into **15 core views** for a more streamlined implementation:

### Phase 1: MVP Core (7 Screens)
| # | Screen | Based On | Priority |
|---|--------|----------|----------|
| 1 | Dashboard | Screen 11: Main Dashboard Home | P1 |
| 2 | Appointments List | Screen 15: Appointment List & Management | P1 |
| 3 | Create Appointment Wizard | Screens 01-10 consolidated | P1 |
| 4 | Appointment Detail | Screen 12 + 13 combined | P1 |
| 5 | Reschedule Modal | Screen 17 | P1 |
| 6 | Cancel Flow | Screen 18 | P1 |
| 7 | Settings | Screen 22 (partial) | P2 |

### Phase 2: Enhanced Features (5 Screens)
| # | Screen | Based On | Priority |
|---|--------|----------|----------|
| 8 | Patient Selection | Screens 02-04 expanded | P2 |
| 9 | Analytics Dashboard | Screen 14 | P2 |
| 10 | Post-Appointment View | Screen 13 | P2 |
| 11 | Bulk Operations | Screen 16 | P2 |
| 12 | Patient Records View | Screen 12 | P2 |

### Phase 3: Advanced Features (3 Screens)
| # | Screen | Based On | Priority |
|---|--------|----------|----------|
| 13 | AI Co-Pilot Panel | Screen 19 | P3 |
| 14 | Emergency Queue | Screen 20 | P3 |
| 15 | Multi-Specialist Collab | Screen 21 | P3 |

---

## File Structure

```
RC/src/views/Mainapp/SpecialistApp/SpecialistAppointments/
├── index.vue                           # Main layout wrapper
├── Dashboard.vue                       # Screen 1: Main dashboard
├── AppointmentsList.vue                # Screen 2: List & management
├── AppointmentDetail.vue               # Screen 4: Single appointment view
├── Analytics.vue                       # Screen 9: Analytics dashboard
├── Settings.vue                        # Screen 7: Preferences
│
├── create/                             # Appointment Creation Wizard
│   ├── index.vue                       # Wizard container
│   ├── WizardStepper.vue              # Progress indicator
│   ├── steps/
│   │   ├── PatientSelectionStep.vue   # Step 1: Select patient
│   │   ├── AppointmentTypeStep.vue    # Step 2: Choose type
│   │   ├── ScheduleStep.vue           # Step 3: Date/time
│   │   ├── FeeChannelStep.vue         # Step 4: Fee & channel
│   │   ├── NotesStep.vue              # Step 5: Notes & attachments
│   │   └── ReviewStep.vue             # Step 6: Confirm
│   └── components/
│       ├── PatientSearchCard.vue
│       ├── PatientResultCard.vue
│       ├── NewPatientForm.vue
│       ├── AppointmentTypeCard.vue
│       ├── TimeSlotPicker.vue
│       ├── FeeCard.vue
│       ├── ChannelCard.vue
│       └── AppointmentSummary.vue
│
├── modals/                             # Overlay modals
│   ├── RescheduleModal.vue            # Screen 5
│   ├── CancelModal.vue                # Screen 6
│   ├── BulkOperationsModal.vue        # Screen 11
│   ├── PatientQuickView.vue           # Quick patient profile
│   └── CreatePrescriptionModal.vue    # New prescription
│
├── patient/                            # Patient Profile Components
│   ├── PatientProfilePanel.vue        # Full patient profile sidebar
│   ├── PatientHeader.vue              # Name, avatar, health score
│   ├── tabs/
│   │   ├── OverviewTab.vue            # Summary of all health data
│   │   ├── HealthCheckupsTab.vue      # Infermedica checkup history
│   │   ├── PrescriptionsTab.vue       # Prescription history
│   │   ├── VitalsTab.vue              # Vitals readings & trends
│   │   ├── DocumentsTab.vue           # Lab results, imaging
│   │   └── NotesTab.vue               # Clinical notes history
│   └── components/
│       ├── HealthScoreCard.vue        # Basic & Advanced score display
│       ├── HealthScoreBreakdown.vue   # Detailed score categories
│       ├── HealthCheckupCard.vue      # Single checkup summary
│       ├── CheckupDetailDrawer.vue    # Full checkup details
│       ├── TriageBadge.vue            # Emergency/Consultation/Self-care
│       ├── ConditionPrediction.vue    # AI predicted conditions
│       ├── PrescriptionCard.vue       # Single prescription display
│       ├── VitalsChart.vue            # Vitals trend chart
│       ├── VitalsReading.vue          # Single vital reading
│       ├── VitalsAlertBadge.vue       # Out-of-range indicator
│       ├── DocumentCard.vue           # Lab result/imaging card
│       └── ClinicalNoteCard.vue       # Past consultation note
│
├── components/                         # Shared components
│   ├── AppointmentCard.vue            # List item card
│   ├── StatusBadge.vue                # Status indicator
│   ├── PriorityIndicator.vue          # P1-P4 badges
│   ├── ChannelIcon.vue                # Video/Audio/Chat icons
│   ├── PatientAvatar.vue              # Avatar with health score ring
│   ├── PatientMiniCard.vue            # Compact patient info
│   ├── QuickStatsCard.vue             # Stat widget
│   ├── MiniCalendar.vue               # Calendar widget
│   ├── TimelineEvent.vue              # Timeline item
│   ├── FilterBar.vue                  # Search & filters
│   ├── EmptyState.vue                 # No results state
│   ├── AICoPilot.vue                  # AI assistant panel
│   ├── AIInsightCard.vue              # AI recommendation card
│   └── DrugInteractionAlert.vue       # Prescription warning
│
├── composables/
│   ├── useAppointments.js             # Appointments state & API
│   ├── useCreateAppointment.js        # Wizard state
│   ├── useAppointmentFilters.js       # Filter state
│   ├── usePatientSearch.js            # Patient search
│   ├── usePatientProfile.js           # Patient profile data
│   ├── useHealthCheckups.js           # Infermedica checkup data
│   ├── usePrescriptions.js            # Prescriptions state & API
│   ├── useVitals.js                   # Vitals data
│   ├── useHealthScores.js             # Health score calculations
│   └── useAnalytics.js                # Analytics data
│
└── styles/
    └── _sa-variables.scss             # Module-specific styles
```

---

## Route Configuration

```javascript
// Add to RC/src/router/index.js under /app/specialist children:

// Specialist Appointments (New Module)
{
  path: "appointments-v2",
  name: "SpecialistAppointmentsLayout",
  component: () => import("@/views/Mainapp/SpecialistApp/SpecialistAppointments/index.vue"),
  meta: { requiresAuth: true, requiresSpecialist: true },
  children: [
    {
      path: "",
      name: "SpecialistAppointmentsDashboard",
      component: () => import("@/views/Mainapp/SpecialistApp/SpecialistAppointments/Dashboard.vue"),
    },
    {
      path: "list",
      name: "SpecialistAppointmentsList",
      component: () => import("@/views/Mainapp/SpecialistApp/SpecialistAppointments/AppointmentsList.vue"),
    },
    {
      path: "create",
      name: "SpecialistAppointmentsCreate",
      component: () => import("@/views/Mainapp/SpecialistApp/SpecialistAppointments/create/index.vue"),
    },
    {
      path: ":id",
      name: "SpecialistAppointmentDetail",
      component: () => import("@/views/Mainapp/SpecialistApp/SpecialistAppointments/AppointmentDetail.vue"),
    },
    {
      path: "analytics",
      name: "SpecialistAppointmentsAnalytics",
      component: () => import("@/views/Mainapp/SpecialistApp/SpecialistAppointments/Analytics.vue"),
    },
    {
      path: "settings",
      name: "SpecialistAppointmentsSettings",
      component: () => import("@/views/Mainapp/SpecialistApp/SpecialistAppointments/Settings.vue"),
    },
  ]
}
```

---

## Screen Designs

### Screen 1: Dashboard

**Purpose**: Central command center for specialist's appointment overview

**Layout**:
```
┌──────────────────────────────────────────────────────────────────┐
│ Header: Welcome Dr. [Name] | Today [Date] | Notifications | Profile │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ AI Greeting Banner                                           │ │
│  │ "Good morning! You have 5 appointments today. Next: Mrs.     │ │
│  │  Johnson at 10:30 AM. AI suggests reviewing her recent labs."│ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │ Today    │ │ This     │ │ Pending  │ │ Revenue  │            │
│  │    5     │ │ Week: 23 │ │ F/Up: 8  │ │ ₦1.2M    │            │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘            │
│                                                                   │
│  ┌───────────────────────────┐ ┌──────────────────────────────┐ │
│  │ Today's Schedule          │ │ Quick Actions                │ │
│  │ ┌─────────────────────┐   │ │                              │ │
│  │ │ 10:30 Mrs. Johnson  │   │ │  [+ Book Appointment]        │ │
│  │ │ Video | Follow-up   │   │ │  [Start Instant Consult]     │ │
│  │ └─────────────────────┘   │ │  [View All Appointments]     │ │
│  │ ┌─────────────────────┐   │ │  [Block Time Off]            │ │
│  │ │ 11:00 Mr. Okafor    │   │ │                              │ │
│  │ │ Audio | Initial     │   │ └──────────────────────────────┘ │
│  │ └─────────────────────┘   │                                  │
│  │ ...                       │ ┌──────────────────────────────┐ │
│  └───────────────────────────┘ │ AI Alerts                    │ │
│                                 │ • 3 patients need follow-up  │ │
│  ┌───────────────────────────┐ │ • 2 pending confirmations    │ │
│  │ Recent Activity           │ │ • High demand: Thursdays     │ │
│  │ • Booked: Mr. Ada (2m)    │ └──────────────────────────────┘ │
│  │ • Completed: Mrs. Eze (1h)│                                  │
│  │ • Cancelled: Mr. Joe (3h) │                                  │
│  └───────────────────────────┘                                  │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

**Key Components**:
- AI Greeting Banner (contextual, dismissible)
- Quick Stats Row (4 cards with trends)
- Today's Schedule (timeline view)
- Quick Actions Panel
- AI Alerts Widget
- Recent Activity Feed

**Mobile Adaptation**:
- Stack vertically
- Today's Schedule full-width
- Quick Actions as floating action button
- Stats as horizontal scroll

---

### Screen 2: Appointments List

**Purpose**: View, filter, and manage all appointments

**Layout**:
```
┌──────────────────────────────────────────────────────────────────┐
│ Header: Appointments | [+ New] | Search | Filter | View Toggle   │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Filter Tabs: [All] [Today] [Upcoming] [Past] [Needs Action]     │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Search: [🔍 Search patients, booking ID...]                 │ │
│  │ Filters: [Status ▼] [Type ▼] [Channel ▼] [Date Range]       │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ ☐ │ Patient      │ Type        │ Date/Time   │ Status │ Act │ │
│  ├───┼──────────────┼─────────────┼─────────────┼────────┼─────┤ │
│  │ ☐ │ 👤 Mrs. Ada  │ Follow-up   │ Today 10:30 │ 🟢 Cnf │ ••• │ │
│  │ ☐ │ 👤 Mr. Obi   │ Initial     │ Today 11:00 │ 🟡 Pnd │ ••• │ │
│  │ ☐ │ 👤 Dr. Eze   │ Emergency   │ Today 14:00 │ 🔴 Urg │ ••• │ │
│  │ ☐ │ 👤 Mrs. Joy  │ Procedure   │ Tmrw 09:00  │ 🟢 Cnf │ ••• │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  Pagination: [< Prev] Page 1 of 12 [Next >] | Show: [10 ▼]       │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Bulk Actions (when selected): [Reschedule] [Cancel] [Export]│ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

**Key Features**:
- Smart filter tabs with counts
- Full-text search with NLP hints
- Multi-select for bulk operations
- Inline status updates
- Click row for detail side panel
- View toggles: List / Calendar / Cards

**Status Colors**:
- 🟢 Confirmed - Green
- 🟡 Pending - Yellow
- 🔵 In Progress - Blue
- 🔴 Urgent/Emergency - Red
- ⚫ Completed - Gray
- ❌ Cancelled - Red strikethrough

---

### Screen 3: Create Appointment Wizard

**Purpose**: 6-step guided appointment creation

**Wizard Flow**:
```
Step 1: Patient Selection
├── Search existing patients
├── Browse platform patients
└── Register new patient

Step 2: Appointment Type
├── Select from configured types
├── AI recommendation based on patient history
└── Duration and description preview

Step 3: Schedule
├── Calendar with AI-optimized slots
├── Recurring appointment option
└── Timezone handling

Step 4: Fee & Channel
├── Fee selection with dynamic pricing
├── Consultation channel (Video/Audio/Chat/Phone)
└── Payment preview

Step 5: Notes & Attachments
├── Patient-visible instructions
├── Private specialist notes
└── File attachments

Step 6: Review & Confirm
├── Full summary
├── AI validation checks
├── Notification preview
└── Confirm booking
```

**Wizard Layout**:
```
┌──────────────────────────────────────────────────────────────────┐
│ [← Back] Book New Appointment                          [X Close] │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Progress: ●───●───●───○───○───○                                 │
│            Patient  Type  Time  Fee  Notes  Review               │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │                                                           │   │
│  │              [Current Step Content]                       │   │
│  │                                                           │   │
│  │                                                           │   │
│  │                                                           │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │ AI Assistant: "Based on patient history, I recommend a     │   │
│  │ diabetes follow-up. Last A1C was elevated."               │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                   │
├──────────────────────────────────────────────────────────────────┤
│ [Save Draft]                              [Back] [Continue →]    │
└──────────────────────────────────────────────────────────────────┘
```

---

### Screen 4: Appointment Detail

**Purpose**: Comprehensive single appointment view with full patient health context

**Layout**:
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [← Back] Appointment Details                      [Reschedule] [Cancel] [•••]│
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────┐  ┌─────────────────────────────────┐│
│  │ APPOINTMENT INFO                   │  │ PATIENT PROFILE                 ││
│  │                                    │  │                                 ││
│  │ 👤 Mrs. Ada Johnson                │  │ ┌─────────────────────────────┐ ││
│  │ Follow-up Consultation             │  │ │ Health Score    [78/100]   │ ││
│  │                                    │  │ │ ████████████░░░ Good       │ ││
│  │ 📅 Tue, Jan 28, 2026              │  │ └─────────────────────────────┘ ││
│  │ 🕐 10:30 AM - 11:00 AM (30 min)   │  │                                 ││
│  │ 📹 Video Call (Zoom)               │  │ ⚠️ AI ALERTS                    ││
│  │ 💰 ₦15,000 (Paid)                  │  │ • Elevated BP in last reading  ││
│  │                                    │  │ • Diabetes checkup recommended ││
│  │ Status: 🟢 Confirmed               │  │                                 ││
│  │                                    │  │ 📊 RECENT VITALS               ││
│  │ [Start Consultation]               │  │ BP: 142/88 mmHg ⚠️             ││
│  └────────────────────────────────────┘  │ HR: 76 bpm ✓                   ││
│                                          │ Weight: 78 kg                   ││
│  ┌────────────────────────────────────┐  │ Updated: 2 days ago            ││
│  │ NOTES & INSTRUCTIONS               │  │                                 ││
│  │                                    │  │ 💊 ACTIVE MEDICATIONS (3)      ││
│  │ Patient Instructions:              │  │ • Metformin 500mg              ││
│  │ "Please fast for 8 hours before    │  │ • Lisinopril 10mg              ││
│  │  the appointment."                 │  │ • Aspirin 75mg                  ││
│  │                                    │  │                                 ││
│  │ Private Notes: [Click to view]     │  │ 🏥 LAST HEALTH CHECKUP         ││
│  │                                    │  │ Jan 15, 2026 - Consultation    ││
│  │ 📎 Attachments (2)                 │  │ Triage: 🟡 Consultation         ││
│  │ • lab_results.pdf                  │  │ Top Condition: Type 2 Diabetes ││
│  │ • prescription.pdf                 │  │ Probability: 78%               ││
│  └────────────────────────────────────┘  │                                 ││
│                                          │ [View Full Profile →]           ││
│  ┌────────────────────────────────────┐  └─────────────────────────────────┘│
│  │ APPOINTMENT TIMELINE               │                                     │
│  │ ● Jan 25 - Booked by Dr. Eyo      │                                     │
│  │ ● Jan 26 - Reminder sent          │                                     │
│  │ ● Jan 27 - Patient confirmed      │                                     │
│  └────────────────────────────────────┘                                     │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Key Sections**:
1. **Appointment Info Card**: Core appointment details with start button
2. **Patient Profile Sidebar**:
   - Health Score (Basic) with visual indicator
   - AI Alerts from health data analysis
   - Recent Vitals with abnormality flags
   - Active Medications (from prescriptions)
   - Last Health Checkup (Infermedica) with triage level
3. **Notes & Instructions**: Patient-visible and private notes
4. **Appointment Timeline**: Audit trail of booking changes
5. **Quick Actions**: Start, Reschedule, Cancel, Create Prescription

---

### Screen 7: Patient Profile Panel (Slide-out)

**Purpose**: Full 360° patient health view accessible from any appointment

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│ Patient Profile                                       [X]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │     ┌────┐                                              ││
│  │     │ 👤 │  Mrs. Ada Johnson                           ││
│  │     └────┘  Female, 45 years old                        ││
│  │             ada.johnson@email.com | +234 801 234 5678   ││
│  │                                                          ││
│  │     ┌───────────────────────────────────────────────┐   ││
│  │     │ HEALTH SCORE                                  │   ││
│  │     │                                               │   ││
│  │     │   Basic: 78/100 (Good)     Advanced: 72/100   │   ││
│  │     │   ████████████░░░░░░░░     ███████████░░░░░░  │   ││
│  │     │                                               │   ││
│  │     │   Trend: ↗️ +5 from last month                │   ││
│  │     └───────────────────────────────────────────────┘   ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  [Overview] [Checkups] [Prescriptions] [Vitals] [Documents] │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ OVERVIEW TAB                                            ││
│  │                                                          ││
│  │ ⚠️ ACTIVE ALERTS                                        ││
│  │ ┌─────────────────────────────────────────────────────┐ ││
│  │ │ 🔴 High Priority: BP reading 142/88 - Above normal  │ ││
│  │ │ 🟡 Follow-up due: Diabetes checkup overdue by 15d   │ ││
│  │ │ 🔵 New: Lab results uploaded 2 days ago             │ ││
│  │ └─────────────────────────────────────────────────────┘ ││
│  │                                                          ││
│  │ 📊 HEALTH SCORE BREAKDOWN                                ││
│  │ ┌─────────────────────────────────────────────────────┐ ││
│  │ │ Cardiovascular  ████████░░░░░  65/100  ⚠️           │ ││
│  │ │ Metabolic       ███████████░░  78/100  ✓            │ ││
│  │ │ Mental Health   ████████████░  85/100  ✓            │ ││
│  │ │ Lifestyle       ██████████░░░  72/100  ✓            │ ││
│  │ │ Preventive Care █████████░░░░  68/100  ⚠️           │ ││
│  │ └─────────────────────────────────────────────────────┘ ││
│  │                                                          ││
│  │ 🩺 RECENT APPOINTMENTS (Last 5)                          ││
│  │ • Jan 15 - Follow-up | Dr. Eyo | Completed              ││
│  │ • Dec 20 - Initial | Dr. Ada | Completed                 ││
│  │ • Nov 10 - Emergency | Dr. Obi | Completed               ││
│  │                                                          ││
│  │ 💊 ACTIVE PRESCRIPTIONS (3)                              ││
│  │ • Metformin 500mg - 2x daily | Expires: Mar 2026        ││
│  │ • Lisinopril 10mg - 1x daily | Expires: Feb 2026        ││
│  │ • Aspirin 75mg - 1x daily | Expires: Apr 2026           ││
│  │                                                          ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  [+ Create Prescription]  [Schedule Follow-up]  [Message]   │
└─────────────────────────────────────────────────────────────┘
```

**Tabs**:

### Tab: Health Checkups (Infermedica)
```
┌─────────────────────────────────────────────────────────────┐
│ HEALTH CHECKUP HISTORY                         [Filter ▼]   │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🟡 Jan 15, 2026 - Consultation Recommended             │ │
│ │                                                         │ │
│ │ Reported Symptoms: Fatigue, Frequent urination,        │ │
│ │                    Increased thirst                     │ │
│ │                                                         │ │
│ │ Top Conditions:                                         │ │
│ │ • Type 2 Diabetes ████████████████░░░░ 78%             │ │
│ │ • Prediabetes     ██████████░░░░░░░░░░ 52%             │ │
│ │ • UTI             ████░░░░░░░░░░░░░░░░ 23%             │ │
│ │                                                         │ │
│ │ AI Recommendation: Consult Endocrinologist              │ │
│ │                                                         │ │
│ │ [View Full Checkup Details]                             │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🟢 Dec 5, 2025 - Self-Care Appropriate                 │ │
│ │ Reported: Mild headache, Stress                         │ │
│ │ [View Details]                                          │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🔴 Nov 20, 2025 - Emergency Recommended                │ │
│ │ Reported: Chest pain, Shortness of breath               │ │
│ │ Outcome: Visited ER, Diagnosed: Anxiety attack          │ │
│ │ [View Details]                                          │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Tab: Vitals
```
┌─────────────────────────────────────────────────────────────┐
│ VITALS HISTORY                    [Last 30 Days ▼] [+ Add]  │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ BLOOD PRESSURE TREND                                    │ │
│ │     160 ┤                                               │ │
│ │     140 ┤    ╭─╮  ╭──╮                                  │ │
│ │     120 ┤ ╭──╯ ╰──╯  ╰─╮      ← Target Range           │ │
│ │     100 ┤                ╰──────                        │ │
│ │      80 ┤                                               │ │
│ │         └─────────────────────────────────              │ │
│ │           Jan 1    Jan 10    Jan 20    Jan 28          │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ LATEST READINGS                                             │
│ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐      │
│ │ Blood Pressure│ │ Heart Rate    │ │ Weight        │      │
│ │ 142/88 mmHg   │ │ 76 bpm        │ │ 78 kg         │      │
│ │ ⚠️ Elevated   │ │ ✓ Normal      │ │ ↗️ +2kg       │      │
│ │ Jan 26, 2026  │ │ Jan 26, 2026  │ │ Jan 20, 2026  │      │
│ └───────────────┘ └───────────────┘ └───────────────┘      │
│                                                             │
│ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐      │
│ │ Blood Glucose │ │ SpO2          │ │ Temperature   │      │
│ │ 145 mg/dL     │ │ 98%           │ │ 36.8°C        │      │
│ │ ⚠️ High       │ │ ✓ Normal      │ │ ✓ Normal      │      │
│ │ Jan 25, 2026  │ │ Jan 26, 2026  │ │ Jan 26, 2026  │      │
│ └───────────────┘ └───────────────┘ └───────────────┘      │
│                                                             │
│ 📱 CONNECTED DEVICES                                        │
│ • Apple Watch Series 9 - Synced 2 hours ago                │
│ • Omron Blood Pressure Monitor - Synced today              │
└─────────────────────────────────────────────────────────────┘
```

### Tab: Prescriptions
```
┌─────────────────────────────────────────────────────────────┐
│ PRESCRIPTIONS                    [Active ▼] [+ New Rx]      │
│                                                             │
│ ACTIVE PRESCRIPTIONS (3)                                    │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 💊 Metformin 500mg                                      │ │
│ │    Dosage: 1 tablet, twice daily with meals             │ │
│ │    Prescribed: Dec 15, 2025 | By: Dr. Ada Obi           │ │
│ │    Refills: 2 remaining | Expires: Mar 15, 2026         │ │
│ │                                                         │ │
│ │    [Renew] [Adjust] [Discontinue]                       │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 💊 Lisinopril 10mg                                      │ │
│ │    Dosage: 1 tablet, once daily in morning              │ │
│ │    Prescribed: Jan 5, 2026 | By: Dr. Bassey Eyo         │ │
│ │    Refills: 3 remaining | Expires: Feb 5, 2026          │ │
│ │    ⚠️ INTERACTION: Monitor with Metformin               │ │
│ │                                                         │ │
│ │    [Renew] [Adjust] [Discontinue]                       │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ PRESCRIPTION HISTORY                                        │
│ • Jan 5, 2026 - Lisinopril 10mg (Active)                   │
│ • Dec 15, 2025 - Metformin 500mg (Active)                  │
│ • Oct 10, 2025 - Amoxicillin 500mg (Completed)             │
│ • Aug 20, 2025 - Ibuprofen 400mg (Completed)               │
└─────────────────────────────────────────────────────────────┘
```

---

### Screen 5: Reschedule Modal

**Layout**:
```
┌──────────────────────────────────────────────────────────────────┐
│ Reschedule Appointment                                    [X]    │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Current: Mrs. Ada Johnson | Tue, Jan 28 at 10:30 AM             │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ AI Suggestions                                              │ │
│  │ ┌─────────────────────────────────────────────────────────┐│ │
│  │ │ ⭐ Wed, Jan 29 at 2:00 PM                                ││ │
│  │ │    "Patient's preferred time, your open slot"           ││ │
│  │ └─────────────────────────────────────────────────────────┘│ │
│  │ ┌─────────────────────────────────────────────────────────┐│ │
│  │ │    Thu, Jan 30 at 11:00 AM                               ││ │
│  │ │    "Lowest no-show probability"                          ││ │
│  │ └─────────────────────────────────────────────────────────┘│ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  Or select manually:                                              │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │          [Mini Calendar]        │     [Time Slots]          │ │
│  │                                 │     ○ 09:00 AM            │ │
│  │         January 2026            │     ● 10:30 AM ← selected │ │
│  │    S  M  T  W  T  F  S         │     ○ 11:00 AM            │ │
│  │       27 28 29 30 31            │     ○ 02:00 PM            │ │
│  │                                 │                           │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  Reason: [Specialist unavailable ▼]                              │
│                                                                   │
│  ☑ Notify patient via Email & SMS                                │
│                                                                   │
├──────────────────────────────────────────────────────────────────┤
│ [Cancel]                                    [Reschedule]         │
└──────────────────────────────────────────────────────────────────┘
```

---

### Screen 6: Cancel Flow Modal

**Layout**:
```
┌──────────────────────────────────────────────────────────────────┐
│ ⚠️ Cancel Appointment                                      [X]    │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  You're about to cancel:                                          │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ 👤 Mrs. Ada Johnson | Follow-up Consultation                │ │
│  │    Tuesday, Jan 28, 2026 at 10:30 AM                        │ │
│  │    Fee: ₦15,000 (Paid)                                       │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  Reason for cancellation: *                                       │
│  [Specialist unavailable                              ▼]         │
│                                                                   │
│  Refund Option:                                                   │
│  ○ Full refund (₦15,000)                                         │
│  ○ Partial refund: [₦_______]                                    │
│  ○ Credit to patient account                                      │
│  ○ No refund (per cancellation policy)                           │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ ☑ Offer to reschedule                                       │ │
│  │   AI Suggested: Wed, Jan 29 at 2:00 PM                      │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ☑ Notify patient via Email & SMS                                │
│                                                                   │
│  ⚠️ This action cannot be undone.                                 │
│                                                                   │
├──────────────────────────────────────────────────────────────────┤
│ [Go Back]                               [Cancel Appointment]     │
└──────────────────────────────────────────────────────────────────┘
```

---

## Composable: useCreateAppointment.js

```javascript
import { ref, reactive, computed } from 'vue';

export function useCreateAppointment() {
  // Wizard State
  const currentStep = ref(1);
  const totalSteps = 6;
  const isSubmitting = ref(false);

  // Step 1: Patient
  const patient = reactive({
    type: '', // 'existing' | 'platform' | 'new'
    id: '',
    name: '',
    email: '',
    phone: '',
    isNewPatient: false,
    consentVerified: false,
  });

  // Step 2: Appointment Type
  const appointmentType = reactive({
    id: '',
    name: '',
    duration: 30,
    description: '',
    aiRecommended: false,
  });

  // Step 3: Schedule
  const schedule = reactive({
    date: '',
    time: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    isRecurring: false,
    recurringPattern: null,
  });

  // Step 4: Fee & Channel
  const feeChannel = reactive({
    feeId: '',
    amount: 0,
    currency: 'NGN',
    channel: 'video', // video | audio | chat | phone
    dynamicPricing: [],
  });

  // Step 5: Notes
  const notes = reactive({
    patientInstructions: '',
    privateNotes: '',
    attachments: [],
  });

  // Validation
  const canProceed = computed(() => {
    switch (currentStep.value) {
      case 1: return !!patient.id || (patient.isNewPatient && patient.email && patient.phone);
      case 2: return !!appointmentType.id;
      case 3: return !!schedule.date && !!schedule.time;
      case 4: return !!feeChannel.feeId && !!feeChannel.channel;
      case 5: return true; // Notes are optional
      case 6: return true; // Review step
      default: return false;
    }
  });

  // Final Payload
  const bookingPayload = computed(() => ({
    patient_id: patient.id,
    is_new_patient: patient.isNewPatient,
    new_patient_data: patient.isNewPatient ? {
      email: patient.email,
      phone: patient.phone,
      name: patient.name,
    } : null,
    appointment_type: appointmentType.id,
    appointment_type_name: appointmentType.name,
    duration: appointmentType.duration,
    date: schedule.date,
    time: schedule.time,
    timezone: schedule.timezone,
    is_recurring: schedule.isRecurring,
    recurring_pattern: schedule.recurringPattern,
    fee_id: feeChannel.feeId,
    amount: feeChannel.amount,
    channel: feeChannel.channel,
    patient_instructions: notes.patientInstructions,
    private_notes: notes.privateNotes,
    attachments: notes.attachments,
  }));

  // Navigation
  const nextStep = () => {
    if (currentStep.value < totalSteps && canProceed.value) {
      currentStep.value++;
    }
  };

  const prevStep = () => {
    if (currentStep.value > 1) {
      currentStep.value--;
    }
  };

  const goToStep = (step) => {
    if (step >= 1 && step <= totalSteps) {
      currentStep.value = step;
    }
  };

  const reset = () => {
    currentStep.value = 1;
    Object.assign(patient, { type: '', id: '', name: '', email: '', phone: '', isNewPatient: false, consentVerified: false });
    Object.assign(appointmentType, { id: '', name: '', duration: 30, description: '', aiRecommended: false });
    Object.assign(schedule, { date: '', time: '', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, isRecurring: false, recurringPattern: null });
    Object.assign(feeChannel, { feeId: '', amount: 0, currency: 'NGN', channel: 'video', dynamicPricing: [] });
    Object.assign(notes, { patientInstructions: '', privateNotes: '', attachments: [] });
  };

  return {
    currentStep,
    totalSteps,
    isSubmitting,
    patient,
    appointmentType,
    schedule,
    feeChannel,
    notes,
    canProceed,
    bookingPayload,
    nextStep,
    prevStep,
    goToStep,
    reset,
  };
}
```

---

## API Endpoints Required

### Existing Endpoints (RC-Backend) - Already Available
```
# Appointments
GET    /appointments                       # List appointments
GET    /appointments/:id                   # Single appointment
POST   /appointments                       # Create appointment
PATCH  /appointments/:id                   # Update appointment
PATCH  /appointments/:id/reschedule        # Reschedule
PATCH  /appointments/:id/cancel            # Cancel
GET    /appointments/available-times       # Available slots
GET    /appointments/available-specialists # Available doctors

# Prescriptions
GET    /prescriptions                      # List prescriptions
GET    /prescriptions/:id                  # Single prescription
POST   /prescriptions                      # Create prescription
PATCH  /prescriptions/:id                  # Update prescription
GET    /prescriptions/patient/:patientId   # Patient's prescriptions

# Health Checkups (Infermedica)
GET    /health-checkup/results/:userId     # User's checkup history
GET    /health-checkup/:id                 # Single checkup details

# Vitals
GET    /vitals                             # List vitals
GET    /vitals/recent                      # Recent vitals
GET    /vitals/chart-data                  # Chart data for trends
POST   /vitals                             # Log new vitals

# Users/Patients
GET    /users/:id                          # User profile
GET    /users/me                           # Current user
```

### New Endpoints Needed
```
# Specialist Dashboard
GET  /specialist/dashboard                 # Dashboard stats & overview
GET  /specialist/dashboard/today           # Today's appointments with patient health data
GET  /specialist/dashboard/alerts          # AI-generated alerts (follow-ups, vitals, etc.)

# Specialist Patients
GET  /specialist/patients                  # Specialist's patient list
GET  /specialist/patients/:id/profile      # Full patient profile with health data
GET  /specialist/patients/:id/health-summary   # Aggregated health summary
GET  /specialist/patients/search           # Search all platform patients

# Health Scores
GET  /specialist/patients/:id/health-score         # Basic health score
GET  /specialist/patients/:id/health-score/advanced # Advanced score breakdown
GET  /specialist/patients/:id/health-score/history  # Score trends over time

# Patient Health Data (Aggregated Views)
GET  /specialist/patients/:id/checkups     # Infermedica checkup history
GET  /specialist/patients/:id/vitals       # Vitals history with trends
GET  /specialist/patients/:id/prescriptions # Prescription history
GET  /specialist/patients/:id/documents    # Lab results, imaging
GET  /specialist/patients/:id/notes        # Clinical notes history
GET  /specialist/patients/:id/timeline     # Combined health timeline

# AI Features
POST /specialist/appointments/ai/suggest-time      # AI time suggestions
POST /specialist/appointments/ai/suggest-type      # AI type recommendation based on patient
GET  /specialist/appointments/ai/insights          # AI insights for dashboard
POST /specialist/patients/:id/ai/pre-visit-brief   # AI-generated pre-visit summary

# Prescriptions (Specialist-specific)
POST /specialist/prescriptions             # Create prescription with e-prescribe
GET  /specialist/prescriptions/drug-interactions   # Check drug interactions

# Analytics
GET  /specialist/analytics                 # Full analytics data
GET  /specialist/analytics/revenue         # Revenue breakdown
GET  /specialist/analytics/patients        # Patient statistics
GET  /specialist/analytics/no-shows        # No-show analysis

# Bulk Operations
POST /specialist/appointments/bulk/reschedule
POST /specialist/appointments/bulk/cancel
POST /specialist/appointments/bulk/remind
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
1. Create directory structure (including patient/ subfolder)
2. Create `_sa-variables.scss` with color palette
3. Set up routes in `router/index.js`
4. Create core composables:
   - `useAppointments.js` - Appointments state & API
   - `useCreateAppointment.js` - Wizard state
   - `usePatientProfile.js` - Patient data aggregation
5. Create shared components (StatusBadge, ChannelIcon, PatientAvatar)
6. Add new specialist endpoints to `apiFactory.js`

### Phase 2: Core Screens (Week 3-4)
7. Build Dashboard.vue with:
   - Today's schedule
   - Quick stats
   - AI alerts (including health-based alerts)
8. Build AppointmentsList.vue with filters
9. Build Create Wizard container + all 6 steps
10. Build AppointmentDetail.vue with patient sidebar

### Phase 3: Patient Health Integrations (Week 5-6)
11. Build patient/ components:
    - `PatientProfilePanel.vue` - Main slide-out panel
    - `PatientHeader.vue` - Avatar, name, health score
    - `HealthScoreCard.vue` - Basic & Advanced scores
    - `HealthScoreBreakdown.vue` - Category breakdown
12. Build health checkup components:
    - `HealthCheckupsTab.vue` - Infermedica history list
    - `HealthCheckupCard.vue` - Single checkup summary
    - `CheckupDetailDrawer.vue` - Full checkup details
    - `TriageBadge.vue` - Emergency/Consultation/Self-care
    - `ConditionPrediction.vue` - AI predicted conditions
13. Build vitals components:
    - `VitalsTab.vue` - Vitals list and charts
    - `VitalsChart.vue` - Trend visualization
    - `VitalsReading.vue` - Single vital with status
    - `VitalsAlertBadge.vue` - Abnormality indicator
14. Build prescription components:
    - `PrescriptionsTab.vue` - Prescription history
    - `PrescriptionCard.vue` - Single prescription
    - `CreatePrescriptionModal.vue` - New prescription form
    - `DrugInteractionAlert.vue` - Interaction warnings
15. Create composables:
    - `useHealthCheckups.js` - Infermedica data
    - `usePrescriptions.js` - Prescription data
    - `useVitals.js` - Vitals data
    - `useHealthScores.js` - Score calculations

### Phase 4: Modals & Actions (Week 7)
16. Build RescheduleModal.vue
17. Build CancelModal.vue
18. Build PatientQuickView.vue (compact profile modal)
19. Integrate with existing APIs

### Phase 5: Polish & Testing (Week 8)
20. Mobile responsiveness pass
21. Animation/transitions
22. Error handling & loading states
23. Patient profile panel responsiveness
24. Build verification
25. PM2 deployment

### Phase 6: Advanced Features (Future)
26. Analytics Dashboard with health insights
27. AI Co-Pilot Panel
28. Bulk Operations
29. Emergency Queue with triage integration
30. AI Pre-Visit Brief generation

---

## Component Design Specifications

### AppointmentCard.vue
```
┌─────────────────────────────────────────────────────────────┐
│ ┌────┐                                                      │
│ │ 👤 │  Mrs. Ada Johnson                    [🟢 Confirmed] │
│ └────┘  Follow-up Consultation                              │
│                                                             │
│  📅 Tue, Jan 28 at 10:30 AM     💰 ₦15,000                 │
│  📹 Video Call                   ⏱️ 30 min                  │
│                                                             │
│  [View Details]  [Reschedule]  [Start]                     │
└─────────────────────────────────────────────────────────────┘
```

### StatusBadge.vue
- Confirmed: `bg-green-100 text-green-700 border-green-200`
- Pending: `bg-yellow-100 text-yellow-700 border-yellow-200`
- In Progress: `bg-blue-100 text-blue-700 border-blue-200`
- Completed: `bg-gray-100 text-gray-700 border-gray-200`
- Cancelled: `bg-red-100 text-red-700 border-red-200`
- No-Show: `bg-red-100 text-red-700 border-red-200` + strikethrough

### QuickStatsCard.vue
```
┌────────────────────┐
│ Today             │
│ ┌────────────────┐│
│ │      5         ││
│ │ appointments   ││
│ └────────────────┘│
│ ▲ 2 from yesterday│
└────────────────────┘
```

---

## Navigation Update

Add to specialist side-nav:
```javascript
{
  link: "/app/specialist/appointments-v2",
  label: "Appointments v2",
  icon: "hi-calendar",
  iconColor: "#4FC3F7",
  children: [
    { link: "/app/specialist/appointments-v2", label: "Dashboard" },
    { link: "/app/specialist/appointments-v2/list", label: "All Appointments" },
    { link: "/app/specialist/appointments-v2/create", label: "Book New" },
    { link: "/app/specialist/appointments-v2/analytics", label: "Analytics" },
  ]
}
```

---

## Verification Checklist

### Core Functionality
- [ ] Nav item visible in specialist sidebar
- [ ] Dashboard loads with stats and today's schedule
- [ ] Appointments list shows with filters working
- [ ] Create wizard completes all 6 steps
- [ ] Appointment detail view loads with patient sidebar
- [ ] Reschedule modal functions correctly
- [ ] Cancel modal functions with refund options
- [ ] Status badges display correctly with colors

### Patient Health Integrations
- [ ] Patient profile panel opens from appointment detail
- [ ] Health Score (Basic) displays on patient cards
- [ ] Health Score (Advanced) breakdown shows categories
- [ ] Health Score trends chart renders
- [ ] Health Checkup history loads from Infermedica data
- [ ] Triage badges (Emergency/Consultation/Self-care) display correctly
- [ ] Condition predictions show with probability bars
- [ ] Checkup detail drawer opens with full info
- [ ] Vitals tab shows recent readings
- [ ] Vitals trend chart renders correctly
- [ ] Vitals abnormality alerts show (⚠️ indicators)
- [ ] Prescriptions tab lists active medications
- [ ] Prescription history displays with status
- [ ] Create Prescription modal works
- [ ] Drug interaction warnings display
- [ ] Documents tab shows lab results
- [ ] Clinical notes history accessible

### AI Features
- [ ] AI alerts show on dashboard (follow-ups, vitals, etc.)
- [ ] AI time suggestions in reschedule modal
- [ ] AI appointment type recommendations based on patient history

### Responsive & Polish
- [ ] Mobile responsive at 375px, 768px, 1024px
- [ ] Patient profile panel adapts to mobile (full screen)
- [ ] Animations and transitions smooth
- [ ] Loading states for all async data
- [ ] Error handling with user-friendly messages
- [ ] Build succeeds: `yarn build`
- [ ] PM2 deployment works

---

## Notes

### Development Guidelines
- **Parallel Development**: Keep existing appointments module untouched until v2 is complete
- **Reuse APIs**: Leverage existing appointment, prescription, vitals, and health-checkup APIs
- **AI Features**: Start with mock AI suggestions, implement real AI integration later
- **Design Consistency**: Match onboarding style exactly (colors, shadows, spacing, typography)
- **Performance**: Lazy-load wizard steps, patient tabs, and paginate lists

### Data Integration Notes
- **Health Scores**: Calculate from vitals, checkups, and prescription adherence data
- **Infermedica Data**: Use existing `/health-checkup/results/:userId` endpoint
- **Prescriptions**: Integrate with existing prescription module, add specialist-specific views
- **Vitals**: Pull from existing vitals module, add trend calculations
- **Documents**: Integrate with existing file upload system (S3)

### Backend Considerations
- New endpoints needed for aggregated patient health data
- Consider caching health scores (recalculate on vitals/checkup updates)
- Drug interaction API may require external service (e.g., RxNorm)
- AI pre-visit brief generation could use existing Infermedica data + appointment history

### Security & Compliance
- All patient health data access must be logged (HIPAA audit trail)
- Specialist can only view patients they have appointments with (or platform patients with consent)
- Prescription creation requires specialist verification status
- Drug interaction checks should be mandatory before prescription submission

---

*Document Version: 1.1*
*Created: January 28, 2026*
*Last Updated: January 28, 2026*
*Author: Bassey Eyo*
