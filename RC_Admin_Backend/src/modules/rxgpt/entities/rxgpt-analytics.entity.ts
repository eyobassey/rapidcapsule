import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type RxGPTAnalyticsDocument = HydratedDocument<RxGPTAnalytics>;

/**
 * RxGPT Alert Record (embedded)
 */
@Schema({ _id: false })
export class RxGPTAlertRecord {
  @Prop({
    type: String,
    enum: ['allergy', 'interaction', 'contraindication', 'dosage', 'age', 'pregnancy'],
    required: true,
  })
  type: string;

  @Prop({ type: String, enum: ['info', 'warning', 'critical'], required: true })
  severity: string;

  @Prop({ type: String, required: true })
  drug_name: string;

  @Prop({ type: String, required: true })
  message: string;
}

export const RxGPTAlertRecordSchema = SchemaFactory.createForClass(RxGPTAlertRecord);

/**
 * RxGPT Analytics Entity
 * Tracks individual RxGPT analysis sessions for reporting and auditing
 */
@Schema({
  collection: 'rxgpt_analytics',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class RxGPTAnalytics {
  // ============ IDENTIFIERS ============

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true })
  specialist_id: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true })
  patient_id: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'SpecialistPrescription' })
  prescription_id: Types.ObjectId;

  // ============ ANALYSIS CONTEXT ============

  @Prop({ type: [mongoose.Schema.Types.ObjectId], ref: 'Appointment', default: [] })
  linked_appointments: Types.ObjectId[];

  @Prop({ type: [mongoose.Schema.Types.ObjectId], default: [] })
  linked_clinical_notes: Types.ObjectId[];

  @Prop({ type: [mongoose.Schema.Types.ObjectId], ref: 'HealthCheckup', default: [] })
  linked_health_checkups: Types.ObjectId[];

  // ============ DRUGS ANALYZED ============

  @Prop(
    raw([
      {
        drug_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Drug' },
        drug_name: { type: String },
        generic_name: { type: String },
        strength: { type: String },
        dosage: { type: String },
        is_appropriate: { type: Boolean },
        confidence: { type: Number },
      },
    ]),
  )
  drugs_analyzed: {
    drug_id: Types.ObjectId;
    drug_name: string;
    generic_name?: string;
    strength: string;
    dosage: string;
    is_appropriate: boolean;
    confidence: number;
  }[];

  // ============ RESULTS ============

  @Prop({ type: Boolean, required: true })
  is_safe: boolean;

  @Prop({ type: String, enum: ['low', 'moderate', 'high', 'critical'], required: true })
  overall_risk_level: string;

  @Prop({ type: Number, required: true })
  confidence_score: number;

  // ============ ALERTS ============

  @Prop({ type: [RxGPTAlertRecordSchema], default: [] })
  alerts: RxGPTAlertRecord[];

  @Prop({ type: Number, default: 0 })
  total_alerts: number;

  @Prop({ type: Number, default: 0 })
  critical_alerts: number;

  @Prop({ type: Number, default: 0 })
  warning_alerts: number;

  @Prop({ type: Number, default: 0 })
  info_alerts: number;

  // ============ RECOMMENDATIONS ============

  @Prop({ type: Number, default: 0 })
  recommendations_count: number;

  @Prop({ type: [String], default: [] })
  recommendation_types: string[];

  // ============ AI MODEL INFO ============

  @Prop({ type: String, required: true })
  ai_model: string;

  @Prop({ type: Number, required: true })
  tokens_used: number;

  @Prop({ type: Number, required: true })
  response_time_ms: number;

  // ============ CREDITS ============

  @Prop({ type: Number, required: true })
  credits_used: number;

  // ============ CLINICAL SUMMARY ============

  @Prop({ type: String })
  clinical_summary: string;

  // ============ RAW RESPONSE (for debugging) ============

  @Prop({ type: mongoose.Schema.Types.Mixed })
  raw_response: any;

  // ============ TIMESTAMPS ============

  created_at: Date;
  updated_at: Date;
}

export const RxGPTAnalyticsSchema = SchemaFactory.createForClass(RxGPTAnalytics);

// ============ INDEXES ============

// Compound index for date range queries by specialist
RxGPTAnalyticsSchema.index({ specialist_id: 1, created_at: -1 });

// Index for patient analysis history
RxGPTAnalyticsSchema.index({ patient_id: 1, created_at: -1 });

// Index for analytics aggregation
RxGPTAnalyticsSchema.index({ created_at: -1 });

// Index for finding critical alerts
RxGPTAnalyticsSchema.index({ critical_alerts: 1, created_at: -1 });

// Index for risk level filtering
RxGPTAnalyticsSchema.index({ overall_risk_level: 1, created_at: -1 });
