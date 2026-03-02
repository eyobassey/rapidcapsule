import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RecoveryAdminController } from './recovery-admin.controller';
import { RecoveryAdminService } from './recovery-admin.service';

import { RecoveryProfile, RecoveryProfileSchema } from './entities/recovery-profile.entity';
import { AddictionScreening, AddictionScreeningSchema } from './entities/addiction-screening.entity';
import { SobrietyLog, SobrietyLogSchema } from './entities/sobriety-log.entity';
import { RecoveryMilestone, RecoveryMilestoneSchema } from './entities/recovery-milestone.entity';
import { CrisisEvent, CrisisEventSchema } from './entities/crisis-event.entity';
import { RecoveryPlan, RecoveryPlanSchema } from './entities/recovery-plan.entity';
import { GroupSession, GroupSessionSchema } from './entities/group-session.entity';
import { RiskAssessmentReport, RiskAssessmentReportSchema } from './entities/risk-assessment-report.entity';
import { SuspiciousActivityLog, SuspiciousActivityLogSchema } from './entities/suspicious-activity-log.entity';
import { CopingExerciseSession, CopingExerciseSessionSchema } from './entities/coping-exercise-session.entity';
import { PeerAssignment, PeerAssignmentSchema } from './entities/peer-assignment.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RecoveryProfile.name, schema: RecoveryProfileSchema },
      { name: AddictionScreening.name, schema: AddictionScreeningSchema },
      { name: SobrietyLog.name, schema: SobrietyLogSchema },
      { name: RecoveryMilestone.name, schema: RecoveryMilestoneSchema },
      { name: CrisisEvent.name, schema: CrisisEventSchema },
      { name: RecoveryPlan.name, schema: RecoveryPlanSchema },
      { name: GroupSession.name, schema: GroupSessionSchema },
      { name: RiskAssessmentReport.name, schema: RiskAssessmentReportSchema },
      { name: SuspiciousActivityLog.name, schema: SuspiciousActivityLogSchema },
      { name: CopingExerciseSession.name, schema: CopingExerciseSessionSchema },
      { name: PeerAssignment.name, schema: PeerAssignmentSchema },
    ]),
  ],
  controllers: [RecoveryAdminController],
  providers: [RecoveryAdminService],
})
export class RecoveryAdminModule {}
