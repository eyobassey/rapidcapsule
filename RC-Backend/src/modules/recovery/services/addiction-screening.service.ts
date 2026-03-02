import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Model, Types } from 'mongoose';
import {
  AddictionScreening,
  AddictionScreeningDocument,
  RiskLevel,
  ScreeningInstrumentType,
} from '../entities/addiction-screening.entity';
import {
  RecoveryProfile,
  RecoveryProfileDocument,
} from '../entities/recovery-profile.entity';
import { BeginScreeningDto } from '../dto/begin-screening.dto';
import { SubmitScreeningDto } from '../dto/submit-screening.dto';
import {
  SCREENING_INSTRUMENTS,
  getInstrument,
  ASSIST_ALCOHOL_RISK_ZONES,
  RiskZone,
} from '../constants/screening-instruments';
import Anthropic from '@anthropic-ai/sdk';

@Injectable()
export class AddictionScreeningService {
  private readonly logger = new Logger(AddictionScreeningService.name);
  private claudeClient: Anthropic | null = null;

  constructor(
    @InjectModel(AddictionScreening.name)
    private screeningModel: Model<AddictionScreeningDocument>,
    @InjectModel(RecoveryProfile.name)
    private recoveryProfileModel: Model<RecoveryProfileDocument>,
    private eventEmitter: EventEmitter2,
  ) {
    this.initClaude();
  }

  private initClaude() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey) {
      try {
        this.claudeClient = new Anthropic({ apiKey });
      } catch (error) {
        this.logger.error('Failed to initialise Claude AI client:', error);
      }
    }
  }

  /**
   * Begin a screening — returns the instrument definition with questions.
   */
  async beginScreening(dto: BeginScreeningDto, userId: string) {
    const instrument = getInstrument(dto.instrument);
    if (!instrument) {
      throw new BadRequestException(
        `Unknown screening instrument: ${dto.instrument}`,
      );
    }

    return {
      instrument_id: instrument.id,
      instrument_name: instrument.name,
      short_name: instrument.short_name,
      description: instrument.description,
      estimated_minutes: instrument.estimated_minutes,
      target_substances: instrument.target_substances,
      total_questions: instrument.questions.length,
      questions: instrument.questions,
      scoring: {
        min_score: instrument.scoring.min_score,
        max_score: instrument.scoring.max_score,
      },
    };
  }

  /**
   * Submit completed screening answers, score, classify risk, and persist.
   */
  async submitScreening(
    screeningId: string | null,
    dto: SubmitScreeningDto,
    instrumentType: ScreeningInstrumentType,
    userId: string,
  ) {
    const instrument = getInstrument(instrumentType);
    if (!instrument) {
      throw new BadRequestException(
        `Unknown instrument: ${instrumentType}`,
      );
    }

    // Validate all required questions are answered
    const requiredIds = instrument.questions.map((q) => q.id);
    // For ASSIST, Q1 is multi-select gateway — Q2-Q7 are per-substance, Q8 is universal
    // For others, all questions must be answered
    if (instrumentType !== ScreeningInstrumentType.ASSIST) {
      const missingQuestions = requiredIds.filter(
        (id) => dto.answers[id] === undefined,
      );
      if (missingQuestions.length > 0) {
        throw new BadRequestException(
          `Missing answers for: ${missingQuestions.join(', ')}`,
        );
      }
    }

    // Calculate scores
    const scoreResult = this.calculateScore(instrumentType, dto.answers);

    // Determine risk zone
    const riskZone = this.determineRiskZone(
      instrumentType,
      scoreResult.total_score,
    );

    // Identify substances from answers
    const substances = this.identifySubstances(instrumentType, dto.answers);

    // Check if this is first screening (baseline)
    const existingCount = await this.screeningModel.countDocuments({
      user: new Types.ObjectId(userId),
      instrument: instrumentType,
      deleted_at: { $exists: false },
    });

    const screening = await this.screeningModel.create({
      user: new Types.ObjectId(userId),
      instrument: instrumentType,
      screening_type: 'self',
      answers: dto.answers,
      total_score: scoreResult.total_score,
      subscale_scores: scoreResult.subscale_scores,
      risk_level: riskZone.level,
      risk_zone_label: riskZone.label,
      substances_identified: substances,
      duration_ms: dto.duration_ms,
      is_baseline: existingCount === 0,
    });

    // Update recovery profile screening score if exists
    const profile = await this.recoveryProfileModel.findOne({
      user: new Types.ObjectId(userId),
    });
    if (profile) {
      const update: any = {
        'outcomes.screening_score_current': scoreResult.total_score,
      };
      if (existingCount === 0) {
        update['outcomes.screening_score_at_enrollment'] =
          scoreResult.total_score;
        update.baseline_screening = screening._id;
      }
      await this.recoveryProfileModel.updateOne(
        { _id: profile._id },
        { $set: update },
      );
    }

    // Emit event for risk engine recalculation
    this.eventEmitter.emit('recovery.screening_completed', {
      userId,
      screeningId: screening._id.toString(),
    });

    return {
      screening_id: screening._id,
      instrument: instrumentType,
      total_score: scoreResult.total_score,
      max_score: instrument.scoring.max_score,
      subscale_scores: scoreResult.subscale_scores,
      risk_level: riskZone.level,
      risk_zone_label: riskZone.label,
      recommendation: riskZone.recommendation,
      colour: riskZone.colour,
      substances_identified: substances,
      is_baseline: existingCount === 0,
      risk_zones: instrument.risk_zones,
    };
  }

  /**
   * Generate AI interpretation of screening results using Claude.
   */
  async generateAIInterpretation(screeningId: string, userId: string) {
    if (!this.claudeClient) {
      return { error: 'AI service is not available' };
    }

    const screening = await this.screeningModel.findOne({
      _id: new Types.ObjectId(screeningId),
      user: new Types.ObjectId(userId),
    });
    if (!screening) {
      throw new NotFoundException('Screening not found');
    }

    if (screening.ai_interpretation?.content) {
      return {
        generated: false,
        ai_interpretation: screening.ai_interpretation,
        message: 'Interpretation already generated',
      };
    }

    const instrument = getInstrument(screening.instrument);

    // Fetch previous screening for comparison
    const previousScreening = await this.screeningModel
      .findOne({
        user: new Types.ObjectId(userId),
        instrument: screening.instrument,
        _id: { $ne: screening._id },
        deleted_at: { $exists: false },
      })
      .sort({ created_at: -1 });

    try {
      const response = await this.claudeClient.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        system: this.getInterpretationSystemPrompt(),
        messages: [
          {
            role: 'user',
            content: this.buildInterpretationPrompt(
              screening,
              instrument,
              previousScreening,
            ),
          },
        ],
      });

      const textContent = response.content.find(
        (block) => block.type === 'text',
      );
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text response from Claude');
      }

      const parsed = this.parseJSONResponse(textContent.text);

      const interpretation = {
        generated_at: new Date(),
        model: 'claude-sonnet-4-20250514',
        content: parsed,
      };

      await this.screeningModel.updateOne(
        { _id: screening._id },
        { $set: { ai_interpretation: interpretation } },
      );

      return { generated: true, ai_interpretation: interpretation };
    } catch (error) {
      this.logger.error('Error generating AI interpretation:', error);
      const errorResult = {
        generated_at: new Date(),
        model: 'claude-sonnet-4-20250514',
        content: null,
        error: error.message || 'Failed to generate interpretation',
      };

      await this.screeningModel.updateOne(
        { _id: screening._id },
        { $set: { ai_interpretation: errorResult } },
      );

      return { generated: false, ai_interpretation: errorResult };
    }
  }

  /**
   * Get screening history for a user with optional filtering.
   */
  async getScreeningHistory(
    userId: string,
    instrument?: ScreeningInstrumentType,
    page = 1,
    limit = 10,
    sortOrder: 'asc' | 'desc' = 'desc',
  ) {
    const query: any = {
      user: new Types.ObjectId(userId),
      deleted_at: { $exists: false },
    };
    if (instrument) query.instrument = instrument;

    const total = await this.screeningModel.countDocuments(query);
    const screenings = await this.screeningModel
      .find(query)
      .sort({ created_at: sortOrder === 'desc' ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return {
      total,
      docs: screenings,
      pages: Math.ceil(total / limit),
      perPage: limit,
      currentPage: page,
    };
  }

  /**
   * Get a single screening by ID.
   */
  async getScreeningById(screeningId: string, userId: string) {
    const screening = await this.screeningModel
      .findOne({
        _id: new Types.ObjectId(screeningId),
        user: new Types.ObjectId(userId),
        deleted_at: { $exists: false },
      })
      .lean();

    if (!screening) {
      throw new NotFoundException('Screening not found');
    }

    const instrument = getInstrument(screening.instrument);

    return {
      ...screening,
      instrument_details: instrument
        ? {
            name: instrument.name,
            short_name: instrument.short_name,
            max_score: instrument.scoring.max_score,
            risk_zones: instrument.risk_zones,
          }
        : null,
    };
  }

  /**
   * Get score progress over time for charting.
   */
  async getProgressOverTime(userId: string, instrument: ScreeningInstrumentType) {
    const screenings = await this.screeningModel
      .find({
        user: new Types.ObjectId(userId),
        instrument,
        deleted_at: { $exists: false },
      })
      .sort({ created_at: 1 })
      .select('total_score risk_level created_at is_baseline')
      .lean();

    return screenings.map((s: any) => ({
      date: s.created_at,
      score: s.total_score,
      risk_level: s.risk_level,
      is_baseline: s.is_baseline,
    }));
  }

  /**
   * Recommend which instrument to take based on user context.
   */
  async getRecommendedInstrument(userId: string) {
    const profile = await this.recoveryProfileModel
      .findOne({ user: new Types.ObjectId(userId) })
      .lean();

    const lastScreening = await this.screeningModel
      .findOne({
        user: new Types.ObjectId(userId),
        deleted_at: { $exists: false },
      })
      .sort({ created_at: -1 })
      .lean();

    const substances =
      profile?.substance_use_history?.map((s: any) => s.substance) || [];
    const hasAlcohol = substances.includes('alcohol');
    const hasDrugs = substances.some(
      (s: string) => !['alcohol', 'tobacco'].includes(s),
    );

    let recommended: string;
    let reason: string;

    if (!lastScreening) {
      // First screening — recommend comprehensive
      if (substances.length === 0 || substances.length > 2) {
        recommended = 'assist';
        reason = 'Comprehensive first assessment covering all substance categories.';
      } else if (hasAlcohol && !hasDrugs) {
        recommended = 'audit';
        reason = 'Detailed alcohol-specific assessment for your profile.';
      } else if (hasDrugs && !hasAlcohol) {
        recommended = 'dast10';
        reason = 'Focused drug abuse screening for your profile.';
      } else {
        recommended = 'assist';
        reason = 'Multi-substance assessment for comprehensive evaluation.';
      }
    } else {
      // Follow-up — use same instrument for comparability
      recommended = lastScreening.instrument;
      reason = `Follow-up using the same instrument (${
        getInstrument(lastScreening.instrument)?.short_name
      }) for score comparison.`;
    }

    const instrument = getInstrument(recommended);

    return {
      recommended_instrument: recommended,
      instrument_name: instrument?.name,
      short_name: instrument?.short_name,
      reason,
      estimated_minutes: instrument?.estimated_minutes,
      last_screening_date: lastScreening
        ? (lastScreening as any).created_at
        : null,
      last_screening_score: lastScreening?.total_score ?? null,
      last_screening_risk: lastScreening?.risk_level ?? null,
    };
  }

  /**
   * Soft-delete a screening.
   */
  async deleteScreening(screeningId: string, userId: string) {
    const screening = await this.screeningModel.findOne({
      _id: new Types.ObjectId(screeningId),
      user: new Types.ObjectId(userId),
      deleted_at: { $exists: false },
    });
    if (!screening) {
      throw new NotFoundException('Screening not found');
    }

    await this.screeningModel.updateOne(
      { _id: screening._id },
      { $set: { deleted_at: new Date() } },
    );

    return { deleted: true };
  }

  /**
   * Compare a screening result to the patient's baseline screening.
   * Returns delta, percentage change, and clinical context.
   */
  async compareToBaseline(screeningId: string, userId: string) {
    const screening = await this.screeningModel
      .findOne({
        _id: new Types.ObjectId(screeningId),
        user: new Types.ObjectId(userId),
        deleted_at: { $exists: false },
      })
      .lean();

    if (!screening) {
      throw new NotFoundException('Screening not found');
    }

    // Find baseline (first screening of same instrument)
    const baseline = await this.screeningModel
      .findOne({
        user: new Types.ObjectId(userId),
        instrument: screening.instrument,
        is_baseline: true,
        deleted_at: { $exists: false },
      })
      .lean();

    if (!baseline) {
      return {
        screening_id: screeningId,
        has_baseline: false,
        message: 'No baseline screening found for this instrument',
      };
    }

    const delta = screening.total_score - baseline.total_score;
    const percentChange =
      baseline.total_score > 0
        ? Math.round((delta / baseline.total_score) * 100)
        : 0;

    // Compare subscales
    const subscaleComparison: Record<
      string,
      { baseline: number; current: number; delta: number }
    > = {};
    if (screening.subscale_scores && baseline.subscale_scores) {
      for (const key of Object.keys(screening.subscale_scores)) {
        subscaleComparison[key] = {
          baseline: (baseline.subscale_scores as any)[key] ?? 0,
          current: (screening.subscale_scores as any)[key] ?? 0,
          delta:
            ((screening.subscale_scores as any)[key] ?? 0) -
            ((baseline.subscale_scores as any)[key] ?? 0),
        };
      }
    }

    return {
      screening_id: screeningId,
      has_baseline: true,
      baseline: {
        screening_id: baseline._id,
        score: baseline.total_score,
        risk_level: baseline.risk_level,
        date: (baseline as any).created_at,
      },
      current: {
        score: screening.total_score,
        risk_level: screening.risk_level,
        date: (screening as any).created_at,
      },
      delta,
      percent_change: percentChange,
      direction: delta > 0 ? 'worsened' : delta < 0 ? 'improved' : 'unchanged',
      risk_level_change:
        baseline.risk_level !== screening.risk_level
          ? { from: baseline.risk_level, to: screening.risk_level }
          : null,
      subscale_comparison: subscaleComparison,
    };
  }

  /**
   * Schedule a follow-up screening at a specified interval.
   * Updates the screening record and the recovery profile.
   */
  async scheduleFollowUp(
    screeningId: string,
    userId: string,
    intervalDays: number,
  ) {
    if (intervalDays < 1 || intervalDays > 365) {
      throw new BadRequestException(
        'Interval must be between 1 and 365 days',
      );
    }

    const screening = await this.screeningModel.findOne({
      _id: new Types.ObjectId(screeningId),
      user: new Types.ObjectId(userId),
      deleted_at: { $exists: false },
    });

    if (!screening) {
      throw new NotFoundException('Screening not found');
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + intervalDays);

    // Update screening record
    await this.screeningModel.updateOne(
      { _id: screening._id },
      { $set: { next_screening_due: dueDate } },
    );

    // Update recovery profile
    await this.recoveryProfileModel.updateOne(
      { user: new Types.ObjectId(userId), deleted_at: { $exists: false } },
      { $set: { next_screening_due: dueDate } },
    );

    return {
      screening_id: screeningId,
      instrument: screening.instrument,
      next_screening_due: dueDate,
      interval_days: intervalDays,
    };
  }

  /**
   * Specialist-administered screening mode.
   * The specialist fills in the screening on behalf of the patient.
   */
  async administerScreening(
    patientId: string,
    specialistId: string,
    instrumentType: ScreeningInstrumentType,
    answers: Record<string, number>,
    clinicalNotes?: string,
  ) {
    const instrument = getInstrument(instrumentType);
    if (!instrument) {
      throw new BadRequestException(
        `Unknown instrument: ${instrumentType}`,
      );
    }

    // Validate answers (same as self-reported)
    if (instrumentType !== ScreeningInstrumentType.ASSIST) {
      const requiredIds = instrument.questions.map((q) => q.id);
      const missing = requiredIds.filter((id) => answers[id] === undefined);
      if (missing.length > 0) {
        throw new BadRequestException(
          `Missing answers for: ${missing.join(', ')}`,
        );
      }
    }

    const scoreResult = this.calculateScore(instrumentType, answers);
    const riskZone = this.determineRiskZone(instrumentType, scoreResult.total_score);
    const substances = this.identifySubstances(instrumentType, answers);

    const existingCount = await this.screeningModel.countDocuments({
      user: new Types.ObjectId(patientId),
      instrument: instrumentType,
      deleted_at: { $exists: false },
    });

    const screening = await this.screeningModel.create({
      user: new Types.ObjectId(patientId),
      instrument: instrumentType,
      screening_type: 'specialist',
      administered_by: new Types.ObjectId(specialistId),
      answers,
      total_score: scoreResult.total_score,
      subscale_scores: scoreResult.subscale_scores,
      risk_level: riskZone.level,
      risk_zone_label: riskZone.label,
      substances_identified: substances,
      is_baseline: existingCount === 0,
      clinical_notes: clinicalNotes,
      completed_at: new Date(),
    });

    // Update recovery profile
    const profile = await this.recoveryProfileModel.findOne({
      user: new Types.ObjectId(patientId),
    });
    if (profile) {
      const update: any = {
        'outcomes.screening_score_current': scoreResult.total_score,
      };
      if (existingCount === 0) {
        update['outcomes.screening_score_at_enrollment'] = scoreResult.total_score;
        update.baseline_screening = screening._id;
      }
      await this.recoveryProfileModel.updateOne(
        { _id: profile._id },
        { $set: update },
      );
    }

    // Emit event for risk engine
    this.eventEmitter.emit('recovery.screening_completed', {
      userId: patientId,
      screeningId: screening._id.toString(),
    });

    return {
      screening_id: screening._id,
      instrument: instrumentType,
      total_score: scoreResult.total_score,
      max_score: instrument.scoring.max_score,
      subscale_scores: scoreResult.subscale_scores,
      risk_level: riskZone.level,
      risk_zone_label: riskZone.label,
      recommendation: riskZone.recommendation,
      colour: riskZone.colour,
      substances_identified: substances,
      is_baseline: existingCount === 0,
      administered_by: specialistId,
      risk_zones: instrument.risk_zones,
    };
  }

  // ─── Scoring Algorithms ──────────────────────────────────────────

  private calculateScore(
    instrument: ScreeningInstrumentType,
    answers: Record<string, number>,
  ): { total_score: number; subscale_scores: Record<string, number> } {
    switch (instrument) {
      case ScreeningInstrumentType.AUDIT:
        return this.scoreAudit(answers);
      case ScreeningInstrumentType.DAST10:
        return this.scoreDast10(answers);
      case ScreeningInstrumentType.CAGE:
        return this.scoreCage(answers);
      case ScreeningInstrumentType.ASSIST:
        return this.scoreAssist(answers);
      default:
        throw new BadRequestException(`Unsupported instrument: ${instrument}`);
    }
  }

  private scoreAudit(answers: Record<string, number>) {
    let total = 0;
    for (let i = 1; i <= 10; i++) {
      const key = `audit_q${i}`;
      total += answers[key] ?? 0;
    }

    // AUDIT subscales
    const consumption =
      (answers.audit_q1 ?? 0) +
      (answers.audit_q2 ?? 0) +
      (answers.audit_q3 ?? 0);
    const dependence =
      (answers.audit_q4 ?? 0) +
      (answers.audit_q5 ?? 0) +
      (answers.audit_q6 ?? 0);
    const harm =
      (answers.audit_q7 ?? 0) +
      (answers.audit_q8 ?? 0) +
      (answers.audit_q9 ?? 0) +
      (answers.audit_q10 ?? 0);

    return {
      total_score: total,
      subscale_scores: { consumption, dependence, harm },
    };
  }

  private scoreDast10(answers: Record<string, number>) {
    let total = 0;
    for (let i = 1; i <= 10; i++) {
      const key = `dast_q${i}`;
      total += answers[key] ?? 0;
    }
    return { total_score: total, subscale_scores: {} };
  }

  private scoreCage(answers: Record<string, number>) {
    let total = 0;
    for (let i = 1; i <= 4; i++) {
      const key = `cage_q${i}`;
      total += answers[key] ?? 0;
    }
    return {
      total_score: total,
      subscale_scores: {
        clinically_significant: total >= 2 ? 1 : 0,
      },
    };
  }

  private scoreAssist(answers: Record<string, any>) {
    // ASSIST scores per substance (Q2-Q7 summed for each)
    const substanceScores: Record<string, number> = {};
    const usedSubstances: string[] = answers.assist_q1_substances || [];

    for (const substance of usedSubstances) {
      let score = 0;
      for (let q = 2; q <= 7; q++) {
        const key = `assist_q${q}_${substance}`;
        score += answers[key] ?? 0;
      }
      substanceScores[substance] = score;
    }

    // Overall = highest substance score
    const scores = Object.values(substanceScores);
    const highestScore = scores.length > 0 ? Math.max(...scores) : 0;

    return {
      total_score: highestScore,
      subscale_scores: substanceScores,
    };
  }

  // ─── Risk Zone Determination ─────────────────────────────────────

  private determineRiskZone(
    instrument: ScreeningInstrumentType,
    totalScore: number,
  ): RiskZone {
    const instrumentDef = getInstrument(instrument);
    if (!instrumentDef) {
      return {
        min_score: 0,
        max_score: 0,
        level: 'low',
        label: 'Unknown',
        recommendation: '',
        colour: '#94A3B8',
      };
    }

    const zones = instrumentDef.risk_zones;
    for (const zone of zones) {
      if (totalScore >= zone.min_score && totalScore <= zone.max_score) {
        return zone;
      }
    }

    // Fallback to highest zone
    return zones[zones.length - 1];
  }

  // ─── Substance Identification ────────────────────────────────────

  private identifySubstances(
    instrument: ScreeningInstrumentType,
    answers: Record<string, any>,
  ): string[] {
    switch (instrument) {
      case ScreeningInstrumentType.AUDIT:
      case ScreeningInstrumentType.CAGE:
        return ['alcohol'];
      case ScreeningInstrumentType.DAST10:
        return ['drugs'];
      case ScreeningInstrumentType.ASSIST:
        return answers.assist_q1_substances || [];
      default:
        return [];
    }
  }

  // ─── Claude AI Prompts ───────────────────────────────────────────

  private getInterpretationSystemPrompt(): string {
    return `You are a compassionate, evidence-based addiction healthcare communicator working within a UK NHS-aligned digital health platform. Your role is to interpret addiction screening results for patients in a way that is:

1. Empathetic and non-judgmental — addiction is a health condition, not a moral failing
2. Clear and accessible — written at an 8th-grade reading level
3. Actionable — provide specific, practical next steps
4. Hopeful — emphasise that recovery is possible and support is available
5. Clinically accurate — reference NICE guidelines where relevant

IMPORTANT:
- Do NOT diagnose. Use language like "your results suggest" or "this score indicates"
- Do NOT provide specific medication advice
- Do NOT include crisis helpline numbers (the platform handles that separately)
- Always recommend speaking with a qualified professional

Respond in strict JSON format with no markdown code fences.`;
  }

  private buildInterpretationPrompt(
    screening: any,
    instrument: any,
    previousScreening: any,
  ): string {
    const parts = [
      `Screening instrument: ${instrument?.name} (${instrument?.short_name})`,
      `Total score: ${screening.total_score} out of ${instrument?.scoring.max_score}`,
      `Risk level: ${screening.risk_level} (${screening.risk_zone_label})`,
    ];

    if (screening.subscale_scores && Object.keys(screening.subscale_scores).length > 0) {
      parts.push(`Subscale scores: ${JSON.stringify(screening.subscale_scores)}`);
    }

    if (screening.substances_identified?.length > 0) {
      parts.push(`Substances identified: ${screening.substances_identified.join(', ')}`);
    }

    if (previousScreening) {
      const scoreDelta = screening.total_score - previousScreening.total_score;
      const direction = scoreDelta > 0 ? 'increased' : scoreDelta < 0 ? 'decreased' : 'unchanged';
      parts.push(
        `Previous screening: score ${previousScreening.total_score} (${previousScreening.risk_level}), taken on ${previousScreening.created_at}. Score has ${direction} by ${Math.abs(scoreDelta)} points.`,
      );
    } else {
      parts.push('This is the patient\'s first screening with this instrument.');
    }

    parts.push(`
Please provide your interpretation as JSON with these fields:
{
  "summary": "2-3 sentence plain-English summary of what the score means",
  "risk_assessment": "Brief clinical risk assessment",
  "recommended_interventions": ["Array of 3-5 recommended next steps"],
  "recommended_specialist_type": "Type of specialist to see (e.g., 'Addiction Counselor', 'GP', 'Addiction Psychiatrist')",
  "urgency": "routine | soon | urgent | emergency",
  "brief_intervention_notes": "If score suggests brief intervention, provide 2-3 key talking points",
  "motivational_message": "A compassionate, recovery-oriented message for the patient",
  "comparison_to_previous": "If previous screening exists, compare and contextualise the change"
}`);

    return parts.join('\n');
  }

  private parseJSONResponse(text: string): any {
    let cleaned = text.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.slice(7);
    }
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.slice(3);
    }
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.slice(0, -3);
    }
    return JSON.parse(cleaned.trim());
  }
}
