import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  RecoveryJournal,
  RecoveryJournalDocument,
  JournalEntryType,
} from '../entities/recovery-journal.entity';
import {
  RecoveryProfile,
  RecoveryProfileDocument,
} from '../entities/recovery-profile.entity';
import {
  SobrietyLog,
  SobrietyLogDocument,
} from '../entities/sobriety-log.entity';
import Anthropic from '@anthropic-ai/sdk';

@Injectable()
export class RecoveryCompanionService {
  private readonly logger = new Logger(RecoveryCompanionService.name);
  private client: Anthropic | null = null;
  private readonly MAX_DAILY_MESSAGES = 20;

  constructor(
    @InjectModel(RecoveryJournal.name)
    private journalModel: Model<RecoveryJournalDocument>,
    @InjectModel(RecoveryProfile.name)
    private profileModel: Model<RecoveryProfileDocument>,
    @InjectModel(SobrietyLog.name)
    private sobrietyLogModel: Model<SobrietyLogDocument>,
  ) {
    this.initClaude();
  }

  private initClaude() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey) {
      try {
        this.client = new Anthropic({ apiKey });
      } catch (error) {
        this.logger.error('Failed to initialise Claude client:', error);
      }
    }
  }

  /**
   * Start a new companion conversation session.
   */
  async startConversation(userId: string, context?: string) {
    if (!this.client) {
      return { error: 'AI companion service is not available' };
    }

    // Rate limit check
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayMessageCount = await this.journalModel.countDocuments({
      user: new Types.ObjectId(userId),
      entry_type: JournalEntryType.COMPANION_CHAT,
      created_at: { $gte: todayStart },
    });

    if (todayMessageCount >= this.MAX_DAILY_MESSAGES) {
      return {
        rate_limited: true,
        message:
          'You\'ve reached your daily companion sessions limit. Remember, your counsellor and peer supporter are always here for deeper conversations.',
      };
    }

    // Build patient context
    const patientContext = await this.buildPatientContext(userId);

    // Generate opening message
    const greeting = this.generateGreeting(patientContext);

    // Create journal entry for this session
    const journal = await this.journalModel.create({
      user: new Types.ObjectId(userId),
      entry_type: JournalEntryType.COMPANION_CHAT,
      structured_data: {
        conversation_messages: [
          {
            role: 'assistant',
            content: greeting,
            timestamp: new Date(),
          },
        ],
        crisis_detected: false,
        escalated_to_human: false,
      },
      risk_level_at_entry: patientContext.risk_level,
    });

    // Increment companion session count
    await this.profileModel.updateOne(
      { user: new Types.ObjectId(userId) },
      { $inc: { 'outcomes.companion_sessions_count': 1 } },
    );

    return {
      session_id: journal._id,
      greeting,
      patient_context: {
        sobriety_days: patientContext.sobriety_days,
        risk_level: patientContext.risk_level,
      },
    };
  }

  /**
   * Send a message in an active companion session.
   */
  async sendMessage(sessionId: string, message: string, userId: string) {
    if (!this.client) {
      return { error: 'AI companion service is not available' };
    }

    const journal = await this.journalModel.findOne({
      _id: new Types.ObjectId(sessionId),
      user: new Types.ObjectId(userId),
      entry_type: JournalEntryType.COMPANION_CHAT,
    });

    if (!journal) {
      throw new NotFoundException('Companion session not found');
    }

    // Append user message
    const messages = journal.structured_data?.conversation_messages || [];
    messages.push({
      role: 'user',
      content: message,
      timestamp: new Date(),
    });

    // Build context for Claude
    const patientContext = await this.buildPatientContext(userId);
    const systemPrompt = this.buildSystemPrompt(patientContext);

    // Build message history for Claude (system + conversation)
    const claudeMessages = messages.map((m: any) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    try {
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 800,
        system: systemPrompt,
        messages: claudeMessages,
      });

      const textContent = response.content.find(
        (block) => block.type === 'text',
      );
      const assistantMessage = textContent?.type === 'text'
        ? textContent.text
        : 'I\'m here for you. Could you tell me more about how you\'re feeling?';

      // Check for crisis signals in the response
      const crisisDetected = this.detectCrisisInResponse(
        message,
        assistantMessage,
      );

      // Append assistant message
      messages.push({
        role: 'assistant',
        content: assistantMessage,
        timestamp: new Date(),
      });

      // Update journal
      await this.journalModel.updateOne(
        { _id: journal._id },
        {
          $set: {
            'structured_data.conversation_messages': messages,
            'structured_data.crisis_detected': crisisDetected,
          },
        },
      );

      return {
        session_id: sessionId,
        response: assistantMessage,
        crisis_detected: crisisDetected,
        message_count: messages.length,
      };
    } catch (error) {
      this.logger.error('Companion message error:', error);
      return {
        session_id: sessionId,
        response:
          'I\'m having trouble responding right now. If you\'re in crisis, please tap the crisis button or call the Samaritans on 116 123.',
        error: true,
      };
    }
  }

  /**
   * End a companion session and generate summary.
   */
  async endConversation(sessionId: string, userId: string) {
    const journal = await this.journalModel.findOne({
      _id: new Types.ObjectId(sessionId),
      user: new Types.ObjectId(userId),
      entry_type: JournalEntryType.COMPANION_CHAT,
    });

    if (!journal) {
      throw new NotFoundException('Companion session not found');
    }

    const messages = journal.structured_data?.conversation_messages || [];
    if (messages.length <= 1) {
      return { summary: 'Session ended before conversation began.' };
    }

    // Generate summary with Claude
    let summary = '';
    if (this.client && messages.length > 2) {
      try {
        const summaryResponse = await this.client.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 300,
          system:
            'Summarise this recovery companion conversation in 2-3 sentences. Focus on: main topic discussed, patient\'s emotional state, any coping strategies discussed, and any concerns noted. Write from a clinical perspective for the care team. Respond in plain text, not JSON.',
          messages: [
            {
              role: 'user',
              content: messages
                .map(
                  (m: any) =>
                    `${m.role === 'user' ? 'Patient' : 'Companion'}: ${m.content}`,
                )
                .join('\n'),
            },
          ],
        });

        const textBlock = summaryResponse.content.find(
          (b) => b.type === 'text',
        );
        summary = textBlock?.type === 'text' ? textBlock.text : '';
      } catch (error) {
        this.logger.error('Summary generation error:', error);
        summary = `Session with ${messages.length} messages. Manual review recommended.`;
      }
    }

    await this.journalModel.updateOne(
      { _id: journal._id },
      {
        $set: {
          'structured_data.conversation_summary': summary,
        },
      },
    );

    return { summary, message_count: messages.length };
  }

  /**
   * Get conversation history for a session.
   */
  async getConversation(sessionId: string, userId: string) {
    const journal = await this.journalModel
      .findOne({
        _id: new Types.ObjectId(sessionId),
        user: new Types.ObjectId(userId),
        entry_type: JournalEntryType.COMPANION_CHAT,
      })
      .lean();

    if (!journal) {
      throw new NotFoundException('Companion session not found');
    }

    return {
      session_id: journal._id,
      messages: journal.structured_data?.conversation_messages || [],
      summary: journal.structured_data?.conversation_summary,
      crisis_detected: journal.structured_data?.crisis_detected,
      created_at: (journal as any).created_at,
    };
  }

  /**
   * List recent companion sessions.
   */
  async getRecentSessions(userId: string, limit = 10) {
    return this.journalModel
      .find({
        user: new Types.ObjectId(userId),
        entry_type: JournalEntryType.COMPANION_CHAT,
        deleted_at: { $exists: false },
      })
      .sort({ created_at: -1 })
      .limit(limit)
      .select(
        'structured_data.conversation_summary structured_data.crisis_detected created_at',
      )
      .lean();
  }

  // ─── Private Methods ─────────────────────────────────────────────

  private async buildPatientContext(userId: string) {
    const profile = await this.profileModel
      .findOne({ user: new Types.ObjectId(userId) })
      .lean();

    const recentLogs = await this.sobrietyLogModel
      .find({ user: new Types.ObjectId(userId) })
      .sort({ log_date: -1 })
      .limit(3)
      .lean();

    const sobrietyDays = profile?.sobriety_start_date
      ? Math.max(
          0,
          Math.floor(
            (Date.now() -
              new Date(profile.sobriety_start_date).getTime()) /
              (1000 * 60 * 60 * 24),
          ),
        )
      : 0;

    const primarySubstance = profile?.substance_use_history?.find(
      (s: any) => s.is_primary,
    );

    const recentMood =
      recentLogs.length > 0
        ? recentLogs.reduce((sum: number, l: any) => sum + (l.mood_score || 5), 0) /
          recentLogs.length
        : 5;

    return {
      first_name: 'there', // Will be enriched when we have user data access
      sobriety_days: sobrietyDays,
      primary_substance: primarySubstance?.substance || 'substances',
      risk_level: profile?.current_risk_level || 'low',
      recent_mood: Math.round(recentMood * 10) / 10,
      recent_craving:
        recentLogs[0]?.craving_intensity ?? 0,
      care_level: profile?.care_level || 'outpatient',
    };
  }

  private buildSystemPrompt(context: any): string {
    return `You are a supportive recovery companion for someone in addiction recovery. Your role is:

1. LISTEN empathetically without judgement
2. VALIDATE their feelings and experiences
3. GUIDE them through evidence-based coping exercises when appropriate
4. DETECT crisis signals and escalate when needed
5. NEVER act as a replacement for clinical care
6. NEVER suggest specific medications or diagnoses
7. ALWAYS encourage them to speak with their recovery specialist for clinical concerns

THERAPEUTIC TECHNIQUES YOU CAN USE:
- CBT thought challenging ("Let's examine that thought...")
- Urge surfing ("Let's ride this craving wave together...")
- 5-4-3-2-1 grounding ("Name 5 things you can see...")
- Deep breathing exercises
- Motivational interviewing reflections
- Gratitude practice

CRISIS DETECTION — Flag immediately if user mentions:
- Active suicidal ideation or self-harm
- Overdose (current or recent)
- Severe withdrawal symptoms (seizure, hallucinations)
- Immediate danger to self or others

When crisis is detected, respond with:
1. Empathetic acknowledgement
2. "I want to make sure you're safe. Please use the crisis button in the app, or call Samaritans on 116 123."

CONTEXT:
- Recovery day count: ${context.sobriety_days}
- Primary substance: ${context.primary_substance}
- Current risk level: ${context.risk_level}
- Recent average mood (1-10): ${context.recent_mood}
- Last reported craving intensity (0-10): ${context.recent_craving}
- Care level: ${context.care_level}

Keep responses warm, concise (2-4 sentences), and conversational. Use British English.`;
  }

  private generateGreeting(context: any): string {
    const hour = new Date().getHours();
    const timeOfDay =
      hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

    if (context.sobriety_days <= 7) {
      return `Good ${timeOfDay}. These early days take real courage — day ${context.sobriety_days} is something to be proud of. How are you feeling right now?`;
    }

    if (context.recent_craving >= 7) {
      return `Good ${timeOfDay}. I can see from your recent check-ins that cravings have been intense. That takes strength to sit with. Would you like to talk about what's been going on, or would a coping exercise help right now?`;
    }

    if (context.recent_mood <= 3) {
      return `Good ${timeOfDay}. It looks like things have been tough recently. I'm here to listen — no judgement, just support. What's on your mind?`;
    }

    return `Good ${timeOfDay}. Day ${context.sobriety_days} — you're doing this. How are things today?`;
  }

  private detectCrisisInResponse(
    userMessage: string,
    assistantResponse: string,
  ): boolean {
    const crisisKeywords = [
      'kill myself',
      'want to die',
      'end my life',
      'suicide',
      'self-harm',
      'cutting myself',
      'overdose',
      'overdosed',
      'took too much',
      'can\'t go on',
      'no reason to live',
      'better off dead',
    ];

    const lowerMessage = userMessage.toLowerCase();
    return crisisKeywords.some((keyword) => lowerMessage.includes(keyword));
  }
}
