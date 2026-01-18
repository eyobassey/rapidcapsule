import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import * as mongoose from 'mongoose';

export type HealthCheckupDocument = HydratedDocument<HealthCheckup>;

@Schema({
  collection: 'health_checkups', // Reference the correct collection name with underscore
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
})
export class HealthCheckup {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  user: mongoose.Types.ObjectId;

  @Prop({ type: String })
  interview_token: string;

  @Prop({ type: Object })
  patient_info: any;

  @Prop({ type: Array })
  symptoms: any[];

  @Prop({ type: Object })
  diagnosis: any;

  @Prop({ type: String })
  status: string;

  created_at?: Date;
  updated_at?: Date;
}

export const HealthCheckupSchema = SchemaFactory.createForClass(HealthCheckup);