import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OWUserMappingDocument = OWUserMapping & Document;

@Schema({ timestamps: true })
export class OWUserMapping {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  @Prop({ type: String, required: true })
  owUserId: string;
}

export const OWUserMappingSchema = SchemaFactory.createForClass(OWUserMapping);
