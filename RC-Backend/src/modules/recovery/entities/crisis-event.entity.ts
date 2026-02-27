import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type CrisisEventDocument = HydratedDocument<CrisisEvent>;

export enum CrisisType {
  SUICIDAL_IDEATION = 'suicidal_ideation',
  OVERDOSE_SUSPECTED = 'overdose_suspected',
  OVERDOSE_CONFIRMED = 'overdose_confirmed',
  SEVERE_WITHDRAWAL = 'severe_withdrawal',
  RELAPSE_WITH_DANGER = 'relapse_with_danger',
  SELF_HARM = 'self_harm',
  PSYCHOTIC_EPISODE = 'psychotic_episode',
  DOMESTIC_VIOLENCE = 'domestic_violence',
  WEARABLE_ALERT = 'wearable_alert',
  PATIENT_INITIATED = 'patient_initiated',
  COMPANION_DETECTED = 'companion_detected',
  SPECIALIST_INITIATED = 'specialist_initiated',
}

export enum CrisisStatus {
  ACTIVE = 'active',
  RESPONDING = 'responding',
  STABILIZED = 'stabilized',
  RESOLVED = 'resolved',
  ESCALATED_EXTERNAL = 'escalated_external',
}

export enum CrisisSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  LIFE_THREATENING = 'life_threatening',
}

@Schema({
  collection: 'crisis_events',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class CrisisEvent {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  user: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    enum: { values: Object.values(CrisisType) },
  })
  crisis_type: CrisisType;

  @Prop({
    type: String,
    required: true,
    enum: { values: Object.values(CrisisStatus) },
    default: CrisisStatus.ACTIVE,
  })
  status: CrisisStatus;

  @Prop({
    type: String,
    enum: { values: Object.values(CrisisSeverity) },
  })
  severity: CrisisSeverity;

  @Prop({ type: String })
  trigger_source: string;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  detection_data: Record<string, any>;

  @Prop(
    raw([
      {
        action: { type: String, required: true },
        actor: { type: String },
        timestamp: { type: Date, default: Date.now },
        details: { type: String },
      },
    ]),
  )
  response_timeline: Record<string, any>[];

  @Prop(
    raw([
      {
        recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        channel: { type: String },
        sent_at: { type: Date },
        acknowledged_at: { type: Date },
      },
    ]),
  )
  notifications_sent: Record<string, any>[];

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  resolved_by: Types.ObjectId;

  @Prop({ type: Date })
  resolved_at: Date;

  @Prop({ type: String })
  resolution_notes: string;

  @Prop({ type: String })
  follow_up_plan: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' })
  follow_up_appointment: Types.ObjectId;
}

export const CrisisEventSchema = SchemaFactory.createForClass(CrisisEvent);
