import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  AdminDefaultSettingsTypes,
  PaymentProvider,
  SplitRatio,
  DrugInteractionSettings,
} from "../types/settings.types";
import { HydratedDocument } from 'mongoose';
import { SpecialistRate } from '../types/settings.types';

export type AdminSettingsDocument = HydratedDocument<AdminSetting>;


@Schema({
  collection: 'admin_settings',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class AdminSetting {
  @Prop(
    raw({
      payment_provider: {
        type: String,
        enum: {
          values: [
            PaymentProvider.PAYSTACK,
            PaymentProvider.FLUTTERWAVE,
            PaymentProvider.STRIPE,
          ],
        },
        required: true,
        default: PaymentProvider.PAYSTACK,
      },
    }),
  )
  defaults: AdminDefaultSettingsTypes;

  @Prop(
    raw([
      {
        category: { type: String },
        specialization: { type: String },
        rate: raw({
          number: { type: Number },
          unit: { type: String },
        }),
      },
    ]),
  )
  specialist_rates: SpecialistRate[];

  @Prop(
    raw([
      {
        display_name: { type: String },
        percentage: { type: Number },
      },
    ]),
  )
  split_ratio: SplitRatio[];

  @Prop(
    raw({
      enabled_for_patients: { type: Boolean, default: true },
      enabled_for_specialists: { type: Boolean, default: true },
      show_severity_levels: { type: Boolean, default: true },
      disclaimer_text: {
        type: String,
        default: 'This information is for reference only. Always consult your pharmacist or doctor before taking multiple medications together.',
      },
      data_sources: {
        type: [String],
        enum: ['rxnav', 'claude_ai', 'openfda'],
        default: ['claude_ai', 'openfda'],  // Default to Claude AI and OpenFDA since RxNav is discontinued
      },
    }),
  )
  drug_interaction_settings: DrugInteractionSettings;
}
export const AdminSettingSchema = SchemaFactory.createForClass(AdminSetting);
