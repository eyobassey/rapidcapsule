import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum EntryType {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT',
}

export enum EntryStatus {
  POSTED = 'POSTED',
  REVERSED = 'REVERSED',
}

export type LedgerEntryDocument = LedgerEntry & Document;

@Schema({ collection: 'ledger_entries', timestamps: { createdAt: 'created_at', updatedAt: false } })
export class LedgerEntry {
  @Prop({ required: true, unique: true })
  entry_id: string;

  @Prop({ required: true, index: true })
  batch_id: string;

  @Prop({ required: true, index: true })
  account_code: string;

  @Prop({ type: String, enum: EntryType, required: true })
  entry_type: EntryType;

  @Prop({ required: true })
  amount: number;

  @Prop({ default: 'NGN' })
  currency: string;

  @Prop({ required: true })
  balance_before: number;

  @Prop({ required: true })
  balance_after: number;

  @Prop({ required: true })
  description: string;

  @Prop({ type: String, enum: EntryStatus, default: EntryStatus.POSTED })
  status: EntryStatus;

  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  user_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'UnifiedWallet', index: true })
  wallet_id: Types.ObjectId;

  @Prop()
  reference_type: string;

  @Prop({ type: Types.ObjectId })
  reference_id: Types.ObjectId;

  @Prop()
  external_reference: string;

  @Prop()
  reversed_by_batch: string;

  @Prop()
  reverses_batch: string;

  @Prop()
  reversed_at: Date;

  @Prop()
  reversal_reason: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  performed_by: Types.ObjectId;

  @Prop()
  ip_address: string;

  @Prop({ type: Object })
  metadata: Record<string, any>;
}

export const LedgerEntrySchema = SchemaFactory.createForClass(LedgerEntry);

LedgerEntrySchema.index({ batch_id: 1, entry_type: 1 });
LedgerEntrySchema.index({ account_code: 1, created_at: -1 });
LedgerEntrySchema.index({ user_id: 1, created_at: -1 });
LedgerEntrySchema.index({ wallet_id: 1, created_at: -1 });
LedgerEntrySchema.index({ reference_type: 1, reference_id: 1 });
