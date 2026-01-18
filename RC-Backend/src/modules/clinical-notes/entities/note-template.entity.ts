import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as mongoose from 'mongoose';

export type NoteTemplateDocument = NoteTemplate & Document;

@Schema({ timestamps: true })
export class NoteTemplate {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  content: string;

  @Prop()
  category: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  created_by: Types.ObjectId;

  @Prop({ default: false })
  is_public: boolean;

  @Prop({ default: false })
  is_default: boolean;

  @Prop({ default: true })
  is_active: boolean;

  @Prop()
  tags: string[];

  @Prop({ default: 0 })
  usage_count: number;
}

export const NoteTemplateSchema = SchemaFactory.createForClass(NoteTemplate);
