import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { HealthInsightsTriggerService } from '../services/insight-trigger.service';

@Injectable()
export class VitalsInsightListener {
  private readonly logger = new Logger(VitalsInsightListener.name);

  constructor(private readonly triggerService: HealthInsightsTriggerService) {}

  @OnEvent('vitals.logged')
  async handleVitalsLogged(payload: { userId: string; vitalTypes: string[] }): Promise<void> {
    try {
      await this.triggerService.onVitalsLogged(payload.userId, payload.vitalTypes);
    } catch (error) {
      this.logger.error(`Error handling vitals.logged: ${error.message}`);
    }
  }
}
