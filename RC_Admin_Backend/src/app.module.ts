import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PatientsModule } from './modules/patients/patients.module';
import * as dotenv from 'dotenv';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { SpecialistsModule } from './modules/specialists/specialists.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { SettingsModule } from './modules/settings/settings.module';
import { PlansModule } from './modules/plans/plans.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { PharmacyModule } from './modules/pharmacy/pharmacy.module';
import { WhatsAppQueueModule } from './modules/whatsapp-queue/whatsapp-queue.module';
import { GupshupModule } from './common/external/gupshup';
import { ClaudeSummaryModule } from './modules/claude-summary/claude-summary.module';
import { AdvancedHealthScoreAdminModule } from './modules/advanced-health-score/advanced-health-score-admin.module';
import { ReferralsModule } from './modules/referrals/referrals.module';

dotenv.config();
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    MongooseModule.forRoot(<string>process.env.MONGO_URL),
    AuthModule,
    UsersModule,
    PatientsModule,
    SpecialistsModule,
    AppointmentsModule,
    DashboardModule,
    AnalyticsModule,
    SettingsModule,
    PlansModule,
    CategoriesModule,
    PharmacyModule,
    WhatsAppQueueModule,
    GupshupModule,
    ClaudeSummaryModule,
    AdvancedHealthScoreAdminModule,
    ReferralsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
