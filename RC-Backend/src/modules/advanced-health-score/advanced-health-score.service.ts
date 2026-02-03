import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import Anthropic from '@anthropic-ai/sdk';
import * as moment from 'moment';

import {
  AdvancedHealthScore,
  AdvancedHealthScoreDocument,
} from './entities/advanced-health-score.entity';
import {
  AdvancedScoreQuestion,
  AdvancedScoreQuestionDocument,
} from './entities/advanced-score-question.entity';
import {
  AdvancedScoreSettings,
  AdvancedScoreSettingsDocument,
  DEFAULT_SETTINGS,
} from './entities/advanced-score-settings.entity';
import {
  HealthCheckup,
  HealthCheckupDocument,
} from '../health-checkup/entities/health-checkup.entity';
import { SubmitAssessmentDto } from './dto/submit-assessment.dto';
import {
  HealthDomain,
  DOMAIN_LABELS,
  AssessmentStatus,
  ProfileSnapshot,
  HealthReport,
  ConfidenceLevel,
  PriorityLevel,
  UploadedDocument,
  HealthCheckupSummary,
} from './types/advanced-score.types';
import { SEED_QUESTIONS } from './data/seed-questions';
import { ClaudeSummaryCreditsService } from '../claude-summary-credits/claude-summary-credits.service';
import { UsersService } from '../users/users.service';
import { VitalsService } from '../vitals/vitals.service';
import { FileUploadHelper } from '../../common/helpers/file-upload.helpers';

@Injectable()
export class AdvancedHealthScoreService {
  private readonly logger = new Logger(AdvancedHealthScoreService.name);
  private claudeClient: Anthropic | null = null;

  constructor(
    @InjectModel(AdvancedHealthScore.name)
    private scoreModel: Model<AdvancedHealthScoreDocument>,
    @InjectModel(AdvancedScoreQuestion.name)
    private questionModel: Model<AdvancedScoreQuestionDocument>,
    @InjectModel(AdvancedScoreSettings.name)
    private settingsModel: Model<AdvancedScoreSettingsDocument>,
    @InjectModel(HealthCheckup.name)
    private healthCheckupModel: Model<HealthCheckupDocument>,
    private claudeCreditsService: ClaudeSummaryCreditsService,
    private usersService: UsersService,
    private vitalsService: VitalsService,
    private fileUploadHelper: FileUploadHelper,
  ) {
    this.initializeClaudeClient();
  }

  private initializeClaudeClient() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey) {
      try {
        this.claudeClient = new Anthropic({ apiKey });
        this.logger.log('Claude AI client initialized for Advanced Health Score');
      } catch (error) {
        this.logger.error('Failed to initialize Claude AI client:', error);
      }
    } else {
      this.logger.warn('ANTHROPIC_API_KEY not configured');
    }
  }

  // =====================
  // Settings Management
  // =====================

  async getSettings(): Promise<AdvancedScoreSettingsDocument> {
    let settings = await this.settingsModel.findOne();
    if (!settings) {
      settings = await this.settingsModel.create(DEFAULT_SETTINGS);
    }
    return settings;
  }

  async ensureSettingsExist(): Promise<void> {
    const exists = await this.settingsModel.findOne();
    if (!exists) {
      await this.settingsModel.create(DEFAULT_SETTINGS);
      this.logger.log('Created default Advanced Health Score settings');
    }
  }

  // =====================
  // Questions Management
  // =====================

  async getActiveQuestions(): Promise<AdvancedScoreQuestionDocument[]> {
    return this.questionModel
      .find({ is_active: true })
      .sort({ domain_order: 1, question_order: 1 })
      .lean();
  }

  async getQuestionsByDomain(): Promise<
    Record<HealthDomain, AdvancedScoreQuestionDocument[]>
  > {
    const questions = await this.getActiveQuestions();
    const grouped: Record<string, AdvancedScoreQuestionDocument[]> = {};

    for (const q of questions) {
      if (!grouped[q.domain]) {
        grouped[q.domain] = [];
      }
      grouped[q.domain].push(q);
    }

    return grouped as Record<HealthDomain, AdvancedScoreQuestionDocument[]>;
  }

  async seedQuestions(): Promise<{ created: number; skipped: number }> {
    let created = 0;
    let skipped = 0;

    for (const q of SEED_QUESTIONS) {
      const exists = await this.questionModel.findOne({
        domain: q.domain,
        question_text: q.question_text,
      });

      if (exists) {
        skipped++;
        continue;
      }

      await this.questionModel.create(q);
      created++;
    }

    this.logger.log(
      `Seeded questions: ${created} created, ${skipped} skipped (already exist)`,
    );
    return { created, skipped };
  }

  // =====================
  // Assessment Flow
  // =====================

  /**
   * Get relevant health checkups for inclusion in the assessment
   * Returns checkups with suggested include/exclude status based on admin settings
   */
  async getRelevantHealthCheckups(userId: string | Types.ObjectId) {
    const settings = await this.getSettings();
    const userIdObj =
      typeof userId === 'string' ? new Types.ObjectId(userId) : userId;

    // Get checkups within the auto-exclude window (default 30 days)
    const autoExcludeDate = moment()
      .subtract(settings.checkup_auto_exclude_days || 30, 'days')
      .toDate();
    const autoIncludeDate = moment()
      .subtract(settings.checkup_auto_include_days || 14, 'days')
      .toDate();

    const checkups = await this.healthCheckupModel
      .find({
        user: userIdObj,
        deleted_at: { $exists: false },
        created_at: { $gte: autoExcludeDate },
      })
      .sort({ created_at: -1 })
      .limit(10)
      .lean();

    // Process checkups and determine suggested status
    const processedCheckups = checkups.map((checkup: any) => {
      const response = checkup.response?.data || {};
      const checkupDate = new Date(checkup.created_at);
      const triageLevel = response.triage_level || null;

      // Determine suggested status based on settings
      let suggestedStatus: 'include' | 'exclude' = 'include';
      let reason = '';

      // Rule 1: Auto-include if within auto-include window
      if (checkupDate >= autoIncludeDate) {
        suggestedStatus = 'include';
        reason = `Recent checkup (within ${settings.checkup_auto_include_days || 14} days)`;
      } else {
        // Rule 2: Suggest exclude if older than auto-include but within auto-exclude
        suggestedStatus = 'exclude';
        reason = `Older checkup (more than ${settings.checkup_auto_include_days || 14} days old)`;
      }

      // Rule 3: Exclude self-care triage if setting is enabled
      if (
        settings.exclude_self_care_triage &&
        triageLevel === 'self_care'
      ) {
        suggestedStatus = 'exclude';
        reason = 'Self-care triage level (minor symptoms)';
      }

      // Extract symptoms
      const evidence = checkup.request?.evidence || [];
      const symptoms = evidence
        .filter((e: any) => e.choice_id === 'present' && e.source !== 'predefined')
        .map((e: any) => e.common_name || e.name || e.id)
        .filter(Boolean)
        .slice(0, 5);

      // Get top conditions
      const conditions = (response.conditions || [])
        .slice(0, 3)
        .map((c: any) => ({
          name: c.common_name || c.name,
          probability: Math.round((c.probability || 0) * 100),
        }));

      return {
        checkup_id: checkup._id.toString(),
        date: moment(checkup.created_at).format('YYYY-MM-DD'),
        days_ago: moment().diff(moment(checkup.created_at), 'days'),
        triage_level: triageLevel,
        has_emergency_evidence: response.has_emergency_evidence || false,
        top_conditions: conditions,
        symptoms_reported: symptoms,
        ai_summary: checkup.claude_summary?.content?.overview || null,
        suggested_status: suggestedStatus,
        suggestion_reason: reason,
      };
    });

    return {
      checkups: processedCheckups,
      settings: {
        auto_include_days: settings.checkup_auto_include_days || 14,
        auto_exclude_days: settings.checkup_auto_exclude_days || 30,
        allow_patient_exclusion: settings.allow_patient_checkup_exclusion !== false,
        exclude_self_care_triage: settings.exclude_self_care_triage !== false,
      },
    };
  }

  async canStartAssessment(userId: string | Types.ObjectId) {
    const settings = await this.getSettings();
    const userIdObj =
      typeof userId === 'string' ? new Types.ObjectId(userId) : userId;

    if (!settings.is_enabled) {
      return {
        can_start: false,
        reason: 'Advanced Health Score is currently disabled',
        credits_required: settings.credit_cost,
        credits_available: 0,
        credit_source: 'none',
        previous_answers: null,
      };
    }

    const creditStatus = await this.claudeCreditsService.canGenerateSummary(userId);
    const fullCreditStatus = await this.claudeCreditsService.getCreditStatus(userId);

    // Check if user has enough credits - use total_available for display
    const totalCreditsAvailable =
      fullCreditStatus.total_available === 'unlimited'
        ? 999
        : fullCreditStatus.total_available as number;
    const hasEnoughCredits = totalCreditsAvailable >= settings.credit_cost;

    // Get previous assessment answers (within last 6 months)
    let previousAnswers: Record<string, any> | null = null;
    let previousAssessmentDate: Date | null = null;
    try {
      const sixMonthsAgo = moment().subtract(6, 'months').toDate();
      const lastAssessment = await this.scoreModel
        .findOne({
          user_id: userIdObj,
          status: AssessmentStatus.COMPLETED,
          created_at: { $gte: sixMonthsAgo },
        })
        .sort({ created_at: -1 })
        .select({ answers: 1, created_at: 1 })
        .lean();

      if (lastAssessment && lastAssessment.answers) {
        // Convert answers to a map of question_id -> answer for easy lookup
        previousAnswers = lastAssessment.answers.reduce((acc: any, answer: any) => {
          acc[answer.question_id] = {
            answer_value: answer.answer_value,
            answer_label: answer.answer_label,
          };
          return acc;
        }, {});
        previousAssessmentDate = lastAssessment.created_at;
      }
    } catch (e) {
      this.logger.warn('Could not fetch previous assessment answers:', e.message);
    }

    return {
      can_start: creditStatus.can_generate && hasEnoughCredits,
      reason: hasEnoughCredits ? null : 'Insufficient credits',
      credits_required: settings.credit_cost,
      credits_available: fullCreditStatus.total_available,
      credit_source: creditStatus.source,
      max_documents: settings.max_documents,
      allowed_file_types: settings.allowed_file_types,
      max_file_size_mb: settings.max_file_size_mb,
      previous_answers: previousAnswers,
      previous_assessment_date: previousAssessmentDate,
    };
  }

  async uploadDocument(
    userId: string | Types.ObjectId,
    file: Express.Multer.File,
  ): Promise<UploadedDocument> {
    const settings = await this.getSettings();
    const userIdObj =
      typeof userId === 'string' ? new Types.ObjectId(userId) : userId;

    // Validate file type
    if (!settings.allowed_file_types.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type ${file.mimetype} is not allowed. Allowed types: ${settings.allowed_file_types.join(', ')}`,
      );
    }

    // Validate file size
    const fileSizeMb = file.size / (1024 * 1024);
    if (fileSizeMb > settings.max_file_size_mb) {
      throw new BadRequestException(
        `File size ${fileSizeMb.toFixed(2)}MB exceeds maximum ${settings.max_file_size_mb}MB`,
      );
    }

    // Get user profile to verify document ownership
    const user = await this.usersService.findById(userIdObj);
    if (!user || !user.profile) {
      throw new BadRequestException(
        'Unable to verify your profile. Please complete your profile before uploading documents.',
      );
    }

    const firstName = user.profile.first_name?.trim().toLowerCase();
    const lastName = user.profile.last_name?.trim().toLowerCase();

    if (!firstName && !lastName) {
      throw new BadRequestException(
        'Your profile is missing name information. Please update your profile before uploading documents.',
      );
    }

    // Verify document contains patient's name using Claude Vision
    const nameVerification = await this.verifyDocumentOwnership(
      file,
      firstName,
      lastName,
    );

    if (!nameVerification.isValid) {
      throw new BadRequestException(
        nameVerification.message ||
          'The uploaded document does not appear to belong to you. Please ensure the document contains your name.',
      );
    }

    // Upload to S3
    const key = `advanced-health-score/${userId}/${Date.now()}-${file.originalname}`;
    const s3Url = await this.fileUploadHelper.uploadToS3(file.buffer, key);

    return {
      original_name: file.originalname,
      file_type: file.mimetype,
      s3_key: key,
      s3_url: s3Url,
      uploaded_at: new Date(),
    };
  }

  /**
   * Verify that the uploaded document contains the patient's name
   * Uses Claude Vision to extract and verify names from documents
   */
  private async verifyDocumentOwnership(
    file: Express.Multer.File,
    firstName: string | undefined,
    lastName: string | undefined,
  ): Promise<{ isValid: boolean; message?: string }> {
    if (!this.claudeClient) {
      // If Claude is not available, log warning and allow upload
      this.logger.warn(
        'Claude AI not available for document verification - allowing upload',
      );
      return { isValid: true };
    }

    try {
      // Convert file buffer to base64
      const base64Data = file.buffer.toString('base64');

      // Determine media type for Claude
      let mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
      if (file.mimetype === 'image/jpeg') {
        mediaType = 'image/jpeg';
      } else if (file.mimetype === 'image/png') {
        mediaType = 'image/png';
      } else if (file.mimetype === 'application/pdf') {
        // For PDFs, Claude can read them directly with document type
        mediaType = 'image/png'; // Will use document block for PDF
      } else {
        // Allow upload for unsupported types with warning
        this.logger.warn(
          `Unsupported file type for verification: ${file.mimetype}`,
        );
        return { isValid: true };
      }

      // Build the patient name pattern for matching
      const nameParts: string[] = [];
      if (firstName) nameParts.push(firstName);
      if (lastName) nameParts.push(lastName);
      const namePattern = nameParts.join(' or ');

      // Create content blocks based on file type
      const contentBlocks: any[] = [];

      if (file.mimetype === 'application/pdf') {
        // Use document type for PDFs
        contentBlocks.push({
          type: 'document',
          source: {
            type: 'base64',
            media_type: 'application/pdf',
            data: base64Data,
          },
        });
      } else {
        // Use image type for images
        contentBlocks.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: mediaType,
            data: base64Data,
          },
        });
      }

      contentBlocks.push({
        type: 'text',
        text: `You are verifying document ownership for a healthcare platform.

The patient's name is: First name: "${firstName || 'unknown'}", Last name: "${lastName || 'unknown'}"

Please analyze this document and determine if it belongs to this patient by checking if ANY of the following names appear in the document:
- "${firstName}" (first name)
- "${lastName}" (last name)
- Any combination or variation of these names

The name match should be case-insensitive and can be partial (e.g., if the patient's name is "Bassey Eyo", finding either "Bassey" OR "Eyo" anywhere in the document is sufficient).

Respond with ONLY a JSON object in this exact format:
{
  "found_names": ["list of names found in document"],
  "matches_patient": true or false,
  "confidence": "high" or "medium" or "low",
  "reason": "brief explanation"
}

Important:
- If you cannot read the document clearly, set confidence to "low" and matches_patient to true (benefit of doubt)
- Look for names in headers, patient info sections, signature areas, and throughout the document
- Be thorough but not overly strict - the goal is to prevent obvious mismatches`,
      });

      const response = await this.claudeClient.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: contentBlocks,
          },
        ],
      });

      const textContent = response.content.find((block) => block.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        this.logger.warn('No text response from Claude for document verification');
        return { isValid: true }; // Allow on error
      }

      // Parse the response
      let result;
      try {
        let jsonStr = textContent.text.trim();
        // Remove markdown code blocks if present
        if (jsonStr.startsWith('```json')) {
          jsonStr = jsonStr.slice(7);
        } else if (jsonStr.startsWith('```')) {
          jsonStr = jsonStr.slice(3);
        }
        if (jsonStr.endsWith('```')) {
          jsonStr = jsonStr.slice(0, -3);
        }
        result = JSON.parse(jsonStr.trim());
      } catch (parseError) {
        this.logger.warn(
          'Failed to parse document verification response:',
          textContent.text,
        );
        return { isValid: true }; // Allow on parse error
      }

      if (result.matches_patient === false && result.confidence !== 'low') {
        const foundNamesStr =
          result.found_names?.length > 0
            ? `Names found in document: ${result.found_names.join(', ')}.`
            : 'No recognizable names were found in the document.';

        return {
          isValid: false,
          message: `This document does not appear to belong to you. ${foundNamesStr} Please upload a document that contains your name (${firstName || ''} ${lastName || ''}).`,
        };
      }

      return { isValid: true };
    } catch (error) {
      this.logger.error('Error verifying document ownership:', error);
      // On error, allow the upload (fail open for better UX)
      return { isValid: true };
    }
  }

  async submitAssessment(
    userId: string | Types.ObjectId,
    dto: SubmitAssessmentDto,
    documents: UploadedDocument[] = [],
  ): Promise<AdvancedHealthScoreDocument> {
    const userIdObj =
      typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
    const settings = await this.getSettings();

    // Verify can start
    const canStart = await this.canStartAssessment(userIdObj);
    if (!canStart.can_start) {
      throw new BadRequestException(canStart.reason || 'Cannot start assessment');
    }

    // Get profile snapshot with filtered health checkups based on patient selections
    const profileSnapshot = await this.buildProfileSnapshot(
      userIdObj,
      dto.checkup_selections,
    );

    const startTime = Date.now();
    let report: HealthReport | null = null;
    let status = AssessmentStatus.COMPLETED;
    let errorMessage: string | null = null;

    try {
      // Generate AI report
      report = await this.generateHealthReport(dto.answers, documents, profileSnapshot);

      // Consume credits (multiple if needed)
      for (let i = 0; i < settings.credit_cost; i++) {
        await this.claudeCreditsService.consumeCredit(
          userIdObj,
          new Types.ObjectId(), // placeholder - we'll update with actual assessment ID
        );
      }
    } catch (error) {
      this.logger.error('Error generating health report:', error);
      status = AssessmentStatus.FAILED;
      errorMessage = error.message || 'Failed to generate health report';
    }

    const generationTimeMs = Date.now() - startTime;

    // Create the assessment record
    const assessment = await this.scoreModel.create({
      user_id: userIdObj,
      answers: dto.answers,
      documents,
      profile_snapshot: profileSnapshot,
      report,
      credits_used: settings.credit_cost,
      credit_source: canStart.credit_source,
      ai_model: 'claude-sonnet-4-20250514',
      generation_time_ms: generationTimeMs,
      status,
      error_message: errorMessage,
    });

    return assessment;
  }

  async getAssessmentHistory(
    userId: string | Types.ObjectId,
    page = 1,
    limit = 10,
  ) {
    const userIdObj =
      typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
    const skip = (page - 1) * limit;

    const [assessments, total] = await Promise.all([
      this.scoreModel
        .find({ user_id: userIdObj, status: AssessmentStatus.COMPLETED })
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .select({
          'report.overall_score': 1,
          'report.overall_status': 1,
          'report.overall_summary': 1,
          'report.domain_scores': 1,
          'report.priority_actions': 1,
          'report.detailed_analysis': 1,
          'report.lifestyle_tips': 1,
          'report.when_to_see_doctor': 1,
          'report.disclaimer': 1,
          'report.confidence_level': 1,
          'report.data_sources_used': 1,
          status: 1,
          credits_used: 1,
          created_at: 1,
        })
        .lean(),
      this.scoreModel.countDocuments({
        user_id: userIdObj,
        status: AssessmentStatus.COMPLETED,
      }),
    ]);

    return {
      assessments,
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    };
  }

  async getAssessmentById(
    userId: string | Types.ObjectId,
    assessmentId: string | Types.ObjectId,
  ): Promise<AdvancedHealthScoreDocument> {
    const userIdObj =
      typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
    const assessmentIdObj =
      typeof assessmentId === 'string'
        ? new Types.ObjectId(assessmentId)
        : assessmentId;

    const assessment = await this.scoreModel.findOne({
      _id: assessmentIdObj,
      user_id: userIdObj,
    });

    if (!assessment) {
      throw new NotFoundException('Assessment not found');
    }

    // Generate presigned URLs for documents
    if (assessment.documents?.length) {
      for (const doc of assessment.documents) {
        if (doc.s3_url) {
          try {
            doc.s3_url = await this.fileUploadHelper.getPresignedUrl(
              doc.s3_url,
              3600, // 1 hour
            );
          } catch (e) {
            this.logger.error('Error generating presigned URL for document:', e);
          }
        }
      }
    }

    return assessment;
  }

  /**
   * Get assessment by ID for specialists viewing patient data
   * Does not check ownership - specialists can view any assessment they have the ID for
   */
  async getAssessmentByIdForSpecialist(
    assessmentId: string | Types.ObjectId,
  ): Promise<AdvancedHealthScoreDocument> {
    const assessmentIdObj =
      typeof assessmentId === 'string'
        ? new Types.ObjectId(assessmentId)
        : assessmentId;

    const assessment = await this.scoreModel.findOne({
      _id: assessmentIdObj,
    });

    if (!assessment) {
      throw new NotFoundException('Assessment not found');
    }

    // Generate presigned URLs for documents
    if (assessment.documents?.length) {
      for (const doc of assessment.documents) {
        if (doc.s3_url) {
          try {
            doc.s3_url = await this.fileUploadHelper.getPresignedUrl(
              doc.s3_url,
              3600, // 1 hour
            );
          } catch (e) {
            this.logger.error('Error generating presigned URL for document:', e);
          }
        }
      }
    }

    return assessment;
  }

  // =====================
  // Private Helpers
  // =====================

  private async buildProfileSnapshot(
    userId: Types.ObjectId,
    checkupSelections?: Array<{ checkup_id: string; status: 'include' | 'exclude' }>,
  ): Promise<ProfileSnapshot> {
    const user = await this.usersService.findById(userId);

    if (!user) {
      return this.getEmptyProfileSnapshot();
    }

    // Calculate age
    let age: number | null = null;
    if (user.profile?.date_of_birth) {
      age = moment().diff(moment(user.profile.date_of_birth), 'years');
    }

    // Get health info (nested inside profile)
    const healthInfo = (user.profile as any)?.basic_health_info || {};
    const heightVal = healthInfo.height?.value
      ? parseFloat(healthInfo.height.value)
      : null;
    const weightVal = healthInfo.weight?.value
      ? parseFloat(healthInfo.weight.value)
      : null;

    // Calculate BMI
    let bmi: number | null = null;
    if (heightVal && weightVal) {
      let heightInM = heightVal;
      if (healthInfo.height?.unit === 'cm') {
        heightInM = heightVal / 100;
      }
      let weightInKg = weightVal;
      if (healthInfo.weight?.unit === 'lb') {
        weightInKg = weightVal * 0.453592;
      }
      if (heightInM > 0) {
        bmi = parseFloat((weightInKg / (heightInM * heightInM)).toFixed(1));
      }
    }

    // Get pre-existing conditions
    const preExistingConditions = (user.pre_existing_conditions || [])
      .map((c: any) => c.name)
      .filter(Boolean);

    // Get smoking status (nested inside profile)
    const healthRiskFactors = (user.profile as any)?.health_risk_factors;
    const isSmoker =
      healthRiskFactors?.is_smoker === 'Yes' ||
      healthRiskFactors?.is_smoker === true;

    // Get recent vitals
    let recentVitals = {
      blood_pressure: null as string | null,
      blood_sugar: null as string | null,
      pulse_rate: null as string | null,
      temperature: null as string | null,
    };

    try {
      const vitals: any = await this.vitalsService.getMostRecentVitals(userId);
      if (vitals) {
        // Blood pressure is stored as { value: "120/70", unit: "mmHg" }
        let bloodPressureStr: string | null = null;
        if (vitals.blood_pressure?.value) {
          bloodPressureStr = `${vitals.blood_pressure.value} ${vitals.blood_pressure.unit || 'mmHg'}`;
        }

        recentVitals = {
          blood_pressure: bloodPressureStr,
          blood_sugar: vitals.blood_sugar_level?.value
            ? `${vitals.blood_sugar_level.value} ${vitals.blood_sugar_level.unit || 'mg/dL'}`
            : null,
          pulse_rate: vitals.pulse_rate?.value
            ? `${vitals.pulse_rate.value} ${vitals.pulse_rate.unit || 'bpm'}`
            : null,
          temperature: vitals.body_temp?.value
            ? `${vitals.body_temp.value}${vitals.body_temp.unit || '°C'}`
            : null,
        };
      }
    } catch (e) {
      this.logger.warn('Could not fetch recent vitals:', e.message);
    }

    // Get recent health checkups based on patient selections or settings
    let recentHealthCheckups: HealthCheckupSummary[] = [];
    try {
      const settings = await this.getSettings();
      const autoExcludeDays = settings.checkup_auto_exclude_days || 30;
      const autoExcludeDate = moment().subtract(autoExcludeDays, 'days').toDate();

      // Fetch checkups within the relevant window
      const checkups = await this.healthCheckupModel
        .find({
          user: userId,
          deleted_at: { $exists: false },
          created_at: { $gte: autoExcludeDate },
        })
        .sort({ created_at: -1 })
        .limit(10)
        .lean();

      // Filter checkups based on patient selections if provided
      let filteredCheckups = checkups;
      if (checkupSelections && checkupSelections.length > 0) {
        // Create a map for quick lookup
        const selectionMap = new Map(
          checkupSelections.map((s) => [s.checkup_id, s.status]),
        );

        filteredCheckups = checkups.filter((checkup: any) => {
          const checkupId = checkup._id.toString();
          const selection = selectionMap.get(checkupId);

          // If patient explicitly set a status, use it
          if (selection) {
            return selection === 'include';
          }

          // If no selection, apply default rules
          const autoIncludeDays = settings.checkup_auto_include_days || 14;
          const autoIncludeDate = moment().subtract(autoIncludeDays, 'days').toDate();
          const checkupDate = new Date(checkup.created_at);
          const triageLevel = checkup.response?.data?.triage_level;

          // Exclude self-care if setting enabled
          if (settings.exclude_self_care_triage && triageLevel === 'self_care') {
            return false;
          }

          // Include if within auto-include window
          return checkupDate >= autoIncludeDate;
        });
      } else {
        // No selections provided - apply default filtering based on settings
        const autoIncludeDays = settings.checkup_auto_include_days || 14;
        const autoIncludeDate = moment().subtract(autoIncludeDays, 'days').toDate();

        filteredCheckups = checkups.filter((checkup: any) => {
          const checkupDate = new Date(checkup.created_at);
          const triageLevel = checkup.response?.data?.triage_level;

          // Exclude self-care if setting enabled
          if (settings.exclude_self_care_triage && triageLevel === 'self_care') {
            return false;
          }

          // Include if within auto-include window
          return checkupDate >= autoIncludeDate;
        });
      }

      // Limit to 5 checkups max
      filteredCheckups = filteredCheckups.slice(0, 5);

      recentHealthCheckups = filteredCheckups.map((checkup: any) => {
        const response = checkup.response?.data || {};
        const conditions = response.conditions || [];
        const evidence = checkup.request?.evidence || [];

        // Extract symptoms from evidence (present symptoms)
        const symptoms = evidence
          .filter((e: any) => e.choice_id === 'present' && e.source !== 'predefined')
          .map((e: any) => e.common_name || e.name || e.id)
          .filter(Boolean)
          .slice(0, 5); // Limit to 5 symptoms

        // Get top conditions with probability
        const topConditions = conditions
          .slice(0, 3)
          .map((c: any) => ({
            name: c.common_name || c.name,
            probability: Math.round((c.probability || 0) * 100),
          }));

        // Get AI summary if available
        const aiSummary = checkup.claude_summary?.content?.overview || null;

        return {
          date: moment(checkup.created_at).format('YYYY-MM-DD'),
          triage_level: response.triage_level || null,
          has_emergency_evidence: response.has_emergency_evidence || false,
          top_conditions: topConditions,
          symptoms_reported: symptoms,
          ai_summary: aiSummary,
        };
      });
    } catch (e) {
      this.logger.warn('Could not fetch recent health checkups:', e.message);
    }

    return {
      first_name: user.profile?.first_name || null,
      age,
      gender: user.profile?.gender || null,
      height: heightVal
        ? { value: heightVal, unit: healthInfo.height?.unit || 'cm' }
        : null,
      weight: weightVal
        ? { value: weightVal, unit: healthInfo.weight?.unit || 'kg' }
        : null,
      bmi,
      pre_existing_conditions: preExistingConditions,
      is_smoker: isSmoker,
      recent_vitals: recentVitals,
      recent_health_checkups: recentHealthCheckups,
    };
  }

  private getEmptyProfileSnapshot(): ProfileSnapshot {
    return {
      first_name: null,
      age: null,
      gender: null,
      height: null,
      weight: null,
      bmi: null,
      pre_existing_conditions: [],
      is_smoker: null,
      recent_vitals: {
        blood_pressure: null,
        blood_sugar: null,
        pulse_rate: null,
        temperature: null,
      },
      recent_health_checkups: [],
    };
  }

  private async generateHealthReport(
    answers: SubmitAssessmentDto['answers'],
    documents: UploadedDocument[],
    profileSnapshot: ProfileSnapshot,
  ): Promise<HealthReport> {
    if (!this.claudeClient) {
      throw new InternalServerErrorException('Claude AI service not available');
    }

    const prompt = this.buildPrompt(answers, documents, profileSnapshot);

    const response = await this.claudeClient.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: this.getSystemPrompt(),
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = response.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude');
    }

    return this.parseReportResponse(textContent.text);
  }

  private getSystemPrompt(): string {
    return `You are an AI health analysis assistant for Rapid Capsule Healthcare Platform. Your role is to analyze comprehensive health questionnaire responses and provide a detailed health score assessment.

Guidelines:
1. Analyze all provided data holistically - questionnaire answers, profile information, vitals, recent health checkups (symptom assessments), and document descriptions
2. Pay special attention to recent health checkup results - these are AI-powered symptom assessments that may indicate ongoing health concerns:
   - Emergency triage levels or emergency evidence should significantly impact the score
   - Recent consultations or ongoing symptoms should be factored into relevant domains
   - Consider if reported symptoms align with questionnaire responses
3. Provide scores from 0-100 for overall health and each domain
4. Be encouraging but honest in your assessment
5. Provide actionable, practical recommendations
6. Flag any concerning findings that warrant medical attention, especially if health checkups show serious triage levels
7. Consider the interaction between different health domains
8. Acknowledge limitations - this is an AI assessment, not a medical diagnosis
9. Do NOT include specific phone numbers or region-specific contact information

Triage Level Impact on Scoring:
- emergency/emergency_ambulance: Major negative impact (-15 to -20 points)
- consultation_24: Significant negative impact (-10 to -12 points)
- consultation: Moderate negative impact (-5 to -7 points)
- self_care: Minimal impact (user is managing symptoms appropriately)

Scoring Guidelines:
- 80-100: Excellent - Strong health indicators across the domain
- 60-79: Good - Mostly positive with minor areas for improvement
- 40-59: Fair - Several areas need attention
- 20-39: Needs Attention - Significant concerns requiring action
- 0-19: Poor - Urgent attention recommended

You MUST respond with ONLY a valid JSON object (no markdown, no explanation) matching the exact schema provided in the prompt.`;
  }

  private buildPrompt(
    answers: SubmitAssessmentDto['answers'],
    documents: UploadedDocument[],
    profile: ProfileSnapshot,
  ): string {
    // Group answers by domain
    const answersByDomain: Record<string, typeof answers> = {};
    for (const answer of answers) {
      if (!answersByDomain[answer.domain]) {
        answersByDomain[answer.domain] = [];
      }
      answersByDomain[answer.domain].push(answer);
    }

    // Format answers by domain
    const formattedAnswers = Object.entries(answersByDomain)
      .map(([domain, domainAnswers]) => {
        const domainLabel = DOMAIN_LABELS[domain as HealthDomain] || domain;
        const answersText = domainAnswers
          .map((a) => `  Q: ${a.question_text}\n  A: ${a.answer_label}`)
          .join('\n');
        return `### ${domainLabel}\n${answersText}`;
      })
      .join('\n\n');

    // Format profile
    const patientName = profile.first_name || 'Patient';
    const profileText = `
- Patient Name: ${patientName}
- Age: ${profile.age || 'Not provided'}
- Gender: ${profile.gender || 'Not provided'}
- Height: ${profile.height ? `${profile.height.value} ${profile.height.unit}` : 'Not provided'}
- Weight: ${profile.weight ? `${profile.weight.value} ${profile.weight.unit}` : 'Not provided'}
- BMI: ${profile.bmi || 'Not calculated'}
- Pre-existing Conditions: ${profile.pre_existing_conditions.length ? profile.pre_existing_conditions.join(', ') : 'None reported'}
- Smoking Status: ${profile.is_smoker === true ? 'Smoker' : profile.is_smoker === false ? 'Non-smoker' : 'Not specified'}
- Recent Blood Pressure: ${profile.recent_vitals.blood_pressure || 'Not available'}
- Recent Blood Sugar: ${profile.recent_vitals.blood_sugar || 'Not available'}
- Recent Pulse Rate: ${profile.recent_vitals.pulse_rate || 'Not available'}
- Recent Temperature: ${profile.recent_vitals.temperature || 'Not available'}`;

    // Format documents
    const documentsText =
      documents.length > 0
        ? documents.map((d) => `- ${d.original_name} (${d.file_type})`).join('\n')
        : 'No documents uploaded';

    // Format recent health checkups (Infermedica AI symptom assessments)
    let healthCheckupsText = 'No recent health checkups on record';
    if (profile.recent_health_checkups && profile.recent_health_checkups.length > 0) {
      healthCheckupsText = profile.recent_health_checkups
        .map((checkup, index) => {
          const triageInfo = checkup.triage_level
            ? `Triage Level: ${checkup.triage_level.replace(/_/g, ' ')}`
            : 'Triage: Not determined';
          const emergencyFlag = checkup.has_emergency_evidence
            ? ' ⚠️ EMERGENCY EVIDENCE DETECTED'
            : '';
          const conditions = checkup.top_conditions.length > 0
            ? `\n    Possible Conditions: ${checkup.top_conditions.map(c => `${c.name} (${c.probability}%)`).join(', ')}`
            : '';
          const symptoms = checkup.symptoms_reported.length > 0
            ? `\n    Symptoms Reported: ${checkup.symptoms_reported.join(', ')}`
            : '';
          const summary = checkup.ai_summary
            ? `\n    AI Assessment: ${checkup.ai_summary}`
            : '';

          return `${index + 1}. Date: ${checkup.date} | ${triageInfo}${emergencyFlag}${conditions}${symptoms}${summary}`;
        })
        .join('\n\n');
    }

    // Determine data completeness for confidence level
    const dataSourcesUsed: string[] = ['questionnaire'];
    if (profile.age || profile.gender || profile.bmi) dataSourcesUsed.push('profile');
    if (
      profile.recent_vitals.blood_pressure ||
      profile.recent_vitals.blood_sugar
    )
      dataSourcesUsed.push('vitals');
    if (documents.length > 0) dataSourcesUsed.push('documents');
    if (profile.recent_health_checkups && profile.recent_health_checkups.length > 0) {
      dataSourcesUsed.push('health_checkups');
    }

    return `Please analyze the following comprehensive health assessment data and provide a detailed, personalized health score report for ${patientName}.

IMPORTANT: Address the patient directly by their first name ("${patientName}") throughout your response. Use phrases like "${patientName}, you demonstrate..." or "${patientName}, your health..." instead of impersonal language like "This patient..." or "The 47-year-old male...". Make the report feel personal and warm while remaining professional.

## Patient Profile
${profileText}

## Recent Health Checkups (AI Symptom Assessments)
These are recent symptom assessment results from our Infermedica-powered health checkup system:
${healthCheckupsText}

## Questionnaire Responses
${formattedAnswers}

## Uploaded Documents
${documentsText}

## Data Sources Available
${dataSourcesUsed.join(', ')}

---

Based on this information, provide a comprehensive health analysis in the following JSON format:

{
  "overall_score": <number 0-100>,
  "overall_status": "<Excellent|Good|Fair|Needs Attention|Poor>",
  "overall_summary": "<2-3 sentence overview of the patient's health status>",
  "domain_scores": [
    {
      "domain": "<domain_key>",
      "domain_label": "<Human readable domain name>",
      "score": <number 0-100>,
      "status": "<Excellent|Good|Fair|Needs Attention|Poor>",
      "insights": "<2-3 sentences about this domain's findings>",
      "recommendations": ["<specific recommendation 1>", "<specific recommendation 2>"]
    }
  ],
  "priority_actions": [
    {
      "priority": "<high|medium|low>",
      "action": "<specific action to take>",
      "reason": "<why this is important>"
    }
  ],
  "detailed_analysis": "<comprehensive 3-5 paragraph analysis of overall health status>",
  "lifestyle_tips": ["<tip 1>", "<tip 2>", "<tip 3>"],
  "when_to_see_doctor": ["<situation 1>", "<situation 2>"],
  "confidence_level": "<high|medium|low based on data completeness>",
  "data_sources_used": ${JSON.stringify(dataSourcesUsed)},
  "disclaimer": "This is an AI-powered health assessment and should not be considered a medical diagnosis. Please consult with a healthcare professional for proper medical advice, diagnosis, or treatment."
}

Include domain_scores for all 6 domains: cardiovascular, metabolic, mental_wellbeing, lifestyle, physical_symptoms, preventive_care.`;
  }

  private parseReportResponse(responseText: string): HealthReport {
    try {
      let jsonStr = responseText.trim();

      // Remove markdown code blocks if present
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.slice(7);
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.slice(3);
      }
      if (jsonStr.endsWith('```')) {
        jsonStr = jsonStr.slice(0, -3);
      }
      jsonStr = jsonStr.trim();

      const parsed = JSON.parse(jsonStr);

      // Validate and return with defaults
      return {
        overall_score: parsed.overall_score ?? 50,
        overall_status: parsed.overall_status || 'Fair',
        overall_summary:
          parsed.overall_summary ||
          'Your health assessment has been completed. Please review the detailed findings.',
        domain_scores: parsed.domain_scores || [],
        priority_actions: parsed.priority_actions || [],
        detailed_analysis:
          parsed.detailed_analysis ||
          'Please review your domain scores for detailed insights.',
        lifestyle_tips: parsed.lifestyle_tips || [],
        when_to_see_doctor: parsed.when_to_see_doctor || [],
        confidence_level: parsed.confidence_level || ConfidenceLevel.MEDIUM,
        data_sources_used: parsed.data_sources_used || ['questionnaire'],
        disclaimer:
          parsed.disclaimer ||
          'This is an AI-powered health assessment and should not be considered a medical diagnosis. Please consult with a healthcare professional for proper medical advice.',
      };
    } catch (error) {
      this.logger.error('Failed to parse health report response:', error);
      this.logger.debug('Raw response:', responseText);

      // Return fallback report
      return {
        overall_score: 50,
        overall_status: 'Assessment Incomplete',
        overall_summary:
          'We encountered an issue generating your complete health report. Please try again or contact support.',
        domain_scores: [],
        priority_actions: [
          {
            priority: PriorityLevel.MEDIUM,
            action: 'Retry the assessment',
            reason: 'The AI analysis could not be completed properly',
          },
        ],
        detailed_analysis:
          'The health report generation encountered an issue. Your questionnaire responses have been saved. Please try generating the report again.',
        lifestyle_tips: [],
        when_to_see_doctor: [
          'If you have any urgent health concerns, please consult a healthcare provider directly',
        ],
        confidence_level: ConfidenceLevel.LOW,
        data_sources_used: ['questionnaire'],
        disclaimer:
          'This is an AI-powered health assessment and should not be considered a medical diagnosis.',
      };
    }
  }
}
