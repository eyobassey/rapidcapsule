import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type DosageFormDocument = HydratedDocument<DosageFormEntity>;

/**
 * Dosage Form Entity
 * Manages drug forms like Tablet, Capsule, Syrup, Injection, etc.
 */
@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class DosageFormEntity {
  @Prop({ type: String, required: true })
  name: string; // e.g., "Tablet", "Capsule", "Syrup"

  @Prop({ type: String, required: true, unique: true, uppercase: true })
  code: string; // e.g., "TABLET", "CAPSULE", "SYRUP"

  @Prop({ type: String })
  description: string;

  @Prop({ type: String })
  icon: string; // MDI icon name

  @Prop({ type: String })
  default_unit: string; // Default unit of measure e.g., "tablets", "ml", "mg"

  @Prop({ type: [String], default: [] })
  compatible_routes: string[]; // Which routes this form can be administered by

  @Prop({ type: Boolean, default: true })
  is_active: boolean;

  @Prop({ type: Boolean, default: false })
  is_system: boolean;

  @Prop({ type: Number, default: 0 })
  display_order: number;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  created_by: mongoose.Types.ObjectId;
}

export const DosageFormSchema = SchemaFactory.createForClass(DosageFormEntity);

// Indexes
DosageFormSchema.index({ code: 1 }, { unique: true });
DosageFormSchema.index({ is_active: 1, display_order: 1 });
