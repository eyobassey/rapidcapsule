/**
 * Unified Wallet Entity
 *
 * Replaces both patient and specialist wallet entities.
 * Balances are cached summaries of ledger entries, recalculable at any time.
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { WalletOwnerType, WalletStatus } from '../enums/account-codes.enum';

export type UnifiedWalletDocument = HydratedDocument<UnifiedWallet>;

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'unified_wallets',
})
export class UnifiedWallet {
  @Prop({ type: String, required: true, unique: true, index: true })
  wallet_id: string; // WLT-XXXXXXXXXXXX

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true })
  owner_id: mongoose.Types.ObjectId;

  @Prop({ type: String, enum: Object.values(WalletOwnerType), required: true })
  owner_type: WalletOwnerType;

  @Prop({ type: String, default: 'NGN' })
  currency: string;

  // ============ BALANCES (Cached from Ledger) ============

  @Prop({ type: Number, default: 0 })
  available_balance: number; // Can be spent

  @Prop({ type: Number, default: 0 })
  held_balance: number; // Reserved (specialists)

  @Prop({ type: Number, default: 0 })
  pending_balance: number; // Awaiting confirmation (incoming)

  // Computed: total_balance = available_balance + held_balance + pending_balance

  // ============ LIFETIME STATS ============

  @Prop({ type: Number, default: 0 })
  total_credited: number;

  @Prop({ type: Number, default: 0 })
  total_debited: number;

  @Prop({ type: Number, default: 0 })
  total_held: number; // Lifetime holds

  @Prop({ type: Number, default: 0 })
  total_released: number; // Lifetime releases

  // ============ STATUS ============

  @Prop({ type: String, enum: Object.values(WalletStatus), default: WalletStatus.ACTIVE })
  status: WalletStatus;

  @Prop({ type: String })
  status_reason: string;

  @Prop({ type: Date })
  status_changed_at: Date;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  status_changed_by: mongoose.Types.ObjectId;

  // ============ LIMITS ============

  @Prop({ type: Number, default: 0 })
  daily_withdrawal_limit: number;

  @Prop({ type: Number, default: 0 })
  daily_withdrawn_today: number;

  @Prop({ type: Date })
  daily_limit_reset_at: Date;

  @Prop({ type: Number, default: 0 })
  single_transaction_limit: number;

  // ============ SECURITY ============

  @Prop({ type: Boolean, default: false })
  requires_pin: boolean;

  @Prop({ type: String })
  pin_hash: string;

  @Prop({ type: Number, default: 0 })
  failed_pin_attempts: number;

  @Prop({ type: Date })
  pin_locked_until: Date;

  // ============ ACTIVITY ============

  @Prop({ type: Date })
  last_credit_at: Date;

  @Prop({ type: Date })
  last_debit_at: Date;

  @Prop({ type: Date })
  last_transaction_at: Date;

  @Prop({ type: Number, default: 0 })
  transaction_count: number;

  // ============ LEDGER ACCOUNT REFERENCE ============

  @Prop({ type: String }) // Links to Account.code for this wallet's liability
  ledger_account_code: string;

  // ============ LEGACY REFERENCE ============

  @Prop({ type: mongoose.Schema.Types.ObjectId })
  legacy_wallet_id: mongoose.Types.ObjectId; // Reference to old Wallet or SpecialistWallet

  @Prop({ type: String })
  legacy_wallet_type: string; // 'patient' or 'specialist'

  @Prop({ type: Date })
  migrated_at: Date;

  // Timestamps
  created_at: Date;
  updated_at: Date;
}

export const UnifiedWalletSchema = SchemaFactory.createForClass(UnifiedWallet);

// Indexes
UnifiedWalletSchema.index({ owner_id: 1, owner_type: 1 }, { unique: true });
UnifiedWalletSchema.index({ wallet_id: 1 }, { unique: true });
UnifiedWalletSchema.index({ status: 1 });
UnifiedWalletSchema.index({ legacy_wallet_id: 1 });
UnifiedWalletSchema.index({ owner_type: 1, status: 1 });

// Virtual for total balance
UnifiedWalletSchema.virtual('total_balance').get(function () {
  return this.available_balance + this.held_balance + this.pending_balance;
});

// Ensure virtuals are included in JSON output
UnifiedWalletSchema.set('toJSON', { virtuals: true });
UnifiedWalletSchema.set('toObject', { virtuals: true });
