import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import Anthropic from '@anthropic-ai/sdk';
import {
  DrEkaDailyDigest,
  DrEkaDailyDigestDocument,
} from '../entities/daily-digest.entity';
import {
  DrEkaWeeklyReport,
  DrEkaWeeklyReportDocument,
} from '../entities/weekly-report.entity';
import {
  DrEkaMonthlyReport,
  DrEkaMonthlyReportDocument,
} from '../entities/monthly-report.entity';
import { DrEkaDataService } from './dr-eka-data.service';
import { NotificationOrchestratorService } from '../../notifications/services/notification-orchestrator.service';
import {
  NotificationType,
  NotificationPriority,
  NotificationChannel,
  UserTypeNotification,
} from '../../notifications/types/notification.types';
import { buildDailyDigestPrompt } from '../prompts/daily-prompt';
import { buildWeeklyReportPrompt } from '../prompts/weekly-prompt';
import { buildMonthlyReportPrompt } from '../prompts/monthly-prompt';
import { DrEkaEmailService } from './dr-eka-email.service';
import { User, UserDocument } from '../../users/entities/user.entity';

@Injectable()
export class DrEkaService {
  private readonly logger = new Logger(DrEkaService.name);
  private claudeClient: Anthropic | null = null;

  constructor(
    @InjectModel(DrEkaDailyDigest.name)
    private digestModel: Model<DrEkaDailyDigestDocument>,
    @InjectModel(DrEkaWeeklyReport.name)
    private weeklyReportModel: Model<DrEkaWeeklyReportDocument>,
    @InjectModel(DrEkaMonthlyReport.name)
    private monthlyReportModel: Model<DrEkaMonthlyReportDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly drEkaDataService: DrEkaDataService,
    private readonly notificationOrchestrator: NotificationOrchestratorService,
    private readonly emailService: DrEkaEmailService,
  ) {
    this.initializeClaudeClient();
  }

  private initializeClaudeClient(): void {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey) {
      this.claudeClient = new Anthropic({ apiKey });
      this.logger.log('Claude AI client initialized for Dr. Eka');
    } else {
      this.logger.warn(
        'ANTHROPIC_API_KEY not found, Dr. Eka AI features will be disabled',
      );
    }
  }

  /**
   * Generate daily digest for a single patient
   */
  async generateDailyDigest(
    userId: Types.ObjectId,
  ): Promise<DrEkaDailyDigest> {
    if (!this.claudeClient) {
      throw new Error('Claude AI client not initialized');
    }

    const startTime = Date.now();

    // Build full patient context from data service
    const patientContext =
      await this.drEkaDataService.buildPatientContext(userId);
    const firstName = patientContext.patient?.first_name || 'there';

    // Build the prompt
    const prompt = buildDailyDigestPrompt(patientContext, firstName);

    // Call Claude
    const response = await this.claudeClient.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = response.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude');
    }

    const parsed = this.parseAIResponse(textContent.text);
    const processingTime = Date.now() - startTime;
    const totalTokens =
      (response.usage?.input_tokens || 0) +
      (response.usage?.output_tokens || 0);

    // Determine today's date (start of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Upsert the daily digest (one per user per day)
    const digest = await this.digestModel.findOneAndUpdate(
      { user: userId, date: today },
      {
        user: userId,
        date: today,
        items: (parsed.items || []).map((item: any) => ({
          type: item.type || 'observation',
          title: item.title || 'Health Update',
          content: item.content || '',
          action_text: item.action_text || undefined,
          action_url: item.action_url || undefined,
          category: item.category || undefined,
          priority: item.priority || 'medium',
          icon: item.icon || undefined,
        })),
        travel_alert: parsed.travel_alert || { detected: false },
        health_joke: parsed.health_joke || undefined,
        summary: parsed.summary || `Good morning, ${firstName}!`,
        ai_metadata: {
          model: 'claude-sonnet-4-20250514',
          tokens: totalTokens,
          time_ms: processingTime,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    // Send push notification via OneSignal
    try {
      await this.notificationOrchestrator.sendNotification({
        userId: userId.toString(),
        user_type: UserTypeNotification.PATIENT,
        type: NotificationType.DR_EKA_DAILY_DIGEST,
        title: 'Good morning! Dr. Eka has your daily health update',
        message:
          parsed.summary ||
          `${firstName}, your personalized health digest is ready.`,
        data: { digestId: digest._id?.toString() },
        action_url: '/app/patient/dr-eka',
        priority: NotificationPriority.MEDIUM,
        channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
      });
    } catch (error) {
      this.logger.warn(
        `Failed to send daily digest notification for user ${userId}: ${error.message}`,
      );
    }

    // Send email
    try {
      const user = await this.userModel.findById(userId).select('profile.contact.email profile.first_name').lean();
      const email = (user as any)?.profile?.contact?.email;
      if (email) {
        await this.emailService.sendDailyDigestEmail(email, firstName, digest);
      }
    } catch (error) {
      this.logger.warn(`Failed to send daily digest email for user ${userId}: ${error.message}`);
    }

    this.logger.log(
      `Daily digest generated for user ${userId} (${parsed.items?.length || 0} items, ${processingTime}ms)`,
    );

    return digest;
  }

  /**
   * Generate weekly report for a single patient
   */
  async generateWeeklyReport(
    userId: Types.ObjectId,
  ): Promise<DrEkaWeeklyReport> {
    if (!this.claudeClient) {
      throw new Error('Claude AI client not initialized');
    }

    const startTime = Date.now();

    // Build full patient context
    const patientContext =
      await this.drEkaDataService.buildPatientContext(userId);
    const firstName = patientContext.patient?.first_name || 'there';

    // Build the prompt
    const prompt = buildWeeklyReportPrompt(patientContext, firstName);

    // Call Claude
    const response = await this.claudeClient.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = response.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude');
    }

    const parsed = this.parseAIResponse(textContent.text);
    const processingTime = Date.now() - startTime;
    const totalTokens =
      (response.usage?.input_tokens || 0) +
      (response.usage?.output_tokens || 0);

    // Determine week boundaries (Monday to Sunday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() + mondayOffset);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // Upsert the weekly report (one per user per week)
    const report = await this.weeklyReportModel.findOneAndUpdate(
      { user: userId, week_start: weekStart },
      {
        user: userId,
        week_start: weekStart,
        week_end: weekEnd,
        summary: parsed.summary || '',
        health_score: parsed.health_score || {
          current: 0,
          previous: 0,
          change: 0,
          trend: 'stable',
        },
        vitals_snapshot: parsed.vitals_snapshot || {},
        medications: (parsed.medications || []).map((med: any) => ({
          name: med.name || '',
          dose: med.dose || '',
          status: med.status || 'active',
          adherence_note: med.adherence_note || undefined,
        })),
        appointments: parsed.appointments || {
          completed: 0,
          upcoming: 0,
          overdue_follow_ups: 0,
        },
        recovery: parsed.recovery || undefined,
        recommendations: (parsed.recommendations || []).map((rec: any) => ({
          title: rec.title || '',
          content: rec.content || '',
          action_url: rec.action_url || undefined,
        })),
        health_news: (parsed.health_news || []).map((news: any) => ({
          title: news.title || '',
          summary: news.summary || '',
          relevance_note: news.relevance_note || undefined,
        })),
        doctors_note: parsed.doctors_note || '',
        ai_metadata: {
          model: 'claude-sonnet-4-20250514',
          tokens: totalTokens,
          time_ms: processingTime,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    // Send in-app notification
    try {
      await this.notificationOrchestrator.sendNotification({
        userId: userId.toString(),
        user_type: UserTypeNotification.PATIENT,
        type: NotificationType.DR_EKA_WEEKLY_REPORT,
        title: "Your weekly health report from Dr. Eka is ready",
        message: `${firstName}, I've prepared your comprehensive weekly health review. Take a look when you have a moment.`,
        data: { reportId: report._id?.toString() },
        action_url: '/app/patient/dr-eka/weekly',
        priority: NotificationPriority.MEDIUM,
        channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
      });
    } catch (error) {
      this.logger.warn(
        `Failed to send weekly report notification for user ${userId}: ${error.message}`,
      );
    }

    // Send email
    try {
      const user = await this.userModel.findById(userId).select('profile.contact.email profile.first_name').lean();
      const email = (user as any)?.profile?.contact?.email;
      if (email) {
        const sent = await this.emailService.sendWeeklyReportEmail(email, firstName, report);
        if (sent) {
          await this.weeklyReportModel.updateOne(
            { _id: report._id },
            { email_sent: true, email_sent_at: new Date() },
          );
        }
      }
    } catch (error) {
      this.logger.warn(`Failed to send weekly report email for user ${userId}: ${error.message}`);
    }

    this.logger.log(
      `Weekly report generated for user ${userId} (${processingTime}ms)`,
    );

    return report;
  }

  /**
   * Get today's digest for a user (from DB, not regenerate)
   */
  async getTodaysDigest(userId: string): Promise<DrEkaDailyDigest | null> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.digestModel
      .findOne({
        user: new Types.ObjectId(userId),
        date: today,
      })
      .lean();
  }

  /**
   * Get digest history (paginated)
   */
  async getDigestHistory(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ digests: DrEkaDailyDigest[]; total: number }> {
    const skip = (page - 1) * limit;

    const [digests, total] = await Promise.all([
      this.digestModel
        .find({ user: new Types.ObjectId(userId) })
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.digestModel.countDocuments({
        user: new Types.ObjectId(userId),
      }),
    ]);

    return { digests, total };
  }

  /**
   * Get latest weekly report
   */
  async getLatestWeeklyReport(
    userId: string,
  ): Promise<DrEkaWeeklyReport | null> {
    return this.weeklyReportModel
      .findOne({ user: new Types.ObjectId(userId) })
      .sort({ week_start: -1 })
      .lean();
  }

  /**
   * Get weekly report history (paginated)
   */
  async getWeeklyReports(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ reports: DrEkaWeeklyReport[]; total: number }> {
    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      this.weeklyReportModel
        .find({ user: new Types.ObjectId(userId) })
        .sort({ week_start: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.weeklyReportModel.countDocuments({
        user: new Types.ObjectId(userId),
      }),
    ]);

    return { reports, total };
  }

  /**
   * Parse Claude's JSON response, stripping markdown fences if present
   */
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // MONTHLY REPORT
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  async generateMonthlyReport(userId: Types.ObjectId): Promise<DrEkaMonthlyReport> {
    if (!this.claudeClient) throw new Error('Claude AI client not initialized');

    const startTime = Date.now();
    const patientContext = await this.drEkaDataService.buildPatientContext(userId);
    const firstName = patientContext.patient?.first_name || 'there';

    // Calculate month range (previous month)
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth(), 0); // last day of prev month
    const monthLabel = monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const prompt = buildMonthlyReportPrompt(patientContext, firstName, monthLabel);

    const response = await this.claudeClient.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 5000,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = response.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') throw new Error('No text response from Claude');

    const parsed = this.parseAIResponse(textContent.text);
    const processingTime = Date.now() - startTime;
    const totalTokens = (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);

    const report = await this.monthlyReportModel.findOneAndUpdate(
      { user: userId, month_start: monthStart },
      {
        user: userId,
        month_start: monthStart,
        month_end: monthEnd,
        month_label: monthLabel,
        executive_summary: parsed.executive_summary || '',
        health_score: parsed.health_score || {},
        vitals_summary: parsed.vitals_summary || {},
        activity_summary: parsed.activity_summary || {},
        medications: parsed.medications || [],
        appointments_summary: parsed.appointments_summary || {},
        checkups_summary: parsed.checkups_summary || {},
        recovery_summary: parsed.recovery_summary || undefined,
        achievements: parsed.achievements || [],
        goals_for_next_month: parsed.goals_for_next_month || [],
        health_news: parsed.health_news || [],
        doctors_note: parsed.doctors_note || '',
        ai_metadata: { model: 'claude-sonnet-4-20250514', tokens: totalTokens, time_ms: processingTime },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    // Notification
    try {
      await this.notificationOrchestrator.sendNotification({
        userId: userId.toString(),
        user_type: UserTypeNotification.PATIENT,
        type: NotificationType.DR_EKA_WEEKLY_REPORT, // reuse type
        title: `Your ${monthLabel} Health Report from Dr. Eka is ready`,
        message: `${firstName}, I've prepared your comprehensive monthly health review with achievements, goals, and insights.`,
        data: { reportId: report._id?.toString() },
        action_url: '/app/patient/dr-eka',
        priority: NotificationPriority.MEDIUM,
        channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH, NotificationChannel.EMAIL],
      });
    } catch (error) {
      this.logger.warn(`Failed to send monthly report notification: ${error.message}`);
    }

    // Email
    try {
      const user = await this.userModel.findById(userId).select('profile.contact.email').lean();
      const email = (user as any)?.profile?.contact?.email;
      if (email) {
        const sent = await this.emailService.sendWeeklyReportEmail(email, firstName, {
          ...report.toObject?.() || report,
          week_start: monthStart,
          week_end: monthEnd,
          summary: parsed.executive_summary,
        });
        if (sent) {
          await this.monthlyReportModel.updateOne({ _id: report._id }, { email_sent: true, email_sent_at: new Date() });
        }
      }
    } catch (error) {
      this.logger.warn(`Failed to send monthly report email: ${error.message}`);
    }

    this.logger.log(`Monthly report generated for user ${userId} — ${monthLabel} (${processingTime}ms)`);
    return report;
  }

  async getLatestMonthlyReport(userId: string): Promise<DrEkaMonthlyReport | null> {
    return this.monthlyReportModel
      .findOne({ user: new Types.ObjectId(userId) })
      .sort({ month_start: -1 })
      .lean();
  }

  async getMonthlyReports(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [reports, total] = await Promise.all([
      this.monthlyReportModel
        .find({ user: new Types.ObjectId(userId) })
        .sort({ month_start: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.monthlyReportModel.countDocuments({ user: new Types.ObjectId(userId) }),
    ]);
    return { reports, total };
  }

  private parseAIResponse(text: string): any {
    try {
      let jsonStr = text.trim();
      if (jsonStr.startsWith('```json')) jsonStr = jsonStr.slice(7);
      if (jsonStr.startsWith('```')) jsonStr = jsonStr.slice(3);
      if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3);

      return JSON.parse(jsonStr.trim());
    } catch (error) {
      this.logger.error(
        `Failed to parse Dr. Eka AI response: ${text.slice(0, 300)}`,
      );
      return {
        items: [],
        summary: 'Your health digest is being prepared.',
        health_joke: null,
      };
    }
  }
}
