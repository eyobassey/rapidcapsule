import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Referral, ReferralDocument } from './entities/referral.entity';
import { ReferralClick, ReferralClickDocument } from './entities/referral-click.entity';
import { ReferralSettings, ReferralSettingsDocument } from './entities/referral-settings.entity';
import { UpdateReferralSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class ReferralsService {
  constructor(
    @InjectModel(Referral.name) private referralModel: Model<ReferralDocument>,
    @InjectModel(ReferralClick.name) private referralClickModel: Model<ReferralClickDocument>,
    @InjectModel(ReferralSettings.name) private referralSettingsModel: Model<ReferralSettingsDocument>,
  ) {}

  // Get all referrals with pagination
  async getAllReferrals(page: number = 1, limit: number = 20, search?: string, sortBy: string = 'total_signups') {
    const skip = (page - 1) * limit;
    const query: any = {};

    if (search) {
      query.$or = [{ referral_code: { $regex: search, $options: 'i' } }];
    }

    const sortOptions: any = {};
    sortOptions[sortBy] = -1;

    const [referrals, total] = await Promise.all([
      this.referralModel
        .find(query)
        .populate('referrer', 'profile.first_name profile.last_name email profile.profile_image')
        .populate('referrals.referee', 'profile.first_name profile.last_name email created_at')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      this.referralModel.countDocuments(query),
    ]);

    return {
      referrals,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: limit,
      },
    };
  }

  // Get referral by ID
  async getReferralById(id: string) {
    return this.referralModel
      .findById(id)
      .populate('referrer', 'profile.first_name profile.last_name email profile.profile_image')
      .populate('referrals.referee', 'profile.first_name profile.last_name email created_at')
      .lean();
  }

  // Get referral analytics
  async getAnalytics(startDate?: Date, endDate?: Date) {
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.created_at = { $gte: startDate };
    }
    if (endDate) {
      dateFilter.created_at = { ...dateFilter.created_at, $lte: endDate };
    }

    // Overall stats
    const overallStats = await this.referralModel.aggregate([
      {
        $group: {
          _id: null,
          total_referrers: { $sum: 1 },
          total_signups: { $sum: '$total_signups' },
          total_clicks: { $sum: '$total_clicks' },
          total_shares: { $sum: '$total_shares' },
          total_credits_earned: { $sum: '$total_credits_earned' },
          total_points_earned: { $sum: '$total_points_earned' },
        },
      },
    ]);

    // Top referrers
    const topReferrers = await this.referralModel
      .find({ total_signups: { $gt: 0 } })
      .populate('referrer', 'profile.first_name profile.last_name email profile.profile_image')
      .sort({ total_signups: -1 })
      .limit(10)
      .lean();

    // Clicks by source
    const clicksBySource = await this.referralClickModel.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 },
          conversions: { $sum: { $cond: ['$converted', 1, 0] } },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Signups over time (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const signupsOverTime = await this.referralClickModel.aggregate([
      {
        $match: {
          converted: true,
          converted_at: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$converted_at' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Clicks over time (last 30 days)
    const clicksOverTime = await this.referralClickModel.aggregate([
      {
        $match: {
          created_at: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Conversion rate
    const totalClicks = overallStats[0]?.total_clicks || 0;
    const totalSignups = overallStats[0]?.total_signups || 0;
    const conversionRate = totalClicks > 0 ? ((totalSignups / totalClicks) * 100).toFixed(2) : '0';

    return {
      overview: {
        total_referrers: overallStats[0]?.total_referrers || 0,
        total_signups: totalSignups,
        total_clicks: totalClicks,
        total_shares: overallStats[0]?.total_shares || 0,
        total_credits_earned: overallStats[0]?.total_credits_earned || 0,
        total_points_earned: overallStats[0]?.total_points_earned || 0,
        conversion_rate: conversionRate,
      },
      top_referrers: topReferrers,
      clicks_by_source: clicksBySource,
      signups_over_time: signupsOverTime,
      clicks_over_time: clicksOverTime,
    };
  }

  // Get settings
  async getSettings() {
    let settings = await this.referralSettingsModel.findOne().lean();
    if (!settings) {
      settings = await this.createDefaultSettings();
    }
    return settings;
  }

  // Update settings
  async updateSettings(updateDto: UpdateReferralSettingsDto, adminId: Types.ObjectId) {
    let settings = await this.referralSettingsModel.findOne();
    if (!settings) {
      settings = await this.createDefaultSettings();
    }

    const updateData: any = { ...updateDto, updated_by: adminId };

    return this.referralSettingsModel.findByIdAndUpdate(settings._id, updateData, { new: true }).lean();
  }

  // Create default settings
  private async createDefaultSettings() {
    const defaultSettings = {
      is_enabled: true,
      referrer_credits: 1,
      referee_credits: 1,
      referrer_points: 50,
      referee_points: 25,
      reward_on_signup: true,
      reward_on_first_appointment: false,
      share_messages: {
        whatsapp:
          "Hey! I've been using Rapid Capsule for my healthcare needs and it's been amazing. Sign up with my link and we both get free AI credits! 🏥✨ {link}",
        twitter:
          "I just discovered @RapidCapsule - the future of healthcare is here! Get your free AI health credits when you sign up: {link} #Healthcare #AI #Wellness",
        facebook:
          "Taking charge of my health with Rapid Capsule! Their AI-powered health insights are incredible. Join me and get free credits: {link}",
        linkedin:
          "Excited to share Rapid Capsule - an innovative telemedicine platform with AI-powered health analysis. Healthcare professionals and patients alike will appreciate this. Sign up here: {link}",
        email_subject: "I thought you'd love this - Free AI Health Credits!",
        email_body:
          "Hi there!\n\nI've been using Rapid Capsule for my healthcare needs and wanted to share it with you. It's a fantastic telemedicine platform with AI-powered health insights.\n\nUse my referral link to sign up and we'll both receive free AI credits:\n{link}\n\nTake care of your health!\n\nBest regards",
        sms: "Check out Rapid Capsule for AI-powered health insights! Sign up with my link and get free credits: {link}",
      },
      hero_banner: {
        title: 'Share the Gift of Health',
        subtitle: 'Invite friends to Rapid Capsule and earn rewards for every successful referral',
        background_color: '#0EAEC4',
        text_color: '#ffffff',
        show_stats: true,
      },
      milestones: [
        {
          referrals_required: 3,
          reward_type: 'credits',
          reward_value: 2,
          badge_name: 'Health Advocate',
          badge_icon: 'star',
        },
        {
          referrals_required: 5,
          reward_type: 'credits',
          reward_value: 3,
          badge_name: 'Wellness Champion',
          badge_icon: 'trophy',
        },
        {
          referrals_required: 10,
          reward_type: 'credits',
          reward_value: 5,
          badge_name: 'Health Ambassador',
          badge_icon: 'crown',
        },
        {
          referrals_required: 25,
          reward_type: 'credits',
          reward_value: 10,
          badge_name: 'Community Leader',
          badge_icon: 'shield',
        },
      ],
    };

    return this.referralSettingsModel.create(defaultSettings);
  }

  // Get recent clicks
  async getRecentClicks(page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    const [clicks, total] = await Promise.all([
      this.referralClickModel
        .find()
        .populate('referrer_id', 'profile.first_name profile.last_name email')
        .populate('converted_user_id', 'profile.first_name profile.last_name email')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.referralClickModel.countDocuments(),
    ]);

    return {
      clicks,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: limit,
      },
    };
  }

  // Get user's referral details
  async getUserReferralDetails(userId: string) {
    const referral = await this.referralModel
      .findOne({ referrer: new Types.ObjectId(userId) })
      .populate('referrer', 'profile.first_name profile.last_name email profile.profile_image')
      .populate('referrals.referee', 'profile.first_name profile.last_name email created_at')
      .lean();

    if (!referral) return null;

    // Get click history for this user
    const clicks = await this.referralClickModel
      .find({ referrer_id: new Types.ObjectId(userId) })
      .sort({ created_at: -1 })
      .limit(100)
      .lean();

    return {
      referral,
      click_history: clicks,
    };
  }
}
