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

export interface ExtractedMedication {
  name: string;
  dosage?: string;
  quantity?: string;
  instructions?: string;
  frequency?: string;
  duration?: string;
  confidence: number;
}

// Comprehensive prescription data extracted directly from image by Claude
export interface ExtractedPrescriptionData {
  // Patient information
  patient: {
    name: string | null;
    date_of_birth?: string | null;
    age?: number | null;
    gender?: string | null;
    address?: string | null;
    phone?: string | null;
  };
  // Prescriber/Doctor information
  prescriber: {
    name: string | null;
    title?: string | null; // Dr., Prof., etc.
    license_number?: string | null;
    specialty?: string | null;
    clinic_name?: string | null;
    clinic_address?: string | null;
    phone?: string | null;
    signature_present: boolean;
  };
  // Prescription metadata
  prescription_date?: string | null;
  validity_period?: string | null;
  prescription_number?: string | null;
  // Medications
  medications: ExtractedMedication[];
}

export interface OcrCorrection {
  field: string;
  ocr_value: string | null;
  corrected_value: string | null;
  reason: string;
}

export interface PrescriptionAnalysisResult {
  isValid: boolean;
  confidence: number;
  fraudScore: number;
  flags: Array<{
    type: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    message: string;
  }>;
  medicationAnalysis: Array<{
    name: string;
    isValidMedication: boolean;
    concerns: string[];
    suggestedDosage?: string;
  }>;
  // Comprehensive data extracted directly from image by Claude
  extractedData?: ExtractedPrescriptionData;
  // OCR correction tracking
  ocrCorrectionsMade?: boolean;
  ocrCorrections?: OcrCorrection[];
  overallAssessment: string;
  recommendations: string[];
  // Patient-friendly summary (non-technical, simple language)
  patientSummary: string;
  patientNameMatch: {
    extractedName: string | null;
    matchConfidence: number;
    concerns: string[];
  };
  doctorVerification: {
    doctorName: string | null;
    licenseNumber: string | null;
    isFormatValid: boolean;
    concerns: string[];
  };
  documentAuthenticity: {
    appearsGenuine: boolean;
    concerns: string[];
    editingIndicators: string[];
  };
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
        'ANTHROPIC_API_KEY not configured. Claude AI prescription analysis disabled.',
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
   * Analyze a prescription using Claude AI
   */
  async analyzePrescription(
    ocrData: {
      raw_text: string;
      doctor_name?: string;
      patient_name?: string;
      clinic_name?: string;
      prescription_date?: Date;
      medications?: Array<{
        name: string;
        dosage?: string;
        quantity?: string;
        instructions?: string;
      }>;
      doctor_license?: string;
    },
    patientInfo: {
      fullName: string;
      dateOfBirth?: Date;
      gender?: string;
    },
    imageBase64?: string,
    imageMimeType?: string,
  ): Promise<PrescriptionAnalysisResult> {
    if (!this.isAvailable()) {
      this.logger.warn('Claude AI not available, returning default analysis');
      return this.getDefaultAnalysis();
    }

    try {
      const prompt = this.buildAnalysisPrompt(ocrData, patientInfo);

      const messages: Anthropic.MessageParam[] = [];

      // If we have image data, include it for visual analysis
      if (imageBase64) {
        // Determine media type - default to jpeg if not specified
        // Note: 'image/jpg' is mapped to 'image/jpeg' (API standard)
        let mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' = 'image/jpeg';
        if (imageMimeType === 'image/png') {
          mediaType = 'image/png';
        } else if (imageMimeType === 'image/gif') {
          mediaType = 'image/gif';
        } else if (imageMimeType === 'image/webp') {
          mediaType = 'image/webp';
        }
        // 'image/jpeg' and 'image/jpg' both use default 'image/jpeg'

        this.logger.log(`Sending image to Claude for vision analysis (${mediaType}, original: ${imageMimeType})`);

        messages.push({
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        });
      } else {
        this.logger.log('No image available - Claude will analyze OCR data only');
        messages.push({
          role: 'user',
          content: prompt,
        });
      }

      const response = await this.client!.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: this.getSystemPrompt(),
        messages,
      });

      // Extract text response
      const textContent = response.content.find(
        (block) => block.type === 'text',
      );
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text response from Claude');
      }

      // Parse the JSON response
      const analysisResult = this.parseAnalysisResponse(textContent.text);
      return analysisResult;
    } catch (error) {
      this.logger.error('Error analyzing prescription with Claude:', error);
      return this.getDefaultAnalysis();
    }
  }

  private getSystemPrompt(): string {
    return `You are a pharmaceutical expert and fraud detection specialist for Rapid Capsule Healthcare Platform. Your job is to:
1. EXTRACT all prescription data directly from the image (patient, prescriber, medications, dates)
2. COMPARE your extraction with the OCR data provided
3. CORRECT any OCR errors and note the discrepancies
4. ANALYZE for authenticity, validity, and potential fraud

CRITICAL: OCR systems often make mistakes. You must look at the actual prescription image and extract:
- Patient information (name, DOB, age, address)
- Prescriber/Doctor information (name, license, clinic, signature)
- All medications with dosage, quantity, instructions
- Prescription date and validity

Then compare with OCR data and flag any corrections needed.

You MUST respond with ONLY a valid JSON object (no markdown, no explanation) in this exact format:
{
  "isValid": boolean,
  "confidence": number (0-100),
  "fraudScore": number (0-100, higher = more suspicious),
  "flags": [
    {
      "type": "string (MEDICATION_CONCERN, AUTHENTICITY_ISSUE, PATIENT_MISMATCH, CONTROLLED_SUBSTANCE, QUANTITY_EXCESSIVE, FORMAT_SUSPICIOUS, DATE_ISSUE, OCR_ERROR)",
      "severity": "LOW | MEDIUM | HIGH | CRITICAL",
      "message": "string"
    }
  ],
  "extractedData": {
    "patient": {
      "name": "string or null (patient name exactly as shown on prescription)",
      "date_of_birth": "string or null (DOB if visible, format: YYYY-MM-DD or DD/MM/YYYY)",
      "age": "number or null",
      "gender": "string or null",
      "address": "string or null",
      "phone": "string or null"
    },
    "prescriber": {
      "name": "string or null (doctor/prescriber name)",
      "title": "string or null (Dr., Prof., etc.)",
      "license_number": "string or null (medical license/registration number)",
      "specialty": "string or null",
      "clinic_name": "string or null",
      "clinic_address": "string or null",
      "phone": "string or null",
      "signature_present": boolean (is there a signature on the prescription?)
    },
    "prescription_date": "string or null (date prescription was written)",
    "validity_period": "string or null (expiry or valid until date)",
    "prescription_number": "string or null (reference number if any)",
    "medications": [
      {
        "name": "string (ACTUAL medication name from prescription)",
        "dosage": "string (e.g., '500mg')",
        "quantity": "string (e.g., '30 tablets')",
        "instructions": "string (e.g., 'Take with food')",
        "frequency": "string (e.g., 'twice daily')",
        "duration": "string (e.g., '7 days')",
        "confidence": number (0-100)
      }
    ]
  },
  "ocrCorrectionsMade": boolean,
  "ocrCorrections": [
    {
      "field": "string (e.g., 'patient_name', 'medication_1_name', 'doctor_name')",
      "ocr_value": "string or null (what OCR extracted)",
      "corrected_value": "string or null (what you see on the image)",
      "reason": "string (why this is wrong)"
    }
  ],
  "medicationAnalysis": [
    {
      "name": "string",
      "isValidMedication": boolean,
      "concerns": ["string"],
      "suggestedDosage": "string (optional)"
    }
  ],
  "overallAssessment": "string (brief summary)",
  "recommendations": ["string"],
  "patientNameMatch": {
    "extractedName": "string or null (name from prescription)",
    "matchConfidence": number (0-100, vs account holder name),
    "concerns": ["string"]
  },
  "doctorVerification": {
    "doctorName": "string or null",
    "licenseNumber": "string or null",
    "isFormatValid": boolean,
    "concerns": ["string"]
  },
  "documentAuthenticity": {
    "appearsGenuine": boolean,
    "concerns": ["string"],
    "editingIndicators": ["string"]
  },
  "patientSummary": "string (A simple, friendly 1-2 sentence summary for the patient. If valid: 'Your prescription looks good and is ready for processing.' If invalid: explain in simple terms why it was rejected, e.g., 'We couldn't verify this prescription because the patient name doesn't match your account.' Avoid technical terms like 'OCR', 'fraud score', 'authenticity'. Be helpful and suggest next steps if rejected.)"
}`;
  }

  private buildAnalysisPrompt(
    ocrData: {
      raw_text: string;
      doctor_name?: string;
      patient_name?: string;
      clinic_name?: string;
      prescription_date?: Date;
      medications?: Array<{
        name: string;
        dosage?: string;
        quantity?: string;
        instructions?: string;
      }>;
      doctor_license?: string;
    },
    patientInfo: {
      fullName: string;
      dateOfBirth?: Date;
      gender?: string;
    },
  ): string {
    const medicationsList = ocrData.medications
      ?.map(
        (m, i) =>
          `${i + 1}. ${m.name} - Dosage: ${m.dosage || 'N/A'}, Qty: ${m.quantity || 'N/A'}, Instructions: ${m.instructions || 'N/A'}`,
      )
      .join('\n');

    // Get current date for proper date validation
    const today = new Date();
    const todayFormatted = today.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    return `Analyze this prescription image and extract ALL data directly from it.

IMPORTANT DATE CONTEXT:
- Today's date is: ${todayFormatted}
- When evaluating prescription dates, consider today's date as current
- A prescription dated today is VALID (not "future dated")
- Prescriptions are typically valid for 28-30 days from issue date

YOUR PRIMARY TASK: Look at the prescription image and extract:
1. PATIENT details (name, DOB, age, address as shown on prescription)
2. PRESCRIBER/DOCTOR details (name, license, clinic, signature present?)
3. ALL MEDICATIONS (name, dosage, quantity, instructions, frequency, duration)
4. DATES (prescription date, validity period)

Then COMPARE your extraction with the OCR data below and note any discrepancies.

ACCOUNT HOLDER (the person uploading this prescription):
- Name: ${patientInfo.fullName}
- Date of Birth: ${patientInfo.dateOfBirth ? new Date(patientInfo.dateOfBirth).toLocaleDateString() : 'Not provided'}
- Gender: ${patientInfo.gender || 'Not provided'}

OCR SYSTEM EXTRACTED (often INCORRECT - compare with what you see):
- Patient Name: ${ocrData.patient_name || 'Not detected'}
- Doctor Name: ${ocrData.doctor_name || 'Not detected'}
- Doctor License: ${ocrData.doctor_license || 'Not detected'}
- Clinic: ${ocrData.clinic_name || 'Not detected'}
- Prescription Date: ${ocrData.prescription_date ? new Date(ocrData.prescription_date).toLocaleDateString() : 'Not detected'}
- Medications: ${medicationsList || 'None extracted'}

Provide your response as JSON with:
- "extractedData": Complete data YOU extracted from the image (patient, prescriber, medications, dates)
- "ocrCorrections": List any fields where OCR was wrong (field name, OCR value, your corrected value, reason)
- "ocrCorrectionsMade": true if ANY OCR data was incorrect
- Compare patient name on prescription vs account holder name
- Flag any fraud concerns, controlled substances, or document authenticity issues`;
  }

  private parseAnalysisResponse(responseText: string): PrescriptionAnalysisResult {
    try {
      // Try to extract JSON from the response
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
      const isValid = parsed.isValid ?? false;

      // Generate default patient summary if not provided
      let patientSummary = parsed.patientSummary;
      if (!patientSummary) {
        if (isValid) {
          patientSummary = 'Your prescription looks good and is ready for processing.';
        } else {
          // Generate a simple summary from flags if available
          const criticalFlags = (parsed.flags || []).filter((f: any) => f.severity === 'CRITICAL' || f.severity === 'HIGH');
          if (criticalFlags.length > 0) {
            patientSummary = 'We found some issues with this prescription that need attention. Please upload a clearer image or contact support for assistance.';
          } else {
            patientSummary = 'This prescription requires additional review. Our team will follow up if needed.';
          }
        }
      }

      return {
        isValid,
        confidence: parsed.confidence ?? 0,
        fraudScore: parsed.fraudScore ?? 50,
        flags: parsed.flags ?? [],
        medicationAnalysis: parsed.medicationAnalysis ?? [],
        // Comprehensive extracted data from Claude's vision analysis
        extractedData: parsed.extractedData ?? {
          patient: { name: null },
          prescriber: { name: null, signature_present: false },
          medications: [],
        },
        ocrCorrectionsMade: parsed.ocrCorrectionsMade ?? false,
        ocrCorrections: parsed.ocrCorrections ?? [],
        overallAssessment: parsed.overallAssessment ?? 'Unable to assess',
        recommendations: parsed.recommendations ?? [],
        patientSummary,
        patientNameMatch: parsed.patientNameMatch ?? {
          extractedName: parsed.extractedData?.patient?.name ?? null,
          matchConfidence: 0,
          concerns: ['Could not extract patient name'],
        },
        doctorVerification: parsed.doctorVerification ?? {
          doctorName: parsed.extractedData?.prescriber?.name ?? null,
          licenseNumber: parsed.extractedData?.prescriber?.license_number ?? null,
          isFormatValid: false,
          concerns: ['Could not verify doctor information'],
        },
        documentAuthenticity: parsed.documentAuthenticity ?? {
          appearsGenuine: false,
          concerns: ['Could not assess authenticity'],
          editingIndicators: [],
        },
      };
    } catch (error) {
      this.logger.error('Failed to parse Claude response:', error);
      this.logger.debug('Raw response:', responseText);
      return this.getDefaultAnalysis();
    }
  }

  private getDefaultAnalysis(): PrescriptionAnalysisResult {
    return {
      isValid: false,
      confidence: 0,
      fraudScore: 50,
      flags: [
        {
          type: 'AI_UNAVAILABLE',
          severity: 'MEDIUM',
          message:
            'Claude AI analysis unavailable. Manual review recommended.',
        },
      ],
      medicationAnalysis: [],
      extractedData: {
        patient: { name: null },
        prescriber: { name: null, signature_present: false },
        medications: [],
      },
      ocrCorrectionsMade: false,
      ocrCorrections: [],
      overallAssessment:
        'AI analysis could not be performed. Prescription requires manual pharmacist review.',
      recommendations: [
        'Manual verification by pharmacist required',
        'Verify prescription authenticity through alternative means',
      ],
      patientSummary: 'Your prescription is being reviewed by our pharmacy team. We\'ll notify you once the review is complete.',
      patientNameMatch: {
        extractedName: null,
        matchConfidence: 0,
        concerns: ['AI analysis not available'],
      },
      doctorVerification: {
        doctorName: null,
        licenseNumber: null,
        isFormatValid: false,
        concerns: ['AI analysis not available'],
      },
      documentAuthenticity: {
        appearsGenuine: false,
        concerns: ['AI analysis not available'],
        editingIndicators: [],
      },
    };
  }

  /**
   * Quick medication validation check
   */
  async validateMedications(
    medications: Array<{ name: string; dosage?: string; quantity?: string }>,
  ): Promise<{
    valid: boolean;
    concerns: string[];
    details: Array<{
      name: string;
      isKnown: boolean;
      isSafe: boolean;
      notes: string;
    }>;
  }> {
    if (!this.isAvailable()) {
      return {
        valid: true,
        concerns: ['AI validation not available'],
        details: medications.map((m) => ({
          name: m.name,
          isKnown: true,
          isSafe: true,
          notes: 'Unable to validate - AI unavailable',
        })),
      };
    }

    try {
      const prompt = `Analyze these medications for validity and safety concerns. Return JSON only.

Medications:
${medications.map((m, i) => `${i + 1}. ${m.name} - Dosage: ${m.dosage || 'N/A'}, Qty: ${m.quantity || 'N/A'}`).join('\n')}

Respond with:
{
  "valid": boolean,
  "concerns": ["string"],
  "details": [
    {
      "name": "string",
      "isKnown": boolean,
      "isSafe": boolean,
      "notes": "string"
    }
  ]
}`;

      const response = await this.client!.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system:
          'You are a pharmaceutical expert. Validate medications and check for concerns. Respond with JSON only.',
        messages: [{ role: 'user', content: prompt }],
      });

      const textContent = response.content.find(
        (block) => block.type === 'text',
      );
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text response');
      }

      let jsonStr = textContent.text.trim();
      if (jsonStr.startsWith('```json')) jsonStr = jsonStr.slice(7);
      if (jsonStr.startsWith('```')) jsonStr = jsonStr.slice(3);
      if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3);

      return JSON.parse(jsonStr.trim());
    } catch (error) {
      this.logger.error('Error validating medications:', error);
      return {
        valid: true,
        concerns: ['AI validation failed'],
        details: [],
      };
    }
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
    pregnancy_or_breastfeeding: string[];
    geriatric_use: string[];
    pediatric_use: string[];
    overdosage: string[];
  }): string {
    const sections: string[] = [];

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
      sections.push(`\nDRUG INTERACTIONS:\n${safetyData.drug_interactions.join('\n')}`);
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

  /**
   * Check for drug interactions using Claude AI
   * Returns detailed interaction information for a list of drug names
   */
  async checkDrugInteractions(drugNames: string[]): Promise<{
    hasInteractions: boolean;
    interactions: Array<{
      severity: 'high' | 'moderate' | 'low';
      drug1: string;
      drug2: string;
      description: string;
      source: string;
    }>;
  }> {
    if (!this.isAvailable()) {
      this.logger.warn('Claude AI not available for drug interaction checking');
      return { hasInteractions: false, interactions: [] };
    }

    if (!drugNames || drugNames.length < 2) {
      return { hasInteractions: false, interactions: [] };
    }

    try {
      const prompt = `Analyze potential drug interactions between these medications: ${drugNames.join(', ')}

For EACH pair of drugs that may interact, provide the interaction details. Focus on clinically significant interactions.

Respond with ONLY a valid JSON object (no markdown, no explanation) in this exact format:
{
  "interactions": [
    {
      "drug1": "Drug Name 1",
      "drug2": "Drug Name 2",
      "severity": "high" | "moderate" | "low",
      "description": "Brief description of the interaction and its clinical significance"
    }
  ]
}

Severity guidelines:
- "high": Life-threatening or serious adverse effects possible, avoid combination
- "moderate": May cause significant problems, monitor closely or consider alternatives
- "low": Minor interaction, usually manageable with monitoring

If no interactions are found, return: {"interactions": []}`;

      const response = await this.client!.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: 'You are a clinical pharmacology expert. Analyze drug interactions based on established pharmacological knowledge. Be accurate and clinically relevant. Only report known, documented interactions - do not speculate.',
        messages: [{ role: 'user', content: prompt }],
      });

      const textContent = response.content.find(
        (block) => block.type === 'text',
      );
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text response from Claude');
      }

      let jsonStr = textContent.text.trim();
      if (jsonStr.startsWith('```json')) jsonStr = jsonStr.slice(7);
      if (jsonStr.startsWith('```')) jsonStr = jsonStr.slice(3);
      if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3);

      const parsed = JSON.parse(jsonStr.trim());
      const interactions = (parsed.interactions || []).map((i: any) => ({
        severity: i.severity || 'moderate',
        drug1: i.drug1,
        drug2: i.drug2,
        description: i.description,
        source: 'Claude AI',
      }));

      return {
        hasInteractions: interactions.length > 0,
        interactions,
      };
    } catch (error) {
      this.logger.error('Error checking drug interactions with Claude:', error);
      return { hasInteractions: false, interactions: [] };
    }
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
