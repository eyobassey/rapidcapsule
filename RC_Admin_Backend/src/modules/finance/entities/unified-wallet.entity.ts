import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum WalletOwnerType {
  PATIENT = 'PATIENT',
  SPECIALIST = 'SPECIALIST',
  PHARMACY = 'PHARMACY',
  PLATFORM = 'PLATFORM',
}

export enum WalletStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  FROZEN = 'FROZEN',
  CLOSED = 'CLOSED',
}

export type UnifiedWalletDocument = UnifiedWallet & Document;

@Schema({ collection: 'unified_wallets', timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class UnifiedWallet {
  @Prop({ required: true, unique: true })
  wallet_id: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  owner_id: Types.ObjectId;

  @Prop({ type: String, enum: WalletOwnerType, required: true })
  owner_type: WalletOwnerType;

  @Prop({ default: 'NGN' })
  currency: string;

  @Prop({ default: 0 })
  available_balance: number;

  @Prop({ default: 0 })
  held_balance: number;

  @Prop({ default: 0 })
  pending_balance: number;

  @Prop({ default: 0 })
  total_credited: number;

  @Prop({ default: 0 })
  total_debited: number;

  @Prop({ default: 0 })
  total_held: number;

  @Prop({ default: 0 })
  total_released: number;

  @Prop({ type: String, enum: WalletStatus, default: WalletStatus.ACTIVE })
  status: WalletStatus;

  @Prop()
  status_reason: string;

  @Prop()
  status_changed_at: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  status_changed_by: Types.ObjectId;

  @Prop({ default: 500000 })
  daily_withdrawal_limit: number;

  @Prop({ default: 0 })
  daily_withdrawn_today: number;

  @Prop()
  daily_limit_reset_at: Date;

  @Prop({ default: 100000 })
  single_transaction_limit: number;

  @Prop({ default: false })
  requires_pin: boolean;

  @Prop()
  pin_hash: string;

  @Prop({ default: 0 })
  failed_pin_attempts: number;

  @Prop()
  pin_locked_until: Date;

  @Prop()
  last_credit_at: Date;

  @Prop()
  last_debit_at: Date;

  @Prop()
  last_transaction_at: Date;

  @Prop({ default: 0 })
  transaction_count: number;

  @Prop({ type: Types.ObjectId })
  legacy_wallet_id: Types.ObjectId;

  @Prop()
  legacy_wallet_type: string;

  @Prop()
  migrated_at: Date;
}

export const UnifiedWalletSchema = SchemaFactory.createForClass(UnifiedWallet);

UnifiedWalletSchema.index({ owner_id: 1, owner_type: 1 }, { unique: true });
UnifiedWalletSchema.index({ wallet_id: 1 }, { unique: true });
UnifiedWalletSchema.index({ legacy_wallet_id: 1 });
