import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { RiskScoringService } from '../services/risk-scoring.service';

@Injectable()
export class RiskRecalculationScheduler {
  private readonly logger = new Logger(RiskRecalculationScheduler.name);

  constructor(private riskScoringService: RiskScoringService) {}

  /**
   * Daily batch recalculation at 2:00 AM UTC.
   * Catches edge cases the event-driven triggers miss:
   * - Patients who stopped logging (behavioral disengagement)
   * - Missed appointment flags that updated async
   * - Stale screening scores
   * - Vitals changes from wearable sync
   */
  @Cron('0 0 2 * * *')
  async handleDailyRecalculation(): Promise<void> {
    this.logger.log('Starting daily risk recalculation batch...');
    const startTime = Date.now();

    try {
      const { processed, errors } =
        await this.riskScoringService.batchRecalculate();
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);

      this.logger.log(
        `Daily risk recalculation complete: ${processed} processed, ${errors} errors (${duration}s)`,
      );
    } catch (error) {
      this.logger.error(
        `Daily risk recalculation failed: ${error.message}`,
        error.stack,
      );
    }
  }
}
