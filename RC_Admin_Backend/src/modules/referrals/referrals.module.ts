import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReferralsService } from './referrals.service';
import { ReferralsController } from './referrals.controller';
import { Referral, ReferralSchema } from './entities/referral.entity';
import { ReferralClick, ReferralClickSchema } from './entities/referral-click.entity';
import { ReferralSettings, ReferralSettingsSchema } from './entities/referral-settings.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Referral.name, schema: ReferralSchema },
      { name: ReferralClick.name, schema: ReferralClickSchema },
      { name: ReferralSettings.name, schema: ReferralSettingsSchema },
    ]),
  ],
  controllers: [ReferralsController],
  providers: [ReferralsService],
  exports: [ReferralsService],
})
export class ReferralsModule {}
