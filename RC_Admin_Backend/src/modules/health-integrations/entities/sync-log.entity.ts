import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SyncLogDocument = SyncLog & Document;

@Schema({ timestamps: true, collection: 'synclogs' })
export class SyncLog {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'HealthIntegration', required: true })
  integrationId: Types.ObjectId;

  @Prop({ type: String, required: true })
  provider: string;

  @Prop({ type: String, required: true })
  syncType: string;

  @Prop({ type: String, default: 'started' })
  status: string;

  @Prop({ type: [String], default: [] })
  dataTypes: string[];

  @Prop({ type: Number, default: 0 })
  recordsProcessed: number;

  @Prop({ type: Number, default: 0 })
  recordsSyncedToVitals: number;

  @Prop({ type: String })
  error?: string;

  @Prop({ type: Date })
  startedAt: Date;

  @Prop({ type: Date })
  completedAt?: Date;
}

export const SyncLogSchema = SchemaFactory.createForClass(SyncLog);
