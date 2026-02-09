/**
 * NHS BNF (British National Formulary) DTOs
 * UK-specific drug prescribing information
 *
 * The BNF is the standard pharmaceutical reference for NHS healthcare professionals.
 * Contains UK-approved indications, dosages, interactions, and cautions.
 */

// ============ DRUG INFORMATION ============

export interface BNFDrugInfo {
  drug_name: string;
  generic_name: string;
  drug_class: string;
  bnf_url?: string;

  // UK-approved uses
  indications: BNFIndication[];

  // Dosage information
  dosages: BNFDosage[];

  // Safety information
  contraindications: string[];
  cautions: string[];
  hepatic_impairment?: BNFOrganImpairment;
  renal_impairment?: BNFOrganImpairment;
  pregnancy?: BNFPregnancyInfo;
  breastfeeding?: BNFBreastfeedingInfo;

  // Side effects by frequency
  side_effects: BNFSideEffects;

  // Interactions
  interactions: BNFInteraction[];

  // Monitoring requirements
  monitoring?: string[];

  // Additional notes
  prescribing_notes?: string[];
}

export interface BNFIndication {
  condition: string;
  adult: boolean;
  child: boolean;
  specialist_only?: boolean;
  notes?: string;
}

export interface BNFDosage {
  indication?: string;
  population: 'adult' | 'elderly' | 'child' | 'neonate';
  route: 'oral' | 'iv' | 'im' | 'sc' | 'topical' | 'inhaled' | 'rectal' | 'other';
  dose: string;
  frequency: string;
  max_dose?: string;
  max_daily_dose?: string;
  duration?: string;
  notes?: string;
  age_range?: {
    min_age?: string;
    max_age?: string;
  };
  weight_based?: {
    dose_per_kg: string;
    max_dose: string;
  };
}

export interface BNFOrganImpairment {
  severity_levels: {
    mild?: string;
    moderate?: string;
    severe?: string;
  };
  avoid?: boolean;
  dose_adjustment?: string;
  monitoring?: string;
  notes?: string;
}

export interface BNFPregnancyInfo {
  category: 'avoid' | 'caution' | 'limited_data' | 'no_known_harm' | 'benefit_outweighs_risk';
  trimester_specific?: {
    first?: string;
    second?: string;
    third?: string;
  };
  notes: string;
}

export interface BNFBreastfeedingInfo {
  recommendation: 'avoid' | 'caution' | 'amount_too_small' | 'present_in_milk' | 'no_information';
  notes: string;
}

export interface BNFSideEffects {
  very_common?: string[];  // >1 in 10
  common?: string[];       // 1 in 10 to 1 in 100
  uncommon?: string[];     // 1 in 100 to 1 in 1000
  rare?: string[];         // 1 in 1000 to 1 in 10000
  very_rare?: string[];    // <1 in 10000
  frequency_unknown?: string[];
}

// ============ INTERACTIONS ============

export interface BNFInteraction {
  interacting_drug: string;
  severity: BNFInteractionSeverity;
  effect: string;
  action: string;
  evidence?: 'anecdotal' | 'study' | 'theoretical';
}

export enum BNFInteractionSeverity {
  SEVERE = 'severe',         // Avoid combination
  MODERATE = 'moderate',     // Use with caution
  MILD = 'mild',            // Be aware
  UNKNOWN = 'unknown',
}

// ============ VALIDATION ============

export interface BNFValidationResult {
  drug_name: string;
  found_in_bnf: boolean;
  uk_approved: boolean;
  indications_checked: string[];
  indication_match: boolean;
  dosage_appropriate: boolean;
  dosage_warnings: string[];
  cautions: string[];
  contraindication_flags: string[];
  interaction_alerts: BNFInteraction[];
  special_population_warnings: string[];
  bnf_url?: string;
  validation_timestamp: Date;
}

// ============ COMPARISON WITH FDA ============

export interface BNFFDAComparison {
  drug_name: string;
  fda_approved: boolean;
  bnf_approved: boolean;
  indication_differences: {
    fda_only: string[];
    bnf_only: string[];
    both: string[];
  };
  dosage_differences: {
    field: string;
    fda_value: string;
    bnf_value: string;
    notes?: string;
  }[];
  additional_bnf_cautions: string[];
  additional_bnf_interactions: string[];
}

// ============ SUMMARY FOR RXGPT ============

export interface BNFComplianceSummary {
  total_drugs_checked: number;
  uk_approved_count: number;
  not_uk_approved: string[];
  dosage_warnings_count: number;
  caution_flags_count: number;
  interaction_alerts_count: number;
  has_uk_compliance_issues: boolean;
  warning?: string;
}
