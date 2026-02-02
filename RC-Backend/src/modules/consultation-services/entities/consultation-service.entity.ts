import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ConsultationServiceDocument = HydratedDocument<ConsultationService>;

@Schema({ collection: 'consultation_services', timestamps: true })
export class ConsultationService {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop({ required: true })
  description: string;

  @Prop({ default: 'hi-video-camera' })
  icon: string;

  @Prop({ default: '#4FC3F7' })
  icon_color: string;

  @Prop({ default: '#E3F2FD' })
  icon_bg_color: string;

  @Prop({
    type: String,
    enum: ['flat', 'routine_urgent'],
    default: 'routine_urgent'
  })
  pricing_type: string;

  @Prop({ default: 2000 })
  min_rate: number;

  @Prop({ default: null })
  max_rate: number;

  @Prop({ default: 'NGN' })
  default_currency: string;

  @Prop({ default: true })
  is_active: boolean;

  @Prop({ default: 0 })
  display_order: number;

  @Prop({ default: false })
  is_default: boolean;

  @Prop({ default: null })
  info_text: string;

  @Prop({ default: false })
  show_ai_badge: boolean;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const ConsultationServiceSchema = SchemaFactory.createForClass(ConsultationService);
