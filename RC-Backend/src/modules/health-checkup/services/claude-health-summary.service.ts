import { Injectable, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';

export interface HealthSummaryContent {
  overview: string;
  key_findings: string[];
  possible_conditions_explained: Array<{
    condition: string;
    explanation: string;
    urgency: string;
  }>;
  recommendations: string[];
  when_to_seek_care: string;
  lifestyle_tips?: string[];
}

export interface ClaudeHealthSummaryResult {
  generated_at: Date;
  model: string;
  content: HealthSummaryContent | null;
  error?: string;
}

@Injectable()
export class ClaudeHealthSummaryService {
  private readonly logger = new Logger(ClaudeHealthSummaryService.name);
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
        this.logger.log('Claude Health Summary service initialized successfully');
      } catch (error) {
        this.logger.error('Failed to initialize Claude AI client:', error);
        this.isEnabled = false;
      }
    } else {
      this.logger.warn(
        'ANTHROPIC_API_KEY not configured. Claude Health Summary service disabled.',
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
   * Generate a health summary for a diagnosis result
   */
  async generateHealthSummary(
    diagnosisData: {
      conditions: Array<{
        id: string;
        name: string;
        common_name: string;
        probability: number;
      }>;
      evidence: Array<{
        id: string;
        name?: string;
        common_name?: string;
        choice_id: string;
        source?: string;
        duration?: any;
      }>;
      triage_level?: string;
      has_emergency_evidence?: boolean;
    },
    patientInfo: {
      age: number;
      gender: string;
    },
    answeredQuestions?: Array<{
      question: string;
      type: string;
      answers: Array<{
        name: string;
        choice: string;
        duration?: string;
      }>;
    }>,
  ): Promise<ClaudeHealthSummaryResult> {
    if (!this.isAvailable()) {
      this.logger.warn('Claude AI not available, returning error result');
      return {
        generated_at: new Date(),
        model: 'unavailable',
        content: null,
        error: 'Claude AI service is not available',
      };
    }

    try {
      const prompt = this.buildHealthSummaryPrompt(diagnosisData, patientInfo, answeredQuestions);

      const response = await this.client!.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2500,
        system: this.getSystemPrompt(),
        messages: [{ role: 'user', content: prompt }],
      });

      // Extract text response
      const textContent = response.content.find(
        (block) => block.type === 'text',
      );
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text response from Claude');
      }

      // Parse the JSON response
      const summaryContent = this.parseHealthSummaryResponse(textContent.text);

      return {
        generated_at: new Date(),
        model: 'claude-sonnet-4-20250514',
        content: summaryContent,
      };
    } catch (error) {
      this.logger.error('Error generating health summary with Claude:', error);
      return {
        generated_at: new Date(),
        model: 'claude-sonnet-4-20250514',
        content: null,
        error: error.message || 'Failed to generate health summary',
      };
    }
  }

  private getSystemPrompt(): string {
    return `You are a compassionate healthcare communication specialist for Rapid Capsule Healthcare Platform. Your job is to help patients understand their AI health assessment results in clear, reassuring language.

Guidelines:
1. Use simple, everyday language (8th-grade reading level)
2. Be accurate but not alarming - focus on being helpful and reassuring
3. Explain medical conditions in terms patients can understand
4. Provide practical, actionable recommendations
5. Encourage appropriate medical follow-up without causing unnecessary panic
6. Be empathetic and supportive in tone
7. IMPORTANT: This is a preliminary AI assessment, NOT a diagnosis - always encourage professional medical consultation
8. CRITICAL: Do NOT include any specific phone numbers, email addresses, or region-specific contact information. Use generic phrases like "contact your healthcare provider", "visit urgent care", or "seek emergency medical attention"

You MUST respond with ONLY a valid JSON object (no markdown, no explanation) in this exact format:
{
  "overview": "A 2-3 sentence friendly summary of the health assessment. Start with something like 'Based on your symptoms...' and provide a gentle, clear overview of what the assessment suggests.",
  "key_findings": ["Array of 3-5 most important observations from the assessment in simple language. Each finding should be a complete, clear sentence."],
  "possible_conditions_explained": [
    {
      "condition": "The condition name",
      "explanation": "A 1-2 sentence simple explanation of what this condition is and how it might relate to the symptoms described",
      "urgency": "routine | soon | urgent | emergency - indicating when to seek care for this specific condition"
    }
  ],
  "recommendations": ["Array of 4-6 practical next steps and recommendations. Be specific but general enough to apply broadly."],
  "when_to_seek_care": "A clear paragraph explaining when the patient should seek medical attention based on their specific symptoms and possible conditions. Include warning signs to watch for.",
  "lifestyle_tips": ["Array of 2-4 general wellness tips that might help with the symptoms described"]
}`;
  }

  private buildHealthSummaryPrompt(
    diagnosisData: {
      conditions: Array<{
        id: string;
        name: string;
        common_name: string;
        probability: number;
      }>;
      evidence: Array<{
        id: string;
        name?: string;
        common_name?: string;
        choice_id: string;
        source?: string;
        duration?: any;
      }>;
      triage_level?: string;
      has_emergency_evidence?: boolean;
    },
    patientInfo: {
      age: number;
      gender: string;
    },
    answeredQuestions?: Array<{
      question: string;
      type: string;
      answers: Array<{
        name: string;
        choice: string;
        duration?: string;
      }>;
    }>,
  ): string {
    // Format conditions
    const conditionsList = diagnosisData.conditions
      ?.slice(0, 5) // Top 5 conditions
      .map((c, i) => `${i + 1}. ${c.common_name || c.name} (${Math.round(c.probability * 100)}% probability)`)
      .join('\n') || 'No specific conditions identified';

    // Format symptoms (present evidence)
    const symptoms = diagnosisData.evidence
      ?.filter(e => e.choice_id === 'present' && (e.source === 'initial' || e.source === 'interview'))
      .map(e => {
        let symptomText = e.common_name || e.name || e.id;
        if (e.duration) {
          const durationText = this.formatDuration(e.duration);
          symptomText += ` (${durationText})`;
        }
        return symptomText;
      })
      .join(', ') || 'No specific symptoms recorded';

    // Format Q&A if available
    let qaSection = '';
    if (answeredQuestions && answeredQuestions.length > 0) {
      qaSection = '\n\nQUESTIONS ANSWERED DURING ASSESSMENT:\n' +
        answeredQuestions.slice(0, 10).map(qa => {
          const answers = qa.answers
            .filter(a => a.choice === 'present')
            .map(a => a.name)
            .join(', ');
          const absent = qa.answers
            .filter(a => a.choice === 'absent')
            .map(a => a.name)
            .join(', ');
          return `Q: ${qa.question}\n  - Present: ${answers || 'None'}\n  - Absent: ${absent || 'None'}`;
        }).join('\n');
    }

    return `Please create a patient-friendly health summary for this AI health assessment.

PATIENT INFORMATION:
- Age: ${patientInfo.age} years
- Gender: ${patientInfo.gender}

REPORTED SYMPTOMS:
${symptoms}

POSSIBLE CONDITIONS (from AI assessment):
${conditionsList}

TRIAGE LEVEL: ${diagnosisData.triage_level || 'Not specified'}
EMERGENCY INDICATORS: ${diagnosisData.has_emergency_evidence ? 'Yes - some concerning symptoms detected' : 'No emergency symptoms detected'}
${qaSection}

Based on this information, create a comprehensive but easy-to-understand health summary that:
1. Helps the patient understand what their symptoms might indicate
2. Explains each possible condition in simple terms
3. Provides practical recommendations
4. Clearly explains when to seek medical care
5. Offers reassurance while encouraging appropriate follow-up

Remember: This is a preliminary AI assessment, NOT a medical diagnosis. The summary should guide the patient to make informed decisions about seeking appropriate care.`;
  }

  private formatDuration(duration: any): string {
    if (typeof duration === 'string') {
      const durationMap: Record<string, string> = {
        'hours': 'less than 1 day',
        'days_1_3': '1-3 days',
        'days_4_7': '4-7 days',
        'weeks_1_2': '1-2 weeks',
        'weeks_2_4': '2-4 weeks',
        'months': 'more than 1 month',
      };
      return durationMap[duration] || duration;
    }
    if (duration && duration.value && duration.unit) {
      return `${duration.value} ${duration.unit}${duration.value > 1 ? 's' : ''}`;
    }
    return 'duration not specified';
  }

  private parseHealthSummaryResponse(responseText: string): HealthSummaryContent {
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
        overview: parsed.overview || 'Your health assessment has been completed. Please review the findings below.',
        key_findings: parsed.key_findings || [],
        possible_conditions_explained: parsed.possible_conditions_explained || [],
        recommendations: parsed.recommendations || ['Please consult with a healthcare provider for a proper diagnosis'],
        when_to_seek_care: parsed.when_to_seek_care || 'If symptoms worsen or you have concerns, please contact a healthcare provider.',
        lifestyle_tips: parsed.lifestyle_tips || [],
      };
    } catch (error) {
      this.logger.error('Failed to parse health summary response:', error);
      this.logger.debug('Raw response:', responseText);

      // Return a minimal fallback summary
      return {
        overview: 'Your health assessment has been completed. Please review the details with a healthcare professional.',
        key_findings: ['Assessment completed - review with healthcare provider recommended'],
        possible_conditions_explained: [],
        recommendations: [
          'Consult with a healthcare provider for a proper evaluation',
          'Keep track of your symptoms and any changes',
          'Bring this assessment report to your next medical appointment',
        ],
        when_to_seek_care: 'If your symptoms worsen, you develop new symptoms, or you have any concerns, please contact a healthcare provider promptly.',
        lifestyle_tips: [
          'Stay hydrated and get adequate rest',
          'Monitor your symptoms and note any changes',
        ],
      };
    }
  }
}
