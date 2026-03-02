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

  /**
   * Get a personalised daily check-in prompt based on recovery stage,
   * recent trends, and time since last check-in.
   */
  async getDailyCheckInPrompt(userId: string) {
    const profile = await this.profileModel
      .findOne({
        user: new Types.ObjectId(userId),
        deleted_at: { $exists: false },
      })
      .lean();

    const lastLog = await this.sobrietyLogModel
      .findOne({ user: new Types.ObjectId(userId) })
      .sort({ log_date: -1 })
      .lean();

    const sobrietyDays = profile?.sobriety_start_date
      ? Math.max(
          0,
          Math.floor(
            (Date.now() - new Date(profile.sobriety_start_date).getTime()) /
              (1000 * 60 * 60 * 24),
          ),
        )
      : 0;

    const daysSinceLastLog = lastLog
      ? Math.floor(
          (Date.now() - new Date((lastLog as any).log_date).getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : null;

    const recentLogs = await this.sobrietyLogModel
      .find({ user: new Types.ObjectId(userId) })
      .sort({ log_date: -1 })
      .limit(7)
      .lean();

    // Calculate recent trends
    const avgMood =
      recentLogs.length > 0
        ? recentLogs.reduce((sum, l: any) => sum + (l.mood_score || 5), 0) /
          recentLogs.length
        : null;
    const avgCraving =
      recentLogs.length > 0
        ? recentLogs.reduce(
            (sum, l: any) => sum + (l.craving_intensity || 0),
            0,
          ) / recentLogs.length
        : null;

    // Build personalised prompt
    let greeting: string;
    let prompt: string;
    let focusArea: string;

    if (daysSinceLastLog === null || daysSinceLastLog > 3) {
      greeting = "Welcome back! We've missed hearing from you.";
      prompt =
        "It's been a while since your last check-in. No judgement — today is a fresh start. How are you feeling right now?";
      focusArea = 'reconnection';
    } else if (sobrietyDays <= 7) {
      greeting = `Day ${sobrietyDays} — every hour counts.`;
      prompt =
        'Early recovery takes real courage. How is your body feeling today? Any cravings or physical symptoms?';
      focusArea = 'early_recovery';
    } else if (sobrietyDays <= 30) {
      greeting = `${sobrietyDays} days strong.`;
      prompt =
        "You're building momentum. What's on your mind today? Are there any situations coming up that you want to prepare for?";
      focusArea = 'building_habits';
    } else if (avgCraving && avgCraving > 6) {
      greeting = "Let's check in — cravings have been high lately.";
      prompt =
        "Your recent logs show elevated cravings. That's important data, not a failure. What's been triggering them? Can we work on a coping strategy?";
      focusArea = 'craving_management';
    } else if (avgMood && avgMood < 4) {
      greeting = 'How are you doing today?';
      prompt =
        "Your mood has been lower recently. Recovery isn't just about substances — your mental health matters too. What would help you feel a bit better today?";
      focusArea = 'mood_support';
    } else {
      greeting = `Day ${sobrietyDays} — keep going.`;
      prompt =
        'How are you feeling today? Take a moment to reflect on something positive from the last 24 hours.';
      focusArea = 'maintenance';
    }

    return {
      greeting,
      prompt,
      focus_area: focusArea,
      sobriety_days: sobrietyDays,
      days_since_last_log: daysSinceLastLog,
      recent_trends: {
        avg_mood: avgMood ? Math.round(avgMood * 10) / 10 : null,
        avg_craving: avgCraving ? Math.round(avgCraving * 10) / 10 : null,
        log_count_7d: recentLogs.length,
      },
    };
  }

  /**
   * Get a text-based guided meditation/exercise personalised to recovery context.
   */
  async getGuidedMeditation(userId: string, durationMinutes = 5) {
    const profile = await this.profileModel
      .findOne({
        user: new Types.ObjectId(userId),
        deleted_at: { $exists: false },
      })
      .lean();

    const lastLog = await this.sobrietyLogModel
      .findOne({ user: new Types.ObjectId(userId) })
      .sort({ log_date: -1 })
      .lean();

    const cravingLevel = (lastLog as any)?.craving_intensity || 0;
    const anxietyLevel = (lastLog as any)?.anxiety_level || 0;

    // Select meditation type based on current state
    let meditationType: string;
    let title: string;

    if (cravingLevel >= 7) {
      meditationType = 'urge_surfing';
      title = 'Urge Surfing — Ride the Wave';
    } else if (anxietyLevel >= 7) {
      meditationType = 'progressive_muscle_relaxation';
      title = 'Progressive Muscle Relaxation';
    } else if (cravingLevel >= 4) {
      meditationType = 'grounding_5_4_3_2_1';
      title = '5-4-3-2-1 Grounding Exercise';
    } else {
      meditationType = 'body_scan';
      title = 'Recovery Body Scan';
    }

    const meditations = this.getMeditationScripts();
    const script = meditations[meditationType];

    return {
      title,
      type: meditationType,
      duration_minutes: durationMinutes,
      context: {
        selected_because:
          cravingLevel >= 7
            ? 'High craving intensity detected'
            : anxietyLevel >= 7
              ? 'High anxiety level detected'
              : cravingLevel >= 4
                ? 'Moderate craving level'
                : 'General wellbeing maintenance',
      },
      steps: script,
    };
  }

  private getMeditationScripts(): Record<
    string,
    Array<{ step: number; instruction: string; duration_seconds: number }>
  > {
    return {
      urge_surfing: [
        { step: 1, instruction: 'Find a comfortable position. Close your eyes if that feels safe. Take three slow, deep breaths.', duration_seconds: 30 },
        { step: 2, instruction: 'Notice the craving without trying to fight it. Where do you feel it in your body? Your chest? Your stomach? Your hands?', duration_seconds: 30 },
        { step: 3, instruction: 'Imagine the craving as a wave in the ocean. It rises, peaks, and always — always — falls. You are the surfer, observing the wave.', duration_seconds: 45 },
        { step: 4, instruction: 'Breathe into the sensation. Describe it to yourself: its size, its shape, its temperature. Stay curious, not fearful.', duration_seconds: 45 },
        { step: 5, instruction: 'Notice how the intensity shifts as you observe it. It may increase briefly — that is the peak of the wave. Keep breathing.', duration_seconds: 45 },
        { step: 6, instruction: 'Remind yourself: cravings are temporary. They pass whether you act on them or not. You have survived every craving so far.', duration_seconds: 30 },
        { step: 7, instruction: 'As the wave subsides, take three more deep breaths. Open your eyes when ready. You rode that wave.', duration_seconds: 30 },
      ],
      progressive_muscle_relaxation: [
        { step: 1, instruction: 'Sit or lie down comfortably. Close your eyes. Take five deep breaths, each one slower than the last.', duration_seconds: 30 },
        { step: 2, instruction: 'Clench your fists tightly for 5 seconds. Feel the tension. Now release completely. Notice the difference.', duration_seconds: 20 },
        { step: 3, instruction: 'Tense your forearms and biceps for 5 seconds. Hold... and release. Let your arms go completely limp.', duration_seconds: 20 },
        { step: 4, instruction: 'Raise your shoulders to your ears. Hold the tension for 5 seconds. Drop them. Feel the warmth spread.', duration_seconds: 20 },
        { step: 5, instruction: 'Scrunch your face tightly — squeeze your eyes, purse your lips. Hold for 5 seconds. Release and relax your jaw.', duration_seconds: 20 },
        { step: 6, instruction: 'Tighten your stomach muscles for 5 seconds. Release. Let your abdomen be soft and relaxed.', duration_seconds: 20 },
        { step: 7, instruction: 'Tense your legs — thighs, calves, feet — all at once. Hold for 5 seconds. Release completely.', duration_seconds: 20 },
        { step: 8, instruction: 'Scan your body from head to toe. Any remaining tension? Breathe into that area and release it.', duration_seconds: 30 },
        { step: 9, instruction: 'Rest in this relaxed state for a moment. You are safe. You are in control. Open your eyes when ready.', duration_seconds: 30 },
      ],
      grounding_5_4_3_2_1: [
        { step: 1, instruction: 'Take a deep breath. This exercise will connect you to the present moment using your five senses.', duration_seconds: 15 },
        { step: 2, instruction: '5 things you can SEE: Look around slowly. Name five things you can see right now. The colour of the wall, a pattern on the floor, light through a window...', duration_seconds: 45 },
        { step: 3, instruction: '4 things you can TOUCH: Feel the chair beneath you, the fabric of your clothes, the temperature of the air, the surface of the table...', duration_seconds: 40 },
        { step: 4, instruction: '3 things you can HEAR: Listen carefully. Traffic outside, the hum of a machine, your own breathing...', duration_seconds: 35 },
        { step: 5, instruction: '2 things you can SMELL: Take a slow breath through your nose. Coffee, soap, fresh air, the scent of your clothing...', duration_seconds: 30 },
        { step: 6, instruction: '1 thing you can TASTE: Notice the taste in your mouth. Toothpaste, water, the last thing you ate...', duration_seconds: 20 },
        { step: 7, instruction: 'Take three more deep breaths. You are here. You are present. The craving does not control this moment — you do.', duration_seconds: 25 },
      ],
      body_scan: [
        { step: 1, instruction: 'Lie down or sit comfortably. Close your eyes. Begin with three deep breaths, letting each exhale be longer than the inhale.', duration_seconds: 30 },
        { step: 2, instruction: 'Bring your attention to the top of your head. Notice any sensations — tingling, warmth, pressure. Just observe.', duration_seconds: 30 },
        { step: 3, instruction: 'Move your attention slowly down to your forehead, your eyes, your jaw. Let your face relax completely.', duration_seconds: 30 },
        { step: 4, instruction: 'Notice your neck and shoulders. These areas often hold stress. Breathe into them and allow them to soften.', duration_seconds: 30 },
        { step: 5, instruction: 'Scan down through your arms to your fingertips. Notice any sensation — warmth, tingling, heaviness. No need to change anything.', duration_seconds: 30 },
        { step: 6, instruction: 'Bring awareness to your chest and stomach. Notice the rise and fall of your breath. This is your body taking care of you.', duration_seconds: 30 },
        { step: 7, instruction: 'Move through your hips, thighs, knees, calves, and feet. Let each area relax as you bring attention to it.', duration_seconds: 30 },
        { step: 8, instruction: 'Now feel your whole body at once — connected, alive, present. In recovery, reconnecting with your body is an act of healing.', duration_seconds: 30 },
        { step: 9, instruction: 'Take three final deep breaths. When ready, gently open your eyes and return to the room.', duration_seconds: 20 },
      ],
    };
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
