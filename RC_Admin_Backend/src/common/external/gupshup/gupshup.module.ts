import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GupshupService } from './gupshup.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [GupshupService],
  exports: [GupshupService],
})
export class GupshupModule {}
