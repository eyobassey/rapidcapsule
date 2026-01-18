import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

/**
 * Simple PrescriptionDrug entity for basic prescription drug info
 * Note: This is different from the comprehensive Drug entity in pharmacy module
 */
export type PrescriptionDrugDocument = HydratedDocument<PrescriptionDrug>;
@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'prescriptiondrugs',
})
export class PrescriptionDrug {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true })
  price: string;
}
export const PrescriptionDrugSchema =
  SchemaFactory.createForClass(PrescriptionDrug);

// Backward compatibility aliases
export const Drug = PrescriptionDrug;
export type DrugDocument = PrescriptionDrugDocument;
export const DrugSchema = PrescriptionDrugSchema;
