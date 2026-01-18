import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as mongoose from 'mongoose';
import {
  HealthDomain,
  AssessmentStatus,
  AnswerSubmission,
  UploadedDocument,
  ProfileSnapshot,
  HealthReport,
  ConfidenceLevel,
  PriorityLevel,
} from '../types/advanced-score.types';

export type AdvancedHealthScoreDocument = AdvancedHealthScore & Document;

@Schema({
  collection: 'advanced_health_scores',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class AdvancedHealthScore {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  user_id: Types.ObjectId;

  // Input Data - Answers
  @Prop({
    type: [
      {
        question_id: { type: mongoose.Schema.Types.ObjectId, ref: 'AdvancedScoreQuestion' },
        domain: { type: String, enum: Object.values(HealthDomain) },
        question_text: { type: String },
        answer_value: { type: mongoose.Schema.Types.Mixed }, // string | string[] | number
        answer_label: { type: String },
      },
    ],
    default: [],
  })
  answers: AnswerSubmission[];

  // Input Data - Documents
  @Prop({
    type: [
      {
        original_name: { type: String },
        file_type: { type: String },
        s3_key: { type: String },
        s3_url: { type: String },
        uploaded_at: { type: Date },
      },
    ],
    default: [],
  })
  documents: UploadedDocument[];

  // Profile Snapshot at time of assessment
  @Prop({
    type: {
      age: { type: Number, default: null },
      gender: { type: String, default: null },
      height: {
        type: { value: Number, unit: String },
        default: null,
      },
      weight: {
        type: { value: Number, unit: String },
        default: null,
      },
      bmi: { type: Number, default: null },
      pre_existing_conditions: { type: [String], default: [] },
      is_smoker: { type: Boolean, default: null },
      recent_vitals: {
        type: {
          blood_pressure: { type: String, default: null },
          blood_sugar: { type: String, default: null },
          pulse_rate: { type: String, default: null },
          temperature: { type: String, default: null },
        },
        default: {},
      },
    },
    default: {},
  })
  profile_snapshot: ProfileSnapshot;

  // AI-Generated Report
  @Prop({
    type: {
      overall_score: { type: Number },
      overall_status: { type: String },
      overall_summary: { type: String },
      domain_scores: {
        type: [
          {
            domain: { type: String, enum: Object.values(HealthDomain) },
            domain_label: { type: String },
            score: { type: Number },
            status: { type: String },
            insights: { type: String },
            recommendations: { type: [String], default: [] },
          },
        ],
        default: [],
      },
      priority_actions: {
        type: [
          {
            priority: { type: String, enum: Object.values(PriorityLevel) },
            action: { type: String },
            reason: { type: String },
          },
        ],
        default: [],
      },
      detailed_analysis: { type: String },
      lifestyle_tips: { type: [String], default: [] },
      when_to_see_doctor: { type: [String], default: [] },
      confidence_level: {
        type: String,
        enum: Object.values(ConfidenceLevel),
      },
      data_sources_used: { type: [String], default: [] },
      disclaimer: { type: String },
    },
    default: null,
  })
  report: HealthReport | null;

  // Metadata
  @Prop({ type: Number, required: true })
  credits_used: number;

  @Prop({ type: String, default: 'purchased' })
  credit_source: string;

  @Prop({ type: String, default: 'claude-3-sonnet' })
  ai_model: string;

  @Prop({ type: Number, default: 0 })
  generation_time_ms: number;

  @Prop({
    type: String,
    enum: Object.values(AssessmentStatus),
    default: AssessmentStatus.COMPLETED,
  })
  status: AssessmentStatus;

  @Prop({ type: String, default: null })
  error_message: string | null;

  created_at: Date;
  updated_at: Date;
}

export const AdvancedHealthScoreSchema = SchemaFactory.createForClass(AdvancedHealthScore);

// Indexes
AdvancedHealthScoreSchema.index({ user_id: 1, created_at: -1 });
AdvancedHealthScoreSchema.index({ status: 1 });
AdvancedHealthScoreSchema.index({ created_at: -1 });
