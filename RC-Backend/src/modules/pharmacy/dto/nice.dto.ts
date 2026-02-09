/**
 * NICE Guidelines API DTOs
 * National Institute for Health and Care Excellence (UK)
 * Used for validating treatments against UK clinical standards
 */

// ============ SEARCH REQUEST/RESPONSE ============

export interface NICESearchParams {
  drug_name?: string;
  condition?: string;
  max_results?: number;
  include_in_development?: boolean;
}

export interface NICEGuideline {
  id: string;                        // e.g., 'NG28', 'CG181'
  title: string;
  url: string;
  type: NICEGuidelineType;
  published_date: string;
  last_updated?: string;
  status: 'published' | 'in_development' | 'withdrawn';
}

export enum NICEGuidelineType {
  NG = 'NICE guideline',             // NICE guidelines
  CG = 'Clinical guideline',         // Clinical guidelines
  TA = 'Technology appraisal',       // Technology appraisals
  MTG = 'Medical technologies',      // Medical technologies guidance
  HST = 'Highly specialised',        // Highly specialised technologies
  IPG = 'Interventional procedures', // Interventional procedures guidance
  DG = 'Diagnostics guidance',       // Diagnostics guidance
  PH = 'Public health',              // Public health guidelines
  QS = 'Quality standard',           // Quality standards
  SC = 'Social care',                // Social care guidelines
  MIB = 'Medtech innovation',        // Medtech innovation briefings
  ES = 'Evidence summary',           // Evidence summaries
}

// ============ TREATMENT RECOMMENDATIONS ============

export interface NICETreatmentRecommendation {
  drug_name: string;
  recommendation_type: 'recommended' | 'consider' | 'do_not_offer' | 'caution';
  line_of_treatment?: 'first_line' | 'second_line' | 'third_line' | 'adjunct';
  conditions: string[];              // Conditions this applies to
  population?: string;               // e.g., 'adults', 'children over 12'
  evidence_strength: NICEEvidenceStrength;
  recommendation_text: string;
  guideline_reference: {
    id: string;
    title: string;
    section?: string;
    url: string;
  };
  contraindications?: string[];
  special_considerations?: string[];
}

export enum NICEEvidenceStrength {
  STRONG = 'strong',                 // Strong recommendation
  CONDITIONAL = 'conditional',       // Conditional/weak recommendation
  RESEARCH = 'research_only',        // Only in research context
  NOT_RECOMMENDED = 'not_recommended',
}

// ============ DRUG-CONDITION ALIGNMENT ============

export interface NICEDrugConditionAlignment {
  drug_name: string;
  condition: string;
  is_aligned: boolean;               // Does this drug align with NICE guidelines?
  alignment_status: 'recommended' | 'acceptable' | 'not_recommended' | 'no_guidance';
  guidelines: NICEGuideline[];
  recommendations: NICETreatmentRecommendation[];
  warnings: string[];
  notes: string[];
}

// ============ VALIDATION RESULT ============

export interface NICEValidationResult {
  drug_name: string;
  condition?: string;
  is_nice_compliant: boolean;
  compliance_level: 'full' | 'partial' | 'none' | 'unknown';
  guidelines_checked: NICEGuideline[];
  recommendations: NICETreatmentRecommendation[];
  warnings: string[];
  alternative_recommendations?: {
    drug_name: string;
    reason: string;
    guideline_reference: string;
  }[];
  validation_timestamp: Date;
}

// ============ CONDITION GUIDANCE ============

export interface NICEConditionGuidance {
  condition: string;
  condition_aliases: string[];
  primary_guideline?: NICEGuideline;
  related_guidelines: NICEGuideline[];
  first_line_treatments: string[];
  second_line_treatments: string[];
  drugs_to_avoid: string[];
  special_populations: {
    population: string;            // e.g., 'pregnancy', 'elderly', 'renal impairment'
    recommendations: string[];
    contraindications: string[];
  }[];
  last_updated: Date;
}

// ============ API RESPONSE TYPES ============

// NICE Search API response structure
export interface NICESearchResponse {
  resultCount: number;
  results: NICESearchResult[];
}

export interface NICESearchResult {
  id: string;
  title: string;
  publicationDate: string;
  lastModified?: string;
  guidanceType: string;
  url: string;
  summary?: string;
}

// ============ SUMMARY FOR RXGPT ============

export interface NICEComplianceSummary {
  total_drugs_checked: number;
  fully_compliant: number;
  partially_compliant: number;
  non_compliant: number;
  no_guidance_available: number;
  has_compliance_issues: boolean;
  warning?: string;
  guidelines_referenced: {
    id: string;
    title: string;
    url: string;
  }[];
}
