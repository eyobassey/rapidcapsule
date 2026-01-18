import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type SpecialistWalletTransactionDocument =
  HydratedDocument<SpecialistWalletTransaction>;

export enum SpecialistTransactionType {
  CREDIT = 'CREDIT', // Add funds (top-up)
  DEBIT = 'DEBIT', // Deduct funds (payment, withdrawal)
  HOLD = 'HOLD', // Reserve funds for pending transaction
  RELEASE = 'RELEASE', // Release held funds
  REFUND = 'REFUND', // Refund from cancelled order
}

export enum SpecialistTransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REVERSED = 'REVERSED',
}

export enum SpecialistTransactionReference {
  TOPUP = 'topup',
  PRESCRIPTION = 'prescription',
  WITHDRAWAL = 'withdrawal',
  REFUND = 'refund',
  ADMIN_ADJUSTMENT = 'admin_adjustment',
}

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class SpecialistWalletTransaction {
  @Prop({ type: String, required: true, unique: true })
  transaction_id: string; // Auto-generated: TXN-YYYYMMDD-0001

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SpecialistWallet',
    required: true,
  })
  wallet_id: mongoose.Schema.Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  specialist_id: mongoose.Schema.Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(SpecialistTransactionType),
    required: true,
  })
  type: SpecialistTransactionType;

  @Prop({ type: Number, required: true })
  amount: number;

  @Prop({ type: Number, required: true })
  balance_before: number;

  @Prop({ type: Number, required: true })
  balance_after: number;

  @Prop({ type: Number, default: 0 })
  held_balance_before: number;

  @Prop({ type: Number, default: 0 })
  held_balance_after: number;

  @Prop({
    type: String,
    enum: Object.values(SpecialistTransactionReference),
    required: true,
  })
  reference_type: SpecialistTransactionReference;

  @Prop({ type: mongoose.Schema.Types.ObjectId })
  reference_id: mongoose.Schema.Types.ObjectId; // ID of prescription, payment, etc.

  @Prop({ type: String })
  external_reference: string; // Paystack reference, etc.

  @Prop({ type: String, required: true })
  description: string;

  @Prop({
    type: String,
    enum: Object.values(SpecialistTransactionStatus),
    default: SpecialistTransactionStatus.COMPLETED,
  })
  status: SpecialistTransactionStatus;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  performed_by: mongoose.Schema.Types.ObjectId;

  @Prop({ type: String })
  notes: string;

  @Prop({ type: Object })
  metadata: Record<string, any>; // Additional data for reference
}

export const SpecialistWalletTransactionSchema = SchemaFactory.createForClass(
  SpecialistWalletTransaction,
);

// Indexes
SpecialistWalletTransactionSchema.index({ transaction_id: 1 }, { unique: true });
SpecialistWalletTransactionSchema.index({ wallet_id: 1, created_at: -1 });
SpecialistWalletTransactionSchema.index({ specialist_id: 1, created_at: -1 });
SpecialistWalletTransactionSchema.index({
  reference_type: 1,
  reference_id: 1,
});
SpecialistWalletTransactionSchema.index({ type: 1, status: 1 });
