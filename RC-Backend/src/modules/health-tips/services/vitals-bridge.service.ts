import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { OnEvent } from '@nestjs/event-emitter';
import { Vital, VitalDocument } from '../../vitals/entities/vital.entity';
import { SobrietyLog, SobrietyLogDocument } from '../../recovery/entities/sobriety-log.entity';

/**
 * Bridges data from recovery check-ins and other sources into the vitals system.
 * This ensures the platform's health data is fully integrated — recovery mood,
 * anxiety, sleep, and stress data appear as vitals for health insights.
 */
@Injectable()
export class VitalsBridgeService {
  private readonly logger = new Logger(VitalsBridgeService.name);

  constructor(
    @InjectModel(Vital.name) private vitalModel: Model<VitalDocument>,
    @InjectModel(SobrietyLog.name) private sobrietyLogModel: Model<SobrietyLogDocument>,
  ) {}

  /**
   * When a recovery check-in is logged, extract health-relevant data
   * and push it into the vitals system.
   */
  @OnEvent('recovery.checkin_logged')
  async syncRecoveryToVitals(payload: { userId: string }): Promise<void> {
    try {
      const userId = payload.userId;
      const userObjectId = new Types.ObjectId(userId);

      // Get the most recent sobriety log
      const latestLog = await this.sobrietyLogModel
        .findOne({ user: userObjectId })
        .sort({ log_date: -1 })
        .lean();

      if (!latestLog) {
        // Try string ID (some logs store user as string)
        const latestLogStr = await this.sobrietyLogModel
          .findOne({ user: userId as any })
          .sort({ log_date: -1 })
          .lean();
        if (!latestLogStr) return;
        await this.pushRecoveryVitals(userId, userObjectId, latestLogStr);
      } else {
        await this.pushRecoveryVitals(userId, userObjectId, latestLog);
      }
    } catch (error) {
      this.logger.error(`Failed to sync recovery data to vitals for ${payload.userId}: ${error.message}`);
    }
  }

  private async pushRecoveryVitals(userId: string, userObjectId: Types.ObjectId, log: any): Promise<void> {
    const now = new Date();
    const updates: Record<string, any> = {};

    // Mood score → mood_score vital (1-10)
    if (log.mood_score != null) {
      updates.mood_score = { value: log.mood_score, unit: '/10', updatedAt: now };
    }

    // Anxiety level → anxiety_level vital (1-10)
    if (log.anxiety_level != null) {
      updates.anxiety_level = { value: log.anxiety_level, unit: '/10', updatedAt: now };
    }

    // Craving intensity → craving_level vital (0-10)
    if (log.craving_intensity != null) {
      updates.craving_level = { value: log.craving_intensity, unit: '/10', updatedAt: now };
    }

    // Energy level → motivation_level vital (1-10)
    if (log.energy_level != null) {
      updates.motivation_level = { value: log.energy_level, unit: '/10', updatedAt: now };
    }

    // Derive stress_level from mood + anxiety (inverse mood, weighted with anxiety)
    // Low mood + high anxiety = high stress
    if (log.mood_score != null || log.anxiety_level != null) {
      const moodStress = log.mood_score != null ? (10 - log.mood_score) : null;
      const anxiety = log.anxiety_level ?? null;
      let stress: number;
      if (moodStress != null && anxiety != null) {
        stress = Math.round((moodStress * 0.4 + anxiety * 0.6) * 10) / 10;
      } else {
        stress = moodStress ?? anxiety ?? 5;
      }
      updates.stress_level = { value: Math.min(10, Math.max(0, stress)), unit: '/10', updatedAt: now };
    }

    // Sleep hours → sleep vital
    if (log.sleep_hours != null && log.sleep_hours > 0) {
      updates.sleep = { value: log.sleep_hours, unit: 'hours', updatedAt: now };
    }

    if (Object.keys(updates).length === 0) return;

    // Push all vitals in one operation
    const pushOps: Record<string, any> = {};
    for (const [key, value] of Object.entries(updates)) {
      pushOps[key] = value;
    }

    await this.vitalModel.updateOne(
      { userId: userObjectId },
      { $push: pushOps },
      { upsert: true },
    );

    const vitalTypes = Object.keys(updates);
    this.logger.log(
      `Synced recovery data to vitals for user ${userId}: ${vitalTypes.join(', ')}`,
    );
  }

  /**
   * One-time backfill: sync all historical recovery logs to vitals.
   * Call this once to populate existing data.
   */
  async backfillRecoveryVitals(userId: string): Promise<number> {
    const userObjectId = new Types.ObjectId(userId);
    const logs = await this.sobrietyLogModel
      .find({ $or: [{ user: userObjectId }, { user: userId as any }] })
      .sort({ log_date: 1 })
      .lean();

    let synced = 0;
    for (const log of logs) {
      const logDate = log.log_date || (log as any).created_at || new Date();
      const updates: Record<string, any> = {};

      if (log.mood_score != null) {
        updates.mood_score = { value: log.mood_score, unit: '/10', updatedAt: logDate };
      }
      if (log.anxiety_level != null) {
        updates.anxiety_level = { value: log.anxiety_level, unit: '/10', updatedAt: logDate };
      }
      if (log.craving_intensity != null) {
        updates.craving_level = { value: log.craving_intensity, unit: '/10', updatedAt: logDate };
      }
      if (log.energy_level != null) {
        updates.motivation_level = { value: log.energy_level, unit: '/10', updatedAt: logDate };
      }
      if (log.mood_score != null || log.anxiety_level != null) {
        const moodStress = log.mood_score != null ? (10 - log.mood_score) : null;
        const anxiety = log.anxiety_level ?? null;
        let stress = moodStress != null && anxiety != null
          ? Math.round((moodStress * 0.4 + anxiety * 0.6) * 10) / 10
          : (moodStress ?? anxiety ?? 5);
        updates.stress_level = { value: Math.min(10, Math.max(0, stress)), unit: '/10', updatedAt: logDate };
      }
      if (log.sleep_hours != null && log.sleep_hours > 0) {
        updates.sleep = { value: log.sleep_hours, unit: 'hours', updatedAt: logDate };
      }

      if (Object.keys(updates).length > 0) {
        const pushOps: Record<string, any> = {};
        for (const [key, value] of Object.entries(updates)) {
          pushOps[key] = value;
        }
        await this.vitalModel.updateOne(
          { userId: userObjectId },
          { $push: pushOps },
          { upsert: true },
        );
        synced++;
      }
    }

    this.logger.log(`Backfilled ${synced} recovery logs to vitals for user ${userId}`);
    return synced;
  }
}
