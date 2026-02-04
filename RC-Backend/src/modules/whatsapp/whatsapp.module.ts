import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

// Entities
import {
  WhatsAppIdentity,
  WhatsAppIdentitySchema,
} from './entities/whatsapp-identity.entity';
import {
  WhatsAppSession,
  WhatsAppSessionSchema,
} from './entities/whatsapp-session.entity';
import {
  WhatsAppAuditLog,
  WhatsAppAuditLogSchema,
} from './entities/whatsapp-audit-log.entity';
import {
  WhatsAppRateLimit,
  WhatsAppRateLimitSchema,
} from './entities/whatsapp-rate-limit.entity';
import {
  WhatsAppPrescriptionQueue,
  WhatsAppPrescriptionQueueSchema,
} from './entities/whatsapp-prescription-queue.entity';
import {
  PharmacyOrder,
  PharmacyOrderSchema,
} from '../pharmacy/entities/pharmacy-order.entity';
import {
  PatientPrescriptionUpload,
  PatientPrescriptionUploadSchema,
} from '../pharmacy/entities/patient-prescription-upload.entity';

// Import other modules we need
import { PharmacyModule } from '../pharmacy/pharmacy.module';
import { UsersModule } from '../users/users.module';
import { WalletsModule } from '../wallets/wallets.module';
import { AdminSettingsModule } from '../admin-settings/admin-settings.module';
import { WebhooksModule } from '../webhooks/webhooks.module';

// Payment
import { PaymentHandler } from '../../common/external/payment/payment.handler';
import { Paystack } from '../../common/external/payment/providers/paystack';

// WhatsApp Provider
import { GupshupService } from '../../common/external/gupshup/gupshup.service';

// Helpers
import { GeneralHelpers } from '../../common/helpers/general.helpers';

// Services
import { WhatsAppIdentityService } from './services/whatsapp-identity.service';
import { WhatsAppSessionService } from './services/whatsapp-session.service';
import { WhatsAppRateLimiterService } from './services/whatsapp-rate-limiter.service';
import { WhatsAppAuditService } from './services/whatsapp-audit.service';
import { WhatsAppTwilioService } from './services/whatsapp-twilio.service';
import { WhatsAppFlowService } from './services/whatsapp-flow.service';
import { WhatsAppNotificationService } from './services/whatsapp-notification.service';
import { WhatsAppQueueService } from './services/whatsapp-queue.service';

// Flow Handlers
import {
  VerificationFlowHandler,
  AccountLinkFlowHandler,
} from './handlers/verification-flow.handler';
import { PrescriptionFlowHandler } from './handlers/prescription-flow.handler';
import { OrderFlowHandler } from './handlers/order-flow.handler';
import { PharmacistChatHandler } from './handlers/pharmacist-chat.handler';

// Controllers
import { WhatsAppWebhookController } from './controllers/whatsapp-webhook.controller';
import { WhatsAppQueueController } from './controllers/whatsapp-queue.controller';
import { WhatsAppPaymentWebhookController } from './controllers/whatsapp-payment-webhook.controller';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: WhatsAppIdentity.name, schema: WhatsAppIdentitySchema },
      { name: WhatsAppSession.name, schema: WhatsAppSessionSchema },
      { name: WhatsAppAuditLog.name, schema: WhatsAppAuditLogSchema },
      { name: WhatsAppRateLimit.name, schema: WhatsAppRateLimitSchema },
      { name: WhatsAppPrescriptionQueue.name, schema: WhatsAppPrescriptionQueueSchema },
      { name: PharmacyOrder.name, schema: PharmacyOrderSchema },
      { name: PatientPrescriptionUpload.name, schema: PatientPrescriptionUploadSchema },
    ]),
    HttpModule,
    forwardRef(() => PharmacyModule),
    forwardRef(() => UsersModule),
    forwardRef(() => WalletsModule),
    forwardRef(() => WebhooksModule),
    AdminSettingsModule,
  ],
  controllers: [
    WhatsAppWebhookController,
    WhatsAppQueueController,
    WhatsAppPaymentWebhookController,
  ],
  providers: [
    // Helpers
    GeneralHelpers,
    // Payment
    PaymentHandler,
    Paystack,
    // WhatsApp Provider
    GupshupService,
    // Services
    WhatsAppIdentityService,
    WhatsAppSessionService,
    WhatsAppRateLimiterService,
    WhatsAppAuditService,
    WhatsAppTwilioService,
    WhatsAppFlowService,
    WhatsAppNotificationService,
    WhatsAppQueueService,
    // Flow Handlers
    VerificationFlowHandler,
    AccountLinkFlowHandler,
    PrescriptionFlowHandler,
    OrderFlowHandler,
    PharmacistChatHandler,
  ],
  exports: [
    // Export services that other modules might need
    WhatsAppIdentityService,
    WhatsAppSessionService,
    WhatsAppRateLimiterService,
    WhatsAppAuditService,
    WhatsAppTwilioService,
    WhatsAppFlowService,
    WhatsAppNotificationService,
    WhatsAppQueueService,
  ],
})
export class WhatsAppModule {}
