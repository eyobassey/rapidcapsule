import { Module } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { WebhooksController } from './webhooks.controller';
import { ZoomWebhookController } from './controllers/zoom-webhook.controller';
import { ZoomWebhookService } from './services/zoom-webhook.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Webhook, WebhookSchema } from './entities/webhook.entity';
import { ZoomWebhook, ZoomWebhookSchema } from './entities/zoom-webhook.entity';
import {
  Appointment,
  AppointmentSchema,
} from '../appointments/entities/appointment.entity';
import { PaymentsModule } from '../payments/payments.module';
import { CardsModule } from '../cards/cards.module';
import { WalletsModule } from '../wallets/wallets.module';
import { TaskScheduler } from '../../core/worker/task.scheduler';
import { SchedulerRegistry } from '@nestjs/schedule';
import { WebsocketGateway } from '../../core/websocket/websocket.gateway';
import { Zoom } from '../../common/external/zoom/zoom';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Webhook.name, schema: WebhookSchema },
      { name: ZoomWebhook.name, schema: ZoomWebhookSchema },
      { name: Appointment.name, schema: AppointmentSchema },
    ]),
    PaymentsModule,
    CardsModule,
    WalletsModule,
  ],
  controllers: [WebhooksController, ZoomWebhookController],
  providers: [
    WebhooksService,
    ZoomWebhookService,
    TaskScheduler,
    SchedulerRegistry,
    WebsocketGateway,
    Zoom,
  ],
})
export class WebhooksModule {}
