import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Model, Types } from 'mongoose';
import {
  SobrietyLog,
  SobrietyLogDocument,
} from '../entities/sobriety-log.entity';
import {
  RecoveryProfile,
  RecoveryProfileDocument,
} from '../entities/recovery-profile.entity';
import {
  RecoveryMilestone,
  RecoveryMilestoneDocument,
  MilestoneType,
} from '../entities/recovery-milestone.entity';
import { LogSobrietyDto } from '../dto/log-sobriety.dto';
import {
  SOBRIETY_MILESTONES,
  ENGAGEMENT_MILESTONES,
  findSobrietyMilestone,
  getNextSobrietyMilestone,
} from '../constants/milestone-definitions';

@Injectable()
export class SobrietyTrackerService {
  private readonly logger = new Logger(SobrietyTrackerService.name);

  constructor(
    @InjectModel(SobrietyLog.name)
    private sobrietyLogModel: Model<SobrietyLogDocument>,
    @InjectModel(RecoveryProfile.name)
    private profileModel: Model<RecoveryProfileDocument>,
    @InjectModel(RecoveryMilestone.name)
    private milestoneModel: Model<RecoveryMilestoneDocument>,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * Log a daily sobriety check-in.
   */
  async logDaily(dto: LogSobrietyDto, userId: string) {
    const logDate = new Date(dto.log_date);
    logDate.setHours(0, 0, 0, 0);

    // Upsert — allow updating today's log
    const existing = await this.sobrietyLogModel.findOne({
      user: new Types.ObjectId(userId),
      log_date: logDate,
    });

    let log;
    if (existing) {
      await this.sobrietyLogModel.updateOne(
        { _id: existing._id },
        { $set: { ...dto, log_date: logDate } },
      );
      log = await this.sobrietyLogModel.findById(existing._id).lean();
    } else {
      log = await this.sobrietyLogModel.create({
        user: new Types.ObjectId(userId),
        ...dto,
        log_date: logDate,
      });
      log = log.toObject();

      // Increment journal count on recovery profile
      await this.profileModel.updateOne(
        { user: new Types.ObjectId(userId), status: { $ne: 'archived' }, deleted_at: { $exists: false } },
        { $inc: { 'outcomes.journal_entries_count': 1 } },
      );
    }

    // Handle relapse
    if (!dto.sober_today && dto.relapse_details) {
      await this.handleRelapse(userId, logDate, dto.relapse_details);
    }

    // Check milestones
    const milestones = await this.checkAndAwardMilestones(userId);

    // Emit events for risk engine recalculation
    this.eventEmitter.emit('recovery.checkin_logged', { userId });
    if (!dto.sober_today) {
      this.eventEmitter.emit('recovery.relapse_reported', { userId });
    }

    return {
      log,
      milestones_awarded: milestones,
      is_update: !!existing,
    };
  }

  /**
   * Get sobriety logs for a date range.
   */
  async getLogs(
    userId: string,
    startDate?: string,
    endDate?: string,
    limit = 30,
  ) {
    const query: any = { user: new Types.ObjectId(userId) };
    if (startDate || endDate) {
      query.log_date = {};
      if (startDate) query.log_date.$gte = new Date(startDate);
      if (endDate) query.log_date.$lte = new Date(endDate);
    }

    return this.sobrietyLogModel
      .find(query)
      .sort({ log_date: -1 })
      .limit(limit)
      .lean();
  }

  /**
   * Get chart data for mood, craving, and other tracked metrics.
   */
  async getChartData(
    userId: string,
    metric: string,
    days = 30,
  ) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const validMetrics = [
      'mood_score',
      'craving_intensity',
      'energy_level',
      'sleep_quality',
      'sleep_hours',
      'anxiety_level',
    ];

    if (!validMetrics.includes(metric)) {
      throw new BadRequestException(
        `Invalid metric. Valid options: ${validMetrics.join(', ')}`,
      );
    }

    const logs = await this.sobrietyLogModel
      .find({
        user: new Types.ObjectId(userId),
        log_date: { $gte: startDate },
        [metric]: { $exists: true, $ne: null },
      })
      .sort({ log_date: 1 })
      .select(`log_date ${metric}`)
      .lean();

    return logs.map((log: any) => ({
      date: log.log_date,
      value: log[metric],
    }));
  }

  /**
   * Get the sobriety counter (days, longest streak, etc.).
   */
  async getSobrietyStats(userId: string) {
    const profile = await this.profileModel
      .findOne({
        user: new Types.ObjectId(userId),
        status: { $ne: 'archived' },
        deleted_at: { $exists: false },
      })
      .lean();

    if (!profile) {
      throw new NotFoundException('Recovery profile not found');
    }

    const sobrietyDays = profile.sobriety_start_date
      ? Math.max(
          0,
          Math.floor(
            (Date.now() - new Date(profile.sobriety_start_date).getTime()) /
              (1000 * 60 * 60 * 24),
          ),
        )
      : 0;

    const nextMilestone = getNextSobrietyMilestone(sobrietyDays);
    const daysToNext = nextMilestone
      ? nextMilestone.value - sobrietyDays
      : null;

    // Get earned sobriety milestones
    const earnedMilestones = await this.milestoneModel
      .find({
        user: new Types.ObjectId(userId),
        milestone_type: MilestoneType.SOBRIETY_DAYS,
      })
      .sort({ milestone_value: 1 })
      .lean();

    return {
      sobriety_days: sobrietyDays,
      sobriety_start_date: profile.sobriety_start_date,
      longest_streak: profile.longest_sobriety_days,
      total_relapses: profile.total_relapse_count,
      last_relapse: profile.relapse_dates?.length
        ? profile.relapse_dates[profile.relapse_dates.length - 1]
        : null,
      next_milestone: nextMilestone
        ? {
            name: nextMilestone.name,
            days_required: nextMilestone.value,
            days_remaining: daysToNext,
            points: nextMilestone.points,
            message: nextMilestone.message,
          }
        : null,
      earned_milestones: earnedMilestones,
    };
  }

  /**
   * Get all milestones for a user.
   */
  async getMilestones(userId: string) {
    return this.milestoneModel
      .find({ user: new Types.ObjectId(userId) })
      .sort({ achieved_at: -1 })
      .lean();
  }

  /**
   * Celebrate (acknowledge) a milestone.
   */
  async celebrateMilestone(milestoneId: string, userId: string) {
    const milestone = await this.milestoneModel.findOne({
      _id: new Types.ObjectId(milestoneId),
      user: new Types.ObjectId(userId),
    });
    if (!milestone) {
      throw new NotFoundException('Milestone not found');
    }

    await this.milestoneModel.updateOne(
      { _id: milestone._id },
      { $set: { celebrated: true } },
    );

    return { celebrated: true };
  }

  // ─── Private Methods ─────────────────────────────────────────────

  /**
   * Handle a reported relapse with compassion and clinical accuracy.
   */
  private async handleRelapse(
    userId: string,
    relapseDate: Date,
    details: any,
  ) {
    const profile = await this.profileModel.findOne({
      user: new Types.ObjectId(userId),
      status: { $ne: 'archived' },
      deleted_at: { $exists: false },
    });
    if (!profile) return;

    // Record the relapse but DON'T auto-reset sobriety counter
    // That happens via specialist review or patient confirmation
    const currentStreak = profile.sobriety_start_date
      ? Math.floor(
          (Date.now() - new Date(profile.sobriety_start_date).getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 0;

    await this.profileModel.updateOne(
      { _id: profile._id },
      {
        $push: { relapse_dates: relapseDate },
        $inc: { total_relapse_count: 1 },
        $set: {
          // Update longest streak if current was longer
          ...(currentStreak > profile.longest_sobriety_days && {
            longest_sobriety_days: currentStreak,
          }),
          // Reset sobriety start to now (fresh count begins)
          sobriety_start_date: new Date(),
        },
      },
    );

    this.logger.log(
      `Relapse logged for user ${userId}. Previous streak: ${currentStreak} days.`,
    );
  }

  /**
   * Check milestone thresholds and award any new milestones.
   */
  async checkAndAwardMilestones(userId: string) {
    const profile = await this.profileModel
      .findOne({ user: new Types.ObjectId(userId), status: { $ne: 'archived' }, deleted_at: { $exists: false } })
      .lean();
    if (!profile) return [];

    const awarded: any[] = [];

    // 1. Sobriety milestones
    const sobrietyDays = profile.sobriety_start_date
      ? Math.floor(
          (Date.now() - new Date(profile.sobriety_start_date).getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 0;

    for (const milestone of SOBRIETY_MILESTONES) {
      if (sobrietyDays >= milestone.value) {
        const exists = await this.milestoneModel.findOne({
          user: new Types.ObjectId(userId),
          milestone_type: MilestoneType.SOBRIETY_DAYS,
          milestone_value: milestone.value,
        });

        if (!exists) {
          const created = await this.milestoneModel.create({
            user: new Types.ObjectId(userId),
            milestone_type: MilestoneType.SOBRIETY_DAYS,
            milestone_name: milestone.name,
            milestone_value: milestone.value,
            achieved_at: new Date(),
            reward_points: milestone.points,
            celebration_message: milestone.message,
          });
          awarded.push(created);
        }
      }
    }

    // 2. Journal streak milestones
    const logStreak = await this.calculateLogStreak(userId);
    for (const milestone of ENGAGEMENT_MILESTONES.filter(
      (m) => m.type === 'journal_streak',
    )) {
      if (logStreak >= milestone.value) {
        const exists = await this.milestoneModel.findOne({
          user: new Types.ObjectId(userId),
          milestone_type: MilestoneType.JOURNAL_STREAK,
          milestone_value: milestone.value,
        });

        if (!exists) {
          const created = await this.milestoneModel.create({
            user: new Types.ObjectId(userId),
            milestone_type: MilestoneType.JOURNAL_STREAK,
            milestone_name: milestone.name,
            milestone_value: milestone.value,
            achieved_at: new Date(),
            reward_points: milestone.points,
            celebration_message: milestone.message,
          });
          awarded.push(created);
        }
      }
    }

    // Update milestone count on profile
    if (awarded.length > 0) {
      await this.profileModel.updateOne(
        { user: new Types.ObjectId(userId), status: { $ne: 'archived' }, deleted_at: { $exists: false } },
        { $inc: { 'outcomes.milestones_achieved': awarded.length } },
      );
    }

    return awarded;
  }

  private async calculateLogStreak(userId: string): Promise<number> {
    const logs = await this.sobrietyLogModel
      .find({ user: new Types.ObjectId(userId) })
      .sort({ log_date: -1 })
      .select('log_date')
      .limit(365)
      .lean();

    if (logs.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < logs.length; i++) {
      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - i);
      expectedDate.setHours(0, 0, 0, 0);

      const logDate = new Date(logs[i].log_date);
      logDate.setHours(0, 0, 0, 0);

      if (logDate.getTime() === expectedDate.getTime()) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }
}
