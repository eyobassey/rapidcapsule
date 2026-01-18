// Health domains for categorizing questions
export enum HealthDomain {
  CARDIOVASCULAR = 'cardiovascular',
  METABOLIC = 'metabolic',
  MENTAL_WELLBEING = 'mental_wellbeing',
  LIFESTYLE = 'lifestyle',
  PHYSICAL_SYMPTOMS = 'physical_symptoms',
  PREVENTIVE_CARE = 'preventive_care',
}

// Question types for the questionnaire
export enum QuestionType {
  SINGLE_CHOICE = 'single_choice',
  MULTIPLE_CHOICE = 'multiple_choice',
  SCALE = 'scale',
  YES_NO = 'yes_no',
  TEXT = 'text',
}

// Assessment status
export enum AssessmentStatus {
  COMPLETED = 'completed',
  FAILED = 'failed',
}

// Health status labels
export enum HealthStatus {
  EXCELLENT = 'Excellent',
  GOOD = 'Good',
  FAIR = 'Fair',
  NEEDS_ATTENTION = 'Needs Attention',
  POOR = 'Poor',
}

// Priority levels for recommendations
export enum PriorityLevel {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

// Confidence level for AI analysis
export enum ConfidenceLevel {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

// Domain labels for display
export const DOMAIN_LABELS: Record<HealthDomain, string> = {
  [HealthDomain.CARDIOVASCULAR]: 'Cardiovascular Health',
  [HealthDomain.METABOLIC]: 'Metabolic Health',
  [HealthDomain.MENTAL_WELLBEING]: 'Mental Wellbeing',
  [HealthDomain.LIFESTYLE]: 'Lifestyle Factors',
  [HealthDomain.PHYSICAL_SYMPTOMS]: 'Physical Symptoms',
  [HealthDomain.PREVENTIVE_CARE]: 'Preventive Care',
};

// Domain order for display
export const DOMAIN_ORDER: Record<HealthDomain, number> = {
  [HealthDomain.CARDIOVASCULAR]: 1,
  [HealthDomain.METABOLIC]: 2,
  [HealthDomain.MENTAL_WELLBEING]: 3,
  [HealthDomain.LIFESTYLE]: 4,
  [HealthDomain.PHYSICAL_SYMPTOMS]: 5,
  [HealthDomain.PREVENTIVE_CARE]: 6,
};

// Interface for question options
export interface QuestionOption {
  value: string;
  label: string;
  score_weight: number; // -10 to +10
}

// Interface for scale configuration
export interface ScaleConfig {
  min: number;
  max: number;
  min_label: string;
  max_label: string;
}

// Interface for uploaded document
export interface UploadedDocument {
  original_name: string;
  file_type: string;
  s3_key: string;
  s3_url: string;
  uploaded_at: Date;
}

// Interface for answer submission
export interface AnswerSubmission {
  question_id: string;
  domain: HealthDomain;
  question_text: string;
  answer_value: string | string[] | number;
  answer_label: string;
}

// Interface for health checkup summary (from Infermedica)
export interface HealthCheckupSummary {
  date: string;
  triage_level: string | null;
  has_emergency_evidence: boolean;
  top_conditions: Array<{
    name: string;
    probability: number;
  }>;
  symptoms_reported: string[];
  ai_summary?: string;
}

// Interface for profile snapshot
export interface ProfileSnapshot {
  first_name: string | null;
  age: number | null;
  gender: string | null;
  height: { value: number; unit: string } | null;
  weight: { value: number; unit: string } | null;
  bmi: number | null;
  pre_existing_conditions: string[];
  is_smoker: boolean | null;
  recent_vitals: {
    blood_pressure: string | null;
    blood_sugar: string | null;
    pulse_rate: string | null;
    temperature: string | null;
  };
  recent_health_checkups: HealthCheckupSummary[];
}

// Interface for domain score in report
export interface DomainScore {
  domain: HealthDomain;
  domain_label: string;
  score: number;
  status: string;
  insights: string;
  recommendations: string[];
}

// Interface for priority action
export interface PriorityAction {
  priority: PriorityLevel;
  action: string;
  reason: string;
}

// Interface for the complete AI report
export interface HealthReport {
  overall_score: number;
  overall_status: string;
  overall_summary: string;
  domain_scores: DomainScore[];
  priority_actions: PriorityAction[];
  detailed_analysis: string;
  lifestyle_tips: string[];
  when_to_see_doctor: string[];
  confidence_level: ConfidenceLevel;
  data_sources_used: string[];
  disclaimer: string;
}
