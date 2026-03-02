import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import {
  RecoveryProfile,
  RecoveryProfileDocument,
} from './entities/recovery-profile.entity';
import {
  AddictionScreening,
  AddictionScreeningDocument,
} from './entities/addiction-screening.entity';
import {
  SobrietyLog,
  SobrietyLogDocument,
} from './entities/sobriety-log.entity';
import {
  RecoveryMilestone,
  RecoveryMilestoneDocument,
} from './entities/recovery-milestone.entity';
import {
  CrisisEvent,
  CrisisEventDocument,
} from './entities/crisis-event.entity';
import {
  RecoveryPlan,
  RecoveryPlanDocument,
} from './entities/recovery-plan.entity';
import {
  GroupSession,
  GroupSessionDocument,
} from './entities/group-session.entity';
import {
  RiskAssessmentReport,
  RiskAssessmentReportDocument,
} from './entities/risk-assessment-report.entity';
import {
  SuspiciousActivityLog,
  SuspiciousActivityLogDocument,
} from './entities/suspicious-activity-log.entity';
import {
  CopingExerciseSession,
  CopingExerciseSessionDocument,
} from './entities/coping-exercise-session.entity';
import {
  PeerAssignment,
  PeerAssignmentDocument,
} from './entities/peer-assignment.entity';

@Injectable()
export class RecoveryAdminService {
  constructor(
    @InjectModel(RecoveryProfile.name)
    private profileModel: Model<RecoveryProfileDocument>,
    @InjectModel(AddictionScreening.name)
    private screeningModel: Model<AddictionScreeningDocument>,
    @InjectModel(SobrietyLog.name)
    private sobrietyLogModel: Model<SobrietyLogDocument>,
    @InjectModel(RecoveryMilestone.name)
    private milestoneModel: Model<RecoveryMilestoneDocument>,
    @InjectModel(CrisisEvent.name)
    private crisisModel: Model<CrisisEventDocument>,
    @InjectModel(RecoveryPlan.name)
    private planModel: Model<RecoveryPlanDocument>,
    @InjectModel(GroupSession.name)
    private groupSessionModel: Model<GroupSessionDocument>,
    @InjectModel(RiskAssessmentReport.name)
    private riskReportModel: Model<RiskAssessmentReportDocument>,
    @InjectModel(SuspiciousActivityLog.name)
    private suspiciousActivityModel: Model<SuspiciousActivityLogDocument>,
    @InjectModel(CopingExerciseSession.name)
    private copingSessionModel: Model<CopingExerciseSessionDocument>,
    @InjectModel(PeerAssignment.name)
    private peerAssignmentModel: Model<PeerAssignmentDocument>,
    @InjectConnection()
    private connection: Connection,
  ) {}

  // ─── G2: Dashboard Metrics ────────────────────────────────────────

  async getMetrics() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalEnrolled,
      activeProfiles,
      statusBreakdown,
      avgSobrietyDays,
      totalRelapses,
      activeCrises,
      totalScreenings,
      totalMilestones,
    ] = await Promise.all([
      this.profileModel.countDocuments({ deleted_at: { $exists: false } }),
      this.profileModel.countDocuments({
        status: 'active',
        deleted_at: { $exists: false },
      }),
      this.profileModel.aggregate([
        { $match: { deleted_at: { $exists: false } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      this.profileModel.aggregate([
        { $match: { status: 'active', deleted_at: { $exists: false }, sobriety_start_date: { $exists: true } } },
        {
          $project: {
            days: {
              $divide: [
                { $subtract: [now, '$sobriety_start_date'] },
                1000 * 60 * 60 * 24,
              ],
            },
          },
        },
        { $group: { _id: null, avg: { $avg: '$days' } } },
      ]),
      this.profileModel.aggregate([
        { $match: { deleted_at: { $exists: false } } },
        { $group: { _id: null, total: { $sum: '$total_relapse_count' } } },
      ]),
      this.crisisModel.countDocuments({
        status: { $in: ['active', 'responding', 'escalated_external'] },
      }),
      this.screeningModel.countDocuments({
        total_score: { $exists: true },
        deleted_at: { $exists: false },
      }),
      this.milestoneModel.countDocuments({
        achieved_at: { $exists: true },
      }),
    ]);

    // Enrollments in last 30 days
    const recentEnrollments = await this.profileModel.countDocuments({
      enrolled_at: { $gte: thirtyDaysAgo },
      deleted_at: { $exists: false },
    });

    return {
      total_enrolled: totalEnrolled,
      active: activeProfiles,
      recent_enrollments_30d: recentEnrollments,
      status_breakdown: statusBreakdown.reduce(
        (acc, s) => ({ ...acc, [s._id]: s.count }),
        {},
      ),
      avg_sobriety_days: Math.round(avgSobrietyDays[0]?.avg || 0),
      total_relapses: totalRelapses[0]?.total || 0,
      active_crises: activeCrises,
      total_screenings_completed: totalScreenings,
      total_milestones_achieved: totalMilestones,
    };
  }

  async getCohort(filters: {
    status?: string;
    risk_level?: string;
    substance?: string;
    care_level?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, risk_level, substance, care_level, page = 1, limit = 20 } = filters;
    const query: any = { deleted_at: { $exists: false } };

    if (status) query.status = status;
    if (risk_level) query.current_risk_level = risk_level;
    if (care_level) query.care_level = care_level;
    if (substance) {
      query['substance_use_history.substance'] = substance;
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.profileModel
        .find(query)
        .populate('user', 'email profile.first_name profile.last_name profile.phone_number profile.gender profile.date_of_birth status')
        .sort({ current_risk_score: -1, created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.profileModel.countDocuments(query),
    ]);

    return {
      data,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async getRiskOverview() {
    const [riskDistribution, recentEscalations, riskTrend] = await Promise.all([
      this.profileModel.aggregate([
        { $match: { status: 'active', deleted_at: { $exists: false } } },
        { $group: { _id: '$current_risk_level', count: { $sum: 1 } } },
      ]),
      // Recent risk score increases — check trend.direction or score > previous_score
      this.riskReportModel
        .find({
          $or: [
            { 'trend.direction': 'increasing' },
            { $expr: { $gt: ['$score', '$previous_score'] } },
          ],
        })
        .populate('user', 'profile.first_name profile.last_name')
        .sort({ created_at: -1 })
        .limit(20)
        .lean(),
      // Weekly average risk scores for last 12 weeks
      this.riskReportModel.aggregate([
        {
          $match: {
            created_at: {
              $gte: new Date(Date.now() - 84 * 24 * 60 * 60 * 1000),
            },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%U', date: '$created_at' },
            },
            avg_score: { $avg: '$score' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    return {
      risk_distribution: riskDistribution.reduce(
        (acc, r) => ({ ...acc, [r._id || 'unknown']: r.count }),
        {},
      ),
      recent_escalations: recentEscalations,
      risk_trend_weekly: riskTrend,
    };
  }

  async getScreeningTrends() {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const baseMatch = { deleted_at: { $exists: false }, total_score: { $exists: true } };

    const [
      completionsByWeek,
      scoreDistribution,
      typeBreakdown,
      avgScoreByType,
    ] = await Promise.all([
      this.screeningModel.aggregate([
        {
          $match: {
            ...baseMatch,
            created_at: { $gte: ninetyDaysAgo },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%U', date: '$created_at' },
            },
            count: { $sum: 1 },
            avg_score: { $avg: '$total_score' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      this.screeningModel.aggregate([
        { $match: baseMatch },
        { $group: { _id: '$risk_level', count: { $sum: 1 } } },
      ]),
      this.screeningModel.aggregate([
        { $match: baseMatch },
        { $group: { _id: '$instrument', count: { $sum: 1 } } },
      ]),
      this.screeningModel.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: '$instrument',
            avg_score: { $avg: '$total_score' },
            min_score: { $min: '$total_score' },
            max_score: { $max: '$total_score' },
          },
        },
      ]),
    ]);

    const instrumentLabels = { audit: 'AUDIT', dast10: 'DAST-10', cage: 'CAGE', assist: 'ASSIST' };

    return {
      completions_by_week: completionsByWeek,
      score_distribution: scoreDistribution.reduce(
        (acc, s) => ({ ...acc, [s._id || 'unknown']: s.count }),
        {},
      ),
      type_breakdown: typeBreakdown.reduce(
        (acc, t) => ({ ...acc, [instrumentLabels[t._id] || t._id]: t.count }),
        {},
      ),
      avg_score_by_type: avgScoreByType.map((t: any) => ({
        ...t,
        _id: instrumentLabels[t._id] || t._id,
      })),
    };
  }

  async getRecentMilestones(limit = 20) {
    const raw = await this.milestoneModel
      .find({
        achieved_at: { $exists: true },
      })
      .populate('user', 'profile.first_name profile.last_name')
      .sort({ achieved_at: -1 })
      .limit(limit)
      .lean();

    return raw.map((m: any) => ({
      ...m,
      title: m.milestone_name || m.title || m.milestone_type?.replace(/_/g, ' '),
    }));
  }

  async getActiveCrises() {
    return this.crisisModel
      .find({
        status: { $in: ['active', 'responding', 'escalated_external'] },
      })
      .populate('user', 'profile.first_name profile.last_name profile.phone_number')
      .populate('resolved_by', 'profile.first_name profile.last_name')
      .sort({ created_at: -1 })
      .lean();
  }

  async getCrisisHistory(filters: {
    status?: string;
    severity?: string;
    crisis_type?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, severity, crisis_type, page = 1, limit = 20 } = filters;
    const query: any = {};

    if (status) query.status = status;
    if (severity) query.severity = severity;
    if (crisis_type) query.crisis_type = crisis_type;

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.crisisModel
        .find(query)
        .populate('user', 'profile.first_name profile.last_name profile.phone_number')
        .populate('resolved_by', 'profile.first_name profile.last_name')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.crisisModel.countDocuments(query),
    ]);

    return {
      data,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async getGroupSessions(filters: {
    status?: string;
    session_category?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, session_category, page = 1, limit = 20 } = filters;
    const query: any = { deleted_at: { $exists: false } };

    if (status) query.status = status;
    if (session_category) query.session_category = session_category;

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.groupSessionModel
        .find(query)
        .populate('facilitator', 'profile.first_name profile.last_name')
        .sort({ scheduled_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.groupSessionModel.countDocuments(query),
    ]);

    // Calculate attendance rates
    const enriched = data.map((session: any) => {
      const enrolled = session.enrolled_participants?.length || 0;
      const attended = (session.attendance || []).filter(
        (a: any) => a.attended,
      ).length;
      return {
        ...session,
        enrolled_count: enrolled,
        attended_count: attended,
        attendance_rate: enrolled > 0 ? Math.round((attended / enrolled) * 100) : 0,
      };
    });

    return {
      data: enriched,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  // ─── G3: Patient Recovery Endpoints ───────────────────────────────

  async getPatientProfile(patientId: string) {
    const profile = await this.profileModel
      .findOne({
        user: new Types.ObjectId(patientId),
        deleted_at: { $exists: false },
      })
      .populate('user', 'email profile status recovery_status')
      .populate('enrolled_by', 'profile.first_name profile.last_name')
      .populate('current_plan')
      .populate('care_team.user', 'profile.first_name profile.last_name profile.phone_number')
      .lean();

    if (!profile) return null;

    // Enrich with counts
    const [
      screeningCount,
      milestoneCount,
      crisisCount,
      journalCount,
      exerciseCount,
    ] = await Promise.all([
      this.screeningModel.countDocuments({
        user: new Types.ObjectId(patientId),
        total_score: { $exists: true },
        deleted_at: { $exists: false },
      }),
      this.milestoneModel.countDocuments({
        user: new Types.ObjectId(patientId),
        achieved_at: { $exists: true },
      }),
      this.crisisModel.countDocuments({
        user: new Types.ObjectId(patientId),
      }),
      this.sobrietyLogModel.countDocuments({
        user: new Types.ObjectId(patientId),
        deleted_at: { $exists: false },
      }),
      this.copingSessionModel.countDocuments({
        user: new Types.ObjectId(patientId),
        completed: true,
        deleted_at: { $exists: false },
      }),
    ]);

    // Calculate current sobriety days
    let currentSobrietyDays = 0;
    if (profile.sobriety_start_date) {
      const lastRelapse =
        profile.relapse_dates?.length > 0
          ? new Date(
              Math.max(
                ...profile.relapse_dates.map((d) => new Date(d).getTime()),
              ),
            )
          : null;
      const startDate = lastRelapse || profile.sobriety_start_date;
      currentSobrietyDays = Math.floor(
        (Date.now() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24),
      );
    }

    return {
      ...profile,
      current_sobriety_days: currentSobrietyDays,
      counts: {
        screenings: screeningCount,
        milestones: milestoneCount,
        crises: crisisCount,
        check_ins: journalCount,
        exercises_completed: exerciseCount,
      },
    };
  }

  async getPatientRiskHistory(
    patientId: string,
    page = 1,
    limit = 50,
  ) {
    const query = { user: new Types.ObjectId(patientId) };
    const skip = (page - 1) * limit;

    const [rawData, total] = await Promise.all([
      this.riskReportModel
        .find(query)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.riskReportModel.countDocuments(query),
    ]);

    // Normalize field names for frontend
    const data = rawData.map((entry: any) => ({
      ...entry,
      calculated_at: entry.created_at,
      direction: entry.trend?.direction || entry.direction || 'stable',
      trigger_event: entry.top_factors?.[0]?.label || null,
    }));

    return {
      data,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async getPatientSobrietyTimeline(
    patientId: string,
    page = 1,
    limit = 30,
  ) {
    const query = {
      user: new Types.ObjectId(patientId),
      deleted_at: { $exists: false },
    };
    const skip = (page - 1) * limit;

    const [rawData, total] = await Promise.all([
      this.sobrietyLogModel
        .find(query)
        .sort({ log_date: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.sobrietyLogModel.countDocuments(query),
    ]);

    // Normalize field names for frontend
    const data = rawData.map((log: any) => ({
      ...log,
      date: log.log_date || log.date,
      maintained_sobriety: log.sober_today ?? log.maintained_sobriety,
      is_relapse: log.relapse_details
        ? !!(log.relapse_details.substance || log.relapse_details.occurred)
        : (log.is_relapse || false),
      craving_level: log.craving_intensity ?? log.craving_level,
    }));

    return {
      data,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async getPatientTreatmentProgress(patientId: string) {
    const [rawPlans, rawScreenings, rawMilestones, recentLogs] = await Promise.all([
      this.planModel
        .find({
          user: new Types.ObjectId(patientId),
          deleted_at: { $exists: false },
        })
        .sort({ created_at: -1 })
        .lean(),
      this.screeningModel
        .find({
          user: new Types.ObjectId(patientId),
          deleted_at: { $exists: false },
        })
        .sort({ created_at: -1 })
        .limit(10)
        .lean(),
      this.milestoneModel
        .find({
          user: new Types.ObjectId(patientId),
          achieved_at: { $exists: true },
          deleted_at: { $exists: false },
        })
        .sort({ achieved_at: -1 })
        .lean(),
      this.sobrietyLogModel
        .find({
          user: new Types.ObjectId(patientId),
          deleted_at: { $exists: false },
        })
        .sort({ log_date: -1 })
        .limit(30)
        .lean(),
    ]);

    const stageNameMap = {
      assessment: 'Assessment', detox: 'Detox', stabilization: 'Stabilisation',
      active_treatment: 'Active Treatment', maintenance: 'Maintenance', aftercare: 'Aftercare',
    };

    // Normalize plans: compute current_stage, keep full stages/goals structure
    const plans = rawPlans.map((plan: any) => {
      const stages = (plan.stages || []).map((s: any) => {
        const goals = (s.goals || []).map((g: any) => ({
          ...g,
          title: g.description || g.title || 'Untitled Goal',
        }));
        const completedGoals = goals.filter((g: any) => g.status === 'completed').length;
        return {
          ...s,
          display_name: stageNameMap[s.name] || s.name?.replace(/_/g, ' '),
          goals,
          total_goals: goals.length,
          completed_goals: completedGoals,
          progress_pct: goals.length > 0 ? Math.round((completedGoals / goals.length) * 100) : 0,
        };
      });
      const currentStage = stages.find((s: any) => s.status === 'in_progress')
        || stages.find((s: any) => s.status === 'pending')
        || stages[0];
      const totalGoals = stages.reduce((sum: number, s: any) => sum + s.total_goals, 0);
      const completedGoals = stages.reduce((sum: number, s: any) => sum + s.completed_goals, 0);
      return {
        ...plan,
        stages,
        current_stage: currentStage?.display_name || null,
        total_goals: totalGoals,
        completed_goals: completedGoals,
        overall_progress_pct: totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0,
      };
    });

    // Normalize milestones: map milestone_name to title
    const milestones = rawMilestones.map((m: any) => ({
      ...m,
      title: m.milestone_name || m.title || m.milestone_type?.replace(/_/g, ' '),
    }));

    // Normalize screenings: map instrument/created_at
    const screenings = rawScreenings.map((s: any) => ({
      ...s,
      completed_at: s.completed_at || s.created_at,
    }));

    // Calculate engagement metrics from recent logs (use correct field names)
    const logsLast30 = recentLogs.filter(
      (l: any) =>
        new Date(l.log_date || l.date).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000,
    );
    const avgCraving =
      logsLast30.length > 0
        ? logsLast30.reduce((sum: number, l: any) => sum + (l.craving_intensity || l.craving_level || 0), 0) /
          logsLast30.length
        : null;
    const avgMood =
      logsLast30.length > 0
        ? logsLast30.reduce((sum: number, l: any) => sum + (l.mood_score || 0), 0) /
          logsLast30.length
        : null;

    const relapseCount = logsLast30.filter((l: any) =>
      l.is_relapse || (l.relapse_details && (l.relapse_details.substance || l.relapse_details.occurred)),
    ).length;

    return {
      plans,
      screenings,
      milestones,
      engagement_30d: {
        check_ins: logsLast30.length,
        avg_craving: avgCraving ? Math.round(avgCraving * 10) / 10 : null,
        avg_mood: avgMood ? Math.round(avgMood * 10) / 10 : null,
        relapses: relapseCount,
      },
    };
  }

  async updatePatientStatus(
    patientId: string,
    status: string,
    reason?: string,
  ) {
    const profile = await this.profileModel.findOne({
      user: new Types.ObjectId(patientId),
      deleted_at: { $exists: false },
    });

    if (!profile) return null;

    profile.status = status as any;
    if (status === 'archived') {
      (profile as any).archived_at = new Date();
    }

    await profile.save();
    return profile.toObject();
  }

  async getPatientScreenings(
    patientId: string,
    page = 1,
    limit = 20,
  ) {
    const query = {
      user: new Types.ObjectId(patientId),
      deleted_at: { $exists: false },
    };
    const skip = (page - 1) * limit;

    const [rawData, total] = await Promise.all([
      this.screeningModel
        .find(query)
        .populate('administered_by', 'profile.first_name profile.last_name')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.screeningModel.countDocuments(query),
    ]);

    // Normalize field names for frontend
    const instrumentLabels = {
      audit: 'AUDIT', dast10: 'DAST-10', cage: 'CAGE', assist: 'ASSIST',
      cows: 'COWS', ciwa_ar: 'CIWA-Ar',
    };
    const data = rawData.map((s: any) => {
      const admin = s.administered_by;
      const adminName = admin?.profile
        ? `${admin.profile.first_name || ''} ${admin.profile.last_name || ''}`.trim()
        : null;
      return {
        ...s,
        screening_type: instrumentLabels[s.instrument] || s.instrument || s.screening_type,
        completed_at: s.completed_at || s.created_at,
        administered_by: adminName || (s.screening_type === 'self' ? 'Self' : s.screening_type?.replace(/_/g, ' ')),
      };
    });

    return {
      data,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async getPatientCrises(
    patientId: string,
    page = 1,
    limit = 20,
  ) {
    const query = { user: new Types.ObjectId(patientId) };
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.crisisModel
        .find(query)
        .populate('resolved_by', 'profile.first_name profile.last_name')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.crisisModel.countDocuments(query),
    ]);

    return {
      data,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  // ─── G4: MAT & Reporting ──────────────────────────────────────────

  async getMATCompliance() {
    // Get all active profiles with MAT medications
    const matProfiles = await this.profileModel
      .find({
        status: 'active',
        deleted_at: { $exists: false },
        'outcomes.medications_prescribed': { $exists: true, $ne: [] },
      })
      .populate('user', 'profile.first_name profile.last_name')
      .lean();

    // For each profile, check recent check-in compliance
    const compliance = await Promise.all(
      matProfiles.map(async (profile: any) => {
        const thirtyDaysAgo = new Date(
          Date.now() - 30 * 24 * 60 * 60 * 1000,
        );
        const recentLogs = await this.sobrietyLogModel.countDocuments({
          user: profile.user._id || profile.user,
          log_date: { $gte: thirtyDaysAgo },
          deleted_at: { $exists: false },
        });

        const recentScreenings = await this.screeningModel.countDocuments({
          user: profile.user._id || profile.user,
          total_score: { $exists: true },
          created_at: { $gte: thirtyDaysAgo },
          deleted_at: { $exists: false },
        });

        return {
          user: profile.user,
          medications: profile.outcomes?.medications_prescribed || [],
          check_in_rate_30d: Math.round((recentLogs / 30) * 100),
          screenings_30d: recentScreenings,
          risk_level: profile.current_risk_level,
          risk_score: profile.current_risk_score,
        };
      }),
    );

    return compliance;
  }

  async getSuspiciousActivity(filters: {
    severity?: string;
    activity_type?: string;
    reviewed?: string;
    page?: number;
    limit?: number;
  }) {
    const { severity, activity_type, reviewed, page = 1, limit = 20 } = filters;
    const query: any = { deleted_at: { $exists: false } };

    if (severity) query.severity = severity;
    if (activity_type) query.activity_type = activity_type;
    if (reviewed === 'true') query.reviewed_at = { $exists: true };
    if (reviewed === 'false') query.reviewed_at = { $exists: false };

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.suspiciousActivityModel
        .find(query)
        .populate('patient', 'email profile.first_name profile.last_name')
        .populate('reviewed_by', 'profile.first_name profile.last_name')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.suspiciousActivityModel.countDocuments(query),
    ]);

    return {
      data,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async reviewSuspiciousActivity(
    activityId: string,
    adminId: string,
    resolution: string,
  ) {
    return this.suspiciousActivityModel.findByIdAndUpdate(
      activityId,
      {
        reviewed_by: new Types.ObjectId(adminId),
        reviewed_at: new Date(),
        resolution,
      },
      { new: true },
    );
  }

  async getOutcomeMetrics() {
    const [
      totalEnrolled,
      completed,
      graduated,
      avgDaysInProgram,
      substanceBreakdown,
      riskImprovement,
      screeningImprovement,
      exerciseEngagement,
      peerAssignmentStats,
    ] = await Promise.all([
      this.profileModel.countDocuments({ deleted_at: { $exists: false } }),
      this.profileModel.countDocuments({
        status: 'completed',
        deleted_at: { $exists: false },
      }),
      this.profileModel.countDocuments({
        status: 'discharged',
        deleted_at: { $exists: false },
      }),
      this.profileModel.aggregate([
        { $match: { deleted_at: { $exists: false } } },
        { $group: { _id: null, avg: { $avg: '$outcomes.days_in_program' } } },
      ]),
      this.profileModel.aggregate([
        { $match: { deleted_at: { $exists: false } } },
        { $unwind: '$substance_use_history' },
        {
          $group: {
            _id: '$substance_use_history.substance',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),
      // Risk improvement: compare each user's first vs latest screening score
      this.screeningModel.aggregate([
        {
          $match: {
            total_score: { $exists: true },
            deleted_at: { $exists: false },
          },
        },
        { $sort: { user: 1, created_at: 1 } },
        {
          $group: {
            _id: '$user',
            first_score: { $first: '$total_score' },
            latest_score: { $last: '$total_score' },
            count: { $sum: 1 },
          },
        },
        { $match: { count: { $gte: 2 } } },
        {
          $project: {
            improved: { $cond: [{ $lt: ['$latest_score', '$first_score'] }, 1, 0] },
            first_score: 1,
            latest_score: 1,
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            improved: { $sum: '$improved' },
            avg_first_score: { $avg: '$first_score' },
            avg_latest_score: { $avg: '$latest_score' },
          },
        },
      ]),
      // Average baseline screening score
      this.screeningModel.aggregate([
        {
          $match: {
            is_baseline: true,
            total_score: { $exists: true },
            deleted_at: { $exists: false },
          },
        },
        { $group: { _id: null, avg_baseline: { $avg: '$total_score' } } },
      ]),
      // Exercise engagement — group by category (exercise_type doesn't exist in patient backend)
      this.copingSessionModel.aggregate([
        { $match: { completed: true, deleted_at: { $exists: false } } },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            avg_craving_reduction: {
              $avg: { $subtract: ['$craving_before', '$craving_after'] },
            },
          },
        },
        { $sort: { count: -1 } },
      ]),
      // Peer assignment statistics
      this.peerAssignmentModel.aggregate([
        { $match: { deleted_at: { $exists: false } } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const riskImprovementData = riskImprovement[0] || { total: 0, improved: 0, avg_first_score: null, avg_latest_score: null };

    return {
      enrollment: {
        total: totalEnrolled,
        completed,
        graduated,
        avg_days_in_program: Math.round(avgDaysInProgram[0]?.avg || 0),
      },
      substances: substanceBreakdown,
      risk_improvement: {
        total_tracked: riskImprovementData.total,
        improved: riskImprovementData.improved,
        improvement_rate:
          riskImprovementData.total > 0
            ? Math.round(
                (riskImprovementData.improved / riskImprovementData.total) * 100,
              )
            : 0,
        avg_first_score: riskImprovementData.avg_first_score != null
          ? Math.round(riskImprovementData.avg_first_score * 10) / 10
          : null,
        avg_latest_score: riskImprovementData.avg_latest_score != null
          ? Math.round(riskImprovementData.avg_latest_score * 10) / 10
          : null,
      },
      avg_baseline_score: screeningImprovement[0]?.avg_baseline || null,
      exercise_engagement: exerciseEngagement.map((e: any) => ({
        _id: e._id || 'General',
        count: e.count,
        avg_effectiveness: e.avg_craving_reduction != null
          ? Math.round(e.avg_craving_reduction * 10) / 10
          : null,
      })),
      peer_assignments: peerAssignmentStats.reduce(
        (acc, s) => ({ ...acc, [s._id]: s.count }),
        {},
      ),
    };
  }

  async exportOutcomes(format: 'json' | 'csv' = 'json') {
    // Fetch all profiles with user data for export
    const profiles = await this.profileModel
      .find({ deleted_at: { $exists: false } })
      .populate('user', 'email profile.first_name profile.last_name profile.gender profile.date_of_birth')
      .lean();

    if (format === 'csv') {
      const headers = [
        'Patient ID',
        'Name',
        'Email',
        'Status',
        'Care Level',
        'Primary Substance',
        'Enrolled At',
        'Sobriety Start',
        'Longest Sobriety (days)',
        'Total Relapses',
        'Risk Level',
        'Risk Score',
        'Screening Score (Enrollment)',
        'Screening Score (Current)',
        'Days in Program',
        'Appointments Attended',
        'Appointments Missed',
        'Milestones Achieved',
      ];

      const rows = profiles.map((p: any) => {
        const user = p.user || {};
        const prof = user.profile || {};
        const primary = (p.substance_use_history || []).find(
          (s: any) => s.is_primary,
        );
        return [
          user._id?.toString() || '',
          `${prof.first_name || ''} ${prof.last_name || ''}`.trim(),
          user.email || '',
          p.status || '',
          p.care_level || '',
          primary?.substance || '',
          p.enrolled_at ? new Date(p.enrolled_at).toISOString() : '',
          p.sobriety_start_date
            ? new Date(p.sobriety_start_date).toISOString()
            : '',
          p.longest_sobriety_days || 0,
          p.total_relapse_count || 0,
          p.current_risk_level || '',
          p.current_risk_score || 0,
          p.outcomes?.screening_score_at_enrollment || '',
          p.outcomes?.screening_score_current || '',
          p.outcomes?.days_in_program || 0,
          p.outcomes?.appointments_attended || 0,
          p.outcomes?.appointments_missed || 0,
          p.outcomes?.milestones_achieved || 0,
        ].join(',');
      });

      return {
        format: 'csv',
        content: [headers.join(','), ...rows].join('\n'),
        filename: `recovery-outcomes-${new Date().toISOString().split('T')[0]}.csv`,
      };
    }

    return {
      format: 'json',
      content: profiles,
      filename: `recovery-outcomes-${new Date().toISOString().split('T')[0]}.json`,
    };
  }

  // ─── Patient Activity Report ───────────────────────────────────────

  async getPatientActivityReport(patientId: string) {
    const userId = new Types.ObjectId(patientId);

    // Fetch profile with user data
    const profile = await this.profileModel
      .findOne({ user: userId, deleted_at: { $exists: false } })
      .populate('user', 'email profile status')
      .populate('enrolled_by', 'profile.first_name profile.last_name')
      .lean();

    if (!profile) return null;

    // Fetch all recovery data in parallel
    const [
      plans,
      screenings,
      sobrietyLogs,
      milestones,
      crisisEvents,
      riskReports,
      copingExercises,
      appointments,
      ekaConversations,
    ] = await Promise.all([
      this.planModel
        .find({ user: userId, deleted_at: { $exists: false } })
        .sort({ created_at: -1 })
        .lean(),
      this.screeningModel
        .find({ user: userId, deleted_at: { $exists: false } })
        .populate('administered_by', 'profile.first_name profile.last_name')
        .sort({ created_at: -1 })
        .lean(),
      this.sobrietyLogModel
        .find({ user: userId, deleted_at: { $exists: false } })
        .sort({ log_date: -1 })
        .lean(),
      this.milestoneModel
        .find({ user: userId, achieved_at: { $exists: true } })
        .sort({ achieved_at: -1 })
        .lean(),
      this.crisisModel
        .find({ user: userId })
        .populate('resolved_by', 'profile.first_name profile.last_name')
        .sort({ created_at: -1 })
        .lean(),
      this.riskReportModel
        .find({ user: userId })
        .sort({ created_at: -1 })
        .limit(30)
        .lean(),
      this.copingSessionModel
        .find({ user: userId, deleted_at: { $exists: false } })
        .sort({ created_at: -1 })
        .lean(),
      // Appointments from shared DB
      this.connection.collection('appointments')
        .find({ patient: userId })
        .sort({ created_at: -1 })
        .limit(50)
        .toArray(),
      // Eka conversations from shared DB
      this.connection.collection('eka_conversations')
        .find({ user: userId })
        .sort({ created_at: -1 })
        .limit(20)
        .toArray(),
    ]);

    // Build patient activities timeline
    const patientActivities: any[] = [];

    // Sobriety check-ins
    sobrietyLogs.forEach((log: any) => {
      patientActivities.push({
        type: 'check_in',
        label: 'Daily Check-in',
        date: log.log_date,
        detail: `Sober: ${log.sober_today ? 'Yes' : 'No'} | Mood: ${log.mood_score ?? '—'}/10 | Craving: ${log.craving_intensity ?? '—'}/10`,
        data: {
          sober: log.sober_today,
          mood: log.mood_score,
          craving: log.craving_intensity,
          triggers: log.triggers_encountered,
          coping: log.coping_strategies_used,
        },
      });
    });

    // Screenings
    const instrumentLabels = { audit: 'AUDIT', dast10: 'DAST-10', cage: 'CAGE', assist: 'ASSIST' };
    screenings.forEach((s: any) => {
      const admin = s.administered_by;
      const adminName = admin?.profile
        ? `${admin.profile.first_name || ''} ${admin.profile.last_name || ''}`.trim()
        : null;
      patientActivities.push({
        type: 'screening',
        label: `${instrumentLabels[s.instrument] || s.instrument || 'Screening'} Completed`,
        date: s.created_at,
        detail: `Score: ${s.total_score} | Risk: ${s.risk_level}${s.is_baseline ? ' (Baseline)' : ''}`,
        data: { score: s.total_score, risk_level: s.risk_level, administered_by: adminName || 'Self' },
      });
    });

    // Coping exercises
    copingExercises.forEach((e: any) => {
      patientActivities.push({
        type: 'exercise',
        label: e.name || 'Coping Exercise',
        date: e.completed_at || e.created_at,
        detail: `Category: ${e.category?.replace(/_/g, ' ')} | ${e.completed ? 'Completed' : 'In Progress'}`,
        data: { category: e.category, completed: e.completed },
      });
    });

    // Milestones
    milestones.forEach((m: any) => {
      patientActivities.push({
        type: 'milestone',
        label: m.milestone_name || m.milestone_type?.replace(/_/g, ' '),
        date: m.achieved_at,
        detail: m.celebration_message || `${m.milestone_type?.replace(/_/g, ' ')} milestone achieved`,
        data: { reward_points: m.reward_points },
      });
    });

    // Eka companion sessions
    ekaConversations.forEach((c: any) => {
      patientActivities.push({
        type: 'companion_session',
        label: 'Eka Companion Session',
        date: c.created_at,
        detail: `${c.messages?.length || 0} messages`,
        data: { message_count: c.messages?.length || 0 },
      });
    });

    // Sort all patient activities by date descending
    patientActivities.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    // Build specialist activities
    const specialistActivities: any[] = [];

    // Appointments (specialist actions)
    for (const appt of appointments) {
      let specialistName = '—';
      if (appt.specialist) {
        const specialist = await this.connection.collection('users')
          .findOne({ _id: appt.specialist }, { projection: { 'profile.first_name': 1, 'profile.last_name': 1 } });
        if (specialist?.profile) {
          specialistName = `${specialist.profile.first_name || ''} ${specialist.profile.last_name || ''}`.trim();
        }
      }
      specialistActivities.push({
        type: 'appointment',
        label: `${appt.appointment_type || 'Appointment'}`,
        date: appt.scheduled_date || appt.date || appt.created_at,
        detail: `Status: ${appt.status} | Specialist: ${specialistName}`,
        data: {
          status: appt.status,
          specialist: specialistName,
          appointment_type: appt.appointment_type,
          meeting_type: appt.meeting_type,
        },
      });
    }

    // Crisis events (specialist responses)
    crisisEvents.forEach((c: any) => {
      const resolverName = c.resolved_by?.profile
        ? `${c.resolved_by.profile.first_name || ''} ${c.resolved_by.profile.last_name || ''}`.trim()
        : null;
      specialistActivities.push({
        type: 'crisis_response',
        label: `Crisis: ${c.crisis_type?.replace(/_/g, ' ')}`,
        date: c.created_at,
        detail: `Severity: ${c.severity} | Status: ${c.status}${resolverName ? ` | Resolved by: ${resolverName}` : ''}`,
        data: {
          severity: c.severity,
          status: c.status,
          resolved_by: resolverName,
        },
      });
    });

    // Risk assessments (system/specialist generated)
    riskReports.forEach((r: any) => {
      specialistActivities.push({
        type: 'risk_assessment',
        label: 'Risk Assessment',
        date: r.created_at,
        detail: `Score: ${r.score}/100 | Level: ${r.level} | Direction: ${r.trend?.direction || 'stable'}`,
        data: { score: r.score, level: r.level, direction: r.trend?.direction },
      });
    });

    // Sort specialist activities by date descending
    specialistActivities.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    // Compute summary stats
    const soberDays = sobrietyLogs.filter((l: any) => l.sober_today).length;
    const totalLogDays = sobrietyLogs.length;
    const completedExercises = copingExercises.filter((e: any) => e.completed).length;
    const avgMood = sobrietyLogs.length > 0
      ? Math.round(sobrietyLogs.reduce((sum: number, l: any) => sum + (l.mood_score || 0), 0) / sobrietyLogs.length * 10) / 10
      : null;
    const avgCraving = sobrietyLogs.length > 0
      ? Math.round(sobrietyLogs.reduce((sum: number, l: any) => sum + (l.craving_intensity || 0), 0) / sobrietyLogs.length * 10) / 10
      : null;

    // Normalize plan data for the report
    const stageNameMap = {
      assessment: 'Assessment', detox: 'Detox', stabilization: 'Stabilisation',
      active_treatment: 'Active Treatment', maintenance: 'Maintenance', aftercare: 'Aftercare',
    };
    const normalizedPlans = plans.map((plan: any) => {
      const stages = (plan.stages || []).map((s: any) => ({
        name: stageNameMap[s.name] || s.name?.replace(/_/g, ' '),
        status: s.status,
        goals: (s.goals || []).map((g: any) => ({
          description: g.description,
          measurable_target: g.measurable_target,
          status: g.status,
          achieved_at: g.achieved_at,
        })),
      }));
      return { plan_name: plan.plan_name, status: plan.status, stages };
    });

    return {
      profile: {
        name: profile.user?.['profile']
          ? `${profile.user['profile'].first_name || ''} ${profile.user['profile'].last_name || ''}`.trim()
          : 'Unknown',
        email: profile.user?.['email'] || '',
        status: profile.status,
        care_level: profile.care_level,
        risk_level: profile.current_risk_level,
        risk_score: profile.current_risk_score,
        enrolled_at: profile.enrolled_at,
        sobriety_start_date: profile.sobriety_start_date,
        substances: profile.substance_use_history,
      },
      summary: {
        total_check_ins: totalLogDays,
        sober_days: soberDays,
        sobriety_rate: totalLogDays > 0 ? Math.round((soberDays / totalLogDays) * 100) : 0,
        total_screenings: screenings.length,
        total_exercises: copingExercises.length,
        completed_exercises: completedExercises,
        total_milestones: milestones.length,
        total_crises: crisisEvents.length,
        total_appointments: appointments.length,
        total_companion_sessions: ekaConversations.length,
        avg_mood: avgMood,
        avg_craving: avgCraving,
      },
      plans: normalizedPlans,
      patient_activities: patientActivities,
      specialist_activities: specialistActivities,
      generated_at: new Date(),
    };
  }

  // ─── Withdrawal Assessments ──────────────────────────────────────

  private static WITHDRAWAL_INSTRUMENTS = ['cows', 'ciwa_ar'];
  private static WITHDRAWAL_LABELS = { cows: 'COWS', ciwa_ar: 'CIWA-Ar' };
  private static WITHDRAWAL_MAX_SCORES = { cows: 48, ciwa_ar: 67 };

  async getWithdrawalOverview() {
    const instruments = RecoveryAdminService.WITHDRAWAL_INSTRUMENTS;

    const [totalAssessments, byCOWS, byCIWA, severityAgg, recentAssessments] =
      await Promise.all([
        this.screeningModel.countDocuments({
          instrument: { $in: instruments },
          deleted_at: { $exists: false },
        }),
        this.screeningModel.countDocuments({
          instrument: 'cows',
          deleted_at: { $exists: false },
        }),
        this.screeningModel.countDocuments({
          instrument: 'ciwa_ar',
          deleted_at: { $exists: false },
        }),
        this.screeningModel.aggregate([
          {
            $match: {
              instrument: { $in: instruments },
              deleted_at: { $exists: false },
            },
          },
          { $group: { _id: '$risk_level', count: { $sum: 1 } } },
        ]),
        this.screeningModel
          .find({
            instrument: { $in: instruments },
            deleted_at: { $exists: false },
          })
          .populate('user', 'profile.first_name profile.last_name email')
          .populate(
            'administered_by',
            'profile.first_name profile.last_name',
          )
          .sort({ created_at: -1 })
          .limit(10)
          .lean(),
      ]);

    const severityDistribution: Record<string, number> = {};
    severityAgg.forEach((s: any) => {
      severityDistribution[s._id] = s.count;
    });

    // Unique patients
    const uniquePatients = await this.screeningModel.distinct('user', {
      instrument: { $in: instruments },
      deleted_at: { $exists: false },
    });

    // Average scores by instrument
    const avgScoresAgg = await this.screeningModel.aggregate([
      {
        $match: {
          instrument: { $in: instruments },
          deleted_at: { $exists: false },
        },
      },
      {
        $group: {
          _id: '$instrument',
          avg_score: { $avg: '$total_score' },
          max_score: { $max: '$total_score' },
          min_score: { $min: '$total_score' },
        },
      },
    ]);
    const avgScores: Record<string, any> = {};
    avgScoresAgg.forEach((a: any) => {
      avgScores[a._id] = {
        avg: Math.round(a.avg_score * 10) / 10,
        max: a.max_score,
        min: a.min_score,
      };
    });

    // 30-day trend
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const trendAgg = await this.screeningModel.aggregate([
      {
        $match: {
          instrument: { $in: instruments },
          deleted_at: { $exists: false },
          created_at: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            date: {
              $dateToString: { format: '%Y-%m-%d', date: '$created_at' },
            },
            instrument: '$instrument',
          },
          count: { $sum: 1 },
          avg_score: { $avg: '$total_score' },
        },
      },
      { $sort: { '_id.date': 1 } },
    ]);

    const labels = RecoveryAdminService.WITHDRAWAL_LABELS;
    const maxScores = RecoveryAdminService.WITHDRAWAL_MAX_SCORES;

    return {
      total_assessments: totalAssessments,
      by_instrument: {
        cows: byCOWS,
        ciwa_ar: byCIWA,
      },
      unique_patients: uniquePatients.length,
      severity_distribution: severityDistribution,
      avg_scores: avgScores,
      trend_30d: trendAgg.map((t: any) => ({
        date: t._id.date,
        instrument: t._id.instrument,
        instrument_label: labels[t._id.instrument] || t._id.instrument,
        count: t.count,
        avg_score: Math.round(t.avg_score * 10) / 10,
      })),
      recent_assessments: recentAssessments.map((a: any) => {
        const admin = a.administered_by;
        const adminName = admin?.profile
          ? `${admin.profile.first_name || ''} ${admin.profile.last_name || ''}`.trim()
          : null;
        return {
          _id: a._id,
          instrument: a.instrument,
          instrument_label: labels[a.instrument] || a.instrument,
          max_possible_score: maxScores[a.instrument],
          total_score: a.total_score,
          risk_level: a.risk_level,
          risk_zone_label: a.risk_zone_label,
          patient: a.user,
          administered_by_name: adminName || 'Unknown',
          created_at: a.created_at,
        };
      }),
    };
  }

  async getWithdrawalAssessments(filters: {
    instrument?: string;
    risk_level?: string;
    patient_search?: string;
    page: number;
    limit: number;
  }) {
    const instruments = RecoveryAdminService.WITHDRAWAL_INSTRUMENTS;
    const labels = RecoveryAdminService.WITHDRAWAL_LABELS;
    const maxScores = RecoveryAdminService.WITHDRAWAL_MAX_SCORES;

    const query: any = {
      instrument: filters.instrument
        ? filters.instrument
        : { $in: instruments },
      deleted_at: { $exists: false },
    };
    if (filters.risk_level) {
      query.risk_level = filters.risk_level;
    }

    const skip = (filters.page - 1) * filters.limit;

    const [rawData, total] = await Promise.all([
      this.screeningModel
        .find(query)
        .populate('user', 'profile.first_name profile.last_name email')
        .populate(
          'administered_by',
          'profile.first_name profile.last_name',
        )
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(filters.limit)
        .lean(),
      this.screeningModel.countDocuments(query),
    ]);

    const data = rawData.map((a: any) => {
      const admin = a.administered_by;
      const adminName = admin?.profile
        ? `${admin.profile.first_name || ''} ${admin.profile.last_name || ''}`.trim()
        : null;
      return {
        _id: a._id,
        instrument: a.instrument,
        instrument_label: labels[a.instrument] || a.instrument,
        max_possible_score: maxScores[a.instrument],
        total_score: a.total_score,
        risk_level: a.risk_level,
        risk_zone_label: a.risk_zone_label,
        screening_type: a.screening_type,
        substances_identified: a.substances_identified,
        answers: a.answers,
        is_baseline: a.is_baseline,
        patient: a.user,
        administered_by_name: adminName || 'Unknown',
        created_at: a.created_at,
      };
    });

    return {
      data,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        pages: Math.ceil(total / filters.limit),
      },
    };
  }
}
