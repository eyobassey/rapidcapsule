import { Module, forwardRef } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './entities/user.entity';
import { FileUploadHelper } from '../../common/helpers/file-upload.helpers';
import { TokensModule } from '../tokens/tokens.module';
import { GeneralHelpers } from '../../common/helpers/general.helpers';
import { UserSettingsModule } from '../user-settings/user-settings.module';
import { TaskScheduler } from '../../core/worker/task.scheduler';
import { SchedulerRegistry } from '@nestjs/schedule';
import {
  SpecialistPreferences,
  SpecialistPreferencesSchema,
} from './entities/specialist-preferences.entity';
import { ReferralsModule } from '../referrals/referrals.module';
import { WalletsModule } from "../wallets/wallets.module";
import { BasicHealthScoreModule } from '../basic-health-score/basic-health-score.module';

@Module({
  imports: [
    TokensModule,
    WalletsModule,
    UserSettingsModule,
    ReferralsModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: SpecialistPreferences.name, schema: SpecialistPreferencesSchema },
    ]),
    forwardRef(() => BasicHealthScoreModule),
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    FileUploadHelper,
    GeneralHelpers,
    TaskScheduler,
    SchedulerRegistry,
  ],
  exports: [MongooseModule, UsersService],
})
export class UsersModule {}
