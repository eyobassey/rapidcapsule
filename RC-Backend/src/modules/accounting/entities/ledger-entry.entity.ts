/**
 * Ledger Entry Entity - General Ledger
 *
 * Immutable record of a single debit or credit entry.
 * Entries are grouped by batch_id for atomic operations.
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { EntryType, EntryStatus } from '../enums/account-codes.enum';

export type LedgerEntryDocument = HydratedDocument<LedgerEntry>;

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'ledger_entries',
})
export class LedgerEntry {
  @Prop({ type: String, required: true, unique: true, index: true })
  entry_id: string; // LE-YYYYMMDD-XXXXXX

  @Prop({ type: String, required: true, index: true })
  batch_id: string; // Groups related entries - TB-YYYYMMDD-XXXXXX

  // ============ ACCOUNT ============

  @Prop({ type: String, required: true, index: true })
  account_code: string; // Reference to Account.code

  @Prop({ type: String }) // Denormalized for query performance
  account_name: string;

  @Prop({ type: String, enum: Object.values(EntryType), required: true })
  entry_type: EntryType;

  @Prop({ type: Number, required: true })
  amount: number; // Always positive

  @Prop({ type: String, default: 'NGN' })
  currency: string;

  // ============ BALANCE TRACKING ============

  @Prop({ type: Number, required: true })
  balance_before: number; // Account balance before this entry

  @Prop({ type: Number, required: true })
  balance_after: number; // Account balance after this entry

  // ============ DESCRIPTION ============

  @Prop({ type: String, required: true })
  description: string;

  @Prop({ type: String, enum: Object.values(EntryStatus), default: EntryStatus.POSTED })
  status: EntryStatus;

  // ============ REFERENCES ============

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true })
  user_id: mongoose.Types.ObjectId; // Affected user (patient/specialist)

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'UnifiedWallet', index: true })
  wallet_id: mongoose.Types.ObjectId;

  @Prop({ type: String }) // Reference type: 'pharmacy_order', 'prescription', etc.
  reference_type: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId })
  reference_id: mongoose.Types.ObjectId; // ID of the related entity

  @Prop({ type: String }) // External reference (Paystack, etc.)
  external_reference: string;

  // ============ REVERSAL ============

  @Prop({ type: String }) // If reversed, points to the reversing batch
  reversed_by_batch: string;

  @Prop({ type: String }) // If this is a reversal, points to original batch
  reverses_batch: string;

  @Prop({ type: Date })
  reversed_at: Date;

  @Prop({ type: String })
  reversal_reason: string;

  // ============ AUDIT ============

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  performed_by: mongoose.Types.ObjectId; // Admin/system user who created this

  @Prop({ type: String }) // IP address if applicable
  ip_address: string;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  metadata: Record<string, any>;

  // Timestamps
  created_at: Date;
  updated_at: Date;
}

export const LedgerEntrySchema = SchemaFactory.createForClass(LedgerEntry);

// Indexes for fast queries
LedgerEntrySchema.index({ batch_id: 1, entry_type: 1 });
LedgerEntrySchema.index({ account_code: 1, created_at: -1 });
LedgerEntrySchema.index({ user_id: 1, created_at: -1 });
LedgerEntrySchema.index({ wallet_id: 1, created_at: -1 });
LedgerEntrySchema.index({ reference_type: 1, reference_id: 1 });
LedgerEntrySchema.index({ status: 1, created_at: -1 });
LedgerEntrySchema.index({ external_reference: 1 });
