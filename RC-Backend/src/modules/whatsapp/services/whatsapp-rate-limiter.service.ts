import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  WhatsAppRateLimit,
  WhatsAppRateLimitDocument,
} from '../entities/whatsapp-rate-limit.entity';
import { RATE_LIMITS, RateLimitConfig } from '../constants/rate-limits.constant';

export interface RateLimitResult {
  allowed: boolean;
  reason?: string;
  retry_after?: Date;
  message?: string;
  remaining?: number;
}

export interface AbusePattern {
  pattern: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  details: string;
}

@Injectable()
export class WhatsAppRateLimiterService {
  private readonly logger = new Logger(WhatsAppRateLimiterService.name);

  constructor(
    @InjectModel(WhatsAppRateLimit.name)
    private rateLimitModel: Model<WhatsAppRateLimitDocument>,
  ) {}

  /**
   * Check if action is within rate limits
   */
  async checkRateLimit(action: string, whatsappNumber: string): Promise<RateLimitResult> {
    const limits = RATE_LIMITS[action];
    if (!limits) {
      return { allowed: true };
    }

    const now = new Date();

    // Check per-number daily limit
    if (limits.per_number_per_day) {
      const dayKey = this.getDayKey(action, whatsappNumber, now);
      const dayCount = await this.getCount(dayKey);

      if (dayCount >= limits.per_number_per_day) {
        return {
          allowed: false,
          reason: 'DAILY_LIMIT_EXCEEDED',
          retry_after: this.getNextDayStart(now),
          message: `You've reached the daily limit (${limits.per_number_per_day}) for this action. Please try again tomorrow.`,
          remaining: 0,
        };
      }
    }

    // Check per-number hourly limit
    if (limits.per_number_per_hour) {
      const hourKey = this.getHourKey(action, whatsappNumber, now);
      const hourCount = await this.getCount(hourKey);

      if (hourCount >= limits.per_number_per_hour) {
        const nextHour = this.getNextHourStart(now);
        const minutesRemaining = Math.ceil((nextHour.getTime() - now.getTime()) / 60000);
        return {
          allowed: false,
          reason: 'HOURLY_LIMIT_EXCEEDED',
          retry_after: nextHour,
          message: `Too many requests. Please wait ${minutesRemaining} minutes before trying again.`,
          remaining: 0,
        };
      }
    }

    // Check per-minute limit (for spam prevention)
    if (limits.per_minute) {
      const minuteKey = this.getMinuteKey(action, whatsappNumber, now);
      const minuteCount = await this.getCount(minuteKey);

      if (minuteCount >= limits.per_minute) {
        return {
          allowed: false,
          reason: 'MINUTE_LIMIT_EXCEEDED',
          retry_after: new Date(now.getTime() + 60000),
          message: 'Please slow down. Try again in a minute.',
          remaining: 0,
        };
      }
    }

    // Check weekly limit (for controlled substances)
    if (limits.per_number_per_week) {
      const weekKey = this.getWeekKey(action, whatsappNumber, now);
      const weekCount = await this.getCount(weekKey);

      if (weekCount >= limits.per_number_per_week) {
        return {
          allowed: false,
          reason: 'WEEKLY_LIMIT_EXCEEDED',
          retry_after: this.getNextWeekStart(now),
          message: `Weekly limit reached for this type of request. Please try again next week.`,
          remaining: 0,
        };
      }
    }

    // Calculate remaining
    let remaining: number | undefined;
    if (limits.per_number_per_day) {
      const dayKey = this.getDayKey(action, whatsappNumber, now);
      const dayCount = await this.getCount(dayKey);
      remaining = limits.per_number_per_day - dayCount;
    }

    return { allowed: true, remaining };
  }

  /**
   * Record an action for rate limiting
   */
  async recordAction(action: string, whatsappNumber: string): Promise<void> {
    const now = new Date();
    const limits = RATE_LIMITS[action];

    if (!limits) return;

    // Always record for pattern detection
    const promises: Promise<void>[] = [];

    // Increment daily counter
    if (limits.per_number_per_day) {
      const dayKey = this.getDayKey(action, whatsappNumber, now);
      promises.push(this.incrementCounter(dayKey, 'day', now));
    }

    // Increment hourly counter
    if (limits.per_number_per_hour) {
      const hourKey = this.getHourKey(action, whatsappNumber, now);
      promises.push(this.incrementCounter(hourKey, 'hour', now));
    }

    // Increment minute counter
    if (limits.per_minute) {
      const minuteKey = this.getMinuteKey(action, whatsappNumber, now);
      promises.push(this.incrementCounter(minuteKey, 'minute', now));
    }

    // Increment weekly counter
    if (limits.per_number_per_week) {
      const weekKey = this.getWeekKey(action, whatsappNumber, now);
      promises.push(this.incrementCounter(weekKey, 'week', now));
    }

    await Promise.all(promises);
  }

  /**
   * Detect abuse patterns
   */
  async detectAbusePatterns(whatsappNumber: string): Promise<AbusePattern[]> {
    const patterns: AbusePattern[] = [];
    const now = new Date();

    // Pattern 1: Rapid prescription uploads (3+ in last hour)
    const prescriptionHourKey = this.getHourKey('PRESCRIPTION_UPLOAD', whatsappNumber, now);
    const prescriptionCount = await this.getCount(prescriptionHourKey);
    if (prescriptionCount >= 3) {
      patterns.push({
        pattern: 'RAPID_PRESCRIPTION_UPLOADS',
        severity: 'HIGH',
        details: `${prescriptionCount} prescription uploads in the last hour`,
      });
    }

    // Pattern 2: Multiple verification failures
    const verificationHourKey = this.getHourKey('VERIFICATION_ATTEMPT', whatsappNumber, now);
    const verificationCount = await this.getCount(verificationHourKey);
    if (verificationCount >= 5) {
      patterns.push({
        pattern: 'MULTIPLE_VERIFICATION_FAILURES',
        severity: 'MEDIUM',
        details: `${verificationCount} verification attempts in the last hour`,
      });
    }

    // Pattern 3: Frequent controlled substance requests
    const controlledWeekKey = this.getWeekKey('CONTROLLED_SUBSTANCE', whatsappNumber, now);
    const controlledCount = await this.getCount(controlledWeekKey);
    if (controlledCount >= 2) {
      patterns.push({
        pattern: 'FREQUENT_CONTROLLED_REQUESTS',
        severity: 'CRITICAL',
        details: `${controlledCount} controlled substance requests this week`,
      });
    }

    // Pattern 4: High message volume (potential spam)
    const messageHourKey = this.getHourKey('MESSAGES', whatsappNumber, now);
    const messageCount = await this.getCount(messageHourKey);
    if (messageCount >= 150) {
      patterns.push({
        pattern: 'HIGH_MESSAGE_VOLUME',
        severity: 'MEDIUM',
        details: `${messageCount} messages in the last hour`,
      });
    }

    // Pattern 5: Multiple high-value orders
    const highValueDayKey = this.getDayKey('HIGH_VALUE_ORDER', whatsappNumber, now);
    const highValueCount = await this.getCount(highValueDayKey);
    if (highValueCount >= 2) {
      patterns.push({
        pattern: 'MULTIPLE_HIGH_VALUE_ORDERS',
        severity: 'HIGH',
        details: `${highValueCount} high-value orders today`,
      });
    }

    if (patterns.length > 0) {
      this.logger.warn(`Abuse patterns detected for ${whatsappNumber}:`, patterns);
    }

    return patterns;
  }

  /**
   * Check if user should be blocked based on patterns
   */
  async shouldBlockUser(whatsappNumber: string): Promise<{
    shouldBlock: boolean;
    reason?: string;
    duration?: number;
  }> {
    const patterns = await this.detectAbusePatterns(whatsappNumber);

    // Block if any critical pattern
    const criticalPattern = patterns.find((p) => p.severity === 'CRITICAL');
    if (criticalPattern) {
      return {
        shouldBlock: true,
        reason: `Critical abuse pattern: ${criticalPattern.pattern}`,
        duration: 72, // 72 hours
      };
    }

    // Block if multiple high severity patterns
    const highPatterns = patterns.filter((p) => p.severity === 'HIGH');
    if (highPatterns.length >= 2) {
      return {
        shouldBlock: true,
        reason: `Multiple abuse patterns: ${highPatterns.map((p) => p.pattern).join(', ')}`,
        duration: 24, // 24 hours
      };
    }

    return { shouldBlock: false };
  }

  /**
   * Get current count for a key
   */
  private async getCount(key: string): Promise<number> {
    const record = await this.rateLimitModel.findOne({ key });
    return record?.count || 0;
  }

  /**
   * Increment counter for a key
   */
  private async incrementCounter(
    key: string,
    windowType: 'minute' | 'hour' | 'day' | 'week',
    now: Date,
  ): Promise<void> {
    const { windowStart, windowEnd } = this.getWindowBounds(windowType, now);

    await this.rateLimitModel.updateOne(
      { key },
      {
        $inc: { count: 1 },
        $push: { timestamps: now },
        $setOnInsert: {
          window_start: windowStart,
          window_end: windowEnd,
        },
      },
      { upsert: true },
    );
  }

  /**
   * Get window boundaries
   */
  private getWindowBounds(
    windowType: 'minute' | 'hour' | 'day' | 'week',
    now: Date,
  ): { windowStart: Date; windowEnd: Date } {
    let windowStart: Date;
    let windowEnd: Date;

    switch (windowType) {
      case 'minute':
        windowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes());
        windowEnd = new Date(windowStart.getTime() + 60 * 1000);
        break;
      case 'hour':
        windowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());
        windowEnd = new Date(windowStart.getTime() + 60 * 60 * 1000);
        break;
      case 'day':
        windowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        windowEnd = new Date(windowStart.getTime() + 24 * 60 * 60 * 1000);
        break;
      case 'week':
        const dayOfWeek = now.getDay();
        const diff = now.getDate() - dayOfWeek;
        windowStart = new Date(now.getFullYear(), now.getMonth(), diff);
        windowStart.setHours(0, 0, 0, 0);
        windowEnd = new Date(windowStart.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
    }

    return { windowStart, windowEnd };
  }

  // Key generation helpers
  private getMinuteKey(action: string, number: string, date: Date): string {
    const minuteStr = date.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
    return `${action}:${number}:${minuteStr}`;
  }

  private getHourKey(action: string, number: string, date: Date): string {
    const hourStr = date.toISOString().slice(0, 13); // YYYY-MM-DDTHH
    return `${action}:${number}:${hourStr}`;
  }

  private getDayKey(action: string, number: string, date: Date): string {
    const dayStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    return `${action}:${number}:${dayStr}`;
  }

  private getWeekKey(action: string, number: string, date: Date): string {
    const year = date.getFullYear();
    const weekNumber = this.getWeekNumber(date);
    return `${action}:${number}:${year}-W${weekNumber}`;
  }

  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  private getNextDayStart(date: Date): Date {
    const next = new Date(date);
    next.setDate(next.getDate() + 1);
    next.setHours(0, 0, 0, 0);
    return next;
  }

  private getNextHourStart(date: Date): Date {
    const next = new Date(date);
    next.setHours(next.getHours() + 1, 0, 0, 0);
    return next;
  }

  private getNextWeekStart(date: Date): Date {
    const dayOfWeek = date.getDay();
    const daysUntilSunday = 7 - dayOfWeek;
    const next = new Date(date);
    next.setDate(next.getDate() + daysUntilSunday);
    next.setHours(0, 0, 0, 0);
    return next;
  }
}
