import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import axios from 'axios';
import * as moment from 'moment';
import {
  DrugSafetyInfo,
  DrugSafetyInfoDocument,
} from '../entities/drug-safety-info.entity';
import { Drug, DrugDocument } from '../entities/drug.entity';
import { ClaudeAIService } from './claude-ai.service';

interface FDALabelResult {
  adverse_reactions?: string[];
  warnings?: string[];
  warnings_and_cautions?: string[];
  boxed_warning?: string[];
  contraindications?: string[];
  drug_interactions?: string[];
  pregnancy?: string[];
  nursing_mothers?: string[];
  geriatric_use?: string[];
  pediatric_use?: string[];
  overdosage?: string[];
  openfda?: {
    generic_name?: string[];
    brand_name?: string[];
    spl_id?: string[];
  };
}

interface FDAApiResponse {
  meta: {
    results: {
      total: number;
    };
  };
  results: FDALabelResult[];
}

// Drug name aliases - maps international/brand names to FDA-recognized names
// FDA uses US naming conventions (e.g., Acetaminophen instead of Paracetamol)
const DRUG_NAME_ALIASES: Record<string, string[]> = {
  // International to US name mappings
  paracetamol: ['acetaminophen'],
  adrenaline: ['epinephrine'],
  salbutamol: ['albuterol'],
  frusemide: ['furosemide'],
  lignocaine: ['lidocaine'],
  noradrenaline: ['norepinephrine'],
  pethidine: ['meperidine'],
  glyceryl_trinitrate: ['nitroglycerin'],
  // Common brand to generic mappings
  tylenol: ['acetaminophen'],
  advil: ['ibuprofen'],
  motrin: ['ibuprofen'],
  panadol: ['acetaminophen'],
  // Combination/complex drugs - search by simplified components
  gaviscon: ['aluminum hydroxide', 'alginic acid'],
  alginate_sodium_bicarbonate: ['aluminum hydroxide', 'alginic acid'],
  sodium_alginate: ['alginic acid'],
};

/**
 * Get alternate names for a drug (for FDA lookup)
 */
function getAlternateNames(drugName: string): string[] {
  const normalized = drugName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  return DRUG_NAME_ALIASES[normalized] || [];
}

@Injectable()
export class OpenFDAService {
  private readonly logger = new Logger(OpenFDAService.name);
  private readonly FDA_LABEL_API = 'https://api.fda.gov/drug/label.json';
  private readonly SYNC_INTERVAL_DAYS = 30;
  private readonly MAX_RETRIES = 3;

  constructor(
    @InjectModel(DrugSafetyInfo.name)
    private drugSafetyModel: Model<DrugSafetyInfoDocument>,
    @InjectModel(Drug.name)
    private drugModel: Model<DrugDocument>,
    private claudeAIService: ClaudeAIService,
  ) {}

  /**
   * Fetch drug safety information from OpenFDA by generic name
   */
  async fetchFromFDA(genericName: string, brandName?: string): Promise<FDALabelResult | null> {
    // Try original generic name first
    const result = await this.fetchFromFDAByName(genericName);
    if (result) return result;

    // Try alternate names for generic (e.g., Paracetamol -> Acetaminophen)
    const alternateNames = getAlternateNames(genericName);
    for (const altName of alternateNames) {
      this.logger.log(`Trying alternate name: ${altName} for ${genericName}`);
      const altResult = await this.fetchFromFDAByName(altName);
      if (altResult) return altResult;
    }

    // Try brand name aliases (e.g., Gaviscon -> aluminum hydroxide)
    if (brandName) {
      const brandAliases = getAlternateNames(brandName);
      for (const altName of brandAliases) {
        this.logger.log(`Trying brand alias: ${altName} for ${brandName}`);
        const altResult = await this.fetchFromFDAByName(altName);
        if (altResult) return altResult;
      }
    }

    // Try brand name search as final fallback
    return this.fetchFromFDAByBrand(brandName || genericName);
  }

  /**
   * Search FDA by generic name
   */
  private async fetchFromFDAByName(name: string): Promise<FDALabelResult | null> {
    try {
      const cleanName = name.toLowerCase().trim();
      const encodedName = encodeURIComponent(cleanName);

      const url = `${this.FDA_LABEL_API}?search=openfda.generic_name:"${encodedName}"&limit=1`;

      this.logger.log(`Fetching FDA data for: ${name}`);

      const response = await axios.get<FDAApiResponse>(url, {
        timeout: 30000,
        headers: {
          'Accept': 'application/json',
        },
      });

      if (response.data?.results?.length > 0) {
        this.logger.log(`FDA data found for: ${name}`);
        return response.data.results[0];
      }

      return null;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      this.logger.warn(`FDA API error for ${name}: ${error.message}`);
      return null;
    }
  }

  /**
   * Search FDA by brand name
   */
  private async fetchFromFDAByBrand(name: string): Promise<FDALabelResult | null> {
    try {
      const cleanName = name.toLowerCase().trim();
      const encodedName = encodeURIComponent(cleanName);

      const brandUrl = `${this.FDA_LABEL_API}?search=openfda.brand_name:"${encodedName}"&limit=1`;
      const brandResponse = await axios.get<FDAApiResponse>(brandUrl, {
        timeout: 30000,
      });

      if (brandResponse.data?.results?.length > 0) {
        this.logger.log(`FDA data found for brand: ${name}`);
        return brandResponse.data.results[0];
      }

      this.logger.warn(`No FDA data found for: ${name}`);
      return null;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        this.logger.warn(`No FDA data found for: ${name}`);
        return null;
      }
      this.logger.error(`FDA fetch error for ${name}: ${error.message}`);
      return null;
    }
  }

  /**
   * Clean FDA text by removing cross-references, section numbers, and formatting artifacts
   * Makes the text more patient-friendly
   */
  private cleanFDAText(text: string): string {
    return text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\[see [^\]]+\]/gi, '') // Remove cross-references like [see Warnings and Precautions (5.1)]
      .replace(/\(see [^)]+\)/gi, '') // Remove cross-references like (see section 5.1)
      .replace(/\[\s*see\s+[^\]]*\]/gi, '') // More flexible cross-reference removal
      .replace(/\(\s*\d+(\.\d+)?\s*\)/g, '') // Remove section numbers like (5.1), (6.1)
      .replace(/^\d+(\.\d+)?\s+/gm, '') // Remove leading section numbers like "6.1 "
      .replace(/Table\s+\d+[^.]*\./gi, '') // Remove table references
      .replace(/\bSection\s+\d+(\.\d+)?/gi, '') // Remove "Section 5.1" references
      .replace(/Clinical Pharmacology\s*\([^)]*\)/gi, '') // Remove Clinical Pharmacology references
      .replace(/Drug Interactions\s*\([^)]*\)/gi, '') // Remove Drug Interactions references
      .replace(/Warnings and Precautions\s*\([^)]*\)/gi, '') // Remove W&P references
      .replace(/Adverse Reactions\s*\([^)]*\)/gi, '') // Remove Adverse Reactions references
      .replace(/www\.[^\s]+/g, '') // Remove URLs
      .replace(/1-800-[0-9-]+/g, '') // Remove phone numbers
      .replace(/To report SUSPECTED ADVERSE REACTIONS[^.]+\./gi, '') // Remove reporting instructions
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\s+\./g, '.') // Fix orphaned periods
      .replace(/\s+,/g, ',') // Fix orphaned commas
      .replace(/\.\s*\./g, '.') // Remove double periods
      .replace(/,\s*,/g, ',') // Remove double commas
      .trim();
  }

  /**
   * Parse FDA label data into clean arrays
   */
  private parseTextToArray(text: string | string[] | undefined): string[] {
    if (!text) return [];

    const textStr = Array.isArray(text) ? text.join(' ') : text;

    // Clean up the text first
    const cleanText = this.cleanFDAText(textStr);

    // Split into meaningful paragraphs/sentences if too long
    if (cleanText.length > 500) {
      // Split by paragraph markers or sentence boundaries for key points
      const paragraphs = cleanText
        .split(/(?:\r?\n){2,}|(?<=\.)\s+(?=[A-Z][a-z])/)
        .map(p => p.trim())
        .filter((p) => p.length > 20 && !p.match(/^\d+$/)) // Filter out section numbers and short fragments
        .slice(0, 10); // Limit to 10 paragraphs

      return paragraphs.length > 0 ? paragraphs : [cleanText.substring(0, 1000) + '...'];
    }

    return cleanText ? [cleanText] : [];
  }

  /**
   * Sync safety info for a single drug
   */
  async syncDrugSafetyInfo(
    drugId: Types.ObjectId,
    genericName: string,
    brandName?: string,
  ): Promise<DrugSafetyInfoDocument> {
    let safetyInfo = await this.drugSafetyModel.findOne({ drug_id: drugId });

    const now = new Date();
    const nextSyncDue = moment(now).add(this.SYNC_INTERVAL_DAYS, 'days').toDate();

    try {
      const fdaData = await this.fetchFromFDA(genericName);

      if (!fdaData) {
        // No FDA data found
        if (safetyInfo) {
          safetyInfo.sync_status = 'no_data';
          safetyInfo.last_synced_at = now;
          safetyInfo.next_sync_due = nextSyncDue;
          safetyInfo.sync_error = 'No FDA labeling data found';
          await safetyInfo.save();
        } else {
          safetyInfo = await this.drugSafetyModel.create({
            drug_id: drugId,
            generic_name: genericName,
            brand_name: brandName,
            sync_status: 'no_data',
            last_synced_at: now,
            next_sync_due: nextSyncDue,
            sync_error: 'No FDA labeling data found',
            is_enabled: false,
            display_settings: {
              show_adverse_reactions: true,
              show_warnings: true,
              show_boxed_warning: true,
              show_contraindications: true,
              show_drug_interactions: true,
              show_pregnancy_info: true,
              show_custom_warnings: true,
            },
          });
        }
        return safetyInfo;
      }

      // Parse FDA data
      const parsedData = {
        adverse_reactions: this.parseTextToArray(fdaData.adverse_reactions),
        warnings: this.parseTextToArray(fdaData.warnings),
        warnings_and_cautions: this.parseTextToArray(fdaData.warnings_and_cautions),
        boxed_warning: this.parseTextToArray(fdaData.boxed_warning),
        contraindications: this.parseTextToArray(fdaData.contraindications),
        drug_interactions: this.parseTextToArray(fdaData.drug_interactions),
        pregnancy_or_breastfeeding: [
          ...this.parseTextToArray(fdaData.pregnancy),
          ...this.parseTextToArray(fdaData.nursing_mothers),
        ],
        geriatric_use: this.parseTextToArray(fdaData.geriatric_use),
        pediatric_use: this.parseTextToArray(fdaData.pediatric_use),
        overdosage: this.parseTextToArray(fdaData.overdosage),
      };

      const updateData = {
        ...parsedData,
        generic_name: fdaData.openfda?.generic_name?.[0] || genericName,
        brand_name: fdaData.openfda?.brand_name?.[0] || brandName,
        fda_spl_id: fdaData.openfda?.spl_id?.[0],
        source: 'OpenFDA',
        source_url: `${this.FDA_LABEL_API}?search=openfda.generic_name:"${encodeURIComponent(genericName)}"`,
        sync_status: 'success',
        last_synced_at: now,
        next_sync_due: nextSyncDue,
        sync_error: null,
        sync_attempts: 0,
        raw_fda_data: fdaData,
      };

      if (safetyInfo) {
        // Preserve admin customizations
        Object.assign(safetyInfo, updateData);
        await safetyInfo.save();
      } else {
        safetyInfo = await this.drugSafetyModel.create({
          drug_id: drugId,
          ...updateData,
          is_enabled: true,
          display_settings: {
            show_adverse_reactions: true,
            show_warnings: true,
            show_boxed_warning: true,
            show_contraindications: true,
            show_drug_interactions: true,
            show_pregnancy_info: true,
            show_custom_warnings: true,
          },
        });
      }

      this.logger.log(`Successfully synced safety info for: ${genericName}`);
      return safetyInfo;
    } catch (error) {
      // Handle sync failure
      const attempts = (safetyInfo?.sync_attempts || 0) + 1;

      if (safetyInfo) {
        safetyInfo.sync_status = 'failed';
        safetyInfo.sync_error = error.message;
        safetyInfo.sync_attempts = attempts;
        // Retry sooner if failed
        safetyInfo.next_sync_due = moment(now).add(1, 'days').toDate();
        await safetyInfo.save();
      } else {
        safetyInfo = await this.drugSafetyModel.create({
          drug_id: drugId,
          generic_name: genericName,
          brand_name: brandName,
          sync_status: 'failed',
          sync_error: error.message,
          sync_attempts: attempts,
          last_synced_at: now,
          next_sync_due: moment(now).add(1, 'days').toDate(),
          is_enabled: false,
          display_settings: {
            show_adverse_reactions: true,
            show_warnings: true,
            show_boxed_warning: true,
            show_contraindications: true,
            show_drug_interactions: true,
            show_pregnancy_info: true,
            show_custom_warnings: true,
          },
        });
      }

      this.logger.error(`Failed to sync safety info for ${genericName}: ${error.message}`);
      return safetyInfo;
    }
  }

  /**
   * Get safety info for a drug, syncing if needed
   */
  async getSafetyInfo(drugId: string): Promise<DrugSafetyInfoDocument | null> {
    const safetyInfo = await this.drugSafetyModel.findOne({
      drug_id: new Types.ObjectId(drugId),
    });

    return safetyInfo;
  }

  /**
   * Get safety info for patient display (filtered by display settings)
   */
  async getSafetyInfoForPatient(drugId: string): Promise<Record<string, any> | null> {
    const safetyInfo = await this.drugSafetyModel.findOne({
      drug_id: new Types.ObjectId(drugId),
      is_enabled: true,
    });

    if (!safetyInfo) return null;

    const settings = safetyInfo.display_settings || {};

    const result: Record<string, any> = {
      generic_name: safetyInfo.generic_name,
      brand_name: safetyInfo.brand_name,
      source: safetyInfo.source,
      last_updated: safetyInfo.last_synced_at,
    };

    if (settings.show_boxed_warning && safetyInfo.boxed_warning?.length) {
      result.boxed_warning = safetyInfo.boxed_warning;
    }

    if (settings.show_adverse_reactions && safetyInfo.adverse_reactions?.length) {
      result.adverse_reactions = safetyInfo.adverse_reactions;
    }

    if (settings.show_warnings && safetyInfo.warnings?.length) {
      result.warnings = safetyInfo.warnings;
    }

    if (settings.show_contraindications && safetyInfo.contraindications?.length) {
      result.contraindications = safetyInfo.contraindications;
    }

    if (settings.show_drug_interactions && safetyInfo.drug_interactions?.length) {
      result.drug_interactions = safetyInfo.drug_interactions;
    }

    if (settings.show_pregnancy_info && safetyInfo.pregnancy_or_breastfeeding?.length) {
      result.pregnancy_or_breastfeeding = safetyInfo.pregnancy_or_breastfeeding;
    }

    if (settings.show_custom_warnings && safetyInfo.custom_warnings?.length) {
      result.custom_warnings = safetyInfo.custom_warnings;
    }

    if (safetyInfo.custom_side_effects?.length) {
      result.custom_side_effects = safetyInfo.custom_side_effects;
    }

    return result;
  }

  /**
   * Sync safety info for all drugs that are due for sync
   * Called by cron job
   */
  async syncDueForUpdate(batchSize = 10): Promise<{
    processed: number;
    success: number;
    failed: number;
  }> {
    const now = new Date();

    // Find drugs due for sync
    const dueForSync = await this.drugSafetyModel
      .find({
        $or: [
          { next_sync_due: { $lte: now } },
          { sync_status: 'pending' },
          { sync_status: 'failed', sync_attempts: { $lt: this.MAX_RETRIES } },
        ],
      })
      .limit(batchSize)
      .exec();

    let success = 0;
    let failed = 0;

    for (const safetyInfo of dueForSync) {
      try {
        await this.syncDrugSafetyInfo(
          safetyInfo.drug_id,
          safetyInfo.generic_name,
          safetyInfo.brand_name,
        );
        success++;
      } catch (error) {
        this.logger.error(
          `Failed to sync ${safetyInfo.generic_name}: ${error.message}`,
        );
        failed++;
      }

      // Rate limiting - wait 200ms between requests
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    return { processed: dueForSync.length, success, failed };
  }

  /**
   * Initialize safety info for a drug that doesn't have one yet
   */
  async initializeSafetyInfo(drug: DrugDocument): Promise<DrugSafetyInfoDocument> {
    const existing = await this.drugSafetyModel.findOne({ drug_id: drug._id });

    if (existing) {
      return existing;
    }

    return this.syncDrugSafetyInfo(
      drug._id as Types.ObjectId,
      drug.generic_name,
      drug.name,
    );
  }

  /**
   * Manually trigger sync for a specific drug
   */
  async triggerManualSync(drugId: string): Promise<DrugSafetyInfoDocument> {
    const drug = await this.drugModel.findById(drugId);

    if (!drug) {
      throw new Error('Drug not found');
    }

    return this.syncDrugSafetyInfo(
      drug._id as Types.ObjectId,
      drug.generic_name,
      drug.name,
    );
  }

  /**
   * Update admin customizations
   */
  async updateCustomizations(
    drugId: string,
    customizations: {
      custom_warnings?: {
        title: string;
        content: string;
        severity: 'info' | 'warning' | 'danger';
      }[];
      custom_side_effects?: {
        name: string;
        frequency?: string;
        severity?: string;
        description?: string;
      }[];
      admin_notes?: string;
      display_settings?: {
        show_adverse_reactions?: boolean;
        show_warnings?: boolean;
        show_boxed_warning?: boolean;
        show_contraindications?: boolean;
        show_drug_interactions?: boolean;
        show_pregnancy_info?: boolean;
        show_custom_warnings?: boolean;
      };
      is_enabled?: boolean;
    },
    adminId: Types.ObjectId,
  ): Promise<DrugSafetyInfoDocument | null> {
    const safetyInfo = await this.drugSafetyModel.findOne({
      drug_id: new Types.ObjectId(drugId),
    });

    if (!safetyInfo) {
      return null;
    }

    if (customizations.custom_warnings !== undefined) {
      safetyInfo.custom_warnings = customizations.custom_warnings;
    }

    if (customizations.custom_side_effects !== undefined) {
      safetyInfo.custom_side_effects = customizations.custom_side_effects;
    }

    if (customizations.admin_notes !== undefined) {
      safetyInfo.admin_notes = customizations.admin_notes;
    }

    if (customizations.display_settings) {
      safetyInfo.display_settings = {
        ...safetyInfo.display_settings,
        ...customizations.display_settings,
      };
    }

    if (customizations.is_enabled !== undefined) {
      safetyInfo.is_enabled = customizations.is_enabled;
    }

    safetyInfo.is_manually_curated = true;
    safetyInfo.last_modified_by = adminId;

    await safetyInfo.save();
    return safetyInfo;
  }

  /**
   * Check drug interactions using OpenFDA drug label data
   * This searches for mentions of other drugs in the drug_interactions field
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
    if (!drugNames || drugNames.length < 2) {
      return { hasInteractions: false, interactions: [] };
    }

    const interactions: Array<{
      severity: 'high' | 'moderate' | 'low';
      drug1: string;
      drug2: string;
      description: string;
      source: string;
    }> = [];

    try {
      // For each drug, fetch its FDA label and check drug_interactions
      for (const primaryDrug of drugNames) {
        const fdaData = await this.fetchFromFDA(primaryDrug);
        if (!fdaData?.drug_interactions?.length) continue;

        const interactionText = fdaData.drug_interactions.join(' ').toLowerCase();

        // Check if any other drugs are mentioned in the interaction text
        for (const otherDrug of drugNames) {
          if (otherDrug === primaryDrug) continue;

          // Normalize for matching
          const searchTerms = [
            otherDrug.toLowerCase(),
            ...getAlternateNames(otherDrug).map(n => n.toLowerCase()),
          ];

          for (const searchTerm of searchTerms) {
            if (interactionText.includes(searchTerm)) {
              // Check if we already have this interaction pair
              const existingInteraction = interactions.find(
                i => (i.drug1.toLowerCase() === primaryDrug.toLowerCase() &&
                      i.drug2.toLowerCase() === otherDrug.toLowerCase()) ||
                     (i.drug1.toLowerCase() === otherDrug.toLowerCase() &&
                      i.drug2.toLowerCase() === primaryDrug.toLowerCase())
              );

              if (!existingInteraction) {
                // Extract relevant portion of interaction text
                const sentences = fdaData.drug_interactions.join(' ')
                  .split(/[.!?]/)
                  .filter(s => s.toLowerCase().includes(searchTerm))
                  .slice(0, 2);

                const description = sentences.length > 0
                  ? this.cleanFDAText(sentences.join('. ') + '.')
                  : `Potential interaction detected between ${primaryDrug} and ${otherDrug} according to FDA drug labeling.`;

                // Determine severity based on keywords
                const severity = this.determineSeverity(description);

                interactions.push({
                  severity,
                  drug1: primaryDrug,
                  drug2: otherDrug,
                  description: description.substring(0, 500),
                  source: 'OpenFDA',
                });
              }
              break;
            }
          }
        }
      }

      return {
        hasInteractions: interactions.length > 0,
        interactions,
      };
    } catch (error) {
      this.logger.error('Error checking drug interactions via OpenFDA:', error.message);
      return { hasInteractions: false, interactions: [] };
    }
  }

  /**
   * Determine severity based on FDA text content
   */
  private determineSeverity(text: string): 'high' | 'moderate' | 'low' {
    const loweredText = text.toLowerCase();

    // High severity keywords
    if (
      loweredText.includes('contraindicated') ||
      loweredText.includes('do not use') ||
      loweredText.includes('life-threatening') ||
      loweredText.includes('fatal') ||
      loweredText.includes('death') ||
      loweredText.includes('serious') ||
      loweredText.includes('severe') ||
      loweredText.includes('avoid') ||
      loweredText.includes('never')
    ) {
      return 'high';
    }

    // Moderate severity keywords
    if (
      loweredText.includes('caution') ||
      loweredText.includes('monitor') ||
      loweredText.includes('adjust') ||
      loweredText.includes('may increase') ||
      loweredText.includes('may decrease') ||
      loweredText.includes('significant')
    ) {
      return 'moderate';
    }

    return 'low';
  }

  /**
   * Get sync statistics
   */
  async getSyncStats(): Promise<{
    total: number;
    synced: number;
    pending: number;
    failed: number;
    noData: number;
    enabled: number;
  }> {
    const [total, synced, pending, failed, noData, enabled] = await Promise.all([
      this.drugSafetyModel.countDocuments(),
      this.drugSafetyModel.countDocuments({ sync_status: 'success' }),
      this.drugSafetyModel.countDocuments({ sync_status: 'pending' }),
      this.drugSafetyModel.countDocuments({ sync_status: 'failed' }),
      this.drugSafetyModel.countDocuments({ sync_status: 'no_data' }),
      this.drugSafetyModel.countDocuments({ is_enabled: true }),
    ]);

    return { total, synced, pending, failed, noData, enabled };
  }

  /**
   * Check if Claude AI is available for summarization
   */
  isAIAvailable(): boolean {
    return this.claudeAIService.isAvailable();
  }

  /**
   * Generate AI summary for drug safety info using Claude
   * Admin-triggered to control API costs
   */
  async generateAISummary(drugId: string): Promise<DrugSafetyInfoDocument> {
    const safetyInfo = await this.drugSafetyModel.findOne({
      drug_id: new Types.ObjectId(drugId),
    });

    if (!safetyInfo) {
      throw new Error('Drug safety information not found. Please sync from FDA first.');
    }

    if (!this.claudeAIService.isAvailable()) {
      throw new Error('Claude AI service is not available. Please check API configuration.');
    }

    // Check if we have any FDA data to summarize
    const hasData =
      safetyInfo.adverse_reactions?.length > 0 ||
      safetyInfo.warnings?.length > 0 ||
      safetyInfo.boxed_warning?.length > 0 ||
      safetyInfo.contraindications?.length > 0 ||
      safetyInfo.drug_interactions?.length > 0;

    if (!hasData) {
      throw new Error('No FDA data available to summarize. Please sync from FDA first.');
    }

    this.logger.log(`Generating AI summary for drug: ${safetyInfo.generic_name}`);

    try {
      const result = await this.claudeAIService.summarizeDrugSafetyInfo({
        generic_name: safetyInfo.generic_name,
        brand_name: safetyInfo.brand_name,
        adverse_reactions: safetyInfo.adverse_reactions || [],
        warnings: safetyInfo.warnings || [],
        warnings_and_cautions: safetyInfo.warnings_and_cautions || [],
        boxed_warning: safetyInfo.boxed_warning || [],
        contraindications: safetyInfo.contraindications || [],
        drug_interactions: safetyInfo.drug_interactions || [],
        pregnancy_or_breastfeeding: safetyInfo.pregnancy_or_breastfeeding || [],
        geriatric_use: safetyInfo.geriatric_use || [],
        pediatric_use: safetyInfo.pediatric_use || [],
        overdosage: safetyInfo.overdosage || [],
      });

      if (!result) {
        throw new Error('AI summarization failed. Please try again later.');
      }

      // Update the safety info with AI summary
      safetyInfo.ai_summary = result.summary;
      safetyInfo.ai_summary_generated_at = new Date();
      safetyInfo.ai_model_used = result.model;
      safetyInfo.has_ai_summary = true;

      await safetyInfo.save();

      this.logger.log(`Successfully generated AI summary for: ${safetyInfo.generic_name}`);
      return safetyInfo;
    } catch (error) {
      this.logger.error(`Failed to generate AI summary for ${safetyInfo.generic_name}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get safety info for patient display with AI summary (if available)
   * Shows AI summary by default, with option to view full FDA data
   */
  async getSafetyInfoForPatientWithAI(drugId: string): Promise<{
    ai_summary?: Record<string, any>;
    full_info: Record<string, any>;
    has_ai_summary: boolean;
    last_updated: Date;
    patient_display_mode: 'ai_only' | 'fda_only' | 'both';
  } | null> {
    const safetyInfo = await this.drugSafetyModel.findOne({
      drug_id: new Types.ObjectId(drugId),
      is_enabled: true,
    });

    if (!safetyInfo) return null;

    const settings = safetyInfo.display_settings || {};

    // Build full FDA info (filtered by display settings)
    const fullInfo: Record<string, any> = {
      generic_name: safetyInfo.generic_name,
      brand_name: safetyInfo.brand_name,
      source: safetyInfo.source,
    };

    if (settings.show_boxed_warning && safetyInfo.boxed_warning?.length) {
      fullInfo.boxed_warning = safetyInfo.boxed_warning;
    }

    if (settings.show_adverse_reactions && safetyInfo.adverse_reactions?.length) {
      fullInfo.adverse_reactions = safetyInfo.adverse_reactions;
    }

    if (settings.show_warnings && safetyInfo.warnings?.length) {
      fullInfo.warnings = safetyInfo.warnings;
    }

    if (safetyInfo.warnings_and_cautions?.length) {
      fullInfo.warnings_and_cautions = safetyInfo.warnings_and_cautions;
    }

    if (settings.show_contraindications && safetyInfo.contraindications?.length) {
      fullInfo.contraindications = safetyInfo.contraindications;
    }

    if (settings.show_drug_interactions && safetyInfo.drug_interactions?.length) {
      fullInfo.drug_interactions = safetyInfo.drug_interactions;
    }

    if (safetyInfo.food_safety_warning?.length) {
      fullInfo.food_safety_warning = safetyInfo.food_safety_warning;
    }

    if (settings.show_pregnancy_info && safetyInfo.pregnancy_or_breastfeeding?.length) {
      fullInfo.pregnancy_or_breastfeeding = safetyInfo.pregnancy_or_breastfeeding;
    }

    if (safetyInfo.geriatric_use?.length) {
      fullInfo.geriatric_use = safetyInfo.geriatric_use;
    }

    if (safetyInfo.pediatric_use?.length) {
      fullInfo.pediatric_use = safetyInfo.pediatric_use;
    }

    if (safetyInfo.overdosage?.length) {
      fullInfo.overdosage = safetyInfo.overdosage;
    }

    if (settings.show_custom_warnings && safetyInfo.custom_warnings?.length) {
      fullInfo.custom_warnings = safetyInfo.custom_warnings;
    }

    if (safetyInfo.custom_side_effects?.length) {
      fullInfo.custom_side_effects = safetyInfo.custom_side_effects;
    }

    const result: {
      ai_summary?: Record<string, any>;
      full_info: Record<string, any>;
      has_ai_summary: boolean;
      last_updated: Date;
      patient_display_mode: 'ai_only' | 'fda_only' | 'both';
    } = {
      full_info: fullInfo,
      has_ai_summary: safetyInfo.has_ai_summary || false,
      last_updated: safetyInfo.last_synced_at,
      patient_display_mode: safetyInfo.patient_display_mode || 'both',
    };

    // Add AI summary if available
    if (safetyInfo.has_ai_summary && safetyInfo.ai_summary) {
      result.ai_summary = {
        overview: safetyInfo.ai_summary.overview,
        key_warnings: safetyInfo.ai_summary.key_warnings,
        common_side_effects: safetyInfo.ai_summary.common_side_effects,
        serious_side_effects: safetyInfo.ai_summary.serious_side_effects,
        who_should_avoid: safetyInfo.ai_summary.who_should_avoid,
        drug_interactions_summary: safetyInfo.ai_summary.drug_interactions_summary,
        food_interactions_summary: safetyInfo.ai_summary.food_interactions_summary || [],
        pregnancy_summary: safetyInfo.ai_summary.pregnancy_summary,
        usage_tips: safetyInfo.ai_summary.usage_tips,
        generated_at: safetyInfo.ai_summary_generated_at,
      };
    }

    return result;
  }
}
