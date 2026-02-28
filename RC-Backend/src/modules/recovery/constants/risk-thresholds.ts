/**
 * Configuration constants for the Predictive Relapse Risk Engine.
 * The Recovery Risk Score (RRS) is a composite 0-100 score computed
 * from five weighted signal categories.
 */

// ─── Risk Level Thresholds ────────────────────────────────────────

export enum RiskLevel {
  LOW = 'low',
  MODERATE = 'moderate',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export const RISK_LEVEL_THRESHOLDS = {
  [RiskLevel.LOW]: { min: 0, max: 24 },
  [RiskLevel.MODERATE]: { min: 25, max: 49 },
  [RiskLevel.HIGH]: { min: 50, max: 74 },
  [RiskLevel.CRITICAL]: { min: 75, max: 100 },
} as const;

export const RISK_LEVEL_COLORS = {
  [RiskLevel.LOW]: '#22C55E',
  [RiskLevel.MODERATE]: '#F59E0B',
  [RiskLevel.HIGH]: '#F97316',
  [RiskLevel.CRITICAL]: '#EF4444',
} as const;

export function scoreToLevel(score: number): RiskLevel {
  if (score >= 75) return RiskLevel.CRITICAL;
  if (score >= 50) return RiskLevel.HIGH;
  if (score >= 25) return RiskLevel.MODERATE;
  return RiskLevel.LOW;
}

// ─── Category Weights ─────────────────────────────────────────────

export interface CategoryWeights {
  self_reported: number;
  behavioral: number;
  physiological: number;
  clinical: number;
  contextual: number;
}

export const DEFAULT_CATEGORY_WEIGHTS: CategoryWeights = {
  self_reported: 0.25,
  behavioral: 0.25,
  physiological: 0.15,
  clinical: 0.2,
  contextual: 0.15,
};

/**
 * When a category has no data (e.g. patient has no vitals), redistribute
 * its weight proportionally across the remaining categories.
 */
export function redistributeWeights(
  baseWeights: CategoryWeights,
  availableCategories: (keyof CategoryWeights)[],
): CategoryWeights {
  const totalAvailable = availableCategories.reduce(
    (sum, cat) => sum + baseWeights[cat],
    0,
  );

  const redistributed: CategoryWeights = {
    self_reported: 0,
    behavioral: 0,
    physiological: 0,
    clinical: 0,
    contextual: 0,
  };

  for (const cat of availableCategories) {
    redistributed[cat] = baseWeights[cat] / totalAvailable;
  }

  return redistributed;
}

// ─── MAT & Psychiatric Drug Detection ─────────────────────────────

/**
 * Generic names of Medication-Assisted Treatment (MAT) drugs
 * and common psychiatric medications used in addiction recovery.
 */
export const MAT_DRUG_GENERIC_NAMES = [
  'buprenorphine',
  'naltrexone',
  'methadone',
  'acamprosate',
  'disulfiram',
  'naloxone',
  'varenicline',
  'bupropion',
  'lofexidine',
  'clonidine',
] as const;

/**
 * Drug categories from the Drug entity that indicate psychiatric
 * or addiction-related prescriptions.
 */
export const PSYCH_DRUG_CATEGORIES = [
  'MENTAL_HEALTH',
  'SMOKING_CESSATION',
] as const;

// ─── Scoring Instrument Max Scores ────────────────────────────────

export const SCREENING_MAX_SCORES: Record<string, number> = {
  audit: 40,
  dast10: 10,
  cage: 4,
  assist: 39,
};

// ─── Alert Cascade ────────────────────────────────────────────────

/** Cooldown between repeated alerts of the same level for a single user (ms). */
export const ALERT_COOLDOWN_MS = 6 * 60 * 60 * 1000; // 6 hours

// ─── Batch Processing ─────────────────────────────────────────────

export const BATCH_SIZE = 50;

// ─── Lookback Windows ─────────────────────────────────────────────

/** Days of sobriety logs to consider for self-reported signals. */
export const SELF_REPORTED_LOOKBACK_DAYS = 7;

/** Days of data to consider for behavioral signals. */
export const BEHAVIORAL_LOOKBACK_DAYS = 30;

/** Days of vitals to consider for physiological signals. */
export const PHYSIOLOGICAL_LOOKBACK_DAYS = 7;

/** Days to consider for clinical crisis events. */
export const CLINICAL_CRISIS_LOOKBACK_DAYS = 30;

/** Days to consider for relapse frequency. */
export const RELAPSE_FREQUENCY_LOOKBACK_DAYS = 90;

/** Days to consider for coping exercise diversity. */
export const COPING_DIVERSITY_LOOKBACK_DAYS = 30;

/** Days to consider for physiological activity baseline comparison. */
export const ACTIVITY_BASELINE_LOOKBACK_DAYS = 14;

/** Days to consider for journal risk flags. */
export const JOURNAL_LOOKBACK_DAYS = 14;

/** Days for coping exercise rate window. */
export const COPING_EXERCISE_RATE_LOOKBACK_DAYS = 14;

/** How many risk history entries to keep on the profile. */
export const RISK_HISTORY_MAX_ENTRIES = 90;
