import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TrialSettings, TrialSettingsDocument } from './entities/trial-settings.entity';
import { TrialSession, TrialSessionDocument, TrialStatus } from './entities/trial-session.entity';
import { UpdateTrialSettingsDto } from './dto/update-trial-settings.dto';

@Injectable()
export class TrialAdminService {
  constructor(
    @InjectModel(TrialSettings.name)
    private trialSettingsModel: Model<TrialSettingsDocument>,
    @InjectModel(TrialSession.name)
    private trialSessionModel: Model<TrialSessionDocument>,
  ) {}

  // ============ SETTINGS ============

  async getSettings() {
    let settings = await this.trialSettingsModel.findOne().lean();
    if (!settings) {
      settings = await this.trialSettingsModel.create({});
      return settings.toObject ? settings.toObject() : settings;
    }
    return settings;
  }

  async updateSettings(dto: UpdateTrialSettingsDto) {
    const update: any = {};
    if (dto.eka_message_limit !== undefined) update.eka_message_limit = dto.eka_message_limit;
    if (dto.eka_enabled !== undefined) update.eka_enabled = dto.eka_enabled;

    let settings = await this.trialSettingsModel.findOne();
    if (!settings) {
      settings = await this.trialSettingsModel.create(update);
    } else {
      Object.assign(settings, update);
      await settings.save();
    }

    return settings;
  }

  // ============ TRIAL SESSIONS ============

  async listSessions(query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    feature?: string;
    sort?: string;
  }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (query.search) {
      const searchRegex = new RegExp(query.search, 'i');
      filter.$or = [
        { email: searchRegex },
        { first_name: searchRegex },
        { last_name: searchRegex },
      ];
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.feature) {
      switch (query.feature) {
        case 'symptom_checker':
          filter.symptom_checker_used = true;
          break;
        case 'rxgpt':
          filter.rxgpt_used = true;
          break;
        case 'prescription':
          filter.prescription_used = true;
          break;
        case 'eka_chat':
          filter.eka_chat_used = true;
          break;
      }
    }

    const sortField = query.sort || '-created_at';

    const [sessions, total] = await Promise.all([
      this.trialSessionModel
        .find(filter)
        .select('-token_hash -eka_messages')
        .sort(sortField)
        .skip(skip)
        .limit(limit)
        .lean(),
      this.trialSessionModel.countDocuments(filter),
    ]);

    return {
      sessions: sessions.map((s: any) => ({
        _id: s._id,
        email: s.email,
        first_name: s.first_name,
        last_name: s.last_name,
        status: s.status,
        ip_address: s.ip_address,
        features_used: {
          symptom_checker: s.symptom_checker_used || false,
          rxgpt: s.rxgpt_used || false,
          prescription: s.prescription_used || false,
          eka_chat: s.eka_chat_used || false,
        },
        eka_message_count: s.eka_message_count || 0,
        verified_at: s.verified_at,
        expires_at: s.expires_at,
        last_activity_at: s.last_activity_at,
        created_at: s.created_at,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getSession(id: string) {
    const session = await this.trialSessionModel
      .findById(id)
      .select('-token_hash')
      .lean();

    if (!session) {
      throw new NotFoundException('Trial session not found');
    }

    return session;
  }

  async updateSession(id: string, updates: {
    status?: string;
    eka_message_count?: number;
    extend_hours?: number;
  }) {
    const session = await this.trialSessionModel.findById(id);
    if (!session) {
      throw new NotFoundException('Trial session not found');
    }

    if (updates.status) {
      session.status = updates.status as TrialStatus;
    }

    if (updates.eka_message_count !== undefined) {
      (session as any).eka_message_count = updates.eka_message_count;
      // If resetting count, also reset eka_chat_used
      if (updates.eka_message_count === 0) {
        (session as any).eka_chat_used = false;
      }
    }

    if (updates.extend_hours) {
      const newExpiry = new Date(session.expires_at.getTime() + updates.extend_hours * 60 * 60 * 1000);
      session.expires_at = newExpiry;
      // If expired, re-verify
      if (session.status === TrialStatus.EXPIRED) {
        session.status = TrialStatus.VERIFIED;
      }
    }

    await session.save();
    return session;
  }

  async deleteSession(id: string) {
    const result = await this.trialSessionModel.findByIdAndDelete(id);
    if (!result) {
      throw new NotFoundException('Trial session not found');
    }
    return { success: true };
  }

  // ============ ANALYTICS ============

  async getAnalytics() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [totalStats, last30, last7, dailyTrend, statusBreakdown] = await Promise.all([
      this.trialSessionModel.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            verified: { $sum: { $cond: [{ $in: ['$status', ['verified', 'exhausted']] }, 1, 0] } },
            exhausted: { $sum: { $cond: [{ $eq: ['$status', 'exhausted'] }, 1, 0] } },
            symptom_checker: { $sum: { $cond: ['$symptom_checker_used', 1, 0] } },
            rxgpt: { $sum: { $cond: ['$rxgpt_used', 1, 0] } },
            prescription: { $sum: { $cond: ['$prescription_used', 1, 0] } },
            eka_chat: { $sum: { $cond: ['$eka_chat_used', 1, 0] } },
            eka_total_messages: { $sum: { $ifNull: ['$eka_message_count', 0] } },
          },
        },
      ]),
      this.trialSessionModel.countDocuments({ created_at: { $gte: thirtyDaysAgo } }),
      this.trialSessionModel.countDocuments({ created_at: { $gte: sevenDaysAgo } }),
      this.trialSessionModel.aggregate([
        { $match: { created_at: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } },
            count: { $sum: 1 },
            verified: { $sum: { $cond: [{ $in: ['$status', ['verified', 'exhausted']] }, 1, 0] } },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      this.trialSessionModel.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const stats = totalStats[0] || {
      total: 0, verified: 0, exhausted: 0,
      symptom_checker: 0, rxgpt: 0, prescription: 0,
      eka_chat: 0, eka_total_messages: 0,
    };

    return {
      overview: {
        total_requests: stats.total,
        total_verified: stats.verified,
        verification_rate: stats.total > 0 ? Math.round((stats.verified / stats.total) * 100) : 0,
        total_exhausted: stats.exhausted,
        last_30_days: last30,
        last_7_days: last7,
      },
      feature_usage: {
        symptom_checker: stats.symptom_checker,
        rxgpt: stats.rxgpt,
        prescription: stats.prescription,
        eka_chat: stats.eka_chat,
      },
      eka_engagement: {
        total_eka_users: stats.eka_chat,
        total_messages_sent: stats.eka_total_messages,
        avg_messages_per_user: stats.eka_chat > 0
          ? Math.round(stats.eka_total_messages / stats.eka_chat)
          : 0,
      },
      status_breakdown: statusBreakdown.reduce((acc: any, s: any) => {
        acc[s._id] = s.count;
        return acc;
      }, {}),
      daily_trend: dailyTrend,
    };
  }
}
