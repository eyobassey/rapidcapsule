import { Injectable, Logger } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { Admin, AdminDocument } from '../users/entities/user.entity';

@Injectable()
export class MessagingSessionService {
  private readonly logger = new Logger(MessagingSessionService.name);

  constructor(
    @InjectModel(Admin.name)
    private adminModel: Model<AdminDocument>,
    @InjectConnection()
    private connection: Connection,
    private jwtService: JwtService,
  ) {}

  /**
   * Initialize a messaging session for an admin user.
   * Finds or creates a shadow user in the shared `users` collection,
   * then generates a JWT compatible with the patient backend.
   */
  async initSession(adminId: string) {
    // 1. Look up the admin's profile
    const admin = await this.adminModel.findById(adminId).lean().exec();
    if (!admin) {
      throw new Error('Admin not found');
    }

    // 2. Find or create a shadow user in the shared `users` collection
    const usersCollection = this.connection.db.collection('users');

    const result = await usersCollection.findOneAndUpdate(
      {
        'profile.contact.email': admin.email,
        user_type: 'Admin',
      },
      {
        $setOnInsert: {
          email: admin.email,
          user_type: 'Admin',
          status: 'Active',
          is_email_verified: true,
          is_active: true,
          is_suspended: false,
          reg_medium: 'LOCAL',
          created_at: new Date(),
        },
        $set: {
          'profile.first_name': admin.first_name,
          'profile.last_name': admin.last_name,
          'profile.contact.email': admin.email,
          updated_at: new Date(),
        },
      },
      { upsert: true, returnDocument: 'after' },
    );

    // Native driver may return { value: Document } or the Document directly
    const shadowUser = (result as any)?.value || result;
    if (!shadowUser?._id) {
      throw new Error('Failed to create or find shadow user');
    }
    const shadowUserId = shadowUser._id.toString();
    this.logger.log(
      `Admin ${admin.email} mapped to shadow user ${shadowUserId}`,
    );

    // 3. Generate a JWT compatible with the patient backend's JwtStrategy
    // The patient backend validates: payload.sub exists in `users` collection
    // and only checks tokenId if present (we omit it to skip session validation)
    const messagingToken = await this.jwtService.signAsync(
      {
        sub: shadowUserId,
        email: admin.email,
        first_name: admin.first_name,
        user_type: 'Admin',
        is_email_verified: true,
        is_phone_verified: false,
      },
      {
        secret: process.env.JWTKEY,
        expiresIn: '24h',
      },
    );

    return {
      messaging_token: messagingToken,
      messaging_user_id: shadowUserId,
    };
  }
}
