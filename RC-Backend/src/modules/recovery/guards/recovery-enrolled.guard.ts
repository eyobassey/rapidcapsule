import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  RecoveryProfile,
  RecoveryProfileDocument,
} from '../entities/recovery-profile.entity';

/**
 * Verifies the authenticated user has an active RecoveryProfile
 * before accessing recovery-specific endpoints.
 */
@Injectable()
export class RecoveryEnrolledGuard implements CanActivate {
  constructor(
    @InjectModel(RecoveryProfile.name)
    private recoveryProfileModel: Model<RecoveryProfileDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.sub;

    if (!userId) {
      throw new ForbiddenException('Authentication required');
    }

    const profile = await this.recoveryProfileModel
      .findOne({ user: userId, deleted_at: { $exists: false } })
      .select('_id status')
      .lean();

    if (!profile) {
      throw new ForbiddenException(
        'Recovery profile required. Please enroll in the recovery programme first.',
      );
    }

    if (profile.status === 'discharged') {
      throw new ForbiddenException(
        'Your recovery profile has been discharged. Contact your care team for re-enrollment.',
      );
    }

    // Attach profile to request for downstream use
    request.recoveryProfile = profile;
    return true;
  }
}
