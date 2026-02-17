import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TrialSettingsDocument = TrialSettings & Document;

@Schema({
  collection: 'trial_settings',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class TrialSettings {
  @Prop({ type: Number, default: 15 })
  eka_message_limit: number;

  @Prop({ type: Boolean, default: true })
  eka_enabled: boolean;
}

export const TrialSettingsSchema = SchemaFactory.createForClass(TrialSettings);
