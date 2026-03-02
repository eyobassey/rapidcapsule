/**
 * Curated harm reduction content library.
 * Evidence-based, non-judgmental guidance for safer substance use,
 * overdose prevention, and emergency resources.
 */

export interface SafeUseGuidance {
  substance: string;
  display_name: string;
  safer_use_tips: string[];
  overdose_signs: string[];
  mixing_dangers: Array<{ substance: string; risk: string }>;
  withdrawal_warnings: string[];
  long_term_risks: string[];
}

export interface OverdoseResponseStep {
  step: number;
  action: string;
  detail: string;
  duration?: string;
}

export interface EmergencyResource {
  name: string;
  phone: string;
  description: string;
  available: string;
  url?: string;
}

export const HARM_REDUCTION_CONTENT: Record<string, SafeUseGuidance> = {
  alcohol: {
    substance: 'alcohol',
    display_name: 'Alcohol',
    safer_use_tips: [
      'Keep track of how many standard drinks you consume (1 unit = 10ml pure alcohol)',
      'Set a limit before you start drinking and stick to it',
      'Alternate alcoholic drinks with water or soft drinks',
      'Eat a substantial meal before drinking',
      'Avoid drinking games and rounds — they encourage rapid consumption',
      'Never leave your drink unattended',
      'Avoid mixing alcohol with medications, especially painkillers and sedatives',
      'The UK Chief Medical Officers advise no more than 14 units per week, spread over 3+ days',
      'Have at least 2-3 alcohol-free days per week',
    ],
    overdose_signs: [
      'Confusion, stupor, or unconsciousness',
      'Vomiting (especially while unconscious — risk of choking)',
      'Seizures',
      'Slow or irregular breathing (fewer than 8 breaths per minute)',
      'Blue-tinged or pale skin, especially lips and fingertips',
      'Low body temperature (hypothermia)',
      'No response to being pinched or shaken',
    ],
    mixing_dangers: [
      { substance: 'Opioids', risk: 'Extreme respiratory depression — very high risk of fatal overdose' },
      { substance: 'Benzodiazepines', risk: 'Combined sedation can stop breathing — life-threatening' },
      { substance: 'Cocaine', risk: 'Creates cocaethylene in the liver — increases cardiac arrest risk by 18x' },
      { substance: 'Cannabis', risk: 'Increased nausea, dizziness, and impaired judgement' },
      { substance: 'Antidepressants', risk: 'Enhanced sedation, increased depression, liver toxicity' },
    ],
    withdrawal_warnings: [
      'Alcohol withdrawal can be LIFE-THREATENING — never stop suddenly after heavy prolonged use',
      'Withdrawal seizures can occur 12-48 hours after last drink',
      'Delirium tremens (DTs) is a medical emergency — seek help immediately',
      'Symptoms: tremors, anxiety, sweating, nausea, insomnia, hallucinations',
      'Medical detox with benzodiazepines is the safest approach for heavy drinkers',
      'Always consult a doctor before attempting to stop if you drink daily',
    ],
    long_term_risks: [
      'Liver disease (fatty liver, hepatitis, cirrhosis)',
      'Increased risk of several cancers',
      'Cardiovascular disease and high blood pressure',
      'Brain damage and cognitive impairment',
      'Mental health deterioration (anxiety, depression)',
      'Pancreatitis',
    ],
  },

  opioids: {
    substance: 'opioids',
    display_name: 'Opioids (Heroin, Fentanyl, Prescription Painkillers)',
    safer_use_tips: [
      'NEVER use alone — always have someone present who can call for help',
      'Start with a small test dose, especially with a new batch or after a break',
      'Tolerance drops rapidly after even a few days of not using — previous dose may now be fatal',
      'Keep naloxone (Prenoxad/Nyxoid) accessible and ensure those around you know how to use it',
      'Avoid injecting — snorting or smoking is lower risk for overdose',
      'If injecting: use clean needles every time, rotate injection sites, use sterile water',
      'Never share needles, syringes, filters, spoons, or any injecting equipment',
      'Use fentanyl test strips if available — fentanyl contamination is increasingly common',
      'Avoid using after a period of abstinence (e.g., prison release, detox, rehab)',
    ],
    overdose_signs: [
      'Pinpoint (very small) pupils',
      'Unconsciousness — cannot be woken',
      'Slow, shallow, or stopped breathing',
      'Choking or gurgling sounds',
      'Blue or greyish lips and fingertips',
      'Limp body',
      'Pale, clammy skin',
    ],
    mixing_dangers: [
      { substance: 'Alcohol', risk: 'Massively increases respiratory depression — very high fatal overdose risk' },
      { substance: 'Benzodiazepines', risk: 'The most common drug combination in fatal overdoses' },
      { substance: 'Gabapentinoids (pregabalin)', risk: 'Enhanced sedation and respiratory depression' },
      { substance: 'Stimulants (speedball)', risk: 'When stimulant wears off, opioid effect can cause overdose' },
      { substance: 'Antidepressants (SSRIs)', risk: 'Risk of serotonin syndrome with some opioids (tramadol, fentanyl)' },
    ],
    withdrawal_warnings: [
      'Opioid withdrawal is extremely uncomfortable but rarely life-threatening',
      'Symptoms peak 48-72 hours after last use: muscle aches, diarrhoea, vomiting, insomnia',
      'MAT (buprenorphine, methadone) is the most effective treatment for opioid dependence',
      'Do NOT take opioids to relieve withdrawal without medical supervision — risk of overdose',
      'Stay hydrated — diarrhoea and vomiting cause dangerous dehydration',
    ],
    long_term_risks: [
      'Fatal overdose (especially with fentanyl contamination)',
      'Blood-borne infections (HIV, hepatitis C) from sharing equipment',
      'Vein damage, abscesses, deep vein thrombosis',
      'Respiratory problems',
      'Severe constipation and bowel issues',
      'Hormonal disruption (low testosterone, menstrual irregularities)',
    ],
  },

  stimulants: {
    substance: 'stimulants',
    display_name: 'Stimulants (Cocaine, Amphetamines, MDMA)',
    safer_use_tips: [
      'Start with a low dose and wait before re-dosing',
      'Stay hydrated but do not overdrink water (especially with MDMA — sip, do not gulp)',
      'Take regular breaks if dancing — overheating is a serious risk',
      'Avoid mixing stimulants with other stimulants',
      'Crush powder finely before snorting to reduce nasal damage',
      'Use your own straw/tube when snorting — sharing spreads hepatitis C',
      'Avoid injecting stimulants — very high risk of vein damage and compulsive re-dosing',
      'If using MDMA, do not exceed 1.5mg per kg of body weight in a session',
      'Have benzodiazepines or a calm environment available in case of anxiety/panic',
    ],
    overdose_signs: [
      'Chest pain or tightness',
      'Rapid or irregular heartbeat',
      'Extreme agitation or paranoia',
      'Very high body temperature (hyperthermia)',
      'Seizures',
      'Difficulty breathing',
      'Loss of consciousness',
      'Severe headache (risk of stroke)',
    ],
    mixing_dangers: [
      { substance: 'Alcohol', risk: 'Cocaethylene formation (cocaine); masks intoxication leading to excess drinking' },
      { substance: 'Opioids', risk: 'Speedball — high overdose risk when stimulant wears off' },
      { substance: 'Other stimulants', risk: 'Cardiovascular overload — heart attack, stroke, seizures' },
      { substance: 'MAOIs', risk: 'Potentially fatal hypertensive crisis' },
      { substance: 'Cannabis', risk: 'Increased heart rate and anxiety' },
    ],
    withdrawal_warnings: [
      'Stimulant withdrawal ("crash") causes extreme fatigue, depression, and intense cravings',
      'Sleep disturbances can last weeks',
      'Increased appetite is normal during recovery',
      'Depression can be severe — seek support if experiencing suicidal thoughts',
      'No medications are specifically approved for stimulant withdrawal but support is available',
    ],
    long_term_risks: [
      'Heart disease, heart attack, and stroke',
      'Nasal septum perforation (cocaine)',
      'Psychosis and paranoia',
      'Severe dental problems (methamphetamine)',
      'Cognitive impairment (memory, attention)',
      'Weight loss and malnutrition',
    ],
  },

  cannabis: {
    substance: 'cannabis',
    display_name: 'Cannabis',
    safer_use_tips: [
      'Start with low-THC strains and small amounts, especially if inexperienced',
      'Edibles take 30-90 minutes to take effect — do not re-dose too early',
      'Vaporising is less harmful than smoking (avoids combustion toxins)',
      'Avoid mixing with tobacco — this adds nicotine addiction and smoking harms',
      'Do not drive or operate machinery while under the influence',
      'Be aware of your mental health — cannabis can trigger anxiety and paranoia',
      'Avoid daily use — regular use increases dependence risk',
      'Synthetic cannabinoids (Spice) are far more dangerous — avoid entirely',
    ],
    overdose_signs: [
      'Extreme anxiety or panic attacks',
      'Paranoia or psychotic symptoms',
      'Rapid heart rate (tachycardia)',
      'Nausea and vomiting (cannabinoid hyperemesis syndrome)',
      'Disorientation and confusion',
      'Note: Fatal cannabis overdose is extremely rare but uncomfortable reactions are common',
    ],
    mixing_dangers: [
      { substance: 'Alcohol', risk: 'Greatly intensifies impairment and nausea ("greening out")' },
      { substance: 'Tobacco', risk: 'Adds nicotine dependence and all smoking-related health risks' },
      { substance: 'Stimulants', risk: 'Increased heart rate and cardiovascular strain' },
      { substance: 'Psychedelics', risk: 'Can intensify and prolong psychedelic effects unpredictably' },
    ],
    withdrawal_warnings: [
      'Cannabis withdrawal is real but mild compared to other substances',
      'Symptoms: irritability, insomnia, decreased appetite, vivid dreams, anxiety',
      'Symptoms typically peak in the first week and resolve within 2-3 weeks',
      'Stay active and maintain routine to manage symptoms',
    ],
    long_term_risks: [
      'Cannabis use disorder (dependence)',
      'Respiratory issues from smoking',
      'Increased risk of psychosis in vulnerable individuals',
      'Cognitive effects in adolescents (developing brain)',
      'Amotivational syndrome with heavy chronic use',
    ],
  },

  benzodiazepines: {
    substance: 'benzodiazepines',
    display_name: 'Benzodiazepines (Diazepam, Alprazolam, etc.)',
    safer_use_tips: [
      'Never combine with alcohol or opioids — the combination is frequently fatal',
      'Use the lowest effective dose for the shortest possible time',
      'Do not stop suddenly after regular use — withdrawal can cause seizures',
      'Keep doses consistent — avoid escalating to chase the initial effect',
      'Store securely and never share your prescription',
      'Be cautious with illicit or counterfeit benzodiazepines — potency is unpredictable',
      'Avoid driving — benzodiazepines significantly impair reaction time',
    ],
    overdose_signs: [
      'Extreme drowsiness or unresponsiveness',
      'Slurred speech',
      'Confusion and disorientation',
      'Impaired coordination and balance',
      'Slow or shallow breathing',
      'Coma (in severe cases, especially when mixed with other depressants)',
    ],
    mixing_dangers: [
      { substance: 'Opioids', risk: 'Most common drug combination in fatal overdoses — extreme respiratory depression' },
      { substance: 'Alcohol', risk: 'Synergistic CNS depression — high risk of death' },
      { substance: 'Other sedatives', risk: 'Compounded sedation and respiratory failure' },
      { substance: 'Gabapentinoids', risk: 'Enhanced sedation, increased overdose risk' },
    ],
    withdrawal_warnings: [
      'Benzodiazepine withdrawal can be LIFE-THREATENING — never stop abruptly',
      'Withdrawal seizures can be fatal — always taper under medical supervision',
      'Symptoms: severe anxiety, insomnia, tremors, seizures, psychosis',
      'Tapering should be gradual over weeks to months depending on duration of use',
      'Protracted withdrawal symptoms (anxiety, insomnia) can last months',
    ],
    long_term_risks: [
      'Physical dependence (develops within 2-4 weeks of regular use)',
      'Cognitive impairment and memory problems',
      'Increased fall risk in elderly patients',
      'Possible increased dementia risk with long-term use',
      'Emotional blunting',
    ],
  },

  tobacco: {
    substance: 'tobacco',
    display_name: 'Tobacco / Nicotine',
    safer_use_tips: [
      'If you smoke, consider switching to vaping — Public Health England says it is 95% less harmful',
      'Nicotine replacement therapy (patches, gum, lozenges) is available without prescription',
      'Varenicline (Champix) and bupropion are effective prescription quit aids',
      'The NHS Stop Smoking Service offers free support — increases quit success by 3x',
      'Avoid smoking indoors — second-hand smoke harms those around you',
      'If you cannot quit, reduce the number of cigarettes per day',
      'Avoid smoking first thing in the morning — this is a strong addiction indicator',
    ],
    overdose_signs: [
      'Nicotine poisoning (from patches, liquid nicotine, or excessive use)',
      'Nausea and vomiting',
      'Rapid heartbeat and dizziness',
      'Headache and confusion',
      'Seizures (severe cases)',
      'Note: Nicotine overdose from smoking alone is rare',
    ],
    mixing_dangers: [
      { substance: 'Cannabis', risk: 'Tobacco mixed with cannabis (spliffs) adds nicotine addiction' },
      { substance: 'Oral contraceptives', risk: 'Smoking greatly increases blood clot and stroke risk' },
      { substance: 'Stimulants', risk: 'Compounded cardiovascular strain' },
    ],
    withdrawal_warnings: [
      'Nicotine withdrawal peaks within 2-3 days and improves over 2-4 weeks',
      'Symptoms: irritability, anxiety, difficulty concentrating, increased appetite, cravings',
      'NRT (nicotine replacement) reduces withdrawal severity significantly',
      'Weight gain of 2-5kg is common — manageable with diet and exercise',
    ],
    long_term_risks: [
      'Lung cancer, COPD, and emphysema',
      'Heart disease and stroke',
      'Multiple other cancers (mouth, throat, bladder, pancreas)',
      'Peripheral vascular disease',
      'Premature ageing and skin damage',
    ],
  },
};

/**
 * Opioid overdose response guide — step-by-step first responder instructions.
 */
export const OPIOID_OVERDOSE_RESPONSE: OverdoseResponseStep[] = [
  {
    step: 1,
    action: 'RECOGNISE the overdose',
    detail:
      'Look for: unresponsiveness, slow/stopped breathing, blue lips/fingertips, pinpoint pupils, gurgling sounds. Try shouting their name, shaking shoulders, or rubbing knuckles on sternum.',
    duration: '10-15 seconds',
  },
  {
    step: 2,
    action: 'CALL 999 immediately',
    detail:
      'Tell the operator: "Someone has stopped breathing" or "I think someone is having an opioid overdose." Give your exact location. Stay on the line. You will NOT get in trouble for calling — the law protects people who call for help during overdoses.',
  },
  {
    step: 3,
    action: 'Give NALOXONE if available',
    detail:
      'Prenoxad (injection): inject 0.4ml into outer thigh muscle through clothing. Nyxoid (nasal spray): spray one dose into one nostril. If no response after 2-3 minutes, give a second dose. Naloxone is safe — it cannot harm someone who has not taken opioids.',
    duration: 'Wait 2-3 minutes between doses',
  },
  {
    step: 4,
    action: 'Give RESCUE BREATHS',
    detail:
      'Tilt head back, lift chin, pinch nose. Give one breath every 5 seconds. Watch for chest rising. Continue until breathing returns or ambulance arrives.',
  },
  {
    step: 5,
    action: 'Place in RECOVERY POSITION',
    detail:
      'If breathing but unconscious: roll onto their side, tilt head back, bend top knee forward for stability. This prevents choking on vomit. Stay with them until paramedics arrive.',
  },
  {
    step: 6,
    action: 'AFTERCARE',
    detail:
      'Naloxone wears off in 20-90 minutes — the person may go back into overdose. Do NOT let them use more opioids. Keep them warm and monitored. The person may be confused or agitated when they wake — reassure them.',
  },
];

/**
 * Alcohol overdose response guide.
 */
export const ALCOHOL_OVERDOSE_RESPONSE: OverdoseResponseStep[] = [
  {
    step: 1,
    action: 'RECOGNISE the overdose',
    detail:
      'Look for: unconsciousness, vomiting, seizures, slow/irregular breathing, pale or blue skin, low body temperature.',
    duration: '10-15 seconds',
  },
  {
    step: 2,
    action: 'CALL 999 immediately',
    detail:
      'Tell the operator: "Someone has alcohol poisoning and is unconscious/barely breathing." Give your location.',
  },
  {
    step: 3,
    action: 'Place in RECOVERY POSITION',
    detail:
      'Roll them onto their side to prevent choking on vomit. Tilt head back to keep airway open. Do NOT leave them on their back.',
  },
  {
    step: 4,
    action: 'Keep them WARM',
    detail:
      'Cover with a blanket or coat. Alcohol causes body temperature to drop. Do NOT put them in a cold shower.',
  },
  {
    step: 5,
    action: 'STAY with them',
    detail:
      'Monitor breathing continuously. If breathing stops, start CPR if trained. Do NOT give them coffee, food, or try to make them walk — these do not help.',
  },
];

/**
 * Stimulant overdose response guide.
 */
export const STIMULANT_OVERDOSE_RESPONSE: OverdoseResponseStep[] = [
  {
    step: 1,
    action: 'RECOGNISE the overdose',
    detail:
      'Look for: chest pain, extreme agitation, overheating (sweating, hot skin), seizures, irregular heartbeat, severe headache, psychotic behaviour.',
  },
  {
    step: 2,
    action: 'CALL 999 immediately',
    detail:
      'Tell the operator: "Someone is having a suspected stimulant overdose" and describe the main symptoms. Mention if they are having a seizure or chest pain.',
  },
  {
    step: 3,
    action: 'COOL them down',
    detail:
      'If overheating: move to a cool area, remove excess clothing, apply cool (not cold) water to skin, fan them. Offer sips of water if conscious.',
  },
  {
    step: 4,
    action: 'Keep them CALM',
    detail:
      'Speak calmly, reassure them. Reduce stimulation: dim lights, reduce noise. Do NOT restrain them unless they are a danger to themselves or others.',
  },
  {
    step: 5,
    action: 'If SEIZURE',
    detail:
      'Clear the area around them. Do NOT put anything in their mouth. Time the seizure. Place in recovery position once the seizure stops. If seizure lasts more than 5 minutes, this is a medical emergency.',
  },
];

/**
 * Fentanyl test strip information.
 */
export const FENTANYL_TEST_STRIP_INFO = {
  what_is_it:
    'Fentanyl test strips (FTS) are small strips of paper that can detect the presence of fentanyl and many fentanyl analogues in drugs before use. They were originally designed for urine testing but are effective for checking drug supply.',
  why_important:
    'Fentanyl is 50-100x stronger than morphine. As little as 2mg (the size of a few grains of salt) can be fatal. Fentanyl is increasingly found in heroin, counterfeit pills, cocaine, and other drugs without the user knowing.',
  how_to_use: [
    'Dissolve a small amount of the substance in water (a few teaspoons)',
    'Dip the test strip into the water for 15 seconds',
    'Lay flat on a non-absorbent surface for 2-5 minutes',
    'ONE line = POSITIVE (fentanyl detected) — do NOT use',
    'TWO lines = NEGATIVE (fentanyl not detected) — but does not guarantee safety',
    'Test strips may not detect all fentanyl analogues',
    'Even a negative result does not mean the drug is safe — other contaminants may be present',
  ],
  availability_uk:
    'Fentanyl test strips are available from some drug services, needle exchanges, and can be purchased online. They are legal to possess and use in the UK.',
  limitations: [
    'Cannot detect all fentanyl analogues (e.g., some carfentanil variants)',
    'Does not indicate concentration — only presence/absence',
    'Does not test for other dangerous contaminants',
    'Fentanyl may not be evenly distributed in a batch — one area may test negative while another is positive',
  ],
};

/**
 * UK-specific emergency resources and helplines.
 */
export const UK_EMERGENCY_RESOURCES: EmergencyResource[] = [
  {
    name: 'Emergency Services',
    phone: '999',
    description:
      'For immediate life-threatening emergencies including overdose, seizures, and cardiac arrest.',
    available: '24/7',
  },
  {
    name: 'NHS 111',
    phone: '111',
    description:
      'For urgent medical advice when it is not a life-threatening emergency.',
    available: '24/7',
    url: 'https://111.nhs.uk',
  },
  {
    name: 'FRANK Drug Helpline',
    phone: '0300 123 6600',
    description:
      'Confidential drug advice, information, and support. Text: 82111.',
    available: '24/7',
    url: 'https://www.talktofrank.com',
  },
  {
    name: 'Samaritans',
    phone: '116 123',
    description:
      'Free emotional support for anyone in distress or crisis. Email: jo@samaritans.org.',
    available: '24/7',
    url: 'https://www.samaritans.org',
  },
  {
    name: 'Alcoholics Anonymous (AA)',
    phone: '0800 917 7650',
    description:
      'Free helpline for anyone affected by alcohol. Access to local meetings and support.',
    available: '24/7',
    url: 'https://www.alcoholics-anonymous.org.uk',
  },
  {
    name: 'Narcotics Anonymous (NA)',
    phone: '0300 999 1212',
    description:
      'Free helpline for anyone affected by drug addiction. Access to local meetings.',
    available: '10am-midnight daily',
    url: 'https://ukna.org',
  },
  {
    name: 'Drinkline',
    phone: '0300 123 1110',
    description:
      'Free, confidential helpline for people concerned about their own or someone else\'s drinking.',
    available: 'Weekdays 9am-8pm, Weekends 11am-4pm',
  },
  {
    name: 'National Domestic Abuse Helpline',
    phone: '0808 2000 247',
    description:
      'Substance use and domestic abuse often co-occur. Free, confidential support.',
    available: '24/7',
    url: 'https://www.nationaldahelpline.org.uk',
  },
  {
    name: 'CALM (Campaign Against Living Miserably)',
    phone: '0800 58 58 58',
    description:
      'Support for men at risk of suicide. Webchat also available.',
    available: '5pm-midnight daily',
    url: 'https://www.thecalmzone.net',
  },
  {
    name: 'Crisis Text Line (Shout)',
    phone: 'Text SHOUT to 85258',
    description:
      'Free, confidential 24/7 text-based crisis support. Trained crisis counsellors.',
    available: '24/7',
    url: 'https://giveusashout.org',
  },
];

/**
 * Needle exchange / syringe service programme information (UK).
 */
export const NEEDLE_EXCHANGE_INFO = {
  what_is_it:
    'Needle and syringe programmes (NSPs) provide free sterile injecting equipment to people who inject drugs. They also collect used equipment safely, reducing needlestick injuries in the community.',
  services_offered: [
    'Free sterile needles, syringes, and filters',
    'Sharps bins for safe disposal',
    'Condoms and sexual health advice',
    'Naloxone kits and training',
    'Hepatitis C and HIV testing',
    'Referral to drug treatment services',
    'Wound care advice',
    'Vein care advice',
  ],
  access_points: [
    'Many pharmacies operate needle exchange (look for the green cross or ask inside)',
    'Local drug services and drop-in centres',
    'Some sexual health clinics',
    'Mobile outreach vans in some areas',
    'Homeless shelters and hostels often have NSP provision',
  ],
  legal_status:
    'Needle exchanges are completely legal in the UK and operate with government support. Using the service does NOT put you at legal risk. Your visit is confidential.',
  find_service_url: 'https://www.talktofrank.com/get-help/find-support-near-you',
};

/**
 * Drug checking service information (UK).
 */
export const DRUG_CHECKING_INFO = {
  what_is_it:
    'Drug checking services test substances for purity, composition, and the presence of dangerous adulterants. They help people who use drugs make more informed decisions about their use.',
  services_in_uk: [
    {
      name: 'The Loop',
      description:
        'Multi-agency drug checking service operating at festivals and in city centres. Provides drug testing with tailored harm reduction advice.',
      url: 'https://wearetheloop.org',
    },
    {
      name: 'WEDINOS',
      description:
        'Welsh Emerging Drugs & Identification of Novel Substances — free postal drug testing service funded by Welsh Government. Available to anyone in the UK.',
      url: 'https://www.wedinos.org',
    },
  ],
  how_it_works: [
    'Submit a small sample of the substance for laboratory analysis',
    'Results identify what the substance contains and any dangerous adulterants',
    'Trained staff provide personalised harm reduction advice based on results',
    'The service is confidential and non-judgmental',
    'You will not be reported to the police',
  ],
};
