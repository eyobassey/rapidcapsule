import { Module } from '@nestjs/common';
import { ReferralsService } from './referrals.service';
import { ReferralsController, ReferralRedirectController } from './referrals.controller';
import { MongooseModule } from '@nestjs/mongoose';
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
  controllers: [ReferralsController, ReferralRedirectController],
  providers: [ReferralsService],
  exports: [ReferralsService],
})
export class ReferralsModule {}
