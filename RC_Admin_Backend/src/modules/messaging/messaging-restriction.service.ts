import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from '../patients/entities/patient.entity';
import { MessageAuditLog, MessageAuditLogDocument } from './entities/message-audit-log.entity';
import { ApplyRestrictionDto, SetMessageCapDto } from './dto/apply-restriction.dto';
import { GeneralHelpers } from '../../common/helpers/general.helpers';
import {
  restrictionAppliedEmail,
  restrictionLiftedEmail,
} from './emails/restriction-email';

@Injectable()
export class MessagingRestrictionService {
  private readonly logger = new Logger(MessagingRestrictionService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<any>,
    @InjectModel(MessageAuditLog.name)
    private auditLogModel: Model<MessageAuditLogDocument>,
    private readonly generalHelpers: GeneralHelpers,
  ) {}

  /**
   * Apply a restriction (read_only or blocked) to one or more users
   */
  async applyRestriction(dto: ApplyRestrictionDto, adminId: string) {
    const now = new Date();
    let expiresAt: Date | null = null;

    if (dto.duration) {
      expiresAt = new Date(now);
      const { value, unit } = dto.duration;
      switch (unit) {
        case 'hours':
          expiresAt.setHours(expiresAt.getHours() + value);
          break;
        case 'days':
          expiresAt.setDate(expiresAt.getDate() + value);
          break;
        case 'weeks':
          expiresAt.setDate(expiresAt.getDate() + value * 7);
          break;
        case 'months':
          expiresAt.setMonth(expiresAt.getMonth() + value);
          break;
      }
    }

    const userIds = dto.user_ids.map((id) => new Types.ObjectId(id));

    // Update all users
    await this.userModel.updateMany(
      { _id: { $in: userIds } },
      {
        $set: {
          'messaging_restrictions.status': dto.type,
          'messaging_restrictions.reason': dto.reason || null,
          'messaging_restrictions.restricted_by': new Types.ObjectId(adminId),
          'messaging_restrictions.restricted_at': now,
          'messaging_restrictions.expires_at': expiresAt,
        },
      },
    );

    // Fetch users for email notifications and audit
    const users = await this.userModel
      .find({ _id: { $in: userIds } })
      .select('profile.first_name profile.last_name profile.contact.email user_type')
      .lean() as any[];

    // Create audit log entries and send email notifications
    const auditEntries = [];
    for (const user of users) {
      const auditAction =
        dto.type === 'blocked' ? 'user_blocked' : 'user_restricted';

      auditEntries.push({
        action: auditAction,
        actor: new Types.ObjectId(adminId),
        actor_type: 'Admin',
        metadata: {
          target_user: user._id,
          restriction_type: dto.type,
          reason: dto.reason,
          expires_at: expiresAt,
        },
        created_at: now,
      });

      // Send email notification
      const recipientName =
        user.profile?.first_name
          ? `${user.profile.first_name} ${user.profile.last_name || ''}`.trim()
          : 'User';
      const email = user.profile?.contact?.email;

      if (email) {
        try {
          const emailBody = restrictionAppliedEmail({
            recipientName,
            restrictionType: dto.type,
            reason: dto.reason,
            expiresAt,
            userType: user.user_type,
          });
          this.generalHelpers.generateEmailAndSend({
            email,
            subject: 'Messaging Restriction Notice - Rapid Capsule',
            emailBody,
          });
        } catch (e) {
          this.logger.warn(`Failed to send restriction email to ${email}: ${e.message}`);
        }
      }
    }

    if (auditEntries.length > 0) {
      await this.auditLogModel.insertMany(auditEntries);
    }

    return {
      affected: users.length,
      restriction: {
        type: dto.type,
        reason: dto.reason,
        expires_at: expiresAt,
        restricted_at: now,
      },
      users: users.map((u) => ({
        _id: u._id,
        name: u.profile?.first_name
          ? `${u.profile.first_name} ${u.profile.last_name || ''}`.trim()
          : 'Unknown',
      })),
    };
  }

  /**
   * Lift a restriction from a user
   */
  async liftRestriction(userId: string, adminId: string) {
    const user = await this.userModel
      .findById(userId)
      .select('messaging_restrictions profile.first_name profile.last_name profile.contact.email user_type')
      .lean() as any;

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const previousStatus = user.messaging_restrictions?.status || 'none';

    await this.userModel.updateOne(
      { _id: new Types.ObjectId(userId) },
      {
        $set: {
          'messaging_restrictions.status': 'none',
          'messaging_restrictions.reason': null,
          'messaging_restrictions.restricted_by': null,
          'messaging_restrictions.restricted_at': null,
          'messaging_restrictions.expires_at': null,
        },
      },
    );

    // Audit
    const auditAction =
      previousStatus === 'blocked' ? 'user_unblocked' : 'user_unrestricted';

    await this.auditLogModel.create({
      action: auditAction,
      actor: new Types.ObjectId(adminId),
      actor_type: 'Admin',
      metadata: {
        target_user: new Types.ObjectId(userId),
        previous_status: previousStatus,
      },
    });

    // Send "lifted" email
    const recipientName =
      user.profile?.first_name
        ? `${user.profile.first_name} ${user.profile.last_name || ''}`.trim()
        : 'User';
    const email = user.profile?.contact?.email;

    if (email && previousStatus !== 'none') {
      try {
        const emailBody = restrictionLiftedEmail({
          recipientName,
          previousRestriction: previousStatus as 'read_only' | 'blocked',
          userType: user.user_type,
        });
        this.generalHelpers.generateEmailAndSend({
          email,
          subject: 'Messaging Restrictions Lifted - Rapid Capsule',
          emailBody,
        });
      } catch (e) {
        this.logger.warn(`Failed to send restriction lifted email: ${e.message}`);
      }
    }

    return { userId, previous_status: previousStatus, current_status: 'none' };
  }

  /**
   * Set message cap for one or more users
   */
  async setMessageCap(dto: SetMessageCapDto, adminId: string) {
    const userIds = dto.user_ids.map((id) => new Types.ObjectId(id));
    const now = new Date();

    await this.userModel.updateMany(
      { _id: { $in: userIds } },
      {
        $set: {
          'messaging_restrictions.message_cap.enabled': true,
          'messaging_restrictions.message_cap.limit': dto.limit,
          'messaging_restrictions.message_cap.period': dto.period,
          'messaging_restrictions.message_cap.current_count': 0,
          'messaging_restrictions.message_cap.period_start': now,
        },
      },
    );

    // Audit
    const auditEntries = userIds.map((uid) => ({
      action: 'message_cap_set',
      actor: new Types.ObjectId(adminId),
      actor_type: 'Admin',
      metadata: {
        target_user: uid,
        limit: dto.limit,
        period: dto.period,
      },
      created_at: now,
    }));

    await this.auditLogModel.insertMany(auditEntries);

    return { affected: userIds.length, limit: dto.limit, period: dto.period };
  }

  /**
   * Remove message cap for a user
   */
  async removeMessageCap(userId: string, adminId: string) {
    await this.userModel.updateOne(
      { _id: new Types.ObjectId(userId) },
      {
        $set: {
          'messaging_restrictions.message_cap.enabled': false,
          'messaging_restrictions.message_cap.limit': null,
          'messaging_restrictions.message_cap.period': null,
          'messaging_restrictions.message_cap.current_count': 0,
          'messaging_restrictions.message_cap.period_start': null,
        },
      },
    );

    await this.auditLogModel.create({
      action: 'message_cap_removed',
      actor: new Types.ObjectId(adminId),
      actor_type: 'Admin',
      metadata: { target_user: new Types.ObjectId(userId) },
    });

    return { userId, message_cap: { enabled: false } };
  }

  /**
   * List all users with active restrictions (paginated)
   */
  async getRestrictions(query: {
    type?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const filter: any = {
      'messaging_restrictions.status': { $in: ['read_only', 'blocked'] },
    };

    if (query.type) {
      filter['messaging_restrictions.status'] = query.type;
    }

    if (query.search) {
      const searchRegex = new RegExp(query.search, 'i');
      filter.$or = [
        { 'profile.first_name': searchRegex },
        { 'profile.last_name': searchRegex },
        { 'profile.contact.email': searchRegex },
      ];
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.userModel
        .find(filter)
        .select(
          'profile.first_name profile.last_name profile.contact.email user_type messaging_restrictions',
        )
        .sort({ 'messaging_restrictions.restricted_at': -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.userModel.countDocuments(filter),
    ]);

    return {
      data: data.map((u) => ({
        _id: u._id,
        name: u.profile?.first_name
          ? `${u.profile.first_name} ${u.profile.last_name || ''}`.trim()
          : 'Unknown',
        email: u.profile?.contact?.email,
        user_type: u.user_type,
        messaging_restrictions: u.messaging_restrictions,
      })),
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single user's restriction details
   */
  async getUserRestriction(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .select(
        'profile.first_name profile.last_name profile.contact.email user_type messaging_restrictions',
      )
      .lean();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      _id: user._id,
      name: user.profile?.first_name
        ? `${user.profile.first_name} ${user.profile.last_name || ''}`.trim()
        : 'Unknown',
      email: user.profile?.contact?.email,
      user_type: user.user_type,
      messaging_restrictions: user.messaging_restrictions || {
        status: 'none',
        message_cap: { enabled: false },
      },
    };
  }
}
