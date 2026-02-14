import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import Anthropic from '@anthropic-ai/sdk';
import { EkaConversation, EkaConversationDocument } from './entities/eka-conversation.entity';
import { EkaChatDto } from './dto/eka.dto';
import { EKA_TOOLS, buildSystemPrompt } from './eka-tools';
import { Infermedica } from '../../common/external/infermedica/infermedica';
import { ClaudeHealthSummaryService } from '../health-checkup/services/claude-health-summary.service';
import { ClaudeSummaryCreditsService } from '../claude-summary-credits/claude-summary-credits.service';
import { ClaudeAIService } from '../pharmacy/services/claude-ai.service';

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
    private readonly claudeHealthSummaryService: ClaudeHealthSummaryService,
    private readonly claudeSummaryCreditsService: ClaudeSummaryCreditsService,
    private readonly claudeAIService: ClaudeAIService,
  ) {
    this.initializeClient();
  }

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
        fullResponse = yield* this.streamWithTools(claudeMessages, patientName, userId, toolsUsed, dto.language, activeCheckupPhase);
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
        system: buildSystemPrompt(patientName, language),
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
      const SLOW_TOOLS = ['check_drug_interactions', 'generate_checkup_report'];
      const slowToolName = toolCalls.find(tc => SLOW_TOOLS.includes(tc.name))?.name;

      let toolResults: { id: string; name: string; result: any }[];

      if (slowToolName) {
        // Clear stale artifact before starting a new slow tool (like health checkup clears stale phases)
        yield { type: 'clear_artifact' };

        let toolsDone = false;
        const toolPromise = Promise.all(
          toolCalls.map(async (tc) => {
            const result = await this.executeTool(tc.name, tc.input, userId);
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
            const result = await this.executeTool(tc.name, tc.input, userId);
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

      // After checkup tools return, go text-only so Haiku presents results conversationally
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
    };
    return messages[toolName] || ['Working on that for you...'];
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

  private async executeTool(name: string, input: any, userId: string): Promise<any> {
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
      default:
        return { error: `Unknown tool: ${name}` };
    }
  }

  // ============ TOOL HANDLERS ============
  // Each returns lean JSON with only essential fields

  private async toolGetVitals(userId: Types.ObjectId, limit: number) {
    const vitals = await this.vitalModel
      .find({ userId })
      .select('body_temp body_weight blood_pressure blood_sugar_level pulse_rate created_at')
      .lean();

    if (!vitals.length) return { message: 'No vital signs recorded yet.' };

    // Vitals are stored as arrays of readings per type per document
    // Flatten and return the most recent readings
    const result: any = {};

    for (const v of vitals as any[]) {
      if (v.blood_pressure?.length) {
        const readings = v.blood_pressure
          .filter((r: any) => r.value)
          .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, limit);
        result.blood_pressure = readings.map((r: any) => ({
          value: r.value,
          unit: r.unit || 'mmHg',
          date: r.updatedAt,
        }));
      }

      if (v.blood_sugar_level?.length) {
        const readings = v.blood_sugar_level
          .filter((r: any) => r.value)
          .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, limit);
        result.blood_sugar = readings.map((r: any) => ({
          value: r.value,
          unit: r.unit || 'mg/dL',
          date: r.updatedAt,
        }));
      }

      if (v.pulse_rate?.length) {
        const readings = v.pulse_rate
          .filter((r: any) => r.value)
          .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, limit);
        result.pulse_rate = readings.map((r: any) => ({
          value: r.value,
          unit: r.unit || 'bpm',
          date: r.updatedAt,
        }));
      }

      if (v.body_temp?.length) {
        const readings = v.body_temp
          .filter((r: any) => r.value)
          .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, limit);
        result.temperature = readings.map((r: any) => ({
          value: r.value,
          unit: r.unit || '°C',
          date: r.updatedAt,
        }));
      }

      if (v.body_weight?.length) {
        const readings = v.body_weight
          .filter((r: any) => r.value)
          .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, limit);
        result.weight = readings.map((r: any) => ({
          value: r.value,
          unit: r.unit || 'kg',
          date: r.updatedAt,
        }));
      }
    }

    if (Object.keys(result).length === 0) {
      return { message: 'Vital sign records exist but no readings have been logged yet.' };
    }

    return result;
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

  async getConversations(userId: string) {
    return this.conversationModel
      .find({ user: new Types.ObjectId(userId), is_active: true })
      .sort({ updated_at: -1 })
      .select('title messages created_at updated_at')
      .lean()
      .then((convos) =>
        convos.map((c: any) => ({
          _id: c._id,
          title: c.title,
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
}
