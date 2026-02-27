/**
 * Validated clinical screening instruments for addiction assessment.
 * Each instrument is evidence-based with established psychometric properties.
 *
 * References:
 * - AUDIT: Saunders JB et al. (1993). WHO collaborative project.
 * - DAST-10: Skinner HA (1982). Drug Abuse Screening Test.
 * - CAGE: Ewing JA (1984). Detecting alcoholism.
 * - ASSIST: WHO ASSIST Working Group (2002).
 */

export interface ScreeningQuestion {
  id: string;
  text: string;
  help_text?: string;
  options: Array<{
    value: number;
    label: string;
    description?: string;
  }>;
}

export interface RiskZone {
  min_score: number;
  max_score: number;
  level: 'low' | 'moderate' | 'high' | 'severe';
  label: string;
  recommendation: string;
  colour: string;
}

export interface ScoringConfig {
  min_score: number;
  max_score: number;
  reverse_scored_questions: string[];
  subscales?: Record<string, string[]>;
}

export interface ScreeningInstrument {
  id: string;
  name: string;
  short_name: string;
  description: string;
  version: string;
  citation: string;
  estimated_minutes: number;
  target_substances: string[];
  questions: ScreeningQuestion[];
  scoring: ScoringConfig;
  risk_zones: RiskZone[];
}

// ─── AUDIT (Alcohol Use Disorders Identification Test) ──────────────
export const AUDIT: ScreeningInstrument = {
  id: 'audit',
  name: 'Alcohol Use Disorders Identification Test',
  short_name: 'AUDIT',
  description:
    'A 10-item screening tool developed by the WHO to assess alcohol consumption, drinking behaviours, and alcohol-related problems.',
  version: '2.0',
  citation:
    'Saunders JB, Aasland OG, Babor TF, de la Fuente JR, Grant M. Development of the Alcohol Use Disorders Identification Test (AUDIT). WHO Collaborative Project on Early Detection of Persons with Harmful Alcohol Consumption-II. Addiction. 1993;88(6):791-804.',
  estimated_minutes: 5,
  target_substances: ['alcohol'],
  questions: [
    {
      id: 'audit_q1',
      text: 'How often do you have a drink containing alcohol?',
      options: [
        { value: 0, label: 'Never' },
        { value: 1, label: 'Monthly or less' },
        { value: 2, label: '2-4 times a month' },
        { value: 3, label: '2-3 times a week' },
        { value: 4, label: '4 or more times a week' },
      ],
    },
    {
      id: 'audit_q2',
      text: 'How many units of alcohol do you drink on a typical day when you are drinking?',
      help_text:
        'In the UK, 1 unit = half a pint of regular beer, a small glass of wine, or a single measure of spirits.',
      options: [
        { value: 0, label: '1 or 2' },
        { value: 1, label: '3 or 4' },
        { value: 2, label: '5 or 6' },
        { value: 3, label: '7, 8, or 9' },
        { value: 4, label: '10 or more' },
      ],
    },
    {
      id: 'audit_q3',
      text: 'How often do you have 6 or more units on a single occasion?',
      options: [
        { value: 0, label: 'Never' },
        { value: 1, label: 'Less than monthly' },
        { value: 2, label: 'Monthly' },
        { value: 3, label: 'Weekly' },
        { value: 4, label: 'Daily or almost daily' },
      ],
    },
    {
      id: 'audit_q4',
      text: 'How often during the last year have you found that you were not able to stop drinking once you had started?',
      options: [
        { value: 0, label: 'Never' },
        { value: 1, label: 'Less than monthly' },
        { value: 2, label: 'Monthly' },
        { value: 3, label: 'Weekly' },
        { value: 4, label: 'Daily or almost daily' },
      ],
    },
    {
      id: 'audit_q5',
      text: 'How often during the last year have you failed to do what was normally expected from you because of your drinking?',
      options: [
        { value: 0, label: 'Never' },
        { value: 1, label: 'Less than monthly' },
        { value: 2, label: 'Monthly' },
        { value: 3, label: 'Weekly' },
        { value: 4, label: 'Daily or almost daily' },
      ],
    },
    {
      id: 'audit_q6',
      text: 'How often during the last year have you needed an alcoholic drink in the morning to get yourself going after a heavy drinking session?',
      options: [
        { value: 0, label: 'Never' },
        { value: 1, label: 'Less than monthly' },
        { value: 2, label: 'Monthly' },
        { value: 3, label: 'Weekly' },
        { value: 4, label: 'Daily or almost daily' },
      ],
    },
    {
      id: 'audit_q7',
      text: 'How often during the last year have you had a feeling of guilt or remorse after drinking?',
      options: [
        { value: 0, label: 'Never' },
        { value: 1, label: 'Less than monthly' },
        { value: 2, label: 'Monthly' },
        { value: 3, label: 'Weekly' },
        { value: 4, label: 'Daily or almost daily' },
      ],
    },
    {
      id: 'audit_q8',
      text: 'How often during the last year have you been unable to remember what happened the night before because you had been drinking?',
      options: [
        { value: 0, label: 'Never' },
        { value: 1, label: 'Less than monthly' },
        { value: 2, label: 'Monthly' },
        { value: 3, label: 'Weekly' },
        { value: 4, label: 'Daily or almost daily' },
      ],
    },
    {
      id: 'audit_q9',
      text: 'Have you or somebody else been injured as a result of your drinking?',
      options: [
        { value: 0, label: 'No' },
        { value: 2, label: 'Yes, but not in the last year' },
        { value: 4, label: 'Yes, during the last year' },
      ],
    },
    {
      id: 'audit_q10',
      text: 'Has a relative, friend, doctor, or other health worker been concerned about your drinking or suggested that you cut down?',
      options: [
        { value: 0, label: 'No' },
        { value: 2, label: 'Yes, but not in the last year' },
        { value: 4, label: 'Yes, during the last year' },
      ],
    },
  ],
  scoring: {
    min_score: 0,
    max_score: 40,
    reverse_scored_questions: [],
  },
  risk_zones: [
    {
      min_score: 0,
      max_score: 7,
      level: 'low',
      label: 'Low risk',
      recommendation: 'Alcohol education and general health advice.',
      colour: '#10B981',
    },
    {
      min_score: 8,
      max_score: 15,
      level: 'moderate',
      label: 'Hazardous drinking',
      recommendation:
        'Brief intervention with simple advice and continued monitoring.',
      colour: '#F59E0B',
    },
    {
      min_score: 16,
      max_score: 19,
      level: 'high',
      label: 'Harmful drinking',
      recommendation:
        'Brief intervention, continued monitoring, and referral to a specialist.',
      colour: '#F97316',
    },
    {
      min_score: 20,
      max_score: 40,
      level: 'severe',
      label: 'Possible alcohol dependence',
      recommendation:
        'Referral to an addiction specialist for diagnostic evaluation and treatment.',
      colour: '#EF4444',
    },
  ],
};

// ─── DAST-10 (Drug Abuse Screening Test) ────────────────────────────
export const DAST10: ScreeningInstrument = {
  id: 'dast10',
  name: 'Drug Abuse Screening Test',
  short_name: 'DAST-10',
  description:
    'A 10-item brief screening instrument for detecting drug abuse (excluding alcohol and tobacco).',
  version: '1.0',
  citation:
    'Skinner HA. The Drug Abuse Screening Test. Addictive Behaviors. 1982;7(4):363-371.',
  estimated_minutes: 3,
  target_substances: [
    'cannabis',
    'cocaine',
    'opioids',
    'amphetamines',
    'sedatives',
    'hallucinogens',
    'inhalants',
    'other',
  ],
  questions: [
    {
      id: 'dast_q1',
      text: 'Have you used drugs other than those required for medical reasons?',
      options: [
        { value: 1, label: 'Yes' },
        { value: 0, label: 'No' },
      ],
    },
    {
      id: 'dast_q2',
      text: 'Do you abuse more than one drug at a time?',
      options: [
        { value: 1, label: 'Yes' },
        { value: 0, label: 'No' },
      ],
    },
    {
      id: 'dast_q3',
      text: 'Are you always able to stop using drugs when you want to?',
      help_text: 'This question is reverse-scored: "Yes" = 0, "No" = 1.',
      options: [
        { value: 0, label: 'Yes' },
        { value: 1, label: 'No' },
      ],
    },
    {
      id: 'dast_q4',
      text: 'Have you had blackouts or flashbacks as a result of drug use?',
      options: [
        { value: 1, label: 'Yes' },
        { value: 0, label: 'No' },
      ],
    },
    {
      id: 'dast_q5',
      text: 'Do you ever feel bad or guilty about your drug use?',
      options: [
        { value: 1, label: 'Yes' },
        { value: 0, label: 'No' },
      ],
    },
    {
      id: 'dast_q6',
      text: 'Does your spouse (or parents) ever complain about your involvement with drugs?',
      options: [
        { value: 1, label: 'Yes' },
        { value: 0, label: 'No' },
      ],
    },
    {
      id: 'dast_q7',
      text: 'Have you neglected your family because of your use of drugs?',
      options: [
        { value: 1, label: 'Yes' },
        { value: 0, label: 'No' },
      ],
    },
    {
      id: 'dast_q8',
      text: 'Have you engaged in illegal activities in order to obtain drugs?',
      options: [
        { value: 1, label: 'Yes' },
        { value: 0, label: 'No' },
      ],
    },
    {
      id: 'dast_q9',
      text: 'Have you ever experienced withdrawal symptoms (felt sick) when you stopped taking drugs?',
      options: [
        { value: 1, label: 'Yes' },
        { value: 0, label: 'No' },
      ],
    },
    {
      id: 'dast_q10',
      text: 'Have you had medical problems as a result of your drug use (e.g., memory loss, hepatitis, convulsions, bleeding)?',
      options: [
        { value: 1, label: 'Yes' },
        { value: 0, label: 'No' },
      ],
    },
  ],
  scoring: {
    min_score: 0,
    max_score: 10,
    reverse_scored_questions: ['dast_q3'],
  },
  risk_zones: [
    {
      min_score: 0,
      max_score: 0,
      level: 'low',
      label: 'No problems reported',
      recommendation: 'No intervention required at this time.',
      colour: '#10B981',
    },
    {
      min_score: 1,
      max_score: 2,
      level: 'low',
      label: 'Low level of problems',
      recommendation: 'Monitoring and brief education.',
      colour: '#84CC16',
    },
    {
      min_score: 3,
      max_score: 5,
      level: 'moderate',
      label: 'Moderate level of problems',
      recommendation: 'Further investigation and brief intervention.',
      colour: '#F59E0B',
    },
    {
      min_score: 6,
      max_score: 8,
      level: 'high',
      label: 'Substantial level of problems',
      recommendation: 'Intensive assessment and structured treatment.',
      colour: '#F97316',
    },
    {
      min_score: 9,
      max_score: 10,
      level: 'severe',
      label: 'Severe level of problems',
      recommendation:
        'Intensive assessment and specialist addiction treatment.',
      colour: '#EF4444',
    },
  ],
};

// ─── CAGE (Quick Alcohol Screen) ────────────────────────────────────
export const CAGE: ScreeningInstrument = {
  id: 'cage',
  name: 'CAGE Questionnaire',
  short_name: 'CAGE',
  description:
    'A rapid 4-question screening for alcohol problems. Clinically significant at 2+, high likelihood of dependence at 3+.',
  version: '1.0',
  citation:
    'Ewing JA. Detecting alcoholism. The CAGE questionnaire. JAMA. 1984;252(14):1905-1907.',
  estimated_minutes: 1,
  target_substances: ['alcohol'],
  questions: [
    {
      id: 'cage_q1',
      text: 'Have you ever felt you should Cut down on your drinking?',
      options: [
        { value: 1, label: 'Yes' },
        { value: 0, label: 'No' },
      ],
    },
    {
      id: 'cage_q2',
      text: 'Have people Annoyed you by criticising your drinking?',
      options: [
        { value: 1, label: 'Yes' },
        { value: 0, label: 'No' },
      ],
    },
    {
      id: 'cage_q3',
      text: 'Have you ever felt Guilty about your drinking?',
      options: [
        { value: 1, label: 'Yes' },
        { value: 0, label: 'No' },
      ],
    },
    {
      id: 'cage_q4',
      text: 'Have you ever had a drink first thing in the morning to steady your nerves or get rid of a hangover (Eye-opener)?',
      options: [
        { value: 1, label: 'Yes' },
        { value: 0, label: 'No' },
      ],
    },
  ],
  scoring: {
    min_score: 0,
    max_score: 4,
    reverse_scored_questions: [],
  },
  risk_zones: [
    {
      min_score: 0,
      max_score: 1,
      level: 'low',
      label: 'Low risk',
      recommendation: 'No immediate concern. General health advice.',
      colour: '#10B981',
    },
    {
      min_score: 2,
      max_score: 2,
      level: 'moderate',
      label: 'Clinically significant',
      recommendation: 'Further assessment recommended. Consider AUDIT for detailed evaluation.',
      colour: '#F59E0B',
    },
    {
      min_score: 3,
      max_score: 3,
      level: 'high',
      label: 'High likelihood of alcohol problem',
      recommendation: 'Referral for comprehensive assessment and intervention.',
      colour: '#F97316',
    },
    {
      min_score: 4,
      max_score: 4,
      level: 'severe',
      label: 'Strong indicator of alcohol dependence',
      recommendation:
        'Urgent referral to addiction specialist for diagnostic evaluation.',
      colour: '#EF4444',
    },
  ],
};

// ─── WHO ASSIST (Alcohol, Smoking and Substance Involvement Screening Test) ─
const ASSIST_FREQUENCY_OPTIONS = [
  { value: 0, label: 'Never' },
  { value: 2, label: 'Once or twice' },
  { value: 3, label: 'Monthly' },
  { value: 4, label: 'Weekly' },
  { value: 6, label: 'Daily or almost daily' },
];

const ASSIST_CONCERN_OPTIONS = [
  { value: 0, label: 'Never' },
  { value: 3, label: 'Yes, in the past 3 months' },
  { value: 6, label: 'Yes, but not in the past 3 months' },
];

export const ASSIST: ScreeningInstrument = {
  id: 'assist',
  name: 'WHO Alcohol, Smoking and Substance Involvement Screening Test',
  short_name: 'ASSIST',
  description:
    'An 8-question instrument designed by the WHO to screen for hazardous use of alcohol, tobacco, and illicit substances. Scores each substance independently.',
  version: '3.1',
  citation:
    'WHO ASSIST Working Group. The Alcohol, Smoking and Substance Involvement Screening Test (ASSIST): development, reliability and feasibility. Addiction. 2002;97(9):1183-1194.',
  estimated_minutes: 10,
  target_substances: [
    'tobacco',
    'alcohol',
    'cannabis',
    'cocaine',
    'amphetamines',
    'inhalants',
    'sedatives',
    'hallucinogens',
    'opioids',
    'other',
  ],
  questions: [
    {
      id: 'assist_q1',
      text: 'In your life, which of the following substances have you ever used? (Select all that apply)',
      help_text:
        'This is a gateway question. Subsequent questions are asked only for substances used.',
      options: [
        { value: 1, label: 'Tobacco products' },
        { value: 1, label: 'Alcoholic beverages' },
        { value: 1, label: 'Cannabis' },
        { value: 1, label: 'Cocaine' },
        { value: 1, label: 'Amphetamine-type stimulants' },
        { value: 1, label: 'Inhalants' },
        { value: 1, label: 'Sedatives or sleeping pills' },
        { value: 1, label: 'Hallucinogens' },
        { value: 1, label: 'Opioids' },
        { value: 1, label: 'Other (specify)' },
      ],
    },
    {
      id: 'assist_q2',
      text: 'In the past 3 months, how often have you used [substance]?',
      options: ASSIST_FREQUENCY_OPTIONS,
    },
    {
      id: 'assist_q3',
      text: 'During the past 3 months, how often have you had a strong desire or urge to use [substance]?',
      options: ASSIST_FREQUENCY_OPTIONS,
    },
    {
      id: 'assist_q4',
      text: 'During the past 3 months, how often has your use of [substance] led to health, social, legal, or financial problems?',
      options: ASSIST_FREQUENCY_OPTIONS,
    },
    {
      id: 'assist_q5',
      text: 'During the past 3 months, how often have you failed to do what was normally expected of you because of your use of [substance]?',
      options: ASSIST_FREQUENCY_OPTIONS,
    },
    {
      id: 'assist_q6',
      text: 'Has a friend or relative or anyone else ever expressed concern about your use of [substance]?',
      options: ASSIST_CONCERN_OPTIONS,
    },
    {
      id: 'assist_q7',
      text: 'Have you ever tried and failed to control, cut down, or stop using [substance]?',
      options: [
        { value: 0, label: 'No, never' },
        { value: 3, label: 'Yes, in the past 3 months' },
        { value: 6, label: 'Yes, but not in the past 3 months' },
      ],
    },
    {
      id: 'assist_q8',
      text: 'Have you ever used any drug by injection? (non-medical use only)',
      help_text:
        'This question is substance-independent and identifies injection risk.',
      options: [
        { value: 0, label: 'No, never' },
        { value: 2, label: 'Yes, in the past 3 months' },
        { value: 1, label: 'Yes, but not in the past 3 months' },
      ],
    },
  ],
  scoring: {
    min_score: 0,
    max_score: 39,
    reverse_scored_questions: [],
    subscales: {
      tobacco: ['assist_q2', 'assist_q3', 'assist_q4', 'assist_q5', 'assist_q6', 'assist_q7'],
      alcohol: ['assist_q2', 'assist_q3', 'assist_q4', 'assist_q5', 'assist_q6', 'assist_q7'],
      cannabis: ['assist_q2', 'assist_q3', 'assist_q4', 'assist_q5', 'assist_q6', 'assist_q7'],
      cocaine: ['assist_q2', 'assist_q3', 'assist_q4', 'assist_q5', 'assist_q6', 'assist_q7'],
      amphetamines: ['assist_q2', 'assist_q3', 'assist_q4', 'assist_q5', 'assist_q6', 'assist_q7'],
      inhalants: ['assist_q2', 'assist_q3', 'assist_q4', 'assist_q5', 'assist_q6', 'assist_q7'],
      sedatives: ['assist_q2', 'assist_q3', 'assist_q4', 'assist_q5', 'assist_q6', 'assist_q7'],
      hallucinogens: ['assist_q2', 'assist_q3', 'assist_q4', 'assist_q5', 'assist_q6', 'assist_q7'],
      opioids: ['assist_q2', 'assist_q3', 'assist_q4', 'assist_q5', 'assist_q6', 'assist_q7'],
    },
  },
  risk_zones: [
    {
      min_score: 0,
      max_score: 3,
      level: 'low',
      label: 'Low risk',
      recommendation:
        'Provide health information related to substance use, if relevant.',
      colour: '#10B981',
    },
    {
      min_score: 4,
      max_score: 26,
      level: 'moderate',
      label: 'Moderate risk',
      recommendation:
        'Brief intervention: feedback, responsibility, advice, menu, empathy, self-efficacy.',
      colour: '#F59E0B',
    },
    {
      min_score: 27,
      max_score: 39,
      level: 'severe',
      label: 'High risk',
      recommendation:
        'Intensive intervention and referral to specialist treatment.',
      colour: '#EF4444',
    },
  ],
};

// Note: ASSIST uses different thresholds for alcohol subscale:
// Low: 0-10, Moderate: 11-26, High: 27+
export const ASSIST_ALCOHOL_RISK_ZONES: RiskZone[] = [
  {
    min_score: 0,
    max_score: 10,
    level: 'low',
    label: 'Low risk',
    recommendation: 'General health information.',
    colour: '#10B981',
  },
  {
    min_score: 11,
    max_score: 26,
    level: 'moderate',
    label: 'Moderate risk',
    recommendation: 'Brief intervention.',
    colour: '#F59E0B',
  },
  {
    min_score: 27,
    max_score: 39,
    level: 'severe',
    label: 'High risk',
    recommendation: 'Intensive intervention and specialist referral.',
    colour: '#EF4444',
  },
];

// ─── Instrument Registry ────────────────────────────────────────────
export const SCREENING_INSTRUMENTS: Record<string, ScreeningInstrument> = {
  audit: AUDIT,
  dast10: DAST10,
  cage: CAGE,
  assist: ASSIST,
};

export const getInstrument = (id: string): ScreeningInstrument | undefined =>
  SCREENING_INSTRUMENTS[id];

export const getRecommendedInstrument = (
  targetSubstances: string[],
  wantQuickScreen: boolean,
): string => {
  if (wantQuickScreen && targetSubstances.includes('alcohol')) return 'cage';
  if (
    targetSubstances.length === 1 &&
    targetSubstances[0] === 'alcohol'
  )
    return 'audit';
  if (
    targetSubstances.length === 1 &&
    !['alcohol', 'tobacco'].includes(targetSubstances[0])
  )
    return 'dast10';
  return 'assist';
};
