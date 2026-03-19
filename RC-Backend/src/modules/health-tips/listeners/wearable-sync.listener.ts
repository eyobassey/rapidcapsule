import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { HealthInsightsTriggerService } from '../services/insight-trigger.service';

@Injectable()
export class WearableSyncInsightListener {
  private readonly logger = new Logger(WearableSyncInsightListener.name);

  constructor(private readonly triggerService: HealthInsightsTriggerService) {}

  @OnEvent('health_data.synced')
  async handleDataSynced(payload: { userId: string; provider: string; dataTypes: string[] }): Promise<void> {
    try {
      await this.triggerService.onWearableSyncCompleted(payload.userId, payload.provider, payload.dataTypes);
    } catch (error) {
      this.logger.error(`Error handling health_data.synced: ${error.message}`);
    }
  }
}
