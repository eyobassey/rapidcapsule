import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type RecoveryPlanDocument = HydratedDocument<RecoveryPlan>;

export enum PlanStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  REVISED = 'revised',
  ABANDONED = 'abandoned',
}

export enum StageStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  SKIPPED = 'skipped',
}

export enum StageName {
  ASSESSMENT = 'assessment',
  DETOX = 'detox',
  STABILIZATION = 'stabilization',
  ACTIVE_TREATMENT = 'active_treatment',
  MAINTENANCE = 'maintenance',
  AFTERCARE = 'aftercare',
}

export enum InterventionType {
  INDIVIDUAL_THERAPY = 'individual_therapy',
  GROUP_THERAPY = 'group_therapy',
  MEDICATION = 'medication',
  PEER_SUPPORT = 'peer_support',
  FAMILY_THERAPY = 'family_therapy',
  PSYCHOEDUCATION = 'psychoeducation',
  HARM_REDUCTION = 'harm_reduction',
}

@Schema({
  collection: 'recovery_plans',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class RecoveryPlan {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  user: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  created_by: Types.ObjectId;

  @Prop({ type: String, required: true })
  plan_name: string;

  @Prop({
    type: String,
    required: true,
    enum: { values: Object.values(PlanStatus) },
    default: PlanStatus.DRAFT,
  })
  status: PlanStatus;

  @Prop(
    raw([
      {
        stage_id: { type: String, required: true },
        name: {
          type: String,
          enum: Object.values(StageName),
          required: true,
        },
        order: { type: Number },
        status: {
          type: String,
          enum: Object.values(StageStatus),
          default: StageStatus.PENDING,
        },
        started_at: { type: Date },
        completed_at: { type: Date },
        estimated_duration_weeks: { type: Number },
        goals: [
          {
            goal_id: { type: String },
            description: { type: String },
            measurable_target: { type: String },
            status: {
              type: String,
              enum: Object.values(StageStatus),
              default: StageStatus.PENDING,
            },
            target_date: { type: Date },
            achieved_at: { type: Date },
            evidence: { type: String },
          },
        ],
        interventions: [
          {
            type: {
              type: String,
              enum: Object.values(InterventionType),
            },
            description: { type: String },
            frequency: { type: String },
            assigned_to: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
          },
        ],
      },
    ]),
  )
  stages: Record<string, any>[];

  @Prop(
    raw({
      personal_triggers: [{ type: String }],
      warning_signs: [{ type: String }],
      coping_strategies: [{ type: String }],
      support_contacts: [
        {
          name: { type: String },
          phone: { type: String },
          role: { type: String },
        },
      ],
      safe_activities: [{ type: String }],
      emergency_plan: { type: String },
      high_risk_situations: [
        {
          situation: { type: String },
          plan: { type: String },
        },
      ],
    }),
  )
  relapse_prevention: Record<string, any>;

  @Prop({ type: Date })
  next_review_date: Date;

  @Prop({ type: Number, default: 0 })
  revision_number: number;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'RecoveryPlan' })
  previous_version: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  ai_generated_plan: {
    generated_at?: Date;
    model?: string;
    input_context?: string;
    was_accepted?: boolean;
    specialist_modifications?: string[];
  };

  @Prop({ type: Date })
  deleted_at: Date;
}

export const RecoveryPlanSchema = SchemaFactory.createForClass(RecoveryPlan);
