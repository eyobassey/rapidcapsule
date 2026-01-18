import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type SpecialistWalletDocument = HydratedDocument<SpecialistWallet>;

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class SpecialistWallet {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  })
  specialist_id: mongoose.Schema.Types.ObjectId;

  @Prop({ type: String, default: 'NGN' })
  currency: string;

  @Prop({ type: Number, default: 0 })
  available_balance: number;

  @Prop({ type: Number, default: 0 })
  held_balance: number; // Reserved for pending prescription payments

  @Prop({ type: Number, default: 0 })
  total_credited: number; // Lifetime credits

  @Prop({ type: Number, default: 0 })
  total_debited: number; // Lifetime debits

  @Prop({ type: Boolean, default: true })
  is_active: boolean;

  @Prop({ type: Date })
  last_transaction_at: Date;
}

export const SpecialistWalletSchema =
  SchemaFactory.createForClass(SpecialistWallet);

// Indexes
SpecialistWalletSchema.index({ specialist_id: 1 }, { unique: true });
