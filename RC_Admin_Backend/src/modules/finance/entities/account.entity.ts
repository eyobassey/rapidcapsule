import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum AccountType {
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY',
  EQUITY = 'EQUITY',
  REVENUE = 'REVENUE',
  EXPENSE = 'EXPENSE',
}

export enum AccountSubType {
  CASH = 'CASH',
  RECEIVABLE = 'RECEIVABLE',
  WALLET_POOL = 'WALLET_POOL',
  WALLET_LIABILITY = 'WALLET_LIABILITY',
  PAYABLE = 'PAYABLE',
  DEFERRED_REVENUE = 'DEFERRED_REVENUE',
  RETAINED_EARNINGS = 'RETAINED_EARNINGS',
  SERVICE_FEE = 'SERVICE_FEE',
  PRODUCT_REVENUE = 'PRODUCT_REVENUE',
  PAYMENT_PROCESSING = 'PAYMENT_PROCESSING',
  REFUNDS_LOSSES = 'REFUNDS_LOSSES',
}

export enum NormalBalance {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT',
}

export type AccountDocument = Account & Document;

@Schema({ collection: 'accounts', timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Account {
  @Prop({ required: true, unique: true, index: true })
  code: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ type: String, enum: AccountType, required: true })
  type: AccountType;

  @Prop({ type: String, enum: AccountSubType })
  sub_type: AccountSubType;

  @Prop({ type: String, enum: NormalBalance, required: true })
  normal_balance: NormalBalance;

  @Prop()
  parent_code: string;

  @Prop({ default: 'NGN' })
  currency: string;

  @Prop({ default: true })
  is_active: boolean;

  @Prop({ default: false })
  is_system_account: boolean;

  @Prop({ default: 0 })
  current_balance: number;

  @Prop()
  balance_updated_at: Date;
}

export const AccountSchema = SchemaFactory.createForClass(Account);
