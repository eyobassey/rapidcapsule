import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { HealthInsightsTriggerService } from '../services/insight-trigger.service';

@Injectable()
export class HealthCheckupInsightListener {
  private readonly logger = new Logger(HealthCheckupInsightListener.name);

  constructor(private readonly triggerService: HealthInsightsTriggerService) {}

  @OnEvent('health_checkup.completed')
  async handleCheckupCompleted(payload: { userId: string; checkupId: string }): Promise<void> {
    try {
      await this.triggerService.onHealthCheckupCompleted(payload.userId, payload.checkupId);
    } catch (error) {
      this.logger.error(`Error handling health_checkup.completed: ${error.message}`);
    }
  }
}
