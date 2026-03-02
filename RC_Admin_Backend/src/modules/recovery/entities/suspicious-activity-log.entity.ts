import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SuspiciousActivityLogDocument = SuspiciousActivityLog & Document;

@Schema({
  collection: 'suspicious_activity_logs',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class SuspiciousActivityLog {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  patient: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Drug' })
  drug: Types.ObjectId;

  @Prop({ type: String, required: true })
  activity_type: string;

  @Prop({ type: String, required: true })
  severity: string;

  @Prop({ type: String })
  message: string;

  @Prop({ type: Object })
  details: Record<string, any>;

  @Prop({ type: Boolean, default: false })
  admin_notified: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  reviewed_by: Types.ObjectId;

  @Prop({ type: Date })
  reviewed_at: Date;

  @Prop({ type: String })
  resolution: string;

  @Prop({ type: Date })
  deleted_at: Date;
}

export const SuspiciousActivityLogSchema = SchemaFactory.createForClass(SuspiciousActivityLog);
