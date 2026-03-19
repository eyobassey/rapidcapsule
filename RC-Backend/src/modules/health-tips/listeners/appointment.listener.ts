import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { HealthInsightsTriggerService } from '../services/insight-trigger.service';

@Injectable()
export class AppointmentInsightListener {
  private readonly logger = new Logger(AppointmentInsightListener.name);

  constructor(private readonly triggerService: HealthInsightsTriggerService) {}

  @OnEvent('appointment.completed')
  async handleAppointmentCompleted(payload: { userId: string; appointmentId: string }): Promise<void> {
    try {
      await this.triggerService.onAppointmentCompleted(payload.userId, payload.appointmentId);
    } catch (error) {
      this.logger.error(`Error handling appointment.completed: ${error.message}`);
    }
  }
}
