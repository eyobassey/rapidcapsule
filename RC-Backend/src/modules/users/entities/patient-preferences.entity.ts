import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { BloodType, Genotype, AllergySeverity } from './dependant.entity';

export type PatientPreferencesDocument = HydratedDocument<PatientPreferences>;

// Allergy types
export interface PatientAllergy {
  allergen: string;
  type: 'drug' | 'food' | 'environmental' | 'insect' | 'latex' | 'other';
  reaction: string;
  severity: AllergySeverity;
  diagnosed_date?: Date;
  diagnosed_by?: string;
  notes?: string;
  is_verified?: boolean;
}

// Medication types
export interface CurrentMedication {
  name: string;
  generic_name?: string;
  dosage: string;
  frequency: string; // 'once_daily', 'twice_daily', 'three_times_daily', 'as_needed', etc.
  route: string; // 'oral', 'topical', 'injection', 'inhalation', etc.
  start_date?: Date;
  end_date?: Date;
  prescribed_by?: string;
  reason?: string;
  pharmacy?: string;
  refills_remaining?: number;
  is_active: boolean;
}

// Surgery/Procedure types
export interface PastSurgery {
  procedure_name: string;
  date: Date;
  hospital?: string;
  surgeon?: string;
  reason?: string;
  complications?: string;
  notes?: string;
}

// Family history types
export interface FamilyHistoryEntry {
  condition: string;
  relative: string; // 'mother', 'father', 'sibling', 'grandparent', 'aunt', 'uncle'
  age_of_onset?: number;
  is_deceased?: boolean;
  cause_of_death?: string;
  notes?: string;
}

// Immunization types
export interface Immunization {
  vaccine_name: string;
  date_administered: Date;
  administered_by?: string;
  lot_number?: string;
  next_dose_due?: Date;
  notes?: string;
}

// Lifestyle types
export interface LifestyleInfo {
  smoking: 'never' | 'former' | 'current' | 'occasional';
  smoking_details?: {
    packs_per_day?: number;
    years_smoked?: number;
    quit_date?: Date;
  };
  alcohol: 'never' | 'occasional' | 'moderate' | 'heavy';
  alcohol_details?: {
    drinks_per_week?: number;
    type?: string;
  };
  exercise: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  exercise_details?: {
    type?: string;
    frequency_per_week?: number;
    duration_minutes?: number;
  };
  diet: 'regular' | 'vegetarian' | 'vegan' | 'pescatarian' | 'keto' | 'paleo' | 'halal' | 'kosher' | 'other';
  diet_restrictions?: string[];
  sleep_hours_per_night?: number;
  stress_level?: 'low' | 'moderate' | 'high' | 'very_high';
  occupation?: string;
  occupation_hazards?: string[];
}

// Device integration types
export interface ConnectedDevice {
  device_id: string;
  device_type: 'blood_pressure_monitor' | 'glucose_meter' | 'pulse_oximeter' | 'weight_scale' | 'thermometer' | 'fitness_tracker' | 'smartwatch' | 'other';
  device_name: string;
  manufacturer?: string;
  model?: string;
  connected_at: Date;
  last_sync?: Date;
  is_active: boolean;
  auto_sync_enabled: boolean;
}

// Health app integration types
export interface HealthAppIntegration {
  app_type: 'apple_health' | 'google_fit' | 'fitbit' | 'samsung_health' | 'garmin' | 'strava' | 'myfitnesspal' | 'other';
  app_name: string;
  connected_at: Date;
  last_sync?: Date;
  is_active: boolean;
  permissions_granted: string[];
  access_token?: string;
  refresh_token?: string;
  token_expires_at?: Date;
}

@Schema({
  collection: 'patient_preferences',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class PatientPreferences {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  // ==================== BASIC HEALTH INFO ====================
  @Prop({
    type: String,
    enum: Object.values(BloodType),
  })
  blood_type: BloodType;

  @Prop({
    type: String,
    enum: Object.values(Genotype),
  })
  genotype: Genotype;

  @Prop({ type: String })
  occupation: string;

  @Prop({ type: String })
  primary_physician: string;

  @Prop({ type: String })
  primary_physician_phone: string;

  @Prop({ type: String })
  preferred_pharmacy: string;

  @Prop({ type: String })
  preferred_pharmacy_address: string;

  // ==================== ALLERGIES ====================
  @Prop({ type: Boolean, default: null })
  has_allergies: boolean;

  @Prop({ type: Boolean, default: false })
  no_known_allergies_confirmed: boolean;

  @Prop(
    raw([
      {
        allergen: { type: String, required: true },
        type: { type: String, enum: ['drug', 'food', 'environmental', 'insect', 'latex', 'other'], default: 'other' },
        reaction: { type: String },
        severity: { type: String, enum: Object.values(AllergySeverity), default: AllergySeverity.MODERATE },
        diagnosed_date: { type: Date },
        diagnosed_by: { type: String },
        notes: { type: String },
        is_verified: { type: Boolean, default: false },
      },
    ]),
  )
  allergies: PatientAllergy[];

  // ==================== CURRENT MEDICATIONS ====================
  @Prop(
    raw([
      {
        name: { type: String, required: true },
        generic_name: { type: String },
        dosage: { type: String },
        frequency: { type: String },
        route: { type: String, default: 'oral' },
        start_date: { type: Date },
        end_date: { type: Date },
        prescribed_by: { type: String },
        reason: { type: String },
        pharmacy: { type: String },
        refills_remaining: { type: Number },
        is_active: { type: Boolean, default: true },
      },
    ]),
  )
  current_medications: CurrentMedication[];

  // ==================== PAST SURGERIES ====================
  @Prop(
    raw([
      {
        procedure_name: { type: String, required: true },
        date: { type: Date },
        hospital: { type: String },
        surgeon: { type: String },
        reason: { type: String },
        complications: { type: String },
        notes: { type: String },
      },
    ]),
  )
  past_surgeries: PastSurgery[];

  // ==================== FAMILY HISTORY ====================
  @Prop(
    raw([
      {
        condition: { type: String, required: true },
        relative: { type: String, required: true },
        age_of_onset: { type: Number },
        is_deceased: { type: Boolean },
        cause_of_death: { type: String },
        notes: { type: String },
      },
    ]),
  )
  family_history: FamilyHistoryEntry[];

  // ==================== IMMUNIZATIONS ====================
  @Prop(
    raw([
      {
        vaccine_name: { type: String, required: true },
        date_administered: { type: Date, required: true },
        administered_by: { type: String },
        lot_number: { type: String },
        next_dose_due: { type: Date },
        notes: { type: String },
      },
    ]),
  )
  immunizations: Immunization[];

  // ==================== LIFESTYLE ====================
  @Prop(
    raw({
      smoking: { type: String, enum: ['never', 'former', 'current', 'occasional'] },
      smoking_details: {
        packs_per_day: { type: Number },
        years_smoked: { type: Number },
        quit_date: { type: Date },
      },
      alcohol: { type: String, enum: ['never', 'occasional', 'moderate', 'heavy'] },
      alcohol_details: {
        drinks_per_week: { type: Number },
        type: { type: String },
      },
      exercise: { type: String, enum: ['sedentary', 'light', 'moderate', 'active', 'very_active'] },
      exercise_details: {
        type: { type: String },
        frequency_per_week: { type: Number },
        duration_minutes: { type: Number },
      },
      diet: { type: String, enum: ['regular', 'vegetarian', 'vegan', 'pescatarian', 'keto', 'paleo', 'halal', 'kosher', 'other'] },
      diet_restrictions: { type: [String], default: [] },
      sleep_hours_per_night: { type: Number },
      stress_level: { type: String, enum: ['low', 'moderate', 'high', 'very_high'] },
      occupation: { type: String },
      occupation_hazards: { type: [String], default: [] },
    }),
  )
  lifestyle: LifestyleInfo;

  // ==================== DEVICE INTEGRATIONS ====================
  @Prop(
    raw([
      {
        device_id: { type: String, required: true },
        device_type: { type: String, enum: ['blood_pressure_monitor', 'glucose_meter', 'pulse_oximeter', 'weight_scale', 'thermometer', 'fitness_tracker', 'smartwatch', 'other'] },
        device_name: { type: String },
        manufacturer: { type: String },
        model: { type: String },
        connected_at: { type: Date, default: Date.now },
        last_sync: { type: Date },
        is_active: { type: Boolean, default: true },
        auto_sync_enabled: { type: Boolean, default: true },
      },
    ]),
  )
  connected_devices: ConnectedDevice[];

  // ==================== HEALTH APP INTEGRATIONS ====================
  @Prop(
    raw([
      {
        app_type: { type: String, enum: ['apple_health', 'google_fit', 'fitbit', 'samsung_health', 'garmin', 'strava', 'myfitnesspal', 'other'] },
        app_name: { type: String },
        connected_at: { type: Date },
        last_sync: { type: Date },
        is_active: { type: Boolean, default: true },
        permissions_granted: { type: [String], default: [] },
        access_token: { type: String },
        refresh_token: { type: String },
        token_expires_at: { type: Date },
      },
    ]),
  )
  health_apps: HealthAppIntegration[];

  // ==================== DATA SHARING CONSENTS ====================
  @Prop(
    raw({
      vitals_auto_sync: { type: Boolean, default: false },
      activity_tracking: { type: Boolean, default: false },
      sleep_tracking: { type: Boolean, default: false },
      nutrition_tracking: { type: Boolean, default: false },
      share_with_specialists: { type: Boolean, default: true },
      share_with_emergency_contacts: { type: Boolean, default: true },
      anonymous_research_contribution: { type: Boolean, default: false },
      ai_health_insights: { type: Boolean, default: true },
    }),
  )
  data_sharing_consents: {
    vitals_auto_sync: boolean;
    activity_tracking: boolean;
    sleep_tracking: boolean;
    nutrition_tracking: boolean;
    share_with_specialists: boolean;
    share_with_emergency_contacts: boolean;
    anonymous_research_contribution: boolean;
    ai_health_insights: boolean;
  };

  // ==================== NOTIFICATION PREFERENCES ====================
  @Prop(
    raw({
      health_reminders: {
        enabled: { type: Boolean, default: true },
        channels: { type: [String], default: ['push', 'email'] },
      },
      medication_reminders: {
        enabled: { type: Boolean, default: true },
        channels: { type: [String], default: ['push', 'sms'] },
      },
      appointment_reminders: {
        enabled: { type: Boolean, default: true },
        channels: { type: [String], default: ['push', 'email', 'sms'] },
        remind_before_hours: { type: [Number], default: [24, 2] },
      },
      wellness_tips: {
        enabled: { type: Boolean, default: false },
        channels: { type: [String], default: ['push'] },
        frequency: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'weekly' },
      },
      lab_results: {
        enabled: { type: Boolean, default: true },
        channels: { type: [String], default: ['push', 'email'] },
      },
      prescription_updates: {
        enabled: { type: Boolean, default: true },
        channels: { type: [String], default: ['push', 'sms'] },
      },
    }),
  )
  notification_preferences: {
    health_reminders: { enabled: boolean; channels: string[] };
    medication_reminders: { enabled: boolean; channels: string[] };
    appointment_reminders: { enabled: boolean; channels: string[]; remind_before_hours: number[] };
    wellness_tips: { enabled: boolean; channels: string[]; frequency: string };
    lab_results: { enabled: boolean; channels: string[] };
    prescription_updates: { enabled: boolean; channels: string[] };
  };

  // ==================== HEALTH GOALS ====================
  @Prop(
    raw([
      {
        goal_type: { type: String, enum: ['weight_loss', 'weight_gain', 'fitness', 'blood_pressure', 'blood_sugar', 'sleep', 'stress', 'nutrition', 'quit_smoking', 'reduce_alcohol', 'other'] },
        target_value: { type: Number },
        target_unit: { type: String },
        target_date: { type: Date },
        current_value: { type: Number },
        description: { type: String },
        is_active: { type: Boolean, default: true },
        created_at: { type: Date, default: Date.now },
        completed_at: { type: Date },
      },
    ]),
  )
  health_goals: {
    goal_type: string;
    target_value: number;
    target_unit: string;
    target_date: Date;
    current_value: number;
    description: string;
    is_active: boolean;
    created_at: Date;
    completed_at: Date;
  }[];

  // ==================== ONBOARDING STATUS ====================
  @Prop(
    raw({
      is_complete: { type: Boolean, default: false },
      completed_at: { type: Date },
      steps_completed: {
        personal_details: { type: Boolean, default: false },
        address_emergency: { type: Boolean, default: false },
        dependants: { type: Boolean, default: false },
        vitals_metrics: { type: Boolean, default: false },
        allergies: { type: Boolean, default: false },
        medical_history: { type: Boolean, default: false },
        device_integration: { type: Boolean, default: false },
      },
      skipped_steps: { type: [String], default: [] },
      last_step_completed: { type: String },
      last_updated: { type: Date },
    }),
  )
  onboarding_status: {
    is_complete: boolean;
    completed_at: Date;
    steps_completed: {
      personal_details: boolean;
      address_emergency: boolean;
      dependants: boolean;
      vitals_metrics: boolean;
      allergies: boolean;
      medical_history: boolean;
      device_integration: boolean;
    };
    skipped_steps: string[];
    last_step_completed: string;
    last_updated: Date;
  };

  // ==================== PRIVACY CONSENTS ====================
  @Prop(
    raw({
      terms_accepted: { type: Boolean, default: false },
      privacy_policy_accepted: { type: Boolean, default: false },
      hipaa_acknowledged: { type: Boolean, default: false },
      marketing_consent: { type: Boolean, default: false },
      accepted_at: { type: Date },
    }),
  )
  privacy_consents: {
    terms_accepted: boolean;
    privacy_policy_accepted: boolean;
    hipaa_acknowledged: boolean;
    marketing_consent: boolean;
    accepted_at: Date;
  };

  // ==================== ACCESSIBILITY PREFERENCES ====================
  @Prop(
    raw({
      large_text: { type: Boolean, default: false },
      high_contrast: { type: Boolean, default: false },
      screen_reader_optimized: { type: Boolean, default: false },
      preferred_language: { type: String, default: 'en' },
      timezone: { type: String },
    }),
  )
  accessibility: {
    large_text: boolean;
    high_contrast: boolean;
    screen_reader_optimized: boolean;
    preferred_language: string;
    timezone: string;
  };
}

export const PatientPreferencesSchema = SchemaFactory.createForClass(PatientPreferences);

// Index for fast lookup by userId
PatientPreferencesSchema.index({ userId: 1 }, { unique: true });
