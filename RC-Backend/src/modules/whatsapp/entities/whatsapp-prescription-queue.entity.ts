import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type WhatsAppPrescriptionQueueDocument = HydratedDocument<WhatsAppPrescriptionQueue>;

export enum QueueType {
  OCR_REVIEW = 'OCR_REVIEW', // 70-89% confidence
  MANUAL_ENTRY = 'MANUAL_ENTRY', // 50-69% confidence
  CONTROLLED_SUBSTANCE = 'CONTROLLED_SUBSTANCE', // Controlled drug detected
  VERIFICATION_FAILED = 'VERIFICATION_FAILED', // Tier 1/2 verification failed
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

  // Image data (optional for chat escalations)
  @Prop({ type: String })
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
      extracted_fields: { type: mongoose.Schema.Types.Mixed },
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

  @Prop({ type: String })
  escalation_reason: string; // Reason for pharmacist escalation

  // Chat messages (for PHARMACIST_ESCALATION queue type)
  @Prop(
    raw([
      {
        from: { type: String, enum: ['patient', 'pharmacist', 'system'] },
        message: { type: String },
        timestamp: { type: Date },
        type: { type: String, default: 'text' },
        media_url: { type: String },
      },
    ]),
  )
  messages: Array<{
    from: 'patient' | 'pharmacist' | 'system';
    message: string;
    timestamp: Date;
    type: string;
    media_url?: string;
  }>;

  // Completion tracking
  @Prop({ type: Date })
  completed_at: Date;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  completed_by: Types.ObjectId;

  @Prop({ type: String })
  resolution_notes: string;

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

  // Timestamps (auto-managed)
  created_at: Date;
  updated_at: Date;
}

export const WhatsAppPrescriptionQueueSchema = SchemaFactory.createForClass(
  WhatsAppPrescriptionQueue,
);

// Indexes for queue queries
WhatsAppPrescriptionQueueSchema.index({
  queue_type: 1,
  status: 1,
  priority: -1,
  created_at: 1,
});
WhatsAppPrescriptionQueueSchema.index({ assigned_to: 1, status: 1 });
WhatsAppPrescriptionQueueSchema.index({ sla_deadline: 1, sla_breached: 1 });
WhatsAppPrescriptionQueueSchema.index({ patient_id: 1, created_at: -1 });
