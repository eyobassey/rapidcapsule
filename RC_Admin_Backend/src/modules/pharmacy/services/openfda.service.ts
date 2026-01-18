import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  DrugSafetyInfo,
  DrugSafetyInfoDocument,
} from '../entities/drug-safety-info.entity';
import { DrugEntity, DrugDocument } from '../entities/drug.entity';
import { ClaudeAIService } from './claude-ai.service';

const FDA_API_BASE = 'https://api.fda.gov/drug/label.json';
const SYNC_INTERVAL_DAYS = 30;

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

  constructor(
    @InjectModel(DrugSafetyInfo.name)
    private safetyInfoModel: Model<DrugSafetyInfoDocument>,
    @InjectModel(DrugEntity.name)
    private drugModel: Model<DrugDocument>,
    private claudeAIService: ClaudeAIService,
  ) {}

  /**
   * Get safety info for admin view (includes all metadata)
   */
  async getSafetyInfo(drugId: string): Promise<DrugSafetyInfoDocument | null> {
    const safetyInfo = await this.safetyInfoModel.findOne({
      drug_id: new Types.ObjectId(drugId),
    });
    return safetyInfo;
  }

  /**
   * Trigger manual sync for a drug
   */
  async triggerManualSync(drugId: string): Promise<DrugSafetyInfoDocument> {
    const drug = await this.drugModel.findById(drugId);
    if (!drug) {
      throw new NotFoundException('Drug not found');
    }

    return this.syncDrugSafetyInfo(drug);
  }

  /**
   * Sync safety info from FDA API
   */
  async syncDrugSafetyInfo(drug: DrugDocument): Promise<DrugSafetyInfoDocument> {
    const genericName = drug.generic_name || drug.name;
    const brandName = drug.brand_name;

    try {
      const fdaData = await this.fetchFromFDA(genericName, brandName);

      // Find or create safety info record
      let safetyInfo = await this.safetyInfoModel.findOne({
        drug_id: drug._id,
      });

      if (!safetyInfo) {
        safetyInfo = new this.safetyInfoModel({
          drug_id: drug._id,
          generic_name: genericName,
          brand_name: drug.brand_name,
        });
      }

      if (fdaData) {
        // Parse and update FDA data
        safetyInfo.adverse_reactions = this.extractSection(fdaData, 'adverse_reactions');
        safetyInfo.warnings = this.extractSection(fdaData, 'warnings');
        safetyInfo.warnings_and_cautions = this.extractSection(fdaData, 'warnings_and_cautions');
        safetyInfo.boxed_warning = this.extractSection(fdaData, 'boxed_warning');
        safetyInfo.contraindications = this.extractSection(fdaData, 'contraindications');
        safetyInfo.drug_interactions = this.extractSection(fdaData, 'drug_interactions');
        safetyInfo.food_safety_warning = this.extractSection(fdaData, 'food_safety_warning');
        safetyInfo.pregnancy_or_breastfeeding = this.extractSection(fdaData, 'pregnancy');
        safetyInfo.geriatric_use = this.extractSection(fdaData, 'geriatric_use');
        safetyInfo.pediatric_use = this.extractSection(fdaData, 'pediatric_use');
        safetyInfo.overdosage = this.extractSection(fdaData, 'overdosage');

        safetyInfo.fda_spl_id = fdaData.id || fdaData.set_id;
        safetyInfo.raw_fda_data = fdaData;
        safetyInfo.sync_status = 'synced';
        safetyInfo.sync_error = null;
      } else {
        safetyInfo.sync_status = 'no_data';
        safetyInfo.sync_error = 'No FDA data found for this drug';
      }

      safetyInfo.last_synced_at = new Date();
      safetyInfo.next_sync_due = new Date(
        Date.now() + SYNC_INTERVAL_DAYS * 24 * 60 * 60 * 1000,
      );
      safetyInfo.sync_attempts += 1;
      safetyInfo.source = 'OpenFDA';
      safetyInfo.source_url = `${FDA_API_BASE}?search=openfda.generic_name:"${encodeURIComponent(genericName)}"`;

      await safetyInfo.save();
      return safetyInfo;
    } catch (error) {
      this.logger.error(`Failed to sync FDA data for ${genericName}: ${error.message}`);

      // Update or create record with error status
      let safetyInfo = await this.safetyInfoModel.findOne({
        drug_id: drug._id,
      });

      if (!safetyInfo) {
        safetyInfo = new this.safetyInfoModel({
          drug_id: drug._id,
          generic_name: genericName,
          brand_name: drug.brand_name,
        });
      }

      safetyInfo.sync_status = 'failed';
      safetyInfo.sync_error = error.message;
      safetyInfo.sync_attempts += 1;
      safetyInfo.last_synced_at = new Date();

      await safetyInfo.save();
      return safetyInfo;
    }
  }

  /**
   * Fetch drug label data from FDA API
   */
  private async fetchFromFDA(genericName: string, brandName?: string): Promise<any | null> {
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
  private async fetchFromFDAByName(name: string): Promise<any | null> {
    try {
      const searchQuery = `openfda.generic_name:"${name}"`;
      const url = `${FDA_API_BASE}?search=${encodeURIComponent(searchQuery)}&limit=1`;

      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`FDA API returned ${response.status}`);
      }

      const data = await response.json();

      if (data.results && data.results.length > 0) {
        return data.results[0];
      }

      return null;
    } catch (error) {
      this.logger.warn(`FDA API error for ${name}: ${error.message}`);
      return null;
    }
  }

  /**
   * Fallback search by brand name
   */
  private async fetchFromFDAByBrand(name: string): Promise<any | null> {
    try {
      const searchQuery = `openfda.brand_name:"${name}"`;
      const url = `${FDA_API_BASE}?search=${encodeURIComponent(searchQuery)}&limit=1`;

      const response = await fetch(url);

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.results?.[0] || null;
    } catch {
      return null;
    }
  }

  /**
   * Extract a section from FDA data - returns full unredacted text
   * Now that we have AI summaries for patient-friendly versions,
   * we keep the full FDA text for the detailed view
   */
  private extractSection(fdaData: any, key: string): string[] {
    const rawData = fdaData[key];
    if (!rawData) return [];

    const items = Array.isArray(rawData) ? rawData : [rawData];
    return items
      .map((item) => this.cleanText(item))
      .filter((item) => item.length > 0);
    // No longer limiting items - show full FDA data
  }

  /**
   * Clean FDA text - only removes HTML tags and normalizes whitespace
   * Keeps all references, section numbers, and other FDA content intact
   */
  private cleanText(text: string): string {
    if (!text || typeof text !== 'string') return '';
    return text
      .replace(/<[^>]*>/g, '') // Remove HTML tags only
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    // No longer removing references, section numbers, or limiting length
    // AI summary provides patient-friendly version, this is the full FDA text
  }

  /**
   * Update admin customizations
   */
  async updateCustomizations(
    drugId: string,
    updateDto: {
      custom_warnings?: any[];
      custom_side_effects?: any[];
      admin_notes?: string;
      display_settings?: any;
      is_enabled?: boolean;
      patient_display_mode?: 'ai_only' | 'fda_only' | 'both';
    },
    adminId: Types.ObjectId,
  ): Promise<DrugSafetyInfoDocument> {
    let safetyInfo = await this.safetyInfoModel.findOne({
      drug_id: new Types.ObjectId(drugId),
    });

    if (!safetyInfo) {
      // Create new record if doesn't exist
      const drug = await this.drugModel.findById(drugId);
      if (!drug) {
        throw new NotFoundException('Drug not found');
      }

      safetyInfo = new this.safetyInfoModel({
        drug_id: new Types.ObjectId(drugId),
        generic_name: drug.generic_name || drug.name,
        brand_name: drug.brand_name,
        sync_status: 'pending',
      });
    }

    // Update provided fields
    if (updateDto.custom_warnings !== undefined) {
      safetyInfo.custom_warnings = updateDto.custom_warnings;
    }
    if (updateDto.custom_side_effects !== undefined) {
      safetyInfo.custom_side_effects = updateDto.custom_side_effects;
    }
    if (updateDto.admin_notes !== undefined) {
      safetyInfo.admin_notes = updateDto.admin_notes;
    }
    if (updateDto.display_settings !== undefined) {
      safetyInfo.display_settings = {
        ...safetyInfo.display_settings,
        ...updateDto.display_settings,
      };
    }
    if (updateDto.is_enabled !== undefined) {
      safetyInfo.is_enabled = updateDto.is_enabled;
    }
    if (updateDto.patient_display_mode !== undefined) {
      safetyInfo.patient_display_mode = updateDto.patient_display_mode;
    }

    safetyInfo.is_manually_curated = true;
    safetyInfo.last_modified_by = adminId;

    await safetyInfo.save();
    return safetyInfo;
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
  }> {
    const totalDrugs = await this.drugModel.countDocuments({ is_active: true });

    const stats = await this.safetyInfoModel.aggregate([
      {
        $group: {
          _id: '$sync_status',
          count: { $sum: 1 },
        },
      },
    ]);

    const statsMap = stats.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    return {
      total: totalDrugs,
      synced: statsMap['synced'] || 0,
      pending: statsMap['pending'] || 0,
      failed: statsMap['failed'] || 0,
      noData: statsMap['no_data'] || 0,
    };
  }

  /**
   * Sync drugs that are due for update
   */
  async syncDueForUpdate(
    batchSize = 10,
  ): Promise<{ processed: number; success: number; failed: number }> {
    const now = new Date();

    // Find drugs due for sync
    const dueForSync = await this.safetyInfoModel
      .find({
        $or: [
          { next_sync_due: { $lte: now } },
          { sync_status: 'pending' },
          { sync_status: 'failed', sync_attempts: { $lt: 3 } },
        ],
      })
      .limit(batchSize)
      .populate('drug_id');

    let success = 0;
    let failed = 0;

    for (const safetyInfo of dueForSync) {
      try {
        if (safetyInfo.drug_id) {
          await this.syncDrugSafetyInfo(safetyInfo.drug_id as any);
          success++;
        }
      } catch (error) {
        this.logger.error(`Sync failed for drug: ${error.message}`);
        failed++;
      }

      // Rate limit: wait 200ms between requests
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    return {
      processed: dueForSync.length,
      success,
      failed,
    };
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
    const safetyInfo = await this.safetyInfoModel.findOne({
      drug_id: new Types.ObjectId(drugId),
    });

    if (!safetyInfo) {
      throw new NotFoundException('Drug safety information not found. Please sync from FDA first.');
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
        food_safety_warning: safetyInfo.food_safety_warning || [],
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
}
