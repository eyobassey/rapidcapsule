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

  // Timestamps (auto-managed)
  created_at: Date;
  updated_at: Date;
}

export const WhatsAppIdentitySchema = SchemaFactory.createForClass(WhatsAppIdentity);

// Indexes
WhatsAppIdentitySchema.index({ patient_id: 1 });
WhatsAppIdentitySchema.index({ status: 1, is_verified: 1 });
WhatsAppIdentitySchema.index({ 'pending_verification.otp_expires_at': 1 });
