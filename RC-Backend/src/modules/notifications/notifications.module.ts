import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Entity
import { Notification, NotificationSchema } from './entities/notification.entity';

// Services
import { NotificationsService } from './notifications.service';
import { NotificationOrchestratorService } from './services/notification-orchestrator.service';

// Controller & Gateway
import { NotificationsController } from './notifications.controller';
import { NotificationsGateway } from './notifications.gateway';

// Listeners
import { AppointmentListener } from './listeners/appointment.listener';
import { PrescriptionListener } from './listeners/prescription.listener';
import { PaymentListener } from './listeners/payment.listener';
import { HealthCheckupListener } from './listeners/health-checkup.listener';

// External modules
import { UsersModule } from '../users/users.module';
import { UserSettingsModule } from '../user-settings/user-settings.module';
import { CommonModule } from '../../common/common.module';
import { GeneralHelpers } from '../../common/helpers/general.helpers';

// Entities from other modules (for orchestrator service)
import { User, UserSchema } from '../users/entities/user.entity';
import { UserSetting, UserSettingSchema } from '../user-settings/entities/user-setting.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
      { name: User.name, schema: UserSchema },
      { name: UserSetting.name, schema: UserSettingSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '24h' },
      }),
      inject: [ConfigService],
    }),
    forwardRef(() => UsersModule),
    forwardRef(() => UserSettingsModule),
    CommonModule,
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsGateway,
    NotificationsService,
    NotificationOrchestratorService,
    AppointmentListener,
    PrescriptionListener,
    PaymentListener,
    HealthCheckupListener,
    GeneralHelpers,
  ],
  exports: [
    NotificationsService,
    NotificationOrchestratorService,
    NotificationsGateway,
  ],
})
export class NotificationsModule {}
