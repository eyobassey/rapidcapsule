import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type AuditLogDocument = AuditLog & Document;

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  VIEW = 'VIEW',
  DISPENSE = 'DISPENSE',
  VERIFY = 'VERIFY',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  CANCEL = 'CANCEL',
  REFUND = 'REFUND',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT',
  STATUS_CHANGE = 'STATUS_CHANGE',
  PAYMENT = 'PAYMENT',
  PRESCRIPTION_UPLOAD = 'PRESCRIPTION_UPLOAD',
  PRESCRIPTION_VERIFY = 'PRESCRIPTION_VERIFY',
  ORDER_CREATE = 'ORDER_CREATE',
  ORDER_UPDATE = 'ORDER_UPDATE',
  STOCK_ADJUST = 'STOCK_ADJUST',
  PRICE_CHANGE = 'PRICE_CHANGE',
}

export enum AuditEntityType {
  PRESCRIPTION = 'Prescription',
  ORDER = 'Order',
  DRUG = 'Drug',
  PHARMACY = 'Pharmacy',
  PATIENT = 'Patient',
  SPECIALIST = 'Specialist',
  INVENTORY = 'Inventory',
  STOCK_BATCH = 'StockBatch',
  PAYMENT = 'Payment',
  REFUND = 'Refund',
  USER = 'User',
  ADMIN = 'Admin',
  SETTING = 'Setting',
}

// Interface for audit log change tracking
export interface AuditLogChange {
  field: string;
  old_value: any;
  new_value: any;
}

@Schema({ timestamps: true, collection: 'audit_logs' })
export class AuditLog {
  @Prop({
    type: String,
    enum: AuditAction,
    required: true,
    index: true,
  })
  action: AuditAction;

  @Prop({
    type: String,
    enum: AuditEntityType,
    required: true,
    index: true,
  })
  entity_type: AuditEntityType;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  entity_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  performed_by: Types.ObjectId;

  @Prop({ type: String })
  performed_by_role: string;

  @Prop({ type: String })
  performed_by_name: string;

  @Prop({ type: String })
  performed_by_email: string;

  @Prop({
    type: [raw({
      field: { type: String, required: true },
      old_value: { type: MongooseSchema.Types.Mixed },
      new_value: { type: MongooseSchema.Types.Mixed },
    })],
    default: [],
  })
  changes: AuditLogChange[];

  @Prop({ type: String })
  description: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  metadata: Record<string, any>;

  @Prop({ type: String })
  ip_address: string;

  @Prop({ type: String })
  user_agent: string;

  @Prop({ type: String })
  request_id: string;

  @Prop({ type: Boolean, default: false })
  is_system_action: boolean;

  @Prop({ type: Date, default: Date.now, index: true })
  created_at: Date;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

// Indexes for efficient querying
AuditLogSchema.index({ entity_type: 1, entity_id: 1 });
AuditLogSchema.index({ performed_by: 1, created_at: -1 });
AuditLogSchema.index({ action: 1, created_at: -1 });
AuditLogSchema.index({ created_at: -1 });
