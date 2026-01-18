import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { AdjustmentReason } from '../enums';

export type InventoryAdjustmentDocument = HydratedDocument<InventoryAdjustment>;

/**
 * Inventory Adjustment Entity
 * Tracks all stock movements for audit trail and compliance
 */
@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class InventoryAdjustment {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inventory',
    required: true,
    index: true,
  })
  inventory: mongoose.Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pharmacy',
    required: true,
    index: true,
  })
  pharmacy: mongoose.Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Drug',
    required: true,
  })
  drug: mongoose.Types.ObjectId;

  // ============ ADJUSTMENT DETAILS ============

  @Prop({
    type: String,
    enum: Object.values(AdjustmentReason),
    required: true,
    index: true,
  })
  reason: AdjustmentReason;

  @Prop({ type: Number, required: true })
  quantity_change: number; // Positive for additions, negative for reductions

  @Prop({ type: Number, required: true })
  quantity_before: number;

  @Prop({ type: Number, required: true })
  quantity_after: number;

  @Prop({ type: String })
  batch_number: string;

  // ============ REFERENCE ============

  @Prop({ type: String })
  reference_type: string; // 'Order', 'Return', 'Transfer', etc.

  @Prop({ type: mongoose.Schema.Types.ObjectId })
  reference_id: mongoose.Types.ObjectId; // Link to related document

  @Prop({ type: String })
  reference_number: string; // Invoice number, order number, etc.

  // ============ NOTES ============

  @Prop({ type: String })
  notes: string;

  // ============ FINANCIAL ============

  @Prop({ type: Number })
  unit_cost: number; // Cost at time of adjustment

  @Prop({ type: Number })
  total_value: number; // quantity_change * unit_cost

  // ============ AUDIT ============

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  performed_by: mongoose.Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  performed_at: Date;

  @Prop({ type: String })
  ip_address: string;

  // ============ APPROVAL (for certain adjustments) ============

  @Prop({ type: Boolean, default: false })
  requires_approval: boolean;

  @Prop({ type: Boolean, default: true })
  is_approved: boolean;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  approved_by: mongoose.Types.ObjectId;

  @Prop({ type: Date })
  approved_at: Date;

  @Prop({ type: String })
  approval_notes: string;
}

export const InventoryAdjustmentSchema =
  SchemaFactory.createForClass(InventoryAdjustment);

// ============ INDEXES ============

// Time-based queries
InventoryAdjustmentSchema.index({ performed_at: -1 });

// Pharmacy and drug queries
InventoryAdjustmentSchema.index({ pharmacy: 1, performed_at: -1 });
InventoryAdjustmentSchema.index({ drug: 1, performed_at: -1 });

// Reason-based queries for compliance reporting
InventoryAdjustmentSchema.index({ reason: 1, performed_at: -1 });

// Reference lookups
InventoryAdjustmentSchema.index({ reference_type: 1, reference_id: 1 });
