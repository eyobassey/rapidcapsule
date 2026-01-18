import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import {
  WhatsAppIdentity,
  WhatsAppIdentityDocument,
  IdentityStatus,
  VerificationMethod,
} from '../entities/whatsapp-identity.entity';
import { UsersService } from '../../users/users.service';
import { GeneralHelpers } from '../../../common/helpers/general.helpers';
import { SESSION_CONFIG } from '../constants/session.constant';

@Injectable()
export class WhatsAppIdentityService {
  private readonly logger = new Logger(WhatsAppIdentityService.name);

  constructor(
    @InjectModel(WhatsAppIdentity.name)
    private identityModel: Model<WhatsAppIdentityDocument>,
    private usersService: UsersService,
    private generalHelpers: GeneralHelpers,
    private configService: ConfigService,
  ) {}

  /**
   * Get identity by WhatsApp number, creating pending if not exists
   */
  async getOrCreateIdentity(whatsappNumber: string): Promise<WhatsAppIdentityDocument> {
    const normalized = this.normalizePhoneNumber(whatsappNumber);

    let identity = await this.identityModel.findOne({ whatsapp_number: normalized });

    if (!identity) {
      identity = await this.identityModel.create({
        whatsapp_number: normalized,
        status: IdentityStatus.PENDING_VERIFICATION,
        is_verified: false,
      });
      this.logger.log(`Created new identity for ${normalized}`);
    }

    return identity;
  }

  /**
   * Get identity by WhatsApp number
   */
  async getIdentity(whatsappNumber: string): Promise<WhatsAppIdentityDocument | null> {
    const normalized = this.normalizePhoneNumber(whatsappNumber);
    return this.identityModel.findOne({ whatsapp_number: normalized });
  }

  /**
   * Get identity by patient ID
   */
  async getIdentityByPatientId(patientId: Types.ObjectId): Promise<WhatsAppIdentityDocument | null> {
    return this.identityModel.findOne({ patient_id: patientId, is_verified: true });
  }

  /**
   * Check if number is verified and not blocked
   */
  async isVerified(whatsappNumber: string): Promise<boolean> {
    const normalized = this.normalizePhoneNumber(whatsappNumber);
    const identity = await this.identityModel.findOne({ whatsapp_number: normalized });

    if (!identity) return false;
    if (identity.status === IdentityStatus.BLOCKED) return false;
    if (identity.block_expires_at && identity.block_expires_at > new Date()) return false;

    return identity.is_verified;
  }

  /**
   * Check if identity is blocked
   */
  async isBlocked(whatsappNumber: string): Promise<{ blocked: boolean; reason?: string; expiresAt?: Date }> {
    const normalized = this.normalizePhoneNumber(whatsappNumber);
    const identity = await this.identityModel.findOne({ whatsapp_number: normalized });

    if (!identity) return { blocked: false };

    if (identity.status === IdentityStatus.BLOCKED) {
      // Check if temporary block has expired
      if (identity.block_expires_at && identity.block_expires_at <= new Date()) {
        // Unblock automatically
        await this.identityModel.updateOne(
          { whatsapp_number: normalized },
          {
            $set: { status: IdentityStatus.PENDING_VERIFICATION },
            $unset: { blocked_at: 1, blocked_reason: 1, block_expires_at: 1 },
          },
        );
        return { blocked: false };
      }

      return {
        blocked: true,
        reason: identity.blocked_reason,
        expiresAt: identity.block_expires_at,
      };
    }

    return { blocked: false };
  }

  /**
   * Start OTP verification for existing account
   */
  async initiateAccountLink(
    whatsappNumber: string,
    emailOrPhone: string,
  ): Promise<{ success: boolean; message: string; method?: VerificationMethod }> {
    const normalized = this.normalizePhoneNumber(whatsappNumber);

    // Determine if input is email or phone
    const isEmail = emailOrPhone.includes('@');
    let user;

    if (isEmail) {
      user = await this.usersService.findOneByEmail(emailOrPhone);
    } else {
      user = await this.usersService.findOneByPhone(emailOrPhone);
    }

    if (!user) {
      return {
        success: false,
        message: "I couldn't find an account with that email/phone. Please check and try again, or create a new account.",
      };
    }

    // Check if already linked to another WhatsApp
    const existingLink = await this.identityModel.findOne({
      patient_id: user._id,
      whatsapp_number: { $ne: normalized },
      is_verified: true,
    });

    if (existingLink) {
      return {
        success: false,
        message: 'This account is already linked to another WhatsApp number. Please unlink it first from your app settings.',
      };
    }

    // Generate and send OTP
    const otp = this.generateOTP();
    const method = isEmail ? VerificationMethod.OTP_EMAIL : VerificationMethod.OTP_SMS;

    await this.identityModel.updateOne(
      { whatsapp_number: normalized },
      {
        $set: {
          patient_id: user._id,
          status: IdentityStatus.PENDING_VERIFICATION,
          pending_verification: {
            otp_code: otp,
            otp_expires_at: new Date(Date.now() + SESSION_CONFIG.OTP_VALIDITY_MS),
            email_or_phone: emailOrPhone,
            attempts: 0,
          },
        },
      },
      { upsert: true },
    );

    // Send OTP
    if (method === VerificationMethod.OTP_EMAIL) {
      await this.sendEmailOTP(user.profile?.contact?.email || emailOrPhone, otp, user.profile?.first_name);
    } else {
      // For SMS, we'll integrate with Twilio later
      this.logger.log(`SMS OTP ${otp} would be sent to ${emailOrPhone}`);
    }

    return {
      success: true,
      message: `I've sent a 6-digit verification code to your ${method === VerificationMethod.OTP_EMAIL ? 'email' : 'phone'}. Please enter it here.`,
      method,
    };
  }

  /**
   * Verify OTP and complete account link
   */
  async verifyOTP(
    whatsappNumber: string,
    otpCode: string,
  ): Promise<{ success: boolean; message: string; patientName?: string; patientId?: Types.ObjectId }> {
    const normalized = this.normalizePhoneNumber(whatsappNumber);
    const identity = await this.identityModel.findOne({ whatsapp_number: normalized });

    if (!identity || !identity.pending_verification) {
      return { success: false, message: 'No pending verification found. Please start over.' };
    }

    // Check expiry
    if (identity.pending_verification.otp_expires_at < new Date()) {
      return { success: false, message: 'Verification code has expired. Please request a new one.' };
    }

    // Check attempts
    if (identity.pending_verification.attempts >= SESSION_CONFIG.MAX_OTP_ATTEMPTS) {
      await this.blockIdentity(normalized, 'Too many failed OTP attempts', SESSION_CONFIG.BLOCK_DURATION_HOURS);
      return {
        success: false,
        message: 'Too many failed attempts. Your WhatsApp has been temporarily blocked. Please try again in 24 hours.',
      };
    }

    // Verify OTP
    if (identity.pending_verification.otp_code !== otpCode) {
      await this.identityModel.updateOne(
        { whatsapp_number: normalized },
        {
          $inc: { 'pending_verification.attempts': 1 },
          $set: { last_failed_attempt: new Date() },
        },
      );
      const remaining = SESSION_CONFIG.MAX_OTP_ATTEMPTS - identity.pending_verification.attempts - 1;
      return {
        success: false,
        message: `Incorrect code. ${remaining} attempts remaining. Please try again.`,
      };
    }

    // Success - link account
    const user = await this.usersService.findOne({ _id: identity.patient_id });

    await this.identityModel.updateOne(
      { whatsapp_number: normalized },
      {
        $set: {
          is_verified: true,
          status: IdentityStatus.VERIFIED,
          verified_at: new Date(),
          verification_method: identity.pending_verification.email_or_phone.includes('@')
            ? VerificationMethod.OTP_EMAIL
            : VerificationMethod.OTP_SMS,
          next_reverification_due: new Date(
            Date.now() + SESSION_CONFIG.REVERIFICATION_PERIOD_DAYS * 24 * 60 * 60 * 1000,
          ),
        },
        $unset: { pending_verification: 1 },
      },
    );

    const firstName = user?.profile?.first_name || 'there';

    return {
      success: true,
      message: `Account linked successfully! Hello ${firstName}, your WhatsApp is now connected to your Rapid Capsule account.`,
      patientName: firstName,
      patientId: identity.patient_id,
    };
  }

  /**
   * Block an identity temporarily
   */
  async blockIdentity(whatsappNumber: string, reason: string, hours: number): Promise<void> {
    const normalized = this.normalizePhoneNumber(whatsappNumber);
    await this.identityModel.updateOne(
      { whatsapp_number: normalized },
      {
        $set: {
          status: IdentityStatus.BLOCKED,
          blocked_at: new Date(),
          blocked_reason: reason,
          block_expires_at: new Date(Date.now() + hours * 60 * 60 * 1000),
        },
      },
    );
    this.logger.warn(`Blocked WhatsApp ${normalized}: ${reason}`);
  }

  /**
   * Unlink WhatsApp from account
   */
  async unlinkAccount(whatsappNumber: string): Promise<void> {
    const normalized = this.normalizePhoneNumber(whatsappNumber);
    await this.identityModel.updateOne(
      { whatsapp_number: normalized },
      {
        $set: {
          status: IdentityStatus.UNLINKED,
          is_verified: false,
        },
        $unset: { patient_id: 1 },
      },
    );
    this.logger.log(`Unlinked WhatsApp ${normalized}`);
  }

  /**
   * Unlink WhatsApp by patient ID (called from app settings)
   */
  async unlinkByPatientId(patientId: Types.ObjectId): Promise<void> {
    await this.identityModel.updateMany(
      { patient_id: patientId },
      {
        $set: {
          status: IdentityStatus.UNLINKED,
          is_verified: false,
        },
        $unset: { patient_id: 1 },
      },
    );
  }

  /**
   * Record activity for an identity
   */
  async recordActivity(
    whatsappNumber: string,
    activityType: 'message' | 'prescription' | 'order',
  ): Promise<void> {
    const normalized = this.normalizePhoneNumber(whatsappNumber);
    const update: any = {
      $set: { last_message_at: new Date() },
      $inc: { total_messages: 1 },
    };

    if (activityType === 'prescription') {
      update.$inc.total_prescriptions = 1;
    } else if (activityType === 'order') {
      update.$inc.total_orders = 1;
    }

    await this.identityModel.updateOne({ whatsapp_number: normalized }, update);
  }

  /**
   * Check if re-verification is needed
   */
  async needsReverification(whatsappNumber: string): Promise<boolean> {
    const normalized = this.normalizePhoneNumber(whatsappNumber);
    const identity = await this.identityModel.findOne({ whatsapp_number: normalized });

    if (!identity || !identity.is_verified) return false;

    if (identity.next_reverification_due && identity.next_reverification_due <= new Date()) {
      return true;
    }

    return false;
  }

  /**
   * Handle opt-out request
   */
  async handleOptOut(whatsappNumber: string): Promise<void> {
    const normalized = this.normalizePhoneNumber(whatsappNumber);
    await this.identityModel.updateOne(
      { whatsapp_number: normalized },
      {
        $set: {
          opted_out: true,
          opted_out_at: new Date(),
        },
      },
    );
    this.logger.log(`User opted out: ${normalized}`);
  }

  /**
   * Handle opt-in (re-subscribe)
   */
  async handleOptIn(whatsappNumber: string): Promise<void> {
    const normalized = this.normalizePhoneNumber(whatsappNumber);
    await this.identityModel.updateOne(
      { whatsapp_number: normalized },
      {
        $set: { opted_out: false },
        $unset: { opted_out_at: 1 },
      },
    );
  }

  // Helper methods
  private normalizePhoneNumber(phone: string): string {
    // Remove 'whatsapp:' prefix if present (Twilio format)
    let normalized = phone.replace('whatsapp:', '');
    // Ensure E.164 format
    if (!normalized.startsWith('+')) {
      normalized = '+' + normalized;
    }
    return normalized;
  }

  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async sendEmailOTP(email: string, otp: string, name?: string): Promise<void> {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Verify Your WhatsApp</h2>
        <p>Hi ${name || 'there'},</p>
        <p>Your verification code to link your WhatsApp to Rapid Capsule is:</p>
        <div style="font-size: 32px; font-weight: bold; text-align: center; padding: 20px; background: #f5f5f5; border-radius: 8px; margin: 20px 0; letter-spacing: 4px;">
          ${otp}
        </div>
        <p>This code expires in 10 minutes.</p>
        <p style="color: #666; font-size: 12px;">If you didn't request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">Rapid Capsule Healthcare Platform</p>
      </div>
    `;

    await this.generalHelpers.generateEmailAndSend({
      email,
      subject: 'Verify Your WhatsApp - Rapid Capsule',
      emailBody: htmlContent,
    });
  }
}
