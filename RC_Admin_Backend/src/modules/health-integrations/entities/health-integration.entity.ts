import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type HealthIntegrationDocument = HealthIntegration & Document;

@Schema({ timestamps: true, collection: 'healthintegrations' })
export class HealthIntegration {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: String, required: true })
  provider: string;

  @Prop({ type: String })
  providerType: string;

  @Prop({ type: String, default: 'pending' })
  status: string;

  @Prop({ type: Object })
  authTokens: {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: Date;
  };

  @Prop({ type: Object })
  metadata: Record<string, any>;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: Date })
  lastSyncedAt: Date;

  @Prop({ type: Object })
  syncSettings: {
    autoSync: boolean;
    syncDirection: string;
    dataMapping: Record<string, string>;
  };
}

export const HealthIntegrationSchema = SchemaFactory.createForClass(HealthIntegration);
