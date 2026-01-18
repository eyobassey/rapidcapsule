import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type PrescriptionFingerprintDocument =
  HydratedDocument<PrescriptionFingerprint>;

/**
 * PrescriptionFingerprint - For duplicate prescription detection
 * Uses multiple hashing methods to identify duplicate/similar prescriptions
 */
@Schema({
  collection: 'prescription_fingerprints',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class PrescriptionFingerprint {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PatientPrescriptionUpload',
    required: true,
  })
  prescription_upload: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  patient: Types.ObjectId;

  // Cryptographic hashes (exact match detection)
  @Prop({ type: String, index: true })
  sha256_hash: string;

  @Prop({ type: String, index: true })
  md5_hash: string;

  // Perceptual hash (similar image detection)
  @Prop({ type: String, index: true })
  phash: string;

  @Prop({ type: String })
  dhash: string; // Difference hash

  @Prop({ type: String })
  ahash: string; // Average hash

  // Content-based fingerprint (for detecting edited prescriptions)
  @Prop({ type: String })
  content_hash: string; // Hash of extracted text content

  // Image metadata
  @Prop(
    raw({
      width: { type: Number },
      height: { type: Number },
      format: { type: String },
      color_space: { type: String },
      dpi: { type: Number },
      has_exif: { type: Boolean },
      exif_data: { type: mongoose.Schema.Types.Mixed },
    }),
  )
  image_metadata: {
    width: number;
    height: number;
    format: string;
    color_space: string;
    dpi: number;
    has_exif: boolean;
    exif_data: any;
  };

  // Duplicate detection results
  @Prop(
    raw([
      {
        matched_fingerprint: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'PrescriptionFingerprint',
        },
        matched_upload: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'PatientPrescriptionUpload',
        },
        match_type: {
          type: String,
          enum: ['EXACT', 'NEAR_DUPLICATE', 'SIMILAR', 'CONTENT_MATCH'],
        },
        similarity_score: { type: Number }, // 0-100
        hash_type: { type: String }, // which hash matched
        detected_at: { type: Date },
      },
    ]),
  )
  duplicates_found: Array<{
    matched_fingerprint: Types.ObjectId;
    matched_upload: Types.ObjectId;
    match_type: 'EXACT' | 'NEAR_DUPLICATE' | 'SIMILAR' | 'CONTENT_MATCH';
    similarity_score: number;
    hash_type: string;
    detected_at: Date;
  }>;

  // Duplicate summary
  @Prop({ type: Boolean, default: false })
  has_duplicates: boolean;

  @Prop({ type: Number, default: 0 })
  duplicate_count: number;

  @Prop({ type: Number, default: 0 })
  highest_similarity: number;

  // Cross-patient duplicate detection
  @Prop({ type: Boolean, default: false })
  shared_across_patients: boolean;

  @Prop({
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'User',
    default: [],
  })
  other_patients: Types.ObjectId[];

  // Processing metadata
  @Prop({ type: Date })
  fingerprinted_at: Date;

  @Prop({ type: Number })
  processing_time_ms: number;
}

export const PrescriptionFingerprintSchema = SchemaFactory.createForClass(
  PrescriptionFingerprint,
);

// Compound index for hash lookups
PrescriptionFingerprintSchema.index({ sha256_hash: 1, patient: 1 });
PrescriptionFingerprintSchema.index({ md5_hash: 1, patient: 1 });
PrescriptionFingerprintSchema.index({ phash: 1 });

// Index for duplicate detection queries
PrescriptionFingerprintSchema.index({ has_duplicates: 1, created_at: -1 });
