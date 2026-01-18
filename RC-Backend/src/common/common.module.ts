import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Counter, CounterSchema } from './entities/counter.entity';
import { PrescriptionNumberHelper } from './helpers/prescription-number.helper';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Counter.name, schema: CounterSchema },
    ]),
  ],
  providers: [PrescriptionNumberHelper],
  exports: [PrescriptionNumberHelper, MongooseModule],
})
export class CommonModule {}
