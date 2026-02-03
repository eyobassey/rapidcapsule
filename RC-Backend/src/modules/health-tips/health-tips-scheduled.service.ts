import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import Anthropic from '@anthropic-ai/sdk';
import { User, UserDocument } from '../users/entities/user.entity';
import { HealthTip, HealthTipDocument, TipSource, TipStatus, TipCategory, TipPriority } from './entities/health-tip.entity';
import { HealthTipGeneration, HealthTipGenerationDocument, GenerationType } from './entities/health-tip-generation.entity';
import { HealthTipsRuleEngine } from './services/rule-engine.service';
import { HealthTipsDataService } from './services/data.service';
import { buildAIInsightPrompt } from './ai/prompts';

@Injectable()
export class HealthTipsScheduledService {
  private readonly logger = new Logger(HealthTipsScheduledService.name);
  private claudeClient: Anthropic | null = null;

  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(HealthTip.name)
    private tipModel: Model<HealthTipDocument>,
    @InjectModel(HealthTipGeneration.name)
    private generationModel: Model<HealthTipGenerationDocument>,
    private readonly ruleEngine: HealthTipsRuleEngine,
    private readonly dataService: HealthTipsDataService,
  ) {
    this.initializeClaudeClient();
  }

  private initializeClaudeClient() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey) {
      this.claudeClient = new Anthropic({ apiKey });
      this.logger.log('Claude AI client initialized for Health Tips');
    } else {
      this.logger.warn('ANTHROPIC_API_KEY not found, AI features will be disabled');
    }
  }

  /**
   * Daily job: Run rule-based tip generation for all active patients
   * Runs at 6 AM every day
   */
  @Cron('0 6 * * *')
  async runDailyRuleEvaluation(): Promise<void> {
    this.logger.log('Starting daily health tips rule evaluation...');
    const startTime = Date.now();

    let processedCount = 0;
    let totalTipsGenerated = 0;
    let errorCount = 0;

    try {
      const batchSize = 100;
      let skip = 0;
      let hasMore = true;

      while (hasMore) {
        const patients = await this.userModel
          .find({
            user_type: 'Patient',
            status: 'Active',
            is_email_verified: true,
          })
          .select('_id')
          .skip(skip)
          .limit(batchSize)
          .lean();

        if (patients.length === 0) {
          hasMore = false;
          continue;
        }

        for (const patient of patients) {
          try {
            const result = await this.generateRuleBasedTips(patient._id);
            totalTipsGenerated += result.tips_generated;
            processedCount++;
          } catch (error) {
            this.logger.error(`Failed to process patient ${patient._id}: ${error.message}`);
            errorCount++;
          }
        }

        skip += batchSize;
        if (patients.length < batchSize) hasMore = false;
      }

      const duration = Date.now() - startTime;
      this.logger.log(
        `Daily rule evaluation complete: ${processedCount} patients processed, ${totalTipsGenerated} tips generated, ${errorCount} errors, ${duration}ms`,
      );
    } catch (error) {
      this.logger.error(`Daily rule evaluation failed: ${error.message}`, error.stack);
    }
  }

  /**
   * Weekly job: Generate AI-powered personalized insights
   * Runs every Sunday at 7 AM
   */
  @Cron('0 7 * * 0')
  async runWeeklyAIGeneration(): Promise<void> {
    if (!this.claudeClient) {
      this.logger.warn('Claude client not initialized, skipping weekly AI generation');
      return;
    }

    this.logger.log('Starting weekly AI health insights generation...');
    const startTime = Date.now();

    let processedCount = 0;
    let totalTipsGenerated = 0;
    let errorCount = 0;

    try {
      // Get patients who haven't had AI tips in the last 6 days
      const sixDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);

      const recentAIGenerations = await this.generationModel.distinct('user_id', {
        generation_type: GenerationType.WEEKLY_AI,
        created_at: { $gte: sixDaysAgo },
      });

      const patients = await this.userModel
        .find({
          user_type: 'Patient',
          status: 'Active',
          is_email_verified: true,
          _id: { $nin: recentAIGenerations },
        })
        .select('_id profile')
        .limit(500) // Limit to control costs
        .lean();

      this.logger.log(`Found ${patients.length} patients eligible for AI insights`);

      for (const patient of patients) {
        try {
          const result = await this.generateAIInsights(patient._id);
          if (result.success) {
            totalTipsGenerated += result.tips_generated;
          }
          processedCount++;

          // Rate limiting - wait 1 second between API calls
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (error) {
          this.logger.error(`AI generation failed for patient ${patient._id}: ${error.message}`);
          errorCount++;
        }
      }

      const duration = Date.now() - startTime;
      this.logger.log(
        `Weekly AI generation complete: ${processedCount} patients processed, ${totalTipsGenerated} insights generated, ${errorCount} errors, ${duration}ms`,
      );
    } catch (error) {
      this.logger.error(`Weekly AI generation failed: ${error.message}`, error.stack);
    }
  }

  /**
   * Daily cleanup: Expire old tips and clean up dismissed tips
   * Runs at midnight
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupExpiredTips(): Promise<void> {
    this.logger.log('Starting health tips cleanup...');

    try {
      // Mark expired tips
      const expiredResult = await this.tipModel.updateMany(
        {
          status: TipStatus.ACTIVE,
          expires_at: { $lte: new Date() },
        },
        {
          $set: { status: TipStatus.EXPIRED },
        },
      );

      // Delete old dismissed tips (older than 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const deletedResult = await this.tipModel.deleteMany({
        status: { $in: [TipStatus.DISMISSED, TipStatus.EXPIRED] },
        updated_at: { $lte: thirtyDaysAgo },
      });

      this.logger.log(`Cleanup complete: ${expiredResult.modifiedCount} tips expired, ${deletedResult.deletedCount} old tips deleted`);
    } catch (error) {
      this.logger.error(`Tips cleanup failed: ${error.message}`, error.stack);
    }
  }

  /**
   * Generate rule-based tips for a single user
   */
  async generateRuleBasedTips(userId: Types.ObjectId): Promise<{ tips_generated: number }> {
    const startTime = Date.now();

    const ctx = await this.dataService.buildHealthContext(userId);
    const result = await this.ruleEngine.evaluateRules(ctx, userId);

    await this.generationModel.create({
      user_id: userId,
      generation_type: GenerationType.DAILY_RULES,
      tips_generated: result.tipsCreated,
      rules_evaluated: result.rulesEvaluated,
      rules_triggered: result.rulesTriggered,
      triggered_rule_ids: result.triggeredRuleIds,
      processing_time_ms: Date.now() - startTime,
      success: true,
    });

    return { tips_generated: result.tipsCreated };
  }

  /**
   * Generate AI insights for a single user
   */
  async generateAIInsights(userId: Types.ObjectId): Promise<{ success: boolean; tips_generated: number }> {
    if (!this.claudeClient) {
      return { success: false, tips_generated: 0 };
    }

    const startTime = Date.now();
    let tipsGenerated = 0;

    try {
      const ctx = await this.dataService.buildHealthContext(userId);
      const prompt = buildAIInsightPrompt(ctx);

      const response = await this.claudeClient.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      });

      const textContent = response.content.find((block) => block.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text response from Claude');
      }

      const parsed = this.parseAIResponse(textContent.text);

      for (const insight of parsed.insights) {
        const category = this.mapCategory(insight.category);
        const priority = this.mapPriority(insight.priority);

        await this.tipModel.create({
          user_id: userId,
          title: insight.title,
          content: insight.content,
          category,
          priority,
          action_text: insight.action_text || null,
          action_route: insight.action_route || null,
          source: TipSource.AI_GENERATED,
          status: TipStatus.ACTIVE,
          generated_at: new Date(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          icon: this.getCategoryIcon(category),
          tags: insight.tags || [],
          ai_metadata: {
            model: 'claude-sonnet-4-20250514',
            prompt_tokens: response.usage?.input_tokens || 0,
            completion_tokens: response.usage?.output_tokens || 0,
            generation_time_ms: Date.now() - startTime,
          },
        });
        tipsGenerated++;
      }

      await this.generationModel.create({
        user_id: userId,
        generation_type: GenerationType.WEEKLY_AI,
        tips_generated: tipsGenerated,
        processing_time_ms: Date.now() - startTime,
        success: true,
        ai_usage: {
          prompt_tokens: response.usage?.input_tokens || 0,
          completion_tokens: response.usage?.output_tokens || 0,
          model: 'claude-sonnet-4-20250514',
        },
      });

      return { success: true, tips_generated: tipsGenerated };
    } catch (error) {
      this.logger.error(`AI insight generation failed: ${error.message}`);

      await this.generationModel.create({
        user_id: userId,
        generation_type: GenerationType.WEEKLY_AI,
        tips_generated: 0,
        processing_time_ms: Date.now() - startTime,
        success: false,
        error_message: error.message,
      });

      return { success: false, tips_generated: 0 };
    }
  }

  private parseAIResponse(text: string): { insights: any[]; summary?: string } {
    try {
      let jsonStr = text.trim();
      if (jsonStr.startsWith('```json')) jsonStr = jsonStr.slice(7);
      if (jsonStr.startsWith('```')) jsonStr = jsonStr.slice(3);
      if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3);

      return JSON.parse(jsonStr.trim());
    } catch (error) {
      this.logger.error('Failed to parse AI response:', text.slice(0, 200));
      return { insights: [] };
    }
  }

  private mapCategory(category: string): TipCategory {
    const mapping: Record<string, TipCategory> = {
      vitals: TipCategory.VITALS,
      lifestyle: TipCategory.LIFESTYLE,
      nutrition: TipCategory.NUTRITION,
      fitness: TipCategory.FITNESS,
      mental_health: TipCategory.MENTAL_HEALTH,
      preventive_care: TipCategory.PREVENTIVE_CARE,
      chronic_condition: TipCategory.CHRONIC_CONDITION,
      medication: TipCategory.MEDICATION,
      sleep: TipCategory.SLEEP,
      hydration: TipCategory.HYDRATION,
    };
    return mapping[category] || TipCategory.LIFESTYLE;
  }

  private mapPriority(priority: string): TipPriority {
    const mapping: Record<string, TipPriority> = {
      urgent: TipPriority.URGENT,
      high: TipPriority.HIGH,
      medium: TipPriority.MEDIUM,
      low: TipPriority.LOW,
    };
    return mapping[priority] || TipPriority.MEDIUM;
  }

  private getCategoryIcon(category: TipCategory): string {
    const icons: Record<TipCategory, string> = {
      [TipCategory.VITALS]: 'hi-heart',
      [TipCategory.LIFESTYLE]: 'hi-user',
      [TipCategory.NUTRITION]: 'hi-cake',
      [TipCategory.FITNESS]: 'hi-lightning-bolt',
      [TipCategory.MENTAL_HEALTH]: 'hi-emoji-happy',
      [TipCategory.PREVENTIVE_CARE]: 'hi-shield-check',
      [TipCategory.CHRONIC_CONDITION]: 'hi-clipboard-list',
      [TipCategory.MEDICATION]: 'hi-collection',
      [TipCategory.SLEEP]: 'hi-moon',
      [TipCategory.HYDRATION]: 'hi-beaker',
    };
    return icons[category] || 'hi-light-bulb';
  }
}
