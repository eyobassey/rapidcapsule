import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PlanDocument = HydratedDocument<Plan>;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Plan {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String })
  code: string;

  @Prop({ type: Number, required: true })
  amount: number;

  @Prop(raw({
    USD: { amount: { type: Number } },
    GBP: { amount: { type: Number } },
    EUR: { amount: { type: Number } },
    NGN: { amount: { type: Number } },
  }))
  prices: Record<string, { amount: number }>;

  @Prop({ type: Number, default: 14 })
  trial_days: number;

  @Prop({ type: Number, default: 60 })
  call_duration: number;
}
export const PlanSchema = SchemaFactory.createForClass(Plan);
