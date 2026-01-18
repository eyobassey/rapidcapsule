import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Referral, ReferralDocument, ReferralStatus } from './entities/referral.entity';
import { ReferralClick, ReferralClickDocument, ClickSource } from './entities/referral-click.entity';
import { ReferralSettings, ReferralSettingsDocument } from './entities/referral-settings.entity';
import { Model, Types } from 'mongoose';
import { create, findOne, upsert } from '../../common/crud/crud';
import { Messages } from '../../core/messages/messages';
import { SharePlatform } from './dto/track-share.dto';

@Injectable()
export class ReferralsService {
  constructor(
    @InjectModel(Referral.name) private referralModel: Model<ReferralDocument>,
    @InjectModel(ReferralClick.name) private referralClickModel: Model<ReferralClickDocument>,
    @InjectModel(ReferralSettings.name) private referralSettingsModel: Model<ReferralSettingsDocument>,
  ) {}

  // Generate a user-friendly referral code
  private generateReferralCode(firstName: string, lastName: string): string {
    const cleanFirst = (firstName || 'user').toLowerCase().replace(/[^a-z]/g, '').substring(0, 4);
    const cleanLast = (lastName || '').toLowerCase().replace(/[^a-z]/g, '').substring(0, 3);
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `${cleanFirst}${cleanLast}${randomNum}`;
  }

  async createReferral(referrerId: Types.ObjectId, firstName?: string, lastName?: string) {
    let referralCode: string;
    let existingReferral: ReferralDocument;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      referralCode = this.generateReferralCode(firstName || 'user', lastName || '');
      existingReferral = await this.findOneByCode(referralCode);
      attempts++;
    } while (existingReferral && attempts < maxAttempts);

    // Fallback to UUID-style if we can't generate a unique code
    if (existingReferral) {
      referralCode = `ref${Date.now().toString(36)}${Math.random().toString(36).substring(2, 6)}`;
    }

    return await create(this.referralModel, {
      referrer: referrerId,
      referral_code: referralCode,
      total_clicks: 0,
      total_shares: 0,
      total_signups: 0,
      total_credits_earned: 0,
      total_points_earned: 0,
      shares_by_platform: {
        whatsapp: 0,
        facebook: 0,
        twitter: 0,
        linkedin: 0,
        email: 0,
        copy: 0,
        sms: 0,
      },
      clicks_by_platform: {
        whatsapp: 0,
        facebook: 0,
        twitter: 0,
        linkedin: 0,
        email: 0,
        direct: 0,
        other: 0,
      },
      milestones_achieved: [],
    });
  }

  async updateReferrals(refereeId: Types.ObjectId, referralCode: string) {
    const referral = await this.findOneByCode(referralCode);
    if (!referral) throw new NotFoundException(Messages.NOT_FOUND_REFERRAL_CODE);

    // Get settings for rewards
    const settings = await this.getSettings();

    const updateResult = await upsert(
      this.referralModel,
      { referral_code: referralCode },
      {
        $push: {
          referrals: {
            referee: refereeId,
            date_referred: new Date(),
            status: ReferralStatus.PENDING,
            credits_awarded: 0,
            points_awarded: 0,
          },
        },
        $inc: { total_signups: 1 },
      },
    );

    // Mark any pending clicks as converted
    await this.referralClickModel.updateMany(
      {
        referral_code: referralCode,
        converted: false,
        created_at: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Within last 24 hours
      },
      {
        $set: {
          converted: true,
          converted_user_id: refereeId,
          converted_at: new Date(),
        },
      },
    );

    return updateResult;
  }

  async findOneByCode(code: string) {
    return await findOne(this.referralModel, { referral_code: code });
  }

  async getReferralByCode(code: string) {
    const referral = await this.findOneByCode(code);
    if (!referral) throw new NotFoundException(Messages.NOT_FOUND_REFERRAL_CODE);
    return referral;
  }

  async findReferralByReferrerId(referrerId: Types.ObjectId) {
    return await findOne(
      this.referralModel,
      { referrer: referrerId },
      {
        populate: 'referrals.referee',
        populateSelectFields: ['profile.first_name', 'profile.last_name', 'profile.profile_image', 'created_at'],
      },
    );
  }

  async getUserReferral(referrerId: Types.ObjectId, firstName?: string, lastName?: string) {
    let referral = await this.findReferralByReferrerId(referrerId);
    if (!referral) {
      await this.createReferral(referrerId, firstName, lastName);
      referral = await this.findReferralByReferrerId(referrerId);
    }
    return referral;
  }

  // Track share action
  async trackShare(referrerId: Types.ObjectId, platform: SharePlatform) {
    const platformKey = platform.toLowerCase();
    const updateQuery: any = {
      $inc: {
        total_shares: 1,
        [`shares_by_platform.${platformKey}`]: 1,
      },
      $set: {
        last_shared_at: new Date(),
      },
    };

    return await this.referralModel.findOneAndUpdate({ referrer: referrerId }, updateQuery, { new: true });
  }

  // Track link click
  async trackClick(
    referralCode: string,
    source: ClickSource = ClickSource.DIRECT,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const referral = await this.findOneByCode(referralCode);
    if (!referral) return null;

    // Create click record
    await create(this.referralClickModel, {
      referral_id: (referral as any)._id,
      referrer_id: referral.referrer,
      referral_code: referralCode,
      source,
      ip_address: ipAddress,
      user_agent: userAgent,
      converted: false,
    });

    // Update referral stats
    const sourceKey = source.toLowerCase();
    await this.referralModel.findOneAndUpdate(
      { referral_code: referralCode },
      {
        $inc: {
          total_clicks: 1,
          [`clicks_by_platform.${sourceKey}`]: 1,
        },
        $set: {
          last_click_at: new Date(),
        },
      },
    );

    return referral;
  }

  // Get user's referral statistics
  async getUserStats(referrerId: Types.ObjectId) {
    const referral = await this.findReferralByReferrerId(referrerId);
    if (!referral) return null;

    const settings = await this.getSettings();

    // Calculate conversion rate
    const conversionRate =
      referral.total_clicks > 0 ? ((referral.total_signups / referral.total_clicks) * 100).toFixed(1) : '0';

    // Get recent clicks (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentClicks = await this.referralClickModel.countDocuments({
      referrer_id: referrerId,
      created_at: { $gte: sevenDaysAgo },
    });

    // Get click analytics by day (last 7 days)
    const clicksByDay = await this.referralClickModel.aggregate([
      {
        $match: {
          referrer_id: new Types.ObjectId(referrerId),
          created_at: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } },
          clicks: { $sum: 1 },
          conversions: { $sum: { $cond: ['$converted', 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Check next milestone
    const nextMilestone = settings?.milestones?.find(
      (m) => !referral.milestones_achieved?.includes(m.referrals_required) && m.referrals_required > referral.total_signups,
    );

    return {
      referral_code: referral.referral_code,
      total_clicks: referral.total_clicks || 0,
      total_shares: referral.total_shares || 0,
      total_signups: referral.total_signups || 0,
      total_credits_earned: referral.total_credits_earned || 0,
      total_points_earned: referral.total_points_earned || 0,
      conversion_rate: conversionRate,
      recent_clicks: recentClicks,
      clicks_by_day: clicksByDay,
      shares_by_platform: referral.shares_by_platform || {},
      clicks_by_platform: referral.clicks_by_platform || {},
      milestones_achieved: referral.milestones_achieved || [],
      next_milestone: nextMilestone || null,
      referrals: referral.referrals || [],
    };
  }

  // Get or create settings
  async getSettings(): Promise<ReferralSettingsDocument> {
    let settings = await this.referralSettingsModel.findOne();
    if (!settings) {
      settings = await this.createDefaultSettings();
    }
    return settings;
  }

  // Create default settings
  async createDefaultSettings(): Promise<ReferralSettingsDocument> {
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

    return await this.referralSettingsModel.create(defaultSettings);
  }

  // Get share messages with link replaced
  async getShareMessages(referrerId: Types.ObjectId) {
    const referral = await this.findReferralByReferrerId(referrerId);
    if (!referral) return null;

    const settings = await this.getSettings();
    const referralLink = `https://rapidcapsule.com/r/${referral.referral_code}`;

    const messages = { ...settings.share_messages };

    // Replace {link} placeholder with actual link
    Object.keys(messages).forEach((key) => {
      if (typeof messages[key] === 'string') {
        messages[key] = messages[key].replace(/{link}/g, referralLink);
      }
    });

    return {
      messages,
      referral_link: referralLink,
      referral_code: referral.referral_code,
    };
  }

  // Award referral rewards
  async awardReferralRewards(referralCode: string, refereeId: Types.ObjectId) {
    const referral = await this.findOneByCode(referralCode);
    if (!referral) return null;

    const settings = await this.getSettings();

    // Update the referral record
    await this.referralModel.findOneAndUpdate(
      {
        referral_code: referralCode,
        'referrals.referee': refereeId,
      },
      {
        $set: {
          'referrals.$.status': ReferralStatus.REWARDED,
          'referrals.$.rewarded_at': new Date(),
          'referrals.$.credits_awarded': settings.referrer_credits,
          'referrals.$.points_awarded': settings.referrer_points,
        },
        $inc: {
          total_credits_earned: settings.referrer_credits,
          total_points_earned: settings.referrer_points,
        },
      },
    );

    // Check and award milestones
    const updatedReferral = await this.findOneByCode(referralCode);
    if (updatedReferral && settings.milestones) {
      for (const milestone of settings.milestones) {
        if (
          updatedReferral.total_signups >= milestone.referrals_required &&
          !updatedReferral.milestones_achieved?.includes(milestone.referrals_required)
        ) {
          await this.referralModel.findOneAndUpdate(
            { referral_code: referralCode },
            {
              $push: { milestones_achieved: milestone.referrals_required },
              $inc: { total_credits_earned: milestone.reward_value },
            },
          );
        }
      }
    }

    return {
      referrer_credits: settings.referrer_credits,
      referrer_points: settings.referrer_points,
      referee_credits: settings.referee_credits,
      referee_points: settings.referee_points,
    };
  }
}
