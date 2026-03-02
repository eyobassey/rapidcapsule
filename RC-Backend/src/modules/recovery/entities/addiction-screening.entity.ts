import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type AddictionScreeningDocument = HydratedDocument<AddictionScreening>;

export enum ScreeningInstrumentType {
  AUDIT = 'audit',
  DAST10 = 'dast10',
  CAGE = 'cage',
  ASSIST = 'assist',
  COWS = 'cows',
  CIWA_AR = 'ciwa_ar',
}

export enum ScreeningType {
  SELF = 'self',
  SPECIALIST_ADMINISTERED = 'specialist_administered',
  SCHEDULED = 'scheduled',
}

export enum RiskLevel {
  LOW = 'low',
  MILD = 'mild',
  MODERATE = 'moderate',
  HIGH = 'high',
  MODERATELY_SEVERE = 'moderately_severe',
  SEVERE = 'severe',
}

@Schema({
  collection: 'addiction_screenings',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class AddictionScreening {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  user: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  administered_by: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    enum: {
      values: [
        ScreeningInstrumentType.AUDIT,
        ScreeningInstrumentType.DAST10,
        ScreeningInstrumentType.CAGE,
        ScreeningInstrumentType.ASSIST,
        ScreeningInstrumentType.COWS,
        ScreeningInstrumentType.CIWA_AR,
      ],
    },
  })
  instrument: ScreeningInstrumentType;

  @Prop({
    type: String,
    enum: {
      values: [
        ScreeningType.SELF,
        ScreeningType.SPECIALIST_ADMINISTERED,
        ScreeningType.SCHEDULED,
      ],
    },
    default: ScreeningType.SELF,
  })
  screening_type: ScreeningType;

  @Prop({ type: mongoose.Schema.Types.Mixed, required: true })
  answers: Record<string, any>;

  @Prop({ type: Number, required: true })
  total_score: number;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  subscale_scores: Record<string, number>;

  @Prop({
    type: String,
    required: true,
    enum: {
      values: [
        RiskLevel.LOW,
        RiskLevel.MILD,
        RiskLevel.MODERATE,
        RiskLevel.HIGH,
        RiskLevel.MODERATELY_SEVERE,
        RiskLevel.SEVERE,
      ],
    },
  })
  risk_level: RiskLevel;

  @Prop({ type: String })
  risk_zone_label: string;

  @Prop({ type: [String] })
  substances_identified: string[];

  @Prop({ type: mongoose.Schema.Types.Mixed })
  ai_interpretation: {
    generated_at?: Date;
    model?: string;
    content?: {
      summary: string;
      risk_assessment: string;
      recommended_interventions: string[];
      recommended_specialist_type: string;
      urgency: string;
      brief_intervention_notes: string;
      motivational_message: string;
      comparison_to_previous: string;
    };
    error?: string;
  };

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' })
  linked_appointment: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'RecoveryPlan' })
  linked_recovery_plan: Types.ObjectId;

  @Prop({ type: Number })
  duration_ms: number;

  @Prop({ type: Boolean, default: false })
  is_baseline: boolean;

  @Prop({ type: Date })
  next_screening_due: Date;

  @Prop({ type: Date })
  deleted_at: Date;
}

export const AddictionScreeningSchema =
  SchemaFactory.createForClass(AddictionScreening);
