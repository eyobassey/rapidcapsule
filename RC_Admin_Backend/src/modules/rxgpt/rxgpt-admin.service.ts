import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { RxGPTSettings, RxGPTSettingsDocument } from './entities/rxgpt-settings.entity';
import { RxGPTAnalytics } from './entities/rxgpt-analytics.entity';
import { ClaudeSummaryCredit } from '../claude-summary/entities/claude-summary-credit.entity';
import { User, UserDocument } from '../patients/entities/patient.entity';
import { UpdateRxGPTSettingsDto } from './dto/rxgpt-admin.dto';

@Injectable()
export class RxGPTAdminService {
  constructor(
    @InjectModel(RxGPTSettings.name)
    private rxgptSettingsModel: Model<RxGPTSettings>,
    @InjectModel(RxGPTAnalytics.name)
    private rxgptAnalyticsModel: Model<RxGPTAnalytics>,
    @InjectModel(ClaudeSummaryCredit.name)
    private claudeSummaryCreditModel: Model<ClaudeSummaryCredit>,
    @InjectModel(User.name)
    private userModel: Model<User>,
  ) {}

  // =====================
  // Settings Management
  // =====================

  async getSettings(): Promise<RxGPTSettingsDocument> {
    let settings = await this.rxgptSettingsModel.findOne().exec();
    if (!settings) {
      settings = await this.createDefaultSettings();
    }
    return settings;
  }

  async updateSettings(
    dto: UpdateRxGPTSettingsDto,
    adminId: string,
  ): Promise<RxGPTSettingsDocument> {
    let settings = await this.rxgptSettingsModel.findOne().exec();
    if (!settings) {
      settings = await this.createDefaultSettings();
    }

    // Update top-level fields
    if (dto.is_enabled !== undefined) settings.is_enabled = dto.is_enabled;
    if (dto.is_enabled_for_specialists !== undefined)
      settings.is_enabled_for_specialists = dto.is_enabled_for_specialists;
    if (dto.ai_model) settings.ai_model = dto.ai_model;
    if (dto.max_tokens) settings.max_tokens = dto.max_tokens;
    if (dto.temperature !== undefined) settings.temperature = dto.temperature;
    if (dto.disclaimer_text) settings.disclaimer_text = dto.disclaimer_text;

    // Update nested objects
    if (dto.credit_settings) {
      settings.credit_settings = { ...settings.credit_settings, ...dto.credit_settings };
    }
    if (dto.features) {
      settings.features = { ...settings.features, ...dto.features };
    }
    if (dto.data_sources) {
      settings.data_sources = { ...settings.data_sources, ...dto.data_sources };
    }
    if (dto.thresholds) {
      settings.thresholds = {
        ...settings.thresholds,
        ...dto.thresholds,
        interaction_severity_threshold: (dto.thresholds?.interaction_severity_threshold ||
          settings.thresholds.interaction_severity_threshold) as 'low' | 'moderate' | 'high',
      };
    }
    if (dto.display) {
      settings.display = { ...settings.display, ...dto.display };
    }

    settings.last_updated_by = new Types.ObjectId(adminId);

    return settings.save();
  }

  private async createDefaultSettings(): Promise<RxGPTSettingsDocument> {
    const defaultSettings = new this.rxgptSettingsModel({
      is_enabled: true,
      is_enabled_for_specialists: true,
      ai_model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
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
        interaction_severity_threshold: 'moderate' as const,
        max_alternatives: 3,
      },
      display: {
        show_citations: true,
        show_confidence_scores: true,
        show_reasoning: true,
        auto_expand_alerts: true,
      },
      disclaimer_text:
        'RxGPT is an AI-powered assistant. All recommendations should be reviewed and verified by a licensed healthcare professional.',
    });
    return defaultSettings.save();
  }

  // =====================
  // Analytics
  // =====================

  async getAnalytics(startDate?: string, endDate?: string): Promise<any> {
    const dateFilter = this.buildDateFilter(startDate, endDate);

    const [totalAnalyses, alertStats, safetyStats, creditStats, specialistStats] =
      await Promise.all([
        this.rxgptAnalyticsModel.countDocuments(dateFilter),
        this.getAlertStats(dateFilter),
        this.getSafetyStats(dateFilter),
        this.getCreditStats(dateFilter),
        this.getActiveSpecialistCount(dateFilter),
      ]);

    return {
      total_analyses: totalAnalyses,
      total_alerts: alertStats.total,
      safe_rate: safetyStats.safeRate,
      active_specialists: specialistStats,
      credits_consumed: creditStats.total,
      avg_confidence: safetyStats.avgConfidence,
      drugs_analyzed: safetyStats.drugsAnalyzed,
      most_common_risk: safetyStats.mostCommonRisk,
    };
  }

  async getDailyTrends(startDate?: string, endDate?: string): Promise<any> {
    const dateFilter = this.buildDateFilter(startDate, endDate);

    const trends = await this.rxgptAnalyticsModel.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } },
          count: { $sum: 1 },
          alerts: { $sum: { $size: '$alerts' } },
          credits: { $sum: '$credits_used' },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 30 },
    ]);

    return { daily_usage: trends };
  }

  async getAlertBreakdown(startDate?: string, endDate?: string): Promise<any> {
    const dateFilter = this.buildDateFilter(startDate, endDate);

    const [bySeverity, byType] = await Promise.all([
      this.rxgptAnalyticsModel.aggregate([
        { $match: dateFilter },
        { $unwind: '$alerts' },
        {
          $group: {
            _id: '$alerts.severity',
            count: { $sum: 1 },
          },
        },
      ]),
      this.rxgptAnalyticsModel.aggregate([
        { $match: dateFilter },
        { $unwind: '$alerts' },
        {
          $group: {
            _id: '$alerts.type',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    return {
      by_severity: this.mapToObject(bySeverity),
      by_type: this.mapToObject(byType),
    };
  }

  async getTopFlaggedDrugs(limit: number): Promise<any[]> {
    return this.rxgptAnalyticsModel.aggregate([
      { $unwind: '$alerts' },
      {
        $group: {
          _id: '$alerts.drug_name',
          name: { $first: '$alerts.drug_name' },
          alert_count: { $sum: 1 },
          severities: { $push: '$alerts.severity' },
        },
      },
      {
        $addFields: {
          most_common_severity: {
            $arrayElemAt: [
              {
                $filter: {
                  input: ['critical', 'warning', 'info'],
                  as: 'sev',
                  cond: { $in: ['$$sev', '$severities'] },
                },
              },
              0,
            ],
          },
        },
      },
      { $sort: { alert_count: -1 } },
      { $limit: limit },
      { $project: { _id: 1, name: 1, alert_count: 1, most_common_severity: 1 } },
    ]);
  }

  async getTopSpecialists(limit: number): Promise<any[]> {
    const topSpecialists = await this.rxgptAnalyticsModel.aggregate([
      {
        $group: {
          _id: '$specialist',
          analyses_count: { $sum: 1 },
          alerts_count: { $sum: { $size: '$alerts' } },
          total_confidence: { $sum: '$confidence_score' },
          safe_count: { $sum: { $cond: ['$is_safe', 1, 0] } },
          credits_used: { $sum: '$credits_used' },
        },
      },
      { $sort: { analyses_count: -1 } },
      { $limit: limit },
    ]);

    // Fetch specialist details
    const specialistIds = topSpecialists.map((s) => s._id);
    const specialists = await this.userModel
      .find({ _id: { $in: specialistIds } })
      .select('profile professional_practice')
      .lean();

    const specialistMap = new Map(specialists.map((s: any) => [s._id.toString(), s]));

    return topSpecialists.map((s) => {
      const specialist: any = specialistMap.get(s._id.toString());
      return {
        _id: s._id,
        first_name: specialist?.profile?.first_name || 'Unknown',
        last_name: specialist?.profile?.last_name || '',
        specialization: specialist?.professional_practice?.area_of_specialty || specialist?.professional_practice?.category || 'General',
        analyses_count: s.analyses_count,
        alerts_count: s.alerts_count,
        safe_rate: s.analyses_count > 0 ? (s.safe_count / s.analyses_count) * 100 : 0,
        credits_used: s.credits_used,
      };
    });
  }

  // =====================
  // Specialist Credit Management
  // =====================

  async getSpecialistsWithCredits(
    page: number,
    limit: number,
    search?: string,
  ): Promise<any> {
    const skip = (page - 1) * limit;

    // Build search filter for specialists
    const userFilter: any = { user_type: 'Specialist' };
    if (search) {
      userFilter.$or = [
        { 'profile.first_name': { $regex: search, $options: 'i' } },
        { 'profile.last_name': { $regex: search, $options: 'i' } },
        { 'profile.contact.email': { $regex: search, $options: 'i' } },
      ];
    }

    const [specialists, total] = await Promise.all([
      this.userModel
        .find(userFilter)
        .select('profile professional_practice')
        .skip(skip)
        .limit(limit)
        .lean(),
      this.userModel.countDocuments(userFilter),
    ]);

    // Fetch credit info for each specialist
    const specialistIds = specialists.map((s: any) => s._id);
    const credits = await this.claudeSummaryCreditModel
      .find({ userId: { $in: specialistIds } })
      .lean();

    const creditMap = new Map(credits.map((c: any) => [c.userId.toString(), c]));

    const specialistsWithCredits = specialists.map((s: any) => {
      const credit: any = creditMap.get(s._id.toString());
      return {
        _id: s._id,
        first_name: s.profile?.first_name || 'Unknown',
        last_name: s.profile?.last_name || '',
        email: s.profile?.contact?.email || '',
        specialization: s.professional_practice?.area_of_specialty || s.professional_practice?.category || 'General',
        free_credits: credit?.free_credits_remaining || 0,
        purchased_credits: credit?.purchased_credits || 0,
        gifted_credits: credit?.gifted_credits || 0,
        rxgpt_credits_used: 0, // Will be calculated from analytics
        has_unlimited: credit?.unlimited_subscription?.is_active || false,
      };
    });

    return {
      specialists: specialistsWithCredits,
      total,
      pagination: {
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getSpecialistCreditDetails(specialistId: string): Promise<any> {
    const [credit, rxgptStats] = await Promise.all([
      this.claudeSummaryCreditModel
        .findOne({ userId: new Types.ObjectId(specialistId) })
        .lean(),
      this.rxgptAnalyticsModel.aggregate([
        { $match: { specialist: new Types.ObjectId(specialistId) } },
        {
          $group: {
            _id: null,
            total_analyses: { $sum: 1 },
            credits_used: { $sum: '$credits_used' },
            last_used: { $max: '$created_at' },
          },
        },
      ]),
    ]);

    const stats = rxgptStats[0] || { total_analyses: 0, credits_used: 0, last_used: null };

    if (!credit) {
      return {
        free_credits_remaining: 0,
        purchased_credits: 0,
        gifted_credits: 0,
        rxgpt_credits_used: stats.credits_used,
        total_rxgpt_analyses: stats.total_analyses,
        rxgpt_last_used_at: stats.last_used,
        unlimited_subscription: { active: false },
        gifted_expires_at: null,
      };
    }

    return {
      free_credits_remaining: credit.free_credits_remaining || 0,
      purchased_credits: credit.purchased_credits || 0,
      gifted_credits: credit.gifted_credits || 0,
      rxgpt_credits_used: stats.credits_used,
      total_rxgpt_analyses: stats.total_analyses,
      rxgpt_last_used_at: stats.last_used,
      unlimited_subscription: {
        active: credit.unlimited_subscription?.is_active || false,
        expires_at: credit.unlimited_subscription?.expires_at,
      },
      gifted_expires_at: credit.gifted_credits_expiry,
    };
  }

  async giftCreditsToSpecialist(
    specialistId: string,
    credits: number,
    expiryDays: number | null,
    reason: string,
    adminId: string,
  ): Promise<any> {
    const expiresAt = expiryDays
      ? new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000)
      : null;

    const result = await this.claudeSummaryCreditModel.findOneAndUpdate(
      { userId: new Types.ObjectId(specialistId) },
      {
        $inc: { gifted_credits: credits },
        $set: {
          gifted_credits_expiry: expiresAt,
          gifted_by: new Types.ObjectId(adminId),
          gift_reason: reason,
          updated_at: new Date(),
        },
        $setOnInsert: {
          userId: new Types.ObjectId(specialistId),
          free_credits_remaining: 0,
          free_credits_reset_date: this.getNextMonthStart(),
          purchased_credits: 0,
          created_at: new Date(),
        },
      },
      { upsert: true, new: true },
    );

    return result;
  }

  private getNextMonthStart(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 1);
  }

  async giftUnlimitedToSpecialist(
    specialistId: string,
    durationDays: number,
    reason: string,
    adminId: string,
  ): Promise<any> {
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

    const result = await this.claudeSummaryCreditModel.findOneAndUpdate(
      { userId: new Types.ObjectId(specialistId) },
      {
        $set: {
          'unlimited_subscription.is_active': true,
          'unlimited_subscription.expires_at': expiresAt,
          'unlimited_subscription.started_at': new Date(),
          'unlimited_subscription.plan_name': `RxGPT Unlimited (${durationDays} days)`,
          gift_reason: reason,
          gifted_by: new Types.ObjectId(adminId),
          updated_at: new Date(),
        },
        $setOnInsert: {
          userId: new Types.ObjectId(specialistId),
          free_credits_remaining: 0,
          free_credits_reset_date: this.getNextMonthStart(),
          purchased_credits: 0,
          gifted_credits: 0,
          created_at: new Date(),
        },
      },
      { upsert: true, new: true },
    );

    return result;
  }

  async revokeSpecialistCredits(
    specialistId: string,
    reason: string,
    adminId: string,
  ): Promise<any> {
    const result = await this.claudeSummaryCreditModel.findOneAndUpdate(
      { userId: new Types.ObjectId(specialistId) },
      {
        $set: {
          gifted_credits: 0,
          gifted_credits_expiry: null,
          gifted_by: null,
          gift_reason: `Revoked: ${reason}`,
          'unlimited_subscription.is_active': false,
          'unlimited_subscription.expires_at': null,
          updated_at: new Date(),
        },
      },
      { new: true },
    );

    return result;
  }

  async bulkGiftCredits(
    specialistIds: string[],
    credits: number,
    expiryDays: number | null,
    reason: string,
    adminId: string,
  ): Promise<any> {
    const expiresAt = expiryDays
      ? new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000)
      : null;

    const bulkOps = specialistIds.map((specialistId) => ({
      updateOne: {
        filter: { userId: new Types.ObjectId(specialistId) },
        update: {
          $inc: { gifted_credits: credits },
          $set: {
            gifted_credits_expiry: expiresAt,
            gifted_by: new Types.ObjectId(adminId),
            gift_reason: reason,
            updated_at: new Date(),
          },
          $setOnInsert: {
            userId: new Types.ObjectId(specialistId),
            free_credits_remaining: 0,
            free_credits_reset_date: this.getNextMonthStart(),
            purchased_credits: 0,
            created_at: new Date(),
          },
        },
        upsert: true,
      },
    }));

    const result = await this.claudeSummaryCreditModel.bulkWrite(bulkOps);

    return {
      specialists_updated: result.modifiedCount + result.upsertedCount,
      credits_per_specialist: credits,
      total_credits: credits * specialistIds.length,
    };
  }

  // =====================
  // Helper Methods
  // =====================

  private buildDateFilter(startDate?: string, endDate?: string): any {
    const filter: any = {};
    if (startDate || endDate) {
      filter.created_at = {};
      if (startDate) filter.created_at.$gte = new Date(startDate);
      if (endDate) filter.created_at.$lte = new Date(endDate);
    }
    return filter;
  }

  private async getAlertStats(dateFilter: any): Promise<any> {
    const result = await this.rxgptAnalyticsModel.aggregate([
      { $match: dateFilter },
      { $unwind: { path: '$alerts', preserveNullAndEmptyArrays: true } },
      { $group: { _id: null, total: { $sum: 1 } } },
    ]);
    return { total: result[0]?.total || 0 };
  }

  private async getSafetyStats(dateFilter: any): Promise<any> {
    const result = await this.rxgptAnalyticsModel.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          safe: { $sum: { $cond: ['$is_safe', 1, 0] } },
          avgConfidence: { $avg: '$confidence_score' },
          drugsAnalyzed: { $sum: { $size: { $ifNull: ['$drugs_analyzed', []] } } },
          riskLevels: { $push: '$overall_risk_level' },
        },
      },
    ]);

    const stats = result[0] || { total: 0, safe: 0, avgConfidence: 0, drugsAnalyzed: 0, riskLevels: [] };
    const safeRate = stats.total > 0 ? (stats.safe / stats.total) * 100 : 0;

    // Find most common risk level
    const riskCounts = stats.riskLevels.reduce((acc: any, level: string) => {
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {});
    const mostCommonRisk = Object.entries(riskCounts).sort(
      (a: any, b: any) => b[1] - a[1],
    )[0]?.[0] || 'low';

    return {
      safeRate,
      avgConfidence: stats.avgConfidence || 0,
      drugsAnalyzed: stats.drugsAnalyzed,
      mostCommonRisk,
    };
  }

  private async getCreditStats(dateFilter: any): Promise<any> {
    const result = await this.rxgptAnalyticsModel.aggregate([
      { $match: dateFilter },
      { $group: { _id: null, total: { $sum: '$credits_used' } } },
    ]);
    return { total: result[0]?.total || 0 };
  }

  private async getActiveSpecialistCount(dateFilter: any): Promise<number> {
    const result = await this.rxgptAnalyticsModel.distinct('specialist', dateFilter);
    return result.length;
  }

  private mapToObject(arr: any[]): any {
    return arr.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});
  }
}
