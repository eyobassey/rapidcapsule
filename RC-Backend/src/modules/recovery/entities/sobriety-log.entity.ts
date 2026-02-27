import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type SobrietyLogDocument = HydratedDocument<SobrietyLog>;

export enum CravingOutcome {
  RESISTED = 'resisted',
  USED = 'used',
  REDUCED = 'reduced',
}

@Schema({
  collection: 'sobriety_logs',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class SobrietyLog {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  user: Types.ObjectId;

  @Prop({ type: Date, required: true, index: true })
  log_date: Date;

  @Prop({ type: Boolean, required: true })
  sober_today: boolean;

  @Prop({ type: Number, min: 1, max: 10 })
  mood_score: number;

  @Prop({ type: Number, min: 0, max: 10 })
  craving_intensity: number;

  @Prop({ type: [String] })
  substances_craved: string[];

  @Prop({ type: Number, min: 1, max: 10 })
  energy_level: number;

  @Prop({ type: Number, min: 1, max: 10 })
  sleep_quality: number;

  @Prop({ type: Number })
  sleep_hours: number;

  @Prop({ type: Number, min: 1, max: 10 })
  anxiety_level: number;

  @Prop({ type: [String] })
  triggers_encountered: string[];

  @Prop({ type: [String] })
  coping_strategies_used: string[];

  @Prop({ type: Boolean })
  medications_taken: boolean;

  @Prop({ type: Boolean })
  attended_meeting_or_session: boolean;

  @Prop({ type: Boolean })
  exercised: boolean;

  @Prop({ type: String })
  gratitude_note: string;

  @Prop({ type: String })
  notes: string;

  @Prop(
    raw({
      substance: { type: String },
      amount: { type: String },
      trigger: { type: String },
      location: { type: String },
      was_planned: { type: Boolean },
      sought_help_after: { type: Boolean },
      notes: { type: String },
    }),
  )
  relapse_details: Record<string, any>;
}

export const SobrietyLogSchema = SchemaFactory.createForClass(SobrietyLog);

SobrietyLogSchema.index({ user: 1, log_date: -1 }, { unique: true });
