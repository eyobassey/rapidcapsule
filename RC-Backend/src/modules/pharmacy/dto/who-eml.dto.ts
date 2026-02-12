/**
 * WHO Essential Medicines List (EML) DTOs
 * Validation against the WHO Model List of Essential Medicines (667 medicines)
 *
 * The WHO EML identifies medicines that satisfy the priority healthcare needs
 * of the population. Particularly valuable for the Nigerian/African specialist
 * user base where WHO guidelines are a primary clinical reference.
 */

// ============ MEDICINE DATA ============

export interface WHOEMLFormulation {
  route: string;
  form: string;
  strength: string;
}

export interface WHOEMLIndication {
  icd11_code: string;
  indication: string;
  age_group: string;
  formulations: WHOEMLFormulation[];
}

export interface WHOEMLMedicine {
  inn: string;
  atc_code: string;
  section: string;
  category: string;
  list_type: 'core' | 'complementary';
  indications: WHOEMLIndication[];
  patent_status: string;
}

export interface WHOEMLData {
  version: string;
  source: string;
  source_url: string;
  extracted_at: string;
  total_medicines: number;
  total_recommendations: number;
  medicines: WHOEMLMedicine[];
  drug_names: string[];
}

// ============ VALIDATION RESULT ============

export interface WHOEMLValidationResult {
  drug_name: string;
  found_in_eml: boolean;
  list_type?: 'core' | 'complementary';
  atc_code?: string;
  section?: string;
  category?: string;
  matching_indications: string[];
  formulations: WHOEMLFormulation[];
  age_group_appropriate: boolean;
  validation_timestamp: Date;
}

// ============ COMPLIANCE SUMMARY ============

export interface WHOEMLComplianceSummary {
  total_drugs_checked: number;
  eml_listed_count: number;
  core_count: number;
  complementary_count: number;
  not_in_eml: string[];
  has_eml_issues: boolean;
  warning?: string;
}
