import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TrialAdminController } from './trial-admin.controller';
import { TrialAdminService } from './trial-admin.service';
import { TrialSettings, TrialSettingsSchema } from './entities/trial-settings.entity';
import { TrialSession, TrialSessionSchema } from './entities/trial-session.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TrialSettings.name, schema: TrialSettingsSchema },
      { name: TrialSession.name, schema: TrialSessionSchema },
    ]),
  ],
  controllers: [TrialAdminController],
  providers: [TrialAdminService],
})
export class TrialAdminModule {}
