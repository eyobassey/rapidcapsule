import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RecoveryProfileDocument = RecoveryProfile & Document;

@Schema({
  collection: 'recovery_profiles',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class RecoveryProfile {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  user: Types.ObjectId;

  @Prop({ type: String })
  status: string;

  @Prop(raw([{ substance: { type: String }, is_primary: { type: Boolean }, last_use_date: { type: Date }, years_of_use: { type: Number } }]))
  substance_use_history: Record<string, any>[];

  @Prop({ type: Date })
  sobriety_start_date: Date;

  @Prop({ type: Number, default: 0 })
  longest_sobriety_days: number;

  @Prop({ type: [Date] })
  relapse_dates: Date[];

  @Prop({ type: Number, default: 0 })
  total_relapse_count: number;

  @Prop({ type: Date })
  enrolled_at: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  enrolled_by: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'RecoveryPlan' })
  current_plan: Types.ObjectId;

  @Prop(raw([{ user: { type: Types.ObjectId, ref: 'User' }, role: { type: String }, assigned_at: { type: Date }, is_active: { type: Boolean } }]))
  care_team: Record<string, any>[];

  @Prop({ type: Number, default: 0 })
  current_risk_score: number;

  @Prop({ type: String, default: 'low' })
  current_risk_level: string;

  @Prop({ type: Date })
  risk_updated_at: Date;

  @Prop(raw([{ score: { type: Number }, level: { type: String }, calculated_at: { type: Date }, signals: { type: Object } }]))
  risk_history: Record<string, any>[];

  @Prop(raw({ treatment_consent: { given: { type: Boolean } }, data_sharing_consent: { given: { type: Boolean } }, emergency_contact_consent: { given: { type: Boolean } }, wearable_monitoring_consent: { given: { type: Boolean } }, ai_companion_consent: { given: { type: Boolean } } }))
  consent: Record<string, any>;

  @Prop({ type: String })
  care_level: string;

  @Prop(raw({ screening_score_at_enrollment: { type: Number }, screening_score_current: { type: Number }, days_in_program: { type: Number }, appointments_attended: { type: Number }, appointments_missed: { type: Number }, journal_entries_count: { type: Number }, companion_sessions_count: { type: Number }, milestones_achieved: { type: Number } }))
  outcomes: Record<string, any>;

  @Prop({ type: Date })
  deleted_at: Date;
}

export const RecoveryProfileSchema = SchemaFactory.createForClass(RecoveryProfile);
