import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type VitalDocument = HydratedDocument<Vital>;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Vital {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  userId: string;

  @Prop(
    raw([
      {
        _id: false,
        value: { type: String, required: true },
        unit: { type: String, required: true },
        updatedAt: { type: Date, default: new Date() },
      },
    ]),
  )
  body_temp: Record<string, string>;

  @Prop(
    raw([
      {
        _id: false,
        value: { type: String, required: true },
        unit: { type: String, required: true },
        updatedAt: { type: Date, default: new Date() },
      },
    ]),
  )
  body_weight: Record<string, string>;

  @Prop(
    raw([
      {
        _id: false,
        value: { type: String, required: true },
        unit: { type: String, required: true },
        updatedAt: { type: Date, default: new Date() },
      },
    ]),
  )
  blood_pressure: Record<string, string>;

  @Prop(
    raw([
      {
        _id: false,
        value: { type: String, required: true },
        unit: { type: String, required: true },
        updatedAt: { type: Date, default: new Date() },
      },
    ]),
  )
  blood_sugar_level: Record<string, string>;

  @Prop(
    raw([
      {
        _id: false,
        value: { type: String, required: true },
        unit: { type: String, required: true },
        updatedAt: { type: Date, default: new Date() },
      },
    ]),
  )
  pulse_rate: Record<string, string>;

  @Prop(
    raw([
      {
        _id: false,
        value: { type: String, required: true },
        unit: { type: String, required: true },
        updatedAt: { type: Date, default: new Date() },
      },
    ]),
  )
  spo2: Record<string, string>;

  @Prop(
    raw([
      {
        _id: false,
        value: { type: String, required: true },
        unit: { type: String, required: true },
        updatedAt: { type: Date, default: new Date() },
      },
    ]),
  )
  steps: Record<string, string>;

  @Prop(
    raw([
      {
        _id: false,
        value: { type: String, required: true },
        unit: { type: String, required: true },
        updatedAt: { type: Date, default: new Date() },
      },
    ]),
  )
  sleep: Record<string, string>;

  @Prop(
    raw([
      {
        _id: false,
        value: { type: String, required: true },
        unit: { type: String, required: true },
        updatedAt: { type: Date, default: new Date() },
      },
    ]),
  )
  calories_burned: Record<string, string>;

  @Prop(
    raw([
      {
        _id: false,
        value: { type: String, required: true },
        unit: { type: String, required: true },
        updatedAt: { type: Date, default: new Date() },
      },
    ]),
  )
  distance: Record<string, string>;

  @Prop(
    raw([
      {
        _id: false,
        value: { type: String, required: true },
        unit: { type: String, required: true },
        updatedAt: { type: Date, default: new Date() },
      },
    ]),
  )
  respiratory_rate: Record<string, string>;

  @Prop(
    raw([
      {
        _id: false,
        value: { type: String, required: true },
        unit: { type: String, required: true },
        updatedAt: { type: Date, default: new Date() },
      },
    ]),
  )
  stress_level: Record<string, string>;

  @Prop(
    raw([
      {
        _id: false,
        value: { type: String, required: true },
        unit: { type: String, required: true },
        updatedAt: { type: Date, default: new Date() },
      },
    ]),
  )
  body_fat: Record<string, string>;

  @Prop(
    raw([
      {
        _id: false,
        value: { type: String, required: true },
        unit: { type: String, required: true },
        updatedAt: { type: Date, default: new Date() },
      },
    ]),
  )
  active_minutes: Record<string, string>;

  @Prop(
    raw([
      {
        _id: false,
        value: { type: String, required: true },
        unit: { type: String, required: true },
        updatedAt: { type: Date, default: new Date() },
      },
    ]),
  )
  hydration: Record<string, string>;

  @Prop(
    raw([
      {
        _id: false,
        value: { type: String, required: true },
        unit: { type: String, required: true },
        updatedAt: { type: Date, default: new Date() },
      },
    ]),
  )
  muscle_mass: Record<string, string>;

  @Prop(
    raw([
      {
        _id: false,
        value: { type: String, required: true },
        unit: { type: String, required: true },
        updatedAt: { type: Date, default: new Date() },
      },
    ]),
  )
  bone_mass: Record<string, string>;

  @Prop(
    raw([
      {
        _id: false,
        value: { type: String, required: true },
        unit: { type: String, required: true },
        updatedAt: { type: Date, default: new Date() },
      },
    ]),
  )
  body_water: Record<string, string>;

  @Prop(
    raw([
      {
        _id: false,
        value: { type: String, required: true },
        unit: { type: String, required: true },
        updatedAt: { type: Date, default: new Date() },
      },
    ]),
  )
  visceral_fat: Record<string, string>;

  @Prop(
    raw([
      {
        _id: false,
        value: { type: String, required: true },
        unit: { type: String, required: true },
        updatedAt: { type: Date, default: new Date() },
      },
    ]),
  )
  bmr: Record<string, string>;

  // ── Recovery Psychological Metrics ──────────────────────────────────
  @Prop(
    raw([
      {
        _id: false,
        value: { type: String, required: true },
        unit: { type: String, required: true },
        updatedAt: { type: Date, default: new Date() },
      },
    ]),
  )
  craving_level: Record<string, string>;

  @Prop(
    raw([
      {
        _id: false,
        value: { type: String, required: true },
        unit: { type: String, required: true },
        updatedAt: { type: Date, default: new Date() },
      },
    ]),
  )
  mood_score: Record<string, string>;

  @Prop(
    raw([
      {
        _id: false,
        value: { type: String, required: true },
        unit: { type: String, required: true },
        updatedAt: { type: Date, default: new Date() },
      },
    ]),
  )
  anxiety_level: Record<string, string>;

  @Prop(
    raw([
      {
        _id: false,
        value: { type: String, required: true },
        unit: { type: String, required: true },
        updatedAt: { type: Date, default: new Date() },
      },
    ]),
  )
  motivation_level: Record<string, string>;
}
export const VitalSchema = SchemaFactory.createForClass(Vital);
