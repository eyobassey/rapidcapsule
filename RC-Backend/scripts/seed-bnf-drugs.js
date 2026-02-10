#!/usr/bin/env node
/**
 * BNF SNOMED Mapping Drug Seeder
 *
 * Seeds the drug catalog from the NHS BNF SNOMED mapping spreadsheet.
 * Filters to VMP (Virtual Medicinal Product) rows in BNF chapters 01-18
 * (actual pharmaceuticals), skipping appliances, dressings, etc.
 *
 * Data source: https://www.nhsbsa.nhs.uk/prescription-data/understanding-our-data/bnf-snomed-mapping
 *
 * Usage:
 *   cd RC-Backend && node scripts/seed-bnf-drugs.js                    # full run
 *   node scripts/seed-bnf-drugs.js --dry-run                          # count only, no insert
 *   node scripts/seed-bnf-drugs.js --limit 500                        # insert first N only
 *   node scripts/seed-bnf-drugs.js --skip-images                      # skip image generation
 *   node scripts/seed-bnf-drugs.js --dry-run --limit 100              # preview first 100
 */

const path = require('path');
const ecosystemConfig = require(path.resolve(__dirname, '../../ecosystem.config.js'));
const backendEnv = ecosystemConfig.apps.find(app => app.name === 'RC-Backend')?.env || {};
process.env.AWS_ACCESS_KEY = backendEnv.AWS_ACCESS_KEY;
process.env.AWS_ACCESS_SECRET_KEY = backendEnv.AWS_ACCESS_SECRET_KEY;

const AWS = require('aws-sdk');
const { MongoClient, ObjectId } = require('mongodb');
const https = require('https');
const XLSX = require('xlsx');

const CONFIG = {
  mongoUrl: 'mongodb://127.0.0.1:27017/rapid_capsule?directConnection=true',
  pharmacyId: '693f961ebb4dc1fec542610a',
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_ACCESS_SECRET_KEY,
    region: 'us-east-2',
    bucket: 'rapidcapsules',
  },
  batchSize: 500,
  excelPath: path.resolve(__dirname, '../../BNF Snomed Mapping Data 20260120.xlsx'),
};

const s3 = new AWS.S3(CONFIG.aws);

// ╔══════════════════════════════════════════════════════════════════╗
// ║  SECTION 1: DOSAGE FORM PARSING FROM DM+D DESCRIPTION          ║
// ╚══════════════════════════════════════════════════════════════════╝

// Order matters — more specific patterns first
const FORM_PATTERNS = [
  // Modified/gastro-resistant/effervescent tablets
  { re: /effervescent\s+tablet/i, form: 'EFFERVESCENT' },
  { re: /chewable\s+tablet/i, form: 'CHEWABLE' },
  { re: /sublingual\s+tablet/i, form: 'SUBLINGUAL' },
  { re: /orodispersible\s+tablet/i, form: 'TABLET' },
  { re: /buccal\s+tablet/i, form: 'SUBLINGUAL' },
  { re: /modified-release\s+tablet/i, form: 'TABLET' },
  { re: /gastro-resistant\s+tablet/i, form: 'TABLET' },
  { re: /soluble\s+tablet/i, form: 'EFFERVESCENT' },
  { re: /dispersible\s+tablet/i, form: 'TABLET' },
  { re: /tablet/i, form: 'TABLET' },

  // Oral lyophilisates (orally disintegrating wafers)
  { re: /oral\s+lyophilisate/i, form: 'TABLET' },

  // Oral/buccal/sublingual films
  { re: /sublingual\s+film/i, form: 'SUBLINGUAL' },
  { re: /buccal\s+film/i, form: 'SUBLINGUAL' },
  { re: /orodispersible\s+film/i, form: 'TABLET' },

  // Capsules
  { re: /modified-release\s+capsule/i, form: 'CAPSULE' },
  { re: /gastro-resistant\s+capsule/i, form: 'CAPSULE' },
  { re: /capsule/i, form: 'CAPSULE' },
  { re: /caplet/i, form: 'TABLET' },

  // Medicated chewing gum
  { re: /medicated\s+chewing\s+gum/i, form: 'LOZENGE' },

  // Injections / infusions
  { re: /infusion\s+bag/i, form: 'INJECTION' },
  { re: /infusion/i, form: 'INJECTION' },
  { re: /pre-filled\s+syringe/i, form: 'INJECTION' },
  { re: /solution\s+for\s+injection/i, form: 'INJECTION' },
  { re: /suspension\s+for\s+injection/i, form: 'INJECTION' },
  { re: /powder\s+for\s+solution\s+for\s+injection/i, form: 'INJECTION' },
  { re: /injection\s+vial/i, form: 'INJECTION' },
  { re: /injection\s+ampoule/i, form: 'INJECTION' },
  { re: /injection/i, form: 'INJECTION' },
  { re: /ampoule/i, form: 'INJECTION' },
  { re: /vial/i, form: 'INJECTION' },
  { re: /vitrellae/i, form: 'INJECTION' },

  // Inhalers / nebulisers
  { re: /nebuliser/i, form: 'INHALER' },
  { re: /pressurised\s+inhalation/i, form: 'INHALER' },
  { re: /dry\s+powder\s+inhaler/i, form: 'INHALER' },
  { re: /inhalation/i, form: 'INHALER' },
  { re: /inhaler/i, form: 'INHALER' },

  // Patches & medicated plasters (drug-delivery plasters, not wound dressings)
  { re: /medicated\s+plaster/i, form: 'PATCH' },
  { re: /patch(es)?/i, form: 'PATCH' },

  // Suppositories / pessaries
  { re: /suppositor/i, form: 'SUPPOSITORY' },
  { re: /pessar/i, form: 'PESSARY' },
  { re: /enema/i, form: 'SUPPOSITORY' },

  // Topicals
  { re: /cream/i, form: 'CREAM' },
  { re: /ointment/i, form: 'OINTMENT' },
  { re: /gel(?:\s|$)/i, form: 'GEL' },
  { re: /paste/i, form: 'OINTMENT' },
  { re: /lotion/i, form: 'LOTION' },
  { re: /shampoo/i, form: 'SOLUTION' },
  { re: /scalp\s+application/i, form: 'SOLUTION' },
  { re: /nail\s+lacquer/i, form: 'SOLUTION' },

  // Drops
  { re: /eye\s+drop/i, form: 'DROPS' },
  { re: /ear\s+drop/i, form: 'DROPS' },
  { re: /nasal\s+drop/i, form: 'DROPS' },
  { re: /drop/i, form: 'DROPS' },

  // Sprays
  { re: /nasal\s+spray/i, form: 'SPRAY' },
  { re: /spray/i, form: 'SPRAY' },

  // Oral liquids
  { re: /oral\s+solution/i, form: 'SOLUTION' },
  { re: /oral\s+suspension/i, form: 'SUSPENSION' },
  { re: /oral\s+liquid/i, form: 'SOLUTION' },
  { re: /oral\s+emulsion/i, form: 'SUSPENSION' },
  { re: /elixir/i, form: 'SOLUTION' },
  { re: /mixture/i, form: 'SOLUTION' },
  { re: /syrup/i, form: 'SYRUP' },
  { re: /linctus/i, form: 'SYRUP' },
  { re: /tincture/i, form: 'SOLUTION' },
  { re: /oxymel/i, form: 'SOLUTION' },
  { re: /suspension/i, form: 'SUSPENSION' },
  { re: /emulsion/i, form: 'SUSPENSION' },
  { re: /solution/i, form: 'SOLUTION' },
  { re: /liquid/i, form: 'SOLUTION' },

  // Foam (topical)
  { re: /foam/i, form: 'GEL' },

  // Topical rubs & liniments
  { re: /liniment/i, form: 'SOLUTION' },
  { re: /\brub\b/i, form: 'OINTMENT' },
  { re: /\bstick/i, form: 'OINTMENT' },
  { re: /\bbalm\b/i, form: 'OINTMENT' },

  // "in White/Yellow soft paraffin" compounded preparations
  { re: /in\s+(white|yellow)\s+soft\s+paraffin/i, form: 'OINTMENT' },
  { re: /in\s+arachis\s+oil/i, form: 'SOLUTION' },

  // Bath products (emollients)
  { re: /bath\s+(oil|emollient|additive|emulsion)/i, form: 'SOLUTION' },
  { re: /shower\s+emollient/i, form: 'SOLUTION' },
  { re: /wash\b/i, form: 'SOLUTION' },

  // Medical devices
  { re: /testing\s+strip/i, form: 'DEVICE' },
  { re: /testing\s+tip/i, form: 'DEVICE' },
  { re: /detection\s+pad/i, form: 'DEVICE' },
  { re: /ophthalmic\s+strip/i, form: 'DEVICE' },
  { re: /ophthalmic\s+insert/i, form: 'DEVICE' },
  { re: /intrauterine\s+device/i, form: 'DEVICE' },
  { re: /vaginal\s+(ring|delivery\s+system|device)/i, form: 'DEVICE' },
  { re: /urethral\s+stick/i, form: 'DEVICE' },
  { re: /gauze\s+dressing/i, form: 'DEVICE' },
  { re: /medicated\s+stockings/i, form: 'DEVICE' },
  { re: /caustic\s+(pencil|applicator)/i, form: 'DEVICE' },
  { re: /impregnated\s+swab/i, form: 'DEVICE' },
  { re: /larvae\s+sterile/i, form: 'DEVICE' },
  { re: /wipe/i, form: 'DEVICE' },
  { re: /poultice/i, form: 'DEVICE' },

  // Others
  { re: /lozenge/i, form: 'LOZENGE' },
  { re: /pastille/i, form: 'LOZENGE' },
  { re: /sachet/i, form: 'POWDER' },
  { re: /powder/i, form: 'POWDER' },
  { re: /granule/i, form: 'GRANULES' },
  { re: /implant/i, form: 'IMPLANT' },
  { re: /mouthwash/i, form: 'SOLUTION' },
  { re: /paint/i, form: 'SOLUTION' },
  { re: /collodion/i, form: 'SOLUTION' },
  { re: /spirit/i, form: 'SOLUTION' },
  { re: /application/i, form: 'SOLUTION' },
];

function parseDosageForm(description) {
  const desc = (description || '').toLowerCase();
  for (const { re, form } of FORM_PATTERNS) {
    if (re.test(desc)) return form;
  }
  // Fallback: if description ends with a common form word
  if (desc.endsWith('tablets')) return 'TABLET';
  if (desc.endsWith('capsules')) return 'CAPSULE';
  return null;
}

// ╔══════════════════════════════════════════════════════════════════╗
// ║  SECTION 2: ROUTE INFERENCE FROM DOSAGE FORM + DESCRIPTION     ║
// ╚══════════════════════════════════════════════════════════════════╝

function inferRoute(formCode, description) {
  const desc = (description || '').toLowerCase();

  // Specific route indicators in description override defaults
  if (/nasal/i.test(desc)) return 'NASAL';
  if (/vaginal|pessar/i.test(desc)) return 'VAGINAL';
  if (/rectal|enema/i.test(desc)) return 'RECTAL';
  if (/eye\s+drop|ophthalmic/i.test(desc)) return 'OPHTHALMIC';
  if (/ear\s+drop|otic/i.test(desc)) return 'OTIC';
  if (/sublingual/i.test(desc)) return 'SUBLINGUAL';
  if (/intramuscular|[\s/]im[\s/]/i.test(desc)) return 'INTRAMUSCULAR';
  if (/subcutaneous|[\s/]sc[\s/]/i.test(desc)) return 'SUBCUTANEOUS';
  if (/epidural|intrathecal/i.test(desc)) return 'INTRAVENOUS';

  // Default route by form
  const FORM_ROUTE = {
    TABLET: 'ORAL',
    CAPSULE: 'ORAL',
    SOLUTION: 'ORAL',
    SYRUP: 'ORAL',
    SUSPENSION: 'ORAL',
    GRANULES: 'ORAL',
    EFFERVESCENT: 'ORAL',
    CHEWABLE: 'ORAL',
    SUBLINGUAL: 'SUBLINGUAL',
    LOZENGE: 'ORAL',
    POWDER: 'ORAL',
    INJECTION: 'INTRAVENOUS',
    CREAM: 'TOPICAL',
    OINTMENT: 'TOPICAL',
    GEL: 'TOPICAL',
    LOTION: 'TOPICAL',
    DROPS: 'OPHTHALMIC',
    INHALER: 'INHALATION',
    SPRAY: 'NASAL',
    PATCH: 'TRANSDERMAL',
    SUPPOSITORY: 'RECTAL',
    PESSARY: 'VAGINAL',
    IMPLANT: 'SUBCUTANEOUS',
    NEBULIZER: 'INHALATION',
    DEVICE: 'TOPICAL',
  };

  return FORM_ROUTE[formCode] || 'ORAL';
}

// ╔══════════════════════════════════════════════════════════════════╗
// ║  SECTION 3: BNF CHAPTER → CATEGORY MAPPING                    ║
// ╚══════════════════════════════════════════════════════════════════╝

const BNF_CHAPTER_CATEGORY = {
  '01': ['DIGESTIVE_HEALTH'],
  '02': ['CARDIOVASCULAR'],
  '03': ['RESPIRATORY'],
  '04': ['MENTAL_HEALTH'],
  '05': ['ANTIBIOTICS'],
  '06': ['HORMONES'],
  '07': ['WOMENS_HEALTH'],
  '08': ['OTHER'],             // Oncology
  '09': ['VITAMINS_SUPPLEMENTS'],
  '10': ['PAIN_RELIEF'],       // Musculoskeletal
  '11': ['EYE_CARE'],
  '12': ['EAR_CARE'],          // ENT
  '13': ['SKIN_CARE'],
  '14': ['OTHER'],             // Immunological
  '15': ['OTHER'],             // Anaesthetics
  '16': ['OTHER'],
  '17': ['OTHER'],
  '18': ['OTHER'],
};

// Sub-chapter refinements for Ch 05 (Infections)
const BNF_CH05_SUBCATEGORY = {
  '0501': ['ANTIBIOTICS'],     // Antibacterial drugs
  '0502': ['ANTIFUNGALS'],     // Antifungal drugs
  '0503': ['ANTIVIRALS'],      // Antiviral drugs
  '0504': ['ANTIBIOTICS'],     // Antiprotozoal drugs (including antimalarials)
  '0505': ['ANTIBIOTICS'],     // Anthelmintics
};

function getCategoryCodes(bnfCode) {
  const ch = bnfCode.substring(0, 2);
  if (ch === '05') {
    const sub = bnfCode.substring(0, 4);
    return BNF_CH05_SUBCATEGORY[sub] || ['ANTIBIOTICS'];
  }
  return BNF_CHAPTER_CATEGORY[ch] || ['OTHER'];
}

// ╔══════════════════════════════════════════════════════════════════╗
// ║  SECTION 4: CLASSIFICATION & SCHEDULING                        ║
// ╚══════════════════════════════════════════════════════════════════╝

// Controlled substances (detected from VTM name)
const CONTROLLED_VTMS = new Set([
  'morphine', 'codeine', 'fentanyl', 'methadone', 'oxycodone', 'hydromorphone',
  'pethidine', 'buprenorphine', 'tramadol', 'diazepam', 'lorazepam', 'midazolam',
  'clonazepam', 'nitrazepam', 'phenobarbital', 'ketamine', 'methylphenidate',
  'amphetamine', 'dextroamphetamine', 'alprazolam', 'zolpidem', 'zopiclone',
  'temazepam', 'oxazepam', 'chlordiazepoxide', 'pregabalin', 'gabapentin',
  'tapentadol', 'sufentanil', 'remifentanil', 'alfentanil',
]);

// Chapters that are generally prescription-only
const RX_CHAPTERS = new Set([
  '02', '04', '05', '06', '07', '08', '14', '15',
]);

// Chapters that have a mix / OTC potential
const OTC_CHAPTERS = new Set(['09', '13']);

function classifyDrug(vtmName, bnfChapter) {
  const vtmLower = (vtmName || '').toLowerCase();

  if (CONTROLLED_VTMS.has(vtmLower)) {
    return { purchase_type: 'CONTROLLED', schedule_class: 'SCHEDULE_II', classificationCode: 'SCHEDULE_II' };
  }
  if (RX_CHAPTERS.has(bnfChapter)) {
    return { purchase_type: 'PRESCRIPTION_ONLY', schedule_class: 'RX_ONLY', classificationCode: 'PRESCRIPTION_ONLY' };
  }
  if (OTC_CHAPTERS.has(bnfChapter)) {
    return { purchase_type: 'OTC_GENERAL', schedule_class: 'OTC', classificationCode: 'OTC_GENERAL' };
  }
  // Chapters 01 (GI), 03 (Respiratory), 10 (Musculoskeletal), 11 (Eye), 12 (ENT) → pharmacy-only
  return { purchase_type: 'PHARMACY_ONLY', schedule_class: 'OTC', classificationCode: 'PHARMACY_ONLY' };
}

// ╔══════════════════════════════════════════════════════════════════╗
// ║  SECTION 5: STRENGTH PARSING                                   ║
// ╚══════════════════════════════════════════════════════════════════╝

// Parse strength string from BNF Name (e.g., "Verapamil 160mg tablets" → "160mg")
const STRENGTH_RE = /(\d+(?:\.\d+)?(?:,\d+)?\s*(?:mg|g|ml|mcg|micrograms?|nanograms?|units?|%|mmol|iu)(?:\s*\/\s*\d+(?:\.\d+)?\s*(?:mg|g|ml|dose|hr|hour|actuation)?)?)/i;
const COMBO_STRENGTH_RE = /(\d+(?:\.\d+)?\s*(?:mg|g|ml|mcg|micrograms?|%)\s*\/\s*\d+(?:\.\d+)?\s*(?:mg|g|ml|mcg|micrograms?|%))/i;

function parseStrength(bnfName, numericStrength) {
  if (!bnfName) {
    return numericStrength ? `${numericStrength}mg` : '';
  }

  // Try combo strength first (e.g., "5mg/25mg")
  const combo = bnfName.match(COMBO_STRENGTH_RE);
  if (combo) return combo[1].replace(/\s+/g, '');

  // Try standard strength
  const match = bnfName.match(STRENGTH_RE);
  if (match) return match[1].replace(/\s+/g, '');

  // Microgram patterns
  const mcgMatch = bnfName.match(/(\d+)\s*microgram/i);
  if (mcgMatch) return `${mcgMatch[1]}mcg`;

  // Fallback to numeric column
  if (numericStrength) return `${numericStrength}mg`;

  return '';
}

// ╔══════════════════════════════════════════════════════════════════╗
// ║  SECTION 6: PREGNANCY CATEGORY ASSIGNMENT                      ║
// ╚══════════════════════════════════════════════════════════════════╝

const PREG_X_VTMS = new Set([
  'methotrexate', 'warfarin', 'isotretinoin', 'misoprostol', 'finasteride',
  'thalidomide', 'leflunomide', 'bosentan', 'atorvastatin', 'simvastatin',
  'rosuvastatin', 'pravastatin', 'fluvastatin',
]);
const PREG_D_VTMS = new Set([
  'phenytoin', 'valproic acid', 'sodium valproate', 'carbamazepine', 'lithium',
  'tetracycline', 'doxycycline', 'cyclophosphamide', 'losartan', 'valsartan',
  'candesartan', 'irbesartan', 'enalapril', 'lisinopril', 'ramipril', 'perindopril',
]);

function getPregnancyCategory(vtmName, bnfChapter) {
  const vtm = (vtmName || '').toLowerCase();
  if (PREG_X_VTMS.has(vtm)) return 'X';
  if (PREG_D_VTMS.has(vtm)) return 'D';
  if (bnfChapter === '08') return 'D'; // Oncology
  if (bnfChapter === '05') return 'B'; // Anti-infectives
  if (bnfChapter === '02') return 'C'; // Cardiovascular
  return 'C';
}

// ╔══════════════════════════════════════════════════════════════════╗
// ║  SECTION 7: SAFETY DATA TEMPLATES BY CATEGORY                  ║
// ╚══════════════════════════════════════════════════════════════════╝

const SAFETY_TEMPLATES = {
  DIGESTIVE_HEALTH: {
    side_effects: ['Nausea', 'Constipation', 'Diarrhoea', 'Abdominal pain', 'Flatulence', 'Headache'],
    contraindications: ['Known hypersensitivity', 'Bowel obstruction'],
    warnings: ['Long-term PPI use may increase fracture risk', 'May mask symptoms of gastric cancer'],
    precautions: ['Use lowest effective dose', 'Review need for continued treatment'],
  },
  CARDIOVASCULAR: {
    side_effects: ['Dizziness', 'Hypotension', 'Fatigue', 'Headache', 'Oedema', 'Bradycardia'],
    contraindications: ['Severe hypotension', 'Cardiogenic shock', 'Known hypersensitivity'],
    warnings: ['Do not discontinue abruptly', 'Monitor blood pressure regularly'],
    precautions: ['Adjust dose in renal impairment', 'Monitor electrolytes', 'Use caution in elderly'],
  },
  RESPIRATORY: {
    side_effects: ['Tremor', 'Headache', 'Tachycardia', 'Throat irritation', 'Cough'],
    contraindications: ['Known hypersensitivity to active ingredient'],
    warnings: ['Do not exceed recommended dose', 'Rinse mouth after inhaled corticosteroids'],
    precautions: ['Monitor heart rate', 'Regular review of inhaler technique'],
  },
  MENTAL_HEALTH: {
    side_effects: ['Drowsiness', 'Dry mouth', 'Weight gain', 'Dizziness', 'Nausea', 'Insomnia'],
    contraindications: ['Known hypersensitivity', 'Concurrent MAOI use', 'Uncontrolled epilepsy'],
    warnings: ['May increase suicidal thinking in young adults', 'Do not discontinue abruptly', 'Avoid alcohol'],
    precautions: ['Gradual dose titration recommended', 'Monitor mood and behaviour'],
  },
  ANTIBIOTICS: {
    side_effects: ['Nausea', 'Diarrhoea', 'Abdominal pain', 'Rash', 'Headache', 'Vomiting'],
    contraindications: ['Known hypersensitivity to drug class', 'History of severe allergic reaction to related antibiotics'],
    warnings: ['Complete full course of treatment', 'Risk of Clostridium difficile colitis'],
    precautions: ['Adjust dose in renal impairment', 'Monitor hepatic function'],
  },
  ANTIFUNGALS: {
    side_effects: ['Nausea', 'Abdominal pain', 'Headache', 'Skin rash', 'Elevated liver enzymes'],
    contraindications: ['Known hypersensitivity', 'Severe hepatic disease'],
    warnings: ['Monitor liver function tests', 'Multiple drug interactions possible'],
    precautions: ['Adjust dose in renal impairment', 'Check for drug interactions'],
  },
  ANTIVIRALS: {
    side_effects: ['Nausea', 'Headache', 'Fatigue', 'Diarrhoea', 'Insomnia', 'Rash'],
    contraindications: ['Known hypersensitivity', 'Severe hepatic impairment'],
    warnings: ['Check for drug interactions', 'Regular blood monitoring required'],
    precautions: ['Adjust dose in renal impairment', 'Ensure adequate hydration'],
  },
  HORMONES: {
    side_effects: ['Weight gain', 'Mood changes', 'Fluid retention', 'Increased appetite', 'Insomnia'],
    contraindications: ['Known hypersensitivity', 'Systemic fungal infections (corticosteroids)'],
    warnings: ['Do not discontinue corticosteroids abruptly', 'May increase infection risk'],
    precautions: ['Gradual dose reduction when stopping', 'Use lowest effective dose'],
  },
  WOMENS_HEALTH: {
    side_effects: ['Nausea', 'Breast tenderness', 'Headache', 'Mood changes', 'Irregular bleeding'],
    contraindications: ['Known/suspected pregnancy', 'Undiagnosed vaginal bleeding', 'History of DVT/PE'],
    warnings: ['Increased risk of thromboembolism', 'Regular check-ups recommended'],
    precautions: ['Report unusual symptoms immediately'],
  },
  VITAMINS_SUPPLEMENTS: {
    side_effects: ['Nausea', 'Stomach upset', 'Constipation (iron)', 'Metallic taste'],
    contraindications: ['Known hypersensitivity', 'Hypercalcaemia (vitamin D)', 'Iron overload disorders'],
    warnings: ['Do not exceed recommended daily intake', 'Keep out of reach of children'],
    precautions: ['Take with food to reduce stomach upset', 'May interact with certain medications'],
  },
  PAIN_RELIEF: {
    side_effects: ['Nausea', 'Headache', 'Dizziness', 'Stomach upset', 'Constipation'],
    contraindications: ['Known hypersensitivity', 'Severe hepatic impairment', 'Active GI bleeding'],
    warnings: ['Do not exceed recommended dose', 'Avoid alcohol consumption'],
    precautions: ['Use with caution in elderly patients', 'Monitor renal function with prolonged use'],
  },
  EYE_CARE: {
    side_effects: ['Transient stinging', 'Blurred vision', 'Eye irritation', 'Tearing'],
    contraindications: ['Known hypersensitivity', 'Soft contact lens wear (some preparations)'],
    warnings: ['Do not touch dropper tip to eye', 'Discard within 28 days of opening'],
    precautions: ['Wait 5 minutes between different eye drops', 'Store as directed'],
  },
  EAR_CARE: {
    side_effects: ['Local irritation', 'Temporary hearing changes', 'Dizziness'],
    contraindications: ['Perforated eardrum', 'Known hypersensitivity'],
    warnings: ['Do not use if ear is draining', 'Warm drops to body temperature before use'],
    precautions: ['Complete full course of treatment'],
  },
  SKIN_CARE: {
    side_effects: ['Local irritation', 'Burning sensation', 'Dryness', 'Redness', 'Itching'],
    contraindications: ['Known hypersensitivity', 'Application to infected/broken skin (corticosteroids)'],
    warnings: ['For external use only', 'Avoid contact with eyes'],
    precautions: ['Apply thinly to affected area', 'Monitor for skin thinning with corticosteroids'],
  },
  ALLERGIES: {
    side_effects: ['Drowsiness', 'Dry mouth', 'Headache', 'Fatigue', 'Nausea'],
    contraindications: ['Known hypersensitivity', 'Severe hepatic impairment'],
    warnings: ['May impair ability to drive', 'Avoid alcohol'],
    precautions: ['Adjust dose in renal impairment'],
  },
  OTHER: {
    side_effects: ['Nausea', 'Headache', 'Dizziness', 'Fatigue'],
    contraindications: ['Known hypersensitivity to active ingredient'],
    warnings: ['Use as directed by healthcare professional'],
    precautions: ['Follow prescribed dose and duration', 'Inform doctor of all other medications'],
  },
  MEDICAL_DEVICES: {
    side_effects: ['Local irritation', 'Skin sensitisation'],
    contraindications: ['Known hypersensitivity to components'],
    warnings: ['For professional use only where specified', 'Follow manufacturer instructions'],
    precautions: ['Store as directed', 'Check expiry date before use', 'Single use items must not be reused'],
  },
};

// ╔══════════════════════════════════════════════════════════════════╗
// ║  SECTION 8: PRICE GENERATION                                   ║
// ╚══════════════════════════════════════════════════════════════════╝

const PRICE_TIERS = {
  '01': { costMin: 200, costMax: 6000, marginMin: 1.3, marginMax: 1.8 },   // GI
  '02': { costMin: 300, costMax: 8000, marginMin: 1.3, marginMax: 1.7 },   // Cardiovascular
  '03': { costMin: 300, costMax: 8000, marginMin: 1.3, marginMax: 1.8 },   // Respiratory
  '04': { costMin: 300, costMax: 10000, marginMin: 1.3, marginMax: 1.7 },  // CNS
  '05': { costMin: 300, costMax: 8000, marginMin: 1.3, marginMax: 1.7 },   // Infections
  '06': { costMin: 500, costMax: 15000, marginMin: 1.3, marginMax: 1.7 },  // Endocrine
  '07': { costMin: 300, costMax: 8000, marginMin: 1.3, marginMax: 1.7 },   // Reproductive
  '08': { costMin: 5000, costMax: 100000, marginMin: 1.15, marginMax: 1.4 }, // Oncology
  '09': { costMin: 100, costMax: 3000, marginMin: 1.4, marginMax: 2.5 },   // Nutrition/vitamins
  '10': { costMin: 200, costMax: 6000, marginMin: 1.3, marginMax: 1.8 },   // Musculoskeletal
  '11': { costMin: 300, costMax: 5000, marginMin: 1.3, marginMax: 1.8 },   // Eye
  '12': { costMin: 200, costMax: 5000, marginMin: 1.3, marginMax: 1.8 },   // ENT
  '13': { costMin: 200, costMax: 5000, marginMin: 1.4, marginMax: 2.0 },   // Skin
  '14': { costMin: 1000, costMax: 20000, marginMin: 1.3, marginMax: 1.6 }, // Immunological
  '15': { costMin: 2000, costMax: 25000, marginMin: 1.3, marginMax: 1.8 }, // Anaesthetics
};
const DEFAULT_PRICE_TIER = { costMin: 300, costMax: 8000, marginMin: 1.3, marginMax: 1.7 };

function seededRandom(seed) {
  let x = seed;
  return function () {
    x = (x * 1103515245 + 12345) & 0x7fffffff;
    return x / 0x7fffffff;
  };
}

function generatePrice(drugName, strength, bnfChapter) {
  const hash = (drugName + strength).split('').reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0);
  const rng = seededRandom(Math.abs(hash));

  const tier = PRICE_TIERS[bnfChapter] || DEFAULT_PRICE_TIER;
  let cost = tier.costMin + rng() * (tier.costMax - tier.costMin);

  const margin = tier.marginMin + rng() * (tier.marginMax - tier.marginMin);
  let selling = cost * margin;

  cost = Math.round(cost / 10) * 10;
  selling = Math.round(selling / 10) * 10;
  if (selling <= cost) selling = cost + 50;

  return { cost_price: cost, selling_price: selling };
}

function generateQuantity(purchaseType) {
  const ranges = {
    OTC_GENERAL: [50, 250],
    OTC_RESTRICTED: [40, 150],
    PHARMACY_ONLY: [30, 120],
    PRESCRIPTION_ONLY: [30, 100],
    CONTROLLED: [30, 60],
  };
  const [min, max] = ranges[purchaseType] || [30, 100];
  return min + Math.floor(Math.random() * (max - min));
}

// ╔══════════════════════════════════════════════════════════════════╗
// ║  SECTION 9: DRUG DOCUMENT BUILDER                              ║
// ╚══════════════════════════════════════════════════════════════════╝

function titleCase(str) {
  return str.replace(/\b\w/g, c => c.toUpperCase());
}

function buildDrugDoc(params, refData) {
  const {
    name, generic_name, strength, formCode, routeCode, categoryCodes,
    purchase_type, schedule_class, classificationCode,
    pregnancy_category, bnfChapter, description, bnfCode,
  } = params;

  // DEVICE form: map to IMPLANT in DB, override category to MEDICAL_DEVICES
  const isDevice = formCode === 'DEVICE';
  const dbFormCode = isDevice ? 'IMPLANT' : formCode;

  const formId = refData.forms[dbFormCode];
  const routeId = refData.routes[routeCode];
  const classificationId = refData.classifications[classificationCode];
  if (!formId || !routeId) return null;

  // Devices get MEDICAL_DEVICES category; regular drugs keep their chapter-based category
  const effectiveCategoryCodes = isDevice ? ['MEDICAL_DEVICES'] : categoryCodes;
  const categoryIds = effectiveCategoryCodes
    .map(c => refData.categories[c])
    .filter(Boolean);
  if (categoryIds.length === 0) {
    const otherId = refData.categories['OTHER'];
    if (otherId) categoryIds.push(otherId);
  }

  const primaryCategory = isDevice ? 'MEDICAL_DEVICES' : (categoryCodes[0] || 'OTHER');
  const safety = SAFETY_TEMPLATES[primaryCategory] || SAFETY_TEMPLATES.OTHER;
  const prices = generatePrice(name, strength, bnfChapter);

  const unitMap = {
    TABLET: 'tablets', CAPSULE: 'capsules', LOZENGE: 'lozenges',
    CHEWABLE: 'tablets', EFFERVESCENT: 'tablets', SUBLINGUAL: 'tablets',
    SYRUP: 'ml', SOLUTION: 'ml', SUSPENSION: 'ml',
    CREAM: 'g', OINTMENT: 'g', GEL: 'g', LOTION: 'ml',
    INJECTION: 'vials', DROPS: 'ml', SPRAY: 'ml',
    PATCH: 'patches', INHALER: 'doses', NEBULIZER: 'doses',
    SUPPOSITORY: 'suppositories', PESSARY: 'pessaries',
    POWDER: 'sachets', GRANULES: 'sachets', IMPLANT: 'implant',
    DEVICE: 'units',
  };

  const dosageGuidance = {
    adult: { dose: 'As directed by healthcare professional', frequency: 'As prescribed', max_daily: 'Do not exceed prescribed dose', notes: '' },
    pediatric: { dose: 'As directed by healthcare professional', frequency: 'Weight/age-adjusted dosing', max_daily: 'Do not exceed prescribed dose', notes: 'Use age-appropriate formulation' },
    elderly: { dose: 'Start with lower dose', frequency: 'As prescribed', max_daily: 'Monitor closely', notes: 'Dose adjustment may be required' },
  };

  return {
    name,
    generic_name: generic_name || name,
    brand_name: null, // VMPs are generic presentations
    manufacturer: null,
    description: description || `${name} - ${titleCase(formCode.toLowerCase())} for ${routeCode.toLowerCase()} administration.`,
    strength: strength || '',
    dosage_form: new ObjectId(formId),
    route: new ObjectId(routeId),
    categories: categoryIds.map(id => new ObjectId(id)),
    purchase_type,
    schedule_class,
    classification: classificationId ? new ObjectId(classificationId) : null,
    status: 'ACTIVE',
    requires_prescription: ['PRESCRIPTION_ONLY', 'CONTROLLED'].includes(purchase_type),
    is_controlled_substance: purchase_type === 'CONTROLLED',
    pregnancy_category: pregnancy_category || 'C',
    atc_code: null,
    cost_price: prices.cost_price,
    selling_price: prices.selling_price,
    quantity: generateQuantity(purchase_type),
    pack_size: ['TABLET', 'CAPSULE'].includes(formCode) ? 28 : 1,
    unit_of_measure: unitMap[formCode] || 'units',
    side_effects: safety.side_effects,
    contraindications: safety.contraindications,
    warnings: safety.warnings,
    precautions: safety.precautions,
    dosage_guidance: dosageGuidance,
    images: [],
    search_keywords: [
      name.toLowerCase(),
      (generic_name || '').toLowerCase(),
      formCode.toLowerCase(),
      (strength || '').toLowerCase(),
    ].filter(Boolean),
    symptoms_treated: [],
    tags: ['BNF', isDevice ? 'Medical Device' : 'Generic', purchase_type.replace(/_/g, ' ')],
    pharmacy_id: new ObjectId(CONFIG.pharmacyId),
    is_active: true,
    is_featured: false,
    created_at: new Date(),
    updated_at: new Date(),
  };
}

// ╔══════════════════════════════════════════════════════════════════╗
// ║  SECTION 10: IMAGE GENERATION                                  ║
// ╚══════════════════════════════════════════════════════════════════╝

const CATEGORY_COLORS = {
  PAIN_RELIEF:       [{ bg: 'dc2626', text: 'ffffff' }, { bg: 'e85d04', text: 'ffffff' }, { bg: 'c2410c', text: 'ffffff' }],
  ANTIBIOTICS:       [{ bg: '16a34a', text: 'ffffff' }, { bg: '15803d', text: 'ffffff' }, { bg: '22863a', text: 'ffffff' }],
  ANTIFUNGALS:       [{ bg: '059669', text: 'ffffff' }, { bg: '0d9488', text: 'ffffff' }],
  ANTIVIRALS:        [{ bg: '7c3aed', text: 'ffffff' }, { bg: '6d28d9', text: 'ffffff' }],
  ALLERGIES:         [{ bg: '7c3aed', text: 'ffffff' }, { bg: '8b5cf6', text: 'ffffff' }],
  DIGESTIVE_HEALTH:  [{ bg: '0d9488', text: 'ffffff' }, { bg: '0f766e', text: 'ffffff' }],
  VITAMINS_SUPPLEMENTS: [{ bg: 'f59e0b', text: '000000' }, { bg: 'd97706', text: 'ffffff' }],
  CARDIOVASCULAR:    [{ bg: '3b82f6', text: 'ffffff' }, { bg: '4f46e5', text: 'ffffff' }, { bg: '2563eb', text: 'ffffff' }],
  MENTAL_HEALTH:     [{ bg: '8b5cf6', text: 'ffffff' }, { bg: '6366f1', text: 'ffffff' }],
  RESPIRATORY:       [{ bg: '06b6d4', text: 'ffffff' }, { bg: '0891b2', text: 'ffffff' }],
  EYE_CARE:          [{ bg: '22d3ee', text: '000000' }, { bg: '06b6d4', text: 'ffffff' }],
  EAR_CARE:          [{ bg: '14b8a6', text: 'ffffff' }, { bg: '0d9488', text: 'ffffff' }],
  SKIN_CARE:         [{ bg: 'e11d48', text: 'ffffff' }, { bg: 'be185d', text: 'ffffff' }],
  HORMONES:          [{ bg: 'ec4899', text: 'ffffff' }, { bg: 'db2777', text: 'ffffff' }],
  WOMENS_HEALTH:     [{ bg: 'db2777', text: 'ffffff' }, { bg: 'be185d', text: 'ffffff' }],
  MEDICAL_DEVICES:   [{ bg: '475569', text: 'ffffff' }, { bg: '64748b', text: 'ffffff' }],
  OTHER:             [{ bg: '6b7280', text: 'ffffff' }, { bg: '4b5563', text: 'ffffff' }],
};

function pickImageColor(drugName, primaryCategory) {
  const shades = CATEGORY_COLORS[primaryCategory] || CATEGORY_COLORS.OTHER;
  const hash = drugName.split('').reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0);
  return shades[Math.abs(hash) % shades.length];
}

function downloadImage(url, redirects = 0) {
  if (redirects > 5) return Promise.reject(new Error('Too many redirects'));
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 30000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        downloadImage(res.headers.location, redirects + 1).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) { reject(new Error(`HTTP ${res.statusCode}`)); return; }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject).on('timeout', () => reject(new Error('Timeout')));
  });
}

async function generateAndUploadImage(drug, primaryCategory) {
  const colors = pickImageColor(drug.name, primaryCategory);
  let text = drug.name;
  if (drug.strength) text += `\n${drug.strength}`;
  const url = `https://placehold.co/600x600/${colors.bg}/${colors.text}/png?text=${encodeURIComponent(text)}&font=roboto`;

  const buffer = await downloadImage(url);
  const filename = `pharmacy/drugs/${Date.now()}-${drug.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.png`;
  const result = await s3.upload({
    Bucket: CONFIG.aws.bucket,
    Key: filename,
    Body: buffer,
    ContentType: 'image/png',
  }).promise();

  return {
    url: result.Location,
    is_primary: true,
    alt_text: `${drug.name} ${drug.strength || ''}`.trim(),
  };
}

// ╔══════════════════════════════════════════════════════════════════╗
// ║  SECTION 11: EXCEL PARSING & MAIN EXECUTION                   ║
// ╚══════════════════════════════════════════════════════════════════╝

function parseExcel() {
  console.log(`Reading Excel: ${CONFIG.excelPath}`);
  const wb = XLSX.readFile(CONFIG.excelPath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(ws);
  console.log(`  Total rows: ${data.length}`);

  // Filter to VMP rows only
  const vmps = data.filter(r => r['VMP / VMPP/ AMP / AMPP'] === 'VMP');
  console.log(`  VMP rows: ${vmps.length}`);

  // Filter to rows with BNF codes in chapters 01-18
  const drugVmps = vmps.filter(r => {
    const code = r['BNF Code'];
    if (!code) return false;
    const ch = parseInt(code.substring(0, 2));
    return ch >= 1 && ch <= 18;
  });
  console.log(`  VMPs in chapters 01-18: ${drugVmps.length}`);

  return drugVmps;
}

async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  const skipImages = process.argv.includes('--skip-images');
  const limitArg = process.argv.indexOf('--limit');
  const limit = limitArg >= 0 ? parseInt(process.argv[limitArg + 1]) : Infinity;

  console.log(`\n${'='.repeat(60)}`);
  console.log(`  BNF SNOMED Mapping Drug Seeder`);
  console.log(`  Mode: ${isDryRun ? 'DRY RUN' : 'LIVE INSERT'}`);
  console.log(`  Images: ${skipImages ? 'SKIP' : 'GENERATE'}`);
  console.log(`  Limit: ${limit === Infinity ? 'none' : limit}`);
  console.log(`${'='.repeat(60)}\n`);

  // ─── Parse Excel ───
  const vmps = parseExcel();

  const client = new MongoClient(CONFIG.mongoUrl);

  try {
    await client.connect();
    console.log('\nConnected to MongoDB\n');
    const db = client.db('rapid_capsule');
    const drugsCollection = db.collection('drugentities');

    // ─── Load reference data ───
    const refData = { forms: {}, routes: {}, categories: {}, classifications: {} };

    const forms = await db.collection('dosageformentities').find({}).toArray();
    forms.forEach(f => { refData.forms[f.code] = f._id.toString(); });

    const routes = await db.collection('drugrouteentities').find({}).toArray();
    routes.forEach(r => { refData.routes[r.code] = r._id.toString(); });

    const cats = await db.collection('drugcategoryentities').find({}).toArray();
    cats.forEach(c => { refData.categories[c.code] = c._id.toString(); });

    const classifs = await db.collection('drugclassificationentities').find({}).toArray();
    classifs.forEach(c => { refData.classifications[c.code] = c._id.toString(); });

    console.log(`Reference data: ${forms.length} forms, ${routes.length} routes, ${cats.length} categories, ${classifs.length} classifications\n`);

    // ─── Load existing drugs for dedup ───
    const existing = await drugsCollection.find({}, {
      projection: { name: 1, strength: 1, dosage_form: 1 },
    }).toArray();
    const existingKeys = new Set(
      existing.map(d => `${(d.name || '').toLowerCase()}|${(d.strength || '').toLowerCase()}|${d.dosage_form?.toString() || ''}`)
    );
    console.log(`Existing drugs: ${existing.length} (for dedup)\n`);

    // ─── Generate drug documents from BNF VMPs ───
    console.log('Generating drug documents from BNF data...\n');
    const allDrugs = [];
    let parseFailures = 0;

    for (const row of vmps) {
      const bnfCode = row['BNF Code'];
      const bnfName = row['BNF Name'] || '';
      const vtmName = row['VTM Name'] || '';
      const desc = row['DM+D: Product Description'] || bnfName;
      const numericStrength = row['Strength'];
      const bnfChapter = bnfCode.substring(0, 2);

      // Parse dosage form from description
      const formCode = parseDosageForm(desc);
      if (!formCode) {
        parseFailures++;
        continue;
      }

      // Infer route
      const routeCode = inferRoute(formCode, desc);

      // Parse strength
      const strength = parseStrength(bnfName, numericStrength);

      // Get category, classification
      const categoryCodes = getCategoryCodes(bnfCode);
      const { purchase_type, schedule_class, classificationCode } = classifyDrug(vtmName, bnfChapter);
      const pregCat = getPregnancyCategory(vtmName, bnfChapter);

      // Use BNF Name as the drug name (it's already well-formatted)
      const drugName = bnfName || desc;
      const genericName = vtmName ? titleCase(vtmName) : drugName;

      const doc = buildDrugDoc({
        name: drugName,
        generic_name: genericName,
        strength,
        formCode,
        routeCode,
        categoryCodes,
        purchase_type,
        schedule_class,
        classificationCode,
        pregnancy_category: pregCat,
        bnfChapter,
        description: `${drugName} - ${desc}`,
        bnfCode,
      }, refData);

      if (doc) {
        allDrugs.push({ doc, primaryCategory: categoryCodes[0] });
      }
    }

    console.log(`Generated ${allDrugs.length} drug entries (${parseFailures} skipped — unmappable form)\n`);

    // ─── Deduplication ───
    const dedupedDrugs = [];
    const newKeys = new Set();
    let dupSkipped = 0;

    for (const { doc, primaryCategory } of allDrugs) {
      const key = `${doc.name.toLowerCase()}|${(doc.strength || '').toLowerCase()}|${doc.dosage_form.toString()}`;
      if (existingKeys.has(key) || newKeys.has(key)) {
        dupSkipped++;
        continue;
      }
      newKeys.add(key);
      dedupedDrugs.push({ doc, primaryCategory });
    }

    console.log(`After dedup: ${dedupedDrugs.length} new drugs (${dupSkipped} duplicates skipped)\n`);

    // Apply limit
    const toInsert = dedupedDrugs.slice(0, limit);
    console.log(`Will process: ${toInsert.length} drugs\n`);

    if (isDryRun) {
      console.log('DRY RUN — no documents inserted.\n');

      // Category breakdown
      const catCounts = {};
      toInsert.forEach(({ primaryCategory }) => {
        catCounts[primaryCategory] = (catCounts[primaryCategory] || 0) + 1;
      });
      console.log('Category breakdown:');
      Object.entries(catCounts).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
        console.log(`  ${cat}: ${count}`);
      });

      // Chapter breakdown
      const chCounts = {};
      toInsert.forEach(({ doc }) => {
        const tags = doc.tags || [];
        // We stored bnfCode in search_keywords or can infer from tags
        // Actually we don't store bnfCode on doc. Let's count by purchase_type
      });

      // Form breakdown
      const formCounts = {};
      toInsert.forEach(({ doc }) => {
        const formStr = doc.unit_of_measure || 'unknown';
        formCounts[formStr] = (formCounts[formStr] || 0) + 1;
      });
      console.log('\nUnit of measure breakdown:');
      Object.entries(formCounts).sort((a, b) => b[1] - a[1]).forEach(([form, count]) => {
        console.log(`  ${form}: ${count}`);
      });

      // Purchase type breakdown
      const ptCounts = {};
      toInsert.forEach(({ doc }) => {
        ptCounts[doc.purchase_type] = (ptCounts[doc.purchase_type] || 0) + 1;
      });
      console.log('\nPurchase type breakdown:');
      Object.entries(ptCounts).sort((a, b) => b[1] - a[1]).forEach(([pt, count]) => {
        console.log(`  ${pt}: ${count}`);
      });

      // Sample drugs
      console.log('\nSample drugs (first 10):');
      toInsert.slice(0, 10).forEach(({ doc }) => {
        console.log(`  ${doc.name} | ${doc.strength} | qty=${doc.quantity} | ₦${doc.selling_price}`);
      });

      return;
    }

    // ─── Insert in batches ───
    let inserted = 0;
    let imgSuccess = 0, imgFailed = 0;

    for (let i = 0; i < toInsert.length; i += CONFIG.batchSize) {
      const batch = toInsert.slice(i, i + CONFIG.batchSize);
      const docs = batch.map(b => b.doc);

      // Generate images if not skipped
      if (!skipImages) {
        for (let j = 0; j < batch.length; j++) {
          const { doc, primaryCategory } = batch[j];
          try {
            const img = await generateAndUploadImage(doc, primaryCategory);
            docs[j].images = [img];
            imgSuccess++;
            // Rate limiting: 100ms pause every 10 images
            if (j % 10 === 9) await new Promise(r => setTimeout(r, 100));
          } catch (err) {
            imgFailed++;
            // Continue without image
          }
          // Progress
          if ((inserted + j + 1) % 200 === 0) {
            console.log(`  Progress: ${inserted + j + 1}/${toInsert.length} drugs processed (${imgSuccess} images ok, ${imgFailed} failed)...`);
          }
        }
      }

      const result = await drugsCollection.insertMany(docs, { ordered: false });
      inserted += result.insertedCount;
      console.log(`  Batch ${Math.floor(i / CONFIG.batchSize) + 1}: inserted ${result.insertedCount} drugs`);
    }

    // ─── Final report ───
    const finalCount = await drugsCollection.countDocuments();
    console.log(`\n${'='.repeat(60)}`);
    console.log(`  BNF SEEDING COMPLETE`);
    console.log(`  New drugs inserted: ${inserted}`);
    console.log(`  Duplicates skipped: ${dupSkipped}`);
    console.log(`  Parse failures:     ${parseFailures}`);
    if (!skipImages) console.log(`  Images: ${imgSuccess} success, ${imgFailed} failed`);
    console.log(`  Total drugs in DB:  ${finalCount}`);
    console.log(`${'='.repeat(60)}\n`);

  } finally {
    await client.close();
  }
}

main().catch(console.error);
