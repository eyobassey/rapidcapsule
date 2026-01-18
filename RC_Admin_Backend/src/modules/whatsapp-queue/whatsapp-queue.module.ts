import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WhatsAppQueueController } from './whatsapp-queue.controller';
import { WhatsAppQueueService } from './whatsapp-queue.service';
import {
  WhatsAppPrescriptionQueue,
  WhatsAppPrescriptionQueueSchema,
} from './whatsapp-prescription-queue.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WhatsAppPrescriptionQueue.name, schema: WhatsAppPrescriptionQueueSchema },
    ]),
  ],
  controllers: [WhatsAppQueueController],
  providers: [WhatsAppQueueService],
  exports: [WhatsAppQueueService],
})
export class WhatsAppQueueModule {}
