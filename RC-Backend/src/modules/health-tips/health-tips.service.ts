import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { HealthTip, HealthTipDocument, TipStatus, TipPriority, TipCategory } from './entities/health-tip.entity';
import { HealthTipGeneration, HealthTipGenerationDocument, GenerationType } from './entities/health-tip-generation.entity';
import { HealthTipsDataService } from './services/data.service';
import { HealthTipsRuleEngine } from './services/rule-engine.service';

const MEDICAL_DISCLAIMER =
  'These health tips are for informational purposes only and do not constitute medical advice. Always consult with a healthcare professional for medical decisions.';

export interface GetTipsOptions {
  category?: string;
  priority?: string;
  limit?: number;
  includeDismissed?: boolean;
}

export interface TipsSummary {
  total_active: number;
  by_priority: Record<string, number>;
  by_category: Record<string, number>;
  last_generated_at: Date | null;
  next_ai_insights_at: Date | null;
}

@Injectable()
export class HealthTipsService {
  private readonly logger = new Logger(HealthTipsService.name);

  constructor(
    @InjectModel(HealthTip.name)
    private tipModel: Model<HealthTipDocument>,
    @InjectModel(HealthTipGeneration.name)
    private generationModel: Model<HealthTipGenerationDocument>,
    private readonly dataService: HealthTipsDataService,
    private readonly ruleEngine: HealthTipsRuleEngine,
  ) {}

  async getUserTips(userId: string, options: GetTipsOptions = {}) {
    const { category, priority, limit = 10, includeDismissed = false } = options;

    const query: any = {
      user_id: new Types.ObjectId(userId),
    };

    if (!includeDismissed) {
      query.status = TipStatus.ACTIVE;
    }

    if (category) {
      query.category = category;
    }

    if (priority) {
      query.priority = priority;
    }

    const priorityOrder = {
      [TipPriority.URGENT]: 0,
      [TipPriority.HIGH]: 1,
      [TipPriority.MEDIUM]: 2,
      [TipPriority.LOW]: 3,
    };

    const tips = await this.tipModel
      .find(query)
      .sort({ priority: 1, generated_at: -1 })
      .limit(limit)
      .lean();

    // Sort by priority order
    tips.sort((a, b) => {
      const aPriority = priorityOrder[a.priority as TipPriority] ?? 4;
      const bPriority = priorityOrder[b.priority as TipPriority] ?? 4;
      if (aPriority !== bPriority) return aPriority - bPriority;
      return new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime();
    });

    return {
      tips,
      total: tips.length,
      disclaimer: MEDICAL_DISCLAIMER,
    };
  }

  async getFeaturedTips(userId: string, limit: number = 3) {
    const result = await this.getUserTips(userId, { limit });

    // Track that these tips were displayed
    const tipIds = result.tips.map((t) => t._id);
    if (tipIds.length > 0) {
      await this.tipModel.updateMany(
        { _id: { $in: tipIds } },
        {
          $inc: { display_count: 1 },
          $set: { last_displayed_at: new Date() },
        },
      );
    }

    return result;
  }

  async getTipsSummary(userId: string): Promise<TipsSummary> {
    const userObjectId = new Types.ObjectId(userId);

    const activeTips = await this.tipModel.find({
      user_id: userObjectId,
      status: TipStatus.ACTIVE,
    });

    const byPriority: Record<string, number> = {
      urgent: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    const byCategory: Record<string, number> = {};

    for (const tip of activeTips) {
      byPriority[tip.priority] = (byPriority[tip.priority] || 0) + 1;
      byCategory[tip.category] = (byCategory[tip.category] || 0) + 1;
    }

    // Get last generation time
    const lastGeneration = await this.generationModel
      .findOne({ user_id: userObjectId })
      .sort({ created_at: -1 })
      .lean();

    // Calculate next AI insights date (next Sunday at 7 AM)
    const now = new Date();
    const daysUntilSunday = (7 - now.getDay()) % 7 || 7;
    const nextSunday = new Date(now);
    nextSunday.setDate(now.getDate() + daysUntilSunday);
    nextSunday.setHours(7, 0, 0, 0);

    return {
      total_active: activeTips.length,
      by_priority: byPriority,
      by_category: byCategory,
      last_generated_at: lastGeneration?.created_at || null,
      next_ai_insights_at: nextSunday,
    };
  }

  async dismissTip(userId: string, tipId: string) {
    const tip = await this.tipModel.findOne({
      _id: new Types.ObjectId(tipId),
      user_id: new Types.ObjectId(userId),
    });

    if (!tip) {
      throw new NotFoundException('Tip not found');
    }

    tip.status = TipStatus.DISMISSED;
    tip.dismissed_at = new Date();
    await tip.save();

    return { message: 'Tip dismissed successfully' };
  }

  async markAsActedUpon(userId: string, tipId: string) {
    const tip = await this.tipModel.findOne({
      _id: new Types.ObjectId(tipId),
      user_id: new Types.ObjectId(userId),
    });

    if (!tip) {
      throw new NotFoundException('Tip not found');
    }

    tip.status = TipStatus.ACTED_UPON;
    await tip.save();

    return { message: 'Tip marked as acted upon' };
  }

  async trackTipView(userId: string, tipId: string) {
    await this.tipModel.updateOne(
      {
        _id: new Types.ObjectId(tipId),
        user_id: new Types.ObjectId(userId),
      },
      {
        $inc: { display_count: 1 },
        $set: { last_displayed_at: new Date() },
      },
    );

    return { message: 'View tracked' };
  }

  async generateTipsOnDemand(userId: string) {
    const userObjectId = new Types.ObjectId(userId);

    try {
      const ctx = await this.dataService.buildHealthContext(userObjectId);
      const result = await this.ruleEngine.evaluateRules(ctx, userObjectId);

      // Log the generation
      await this.generationModel.create({
        user_id: userObjectId,
        generation_type: GenerationType.ON_DEMAND,
        tips_generated: result.tipsCreated,
        rules_evaluated: result.rulesEvaluated,
        rules_triggered: result.rulesTriggered,
        triggered_rule_ids: result.triggeredRuleIds,
        processing_time_ms: 0,
        success: true,
      });

      return {
        message: 'Tips generated successfully',
        tips_created: result.tipsCreated,
        rules_triggered: result.rulesTriggered,
      };
    } catch (error) {
      this.logger.error(`On-demand generation failed for user ${userId}: ${error.message}`);
      throw error;
    }
  }

  async getTipHistory(userId: string, options: { page: number; limit: number }) {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const [tips, total] = await Promise.all([
      this.tipModel
        .find({ user_id: new Types.ObjectId(userId) })
        .sort({ generated_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.tipModel.countDocuments({ user_id: new Types.ObjectId(userId) }),
    ]);

    return {
      tips,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }
}
