import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BiometricCredentialDocument = BiometricCredential & Document;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class BiometricCredential {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, unique: true })
  credentialId: string; // base64url encoded

  @Prop({ required: true })
  publicKey: string; // base64url encoded

  @Prop({ required: true, default: 0 })
  counter: number;

  @Prop({ type: String, enum: ['singleDevice', 'multiDevice'], default: 'singleDevice' })
  credentialDeviceType: string;

  @Prop({ default: false })
  credentialBackedUp: boolean;

  @Prop({ type: [String], default: [] })
  transports: string[]; // e.g., ['internal', 'hybrid']

  @Prop()
  deviceName: string; // User-friendly name like "iPhone 15 Pro"

  @Prop()
  lastUsedAt: Date;

  @Prop()
  created_at: Date;

  @Prop()
  updated_at: Date;
}

export const BiometricCredentialSchema = SchemaFactory.createForClass(BiometricCredential);

// Index for faster lookups
BiometricCredentialSchema.index({ credentialId: 1 });
BiometricCredentialSchema.index({ userId: 1, created_at: -1 });
