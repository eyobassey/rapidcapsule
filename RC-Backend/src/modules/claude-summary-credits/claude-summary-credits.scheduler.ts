import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ClaudeSummaryCreditsService } from './claude-summary-credits.service';

@Injectable()
export class ClaudeSummaryCreditsScheduler {
  private readonly logger = new Logger(ClaudeSummaryCreditsScheduler.name);

  constructor(private readonly creditsService: ClaudeSummaryCreditsService) {}

  /**
   * Run at midnight on the 1st of every month to reset free credits
   * Cron: 0 0 1 * *
   */
  @Cron('0 0 1 * *')
  async handleMonthlyCreditsReset(): Promise<void> {
    this.logger.log('Starting monthly free credits reset job...');

    try {
      const result = await this.creditsService.resetMonthlyFreeCreditsForAll();
      this.logger.log(`Monthly credits reset completed. Users reset: ${result.users_reset}`);
    } catch (error) {
      this.logger.error(`Monthly credits reset job failed: ${error.message}`, error.stack);
    }
  }

  /**
   * Run every day at midnight to expire unlimited subscriptions
   * Checks for subscriptions that have passed their expiry date
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleSubscriptionExpiry(): Promise<void> {
    this.logger.log('Starting daily subscription expiry check...');

    try {
      const result = await this.creditsService.expireUnlimitedSubscriptionsForAll();
      this.logger.log(`Subscription expiry check completed. Expired: ${result.expired_count}`);
    } catch (error) {
      this.logger.error(`Subscription expiry job failed: ${error.message}`, error.stack);
    }
  }
}
