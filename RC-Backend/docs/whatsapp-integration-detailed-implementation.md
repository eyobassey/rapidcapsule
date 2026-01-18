# WhatsApp Prescription Integration - Detailed Implementation Guide

## Executive Summary

This document provides a comprehensive, implementation-ready plan for integrating WhatsApp-based prescription processing into the Rapid Capsule platform. The plan leverages existing infrastructure (Twilio, S3, MongoDB, existing services) and follows established patterns in the codebase.

---

## Table of Contents

1. [Existing System Integration Points](#1-existing-system-integration-points)
2. [New Module Structure](#2-new-module-structure)
3. [Database Entities (Detailed Schemas)](#3-database-entities)
4. [Service Implementation](#4-service-implementation)
5. [Controller & Webhook Endpoints](#5-controller--webhook-endpoints)
6. [Admin Dashboard Components](#6-admin-dashboard-components)
7. [Frontend Patient Components](#7-frontend-patient-components)
8. [Configuration & Environment](#8-configuration--environment)
9. [Step-by-Step Implementation Tasks](#9-step-by-step-implementation-tasks)

---

## 1. Existing System Integration Points

### 1.1 Reusable Services (RC-Backend)

| Existing Service | Location | Reuse For |
|-----------------|----------|-----------|
| `TwilioService` | `src/common/external/twilio/twilio.service.ts` | WhatsApp via Twilio API |
| `FileUploadHelper` | `src/core/utils/file-upload.helper.ts` | S3 uploads for prescription images |
| `GeneralHelpers` | `src/core/utils/general.helpers.ts` | Email notifications, utilities |
| `DocumentProcessorService` | `src/modules/pharmacy/services/document-processor.service.ts` | OCR extraction (existing) |
| `PrescriptionVerificationService` | `src/modules/pharmacy/services/prescription-verification.service.ts` | Verification workflows + **Fraud Scoring** |
| `ClaudeAIService` | `src/modules/pharmacy/services/claude-ai.service.ts` | AI-powered fraud detection |
| `PatientPrescriptionUploadService` | `src/modules/pharmacy/services/patient-prescription-upload.service.ts` | Prescription storage |
| `DrugService` | `src/modules/pharmacy/services/drug.service.ts` | Drug matching & lookup |
| `PharmacyOrderService` | `src/modules/pharmacy/services/pharmacy-order.service.ts` | Order creation |
| `PaymentService` | `src/modules/payments/services/payment.service.ts` | Paystack integration |
| `WalletService` | `src/modules/wallets/services/wallet.service.ts` | Wallet payments |

### 1.2 Existing Entities to Reference

| Entity | Location | Integration |
|--------|----------|-------------|
| `User` | `src/modules/users/entities/user.entity.ts` | Patient identity linking |
| `PatientPrescriptionUpload` | `src/modules/pharmacy/entities/patient-prescription-upload.entity.ts` | Store WhatsApp prescriptions |
| `PharmacyOrder` | `src/modules/pharmacy/entities/pharmacy-order.entity.ts` | Orders from WhatsApp |
| `Drug` | `src/modules/pharmacy/entities/drug.entity.ts` | Drug matching |

### 1.3 Existing Twilio Integration

**Current File**: `src/common/external/twilio/twilio.service.ts`

```typescript
// Current Twilio service sends SMS - we'll extend for WhatsApp
@Injectable()
export class TwilioService {
  private client: Twilio;

  constructor(private configService: ConfigService) {
    this.client = new Twilio(
      this.configService.get('TWILIO_ACCOUNT_SID'),
      this.configService.get('TWILIO_AUTH_TOKEN'),
    );
  }

  async sendSMS(to: string, body: string): Promise<MessageInstance> {
    return this.client.messages.create({
      body,
      from: this.configService.get('TWILIO_PHONE_NUMBER'),
      to,
    });
  }
}
```

**Extension for WhatsApp**:
```typescript
// Add to existing TwilioService or create new WhatsAppTwilioService
async sendWhatsAppMessage(to: string, body: string): Promise<MessageInstance> {
  return this.client.messages.create({
    body,
    from: `whatsapp:${this.configService.get('TWILIO_WHATSAPP_NUMBER')}`,
    to: `whatsapp:${to}`,
  });
}

async sendWhatsAppTemplate(
  to: string,
  templateSid: string,
  variables: Record<string, string>
): Promise<MessageInstance> {
  return this.client.messages.create({
    from: `whatsapp:${this.configService.get('TWILIO_WHATSAPP_NUMBER')}`,
    to: `whatsapp:${to}`,
    contentSid: templateSid,
    contentVariables: JSON.stringify(variables),
  });
}

async sendWhatsAppMedia(
  to: string,
  body: string,
  mediaUrl: string
): Promise<MessageInstance> {
  return this.client.messages.create({
    body,
    from: `whatsapp:${this.configService.get('TWILIO_WHATSAPP_NUMBER')}`,
    to: `whatsapp:${to}`,
    mediaUrl: [mediaUrl],
  });
}
```

---

## 2. New Module Structure

### 2.1 RC-Backend Module Directory

```
src/modules/whatsapp/
├── whatsapp.module.ts
├── controllers/
│   ├── whatsapp-webhook.controller.ts       # Twilio webhook handler
│   └── whatsapp-admin.controller.ts         # Admin queue endpoints
├── services/
│   ├── whatsapp-identity.service.ts         # Phone-patient binding
│   ├── whatsapp-session.service.ts          # Conversation state
│   ├── whatsapp-message.service.ts          # Send/receive messages
│   ├── whatsapp-audit.service.ts            # Compliance logging
│   ├── whatsapp-rate-limiter.service.ts     # Rate limiting
│   ├── whatsapp-queue.service.ts            # Pharmacist review queue
│   └── whatsapp-flow.service.ts             # Conversation flow logic
├── handlers/
│   ├── prescription-flow.handler.ts         # Prescription upload flow
│   ├── order-flow.handler.ts                # Order creation flow
│   ├── payment-flow.handler.ts              # Payment handling
│   └── verification-flow.handler.ts         # Identity verification flow
├── entities/
│   ├── whatsapp-identity.entity.ts
│   ├── whatsapp-session.entity.ts
│   ├── whatsapp-audit-log.entity.ts
│   ├── whatsapp-rate-limit.entity.ts
│   └── whatsapp-prescription-queue.entity.ts
├── dto/
│   ├── twilio-webhook.dto.ts
│   ├── send-message.dto.ts
│   ├── queue-item.dto.ts
│   └── identity.dto.ts
├── interfaces/
│   ├── whatsapp-message.interface.ts
│   ├── flow-context.interface.ts
│   └── queue-item.interface.ts
└── constants/
    ├── flow-steps.constant.ts
    ├── rate-limits.constant.ts
    ├── templates.constant.ts
    └── controlled-substances.constant.ts
```

### 2.2 RC_Admin_Backend Extensions

```
src/modules/dashboard/
├── whatsapp-queue.controller.ts             # Queue management endpoints
└── whatsapp-queue.service.ts                # Queue operations
```

### 2.3 RC_Admin_UI New Components

```
src/pages/whatsapp/
├── queue/
│   ├── index.vue                            # Main queue page
│   ├── [id].vue                             # Queue item detail
│   └── components/
│       ├── QueueStats.vue                   # Summary statistics
│       ├── QueueFilters.vue                 # Filter controls
│       ├── QueueTable.vue                   # Queue list
│       ├── QueueItemDetail.vue              # Review modal
│       ├── PrescriptionImageViewer.vue      # Zoomable image
│       ├── OCRDataEditor.vue                # Edit extracted data
│       ├── VerificationChecklist.vue        # Controlled substance checks
│       └── PatientContext.vue               # Patient info sidebar
├── analytics/
│   └── index.vue                            # WhatsApp analytics dashboard
└── settings/
    └── index.vue                            # WhatsApp configuration
```

### 2.4 RC (Patient Frontend) Extensions

```
src/views/Mainapp/Account/
├── WhatsAppLink.vue                         # Link WhatsApp to account
└── components/
    └── WhatsAppLinkModal.vue                # OTP verification modal

src/views/Mainapp/Prescriptions/
└── WhatsAppHistory.vue                      # View WhatsApp prescription history
```

---

## 3. Database Entities

### 3.1 WhatsApp Identity Entity

**File**: `src/modules/whatsapp/entities/whatsapp-identity.entity.ts`

```typescript
import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type WhatsAppIdentityDocument = HydratedDocument<WhatsAppIdentity>;

export enum VerificationMethod {
  OTP_EMAIL = 'OTP_EMAIL',
  OTP_SMS = 'OTP_SMS',
  EXISTING_SESSION = 'EXISTING_SESSION',
  IN_APP_LINK = 'IN_APP_LINK',
}

export enum IdentityStatus {
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  VERIFIED = 'VERIFIED',
  BLOCKED = 'BLOCKED',
  UNLINKED = 'UNLINKED',
}

@Schema({
  collection: 'whatsapp_identities',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class WhatsAppIdentity {
  // Primary identifiers
  @Prop({ type: String, required: true, unique: true, index: true })
  whatsapp_number: string; // E.164 format: +2348012345678

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true })
  patient_id: Types.ObjectId;

  // Verification status
  @Prop({ type: String, enum: IdentityStatus, default: IdentityStatus.PENDING_VERIFICATION })
  status: IdentityStatus;

  @Prop({ type: Boolean, default: false })
  is_verified: boolean;

  @Prop({ type: Date })
  verified_at: Date;

  @Prop({ type: String, enum: VerificationMethod })
  verification_method: VerificationMethod;

  // Pending verification data
  @Prop(
    raw({
      otp_code: { type: String },
      otp_expires_at: { type: Date },
      email_or_phone: { type: String },
      attempts: { type: Number, default: 0 },
    }),
  )
  pending_verification: {
    otp_code: string;
    otp_expires_at: Date;
    email_or_phone: string;
    attempts: number;
  };

  // Security tracking
  @Prop({ type: Number, default: 0 })
  failed_verification_attempts: number;

  @Prop({ type: Date })
  last_failed_attempt: Date;

  @Prop({ type: Date })
  blocked_at: Date;

  @Prop({ type: String })
  blocked_reason: string;

  @Prop({ type: Date })
  block_expires_at: Date; // Temporary blocks

  // Device info from WhatsApp
  @Prop(
    raw({
      wa_id: { type: String },
      profile_name: { type: String },
      platform: { type: String },
    }),
  )
  device_info: {
    wa_id: string;
    profile_name: string;
    platform: string;
  };

  // Activity tracking
  @Prop({ type: Date })
  last_message_at: Date;

  @Prop({ type: Number, default: 0 })
  total_messages: number;

  @Prop({ type: Number, default: 0 })
  total_prescriptions: number;

  @Prop({ type: Number, default: 0 })
  total_orders: number;

  // Re-verification tracking
  @Prop({ type: Date })
  last_reverification_at: Date;

  @Prop({ type: Date })
  next_reverification_due: Date; // 90 days from verification

  // Opt-out tracking
  @Prop({ type: Boolean, default: false })
  opted_out: boolean;

  @Prop({ type: Date })
  opted_out_at: Date;

  // Timestamps
  created_at: Date;
  updated_at: Date;
}

export const WhatsAppIdentitySchema = SchemaFactory.createForClass(WhatsAppIdentity);

// Indexes
WhatsAppIdentitySchema.index({ patient_id: 1 });
WhatsAppIdentitySchema.index({ status: 1, is_verified: 1 });
WhatsAppIdentitySchema.index({ 'pending_verification.otp_expires_at': 1 });
```

### 3.2 WhatsApp Session Entity

**File**: `src/modules/whatsapp/entities/whatsapp-session.entity.ts`

```typescript
import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type WhatsAppSessionDocument = HydratedDocument<WhatsAppSession>;

export enum FlowType {
  IDLE = 'IDLE',
  VERIFICATION = 'VERIFICATION',
  PRESCRIPTION_UPLOAD = 'PRESCRIPTION_UPLOAD',
  ORDER_CREATION = 'ORDER_CREATION',
  PAYMENT = 'PAYMENT',
  PHARMACIST_CHAT = 'PHARMACIST_CHAT',
  SUPPORT = 'SUPPORT',
  ACCOUNT_LINK = 'ACCOUNT_LINK',
}

@Schema({
  collection: 'whatsapp_sessions',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class WhatsAppSession {
  @Prop({ type: String, required: true, index: true })
  whatsapp_number: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  patient_id: Types.ObjectId;

  // Conversation state
  @Prop({ type: String, enum: FlowType, default: FlowType.IDLE })
  current_flow: FlowType;

  @Prop({ type: Number, default: 0 })
  flow_step: number;

  // Flow-specific data (flexible schema)
  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  flow_data: Record<string, any>;
  /*
   * Examples:
   * PRESCRIPTION_UPLOAD: { prescription_id, uploaded_images: [], awaiting_more: boolean }
   * ORDER_CREATION: { prescription_id, cart_items: [], selected_pharmacy_id, delivery_method }
   * PAYMENT: { order_id, payment_method, payment_reference }
   * PHARMACIST_CHAT: { assigned_pharmacist_id, chat_started_at }
   */

  // Message context
  @Prop({ type: String })
  last_bot_message_id: string;

  @Prop({ type: String })
  last_bot_message_type: string; // 'MENU', 'QUESTION', 'CONFIRMATION', etc.

  @Prop({ type: [String], default: [] })
  expected_responses: string[]; // Valid button/list responses

  // Timing
  @Prop({ type: Date, required: true })
  last_message_at: Date;

  @Prop({ type: Date, required: true })
  session_started_at: Date;

  @Prop({ type: Date, required: true, index: true })
  expires_at: Date; // TTL index will use this

  @Prop({ type: Boolean, default: false })
  is_expired: boolean;

  @Prop({ type: Boolean, default: false })
  timeout_warning_sent: boolean;

  // Session stats
  @Prop({ type: Number, default: 0 })
  messages_in_session: number;

  // Handoff to human
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  assigned_pharmacist: Types.ObjectId;

  @Prop({ type: Date })
  handoff_at: Date;

  @Prop({ type: String })
  handoff_reason: string;

  @Prop({ type: Boolean, default: false })
  is_human_takeover: boolean;

  // Timestamps
  created_at: Date;
  updated_at: Date;
}

export const WhatsAppSessionSchema = SchemaFactory.createForClass(WhatsAppSession);

// TTL index - auto-delete expired sessions after 24 hours
WhatsAppSessionSchema.index({ expires_at: 1 }, { expireAfterSeconds: 86400 });

// Active session lookup
WhatsAppSessionSchema.index({ whatsapp_number: 1, is_expired: 1 });
```

### 3.3 WhatsApp Audit Log Entity

**File**: `src/modules/whatsapp/entities/whatsapp-audit-log.entity.ts`

```typescript
import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type WhatsAppAuditLogDocument = HydratedDocument<WhatsAppAuditLog>;

export enum MessageDirection {
  INBOUND = 'INBOUND',
  OUTBOUND = 'OUTBOUND',
}

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  DOCUMENT = 'DOCUMENT',
  AUDIO = 'AUDIO',
  VIDEO = 'VIDEO',
  BUTTON_RESPONSE = 'BUTTON_RESPONSE',
  LIST_RESPONSE = 'LIST_RESPONSE',
  TEMPLATE = 'TEMPLATE',
  INTERACTIVE = 'INTERACTIVE',
}

export enum RetentionCategory {
  STANDARD = 'STANDARD',           // 2 years
  PRESCRIPTION = 'PRESCRIPTION',   // 7 years
  CONTROLLED = 'CONTROLLED',       // 10 years
}

@Schema({
  collection: 'whatsapp_audit_logs',
  timestamps: { createdAt: 'timestamp' },
})
export class WhatsAppAuditLog {
  // Identity context
  @Prop({ type: String, required: true, index: true })
  whatsapp_number: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true })
  patient_id: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'WhatsAppSession' })
  session_id: Types.ObjectId;

  // Message details
  @Prop({ type: String, index: true })
  message_id: string; // Twilio message SID

  @Prop({ type: String, enum: MessageDirection, required: true })
  direction: MessageDirection;

  @Prop({ type: String, enum: MessageType, required: true })
  message_type: MessageType;

  // Content (redacted for privacy)
  @Prop({ type: String })
  content_hash: string; // SHA256 of original content

  @Prop({ type: String })
  content_preview: string; // First 100 chars, PII redacted

  // Media handling
  @Prop({ type: Boolean, default: false })
  has_media: boolean;

  @Prop({ type: String })
  media_type: string;

  @Prop({ type: String })
  media_s3_key: string;

  @Prop({ type: Number })
  media_size_bytes: number;

  // Flow context
  @Prop({ type: String })
  flow_context: string; // Current flow at time of message

  @Prop({ type: Number })
  flow_step: number;

  @Prop({ type: String })
  action_taken: string; // 'PRESCRIPTION_UPLOADED', 'ORDER_CREATED', etc.

  // Related entities
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'PatientPrescriptionUpload' })
  prescription_id: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'PharmacyOrder' })
  order_id: Types.ObjectId;

  // Security & compliance flags
  @Prop({ type: [String], default: [] })
  security_flags: string[]; // 'RATE_LIMIT_WARNING', 'SUSPICIOUS_PATTERN', etc.

  @Prop({ type: Boolean, default: false })
  is_prescription_related: boolean;

  @Prop({ type: Boolean, default: false })
  is_controlled_substance: boolean;

  @Prop({ type: Boolean, default: true })
  contains_phi: boolean; // Protected Health Information

  // Processing metadata
  @Prop({ type: Number })
  processing_time_ms: number;

  @Prop({ type: Date })
  wa_timestamp: Date; // WhatsApp's original timestamp

  // Error tracking
  @Prop({ type: Boolean, default: false })
  had_error: boolean;

  @Prop({ type: String })
  error_message: string;

  // Retention policy
  @Prop({ type: String, enum: RetentionCategory, default: RetentionCategory.STANDARD })
  retention_category: RetentionCategory;

  @Prop({ type: Date, required: true, index: true })
  retain_until: Date;

  // Timestamp
  timestamp: Date;
}

export const WhatsAppAuditLogSchema = SchemaFactory.createForClass(WhatsAppAuditLog);

// Indexes for compliance queries
WhatsAppAuditLogSchema.index({ whatsapp_number: 1, timestamp: -1 });
WhatsAppAuditLogSchema.index({ patient_id: 1, timestamp: -1 });
WhatsAppAuditLogSchema.index({ prescription_id: 1 });
WhatsAppAuditLogSchema.index({ order_id: 1 });
WhatsAppAuditLogSchema.index({ is_controlled_substance: 1, timestamp: -1 });
WhatsAppAuditLogSchema.index({ retain_until: 1 }); // For retention policy enforcement
WhatsAppAuditLogSchema.index({ security_flags: 1, timestamp: -1 });
```

### 3.4 WhatsApp Rate Limit Entity

**File**: `src/modules/whatsapp/entities/whatsapp-rate-limit.entity.ts`

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type WhatsAppRateLimitDocument = HydratedDocument<WhatsAppRateLimit>;

@Schema({
  collection: 'whatsapp_rate_limits',
  timestamps: false,
})
export class WhatsAppRateLimit {
  // Composite key: action:number:window (e.g., "PRESCRIPTION_UPLOAD:+2348012345678:2025-01-15")
  @Prop({ type: String, required: true, unique: true, index: true })
  key: string;

  @Prop({ type: Number, default: 0 })
  count: number;

  @Prop({ type: Date, required: true })
  window_start: Date;

  @Prop({ type: Date, required: true, index: true })
  window_end: Date;

  // For pattern detection
  @Prop({ type: [Date], default: [] })
  timestamps: Date[];
}

export const WhatsAppRateLimitSchema = SchemaFactory.createForClass(WhatsAppRateLimit);

// TTL index - auto-delete after window expires
WhatsAppRateLimitSchema.index({ window_end: 1 }, { expireAfterSeconds: 3600 });
```

### 3.5 WhatsApp Prescription Queue Entity

**File**: `src/modules/whatsapp/entities/whatsapp-prescription-queue.entity.ts`

```typescript
import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type WhatsAppPrescriptionQueueDocument = HydratedDocument<WhatsAppPrescriptionQueue>;

export enum QueueType {
  OCR_REVIEW = 'OCR_REVIEW',                     // 70-89% confidence
  MANUAL_ENTRY = 'MANUAL_ENTRY',                 // 50-69% confidence
  CONTROLLED_SUBSTANCE = 'CONTROLLED_SUBSTANCE', // Controlled drug detected
  VERIFICATION_FAILED = 'VERIFICATION_FAILED',   // Tier 1/2 verification failed
  PHARMACIST_ESCALATION = 'PHARMACIST_ESCALATION', // Escalated from chatbot
  CLARIFICATION_RESPONSE = 'CLARIFICATION_RESPONSE', // Patient responded to clarification
}

export enum QueuePriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum QueueStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ESCALATED = 'ESCALATED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

export enum ReviewAction {
  APPROVED = 'APPROVED',
  CORRECTED = 'CORRECTED',
  REJECTED = 'REJECTED',
  ESCALATED = 'ESCALATED',
  CLARIFICATION_REQUESTED = 'CLARIFICATION_REQUESTED',
}

@Schema({
  collection: 'whatsapp_prescription_queue',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class WhatsAppPrescriptionQueue {
  // Source tracking
  @Prop({ type: String, required: true, index: true })
  whatsapp_number: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true })
  patient_id: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'WhatsAppSession' })
  session_id: Types.ObjectId;

  // Link to prescription upload
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'PatientPrescriptionUpload', index: true })
  prescription_upload_id: Types.ObjectId;

  // Image data
  @Prop({ type: String, required: true })
  image_s3_key: string;

  @Prop({ type: String })
  image_s3_url: string; // Presigned URL (regenerated on access)

  @Prop({ type: String })
  image_thumbnail_s3_key: string;

  // OCR extraction results
  @Prop(
    raw({
      raw_text: { type: String },
      overall_confidence: { type: Number },
      extracted_fields: {
        type: mongoose.Schema.Types.Mixed,
        // Structure: { field_name: { value: string, confidence: number } }
      },
      low_confidence_fields: [{ type: String }],
      processing_time_ms: { type: Number },
      ocr_provider: { type: String },
    }),
  )
  ocr_data: {
    raw_text: string;
    overall_confidence: number;
    extracted_fields: Record<string, { value: string; confidence: number }>;
    low_confidence_fields: string[];
    processing_time_ms: number;
    ocr_provider: string;
  };

  // Queue metadata
  @Prop({ type: String, enum: QueueType, required: true, index: true })
  queue_type: QueueType;

  @Prop({ type: String, enum: QueuePriority, default: QueuePriority.NORMAL, index: true })
  priority: QueuePriority;

  @Prop({ type: String, enum: QueueStatus, default: QueueStatus.PENDING, index: true })
  status: QueueStatus;

  @Prop({ type: String })
  queue_reason: string; // Why it was added to this queue

  // Assignment
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true })
  assigned_to: Types.ObjectId;

  @Prop({ type: Date })
  assigned_at: Date;

  // Review results
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  reviewed_by: Types.ObjectId;

  @Prop({ type: Date })
  reviewed_at: Date;

  @Prop({ type: String, enum: ReviewAction })
  review_action: ReviewAction;

  @Prop(
    raw([
      {
        field: { type: String },
        original_value: { type: String },
        corrected_value: { type: String },
        corrected_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        corrected_at: { type: Date },
      },
    ]),
  )
  corrections_made: Array<{
    field: string;
    original_value: string;
    corrected_value: string;
    corrected_by: Types.ObjectId;
    corrected_at: Date;
  }>;

  @Prop({ type: String })
  review_notes: string;

  @Prop({ type: String })
  rejection_reason: string;

  // Controlled substance verification (if applicable)
  @Prop(
    raw({
      schedule: { type: String },
      medications_flagged: [{ type: String }],
      verification_checklist: [
        {
          item: { type: String },
          completed: { type: Boolean, default: false },
          completed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
          completed_at: { type: Date },
          notes: { type: String },
        },
      ],
      prescriber_contacted: { type: Boolean, default: false },
      prescriber_verified_at: { type: Date },
      pdmp_checked: { type: Boolean, default: false },
      pdmp_check_result: { type: String },
    }),
  )
  controlled_substance_data: {
    schedule: string;
    medications_flagged: string[];
    verification_checklist: Array<{
      item: string;
      completed: boolean;
      completed_by: Types.ObjectId;
      completed_at: Date;
      notes: string;
    }>;
    prescriber_contacted: boolean;
    prescriber_verified_at: Date;
    pdmp_checked: boolean;
    pdmp_check_result: string;
  };

  // SLA tracking
  @Prop({ type: Date, required: true, index: true })
  sla_deadline: Date;

  @Prop({ type: Boolean, default: false })
  sla_breached: boolean;

  @Prop({ type: Date })
  sla_breached_at: Date;

  // Patient communication
  @Prop({ type: Boolean, default: false })
  patient_notified: boolean;

  @Prop({ type: Date })
  patient_notified_at: Date;

  @Prop({ type: String })
  patient_notification_message: string;

  @Prop({ type: Boolean, default: false })
  patient_response_needed: boolean;

  @Prop({ type: String })
  patient_response: string;

  @Prop({ type: Date })
  patient_responded_at: Date;

  // Escalation history
  @Prop(
    raw([
      {
        from_user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        to_user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        reason: { type: String },
        escalated_at: { type: Date },
      },
    ]),
  )
  escalation_history: Array<{
    from_user: Types.ObjectId;
    to_user: Types.ObjectId;
    reason: string;
    escalated_at: Date;
  }>;

  // Timestamps
  created_at: Date;
  updated_at: Date;
}

export const WhatsAppPrescriptionQueueSchema = SchemaFactory.createForClass(
  WhatsAppPrescriptionQueue,
);

// Indexes for queue queries
WhatsAppPrescriptionQueueSchema.index({ queue_type: 1, status: 1, priority: -1, created_at: 1 });
WhatsAppPrescriptionQueueSchema.index({ assigned_to: 1, status: 1 });
WhatsAppPrescriptionQueueSchema.index({ sla_deadline: 1, sla_breached: 1 });
WhatsAppPrescriptionQueueSchema.index({ patient_id: 1, created_at: -1 });
```

---

## 4. Service Implementation

### 4.1 WhatsApp Identity Service

**File**: `src/modules/whatsapp/services/whatsapp-identity.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import {
  WhatsAppIdentity,
  WhatsAppIdentityDocument,
  IdentityStatus,
  VerificationMethod,
} from '../entities/whatsapp-identity.entity';
import { UsersService } from '../../users/users.service';
import { GeneralHelpers } from '../../../core/utils/general.helpers';
import { TwilioService } from '../../../common/external/twilio/twilio.service';

@Injectable()
export class WhatsAppIdentityService {
  private readonly logger = new Logger(WhatsAppIdentityService.name);

  constructor(
    @InjectModel(WhatsAppIdentity.name)
    private identityModel: Model<WhatsAppIdentityDocument>,
    private usersService: UsersService,
    private generalHelpers: GeneralHelpers,
    private twilioService: TwilioService,
    private configService: ConfigService,
  ) {}

  /**
   * Get identity by WhatsApp number, creating pending if not exists
   */
  async getOrCreateIdentity(whatsappNumber: string): Promise<WhatsAppIdentityDocument> {
    const normalized = this.normalizePhoneNumber(whatsappNumber);

    let identity = await this.identityModel.findOne({ whatsapp_number: normalized });

    if (!identity) {
      identity = await this.identityModel.create({
        whatsapp_number: normalized,
        status: IdentityStatus.PENDING_VERIFICATION,
        is_verified: false,
      });
      this.logger.log(`Created new identity for ${normalized}`);
    }

    return identity;
  }

  /**
   * Check if number is verified and not blocked
   */
  async isVerified(whatsappNumber: string): Promise<boolean> {
    const normalized = this.normalizePhoneNumber(whatsappNumber);
    const identity = await this.identityModel.findOne({ whatsapp_number: normalized });

    if (!identity) return false;
    if (identity.status === IdentityStatus.BLOCKED) return false;
    if (identity.block_expires_at && identity.block_expires_at > new Date()) return false;

    return identity.is_verified;
  }

  /**
   * Start OTP verification for existing account
   */
  async initiateAccountLink(
    whatsappNumber: string,
    emailOrPhone: string,
  ): Promise<{ success: boolean; message: string; method?: VerificationMethod }> {
    const normalized = this.normalizePhoneNumber(whatsappNumber);

    // Find user by email or phone
    const user = await this.usersService.findByEmailOrPhone(emailOrPhone);
    if (!user) {
      return {
        success: false,
        message: "I couldn't find an account with that email/phone. Please check and try again, or create a new account.",
      };
    }

    // Check if already linked to another WhatsApp
    const existingLink = await this.identityModel.findOne({
      patient_id: user._id,
      whatsapp_number: { $ne: normalized },
      is_verified: true,
    });

    if (existingLink) {
      return {
        success: false,
        message: 'This account is already linked to another WhatsApp number. Please unlink it first from your app settings.',
      };
    }

    // Generate and send OTP
    const otp = this.generateOTP();
    const method = emailOrPhone.includes('@')
      ? VerificationMethod.OTP_EMAIL
      : VerificationMethod.OTP_SMS;

    await this.identityModel.updateOne(
      { whatsapp_number: normalized },
      {
        $set: {
          patient_id: user._id,
          status: IdentityStatus.PENDING_VERIFICATION,
          pending_verification: {
            otp_code: otp,
            otp_expires_at: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
            email_or_phone: emailOrPhone,
            attempts: 0,
          },
        },
      },
      { upsert: true },
    );

    // Send OTP
    if (method === VerificationMethod.OTP_EMAIL) {
      await this.sendEmailOTP(user.email, otp, user.profile?.first_name);
    } else {
      await this.twilioService.sendSMS(emailOrPhone, `Your Rapid Capsule verification code is: ${otp}`);
    }

    return {
      success: true,
      message: `I've sent a 6-digit verification code to your ${method === VerificationMethod.OTP_EMAIL ? 'email' : 'phone'}. Please enter it here.`,
      method,
    };
  }

  /**
   * Verify OTP and complete account link
   */
  async verifyOTP(
    whatsappNumber: string,
    otpCode: string,
  ): Promise<{ success: boolean; message: string; patientName?: string }> {
    const normalized = this.normalizePhoneNumber(whatsappNumber);
    const identity = await this.identityModel.findOne({ whatsapp_number: normalized });

    if (!identity || !identity.pending_verification) {
      return { success: false, message: 'No pending verification found. Please start over.' };
    }

    // Check expiry
    if (identity.pending_verification.otp_expires_at < new Date()) {
      return { success: false, message: 'Verification code has expired. Please request a new one.' };
    }

    // Check attempts
    if (identity.pending_verification.attempts >= 5) {
      await this.blockIdentity(normalized, 'Too many failed OTP attempts', 24);
      return {
        success: false,
        message: 'Too many failed attempts. Your WhatsApp has been temporarily blocked. Please try again in 24 hours.',
      };
    }

    // Verify OTP
    if (identity.pending_verification.otp_code !== otpCode) {
      await this.identityModel.updateOne(
        { whatsapp_number: normalized },
        {
          $inc: { 'pending_verification.attempts': 1 },
          $set: { last_failed_attempt: new Date() },
        },
      );
      const remaining = 5 - identity.pending_verification.attempts - 1;
      return {
        success: false,
        message: `Incorrect code. ${remaining} attempts remaining. Please try again.`,
      };
    }

    // Success - link account
    const user = await this.usersService.findOne(identity.patient_id);

    await this.identityModel.updateOne(
      { whatsapp_number: normalized },
      {
        $set: {
          is_verified: true,
          status: IdentityStatus.VERIFIED,
          verified_at: new Date(),
          verification_method: identity.pending_verification.email_or_phone.includes('@')
            ? VerificationMethod.OTP_EMAIL
            : VerificationMethod.OTP_SMS,
          next_reverification_due: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        },
        $unset: { pending_verification: 1 },
      },
    );

    const firstName = user?.profile?.first_name || 'there';

    return {
      success: true,
      message: `Account linked successfully! Hello ${firstName}, your WhatsApp is now connected to your Rapid Capsule account.`,
      patientName: firstName,
    };
  }

  /**
   * Block an identity temporarily
   */
  async blockIdentity(whatsappNumber: string, reason: string, hours: number): Promise<void> {
    const normalized = this.normalizePhoneNumber(whatsappNumber);
    await this.identityModel.updateOne(
      { whatsapp_number: normalized },
      {
        $set: {
          status: IdentityStatus.BLOCKED,
          blocked_at: new Date(),
          blocked_reason: reason,
          block_expires_at: new Date(Date.now() + hours * 60 * 60 * 1000),
        },
      },
    );
  }

  /**
   * Unlink WhatsApp from account
   */
  async unlinkAccount(whatsappNumber: string): Promise<void> {
    const normalized = this.normalizePhoneNumber(whatsappNumber);
    await this.identityModel.updateOne(
      { whatsapp_number: normalized },
      {
        $set: {
          status: IdentityStatus.UNLINKED,
          is_verified: false,
        },
        $unset: { patient_id: 1 },
      },
    );
  }

  /**
   * Record activity for an identity
   */
  async recordActivity(
    whatsappNumber: string,
    activityType: 'message' | 'prescription' | 'order',
  ): Promise<void> {
    const normalized = this.normalizePhoneNumber(whatsappNumber);
    const update: any = {
      $set: { last_message_at: new Date() },
      $inc: { total_messages: 1 },
    };

    if (activityType === 'prescription') {
      update.$inc.total_prescriptions = 1;
    } else if (activityType === 'order') {
      update.$inc.total_orders = 1;
    }

    await this.identityModel.updateOne({ whatsapp_number: normalized }, update);
  }

  // Helper methods
  private normalizePhoneNumber(phone: string): string {
    // Remove 'whatsapp:' prefix if present
    let normalized = phone.replace('whatsapp:', '');
    // Ensure E.164 format
    if (!normalized.startsWith('+')) {
      normalized = '+' + normalized;
    }
    return normalized;
  }

  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async sendEmailOTP(email: string, otp: string, name?: string): Promise<void> {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Verify Your WhatsApp</h2>
        <p>Hi ${name || 'there'},</p>
        <p>Your verification code to link your WhatsApp to Rapid Capsule is:</p>
        <div style="font-size: 32px; font-weight: bold; text-align: center; padding: 20px; background: #f5f5f5; border-radius: 8px; margin: 20px 0;">
          ${otp}
        </div>
        <p>This code expires in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `;

    await this.generalHelpers.generateEmailAndSend({
      email,
      subject: 'Verify Your WhatsApp - Rapid Capsule',
      emailBody: htmlContent,
    });
  }
}
```

### 4.2 WhatsApp Session Service

**File**: `src/modules/whatsapp/services/whatsapp-session.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  WhatsAppSession,
  WhatsAppSessionDocument,
  FlowType,
} from '../entities/whatsapp-session.entity';
import { SESSION_CONFIG } from '../constants/session.constant';

@Injectable()
export class WhatsAppSessionService {
  private readonly logger = new Logger(WhatsAppSessionService.name);

  constructor(
    @InjectModel(WhatsAppSession.name)
    private sessionModel: Model<WhatsAppSessionDocument>,
  ) {}

  /**
   * Get or create session for a WhatsApp number
   */
  async getOrCreateSession(
    whatsappNumber: string,
    patientId?: Types.ObjectId,
  ): Promise<WhatsAppSessionDocument> {
    const now = new Date();

    // Find existing active session
    let session = await this.sessionModel.findOne({
      whatsapp_number: whatsappNumber,
      is_expired: false,
      expires_at: { $gt: now },
    });

    if (session) {
      // Update last activity
      session.last_message_at = now;
      session.expires_at = new Date(now.getTime() + SESSION_CONFIG.IDLE_TIMEOUT_MS);
      session.messages_in_session += 1;
      await session.save();
      return session;
    }

    // Create new session
    session = await this.sessionModel.create({
      whatsapp_number: whatsappNumber,
      patient_id: patientId,
      current_flow: FlowType.IDLE,
      flow_step: 0,
      flow_data: {},
      last_message_at: now,
      session_started_at: now,
      expires_at: new Date(now.getTime() + SESSION_CONFIG.IDLE_TIMEOUT_MS),
      messages_in_session: 1,
    });

    this.logger.log(`Created new session for ${whatsappNumber}`);
    return session;
  }

  /**
   * Check if session has timed out
   */
  async checkTimeout(session: WhatsAppSessionDocument): Promise<{
    expired: boolean;
    message?: string;
    shouldWarn?: boolean;
  }> {
    const now = new Date();
    const timeSinceActivity = now.getTime() - session.last_message_at.getTime();

    // Check absolute max session duration
    const sessionDuration = now.getTime() - session.session_started_at.getTime();
    if (sessionDuration > SESSION_CONFIG.MAX_SESSION_DURATION_MS) {
      await this.expireSession(session, 'MAX_DURATION_EXCEEDED');
      return {
        expired: true,
        message: "Your session has ended (maximum 4 hours). Please send 'hi' to start a new session.",
      };
    }

    // Check idle timeout
    if (timeSinceActivity > SESSION_CONFIG.IDLE_TIMEOUT_MS) {
      await this.expireSession(session, 'IDLE_TIMEOUT');
      return {
        expired: true,
        message: "Your session has expired due to inactivity. Please send 'hi' to start a new session.",
      };
    }

    // Check if approaching timeout (for active flows)
    if (
      session.current_flow !== FlowType.IDLE &&
      !session.timeout_warning_sent &&
      timeSinceActivity > SESSION_CONFIG.IDLE_TIMEOUT_MS - SESSION_CONFIG.WARNING_BEFORE_TIMEOUT_MS
    ) {
      return {
        expired: false,
        shouldWarn: true,
      };
    }

    return { expired: false };
  }

  /**
   * Update session flow
   */
  async updateFlow(
    sessionId: Types.ObjectId,
    flow: FlowType,
    step: number,
    data?: Record<string, any>,
  ): Promise<WhatsAppSessionDocument> {
    const update: any = {
      current_flow: flow,
      flow_step: step,
      last_message_at: new Date(),
      timeout_warning_sent: false,
    };

    if (data) {
      update.flow_data = data;
    }

    update.expires_at = new Date(Date.now() + SESSION_CONFIG.IDLE_TIMEOUT_MS);

    return this.sessionModel.findByIdAndUpdate(sessionId, { $set: update }, { new: true });
  }

  /**
   * Add data to current flow
   */
  async addFlowData(
    sessionId: Types.ObjectId,
    key: string,
    value: any,
  ): Promise<WhatsAppSessionDocument> {
    return this.sessionModel.findByIdAndUpdate(
      sessionId,
      {
        $set: {
          [`flow_data.${key}`]: value,
          last_message_at: new Date(),
          expires_at: new Date(Date.now() + SESSION_CONFIG.IDLE_TIMEOUT_MS),
        },
      },
      { new: true },
    );
  }

  /**
   * Reset session to idle
   */
  async resetToIdle(sessionId: Types.ObjectId): Promise<WhatsAppSessionDocument> {
    return this.sessionModel.findByIdAndUpdate(
      sessionId,
      {
        $set: {
          current_flow: FlowType.IDLE,
          flow_step: 0,
          flow_data: {},
          last_message_at: new Date(),
          expires_at: new Date(Date.now() + SESSION_CONFIG.IDLE_TIMEOUT_MS),
          timeout_warning_sent: false,
        },
      },
      { new: true },
    );
  }

  /**
   * Assign pharmacist for human handoff
   */
  async assignPharmacist(
    sessionId: Types.ObjectId,
    pharmacistId: Types.ObjectId,
    reason: string,
  ): Promise<WhatsAppSessionDocument> {
    return this.sessionModel.findByIdAndUpdate(
      sessionId,
      {
        $set: {
          current_flow: FlowType.PHARMACIST_CHAT,
          assigned_pharmacist: pharmacistId,
          handoff_at: new Date(),
          handoff_reason: reason,
          is_human_takeover: true,
        },
      },
      { new: true },
    );
  }

  /**
   * Expire a session
   */
  private async expireSession(
    session: WhatsAppSessionDocument,
    reason: string,
  ): Promise<void> {
    await this.sessionModel.updateOne(
      { _id: session._id },
      {
        $set: {
          is_expired: true,
          current_flow: FlowType.IDLE,
          flow_step: 0,
          flow_data: {},
        },
      },
    );

    this.logger.log(`Session expired for ${session.whatsapp_number}: ${reason}`);
  }

  /**
   * Mark timeout warning as sent
   */
  async markWarningsSent(sessionId: Types.ObjectId): Promise<void> {
    await this.sessionModel.updateOne(
      { _id: sessionId },
      { $set: { timeout_warning_sent: true } },
    );
  }
}
```

### 4.3 WhatsApp Rate Limiter Service

**File**: `src/modules/whatsapp/services/whatsapp-rate-limiter.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WhatsAppRateLimit, WhatsAppRateLimitDocument } from '../entities/whatsapp-rate-limit.entity';
import { RATE_LIMITS } from '../constants/rate-limits.constant';

export interface RateLimitResult {
  allowed: boolean;
  reason?: string;
  retry_after?: Date;
  message?: string;
  remaining?: number;
}

@Injectable()
export class WhatsAppRateLimiterService {
  private readonly logger = new Logger(WhatsAppRateLimiterService.name);

  constructor(
    @InjectModel(WhatsAppRateLimit.name)
    private rateLimitModel: Model<WhatsAppRateLimitDocument>,
  ) {}

  /**
   * Check if action is within rate limits
   */
  async checkRateLimit(
    action: string,
    whatsappNumber: string,
  ): Promise<RateLimitResult> {
    const limits = RATE_LIMITS[action];
    if (!limits) {
      return { allowed: true };
    }

    const now = new Date();

    // Check per-number daily limit
    if (limits.per_number_per_day) {
      const dayKey = this.getDayKey(action, whatsappNumber, now);
      const dayCount = await this.getCount(dayKey);

      if (dayCount >= limits.per_number_per_day) {
        return {
          allowed: false,
          reason: 'DAILY_LIMIT_EXCEEDED',
          retry_after: this.getNextDayStart(now),
          message: `You've reached the daily limit (${limits.per_number_per_day}) for this action. Please try again tomorrow.`,
          remaining: 0,
        };
      }
    }

    // Check per-number hourly limit
    if (limits.per_number_per_hour) {
      const hourKey = this.getHourKey(action, whatsappNumber, now);
      const hourCount = await this.getCount(hourKey);

      if (hourCount >= limits.per_number_per_hour) {
        const nextHour = this.getNextHourStart(now);
        const minutesRemaining = Math.ceil((nextHour.getTime() - now.getTime()) / 60000);
        return {
          allowed: false,
          reason: 'HOURLY_LIMIT_EXCEEDED',
          retry_after: nextHour,
          message: `Too many requests. Please wait ${minutesRemaining} minutes before trying again.`,
          remaining: 0,
        };
      }
    }

    // Calculate remaining
    let remaining: number | undefined;
    if (limits.per_number_per_day) {
      const dayKey = this.getDayKey(action, whatsappNumber, now);
      const dayCount = await this.getCount(dayKey);
      remaining = limits.per_number_per_day - dayCount;
    }

    return { allowed: true, remaining };
  }

  /**
   * Record an action for rate limiting
   */
  async recordAction(action: string, whatsappNumber: string): Promise<void> {
    const now = new Date();

    // Increment daily counter
    const dayKey = this.getDayKey(action, whatsappNumber, now);
    await this.incrementCounter(dayKey, 'day', now);

    // Increment hourly counter
    const hourKey = this.getHourKey(action, whatsappNumber, now);
    await this.incrementCounter(hourKey, 'hour', now);
  }

  /**
   * Get current count for a key
   */
  private async getCount(key: string): Promise<number> {
    const record = await this.rateLimitModel.findOne({ key });
    return record?.count || 0;
  }

  /**
   * Increment counter for a key
   */
  private async incrementCounter(
    key: string,
    windowType: 'hour' | 'day',
    now: Date,
  ): Promise<void> {
    const windowStart = windowType === 'hour'
      ? new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours())
      : new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const windowEnd = windowType === 'hour'
      ? new Date(windowStart.getTime() + 60 * 60 * 1000)
      : new Date(windowStart.getTime() + 24 * 60 * 60 * 1000);

    await this.rateLimitModel.updateOne(
      { key },
      {
        $inc: { count: 1 },
        $push: { timestamps: now },
        $setOnInsert: {
          window_start: windowStart,
          window_end: windowEnd,
        },
      },
      { upsert: true },
    );
  }

  // Key generation helpers
  private getDayKey(action: string, number: string, date: Date): string {
    return `${action}:${number}:${date.toISOString().split('T')[0]}`;
  }

  private getHourKey(action: string, number: string, date: Date): string {
    return `${action}:${number}:${date.toISOString().split(':')[0]}`;
  }

  private getNextDayStart(date: Date): Date {
    const next = new Date(date);
    next.setDate(next.getDate() + 1);
    next.setHours(0, 0, 0, 0);
    return next;
  }

  private getNextHourStart(date: Date): Date {
    const next = new Date(date);
    next.setHours(next.getHours() + 1, 0, 0, 0);
    return next;
  }
}
```

### 4.4 WhatsApp Queue Service

**File**: `src/modules/whatsapp/services/whatsapp-queue.service.ts`

```typescript
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  WhatsAppPrescriptionQueue,
  WhatsAppPrescriptionQueueDocument,
  QueueType,
  QueuePriority,
  QueueStatus,
  ReviewAction,
} from '../entities/whatsapp-prescription-queue.entity';
import { WhatsAppMessageService } from './whatsapp-message.service';
import { SLA_CONFIG } from '../constants/sla.constant';

export interface QueueStats {
  total_pending: number;
  by_type: Record<string, number>;
  by_priority: Record<string, number>;
  sla_status: {
    within_sla: number;
    approaching_breach: number;
    breached: number;
  };
  avg_processing_time_mins: number;
  oldest_pending_mins: number;
}

@Injectable()
export class WhatsAppQueueService {
  private readonly logger = new Logger(WhatsAppQueueService.name);

  constructor(
    @InjectModel(WhatsAppPrescriptionQueue.name)
    private queueModel: Model<WhatsAppPrescriptionQueueDocument>,
    private messageService: WhatsAppMessageService,
  ) {}

  /**
   * Add prescription to review queue
   */
  async addToQueue(params: {
    whatsappNumber: string;
    patientId: Types.ObjectId;
    sessionId: Types.ObjectId;
    prescriptionUploadId: Types.ObjectId;
    imageS3Key: string;
    ocrData: any;
    queueType: QueueType;
    priority?: QueuePriority;
    reason?: string;
    controlledSubstanceData?: any;
  }): Promise<WhatsAppPrescriptionQueueDocument> {
    const priority = params.priority || this.determinePriority(params.queueType, params.ocrData);
    const slaDeadline = this.calculateSLADeadline(params.queueType, priority);

    const queueItem = await this.queueModel.create({
      whatsapp_number: params.whatsappNumber,
      patient_id: params.patientId,
      session_id: params.sessionId,
      prescription_upload_id: params.prescriptionUploadId,
      image_s3_key: params.imageS3Key,
      ocr_data: params.ocrData,
      queue_type: params.queueType,
      priority,
      status: QueueStatus.PENDING,
      queue_reason: params.reason,
      sla_deadline: slaDeadline,
      controlled_substance_data: params.controlledSubstanceData,
    });

    // Notify patient
    await this.notifyPatientQueued(params.whatsappNumber, params.queueType);

    this.logger.log(
      `Added to queue: ${queueItem._id} (${params.queueType}, ${priority})`,
    );

    return queueItem;
  }

  /**
   * Get queue statistics for dashboard
   */
  async getQueueStats(): Promise<QueueStats> {
    const now = new Date();
    const thirtyMinsFromNow = new Date(now.getTime() + 30 * 60 * 1000);

    const pipeline = [
      { $match: { status: QueueStatus.PENDING } },
      {
        $facet: {
          total: [{ $count: 'count' }],
          by_type: [{ $group: { _id: '$queue_type', count: { $sum: 1 } } }],
          by_priority: [{ $group: { _id: '$priority', count: { $sum: 1 } } }],
          sla_within: [
            { $match: { sla_deadline: { $gt: thirtyMinsFromNow } } },
            { $count: 'count' },
          ],
          sla_approaching: [
            { $match: { sla_deadline: { $lte: thirtyMinsFromNow, $gt: now } } },
            { $count: 'count' },
          ],
          sla_breached: [
            { $match: { sla_deadline: { $lte: now } } },
            { $count: 'count' },
          ],
          oldest: [{ $sort: { created_at: 1 } }, { $limit: 1 }],
        },
      },
    ];

    const [result] = await this.queueModel.aggregate(pipeline);

    // Get average processing time from completed items
    const avgPipeline = [
      {
        $match: {
          status: QueueStatus.COMPLETED,
          reviewed_at: { $exists: true },
        },
      },
      {
        $project: {
          processing_time: {
            $divide: [
              { $subtract: ['$reviewed_at', '$created_at'] },
              60000, // Convert to minutes
            ],
          },
        },
      },
      { $group: { _id: null, avg: { $avg: '$processing_time' } } },
    ];
    const [avgResult] = await this.queueModel.aggregate(avgPipeline);

    const oldestCreatedAt = result.oldest[0]?.created_at;
    const oldestMins = oldestCreatedAt
      ? Math.floor((now.getTime() - new Date(oldestCreatedAt).getTime()) / 60000)
      : 0;

    return {
      total_pending: result.total[0]?.count || 0,
      by_type: Object.fromEntries(
        result.by_type.map((t: any) => [t._id, t.count]),
      ),
      by_priority: Object.fromEntries(
        result.by_priority.map((p: any) => [p._id, p.count]),
      ),
      sla_status: {
        within_sla: result.sla_within[0]?.count || 0,
        approaching_breach: result.sla_approaching[0]?.count || 0,
        breached: result.sla_breached[0]?.count || 0,
      },
      avg_processing_time_mins: Math.round(avgResult?.avg || 0),
      oldest_pending_mins: oldestMins,
    };
  }

  /**
   * Get queue items with pagination
   */
  async getQueueItems(params: {
    type?: QueueType;
    status?: QueueStatus;
    priority?: QueuePriority;
    assignedTo?: Types.ObjectId;
    page?: number;
    limit?: number;
  }): Promise<{
    items: WhatsAppPrescriptionQueueDocument[];
    pagination: { total: number; page: number; limit: number; pages: number };
  }> {
    const { type, status, priority, assignedTo, page = 1, limit = 20 } = params;

    const filter: any = {};
    if (type) filter.queue_type = type;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assigned_to = assignedTo;

    const total = await this.queueModel.countDocuments(filter);
    const items = await this.queueModel
      .find(filter)
      .sort({ priority: -1, created_at: 1 }) // Highest priority first, then oldest
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('patient_id', 'profile.first_name profile.last_name email')
      .populate('assigned_to', 'profile.first_name profile.last_name')
      .populate('prescription_upload_id')
      .exec();

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Claim a queue item
   */
  async claimItem(
    itemId: Types.ObjectId,
    pharmacistId: Types.ObjectId,
  ): Promise<WhatsAppPrescriptionQueueDocument> {
    const item = await this.queueModel.findOneAndUpdate(
      {
        _id: itemId,
        status: QueueStatus.PENDING,
        $or: [
          { assigned_to: { $exists: false } },
          { assigned_to: null },
        ],
      },
      {
        $set: {
          assigned_to: pharmacistId,
          assigned_at: new Date(),
          status: QueueStatus.IN_PROGRESS,
        },
      },
      { new: true },
    );

    if (!item) {
      throw new NotFoundException('Queue item not found or already claimed');
    }

    return item;
  }

  /**
   * Complete review of a queue item
   */
  async completeReview(params: {
    itemId: Types.ObjectId;
    pharmacistId: Types.ObjectId;
    action: ReviewAction;
    corrections?: Array<{ field: string; original_value: string; corrected_value: string }>;
    notes?: string;
    rejectionReason?: string;
  }): Promise<WhatsAppPrescriptionQueueDocument> {
    const now = new Date();

    const update: any = {
      reviewed_by: params.pharmacistId,
      reviewed_at: now,
      review_action: params.action,
      review_notes: params.notes,
    };

    if (params.action === ReviewAction.REJECTED) {
      update.status = QueueStatus.REJECTED;
      update.rejection_reason = params.rejectionReason;
    } else if (params.action === ReviewAction.ESCALATED) {
      update.status = QueueStatus.ESCALATED;
    } else {
      update.status = QueueStatus.COMPLETED;
    }

    if (params.corrections?.length) {
      update.corrections_made = params.corrections.map((c) => ({
        ...c,
        corrected_by: params.pharmacistId,
        corrected_at: now,
      }));
    }

    const item = await this.queueModel.findByIdAndUpdate(
      params.itemId,
      { $set: update },
      { new: true },
    );

    if (!item) {
      throw new NotFoundException('Queue item not found');
    }

    // Notify patient of result
    await this.notifyPatientResult(item);

    return item;
  }

  // Private helpers
  private determinePriority(queueType: QueueType, ocrData: any): QueuePriority {
    if (queueType === QueueType.CONTROLLED_SUBSTANCE) {
      return QueuePriority.HIGH;
    }
    if (queueType === QueueType.VERIFICATION_FAILED) {
      return QueuePriority.NORMAL;
    }
    if (ocrData?.overall_confidence < 60) {
      return QueuePriority.NORMAL;
    }
    return QueuePriority.NORMAL;
  }

  private calculateSLADeadline(queueType: QueueType, priority: QueuePriority): Date {
    const slaMinutes = SLA_CONFIG[queueType]?.[priority] || 120; // Default 2 hours
    return new Date(Date.now() + slaMinutes * 60 * 1000);
  }

  private async notifyPatientQueued(
    whatsappNumber: string,
    queueType: QueueType,
  ): Promise<void> {
    let message: string;

    switch (queueType) {
      case QueueType.CONTROLLED_SUBSTANCE:
        message =
          "⚠️ Your prescription contains a controlled medication that requires additional verification.\n\n" +
          "A pharmacist will review your prescription and may contact you or your prescriber.\n\n" +
          "Estimated review time: 2-4 hours\n\n" +
          "You'll receive a notification when complete.";
        break;
      case QueueType.OCR_REVIEW:
      case QueueType.MANUAL_ENTRY:
        message =
          "📋 Your prescription has been received and is being reviewed by our pharmacist.\n\n" +
          "Estimated review time: 30-60 minutes\n\n" +
          "We'll notify you when it's ready to proceed.";
        break;
      default:
        message =
          "📋 Your prescription is being reviewed.\n\n" +
          "We'll notify you when it's ready.";
    }

    await this.messageService.sendTextMessage(whatsappNumber, message);
  }

  private async notifyPatientResult(
    item: WhatsAppPrescriptionQueueDocument,
  ): Promise<void> {
    let message: string;

    switch (item.review_action) {
      case ReviewAction.APPROVED:
      case ReviewAction.CORRECTED:
        message =
          "✅ Your prescription has been verified!\n\n" +
          "You can now proceed with ordering your medications.\n\n" +
          "Reply with 'order' to start your order.";
        break;
      case ReviewAction.REJECTED:
        message =
          `❌ We were unable to verify your prescription.\n\n` +
          `Reason: ${item.rejection_reason || 'Not specified'}\n\n` +
          `Please upload a clearer image or contact your prescriber.\n\n` +
          `Reply 'support' to speak with our team.`;
        break;
      case ReviewAction.CLARIFICATION_REQUESTED:
        message =
          "ℹ️ We need some additional information about your prescription.\n\n" +
          `${item.review_notes || 'Please provide more details.'}\n\n` +
          "Please reply with the requested information.";
        break;
      default:
        return; // Don't notify for escalations
    }

    await this.messageService.sendTextMessage(item.whatsapp_number, message);
  }
}
```

---

## 5. Controller & Webhook Endpoints

### 5.1 WhatsApp Webhook Controller

**File**: `src/modules/whatsapp/controllers/whatsapp-webhook.controller.ts`

```typescript
import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import * as crypto from 'crypto';
import { WhatsAppFlowService } from '../services/whatsapp-flow.service';
import { WhatsAppIdentityService } from '../services/whatsapp-identity.service';
import { WhatsAppSessionService } from '../services/whatsapp-session.service';
import { WhatsAppAuditService } from '../services/whatsapp-audit.service';
import { WhatsAppRateLimiterService } from '../services/whatsapp-rate-limiter.service';
import { WhatsAppMessageService } from '../services/whatsapp-message.service';
import { TwilioWebhookDto } from '../dto/twilio-webhook.dto';

@ApiTags('WhatsApp Webhook')
@Controller('webhooks/whatsapp')
export class WhatsAppWebhookController {
  private readonly logger = new Logger(WhatsAppWebhookController.name);

  constructor(
    private configService: ConfigService,
    private flowService: WhatsAppFlowService,
    private identityService: WhatsAppIdentityService,
    private sessionService: WhatsAppSessionService,
    private auditService: WhatsAppAuditService,
    private rateLimiter: WhatsAppRateLimiterService,
    private messageService: WhatsAppMessageService,
  ) {}

  @Post('twilio')
  @HttpCode(200)
  @ApiOperation({ summary: 'Twilio WhatsApp webhook handler' })
  async handleTwilioWebhook(
    @Body() body: TwilioWebhookDto,
    @Headers('x-twilio-signature') signature: string,
  ): Promise<string> {
    const startTime = Date.now();

    try {
      // 1. Validate Twilio signature
      this.validateTwilioSignature(body, signature);

      // 2. Parse incoming message
      const whatsappNumber = body.From.replace('whatsapp:', '');
      const messageType = this.determineMessageType(body);

      this.logger.log(`Incoming ${messageType} from ${whatsappNumber}`);

      // 3. Check message rate limit
      const rateCheck = await this.rateLimiter.checkRateLimit('MESSAGES', whatsappNumber);
      if (!rateCheck.allowed) {
        await this.messageService.sendTextMessage(
          whatsappNumber,
          rateCheck.message || 'Too many messages. Please wait.',
        );
        return '<Response></Response>';
      }

      // 4. Get or create identity
      const identity = await this.identityService.getOrCreateIdentity(whatsappNumber);

      // 5. Check if blocked
      if (identity.status === 'BLOCKED') {
        await this.messageService.sendTextMessage(
          whatsappNumber,
          'Your WhatsApp access has been temporarily suspended. Please contact support.',
        );
        return '<Response></Response>';
      }

      // 6. Get or create session
      const session = await this.sessionService.getOrCreateSession(
        whatsappNumber,
        identity.patient_id,
      );

      // 7. Check session timeout
      const timeoutCheck = await this.sessionService.checkTimeout(session);
      if (timeoutCheck.expired) {
        await this.messageService.sendTextMessage(whatsappNumber, timeoutCheck.message);
        return '<Response></Response>';
      }

      // 8. Log inbound message
      await this.auditService.logInboundMessage({
        whatsappNumber,
        patientId: identity.patient_id,
        sessionId: session._id,
        messageId: body.MessageSid,
        messageType,
        body,
        flow: session.current_flow,
        step: session.flow_step,
      });

      // 9. Route message through flow handler
      const response = await this.flowService.handleMessage({
        whatsappNumber,
        body,
        messageType,
        identity,
        session,
      });

      // 10. Send response(s)
      for (const msg of response.messages) {
        if (msg.type === 'text') {
          await this.messageService.sendTextMessage(whatsappNumber, msg.content);
        } else if (msg.type === 'interactive') {
          await this.messageService.sendInteractiveMessage(whatsappNumber, msg.content);
        } else if (msg.type === 'template') {
          await this.messageService.sendTemplateMessage(whatsappNumber, msg.templateId, msg.variables);
        }

        // Log each outbound message
        await this.auditService.logOutboundMessage({
          whatsappNumber,
          patientId: identity.patient_id,
          sessionId: session._id,
          messageType: msg.type,
          content: msg.content,
          processingTimeMs: Date.now() - startTime,
        });
      }

      // 11. Record activity
      await this.identityService.recordActivity(whatsappNumber, 'message');

    } catch (error) {
      this.logger.error('WhatsApp webhook error', error);

      try {
        const whatsappNumber = body.From?.replace('whatsapp:', '');
        if (whatsappNumber) {
          await this.messageService.sendTextMessage(
            whatsappNumber,
            "Sorry, something went wrong. Please try again or send 'help' for assistance.",
          );
        }
      } catch (e) {
        this.logger.error('Failed to send error message', e);
      }

      // Log error
      await this.auditService.logError(error, body);
    }

    // Return empty TwiML response (we send messages via API, not TwiML)
    return '<Response></Response>';
  }

  private validateTwilioSignature(body: TwilioWebhookDto, signature: string): void {
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    const webhookUrl = this.configService.get<string>('WHATSAPP_WEBHOOK_URL');

    if (!signature || !authToken) {
      this.logger.warn('Missing signature or auth token');
      throw new UnauthorizedException('Invalid signature');
    }

    // Build data string for validation
    const params = Object.keys(body).sort().map(key => `${key}${body[key]}`).join('');
    const data = webhookUrl + params;

    // Calculate expected signature
    const expectedSignature = crypto
      .createHmac('sha1', authToken)
      .update(Buffer.from(data, 'utf-8'))
      .digest('base64');

    if (signature !== expectedSignature) {
      this.logger.warn('Signature mismatch');
      throw new UnauthorizedException('Invalid signature');
    }
  }

  private determineMessageType(body: TwilioWebhookDto): string {
    if (body.MediaContentType0) {
      return body.MediaContentType0.startsWith('image/') ? 'IMAGE' : 'DOCUMENT';
    }
    if (body.ButtonPayload) return 'BUTTON_RESPONSE';
    if (body.ListId) return 'LIST_RESPONSE';
    return 'TEXT';
  }
}
```

### 5.2 Twilio Webhook DTO

**File**: `src/modules/whatsapp/dto/twilio-webhook.dto.ts`

```typescript
import { IsString, IsOptional } from 'class-validator';

export class TwilioWebhookDto {
  @IsString()
  MessageSid: string;

  @IsString()
  AccountSid: string;

  @IsString()
  From: string; // whatsapp:+2348012345678

  @IsString()
  To: string;

  @IsOptional()
  @IsString()
  Body?: string;

  @IsOptional()
  @IsString()
  MediaContentType0?: string;

  @IsOptional()
  @IsString()
  MediaUrl0?: string;

  @IsOptional()
  @IsString()
  NumMedia?: string;

  @IsOptional()
  @IsString()
  ButtonPayload?: string;

  @IsOptional()
  @IsString()
  ButtonText?: string;

  @IsOptional()
  @IsString()
  ListId?: string;

  @IsOptional()
  @IsString()
  ListTitle?: string;

  @IsOptional()
  @IsString()
  ProfileName?: string;

  @IsOptional()
  @IsString()
  WaId?: string;
}
```

---

## 6. Admin Dashboard Components

### 6.1 WhatsApp Queue Controller (Admin Backend)

**File**: `RC_Admin_Backend/src/modules/dashboard/whatsapp-queue.controller.ts`

```typescript
import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { WhatsAppQueueService } from './whatsapp-queue.service';
import { Types } from 'mongoose';

@ApiTags('WhatsApp Queue')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin-api/whatsapp/queue')
export class WhatsAppQueueController {
  constructor(private queueService: WhatsAppQueueService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get queue statistics' })
  async getQueueStats() {
    return this.queueService.getQueueStats();
  }

  @Get()
  @ApiOperation({ summary: 'Get queue items with filters' })
  async getQueueItems(
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.queueService.getQueueItems({
      type: type as any,
      status: status as any,
      priority: priority as any,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @Get('my-items')
  @ApiOperation({ summary: 'Get items assigned to current pharmacist' })
  async getMyItems(@Request() req: any) {
    return this.queueService.getQueueItems({
      assignedTo: new Types.ObjectId(req.user.id),
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get queue item details' })
  async getQueueItem(@Param('id') id: string) {
    return this.queueService.getItemById(new Types.ObjectId(id));
  }

  @Post(':id/claim')
  @ApiOperation({ summary: 'Claim a queue item' })
  async claimItem(@Param('id') id: string, @Request() req: any) {
    return this.queueService.claimItem(
      new Types.ObjectId(id),
      new Types.ObjectId(req.user.id),
    );
  }

  @Post(':id/release')
  @ApiOperation({ summary: 'Release a claimed queue item' })
  async releaseItem(@Param('id') id: string, @Request() req: any) {
    return this.queueService.releaseItem(
      new Types.ObjectId(id),
      new Types.ObjectId(req.user.id),
    );
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Complete review of queue item' })
  async completeReview(
    @Param('id') id: string,
    @Body() body: {
      action: string;
      corrections?: Array<{ field: string; original_value: string; corrected_value: string }>;
      notes?: string;
      rejectionReason?: string;
    },
    @Request() req: any,
  ) {
    return this.queueService.completeReview({
      itemId: new Types.ObjectId(id),
      pharmacistId: new Types.ObjectId(req.user.id),
      action: body.action as any,
      corrections: body.corrections,
      notes: body.notes,
      rejectionReason: body.rejectionReason,
    });
  }

  @Get(':id/image-url')
  @ApiOperation({ summary: 'Get presigned URL for prescription image' })
  async getImageUrl(@Param('id') id: string) {
    return this.queueService.getPresignedImageUrl(new Types.ObjectId(id));
  }
}
```

### 6.2 Admin Queue Page (Vue)

**File**: `RC_Admin_UI/src/pages/whatsapp/queue/index.vue`

```vue
<template>
  <v-container fluid>
    <!-- Stats Cards -->
    <v-row class="mb-6">
      <v-col cols="12" md="3">
        <v-card>
          <v-card-text class="d-flex align-center">
            <v-avatar color="primary" class="mr-4">
              <v-icon>mdi-clipboard-list</v-icon>
            </v-avatar>
            <div>
              <div class="text-h4">{{ stats.total_pending }}</div>
              <div class="text-caption">Pending Items</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card>
          <v-card-text class="d-flex align-center">
            <v-avatar color="warning" class="mr-4">
              <v-icon>mdi-clock-alert</v-icon>
            </v-avatar>
            <div>
              <div class="text-h4">{{ stats.sla_status?.approaching_breach || 0 }}</div>
              <div class="text-caption">Approaching SLA</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card>
          <v-card-text class="d-flex align-center">
            <v-avatar color="error" class="mr-4">
              <v-icon>mdi-alert</v-icon>
            </v-avatar>
            <div>
              <div class="text-h4">{{ stats.sla_status?.breached || 0 }}</div>
              <div class="text-caption">SLA Breached</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card>
          <v-card-text class="d-flex align-center">
            <v-avatar color="success" class="mr-4">
              <v-icon>mdi-timer</v-icon>
            </v-avatar>
            <div>
              <div class="text-h4">{{ stats.avg_processing_time_mins || 0 }}m</div>
              <div class="text-caption">Avg Processing</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Filters -->
    <v-card class="mb-4">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="3">
            <v-select
              v-model="filters.type"
              :items="queueTypes"
              label="Queue Type"
              clearable
              density="compact"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="filters.status"
              :items="statusOptions"
              label="Status"
              clearable
              density="compact"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="filters.priority"
              :items="priorityOptions"
              label="Priority"
              clearable
              density="compact"
            />
          </v-col>
          <v-col cols="12" md="3" class="d-flex align-center">
            <v-btn color="primary" @click="fetchQueue" :loading="loading">
              <v-icon left>mdi-refresh</v-icon>
              Refresh
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Queue Table -->
    <v-card>
      <v-data-table
        :headers="headers"
        :items="items"
        :loading="loading"
        :items-per-page="20"
        class="elevation-1"
      >
        <template v-slot:item.patient="{ item }">
          <div>
            <div class="font-weight-medium">
              {{ item.patient_id?.profile?.first_name }} {{ item.patient_id?.profile?.last_name }}
            </div>
            <div class="text-caption text-grey">{{ item.whatsapp_number }}</div>
          </div>
        </template>

        <template v-slot:item.queue_type="{ item }">
          <v-chip :color="getTypeColor(item.queue_type)" size="small" label>
            {{ formatQueueType(item.queue_type) }}
          </v-chip>
        </template>

        <template v-slot:item.priority="{ item }">
          <v-chip :color="getPriorityColor(item.priority)" size="small">
            {{ item.priority }}
          </v-chip>
        </template>

        <template v-slot:item.ocr_confidence="{ item }">
          <v-progress-linear
            :model-value="item.ocr_data?.overall_confidence || 0"
            :color="getConfidenceColor(item.ocr_data?.overall_confidence)"
            height="20"
            rounded
          >
            <template v-slot:default>
              {{ Math.round(item.ocr_data?.overall_confidence || 0) }}%
            </template>
          </v-progress-linear>
        </template>

        <template v-slot:item.sla_status="{ item }">
          <v-chip :color="getSLAColor(item)" size="small">
            {{ formatSLAStatus(item) }}
          </v-chip>
        </template>

        <template v-slot:item.created_at="{ item }">
          <div>{{ formatDate(item.created_at) }}</div>
          <div class="text-caption text-grey">{{ formatTimeAgo(item.created_at) }}</div>
        </template>

        <template v-slot:item.actions="{ item }">
          <v-btn
            v-if="!item.assigned_to"
            color="primary"
            size="small"
            @click="claimItem(item)"
          >
            Claim
          </v-btn>
          <v-btn
            v-else
            color="secondary"
            size="small"
            @click="openItem(item)"
          >
            Review
          </v-btn>
        </template>
      </v-data-table>
    </v-card>

    <!-- Review Dialog -->
    <QueueItemDetail
      v-if="selectedItem"
      v-model="showDetail"
      :item="selectedItem"
      @completed="onReviewCompleted"
    />
  </v-container>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useWhatsAppQueueStore } from '@/stores/whatsappQueue';
import QueueItemDetail from './components/QueueItemDetail.vue';
import moment from 'moment';

const store = useWhatsAppQueueStore();

const loading = ref(false);
const stats = ref({});
const items = ref([]);
const showDetail = ref(false);
const selectedItem = ref(null);

const filters = ref({
  type: null,
  status: 'PENDING',
  priority: null,
});

const headers = [
  { title: 'Patient', key: 'patient', width: '200px' },
  { title: 'Type', key: 'queue_type', width: '150px' },
  { title: 'Priority', key: 'priority', width: '100px' },
  { title: 'OCR Confidence', key: 'ocr_confidence', width: '150px' },
  { title: 'SLA Status', key: 'sla_status', width: '120px' },
  { title: 'Created', key: 'created_at', width: '150px' },
  { title: 'Actions', key: 'actions', width: '120px', sortable: false },
];

const queueTypes = [
  { title: 'OCR Review', value: 'OCR_REVIEW' },
  { title: 'Manual Entry', value: 'MANUAL_ENTRY' },
  { title: 'Controlled Substance', value: 'CONTROLLED_SUBSTANCE' },
  { title: 'Verification Failed', value: 'VERIFICATION_FAILED' },
  { title: 'Escalation', value: 'PHARMACIST_ESCALATION' },
];

const statusOptions = [
  { title: 'Pending', value: 'PENDING' },
  { title: 'In Progress', value: 'IN_PROGRESS' },
  { title: 'Completed', value: 'COMPLETED' },
  { title: 'Rejected', value: 'REJECTED' },
];

const priorityOptions = [
  { title: 'Urgent', value: 'URGENT' },
  { title: 'High', value: 'HIGH' },
  { title: 'Normal', value: 'NORMAL' },
  { title: 'Low', value: 'LOW' },
];

const fetchQueue = async () => {
  loading.value = true;
  try {
    const [statsData, queueData] = await Promise.all([
      store.fetchStats(),
      store.fetchQueue(filters.value),
    ]);
    stats.value = statsData;
    items.value = queueData.items;
  } finally {
    loading.value = false;
  }
};

const claimItem = async (item) => {
  await store.claimItem(item._id);
  selectedItem.value = item;
  showDetail.value = true;
  fetchQueue();
};

const openItem = (item) => {
  selectedItem.value = item;
  showDetail.value = true;
};

const onReviewCompleted = () => {
  showDetail.value = false;
  selectedItem.value = null;
  fetchQueue();
};

// Helper functions
const getTypeColor = (type) => {
  const colors = {
    OCR_REVIEW: 'blue',
    MANUAL_ENTRY: 'orange',
    CONTROLLED_SUBSTANCE: 'red',
    VERIFICATION_FAILED: 'purple',
    PHARMACIST_ESCALATION: 'teal',
  };
  return colors[type] || 'grey';
};

const getPriorityColor = (priority) => {
  const colors = {
    URGENT: 'red',
    HIGH: 'orange',
    NORMAL: 'blue',
    LOW: 'grey',
  };
  return colors[priority] || 'grey';
};

const getConfidenceColor = (confidence) => {
  if (confidence >= 80) return 'success';
  if (confidence >= 60) return 'warning';
  return 'error';
};

const getSLAColor = (item) => {
  if (item.sla_breached) return 'error';
  const remaining = new Date(item.sla_deadline) - new Date();
  if (remaining < 30 * 60 * 1000) return 'warning'; // < 30 mins
  return 'success';
};

const formatSLAStatus = (item) => {
  if (item.sla_breached) return 'Breached';
  const remaining = new Date(item.sla_deadline) - new Date();
  if (remaining < 0) return 'Breached';
  return moment.duration(remaining).humanize() + ' left';
};

const formatQueueType = (type) => {
  return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
};

const formatDate = (date) => moment(date).format('MMM DD, HH:mm');
const formatTimeAgo = (date) => moment(date).fromNow();

watch(filters, fetchQueue, { deep: true });

onMounted(fetchQueue);

// Poll for updates every 30 seconds
setInterval(fetchQueue, 30000);
</script>
```

---

## 7. Frontend Patient Components

### 7.1 WhatsApp Link Component

**File**: `RC/src/views/Mainapp/Account/WhatsAppLink.vue`

```vue
<template>
  <div class="whatsapp-link-section">
    <div class="section-header">
      <h3>WhatsApp Integration</h3>
      <p class="section-description">
        Link your WhatsApp to upload prescriptions and order medications via chat.
      </p>
    </div>

    <div v-if="linkedNumber" class="linked-status">
      <div class="status-card linked">
        <div class="status-icon">
          <svg viewBox="0 0 24 24" fill="none" class="whatsapp-icon">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" fill="currentColor"/>
          </svg>
        </div>
        <div class="status-content">
          <span class="status-label">WhatsApp Linked</span>
          <span class="linked-number">{{ formatNumber(linkedNumber) }}</span>
          <span class="linked-date">Linked {{ formatDate(linkedAt) }}</span>
        </div>
        <button class="unlink-btn" @click="showUnlinkConfirm = true">
          Unlink
        </button>
      </div>
    </div>

    <div v-else class="unlinked-status">
      <div class="status-card unlinked">
        <div class="status-icon">
          <svg viewBox="0 0 24 24" fill="none" class="whatsapp-icon">
            <!-- WhatsApp icon SVG -->
          </svg>
        </div>
        <div class="status-content">
          <span class="status-label">WhatsApp Not Linked</span>
          <p class="unlink-description">
            Link your WhatsApp number to:
          </p>
          <ul class="feature-list">
            <li>📷 Upload prescriptions via photo</li>
            <li>💊 Order medications through chat</li>
            <li>🔔 Receive order updates instantly</li>
          </ul>
        </div>
        <button class="link-btn primary-btn" @click="showLinkModal = true">
          Link WhatsApp
        </button>
      </div>
    </div>

    <!-- Link Modal -->
    <WhatsAppLinkModal
      v-if="showLinkModal"
      @close="showLinkModal = false"
      @linked="onLinked"
    />

    <!-- Unlink Confirmation -->
    <ConfirmationModal
      v-if="showUnlinkConfirm"
      title="Unlink WhatsApp?"
      message="You'll no longer be able to upload prescriptions or order via WhatsApp."
      confirm-text="Unlink"
      @confirm="unlinkWhatsApp"
      @cancel="showUnlinkConfirm = false"
    />
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import apiFactory from '@/services/apiFactory';
import WhatsAppLinkModal from './components/WhatsAppLinkModal.vue';
import ConfirmationModal from '@/components/modals/ConfirmationModal.vue';

export default {
  components: { WhatsAppLinkModal, ConfirmationModal },
  setup() {
    const linkedNumber = ref(null);
    const linkedAt = ref(null);
    const showLinkModal = ref(false);
    const showUnlinkConfirm = ref(false);

    const fetchLinkStatus = async () => {
      try {
        const response = await apiFactory.$_getWhatsAppLinkStatus();
        if (response.data?.linked) {
          linkedNumber.value = response.data.whatsapp_number;
          linkedAt.value = response.data.linked_at;
        }
      } catch (error) {
        console.error('Failed to fetch WhatsApp status', error);
      }
    };

    const unlinkWhatsApp = async () => {
      try {
        await apiFactory.$_unlinkWhatsApp();
        linkedNumber.value = null;
        linkedAt.value = null;
        showUnlinkConfirm.value = false;
      } catch (error) {
        console.error('Failed to unlink WhatsApp', error);
      }
    };

    const onLinked = (data) => {
      linkedNumber.value = data.whatsapp_number;
      linkedAt.value = new Date();
      showLinkModal.value = false;
    };

    const formatNumber = (number) => {
      return number.replace(/(\+\d{3})(\d{3})(\d{3})(\d{4})/, '$1 $2 $3 $4');
    };

    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('en-NG', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    };

    onMounted(fetchLinkStatus);

    return {
      linkedNumber,
      linkedAt,
      showLinkModal,
      showUnlinkConfirm,
      unlinkWhatsApp,
      onLinked,
      formatNumber,
      formatDate,
    };
  },
};
</script>

<style lang="scss" scoped>
.whatsapp-link-section {
  padding: 24px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.section-header {
  margin-bottom: 24px;

  h3 {
    font-size: 18px;
    font-weight: 600;
    color: #1a1a1a;
    margin-bottom: 8px;
  }

  .section-description {
    font-size: 14px;
    color: #666;
  }
}

.status-card {
  display: flex;
  align-items: flex-start;
  padding: 20px;
  border-radius: 12px;

  &.linked {
    background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
    border: 1px solid #86efac;
  }

  &.unlinked {
    background: #f8fafc;
    border: 1px dashed #cbd5e1;
  }
}

.status-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  background: #25d366;

  .whatsapp-icon {
    width: 28px;
    height: 28px;
    color: #fff;
  }
}

.status-content {
  flex: 1;

  .status-label {
    display: block;
    font-size: 16px;
    font-weight: 600;
    color: #1a1a1a;
    margin-bottom: 4px;
  }

  .linked-number {
    display: block;
    font-size: 14px;
    color: #166534;
    font-family: monospace;
    margin-bottom: 4px;
  }

  .linked-date {
    font-size: 12px;
    color: #666;
  }
}

.feature-list {
  margin-top: 12px;
  list-style: none;
  padding: 0;

  li {
    font-size: 14px;
    color: #374151;
    margin-bottom: 8px;
  }
}

.link-btn, .unlink-btn {
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;

  &.primary-btn {
    background: #25d366;
    color: #fff;

    &:hover {
      background: #1da851;
    }
  }
}

.unlink-btn {
  background: transparent;
  color: #dc2626;
  border: 1px solid #dc2626;

  &:hover {
    background: #fef2f2;
  }
}
</style>
```

---

## 8. Configuration & Environment

### 8.1 Environment Variables

**Add to RC-Backend `.env`**:

```bash
# WhatsApp Integration (Twilio)
TWILIO_WHATSAPP_NUMBER=+14155238886
WHATSAPP_WEBHOOK_URL=https://api.rapidcapsule.com/webhooks/whatsapp/twilio

# WhatsApp Configuration
WHATSAPP_SESSION_TIMEOUT_MINS=30
WHATSAPP_MAX_SESSION_HOURS=4
WHATSAPP_MAX_PRESCRIPTIONS_PER_DAY=5
WHATSAPP_MAX_ORDERS_PER_DAY=10
WHATSAPP_OCR_AUTO_APPROVE_THRESHOLD=90
WHATSAPP_OCR_REVIEW_THRESHOLD=70
WHATSAPP_OCR_MANUAL_THRESHOLD=50
```

### 8.2 Constants Files

**File**: `src/modules/whatsapp/constants/session.constant.ts`

```typescript
export const SESSION_CONFIG = {
  IDLE_TIMEOUT_MS: 30 * 60 * 1000,           // 30 minutes
  MAX_SESSION_DURATION_MS: 4 * 60 * 60 * 1000, // 4 hours max
  WARNING_BEFORE_TIMEOUT_MS: 5 * 60 * 1000,   // 5 min warning
};
```

**File**: `src/modules/whatsapp/constants/rate-limits.constant.ts`

```typescript
export const RATE_LIMITS = {
  MESSAGES: {
    per_number_per_minute: 20,
    per_number_per_hour: 200,
  },
  PRESCRIPTION_UPLOAD: {
    per_number_per_day: 5,
    per_number_per_hour: 3,
  },
  ORDER_CREATION: {
    per_number_per_day: 10,
    per_number_per_hour: 5,
  },
  VERIFICATION_ATTEMPTS: {
    max_per_hour: 5,
    lockout_duration_hours: 24,
  },
  CONTROLLED_SUBSTANCE: {
    per_number_per_week: 2,
  },
};
```

**File**: `src/modules/whatsapp/constants/sla.constant.ts`

```typescript
export const SLA_CONFIG = {
  // Minutes by queue type and priority
  OCR_REVIEW: {
    URGENT: 30,
    HIGH: 60,
    NORMAL: 120,
    LOW: 240,
  },
  MANUAL_ENTRY: {
    URGENT: 60,
    HIGH: 120,
    NORMAL: 240,
    LOW: 480,
  },
  CONTROLLED_SUBSTANCE: {
    URGENT: 60,
    HIGH: 120,
    NORMAL: 180,
    LOW: 240,
  },
  VERIFICATION_FAILED: {
    URGENT: 30,
    HIGH: 60,
    NORMAL: 120,
    LOW: 180,
  },
  PHARMACIST_ESCALATION: {
    URGENT: 15,
    HIGH: 30,
    NORMAL: 60,
    LOW: 120,
  },
};
```

**File**: `src/modules/whatsapp/constants/controlled-substances.constant.ts`

```typescript
export const CONTROLLED_SUBSTANCE_CATEGORIES = {
  SCHEDULE_I: {
    keywords: ['heroin', 'cocaine', 'lsd', 'mdma', 'ecstasy'],
    action: 'REJECT',
    requires_prescriber_verification: false,
  },
  SCHEDULE_II: {
    keywords: [
      'morphine', 'oxycodone', 'fentanyl', 'methadone', 'amphetamine',
      'methylphenidate', 'ritalin', 'adderall', 'oxycontin', 'percocet',
    ],
    action: 'ENHANCED_VERIFICATION',
    requires_prescriber_verification: true,
    max_days_supply: 30,
    no_refills: true,
  },
  SCHEDULE_III: {
    keywords: [
      'codeine', 'ketamine', 'anabolic steroids', 'testosterone',
      'buprenorphine', 'suboxone',
    ],
    action: 'PHARMACIST_REVIEW',
    requires_prescriber_verification: true,
    max_days_supply: 90,
  },
  SCHEDULE_IV: {
    keywords: [
      'diazepam', 'valium', 'lorazepam', 'ativan', 'alprazolam', 'xanax',
      'clonazepam', 'klonopin', 'tramadol', 'zolpidem', 'ambien',
    ],
    action: 'PHARMACIST_REVIEW',
    requires_prescriber_verification: true,
    max_days_supply: 180,
  },
  SCHEDULE_V: {
    keywords: ['pregabalin', 'lyrica', 'low-dose codeine'],
    action: 'FLAG_FOR_REVIEW',
    requires_prescriber_verification: false,
  },
};
```

---

## 9. Step-by-Step Implementation Tasks

### Phase 1: Foundation (Week 1)

#### Day 1-2: Setup & Entities
- [ ] Create `/src/modules/whatsapp/` directory structure
- [ ] Implement all 5 entity files with schemas
- [ ] Add entities to PharmacyModule providers
- [ ] Run `yarn build` to verify no TypeScript errors
- [ ] Verify MongoDB collections are created

#### Day 3-4: Core Services
- [ ] Implement `WhatsAppIdentityService`
- [ ] Implement `WhatsAppSessionService`
- [ ] Implement `WhatsAppRateLimiterService`
- [ ] Write unit tests for core services

#### Day 5: Webhook & Twilio
- [ ] Extend existing `TwilioService` with WhatsApp methods
- [ ] Implement `WhatsAppWebhookController`
- [ ] Set up Twilio WhatsApp sandbox for testing
- [ ] Configure webhook URL in Twilio console
- [ ] Test basic message send/receive

### Phase 2: Message Flows (Week 2)

#### Day 1-2: Flow Infrastructure
- [ ] Implement `WhatsAppMessageService` (send methods)
- [ ] Implement `WhatsAppAuditService` (logging)
- [ ] Implement `WhatsAppFlowService` (router)
- [ ] Create flow handler base class

#### Day 3-4: Verification Flow
- [ ] Implement `VerificationFlowHandler`
- [ ] Test account linking via OTP
- [ ] Test new account creation
- [ ] Test blocked account handling

#### Day 5: Prescription Upload Flow
- [ ] Implement `PrescriptionFlowHandler`
- [ ] Integrate with existing `DocumentProcessorService`
- [ ] Integrate with existing `PatientPrescriptionUploadService`
- [ ] Test image upload and OCR processing

### Phase 3: Queue System (Week 3)

#### Day 1-2: Queue Backend
- [ ] Implement `WhatsAppQueueService`
- [ ] Add queue controller to Admin Backend
- [ ] Test queue creation from OCR results
- [ ] Test queue statistics endpoint

#### Day 3-4: Admin Dashboard
- [ ] Create Vue queue page components
- [ ] Implement queue store (Pinia)
- [ ] Test queue listing and filtering
- [ ] Test claim/release/complete workflow

#### Day 5: Controlled Substances
- [ ] Implement controlled substance detection
- [ ] Create verification checklist workflow
- [ ] Test enhanced verification flow
- [ ] Document controlled substance procedures

### Phase 4: Orders & Payments (Week 4)

#### Day 1-2: Order Flow
- [ ] Implement `OrderFlowHandler`
- [ ] Integrate with existing `PharmacyOrderService`
- [ ] Integrate with existing `DrugService`
- [ ] Test order creation from prescription

#### Day 3-4: Payment Flow
- [ ] Implement `PaymentFlowHandler`
- [ ] Integrate Paystack payment links
- [ ] Integrate wallet payments
- [ ] Test payment confirmation via webhook

#### Day 5: Patient Frontend
- [ ] Create WhatsApp link component
- [ ] Add to Account settings page
- [ ] Create WhatsApp prescription history view
- [ ] Test end-to-end linking flow

### Phase 5: Polish & Testing (Week 5)

#### Day 1-2: Error Handling
- [ ] Implement comprehensive error messages
- [ ] Add retry logic for failed operations
- [ ] Implement graceful degradation
- [ ] Test error scenarios

#### Day 3-4: Monitoring & Alerts
- [ ] Set up SLA breach alerts
- [ ] Implement queue volume alerts
- [ ] Create operations dashboard
- [ ] Document monitoring procedures

#### Day 5: Documentation & Training
- [ ] Complete API documentation
- [ ] Create pharmacist training guide
- [ ] Create patient FAQ
- [ ] Conduct UAT with pharmacist team

---

## Appendix A: Message Templates

```typescript
// templates.constant.ts
export const WHATSAPP_TEMPLATES = {
  WELCOME: {
    body: `Welcome to Rapid Capsule Pharmacy! 🏥

I can help you:
📷 Upload prescriptions
💊 Order medications
📦 Track your orders

To get started, I need to verify your account.

Do you have an existing Rapid Capsule account?`,
    buttons: ['Yes, Link Account', 'No, Create Account'],
  },

  MAIN_MENU: {
    body: `How can I help you today?`,
    list: {
      title: 'Select an option',
      sections: [
        {
          title: 'Prescriptions',
          items: [
            { id: 'upload_prescription', title: '📷 Upload Prescription' },
            { id: 'my_prescriptions', title: '📋 My Prescriptions' },
          ],
        },
        {
          title: 'Orders',
          items: [
            { id: 'new_order', title: '🛒 New Order' },
            { id: 'track_order', title: '📦 Track Order' },
            { id: 'order_history', title: '📜 Order History' },
          ],
        },
        {
          title: 'Support',
          items: [
            { id: 'speak_pharmacist', title: '👨‍⚕️ Speak to Pharmacist' },
            { id: 'help', title: '❓ Help' },
          ],
        },
      ],
    },
  },

  PRESCRIPTION_UPLOAD_PROMPT: {
    body: `Please send a clear photo of your prescription.

Tips for best results:
📸 Good lighting
📐 Straight angle
🖼 Full prescription visible
🚫 No shadows or glare`,
  },

  PRESCRIPTION_RECEIVED: {
    body: `✅ Prescription received!

I'm analyzing your prescription now. This usually takes 1-2 minutes.

I'll notify you when it's ready.`,
  },

  PRESCRIPTION_VERIFIED: {
    body: `✅ Your prescription has been verified!

Medications found:
{{medications}}

Total: {{total}}

Would you like to order these medications?`,
    buttons: ['Order Now', 'View Details', 'Not Now'],
  },

  ORDER_CONFIRMATION: {
    body: `✅ Order Confirmed!

Order #: {{order_number}}
Total: {{total}}

Payment link: {{payment_link}}

Please complete payment within 24 hours.`,
  },

  SESSION_TIMEOUT_WARNING: {
    body: `⏰ Your session will expire in 5 minutes due to inactivity.

Send any message to continue.`,
  },

  SESSION_EXPIRED: {
    body: `⏰ Your session has expired for security.

Send 'hi' to start a new session.`,
  },
};
```

---

## Appendix B: API Factory Methods (Frontend)

**Add to `RC/src/services/apiFactory.js`**:

```javascript
// WhatsApp Integration
$_getWhatsAppLinkStatus() {
  return this.http.$_get('/users/whatsapp/status');
},

$_initiateWhatsAppLink(whatsappNumber) {
  return this.http.$_post('/users/whatsapp/link/initiate', { whatsapp_number: whatsappNumber });
},

$_verifyWhatsAppLink(otp) {
  return this.http.$_post('/users/whatsapp/link/verify', { otp });
},

$_unlinkWhatsApp() {
  return this.http.$_delete('/users/whatsapp/link');
},

$_getWhatsAppPrescriptions(params) {
  return this.http.$_get('/prescriptions/whatsapp', params);
},
```

**Add to `RC_Admin_UI/src/services/api.js`**:

```javascript
// WhatsApp Queue
getWhatsAppQueueStats() {
  return this.http.get('/admin-api/whatsapp/queue/stats');
},

getWhatsAppQueue(params) {
  return this.http.get('/admin-api/whatsapp/queue', { params });
},

getWhatsAppQueueItem(id) {
  return this.http.get(`/admin-api/whatsapp/queue/${id}`);
},

claimWhatsAppQueueItem(id) {
  return this.http.post(`/admin-api/whatsapp/queue/${id}/claim`);
},

releaseWhatsAppQueueItem(id) {
  return this.http.post(`/admin-api/whatsapp/queue/${id}/release`);
},

completeWhatsAppQueueReview(id, data) {
  return this.http.post(`/admin-api/whatsapp/queue/${id}/complete`, data);
},

getWhatsAppQueueImageUrl(id) {
  return this.http.get(`/admin-api/whatsapp/queue/${id}/image-url`);
},
```

---

## Appendix C: Testing Checklist

### Unit Tests
- [ ] WhatsAppIdentityService.getOrCreateIdentity
- [ ] WhatsAppIdentityService.verifyOTP
- [ ] WhatsAppSessionService.checkTimeout
- [ ] WhatsAppRateLimiterService.checkRateLimit
- [ ] WhatsAppQueueService.addToQueue
- [ ] WhatsAppQueueService.completeReview

### Integration Tests
- [ ] Webhook signature validation
- [ ] Full verification flow (OTP)
- [ ] Prescription upload with OCR
- [ ] Queue routing based on confidence
- [ ] Controlled substance detection
- [ ] Order creation flow
- [ ] Payment webhook handling

### E2E Tests
- [ ] New user onboarding via WhatsApp
- [ ] Existing user account linking
- [ ] Prescription upload → Order → Payment
- [ ] Admin queue claim and review
- [ ] Session timeout handling
- [ ] Rate limit enforcement

---

---

## 10. Fraud Scoring Integration

### 10.1 Existing Fraud System Overview

The platform already has a comprehensive fraud detection system in `PrescriptionVerificationService`:

**Existing fraud_detection schema** (from `PatientPrescriptionUpload`):
```typescript
fraud_score: number;  // 0-100, higher = more suspicious
fraud_flags: Array<{
  flag: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  detected_at: Date;
}>;
```

**Existing calculateFraudScore method** (lines 1468-1519 in prescription-verification.service.ts):
- Duplicate detection: +40 points
- CRITICAL check failures: +20 points
- ERROR check failures: +10 points
- WARNING check failures: +5 points
- Risk levels: LOW (0-24), MEDIUM (25-49), HIGH (50-69), CRITICAL (70+)

### 10.2 WhatsApp-Specific Fraud Indicators

Add WhatsApp-specific fraud indicators to enhance the existing system:

**File**: `src/modules/whatsapp/services/whatsapp-fraud.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WhatsAppIdentity, WhatsAppIdentityDocument } from '../entities/whatsapp-identity.entity';
import { WhatsAppAuditLog, WhatsAppAuditLogDocument } from '../entities/whatsapp-audit-log.entity';
import { PatientPrescriptionUpload, PatientPrescriptionUploadDocument } from '../../pharmacy/entities/patient-prescription-upload.entity';

export interface WhatsAppFraudIndicators {
  score_adjustment: number;
  flags: Array<{
    flag: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
  }>;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

@Injectable()
export class WhatsAppFraudService {
  private readonly logger = new Logger(WhatsAppFraudService.name);

  constructor(
    @InjectModel(WhatsAppIdentity.name)
    private identityModel: Model<WhatsAppIdentityDocument>,
    @InjectModel(WhatsAppAuditLog.name)
    private auditLogModel: Model<WhatsAppAuditLogDocument>,
    @InjectModel(PatientPrescriptionUpload.name)
    private prescriptionModel: Model<PatientPrescriptionUploadDocument>,
  ) {}

  /**
   * Calculate WhatsApp-specific fraud indicators
   */
  async calculateWhatsAppFraudIndicators(
    whatsappNumber: string,
    patientId: Types.ObjectId,
  ): Promise<WhatsAppFraudIndicators> {
    const indicators: WhatsAppFraudIndicators = {
      score_adjustment: 0,
      flags: [],
      risk_level: 'LOW',
    };

    // 1. Check account age (recently linked accounts are higher risk)
    const identity = await this.identityModel.findOne({ whatsapp_number: whatsappNumber });
    if (identity) {
      const accountAgeHours = (Date.now() - identity.verified_at?.getTime()) / (1000 * 60 * 60);
      if (accountAgeHours < 24) {
        indicators.score_adjustment += 15;
        indicators.flags.push({
          flag: 'NEW_WHATSAPP_LINK',
          severity: 'MEDIUM',
          description: 'WhatsApp account linked less than 24 hours ago',
        });
      }
    }

    // 2. Check upload velocity (multiple prescriptions in short time)
    const recentUploads = await this.prescriptionModel.countDocuments({
      patient: patientId,
      created_at: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });
    if (recentUploads >= 3) {
      indicators.score_adjustment += 10;
      indicators.flags.push({
        flag: 'HIGH_UPLOAD_VELOCITY',
        severity: 'MEDIUM',
        description: `${recentUploads} prescriptions uploaded in last 24 hours`,
      });
    }
    if (recentUploads >= 5) {
      indicators.score_adjustment += 15; // Additional penalty
      indicators.flags[indicators.flags.length - 1].severity = 'HIGH';
    }

    // 3. Check for multiple different WhatsApp numbers linked to account
    const linkedNumbers = await this.identityModel.countDocuments({
      patient_id: patientId,
    });
    if (linkedNumbers > 1) {
      indicators.score_adjustment += 20;
      indicators.flags.push({
        flag: 'MULTIPLE_WHATSAPP_NUMBERS',
        severity: 'HIGH',
        description: `${linkedNumbers} different WhatsApp numbers linked to this account`,
      });
    }

    // 4. Check for failed verification attempts
    if (identity && identity.failed_verification_attempts >= 3) {
      indicators.score_adjustment += 15;
      indicators.flags.push({
        flag: 'MULTIPLE_FAILED_VERIFICATIONS',
        severity: 'HIGH',
        description: `${identity.failed_verification_attempts} failed OTP verification attempts`,
      });
    }

    // 5. Check for unusual timing patterns (e.g., all uploads at 3am)
    const uploadTimes = await this.auditLogModel.find({
      whatsapp_number: whatsappNumber,
      is_prescription_related: true,
      timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    }).select('timestamp');

    const unusualTimeCount = uploadTimes.filter(log => {
      const hour = new Date(log.timestamp).getHours();
      return hour >= 0 && hour < 6; // Midnight to 6am
    }).length;

    if (unusualTimeCount >= 2) {
      indicators.score_adjustment += 10;
      indicators.flags.push({
        flag: 'UNUSUAL_UPLOAD_TIMES',
        severity: 'MEDIUM',
        description: 'Multiple prescription uploads during unusual hours (midnight-6am)',
      });
    }

    // 6. Check for previous rejected prescriptions
    const rejectedCount = await this.prescriptionModel.countDocuments({
      patient: patientId,
      verification_status: 'REJECTED',
    });
    if (rejectedCount >= 2) {
      indicators.score_adjustment += 10;
      indicators.flags.push({
        flag: 'PREVIOUS_REJECTIONS',
        severity: 'MEDIUM',
        description: `${rejectedCount} previously rejected prescriptions`,
      });
    }
    if (rejectedCount >= 5) {
      indicators.score_adjustment += 20; // Additional penalty
      indicators.flags[indicators.flags.length - 1].severity = 'CRITICAL';
    }

    // 7. Check for controlled substance request patterns
    const controlledCount = await this.auditLogModel.countDocuments({
      whatsapp_number: whatsappNumber,
      is_controlled_substance: true,
      timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    });
    if (controlledCount >= 3) {
      indicators.score_adjustment += 25;
      indicators.flags.push({
        flag: 'FREQUENT_CONTROLLED_REQUESTS',
        severity: 'CRITICAL',
        description: `${controlledCount} controlled substance requests in last 30 days`,
      });
    }

    // Determine risk level based on total adjustment
    if (indicators.score_adjustment >= 50) {
      indicators.risk_level = 'CRITICAL';
    } else if (indicators.score_adjustment >= 30) {
      indicators.risk_level = 'HIGH';
    } else if (indicators.score_adjustment >= 15) {
      indicators.risk_level = 'MEDIUM';
    }

    return indicators;
  }

  /**
   * Merge WhatsApp fraud indicators with existing prescription fraud score
   */
  async enhanceFraudScore(
    prescriptionId: Types.ObjectId,
    whatsappIndicators: WhatsAppFraudIndicators,
  ): Promise<void> {
    const prescription = await this.prescriptionModel.findById(prescriptionId);
    if (!prescription) return;

    const newScore = Math.min(100, (prescription.fraud_score || 0) + whatsappIndicators.score_adjustment);
    const newFlags = [
      ...(prescription.fraud_flags || []),
      ...whatsappIndicators.flags.map(f => ({
        ...f,
        detected_at: new Date(),
      })),
    ];

    await this.prescriptionModel.findByIdAndUpdate(prescriptionId, {
      $set: {
        fraud_score: newScore,
        fraud_flags: newFlags,
      },
    });

    this.logger.log(
      `Enhanced fraud score for prescription ${prescriptionId}: ${prescription.fraud_score} -> ${newScore}`,
    );
  }
}
```

### 10.3 Integration with Prescription Flow

Integrate fraud scoring into the WhatsApp prescription upload flow:

```typescript
// In prescription-flow.handler.ts

async processUploadedImage(
  imageBuffer: Buffer,
  session: WhatsAppSessionDocument,
  identity: WhatsAppIdentityDocument,
): Promise<FlowResponse> {
  // ... existing OCR and upload logic ...

  // Calculate WhatsApp-specific fraud indicators
  const whatsappFraudIndicators = await this.fraudService.calculateWhatsAppFraudIndicators(
    session.whatsapp_number,
    identity.patient_id,
  );

  // If high-risk, add to queue for manual review regardless of OCR confidence
  if (whatsappFraudIndicators.risk_level === 'CRITICAL') {
    await this.queueService.addToQueue({
      whatsappNumber: session.whatsapp_number,
      patientId: identity.patient_id,
      sessionId: session._id,
      prescriptionUploadId: prescriptionUpload._id,
      imageS3Key: s3Key,
      ocrData,
      queueType: QueueType.VERIFICATION_FAILED,
      priority: QueuePriority.HIGH,
      reason: 'High-risk WhatsApp fraud indicators detected',
    });

    return {
      messages: [{
        type: 'text',
        content: "Your prescription is being reviewed by our team. " +
                 "We'll notify you once the review is complete (typically within 2-4 hours).",
      }],
    };
  }

  // Enhance fraud score with WhatsApp indicators after verification
  if (prescriptionUpload._id) {
    await this.fraudService.enhanceFraudScore(prescriptionUpload._id, whatsappFraudIndicators);
  }

  // ... continue with normal flow ...
}
```

---

## 11. Prescriber Verification Service

### 11.1 Overview

Nigeria (MDCN) and UK (GMC) have different verification options:

| Jurisdiction | Registry | API Available | Approach |
|-------------|----------|---------------|----------|
| Nigeria | MDCN | No public API | Manual verification queue |
| UK | GMC | Paid API (~£X/lookup) | Automated API integration |

### 11.2 Prescriber Manual Verification Queue

**File**: `src/modules/whatsapp/entities/prescriber-verification-queue.entity.ts`

```typescript
import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type PrescriberVerificationQueueDocument = HydratedDocument<PrescriberVerificationQueue>;

export enum PrescriberVerificationStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  VERIFIED = 'VERIFIED',
  INVALID = 'INVALID',
  EXPIRED = 'EXPIRED',
  UNABLE_TO_VERIFY = 'UNABLE_TO_VERIFY',
}

@Schema({
  collection: 'prescriber_verification_queue',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class PrescriberVerificationQueue {
  // Prescriber details from prescription
  @Prop({ type: String, required: true })
  prescriber_name: string;

  @Prop({ type: String, required: true, index: true })
  license_number: string;

  @Prop({ type: String, required: true })
  registry_type: string; // 'MDCN', 'GMC', 'PCN', etc.

  @Prop({ type: String })
  clinic_name: string;

  @Prop({ type: String })
  clinic_address: string;

  // Linked prescription(s)
  @Prop({ type: [mongoose.Schema.Types.ObjectId], ref: 'PatientPrescriptionUpload', default: [] })
  linked_prescriptions: Types.ObjectId[];

  // Status
  @Prop({ type: String, enum: PrescriberVerificationStatus, default: PrescriberVerificationStatus.PENDING })
  status: PrescriberVerificationStatus;

  @Prop({ type: String, enum: ['HIGH', 'NORMAL', 'LOW'], default: 'NORMAL' })
  priority: string;

  // Verification result
  @Prop(raw({
    verified_at: { type: Date },
    verified_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    verification_method: { type: String }, // 'MDCN_WEBSITE', 'PHONE_CALL', 'GMC_API'
    verification_source: { type: String }, // URL or reference
    notes: { type: String },
    prescriber_specialty: { type: String },
    registration_date: { type: Date },
    expiry_date: { type: Date },
  }))
  verification_result: {
    verified_at: Date;
    verified_by: Types.ObjectId;
    verification_method: string;
    verification_source: string;
    notes: string;
    prescriber_specialty: string;
    registration_date: Date;
    expiry_date: Date;
  };

  // Cache for re-use
  @Prop({ type: Date })
  cache_expires_at: Date; // 30 days from verification

  // Audit
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  assigned_to: Types.ObjectId;

  @Prop({ type: Date })
  assigned_at: Date;

  created_at: Date;
  updated_at: Date;
}

export const PrescriberVerificationQueueSchema = SchemaFactory.createForClass(PrescriberVerificationQueue);

// Index for cache lookup (check if we've already verified this license)
PrescriberVerificationQueueSchema.index({ license_number: 1, registry_type: 1 });
PrescriberVerificationQueueSchema.index({ status: 1, priority: -1, created_at: 1 });
```

### 11.3 Prescriber Verification Service

**File**: `src/modules/whatsapp/services/prescriber-verification.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import {
  PrescriberVerificationQueue,
  PrescriberVerificationQueueDocument,
  PrescriberVerificationStatus,
} from '../entities/prescriber-verification-queue.entity';

export interface PrescriberVerificationResult {
  status: 'VERIFIED' | 'INVALID' | 'PENDING_MANUAL' | 'CACHE_HIT';
  prescriber_name?: string;
  specialty?: string;
  registration_valid?: boolean;
  expires_at?: Date;
  verification_source?: string;
  queue_item_id?: Types.ObjectId;
}

@Injectable()
export class PrescriberVerificationService {
  private readonly logger = new Logger(PrescriberVerificationService.name);

  constructor(
    @InjectModel(PrescriberVerificationQueue.name)
    private queueModel: Model<PrescriberVerificationQueueDocument>,
    private httpService: HttpService,
    private configService: ConfigService,
  ) {}

  /**
   * Verify prescriber license
   */
  async verifyPrescriber(
    licenseNumber: string,
    registryType: string,
    prescriberName?: string,
    prescriptionId?: Types.ObjectId,
  ): Promise<PrescriberVerificationResult> {
    // 1. Check cache first
    const cached = await this.checkCache(licenseNumber, registryType);
    if (cached) {
      this.logger.log(`Cache hit for ${registryType} license ${licenseNumber}`);

      // Link this prescription to the cached verification
      if (prescriptionId) {
        await this.queueModel.updateOne(
          { _id: cached._id },
          { $addToSet: { linked_prescriptions: prescriptionId } },
        );
      }

      return {
        status: cached.status === PrescriberVerificationStatus.VERIFIED ? 'CACHE_HIT' : 'INVALID',
        prescriber_name: cached.verification_result?.prescriber_specialty,
        specialty: cached.verification_result?.prescriber_specialty,
        registration_valid: cached.status === PrescriberVerificationStatus.VERIFIED,
        expires_at: cached.verification_result?.expiry_date,
        verification_source: cached.verification_result?.verification_source,
      };
    }

    // 2. Route to appropriate verification method
    switch (registryType.toUpperCase()) {
      case 'GMC':
        return this.verifyGMC(licenseNumber, prescriberName, prescriptionId);

      case 'MDCN':
      case 'PCN':
      default:
        return this.addToManualQueue(licenseNumber, registryType, prescriberName, prescriptionId);
    }
  }

  /**
   * Check cached verifications
   */
  private async checkCache(
    licenseNumber: string,
    registryType: string,
  ): Promise<PrescriberVerificationQueueDocument | null> {
    return this.queueModel.findOne({
      license_number: licenseNumber.toUpperCase().trim(),
      registry_type: registryType.toUpperCase(),
      status: { $in: [PrescriberVerificationStatus.VERIFIED, PrescriberVerificationStatus.INVALID] },
      cache_expires_at: { $gt: new Date() },
    });
  }

  /**
   * Verify via GMC API (UK)
   */
  private async verifyGMC(
    licenseNumber: string,
    prescriberName?: string,
    prescriptionId?: Types.ObjectId,
  ): Promise<PrescriberVerificationResult> {
    const gmcApiKey = this.configService.get<string>('GMC_API_KEY');

    if (!gmcApiKey) {
      this.logger.warn('GMC API key not configured, falling back to manual queue');
      return this.addToManualQueue(licenseNumber, 'GMC', prescriberName, prescriptionId);
    }

    try {
      // GMC API endpoint (example - actual API may differ)
      const response = await this.httpService.axiosRef.get(
        `https://api.gmc-uk.org/register/v1/doctors/${licenseNumber}`,
        {
          headers: {
            'Authorization': `Bearer ${gmcApiKey}`,
            'Accept': 'application/json',
          },
          timeout: 10000,
        },
      );

      const data = response.data;

      // Create verification record
      const queueItem = await this.queueModel.create({
        prescriber_name: prescriberName || data.name,
        license_number: licenseNumber.toUpperCase().trim(),
        registry_type: 'GMC',
        linked_prescriptions: prescriptionId ? [prescriptionId] : [],
        status: data.registrationStatus === 'Registered'
          ? PrescriberVerificationStatus.VERIFIED
          : PrescriberVerificationStatus.INVALID,
        verification_result: {
          verified_at: new Date(),
          verification_method: 'GMC_API',
          verification_source: `https://www.gmc-uk.org/doctors/${licenseNumber}`,
          prescriber_specialty: data.specialty,
          registration_date: new Date(data.registrationDate),
          expiry_date: data.expiryDate ? new Date(data.expiryDate) : null,
        },
        cache_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      });

      return {
        status: queueItem.status === PrescriberVerificationStatus.VERIFIED ? 'VERIFIED' : 'INVALID',
        prescriber_name: data.name,
        specialty: data.specialty,
        registration_valid: data.registrationStatus === 'Registered',
        expires_at: data.expiryDate ? new Date(data.expiryDate) : null,
        verification_source: `https://www.gmc-uk.org/doctors/${licenseNumber}`,
      };
    } catch (error) {
      this.logger.error(`GMC API verification failed for ${licenseNumber}:`, error);
      return this.addToManualQueue(licenseNumber, 'GMC', prescriberName, prescriptionId);
    }
  }

  /**
   * Add to manual verification queue (for MDCN, PCN, or API failures)
   */
  private async addToManualQueue(
    licenseNumber: string,
    registryType: string,
    prescriberName?: string,
    prescriptionId?: Types.ObjectId,
  ): Promise<PrescriberVerificationResult> {
    // Check if already in queue
    let queueItem = await this.queueModel.findOne({
      license_number: licenseNumber.toUpperCase().trim(),
      registry_type: registryType.toUpperCase(),
      status: PrescriberVerificationStatus.PENDING,
    });

    if (queueItem) {
      // Add prescription to existing queue item
      if (prescriptionId) {
        await this.queueModel.updateOne(
          { _id: queueItem._id },
          { $addToSet: { linked_prescriptions: prescriptionId } },
        );
      }
    } else {
      // Create new queue item
      queueItem = await this.queueModel.create({
        prescriber_name: prescriberName || 'Unknown',
        license_number: licenseNumber.toUpperCase().trim(),
        registry_type: registryType.toUpperCase(),
        linked_prescriptions: prescriptionId ? [prescriptionId] : [],
        status: PrescriberVerificationStatus.PENDING,
        priority: 'NORMAL',
      });
    }

    return {
      status: 'PENDING_MANUAL',
      queue_item_id: queueItem._id,
    };
  }

  /**
   * Complete manual verification
   */
  async completeManualVerification(
    queueItemId: Types.ObjectId,
    verifierId: Types.ObjectId,
    result: {
      verified: boolean;
      method: string;
      source: string;
      specialty?: string;
      registrationDate?: Date;
      expiryDate?: Date;
      notes?: string;
    },
  ): Promise<void> {
    await this.queueModel.findByIdAndUpdate(queueItemId, {
      $set: {
        status: result.verified
          ? PrescriberVerificationStatus.VERIFIED
          : PrescriberVerificationStatus.INVALID,
        verification_result: {
          verified_at: new Date(),
          verified_by: verifierId,
          verification_method: result.method,
          verification_source: result.source,
          prescriber_specialty: result.specialty,
          registration_date: result.registrationDate,
          expiry_date: result.expiryDate,
          notes: result.notes,
        },
        cache_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    // Trigger re-verification of linked prescriptions
    // ... emit event to update prescription verification status
  }
}
```

### 11.4 MDCN Website Scraping (Last Resort)

For MDCN verification when manual queue is too slow, consider supervised web scraping:

```typescript
// NOTE: Only use as fallback - fragile and may break with website changes
// File: src/modules/whatsapp/services/mdcn-scraper.service.ts

import { Injectable, Logger } from '@nestjs/common';
import * as puppeteer from 'puppeteer';

@Injectable()
export class MDCNScraperService {
  private readonly logger = new Logger(MDCNScraperService.name);
  private readonly MDCN_SEARCH_URL = 'https://www.mdcn.gov.ng/page/doctorsearch';

  /**
   * Scrape MDCN website for doctor verification
   * NOTE: This is fragile and should only be used when API unavailable
   */
  async scrapeDoctor(licenseNumber: string): Promise<{
    found: boolean;
    name?: string;
    specialty?: string;
    registrationStatus?: string;
  }> {
    let browser: puppeteer.Browser | null = null;

    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();
      await page.goto(this.MDCN_SEARCH_URL, { waitUntil: 'networkidle0' });

      // Fill search form
      await page.type('#registration_number', licenseNumber);
      await page.click('button[type="submit"]');
      await page.waitForNavigation({ waitUntil: 'networkidle0' });

      // Check for results
      const results = await page.evaluate(() => {
        const row = document.querySelector('table.results tbody tr');
        if (!row) return null;

        return {
          name: row.querySelector('td:nth-child(1)')?.textContent?.trim(),
          specialty: row.querySelector('td:nth-child(2)')?.textContent?.trim(),
          registrationStatus: row.querySelector('td:nth-child(3)')?.textContent?.trim(),
        };
      });

      return {
        found: !!results,
        ...results,
      };
    } catch (error) {
      this.logger.error(`MDCN scraping failed for ${licenseNumber}:`, error);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}
```

---

## 12. Error Recovery / Saga Pattern

### 12.1 Transactional Outbox Pattern

Implement reliable message delivery with the outbox pattern:

**File**: `src/modules/whatsapp/entities/whatsapp-outbox.entity.ts`

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type WhatsAppOutboxDocument = HydratedDocument<WhatsAppOutbox>;

export enum OutboxStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  DEAD_LETTER = 'DEAD_LETTER',
}

@Schema({
  collection: 'whatsapp_outbox',
  timestamps: { createdAt: 'created_at' },
})
export class WhatsAppOutbox {
  @Prop({ type: String, required: true })
  whatsapp_number: string;

  @Prop({ type: String, enum: ['TEXT', 'TEMPLATE', 'INTERACTIVE', 'MEDIA'], required: true })
  message_type: string;

  @Prop({ type: mongoose.Schema.Types.Mixed, required: true })
  payload: any;

  @Prop({ type: String, enum: OutboxStatus, default: OutboxStatus.PENDING, index: true })
  status: OutboxStatus;

  @Prop({ type: Number, default: 0 })
  retry_count: number;

  @Prop({ type: Number, default: 5 })
  max_retries: number;

  @Prop({ type: Date })
  next_retry_at: Date;

  @Prop({ type: String })
  last_error: string;

  @Prop({ type: String })
  twilio_message_sid: string;

  // Correlation
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'WhatsAppSession' })
  session_id: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  patient_id: Types.ObjectId;

  @Prop({ type: String })
  correlation_id: string; // For tracking related messages

  // Priority
  @Prop({ type: Number, default: 0 })
  priority: number; // Higher = more important

  created_at: Date;
}

export const WhatsAppOutboxSchema = SchemaFactory.createForClass(WhatsAppOutbox);

// Index for processing
WhatsAppOutboxSchema.index({ status: 1, next_retry_at: 1, priority: -1 });
WhatsAppOutboxSchema.index({ correlation_id: 1 });
```

**File**: `src/modules/whatsapp/services/whatsapp-outbox.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WhatsAppOutbox, WhatsAppOutboxDocument, OutboxStatus } from '../entities/whatsapp-outbox.entity';
import { WhatsAppMessageService } from './whatsapp-message.service';
import { WhatsAppAuditService } from './whatsapp-audit.service';

@Injectable()
export class WhatsAppOutboxService {
  private readonly logger = new Logger(WhatsAppOutboxService.name);
  private isProcessing = false;

  constructor(
    @InjectModel(WhatsAppOutbox.name)
    private outboxModel: Model<WhatsAppOutboxDocument>,
    private messageService: WhatsAppMessageService,
    private auditService: WhatsAppAuditService,
  ) {}

  /**
   * Queue a message for reliable delivery
   */
  async queueMessage(params: {
    whatsappNumber: string;
    messageType: 'TEXT' | 'TEMPLATE' | 'INTERACTIVE' | 'MEDIA';
    payload: any;
    sessionId?: Types.ObjectId;
    patientId?: Types.ObjectId;
    correlationId?: string;
    priority?: number;
  }): Promise<WhatsAppOutboxDocument> {
    return this.outboxModel.create({
      whatsapp_number: params.whatsappNumber,
      message_type: params.messageType,
      payload: params.payload,
      status: OutboxStatus.PENDING,
      next_retry_at: new Date(),
      session_id: params.sessionId,
      patient_id: params.patientId,
      correlation_id: params.correlationId,
      priority: params.priority || 0,
    });
  }

  /**
   * Process outbox queue (runs every 5 seconds)
   */
  @Cron('*/5 * * * * *')
  async processOutbox(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const messages = await this.outboxModel
        .find({
          status: OutboxStatus.PENDING,
          next_retry_at: { $lte: new Date() },
        })
        .sort({ priority: -1, created_at: 1 })
        .limit(10);

      for (const message of messages) {
        await this.processMessage(message);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async processMessage(message: WhatsAppOutboxDocument): Promise<void> {
    try {
      // Mark as processing
      await this.outboxModel.updateOne(
        { _id: message._id },
        { $set: { status: OutboxStatus.PROCESSING } },
      );

      // Send message
      let result: any;
      switch (message.message_type) {
        case 'TEXT':
          result = await this.messageService.sendTextMessage(
            message.whatsapp_number,
            message.payload.content,
          );
          break;
        case 'TEMPLATE':
          result = await this.messageService.sendTemplateMessage(
            message.whatsapp_number,
            message.payload.templateId,
            message.payload.variables,
          );
          break;
        case 'INTERACTIVE':
          result = await this.messageService.sendInteractiveMessage(
            message.whatsapp_number,
            message.payload,
          );
          break;
        case 'MEDIA':
          result = await this.messageService.sendMediaMessage(
            message.whatsapp_number,
            message.payload.mediaUrl,
            message.payload.caption,
          );
          break;
      }

      // Mark as sent
      await this.outboxModel.updateOne(
        { _id: message._id },
        {
          $set: {
            status: OutboxStatus.SENT,
            twilio_message_sid: result.sid,
          },
        },
      );

      // Log successful send
      await this.auditService.logOutboundMessage({
        whatsappNumber: message.whatsapp_number,
        patientId: message.patient_id,
        sessionId: message.session_id,
        messageType: message.message_type,
        content: message.payload,
        messageSid: result.sid,
      });

    } catch (error) {
      this.logger.error(`Failed to send outbox message ${message._id}:`, error);

      const retryCount = message.retry_count + 1;

      if (retryCount >= message.max_retries) {
        // Move to dead letter
        await this.outboxModel.updateOne(
          { _id: message._id },
          {
            $set: {
              status: OutboxStatus.DEAD_LETTER,
              last_error: error.message,
            },
            $inc: { retry_count: 1 },
          },
        );

        // Alert operations team
        this.logger.error(`Message ${message._id} moved to dead letter queue after ${retryCount} retries`);
        // TODO: Send alert to operations
      } else {
        // Schedule retry with exponential backoff
        const backoffMs = Math.min(1000 * Math.pow(2, retryCount), 300000); // Max 5 minutes
        await this.outboxModel.updateOne(
          { _id: message._id },
          {
            $set: {
              status: OutboxStatus.PENDING,
              next_retry_at: new Date(Date.now() + backoffMs),
              last_error: error.message,
            },
            $inc: { retry_count: 1 },
          },
        );
      }
    }
  }

  /**
   * Get dead letter messages for manual review
   */
  async getDeadLetterMessages(limit = 50): Promise<WhatsAppOutboxDocument[]> {
    return this.outboxModel
      .find({ status: OutboxStatus.DEAD_LETTER })
      .sort({ created_at: -1 })
      .limit(limit);
  }

  /**
   * Retry a dead letter message
   */
  async retryDeadLetter(messageId: Types.ObjectId): Promise<void> {
    await this.outboxModel.updateOne(
      { _id: messageId, status: OutboxStatus.DEAD_LETTER },
      {
        $set: {
          status: OutboxStatus.PENDING,
          next_retry_at: new Date(),
          retry_count: 0,
        },
      },
    );
  }
}
```

### 12.2 Saga Coordinator for Complex Flows

**File**: `src/modules/whatsapp/services/whatsapp-saga.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

export enum SagaStep {
  PRESCRIPTION_UPLOADED = 'PRESCRIPTION_UPLOADED',
  OCR_COMPLETED = 'OCR_COMPLETED',
  VERIFICATION_COMPLETED = 'VERIFICATION_COMPLETED',
  QUEUE_ADDED = 'QUEUE_ADDED',
  PATIENT_NOTIFIED = 'PATIENT_NOTIFIED',
  ORDER_CREATED = 'ORDER_CREATED',
  PAYMENT_INITIATED = 'PAYMENT_INITIATED',
  PAYMENT_COMPLETED = 'PAYMENT_COMPLETED',
}

export enum SagaStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  COMPENSATING = 'COMPENSATING',
  COMPENSATED = 'COMPENSATED',
}

// Entity for tracking saga state
interface WhatsAppSaga {
  _id: Types.ObjectId;
  saga_type: string;
  status: SagaStatus;
  steps_completed: SagaStep[];
  current_step: SagaStep;
  context: Record<string, any>;
  error?: string;
  started_at: Date;
  completed_at?: Date;
}

@Injectable()
export class WhatsAppSagaService {
  private readonly logger = new Logger(WhatsAppSagaService.name);

  // Compensation handlers for each step
  private compensators: Record<SagaStep, (context: any) => Promise<void>> = {
    [SagaStep.PRESCRIPTION_UPLOADED]: async (ctx) => {
      // Delete uploaded file from S3
      await this.fileUploadHelper.deleteFromS3(ctx.s3_key);
    },
    [SagaStep.OCR_COMPLETED]: async (ctx) => {
      // No compensation needed - OCR is idempotent
    },
    [SagaStep.VERIFICATION_COMPLETED]: async (ctx) => {
      // Mark verification as cancelled
      await this.verificationModel.updateOne(
        { _id: ctx.verification_id },
        { $set: { status: 'CANCELLED' } },
      );
    },
    [SagaStep.QUEUE_ADDED]: async (ctx) => {
      // Remove from queue
      await this.queueModel.deleteOne({ _id: ctx.queue_item_id });
    },
    [SagaStep.PATIENT_NOTIFIED]: async (ctx) => {
      // Send correction message
      await this.outboxService.queueMessage({
        whatsappNumber: ctx.whatsapp_number,
        messageType: 'TEXT',
        payload: { content: 'Sorry, there was an issue processing your prescription. Please try again.' },
        priority: 10,
      });
    },
    [SagaStep.ORDER_CREATED]: async (ctx) => {
      // Cancel order and release inventory
      await this.orderService.cancelOrder(ctx.order_id, 'SAGA_COMPENSATION');
    },
    [SagaStep.PAYMENT_INITIATED]: async (ctx) => {
      // Cancel pending payment
      await this.paymentService.cancelPayment(ctx.payment_reference);
    },
    [SagaStep.PAYMENT_COMPLETED]: async (ctx) => {
      // Refund payment
      await this.paymentService.refundPayment(ctx.payment_reference, 'SAGA_COMPENSATION');
    },
  };

  /**
   * Execute compensating transactions on saga failure
   */
  async compensate(saga: WhatsAppSaga): Promise<void> {
    this.logger.log(`Starting compensation for saga ${saga._id}`);

    // Execute compensators in reverse order
    const stepsToCompensate = [...saga.steps_completed].reverse();

    for (const step of stepsToCompensate) {
      try {
        await this.compensators[step](saga.context);
        this.logger.log(`Compensated step ${step} for saga ${saga._id}`);
      } catch (error) {
        this.logger.error(`Failed to compensate step ${step} for saga ${saga._id}:`, error);
        // Continue compensating other steps
      }
    }

    // Mark saga as compensated
    await this.updateSagaStatus(saga._id, SagaStatus.COMPENSATED);
  }
}
```

---

## 13. Circuit Breaker / Degraded Mode

### 13.1 Circuit Breaker Implementation

**File**: `src/modules/whatsapp/services/circuit-breaker.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';

export enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation
  OPEN = 'OPEN',         // Failing, reject requests
  HALF_OPEN = 'HALF_OPEN', // Testing if service recovered
}

interface CircuitConfig {
  failureThreshold: number;    // Failures before opening
  successThreshold: number;    // Successes to close from half-open
  timeout: number;             // Time in OPEN before trying HALF_OPEN (ms)
}

interface CircuitStats {
  failures: number;
  successes: number;
  lastFailure: Date | null;
  lastSuccess: Date | null;
  state: CircuitState;
  stateChangedAt: Date;
}

@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private circuits: Map<string, CircuitStats> = new Map();
  private configs: Map<string, CircuitConfig> = new Map();

  private readonly DEFAULT_CONFIG: CircuitConfig = {
    failureThreshold: 5,
    successThreshold: 3,
    timeout: 60000, // 1 minute
  };

  constructor() {
    // Initialize circuits for critical services
    this.registerCircuit('OCR_SERVICE', { failureThreshold: 3, successThreshold: 2, timeout: 30000 });
    this.registerCircuit('TWILIO_WHATSAPP', { failureThreshold: 5, successThreshold: 3, timeout: 60000 });
    this.registerCircuit('PAYSTACK', { failureThreshold: 3, successThreshold: 2, timeout: 30000 });
    this.registerCircuit('S3_UPLOAD', { failureThreshold: 5, successThreshold: 3, timeout: 30000 });
  }

  registerCircuit(name: string, config?: Partial<CircuitConfig>): void {
    this.configs.set(name, { ...this.DEFAULT_CONFIG, ...config });
    this.circuits.set(name, {
      failures: 0,
      successes: 0,
      lastFailure: null,
      lastSuccess: null,
      state: CircuitState.CLOSED,
      stateChangedAt: new Date(),
    });
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(circuitName: string, fn: () => Promise<T>): Promise<T> {
    const stats = this.circuits.get(circuitName);
    const config = this.configs.get(circuitName);

    if (!stats || !config) {
      throw new Error(`Circuit ${circuitName} not registered`);
    }

    // Check circuit state
    this.updateCircuitState(circuitName);

    if (stats.state === CircuitState.OPEN) {
      throw new CircuitOpenError(circuitName, stats.stateChangedAt);
    }

    try {
      const result = await fn();
      this.recordSuccess(circuitName);
      return result;
    } catch (error) {
      this.recordFailure(circuitName);
      throw error;
    }
  }

  /**
   * Check if circuit is open (for graceful degradation)
   */
  isOpen(circuitName: string): boolean {
    this.updateCircuitState(circuitName);
    return this.circuits.get(circuitName)?.state === CircuitState.OPEN;
  }

  private recordSuccess(circuitName: string): void {
    const stats = this.circuits.get(circuitName)!;
    const config = this.configs.get(circuitName)!;

    stats.successes++;
    stats.lastSuccess = new Date();

    if (stats.state === CircuitState.HALF_OPEN) {
      if (stats.successes >= config.successThreshold) {
        stats.state = CircuitState.CLOSED;
        stats.failures = 0;
        stats.successes = 0;
        stats.stateChangedAt = new Date();
        this.logger.log(`Circuit ${circuitName} CLOSED after recovery`);
      }
    }
  }

  private recordFailure(circuitName: string): void {
    const stats = this.circuits.get(circuitName)!;
    const config = this.configs.get(circuitName)!;

    stats.failures++;
    stats.lastFailure = new Date();

    if (stats.state === CircuitState.HALF_OPEN) {
      // Immediately open on failure during half-open
      stats.state = CircuitState.OPEN;
      stats.stateChangedAt = new Date();
      this.logger.warn(`Circuit ${circuitName} OPEN again after half-open failure`);
    } else if (stats.state === CircuitState.CLOSED) {
      if (stats.failures >= config.failureThreshold) {
        stats.state = CircuitState.OPEN;
        stats.stateChangedAt = new Date();
        this.logger.warn(`Circuit ${circuitName} OPENED after ${stats.failures} failures`);
      }
    }
  }

  private updateCircuitState(circuitName: string): void {
    const stats = this.circuits.get(circuitName)!;
    const config = this.configs.get(circuitName)!;

    if (stats.state === CircuitState.OPEN) {
      const timeSinceOpen = Date.now() - stats.stateChangedAt.getTime();
      if (timeSinceOpen >= config.timeout) {
        stats.state = CircuitState.HALF_OPEN;
        stats.successes = 0;
        stats.stateChangedAt = new Date();
        this.logger.log(`Circuit ${circuitName} entering HALF_OPEN state`);
      }
    }
  }

  getStatus(): Record<string, { state: CircuitState; failures: number }> {
    const status: Record<string, any> = {};
    this.circuits.forEach((stats, name) => {
      status[name] = { state: stats.state, failures: stats.failures };
    });
    return status;
  }
}

export class CircuitOpenError extends Error {
  constructor(
    public circuitName: string,
    public openedAt: Date,
  ) {
    super(`Circuit ${circuitName} is OPEN`);
  }
}
```

### 13.2 Graceful Degradation in Flows

```typescript
// In prescription-flow.handler.ts

async handleImageUpload(
  imageBuffer: Buffer,
  session: WhatsAppSessionDocument,
): Promise<FlowResponse> {
  // Check if OCR service is available
  if (this.circuitBreaker.isOpen('OCR_SERVICE')) {
    // Degrade gracefully - queue for manual processing
    this.logger.warn('OCR circuit open, queuing for manual processing');

    const s3Key = await this.uploadToS3(imageBuffer);
    await this.queueService.addToQueue({
      whatsappNumber: session.whatsapp_number,
      queueType: QueueType.MANUAL_ENTRY,
      priority: QueuePriority.HIGH,
      reason: 'OCR service temporarily unavailable',
      imageS3Key: s3Key,
    });

    return {
      messages: [{
        type: 'text',
        content: "Our prescription scanning service is temporarily busy. " +
                 "Your image has been saved and a pharmacist will review it shortly.\n\n" +
                 "You'll receive a notification when it's ready (typically within 1-2 hours).",
      }],
    };
  }

  // Normal flow with circuit breaker protection
  try {
    const ocrResult = await this.circuitBreaker.execute(
      'OCR_SERVICE',
      () => this.documentProcessor.extractPrescriptionData(imageBuffer),
    );
    // ... continue normal processing
  } catch (error) {
    if (error instanceof CircuitOpenError) {
      // Circuit just opened - use degraded path
      return this.handleDegradedUpload(imageBuffer, session);
    }
    throw error;
  }
}
```

---

## 14. Delivery Coordination

### 14.1 Delivery Flow Handler

**File**: `src/modules/whatsapp/handlers/delivery-flow.handler.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { FlowHandler, FlowResponse } from './base-flow.handler';
import { WhatsAppSessionDocument, FlowType } from '../entities/whatsapp-session.entity';
import { PharmacyOrderService } from '../../pharmacy/services/pharmacy-order.service';

@Injectable()
export class DeliveryFlowHandler implements FlowHandler {
  private readonly logger = new Logger(DeliveryFlowHandler.name);

  constructor(
    private orderService: PharmacyOrderService,
    private sessionService: WhatsAppSessionService,
  ) {}

  async handle(
    message: any,
    session: WhatsAppSessionDocument,
  ): Promise<FlowResponse> {
    const step = session.flow_step;

    switch (step) {
      case 0:
        return this.showOrderList(session);
      case 1:
        return this.showOrderStatus(message.body, session);
      case 2:
        return this.handleDeliveryAction(message, session);
      default:
        return this.showOrderList(session);
    }
  }

  private async showOrderList(session: WhatsAppSessionDocument): Promise<FlowResponse> {
    const orders = await this.orderService.getPatientOrders(session.patient_id, {
      status: ['PROCESSING', 'DISPATCHED', 'OUT_FOR_DELIVERY'],
      limit: 5,
    });

    if (orders.length === 0) {
      return {
        messages: [{
          type: 'text',
          content: "You don't have any active orders.\n\n" +
                   "Reply 'history' to see past orders or 'menu' for main menu.",
        }],
      };
    }

    const orderList = orders.map((o, i) =>
      `${i + 1}. #${o.order_number} - ${o.status} (${o.items.length} items)`
    ).join('\n');

    await this.sessionService.updateFlow(session._id, FlowType.ORDER_TRACKING, 1);

    return {
      messages: [{
        type: 'text',
        content: `📦 Your Active Orders:\n\n${orderList}\n\nReply with the order number to track it.`,
      }],
    };
  }

  private async showOrderStatus(orderNumber: string, session: WhatsAppSessionDocument): Promise<FlowResponse> {
    const order = await this.orderService.findByOrderNumber(orderNumber);

    if (!order || order.patient.toString() !== session.patient_id.toString()) {
      return {
        messages: [{
          type: 'text',
          content: "Order not found. Please enter a valid order number.",
        }],
      };
    }

    const statusEmoji = {
      PENDING: '⏳',
      CONFIRMED: '✅',
      PROCESSING: '🔄',
      DISPATCHED: '📦',
      OUT_FOR_DELIVERY: '🚚',
      DELIVERED: '✅',
      CANCELLED: '❌',
    };

    let trackingInfo = '';
    if (order.delivery?.rider) {
      trackingInfo = `\n\n🏍 Rider: ${order.delivery.rider.name}\n📞 ${order.delivery.rider.phone}`;
      if (order.delivery.tracking_url) {
        trackingInfo += `\n📍 Track: ${order.delivery.tracking_url}`;
      }
    }

    if (order.delivery?.estimated_arrival) {
      const eta = new Date(order.delivery.estimated_arrival);
      trackingInfo += `\n⏰ ETA: ${eta.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}`;
    }

    await this.sessionService.addFlowData(session._id, 'selected_order_id', order._id);
    await this.sessionService.updateFlow(session._id, FlowType.ORDER_TRACKING, 2, session.flow_data);

    const controlledPickup = order.has_controlled_substance
      ? '\n\n⚠️ This order contains controlled medication and must be picked up in person with valid ID.'
      : '';

    return {
      messages: [{
        type: 'interactive',
        content: {
          type: 'button',
          body: {
            text: `${statusEmoji[order.status] || '📦'} Order #${order.order_number}\n\n` +
                  `Status: ${order.status}\n` +
                  `Items: ${order.items.length}\n` +
                  `Total: ₦${order.total.toLocaleString()}` +
                  trackingInfo +
                  controlledPickup,
          },
          action: {
            buttons: [
              { type: 'reply', reply: { id: 'call_rider', title: 'Call Rider' } },
              { type: 'reply', reply: { id: 'report_issue', title: 'Report Issue' } },
              { type: 'reply', reply: { id: 'back', title: '← Back' } },
            ],
          },
        },
      }],
    };
  }

  private async handleDeliveryAction(message: any, session: WhatsAppSessionDocument): Promise<FlowResponse> {
    const action = message.ButtonPayload || message.body?.toLowerCase();
    const orderId = session.flow_data?.selected_order_id;

    switch (action) {
      case 'call_rider':
        const order = await this.orderService.findById(orderId);
        if (order?.delivery?.rider?.phone) {
          return {
            messages: [{
              type: 'text',
              content: `📞 Rider Contact:\n${order.delivery.rider.name}\n${order.delivery.rider.phone}\n\nTap the number above to call.`,
            }],
          };
        }
        return {
          messages: [{ type: 'text', content: 'Rider information not yet available.' }],
        };

      case 'report_issue':
        await this.sessionService.updateFlow(session._id, FlowType.SUPPORT, 0);
        return {
          messages: [{
            type: 'text',
            content: "What issue are you experiencing?\n\n" +
                     "1. Order delayed\n" +
                     "2. Wrong items\n" +
                     "3. Damaged package\n" +
                     "4. Rider unreachable\n" +
                     "5. Other",
          }],
        };

      case 'back':
        return this.showOrderList(session);

      default:
        return {
          messages: [{ type: 'text', content: "I didn't understand. Please select an option." }],
        };
    }
  }
}
```

### 14.2 Delivery Status Webhook Integration

```typescript
// In whatsapp-webhook.controller.ts

@Post('delivery-status')
@HttpCode(200)
async handleDeliveryStatusUpdate(@Body() body: DeliveryStatusWebhook): Promise<void> {
  const { order_id, status, rider_info, tracking_url, estimated_arrival } = body;

  // Update order
  await this.orderService.updateDeliveryStatus(order_id, {
    status,
    rider_info,
    tracking_url,
    estimated_arrival,
  });

  // Get order with patient info
  const order = await this.orderService.findById(order_id);
  if (!order) return;

  // Find patient's WhatsApp
  const identity = await this.identityService.getByPatientId(order.patient);
  if (!identity?.is_verified) return;

  // Send status update via outbox
  const statusMessages = {
    DISPATCHED: `📦 Your order #${order.order_number} has been dispatched!\n\n` +
                `Rider: ${rider_info?.name || 'Assigned'}\n` +
                `Track your order: ${tracking_url || 'Link coming soon'}`,
    OUT_FOR_DELIVERY: `🚚 Your order #${order.order_number} is out for delivery!\n\n` +
                      `Rider: ${rider_info?.name}\n` +
                      `📞 ${rider_info?.phone}\n` +
                      `⏰ ETA: ${new Date(estimated_arrival).toLocaleTimeString('en-NG')}`,
    DELIVERED: `✅ Your order #${order.order_number} has been delivered!\n\n` +
               `Thank you for choosing Rapid Capsule.\n\n` +
               `Reply 'rate' to rate your experience.`,
  };

  if (statusMessages[status]) {
    await this.outboxService.queueMessage({
      whatsappNumber: identity.whatsapp_number,
      messageType: 'TEXT',
      payload: { content: statusMessages[status] },
      patientId: order.patient,
      priority: 5,
    });
  }
}
```

---

## 15. Template Management & Approval

### 15.1 Template Entity

**File**: `src/modules/whatsapp/entities/whatsapp-template.entity.ts`

```typescript
import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type WhatsAppTemplateDocument = HydratedDocument<WhatsAppTemplate>;

export enum TemplateStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PAUSED = 'PAUSED',
  DISABLED = 'DISABLED',
}

export enum TemplateCategory {
  UTILITY = 'UTILITY',
  MARKETING = 'MARKETING',
  AUTHENTICATION = 'AUTHENTICATION',
}

@Schema({
  collection: 'whatsapp_templates',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class WhatsAppTemplate {
  @Prop({ type: String, required: true, unique: true })
  template_name: string; // Our internal name

  @Prop({ type: String })
  twilio_content_sid: string; // Twilio Content SID after approval

  @Prop({ type: String, required: true })
  language: string; // 'en', 'yo', 'ig', 'pcm' (Pidgin)

  @Prop({ type: String, enum: TemplateCategory, required: true })
  category: TemplateCategory;

  @Prop({ type: String, enum: TemplateStatus, default: TemplateStatus.DRAFT })
  status: TemplateStatus;

  // Template content
  @Prop(raw({
    header: {
      type: { type: String, enum: ['TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT'] },
      content: { type: String },
    },
    body: { type: String, required: true },
    footer: { type: String },
    buttons: [{
      type: { type: String, enum: ['QUICK_REPLY', 'URL', 'PHONE'] },
      text: { type: String },
      url: { type: String },
      phone: { type: String },
    }],
  }))
  content: {
    header?: { type: string; content: string };
    body: string;
    footer?: string;
    buttons?: Array<{
      type: string;
      text: string;
      url?: string;
      phone?: string;
    }>;
  };

  // Variables in the template
  @Prop({ type: [String], default: [] })
  variables: string[]; // ['{{1}}', '{{2}}', etc.]

  // Approval tracking
  @Prop({ type: Date })
  submitted_at: Date;

  @Prop({ type: Date })
  approved_at: Date;

  @Prop({ type: String })
  rejection_reason: string;

  // Usage stats
  @Prop({ type: Number, default: 0 })
  send_count: number;

  @Prop({ type: Number, default: 0 })
  delivery_count: number;

  @Prop({ type: Number, default: 0 })
  read_count: number;

  // Version control
  @Prop({ type: Number, default: 1 })
  version: number;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'WhatsAppTemplate' })
  previous_version: mongoose.Types.ObjectId;

  created_at: Date;
  updated_at: Date;
}

export const WhatsAppTemplateSchema = SchemaFactory.createForClass(WhatsAppTemplate);
```

### 15.2 Nigerian Language Variants

```typescript
// templates/order-confirmation.ts

export const ORDER_CONFIRMATION_TEMPLATES = {
  en: {
    template_name: 'order_confirmation_en',
    language: 'en',
    category: 'UTILITY',
    content: {
      body: "✅ Order Confirmed!\n\nOrder #{{1}}\nTotal: ₦{{2}}\n\nYour medications will be delivered within {{3}}.\n\nTrack: {{4}}",
      buttons: [
        { type: 'URL', text: 'Track Order', url: '{{4}}' },
      ],
    },
    variables: ['order_number', 'total', 'delivery_time', 'tracking_url'],
  },
  pcm: { // Nigerian Pidgin
    template_name: 'order_confirmation_pcm',
    language: 'pcm',
    category: 'UTILITY',
    content: {
      body: "✅ Your Order Don Confirm!\n\nOrder #{{1}}\nTotal: ₦{{2}}\n\nDem go bring your medicine within {{3}}.\n\nCheck am: {{4}}",
      buttons: [
        { type: 'URL', text: 'Check Order', url: '{{4}}' },
      ],
    },
    variables: ['order_number', 'total', 'delivery_time', 'tracking_url'],
  },
  yo: { // Yoruba
    template_name: 'order_confirmation_yo',
    language: 'yo',
    category: 'UTILITY',
    content: {
      body: "✅ A ti gba Ooda rẹ!\n\nOoda #{{1}}\nIye: ₦{{2}}\n\nOògùn rẹ yoo de laarin {{3}}.\n\nTẹle e: {{4}}",
    },
    variables: ['order_number', 'total', 'delivery_time', 'tracking_url'],
  },
};
```

---

## 16. Workload Balancing

### 16.1 Auto-Release Stale Items

**File**: `src/modules/whatsapp/jobs/queue-maintenance.job.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  WhatsAppPrescriptionQueue,
  WhatsAppPrescriptionQueueDocument,
  QueueStatus,
  QueuePriority,
} from '../entities/whatsapp-prescription-queue.entity';

@Injectable()
export class QueueMaintenanceJob {
  private readonly logger = new Logger(QueueMaintenanceJob.name);

  constructor(
    @InjectModel(WhatsAppPrescriptionQueue.name)
    private queueModel: Model<WhatsAppPrescriptionQueueDocument>,
  ) {}

  /**
   * Release items claimed but not completed within 15 minutes
   */
  @Cron('*/5 * * * *') // Every 5 minutes
  async releaseStaleItems(): Promise<void> {
    const staleThreshold = new Date(Date.now() - 15 * 60 * 1000); // 15 mins

    const result = await this.queueModel.updateMany(
      {
        status: QueueStatus.IN_PROGRESS,
        assigned_at: { $lt: staleThreshold },
      },
      {
        $set: {
          status: QueueStatus.PENDING,
          assigned_to: null,
          assigned_at: null,
        },
        $push: {
          escalation_history: {
            reason: 'AUTO_RELEASED_STALE',
            escalated_at: new Date(),
          },
        },
      },
    );

    if (result.modifiedCount > 0) {
      this.logger.warn(`Auto-released ${result.modifiedCount} stale queue items`);
    }
  }

  /**
   * Escalate items approaching SLA breach
   */
  @Cron('*/2 * * * *') // Every 2 minutes
  async escalateSLAItems(): Promise<void> {
    const warningThreshold = new Date(Date.now() + 15 * 60 * 1000); // 15 mins from now

    // Find items approaching SLA that aren't assigned
    const atRiskItems = await this.queueModel.find({
      status: QueueStatus.PENDING,
      sla_deadline: { $lte: warningThreshold, $gt: new Date() },
      priority: { $ne: QueuePriority.URGENT },
    });

    for (const item of atRiskItems) {
      await this.queueModel.updateOne(
        { _id: item._id },
        {
          $set: { priority: QueuePriority.HIGH },
          $push: {
            escalation_history: {
              reason: 'SLA_WARNING_ESCALATION',
              escalated_at: new Date(),
            },
          },
        },
      );
    }

    if (atRiskItems.length > 0) {
      this.logger.warn(`Escalated ${atRiskItems.length} items approaching SLA breach`);
      // TODO: Alert operations team
    }
  }

  /**
   * Mark SLA breaches
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async markSLABreaches(): Promise<void> {
    const result = await this.queueModel.updateMany(
      {
        status: { $in: [QueueStatus.PENDING, QueueStatus.IN_PROGRESS] },
        sla_deadline: { $lt: new Date() },
        sla_breached: false,
      },
      {
        $set: {
          sla_breached: true,
          sla_breached_at: new Date(),
          priority: QueuePriority.URGENT,
        },
      },
    );

    if (result.modifiedCount > 0) {
      this.logger.error(`${result.modifiedCount} queue items breached SLA`);
      // TODO: Alert operations team
    }
  }

  /**
   * Skill-based routing for controlled substances
   */
  @Cron('*/30 * * * * *') // Every 30 seconds
  async routeControlledSubstances(): Promise<void> {
    // Find unassigned controlled substance items
    const items = await this.queueModel.find({
      queue_type: 'CONTROLLED_SUBSTANCE',
      status: QueueStatus.PENDING,
      assigned_to: null,
    });

    for (const item of items) {
      // Find available senior pharmacist
      const seniorPharmacist = await this.findAvailableSeniorPharmacist();

      if (seniorPharmacist) {
        await this.queueModel.updateOne(
          { _id: item._id },
          {
            $set: {
              assigned_to: seniorPharmacist._id,
              assigned_at: new Date(),
              status: QueueStatus.IN_PROGRESS,
            },
          },
        );
        // TODO: Notify pharmacist
      }
    }
  }

  private async findAvailableSeniorPharmacist(): Promise<any> {
    // Implementation: Query users with senior pharmacist role
    // who have fewest active queue items
    return null; // Placeholder
  }
}
```

### 16.2 Workload Dashboard Stats

```typescript
// Add to whatsapp-queue.controller.ts

@Get('workload')
async getWorkloadStats(): Promise<{
  pharmacists: Array<{
    id: string;
    name: string;
    active_items: number;
    completed_today: number;
    avg_processing_time_mins: number;
    sla_compliance_rate: number;
  }>;
  unassigned: {
    total: number;
    by_priority: Record<string, number>;
    oldest_mins: number;
  };
}> {
  return this.queueService.getWorkloadStats();
}
```

---

## 17. Patient Communication Preferences

### 17.1 Add to Identity Entity

```typescript
// Add to whatsapp-identity.entity.ts

@Prop(raw({
  quiet_hours: {
    enabled: { type: Boolean, default: true },
    start: { type: String, default: '22:00' }, // 10pm
    end: { type: String, default: '07:00' },   // 7am
    timezone: { type: String, default: 'Africa/Lagos' },
  },
  language: { type: String, default: 'en' }, // 'en', 'yo', 'ig', 'pcm'
  sms_fallback: { type: Boolean, default: true },
  notification_types: [{
    type: String,
    enum: ['ORDER_UPDATES', 'PRESCRIPTION_STATUS', 'REFILL_REMINDERS', 'PROMOTIONS', 'SUPPORT'],
  }],
}))
communication_preferences: {
  quiet_hours: {
    enabled: boolean;
    start: string;
    end: string;
    timezone: string;
  };
  language: string;
  sms_fallback: boolean;
  notification_types: string[];
};
```

### 17.2 Preference-Aware Message Sending

```typescript
// In whatsapp-message.service.ts

async sendNotification(
  whatsappNumber: string,
  templateName: string,
  variables: Record<string, string>,
  notificationType: string,
): Promise<void> {
  const identity = await this.identityModel.findOne({ whatsapp_number: whatsappNumber });

  if (!identity) {
    this.logger.warn(`No identity found for ${whatsappNumber}`);
    return;
  }

  const prefs = identity.communication_preferences;

  // Check notification type preference
  if (prefs?.notification_types && !prefs.notification_types.includes(notificationType)) {
    this.logger.log(`User opted out of ${notificationType} notifications`);
    return;
  }

  // Check quiet hours
  if (this.isQuietHours(prefs?.quiet_hours)) {
    // Queue for later
    const nextActiveTime = this.getNextActiveTime(prefs.quiet_hours);
    await this.outboxService.queueMessage({
      whatsappNumber,
      messageType: 'TEMPLATE',
      payload: { templateName, variables },
      priority: 1,
      scheduledFor: nextActiveTime,
    });
    this.logger.log(`Message queued for ${nextActiveTime} (quiet hours)`);
    return;
  }

  // Select language-specific template
  const language = prefs?.language || 'en';
  const localizedTemplate = await this.getTemplateForLanguage(templateName, language);

  // Send message
  try {
    await this.sendTemplateMessage(whatsappNumber, localizedTemplate.twilio_content_sid, variables);
  } catch (error) {
    // SMS fallback
    if (prefs?.sms_fallback) {
      await this.sendSMSFallback(identity.patient_id, templateName, variables);
    }
    throw error;
  }
}

private isQuietHours(quietHours: any): boolean {
  if (!quietHours?.enabled) return false;

  const now = new Date();
  const tz = quietHours.timezone || 'Africa/Lagos';

  // Convert to user's timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const currentTime = formatter.format(now);

  const start = quietHours.start;
  const end = quietHours.end;

  // Handle overnight quiet hours (e.g., 22:00 - 07:00)
  if (start > end) {
    return currentTime >= start || currentTime < end;
  }
  return currentTime >= start && currentTime < end;
}
```

---

## 18. Comprehensive Test Suite

### 18.1 Test File Structure

```
src/modules/whatsapp/__tests__/
├── unit/
│   ├── whatsapp-identity.service.spec.ts
│   ├── whatsapp-session.service.spec.ts
│   ├── whatsapp-rate-limiter.service.spec.ts
│   ├── whatsapp-fraud.service.spec.ts
│   ├── circuit-breaker.service.spec.ts
│   └── controlled-substances.spec.ts
├── integration/
│   ├── webhook-signature.spec.ts
│   ├── prescription-flow.spec.ts
│   ├── payment-flow.spec.ts
│   └── queue-management.spec.ts
└── e2e/
    ├── full-prescription-journey.spec.ts
    └── controlled-substance-journey.spec.ts
```

### 18.2 Sample Test Files

**File**: `src/modules/whatsapp/__tests__/unit/whatsapp-rate-limiter.service.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { WhatsAppRateLimiterService } from '../../services/whatsapp-rate-limiter.service';
import { WhatsAppRateLimit } from '../../entities/whatsapp-rate-limit.entity';

describe('WhatsAppRateLimiterService', () => {
  let service: WhatsAppRateLimiterService;
  let mockModel: any;

  beforeEach(async () => {
    mockModel = {
      findOne: jest.fn(),
      updateOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WhatsAppRateLimiterService,
        {
          provide: getModelToken(WhatsAppRateLimit.name),
          useValue: mockModel,
        },
      ],
    }).compile();

    service = module.get<WhatsAppRateLimiterService>(WhatsAppRateLimiterService);
  });

  describe('checkRateLimit', () => {
    it('should allow request when under daily limit', async () => {
      mockModel.findOne.mockResolvedValue({ count: 2 }); // 2 of 5 allowed

      const result = await service.checkRateLimit('PRESCRIPTION_UPLOAD', '+2348012345678');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(3);
    });

    it('should block request when daily limit exceeded', async () => {
      mockModel.findOne.mockResolvedValue({ count: 5 }); // 5 of 5 used

      const result = await service.checkRateLimit('PRESCRIPTION_UPLOAD', '+2348012345678');

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('DAILY_LIMIT_EXCEEDED');
      expect(result.retry_after).toBeDefined();
    });

    it('should block request when hourly limit exceeded', async () => {
      mockModel.findOne
        .mockResolvedValueOnce({ count: 2 }) // Daily: 2 of 5
        .mockResolvedValueOnce({ count: 3 }); // Hourly: 3 of 3

      const result = await service.checkRateLimit('PRESCRIPTION_UPLOAD', '+2348012345678');

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('HOURLY_LIMIT_EXCEEDED');
    });
  });

  describe('recordAction', () => {
    it('should increment both daily and hourly counters', async () => {
      mockModel.updateOne.mockResolvedValue({ modifiedCount: 1 });

      await service.recordAction('PRESCRIPTION_UPLOAD', '+2348012345678');

      expect(mockModel.updateOne).toHaveBeenCalledTimes(2);
    });
  });
});
```

**File**: `src/modules/whatsapp/__tests__/unit/controlled-substances.spec.ts`

```typescript
import { CONTROLLED_SUBSTANCE_CATEGORIES } from '../../constants/controlled-substances.constant';

describe('Controlled Substance Detection', () => {
  const checkForControlledSubstances = (medications: string[]) => {
    const flags: any[] = [];

    for (const med of medications) {
      const medLower = med.toLowerCase();

      for (const [schedule, config] of Object.entries(CONTROLLED_SUBSTANCE_CATEGORIES)) {
        const matches = (config as any).keywords.some((kw: string) => medLower.includes(kw));
        if (matches) {
          flags.push({ medication: med, schedule, action: (config as any).action });
        }
      }
    }

    return flags;
  };

  describe('Schedule II Detection', () => {
    it('should detect morphine as Schedule II', () => {
      const result = checkForControlledSubstances(['Morphine Sulfate 10mg']);
      expect(result).toHaveLength(1);
      expect(result[0].schedule).toBe('SCHEDULE_II');
      expect(result[0].action).toBe('ENHANCED_VERIFICATION');
    });

    it('should detect oxycodone variants', () => {
      const result = checkForControlledSubstances(['OxyContin 20mg', 'Percocet 5/325']);
      expect(result).toHaveLength(2);
      result.forEach(r => expect(r.schedule).toBe('SCHEDULE_II'));
    });
  });

  describe('Schedule IV Detection', () => {
    it('should detect common benzodiazepines', () => {
      const medications = ['Diazepam 5mg', 'Alprazolam 0.5mg', 'Lorazepam 1mg'];
      const result = checkForControlledSubstances(medications);
      expect(result).toHaveLength(3);
      result.forEach(r => {
        expect(r.schedule).toBe('SCHEDULE_IV');
        expect(r.action).toBe('PHARMACIST_REVIEW');
      });
    });

    it('should detect tramadol', () => {
      const result = checkForControlledSubstances(['Tramadol HCL 50mg']);
      expect(result).toHaveLength(1);
      expect(result[0].schedule).toBe('SCHEDULE_IV');
    });
  });

  describe('Non-Controlled Medications', () => {
    it('should not flag common OTC medications', () => {
      const medications = ['Paracetamol 500mg', 'Ibuprofen 400mg', 'Amoxicillin 500mg'];
      const result = checkForControlledSubstances(medications);
      expect(result).toHaveLength(0);
    });
  });

  describe('Schedule I Rejection', () => {
    it('should reject Schedule I substances', () => {
      const result = checkForControlledSubstances(['Cocaine', 'Heroin']);
      expect(result).toHaveLength(2);
      result.forEach(r => {
        expect(r.schedule).toBe('SCHEDULE_I');
        expect(r.action).toBe('REJECT');
      });
    });
  });
});
```

**File**: `src/modules/whatsapp/__tests__/integration/webhook-signature.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import * as crypto from 'crypto';
import { AppModule } from '../../../../app.module';

describe('WhatsApp Webhook Signature Validation', () => {
  let app: INestApplication;
  const authToken = 'test_auth_token';
  const webhookUrl = 'https://api.rapidcapsule.com/webhooks/whatsapp/twilio';

  beforeAll(async () => {
    process.env.TWILIO_AUTH_TOKEN = authToken;
    process.env.WHATSAPP_WEBHOOK_URL = webhookUrl;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const generateSignature = (body: Record<string, string>): string => {
    const params = Object.keys(body).sort().map(key => `${key}${body[key]}`).join('');
    const data = webhookUrl + params;
    return crypto.createHmac('sha1', authToken).update(Buffer.from(data, 'utf-8')).digest('base64');
  };

  it('should accept request with valid signature', async () => {
    const body = {
      MessageSid: 'SM123',
      AccountSid: 'AC123',
      From: 'whatsapp:+2348012345678',
      To: 'whatsapp:+14155238886',
      Body: 'Hello',
    };

    const signature = generateSignature(body);

    const response = await request(app.getHttpServer())
      .post('/webhooks/whatsapp/twilio')
      .set('x-twilio-signature', signature)
      .send(body);

    expect(response.status).toBe(200);
  });

  it('should reject request with invalid signature', async () => {
    const body = {
      MessageSid: 'SM123',
      AccountSid: 'AC123',
      From: 'whatsapp:+2348012345678',
      To: 'whatsapp:+14155238886',
      Body: 'Hello',
    };

    const response = await request(app.getHttpServer())
      .post('/webhooks/whatsapp/twilio')
      .set('x-twilio-signature', 'invalid_signature')
      .send(body);

    expect(response.status).toBe(401);
  });

  it('should reject request with missing signature', async () => {
    const body = {
      MessageSid: 'SM123',
      From: 'whatsapp:+2348012345678',
      Body: 'Hello',
    };

    const response = await request(app.getHttpServer())
      .post('/webhooks/whatsapp/twilio')
      .send(body);

    expect(response.status).toBe(401);
  });
});
```

---

## Appendix D: Updated Implementation Timeline

### Phase 1: Foundation (Week 1-2)
- [x] Core entities and services
- [ ] **NEW: Fraud service integration**
- [ ] **NEW: Circuit breaker implementation**
- [ ] **NEW: Outbox pattern for reliable messaging**

### Phase 2: Message Flows (Week 2-3)
- [ ] Verification, prescription, order flows
- [ ] **NEW: Saga coordinator for complex flows**
- [ ] **NEW: Error recovery handlers**

### Phase 3: Queue & Verification (Week 3-4)
- [ ] Queue management
- [ ] **NEW: Prescriber verification service (MDCN manual queue)**
- [ ] **NEW: Workload balancing and auto-release**

### Phase 4: Orders & Payments (Week 4-5)
- [ ] Payment flow
- [ ] **NEW: Delivery coordination handler**
- [ ] **NEW: Delivery status webhooks**

### Phase 5: Admin & Monitoring (Week 5-6)
- [ ] Admin dashboard
- [ ] **NEW: Template management**
- [ ] **NEW: Communication preferences**

### Phase 6: Testing & Polish (Week 6-7)
- [ ] **NEW: Comprehensive test suite**
- [ ] **NEW: Circuit breaker testing**
- [ ] **NEW: SLA monitoring and alerts**

---

**Document Version**: 2.0.0
**Last Updated**: January 2025
**Author**: Development Team
**Status**: Ready for Implementation
