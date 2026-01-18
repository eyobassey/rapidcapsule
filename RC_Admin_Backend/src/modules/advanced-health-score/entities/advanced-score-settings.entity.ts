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
};
