import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  PubMedSearchParams,
  PubMedSearchResult,
  PubMedCitation,
  DrugEvidenceSummary,
  EvidenceLevel,
  EvidenceRating,
  ESearchResponse,
  ESummaryResponse,
  ArticleSummary,
} from '../dto/pubmed.dto';

/**
 * PubMed E-utilities Service
 * Fetches clinical evidence from PubMed to ground RxGPT recommendations
 *
 * API Documentation: https://www.ncbi.nlm.nih.gov/books/NBK25500/
 * Rate Limits: 3 requests/second without API key, 10/second with key
 */
@Injectable()
export class PubMedService {
  private readonly logger = new Logger(PubMedService.name);
  private readonly BASE_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
  private readonly CACHE_DURATION_HOURS = 24; // Cache results for 24 hours
  private readonly MAX_RESULTS_DEFAULT = 5;
  private readonly REQUEST_DELAY_MS = 350; // ~3 requests/second rate limit
  private lastRequestTime = 0;

  // Simple in-memory cache (could be replaced with Redis in production)
  private cache: Map<string, { data: DrugEvidenceSummary; expires: Date }> = new Map();

  constructor(
    @InjectModel('User') private readonly userModel: Model<any>,
  ) {}

  /**
   * Search for clinical evidence for a drug and optionally a condition
   */
  async searchDrugEvidence(params: PubMedSearchParams): Promise<DrugEvidenceSummary> {
    const cacheKey = this.buildCacheKey(params);

    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      this.logger.log(`[PubMed] Cache hit for: ${params.drug_name}`);
      return cached;
    }

    this.logger.log(`[PubMed] Searching evidence for: ${params.drug_name}${params.condition ? ` + ${params.condition}` : ''}`);

    try {
      // Step 1: Search for PMIDs
      const pmids = await this.searchArticles(params);

      if (pmids.length === 0) {
        return this.buildEmptyResult(params);
      }

      // Step 2: Fetch article summaries
      const articles = await this.fetchArticleSummaries(pmids);

      // Step 3: Build citations with evidence grading
      const citations = this.buildCitations(articles, params);

      // Step 4: Build summary
      const summary = this.buildEvidenceSummary(params, citations);

      // Cache the result
      this.setCache(cacheKey, summary);

      return summary;
    } catch (error) {
      this.logger.error(`[PubMed] Error searching for ${params.drug_name}: ${error.message}`);
      return this.buildEmptyResult(params);
    }
  }

  /**
   * Get evidence for multiple drugs (batch operation)
   */
  async searchMultipleDrugsEvidence(
    drugs: Array<{ drug_name: string; condition?: string }>,
  ): Promise<Map<string, DrugEvidenceSummary>> {
    const results = new Map<string, DrugEvidenceSummary>();

    for (const drug of drugs) {
      const evidence = await this.searchDrugEvidence({
        drug_name: drug.drug_name,
        condition: drug.condition,
        max_results: 3, // Fewer results per drug for batch
      });
      results.set(drug.drug_name, evidence);
    }

    return results;
  }

  /**
   * Search PubMed for article PMIDs
   */
  private async searchArticles(params: PubMedSearchParams): Promise<string[]> {
    await this.respectRateLimit();

    const query = this.buildSearchQuery(params);
    const maxResults = params.max_results || this.MAX_RESULTS_DEFAULT;
    const sort = params.sort === 'date' ? 'pub+date' : 'relevance';

    const url = `${this.BASE_URL}/esearch.fcgi?` +
      `db=pubmed&` +
      `term=${encodeURIComponent(query)}&` +
      `retmax=${maxResults}&` +
      `sort=${sort}&` +
      `retmode=json`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`PubMed API error: ${response.status}`);
      }

      const data: ESearchResponse = await response.json();
      const pmids = data.esearchresult?.idlist || [];

      this.logger.log(`[PubMed] Found ${data.esearchresult?.count || 0} articles, retrieved ${pmids.length} PMIDs`);

      return pmids;
    } catch (error) {
      this.logger.error(`[PubMed] Search failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Fetch article summaries for given PMIDs
   */
  private async fetchArticleSummaries(pmids: string[]): Promise<ArticleSummary[]> {
    if (pmids.length === 0) return [];

    await this.respectRateLimit();

    const url = `${this.BASE_URL}/esummary.fcgi?` +
      `db=pubmed&` +
      `id=${pmids.join(',')}&` +
      `retmode=json`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`PubMed API error: ${response.status}`);
      }

      const data: ESummaryResponse = await response.json();
      const articles: ArticleSummary[] = [];

      for (const pmid of pmids) {
        const article = data.result?.[pmid];
        if (article && typeof article !== 'object') continue;
        if (article && 'uid' in article) {
          articles.push(article as ArticleSummary);
        }
      }

      return articles;
    } catch (error) {
      this.logger.error(`[PubMed] Fetch summaries failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Clean drug name for PubMed search
   * Strips dosages, strengths, and other noise to get just the drug INN/generic name
   */
  private cleanDrugName(name: string): string {
    if (!name) return name;

    let cleaned = name
      // Remove dosage patterns: 20mg, 120 mg, 500mcg, 0.5g, etc.
      .replace(/\d+(\.\d+)?\s*(mg|mcg|g|ml|iu|units?|mmol)\b/gi, '')
      // Remove "sachet", "tablet", "capsule" etc.
      .replace(/\b(sachet|tablet|capsule|powder|solution|injection|syrup|cream|ointment|gel|drops)\b/gi, '')
      // Replace + or / separators with space (for combination drugs)
      .replace(/[+\/]/g, ' ')
      // Clean up extra whitespace
      .replace(/\s+/g, ' ')
      .trim();

    return cleaned || name;
  }

  /**
   * Split a condition string into individual conditions
   * "Malaria, Tension Headache" → ["Malaria", "Tension Headache"]
   */
  private splitConditions(condition: string): string[] {
    if (!condition) return [];
    return condition
      .split(/[,;]+/)
      .map(c => c.trim())
      .filter(c => c.length > 0);
  }

  /**
   * Build search query from parameters
   */
  private buildSearchQuery(params: PubMedSearchParams): string {
    const terms: string[] = [];

    // Clean drug name (strip dosages, strengths)
    const drugName = this.cleanDrugName(params.drug_name);

    // Drug name search - search in title/abstract and MeSH
    // For combination drugs (e.g. "artemether lumefantrine"), search each component
    const drugParts = drugName.split(/\s+/).filter(p => p.length > 2);
    if (drugParts.length <= 3) {
      // Simple drug name: search as phrase and individual terms
      terms.push(`(${drugName}[Title/Abstract] OR ${drugName}[MeSH Terms])`);
    } else {
      // Combination or complex name: search each meaningful word with AND
      const drugQuery = drugParts.map(p => `${p}[Title/Abstract]`).join(' AND ');
      terms.push(`(${drugQuery} OR ${drugName}[MeSH Terms])`);
    }

    // Add condition if provided - split multiple conditions with OR
    if (params.condition) {
      const conditions = this.splitConditions(params.condition);
      if (conditions.length === 1) {
        terms.push(`(${conditions[0]}[Title/Abstract] OR ${conditions[0]}[MeSH Terms])`);
      } else if (conditions.length > 1) {
        const conditionQuery = conditions
          .map(c => `(${c}[Title/Abstract] OR ${c}[MeSH Terms])`)
          .join(' OR ');
        terms.push(`(${conditionQuery})`);
      }
    }

    // Prefer high-quality publication types
    const pubTypes = params.publication_types || [
      'Meta-Analysis',
      'Systematic Review',
      'Randomized Controlled Trial',
      'Clinical Trial',
      'Review',
    ];
    const pubTypeQuery = pubTypes.map(pt => `"${pt}"[Publication Type]`).join(' OR ');
    terms.push(`(${pubTypeQuery})`);

    // Date range
    if (params.date_range?.start_year || params.date_range?.end_year) {
      const startYear = params.date_range.start_year || 1900;
      const endYear = params.date_range.end_year || new Date().getFullYear();
      terms.push(`${startYear}:${endYear}[dp]`);
    } else {
      // Default to last 10 years for recent evidence
      const tenYearsAgo = new Date().getFullYear() - 10;
      terms.push(`${tenYearsAgo}:${new Date().getFullYear()}[dp]`);
    }

    // Humans only
    terms.push('humans[MeSH Terms]');

    // English language
    terms.push('english[Language]');

    return terms.join(' AND ');
  }

  /**
   * Build citations from article summaries
   */
  private buildCitations(articles: ArticleSummary[], params: PubMedSearchParams): PubMedCitation[] {
    return articles.map((article, index) => {
      const evidence = this.gradeEvidence(article);
      const doi = article.articleids?.find(id => id.idtype === 'doi')?.value;

      // Build authors short form
      const firstAuthor = article.authors?.[0]?.name || 'Unknown';
      const authorsShort = article.authors?.length > 1
        ? `${firstAuthor} et al.`
        : firstAuthor;

      // Extract year from pubdate
      const year = article.pubdate?.match(/\d{4}/)?.[0] || 'Unknown';

      // Calculate relevance score (simple heuristic)
      const relevance = this.calculateRelevance(article, params, index);

      return {
        pmid: article.uid,
        title: article.title,
        authors_short: authorsShort,
        journal_abbrev: article.source,
        year,
        url: `https://pubmed.ncbi.nlm.nih.gov/${article.uid}/`,
        doi_url: doi ? `https://doi.org/${doi}` : undefined,
        evidence,
        relevance_score: relevance,
      };
    }).sort((a, b) => {
      // Sort by evidence level first, then relevance
      const levelOrder = { high: 0, moderate: 1, low: 2, unknown: 3 };
      const levelDiff = levelOrder[a.evidence.level] - levelOrder[b.evidence.level];
      if (levelDiff !== 0) return levelDiff;
      return b.relevance_score - a.relevance_score;
    });
  }

  /**
   * Grade evidence based on publication type
   */
  private gradeEvidence(article: ArticleSummary): EvidenceRating {
    const pubTypes = article.pubtype || [];
    const pubTypesLower = pubTypes.map(pt => pt.toLowerCase());

    // High evidence: Meta-analyses and systematic reviews
    if (pubTypesLower.some(pt => pt.includes('meta-analysis'))) {
      return {
        level: EvidenceLevel.HIGH,
        reasoning: 'Meta-analysis combining multiple studies',
        publication_type: 'Meta-Analysis',
        is_randomized: true,
        is_controlled: true,
      };
    }

    if (pubTypesLower.some(pt => pt.includes('systematic review'))) {
      return {
        level: EvidenceLevel.HIGH,
        reasoning: 'Systematic review of available evidence',
        publication_type: 'Systematic Review',
      };
    }

    // Moderate evidence: RCTs and clinical trials
    if (pubTypesLower.some(pt => pt.includes('randomized controlled trial'))) {
      return {
        level: EvidenceLevel.MODERATE,
        reasoning: 'Randomized controlled trial',
        publication_type: 'Randomized Controlled Trial',
        is_randomized: true,
        is_controlled: true,
      };
    }

    if (pubTypesLower.some(pt => pt.includes('clinical trial'))) {
      return {
        level: EvidenceLevel.MODERATE,
        reasoning: 'Clinical trial study',
        publication_type: 'Clinical Trial',
      };
    }

    if (pubTypesLower.some(pt => pt.includes('cohort') || pt.includes('observational'))) {
      return {
        level: EvidenceLevel.MODERATE,
        reasoning: 'Observational/cohort study',
        publication_type: 'Observational Study',
      };
    }

    // Low evidence: Case reports, reviews, other
    if (pubTypesLower.some(pt => pt.includes('case report'))) {
      return {
        level: EvidenceLevel.LOW,
        reasoning: 'Case report or case series',
        publication_type: 'Case Report',
      };
    }

    if (pubTypesLower.some(pt => pt.includes('review'))) {
      return {
        level: EvidenceLevel.LOW,
        reasoning: 'Narrative review',
        publication_type: 'Review',
      };
    }

    // Journal articles and other publication types default to low
    return {
      level: EvidenceLevel.LOW,
      reasoning: pubTypesLower.some(pt => pt.includes('journal article'))
        ? 'Journal article'
        : 'Evidence level could not be fully determined',
      publication_type: pubTypes[0] || 'Journal Article',
    };
  }

  /**
   * Calculate relevance score based on various factors
   */
  private calculateRelevance(
    article: ArticleSummary,
    params: PubMedSearchParams,
    searchRank: number,
  ): number {
    let score = 100;

    // Penalize based on search rank (PubMed's relevance ordering)
    score -= searchRank * 5;

    // Boost for recent publications
    const year = parseInt(article.pubdate?.match(/\d{4}/)?.[0] || '0');
    const currentYear = new Date().getFullYear();
    const yearsOld = currentYear - year;
    if (yearsOld <= 2) score += 10;
    else if (yearsOld <= 5) score += 5;
    else if (yearsOld > 10) score -= 10;

    // Boost if drug name is in title
    const titleLower = article.title?.toLowerCase() || '';
    if (titleLower.includes(params.drug_name.toLowerCase())) {
      score += 15;
    }

    // Boost if condition is in title (when provided)
    if (params.condition && titleLower.includes(params.condition.toLowerCase())) {
      score += 10;
    }

    // Clamp between 0-100
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Build evidence summary from citations
   */
  private buildEvidenceSummary(
    params: PubMedSearchParams,
    citations: PubMedCitation[],
  ): DrugEvidenceSummary {
    const years = citations
      .map(c => parseInt(c.year))
      .filter(y => !isNaN(y));

    return {
      drug_name: params.drug_name,
      condition: params.condition,
      total_articles_found: citations.length,
      citations,
      evidence_summary: {
        high_quality_count: citations.filter(c => c.evidence.level === EvidenceLevel.HIGH).length,
        moderate_quality_count: citations.filter(c => c.evidence.level === EvidenceLevel.MODERATE).length,
        low_quality_count: citations.filter(c =>
          c.evidence.level === EvidenceLevel.LOW || c.evidence.level === EvidenceLevel.UNKNOWN
        ).length,
        most_recent_year: years.length > 0 ? Math.max(...years) : 0,
        oldest_year: years.length > 0 ? Math.min(...years) : 0,
      },
      search_timestamp: new Date(),
      cache_expires_at: new Date(Date.now() + this.CACHE_DURATION_HOURS * 60 * 60 * 1000),
    };
  }

  /**
   * Build empty result when no articles found
   */
  private buildEmptyResult(params: PubMedSearchParams): DrugEvidenceSummary {
    return {
      drug_name: params.drug_name,
      condition: params.condition,
      total_articles_found: 0,
      citations: [],
      evidence_summary: {
        high_quality_count: 0,
        moderate_quality_count: 0,
        low_quality_count: 0,
        most_recent_year: 0,
        oldest_year: 0,
      },
      search_timestamp: new Date(),
    };
  }

  /**
   * Rate limiting - ensure we don't exceed 3 requests/second
   */
  private async respectRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.REQUEST_DELAY_MS) {
      const waitTime = this.REQUEST_DELAY_MS - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Cache helpers
   */
  private buildCacheKey(params: PubMedSearchParams): string {
    return `pubmed:${params.drug_name}:${params.condition || 'general'}`.toLowerCase();
  }

  private getFromCache(key: string): DrugEvidenceSummary | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (new Date() > cached.expires) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private setCache(key: string, data: DrugEvidenceSummary): void {
    const expires = new Date(Date.now() + this.CACHE_DURATION_HOURS * 60 * 60 * 1000);
    this.cache.set(key, { data, expires });

    // Clean up old cache entries periodically
    if (this.cache.size > 1000) {
      this.cleanCache();
    }
  }

  private cleanCache(): void {
    const now = new Date();
    for (const [key, value] of this.cache.entries()) {
      if (now > value.expires) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Format citation for display in RxGPT response
   */
  formatCitationForDisplay(citation: PubMedCitation): string {
    return `${citation.authors_short} (${citation.year}). ${citation.title}. ${citation.journal_abbrev}. ` +
      `PMID: ${citation.pmid}. Evidence: ${citation.evidence.level}. ${citation.url}`;
  }

  /**
   * Format short citation (for inline use)
   */
  formatShortCitation(citation: PubMedCitation): string {
    return `[${citation.authors_short}, ${citation.year}] (PMID: ${citation.pmid})`;
  }
}
