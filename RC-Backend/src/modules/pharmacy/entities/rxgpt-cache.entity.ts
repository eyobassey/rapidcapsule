import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type RxGPTCacheDocument = HydratedDocument<RxGPTCache>;

/**
 * RxGPT Analysis Cache Entity
 *
 * Caches analysis results based on a hash of:
 * - Patient allergies, medications, conditions
 * - Proposed drugs (names, dosages, strengths)
 * - Clinical context (if provided)
 *
 * Cache invalidation:
 * - TTL: 24 hours (configurable)
 * - Invalidated on patient profile changes
 * - Invalidated when settings change significantly
 */
@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class RxGPTCache {
  /**
   * Hash of the analysis context for lookup
   * Generated from: patientId + drugList + clinicalContextHash
   */
  @Prop({ required: true, unique: true, index: true })
  cache_key: string;

  /**
   * Patient ID for reference
   */
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  patient_id: Types.ObjectId;

  /**
   * Specialist who triggered the original analysis
   */
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  specialist_id: Types.ObjectId;

  /**
   * Hash of proposed drugs for validation
   */
  @Prop({ required: true })
  drugs_hash: string;

  /**
   * Hash of clinical context (appointments, checkups)
   */
  @Prop()
  clinical_context_hash: string;

  /**
   * Hash of patient allergies and conditions
   * Used to invalidate cache when patient profile changes
   */
  @Prop({ required: true })
  patient_profile_hash: string;

  /**
   * The cached analysis result
   */
  @Prop({ type: Object, required: true })
  result: {
    is_safe: boolean;
    overall_risk_level: string;
    confidence_score: number;
    alerts: Array<{
      type: string;
      severity: string;
      drug_name: string;
      message: string;
      reasoning: string;
      citation?: string;
      action_required: string;
    }>;
    recommendations: Array<{
      type: string;
      drug_name?: string;
      recommendation: string;
      reasoning: string;
      citations: string[];
      confidence: number;
      priority: string;
    }>;
    drug_analyses: Array<{
      drug_id: string;
      drug_name: string;
      is_appropriate: boolean;
      confidence: number;
      reasoning: string;
      alerts: any[];
      citations: string[];
    }>;
    clinical_summary: string;
    disclaimer?: string;
    model: string;
  };

  /**
   * Number of times this cached result was used
   */
  @Prop({ default: 0 })
  hit_count: number;

  /**
   * When this cache entry expires
   */
  @Prop({ required: true, index: true })
  expires_at: Date;

  /**
   * Last time this cache entry was accessed
   */
  @Prop()
  last_accessed_at: Date;

  /**
   * AI model used for this analysis (cache invalidated if model changes)
   */
  @Prop({ required: true })
  ai_model: string;

  // Timestamps
  created_at: Date;
  updated_at: Date;
}

export const RxGPTCacheSchema = SchemaFactory.createForClass(RxGPTCache);

// TTL index - MongoDB automatically deletes expired documents
RxGPTCacheSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

// Compound index for efficient lookups
RxGPTCacheSchema.index({ patient_id: 1, drugs_hash: 1 });
