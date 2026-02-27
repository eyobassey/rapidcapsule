/**
 * eka-recovery-knowledge.ts
 *
 * Comprehensive clinical knowledge base for the EkaGPT addiction recovery
 * integration. All constants are evidence-based and sourced from peer-reviewed
 * literature, established clinical frameworks, and internationally recognised
 * crisis resources.
 *
 * IMPORTANT: This file is informational only. Nothing here constitutes medical
 * advice, diagnosis, or treatment. Medication references are for psychoeducation;
 * prescribing decisions belong exclusively to licensed clinicians.
 *
 * @module eka-recovery-knowledge
 */

// ============================================================================
// 1. THERAPEUTIC EXERCISES
// ============================================================================

/**
 * Represents a single evidence-based therapeutic exercise that EkaGPT can
 * guide a user through during a conversation.
 */
export interface TherapeuticExercise {
  /** Unique identifier used in tool calls and logging. */
  id: string;
  /** Human-readable exercise name. */
  name: string;
  /** Therapeutic modality the exercise belongs to. */
  category:
    | 'cbt'
    | 'dbt'
    | 'motivational_interviewing'
    | 'mindfulness'
    | 'relapse_prevention'
    | 'grounding';
  /** Brief clinical description of the exercise. */
  description: string;
  /** Guidance on the situations or states that indicate this exercise. */
  when_to_use: string;
  /** Ordered list of facilitator/self-guided steps. */
  steps: string[];
  /** Approximate duration in minutes. */
  estimated_minutes: number;
  /** Primary citation or evidence base. */
  evidence_base: string;
}

/**
 * Curated set of therapeutic exercises spanning multiple modalities.
 * Each exercise is self-contained and can be delivered conversationally by
 * EkaGPT without requiring a licensed therapist in the loop.
 */
export const THERAPEUTIC_EXERCISES: TherapeuticExercise[] = [
  // --------------------------------------------------------------------------
  // 1. Urge Surfing
  // --------------------------------------------------------------------------
  {
    id: 'urge_surfing',
    name: 'Urge Surfing',
    category: 'mindfulness',
    description:
      'A mindfulness-based technique for observing cravings without acting on them. ' +
      'The user learns to "ride the wave" of an urge by noticing it, rating its ' +
      'intensity, breathing through it, and watching it peak and naturally subside.',
    when_to_use:
      'When the user reports an active craving, urge, or strong impulse to use. ' +
      'Also useful as a daily practice to build tolerance for discomfort.',
    steps: [
      'Notice the urge. Acknowledge it without judgement — say to yourself "I am having an urge."',
      'Locate the urge in your body. Where do you feel it most? (e.g. chest, stomach, hands, jaw)',
      'Rate the intensity of the urge on a scale from 0 (none) to 10 (overwhelming).',
      'Begin slow, deliberate breathing — inhale for 4 seconds, exhale for 6 seconds.',
      'Describe the physical sensation in detail: Is it hot or cold? Tight or tingling? Does it pulse or stay constant?',
      'Watch the intensity. Like a wave, it will peak and then begin to pass. You do not need to do anything but observe.',
      'Continue breathing slowly. If your mind wanders, gently return your attention to the sensation.',
      'Re-rate the intensity on the 0-10 scale. Notice any change, however small.',
      'Acknowledge what you just did — you sat with discomfort and it shifted on its own.',
    ],
    estimated_minutes: 10,
    evidence_base:
      'Bowen, S., Chawla, N., & Marlatt, G. A. (2009). Mindfulness-Based Relapse Prevention for Addictive Behaviors. Guilford Press.',
  },

  // --------------------------------------------------------------------------
  // 2. 5-4-3-2-1 Grounding
  // --------------------------------------------------------------------------
  {
    id: 'grounding_5_4_3_2_1',
    name: '5-4-3-2-1 Sensory Grounding',
    category: 'grounding',
    description:
      'A structured sensory-awareness exercise that redirects attention from ' +
      'overwhelming internal states (anxiety, dissociation, flashbacks) to the ' +
      'immediate physical environment using all five senses.',
    when_to_use:
      'When the user reports acute anxiety, panic, dissociation, flashbacks, ' +
      'or feeling "detached" or "unreal." Effective as an immediate stabilisation tool.',
    steps: [
      'Name 5 things you can SEE right now. Look around slowly and describe them (e.g. "a blue mug, the ceiling light…").',
      'Name 4 things you can physically TOUCH or feel. Reach out and notice textures (e.g. "the fabric of my shirt, the cool table surface…").',
      'Name 3 things you can HEAR. Listen carefully — include background sounds (e.g. "a fan humming, traffic outside, my own breathing…").',
      'Name 2 things you can SMELL. If nothing is obvious, move closer to an object or notice the air (e.g. "coffee, fresh laundry…").',
      'Name 1 thing you can TASTE. Take a sip of water or simply notice the current taste in your mouth.',
      'Take one slow, deep breath. Then compare how you feel now to how you felt a minute ago.',
    ],
    estimated_minutes: 5,
    evidence_base:
      'Linehan, M. M. (1993). Cognitive-Behavioral Treatment of Borderline Personality Disorder (DBT Distress Tolerance Skills). Guilford Press.',
  },

  // --------------------------------------------------------------------------
  // 3. Box Breathing
  // --------------------------------------------------------------------------
  {
    id: 'box_breathing',
    name: 'Box Breathing (4-4-4-4)',
    category: 'mindfulness',
    description:
      'A controlled breathing technique that activates the parasympathetic nervous ' +
      'system. The equal-duration inhale, hold, exhale, hold pattern calms the ' +
      'autonomic stress response and reduces physiological arousal.',
    when_to_use:
      'When the user reports stress, agitation, racing heart, shallow breathing, ' +
      'or needs a quick regulation tool before or after a difficult conversation.',
    steps: [
      'Sit comfortably with your feet flat on the floor. Rest your hands on your lap or by your sides.',
      'Breathe IN slowly through your nose for 4 seconds, filling your lungs from the bottom up.',
      'HOLD your breath gently for 4 seconds. Keep your body relaxed — no clenching.',
      'Breathe OUT slowly through your mouth for 4 seconds, emptying your lungs completely.',
      'HOLD again — lungs empty — for 4 seconds.',
      'Repeat the full cycle 4 to 6 times (or until you feel a shift).',
      'Return to your normal breathing rhythm. Notice any changes in your body or mind.',
    ],
    estimated_minutes: 3,
    evidence_base:
      'Ma, X., Yue, Z., Gong, Z., et al. (2017). The Effect of Diaphragmatic Breathing on Attention, Negative Affect and Stress in Healthy Adults. Frontiers in Psychology, 8, 874.',
  },

  // --------------------------------------------------------------------------
  // 4. Thought Record
  // --------------------------------------------------------------------------
  {
    id: 'thought_record',
    name: 'CBT Thought Record',
    category: 'cbt',
    description:
      'A core Cognitive Behavioural Therapy tool for identifying and restructuring ' +
      'automatic negative thoughts. The user examines evidence for and against a ' +
      'distressing thought, then develops a more balanced alternative.',
    when_to_use:
      'When the user expresses cognitive distortions (all-or-nothing thinking, ' +
      'catastrophising, self-blame), negative self-talk, or beliefs that fuel ' +
      'substance use (e.g. "I will never get better," "One slip means I have failed").',
    steps: [
      'Describe the SITUATION briefly — what happened, where, and when?',
      'What was the AUTOMATIC THOUGHT that came to mind? Write it down in one sentence.',
      'What EMOTIONS did you feel? Name each one and rate its intensity from 0 (none) to 100 (most intense).',
      'What is the EVIDENCE FOR this thought? List the facts (not feelings) that support it.',
      'What is the EVIDENCE AGAINST this thought? List facts that contradict it or that you might be overlooking.',
      'Now write a BALANCED THOUGHT — a more realistic, compassionate version that accounts for both sides.',
      'RE-RATE your emotions on the 0-100 scale. Has anything shifted, even slightly?',
    ],
    estimated_minutes: 10,
    evidence_base:
      'Beck, J. S. (2011). Cognitive Behavior Therapy: Basics and Beyond (2nd ed.). Guilford Press.',
  },

  // --------------------------------------------------------------------------
  // 5. Pros and Cons Analysis
  // --------------------------------------------------------------------------
  {
    id: 'pros_cons_analysis',
    name: 'Pros and Cons (Decisional Balance)',
    category: 'motivational_interviewing',
    description:
      'A motivational interviewing exercise that maps the perceived benefits and ' +
      'costs of both continued substance use and sobriety. It surfaces ambivalence ' +
      'and strengthens internal motivation for change.',
    when_to_use:
      'When the user is ambivalent about recovery, considering relapse, or in ' +
      'the contemplation stage of change. Also useful when the user minimises ' +
      'consequences or idealises past use.',
    steps: [
      'What are the BENEFITS of continuing to use? List everything, even things that feel uncomfortable to admit.',
      'What are the COSTS of continuing to use? Think about health, relationships, finances, self-respect, goals.',
      'What are the BENEFITS of staying sober / making a change? Include even small or future benefits.',
      'What are the COSTS of sobriety / change? Be honest — what feels hard, scary, or like a loss?',
      'Look at all four lists. What stands out to you? Is there anything surprising?',
      'Which side feels heavier overall? What does that tell you about what you want for yourself?',
    ],
    estimated_minutes: 10,
    evidence_base:
      'Miller, W. R., & Rollnick, S. (2013). Motivational Interviewing: Helping People Change (3rd ed.). Guilford Press.',
  },

  // --------------------------------------------------------------------------
  // 6. HALT Check
  // --------------------------------------------------------------------------
  {
    id: 'halt_check',
    name: 'HALT Check-In',
    category: 'relapse_prevention',
    description:
      'A rapid self-assessment that screens for four common relapse precursors: ' +
      'Hunger, Anger, Loneliness, and Tiredness. Each "yes" triggers a targeted ' +
      'micro-action to address the underlying need before it escalates.',
    when_to_use:
      'When the user feels "off" but cannot identify why, reports vague discomfort, ' +
      'or as a daily check-in / prevention routine.',
    steps: [
      'Are you HUNGRY? When did you last eat a proper meal? If it has been more than 4-5 hours, eating something nutritious is the first step.',
      'Are you ANGRY or frustrated? Is there a situation or person bothering you right now? Name it, even briefly.',
      'Are you LONELY or isolated? When did you last have meaningful contact with another person? Could you reach out to someone today?',
      'Are you TIRED? How did you sleep last night? Are you running on empty? Could you rest, even for 20 minutes?',
      'For each "yes," take one small action right now to address it. What will you do first?',
      'Is there anything BEYOND HALT that is weighing on you? Sometimes there is a fifth factor — boredom, guilt, grief. Name it if it is there.',
    ],
    estimated_minutes: 5,
    evidence_base:
      'HALT framework widely used in 12-Step programmes and SMART Recovery. Empirical support in relapse prevention literature; see Marlatt, G. A., & Donovan, D. M. (2005). Relapse Prevention (2nd ed.). Guilford Press.',
  },

  // --------------------------------------------------------------------------
  // 7. Safety Planning
  // --------------------------------------------------------------------------
  {
    id: 'safety_planning',
    name: 'Safety Plan (Stanley-Brown Model)',
    category: 'relapse_prevention',
    description:
      'A structured, six-step safety planning intervention for moments of crisis. ' +
      'Developed for suicidal ideation but equally applicable to addiction crises. ' +
      'The plan is built collaboratively and stored for future reference.',
    when_to_use:
      'When the user is in or approaching crisis, expresses hopelessness, or ' +
      'needs a concrete plan for managing high-risk situations. Should be completed ' +
      'proactively, not only in acute distress.',
    steps: [
      'Step 1 — WARNING SIGNS: What thoughts, images, moods, situations, or behaviours signal that a crisis may be developing? List your personal warning signs.',
      'Step 2 — INTERNAL COPING: What can you do on your own, without contacting anyone, to take your mind off the problem? (e.g. exercise, breathing exercises, journalling, going for a walk)',
      'Step 3 — SOCIAL CONTACTS FOR DISTRACTION: Who are people or social settings that can help distract you? List names and how to reach them. You do not need to disclose what you are going through.',
      'Step 4 — PEOPLE TO ASK FOR HELP: Who can you tell that you are struggling? List trusted friends, family members, or sponsors and their contact details.',
      'Step 5 — PROFESSIONALS AND AGENCIES: List professional contacts you can reach in a crisis. Key numbers: 988 Suicide & Crisis Lifeline (US, call or text), Samaritans 116 123 (UK, 24/7), local A&E / Emergency Department.',
      'Step 6 — MAKING THE ENVIRONMENT SAFE: What can you do to reduce access to things that could hurt you or facilitate substance use? (e.g. remove substances from home, give medications to a trusted person, avoid certain locations)',
    ],
    estimated_minutes: 15,
    evidence_base:
      'Stanley, B., & Brown, G. K. (2012). Safety Planning Intervention: A Brief Intervention to Mitigate Suicide Risk. Cognitive and Behavioral Practice, 19(2), 256-264.',
  },

  // --------------------------------------------------------------------------
  // 8. TIPP (DBT Crisis Survival)
  // --------------------------------------------------------------------------
  {
    id: 'tipp',
    name: 'TIPP Skills (Crisis Survival)',
    category: 'dbt',
    description:
      'A DBT distress tolerance skill that rapidly changes body chemistry to reduce ' +
      'extreme emotional arousal. TIPP stands for Temperature, Intense exercise, Paced ' +
      'breathing, and Progressive relaxation — four physiological interventions that ' +
      'can bring down emotional intensity within minutes.',
    when_to_use:
      'When the user is in acute emotional distress, experiencing overwhelming urges, ' +
      'panic, rage, or emotional crisis. Especially useful when cognitive strategies ' +
      'feel impossible because emotions are too intense.',
    steps: [
      'TEMPERATURE — Hold ice cubes in your hands, splash cold water on your face, or press a cold pack to your forehead and cheeks for 30 seconds. The cold activates the dive reflex and slows your heart rate.',
      'Notice the shift. Has the intensity come down even slightly? Rate your distress from 0 to 10.',
      'INTENSE EXERCISE — Do something physically vigorous for 5-10 minutes: star jumps, running in place, push-ups, brisk walking. This burns off the adrenaline fuelling the emotion.',
      'Pause and check in. How does your body feel now compared to a few minutes ago?',
      'PACED BREATHING — Breathe in for 4 seconds, out for 8 seconds. The longer exhale activates the parasympathetic nervous system. Repeat for 1-2 minutes.',
      'PROGRESSIVE RELAXATION — Starting from your toes, tense each muscle group for 5 seconds, then release. Move up through your legs, stomach, chest, arms, shoulders, and face.',
      'Re-rate your distress on the 0-10 scale. Which of the four techniques helped the most? Remember this for next time.',
    ],
    estimated_minutes: 10,
    evidence_base:
      'Linehan, M. M. (2015). DBT Skills Training Manual (2nd ed.). Guilford Press. Chapter on Distress Tolerance: Crisis Survival Skills.',
  },

  // --------------------------------------------------------------------------
  // 9. Opposite Action (DBT Emotion Regulation)
  // --------------------------------------------------------------------------
  {
    id: 'opposite_action',
    name: 'Opposite Action',
    category: 'dbt',
    description:
      'A DBT emotion regulation skill where you identify the action urge driven by ' +
      'an emotion and deliberately do the opposite. This interrupts the emotion-behaviour ' +
      'cycle and reduces the intensity of the original emotion over time.',
    when_to_use:
      'When the user is stuck in an emotion that is not justified by the facts or is ' +
      'making things worse — e.g. isolating when lonely, avoiding when afraid, lashing ' +
      'out when angry, or using substances to numb pain.',
    steps: [
      'Name the EMOTION you are feeling right now. Be specific — is it anger, shame, fear, sadness, guilt, or something else?',
      'What is the ACTION URGE? What does this emotion make you want to do? (e.g. "I want to isolate," "I want to use," "I want to yell at someone")',
      'Check the FACTS. Is this emotion justified by what is actually happening? Or is it based on assumptions, old patterns, or catastrophic thinking?',
      'Identify the OPPOSITE ACTION. What is the direct opposite of your urge? (e.g. if you want to isolate → reach out to someone; if you want to avoid → approach the situation gently; if you want to use → do something healthy instead)',
      'DO the opposite action — fully, not half-heartedly. Commit to it for at least 10-15 minutes. Act as if you feel the opposite emotion.',
      'Check in with your emotion again. Has the intensity changed? Opposite action works through repetition — even a small shift means it is working.',
    ],
    estimated_minutes: 10,
    evidence_base:
      'Linehan, M. M. (2015). DBT Skills Training Manual (2nd ed.). Guilford Press. Chapter on Emotion Regulation: Changing Emotional Responses.',
  },

  // --------------------------------------------------------------------------
  // 10. Radical Acceptance (DBT Distress Tolerance)
  // --------------------------------------------------------------------------
  {
    id: 'radical_acceptance',
    name: 'Radical Acceptance',
    category: 'dbt',
    description:
      'A DBT distress tolerance skill for situations that cannot be changed. Radical ' +
      'acceptance means fully acknowledging reality as it is — without approving of it ' +
      'or giving up. It reduces suffering caused by fighting against unchangeable facts.',
    when_to_use:
      'When the user is stuck in denial, bitterness, or "why me" thinking about their ' +
      'addiction, consequences, or life circumstances. Also useful for grief, loss, and ' +
      'acceptance of past mistakes in recovery.',
    steps: [
      'Describe the SITUATION you are struggling to accept. State it as a plain fact, without judgement or editorialising.',
      'Notice your RESISTANCE. What are you fighting against? What thoughts keep coming up? (e.g. "This should not have happened," "It is not fair")',
      'Ask yourself: Can I change this fact right now? If the answer is no, continuing to fight it only adds suffering on top of pain.',
      'Say to yourself — out loud if you can: "This is what happened. I do not have to like it, but I can stop fighting reality."',
      'Turn your BODY toward acceptance. Relax your face, unclench your fists, drop your shoulders. A willing posture helps the mind follow.',
      'Acknowledge that acceptance does NOT mean approval. You are not saying it is okay — you are saying it is real, and you can move forward from here.',
      'What is ONE small step you can take now, given the reality you have accepted? Focus on what is in your control.',
    ],
    estimated_minutes: 10,
    evidence_base:
      'Linehan, M. M. (2015). DBT Skills Training Manual (2nd ed.). Guilford Press. Chapter on Distress Tolerance: Reality Acceptance Skills.',
  },
];

// ============================================================================
// 2. RELAPSE TRIGGER TAXONOMY (Marlatt's Model)
// ============================================================================

/**
 * Categorisation of relapse triggers based on Marlatt and Gordon's (1985)
 * cognitive-behavioural model of relapse. Prevalence figures are approximate
 * and drawn from Marlatt's original taxonomy studies.
 *
 * @see Marlatt, G. A., & Gordon, J. R. (1985). Relapse Prevention. Guilford Press.
 */
export const RELAPSE_TRIGGER_TAXONOMY = {
  intrapersonal: {
    negative_emotions: {
      prevalence: '35%',
      examples: [
        'Depression or sadness',
        'Anxiety or fear',
        'Anger or frustration',
        'Boredom or emptiness',
        'Guilt or shame',
        'Grief or loss',
        'Feeling overwhelmed or hopeless',
      ],
    },
    physical_states: {
      prevalence: '12%',
      examples: [
        'Chronic pain',
        'Insomnia or poor sleep',
        'Withdrawal symptoms',
        'Physical illness or fatigue',
        'Medication side effects',
        'Hormonal fluctuations',
      ],
    },
    positive_emotions: {
      prevalence: '4%',
      examples: [
        'Celebration or excitement',
        'Feeling "cured" or overconfident',
        'Wanting to enhance a good mood',
        'Reward-seeking after an achievement',
      ],
    },
    testing_control: {
      prevalence: '5%',
      examples: [
        '"I can have just one"',
        'Testing personal willpower',
        'Believing the problem is solved',
        'Trying to prove control to others',
      ],
    },
    urges_temptations: {
      prevalence: '9%',
      examples: [
        'Sudden intense craving',
        'Exposure to substance cues (smell, sight)',
        'Passing a former dealer or bar',
        'Finding hidden substances',
        'Encountering paraphernalia',
      ],
    },
  },
  interpersonal: {
    social_pressure: {
      prevalence: '20%',
      examples: [
        'Direct offers from peers ("just one drink")',
        'Being at a party or social gathering with substances',
        'Cultural or family expectations around drinking',
        'Workplace drinking culture',
        'Fear of social exclusion for not using',
        'Romantic partner who still uses',
      ],
    },
    interpersonal_conflict: {
      prevalence: '16%',
      examples: [
        'Arguments with a partner or spouse',
        'Family conflict or estrangement',
        'Workplace disagreements or bullying',
        'Feeling criticised, rejected, or abandoned',
        'Resentment towards others in recovery',
        'Boundary violations',
      ],
    },
  },
} as const;

// ============================================================================
// 3. HALT FRAMEWORK
// ============================================================================

/**
 * The HALT framework is a rapid self-assessment mnemonic widely used in
 * 12-Step programmes and SMART Recovery. Each letter represents a basic
 * human need that, when unmet, dramatically increases vulnerability to
 * relapse.
 */
export const HALT_FRAMEWORK = {
  H: {
    name: 'Hungry',
    description:
      'Physical hunger and nutritional deficiency impair decision-making, ' +
      'lower blood sugar, and increase irritability. Many people in early ' +
      'recovery have disrupted eating patterns and may confuse hunger cues ' +
      'with cravings.',
    action:
      'Eat a balanced meal or nutritious snack as soon as possible. Keep ' +
      'regular meal times. Stock easy, healthy options for low-energy moments.',
  },
  A: {
    name: 'Angry',
    description:
      'Unprocessed anger, resentment, or frustration is one of the strongest ' +
      'relapse triggers. Substances were often used to numb or escape from ' +
      'these feelings. Anger may also mask hurt, fear, or unmet needs.',
    action:
      'Name the anger out loud or in writing. Identify the underlying need ' +
      'or boundary violation. Use a coping skill (breathing, walking, ' +
      'journalling) before taking action. Talk to a trusted person if needed.',
  },
  L: {
    name: 'Lonely',
    description:
      'Isolation and loneliness are pervasive in recovery, especially when ' +
      'distancing from former using networks. Loneliness triggers a deep ' +
      'neurobiological need for connection that substances can temporarily mimic.',
    action:
      'Reach out to one person — a friend, sponsor, support group member, ' +
      'or helpline. Attend a meeting (in-person or online). Go to a public ' +
      'place even if you do not interact. Connection does not require deep ' +
      'conversation; presence counts.',
  },
  T: {
    name: 'Tired',
    description:
      'Sleep deprivation and exhaustion weaken prefrontal cortex functioning, ' +
      'which is critical for impulse control and rational decision-making. ' +
      'Early recovery frequently involves disrupted sleep patterns.',
    action:
      'Rest if at all possible, even a 20-minute nap. Maintain consistent ' +
      'sleep and wake times. Reduce caffeine after midday. If insomnia ' +
      'persists, discuss it with a healthcare provider.',
  },
} as const;

// ============================================================================
// 4. MEDICATION-ASSISTED TREATMENT (MAT) REFERENCE
// ============================================================================

/**
 * Informational reference for medications commonly used in addiction treatment.
 *
 * CRITICAL: EkaGPT must NEVER prescribe, recommend specific dosages, or advise
 * starting/stopping any medication. This data exists solely to support
 * psychoeducation — helping users understand treatments their doctors may
 * discuss with them.
 *
 * @see SAMHSA (2024). Medications for Substance Use Disorders. TIP 63.
 */
export const MAT_REFERENCE = {
  critical_note:
    'This information is for educational purposes only. EkaGPT does NOT ' +
    'prescribe medication and cannot replace a licensed prescriber. Always ' +
    'consult a qualified healthcare professional before starting, stopping, ' +
    'or changing any medication.',

  opioid_use_disorder: [
    {
      medication: 'Buprenorphine',
      brand_names: ['Subutex', 'Suboxone (buprenorphine/naloxone)'],
      mechanism: 'Partial opioid agonist — activates opioid receptors enough to reduce cravings and withdrawal without producing a full high.',
      notes:
        'Can be prescribed in outpatient settings (office-based opioid treatment). ' +
        'Suboxone includes naloxone to deter misuse via injection. Ceiling effect reduces overdose risk.',
    },
    {
      medication: 'Methadone',
      brand_names: ['Dolophine', 'Methadose'],
      mechanism: 'Full opioid agonist — binds opioid receptors to prevent withdrawal and reduce cravings at stable doses.',
      notes:
        'Dispensed through certified Opioid Treatment Programmes (OTPs). ' +
        'Requires daily supervised dosing initially. Long half-life provides 24-36 hour coverage.',
    },
    {
      medication: 'Naltrexone',
      brand_names: ['Vivitrol (extended-release injection)', 'ReVia (oral)'],
      mechanism: 'Opioid antagonist — blocks opioid receptors completely, preventing any euphoric effect from opioids.',
      notes:
        'Patient must be fully detoxed (7-10 days opioid-free) before starting. ' +
        'Monthly injection (Vivitrol) improves adherence. No abuse potential.',
    },
  ],

  alcohol_use_disorder: [
    {
      medication: 'Naltrexone',
      brand_names: ['Vivitrol (injection)', 'ReVia (oral)'],
      mechanism: 'Opioid antagonist — reduces the rewarding effects of alcohol by blocking endorphin release triggered by drinking.',
      notes:
        'Can be started while still drinking (unlike disulfiram). ' +
        'The Sinclair Method uses oral naltrexone taken 1 hour before drinking to gradually extinguish the reward response.',
    },
    {
      medication: 'Acamprosate',
      brand_names: ['Campral'],
      mechanism: 'Modulates glutamate and GABA neurotransmitter systems to reduce protracted withdrawal symptoms (anxiety, insomnia, dysphoria).',
      notes:
        'Most effective for maintaining abstinence after detox. ' +
        'Does not prevent intoxication. Taken three times daily. Renally excreted — contraindicated in severe renal impairment.',
    },
    {
      medication: 'Disulfiram',
      brand_names: ['Antabuse'],
      mechanism: 'Aldehyde dehydrogenase inhibitor — causes an intensely unpleasant reaction (nausea, flushing, headache, vomiting) if alcohol is consumed.',
      notes:
        'Works as a deterrent rather than reducing cravings. ' +
        'Requires strong motivation and ideally supervised administration. ' +
        'Patient must avoid all alcohol sources including mouthwash and cooking wine.',
    },
  ],
} as const;

// ============================================================================
// 5. CRISIS RESOURCES
// ============================================================================

/**
 * Emergency and crisis contact information. EkaGPT should surface these
 * whenever a user expresses suicidal ideation, self-harm intent, overdose
 * risk, or any situation requiring immediate human intervention.
 */
export const CRISIS_RESOURCES = {
  uk: [
    {
      name: 'Samaritans',
      phone: '116 123',
      description: 'Free 24/7 emotional support for anyone in distress. Call or email jo@samaritans.org.',
      available: '24 hours, 7 days a week',
    },
    {
      name: 'NHS Crisis Line',
      phone: '111 (option 2)',
      description: 'NHS urgent mental health support. Connects to local crisis teams.',
      available: '24 hours, 7 days a week',
    },
    {
      name: 'FRANK',
      phone: '0300 123 6600',
      description: 'Friendly, confidential drug advice and information. Also available via text (82111) and live chat.',
      available: '24 hours, 7 days a week',
    },
  ],
  international: [
    {
      name: '988 Suicide & Crisis Lifeline',
      phone: '988',
      description: 'US national crisis line. Call or text 988 for immediate support with suicidal thoughts, substance use crises, or emotional distress.',
      available: '24 hours, 7 days a week',
      region: 'United States',
    },
    {
      name: 'SAMHSA National Helpline',
      phone: '1-800-662-4357',
      description: 'Free, confidential treatment referral and information service for substance use and mental health disorders.',
      available: '24 hours, 7 days a week, 365 days a year',
      region: 'United States',
    },
    {
      name: 'Crisis Text Line',
      phone: 'Text HOME to 741741',
      description: 'Free crisis counselling via text message. Trained crisis counsellors available for any type of crisis.',
      available: '24 hours, 7 days a week',
      region: 'United States (also available in UK: text SHOUT to 85258)',
    },
  ],
} as const;

// ============================================================================
// 6. COLUMBIA SUICIDE SEVERITY RATING SCALE (C-SSRS) TRIAGE QUESTIONS
// ============================================================================

/**
 * The five core screening questions from the Columbia Protocol (C-SSRS).
 * These form a validated, stepped triage tool. If the user answers "yes"
 * to any question, escalation and crisis resource provision are indicated.
 *
 * @see Posner, K., Brown, G. K., Stanley, B., et al. (2011). The Columbia
 *   Suicide Severity Rating Scale. American Journal of Psychiatry, 168(12), 1266-1277.
 */
export const CSSRS_TRIAGE_QUESTIONS = [
  {
    number: 1,
    question: 'Have you wished you were dead or wished you could go to sleep and not wake up?',
    construct: 'Wish to be dead',
    risk_level: 'low',
    action: 'Provide support and continue assessment. Offer crisis resources.',
  },
  {
    number: 2,
    question: 'Have you actually had any thoughts of killing yourself?',
    construct: 'Suicidal ideation',
    risk_level: 'moderate',
    action: 'Provide crisis resources immediately. Encourage contact with a professional.',
  },
  {
    number: 3,
    question: 'Have you been thinking about how you might do this?',
    construct: 'Suicidal ideation with method',
    risk_level: 'high',
    action: 'Strongly encourage immediate contact with crisis services. Provide all relevant numbers.',
  },
  {
    number: 4,
    question: 'Have you had these thoughts and had some intention of acting on them?',
    construct: 'Suicidal intent',
    risk_level: 'high',
    action: 'Urge immediate contact with emergency services (999/911/112) or crisis line. Do not end the conversation abruptly.',
  },
  {
    number: 5,
    question: 'Have you started to work out or worked out the details of how to kill yourself? Do you intend to carry out this plan?',
    construct: 'Suicidal intent with plan',
    risk_level: 'imminent',
    action: 'Treat as immediate emergency. Provide emergency numbers. Encourage calling 999/911 NOW. Stay with the user if possible.',
  },
] as const;

// ============================================================================
// 7. COMORBIDITY REFERENCES
// ============================================================================

/**
 * Common mental health comorbidities in substance use disorders with
 * associated validated screening instruments and key symptoms to monitor.
 *
 * EkaGPT uses these to recognise comorbid presentations and encourage
 * professional assessment — it does NOT diagnose.
 */
export const COMORBIDITY_REFERENCES = {
  depression: {
    screening_tools: ['PHQ-2 (2-item screener)', 'PHQ-9 (full assessment)'],
    key_symptoms: [
      'Persistent low mood or sadness',
      'Loss of interest or pleasure in activities (anhedonia)',
      'Changes in appetite or weight',
      'Insomnia or hypersomnia',
      'Fatigue or loss of energy',
      'Feelings of worthlessness or excessive guilt',
      'Difficulty concentrating or making decisions',
      'Psychomotor agitation or retardation',
      'Recurrent thoughts of death or suicidal ideation',
    ],
    prevalence_in_sud: 'Major depressive disorder co-occurs in approximately 20-40% of individuals with substance use disorders.',
    clinical_note:
      'Depressive symptoms may be substance-induced and improve with abstinence, or may represent an independent disorder requiring separate treatment. Reassess after 2-4 weeks of sobriety.',
  },
  anxiety: {
    screening_tools: ['GAD-2 (2-item screener)', 'GAD-7 (full assessment)'],
    key_symptoms: [
      'Excessive worry that is difficult to control',
      'Restlessness or feeling on edge',
      'Muscle tension',
      'Difficulty concentrating (mind going blank)',
      'Irritability',
      'Sleep disturbance',
      'Fatigue',
      'Panic attacks (sudden intense fear with physical symptoms)',
    ],
    prevalence_in_sud: 'Anxiety disorders co-occur in approximately 17-30% of individuals with substance use disorders.',
    clinical_note:
      'Anxiety is extremely common in early recovery and may reflect withdrawal, rebound effects, or an independent anxiety disorder. Substances were often used to self-medicate anxiety.',
  },
  ptsd: {
    screening_tools: ['PCL-5 (PTSD Checklist for DSM-5)'],
    key_symptoms: [
      'Intrusive memories, flashbacks, or nightmares of traumatic events',
      'Avoidance of trauma-related thoughts, feelings, or external reminders',
      'Negative changes in thoughts and mood (e.g. distorted blame, persistent negative emotions)',
      'Hyperarousal — being easily startled, hypervigilant, difficulty sleeping, irritability',
      'Emotional numbing or detachment from others',
      'Difficulty experiencing positive emotions',
    ],
    prevalence_in_sud: 'PTSD co-occurs in approximately 25-50% of individuals seeking treatment for substance use disorders.',
    clinical_note:
      'Trauma and addiction are deeply intertwined. Many individuals use substances to cope with trauma symptoms. Integrated trauma-addiction treatment (e.g. Seeking Safety) is recommended over sequential treatment.',
  },
  insomnia: {
    screening_tools: ['ISI (Insomnia Severity Index)'],
    key_symptoms: [
      'Difficulty falling asleep (sleep onset latency > 30 minutes)',
      'Difficulty staying asleep (frequent or prolonged awakenings)',
      'Early morning awakening with inability to return to sleep',
      'Non-restorative sleep despite adequate opportunity',
      'Daytime impairment (fatigue, mood disturbance, cognitive difficulties)',
    ],
    prevalence_in_sud: 'Sleep disturbance affects 50-75% of individuals in early recovery and is a significant relapse predictor.',
    clinical_note:
      'Insomnia is one of the most common and persistent complaints in recovery. Alcohol and sedatives disrupt sleep architecture. CBT-I (Cognitive Behavioural Therapy for Insomnia) is the first-line treatment and is more effective than medication long-term.',
  },
} as const;

// ============================================================================
// 8. STAGES OF CHANGE (Transtheoretical Model)
// ============================================================================

/**
 * The Transtheoretical Model (TTM) of behaviour change, developed by
 * Prochaska and DiClemente (1983). Understanding the user's current stage
 * allows EkaGPT to tailor its approach and avoid mismatched interventions.
 *
 * @see Prochaska, J. O., & DiClemente, C. C. (1983). Stages and processes of
 *   self-change of smoking. Journal of Consulting and Clinical Psychology, 51(3), 390-395.
 */
export const STAGES_OF_CHANGE = {
  precontemplation: {
    description:
      'The person does not recognise that a problem exists or is not yet ' +
      'considering change. They may be defensive, in denial, or simply ' +
      'unaware of the consequences of their substance use.',
    approach:
      'Build rapport without confrontation. Express empathy. Gently raise ' +
      'awareness by exploring the person\'s values and how substance use ' +
      'may intersect with them. Plant seeds — do not push. Avoid arguments.',
  },
  contemplation: {
    description:
      'The person acknowledges the problem and is weighing the pros and cons ' +
      'of change. They feel ambivalent — part of them wants to change, part ' +
      'of them does not. This stage can last a long time.',
    approach:
      'Explore ambivalence openly. Use the Pros and Cons exercise. Reflect ' +
      'discrepancies between their values/goals and current behaviour. ' +
      'Support self-efficacy. Avoid premature action planning.',
  },
  preparation: {
    description:
      'The person has decided to change and is making concrete plans. They ' +
      'may be researching treatment options, setting a quit date, or telling ' +
      'others about their intention.',
    approach:
      'Help them develop a clear, achievable plan. Identify potential barriers ' +
      'and coping strategies. Build the Safety Plan. Connect them to ' +
      'resources (treatment programmes, support groups, MAT options). ' +
      'Affirm their commitment.',
  },
  action: {
    description:
      'The person is actively modifying their behaviour — abstaining, attending ' +
      'treatment, implementing coping strategies. This stage requires the most ' +
      'energy and is where support is most critical.',
    approach:
      'Provide active support and encouragement. Teach and practise coping ' +
      'skills (urge surfing, grounding, HALT). Help manage triggers. ' +
      'Celebrate milestones. Normalise difficulty. Watch for early warning ' +
      'signs of relapse.',
  },
  maintenance: {
    description:
      'The person has sustained the new behaviour for a significant period ' +
      '(typically 6+ months). The focus shifts from initiating change to ' +
      'preventing relapse and integrating recovery into long-term identity.',
    approach:
      'Reinforce gains and identity change ("I am a person in recovery"). ' +
      'Develop long-term relapse prevention strategies. Address comorbidities. ' +
      'Encourage continued connection with support networks. Discuss ' +
      'meaning, purpose, and life beyond substances.',
  },
} as const;

// ============================================================================
// 9. HELPER EXPORTS
// ============================================================================

/**
 * Retrieves a therapeutic exercise by its unique identifier.
 *
 * @param id - The exercise ID (e.g. 'urge_surfing', 'halt_check').
 * @returns The matching TherapeuticExercise, or undefined if not found.
 */
export function getExercise(id: string): TherapeuticExercise | undefined {
  return THERAPEUTIC_EXERCISES.find((exercise) => exercise.id === id);
}

/**
 * One-line summary of every exercise, suitable for injection into a system
 * prompt so the model knows which exercises are available without needing
 * the full step-by-step detail in context.
 *
 * Format: `"id — Name (category, ~Xmin): Description fragment"`
 */
export const EXERCISE_SUMMARY: string = THERAPEUTIC_EXERCISES.map(
  (ex) =>
    `${ex.id} — ${ex.name} (${ex.category}, ~${ex.estimated_minutes}min): ${ex.description.split('.')[0]}.`,
).join('\n');
