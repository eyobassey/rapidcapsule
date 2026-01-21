import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type BasicHealthScoreHistoryDocument = HydratedDocument<BasicHealthScoreHistory>;

export enum ScoreChangeTrigger {
  VITALS_UPDATED = 'vitals_updated',
  HEALTH_CHECKUP_COMPLETED = 'health_checkup_completed',
  PROFILE_UPDATED = 'profile_updated',
  MANUAL_RECALCULATION = 'manual_recalculation',
  INITIAL_CALCULATION = 'initial_calculation',
}

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'basic_health_score_history',
})
export class BasicHealthScoreHistory {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true })
  user_id: Types.ObjectId;

  @Prop({ type: Number })
  score: number | null;

  @Prop({ type: Number })
  previous_score: number | null;

  @Prop({ type: String })
  status: string; // 'excellent', 'good', 'fair', 'poor', 'incomplete'

  @Prop({
    type: String,
    enum: Object.values(ScoreChangeTrigger),
    required: true,
  })
  trigger: ScoreChangeTrigger;

  @Prop({ type: String })
  trigger_details: string; // e.g., "Blood pressure updated", "Health checkup completed"

  @Prop(
    raw({
      bmi: { points: { type: Number }, status: { type: String }, message: { type: String }, value: { type: Number } },
      bloodPressure: { points: { type: Number }, status: { type: String }, message: { type: String }, value: { type: String } },
      pulseRate: { points: { type: Number }, status: { type: String }, message: { type: String }, value: { type: Number } },
      temperature: { points: { type: Number }, status: { type: String }, message: { type: String }, value: { type: Number } },
      bloodSugar: { points: { type: Number }, status: { type: String }, message: { type: String }, value: { type: Number } },
      triage: { points: { type: Number }, status: { type: String }, message: { type: String }, recentTriage: { type: String } },
      riskFactors: { points: { type: Number }, factors: [{ type: Object }], message: { type: String } },
      dataCompleteness: { points: { type: Number }, completeness: { type: Number }, message: { type: String } },
    }),
  )
  breakdown: any;

  @Prop(
    raw({
      vitals_snapshot: { type: Object },
      profile_snapshot: {
        height: { type: Number },
        weight: { type: Number },
        date_of_birth: { type: Date },
        is_smoker: { type: String },
        has_recent_injuries: { type: String },
        pre_existing_conditions_count: { type: Number },
      },
      recent_checkup_triage: { type: String },
    }),
  )
  data_snapshot: any; // Snapshot of data used for calculation (for audit)
}

export const BasicHealthScoreHistorySchema = SchemaFactory.createForClass(BasicHealthScoreHistory);

// Index for efficient queries
BasicHealthScoreHistorySchema.index({ user_id: 1, created_at: -1 });
