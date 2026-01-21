import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { User } from '../../users/entities/user.entity';

export type PatientAccessLogDocument = PatientAccessLog & Document;

export enum AccessType {
  VIEW_PROFILE = 'view_profile',
  VIEW_HEALTH_RECORDS = 'view_health_records',
  SEARCH = 'search',
}

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: false } })
export class PatientAccessLog {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
    required: true,
    index: true,
  })
  specialist_id: Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
    required: true,
    index: true,
  })
  patient_id: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(AccessType),
    required: true,
  })
  access_type: AccessType;

  @Prop({ type: Boolean, default: false })
  had_prior_appointment: boolean;

  @Prop({ type: String })
  ip_address: string;

  @Prop({ type: String })
  user_agent: string;

  @Prop({ type: Date })
  created_at: Date;
}

export const PatientAccessLogSchema =
  SchemaFactory.createForClass(PatientAccessLog);

// Indexes for querying access logs
PatientAccessLogSchema.index({ specialist_id: 1, created_at: -1 });
PatientAccessLogSchema.index({ patient_id: 1, created_at: -1 });
