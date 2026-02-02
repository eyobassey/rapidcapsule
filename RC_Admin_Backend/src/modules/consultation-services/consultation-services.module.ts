import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConsultationServicesService } from './consultation-services.service';
import { ConsultationServicesController } from './consultation-services.controller';
import { ConsultationService, ConsultationServiceSchema } from './entities/consultation-service.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ConsultationService.name, schema: ConsultationServiceSchema },
    ]),
  ],
  controllers: [ConsultationServicesController],
  providers: [ConsultationServicesService],
  exports: [ConsultationServicesService],
})
export class ConsultationServicesModule {}
