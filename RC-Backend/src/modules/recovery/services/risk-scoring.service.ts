import { Injectable, Logger } from '@nestjs/common';
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
  RecoveryJournal,
  RecoveryJournalDocument,
} from '../entities/recovery-journal.entity';
import {
  AddictionScreening,
  AddictionScreeningDocument,
} from '../entities/addiction-screening.entity';
import {
  CrisisEvent,
  CrisisEventDocument,
} from '../entities/crisis-event.entity';
import {
  CopingExerciseSession,
  CopingExerciseSessionDocument,
} from '../entities/coping-exercise-session.entity';
import { Vital, VitalDocument } from '../../vitals/entities/vital.entity';
import {
  Appointment,
  AppointmentDocument,
} from '../../appointments/entities/appointment.entity';
import {
  Prescription,
  PrescriptionDocument,
} from '../../prescriptions/entities/prescription.entity';
import { Drug, DrugDocument } from '../../pharmacy/entities/drug.entity';
import {
  HealthCheckup,
  HealthCheckupDocument,
} from '../../health-checkup/entities/health-checkup.entity';
import {
  CategoryScore,
  RiskBreakdownResponse,
  RiskCalculationResult,
  RiskHistoryEntry,
  RiskTrend,
  SignalDetail,
  TopFactor,
} from '../dto/risk-score.dto';
import {
  ACTIVITY_BASELINE_LOOKBACK_DAYS,
  BATCH_SIZE,
  BEHAVIORAL_LOOKBACK_DAYS,
  CategoryWeights,
  CLINICAL_CRISIS_LOOKBACK_DAYS,
  COPING_DIVERSITY_LOOKBACK_DAYS,
  COPING_EXERCISE_RATE_LOOKBACK_DAYS,
  DEFAULT_CATEGORY_WEIGHTS,
  JOURNAL_LOOKBACK_DAYS,
  MAT_DRUG_GENERIC_NAMES,
  PHYSIOLOGICAL_LOOKBACK_DAYS,
  PSYCH_DRUG_CATEGORIES,
  redistributeWeights,
  RELAPSE_FREQUENCY_LOOKBACK_DAYS,
  RISK_HISTORY_MAX_ENTRIES,
  SCREENING_MAX_SCORES,
  scoreToLevel,
  SELF_REPORTED_LOOKBACK_DAYS,
} from '../constants/risk-thresholds';

@Injectable()
export class RiskScoringService {
  private readonly logger = new Logger(RiskScoringService.name);

  constructor(
    @InjectModel(RecoveryProfile.name)
    private profileModel: Model<RecoveryProfileDocument>,
    @InjectModel(SobrietyLog.name)
    private sobrietyLogModel: Model<SobrietyLogDocument>,
    @InjectModel(RecoveryJournal.name)
    private journalModel: Model<RecoveryJournalDocument>,
    @InjectModel(AddictionScreening.name)
    private screeningModel: Model<AddictionScreeningDocument>,
    @InjectModel(CrisisEvent.name)
    private crisisEventModel: Model<CrisisEventDocument>,
    @InjectModel(CopingExerciseSession.name)
    private copingSessionModel: Model<CopingExerciseSessionDocument>,
    @InjectModel(Vital.name)
    private vitalModel: Model<VitalDocument>,
    @InjectModel(Appointment.name)
    private appointmentModel: Model<AppointmentDocument>,
    @InjectModel(Prescription.name)
    private prescriptionModel: Model<PrescriptionDocument>,
    @InjectModel(Drug.name)
    private drugModel: Model<DrugDocument>,
    @InjectModel(HealthCheckup.name)
    private healthCheckupModel: Model<HealthCheckupDocument>,
  ) {}

  // ─── Public API ─────────────────────────────────────────────────

  /**
   * Calculate the risk score and persist it to the RecoveryProfile.
   * Returns the full result including whether a threshold was crossed.
   */
  async calculateAndPersistRisk(
    userId: string,
  ): Promise<RiskCalculationResult> {
    const result = await this.calculateRiskScore(userId);

    // Persist to profile
    const uid = new Types.ObjectId(userId);
    await this.profileModel.updateOne(
      {
        user: uid,
        status: { $ne: RecoveryStatus.ARCHIVED },
        deleted_at: { $exists: false },
      },
      {
        $set: {
          current_risk_score: result.score,
          current_risk_level: result.level,
          risk_updated_at: result.calculated_at,
        },
        $push: {
          risk_history: {
            $each: [
              {
                score: result.score,
                level: result.level,
                calculated_at: result.calculated_at,
                signals: {
                  self_reported: result.signals.self_reported.score,
                  behavioral: result.signals.behavioral.score,
                  physiological: result.signals.physiological.score,
                  clinical: result.signals.clinical.score,
                  contextual: result.signals.contextual.score,
                },
              },
            ],
            $slice: -RISK_HISTORY_MAX_ENTRIES,
          },
        },
      },
    );

    return result;
  }

  /**
   * Calculate the risk score without persisting (for Eka on-demand queries).
   */
  async calculateRiskScore(userId: string): Promise<RiskCalculationResult> {
    const uid = new Types.ObjectId(userId);

    const profile = await this.profileModel
      .findOne({
        user: uid,
        status: { $ne: RecoveryStatus.ARCHIVED },
        deleted_at: { $exists: false },
      })
      .lean();

    if (!profile) {
      return this.emptyResult();
    }

    // Gather all sub-scores in parallel
    const [selfReported, behavioral, physiological, clinical, contextual] =
      await Promise.all([
        this.calculateSelfReportedScore(uid),
        this.calculateBehavioralScore(uid, profile),
        this.calculatePhysiologicalScore(uid),
        this.calculateClinicalScore(uid, profile),
        this.calculateContextualScore(uid, profile),
      ]);

    // Determine which categories have data
    const availableCategories: (keyof CategoryWeights)[] = ['self_reported', 'behavioral', 'clinical', 'contextual'];
    if (physiological.details.length > 0) {
      availableCategories.push('physiological');
    }

    const weights = availableCategories.includes('physiological')
      ? DEFAULT_CATEGORY_WEIGHTS
      : redistributeWeights(DEFAULT_CATEGORY_WEIGHTS, availableCategories);

    // Apply weights
    selfReported.weight = weights.self_reported;
    selfReported.weighted = Math.round(selfReported.score * weights.self_reported);
    behavioral.weight = weights.behavioral;
    behavioral.weighted = Math.round(behavioral.score * weights.behavioral);
    physiological.weight = weights.physiological;
    physiological.weighted = Math.round(physiological.score * weights.physiological);
    clinical.weight = weights.clinical;
    clinical.weighted = Math.round(clinical.score * weights.clinical);
    contextual.weight = weights.contextual;
    contextual.weighted = Math.round(contextual.score * weights.contextual);

    // Composite score
    const rawScore =
      selfReported.score * weights.self_reported +
      behavioral.score * weights.behavioral +
      physiological.score * weights.physiological +
      clinical.score * weights.clinical +
      contextual.score * weights.contextual;

    const score = Math.round(Math.min(100, Math.max(0, rawScore)));
    const level = scoreToLevel(score);

    const previousScore = profile.current_risk_score || 0;
    const previousLevel = profile.current_risk_level || 'low';

    const thresholdCrossed = level !== previousLevel;
    let direction: 'up' | 'down' | 'same' = 'same';
    if (score > previousScore) direction = 'up';
    else if (score < previousScore) direction = 'down';

    return {
      score,
      level,
      previous_score: previousScore,
      previous_level: previousLevel,
      calculated_at: new Date(),
      signals: {
        self_reported: selfReported,
        behavioral,
        physiological,
        clinical,
        contextual,
      },
      threshold_crossed: thresholdCrossed,
      direction,
    };
  }

  /**
   * Get the cached risk breakdown for display (reads from profile, adds trend + top factors).
   */
  async getRiskBreakdown(userId: string): Promise<RiskBreakdownResponse> {
    const uid = new Types.ObjectId(userId);

    const profile = await this.profileModel
      .findOne({
        user: uid,
        status: { $ne: RecoveryStatus.ARCHIVED },
        deleted_at: { $exists: false },
      })
      .lean();

    if (!profile || !profile.risk_updated_at) {
      // No cached score — calculate fresh
      const result = await this.calculateRiskScore(userId);
      const trend = this.calculateTrend(profile?.risk_history || [], result.score);
      const topFactors = this.extractTopFactors(result.signals);

      return {
        score: result.score,
        level: result.level,
        previous_score: result.previous_score,
        updated_at: result.calculated_at,
        signals: result.signals,
        trend,
        top_factors: topFactors,
        risk_history: ((profile?.risk_history || []) as any[]).slice(-7),
      };
    }

    // Re-calculate to get fresh signal breakdown (since we only store sub-scores in history)
    const result = await this.calculateRiskScore(userId);
    const trend = this.calculateTrend(profile.risk_history || [], result.score);
    const topFactors = this.extractTopFactors(result.signals);

    return {
      score: result.score,
      level: result.level,
      previous_score: profile.current_risk_score || 0,
      updated_at: profile.risk_updated_at,
      signals: result.signals,
      trend,
      top_factors: topFactors,
      risk_history: ((profile.risk_history || []) as any[]).slice(-7),
    };
  }

  /**
   * Get risk history entries for chart display.
   */
  async getRiskHistory(
    userId: string,
    limit = 30,
    period?: '7d' | '30d' | '90d',
  ): Promise<RiskHistoryEntry[]> {
    const uid = new Types.ObjectId(userId);
    const profile = await this.profileModel
      .findOne({
        user: uid,
        status: { $ne: RecoveryStatus.ARCHIVED },
        deleted_at: { $exists: false },
      })
      .select('risk_history')
      .lean();

    if (!profile?.risk_history) return [];

    let history = profile.risk_history as RiskHistoryEntry[];

    if (period) {
      const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      history = history.filter(
        (h) => new Date(h.calculated_at) >= cutoff,
      );
    }

    return history.slice(-limit);
  }

  /**
   * Batch-recalculate risk for all active profiles. Called by the scheduler.
   */
  async batchRecalculate(): Promise<{ processed: number; errors: number }> {
    const profiles = await this.profileModel
      .find({
        status: RecoveryStatus.ACTIVE,
        deleted_at: { $exists: false },
      })
      .select('user')
      .lean();

    let processed = 0;
    let errors = 0;

    for (let i = 0; i < profiles.length; i += BATCH_SIZE) {
      const batch = profiles.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map((p) =>
          this.calculateAndPersistRisk(p.user.toString()),
        ),
      );

      for (const r of results) {
        if (r.status === 'fulfilled') processed++;
        else {
          errors++;
          this.logger.error(
            `Risk calculation failed: ${r.reason?.message || r.reason}`,
          );
        }
      }
    }

    return { processed, errors };
  }

  // ─── Self-Reported Category (0.25) ──────────────────────────────

  private async calculateSelfReportedScore(
    uid: Types.ObjectId,
  ): Promise<CategoryScore> {
    const details: SignalDetail[] = [];
    const cutoff = this.daysAgo(SELF_REPORTED_LOOKBACK_DAYS);

    // Get recent sobriety logs
    const logs = await this.sobrietyLogModel
      .find({ user: uid, log_date: { $gte: cutoff } })
      .sort({ log_date: -1 })
      .lean();

    if (logs.length === 0) {
      return { score: 0, weight: 0, weighted: 0, details };
    }

    // Recency-weighted averages (most recent logs weighted higher)
    const avgMood = this.recencyWeightedAvg(logs, 'mood_score');
    const avgCraving = this.recencyWeightedAvg(logs, 'craving_intensity');
    const avgAnxiety = this.recencyWeightedAvg(logs, 'anxiety_level');
    const avgSleepQuality = this.recencyWeightedAvg(logs, 'sleep_quality');
    const avgSleepHours = this.recencyWeightedAvg(logs, 'sleep_hours');

    // Mood deficit: (10 - avg_mood) × 10
    const moodDeficit = avgMood != null ? Math.round((10 - avgMood) * 10) : 0;
    details.push({
      name: 'mood_deficit',
      value: Math.max(0, moodDeficit),
      max: 90,
      label: 'Mood deficit',
    });

    // Craving score: avg_craving × 10
    const cravingScore = avgCraving != null ? Math.round(avgCraving * 10) : 0;
    details.push({
      name: 'craving_score',
      value: Math.min(100, Math.max(0, cravingScore)),
      max: 100,
      label: 'Craving intensity',
    });

    // Anxiety score: avg_anxiety × 10
    const anxietyScore = avgAnxiety != null ? Math.round(avgAnxiety * 10) : 0;
    details.push({
      name: 'anxiety_score',
      value: Math.min(100, Math.max(0, anxietyScore)),
      max: 100,
      label: 'Anxiety level',
    });

    // Sleep deficit: (10 - quality) × 5 + hours penalty
    let sleepDeficit = 0;
    if (avgSleepQuality != null) sleepDeficit += (10 - avgSleepQuality) * 5;
    if (avgSleepHours != null) {
      if (avgSleepHours < 5) sleepDeficit += 20;
      else if (avgSleepHours < 6) sleepDeficit += 10;
    }
    details.push({
      name: 'sleep_deficit',
      value: Math.min(65, Math.max(0, Math.round(sleepDeficit))),
      max: 65,
      label: 'Sleep deficit',
    });

    // Relapse day: any day in the window where sober_today === false
    const relapseDay = logs.some((l) => l.sober_today === false) ? 40 : 0;
    details.push({
      name: 'relapse_day',
      value: relapseDay,
      max: 40,
      label: 'Recent relapse reported',
    });

    // Journal risk flags (last 14 days)
    const journalCutoff = this.daysAgo(JOURNAL_LOOKBACK_DAYS);
    const recentJournals = await this.journalModel
      .find({
        user: uid,
        created_at: { $gte: journalCutoff },
        deleted_at: { $exists: false },
      })
      .select('ai_response structured_data')
      .lean();

    let journalFlagScore = 0;
    let journalCrisisScore = 0;
    for (const j of recentJournals) {
      const flags = (j as any).ai_response?.risk_flags;
      if (Array.isArray(flags)) {
        journalFlagScore += flags.length * 10;
      }
      if ((j as any).structured_data?.crisis_detected) {
        journalCrisisScore = 40;
      }
    }
    journalFlagScore = Math.min(30, journalFlagScore);

    details.push({
      name: 'journal_risk_flags',
      value: journalFlagScore,
      max: 30,
      label: 'AI-detected risk flags',
    });
    details.push({
      name: 'journal_crisis',
      value: journalCrisisScore,
      max: 40,
      label: 'Crisis detected in journal',
    });

    // Weighted combination using sub-weights
    const subWeighted =
      (details[0].value / details[0].max || 0) * 0.25 + // mood
      (details[1].value / details[1].max || 0) * 0.3 + // craving
      (details[2].value / details[2].max || 0) * 0.2 + // anxiety
      (details[3].value / (details[3].max || 1)) * 0.1 + // sleep
      (details[4].value / (details[4].max || 1)) * 0.1 + // relapse day
      ((journalFlagScore + journalCrisisScore) / 70) * 0.05; // journal

    const score = Math.round(Math.min(100, Math.max(0, subWeighted * 100)));

    return { score, weight: 0, weighted: 0, details };
  }

  // ─── Behavioral Category (0.25) ─────────────────────────────────

  private async calculateBehavioralScore(
    uid: Types.ObjectId,
    profile: any,
  ): Promise<CategoryScore> {
    const details: SignalDetail[] = [];
    let total = 0;

    // 1. Log gap days
    const latestLog = await this.sobrietyLogModel
      .findOne({ user: uid })
      .sort({ log_date: -1 })
      .select('log_date')
      .lean();

    let logGap = 3; // Default: assume 3+ days if no logs
    if (latestLog) {
      const diffMs = Date.now() - new Date(latestLog.log_date).getTime();
      logGap = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    }
    const logGapScore = logGap === 0 ? 0 : logGap === 1 ? 10 : logGap === 2 ? 20 : 30;
    total += logGapScore;
    details.push({ name: 'log_gap_days', value: logGapScore, max: 30, label: 'Days since last check-in' });

    // 2. Missed appointments (last 30 days)
    const apptCutoff = this.daysAgo(BEHAVIORAL_LOOKBACK_DAYS);
    const missedAppts = await this.appointmentModel.countDocuments({
      patient: uid,
      start_time: { $gte: apptCutoff },
      status: 'MISSED',
    });
    const missedApptScore = missedAppts === 0 ? 0 : missedAppts === 1 ? 10 : missedAppts === 2 ? 15 : 20;
    total += missedApptScore;
    details.push({ name: 'appointment_missed', value: missedApptScore, max: 20, label: 'Missed appointments' });

    // 3. Appointment no-show ratio
    const totalAppts = await this.appointmentModel.countDocuments({
      patient: uid,
      start_time: { $gte: apptCutoff },
      status: { $in: ['COMPLETED', 'MISSED'] },
    });
    let noShowScore = 0;
    if (totalAppts > 0) {
      const noShowRatio = missedAppts / totalAppts;
      if (noShowRatio > 0.5) noShowScore = 15;
      else if (noShowRatio > 0.3) noShowScore = 10;
    }
    total += noShowScore;
    details.push({ name: 'appointment_no_show', value: noShowScore, max: 15, label: 'No-show ratio' });

    // 4. Coping exercise rate (14 days)
    const exerciseCutoff = this.daysAgo(COPING_EXERCISE_RATE_LOOKBACK_DAYS);
    const exerciseCount = await this.copingSessionModel.countDocuments({
      user: uid,
      created_at: { $gte: exerciseCutoff },
      deleted_at: { $exists: false },
    });
    const exerciseRateScore = exerciseCount === 0 ? 15 : exerciseCount === 1 ? 5 : 0;
    total += exerciseRateScore;
    details.push({ name: 'coping_exercise_rate', value: exerciseRateScore, max: 15, label: 'Coping exercise frequency' });

    // 5. Coping exercise completion rate
    const exerciseSessions = await this.copingSessionModel
      .find({
        user: uid,
        created_at: { $gte: exerciseCutoff },
        deleted_at: { $exists: false },
      })
      .select('completed')
      .lean();

    let completionScore = 0;
    if (exerciseSessions.length > 0) {
      const completedCount = exerciseSessions.filter((s) => s.completed).length;
      const completionRate = completedCount / exerciseSessions.length;
      if (completionRate < 0.5) completionScore = 10;
    }
    total += completionScore;
    details.push({ name: 'coping_exercise_completion', value: completionScore, max: 10, label: 'Exercise completion rate' });

    // 6-8. From recent sobriety logs (last 7 logs)
    const recentLogs = await this.sobrietyLogModel
      .find({ user: uid })
      .sort({ log_date: -1 })
      .limit(7)
      .select('attended_meeting_or_session medications_taken exercised')
      .lean();

    if (recentLogs.length > 0) {
      // Meeting attendance
      const meetingsAttended = recentLogs.filter((l) => l.attended_meeting_or_session).length;
      const meetingScore = meetingsAttended === 0 ? 10 : meetingsAttended < 2 ? 5 : 0;
      total += meetingScore;
      details.push({ name: 'meeting_attendance', value: meetingScore, max: 10, label: 'Meeting/session attendance' });

      // Medication adherence
      const medsTaken = recentLogs.filter((l) => l.medications_taken).length;
      // Only score if the patient is prescribed medications
      const hasMedsPrescribed = (profile.outcomes?.medications_prescribed?.length || 0) > 0;
      const medScore = hasMedsPrescribed && medsTaken === 0 ? 15 : 0;
      total += medScore;
      details.push({ name: 'medication_adherence', value: medScore, max: 15, label: 'Medication adherence' });

      // Physical activity
      const exercisedDays = recentLogs.filter((l) => l.exercised).length;
      const activityScore = exercisedDays === 0 ? 5 : 0;
      total += activityScore;
      details.push({ name: 'physical_activity', value: activityScore, max: 5, label: 'Physical activity' });
    } else {
      details.push({ name: 'meeting_attendance', value: 0, max: 10, label: 'Meeting/session attendance' });
      details.push({ name: 'medication_adherence', value: 0, max: 15, label: 'Medication adherence' });
      details.push({ name: 'physical_activity', value: 0, max: 5, label: 'Physical activity' });
    }

    const score = Math.min(100, Math.max(0, total));
    return { score, weight: 0, weighted: 0, details };
  }

  // ─── Physiological Category (0.15) ──────────────────────────────

  private async calculatePhysiologicalScore(
    uid: Types.ObjectId,
  ): Promise<CategoryScore> {
    const details: SignalDetail[] = [];
    let total = 0;

    // Get vital signs for this user
    const vitals = await this.vitalModel
      .findOne({ userId: uid.toString() })
      .lean();

    if (!vitals) {
      // Fall back to sobriety log energy data only
      const recentLogs = await this.sobrietyLogModel
        .find({ user: uid })
        .sort({ log_date: -1 })
        .limit(PHYSIOLOGICAL_LOOKBACK_DAYS)
        .select('energy_level')
        .lean();

      if (recentLogs.length > 0) {
        const avgEnergy = this.simpleAvg(recentLogs, 'energy_level');
        let energyScore = 0;
        if (avgEnergy != null) {
          if (avgEnergy < 3) energyScore = 15;
          else if (avgEnergy < 5) energyScore = 10;
        }
        total += energyScore;
        details.push({ name: 'energy_deficit', value: energyScore, max: 15, label: 'Low energy level' });
      }

      // Return with empty details to signal no vitals data
      return { score: Math.min(100, total), weight: 0, weighted: 0, details };
    }

    const lookbackDate = this.daysAgo(PHYSIOLOGICAL_LOOKBACK_DAYS);

    // 1. Sleep deterioration
    const sleepEntries = this.getRecentVitalEntries(vitals, 'sleep', lookbackDate);
    if (sleepEntries.length > 0) {
      const avgSleep = sleepEntries.reduce((s, e) => s + parseFloat(e.value) || 0, 0) / sleepEntries.length;
      let sleepScore = 0;
      if (avgSleep < 5) sleepScore = 20;
      else if (avgSleep < 6) sleepScore = 10;
      // Check trend (declining)
      if (sleepEntries.length >= 3) {
        const recent = sleepEntries.slice(0, Math.ceil(sleepEntries.length / 2));
        const older = sleepEntries.slice(Math.ceil(sleepEntries.length / 2));
        const recentAvg = recent.reduce((s, e) => s + (parseFloat(e.value) || 0), 0) / recent.length;
        const olderAvg = older.reduce((s, e) => s + (parseFloat(e.value) || 0), 0) / older.length;
        if (recentAvg < olderAvg - 0.5) sleepScore = Math.max(sleepScore, 25);
      }
      total += sleepScore;
      details.push({ name: 'sleep_deterioration', value: sleepScore, max: 25, label: 'Sleep deterioration' });
    }

    // 2. Stress level
    const stressEntries = this.getRecentVitalEntries(vitals, 'stress_level', lookbackDate);
    if (stressEntries.length > 0) {
      const avgStress = stressEntries.reduce((s, e) => s + (parseFloat(e.value) || 0), 0) / stressEntries.length;
      let stressScore = 0;
      if (avgStress > 7) stressScore = 25;
      else if (avgStress > 5) stressScore = 15;
      else if (avgStress > 3) stressScore = 5;
      total += stressScore;
      details.push({ name: 'stress_level', value: stressScore, max: 25, label: 'Elevated stress' });
    }

    // 3. Heart rate elevation
    const pulseEntries = this.getRecentVitalEntries(vitals, 'pulse_rate', lookbackDate);
    if (pulseEntries.length > 0) {
      const avgPulse = pulseEntries.reduce((s, e) => s + (parseFloat(e.value) || 0), 0) / pulseEntries.length;
      let hrScore = 0;
      if (avgPulse > 100) hrScore = 15;
      else if (avgPulse > 90) hrScore = 10;
      total += hrScore;
      details.push({ name: 'heart_rate_elevation', value: hrScore, max: 15, label: 'Elevated heart rate' });
    }

    // 4. Blood pressure change
    const bpEntries = this.getRecentVitalEntries(vitals, 'blood_pressure', lookbackDate);
    if (bpEntries.length >= 2) {
      // BP format: "120/80"
      const systolics = bpEntries
        .map((e) => parseInt(e.value?.split('/')[0]))
        .filter((v) => !isNaN(v));
      if (systolics.length >= 2) {
        const recentSys = systolics[0];
        const baselineSys = systolics.reduce((a, b) => a + b, 0) / systolics.length;
        const bpScore = Math.abs(recentSys - baselineSys) > 15 ? 10 : 0;
        total += bpScore;
        details.push({ name: 'blood_pressure_change', value: bpScore, max: 10, label: 'Blood pressure variation' });
      }
    }

    // 5. Activity decline
    const baselineLookback = this.daysAgo(ACTIVITY_BASELINE_LOOKBACK_DAYS);
    const activeMinEntries = this.getRecentVitalEntries(vitals, 'active_minutes', baselineLookback);
    const stepsEntries = this.getRecentVitalEntries(vitals, 'steps', baselineLookback);

    if (activeMinEntries.length >= 4 || stepsEntries.length >= 4) {
      const entries = activeMinEntries.length >= stepsEntries.length ? activeMinEntries : stepsEntries;
      const midpoint = Math.floor(entries.length / 2);
      const recentHalf = entries.slice(0, midpoint);
      const olderHalf = entries.slice(midpoint);

      const recentAvg = recentHalf.reduce((s, e) => s + (parseFloat(e.value) || 0), 0) / recentHalf.length;
      const olderAvg = olderHalf.reduce((s, e) => s + (parseFloat(e.value) || 0), 0) / olderHalf.length;

      let activityScore = 0;
      if (olderAvg > 0) {
        const dropPct = (olderAvg - recentAvg) / olderAvg;
        if (dropPct >= 0.5) activityScore = 15;
        else if (dropPct >= 0.3) activityScore = 10;
      }
      total += activityScore;
      details.push({ name: 'activity_decline', value: activityScore, max: 15, label: 'Activity level decline' });
    }

    // 6. Energy deficit (from sobriety logs)
    const recentLogs = await this.sobrietyLogModel
      .find({ user: uid })
      .sort({ log_date: -1 })
      .limit(7)
      .select('energy_level')
      .lean();

    if (recentLogs.length > 0) {
      const avgEnergy = this.simpleAvg(recentLogs, 'energy_level');
      let energyScore = 0;
      if (avgEnergy != null) {
        if (avgEnergy < 3) energyScore = 15;
        else if (avgEnergy < 5) energyScore = 10;
      }
      total += energyScore;
      details.push({ name: 'energy_deficit', value: energyScore, max: 15, label: 'Low energy level' });
    }

    const score = Math.min(100, Math.max(0, total));
    return { score, weight: 0, weighted: 0, details };
  }

  // ─── Clinical Category (0.20) ───────────────────────────────────

  private async calculateClinicalScore(
    uid: Types.ObjectId,
    profile: any,
  ): Promise<CategoryScore> {
    const details: SignalDetail[] = [];
    let total = 0;

    // 1. Latest screening score (normalized)
    const latestScreening = await this.screeningModel
      .findOne({ user: uid, deleted_at: { $exists: false } })
      .sort({ created_at: -1 })
      .select('total_score instrument created_at')
      .lean();

    if (latestScreening) {
      const maxScore = SCREENING_MAX_SCORES[(latestScreening as any).instrument] || 40;
      const normalized = Math.round(((latestScreening as any).total_score / maxScore) * 50);
      total += Math.min(50, normalized);
      details.push({ name: 'screening_score', value: Math.min(50, normalized), max: 50, label: 'Latest screening score' });

      // 2. Screening trajectory (compare last 2)
      const previousScreening = await this.screeningModel
        .findOne({
          user: uid,
          deleted_at: { $exists: false },
          _id: { $ne: latestScreening._id },
        })
        .sort({ created_at: -1 })
        .select('total_score instrument')
        .lean();

      if (previousScreening && (previousScreening as any).instrument === (latestScreening as any).instrument) {
        const diff = (latestScreening as any).total_score - (previousScreening as any).total_score;
        let trajectoryScore = 0;
        if (diff > 0) trajectoryScore = 15; // Worsened
        else if (diff < 0) trajectoryScore = -10; // Improved (protective)
        total += trajectoryScore;
        details.push({ name: 'screening_trajectory', value: Math.max(0, trajectoryScore), max: 15, label: 'Screening score trajectory' });
      }

      // 8. Screening staleness
      const daysSinceScreening = Math.floor(
        (Date.now() - new Date((latestScreening as any).created_at).getTime()) / (1000 * 60 * 60 * 24),
      );
      let stalenessScore = 0;
      if (daysSinceScreening > 180) stalenessScore = 10;
      else if (daysSinceScreening > 90) stalenessScore = 5;
      total += stalenessScore;
      details.push({ name: 'screening_staleness', value: stalenessScore, max: 10, label: 'Screening overdue' });
    }

    // 3. Crisis events (last 30 days)
    const crisisCutoff = this.daysAgo(CLINICAL_CRISIS_LOOKBACK_DAYS);
    const crisisEvents = await this.crisisEventModel
      .find({ user: uid, created_at: { $gte: crisisCutoff } })
      .select('severity')
      .lean();

    let crisisScore = 0;
    if (crisisEvents.length === 1) crisisScore = 15;
    else if (crisisEvents.length >= 2) crisisScore = 25;
    // Severity modifier
    const hasLifeThreatening = crisisEvents.some(
      (e) => (e as any).severity === 'life_threatening',
    );
    const hasHigh = crisisEvents.some((e) => (e as any).severity === 'high');
    if (hasLifeThreatening) crisisScore += 15;
    else if (hasHigh) crisisScore += 10;
    crisisScore = Math.min(40, crisisScore);
    total += crisisScore;
    details.push({ name: 'crisis_events_30d', value: crisisScore, max: 40, label: 'Recent crisis events' });

    // 4. Relapse recency
    const relapseDates = (profile.relapse_dates || []).map(
      (d: any) => new Date(d),
    );
    let relapseRecencyScore = 0;
    if (relapseDates.length > 0) {
      const lastRelapse = Math.max(...relapseDates.map((d: Date) => d.getTime()));
      const daysSince = Math.floor(
        (Date.now() - lastRelapse) / (1000 * 60 * 60 * 24),
      );
      if (daysSince < 7) relapseRecencyScore = 25;
      else if (daysSince < 14) relapseRecencyScore = 15;
      else if (daysSince < 30) relapseRecencyScore = 10;
      else if (daysSince < 60) relapseRecencyScore = 5;
    }
    total += relapseRecencyScore;
    details.push({ name: 'relapse_recency', value: relapseRecencyScore, max: 25, label: 'Days since last relapse' });

    // 5. Relapse frequency (90 days)
    const relapseFreqCutoff = this.daysAgo(RELAPSE_FREQUENCY_LOOKBACK_DAYS);
    const recentRelapses = relapseDates.filter(
      (d: Date) => d >= relapseFreqCutoff,
    ).length;
    let relapseFreqScore = 0;
    if (recentRelapses >= 3) relapseFreqScore = 15;
    else if (recentRelapses === 2) relapseFreqScore = 10;
    else if (recentRelapses === 1) relapseFreqScore = 5;
    total += relapseFreqScore;
    details.push({ name: 'relapse_frequency_90d', value: relapseFreqScore, max: 15, label: 'Relapse frequency (90d)' });

    // 6. Psychiatric / MAT medication gap
    const psychMedGapScore = await this.calculatePsychMedGap(uid);
    total += psychMedGapScore;
    details.push({ name: 'psych_med_gap', value: psychMedGapScore, max: 15, label: 'Medication refill gap' });

    // 7. Health checkup triage
    const recentCheckup = await this.healthCheckupModel
      .findOne({
        user: uid,
        deleted_at: { $exists: false },
      })
      .sort({ created_at: -1 })
      .select('response')
      .lean();

    let triageScore = 0;
    if (recentCheckup) {
      const triageLevel = (recentCheckup as any).response?.data?.triage_level;
      if (triageLevel === 'emergency' || triageLevel === 'emergency_ambulance') {
        triageScore = 10;
      } else if (triageLevel === 'consultation' || triageLevel === 'consultation_24') {
        triageScore = 5;
      }
    }
    total += triageScore;
    details.push({ name: 'health_checkup_triage', value: triageScore, max: 10, label: 'Health checkup urgency' });

    const score = Math.min(100, Math.max(0, total));
    return { score, weight: 0, weighted: 0, details };
  }

  // ─── Contextual Category (0.15) ─────────────────────────────────

  private async calculateContextualScore(
    uid: Types.ObjectId,
    profile: any,
  ): Promise<CategoryScore> {
    const details: SignalDetail[] = [];
    let total = 0;

    // 1. Early recovery
    const sobrietyDays = profile.sobriety_start_date
      ? Math.floor(
          (Date.now() - new Date(profile.sobriety_start_date).getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 0;
    let earlyRecoveryScore = 0;
    if (sobrietyDays < 30) earlyRecoveryScore = 25;
    else if (sobrietyDays < 90) earlyRecoveryScore = 15;
    else if (sobrietyDays < 180) earlyRecoveryScore = 5;
    total += earlyRecoveryScore;
    details.push({ name: 'early_recovery', value: earlyRecoveryScore, max: 25, label: 'Early recovery phase' });

    // 2. Care level
    let careLevelScore = 0;
    const careLevel = profile.care_level;
    if (careLevel === 'detox') careLevelScore = 20;
    else if (careLevel === 'intensive_outpatient') careLevelScore = 10;
    else if (careLevel === 'outpatient') careLevelScore = 5;
    total += careLevelScore;
    details.push({ name: 'care_level', value: careLevelScore, max: 20, label: 'Care intensity level' });

    // 3. Trigger exposure (7-day average)
    const triggerCutoff = this.daysAgo(SELF_REPORTED_LOOKBACK_DAYS);
    const triggerLogs = await this.sobrietyLogModel
      .find({ user: uid, log_date: { $gte: triggerCutoff } })
      .select('triggers_encountered')
      .lean();

    let triggerScore = 0;
    if (triggerLogs.length > 0) {
      const avgTriggers =
        triggerLogs.reduce((s, l) => s + (l.triggers_encountered?.length || 0), 0) /
        triggerLogs.length;
      if (avgTriggers > 3) triggerScore = 20;
      else if (avgTriggers > 2) triggerScore = 15;
      else if (avgTriggers > 1) triggerScore = 10;
    }
    total += triggerScore;
    details.push({ name: 'trigger_exposure', value: triggerScore, max: 20, label: 'Trigger exposure frequency' });

    // 4. Substance severity (years of primary substance use)
    const primarySubstance = (profile.substance_use_history || []).find(
      (s: any) => s.is_primary,
    );
    let severityScore = 0;
    if (primarySubstance?.years_of_use) {
      if (primarySubstance.years_of_use > 10) severityScore = 15;
      else if (primarySubstance.years_of_use > 5) severityScore = 10;
      else if (primarySubstance.years_of_use > 2) severityScore = 5;
    }
    total += severityScore;
    details.push({ name: 'substance_severity', value: severityScore, max: 15, label: 'Substance use severity' });

    // 5. Previous treatment attempts
    let treatmentScore = 0;
    if (primarySubstance?.previous_treatment_attempts) {
      if (primarySubstance.previous_treatment_attempts > 3) treatmentScore = 10;
      else if (primarySubstance.previous_treatment_attempts > 1) treatmentScore = 5;
    }
    total += treatmentScore;
    details.push({ name: 'previous_treatment_attempts', value: treatmentScore, max: 10, label: 'Prior treatment attempts' });

    // 6. Coping diversity (unique exercise categories in 30 days)
    const diversityCutoff = this.daysAgo(COPING_DIVERSITY_LOOKBACK_DAYS);
    const exercises = await this.copingSessionModel
      .find({
        user: uid,
        created_at: { $gte: diversityCutoff },
        deleted_at: { $exists: false },
      })
      .select('category')
      .lean();

    const uniqueCategories = new Set(exercises.map((e) => e.category));
    let diversityScore = 0;
    if (uniqueCategories.size === 0) diversityScore = 10;
    else if (uniqueCategories.size === 1) diversityScore = 5;
    total += diversityScore;
    details.push({ name: 'coping_diversity', value: diversityScore, max: 10, label: 'Coping strategy diversity' });

    const score = Math.min(100, Math.max(0, total));
    return { score, weight: 0, weighted: 0, details };
  }

  // ─── Helpers ────────────────────────────────────────────────────

  private async calculatePsychMedGap(uid: Types.ObjectId): Promise<number> {
    // Find prescriptions with psychiatric/MAT drugs for this patient
    const prescriptions = await this.prescriptionModel
      .find({ patient: uid.toString() })
      .sort({ created_at: -1 })
      .limit(10)
      .populate('items.drug', 'generic_name categories')
      .lean();

    if (!prescriptions.length) return 0;

    // Check if any prescribed drug is psychiatric/MAT
    for (const rx of prescriptions) {
      for (const item of (rx as any).items || []) {
        const drug = item.drug as any;
        if (!drug) continue;

        const isMAT =
          MAT_DRUG_GENERIC_NAMES.some(
            (name) => drug.generic_name?.toLowerCase()?.includes(name),
          ) ||
          (drug.categories || []).some((cat: string) =>
            PSYCH_DRUG_CATEGORIES.includes(cat as any),
          );

        if (isMAT && item.period) {
          // Check if the prescription period has lapsed without a refill
          const rxDate = new Date((rx as any).created_at);
          const periodDays = this.periodToDays(item.period);
          const expectedRefillBy = new Date(
            rxDate.getTime() + periodDays * 2 * 1000 * 60 * 60 * 24,
          );

          if (new Date() > expectedRefillBy) {
            // Check for a newer prescription of the same drug
            const hasRefill = prescriptions.some(
              (otherRx: any) =>
                otherRx._id.toString() !== (rx as any)._id.toString() &&
                new Date(otherRx.created_at) > rxDate &&
                otherRx.items?.some(
                  (otherItem: any) =>
                    otherItem.drug?._id?.toString() === drug._id?.toString(),
                ),
            );

            if (!hasRefill) return 15;
          }
        }
      }
    }

    return 0;
  }

  private periodToDays(period: { number?: number; unit?: string }): number {
    const num = period.number || 7;
    const unit = (period.unit || 'days').toLowerCase();
    if (unit.startsWith('week')) return num * 7;
    if (unit.startsWith('month')) return num * 30;
    return num; // days
  }

  private getRecentVitalEntries(
    vitals: any,
    field: string,
    since: Date,
  ): { value: string; updatedAt: Date }[] {
    const entries = vitals[field];
    if (!Array.isArray(entries)) return [];
    return entries
      .filter((e: any) => e.updatedAt && new Date(e.updatedAt) >= since)
      .sort(
        (a: any, b: any) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
  }

  private recencyWeightedAvg(
    logs: any[],
    field: string,
  ): number | null {
    const values = logs
      .map((l, i) => ({
        val: l[field],
        weight: Math.pow(0.85, i), // Most recent = highest weight
      }))
      .filter((v) => v.val != null && !isNaN(v.val));

    if (values.length === 0) return null;

    const weightedSum = values.reduce((s, v) => s + v.val * v.weight, 0);
    const totalWeight = values.reduce((s, v) => s + v.weight, 0);
    return weightedSum / totalWeight;
  }

  private simpleAvg(docs: any[], field: string): number | null {
    const values = docs
      .map((d) => d[field])
      .filter((v) => v != null && !isNaN(v));
    if (values.length === 0) return null;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private daysAgo(days: number): Date {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d;
  }

  private calculateTrend(
    history: any[],
    currentScore: number,
  ): RiskTrend {
    const now = Date.now();
    const h7 = history.filter(
      (h) => now - new Date(h.calculated_at).getTime() < 7 * 24 * 60 * 60 * 1000,
    );
    const h30 = history.filter(
      (h) => now - new Date(h.calculated_at).getTime() < 30 * 24 * 60 * 60 * 1000,
    );

    const avg7 = h7.length > 0 ? h7.reduce((s, h) => s + h.score, 0) / h7.length : currentScore;
    const avg30 = h30.length > 0 ? h30.reduce((s, h) => s + h.score, 0) / h30.length : currentScore;

    const change7d = Math.round(currentScore - avg7);
    const change30d = Math.round(currentScore - avg30);

    let direction: 'up' | 'down' | 'stable' = 'stable';
    if (change7d > 3) direction = 'up';
    else if (change7d < -3) direction = 'down';

    return { direction, change_7d: change7d, change_30d: change30d };
  }

  private extractTopFactors(
    signals: RiskCalculationResult['signals'],
  ): TopFactor[] {
    const allSignals: {
      signal: string;
      label: string;
      category: string;
      contribution: number;
      weight: number;
    }[] = [];

    for (const [catName, catScore] of Object.entries(signals)) {
      for (const detail of catScore.details) {
        if (detail.value > 0) {
          allSignals.push({
            signal: detail.name,
            label: detail.label,
            category: catName,
            contribution: Math.round(detail.value * catScore.weight),
            weight: catScore.weight,
          });
        }
      }
    }

    // Sort by weighted contribution (highest first)
    allSignals.sort((a, b) => b.contribution - a.contribution);

    const recommendations: Record<string, string> = {
      craving_score: 'Try a coping exercise like urge surfing or box breathing',
      mood_deficit: 'Consider journaling or talking to Eka about how you feel',
      anxiety_score: 'Practice grounding exercises or deep breathing',
      sleep_deficit: 'Establish a consistent sleep routine; avoid screens before bed',
      sleep_deterioration: 'Track your sleep patterns and discuss with your care team',
      stress_level: 'Try a mindfulness exercise or take a short walk',
      relapse_day: 'Reach out to your support network immediately',
      log_gap_days: 'Complete your daily check-in to stay on track',
      appointment_missed: 'Schedule a follow-up appointment with your specialist',
      appointment_no_show: 'Set reminders for upcoming appointments',
      coping_exercise_rate: 'Try a guided exercise through Eka',
      medication_adherence: 'Set medication reminders; talk to your prescriber if experiencing side effects',
      meeting_attendance: 'Attend a support meeting or group session',
      crisis_events_30d: 'Work with your care team on a safety plan',
      relapse_recency: 'Focus on your coping plan and stay connected to your support network',
      psych_med_gap: 'Check if your medication prescription needs a refill',
      screening_staleness: 'Complete a follow-up screening assessment',
      early_recovery: 'The first months are hardest — lean on your support system',
      trigger_exposure: 'Identify and plan for high-risk situations',
      energy_deficit: 'Prioritize rest, nutrition, and light physical activity',
      heart_rate_elevation: 'Monitor your vitals and report changes to your care team',
      activity_decline: 'Try adding short walks or light exercise to your daily routine',
    };

    return allSignals.slice(0, 5).map((s) => ({
      signal: s.signal,
      label: s.label,
      category: s.category,
      contribution: s.contribution,
      recommendation: recommendations[s.signal] || 'Talk to Eka or your care team about this',
    }));
  }

  private emptyResult(): RiskCalculationResult {
    const emptyCat: CategoryScore = {
      score: 0,
      weight: 0,
      weighted: 0,
      details: [],
    };
    return {
      score: 0,
      level: 'low',
      previous_score: 0,
      previous_level: 'low',
      calculated_at: new Date(),
      signals: {
        self_reported: { ...emptyCat },
        behavioral: { ...emptyCat },
        physiological: { ...emptyCat },
        clinical: { ...emptyCat },
        contextual: { ...emptyCat },
      },
      threshold_crossed: false,
      direction: 'same',
    };
  }
}
