import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { IntegrationProvider } from './health-integration.schema';

export type SyncLogDocument = SyncLog & Document;

export enum SyncType {
  SCHEDULED = 'scheduled',
  MANUAL = 'manual',
  WEBHOOK = 'webhook',
}

export enum SyncStatus {
  STARTED = 'started',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Schema({ timestamps: true })
export class SyncLog {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'HealthIntegration', required: true })
  integrationId: Types.ObjectId;

  @Prop({ type: String, enum: IntegrationProvider, required: true })
  provider: IntegrationProvider;

  @Prop({ type: String, enum: SyncType, required: true })
  syncType: SyncType;

  @Prop({ type: String, enum: SyncStatus, default: SyncStatus.STARTED })
  status: SyncStatus;

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
