import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import Anthropic from '@anthropic-ai/sdk';

@Injectable()
export class EkaMemoryListener {
  private readonly logger = new Logger(EkaMemoryListener.name);
  private client: Anthropic | null = null;

  constructor(
    @InjectModel('EkaConversation') private conversationModel: Model<any>,
    @InjectModel('EkaPatientMemory') private patientMemoryModel: Model<any>,
    @InjectModel('User') private userModel: Model<any>,
  ) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey) this.client = new Anthropic({ apiKey });
  }

  @OnEvent('eka.memory_update')
  async handleMemoryUpdate(payload: {
    userId: string;
    conversationId: string;
    totalMessages: number;
  }) {
    if (!this.client) return;

    try {
      const { userId, conversationId, totalMessages } = payload;
      const uid = new Types.ObjectId(userId);

      // Load existing memory
      const existingMemory = await this.patientMemoryModel
        .findOne({ user: uid })
        .lean();

      // Load conversation messages (last 30 for extraction context)
      const conversation = await this.conversationModel
        .findById(conversationId)
        .lean();
      if (!conversation?.messages?.length) return;

      const recentMessages = conversation.messages.slice(-30);
      const conversationText = recentMessages
        .map(
          (m: any) =>
            `${m.role === 'user' ? 'Patient' : 'Eka'}: ${m.content}`,
        )
        .join('\n\n');

      // Build extraction prompt
      const extractionPrompt = this.buildExtractionPrompt(
        existingMemory,
        conversationText,
      );

      // Call Claude Haiku for extraction
      const response = await this.client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 800,
        messages: [{ role: 'user', content: extractionPrompt }],
      });

      const responseText = response.content
        .filter((b: any) => b.type === 'text')
        .map((b: any) => b.text)
        .join('');

      // Parse the structured response
      const parsed = this.parseExtractionResponse(responseText, existingMemory);

      // Upsert the memory document
      await this.patientMemoryModel.findOneAndUpdate(
        { user: uid },
        {
          $set: {
            summary: parsed.summary,
            key_facts: parsed.key_facts,
            preferences: parsed.preferences,
            message_count_at_last_update: totalMessages,
          },
          $inc: { conversation_count: 1 },
          $setOnInsert: { user: uid },
        },
        { upsert: true },
      );

      this.logger.log(
        `Memory updated for user ${userId}: ${parsed.key_facts.length} facts`,
      );
    } catch (error) {
      this.logger.error(`Memory extraction failed: ${error.message}`);
    }
  }

  private buildExtractionPrompt(
    existingMemory: any | null,
    conversationText: string,
  ): string {
    const existingSection = existingMemory
      ? `EXISTING MEMORY:
Summary: ${existingMemory.summary || '(none)'}
Key facts:
${(existingMemory.key_facts || []).map((f: string) => `- ${f}`).join('\n') || '(none)'}
Communication preferences: ${JSON.stringify(existingMemory.preferences || {})}`
      : 'EXISTING MEMORY: (first conversation — no prior memory)';

    return `You are a memory extraction system for Eka, an AI health companion. Your job is to read a conversation between Eka and a patient, then extract facts worth remembering for future conversations.

${existingSection}

CONVERSATION:
${conversationText}

INSTRUCTIONS:
Extract the following as JSON:
1. "summary": Updated 2-3 sentence summary of who this patient is (personality, situation, key context). Merge with existing summary if present. Keep under 100 words.
2. "new_facts": Array of new key facts learned in this conversation. Each fact should be a brief string (e.g. "works as a teacher", "has 2 kids named Sam and Alex", "main trigger is work stress", "box breathing works best for them"). Only include facts that are WORTH REMEMBERING across conversations. Do NOT include:
   - Temporary states ("feeling tired today")
   - Medical data already tracked in health records (vitals, diagnoses, medications, screening scores)
   - Generic conversation filler
3. "remove_facts": Array of facts from existing memory that are now CONTRADICTED or OUTDATED based on this conversation. Use the exact text from existing facts.
4. "preferences": Object with optional fields: communication_style (string), preferred_name (string), tone_preference (string), topics_to_avoid (string array). Only include if evidence exists in the conversation.

Respond with ONLY valid JSON, no markdown fences:
{"summary": "...", "new_facts": [...], "remove_facts": [...], "preferences": {}}`;
  }

  private parseExtractionResponse(
    responseText: string,
    existingMemory: any | null,
  ): {
    summary: string;
    key_facts: string[];
    preferences: Record<string, any>;
  } {
    try {
      // Strip markdown fences if present
      const cleaned = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      const parsed = JSON.parse(cleaned);

      // Merge facts: existing - removed + new
      const existingFacts: string[] = existingMemory?.key_facts || [];
      const removeFacts = new Set(parsed.remove_facts || []);
      const keptFacts = existingFacts.filter((f) => !removeFacts.has(f));
      const newFacts: string[] = parsed.new_facts || [];
      const allFacts = [...keptFacts, ...newFacts];

      // Deduplicate and cap at 30 facts
      const uniqueFacts = [...new Set(allFacts)].slice(0, 30);

      // Merge preferences
      const existingPrefs = existingMemory?.preferences || {};
      const newPrefs = parsed.preferences || {};
      const mergedPrefs = { ...existingPrefs, ...newPrefs };
      if (newPrefs.topics_to_avoid) {
        mergedPrefs.topics_to_avoid = [
          ...new Set([
            ...(existingPrefs.topics_to_avoid || []),
            ...newPrefs.topics_to_avoid,
          ]),
        ];
      }

      return {
        summary: parsed.summary || existingMemory?.summary || '',
        key_facts: uniqueFacts,
        preferences: mergedPrefs,
      };
    } catch {
      // If JSON parsing fails, return existing memory unchanged
      return {
        summary: existingMemory?.summary || '',
        key_facts: existingMemory?.key_facts || [],
        preferences: existingMemory?.preferences || {},
      };
    }
  }
}
