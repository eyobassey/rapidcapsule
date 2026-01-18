import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { FlowType } from '../entities/whatsapp-session.entity';
import {
  BaseFlowHandler,
  FlowHandlerResult,
  FlowContext,
  FlowAction,
} from './base-flow.handler';
import {
  PatientPrescriptionUpload,
  PatientPrescriptionUploadDocument,
  UploadSource,
  ProcessingStatus,
  VerificationStatus,
} from '../../pharmacy/entities/patient-prescription-upload.entity';
import { PrescriptionVerificationService } from '../../pharmacy/services/prescription-verification.service';
import { PrescriptionNumberHelper } from '../../../common/helpers/prescription-number.helper';
import { WhatsAppTwilioService } from '../services/whatsapp-twilio.service';
import {
  WhatsAppPrescriptionQueue,
  WhatsAppPrescriptionQueueDocument,
  QueueType,
  QueuePriority,
  QueueStatus,
} from '../entities/whatsapp-prescription-queue.entity';
import { MESSAGES } from '../constants/messages.constant';

/**
 * Handles the prescription upload flow via WhatsApp
 *
 * Flow steps:
 * 0 - Waiting for prescription image
 * 1 - Processing/analyzing image
 * 2 - Show results or queue status
 * 3 - Confirm order or handle clarification
 */
@Injectable()
export class PrescriptionFlowHandler extends BaseFlowHandler {
  readonly flowType = FlowType.PRESCRIPTION_UPLOAD;
  private readonly logger = new Logger(PrescriptionFlowHandler.name);
  private s3: AWS.S3;

  constructor(
    @InjectModel(PatientPrescriptionUpload.name)
    private uploadModel: Model<PatientPrescriptionUploadDocument>,
    @InjectModel(WhatsAppPrescriptionQueue.name)
    private queueModel: Model<WhatsAppPrescriptionQueueDocument>,
    private readonly verificationService: PrescriptionVerificationService,
    private readonly prescriptionNumberHelper: PrescriptionNumberHelper,
    private readonly httpService: HttpService,
    private readonly twilioService: WhatsAppTwilioService,
  ) {
    super();
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY,
      secretAccessKey: process.env.AWS_ACCESS_SECRET_KEY,
      region: process.env.AWS_REGION || 'us-east-2',
    });
  }

  async onEnter(context: FlowContext): Promise<FlowHandlerResult> {
    return this.respond(MESSAGES.PRESCRIPTION_UPLOAD_PROMPT);
  }

  async handle(context: FlowContext): Promise<FlowHandlerResult> {
    const { message, session, identity } = context;
    const step = session.flow_step;

    switch (step) {
      case 0:
        // Waiting for image
        if (message.type === 'image' && message.media?.length) {
          return this.handleImageUpload(context);
        }
        return this.respond(
          'Please send a photo of your prescription, or send "cancel" to go back to the menu.',
        );

      case 1:
        // Processing - check for additional images or text responses
        if (message.type === 'image' && message.media?.length) {
          // User sent another image - might be multi-page prescription
          return this.handleAdditionalImage(context);
        }
        // Check status
        return this.handleCheckStatus(context);

      case 2:
        // Results shown - handle user response
        return this.handleResultsResponse(context);

      case 3:
        // Clarification response
        return this.handleClarificationResponse(context);

      default:
        return this.endFlow(MESSAGES.MENU());
    }
  }

  /**
   * Handle initial image upload
   */
  private async handleImageUpload(
    context: FlowContext,
  ): Promise<FlowHandlerResult> {
    const { message, session, identity } = context;
    const mediaUrl = message.media![0].url;
    const mediaType = message.media![0].contentType;

    if (!identity.patient_id) {
      return this.endFlow(
        'Please link your account first before uploading prescriptions.\n\nSend "menu" to start.',
      );
    }

    try {
      // Download image from Twilio
      const imageBuffer = await this.downloadMedia(mediaUrl);

      // Upload to S3
      const bucket = process.env.AWS_BUCKET_NAME || 'rapidcapsule';
      const key = `prescriptions/${identity.patient_id}/whatsapp/${uuidv4()}.${this.getExtension(mediaType)}`;

      const uploadResult = await this.s3
        .upload({
          Bucket: bucket,
          Key: key,
          Body: imageBuffer,
          ContentType: mediaType,
        })
        .promise();

      // Generate prescription number
      const prescriptionNumber =
        await this.prescriptionNumberHelper.generatePrescriptionNumber();

      // Create prescription upload record
      const upload = new this.uploadModel({
        patient: identity.patient_id,
        prescription_number: prescriptionNumber,
        original_filename: `whatsapp-${Date.now()}.${this.getExtension(mediaType)}`,
        mimetype: mediaType,
        file_size: imageBuffer.length,
        s3_key: key,
        s3_bucket: bucket,
        s3_url: uploadResult.Location,
        upload_source: UploadSource.MOBILE_CAMERA,
        processing_status: ProcessingStatus.PENDING,
        verification_status: VerificationStatus.PENDING,
        fraud_score: 0,
        fraud_flags: [],
        usage_count: 0,
        used_in_orders: [],
        is_deleted: false,
      });

      await upload.save();

      this.logger.log(
        `Prescription uploaded via WhatsApp: ${upload._id} for patient ${identity.patient_id}`,
      );

      // Start verification pipeline asynchronously
      this.startVerificationAsync(upload._id, identity.patient_id, context);

      return {
        response: MESSAGES.PRESCRIPTION_RECEIVED,
        newStep: 1,
        newFlowData: {
          prescription_id: upload._id.toString(),
          prescription_number: prescriptionNumber,
          status: 'PROCESSING',
        },
      };
    } catch (error) {
      this.logger.error('Failed to upload prescription:', error);
      return this.respond(
        'Sorry, there was an error uploading your prescription. Please try again.\n\nIf the problem persists, send "human" to speak with a pharmacist.',
      );
    }
  }

  /**
   * Handle additional image upload (multi-page prescription)
   */
  private async handleAdditionalImage(
    context: FlowContext,
  ): Promise<FlowHandlerResult> {
    // For now, we'll handle single-page prescriptions
    // Multi-page support can be added later
    return this.respond(
      'Your prescription is still being processed. Additional pages are not supported yet.\n\nPlease wait for the results or send "cancel" to start over.',
    );
  }

  /**
   * Handle status check during processing
   */
  private async handleCheckStatus(
    context: FlowContext,
  ): Promise<FlowHandlerResult> {
    const prescriptionId = this.getFlowData<string>(context, 'prescription_id');

    if (!prescriptionId) {
      return this.endFlow(
        'Session data lost. Please try uploading again.\n\nSend "menu" for options.',
      );
    }

    try {
      const upload = await this.uploadModel.findById(prescriptionId);

      if (!upload) {
        return this.endFlow(
          'Prescription not found. Please try uploading again.\n\nSend "menu" for options.',
        );
      }

      // Check verification status
      switch (upload.verification_status) {
        case VerificationStatus.PENDING:
        case VerificationStatus.TIER1_PROCESSING:
        case VerificationStatus.TIER2_PROCESSING:
          return this.respond(MESSAGES.PRESCRIPTION_PROCESSING);

        case VerificationStatus.APPROVED:
        case VerificationStatus.TIER1_PASSED:
        case VerificationStatus.TIER2_PASSED:
          return this.handleVerificationSuccess(upload, context);

        case VerificationStatus.PHARMACIST_REVIEW:
          return {
            response: MESSAGES.PRESCRIPTION_NEEDS_REVIEW,
            newStep: 2,
            newFlowData: {
              ...context.session.flow_data,
              status: 'PENDING_REVIEW',
            },
          };

        case VerificationStatus.CLARIFICATION_NEEDED:
          return this.handleClarificationNeeded(upload, context);

        case VerificationStatus.TIER1_FAILED:
        case VerificationStatus.TIER2_FAILED:
        case VerificationStatus.REJECTED:
          return this.handleVerificationFailed(upload, context);

        default:
          return this.respond(
            'Your prescription is being processed. Please wait a moment and try again.',
          );
      }
    } catch (error) {
      this.logger.error('Error checking prescription status:', error);
      return this.respond(
        'Sorry, there was an error checking your prescription status. Please try again.',
      );
    }
  }

  /**
   * Handle successful verification
   */
  private async handleVerificationSuccess(
    upload: PatientPrescriptionUploadDocument,
    context: FlowContext,
  ): Promise<FlowHandlerResult> {
    const medications =
      upload.verified_medications?.map((med) => ({
        name: med.matched_drug_name || med.prescription_medication_name,
        dosage: med.dosage || 'As prescribed',
        quantity: med.quantity || '1',
      })) || [];

    if (medications.length === 0) {
      return this.respond(
        'Your prescription was verified but no medications were found. Please speak to a pharmacist.\n\nReply "human" for assistance or "menu" for options.',
      );
    }

    // Calculate estimated total (placeholder - would need drug prices)
    const total = 'To be calculated';

    return {
      response: MESSAGES.PRESCRIPTION_VERIFIED(medications, total),
      newStep: 2,
      newFlowData: {
        ...context.session.flow_data,
        status: 'VERIFIED',
        medications,
      },
    };
  }

  /**
   * Handle verification failure
   */
  private async handleVerificationFailed(
    upload: PatientPrescriptionUploadDocument,
    context: FlowContext,
  ): Promise<FlowHandlerResult> {
    // Get failure reason from rejection_reason or processing_error
    const reason =
      upload.rejection_reason ||
      upload.processing_error ||
      'Unable to verify prescription';

    return {
      response: MESSAGES.PRESCRIPTION_FAILED(reason),
      newStep: 2,
      newFlowData: {
        ...context.session.flow_data,
        status: 'FAILED',
        failure_reason: reason,
      },
    };
  }

  /**
   * Handle clarification needed
   */
  private async handleClarificationNeeded(
    upload: PatientPrescriptionUploadDocument,
    context: FlowContext,
  ): Promise<FlowHandlerResult> {
    const clarification = (upload as any).clarification;
    const message = clarification?.request_message || 'Additional information needed';
    const items = clarification?.required_information || [];

    return {
      response: MESSAGES.PRESCRIPTION_CLARIFICATION(message, items),
      newStep: 3,
      newFlowData: {
        ...context.session.flow_data,
        status: 'CLARIFICATION_NEEDED',
        clarification_request: message,
      },
    };
  }

  /**
   * Handle user response after showing results
   */
  private async handleResultsResponse(
    context: FlowContext,
  ): Promise<FlowHandlerResult> {
    const { message } = context;
    const text = message.body?.trim() || '';
    const status = this.getFlowData<string>(context, 'status');

    // Handle menu selection
    const choice = this.parseNumericResponse(text);

    if (status === 'VERIFIED') {
      if (choice === 1) {
        // Order Now - transition to order flow
        return {
          response:
            'Order creation will be available soon. For now, please place orders through our app.\n\nSend "menu" for other options.',
          newFlow: FlowType.IDLE,
          newStep: 0,
        };
      } else if (choice === 2) {
        // View Details
        const medications = this.getFlowData<any[]>(context, 'medications') || [];
        const details = medications
          .map(
            (m, i) =>
              `${i + 1}. *${m.name}*\n   Dosage: ${m.dosage}\n   Quantity: ${m.quantity}`,
          )
          .join('\n\n');

        return this.respond(
          `*Prescription Details*\n\n${details}\n\nReply:\n1. Order Now\n3. Go to Menu`,
        );
      } else if (choice === 3) {
        return this.endFlow(MESSAGES.MENU());
      }
    } else if (status === 'FAILED') {
      if (choice === 1) {
        // Try again
        return this.transitionTo(
          FlowType.PRESCRIPTION_UPLOAD,
          0,
          {},
          MESSAGES.PRESCRIPTION_UPLOAD_PROMPT,
        );
      } else if (choice === 2) {
        // Speak to pharmacist
        return {
          response: MESSAGES.QUEUE_PHARMACIST_ESCALATION,
          newFlow: FlowType.PHARMACIST_CHAT,
          newStep: 0,
        };
      }
    }

    // Invalid input
    return this.respond(MESSAGES.INVALID_INPUT('Please reply with a number.'));
  }

  /**
   * Handle clarification response from user
   */
  private async handleClarificationResponse(
    context: FlowContext,
  ): Promise<FlowHandlerResult> {
    const { message } = context;
    const prescriptionId = this.getFlowData<string>(context, 'prescription_id');

    if (!prescriptionId) {
      return this.endFlow(
        'Session data lost. Please try uploading again.\n\nSend "menu" for options.',
      );
    }

    // Check if user sent an image
    if (message.type === 'image' && message.media?.length) {
      // Handle additional document upload for clarification
      // For now, just acknowledge it
      return this.respond(
        'Thank you for the additional document. Our pharmacist will review it shortly.\n\nYou\'ll be notified when the review is complete.\n\nSend "menu" for other options.',
      );
    }

    // Handle text response
    const responseText = message.body?.trim();
    if (!responseText) {
      return this.respond(
        'Please provide the requested information, or send a photo if needed.',
      );
    }

    try {
      // Update prescription with clarification response
      await this.uploadModel.updateOne(
        { _id: new Types.ObjectId(prescriptionId) },
        {
          $set: {
            verification_status: VerificationStatus.CLARIFICATION_RECEIVED,
            'clarification.response_message': responseText,
            'clarification.responded_at': new Date(),
          },
        },
      );

      return {
        response:
          "Thank you! Your response has been submitted to our pharmacist for review.\n\nYou'll be notified when the review is complete.\n\nSend \"menu\" for other options.",
        newFlow: FlowType.IDLE,
        newStep: 0,
      };
    } catch (error) {
      this.logger.error('Error submitting clarification:', error);
      return this.respond(
        'Sorry, there was an error submitting your response. Please try again.',
      );
    }
  }

  /**
   * Start verification pipeline asynchronously
   */
  private async startVerificationAsync(
    uploadId: Types.ObjectId,
    patientId: Types.ObjectId,
    context: FlowContext,
  ): Promise<void> {
    try {
      await this.verificationService.startVerificationPipeline(
        uploadId,
        patientId,
      );

      // After verification completes, notify patient via WhatsApp
      const upload = await this.uploadModel.findById(uploadId);
      if (upload) {
        await this.notifyVerificationComplete(upload, context);
      }
    } catch (error) {
      this.logger.error(
        `Verification pipeline error for ${uploadId}:`,
        error,
      );
      // Optionally notify user of failure
    }
  }

  /**
   * Notify patient when verification completes
   */
  private async notifyVerificationComplete(
    upload: PatientPrescriptionUploadDocument,
    context: FlowContext,
  ): Promise<void> {
    try {
      const { message } = context;

      switch (upload.verification_status) {
        case VerificationStatus.APPROVED:
          const medications =
            upload.verified_medications?.map((med) => ({
              name: med.matched_drug_name || med.prescription_medication_name,
              dosage: med.dosage || 'As prescribed',
              quantity: med.quantity || '1',
            })) || [];

          if (medications.length > 0) {
            await this.twilioService.sendTextMessage(
              message.from,
              MESSAGES.PRESCRIPTION_VERIFIED(medications, 'To be calculated'),
            );
          }
          break;

        case VerificationStatus.PHARMACIST_REVIEW:
          await this.twilioService.sendTextMessage(
            message.from,
            MESSAGES.PRESCRIPTION_NEEDS_REVIEW,
          );
          break;

        case VerificationStatus.REJECTED:
        case VerificationStatus.TIER1_FAILED:
        case VerificationStatus.TIER2_FAILED:
          const reason =
            upload.rejection_reason ||
            upload.processing_error ||
            'Verification failed';
          await this.twilioService.sendTextMessage(
            message.from,
            MESSAGES.PRESCRIPTION_FAILED(reason),
          );
          break;

        case VerificationStatus.CLARIFICATION_NEEDED:
          const clarification = (upload as any).clarification;
          const msg =
            clarification?.request_message || 'Additional information needed';
          const items = clarification?.required_information || [];
          await this.twilioService.sendTextMessage(
            message.from,
            MESSAGES.PRESCRIPTION_CLARIFICATION(msg, items),
          );
          break;
      }
    } catch (error) {
      this.logger.error('Failed to send verification notification:', error);
    }
  }

  /**
   * Download media from Twilio URL
   */
  private async downloadMedia(url: string): Promise<Buffer> {
    const response = await firstValueFrom(
      this.httpService.get(url, {
        responseType: 'arraybuffer',
        auth: {
          username: process.env.TWILIO_ACCOUNT_SID || '',
          password: process.env.TWILIO_AUTH_TOKEN || '',
        },
      } as any),
    );

    return Buffer.from(response.data);
  }

  /**
   * Get file extension from MIME type
   */
  private getExtension(mimeType: string): string {
    const map: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'application/pdf': 'pdf',
    };
    return map[mimeType] || 'jpg';
  }
}
