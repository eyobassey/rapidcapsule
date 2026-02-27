import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type RecoveryProfileDocument = HydratedDocument<RecoveryProfile>;

export enum RecoveryStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  DISCHARGED = 'discharged',
  WITHDRAWN = 'withdrawn',
  ARCHIVED = 'archived',
}

export enum SubstanceType {
  ALCOHOL = 'alcohol',
  OPIOIDS = 'opioids',
  CANNABIS = 'cannabis',
  COCAINE = 'cocaine',
  AMPHETAMINES = 'amphetamines',
  BENZODIAZEPINES = 'benzodiazepines',
  TOBACCO = 'tobacco',
  INHALANTS = 'inhalants',
  HALLUCINOGENS = 'hallucinogens',
  SEDATIVES = 'sedatives',
  OTHER = 'other',
}

export enum RouteOfAdministration {
  ORAL = 'oral',
  NASAL = 'nasal',
  INJECTION = 'injection',
  SMOKING = 'smoking',
  TOPICAL = 'topical',
  SUBLINGUAL = 'sublingual',
  TRANSDERMAL = 'transdermal',
}

export enum UseFrequency {
  DAILY = 'daily',
  SEVERAL_TIMES_WEEKLY = 'several_times_weekly',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  OCCASIONAL = 'occasional',
}

export enum CareLevel {
  DETOX = 'detox',
  INTENSIVE_OUTPATIENT = 'intensive_outpatient',
  OUTPATIENT = 'outpatient',
  AFTERCARE = 'aftercare',
  MAINTENANCE = 'maintenance',
}

export enum CareTeamRole {
  PRIMARY_COUNSELOR = 'primary_counselor',
  PSYCHIATRIST = 'psychiatrist',
  PEER_SUPPORTER = 'peer_supporter',
  GP = 'gp',
  PHARMACIST = 'pharmacist',
  FAMILY_THERAPIST = 'family_therapist',
}

@Schema({
  collection: 'recovery_profiles',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class RecoveryProfile {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  user: Types.ObjectId;

  @Prop({
    type: String,
    enum: {
      values: [
        RecoveryStatus.ACTIVE,
        RecoveryStatus.PAUSED,
        RecoveryStatus.COMPLETED,
        RecoveryStatus.DISCHARGED,
        RecoveryStatus.WITHDRAWN,
        RecoveryStatus.ARCHIVED,
      ],
    },
    default: RecoveryStatus.ACTIVE,
  })
  status: RecoveryStatus;

  @Prop(
    raw([
      {
        substance: {
          type: String,
          enum: Object.values(SubstanceType),
          required: true,
        },
        is_primary: { type: Boolean, default: false },
        age_of_first_use: { type: Number },
        years_of_use: { type: Number },
        route_of_administration: {
          type: String,
          enum: Object.values(RouteOfAdministration),
        },
        frequency_at_peak: {
          type: String,
          enum: Object.values(UseFrequency),
        },
        last_use_date: { type: Date },
        quantity_at_peak: { type: String },
        previous_treatment_attempts: { type: Number, default: 0 },
        previous_treatment_types: [{ type: String }],
      },
    ]),
  )
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

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  enrolled_by: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'RecoveryPlan' })
  current_plan: Types.ObjectId;

  @Prop(
    raw([
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        role: {
          type: String,
          enum: Object.values(CareTeamRole),
        },
        assigned_at: { type: Date, default: Date.now },
        is_active: { type: Boolean, default: true },
      },
    ]),
  )
  care_team: Record<string, any>[];

  @Prop({ type: Number, default: 0 })
  current_risk_score: number;

  @Prop({
    type: String,
    enum: { values: ['low', 'moderate', 'high', 'critical'] },
    default: 'low',
  })
  current_risk_level: string;

  @Prop({ type: Date })
  risk_updated_at: Date;

  @Prop(
    raw([
      {
        _id: false,
        score: { type: Number },
        level: { type: String },
        calculated_at: { type: Date },
        signals: { type: mongoose.Schema.Types.Mixed },
      },
    ]),
  )
  risk_history: Record<string, any>[];

  @Prop(
    raw({
      treatment_consent: {
        given: { type: Boolean, default: false },
        date: { type: Date },
        ip_address: { type: String },
      },
      data_sharing_consent: {
        given: { type: Boolean, default: false },
        date: { type: Date },
        share_with: [{ type: String }],
      },
      emergency_contact_consent: {
        given: { type: Boolean, default: false },
        date: { type: Date },
      },
      wearable_monitoring_consent: {
        given: { type: Boolean, default: false },
        date: { type: Date },
      },
      ai_companion_consent: {
        given: { type: Boolean, default: false },
        date: { type: Date },
      },
      research_consent: {
        given: { type: Boolean, default: false },
        date: { type: Date },
      },
    }),
  )
  consent: Record<string, any>;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'AddictionScreening' })
  baseline_screening: Types.ObjectId;

  @Prop({
    type: String,
    enum: { values: Object.values(CareLevel) },
  })
  care_level: CareLevel;

  @Prop(
    raw({
      screening_score_at_enrollment: { type: Number },
      screening_score_current: { type: Number },
      days_in_program: { type: Number, default: 0 },
      appointments_attended: { type: Number, default: 0 },
      appointments_missed: { type: Number, default: 0 },
      journal_entries_count: { type: Number, default: 0 },
      companion_sessions_count: { type: Number, default: 0 },
      milestones_achieved: { type: Number, default: 0 },
      medications_prescribed: [{ type: String }],
    }),
  )
  outcomes: Record<string, any>;

  @Prop({ type: Date })
  deleted_at: Date;

  @Prop({ type: Date })
  archived_at: Date;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'RecoveryProfile' })
  previous_programme: Types.ObjectId;
}

export const RecoveryProfileSchema =
  SchemaFactory.createForClass(RecoveryProfile);

// Partial unique index: only one non-archived, non-deleted profile per user
RecoveryProfileSchema.index(
  { user: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $ne: 'archived' },
      deleted_at: { $exists: false },
    },
  },
);
