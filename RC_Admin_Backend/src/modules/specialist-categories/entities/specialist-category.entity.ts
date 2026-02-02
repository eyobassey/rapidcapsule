import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SpecialistCategoryDocument = SpecialistCategory & Document;

export enum ProfessionalCategoryType {
  SPECIALIST = 'Specialist',
  MEDICAL_DOCTOR = 'Medical Doctor',
  PHARMACIST = 'Pharmacist',
  THERAPIST = 'Therapist',
  NURSE = 'Nurse',
  DENTIST = 'Dentist',
}

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class SpecialistCategory {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true })
  slug: string;

  @Prop()
  description: string;

  @Prop({ default: 'fa-user-md' })
  icon: string;

  @Prop({
    type: String,
    enum: Object.values(ProfessionalCategoryType),
    default: ProfessionalCategoryType.SPECIALIST,
  })
  professional_category: ProfessionalCategoryType;

  @Prop({ default: false })
  is_popular: boolean;

  @Prop({ default: 0 })
  display_order: number;

  @Prop({ default: true })
  is_active: boolean;

  @Prop()
  created_at: Date;

  @Prop()
  updated_at: Date;
}

export const SpecialistCategorySchema = SchemaFactory.createForClass(SpecialistCategory);

// Add indexes
SpecialistCategorySchema.index({ name: 1 });
SpecialistCategorySchema.index({ slug: 1 });
SpecialistCategorySchema.index({ is_active: 1 });
SpecialistCategorySchema.index({ is_popular: 1 });
SpecialistCategorySchema.index({ display_order: 1 });
SpecialistCategorySchema.index({ professional_category: 1 });
