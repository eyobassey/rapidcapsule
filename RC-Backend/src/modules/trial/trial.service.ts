import {
  Injectable,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import * as AWS from 'aws-sdk';
import { TrialSession, TrialSessionDocument, TrialStatus } from './trial.entity';
import {
  RequestTrialDto,
  TrialBeginCheckupDto,
  TrialParseTextDto,
  TrialDiagnosisDto,
  TrialSearchDto,
  TrialRiskFactorsDto,
  TrialSuggestedSymptomsDto,
  TrialRxGPTDto,
  TrialAISummaryDto,
} from './trial.dto';
import { HealthCheckupService } from '../health-checkup/health-checkup.service';
import { RxGPTService } from '../pharmacy/services/rxgpt.service';
import { PrescriptionVerificationService } from '../pharmacy/services/prescription-verification.service';
import { PrescriptionNumberHelper } from '../../common/helpers/prescription-number.helper';
import {
  PatientPrescriptionUpload,
  PatientPrescriptionUploadDocument,
  UploadSource,
  ProcessingStatus,
  VerificationStatus,
} from '../pharmacy/entities/patient-prescription-upload.entity';
import { ClaudeHealthSummaryService } from '../health-checkup/services/claude-health-summary.service';
import { GeneralHelpers } from '../../common/helpers/general.helpers';
import { trialEmail } from '../../core/emails/mails/trialEmail';
import { CheckupOwner } from '../health-checkup/entities/health-checkup.entity';
import { EkaService } from '../eka/eka.service';
import { TrialSettings, TrialSettingsDocument } from './trial-settings.entity';

const TRIAL_EXPIRY_HOURS = 48;
const MAX_IP_REQUESTS_PER_DAY = 3;
const MAX_VERIFICATION_ATTEMPTS = 5;

// Server-side whitelist for internal testing — bypasses abuse prevention
const WHITELISTED_EMAILS = ['eyobassey@gmail.com'];

// Common disposable email domains
const DISPOSABLE_DOMAINS = [
  'mailinator.com', 'guerrillamail.com', 'tempmail.com', 'throwaway.email',
  'yopmail.com', 'sharklasers.com', 'guerrillamailblock.com', 'grr.la',
  'guerrillamail.info', 'guerrillamail.net', 'guerrillamail.org', 'guerrillamail.de',
  'tempail.com', 'dispostable.com', 'mailnesia.com', 'tempr.email',
  'temp-mail.org', 'fakeinbox.com', 'trashmail.com', 'trashmail.me',
  'trashmail.net', 'mailcatch.com', 'maildrop.cc', 'discard.email',
  'mailsac.com', 'getairmail.com', 'meltmail.com', '10minutemail.com',
  'minutemail.com', 'tempinbox.com', 'mohmal.com', 'burnermail.io',
  'getnada.com', 'emailondeck.com', 'inboxkitten.com', 'mytemp.email',
  'harakirimail.com', 'spamgourmet.com', 'mailexpire.com', 'jetable.org',
  'disposableemailaddresses.emailmiser.com', 'crazymailing.com',
  'filzmail.com', 'eyepaste.com', 'mintemail.com', 'tempmailer.com',
  'guerrillamailblock.com',
];

@Injectable()
export class TrialService {
  private readonly logger = new Logger(TrialService.name);
  // System trial user ID for Infermedica calls (ObjectId-like string)
  private readonly TRIAL_SYSTEM_USER_ID = '000000000000000000000001';
  // System specialist ID for RxGPT trial calls
  private readonly TRIAL_SYSTEM_SPECIALIST_ID = '000000000000000000000002';
  // System patient ID for trial prescription uploads
  private readonly TRIAL_SYSTEM_PATIENT_ID = '000000000000000000000003';
  private s3: AWS.S3;

  constructor(
    @InjectModel(TrialSession.name)
    private trialSessionModel: Model<TrialSessionDocument>,
    @InjectModel(PatientPrescriptionUpload.name)
    private uploadModel: Model<PatientPrescriptionUploadDocument>,
    @InjectModel(TrialSettings.name)
    private trialSettingsModel: Model<TrialSettingsDocument>,
    private readonly healthCheckupService: HealthCheckupService,
    private readonly rxgptService: RxGPTService,
    private readonly prescriptionVerificationService: PrescriptionVerificationService,
    private readonly prescriptionNumberHelper: PrescriptionNumberHelper,
    private readonly claudeHealthSummaryService: ClaudeHealthSummaryService,
    private readonly generalHelpers: GeneralHelpers,
    private readonly ekaService: EkaService,
  ) {
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY,
      secretAccessKey: process.env.AWS_ACCESS_SECRET_KEY,
      region: process.env.AWS_REGION || 'us-east-2',
    });
  }

  // ============ HASHING ============

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  // ============ ABUSE PREVENTION ============

  private isDisposableEmail(email: string): boolean {
    const domain = email.split('@')[1]?.toLowerCase();
    return DISPOSABLE_DOMAINS.includes(domain);
  }

  private async hasActiveTrialForEmail(email: string): Promise<boolean> {
    const existing = await this.trialSessionModel.findOne({
      email: email.toLowerCase(),
      status: { $in: [TrialStatus.PENDING, TrialStatus.VERIFIED] },
      expires_at: { $gt: new Date() },
    });
    return !!existing;
  }

  private async isIPRateLimited(ip: string): Promise<boolean> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const count = await this.trialSessionModel.countDocuments({
      ip_address: ip,
      created_at: { $gte: twentyFourHoursAgo },
    });
    return count >= MAX_IP_REQUESTS_PER_DAY;
  }

  private getClientIP(req: any): string {
    return (
      req.headers['cf-connecting-ip'] ||
      req.headers['x-real-ip'] ||
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.connection?.remoteAddress ||
      req.ip ||
      'unknown'
    );
  }

  // ============ TRIAL REQUEST ============

  async requestTrial(
    dto: RequestTrialDto,
    req: any,
  ): Promise<{ success: boolean; message: string }> {
    const email = dto.email.toLowerCase().trim();
    const ip = this.getClientIP(req);
    const userAgent = req.headers['user-agent'] || '';
    const isWhitelisted = WHITELISTED_EMAILS.includes(email);

    // 1. Check disposable email
    if (!isWhitelisted && this.isDisposableEmail(email)) {
      throw new BadRequestException(
        'Please use a valid email address. Disposable email addresses are not allowed.',
      );
    }

    // 2. Check if email already has active trial
    if (!isWhitelisted && await this.hasActiveTrialForEmail(email)) {
      throw new ConflictException(
        'A trial link has already been sent to this email address. Please check your inbox.',
      );
    }

    // 3. Check IP rate limit
    if (!isWhitelisted && await this.isIPRateLimited(ip)) {
      throw new ForbiddenException(
        'Too many trial requests. Please try again later.',
      );
    }

    // For whitelisted emails, expire previous sessions so a fresh one can be created
    if (isWhitelisted) {
      await this.trialSessionModel.updateMany(
        { email, status: { $in: [TrialStatus.PENDING, TrialStatus.VERIFIED] } },
        { status: TrialStatus.EXPIRED },
      );
    }

    // 4. Generate token
    const rawToken = uuidv4();
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + TRIAL_EXPIRY_HOURS * 60 * 60 * 1000);

    // 5. Create trial session
    await this.trialSessionModel.create({
      email,
      first_name: dto.first_name.trim(),
      last_name: dto.last_name.trim(),
      token_hash: tokenHash,
      ip_address: ip,
      user_agent: userAgent,
      status: TrialStatus.PENDING,
      expires_at: expiresAt,
    });

    // 6. Send magic link email
    const magicLink = `https://rapidcapsule.com/trial/verify/${rawToken}`;
    const emailBody = trialEmail(dto.first_name.trim(), magicLink);

    try {
      await this.generalHelpers.sendEmail(
        email,
        'Your Rapid Capsule Free Trial Access',
        emailBody,
      );
      this.logger.log(`Trial email sent to ${email} from IP ${ip}`);
    } catch (error) {
      this.logger.error(`Failed to send trial email to ${email}`, error);
      // Still return success — don't leak email delivery status
    }

    return {
      success: true,
      message: 'A magic link has been sent to your email address. Please check your inbox.',
    };
  }

  // ============ TOKEN VERIFICATION ============

  async verifyToken(token: string): Promise<{
    valid: boolean;
    first_name?: string;
    symptom_checker_available?: boolean;
    rxgpt_available?: boolean;
    prescription_available?: boolean;
    eka_available?: boolean;
    eka_messages_used?: number;
    eka_message_limit?: number;
  }> {
    const tokenHash = this.hashToken(token);

    const session = await this.trialSessionModel.findOne({ token_hash: tokenHash });

    if (!session) {
      throw new UnauthorizedException('Invalid trial link. Please request a new one.');
    }

    // Check expiry
    if (session.expires_at < new Date()) {
      await this.trialSessionModel.updateOne(
        { _id: session._id },
        { status: TrialStatus.EXPIRED },
      );
      throw new UnauthorizedException('This trial link has expired. Please request a new one.');
    }

    // Check verification attempts
    if (session.verification_attempts >= MAX_VERIFICATION_ATTEMPTS) {
      throw new ForbiddenException('Too many verification attempts.');
    }

    // Increment verification attempts
    await this.trialSessionModel.updateOne(
      { _id: session._id },
      {
        $inc: { verification_attempts: 1 },
        $set: {
          status: TrialStatus.VERIFIED,
          verified_at: new Date(),
          last_activity_at: new Date(),
        },
      },
    );

    const settings = await this.getTrialSettings();

    return {
      valid: true,
      first_name: session.first_name,
      symptom_checker_available: !session.symptom_checker_used,
      rxgpt_available: !(session as any).rxgpt_used,
      prescription_available: !(session as any).prescription_used,
      eka_available: !(session as any).eka_chat_used,
      eka_messages_used: (session as any).eka_message_count || 0,
      eka_message_limit: settings.eka_message_limit,
    };
  }

  // ============ SESSION VALIDATION (used by guard) ============

  async validateTrialSession(token: string): Promise<TrialSessionDocument> {
    const tokenHash = this.hashToken(token);

    const session = await this.trialSessionModel.findOne({
      token_hash: tokenHash,
      status: TrialStatus.VERIFIED,
    });

    if (!session) {
      throw new UnauthorizedException('Invalid or unverified trial session.');
    }

    if (session.expires_at < new Date()) {
      await this.trialSessionModel.updateOne(
        { _id: session._id },
        { status: TrialStatus.EXPIRED },
      );
      throw new UnauthorizedException('Trial session has expired.');
    }

    // Update last activity
    await this.trialSessionModel.updateOne(
      { _id: session._id },
      { last_activity_at: new Date() },
    );

    return session;
  }

  // ============ GET SESSION STATUS ============

  async getSessionStatus(token: string) {
    const session = await this.validateTrialSession(token);
    const settings = await this.getTrialSettings();

    return {
      first_name: session.first_name,
      last_name: session.last_name,
      symptom_checker_available: !session.symptom_checker_used,
      rxgpt_available: !(session as any).rxgpt_used,
      prescription_available: !(session as any).prescription_used,
      eka_available: !(session as any).eka_chat_used,
      eka_messages_used: (session as any).eka_message_count || 0,
      eka_message_limit: settings.eka_message_limit,
      expires_at: session.expires_at,
    };
  }

  // ============ TRIAL SETTINGS ============

  private async getTrialSettings(): Promise<{ eka_message_limit: number; eka_enabled: boolean }> {
    const settings = await this.trialSettingsModel.findOne().lean();
    return {
      eka_message_limit: settings?.eka_message_limit ?? 15,
      eka_enabled: settings?.eka_enabled ?? true,
    };
  }

  // ============ SYMPTOM CHECKER PROXY ============

  async trialBeginCheckup(token: string, dto: TrialBeginCheckupDto) {
    const session = await this.validateTrialSession(token);

    if (session.symptom_checker_used) {
      throw new ForbiddenException(
        'You have already used your trial Symptom Checker. Sign up for unlimited access.',
      );
    }

    const trialUserId = new Types.ObjectId(this.TRIAL_SYSTEM_USER_ID);
    const result = await this.healthCheckupService.beginCheckup(
      {
        health_check_for: CheckupOwner.SELF,
        checkup_owner_id: trialUserId,
      } as any,
      trialUserId as any,
    );

    // Store the interview token on the session for subsequent calls
    if (result?.interview_token) {
      await this.trialSessionModel.updateOne(
        { _id: session._id },
        { interview_token: result.interview_token },
      );
    }

    return result;
  }

  async trialParseFreeText(token: string, dto: TrialParseTextDto) {
    await this.validateTrialSession(token);

    const result = await this.healthCheckupService.parseFreeText(
      { text: dto.text, extras: {} } as any,
      dto.interview_token,
    );

    return result?.data;
  }

  async trialDiagnosis(token: string, dto: TrialDiagnosisDto) {
    const session = await this.validateTrialSession(token);

    if (session.symptom_checker_used) {
      throw new ForbiddenException(
        'You have already used your trial Symptom Checker. Sign up for unlimited access.',
      );
    }

    const result = await this.healthCheckupService.diagnosis(
      {
        evidence: dto.evidence,
        age: { value: dto.age, unit: 'year' },
        sex: dto.sex,
        interview_token: dto.interview_token,
        extras: {
          enable_symptom_duration: false,
          ...dto.extras,
        },
      } as any,
      new Types.ObjectId(this.TRIAL_SYSTEM_USER_ID) as any,
    );

    // If diagnosis is complete (has triage_level), mark as used
    if (result?.data?.triage_level) {
      await this.trialSessionModel.updateOne(
        { _id: session._id },
        {
          symptom_checker_used: true,
          symptom_checker_result: result.data,
          last_activity_at: new Date(),
        },
      );

      // Check if all features are now used
      if ((session as any).rxgpt_used && (session as any).prescription_used && (session as any).eka_chat_used) {
        await this.trialSessionModel.updateOne(
          { _id: session._id },
          { status: TrialStatus.EXHAUSTED },
        );
      }
    }

    return result?.data;
  }

  async trialSearch(token: string, dto: TrialSearchDto) {
    await this.validateTrialSession(token);

    const result = await this.healthCheckupService.search(
      {
        phrase: dto.phrase,
        sex: dto.sex,
        age: dto.age ? Number(dto.age) : undefined,
      } as any,
      dto.interview_token || undefined,
    );

    return result?.data;
  }

  async trialGetRiskFactors(token: string, dto: TrialRiskFactorsDto) {
    await this.validateTrialSession(token);

    const result = await this.healthCheckupService.getRiskFactors(
      Number(dto.age),
      dto.interview_token || undefined,
    );

    return result?.data;
  }

  async trialGetSuggestedSymptoms(token: string, dto: TrialSuggestedSymptomsDto) {
    await this.validateTrialSession(token);

    const result = await this.healthCheckupService.getSuggestedSymptoms(
      {
        evidence: dto.evidence,
        age: { value: dto.age, unit: 'year' },
        sex: dto.sex,
        extras: dto.extras,
      } as any,
      dto.interview_token,
    );

    return result?.data;
  }

  // ============ RXGPT PROXY ============

  async trialRxGPTAnalyze(token: string, dto: TrialRxGPTDto) {
    const session = await this.validateTrialSession(token);

    if (session.rxgpt_used) {
      throw new ForbiddenException(
        'You have already used your trial RxGPT analysis. Sign up for unlimited access.',
      );
    }

    // Build the standalone analyze DTO — pass through fields matching RxGPTStandaloneAnalyzeDto
    const standaloneDto: any = {
      diagnosis: dto.diagnosis,
    };

    if (dto.treatment_goal) {
      standaloneDto.treatment_goal = dto.treatment_goal;
    }

    if (dto.patient_context) {
      const ctx: any = {};
      if (dto.patient_context.age) ctx.age = dto.patient_context.age;
      if (dto.patient_context.gender) ctx.gender = dto.patient_context.gender;
      if (dto.patient_context.weight) ctx.weight = dto.patient_context.weight;
      if (dto.patient_context.allergies?.length) ctx.allergies = dto.patient_context.allergies;
      if (dto.patient_context.chronic_conditions?.length) ctx.chronic_conditions = dto.patient_context.chronic_conditions;
      if (dto.patient_context.current_medications?.length) {
        ctx.current_medications = dto.patient_context.current_medications.filter(m => m.name);
      }
      if (dto.patient_context.renal_impairment) ctx.renal_impairment = true;
      if (dto.patient_context.hepatic_impairment) ctx.hepatic_impairment = true;
      if (dto.patient_context.pregnant) ctx.pregnant = true;
      if (Object.keys(ctx).length) standaloneDto.patient_context = ctx;
    }

    if (dto.max_suggestions) {
      standaloneDto.max_suggestions = dto.max_suggestions;
    }

    if (dto.symptoms?.length) {
      standaloneDto.symptoms = dto.symptoms;
    }

    let result: any;
    try {
      result = await this.rxgptService.standaloneAnalyze(
        standaloneDto as any,
        this.TRIAL_SYSTEM_SPECIALIST_ID,
      );
    } catch (error) {
      // If credits/rate limit issue with system account, handle gracefully
      if (error?.status === 403) {
        this.logger.warn('Trial RxGPT analysis blocked by credits/rate limit', error.message);
        throw new BadRequestException(
          'The trial service is temporarily unavailable. Please try again later.',
        );
      }
      throw error;
    }

    // Mark as used
    await this.trialSessionModel.updateOne(
      { _id: session._id },
      {
        rxgpt_used: true,
        rxgpt_result: result,
        last_activity_at: new Date(),
      },
    );

    // Check if all features are now used
    if (session.symptom_checker_used && (session as any).prescription_used && (session as any).eka_chat_used) {
      await this.trialSessionModel.updateOne(
        { _id: session._id },
        { status: TrialStatus.EXHAUSTED },
      );
    }

    return result;
  }

  // ============ AI HEALTH SUMMARY ============

  async trialGenerateAISummary(token: string, dto: TrialAISummaryDto) {
    await this.validateTrialSession(token);

    const result = await this.claudeHealthSummaryService.generateHealthSummary(
      {
        conditions: dto.conditions || [],
        evidence: dto.evidence || [],
        triage_level: dto.triage_level,
        has_emergency_evidence: dto.has_emergency_evidence || false,
      },
      {
        age: dto.age,
        gender: dto.sex,
      },
    );

    return result;
  }

  // ============ PRESCRIPTION UPLOAD PROXY ============

  async trialPrescriptionUpload(
    token: string,
    file: Express.Multer.File,
    uploadSource?: string,
  ) {
    const session = await this.validateTrialSession(token);

    if (session.prescription_used) {
      throw new ForbiddenException(
        'You have already used your trial prescription verification. Sign up for unlimited access.',
      );
    }

    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const patientId = new Types.ObjectId(this.TRIAL_SYSTEM_PATIENT_ID);
    const bucket = process.env.AWS_BUCKET_NAME || 'rapidcapsule';
    const tokenHash = (session as any).token_hash;
    const key = `trial/prescriptions/${tokenHash}/${uuidv4()}-${file.originalname}`;

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

      // Generate prescription number
      const prescriptionNumber = await this.prescriptionNumberHelper.generatePrescriptionNumber();

      // Create upload record with is_trial flag
      const upload = new this.uploadModel({
        patient: patientId,
        prescription_number: prescriptionNumber,
        original_filename: file.originalname,
        mimetype: file.mimetype,
        file_size: file.size,
        s3_key: key,
        s3_bucket: bucket,
        s3_url: uploadResult.Location,
        upload_source: uploadSource === 'MOBILE_CAMERA' ? UploadSource.MOBILE_CAMERA : UploadSource.FILE_UPLOAD,
        processing_status: ProcessingStatus.PENDING,
        verification_status: VerificationStatus.PENDING,
        fraud_score: 0,
        fraud_flags: [],
        usage_count: 0,
        used_in_orders: [],
        is_trial: true,
        trial_patient_name: `${session.first_name} ${session.last_name}`.trim(),
        is_deleted: false,
      });

      await upload.save();

      // Store reference on trial session
      await this.trialSessionModel.updateOne(
        { _id: session._id },
        {
          prescription_upload_id: upload._id.toString(),
          last_activity_at: new Date(),
        },
      );

      // Start verification pipeline asynchronously
      this.prescriptionVerificationService
        .startVerificationPipeline(upload._id, patientId)
        .catch((error) => {
          this.logger.error('Trial prescription verification pipeline error:', error.message);
        });

      return {
        uploadId: upload._id.toString(),
        prescriptionNumber: upload.prescription_number,
        status: upload.verification_status,
        processingStatus: upload.processing_status,
      };
    } catch (error) {
      throw new BadRequestException(`Upload failed: ${error.message}`);
    }
  }

  async trialPrescriptionStatus(token: string, uploadId: string) {
    const session = await this.validateTrialSession(token);

    // Verify this upload belongs to this trial session
    if ((session as any).prescription_upload_id !== uploadId) {
      throw new ForbiddenException('Upload not found for this trial session');
    }

    const upload = await this.uploadModel.findOne({
      _id: new Types.ObjectId(uploadId),
      is_trial: true,
    });

    if (!upload) {
      throw new BadRequestException('Prescription upload not found');
    }

    // Get verification details
    const verification = await this.prescriptionVerificationService.getVerificationByUploadId(
      upload._id,
    );

    // Extract failure reasons
    const failureReasons: Array<{ reason: string; severity: string; details: string }> = [];

    if (verification?.tier1?.checks) {
      for (const check of verification.tier1.checks) {
        const severity = check.severity as string;
        if (!check.passed && severity !== 'INFO') {
          failureReasons.push({
            reason: check.check_name,
            severity,
            details: check.details,
          });
        }
      }
    }

    if (verification?.tier2?.checks) {
      for (const check of verification.tier2.checks) {
        const severity = check.severity as string;
        if (!check.passed && severity !== 'INFO') {
          failureReasons.push({
            reason: check.check_name,
            severity,
            details: check.details,
          });
        }
      }
    }

    // Add fraud flags as reasons
    if (verification?.fraud_detection?.flags) {
      for (const flag of verification.fraud_detection.flags) {
        failureReasons.push({
          reason: flag.flag_type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
          severity: flag.severity,
          details: flag.description,
        });
      }
    }

    // Patient summary from AI analysis
    const patientSummary = verification?.tier2?.ai_analysis?.patient_summary ||
                           verification?.tier1?.patient_summary || null;

    // Check if verification is complete (any terminal status)
    const terminalStatuses = ['APPROVED', 'REJECTED', 'PHARMACIST_REVIEW'];
    const isComplete = terminalStatuses.includes(upload.verification_status);

    // If complete and not yet marked as used, mark it
    if (isComplete && !(session as any).prescription_used) {
      await this.trialSessionModel.updateOne(
        { _id: session._id },
        {
          prescription_used: true,
          prescription_result: {
            status: upload.verification_status,
            score: verification?.overall_score || 0,
            medications_count: upload.verified_medications?.length || 0,
          },
          last_activity_at: new Date(),
        },
      );

      // Check if all four features are now used
      if ((session as any).symptom_checker_used && (session as any).rxgpt_used && (session as any).prescription_used && (session as any).eka_chat_used) {
        await this.trialSessionModel.updateOne(
          { _id: session._id },
          { status: TrialStatus.EXHAUSTED },
        );
      }
    }

    // Build transparent response with full scoring breakdown
    const result: any = {
      status: upload.verification_status,
      processingStatus: upload.processing_status,
      verifiedMedications: upload.verified_medications || [],
      failureReasons: failureReasons.length > 0 ? failureReasons : null,
      patientSummary,
    };

    if (verification) {
      result.verification = {
        overallResult: verification.overall_result,
        overallScore: verification.overall_score,
        confidenceScore: verification.confidence_score,
        currentTier: verification.current_tier,
        tier1: {
          status: verification.tier1.status,
          result: verification.tier1.result,
          score: verification.tier1.score,
          checks: verification.tier1.checks || [],
          processingTime: verification.tier1.processing_time_ms,
        },
        tier2: {
          status: verification.tier2.status,
          result: verification.tier2.result,
          score: verification.tier2.score,
          checks: verification.tier2.checks || [],
          processingTime: verification.tier2.processing_time_ms,
          aiAnalysis: verification.tier2.ai_analysis || null,
          medicationValidation: verification.tier2.medication_validation || null,
          doctorValidation: verification.tier2.doctor_validation || null,
        },
        fraudDetection: {
          score: verification.fraud_detection.score,
          riskLevel: verification.fraud_detection.risk_level,
          flags: verification.fraud_detection.flags || [],
          duplicatePrescription: verification.fraud_detection.duplicate_prescription,
          editedDocument: verification.fraud_detection.edited_document,
          invalidDoctor: verification.fraud_detection.invalid_doctor,
          suspiciousPattern: verification.fraud_detection.suspicious_pattern,
        },
        startedAt: verification.verification_started_at,
        completedAt: verification.verification_completed_at,
        totalProcessingTime: verification.total_processing_time_ms,
      };
    }

    return result;
  }

  // ============ EKA AI CHAT ============

  async *trialEkaChat(token: string, message: string, language?: string): AsyncGenerator<any> {
    const session = await this.validateTrialSession(token);
    const settings = await this.getTrialSettings();

    if (!settings.eka_enabled) {
      yield { type: 'error', content: 'Eka AI Chat is temporarily unavailable. Please try again later.' };
      return;
    }

    if ((session as any).eka_chat_used) {
      yield { type: 'exhausted', content: 'You have used all your trial messages. Sign up for unlimited access!' };
      return;
    }

    const messageCount = (session as any).eka_message_count || 0;
    const messageLimit = settings.eka_message_limit;

    if (messageCount >= messageLimit) {
      // Mark as used + check exhaustion
      await this.markEkaChatUsed(session);
      yield { type: 'exhausted', content: 'You have used all your trial messages. Sign up for unlimited access!' };
      return;
    }

    // Append user message + increment count
    const newCount = messageCount + 1;
    await this.trialSessionModel.updateOne(
      { _id: session._id },
      {
        $push: {
          eka_messages: {
            role: 'user',
            content: message,
            tools_used: [],
            created_at: new Date(),
          },
        },
        $set: {
          eka_message_count: newCount,
          last_activity_at: new Date(),
        },
      },
    );

    // Emit message count update
    yield {
      type: 'message_count',
      messages_used: newCount,
      message_limit: messageLimit,
      messages_remaining: messageLimit - newCount,
    };

    // Build existing messages for context
    const existingMessages = ((session as any).eka_messages || []).map((m: any) => ({
      role: m.role,
      content: m.content,
    }));

    // Delegate to EkaService
    let assistantText = '';
    let toolsUsed: string[] = [];

    for await (const event of this.ekaService.chatForTrial({
      message,
      firstName: session.first_name,
      messages: existingMessages,
      messagesUsed: newCount,
      messageLimit,
      language,
      systemUserId: this.TRIAL_SYSTEM_USER_ID,
    })) {
      if (event.type === 'done') {
        assistantText = event.assistantText || '';
        toolsUsed = event.toolsUsed || [];
      } else {
        yield event;
      }
    }

    // Save assistant response
    if (assistantText) {
      await this.trialSessionModel.updateOne(
        { _id: session._id },
        {
          $push: {
            eka_messages: {
              role: 'assistant',
              content: assistantText,
              tools_used: toolsUsed.length > 0 ? toolsUsed : [],
              created_at: new Date(),
            },
          },
        },
      );
    }

    // Check if message limit reached after this message
    if (newCount >= messageLimit) {
      await this.markEkaChatUsed(session);
      yield {
        type: 'exhausted',
        content: 'You have used all your trial messages. Sign up at rapidcapsule.com for unlimited access!',
      };
    }

    yield { type: 'done' };
  }

  async getEkaStatus(token: string) {
    const session = await this.validateTrialSession(token);
    const settings = await this.getTrialSettings();

    const messageCount = (session as any).eka_message_count || 0;
    const messageLimit = settings.eka_message_limit;

    return {
      first_name: session.first_name,
      messages_used: messageCount,
      message_limit: messageLimit,
      messages_remaining: Math.max(0, messageLimit - messageCount),
      eka_enabled: settings.eka_enabled,
      eka_exhausted: (session as any).eka_chat_used || false,
      messages: ((session as any).eka_messages || []).map((m: any) => ({
        role: m.role,
        content: m.content,
        tools_used: m.tools_used || [],
        created_at: m.created_at,
      })),
    };
  }

  private async markEkaChatUsed(session: TrialSessionDocument) {
    await this.trialSessionModel.updateOne(
      { _id: session._id },
      {
        eka_chat_used: true,
        eka_chat_result: {
          messages_sent: (session as any).eka_message_count || 0,
          completed_at: new Date(),
        },
        last_activity_at: new Date(),
      },
    );

    // Check if all four features are now used
    if (
      session.symptom_checker_used &&
      (session as any).rxgpt_used &&
      (session as any).prescription_used
    ) {
      await this.trialSessionModel.updateOne(
        { _id: session._id },
        { status: TrialStatus.EXHAUSTED },
      );
    }
  }

  // ============ TRIAL ANALYTICS ============

  async getTrialAnalytics() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Aggregate trial session stats
    const [totalStats, last30Stats, last7Stats, featureUsage, dailyTrend] = await Promise.all([
      // All-time totals
      this.trialSessionModel.aggregate([
        {
          $group: {
            _id: null,
            total_requests: { $sum: 1 },
            total_verified: {
              $sum: { $cond: [{ $in: ['$status', ['verified', 'exhausted']] }, 1, 0] },
            },
            total_exhausted: {
              $sum: { $cond: [{ $eq: ['$status', 'exhausted'] }, 1, 0] },
            },
            symptom_checker_used: {
              $sum: { $cond: ['$symptom_checker_used', 1, 0] },
            },
            rxgpt_used: {
              $sum: { $cond: ['$rxgpt_used', 1, 0] },
            },
            prescription_used: {
              $sum: { $cond: ['$prescription_used', 1, 0] },
            },
            eka_chat_used: {
              $sum: { $cond: ['$eka_chat_used', 1, 0] },
            },
            eka_total_messages: {
              $sum: { $ifNull: ['$eka_message_count', 0] },
            },
          },
        },
      ]),
      // Last 30 days
      this.trialSessionModel.countDocuments({ created_at: { $gte: thirtyDaysAgo } }),
      // Last 7 days
      this.trialSessionModel.countDocuments({ created_at: { $gte: sevenDaysAgo } }),
      // Feature usage breakdown (verified sessions only)
      this.trialSessionModel.aggregate([
        { $match: { status: { $in: ['verified', 'exhausted'] } } },
        {
          $group: {
            _id: null,
            only_symptom_checker: {
              $sum: {
                $cond: [
                  { $and: ['$symptom_checker_used', { $not: '$rxgpt_used' }, { $not: '$prescription_used' }] },
                  1, 0,
                ],
              },
            },
            only_rxgpt: {
              $sum: {
                $cond: [
                  { $and: ['$rxgpt_used', { $not: '$symptom_checker_used' }, { $not: '$prescription_used' }] },
                  1, 0,
                ],
              },
            },
            only_prescription: {
              $sum: {
                $cond: [
                  { $and: ['$prescription_used', { $not: '$symptom_checker_used' }, { $not: '$rxgpt_used' }] },
                  1, 0,
                ],
              },
            },
            used_all_three: {
              $sum: {
                $cond: [
                  { $and: ['$symptom_checker_used', '$rxgpt_used', '$prescription_used'] },
                  1, 0,
                ],
              },
            },
            used_none: {
              $sum: {
                $cond: [
                  { $and: [{ $not: '$symptom_checker_used' }, { $not: '$rxgpt_used' }, { $not: '$prescription_used' }] },
                  1, 0,
                ],
              },
            },
          },
        },
      ]),
      // Daily trend (last 30 days)
      this.trialSessionModel.aggregate([
        { $match: { created_at: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$created_at' },
            },
            count: { $sum: 1 },
            verified: {
              $sum: { $cond: [{ $in: ['$status', ['verified', 'exhausted']] }, 1, 0] },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const stats = totalStats[0] || {
      total_requests: 0,
      total_verified: 0,
      total_exhausted: 0,
      symptom_checker_used: 0,
      rxgpt_used: 0,
      prescription_used: 0,
      eka_chat_used: 0,
      eka_total_messages: 0,
    };

    const usage = featureUsage[0] || {
      only_symptom_checker: 0,
      only_rxgpt: 0,
      only_prescription: 0,
      used_all_three: 0,
      used_none: 0,
    };

    return {
      overview: {
        total_requests: stats.total_requests,
        total_verified: stats.total_verified,
        verification_rate: stats.total_requests > 0
          ? Math.round((stats.total_verified / stats.total_requests) * 100)
          : 0,
        total_exhausted: stats.total_exhausted,
        last_30_days: last30Stats,
        last_7_days: last7Stats,
      },
      feature_usage: {
        symptom_checker: stats.symptom_checker_used,
        rxgpt: stats.rxgpt_used,
        prescription: stats.prescription_used,
        eka_chat: stats.eka_chat_used,
      },
      eka_engagement: {
        total_eka_users: stats.eka_chat_used,
        total_messages_sent: stats.eka_total_messages,
        avg_messages_per_user: stats.eka_chat_used > 0
          ? Math.round(stats.eka_total_messages / stats.eka_chat_used)
          : 0,
      },
      engagement: usage,
      daily_trend: dailyTrend,
    };
  }
}
