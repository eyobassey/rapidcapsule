import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type PeerAssignmentDocument = HydratedDocument<PeerAssignment>;

export enum PeerAssignmentStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  PAUSED = 'paused',
  ENDED = 'ended',
}

@Schema({
  collection: 'peer_assignments',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class PeerAssignment {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  patient: Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  peer_supporter: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  assigned_by: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(PeerAssignmentStatus),
    default: PeerAssignmentStatus.PENDING,
  })
  status: string;

  @Prop(
    raw({
      shared_substance: { type: Boolean, default: false },
      age_proximity: { type: Boolean, default: false },
      gender_match: { type: Boolean, default: false },
      match_score: { type: Number, default: 0 },
    }),
  )
  match_criteria: {
    shared_substance?: boolean;
    age_proximity?: boolean;
    gender_match?: boolean;
    match_score?: number;
  };

  @Prop(
    raw({
      frequency: { type: String, enum: ['daily', 'every_other_day', 'weekly', 'biweekly'], default: 'weekly' },
      preferred_time: { type: String },
      preferred_method: { type: String, enum: ['chat', 'call', 'video', 'in_person'], default: 'chat' },
    }),
  )
  check_in_schedule: {
    frequency?: string;
    preferred_time?: string;
    preferred_method?: string;
  };

  @Prop({
    type: [
      {
        date: { type: Date, default: Date.now },
        method: { type: String },
        notes: { type: String },
        mood_before: { type: Number },
        mood_after: { type: Number },
        logged_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      },
    ],
    default: [],
  })
  check_ins: Array<{
    date: Date;
    method?: string;
    notes?: string;
    mood_before?: number;
    mood_after?: number;
    logged_by?: Types.ObjectId;
  }>;

  @Prop({ type: Date })
  patient_consent_date: Date;

  @Prop({ type: Date })
  peer_consent_date: Date;

  @Prop({ type: Date })
  ended_at: Date;

  @Prop({ type: String })
  end_reason: string;

  @Prop({ type: Date })
  deleted_at: Date;
}

export const PeerAssignmentSchema =
  SchemaFactory.createForClass(PeerAssignment);
