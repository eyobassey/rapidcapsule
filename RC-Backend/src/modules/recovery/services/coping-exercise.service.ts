import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  CopingExerciseSession,
  CopingExerciseSessionDocument,
} from '../entities/coping-exercise-session.entity';

@Injectable()
export class CopingExerciseService {
  private readonly logger = new Logger(CopingExerciseService.name);

  constructor(
    @InjectModel(CopingExerciseSession.name)
    private exerciseModel: Model<CopingExerciseSessionDocument>,
  ) {}

  /**
   * Create a new coping exercise session record.
   */
  async create(
    userId: Types.ObjectId,
    data: {
      exercise_id: string;
      name: string;
      category: string;
      description?: string;
      estimated_minutes?: number;
      steps?: string[];
      evidence_base?: string;
      source?: string;
    },
  ) {
    const session = await this.exerciseModel.create({
      user: userId,
      ...data,
    });
    return session;
  }

  /**
   * Get paginated exercise history for a user with optional category filter.
   */
  async getHistory(
    userId: string,
    category?: string,
    page = 1,
    limit = 10,
  ) {
    const query: any = {
      user: new Types.ObjectId(userId),
      deleted_at: { $exists: false },
    };
    if (category) query.category = category;

    const total = await this.exerciseModel.countDocuments(query);
    const docs = await this.exerciseModel
      .find(query)
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return {
      total,
      docs,
      pages: Math.ceil(total / limit),
      perPage: limit,
      currentPage: page,
    };
  }

  /**
   * Get a single exercise session by ID.
   */
  async getById(id: string, userId: string) {
    const session = await this.exerciseModel
      .findOne({
        _id: new Types.ObjectId(id),
        user: new Types.ObjectId(userId),
        deleted_at: { $exists: false },
      })
      .lean();

    if (!session) {
      throw new NotFoundException('Exercise session not found');
    }

    return session;
  }

  /**
   * Get exercise stats: total count, by category, charts data, wellness score.
   */
  async getStats(userId: string) {
    const uid = new Types.ObjectId(userId);
    const baseMatch = { user: uid, deleted_at: { $exists: false } };

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const [
      totalResult,
      completedCount,
      byCategory,
      lastSession,
      timeSeries,
      recentCount,
    ] = await Promise.all([
      this.exerciseModel.countDocuments(baseMatch),
      this.exerciseModel.countDocuments({ ...baseMatch, completed: true }),
      this.exerciseModel.aggregate([
        { $match: baseMatch },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      this.exerciseModel
        .findOne(baseMatch)
        .sort({ created_at: -1 })
        .select('name category created_at')
        .lean(),
      this.exerciseModel.aggregate([
        { $match: { ...baseMatch, created_at: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } },
            count: { $sum: 1 },
            completed: { $sum: { $cond: ['$completed', 1, 0] } },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      this.exerciseModel.countDocuments({
        ...baseMatch,
        created_at: { $gte: fourteenDaysAgo },
      }),
    ]);

    // Category map + distribution
    const categoryMap: Record<string, number> = {};
    const categoryDistribution: { category: string; count: number; percentage: number }[] = [];
    for (const item of byCategory) {
      categoryMap[item._id] = item.count;
      categoryDistribution.push({
        category: item._id,
        count: item.count,
        percentage: totalResult > 0 ? Math.round((item.count / totalResult) * 100) : 0,
      });
    }

    // Streak: consecutive days with at least one exercise (from today backward)
    const daysWithExercises = new Set(timeSeries.map((d) => d._id));
    let currentStreak = 0;
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      if (daysWithExercises.has(key)) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Wellness score (0-100)
    const uniqueCategories = Object.keys(categoryMap).length;
    const completionRate = totalResult > 0 ? (completedCount / totalResult) * 100 : 0;

    const frequencyScore = Math.min(recentCount / 14, 1) * 30;
    const completionScore = totalResult > 0 ? (completedCount / totalResult) * 25 : 0;
    const diversityScore = Math.min(uniqueCategories / 6, 1) * 25;

    let recencyScore = 0;
    if (lastSession) {
      const daysSince = Math.floor(
        (Date.now() - new Date((lastSession as any).created_at).getTime()) / 86400000,
      );
      if (daysSince <= 1) recencyScore = 20;
      else if (daysSince <= 3) recencyScore = 15;
      else if (daysSince <= 7) recencyScore = 10;
      else if (daysSince <= 14) recencyScore = 5;
    }

    const wellnessScore = Math.round(
      frequencyScore + completionScore + diversityScore + recencyScore,
    );

    return {
      total: totalResult,
      by_category: categoryMap,
      most_used_category: byCategory.length > 0 ? byCategory[0]._id : null,
      last_session: lastSession,
      completion_rate: Math.round(completionRate),
      current_streak: currentStreak,
      wellness_score: wellnessScore,
      exercises_last_14_days: recentCount,
      unique_categories: uniqueCategories,
      time_series: timeSeries.map((d) => ({
        date: d._id,
        count: d.count,
        completed: d.completed,
      })),
      category_distribution: categoryDistribution,
    };
  }
}
