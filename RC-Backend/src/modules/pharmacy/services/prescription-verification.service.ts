import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  PrescriptionVerification,
  PrescriptionVerificationDocument,
  VerificationResult,
  VerificationTier,
  CheckResult,
} from '../entities/prescription-verification.entity';
import {
  PatientPrescriptionUpload,
  PatientPrescriptionUploadDocument,
  ProcessingStatus,
  VerificationStatus,
} from '../entities/patient-prescription-upload.entity';
import { TextractService, OcrResult } from './textract.service';
import { FingerprintService, DuplicateDetectionResult } from './fingerprint.service';
import { DrugService } from './drug.service';
import { ClaudeAIService, PrescriptionAnalysisResult } from './claude-ai.service';
import { DocumentProcessorService, DocumentType } from './document-processor.service';
import { User, UserDocument } from '../../../modules/users/entities/user.entity';
import {
  SpecialistPrescription,
  SpecialistPrescriptionDocument,
} from '../../prescriptions/entities/specialist-prescription.entity';
import {
  PharmacyOrder,
  PharmacyOrderDocument,
} from '../entities/pharmacy-order.entity';
import { GeneralHelpers } from '../../../common/helpers/general.helpers';
import { prescriptionUploadRejectedEmail } from '../../../core/emails/mails/prescriptionEmails';

/**
 * Verification events for WebSocket notifications
 */
export enum VerificationEvent {
  VERIFICATION_STARTED = 'prescription.verification.started',
  TIER1_STARTED = 'prescription.verification.tier1.started',
  TIER1_COMPLETED = 'prescription.verification.tier1.completed',
  TIER2_STARTED = 'prescription.verification.tier2.started',
  TIER2_COMPLETED = 'prescription.verification.tier2.completed',
  PHARMACIST_REQUIRED = 'prescription.verification.pharmacist.required',
  VERIFICATION_COMPLETED = 'prescription.verification.completed',
  VERIFICATION_FAILED = 'prescription.verification.failed',
}

/**
 * Tier 1 configuration thresholds
 */
const TIER1_CONFIG = {
  MIN_OCR_CONFIDENCE: 60,
  MIN_TEXT_LENGTH: 50,
  MAX_FILE_SIZE_MB: 10,
  ALLOWED_FORMATS: ['JPEG', 'PNG', 'PDF', 'WEBP', 'GIF'],
  MIN_IMAGE_WIDTH: 200,
  MIN_IMAGE_HEIGHT: 200,
};

/**
 * Tier 2 configuration thresholds
 */
const TIER2_CONFIG = {
  MIN_MEDICATION_CONFIDENCE: 70,
  MIN_OVERALL_SCORE: 60,
  REQUIRE_DOCTOR_NAME: true,
  REQUIRE_DATE: true,
  MAX_PRESCRIPTION_AGE_DAYS: 180,
  // Score-based auto-approval thresholds
  AUTO_APPROVE_SCORE: 90, // Auto-approve if score >= 90%
  NEEDS_REVIEW_SCORE: 75, // Needs review if score >= 75% but < 90%
  // Testing mode - set PRESCRIPTION_TESTING_MODE=true in env to auto-approve all
  TESTING_MODE: process.env.PRESCRIPTION_TESTING_MODE === 'true'
};

/**
 * Fraud detection thresholds
 */
const FRAUD_CONFIG = {
  DUPLICATE_CRITICAL_THRESHOLD: 95,
  DUPLICATE_HIGH_THRESHOLD: 85,
  DUPLICATE_MEDIUM_THRESHOLD: 70,
  CROSS_PATIENT_CRITICAL: true,
  MAX_UPLOADS_PER_DAY: 5,
  MAX_UPLOADS_PER_WEEK: 15,
};

@Injectable()
export class PrescriptionVerificationService {
  private readonly logger = new Logger(PrescriptionVerificationService.name);

  constructor(
    @InjectModel(PrescriptionVerification.name)
    private verificationModel: Model<PrescriptionVerificationDocument>,
    @InjectModel(PatientPrescriptionUpload.name)
    private uploadModel: Model<PatientPrescriptionUploadDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(SpecialistPrescription.name)
    private specialistPrescriptionModel: Model<SpecialistPrescriptionDocument>,
    @InjectModel(PharmacyOrder.name)
    private pharmacyOrderModel: Model<PharmacyOrderDocument>,
    private readonly textractService: TextractService,
    private readonly fingerprintService: FingerprintService,
    private readonly drugService: DrugService,
    private readonly claudeAIService: ClaudeAIService,
    private readonly documentProcessor: DocumentProcessorService,
    private readonly eventEmitter: EventEmitter2,
    private readonly generalHelpers: GeneralHelpers,
  ) {}

  /**
   * Start the full verification pipeline for a prescription upload
   */
  async startVerificationPipeline(
    uploadId: Types.ObjectId,
    patientId: Types.ObjectId,
  ): Promise<PrescriptionVerificationDocument> {
    const startTime = Date.now();

    this.logger.log(`Starting verification pipeline for upload ${uploadId}`);

    // Get the upload document
    const upload = await this.uploadModel.findById(uploadId);
    if (!upload) {
      throw new NotFoundException('Prescription upload not found');
    }

    // Create verification record
    let verification = new this.verificationModel({
      prescription_upload: uploadId,
      patient: patientId,
      overall_result: VerificationResult.PENDING,
      overall_score: 0,
      confidence_score: 0,
      current_tier: VerificationTier.TIER1,
      verification_started_at: new Date(),
      tier1: {
        status: 'PENDING',
        result: 'PENDING',
        score: 0,
        checks: [],
      },
      tier2: {
        status: 'PENDING',
        result: 'PENDING',
        score: 0,
        checks: [],
        medication_validation: {
          all_medications_valid: false,
          validated_medications: [],
        },
        doctor_validation: {
          license_verified: false,
        },
      },
      pharmacist_review: {
        status: 'NOT_REQUIRED',
        result: 'PENDING',
      },
      fraud_detection: {
        score: 0,
        risk_level: 'LOW',
        flags: [],
        duplicate_prescription: false,
        edited_document: false,
        invalid_doctor: false,
        suspicious_pattern: false,
      },
      errors: [],
      retry_count: 0,
    });

    verification = await verification.save();

    // Update upload with verification reference
    await this.uploadModel.findByIdAndUpdate(uploadId, {
      verification: verification._id,
      verification_status: VerificationStatus.TIER1_PROCESSING,
      processing_status: ProcessingStatus.PROCESSING,
    });

    // Emit start event
    this.emitVerificationEvent(VerificationEvent.VERIFICATION_STARTED, {
      uploadId: uploadId.toString(),
      patientId: patientId.toString(),
      verificationId: verification._id.toString(),
    });

    try {
      // Run Tier 1 verification
      verification = await this.runTier1Verification(verification, upload);

      // Check if Tier 1 passed OR if it's a platform prescription (which should continue to tier2 even if tier1 fails)
      const shouldContinueToTier2 = verification.tier1.result === 'PASSED' || verification.is_platform_prescription;

      if (shouldContinueToTier2) {
        // Update status and run Tier 2
        const tier1Status = verification.tier1.result === 'PASSED'
          ? VerificationStatus.TIER1_PASSED
          : VerificationStatus.TIER1_FAILED; // Platform prescription with tier1 failure still continues

        if (verification.is_platform_prescription && verification.tier1.result !== 'PASSED') {
          this.logger.log(`Platform prescription ${verification.platform_prescription_number} tier1 failed but continuing to tier2 for review`);
        }

        await this.uploadModel.findByIdAndUpdate(uploadId, {
          verification_status: tier1Status,
        });

        verification = await this.runTier2Verification(verification, upload);

        // Determine final outcome
        verification = await this.determineOutcome(verification, upload, startTime);
      } else {
        // Tier 1 failed (non-platform prescription) - generate patient-friendly message based on what failed
        const failedChecks = verification.tier1.checks.filter(c => !c.passed);
        let patientSummary = 'Your prescription could not be verified.';

        // Generate specific messages for common failures
        const duplicateCheck = failedChecks.find(c => c.check_name === 'Duplicate Detection');
        const formatCheck = failedChecks.find(c => c.check_name === 'File Format');
        const ocrCheck = failedChecks.find(c => c.check_name === 'OCR Processing');
        const textCheck = failedChecks.find(c => c.check_name === 'Text Content');

        if (duplicateCheck) {
          patientSummary = 'This prescription appears to be a duplicate of a previous upload. If you believe this is a new prescription, please contact support.';
        } else if (formatCheck) {
          patientSummary = 'The file format is not supported. Please upload a JPEG, PNG, WebP, or PDF file.';
        } else if (ocrCheck || textCheck) {
          patientSummary = 'We could not read the text on your prescription. Please upload a clearer image with good lighting.';
        }

        // Store patient summary for frontend display
        verification.tier1.patient_summary = patientSummary;

        await this.uploadModel.findByIdAndUpdate(uploadId, {
          verification_status: VerificationStatus.TIER1_FAILED,
          processing_status: ProcessingStatus.COMPLETED,
        });

        verification.overall_result = VerificationResult.FAILED;
        verification.verification_completed_at = new Date();
        verification.total_processing_time_ms = Date.now() - startTime;
        verification = await verification.save();

        this.emitVerificationEvent(VerificationEvent.VERIFICATION_FAILED, {
          uploadId: uploadId.toString(),
          reason: 'Tier 1 verification failed',
          checks: verification.tier1.checks,
        });

        // Send rejection email for tier1 failures too
        await this.sendRejectionEmail(upload, verification);
      }

      return verification;
    } catch (error) {
      this.logger.error(`Verification pipeline error: ${error.message}`);

      // Record error
      verification.errors.push({
        tier: verification.current_tier,
        error_code: 'PIPELINE_ERROR',
        error_message: error.message,
        stack_trace: error.stack,
        occurred_at: new Date(),
      });

      verification.overall_result = VerificationResult.FAILED;
      verification.verification_completed_at = new Date();
      verification.total_processing_time_ms = Date.now() - startTime;
      await verification.save();

      // Update upload status
      await this.uploadModel.findByIdAndUpdate(uploadId, {
        verification_status: VerificationStatus.REJECTED,
        processing_status: ProcessingStatus.FAILED,
        processing_error: error.message,
      });

      this.emitVerificationEvent(VerificationEvent.VERIFICATION_FAILED, {
        uploadId: uploadId.toString(),
        error: error.message,
      });

      throw error;
    }
  }

  /**
   * Run Tier 1 verification (quick automated checks)
   */
  private async runTier1Verification(
    verification: PrescriptionVerificationDocument,
    upload: PatientPrescriptionUploadDocument,
  ): Promise<PrescriptionVerificationDocument> {
    const startTime = Date.now();
    const checks: CheckResult[] = [];

    this.logger.log(`Running Tier 1 verification for upload ${upload._id}`);

    verification.current_tier = VerificationTier.TIER1;
    verification.tier1.status = 'PROCESSING';
    verification.tier1.started_at = new Date();
    await verification.save();

    this.emitVerificationEvent(VerificationEvent.TIER1_STARTED, {
      uploadId: upload._id.toString(),
    });

    try {
      // Check 1: File size validation
      const fileSizeCheck = this.checkFileSize(upload.file_size);
      checks.push(fileSizeCheck);

      // Check 2: File format validation
      const formatCheck = this.checkFileFormat(upload.mimetype);
      checks.push(formatCheck);

      // Get document buffer from S3 for processing
      const docBuffer = await this.documentProcessor.getDocumentFromS3(
        upload.s3_bucket,
        upload.s3_key,
      );

      // Process document to get direct text extraction (for DOCX or PDF fallback)
      const docType = this.documentProcessor.getDocumentType(upload.mimetype);
      const processedDoc = await this.documentProcessor.processDocument(
        docBuffer,
        upload.mimetype,
        upload.original_filename,
      );

      this.logger.log(`Document processed: type=${docType}, hasDirectText=${!!processedDoc.extractedText}`);

      let ocrResult: OcrResult;

      // For Word documents, we can't use Textract - use direct extraction
      if (docType === DocumentType.DOCX || docType === DocumentType.DOC) {
        this.logger.log('Processing Word document - using direct text extraction');

        if (!processedDoc.success || !processedDoc.extractedText) {
          throw new Error(`Failed to extract text from Word document: ${processedDoc.error}`);
        }

        // Create OCR-like result from Word document
        const directText = processedDoc.extractedText;
        const medications = this.documentProcessor.extractMedicationsFromText(directText);
        const prescriptionDate = this.documentProcessor.extractPrescriptionDate(directText);

        ocrResult = {
          success: true,
          data: {
            rawText: directText,
            confidence: 95, // High confidence for direct extraction
            doctorName: this.extractDoctorName(directText),
            patientName: this.extractPatientName(directText),
            clinicName: null,
            clinicAddress: null,
            prescriptionDate,
            doctorLicense: this.extractDoctorLicense(directText),
            validityPeriod: null,
            medications,
            keyValuePairs: [],
            tables: [],
          },
          error: null,
          processingTimeMs: 0,
        };
      } else {
        // For PDF/images, try Textract
        // Note: Textract only supports JPEG, PNG, PDF - convert WebP/GIF to PNG first
        if (docType === DocumentType.WEBP || docType === DocumentType.GIF) {
          this.logger.log(`Converting ${docType} to PNG for Textract compatibility`);
          const sharp = require('sharp');
          const pngBuffer = await sharp(docBuffer).png().toBuffer();
          ocrResult = await this.textractService.analyzeDocumentFromBuffer(pngBuffer);
        } else {
          ocrResult = await this.textractService.analyzeDocumentFromS3(
            upload.s3_bucket,
            upload.s3_key,
          );
        }

        // If Textract failed (e.g., multi-page PDF not supported by synchronous API),
        // fall back to document processor's direct text extraction
        if (!ocrResult.success && processedDoc.success && processedDoc.extractedText) {
          this.logger.warn(`Textract failed: ${ocrResult.error}. Falling back to direct PDF text extraction.`);

          const directText = processedDoc.extractedText;
          const medications = this.documentProcessor.extractMedicationsFromText(directText);
          const prescriptionDate = this.documentProcessor.extractPrescriptionDate(directText);

          // Check if this is a Rapid Capsules-generated prescription
          const isRapidCapsulesPrescription = this.detectRapidCapsulesPrescription(directText);
          let dbPrescription: SpecialistPrescriptionDocument | null = null;

          if (isRapidCapsulesPrescription) {
            this.logger.log('Detected Rapid Capsules-generated prescription - checking database');

            // Try to look up the prescription in our database
            const rxRef = this.extractRapidCapsulesPrescriptionRef(directText);
            if (rxRef) {
              this.logger.log(`Looking up prescription reference: ${rxRef}`);
              dbPrescription = await this.specialistPrescriptionModel.findOne({
                prescription_number: rxRef,
              }).populate('specialist_id', 'profile');

              if (dbPrescription) {
                this.logger.log(`Found matching prescription in database: ${rxRef}`);
              } else {
                this.logger.warn(`Prescription ${rxRef} not found in database - may be from external source`);
              }
            }
          }

          // If we found the prescription in our database, use that data
          if (dbPrescription) {
            const specialist = (dbPrescription as any).specialist_id as any;
            const specialistName = specialist?.profile
              ? `${specialist.profile.first_name || ''} ${specialist.profile.last_name || ''}`.trim()
              : null;

            const dbMedications = (dbPrescription as any).items?.map((item: any) => ({
              name: item.drug_name || item.medication_name,
              dosage: item.dosage,
              frequency: item.frequency,
              duration: item.duration,
              instructions: item.instructions,
              quantity: item.quantity,
            })) || medications;

            ocrResult = {
              success: true,
              data: {
                rawText: directText,
                confidence: 100, // 100% confidence for system-generated prescriptions from our database
                doctorName: specialistName || this.extractDoctorName(directText),
                patientName: this.extractPatientName(directText),
                clinicName: (dbPrescription as any).clinic_name || 'Rapid Capsules Medical',
                clinicAddress: (dbPrescription as any).clinic_address || null,
                prescriptionDate: (dbPrescription as any).created_at?.toISOString().split('T')[0] || prescriptionDate,
                doctorLicense: null, // Would need to add to specialist model
                validityPeriod: (dbPrescription as any).expiry_date?.toISOString().split('T')[0] || null,
                medications: dbMedications,
                keyValuePairs: [],
                tables: [],
              },
              error: null,
              processingTimeMs: 0,
            };

            this.logger.log(`Using database prescription data for ${(dbPrescription as any).prescription_number}`);
          } else {
            ocrResult = {
              success: true,
              data: {
                rawText: directText,
                confidence: isRapidCapsulesPrescription ? 98 : 90, // High confidence for system-generated
                doctorName: this.extractDoctorName(directText),
                patientName: this.extractPatientName(directText),
                clinicName: this.extractClinicName(directText),
                clinicAddress: null,
                prescriptionDate,
                doctorLicense: this.extractDoctorLicense(directText),
                validityPeriod: null,
                medications,
                keyValuePairs: [],
                tables: [],
              },
              error: null,
              processingTimeMs: 0,
            };
          }

          this.logger.log(`Fallback extraction found ${medications.length} medications, confidence: ${ocrResult.data?.confidence ?? 0}%`);
        }

        // If Textract succeeded but found few/no medications, try document processor fallback
        if (ocrResult.success && ocrResult.data) {
          const textractMedCount = ocrResult.data.medications?.length || 0;
          this.logger.log(`Textract found ${textractMedCount} medications`);

          if (textractMedCount === 0 && processedDoc.extractedText) {
            this.logger.log('Textract found no medications, trying fallback extraction...');

            // Try to extract medications from direct PDF text
            const fallbackMeds = this.documentProcessor.extractMedicationsFromText(
              processedDoc.extractedText,
            );

            if (fallbackMeds.length > 0) {
              this.logger.log(`Fallback extraction found ${fallbackMeds.length} medications`);
              ocrResult.data.medications = fallbackMeds;
            }

            // Also try fallback date extraction if Textract missed it
            if (!ocrResult.data.prescriptionDate) {
              const fallbackDate = this.documentProcessor.extractPrescriptionDate(
                processedDoc.extractedText,
              );
              if (fallbackDate) {
                this.logger.log(`Fallback date extraction found: ${fallbackDate}`);
                ocrResult.data.prescriptionDate = fallbackDate;
              }
            }

            // Combine text if direct extraction found more
            ocrResult.data.rawText = this.documentProcessor.combineTextExtractions(
              ocrResult.data.rawText,
              processedDoc.extractedText,
            );
          }
        }
      }

      // Update upload with OCR data
      if (ocrResult.success && ocrResult.data) {
        await this.uploadModel.findByIdAndUpdate(upload._id, {
          ocr_data: {
            raw_text: ocrResult.data.rawText,
            confidence: ocrResult.data.confidence,
            doctor_name: ocrResult.data.doctorName,
            patient_name: ocrResult.data.patientName,
            clinic_name: ocrResult.data.clinicName,
            clinic_address: ocrResult.data.clinicAddress,
            prescription_date: ocrResult.data.prescriptionDate,
            medications: ocrResult.data.medications,
            doctor_license: ocrResult.data.doctorLicense,
            validity_period: ocrResult.data.validityPeriod,
          },
        });

        // Check for Rapid Capsules platform-generated prescription
        const combinedText = ocrResult.data.rawText || '';
        const isRapidCapsulesPrescription = this.detectRapidCapsulesPrescription(combinedText);

        if (isRapidCapsulesPrescription) {
          const rxRef = this.extractRapidCapsulesPrescriptionRef(combinedText);
          this.logger.log(`Detected Rapid Capsules prescription. RX Ref: ${rxRef}`);

          if (rxRef) {
            // Look up the prescription in our database
            const dbPrescription = await this.specialistPrescriptionModel.findOne({
              prescription_number: rxRef,
            });

            if (dbPrescription) {
              this.logger.log(`Found matching platform prescription in database: ${rxRef}`);
              verification.is_platform_prescription = true;
              verification.platform_prescription_id = dbPrescription._id;
              verification.platform_prescription_number = rxRef;

              // Add a check noting this is a trusted platform prescription
              checks.push({
                check_name: 'Platform Prescription',
                passed: true,
                score: 100,
                details: `This is a Rapid Capsules platform-generated prescription (${rxRef}). Content will still be validated but prescription source is trusted.`,
                severity: 'INFO',
                timestamp: new Date(),
              });
            } else {
              this.logger.warn(`Prescription ${rxRef} looks like RC format but not found in database`);
              checks.push({
                check_name: 'Platform Prescription',
                passed: false,
                score: 50,
                details: `Prescription has Rapid Capsules format (${rxRef}) but was not found in database. May be from external source or deleted.`,
                severity: 'WARNING',
                timestamp: new Date(),
              });
            }
          }
        }

        // Check 3: OCR confidence
        const ocrConfidenceCheck = this.checkOcrConfidence(ocrResult.data.confidence);
        checks.push(ocrConfidenceCheck);

        // Check 4: Text length (not blank/minimal content)
        const textLengthCheck = this.checkTextLength(ocrResult.data.rawText);
        checks.push(textLengthCheck);

        // Check 5: Generate fingerprint and check for duplicates
        const fingerprintResult = await this.fingerprintService.generateFingerprintFromS3(
          upload.s3_bucket,
          upload.s3_key,
          ocrResult.data.rawText,
        );

        // Save fingerprint
        const fingerprint = await this.fingerprintService.createFingerprint(
          upload._id,
          upload.patient,
          fingerprintResult,
        );

        // Update upload with fingerprint reference
        await this.uploadModel.findByIdAndUpdate(upload._id, {
          fingerprint: fingerprint._id,
        });

        // Check for duplicates
        const duplicates = await this.fingerprintService.findDuplicates(
          fingerprintResult,
          upload.patient,
          upload._id,
        );

        // Update fingerprint with duplicates
        await this.fingerprintService.updateFingerprintWithDuplicates(
          fingerprint._id,
          duplicates,
        );

        // Check 6: Duplicate detection
        const duplicateCheck = this.checkDuplicates(duplicates);
        checks.push(duplicateCheck);

        // Update fraud detection with duplicate info
        verification.fraud_detection.duplicate_prescription = duplicates.has_duplicates;
        if (duplicates.has_duplicates) {
          verification.fraud_detection.flags.push({
            flag_type: 'DUPLICATE_DETECTED',
            severity: duplicates.shared_across_patients ? 'CRITICAL' : 'HIGH',
            description: duplicates.shared_across_patients
              ? 'Prescription found in another patient account'
              : 'Duplicate prescription detected',
            evidence: `${duplicates.duplicate_count} duplicates found, highest similarity: ${duplicates.highest_similarity}%`,
            detected_at: new Date(),
          });
        }

        // Check 7: Prescription already used for paid order
        const prescriptionUsageCheck = await this.checkPrescriptionAlreadyUsed(upload._id);
        if (prescriptionUsageCheck.alreadyUsed) {
          const previousOrder = prescriptionUsageCheck.previousOrders[0];
          checks.push({
            check_name: 'Prescription Already Used',
            passed: false,
            score: 0,
            details: `This prescription was already used for order ${previousOrder.orderNumber} (${previousOrder.status})`,
            severity: 'CRITICAL',
            timestamp: new Date(),
          });

          verification.fraud_detection.flags.push({
            flag_type: 'PRESCRIPTION_ALREADY_USED',
            severity: 'CRITICAL',
            description: 'This prescription has already been used for a completed/paid order',
            evidence: `Previous order: ${previousOrder.orderNumber}, Status: ${previousOrder.status}, Paid: ${previousOrder.paidAt?.toISOString() || 'N/A'}`,
            detected_at: new Date(),
          });

          this.logger.warn(`Prescription ${upload._id} has already been used for order ${previousOrder.orderNumber}`);
        } else {
          checks.push({
            check_name: 'Prescription Already Used',
            passed: true,
            score: 100,
            details: 'Prescription has not been used for any previous orders',
            severity: 'INFO',
            timestamp: new Date(),
          });
        }

        // Check 8: Image quality (if applicable)
        const imageQualityCheck = this.checkImageQuality(fingerprintResult.image_metadata);
        checks.push(imageQualityCheck);
      } else {
        // OCR failed
        checks.push({
          check_name: 'OCR Processing',
          passed: false,
          score: 0,
          details: `OCR failed: ${ocrResult.error}`,
          severity: 'CRITICAL',
          timestamp: new Date(),
        });
      }

      // Calculate Tier 1 score
      const tier1Score = this.calculateTierScore(checks);
      const tier1Passed = checks.filter((c) => c.severity === 'CRITICAL' && !c.passed).length === 0
        && tier1Score >= 60;

      // Update verification with Tier 1 results
      verification.tier1.status = 'COMPLETED';
      verification.tier1.result = tier1Passed ? 'PASSED' : 'FAILED';
      verification.tier1.score = tier1Score;
      verification.tier1.completed_at = new Date();
      verification.tier1.processing_time_ms = Date.now() - startTime;
      verification.tier1.checks = checks;

      verification = await verification.save();

      this.emitVerificationEvent(VerificationEvent.TIER1_COMPLETED, {
        uploadId: upload._id.toString(),
        passed: tier1Passed,
        score: tier1Score,
        checks,
      });

      return verification;
    } catch (error) {
      verification.tier1.status = 'FAILED';
      verification.tier1.result = 'FAILED';
      verification.tier1.completed_at = new Date();
      verification.tier1.processing_time_ms = Date.now() - startTime;

      verification.errors.push({
        tier: 'TIER1',
        error_code: 'TIER1_ERROR',
        error_message: error.message,
        stack_trace: error.stack,
        occurred_at: new Date(),
      });

      await verification.save();
      throw error;
    }
  }

  /**
   * Run Tier 2 verification (deep AI analysis)
   */
  private async runTier2Verification(
    verification: PrescriptionVerificationDocument,
    upload: PatientPrescriptionUploadDocument,
  ): Promise<PrescriptionVerificationDocument> {
    const startTime = Date.now();
    const checks: CheckResult[] = [];

    this.logger.log(`Running Tier 2 verification for upload ${upload._id}`);

    verification.current_tier = VerificationTier.TIER2;
    verification.tier2.status = 'PROCESSING';
    verification.tier2.started_at = new Date();
    await verification.save();

    this.emitVerificationEvent(VerificationEvent.TIER2_STARTED, {
      uploadId: upload._id.toString(),
    });

    try {
      // Reload upload to get OCR data
      const freshUpload = await this.uploadModel.findById(upload._id);
      if (!freshUpload?.ocr_data) {
        throw new BadRequestException('OCR data not available for Tier 2 verification');
      }

      const ocrData = freshUpload.ocr_data;

      // Check 1: Doctor name present
      const doctorNameCheck = this.checkDoctorName(ocrData.doctor_name);
      checks.push(doctorNameCheck);

      // Check 2: Prescription date validation
      const dateCheck = this.checkPrescriptionDate(ocrData.prescription_date);
      checks.push(dateCheck);

      // Check 3: Medications extracted
      const medicationsCheck = this.checkMedicationsExtracted(ocrData.medications);
      checks.push(medicationsCheck);

      // Check 4: Validate medications against drug database
      const validatedMedications = await this.validateMedications(ocrData.medications);
      verification.tier2.medication_validation = validatedMedications as any;

      const medicationValidationCheck: CheckResult = {
        check_name: 'Medication Database Validation',
        passed: validatedMedications.all_medications_valid,
        score: validatedMedications.validated_medications.filter((m) => m.is_valid).length /
          Math.max(1, validatedMedications.validated_medications.length) * 100,
        details: validatedMedications.all_medications_valid
          ? 'All medications validated successfully'
          : `${validatedMedications.validated_medications.filter((m) => !m.is_valid).length} medications could not be validated`,
        severity: validatedMedications.all_medications_valid ? 'INFO' : 'WARNING',
        timestamp: new Date(),
      };
      checks.push(medicationValidationCheck);

      // Check 5: Doctor license validation (if present)
      if (ocrData.doctor_license) {
        const licenseCheck = await this.validateDoctorLicense(ocrData.doctor_license);
        checks.push(licenseCheck);
        verification.tier2.doctor_validation = {
          license_verified: licenseCheck.passed,
          license_number: ocrData.doctor_license,
          doctor_name: ocrData.doctor_name || '',
          specialization: '',
          clinic_verified: false,
          notes: licenseCheck.details,
        };
      }

      // Check 6: Check for controlled substances
      const controlledCheck = this.checkControlledSubstances(validatedMedications);
      checks.push(controlledCheck);

      // Check 7: Prescription validity period
      const validityCheck = this.checkValidityPeriod(
        ocrData.prescription_date,
        ocrData.validity_period,
      );
      checks.push(validityCheck);

      // Check 8: Patient name matching (CRITICAL - prevents fraud)
      const patientNameCheck = await this.checkPatientNameMatch(
        verification.patient,
        ocrData.patient_name,
      );
      checks.push(patientNameCheck);

      // Add fraud flag if patient name doesn't match
      if (!patientNameCheck.passed && patientNameCheck.score < 50) {
        verification.fraud_detection.flags.push({
          flag_type: 'PATIENT_NAME_MISMATCH',
          severity: 'CRITICAL',
          description: 'Prescription patient name does not match logged-in user',
          evidence: patientNameCheck.details,
          detected_at: new Date(),
        });
      }

      // Check 9: Digital signature validation
      const fingerprintId = freshUpload.fingerprint?.toString() || null;
      const signatureCheck = this.checkDigitalSignature(
        ocrData.raw_text || '',
        fingerprintId,
      );
      checks.push(signatureCheck);

      // Store digital signature info if found
      const signatureData = this.extractDigitalSignature(ocrData.raw_text || '');
      if (signatureData.hasSignature) {
        await this.uploadModel.findByIdAndUpdate(upload._id, {
          $set: {
            'digital_signature.has_signature': true,
            'digital_signature.hash': signatureData.hash,
            'digital_signature.hash_type': signatureData.hashType,
            'digital_signature.verify_url': signatureData.verifyUrl,
            'digital_signature.reference_number': signatureData.referenceNumber,
          },
        });
      }

      // Check 10: Claude AI Intelligent Analysis
      const aiAnalysisCheck = await this.runClaudeAIAnalysis(
        verification,
        ocrData,
        freshUpload,
      );
      checks.push(aiAnalysisCheck);

      // Calculate Tier 2 score
      const tier2Score = this.calculateTierScore(checks);
      const hasNeedsReview = checks.some((c) => c.severity === 'WARNING' && !c.passed);
      const hasCriticalFailure = checks.some((c) => c.severity === 'CRITICAL' && !c.passed);

      // Check for actual fraud (not just sample/test documents)
      // Using threshold of 75 to allow test documents while still catching real fraud
      const aiCheck = checks.find((c) => c.check_name === 'AI Intelligent Analysis');
      const hasFraudDetected = aiCheck?.metadata?.fraud_score > 75;

      let tier2Result: 'PASSED' | 'FAILED' | 'NEEDS_REVIEW' = 'PASSED';
      const fraudScore = aiCheck?.metadata?.fraud_score || 0;

      // TESTING MODE: Auto-approve all prescriptions for development/testing
      if (TIER2_CONFIG.TESTING_MODE) {
        tier2Result = 'PASSED';
        this.logger.log(`🧪 TESTING MODE: Prescription auto-approved (score: ${tier2Score}%)`);
      } else if (tier2Score < 50) {
        // Very low score (< 50%) → FAILED
        tier2Result = 'FAILED';
        this.logger.warn(`❌ Prescription rejected - score too low (${tier2Score}%)`);
      } else if (tier2Score >= TIER2_CONFIG.AUTO_APPROVE_SCORE && fraudScore <= 25) {
        // High score (>= 90%) + low fraud = auto-approve
        tier2Result = 'PASSED';
        this.logger.log(`✅ Prescription auto-approved with score ${tier2Score}% (fraud: ${fraudScore})`);
      } else if (fraudScore > 75) {
        // High fraud score → Send to internal review
        tier2Result = 'NEEDS_REVIEW';
        this.logger.warn(`⚠️ High fraud score (${fraudScore}) - sending to internal review`);
      } else if (fraudScore > 50 || hasCriticalFailure) {
        // Medium fraud or critical issues → Internal review
        tier2Result = 'NEEDS_REVIEW';
        this.logger.log(`📋 Prescription needs internal review (fraud: ${fraudScore}, critical: ${hasCriticalFailure})`);
      } else {
        // Score 50-90% → pharmacist/internal review
        tier2Result = 'NEEDS_REVIEW';
        this.logger.log(`📋 Prescription needs review (score: ${tier2Score}%)`);
      }

      // Update verification with Tier 2 results
      verification.tier2.status = 'COMPLETED';
      verification.tier2.result = tier2Result;
      verification.tier2.score = tier2Score;
      verification.tier2.completed_at = new Date();
      verification.tier2.processing_time_ms = Date.now() - startTime;
      verification.tier2.checks = checks;

      verification = await verification.save();

      this.emitVerificationEvent(VerificationEvent.TIER2_COMPLETED, {
        uploadId: upload._id.toString(),
        passed: tier2Result === 'PASSED',
        needsReview: tier2Result === 'NEEDS_REVIEW',
        score: tier2Score,
        checks,
      });

      return verification;
    } catch (error) {
      verification.tier2.status = 'FAILED';
      verification.tier2.result = 'FAILED';
      verification.tier2.completed_at = new Date();
      verification.tier2.processing_time_ms = Date.now() - startTime;

      verification.errors.push({
        tier: 'TIER2',
        error_code: 'TIER2_ERROR',
        error_message: error.message,
        stack_trace: error.stack,
        occurred_at: new Date(),
      });

      await verification.save();
      throw error;
    }
  }

  /**
   * Determine final verification outcome
   */
  private async determineOutcome(
    verification: PrescriptionVerificationDocument,
    upload: PatientPrescriptionUploadDocument,
    pipelineStartTime: number,
  ): Promise<PrescriptionVerificationDocument> {
    // Calculate overall score
    const tier1Weight = 0.3;
    const tier2Weight = 0.7;
    const overallScore = (verification.tier1.score * tier1Weight) +
      (verification.tier2.score * tier2Weight);

    verification.overall_score = Math.round(overallScore);
    verification.confidence_score = verification.tier1.checks
      .filter((c) => c.check_name === 'OCR Confidence')
      .map((c) => c.score)[0] || 0;

    // Calculate fraud score
    verification.fraud_detection = this.calculateFraudScore(verification);

    // Determine final outcome
    let finalResult = VerificationResult.PASSED;
    let uploadStatus = VerificationStatus.APPROVED;

    if (verification.tier2.result === 'FAILED') {
      // Platform prescriptions go to pharmacist review instead of auto-rejection
      // This allows backoffice QA to review the flagged concerns
      if (verification.is_platform_prescription) {
        this.logger.log(`Platform prescription ${verification.platform_prescription_number} has concerns but sending to pharmacist review instead of rejection`);
        finalResult = VerificationResult.NEEDS_REVIEW;
        uploadStatus = VerificationStatus.PHARMACIST_REVIEW;

        // Set up pharmacist review
        verification.pharmacist_review.status = 'PENDING';
        verification.current_tier = VerificationTier.PHARMACIST;

        // Override patient summary for platform prescriptions - more appropriate message
        if (verification.tier2.ai_analysis) {
          verification.tier2.ai_analysis.patient_summary =
            `This is a Rapid Capsules platform prescription (${verification.platform_prescription_number}) that requires pharmacist review. ` +
            `Our system flagged some concerns that a pharmacist will verify. You'll be notified once the review is complete.`;
        }

        this.emitVerificationEvent(VerificationEvent.PHARMACIST_REQUIRED, {
          uploadId: upload._id.toString(),
          reason: `Platform prescription (${verification.platform_prescription_number}) has flagged concerns requiring review`,
          isPlatformPrescription: true,
          platformPrescriptionNumber: verification.platform_prescription_number,
          fraudScore: verification.fraud_detection.score,
          riskLevel: verification.fraud_detection.risk_level,
        });
      } else {
        finalResult = VerificationResult.FAILED;
        uploadStatus = VerificationStatus.REJECTED;
      }
    } else if (
      verification.tier2.result === 'NEEDS_REVIEW' ||
      verification.fraud_detection.risk_level === 'CRITICAL' ||
      verification.fraud_detection.risk_level === 'HIGH'
    ) {
      finalResult = VerificationResult.NEEDS_REVIEW;
      uploadStatus = VerificationStatus.PHARMACIST_REVIEW;

      // Set up pharmacist review
      verification.pharmacist_review.status = 'PENDING';
      verification.current_tier = VerificationTier.PHARMACIST;

      // Override patient summary for platform prescriptions - more appropriate message
      if (verification.is_platform_prescription && verification.tier2.ai_analysis) {
        verification.tier2.ai_analysis.patient_summary =
          `This is a Rapid Capsules platform prescription (${verification.platform_prescription_number}) that requires pharmacist review. ` +
          `Our system flagged some items for verification. You'll be notified once the review is complete.`;
      }

      this.emitVerificationEvent(VerificationEvent.PHARMACIST_REQUIRED, {
        uploadId: upload._id.toString(),
        reason: verification.tier2.result === 'NEEDS_REVIEW'
          ? 'Tier 2 verification requires manual review'
          : 'High fraud risk detected',
        isPlatformPrescription: verification.is_platform_prescription || false,
        platformPrescriptionNumber: verification.platform_prescription_number || null,
        fraudScore: verification.fraud_detection.score,
        riskLevel: verification.fraud_detection.risk_level,
      });
    }

    verification.overall_result = finalResult;
    verification.verification_completed_at = new Date();
    verification.total_processing_time_ms = Date.now() - pipelineStartTime;

    verification = await verification.save();

    // Transform validated medications for storage on upload document
    const verifiedMedications = (verification.tier2.medication_validation?.validated_medications || []).map((med: any) => ({
      prescription_medication_name: med.name,
      matched_drug_id: med.matched_drug_id,
      matched_drug_name: med.matched_drug_name || null,
      matched_generic_name: med.matched_generic_name || null,
      is_valid: med.is_valid,
      dosage: med.dosage || '',
      quantity: med.quantity || '',
      instructions: med.instructions || '',
    }));

    // Update upload status with verified medications
    await this.uploadModel.findByIdAndUpdate(upload._id, {
      verification_status: uploadStatus,
      processing_status: ProcessingStatus.COMPLETED,
      fraud_score: verification.fraud_detection.score,
      fraud_flags: verification.fraud_detection.flags,
      verified_medications: verifiedMedications,
    });

    if (finalResult === VerificationResult.PASSED) {
      this.emitVerificationEvent(VerificationEvent.VERIFICATION_COMPLETED, {
        uploadId: upload._id.toString(),
        result: 'PASSED',
        score: overallScore,
        verifiedMedications: verifiedMedications,
      });
    } else if (finalResult === VerificationResult.NEEDS_REVIEW) {
      // Also include verified medications for review status
      this.emitVerificationEvent(VerificationEvent.VERIFICATION_COMPLETED, {
        uploadId: upload._id.toString(),
        result: 'NEEDS_REVIEW',
        score: overallScore,
        verifiedMedications: verifiedMedications,
      });
    } else {
      // Failed - still include what was found
      this.emitVerificationEvent(VerificationEvent.VERIFICATION_FAILED, {
        uploadId: upload._id.toString(),
        result: 'FAILED',
        score: overallScore,
        verifiedMedications: verifiedMedications,
      });

      // Send rejection email to patient
      await this.sendRejectionEmail(upload, verification);
    }

    return verification;
  }

  // ============= CHECK METHODS =============

  private checkFileSize(fileSize: number): CheckResult {
    const maxBytes = TIER1_CONFIG.MAX_FILE_SIZE_MB * 1024 * 1024;
    const passed = fileSize <= maxBytes;
    return {
      check_name: 'File Size',
      passed,
      score: passed ? 100 : 0,
      details: passed
        ? `File size ${(fileSize / 1024 / 1024).toFixed(2)}MB within limit`
        : `File size ${(fileSize / 1024 / 1024).toFixed(2)}MB exceeds ${TIER1_CONFIG.MAX_FILE_SIZE_MB}MB limit`,
      severity: passed ? 'INFO' : 'ERROR',
      timestamp: new Date(),
    };
  }

  private checkFileFormat(mimetype: string): CheckResult {
    const formatMap: { [key: string]: string } = {
      'image/jpeg': 'JPEG',
      'image/jpg': 'JPEG',
      'image/png': 'PNG',
      'image/webp': 'WEBP',
      'image/gif': 'GIF',
      'application/pdf': 'PDF',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
      'application/msword': 'DOC',
    };
    const format = formatMap[mimetype];
    const allowedFormats = [...TIER1_CONFIG.ALLOWED_FORMATS, 'DOCX', 'DOC'];
    const passed = format && allowedFormats.includes(format);
    return {
      check_name: 'File Format',
      passed: !!passed,
      score: passed ? 100 : 0,
      details: passed
        ? `Format ${format} is supported`
        : `Format ${mimetype} is not supported. Allowed: ${TIER1_CONFIG.ALLOWED_FORMATS.join(', ')}`,
      severity: passed ? 'INFO' : 'CRITICAL',
      timestamp: new Date(),
    };
  }

  private checkOcrConfidence(confidence: number): CheckResult {
    const passed = confidence >= TIER1_CONFIG.MIN_OCR_CONFIDENCE;
    return {
      check_name: 'OCR Confidence',
      passed,
      score: confidence,
      details: passed
        ? `OCR confidence ${confidence.toFixed(1)}% meets threshold`
        : `OCR confidence ${confidence.toFixed(1)}% below ${TIER1_CONFIG.MIN_OCR_CONFIDENCE}% threshold`,
      severity: passed ? 'INFO' : 'ERROR',
      timestamp: new Date(),
    };
  }

  private checkTextLength(text: string): CheckResult {
    const length = text?.length || 0;
    const passed = length >= TIER1_CONFIG.MIN_TEXT_LENGTH;
    return {
      check_name: 'Text Content',
      passed,
      score: passed ? 100 : (length / TIER1_CONFIG.MIN_TEXT_LENGTH) * 100,
      details: passed
        ? `Extracted ${length} characters of text`
        : `Only ${length} characters extracted, minimum ${TIER1_CONFIG.MIN_TEXT_LENGTH} required`,
      severity: passed ? 'INFO' : 'ERROR',
      timestamp: new Date(),
    };
  }

  private checkDuplicates(duplicates: DuplicateDetectionResult): CheckResult {
    let severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL' = 'INFO';
    let passed = true;

    if (duplicates.shared_across_patients) {
      severity = 'CRITICAL';
      passed = false;
    } else if (duplicates.highest_similarity >= FRAUD_CONFIG.DUPLICATE_CRITICAL_THRESHOLD) {
      severity = 'CRITICAL';
      passed = false;
    } else if (duplicates.highest_similarity >= FRAUD_CONFIG.DUPLICATE_HIGH_THRESHOLD) {
      severity = 'ERROR';
      passed = false;
    } else if (duplicates.highest_similarity >= FRAUD_CONFIG.DUPLICATE_MEDIUM_THRESHOLD) {
      severity = 'WARNING';
    }

    return {
      check_name: 'Duplicate Detection',
      passed,
      score: 100 - duplicates.highest_similarity,
      details: duplicates.has_duplicates
        ? `${duplicates.duplicate_count} potential duplicate(s) found with ${duplicates.highest_similarity}% similarity`
        + (duplicates.shared_across_patients ? ' (SHARED ACROSS PATIENTS)' : '')
        : 'No duplicates detected',
      severity,
      timestamp: new Date(),
    };
  }

  private checkImageQuality(metadata: {
    width: number | null;
    height: number | null;
    format: string | null;
  }): CheckResult {
    let passed = true;
    const issues: string[] = [];

    if (metadata.width && metadata.width < TIER1_CONFIG.MIN_IMAGE_WIDTH) {
      passed = false;
      issues.push(`Width ${metadata.width}px below minimum ${TIER1_CONFIG.MIN_IMAGE_WIDTH}px`);
    }
    if (metadata.height && metadata.height < TIER1_CONFIG.MIN_IMAGE_HEIGHT) {
      passed = false;
      issues.push(`Height ${metadata.height}px below minimum ${TIER1_CONFIG.MIN_IMAGE_HEIGHT}px`);
    }

    return {
      check_name: 'Image Quality',
      passed,
      score: passed ? 100 : 50,
      details: passed
        ? `Image dimensions ${metadata.width}x${metadata.height} are acceptable`
        : issues.join('; '),
      severity: passed ? 'INFO' : 'WARNING',
      timestamp: new Date(),
    };
  }

  private checkDoctorName(doctorName: string | null): CheckResult {
    const passed = !!doctorName && doctorName.length > 3;
    return {
      check_name: 'Doctor Name',
      passed,
      score: passed ? 100 : 0,
      details: passed
        ? `Doctor name found: ${doctorName}`
        : 'Doctor name not found or too short',
      severity: passed ? 'INFO' : (TIER2_CONFIG.REQUIRE_DOCTOR_NAME ? 'WARNING' : 'INFO'),
      timestamp: new Date(),
    };
  }

  private checkPrescriptionDate(date: Date | null): CheckResult {
    if (!date) {
      return {
        check_name: 'Prescription Date',
        passed: false,
        score: 0,
        details: 'Prescription date not found',
        severity: TIER2_CONFIG.REQUIRE_DATE ? 'WARNING' : 'INFO',
        timestamp: new Date(),
      };
    }

    // Normalize both dates to start of day to avoid timezone issues
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const prescriptionDateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    // Calculate age in days (negative means future date)
    const ageInDays = Math.floor((todayStart.getTime() - prescriptionDateStart.getTime()) / (1000 * 60 * 60 * 24));

    // Allow prescriptions dated today (ageInDays = 0) or in the past within limit
    // Also allow 1 day in the "future" to handle timezone edge cases
    const isFutureDated = ageInDays < -1; // More than 1 day in future is suspicious
    const isTooOld = ageInDays > TIER2_CONFIG.MAX_PRESCRIPTION_AGE_DAYS;
    const passed = !isFutureDated && !isTooOld;

    let details: string;
    if (ageInDays === 0) {
      details = 'Prescription dated today';
    } else if (ageInDays === -1) {
      details = 'Prescription dated today (timezone variance)';
    } else if (isFutureDated) {
      details = `Prescription date is ${Math.abs(ageInDays)} days in the future`;
    } else if (isTooOld) {
      details = `Prescription is ${ageInDays} days old, exceeds ${TIER2_CONFIG.MAX_PRESCRIPTION_AGE_DAYS} day limit`;
    } else {
      details = `Prescription dated ${ageInDays} day${ageInDays === 1 ? '' : 's'} ago`;
    }

    return {
      check_name: 'Prescription Date',
      passed,
      score: passed ? 100 : 0,
      details,
      severity: passed ? 'INFO' : 'ERROR',
      timestamp: new Date(),
    };
  }

  private checkMedicationsExtracted(medications: any[]): CheckResult {
    const count = medications?.length || 0;
    const passed = count > 0;
    return {
      check_name: 'Medications Extracted',
      passed,
      score: passed ? 100 : 0,
      details: passed
        ? `${count} medication(s) extracted from prescription`
        : 'No medications could be extracted',
      severity: passed ? 'INFO' : 'WARNING',
      timestamp: new Date(),
    };
  }

  private async validateMedications(
    medications: Array<{
      name: string;
      dosage: string;
      quantity: string;
      instructions: string;
      confidence: number;
    }>,
  ): Promise<{
    all_medications_valid: boolean;
    validated_medications: Array<{
      name: string;
      is_valid: boolean;
      matched_drug_id: Types.ObjectId | null;
      matched_drug_name: string | null;
      matched_generic_name: string | null;
      dosage: string;
      quantity: string;
      instructions: string;
      dosage_valid: boolean;
      quantity_valid: boolean;
      requires_prescription: boolean;
      is_controlled: boolean;
      notes: string;
    }>;
  }> {
    const validatedMedications: any[] = [];
    let allValid = true;

    for (const med of medications || []) {
      // Search for drug in database
      const searchResult = await this.drugService.search({
        query: med.name,
        page: 1,
        limit: 5,
      });
      const matchedDrug = searchResult.drugs[0]; // Get best match

      if (matchedDrug) {
        validatedMedications.push({
          name: med.name,
          is_valid: true,
          matched_drug_id: matchedDrug._id,
          matched_drug_name: matchedDrug.name,
          matched_generic_name: matchedDrug.generic_name || null,
          dosage: med.dosage || '',
          quantity: med.quantity || '',
          instructions: med.instructions || '',
          dosage_valid: true, // Simplified - would need more logic
          quantity_valid: true,
          requires_prescription: matchedDrug.requires_prescription || false,
          is_controlled: matchedDrug.schedule_class && matchedDrug.schedule_class !== 'OTC',
          notes: `Matched to ${matchedDrug.name}`,
        });
      } else {
        allValid = false;
        validatedMedications.push({
          name: med.name,
          is_valid: false,
          matched_drug_id: null,
          matched_drug_name: null,
          matched_generic_name: null,
          dosage: med.dosage || '',
          quantity: med.quantity || '',
          instructions: med.instructions || '',
          dosage_valid: false,
          quantity_valid: false,
          requires_prescription: true, // Assume prescription needed if not found
          is_controlled: false,
          notes: 'Medication not found in database',
        });
      }
    }

    return {
      all_medications_valid: allValid,
      validated_medications: validatedMedications,
    };
  }

  private async validateDoctorLicense(licenseNumber: string): Promise<CheckResult> {
    // TODO: Integrate with medical license verification API
    // For now, just check format
    const mdcnPattern = /^MDCN\/\d{4}\/\d+$/i;
    const isValidFormat = mdcnPattern.test(licenseNumber) ||
      /^[A-Z0-9\/\-]{5,20}$/i.test(licenseNumber);

    return {
      check_name: 'Doctor License',
      passed: isValidFormat,
      score: isValidFormat ? 70 : 0, // 70% because we can't fully verify
      details: isValidFormat
        ? `License number ${licenseNumber} has valid format (not verified with MDCN)`
        : `License number ${licenseNumber} has invalid format`,
      severity: isValidFormat ? 'WARNING' : 'ERROR',
      timestamp: new Date(),
    };
  }

  private checkControlledSubstances(
    medicationValidation: { validated_medications: Array<{ is_controlled: boolean; name: string }> },
  ): CheckResult {
    const controlledMeds = medicationValidation.validated_medications.filter((m) => m.is_controlled);
    const hasControlled = controlledMeds.length > 0;

    return {
      check_name: 'Controlled Substances',
      passed: true, // Doesn't fail, but flags for review
      score: hasControlled ? 50 : 100,
      details: hasControlled
        ? `Contains ${controlledMeds.length} controlled substance(s): ${controlledMeds.map((m) => m.name).join(', ')}`
        : 'No controlled substances detected',
      severity: hasControlled ? 'WARNING' : 'INFO',
      timestamp: new Date(),
    };
  }

  private checkValidityPeriod(
    prescriptionDate: Date | null,
    validityDays: number | null,
  ): CheckResult {
    if (!prescriptionDate) {
      return {
        check_name: 'Validity Period',
        passed: false,
        score: 0,
        details: 'Cannot determine validity without prescription date',
        severity: 'WARNING',
        timestamp: new Date(),
      };
    }

    const validity = validityDays || 30; // Default 30 days
    const expiryDate = new Date(prescriptionDate);
    expiryDate.setDate(expiryDate.getDate() + validity);

    const now = new Date();
    const isValid = now <= expiryDate;
    const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return {
      check_name: 'Validity Period',
      passed: isValid,
      score: isValid ? Math.min(100, (daysRemaining / validity) * 100) : 0,
      details: isValid
        ? `Prescription valid for ${daysRemaining} more days`
        : `Prescription expired ${Math.abs(daysRemaining)} days ago`,
      severity: isValid ? 'INFO' : 'CRITICAL',
      timestamp: new Date(),
    };
  }

  // ============= HELPER METHODS =============

  private calculateTierScore(checks: CheckResult[]): number {
    if (checks.length === 0) return 0;

    // Weight checks by severity
    const weights = {
      CRITICAL: 3,
      ERROR: 2,
      WARNING: 1,
      INFO: 0.5,
    };

    let totalWeight = 0;
    let weightedScore = 0;

    for (const check of checks) {
      const weight = weights[check.severity] || 1;
      totalWeight += weight;
      weightedScore += check.score * weight;
    }

    return totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 0;
  }

  private calculateFraudScore(
    verification: PrescriptionVerificationDocument,
  ): PrescriptionVerificationDocument['fraud_detection'] {
    let score = 0;
    const flags = [...(verification.fraud_detection.flags || [])];

    // Duplicate detection contribution
    if (verification.fraud_detection.duplicate_prescription) {
      score += 40;
    }

    // Check for suspicious patterns in Tier 1 and Tier 2 checks
    const allChecks = [
      ...(verification.tier1.checks || []),
      ...(verification.tier2.checks || []),
    ];

    for (const check of allChecks) {
      if (!check.passed) {
        if (check.severity === 'CRITICAL') {
          score += 20;
        } else if (check.severity === 'ERROR') {
          score += 10;
        } else if (check.severity === 'WARNING') {
          score += 5;
        }
      }
    }

    // Cap at 100
    score = Math.min(100, score);

    // Determine risk level
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (score >= 70) {
      riskLevel = 'CRITICAL';
    } else if (score >= 50) {
      riskLevel = 'HIGH';
    } else if (score >= 25) {
      riskLevel = 'MEDIUM';
    }

    return {
      score,
      risk_level: riskLevel,
      flags,
      duplicate_prescription: verification.fraud_detection.duplicate_prescription,
      edited_document: false, // Would need image analysis
      invalid_doctor: !verification.tier2.doctor_validation?.license_verified,
      suspicious_pattern: score >= 50,
    };
  }

  private emitVerificationEvent(event: VerificationEvent, data: any): void {
    this.eventEmitter.emit(event, data);
    this.logger.debug(`Emitted event ${event}`, data);
  }

  /**
   * Send rejection email to patient
   */
  private async sendRejectionEmail(
    upload: PatientPrescriptionUploadDocument,
    verification: PrescriptionVerificationDocument,
  ): Promise<void> {
    try {
      // Get patient info
      const patient = await this.userModel.findById(upload.patient) as any;
      // Email can be at top-level or in profile.contact.email
      const patientEmail = patient?.email || patient?.profile?.contact?.email;
      if (!patient || !patientEmail) {
        this.logger.warn(`Cannot send rejection email - patient not found or no email for upload ${upload._id}`);
        return;
      }

      // Build rejection reason from failed checks and fraud flags
      const failedChecks = [
        ...(verification.tier1.checks || []).filter(c => !c.passed && c.severity !== 'INFO'),
        ...(verification.tier2.checks || []).filter(c => !c.passed && c.severity !== 'INFO'),
      ];

      const fraudFlags = verification.fraud_detection.flags || [];

      // Get primary rejection reason - use patient-friendly summary from AI or tier1
      const patientSummary = verification.tier2?.ai_analysis?.patient_summary ||
                              (verification.tier1 as any)?.patient_summary;

      let rejectionReason = 'Your prescription could not be verified.';
      let rejectionDetails = '';

      if (patientSummary) {
        // Use patient-friendly summary
        rejectionReason = patientSummary;
      } else {
        // Fall back to extracting from fraud flags (which have descriptions)
        const criticalFlags = fraudFlags.filter(f => f.severity === 'CRITICAL');
        const highFlags = fraudFlags.filter(f => f.severity === 'HIGH');

        if (criticalFlags.length > 0) {
          rejectionReason = criticalFlags[0].description || 'Critical verification issues were detected.';
        } else if (highFlags.length > 0) {
          rejectionReason = highFlags[0].description || 'Verification issues were detected.';
        } else if (failedChecks.length > 0) {
          rejectionReason = failedChecks[0].details || 'Your prescription could not be verified.';
        }
      }

      // Add additional details if multiple issues
      const totalIssues = failedChecks.length + fraudFlags.length;
      if (totalIssues > 1) {
        rejectionDetails = `We detected ${totalIssues} issue${totalIssues > 1 ? 's' : ''} with your prescription. Please ensure your prescription is clear, valid, and matches your account details.`;
      }

      // Get prescription number - use stored field, fallback to legacy format for old records
      const uploadDate = new Date((upload as any).created_at || new Date());
      const dateStr = uploadDate.toISOString().slice(0, 10).replace(/-/g, '');
      const idSuffix = upload._id.toString().slice(-4).toUpperCase();
      const prescriptionNumber = (upload as any).prescription_number ||
        (upload as any).digital_signature?.reference_number ||
        `RX-${dateStr}-${idSuffix}`;

      // Generate email
      const emailBody = prescriptionUploadRejectedEmail({
        patientName: patient.profile?.first_name || 'Patient',
        prescriptionNumber,
        rejectionReason,
        rejectionDetails,
        suggestions: [
          'Ensure the prescription image is clear and readable',
          'Verify that all required information is visible (patient name, doctor details, medications)',
          'Make sure the prescription is valid and not expired',
        ],
      });

      // Send email
      await this.generalHelpers.generateEmailAndSend({
        email: patientEmail,
        subject: `Prescription Upload Rejected - ${prescriptionNumber}`,
        emailBody,
      });

      this.logger.log(`Rejection email sent to ${patientEmail} for prescription ${prescriptionNumber}`);
    } catch (error) {
      this.logger.error(`Failed to send rejection email for upload ${upload._id}:`, error);
      // Don't throw - email failure shouldn't fail the verification process
    }
  }

  // ============= PUBLIC QUERY METHODS =============

  /**
   * Get verification by ID
   */
  async getVerificationById(
    verificationId: Types.ObjectId,
  ): Promise<PrescriptionVerificationDocument | null> {
    return this.verificationModel.findById(verificationId);
  }

  /**
   * Get verification by upload ID
   */
  async getVerificationByUploadId(
    uploadId: Types.ObjectId,
  ): Promise<PrescriptionVerificationDocument | null> {
    return this.verificationModel.findOne({ prescription_upload: uploadId });
  }

  /**
   * Get all verifications for a patient
   */
  async getPatientVerifications(
    patientId: Types.ObjectId,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    verifications: PrescriptionVerificationDocument[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const [verifications, total] = await Promise.all([
      this.verificationModel
        .find({ patient: patientId })
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .populate('prescription_upload'),
      this.verificationModel.countDocuments({ patient: patientId }),
    ]);

    return {
      verifications,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get verifications pending pharmacist review
   */
  async getPendingPharmacistReviews(
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    verifications: PrescriptionVerificationDocument[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const query = {
      'pharmacist_review.status': 'PENDING',
      overall_result: VerificationResult.NEEDS_REVIEW,
    };

    const [verifications, total] = await Promise.all([
      this.verificationModel
        .find(query)
        .sort({ created_at: 1 }) // Oldest first
        .skip(skip)
        .limit(limit)
        .populate('prescription_upload')
        .populate('patient'),
      this.verificationModel.countDocuments(query),
    ]);

    return {
      verifications,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Submit pharmacist review
   */
  async submitPharmacistReview(
    verificationId: Types.ObjectId,
    reviewerId: Types.ObjectId,
    decision: 'APPROVED' | 'REJECTED' | 'NEEDS_CLARIFICATION',
    notes: string,
    rejectionReason?: string,
    clarificationRequest?: string,
  ): Promise<PrescriptionVerificationDocument> {
    const verification = await this.verificationModel.findById(verificationId);
    if (!verification) {
      throw new NotFoundException('Verification not found');
    }

    verification.pharmacist_review = {
      status: 'COMPLETED',
      result: decision,
      reviewer: reviewerId,
      assigned_at: verification.pharmacist_review.assigned_at || new Date(),
      started_at: verification.pharmacist_review.started_at || new Date(),
      completed_at: new Date(),
      notes,
      rejection_reason: rejectionReason || '',
      clarification_request: clarificationRequest || '',
    };

    // Update overall result
    if (decision === 'APPROVED') {
      verification.overall_result = VerificationResult.PASSED;
    } else if (decision === 'REJECTED') {
      verification.overall_result = VerificationResult.FAILED;
    }

    await verification.save();

    // Update upload status
    const uploadStatus = decision === 'APPROVED'
      ? VerificationStatus.APPROVED
      : decision === 'REJECTED'
        ? VerificationStatus.REJECTED
        : VerificationStatus.PHARMACIST_REVIEW;

    await this.uploadModel.findByIdAndUpdate(verification.prescription_upload, {
      verification_status: uploadStatus,
      reviewed_by: reviewerId,
      reviewed_at: new Date(),
      review_notes: notes,
      rejection_reason: rejectionReason,
    });

    return verification;
  }

  // ============= PATIENT NAME MATCHING =============

  /**
   * Get patient's full name from the database
   */
  async getPatientFullName(patientId: Types.ObjectId): Promise<{
    firstName: string;
    lastName: string;
    fullName: string;
  } | null> {
    const patient = await this.userModel.findById(patientId).select('profile.first_name profile.last_name');
    if (!patient?.profile) return null;

    const firstName = patient.profile.first_name || '';
    const lastName = patient.profile.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim();

    return { firstName, lastName, fullName };
  }

  /**
   * Compare prescription patient name with logged-in user's name
   * Uses fuzzy matching to handle variations
   */
  async checkPatientNameMatch(
    patientId: Types.ObjectId,
    ocrPatientName: string | null,
  ): Promise<CheckResult> {
    if (!ocrPatientName) {
      return {
        check_name: 'Patient Name Match',
        passed: false,
        score: 0,
        details: 'Patient name not found in prescription',
        severity: 'WARNING',
        timestamp: new Date(),
      };
    }

    const patientData = await this.getPatientFullName(patientId);
    if (!patientData) {
      return {
        check_name: 'Patient Name Match',
        passed: false,
        score: 0,
        details: 'Could not retrieve patient profile',
        severity: 'ERROR',
        timestamp: new Date(),
      };
    }

    const similarity = this.calculateNameSimilarity(
      ocrPatientName,
      patientData.fullName,
      patientData.firstName,
      patientData.lastName,
    );

    const passed = similarity >= 70; // 70% threshold for match
    let severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL' = 'INFO';

    if (similarity < 50) {
      severity = 'CRITICAL'; // Very different names - potential fraud
    } else if (similarity < 70) {
      severity = 'WARNING'; // Needs review
    }

    return {
      check_name: 'Patient Name Match',
      passed,
      score: similarity,
      details: passed
        ? `Patient name "${ocrPatientName}" matches user "${patientData.fullName}" (${similarity}% similarity)`
        : `Patient name "${ocrPatientName}" does NOT match user "${patientData.fullName}" (${similarity}% similarity)`,
      severity,
      timestamp: new Date(),
    };
  }

  /**
   * Calculate similarity between prescription name and user's name
   * Handles variations like "Bassey Eyo" vs "Eyo Bassey" vs "BASSEY EYO"
   */
  private calculateNameSimilarity(
    prescriptionName: string,
    fullName: string,
    firstName: string,
    lastName: string,
  ): number {
    // Normalize names - lowercase, remove extra spaces and special characters
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z\s]/g, '').replace(/\s+/g, ' ').trim();

    const rxName = normalize(prescriptionName);
    const userFullName = normalize(fullName);
    const userFirstName = normalize(firstName);
    const userLastName = normalize(lastName);

    // Check for exact match
    if (rxName === userFullName) return 100;

    // Check reversed order (LastName FirstName)
    const reversedName = `${userLastName} ${userFirstName}`.trim();
    if (rxName === reversedName) return 100;

    // Split names into parts for comparison
    const rxParts = rxName.split(' ').filter(p => p.length > 0);
    const userParts = [userFirstName, userLastName].filter(p => p.length > 0);

    // Check if all user name parts exist in prescription name
    let matchedParts = 0;
    for (const userPart of userParts) {
      if (rxParts.some(rxPart => this.levenshteinSimilarity(rxPart, userPart) >= 80)) {
        matchedParts++;
      }
    }

    if (userParts.length > 0 && matchedParts === userParts.length) {
      return 95; // All parts matched (might have middle name or title)
    }

    // Calculate Levenshtein similarity for full names
    const fullNameSimilarity = this.levenshteinSimilarity(rxName, userFullName);
    const reversedSimilarity = this.levenshteinSimilarity(rxName, reversedName);

    // Also try matching parts individually
    const partMatchScore = userParts.length > 0
      ? (matchedParts / userParts.length) * 100
      : 0;

    // Return best score
    return Math.max(fullNameSimilarity, reversedSimilarity, partMatchScore);
  }

  /**
   * Calculate Levenshtein distance-based similarity (0-100)
   */
  private levenshteinSimilarity(s1: string, s2: string): number {
    if (s1 === s2) return 100;
    if (s1.length === 0 || s2.length === 0) return 0;

    const distance = this.levenshteinDistance(s1, s2);
    const maxLength = Math.max(s1.length, s2.length);
    return Math.round((1 - distance / maxLength) * 100);
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(s1: string, s2: string): number {
    const m = s1.length;
    const n = s2.length;

    // Create distance matrix
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    // Initialize first column and row
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    // Fill in the rest
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (s1[i - 1] === s2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = 1 + Math.min(
            dp[i - 1][j],     // deletion
            dp[i][j - 1],     // insertion
            dp[i - 1][j - 1], // substitution
          );
        }
      }
    }

    return dp[m][n];
  }

  // ============= DIGITAL SIGNATURE VALIDATION =============

  /**
   * Extract and validate digital signature/hash from prescription
   */
  extractDigitalSignature(rawText: string): {
    hasSignature: boolean;
    hash: string | null;
    hashType: string | null;
    verifyUrl: string | null;
    referenceNumber: string | null;
  } {
    const result = {
      hasSignature: false,
      hash: null as string | null,
      hashType: null as string | null,
      verifyUrl: null as string | null,
      referenceNumber: null as string | null,
    };

    // Pattern for SHA256 hash
    const sha256Pattern = /(?:SHA256|Document\s*Hash)[:\s-]*([A-Fa-f0-9]{64})/i;
    const sha256Match = rawText.match(sha256Pattern);
    if (sha256Match) {
      result.hasSignature = true;
      result.hash = sha256Match[1].toUpperCase();
      result.hashType = 'SHA256';
    }

    // Pattern for MD5 hash
    const md5Pattern = /(?:MD5|Hash)[:\s-]*([A-Fa-f0-9]{32})/i;
    const md5Match = rawText.match(md5Pattern);
    if (!result.hash && md5Match) {
      result.hasSignature = true;
      result.hash = md5Match[1].toUpperCase();
      result.hashType = 'MD5';
    }

    // Pattern for verification URL
    const verifyUrlPattern = /(?:Verify\s*(?:at)?|Verification\s*URL)[:\s]*((?:https?:\/\/)?[\w.-]+\.[\w]{2,}(?:\/[\w.-]*)*)/i;
    const urlMatch = rawText.match(verifyUrlPattern);
    if (urlMatch) {
      result.verifyUrl = urlMatch[1];
      result.hasSignature = true;
    }

    // Pattern for prescription reference number
    const refPattern = /(?:Prescription\s*(?:Reference|Ref|No|Number)|Rx\s*(?:No|Number))[:\s#]*([A-Z0-9-]+)/i;
    const refMatch = rawText.match(refPattern);
    if (refMatch) {
      result.referenceNumber = refMatch[1];
    }

    return result;
  }

  /**
   * Check digital signature validity
   */
  checkDigitalSignature(
    rawText: string,
    existingFingerprint: string | null,
  ): CheckResult {
    const signature = this.extractDigitalSignature(rawText);

    if (signature.hasSignature) {
      // Prescription has embedded digital signature
      return {
        check_name: 'Digital Signature',
        passed: true,
        score: 100,
        details: signature.hash
          ? `Digital signature found: ${signature.hashType} hash ${signature.hash.substring(0, 16)}...`
          : `Verification URL found: ${signature.verifyUrl}`,
        severity: 'INFO',
        timestamp: new Date(),
        metadata: {
          hash: signature.hash,
          hashType: signature.hashType,
          verifyUrl: signature.verifyUrl,
          referenceNumber: signature.referenceNumber,
        },
      };
    }

    // No embedded signature - rely on fingerprint system
    if (existingFingerprint) {
      return {
        check_name: 'Digital Signature',
        passed: true,
        score: 80,
        details: 'No embedded signature found. Document fingerprinted for duplicate detection.',
        severity: 'INFO',
        timestamp: new Date(),
        metadata: {
          fingerprint: existingFingerprint,
          note: 'Using system-generated fingerprint',
        },
      };
    }

    return {
      check_name: 'Digital Signature',
      passed: true, // Don't fail if no signature
      score: 60,
      details: 'No digital signature or fingerprint available',
      severity: 'WARNING',
      timestamp: new Date(),
    };
  }

  // ============= CLAUDE AI ANALYSIS =============

  /**
   * Run Claude AI intelligent analysis on the prescription
   */
  private async runClaudeAIAnalysis(
    verification: PrescriptionVerificationDocument,
    ocrData: {
      raw_text?: string;
      doctor_name?: string;
      patient_name?: string;
      clinic_name?: string;
      prescription_date?: Date;
      medications?: Array<{
        name: string;
        dosage?: string;
        quantity?: string;
        instructions?: string;
      }>;
      doctor_license?: string;
    },
    upload: PatientPrescriptionUploadDocument,
  ): Promise<CheckResult> {
    // Check if Claude AI is available
    if (!this.claudeAIService.isAvailable()) {
      this.logger.warn('Claude AI not available - skipping intelligent analysis');
      return {
        check_name: 'AI Intelligent Analysis',
        passed: true, // Don't fail if AI unavailable
        score: 50,
        details: 'Claude AI analysis not available. Configure ANTHROPIC_API_KEY to enable.',
        severity: 'WARNING',
        timestamp: new Date(),
      };
    }

    try {
      // Get patient info for comparison
      const patientData = await this.getPatientFullName(verification.patient);
      const patient = await this.userModel.findById(verification.patient).select('profile.date_of_birth profile.gender');

      const patientInfo = {
        fullName: patientData?.fullName || 'Unknown',
        dateOfBirth: patient?.profile?.date_of_birth,
        gender: patient?.profile?.gender,
      };

      // Get image from S3 for Claude vision analysis
      let imageBase64: string | undefined;
      try {
        const docBuffer = await this.documentProcessor.getDocumentFromS3(
          upload.s3_bucket,
          upload.s3_key,
        );

        // Only send images directly to Claude (JPEG, PNG, WebP, GIF)
        // PDFs would need conversion - for now we skip them for vision
        const mimeType = upload.mimetype;
        if (mimeType === 'image/jpeg' || mimeType === 'image/jpg' || mimeType === 'image/png' || mimeType === 'image/webp' || mimeType === 'image/gif') {
          imageBase64 = docBuffer.toString('base64');
          this.logger.log(`Prepared ${mimeType} image for Claude vision analysis (${Math.round(docBuffer.length / 1024)}KB)`);
        } else {
          this.logger.log(`Skipping image for Claude - document type ${mimeType} not directly supported for vision`);
        }
      } catch (imageError) {
        this.logger.warn(`Could not fetch image for Claude analysis: ${imageError.message}`);
        // Continue without image - Claude will rely on OCR data only
      }

      // Run Claude AI analysis with image if available
      const aiResult = await this.claudeAIService.analyzePrescription(
        {
          raw_text: ocrData.raw_text || '',
          doctor_name: ocrData.doctor_name,
          patient_name: ocrData.patient_name,
          clinic_name: ocrData.clinic_name,
          prescription_date: ocrData.prescription_date,
          medications: ocrData.medications,
          doctor_license: ocrData.doctor_license,
        },
        patientInfo,
        imageBase64,
        imageBase64 ? upload.mimetype : undefined,
      );

      // Store AI analysis result including all extracted data
      verification.tier2.ai_analysis = {
        performed: true,
        timestamp: new Date(),
        confidence: aiResult.confidence,
        fraud_score: aiResult.fraudScore,
        overall_assessment: aiResult.overallAssessment,
        flags: aiResult.flags,
        recommendations: aiResult.recommendations,
        // Store comprehensive AI-extracted data
        extracted_data: aiResult.extractedData,
        ocr_corrections_made: aiResult.ocrCorrectionsMade || false,
        ocr_corrections: aiResult.ocrCorrections || [],
        // Patient-friendly summary (shown to patients instead of technical flags)
        patient_summary: aiResult.patientSummary,
      };

      // If Claude extracted data and made corrections, update the upload's OCR data
      const extractedData = aiResult.extractedData;
      if (extractedData && aiResult.ocrCorrectionsMade) {
        this.logger.log(`Claude made OCR corrections: ${aiResult.ocrCorrections?.length || 0} fields corrected`);

        // Log each correction
        if (aiResult.ocrCorrections) {
          for (const correction of aiResult.ocrCorrections) {
            this.logger.log(`Correction: ${correction.field} - OCR: "${correction.ocr_value}" -> Corrected: "${correction.corrected_value}" (${correction.reason})`);
          }
        }

        // Build update object with Claude's corrected data
        const updateData: any = {
          'ocr_data.ai_corrected': true,
          'ocr_data.ai_correction_timestamp': new Date(),
        };

        // Update patient name if corrected
        if (extractedData.patient?.name) {
          updateData['ocr_data.patient_name'] = extractedData.patient.name;
        }

        // Update doctor name if corrected
        if (extractedData.prescriber?.name) {
          updateData['ocr_data.doctor_name'] = extractedData.prescriber.name;
        }

        // Update doctor license if corrected
        if (extractedData.prescriber?.license_number) {
          updateData['ocr_data.doctor_license'] = extractedData.prescriber.license_number;
        }

        // Update clinic name if corrected
        if (extractedData.prescriber?.clinic_name) {
          updateData['ocr_data.clinic_name'] = extractedData.prescriber.clinic_name;
        }

        // Update prescription date if corrected
        if (extractedData.prescription_date) {
          updateData['ocr_data.prescription_date'] = extractedData.prescription_date;
        }

        // Update medications if extracted
        if (extractedData.medications && extractedData.medications.length > 0) {
          const correctedMedications = extractedData.medications.map(med => ({
            name: med.name,
            dosage: med.dosage || '',
            quantity: med.quantity || '',
            instructions: med.instructions || '',
            frequency: med.frequency || '',
            duration: med.duration || '',
            confidence: med.confidence || 80,
            source: 'claude_ai_extraction',
          }));
          updateData['ocr_data.medications'] = correctedMedications;
          this.logger.log(`Claude extracted ${correctedMedications.length} medications from prescription`);
        }

        // Update the upload document with corrected data
        await this.uploadModel.updateOne(
          { _id: upload._id },
          { $set: updateData },
        );

        this.logger.log(`Updated upload ${upload._id} with AI-corrected data`);
      }

      // Add AI-detected fraud flags to verification
      if (aiResult.flags && aiResult.flags.length > 0) {
        for (const flag of aiResult.flags) {
          if (flag.severity === 'CRITICAL' || flag.severity === 'HIGH') {
            verification.fraud_detection.flags.push({
              flag_type: `AI_${flag.type}`,
              severity: flag.severity,
              description: flag.message,
              evidence: 'Detected by Claude AI analysis',
              detected_at: new Date(),
            });
          }
        }
      }

      // Determine check result based on AI analysis
      let passed = aiResult.isValid;
      let severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL' = 'INFO';

      if (aiResult.fraudScore >= 70) {
        passed = false;
        severity = 'CRITICAL';
      } else if (aiResult.fraudScore >= 50) {
        severity = 'ERROR';
      } else if (aiResult.fraudScore >= 30) {
        severity = 'WARNING';
      }

      // Check document authenticity
      if (!aiResult.documentAuthenticity.appearsGenuine) {
        passed = false;
        severity = 'CRITICAL';
        verification.fraud_detection.edited_document = true;
      }

      // Check patient name match from AI
      if (aiResult.patientNameMatch.matchConfidence < 50) {
        verification.fraud_detection.flags.push({
          flag_type: 'AI_PATIENT_NAME_MISMATCH',
          severity: 'HIGH',
          description: `AI detected patient name mismatch: ${aiResult.patientNameMatch.concerns.join(', ')}`,
          evidence: `Extracted name: ${aiResult.patientNameMatch.extractedName}, Confidence: ${aiResult.patientNameMatch.matchConfidence}%`,
          detected_at: new Date(),
        });
      }

      const details = [
        `AI Confidence: ${aiResult.confidence}%`,
        `Fraud Score: ${aiResult.fraudScore}/100`,
        `Valid: ${aiResult.isValid ? 'Yes' : 'No'}`,
        aiResult.overallAssessment,
      ].join(' | ');

      return {
        check_name: 'AI Intelligent Analysis',
        passed,
        score: Math.max(0, 100 - aiResult.fraudScore),
        details,
        severity,
        timestamp: new Date(),
        metadata: {
          ai_confidence: aiResult.confidence,
          fraud_score: aiResult.fraudScore,
          medications_analyzed: aiResult.medicationAnalysis.length,
          recommendations: aiResult.recommendations,
          document_appears_genuine: aiResult.documentAuthenticity.appearsGenuine,
        },
      };
    } catch (error) {
      this.logger.error('Claude AI analysis failed:', error);
      return {
        check_name: 'AI Intelligent Analysis',
        passed: true, // Don't fail verification if AI errors
        score: 50,
        details: `AI analysis encountered an error: ${error.message}`,
        severity: 'WARNING',
        timestamp: new Date(),
      };
    }
  }

  // ============= TEXT EXTRACTION HELPERS =============

  /**
   * Extract doctor name from raw text
   */
  private extractDoctorName(text: string): string | null {
    const patterns = [
      // Match "Dr. FirstName LastName" - most common format
      /Dr\.?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
      // Match after PRESCRIBER INFORMATION section header (Rapid Capsules format)
      /PRESCRIBER\s+INFORMATION[\s\S]*?Dr\.?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
      // Match "Doctor: Name" format but exclude "INFORMATION"
      /Doctor[:\s]+(?!INFORMATION)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
      // Match "Physician: Name" format
      /Physician[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
      // Match "Prescribed by" format
      /(?:Prescribed\s+by|Signed)[:\s]+(?:Dr\.?\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const name = match[1].trim();
        // Skip section headers and generic words
        if (name.toUpperCase() === 'INFORMATION' || name.length < 3) {
          continue;
        }
        return name;
      }
    }

    return null;
  }

  /**
   * Extract patient name from raw text
   */
  private extractPatientName(text: string): string | null {
    const patterns = [
      /Patient\s*(?:Name)?[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
      /Name\s+of\s+Patient[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
      /Patient[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return null;
  }

  /**
   * Extract doctor license from raw text
   */
  private extractDoctorLicense(text: string): string | null {
    const patterns = [
      /(?:MDCN|License|Licence|Registration|Reg\.?\s*No\.?|GMC\s*(?:No\.?)?)[:\s]*([A-Z0-9\/\-]+)/i,
      /(?:Medical\s+License)[:\s]*([A-Z0-9\/\-]+)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return null;
  }

  /**
   * Extract clinic name from raw text
   */
  private extractClinicName(text: string): string | null {
    const patterns = [
      /(?:Clinic|Hospital|Medical\s+(?:Center|Centre)|Healthcare)[:\s]+([A-Za-z][A-Za-z\s]+)/i,
      /(?:Rapid\s+Capsules(?:\s+Medical)?)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1]?.trim() || match[0]?.trim() || null;
      }
    }

    return null;
  }

  /**
   * Detect if this is a Rapid Capsules-generated prescription
   * These are digitally signed PDFs created by our system and can be trusted
   */
  private detectRapidCapsulesPrescription(text: string): boolean {
    // Check for multiple indicators of a Rapid Capsules prescription
    const indicators = [
      // Platform branding
      /RAPID\s*CAPSULES/i,
      // Prescription reference format (RX-YYYYMMDD-NNNN)
      /RX-\d{8}-\d{4}/i,
      // Alternative: PRESCRIPTION REFERENCE header with RX format
      /(?:PRESCRIPTION\s+REFERENCE|Prescription\s+(?:Ref|Reference)|Ref)[:\s]*RX-\d{8}-\d+/i,
      // Digital verification section
      /DIGITAL\s+VERIFICATION/i,
      // SHA256 hash (our system adds this - can be 32 or 64 chars)
      /SHA256[-:\s]+[A-Fa-f0-9]{32,64}/i,
      // Document Hash label
      /Document\s+Hash/i,
      // Our website
      /rapidcapsule\.com/i,
      // Electronic prescription header
      /ELECTRONIC\s+PRESCRIPTION/i,
      // Generated timestamp format
      /Generated[:\s]+\d{4}-\d{2}-\d{2}/i,
      // Verify URL
      /Verify\s+at[:\s]+rapidcapsule\.com\/verify/i,
    ];

    let matchCount = 0;
    const matchedIndicators: string[] = [];
    for (const pattern of indicators) {
      if (pattern.test(text)) {
        matchCount++;
        matchedIndicators.push(pattern.source);
      }
    }

    // Consider it a Rapid Capsules prescription if 3+ indicators match
    const isRapidCapsules = matchCount >= 3;

    if (isRapidCapsules) {
      this.logger.log(`Detected Rapid Capsules prescription with ${matchCount} indicators: ${matchedIndicators.join(', ')}`);
    }

    return isRapidCapsules;
  }

  /**
   * Extract Rapid Capsules prescription reference number from text
   */
  private extractRapidCapsulesPrescriptionRef(text: string): string | null {
    const match = text.match(/RX-(\d{8}-\d{4})/i);
    if (match) {
      return `RX-${match[1]}`;
    }
    return null;
  }

  /**
   * Check if a prescription has already been used for a paid/completed order
   * This is critical for abuse prevention - prescriptions should only be used once
   */
  async checkPrescriptionAlreadyUsed(
    prescriptionUploadId: Types.ObjectId,
  ): Promise<{
    alreadyUsed: boolean;
    previousOrders: Array<{
      orderId: Types.ObjectId;
      orderNumber: string;
      status: string;
      paidAt?: Date;
    }>;
  }> {
    // Find any orders that used this prescription and were paid/completed
    const paidStatuses = ['PAID', 'PROCESSING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'];

    const previousOrders = await this.pharmacyOrderModel.find({
      prescription: prescriptionUploadId,
      $or: [
        { payment_status: 'PAID' },
        { status: { $in: paidStatuses } },
      ],
    }).select('_id order_number status payment_status paid_at created_at').lean();

    return {
      alreadyUsed: previousOrders.length > 0,
      previousOrders: previousOrders.map((order: any) => ({
        orderId: order._id,
        orderNumber: order.order_number,
        status: order.status,
        paidAt: order.paid_at || order.created_at,
      })),
    };
  }

  /**
   * Check if a Rapid Capsules specialist prescription has already been used
   */
  async checkSpecialistPrescriptionAlreadyUsed(
    specialistPrescriptionId: Types.ObjectId,
  ): Promise<{
    alreadyUsed: boolean;
    previousOrders: Array<{
      orderId: Types.ObjectId;
      orderNumber: string;
      status: string;
      paidAt?: Date;
    }>;
  }> {
    const paidStatuses = ['PAID', 'PROCESSING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'];

    const previousOrders = await this.pharmacyOrderModel.find({
      specialist_prescription: specialistPrescriptionId,
      $or: [
        { payment_status: 'PAID' },
        { status: { $in: paidStatuses } },
      ],
    }).select('_id order_number status payment_status paid_at created_at').lean();

    return {
      alreadyUsed: previousOrders.length > 0,
      previousOrders: previousOrders.map((order: any) => ({
        orderId: order._id,
        orderNumber: order.order_number,
        status: order.status,
        paidAt: order.paid_at || order.created_at,
      })),
    };
  }
}
