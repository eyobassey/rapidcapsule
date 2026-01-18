import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type FraudAlertDocument = FraudAlert & Document;

export enum FraudAlertType {
  DUPLICATE_PRESCRIPTION = 'DUPLICATE_PRESCRIPTION',
  DOCTOR_SHOPPING = 'DOCTOR_SHOPPING',
  EARLY_REFILL = 'EARLY_REFILL',
  QUANTITY_ABUSE = 'QUANTITY_ABUSE',
  FORGERY_SUSPECTED = 'FORGERY_SUSPECTED',
  MODIFIED_PRESCRIPTION = 'MODIFIED_PRESCRIPTION',
  EXPIRED_PRESCRIPTION = 'EXPIRED_PRESCRIPTION',
  INVALID_PRESCRIBER = 'INVALID_PRESCRIBER',
  CONTROLLED_SUBSTANCE_ABUSE = 'CONTROLLED_SUBSTANCE_ABUSE',
  UNUSUAL_PATTERN = 'UNUSUAL_PATTERN',
  MULTIPLE_PHARMACIES = 'MULTIPLE_PHARMACIES',
  HIGH_RISK_COMBINATION = 'HIGH_RISK_COMBINATION',
  IDENTITY_MISMATCH = 'IDENTITY_MISMATCH',
  GEOGRAPHIC_ANOMALY = 'GEOGRAPHIC_ANOMALY',
}

export enum FraudAlertSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum FraudAlertStatus {
  NEW = 'NEW',
  INVESTIGATING = 'INVESTIGATING',
  CONFIRMED_FRAUD = 'CONFIRMED_FRAUD',
  FALSE_POSITIVE = 'FALSE_POSITIVE',
  RESOLVED = 'RESOLVED',
  ESCALATED = 'ESCALATED',
}

// Interface for fraud alert action tracking
export interface FraudAlertAction {
  action: string;
  performed_by?: Types.ObjectId;
  performed_by_name?: string;
  performed_at?: Date;
  notes?: string;
}

@Schema({ timestamps: true, collection: 'fraud_alerts' })
export class FraudAlert {
  @Prop({
    type: String,
    enum: FraudAlertType,
    required: true,
    index: true,
  })
  alert_type: FraudAlertType;

  @Prop({
    type: String,
    enum: FraudAlertSeverity,
    required: true,
    index: true,
  })
  severity: FraudAlertSeverity;

  @Prop({
    type: String,
    enum: FraudAlertStatus,
    default: FraudAlertStatus.NEW,
    index: true,
  })
  status: FraudAlertStatus;

  @Prop({ type: Types.ObjectId, ref: 'Prescription', index: true })
  prescription: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  patient: Types.ObjectId;

  @Prop({ type: String })
  patient_name: string;

  @Prop({ type: String })
  patient_email: string;

  @Prop({ type: Types.ObjectId, ref: 'Order' })
  order: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Pharmacy' })
  pharmacy: Types.ObjectId;

  @Prop({ required: true })
  description: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  evidence: Record<string, any>;

  @Prop({ type: [{ type: Types.ObjectId }], default: [] })
  related_prescriptions: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId }], default: [] })
  related_orders: Types.ObjectId[];

  @Prop({ type: Number, min: 0, max: 100 })
  risk_score: number;

  @Prop({ type: [String], default: [] })
  risk_indicators: string[];

  @Prop({ type: Types.ObjectId, ref: 'User' })
  assigned_to: Types.ObjectId;

  @Prop({ type: String })
  assigned_to_name: string;

  @Prop({ type: Date })
  assigned_at: Date;

  @Prop({ type: String })
  resolution: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  resolved_by: Types.ObjectId;

  @Prop({ type: String })
  resolved_by_name: string;

  @Prop({ type: Date })
  resolved_at: Date;

  @Prop({
    type: [raw({
      action: { type: String, required: true },
      performed_by: { type: MongooseSchema.Types.ObjectId, ref: 'User' },
      performed_by_name: { type: String },
      performed_at: { type: Date, default: Date.now },
      notes: { type: String },
    })],
    default: [],
  })
  actions: FraudAlertAction[];

  @Prop({ type: Boolean, default: false })
  patient_blocked: boolean;

  @Prop({ type: Date })
  patient_blocked_at: Date;

  @Prop({ type: Boolean, default: false })
  reported_to_authorities: boolean;

  @Prop({ type: Date })
  reported_at: Date;

  @Prop({ type: String })
  authority_reference: string;

  @Prop({ type: Boolean, default: false })
  is_auto_generated: boolean;

  @Prop({ type: String })
  detection_method: string;

  @Prop({ type: Date, default: Date.now, index: true })
  created_at: Date;

  @Prop({ type: Date })
  updated_at: Date;
}

export const FraudAlertSchema = SchemaFactory.createForClass(FraudAlert);

// Indexes
FraudAlertSchema.index({ status: 1, severity: 1 });
FraudAlertSchema.index({ patient: 1, created_at: -1 });
FraudAlertSchema.index({ assigned_to: 1, status: 1 });
FraudAlertSchema.index({ created_at: -1 });
