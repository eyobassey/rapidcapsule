import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ClaudeAIService } from './claude-ai.service';
import { OpenFDAService } from './openfda.service';

export interface DrugInteraction {
  severity: 'high' | 'moderate' | 'low';
  drug1: string;
  drug2: string;
  description: string;
  source: string;
}

export interface InteractionCheckResult {
  hasInteractions: boolean;
  interactions: DrugInteraction[];
  disclaimer: string;
  checkedAt: Date;
  sourcesUsed: string[];
}

export type DataSource = 'rxnav' | 'claude_ai' | 'openfda';

@Injectable()
export class DrugInteractionService {
  private readonly logger = new Logger(DrugInteractionService.name);
  private readonly RXNAV_BASE_URL = 'https://rxnav.nlm.nih.gov/REST';

  // Simple in-memory cache (in production, use Redis)
  private interactionCache = new Map<string, { result: InteractionCheckResult; timestamp: number }>();
  private readonly CACHE_TTL = 1000 * 60 * 60; // 1 hour

  constructor(
    private readonly httpService: HttpService,
    private readonly claudeAIService: ClaudeAIService,
    private readonly openFDAService: OpenFDAService,
  ) {}

  /**
   * Check for drug interactions between multiple drugs using configured data sources
   * @param drugNames Array of drug names to check
   * @param dataSources Array of enabled data sources (in priority order)
   * @returns Interaction check result
   */
  async checkInteractions(
    drugNames: string[],
    dataSources: DataSource[] = ['claude_ai', 'openfda'],
  ): Promise<InteractionCheckResult> {
    if (!drugNames || drugNames.length < 2) {
      return {
        hasInteractions: false,
        interactions: [],
        disclaimer: 'At least two drugs are required to check for interactions.',
        checkedAt: new Date(),
        sourcesUsed: [],
      };
    }

    // Create cache key including sources
    const cacheKey = `${drugNames.sort().join('|').toLowerCase()}:${dataSources.sort().join(',')}`;
    const cached = this.interactionCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      this.logger.debug(`Returning cached interaction result for: ${cacheKey}`);
      return cached.result;
    }

    const allInteractions: DrugInteraction[] = [];
    const sourcesUsed: string[] = [];

    // Check each enabled data source
    for (const source of dataSources) {
      try {
        let sourceInteractions: DrugInteraction[] = [];

        switch (source) {
          case 'claude_ai':
            sourceInteractions = await this.checkWithClaudeAI(drugNames);
            if (sourceInteractions.length > 0) sourcesUsed.push('Claude AI');
            break;

          case 'openfda':
            sourceInteractions = await this.checkWithOpenFDA(drugNames);
            if (sourceInteractions.length > 0) sourcesUsed.push('OpenFDA');
            break;

          case 'rxnav':
            sourceInteractions = await this.checkWithRxNav(drugNames);
            if (sourceInteractions.length > 0) sourcesUsed.push('RxNav');
            break;
        }

        // Add non-duplicate interactions
        for (const interaction of sourceInteractions) {
          const exists = allInteractions.some(
            i => (i.drug1.toLowerCase() === interaction.drug1.toLowerCase() &&
                  i.drug2.toLowerCase() === interaction.drug2.toLowerCase()) ||
                 (i.drug1.toLowerCase() === interaction.drug2.toLowerCase() &&
                  i.drug2.toLowerCase() === interaction.drug1.toLowerCase())
          );

          if (!exists) {
            allInteractions.push(interaction);
          }
        }
      } catch (error) {
        this.logger.error(`Error checking interactions with ${source}: ${error.message}`);
      }
    }

    // Sort by severity (high first)
    allInteractions.sort((a, b) => {
      const severityOrder = { high: 0, moderate: 1, low: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });

    const result: InteractionCheckResult = {
      hasInteractions: allInteractions.length > 0,
      interactions: allInteractions,
      disclaimer: 'This information is for reference only. Always consult your pharmacist or doctor before taking multiple medications together.',
      checkedAt: new Date(),
      sourcesUsed,
    };

    // Cache the result
    this.interactionCache.set(cacheKey, { result, timestamp: Date.now() });

    return result;
  }

  /**
   * Check interactions using Claude AI
   */
  private async checkWithClaudeAI(drugNames: string[]): Promise<DrugInteraction[]> {
    try {
      const result = await this.claudeAIService.checkDrugInteractions(drugNames);
      return result.interactions;
    } catch (error) {
      this.logger.error('Claude AI interaction check failed:', error.message);
      return [];
    }
  }

  /**
   * Check interactions using OpenFDA
   */
  private async checkWithOpenFDA(drugNames: string[]): Promise<DrugInteraction[]> {
    try {
      const result = await this.openFDAService.checkDrugInteractions(drugNames);
      return result.interactions;
    } catch (error) {
      this.logger.error('OpenFDA interaction check failed:', error.message);
      return [];
    }
  }

  /**
   * Check interactions using RxNav API (DrugBank + ONCHigh)
   * Note: RxNav Drug Interaction API was discontinued in January 2024
   * This method is kept for potential future re-enablement or private API access
   */
  private async checkWithRxNav(drugNames: string[]): Promise<DrugInteraction[]> {
    try {
      // Step 1: Get RxCUI for each drug name
      const rxcuis = await this.getRxCuisForDrugs(drugNames);

      if (rxcuis.length < 2) {
        this.logger.warn(`Could not find RxCUI for enough drugs. Found: ${rxcuis.length}`);
        return [];
      }

      // Step 2: Check interactions using RxNav API
      return await this.getInteractionsFromRxNav(rxcuis);
    } catch (error) {
      this.logger.error(`RxNav interaction check failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Get RxCUI identifiers for drug names
   */
  private async getRxCuisForDrugs(drugNames: string[]): Promise<{ rxcui: string; name: string }[]> {
    const rxcuis: { rxcui: string; name: string }[] = [];

    for (const drugName of drugNames) {
      try {
        // Try to get RxCUI using approximate match
        const url = `${this.RXNAV_BASE_URL}/approximateTerm.json?term=${encodeURIComponent(drugName)}&maxEntries=1`;
        const response = await firstValueFrom(this.httpService.get(url));

        const candidates = response.data?.approximateGroup?.candidate;
        if (candidates && candidates.length > 0) {
          rxcuis.push({
            rxcui: candidates[0].rxcui,
            name: drugName,
          });
        } else {
          // Try exact match as fallback
          const exactUrl = `${this.RXNAV_BASE_URL}/rxcui.json?name=${encodeURIComponent(drugName)}`;
          const exactResponse = await firstValueFrom(this.httpService.get(exactUrl));

          const rxcui = exactResponse.data?.idGroup?.rxnormId?.[0];
          if (rxcui) {
            rxcuis.push({ rxcui, name: drugName });
          }
        }
      } catch (error) {
        this.logger.warn(`Could not find RxCUI for drug: ${drugName}`);
      }
    }

    return rxcuis;
  }

  /**
   * Get interactions from RxNav API
   */
  private async getInteractionsFromRxNav(
    rxcuis: { rxcui: string; name: string }[]
  ): Promise<DrugInteraction[]> {
    const interactions: DrugInteraction[] = [];
    const rxcuiList = rxcuis.map(r => r.rxcui).join('+');

    try {
      const url = `${this.RXNAV_BASE_URL}/interaction/list.json?rxcuis=${rxcuiList}`;
      const response = await firstValueFrom(this.httpService.get(url));

      const interactionGroups = response.data?.fullInteractionTypeGroup;

      if (!interactionGroups) {
        return [];
      }

      for (const group of interactionGroups) {
        const interactionTypes = group.fullInteractionType || [];

        for (const interactionType of interactionTypes) {
          const interactionPairs = interactionType.interactionPair || [];

          for (const pair of interactionPairs) {
            const severity = this.parseSeverity(pair.severity || interactionType.comment);
            const drug1Name = pair.interactionConcept?.[0]?.minConceptItem?.name || 'Unknown';
            const drug2Name = pair.interactionConcept?.[1]?.minConceptItem?.name || 'Unknown';

            // Avoid duplicates
            const existingInteraction = interactions.find(
              i => (i.drug1 === drug1Name && i.drug2 === drug2Name) ||
                   (i.drug1 === drug2Name && i.drug2 === drug1Name)
            );

            if (!existingInteraction) {
              interactions.push({
                severity,
                drug1: drug1Name,
                drug2: drug2Name,
                description: pair.description || 'Potential interaction detected.',
                source: group.sourceName || 'RxNav',
              });
            }
          }
        }
      }
    } catch (error) {
      this.logger.error(`Error fetching interactions from RxNav: ${error.message}`);
    }

    return interactions;
  }

  /**
   * Parse severity from RxNav response
   */
  private parseSeverity(severityText: string): 'high' | 'moderate' | 'low' {
    if (!severityText) return 'moderate';

    const text = severityText.toLowerCase();

    if (text.includes('high') || text.includes('severe') || text.includes('serious') || text.includes('major')) {
      return 'high';
    } else if (text.includes('moderate') || text.includes('significant')) {
      return 'moderate';
    } else if (text.includes('low') || text.includes('minor') || text.includes('mild')) {
      return 'low';
    }

    return 'moderate';
  }

  /**
   * Clear the interaction cache
   */
  clearCache(): void {
    this.interactionCache.clear();
    this.logger.log('Drug interaction cache cleared');
  }
}
