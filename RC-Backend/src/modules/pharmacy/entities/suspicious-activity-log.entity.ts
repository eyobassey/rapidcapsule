import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type SuspiciousActivityLogDocument =
  HydratedDocument<SuspiciousActivityLog>;

export enum SuspiciousActivityType {
  MULTIPLE_SPECIALISTS = 'multiple_specialists',
  MULTIPLE_PHARMACIES = 'multiple_pharmacies',
  DOSE_ESCALATION = 'dose_escalation',
  EARLY_REFILL_ATTEMPT = 'early_refill_attempt',
  EXCEEDS_PERIOD_LIMIT = 'exceeds_period_limit',
  CONTROLLED_SUBSTANCE_PATTERN = 'controlled_substance_pattern',
  CROSS_PATIENT_PATTERN = 'cross_patient_pattern',
}

export enum SuspiciousActivitySeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'suspicious_activity_logs',
})
export class SuspiciousActivityLog {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true })
  patient: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Drug' })
  drug: mongoose.Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(SuspiciousActivityType),
    required: true,
    index: true,
  })
  activity_type: SuspiciousActivityType;

  @Prop({
    type: String,
    enum: Object.values(SuspiciousActivitySeverity),
    required: true,
    index: true,
  })
  severity: SuspiciousActivitySeverity;

  @Prop({ type: String, required: true })
  message: string;

  @Prop(
    raw({
      specialists_involved: { type: [mongoose.Schema.Types.ObjectId], ref: 'User' },
      pharmacies_involved: { type: [mongoose.Schema.Types.ObjectId], ref: 'Pharmacy' },
      prescriptions_involved: { type: [mongoose.Schema.Types.ObjectId], ref: 'SpecialistPrescription' },
      previous_dose: { type: String },
      current_dose: { type: String },
      quantity_requested: { type: Number },
      quantity_allowed: { type: Number },
      period_days: { type: Number },
      additional_context: { type: String },
    }),
  )
  details: {
    specialists_involved?: mongoose.Types.ObjectId[];
    pharmacies_involved?: mongoose.Types.ObjectId[];
    prescriptions_involved?: mongoose.Types.ObjectId[];
    previous_dose?: string;
    current_dose?: string;
    quantity_requested?: number;
    quantity_allowed?: number;
    period_days?: number;
    additional_context?: string;
  };

  @Prop({ type: Boolean, default: false })
  admin_notified: boolean;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  reviewed_by: mongoose.Types.ObjectId;

  @Prop({ type: Date })
  reviewed_at: Date;

  @Prop({ type: String })
  resolution: string;

  @Prop({ type: Date })
  deleted_at: Date;
}

export const SuspiciousActivityLogSchema =
  SchemaFactory.createForClass(SuspiciousActivityLog);

SuspiciousActivityLogSchema.index({ created_at: -1 });
SuspiciousActivityLogSchema.index({ severity: 1, admin_notified: 1 });
