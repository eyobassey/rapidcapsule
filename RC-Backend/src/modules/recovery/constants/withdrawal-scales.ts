/**
 * Clinician-administered withdrawal assessment scales.
 * These are specialist-only instruments (not patient self-report).
 *
 * References:
 * - COWS: Wesson DR, Ling W (2003). Clinical Opiate Withdrawal Scale.
 * - CIWA-Ar: Sullivan JT et al. (1989). Assessment of alcohol withdrawal.
 */

export interface WithdrawalScaleItem {
  id: string;
  name: string;
  description: string;
  options: Array<{
    value: number;
    label: string;
    description?: string;
  }>;
  max_score: number;
}

export interface WithdrawalSeverityZone {
  min_score: number;
  max_score: number;
  severity: 'mild' | 'moderate' | 'moderately_severe' | 'severe';
  label: string;
  clinical_action: string;
  colour: string;
}

export interface WithdrawalScale {
  id: string;
  name: string;
  short_name: string;
  description: string;
  citation: string;
  target_substances: string[];
  administered_by: 'specialist';
  estimated_minutes: number;
  max_total_score: number;
  items: WithdrawalScaleItem[];
  severity_zones: WithdrawalSeverityZone[];
}

// ─── COWS (Clinical Opiate Withdrawal Scale) ──────────────────────────
export const COWS: WithdrawalScale = {
  id: 'cows',
  name: 'Clinical Opiate Withdrawal Scale',
  short_name: 'COWS',
  description:
    'An 11-item clinician-administered scale for rating common signs and symptoms of opiate withdrawal. Used to monitor patients in opioid withdrawal and guide treatment decisions.',
  citation:
    'Wesson DR, Ling W. The Clinical Opiate Withdrawal Scale (COWS). J Psychoactive Drugs. 2003;35(2):253-259.',
  target_substances: ['opioids', 'heroin', 'fentanyl', 'morphine', 'oxycodone', 'codeine'],
  administered_by: 'specialist',
  estimated_minutes: 5,
  max_total_score: 48,
  items: [
    {
      id: 'resting_pulse',
      name: 'Resting Pulse Rate',
      description: 'Measure after patient is sitting or lying for one minute',
      options: [
        { value: 0, label: '≤80 bpm', description: 'Pulse rate 80 or below' },
        { value: 1, label: '81–100 bpm', description: 'Pulse rate 81–100' },
        { value: 2, label: '101–120 bpm', description: 'Pulse rate 101–120' },
        { value: 4, label: '>120 bpm', description: 'Pulse rate greater than 120' },
      ],
      max_score: 4,
    },
    {
      id: 'sweating',
      name: 'Sweating',
      description: 'Observe over last half hour, not accounted for by room temperature or patient activity',
      options: [
        { value: 0, label: 'No report of chills or flushing' },
        { value: 1, label: 'Subjective report of chills or flushing' },
        { value: 2, label: 'Flushed or observable moistness on face' },
        { value: 3, label: 'Beads of sweat on brow or face' },
        { value: 4, label: 'Sweat streaming off face' },
      ],
      max_score: 4,
    },
    {
      id: 'restlessness',
      name: 'Restlessness',
      description: 'Observation during assessment',
      options: [
        { value: 0, label: 'Able to sit still' },
        { value: 1, label: 'Reports difficulty sitting still, but is able to do so' },
        { value: 3, label: 'Frequent shifting or extraneous movements of legs/arms' },
        { value: 5, label: 'Unable to sit still for more than a few seconds' },
      ],
      max_score: 5,
    },
    {
      id: 'pupil_size',
      name: 'Pupil Size',
      description: 'Observe in room light',
      options: [
        { value: 0, label: 'Pupils pinned or normal size for room light' },
        { value: 1, label: 'Pupils possibly larger than normal for room light' },
        { value: 2, label: 'Pupils moderately dilated' },
        { value: 5, label: 'Pupils so dilated that only the rim of the iris is visible' },
      ],
      max_score: 5,
    },
    {
      id: 'bone_joint_aches',
      name: 'Bone or Joint Aches',
      description: 'If patient was having pain previously, only assess additional component attributed to withdrawal',
      options: [
        { value: 0, label: 'Not present' },
        { value: 1, label: 'Mild diffuse discomfort' },
        { value: 2, label: 'Patient reports severe diffuse aching of joints/muscles' },
        { value: 4, label: 'Patient is rubbing joints or muscles and is unable to sit still because of discomfort' },
      ],
      max_score: 4,
    },
    {
      id: 'runny_nose_tearing',
      name: 'Runny Nose or Tearing',
      description: 'Not accounted for by cold symptoms or allergies',
      options: [
        { value: 0, label: 'Not present' },
        { value: 1, label: 'Nasal stuffiness or unusually moist eyes' },
        { value: 2, label: 'Nose running or tearing' },
        { value: 4, label: 'Nose constantly running or tears streaming down cheeks' },
      ],
      max_score: 4,
    },
    {
      id: 'gi_upset',
      name: 'GI Upset',
      description: 'Over last half hour',
      options: [
        { value: 0, label: 'No GI symptoms' },
        { value: 1, label: 'Stomach cramps' },
        { value: 2, label: 'Nausea or loose stool' },
        { value: 3, label: 'Vomiting or diarrhea' },
        { value: 5, label: 'Multiple episodes of diarrhea or vomiting' },
      ],
      max_score: 5,
    },
    {
      id: 'tremor',
      name: 'Tremor',
      description: 'Observation of outstretched hands',
      options: [
        { value: 0, label: 'No tremor' },
        { value: 1, label: 'Tremor can be felt, but not observed' },
        { value: 2, label: 'Slight tremor observable' },
        { value: 4, label: 'Gross tremor or muscle twitching' },
      ],
      max_score: 4,
    },
    {
      id: 'yawning',
      name: 'Yawning',
      description: 'Observation during assessment',
      options: [
        { value: 0, label: 'No yawning' },
        { value: 1, label: 'Yawning once or twice during assessment' },
        { value: 2, label: 'Yawning three or more times during assessment' },
        { value: 4, label: 'Yawning several times per minute' },
      ],
      max_score: 4,
    },
    {
      id: 'anxiety_irritability',
      name: 'Anxiety or Irritability',
      description: 'Observe and ask patient',
      options: [
        { value: 0, label: 'None' },
        { value: 1, label: 'Patient reports increasing irritability or anxiousness' },
        { value: 2, label: 'Patient obviously irritable or anxious' },
        { value: 4, label: 'Patient so irritable or anxious that participation in the assessment is difficult' },
      ],
      max_score: 4,
    },
    {
      id: 'gooseflesh',
      name: 'Gooseflesh Skin',
      description: 'Observe skin on arms',
      options: [
        { value: 0, label: 'Skin is smooth' },
        { value: 3, label: 'Piloerection of skin can be felt or hairs standing up on arms' },
        { value: 5, label: 'Prominent piloerection' },
      ],
      max_score: 5,
    },
  ],
  severity_zones: [
    {
      min_score: 5,
      max_score: 12,
      severity: 'mild',
      label: 'Mild Withdrawal',
      clinical_action: 'Monitor; consider comfort medications. May initiate buprenorphine induction.',
      colour: '#FEF3C7',
    },
    {
      min_score: 13,
      max_score: 24,
      severity: 'moderate',
      label: 'Moderate Withdrawal',
      clinical_action: 'Suitable for buprenorphine induction. Provide symptomatic treatment.',
      colour: '#FFEDD5',
    },
    {
      min_score: 25,
      max_score: 36,
      severity: 'moderately_severe',
      label: 'Moderately Severe Withdrawal',
      clinical_action: 'Initiate buprenorphine induction. Consider increased monitoring.',
      colour: '#FEE2E2',
    },
    {
      min_score: 37,
      max_score: 48,
      severity: 'severe',
      label: 'Severe Withdrawal',
      clinical_action: 'Immediate intervention required. Consider inpatient management.',
      colour: '#FCA5A5',
    },
  ],
};

// ─── CIWA-Ar (Clinical Institute Withdrawal Assessment for Alcohol, Revised) ──
export const CIWA_AR: WithdrawalScale = {
  id: 'ciwa_ar',
  name: 'Clinical Institute Withdrawal Assessment for Alcohol, Revised',
  short_name: 'CIWA-Ar',
  description:
    'A 10-item clinician-administered scale for quantifying the severity of alcohol withdrawal syndrome. Guides pharmacological management of withdrawal.',
  citation:
    'Sullivan JT, Sykora K, Schneiderman J, Naranjo CA, Sellers EM. Assessment of alcohol withdrawal: the revised clinical institute withdrawal assessment for alcohol scale (CIWA-Ar). Br J Addict. 1989;84(11):1353-1357.',
  target_substances: ['alcohol'],
  administered_by: 'specialist',
  estimated_minutes: 5,
  max_total_score: 67,
  items: [
    {
      id: 'nausea_vomiting',
      name: 'Nausea and Vomiting',
      description: 'Ask "Do you feel sick to your stomach? Have you vomited?"',
      options: [
        { value: 0, label: 'No nausea and no vomiting' },
        { value: 1, label: 'Mild nausea with no vomiting' },
        { value: 4, label: 'Intermittent nausea with dry heaves' },
        { value: 7, label: 'Constant nausea, frequent dry heaves and vomiting' },
      ],
      max_score: 7,
    },
    {
      id: 'tremor',
      name: 'Tremor',
      description: 'Arms extended and fingers spread apart. Observation.',
      options: [
        { value: 0, label: 'No tremor' },
        { value: 1, label: 'Not visible, but can be felt fingertip to fingertip' },
        { value: 4, label: 'Moderate, given patient\'s arms are extended' },
        { value: 7, label: 'Severe, even with arms not extended' },
      ],
      max_score: 7,
    },
    {
      id: 'paroxysmal_sweats',
      name: 'Paroxysmal Sweats',
      description: 'Observation',
      options: [
        { value: 0, label: 'No sweat visible' },
        { value: 1, label: 'Barely perceptible sweating, damp palms' },
        { value: 4, label: 'Beads of sweat obvious on forehead' },
        { value: 7, label: 'Drenching sweats' },
      ],
      max_score: 7,
    },
    {
      id: 'anxiety',
      name: 'Anxiety',
      description: 'Ask "Do you feel nervous?" Observation.',
      options: [
        { value: 0, label: 'No anxiety, at ease' },
        { value: 1, label: 'Mildly anxious' },
        { value: 4, label: 'Moderately anxious, or guarded' },
        { value: 7, label: 'Equivalent to acute panic states as seen in severe delirium or acute schizophrenic reactions' },
      ],
      max_score: 7,
    },
    {
      id: 'agitation',
      name: 'Agitation',
      description: 'Observation',
      options: [
        { value: 0, label: 'Normal activity' },
        { value: 1, label: 'Somewhat more than normal activity' },
        { value: 4, label: 'Moderately fidgety and restless' },
        { value: 7, label: 'Paces back and forth during interview, or constantly thrashes about' },
      ],
      max_score: 7,
    },
    {
      id: 'tactile_disturbances',
      name: 'Tactile Disturbances',
      description: 'Ask "Have you any itching, pins and needles sensations, any burning, any numbness, or do you feel bugs crawling on or under your skin?"',
      options: [
        { value: 0, label: 'None' },
        { value: 1, label: 'Very mild itching, pins and needles, burning, or numbness' },
        { value: 2, label: 'Mild itching, pins and needles, burning, or numbness' },
        { value: 3, label: 'Moderate itching, pins and needles, burning, or numbness' },
        { value: 4, label: 'Moderately severe hallucinations' },
        { value: 5, label: 'Severe hallucinations' },
        { value: 7, label: 'Continuous hallucinations' },
      ],
      max_score: 7,
    },
    {
      id: 'auditory_disturbances',
      name: 'Auditory Disturbances',
      description: 'Ask "Are you more aware of sounds around you? Are they harsh? Do they frighten you? Are you hearing anything that is disturbing to you? Are you hearing things you know are not there?"',
      options: [
        { value: 0, label: 'Not present' },
        { value: 1, label: 'Very mild harshness or ability to frighten' },
        { value: 2, label: 'Mild harshness or ability to frighten' },
        { value: 3, label: 'Moderate harshness or ability to frighten' },
        { value: 4, label: 'Moderately severe hallucinations' },
        { value: 5, label: 'Severe hallucinations' },
        { value: 7, label: 'Continuous hallucinations' },
      ],
      max_score: 7,
    },
    {
      id: 'visual_disturbances',
      name: 'Visual Disturbances',
      description: 'Ask "Does the light appear to be too bright? Is its colour different? Does it hurt your eyes? Are you seeing anything that is disturbing to you? Are you seeing things you know are not there?"',
      options: [
        { value: 0, label: 'Not present' },
        { value: 1, label: 'Very mild sensitivity' },
        { value: 2, label: 'Mild sensitivity' },
        { value: 3, label: 'Moderate sensitivity' },
        { value: 4, label: 'Moderately severe hallucinations' },
        { value: 5, label: 'Severe hallucinations' },
        { value: 7, label: 'Continuous hallucinations' },
      ],
      max_score: 7,
    },
    {
      id: 'headache',
      name: 'Headache, Fullness in Head',
      description: 'Ask "Does your head feel different? Does it feel like there is a band around your head?" Do not rate for dizziness or lightheadedness.',
      options: [
        { value: 0, label: 'Not present' },
        { value: 1, label: 'Very mild headache' },
        { value: 2, label: 'Mild headache' },
        { value: 3, label: 'Moderate headache' },
        { value: 4, label: 'Moderately severe headache' },
        { value: 5, label: 'Severe headache' },
        { value: 7, label: 'Extremely severe headache' },
      ],
      max_score: 7,
    },
    {
      id: 'orientation',
      name: 'Orientation and Clouding of Sensorium',
      description: 'Ask "What day is this? Where are you? Who am I?"',
      options: [
        { value: 0, label: 'Oriented and can do serial additions' },
        { value: 1, label: 'Cannot do serial additions or is uncertain about date' },
        { value: 2, label: 'Date uncertain by more than 2 calendar days' },
        { value: 3, label: 'Disoriented for date by more than 2 calendar days' },
        { value: 4, label: 'Disoriented for place and/or person' },
      ],
      max_score: 4,
    },
  ],
  severity_zones: [
    {
      min_score: 0,
      max_score: 9,
      severity: 'mild',
      label: 'Mild Withdrawal',
      clinical_action: 'May not require medication. Monitor every 4–8 hours. Supportive care.',
      colour: '#FEF3C7',
    },
    {
      min_score: 10,
      max_score: 18,
      severity: 'moderate',
      label: 'Moderate Withdrawal',
      clinical_action: 'Consider medication (benzodiazepines). Monitor every 2–4 hours.',
      colour: '#FFEDD5',
    },
    {
      min_score: 19,
      max_score: 37,
      severity: 'moderately_severe',
      label: 'Moderately Severe Withdrawal',
      clinical_action: 'Medication indicated. Consider intensive care monitoring. Reassess every 1–2 hours.',
      colour: '#FEE2E2',
    },
    {
      min_score: 38,
      max_score: 67,
      severity: 'severe',
      label: 'Severe Withdrawal',
      clinical_action: 'Intensive care recommended. High risk of seizures and delirium tremens. Continuous monitoring.',
      colour: '#FCA5A5',
    },
  ],
};

// ─── Utility ──────────────────────────────────────────────────────────
export const WITHDRAWAL_SCALES: Record<string, WithdrawalScale> = {
  cows: COWS,
  ciwa_ar: CIWA_AR,
};
