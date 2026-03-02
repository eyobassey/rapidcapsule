import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as mongoose from 'mongoose';

export type EkaPatientMemoryDocument = EkaPatientMemory & Document;

@Schema({
  collection: 'eka_patient_memories',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class EkaPatientMemory {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  })
  user: Types.ObjectId;

  @Prop({ type: String, default: '' })
  summary: string;

  @Prop({ type: [String], default: [] })
  key_facts: string[];

  @Prop(
    raw({
      communication_style: { type: String },
      preferred_name: { type: String },
      tone_preference: { type: String },
      topics_to_avoid: [{ type: String }],
    }),
  )
  preferences: {
    communication_style?: string;
    preferred_name?: string;
    tone_preference?: string;
    topics_to_avoid?: string[];
  };

  @Prop({ type: Number, default: 0 })
  conversation_count: number;

  @Prop({ type: Number, default: 0 })
  message_count_at_last_update: number;

  created_at: Date;
  updated_at: Date;
}

export const EkaPatientMemorySchema =
  SchemaFactory.createForClass(EkaPatientMemory);
