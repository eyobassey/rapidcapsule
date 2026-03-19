import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { HealthInsightsTriggerService } from '../services/insight-trigger.service';

@Injectable()
export class RecoveryInsightListener {
  private readonly logger = new Logger(RecoveryInsightListener.name);

  constructor(private readonly triggerService: HealthInsightsTriggerService) {}

  @OnEvent('recovery.checkin_logged')
  async handleCheckInLogged(payload: { userId: string }): Promise<void> {
    try {
      await this.triggerService.onRecoveryCheckIn(payload.userId);
    } catch (error) {
      this.logger.error(`Error handling recovery.checkin_logged: ${error.message}`);
    }
  }

  @OnEvent('recovery.screening_completed')
  async handleScreeningCompleted(payload: { userId: string }): Promise<void> {
    try {
      await this.triggerService.onRecoveryCheckIn(payload.userId);
    } catch (error) {
      this.logger.error(`Error handling recovery.screening_completed: ${error.message}`);
    }
  }
}
