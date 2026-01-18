import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type StockReservationDocument = HydratedDocument<StockReservation>;

export enum ReservationStatus {
  ACTIVE = 'active',
  CONFIRMED = 'confirmed',
  RELEASED = 'released',
  EXPIRED = 'expired',
}

/**
 * Stock Reservation Entity
 * Tracks individual stock reservations for prescriptions
 * Allows 6-hour hold before automatic release
 */
@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class StockReservation {
  @Prop({ type: String, required: true, unique: true, index: true })
  reservation_id: string; // Auto: RES-YYYYMMDD-0001

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SpecialistPrescription',
    required: true,
    index: true,
  })
  prescription_id: mongoose.Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DrugEntity',
    required: true,
    index: true,
  })
  drug_id: mongoose.Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StockBatchEntity',
    required: true,
    index: true,
  })
  batch_id: mongoose.Types.ObjectId;

  @Prop({ type: Number, required: true, min: 1 })
  quantity: number;

  @Prop({ type: Date, required: true })
  reserved_at: Date;

  @Prop({ type: Date, required: true, index: true })
  expires_at: Date;

  @Prop({
    type: String,
    enum: Object.values(ReservationStatus),
    default: ReservationStatus.ACTIVE,
    index: true,
  })
  status: ReservationStatus;

  @Prop({ type: String })
  status_reason: string;

  @Prop({ type: Date })
  confirmed_at: Date;

  @Prop({ type: Date })
  released_at: Date;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  reserved_by: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  confirmed_by: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  released_by: mongoose.Types.ObjectId;
}

export const StockReservationSchema =
  SchemaFactory.createForClass(StockReservation);

// Indexes
StockReservationSchema.index({ status: 1, expires_at: 1 }); // For expiry job
StockReservationSchema.index({ batch_id: 1, status: 1 });
StockReservationSchema.index({ prescription_id: 1, status: 1 });

// Virtuals
StockReservationSchema.virtual('is_expired').get(function () {
  if (!this.expires_at) return false;
  return new Date() > new Date(this.expires_at);
});

StockReservationSchema.virtual('minutes_until_expiry').get(function () {
  if (!this.expires_at) return null;
  const now = new Date();
  const expiry = new Date(this.expires_at);
  const diffMs = expiry.getTime() - now.getTime();
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / (1000 * 60));
});

StockReservationSchema.set('toJSON', { virtuals: true });
StockReservationSchema.set('toObject', { virtuals: true });
