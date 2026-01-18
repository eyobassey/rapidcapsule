import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { IntegrationProvider } from './health-integration.schema';

export type HealthDataDocument = HealthData & Document;

export enum HealthDataType {
  HEART_RATE = 'heart_rate',
  BLOOD_PRESSURE = 'blood_pressure',
  BLOOD_GLUCOSE = 'blood_glucose',
  BODY_TEMPERATURE = 'body_temperature',
  OXYGEN_SATURATION = 'oxygen_saturation',
  WEIGHT = 'weight',
  HEIGHT = 'height',
  BMI = 'bmi',
  STEPS = 'steps',
  CALORIES_BURNED = 'calories_burned',
  DISTANCE = 'distance',
  SLEEP = 'sleep',
  ACTIVITY = 'activity',
  NUTRITION = 'nutrition',
  WATER_INTAKE = 'water_intake',
  STRESS_LEVEL = 'stress_level',
  RESPIRATORY_RATE = 'respiratory_rate',
}

@Schema({ timestamps: true })
export class HealthData {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'HealthIntegration', required: true })
  integrationId: Types.ObjectId;

  @Prop({ type: String, enum: IntegrationProvider, required: true })
  source: IntegrationProvider;

  @Prop({ type: String, enum: HealthDataType, required: true })
  dataType: HealthDataType;

  @Prop({ type: Object, required: true })
  value: {
    primary?: number;
    secondary?: number;
    unit?: string;
    details?: Record<string, any>;
  };

  @Prop({ type: Date, required: true })
  recordedAt: Date;

  @Prop({ type: Date })
  syncedAt: Date;

  @Prop({ type: Object })
  metadata: {
    deviceType?: string;
    deviceModel?: string;
    appVersion?: string;
    externalId?: string;
  };

  @Prop({ type: Boolean, default: false })
  isSyncedToVitals: boolean;

  @Prop({ type: Types.ObjectId, ref: 'Vital' })
  vitalId?: Types.ObjectId;
}

export const HealthDataSchema = SchemaFactory.createForClass(HealthData);