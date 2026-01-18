import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type PrescriptionVerificationDocument =
  HydratedDocument<PrescriptionVerification>;

/**
 * Verification tier
 */
export enum VerificationTier {
  TIER1 = 'TIER1', // Quick automated checks (OCR quality, basic format)
  TIER2 = 'TIER2', // Deep AI analysis (medication validation, fraud detection)
  PHARMACIST = 'PHARMACIST', // Manual pharmacist review
}

/**
 * Verification result
 */
export enum VerificationResult {
  PENDING = 'PENDING',
  PASSED = 'PASSED',
  FAILED = 'FAILED',
  NEEDS_REVIEW = 'NEEDS_REVIEW',
  INCONCLUSIVE = 'INCONCLUSIVE',
}

/**
 * Individual check result
 */
export interface CheckResult {
  check_name: string;
  passed: boolean;
  score: number; // 0-100
  details: string;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  timestamp: Date;
  metadata?: Record<string, any>; // Optional metadata for additional check info
}

/**
 * PrescriptionVerification - Stores verification pipeline results
 */
@Schema({
  collection: 'prescription_verifications',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class PrescriptionVerification {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PatientPrescriptionUpload',
    required: true,
    unique: true,
  })
  prescription_upload: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  patient: Types.ObjectId;

  // Overall verification status
  @Prop({ type: String, enum: VerificationResult, default: VerificationResult.PENDING })
  overall_result: VerificationResult;

  @Prop({ type: Number, default: 0 })
  overall_score: number; // 0-100

  @Prop({ type: Number, default: 0 })
  confidence_score: number; // 0-100

  // Current tier being processed
  @Prop({ type: String, enum: VerificationTier })
  current_tier: VerificationTier;

  // Tier 1: Quick Automated Checks
  @Prop(
    raw({
      status: { type: String, enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'] },
      result: { type: String, enum: ['PENDING', 'PASSED', 'FAILED', 'NEEDS_REVIEW'] },
      score: { type: Number },
      started_at: { type: Date },
      completed_at: { type: Date },
      processing_time_ms: { type: Number },
      patient_summary: { type: String },
      checks: [
        {
          check_name: { type: String },
          passed: { type: Boolean },
          score: { type: Number },
          details: { type: String },
          severity: { type: String, enum: ['INFO', 'WARNING', 'ERROR', 'CRITICAL'] },
          timestamp: { type: Date },
        },
      ],
    }),
  )
  tier1: {
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    result: 'PENDING' | 'PASSED' | 'FAILED' | 'NEEDS_REVIEW';
    score: number;
    started_at: Date;
    completed_at: Date;
    processing_time_ms: number;
    patient_summary?: string;
    checks: CheckResult[];
  };

  // Tier 2: Deep AI Analysis
  @Prop(
    raw({
      status: { type: String, enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'SKIPPED'] },
      result: { type: String, enum: ['PENDING', 'PASSED', 'FAILED', 'NEEDS_REVIEW'] },
      score: { type: Number },
      started_at: { type: Date },
      completed_at: { type: Date },
      processing_time_ms: { type: Number },
      checks: [
        {
          check_name: { type: String },
          passed: { type: Boolean },
          score: { type: Number },
          details: { type: String },
          severity: { type: String, enum: ['INFO', 'WARNING', 'ERROR', 'CRITICAL'] },
          timestamp: { type: Date },
        },
      ],
      medication_validation: {
        all_medications_valid: { type: Boolean },
        validated_medications: [
          {
            name: { type: String },
            is_valid: { type: Boolean },
            matched_drug_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Drug' },
            dosage_valid: { type: Boolean },
            quantity_valid: { type: Boolean },
            requires_prescription: { type: Boolean },
            is_controlled: { type: Boolean },
            notes: { type: String },
          },
        ],
      },
      doctor_validation: {
        license_verified: { type: Boolean },
        license_number: { type: String },
        doctor_name: { type: String },
        specialization: { type: String },
        clinic_verified: { type: Boolean },
        notes: { type: String },
      },
      ai_analysis: {
        performed: { type: Boolean, default: false },
        timestamp: { type: Date },
        confidence: { type: Number },
        fraud_score: { type: Number },
        overall_assessment: { type: String },
        flags: [
          {
            type: { type: String },
            severity: { type: String },
            message: { type: String },
          },
        ],
        recommendations: [{ type: String }],
        patient_summary: { type: String },
      },
    }),
  )
  tier2: {
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
    result: 'PENDING' | 'PASSED' | 'FAILED' | 'NEEDS_REVIEW';
    score: number;
    started_at: Date;
    completed_at: Date;
    processing_time_ms: number;
    checks: CheckResult[];
    medication_validation: {
      all_medications_valid: boolean;
      validated_medications: Array<{
        name: string;
        is_valid: boolean;
        matched_drug_id: Types.ObjectId;
        dosage_valid: boolean;
        quantity_valid: boolean;
        requires_prescription: boolean;
        is_controlled: boolean;
        notes: string;
      }>;
    };
    doctor_validation: {
      license_verified: boolean;
      license_number: string;
      doctor_name: string;
      specialization: string;
      clinic_verified: boolean;
      notes: string;
    };
    ai_analysis?: {
      performed: boolean;
      timestamp: Date;
      confidence: number;
      fraud_score: number;
      overall_assessment: string;
      flags: Array<{
        type: string;
        severity: string;
        message: string;
      }>;
      recommendations: string[];
      // Comprehensive data extracted by Claude AI from the prescription image
      extracted_data?: {
        patient: {
          name: string | null;
          date_of_birth?: string | null;
          age?: number | null;
          gender?: string | null;
          address?: string | null;
          phone?: string | null;
        };
        prescriber: {
          name: string | null;
          title?: string | null;
          license_number?: string | null;
          specialty?: string | null;
          clinic_name?: string | null;
          clinic_address?: string | null;
          phone?: string | null;
          signature_present: boolean;
        };
        prescription_date?: string | null;
        validity_period?: string | null;
        prescription_number?: string | null;
        medications: Array<{
          name: string;
          dosage?: string;
          quantity?: string;
          instructions?: string;
          frequency?: string;
          duration?: string;
          confidence: number;
        }>;
      };
      ocr_corrections_made?: boolean;
      ocr_corrections?: Array<{
        field: string;
        ocr_value: string | null;
        corrected_value: string | null;
        reason: string;
      }>;
      // Patient-friendly summary (non-technical, simple language)
      patient_summary?: string;
    };
  };

  // Pharmacist Review
  @Prop(
    raw({
      status: { type: String, enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'NOT_REQUIRED'] },
      result: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED', 'NEEDS_CLARIFICATION'] },
      reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      assigned_at: { type: Date },
      started_at: { type: Date },
      completed_at: { type: Date },
      notes: { type: String },
      rejection_reason: { type: String },
      clarification_request: { type: String },
    }),
  )
  pharmacist_review: {
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'NOT_REQUIRED';
    result: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NEEDS_CLARIFICATION';
    reviewer: Types.ObjectId;
    assigned_at: Date;
    started_at: Date;
    completed_at: Date;
    notes: string;
    rejection_reason: string;
    clarification_request: string;
  };

  // Fraud Detection Summary
  @Prop(
    raw({
      score: { type: Number, default: 0 }, // 0-100, higher = more suspicious
      risk_level: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
      flags: [
        {
          flag_type: { type: String },
          severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
          description: { type: String },
          evidence: { type: String },
          detected_at: { type: Date },
        },
      ],
      duplicate_prescription: { type: Boolean },
      edited_document: { type: Boolean },
      invalid_doctor: { type: Boolean },
      suspicious_pattern: { type: Boolean },
    }),
  )
  fraud_detection: {
    score: number;
    risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    flags: Array<{
      flag_type: string;
      severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      description: string;
      evidence: string;
      detected_at: Date;
    }>;
    duplicate_prescription: boolean;
    edited_document: boolean;
    invalid_doctor: boolean;
    suspicious_pattern: boolean;
  };

  // Processing metadata
  @Prop({ type: Date })
  verification_started_at: Date;

  @Prop({ type: Date })
  verification_completed_at: Date;

  @Prop({ type: Number })
  total_processing_time_ms: number;

  // Error tracking
  @Prop(
    raw([
      {
        tier: { type: String, enum: ['TIER1', 'TIER2', 'PHARMACIST'] },
        error_code: { type: String },
        error_message: { type: String },
        stack_trace: { type: String },
        occurred_at: { type: Date },
      },
    ]),
  )
  errors: Array<{
    tier: 'TIER1' | 'TIER2' | 'PHARMACIST';
    error_code: string;
    error_message: string;
    stack_trace: string;
    occurred_at: Date;
  }>;

  // Retry tracking
  @Prop({ type: Number, default: 0 })
  retry_count: number;

  @Prop({ type: Date })
  last_retry_at: Date;

  // Platform prescription tracking
  // If this upload is a PDF of a prescription created on Rapid Capsules platform
  @Prop({ type: Boolean, default: false })
  is_platform_prescription: boolean;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'SpecialistPrescription' })
  platform_prescription_id: Types.ObjectId;

  @Prop({ type: String })
  platform_prescription_number: string;
}

export const PrescriptionVerificationSchema = SchemaFactory.createForClass(
  PrescriptionVerification,
);

// Index for prescription lookup
PrescriptionVerificationSchema.index({ prescription_upload: 1 });

// Index for patient lookup
PrescriptionVerificationSchema.index({ patient: 1, created_at: -1 });

// Index for status queries
PrescriptionVerificationSchema.index({ overall_result: 1, created_at: -1 });

// Index for pharmacist review queue
PrescriptionVerificationSchema.index({
  'pharmacist_review.status': 1,
  'pharmacist_review.assigned_at': 1,
});
