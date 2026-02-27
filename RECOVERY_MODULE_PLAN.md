# Rapid Capsule Recovery Module — Comprehensive Implementation Plan

## Grant Context
- **Grant**: UK Addiction Healthcare Solutions, up to £1M, 24 months, 100% funded
- **Scope**: Drug and alcohol addiction treatment, recovery, and harm reduction
- **Target**: Digital health / MedTech solution

---

## Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [Pillar 1: AI Addiction Screening & Assessment](#2-pillar-1-ai-addiction-screening--assessment)
3. [Pillar 2: AI-Powered Digital Recovery Companion](#3-pillar-2-ai-powered-digital-recovery-companion)
4. [Pillar 3: Smart MAT Management](#4-pillar-3-smart-mat-management)
5. [Pillar 4: Predictive Relapse Risk Engine](#5-pillar-4-predictive-relapse-risk-engine)
6. [Pillar 5: Structured Recovery Programs](#6-pillar-5-structured-recovery-programs)
7. [Pillar 6: Harm Reduction Toolkit](#7-pillar-6-harm-reduction-toolkit)
8. [Shared Infrastructure Changes](#8-shared-infrastructure-changes)
9. [Admin Module Additions](#9-admin-module-additions)
10. [Edge Cases & Safety Considerations](#10-edge-cases--safety-considerations)
11. [Data Privacy & Compliance](#11-data-privacy--compliance)
12. [Implementation Phases](#12-implementation-phases)

---

## 1. Architecture Overview

### New Module Structure

```
RC-Backend/src/modules/
├── recovery/                           # NEW — Core recovery module
│   ├── recovery.module.ts
│   ├── entities/
│   │   ├── recovery-profile.entity.ts
│   │   ├── addiction-screening.entity.ts
│   │   ├── recovery-plan.entity.ts
│   │   ├── sobriety-log.entity.ts
│   │   ├── recovery-milestone.entity.ts
│   │   ├── crisis-event.entity.ts
│   │   ├── peer-assignment.entity.ts
│   │   ├── group-session.entity.ts
│   │   └── recovery-journal.entity.ts
│   ├── dto/
│   │   ├── begin-screening.dto.ts
│   │   ├── submit-screening.dto.ts
│   │   ├── create-recovery-plan.dto.ts
│   │   ├── log-sobriety.dto.ts
│   │   ├── log-craving.dto.ts
│   │   ├── create-crisis-event.dto.ts
│   │   ├── journal-entry.dto.ts
│   │   ├── assign-peer.dto.ts
│   │   └── create-group-session.dto.ts
│   ├── services/
│   │   ├── addiction-screening.service.ts
│   │   ├── recovery-plan.service.ts
│   │   ├── sobriety-tracker.service.ts
│   │   ├── recovery-companion.service.ts    # AI chatbot
│   │   ├── relapse-risk.service.ts          # Predictive engine
│   │   ├── crisis-intervention.service.ts
│   │   ├── peer-support.service.ts
│   │   ├── group-session.service.ts
│   │   ├── harm-reduction.service.ts
│   │   ├── mat-protocol.service.ts          # MAT-specific prescribing
│   │   ├── recovery-rewards.service.ts
│   │   ├── recovery-notifications.service.ts
│   │   └── withdrawal-assessment.service.ts # COWS/CIWA scoring
│   ├── controllers/
│   │   ├── addiction-screening.controller.ts
│   │   ├── recovery-plan.controller.ts
│   │   ├── sobriety-tracker.controller.ts
│   │   ├── recovery-companion.controller.ts
│   │   ├── relapse-risk.controller.ts
│   │   ├── crisis-intervention.controller.ts
│   │   ├── peer-support.controller.ts
│   │   ├── group-session.controller.ts
│   │   └── harm-reduction.controller.ts
│   ├── guards/
│   │   ├── recovery-enrolled.guard.ts       # Ensures user has active recovery profile
│   │   └── crisis-access.guard.ts           # Bypasses auth for crisis endpoints
│   ├── schedulers/
│   │   ├── relapse-risk.scheduler.ts        # Daily risk score calculation
│   │   ├── milestone-checker.scheduler.ts   # Check & award milestones
│   │   ├── check-in-reminder.scheduler.ts   # Nudge users who miss daily logs
│   │   └── mat-compliance.scheduler.ts      # MAT refill/appointment compliance
│   └── constants/
│       ├── screening-instruments.ts         # AUDIT, DAST-10, CAGE, ASSIST
│       ├── withdrawal-scales.ts             # COWS, CIWA-Ar scales
│       ├── milestone-definitions.ts         # Sobriety milestone thresholds
│       └── risk-thresholds.ts               # Relapse risk scoring config

RC/src/views/Mainapp/Recovery/               # NEW — Patient frontend
├── RecoveryDashboard.vue                    # Main recovery hub
├── Screening/
│   ├── ScreeningLanding.vue
│   ├── ScreeningInstrument.vue              # Renders AUDIT/DAST/CAGE dynamically
│   ├── ScreeningResults.vue
│   └── ScreeningHistory.vue
├── Companion/
│   ├── CompanionChat.vue                    # AI recovery chatbot
│   └── CravingExercise.vue                  # Guided CBT micro-exercises
├── SobrietyTracker/
│   ├── DailyCheckIn.vue
│   ├── SobrietyCounter.vue
│   ├── CravingLog.vue
│   ├── MoodJournal.vue
│   └── MilestoneWall.vue
├── RecoveryPlan/
│   ├── PlanOverview.vue
│   ├── PlanTimeline.vue
│   └── GoalTracker.vue
├── PeerSupport/
│   ├── PeerDirectory.vue
│   ├── PeerProfile.vue
│   └── MyPeer.vue
├── GroupSessions/
│   ├── SessionCalendar.vue
│   ├── JoinSession.vue
│   └── SessionHistory.vue
├── HarmReduction/
│   ├── NaloxoneFinder.vue
│   ├── SafeUseInfo.vue
│   └── EmergencyContacts.vue
└── Crisis/
    ├── CrisisButton.vue                     # Persistent floating button
    └── CrisisScreen.vue                     # Crisis intervention flow

RC_Admin_Backend/src/modules/recovery/       # NEW — Admin backend
RC_Admin_UI/src/components/Recovery/          # NEW — Admin frontend
```

### Modifications to Existing Files

```
MODIFIED FILES:
├── RC-Backend/src/modules/users/entities/user.entity.ts
│   └── Add: recovery_profile ref, recovery_status, substance_use_history
├── RC-Backend/src/modules/vitals/entities/vital.entity.ts
│   └── Add: craving_level[], mood_score[], anxiety_level[] time-series
├── RC-Backend/src/modules/appointments/entities/appointment.entity.ts
│   └── Add: session_type (individual|group|crisis|peer), max_participants, group_participants[]
├── RC-Backend/src/modules/appointments/appointments.service.ts
│   └── Add: group session creation, crisis appointment fast-track
├── RC-Backend/src/modules/pharmacy/entities/drug.entity.ts
│   └── Add: is_mat_medication, mat_protocol, tapering_schedule
├── RC-Backend/src/modules/pharmacy/services/abuse-prevention.service.ts
│   └── Add: MAT exemptions, cross-patient monitoring, suspicious activity DB logging
├── RC-Backend/src/modules/prescriptions/services/refill.service.ts
│   └── Add: MAT-specific refill gating (requires appointment attendance + screening score)
├── RC-Backend/src/modules/rewards/entities/reward.entity.ts
│   └── Add: RewardActivity enum values for recovery milestones
├── RC-Backend/src/modules/notifications/
│   └── Add: NotificationType values for recovery, crisis, relapse risk
├── RC-Backend/src/modules/reminders/
│   └── Add: recovery-specific reminder types
```

---

## 2. Pillar 1: AI Addiction Screening & Assessment

### 2.1 Screening Instruments

**File**: `recovery/constants/screening-instruments.ts`

Define four validated clinical instruments as structured JSON:

#### AUDIT (Alcohol Use Disorders Identification Test)
- 10 questions, each scored 0-4
- Total: 0-40
- Zones: Low risk (0-7), Hazardous (8-15), Harmful (16-19), Possible dependence (20-40)
- Questions cover: frequency, quantity, binge frequency, impaired control, morning drinking, guilt, blackouts, injury, others concerned

#### DAST-10 (Drug Abuse Screening Test)
- 10 yes/no questions (score 0 or 1 each, except Q3 which reverse-scores)
- Total: 0-10
- Zones: No problems (0), Low (1-2), Moderate (3-5), Substantial (6-8), Severe (9-10)
- Questions cover: non-medical drug use, polysubstance, inability to stop, withdrawal, blackouts, guilt, complaints by partner, neglect, illegal activity, medical problems

#### CAGE (Quick Alcohol Screen)
- 4 yes/no questions (score 0 or 1)
- Total: 0-4
- Interpretation: ≥2 = clinically significant, ≥3 = high likelihood of dependence
- Questions: Cut down, Annoyed by criticism, Guilty, Eye-opener

#### WHO ASSIST (Alcohol, Smoking and Substance Involvement Screening Test)
- 8 questions per substance (tobacco, alcohol, cannabis, cocaine, amphetamines, inhalants, sedatives, hallucinogens, opioids, other)
- Each question scored differently (frequency scales)
- Per-substance risk: Low (0-3 for drugs, 0-10 for alcohol), Moderate (4-26 / 11-26), High (27+)
- Most comprehensive, covers 10 substance categories

Each instrument stored as:
```typescript
interface ScreeningInstrument {
  id: string;                    // 'audit' | 'dast10' | 'cage' | 'assist'
  name: string;
  description: string;
  version: string;
  citation: string;              // Academic reference
  estimated_minutes: number;
  questions: ScreeningQuestion[];
  scoring: ScoringConfig;
  risk_zones: RiskZone[];
  recommended_for: string[];     // 'alcohol', 'drugs', 'quick_screen'
}
```

### 2.2 Screening Entity

**File**: `recovery/entities/addiction-screening.entity.ts`

```typescript
@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, collection: 'addiction_screenings' })
export class AddictionScreening {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  administered_by: Types.ObjectId;           // Specialist who administered (null = self-screen)

  @Prop({ required: true, enum: ['audit', 'dast10', 'cage', 'assist'] })
  instrument: string;

  @Prop({ enum: ['self', 'specialist_administered', 'scheduled'] })
  screening_type: string;

  @Prop({ type: mongoose.Schema.Types.Mixed, required: true })
  answers: Record<string, any>;              // { question_id: { answer_value, answer_text, score } }

  @Prop({ type: Number, required: true })
  total_score: number;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  subscale_scores: Record<string, number>;   // For ASSIST: per-substance scores

  @Prop({ required: true, enum: ['low', 'moderate', 'high', 'severe'] })
  risk_level: string;

  @Prop({ type: String })
  risk_zone_label: string;                   // e.g., "Hazardous drinking"

  @Prop({ type: [String] })
  substances_identified: string[];           // e.g., ['alcohol', 'cannabis']

  @Prop({ type: mongoose.Schema.Types.Mixed })
  ai_interpretation: {                       // Claude-generated
    generated_at: Date;
    model: string;
    content: {
      summary: string;
      risk_assessment: string;
      recommended_interventions: string[];
      recommended_specialist_type: string;
      urgency: 'routine' | 'soon' | 'urgent' | 'emergency';
      brief_intervention_notes: string;      // For AUDIT zone 2 (brief intervention)
      motivational_message: string;
      comparison_to_previous: string;        // If prior screening exists
    };
  };

  @Prop({ type: Types.ObjectId, ref: 'Appointment' })
  linked_appointment: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'RecoveryPlan' })
  linked_recovery_plan: Types.ObjectId;

  @Prop({ type: Number })
  duration_ms: number;                       // Time to complete

  @Prop({ type: Boolean, default: false })
  is_baseline: boolean;                      // First screening in recovery program

  @Prop({ type: Date })
  next_screening_due: Date;                  // Auto-scheduled follow-up

  @Prop({ type: Date })
  deleted_at: Date;
}
```

### 2.3 Screening Service

**File**: `recovery/services/addiction-screening.service.ts`

**Methods:**

| Method | Description |
|--------|-------------|
| `beginScreening(dto, userId)` | Creates DB record, selects instrument based on context (CAGE for quick check, AUDIT for alcohol focus, DAST for drugs, ASSIST for comprehensive). Returns questions. |
| `submitScreening(dto, userId)` | Validates all required answers, calculates score using instrument-specific algorithm, determines risk zone, saves to DB. |
| `generateAIInterpretation(screeningId)` | Calls Claude with screening results + patient context (age, gender, medical history, prior screenings). Generates personalised interpretation. Deducts 1 credit. |
| `getScreeningHistory(userId, instrument?)` | Returns all screenings for user, optionally filtered by instrument. Sorted by date desc. |
| `getProgressOverTime(userId, instrument)` | Returns score trend data for charting (date vs. score). |
| `compareToBaseline(screeningId)` | Compares current screening to baseline screening. Calculates delta, percentage change, direction. |
| `scheduleFollowUp(screeningId, intervalDays)` | Sets `next_screening_due`, creates reminder via RemindersService. |
| `getRecommendedInstrument(userId)` | Based on user's `substance_use_history` and prior screenings, recommends which instrument to take next. |
| `administerScreening(dto, specialistId)` | Specialist-administered version. Specialist enters answers on behalf of patient during consultation. |

**Scoring algorithms** (implemented per instrument):

```typescript
// AUDIT scoring
calculateAuditScore(answers: Record<string, number>): { total: number; zone: string; risk_level: string } {
  // Q1-Q8: 0-4 each, Q9-Q10: 0, 2, or 4
  // Zone 1 (0-7): Low risk - alcohol education
  // Zone 2 (8-15): Hazardous - simple advice/brief intervention
  // Zone 3 (16-19): Harmful - brief intervention + continued monitoring
  // Zone 4 (20-40): Possible dependence - referral to specialist
}

// DAST-10 scoring
calculateDastScore(answers: Record<string, boolean>): { total: number; risk_level: string } {
  // All yes=1 except Q3 (no=1)
  // 0: no problems, 1-2: low, 3-5: moderate, 6-8: substantial, 9-10: severe
}

// CAGE scoring
calculateCageScore(answers: Record<string, boolean>): { total: number; clinically_significant: boolean } {
  // ≥2 clinically significant, ≥3 high likelihood
}

// ASSIST scoring (per-substance)
calculateAssistScore(answers: Record<string, any>): {
  substance_scores: Record<string, { score: number; risk_level: string }>;
  highest_risk_substance: string;
  overall_risk: string;
}
```

### 2.4 Screening Controller

**File**: `recovery/controllers/addiction-screening.controller.ts`

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/recovery/screening` | Begin a new screening |
| `POST` | `/recovery/screening/:id/submit` | Submit answers |
| `POST` | `/recovery/screening/:id/ai-interpretation` | Generate Claude interpretation |
| `GET` | `/recovery/screening/recommended` | Get recommended instrument for user |
| `GET` | `/recovery/screening/history` | Get screening history |
| `GET` | `/recovery/screening/:id` | Get single screening |
| `GET` | `/recovery/screening/progress/:instrument` | Score trend over time |
| `POST` | `/recovery/screening/:id/schedule-followup` | Schedule next screening |
| `DELETE` | `/recovery/screening/:id` | Soft-delete |

### 2.5 Withdrawal Assessment Scales

**File**: `recovery/services/withdrawal-assessment.service.ts`

Implements two validated withdrawal scales for clinical use during detox:

#### COWS (Clinical Opiate Withdrawal Scale)
- 11 items, each scored 0-4 or 0-5
- Total: 0-48
- Severity: Mild (5-12), Moderate (13-24), Moderately severe (25-36), Severe (37+)
- Items: resting pulse, GI upset, sweating, tremor, restlessness, yawning, pupil size, bone/joint aches, runny nose, gooseflesh, anxiety/irritability

#### CIWA-Ar (Clinical Institute Withdrawal Assessment for Alcohol - Revised)
- 10 items, most scored 0-7
- Total: 0-67
- Severity: Mild (<10), Moderate (10-18), Severe (19+)
- Items: nausea, tremor, paroxysmal sweats, anxiety, agitation, tactile disturbances, auditory disturbances, visual disturbances, headache, orientation/clouding

**These are specialist-administered only** — embedded in the clinical notes flow during detox appointments.

### 2.6 Frontend Flow

**Screening UI** modelled after the existing HealthCheckup flow:

1. `ScreeningLanding.vue` — explains purpose, shows recommended instrument, displays last screening date/score
2. `ScreeningInstrument.vue` — renders questions dynamically from instrument definition. Progress bar. One question at a time (mobile-friendly). Back button allowed.
3. `ScreeningResults.vue` — shows score, risk zone (colour-coded), AI interpretation, recommended next steps, "Book a Specialist" CTA, "Start Recovery Program" CTA
4. `ScreeningHistory.vue` — timeline of past screenings with score trend chart (reuse vitals chart pattern)

---

## 3. Pillar 2: AI-Powered Digital Recovery Companion

### 3.1 Recovery Companion Service

**File**: `recovery/services/recovery-companion.service.ts`

This is a conversational AI powered by Claude, purpose-built for recovery support. It is NOT a replacement for clinical care — it provides between-session support, psychoeducation, and crisis detection.

**Architecture**: Separate from the messaging module. Uses its own conversation store (not the patient-specialist messaging system) to maintain therapeutic context without mixing with clinical communication.

### 3.2 Recovery Journal Entity

**File**: `recovery/entities/recovery-journal.entity.ts`

```typescript
@Schema({ timestamps: true, collection: 'recovery_journals' })
export class RecoveryJournal {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  user: Types.ObjectId;

  @Prop({ required: true, enum: ['check_in', 'craving', 'mood', 'gratitude', 'trigger', 'coping', 'free_write', 'companion_chat'] })
  entry_type: string;

  // Structured data (varies by entry_type)
  @Prop({ type: mongoose.Schema.Types.Mixed })
  structured_data: {
    // check_in type
    mood_score?: number;           // 1-10
    energy_level?: number;         // 1-10
    sleep_quality?: number;        // 1-10
    craving_intensity?: number;    // 0-10, 0 = none
    substances_craved?: string[];
    triggers_today?: string[];     // from predefined + custom list
    coping_strategies_used?: string[];
    medications_taken?: boolean;
    meetings_attended?: number;

    // craving type
    craving_substance?: string;
    craving_trigger?: string;
    craving_location?: string;
    craving_time_of_day?: string;
    craving_duration_minutes?: number;
    craving_outcome?: 'resisted' | 'used' | 'reduced';

    // companion_chat type
    conversation_messages?: Array<{
      role: 'user' | 'assistant';
      content: string;
      timestamp: Date;
    }>;
    conversation_summary?: string;  // Claude-generated summary after session
    therapeutic_technique_used?: string; // 'cbt' | 'dbt' | 'motivational_interviewing' | 'mindfulness'
    crisis_detected?: boolean;
    escalated_to_human?: boolean;
  };

  @Prop({ type: String })
  free_text: string;               // Free-form journaling content

  @Prop({ type: mongoose.Schema.Types.Mixed })
  ai_response: {                   // Claude's response to the entry
    generated_at: Date;
    content: string;
    suggested_exercise?: string;   // 'urge_surfing' | '5_4_3_2_1_grounding' | 'deep_breathing' | 'thought_challenge'
    affirmation?: string;
    risk_flags?: string[];
  };

  @Prop({ type: String, enum: ['low', 'moderate', 'high', 'crisis'], default: 'low' })
  risk_level_at_entry: string;

  @Prop({ type: Date })
  deleted_at: Date;
}
```

### 3.3 Companion Chat — Claude Integration

**System prompt structure:**

```
You are a supportive recovery companion for someone in addiction recovery. Your role is:

1. LISTEN empathetically without judgement
2. VALIDATE their feelings and experiences
3. GUIDE them through evidence-based coping exercises when appropriate
4. DETECT crisis signals and escalate when needed
5. NEVER act as a replacement for clinical care
6. NEVER suggest specific medications or diagnoses
7. ALWAYS encourage them to speak with their recovery specialist for clinical concerns

THERAPEUTIC TECHNIQUES YOU CAN USE:
- CBT thought challenging ("Let's examine that thought...")
- Urge surfing ("Let's ride this craving wave together...")
- 5-4-3-2-1 grounding ("Name 5 things you can see...")
- Deep breathing exercises
- Motivational interviewing reflections
- Gratitude practice
- Relapse prevention planning language

CRISIS DETECTION — Flag immediately if user mentions:
- Active suicidal ideation or self-harm
- Overdose (current or recent)
- Severe withdrawal symptoms (seizure, hallucinations, extreme tremor)
- Immediate danger to self or others
- Relapse with dangerous substances (opioids + alcohol, injectable drugs)

When crisis detected, respond with:
1. Empathetic acknowledgment
2. "I want to make sure you're safe. I'm going to connect you with someone who can help right now."
3. Set crisis_detected=true in response metadata

CONTEXT:
- Patient name: {first_name}
- Recovery day count: {days_sober}
- Primary substance(s): {substances}
- Current risk level: {risk_level}
- Recent mood trend: {mood_trend}
- Recovery plan stage: {current_stage}
- Last appointment: {last_appointment_date}
- Recent journal entries (last 3): {recent_entries_summary}
```

**Service methods:**

| Method | Description |
|--------|-------------|
| `startConversation(userId)` | Creates a new journal entry of type `companion_chat`. Loads patient context (recovery profile, recent journals, risk level, sobriety count). Returns greeting message tailored to time of day and current risk level. |
| `sendMessage(journalId, message, userId)` | Appends user message to conversation. Calls Claude with full conversation + system context. Parses response for crisis flags. Appends assistant response. If `crisis_detected`, auto-triggers `CrisisInterventionService.initiatecrisis()`. Returns response + metadata. |
| `endConversation(journalId)` | Generates conversation summary via Claude. Updates journal entry. Extracts structured data (mood score, craving intensity, techniques used). Feeds data into relapse risk engine. |
| `getDailyCheckInPrompt(userId)` | Returns a personalised daily check-in prompt based on recovery stage, recent trends, and time since last check-in. |
| `runCBTExercise(userId, exerciseType)` | Guides user through a structured CBT exercise (thought record, behavioral activation, exposure hierarchy). Step-by-step, Claude-facilitated. |
| `getGuidedMeditation(userId, durationMinutes)` | Returns a text-based guided meditation/mindfulness script personalised to recovery context. |

### 3.4 Craving Management Exercises

**Built-in structured exercises** (not free-form chat):

1. **Urge Surfing** — 5-minute guided exercise. User rates craving 0-10, guided through observing the urge without acting, re-rates at end. Stored as structured data.
2. **5-4-3-2-1 Grounding** — Name 5 things you see, 4 you hear, 3 you touch, 2 you smell, 1 you taste. Interactive step-by-step.
3. **Thought Challenge** — CBT thought record. Identify automatic thought → evidence for → evidence against → balanced thought. Claude assists in reframing.
4. **HALT Check** — Hungry? Angry? Lonely? Tired? Quick check-in to identify unmet needs driving craving.
5. **Play the Tape Forward** — Guided visualization of consequences of using vs. staying sober. Claude generates personalised scenario based on patient's history.

### 3.5 Rate Limiting & Safety

- Max 20 companion messages per day (prevent dependency on AI over human support)
- Cooldown period after crisis detection (companion locked for 1 hour, redirects to crisis resources)
- All conversations logged and accessible to treating specialist (with patient consent)
- Disclaimer shown before first use: "This is a support tool, not a substitute for professional treatment"
- No conversation history shared across users (strict data isolation)

---

## 4. Pillar 3: Smart MAT Management

### 4.1 MAT Protocol Service

**File**: `recovery/services/mat-protocol.service.ts`

Manages Medication-Assisted Treatment protocols for three primary medications:

#### Supported MAT Medications
1. **Buprenorphine** (Subutex/Suboxone) — Schedule III, sublingual, for opioid use disorder
2. **Methadone** — Schedule II, oral, for opioid use disorder (specialist clinic only)
3. **Naltrexone** (Vivitrol) — Non-controlled, oral or injectable, for alcohol and opioid use disorder
4. **Acamprosate** (Campral) — Non-controlled, oral, for alcohol use disorder
5. **Disulfiram** (Antabuse) — Non-controlled, oral, alcohol deterrent
6. **Varenicline** (Champix) — Non-controlled, oral, smoking cessation
7. **Nicotine Replacement Therapy** — OTC_RESTRICTED, various forms

### 4.2 Drug Entity Modifications

**File**: `RC-Backend/src/modules/pharmacy/entities/drug.entity.ts` — ADD:

```typescript
// MAT-specific fields
@Prop({ type: Boolean, default: false })
is_mat_medication: boolean;

@Prop({ type: mongoose.Schema.Types.Mixed })
mat_protocol: {
  target_condition: string[];           // ['opioid_use_disorder', 'alcohol_use_disorder', 'tobacco_use_disorder']
  induction_dose: string;               // Starting dose
  maintenance_dose_range: string;       // e.g., "8-24mg/day"
  max_dose: string;
  tapering_schedule: Array<{
    phase: string;                      // 'induction' | 'stabilization' | 'maintenance' | 'taper'
    duration_weeks: number;
    dose_range: string;
    adjustment_criteria: string;
  }>;
  monitoring_requirements: {
    required_screenings: string[];      // ['urine_drug_screen', 'liver_function', 'ekg']
    screening_frequency: string;        // 'weekly' | 'biweekly' | 'monthly'
    required_counseling: boolean;
    min_counseling_frequency: string;
  };
  contraindications: string[];
  requires_observed_dosing: boolean;    // Methadone: true initially
  naloxone_coprescribe: boolean;        // Auto-suggest naloxone
};
```

### 4.3 MAT Prescription Enhancements

**Modifications to `specialist-prescription.service.ts`:**

Add a `createMATPrescription()` method that wraps `createPrescription()` with:

1. **Specialist verification** — Only specialists with `addiction_medicine`, `psychiatry`, or `addiction_counselor` categories can prescribe MAT. For buprenorphine: specialist must have a waiver flag (`specialist.mat_waiver = true`).
2. **Patient enrollment check** — Patient must have an active RecoveryProfile with the relevant substance use disorder documented.
3. **Screening compliance** — Patient must have a recent addiction screening (within 30 days) showing the targeted substance.
4. **Tapering schedule auto-generation** — Based on medication and patient context, auto-populate `days_supply`, `refill_count`, and `next_refill_date` per MAT protocol.
5. **Naloxone co-prescribing** — If prescribing opioid MAT (buprenorphine, methadone), auto-suggest naloxone (nasal or injectable) as an additional item. Specialist can accept/decline. Log decision.
6. **Drug interaction check** — Force-run `DrugInteractionService.checkInteractions()` before MAT prescription creation. Hard block for critical interactions (benzodiazepines + methadone).
7. **Treatment agreement** — Generate a treatment agreement document (PDF) that patient must acknowledge. Stored in `shared_documents`.

### 4.4 MAT Refill Gating

**Modifications to `refill.service.ts`:**

Add MAT-specific compliance checks before allowing refill:

```typescript
async checkMATRefillEligibility(prescriptionId: string, userId: string): Promise<{
  eligible: boolean;
  blockers: string[];
  warnings: string[];
}> {
  const blockers = [];
  const warnings = [];

  // 1. Standard refill eligibility checks (existing)
  const baseEligibility = await this.checkRefillEligibility(prescriptionId);
  if (!baseEligibility.eligible) return baseEligibility;

  // 2. Appointment attendance — must have attended at least one appointment
  //    since last refill date
  const lastRefillDate = prescription.last_fill_date;
  const appointments = await this.appointmentModel.find({
    patient: userId,
    status: 'COMPLETED',
    start_time: { $gte: lastRefillDate },
    category: { $in: ['Addiction Medicine', 'Psychiatry', 'Addiction Counseling'] }
  });
  if (appointments.length === 0) {
    blockers.push('No completed addiction specialist appointment since last refill');
  }

  // 3. Screening compliance — must have a screening within the protocol's frequency
  const protocol = drug.mat_protocol;
  if (protocol?.monitoring_requirements?.required_screenings) {
    const lastScreening = await this.screeningModel.findOne({
      user: userId,
      created_at: { $gte: lastRefillDate }
    }).sort({ created_at: -1 });

    if (!lastScreening) {
      warnings.push('No addiction screening since last refill — screening recommended');
    }
  }

  // 4. Sobriety log compliance — must have logged at least 50% of days since last refill
  const daysSinceRefill = daysBetween(lastRefillDate, new Date());
  const logCount = await this.sobrietyLogModel.countDocuments({
    user: userId,
    created_at: { $gte: lastRefillDate }
  });
  if (logCount / daysSinceRefill < 0.5) {
    warnings.push('Low daily check-in compliance — recommend discussion with specialist');
  }

  // 5. No active crisis events since last refill (blocker if unresolved)
  const unresolvedCrisis = await this.crisisModel.findOne({
    user: userId,
    status: { $ne: 'resolved' },
    created_at: { $gte: lastRefillDate }
  });
  if (unresolvedCrisis) {
    blockers.push('Unresolved crisis event — specialist review required before refill');
  }

  return {
    eligible: blockers.length === 0,
    blockers,
    warnings
  };
}
```

### 4.5 Abuse Prevention Enhancements

**Modifications to `abuse-prevention.service.ts`:**

1. **MAT Exemption** — MAT medications should NOT be blocked by standard controlled substance limits. If `drug.is_mat_medication === true` AND the patient has an active MAT prescription from a verified specialist, bypass the per-period quantity limit.

2. **Cross-Patient Monitoring** — New method `checkCrossPatientPatterns()` that queries:
   - Same drug prescribed by multiple specialists to same patient in rolling 90 days
   - Same controlled substance dispensed from multiple pharmacies
   - Escalating dose pattern (refill doses increasing without documented reason)

3. **Suspicious Activity DB Logging** — Replace the TODO `logSuspiciousActivity()` with actual DB persistence:
   ```typescript
   // New entity: suspicious_activity_logs
   {
     patient_id, drug_id, specialist_id, pharmacy_id,
     activity_type: 'quantity_exceeded' | 'frequency_exceeded' | 'multi_prescriber' | 'multi_pharmacy' | 'dose_escalation' | 'early_refill',
     severity: 'low' | 'medium' | 'high' | 'critical',
     details: Record<string, any>,
     admin_notified: boolean,
     reviewed_by: ObjectId,
     reviewed_at: Date,
     resolution: string,
     created_at: Date
   }
   ```

4. **Admin Notification** — On high/critical severity, emit notification via `NotificationOrchestratorService` to all admins.

---

## 5. Pillar 4: Predictive Relapse Risk Engine

### 5.1 Relapse Risk Service

**File**: `recovery/services/relapse-risk.service.ts`

Calculates a daily **Recovery Risk Score** (0-100, where 0 = lowest risk, 100 = highest risk) by combining multiple signal categories.

### 5.2 Signal Categories & Weights

```typescript
interface RiskSignalConfig {
  category: string;
  weight: number;        // 0-1, all weights sum to 1.0
  signals: SignalDefinition[];
}

const RISK_SIGNAL_CONFIG: RiskSignalConfig[] = [
  {
    category: 'physiological',
    weight: 0.25,
    signals: [
      { id: 'sleep_disruption', source: 'vitals', description: 'Sleep hours deviation from 7-day average', threshold: { warning: 1.5, critical: 3.0 } },
      { id: 'resting_hr_elevation', source: 'vitals', description: 'Resting HR above personal baseline', threshold: { warning: 10, critical: 20 } },
      { id: 'hrv_drop', source: 'wearable', description: 'HRV decrease from 7-day average', threshold: { warning: 15, critical: 30 } },
      { id: 'stress_level_elevation', source: 'vitals', description: 'Reported or device stress level', threshold: { warning: 6, critical: 8 } },
      { id: 'activity_drop', source: 'vitals', description: 'Steps/active minutes below 7-day average', threshold: { warning: 0.5, critical: 0.25 } },
      { id: 'spo2_anomaly', source: 'vitals', description: 'SpO2 below normal (opioid-specific)', threshold: { warning: 94, critical: 90 } },
    ]
  },
  {
    category: 'behavioral',
    weight: 0.30,
    signals: [
      { id: 'missed_checkin', source: 'sobriety_log', description: 'Days since last daily check-in', threshold: { warning: 2, critical: 4 } },
      { id: 'missed_appointment', source: 'appointments', description: 'Missed recovery appointment', threshold: { warning: 1, critical: 2 } },
      { id: 'messaging_silence', source: 'messaging', description: 'Days since last message to counselor/peer', threshold: { warning: 5, critical: 10 } },
      { id: 'app_disengagement', source: 'app_usage', description: 'Days since last app login', threshold: { warning: 3, critical: 7 } },
      { id: 'late_night_activity', source: 'app_usage', description: 'App usage between midnight-4am', threshold: { warning: 2, critical: 4 } },
      { id: 'medication_nonadherence', source: 'reminders', description: 'Missed medication confirmations', threshold: { warning: 2, critical: 5 } },
    ]
  },
  {
    category: 'self_reported',
    weight: 0.30,
    signals: [
      { id: 'craving_intensity', source: 'journal', description: 'Average craving score (0-10) over 3 days', threshold: { warning: 5, critical: 7 } },
      { id: 'mood_decline', source: 'journal', description: 'Mood score decline from 7-day average', threshold: { warning: 2, critical: 4 } },
      { id: 'trigger_exposure', source: 'journal', description: 'Reports of trigger exposure', threshold: { warning: 1, critical: 3 } },
      { id: 'negative_sentiment', source: 'companion', description: 'AI-detected negative sentiment trend in companion chats', threshold: { warning: 0.6, critical: 0.8 } },
      { id: 'hopelessness_language', source: 'companion', description: 'Claude-detected hopelessness/giving-up language', threshold: { warning: true, critical: true } },
    ]
  },
  {
    category: 'contextual',
    weight: 0.15,
    signals: [
      { id: 'recovery_stage', source: 'recovery_plan', description: 'Early recovery (<90 days) = higher base risk', threshold: { warning: 30, critical: 7 } },
      { id: 'recent_life_event', source: 'journal', description: 'Reports of job loss, relationship issue, bereavement', threshold: { warning: 1, critical: 2 } },
      { id: 'anniversary_effect', source: 'profile', description: 'Approaching date of past trauma, significant loss, or previous relapse', threshold: { warning: 7, critical: 3 } },
      { id: 'seasonal_pattern', source: 'historical', description: 'Personal historical relapse patterns by month/season', threshold: { warning: true, critical: true } },
    ]
  }
];
```

### 5.3 Risk Calculation

**Scheduler**: `recovery/schedulers/relapse-risk.scheduler.ts` — Runs daily at 06:00 for all active recovery profiles.

**Also triggered**: on-demand after journal entries, companion chats, or missed check-ins.

```typescript
async calculateDailyRiskScore(userId: string): Promise<RiskScore> {
  const profile = await this.recoveryProfileModel.findOne({ user: userId, status: 'active' });
  if (!profile) return null;

  const signals: CalculatedSignal[] = [];

  // 1. Gather physiological signals
  const vitals = await this.vitalsService.getMostRecentVitals(userId);
  const vitalHistory = await this.getVitalBaselines(userId, 7); // 7-day averages
  // ... calculate each physiological signal against baselines

  // 2. Gather behavioral signals
  const lastCheckIn = await this.sobrietyLogModel.findOne({ user: userId }).sort({ created_at: -1 });
  const missedAppointments = await this.appointmentModel.countDocuments({
    patient: userId, status: 'MISSED',
    start_time: { $gte: subDays(new Date(), 30) }
  });
  // ... calculate each behavioral signal

  // 3. Gather self-reported signals
  const recentJournals = await this.journalModel.find({
    user: userId,
    created_at: { $gte: subDays(new Date(), 3) }
  });
  // ... extract craving intensity, mood trends, triggers

  // 4. Gather contextual signals
  const daysSober = daysBetween(profile.sobriety_start_date, new Date());
  // ... check for anniversaries, seasonal patterns

  // 5. Calculate weighted score
  let totalScore = 0;
  for (const config of RISK_SIGNAL_CONFIG) {
    const categorySignals = signals.filter(s => s.category === config.category);
    const categoryScore = this.calculateCategoryScore(categorySignals);
    totalScore += categoryScore * config.weight;
  }

  // 6. Determine risk level
  const riskLevel = totalScore < 25 ? 'low' : totalScore < 50 ? 'moderate' : totalScore < 75 ? 'high' : 'critical';

  // 7. Save to recovery profile
  await this.recoveryProfileModel.updateOne(
    { user: userId },
    {
      $set: { current_risk_score: totalScore, current_risk_level: riskLevel, risk_updated_at: new Date() },
      $push: { risk_history: { score: totalScore, level: riskLevel, signals, calculated_at: new Date() } }
    }
  );

  // 8. Trigger alerts based on level
  if (riskLevel === 'high') {
    await this.notifySpecialist(userId, totalScore, signals);
  }
  if (riskLevel === 'critical') {
    await this.notifySpecialist(userId, totalScore, signals);
    await this.notifyEmergencyContacts(userId, totalScore);
    await this.notifyPatient(userId, 'Your recovery support team has been notified. Please reach out to your counselor or use the crisis button.');
  }

  return { score: totalScore, level: riskLevel, signals, calculated_at: new Date() };
}
```

### 5.4 Risk Alert Cascade

| Risk Level | Score Range | Actions |
|-----------|-------------|---------|
| **Low** | 0-24 | No action. Daily score visible on patient dashboard. |
| **Moderate** | 25-49 | Patient gets "check in with your counselor" nudge. Specialist sees yellow indicator on patient list. |
| **High** | 50-74 | Specialist gets push notification + email. Patient gets coping exercise suggestion. Admin sees in cohort dashboard. Companion proactively reaches out if patient hasn't used it today. |
| **Critical** | 75-100 | Specialist gets urgent notification. Emergency contacts notified (if patient consented). Crisis intervention flow activated. Admin flagged. |

### 5.5 Controller

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/recovery/risk/current` | Get current risk score + signals |
| `GET` | `/recovery/risk/history` | Get historical risk scores (chart data) |
| `POST` | `/recovery/risk/recalculate` | Force recalculation (specialist only) |
| `GET` | `/recovery/risk/signals` | Get detailed signal breakdown |

---

## 6. Pillar 5: Structured Recovery Programs

### 6.1 Recovery Profile Entity

**File**: `recovery/entities/recovery-profile.entity.ts`

```typescript
@Schema({ timestamps: true, collection: 'recovery_profiles' })
export class RecoveryProfile {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  user: Types.ObjectId;

  @Prop({ required: true, enum: ['active', 'paused', 'completed', 'discharged', 'withdrawn'] })
  status: string;

  // Substance use history
  @Prop({ type: [{ type: mongoose.Schema.Types.Mixed }] })
  substance_use_history: Array<{
    substance: string;             // 'alcohol' | 'opioids' | 'cannabis' | 'cocaine' | 'amphetamines' | 'benzodiazepines' | 'tobacco' | 'other'
    primary: boolean;              // Is this the primary substance?
    age_of_first_use: number;
    years_of_use: number;
    route_of_administration: string; // 'oral' | 'nasal' | 'injection' | 'smoking' | 'topical'
    frequency_at_peak: string;     // 'daily' | 'weekly' | 'monthly' | 'occasional'
    last_use_date: Date;
    quantity_at_peak: string;      // Free text: "1 bottle of vodka/day", "2g cocaine/week"
    previous_treatment_attempts: number;
    previous_treatment_types: string[];  // 'inpatient', 'outpatient', 'detox', '12_step', 'medication', 'counseling'
  }>;

  // Sobriety tracking
  @Prop({ type: Date })
  sobriety_start_date: Date;       // Current sobriety start

  @Prop({ type: Number, default: 0 })
  longest_sobriety_days: number;

  @Prop({ type: [Date] })
  relapse_dates: Date[];           // Historical relapse dates

  @Prop({ type: Number, default: 0 })
  total_relapse_count: number;

  // Program enrollment
  @Prop({ type: Date })
  enrolled_at: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  enrolled_by: Types.ObjectId;     // Specialist who enrolled the patient

  @Prop({ type: Types.ObjectId, ref: 'RecoveryPlan' })
  current_plan: Types.ObjectId;

  // Care team
  @Prop({ type: [{ type: mongoose.Schema.Types.Mixed }] })
  care_team: Array<{
    user: Types.ObjectId;          // Specialist or Peer Supporter
    role: string;                  // 'primary_counselor' | 'psychiatrist' | 'peer_supporter' | 'gp' | 'pharmacist'
    assigned_at: Date;
    is_active: boolean;
  }>;

  // Risk tracking (updated by relapse risk engine)
  @Prop({ type: Number, default: 0 })
  current_risk_score: number;

  @Prop({ type: String, enum: ['low', 'moderate', 'high', 'critical'], default: 'low' })
  current_risk_level: string;

  @Prop({ type: Date })
  risk_updated_at: Date;

  @Prop({ type: [{ type: mongoose.Schema.Types.Mixed }] })
  risk_history: Array<{
    score: number;
    level: string;
    calculated_at: Date;
    signals: any[];
  }>;

  // Consent & privacy
  @Prop({ type: mongoose.Schema.Types.Mixed })
  consent: {
    treatment_consent: { given: boolean; date: Date; ip_address: string };
    data_sharing_consent: { given: boolean; date: Date; share_with: string[] };  // Which care team members can see what
    emergency_contact_consent: { given: boolean; date: Date };
    wearable_monitoring_consent: { given: boolean; date: Date };
    ai_companion_consent: { given: boolean; date: Date };
    research_consent: { given: boolean; date: Date };  // For anonymised grant reporting
  };

  // Baseline screenings
  @Prop({ type: Types.ObjectId, ref: 'AddictionScreening' })
  baseline_screening: Types.ObjectId;

  // Outcome tracking (for grant reporting)
  @Prop({ type: mongoose.Schema.Types.Mixed })
  outcomes: {
    screening_score_at_enrollment: number;
    screening_score_current: number;
    days_in_program: number;
    appointments_attended: number;
    appointments_missed: number;
    journal_entries_count: number;
    companion_sessions_count: number;
    milestones_achieved: number;
    medications_prescribed: string[];
    care_level: string;           // 'detox' | 'intensive_outpatient' | 'outpatient' | 'aftercare' | 'maintenance'
  };
}
```

### 6.2 Recovery Plan Entity

**File**: `recovery/entities/recovery-plan.entity.ts`

```typescript
@Schema({ timestamps: true, collection: 'recovery_plans' })
export class RecoveryPlan {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  created_by: Types.ObjectId;     // Specialist who created the plan

  @Prop({ required: true })
  plan_name: string;

  @Prop({ required: true, enum: ['draft', 'active', 'completed', 'revised', 'abandoned'] })
  status: string;

  // Treatment stages
  @Prop({ type: [{ type: mongoose.Schema.Types.Mixed }] })
  stages: Array<{
    stage_id: string;
    name: string;                  // 'assessment' | 'detox' | 'stabilization' | 'active_treatment' | 'maintenance' | 'aftercare'
    order: number;
    status: string;                // 'pending' | 'in_progress' | 'completed' | 'skipped'
    started_at: Date;
    completed_at: Date;
    estimated_duration_weeks: number;
    goals: Array<{
      goal_id: string;
      description: string;
      measurable_target: string;   // e.g., "Attend 4 counseling sessions", "30 days continuous sobriety"
      status: string;              // 'pending' | 'in_progress' | 'achieved' | 'not_achieved'
      target_date: Date;
      achieved_at: Date;
      evidence: string;            // How achievement was verified
    }>;
    interventions: Array<{
      type: string;                // 'individual_therapy' | 'group_therapy' | 'medication' | 'peer_support' | 'family_therapy' | 'psychoeducation'
      description: string;
      frequency: string;           // 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'as_needed'
      assigned_to: Types.ObjectId; // Specialist responsible
    }>;
  }>;

  // Relapse prevention plan (patient-written with specialist guidance)
  @Prop({ type: mongoose.Schema.Types.Mixed })
  relapse_prevention: {
    personal_triggers: string[];
    warning_signs: string[];
    coping_strategies: string[];
    support_contacts: Array<{ name: string; phone: string; role: string }>;
    safe_activities: string[];
    emergency_plan: string;        // What to do if relapse occurs
    high_risk_situations: Array<{ situation: string; plan: string }>;
  };

  // Review schedule
  @Prop({ type: Date })
  next_review_date: Date;

  @Prop({ type: Number, default: 0 })
  revision_number: number;

  @Prop({ type: Types.ObjectId, ref: 'RecoveryPlan' })
  previous_version: Types.ObjectId;

  // AI-generated plan option
  @Prop({ type: mongoose.Schema.Types.Mixed })
  ai_generated_plan: {
    generated_at: Date;
    model: string;
    input_context: string;
    was_accepted: boolean;
    specialist_modifications: string[];
  };
}
```

### 6.3 Sobriety Log Entity

**File**: `recovery/entities/sobriety-log.entity.ts`

```typescript
@Schema({ timestamps: true, collection: 'sobriety_logs' })
export class SobrietyLog {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  user: Types.ObjectId;

  @Prop({ type: Date, required: true })
  log_date: Date;                  // The day this log represents (one per day)

  @Prop({ type: Boolean, required: true })
  sober_today: boolean;

  @Prop({ type: Number, min: 1, max: 10 })
  mood_score: number;

  @Prop({ type: Number, min: 0, max: 10 })
  craving_intensity: number;       // 0 = no craving

  @Prop({ type: [String] })
  substances_craved: string[];

  @Prop({ type: Number, min: 1, max: 10 })
  energy_level: number;

  @Prop({ type: Number, min: 1, max: 10 })
  sleep_quality: number;

  @Prop({ type: Number })
  sleep_hours: number;

  @Prop({ type: Number, min: 1, max: 10 })
  anxiety_level: number;

  @Prop({ type: [String] })
  triggers_encountered: string[];  // From predefined list + custom

  @Prop({ type: [String] })
  coping_strategies_used: string[];

  @Prop({ type: Boolean })
  medications_taken: boolean;

  @Prop({ type: Boolean })
  attended_meeting_or_session: boolean;

  @Prop({ type: Boolean })
  exercised: boolean;

  @Prop({ type: String })
  gratitude_note: string;          // "One thing I'm grateful for today"

  @Prop({ type: String })
  notes: string;                   // Free-form daily reflection

  // If relapse occurred
  @Prop({ type: mongoose.Schema.Types.Mixed })
  relapse_details: {
    substance: string;
    amount: string;
    trigger: string;
    location: string;
    was_planned: boolean;
    sought_help_after: boolean;
    notes: string;
  };
}
```

### 6.4 Recovery Milestone Entity

**File**: `recovery/entities/recovery-milestone.entity.ts`

```typescript
@Schema({ timestamps: true, collection: 'recovery_milestones' })
export class RecoveryMilestone {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ required: true })
  milestone_type: string;          // 'sobriety_days' | 'screening_improvement' | 'goals_achieved' | 'journal_streak' | 'appointment_streak' | 'companion_sessions' | 'exercise_streak' | 'custom'

  @Prop({ required: true })
  milestone_name: string;          // e.g., "30 Days Sober", "First Screening Improvement"

  @Prop({ type: String })
  description: string;

  @Prop({ type: Number })
  milestone_value: number;         // e.g., 30 (days), 5 (improvement points)

  @Prop({ type: Date, required: true })
  achieved_at: Date;

  @Prop({ type: Boolean, default: false })
  celebrated: boolean;             // User has acknowledged the milestone

  @Prop({ type: Number, default: 0 })
  reward_points: number;

  @Prop({ type: Boolean, default: false })
  shared_with_care_team: boolean;
}
```

**Milestone definitions** (in `constants/milestone-definitions.ts`):

```typescript
export const SOBRIETY_MILESTONES = [
  { days: 1, name: '24 Hours', points: 10, message: 'The hardest day is day one. You did it.' },
  { days: 3, name: '72 Hours', points: 20, message: 'The worst of physical withdrawal is often behind you.' },
  { days: 7, name: 'One Week', points: 50, message: 'A full week. Your body is already healing.' },
  { days: 14, name: 'Two Weeks', points: 75, message: 'Two weeks strong. Sleep and appetite are normalising.' },
  { days: 30, name: 'One Month', points: 150, message: 'One month. Brain chemistry is beginning to rebalance.' },
  { days: 60, name: 'Two Months', points: 200, message: 'Two months. You're building new neural pathways.' },
  { days: 90, name: 'Three Months', points: 300, message: 'Ninety days. A major milestone in any recovery program.' },
  { days: 180, name: 'Six Months', points: 500, message: 'Half a year. Relapse risk decreases significantly from here.' },
  { days: 365, name: 'One Year', points: 1000, message: 'One full year. You've proven it's possible.' },
  { days: 730, name: 'Two Years', points: 2000, message: 'Two years. Recovery is becoming your way of life.' },
];

export const ENGAGEMENT_MILESTONES = [
  { type: 'journal_streak', value: 7, name: '7-Day Journal Streak', points: 25 },
  { type: 'journal_streak', value: 30, name: '30-Day Journal Streak', points: 100 },
  { type: 'appointment_streak', value: 4, name: '4 Consecutive Appointments', points: 50 },
  { type: 'companion_sessions', value: 10, name: '10 Companion Sessions', points: 30 },
  { type: 'exercise_streak', value: 7, name: '7-Day Exercise Streak', points: 40 },
  { type: 'screening_improvement', value: 5, name: 'Screening Score Improved by 5+', points: 75 },
];
```

### 6.5 Group Session Entity

**File**: `recovery/entities/group-session.entity.ts`

```typescript
@Schema({ timestamps: true, collection: 'group_sessions' })
export class GroupSession {
  @Prop({ required: true })
  session_name: string;            // "Monday Evening Recovery Group"

  @Prop({ required: true, enum: ['open', 'closed', 'drop_in'] })
  group_type: string;              // open = new members anytime, closed = fixed cohort, drop_in = optional attendance

  @Prop({ required: true, enum: [
    'general_recovery', 'alcohol_specific', 'opioid_specific', 'stimulant_specific',
    'dual_diagnosis', 'relapse_prevention', 'family_support', 'cbt_skills',
    'mindfulness', 'anger_management', 'grief_and_loss', 'early_recovery'
  ]})
  session_category: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  facilitator: Types.ObjectId;     // Specialist leading the group

  @Prop({ type: Types.ObjectId, ref: 'User' })
  co_facilitator: Types.ObjectId;

  @Prop({ type: Number, required: true, min: 2, max: 20 })
  max_participants: number;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }] })
  enrolled_participants: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'Appointment' })
  appointment: Types.ObjectId;     // Links to the calendar appointment

  @Prop({ type: mongoose.Schema.Types.Mixed })
  recurring: {
    is_recurring: boolean;
    frequency: string;             // 'daily' | 'weekly' | 'biweekly' | 'monthly'
    day_of_week: number;           // 0-6, for weekly
    time: string;                  // "18:00"
    timezone: string;
    series_end_date: Date;
    occurrence_count: number;
  };

  @Prop({ type: mongoose.Schema.Types.Mixed })
  session_notes: {                 // Facilitator's notes post-session
    topics_covered: string[];
    group_dynamics: string;
    individual_observations: Array<{
      participant: Types.ObjectId;
      observation: string;
      flag_for_followup: boolean;
    }>;
    homework_assigned: string;
  };

  @Prop({ type: String, enum: ['scheduled', 'in_progress', 'completed', 'cancelled'] })
  status: string;

  @Prop({ type: [{ type: mongoose.Schema.Types.Mixed }] })
  attendance: Array<{
    participant: Types.ObjectId;
    attended: boolean;
    joined_at: Date;
    left_at: Date;
    reason_absent: string;
  }>;

  // Anonymity settings
  @Prop({ type: Boolean, default: false })
  anonymous_mode: boolean;         // Participants only see first name + last initial

  @Prop({ type: Boolean, default: false })
  recording_disabled: boolean;     // Override Zoom recording for group confidentiality
}
```

### 6.6 Peer Support Assignment Entity

**File**: `recovery/entities/peer-assignment.entity.ts`

```typescript
@Schema({ timestamps: true, collection: 'peer_assignments' })
export class PeerAssignment {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  patient: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  peer_supporter: Types.ObjectId;  // A specialist with 'Peer Support Specialist' category

  @Prop({ type: Types.ObjectId, ref: 'User' })
  assigned_by: Types.ObjectId;     // Specialist who made the assignment

  @Prop({ required: true, enum: ['pending', 'active', 'paused', 'ended'] })
  status: string;

  @Prop({ type: Date })
  started_at: Date;

  @Prop({ type: Date })
  ended_at: Date;

  @Prop({ type: String })
  end_reason: string;

  // Matching criteria (used by auto-matching)
  @Prop({ type: mongoose.Schema.Types.Mixed })
  match_criteria: {
    shared_substance: string;      // Primary substance in common
    age_proximity: number;         // Age difference
    gender_match: boolean;
    language_match: boolean;
    match_score: number;           // 0-100 auto-calculated compatibility
  };

  // Check-in tracking
  @Prop({ type: mongoose.Schema.Types.Mixed })
  check_in_schedule: {
    frequency: string;             // 'daily' | 'every_other_day' | 'weekly'
    preferred_time: string;
    preferred_channel: string;     // 'messaging' | 'voice_note' | 'video' | 'phone'
    last_check_in: Date;
    missed_check_ins: number;
  };

  // Consent
  @Prop({ type: Date })
  patient_consent_date: Date;

  @Prop({ type: Date })
  peer_consent_date: Date;
}
```

### 6.7 Specialist Categories to Add

Add via seed script or admin panel:

```typescript
const RECOVERY_SPECIALIST_CATEGORIES = [
  { name: 'Addiction Medicine Specialist', slug: 'addiction-medicine', professional_category: 'Specialist', icon: 'fa-heartbeat' },
  { name: 'Addiction Counselor', slug: 'addiction-counselor', professional_category: 'Therapist', icon: 'fa-comments' },
  { name: 'Addiction Psychiatrist', slug: 'addiction-psychiatrist', professional_category: 'Specialist', icon: 'fa-brain' },
  { name: 'Peer Recovery Specialist', slug: 'peer-recovery-specialist', professional_category: 'Specialist', icon: 'fa-hands-helping' },
  { name: 'Clinical Psychologist (Addiction)', slug: 'addiction-psychologist', professional_category: 'Therapist', icon: 'fa-user-md' },
  { name: 'Detox Specialist', slug: 'detox-specialist', professional_category: 'Specialist', icon: 'fa-procedures' },
  { name: 'Family Therapist (Addiction)', slug: 'addiction-family-therapist', professional_category: 'Therapist', icon: 'fa-users' },
];
```

---

## 7. Pillar 6: Harm Reduction Toolkit

### 7.1 Harm Reduction Service

**File**: `recovery/services/harm-reduction.service.ts`

| Method | Description |
|--------|-------------|
| `getNearestNaloxoneLocations(lat, lng, radius)` | Queries NHS API or a curated database of UK pharmacies participating in naloxone distribution schemes. Returns sorted by distance. |
| `getNeedleExchangeLocations(lat, lng, radius)` | Queries curated database of UK needle/syringe exchange programmes. |
| `getSafeUseGuidance(substance)` | Returns evidence-based harm reduction guidance per substance (dosing safety, mixing dangers, overdose signs, when to call 999). |
| `getOverdoseResponseGuide(substance)` | Step-by-step first responder guide: recognise signs → call 999 → administer naloxone → recovery position. |
| `checkWearableForOverdoseSignals(userId)` | Real-time check: SpO2 < 90% AND respiratory rate < 8/min AND no movement for 5+ min → EMERGENCY alert. |
| `triggerEmergencyAlert(userId, reason)` | Multi-channel alert: push notification to emergency contacts, auto-dial option for 999, send GPS location. |
| `getDrugCheckingServices(lat, lng)` | UK drug checking services (e.g., The Loop). |
| `getFentanylTestStripInfo()` | Information on fentanyl test strips (availability, usage instructions). |

### 7.2 Overdose Detection via Wearables

**Integration with existing wearable module** — add a real-time monitoring layer:

```typescript
// In health-integrations service, add a post-sync hook:
async checkCriticalVitals(userId: string, dataType: string, value: any): Promise<void> {
  const profile = await this.recoveryProfileModel.findOne({ user: userId, status: 'active' });
  if (!profile) return; // Only monitor recovery patients

  const primarySubstance = profile.substance_use_history.find(s => s.primary)?.substance;

  // Opioid-specific monitoring
  if (['opioids'].includes(primarySubstance)) {
    if (dataType === 'oxygen_saturation' && parseFloat(value.primary) < 92) {
      await this.harmReductionService.triggerOpioidOverdoseProtocol(userId, value);
    }
    if (dataType === 'respiratory_rate' && parseFloat(value.primary) < 10) {
      await this.harmReductionService.triggerOpioidOverdoseProtocol(userId, value);
    }
  }

  // Alcohol-specific monitoring
  if (['alcohol'].includes(primarySubstance)) {
    if (dataType === 'heart_rate' && parseFloat(value.primary) > 130) {
      await this.harmReductionService.triggerAlcoholWithdrawalAlert(userId, value);
    }
  }

  // Universal: activity/motion detection
  if (dataType === 'steps') {
    // If wearable reports 0 steps for 6+ hours during waking hours (06:00-22:00) → wellness check
    await this.harmReductionService.checkInactivityPattern(userId);
  }
}
```

### 7.3 Emergency Contact System

**Modifications to User entity** — add recovery-specific emergency fields:

```typescript
@Prop({ type: mongoose.Schema.Types.Mixed })
recovery_emergency_config: {
  naloxone_carrier: boolean;       // Does this person carry naloxone?
  trained_in_naloxone_use: boolean;
  notify_on_risk_level: string;    // 'high' | 'critical' — when to notify
  preferred_contact_method: string; // 'sms' | 'call' | 'whatsapp'
  auto_share_location: boolean;
};
```

### 7.4 Harm Reduction Content

Curated, evidence-based content stored as structured data:

```typescript
const HARM_REDUCTION_CONTENT = {
  alcohol: {
    safer_use: [...],              // Unit tracking, spacing drinks, eating before drinking
    overdose_signs: [...],         // Confusion, vomiting, seizures, slow breathing, pale/blue skin
    mixing_dangers: [...],         // Alcohol + benzodiazepines, alcohol + opioids
    withdrawal_warning: '...',     // "Alcohol withdrawal can be life-threatening. Never stop suddenly if dependent."
  },
  opioids: {
    safer_use: [...],
    overdose_signs: [...],         // Pinpoint pupils, blue lips, gurgling, unresponsive
    naloxone_guide: '...',
    mixing_dangers: [...],         // Opioids + benzodiazepines (respiratory depression), opioids + alcohol
    fentanyl_warning: '...',
  },
  stimulants: {
    safer_use: [...],
    overdose_signs: [...],         // Chest pain, seizures, overheating, paranoia
    comedown_care: [...],
  },
  cannabis: {
    safer_use: [...],
    dependence_signs: [...],
  },
  // etc. for each substance category
};
```

---

## 8. Shared Infrastructure Changes

### 8.1 User Entity Modifications

**Add to `user.entity.ts`:**

```typescript
// Recovery-specific fields
@Prop({ type: Types.ObjectId, ref: 'RecoveryProfile' })
recovery_profile: Types.ObjectId;

@Prop({ type: String, enum: ['none', 'enrolled', 'active', 'in_recovery', 'graduated', 'paused'] })
recovery_status: string;

@Prop({ type: mongoose.Schema.Types.Mixed })
recovery_emergency_config: { /* as defined above */ };

// Specialist: MAT prescribing authorization
@Prop({ type: Boolean, default: false })
mat_waiver: boolean;               // Authorized to prescribe MAT
```

### 8.2 Vitals Entity Modifications

**Add new time-series fields to `vital.entity.ts`:**

```typescript
@Prop({ type: [{ value: String, unit: String, updatedAt: Date }] })
craving_level: VitalEntry[];       // 0-10 scale, from daily check-ins

@Prop({ type: [{ value: String, unit: String, updatedAt: Date }] })
mood_score: VitalEntry[];          // 1-10 scale

@Prop({ type: [{ value: String, unit: String, updatedAt: Date }] })
anxiety_level: VitalEntry[];       // 1-10 scale

@Prop({ type: [{ value: String, unit: String, updatedAt: Date }] })
motivation_level: VitalEntry[];    // 1-10 scale
```

This allows craving/mood data to be charted using the existing `getVitalsChartData()` method with zero changes.

### 8.3 Appointment Entity Modifications

**Add to `appointment.entity.ts`:**

```typescript
@Prop({ type: String, enum: ['individual', 'group', 'crisis', 'peer_check_in', 'family'], default: 'individual' })
session_type: string;

@Prop({ type: Types.ObjectId, ref: 'GroupSession' })
group_session: Types.ObjectId;

@Prop({ type: Number, default: 1 })
max_participants: number;          // >1 for group sessions

@Prop({ type: [{ type: Types.ObjectId, ref: 'User' }] })
group_participants: Types.ObjectId[];

// Add 'CRISIS' to AppointmentUrgency enum
// AppointmentUrgency: ROUTINE | URGENT | CRISIS
```

### 8.4 Rewards Module Enhancement

**Add to `RewardActivity` enum:**

```typescript
enum RewardActivity {
  // Existing
  'Sign up', 'Completed Profile', 'Completed appointment', 'Referral', 'Newsletter Subscription',
  // New recovery activities
  'Sobriety Milestone',
  'Daily Check-in Streak',
  'Screening Completed',
  'Recovery Plan Goal Achieved',
  'Group Session Attended',
  'Companion Session Completed',
  'Journal Entry Streak',
  'Exercise Streak',
  'Peer Check-in Completed',
}
```

### 8.5 Notification Types

**Add to `NotificationType` enum:**

```typescript
// Recovery-specific
'recovery_daily_checkin_reminder',
'recovery_milestone_achieved',
'recovery_screening_due',
'recovery_appointment_reminder',
'recovery_medication_reminder',
'recovery_peer_checkin_due',
'recovery_risk_level_change',
'recovery_crisis_alert',
'recovery_crisis_resolved',
'recovery_companion_prompt',
'recovery_relapse_detected',
'recovery_wearable_alert',
'recovery_group_session_reminder',
'recovery_plan_review_due',
'recovery_mat_refill_eligible',
'recovery_mat_refill_blocked',
```

### 8.6 Reminder Types

Add recovery-specific reminder types to the existing reminders module — no schema change needed since `data` field is `Mixed`. Just use consistent `type` values:

```typescript
// Reminder data.type values:
'recovery_daily_checkin'
'recovery_medication'
'recovery_screening_followup'
'recovery_group_session'
'recovery_peer_checkin'
'recovery_plan_review'
'recovery_mat_appointment'
```

---

## 9. Admin Module Additions

### 9.1 Admin Recovery Dashboard

**New admin module**: `RC_Admin_Backend/src/modules/recovery/`

**Dashboard endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/recovery/metrics` | Total enrolled, active, graduated, relapsed, avg days sober |
| `GET` | `/recovery/cohort` | Cohort view with risk heatmap, filterable by substance/date/status |
| `GET` | `/recovery/risk-overview` | Distribution of patients by risk level (chart data) |
| `GET` | `/recovery/screenings/trends` | Screening completion rates and score trends over time |
| `GET` | `/recovery/milestones/recent` | Recent milestone achievements across all patients |
| `GET` | `/recovery/mat/compliance` | MAT prescription adherence rates |
| `GET` | `/recovery/mat/suspicious-activity` | Suspicious activity logs for controlled substances |
| `GET` | `/recovery/crisis/active` | Active crisis events requiring attention |
| `GET` | `/recovery/crisis/history` | Historical crisis events with resolution data |
| `GET` | `/recovery/group-sessions` | All group sessions with attendance rates |
| `GET` | `/recovery/patient/:id/recovery-profile` | Full recovery profile for a patient |
| `GET` | `/recovery/patient/:id/risk-history` | Risk score history with signal breakdown |
| `GET` | `/recovery/patient/:id/sobriety-timeline` | Full sobriety timeline (clean days, relapses, milestones) |
| `GET` | `/recovery/patient/:id/journal-summary` | AI-generated journal summary for clinical review |
| `GET` | `/recovery/patient/:id/treatment-progress` | Recovery plan progress overview |
| `GET` | `/recovery/outcomes` | Grant reporting data: outcome metrics aggregated |
| `GET` | `/recovery/outcomes/export` | CSV/PDF export of outcome data for grant reporting |

### 9.2 Admin UI Components

**New components in** `RC_Admin_UI/src/components/Recovery/`:

```
RecoveryDashboard.vue          — Main overview with KPIs
RecoveryCohortView.vue         — Filterable patient cohort table with risk indicators
RecoveryPatientProfile.vue     — Recovery-specific patient detail view
RiskHeatmap.vue                — Visual heatmap of cohort risk levels
ScreeningTrends.vue            — Charts of screening scores over time
MATComplianceDashboard.vue     — MAT prescription and refill tracking
CrisisManagement.vue           — Active crisis event management
GroupSessionManagement.vue     — Group session CRUD and attendance
PeerAssignmentManager.vue      — Manage peer-patient pairings
OutcomeReporting.vue           — Grant reporting with exportable data
SuspiciousActivityLog.vue      — Review and resolve flagged activities
```

### 9.3 Admin Patient Profile Extension

Add a **Recovery tab** to the existing patient profile view (`RC_Admin_UI/src/components/PatientProfile/`) that shows:
- Recovery status badge
- Sobriety counter
- Current risk score with trend arrow
- Active recovery plan summary
- Care team list
- Recent screenings with scores
- MAT prescription status
- Milestone timeline
- Quick actions: assign peer, schedule group, trigger screening, adjust risk alert thresholds

---

## 10. Edge Cases & Safety Considerations

### 10.1 Relapse Handling

**Relapse is not failure — the system must handle it non-judgmentally:**

- If patient logs `sober_today: false`, do NOT reset sobriety counter to zero automatically. Instead:
  1. Capture relapse details (substance, amount, trigger, circumstances)
  2. Show compassionate messaging: "Recovery isn't always linear. What matters is what you do next."
  3. Offer immediate resources: companion chat, crisis line, book emergency appointment
  4. Notify care team (counselor, peer supporter) via high-priority notification
  5. Update risk engine with relapse event
  6. Create a new sobriety start date (after specialist review confirms the relapse)
  7. Preserve all historical data (previous sobriety streak stored in `longest_sobriety_days`)
  8. Do NOT automatically change MAT prescription status

### 10.2 Crisis Intervention Flow

**File**: `recovery/entities/crisis-event.entity.ts`

```typescript
@Schema({ timestamps: true, collection: 'crisis_events' })
export class CrisisEvent {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ required: true, enum: [
    'suicidal_ideation', 'overdose_suspected', 'overdose_confirmed',
    'severe_withdrawal', 'relapse_with_danger', 'self_harm',
    'psychotic_episode', 'domestic_violence', 'wearable_alert',
    'patient_initiated', 'companion_detected', 'specialist_initiated'
  ]})
  crisis_type: string;

  @Prop({ required: true, enum: ['active', 'responding', 'stabilized', 'resolved', 'escalated_external'] })
  status: string;

  @Prop({ type: String, enum: ['low', 'medium', 'high', 'life_threatening'] })
  severity: string;

  @Prop({ type: String })
  trigger_source: string;          // 'companion_ai' | 'wearable' | 'self_report' | 'specialist' | 'missed_checkin'

  @Prop({ type: mongoose.Schema.Types.Mixed })
  detection_data: Record<string, any>;  // What triggered the crisis (AI transcript, vital readings, etc.)

  @Prop({ type: [{ type: mongoose.Schema.Types.Mixed }] })
  response_timeline: Array<{
    action: string;                // 'alert_sent' | 'specialist_notified' | 'emergency_contact_called' | '999_directed' | 'patient_responded' | 'specialist_intervened' | 'resolved'
    actor: string;                 // 'system' | userId
    timestamp: Date;
    details: string;
  }>;

  // Who was notified
  @Prop({ type: [{ type: mongoose.Schema.Types.Mixed }] })
  notifications_sent: Array<{
    recipient: Types.ObjectId;
    channel: string;
    sent_at: Date;
    acknowledged_at: Date;
  }>;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  resolved_by: Types.ObjectId;

  @Prop({ type: Date })
  resolved_at: Date;

  @Prop({ type: String })
  resolution_notes: string;

  @Prop({ type: String })
  follow_up_plan: string;

  @Prop({ type: Types.ObjectId, ref: 'Appointment' })
  follow_up_appointment: Types.ObjectId;
}
```

**Crisis flow:**

1. **Detection** — Source can be: AI companion (crisis language), wearable (SpO2/respiratory), patient self-report (crisis button), specialist-initiated, automated (missed check-ins for critical-risk patient)
2. **Immediate response** (< 30 seconds):
   - Show crisis screen to patient with: NHS crisis line (116 123 Samaritans, 999), FRANK helpline (0300 123 6600), local crisis team number
   - Push notification to primary counselor
   - SMS to emergency contacts (if consented)
   - Create CrisisEvent record
3. **Escalation** (if no specialist response within 15 minutes):
   - Notify all care team members
   - Notify admin
   - If overdose suspected and wearable data shows declining SpO2: auto-suggest patient's location to emergency contacts
4. **Stabilization** — Specialist marks crisis as "responding" or "stabilized" via admin/app
5. **Resolution** — Specialist documents resolution, creates follow-up appointment, adjusts recovery plan if needed
6. **Post-crisis** — Automated follow-up check-in 24 hours later, increased companion check-in frequency for 7 days

### 10.3 Multi-Substance Use

- A patient can have multiple substances in `substance_use_history`
- Each substance has its own `last_use_date` and tracking
- Screenings are per-substance (AUDIT for alcohol, DAST for drugs, ASSIST covers all)
- Sobriety tracking can be per-substance or total (patient preference)
- Risk engine considers interactions between substances (polysubstance risk multiplier)
- MAT medications can target different substances simultaneously

### 10.4 Family Involvement

- Use existing `dependants[]` system for family members
- Family therapy sessions use existing appointment + group session infrastructure
- Family members can be granted limited view access to patient's recovery progress (with patient consent)
- Dedicated family psychoeducation content in harm reduction module
- Al-Anon / Nar-Anon meeting directory for family members

### 10.5 Dual Diagnosis (Co-occurring Mental Health)

- Recovery profile captures co-occurring conditions (depression, anxiety, PTSD, bipolar, etc.)
- Screening instruments detect comorbidity indicators (PHQ-9 for depression, GAD-7 for anxiety can be added)
- Treatment plan accommodates dual diagnosis with separate but coordinated interventions
- Medication management considers psychiatric medications alongside MAT
- RxGPT system prompt updated to flag psychiatric medication + substance use interactions

### 10.6 Age-Specific Considerations

- Minimum age: 18 for self-enrollment in recovery program (UK legal age for consent to addiction treatment)
- 16-17 year olds: specialist-enrolled only with parent/guardian consent stored in `consent` object
- Under 16: not eligible (redirect to CAMHS resources)
- Elderly (65+): adjusted risk thresholds for vitals (lower SpO2 threshold, different HR baselines)
- Screening instruments have age-validated cutoffs that are applied automatically

### 10.7 Data Isolation Between Recovery and General Healthcare

- Recovery data (profiles, screenings, journals, companion chats) stored in separate collections
- Access controlled by `RecoveryEnrolledGuard` — only the patient and their assigned care team can access recovery data
- General healthcare features (health checkups, general appointments, pharmacy) remain accessible independently
- A patient can use Rapid Capsule for general healthcare without ever touching the recovery module
- Recovery module is opt-in, not forced

### 10.8 Offline/Low-Connectivity Support

- Daily check-in form works offline (service worker caches the form, syncs when online)
- Crisis button always shows local emergency numbers even without internet
- Companion chat requires internet (Claude API), but cached coping exercises are available offline
- Naloxone finder caches last-known locations locally

### 10.9 Cultural & Linguistic Sensitivity

- All AI prompts (companion, screening interpretation) include cultural sensitivity instructions
- Support for right-to-left languages (existing i18n infrastructure)
- Screening instruments available in validated translations
- Culturally specific recovery resources (faith-based programs, community support)
- Gender-neutral language options throughout

### 10.10 Account Deletion & Data Retention

- Patient can request account deletion per GDPR
- Recovery data retention period: 7 years per NHS records management guidelines for addiction treatment
- On deletion request: data is anonymised (PII stripped) but clinical records retained in anonymised form
- Companion chat transcripts deleted on request (not clinically required)
- Grant reporting data always anonymised at source

---

## 11. Data Privacy & Compliance

### 11.1 UK-Specific Regulatory Compliance

| Regulation | How We Comply |
|-----------|---------------|
| **UK GDPR** | Explicit consent per feature (treatment, data sharing, wearables, AI companion, research). Granular consent stored in `recovery_profile.consent`. Right to access, rectification, erasure. |
| **Data Protection Act 2018** | Health data = special category. Lawful basis: explicit consent (Art 9(2)(a)) + healthcare provision (Art 9(2)(h)). |
| **Caldicott Principles** | Justify purpose, don't use PII unless necessary, minimum necessary access, need-to-know access, duty to share for care. Implemented via `RecoveryEnrolledGuard` + care team access controls. |
| **CQC Standards** (if service is regulated) | Safe, effective, caring, responsive, well-led. Clinical governance via specialist verification + audit logs. |
| **NHS Digital Standards** | DTAC (Digital Technology Assessment Criteria) compliance for NHS integration. |
| **Misuse of Drugs Act 1971** | Controlled substance prescribing per schedule. MAT specialist verification. |
| **Clinical Safety (DCB0129/DCB0160)** | Health IT clinical safety case required. Hazard log for AI features. |

### 11.2 Consent Architecture

**Granular, revocable consent** stored per-feature:

```
treatment_consent           — Required for enrollment
data_sharing_consent        — Controls who sees what (can be per-care-team-member)
emergency_contact_consent   — Required for crisis notifications to contacts
wearable_monitoring_consent — Required for wearable-based alerts
ai_companion_consent        — Required for AI companion feature
research_consent            — Optional, for anonymised grant outcome reporting
```

Each consent records: `given (boolean)`, `date`, `ip_address`, and can be revoked at any time with immediate effect.

### 11.3 Audit Trail

**All recovery module actions are audit-logged:**

- Screening created/submitted/deleted
- Recovery plan created/modified/stage changed
- Sobriety log created
- Journal entry created
- Companion conversation started/ended/crisis detected
- Risk score calculated/alert sent
- Crisis event lifecycle (every action)
- Peer assignment created/ended
- Group session attendance
- MAT prescription lifecycle
- Data access by care team (who viewed what, when)

Use the existing `message-audit-log.entity.ts` pattern but in a new `recovery_audit_logs` collection.

---

## 12. Implementation Phases

### Phase 1: Foundation (Months 1-3) — MVP for Grant Demo

**Priority**: Get screening + basic recovery tracking working end-to-end.

| Week | Deliverable |
|------|------------|
| 1-2 | Recovery module scaffolding (NestJS module, entities, DTOs). RecoveryProfile + AddictionScreening entities. |
| 3-4 | Screening service (AUDIT + CAGE instruments). Scoring engine. Controller + endpoints. |
| 5-6 | Frontend: ScreeningLanding, ScreeningInstrument, ScreeningResults. Integrate with existing health checkup UI pattern. |
| 7-8 | SobrietyLog entity + DailyCheckIn frontend. Sobriety counter. Basic milestone system. |
| 9-10 | Claude AI screening interpretation. Recovery-specific specialist categories seeded. |
| 11-12 | RecoveryPlan entity + PlanOverview frontend. Admin recovery dashboard (basic metrics). |

**Phase 1 Outcome**: Working screening → plan → daily tracking flow. Enough for a grant application demo.

### Phase 2: AI & MAT (Months 4-6)

| Week | Deliverable |
|------|------------|
| 13-14 | Recovery Companion chatbot (Claude integration + journal entity). |
| 15-16 | Companion frontend (CompanionChat.vue). CBT exercise library. |
| 17-18 | MAT drug entity modifications. MAT prescription service. Naloxone co-prescribing. |
| 19-20 | MAT refill gating (appointment compliance + screening compliance checks). |
| 21-22 | DAST-10 + ASSIST instruments added. Withdrawal scales (COWS, CIWA-Ar). |
| 23-24 | Abuse prevention enhancements (cross-patient monitoring, suspicious activity DB logging). |

### Phase 3: Risk Engine & Groups (Months 7-9)

| Week | Deliverable |
|------|------------|
| 25-26 | Relapse risk engine: signal gathering from vitals, journals, appointments. |
| 27-28 | Risk scoring algorithm. Daily scheduler. Alert cascade system. |
| 29-30 | Risk dashboard frontend (patient + specialist + admin views). |
| 31-32 | Group session entity + service. Zoom multi-participant integration. |
| 33-34 | Group session frontend. Session notes for facilitators. |
| 35-36 | Peer assignment system. Auto-matching algorithm. Peer check-in tracking. |

### Phase 4: Harm Reduction & Wearables (Months 10-12)

| Week | Deliverable |
|------|------------|
| 37-38 | Harm reduction content library. Safer use guides per substance. |
| 39-40 | Naloxone finder (NHS pharmacy API integration). Needle exchange directory. |
| 41-42 | Wearable overdose detection (SpO2 + respiratory rate monitoring in existing health integrations). |
| 43-44 | Emergency alert system. Emergency contact notification flow. |
| 45-46 | Crisis event entity + intervention flow. Crisis button UI. |
| 47-48 | Offline support (service worker for daily check-in + crisis numbers). |

### Phase 5: Reporting & Polish (Months 13-18)

| Focus | Deliverable |
|-------|------------|
| Outcome reporting | Grant outcome data aggregation. Export to CSV/PDF. Anonymisation. |
| Admin dashboard | Full recovery admin dashboard with all views. Cohort risk heatmap. |
| Family features | Family therapy sessions. Family member limited access portal. |
| Dual diagnosis | PHQ-9, GAD-7 screening additions. Psychiatric medication interaction checks. |
| Compliance | Clinical safety case (DCB0129). Caldicott audit. DTAC assessment. |
| Testing | Full E2E test suite. Load testing for risk engine scheduler. |
| Documentation | API docs, clinical user guides, patient onboarding materials. |

### Phase 6: Optimization & Scale (Months 19-24)

| Focus | Deliverable |
|-------|------------|
| ML risk model | Replace rule-based risk engine with trained ML model using 12+ months of outcome data. |
| NHS integration | FHIR compatibility for NHS record sharing. GP notification system. |
| Research | Published outcomes data. Clinical validation study design. |
| Accessibility | WCAG 2.1 AA compliance audit. Screen reader optimization. |
| Performance | Redis caching for risk scores. Database indexing optimization. CDN for harm reduction content. |
| Expansion | Additional substance categories. Additional languages. Scotland/Wales NHS API differences. |

---

## Summary: Total Scope

| Category | Count |
|----------|-------|
| New entities (MongoDB collections) | 10 |
| Modified existing entities | 6 |
| New backend services | 13 |
| New backend controllers | 9 |
| New schedulers | 4 |
| New frontend views (patient) | ~25 |
| New admin backend endpoints | ~20 |
| New admin UI components | ~12 |
| New specialist categories | 7 |
| Modified existing services | 5 |
| New notification types | 16 |
| New reward activity types | 9 |
| Screening instruments | 4 (AUDIT, DAST-10, CAGE, ASSIST) |
| Withdrawal scales | 2 (COWS, CIWA-Ar) |
| AI integrations | 3 (screening interpretation, companion chatbot, risk sentiment analysis) |

**Estimated total development effort**: ~18 engineer-months across backend + frontend + admin, well within a 24-month, £1M grant budget that also covers clinical advisory, compliance work, and pilot deployment.
