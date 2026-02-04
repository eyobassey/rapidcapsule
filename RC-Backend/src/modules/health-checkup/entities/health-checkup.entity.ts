import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export enum CheckupOwner {
  DEPENDANT = 'Dependant',
  SELF = 'Self',
  THIRD_PARTY = 'Third Party',
}
export type HealthCheckupDocument = HydratedDocument<HealthCheckup>;

@Schema({
  collection: 'health_checkups',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class HealthCheckup {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({
    type: String,
    enum: {
      values: [
        CheckupOwner.SELF,
        CheckupOwner.DEPENDANT,
        CheckupOwner.THIRD_PARTY,
      ],
    },
    default: CheckupOwner.SELF,
  })
  health_check_for: CheckupOwner;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  checkup_owner_id: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  request: any;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  response: any;

  @Prop({ type: Number })
  interview_duration: number;

  @Prop({ type: Number })
  considered_diagnoses: number;

  @Prop({ type: String, index: true })
  interview_token: string;

  @Prop({ type: Boolean, default: false })
  has_symptom_duration: boolean;

  @Prop({ type: Boolean, default: false })
  is_triage_focused: boolean;

  @Prop({ type: Boolean, default: false })
  auto_triage_detected: boolean;

  @Prop({ type: Number, default: 0 })
  triage_optimization_score: number;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  claude_summary: {
    generated_at?: Date;
    model?: string;
    content?: {
      overview: string;
      key_findings: string[];
      possible_conditions_explained: Array<{
        condition: string;
        explanation: string;
        urgency: string;
      }>;
      recommendations: string[];
      when_to_seek_care: string;
      lifestyle_tips?: string[];
    };
    error?: string;
  };

  @Prop({ type: Date })
  deleted_at: Date;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' })
  linked_appointment: Types.ObjectId;
}
export const HealthCheckupSchema = SchemaFactory.createForClass(HealthCheckup);
