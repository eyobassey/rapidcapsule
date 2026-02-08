import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type RxGPTFeedbackDocument = HydratedDocument<RxGPTFeedback>;

/**
 * Feedback rating types
 */
export enum RxGPTFeedbackRating {
  HELPFUL = 'helpful',
  NOT_HELPFUL = 'not_helpful',
  INCORRECT = 'incorrect',
  MISSED_ISSUE = 'missed_issue',
  TOO_CAUTIOUS = 'too_cautious',
}

/**
 * RxGPT Feedback Entity
 * Stores specialist feedback on RxGPT analysis results
 */
@Schema({
  collection: 'rxgpt_feedback',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class RxGPTFeedback {
  /**
   * Reference to the RxGPT analytics record
   */
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'RxGPTAnalytics', required: true, index: true })
  analysis_id: Types.ObjectId;

  /**
   * Specialist who submitted the feedback
   */
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true })
  specialist_id: Types.ObjectId;

  /**
   * Patient the analysis was for
   */
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  patient_id: Types.ObjectId;

  /**
   * Overall rating of the analysis
   */
  @Prop({
    type: String,
    enum: Object.values(RxGPTFeedbackRating),
    required: true,
  })
  rating: RxGPTFeedbackRating;

  /**
   * Was the overall safety assessment correct?
   */
  @Prop({ type: Boolean })
  safety_assessment_correct: boolean;

  /**
   * Were the alerts relevant?
   */
  @Prop({ type: Boolean })
  alerts_relevant: boolean;

  /**
   * Were the recommendations useful?
   */
  @Prop({ type: Boolean })
  recommendations_useful: boolean;

  /**
   * Specific feedback on individual drugs
   */
  @Prop({
    type: [
      {
        drug_name: { type: String },
        was_appropriate: { type: Boolean },
        comment: { type: String },
      },
    ],
    default: [],
  })
  drug_feedback: {
    drug_name: string;
    was_appropriate: boolean;
    comment?: string;
  }[];

  /**
   * Issues that were missed by RxGPT
   */
  @Prop({ type: [String], default: [] })
  missed_issues: string[];

  /**
   * False positives - alerts that were not actually relevant
   */
  @Prop({ type: [String], default: [] })
  false_positives: string[];

  /**
   * Free-form additional comments
   */
  @Prop({ type: String })
  comments: string;

  /**
   * Action taken by specialist after seeing the analysis
   */
  @Prop({
    type: String,
    enum: ['proceeded_as_is', 'modified_prescription', 'cancelled_prescription', 'sought_second_opinion'],
  })
  action_taken: string;

  /**
   * If prescription was modified, what was changed?
   */
  @Prop({ type: String })
  modifications_made: string;

  // Timestamps
  created_at: Date;
  updated_at: Date;
}

export const RxGPTFeedbackSchema = SchemaFactory.createForClass(RxGPTFeedback);

// Indexes
RxGPTFeedbackSchema.index({ analysis_id: 1 }, { unique: true });
RxGPTFeedbackSchema.index({ specialist_id: 1, created_at: -1 });
RxGPTFeedbackSchema.index({ rating: 1, created_at: -1 });
