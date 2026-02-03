import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { HealthTip, HealthTipDocument, TipSource, TipStatus } from '../entities/health-tip.entity';
import { HealthDataContext } from './data.service';
import { HEALTH_RULES, HealthRule } from '../rules/rule-definitions';

export interface RuleEvaluationResult {
  rulesEvaluated: number;
  rulesTriggered: number;
  tipsCreated: number;
  triggeredRuleIds: string[];
}

@Injectable()
export class HealthTipsRuleEngine {
  private readonly logger = new Logger(HealthTipsRuleEngine.name);

  constructor(
    @InjectModel(HealthTip.name)
    private tipModel: Model<HealthTipDocument>,
  ) {}

  async evaluateRules(ctx: HealthDataContext, userId: Types.ObjectId): Promise<RuleEvaluationResult> {
    const result: RuleEvaluationResult = {
      rulesEvaluated: 0,
      rulesTriggered: 0,
      tipsCreated: 0,
      triggeredRuleIds: [],
    };

    const enabledRules = HEALTH_RULES.filter((r) => r.enabled);

    for (const rule of enabledRules) {
      result.rulesEvaluated++;

      try {
        // Check if rule condition is met
        const conditionMet = rule.condition(ctx);
        if (!conditionMet) continue;

        // Check cooldown - has this rule triggered recently?
        const isOnCooldown = await this.isRuleOnCooldown(userId, rule);
        if (isOnCooldown) {
          this.logger.debug(`Rule ${rule.id} is on cooldown for user ${userId}`);
          continue;
        }

        // Check max displays
        if (rule.max_displays > 0) {
          const displayCount = await this.getRuleDisplayCount(userId, rule.id);
          if (displayCount >= rule.max_displays) {
            this.logger.debug(`Rule ${rule.id} has reached max displays for user ${userId}`);
            continue;
          }
        }

        // Generate the tip
        const tipData = rule.generateTip(ctx);

        // Calculate expiration date
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + rule.expiration_days);

        // Create the tip
        await this.tipModel.create({
          user_id: userId,
          title: tipData.title,
          content: tipData.content,
          action_text: tipData.action_text || null,
          action_route: tipData.action_route || null,
          category: rule.category,
          priority: rule.priority,
          source: TipSource.RULE_ENGINE,
          status: TipStatus.ACTIVE,
          rule_id: rule.id,
          icon: tipData.icon || this.getCategoryIcon(rule.category),
          generated_at: new Date(),
          expires_at: expiresAt,
          tags: tipData.tags || [],
          data_snapshot: this.createDataSnapshot(ctx, rule),
        });

        result.rulesTriggered++;
        result.tipsCreated++;
        result.triggeredRuleIds.push(rule.id);

        this.logger.debug(`Rule ${rule.id} triggered for user ${userId}`);
      } catch (error) {
        this.logger.error(`Error evaluating rule ${rule.id} for user ${userId}: ${error.message}`);
      }
    }

    return result;
  }

  private async isRuleOnCooldown(userId: Types.ObjectId, rule: HealthRule): Promise<boolean> {
    const cooldownStart = new Date();
    cooldownStart.setDate(cooldownStart.getDate() - rule.cooldown_days);

    const recentTip = await this.tipModel.findOne({
      user_id: userId,
      rule_id: rule.id,
      generated_at: { $gte: cooldownStart },
    });

    return !!recentTip;
  }

  private async getRuleDisplayCount(userId: Types.ObjectId, ruleId: string): Promise<number> {
    const tips = await this.tipModel.find({
      user_id: userId,
      rule_id: ruleId,
      status: { $ne: TipStatus.EXPIRED },
    });

    return tips.reduce((sum, tip) => sum + (tip.display_count || 0), 0);
  }

  private getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      vitals: 'hi-heart',
      lifestyle: 'hi-user',
      nutrition: 'hi-cake',
      fitness: 'hi-lightning-bolt',
      mental_health: 'hi-emoji-happy',
      preventive_care: 'hi-shield-check',
      chronic_condition: 'hi-clipboard-list',
      medication: 'hi-collection',
      sleep: 'hi-moon',
      hydration: 'hi-beaker',
    };
    return icons[category] || 'hi-light-bulb';
  }

  private createDataSnapshot(ctx: HealthDataContext, rule: HealthRule): Record<string, any> {
    // Create a minimal snapshot of relevant data for debugging/audit
    const snapshot: Record<string, any> = {
      rule_id: rule.id,
      evaluated_at: new Date(),
    };

    // Include relevant data based on rule category
    if (ctx.vitals.blood_pressure) {
      snapshot.blood_pressure = ctx.vitals.blood_pressure;
    }
    if (ctx.vitals.blood_sugar) {
      snapshot.blood_sugar = ctx.vitals.blood_sugar;
    }
    if (ctx.bmi) {
      snapshot.bmi = ctx.bmi;
    }
    if (ctx.days_since_last_vitals !== null) {
      snapshot.days_since_last_vitals = ctx.days_since_last_vitals;
    }

    return snapshot;
  }
}
