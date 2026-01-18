import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as crypto from 'crypto';
import * as AWS from 'aws-sdk';
import {
  PrescriptionFingerprint,
  PrescriptionFingerprintDocument,
} from '../entities/prescription-fingerprint.entity';

/**
 * Result of fingerprint generation
 */
export interface FingerprintResult {
  sha256_hash: string;
  md5_hash: string;
  phash: string | null;
  dhash: string | null;
  ahash: string | null;
  content_hash: string | null;
  image_metadata: {
    width: number | null;
    height: number | null;
    format: string | null;
    color_space: string | null;
    dpi: number | null;
    has_exif: boolean;
    exif_data: any;
  };
  processing_time_ms: number;
}

/**
 * Duplicate match result
 */
export interface DuplicateMatch {
  fingerprint_id: Types.ObjectId;
  prescription_upload_id: Types.ObjectId;
  patient_id: Types.ObjectId;
  match_type: 'EXACT' | 'NEAR_DUPLICATE' | 'SIMILAR' | 'CONTENT_MATCH';
  similarity_score: number;
  hash_type: string;
  detected_at: Date;
}

/**
 * Duplicate detection result
 */
export interface DuplicateDetectionResult {
  has_duplicates: boolean;
  duplicate_count: number;
  highest_similarity: number;
  shared_across_patients: boolean;
  other_patients: Types.ObjectId[];
  matches: DuplicateMatch[];
}

@Injectable()
export class FingerprintService {
  private readonly logger = new Logger(FingerprintService.name);
  private s3: AWS.S3;

  constructor(
    @InjectModel(PrescriptionFingerprint.name)
    private fingerprintModel: Model<PrescriptionFingerprintDocument>,
  ) {
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY,
      secretAccessKey: process.env.AWS_ACCESS_SECRET_KEY,
      region: process.env.AWS_REGION || 'us-east-2',
    });
  }

  /**
   * Generate fingerprint from S3 file
   */
  async generateFingerprintFromS3(
    bucket: string,
    key: string,
    ocrText?: string,
  ): Promise<FingerprintResult> {
    const startTime = Date.now();

    try {
      // Get file from S3
      const s3Object = await this.s3
        .getObject({ Bucket: bucket, Key: key })
        .promise();

      const buffer = s3Object.Body as Buffer;

      return this.generateFingerprintFromBuffer(buffer, ocrText, startTime);
    } catch (error) {
      this.logger.error(`Failed to get file from S3: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate fingerprint from buffer
   */
  async generateFingerprintFromBuffer(
    buffer: Buffer,
    ocrText?: string,
    startTime?: number,
  ): Promise<FingerprintResult> {
    const start = startTime || Date.now();

    // Generate cryptographic hashes
    const sha256_hash = this.generateSHA256(buffer);
    const md5_hash = this.generateMD5(buffer);

    // Generate perceptual hashes
    // Note: These are simplified implementations.
    // For production, consider using libraries like sharp + imghash
    const perceptualHashes = await this.generatePerceptualHashes(buffer);

    // Generate content hash from OCR text
    const content_hash = ocrText ? this.generateContentHash(ocrText) : null;

    // Extract image metadata
    const image_metadata = this.extractImageMetadata(buffer);

    const processing_time_ms = Date.now() - start;

    this.logger.log(`Fingerprint generated in ${processing_time_ms}ms`);

    return {
      sha256_hash,
      md5_hash,
      ...perceptualHashes,
      content_hash,
      image_metadata,
      processing_time_ms,
    };
  }

  /**
   * Generate SHA256 hash
   */
  generateSHA256(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Generate MD5 hash
   */
  generateMD5(buffer: Buffer): string {
    return crypto.createHash('md5').update(buffer).digest('hex');
  }

  /**
   * Generate content hash from OCR text
   * Normalizes text to be resilient to minor OCR variations
   */
  generateContentHash(text: string): string {
    // Normalize text:
    // - Convert to lowercase
    // - Remove extra whitespace
    // - Remove punctuation
    // - Sort words (makes hash order-independent for some variations)
    const normalized = text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    return crypto.createHash('sha256').update(normalized).digest('hex');
  }

  /**
   * Generate perceptual hashes for image similarity detection
   * Simplified implementations - for production use, consider sharp + imghash
   */
  private async generatePerceptualHashes(
    buffer: Buffer,
  ): Promise<{
    phash: string | null;
    dhash: string | null;
    ahash: string | null;
  }> {
    try {
      // Check if it's a valid image by checking magic bytes
      const isPng = buffer[0] === 0x89 && buffer[1] === 0x50;
      const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8;
      const isPdf = buffer.slice(0, 4).toString() === '%PDF';

      if (!isPng && !isJpeg && !isPdf) {
        return { phash: null, dhash: null, ahash: null };
      }

      // For now, generate a simplified hash based on file characteristics
      // This provides basic duplicate detection capability
      // A full implementation would use image processing libraries

      // Pseudo-perceptual hash: hash of file size + first/last bytes pattern
      const sizePattern = buffer.length.toString(16).padStart(8, '0');
      const headPattern = buffer.slice(0, 64).toString('hex');
      const tailPattern = buffer.slice(-64).toString('hex');

      const phash = crypto
        .createHash('sha256')
        .update(`${sizePattern}:${headPattern}:${tailPattern}`)
        .digest('hex')
        .substring(0, 16);

      // Difference hash simulation
      const dhash = crypto
        .createHash('md5')
        .update(buffer.slice(0, Math.min(buffer.length, 1024)))
        .digest('hex');

      // Average hash simulation
      const ahash = crypto
        .createHash('md5')
        .update(buffer.slice(-Math.min(buffer.length, 1024)))
        .digest('hex');

      return { phash, dhash, ahash };
    } catch (error) {
      this.logger.warn(`Failed to generate perceptual hashes: ${error.message}`);
      return { phash: null, dhash: null, ahash: null };
    }
  }

  /**
   * Extract basic image metadata
   */
  private extractImageMetadata(buffer: Buffer): FingerprintResult['image_metadata'] {
    const metadata: FingerprintResult['image_metadata'] = {
      width: null,
      height: null,
      format: null,
      color_space: null,
      dpi: null,
      has_exif: false,
      exif_data: null,
    };

    try {
      // Detect format from magic bytes
      if (buffer[0] === 0x89 && buffer[1] === 0x50) {
        metadata.format = 'PNG';
        // PNG dimensions are at bytes 16-23
        if (buffer.length >= 24) {
          metadata.width = buffer.readUInt32BE(16);
          metadata.height = buffer.readUInt32BE(20);
        }
      } else if (buffer[0] === 0xff && buffer[1] === 0xd8) {
        metadata.format = 'JPEG';
        // Parse JPEG for dimensions (simplified)
        metadata.has_exif = buffer.indexOf(Buffer.from('Exif')) !== -1;

        // Look for SOF0/SOF2 markers for dimensions
        for (let i = 0; i < buffer.length - 10; i++) {
          if (buffer[i] === 0xff && (buffer[i + 1] === 0xc0 || buffer[i + 1] === 0xc2)) {
            metadata.height = buffer.readUInt16BE(i + 5);
            metadata.width = buffer.readUInt16BE(i + 7);
            break;
          }
        }
      } else if (buffer.slice(0, 4).toString() === '%PDF') {
        metadata.format = 'PDF';
      } else if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
        metadata.format = 'GIF';
        if (buffer.length >= 10) {
          metadata.width = buffer.readUInt16LE(6);
          metadata.height = buffer.readUInt16LE(8);
        }
      }
    } catch (error) {
      this.logger.warn(`Failed to extract image metadata: ${error.message}`);
    }

    return metadata;
  }

  /**
   * Create and save fingerprint record
   */
  async createFingerprint(
    prescriptionUploadId: Types.ObjectId,
    patientId: Types.ObjectId,
    fingerprintData: FingerprintResult,
  ): Promise<PrescriptionFingerprintDocument> {
    const fingerprint = new this.fingerprintModel({
      prescription_upload: prescriptionUploadId,
      patient: patientId,
      sha256_hash: fingerprintData.sha256_hash,
      md5_hash: fingerprintData.md5_hash,
      phash: fingerprintData.phash,
      dhash: fingerprintData.dhash,
      ahash: fingerprintData.ahash,
      content_hash: fingerprintData.content_hash,
      image_metadata: fingerprintData.image_metadata,
      fingerprinted_at: new Date(),
      processing_time_ms: fingerprintData.processing_time_ms,
      duplicates_found: [],
      has_duplicates: false,
      duplicate_count: 0,
      highest_similarity: 0,
      shared_across_patients: false,
      other_patients: [],
    });

    return fingerprint.save();
  }

  /**
   * Find duplicates for a given fingerprint
   */
  async findDuplicates(
    fingerprintData: FingerprintResult,
    currentPatientId: Types.ObjectId,
    currentUploadId?: Types.ObjectId,
  ): Promise<DuplicateDetectionResult> {
    const matches: DuplicateMatch[] = [];
    const otherPatients: Set<string> = new Set();
    let hasSharedAcrossPatients = false;

    // Build query to exclude current upload
    const excludeQuery: any = {};
    if (currentUploadId) {
      excludeQuery.prescription_upload = { $ne: currentUploadId };
    }

    // 1. Check for exact SHA256 match (100% duplicate)
    const exactMatches = await this.fingerprintModel.find({
      ...excludeQuery,
      sha256_hash: fingerprintData.sha256_hash,
    }).lean();

    for (const match of exactMatches) {
      matches.push({
        fingerprint_id: match._id,
        prescription_upload_id: match.prescription_upload,
        patient_id: match.patient,
        match_type: 'EXACT',
        similarity_score: 100,
        hash_type: 'SHA256',
        detected_at: new Date(),
      });

      if (match.patient.toString() !== currentPatientId.toString()) {
        hasSharedAcrossPatients = true;
        otherPatients.add(match.patient.toString());
      }
    }

    // 2. Check for MD5 match (if SHA256 didn't match, this is also exact)
    if (exactMatches.length === 0) {
      const md5Matches = await this.fingerprintModel.find({
        ...excludeQuery,
        md5_hash: fingerprintData.md5_hash,
      }).lean();

      for (const match of md5Matches) {
        matches.push({
          fingerprint_id: match._id,
          prescription_upload_id: match.prescription_upload,
          patient_id: match.patient,
          match_type: 'EXACT',
          similarity_score: 100,
          hash_type: 'MD5',
          detected_at: new Date(),
        });

        if (match.patient.toString() !== currentPatientId.toString()) {
          hasSharedAcrossPatients = true;
          otherPatients.add(match.patient.toString());
        }
      }
    }

    // 3. Check for perceptual hash matches (near-duplicates)
    if (fingerprintData.phash) {
      const phashMatches = await this.fingerprintModel.find({
        ...excludeQuery,
        phash: fingerprintData.phash,
        sha256_hash: { $ne: fingerprintData.sha256_hash },
      }).lean();

      for (const match of phashMatches) {
        const existingMatch = matches.find(
          (m) => m.prescription_upload_id.toString() === match.prescription_upload.toString(),
        );

        if (!existingMatch) {
          matches.push({
            fingerprint_id: match._id,
            prescription_upload_id: match.prescription_upload,
            patient_id: match.patient,
            match_type: 'NEAR_DUPLICATE',
            similarity_score: 95,
            hash_type: 'PHASH',
            detected_at: new Date(),
          });

          if (match.patient.toString() !== currentPatientId.toString()) {
            hasSharedAcrossPatients = true;
            otherPatients.add(match.patient.toString());
          }
        }
      }
    }

    // 4. Check for content hash matches (text content matches)
    if (fingerprintData.content_hash) {
      const contentMatches = await this.fingerprintModel.find({
        ...excludeQuery,
        content_hash: fingerprintData.content_hash,
        sha256_hash: { $ne: fingerprintData.sha256_hash },
      }).lean();

      for (const match of contentMatches) {
        const existingMatch = matches.find(
          (m) => m.prescription_upload_id.toString() === match.prescription_upload.toString(),
        );

        if (!existingMatch) {
          matches.push({
            fingerprint_id: match._id,
            prescription_upload_id: match.prescription_upload,
            patient_id: match.patient,
            match_type: 'CONTENT_MATCH',
            similarity_score: 90,
            hash_type: 'CONTENT',
            detected_at: new Date(),
          });

          if (match.patient.toString() !== currentPatientId.toString()) {
            hasSharedAcrossPatients = true;
            otherPatients.add(match.patient.toString());
          }
        }
      }
    }

    // Sort matches by similarity score descending
    matches.sort((a, b) => b.similarity_score - a.similarity_score);

    return {
      has_duplicates: matches.length > 0,
      duplicate_count: matches.length,
      highest_similarity: matches.length > 0 ? matches[0].similarity_score : 0,
      shared_across_patients: hasSharedAcrossPatients,
      other_patients: Array.from(otherPatients).map((id) => new Types.ObjectId(id)),
      matches,
    };
  }

  /**
   * Update fingerprint with duplicate detection results
   */
  async updateFingerprintWithDuplicates(
    fingerprintId: Types.ObjectId,
    duplicateResult: DuplicateDetectionResult,
  ): Promise<void> {
    await this.fingerprintModel.findByIdAndUpdate(fingerprintId, {
      duplicates_found: duplicateResult.matches.map((m) => ({
        matched_fingerprint: m.fingerprint_id,
        matched_upload: m.prescription_upload_id,
        match_type: m.match_type,
        similarity_score: m.similarity_score,
        hash_type: m.hash_type,
        detected_at: m.detected_at,
      })),
      has_duplicates: duplicateResult.has_duplicates,
      duplicate_count: duplicateResult.duplicate_count,
      highest_similarity: duplicateResult.highest_similarity,
      shared_across_patients: duplicateResult.shared_across_patients,
      other_patients: duplicateResult.other_patients,
    });
  }

  /**
   * Get fingerprint by prescription upload ID
   */
  async getFingerprintByUploadId(
    uploadId: Types.ObjectId,
  ): Promise<PrescriptionFingerprintDocument | null> {
    return this.fingerprintModel.findOne({ prescription_upload: uploadId });
  }

  /**
   * Get all fingerprints for a patient
   */
  async getPatientFingerprints(
    patientId: Types.ObjectId,
  ): Promise<PrescriptionFingerprintDocument[]> {
    return this.fingerprintModel
      .find({ patient: patientId })
      .sort({ created_at: -1 });
  }

  /**
   * Calculate similarity between two text strings
   * Uses Jaccard similarity on word sets
   */
  calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/).filter((w) => w.length > 2));
    const words2 = new Set(text2.toLowerCase().split(/\s+/).filter((w) => w.length > 2));

    const intersection = new Set([...words1].filter((x) => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    if (union.size === 0) return 0;

    return (intersection.size / union.size) * 100;
  }

  /**
   * Calculate Hamming distance between two hex strings
   */
  calculateHammingDistance(hash1: string, hash2: string): number {
    if (hash1.length !== hash2.length) {
      return -1; // Invalid comparison
    }

    let distance = 0;
    for (let i = 0; i < hash1.length; i++) {
      const bits1 = parseInt(hash1[i], 16);
      const bits2 = parseInt(hash2[i], 16);
      let xor = bits1 ^ bits2;
      while (xor) {
        distance += xor & 1;
        xor >>= 1;
      }
    }

    return distance;
  }

  /**
   * Convert Hamming distance to similarity percentage
   */
  hammingToSimilarity(distance: number, hashLength: number): number {
    const maxBits = hashLength * 4; // 4 bits per hex character
    return ((maxBits - distance) / maxBits) * 100;
  }
}
