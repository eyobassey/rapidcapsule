import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HealthIntegrationsAdminController } from './health-integrations-admin.controller';
import { HealthIntegrationsAdminService } from './health-integrations-admin.service';
import { HealthIntegration, HealthIntegrationSchema } from './entities/health-integration.entity';
import { SyncLog, SyncLogSchema } from './entities/sync-log.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: HealthIntegration.name, schema: HealthIntegrationSchema },
      { name: SyncLog.name, schema: SyncLogSchema },
    ]),
  ],
  controllers: [HealthIntegrationsAdminController],
  providers: [HealthIntegrationsAdminService],
})
export class HealthIntegrationsAdminModule {}
