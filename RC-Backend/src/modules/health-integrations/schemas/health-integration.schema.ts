import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type HealthIntegrationDocument = HealthIntegration & Document;

export enum IntegrationProvider {
  APPLE_HEALTH = 'apple_health',
  SAMSUNG_HEALTH = 'samsung_health',
  GOOGLE_FIT = 'google_fit',
}

export enum IntegrationStatus {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  PENDING = 'pending',
  ERROR = 'error',
}

@Schema({ timestamps: true })
export class HealthIntegration {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: String, enum: IntegrationProvider, required: true })
  provider: IntegrationProvider;

  @Prop({ type: String, enum: IntegrationStatus, default: IntegrationStatus.PENDING })
  status: IntegrationStatus;

  @Prop({ type: Object })
  authTokens: {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: Date;
  };

  @Prop({ type: Object })
  metadata: {
    deviceId?: string;
    lastSyncDate?: Date;
    syncFrequency?: string; // 'hourly', 'daily', 'weekly', 'manual'
    dataTypes?: string[]; // ['heart_rate', 'steps', 'sleep', 'blood_pressure', etc.]
  };

  @Prop({ type: Object })
  permissions: {
    read: string[];
    write: string[];
  };

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: Date })
  lastSyncedAt: Date;

  @Prop({ type: Object })
  syncSettings: {
    autoSync: boolean;
    syncDirection: 'pull' | 'push' | 'bidirectional';
    dataMapping: Record<string, string>;
  };
}

export const HealthIntegrationSchema = SchemaFactory.createForClass(HealthIntegration);