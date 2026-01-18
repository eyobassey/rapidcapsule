import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as mongoose from 'mongoose';

export type AdvancedScoreSettingsDocument = AdvancedScoreSettings & Document;

@Schema({
  collection: 'advanced_score_settings',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class AdvancedScoreSettings {
  @Prop({ type: Number, required: true, default: 3 })
  credit_cost: number;

  @Prop({ type: Boolean, default: true })
  is_enabled: boolean;

  @Prop({ type: Number, default: 5 })
  max_documents: number;

  @Prop({
    type: [String],
    default: ['application/pdf', 'image/jpeg', 'image/png'],
  })
  allowed_file_types: string[];

  @Prop({ type: Number, default: 10 })
  max_file_size_mb: number;

  // Health Checkup Inclusion Settings
  @Prop({ type: Number, default: 14 })
  checkup_auto_include_days: number; // Auto-include checkups from last X days

  @Prop({ type: Number, default: 30 })
  checkup_auto_exclude_days: number; // Auto-exclude checkups older than X days

  @Prop({ type: Boolean, default: true })
  allow_patient_checkup_exclusion: boolean; // Allow patient to exclude checkups

  @Prop({ type: Boolean, default: true })
  exclude_self_care_triage: boolean; // Exclude checkups with self_care triage level

  // Credit Sharing Settings
  @Prop({ type: Boolean, default: true })
  credit_sharing_enabled: boolean; // Allow patients to share credits with each other

  @Prop({ type: Number, default: 1 })
  credit_sharing_min_amount: number; // Minimum credits per transfer

  @Prop({ type: Number, default: 50 })
  credit_sharing_max_amount: number; // Maximum credits per transfer

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  updated_by: Types.ObjectId;

  created_at: Date;
  updated_at: Date;
}

export const AdvancedScoreSettingsSchema = SchemaFactory.createForClass(AdvancedScoreSettings);

// Default settings values for seeding
export const DEFAULT_SETTINGS = {
  credit_cost: 3,
  is_enabled: true,
  max_documents: 5,
  allowed_file_types: ['application/pdf', 'image/jpeg', 'image/png'],
  max_file_size_mb: 10,
  checkup_auto_include_days: 14,
  checkup_auto_exclude_days: 30,
  allow_patient_checkup_exclusion: true,
  exclude_self_care_triage: true,
  credit_sharing_enabled: true,
  credit_sharing_min_amount: 1,
  credit_sharing_max_amount: 50,
};
