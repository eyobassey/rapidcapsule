import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as moment from 'moment';
import { ClaudeSummaryPlan, ClaudeSummaryPlanDocument, PlanType } from './entities/claude-summary-plan.entity';
import { ClaudeSummaryCredit, ClaudeSummaryCreditDocument } from './entities/claude-summary-credit.entity';
import { ClaudeSummaryTransaction, ClaudeSummaryTransactionDocument, TransactionType } from './entities/claude-summary-transaction.entity';
import { WalletsService } from '../wallets/wallets.service';
import { UsersService } from '../users/users.service';
import { GeneralHelpers } from '../../common/helpers/general.helpers';
import { claudeSummaryPurchaseEmail } from '../../core/emails/mails/claudeSummaryPurchaseEmail';
import { creditTransferSentEmail, creditTransferReceivedEmail } from '../../core/emails/mails/creditTransferEmail';
import { AdvancedScoreSettings, AdvancedScoreSettingsDocument, DEFAULT_SETTINGS } from '../advanced-health-score/entities/advanced-score-settings.entity';
import { User, UserDocument, UserType } from '../users/entities/user.entity';

const FREE_CREDITS_PER_MONTH = 5;
const logger = new Logger('ClaudeSummaryCreditsService');

@Injectable()
export class ClaudeSummaryCreditsService {
  constructor(
    @InjectModel(ClaudeSummaryPlan.name) private planModel: Model<ClaudeSummaryPlanDocument>,
    @InjectModel(ClaudeSummaryCredit.name) private creditModel: Model<ClaudeSummaryCreditDocument>,
    @InjectModel(ClaudeSummaryTransaction.name) private transactionModel: Model<ClaudeSummaryTransactionDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(AdvancedScoreSettings.name) private settingsModel: Model<AdvancedScoreSettingsDocument>,
    private walletsService: WalletsService,
    private usersService: UsersService,
    private generalHelpers: GeneralHelpers,
  ) {}

  // =====================
  // Credit Initialization
  // =====================

  /**
   * Initialize credits for a new user or get existing credits
   */
  async initializeUserCredits(userId: Types.ObjectId | string): Promise<ClaudeSummaryCreditDocument> {
    const userIdObj = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;

    let credit = await this.creditModel.findOne({ userId: userIdObj });

    if (!credit) {
      const nextMonth = moment().add(1, 'month').startOf('month').toDate();

      credit = await this.creditModel.create({
        userId: userIdObj,
        free_credits_remaining: FREE_CREDITS_PER_MONTH,
        free_credits_reset_date: nextMonth,
        purchased_credits: 0,
        gifted_credits: 0,
        gifted_credits_expiry: null,
        gifted_by: null,
        unlimited_subscription: null,
        total_summaries_generated: 0,
        total_amount_spent: 0,
      });
    }

    return credit;
  }

  // =====================
  // Credit Status
  // =====================

  /**
   * Get detailed credit status for a user
   */
  async getCreditStatus(userId: Types.ObjectId | string) {
    const credit = await this.initializeUserCredits(userId);

    // Check if unlimited subscription is still active
    let hasUnlimited = false;
    let unlimitedExpiresAt: Date | null = null;

    if (credit.unlimited_subscription?.is_active) {
      if (moment(credit.unlimited_subscription.expires_at).isAfter(moment())) {
        hasUnlimited = true;
        unlimitedExpiresAt = credit.unlimited_subscription.expires_at;
      } else {
        // Subscription expired, mark as inactive
        await this.expireSubscription(credit);
      }
    }

    // Check if gifted credits have expired
    let giftedCredits = credit.gifted_credits;
    if (credit.gifted_credits > 0 && credit.gifted_credits_expiry) {
      if (moment(credit.gifted_credits_expiry).isBefore(moment())) {
        await this.expireGiftedCredits(credit);
        giftedCredits = 0;
      }
    }

    // Check if monthly reset is needed
    let freeCredits = credit.free_credits_remaining;
    if (moment().isAfter(moment(credit.free_credits_reset_date))) {
      const updatedCredit = await this.resetUserFreeCredits(credit);
      freeCredits = updatedCredit.free_credits_remaining;
    }

    const totalAvailable = hasUnlimited ? 'unlimited' : freeCredits + credit.purchased_credits + giftedCredits;

    return {
      free_credits_remaining: freeCredits,
      free_credits_reset_date: credit.free_credits_reset_date,
      purchased_credits: credit.purchased_credits,
      gifted_credits: giftedCredits,
      gifted_credits_expiry: credit.gifted_credits_expiry,
      has_unlimited_subscription: hasUnlimited,
      unlimited_expires_at: unlimitedExpiresAt,
      unlimited_plan_name: hasUnlimited ? credit.unlimited_subscription?.plan_name : null,
      total_available: totalAvailable,
      total_summaries_generated: credit.total_summaries_generated,
      total_amount_spent: credit.total_amount_spent,
    };
  }

  /**
   * Quick check if user can generate a summary
   */
  async canGenerateSummary(userId: Types.ObjectId | string): Promise<{
    can_generate: boolean;
    source: 'free' | 'gifted' | 'purchased' | 'unlimited' | 'none';
    credits_remaining: number | 'unlimited';
  }> {
    const status = await this.getCreditStatus(userId);

    // Priority: Free > Gifted > Purchased > Unlimited
    if (status.has_unlimited_subscription) {
      return { can_generate: true, source: 'unlimited', credits_remaining: 'unlimited' };
    }

    if (status.free_credits_remaining > 0) {
      return { can_generate: true, source: 'free', credits_remaining: status.free_credits_remaining };
    }

    if (status.gifted_credits > 0) {
      return { can_generate: true, source: 'gifted', credits_remaining: status.gifted_credits };
    }

    if (status.purchased_credits > 0) {
      return { can_generate: true, source: 'purchased', credits_remaining: status.purchased_credits };
    }

    return { can_generate: false, source: 'none', credits_remaining: 0 };
  }

  // =====================
  // Credit Consumption
  // =====================

  /**
   * Consume one credit when generating a summary
   */
  async consumeCredit(
    userId: Types.ObjectId | string,
    healthCheckupId: Types.ObjectId | string,
  ): Promise<{ success: boolean; source: string; remaining: number | 'unlimited' }> {
    const userIdObj = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
    const checkupIdObj = typeof healthCheckupId === 'string' ? new Types.ObjectId(healthCheckupId) : healthCheckupId;

    const canGenerate = await this.canGenerateSummary(userIdObj);

    if (!canGenerate.can_generate) {
      throw new BadRequestException('No credits available');
    }

    const credit = await this.creditModel.findOne({ userId: userIdObj });
    if (!credit) {
      throw new NotFoundException('Credit record not found');
    }

    let transactionType: TransactionType;
    let description: string;

    // Consume based on source priority
    switch (canGenerate.source) {
      case 'unlimited':
        transactionType = TransactionType.UNLIMITED_USAGE;
        description = 'Health summary generated (unlimited subscription)';
        break;

      case 'free':
        credit.free_credits_remaining -= 1;
        transactionType = TransactionType.FREE_USAGE;
        description = 'Health summary generated (free monthly credit)';
        break;

      case 'gifted':
        credit.gifted_credits -= 1;
        transactionType = TransactionType.GIFTED_USAGE;
        description = 'Health summary generated (gifted credit)';
        break;

      case 'purchased':
        credit.purchased_credits -= 1;
        transactionType = TransactionType.PURCHASED_USAGE;
        description = 'Health summary generated (purchased credit)';
        break;

      default:
        throw new BadRequestException('Invalid credit source');
    }

    credit.total_summaries_generated += 1;
    await credit.save();

    // Log transaction
    await this.logTransaction({
      userId: userIdObj,
      type: transactionType,
      credits_delta: canGenerate.source === 'unlimited' ? 0 : -1,
      health_checkup_id: checkupIdObj,
      description,
      credit_snapshot: {
        free_credits: credit.free_credits_remaining,
        purchased_credits: credit.purchased_credits,
        gifted_credits: credit.gifted_credits,
        has_unlimited: credit.unlimited_subscription?.is_active || false,
      },
    });

    // Get updated remaining count
    const newStatus = await this.getCreditStatus(userIdObj);

    return {
      success: true,
      source: canGenerate.source,
      remaining: newStatus.total_available as number | 'unlimited',
    };
  }

  // =====================
  // Purchases
  // =====================

  /**
   * Purchase a credit bundle or unlimited subscription
   */
  async purchasePlan(userId: Types.ObjectId | string, planId: Types.ObjectId | string) {
    const userIdObj = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
    const planIdObj = typeof planId === 'string' ? new Types.ObjectId(planId) : planId;

    const plan = await this.planModel.findById(planIdObj);
    if (!plan || !plan.is_active) {
      throw new NotFoundException('Plan not found or not available');
    }

    // Get user details for email
    const user = await this.usersService.findById(userIdObj);
    const userEmail = user?.profile?.contact?.email;
    const userName = user?.profile?.first_name
      ? `${user.profile.first_name} ${user.profile.last_name || ''}`.trim()
      : 'Valued Customer';

    // Check wallet balance and debit
    const wallet = await this.walletsService.getUserWallet(userIdObj);
    const walletBalanceBefore = wallet.available_balance;
    if (wallet.available_balance < plan.price) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    const reference = `CLAUDE-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
    const narration = `AI Health Summary - ${plan.name}`;

    // Debit wallet
    const debitResult = await this.walletsService.debitWalletForPurchase(
      userIdObj,
      plan.price,
      reference,
      narration,
    );

    // Update credits
    const credit = await this.initializeUserCredits(userIdObj);

    if (plan.type === PlanType.BUNDLE) {
      credit.purchased_credits += plan.credits!;
      credit.total_amount_spent += plan.price;
      await credit.save();

      await this.logTransaction({
        userId: userIdObj,
        type: TransactionType.BUNDLE_PURCHASE,
        credits_delta: plan.credits!,
        amount: plan.price,
        currency: plan.currency,
        plan_id: planIdObj,
        plan_name: plan.name,
        wallet_reference: reference,
        description: `Purchased ${plan.name} (${plan.credits} credits)`,
        credit_snapshot: {
          free_credits: credit.free_credits_remaining,
          purchased_credits: credit.purchased_credits,
          gifted_credits: credit.gifted_credits,
          has_unlimited: credit.unlimited_subscription?.is_active || false,
        },
      });

      // Send purchase confirmation email
      if (userEmail) {
        const totalCreditsNow = credit.free_credits_remaining + credit.purchased_credits + credit.gifted_credits;
        this.sendPurchaseConfirmationEmail({
          email: userEmail,
          patientName: userName,
          planName: plan.name,
          planType: plan.type,
          credits: plan.credits!,
          amount: plan.price,
          currency: plan.currency,
          transactionReference: reference,
          walletBalanceBefore,
          walletBalanceAfter: debitResult.newBalance,
          totalCreditsNow,
        });
      }

      return {
        success: true,
        type: 'bundle',
        credits_added: plan.credits,
        new_purchased_credits: credit.purchased_credits,
        wallet_balance: debitResult.newBalance,
      };
    } else {
      // Unlimited subscription
      const expiresAt = moment().add(plan.duration_days!, 'days').toDate();

      credit.unlimited_subscription = {
        plan_id: planIdObj,
        plan_name: plan.name,
        started_at: new Date(),
        expires_at: expiresAt,
        is_active: true,
      };
      credit.total_amount_spent += plan.price;
      await credit.save();

      await this.logTransaction({
        userId: userIdObj,
        type: TransactionType.UNLIMITED_PURCHASE,
        credits_delta: 0,
        amount: plan.price,
        currency: plan.currency,
        plan_id: planIdObj,
        plan_name: plan.name,
        wallet_reference: reference,
        description: `Purchased ${plan.name} (expires ${moment(expiresAt).format('MMM DD, YYYY')})`,
        credit_snapshot: {
          free_credits: credit.free_credits_remaining,
          purchased_credits: credit.purchased_credits,
          gifted_credits: credit.gifted_credits,
          has_unlimited: true,
        },
      });

      // Send purchase confirmation email
      if (userEmail) {
        this.sendPurchaseConfirmationEmail({
          email: userEmail,
          patientName: userName,
          planName: plan.name,
          planType: plan.type,
          durationDays: plan.duration_days!,
          expiresAt: moment(expiresAt).format('MMMM DD, YYYY'),
          amount: plan.price,
          currency: plan.currency,
          transactionReference: reference,
          walletBalanceBefore,
          walletBalanceAfter: debitResult.newBalance,
        });
      }

      return {
        success: true,
        type: 'unlimited',
        plan_name: plan.name,
        expires_at: expiresAt,
        wallet_balance: debitResult.newBalance,
      };
    }
  }

  /**
   * Send purchase confirmation email to user
   */
  private sendPurchaseConfirmationEmail(data: {
    email: string;
    patientName: string;
    planName: string;
    planType: PlanType;
    credits?: number;
    durationDays?: number;
    expiresAt?: string;
    amount: number;
    currency: string;
    transactionReference: string;
    walletBalanceBefore: number;
    walletBalanceAfter: number;
    totalCreditsNow?: number;
  }) {
    try {
      const emailBody = claudeSummaryPurchaseEmail({
        patientName: data.patientName,
        planName: data.planName,
        planType: data.planType,
        credits: data.credits,
        durationDays: data.durationDays,
        expiresAt: data.expiresAt,
        amount: data.amount,
        currency: data.currency,
        transactionReference: data.transactionReference,
        purchaseDate: moment().format('MMMM DD, YYYY [at] h:mm A'),
        walletBalanceBefore: data.walletBalanceBefore,
        walletBalanceAfter: data.walletBalanceAfter,
        totalCreditsNow: data.totalCreditsNow,
      });

      this.generalHelpers.generateEmailAndSend({
        email: data.email,
        subject: `Purchase Confirmed - ${data.planName}`,
        emailBody,
      });

      logger.log(`Purchase confirmation email sent to ${data.email}`);
    } catch (error) {
      logger.error(`Failed to send purchase confirmation email: ${error.message}`);
      // Don't throw - email failure shouldn't fail the purchase
    }
  }

  // =====================
  // Plans
  // =====================

  /**
   * Get all active plans for purchase
   */
  async getActivePlans() {
    const plans = await this.planModel
      .find({ is_active: true })
      .sort({ sort_order: 1 })
      .lean();

    return plans;
  }

  // =====================
  // Transaction History
  // =====================

  /**
   * Get user's transaction history
   */
  async getTransactionHistory(userId: Types.ObjectId | string, page = 1, limit = 20) {
    const userIdObj = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;

    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      this.transactionModel
        .find({ userId: userIdObj })
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.transactionModel.countDocuments({ userId: userIdObj }),
    ]);

    return {
      transactions,
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    };
  }

  // =====================
  // Scheduled Jobs Helpers
  // =====================

  /**
   * Reset monthly free credits for all users whose reset date has passed
   */
  async resetMonthlyFreeCreditsForAll(): Promise<{ users_reset: number }> {
    const now = new Date();
    const nextMonth = moment().add(1, 'month').startOf('month').toDate();

    const result = await this.creditModel.updateMany(
      { free_credits_reset_date: { $lte: now } },
      {
        $set: {
          free_credits_remaining: FREE_CREDITS_PER_MONTH,
          free_credits_reset_date: nextMonth,
        },
      },
    );

    // Log reset transactions
    if (result.modifiedCount > 0) {
      const resetUsers = await this.creditModel.find({
        free_credits_reset_date: nextMonth,
        free_credits_remaining: FREE_CREDITS_PER_MONTH,
      });

      for (const credit of resetUsers) {
        await this.logTransaction({
          userId: credit.userId,
          type: TransactionType.MONTHLY_RESET,
          credits_delta: FREE_CREDITS_PER_MONTH,
          description: 'Monthly free credits reset',
          credit_snapshot: {
            free_credits: credit.free_credits_remaining,
            purchased_credits: credit.purchased_credits,
            gifted_credits: credit.gifted_credits,
            has_unlimited: credit.unlimited_subscription?.is_active || false,
          },
        });
      }
    }

    return { users_reset: result.modifiedCount };
  }

  /**
   * Expire unlimited subscriptions that have passed their expiry date
   */
  async expireUnlimitedSubscriptionsForAll(): Promise<{ expired_count: number }> {
    const now = new Date();

    const expiredCredits = await this.creditModel.find({
      'unlimited_subscription.is_active': true,
      'unlimited_subscription.expires_at': { $lte: now },
    });

    for (const credit of expiredCredits) {
      await this.expireSubscription(credit);
    }

    return { expired_count: expiredCredits.length };
  }

  // =====================
  // Private Helpers
  // =====================

  private async resetUserFreeCredits(credit: ClaudeSummaryCreditDocument): Promise<ClaudeSummaryCreditDocument> {
    const nextMonth = moment().add(1, 'month').startOf('month').toDate();

    credit.free_credits_remaining = FREE_CREDITS_PER_MONTH;
    credit.free_credits_reset_date = nextMonth;
    await credit.save();

    await this.logTransaction({
      userId: credit.userId,
      type: TransactionType.MONTHLY_RESET,
      credits_delta: FREE_CREDITS_PER_MONTH,
      description: 'Monthly free credits reset',
      credit_snapshot: {
        free_credits: credit.free_credits_remaining,
        purchased_credits: credit.purchased_credits,
        gifted_credits: credit.gifted_credits,
        has_unlimited: credit.unlimited_subscription?.is_active || false,
      },
    });

    return credit;
  }

  private async expireSubscription(credit: ClaudeSummaryCreditDocument): Promise<void> {
    if (credit.unlimited_subscription) {
      credit.unlimited_subscription.is_active = false;
      await credit.save();

      await this.logTransaction({
        userId: credit.userId,
        type: TransactionType.SUBSCRIPTION_EXPIRED,
        credits_delta: 0,
        plan_name: credit.unlimited_subscription.plan_name,
        description: `Unlimited subscription expired (${credit.unlimited_subscription.plan_name})`,
        credit_snapshot: {
          free_credits: credit.free_credits_remaining,
          purchased_credits: credit.purchased_credits,
          gifted_credits: credit.gifted_credits,
          has_unlimited: false,
        },
      });
    }
  }

  private async expireGiftedCredits(credit: ClaudeSummaryCreditDocument): Promise<void> {
    const expiredCredits = credit.gifted_credits;
    credit.gifted_credits = 0;
    credit.gifted_credits_expiry = null;
    await credit.save();

    await this.logTransaction({
      userId: credit.userId,
      type: TransactionType.GIFTED_EXPIRED,
      credits_delta: -expiredCredits,
      description: `Gifted credits expired (${expiredCredits} credits)`,
      credit_snapshot: {
        free_credits: credit.free_credits_remaining,
        purchased_credits: credit.purchased_credits,
        gifted_credits: 0,
        has_unlimited: credit.unlimited_subscription?.is_active || false,
      },
    });
  }

  private async logTransaction(data: {
    userId: Types.ObjectId;
    type: TransactionType;
    credits_delta: number;
    amount?: number;
    currency?: string;
    plan_id?: Types.ObjectId;
    plan_name?: string;
    health_checkup_id?: Types.ObjectId;
    wallet_reference?: string;
    description: string;
    admin_id?: Types.ObjectId;
    credit_snapshot: {
      free_credits: number;
      purchased_credits: number;
      gifted_credits: number;
      has_unlimited: boolean;
    };
    metadata?: Record<string, any>;
  }): Promise<ClaudeSummaryTransactionDocument> {
    return this.transactionModel.create({
      userId: data.userId,
      type: data.type,
      credits_delta: data.credits_delta,
      amount: data.amount || null,
      currency: data.currency || 'NGN',
      plan_id: data.plan_id || null,
      plan_name: data.plan_name || null,
      health_checkup_id: data.health_checkup_id || null,
      wallet_reference: data.wallet_reference || null,
      description: data.description,
      admin_id: data.admin_id || null,
      credit_snapshot: data.credit_snapshot,
      metadata: data.metadata || {},
    });
  }

  // =====================
  // Admin Methods (for admin backend to call)
  // =====================

  /**
   * Gift credits to a patient (called by admin)
   */
  async giftCreditsToPatient(
    patientId: Types.ObjectId | string,
    credits: number,
    expiryDays: number | null,
    reason: string,
    adminId: Types.ObjectId | string,
  ) {
    const patientIdObj = typeof patientId === 'string' ? new Types.ObjectId(patientId) : patientId;
    const adminIdObj = typeof adminId === 'string' ? new Types.ObjectId(adminId) : adminId;

    const credit = await this.initializeUserCredits(patientIdObj);

    credit.gifted_credits += credits;
    credit.gifted_by = adminIdObj;
    credit.gift_reason = reason;

    if (expiryDays) {
      credit.gifted_credits_expiry = moment().add(expiryDays, 'days').toDate();
    } else {
      credit.gifted_credits_expiry = null; // Never expires
    }

    await credit.save();

    await this.logTransaction({
      userId: patientIdObj,
      type: TransactionType.ADMIN_GIFT,
      credits_delta: credits,
      description: `Admin gifted ${credits} credits${reason ? `: ${reason}` : ''}`,
      admin_id: adminIdObj,
      credit_snapshot: {
        free_credits: credit.free_credits_remaining,
        purchased_credits: credit.purchased_credits,
        gifted_credits: credit.gifted_credits,
        has_unlimited: credit.unlimited_subscription?.is_active || false,
      },
      metadata: { reason, expiry_days: expiryDays },
    });

    return {
      success: true,
      gifted_credits: credit.gifted_credits,
      expiry: credit.gifted_credits_expiry,
    };
  }

  /**
   * Gift unlimited subscription to a patient (called by admin)
   */
  async giftUnlimitedToPatient(
    patientId: Types.ObjectId | string,
    durationDays: number,
    reason: string,
    adminId: Types.ObjectId | string,
  ) {
    const patientIdObj = typeof patientId === 'string' ? new Types.ObjectId(patientId) : patientId;
    const adminIdObj = typeof adminId === 'string' ? new Types.ObjectId(adminId) : adminId;

    const credit = await this.initializeUserCredits(patientIdObj);
    const expiresAt = moment().add(durationDays, 'days').toDate();

    credit.unlimited_subscription = {
      plan_id: null as any,
      plan_name: `Admin Gift (${durationDays} days)`,
      started_at: new Date(),
      expires_at: expiresAt,
      is_active: true,
    };

    await credit.save();

    await this.logTransaction({
      userId: patientIdObj,
      type: TransactionType.ADMIN_GIFT_UNLIMITED,
      credits_delta: 0,
      description: `Admin gifted unlimited access for ${durationDays} days${reason ? `: ${reason}` : ''}`,
      admin_id: adminIdObj,
      credit_snapshot: {
        free_credits: credit.free_credits_remaining,
        purchased_credits: credit.purchased_credits,
        gifted_credits: credit.gifted_credits,
        has_unlimited: true,
      },
      metadata: { reason, duration_days: durationDays },
    });

    return {
      success: true,
      expires_at: expiresAt,
    };
  }

  /**
   * Revoke gifted credits from a patient (called by admin)
   */
  async revokeGiftedCredits(
    patientId: Types.ObjectId | string,
    reason: string,
    adminId: Types.ObjectId | string,
  ) {
    const patientIdObj = typeof patientId === 'string' ? new Types.ObjectId(patientId) : patientId;
    const adminIdObj = typeof adminId === 'string' ? new Types.ObjectId(adminId) : adminId;

    const credit = await this.creditModel.findOne({ userId: patientIdObj });
    if (!credit) {
      throw new NotFoundException('Credit record not found');
    }

    const revokedCredits = credit.gifted_credits;
    credit.gifted_credits = 0;
    credit.gifted_credits_expiry = null;
    credit.gifted_by = null;
    credit.gift_reason = null;

    await credit.save();

    await this.logTransaction({
      userId: patientIdObj,
      type: TransactionType.ADMIN_REVOKE,
      credits_delta: -revokedCredits,
      description: `Admin revoked ${revokedCredits} gifted credits${reason ? `: ${reason}` : ''}`,
      admin_id: adminIdObj,
      credit_snapshot: {
        free_credits: credit.free_credits_remaining,
        purchased_credits: credit.purchased_credits,
        gifted_credits: 0,
        has_unlimited: credit.unlimited_subscription?.is_active || false,
      },
      metadata: { reason, revoked_credits: revokedCredits },
    });

    return {
      success: true,
      revoked_credits: revokedCredits,
    };
  }

  // =====================
  // Credit Sharing (Patient to Patient)
  // =====================

  /**
   * Get credit sharing settings
   */
  async getCreditSharingSettings() {
    let settings = await this.settingsModel.findOne();
    if (!settings) {
      settings = await this.settingsModel.create(DEFAULT_SETTINGS);
    }
    return {
      enabled: settings.credit_sharing_enabled,
      min_amount: settings.credit_sharing_min_amount,
      max_amount: settings.credit_sharing_max_amount,
    };
  }

  /**
   * Search patients for credit sharing (by name or email)
   */
  async searchPatientsForCreditSharing(
    query: string,
    excludeUserId: Types.ObjectId | string,
  ): Promise<Array<{
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  }>> {
    const excludeId = typeof excludeUserId === 'string' ? new Types.ObjectId(excludeUserId) : excludeUserId;

    if (!query || query.length < 2) {
      return [];
    }

    const searchRegex = new RegExp(query, 'i');

    const patients = await this.userModel
      .find({
        _id: { $ne: excludeId },
        user_type: UserType.PATIENT,
        $or: [
          { 'profile.first_name': searchRegex },
          { 'profile.last_name': searchRegex },
          { 'profile.contact.email': searchRegex },
        ],
      })
      .select('_id profile.first_name profile.last_name profile.contact.email profile.profile_photo')
      .limit(10)
      .lean();

    return patients.map((patient: any) => ({
      id: patient._id.toString(),
      name: `${patient.profile?.first_name || ''} ${patient.profile?.last_name || ''}`.trim() || 'Unknown',
      email: patient.profile?.contact?.email || '',
      avatar: patient.profile?.profile_photo || null,
    }));
  }

  /**
   * Transfer credits from one patient to another
   */
  async transferCredits(
    senderId: Types.ObjectId | string,
    recipientId: Types.ObjectId | string,
    credits: number,
  ): Promise<{
    success: boolean;
    sender_remaining: number;
    message: string;
  }> {
    const senderIdObj = typeof senderId === 'string' ? new Types.ObjectId(senderId) : senderId;
    const recipientIdObj = typeof recipientId === 'string' ? new Types.ObjectId(recipientId) : recipientId;

    // Verify sender and recipient are different
    if (senderIdObj.equals(recipientIdObj)) {
      throw new BadRequestException('Cannot transfer credits to yourself');
    }

    // Get credit sharing settings
    const settings = await this.getCreditSharingSettings();

    if (!settings.enabled) {
      throw new BadRequestException('Credit sharing is currently disabled');
    }

    if (credits < settings.min_amount) {
      throw new BadRequestException(`Minimum transfer amount is ${settings.min_amount} credits`);
    }

    if (credits > settings.max_amount) {
      throw new BadRequestException(`Maximum transfer amount is ${settings.max_amount} credits`);
    }

    // Get sender and verify they exist
    const sender = await this.usersService.findById(senderIdObj);
    if (!sender) {
      throw new NotFoundException('Sender not found');
    }

    // Get recipient and verify they exist
    const recipient = await this.usersService.findById(recipientIdObj);
    if (!recipient) {
      throw new NotFoundException('Recipient not found');
    }

    // Initialize credits for both users
    const senderCredit = await this.initializeUserCredits(senderIdObj);
    const recipientCredit = await this.initializeUserCredits(recipientIdObj);

    // Check if sender has enough purchased credits (only purchased credits can be transferred)
    if (senderCredit.purchased_credits < credits) {
      throw new BadRequestException(
        `Insufficient purchased credits. You have ${senderCredit.purchased_credits} purchased credits available for transfer.`
      );
    }

    // Perform the transfer
    senderCredit.purchased_credits -= credits;
    recipientCredit.purchased_credits += credits;

    await senderCredit.save();
    await recipientCredit.save();

    const senderName = `${sender.profile?.first_name || ''} ${sender.profile?.last_name || ''}`.trim() || 'Unknown';
    const recipientName = `${recipient.profile?.first_name || ''} ${recipient.profile?.last_name || ''}`.trim() || 'Unknown';

    // Log transaction for sender
    await this.logTransaction({
      userId: senderIdObj,
      type: TransactionType.CREDIT_TRANSFER_SENT,
      credits_delta: -credits,
      description: `Sent ${credits} AI credits to ${recipientName}`,
      credit_snapshot: {
        free_credits: senderCredit.free_credits_remaining,
        purchased_credits: senderCredit.purchased_credits,
        gifted_credits: senderCredit.gifted_credits,
        has_unlimited: senderCredit.unlimited_subscription?.is_active || false,
      },
      metadata: {
        recipient_id: recipientIdObj.toString(),
        recipient_name: recipientName,
        recipient_email: recipient.profile?.contact?.email,
      },
    });

    // Log transaction for recipient
    await this.logTransaction({
      userId: recipientIdObj,
      type: TransactionType.CREDIT_TRANSFER_RECEIVED,
      credits_delta: credits,
      description: `Received ${credits} AI credits from ${senderName}`,
      credit_snapshot: {
        free_credits: recipientCredit.free_credits_remaining,
        purchased_credits: recipientCredit.purchased_credits,
        gifted_credits: recipientCredit.gifted_credits,
        has_unlimited: recipientCredit.unlimited_subscription?.is_active || false,
      },
      metadata: {
        sender_id: senderIdObj.toString(),
        sender_name: senderName,
        sender_email: sender.profile?.contact?.email,
      },
    });

    // Send email notifications
    this.sendCreditTransferEmails({
      sender: {
        email: sender.profile?.contact?.email,
        name: senderName,
        credits_sent: credits,
        remaining_credits: senderCredit.purchased_credits,
      },
      recipient: {
        email: recipient.profile?.contact?.email,
        name: recipientName,
        credits_received: credits,
        total_credits: recipientCredit.purchased_credits,
      },
    });

    logger.log(`Credit transfer: ${senderName} sent ${credits} credits to ${recipientName}`);

    return {
      success: true,
      sender_remaining: senderCredit.purchased_credits,
      message: `Successfully sent ${credits} AI credits to ${recipientName}`,
    };
  }

  /**
   * Send credit transfer notification emails
   */
  private sendCreditTransferEmails(data: {
    sender: {
      email: string;
      name: string;
      credits_sent: number;
      remaining_credits: number;
    };
    recipient: {
      email: string;
      name: string;
      credits_received: number;
      total_credits: number;
    };
  }) {
    try {
      // Send email to sender
      if (data.sender.email) {
        const senderEmailBody = creditTransferSentEmail({
          senderName: data.sender.name,
          recipientName: data.recipient.name,
          creditsSent: data.sender.credits_sent,
          remainingCredits: data.sender.remaining_credits,
          transferDate: moment().format('MMMM DD, YYYY [at] h:mm A'),
        });

        this.generalHelpers.generateEmailAndSend({
          email: data.sender.email,
          subject: `AI Credits Sent - ${data.sender.credits_sent} credits to ${data.recipient.name}`,
          emailBody: senderEmailBody,
        });
      }

      // Send email to recipient
      if (data.recipient.email) {
        const recipientEmailBody = creditTransferReceivedEmail({
          recipientName: data.recipient.name,
          senderName: data.sender.name,
          creditsReceived: data.recipient.credits_received,
          totalCredits: data.recipient.total_credits,
          transferDate: moment().format('MMMM DD, YYYY [at] h:mm A'),
        });

        this.generalHelpers.generateEmailAndSend({
          email: data.recipient.email,
          subject: `AI Credits Received - ${data.recipient.credits_received} credits from ${data.sender.name}`,
          emailBody: recipientEmailBody,
        });
      }

      logger.log(`Credit transfer emails sent to ${data.sender.email} and ${data.recipient.email}`);
    } catch (error) {
      logger.error(`Failed to send credit transfer emails: ${error.message}`);
      // Don't throw - email failure shouldn't fail the transfer
    }
  }
}
