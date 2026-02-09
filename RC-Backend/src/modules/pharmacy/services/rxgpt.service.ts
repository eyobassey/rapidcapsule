import { Injectable, Logger, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as crypto from 'crypto';
import Anthropic from '@anthropic-ai/sdk';
import { RxGPTSettings, RxGPTSettingsDocument } from '../entities/rxgpt-settings.entity';
import { RxGPTAnalytics, RxGPTAnalyticsDocument } from '../entities/rxgpt-analytics.entity';
import { RxGPTCache, RxGPTCacheDocument } from '../entities/rxgpt-cache.entity';
import { RxGPTFeedback, RxGPTFeedbackDocument } from '../entities/rxgpt-feedback.entity';
import { DrugInteractionService } from './drug-interaction.service';
import { OpenFDAService } from './openfda.service';
import { PubMedService } from './pubmed.service';
import { PubMedCitation, DrugEvidenceSummary } from '../dto/pubmed.dto';
import { NICEService } from './nice.service';
import { NICEValidationResult, NICEComplianceSummary } from '../dto/nice.dto';
import { BNFService } from './bnf.service';
import { BNFValidationResult, BNFComplianceSummary } from '../dto/bnf.dto';
import { HallucinationDetectorService } from './hallucination-detector.service';
import { HallucinationReport } from '../dto/hallucination.dto';
import {
  RxGPTAnalyzeDto,
  RxGPTQuickCheckDto,
  RxGPTResponseDto,
  RxGPTAlertDto,
  RxGPTRecommendationDto,
  DrugAnalysisDto,
  RxGPTAlertType,
  RxGPTAlertSeverity,
  RxGPTRiskLevel,
  RxGPTRecommendationType,
  RxGPTPriority,
  UpdateRxGPTSettingsDto,
  RxGPTAnalyticsSummaryDto,
  RxGPTAnalyticsQueryDto,
  RxGPTSuggestMedicationsDto,
  RxGPTSuggestMedicationsResponseDto,
  SuggestedMedicationDto,
  RxGPTStandaloneAnalyzeDto,
} from '../dto/rxgpt.dto';

// Patient context interface for building analysis
interface PatientContext {
  patient_id: string;
  age: number;
  gender: string;
  weight?: number;
  allergies: {
    drug: Array<{ allergen: string; reaction?: string; severity?: string }>;
    food: Array<{ allergen: string; reaction?: string }>;
    environmental: Array<{ allergen: string }>;
  };
  chronic_conditions: string[];
  current_medications: Array<{
    name: string;
    dosage?: string;
    frequency?: string;
    reason?: string;
  }>;
  family_history: Array<{
    condition: string;
    relation?: string;
  }>;
}

interface ClinicalContext {
  appointment_id?: string;
  chief_complaint?: string;
  diagnosis?: string;
  treatment_plan?: string;
  vital_signs?: {
    blood_pressure?: string;
    heart_rate?: number;
    temperature?: number;
    respiratory_rate?: number;
    oxygen_saturation?: number;
  };
  soap_notes?: {
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
  };
}

interface HealthCheckupContext {
  checkup_id?: string;
  triage_level?: string;
  primary_condition?: {
    name: string;
    probability?: number;
  };
  symptoms: Array<{
    name: string;
    severity?: string;
    duration?: string;
  }>;
  ai_summary?: {
    overview: string;
    key_findings: string[];
    recommendations: string[];
  };
  risk_factors: string[];
}

interface ProposedDrug {
  drug_id?: string; // Optional for external medications
  name: string;
  generic_name?: string;
  strength: string;
  dosage: string;
  frequency: string;
  duration_days?: number;
  instructions?: string;
  quantity: number;
}

@Injectable()
export class RxGPTService {
  private readonly logger = new Logger(RxGPTService.name);
  private client: Anthropic | null = null;
  private isEnabled: boolean = false;

  // Default cache TTL: 24 hours
  private readonly CACHE_TTL_MS = 24 * 60 * 60 * 1000;

  // Rate limiting map: specialistId -> { count, resetTime }
  private rateLimitMap: Map<string, { count: number; resetTime: number }> = new Map();

  constructor(
    @InjectModel(RxGPTSettings.name)
    private readonly settingsModel: Model<RxGPTSettingsDocument>,
    @InjectModel(RxGPTAnalytics.name)
    private readonly analyticsModel: Model<RxGPTAnalyticsDocument>,
    @InjectModel(RxGPTCache.name)
    private readonly cacheModel: Model<RxGPTCacheDocument>,
    @InjectModel(RxGPTFeedback.name)
    private readonly feedbackModel: Model<RxGPTFeedbackDocument>,
    @InjectModel('User')
    private readonly userModel: Model<any>,
    @InjectModel('Appointment')
    private readonly appointmentModel: Model<any>,
    @InjectModel('HealthCheckup')
    private readonly healthCheckupModel: Model<any>,
    @InjectModel('ClaudeSummaryCredit')
    private readonly creditModel: Model<any>,
    private readonly drugInteractionService: DrugInteractionService,
    private readonly openFDAService: OpenFDAService,
    private readonly pubmedService: PubMedService,
    private readonly niceService: NICEService,
    private readonly bnfService: BNFService,
    private readonly hallucinationDetector: HallucinationDetectorService,
  ) {
    this.initializeClient();
  }

  private async initializeClient() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey) {
      try {
        this.client = new Anthropic({ apiKey });
        this.isEnabled = true;
        this.logger.log('RxGPT service initialized successfully');
      } catch (error) {
        this.logger.error('Failed to initialize RxGPT client:', error);
        this.isEnabled = false;
      }
    } else {
      this.logger.warn('ANTHROPIC_API_KEY not configured. RxGPT service disabled.');
      this.isEnabled = false;
    }

    // Debug: Log collection info on startup
    try {
      const collectionName = this.creditModel.collection.name;
      const count = await this.creditModel.countDocuments().exec();
      this.logger.log(`[RxGPT] Credit model connected to collection: "${collectionName}" with ${count} documents`);

      // Log a sample of credit records
      const sample = await this.creditModel.find().limit(3).lean().exec();
      sample.forEach((doc: any) => {
        this.logger.log(`[RxGPT] Credit sample - userId: ${doc.userId}, gifted: ${doc.gifted_credits}, purchased: ${doc.purchased_credits}`);
      });
    } catch (error) {
      this.logger.error('[RxGPT] Failed to check credit collection:', error);
    }
  }

  /**
   * Check if RxGPT is available
   */
  isAvailable(): boolean {
    return this.isEnabled && this.client !== null;
  }

  /**
   * Get current RxGPT settings
   */
  async getSettings(): Promise<RxGPTSettings> {
    let settings = await this.settingsModel.findOne().exec();
    if (!settings) {
      // Create default settings if none exist
      settings = await this.settingsModel.create({
        is_enabled: true,
        is_enabled_for_specialists: true,
        ai_model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        temperature: 0.3,
        credit_settings: {
          credits_per_analysis: 1,
          free_monthly_credits: 0,
          allow_specialist_purchase: true,
        },
        features: {
          allergy_checking: true,
          drug_interactions: true,
          dosage_validation: true,
          alternative_suggestions: true,
          clinical_reasoning: true,
          citations: true,
        },
        data_sources: {
          use_openfda: true,
          use_claude_ai: true,
          use_local_drug_db: true,
          use_pubmed: true,
          use_nice_guidelines: false,
          use_bnf: false,
          use_hallucination_detection: true,
        },
        thresholds: {
          min_confidence_score: 70,
          interaction_severity_threshold: 'moderate',
          max_alternatives: 3,
        },
        display: {
          show_citations: true,
          show_confidence_scores: true,
          show_reasoning: true,
          auto_expand_alerts: true,
        },
        usage_limits: {
          daily_limit: 0,
          monthly_limit: 0,
          rate_limit_per_minute: 10,
          low_credit_warning_threshold: 5,
          critical_credit_warning_threshold: 2,
        },
      });
    }
    return settings;
  }

  /**
   * Update RxGPT settings (admin only)
   */
  async updateSettings(
    updateDto: UpdateRxGPTSettingsDto,
    adminId: string,
  ): Promise<RxGPTSettings> {
    const settings = await this.getSettings();

    // Deep merge the settings
    const updateData: any = { last_updated_by: new Types.ObjectId(adminId) };

    if (updateDto.is_enabled !== undefined) updateData.is_enabled = updateDto.is_enabled;
    if (updateDto.is_enabled_for_specialists !== undefined)
      updateData.is_enabled_for_specialists = updateDto.is_enabled_for_specialists;
    if (updateDto.ai_model) updateData.ai_model = updateDto.ai_model;
    if (updateDto.max_tokens) updateData.max_tokens = updateDto.max_tokens;
    if (updateDto.temperature !== undefined) updateData.temperature = updateDto.temperature;
    if (updateDto.disclaimer_text) updateData.disclaimer_text = updateDto.disclaimer_text;

    if (updateDto.credit_settings) {
      updateData.credit_settings = {
        ...settings.credit_settings,
        ...updateDto.credit_settings,
      };
    }

    if (updateDto.features) {
      updateData.features = { ...settings.features, ...updateDto.features };
    }

    if (updateDto.data_sources) {
      updateData.data_sources = { ...settings.data_sources, ...updateDto.data_sources };
    }

    if (updateDto.thresholds) {
      updateData.thresholds = { ...settings.thresholds, ...updateDto.thresholds };
    }

    if (updateDto.display) {
      updateData.display = { ...settings.display, ...updateDto.display };
    }

    if (updateDto.usage_limits) {
      updateData.usage_limits = { ...(settings.usage_limits || {}), ...updateDto.usage_limits };
    }

    const updated = await this.settingsModel
      .findByIdAndUpdate(settings['_id'], { $set: updateData }, { new: true })
      .exec();
    return updated!;
  }

  /**
   * Check specialist's credit balance
   */
  async getSpecialistCreditBalance(specialistId: string): Promise<{
    available: number;
    free_credits: number;
    purchased_credits: number;
    gifted_credits: number;
    has_unlimited: boolean;
  }> {
    // Debug: Log collection name and query
    this.logger.log(`[RxGPT Credit Check] Looking up credits for specialist: ${specialistId}`);
    this.logger.log(`[RxGPT Credit Check] Collection name: ${this.creditModel.collection.name}`);

    const credit = await this.creditModel.findOne({
      userId: new Types.ObjectId(specialistId),
    }).exec();

    this.logger.log(`[RxGPT Credit Check] Credit record found: ${credit ? 'YES' : 'NO'}`);
    if (credit) {
      this.logger.log(`[RxGPT Credit Check] Record: gifted=${credit.gifted_credits}, purchased=${credit.purchased_credits}, free=${credit.free_credits_remaining}`);
    }

    if (!credit) {
      this.logger.warn(`[RxGPT Credit Check] No credit record found for specialist ${specialistId}`);
      return {
        available: 0,
        free_credits: 0,
        purchased_credits: 0,
        gifted_credits: 0,
        has_unlimited: false,
      };
    }

    const hasUnlimited =
      credit.unlimited_subscription?.is_active &&
      new Date(credit.unlimited_subscription.expires_at) > new Date();

    // Check if gifted credits have expired
    let giftedCredits = credit.gifted_credits || 0;
    if (credit.gifted_credits_expiry && new Date(credit.gifted_credits_expiry) < new Date()) {
      giftedCredits = 0;
    }

    const available =
      (credit.free_credits_remaining || 0) +
      (credit.purchased_credits || 0) +
      giftedCredits;

    return {
      available: hasUnlimited ? Infinity : available,
      free_credits: credit.free_credits_remaining || 0,
      purchased_credits: credit.purchased_credits || 0,
      gifted_credits: giftedCredits,
      has_unlimited: hasUnlimited,
    };
  }

  /**
   * Consume 1 credit for an interaction check (public wrapper)
   */
  async consumeInteractionCheckCredit(
    specialistId: string,
  ): Promise<{ success: boolean; remaining: number }> {
    return this.consumeCredits(specialistId, 1);
  }

  /**
   * Consume credits for RxGPT analysis
   */
  private async consumeCredits(
    specialistId: string,
    amount: number,
  ): Promise<{ success: boolean; remaining: number }> {
    const credit = await this.creditModel.findOne({
      userId: new Types.ObjectId(specialistId),
    }).exec();

    if (!credit) {
      return { success: false, remaining: 0 };
    }

    // Check unlimited subscription
    if (
      credit.unlimited_subscription?.is_active &&
      new Date(credit.unlimited_subscription.expires_at) > new Date()
    ) {
      // Don't deduct, but track usage
      await this.creditModel.updateOne(
        { _id: credit._id },
        {
          $inc: { total_summaries_generated: 1 },
          $set: { 'rxgpt_last_used_at': new Date() },
        },
      );
      return { success: true, remaining: Infinity };
    }

    // Deduct from free credits first, then gifted, then purchased
    let remaining = amount;
    const updates: any = { $inc: { total_summaries_generated: 1 } };

    // Check if gifted credits have expired
    const giftedValid =
      credit.gifted_credits > 0 &&
      (!credit.gifted_credits_expiry || new Date(credit.gifted_credits_expiry) > new Date());

    if (credit.free_credits_remaining > 0) {
      const deductFromFree = Math.min(credit.free_credits_remaining, remaining);
      updates.$inc.free_credits_remaining = -deductFromFree;
      remaining -= deductFromFree;
    }

    if (remaining > 0 && giftedValid) {
      const deductFromGifted = Math.min(credit.gifted_credits, remaining);
      updates.$inc.gifted_credits = -deductFromGifted;
      remaining -= deductFromGifted;
    }

    if (remaining > 0 && credit.purchased_credits > 0) {
      const deductFromPurchased = Math.min(credit.purchased_credits, remaining);
      updates.$inc.purchased_credits = -deductFromPurchased;
      remaining -= deductFromPurchased;
    }

    if (remaining > 0) {
      // Not enough credits
      return { success: false, remaining: 0 };
    }

    await this.creditModel.updateOne({ _id: credit._id }, updates);

    const balance = await this.getSpecialistCreditBalance(specialistId);
    return { success: true, remaining: balance.available };
  }

  // =====================
  // Usage Limits & Warnings Methods
  // =====================

  /**
   * Check rate limit for a specialist
   */
  private checkRateLimit(specialistId: string, limitPerMinute: number): boolean {
    const now = Date.now();
    const entry = this.rateLimitMap.get(specialistId);

    if (!entry || now > entry.resetTime) {
      // Reset or new entry
      this.rateLimitMap.set(specialistId, { count: 1, resetTime: now + 60000 });
      return true;
    }

    if (entry.count >= limitPerMinute) {
      return false;
    }

    entry.count++;
    return true;
  }

  /**
   * Get specialist's usage for today and this month
   */
  async getSpecialistUsage(specialistId: string): Promise<{
    today: number;
    this_month: number;
  }> {
    const specialistOid = new Types.ObjectId(specialistId);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [todayCount, monthCount] = await Promise.all([
      this.analyticsModel.countDocuments({
        specialist_id: specialistOid,
        created_at: { $gte: todayStart },
      }),
      this.analyticsModel.countDocuments({
        specialist_id: specialistOid,
        created_at: { $gte: monthStart },
      }),
    ]);

    return {
      today: todayCount,
      this_month: monthCount,
    };
  }

  /**
   * Check if specialist has exceeded usage limits
   */
  async checkUsageLimits(
    specialistId: string,
    settings: RxGPTSettings,
  ): Promise<{
    allowed: boolean;
    reason?: string;
    usage: { today: number; this_month: number };
    limits: { daily: number; monthly: number };
  }> {
    const usage = await this.getSpecialistUsage(specialistId);
    const limits = settings.usage_limits || { daily_limit: 0, monthly_limit: 0 };

    // Check daily limit (0 = unlimited)
    if (limits.daily_limit > 0 && usage.today >= limits.daily_limit) {
      return {
        allowed: false,
        reason: `Daily limit of ${limits.daily_limit} analyses reached. Limit resets at midnight.`,
        usage,
        limits: { daily: limits.daily_limit, monthly: limits.monthly_limit },
      };
    }

    // Check monthly limit (0 = unlimited)
    if (limits.monthly_limit > 0 && usage.this_month >= limits.monthly_limit) {
      return {
        allowed: false,
        reason: `Monthly limit of ${limits.monthly_limit} analyses reached. Limit resets next month.`,
        usage,
        limits: { daily: limits.daily_limit, monthly: limits.monthly_limit },
      };
    }

    return {
      allowed: true,
      usage,
      limits: { daily: limits.daily_limit, monthly: limits.monthly_limit },
    };
  }

  /**
   * Get credit warnings for a specialist
   */
  getCreditWarnings(
    creditBalance: number,
    settings: RxGPTSettings,
  ): {
    level: 'none' | 'low' | 'critical';
    message?: string;
    credits_remaining: number;
  } {
    const thresholds = settings.usage_limits || {
      low_credit_warning_threshold: 5,
      critical_credit_warning_threshold: 2,
    };

    if (creditBalance <= thresholds.critical_credit_warning_threshold) {
      return {
        level: 'critical',
        message: `Critical: Only ${creditBalance} credit(s) remaining. Purchase more to continue using RxGPT.`,
        credits_remaining: creditBalance,
      };
    }

    if (creditBalance <= thresholds.low_credit_warning_threshold) {
      return {
        level: 'low',
        message: `Warning: ${creditBalance} credit(s) remaining. Consider purchasing more credits.`,
        credits_remaining: creditBalance,
      };
    }

    return {
      level: 'none',
      credits_remaining: creditBalance,
    };
  }

  /**
   * Get full status with usage limits and warnings
   */
  async getSpecialistRxGPTStatus(specialistId: string): Promise<{
    is_available: boolean;
    is_enabled: boolean;
    credits: {
      available: number;
      warning: { level: string; message?: string };
    };
    usage: {
      today: number;
      this_month: number;
      daily_limit: number;
      monthly_limit: number;
      daily_remaining: number | null;
      monthly_remaining: number | null;
    };
    settings: {
      credits_per_analysis: number;
    };
  }> {
    const settings = await this.getSettings();
    const isEnabled = settings.is_enabled && settings.is_enabled_for_specialists;
    const creditBalance = await this.getSpecialistCreditBalance(specialistId);
    const usageLimits = await this.checkUsageLimits(specialistId, settings);
    const creditWarning = this.getCreditWarnings(creditBalance.available, settings);

    const limits = settings.usage_limits || { daily_limit: 0, monthly_limit: 0 };

    return {
      is_available: this.isAvailable() && isEnabled && usageLimits.allowed,
      is_enabled: isEnabled,
      credits: {
        available: creditBalance.available,
        warning: {
          level: creditWarning.level,
          message: creditWarning.message,
        },
      },
      usage: {
        today: usageLimits.usage.today,
        this_month: usageLimits.usage.this_month,
        daily_limit: limits.daily_limit,
        monthly_limit: limits.monthly_limit,
        daily_remaining: limits.daily_limit > 0 ? Math.max(0, limits.daily_limit - usageLimits.usage.today) : null,
        monthly_remaining: limits.monthly_limit > 0 ? Math.max(0, limits.monthly_limit - usageLimits.usage.this_month) : null,
      },
      settings: {
        credits_per_analysis: settings.credit_settings.credits_per_analysis,
      },
    };
  }

  // =====================
  // Caching Methods
  // =====================

  /**
   * Generate a hash from any object
   */
  private generateHash(data: any): string {
    const str = JSON.stringify(data, Object.keys(data).sort());
    return crypto.createHash('sha256').update(str).digest('hex').substring(0, 32);
  }

  /**
   * Generate patient profile hash (allergies, conditions, medications)
   */
  private generatePatientProfileHash(patientContext: PatientContext): string {
    const profileData = {
      age: patientContext.age,
      gender: patientContext.gender,
      weight: patientContext.weight,
      allergies: patientContext.allergies,
      chronic_conditions: patientContext.chronic_conditions.sort(),
      current_medications: patientContext.current_medications.map((m) => m.name).sort(),
    };
    return this.generateHash(profileData);
  }

  /**
   * Generate drugs hash
   */
  private generateDrugsHash(proposedDrugs: ProposedDrug[]): string {
    const drugsData = proposedDrugs
      .map((d) => ({
        name: d.name.toLowerCase(),
        generic_name: (d.generic_name || '').toLowerCase(),
        strength: d.strength,
        dosage: d.dosage,
        frequency: d.frequency,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    return this.generateHash(drugsData);
  }

  /**
   * Generate clinical context hash
   */
  private generateClinicalContextHash(
    clinicalContext: ClinicalContext | null,
    healthCheckupContext: HealthCheckupContext | null,
  ): string {
    const contextData = {
      diagnosis: clinicalContext?.diagnosis || '',
      chief_complaint: clinicalContext?.chief_complaint || '',
      triage_level: healthCheckupContext?.triage_level || '',
      primary_condition: healthCheckupContext?.primary_condition?.name || '',
      symptoms: (healthCheckupContext?.symptoms || []).map((s) => s.name).sort(),
    };
    return this.generateHash(contextData);
  }

  /**
   * Generate cache key for analysis
   */
  private generateCacheKey(
    patientId: string,
    drugsHash: string,
    clinicalContextHash: string,
    aiModel: string,
  ): string {
    return `${patientId}:${drugsHash}:${clinicalContextHash}:${aiModel}`;
  }

  /**
   * Check cache for existing analysis
   */
  private async getCachedAnalysis(
    cacheKey: string,
    patientProfileHash: string,
    aiModel: string,
  ): Promise<RxGPTCacheDocument | null> {
    const cached = await this.cacheModel.findOne({
      cache_key: cacheKey,
      patient_profile_hash: patientProfileHash,
      ai_model: aiModel,
      expires_at: { $gt: new Date() },
    }).exec();

    if (cached) {
      // Update hit count and last accessed
      await this.cacheModel.updateOne(
        { _id: cached._id },
        {
          $inc: { hit_count: 1 },
          $set: { last_accessed_at: new Date() },
        },
      );
      this.logger.log(`Cache HIT for analysis: ${cacheKey.substring(0, 20)}...`);
    }

    return cached;
  }

  /**
   * Store analysis result in cache
   */
  private async cacheAnalysis(
    patientId: string,
    specialistId: string,
    drugsHash: string,
    clinicalContextHash: string,
    patientProfileHash: string,
    aiModel: string,
    result: Omit<RxGPTResponseDto, 'credits_used' | 'credits_remaining'>,
  ): Promise<void> {
    const cacheKey = this.generateCacheKey(patientId, drugsHash, clinicalContextHash, aiModel);

    try {
      await this.cacheModel.findOneAndUpdate(
        { cache_key: cacheKey },
        {
          cache_key: cacheKey,
          patient_id: new Types.ObjectId(patientId),
          specialist_id: new Types.ObjectId(specialistId),
          drugs_hash: drugsHash,
          clinical_context_hash: clinicalContextHash,
          patient_profile_hash: patientProfileHash,
          ai_model: aiModel,
          result: {
            is_safe: result.is_safe,
            overall_risk_level: result.overall_risk_level,
            confidence_score: result.confidence_score,
            alerts: result.alerts,
            recommendations: result.recommendations,
            drug_analyses: result.drug_analyses,
            clinical_summary: result.clinical_summary,
            disclaimer: result.disclaimer,
            model: result.model,
          },
          expires_at: new Date(Date.now() + this.CACHE_TTL_MS),
          hit_count: 0,
        },
        { upsert: true, new: true },
      );
      this.logger.log(`Cached analysis: ${cacheKey.substring(0, 20)}...`);
    } catch (error) {
      this.logger.error('Failed to cache analysis:', error);
    }
  }

  /**
   * Invalidate cache for a patient (when profile changes)
   */
  async invalidatePatientCache(patientId: string): Promise<number> {
    const result = await this.cacheModel.deleteMany({
      patient_id: new Types.ObjectId(patientId),
    }).exec();
    this.logger.log(`Invalidated ${result.deletedCount} cache entries for patient ${patientId}`);
    return result.deletedCount;
  }

  /**
   * Clear all expired cache entries (manual cleanup)
   */
  async cleanupExpiredCache(): Promise<number> {
    const result = await this.cacheModel.deleteMany({
      expires_at: { $lt: new Date() },
    }).exec();
    this.logger.log(`Cleaned up ${result.deletedCount} expired cache entries`);
    return result.deletedCount;
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    total_entries: number;
    total_hits: number;
    average_hits: number;
    oldest_entry: Date | null;
    newest_entry: Date | null;
  }> {
    const [stats] = await this.cacheModel.aggregate([
      {
        $group: {
          _id: null,
          total_entries: { $sum: 1 },
          total_hits: { $sum: '$hit_count' },
          average_hits: { $avg: '$hit_count' },
          oldest_entry: { $min: '$created_at' },
          newest_entry: { $max: '$created_at' },
        },
      },
    ]);

    return {
      total_entries: stats?.total_entries || 0,
      total_hits: stats?.total_hits || 0,
      average_hits: Math.round(stats?.average_hits || 0),
      oldest_entry: stats?.oldest_entry || null,
      newest_entry: stats?.newest_entry || null,
    };
  }

  /**
   * Main analysis endpoint
   */
  async analyze(
    dto: RxGPTAnalyzeDto,
    specialistId: string,
    skipCache: boolean = false,
  ): Promise<RxGPTResponseDto> {
    const startTime = Date.now();
    const settings = await this.getSettings();

    // Check if RxGPT is enabled
    if (!settings.is_enabled || !settings.is_enabled_for_specialists) {
      throw new ForbiddenException('RxGPT is currently disabled');
    }

    if (!this.isAvailable()) {
      throw new BadRequestException('RxGPT AI service is not available');
    }

    // Check rate limit
    const rateLimit = settings.usage_limits?.rate_limit_per_minute || 10;
    if (!this.checkRateLimit(specialistId, rateLimit)) {
      throw new ForbiddenException(
        `Rate limit exceeded. Maximum ${rateLimit} requests per minute allowed.`,
      );
    }

    // Check usage limits (daily/monthly)
    const usageLimitCheck = await this.checkUsageLimits(specialistId, settings);
    if (!usageLimitCheck.allowed) {
      throw new ForbiddenException(usageLimitCheck.reason);
    }

    // Check credits
    const creditBalance = await this.getSpecialistCreditBalance(specialistId);
    const creditsRequired = settings.credit_settings.credits_per_analysis;

    if (creditBalance.available < creditsRequired && !creditBalance.has_unlimited) {
      throw new ForbiddenException(
        `Insufficient credits. Required: ${creditsRequired}, Available: ${creditBalance.available}`,
      );
    }

    // Build context
    const patientContext = await this.buildPatientContext(dto.patient_id);
    const clinicalContext = await this.buildClinicalContext(
      dto.linked_appointments,
      dto.linked_clinical_notes,
    );
    const healthCheckupContext = await this.buildHealthCheckupContext(dto.linked_health_checkups);

    // Generate cache hashes
    const drugsHash = this.generateDrugsHash(dto.proposed_drugs);
    const clinicalContextHash = this.generateClinicalContextHash(clinicalContext, healthCheckupContext);
    const patientProfileHash = this.generatePatientProfileHash(patientContext);
    const cacheKey = this.generateCacheKey(dto.patient_id, drugsHash, clinicalContextHash, settings.ai_model);

    // Check cache first (unless skipCache is true)
    if (!skipCache) {
      const cachedResult = await this.getCachedAnalysis(cacheKey, patientProfileHash, settings.ai_model);
      if (cachedResult) {
        // Found valid cached result - still consume credits
        const creditResult = await this.consumeCredits(specialistId, creditsRequired);

        // Store analytics with cached=true flag
        const responseTime = Date.now() - startTime;
        await this.storeAnalytics(
          specialistId,
          dto.patient_id,
          dto,
          {
            ...cachedResult.result,
            generated_at: cachedResult.created_at,
          } as any,
          settings.ai_model,
          responseTime,
          creditsRequired,
          true, // cached
        );

        // Get credit warning for cached response
        const cachedCreditWarning = this.getCreditWarnings(creditResult.remaining, settings);

        return {
          is_safe: cachedResult.result.is_safe,
          overall_risk_level: cachedResult.result.overall_risk_level as RxGPTRiskLevel,
          confidence_score: cachedResult.result.confidence_score,
          alerts: cachedResult.result.alerts as RxGPTAlertDto[],
          recommendations: cachedResult.result.recommendations as RxGPTRecommendationDto[],
          drug_analyses: cachedResult.result.drug_analyses as DrugAnalysisDto[],
          clinical_summary: cachedResult.result.clinical_summary,
          disclaimer: cachedResult.result.disclaimer || settings.disclaimer_text,
          generated_at: cachedResult.created_at,
          model: cachedResult.result.model,
          credits_used: creditsRequired,
          credits_remaining: creditResult.remaining,
          cached: true,
          warning: cachedCreditWarning.level !== 'none' ? {
            level: cachedCreditWarning.level as 'low' | 'critical',
            message: cachedCreditWarning.message!,
            credits_remaining: cachedCreditWarning.credits_remaining,
          } : undefined,
        };
      }
    }

    // Run fresh analysis
    const analysisResult = await this.runAnalysis(
      patientContext,
      clinicalContext,
      healthCheckupContext,
      dto.proposed_drugs,
      settings,
    );

    // Cache the result
    await this.cacheAnalysis(
      dto.patient_id,
      specialistId,
      drugsHash,
      clinicalContextHash,
      patientProfileHash,
      settings.ai_model,
      analysisResult,
    );

    // Consume credits
    const creditResult = await this.consumeCredits(specialistId, creditsRequired);

    // Store analytics
    const responseTime = Date.now() - startTime;
    await this.storeAnalytics(
      specialistId,
      dto.patient_id,
      dto,
      analysisResult,
      settings.ai_model,
      responseTime,
      creditsRequired,
      false, // not cached
    );

    // Get credit warning
    const creditWarning = this.getCreditWarnings(creditResult.remaining, settings);

    return {
      ...analysisResult,
      credits_used: creditsRequired,
      credits_remaining: creditResult.remaining,
      cached: false,
      warning: creditWarning.level !== 'none' ? {
        level: creditWarning.level as 'low' | 'critical',
        message: creditWarning.message!,
        credits_remaining: creditWarning.credits_remaining,
      } : undefined,
    };
  }

  /**
   * Quick check for single drug
   */
  async quickCheck(
    dto: RxGPTQuickCheckDto,
    specialistId: string,
  ): Promise<{
    is_safe: boolean;
    alerts: RxGPTAlertDto[];
    quick_summary: string;
  }> {
    const settings = await this.getSettings();

    if (!settings.is_enabled) {
      throw new ForbiddenException('RxGPT is currently disabled');
    }

    // Build patient context for quick allergy check
    const patientContext = await this.buildPatientContext(dto.patient_id);

    // Check for allergy matches
    const alerts: RxGPTAlertDto[] = [];
    const drugNameLower = dto.drug_name.toLowerCase();
    const genericLower = (dto.generic_name || '').toLowerCase();

    for (const allergy of patientContext.allergies.drug) {
      const allergenLower = allergy.allergen.toLowerCase();
      if (
        drugNameLower.includes(allergenLower) ||
        genericLower.includes(allergenLower) ||
        allergenLower.includes(drugNameLower) ||
        allergenLower.includes(genericLower)
      ) {
        alerts.push({
          type: RxGPTAlertType.ALLERGY,
          severity: RxGPTAlertSeverity.CRITICAL,
          drug_name: dto.drug_name,
          message: `Patient has documented allergy to ${allergy.allergen}`,
          reasoning: `The proposed drug ${dto.drug_name} may contain or be related to ${allergy.allergen}, which the patient is allergic to.${allergy.reaction ? ` Known reaction: ${allergy.reaction}` : ''}`,
          action_required: 'Consider alternative medication or verify with patient before prescribing',
        });
      }
    }

    const isSafe = alerts.length === 0;
    const quickSummary = isSafe
      ? `No immediate concerns found for ${dto.drug_name}. Full analysis recommended for comprehensive safety check.`
      : `${alerts.length} potential issue(s) found with ${dto.drug_name}. Review alerts before prescribing.`;

    return {
      is_safe: isSafe,
      alerts,
      quick_summary: quickSummary,
    };
  }

  /**
   * Suggest medications based on patient context and diagnosis
   * This is the main AI-powered medication suggestion feature
   */
  async suggestMedications(
    dto: RxGPTSuggestMedicationsDto,
    specialistId: string,
  ): Promise<RxGPTSuggestMedicationsResponseDto> {
    const startTime = Date.now();
    const settings = await this.getSettings();

    // Check if RxGPT is enabled
    if (!settings.is_enabled || !settings.is_enabled_for_specialists) {
      throw new ForbiddenException('RxGPT is currently disabled');
    }

    if (!this.isAvailable()) {
      throw new BadRequestException('RxGPT AI service is not available');
    }

    // Check rate limit
    const rateLimit = settings.usage_limits?.rate_limit_per_minute || 10;
    if (!this.checkRateLimit(specialistId, rateLimit)) {
      throw new ForbiddenException(
        `Rate limit exceeded. Maximum ${rateLimit} requests per minute allowed.`,
      );
    }

    // Check usage limits
    const usageLimitCheck = await this.checkUsageLimits(specialistId, settings);
    if (!usageLimitCheck.allowed) {
      throw new ForbiddenException(usageLimitCheck.reason);
    }

    // Check credits
    const creditBalance = await this.getSpecialistCreditBalance(specialistId);
    const creditsRequired = settings.credit_settings.credits_per_analysis;

    if (creditBalance.available < creditsRequired && !creditBalance.has_unlimited) {
      throw new ForbiddenException(
        `Insufficient credits. Required: ${creditsRequired}, Available: ${creditBalance.available}`,
      );
    }

    // Build patient context
    const patientContext = await this.buildPatientContext(dto.patient_id);
    const clinicalContext = await this.buildClinicalContext(
      dto.linked_appointments,
      dto.linked_clinical_notes,
    );
    const healthCheckupContext = await this.buildHealthCheckupContext(dto.linked_health_checkups);

    // Get medication suggestions from AI
    const suggestions = await this.generateMedicationSuggestions(
      patientContext,
      clinicalContext,
      healthCheckupContext,
      dto,
      settings,
    );

    // Check inventory for each suggested medication
    const enrichedSuggestions = await this.enrichSuggestionsWithInventory(
      suggestions,
      dto.prefer_inventory !== false,
    );

    // Fact-Check Layer: Validate drug names against trusted databases (uses OpenFDA)
    const verifiedSuggestions = settings.data_sources?.use_openfda !== false
      ? await this.validateDrugNames(enrichedSuggestions)
      : enrichedSuggestions;

    // Dosage Validation: Check dosages against FDA guidelines for patient population
    const dosageValidatedSuggestions = settings.data_sources?.use_openfda !== false
      ? await this.validateDosages(verifiedSuggestions, patientContext)
      : verifiedSuggestions;

    // PubMed Evidence: Enrich suggestions with clinical evidence citations
    const condition = dto.diagnosis || clinicalContext?.diagnosis || healthCheckupContext?.primary_condition?.name;
    const pubmedEnrichedSuggestions = settings.data_sources?.use_pubmed !== false
      ? await this.enrichWithPubMedCitations(dosageValidatedSuggestions, condition)
      : dosageValidatedSuggestions;

    // NICE Guidelines: Validate against UK clinical standards
    let niceValidatedSuggestions = pubmedEnrichedSuggestions;
    let niceValidationResults: any[] = [];
    if (settings.data_sources?.use_nice_guidelines) {
      const niceResult = await this.validateWithNICEGuidelines(pubmedEnrichedSuggestions, condition);
      niceValidatedSuggestions = niceResult.suggestions;
      niceValidationResults = niceResult.validationResults;
    }

    // BNF: Validate against UK prescribing guidelines
    let bnfValidatedSuggestions = niceValidatedSuggestions;
    let bnfValidationResults: any[] = [];
    if (settings.data_sources?.use_bnf) {
      const bnfResult = await this.validateWithBNF(niceValidatedSuggestions, condition, patientContext);
      bnfValidatedSuggestions = bnfResult.suggestions;
      bnfValidationResults = bnfResult.validationResults;
    }

    // Evidence-Based Confidence: Calculate grounded confidence scores
    const validatedSuggestions = this.calculateEvidenceBasedConfidence(bnfValidatedSuggestions, condition);

    // Hallucination Detection: Check for potential AI errors
    const hallucinationReport = settings.data_sources?.use_hallucination_detection !== false
      ? await this.hallucinationDetector.detectHallucinations(
          validatedSuggestions,
          specialistId,
          dto.patient_id,
        )
      : {
          recommendation: 'safe' as const,
          hallucinations_detected: 0,
          critical_count: 0,
          high_count: 0,
          medium_count: 0,
          low_count: 0,
          overall_suspicion_score: 0,
          summary: 'Hallucination detection disabled',
          drug_checks: [],
          timestamp: new Date(),
          total_items_checked: 0,
        };

    // Consume credits
    const creditResult = await this.consumeCredits(specialistId, creditsRequired);

    // Build response with validated suggestions
    const response: RxGPTSuggestMedicationsResponseDto = {
      suggestions: validatedSuggestions,
      clinical_context: {
        diagnosis: dto.diagnosis || clinicalContext?.diagnosis,
        symptoms: dto.symptoms || healthCheckupContext?.symptoms?.map(s => s.name),
        primary_condition: healthCheckupContext?.primary_condition?.name,
        triage_level: healthCheckupContext?.triage_level,
      },
      patient_considerations: {
        allergies: patientContext.allergies.drug.map(a => a.allergen),
        current_medications: patientContext.current_medications.map(m => m.name),
        chronic_conditions: patientContext.chronic_conditions,
        age: patientContext.age,
        gender: patientContext.gender,
      },
      clinical_summary: this.buildSuggestionsSummary(validatedSuggestions, patientContext),
      disclaimer: settings.disclaimer_text || 'RxGPT suggestions are for informational purposes only. All treatment decisions should be made by licensed healthcare professionals.',
      generated_at: new Date(),
      model: settings.ai_model,
      confidence_score: this.calculateOverallConfidence(validatedSuggestions),
      credits_used: creditsRequired,
      credits_remaining: creditResult.remaining,
      // Fact-Check Layer summary
      verification_summary: this.buildVerificationSummary(validatedSuggestions),
      // Dosage Validation summary
      dosage_validation_summary: this.buildDosageValidationSummary(validatedSuggestions),
      // PubMed Evidence summary
      pubmed_evidence_summary: this.buildPubMedEvidenceSummary(validatedSuggestions),
      // NICE Guidelines Compliance summary
      nice_compliance_summary: this.niceService.buildComplianceSummary(niceValidationResults),
      // BNF (British National Formulary) summary
      bnf_compliance_summary: this.bnfService.buildComplianceSummary(bnfValidationResults),
      // Evidence-based confidence summary
      evidence_summary: this.buildOverallEvidenceSummary(validatedSuggestions),
      // Hallucination detection report
      hallucination_check: {
        passed: hallucinationReport.recommendation !== 'reject',
        total_flags: hallucinationReport.hallucinations_detected,
        critical_count: hallucinationReport.critical_count,
        high_count: hallucinationReport.high_count,
        medium_count: hallucinationReport.medium_count,
        low_count: hallucinationReport.low_count,
        suspicion_score: hallucinationReport.overall_suspicion_score,
        recommendation: hallucinationReport.recommendation,
        summary: hallucinationReport.summary,
        flagged_drugs: hallucinationReport.drug_checks
          .filter(c => c.flags.length > 0)
          .map(c => ({
            drug_name: c.drug_name,
            issues: c.flags.map(f => ({
              type: f.type,
              severity: f.severity,
              reason: f.reason,
            })),
          })),
      },
    };

    // Update confidence_score with evidence-based average
    response.confidence_score = response.evidence_summary?.overall_evidence_score || response.confidence_score;

    // Store analytics
    const responseTime = Date.now() - startTime;
    await this.storeSuggestionAnalytics(
      specialistId,
      dto.patient_id,
      dto,
      response,
      settings.ai_model,
      responseTime,
      creditsRequired,
    );

    return response;
  }

  /**
   * Standalone analysis - works without a patient ID
   * Builds patient context from inline demographics instead of DB lookup
   */
  async standaloneAnalyze(
    dto: RxGPTStandaloneAnalyzeDto,
    specialistId: string,
  ): Promise<RxGPTSuggestMedicationsResponseDto> {
    const startTime = Date.now();
    const settings = await this.getSettings();

    if (!settings.is_enabled || !settings.is_enabled_for_specialists) {
      throw new ForbiddenException('RxGPT is currently disabled');
    }

    if (!this.isAvailable()) {
      throw new BadRequestException('RxGPT AI service is not available');
    }

    // Check rate limit
    const rateLimit = settings.usage_limits?.rate_limit_per_minute || 10;
    if (!this.checkRateLimit(specialistId, rateLimit)) {
      throw new ForbiddenException(
        `Rate limit exceeded. Maximum ${rateLimit} requests per minute allowed.`,
      );
    }

    // Check usage limits
    const usageLimitCheck = await this.checkUsageLimits(specialistId, settings);
    if (!usageLimitCheck.allowed) {
      throw new ForbiddenException(usageLimitCheck.reason);
    }

    // Check credits
    const creditBalance = await this.getSpecialistCreditBalance(specialistId);
    const creditsRequired = settings.credit_settings.credits_per_analysis;

    if (creditBalance.available < creditsRequired && !creditBalance.has_unlimited) {
      throw new ForbiddenException(
        `Insufficient credits. Required: ${creditsRequired}, Available: ${creditBalance.available}`,
      );
    }

    // Build patient context from inline data (no DB lookup)
    const ctx = dto.patient_context || {};
    const patientContext: PatientContext = {
      patient_id: 'standalone',
      age: ctx.age || 30,
      gender: ctx.gender || 'unknown',
      weight: ctx.weight,
      allergies: {
        drug: (ctx.allergies || []).map(a => ({ allergen: a })),
        food: [],
        environmental: [],
      },
      chronic_conditions: ctx.chronic_conditions || [],
      current_medications: (ctx.current_medications || []).map(m => ({
        name: m.name,
        dosage: m.dosage,
        frequency: m.frequency,
        reason: m.reason,
      })),
      family_history: [],
    };

    // Build clinical context from diagnosis
    const clinicalContext: ClinicalContext = {
      diagnosis: dto.diagnosis,
      treatment_plan: dto.treatment_goal,
    };

    // Build health checkup context from symptoms
    const healthCheckupContext: HealthCheckupContext | null = dto.symptoms?.length
      ? {
          symptoms: dto.symptoms.map(s => ({ name: s })),
          risk_factors: [
            ...(ctx.renal_impairment ? ['Renal impairment'] : []),
            ...(ctx.hepatic_impairment ? ['Hepatic impairment'] : []),
            ...(ctx.pregnant ? ['Pregnancy'] : []),
          ],
        }
      : null;

    // Build a compatible suggest-medications DTO for AI generation
    const suggestDto: RxGPTSuggestMedicationsDto = {
      patient_id: 'standalone',
      diagnosis: dto.diagnosis,
      treatment_goal: dto.treatment_goal,
      symptoms: dto.symptoms,
      max_suggestions: dto.max_suggestions || 5,
      prefer_inventory: dto.prefer_inventory,
    };

    // Generate suggestions using AI
    const suggestions = await this.generateMedicationSuggestions(
      patientContext,
      clinicalContext,
      healthCheckupContext,
      suggestDto,
      settings,
    );

    // Enrich with inventory
    const enrichedSuggestions = await this.enrichSuggestionsWithInventory(
      suggestions,
      dto.prefer_inventory !== false,
    );

    // Run full verification pipeline (same as suggestMedications)
    const condition = dto.diagnosis;

    const verifiedSuggestions = settings.data_sources?.use_openfda !== false
      ? await this.validateDrugNames(enrichedSuggestions)
      : enrichedSuggestions;

    const dosageValidatedSuggestions = settings.data_sources?.use_openfda !== false
      ? await this.validateDosages(verifiedSuggestions, patientContext)
      : verifiedSuggestions;

    const pubmedEnrichedSuggestions = settings.data_sources?.use_pubmed !== false
      ? await this.enrichWithPubMedCitations(dosageValidatedSuggestions, condition)
      : dosageValidatedSuggestions;

    let niceValidatedSuggestions = pubmedEnrichedSuggestions;
    let niceValidationResults: any[] = [];
    if (settings.data_sources?.use_nice_guidelines) {
      const niceResult = await this.validateWithNICEGuidelines(pubmedEnrichedSuggestions, condition);
      niceValidatedSuggestions = niceResult.suggestions;
      niceValidationResults = niceResult.validationResults;
    }

    let bnfValidatedSuggestions = niceValidatedSuggestions;
    let bnfValidationResults: any[] = [];
    if (settings.data_sources?.use_bnf) {
      const bnfResult = await this.validateWithBNF(niceValidatedSuggestions, condition, patientContext);
      bnfValidatedSuggestions = bnfResult.suggestions;
      bnfValidationResults = bnfResult.validationResults;
    }

    const validatedSuggestions = this.calculateEvidenceBasedConfidence(bnfValidatedSuggestions, condition);

    const hallucinationReport = settings.data_sources?.use_hallucination_detection !== false
      ? await this.hallucinationDetector.detectHallucinations(
          validatedSuggestions,
          specialistId,
          'standalone',
        )
      : {
          recommendation: 'safe' as const,
          hallucinations_detected: 0,
          critical_count: 0,
          high_count: 0,
          medium_count: 0,
          low_count: 0,
          overall_suspicion_score: 0,
          summary: 'Hallucination detection disabled',
          drug_checks: [],
          timestamp: new Date(),
          total_items_checked: 0,
        };

    // Consume credits
    const creditResult = await this.consumeCredits(specialistId, creditsRequired);

    // Build response
    const response: RxGPTSuggestMedicationsResponseDto = {
      suggestions: validatedSuggestions,
      clinical_context: {
        diagnosis: dto.diagnosis,
        symptoms: dto.symptoms,
      },
      patient_considerations: {
        allergies: patientContext.allergies.drug.map(a => a.allergen),
        current_medications: patientContext.current_medications.map(m => m.name),
        chronic_conditions: patientContext.chronic_conditions,
        age: patientContext.age,
        gender: patientContext.gender,
      },
      clinical_summary: this.buildSuggestionsSummary(validatedSuggestions, patientContext),
      disclaimer: settings.disclaimer_text || 'RxGPT suggestions are for informational purposes only. All treatment decisions should be made by licensed healthcare professionals.',
      generated_at: new Date(),
      model: settings.ai_model,
      confidence_score: this.calculateOverallConfidence(validatedSuggestions),
      credits_used: creditsRequired,
      credits_remaining: creditResult.remaining,
      verification_summary: this.buildVerificationSummary(validatedSuggestions),
      dosage_validation_summary: this.buildDosageValidationSummary(validatedSuggestions),
      pubmed_evidence_summary: this.buildPubMedEvidenceSummary(validatedSuggestions),
      nice_compliance_summary: this.niceService.buildComplianceSummary(niceValidationResults),
      bnf_compliance_summary: this.bnfService.buildComplianceSummary(bnfValidationResults),
      evidence_summary: this.buildOverallEvidenceSummary(validatedSuggestions),
      hallucination_check: {
        passed: hallucinationReport.recommendation !== 'reject',
        total_flags: hallucinationReport.hallucinations_detected,
        critical_count: hallucinationReport.critical_count,
        high_count: hallucinationReport.high_count,
        medium_count: hallucinationReport.medium_count,
        low_count: hallucinationReport.low_count,
        suspicion_score: hallucinationReport.overall_suspicion_score,
        recommendation: hallucinationReport.recommendation,
        summary: hallucinationReport.summary,
        flagged_drugs: hallucinationReport.drug_checks
          .filter(c => c.flags.length > 0)
          .map(c => ({
            drug_name: c.drug_name,
            issues: c.flags.map(f => ({
              type: f.type,
              severity: f.severity,
              reason: f.reason,
            })),
          })),
      },
    };

    response.confidence_score = response.evidence_summary?.overall_evidence_score || response.confidence_score;

    // Store analytics (use specialist ID as patient_id placeholder for standalone)
    const responseTime = Date.now() - startTime;
    try {
      await this.analyticsModel.create({
        specialist_id: new Types.ObjectId(specialistId),
        analysis_type: 'standalone',
        tokens_used: 0,
        drugs_analyzed: response.suggestions.map((s) => ({
          drug_name: s.drug_name,
          generic_name: s.generic_name,
          strength: s.strength,
          dosage: s.suggested_dosage
            ? `${s.suggested_dosage}${s.suggested_frequency ? ` ${s.suggested_frequency}` : ''}`
            : '',
          is_appropriate: true,
          confidence: s.confidence,
          is_in_inventory: s.is_in_inventory,
        })),
        is_safe: true,
        overall_risk_level: 'low',
        confidence_score: response.confidence_score,
        alerts: response.suggestions.flatMap((s) =>
          (s.safety_alerts || []).map((alert: any) => ({
            type: alert.type || 'info',
            severity: alert.severity || 'info',
            drug_name: s.drug_name,
            message: alert.message || alert,
          }))
        ),
        total_alerts: response.suggestions.reduce((sum, s) => sum + (s.safety_alerts?.length || 0), 0),
        critical_alerts: 0,
        warning_alerts: 0,
        info_alerts: 0,
        recommendations_count: response.suggestions.length,
        ai_model: settings.ai_model,
        response_time_ms: responseTime,
        credits_used: creditsRequired,
        clinical_summary: response.clinical_summary,
        from_cache: false,
        standalone_context: {
          subject_name: dto.subject_name,
          diagnosis: dto.diagnosis,
          treatment_goal: dto.treatment_goal,
          patient_context: dto.patient_context,
          symptoms: dto.symptoms,
        },
      });
    } catch (error) {
      this.logger.error('Failed to store standalone analytics:', error);
    }

    return response;
  }

  /**
   * Generate medication suggestions using AI
   */
  private async generateMedicationSuggestions(
    patientContext: PatientContext,
    clinicalContext: ClinicalContext | null,
    healthCheckupContext: HealthCheckupContext | null,
    dto: RxGPTSuggestMedicationsDto,
    settings: RxGPTSettings,
  ): Promise<SuggestedMedicationDto[]> {
    const systemPrompt = this.buildSuggestionSystemPrompt(settings);
    const userPrompt = this.buildSuggestionUserPrompt(
      patientContext,
      clinicalContext,
      healthCheckupContext,
      dto,
    );

    try {
      const response = await this.client!.messages.create({
        model: settings.ai_model,
        max_tokens: settings.max_tokens,
        temperature: settings.temperature,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });

      const textContent = response.content.find((block) => block.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text response from Claude');
      }

      return this.parseSuggestionResponse(textContent.text, patientContext);
    } catch (error) {
      this.logger.error('Error generating medication suggestions:', error);
      throw new BadRequestException('Failed to generate medication suggestions. Please try again.');
    }
  }

  /**
   * Build system prompt for medication suggestions
   */
  private buildSuggestionSystemPrompt(settings: RxGPTSettings): string {
    return `You are RxGPT, an AI-powered prescription assistant for healthcare professionals on the Rapid Capsule telemedicine platform.

Your role is to SUGGEST appropriate medications based on:
1. Patient's diagnosis, symptoms, and clinical context
2. Patient's medical history (allergies, conditions, current medications)
3. Clinical guidelines and best practices

CRITICAL SAFETY RULES:
- NEVER suggest medications the patient is allergic to
- Consider drug-drug interactions with current medications
- Adjust dosages for age, weight, and conditions (renal/hepatic)
- Flag any contraindications clearly
- Express confidence scores (0-100%)

MEDICATION SUGGESTION GUIDELINES:
- Suggest primary treatment first, then alternatives
- Include generic names for all drugs
- Provide appropriate strength, dosage, frequency, and duration
- Include clear instructions for the patient
- Estimate quantities based on treatment duration
- Cite clinical guidelines when possible

OUTPUT FORMAT: Respond with ONLY a valid JSON object (no markdown, no explanation):
{
  "suggestions": [
    {
      "drug_name": "Brand name or common name",
      "generic_name": "Active ingredient",
      "strength": "e.g., 500mg",
      "dosage_form": "tablet|capsule|syrup|injection|cream|etc",
      "suggested_dosage": "e.g., 1 tablet, 5ml, etc",
      "suggested_frequency": "e.g., twice daily, every 8 hours",
      "suggested_duration": "e.g., 7 days, 2 weeks",
      "instructions": "Take with food, avoid alcohol, etc",
      "suggested_quantity": number,
      "reasoning": "Why this medication is appropriate",
      "confidence": 0-100,
      "priority": "primary|alternative|supplementary",
      "citations": ["Clinical guideline or source"],
      "contraindication_warnings": ["List any warnings"]
    }
  ],
  "overall_recommendation": "Brief summary of the treatment approach"
}

Maximum ${settings.thresholds?.max_alternatives || 5} suggestions.`;
  }

  /**
   * Build user prompt for medication suggestions
   */
  private buildSuggestionUserPrompt(
    patientContext: PatientContext,
    clinicalContext: ClinicalContext | null,
    healthCheckupContext: HealthCheckupContext | null,
    dto: RxGPTSuggestMedicationsDto,
  ): string {
    let prompt = `Suggest appropriate medications for this patient.

## PATIENT PROFILE
- Age: ${patientContext.age} years
- Gender: ${patientContext.gender}
${patientContext.weight ? `- Weight: ${patientContext.weight} kg` : ''}

## ALLERGIES (CRITICAL - DO NOT SUGGEST THESE)
${patientContext.allergies.drug.length > 0
  ? `Drug Allergies: ${patientContext.allergies.drug.map((a) => `${a.allergen}${a.severity ? ` (${a.severity})` : ''}`).join(', ')}`
  : 'No drug allergies documented'}

## CURRENT MEDICATIONS (CHECK FOR INTERACTIONS)
${patientContext.current_medications.length > 0
  ? patientContext.current_medications.map((m) => `- ${m.name}${m.dosage ? ` ${m.dosage}` : ''}${m.frequency ? ` (${m.frequency})` : ''}`).join('\n')
  : 'No current medications documented'}

## CHRONIC CONDITIONS
${patientContext.chronic_conditions.length > 0
  ? patientContext.chronic_conditions.join(', ')
  : 'None documented'}`;

    // Add clinical context
    if (clinicalContext) {
      prompt += `

## CLINICAL CONTEXT (from linked appointment)
${clinicalContext.diagnosis ? `Diagnosis: ${clinicalContext.diagnosis}` : ''}
${clinicalContext.chief_complaint ? `Chief Complaint: ${clinicalContext.chief_complaint}` : ''}
${clinicalContext.treatment_plan ? `Treatment Plan: ${clinicalContext.treatment_plan}` : ''}`;
    }

    // Add health checkup context
    if (healthCheckupContext) {
      prompt += `

## HEALTH CHECKUP FINDINGS
${healthCheckupContext.triage_level ? `Triage Level: ${healthCheckupContext.triage_level}` : ''}
${healthCheckupContext.primary_condition ? `Primary Condition: ${healthCheckupContext.primary_condition.name} (${Math.round((healthCheckupContext.primary_condition.probability || 0) * 100)}% probability)` : ''}
${healthCheckupContext.symptoms.length > 0 ? `Symptoms: ${healthCheckupContext.symptoms.map((s) => s.name).join(', ')}` : ''}
${healthCheckupContext.ai_summary?.overview ? `Summary: ${healthCheckupContext.ai_summary.overview}` : ''}`;
    }

    // Add explicit request parameters
    if (dto.diagnosis || dto.symptoms?.length || dto.treatment_goal) {
      prompt += `

## SPECIALIST'S INPUT`;
      if (dto.diagnosis) prompt += `\nDiagnosis: ${dto.diagnosis}`;
      if (dto.symptoms?.length) prompt += `\nSymptoms: ${dto.symptoms.join(', ')}`;
      if (dto.treatment_goal) prompt += `\nTreatment Goal: ${dto.treatment_goal}`;
    }

    // Preferences
    if (dto.preferred_dosage_forms?.length) {
      prompt += `\n\n## PREFERENCES\nPreferred dosage forms: ${dto.preferred_dosage_forms.join(', ')}`;
    }

    prompt += `

Based on the above information, suggest ${dto.max_suggestions || 5} appropriate medications, starting with the primary recommendation.`;

    return prompt;
  }

  /**
   * Parse AI suggestion response
   */
  private parseSuggestionResponse(
    responseText: string,
    patientContext: PatientContext,
  ): SuggestedMedicationDto[] {
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
      const suggestions = parsed.suggestions || [];

      return suggestions.map((s: any): SuggestedMedicationDto => ({
        drug_name: s.drug_name || '',
        generic_name: s.generic_name,
        strength: s.strength || '',
        dosage_form: s.dosage_form || 'tablet',
        suggested_dosage: s.suggested_dosage || '',
        suggested_frequency: s.suggested_frequency || '',
        suggested_duration: s.suggested_duration,
        instructions: s.instructions,
        suggested_quantity: s.suggested_quantity || 1,
        is_in_inventory: false, // Will be updated by enrichSuggestionsWithInventory
        reasoning: s.reasoning || '',
        confidence: s.confidence ?? 70,
        priority: s.priority || 'alternative',
        citations: s.citations || [],
        safety_alerts: [],
        contraindication_check: {
          is_safe: !s.contraindication_warnings?.length,
          warnings: s.contraindication_warnings || [],
        },
      }));
    } catch (error) {
      this.logger.error('Failed to parse suggestion response:', error);
      throw new BadRequestException('Failed to parse medication suggestions');
    }
  }

  /**
   * Enrich suggestions with inventory information
   */
  private async enrichSuggestionsWithInventory(
    suggestions: SuggestedMedicationDto[],
    preferInventory: boolean,
  ): Promise<SuggestedMedicationDto[]> {
    // Get the Drug model to search inventory
    const DrugModel = this.userModel.db.model('Drug');

    const enrichedSuggestions: SuggestedMedicationDto[] = [];

    for (const suggestion of suggestions) {
      // Search for matching drug in inventory
      const searchTerms = [
        suggestion.drug_name?.toLowerCase(),
        suggestion.generic_name?.toLowerCase(),
      ].filter(Boolean);

      let matchingDrug: any = null;

      for (const term of searchTerms) {
        if (!term) continue;

        // Try exact match first
        matchingDrug = await DrugModel.findOne({
          $or: [
            { name: { $regex: new RegExp(`^${term}$`, 'i') } },
            { generic_name: { $regex: new RegExp(`^${term}$`, 'i') } },
          ],
          is_active: { $ne: false },
        }).lean();

        // If no exact match, try partial match
        if (!matchingDrug) {
          matchingDrug = await DrugModel.findOne({
            $or: [
              { name: { $regex: term, $options: 'i' } },
              { generic_name: { $regex: term, $options: 'i' } },
            ],
            is_active: { $ne: false },
          }).lean();
        }

        if (matchingDrug) break;
      }

      if (matchingDrug) {
        // Get stock information — primary source is the drug document's `quantity` field,
        // with fallback to stockbatchentities for batch-level tracking
        let totalAvailable = matchingDrug.quantity || 0;
        let lowestPrice = matchingDrug.selling_price || 0;

        // If drug has no direct quantity, check stock batch entities
        if (totalAvailable <= 0) {
          try {
            const batchCollection = this.userModel.db.collection('stockbatchentities');
            const batches = await batchCollection.find({
              drug_id: matchingDrug._id,
              status: { $ne: 'depleted' },
              quantity_available: { $gt: 0 },
            }).toArray();
            totalAvailable = batches.reduce((sum: number, b: any) => sum + (b.quantity_available || 0), 0);
            if (batches.length > 0) {
              const batchPrices = batches
                .map((b: any) => b.selling_price_override)
                .filter((p: any) => p && p > 0);
              if (batchPrices.length > 0) {
                lowestPrice = Math.min(...batchPrices);
              }
            }
          } catch (e) {
            // stockbatchentities may not exist — that's fine
          }
        }

        // Resolve dosage_form - may be an ObjectId reference to dosageformentities
        let resolvedDosageForm = suggestion.dosage_form || 'tablet';
        if (matchingDrug.dosage_form) {
          try {
            const DosageFormCollection = this.userModel.db.collection('dosageformentities');
            const formId = matchingDrug.dosage_form instanceof Types.ObjectId
              ? matchingDrug.dosage_form
              : new Types.ObjectId(String(matchingDrug.dosage_form));
            const dosageFormDoc = await DosageFormCollection.findOne({ _id: formId });
            if (dosageFormDoc) {
              resolvedDosageForm = dosageFormDoc.name || dosageFormDoc.code || 'tablet';
            } else {
              // Not an ObjectId reference - use the value directly if it's a readable string
              const formStr = String(matchingDrug.dosage_form);
              if (!formStr.match(/^[0-9a-fA-F]{24}$/)) {
                resolvedDosageForm = formStr;
              }
            }
          } catch (e) {
            // Value is not a valid ObjectId - use it directly as a string
            const formStr = String(matchingDrug.dosage_form);
            if (!formStr.match(/^[0-9a-fA-F]{24}$/)) {
              resolvedDosageForm = formStr;
            }
          }
        }

        enrichedSuggestions.push({
          ...suggestion,
          drug_id: matchingDrug._id.toString(),
          drug_name: matchingDrug.name,
          generic_name: matchingDrug.generic_name || suggestion.generic_name,
          strength: matchingDrug.strength || suggestion.strength,
          dosage_form: resolvedDosageForm,
          is_in_inventory: true,
          inventory_status: totalAvailable > 10 ? 'available' : totalAvailable > 0 ? 'low_stock' : 'out_of_stock',
          available_quantity: totalAvailable,
          unit_price: lowestPrice,
          currency: 'NGN',
        });
      } else {
        // Drug not in inventory - include as external suggestion
        enrichedSuggestions.push({
          ...suggestion,
          drug_id: undefined,
          is_in_inventory: false,
          inventory_status: undefined,
          available_quantity: undefined,
          unit_price: undefined,
        });
      }
    }

    // Sort: if preferInventory, put inventory items first
    if (preferInventory) {
      enrichedSuggestions.sort((a, b) => {
        if (a.is_in_inventory && !b.is_in_inventory) return -1;
        if (!a.is_in_inventory && b.is_in_inventory) return 1;
        // Then by priority
        const priorityOrder = { primary: 0, alternative: 1, supplementary: 2 };
        return (priorityOrder[a.priority] || 1) - (priorityOrder[b.priority] || 1);
      });
    }

    return enrichedSuggestions;
  }

  /**
   * Fact-Check Layer: Validate drug names against trusted databases
   * Checks if suggested drugs exist in:
   * 1. Local drug inventory (drugentities collection)
   * 2. OpenFDA database (US FDA approved drugs)
   *
   * This helps prevent hallucinated drug names from being presented to specialists
   */
  private async validateDrugNames(
    suggestions: SuggestedMedicationDto[],
  ): Promise<SuggestedMedicationDto[]> {
    this.logger.log(`[Fact-Check] Validating ${suggestions.length} drug suggestions`);

    const DrugModel = this.userModel.db.model('Drug');
    const validatedSuggestions: SuggestedMedicationDto[] = [];

    for (const suggestion of suggestions) {
      const verifiedSources: string[] = [];
      const verificationWarnings: string[] = [];
      let fdaApproved = false;

      const drugName = suggestion.drug_name?.toLowerCase()?.trim();
      const genericName = suggestion.generic_name?.toLowerCase()?.trim();

      if (!drugName) {
        // No drug name - cannot verify
        validatedSuggestions.push({
          ...suggestion,
          verification: {
            is_verified: false,
            verified_sources: [],
            fda_approved: false,
            verification_warnings: ['Drug name is missing or empty'],
            verified_at: new Date(),
          },
        });
        continue;
      }

      // Check 1: Local Drug Inventory
      try {
        const localDrug = await DrugModel.findOne({
          $or: [
            { name: { $regex: new RegExp(`^${drugName}$`, 'i') } },
            { generic_name: { $regex: new RegExp(`^${drugName}$`, 'i') } },
            ...(genericName ? [
              { name: { $regex: new RegExp(`^${genericName}$`, 'i') } },
              { generic_name: { $regex: new RegExp(`^${genericName}$`, 'i') } },
            ] : []),
          ],
          is_active: { $ne: false },
        }).lean();

        if (localDrug) {
          verifiedSources.push('local_inventory');
          this.logger.log(`[Fact-Check] "${drugName}" found in local inventory`);
        }
      } catch (error) {
        this.logger.warn(`[Fact-Check] Error checking local inventory for "${drugName}": ${error.message}`);
      }

      // Check 2: OpenFDA Database
      try {
        const fdaResult = await this.openFDAService.fetchFromFDA(
          genericName || drugName,
          suggestion.drug_name,
        );

        if (fdaResult) {
          verifiedSources.push('openfda');
          fdaApproved = true;
          this.logger.log(`[Fact-Check] "${drugName}" found in OpenFDA database`);

          // Extract FDA generic/brand names for additional verification
          const fdaGenericNames = fdaResult.openfda?.generic_name || [];
          const fdaBrandNames = fdaResult.openfda?.brand_name || [];

          if (fdaGenericNames.length > 0 || fdaBrandNames.length > 0) {
            this.logger.log(
              `[Fact-Check] FDA names - Generic: ${fdaGenericNames.join(', ')}, Brand: ${fdaBrandNames.join(', ')}`,
            );
          }
        }
      } catch (error) {
        this.logger.warn(`[Fact-Check] Error checking OpenFDA for "${drugName}": ${error.message}`);
        verificationWarnings.push('OpenFDA lookup failed - drug may still be valid');
      }

      // Determine verification status
      const isVerified = verifiedSources.length > 0;

      if (!isVerified) {
        verificationWarnings.push(
          `Drug "${suggestion.drug_name}" not found in local inventory or FDA database. ` +
          `This may be an international drug name, newly approved medication, or requires verification.`,
        );
        this.logger.warn(`[Fact-Check] UNVERIFIED: "${drugName}" not found in any trusted database`);
      }

      validatedSuggestions.push({
        ...suggestion,
        verification: {
          is_verified: isVerified,
          verified_sources: verifiedSources,
          fda_approved: fdaApproved,
          verification_warnings: verificationWarnings,
          verified_at: new Date(),
        },
      });
    }

    // Log summary
    const verifiedCount = validatedSuggestions.filter(s => s.verification?.is_verified).length;
    const unverifiedCount = validatedSuggestions.length - verifiedCount;
    this.logger.log(
      `[Fact-Check] Validation complete: ${verifiedCount} verified, ${unverifiedCount} unverified`,
    );

    return validatedSuggestions;
  }

  /**
   * Build verification summary for the response
   */
  private buildVerificationSummary(suggestions: SuggestedMedicationDto[]): {
    total_suggestions: number;
    verified_count: number;
    unverified_count: number;
    fda_approved_count: number;
    has_unverified_drugs: boolean;
    warning?: string;
  } {
    const verifiedCount = suggestions.filter(s => s.verification?.is_verified).length;
    const unverifiedCount = suggestions.length - verifiedCount;
    const fdaApprovedCount = suggestions.filter(s => s.verification?.fda_approved).length;
    const hasUnverified = unverifiedCount > 0;

    let warning: string | undefined;
    if (hasUnverified) {
      const unverifiedNames = suggestions
        .filter(s => !s.verification?.is_verified)
        .map(s => s.drug_name)
        .join(', ');
      warning = `${unverifiedCount} drug(s) could not be verified in trusted databases: ${unverifiedNames}. ` +
        `Please verify these medications before prescribing.`;
    }

    return {
      total_suggestions: suggestions.length,
      verified_count: verifiedCount,
      unverified_count: unverifiedCount,
      fda_approved_count: fdaApprovedCount,
      has_unverified_drugs: hasUnverified,
      warning,
    };
  }

  /**
   * Build dosage validation summary for the response
   */
  private buildDosageValidationSummary(suggestions: SuggestedMedicationDto[]): {
    total_validated: number;
    safe_count: number;
    warning_count: number;
    danger_count: number;
    has_dosage_concerns: boolean;
    warning?: string;
  } {
    const safeCount = suggestions.filter(s => s.dosage_validation?.status === 'safe').length;
    const warningCount = suggestions.filter(s => s.dosage_validation?.status === 'warning').length;
    const dangerCount = suggestions.filter(s => s.dosage_validation?.status === 'danger').length;
    const hasConcerns = warningCount > 0 || dangerCount > 0;

    let warning: string | undefined;
    if (dangerCount > 0) {
      const dangerDrugs = suggestions
        .filter(s => s.dosage_validation?.status === 'danger')
        .map(s => s.drug_name)
        .join(', ');
      warning = `CRITICAL: ${dangerCount} medication(s) have dosages exceeding FDA recommended limits: ${dangerDrugs}. ` +
        `Review and adjust dosages before prescribing.`;
    } else if (warningCount > 0) {
      const warningDrugs = suggestions
        .filter(s => s.dosage_validation?.status === 'warning')
        .map(s => s.drug_name)
        .join(', ');
      warning = `${warningCount} medication(s) have dosage warnings: ${warningDrugs}. ` +
        `Consider reviewing FDA guidelines for patient-specific adjustments.`;
    }

    return {
      total_validated: suggestions.length,
      safe_count: safeCount,
      warning_count: warningCount,
      danger_count: dangerCount,
      has_dosage_concerns: hasConcerns,
      warning,
    };
  }

  /**
   * Enrich suggestions with PubMed evidence citations
   * Searches for clinical evidence for each suggested drug
   */
  private async enrichWithPubMedCitations(
    suggestions: SuggestedMedicationDto[],
    condition?: string,
  ): Promise<SuggestedMedicationDto[]> {
    this.logger.log(`[PubMed] Enriching ${suggestions.length} suggestions with clinical evidence`);

    const enrichedSuggestions: SuggestedMedicationDto[] = [];

    for (const suggestion of suggestions) {
      const drugName = suggestion.generic_name || suggestion.drug_name;

      try {
        const evidence = await this.pubmedService.searchDrugEvidence({
          drug_name: drugName,
          condition: condition,
          max_results: 3, // Top 3 citations per drug
          sort: 'relevance',
        });

        enrichedSuggestions.push({
          ...suggestion,
          pubmed_citations: {
            total_found: evidence.total_articles_found,
            citations: evidence.citations.map(c => ({
              pmid: c.pmid,
              title: c.title,
              authors_short: c.authors_short,
              journal: c.journal_abbrev,
              year: c.year,
              url: c.url,
              evidence_level: c.evidence.level,
              relevance_score: c.relevance_score,
            })),
            evidence_summary: evidence.evidence_summary,
            search_condition: condition,
          },
        });

        if (evidence.total_articles_found > 0) {
          this.logger.log(
            `[PubMed] Found ${evidence.total_articles_found} articles for ${drugName} ` +
            `(${evidence.evidence_summary.high_quality_count} high quality)`
          );
        }
      } catch (error) {
        this.logger.warn(`[PubMed] Error fetching evidence for ${drugName}: ${error.message}`);
        // Continue without citations if PubMed fails
        enrichedSuggestions.push({
          ...suggestion,
          pubmed_citations: {
            total_found: 0,
            citations: [],
          },
        });
      }
    }

    return enrichedSuggestions;
  }

  /**
   * Build PubMed evidence summary for the response
   */
  private buildPubMedEvidenceSummary(suggestions: SuggestedMedicationDto[]): {
    total_drugs_with_evidence: number;
    total_citations: number;
    high_quality_evidence_count: number;
    drugs_without_evidence: string[];
    has_strong_evidence: boolean;
  } {
    const drugsWithEvidence = suggestions.filter(
      s => s.pubmed_citations && s.pubmed_citations.total_found > 0
    );
    const drugsWithoutEvidence = suggestions
      .filter(s => !s.pubmed_citations || s.pubmed_citations.total_found === 0)
      .map(s => s.drug_name);

    const totalCitations = suggestions.reduce(
      (sum, s) => sum + (s.pubmed_citations?.citations?.length || 0),
      0
    );

    const highQualityCount = suggestions.reduce(
      (sum, s) => sum + (s.pubmed_citations?.evidence_summary?.high_quality_count || 0),
      0
    );

    // Strong evidence = at least half the drugs have high-quality evidence
    const hasStrongEvidence = highQualityCount >= Math.ceil(suggestions.length / 2);

    return {
      total_drugs_with_evidence: drugsWithEvidence.length,
      total_citations: totalCitations,
      high_quality_evidence_count: highQualityCount,
      drugs_without_evidence: drugsWithoutEvidence,
      has_strong_evidence: hasStrongEvidence,
    };
  }

  /**
   * Validate suggestions against NICE (UK) guidelines
   */
  private async validateWithNICEGuidelines(
    suggestions: SuggestedMedicationDto[],
    condition?: string,
  ): Promise<{ suggestions: SuggestedMedicationDto[]; validationResults: NICEValidationResult[] }> {
    this.logger.log(`[NICE] Validating ${suggestions.length} suggestions against UK guidelines`);

    const enrichedSuggestions: SuggestedMedicationDto[] = [];
    const validationResults: NICEValidationResult[] = [];

    for (const suggestion of suggestions) {
      const drugName = suggestion.generic_name || suggestion.drug_name;

      try {
        const validation = await this.niceService.validateDrugForCondition(drugName, condition);
        validationResults.push(validation);

        // Get the primary recommendation if any
        const primaryRec = validation.recommendations[0];

        enrichedSuggestions.push({
          ...suggestion,
          nice_compliance: {
            is_compliant: validation.is_nice_compliant,
            compliance_level: validation.compliance_level,
            recommendation_type: primaryRec?.recommendation_type,
            line_of_treatment: primaryRec?.line_of_treatment,
            guideline_references: validation.guidelines_checked.map(g => ({
              id: g.id,
              title: g.title,
              url: g.url,
            })),
            warnings: validation.warnings,
            recommendation_text: primaryRec?.recommendation_text,
          },
        });

        if (validation.warnings.length > 0) {
          this.logger.warn(`[NICE] ${drugName}: ${validation.warnings.join('; ')}`);
        } else if (validation.compliance_level === 'full') {
          this.logger.log(`[NICE] ${drugName}: Fully compliant with NICE guidelines`);
        }
      } catch (error) {
        this.logger.warn(`[NICE] Error validating ${drugName}: ${error.message}`);
        enrichedSuggestions.push({
          ...suggestion,
          nice_compliance: {
            is_compliant: true, // Assume compliant if check fails
            compliance_level: 'unknown',
            guideline_references: [],
            warnings: ['Unable to validate against NICE guidelines'],
          },
        });
      }
    }

    const compliantCount = validationResults.filter(r => r.is_nice_compliant).length;
    const nonCompliantCount = validationResults.filter(r => !r.is_nice_compliant).length;
    this.logger.log(
      `[NICE] Validation complete: ${compliantCount} compliant, ${nonCompliantCount} non-compliant`
    );

    return { suggestions: enrichedSuggestions, validationResults };
  }

  /**
   * Validate suggestions against BNF (British National Formulary)
   * Provides UK-specific prescribing information
   */
  private async validateWithBNF(
    suggestions: SuggestedMedicationDto[],
    condition?: string,
    patientContext?: PatientContext,
  ): Promise<{ suggestions: SuggestedMedicationDto[]; validationResults: BNFValidationResult[] }> {
    this.logger.log(`[BNF] Validating ${suggestions.length} suggestions against UK prescribing guidelines`);

    const enrichedSuggestions: SuggestedMedicationDto[] = [];
    const validationResults: BNFValidationResult[] = [];

    // Determine patient population
    const population = patientContext
      ? patientContext.age < 18 ? 'child' : patientContext.age >= 65 ? 'elderly' : 'adult'
      : 'adult';

    for (const suggestion of suggestions) {
      const drugName = suggestion.generic_name || suggestion.drug_name;

      try {
        const validation = await this.bnfService.validateDrug(
          drugName,
          condition,
          suggestion.suggested_dosage,
          population,
        );
        validationResults.push(validation);

        // Get drug info for additional details
        const drugInfo = this.bnfService.getDrugInfo(drugName);

        enrichedSuggestions.push({
          ...suggestion,
          bnf_info: {
            found_in_bnf: validation.found_in_bnf,
            uk_approved: validation.uk_approved,
            drug_class: drugInfo?.drug_class,
            bnf_url: validation.bnf_url,
            indications: validation.indications_checked,
            indication_match: validation.indication_match,
            dosage_appropriate: validation.dosage_appropriate,
            dosage_warnings: validation.dosage_warnings,
            cautions: validation.cautions,
            contraindications: validation.contraindication_flags,
            interactions: validation.interaction_alerts.map(i => ({
              drug: i.interacting_drug,
              severity: i.severity,
              effect: i.effect,
              action: i.action,
            })),
            side_effects: drugInfo?.side_effects ? {
              common: drugInfo.side_effects.common,
              uncommon: drugInfo.side_effects.uncommon,
              rare: drugInfo.side_effects.rare,
            } : undefined,
            special_population_warnings: validation.special_population_warnings,
          },
        });

        if (!validation.found_in_bnf) {
          this.logger.warn(`[BNF] ${drugName}: Not found in BNF database`);
        } else if (validation.dosage_warnings.length > 0) {
          this.logger.warn(`[BNF] ${drugName}: ${validation.dosage_warnings.join('; ')}`);
        } else {
          this.logger.log(`[BNF] ${drugName}: Validated against BNF`);
        }
      } catch (error) {
        this.logger.warn(`[BNF] Error validating ${drugName}: ${error.message}`);
        enrichedSuggestions.push({
          ...suggestion,
          bnf_info: {
            found_in_bnf: false,
            uk_approved: false,
            indications: [],
            indication_match: false,
            dosage_appropriate: true,
            dosage_warnings: ['Unable to validate against BNF'],
            cautions: [],
            contraindications: [],
            interactions: [],
            special_population_warnings: [],
          },
        });
      }
    }

    const foundCount = validationResults.filter(r => r.found_in_bnf).length;
    const notFoundCount = validationResults.length - foundCount;
    this.logger.log(
      `[BNF] Validation complete: ${foundCount} found in BNF, ${notFoundCount} not found`
    );

    return { suggestions: enrichedSuggestions, validationResults };
  }

  /**
   * Calculate evidence-based confidence scores
   * ADJUSTS (not replaces) AI-generated confidence based on evidence
   *
   * Philosophy: AI confidence is the starting point, evidence adjusts it:
   * - If evidence strongly supports: boost confidence
   * - If evidence contradicts or is missing: reduce confidence
   * - If no evidence data available: keep AI confidence with note
   *
   * Evidence adjustments (applied to AI base):
   * - FDA approved for indication: +15%
   * - NICE recommended: +10%
   * - PubMed high-quality evidence: +10%
   * - BNF listed with indication match: +5%
   * - Off-label use: -15%
   * - Unverified drug: -20%
   * - Dosage concerns: -10%
   * - NICE advises against: -20%
   */
  private calculateEvidenceBasedConfidence(
    suggestions: SuggestedMedicationDto[],
    condition?: string,
  ): SuggestedMedicationDto[] {
    this.logger.log(`[Evidence Confidence] Adjusting confidence with evidence for ${suggestions.length} suggestions`);

    return suggestions.map(suggestion => {
      const adjustments: Array<{ source: string; adjustment: number; reason: string }> = [];

      // Keep AI confidence as the BASE - don't cap it
      const aiConfidence = suggestion.confidence || 70;
      let totalScore = aiConfidence;
      let evidenceSourcesChecked = 0;
      let evidenceSourcesFound = 0;

      // Track evidence quality
      let hasStrongEvidence = false;
      let isOffLabel = false;

      // 1. FDA Verification
      if (suggestion.verification) {
        evidenceSourcesChecked++;
        if (suggestion.verification.fda_approved) {
          adjustments.push({
            source: 'fda_approved',
            adjustment: 15,
            reason: 'Drug is FDA approved',
          });
          totalScore += 15;
          hasStrongEvidence = true;
          evidenceSourcesFound++;
        } else if (suggestion.verification.is_verified) {
          // Found in inventory but not FDA
          adjustments.push({
            source: 'inventory_verified',
            adjustment: 5,
            reason: 'Drug verified in platform inventory',
          });
          totalScore += 5;
          evidenceSourcesFound++;
        } else if (!suggestion.verification.is_verified) {
          // Drug not verified anywhere
          adjustments.push({
            source: 'unverified',
            adjustment: -20,
            reason: 'Drug could not be verified in trusted databases',
          });
          totalScore -= 20;
        }
      }

      // 2. NICE Guidelines (if data available)
      if (suggestion.nice_compliance) {
        evidenceSourcesChecked++;
        if (suggestion.nice_compliance.recommendation_type === 'recommended') {
          adjustments.push({
            source: 'nice_recommended',
            adjustment: 10,
            reason: `NICE recommends this drug${suggestion.nice_compliance.line_of_treatment === 'first_line' ? ' as first-line treatment' : ''}`,
          });
          totalScore += 10;
          hasStrongEvidence = true;
          evidenceSourcesFound++;
        } else if (suggestion.nice_compliance.recommendation_type === 'consider') {
          adjustments.push({
            source: 'nice_consider',
            adjustment: 5,
            reason: 'NICE suggests considering this drug',
          });
          totalScore += 5;
          evidenceSourcesFound++;
        } else if (suggestion.nice_compliance.recommendation_type === 'do_not_offer') {
          adjustments.push({
            source: 'nice_not_recommended',
            adjustment: -20,
            reason: 'NICE recommends AGAINST this drug for this indication',
          });
          totalScore -= 20;
        } else if (suggestion.nice_compliance.recommendation_type === 'caution') {
          adjustments.push({
            source: 'nice_caution',
            adjustment: -5,
            reason: 'NICE advises caution with this drug',
          });
          totalScore -= 5;
        }

        // Check for off-label use
        if (!suggestion.nice_compliance.is_compliant && suggestion.nice_compliance.compliance_level === 'none') {
          isOffLabel = true;
        }
      }

      // 3. PubMed Evidence (if data available)
      if (suggestion.pubmed_citations) {
        evidenceSourcesChecked++;
        if (suggestion.pubmed_citations.total_found > 0) {
          evidenceSourcesFound++;
          const highQualityCount = suggestion.pubmed_citations.evidence_summary?.high_quality_count || 0;
          const moderateQualityCount = suggestion.pubmed_citations.evidence_summary?.moderate_quality_count || 0;

          if (highQualityCount > 0) {
            // Has meta-analysis or systematic review
            adjustments.push({
              source: 'pubmed_high_quality',
              adjustment: 10,
              reason: `${highQualityCount} high-quality evidence (meta-analysis/systematic review) found`,
            });
            totalScore += 10;
            hasStrongEvidence = true;
          } else if (moderateQualityCount >= 2) {
            // Multiple RCTs
            adjustments.push({
              source: 'pubmed_multiple_rcts',
              adjustment: 8,
              reason: `${moderateQualityCount} clinical trials/RCTs found`,
            });
            totalScore += 8;
            hasStrongEvidence = true;
          } else if (moderateQualityCount === 1) {
            adjustments.push({
              source: 'pubmed_single_rct',
              adjustment: 5,
              reason: '1 clinical trial found',
            });
            totalScore += 5;
          } else {
            adjustments.push({
              source: 'pubmed_other',
              adjustment: 3,
              reason: `${suggestion.pubmed_citations.citations?.length || 0} publication(s) found`,
            });
            totalScore += 3;
          }
        }
        // Note: No penalty for no PubMed results - absence of evidence is not evidence of absence
      }

      // 4. BNF (if data available)
      if (suggestion.bnf_info) {
        evidenceSourcesChecked++;
        if (suggestion.bnf_info.found_in_bnf) {
          evidenceSourcesFound++;
          adjustments.push({
            source: 'bnf_listed',
            adjustment: 5,
            reason: 'Drug is listed in British National Formulary',
          });
          totalScore += 5;

          // Check indication match
          if (suggestion.bnf_info.indication_match) {
            adjustments.push({
              source: 'bnf_indication_match',
              adjustment: 3,
              reason: 'BNF confirms indication match',
            });
            totalScore += 3;
          } else if (condition && !suggestion.bnf_info.indication_match) {
            isOffLabel = true;
          }
        }
      }

      // 5. Off-label penalty (moderate reduction)
      if (isOffLabel) {
        adjustments.push({
          source: 'off_label',
          adjustment: -15,
          reason: 'Off-label use - not a standard indication for this drug',
        });
        totalScore -= 15;
      }

      // 6. Dosage concerns
      if (suggestion.dosage_validation?.status === 'danger') {
        adjustments.push({
          source: 'dosage_danger',
          adjustment: -10,
          reason: 'Dosage exceeds recommended limits',
        });
        totalScore -= 10;
      } else if (suggestion.dosage_validation?.status === 'warning') {
        adjustments.push({
          source: 'dosage_warning',
          adjustment: -5,
          reason: 'Dosage may need adjustment for patient',
        });
        totalScore -= 5;
      }

      // Clamp final score between 0 and 100
      const finalScore = Math.max(0, Math.min(100, Math.round(totalScore)));

      // Determine evidence level based on final score AND evidence coverage
      let evidenceLevel: 'very_high' | 'high' | 'moderate' | 'low' | 'very_low';
      if (finalScore >= 85 && hasStrongEvidence) evidenceLevel = 'very_high';
      else if (finalScore >= 70 && evidenceSourcesFound >= 2) evidenceLevel = 'high';
      else if (finalScore >= 55) evidenceLevel = 'moderate';
      else if (finalScore >= 35) evidenceLevel = 'low';
      else evidenceLevel = 'very_low';

      // Build evidence summary
      const positiveSources = adjustments.filter(a => a.adjustment > 0).map(a => a.source);
      const evidenceSummary = this.buildEvidenceSummaryText(
        positiveSources,
        hasStrongEvidence,
        isOffLabel,
        evidenceSourcesChecked,
        evidenceSourcesFound,
      );

      // Keep BOTH original AI confidence and evidence-adjusted confidence
      return {
        ...suggestion,
        confidence: finalScore, // Updated with evidence adjustments
        evidence_confidence: {
          final_score: finalScore,
          base_score: aiConfidence, // Original AI confidence preserved here
          adjustments,
          evidence_level: evidenceLevel,
          evidence_summary: evidenceSummary,
          is_off_label: isOffLabel,
          grounded_in_evidence: hasStrongEvidence,
        },
      };
    });
  }

  /**
   * Build human-readable evidence summary text
   */
  private buildEvidenceSummaryText(
    sources: string[],
    hasStrongEvidence: boolean,
    isOffLabel: boolean,
    sourcesChecked: number = 0,
    sourcesFound: number = 0,
  ): string {
    const sourceDescriptions: Record<string, string> = {
      'fda_approved': 'FDA approved',
      'nice_recommended': 'NICE recommended',
      'nice_consider': 'NICE considers appropriate',
      'pubmed_high_quality': 'high-quality clinical evidence',
      'pubmed_multiple_rcts': 'multiple clinical trials',
      'pubmed_single_rct': 'clinical trial data',
      'pubmed_other': 'published literature',
      'bnf_listed': 'BNF listed',
      'bnf_indication_match': 'indication confirmed',
      'inventory_verified': 'inventory verified',
    };

    const descriptions = sources
      .filter(s => sourceDescriptions[s])
      .map(s => sourceDescriptions[s]);

    let summary = '';

    if (sourcesChecked === 0) {
      // No evidence sources were checked - use AI confidence only
      summary = 'Based on AI clinical reasoning (no external validation performed)';
    } else if (sources.length === 0 && sourcesFound === 0) {
      // Sources were checked but none had data
      summary = 'Limited evidence available in checked databases. Use clinical judgment.';
    } else if (hasStrongEvidence) {
      summary = `Strong evidence: ${descriptions.slice(0, 3).join(', ')}`;
    } else if (descriptions.length > 0) {
      summary = `Supported by: ${descriptions.slice(0, 3).join(', ')}`;
    } else {
      summary = 'Moderate evidence support';
    }

    if (isOffLabel) {
      summary += ' (off-label use)';
    }

    return summary;
  }

  /**
   * Build overall evidence summary for response
   */
  private buildOverallEvidenceSummary(suggestions: SuggestedMedicationDto[]): {
    overall_evidence_score: number;
    overall_evidence_level: 'very_high' | 'high' | 'moderate' | 'low' | 'very_low';
    drugs_with_strong_evidence: number;
    drugs_with_weak_evidence: number;
    off_label_count: number;
    evidence_sources_used: string[];
    confidence_methodology: string;
  } {
    const scores = suggestions.map(s => s.evidence_confidence?.final_score || s.confidence || 50);
    const avgScore = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 50;

    let overallLevel: 'very_high' | 'high' | 'moderate' | 'low' | 'very_low';
    if (avgScore >= 85) overallLevel = 'very_high';
    else if (avgScore >= 70) overallLevel = 'high';
    else if (avgScore >= 50) overallLevel = 'moderate';
    else if (avgScore >= 30) overallLevel = 'low';
    else overallLevel = 'very_low';

    const strongEvidence = suggestions.filter(s =>
      s.evidence_confidence?.evidence_level === 'high' ||
      s.evidence_confidence?.evidence_level === 'very_high'
    ).length;

    const weakEvidence = suggestions.filter(s =>
      s.evidence_confidence?.evidence_level === 'low' ||
      s.evidence_confidence?.evidence_level === 'very_low'
    ).length;

    const offLabelCount = suggestions.filter(s => s.evidence_confidence?.is_off_label).length;

    // Collect all evidence sources used
    const sourcesSet = new Set<string>();
    for (const suggestion of suggestions) {
      if (suggestion.verification?.fda_approved) sourcesSet.add('FDA');
      if (suggestion.nice_compliance?.is_compliant) sourcesSet.add('NICE');
      if (suggestion.pubmed_citations?.total_found) sourcesSet.add('PubMed');
      if (suggestion.bnf_info?.found_in_bnf) sourcesSet.add('BNF');
    }

    return {
      overall_evidence_score: avgScore,
      overall_evidence_level: overallLevel,
      drugs_with_strong_evidence: strongEvidence,
      drugs_with_weak_evidence: weakEvidence,
      off_label_count: offLabelCount,
      evidence_sources_used: Array.from(sourcesSet),
      confidence_methodology: 'AI confidence adjusted by evidence: FDA approval (+15), NICE recommendation (+10), ' +
        'PubMed high-quality evidence (+10), clinical trials (+5-8), BNF listing (+5), ' +
        'off-label use (-15), unverified drugs (-20), dosage concerns (-5 to -10). ' +
        'Original AI confidence preserved when no evidence data available.',
    };
  }

  /**
   * Dosage Validation: Check if suggested dosages are within FDA-recommended ranges
   * Validates against patient age, weight, and any organ impairment
   */
  private async validateDosages(
    suggestions: SuggestedMedicationDto[],
    patientContext: PatientContext,
  ): Promise<SuggestedMedicationDto[]> {
    this.logger.log(`[Dosage Validation] Validating dosages for ${suggestions.length} suggestions`);

    const DrugSafetyModel = this.userModel.db.model('DrugSafetyInfo');
    const validatedSuggestions: SuggestedMedicationDto[] = [];

    for (const suggestion of suggestions) {
      const dosageWarnings: string[] = [];
      let dosageStatus: 'safe' | 'warning' | 'danger' = 'safe';
      let fdaDosageInfo: any = null;

      const drugName = suggestion.generic_name || suggestion.drug_name;

      try {
        // Fetch FDA dosage information
        const safetyInfo = await DrugSafetyModel.findOne({
          $or: [
            { generic_name: { $regex: new RegExp(`^${drugName}$`, 'i') } },
            { brand_name: { $regex: new RegExp(`^${suggestion.drug_name}$`, 'i') } },
          ],
        }).lean();

        if (safetyInfo?.parsed_dosage) {
          fdaDosageInfo = safetyInfo.parsed_dosage;

          // Determine which dosage guidelines to use based on patient age
          const age = patientContext.age;
          let applicableDosage: any = null;

          if (age < 18 && fdaDosageInfo.pediatric) {
            applicableDosage = fdaDosageInfo.pediatric;
            this.logger.log(`[Dosage Validation] Using pediatric dosage for ${drugName}`);
          } else if (age >= 65 && fdaDosageInfo.geriatric) {
            applicableDosage = fdaDosageInfo.geriatric;
            this.logger.log(`[Dosage Validation] Using geriatric dosage for ${drugName}`);
          } else if (fdaDosageInfo.adult) {
            applicableDosage = fdaDosageInfo.adult;
            this.logger.log(`[Dosage Validation] Using adult dosage for ${drugName}`);
          }

          if (applicableDosage) {
            // Parse suggested dosage to compare
            const suggestedDoseMatch = suggestion.suggested_dosage?.match(/(\d+(?:\.\d+)?)\s*(mg|mcg|g|ml|units?)/i);
            if (suggestedDoseMatch) {
              const suggestedValue = parseFloat(suggestedDoseMatch[1]);
              const suggestedUnit = suggestedDoseMatch[2].toLowerCase();

              // Check against max dose
              if (applicableDosage.max_dose) {
                const maxMatch = applicableDosage.max_dose.match(/(\d+(?:\.\d+)?)/);
                if (maxMatch) {
                  const maxValue = parseFloat(maxMatch[1]);
                  if (suggestedValue > maxValue) {
                    dosageWarnings.push(
                      `Suggested dose (${suggestion.suggested_dosage}) exceeds FDA maximum of ${applicableDosage.max_dose}`,
                    );
                    dosageStatus = 'danger';
                  }
                }
              }

              // Check against max daily dose
              if (applicableDosage.max_daily_dose) {
                const maxDailyMatch = applicableDosage.max_daily_dose.match(/(\d+(?:\.\d+)?)/);
                if (maxDailyMatch) {
                  const maxDailyValue = parseFloat(maxDailyMatch[1]);
                  // Estimate daily dose based on frequency
                  const frequency = suggestion.suggested_frequency?.toLowerCase() || '';
                  let multiplier = 1;
                  if (frequency.includes('twice') || frequency.includes('bid') || frequency.includes('2 times')) {
                    multiplier = 2;
                  } else if (frequency.includes('three') || frequency.includes('tid') || frequency.includes('3 times')) {
                    multiplier = 3;
                  } else if (frequency.includes('four') || frequency.includes('qid') || frequency.includes('4 times')) {
                    multiplier = 4;
                  }

                  const estimatedDaily = suggestedValue * multiplier;
                  if (estimatedDaily > maxDailyValue) {
                    dosageWarnings.push(
                      `Estimated daily dose (~${estimatedDaily}${suggestedUnit}) may exceed FDA maximum daily dose of ${applicableDosage.max_daily_dose}`,
                    );
                    if (dosageStatus !== 'danger') dosageStatus = 'warning';
                  }
                }
              }

              // For pediatric, check weight-based dosing
              if (age < 18 && applicableDosage.dose_per_kg && patientContext.weight) {
                const perKgMatch = applicableDosage.dose_per_kg.match(/(\d+(?:\.\d+)?)/);
                if (perKgMatch) {
                  const perKgValue = parseFloat(perKgMatch[1]);
                  const weightBasedMax = perKgValue * patientContext.weight;
                  if (suggestedValue > weightBasedMax * 1.2) { // 20% tolerance
                    dosageWarnings.push(
                      `Suggested pediatric dose may exceed weight-based maximum (${perKgValue}mg/kg × ${patientContext.weight}kg = ${weightBasedMax.toFixed(1)}mg)`,
                    );
                    if (dosageStatus !== 'danger') dosageStatus = 'warning';
                  }
                }
              }
            }
          }

          // Check for renal impairment warnings if patient has kidney conditions
          const hasRenalIssues = patientContext.chronic_conditions.some(c =>
            /kidney|renal|ckd|dialysis/i.test(c),
          );
          if (hasRenalIssues && fdaDosageInfo.renal_impairment?.notes) {
            dosageWarnings.push(
              `Patient has renal condition - FDA notes: ${fdaDosageInfo.renal_impairment.notes.substring(0, 200)}...`,
            );
            if (dosageStatus === 'safe') dosageStatus = 'warning';
          }

          // Check for hepatic impairment warnings if patient has liver conditions
          const hasHepaticIssues = patientContext.chronic_conditions.some(c =>
            /liver|hepatic|cirrhosis|hepatitis/i.test(c),
          );
          if (hasHepaticIssues && fdaDosageInfo.hepatic_impairment?.notes) {
            dosageWarnings.push(
              `Patient has hepatic condition - FDA notes: ${fdaDosageInfo.hepatic_impairment.notes.substring(0, 200)}...`,
            );
            if (dosageStatus === 'safe') dosageStatus = 'warning';
          }
        }
      } catch (error) {
        this.logger.warn(`[Dosage Validation] Error validating dosage for ${drugName}: ${error.message}`);
      }

      // Add dosage validation to suggestion
      validatedSuggestions.push({
        ...suggestion,
        dosage_validation: {
          status: dosageStatus,
          fda_dosage_info: fdaDosageInfo ? {
            adult: fdaDosageInfo.adult,
            pediatric: fdaDosageInfo.pediatric,
            geriatric: fdaDosageInfo.geriatric,
          } : undefined,
          warnings: dosageWarnings,
          validated_for_patient: {
            age: patientContext.age,
            weight: patientContext.weight,
            population: patientContext.age < 18 ? 'pediatric' : patientContext.age >= 65 ? 'geriatric' : 'adult',
          },
          validated_at: new Date(),
        },
      });

      if (dosageWarnings.length > 0) {
        this.logger.warn(`[Dosage Validation] ${drugName}: ${dosageWarnings.join('; ')}`);
      }
    }

    const dangerCount = validatedSuggestions.filter(s => s.dosage_validation?.status === 'danger').length;
    const warningCount = validatedSuggestions.filter(s => s.dosage_validation?.status === 'warning').length;
    this.logger.log(
      `[Dosage Validation] Complete: ${dangerCount} danger, ${warningCount} warnings, ${validatedSuggestions.length - dangerCount - warningCount} safe`,
    );

    return validatedSuggestions;
  }

  /**
   * Build summary for medication suggestions
   */
  private buildSuggestionsSummary(
    suggestions: SuggestedMedicationDto[],
    patientContext: PatientContext,
  ): string {
    const inventoryCount = suggestions.filter(s => s.is_in_inventory).length;
    const externalCount = suggestions.filter(s => !s.is_in_inventory).length;
    const primarySuggestion = suggestions.find(s => s.priority === 'primary');

    let summary = `Based on the patient's clinical context, RxGPT suggests ${suggestions.length} medication(s). `;

    if (primarySuggestion) {
      summary += `The primary recommendation is ${primarySuggestion.drug_name}${primarySuggestion.generic_name ? ` (${primarySuggestion.generic_name})` : ''} ${primarySuggestion.strength}. `;
    }

    if (inventoryCount > 0 && externalCount > 0) {
      summary += `${inventoryCount} medication(s) are available in the platform inventory, and ${externalCount} would need to be sourced externally. `;
    } else if (inventoryCount === suggestions.length) {
      summary += `All suggested medications are available in the platform inventory. `;
    } else if (externalCount === suggestions.length) {
      summary += `These medications are not currently in the platform inventory and would need to be sourced externally. `;
    }

    if (patientContext.allergies.drug.length > 0) {
      summary += `Patient allergies (${patientContext.allergies.drug.map(a => a.allergen).join(', ')}) have been considered in these suggestions.`;
    }

    return summary;
  }

  /**
   * Calculate overall confidence score
   */
  private calculateOverallConfidence(suggestions: SuggestedMedicationDto[]): number {
    if (suggestions.length === 0) return 0;
    const primarySuggestion = suggestions.find(s => s.priority === 'primary');
    if (primarySuggestion) return primarySuggestion.confidence;
    return Math.round(suggestions.reduce((sum, s) => sum + s.confidence, 0) / suggestions.length);
  }

  /**
   * Store analytics for medication suggestions
   */
  private async storeSuggestionAnalytics(
    specialistId: string,
    patientId: string,
    dto: RxGPTSuggestMedicationsDto,
    response: RxGPTSuggestMedicationsResponseDto,
    aiModel: string,
    responseTimeMs: number,
    creditsUsed: number,
  ): Promise<void> {
    try {
      await this.analyticsModel.create({
        specialist_id: new Types.ObjectId(specialistId),
        patient_id: new Types.ObjectId(patientId),
        analysis_type: 'suggestion', // Distinguish from safety analysis
        linked_appointments: dto.linked_appointments?.map((id) => new Types.ObjectId(id)) || [],
        linked_clinical_notes: dto.linked_clinical_notes?.map((id) => new Types.ObjectId(id)) || [],
        linked_health_checkups: dto.linked_health_checkups?.map((id) => new Types.ObjectId(id)) || [],
        drugs_analyzed: response.suggestions.map((s) => ({
          drug_name: s.drug_name,
          generic_name: s.generic_name,
          strength: s.strength,
          dosage: s.suggested_dosage
            ? `${s.suggested_dosage}${s.suggested_frequency ? ` ${s.suggested_frequency}` : ''}`
            : '',
          is_appropriate: true,
          confidence: s.confidence,
          is_in_inventory: s.is_in_inventory,
        })),
        is_safe: true,
        overall_risk_level: 'low',
        confidence_score: response.confidence_score,
        // Collect all safety alerts from suggestions
        alerts: response.suggestions.flatMap((s) =>
          (s.safety_alerts || []).map((alert: any) => ({
            type: alert.type || 'info',
            severity: alert.severity || 'info',
            drug_name: s.drug_name,
            message: alert.message || alert,
          }))
        ),
        total_alerts: response.suggestions.reduce((sum, s) => sum + (s.safety_alerts?.length || 0), 0),
        critical_alerts: 0,
        warning_alerts: 0,
        info_alerts: 0,
        recommendations_count: response.suggestions.length,
        ai_model: aiModel,
        response_time_ms: responseTimeMs,
        credits_used: creditsUsed,
        clinical_summary: response.clinical_summary,
        from_cache: false,
      });
    } catch (error) {
      this.logger.error('Failed to store suggestion analytics:', error);
    }
  }

  /**
   * Build patient context from user data
   */
  private async buildPatientContext(patientId: string): Promise<PatientContext> {
    const patient = await this.userModel.findById(patientId).exec();

    if (!patient) {
      throw new BadRequestException('Patient not found');
    }

    const profile = patient.profile || {};
    const medicalHistory = profile.medical_history || {};
    const allergies = profile.allergies || {};

    // Calculate age
    let age = 0;
    if (profile.date_of_birth) {
      const dob = new Date(profile.date_of_birth);
      const today = new Date();
      age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
    }

    return {
      patient_id: patientId,
      age,
      gender: profile.gender || 'unknown',
      weight: profile.weight,
      allergies: {
        drug: (allergies.drug_allergies || []).map((a: any) => ({
          allergen: a.drug_name || a.allergen || a.name || '',
          reaction: a.reaction,
          severity: a.severity,
        })),
        food: (allergies.food_allergies || []).map((a: any) => ({
          allergen: a.food_item || a.allergen || a.name || '',
          reaction: a.reaction,
        })),
        environmental: (allergies.environmental_allergies || []).map((a: any) => ({
          allergen: a.allergen || a.name || '',
        })),
      },
      chronic_conditions: medicalHistory.chronic_conditions || [],
      current_medications: (medicalHistory.current_medications || []).map((m: any) => ({
        name: m.name || m.medication_name || '',
        dosage: m.dosage,
        frequency: m.frequency,
        reason: m.reason,
      })),
      family_history: (medicalHistory.family_history || []).map((h: any) => ({
        condition: h.condition || h.illness || '',
        relation: h.relationship || h.relation,
      })),
    };
  }

  /**
   * Build clinical context from linked appointments
   */
  private async buildClinicalContext(
    appointmentIds?: string[],
    clinicalNoteIds?: string[],
  ): Promise<ClinicalContext | null> {
    if (!appointmentIds?.length && !clinicalNoteIds?.length) {
      return null;
    }

    const context: ClinicalContext = {};

    if (appointmentIds?.length) {
      // Get the most recent appointment with clinical notes
      const appointment = await this.appointmentModel
        .findOne({
          _id: { $in: appointmentIds.map((id) => new Types.ObjectId(id)) },
          'clinical_notes.0': { $exists: true },
        })
        .sort({ scheduled_at: -1 })
        .exec();

      if (appointment && appointment.clinical_notes?.length) {
        const latestNote = appointment.clinical_notes[appointment.clinical_notes.length - 1];
        context.appointment_id = appointment._id.toString();
        context.chief_complaint = latestNote.chief_complaint;
        context.diagnosis = latestNote.assessment_diagnosis;
        context.treatment_plan = latestNote.treatment_plan;

        if (latestNote.vitals) {
          context.vital_signs = {
            blood_pressure: latestNote.vitals.blood_pressure,
            heart_rate: latestNote.vitals.heart_rate,
            temperature: latestNote.vitals.temperature,
            respiratory_rate: latestNote.vitals.respiratory_rate,
            oxygen_saturation: latestNote.vitals.oxygen_saturation,
          };
        }

        if (latestNote.soap_format) {
          context.soap_notes = {
            subjective: latestNote.soap_format.subjective,
            objective: latestNote.soap_format.objective,
            assessment: latestNote.soap_format.assessment,
            plan: latestNote.soap_format.plan,
          };
        }
      }
    }

    return Object.keys(context).length > 0 ? context : null;
  }

  /**
   * Build health checkup context
   */
  private async buildHealthCheckupContext(
    checkupIds?: string[],
  ): Promise<HealthCheckupContext | null> {
    if (!checkupIds?.length) {
      return null;
    }

    // Get the most recent health checkup
    const checkup = await this.healthCheckupModel
      .findOne({
        _id: { $in: checkupIds.map((id) => new Types.ObjectId(id)) },
      })
      .sort({ created_at: -1 })
      .exec();

    if (!checkup) {
      return null;
    }

    const response = checkup.response?.data || {};
    const conditions = response.conditions || [];
    const primaryCondition = conditions.length > 0 ? conditions[0] : null;

    return {
      checkup_id: checkup._id.toString(),
      triage_level: response.triage_level,
      primary_condition: primaryCondition
        ? {
            name: primaryCondition.name || primaryCondition.common_name,
            probability: primaryCondition.probability,
          }
        : undefined,
      symptoms: (response.symptoms || []).map((s: any) => ({
        name: s.name || s.common_name,
        severity: s.severity,
        duration: s.duration,
      })),
      ai_summary: checkup.claude_summary?.content
        ? {
            overview: checkup.claude_summary.content.overview,
            key_findings: checkup.claude_summary.content.key_findings || [],
            recommendations: checkup.claude_summary.content.recommendations || [],
          }
        : undefined,
      risk_factors: response.risk_factors || [],
    };
  }

  /**
   * Run the main AI analysis
   */
  private async runAnalysis(
    patientContext: PatientContext,
    clinicalContext: ClinicalContext | null,
    healthCheckupContext: HealthCheckupContext | null,
    proposedDrugs: ProposedDrug[],
    settings: RxGPTSettings,
  ): Promise<Omit<RxGPTResponseDto, 'credits_used' | 'credits_remaining'>> {
    const drugNames = proposedDrugs.map((d) => d.generic_name || d.name);

    // Check drug interactions using existing service
    let interactionResult = { hasInteractions: false, interactions: [] as any[] };
    if (settings.features.drug_interactions && drugNames.length > 1) {
      interactionResult = await this.drugInteractionService.checkInteractions(drugNames);
    }

    // Build the prompt for Claude
    const systemPrompt = this.buildSystemPrompt(settings);
    const userPrompt = this.buildUserPrompt(
      patientContext,
      clinicalContext,
      healthCheckupContext,
      proposedDrugs,
      interactionResult.interactions,
    );

    try {
      const response = await this.client!.messages.create({
        model: settings.ai_model,
        max_tokens: settings.max_tokens,
        temperature: settings.temperature,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });

      const textContent = response.content.find((block) => block.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text response from Claude');
      }

      return this.parseAnalysisResponse(textContent.text, proposedDrugs, settings);
    } catch (error) {
      this.logger.error('Error running RxGPT analysis:', error);

      // Return a fallback response with just the known interactions
      return this.buildFallbackResponse(
        patientContext,
        proposedDrugs,
        interactionResult.interactions,
        settings,
      );
    }
  }

  /**
   * Build system prompt for RxGPT
   */
  private buildSystemPrompt(settings: RxGPTSettings): string {
    return `You are RxGPT, an AI-powered prescription safety assistant for healthcare professionals on the Rapid Capsule telemedicine platform.

Your role is to:
1. Analyze proposed medications against patient context for safety
2. Identify potential issues (allergies, drug interactions, contraindications, dosage concerns)
3. Provide clinical reasoning with citations where possible
4. Suggest alternatives when issues are found (if enabled)

CRITICAL SAFETY RULES:
- Flag ALL allergy matches, including partial matches and drug class allergies (e.g., if patient is allergic to penicillin, flag all penicillin-class antibiotics)
- Consider patient age, weight, chronic conditions, and current medications
- Be conservative - when in doubt, flag for review
- Never make definitive diagnoses - only support prescribing decisions
- Express uncertainty with confidence scores (0-100%)

${settings.features.citations ? '- Always cite sources when making recommendations (FDA, clinical guidelines, drug databases)' : ''}
${settings.features.alternative_suggestions ? '- Suggest up to ' + settings.thresholds.max_alternatives + ' alternative medications when primary choices are contraindicated' : ''}

OUTPUT FORMAT: Respond with ONLY a valid JSON object (no markdown, no explanation) in this exact format:
{
  "is_safe": boolean,
  "overall_risk_level": "low" | "moderate" | "high" | "critical",
  "confidence_score": number (0-100),
  "alerts": [
    {
      "type": "allergy" | "interaction" | "contraindication" | "dosage" | "age" | "pregnancy",
      "severity": "info" | "warning" | "critical",
      "drug_name": "string",
      "message": "string (brief description)",
      "reasoning": "string (clinical reasoning)",
      "citation": "string (optional source)",
      "action_required": "string (what to do)"
    }
  ],
  "recommendations": [
    {
      "type": "suggested_drug" | "dosage_adjustment" | "alternative" | "monitoring",
      "drug_name": "string (optional)",
      "recommendation": "string",
      "reasoning": "string",
      "citations": ["string"],
      "confidence": number (0-100),
      "priority": "high" | "medium" | "low"
    }
  ],
  "drug_analyses": [
    {
      "drug_id": "string",
      "drug_name": "string",
      "is_appropriate": boolean,
      "confidence": number (0-100),
      "reasoning": "string",
      "citations": ["string"]
    }
  ],
  "clinical_summary": "string (2-3 sentence summary of the analysis)"
}`;
  }

  /**
   * Build user prompt with all context
   */
  private buildUserPrompt(
    patientContext: PatientContext,
    clinicalContext: ClinicalContext | null,
    healthCheckupContext: HealthCheckupContext | null,
    proposedDrugs: ProposedDrug[],
    knownInteractions: any[],
  ): string {
    let prompt = `Analyze this prescription for safety and appropriateness.

## PATIENT PROFILE
- Age: ${patientContext.age} years
- Gender: ${patientContext.gender}
${patientContext.weight ? `- Weight: ${patientContext.weight} kg` : ''}

## ALLERGIES
${patientContext.allergies.drug.length > 0 ? `Drug Allergies: ${patientContext.allergies.drug.map((a) => `${a.allergen}${a.severity ? ` (${a.severity})` : ''}${a.reaction ? ` - reaction: ${a.reaction}` : ''}`).join(', ')}` : 'No drug allergies documented'}
${patientContext.allergies.food.length > 0 ? `Food Allergies: ${patientContext.allergies.food.map((a) => a.allergen).join(', ')}` : ''}
${patientContext.allergies.environmental.length > 0 ? `Environmental Allergies: ${patientContext.allergies.environmental.map((a) => a.allergen).join(', ')}` : ''}

## MEDICAL HISTORY
${patientContext.chronic_conditions.length > 0 ? `Chronic Conditions: ${patientContext.chronic_conditions.join(', ')}` : 'No chronic conditions documented'}
${patientContext.current_medications.length > 0 ? `Current Medications: ${patientContext.current_medications.map((m) => `${m.name}${m.dosage ? ` ${m.dosage}` : ''}${m.frequency ? ` (${m.frequency})` : ''}`).join(', ')}` : 'No current medications documented'}
${patientContext.family_history.length > 0 ? `Family History: ${patientContext.family_history.map((h) => `${h.condition}${h.relation ? ` (${h.relation})` : ''}`).join(', ')}` : ''}`;

    if (clinicalContext) {
      prompt += `

## CLINICAL CONTEXT (from linked appointment)
${clinicalContext.chief_complaint ? `Chief Complaint: ${clinicalContext.chief_complaint}` : ''}
${clinicalContext.diagnosis ? `Diagnosis: ${clinicalContext.diagnosis}` : ''}
${clinicalContext.treatment_plan ? `Treatment Plan: ${clinicalContext.treatment_plan}` : ''}
${clinicalContext.vital_signs ? `Vital Signs: BP ${clinicalContext.vital_signs.blood_pressure || 'N/A'}, HR ${clinicalContext.vital_signs.heart_rate || 'N/A'}, Temp ${clinicalContext.vital_signs.temperature || 'N/A'}` : ''}
${clinicalContext.soap_notes?.assessment ? `SOAP Assessment: ${clinicalContext.soap_notes.assessment}` : ''}`;
    }

    if (healthCheckupContext) {
      prompt += `

## HEALTH CHECKUP CONTEXT
${healthCheckupContext.triage_level ? `Triage Level: ${healthCheckupContext.triage_level}` : ''}
${healthCheckupContext.primary_condition ? `Primary Condition: ${healthCheckupContext.primary_condition.name} (probability: ${Math.round((healthCheckupContext.primary_condition.probability || 0) * 100)}%)` : ''}
${healthCheckupContext.symptoms.length > 0 ? `Symptoms: ${healthCheckupContext.symptoms.map((s) => s.name).join(', ')}` : ''}
${healthCheckupContext.ai_summary?.overview ? `AI Summary: ${healthCheckupContext.ai_summary.overview}` : ''}
${healthCheckupContext.risk_factors.length > 0 ? `Risk Factors: ${healthCheckupContext.risk_factors.join(', ')}` : ''}`;
    }

    prompt += `

## PROPOSED PRESCRIPTION
${proposedDrugs
      .map(
        (d, i) =>
          `${i + 1}. ${d.name}${d.generic_name ? ` (${d.generic_name})` : ''} ${d.strength}
   Dosage: ${d.dosage}, Frequency: ${d.frequency}${d.duration_days ? `, Duration: ${d.duration_days} days` : ''}
   Quantity: ${d.quantity}${d.instructions ? `, Instructions: ${d.instructions}` : ''}`,
      )
      .join('\n')}`;

    if (knownInteractions.length > 0) {
      prompt += `

## KNOWN DRUG INTERACTIONS (from our database)
${knownInteractions.map((i) => `- ${i.drug1} + ${i.drug2}: ${i.severity} severity - ${i.description}`).join('\n')}`;
    }

    prompt += `

Analyze each proposed drug for safety issues and provide your assessment.`;

    return prompt;
  }

  /**
   * Parse Claude's response
   */
  private parseAnalysisResponse(
    responseText: string,
    proposedDrugs: ProposedDrug[],
    settings: RxGPTSettings,
  ): Omit<RxGPTResponseDto, 'credits_used' | 'credits_remaining'> {
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

      return {
        is_safe: parsed.is_safe ?? false,
        overall_risk_level: parsed.overall_risk_level || RxGPTRiskLevel.MODERATE,
        alerts: (parsed.alerts || []).map((a: any) => ({
          type: a.type || RxGPTAlertType.CONTRAINDICATION,
          severity: a.severity || RxGPTAlertSeverity.WARNING,
          drug_name: a.drug_name || '',
          message: a.message || '',
          reasoning: a.reasoning || '',
          citation: a.citation,
          action_required: a.action_required || 'Review before prescribing',
        })),
        recommendations: (parsed.recommendations || []).map((r: any) => ({
          type: r.type || RxGPTRecommendationType.MONITORING,
          drug_name: r.drug_name,
          recommendation: r.recommendation || '',
          reasoning: r.reasoning || '',
          citations: r.citations || [],
          confidence: r.confidence ?? 70,
          priority: r.priority || RxGPTPriority.MEDIUM,
        })),
        drug_analyses: (parsed.drug_analyses || []).map((d: any, i: number) => ({
          drug_id: d.drug_id || proposedDrugs[i]?.drug_id || '',
          drug_name: d.drug_name || proposedDrugs[i]?.name || '',
          is_appropriate: d.is_appropriate ?? true,
          confidence: d.confidence ?? 70,
          reasoning: d.reasoning || '',
          alerts: [],
          citations: d.citations || [],
        })),
        clinical_summary: parsed.clinical_summary || 'Analysis completed.',
        disclaimer: settings.disclaimer_text,
        generated_at: new Date(),
        model: settings.ai_model,
        confidence_score: parsed.confidence_score ?? 70,
      };
    } catch (error) {
      this.logger.error('Failed to parse RxGPT response:', error);
      throw error;
    }
  }

  /**
   * Build fallback response when AI fails
   */
  private buildFallbackResponse(
    patientContext: PatientContext,
    proposedDrugs: ProposedDrug[],
    knownInteractions: any[],
    settings: RxGPTSettings,
  ): Omit<RxGPTResponseDto, 'credits_used' | 'credits_remaining'> {
    const alerts: RxGPTAlertDto[] = [];

    // Add allergy alerts
    for (const drug of proposedDrugs) {
      const drugNameLower = drug.name.toLowerCase();
      const genericLower = (drug.generic_name || '').toLowerCase();

      for (const allergy of patientContext.allergies.drug) {
        const allergenLower = allergy.allergen.toLowerCase();
        if (
          drugNameLower.includes(allergenLower) ||
          genericLower.includes(allergenLower) ||
          allergenLower.includes(drugNameLower)
        ) {
          alerts.push({
            type: RxGPTAlertType.ALLERGY,
            severity: RxGPTAlertSeverity.CRITICAL,
            drug_name: drug.name,
            message: `Patient has documented allergy to ${allergy.allergen}`,
            reasoning: `Manual check detected possible allergy match.`,
            action_required: 'Verify with patient before prescribing',
          });
        }
      }
    }

    // Add interaction alerts
    for (const interaction of knownInteractions) {
      alerts.push({
        type: RxGPTAlertType.INTERACTION,
        severity:
          interaction.severity === 'high'
            ? RxGPTAlertSeverity.CRITICAL
            : interaction.severity === 'moderate'
              ? RxGPTAlertSeverity.WARNING
              : RxGPTAlertSeverity.INFO,
        drug_name: `${interaction.drug1} + ${interaction.drug2}`,
        message: interaction.description,
        reasoning: `Interaction detected via ${interaction.source}`,
        action_required: 'Review interaction before prescribing',
      });
    }

    const hasCritical = alerts.some((a) => a.severity === RxGPTAlertSeverity.CRITICAL);
    const hasWarning = alerts.some((a) => a.severity === RxGPTAlertSeverity.WARNING);

    return {
      is_safe: !hasCritical,
      overall_risk_level: hasCritical
        ? RxGPTRiskLevel.CRITICAL
        : hasWarning
          ? RxGPTRiskLevel.MODERATE
          : RxGPTRiskLevel.LOW,
      alerts,
      recommendations: [],
      drug_analyses: proposedDrugs.map((d) => ({
        drug_id: d.drug_id,
        drug_name: d.name,
        is_appropriate: true,
        confidence: 50,
        reasoning: 'AI analysis unavailable. Manual review recommended.',
        alerts: [],
        citations: [],
      })),
      clinical_summary:
        'AI analysis could not be completed. Basic safety checks performed. Full pharmacist review recommended.',
      disclaimer: settings.disclaimer_text,
      generated_at: new Date(),
      model: 'fallback',
      confidence_score: 50,
    };
  }

  /**
   * Store analytics for this analysis
   */
  private async storeAnalytics(
    specialistId: string,
    patientId: string,
    dto: RxGPTAnalyzeDto,
    result: Omit<RxGPTResponseDto, 'credits_used' | 'credits_remaining'>,
    aiModel: string,
    responseTimeMs: number,
    creditsUsed: number,
    fromCache: boolean = false,
  ): Promise<void> {
    try {
      await this.analyticsModel.create({
        specialist_id: new Types.ObjectId(specialistId),
        patient_id: new Types.ObjectId(patientId),
        linked_appointments: dto.linked_appointments?.map((id) => new Types.ObjectId(id)) || [],
        linked_clinical_notes: dto.linked_clinical_notes?.map((id) => new Types.ObjectId(id)) || [],
        linked_health_checkups: dto.linked_health_checkups?.map((id) => new Types.ObjectId(id)) || [],
        drugs_analyzed: dto.proposed_drugs.map((d) => ({
          drug_id: new Types.ObjectId(d.drug_id),
          drug_name: d.name,
          generic_name: d.generic_name,
          strength: d.strength,
          dosage: d.dosage,
          is_appropriate: result.drug_analyses.find((a) => a.drug_id === d.drug_id)?.is_appropriate ?? true,
          confidence: result.drug_analyses.find((a) => a.drug_id === d.drug_id)?.confidence ?? 0,
        })),
        is_safe: result.is_safe,
        overall_risk_level: result.overall_risk_level,
        confidence_score: result.confidence_score,
        alerts: result.alerts.map((a) => ({
          type: a.type,
          severity: a.severity,
          drug_name: a.drug_name,
          message: a.message,
        })),
        total_alerts: result.alerts.length,
        critical_alerts: result.alerts.filter((a) => a.severity === RxGPTAlertSeverity.CRITICAL).length,
        warning_alerts: result.alerts.filter((a) => a.severity === RxGPTAlertSeverity.WARNING).length,
        info_alerts: result.alerts.filter((a) => a.severity === RxGPTAlertSeverity.INFO).length,
        recommendations_count: result.recommendations.length,
        recommendation_types: result.recommendations.map((r) => r.type),
        ai_model: aiModel,
        tokens_used: 0, // Would need to track from Claude response
        response_time_ms: responseTimeMs,
        credits_used: creditsUsed,
        clinical_summary: result.clinical_summary,
        from_cache: fromCache,
      });
    } catch (error) {
      this.logger.error('Failed to store RxGPT analytics:', error);
    }
  }

  // =====================
  // Analysis History Methods
  // =====================

  /**
   * Get specialist's RxGPT analysis history
   */
  async getSpecialistAnalysisHistory(
    specialistId: string,
    page: number = 1,
    limit: number = 20,
    filters?: {
      patient_id?: string;
      risk_level?: string;
      start_date?: string;
      end_date?: string;
      has_critical_alerts?: boolean;
    },
  ): Promise<{
    analyses: any[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  }> {
    const query: any = { specialist_id: new Types.ObjectId(specialistId) };

    if (filters?.patient_id) {
      query.patient_id = new Types.ObjectId(filters.patient_id);
    }
    if (filters?.risk_level) {
      query.overall_risk_level = filters.risk_level;
    }
    if (filters?.start_date || filters?.end_date) {
      query.created_at = {};
      if (filters.start_date) {
        query.created_at.$gte = new Date(filters.start_date);
      }
      if (filters.end_date) {
        query.created_at.$lte = new Date(filters.end_date);
      }
    }
    if (filters?.has_critical_alerts) {
      query.critical_alerts = { $gt: 0 };
    }

    const skip = (page - 1) * limit;

    const [analyses, total] = await Promise.all([
      this.analyticsModel
        .find(query)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .populate('patient_id', 'profile.first_name profile.last_name profile.profile_image')
        .populate('prescription_id', 'prescription_number status')
        .lean()
        .exec(),
      this.analyticsModel.countDocuments(query).exec(),
    ]);

    // Transform the results for the response
    const transformedAnalyses = analyses.map((analysis: any) => {
      const isStandalone = analysis.analysis_type === 'standalone' || !analysis.patient_id;
      const patientProfile = analysis.patient_id?.profile;
      const patientName = isStandalone
        ? (analysis.standalone_context?.subject_name || analysis.standalone_context?.diagnosis || 'Standalone Analysis')
        : patientProfile
          ? `${patientProfile.first_name || ''} ${patientProfile.last_name || ''}`.trim()
          : 'Unknown';

      // Normalize confidence score (if stored as 85, convert to 0.85)
      let confidenceScore = analysis.confidence_score;
      if (confidenceScore > 1) {
        confidenceScore = confidenceScore / 100;
      }

      // Get prescription ID as string for frontend navigation
      const prescriptionId = analysis.prescription_id?._id?.toString() ||
        (typeof analysis.prescription_id === 'string' ? analysis.prescription_id :
         analysis.prescription_id?.toString()) || null;

      return {
        _id: analysis._id,
        analysis_type: analysis.analysis_type || 'prescription',
        // Flat patient_name for easy frontend access
        patient_name: patientName,
        patient: isStandalone ? null : {
          _id: analysis.patient_id?._id || analysis.patient_id,
          name: patientName,
          profile_image: patientProfile?.profile_image,
        },
        // Standalone context for frontend display
        standalone_context: analysis.standalone_context || null,
        clinical_context: analysis.standalone_context ? {
          diagnosis: analysis.standalone_context.diagnosis,
          subject_name: analysis.standalone_context.subject_name,
        } : null,
        // Flat prescription_id for frontend navigation
        prescription_id: prescriptionId,
        drugs_analyzed: analysis.drugs_analyzed?.map((d: any) => ({
          drug_name: d.drug_name,
          generic_name: d.generic_name,
          name: d.drug_name, // keep for backwards compatibility
          strength: d.strength,
          dosage: d.dosage || d.dosage_instructions || '',
          is_appropriate: d.is_appropriate,
          confidence: d.confidence,
        })),
        is_safe: analysis.is_safe,
        overall_risk_level: analysis.overall_risk_level,
        confidence_score: confidenceScore,
        total_alerts: analysis.total_alerts || 0,
        critical_alerts: analysis.critical_alerts || 0,
        warning_alerts: analysis.warning_alerts || 0,
        // Include alerts array for modal display
        alerts: analysis.alerts || [],
        clinical_summary: analysis.clinical_summary || '',
        from_cache: analysis.from_cache,
        response_time_ms: analysis.response_time_ms,
        credits_used: analysis.credits_used,
        created_at: analysis.created_at,
      };
    });

    return {
      analyses: transformedAnalyses,
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    };
  }

  /**
   * Get a specific analysis by ID
   */
  async getAnalysisById(
    analysisId: string,
    specialistId: string,
  ): Promise<any> {
    const analysis = await this.analyticsModel
      .findOne({
        _id: new Types.ObjectId(analysisId),
        specialist_id: new Types.ObjectId(specialistId),
      })
      .populate('patient_id', 'profile.first_name profile.last_name profile.profile_image profile.date_of_birth profile.gender')
      .populate('linked_appointments', 'scheduled_at status specialist_id')
      .populate('linked_health_checkups', 'response.data.triage_level response.data.conditions created_at')
      .lean()
      .exec();

    if (!analysis) {
      return null;
    }

    // Transform the result
    const isStandalone = (analysis as any).analysis_type === 'standalone' || !analysis.patient_id;
    const patientProfile = (analysis as any).patient_id?.profile;
    return {
      _id: analysis._id,
      analysis_type: (analysis as any).analysis_type || 'prescription',
      standalone_context: (analysis as any).standalone_context || null,
      clinical_context: (analysis as any).standalone_context ? {
        diagnosis: (analysis as any).standalone_context.diagnosis,
        subject_name: (analysis as any).standalone_context.subject_name,
      } : null,
      patient: isStandalone ? null : {
        _id: (analysis as any).patient_id?._id || analysis.patient_id,
        name: patientProfile
          ? `${patientProfile.first_name || ''} ${patientProfile.last_name || ''}`.trim()
          : 'Unknown',
        profile_image: patientProfile?.profile_image,
        date_of_birth: patientProfile?.date_of_birth,
        gender: patientProfile?.gender,
      },
      drugs_analyzed: analysis.drugs_analyzed,
      is_safe: analysis.is_safe,
      overall_risk_level: analysis.overall_risk_level,
      confidence_score: analysis.confidence_score,
      alerts: analysis.alerts,
      total_alerts: analysis.total_alerts,
      critical_alerts: analysis.critical_alerts,
      warning_alerts: analysis.warning_alerts,
      info_alerts: analysis.info_alerts,
      recommendations_count: analysis.recommendations_count,
      clinical_summary: analysis.clinical_summary,
      ai_model: analysis.ai_model,
      response_time_ms: analysis.response_time_ms,
      credits_used: analysis.credits_used,
      from_cache: analysis.from_cache,
      linked_appointments: analysis.linked_appointments,
      linked_health_checkups: analysis.linked_health_checkups,
      created_at: analysis.created_at,
    };
  }

  /**
   * Get RxGPT analysis history for a specific prescription
   * Returns all analyses linked to this prescription, sorted by date (newest first)
   */
  async getAnalysisHistoryByPrescription(
    prescriptionId: string,
    specialistId: string,
  ): Promise<any[]> {
    const analyses = await this.analyticsModel
      .find({
        prescription_id: new Types.ObjectId(prescriptionId),
        specialist_id: new Types.ObjectId(specialistId),
      })
      .sort({ created_at: -1 })
      .populate('patient_id', 'profile.first_name profile.last_name')
      .lean()
      .exec();

    return analyses.map((analysis) => this.transformAnalysisForHistory(analysis));
  }

  /**
   * Get RxGPT analysis history for a specific patient
   * Returns all analyses for this patient by this specialist
   */
  async getAnalysisHistoryByPatient(
    patientId: string,
    specialistId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ analyses: any[]; total: number; pagination: any }> {
    const skip = (page - 1) * limit;

    const [analyses, total] = await Promise.all([
      this.analyticsModel
        .find({
          patient_id: new Types.ObjectId(patientId),
          specialist_id: new Types.ObjectId(specialistId),
        })
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .populate('prescription_id', 'prescription_number status created_at')
        .populate('linked_appointments', 'scheduled_at status')
        .populate('linked_health_checkups', 'response.data.triage_level created_at')
        .lean()
        .exec(),
      this.analyticsModel.countDocuments({
        patient_id: new Types.ObjectId(patientId),
        specialist_id: new Types.ObjectId(specialistId),
      }),
    ]);

    return {
      analyses: analyses.map((a) => this.transformAnalysisForHistory(a)),
      total,
      pagination: {
        page,
        limit,
        pages: Math.ceil(total / limit),
        has_next: page * limit < total,
        has_prev: page > 1,
      },
    };
  }

  /**
   * Link an RxGPT analysis to a prescription
   * Called when prescription is saved to associate the analysis
   */
  async linkAnalysisToPrescription(
    analysisId: string,
    prescriptionId: string,
    specialistId: string,
  ): Promise<any> {
    const updated = await this.analyticsModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(analysisId),
          specialist_id: new Types.ObjectId(specialistId),
        },
        {
          $set: { prescription_id: new Types.ObjectId(prescriptionId) },
        },
        { new: true },
      )
      .lean()
      .exec();

    if (!updated) {
      throw new NotFoundException('Analysis not found or not authorized');
    }

    return this.transformAnalysisForHistory(updated);
  }

  /**
   * Helper to transform analysis document for history response
   */
  private transformAnalysisForHistory(analysis: any): any {
    const patientProfile = analysis.patient_id?.profile;
    const patientName = patientProfile
      ? `${patientProfile.first_name || ''} ${patientProfile.last_name || ''}`.trim()
      : 'Unknown';

    // Normalize confidence score (if stored as 85, convert to 0.85)
    let confidenceScore = analysis.confidence_score;
    if (confidenceScore > 1) {
      confidenceScore = confidenceScore / 100;
    }

    // Get prescription ID as string for frontend navigation
    const prescriptionId = analysis.prescription_id?._id?.toString() ||
      (typeof analysis.prescription_id === 'string' ? analysis.prescription_id :
       analysis.prescription_id?.toString()) || null;

    return {
      _id: analysis._id,
      analysis_type: analysis.analysis_type || 'safety', // 'safety' or 'suggestion'
      // Flat patient_name for easy frontend access
      patient_name: patientName,
      patient: patientProfile
        ? {
            _id: analysis.patient_id?._id || analysis.patient_id,
            name: patientName,
          }
        : { _id: analysis.patient_id, name: 'Unknown' },
      // Flat prescription_id for frontend navigation
      prescription_id: prescriptionId,
      prescription: analysis.prescription_id
        ? {
            _id: prescriptionId,
            prescription_number: analysis.prescription_id.prescription_number,
            status: analysis.prescription_id.status,
          }
        : null,
      drugs_analyzed: analysis.drugs_analyzed?.map((d: any) => ({
        drug_name: d.drug_name,
        generic_name: d.generic_name,
        strength: d.strength,
        dosage: d.dosage || d.dosage_instructions || '',
        is_appropriate: d.is_appropriate,
        confidence: d.confidence,
      })),
      is_safe: analysis.is_safe,
      overall_risk_level: analysis.overall_risk_level,
      confidence_score: confidenceScore,
      total_alerts: analysis.total_alerts || 0,
      critical_alerts: analysis.critical_alerts || 0,
      warning_alerts: analysis.warning_alerts || 0,
      // Include alerts array for modal display
      alerts: analysis.alerts || [],
      clinical_summary: analysis.clinical_summary || '',
      linked_appointments: analysis.linked_appointments,
      linked_health_checkups: analysis.linked_health_checkups,
      credits_used: analysis.credits_used,
      from_cache: analysis.from_cache,
      created_at: analysis.created_at,
    };
  }

  /**
   * Get specialist's analysis statistics
   */
  async getSpecialistAnalysisStats(specialistId: string): Promise<{
    total_analyses: number;
    this_month: number;
    total_credits_used: number;
    average_confidence: number;
    critical_alert_rate: number;
    cache_hit_rate: number;
    most_analyzed_drugs: { name: string; count: number }[];
    // Frontend expected fields
    safe_prescriptions: number;
    alerts_issued: number;
    warnings_count: number;
    critical_alerts: number;
    credits_remaining: number;
  }> {
    const specialistOid = new Types.ObjectId(specialistId);

    // Get monthly start
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [overallStats, monthStats, cachedStats, drugStats, creditsRemaining] = await Promise.all([
      // Overall stats with all needed fields
      this.analyticsModel.aggregate([
        { $match: { specialist_id: specialistOid } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            total_credits: { $sum: '$credits_used' },
            avg_confidence: { $avg: '$confidence_score' },
            critical_count: { $sum: { $cond: [{ $gt: ['$critical_alerts', 0] }, 1, 0] } },
            // Additional fields for frontend
            safe_count: { $sum: { $cond: ['$is_safe', 1, 0] } },
            total_alerts: { $sum: { $ifNull: ['$total_alerts', 0] } },
            total_warnings: { $sum: { $ifNull: ['$warning_alerts', 0] } },
            total_critical: { $sum: { $ifNull: ['$critical_alerts', 0] } },
          },
        },
      ]),
      // This month stats
      this.analyticsModel.countDocuments({
        specialist_id: specialistOid,
        created_at: { $gte: monthStart },
      }),
      // Cache hit stats
      this.analyticsModel.aggregate([
        { $match: { specialist_id: specialistOid } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            cached: { $sum: { $cond: ['$from_cache', 1, 0] } },
          },
        },
      ]),
      // Most analyzed drugs
      this.analyticsModel.aggregate([
        { $match: { specialist_id: specialistOid } },
        { $unwind: '$drugs_analyzed' },
        {
          $group: {
            _id: '$drugs_analyzed.drug_name',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
      // Get remaining credits using existing method
      this.getSpecialistCreditBalance(specialistId).catch(() => ({ available: 0 })),
    ]);

    const stats = overallStats[0] || {};
    const cacheStats = cachedStats[0] || {};

    return {
      total_analyses: stats.total || 0,
      this_month: monthStats,
      total_credits_used: stats.total_credits || 0,
      average_confidence: Math.round(stats.avg_confidence || 0),
      critical_alert_rate: stats.total > 0 ? Math.round((stats.critical_count / stats.total) * 100) : 0,
      cache_hit_rate:
        cacheStats.total > 0 ? Math.round((cacheStats.cached / cacheStats.total) * 100) : 0,
      most_analyzed_drugs: drugStats.map((d: any) => ({ name: d._id, count: d.count })),
      // Frontend expected fields
      safe_prescriptions: stats.safe_count || 0,
      alerts_issued: stats.total_alerts || 0,
      warnings_count: stats.total_warnings || 0,
      critical_alerts: stats.total_critical || 0,
      credits_remaining: creditsRemaining?.available || 0,
    };
  }

  // =====================
  // Feedback Methods
  // =====================

  /**
   * Submit feedback for an analysis
   */
  async submitFeedback(
    analysisId: string,
    specialistId: string,
    feedbackData: {
      rating: string;
      safety_assessment_correct?: boolean;
      alerts_relevant?: boolean;
      recommendations_useful?: boolean;
      drug_feedback?: Array<{ drug_name: string; was_appropriate: boolean; comment?: string }>;
      missed_issues?: string[];
      false_positives?: string[];
      comments?: string;
      action_taken?: string;
      modifications_made?: string;
    },
  ): Promise<RxGPTFeedback> {
    // Verify the analysis exists and belongs to this specialist
    const analysis = await this.analyticsModel.findOne({
      _id: new Types.ObjectId(analysisId),
      specialist_id: new Types.ObjectId(specialistId),
    }).exec();

    if (!analysis) {
      throw new BadRequestException('Analysis not found or not authorized');
    }

    // Check if feedback already exists
    const existingFeedback = await this.feedbackModel.findOne({
      analysis_id: new Types.ObjectId(analysisId),
    }).exec();

    if (existingFeedback) {
      // Update existing feedback
      const updated = await this.feedbackModel.findByIdAndUpdate(
        existingFeedback._id,
        {
          $set: {
            rating: feedbackData.rating,
            safety_assessment_correct: feedbackData.safety_assessment_correct,
            alerts_relevant: feedbackData.alerts_relevant,
            recommendations_useful: feedbackData.recommendations_useful,
            drug_feedback: feedbackData.drug_feedback || [],
            missed_issues: feedbackData.missed_issues || [],
            false_positives: feedbackData.false_positives || [],
            comments: feedbackData.comments,
            action_taken: feedbackData.action_taken,
            modifications_made: feedbackData.modifications_made,
          },
        },
        { new: true },
      ).exec();
      return updated!;
    }

    // Create new feedback
    const feedback = await this.feedbackModel.create({
      analysis_id: new Types.ObjectId(analysisId),
      specialist_id: new Types.ObjectId(specialistId),
      patient_id: analysis.patient_id,
      rating: feedbackData.rating,
      safety_assessment_correct: feedbackData.safety_assessment_correct,
      alerts_relevant: feedbackData.alerts_relevant,
      recommendations_useful: feedbackData.recommendations_useful,
      drug_feedback: feedbackData.drug_feedback || [],
      missed_issues: feedbackData.missed_issues || [],
      false_positives: feedbackData.false_positives || [],
      comments: feedbackData.comments,
      action_taken: feedbackData.action_taken,
      modifications_made: feedbackData.modifications_made,
    });

    return feedback;
  }

  /**
   * Get feedback for an analysis
   */
  async getFeedbackForAnalysis(
    analysisId: string,
    specialistId: string,
  ): Promise<RxGPTFeedback | null> {
    return this.feedbackModel.findOne({
      analysis_id: new Types.ObjectId(analysisId),
      specialist_id: new Types.ObjectId(specialistId),
    }).exec();
  }

  /**
   * Get feedback statistics (admin)
   */
  async getFeedbackStats(
    startDate?: string,
    endDate?: string,
  ): Promise<{
    total_feedback: number;
    by_rating: Record<string, number>;
    safety_correct_rate: number;
    alerts_relevant_rate: number;
    recommendations_useful_rate: number;
    by_action_taken: Record<string, number>;
    common_missed_issues: { issue: string; count: number }[];
    common_false_positives: { issue: string; count: number }[];
  }> {
    const matchStage: any = {};
    if (startDate || endDate) {
      matchStage.created_at = {};
      if (startDate) matchStage.created_at.$gte = new Date(startDate);
      if (endDate) matchStage.created_at.$lte = new Date(endDate);
    }

    const [basicStats, ratingStats, actionStats, missedIssues, falsePositives] = await Promise.all([
      // Basic stats
      this.feedbackModel.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            safety_correct_count: { $sum: { $cond: ['$safety_assessment_correct', 1, 0] } },
            safety_total: { $sum: { $cond: [{ $ne: ['$safety_assessment_correct', null] }, 1, 0] } },
            alerts_relevant_count: { $sum: { $cond: ['$alerts_relevant', 1, 0] } },
            alerts_total: { $sum: { $cond: [{ $ne: ['$alerts_relevant', null] }, 1, 0] } },
            recs_useful_count: { $sum: { $cond: ['$recommendations_useful', 1, 0] } },
            recs_total: { $sum: { $cond: [{ $ne: ['$recommendations_useful', null] }, 1, 0] } },
          },
        },
      ]),
      // By rating
      this.feedbackModel.aggregate([
        { $match: matchStage },
        { $group: { _id: '$rating', count: { $sum: 1 } } },
      ]),
      // By action taken
      this.feedbackModel.aggregate([
        { $match: { ...matchStage, action_taken: { $exists: true } } },
        { $group: { _id: '$action_taken', count: { $sum: 1 } } },
      ]),
      // Common missed issues
      this.feedbackModel.aggregate([
        { $match: matchStage },
        { $unwind: '$missed_issues' },
        { $group: { _id: '$missed_issues', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      // Common false positives
      this.feedbackModel.aggregate([
        { $match: matchStage },
        { $unwind: '$false_positives' },
        { $group: { _id: '$false_positives', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
    ]);

    const stats = basicStats[0] || {};
    const byRating: Record<string, number> = {};
    for (const r of ratingStats) {
      byRating[r._id] = r.count;
    }
    const byAction: Record<string, number> = {};
    for (const a of actionStats) {
      byAction[a._id] = a.count;
    }

    return {
      total_feedback: stats.total || 0,
      by_rating: byRating,
      safety_correct_rate:
        stats.safety_total > 0 ? Math.round((stats.safety_correct_count / stats.safety_total) * 100) : 0,
      alerts_relevant_rate:
        stats.alerts_total > 0 ? Math.round((stats.alerts_relevant_count / stats.alerts_total) * 100) : 0,
      recommendations_useful_rate:
        stats.recs_total > 0 ? Math.round((stats.recs_useful_count / stats.recs_total) * 100) : 0,
      by_action_taken: byAction,
      common_missed_issues: missedIssues.map((i: any) => ({ issue: i._id, count: i.count })),
      common_false_positives: falsePositives.map((i: any) => ({ issue: i._id, count: i.count })),
    };
  }

  /**
   * Get analytics summary
   */
  async getAnalytics(query: RxGPTAnalyticsQueryDto): Promise<RxGPTAnalyticsSummaryDto> {
    const matchStage: any = {};

    if (query.start_date) {
      matchStage.created_at = { $gte: new Date(query.start_date) };
    }
    if (query.end_date) {
      matchStage.created_at = { ...matchStage.created_at, $lte: new Date(query.end_date) };
    }
    if (query.specialist_id) {
      matchStage.specialist_id = new Types.ObjectId(query.specialist_id);
    }

    const [summary] = await this.analyticsModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          total_analyses: { $sum: 1 },
          total_alerts: { $sum: '$total_alerts' },
          critical_alerts: { $sum: '$critical_alerts' },
          warning_alerts: { $sum: '$warning_alerts' },
          info_alerts: { $sum: '$info_alerts' },
          average_confidence: { $avg: '$confidence_score' },
          unique_specialists: { $addToSet: '$specialist_id' },
          total_credits_used: { $sum: '$credits_used' },
        },
      },
    ]);

    // Get usage trend
    const usageTrend = await this.analyticsModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 30 },
    ]);

    // Get top specialists
    const topSpecialists = await this.analyticsModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$specialist_id',
          analyses_count: { $sum: 1 },
        },
      },
      { $sort: { analyses_count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'specialist',
        },
      },
      { $unwind: '$specialist' },
      {
        $project: {
          specialist_id: '$_id',
          specialist_name: {
            $concat: ['$specialist.profile.first_name', ' ', '$specialist.profile.last_name'],
          },
          analyses_count: 1,
        },
      },
    ]);

    // Get alerts by type
    const alertsByType = await this.analyticsModel.aggregate([
      { $match: matchStage },
      { $unwind: '$alerts' },
      {
        $group: {
          _id: '$alerts.type',
          count: { $sum: 1 },
        },
      },
    ]);

    const alertsMap: any = {
      allergy: 0,
      interaction: 0,
      contraindication: 0,
      dosage: 0,
      age: 0,
      pregnancy: 0,
    };
    for (const alert of alertsByType) {
      if (alertsMap[alert._id] !== undefined) {
        alertsMap[alert._id] = alert.count;
      }
    }

    return {
      total_analyses: summary?.total_analyses || 0,
      total_alerts: summary?.total_alerts || 0,
      critical_alerts: summary?.critical_alerts || 0,
      warning_alerts: summary?.warning_alerts || 0,
      info_alerts: summary?.info_alerts || 0,
      average_confidence: Math.round(summary?.average_confidence || 0),
      unique_specialists: summary?.unique_specialists?.length || 0,
      total_credits_used: summary?.total_credits_used || 0,
      alerts_by_type: alertsMap,
      usage_trend: usageTrend.map((t: any) => ({ date: t._id, count: t.count })),
      top_specialists: topSpecialists.map((s: any) => ({
        specialist_id: s.specialist_id.toString(),
        specialist_name: s.specialist_name,
        analyses_count: s.analyses_count,
      })),
      common_interactions: [], // TODO: Implement if needed
    };
  }
}
