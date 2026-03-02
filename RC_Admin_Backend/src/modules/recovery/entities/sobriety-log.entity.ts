import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SobrietyLogDocument = SobrietyLog & Document;

@Schema({
  collection: 'sobriety_logs',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class SobrietyLog {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  user: Types.ObjectId;

  @Prop({ type: Date, required: true, index: true })
  log_date: Date;

  @Prop({ type: Boolean, required: true })
  sober_today: boolean;

  @Prop({ type: Number })
  mood_score: number;

  @Prop({ type: Number })
  craving_intensity: number;

  @Prop({ type: [String] })
  substances_craved: string[];

  @Prop({ type: Number })
  energy_level: number;

  @Prop({ type: Number })
  sleep_quality: number;

  @Prop({ type: Number })
  sleep_hours: number;

  @Prop({ type: Number })
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

  @Prop({ type: Object })
  relapse_details: Record<string, any>;
}

export const SobrietyLogSchema = SchemaFactory.createForClass(SobrietyLog);
