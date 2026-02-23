import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { HealthIntegrationsController } from './health-integrations.controller';
import { HealthIntegrationsWebhookController } from './health-integrations-webhook.controller';
import { DebugController } from './debug.controller';
import { HealthIntegrationsService } from './health-integrations.service';
import { HealthIntegrationsScheduler } from './health-integrations.scheduler';
import { HealthIntegration, HealthIntegrationSchema } from './schemas/health-integration.schema';
import { HealthData, HealthDataSchema } from './schemas/health-data.schema';
import { SyncLog, SyncLogSchema } from './schemas/sync-log.schema';
import { OWUserMapping, OWUserMappingSchema } from './schemas/ow-user-mapping.schema';
import { UsersModule } from '../users/users.module';
import { VitalsModule } from '../vitals/vitals.module';
import { HttpModule } from '@nestjs/axios';

// Direct providers
import { ProviderRegistry } from './providers/provider.registry';
import { GoogleFitProvider } from './providers/google-fit.provider';
import { SamsungHealthProvider } from './providers/samsung-health.provider';
import { AppleHealthProvider } from './providers/apple-health.provider';

// Open Wearables providers
import { OWClientService } from './providers/ow/ow-client.service';
import { GarminProvider } from './providers/ow/garmin.provider';
import { PolarProvider } from './providers/ow/polar.provider';
import { SuuntoProvider } from './providers/ow/suunto.provider';
import { WhoopProvider } from './providers/ow/whoop.provider';

import { WebsocketGateway } from '../../core/websocket/websocket.gateway';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: HealthIntegration.name, schema: HealthIntegrationSchema },
      { name: HealthData.name, schema: HealthDataSchema },
      { name: SyncLog.name, schema: SyncLogSchema },
      { name: OWUserMapping.name, schema: OWUserMappingSchema },
    ]),
    HttpModule,
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 30 }]),
    UsersModule,
    VitalsModule,
  ],
  controllers: [
    HealthIntegrationsController,
    HealthIntegrationsWebhookController,
    DebugController,
  ],
  providers: [
    HealthIntegrationsService,
    HealthIntegrationsScheduler,
    ProviderRegistry,
    // Direct providers
    GoogleFitProvider,
    SamsungHealthProvider,
    AppleHealthProvider,
    // Open Wearables
    OWClientService,
    GarminProvider,
    PolarProvider,
    SuuntoProvider,
    WhoopProvider,
    WebsocketGateway,
  ],
  exports: [HealthIntegrationsService, ProviderRegistry],
})
export class HealthIntegrationsModule {}
