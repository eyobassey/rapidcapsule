import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type LanguageDocument = Language & Document;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Language {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true })
  code: string;

  @Prop()
  native_name: string;

  @Prop({ default: true })
  is_active: boolean;

  @Prop()
  created_at: Date;

  @Prop()
  updated_at: Date;
}

export const LanguageSchema = SchemaFactory.createForClass(Language);

// Add indexes
LanguageSchema.index({ name: 1 });
LanguageSchema.index({ code: 1 });
LanguageSchema.index({ is_active: 1 });
