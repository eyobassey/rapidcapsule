import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type PatientPrescriptionUploadDocument =
  HydratedDocument<PatientPrescriptionUpload>;

/**
 * Upload source - how the prescription was uploaded
 */
export enum UploadSource {
  MOBILE_CAMERA = 'MOBILE_CAMERA',
  FILE_UPLOAD = 'FILE_UPLOAD',
  GALLERY = 'GALLERY',
  SCANNER = 'SCANNER',
}

/**
 * File processing status
 */
export enum ProcessingStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

/**
 * Verification status for the prescription
 */
export enum VerificationStatus {
  PENDING = 'PENDING',
  TIER1_PROCESSING = 'TIER1_PROCESSING',
  TIER1_PASSED = 'TIER1_PASSED',
  TIER1_FAILED = 'TIER1_FAILED',
  TIER2_PROCESSING = 'TIER2_PROCESSING',
  TIER2_PASSED = 'TIER2_PASSED',
  TIER2_FAILED = 'TIER2_FAILED',
  PHARMACIST_REVIEW = 'PHARMACIST_REVIEW',
  CLARIFICATION_NEEDED = 'CLARIFICATION_NEEDED', // Waiting for patient to provide more info
  CLARIFICATION_RECEIVED = 'CLARIFICATION_RECEIVED', // Patient responded, awaiting pharmacist re-review
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

/**
 * PatientPrescriptionUpload - For prescriptions uploaded by patients
 * (external prescriptions from other doctors/clinics)
 */
@Schema({
  collection: 'patient_prescription_uploads',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class PatientPrescriptionUpload {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  patient: Types.ObjectId;

  // Unique prescription number - generated sequentially using shared counter
  // Format: RX-YYYYMMDD-XXXX (e.g., RX-20251224-0001)
  @Prop({ type: String, unique: true, sparse: true, index: true })
  prescription_number: string;

  // File metadata
  @Prop({ type: String, required: true })
  original_filename: string;

  @Prop({ type: String, required: true })
  mimetype: string;

  @Prop({ type: Number, required: true })
  file_size: number;

  @Prop({ type: String, required: true })
  s3_key: string;

  @Prop({ type: String, required: true })
  s3_bucket: string;

  @Prop({ type: String })
  s3_url: string;

  @Prop({ type: String, enum: UploadSource, default: UploadSource.FILE_UPLOAD })
  upload_source: UploadSource;

  // Processing status
  @Prop({ type: String, enum: ProcessingStatus, default: ProcessingStatus.PENDING })
  processing_status: ProcessingStatus;

  @Prop({ type: String })
  processing_error: string;

  // Verification status
  @Prop({ type: String, enum: VerificationStatus, default: VerificationStatus.PENDING })
  verification_status: VerificationStatus;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'PrescriptionVerification' })
  verification: Types.ObjectId;

  // Fingerprint for duplicate detection
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'PrescriptionFingerprint' })
  fingerprint: Types.ObjectId;

  // OCR extracted data
  @Prop(
    raw({
      raw_text: { type: String },
      confidence: { type: Number },
      doctor_name: { type: String },
      patient_name: { type: String },
      clinic_name: { type: String },
      clinic_address: { type: String },
      prescription_date: { type: Date },
      medications: [
        {
          name: { type: String },
          dosage: { type: String },
          quantity: { type: String },
          instructions: { type: String },
          confidence: { type: Number },
        },
      ],
      doctor_license: { type: String },
      validity_period: { type: Number }, // days
    }),
  )
  ocr_data: {
    raw_text: string;
    confidence: number;
    doctor_name: string;
    patient_name: string;
    clinic_name: string;
    clinic_address: string;
    prescription_date: Date;
    medications: Array<{
      name: string;
      dosage: string;
      quantity: string;
      instructions: string;
      confidence: number;
    }>;
    doctor_license: string;
    validity_period: number;
  };

  // Prescription validity
  @Prop({ type: Date })
  valid_from: Date;

  @Prop({ type: Date })
  valid_until: Date;

  @Prop({ type: Boolean, default: false })
  is_expired: boolean;

  // Usage tracking
  @Prop({ type: Number, default: 0 })
  usage_count: number;

  @Prop({ type: Number })
  max_usage: number;

  // Can be either ObjectId array (legacy) or object array with order details
  // The normalization code in the controller handles both formats
  @Prop({ type: [mongoose.Schema.Types.Mixed] })
  used_in_orders: any[];

  // Fraud detection
  @Prop({ type: Number, default: 0 })
  fraud_score: number; // 0-100, higher = more suspicious

  @Prop(
    raw([
      {
        flag: { type: String },
        severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
        description: { type: String },
        detected_at: { type: Date },
      },
    ]),
  )
  fraud_flags: Array<{
    flag: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
    detected_at: Date;
  }>;

  // Verified medications - medications from prescription matched to our drug database
  @Prop(
    raw([
      {
        prescription_medication_name: { type: String }, // Name as written on prescription
        matched_drug_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Drug' },
        matched_drug_name: { type: String }, // Our database drug name
        matched_generic_name: { type: String }, // Generic name from our DB
        is_valid: { type: Boolean, default: false },
        dosage: { type: String },
        quantity: { type: String },
        instructions: { type: String },
      },
    ]),
  )
  verified_medications: Array<{
    prescription_medication_name: string;
    matched_drug_id: Types.ObjectId | null;
    matched_drug_name: string | null;
    matched_generic_name: string | null;
    is_valid: boolean;
    dosage: string;
    quantity: string;
    instructions: string;
  }>;

  // Pharmacist review
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  reviewed_by: Types.ObjectId;

  @Prop({ type: Date })
  reviewed_at: Date;

  @Prop({ type: String })
  review_notes: string;

  @Prop({ type: String })
  rejection_reason: string;

  // Clarification request/response - when pharmacist needs more info from patient
  @Prop(
    raw({
      request_message: { type: String },
      required_information: [{ type: String }],
      requested_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      requested_at: { type: Date },
      response_deadline: { type: Date },
      response_message: { type: String },
      response_documents: [
        {
          url: { type: String },
          filename: { type: String },
          mimetype: { type: String },
          uploaded_at: { type: Date },
        },
      ],
      responded_at: { type: Date },
      response_reviewed: { type: Boolean, default: false },
      response_reviewed_at: { type: Date },
    }),
  )
  clarification: {
    request_message: string;
    required_information: string[];
    requested_by: Types.ObjectId;
    requested_at: Date;
    response_deadline: Date;
    response_message: string;
    response_documents: Array<{
      url: string;
      filename: string;
      mimetype: string;
      uploaded_at: Date;
    }>;
    responded_at: Date;
    response_reviewed: boolean;
    response_reviewed_at: Date;
  };

  // Digital signature info (extracted from prescription or generated fingerprint)
  @Prop(
    raw({
      has_signature: { type: Boolean, default: false },
      hash: { type: String },
      hash_type: { type: String },
      verify_url: { type: String },
      reference_number: { type: String },
      verified: { type: Boolean, default: false },
      verified_at: { type: Date },
    }),
  )
  digital_signature: {
    has_signature: boolean;
    hash: string;
    hash_type: string;
    verify_url: string;
    reference_number: string;
    verified: boolean;
    verified_at: Date;
  };

  // Soft delete
  @Prop({ type: Boolean, default: false })
  is_deleted: boolean;

  @Prop({ type: Date })
  deleted_at: Date;
}

export const PatientPrescriptionUploadSchema = SchemaFactory.createForClass(
  PatientPrescriptionUpload,
);

// Index for patient lookup
PatientPrescriptionUploadSchema.index({ patient: 1, created_at: -1 });

// Index for verification status
PatientPrescriptionUploadSchema.index({ verification_status: 1 });

// Index for finding active, valid prescriptions
PatientPrescriptionUploadSchema.index({
  patient: 1,
  verification_status: 1,
  is_expired: 1,
  is_deleted: 1,
});

// Index for pharmacist review queue (sorting by fraud score desc, then date)
PatientPrescriptionUploadSchema.index({
  verification_status: 1,
  fraud_score: -1,
  created_at: -1,
});

// Index for clarification tracking
PatientPrescriptionUploadSchema.index({
  verification_status: 1,
  'clarification.response_deadline': 1,
});
