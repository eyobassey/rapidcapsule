import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import Anthropic from '@anthropic-ai/sdk';
import {
  RecoveryPlan,
  RecoveryPlanDocument,
  PlanStatus,
  StageStatus,
} from '../entities/recovery-plan.entity';
import {
  RecoveryProfile,
  RecoveryProfileDocument,
} from '../entities/recovery-profile.entity';
import {
  AddictionScreening,
  AddictionScreeningDocument,
} from '../entities/addiction-screening.entity';
import {
  SobrietyLog,
  SobrietyLogDocument,
} from '../entities/sobriety-log.entity';
import {
  CrisisEvent,
  CrisisEventDocument,
} from '../entities/crisis-event.entity';
import {
  RiskAssessmentReport,
  RiskAssessmentReportDocument,
} from '../entities/risk-assessment-report.entity';
import { ClaudeSummaryCreditsService } from '../../claude-summary-credits/claude-summary-credits.service';

@Injectable()
export class RecoveryPlanService {
  private readonly logger = new Logger(RecoveryPlanService.name);
  private claudeClient: Anthropic | null = null;

  constructor(
    @InjectModel(RecoveryPlan.name)
    private planModel: Model<RecoveryPlanDocument>,
    @InjectModel(RecoveryProfile.name)
    private profileModel: Model<RecoveryProfileDocument>,
    @InjectModel(AddictionScreening.name)
    private screeningModel: Model<AddictionScreeningDocument>,
    @InjectModel(SobrietyLog.name)
    private sobrietyLogModel: Model<SobrietyLogDocument>,
    @InjectModel(CrisisEvent.name)
    private crisisEventModel: Model<CrisisEventDocument>,
    @InjectModel(RiskAssessmentReport.name)
    private riskReportModel: Model<RiskAssessmentReportDocument>,
    private readonly creditsService: ClaudeSummaryCreditsService,
  ) {
    this.initializeClaude();
  }

  private initializeClaude() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey) {
      this.claudeClient = new Anthropic({ apiKey });
      this.logger.log('Claude AI client initialized for recovery plan generation');
    } else {
      this.logger.warn('ANTHROPIC_API_KEY not configured — AI plan generation disabled');
    }
  }

  private formatStageName(name: string): string {
    if (!name) return '';
    return name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  /**
   * Create a new recovery plan.
   */
  async create(dto: any, userId: string, createdById?: string) {
    // Check for existing active plan
    const existingActive = await this.planModel.findOne({
      user: new Types.ObjectId(userId),
      status: PlanStatus.ACTIVE,
      deleted_at: { $exists: false },
    });

    if (existingActive) {
      throw new BadRequestException(
        'An active plan already exists. Complete or abandon it before creating a new one.',
      );
    }

    const plan = await this.planModel.create({
      user: new Types.ObjectId(userId),
      created_by: new Types.ObjectId(createdById || userId),
      plan_name: dto.plan_name,
      status: dto.status || PlanStatus.DRAFT,
      stages: dto.stages || [],
      relapse_prevention: dto.relapse_prevention || {},
      next_review_date: dto.next_review_date,
    });

    // Link to recovery profile
    await this.profileModel.updateOne(
      { user: new Types.ObjectId(userId), deleted_at: { $exists: false } },
      { $set: { current_plan: plan._id } },
    );

    return plan.toObject();
  }

  /**
   * Get the active plan for a user.
   */
  async getActivePlan(userId: string) {
    const plan = await this.planModel
      .findOne({
        user: new Types.ObjectId(userId),
        status: { $in: [PlanStatus.ACTIVE, PlanStatus.DRAFT] },
        deleted_at: { $exists: false },
      })
      .populate('created_by', 'profile.first_name profile.last_name')
      .lean();

    if (!plan) throw new NotFoundException('No active recovery plan found');

    // Compute progress
    const totalGoals = plan.stages.reduce(
      (sum: number, s: any) => sum + (s.goals?.length || 0),
      0,
    );
    const completedGoals = plan.stages.reduce(
      (sum: number, s: any) =>
        sum + (s.goals?.filter((g: any) => g.status === StageStatus.COMPLETED).length || 0),
      0,
    );

    // Normalize stage/goal field names for frontend compatibility
    const normalizedStages = plan.stages.map((s: any) => ({
      ...s,
      stage_name: this.formatStageName(s.name),
      duration_weeks: s.estimated_duration_weeks,
      goals: (s.goals || []).map((g: any) => ({
        ...g,
        title: g.description,
      })),
    }));

    return {
      ...plan,
      stages: normalizedStages,
      progress: {
        total_stages: plan.stages.length,
        completed_stages: plan.stages.filter(
          (s: any) => s.status === StageStatus.COMPLETED,
        ).length,
        current_stage: plan.stages.find(
          (s: any) => s.status === StageStatus.IN_PROGRESS,
        ),
        total_goals: totalGoals,
        completed_goals: completedGoals,
        goal_completion_rate:
          totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0,
      },
    };
  }

  /**
   * Get plan history for a user.
   */
  async getPlanHistory(userId: string, page = 1, limit = 10) {
    const query = {
      user: new Types.ObjectId(userId),
      deleted_at: { $exists: false },
    };
    const skip = (page - 1) * limit;

    const [plans, total] = await Promise.all([
      this.planModel
        .find(query)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .populate('created_by', 'profile.first_name profile.last_name')
        .lean(),
      this.planModel.countDocuments(query),
    ]);

    return {
      data: plans,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  /**
   * Update stage status (advance to next stage, complete a stage).
   */
  async updateStageStatus(
    userId: string,
    stageId: string,
    newStatus: StageStatus,
  ) {
    const plan = await this.planModel.findOne({
      user: new Types.ObjectId(userId),
      status: PlanStatus.ACTIVE,
      'stages.stage_id': stageId,
      deleted_at: { $exists: false },
    });

    if (!plan) throw new NotFoundException('Active plan with this stage not found');

    const updateFields: any = { 'stages.$.status': newStatus };
    if (newStatus === StageStatus.IN_PROGRESS) {
      updateFields['stages.$.started_at'] = new Date();
    } else if (newStatus === StageStatus.COMPLETED) {
      updateFields['stages.$.completed_at'] = new Date();
    }

    await this.planModel.updateOne(
      { _id: plan._id, 'stages.stage_id': stageId },
      { $set: updateFields },
    );

    // If all stages completed, mark plan as completed
    const refreshed = await this.planModel.findById(plan._id).lean();
    if (refreshed) {
      const allCompleted = refreshed.stages.every(
        (s: any) =>
          s.status === StageStatus.COMPLETED || s.status === StageStatus.SKIPPED,
      );
      if (allCompleted) {
        await this.planModel.updateOne(
          { _id: plan._id },
          { $set: { status: PlanStatus.COMPLETED } },
        );
      }
    }

    return { plan_id: plan._id, stage_id: stageId, new_status: newStatus };
  }

  /**
   * Track goal progress within a stage.
   */
  async updateGoalStatus(
    userId: string,
    stageId: string,
    goalId: string,
    newStatus: StageStatus,
    evidence?: string,
  ) {
    const plan = await this.planModel.findOne({
      user: new Types.ObjectId(userId),
      status: PlanStatus.ACTIVE,
      deleted_at: { $exists: false },
    });

    if (!plan) throw new NotFoundException('Active plan not found');

    const stage = plan.stages.find((s: any) => s.stage_id === stageId);
    if (!stage) throw new NotFoundException('Stage not found');

    const goal = stage.goals?.find((g: any) => g.goal_id === goalId);
    if (!goal) throw new NotFoundException('Goal not found');

    // Update the specific goal
    const updateQuery: any = {};
    const goalIndex = stage.goals.indexOf(goal);
    updateQuery[`stages.$[stage].goals.${goalIndex}.status`] = newStatus;
    if (newStatus === StageStatus.COMPLETED) {
      updateQuery[`stages.$[stage].goals.${goalIndex}.achieved_at`] = new Date();
    }
    if (evidence) {
      updateQuery[`stages.$[stage].goals.${goalIndex}.evidence`] = evidence;
    }

    await this.planModel.updateOne(
      { _id: plan._id },
      { $set: updateQuery },
      { arrayFilters: [{ 'stage.stage_id': stageId }] },
    );

    return {
      plan_id: plan._id,
      stage_id: stageId,
      goal_id: goalId,
      new_status: newStatus,
    };
  }

  /**
   * Activate a draft plan.
   */
  async activate(userId: string, planId: string) {
    const userObjId = new Types.ObjectId(userId);
    const plan = await this.planModel.findOne({
      _id: new Types.ObjectId(planId),
      $or: [{ user: userObjId }, { created_by: userObjId }],
      status: PlanStatus.DRAFT,
      deleted_at: { $exists: false },
    });

    if (!plan) throw new NotFoundException('Draft plan not found');

    // Set first stage to in_progress
    const stages = plan.stages;
    if (stages.length > 0) {
      (stages[0] as any).status = StageStatus.IN_PROGRESS;
      (stages[0] as any).started_at = new Date();
    }

    await this.planModel.updateOne(
      { _id: plan._id },
      { $set: { status: PlanStatus.ACTIVE, stages } },
    );

    return { plan_id: planId, status: PlanStatus.ACTIVE };
  }

  /**
   * Abandon a plan.
   */
  async abandon(userId: string, planId: string, reason?: string) {
    const userObjId = new Types.ObjectId(userId);
    const result = await this.planModel.updateOne(
      {
        _id: new Types.ObjectId(planId),
        $or: [{ user: userObjId }, { created_by: userObjId }],
        status: { $in: [PlanStatus.DRAFT, PlanStatus.ACTIVE] },
        deleted_at: { $exists: false },
      },
      { $set: { status: PlanStatus.ABANDONED } },
    );

    if (result.modifiedCount === 0) {
      throw new NotFoundException('Plan not found or already completed/abandoned');
    }

    return { plan_id: planId, status: PlanStatus.ABANDONED };
  }

  /**
   * Schedule a plan review.
   */
  async scheduleReview(userId: string, planId: string, reviewDate: Date) {
    const result = await this.planModel.updateOne(
      {
        _id: new Types.ObjectId(planId),
        user: new Types.ObjectId(userId),
        deleted_at: { $exists: false },
      },
      { $set: { next_review_date: reviewDate } },
    );

    if (result.modifiedCount === 0) {
      throw new NotFoundException('Plan not found');
    }

    return { plan_id: planId, next_review_date: reviewDate };
  }

  /**
   * Generate an AI-powered recovery plan using Claude.
   * Gathers all patient recovery data and produces a structured, editable plan.
   */
  async generateAIPlan(patientId: string, specialistId: string) {
    if (!this.claudeClient) {
      throw new BadRequestException('AI service is not available. Please try again later.');
    }

    // 1. Check AI credits for the specialist
    const creditCheck = await this.creditsService.canGenerateSummary(specialistId);
    if (!creditCheck.can_generate) {
      throw new BadRequestException(
        'No AI credits available. You need at least 1 credit to generate an AI recovery plan. Purchase credits from your wallet.',
      );
    }

    // 2. Gather all patient data
    const patientObjId = new Types.ObjectId(patientId);

    const [profile, screenings, recentLogs, crisisEvents, riskReports, existingPlans] =
      await Promise.all([
        this.profileModel.findOne({
          user: patientObjId,
          status: { $ne: 'archived' },
          deleted_at: { $exists: false },
        }).lean(),
        this.screeningModel
          .find({ user: patientObjId, deleted_at: { $exists: false } })
          .sort({ created_at: -1 })
          .limit(5)
          .lean(),
        this.sobrietyLogModel
          .find({ user: patientObjId })
          .sort({ log_date: -1 })
          .limit(30)
          .lean(),
        this.crisisEventModel
          .find({ user: patientObjId })
          .sort({ created_at: -1 })
          .limit(10)
          .lean(),
        this.riskReportModel
          .find({ user: patientObjId, deleted_at: { $exists: false } })
          .sort({ created_at: -1 })
          .limit(3)
          .lean(),
        this.planModel
          .find({ user: patientObjId, deleted_at: { $exists: false } })
          .sort({ created_at: -1 })
          .limit(3)
          .select('plan_name status stages relapse_prevention created_at')
          .lean(),
      ]);

    if (!profile) {
      throw new NotFoundException('No recovery profile found for this patient.');
    }

    // 3. Build context for Claude
    const patientContext = this.buildPatientContext(
      profile,
      screenings,
      recentLogs,
      crisisEvents,
      riskReports,
      existingPlans,
    );

    // 4. Call Claude
    try {
      const response = await this.claudeClient.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        system: this.getAIPlanSystemPrompt(),
        messages: [{ role: 'user', content: patientContext }],
      });

      const textBlock = response.content.find((b) => b.type === 'text');
      if (!textBlock || textBlock.type !== 'text') {
        throw new Error('No text response from AI');
      }

      const generatedPlan = this.parseAIPlanResponse(textBlock.text);

      // 5. Consume credit after successful generation
      try {
        await this.creditsService.consumeCredit(
          specialistId,
          new Types.ObjectId().toString(),
        );
      } catch (e) {
        this.logger.error('Failed to consume credit for AI plan generation:', e.message);
      }

      return {
        generated_plan: generatedPlan,
        credits_used: 1,
        credits_remaining: creditCheck.credits_remaining === 'unlimited'
          ? 'unlimited'
          : (creditCheck.credits_remaining as number) - 1,
        model: 'claude-sonnet-4-20250514',
        generated_at: new Date(),
      };
    } catch (error) {
      this.logger.error('AI plan generation failed:', error.message);
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(
        'Failed to generate AI plan. Please try again or create the plan manually.',
      );
    }
  }

  private buildPatientContext(
    profile: any,
    screenings: any[],
    recentLogs: any[],
    crisisEvents: any[],
    riskReports: any[],
    existingPlans: any[],
  ): string {
    const sobrietyDays = profile.sobriety_start_date
      ? Math.max(0, Math.floor((Date.now() - new Date(profile.sobriety_start_date).getTime()) / 86400000))
      : 0;

    const substances = (profile.substance_use_history || []).map((s: any) => ({
      substance: s.substance,
      is_primary: s.is_primary,
      years_of_use: s.years_of_use,
      age_of_first_use: s.age_of_first_use,
      frequency_at_peak: s.frequency_at_peak,
      route: s.route_of_administration,
      previous_treatment_attempts: s.previous_treatment_attempts,
      last_use_date: s.last_use_date,
    }));

    const moodSummary = recentLogs.length > 0 ? {
      avg_mood: (recentLogs.reduce((s: number, l: any) => s + (l.mood_score || 0), 0) / recentLogs.length).toFixed(1),
      avg_craving: (recentLogs.reduce((s: number, l: any) => s + (l.craving_intensity || 0), 0) / recentLogs.length).toFixed(1),
      sober_days_ratio: `${recentLogs.filter((l: any) => l.sober_today).length}/${recentLogs.length}`,
      common_triggers: [...new Set(recentLogs.flatMap((l: any) => l.triggers_encountered || []))].slice(0, 10),
    } : null;

    const screeningSummary = screenings.map((s: any) => ({
      instrument: s.instrument,
      score: s.total_score,
      risk_level: s.risk_level,
      date: s.created_at,
    }));

    const crisisSummary = crisisEvents.map((e: any) => ({
      type: e.type,
      severity: e.severity,
      resolved: e.resolved,
      date: e.created_at,
    }));

    const riskSummary = {
      current_score: profile.current_risk_score ?? 0,
      current_level: profile.current_risk_level || 'low',
      recent_reports: riskReports.map((r: any) => ({
        score: r.score,
        level: r.level,
        date: r.created_at,
      })),
    };

    const previousPlans = existingPlans.map((p: any) => ({
      name: p.plan_name,
      status: p.status,
      stages: (p.stages || []).map((s: any) => s.name),
      date: p.created_at,
    }));

    return `Generate a comprehensive recovery plan for this patient based on all available clinical data.

## Patient Recovery Profile
- **Status**: ${profile.status}
- **Care Level**: ${profile.care_level || 'Not set'}
- **Sobriety Days**: ${sobrietyDays}
- **Sobriety Start Date**: ${profile.sobriety_start_date || 'Not set'}
- **Longest Sobriety Streak**: ${profile.longest_sobriety_days || 0} days
- **Total Relapses**: ${profile.total_relapse_count || 0}
- **Enrolled Date**: ${profile.enrolled_at || profile.created_at}

## Substance Use History
${JSON.stringify(substances, null, 2)}

## Risk Assessment
${JSON.stringify(riskSummary, null, 2)}

## Recent Check-ins (Last 30 Days)
${moodSummary ? JSON.stringify(moodSummary, null, 2) : 'No check-in data available'}

## Screening Results
${screeningSummary.length > 0 ? JSON.stringify(screeningSummary, null, 2) : 'No screenings completed'}

## Crisis History
${crisisSummary.length > 0 ? JSON.stringify(crisisSummary, null, 2) : 'No crisis events recorded'}

## Previous Plans
${previousPlans.length > 0 ? JSON.stringify(previousPlans, null, 2) : 'No previous plans'}

Generate the plan now as a JSON object.`;
  }

  private getAIPlanSystemPrompt(): string {
    return `You are an expert addiction medicine specialist and recovery programme designer working within the UK healthcare system. You create evidence-based, personalised recovery plans.

Given patient recovery data, generate a structured recovery plan as a JSON object. Base your recommendations on:
- The patient's substance use history (type, duration, severity)
- Current risk level and recent trends
- Screening results (AUDIT-C, DAST-10, PHQ-9, GAD-7, etc.)
- Recent check-in data (mood, cravings, sobriety compliance)
- Crisis history
- Previous treatment attempts and plans
- Care level (detox, intensive outpatient, outpatient, aftercare, maintenance)

IMPORTANT RULES:
- Stages must follow logical clinical progression
- Only include stages appropriate for the patient's care level
- Goals must be SMART (Specific, Measurable, Achievable, Relevant, Time-bound)
- Interventions must match evidence-based practices for the primary substance
- Relapse prevention must be personalised to the patient's identified triggers
- Set realistic durations based on clinical evidence
- Use UK spelling and terminology

Respond with ONLY a valid JSON object in this exact format (no markdown, no explanation):
{
  "plan_name": "string — descriptive name for the plan",
  "next_review_date_offset_days": 14,
  "stages": [
    {
      "name": "assessment|detox|stabilization|active_treatment|maintenance|aftercare",
      "estimated_duration_weeks": 2,
      "goals": [
        {
          "description": "string — specific goal",
          "measurable_target": "string — how to measure"
        }
      ],
      "interventions": [
        {
          "type": "individual_therapy|group_therapy|medication|peer_support|family_therapy|psychoeducation|harm_reduction",
          "description": "string — specific intervention details",
          "frequency": "string — how often"
        }
      ]
    }
  ],
  "relapse_prevention": {
    "personal_triggers": ["string"],
    "warning_signs": ["string"],
    "coping_strategies": ["string"],
    "emergency_plan": "string — step-by-step crisis plan"
  }
}`;
  }

  private parseAIPlanResponse(text: string): any {
    try {
      // Try direct parse first
      const parsed = JSON.parse(text.trim());
      return this.validateAndNormalisePlan(parsed);
    } catch {
      // Try extracting JSON from markdown code blocks
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1].trim());
          return this.validateAndNormalisePlan(parsed);
        } catch {
          this.logger.error('Failed to parse AI plan JSON from code block');
        }
      }

      // Try finding JSON object in text
      const braceMatch = text.match(/\{[\s\S]*\}/);
      if (braceMatch) {
        try {
          const parsed = JSON.parse(braceMatch[0]);
          return this.validateAndNormalisePlan(parsed);
        } catch {
          this.logger.error('Failed to parse AI plan JSON from brace match');
        }
      }

      throw new Error('Could not parse AI-generated plan');
    }
  }

  private validateAndNormalisePlan(plan: any): any {
    const validStageNames = ['assessment', 'detox', 'stabilization', 'active_treatment', 'maintenance', 'aftercare'];
    const validInterventionTypes = ['individual_therapy', 'group_therapy', 'medication', 'peer_support', 'family_therapy', 'psychoeducation', 'harm_reduction'];

    // Assign IDs and validate stages
    let stageCounter = 0;
    let goalCounter = 0;

    const stages = (plan.stages || []).map((s: any, i: number) => {
      stageCounter++;
      return {
        stage_id: `ai_stage_${stageCounter}_${Date.now()}`,
        name: validStageNames.includes(s.name) ? s.name : 'active_treatment',
        order: i + 1,
        estimated_duration_weeks: s.estimated_duration_weeks || 4,
        goals: (s.goals || []).map((g: any) => {
          goalCounter++;
          return {
            goal_id: `ai_goal_${goalCounter}_${Date.now()}`,
            description: g.description || '',
            measurable_target: g.measurable_target || '',
            target_date: '',
            status: 'pending',
          };
        }),
        interventions: (s.interventions || []).map((intv: any) => ({
          type: validInterventionTypes.includes(intv.type) ? intv.type : 'individual_therapy',
          description: intv.description || '',
          frequency: intv.frequency || '',
        })),
      };
    });

    const reviewOffsetDays = plan.next_review_date_offset_days || 14;
    const reviewDate = new Date();
    reviewDate.setDate(reviewDate.getDate() + reviewOffsetDays);

    return {
      plan_name: plan.plan_name || 'AI-Generated Recovery Plan',
      next_review_date: reviewDate.toISOString().split('T')[0],
      stages,
      relapse_prevention: {
        personal_triggers: plan.relapse_prevention?.personal_triggers || [],
        warning_signs: plan.relapse_prevention?.warning_signs || [],
        coping_strategies: plan.relapse_prevention?.coping_strategies || [],
        safe_activities: [],
        emergency_plan: plan.relapse_prevention?.emergency_plan || '',
        high_risk_situations: [],
      },
    };
  }
}
