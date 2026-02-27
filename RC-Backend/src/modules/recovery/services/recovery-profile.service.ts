import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  RecoveryProfile,
  RecoveryProfileDocument,
  RecoveryStatus,
} from '../entities/recovery-profile.entity';
import {
  SobrietyLog,
  SobrietyLogDocument,
} from '../entities/sobriety-log.entity';
import {
  RecoveryMilestone,
  RecoveryMilestoneDocument,
} from '../entities/recovery-milestone.entity';
import {
  AddictionScreening,
  AddictionScreeningDocument,
} from '../entities/addiction-screening.entity';
import {
  CreateRecoveryProfileDto,
  SubstanceHistoryDto,
} from '../dto/create-recovery-profile.dto';

@Injectable()
export class RecoveryProfileService {
  private readonly logger = new Logger(RecoveryProfileService.name);

  constructor(
    @InjectModel(RecoveryProfile.name)
    private profileModel: Model<RecoveryProfileDocument>,
    @InjectModel(SobrietyLog.name)
    private sobrietyLogModel: Model<SobrietyLogDocument>,
    @InjectModel(RecoveryMilestone.name)
    private milestoneModel: Model<RecoveryMilestoneDocument>,
    @InjectModel(AddictionScreening.name)
    private screeningModel: Model<AddictionScreeningDocument>,
  ) {}

  /**
   * Create or enrol a patient in the recovery programme.
   */
  async createProfile(dto: CreateRecoveryProfileDto, userId: string) {
    const existing = await this.profileModel.findOne({
      user: new Types.ObjectId(userId),
      status: { $ne: RecoveryStatus.ARCHIVED },
      deleted_at: { $exists: false },
    });

    if (existing) {
      throw new BadRequestException(
        'Recovery profile already exists for this user',
      );
    }

    const now = new Date();
    const consentData: any = {};
    if (dto.consent) {
      for (const [key, value] of Object.entries(dto.consent)) {
        if (value === true) {
          consentData[key] = { given: true, date: now };
        }
      }
    }

    const profile = await this.profileModel.create({
      user: new Types.ObjectId(userId),
      status: RecoveryStatus.ACTIVE,
      substance_use_history: dto.substance_use_history,
      sobriety_start_date: dto.sobriety_start_date
        ? new Date(dto.sobriety_start_date)
        : now,
      care_level: dto.care_level,
      enrolled_at: now,
      consent: consentData,
      outcomes: {
        days_in_program: 0,
        appointments_attended: 0,
        appointments_missed: 0,
        journal_entries_count: 0,
        companion_sessions_count: 0,
        milestones_achieved: 0,
        medications_prescribed: [],
      },
    });

    return profile;
  }

  /**
   * Get the recovery profile for the current user.
   */
  async getProfile(userId: string) {
    const profile = await this.profileModel
      .findOne({
        user: new Types.ObjectId(userId),
        status: { $ne: RecoveryStatus.ARCHIVED },
        deleted_at: { $exists: false },
      })
      .populate('enrolled_by', 'profile.first_name profile.last_name')
      .populate('baseline_screening')
      .lean();

    if (!profile) {
      return null;
    }

    // Calculate current sobriety days
    const sobrietyDays = this.calculateSobrietyDays(profile.sobriety_start_date);

    // Get latest screening score
    const latestScreening = await this.screeningModel
      .findOne({
        user: new Types.ObjectId(userId),
        deleted_at: { $exists: false },
      })
      .sort({ created_at: -1 })
      .select('total_score risk_level instrument created_at')
      .lean();

    // Get milestone count
    const milestoneCount = await this.milestoneModel.countDocuments({
      user: new Types.ObjectId(userId),
    });

    // Get recent log streak
    const logStreak = await this.calculateLogStreak(userId);

    // Calculate days in program (enrollment day counts as day 1)
    const daysInProgram = profile.enrolled_at
      ? Math.floor(
          (Date.now() - new Date(profile.enrolled_at).getTime()) /
            (1000 * 60 * 60 * 24),
        ) + 1
      : 0;

    return {
      ...profile,
      computed: {
        sobriety_days: sobrietyDays,
        days_in_program: daysInProgram,
        log_streak: logStreak,
        milestones_achieved: milestoneCount,
        latest_screening: latestScreening,
      },
    };
  }

  /**
   * Get recovery dashboard data (aggregated stats for the patient).
   */
  async getDashboardData(userId: string) {
    const profile = await this.getProfile(userId);
    if (!profile) {
      return { enrolled: false };
    }

    // Recent sobriety logs (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentLogs = await this.sobrietyLogModel
      .find({
        user: new Types.ObjectId(userId),
        log_date: { $gte: sevenDaysAgo },
      })
      .sort({ log_date: -1 })
      .lean();

    // Mood trend (last 14 days)
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const moodTrend = await this.sobrietyLogModel
      .find({
        user: new Types.ObjectId(userId),
        log_date: { $gte: fourteenDaysAgo },
        mood_score: { $exists: true },
      })
      .sort({ log_date: 1 })
      .select('log_date mood_score craving_intensity')
      .lean();

    // Recent milestones
    const recentMilestones = await this.milestoneModel
      .find({ user: new Types.ObjectId(userId) })
      .sort({ achieved_at: -1 })
      .limit(5)
      .lean();

    // Next milestone
    const {
      getNextSobrietyMilestone,
    } = require('../constants/milestone-definitions');
    const nextMilestone = getNextSobrietyMilestone(
      profile.computed.sobriety_days,
    );

    // Screening history summary
    const screenings = await this.screeningModel
      .find({
        user: new Types.ObjectId(userId),
        deleted_at: { $exists: false },
      })
      .sort({ created_at: -1 })
      .limit(5)
      .select('instrument total_score risk_level created_at')
      .lean();

    // Today's log status
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayLog = await this.sobrietyLogModel
      .findOne({
        user: new Types.ObjectId(userId),
        log_date: { $gte: todayStart },
      })
      .lean();

    return {
      enrolled: true,
      profile: {
        status: profile.status,
        care_level: profile.care_level,
        primary_substance: profile.substance_use_history?.find(
          (s: any) => s.is_primary,
        ),
        substance_use_history: profile.substance_use_history || [],
        sobriety_days: profile.computed.sobriety_days,
        days_in_program: profile.computed.days_in_program,
        log_streak: profile.computed.log_streak,
        risk_level: profile.current_risk_level,
        risk_score: profile.current_risk_score,
      },
      today: {
        logged: !!todayLog,
        log: todayLog,
      },
      mood_trend: moodTrend,
      recent_logs: recentLogs,
      milestones: {
        recent: recentMilestones,
        total: profile.computed.milestones_achieved,
        next: nextMilestone,
      },
      screenings: {
        recent: screenings,
        latest: profile.computed.latest_screening,
      },
    };
  }

  /**
   * Update recovery profile status.
   */
  async updateStatus(userId: string, status: RecoveryStatus, reason?: string) {
    const profile = await this.profileModel.findOne({
      user: new Types.ObjectId(userId),
      deleted_at: { $exists: false },
    });
    if (!profile) {
      throw new NotFoundException('Recovery profile not found');
    }

    await this.profileModel.updateOne(
      { _id: profile._id },
      { $set: { status } },
    );

    return { updated: true, status };
  }

  /**
   * Update consent settings.
   */
  async updateConsent(
    userId: string,
    consentKey: string,
    given: boolean,
    ipAddress?: string,
  ) {
    const update: any = {};
    update[`consent.${consentKey}`] = {
      given,
      date: new Date(),
      ...(ipAddress && { ip_address: ipAddress }),
    };

    await this.profileModel.updateOne(
      {
        user: new Types.ObjectId(userId),
        status: { $ne: RecoveryStatus.ARCHIVED },
        deleted_at: { $exists: false },
      },
      { $set: update },
    );

    return { updated: true, consent_key: consentKey, given };
  }

  /**
   * Add one or more substances to the active profile.
   */
  async addSubstances(userId: string, substances: SubstanceHistoryDto[]) {
    const profile = await this.profileModel.findOne({
      user: new Types.ObjectId(userId),
      status: RecoveryStatus.ACTIVE,
      deleted_at: { $exists: false },
    });

    if (!profile) {
      throw new NotFoundException('No active recovery profile found');
    }

    const existingSubstances = new Set(
      (profile.substance_use_history || []).map((s: any) => s.substance),
    );

    const newSubstances = substances.filter(
      (s) => !existingSubstances.has(s.substance),
    );

    if (newSubstances.length === 0) {
      throw new BadRequestException(
        'All specified substances already exist in your profile',
      );
    }

    // If any new substance is marked as primary, un-primary existing ones
    if (newSubstances.some((s) => s.is_primary)) {
      await this.profileModel.updateOne(
        { _id: profile._id },
        { $set: { 'substance_use_history.$[].is_primary': false } },
      );
    }

    await this.profileModel.updateOne(
      { _id: profile._id },
      { $push: { substance_use_history: { $each: newSubstances } } },
    );

    return this.getProfile(userId);
  }

  /**
   * Archive the current programme and create a fresh one.
   */
  async archiveAndReenrol(userId: string, dto: CreateRecoveryProfileDto) {
    const currentProfile = await this.profileModel.findOne({
      user: new Types.ObjectId(userId),
      status: { $ne: RecoveryStatus.ARCHIVED },
      deleted_at: { $exists: false },
    });

    if (!currentProfile) {
      throw new NotFoundException('No active recovery profile to archive');
    }

    // Calculate final stats
    const sobrietyDays = this.calculateSobrietyDays(
      currentProfile.sobriety_start_date,
    );
    const daysInProgram = currentProfile.enrolled_at
      ? Math.floor(
          (Date.now() - new Date(currentProfile.enrolled_at).getTime()) /
            (1000 * 60 * 60 * 24),
        ) + 1
      : 0;

    // Archive the current profile
    await this.profileModel.updateOne(
      { _id: currentProfile._id },
      {
        $set: {
          status: RecoveryStatus.ARCHIVED,
          archived_at: new Date(),
          'outcomes.days_in_program': daysInProgram,
          'outcomes.final_sobriety_days': sobrietyDays,
        },
      },
    );

    // Create new profile
    const now = new Date();
    const consentData: any = {};
    if (dto.consent) {
      for (const [key, value] of Object.entries(dto.consent)) {
        if (value === true) {
          consentData[key] = { given: true, date: now };
        }
      }
    }

    const newProfile = await this.profileModel.create({
      user: new Types.ObjectId(userId),
      status: RecoveryStatus.ACTIVE,
      substance_use_history: dto.substance_use_history,
      sobriety_start_date: dto.sobriety_start_date
        ? new Date(dto.sobriety_start_date)
        : now,
      care_level: dto.care_level,
      enrolled_at: now,
      consent: consentData,
      previous_programme: currentProfile._id,
      outcomes: {
        days_in_program: 0,
        appointments_attended: 0,
        appointments_missed: 0,
        journal_entries_count: 0,
        companion_sessions_count: 0,
        milestones_achieved: 0,
        medications_prescribed: [],
      },
    });

    return {
      archived_profile_id: currentProfile._id,
      new_profile: newProfile,
    };
  }

  /**
   * Get all archived/past programmes for the user.
   */
  async getPastProgrammes(userId: string) {
    const profiles = await this.profileModel
      .find({
        user: new Types.ObjectId(userId),
        status: RecoveryStatus.ARCHIVED,
      })
      .sort({ archived_at: -1 })
      .select(
        'status substance_use_history sobriety_start_date enrolled_at archived_at ' +
          'care_level outcomes current_risk_level total_relapse_count longest_sobriety_days',
      )
      .lean();

    return profiles.map((p: any) => {
      const daysInProgram =
        p.outcomes?.days_in_program ||
        (p.enrolled_at && p.archived_at
          ? Math.floor(
              (new Date(p.archived_at).getTime() -
                new Date(p.enrolled_at).getTime()) /
                (1000 * 60 * 60 * 24),
            )
          : 0);

      return {
        _id: p._id,
        enrolled_at: p.enrolled_at,
        archived_at: p.archived_at,
        care_level: p.care_level,
        primary_substance: p.substance_use_history?.find(
          (s: any) => s.is_primary,
        )?.substance,
        substances: p.substance_use_history?.map((s: any) => s.substance) || [],
        days_in_program: daysInProgram,
        final_sobriety_days: p.outcomes?.final_sobriety_days || 0,
        longest_sobriety_days: p.longest_sobriety_days || 0,
        total_relapses: p.total_relapse_count || 0,
        risk_level_at_archive: p.current_risk_level,
        milestones_achieved: p.outcomes?.milestones_achieved || 0,
      };
    });
  }

  // ─── Helpers ─────────────────────────────────────────────────────

  private calculateSobrietyDays(sobrietyStartDate: Date | undefined): number {
    if (!sobrietyStartDate) return 0;
    const diffMs = Date.now() - new Date(sobrietyStartDate).getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
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
