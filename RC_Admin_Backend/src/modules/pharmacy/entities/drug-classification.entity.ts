import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type DrugClassificationDocument = HydratedDocument<DrugClassificationEntity>;

/**
 * Drug Classification Entity
 * Manages regulatory classifications like OTC, Prescription Only, Controlled Substances, Poisons, etc.
 */
@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class DrugClassificationEntity {
  @Prop({ type: String, required: true })
  name: string; // e.g., "Over The Counter (OTC)", "Prescription Only Medicine (POM)"

  @Prop({ type: String, required: true, unique: true, uppercase: true })
  code: string; // e.g., "OTC", "POM", "CONTROLLED", "POISON"

  @Prop({ type: String })
  description: string;

  @Prop({ type: String })
  short_code: string; // Short display code e.g., "Rx", "OTC", "CD"

  @Prop({ type: String })
  color: string; // Color for UI display e.g., "success", "warning", "error"

  @Prop({ type: String })
  icon: string; // MDI icon name

  @Prop({ type: Boolean, default: false })
  requires_prescription: boolean;

  @Prop({ type: Boolean, default: false })
  requires_pharmacist_approval: boolean;

  @Prop({ type: Boolean, default: false })
  is_controlled: boolean; // Controlled substance

  @Prop({ type: Boolean, default: false })
  is_poison: boolean; // Poison/dangerous substance

  @Prop({ type: Number, default: 0 })
  restriction_level: number; // 0 = none, 1 = low, 2 = medium, 3 = high, 4 = very high

  @Prop({ type: [String], default: [] })
  special_requirements: string[]; // Any special handling requirements

  @Prop({ type: Boolean, default: true })
  is_active: boolean;

  @Prop({ type: Boolean, default: false })
  is_system: boolean; // True for predefined, false for custom

  @Prop({ type: Number, default: 0 })
  display_order: number;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  created_by: mongoose.Types.ObjectId;
}

export const DrugClassificationSchema = SchemaFactory.createForClass(DrugClassificationEntity);

// Indexes
DrugClassificationSchema.index({ code: 1 }, { unique: true });
DrugClassificationSchema.index({ is_active: 1, display_order: 1 });
