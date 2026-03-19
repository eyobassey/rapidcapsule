import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { HealthInsightsTriggerService } from '../services/insight-trigger.service';

@Injectable()
export class PrescriptionInsightListener {
  private readonly logger = new Logger(PrescriptionInsightListener.name);

  constructor(private readonly triggerService: HealthInsightsTriggerService) {}

  @OnEvent('prescription.created')
  async handlePrescriptionCreated(payload: { userId: string; prescriptionId: string }): Promise<void> {
    try {
      await this.triggerService.onPrescriptionCreated(payload.userId, payload.prescriptionId);
    } catch (error) {
      this.logger.error(`Error handling prescription.created: ${error.message}`);
    }
  }
}
