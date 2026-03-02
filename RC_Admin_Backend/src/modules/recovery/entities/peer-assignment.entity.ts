import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PeerAssignmentDocument = PeerAssignment & Document;

@Schema({
  collection: 'peer_assignments',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class PeerAssignment {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  patient: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  peer_supporter: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  assigned_by: Types.ObjectId;

  @Prop({ type: String, default: 'active' })
  status: string;

  @Prop(raw({ shared_substance: { type: Boolean }, age_proximity: { type: Boolean }, gender_match: { type: Boolean }, match_score: { type: Number } }))
  match_criteria: Record<string, any>;

  @Prop({ type: Date })
  ended_at: Date;

  @Prop({ type: Date })
  deleted_at: Date;
}

export const PeerAssignmentSchema = SchemaFactory.createForClass(PeerAssignment);
