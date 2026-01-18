import { Injectable, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';

export interface DrugSafetySummary {
  overview: string;
  key_warnings: string[];
  common_side_effects: string[];
  serious_side_effects: string[];
  who_should_avoid: string[];
  drug_interactions_summary: string[];
  food_interactions_summary: string[];
  pregnancy_summary: string;
  usage_tips: string[];
}

@Injectable()
export class ClaudeAIService {
  private readonly logger = new Logger(ClaudeAIService.name);
  private client: Anthropic | null = null;
  private isEnabled: boolean = false;

  constructor() {
    this.initializeClient();
  }

  private initializeClient() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey) {
      try {
        this.client = new Anthropic({ apiKey });
        this.isEnabled = true;
        this.logger.log('Claude AI service initialized successfully');
      } catch (error) {
        this.logger.error('Failed to initialize Claude AI client:', error);
        this.isEnabled = false;
      }
    } else {
      this.logger.warn(
        'ANTHROPIC_API_KEY not configured. Claude AI summarization disabled.',
      );
      this.isEnabled = false;
    }
  }

  /**
   * Check if Claude AI is enabled and available
   */
  isAvailable(): boolean {
    return this.isEnabled && this.client !== null;
  }

  /**
   * Summarize drug safety information into patient-friendly bullet points
   * Uses Claude to transform FDA data into easy-to-understand summaries
   */
  async summarizeDrugSafetyInfo(safetyData: {
    generic_name: string;
    brand_name?: string;
    adverse_reactions: string[];
    warnings: string[];
    warnings_and_cautions: string[];
    boxed_warning: string[];
    contraindications: string[];
    drug_interactions: string[];
    food_safety_warning: string[];
    pregnancy_or_breastfeeding: string[];
    geriatric_use: string[];
    pediatric_use: string[];
    overdosage: string[];
  }): Promise<{ summary: DrugSafetySummary; model: string } | null> {
    if (!this.isAvailable()) {
      this.logger.warn('Claude AI not available for drug safety summarization');
      return null;
    }

    try {
      const prompt = this.buildSafetySummaryPrompt(safetyData);

      const response = await this.client!.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2500,
        system: this.getDrugSafetySystemPrompt(),
        messages: [{ role: 'user', content: prompt }],
      });

      const textContent = response.content.find(
        (block) => block.type === 'text',
      );
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text response from Claude');
      }

      const summary = this.parseSafetySummaryResponse(textContent.text);
      return {
        summary,
        model: 'claude-sonnet-4-20250514',
      };
    } catch (error) {
      this.logger.error('Error summarizing drug safety info with Claude:', error);
      return null;
    }
  }

  private getDrugSafetySystemPrompt(): string {
    return `You are a medical communication specialist helping patients understand medication safety information. Your job is to transform complex FDA drug labeling data into clear, patient-friendly summaries.

Guidelines:
1. Use simple, everyday language (8th-grade reading level)
2. Avoid medical jargon - explain terms when necessary
3. Be accurate but not alarming - focus on practical information
4. Prioritize the most important safety information
5. Keep bullet points concise (under 20 words each)
6. Be reassuring while still conveying important warnings
7. IMPORTANT: Extract food and beverage interactions from the DRUG INTERACTIONS section - FDA often includes foods like grapefruit, alcohol, high-fiber meals, dairy products, etc. within the drug interactions data
8. CRITICAL: Do NOT include any specific phone numbers (like Poison Control, hotlines), email addresses, or US-specific contact information. This is for an international audience. Instead use generic phrases like "seek immediate medical attention", "contact emergency services", or "consult your healthcare provider"

You MUST respond with ONLY a valid JSON object (no markdown, no explanation) in this exact format:
{
  "overview": "A 1-2 sentence friendly description of what this medication is commonly used for",
  "key_warnings": ["Array of 3-5 most critical warnings in simple language"],
  "common_side_effects": ["Array of 3-6 most common side effects patients might experience"],
  "serious_side_effects": ["Array of 2-4 serious side effects that need immediate medical attention"],
  "who_should_avoid": ["Array of 2-4 groups of people who should not take this medication"],
  "drug_interactions_summary": ["Array of 3-5 key DRUG interactions to be aware of (medications only, not food)"],
  "food_interactions_summary": ["Array of 2-4 food and beverage interactions extracted from the data (e.g., grapefruit, alcohol, caffeine, high-fiber/bran meals, dairy) - look in drug interactions section for food mentions - empty array ONLY if truly no food interactions exist"],
  "pregnancy_summary": "A single clear statement about pregnancy and breastfeeding safety",
  "usage_tips": ["Array of 2-4 practical tips for taking this medication safely"]
}`;
  }

  private buildSafetySummaryPrompt(safetyData: {
    generic_name: string;
    brand_name?: string;
    adverse_reactions: string[];
    warnings: string[];
    warnings_and_cautions: string[];
    boxed_warning: string[];
    contraindications: string[];
    drug_interactions: string[];
    food_safety_warning: string[];
    pregnancy_or_breastfeeding: string[];
    geriatric_use: string[];
    pediatric_use: string[];
    overdosage: string[];
  }): string {
    const sections = [];

    sections.push(`MEDICATION: ${safetyData.generic_name}${safetyData.brand_name ? ` (${safetyData.brand_name})` : ''}`);

    if (safetyData.boxed_warning?.length > 0) {
      sections.push(`\nBLACK BOX WARNINGS (Most Serious):\n${safetyData.boxed_warning.join('\n')}`);
    }

    if (safetyData.adverse_reactions?.length > 0) {
      sections.push(`\nADVERSE REACTIONS/SIDE EFFECTS:\n${safetyData.adverse_reactions.join('\n')}`);
    }

    if (safetyData.warnings?.length > 0) {
      sections.push(`\nWARNINGS:\n${safetyData.warnings.join('\n')}`);
    }

    if (safetyData.warnings_and_cautions?.length > 0) {
      sections.push(`\nWARNINGS AND CAUTIONS:\n${safetyData.warnings_and_cautions.join('\n')}`);
    }

    if (safetyData.contraindications?.length > 0) {
      sections.push(`\nCONTRAINDICATIONS (When NOT to use):\n${safetyData.contraindications.join('\n')}`);
    }

    if (safetyData.drug_interactions?.length > 0) {
      sections.push(`\nDRUG INTERACTIONS (Note: This section may include FOOD interactions - extract them separately for food_interactions_summary):\n${safetyData.drug_interactions.join('\n')}`);
    }

    if (safetyData.pregnancy_or_breastfeeding?.length > 0) {
      sections.push(`\nPREGNANCY/BREASTFEEDING:\n${safetyData.pregnancy_or_breastfeeding.join('\n')}`);
    }

    if (safetyData.geriatric_use?.length > 0) {
      sections.push(`\nELDERLY PATIENTS:\n${safetyData.geriatric_use.join('\n')}`);
    }

    if (safetyData.pediatric_use?.length > 0) {
      sections.push(`\nCHILDREN:\n${safetyData.pediatric_use.join('\n')}`);
    }

    if (safetyData.overdosage?.length > 0) {
      sections.push(`\nOVERDOSE INFORMATION:\n${safetyData.overdosage.join('\n')}`);
    }

    return `Please summarize the following FDA drug safety information into a patient-friendly format. Focus on what patients need to know to take this medication safely.

${sections.join('\n')}

Create a comprehensive but easy-to-understand summary in JSON format.`;
  }

  private parseSafetySummaryResponse(responseText: string): DrugSafetySummary {
    try {
      let jsonStr = responseText.trim();

      // Remove markdown code blocks if present
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.slice(7);
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.slice(3);
      }
      if (jsonStr.endsWith('```')) {
        jsonStr = jsonStr.slice(0, -3);
      }
      jsonStr = jsonStr.trim();

      const parsed = JSON.parse(jsonStr);

      // Validate and return with defaults for missing fields
      return {
        overview: parsed.overview || 'Safety information is available for this medication.',
        key_warnings: parsed.key_warnings || [],
        common_side_effects: parsed.common_side_effects || [],
        serious_side_effects: parsed.serious_side_effects || [],
        who_should_avoid: parsed.who_should_avoid || [],
        drug_interactions_summary: parsed.drug_interactions_summary || [],
        food_interactions_summary: parsed.food_interactions_summary || [],
        pregnancy_summary: parsed.pregnancy_summary || 'Consult your doctor before use during pregnancy or breastfeeding.',
        usage_tips: parsed.usage_tips || [],
      };
    } catch (error) {
      this.logger.error('Failed to parse drug safety summary response:', error);
      this.logger.debug('Raw response:', responseText);

      // Return a minimal fallback summary
      return {
        overview: 'Safety information is available for this medication.',
        key_warnings: ['Please review the detailed safety information below'],
        common_side_effects: [],
        serious_side_effects: [],
        who_should_avoid: [],
        drug_interactions_summary: [],
        food_interactions_summary: [],
        pregnancy_summary: 'Consult your doctor before use during pregnancy or breastfeeding.',
        usage_tips: ['Always take as directed by your healthcare provider'],
      };
    }
  }
}
