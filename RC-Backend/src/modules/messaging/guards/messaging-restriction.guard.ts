import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../users/entities/user.entity';

@Injectable()
export class MessagingRestrictionGuard implements CanActivate {
  private readonly logger = new Logger(MessagingRestrictionGuard.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.sub;
    if (!userId) return true;

    const user = await this.userModel
      .findById(userId)
      .select('messaging_restrictions')
      .lean();

    if (!user) return true;

    const restrictions = user.messaging_restrictions;
    if (!restrictions || restrictions.status === 'none') {
      // Check message cap even if status is 'none'
      if (restrictions?.message_cap?.enabled) {
        return this.checkMessageCap(userId, restrictions);
      }
      return true;
    }

    const now = new Date();

    // Check if restriction has expired
    if (restrictions.expires_at && new Date(restrictions.expires_at) <= now) {
      // Auto-clear expired restriction
      await this.userModel.updateOne(
        { _id: userId },
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
      this.logger.log(`Auto-cleared expired restriction for user ${userId}`);
      // Still check message cap
      if (restrictions.message_cap?.enabled) {
        return this.checkMessageCap(userId, restrictions);
      }
      return true;
    }

    // Enforce blocked status
    if (restrictions.status === 'blocked') {
      throw new ForbiddenException(
        'Your messaging has been blocked. Contact support for assistance.',
      );
    }

    // Enforce read-only status
    if (restrictions.status === 'read_only') {
      throw new ForbiddenException(
        'You are restricted to read-only messaging.',
      );
    }

    return true;
  }

  private async checkMessageCap(
    userId: string,
    restrictions: any,
  ): Promise<boolean> {
    const cap = restrictions.message_cap;
    if (!cap?.enabled || !cap.limit) return true;

    const now = new Date();
    const periodStart = cap.period_start ? new Date(cap.period_start) : null;
    let currentCount = cap.current_count || 0;

    // Check if period has expired and needs reset
    let needsReset = false;
    if (!periodStart) {
      needsReset = true;
    } else if (cap.period === 'daily') {
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      needsReset = periodStart < startOfToday;
    } else if (cap.period === 'monthly') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      needsReset = periodStart < startOfMonth;
    }

    if (needsReset) {
      currentCount = 0;
      await this.userModel.updateOne(
        { _id: userId },
        {
          $set: {
            'messaging_restrictions.message_cap.current_count': 0,
            'messaging_restrictions.message_cap.period_start': now,
          },
        },
      );
    }

    if (currentCount >= cap.limit) {
      const periodLabel = cap.period === 'daily' ? 'daily' : 'monthly';
      throw new ForbiddenException(
        `You have reached your ${periodLabel} message limit (${cap.limit}).`,
      );
    }

    // Increment the counter
    await this.userModel.updateOne(
      { _id: userId },
      { $inc: { 'messaging_restrictions.message_cap.current_count': 1 } },
    );

    return true;
  }
}
