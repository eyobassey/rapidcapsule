/**
 * Account Entity - Chart of Accounts
 *
 * Represents an account in the general ledger (e.g., Cash, Patient Wallets, Revenue)
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import {
  AccountType,
  AccountSubType,
  NormalBalance,
} from '../enums/account-codes.enum';

export type AccountDocument = HydratedDocument<Account>;

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'accounts',
})
export class Account {
  @Prop({ type: String, required: true, unique: true, index: true })
  code: string; // e.g., '1100.001.001'

  @Prop({ type: String, required: true })
  name: string; // e.g., 'Cash - Paystack Balance'

  @Prop({ type: String })
  description: string;

  @Prop({ type: String, enum: Object.values(AccountType), required: true })
  type: AccountType;

  @Prop({ type: String, enum: Object.values(AccountSubType), required: true })
  sub_type: AccountSubType;

  @Prop({ type: String, enum: Object.values(NormalBalance), required: true })
  normal_balance: NormalBalance;

  @Prop({ type: String }) // Parent account code for hierarchy
  parent_code: string;

  @Prop({ type: String, default: 'NGN' })
  currency: string;

  @Prop({ type: Boolean, default: true })
  is_active: boolean;

  @Prop({ type: Boolean, default: false })
  is_system_account: boolean; // Cannot be deleted/modified

  @Prop({ type: Number, default: 0 })
  current_balance: number; // Cached balance for fast queries

  @Prop({ type: Date })
  balance_updated_at: Date;

  // Timestamps
  created_at: Date;
  updated_at: Date;
}

export const AccountSchema = SchemaFactory.createForClass(Account);

// Indexes
AccountSchema.index({ type: 1, is_active: 1 });
AccountSchema.index({ parent_code: 1 });
AccountSchema.index({ sub_type: 1 });
