/**
 * Hallucination Detection DTOs
 * Used for identifying and flagging potential AI hallucinations in RxGPT responses
 */

// ============ DETECTION TYPES ============

export enum HallucinationType {
  UNKNOWN_DRUG = 'unknown_drug',                    // Drug not found in any database
  IMPLAUSIBLE_DOSAGE = 'implausible_dosage',        // Dosage outside physiological range
  INVENTED_DRUG_CLASS = 'invented_drug_class',      // Non-existent drug class
  FAKE_INTERACTION = 'fake_interaction',            // Interaction not in databases
  INVENTED_INDICATION = 'invented_indication',      // Made-up indication
  IMPOSSIBLE_COMBINATION = 'impossible_combination', // Contradictory drug combination
  INVENTED_TERMINOLOGY = 'invented_terminology',    // Made-up medical terms
  IMPLAUSIBLE_FREQUENCY = 'implausible_frequency',  // Impossible dosing frequency
  FICTIONAL_MANUFACTURER = 'fictional_manufacturer', // Non-existent manufacturer
  INCONSISTENT_CLAIM = 'inconsistent_claim',        // Self-contradictory statements
}

export enum HallucinationSeverity {
  CRITICAL = 'critical',   // Could cause patient harm - must be flagged
  HIGH = 'high',           // Likely hallucination - should be reviewed
  MEDIUM = 'medium',       // Possible hallucination - worth noting
  LOW = 'low',             // Minor concern - informational
}

// ============ DETECTION RESULTS ============

export interface HallucinationFlag {
  type: HallucinationType;
  severity: HallucinationSeverity;
  field: string;                    // Which field triggered detection (e.g., 'drug_name', 'dosage')
  value: string;                    // The suspicious value
  reason: string;                   // Human-readable explanation
  suggestion?: string;              // Suggested correction if available
  confidence: number;               // Confidence in detection (0-100)
}

export interface DrugHallucinationCheck {
  drug_name: string;
  flags: HallucinationFlag[];
  is_suspicious: boolean;
  suspicion_score: number;          // 0-100, higher = more likely hallucination
  verified_in_sources: string[];    // Which databases confirmed the drug
  recommendation: 'approve' | 'review' | 'reject';
}

export interface HallucinationReport {
  timestamp: Date;
  total_items_checked: number;
  hallucinations_detected: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  drug_checks: DrugHallucinationCheck[];
  overall_suspicion_score: number;
  recommendation: 'safe' | 'review_required' | 'reject';
  summary: string;
}

// ============ KNOWN PATTERNS ============

export interface KnownDrugPattern {
  name_pattern: RegExp;
  drug_class: string;
  typical_max_dose_mg?: number;
  typical_frequencies: string[];
}

export interface SuspiciousPattern {
  pattern: RegExp;
  type: HallucinationType;
  severity: HallucinationSeverity;
  description: string;
}

// ============ LOGGING ============

export interface HallucinationLogEntry {
  timestamp: Date;
  specialist_id?: string;
  patient_id?: string;
  analysis_id?: string;
  flags: HallucinationFlag[];
  ai_model: string;
  prompt_hash?: string;             // Hash of input for tracking patterns
  was_blocked: boolean;
  was_modified: boolean;
}
