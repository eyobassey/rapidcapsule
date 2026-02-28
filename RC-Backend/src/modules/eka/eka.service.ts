import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Model, Types } from 'mongoose';
import Anthropic from '@anthropic-ai/sdk';
import { EkaConversation, EkaConversationDocument } from './entities/eka-conversation.entity';
import { EkaChatDto } from './dto/eka.dto';
import { EKA_TOOLS, buildSystemPrompt, RecoveryContext } from './eka-tools';
import { THERAPEUTIC_EXERCISES, getExercise } from './eka-recovery-knowledge';
import { AUDIT, DAST10, CAGE, ASSIST } from '../recovery/constants/screening-instruments';
import { SOBRIETY_MILESTONES, getNextSobrietyMilestone } from '../recovery/constants/milestone-definitions';
import { EKA_TRIAL_TOOLS, buildTrialSystemPrompt } from './eka-trial-tools';
import { Infermedica } from '../../common/external/infermedica/infermedica';
import { ClaudeHealthSummaryService } from '../health-checkup/services/claude-health-summary.service';
import { ClaudeSummaryCreditsService } from '../claude-summary-credits/claude-summary-credits.service';
import { ClaudeAIService } from '../pharmacy/services/claude-ai.service';
import { TextractService } from '../pharmacy/services/textract.service';
import { PrescriptionNumberHelper } from '../../common/helpers/prescription-number.helper';
import { RiskScoringService } from '../recovery/services/risk-scoring.service';
import { UploadSource } from '../pharmacy/entities/patient-prescription-upload.entity';
import * as AWS from 'aws-sdk';

const MAX_CONTEXT_MESSAGES = 20;
const MODEL = 'claude-haiku-4-5-20251001';
const MAX_TOKENS = 1500;

@Injectable()
export class EkaService {
  private readonly logger = new Logger(EkaService.name);
  private client: Anthropic | null = null;

  constructor(
    @InjectModel(EkaConversation.name) private conversationModel: Model<EkaConversationDocument>,
    @InjectModel('Vital') private vitalModel: Model<any>,
    @InjectModel('HealthCheckup') private healthCheckupModel: Model<any>,
    @InjectModel('Prescription') private prescriptionModel: Model<any>,
    @InjectModel('SpecialistPrescription') private specialistPrescriptionModel: Model<any>,
    @InjectModel('PatientPrescriptionUpload') private prescriptionUploadModel: Model<any>,
    @InjectModel('Appointment') private appointmentModel: Model<any>,
    @InjectModel('Drug') private drugModel: Model<any>,
    @InjectModel('Order') private orderModel: Model<any>,
    @InjectModel('PharmacyOrder') private pharmacyOrderModel: Model<any>,
    @InjectModel('Wallet') private walletModel: Model<any>,
    @InjectModel('User') private userModel: Model<any>,
    @InjectModel('BasicHealthScoreHistory') private basicScoreModel: Model<any>,
    @InjectModel('AdvancedHealthScore') private advancedScoreModel: Model<any>,
    @InjectModel('ClaudeSummaryCredit') private creditModel: Model<any>,
    @InjectModel('ClaudeSummaryPlan') private summaryPlanModel: Model<any>,
    @InjectModel('RecoveryProfile') private recoveryProfileModel: Model<any>,
    @InjectModel('AddictionScreening') private addictionScreeningModel: Model<any>,
    @InjectModel('SobrietyLog') private sobrietyLogModel: Model<any>,
    @InjectModel('RecoveryMilestone') private recoveryMilestoneModel: Model<any>,
    @InjectModel('RecoveryJournal') private recoveryJournalModel: Model<any>,
    @InjectModel('CrisisEvent') private crisisEventModel: Model<any>,
    @InjectModel('RecoveryPlan') private recoveryPlanModel: Model<any>,
    @InjectModel('CopingExerciseSession') private copingExerciseSessionModel: Model<any>,
    @InjectModel('RiskAssessmentReport') private riskAssessmentReportModel: Model<any>,
    private readonly claudeHealthSummaryService: ClaudeHealthSummaryService,
    private readonly claudeSummaryCreditsService: ClaudeSummaryCreditsService,
    private readonly claudeAIService: ClaudeAIService,
    private readonly textractService: TextractService,
    private readonly prescriptionNumberHelper: PrescriptionNumberHelper,
    private readonly riskScoringService: RiskScoringService,
    private eventEmitter: EventEmitter2,
  ) {
    this.initializeClient();
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY,
      secretAccessKey: process.env.AWS_ACCESS_SECRET_KEY,
      region: process.env.AWS_REGION || 'us-east-2',
    });
  }

  private s3: AWS.S3;

  private initializeClient() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey) {
      this.client = new Anthropic({ apiKey });
      this.logger.log('Eka AI service initialized');
    } else {
      this.logger.warn('ANTHROPIC_API_KEY not configured. Eka service disabled.');
    }
  }

  async *chat(dto: EkaChatDto, userId: string): AsyncGenerator<any> {
    if (!this.client) {
      yield { type: 'error', content: 'Eka is currently unavailable. Please try again later.' };
      return;
    }

    // Load or create conversation
    let conversation: EkaConversationDocument | null = null;
    if (dto.conversation_id) {
      conversation = await this.conversationModel.findOne({
        _id: dto.conversation_id,
        user: new Types.ObjectId(userId),
        is_active: true,
      });
      if (!conversation) {
        yield { type: 'error', content: 'Conversation not found.' };
        return;
      }
    } else {
      conversation = await this.conversationModel.create({
        user: new Types.ObjectId(userId),
        messages: [],
        title: dto.message.slice(0, 80),
        tags: dto.tags || [],
      });
    }

    // Add user message
    conversation.messages.push({
      role: 'user',
      content: dto.message,
      created_at: new Date(),
    });

    // Get patient name for system prompt
    const user = await this.userModel
      .findById(userId)
      .select('profile.first_name profile.last_name')
      .lean();
    const patientName = user?.profile
      ? `${user.profile.first_name || ''} ${user.profile.last_name || ''}`.trim()
      : 'there';

    // Check if patient is enrolled in recovery
    let recoveryContext: RecoveryContext | null = null;
    const recoveryProfile = await this.recoveryProfileModel.findOne({
      user: new Types.ObjectId(userId),
      status: 'active',
      deleted_at: { $exists: false },
    }).lean();

    if (recoveryProfile) {
      const uid = new Types.ObjectId(userId);
      const sobrietyDays = recoveryProfile.sobriety_start_date
        ? Math.max(0, Math.floor((Date.now() - new Date(recoveryProfile.sobriety_start_date).getTime()) / 86400000))
        : 0;
      const primarySubstance = (recoveryProfile as any).substance_use_history?.find((s: any) => s.is_primary)?.substance || 'substances';

      const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000);

      // Fetch all context data in parallel
      const [recentLogs, recentScreenings, recentExercises, milestones, activePlan] = await Promise.all([
        this.sobrietyLogModel
          .find({ user: uid, log_date: { $gte: fourteenDaysAgo } })
          .sort({ log_date: -1 })
          .limit(7)
          .lean(),
        this.addictionScreeningModel
          .find({ user: uid, deleted_at: { $exists: false } })
          .sort({ created_at: -1 })
          .limit(5)
          .select('instrument total_score risk_level created_at')
          .lean(),
        this.copingExerciseSessionModel
          .find({ user: uid, deleted_at: { $exists: false } })
          .sort({ created_at: -1 })
          .limit(5)
          .select('name category created_at')
          .lean(),
        this.recoveryMilestoneModel
          .find({ user: uid })
          .sort({ achieved_at: -1 })
          .limit(5)
          .select('milestone_name')
          .lean(),
        this.recoveryPlanModel.findOne({
          user: uid,
          status: 'active',
          deleted_at: { $exists: false },
        }).select('_id').lean(),
      ]);

      const moodAvg = recentLogs.length > 0
        ? Math.round(recentLogs.reduce((s: number, l: any) => s + (l.mood_score || 5), 0) / recentLogs.length * 10) / 10
        : 5;
      const cravingAvg = recentLogs.length > 0
        ? Math.round(recentLogs.reduce((s: number, l: any) => s + (l.craving_intensity || 0), 0) / recentLogs.length * 10) / 10
        : 0;

      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
      const todayLog = recentLogs.find((l: any) => new Date(l.log_date) >= todayStart);

      // Build check-in snapshots
      const formatDate = (d: any) => new Date(d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
      const checkinSnapshots = recentLogs.map((l: any) => ({
        date: formatDate(l.log_date),
        mood_score: l.mood_score || 5,
        craving_intensity: l.craving_intensity ?? 0,
        sober: l.sober_today !== false,
        triggers: l.triggers_encountered || [],
        coping_strategies: l.coping_strategies_used || [],
        sleep_quality: l.sleep_quality,
        sleep_hours: l.sleep_hours,
        gratitude_note: l.gratitude_note,
      }));

      // Screening snapshots
      const screeningMaxScores: Record<string, number> = { audit: 40, dast10: 10, cage: 4, assist: 39 };
      const screeningSnapshots = recentScreenings.map((s: any) => ({
        instrument: s.instrument,
        score: s.total_score,
        max_score: screeningMaxScores[s.instrument] || 40,
        risk_level: s.risk_level,
        date: formatDate(s.created_at),
      }));

      // Exercise snapshots
      const exerciseSnapshots = recentExercises.map((e: any) => ({
        name: e.name,
        category: e.category,
        date: formatDate(e.created_at),
      }));

      // Calculate trends (compare first half vs second half of check-ins)
      const calculateTrend = (values: number[]): 'improving' | 'declining' | 'stable' | 'insufficient_data' => {
        if (values.length < 3) return 'insufficient_data';
        const mid = Math.floor(values.length / 2);
        const recentHalf = values.slice(0, mid);
        const olderHalf = values.slice(mid);
        const recentAvg = recentHalf.reduce((a, b) => a + b, 0) / recentHalf.length;
        const olderAvg = olderHalf.reduce((a, b) => a + b, 0) / olderHalf.length;
        const diff = recentAvg - olderAvg;
        if (Math.abs(diff) < 0.5) return 'stable';
        return diff > 0 ? 'improving' : 'declining';
      };

      const moodValues = recentLogs.map((l: any) => l.mood_score || 5);
      const cravingValues = recentLogs.map((l: any) => l.craving_intensity ?? 0);

      // For cravings, lower is better — so invert the trend label
      const rawCravingTrend = calculateTrend(cravingValues);
      const cravingTrend = rawCravingTrend === 'improving' ? 'worsening'
        : rawCravingTrend === 'declining' ? 'improving'
        : rawCravingTrend;

      // Top triggers and coping strategies (frequency count)
      const triggerCounts: Record<string, number> = {};
      const copingCounts: Record<string, number> = {};
      for (const l of recentLogs as any[]) {
        for (const t of l.triggers_encountered || []) { triggerCounts[t] = (triggerCounts[t] || 0) + 1; }
        for (const c of l.coping_strategies_used || []) { copingCounts[c] = (copingCounts[c] || 0) + 1; }
      }
      const topTriggers = Object.entries(triggerCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k);
      const topCoping = Object.entries(copingCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k);

      // Log streak: consecutive days with a log from today backwards
      let logStreak = 0;
      const sortedByDateAsc = [...recentLogs].sort((a: any, b: any) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime());
      const checkDate = new Date(); checkDate.setHours(0, 0, 0, 0);
      for (const l of sortedByDateAsc as any[]) {
        const logDay = new Date(l.log_date); logDay.setHours(0, 0, 0, 0);
        if (logDay.getTime() === checkDate.getTime()) {
          logStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else if (logDay.getTime() < checkDate.getTime()) {
          break;
        }
      }

      recoveryContext = {
        sobriety_days: sobrietyDays,
        primary_substance: primarySubstance,
        risk_level: (recoveryProfile as any).current_risk_level || 'low',
        care_level: (recoveryProfile as any).care_level || 'outpatient',
        recent_mood_avg: moodAvg,
        recent_craving_avg: cravingAvg,
        has_plan: !!activePlan,
        last_checkin_date: recentLogs[0]?.log_date ? new Date((recentLogs[0] as any).log_date).toISOString() : null,
        today_checked_in: !!todayLog,
        recent_checkins: checkinSnapshots,
        recent_screenings: screeningSnapshots,
        recent_exercises: exerciseSnapshots,
        milestones_earned: milestones.map((m: any) => m.milestone_name),
        log_streak: logStreak,
        mood_trend: calculateTrend(moodValues),
        craving_trend: cravingTrend as any,
        top_triggers: topTriggers,
        top_coping_strategies: topCoping,
        risk_score: (recoveryProfile as any).current_risk_score ?? undefined,
        risk_updated_at: (recoveryProfile as any).risk_updated_at
          ? new Date((recoveryProfile as any).risk_updated_at).toISOString()
          : null,
      };
    }

    // Build messages for Claude (last N messages)
    const recentMessages = conversation.messages.slice(-MAX_CONTEXT_MESSAGES);
    const claudeMessages: Anthropic.MessageParam[] = recentMessages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));
    this.logger.log(`[Chat] conversation=${conversation._id}, messages_in_context=${recentMessages.length}, last_user_msg="${dto.message}"`);

    // Check if there's an active health checkup — forces the correct tool at each phase
    // Only consider checkups from the last 2 hours to avoid stale sessions
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const lastUserMessage = (dto.message || '').toLowerCase();
    const isStartingNewCheckup = /\b(start|begin|new|do|want)\b.*\b(checkup|check[\s-]?up|health check)\b/.test(lastUserMessage)
      || /\bhealth checkup\b/.test(lastUserMessage);

    // If user wants a NEW checkup, clear any stale phases first so start_health_checkup can run
    if (isStartingNewCheckup) {
      await this.healthCheckupModel.updateMany(
        { user: new Types.ObjectId(userId), 'request.checkup_phase': { $in: ['awaiting_symptoms', 'awaiting_confirmation', 'interview'] } },
        { $set: { 'request.checkup_phase': null } },
      );
    }

    const activeCheckup = isStartingNewCheckup ? null : await this.healthCheckupModel.findOne({
      user: new Types.ObjectId(userId),
      deleted_at: null,
      'request.checkup_phase': { $in: ['awaiting_symptoms', 'awaiting_confirmation', 'interview'] },
      created_at: { $gte: twoHoursAgo },
    });
    const activeCheckupPhase: string | null = activeCheckup?.request?.checkup_phase || null;

    // Stream with tool loop
    let fullResponse = '';
    const toolsUsed: string[] = [];

    // Retry up to 2 times on overloaded/transient errors
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        fullResponse = yield* this.streamWithTools(claudeMessages, patientName, userId, toolsUsed, dto.language, activeCheckupPhase, recoveryContext, conversation._id);
        break; // Success
      } catch (error: any) {
        const isOverloaded = error?.message?.includes('overloaded') || error?.message?.includes('Overloaded') || error?.error?.type === 'overloaded_error';
        if (isOverloaded && attempt < 2) {
          this.logger.warn(`Eka AI overloaded (attempt ${attempt + 1}/3), retrying in ${(attempt + 1) * 2}s...`);
          await new Promise((r) => setTimeout(r, (attempt + 1) * 2000));
          continue;
        }
        this.logger.error('Eka chat error:', error);
        yield { type: 'error', content: "I'm sorry, I ran into an issue. Please try again in a moment." };
        return;
      }
    }

    // Save assistant message
    conversation.messages.push({
      role: 'assistant',
      content: fullResponse,
      tools_used: toolsUsed.length > 0 ? toolsUsed : undefined,
      created_at: new Date(),
    });
    await conversation.save();

    yield { type: 'done', conversation_id: conversation._id.toString() };
  }

  private async *streamWithTools(
    messages: Anthropic.MessageParam[],
    patientName: string,
    userId: string,
    toolsUsed: string[],
    language?: string,
    activeCheckupPhase?: string | null,
    recoveryContext?: RecoveryContext | null,
    conversationId?: Types.ObjectId,
  ): AsyncGenerator<any, string> {
    let currentMessages = [...messages];
    let fullResponse = '';
    let textOnlyNextRound = false; // After checkup tools return, present results as text
    let forceToolNextRound: string | null = null; // Auto-chain tool calls (e.g. report after completion)

    // Tool loop — Claude may call tools, we execute them and continue
    for (let round = 0; round < 5; round++) {
      const apiParams: any = {
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: buildSystemPrompt(patientName, language, recoveryContext),
        messages: currentMessages,
      };

      // After checkup tools return, do NOT give Claude tools —
      // just let it present the results as plain text. This prevents it from going off-script.
      if (textOnlyNextRound) {
        // No tools — Claude can only generate text to present checkup results/questions
        this.logger.log('Checkup tool returned — text-only round');
      } else {
        apiParams.tools = EKA_TOOLS;

        // Auto-chain: force a specific tool from a previous round's result
        if (forceToolNextRound) {
          apiParams.tool_choice = { type: 'tool', name: forceToolNextRound };
          this.logger.log(`Forcing tool_choice: ${forceToolNextRound} (auto-chain)`);
          forceToolNextRound = null;
        }
        // Force the appropriate checkup tool based on the active phase (round 0 only)
        else if (activeCheckupPhase && round === 0) {
          if (activeCheckupPhase === 'awaiting_symptoms') {
            apiParams.tool_choice = { type: 'tool', name: 'submit_checkup_symptoms' };
            this.logger.log('Forcing tool_choice: submit_checkup_symptoms (awaiting symptoms phase)');
          } else if (activeCheckupPhase === 'awaiting_confirmation' || activeCheckupPhase === 'interview') {
            apiParams.tool_choice = { type: 'tool', name: 'run_checkup_interview' };
            this.logger.log(`Forcing tool_choice: run_checkup_interview (phase: ${activeCheckupPhase})`);
          }
        }
      }

      const stream = this.client!.messages.stream(apiParams);

      let toolCalls: { id: string; name: string; input: any }[] = [];
      let currentToolId = '';
      let currentToolName = '';
      let currentToolInput = '';
      let stopReason = '';

      for await (const event of stream) {
        if (event.type === 'content_block_start') {
          if (event.content_block.type === 'text') {
            // Text block starting
          } else if (event.content_block.type === 'tool_use') {
            currentToolId = event.content_block.id;
            currentToolName = event.content_block.name;
            currentToolInput = '';
            yield { type: 'tool_start', tool: currentToolName };
          }
        } else if (event.type === 'content_block_delta') {
          if (event.delta.type === 'text_delta') {
            fullResponse += event.delta.text;
            yield { type: 'text', content: event.delta.text };
          } else if (event.delta.type === 'input_json_delta') {
            currentToolInput += event.delta.partial_json;
          }
        } else if (event.type === 'content_block_stop') {
          if (currentToolId) {
            let parsedInput = {};
            try {
              parsedInput = currentToolInput ? JSON.parse(currentToolInput) : {};
            } catch {}
            toolCalls.push({ id: currentToolId, name: currentToolName, input: parsedInput });
            currentToolId = '';
            currentToolName = '';
            currentToolInput = '';
          }
        } else if (event.type === 'message_delta') {
          stopReason = (event as any).delta?.stop_reason || '';
        }
      }

      // If no tool calls, we're done
      if (toolCalls.length === 0 || stopReason !== 'tool_use') {
        return fullResponse;
      }

      // Execute all tool calls
      for (const tc of toolCalls) {
        toolsUsed.push(tc.name);
      }

      // Slow tools: show fun loading text while executing
      const SLOW_TOOLS = ['check_drug_interactions', 'generate_checkup_report', 'analyze_prescription_upload', 'analyze_existing_prescription', 'submit_screening'];
      const slowToolName = toolCalls.find(tc => SLOW_TOOLS.includes(tc.name))?.name;

      let toolResults: { id: string; name: string; result: any }[];

      if (slowToolName) {
        // Clear stale artifact before starting a new slow tool (like health checkup clears stale phases)
        yield { type: 'clear_artifact' };

        let toolsDone = false;
        const toolPromise = Promise.all(
          toolCalls.map(async (tc) => {
            const result = await this.executeTool(tc.name, tc.input, userId, conversationId);
            return { id: tc.id, name: tc.name, result };
          }),
        );
        toolPromise.then(() => { toolsDone = true; }).catch(() => { toolsDone = true; });

        // Type out fun messages while the tool runs
        const loadingMessages = this.getLoadingMessages(slowToolName);
        for (const msg of loadingMessages) {
          if (toolsDone) break;
          for (const char of msg) {
            if (toolsDone) break;
            yield { type: 'text', content: char };
            await new Promise(r => setTimeout(r, 30));
          }
          if (!toolsDone) {
            yield { type: 'text', content: '\n\n' };
            await new Promise(r => setTimeout(r, 800));
          }
        }

        // Final fallback if tool is still running
        if (!toolsDone) {
          const waitMsg = 'Just a moment more...';
          for (const char of waitMsg) {
            if (toolsDone) break;
            yield { type: 'text', content: char };
            await new Promise(r => setTimeout(r, 35));
          }
        }

        toolResults = await toolPromise;
        // Signal frontend to clear loading text before real content
        yield { type: 'clear_loading' };
      } else {
        toolResults = await Promise.all(
          toolCalls.map(async (tc) => {
            const result = await this.executeTool(tc.name, tc.input, userId, conversationId);
            return { id: tc.id, name: tc.name, result };
          }),
        );
      }

      // Emit tool_done events + artifact events + checkup question events
      for (const tr of toolResults) {
        yield { type: 'tool_done', tool: tr.name };
        if (tr.result?.__artifact) {
          yield { type: 'artifact', artifact_type: tr.result.__artifact.type, data: tr.result.__artifact.data };
        }
        // Emit interactive question data for frontend answer buttons
        if (tr.name === 'run_checkup_interview' && tr.result?.status === 'in_progress' && tr.result?.question) {
          yield { type: 'checkup_question', question: tr.result.question };
        }
        // Emit suggestions as interactive toggleable buttons (group_multiple style)
        if (tr.name === 'submit_checkup_symptoms' && tr.result?.suggestions?.length > 0) {
          yield {
            type: 'checkup_question',
            question: {
              text: 'Do any of these also apply to you?',
              type: 'group_multiple',
              items: tr.result.suggestions,
            },
          };
        }
      }

      // Emit contextual follow-up suggestions based on tool results
      // Skip during active health checkup interview — Infermedica drives the Q&A flow
      const isCheckupInProgress = toolResults.some(
        (tr) =>
          tr.name === 'start_health_checkup' ||
          tr.name === 'submit_checkup_symptoms' ||
          (tr.name === 'run_checkup_interview' && tr.result?.status === 'in_progress'),
      );
      if (!isCheckupInProgress) {
        const allSuggestions: Array<{ label: string; message: string }> = [];
        for (const tr of toolResults) {
          const toolInput = toolCalls.find((tc) => tc.id === tr.id)?.input;
          const sug = this.buildContextualSuggestions(tr.name, toolInput, tr.result);
          allSuggestions.push(...sug);
        }
        if (allSuggestions.length > 0) {
          const unique = allSuggestions
            .filter((s, i, arr) => arr.findIndex((x) => x.message === s.message) === i)
            .slice(0, 4);
          yield { type: 'suggestions', suggestions: unique };
        }
      }

      // After certain tools return, go text-only so Haiku presents results conversationally
      for (const tr of toolResults) {
        if (tr.name === 'submit_checkup_symptoms') {
          textOnlyNextRound = true; // Present parsed symptoms + suggestions as text
        }
        if (tr.name === 'run_checkup_interview' && tr.result?.status === 'in_progress') {
          textOnlyNextRound = true; // Present interview question as text
        }
        // Interview complete → auto-chain generate_checkup_report
        if (tr.name === 'run_checkup_interview' && tr.result?.status === 'completed') {
          textOnlyNextRound = false;
          forceToolNextRound = 'generate_checkup_report';
          this.logger.log('Interview completed — will auto-chain generate_checkup_report');
        }
        // Report generated → text-only to present summary
        if (tr.name === 'generate_checkup_report' && !tr.result?.error) {
          textOnlyNextRound = true;
        }
        // Prescription analysis → text-only to present summary + action links
        if (tr.name === 'analyze_prescription_upload' || tr.name === 'analyze_existing_prescription') {
          textOnlyNextRound = true;
        }
        // Recovery write tools → text-only to present conversational summary
        if (['log_daily_checkin', 'start_screening', 'submit_screening', 'run_coping_exercise'].includes(tr.name)) {
          textOnlyNextRound = true;
        }
      }

      // Build tool result messages for next round (strip __artifact before sending to Claude)
      const assistantContent: any[] = [];
      // Reconstruct assistant message with tool_use blocks
      if (fullResponse) {
        assistantContent.push({ type: 'text', text: fullResponse });
      }
      for (const tc of toolCalls) {
        assistantContent.push({ type: 'tool_use', id: tc.id, name: tc.name, input: tc.input });
      }

      const toolResultContent: any[] = toolResults.map((tr) => {
        // Clone result — handle both arrays and objects safely
        let resultForClaude = Array.isArray(tr.result)
          ? [...tr.result]
          : { ...tr.result };
        if (!Array.isArray(resultForClaude)) {
          delete resultForClaude.__artifact;
        }
        resultForClaude = this.cleanToolResult(resultForClaude);

        // Wrap with explicit label so Haiku cannot confuse results with conversation history
        const toolInput = toolCalls.find((tc) => tc.id === tr.id)?.input;
        const label = this.getToolResultLabel(tr.name, toolInput);
        const content = `[TOOL RESULT: ${label}]\n${JSON.stringify(resultForClaude)}`;

        this.logger.log(`[Tool Result → Claude] tool=${tr.name}, label="${label}", content_length=${content.length}`);

        return {
          type: 'tool_result',
          tool_use_id: tr.id,
          content,
        };
      });

      currentMessages = [
        ...currentMessages,
        { role: 'assistant', content: assistantContent },
        { role: 'user', content: toolResultContent },
      ];

      // Reset for next round
      toolCalls = [];
      fullResponse = '';
    }

    return fullResponse;
  }

  private getLoadingMessages(toolName: string): string[] {
    const messages: Record<string, string[]> = {
      check_drug_interactions: [
        'Hold on while I check those medications for you...',
        'Diving into the clinical databases — let me cross-reference everything...',
        'Almost there! By the time you take your next sip, your results will be ready...',
        'Just putting the final pieces together...',
      ],
      generate_checkup_report: [
        'Let me put your health report together...',
        'Crunching your health data — this is the important stuff...',
        'Almost done! Your personalized report is coming together nicely...',
        'Good things take a little time — nearly there...',
      ],
      analyze_prescription_upload: [
        'Reading your prescription...',
        'Extracting medications and checking our pharmacy inventory...',
        'Matching prices and checking availability across all currencies...',
        'Running prescription readiness checks...',
      ],
      analyze_existing_prescription: [
        'Pulling up your prescription details...',
        'Checking medication availability and pricing...',
        'Almost there — putting the analysis together...',
      ],
      submit_screening: [
        'Scoring your responses...',
        'Analysing risk levels and comparing with clinical thresholds...',
        'Generating your personalised interpretation...',
      ],
    };
    return messages[toolName] || ['Working on that for you...'];
  }

  /** Build contextual follow-up suggestions based on tool results */
  private buildContextualSuggestions(
    toolName: string,
    toolInput: any,
    result: any,
  ): Array<{ label: string; message: string }> {
    const suggestions: Array<{ label: string; message: string }> = [];
    if (!result || result.error) return suggestions;

    switch (toolName) {
      case 'analyze_prescription_upload':
      case 'analyze_existing_prescription': {
        const meds = (result.medications || []).filter((m: any) => m.in_inventory);
        if (meds.length >= 2) {
          const names = meds.slice(0, 4).map((m: any) => m.matched_drug_name || m.name);
          suggestions.push({
            label: `Check interactions between these medications`,
            message: `Check drug interactions between ${names.join(', ')}`,
          });
        }
        suggestions.push({
          label: 'Upload for ordering',
          message: 'I want to order these medications through the pharmacy',
        });
        suggestions.push({
          label: 'View my prescriptions',
          message: 'Show my prescriptions',
        });
        break;
      }

      case 'get_vitals': {
        if (!result.message?.includes('No vital')) {
          suggestions.push(
            { label: 'What do my vitals mean?', message: 'Explain what my vitals mean and if anything needs attention' },
            { label: 'Start a health checkup', message: 'Start a health checkup' },
            { label: 'Show my health score', message: 'Show my health score' },
          );
        }
        break;
      }

      case 'get_health_checkups': {
        suggestions.push(
          { label: 'Start a new checkup', message: 'Start a health checkup' },
          { label: 'Book an appointment', message: 'Book an appointment' },
        );
        break;
      }

      case 'get_prescriptions': {
        const rxList = Array.isArray(result) ? result : result.prescriptions;
        if (rxList?.length > 0) {
          suggestions.push(
            { label: 'Analyze my latest prescription', message: 'Analyze my most recent prescription' },
            { label: 'Check drug interactions', message: 'Check my drug interactions' },
          );
        }
        suggestions.push({ label: 'Browse pharmacy', message: 'Search the pharmacy' });
        break;
      }

      case 'search_pharmacy': {
        const drugs = Array.isArray(result) ? result : result.results;
        if (drugs?.length > 0) {
          suggestions.push(
            { label: 'Check interactions with my meds', message: 'Check if this drug interacts with my current medications' },
            { label: 'View my prescriptions', message: 'Show my prescriptions' },
          );
        }
        break;
      }

      case 'get_appointments': {
        suggestions.push(
          { label: 'Book a new appointment', message: 'Book an appointment' },
          { label: 'View my prescriptions', message: 'Show my prescriptions' },
        );
        break;
      }

      case 'get_orders': {
        suggestions.push(
          { label: 'Browse pharmacy', message: 'Search the pharmacy' },
          { label: 'View my prescriptions', message: 'Show my prescriptions' },
        );
        break;
      }

      case 'get_health_score': {
        suggestions.push(
          { label: 'How can I improve my score?', message: 'How can I improve my health score?' },
          { label: 'Start a health checkup', message: 'Start a health checkup' },
          { label: 'Check my vitals', message: 'Show my recent vitals' },
        );
        break;
      }

      case 'check_drug_interactions': {
        suggestions.push(
          { label: 'Search pharmacy for alternatives', message: 'Search the pharmacy for alternative medications' },
          { label: 'View my prescriptions', message: 'Show my prescriptions' },
          { label: 'Book an appointment', message: 'Book an appointment to discuss this' },
        );
        break;
      }

      case 'generate_checkup_report': {
        suggestions.push(
          { label: 'Book an appointment', message: 'Book an appointment with a specialist' },
          { label: 'Check drug interactions', message: 'Check my drug interactions' },
          { label: 'Browse pharmacy', message: 'Search the pharmacy' },
        );
        break;
      }

      case 'get_wallet': {
        suggestions.push(
          { label: 'Browse pharmacy', message: 'Search the pharmacy' },
          { label: 'View my subscription', message: 'Show my subscription details' },
        );
        break;
      }

      case 'get_profile': {
        suggestions.push(
          { label: 'Start a health checkup', message: 'Start a health checkup' },
          { label: 'Show my health score', message: 'Show my health score' },
        );
        break;
      }

      // ── Recovery tools ──
      case 'get_recovery_profile':
      case 'get_recovery_dashboard': {
        suggestions.push(
          { label: 'Daily check-in', message: 'I want to do my daily check-in' },
          { label: 'View sobriety stats', message: 'Show my sobriety statistics' },
          { label: 'Take a screening', message: 'I want to take a screening assessment' },
        );
        break;
      }

      case 'get_sobriety_stats': {
        suggestions.push(
          { label: 'Recovery dashboard', message: 'Show my recovery dashboard' },
          { label: 'Daily check-in', message: 'I want to do my daily check-in' },
          { label: 'Coping exercise', message: 'I need a coping exercise' },
        );
        break;
      }

      case 'get_daily_logs': {
        suggestions.push(
          { label: 'What do my trends show?', message: 'Analyse my mood and craving trends' },
          { label: 'Daily check-in', message: 'I want to do my daily check-in' },
        );
        break;
      }

      case 'get_screening_history': {
        suggestions.push(
          { label: 'Take a new screening', message: 'I want to take a screening assessment' },
          { label: 'Recovery dashboard', message: 'Show my recovery dashboard' },
        );
        break;
      }

      case 'log_daily_checkin': {
        suggestions.push(
          { label: 'Recovery dashboard', message: 'Show my recovery dashboard' },
          { label: 'Coping exercise', message: 'I need a coping exercise for cravings' },
          { label: 'View my plan', message: 'Show my recovery plan' },
        );
        break;
      }

      case 'submit_screening': {
        suggestions.push(
          { label: 'What does this mean?', message: 'Explain my screening results in detail' },
          { label: 'Recovery dashboard', message: 'Show my recovery dashboard' },
          { label: 'Book an appointment', message: 'Book an appointment to discuss my results' },
        );
        break;
      }

      case 'run_coping_exercise': {
        suggestions.push(
          { label: 'Try another exercise', message: 'Show me another coping exercise' },
          { label: 'Daily check-in', message: 'I want to do my daily check-in' },
          { label: 'Recovery dashboard', message: 'Show my recovery dashboard' },
        );
        break;
      }

      case 'complete_exercise': {
        suggestions.push(
          { label: 'Try another exercise', message: 'I want to try another coping exercise' },
          { label: 'Daily check-in', message: 'I want to do my daily check-in' },
          { label: 'How am I doing?', message: 'Show my recovery dashboard' },
        );
        break;
      }
    }

    return suggestions;
  }

  /** Label each tool result so Haiku cannot confuse it with conversation history */
  private getToolResultLabel(toolName: string, input?: any): string {
    switch (toolName) {
      case 'search_pharmacy':
        return `Pharmacy search results for "${input?.query || 'unknown'}"`;
      case 'get_vitals':
        return 'Patient vital signs';
      case 'get_health_checkups':
        return 'Patient health checkup history';
      case 'get_prescriptions':
        return 'Patient prescriptions';
      case 'get_appointments':
        return 'Patient appointments';
      case 'get_orders':
        return 'Patient pharmacy orders';
      case 'get_wallet':
        return 'Patient wallet and AI credits';
      case 'get_profile':
        return 'Patient profile';
      case 'get_health_score':
        return 'Patient health score';
      case 'get_subscription':
        return 'Patient subscription details';
      case 'check_drug_interactions':
        return `Drug interaction check for: ${(input?.drugs || []).map((d: any) => d.name).join(', ')}`;
      case 'start_health_checkup':
        return 'New health checkup session created';
      case 'submit_checkup_symptoms':
        return 'Parsed symptoms from patient description';
      case 'run_checkup_interview':
        return 'Health checkup interview step';
      case 'generate_checkup_report':
        return 'Generated health checkup report';
      case 'analyze_prescription_upload':
        return 'Prescription image analysis';
      case 'analyze_existing_prescription':
        return `Existing prescription analysis (${input?.source || 'unknown'})`;
      // Recovery tools
      case 'get_recovery_profile':
        return 'Patient recovery profile';
      case 'get_recovery_dashboard':
        return 'Recovery dashboard data';
      case 'get_sobriety_stats':
        return 'Sobriety statistics';
      case 'get_daily_logs':
        return `Daily recovery logs (last ${input?.days || 14} days)`;
      case 'get_screening_history':
        return `Screening history${input?.instrument ? ' (' + input.instrument + ')' : ''}`;
      case 'get_recovery_plan':
        return 'Active recovery plan';
      case 'log_daily_checkin':
        return 'Daily check-in logged';
      case 'start_screening':
        return `Screening instrument: ${input?.instrument || 'unknown'}`;
      case 'submit_screening':
        return `Screening results: ${input?.instrument || 'unknown'}`;
      case 'run_coping_exercise':
        return `Coping exercise: ${input?.exercise_type || 'unknown'}`;
      case 'mark_exercise_step':
        return `Exercise step ${input?.step_number || '?'} marked complete`;
      case 'complete_exercise':
        return `Exercise completed: ${input?.exercise_type || 'unknown'}`;
      case 'get_risk_assessment':
        return 'Relapse risk assessment';
      case 'refine_risk_assessment':
        return 'Refining risk assessment';
      default:
        return toolName;
    }
  }

  /** Strip null, undefined, and empty-string values to reduce noise sent to Haiku */
  private cleanToolResult(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map((item) => this.cleanToolResult(item));
    }
    if (obj && typeof obj === 'object') {
      const cleaned: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value === null || value === undefined || value === '') continue;
        cleaned[key] = this.cleanToolResult(value);
      }
      return cleaned;
    }
    return obj;
  }

  private async executeTool(name: string, input: any, userId: string, conversationId?: Types.ObjectId): Promise<any> {
    const uid = new Types.ObjectId(userId);

    switch (name) {
      case 'get_vitals':
        return this.toolGetVitals(uid, input.limit || 5);
      case 'get_health_checkups':
        return this.toolGetCheckups(uid, input.limit || 5);
      case 'get_prescriptions':
        return this.toolGetPrescriptions(uid, input.limit || 10);
      case 'get_appointments':
        return this.toolGetAppointments(uid, input.limit || 5);
      case 'search_pharmacy':
        return this.toolSearchPharmacy(input.query, input.limit || 10);
      case 'get_orders':
        return this.toolGetOrders(uid, input.limit || 5);
      case 'get_wallet':
        return this.toolGetWallet(uid);
      case 'get_profile':
        return this.toolGetProfile(uid);
      case 'get_health_score':
        return this.toolGetHealthScore(uid);
      case 'get_subscription':
        return this.toolGetSubscription(uid);
      case 'start_health_checkup':
        return this.toolStartHealthCheckup(uid);
      case 'submit_checkup_symptoms':
        return this.toolSubmitCheckupSymptoms(uid, input.session_id, input.symptoms_text);
      case 'run_checkup_interview':
        return this.toolRunCheckupInterview(uid, input.session_id, input);
      case 'generate_checkup_report':
        return this.toolGenerateCheckupReport(uid, input.session_id);
      case 'check_drug_interactions':
        return this.toolCheckDrugInteractions(uid, input.drugs);
      case 'analyze_prescription_upload':
        return this.toolAnalyzePrescriptionUpload(uid, input.upload_id);
      case 'analyze_existing_prescription':
        return this.toolAnalyzeExistingPrescription(uid, input.prescription_id, input.source);
      // ── Recovery tools ──
      case 'get_recovery_profile':
        return this.toolGetRecoveryProfile(uid);
      case 'get_recovery_dashboard':
        return this.toolGetRecoveryDashboard(uid);
      case 'get_sobriety_stats':
        return this.toolGetSobrietyStats(uid);
      case 'get_daily_logs':
        return this.toolGetDailyLogs(uid, input.days || 14);
      case 'get_screening_history':
        return this.toolGetScreeningHistory(uid, input.instrument, input.limit || 5);
      case 'get_recovery_plan':
        return this.toolGetRecoveryPlan(uid);
      case 'log_daily_checkin':
        return this.toolLogDailyCheckin(uid, input);
      case 'start_screening':
        return this.toolStartScreening(input.instrument);
      case 'submit_screening':
        return this.toolSubmitScreening(uid, input.instrument, input.answers, input.duration_ms);
      case 'run_coping_exercise':
        return this.toolRunCopingExercise(input.exercise_type, uid);
      case 'mark_exercise_step':
        return this.toolMarkExerciseStep(input.step_number, uid);
      case 'complete_exercise':
        return this.toolCompleteExercise(input.exercise_type, input.outcome, uid);
      case 'get_risk_assessment':
        return this.toolGetRiskAssessment(uid, input.recalculate, conversationId);
      case 'refine_risk_assessment':
        return this.toolRefineRiskAssessment(uid, input, conversationId);
      default:
        return { error: `Unknown tool: ${name}` };
    }
  }

  // ============ TOOL HANDLERS ============
  // Each returns lean JSON with only essential fields

  private static readonly VITAL_SKIP_FIELDS = new Set(['_id', 'userId', 'created_at', 'updated_at', 'createdAt', 'updatedAt', '__v']);
  private static readonly CUMULATIVE_VITALS = new Set(['steps', 'calories_burned', 'distance']);
  private static readonly DURATION_VITALS = new Set(['sleep']);

  private async toolGetVitals(userId: Types.ObjectId, limit: number) {
    const vitals = await this.vitalModel
      .find({ userId })
      .lean();

    if (!vitals.length) return { message: 'No vital signs recorded yet.' };

    const now = new Date();

    // Collect all readings per vital type from all vital documents
    const allReadings: Record<string, any[]> = {};
    for (const v of vitals as any[]) {
      for (const [key, arr] of Object.entries(v)) {
        if (EkaService.VITAL_SKIP_FIELDS.has(key)) continue;
        if (!Array.isArray(arr) || !arr.length) continue;
        const readings = arr.filter((r: any) => r.value);
        if (!readings.length) continue;
        allReadings[key] = [...(allReadings[key] || []), ...readings];
      }
    }

    if (!Object.keys(allReadings).length) {
      return { message: 'Vital sign records exist but no readings have been logged yet.' };
    }

    const result: Record<string, any> = {};
    for (const [key, readings] of Object.entries(allReadings)) {
      readings.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

      if (EkaService.CUMULATIVE_VITALS.has(key)) {
        result[key] = this.buildCumulativeSummary(readings, now);
      } else if (EkaService.DURATION_VITALS.has(key)) {
        result[key] = this.buildDurationSummary(readings, now);
      } else {
        result[key] = this.buildSnapshotSummary(readings, now, limit);
      }
    }

    return result;
  }

  private vitalTimeAgo(date: Date, now: Date): string {
    const diffMs = now.getTime() - date.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''} ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }

  private dayKey(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /** Steps, calories_burned, distance — sum per day, compare today/yesterday, 7-day avg */
  private buildCumulativeSummary(readings: any[], now: Date) {
    const unit = readings[0]?.unit || '';
    const byDay: Record<string, number> = {};
    for (const r of readings) {
      const day = this.dayKey(new Date(r.updatedAt));
      byDay[day] = (byDay[day] || 0) + parseFloat(r.value);
    }

    const today = this.dayKey(now);
    const yesterday = this.dayKey(new Date(now.getTime() - 86400000));
    const sortedDays = Object.keys(byDay).sort().reverse();
    const last7 = sortedDays.slice(0, 7);

    const todayTotal = Math.round((byDay[today] || 0) * 100) / 100;
    const yesterdayTotal = byDay[yesterday] !== undefined ? Math.round(byDay[yesterday] * 100) / 100 : null;
    const avg7d = last7.length > 0
      ? Math.round(last7.reduce((s, d) => s + byDay[d], 0) / last7.length * 100) / 100
      : null;

    return {
      type: 'cumulative_daily',
      unit,
      today_total: todayTotal,
      yesterday_total: yesterdayTotal,
      daily_average_7d: avg7d,
      last_recorded: readings[0].updatedAt,
      last_recorded_time_ago: this.vitalTimeAgo(new Date(readings[0].updatedAt), now),
      daily_breakdown: last7.map(d => ({ date: d, total: Math.round(byDay[d] * 100) / 100 })),
    };
  }

  /** Sleep — max per night, recent nights, average */
  private buildDurationSummary(readings: any[], now: Date) {
    const unit = readings[0]?.unit || '';
    const byDay: Record<string, number> = {};
    for (const r of readings) {
      const day = this.dayKey(new Date(r.updatedAt));
      const val = parseFloat(r.value);
      byDay[day] = Math.max(byDay[day] || 0, val);
    }

    const sortedDays = Object.keys(byDay).sort().reverse();
    const last7 = sortedDays.slice(0, 7);
    const recentNights = last7.map(d => ({ date: d, value: Math.round(byDay[d] * 100) / 100, unit }));
    const avg = last7.length > 0
      ? Math.round(last7.reduce((s, d) => s + byDay[d], 0) / last7.length * 100) / 100
      : null;

    return {
      type: 'duration_daily',
      unit,
      most_recent_night: recentNights[0] || null,
      average_last_7_nights: avg,
      last_recorded: readings[0].updatedAt,
      last_recorded_time_ago: this.vitalTimeAgo(new Date(readings[0].updatedAt), now),
      recent_nights: recentNights,
    };
  }

  /** BP, pulse, temp, weight, spo2, etc. — latest + time ago, average, min/max, trend */
  private buildSnapshotSummary(readings: any[], now: Date, limit: number) {
    const unit = readings[0]?.unit || '';
    const latest = readings[0];
    const recent = readings.slice(0, limit);

    // Compute stats for numeric vitals (skip compound values like BP "120/80")
    const isNumeric = !String(latest.value).includes('/');
    let stats: { average: number; min: number; max: number } | null = null;
    if (isNumeric) {
      const vals = recent.map(r => parseFloat(r.value)).filter(v => !isNaN(v));
      if (vals.length > 1) {
        stats = {
          average: Math.round(vals.reduce((s, v) => s + v, 0) / vals.length * 100) / 100,
          min: Math.round(Math.min(...vals) * 100) / 100,
          max: Math.round(Math.max(...vals) * 100) / 100,
        };
      }
    }

    return {
      type: 'snapshot',
      unit,
      latest_value: latest.value,
      latest_recorded: latest.updatedAt,
      latest_time_ago: this.vitalTimeAgo(new Date(latest.updatedAt), now),
      ...(stats ? { recent_average: stats.average, recent_min: stats.min, recent_max: stats.max } : {}),
      recent_readings: recent.map(r => ({ value: r.value, recorded_at: r.updatedAt })),
      total_readings: readings.length,
    };
  }

  private async toolGetCheckups(userId: Types.ObjectId, limit: number) {
    const checkups = await this.healthCheckupModel
      .find({ user: userId, deleted_at: null })
      .sort({ created_at: -1 })
      .limit(limit)
      .select('response.data claude_summary health_check_for created_at')
      .lean();

    if (!checkups.length) return { message: 'No health checkups found.' };

    return checkups.map((c: any) => {
      const data = c.response?.data || {};
      const summary = c.claude_summary?.content;
      return {
        date: c.created_at,
        for: c.health_check_for,
        triage_level: data.triage_level,
        has_emergency: data.has_emergency_evidence,
        conditions: (data.conditions || []).slice(0, 5).map((cond: any) => ({
          name: cond.common_name || cond.name,
          probability: cond.probability,
        })),
        ai_summary: summary?.overview,
        recommendations: summary?.recommendations,
        when_to_seek_care: summary?.when_to_seek_care,
      };
    });
  }

  private async toolGetPrescriptions(userId: Types.ObjectId, limit: number) {
    const results: any[] = [];

    // 1. Specialist prescriptions (prescribed on-platform)
    const specialistRx = await this.specialistPrescriptionModel
      .find({ patient_id: userId })
      .sort({ created_at: -1 })
      .limit(limit)
      .populate('specialist_id', 'profile.first_name profile.last_name')
      .select('prescription_number items status payment_status total_amount currency specialist_id created_at')
      .lean();

    for (const p of specialistRx) {
      results.push({
        source: 'specialist',
        prescription_number: p.prescription_number,
        date: p.created_at,
        status: p.status,
        payment_status: p.payment_status,
        total_amount: p.total_amount ? `${p.currency} ${p.total_amount.toLocaleString()}` : null,
        prescribed_by: p.specialist_id?.profile
          ? `Dr. ${p.specialist_id.profile.first_name} ${p.specialist_id.profile.last_name}`
          : 'Unknown',
        medications: (p.items || []).map((item: any) => ({
          drug: item.drug_name || 'Unknown',
          strength: item.drug_strength,
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration,
          instructions: item.instructions,
          quantity: item.quantity,
        })),
      });
    }

    // 2. Patient-uploaded prescriptions (from external doctors)
    const uploads = await this.prescriptionUploadModel
      .find({ patient: userId, is_deleted: { $ne: true } })
      .sort({ created_at: -1 })
      .limit(limit)
      .select('prescription_number original_filename verification_status order_status ocr_data.medications ocr_data.doctor_name ocr_data.prescription_date created_at')
      .lean();

    for (const u of uploads) {
      results.push({
        source: 'uploaded',
        prescription_number: u.prescription_number,
        date: u.ocr_data?.prescription_date || u.created_at,
        uploaded_at: u.created_at,
        filename: u.original_filename,
        verification_status: u.verification_status,
        order_status: u.order_status,
        prescribed_by: u.ocr_data?.doctor_name ? `Dr. ${u.ocr_data.doctor_name}` : 'External doctor',
        medications: (u.ocr_data?.medications || []).map((med: any) => ({
          drug: med.name || 'Unknown',
          dosage: med.dosage,
          quantity: med.quantity,
          instructions: med.instructions,
        })),
      });
    }

    if (!results.length) return { message: 'No prescriptions found.' };

    // Sort all by date descending, return top N
    results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return results.slice(0, limit);
  }

  private async toolGetAppointments(userId: Types.ObjectId, limit: number) {
    const appointments = await this.appointmentModel
      .find({ patient: userId })
      .sort({ start_time: -1 })
      .limit(limit)
      .populate('specialist', 'profile.first_name profile.last_name professional_practice.category')
      .select('category start_time appointment_type urgency status clinical_notes meeting_summary appointment_fee')
      .lean();

    if (!appointments.length) return { message: 'No appointments found.' };

    return appointments.map((a: any) => {
      const notes = a.clinical_notes?.[0];
      return {
        date: a.start_time,
        type: a.appointment_type,
        category: a.category,
        urgency: a.urgency,
        status: a.status,
        fee: a.appointment_fee,
        specialist: a.specialist?.profile
          ? `Dr. ${a.specialist.profile.first_name} ${a.specialist.profile.last_name}`
          : 'Unknown',
        specialty: a.specialist?.professional_practice?.category,
        diagnosis: notes?.assessment_diagnosis?.primary_diagnosis,
        treatment_plan: notes?.treatment_plan?.patient_instructions,
        follow_up: notes?.treatment_plan?.follow_up_required,
        summary: a.meeting_summary?.summary,
      };
    });
  }

  private async toolSearchPharmacy(query: string, limit: number) {
    this.logger.log(`[Pharmacy Search] query="${query}", limit=${limit}`);

    // Use native MongoDB driver — same pattern as DrugService.search() (drug.service.ts:349)
    // Required because Drug schema types (String enum) don't match actual DB data (ObjectIds)
    const drugCollection = this.drugModel.db.collection('drugentities');
    const searchDrugs = async (q: string) => {
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return drugCollection
        .find({
          is_active: { $ne: false },
          is_available: { $ne: false },
          $or: [
            { name: { $regex: escaped, $options: 'i' } },
            { generic_name: { $regex: escaped, $options: 'i' } },
            { brand_name: { $regex: escaped, $options: 'i' } },
          ],
        })
        .limit(limit)
        .project({ name: 1, generic_name: 1, strength: 1, selling_price: 1, quantity: 1, dosage_form: 1, prices: 1, requires_prescription: 1, purchase_type: 1, schedule_class: 1 })
        .toArray();
    };

    let drugs = await searchDrugs(query);

    // Fallback: if multi-word query returned nothing, try individual words
    if (!drugs.length && query.includes(' ')) {
      const words = query.split(/\s+/).filter((w) => w.length >= 3);
      for (const word of words) {
        drugs = await searchDrugs(word);
        if (drugs.length) {
          this.logger.log(`[Pharmacy Search] fallback matched on word "${word}" (${drugs.length} results)`);
          break;
        }
      }
    }

    this.logger.log(`[Pharmacy Search] found ${drugs.length} results for "${query}"`);
    if (!drugs.length) return { message: `No medications found matching "${query}".` };

    // Batch-resolve dosage_form ObjectIds to human-readable names
    const dosageFormIds = drugs
      .map((d: any) => d.dosage_form)
      .filter((id: any) => id && String(id).match(/^[0-9a-fA-F]{24}$/));

    let dosageFormMap = new Map<string, string>();
    if (dosageFormIds.length > 0) {
      try {
        const dfCollection = this.drugModel.db.collection('dosageformentities');
        const formDocs = await dfCollection
          .find({ _id: { $in: dosageFormIds.map((id: any) => new Types.ObjectId(String(id))) } })
          .toArray();
        dosageFormMap = new Map(formDocs.map((f: any) => [f._id.toString(), f.name]));
      } catch (e) {
        this.logger.warn(`[Pharmacy Search] Failed to resolve dosage forms: ${e.message}`);
      }
    }

    return drugs.map((d: any) => {
      // Resolve dosage_form: ObjectId → name, or use string value directly
      let dosageForm: string | null = null;
      if (d.dosage_form) {
        const idStr = String(d.dosage_form);
        dosageForm = dosageFormMap.get(idStr) || (idStr.match(/^[0-9a-fA-F]{24}$/) ? null : idStr);
      }

      return {
        id: d._id.toString(),
        name: d.name,
        generic_name: d.generic_name,
        strength: d.strength,
        dosage_form: dosageForm,
        prices: {
          NGN: d.prices?.NGN?.selling_price || d.selling_price,
          USD: d.prices?.USD?.selling_price,
          GBP: d.prices?.GBP?.selling_price,
          EUR: d.prices?.EUR?.selling_price,
        },
        in_stock: (d.quantity || 0) > 0,
        requires_prescription: d.requires_prescription || false,
        purchase_type: d.purchase_type || 'OTC_GENERAL',
        schedule_class: d.schedule_class,
      };
    });
  }

  private async toolGetOrders(userId: Types.ObjectId, limit: number) {
    // Primary: pharmacy orders
    const pharmacyOrders = await this.pharmacyOrderModel
      .find({ patient: userId })
      .sort({ created_at: -1 })
      .limit(limit)
      .select('order_number order_type status payment_status items subtotal discount_amount delivery_fee total_amount delivery_method delivery_address created_at')
      .lean();

    if (pharmacyOrders.length) {
      return pharmacyOrders.map((o: any) => ({
        order_number: o.order_number,
        date: o.created_at,
        type: o.order_type,
        status: o.status,
        payment_status: o.payment_status,
        delivery_method: o.delivery_method,
        items: (o.items || []).map((i: any) => ({
          drug: i.drug_name,
          strength: i.strength,
          dosage_form: i.dosage_form,
          quantity: i.quantity,
          unit_price: i.unit_price,
          total_price: i.total_price,
        })),
        subtotal: o.subtotal,
        discount: o.discount_amount,
        delivery_fee: o.delivery_fee,
        total: o.total_amount,
      }));
    }

    // Fallback: legacy orders collection
    const orders = await this.orderModel
      .find({ patient: userId })
      .sort({ created_at: -1 })
      .limit(limit)
      .select('items sub_total delivery_fee total_price order_status payment_status created_at')
      .lean();

    if (!orders.length) return { message: 'No orders found.' };

    return orders.map((o: any) => ({
      date: o.created_at,
      status: o.order_status,
      payment_status: o.payment_status,
      items: (o.items || []).map((i: any) => ({
        drug: i.drug_name,
        quantity: i.quantity,
        price: i.total,
      })),
      subtotal: o.sub_total,
      delivery_fee: o.delivery_fee,
      total: o.total_price,
    }));
  }

  private async toolGetWallet(userId: Types.ObjectId) {
    const [wallet, credits] = await Promise.all([
      this.walletModel
        .findOne({ userId })
        .select('available_balance currency')
        .lean(),
      this.creditModel
        .findOne({ userId })
        .select('free_credits_remaining purchased_credits gifted_credits gifted_credits_expiry unlimited_subscription total_summaries_generated')
        .lean(),
    ]);

    const result: any = {
      wallet_balance: wallet?.available_balance ?? 0,
      currency: wallet?.currency || 'NGN',
    };

    if (credits) {
      const hasUnlimited = credits.unlimited_subscription?.is_active
        && credits.unlimited_subscription?.expires_at
        && new Date(credits.unlimited_subscription.expires_at) > new Date();

      result.ai_credits = {
        free_credits_remaining: credits.free_credits_remaining ?? 0,
        purchased_credits: credits.purchased_credits ?? 0,
        gifted_credits: credits.gifted_credits ?? 0,
        gifted_credits_expiry: credits.gifted_credits_expiry || null,
        has_unlimited_subscription: !!hasUnlimited,
        unlimited_expires_at: hasUnlimited ? credits.unlimited_subscription.expires_at : null,
        unlimited_plan_name: hasUnlimited ? credits.unlimited_subscription.plan_name : null,
        total_summaries_generated: credits.total_summaries_generated ?? 0,
        total_available: hasUnlimited ? 'Unlimited' : (
          (credits.free_credits_remaining ?? 0)
          + (credits.purchased_credits ?? 0)
          + (credits.gifted_credits ?? 0)
        ),
      };
    } else {
      result.ai_credits = {
        free_credits_remaining: 5,
        purchased_credits: 0,
        gifted_credits: 0,
        has_unlimited_subscription: false,
        total_available: 5,
        note: 'New account — 5 free monthly credits available',
      };
    }

    return result;
  }

  private async toolGetSubscription(userId: Types.ObjectId) {
    const [credits, plans] = await Promise.all([
      this.creditModel
        .findOne({ userId })
        .select('free_credits_remaining purchased_credits gifted_credits unlimited_subscription total_summaries_generated total_amount_spent created_at')
        .lean(),
      this.summaryPlanModel
        .find({ is_active: true })
        .sort({ sort_order: 1 })
        .select('name type credits price prices currency description')
        .lean(),
    ]);

    const result: any = {};

    if (credits) {
      const sub = credits.unlimited_subscription;
      const hasUnlimited = sub?.is_active && sub?.expires_at && new Date(sub.expires_at) > new Date();

      result.current_status = {
        has_unlimited_subscription: !!hasUnlimited,
        unlimited_plan_name: hasUnlimited ? sub.plan_name : null,
        unlimited_expires_at: hasUnlimited ? sub.expires_at : null,
        free_credits_remaining: credits.free_credits_remaining ?? 0,
        purchased_credits: credits.purchased_credits ?? 0,
        gifted_credits: credits.gifted_credits ?? 0,
        total_summaries_generated: credits.total_summaries_generated ?? 0,
        total_amount_spent_ngn: credits.total_amount_spent ?? 0,
        member_since: credits.created_at,
      };
    } else {
      result.current_status = {
        has_unlimited_subscription: false,
        free_credits_remaining: 5,
        purchased_credits: 0,
        note: 'New account with 5 free monthly credits',
      };
    }

    if (plans.length) {
      result.available_plans = plans.map((p: any) => ({
        name: p.name,
        type: p.type,
        credits: p.credits ?? 'Unlimited',
        price_ngn: p.price,
        prices: p.prices || null,
        description: p.description || null,
      }));
    }

    return result;
  }

  private async toolGetProfile(userId: Types.ObjectId) {
    const user = await this.userModel
      .findById(userId)
      .select(
        'profile.first_name profile.last_name profile.date_of_birth profile.gender ' +
          'profile.phone_number profile.medical_history profile.health_risk_factors ' +
          'profile.emergency_contacts allergies pre_existing_conditions',
      )
      .lean();

    if (!user) return { message: 'Profile not found.' };

    const p = user.profile || {};
    return {
      name: `${p.first_name || ''} ${p.last_name || ''}`.trim(),
      date_of_birth: p.date_of_birth,
      gender: p.gender,
      medical_history: p.medical_history,
      health_risk_factors: p.health_risk_factors,
      emergency_contacts: p.emergency_contacts,
      allergies: (user as any).allergies,
      pre_existing_conditions: (user as any).pre_existing_conditions,
    };
  }

  private async toolGetHealthScore(userId: Types.ObjectId) {
    const result: any = {};

    // Basic health score (latest)
    const basic = await this.basicScoreModel
      .findOne({ user_id: userId })
      .sort({ created_at: -1 })
      .select('score previous_score status trigger breakdown created_at')
      .lean();

    if (basic) {
      result.basic_score = {
        score: basic.score,
        previous_score: basic.previous_score,
        status: basic.status,
        last_updated: basic.created_at,
        trigger: basic.trigger,
        breakdown: basic.breakdown,
      };
    }

    // Advanced health score (latest completed)
    const advanced = await this.advancedScoreModel
      .findOne({ user_id: userId, status: 'completed' })
      .sort({ created_at: -1 })
      .select('report.overall_score report.overall_status report.overall_summary report.domain_scores report.priority_actions report.lifestyle_tips report.when_to_see_doctor created_at')
      .lean();

    if (advanced?.report) {
      result.advanced_score = {
        overall_score: advanced.report.overall_score,
        overall_status: advanced.report.overall_status,
        summary: advanced.report.overall_summary,
        last_updated: advanced.created_at,
        domains: (advanced.report.domain_scores || []).map((d: any) => ({
          domain: d.domain_label,
          score: d.score,
          status: d.status,
          insights: d.insights,
          recommendations: d.recommendations,
        })),
        priority_actions: advanced.report.priority_actions,
        lifestyle_tips: advanced.report.lifestyle_tips,
        when_to_see_doctor: advanced.report.when_to_see_doctor,
      };
    }

    if (!result.basic_score && !result.advanced_score) {
      return { message: 'No health score data found. The patient has not completed a health score assessment yet.' };
    }

    return result;
  }

  // ============ HEALTH CHECKUP TOOL HANDLERS ============

  /**
   * Resolve a checkup session — handles Haiku passing invalid/placeholder session IDs
   * by falling back to the user's most recent active (incomplete) checkup.
   */
  private async resolveCheckup(userId: Types.ObjectId, sessionId?: string, requireIncomplete = true) {
    // Try by ID if it looks like a valid ObjectId
    if (sessionId && Types.ObjectId.isValid(sessionId)) {
      const checkup = await this.healthCheckupModel.findOne({
        _id: sessionId,
        user: userId,
        deleted_at: null,
      });
      if (checkup) return checkup;
    }

    // Fallback: find user's most recent checkup
    const query: any = { user: userId, deleted_at: null };
    if (requireIncomplete) {
      query['response.data'] = { $exists: false };
    }
    return this.healthCheckupModel.findOne(query).sort({ created_at: -1 });
  }

  private async toolStartHealthCheckup(userId: Types.ObjectId) {
    // Clear any stale checkup phases from previous sessions
    await this.healthCheckupModel.updateMany(
      { user: userId, 'request.checkup_phase': { $in: ['awaiting_symptoms', 'awaiting_confirmation', 'interview'] } },
      { $set: { 'request.checkup_phase': null } },
    );

    const user = await this.userModel
      .findById(userId)
      .select('profile.first_name profile.last_name profile.date_of_birth profile.gender profile.medical_history profile.health_risk_factors')
      .lean();

    if (!user?.profile) return { error: 'Patient profile not found. Please update your profile first.' };

    const p = user.profile as any;

    // Calculate age
    const dob = p.date_of_birth ? new Date(p.date_of_birth) : null;
    if (!dob) return { error: 'Date of birth not set in profile. Please update your profile first.' };

    const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    if (age < 12) return { error: 'Health checkups are available for ages 12 and above.' };

    const gender = (p.gender || '').toLowerCase();
    const sex = gender === 'female' ? 'female' : 'male';

    // Generate interview token
    const interview_token = new Types.ObjectId().toString();

    // Create health checkup document
    const checkup = await this.healthCheckupModel.create({
      user: userId,
      health_check_for: 'Self',
      checkup_owner_id: userId,
      interview_token,
      request: {
        sex,
        age: { value: age },
        evidence: [],
        checkup_phase: 'awaiting_symptoms',
      },
    });

    // Get risk factors from Infermedica
    let riskFactors: any[] = [];
    try {
      const infermedica = new Infermedica(interview_token);
      const response = await infermedica.getRiskFactors(age);
      riskFactors = response?.data || [];
    } catch (e) {
      this.logger.warn('Failed to get risk factors from Infermedica:', e.message);
    }

    return {
      session_id: checkup._id.toString(),
      interview_token,
      patient: {
        name: `${p.first_name || ''} ${p.last_name || ''}`.trim(),
        age,
        gender: sex,
        medical_history: p.medical_history || [],
        health_risk_factors: p.health_risk_factors || [],
      },
      risk_factors: riskFactors.map((rf: any) => ({
        id: rf.id,
        name: rf.name,
        common_name: rf.common_name || rf.name,
      })),
      __artifact: {
        type: 'health_checkup_start',
        data: {
          session_id: checkup._id.toString(),
          patient_gender: sex,
          patient_age: age,
        },
      },
    };
  }

  private async toolSubmitCheckupSymptoms(userId: Types.ObjectId, sessionId: string, symptomsText: string) {
    const checkup = await this.resolveCheckup(userId, sessionId);
    if (!checkup) return { error: 'Health checkup session not found.' };

    const { sex, age } = checkup.request;
    const infermedica = new Infermedica(checkup.interview_token);

    // Parse free text
    let parsed: any[] = [];
    try {
      const parseResponse = await infermedica.parseFreeText({ sex, age, text: symptomsText });
      parsed = (parseResponse?.data?.mentions || []).map((m: any) => ({
        id: m.id,
        name: m.name,
        common_name: m.common_name || m.name,
        choice_id: m.choice_id || 'present',
      }));
    } catch (e) {
      this.logger.warn('Failed to parse symptoms:', e.message);
      return { error: 'Could not parse symptoms. Please try describing them differently.' };
    }

    // Get suggested symptoms
    let suggestions: any[] = [];
    if (parsed.length > 0) {
      try {
        const evidence = parsed.map((p: any) => ({
          id: p.id,
          choice_id: p.choice_id,
          source: 'initial',
        }));

        const suggestResponse = await infermedica.getSuggestedSymptoms({ sex, age, evidence });
        suggestions = (suggestResponse?.data || []).map((s: any) => ({
          id: s.id,
          name: s.name,
          common_name: s.common_name || s.name,
        }));
      } catch (e) {
        this.logger.warn('Failed to get suggested symptoms:', e.message);
      }
    }

    // Save parsed symptoms to checkup evidence (merge with any avatar-selected symptoms)
    const existingEvidence = checkup.request.evidence || [];
    const existingIds = new Set(existingEvidence.map((e: any) => e.id));
    const newEvidence = [...existingEvidence];

    for (const p of parsed) {
      if (!existingIds.has(p.id)) {
        newEvidence.push({
          id: p.id,
          choice_id: p.choice_id,
          source: 'initial',
        });
      }
    }

    checkup.request = {
      ...checkup.request,
      evidence: newEvidence,
      symptoms_text: symptomsText,
      suggestions, // Save for ID lookup when confirming
      checkup_phase: 'awaiting_confirmation', // Next message → force run_checkup_interview
    };
    checkup.markModified('request');
    await checkup.save();

    return {
      parsed: parsed.map((p: any) => ({
        name: p.name,
        common_name: p.common_name,
      })),
      suggestions: suggestions.map((s: any) => ({
        name: s.name,
        common_name: s.common_name,
      })),
    };
  }

  private async toolRunCheckupInterview(userId: Types.ObjectId, sessionId: string, input: any) {
    const checkup = await this.resolveCheckup(userId, sessionId);
    if (!checkup) return { error: 'Health checkup session not found.' };

    const { sex, age } = checkup.request;
    const evidence = [...(checkup.request.evidence || [])];
    const existingIds = new Set(evidence.map((e: any) => e.id));

    // Helper: find symptom ID by name from suggestions or parsed data
    const findSymptomId = (name: string): string | null => {
      const lowerName = name.toLowerCase().trim();
      const suggestions = checkup.request.suggestions || [];
      const allKnown = [...suggestions, ...(checkup.request.parsed_symptoms || [])];
      const match = allKnown.find(
        (s: any) =>
          s.name?.toLowerCase() === lowerName ||
          s.common_name?.toLowerCase() === lowerName ||
          s.label?.toLowerCase() === lowerName,
      );
      return match?.id || null;
    };

    // Helper: interpret yes/no/unknown from natural language
    const interpretYesNo = (answer: string): 'present' | 'absent' | 'unknown' => {
      const a = answer.toLowerCase().trim();
      // Positive answers
      if (/^(yes|yeah|yep|yup|ya|sure|correct|right|true|present|affirmative|definitely|absolutely|of course|i do|i have|i am)$/i.test(a)) return 'present';
      // Negative answers
      if (/^(no|nope|nah|never|not|false|absent|negative|i don't|i haven't|i'm not|none)$/i.test(a)) return 'absent';
      // Uncertain
      if (/^(unknown|not sure|unsure|maybe|i don't know|idk|i'm not sure|possibly|perhaps|can't tell|hard to say)$/i.test(a)) return 'unknown';
      // Any other descriptive answer (e.g. "3 days", "severe", "sometimes") → implies presence
      return 'present';
    };

    // Helper: normalize text for comparison (expand contractions, strip punctuation)
    const normalize = (s: string) => s.toLowerCase().trim()
      .replace(/['']/g, "'")           // normalize apostrophes
      .replace(/'s\b/g, ' is')         // it's → it is
      .replace(/n't\b/g, ' not')       // don't → do not
      .replace(/'re\b/g, ' are')       // they're → they are
      .replace(/'ve\b/g, ' have')      // I've → I have
      .replace(/'m\b/g, ' am')         // I'm → I am
      .replace(/'ll\b/g, ' will')      // I'll → I will
      .replace(/[^\w\s]/g, '')         // strip remaining punctuation
      .replace(/\s+/g, ' ')            // collapse whitespace
      .trim();

    // Helper: fuzzy match an answer against item names
    const fuzzyMatchItem = (answer: string, items: any[]): any | null => {
      const ansNorm = normalize(answer);
      // Exact match first (normalized)
      let match = items.find(
        (item: any) =>
          normalize(item.name || '') === ansNorm ||
          normalize(item.common_name || '') === ansNorm,
      );
      if (match) return match;
      // Partial match — answer contained in item name or vice versa (normalized)
      match = items.find(
        (item: any) =>
          normalize(item.name || '').includes(ansNorm) ||
          normalize(item.common_name || '').includes(ansNorm) ||
          ansNorm.includes(normalize(item.name || '')) ||
          ansNorm.includes(normalize(item.common_name || '')),
      );
      return match || null;
    };

    // Helper: update or add evidence (never downgrade 'present' to 'unknown')
    const upsertEvidence = (id: string, choiceId: string) => {
      if (!existingIds.has(id)) {
        evidence.push({ id, choice_id: choiceId });
        existingIds.add(id);
      } else if (choiceId !== 'unknown') {
        // Only update if the new value is definitive (present/absent) — never overwrite with 'unknown'
        const idx = evidence.findIndex((e: any) => e.id === id);
        if (idx !== -1) evidence[idx] = { ...evidence[idx], choice_id: choiceId };
      }
      // If choiceId === 'unknown' and item already exists, skip — don't corrupt existing evidence
    };

    this.logger.log(`run_checkup_interview input: ${JSON.stringify({
      confirmed: input.confirmed_symptoms?.length || 0,
      denied: input.denied_symptoms?.length || 0,
      answer: input.answer,
      answers: input.answers,
      lastQuestionType: checkup.request.last_question?.type,
    })}`);

    // FIRST CALL: confirmed/denied symptoms from suggestions
    if (input.confirmed_symptoms?.length || input.denied_symptoms?.length) {
      for (const name of input.confirmed_symptoms || []) {
        const id = findSymptomId(name);
        if (id && !existingIds.has(id)) {
          evidence.push({ id, choice_id: 'present', source: 'initial' });
          existingIds.add(id);
        }
      }
      for (const name of input.denied_symptoms || []) {
        const id = findSymptomId(name);
        if (id && !existingIds.has(id)) {
          evidence.push({ id, choice_id: 'absent', source: 'initial' });
          existingIds.add(id);
        }
      }
    }

    // SUBSEQUENT CALLS: answer to last interview question
    const lastQuestion = checkup.request.last_question;
    if (lastQuestion && (input.answer || input.answers)) {
      const items = lastQuestion.items || [];

      if (lastQuestion.type === 'single' && items.length >= 1 && input.answer) {
        // Single yes/no/unknown question about one symptom
        const item = items[0];
        const choiceId = interpretYesNo(input.answer);
        this.logger.log(`Single answer: "${input.answer}" → ${choiceId} for ${item.id} (${item.name})`);
        upsertEvidence(item.id, choiceId);

      } else if (lastQuestion.type === 'group_single' && input.answer) {
        // Pick one from multiple options — use fuzzy matching
        const matched = fuzzyMatchItem(input.answer, items);
        this.logger.log(`Group single answer: "${input.answer}" → matched: ${matched?.name || 'NONE'}`);

        if (matched) {
          // Set matched as present, all others as absent
          for (const item of items) {
            const choiceId = item.id === matched.id ? 'present' : 'absent';
            upsertEvidence(item.id, choiceId);
          }
        } else {
          // No match — check if the answer is "none" or negative
          const isNegative = /^(none|no|nothing|neither)$/i.test(input.answer.trim());
          for (const item of items) {
            upsertEvidence(item.id, isNegative ? 'absent' : 'unknown');
          }
        }

      } else if (lastQuestion.type === 'group_multiple') {
        // Pick multiple from options — use fuzzy matching
        const selectedNames = (input.answers || [input.answer]).filter(Boolean);
        this.logger.log(`Group multiple answers: ${JSON.stringify(selectedNames)}`);

        for (const item of items) {
          const itemNorm = normalize(item.name || '');
          const itemCommonNorm = normalize(item.common_name || '');
          const isChosen = selectedNames.some((sel: string) => {
            const selNorm = normalize(sel);
            return (
              itemNorm === selNorm ||
              itemCommonNorm === selNorm ||
              itemNorm.includes(selNorm) ||
              itemCommonNorm.includes(selNorm) ||
              selNorm.includes(itemNorm) ||
              selNorm.includes(itemCommonNorm)
            );
          });
          upsertEvidence(item.id, isChosen ? 'present' : 'absent');
        }
      }
    }

    // Clean evidence for Infermedica (strip custom source fields)
    const cleanedEvidence = evidence.map((item: any) => {
      const clean: any = { id: item.id, choice_id: item.choice_id };
      if (item.source && item.source !== 'interview') clean.source = item.source;
      return clean;
    });

    const infermedica = new Infermedica(checkup.interview_token);

    try {
      // NO enable_symptom_duration — duration questions don't work well in chat
      const response = await infermedica.diagnosis({
        sex,
        age,
        evidence: cleanedEvidence,
      });

      this.logger.log(`Infermedica response: should_stop=${response?.data?.should_stop}, question_type=${response?.data?.question?.type}, evidence_count=${cleanedEvidence.length}`);

      const isComplete = response?.data?.should_stop;

      if (isComplete) {
        // Call triage
        let triageData: any = null;
        try {
          const triageResponse = await infermedica.triage({ sex, age, evidence: cleanedEvidence });
          triageData = triageResponse?.data;
        } catch (e) {
          this.logger.warn('Failed to get triage:', e.message);
        }

        // Save everything — interview done
        checkup.request = { ...checkup.request, evidence, last_question: null, checkup_phase: null };
        checkup.response = {
          data: {
            ...response.data,
            triage_level: triageData?.triage_level || null,
            triage: triageData || null,
          },
        };
        checkup.markModified('request');
        checkup.markModified('response');
        await checkup.save();

        return {
          status: 'completed',
          triage_level: triageData?.triage_level || 'unknown',
          conditions: (response.data.conditions || []).slice(0, 8).map((c: any) => ({
            name: c.common_name || c.name,
            probability: Math.round(c.probability * 100),
          })),
        };
      }

      // Save evidence + store current question for next answer mapping
      const question = response.data.question;
      checkup.request = {
        ...checkup.request,
        evidence,
        checkup_phase: 'interview', // Keep forcing run_checkup_interview on next user message
        last_question: question
          ? {
              text: question.text,
              type: question.type,
              items: (question.items || []).map((item: any) => ({
                id: item.id,
                name: item.name,
                common_name: item.common_name,
              })),
            }
          : null,
      };
      checkup.markModified('request');
      await checkup.save();

      if (!question) {
        return { status: 'in_progress', message: 'No question returned. The interview may be complete.' };
      }

      return {
        status: 'in_progress',
        question: {
          text: question.text,
          type: question.type,
          items: (question.items || []).map((item: any) => ({
            name: item.name,
            common_name: item.common_name,
          })),
        },
        _instruction: 'Present ONLY this question to the patient. Do NOT add your own follow-up questions.',
      };
    } catch (e) {
      this.logger.error('Infermedica diagnosis error:', e.message);
      return { error: 'Failed to process the interview. Please try again.' };
    }
  }

  private async toolGenerateCheckupReport(userId: Types.ObjectId, sessionId: string) {
    const checkup = await this.resolveCheckup(userId, sessionId, false);
    if (!checkup) return { error: 'Health checkup session not found.' };
    if (!checkup.response?.data) return { error: 'Health checkup is not yet complete. Please complete the interview first.' };

    // Check credits
    const creditCheck = await this.claudeSummaryCreditsService.canGenerateSummary(userId);
    if (!creditCheck.can_generate) {
      return {
        error: 'No AI credits available. You need at least 1 credit to generate a health report.',
        credits_remaining: 0,
      };
    }

    // Generate Claude summary
    const diagnosisData = {
      conditions: checkup.response.data.conditions || [],
      evidence: checkup.request?.evidence || [],
      triage_level: checkup.response.data.triage_level,
      has_emergency_evidence: checkup.response.data.has_emergency_evidence,
    };

    const patientInfo = {
      age: checkup.request?.age?.value || 0,
      gender: checkup.request?.sex || 'male',
    };

    const summary = await this.claudeHealthSummaryService.generateHealthSummary(
      diagnosisData,
      patientInfo,
    );

    // Consume credit
    try {
      await this.claudeSummaryCreditsService.consumeCredit(userId, checkup._id);
    } catch (e) {
      this.logger.error('Failed to consume credit:', e.message);
      return { error: 'Failed to process credit. Please try again.' };
    }

    // Store summary on checkup + clear interview_active flag
    checkup.claude_summary = {
      generated_at: summary.generated_at,
      model: summary.model,
      content: summary.content,
      error: summary.error,
    };
    if (checkup.request) {
      checkup.request = { ...checkup.request, checkup_phase: null };
      checkup.markModified('request');
    }
    checkup.markModified('claude_summary');
    await checkup.save();

    // Return with artifact marker for the frontend
    return {
      report: summary.content,
      triage_level: checkup.response.data.triage_level,
      conditions: (checkup.response.data.conditions || []).slice(0, 5).map((c: any) => ({
        name: c.common_name || c.name,
        probability: Math.round(c.probability * 100),
      })),
      credits_remaining: creditCheck.credits_remaining,
      __artifact: {
        type: 'health_checkup_report',
        data: {
          checkup_id: checkup._id.toString(),
          triage_level: checkup.response.data.triage_level,
          conditions: (checkup.response.data.conditions || []).slice(0, 8).map((c: any) => ({
            name: c.common_name || c.name,
            probability: Math.round(c.probability * 100),
          })),
          report: summary.content,
          patient: patientInfo,
          date: new Date().toISOString(),
        },
      },
    };
  }

  // ============ DRUG INTERACTION CHECKER ============

  private async toolCheckDrugInteractions(userId: Types.ObjectId, drugs: any[]) {
    if (!drugs || drugs.length < 2) {
      return { error: 'Please provide at least 2 medications to check for interactions.' };
    }
    if (drugs.length > 5) {
      return { error: 'You can check up to 5 medications at a time.' };
    }

    // Validate drug names
    const validDrugs = drugs.filter((d: any) => d?.name?.trim());
    if (validDrugs.length < 2) {
      return { error: 'Please provide at least 2 valid drug names.' };
    }

    // Check credits
    const creditCheck = await this.claudeSummaryCreditsService.canGenerateSummary(userId);
    if (!creditCheck.can_generate) {
      return {
        error: 'No AI credits available. You need at least 1 credit to check drug interactions.',
        suggestion: 'You can purchase more credits from your wallet.',
      };
    }

    // Call the existing Sonnet-powered interaction checker
    try {
      const result = await this.claudeAIService.checkDrugInteractionsDetailed(
        validDrugs.map((d: any) => ({
          name: d.name.trim(),
          dose: d.dose?.trim() || undefined,
          route: d.route?.trim() || undefined,
        })),
      );

      // Consume 1 credit
      try {
        await this.claudeSummaryCreditsService.consumeCredit(userId, new Types.ObjectId().toString());
      } catch (e) {
        this.logger.error('Failed to consume credit for interaction check:', e.message);
      }

      const drugNames = validDrugs.map((d: any) => d.name.trim());

      return {
        ...result,
        drugs_checked: drugNames,
        credits_used: 1,
        __artifact: {
          type: 'drug_interaction_report',
          data: {
            ...result,
            drugs_checked: drugNames,
          },
        },
      };
    } catch (e) {
      this.logger.error('Drug interaction check failed:', e.message);
      return { error: 'Failed to check drug interactions. Please try again.' };
    }
  }

  // ============ PRESCRIPTION UPLOAD & ANALYSIS ============

  async uploadPrescriptionFile(userId: string, file: Express.Multer.File) {
    const patientId = new Types.ObjectId(userId);
    const bucket = process.env.AWS_BUCKET_NAME || 'rapidcapsule';
    const { v4: uuidv4 } = require('uuid');
    const key = `prescriptions/eka/${patientId}/${uuidv4()}-${file.originalname}`;

    // Upload to S3
    const uploadResult = await this.s3
      .upload({
        Bucket: bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
      .promise();

    // Generate prescription number
    const prescriptionNumber =
      await this.prescriptionNumberHelper.generatePrescriptionNumber();

    // Create upload record
    const upload = await this.prescriptionUploadModel.create({
      patient: patientId,
      prescription_number: prescriptionNumber,
      original_filename: file.originalname,
      mimetype: file.mimetype,
      file_size: file.size,
      s3_key: key,
      s3_bucket: bucket,
      s3_url: uploadResult.Location,
      upload_source: UploadSource.EKA_CHAT,
      processing_status: 'PENDING',
      verification_status: 'PENDING',
      fraud_score: 0,
      fraud_flags: [],
      usage_count: 0,
      used_in_orders: [],
      is_deleted: false,
    });

    this.logger.log(
      `[Eka Prescription Upload] ${prescriptionNumber} uploaded for patient ${patientId}`,
    );

    return {
      uploadId: upload._id.toString(),
      prescriptionNumber: upload.prescription_number,
      s3Key: key,
      s3Bucket: bucket,
      filename: file.originalname,
      mimetype: file.mimetype,
    };
  }

  /**
   * Search drugs by medication name using native MongoDB driver
   * Returns matched drug info with multi-currency pricing
   */
  private async matchDrugToInventory(medicationName: string) {
    const drugCollection = this.drugModel.db.collection('drugentities');
    const escaped = medicationName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    let drugs = await drugCollection
      .find({
        is_active: { $ne: false },
        is_available: { $ne: false },
        $or: [
          { name: { $regex: escaped, $options: 'i' } },
          { generic_name: { $regex: escaped, $options: 'i' } },
        ],
      })
      .limit(3)
      .project({
        name: 1,
        generic_name: 1,
        strength: 1,
        selling_price: 1,
        quantity: 1,
        dosage_form: 1,
        prices: 1,
        requires_prescription: 1,
        purchase_type: 1,
        schedule_class: 1,
      })
      .toArray();

    // Fallback: try individual words if multi-word name returns nothing
    if (!drugs.length && medicationName.includes(' ')) {
      const words = medicationName.split(/\s+/).filter((w) => w.length >= 3);
      for (const word of words) {
        const wordEscaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        drugs = await drugCollection
          .find({
            is_active: { $ne: false },
            is_available: { $ne: false },
            $or: [
              { name: { $regex: wordEscaped, $options: 'i' } },
              { generic_name: { $regex: wordEscaped, $options: 'i' } },
            ],
          })
          .limit(3)
          .project({
            name: 1,
            generic_name: 1,
            strength: 1,
            selling_price: 1,
            quantity: 1,
            dosage_form: 1,
            prices: 1,
            requires_prescription: 1,
            purchase_type: 1,
            schedule_class: 1,
          })
          .toArray();
        if (drugs.length) break;
      }
    }

    if (!drugs.length) return null;

    // Use best match (first result)
    const d = drugs[0] as any;

    // Resolve dosage_form ObjectId if needed
    let dosageForm: string | null = null;
    if (d.dosage_form) {
      const idStr = String(d.dosage_form);
      if (idStr.match(/^[0-9a-fA-F]{24}$/)) {
        try {
          const dfCollection =
            this.drugModel.db.collection('dosageformentities');
          const formDoc = await dfCollection.findOne({
            _id: new Types.ObjectId(idStr),
          });
          dosageForm = formDoc?.name || null;
        } catch {}
      } else {
        dosageForm = idStr;
      }
    }

    return {
      matched_drug_id: d._id.toString(),
      matched_drug_name: d.name,
      matched_generic_name: d.generic_name,
      strength: d.strength,
      dosage_form: dosageForm,
      prices: {
        NGN: d.prices?.NGN?.selling_price || d.selling_price,
        USD: d.prices?.USD?.selling_price,
        GBP: d.prices?.GBP?.selling_price,
        EUR: d.prices?.EUR?.selling_price,
      },
      in_stock: (d.quantity || 0) > 0,
      requires_prescription: d.requires_prescription || false,
      purchase_type: d.purchase_type || 'OTC_GENERAL',
      schedule_class: d.schedule_class,
    };
  }

  /**
   * Run advisory readiness checks on a prescription (never blocking)
   */
  private buildReadinessChecks(
    analysis: any,
    ocrData: any,
    medications: any[],
  ) {
    const issues: Array<{
      check: string;
      status: 'passed' | 'warning' | 'failed';
      message: string;
    }> = [];

    // Doctor name check
    const doctorName =
      analysis?.extractedData?.prescriber?.name || ocrData?.doctorName;
    if (doctorName) {
      issues.push({
        check: 'Doctor Name',
        status: 'passed',
        message: `${doctorName} detected`,
      });
    } else {
      issues.push({
        check: 'Doctor Name',
        status: 'failed',
        message: 'No prescriber name found — required for ordering',
      });
    }

    // Prescription date check
    const prescDate =
      analysis?.extractedData?.prescription?.date ||
      ocrData?.prescriptionDate;
    if (prescDate) {
      const dateObj = new Date(prescDate);
      const daysSince = Math.floor(
        (Date.now() - dateObj.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (daysSince <= 180) {
        issues.push({
          check: 'Prescription Date',
          status: 'passed',
          message: `Dated ${dateObj.toLocaleDateString()} (${daysSince} days ago)`,
        });
      } else {
        issues.push({
          check: 'Prescription Date',
          status: 'failed',
          message: `Prescription is ${daysSince} days old — may be expired (max 180 days)`,
        });
      }
    } else {
      issues.push({
        check: 'Prescription Date',
        status: 'failed',
        message: 'No prescription date found — required for ordering',
      });
    }

    // Patient name check
    const patientName =
      analysis?.extractedData?.patient?.name || ocrData?.patientName;
    if (patientName) {
      issues.push({
        check: 'Patient Name',
        status: 'passed',
        message: `${patientName} found on prescription`,
      });
    } else {
      issues.push({
        check: 'Patient Name',
        status: 'warning',
        message:
          'No patient name found — may need verification when ordering',
      });
    }

    // Doctor license check
    const license =
      analysis?.extractedData?.prescriber?.license ||
      ocrData?.doctorLicense;
    if (license) {
      issues.push({
        check: 'Doctor License',
        status: 'passed',
        message: `License ${license} found`,
      });
    } else {
      issues.push({
        check: 'Doctor License',
        status: 'warning',
        message: 'No license number detected — may require manual verification',
      });
    }

    // OCR confidence check
    const confidence = ocrData?.confidence || analysis?.confidence;
    if (confidence && confidence >= 60) {
      issues.push({
        check: 'Document Readability',
        status: 'passed',
        message: `${Math.round(confidence)}% readable`,
      });
    } else if (confidence) {
      issues.push({
        check: 'Document Readability',
        status: 'warning',
        message: `Only ${Math.round(confidence)}% readable — a clearer image may improve results`,
      });
    }

    // Controlled substance check
    const controlledMeds = medications.filter(
      (m) =>
        m.in_inventory &&
        m.schedule_class &&
        !['OTC', 'OTC_GENERAL'].includes(m.schedule_class),
    );
    if (controlledMeds.length > 0) {
      issues.push({
        check: 'Controlled Substances',
        status: 'warning',
        message: `Contains ${controlledMeds.length} controlled/scheduled medication(s) — requires pharmacist review when ordering`,
      });
    }

    // Fraud flags from Claude analysis
    if (analysis?.fraudScore > 50) {
      issues.push({
        check: 'Document Authenticity',
        status: 'warning',
        message: 'Some authenticity concerns detected — may require additional verification',
      });
    }

    // Calculate score
    const failed = issues.filter((i) => i.status === 'failed').length;
    const warnings = issues.filter((i) => i.status === 'warning').length;
    const score = Math.max(
      0,
      100 - failed * 20 - warnings * 5,
    );
    const readyForOrder = failed === 0;

    const summary = readyForOrder
      ? 'This prescription appears ready for ordering on our platform.'
      : `This prescription may need attention before ordering: ${issues
          .filter((i) => i.status === 'failed')
          .map((i) => i.message.toLowerCase())
          .join(', ')}.`;

    return {
      ready_for_order: readyForOrder,
      score,
      issues,
      summary,
    };
  }

  private async toolAnalyzePrescriptionUpload(
    userId: Types.ObjectId,
    uploadId: string,
  ) {
    if (!uploadId) {
      return { error: 'No upload ID provided.' };
    }

    // Fetch the upload record
    const upload = await this.prescriptionUploadModel
      .findOne({ _id: uploadId, patient: userId, is_deleted: { $ne: true } })
      .lean();

    if (!upload) {
      return {
        error: 'Prescription upload not found. It may have been deleted.',
      };
    }

    this.logger.log(
      `[Eka Prescription Analysis] Analyzing upload ${upload.prescription_number}`,
    );

    try {
      // Step 1: Download image from S3 as buffer
      const s3Object = await this.s3
        .getObject({
          Bucket: upload.s3_bucket,
          Key: upload.s3_key,
        })
        .promise();

      const fileBuffer = s3Object.Body as Buffer;
      const imageBase64 = fileBuffer.toString('base64');

      // Step 2: Run OCR via Textract
      // Use S3 variant (supports PDF + images) — same as standalone pipeline
      let ocrData: any = { rawText: '', confidence: 0, medications: [] };
      try {
        const ocrResult = await this.textractService.analyzeDocumentFromS3(
          upload.s3_bucket,
          upload.s3_key,
        );
        if (ocrResult?.success && ocrResult.data) {
          ocrData = ocrResult.data;
        } else if (ocrResult?.error) {
          this.logger.warn(
            `[Eka Prescription Analysis] Textract returned error: ${ocrResult.error}`,
          );
        }
      } catch (e) {
        this.logger.warn(
          `[Eka Prescription Analysis] OCR failed: ${e.message}`,
        );
      }

      // Step 3: Get patient info for Claude analysis
      const user = await this.userModel.findById(userId).lean();
      const patientInfo = {
        fullName: `${user?.profile?.first_name || ''} ${user?.profile?.last_name || ''}`.trim(),
        dateOfBirth: user?.profile?.date_of_birth,
        gender: user?.profile?.gender,
      };

      // Step 4: Run Claude Vision analysis (primary extractor — handles printed, digital, and handwritten prescriptions)
      const hasOcrData = ocrData.rawText || ocrData.medications?.length;
      this.logger.log(
        `[Eka Prescription Analysis] OCR ${hasOcrData ? 'succeeded' : 'empty/failed'}, running Claude Vision (mimetype: ${upload.mimetype})`,
      );

      let analysis: any = {};
      try {
        analysis = await this.claudeAIService.analyzePrescription(
          {
            raw_text: ocrData?.rawText || '',
            doctor_name: ocrData?.doctorName,
            patient_name: ocrData?.patientName,
            prescription_date: ocrData?.prescriptionDate,
            medications: ocrData?.medications || [],
            doctor_license: ocrData?.doctorLicense,
          },
          patientInfo,
          imageBase64,
          upload.mimetype,
        );
        this.logger.log(
          `[Eka Prescription Analysis] Claude extracted ${analysis?.extractedData?.medications?.length || 0} medications, confidence: ${analysis?.confidence || 0}`,
        );
      } catch (e) {
        this.logger.warn(
          `[Eka Prescription Analysis] Claude Vision failed: ${e.message}`,
        );
      }

      // Step 5: Merge medication lists from OCR and Claude
      const rawMedications: Array<{
        name: string;
        dosage?: string;
        quantity?: string;
        instructions?: string;
      }> = [];

      // Prefer Claude's extracted medications
      if (analysis?.extractedData?.medications?.length) {
        for (const med of analysis.extractedData.medications) {
          rawMedications.push({
            name: med.name || med.drug_name,
            dosage: med.dosage || med.dose,
            quantity: med.quantity,
            instructions: med.frequency || med.instructions,
          });
        }
      }
      // Fallback to OCR medications
      if (!rawMedications.length && ocrData.medications?.length) {
        for (const med of ocrData.medications) {
          rawMedications.push({
            name: med.name,
            dosage: med.dosage,
            quantity: med.quantity,
            instructions: med.instructions,
          });
        }
      }

      if (!rawMedications.length) {
        // Update upload record with OCR data even if no meds found
        await this.prescriptionUploadModel.updateOne(
          { _id: uploadId },
          {
            $set: {
              processing_status: 'COMPLETED',
              'ocr_data.raw_text': ocrData.rawText,
              'ocr_data.confidence': ocrData.confidence,
            },
          },
        );

        return {
          prescription_number: upload.prescription_number,
          confidence: ocrData.confidence || analysis?.confidence || 0,
          medications: [],
          message:
            'Could not extract any medications from this prescription. This can happen with very faint handwriting, low-resolution images, or documents where medications are not clearly listed. Try uploading a clearer photo or a different format.',
          prescription_readiness: this.buildReadinessChecks(
            analysis,
            ocrData,
            [],
          ),
        };
      }

      // Step 6: Match each medication against inventory
      const medications: any[] = [];
      let totalCost = { NGN: 0, USD: 0, GBP: 0, EUR: 0 };

      for (const med of rawMedications) {
        const match = await this.matchDrugToInventory(med.name);
        if (match) {
          const medResult = {
            name: med.name,
            prescribed_dosage: med.dosage,
            prescribed_quantity: med.quantity,
            instructions: med.instructions,
            in_inventory: true,
            ...match,
          };
          medications.push(medResult);

          // Add to total cost (using quantity if parseable, else 1)
          const qty = parseInt(med.quantity || '1', 10) || 1;
          if (match.prices.NGN) totalCost.NGN += match.prices.NGN * qty;
          if (match.prices.USD) totalCost.USD += match.prices.USD * qty;
          if (match.prices.GBP) totalCost.GBP += match.prices.GBP * qty;
          if (match.prices.EUR) totalCost.EUR += match.prices.EUR * qty;
        } else {
          medications.push({
            name: med.name,
            prescribed_dosage: med.dosage,
            prescribed_quantity: med.quantity,
            instructions: med.instructions,
            in_inventory: false,
            matched_drug_id: null,
            matched_drug_name: null,
          });
        }
      }

      // Round totals
      totalCost = {
        NGN: Math.round(totalCost.NGN * 100) / 100,
        USD: Math.round(totalCost.USD * 100) / 100,
        GBP: Math.round(totalCost.GBP * 100) / 100,
        EUR: Math.round(totalCost.EUR * 100) / 100,
      };

      // Step 7: Build readiness checks
      const prescriptionReadiness = this.buildReadinessChecks(
        analysis,
        ocrData,
        medications,
      );

      // Step 8: Update upload record
      await this.prescriptionUploadModel.updateOne(
        { _id: uploadId },
        {
          $set: {
            processing_status: 'COMPLETED',
            'ocr_data.raw_text': ocrData.rawText,
            'ocr_data.confidence': ocrData.confidence,
            'ocr_data.doctor_name': analysis?.extractedData?.prescriber?.name || ocrData.doctorName,
            'ocr_data.patient_name': analysis?.extractedData?.patient?.name || ocrData.patientName,
            'ocr_data.prescription_date': analysis?.extractedData?.prescription?.date || ocrData.prescriptionDate,
            'ocr_data.medications': rawMedications,
            verified_medications: medications
              .filter((m) => m.in_inventory)
              .map((m) => ({
                prescription_medication_name: m.name,
                matched_drug_id: m.matched_drug_id
                  ? new Types.ObjectId(m.matched_drug_id)
                  : null,
                matched_drug_name: m.matched_drug_name,
                matched_generic_name: m.matched_generic_name,
                dosage: m.prescribed_dosage,
                quantity: m.prescribed_quantity,
                instructions: m.instructions,
                is_valid: true,
              })),
          },
        },
      );

      const resultData = {
        prescription_number: upload.prescription_number,
        doctor_name:
          analysis?.extractedData?.prescriber?.name || ocrData.doctorName,
        prescription_date:
          analysis?.extractedData?.prescription?.date ||
          ocrData.prescriptionDate,
        confidence: ocrData.confidence || analysis?.confidence || 0,
        medications,
        total_estimated_cost: totalCost,
        prescription_readiness: prescriptionReadiness,
        patient_summary: analysis?.patientSummary,
      };

      return {
        ...resultData,
        __artifact: {
          type: 'prescription_analysis',
          data: resultData,
        },
      };
    } catch (e) {
      this.logger.error(
        `[Eka Prescription Analysis] Failed: ${e.message}`,
        e.stack,
      );
      return {
        error:
          'Failed to analyze the prescription. Please try uploading a clearer image.',
      };
    }
  }

  private async toolAnalyzeExistingPrescription(
    userId: Types.ObjectId,
    prescriptionId: string,
    source: string,
  ) {
    if (!prescriptionId) {
      return { error: 'No prescription ID provided.' };
    }

    let rawMedications: Array<{
      name: string;
      dosage?: string;
      quantity?: string;
      instructions?: string;
    }> = [];
    let prescriptionNumber = '';
    let doctorName = '';
    let prescriptionDate: any = null;

    try {
      if (source === 'specialist') {
        const rx = await this.specialistPrescriptionModel
          .findOne({ _id: prescriptionId, patient_id: userId })
          .lean();

        if (!rx) {
          return { error: 'Specialist prescription not found.' };
        }

        prescriptionNumber = rx.prescription_number || '';
        doctorName = rx.specialist_name || '';
        prescriptionDate = rx.created_at;

        for (const item of rx.items || []) {
          rawMedications.push({
            name: item.drug_name || item.name,
            dosage: item.drug_strength || item.dosage,
            quantity: String(item.quantity || ''),
            instructions: [item.dosage, item.frequency, item.duration]
              .filter(Boolean)
              .join(', '),
          });
        }
      } else {
        // uploaded
        const upload = await this.prescriptionUploadModel
          .findOne({
            _id: prescriptionId,
            patient: userId,
            is_deleted: { $ne: true },
          })
          .lean();

        if (!upload) {
          return { error: 'Uploaded prescription not found.' };
        }

        prescriptionNumber = upload.prescription_number || '';
        doctorName = upload.ocr_data?.doctor_name || '';
        prescriptionDate =
          upload.ocr_data?.prescription_date || upload.created_at;

        // Use verified medications if available, else OCR data
        if (upload.verified_medications?.length) {
          for (const med of upload.verified_medications) {
            rawMedications.push({
              name:
                med.prescription_medication_name ||
                med.matched_drug_name ||
                '',
              dosage: med.dosage,
              quantity: med.quantity,
              instructions: med.instructions,
            });
          }
        } else if (upload.ocr_data?.medications?.length) {
          for (const med of upload.ocr_data.medications) {
            rawMedications.push({
              name: med.name,
              dosage: med.dosage,
              quantity: med.quantity,
              instructions: med.instructions,
            });
          }
        }
      }

      if (!rawMedications.length) {
        return {
          prescription_number: prescriptionNumber,
          message: 'No medications found in this prescription.',
        };
      }

      // Match each medication against inventory
      const medications: any[] = [];
      let totalCost = { NGN: 0, USD: 0, GBP: 0, EUR: 0 };

      for (const med of rawMedications) {
        const match = await this.matchDrugToInventory(med.name);
        if (match) {
          medications.push({
            name: med.name,
            prescribed_dosage: med.dosage,
            prescribed_quantity: med.quantity,
            instructions: med.instructions,
            in_inventory: true,
            ...match,
          });

          const qty = parseInt(med.quantity || '1', 10) || 1;
          if (match.prices.NGN) totalCost.NGN += match.prices.NGN * qty;
          if (match.prices.USD) totalCost.USD += match.prices.USD * qty;
          if (match.prices.GBP) totalCost.GBP += match.prices.GBP * qty;
          if (match.prices.EUR) totalCost.EUR += match.prices.EUR * qty;
        } else {
          medications.push({
            name: med.name,
            prescribed_dosage: med.dosage,
            prescribed_quantity: med.quantity,
            instructions: med.instructions,
            in_inventory: false,
            matched_drug_id: null,
            matched_drug_name: null,
          });
        }
      }

      totalCost = {
        NGN: Math.round(totalCost.NGN * 100) / 100,
        USD: Math.round(totalCost.USD * 100) / 100,
        GBP: Math.round(totalCost.GBP * 100) / 100,
        EUR: Math.round(totalCost.EUR * 100) / 100,
      };

      const resultData = {
        prescription_number: prescriptionNumber,
        source,
        doctor_name: doctorName,
        prescription_date: prescriptionDate,
        medications,
        total_estimated_cost: totalCost,
      };

      return {
        ...resultData,
        __artifact: {
          type: 'prescription_analysis',
          data: resultData,
        },
      };
    } catch (e) {
      this.logger.error(
        `[Eka Existing Prescription Analysis] Failed: ${e.message}`,
      );
      return { error: 'Failed to analyze this prescription. Please try again.' };
    }
  }

  // ============ CHECKUP PHASE MANAGEMENT ============

  async clearStaleCheckupPhases(userId: string) {
    await this.healthCheckupModel.updateMany(
      { user: new Types.ObjectId(userId), 'request.checkup_phase': { $in: ['awaiting_symptoms', 'awaiting_confirmation', 'interview'] } },
      { $set: { 'request.checkup_phase': null } },
    );
  }

  // ============ AVATAR SYMPTOM CRUD ============

  async addAvatarSymptom(sessionId: string, userId: string, symptom: { id: string; name: string; common_name: string }) {
    const checkup = await this.healthCheckupModel.findOne({
      _id: sessionId,
      user: new Types.ObjectId(userId),
      deleted_at: null,
    });

    if (!checkup) throw new NotFoundException('Health checkup session not found');

    const evidence = checkup.request?.evidence || [];
    if (!evidence.find((e: any) => e.id === symptom.id)) {
      evidence.push({
        id: symptom.id,
        choice_id: 'present',
        source: 'initial',
      });
      checkup.request = { ...checkup.request, evidence };
      checkup.markModified('request');
      await checkup.save();
    }

    return { success: true, evidence_count: evidence.length };
  }

  async removeAvatarSymptom(sessionId: string, userId: string, symptomId: string) {
    const checkup = await this.healthCheckupModel.findOne({
      _id: sessionId,
      user: new Types.ObjectId(userId),
      deleted_at: null,
    });

    if (!checkup) throw new NotFoundException('Health checkup session not found');

    const evidence = (checkup.request?.evidence || []).filter((e: any) => e.id !== symptomId);
    checkup.request = { ...checkup.request, evidence };
    checkup.markModified('request');
    await checkup.save();

    return { success: true, evidence_count: evidence.length };
  }

  // ============ CONVERSATION CRUD ============

  async getConversations(userId: string, tag?: string) {
    const filter: any = { user: new Types.ObjectId(userId), is_active: true };
    if (tag) filter.tags = tag;
    return this.conversationModel
      .find(filter)
      .sort({ updated_at: -1 })
      .select('title messages tags created_at updated_at')
      .lean()
      .then((convos) =>
        convos.map((c: any) => ({
          _id: c._id,
          title: c.title,
          tags: c.tags || [],
          message_count: c.messages?.length || 0,
          last_message: c.messages?.[c.messages.length - 1]?.content?.slice(0, 100),
          created_at: c.created_at,
          updated_at: c.updated_at,
        })),
      );
  }

  async getConversation(id: string, userId: string) {
    const convo = await this.conversationModel.findOne({
      _id: id,
      user: new Types.ObjectId(userId),
      is_active: true,
    }).lean();

    if (!convo) throw new NotFoundException('Conversation not found');
    return convo;
  }

  async renameConversation(id: string, userId: string, title: string) {
    const convo = await this.conversationModel.findOneAndUpdate(
      { _id: id, user: new Types.ObjectId(userId) },
      { title: (title || '').trim().slice(0, 100) },
      { new: true },
    );
    if (!convo) throw new NotFoundException('Conversation not found');
    return { _id: convo._id, title: convo.title };
  }

  async deleteConversation(id: string, userId: string) {
    const convo = await this.conversationModel.findOneAndUpdate(
      { _id: id, user: new Types.ObjectId(userId) },
      { is_active: false },
      { new: true },
    );
    if (!convo) throw new NotFoundException('Conversation not found');
    return { success: true };
  }

  // ============ TRIAL MODE ============
  // Credit-free, profile-free variants for unauthenticated trial users.

  async *chatForTrial(options: {
    message: string;
    firstName: string;
    messages: Array<{ role: string; content: string }>;
    messagesUsed: number;
    messageLimit: number;
    language?: string;
    systemUserId: string;
  }): AsyncGenerator<any> {
    if (!this.client) {
      yield { type: 'error', content: 'Eka is currently unavailable. Please try again later.' };
      return;
    }

    const { message, firstName, messages, messagesUsed, messageLimit, language, systemUserId } = options;

    // Build Claude messages from recent history
    const recentMessages = messages.slice(-MAX_CONTEXT_MESSAGES);
    const claudeMessages: Anthropic.MessageParam[] = recentMessages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));
    claudeMessages.push({ role: 'user', content: message });

    this.logger.log(`[Trial Chat] user=${firstName}, messages_in_context=${claudeMessages.length}, msg="${message}"`);

    // Detect active health checkup for the system user
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const lastUserMessage = (message || '').toLowerCase();
    const isStartingNewCheckup = /\b(start|begin|new|do|want)\b.*\b(checkup|check[\s-]?up|health check)\b/.test(lastUserMessage)
      || /\bhealth checkup\b/.test(lastUserMessage);

    const uid = new Types.ObjectId(systemUserId);
    if (isStartingNewCheckup) {
      await this.healthCheckupModel.updateMany(
        { user: uid, 'request.checkup_phase': { $in: ['awaiting_symptoms', 'awaiting_confirmation', 'interview'] } },
        { $set: { 'request.checkup_phase': null } },
      );
    }

    const activeCheckup = isStartingNewCheckup ? null : await this.healthCheckupModel.findOne({
      user: uid,
      deleted_at: null,
      'request.checkup_phase': { $in: ['awaiting_symptoms', 'awaiting_confirmation', 'interview'] },
      created_at: { $gte: twoHoursAgo },
    });
    const activeCheckupPhase: string | null = activeCheckup?.request?.checkup_phase || null;

    // Stream with trial tool loop
    let fullResponse = '';
    const toolsUsed: string[] = [];

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        fullResponse = yield* this.streamWithToolsTrial(
          claudeMessages, firstName, systemUserId, toolsUsed,
          messagesUsed, messageLimit, language, activeCheckupPhase,
        );
        break;
      } catch (error: any) {
        const isOverloaded = error?.message?.includes('overloaded') || error?.message?.includes('Overloaded') || error?.error?.type === 'overloaded_error';
        if (isOverloaded && attempt < 2) {
          this.logger.warn(`Trial Eka overloaded (attempt ${attempt + 1}/3), retrying in ${(attempt + 1) * 2}s...`);
          await new Promise((r) => setTimeout(r, (attempt + 1) * 2000));
          continue;
        }
        this.logger.error('Trial Eka chat error:', error);
        yield { type: 'error', content: "I'm sorry, I ran into an issue. Please try again in a moment." };
        return;
      }
    }

    yield { type: 'done', assistantText: fullResponse, toolsUsed };
  }

  private async *streamWithToolsTrial(
    messages: Anthropic.MessageParam[],
    firstName: string,
    systemUserId: string,
    toolsUsed: string[],
    messagesUsed: number,
    messageLimit: number,
    language?: string,
    activeCheckupPhase?: string | null,
  ): AsyncGenerator<any, string> {
    let currentMessages = [...messages];
    let fullResponse = '';
    let textOnlyNextRound = false;
    let forceToolNextRound: string | null = null;

    for (let round = 0; round < 5; round++) {
      const apiParams: any = {
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: buildTrialSystemPrompt(firstName, messagesUsed, messageLimit, language),
        messages: currentMessages,
      };

      if (textOnlyNextRound) {
        this.logger.log('Trial: Checkup tool returned — text-only round');
      } else {
        apiParams.tools = EKA_TRIAL_TOOLS;

        if (forceToolNextRound) {
          apiParams.tool_choice = { type: 'tool', name: forceToolNextRound };
          this.logger.log(`Trial: Forcing tool_choice: ${forceToolNextRound} (auto-chain)`);
          forceToolNextRound = null;
        } else if (activeCheckupPhase && round === 0) {
          if (activeCheckupPhase === 'awaiting_symptoms') {
            apiParams.tool_choice = { type: 'tool', name: 'submit_checkup_symptoms' };
            this.logger.log('Trial: Forcing tool_choice: submit_checkup_symptoms');
          } else if (activeCheckupPhase === 'awaiting_confirmation' || activeCheckupPhase === 'interview') {
            apiParams.tool_choice = { type: 'tool', name: 'run_checkup_interview' };
            this.logger.log(`Trial: Forcing tool_choice: run_checkup_interview (phase: ${activeCheckupPhase})`);
          }
        }
      }

      const stream = this.client!.messages.stream(apiParams);

      let toolCalls: { id: string; name: string; input: any }[] = [];
      let currentToolId = '';
      let currentToolName = '';
      let currentToolInput = '';
      let stopReason = '';

      for await (const event of stream) {
        if (event.type === 'content_block_start') {
          if (event.content_block.type === 'tool_use') {
            currentToolId = event.content_block.id;
            currentToolName = event.content_block.name;
            currentToolInput = '';
            yield { type: 'tool_start', tool: currentToolName };
          }
        } else if (event.type === 'content_block_delta') {
          if (event.delta.type === 'text_delta') {
            fullResponse += event.delta.text;
            yield { type: 'text', content: event.delta.text };
          } else if (event.delta.type === 'input_json_delta') {
            currentToolInput += event.delta.partial_json;
          }
        } else if (event.type === 'content_block_stop') {
          if (currentToolId) {
            let parsedInput = {};
            try {
              parsedInput = currentToolInput ? JSON.parse(currentToolInput) : {};
            } catch {}
            toolCalls.push({ id: currentToolId, name: currentToolName, input: parsedInput });
            currentToolId = '';
            currentToolName = '';
            currentToolInput = '';
          }
        } else if (event.type === 'message_delta') {
          stopReason = (event as any).delta?.stop_reason || '';
        }
      }

      // No tool calls → done
      if (toolCalls.length === 0 || stopReason !== 'tool_use') {
        return fullResponse;
      }

      // Execute tool calls
      for (const tc of toolCalls) {
        toolsUsed.push(tc.name);
      }

      // Slow tool loading animation
      const SLOW_TOOLS = ['check_drug_interactions', 'generate_checkup_report'];
      const slowToolName = toolCalls.find((tc) => SLOW_TOOLS.includes(tc.name))?.name;

      let toolResults: { id: string; name: string; result: any }[];

      if (slowToolName) {
        yield { type: 'clear_artifact' };

        let toolsDone = false;
        const toolPromise = Promise.all(
          toolCalls.map(async (tc) => {
            const result = await this.executeToolForTrial(tc.name, tc.input, systemUserId);
            return { id: tc.id, name: tc.name, result };
          }),
        );
        toolPromise.then(() => { toolsDone = true; }).catch(() => { toolsDone = true; });

        const loadingMessages = this.getLoadingMessages(slowToolName);
        for (const msg of loadingMessages) {
          if (toolsDone) break;
          for (const char of msg) {
            if (toolsDone) break;
            yield { type: 'text', content: char };
            await new Promise((r) => setTimeout(r, 30));
          }
          if (!toolsDone) {
            yield { type: 'text', content: '\n\n' };
            await new Promise((r) => setTimeout(r, 800));
          }
        }

        if (!toolsDone) {
          const waitMsg = 'Just a moment more...';
          for (const char of waitMsg) {
            if (toolsDone) break;
            yield { type: 'text', content: char };
            await new Promise((r) => setTimeout(r, 35));
          }
        }

        toolResults = await toolPromise;
        yield { type: 'clear_loading' };
      } else {
        toolResults = await Promise.all(
          toolCalls.map(async (tc) => {
            const result = await this.executeToolForTrial(tc.name, tc.input, systemUserId);
            return { id: tc.id, name: tc.name, result };
          }),
        );
      }

      // Emit tool_done + artifact + checkup question events
      for (const tr of toolResults) {
        yield { type: 'tool_done', tool: tr.name };
        if (tr.result?.__artifact) {
          yield { type: 'artifact', artifact_type: tr.result.__artifact.type, data: tr.result.__artifact.data };
        }
        if (tr.name === 'run_checkup_interview' && tr.result?.status === 'in_progress' && tr.result?.question) {
          yield { type: 'checkup_question', question: tr.result.question };
        }
        if (tr.name === 'submit_checkup_symptoms' && tr.result?.suggestions?.length > 0) {
          yield {
            type: 'checkup_question',
            question: {
              text: 'Do any of these also apply to you?',
              type: 'group_multiple',
              items: tr.result.suggestions,
            },
          };
        }
      }

      // Contextual suggestions (skip during active checkup)
      const isCheckupInProgress = toolResults.some(
        (tr) =>
          tr.name === 'start_health_checkup' ||
          tr.name === 'submit_checkup_symptoms' ||
          (tr.name === 'run_checkup_interview' && tr.result?.status === 'in_progress'),
      );
      if (!isCheckupInProgress) {
        const allSuggestions: Array<{ label: string; message: string }> = [];
        for (const tr of toolResults) {
          const toolInput = toolCalls.find((tc) => tc.id === tr.id)?.input;
          const sug = this.buildContextualSuggestions(tr.name, toolInput, tr.result);
          allSuggestions.push(...sug);
        }
        if (allSuggestions.length > 0) {
          const unique = allSuggestions
            .filter((s, i, arr) => arr.findIndex((x) => x.message === s.message) === i)
            .slice(0, 4);
          yield { type: 'suggestions', suggestions: unique };
        }
      }

      // Control flow for next round
      for (const tr of toolResults) {
        if (tr.name === 'submit_checkup_symptoms') {
          textOnlyNextRound = true;
        }
        if (tr.name === 'run_checkup_interview' && tr.result?.status === 'in_progress') {
          textOnlyNextRound = true;
        }
        if (tr.name === 'run_checkup_interview' && tr.result?.status === 'completed') {
          textOnlyNextRound = false;
          forceToolNextRound = 'generate_checkup_report';
          this.logger.log('Trial: Interview completed — will auto-chain generate_checkup_report');
        }
        if (tr.name === 'generate_checkup_report' && !tr.result?.error) {
          textOnlyNextRound = true;
        }
        // Recovery write tools → text-only to present conversational summary
        if (['start_screening', 'submit_screening', 'run_coping_exercise'].includes(tr.name)) {
          textOnlyNextRound = true;
        }
      }

      // Build tool result messages for next round
      const assistantContent: any[] = [];
      if (fullResponse) {
        assistantContent.push({ type: 'text', text: fullResponse });
      }
      for (const tc of toolCalls) {
        assistantContent.push({ type: 'tool_use', id: tc.id, name: tc.name, input: tc.input });
      }

      const toolResultContent: any[] = toolResults.map((tr) => {
        let resultForClaude = Array.isArray(tr.result)
          ? [...tr.result]
          : { ...tr.result };
        if (!Array.isArray(resultForClaude)) {
          delete resultForClaude.__artifact;
        }
        resultForClaude = this.cleanToolResult(resultForClaude);

        const toolInput = toolCalls.find((tc) => tc.id === tr.id)?.input;
        const label = this.getToolResultLabel(tr.name, toolInput);
        const content = `[TOOL RESULT: ${label}]\n${JSON.stringify(resultForClaude)}`;

        return {
          type: 'tool_result',
          tool_use_id: tr.id,
          content,
        };
      });

      currentMessages = [
        ...currentMessages,
        { role: 'assistant', content: assistantContent },
        { role: 'user', content: toolResultContent },
      ];

      toolCalls = [];
      fullResponse = '';
    }

    return fullResponse;
  }

  private async executeToolForTrial(name: string, input: any, systemUserId: string): Promise<any> {
    const uid = new Types.ObjectId(systemUserId);

    switch (name) {
      case 'search_pharmacy':
        return this.toolSearchPharmacy(input.query, input.limit || 10);
      case 'check_drug_interactions':
        return this.toolCheckDrugInteractionsTrial(input.drugs);
      case 'start_health_checkup':
        return this.toolStartHealthCheckupTrial(uid, input.age, input.gender);
      case 'submit_checkup_symptoms':
        return this.toolSubmitCheckupSymptoms(uid, input.session_id, input.symptoms_text);
      case 'run_checkup_interview':
        return this.toolRunCheckupInterview(uid, input.session_id, input);
      case 'generate_checkup_report':
        return this.toolGenerateCheckupReportTrial(uid, input.session_id);
      // Recovery tools (stateless — no user data needed)
      case 'start_screening':
        return this.toolStartScreening(input.instrument);
      case 'submit_screening':
        return this.toolSubmitScreeningTrial(input.instrument, input.answers, input.duration_ms);
      case 'run_coping_exercise':
        return this.toolRunCopingExercise(input.exercise_type);
      case 'mark_exercise_step':
        return this.toolMarkExerciseStep(input.step_number);
      case 'complete_exercise':
        return this.toolCompleteExercise(input.exercise_type, input.outcome);
      default:
        return { error: 'This feature requires a full Rapid Capsule account. Sign up at rapidcapsule.com to unlock it!' };
    }
  }

  private async toolStartHealthCheckupTrial(userId: Types.ObjectId, age: number, gender: string) {
    if (!age || age < 12) return { error: 'Health checkups are available for ages 12 and above.' };
    if (age > 120) return { error: 'Please provide a valid age.' };

    const sex = gender === 'female' ? 'female' : 'male';

    // Clear stale checkup phases
    await this.healthCheckupModel.updateMany(
      { user: userId, 'request.checkup_phase': { $in: ['awaiting_symptoms', 'awaiting_confirmation', 'interview'] } },
      { $set: { 'request.checkup_phase': null } },
    );

    const interview_token = new Types.ObjectId().toString();

    const checkup = await this.healthCheckupModel.create({
      user: userId,
      health_check_for: 'Self',
      checkup_owner_id: userId,
      interview_token,
      request: {
        sex,
        age: { value: age },
        evidence: [],
        checkup_phase: 'awaiting_symptoms',
      },
    });

    let riskFactors: any[] = [];
    try {
      const infermedica = new Infermedica(interview_token);
      const response = await infermedica.getRiskFactors(age);
      riskFactors = response?.data || [];
    } catch (e) {
      this.logger.warn('Trial: Failed to get risk factors:', e.message);
    }

    return {
      session_id: checkup._id.toString(),
      interview_token,
      patient: {
        age,
        gender: sex,
        medical_history: [],
        health_risk_factors: [],
      },
      risk_factors: riskFactors.map((rf: any) => ({
        id: rf.id,
        name: rf.name,
        common_name: rf.common_name || rf.name,
      })),
      __artifact: {
        type: 'health_checkup_start',
        data: {
          session_id: checkup._id.toString(),
          patient_gender: sex,
          patient_age: age,
        },
      },
    };
  }

  private async toolGenerateCheckupReportTrial(userId: Types.ObjectId, sessionId: string) {
    const checkup = await this.resolveCheckup(userId, sessionId, false);
    if (!checkup) return { error: 'Health checkup session not found.' };
    if (!checkup.response?.data) return { error: 'Health checkup is not yet complete. Please complete the interview first.' };

    // No credit check — free in trial mode

    const diagnosisData = {
      conditions: checkup.response.data.conditions || [],
      evidence: checkup.request?.evidence || [],
      triage_level: checkup.response.data.triage_level,
      has_emergency_evidence: checkup.response.data.has_emergency_evidence,
    };

    const patientInfo = {
      age: checkup.request?.age?.value || 0,
      gender: checkup.request?.sex || 'male',
    };

    const summary = await this.claudeHealthSummaryService.generateHealthSummary(
      diagnosisData,
      patientInfo,
    );

    // Store summary on checkup + clear phase
    checkup.claude_summary = {
      generated_at: summary.generated_at,
      model: summary.model,
      content: summary.content,
      error: summary.error,
    };
    if (checkup.request) {
      checkup.request = { ...checkup.request, checkup_phase: null };
      checkup.markModified('request');
    }
    checkup.markModified('claude_summary');
    await checkup.save();

    return {
      report: summary.content,
      triage_level: checkup.response.data.triage_level,
      conditions: (checkup.response.data.conditions || []).slice(0, 5).map((c: any) => ({
        name: c.common_name || c.name,
        probability: Math.round(c.probability * 100),
      })),
      credits_used: 0,
      __artifact: {
        type: 'health_checkup_report',
        data: {
          checkup_id: checkup._id.toString(),
          triage_level: checkup.response.data.triage_level,
          conditions: (checkup.response.data.conditions || []).slice(0, 8).map((c: any) => ({
            name: c.common_name || c.name,
            probability: Math.round(c.probability * 100),
          })),
          report: summary.content,
          patient: patientInfo,
          date: new Date().toISOString(),
        },
      },
    };
  }

  private async toolCheckDrugInteractionsTrial(drugs: any[]) {
    if (!drugs || drugs.length < 2) {
      return { error: 'Please provide at least 2 medications to check for interactions.' };
    }
    if (drugs.length > 5) {
      return { error: 'You can check up to 5 medications at a time.' };
    }

    const validDrugs = drugs.filter((d: any) => d?.name?.trim());
    if (validDrugs.length < 2) {
      return { error: 'Please provide at least 2 valid drug names.' };
    }

    // No credit check — free in trial mode

    try {
      const result = await this.claudeAIService.checkDrugInteractionsDetailed(
        validDrugs.map((d: any) => ({
          name: d.name.trim(),
          dose: d.dose?.trim() || undefined,
          route: d.route?.trim() || undefined,
        })),
      );

      const drugNames = validDrugs.map((d: any) => d.name.trim());

      return {
        ...result,
        drugs_checked: drugNames,
        credits_used: 0,
        __artifact: {
          type: 'drug_interaction_report',
          data: {
            ...result,
            drugs_checked: drugNames,
          },
        },
      };
    } catch (e) {
      this.logger.error('Trial drug interaction check failed:', e.message);
      return { error: 'Failed to check drug interactions. Please try again.' };
    }
  }

  // ============ RECOVERY TOOL HANDLERS ============

  private async toolGetRecoveryProfile(userId: Types.ObjectId) {
    const profile = await this.recoveryProfileModel.findOne({
      user: userId,
      status: { $ne: 'archived' },
      deleted_at: { $exists: false },
    }).lean();

    if (!profile) {
      return { message: 'You are not enrolled in the recovery programme. Visit the Recovery section to get started.', enrolled: false };
    }

    const sobrietyDays = (profile as any).sobriety_start_date
      ? Math.max(0, Math.floor((Date.now() - new Date((profile as any).sobriety_start_date).getTime()) / 86400000))
      : 0;

    const substances = ((profile as any).substance_use_history || []).map((s: any) => ({
      substance: s.substance,
      is_primary: s.is_primary,
      use_frequency: s.use_frequency,
      years_of_use: s.years_of_use,
    }));

    const totalMilestones = await this.recoveryMilestoneModel.countDocuments({ user: userId });

    return {
      enrolled: true,
      status: (profile as any).status,
      sobriety_days: sobrietyDays,
      sobriety_start_date: (profile as any).sobriety_start_date,
      substances,
      risk_level: (profile as any).current_risk_level || 'low',
      care_level: (profile as any).care_level || 'outpatient',
      motivation_level: (profile as any).motivation_level,
      total_milestones_earned: totalMilestones,
      enrollment_date: (profile as any).created_at,
    };
  }

  private async toolGetRecoveryDashboard(userId: Types.ObjectId) {
    const profile = await this.recoveryProfileModel.findOne({
      user: userId,
      status: 'active',
      deleted_at: { $exists: false },
    }).lean();

    if (!profile) {
      return { message: 'You are not enrolled in the recovery programme.', enrolled: false };
    }

    const sobrietyDays = (profile as any).sobriety_start_date
      ? Math.max(0, Math.floor((Date.now() - new Date((profile as any).sobriety_start_date).getTime()) / 86400000))
      : 0;

    const primarySubstance = ((profile as any).substance_use_history || []).find((s: any) => s.is_primary)?.substance || 'substances';

    // Mood + craving trends (last 14 days)
    const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000);
    const logs = await this.sobrietyLogModel
      .find({ user: userId, log_date: { $gte: fourteenDaysAgo } })
      .sort({ log_date: 1 })
      .lean();

    const moodTrend = logs.filter((l: any) => l.mood_score != null).map((l: any) => ({
      date: new Date(l.log_date).toISOString().split('T')[0],
      value: l.mood_score,
    }));
    const cravingTrend = logs.filter((l: any) => l.craving_intensity != null).map((l: any) => ({
      date: new Date(l.log_date).toISOString().split('T')[0],
      value: l.craving_intensity,
    }));

    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayCheckedIn = logs.some((l: any) => new Date(l.log_date) >= todayStart);

    // Next milestone
    const nextMs = getNextSobrietyMilestone(sobrietyDays);
    const nextMilestone = nextMs ? {
      name: nextMs.name,
      days_required: nextMs.value,
      days_remaining: nextMs.value - sobrietyDays,
    } : null;

    // Recent milestones (last 5)
    const recentMilestones = await this.recoveryMilestoneModel
      .find({ user: userId })
      .sort({ achieved_at: -1 })
      .limit(5)
      .lean();

    // Latest screening
    const latestScreening = await this.addictionScreeningModel
      .findOne({ user: userId, status: 'completed' })
      .sort({ completed_at: -1 })
      .lean();

    const dashboardData = {
      sobriety_days: sobrietyDays,
      sobriety_start_date: (profile as any).sobriety_start_date,
      primary_substance: primarySubstance,
      risk_level: (profile as any).current_risk_level || 'low',
      care_level: (profile as any).care_level || 'outpatient',
      today_checked_in: todayCheckedIn,
      mood_trend: moodTrend,
      craving_trend: cravingTrend,
      next_milestone: nextMilestone,
      recent_milestones: recentMilestones.map((m: any) => ({
        name: m.name,
        icon: m.icon || '🏆',
        points: m.points || 0,
        achieved_at: m.achieved_at,
      })),
      latest_screening: latestScreening ? {
        instrument: (latestScreening as any).instrument,
        score: (latestScreening as any).total_score,
        max_score: (latestScreening as any).max_possible_score,
        risk_level: (latestScreening as any).risk_zone?.level,
        date: (latestScreening as any).completed_at,
      } : null,
    };

    return {
      ...dashboardData,
      __artifact: { type: 'recovery_dashboard', data: dashboardData },
    };
  }

  private async toolGetSobrietyStats(userId: Types.ObjectId) {
    const profile = await this.recoveryProfileModel.findOne({
      user: userId,
      status: 'active',
      deleted_at: { $exists: false },
    }).lean();

    if (!profile) {
      return { message: 'You are not enrolled in the recovery programme.', enrolled: false };
    }

    const sobrietyDays = (profile as any).sobriety_start_date
      ? Math.max(0, Math.floor((Date.now() - new Date((profile as any).sobriety_start_date).getTime()) / 86400000))
      : 0;

    const milestones = await this.recoveryMilestoneModel
      .find({ user: userId, milestone_type: 'sobriety_days' })
      .sort({ achieved_at: -1 })
      .lean();

    const nextMs = getNextSobrietyMilestone(sobrietyDays);
    const totalPoints = milestones.reduce((sum: number, m: any) => sum + (m.reward_points || 0), 0);

    return {
      current_streak_days: sobrietyDays,
      sobriety_start_date: (profile as any).sobriety_start_date,
      milestones_earned: milestones.length,
      total_points: totalPoints,
      latest_milestone: milestones[0] ? {
        name: (milestones[0] as any).milestone_name,
        achieved_at: (milestones[0] as any).achieved_at,
      } : null,
      next_milestone: nextMs ? {
        name: nextMs.name,
        days_required: nextMs.value,
        days_remaining: nextMs.value - sobrietyDays,
        points: nextMs.points,
      } : null,
    };
  }

  private async toolGetDailyLogs(userId: Types.ObjectId, days: number) {
    const since = new Date(Date.now() - days * 86400000);
    const logs = await this.sobrietyLogModel
      .find({ user: userId, log_date: { $gte: since } })
      .sort({ log_date: -1 })
      .lean();

    if (!logs.length) {
      return { message: `No daily logs found in the last ${days} days.`, logs: [] };
    }

    return {
      count: logs.length,
      period_days: days,
      logs: logs.map((l: any) => ({
        date: new Date(l.log_date).toISOString().split('T')[0],
        sober_today: l.sober_today,
        mood_score: l.mood_score,
        craving_intensity: l.craving_intensity,
        sleep_quality: l.sleep_quality,
        triggers_encountered: l.triggers_encountered,
        notes: l.notes,
      })),
    };
  }

  private async toolGetScreeningHistory(userId: Types.ObjectId, instrument?: string, limit = 5) {
    const query: any = { user: userId, deleted_at: { $exists: false } };
    if (instrument) query.instrument = instrument;

    const screenings = await this.addictionScreeningModel
      .find(query)
      .sort({ created_at: -1 })
      .limit(limit)
      .lean();

    if (!screenings.length) {
      return { message: 'No screenings found.', screenings: [] };
    }

    const maxScores: Record<string, number> = { audit: 40, dast10: 10, cage: 4, assist: 39 };
    return {
      count: screenings.length,
      screenings: screenings.map((s: any) => ({
        instrument: s.instrument,
        total_score: s.total_score,
        max_score: maxScores[s.instrument] || 40,
        risk_level: s.risk_level,
        risk_zone_label: s.risk_zone_label,
        date: s.created_at,
        is_baseline: s.is_baseline,
      })),
    };
  }

  private async toolGetRecoveryPlan(userId: Types.ObjectId) {
    const plan = await this.recoveryPlanModel.findOne({
      user: userId,
      status: 'active',
      deleted_at: { $exists: false },
    }).lean();

    if (!plan) {
      return { message: 'No active recovery plan found. Ask your care team or start one in the Recovery section.' };
    }

    return {
      stage_of_change: (plan as any).stage_of_change,
      goals: (plan as any).goals,
      relapse_prevention: (plan as any).relapse_prevention,
      coping_strategies: (plan as any).coping_strategies,
      support_network: (plan as any).support_network,
      created_at: (plan as any).created_at,
      updated_at: (plan as any).updated_at,
    };
  }

  private async toolGetRiskAssessment(userId: Types.ObjectId, recalculate?: boolean, conversationId?: Types.ObjectId) {
    try {
      const userIdStr = userId.toString();
      let result: any;

      // Always recalculate fresh when patient explicitly asks for their risk
      // Use cached only if recalculate is explicitly false AND a recent score exists
      if (recalculate !== false) {
        await this.riskScoringService.calculateAndPersistRisk(userIdStr);
      }

      // Get the full breakdown (includes top_factors, trend, signals)
      result = await this.riskScoringService.getRiskBreakdown(userIdStr);

      if (!result || result.score === undefined || result.score === null) {
        return { message: 'No recovery profile found. Complete a screening first to get started.' };
      }

      // Get risk history for trend sparkline
      const history = await this.riskScoringService.getRiskHistory(userIdStr, 7);

      const suggestions = this.getRiskSuggestions(result.level);

      // Persist the risk assessment report
      const report = await this.riskAssessmentReportModel.create({
        user: userId,
        score: result.score,
        level: result.level,
        categories: result.signals,
        top_factors: result.top_factors || [],
        trend: result.trend || null,
        history: history || [],
        conversation_id: conversationId || undefined,
        suggestions,
        previous_score: result.previous_score,
        previous_level: result.previous_level,
      });

      const artifactData = {
        report_id: report._id.toString(),
        score: result.score,
        level: result.level,
        updated_at: result.updated_at || new Date(),
        categories: result.signals,
        top_factors: result.top_factors || [],
        trend: result.trend || null,
        history: history || [],
        suggestions,
      };

      return {
        score: result.score,
        level: result.level,
        report_id: report._id.toString(),
        top_factors: (result.top_factors || []).slice(0, 5),
        trend_direction: result.trend?.direction || 'stable',
        __artifact: {
          type: 'risk_assessment',
          data: artifactData,
        },
      };
    } catch (error) {
      this.logger.error('Failed to get risk assessment:', error);
      return { error: 'Unable to calculate risk assessment at this time.' };
    }
  }

  private async toolRefineRiskAssessment(
    userId: Types.ObjectId,
    input: { updates: Record<string, any>; context_summary: string },
    conversationId?: Types.ObjectId,
  ) {
    try {
      const updates = input.updates || {};
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      // Build $set — only include fields that were provided
      const setFields: Record<string, any> = {};
      if (updates.mood_score != null) setFields.mood_score = Math.min(10, Math.max(1, updates.mood_score));
      if (updates.craving_intensity != null) setFields.craving_intensity = Math.min(10, Math.max(0, updates.craving_intensity));
      if (updates.anxiety_level != null) setFields.anxiety_level = Math.min(10, Math.max(1, updates.anxiety_level));
      if (updates.sleep_quality != null) setFields.sleep_quality = Math.min(10, Math.max(1, updates.sleep_quality));
      if (updates.sleep_hours != null) setFields.sleep_hours = Math.max(0, updates.sleep_hours);
      if (updates.energy_level != null) setFields.energy_level = Math.min(10, Math.max(1, updates.energy_level));
      if (updates.medications_taken != null) setFields.medications_taken = updates.medications_taken;
      if (updates.exercised != null) setFields.exercised = updates.exercised;
      if (updates.attended_meeting_or_session != null) setFields.attended_meeting_or_session = updates.attended_meeting_or_session;
      if (updates.notes) setFields.notes = updates.notes;

      // Arrays — $addToSet to merge, not overwrite
      const addToSetFields: Record<string, any> = {};
      if (updates.triggers_encountered?.length) {
        addToSetFields.triggers_encountered = { $each: updates.triggers_encountered };
      }
      if (updates.substances_craved?.length) {
        addToSetFields.substances_craved = { $each: updates.substances_craved };
      }

      // Upsert today's sobriety log with the refined data
      const updateOp: any = {};
      if (Object.keys(setFields).length) updateOp.$set = setFields;
      if (Object.keys(addToSetFields).length) updateOp.$addToSet = addToSetFields;

      if (Object.keys(updateOp).length > 0) {
        await this.sobrietyLogModel.findOneAndUpdate(
          { user: userId, log_date: { $gte: todayStart } },
          { ...updateOp, $setOnInsert: { user: userId, log_date: new Date(), sober_today: true } },
          { upsert: true, new: true },
        );
      }

      // Emit event for real-time updates
      this.eventEmitter.emit('recovery.checkin_logged', { userId: userId.toString() });

      // Recalculate risk score with the new data
      const userIdStr = userId.toString();
      const calcResult = await this.riskScoringService.calculateAndPersistRisk(userIdStr);

      if (!calcResult) {
        return { message: 'Unable to recalculate risk — no recovery profile found.' };
      }

      // Get full breakdown (includes top_factors, trend)
      const breakdown = await this.riskScoringService.getRiskBreakdown(userIdStr);
      const history = await this.riskScoringService.getRiskHistory(userIdStr, 7);
      const suggestions = this.getRiskSuggestions(calcResult.level);

      // Persist the refined report
      const report = await this.riskAssessmentReportModel.create({
        user: userId,
        score: calcResult.score,
        level: calcResult.level,
        categories: calcResult.signals,
        top_factors: breakdown?.top_factors || [],
        trend: breakdown?.trend || null,
        history: history || [],
        context_summary: input.context_summary,
        conversation_id: conversationId || undefined,
        suggestions,
        previous_score: calcResult.previous_score,
        previous_level: calcResult.previous_level,
      });

      // Extract conversation responses (follow-up Q&A) for the artifact
      let responses: { role: string; content: string }[] = [];
      if (conversationId) {
        try {
          const conversation = await this.conversationModel
            .findById(conversationId)
            .select('messages')
            .lean();
          if (conversation?.messages) {
            // Find the last risk_assessment tool call and extract messages after it
            const msgs = conversation.messages as any[];
            let lastToolIdx = -1;
            for (let i = msgs.length - 1; i >= 0; i--) {
              if (msgs[i].role === 'assistant' && msgs[i].tool_calls?.some((tc: any) => tc.function?.name === 'get_risk_assessment')) {
                lastToolIdx = i;
                break;
              }
            }
            // Grab user/assistant messages after the initial risk assessment tool call
            if (lastToolIdx >= 0) {
              responses = msgs
                .slice(lastToolIdx + 1)
                .filter((m: any) => (m.role === 'user' || m.role === 'assistant') && m.content)
                .map((m: any) => ({ role: m.role, content: m.content }));
            }
          }
        } catch (convErr) {
          this.logger.warn('Could not extract risk assessment conversation:', convErr);
        }
      }

      const artifactData = {
        report_id: report._id.toString(),
        score: calcResult.score,
        level: calcResult.level,
        updated_at: new Date(),
        categories: calcResult.signals,
        top_factors: breakdown?.top_factors || [],
        trend: breakdown?.trend || null,
        history: history || [],
        suggestions,
        context_summary: input.context_summary,
        responses: responses.length > 0 ? responses : undefined,
      };

      return {
        refined: true,
        score: calcResult.score,
        level: calcResult.level,
        report_id: report._id.toString(),
        previous_score: calcResult.previous_score,
        fields_updated: Object.keys(setFields).concat(Object.keys(addToSetFields)),
        __artifact: {
          type: 'risk_assessment',
          data: artifactData,
        },
      };
    } catch (error) {
      this.logger.error('Failed to refine risk assessment:', error);
      return { error: 'Unable to refine risk assessment at this time.' };
    }
  }

  private getRiskSuggestions(level: string): { text: string; action?: string }[] {
    const suggestions: { text: string; action?: string }[] = [];

    switch (level) {
      case 'critical':
        suggestions.push(
          { text: 'Contact your care team now', action: 'book_appointment' },
          { text: 'Call a crisis line (116 123)', action: 'crisis' },
          { text: 'Do a grounding exercise', action: 'coping_exercise' },
        );
        break;
      case 'high':
        suggestions.push(
          { text: 'Book an appointment with your specialist', action: 'book_appointment' },
          { text: 'Try a coping exercise', action: 'coping_exercise' },
          { text: 'Talk to Eka about what\'s going on', action: 'chat' },
        );
        break;
      case 'moderate':
        suggestions.push(
          { text: 'Do a coping exercise', action: 'coping_exercise' },
          { text: 'Log your daily check-in', action: 'recovery_checkin' },
          { text: 'Review your recovery plan', action: 'recovery_plan' },
        );
        break;
      default: // low
        suggestions.push(
          { text: 'Keep up the good work!', action: 'recovery' },
          { text: 'Log your daily check-in', action: 'recovery_checkin' },
          { text: 'View your milestones', action: 'recovery' },
        );
    }
    return suggestions;
  }

  private async toolLogDailyCheckin(userId: Types.ObjectId, input: any) {
    // Check if already logged today
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const existing = await this.sobrietyLogModel.findOne({
      user: userId,
      log_date: { $gte: todayStart },
    });
    if (existing) {
      return { message: 'You have already completed your daily check-in today. Come back tomorrow!', already_logged: true };
    }

    const soberValue = input.sober_today === false || input.sober_today === 'false' || input.sober_today === 'no' ? false : true;
    const logData: any = {
      user: userId,
      log_date: new Date(),
      sober_today: soberValue,
      mood_score: Math.min(10, Math.max(1, input.mood_score || 5)),
    };
    if (input.craving_intensity != null) logData.craving_intensity = Math.min(10, Math.max(0, input.craving_intensity));
    if (input.sleep_quality != null) logData.sleep_quality = Math.min(10, Math.max(1, input.sleep_quality));
    if (input.sleep_hours != null) logData.sleep_hours = input.sleep_hours;
    if (input.energy_level != null) logData.energy_level = Math.min(10, Math.max(1, input.energy_level));
    if (input.anxiety_level != null) logData.anxiety_level = Math.min(10, Math.max(1, input.anxiety_level));
    if (input.triggers_encountered?.length) logData.triggers_encountered = input.triggers_encountered;
    if (input.coping_strategies_used?.length) logData.coping_strategies_used = input.coping_strategies_used;
    if (input.medications_taken != null) logData.medications_taken = input.medications_taken;
    if (input.exercised != null) logData.exercised = input.exercised;
    if (input.attended_meeting_or_session != null) logData.attended_meeting_or_session = input.attended_meeting_or_session;
    if (input.substances_craved?.length) logData.substances_craved = input.substances_craved;
    if (input.gratitude_note) logData.gratitude_note = input.gratitude_note;
    if (input.notes) logData.notes = input.notes;
    if (!logData.sober_today && input.relapse_details) logData.relapse_details = input.relapse_details;

    const log = await this.sobrietyLogModel.create(logData);

    // Check and award milestones
    const profile = await this.recoveryProfileModel.findOne({ user: userId, status: 'active' }).lean();
    let newMilestone: any = null;
    if (profile && (profile as any).sobriety_start_date) {
      const sobrietyDays = Math.max(0, Math.floor((Date.now() - new Date((profile as any).sobriety_start_date).getTime()) / 86400000));
      const matchingMs = SOBRIETY_MILESTONES.find(m => m.value === sobrietyDays);
      if (matchingMs) {
        const alreadyEarned = await this.recoveryMilestoneModel.findOne({
          user: userId,
          milestone_type: 'sobriety_days',
          milestone_value: matchingMs.value,
        });
        if (!alreadyEarned) {
          newMilestone = await this.recoveryMilestoneModel.create({
            user: userId,
            milestone_type: 'sobriety_days',
            milestone_name: matchingMs.name,
            milestone_value: matchingMs.value,
            reward_points: matchingMs.points || 0,
            celebration_message: matchingMs.message,
            achieved_at: new Date(),
          });
        }
      }
    }

    // Fetch yesterday's log for comparison
    const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const yesterdayLog = await this.sobrietyLogModel.findOne({
      user: userId,
      log_date: { $gte: yesterdayStart, $lt: todayStart },
    }).lean() as any;

    // Calculate streak (consecutive sober days up to today)
    const recentForStreak = await this.sobrietyLogModel
      .find({ user: userId, sober_today: true })
      .sort({ log_date: -1 })
      .limit(30)
      .select('log_date')
      .lean();
    let soberStreak = 1; // counting today
    const streakCheck = new Date(todayStart); streakCheck.setDate(streakCheck.getDate() - 1);
    for (const sl of recentForStreak as any[]) {
      const slDay = new Date(sl.log_date); slDay.setHours(0, 0, 0, 0);
      if (slDay.getTime() === streakCheck.getTime()) {
        soberStreak++;
        streakCheck.setDate(streakCheck.getDate() - 1);
      } else if (slDay.getTime() < streakCheck.getTime()) {
        break;
      }
    }

    // Build comparison data
    const comparison: any = {};
    if (yesterdayLog) {
      comparison.yesterday_mood = yesterdayLog.mood_score;
      comparison.mood_change = (log as any).mood_score - (yesterdayLog.mood_score || 0);
      if (yesterdayLog.craving_intensity != null && (log as any).craving_intensity != null) {
        comparison.yesterday_craving = yesterdayLog.craving_intensity;
        comparison.craving_change = (log as any).craving_intensity - yesterdayLog.craving_intensity;
      }
      if (yesterdayLog.sleep_quality && (log as any).sleep_quality) {
        comparison.yesterday_sleep_quality = yesterdayLog.sleep_quality;
      }
      if (yesterdayLog.triggers_encountered?.length) {
        comparison.yesterday_triggers = yesterdayLog.triggers_encountered;
      }
    }

    // Emit events for risk engine recalculation
    this.eventEmitter.emit('recovery.checkin_logged', { userId: userId.toString() });
    if (!logData.sober_today) {
      this.eventEmitter.emit('recovery.relapse_reported', { userId: userId.toString() });
    }

    // Build a refreshed dashboard artifact so the right pane auto-updates
    const dashboardResult = await this.toolGetRecoveryDashboard(userId);

    return {
      logged: true,
      log_date: log.log_date,
      mood_score: (log as any).mood_score,
      craving_intensity: (log as any).craving_intensity,
      sober_today: (log as any).sober_today,
      sleep_quality: (log as any).sleep_quality,
      sleep_hours: (log as any).sleep_hours,
      triggers: (log as any).triggers_encountered || [],
      coping_strategies: (log as any).coping_strategies_used || [],
      gratitude_note: (log as any).gratitude_note,
      // Comparison with yesterday
      comparison,
      sober_streak_days: logData.sober_today ? soberStreak : 0,
      new_milestone: newMilestone ? {
        name: newMilestone.milestone_name,
        points: newMilestone.reward_points,
        message: newMilestone.celebration_message,
      } : null,
      // Attach dashboard artifact so right pane refreshes
      __artifact: (dashboardResult as any).__artifact,
    };
  }

  private toolStartScreening(instrument: string) {
    const instruments: Record<string, any> = { audit: AUDIT, dast10: DAST10, cage: CAGE, assist: ASSIST };
    const inst = instruments[instrument?.toLowerCase()];
    if (!inst) {
      return { error: `Unknown screening instrument: ${instrument}. Available: AUDIT, DAST-10, CAGE, ASSIST.` };
    }

    return {
      instrument: inst.id,
      instrument_name: inst.name,
      description: inst.description,
      estimated_minutes: inst.estimated_minutes,
      total_questions: inst.questions.length,
      questions: inst.questions.map((q: any) => ({
        id: q.id,
        text: q.text,
        help_text: q.help_text,
        options: q.options,
      })),
    };
  }

  private async toolSubmitScreening(userId: Types.ObjectId, instrument: string, answers: Record<string, number>, durationMs?: number) {
    const instruments: Record<string, any> = { audit: AUDIT, dast10: DAST10, cage: CAGE, assist: ASSIST };
    const inst = instruments[instrument?.toLowerCase()];
    if (!inst) {
      return { error: `Unknown instrument: ${instrument}` };
    }

    // Score the answers
    let totalScore = 0;
    const questionScores: Record<string, number> = {};
    for (const q of inst.questions) {
      const val = answers[q.id] ?? 0;
      questionScores[q.id] = val;
      totalScore += val;
    }

    // Calculate subscales if defined
    const subscaleScores: Record<string, number> = {};
    if (inst.scoring.subscales) {
      for (const [name, qIds] of Object.entries(inst.scoring.subscales) as [string, string[]][]) {
        subscaleScores[name] = qIds.reduce((s, qid) => s + (questionScores[qid] || 0), 0);
      }
    }

    // Determine risk zone
    const riskZone = inst.risk_zones.find((z: any) => totalScore >= z.min_score && totalScore <= z.max_score);

    // Get previous score for comparison
    const previousScreening = await this.addictionScreeningModel
      .findOne({ user: userId, instrument: inst.id, status: 'completed' })
      .sort({ completed_at: -1 })
      .lean();
    const previousScore = previousScreening ? (previousScreening as any).total_score : null;

    // Check if baseline
    const isBaseline = !previousScreening;

    // Generate AI interpretation using Haiku
    let aiInterpretation: any = null;
    try {
      if (this.client) {
        const interpretPrompt = `You are a clinical recovery AI. Interpret the following screening result for a patient.
Instrument: ${inst.name}
Score: ${totalScore} / ${inst.scoring.max_score}
Risk Zone: ${riskZone?.label || 'Unknown'} (${riskZone?.level || 'unknown'})
${previousScore != null ? `Previous Score: ${previousScore}` : 'This is their baseline screening.'}
${Object.keys(subscaleScores).length ? `Subscale Scores: ${JSON.stringify(subscaleScores)}` : ''}

Respond in JSON with these fields:
- summary (1-2 sentences)
- risk_assessment (1-2 sentences about what the risk level means)
- recommended_interventions (array of 2-4 brief action items)
- motivational_message (1 encouraging sentence)
${previousScore != null ? '- comparison_to_previous (1 sentence comparing scores)' : ''}`;

        const response = await this.client.messages.create({
          model: MODEL,
          max_tokens: 600,
          messages: [{ role: 'user', content: interpretPrompt }],
        });
        const text = (response.content[0] as any).text || '';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          aiInterpretation = JSON.parse(jsonMatch[0]);
        }
      }
    } catch (err) {
      this.logger.warn('Failed to generate screening AI interpretation:', err.message);
    }

    // Save to database
    const screening = await this.addictionScreeningModel.create({
      user: userId,
      instrument: inst.id,
      screening_type: 'self',
      answers: questionScores,
      total_score: totalScore,
      subscale_scores: subscaleScores,
      risk_level: riskZone?.level || 'low',
      risk_zone_label: riskZone?.label || 'Unknown',
      is_baseline: isBaseline,
      ai_interpretation: aiInterpretation,
      duration_ms: durationMs,
    });

    // Emit event for risk engine recalculation
    this.eventEmitter.emit('recovery.screening_completed', {
      userId: userId.toString(),
      screeningId: screening._id.toString(),
    });

    const reportData = {
      instrument: inst.id,
      instrument_name: inst.name,
      total_score: totalScore,
      max_score: inst.scoring.max_score,
      risk_level: riskZone?.level || 'unknown',
      risk_zone_label: riskZone?.label,
      colour: riskZone?.colour,
      recommendation: riskZone?.recommendation,
      risk_zones: inst.risk_zones,
      subscale_scores: subscaleScores,
      ai_interpretation: aiInterpretation,
      previous_score: previousScore,
      is_baseline: isBaseline,
      date: new Date().toISOString(),
    };

    return {
      screening_id: screening._id,
      ...reportData,
      __artifact: { type: 'screening_report', data: reportData },
    };
  }

  private async toolRunCopingExercise(exerciseType: string, userId?: Types.ObjectId) {
    const exercise = getExercise(exerciseType);
    if (!exercise) {
      // Return available exercises so Claude can suggest one
      const available = THERAPEUTIC_EXERCISES.map(e => ({
        id: e.id,
        name: e.name,
        category: e.category,
        when_to_use: e.when_to_use,
        estimated_minutes: e.estimated_minutes,
      }));
      return {
        error: `Exercise "${exerciseType}" not found.`,
        available_exercises: available,
      };
    }

    const exerciseData = {
      exercise_id: exercise.id,
      name: exercise.name,
      category: exercise.category,
      description: exercise.description,
      estimated_minutes: exercise.estimated_minutes,
      steps: exercise.steps,
      evidence_base: exercise.evidence_base,
    };

    // Persist to DB for authenticated users
    if (userId) {
      try {
        // Find the active conversation this exercise is in
        const activeConv = await this.conversationModel
          .findOne({ user: userId, is_active: true })
          .sort({ updated_at: -1 })
          .select('_id')
          .lean();

        await this.copingExerciseSessionModel.create({
          user: userId,
          ...exerciseData,
          source: 'eka',
          conversation_id: activeConv?._id || undefined,
        });
      } catch (err) {
        this.logger.error('Failed to persist coping exercise session:', err);
      }
    }

    return {
      ...exerciseData,
      instructions: 'IMPORTANT: As you guide the patient through each step, call mark_exercise_step(step_number) after each step is done. When the exercise is complete, call complete_exercise with a summary.',
      __artifact: { type: 'coping_exercise', data: exerciseData },
    };
  }

  private async toolMarkExerciseStep(stepNumber: number, userId?: Types.ObjectId) {
    // Persist step to DB for authenticated users
    if (userId) {
      try {
        await this.copingExerciseSessionModel.findOneAndUpdate(
          { user: userId, deleted_at: { $exists: false } },
          { $addToSet: { completed_steps: stepNumber } },
          { sort: { created_at: -1 } },
        );
      } catch (err) {
        this.logger.error('Failed to persist exercise step:', err);
      }
    }

    return {
      marked: true,
      step: stepNumber,
      __artifact: {
        type: 'exercise_step_update',
        data: { step: stepNumber },
      },
    };
  }

  private async toolCompleteExercise(exerciseType: string, outcome: string, userId?: Types.ObjectId) {
    const exercise = getExercise(exerciseType);
    const totalSteps = exercise ? exercise.steps.length : 7;
    const allSteps = Array.from({ length: totalSteps }, (_, i) => i + 1);
    const completedAt = new Date();

    // Persist completion + extract conversation responses for authenticated users
    if (userId) {
      try {
        const updateData: any = {
          completed: true,
          completed_steps: allSteps,
          outcome,
          completed_at: completedAt,
        };

        // Find the exercise session to get conversation_id and created_at
        const session = await this.copingExerciseSessionModel
          .findOne({ user: userId, exercise_id: exerciseType, deleted_at: { $exists: false } })
          .sort({ created_at: -1 })
          .select('conversation_id created_at')
          .lean();

        // Extract conversation messages from the exercise period
        if (session?.conversation_id) {
          try {
            const conversation = await this.conversationModel
              .findById(session.conversation_id)
              .select('messages')
              .lean();

            if (conversation?.messages) {
              // 60s buffer to capture the user message that triggered the exercise
              const exerciseStart = new Date(new Date(session.created_at).getTime() - 60000);
              const exerciseMessages = conversation.messages
                .filter((m: any) => new Date(m.created_at) >= exerciseStart)
                .map((m: any) => ({ role: m.role, content: m.content }));

              if (exerciseMessages.length > 0) {
                updateData.responses = exerciseMessages;
              }
            }
          } catch (convErr) {
            this.logger.warn('Could not extract exercise conversation:', convErr);
          }
        }

        await this.copingExerciseSessionModel.findOneAndUpdate(
          { user: userId, exercise_id: exerciseType, deleted_at: { $exists: false } },
          updateData,
          { sort: { created_at: -1 } },
        );

        // Emit event for risk engine recalculation
        this.eventEmitter.emit('recovery.coping_exercise_completed', {
          userId: userId.toString(),
        });
      } catch (err) {
        this.logger.error('Failed to persist exercise completion:', err);
      }
    }

    return {
      completed: true,
      exercise_type: exerciseType,
      outcome,
      __artifact: {
        type: 'exercise_complete',
        data: {
          exercise_type: exerciseType,
          completed_steps: allSteps,
          completed: true,
          outcome,
          completed_at: completedAt.toISOString(),
        },
      },
    };
  }

  // ============ TRIAL-SPECIFIC RECOVERY HANDLERS ============

  private async toolSubmitScreeningTrial(instrument: string, answers: Record<string, number>, durationMs?: number) {
    const instruments: Record<string, any> = { audit: AUDIT, dast10: DAST10, cage: CAGE, assist: ASSIST };
    const inst = instruments[instrument?.toLowerCase()];
    if (!inst) {
      return { error: `Unknown instrument: ${instrument}` };
    }

    // Score the answers
    let totalScore = 0;
    const questionScores: Record<string, number> = {};
    for (const q of inst.questions) {
      const val = answers[q.id] ?? 0;
      questionScores[q.id] = val;
      totalScore += val;
    }

    // Calculate subscales
    const subscaleScores: Record<string, number> = {};
    if (inst.scoring.subscales) {
      for (const [name, qIds] of Object.entries(inst.scoring.subscales) as [string, string[]][]) {
        subscaleScores[name] = qIds.reduce((s, qid) => s + (questionScores[qid] || 0), 0);
      }
    }

    // Determine risk zone
    const riskZone = inst.risk_zones.find((z: any) => totalScore >= z.min_score && totalScore <= z.max_score);

    // AI interpretation
    let aiInterpretation: any = null;
    try {
      if (this.client) {
        const interpretPrompt = `You are a clinical recovery AI. Interpret the following screening result.
Instrument: ${inst.name}
Score: ${totalScore} / ${inst.scoring.max_score}
Risk Zone: ${riskZone?.label || 'Unknown'} (${riskZone?.level || 'unknown'})
This is a trial user's first screening (baseline).
${Object.keys(subscaleScores).length ? `Subscale Scores: ${JSON.stringify(subscaleScores)}` : ''}

Respond in JSON with these fields:
- summary (1-2 sentences)
- risk_assessment (1-2 sentences about what the risk level means)
- recommended_interventions (array of 2-4 brief action items)
- motivational_message (1 encouraging sentence)`;

        const response = await this.client.messages.create({
          model: MODEL,
          max_tokens: 600,
          messages: [{ role: 'user', content: interpretPrompt }],
        });
        const text = (response.content[0] as any).text || '';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          aiInterpretation = JSON.parse(jsonMatch[0]);
        }
      }
    } catch (err) {
      this.logger.warn('Trial screening AI interpretation failed:', err.message);
    }

    // NOT saved to DB in trial mode
    const reportData = {
      instrument: inst.id,
      instrument_name: inst.name,
      total_score: totalScore,
      max_score: inst.scoring.max_score,
      risk_level: riskZone?.level || 'unknown',
      risk_zone_label: riskZone?.label,
      colour: riskZone?.colour,
      recommendation: riskZone?.recommendation,
      risk_zones: inst.risk_zones,
      subscale_scores: subscaleScores,
      ai_interpretation: aiInterpretation,
      previous_score: null,
      is_baseline: true,
      date: new Date().toISOString(),
    };

    return {
      ...reportData,
      trial_mode: true,
      __artifact: { type: 'screening_report', data: reportData },
    };
  }
}
