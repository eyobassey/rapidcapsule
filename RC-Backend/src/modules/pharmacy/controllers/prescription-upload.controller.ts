import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiConsumes,
  ApiBody,
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import {
  PatientPrescriptionUpload,
  PatientPrescriptionUploadDocument,
  UploadSource,
  ProcessingStatus,
  VerificationStatus,
} from '../entities/patient-prescription-upload.entity';
import {
  PrescriptionVerification,
  PrescriptionVerificationDocument,
} from '../entities/prescription-verification.entity';
import {
  PharmacyOrder,
  PharmacyOrderDocument,
} from '../entities/pharmacy-order.entity';
import { Drug, DrugDocument } from '../entities/drug.entity';
import {
  SpecialistPrescription,
  SpecialistPrescriptionDocument,
} from '../../prescriptions/entities/specialist-prescription.entity';
import { PrescriptionVerificationService } from '../services/prescription-verification.service';
import { DocumentProcessorService, ALLOWED_PRESCRIPTION_MIMES } from '../services/document-processor.service';
import { PrescriptionNumberHelper } from '../../../common/helpers/prescription-number.helper';

/**
 * DTO for prescription upload
 */
class UploadPrescriptionDto {
  @ApiPropertyOptional({
    description: 'Source of the prescription upload',
    enum: UploadSource,
    example: UploadSource.FILE_UPLOAD,
  })
  uploadSource?: UploadSource;
}

/**
 * DTO for pharmacist review submission
 */
class SubmitReviewDto {
  @ApiProperty({
    description: 'Pharmacist review decision for the prescription',
    enum: ['APPROVED', 'REJECTED', 'NEEDS_CLARIFICATION'],
    example: 'APPROVED',
  })
  decision: 'APPROVED' | 'REJECTED' | 'NEEDS_CLARIFICATION';

  @ApiProperty({
    description: 'Pharmacist notes explaining the review decision',
    example: 'Prescription verified against prescriber database. All medications and dosages are valid.',
  })
  notes: string;

  @ApiPropertyOptional({
    description: 'Reason for rejection, required when decision is REJECTED',
    example: 'Prescription appears to be expired (issued over 6 months ago)',
  })
  rejectionReason?: string;

  @ApiPropertyOptional({
    description: 'Information requested from the patient, required when decision is NEEDS_CLARIFICATION',
    example: 'Please provide a clearer image of the prescriber signature and stamp',
  })
  clarificationRequest?: string;
}

@ApiTags('Pharmacy - Prescriptions')
@ApiBearerAuth('JWT-auth')
@Controller('pharmacy/prescriptions')
@UseGuards(JwtAuthGuard)
export class PrescriptionUploadController {
  private s3: AWS.S3;

  constructor(
    @InjectModel(PatientPrescriptionUpload.name)
    private uploadModel: Model<PatientPrescriptionUploadDocument>,
    @InjectModel(PrescriptionVerification.name)
    private verificationModel: Model<PrescriptionVerificationDocument>,
    @InjectModel(PharmacyOrder.name)
    private orderModel: Model<PharmacyOrderDocument>,
    @InjectModel(Drug.name)
    private drugModel: Model<DrugDocument>,
    @InjectModel(SpecialistPrescription.name)
    private specialistPrescriptionModel: Model<SpecialistPrescriptionDocument>,
    private readonly verificationService: PrescriptionVerificationService,
    private readonly documentProcessor: DocumentProcessorService,
    private readonly prescriptionNumberHelper: PrescriptionNumberHelper,
  ) {
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY,
      secretAccessKey: process.env.AWS_ACCESS_SECRET_KEY,
      region: process.env.AWS_REGION || 'us-east-2',
    });
  }

  /**
   * Upload a new prescription image
   */
  @ApiOperation({
    summary: 'Upload prescription image',
    description:
      'Upload a prescription image or document for automated verification. ' +
      'Supports JPEG, PNG, WebP, GIF, PDF, DOCX, and DOC formats (max 10 MB). ' +
      'The file is stored in S3 and a multi-tier verification pipeline is triggered asynchronously.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Prescription file and optional metadata',
    schema: {
      type: 'object',
      required: ['prescription'],
      properties: {
        prescription: {
          type: 'string',
          format: 'binary',
          description: 'Prescription image or document file',
        },
        uploadSource: {
          type: 'string',
          enum: Object.values(UploadSource),
          description: 'Source of the upload (defaults to FILE_UPLOAD)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Prescription uploaded successfully and verification pipeline started',
    schema: {
      example: {
        message: 'Prescription uploaded successfully. Verification in progress.',
        result: {
          uploadId: '665a1b2c3d4e5f6a7b8c9d0e',
          prescriptionNumber: 'RX-20260227-0001',
          status: 'PENDING',
          processingStatus: 'PENDING',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid file type, missing file, or upload failure' })
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('prescription', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
      fileFilter: (req, file, cb) => {
        if (ALLOWED_PRESCRIPTION_MIMES.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Invalid file type. Allowed: JPEG, PNG, WebP, GIF, PDF, DOCX, DOC',
            ),
            false,
          );
        }
      },
    }),
  )
  async uploadPrescription(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadPrescriptionDto,
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // JWT payload uses 'sub' for user ID, not '_id'
    const patientId = new Types.ObjectId(req.user.sub || req.user.sub || req.user._id);
    const bucket = process.env.AWS_BUCKET_NAME || 'rapidcapsule';
    const key = `prescriptions/${patientId}/${uuidv4()}-${file.originalname}`;

    try {
      // Upload to S3
      const uploadResult = await this.s3
        .upload({
          Bucket: bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        })
        .promise();

      // Generate unique prescription number using shared counter
      const prescriptionNumber = await this.prescriptionNumberHelper.generatePrescriptionNumber();

      // Create upload record
      const upload = new this.uploadModel({
        patient: patientId,
        prescription_number: prescriptionNumber,
        original_filename: file.originalname,
        mimetype: file.mimetype,
        file_size: file.size,
        s3_key: key,
        s3_bucket: bucket,
        s3_url: uploadResult.Location,
        upload_source: dto.uploadSource || UploadSource.FILE_UPLOAD,
        processing_status: ProcessingStatus.PENDING,
        verification_status: VerificationStatus.PENDING,
        fraud_score: 0,
        fraud_flags: [],
        usage_count: 0,
        used_in_orders: [],
        is_deleted: false,
      });

      await upload.save();

      // Start verification pipeline asynchronously
      this.verificationService
        .startVerificationPipeline(upload._id, patientId)
        .catch((error) => {
          console.error('Verification pipeline error:', error);
        });

      return {
        message: 'Prescription uploaded successfully. Verification in progress.',
        result: {
          uploadId: upload._id.toString(),
          prescriptionNumber: upload.prescription_number,
          status: upload.verification_status,
          processingStatus: upload.processing_status,
        },
      };
    } catch (error) {
      throw new BadRequestException(`Upload failed: ${error.message}`);
    }
  }

  /**
   * Get all prescription uploads for the current patient
   */
  @ApiOperation({
    summary: 'Get my prescription uploads',
    description:
      'Retrieve a paginated list of all prescription uploads for the authenticated patient. ' +
      'Results can be filtered by verification status and are sorted by most recent first.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)', example: 10 })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: VerificationStatus,
    description: 'Filter by verification status',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of patient prescription uploads',
    schema: {
      example: {
        message: 'Success',
        result: {
          uploads: [],
          pagination: { total: 5, page: 1, totalPages: 1, hasMore: false },
        },
      },
    },
  })
  @Get('my-uploads')
  async getMyUploads(
    @Request() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('status') status?: VerificationStatus,
  ) {
    const patientId = new Types.ObjectId(req.user.sub || req.user._id);
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const query: any = {
      patient: patientId,
      is_deleted: false,
    };

    if (status) {
      query.verification_status = status;
    }

    const [uploads, total] = await Promise.all([
      this.uploadModel
        .find(query)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('verification'),
      this.uploadModel.countDocuments(query),
    ]);

    return {
      message: 'Success',
      result: {
        uploads,
        pagination: {
          total,
          page: pageNum,
          totalPages: Math.ceil(total / limitNum),
          hasMore: skip + uploads.length < total,
        },
      },
    };
  }

  /**
   * Get approved prescriptions available for use in orders
   */
  @ApiOperation({
    summary: 'Get approved prescriptions',
    description:
      'Retrieve all verified and approved prescriptions that are eligible for use in pharmacy orders. ' +
      'By default, excludes prescriptions already used in paid orders. ' +
      'Set includeUsed=true to also return previously used prescriptions.',
  })
  @ApiQuery({
    name: 'includeUsed',
    required: false,
    type: String,
    description: 'Include prescriptions already used in paid orders (default: false)',
    example: 'false',
  })
  @ApiResponse({
    status: 200,
    description: 'List of approved prescriptions available for ordering',
    schema: {
      example: {
        message: 'Success',
        result: [],
      },
    },
  })
  @Get('approved')
  async getApprovedPrescriptions(
    @Request() req,
    @Query('includeUsed') includeUsed: string = 'false',
  ) {
    const patientId = new Types.ObjectId(req.user.sub || req.user._id);

    const query: any = {
      patient: patientId,
      verification_status: VerificationStatus.APPROVED,
      is_deleted: false,
      is_expired: false,
    };

    // By default, exclude fully used prescriptions
    if (includeUsed !== 'true') {
      query.$or = [
        { max_usage: { $exists: false } },
        { max_usage: null },
        { $expr: { $lt: ['$usage_count', '$max_usage'] } },
      ];
    }

    let prescriptions = await this.uploadModel
      .find(query)
      .sort({ created_at: -1 })
      .select(
        'original_filename ocr_data verified_medications valid_from valid_until usage_count max_usage created_at verification_status',
      );

    // Filter out prescriptions that have been used for paid orders
    if (includeUsed !== 'true' && prescriptions.length > 0) {
      const prescriptionIds = prescriptions.map((p) => p._id);

      // Find prescriptions used in paid/completed orders
      const paidStatuses = ['PAID', 'PROCESSING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'];
      const usedPrescriptions = await this.orderModel.distinct('prescription', {
        prescription: { $in: prescriptionIds },
        $or: [
          { payment_status: 'PAID' },
          { status: { $in: paidStatuses } },
        ],
      });

      // Filter out used prescription IDs
      if (usedPrescriptions.length > 0) {
        const usedIds = new Set(usedPrescriptions.map((id) => id.toString()));
        prescriptions = prescriptions.filter((p) => !usedIds.has(p._id.toString()));
      }
    }

    return {
      message: 'Success',
      result: prescriptions,
    };
  }

  /**
   * Get single upload details
   */
  @ApiOperation({
    summary: 'Get prescription upload details',
    description:
      'Retrieve full details of a single prescription upload, including a time-limited presigned S3 URL ' +
      'for viewing the document, enriched medication data with drug pricing and manufacturer info, ' +
      'and linked order history. For internal Rapid Capsules prescriptions, original specialist prescription data is merged.',
  })
  @ApiParam({ name: 'uploadId', description: 'Prescription upload ID', example: '665a1b2c3d4e5f6a7b8c9d0e' })
  @ApiResponse({
    status: 200,
    description: 'Full prescription upload details with presigned URL and enriched medication data',
  })
  @ApiResponse({ status: 404, description: 'Prescription upload not found or does not belong to the authenticated patient' })
  @Get(':uploadId')
  async getUploadDetails(@Param('uploadId') uploadId: string, @Request() req) {
    const patientId = new Types.ObjectId(req.user.sub || req.user._id);

    const upload = await this.uploadModel
      .findOne({
        _id: new Types.ObjectId(uploadId),
        patient: patientId,
        is_deleted: false,
      })
      .populate('verification')
      .populate('fingerprint');

    if (!upload) {
      throw new NotFoundException('Prescription upload not found');
    }

    // Generate presigned URL for viewing
    let presignedUrl: string | null = null;
    try {
      presignedUrl = this.s3.getSignedUrl('getObject', {
        Bucket: upload.s3_bucket,
        Key: upload.s3_key,
        Expires: 3600, // 1 hour
      });
    } catch (error) {
      console.error('Failed to generate presigned URL:', error);
    }

    // Populate drug details for verified medications (including manufacturer)
    const uploadObj = upload.toObject();

    // Check if this is a Rapid Capsules internal prescription (has RX reference number)
    const rxReferenceNumber = uploadObj.digital_signature?.reference_number;
    const isInternalPrescription = rxReferenceNumber && /^RX-\d{8}-\d+$/.test(rxReferenceNumber);
    let originalPrescription: any = null;

    if (isInternalPrescription) {
      // Look up the original specialist prescription by reference number
      originalPrescription = await this.specialistPrescriptionModel
        .findOne({ prescription_number: rxReferenceNumber })
        .select('items prescription_number status payment_status')
        .lean();
    }

    if (uploadObj.verified_medications && uploadObj.verified_medications.length > 0) {
      const drugIds = uploadObj.verified_medications
        .filter((med) => med.matched_drug_id)
        .map((med) => med.matched_drug_id);

      // Fetch drug details
      let drugMap = new Map();
      if (drugIds.length > 0) {
        const drugs = await this.drugModel
          .find({ _id: { $in: drugIds } })
          .select('_id name generic_name manufacturer strength dosage_form selling_price images')
          .lean();

        drugMap = new Map(drugs.map((drug) => [drug._id.toString(), drug]));
      }

      // Build original prescription items map (by drug name for matching)
      const originalItemsMap = new Map();
      if (originalPrescription?.items) {
        for (const item of originalPrescription.items) {
          // Map by drug name (lowercase for case-insensitive matching)
          const drugName = (item.drug || item.drug_name || '').toLowerCase();
          if (drugName) {
            originalItemsMap.set(drugName, item);
          }
        }
      }

      // Cast to any[] to allow adding new properties during enrichment
      const enrichedMedications: any[] = uploadObj.verified_medications.map((med, index) => {
        let enrichedMed: any = { ...med };

        // Add drug details (manufacturer, etc.)
        if (med.matched_drug_id) {
          const drug = drugMap.get(med.matched_drug_id.toString());
          if (drug) {
            enrichedMed = {
              ...enrichedMed,
              matched_drug_name: drug.name || med.matched_drug_name,
              matched_generic_name: drug.generic_name || med.matched_generic_name,
              manufacturer: drug.manufacturer,
              strength: drug.strength,
              dosage_form: drug.dosage_form,
              selling_price: drug.selling_price,
              drug_image: drug.images?.[0]?.url || null,
            };
          }
        }

        // For internal prescriptions, merge data from original specialist prescription
        if (isInternalPrescription && originalPrescription?.items) {
          // Try to match by medication name
          const medName = (med.prescription_medication_name || '').toLowerCase();
          const matchedDrugName = (enrichedMed.matched_drug_name || '').toLowerCase();

          let originalItem = originalItemsMap.get(medName) || originalItemsMap.get(matchedDrugName);

          // Fall back to index-based matching if name matching fails
          if (!originalItem && originalPrescription.items[index]) {
            originalItem = originalPrescription.items[index];
          }

          if (originalItem) {
            // Parse frequency string (e.g., "2x daily") into interval object
            let interval: any = null;
            if (originalItem.frequency) {
              const freqMatch = originalItem.frequency.match(/(\d+)x?\s*(.*)/i);
              if (freqMatch) {
                interval = { time: parseInt(freqMatch[1]), unit: freqMatch[2]?.trim() || 'daily' };
              }
            }

            // Parse duration string (e.g., "7 days") into period object
            let period: any = null;
            if (originalItem.duration) {
              const durMatch = originalItem.duration.match(/(\d+)\s*(days?|weeks?|months?)/i);
              if (durMatch) {
                period = { number: parseInt(durMatch[1]), unit: durMatch[2].toLowerCase() };
              }
            }

            enrichedMed = {
              ...enrichedMed,
              // Use original prescription data for quantity, dosage, instructions
              quantity: originalItem.quantity || enrichedMed.quantity,
              dosage: originalItem.dosage || enrichedMed.dosage,
              instructions: originalItem.instructions || enrichedMed.instructions,
              // Include frequency and duration as structured objects
              interval: interval,
              period: period,
              // Keep original strings for display
              frequency: originalItem.frequency || null,
              duration: originalItem.duration || null,
              // Build dose object from original data
              dose: {
                dosage_form: originalItem.dosage,
                quantity: originalItem.quantity,
              },
              unit_price: originalItem.unit_price || enrichedMed.selling_price,
              total_price: originalItem.total_price || null,
              // Additional fields from original prescription
              drug_strength: originalItem.drug_strength || enrichedMed.strength,
              // Flag as matched to original
              matched_to_original: true,
            };
          }
        }

        return enrichedMed;
      });

      // Assign enriched medications back
      (uploadObj as any).verified_medications = enrichedMedications;

    }

    // Get prescription number - prioritize stored field, fallback for legacy records
    const uploadDate = new Date((upload as any).created_at);
    const dateStr = uploadDate.toISOString().slice(0, 10).replace(/-/g, '');
    const idSuffix = upload._id.toString().slice(-4).toUpperCase();
    const prescriptionNumber = (upload as any).prescription_number ||
      (upload as any).digital_signature?.reference_number ||
      `RX-${dateStr}-${idSuffix}`;

    // Normalize used_in_orders - fetch order details if needed
    const normalizedUsedInOrders: Array<{
      order_id: string;
      order_number: string;
      total_amount: number;
      status: string;
    }> = [];
    if (uploadObj.used_in_orders && uploadObj.used_in_orders.length > 0) {
      for (const item of uploadObj.used_in_orders as any[]) {
        // Check if it's an ObjectId or object with order_id
        const hasOrderId = item && typeof item === 'object' && item.order_id;
        const isObjectId = !hasOrderId && (
          item instanceof Types.ObjectId ||
          (typeof item === 'string' && /^[a-f\d]{24}$/i.test(item)) ||
          (item && (item as any)._bsontype === 'ObjectID')
        );

        if (hasOrderId) {
          // New format - already has order details embedded
          normalizedUsedInOrders.push({
            order_id: (item as any).order_id?.toString(),
            order_number: (item as any).order_number || '',
            total_amount: (item as any).total_amount || 0,
            status: (item as any).status || 'PENDING',
          });
        } else if (isObjectId) {
          // Old format - just an ObjectId, fetch order details
          const orderId = typeof item === 'string' ? item : item.toString();
          try {
            const order = await this.orderModel.findById(orderId).lean();
            if (order) {
              normalizedUsedInOrders.push({
                order_id: (order as any)._id.toString(),
                order_number: (order as any).order_number || `ORD-${orderId.slice(-8).toUpperCase()}`,
                total_amount: (order as any).total_amount || 0,
                status: (order as any).status || 'PENDING',
              });
            } else {
              // Order not found, still include the ID for reference
              normalizedUsedInOrders.push({
                order_id: orderId,
                order_number: '',
                total_amount: 0,
                status: 'PENDING',
              });
            }
          } catch (e) {
            // Skip invalid ObjectIds
          }
        } else if (item && typeof item === 'object') {
          // Object format without order_id - shouldn't happen but handle it
          normalizedUsedInOrders.push({
            order_id: (item as any)._id?.toString() || '',
            order_number: (item as any).order_number || '',
            total_amount: (item as any).total_amount || 0,
            status: (item as any).status || 'PENDING',
          });
        }
      }
    }

    // Extract patient-friendly summary from AI analysis or tier1 (if available)
    const verification = uploadObj.verification as any;
    const patientSummary = verification?.tier2?.ai_analysis?.patient_summary ||
                           verification?.tier1?.patient_summary || null;

    // Build the response with additional metadata
    const responseData: any = {
      ...uploadObj,
      prescription_number: prescriptionNumber,
      presignedUrl,
      is_internal_prescription: isInternalPrescription,
      // Patient-friendly summary (simple, non-technical explanation)
      patient_summary: patientSummary,
      // Normalized used_in_orders with order details
      used_in_orders: normalizedUsedInOrders,
    };

    if (originalPrescription) {
      responseData.original_prescription_number = originalPrescription.prescription_number;
      responseData.original_prescription_status = originalPrescription.status;
      responseData.original_prescription_payment_status = originalPrescription.payment_status;
    }

    return {
      message: 'Success',
      result: responseData,
    };
  }

  /**
   * Get verification status for an upload
   */
  @ApiOperation({
    summary: 'Get verification status',
    description:
      'Retrieve the current verification status of a prescription upload including tier-1 and tier-2 check results, ' +
      'fraud detection scores, failure reasons, and a patient-friendly summary. ' +
      'Use this endpoint to poll for verification completion after uploading a prescription.',
  })
  @ApiParam({ name: 'uploadId', description: 'Prescription upload ID', example: '665a1b2c3d4e5f6a7b8c9d0e' })
  @ApiResponse({
    status: 200,
    description: 'Verification status with tier results, fraud detection scores, and failure reasons',
    schema: {
      example: {
        message: 'Success',
        result: {
          status: 'APPROVED',
          processingStatus: 'COMPLETED',
          verifiedMedications: [],
          failureReasons: null,
          patientSummary: 'Your prescription has been verified and approved.',
          verification: {
            overallResult: 'PASS',
            overallScore: 92,
            confidenceScore: 0.95,
            currentTier: 'TIER2',
          },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Prescription upload not found' })
  @Get(':uploadId/verification')
  async getVerificationStatus(
    @Param('uploadId') uploadId: string,
    @Request() req,
  ) {
    const patientId = new Types.ObjectId(req.user.sub || req.user._id);

    const upload = await this.uploadModel.findOne({
      _id: new Types.ObjectId(uploadId),
      patient: patientId,
    });

    if (!upload) {
      throw new NotFoundException('Prescription upload not found');
    }

    const verification = await this.verificationService.getVerificationByUploadId(
      upload._id,
    );

    if (!verification) {
      return {
        message: 'Verification not found',
        result: {
          status: upload.verification_status,
          processingStatus: upload.processing_status,
          verification: null,
        },
      };
    }

    // Extract failure reasons from failed checks for transparency
    const failureReasons: Array<{ reason: string; severity: string; details: string }> = [];

    // Check tier1 failed checks - include any non-passing check that isn't INFO level
    if (verification.tier1.checks) {
      for (const check of verification.tier1.checks) {
        const severity = check.severity as string;
        if (!check.passed && severity !== 'INFO') {
          failureReasons.push({
            reason: check.check_name,
            severity: severity,
            details: check.details,
          });
        }
      }
    }

    // Check tier2 failed checks
    if (verification.tier2.checks) {
      for (const check of verification.tier2.checks) {
        const severity = check.severity as string;
        if (!check.passed && severity !== 'INFO') {
          failureReasons.push({
            reason: check.check_name,
            severity: severity,
            details: check.details,
          });
        }
      }
    }

    // Add fraud flags as reasons
    if (verification.fraud_detection.flags) {
      for (const flag of verification.fraud_detection.flags) {
        failureReasons.push({
          reason: flag.flag_type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
          severity: flag.severity,
          details: flag.description,
        });
      }
    }

    // Extract patient-friendly summary from AI analysis or tier1 (if available)
    const patientSummary = verification.tier2?.ai_analysis?.patient_summary ||
                           verification.tier1?.patient_summary || null;

    return {
      message: 'Success',
      result: {
        status: upload.verification_status,
        processingStatus: upload.processing_status,
        verifiedMedications: upload.verified_medications || [],
        failureReasons: failureReasons.length > 0 ? failureReasons : null,
        // Patient-friendly summary (simple, non-technical) - use this for patient display
        patientSummary,
        verification: {
          id: verification._id,
          overallResult: verification.overall_result,
          overallScore: verification.overall_score,
          confidenceScore: verification.confidence_score,
          currentTier: verification.current_tier,
          tier1: {
            status: verification.tier1.status,
            result: verification.tier1.result,
            score: verification.tier1.score,
            checksCount: verification.tier1.checks?.length || 0,
            processingTime: verification.tier1.processing_time_ms,
          },
          tier2: {
            status: verification.tier2.status,
            result: verification.tier2.result,
            score: verification.tier2.score,
            checksCount: verification.tier2.checks?.length || 0,
            processingTime: verification.tier2.processing_time_ms,
          },
          pharmacistReview: verification.pharmacist_review,
          fraudDetection: {
            score: verification.fraud_detection.score,
            riskLevel: verification.fraud_detection.risk_level,
            flagsCount: verification.fraud_detection.flags?.length || 0,
          },
          startedAt: verification.verification_started_at,
          completedAt: verification.verification_completed_at,
          totalProcessingTime: verification.total_processing_time_ms,
        },
      },
    };
  }

  /**
   * Get detailed verification checks (for debugging/review)
   */
  @ApiOperation({
    summary: 'Get detailed verification checks',
    description:
      'Retrieve the complete verification record including all individual tier-1 and tier-2 checks, ' +
      'AI analysis details, fraud detection flags, and processing timestamps. ' +
      'Primarily used for debugging and pharmacist review workflows.',
  })
  @ApiParam({ name: 'uploadId', description: 'Prescription upload ID', example: '665a1b2c3d4e5f6a7b8c9d0e' })
  @ApiResponse({
    status: 200,
    description: 'Complete verification record with all check details',
  })
  @ApiResponse({ status: 404, description: 'Prescription upload or verification record not found' })
  @Get(':uploadId/verification/details')
  async getVerificationDetails(
    @Param('uploadId') uploadId: string,
    @Request() req,
  ) {
    const patientId = new Types.ObjectId(req.user.sub || req.user._id);

    const upload = await this.uploadModel.findOne({
      _id: new Types.ObjectId(uploadId),
      patient: patientId,
    });

    if (!upload) {
      throw new NotFoundException('Prescription upload not found');
    }

    const verification = await this.verificationService.getVerificationByUploadId(
      upload._id,
    );

    if (!verification) {
      throw new NotFoundException('Verification not found');
    }

    return {
      message: 'Success',
      result: verification,
    };
  }

  /**
   * Delete (soft delete) a prescription upload
   */
  @ApiOperation({
    summary: 'Delete prescription upload',
    description:
      'Soft-delete a prescription upload. The record is marked as deleted but retained in the database. ' +
      'Prescriptions that have already been used in pharmacy orders cannot be deleted.',
  })
  @ApiParam({ name: 'uploadId', description: 'Prescription upload ID', example: '665a1b2c3d4e5f6a7b8c9d0e' })
  @ApiResponse({ status: 200, description: 'Prescription deleted successfully' })
  @ApiResponse({ status: 404, description: 'Prescription upload not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete a prescription that has been used in orders' })
  @Delete(':uploadId')
  async deleteUpload(@Param('uploadId') uploadId: string, @Request() req) {
    const patientId = new Types.ObjectId(req.user.sub || req.user._id);

    const upload = await this.uploadModel.findOne({
      _id: new Types.ObjectId(uploadId),
      patient: patientId,
    });

    if (!upload) {
      throw new NotFoundException('Prescription upload not found');
    }

    // Check if used in any orders
    if (upload.used_in_orders && upload.used_in_orders.length > 0) {
      throw new BadRequestException(
        'Cannot delete prescription that has been used in orders',
      );
    }

    // Soft delete
    await this.uploadModel.findByIdAndUpdate(upload._id, {
      is_deleted: true,
      deleted_at: new Date(),
    });

    return {
      message: 'Prescription deleted successfully',
    };
  }

  /**
   * Retry verification for a failed upload
   */
  @ApiOperation({
    summary: 'Retry prescription verification',
    description:
      'Re-trigger the multi-tier verification pipeline for a prescription that previously failed or is still pending. ' +
      'Only uploads with status PENDING, TIER1_FAILED, TIER2_FAILED, or REJECTED can be retried. ' +
      'The retry count is incremented on the verification record for audit purposes.',
  })
  @ApiParam({ name: 'uploadId', description: 'Prescription upload ID', example: '665a1b2c3d4e5f6a7b8c9d0e' })
  @ApiResponse({ status: 200, description: 'Verification retry started' })
  @ApiResponse({ status: 404, description: 'Prescription upload not found' })
  @ApiResponse({ status: 400, description: 'Verification can only be retried for failed or pending uploads' })
  @Post(':uploadId/retry-verification')
  async retryVerification(@Param('uploadId') uploadId: string, @Request() req) {
    const patientId = new Types.ObjectId(req.user.sub || req.user._id);

    const upload = await this.uploadModel.findOne({
      _id: new Types.ObjectId(uploadId),
      patient: patientId,
    });

    if (!upload) {
      throw new NotFoundException('Prescription upload not found');
    }

    // Only allow retry for failed or pending uploads
    const retryableStatuses = [
      VerificationStatus.PENDING,
      VerificationStatus.TIER1_FAILED,
      VerificationStatus.TIER2_FAILED,
      VerificationStatus.REJECTED,
    ];

    if (!retryableStatuses.includes(upload.verification_status)) {
      throw new BadRequestException(
        'Verification can only be retried for failed or pending uploads',
      );
    }

    // Get existing verification and increment retry count
    const existingVerification =
      await this.verificationService.getVerificationByUploadId(upload._id);
    if (existingVerification) {
      await this.verificationModel.findByIdAndUpdate(existingVerification._id, {
        $inc: { retry_count: 1 },
        last_retry_at: new Date(),
      });
    }

    // Reset upload status
    await this.uploadModel.findByIdAndUpdate(upload._id, {
      verification_status: VerificationStatus.PENDING,
      processing_status: ProcessingStatus.PENDING,
      processing_error: null,
    });

    // Start verification pipeline
    this.verificationService
      .startVerificationPipeline(upload._id, patientId)
      .catch((error) => {
        console.error('Verification retry error:', error);
      });

    return {
      message: 'Verification retry started',
    };
  }

  // ============= PHARMACIST REVIEW ENDPOINTS =============

  /**
   * Get prescriptions pending pharmacist review (for pharmacist users)
   */
  @ApiOperation({
    summary: 'Get pending pharmacist reviews',
    description:
      'Retrieve a paginated list of prescriptions that are awaiting manual pharmacist review. ' +
      'These are uploads that passed automated checks but require human verification before approval. ' +
      'Intended for pharmacist-role users.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)', example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of prescriptions pending pharmacist review',
  })
  @Get('review/pending')
  async getPendingReviews(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Request() req,
  ) {
    // TODO: Add pharmacist role check
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;

    const result = await this.verificationService.getPendingPharmacistReviews(
      pageNum,
      limitNum,
    );

    return {
      message: 'Success',
      result: result,
    };
  }

  /**
   * Submit pharmacist review decision
   */
  @ApiOperation({
    summary: 'Submit pharmacist review',
    description:
      'Submit a pharmacist review decision for a prescription currently in PHARMACIST_REVIEW status. ' +
      'The pharmacist can approve, reject, or request clarification from the patient. ' +
      'A rejection requires a rejectionReason; a clarification request requires a clarificationRequest message.',
  })
  @ApiParam({ name: 'uploadId', description: 'Prescription upload ID', example: '665a1b2c3d4e5f6a7b8c9d0e' })
  @ApiResponse({ status: 200, description: 'Review submitted successfully' })
  @ApiResponse({ status: 404, description: 'Prescription upload or verification record not found' })
  @ApiResponse({ status: 400, description: 'Prescription is not pending pharmacist review' })
  @Patch(':uploadId/review')
  async submitReview(
    @Param('uploadId') uploadId: string,
    @Body() dto: SubmitReviewDto,
    @Request() req,
  ) {
    // TODO: Add pharmacist role check
    const reviewerId = new Types.ObjectId(req.user.sub || req.user._id);

    const upload = await this.uploadModel.findById(uploadId);
    if (!upload) {
      throw new NotFoundException('Prescription upload not found');
    }

    if (upload.verification_status !== VerificationStatus.PHARMACIST_REVIEW) {
      throw new BadRequestException(
        'This prescription is not pending pharmacist review',
      );
    }

    const verification = await this.verificationService.getVerificationByUploadId(
      upload._id,
    );

    if (!verification) {
      throw new NotFoundException('Verification record not found');
    }

    await this.verificationService.submitPharmacistReview(
      verification._id,
      reviewerId,
      dto.decision,
      dto.notes,
      dto.rejectionReason,
      dto.clarificationRequest,
    );

    return {
      message: 'Review submitted successfully',
    };
  }

  // ============= PATIENT CLARIFICATION ENDPOINTS =============

  /**
   * Get clarification request details for an upload
   */
  @ApiOperation({
    summary: 'Get clarification details',
    description:
      'Retrieve the clarification request details for a prescription that needs additional information from the patient. ' +
      'Returns the pharmacist request message, required information list, response deadline, ' +
      'and any previously submitted patient response.',
  })
  @ApiParam({ name: 'uploadId', description: 'Prescription upload ID', example: '665a1b2c3d4e5f6a7b8c9d0e' })
  @ApiResponse({
    status: 200,
    description: 'Clarification request details or indication that no clarification is pending',
    schema: {
      example: {
        message: 'Success',
        result: {
          prescription_id: '665a1b2c3d4e5f6a7b8c9d0e',
          prescription_number: 'RX-20260227-0001',
          status: 'CLARIFICATION_NEEDED',
          clarification: {
            request_message: 'Please provide a clearer image of the prescriber stamp.',
            required_information: ['prescriber_stamp', 'prescriber_license_number'],
            requested_at: '2026-02-27T10:00:00.000Z',
            response_deadline: '2026-03-02T10:00:00.000Z',
            has_responded: false,
            response_message: null,
            responded_at: null,
          },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Prescription upload not found' })
  @Get(':uploadId/clarification')
  async getClarificationDetails(
    @Param('uploadId') uploadId: string,
    @Request() req,
  ) {
    const patientId = new Types.ObjectId(req.user.sub || req.user._id);

    const upload = await this.uploadModel.findOne({
      _id: new Types.ObjectId(uploadId),
      patient: patientId,
      is_deleted: false,
    });

    if (!upload) {
      throw new NotFoundException('Prescription upload not found');
    }

    // Check if there's a pending clarification request
    if (upload.verification_status !== VerificationStatus.CLARIFICATION_NEEDED) {
      return {
        message: 'No clarification pending',
        result: {
          status: upload.verification_status,
          clarification: null,
        },
      };
    }

    // Get prescription number - prioritize stored field, fallback for legacy records
    const uploadDate = new Date((upload as any).created_at);
    const dateStr = uploadDate.toISOString().slice(0, 10).replace(/-/g, '');
    const idSuffix = upload._id.toString().slice(-4).toUpperCase();
    const prescriptionNumber = (upload as any).prescription_number ||
      (upload as any).digital_signature?.reference_number ||
      `RX-${dateStr}-${idSuffix}`;

    return {
      message: 'Success',
      result: {
        prescription_id: upload._id,
        prescription_number: prescriptionNumber,
        status: upload.verification_status,
        clarification: (upload as any).clarification ? {
          request_message: (upload as any).clarification.request_message,
          required_information: (upload as any).clarification.required_information || [],
          requested_at: (upload as any).clarification.requested_at,
          response_deadline: (upload as any).clarification.response_deadline,
          has_responded: !!(upload as any).clarification.responded_at,
          response_message: (upload as any).clarification.response_message,
          responded_at: (upload as any).clarification.responded_at,
        } : null,
      },
    };
  }

  /**
   * Submit clarification response from patient
   */
  @ApiOperation({
    summary: 'Submit clarification response',
    description:
      'Submit a patient response to a pharmacist clarification request. ' +
      'The patient can provide a text message, an additional document (image or PDF), or both. ' +
      'The prescription status changes to CLARIFICATION_RECEIVED and awaits pharmacist re-review. ' +
      'Responses cannot be submitted after the deadline or if a response was already provided.',
  })
  @ApiParam({ name: 'uploadId', description: 'Prescription upload ID', example: '665a1b2c3d4e5f6a7b8c9d0e' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Clarification response with optional supporting document',
    schema: {
      type: 'object',
      properties: {
        response_message: {
          type: 'string',
          description: 'Patient text response to the clarification request',
          example: 'Here is a clearer photo of the prescriber stamp and license number.',
        },
        document: {
          type: 'string',
          format: 'binary',
          description: 'Optional supporting document (JPEG, PNG, WebP, GIF, PDF, DOCX, DOC)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Clarification response submitted successfully',
    schema: {
      example: {
        message: 'Clarification response submitted successfully',
        result: {
          prescription_id: '665a1b2c3d4e5f6a7b8c9d0e',
          prescription_number: 'RX-20260227-0001',
          status: 'CLARIFICATION_RECEIVED',
          responded_at: '2026-02-27T14:30:00.000Z',
          document_uploaded: true,
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Prescription upload not found' })
  @ApiResponse({ status: 400, description: 'No clarification pending, already responded, deadline passed, or missing response content' })
  @Post(':uploadId/clarification/respond')
  @UseInterceptors(
    FileInterceptor('document', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
      fileFilter: (req, file, cb) => {
        if (ALLOWED_PRESCRIPTION_MIMES.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Invalid file type. Allowed: JPEG, PNG, WebP, GIF, PDF, DOCX, DOC',
            ),
            false,
          );
        }
      },
    }),
  )
  async submitClarificationResponse(
    @Param('uploadId') uploadId: string,
    @Body() body: { response_message: string },
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    const patientId = new Types.ObjectId(req.user.sub || req.user._id);

    const upload = await this.uploadModel.findOne({
      _id: new Types.ObjectId(uploadId),
      patient: patientId,
      is_deleted: false,
    });

    if (!upload) {
      throw new NotFoundException('Prescription upload not found');
    }

    // Check if clarification is needed
    if (upload.verification_status !== VerificationStatus.CLARIFICATION_NEEDED) {
      throw new BadRequestException(
        'No clarification is currently pending for this prescription',
      );
    }

    // Check if already responded
    if ((upload as any).clarification?.responded_at) {
      throw new BadRequestException(
        'Clarification has already been submitted',
      );
    }

    // Check deadline
    const deadline = (upload as any).clarification?.response_deadline;
    if (deadline && new Date(deadline) < new Date()) {
      throw new BadRequestException(
        'Clarification deadline has passed',
      );
    }

    // Validate response
    if (!body.response_message && !file) {
      throw new BadRequestException(
        'Please provide a response message or upload a document',
      );
    }

    // Handle document upload if provided
    let uploadedDocument: any = null;
    if (file) {
      const bucket = process.env.AWS_BUCKET_NAME || 'rapidcapsule';
      const key = `prescriptions/${patientId}/clarification/${uuidv4()}-${file.originalname}`;

      try {
        const uploadResult = await this.s3
          .upload({
            Bucket: bucket,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
          })
          .promise();

        uploadedDocument = {
          url: uploadResult.Location,
          filename: file.originalname,
          mimetype: file.mimetype,
          uploaded_at: new Date(),
        };
      } catch (error) {
        throw new BadRequestException(`Document upload failed: ${error.message}`);
      }
    }

    // Update the clarification response
    const updateData: any = {
      verification_status: VerificationStatus.CLARIFICATION_RECEIVED,
      'clarification.response_message': body.response_message || '',
      'clarification.responded_at': new Date(),
      updated_at: new Date(),
    };

    if (uploadedDocument) {
      updateData['$push'] = {
        'clarification.response_documents': uploadedDocument,
      };
    }

    // Use separate update for $push
    if (uploadedDocument) {
      await this.uploadModel.updateOne(
        { _id: upload._id },
        {
          $set: {
            verification_status: VerificationStatus.CLARIFICATION_RECEIVED,
            'clarification.response_message': body.response_message || '',
            'clarification.responded_at': new Date(),
            updated_at: new Date(),
          },
          $push: {
            'clarification.response_documents': uploadedDocument,
          },
        },
      );
    } else {
      await this.uploadModel.updateOne(
        { _id: upload._id },
        {
          $set: {
            verification_status: VerificationStatus.CLARIFICATION_RECEIVED,
            'clarification.response_message': body.response_message || '',
            'clarification.responded_at': new Date(),
            updated_at: new Date(),
          },
        },
      );
    }

    // Get prescription number - prioritize stored field, fallback for legacy records
    const uploadDate = new Date((upload as any).created_at);
    const dateStr = uploadDate.toISOString().slice(0, 10).replace(/-/g, '');
    const idSuffix = upload._id.toString().slice(-4).toUpperCase();
    const prescriptionNumber = (upload as any).prescription_number ||
      (upload as any).digital_signature?.reference_number ||
      `RX-${dateStr}-${idSuffix}`;

    return {
      message: 'Clarification response submitted successfully',
      result: {
        prescription_id: upload._id,
        prescription_number: prescriptionNumber,
        status: VerificationStatus.CLARIFICATION_RECEIVED,
        responded_at: new Date(),
        document_uploaded: !!uploadedDocument,
      },
    };
  }

  /**
   * Get prescriptions needing clarification response
   */
  @ApiOperation({
    summary: 'Get pending clarifications',
    description:
      'Retrieve all prescriptions for the authenticated patient that have outstanding clarification requests. ' +
      'Results are sorted by response deadline (earliest first) and include overdue indicators.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of prescriptions awaiting patient clarification',
    schema: {
      example: {
        message: 'Success',
        result: {
          pending_count: 1,
          prescriptions: [
            {
              _id: '665a1b2c3d4e5f6a7b8c9d0e',
              prescription_number: 'RX-20260227-0001',
              original_filename: 'prescription.pdf',
              clarification: {
                request_message: 'Please confirm the medication dosage.',
                required_information: ['dosage_confirmation'],
                requested_at: '2026-02-27T10:00:00.000Z',
                response_deadline: '2026-03-02T10:00:00.000Z',
                is_overdue: false,
              },
              created_at: '2026-02-26T15:00:00.000Z',
            },
          ],
        },
      },
    },
  })
  @Get('clarifications/pending')
  async getPendingClarifications(@Request() req) {
    const patientId = new Types.ObjectId(req.user.sub || req.user._id);

    const uploads = await this.uploadModel.find({
      patient: patientId,
      verification_status: VerificationStatus.CLARIFICATION_NEEDED,
      is_deleted: false,
    }).sort({ 'clarification.response_deadline': 1 });

    const result = uploads.map((upload) => {
      // Get prescription number - prioritize stored field, fallback for legacy records
      const uploadDate = new Date((upload as any).created_at);
      const dateStr = uploadDate.toISOString().slice(0, 10).replace(/-/g, '');
      const idSuffix = upload._id.toString().slice(-4).toUpperCase();
      const prescriptionNumber = (upload as any).prescription_number ||
        (upload as any).digital_signature?.reference_number ||
        `RX-${dateStr}-${idSuffix}`;

      return {
        _id: upload._id,
        prescription_number: prescriptionNumber,
        original_filename: upload.original_filename,
        clarification: (upload as any).clarification ? {
          request_message: (upload as any).clarification.request_message,
          required_information: (upload as any).clarification.required_information || [],
          requested_at: (upload as any).clarification.requested_at,
          response_deadline: (upload as any).clarification.response_deadline,
          is_overdue: (upload as any).clarification.response_deadline &&
            new Date((upload as any).clarification.response_deadline) < new Date(),
        } : null,
        created_at: (upload as any).created_at,
      };
    });

    return {
      message: 'Success',
      result: {
        pending_count: result.length,
        prescriptions: result,
      },
    };
  }

  // ============= STATISTICS ENDPOINTS =============

  /**
   * Get upload statistics for the current patient
   */
  @ApiOperation({
    summary: 'Get prescription upload statistics',
    description:
      'Retrieve aggregated statistics for the authenticated patient\'s prescription uploads, ' +
      'broken down by verification status. Includes counts for total, approved, pending, rejected, ' +
      'and prescriptions needing pharmacist review.',
  })
  @ApiResponse({
    status: 200,
    description: 'Prescription upload statistics summary',
    schema: {
      example: {
        message: 'Success',
        result: {
          total: 12,
          byStatus: {
            APPROVED: 8,
            PENDING: 2,
            REJECTED: 1,
            PHARMACIST_REVIEW: 1,
          },
          approved: 8,
          pending: 2,
          rejected: 1,
          needsReview: 1,
        },
      },
    },
  })
  @Get('stats/summary')
  async getUploadStats(@Request() req) {
    const patientId = new Types.ObjectId(req.user.sub || req.user._id);

    const stats = await this.uploadModel.aggregate([
      {
        $match: {
          patient: patientId,
          is_deleted: false,
        },
      },
      {
        $group: {
          _id: '$verification_status',
          count: { $sum: 1 },
        },
      },
    ]);

    const statusCounts: Record<string, number> = {};
    for (const stat of stats) {
      statusCounts[stat._id] = stat.count;
    }

    const total = Object.values(statusCounts).reduce((a, b) => a + b, 0);

    return {
      message: 'Success',
      result: {
        total,
        byStatus: statusCounts,
        approved: statusCounts[VerificationStatus.APPROVED] || 0,
        pending:
          (statusCounts[VerificationStatus.PENDING] || 0) +
          (statusCounts[VerificationStatus.TIER1_PROCESSING] || 0) +
          (statusCounts[VerificationStatus.TIER2_PROCESSING] || 0),
        rejected: statusCounts[VerificationStatus.REJECTED] || 0,
        needsReview: statusCounts[VerificationStatus.PHARMACIST_REVIEW] || 0,
      },
    };
  }
}
