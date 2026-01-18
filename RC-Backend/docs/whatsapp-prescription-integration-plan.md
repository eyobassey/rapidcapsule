# WhatsApp Prescription Integration - Complete Implementation Plan

## Overview
End-to-end prescription processing via WhatsApp with full regulatory compliance, security controls, and pharmacist oversight.

---

## 1. Identity Binding & Verification

### 1.1 Phone Number Linking Flow
```
FIRST-TIME USER FLOW:

User: Sends message to WhatsApp number
Bot: "Welcome to Rapid Capsule Pharmacy!

      To use our prescription service, I need to verify your identity.

      Do you have an existing Rapid Capsule account?
      [Yes, Link Account] [No, Create Account]"

--- IF EXISTING ACCOUNT ---
User: Taps "Yes, Link Account"
Bot: "Please enter your registered email or phone number:"
User: "eyobassey@gmail.com"
Bot: "I've sent a 6-digit verification code to your email/phone.
      Please enter it here:"
User: "482915"
Bot: "✅ Account linked successfully!

      Hello Bassey! Your WhatsApp is now connected to your
      Rapid Capsule account. You can now:
      • Upload prescriptions
      • Order medications
      • Track orders

      Send 'menu' anytime to see options."

--- IF NEW ACCOUNT ---
User: Taps "No, Create Account"
Bot: "Let's create your account. I'll need some information:

      What's your full name?"
[Collects: name, email, DOB, address]
Bot: "Please verify your email with the code I just sent."
[After verification]
Bot: "✅ Account created and linked!"
```

### 1.2 Identity Binding Schema
```typescript
// New collection: whatsapp_identities
{
  _id: ObjectId,
  whatsapp_number: string,        // E.164 format: +2348012345678
  patient_id: ObjectId,           // Linked User._id

  // Verification
  is_verified: boolean,
  verified_at: Date,
  verification_method: 'OTP_EMAIL' | 'OTP_SMS' | 'EXISTING_SESSION',

  // Security
  is_active: boolean,
  blocked_at: Date,
  blocked_reason: string,
  failed_verification_attempts: number,
  last_failed_attempt: Date,

  // Metadata
  device_info: {
    wa_id: string,
    profile_name: string,
  },

  created_at: Date,
  updated_at: Date,
}

// Index for fast lookup
whatsapp_number: unique index
patient_id: index
```

### 1.3 Re-verification Triggers
- Account linked > 90 days ago → Periodic re-verify
- Suspicious activity detected → Force re-verify
- Patient requests account unlink → Require re-verify to relink
- High-value orders (> ₦50,000) → Step-up authentication

---

## 2. Session Management & Timeout

### 2.1 Session Schema
```typescript
// Collection: whatsapp_sessions
{
  _id: ObjectId,
  whatsapp_number: string,
  patient_id: ObjectId,

  // Conversation State
  current_flow: 'IDLE' | 'PRESCRIPTION_UPLOAD' | 'ORDER_CREATION' |
                'PAYMENT' | 'PHARMACIST_CHAT' | 'SUPPORT',
  flow_step: number,
  flow_data: {
    // Temporary data for current flow
    prescription_id: ObjectId,
    cart_items: [],
    selected_pharmacy: ObjectId,
    delivery_method: string,
    // ... flow-specific data
  },

  // Context
  last_message_at: Date,
  last_bot_message_id: string,
  messages_in_session: number,

  // Security
  session_started_at: Date,
  expires_at: Date,              // Auto-calculated: last_message_at + 30 mins
  is_expired: boolean,

  // Handoff
  assigned_pharmacist: ObjectId,
  handoff_at: Date,
  handoff_reason: string,

  created_at: Date,
  updated_at: Date,
}

// TTL Index - Auto-delete expired sessions after 24 hours
{ expires_at: 1 }, { expireAfterSeconds: 86400 }
```

### 2.2 Session Timeout Logic
```typescript
// Session timeout configuration
const SESSION_CONFIG = {
  IDLE_TIMEOUT_MS: 30 * 60 * 1000,           // 30 minutes
  MAX_SESSION_DURATION_MS: 4 * 60 * 60 * 1000, // 4 hours max
  WARNING_BEFORE_TIMEOUT_MS: 5 * 60 * 1000,   // 5 min warning
};

// On every incoming message:
async function handleSessionTimeout(session: WhatsAppSession) {
  const now = new Date();
  const lastActivity = session.last_message_at;
  const timeSinceActivity = now.getTime() - lastActivity.getTime();

  if (timeSinceActivity > SESSION_CONFIG.IDLE_TIMEOUT_MS) {
    // Session expired - clear sensitive data
    await this.clearSession(session, 'TIMEOUT');

    return {
      expired: true,
      message: "⏰ Your session has expired for security.\n\n" +
               "Please send 'hi' to start a new session."
    };
  }

  // Check if approaching timeout (for flows with sensitive data)
  if (session.current_flow !== 'IDLE' &&
      timeSinceActivity > (SESSION_CONFIG.IDLE_TIMEOUT_MS - SESSION_CONFIG.WARNING_BEFORE_TIMEOUT_MS)) {
    // Send warning (only once)
    if (!session.timeout_warning_sent) {
      await this.sendTimeoutWarning(session);
    }
  }

  return { expired: false };
}

async function clearSession(session: WhatsAppSession, reason: string) {
  // Log the session clearance
  await this.auditLog({
    action: 'SESSION_CLEARED',
    whatsapp_number: session.whatsapp_number,
    patient_id: session.patient_id,
    reason,
    flow_at_clear: session.current_flow,
    messages_count: session.messages_in_session,
  });

  // Clear sensitive flow data
  await this.sessionModel.updateOne(
    { _id: session._id },
    {
      $set: {
        current_flow: 'IDLE',
        flow_step: 0,
        flow_data: {},
        is_expired: true,
      }
    }
  );
}
```

---

## 3. Audit Trail & Compliance Logging

### 3.1 Audit Log Schema
```typescript
// Collection: whatsapp_audit_logs
{
  _id: ObjectId,

  // Identity
  whatsapp_number: string,
  patient_id: ObjectId,
  session_id: ObjectId,

  // Message Details
  message_id: string,             // WhatsApp message ID
  direction: 'INBOUND' | 'OUTBOUND',
  message_type: 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'BUTTON_RESPONSE' |
                'LIST_RESPONSE' | 'TEMPLATE',

  // Content (redacted for sensitive data)
  content_hash: string,           // SHA256 of original content
  content_preview: string,        // First 100 chars, PII redacted
  has_media: boolean,
  media_type: string,
  media_s3_key: string,           // If media was stored

  // Context
  flow_context: string,
  action_taken: string,           // e.g., 'PRESCRIPTION_UPLOADED', 'ORDER_CREATED'

  // Prescription-specific (if applicable)
  prescription_id: ObjectId,
  order_id: ObjectId,

  // Security Events
  security_flags: string[],       // e.g., ['RATE_LIMIT_WARNING', 'SUSPICIOUS_PATTERN']

  // Metadata
  timestamp: Date,
  wa_timestamp: Date,             // WhatsApp's timestamp
  processing_time_ms: number,

  // For regulatory queries
  is_prescription_related: boolean,
  is_controlled_substance: boolean,
  contains_phi: boolean,          // Protected Health Information

  // Retention
  retention_category: 'STANDARD' | 'PRESCRIPTION' | 'CONTROLLED',
  retain_until: Date,             // Based on category (7 years for prescriptions)
}

// Indexes for compliance queries
{ whatsapp_number: 1, timestamp: -1 }
{ patient_id: 1, timestamp: -1 }
{ prescription_id: 1 }
{ order_id: 1 }
{ is_controlled_substance: 1, timestamp: -1 }
{ retain_until: 1 }  // For retention policy enforcement
```

### 3.2 Audit Logging Service
```typescript
@Injectable()
export class WhatsAppAuditService {
  // Log every inbound message
  async logInboundMessage(message: WhatsAppInboundMessage, context: AuditContext) {
    const log: WhatsAppAuditLog = {
      whatsapp_number: message.from,
      patient_id: context.patient_id,
      session_id: context.session_id,
      message_id: message.id,
      direction: 'INBOUND',
      message_type: this.getMessageType(message),
      content_hash: this.hashContent(message),
      content_preview: this.redactPII(this.getPreview(message)),
      has_media: !!message.image || !!message.document,
      flow_context: context.current_flow,
      timestamp: new Date(),
      wa_timestamp: new Date(parseInt(message.timestamp) * 1000),
      is_prescription_related: context.is_prescription_flow,
      contains_phi: true, // Assume all healthcare messages contain PHI
      retention_category: this.getRetentionCategory(context),
      retain_until: this.calculateRetentionDate(context),
    };

    await this.auditLogModel.create(log);
  }

  // Log every outbound message
  async logOutboundMessage(message: WhatsAppOutboundMessage, context: AuditContext) {
    // Similar structure...
  }

  // Log security events
  async logSecurityEvent(event: SecurityEvent) {
    await this.auditLogModel.create({
      ...event,
      security_flags: [event.type],
      timestamp: new Date(),
    });

    // Alert on critical security events
    if (event.severity === 'CRITICAL') {
      await this.alertSecurityTeam(event);
    }
  }

  // Retention periods (Nigerian pharmacy regulations)
  private getRetentionCategory(context: AuditContext): string {
    if (context.is_controlled_substance) return 'CONTROLLED';  // 10 years
    if (context.is_prescription_flow) return 'PRESCRIPTION';   // 7 years
    return 'STANDARD';                                          // 2 years
  }

  private calculateRetentionDate(context: AuditContext): Date {
    const retentionYears = {
      'CONTROLLED': 10,
      'PRESCRIPTION': 7,
      'STANDARD': 2,
    };
    const category = this.getRetentionCategory(context);
    const years = retentionYears[category];
    return new Date(Date.now() + years * 365 * 24 * 60 * 60 * 1000);
  }
}
```

---

## 4. Rate Limiting & Abuse Prevention

### 4.1 Rate Limit Configuration
```typescript
const RATE_LIMITS = {
  // Prescription uploads
  PRESCRIPTION_UPLOAD: {
    per_number_per_day: 5,
    per_number_per_hour: 3,
    per_account_per_day: 10,    // In case multiple numbers linked
  },

  // Orders
  ORDER_CREATION: {
    per_number_per_day: 10,
    per_number_per_hour: 5,
    high_value_per_day: 3,      // Orders > ₦50,000
  },

  // Messages (spam prevention)
  MESSAGES: {
    per_minute: 20,
    per_hour: 200,
    media_per_hour: 30,
  },

  // Failed verifications
  VERIFICATION_ATTEMPTS: {
    max_per_hour: 5,
    lockout_duration_hours: 24,
  },

  // Controlled substances (extra strict)
  CONTROLLED_SUBSTANCE: {
    per_number_per_week: 2,
    requires_pharmacist_approval: true,
  },
};
```

### 4.2 Rate Limiter Service
```typescript
// Collection: whatsapp_rate_limits
{
  _id: ObjectId,
  key: string,                    // e.g., "prescription_upload:+2348012345678:2025-01-15"
  count: number,
  window_start: Date,
  window_end: Date,

  // For tracking patterns
  timestamps: Date[],             // Individual action timestamps
}

@Injectable()
export class WhatsAppRateLimiter {
  async checkRateLimit(
    action: string,
    whatsappNumber: string,
    patientId?: ObjectId,
  ): Promise<RateLimitResult> {
    const limits = RATE_LIMITS[action];
    if (!limits) return { allowed: true };

    const now = new Date();
    const results: RateLimitCheck[] = [];

    // Check per-number daily limit
    if (limits.per_number_per_day) {
      const dayKey = `${action}:${whatsappNumber}:${this.getDayKey(now)}`;
      const dayCount = await this.getCount(dayKey, 'day');

      if (dayCount >= limits.per_number_per_day) {
        return {
          allowed: false,
          reason: 'DAILY_LIMIT_EXCEEDED',
          retry_after: this.getNextDayStart(now),
          message: `You've reached the daily limit for this action. Please try again tomorrow.`,
        };
      }
    }

    // Check per-number hourly limit
    if (limits.per_number_per_hour) {
      const hourKey = `${action}:${whatsappNumber}:${this.getHourKey(now)}`;
      const hourCount = await this.getCount(hourKey, 'hour');

      if (hourCount >= limits.per_number_per_hour) {
        return {
          allowed: false,
          reason: 'HOURLY_LIMIT_EXCEEDED',
          retry_after: this.getNextHourStart(now),
          message: `Too many requests. Please wait ${this.getMinutesRemaining(now)} minutes.`,
        };
      }
    }

    return { allowed: true };
  }

  async recordAction(action: string, whatsappNumber: string) {
    const now = new Date();

    // Increment daily counter
    const dayKey = `${action}:${whatsappNumber}:${this.getDayKey(now)}`;
    await this.incrementCounter(dayKey, 'day');

    // Increment hourly counter
    const hourKey = `${action}:${whatsappNumber}:${this.getHourKey(now)}`;
    await this.incrementCounter(hourKey, 'hour');
  }

  // Detect suspicious patterns
  async detectAbusePatterns(whatsappNumber: string): Promise<AbuseDetectionResult> {
    const patterns: string[] = [];

    // Pattern 1: Rapid prescription uploads
    const recentUploads = await this.getRecentActions('PRESCRIPTION_UPLOAD', whatsappNumber, 60);
    if (recentUploads.length >= 3) {
      patterns.push('RAPID_PRESCRIPTION_UPLOADS');
    }

    // Pattern 2: Multiple failed verifications
    const failedVerifications = await this.getRecentActions('VERIFICATION_FAILED', whatsappNumber, 3600);
    if (failedVerifications.length >= 3) {
      patterns.push('MULTIPLE_FAILED_VERIFICATIONS');
    }

    // Pattern 3: Controlled substance requests
    const controlledRequests = await this.getRecentActions('CONTROLLED_SUBSTANCE_REQUEST', whatsappNumber, 604800);
    if (controlledRequests.length >= 2) {
      patterns.push('FREQUENT_CONTROLLED_REQUESTS');
    }

    if (patterns.length > 0) {
      await this.auditService.logSecurityEvent({
        type: 'ABUSE_PATTERN_DETECTED',
        whatsapp_number: whatsappNumber,
        patterns,
        severity: patterns.includes('FREQUENT_CONTROLLED_REQUESTS') ? 'HIGH' : 'MEDIUM',
      });
    }

    return { patterns, should_block: patterns.length >= 2 };
  }
}
```

---

## 5. OCR Fallback & Manual Review Queue

### 5.1 Confidence-Based Routing
```typescript
const OCR_CONFIDENCE_THRESHOLDS = {
  AUTO_APPROVE: 90,           // >= 90%: Auto-process
  PHARMACIST_REVIEW: 70,      // 70-89%: Pharmacist quick review
  MANUAL_ENTRY: 50,           // 50-69%: Manual data entry queue
  REJECT: 0,                  // < 50%: Ask for clearer image
};

async function processPrescriptionImage(
  imageBuffer: Buffer,
  context: PrescriptionContext,
): Promise<ProcessingResult> {
  // Run OCR
  const ocrResult = await this.ocrService.extractPrescriptionData(imageBuffer);

  const confidence = ocrResult.overall_confidence;

  // Route based on confidence
  if (confidence >= OCR_CONFIDENCE_THRESHOLDS.AUTO_APPROVE) {
    // High confidence - proceed with verification
    return await this.processHighConfidencePrescription(ocrResult, context);

  } else if (confidence >= OCR_CONFIDENCE_THRESHOLDS.PHARMACIST_REVIEW) {
    // Medium confidence - add to pharmacist review queue
    return await this.addToPharmacistReviewQueue(ocrResult, context, 'OCR_REVIEW');

  } else if (confidence >= OCR_CONFIDENCE_THRESHOLDS.MANUAL_ENTRY) {
    // Low confidence - add to manual entry queue
    return await this.addToManualEntryQueue(ocrResult, context);

  } else {
    // Very low confidence - request better image
    return {
      status: 'IMAGE_QUALITY_ISSUE',
      message: "I'm having trouble reading this prescription. Could you please:\n\n" +
               "1️⃣ Ensure good lighting\n" +
               "2️⃣ Hold the camera steady\n" +
               "3️⃣ Include the entire prescription\n" +
               "4️⃣ Avoid shadows or glare\n\n" +
               "Please send another photo.",
    };
  }
}
```

### 5.2 Manual Review Queue Schema
```typescript
// Collection: whatsapp_prescription_queue
{
  _id: ObjectId,

  // Source
  whatsapp_number: string,
  patient_id: ObjectId,
  session_id: ObjectId,

  // Prescription Data
  prescription_upload_id: ObjectId,  // Link to patient_prescription_uploads
  image_s3_key: string,
  image_s3_url: string,

  // OCR Results
  ocr_data: {
    raw_text: string,
    confidence: number,
    extracted_fields: {
      doctor_name: { value: string, confidence: number },
      patient_name: { value: string, confidence: number },
      medications: [{
        name: { value: string, confidence: number },
        dosage: { value: string, confidence: number },
        quantity: { value: string, confidence: number },
        instructions: { value: string, confidence: number },
      }],
      // ... other fields
    },
    low_confidence_fields: string[],  // Fields needing review
  },

  // Queue Status
  queue_type: 'OCR_REVIEW' | 'MANUAL_ENTRY' | 'CONTROLLED_SUBSTANCE' |
              'VERIFICATION_FAILED' | 'PHARMACIST_ESCALATION',
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT',
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ESCALATED' | 'REJECTED',

  // Assignment
  assigned_to: ObjectId,            // Pharmacist/Staff user ID
  assigned_at: Date,

  // Review Results
  reviewed_by: ObjectId,
  reviewed_at: Date,
  review_action: 'APPROVED' | 'CORRECTED' | 'REJECTED' | 'ESCALATED',
  corrections_made: [{
    field: string,
    original_value: string,
    corrected_value: string,
  }],
  review_notes: string,
  rejection_reason: string,

  // Timing
  created_at: Date,
  updated_at: Date,
  sla_deadline: Date,              // e.g., 2 hours for normal, 30 mins for urgent
  sla_breached: boolean,

  // Patient Communication
  patient_notified_at: Date,
  patient_response_needed: boolean,
  patient_response: string,
}

// Indexes
{ queue_type: 1, status: 1, priority: -1, created_at: 1 }  // Main queue query
{ assigned_to: 1, status: 1 }                               // Pharmacist's queue
{ sla_deadline: 1, sla_breached: 1 }                        // SLA monitoring
{ whatsapp_number: 1, created_at: -1 }                      // Patient lookup
```

---

## 6. Pharmacist Dashboard & Queue Management

### 6.1 Dashboard API Endpoints
```typescript
// GET /admin-api/whatsapp/queue/stats
// Returns queue statistics
{
  summary: {
    total_pending: 45,
    ocr_review: 12,
    manual_entry: 8,
    controlled_substance: 5,
    pharmacist_escalation: 3,
    verification_failed: 17,
  },
  by_priority: {
    urgent: 3,
    high: 12,
    normal: 25,
    low: 5,
  },
  sla_status: {
    within_sla: 38,
    approaching_breach: 5,    // < 30 mins to deadline
    breached: 2,
  },
  avg_processing_time_mins: 8.5,
  oldest_pending_mins: 45,
}

// GET /admin-api/whatsapp/queue?type=OCR_REVIEW&status=PENDING&limit=20
// Returns paginated queue items
{
  items: [
    {
      _id: "...",
      patient: {
        name: "Bassey Eyo",
        phone: "+2348012345678",
        whatsapp_linked: true,
      },
      prescription_preview: {
        image_url: "presigned_url...",
        ocr_confidence: 75,
        medications_detected: 3,
        low_confidence_fields: ["doctor_license", "medication_2_dosage"],
      },
      queue_type: "OCR_REVIEW",
      priority: "NORMAL",
      created_at: "2025-01-15T10:30:00Z",
      sla_deadline: "2025-01-15T12:30:00Z",
      time_in_queue_mins: 15,
    },
    // ...
  ],
  pagination: {
    total: 45,
    page: 1,
    limit: 20,
  },
}

// POST /admin-api/whatsapp/queue/:id/claim
// Pharmacist claims a queue item
{
  success: true,
  item: { ... },  // Full item details with OCR data for editing
}

// POST /admin-api/whatsapp/queue/:id/complete
// Complete review with corrections
{
  action: "APPROVED" | "CORRECTED" | "REJECTED" | "ESCALATED",
  corrections: [
    { field: "medications.0.dosage", corrected_value: "500mg" },
  ],
  notes: "Verified with prescriber",
  rejection_reason: "Prescription expired",  // If rejected
}
```

### 6.2 Real-time Dashboard Updates
```typescript
// WebSocket events for pharmacist dashboard
@WebSocketGateway({ namespace: 'whatsapp-queue' })
export class WhatsAppQueueGateway {

  @SubscribeMessage('subscribe')
  handleSubscribe(client: Socket, pharmacistId: string) {
    client.join(`pharmacist:${pharmacistId}`);
    client.join('queue:all');
  }

  // Emit when new item added to queue
  async notifyNewQueueItem(item: WhatsAppQueueItem) {
    this.server.to('queue:all').emit('queue:new_item', {
      id: item._id,
      queue_type: item.queue_type,
      priority: item.priority,
      patient_name: item.patient_name,
    });

    // Play sound for urgent items
    if (item.priority === 'URGENT') {
      this.server.to('queue:all').emit('queue:urgent_alert', { id: item._id });
    }
  }

  // Emit when item is claimed
  async notifyItemClaimed(itemId: string, pharmacistId: string) {
    this.server.to('queue:all').emit('queue:item_claimed', {
      id: itemId,
      claimed_by: pharmacistId,
    });
  }

  // Emit SLA warnings
  async notifySLAWarning(item: WhatsAppQueueItem) {
    this.server.to('queue:all').emit('queue:sla_warning', {
      id: item._id,
      minutes_remaining: this.getMinutesToDeadline(item.sla_deadline),
    });
  }
}
```

### 6.3 Dashboard UI Components (Vue/Vuetify)
```
Admin Dashboard Structure:

/admin/whatsapp/queue
├── QueueStats.vue          - Summary cards with counts
├── QueueFilters.vue        - Filter by type, priority, status
├── QueueTable.vue          - Main queue list with actions
├── QueueItemDetail.vue     - Modal for reviewing item
│   ├── PrescriptionImage   - Zoomable image viewer
│   ├── OCRDataEditor       - Edit extracted fields
│   ├── PatientInfo         - Patient context
│   ├── ActionButtons       - Approve/Correct/Reject/Escalate
│   └── NotesInput          - Review notes
└── QueueMetrics.vue        - Charts for SLA, volume trends
```

---

## 7. Controlled Substance Flow

### 7.1 Detection & Classification
```typescript
// Controlled substance categories (Nigerian NAFDAC)
const CONTROLLED_SUBSTANCE_CATEGORIES = {
  SCHEDULE_I: {
    // Prohibited substances
    keywords: ['heroin', 'cocaine', 'lsd', 'mdma'],
    action: 'REJECT',
    requires_dea: false,
  },
  SCHEDULE_II: {
    // High potential for abuse
    keywords: ['morphine', 'oxycodone', 'fentanyl', 'methadone', 'amphetamine'],
    action: 'ENHANCED_VERIFICATION',
    requires_dea: true,
    max_days_supply: 30,
    no_refills: true,
  },
  SCHEDULE_III: {
    // Moderate potential for abuse
    keywords: ['codeine', 'ketamine', 'anabolic steroids'],
    action: 'PHARMACIST_REVIEW',
    requires_dea: true,
    max_days_supply: 90,
  },
  SCHEDULE_IV: {
    // Low potential for abuse
    keywords: ['diazepam', 'lorazepam', 'tramadol', 'zolpidem'],
    action: 'PHARMACIST_REVIEW',
    requires_dea: true,
    max_days_supply: 180,
  },
  SCHEDULE_V: {
    // Lowest potential
    keywords: ['pregabalin', 'low-dose codeine'],
    action: 'FLAG_FOR_REVIEW',
    requires_dea: false,
  },
};

async function checkForControlledSubstances(
  medications: ExtractedMedication[],
): Promise<ControlledSubstanceCheck> {
  const flags: ControlledSubstanceFlag[] = [];

  for (const med of medications) {
    const medName = med.name.toLowerCase();

    for (const [schedule, config] of Object.entries(CONTROLLED_SUBSTANCE_CATEGORIES)) {
      const matches = config.keywords.some(kw => medName.includes(kw));

      if (matches) {
        flags.push({
          medication: med.name,
          schedule,
          action: config.action,
          requires_dea: config.requires_dea,
        });
      }
    }
  }

  return {
    has_controlled: flags.length > 0,
    flags,
    highest_schedule: this.getHighestSchedule(flags),
    required_action: this.determineRequiredAction(flags),
  };
}
```

### 7.2 Enhanced Verification Flow
```
CONTROLLED SUBSTANCE FLOW:

1. DETECTION
   System detects controlled substance in prescription

2. PATIENT NOTIFICATION
   Bot: "⚠️ Your prescription contains a controlled medication
         that requires additional verification.

         A pharmacist will review your prescription and may
         contact you or your prescriber for verification.

         Estimated review time: 2-4 hours

         You'll receive a notification when complete."

3. PHARMACIST QUEUE (Priority: HIGH)
   Queue item created with:
   - queue_type: 'CONTROLLED_SUBSTANCE'
   - priority: 'HIGH'
   - required_verifications: [
       'PRESCRIBER_LICENSE_CHECK',
       'PRESCRIBER_DEA_CHECK',
       'PATIENT_ID_VERIFICATION',
       'PRESCRIPTION_AUTHENTICITY',
       'PDMP_CHECK',  // Prescription Drug Monitoring Program
     ]

4. VERIFICATION STEPS
   Pharmacist must complete checklist:
   ☐ Verified prescriber license number
   ☐ Verified prescriber DEA registration (if applicable)
   ☐ Confirmed patient identity matches prescription
   ☐ Checked PDMP for patient history
   ☐ Verified prescription is original (not duplicate)
   ☐ Confirmed quantity is within limits
   ☐ Called prescriber to verify (for Schedule II)

5. APPROVAL/REJECTION
   If APPROVED:
   Bot: "✅ Your prescription has been verified!

         Controlled medication prescriptions must be
         picked up in person with valid ID.

         [Schedule Pickup]"

   If REJECTED:
   Bot: "❌ We were unable to verify your prescription.

         Reason: [rejection_reason]

         Please contact your prescriber or visit us
         in person with your original prescription.

         [Contact Support]"
```

### 7.3 Controlled Substance Audit Trail
```typescript
// Additional audit fields for controlled substances
{
  // ... standard audit fields ...

  controlled_substance_audit: {
    schedule: string,
    medication_name: string,
    quantity_prescribed: number,
    days_supply: number,

    // Verification checklist
    verifications_completed: [{
      type: string,
      completed_by: ObjectId,
      completed_at: Date,
      result: 'PASS' | 'FAIL' | 'INCONCLUSIVE',
      notes: string,
      evidence_s3_key: string,  // Supporting documents
    }],

    // Prescriber verification
    prescriber_contacted: boolean,
    prescriber_contact_method: 'PHONE' | 'FAX' | 'EMAIL',
    prescriber_verification_code: string,
    prescriber_confirmed_at: Date,

    // PDMP check
    pdmp_checked: boolean,
    pdmp_check_date: Date,
    pdmp_alerts: string[],

    // Final decision
    approval_pharmacist: ObjectId,
    approval_date: Date,
    approval_notes: string,
  },
}
```

---

## 8. Complete Message Flow Architecture

### 8.1 Webhook Handler
```typescript
@Controller('webhooks/whatsapp')
export class WhatsAppWebhookController {

  @Post('twilio')
  async handleTwilioWebhook(@Body() body: TwilioWhatsAppWebhook) {
    const startTime = Date.now();

    try {
      // 1. Validate webhook signature
      await this.validateTwilioSignature(body);

      // 2. Parse message
      const message = this.parseInboundMessage(body);

      // 3. Check rate limits
      const rateCheck = await this.rateLimiter.checkRateLimit(
        'MESSAGES',
        message.from,
      );
      if (!rateCheck.allowed) {
        return this.sendRateLimitResponse(message, rateCheck);
      }

      // 4. Get or create identity
      const identity = await this.identityService.getOrPromptVerification(message.from);
      if (!identity.is_verified) {
        return this.handleUnverifiedUser(message, identity);
      }

      // 5. Get or create session
      const session = await this.sessionService.getOrCreateSession(
        message.from,
        identity.patient_id,
      );

      // 6. Check session timeout
      const timeoutCheck = await this.sessionService.checkTimeout(session);
      if (timeoutCheck.expired) {
        await this.sendMessage(message.from, timeoutCheck.message);
        return;
      }

      // 7. Log inbound message
      await this.auditService.logInboundMessage(message, {
        patient_id: identity.patient_id,
        session_id: session._id,
        current_flow: session.current_flow,
      });

      // 8. Route to appropriate handler
      const response = await this.messageRouter.route(message, session, identity);

      // 9. Send response
      await this.sendMessage(message.from, response);

      // 10. Log outbound message
      await this.auditService.logOutboundMessage(response, {
        patient_id: identity.patient_id,
        session_id: session._id,
        processing_time_ms: Date.now() - startTime,
      });

    } catch (error) {
      this.logger.error('WhatsApp webhook error', error);
      await this.auditService.logError(error, body);

      // Send generic error to user
      await this.sendMessage(body.From,
        "Sorry, something went wrong. Please try again or contact support."
      );
    }
  }
}
```

### 8.2 Message Router
```typescript
@Injectable()
export class WhatsAppMessageRouter {

  async route(
    message: WhatsAppMessage,
    session: WhatsAppSession,
    identity: WhatsAppIdentity,
  ): Promise<WhatsAppResponse> {

    // Handle global commands first
    const globalCommand = this.parseGlobalCommand(message);
    if (globalCommand) {
      return this.handleGlobalCommand(globalCommand, session);
    }

    // Route based on current flow
    switch (session.current_flow) {
      case 'IDLE':
        return this.handleIdleState(message, session);

      case 'PRESCRIPTION_UPLOAD':
        return this.prescriptionFlowHandler.handle(message, session);

      case 'ORDER_CREATION':
        return this.orderFlowHandler.handle(message, session);

      case 'PAYMENT':
        return this.paymentFlowHandler.handle(message, session);

      case 'PHARMACIST_CHAT':
        return this.pharmacistChatHandler.handle(message, session);

      default:
        return this.handleUnknownState(message, session);
    }
  }

  private parseGlobalCommand(message: WhatsAppMessage): string | null {
    const text = message.body?.toLowerCase().trim();

    const commands = {
      'menu': 'SHOW_MENU',
      'help': 'SHOW_HELP',
      'cancel': 'CANCEL_FLOW',
      'status': 'CHECK_STATUS',
      'orders': 'LIST_ORDERS',
      'human': 'REQUEST_HUMAN',
      'stop': 'OPT_OUT',
    };

    return commands[text] || null;
  }
}
```

---

## 9. Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Twilio WhatsApp Business API setup
- [ ] Webhook endpoint with signature validation
- [ ] Identity binding service
- [ ] Session management with timeout
- [ ] Basic audit logging
- [ ] Rate limiting infrastructure

### Phase 2: Prescription Flow (Week 3-4)
- [ ] Image upload handling
- [ ] OCR integration with confidence routing
- [ ] Manual review queue (backend + admin UI)
- [ ] Patient notifications for queue status
- [ ] Pharmacist dashboard MVP

### Phase 3: Controlled Substances (Week 5)
- [ ] Controlled substance detection
- [ ] Enhanced verification workflow
- [ ] Pharmacist verification checklist
- [ ] PDMP integration (if available)
- [ ] Audit trail enhancements

### Phase 4: Order & Payment (Week 6-7)
- [ ] Order creation flow
- [ ] Paystack payment link integration
- [ ] Order status notifications
- [ ] Delivery tracking updates

### Phase 5: Advanced Features (Week 8+)
- [ ] Pharmacist live chat handoff
- [ ] Refill reminders
- [ ] Medication interaction warnings
- [ ] Analytics dashboard
- [ ] Performance optimization

---

## 10. Database Collections Summary

| Collection | Purpose |
|------------|---------|
| `whatsapp_identities` | Phone number ↔ patient binding |
| `whatsapp_sessions` | Conversation state & timeout |
| `whatsapp_audit_logs` | Regulatory compliance logging |
| `whatsapp_rate_limits` | Rate limiting counters |
| `whatsapp_prescription_queue` | Pharmacist review queue |
| `whatsapp_templates` | Message template management |
| `whatsapp_analytics` | Usage metrics & reporting |

---

## 11. Security Checklist

- [ ] Webhook signature validation
- [ ] Identity verification before any PHI access
- [ ] Session timeout (30 min idle, 4 hour max)
- [ ] Rate limiting (messages, uploads, orders)
- [ ] Audit logging for all interactions
- [ ] PII redaction in logs
- [ ] Encryption at rest (S3, MongoDB)
- [ ] Encryption in transit (TLS)
- [ ] Controlled substance enhanced verification
- [ ] Abuse pattern detection
- [ ] Regular security audits
