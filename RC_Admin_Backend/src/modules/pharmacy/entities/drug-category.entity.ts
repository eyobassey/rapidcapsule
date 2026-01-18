import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type DrugCategoryDocument = HydratedDocument<DrugCategoryEntity>;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class DrugCategoryEntity {
  @Prop({ type: String, required: true, unique: true })
  name: string;

  @Prop({ type: String, required: true, unique: true, uppercase: true })
  code: string; // Unique code like PAIN_RELIEF, COLD_AND_FLU

  @Prop({ type: String })
  description: string;

  @Prop({ type: String })
  icon: string; // MDI icon name

  @Prop({ type: String })
  image_url: string; // S3 URL for category image/thumbnail

  @Prop({ type: Boolean, default: true })
  is_active: boolean;

  @Prop({ type: Boolean, default: false })
  is_system: boolean; // True for predefined categories, false for custom

  @Prop({ type: Number, default: 0 })
  display_order: number;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  created_by: mongoose.Types.ObjectId;
}

export const DrugCategorySchema = SchemaFactory.createForClass(DrugCategoryEntity);

// Indexes
DrugCategorySchema.index({ code: 1 }, { unique: true });
DrugCategorySchema.index({ is_active: 1, display_order: 1 });
