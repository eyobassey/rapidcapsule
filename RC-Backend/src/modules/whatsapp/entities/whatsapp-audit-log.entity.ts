import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
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
  STANDARD = 'STANDARD', // 2 years
  PRESCRIPTION = 'PRESCRIPTION', // 7 years
  CONTROLLED = 'CONTROLLED', // 10 years
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

  // Timestamp (auto-managed as 'timestamp')
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
