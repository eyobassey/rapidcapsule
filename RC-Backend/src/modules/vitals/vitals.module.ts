import { Module, forwardRef } from '@nestjs/common';
import { VitalsService } from './vitals.service';
import { VitalsController } from './vitals.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Vital, VitalSchema } from './entities/vital.entity';
import { GeneralHelpers } from '../../common/helpers/general.helpers';
import { BasicHealthScoreModule } from '../basic-health-score/basic-health-score.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Vital.name, schema: VitalSchema }]),
    forwardRef(() => BasicHealthScoreModule),
  ],
  controllers: [VitalsController],
  providers: [VitalsService, GeneralHelpers],
  exports: [VitalsService],
})
export class VitalsModule {}
