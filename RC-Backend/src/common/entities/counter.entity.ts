import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CounterDocument = Counter & Document;

@Schema({ timestamps: true })
export class Counter {
  @Prop({ required: true, unique: true })
  name: string; // e.g., 'prescription_number', 'order_number'

  @Prop({ required: true, default: 0 })
  sequence: number;

  @Prop({ required: true })
  prefix: string; // e.g., 'RX'

  @Prop()
  date_format: string; // e.g., 'YYYYMMDD' for daily reset
}

export const CounterSchema = SchemaFactory.createForClass(Counter);

// Create index for fast lookups
CounterSchema.index({ name: 1 }, { unique: true });
