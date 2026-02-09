/**
 * PubMed E-utilities API DTOs
 * Used for fetching clinical evidence to ground RxGPT recommendations
 */

// ============ SEARCH REQUEST/RESPONSE ============

export interface PubMedSearchParams {
  drug_name: string;
  condition?: string;
  max_results?: number;
  sort?: 'relevance' | 'date';
  publication_types?: string[]; // e.g., ['Clinical Trial', 'Meta-Analysis', 'Systematic Review']
  date_range?: {
    start_year?: number;
    end_year?: number;
  };
}

export interface PubMedSearchResult {
  pmid: string;
  title: string;
  authors: string[];
  journal: string;
  publication_date: string;
  abstract?: string;
  doi?: string;
  pmcid?: string; // PubMed Central ID
  publication_types: string[];
  mesh_terms: string[];
  url: string;
}

// ============ EVIDENCE GRADING ============

export enum EvidenceLevel {
  HIGH = 'high',           // Meta-analyses, systematic reviews
  MODERATE = 'moderate',   // RCTs, cohort studies
  LOW = 'low',             // Case studies, expert opinion
  UNKNOWN = 'unknown',     // Cannot determine
}

export interface EvidenceRating {
  level: EvidenceLevel;
  reasoning: string;
  publication_type: string;
  sample_size?: number;
  is_randomized?: boolean;
  is_controlled?: boolean;
}

// ============ CITATION ============

export interface PubMedCitation {
  pmid: string;
  title: string;
  authors_short: string;  // First author et al.
  journal_abbrev: string;
  year: string;
  url: string;
  doi_url?: string;
  evidence: EvidenceRating;
  relevance_score: number; // 0-100, how relevant to the query
  key_finding?: string;    // Extracted key finding if available
}

// ============ DRUG EVIDENCE SUMMARY ============

export interface DrugEvidenceSummary {
  drug_name: string;
  condition?: string;
  total_articles_found: number;
  citations: PubMedCitation[];
  evidence_summary: {
    high_quality_count: number;
    moderate_quality_count: number;
    low_quality_count: number;
    most_recent_year: number;
    oldest_year: number;
  };
  search_timestamp: Date;
  cache_expires_at?: Date;
}

// ============ API RESPONSE TYPES ============

// ESearch API response
export interface ESearchResponse {
  esearchresult: {
    count: string;
    retmax: string;
    retstart: string;
    idlist: string[];
    translationset?: any[];
    querytranslation?: string;
  };
}

// ESummary API response
export interface ESummaryResponse {
  result: {
    uids: string[];
    [pmid: string]: ArticleSummary | string[];
  };
}

export interface ArticleSummary {
  uid: string;
  pubdate: string;
  epubdate?: string;
  source: string;
  authors: Array<{ name: string; authtype: string }>;
  title: string;
  volume?: string;
  issue?: string;
  pages?: string;
  articleids: Array<{ idtype: string; value: string }>;
  fulljournalname: string;
  sortpubdate: string;
  pubtype: string[];
}

// EFetch API response (abstract)
export interface EFetchAbstract {
  pmid: string;
  abstract: string;
  mesh_terms: string[];
}
