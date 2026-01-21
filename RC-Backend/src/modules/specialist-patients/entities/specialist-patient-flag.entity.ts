import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { User } from '../../users/entities/user.entity';

export type SpecialistPatientFlagDocument = SpecialistPatientFlag & Document;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class SpecialistPatientFlag {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
    required: true,
    index: true,
  })
  specialist_id: Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
    required: true,
    index: true,
  })
  patient_id: Types.ObjectId;

  @Prop({ type: Boolean, default: false })
  is_starred: boolean;

  @Prop({ type: String, default: '' })
  notes: string;

  @Prop({ type: [String], default: [] })
  categories: string[];

  @Prop({ type: Date })
  created_at: Date;

  @Prop({ type: Date })
  updated_at: Date;
}

export const SpecialistPatientFlagSchema = SchemaFactory.createForClass(
  SpecialistPatientFlag,
);

// Create compound unique index
SpecialistPatientFlagSchema.index(
  { specialist_id: 1, patient_id: 1 },
  { unique: true },
);

// Index for getting starred patients
SpecialistPatientFlagSchema.index({ specialist_id: 1, is_starred: 1 });
