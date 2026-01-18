import {
  HealthDomain,
  QuestionType,
  DOMAIN_ORDER,
} from '../types/advanced-score.types';

export interface SeedQuestion {
  domain: HealthDomain;
  domain_order: number;
  question_order: number;
  question_text: string;
  question_type: QuestionType;
  options?: { value: string; label: string; score_weight: number }[];
  scale_config?: { min: number; max: number; min_label: string; max_label: string };
  is_required: boolean;
  help_text?: string;
}

export const SEED_QUESTIONS: SeedQuestion[] = [
  // Domain 1: Cardiovascular Health (4 questions)
  {
    domain: HealthDomain.CARDIOVASCULAR,
    domain_order: DOMAIN_ORDER[HealthDomain.CARDIOVASCULAR],
    question_order: 1,
    question_text: 'Have you ever been diagnosed with high blood pressure?',
    question_type: QuestionType.YES_NO,
    options: [
      { value: 'yes', label: 'Yes', score_weight: -5 },
      { value: 'no', label: 'No', score_weight: 5 },
    ],
    is_required: true,
    help_text: 'Also known as hypertension',
  },
  {
    domain: HealthDomain.CARDIOVASCULAR,
    domain_order: DOMAIN_ORDER[HealthDomain.CARDIOVASCULAR],
    question_order: 2,
    question_text: 'Do you experience chest pain or discomfort during physical activity?',
    question_type: QuestionType.YES_NO,
    options: [
      { value: 'yes', label: 'Yes', score_weight: -8 },
      { value: 'no', label: 'No', score_weight: 5 },
    ],
    is_required: true,
  },
  {
    domain: HealthDomain.CARDIOVASCULAR,
    domain_order: DOMAIN_ORDER[HealthDomain.CARDIOVASCULAR],
    question_order: 3,
    question_text: 'Do you have a family history of heart disease?',
    question_type: QuestionType.YES_NO,
    options: [
      { value: 'yes', label: 'Yes', score_weight: -3 },
      { value: 'no', label: 'No', score_weight: 3 },
    ],
    is_required: true,
    help_text: 'Parents, siblings, or grandparents with heart disease',
  },
  {
    domain: HealthDomain.CARDIOVASCULAR,
    domain_order: DOMAIN_ORDER[HealthDomain.CARDIOVASCULAR],
    question_order: 4,
    question_text: 'How often do you experience shortness of breath?',
    question_type: QuestionType.SINGLE_CHOICE,
    options: [
      { value: 'never', label: 'Never', score_weight: 5 },
      { value: 'occasionally', label: 'Occasionally', score_weight: 0 },
      { value: 'frequently', label: 'Frequently', score_weight: -5 },
      { value: 'always', label: 'Always', score_weight: -8 },
    ],
    is_required: true,
  },

  // Domain 2: Metabolic Health (4 questions)
  {
    domain: HealthDomain.METABOLIC,
    domain_order: DOMAIN_ORDER[HealthDomain.METABOLIC],
    question_order: 1,
    question_text: 'Have you been diagnosed with diabetes or pre-diabetes?',
    question_type: QuestionType.YES_NO,
    options: [
      { value: 'yes', label: 'Yes', score_weight: -5 },
      { value: 'no', label: 'No', score_weight: 5 },
    ],
    is_required: true,
  },
  {
    domain: HealthDomain.METABOLIC,
    domain_order: DOMAIN_ORDER[HealthDomain.METABOLIC],
    question_order: 2,
    question_text: 'How would you rate your energy levels throughout the day?',
    question_type: QuestionType.SCALE,
    scale_config: {
      min: 1,
      max: 10,
      min_label: 'Very Low',
      max_label: 'Very High',
    },
    is_required: true,
    help_text: '1 = Very low energy, 10 = High sustained energy',
  },
  {
    domain: HealthDomain.METABOLIC,
    domain_order: DOMAIN_ORDER[HealthDomain.METABOLIC],
    question_order: 3,
    question_text: 'Have you experienced unexplained weight changes in the past 3 months?',
    question_type: QuestionType.SINGLE_CHOICE,
    options: [
      { value: 'gained_more_5', label: 'Gained >5kg', score_weight: -5 },
      { value: 'gained_2_5', label: 'Gained 2-5kg', score_weight: -2 },
      { value: 'stable', label: 'Stable', score_weight: 5 },
      { value: 'lost_2_5', label: 'Lost 2-5kg', score_weight: -2 },
      { value: 'lost_more_5', label: 'Lost >5kg', score_weight: -5 },
    ],
    is_required: true,
  },
  {
    domain: HealthDomain.METABOLIC,
    domain_order: DOMAIN_ORDER[HealthDomain.METABOLIC],
    question_order: 4,
    question_text: 'Do you experience excessive thirst or frequent urination?',
    question_type: QuestionType.YES_NO,
    options: [
      { value: 'yes', label: 'Yes', score_weight: -5 },
      { value: 'no', label: 'No', score_weight: 3 },
    ],
    is_required: true,
    help_text: 'These can be signs of blood sugar issues',
  },

  // Domain 3: Mental Wellbeing (5 questions)
  {
    domain: HealthDomain.MENTAL_WELLBEING,
    domain_order: DOMAIN_ORDER[HealthDomain.MENTAL_WELLBEING],
    question_order: 1,
    question_text: 'How would you rate your overall stress level?',
    question_type: QuestionType.SCALE,
    scale_config: {
      min: 1,
      max: 10,
      min_label: 'No Stress',
      max_label: 'Extreme Stress',
    },
    is_required: true,
  },
  {
    domain: HealthDomain.MENTAL_WELLBEING,
    domain_order: DOMAIN_ORDER[HealthDomain.MENTAL_WELLBEING],
    question_order: 2,
    question_text: 'How many hours of sleep do you typically get per night?',
    question_type: QuestionType.SINGLE_CHOICE,
    options: [
      { value: 'less_5', label: 'Less than 5 hours', score_weight: -8 },
      { value: '5_6', label: '5-6 hours', score_weight: -3 },
      { value: '7_8', label: '7-8 hours', score_weight: 5 },
      { value: 'more_8', label: 'More than 8 hours', score_weight: 2 },
    ],
    is_required: true,
  },
  {
    domain: HealthDomain.MENTAL_WELLBEING,
    domain_order: DOMAIN_ORDER[HealthDomain.MENTAL_WELLBEING],
    question_order: 3,
    question_text: 'How often do you feel anxious or worried?',
    question_type: QuestionType.SINGLE_CHOICE,
    options: [
      { value: 'never', label: 'Never', score_weight: 5 },
      { value: 'rarely', label: 'Rarely', score_weight: 3 },
      { value: 'sometimes', label: 'Sometimes', score_weight: 0 },
      { value: 'often', label: 'Often', score_weight: -5 },
      { value: 'always', label: 'Always', score_weight: -8 },
    ],
    is_required: true,
  },
  {
    domain: HealthDomain.MENTAL_WELLBEING,
    domain_order: DOMAIN_ORDER[HealthDomain.MENTAL_WELLBEING],
    question_order: 4,
    question_text: 'How would you rate your overall mood in the past 2 weeks?',
    question_type: QuestionType.SCALE,
    scale_config: {
      min: 1,
      max: 10,
      min_label: 'Very Low',
      max_label: 'Excellent',
    },
    is_required: true,
  },
  {
    domain: HealthDomain.MENTAL_WELLBEING,
    domain_order: DOMAIN_ORDER[HealthDomain.MENTAL_WELLBEING],
    question_order: 5,
    question_text: 'Do you have difficulty concentrating or remembering things?',
    question_type: QuestionType.SINGLE_CHOICE,
    options: [
      { value: 'never', label: 'Never', score_weight: 5 },
      { value: 'occasionally', label: 'Occasionally', score_weight: 0 },
      { value: 'frequently', label: 'Frequently', score_weight: -5 },
    ],
    is_required: true,
  },

  // Domain 4: Lifestyle Factors (5 questions)
  {
    domain: HealthDomain.LIFESTYLE,
    domain_order: DOMAIN_ORDER[HealthDomain.LIFESTYLE],
    question_order: 1,
    question_text: 'How many days per week do you engage in physical exercise (30+ minutes)?',
    question_type: QuestionType.SINGLE_CHOICE,
    options: [
      { value: '0', label: '0 days', score_weight: -8 },
      { value: '1_2', label: '1-2 days', score_weight: -2 },
      { value: '3_4', label: '3-4 days', score_weight: 5 },
      { value: '5_plus', label: '5+ days', score_weight: 8 },
    ],
    is_required: true,
  },
  {
    domain: HealthDomain.LIFESTYLE,
    domain_order: DOMAIN_ORDER[HealthDomain.LIFESTYLE],
    question_order: 2,
    question_text: 'How would you describe your diet?',
    question_type: QuestionType.SINGLE_CHOICE,
    options: [
      { value: 'poor', label: 'Poor', score_weight: -8 },
      { value: 'fair', label: 'Fair', score_weight: -2 },
      { value: 'good', label: 'Good', score_weight: 5 },
      { value: 'excellent', label: 'Excellent', score_weight: 8 },
    ],
    is_required: true,
    help_text: 'Consider balance of fruits, vegetables, proteins, and whole grains',
  },
  {
    domain: HealthDomain.LIFESTYLE,
    domain_order: DOMAIN_ORDER[HealthDomain.LIFESTYLE],
    question_order: 3,
    question_text: 'How many alcoholic drinks do you consume per week?',
    question_type: QuestionType.SINGLE_CHOICE,
    options: [
      { value: 'none', label: 'None', score_weight: 5 },
      { value: '1_7', label: '1-7 drinks', score_weight: 2 },
      { value: '8_14', label: '8-14 drinks', score_weight: -3 },
      { value: '15_plus', label: '15+ drinks', score_weight: -8 },
    ],
    is_required: true,
  },
  {
    domain: HealthDomain.LIFESTYLE,
    domain_order: DOMAIN_ORDER[HealthDomain.LIFESTYLE],
    question_order: 4,
    question_text: 'How many hours per day do you spend sitting?',
    question_type: QuestionType.SINGLE_CHOICE,
    options: [
      { value: 'less_4', label: 'Less than 4 hours', score_weight: 5 },
      { value: '4_6', label: '4-6 hours', score_weight: 2 },
      { value: '7_9', label: '7-9 hours', score_weight: -3 },
      { value: '10_plus', label: '10+ hours', score_weight: -8 },
    ],
    is_required: true,
  },
  {
    domain: HealthDomain.LIFESTYLE,
    domain_order: DOMAIN_ORDER[HealthDomain.LIFESTYLE],
    question_order: 5,
    question_text: 'Do you smoke or use tobacco products?',
    question_type: QuestionType.YES_NO,
    options: [
      { value: 'yes', label: 'Yes', score_weight: -10 },
      { value: 'no', label: 'No', score_weight: 5 },
    ],
    is_required: true,
  },

  // Domain 5: Physical Symptoms (4 questions)
  {
    domain: HealthDomain.PHYSICAL_SYMPTOMS,
    domain_order: DOMAIN_ORDER[HealthDomain.PHYSICAL_SYMPTOMS],
    question_order: 1,
    question_text: 'Do you experience chronic pain in any area of your body?',
    question_type: QuestionType.MULTIPLE_CHOICE,
    options: [
      { value: 'none', label: 'None', score_weight: 5 },
      { value: 'head', label: 'Head', score_weight: -3 },
      { value: 'back', label: 'Back', score_weight: -3 },
      { value: 'joints', label: 'Joints', score_weight: -3 },
      { value: 'abdomen', label: 'Abdomen', score_weight: -3 },
      { value: 'other', label: 'Other', score_weight: -3 },
    ],
    is_required: true,
    help_text: 'Select all that apply',
  },
  {
    domain: HealthDomain.PHYSICAL_SYMPTOMS,
    domain_order: DOMAIN_ORDER[HealthDomain.PHYSICAL_SYMPTOMS],
    question_order: 2,
    question_text: 'Have you noticed any changes in your vision or hearing recently?',
    question_type: QuestionType.YES_NO,
    options: [
      { value: 'yes', label: 'Yes', score_weight: -5 },
      { value: 'no', label: 'No', score_weight: 3 },
    ],
    is_required: true,
  },
  {
    domain: HealthDomain.PHYSICAL_SYMPTOMS,
    domain_order: DOMAIN_ORDER[HealthDomain.PHYSICAL_SYMPTOMS],
    question_order: 3,
    question_text: 'Do you experience digestive issues (bloating, constipation, etc.)?',
    question_type: QuestionType.SINGLE_CHOICE,
    options: [
      { value: 'never', label: 'Never', score_weight: 5 },
      { value: 'occasionally', label: 'Occasionally', score_weight: 0 },
      { value: 'frequently', label: 'Frequently', score_weight: -5 },
    ],
    is_required: true,
  },
  {
    domain: HealthDomain.PHYSICAL_SYMPTOMS,
    domain_order: DOMAIN_ORDER[HealthDomain.PHYSICAL_SYMPTOMS],
    question_order: 4,
    question_text: 'Have you noticed any unusual skin changes (rashes, moles, etc.)?',
    question_type: QuestionType.YES_NO,
    options: [
      { value: 'yes', label: 'Yes', score_weight: -5 },
      { value: 'no', label: 'No', score_weight: 3 },
    ],
    is_required: true,
  },

  // Domain 6: Preventive Care (3 questions)
  {
    domain: HealthDomain.PREVENTIVE_CARE,
    domain_order: DOMAIN_ORDER[HealthDomain.PREVENTIVE_CARE],
    question_order: 1,
    question_text: 'When was your last comprehensive health checkup?',
    question_type: QuestionType.SINGLE_CHOICE,
    options: [
      { value: 'less_6_months', label: 'Less than 6 months ago', score_weight: 5 },
      { value: '6_12_months', label: '6-12 months ago', score_weight: 3 },
      { value: '1_2_years', label: '1-2 years ago', score_weight: 0 },
      { value: 'more_2_years', label: 'More than 2 years ago', score_weight: -5 },
      { value: 'never', label: 'Never', score_weight: -8 },
    ],
    is_required: true,
  },
  {
    domain: HealthDomain.PREVENTIVE_CARE,
    domain_order: DOMAIN_ORDER[HealthDomain.PREVENTIVE_CARE],
    question_order: 2,
    question_text: 'Are your vaccinations up to date?',
    question_type: QuestionType.SINGLE_CHOICE,
    options: [
      { value: 'yes', label: 'Yes', score_weight: 5 },
      { value: 'no', label: 'No', score_weight: -3 },
      { value: 'not_sure', label: 'Not sure', score_weight: -1 },
    ],
    is_required: true,
  },
  {
    domain: HealthDomain.PREVENTIVE_CARE,
    domain_order: DOMAIN_ORDER[HealthDomain.PREVENTIVE_CARE],
    question_order: 3,
    question_text: 'Do you regularly monitor your blood pressure at home?',
    question_type: QuestionType.YES_NO,
    options: [
      { value: 'yes', label: 'Yes', score_weight: 5 },
      { value: 'no', label: 'No', score_weight: -2 },
    ],
    is_required: true,
  },
];
