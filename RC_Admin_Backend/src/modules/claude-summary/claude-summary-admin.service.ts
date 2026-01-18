import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as moment from 'moment';
import { ClaudeSummaryPlan, ClaudeSummaryPlanDocument, PlanType } from './entities/claude-summary-plan.entity';
import { ClaudeSummaryCredit, ClaudeSummaryCreditDocument } from './entities/claude-summary-credit.entity';
import { ClaudeSummaryTransaction, ClaudeSummaryTransactionDocument, TransactionType } from './entities/claude-summary-transaction.entity';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

const FREE_CREDITS_PER_MONTH = 5;

@Injectable()
export class ClaudeSummaryAdminService {
  constructor(
    @InjectModel(ClaudeSummaryPlan.name) private planModel: Model<ClaudeSummaryPlanDocument>,
    @InjectModel(ClaudeSummaryCredit.name) private creditModel: Model<ClaudeSummaryCreditDocument>,
    @InjectModel(ClaudeSummaryTransaction.name) private transactionModel: Model<ClaudeSummaryTransactionDocument>,
  ) {}

  // =====================
  // Plan Management
  // =====================

  async createPlan(createPlanDto: CreatePlanDto, adminId: string): Promise<ClaudeSummaryPlanDocument> {
    // Validation based on plan type
    if (createPlanDto.type === PlanType.BUNDLE && !createPlanDto.credits) {
      throw new BadRequestException('Bundle plans must specify credits');
    }

    if ((createPlanDto.type === PlanType.UNLIMITED_MONTHLY || createPlanDto.type === PlanType.UNLIMITED_YEARLY) && !createPlanDto.duration_days) {
      throw new BadRequestException('Unlimited plans must specify duration_days');
    }

    const plan = await this.planModel.create({
      ...createPlanDto,
      credits: createPlanDto.type === PlanType.BUNDLE ? createPlanDto.credits : null,
      duration_days: createPlanDto.type !== PlanType.BUNDLE ? createPlanDto.duration_days : null,
      created_by: new Types.ObjectId(adminId),
    });

    return plan;
  }

  async updatePlan(planId: string, updatePlanDto: UpdatePlanDto): Promise<ClaudeSummaryPlanDocument> {
    const plan = await this.planModel.findByIdAndUpdate(
      planId,
      { $set: updatePlanDto },
      { new: true },
    );

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    return plan;
  }

  async deletePlan(planId: string): Promise<{ deleted: boolean }> {
    const plan = await this.planModel.findByIdAndDelete(planId);

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    return { deleted: true };
  }

  async getPlans(includeInactive = false): Promise<ClaudeSummaryPlanDocument[]> {
    const filter = includeInactive ? {} : { is_active: true };
    return this.planModel.find(filter).sort({ sort_order: 1 }).lean();
  }

  async getPlanById(planId: string): Promise<ClaudeSummaryPlanDocument> {
    const plan = await this.planModel.findById(planId);
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }
    return plan;
  }

  // =====================
  // Gift Credits
  // =====================

  async giftCreditsToPatient(
    patientId: string,
    credits: number,
    expiryDays: number | null,
    reason: string,
    adminId: string,
  ) {
    const patientIdObj = new Types.ObjectId(patientId);
    const adminIdObj = new Types.ObjectId(adminId);

    let credit = await this.creditModel.findOne({ userId: patientIdObj });

    if (!credit) {
      // Initialize credits for the patient
      const nextMonth = moment().add(1, 'month').startOf('month').toDate();
      credit = await this.creditModel.create({
        userId: patientIdObj,
        free_credits_remaining: FREE_CREDITS_PER_MONTH,
        free_credits_reset_date: nextMonth,
        purchased_credits: 0,
        gifted_credits: 0,
        gifted_credits_expiry: null,
        unlimited_subscription: null,
        total_summaries_generated: 0,
        total_amount_spent: 0,
      });
    }

    credit.gifted_credits += credits;
    credit.gifted_by = adminIdObj;
    credit.gift_reason = reason;

    if (expiryDays) {
      credit.gifted_credits_expiry = moment().add(expiryDays, 'days').toDate();
    } else {
      credit.gifted_credits_expiry = null; // Never expires
    }

    await credit.save();

    // Log transaction
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

  async giftUnlimitedToPatient(
    patientId: string,
    durationDays: number,
    reason: string,
    adminId: string,
  ) {
    const patientIdObj = new Types.ObjectId(patientId);
    const adminIdObj = new Types.ObjectId(adminId);

    let credit = await this.creditModel.findOne({ userId: patientIdObj });

    if (!credit) {
      const nextMonth = moment().add(1, 'month').startOf('month').toDate();
      credit = await this.creditModel.create({
        userId: patientIdObj,
        free_credits_remaining: FREE_CREDITS_PER_MONTH,
        free_credits_reset_date: nextMonth,
        purchased_credits: 0,
        gifted_credits: 0,
        unlimited_subscription: null,
        total_summaries_generated: 0,
        total_amount_spent: 0,
      });
    }

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

  async revokeGiftedCredits(patientId: string, reason: string, adminId: string) {
    const patientIdObj = new Types.ObjectId(patientId);
    const adminIdObj = new Types.ObjectId(adminId);

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
  // Patient Credits Management
  // =====================

  async getPatientCredits(patientId: string) {
    const patientIdObj = new Types.ObjectId(patientId);
    const credit = await this.creditModel.findOne({ userId: patientIdObj });

    if (!credit) {
      return {
        exists: false,
        free_credits_remaining: FREE_CREDITS_PER_MONTH,
        purchased_credits: 0,
        gifted_credits: 0,
        has_unlimited_subscription: false,
        total_summaries_generated: 0,
        total_amount_spent: 0,
      };
    }

    // Check if subscription is still active
    let hasUnlimited = false;
    if (credit.unlimited_subscription?.is_active) {
      hasUnlimited = moment(credit.unlimited_subscription.expires_at).isAfter(moment());
    }

    return {
      exists: true,
      free_credits_remaining: credit.free_credits_remaining,
      free_credits_reset_date: credit.free_credits_reset_date,
      purchased_credits: credit.purchased_credits,
      gifted_credits: credit.gifted_credits,
      gifted_credits_expiry: credit.gifted_credits_expiry,
      gifted_by: credit.gifted_by,
      gift_reason: credit.gift_reason,
      has_unlimited_subscription: hasUnlimited,
      unlimited_subscription: hasUnlimited ? credit.unlimited_subscription : null,
      total_summaries_generated: credit.total_summaries_generated,
      total_amount_spent: credit.total_amount_spent,
      created_at: credit.created_at,
      updated_at: credit.updated_at,
    };
  }

  async getPatientTransactionHistory(patientId: string, page = 1, limit = 20) {
    const patientIdObj = new Types.ObjectId(patientId);
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      this.transactionModel
        .find({ userId: patientIdObj })
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.transactionModel.countDocuments({ userId: patientIdObj }),
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
  // Analytics
  // =====================

  async getUsageAnalytics(startDate?: string, endDate?: string) {
    const start = startDate ? moment(startDate).startOf('day').toDate() : moment().subtract(30, 'days').startOf('day').toDate();
    const end = endDate ? moment(endDate).endOf('day').toDate() : moment().endOf('day').toDate();

    const usageTypes = [
      TransactionType.FREE_USAGE,
      TransactionType.PURCHASED_USAGE,
      TransactionType.GIFTED_USAGE,
      TransactionType.UNLIMITED_USAGE,
    ];

    const [totalUsage, usageBySource, uniqueUsers] = await Promise.all([
      // Total usage count
      this.transactionModel.countDocuments({
        type: { $in: usageTypes },
        created_at: { $gte: start, $lte: end },
      }),

      // Usage breakdown by source
      this.transactionModel.aggregate([
        {
          $match: {
            type: { $in: usageTypes },
            created_at: { $gte: start, $lte: end },
          },
        },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
          },
        },
      ]),

      // Unique users who generated summaries
      this.transactionModel.distinct('userId', {
        type: { $in: usageTypes },
        created_at: { $gte: start, $lte: end },
      }),
    ]);

    const bySource: Record<string, number> = {};
    usageBySource.forEach((item) => {
      bySource[item._id] = item.count;
    });

    return {
      period: { start, end },
      total_summaries_generated: totalUsage,
      by_source: {
        free: bySource[TransactionType.FREE_USAGE] || 0,
        purchased: bySource[TransactionType.PURCHASED_USAGE] || 0,
        gifted: bySource[TransactionType.GIFTED_USAGE] || 0,
        unlimited: bySource[TransactionType.UNLIMITED_USAGE] || 0,
      },
      unique_users: uniqueUsers.length,
    };
  }

  async getDailyUsageTrends(startDate?: string, endDate?: string) {
    const start = startDate ? moment(startDate).startOf('day').toDate() : moment().subtract(30, 'days').startOf('day').toDate();
    const end = endDate ? moment(endDate).endOf('day').toDate() : moment().endOf('day').toDate();

    const usageTypes = [
      TransactionType.FREE_USAGE,
      TransactionType.PURCHASED_USAGE,
      TransactionType.GIFTED_USAGE,
      TransactionType.UNLIMITED_USAGE,
    ];

    const purchaseTypes = [TransactionType.BUNDLE_PURCHASE, TransactionType.UNLIMITED_PURCHASE];

    // Get both usage and revenue data in parallel
    const [dailyUsage, dailyRevenue] = await Promise.all([
      // Daily usage counts
      this.transactionModel.aggregate([
        {
          $match: {
            type: { $in: usageTypes },
            created_at: { $gte: start, $lte: end },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$created_at' },
              month: { $month: '$created_at' },
              day: { $dayOfMonth: '$created_at' },
            },
            count: { $sum: 1 },
            unique_users: { $addToSet: '$userId' },
          },
        },
        {
          $project: {
            _id: 0,
            date: {
              $dateFromParts: {
                year: '$_id.year',
                month: '$_id.month',
                day: '$_id.day',
              },
            },
            count: 1,
            unique_users: { $size: '$unique_users' },
          },
        },
        {
          $sort: { date: 1 },
        },
      ]),

      // Daily revenue
      this.transactionModel.aggregate([
        {
          $match: {
            type: { $in: purchaseTypes },
            created_at: { $gte: start, $lte: end },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$created_at' },
              month: { $month: '$created_at' },
              day: { $dayOfMonth: '$created_at' },
            },
            revenue: { $sum: '$amount' },
            purchases: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            date: {
              $dateFromParts: {
                year: '$_id.year',
                month: '$_id.month',
                day: '$_id.day',
              },
            },
            revenue: 1,
            purchases: 1,
          },
        },
        {
          $sort: { date: 1 },
        },
      ]),
    ]);

    // Merge usage and revenue data by date
    const dateMap = new Map<string, any>();

    // Add usage data
    dailyUsage.forEach((item: any) => {
      const dateKey = item.date.toISOString().split('T')[0];
      dateMap.set(dateKey, {
        _id: item.date,
        date: item.date,
        count: item.count,
        unique_users: item.unique_users,
        revenue: 0,
        purchases: 0,
      });
    });

    // Merge revenue data
    dailyRevenue.forEach((item: any) => {
      const dateKey = item.date.toISOString().split('T')[0];
      if (dateMap.has(dateKey)) {
        const existing = dateMap.get(dateKey);
        existing.revenue = item.revenue;
        existing.purchases = item.purchases;
      } else {
        dateMap.set(dateKey, {
          _id: item.date,
          date: item.date,
          count: 0,
          unique_users: 0,
          revenue: item.revenue,
          purchases: item.purchases,
        });
      }
    });

    // Convert to sorted array
    const mergedData = Array.from(dateMap.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    return {
      period: { start, end },
      daily_usage: mergedData,
    };
  }

  async getRevenueReport(startDate?: string, endDate?: string) {
    const start = startDate ? moment(startDate).startOf('day').toDate() : moment().subtract(30, 'days').startOf('day').toDate();
    const end = endDate ? moment(endDate).endOf('day').toDate() : moment().endOf('day').toDate();

    const purchaseTypes = [TransactionType.BUNDLE_PURCHASE, TransactionType.UNLIMITED_PURCHASE];

    const [totalRevenue, revenueByPlan, dailyRevenue, purchaseCount] = await Promise.all([
      // Total revenue
      this.transactionModel.aggregate([
        {
          $match: {
            type: { $in: purchaseTypes },
            created_at: { $gte: start, $lte: end },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
          },
        },
      ]),

      // Revenue by plan
      this.transactionModel.aggregate([
        {
          $match: {
            type: { $in: purchaseTypes },
            created_at: { $gte: start, $lte: end },
          },
        },
        {
          $group: {
            _id: '$plan_name',
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
      ]),

      // Daily revenue
      this.transactionModel.aggregate([
        {
          $match: {
            type: { $in: purchaseTypes },
            created_at: { $gte: start, $lte: end },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$created_at' },
              month: { $month: '$created_at' },
              day: { $dayOfMonth: '$created_at' },
            },
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            date: {
              $dateFromParts: {
                year: '$_id.year',
                month: '$_id.month',
                day: '$_id.day',
              },
            },
            total: 1,
            count: 1,
          },
        },
        {
          $sort: { date: 1 },
        },
      ]),

      // Total purchase count
      this.transactionModel.countDocuments({
        type: { $in: purchaseTypes },
        created_at: { $gte: start, $lte: end },
      }),
    ]);

    const byPlan: Record<string, { total: number; count: number }> = {};
    revenueByPlan.forEach((item) => {
      if (item._id) {
        byPlan[item._id] = { total: item.total, count: item.count };
      }
    });

    return {
      period: { start, end },
      total_revenue: totalRevenue[0]?.total || 0,
      currency: 'NGN',
      total_purchases: purchaseCount,
      by_plan: byPlan,
      daily_revenue: dailyRevenue,
    };
  }

  async getTopUsers(limit = 10) {
    const topUsers = await this.creditModel
      .find({ total_summaries_generated: { $gt: 0 } })
      .sort({ total_summaries_generated: -1 })
      .limit(limit)
      .populate('userId', 'email profile.first_name profile.last_name')
      .lean();

    // For each user, get their usage breakdown from transactions
    const results = await Promise.all(
      topUsers.map(async (credit: any) => {
        const userId = credit.userId?._id || credit.userId;

        // Get usage breakdown
        const usageBreakdown = await this.transactionModel.aggregate([
          {
            $match: {
              userId: userId,
              type: {
                $in: [
                  TransactionType.FREE_USAGE,
                  TransactionType.PURCHASED_USAGE,
                  TransactionType.GIFTED_USAGE,
                  TransactionType.UNLIMITED_USAGE,
                ],
              },
            },
          },
          {
            $group: {
              _id: '$type',
              count: { $sum: 1 },
            },
          },
        ]);

        const breakdown: Record<string, number> = {};
        usageBreakdown.forEach((item) => {
          breakdown[item._id] = item.count;
        });

        const userObj = credit.userId;
        return {
          _id: credit._id,
          user_info: userObj ? {
            _id: userObj._id,
            email: userObj.email,
            first_name: userObj.profile?.first_name,
            last_name: userObj.profile?.last_name,
          } : null,
          total_used: credit.total_summaries_generated || 0,
          free_used: breakdown[TransactionType.FREE_USAGE] || 0,
          purchased_used: breakdown[TransactionType.PURCHASED_USAGE] || 0,
          gifted_used: breakdown[TransactionType.GIFTED_USAGE] || 0,
          unlimited_used: breakdown[TransactionType.UNLIMITED_USAGE] || 0,
          total_amount_spent: credit.total_amount_spent || 0,
          has_unlimited: credit.unlimited_subscription?.is_active || false,
        };
      }),
    );

    return results;
  }

  async getOverviewStats() {
    const [
      totalUsers,
      usersWithCredits,
      activeUsers,
      totalSummaries,
      totalRevenue,
      activeUnlimited,
      activePlans,
    ] = await Promise.all([
      // Total users with credit records
      this.creditModel.countDocuments(),

      // Users who have purchased/been gifted credits
      this.creditModel.countDocuments({
        $or: [
          { purchased_credits: { $gt: 0 } },
          { gifted_credits: { $gt: 0 } },
          { 'unlimited_subscription.is_active': true },
        ],
      }),

      // Active users (users who have generated at least one summary)
      this.creditModel.countDocuments({
        total_summaries_generated: { $gt: 0 },
      }),

      // Total summaries generated
      this.creditModel.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: '$total_summaries_generated' },
          },
        },
      ]),

      // Total revenue
      this.creditModel.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: '$total_amount_spent' },
          },
        },
      ]),

      // Active unlimited subscriptions
      this.creditModel.countDocuments({
        'unlimited_subscription.is_active': true,
        'unlimited_subscription.expires_at': { $gt: new Date() },
      }),

      // Active plans count
      this.planModel.countDocuments({ is_active: true }),
    ]);

    return {
      total_users_with_credits: totalUsers,
      paying_users: usersWithCredits,
      active_users: activeUsers,
      total_summaries_generated: totalSummaries[0]?.total || 0,
      total_revenue: totalRevenue[0]?.total || 0,
      currency: 'NGN',
      active_unlimited_subscriptions: activeUnlimited,
      active_plans: activePlans,
    };
  }

  // =====================
  // Seed Default Plans
  // =====================

  async seedDefaultPlans(adminId: string) {
    const defaultPlans = [
      {
        name: 'Single Summary',
        type: PlanType.BUNDLE,
        credits: 1,
        price: 500,
        currency: 'NGN',
        duration_days: null,
        is_active: true,
        sort_order: 1,
        description: '1 AI Health Summary',
      },
      {
        name: 'Basic Pack',
        type: PlanType.BUNDLE,
        credits: 5,
        price: 2000,
        currency: 'NGN',
        duration_days: null,
        is_active: true,
        sort_order: 2,
        description: '5 summaries (20% savings)',
      },
      {
        name: 'Pro Pack',
        type: PlanType.BUNDLE,
        credits: 10,
        price: 3500,
        currency: 'NGN',
        duration_days: null,
        is_active: true,
        sort_order: 3,
        description: '10 summaries (30% savings)',
      },
      {
        name: 'Premium Pack',
        type: PlanType.BUNDLE,
        credits: 20,
        price: 6000,
        currency: 'NGN',
        duration_days: null,
        is_active: true,
        sort_order: 4,
        description: '20 summaries (40% savings)',
      },
      {
        name: 'Unlimited Monthly',
        type: PlanType.UNLIMITED_MONTHLY,
        credits: null,
        price: 5000,
        currency: 'NGN',
        duration_days: 30,
        is_active: true,
        sort_order: 5,
        description: 'Unlimited for 1 month',
      },
      {
        name: 'Unlimited Yearly',
        type: PlanType.UNLIMITED_YEARLY,
        credits: null,
        price: 48000,
        currency: 'NGN',
        duration_days: 365,
        is_active: true,
        sort_order: 6,
        description: 'Unlimited for 1 year (20% savings)',
      },
    ];

    const adminIdObj = new Types.ObjectId(adminId);
    const created: ClaudeSummaryPlanDocument[] = [];

    for (const planData of defaultPlans) {
      // Check if plan already exists
      const existing = await this.planModel.findOne({ name: planData.name });
      if (!existing) {
        const plan = await this.planModel.create({
          ...planData,
          created_by: adminIdObj,
        });
        created.push(plan);
      }
    }

    return {
      created: created.length,
      plans: created,
    };
  }

  // =====================
  // Private Helpers
  // =====================

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
}
