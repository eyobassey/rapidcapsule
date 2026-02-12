import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TrialSessionDocument = TrialSession & Document;

export enum TrialStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  EXPIRED = 'expired',
  EXHAUSTED = 'exhausted',
}

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, collection: 'trial_sessions' })
export class TrialSession {
  @Prop({ required: true, lowercase: true, trim: true, index: true })
  email: string;

  @Prop({ required: true, trim: true })
  first_name: string;

  @Prop({ required: true, trim: true })
  last_name: string;

  @Prop({ required: true, unique: true, index: true })
  token_hash: string;

  @Prop({ required: true, index: true })
  ip_address: string;

  @Prop({ default: '' })
  user_agent: string;

  @Prop({ default: '' })
  device_fingerprint: string;

  @Prop({ required: true, enum: TrialStatus, default: TrialStatus.PENDING })
  status: TrialStatus;

  // Usage tracking
  @Prop({ default: false })
  symptom_checker_used: boolean;

  @Prop({ default: false })
  rxgpt_used: boolean;

  @Prop({ default: false })
  prescription_used: boolean;

  @Prop({ type: Object, default: null })
  symptom_checker_result: Record<string, any>;

  @Prop({ type: Object, default: null })
  rxgpt_result: Record<string, any>;

  @Prop({ type: Object, default: null })
  prescription_result: Record<string, any>;

  // Reference to the prescription upload record (for status polling)
  @Prop({ default: null })
  prescription_upload_id: string;

  // Infermedica interview token for multi-step symptom checker
  @Prop({ default: null })
  interview_token: string;

  // Abuse prevention
  @Prop({ default: 0 })
  verification_attempts: number;

  @Prop()
  verified_at: Date;

  @Prop({ required: true, index: true })
  expires_at: Date;

  @Prop()
  last_activity_at: Date;
}

export const TrialSessionSchema = SchemaFactory.createForClass(TrialSession);

// TTL index: auto-delete expired sessions after 30 days
TrialSessionSchema.index({ expires_at: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });
