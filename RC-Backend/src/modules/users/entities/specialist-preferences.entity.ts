import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  Preferences,
  TimeAvailability,
  RateCards,
  TwoFactorSettings,
  NotificationPreferences,
  ChannelIntegrations,
  PrivacyConsents,
} from '../types/preference.types';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type SpecialistPreferencesDocument =
  HydratedDocument<SpecialistPreferences>;

@Schema({ collection: 'specialist_preferences' })
export class SpecialistPreferences {
  @Prop(
    raw([
      {
        day: { type: String, required: true },
        start_time: {
          type: String,
          required: true,
        },
        end_time: { type: String, required: true },
        slot_type: { type: String, default: 'routine' }, // 'routine' | 'urgent' | 'both' | 'break'
      },
    ]),
  )
  time_availability: TimeAvailability[];

  @Prop(
    raw({
      gender: { type: String, default: 'All' },
      language: { type: String, default: 'English (African)' },
      timezone: { type: String, default: 'UTC + 1 (West African Time)' },
    }),
  )
  preferences: Preferences;

  @Prop(
    raw({
      preferred_channels: { type: [String], default: ['zoom', 'whatsapp', 'phone'] },
      zoom_configured: { type: Boolean, default: false },
      google_meet_configured: { type: Boolean, default: false },
      teams_configured: { type: Boolean, default: false },
      whatsapp_number: { type: String },
      phone_number: { type: String },
    }),
  )
  meeting_preferences: any;

  @Prop(
    raw({
      currency: { type: String, default: 'NGN' },
      video_consultation: {
        enabled: { type: Boolean, default: true },
        routine_rate: { type: Number, default: null },
        urgent_rate: { type: Number, default: null },
      },
      audio_consultation: {
        enabled: { type: Boolean, default: true },
        routine_rate: { type: Number, default: null },
        urgent_rate: { type: Number, default: null },
      },
      chat_consultation: {
        enabled: { type: Boolean, default: true },
        flat_rate: { type: Number, default: null },
      },
      prescription_review: {
        enabled: { type: Boolean, default: false },
        review_fee: { type: Number, default: null },
      },
      platform_fee_percent: { type: Number, default: 10 },
      payment_processing_percent: { type: Number, default: 1.5 },
      payment_processing_fixed: { type: Number, default: 100 },
    }),
  )
  rate_cards: RateCards;

  // Dynamic service rates - keyed by service slug
  // Structure: { [slug]: { enabled: boolean, routine_rate?: number, urgent_rate?: number, flat_rate?: number } }
  @Prop({ type: Object, default: {} })
  service_rates: Record<string, {
    enabled: boolean;
    routine_rate?: number;
    urgent_rate?: number;
    flat_rate?: number;
  }>;

  // Two-Factor Authentication settings
  @Prop(
    raw({
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      authenticator_app: { type: Boolean, default: false },
    }),
  )
  two_factor: TwoFactorSettings;

  // Notification preferences matrix
  @Prop(
    raw({
      new_appointment: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        whatsapp: { type: Boolean, default: false },
      },
      urgent_triage: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        whatsapp: { type: Boolean, default: true },
      },
      earnings: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
        push: { type: Boolean, default: false },
        whatsapp: { type: Boolean, default: false },
      },
    }),
  )
  notifications: NotificationPreferences;

  // Consultation channel integrations
  @Prop(
    raw({
      rapid_video: { type: Boolean, default: true },
      zoom: { type: Boolean, default: false },
      whatsapp: { type: Boolean, default: false },
    }),
  )
  channels: ChannelIntegrations;

  // Communication languages (array of language names)
  @Prop({ type: [String], default: ['English'] })
  communication_languages: string[];

  // Privacy and data processing consents
  @Prop(
    raw({
      ndpr: { type: Boolean, default: false },
      ai_processing: { type: Boolean, default: false },
    }),
  )
  privacy_consents: PrivacyConsents;

  // Final consents for practice activation
  @Prop(
    raw({
      code_of_conduct: { type: Boolean, default: false },
      professional_indemnity: { type: Boolean, default: false },
      accepted_at: { type: Date, default: null },
    }),
  )
  final_consents: {
    code_of_conduct: boolean;
    professional_indemnity: boolean;
    accepted_at: Date | null;
  };

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;
}
export const SpecialistPreferencesSchema = SchemaFactory.createForClass(
  SpecialistPreferences,
);
