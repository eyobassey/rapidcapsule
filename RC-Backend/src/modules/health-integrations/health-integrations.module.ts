import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HealthIntegrationsController } from './health-integrations.controller';
import { DebugController } from './debug.controller';
import { HealthIntegrationsService } from './health-integrations.service';
import { HealthIntegration, HealthIntegrationSchema } from './schemas/health-integration.schema';
import { HealthData, HealthDataSchema } from './schemas/health-data.schema';
import { UsersModule } from '../users/users.module';
import { VitalsModule } from '../vitals/vitals.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: HealthIntegration.name, schema: HealthIntegrationSchema },
      { name: HealthData.name, schema: HealthDataSchema },
    ]),
    HttpModule,
    UsersModule,
    VitalsModule,
  ],
  controllers: [HealthIntegrationsController, DebugController],
  providers: [HealthIntegrationsService],
  exports: [HealthIntegrationsService],
})
export class HealthIntegrationsModule {}