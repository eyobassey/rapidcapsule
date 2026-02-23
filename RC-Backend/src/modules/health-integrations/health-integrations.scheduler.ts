import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  HealthIntegration,
  HealthIntegrationDocument,
  IntegrationStatus,
} from './schemas/health-integration.schema';
import { HealthIntegrationsService } from './health-integrations.service';
import { SyncType } from './schemas/sync-log.schema';
import { WebsocketGateway } from '../../core/websocket/websocket.gateway';

@Injectable()
export class HealthIntegrationsScheduler {
  private readonly logger = new Logger(HealthIntegrationsScheduler.name);

  constructor(
    @InjectModel(HealthIntegration.name)
    private healthIntegrationModel: Model<HealthIntegrationDocument>,
    private healthIntegrationsService: HealthIntegrationsService,
    private websocketGateway: WebsocketGateway,
  ) {}

  /**
   * Refresh tokens expiring within the next 5 minutes.
   * Runs every 15 minutes.
   */
  @Cron('*/15 * * * *')
  async refreshExpiredTokens() {
    this.logger.log('Running scheduled token refresh...');
    try {
      await this.healthIntegrationsService.refreshExpiredTokens();
    } catch (error) {
      this.logger.error(`Scheduled token refresh failed: ${error.message}`);
    }
  }

  /**
   * Sync high-frequency data (vitals: heart rate, blood pressure, glucose, temperature).
   * Runs every hour for integrations with hourly sync frequency.
   */
  @Cron('0 * * * *')
  async syncHourlyIntegrations() {
    this.logger.log('Running hourly health data sync...');
    await this.syncIntegrationsByFrequency('hourly');
  }

  /**
   * Sync lower-frequency data (activity: steps, calories, distance, sleep, weight).
   * Runs daily at 6:00 AM.
   */
  @Cron('0 6 * * *')
  async syncDailyIntegrations() {
    this.logger.log('Running daily health data sync...');
    await this.syncIntegrationsByFrequency('daily');
  }

  /**
   * Sync weekly data.
   * Runs every Monday at 6:00 AM.
   */
  @Cron('0 6 * * 1')
  async syncWeeklyIntegrations() {
    this.logger.log('Running weekly health data sync...');
    await this.syncIntegrationsByFrequency('weekly');
  }

  private async syncIntegrationsByFrequency(frequency: string) {
    const integrations = await this.healthIntegrationModel.find({
      status: IntegrationStatus.CONNECTED,
      isActive: true,
      'metadata.syncFrequency': frequency,
    });

    this.logger.log(`Found ${integrations.length} ${frequency} integrations to sync`);

    for (const integration of integrations) {
      try {
        // Notify user sync started
        this.emitToUser(integration.userId.toString(), 'health:sync:started', {
          provider: integration.provider,
        });

        const result = await this.syncWithRetry(integration, 3);

        // Notify user sync completed
        this.emitToUser(integration.userId.toString(), 'health:sync:completed', {
          provider: integration.provider,
          syncedCount: result.syncedCount,
          syncedToVitals: result.syncedToVitals,
        });
      } catch (error) {
        this.logger.error(
          `Scheduled sync failed for ${integration.provider} (user: ${integration.userId}) after retries: ${error.message}`,
        );

        // Notify user sync failed
        this.emitToUser(integration.userId.toString(), 'health:sync:failed', {
          provider: integration.provider,
          error: 'Sync failed after retries. Will retry on next schedule.',
        });
      }
    }
  }

  /**
   * Retry sync with exponential backoff.
   * Delays: 2s, 4s, 8s (base * 2^attempt)
   */
  private async syncWithRetry(
    integration: HealthIntegrationDocument,
    maxRetries: number,
  ) {
    let lastError: Error = new Error('Sync failed');

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.healthIntegrationsService.syncProviderData(
          integration,
          SyncType.SCHEDULED,
        );
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries) {
          const delay = 2000 * Math.pow(2, attempt);
          this.logger.warn(
            `Sync attempt ${attempt + 1} failed for ${integration.provider} (user: ${integration.userId}), retrying in ${delay}ms...`,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  private emitToUser(userId: string, event: string, data: any) {
    try {
      this.websocketGateway.server.to(userId).emit(event, data);
    } catch (error) {
      this.logger.warn(`Failed to emit ${event} to user ${userId}: ${error.message}`);
    }
  }
}
