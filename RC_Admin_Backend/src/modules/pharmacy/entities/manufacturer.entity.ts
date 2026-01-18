import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ManufacturerDocument = ManufacturerEntity & Document;

@Schema({ timestamps: true })
export class ManufacturerEntity {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  code: string;

  @Prop()
  short_name?: string;

  @Prop()
  country?: string;

  @Prop()
  website?: string;

  @Prop()
  logo_url?: string;

  @Prop()
  description?: string;

  @Prop({ default: true })
  is_active: boolean;

  @Prop({ default: false })
  is_system: boolean;

  @Prop({ default: 0 })
  display_order: number;

  @Prop({ type: Types.ObjectId, ref: 'Admin' })
  created_by?: Types.ObjectId;
}

export const ManufacturerSchema = SchemaFactory.createForClass(ManufacturerEntity);
