import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type DrugRouteDocument = HydratedDocument<DrugRouteEntity>;

/**
 * Drug Route Entity
 * Manages administration routes like Oral, Topical, Injectable, etc.
 */
@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class DrugRouteEntity {
  @Prop({ type: String, required: true })
  name: string; // e.g., "Oral", "Topical", "Intravenous"

  @Prop({ type: String, required: true, unique: true, uppercase: true })
  code: string; // e.g., "ORAL", "TOPICAL", "IV", "IM"

  @Prop({ type: String })
  description: string;

  @Prop({ type: String })
  abbreviation: string; // Short form e.g., "PO" for oral, "IV" for intravenous

  @Prop({ type: String })
  icon: string; // MDI icon name

  @Prop({ type: [String], default: [] })
  applicable_dosage_forms: string[]; // Which dosage forms apply to this route

  @Prop({ type: Boolean, default: false })
  requires_professional: boolean; // Requires healthcare professional to administer

  @Prop({ type: Boolean, default: true })
  is_active: boolean;

  @Prop({ type: Boolean, default: false })
  is_system: boolean;

  @Prop({ type: Number, default: 0 })
  display_order: number;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  created_by: mongoose.Types.ObjectId;
}

export const DrugRouteSchema = SchemaFactory.createForClass(DrugRouteEntity);

// Indexes
DrugRouteSchema.index({ code: 1 }, { unique: true });
DrugRouteSchema.index({ is_active: 1, display_order: 1 });
