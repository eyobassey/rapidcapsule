import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as moment from 'moment';

import {
  AdvancedHealthScore,
  AdvancedHealthScoreDocument,
} from './entities/advanced-health-score.entity';
import {
  AdvancedScoreQuestion,
  AdvancedScoreQuestionDocument,
} from './entities/advanced-score-question.entity';
import {
  AdvancedScoreSettings,
  AdvancedScoreSettingsDocument,
  DEFAULT_SETTINGS,
} from './entities/advanced-score-settings.entity';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { ReorderQuestionsDto } from './dto/reorder-questions.dto';
import { HealthDomain, DOMAIN_LABELS } from './types/advanced-score.types';

@Injectable()
export class AdvancedHealthScoreAdminService {
  private readonly logger = new Logger(AdvancedHealthScoreAdminService.name);

  constructor(
    @InjectModel(AdvancedHealthScore.name)
    private scoreModel: Model<AdvancedHealthScoreDocument>,
    @InjectModel(AdvancedScoreQuestion.name)
    private questionModel: Model<AdvancedScoreQuestionDocument>,
    @InjectModel(AdvancedScoreSettings.name)
    private settingsModel: Model<AdvancedScoreSettingsDocument>,
  ) {}

  // =====================
  // Settings Management
  // =====================

  async getSettings(): Promise<AdvancedScoreSettingsDocument> {
    let settings = await this.settingsModel.findOne();
    if (!settings) {
      settings = await this.settingsModel.create(DEFAULT_SETTINGS);
    }
    return settings;
  }

  async updateSettings(
    updateDto: UpdateSettingsDto,
    adminId: string,
  ): Promise<AdvancedScoreSettingsDocument> {
    let settings = await this.settingsModel.findOne();

    // Validate adminId is a valid ObjectId, otherwise skip setting it
    let adminObjectId: Types.ObjectId | undefined;
    if (adminId && Types.ObjectId.isValid(adminId)) {
      adminObjectId = new Types.ObjectId(adminId);
    }

    if (!settings) {
      const createData: any = {
        ...DEFAULT_SETTINGS,
        ...updateDto,
      };
      if (adminObjectId) {
        createData.updated_by = adminObjectId;
      }
      settings = await this.settingsModel.create(createData);
    } else {
      Object.assign(settings, updateDto);
      if (adminObjectId) {
        settings.updated_by = adminObjectId;
      }
      await settings.save();
    }

    return settings;
  }

  /**
   * Get default settings values from backend constants
   * Used by admin frontend for "Reset to Defaults" functionality
   */
  getDefaultSettings() {
    return DEFAULT_SETTINGS;
  }

  // =====================
  // Questions Management
  // =====================

  async getQuestions(includeInactive = false): Promise<AdvancedScoreQuestionDocument[]> {
    const filter = includeInactive ? {} : { is_active: true };
    return this.questionModel
      .find(filter)
      .sort({ domain_order: 1, question_order: 1 })
      .lean();
  }

  async getQuestionById(questionId: string): Promise<AdvancedScoreQuestionDocument> {
    const question = await this.questionModel.findById(questionId);
    if (!question) {
      throw new NotFoundException('Question not found');
    }
    return question;
  }

  async createQuestion(
    createDto: CreateQuestionDto,
    adminId: string,
  ): Promise<AdvancedScoreQuestionDocument> {
    const question = await this.questionModel.create({
      ...createDto,
      created_by: new Types.ObjectId(adminId),
    });
    return question;
  }

  async updateQuestion(
    questionId: string,
    updateDto: UpdateQuestionDto,
  ): Promise<AdvancedScoreQuestionDocument> {
    const question = await this.questionModel.findByIdAndUpdate(
      questionId,
      { $set: updateDto },
      { new: true },
    );

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    return question;
  }

  async deleteQuestion(questionId: string): Promise<{ deleted: boolean }> {
    const result = await this.questionModel.deleteOne({
      _id: new Types.ObjectId(questionId),
    });

    if (result.deletedCount === 0) {
      throw new NotFoundException('Question not found');
    }

    return { deleted: true };
  }

  async reorderQuestions(
    reorderDto: ReorderQuestionsDto,
  ): Promise<{ updated: number }> {
    let updated = 0;

    for (const item of reorderDto.questions) {
      const result = await this.questionModel.updateOne(
        { _id: new Types.ObjectId(item.question_id) },
        { $set: { question_order: item.new_order } },
      );
      if (result.modifiedCount > 0) {
        updated++;
      }
    }

    return { updated };
  }

  async getQuestionsByDomain(): Promise<
    Record<HealthDomain, { label: string; questions: AdvancedScoreQuestionDocument[] }>
  > {
    const questions = await this.getQuestions(true);
    const grouped: Record<string, { label: string; questions: AdvancedScoreQuestionDocument[] }> = {};

    for (const domain of Object.values(HealthDomain)) {
      grouped[domain] = {
        label: DOMAIN_LABELS[domain],
        questions: questions.filter((q) => q.domain === domain),
      };
    }

    return grouped as Record<HealthDomain, { label: string; questions: AdvancedScoreQuestionDocument[] }>;
  }

  // =====================
  // Analytics
  // =====================

  async getOverviewStats() {
    const [
      totalAssessments,
      completedAssessments,
      totalQuestions,
      activeQuestions,
      settings,
    ] = await Promise.all([
      this.scoreModel.countDocuments(),
      this.scoreModel.countDocuments({ status: 'completed' }),
      this.questionModel.countDocuments(),
      this.questionModel.countDocuments({ is_active: true }),
      this.getSettings(),
    ]);

    // Calculate average score
    const avgScoreResult = await this.scoreModel.aggregate([
      { $match: { status: 'completed', 'report.overall_score': { $exists: true } } },
      { $group: { _id: null, avg: { $avg: '$report.overall_score' } } },
    ]);
    const averageScore = avgScoreResult[0]?.avg || 0;

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = moment().subtract(30, 'days').toDate();
    const recentAssessments = await this.scoreModel.countDocuments({
      created_at: { $gte: thirtyDaysAgo },
    });

    // Credits consumed
    const creditsResult = await this.scoreModel.aggregate([
      { $group: { _id: null, total: { $sum: '$credits_used' } } },
    ]);
    const totalCreditsUsed = creditsResult[0]?.total || 0;

    return {
      total_assessments: totalAssessments,
      completed_assessments: completedAssessments,
      total_questions: totalQuestions,
      active_questions: activeQuestions,
      average_score: Math.round(averageScore * 10) / 10,
      recent_assessments_30d: recentAssessments,
      total_credits_used: totalCreditsUsed,
      settings: {
        credit_cost: settings.credit_cost,
        is_enabled: settings.is_enabled,
        max_documents: settings.max_documents,
      },
    };
  }

  async getUsageTrends(startDate?: string, endDate?: string) {
    const start = startDate
      ? moment(startDate).startOf('day').toDate()
      : moment().subtract(30, 'days').startOf('day').toDate();
    const end = endDate
      ? moment(endDate).endOf('day').toDate()
      : moment().endOf('day').toDate();

    const dailyUsage = await this.scoreModel.aggregate([
      {
        $match: {
          created_at: { $gte: start, $lte: end },
          status: 'completed',
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$created_at' },
          },
          count: { $sum: 1 },
          avg_score: { $avg: '$report.overall_score' },
          credits_used: { $sum: '$credits_used' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return {
      period: { start, end },
      daily_usage: dailyUsage.map((d) => ({
        date: d._id,
        assessments: d.count,
        average_score: Math.round(d.avg_score * 10) / 10,
        credits_used: d.credits_used,
      })),
    };
  }

  async getScoreDistribution() {
    const distribution = await this.scoreModel.aggregate([
      { $match: { status: 'completed', 'report.overall_score': { $exists: true } } },
      {
        $bucket: {
          groupBy: '$report.overall_score',
          boundaries: [0, 20, 40, 60, 80, 100],
          default: 'other',
          output: {
            count: { $sum: 1 },
          },
        },
      },
    ]);

    const labels = ['Poor (0-19)', 'Needs Attention (20-39)', 'Fair (40-59)', 'Good (60-79)', 'Excellent (80-100)'];
    const result = [];

    for (let i = 0; i < 5; i++) {
      const boundary = i * 20;
      const bucket = distribution.find((d) => d._id === boundary);
      result.push({
        label: labels[i],
        count: bucket?.count || 0,
      });
    }

    return result;
  }

  async getDomainAverages() {
    const domainAverages = await this.scoreModel.aggregate([
      { $match: { status: 'completed', 'report.domain_scores': { $exists: true } } },
      { $unwind: '$report.domain_scores' },
      {
        $group: {
          _id: '$report.domain_scores.domain',
          avg_score: { $avg: '$report.domain_scores.score' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return domainAverages.map((d) => ({
      domain: d._id,
      domain_label: DOMAIN_LABELS[d._id as HealthDomain] || d._id,
      average_score: Math.round(d.avg_score * 10) / 10,
      assessments: d.count,
    }));
  }

  async getPatientAssessments(
    patientId: string,
    page = 1,
    limit = 10,
  ) {
    const skip = (page - 1) * limit;
    const patientIdObj = new Types.ObjectId(patientId);

    const [assessments, total] = await Promise.all([
      this.scoreModel
        .find({ user_id: patientIdObj })
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .select({
          'report.overall_score': 1,
          'report.overall_status': 1,
          'report.overall_summary': 1,
          credits_used: 1,
          status: 1,
          created_at: 1,
        })
        .lean(),
      this.scoreModel.countDocuments({ user_id: patientIdObj }),
    ]);

    return {
      assessments,
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    };
  }

  async getPatientAssessmentDetail(assessmentId: string) {
    const assessment = await this.scoreModel.findById(assessmentId);

    if (!assessment) {
      throw new NotFoundException('Assessment not found');
    }

    return assessment;
  }
}
