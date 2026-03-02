import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  RecoveryProfile,
  RecoveryProfileDocument,
  RecoveryStatus as RecoveryProfileStatus,
} from '../entities/recovery-profile.entity';
import {
  RecoveryMilestone,
  RecoveryMilestoneDocument,
  MilestoneType,
} from '../entities/recovery-milestone.entity';
import {
  SobrietyLog,
  SobrietyLogDocument,
} from '../entities/sobriety-log.entity';
import {
  CopingExerciseSession,
  CopingExerciseSessionDocument,
} from '../entities/coping-exercise-session.entity';
import {
  RecoveryJournal,
  RecoveryJournalDocument,
} from '../entities/recovery-journal.entity';
import {
  RecoveryPlan,
  RecoveryPlanDocument,
} from '../entities/recovery-plan.entity';
import {
  AddictionScreening,
  AddictionScreeningDocument,
} from '../entities/addiction-screening.entity';
import {
  EkaConversation,
  EkaConversationDocument,
} from '../../eka/entities/eka-conversation.entity';

/**
 * Daily scheduler that checks all active recovery profiles against
 * milestone definitions and auto-awards milestones when criteria are met.
 */
@Injectable()
export class MilestoneCheckerScheduler {
  private readonly logger = new Logger(MilestoneCheckerScheduler.name);

  // Sobriety milestones in days
  private readonly SOBRIETY_MILESTONES = [
    { days: 1, name: '24 Hours Sober', points: 10 },
    { days: 3, name: '3 Days Sober', points: 20 },
    { days: 7, name: '1 Week Sober', points: 50 },
    { days: 14, name: '2 Weeks Sober', points: 75 },
    { days: 30, name: '1 Month Sober', points: 150 },
    { days: 60, name: '2 Months Sober', points: 200 },
    { days: 90, name: '90 Days Sober', points: 300 },
    { days: 180, name: '6 Months Sober', points: 500 },
    { days: 365, name: '1 Year Sober', points: 1000 },
    { days: 730, name: '2 Years Sober', points: 1500 },
  ];

  // Streak milestones
  private readonly STREAK_MILESTONES = [3, 7, 14, 30, 60, 90];

  // Goals achieved milestones (by total completed goals)
  private readonly GOALS_MILESTONES = [
    { count: 1, name: 'First Goal Completed', points: 25 },
    { count: 3, name: '3 Goals Completed', points: 50 },
    { count: 5, name: '5 Goals Completed', points: 100 },
    { count: 10, name: '10 Goals Completed', points: 200 },
    { count: 25, name: '25 Goals Completed', points: 500 },
  ];

  // Screening improvement milestones (by count of improved screenings)
  private readonly SCREENING_MILESTONES = [
    { count: 1, name: 'First Screening Completed', points: 15 },
    { count: 3, name: '3 Screenings Completed', points: 30 },
    { count: 5, name: '5 Screenings Completed', points: 75 },
    { count: 10, name: '10 Screenings Completed', points: 150 },
  ];

  // Companion session milestones (Eka recovery conversations)
  private readonly COMPANION_MILESTONES = [
    { count: 1, name: 'First Companion Session', points: 10 },
    { count: 5, name: '5 Companion Sessions', points: 30 },
    { count: 10, name: '10 Companion Sessions', points: 75 },
    { count: 25, name: '25 Companion Sessions', points: 150 },
    { count: 50, name: '50 Companion Sessions', points: 300 },
  ];

  constructor(
    @InjectModel(RecoveryProfile.name)
    private recoveryProfileModel: Model<RecoveryProfileDocument>,
    @InjectModel(RecoveryMilestone.name)
    private milestoneModel: Model<RecoveryMilestoneDocument>,
    @InjectModel(SobrietyLog.name)
    private sobrietyLogModel: Model<SobrietyLogDocument>,
    @InjectModel(CopingExerciseSession.name)
    private exerciseSessionModel: Model<CopingExerciseSessionDocument>,
    @InjectModel(RecoveryJournal.name)
    private journalModel: Model<RecoveryJournalDocument>,
    @InjectModel(RecoveryPlan.name)
    private planModel: Model<RecoveryPlanDocument>,
    @InjectModel(AddictionScreening.name)
    private screeningModel: Model<AddictionScreeningDocument>,
    @InjectModel(EkaConversation.name)
    private ekaConversationModel: Model<EkaConversationDocument>,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * Runs daily at 3:00 AM UTC (after risk recalculation at 2:00 AM).
   */
  @Cron('0 0 3 * * *')
  async handleDailyMilestoneCheck(): Promise<void> {
    this.logger.log('Starting daily milestone check...');
    const startTime = Date.now();
    let awarded = 0;
    let errors = 0;

    try {
      const activeProfiles = await this.recoveryProfileModel
        .find({
          status: { $in: [RecoveryProfileStatus.ACTIVE, RecoveryProfileStatus.COMPLETED] },
          deleted_at: { $exists: false },
        })
        .select('_id user sobriety_start_date')
        .lean();

      for (const profile of activeProfiles) {
        try {
          const count = await this.checkMilestonesForUser(profile);
          awarded += count;
        } catch (err) {
          errors++;
          this.logger.warn(
            `Milestone check failed for user ${profile.user}: ${err.message}`,
          );
        }
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      this.logger.log(
        `Milestone check complete: ${activeProfiles.length} profiles checked, ${awarded} milestones awarded, ${errors} errors (${duration}s)`,
      );
    } catch (error) {
      this.logger.error(
        `Milestone check failed: ${error.message}`,
        error.stack,
      );
    }
  }

  private async checkMilestonesForUser(profile: any): Promise<number> {
    const userId = profile.user;
    let awarded = 0;

    // Check sobriety milestones
    if (profile.sobriety_start_date) {
      const sobrietyDays = Math.floor(
        (Date.now() - new Date(profile.sobriety_start_date).getTime()) /
          (1000 * 60 * 60 * 24),
      );

      for (const milestone of this.SOBRIETY_MILESTONES) {
        if (sobrietyDays >= milestone.days) {
          const exists = await this.milestoneModel.exists({
            user: userId,
            milestone_type: MilestoneType.SOBRIETY_DAYS,
            milestone_value: milestone.days,
          });

          if (!exists) {
            await this.awardMilestone(userId, {
              milestone_type: MilestoneType.SOBRIETY_DAYS,
              milestone_name: milestone.name,
              description: `Achieved ${milestone.days} days of sobriety`,
              milestone_value: milestone.days,
              reward_points: milestone.points,
            });
            awarded++;
          }
        }
      }
    }

    // Check journal streaks
    awarded += await this.checkStreakMilestones(
      userId,
      this.journalModel,
      'created_at',
      MilestoneType.JOURNAL_STREAK,
      'Journal Entry Streak',
      'journal entries',
    );

    // Check exercise streaks
    awarded += await this.checkStreakMilestones(
      userId,
      this.exerciseSessionModel,
      'created_at',
      MilestoneType.EXERCISE_STREAK,
      'Exercise Streak',
      'exercises completed',
    );

    // Check goals achieved
    awarded += await this.checkGoalMilestones(userId);

    // Check screening completions
    awarded += await this.checkScreeningMilestones(userId);

    // Check companion (Eka recovery) sessions
    awarded += await this.checkCompanionMilestones(userId);

    return awarded;
  }

  private async checkStreakMilestones(
    userId: any,
    model: Model<any>,
    dateField: string,
    milestoneType: MilestoneType,
    namePrefix: string,
    unit: string,
  ): Promise<number> {
    let awarded = 0;

    // Get entries from last 100 days, sorted by date
    const entries = await model
      .find({
        user: userId,
        deleted_at: { $exists: false },
      })
      .sort({ [dateField]: -1 })
      .limit(100)
      .select(dateField)
      .lean();

    if (!entries.length) return 0;

    // Calculate current streak
    let streak = 1;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dates = entries.map((e) => {
      const d = new Date(e[dateField]);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    });

    // Remove duplicates (same day)
    const uniqueDates = [...new Set(dates)].sort((a, b) => b - a);

    // Check if the most recent entry is today or yesterday
    const mostRecent = uniqueDates[0];
    const dayDiff = Math.floor((today.getTime() - mostRecent) / (1000 * 60 * 60 * 24));
    if (dayDiff > 1) return 0; // Streak broken

    for (let i = 1; i < uniqueDates.length; i++) {
      const diff = Math.floor(
        (uniqueDates[i - 1] - uniqueDates[i]) / (1000 * 60 * 60 * 24),
      );
      if (diff === 1) {
        streak++;
      } else {
        break;
      }
    }

    // Check against streak milestones
    for (const target of this.STREAK_MILESTONES) {
      if (streak >= target) {
        const exists = await this.milestoneModel.exists({
          user: userId,
          milestone_type: milestoneType,
          milestone_value: target,
        });

        if (!exists) {
          const points = target <= 7 ? target * 10 : target * 5;
          await this.awardMilestone(userId, {
            milestone_type: milestoneType,
            milestone_name: `${target}-Day ${namePrefix}`,
            description: `Completed ${target} consecutive days of ${unit}`,
            milestone_value: target,
            reward_points: points,
          });
          awarded++;
        }
      }
    }

    return awarded;
  }

  private async checkGoalMilestones(userId: any): Promise<number> {
    let awarded = 0;

    // Count completed goals across all recovery plans
    const plans = await this.planModel
      .find({
        user: userId,
        deleted_at: { $exists: false },
      })
      .select('stages')
      .lean();

    let completedGoals = 0;
    for (const plan of plans) {
      if (plan.stages) {
        for (const stage of plan.stages) {
          if (stage.goals) {
            completedGoals += stage.goals.filter(
              (g: any) => g.status === 'completed',
            ).length;
          }
        }
      }
    }

    for (const milestone of this.GOALS_MILESTONES) {
      if (completedGoals >= milestone.count) {
        const exists = await this.milestoneModel.exists({
          user: userId,
          milestone_type: MilestoneType.GOALS_ACHIEVED,
          milestone_value: milestone.count,
        });

        if (!exists) {
          await this.awardMilestone(userId, {
            milestone_type: MilestoneType.GOALS_ACHIEVED,
            milestone_name: milestone.name,
            description: `Completed ${milestone.count} recovery goal${milestone.count > 1 ? 's' : ''}`,
            milestone_value: milestone.count,
            reward_points: milestone.points,
          });
          awarded++;
        }
      }
    }

    return awarded;
  }

  private async checkScreeningMilestones(userId: any): Promise<number> {
    let awarded = 0;

    const screeningCount = await this.screeningModel.countDocuments({
      user: userId,
      deleted_at: { $exists: false },
    });

    for (const milestone of this.SCREENING_MILESTONES) {
      if (screeningCount >= milestone.count) {
        const exists = await this.milestoneModel.exists({
          user: userId,
          milestone_type: MilestoneType.SCREENING_IMPROVEMENT,
          milestone_value: milestone.count,
        });

        if (!exists) {
          await this.awardMilestone(userId, {
            milestone_type: MilestoneType.SCREENING_IMPROVEMENT,
            milestone_name: milestone.name,
            description: `Completed ${milestone.count} addiction screening${milestone.count > 1 ? 's' : ''}`,
            milestone_value: milestone.count,
            reward_points: milestone.points,
          });
          awarded++;
        }
      }
    }

    return awarded;
  }

  private async checkCompanionMilestones(userId: any): Promise<number> {
    let awarded = 0;

    // Count Eka conversations tagged with 'recovery'
    const sessionCount = await this.ekaConversationModel.countDocuments({
      user: userId,
      tags: 'recovery',
    });

    for (const milestone of this.COMPANION_MILESTONES) {
      if (sessionCount >= milestone.count) {
        const exists = await this.milestoneModel.exists({
          user: userId,
          milestone_type: MilestoneType.COMPANION_SESSIONS,
          milestone_value: milestone.count,
        });

        if (!exists) {
          await this.awardMilestone(userId, {
            milestone_type: MilestoneType.COMPANION_SESSIONS,
            milestone_name: milestone.name,
            description: `Completed ${milestone.count} companion session${milestone.count > 1 ? 's' : ''}`,
            milestone_value: milestone.count,
            reward_points: milestone.points,
          });
          awarded++;
        }
      }
    }

    return awarded;
  }

  private async awardMilestone(
    userId: any,
    data: {
      milestone_type: MilestoneType;
      milestone_name: string;
      description: string;
      milestone_value: number;
      reward_points: number;
    },
  ): Promise<void> {
    const milestone = await this.milestoneModel.create({
      user: userId,
      ...data,
      achieved_at: new Date(),
      celebrated: false,
      shared_with_care_team: false,
    });

    this.eventEmitter.emit('recovery.milestone_achieved', {
      userId: userId.toString(),
      milestoneId: milestone._id.toString(),
      type: data.milestone_type,
      name: data.milestone_name,
      points: data.reward_points,
    });

    this.logger.debug(
      `Awarded milestone "${data.milestone_name}" to user ${userId}`,
    );
  }
}
