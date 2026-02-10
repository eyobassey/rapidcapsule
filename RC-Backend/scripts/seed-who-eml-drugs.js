/**
 * Large-scale drug seeder from WHO Essential Medicines List + brands + manufacturer generics
 *
 * Generates 5000-10000+ drugs from:
 *   1. WHO EML 2025 (671 medicines, 1680 formulations) → generic entries
 *   2. Brand name database (~200 INN → brand mappings)
 *   3. Manufacturer generic multipliers (Teva, Cipla, Mylan, Emzor, etc.)
 *   4. Supplementary OTC/supplement data
 *
 * Usage:
 *   node scripts/seed-who-eml-drugs.js                    # full run
 *   node scripts/seed-who-eml-drugs.js --dry-run           # count only, no insert
 *   node scripts/seed-who-eml-drugs.js --limit 500         # insert first N only
 *   node scripts/seed-who-eml-drugs.js --skip-images       # skip image generation
 */

const path = require('path');
const ecosystemConfig = require(path.resolve(__dirname, '../../ecosystem.config.js'));
const backendEnv = ecosystemConfig.apps.find(app => app.name === 'RC-Backend')?.env || {};
process.env.AWS_ACCESS_KEY = backendEnv.AWS_ACCESS_KEY;
process.env.AWS_ACCESS_SECRET_KEY = backendEnv.AWS_ACCESS_SECRET_KEY;

const AWS = require('aws-sdk');
const { MongoClient, ObjectId } = require('mongodb');
const https = require('https');

const CONFIG = {
  mongoUrl: 'mongodb://127.0.0.1:27017/rapid_capsule?directConnection=true',
  pharmacyId: '693f961ebb4dc1fec542610a',
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_ACCESS_SECRET_KEY,
    region: 'us-east-2',
    bucket: 'rapidcapsules'
  },
  batchSize: 500,
};

const s3 = new AWS.S3(CONFIG.aws);

// ╔══════════════════════════════════════════════════════════════════╗
// ║  SECTION 1: WHO EML → DB MAPPINGS                              ║
// ╚══════════════════════════════════════════════════════════════════╝

// WHO EML form string → DB dosage form code
const FORM_MAP = {
  'tablet':     'TABLET',
  'capsule':    'CAPSULE',
  'solution':   'SOLUTION',
  'syrup':      'SYRUP',
  'suspension': 'SUSPENSION',
  'drops':      'DROPS',
  'cream':      'CREAM',
  'ointment':   'OINTMENT',
  'gel':        'GEL',
  'lotion':     'LOTION',
  'spray':      'SPRAY',
  'inhaler':    'INHALER',
  'nebulizer':  'NEBULIZER',
  'patch':      'PATCH',
  'suppository':'SUPPOSITORY',
  'powder':     'POWDER',
  'granules':   'GRANULES',
  'pessary':    'PESSARY',
  'implant':    'IMPLANT',
  'paste':      'OINTMENT',
  'mouthwash':  'SOLUTION',
  'liquid':     'SOLUTION',
  'inhalation': 'INHALER',
  'gum':        'LOZENGE',
  'gas':        'INHALER',
  'emulsion':   'SOLUTION',
  'blister':    'TABLET',
  'ampoule':    'INJECTION',
  'bag':        'INJECTION',
  'insert':     'IMPLANT',
  'device':     null, // skip
  'generator':  null, // skip
};

// WHO EML route string → DB route code
const ROUTE_MAP = {
  'oral':          'ORAL',
  'injection':     'INTRAVENOUS',
  'topical':       'TOPICAL',
  'rectal':        'RECTAL',
  'ophthalmic':    'OPHTHALMIC',
  'otic':          'OTIC',
  'inhalation':    'INHALATION',
  'nasal':         'NASAL',
  'sublingual':    'SUBLINGUAL',
  'vaginal':       'VAGINAL',
  'intrauterine':  'VAGINAL',
  'transdermal':   'TRANSDERMAL',
  'subdermal':     'SUBCUTANEOUS',
  'intratracheal': 'INHALATION',
};

// Refine injection route based on form
function resolveRoute(whoRoute, whoForm) {
  if (whoRoute === 'injection') {
    if (whoForm === 'ampoule' || whoForm === 'bag') return 'INTRAVENOUS';
    return 'INTRAMUSCULAR';
  }
  return ROUTE_MAP[whoRoute] || 'ORAL';
}

// WHO EML section prefix → DB category code(s)
const SECTION_CATEGORY_MAP = {
  '1':    ['OTHER'],                    // Anaesthetics
  '2':    ['PAIN_RELIEF'],              // Analgesics
  '3':    ['ALLERGIES'],                // Anti-allergics
  '4':    ['OTHER'],                    // Antidotes
  '5':    ['MENTAL_HEALTH'],            // Anticonvulsants
  '6.1':  ['ANTIBIOTICS'],             // Anthelminthics
  '6.2':  ['ANTIBIOTICS'],             // Antibacterials
  '6.3':  ['ANTIFUNGALS'],             // Antifungals
  '6.4':  ['ANTIVIRALS'],              // Antivirals
  '6.5':  ['ANTIBIOTICS'],             // Antimalarials
  '6.6':  ['ANTIBIOTICS', 'RESPIRATORY'], // Anti-TB
  '7':    ['PAIN_RELIEF'],              // Antimigraine
  '8':    ['OTHER'],                    // Immunosuppressants
  '9':    ['OTHER'],                    // Antineoplastic
  '10':   ['MENTAL_HEALTH'],            // Antiparkinsonism
  '11':   ['OTHER'],                    // Blood products
  '12':   ['CARDIOVASCULAR'],           // Cardiovascular
  '13':   ['SKIN_CARE'],               // Dermatological
  '14':   ['OTHER'],                    // Diagnostic agents
  '15':   ['FIRST_AID'],               // Disinfectants
  '16':   ['CARDIOVASCULAR'],           // Diuretics
  '17':   ['DIGESTIVE_HEALTH'],         // Gastrointestinal
  '18':   ['HORMONES'],                 // Hormones
  '19':   ['OTHER'],                    // Immunologicals (vaccines)
  '20':   ['PAIN_RELIEF'],              // Muscle relaxants
  '21':   ['EYE_CARE'],                // Ophthalmological
  '22':   ['WOMENS_HEALTH'],            // Oxytocics
  '23':   ['OTHER'],                    // Peritoneal dialysis
  '24':   ['MENTAL_HEALTH'],            // Psychotherapeutic
  '25':   ['RESPIRATORY'],              // Respiratory
  '26':   ['VITAMINS_SUPPLEMENTS'],     // Vitamins
  '27':   ['EAR_CARE'],                // ENT
};

function getSectionPrefix(section) {
  // Extract "6.4" from "6.4 Anti-infective - Antivirals"
  const match = section.match(/^([\d.]+)/);
  return match ? match[1] : '0';
}

// ╔══════════════════════════════════════════════════════════════════╗
// ║  SECTION 2: CLASSIFICATION & SCHEDULING LOGIC                  ║
// ╚══════════════════════════════════════════════════════════════════╝

// INN names that are controlled substances
const CONTROLLED_INNS = new Set([
  'morphine', 'codeine', 'fentanyl', 'methadone', 'oxycodone', 'hydromorphone',
  'pethidine', 'buprenorphine', 'tramadol', 'diazepam', 'lorazepam', 'midazolam',
  'clonazepam', 'nitrazepam', 'phenobarbital', 'ketamine', 'methylphenidate',
  'amphetamine', 'dextroamphetamine', 'alprazolam', 'zolpidem',
]);

// INN names that are prescription-only but not controlled
const PRESCRIPTION_INNS = new Set([
  // Antibiotics, antivirals, antifungals are generally prescription
  // Most cardiovascular, diabetes, mental health drugs too
  // We'll use section-based logic instead of listing everything
]);

// Sections that are generally prescription-only
const RX_SECTIONS = new Set([
  '1', '5', '6.1', '6.2', '6.3', '6.4', '6.5', '6.6', '8', '9', '10',
  '11', '12', '16', '18', '19', '20', '22', '23', '24'
]);

// Sections that are generally OTC
const OTC_SECTIONS = new Set(['3', '13', '15', '26', '27']);

function classifyDrug(inn, sectionPrefix) {
  const innLower = inn.toLowerCase();
  if (CONTROLLED_INNS.has(innLower)) {
    return { purchase_type: 'CONTROLLED', schedule_class: 'SCHEDULE_II', classification: 'SCHEDULE_II' };
  }
  if (RX_SECTIONS.has(sectionPrefix)) {
    return { purchase_type: 'PRESCRIPTION_ONLY', schedule_class: 'RX_ONLY', classification: 'PRESCRIPTION_ONLY' };
  }
  if (OTC_SECTIONS.has(sectionPrefix)) {
    return { purchase_type: 'OTC_GENERAL', schedule_class: 'OTC', classification: 'OTC_GENERAL' };
  }
  // Default: pharmacy-only for analgesics, respiratory, GI, etc.
  return { purchase_type: 'PHARMACY_ONLY', schedule_class: 'OTC', classification: 'PHARMACY_ONLY' };
}

// Pregnancy categories by section/type
function getPregnancyCategory(sectionPrefix, inn) {
  const innLower = inn.toLowerCase();
  // Known category X drugs
  if (['methotrexate', 'warfarin', 'isotretinoin', 'misoprostol', 'finasteride',
       'thalidomide', 'leflunomide', 'bosentan'].includes(innLower)) return 'X';
  // Known category D
  if (['phenytoin', 'valproic acid', 'carbamazepine', 'lithium', 'tetracycline',
       'doxycycline', 'cyclophosphamide'].includes(innLower)) return 'D';
  // Antineoplastics
  if (sectionPrefix === '9') return 'D';
  // Anticonvulsants
  if (sectionPrefix === '5') return 'D';
  // Most antibiotics are B or C
  if (['6.2', '6.3'].includes(sectionPrefix)) return 'B';
  // Cardiovascular generally C
  if (['12', '16'].includes(sectionPrefix)) return 'C';
  // Default
  return 'C';
}

// ╔══════════════════════════════════════════════════════════════════╗
// ║  SECTION 3: BRAND NAME DATABASE                                ║
// ╚══════════════════════════════════════════════════════════════════╝

// INN (lowercase) → [ {brand, manufacturer} ]
// Covers ~200 most commercially important medicines
const BRAND_DB = {
  'acetylsalicylic acid': [{b:'Aspirin',m:'Bayer AG'},{b:'Disprin',m:'Reckitt Benckiser'}],
  'aciclovir': [{b:'Zovirax',m:'GlaxoSmithKline'}],
  'albendazole': [{b:'Zentel',m:'GlaxoSmithKline'}],
  'amlodipine': [{b:'Norvasc',m:'Pfizer Inc.'},{b:'Amlovar',m:'Ranbaxy Laboratories'}],
  'amoxicillin': [{b:'Amoxil',m:'GlaxoSmithKline'}],
  'amoxicillin + clavulanic acid': [{b:'Augmentin',m:'GlaxoSmithKline'},{b:'Clavamox',m:'Pfizer Inc.'}],
  'artemether + lumefantrine': [{b:'Coartem',m:'Novartis International AG'}],
  'artesunate': [{b:'Artesiane',m:'Sanofi S.A.'}],
  'atenolol': [{b:'Tenormin',m:'AstraZeneca'}],
  'atorvastatin': [{b:'Lipitor',m:'Pfizer Inc.'}],
  'atropine': [{b:'Atropen',m:'Meridian Medical Technologies'}],
  'azithromycin': [{b:'Zithromax',m:'Pfizer Inc.'}],
  'beclometasone': [{b:'Becotide',m:'GlaxoSmithKline'},{b:'QVAR',m:'Teva Pharmaceutical Industries'}],
  'benzylpenicillin': [{b:'Crystapen',m:'Wockhardt'}],
  'bisoprolol': [{b:'Concor',m:'Merck & Co.'}],
  'budesonide': [{b:'Pulmicort',m:'AstraZeneca'},{b:'Rhinocort',m:'AstraZeneca'}],
  'bupivacaine': [{b:'Marcaine',m:'Aspen Pharmacare'}],
  'calcium gluconate': [{b:'Calcionate',m:'Hi-Tech Pharmacal'}],
  'captopril': [{b:'Capoten',m:'Bristol-Myers Squibb'}],
  'carbamazepine': [{b:'Tegretol',m:'Novartis International AG'}],
  'carvedilol': [{b:'Coreg',m:'GlaxoSmithKline'}],
  'ceftriaxone': [{b:'Rocephin',m:'Roche'}],
  'cetirizine': [{b:'Zyrtec',m:'Johnson & Johnson'}],
  'chloramphenicol': [{b:'Chloromycetin',m:'Pfizer Inc.'}],
  'chlorhexidine': [{b:'Savlon',m:'Johnson & Johnson'}],
  'chloroquine': [{b:'Aralen',m:'Sanofi S.A.'}],
  'chlorphenamine': [{b:'Piriton',m:'GlaxoSmithKline'}],
  'ciprofloxacin': [{b:'Cipro',m:'Bayer AG'},{b:'Ciproxin',m:'Bayer AG'}],
  'clarithromycin': [{b:'Biaxin',m:'AbbVie Inc.'},{b:'Klacid',m:'AbbVie Inc.'}],
  'clindamycin': [{b:'Dalacin',m:'Pfizer Inc.'},{b:'Cleocin',m:'Pfizer Inc.'}],
  'clomifene': [{b:'Clomid',m:'Sanofi S.A.'}],
  'clotrimazole': [{b:'Canesten',m:'Bayer AG'},{b:'Lotrimin',m:'Bayer AG'}],
  'cloxacillin': [{b:'Orbenin',m:'GlaxoSmithKline'}],
  'codeine': [{b:'Codeine Linctus',m:'Various'}],
  'dexamethasone': [{b:'Decadron',m:'Merck & Co.'}],
  'diazepam': [{b:'Valium',m:'Roche'}],
  'diclofenac': [{b:'Voltaren',m:'Novartis International AG'},{b:'Cataflam',m:'Novartis International AG'}],
  'digoxin': [{b:'Lanoxin',m:'Aspen Pharmacare'}],
  'diltiazem': [{b:'Cardizem',m:'AbbVie Inc.'}],
  'domperidone': [{b:'Motilium',m:'Johnson & Johnson'}],
  'doxycycline': [{b:'Vibramycin',m:'Pfizer Inc.'}],
  'enalapril': [{b:'Vasotec',m:'Merck & Co.'},{b:'Renitec',m:'Merck & Co.'}],
  'epinephrine': [{b:'EpiPen',m:'Mylan N.V.'}],
  'erythromycin': [{b:'Erythrocin',m:'AbbVie Inc.'}],
  'escitalopram': [{b:'Lexapro',m:'Bristol-Myers Squibb'},{b:'Cipralex',m:'Lundbeck'}],
  'ethinylestradiol + levonorgestrel': [{b:'Microgynon',m:'Bayer AG'},{b:'Alesse',m:'Pfizer Inc.'}],
  'fentanyl': [{b:'Duragesic',m:'Johnson & Johnson'}],
  'ferrous salt': [{b:'Ferrograd',m:'Teofarma'},{b:'Feroglobin',m:'Vitabiotics'}],
  'fluconazole': [{b:'Diflucan',m:'Pfizer Inc.'}],
  'fluoxetine': [{b:'Prozac',m:'Eli Lilly'}],
  'fluticasone': [{b:'Flixotide',m:'GlaxoSmithKline'},{b:'Flovent',m:'GlaxoSmithKline'}],
  'folic acid': [{b:'Folvite',m:'Pfizer Inc.'}],
  'furosemide': [{b:'Lasix',m:'Sanofi S.A.'}],
  'gabapentin': [{b:'Neurontin',m:'Pfizer Inc.'}],
  'gentamicin': [{b:'Garamycin',m:'Merck & Co.'}],
  'glibenclamide': [{b:'Daonil',m:'Sanofi S.A.'}],
  'gliclazide': [{b:'Diamicron',m:'Servier'}],
  'glimepiride': [{b:'Amaryl',m:'Sanofi S.A.'}],
  'haloperidol': [{b:'Haldol',m:'Johnson & Johnson'}],
  'heparin': [{b:'Heplock',m:'Baxter International'}],
  'hydralazine': [{b:'Apresoline',m:'Novartis International AG'}],
  'hydrochlorothiazide': [{b:'Esidrex',m:'Novartis International AG'}],
  'hydrocortisone': [{b:'Cortef',m:'Pfizer Inc.'},{b:'Solu-Cortef',m:'Pfizer Inc.'}],
  'hydroxychloroquine': [{b:'Plaquenil',m:'Sanofi S.A.'}],
  'hyoscine butylbromide': [{b:'Buscopan',m:'Sanofi S.A.'}],
  'ibuprofen': [{b:'Advil',m:'Pfizer Inc.'},{b:'Nurofen',m:'Reckitt Benckiser'},{b:'Brufen',m:'AbbVie Inc.'}],
  'insulin': [{b:'Humulin',m:'Eli Lilly'},{b:'NovoRapid',m:'Novo Nordisk'}],
  'ipratropium bromide': [{b:'Atrovent',m:'Boehringer Ingelheim'}],
  'iron': [{b:'Feroglobin',m:'Vitabiotics'}],
  'isoniazid': [{b:'Nydrazid',m:'Sandoz'}],
  'isosorbide dinitrate': [{b:'Isordil',m:'Valeant'}],
  'itraconazole': [{b:'Sporanox',m:'Johnson & Johnson'}],
  'ivermectin': [{b:'Mectizan',m:'Merck & Co.'},{b:'Stromectol',m:'Merck & Co.'}],
  'ketamine': [{b:'Ketalar',m:'Pfizer Inc.'}],
  'ketoconazole': [{b:'Nizoral',m:'Johnson & Johnson'}],
  'lamivudine': [{b:'Epivir',m:'GlaxoSmithKline'}],
  'lansoprazole': [{b:'Prevacid',m:'Takeda'}],
  'levodopa + carbidopa': [{b:'Sinemet',m:'Merck & Co.'},{b:'Madopar',m:'Roche'}],
  'levofloxacin': [{b:'Levaquin',m:'Johnson & Johnson'},{b:'Tavanic',m:'Sanofi S.A.'}],
  'levonorgestrel': [{b:'Plan B',m:'Foundation Consumer Healthcare'}],
  'levothyroxine': [{b:'Synthroid',m:'AbbVie Inc.'},{b:'Euthyrox',m:'Merck & Co.'}],
  'lidocaine': [{b:'Xylocaine',m:'AstraZeneca'}],
  'lisinopril': [{b:'Zestril',m:'AstraZeneca'},{b:'Prinivil',m:'Merck & Co.'}],
  'loperamide': [{b:'Imodium',m:'Johnson & Johnson'}],
  'loratadine': [{b:'Claritin',m:'Bayer AG'}],
  'losartan': [{b:'Cozaar',m:'Merck & Co.'}],
  'magnesium sulfate': [{b:'MagSul',m:'Various'}],
  'mebendazole': [{b:'Vermox',m:'Johnson & Johnson'}],
  'mefloquine': [{b:'Lariam',m:'Roche'}],
  'metformin': [{b:'Glucophage',m:'Merck & Co.'},{b:'Glycomet',m:'USV Ltd'}],
  'methotrexate': [{b:'Trexall',m:'Teva Pharmaceutical Industries'}],
  'methyldopa': [{b:'Aldomet',m:'Merck & Co.'}],
  'metoclopramide': [{b:'Maxolon',m:'Sanofi S.A.'},{b:'Reglan',m:'AbbVie Inc.'}],
  'metoprolol': [{b:'Lopressor',m:'Novartis International AG'},{b:'Betaloc',m:'AstraZeneca'}],
  'metronidazole': [{b:'Flagyl',m:'Sanofi S.A.'}],
  'miconazole': [{b:'Daktarin',m:'Johnson & Johnson'}],
  'misoprostol': [{b:'Cytotec',m:'Pfizer Inc.'}],
  'montelukast': [{b:'Singulair',m:'Merck & Co.'}],
  'morphine': [{b:'MS Contin',m:'Purdue Pharma'},{b:'MST Continus',m:'Mundipharma'}],
  'naproxen': [{b:'Aleve',m:'Bayer AG'},{b:'Naprosyn',m:'Roche'}],
  'nifedipine': [{b:'Adalat',m:'Bayer AG'},{b:'Procardia',m:'Pfizer Inc.'}],
  'nitrofurantoin': [{b:'Macrobid',m:'Procter & Gamble'}],
  'nitroglycerin': [{b:'Nitrostat',m:'Pfizer Inc.'}],
  'nystatin': [{b:'Mycostatin',m:'Bristol-Myers Squibb'}],
  'omeprazole': [{b:'Prilosec',m:'AstraZeneca'},{b:'Losec',m:'AstraZeneca'}],
  'ondansetron': [{b:'Zofran',m:'GlaxoSmithKline'}],
  'oral rehydration salts': [{b:'ORS',m:'WHO Standard'}],
  'oseltamivir': [{b:'Tamiflu',m:'Roche'}],
  'oxytocin': [{b:'Pitocin',m:'JHP Pharmaceuticals'}],
  'pantoprazole': [{b:'Protonix',m:'Pfizer Inc.'},{b:'Controloc',m:'Takeda'}],
  'paracetamol': [{b:'Panadol',m:'GlaxoSmithKline'},{b:'Tylenol',m:'Johnson & Johnson'}],
  'permethrin': [{b:'Elimite',m:'Allergan'},{b:'Nix',m:'Prestige Brands'}],
  'phenytoin': [{b:'Dilantin',m:'Pfizer Inc.'}],
  'pioglitazone': [{b:'Actos',m:'Takeda'}],
  'potassium chloride': [{b:'Slow-K',m:'Novartis International AG'}],
  'praziquantel': [{b:'Biltricide',m:'Bayer AG'}],
  'prednisolone': [{b:'Predsol',m:'Sanofi S.A.'},{b:'Prelone',m:'Teva Pharmaceutical Industries'}],
  'prednisone': [{b:'Deltasone',m:'Pfizer Inc.'}],
  'primaquine': [{b:'Primaquine',m:'Sanofi S.A.'}],
  'propranolol': [{b:'Inderal',m:'AstraZeneca'}],
  'pyrazinamide': [{b:'Pyrafat',m:'Fatol'}],
  'pyrimethamine': [{b:'Daraprim',m:'Turing Pharmaceuticals'}],
  'quinine': [{b:'Qualaquin',m:'AR Scientific'}],
  'rabeprazole': [{b:'Aciphex',m:'Johnson & Johnson'},{b:'Pariet',m:'Johnson & Johnson'}],
  'ranitidine': [{b:'Zantac',m:'GlaxoSmithKline'}],
  'retinol': [{b:'Aquasol A',m:'Mayne Pharma'}],
  'rifampicin': [{b:'Rifadin',m:'Sanofi S.A.'}],
  'risperidone': [{b:'Risperdal',m:'Johnson & Johnson'}],
  'ritonavir': [{b:'Norvir',m:'AbbVie Inc.'}],
  'salbutamol': [{b:'Ventolin',m:'GlaxoSmithKline'}],
  'sertraline': [{b:'Zoloft',m:'Pfizer Inc.'}],
  'silver sulfadiazine': [{b:'Silvadene',m:'Pfizer Inc.'}],
  'simvastatin': [{b:'Zocor',m:'Merck & Co.'}],
  'sodium valproate': [{b:'Epilim',m:'Sanofi S.A.'},{b:'Depakote',m:'AbbVie Inc.'}],
  'spironolactone': [{b:'Aldactone',m:'Pfizer Inc.'}],
  'sulfadiazine': [{b:'Sulfadiazine',m:'Various'}],
  'sulfamethoxazole + trimethoprim': [{b:'Bactrim',m:'Roche'},{b:'Septrin',m:'Aspen Pharmacare'}],
  'tamoxifen': [{b:'Nolvadex',m:'AstraZeneca'}],
  'terbinafine': [{b:'Lamisil',m:'Novartis International AG'}],
  'testosterone': [{b:'AndroGel',m:'AbbVie Inc.'}],
  'tetracycline': [{b:'Tetracyn',m:'Pfizer Inc.'}],
  'timolol': [{b:'Timoptic',m:'Merck & Co.'}],
  'tramadol': [{b:'Ultram',m:'Johnson & Johnson'}],
  'valproic acid': [{b:'Depakene',m:'AbbVie Inc.'}],
  'valsartan': [{b:'Diovan',m:'Novartis International AG'}],
  'vancomycin': [{b:'Vancocin',m:'AbbVie Inc.'}],
  'verapamil': [{b:'Calan',m:'Pfizer Inc.'},{b:'Isoptin',m:'AbbVie Inc.'}],
  'vitamin a': [{b:'Aquasol A',m:'Mayne Pharma'}],
  'warfarin': [{b:'Coumadin',m:'Bristol-Myers Squibb'}],
  'zidovudine': [{b:'Retrovir',m:'GlaxoSmithKline'}],
  'zinc sulfate': [{b:'Orazinc',m:'Mericon Industries'}],
};

// ╔══════════════════════════════════════════════════════════════════╗
// ║  SECTION 4: GENERIC MANUFACTURER MULTIPLIERS                   ║
// ╚══════════════════════════════════════════════════════════════════╝

// Manufacturers that produce generics, with relative probability weights
const GENERIC_MANUFACTURERS = [
  { name: 'Teva Pharmaceutical Industries', code: 'Teva', weight: 10 },
  { name: 'Cipla Limited', code: 'Cipla', weight: 9 },
  { name: 'Mylan N.V.', code: 'Mylan', weight: 9 },
  { name: 'Sun Pharmaceutical Industries', code: 'Sun', weight: 8 },
  { name: 'Sandoz (Novartis)', code: 'Sandoz', weight: 8 },
  { name: 'Aurobindo Pharma', code: 'Aurobindo', weight: 7 },
  { name: 'Dr. Reddy\'s Laboratories', code: 'DrReddys', weight: 7 },
  { name: 'Hikma Pharmaceuticals', code: 'Hikma', weight: 6 },
  { name: 'Lupin Limited', code: 'Lupin', weight: 6 },
  { name: 'Torrent Pharmaceuticals', code: 'Torrent', weight: 5 },
  { name: 'Glenmark Pharmaceuticals', code: 'Glenmark', weight: 5 },
  { name: 'Zydus Cadila', code: 'Zydus', weight: 5 },
  { name: 'Emzor Pharmaceutical Industries', code: 'Emzor', weight: 8 },  // Nigerian
  { name: 'Fidson Healthcare PLC', code: 'Fidson', weight: 6 },           // Nigerian
  { name: 'May & Baker Nigeria PLC', code: 'M&B', weight: 6 },            // Nigerian
  { name: 'Swiss Pharma Nigeria', code: 'Swiss', weight: 5 },              // Nigerian
  { name: 'Neimeth International', code: 'Neimeth', weight: 4 },           // Nigerian
  { name: 'GlaxoSmithKline Nigeria', code: 'GSKNig', weight: 5 },          // Nigerian
];

// How many manufacturer generics to create per INN, based on drug popularity
// Popular oral drugs get more, niche/injection drugs get fewer
function getManufacturerCount(sectionPrefix, whoForm, inn) {
  // Only tablets, capsules, and solutions get heavy generic coverage
  const oralForms = ['tablet', 'capsule', 'solution', 'syrup', 'suspension'];
  if (!oralForms.includes(whoForm)) return 1; // Only 1 manufacturer generic for non-oral

  // Common therapeutic areas get more generics
  const highGenericSections = ['2', '3', '6.2', '12', '16', '17', '24', '25'];
  if (highGenericSections.includes(sectionPrefix)) return 4;

  const medGenericSections = ['5', '6.1', '6.3', '6.5', '6.6', '13', '18', '26'];
  if (medGenericSections.includes(sectionPrefix)) return 3;

  return 2;
}

// Deterministic pick of manufacturers for a given INN (ensures consistency)
function pickManufacturers(inn, count) {
  // Use hash of INN to deterministically select manufacturers
  const hash = inn.split('').reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0);
  const sorted = [...GENERIC_MANUFACTURERS].sort((a, b) => {
    const ha = ((hash * 31 + a.code.charCodeAt(0)) | 0) % 1000;
    const hb = ((hash * 31 + b.code.charCodeAt(0)) | 0) % 1000;
    return hb - ha;
  });
  return sorted.slice(0, count);
}

// ╔══════════════════════════════════════════════════════════════════╗
// ║  SECTION 5: SUPPLEMENTARY OTC & SUPPLEMENT DATA                ║
// ╚══════════════════════════════════════════════════════════════════╝

const SUPPLEMENTARY_DRUGS = [
  // Common OTC analgesics not in WHO EML
  { name: 'Aspirin', generic_name: 'Acetylsalicylic Acid', strength: '300mg', form: 'TABLET', route: 'ORAL', categories: ['PAIN_RELIEF'], purchase_type: 'OTC_GENERAL', manufacturer: 'Bayer AG', pregnancy_category: 'D', atc_code: 'N02BA01' },
  { name: 'Aspirin', generic_name: 'Acetylsalicylic Acid', strength: '75mg', form: 'TABLET', route: 'ORAL', categories: ['CARDIOVASCULAR'], purchase_type: 'OTC_GENERAL', manufacturer: 'Bayer AG', pregnancy_category: 'D', atc_code: 'B01AC06' },
  { name: 'Excedrin', generic_name: 'Acetaminophen/Aspirin/Caffeine', strength: '250mg/250mg/65mg', form: 'TABLET', route: 'ORAL', categories: ['PAIN_RELIEF'], purchase_type: 'OTC_GENERAL', manufacturer: 'GlaxoSmithKline', pregnancy_category: 'C' },

  // Cough & Cold
  { name: 'Benylin Dry Cough', generic_name: 'Dextromethorphan', strength: '7.5mg/5ml', form: 'SYRUP', route: 'ORAL', categories: ['COLD_AND_FLU'], purchase_type: 'OTC_GENERAL', manufacturer: 'Johnson & Johnson' },
  { name: 'Robitussin', generic_name: 'Guaifenesin', strength: '100mg/5ml', form: 'SYRUP', route: 'ORAL', categories: ['COLD_AND_FLU'], purchase_type: 'OTC_GENERAL', manufacturer: 'Pfizer Inc.' },
  { name: 'Sudafed', generic_name: 'Pseudoephedrine', strength: '60mg', form: 'TABLET', route: 'ORAL', categories: ['COLD_AND_FLU'], purchase_type: 'OTC_RESTRICTED', manufacturer: 'Johnson & Johnson' },
  { name: 'Vicks VapoRub', generic_name: 'Camphor/Menthol/Eucalyptus', strength: '4.8%/2.6%/1.2%', form: 'OINTMENT', route: 'TOPICAL', categories: ['COLD_AND_FLU'], purchase_type: 'OTC_GENERAL', manufacturer: 'Procter & Gamble' },
  { name: 'Strepsils', generic_name: 'Dichlorobenzyl Alcohol/Amylmetacresol', strength: '1.2mg/0.6mg', form: 'LOZENGE', route: 'ORAL', categories: ['COLD_AND_FLU'], purchase_type: 'OTC_GENERAL', manufacturer: 'Reckitt Benckiser' },
  { name: 'Lemsip Max', generic_name: 'Paracetamol/Phenylephrine', strength: '1000mg/12.2mg', form: 'POWDER', route: 'ORAL', categories: ['COLD_AND_FLU'], purchase_type: 'OTC_GENERAL', manufacturer: 'Reckitt Benckiser' },

  // Digestive
  { name: 'Gaviscon', generic_name: 'Alginate/Sodium Bicarbonate', strength: '500mg/267mg per 10ml', form: 'SUSPENSION', route: 'ORAL', categories: ['DIGESTIVE_HEALTH'], purchase_type: 'OTC_GENERAL', manufacturer: 'Reckitt Benckiser' },
  { name: 'Pepto-Bismol', generic_name: 'Bismuth Subsalicylate', strength: '262mg/15ml', form: 'SUSPENSION', route: 'ORAL', categories: ['DIGESTIVE_HEALTH'], purchase_type: 'OTC_GENERAL', manufacturer: 'Procter & Gamble' },
  { name: 'Imodium', generic_name: 'Loperamide', strength: '2mg', form: 'CAPSULE', route: 'ORAL', categories: ['DIGESTIVE_HEALTH'], purchase_type: 'OTC_GENERAL', manufacturer: 'Johnson & Johnson' },
  { name: 'Buscopan', generic_name: 'Hyoscine Butylbromide', strength: '10mg', form: 'TABLET', route: 'ORAL', categories: ['DIGESTIVE_HEALTH'], purchase_type: 'PHARMACY_ONLY', manufacturer: 'Sanofi S.A.' },
  { name: 'Dulcolax', generic_name: 'Bisacodyl', strength: '5mg', form: 'TABLET', route: 'ORAL', categories: ['DIGESTIVE_HEALTH'], purchase_type: 'OTC_GENERAL', manufacturer: 'Sanofi S.A.' },
  { name: 'Senokot', generic_name: 'Senna', strength: '7.5mg', form: 'TABLET', route: 'ORAL', categories: ['DIGESTIVE_HEALTH'], purchase_type: 'OTC_GENERAL', manufacturer: 'Reckitt Benckiser' },

  // Allergy
  { name: 'Benadryl', generic_name: 'Diphenhydramine', strength: '25mg', form: 'TABLET', route: 'ORAL', categories: ['ALLERGIES'], purchase_type: 'OTC_GENERAL', manufacturer: 'Johnson & Johnson' },
  { name: 'Benadryl', generic_name: 'Diphenhydramine', strength: '12.5mg/5ml', form: 'SYRUP', route: 'ORAL', categories: ['ALLERGIES'], purchase_type: 'OTC_GENERAL', manufacturer: 'Johnson & Johnson' },
  { name: 'Telfast', generic_name: 'Fexofenadine', strength: '120mg', form: 'TABLET', route: 'ORAL', categories: ['ALLERGIES'], purchase_type: 'OTC_GENERAL', manufacturer: 'Sanofi S.A.' },
  { name: 'Telfast', generic_name: 'Fexofenadine', strength: '180mg', form: 'TABLET', route: 'ORAL', categories: ['ALLERGIES'], purchase_type: 'OTC_GENERAL', manufacturer: 'Sanofi S.A.' },

  // Skin care
  { name: 'Canesten', generic_name: 'Clotrimazole', strength: '1%', form: 'CREAM', route: 'TOPICAL', categories: ['SKIN_CARE', 'ANTIFUNGALS'], purchase_type: 'OTC_GENERAL', manufacturer: 'Bayer AG' },
  { name: 'Daktarin', generic_name: 'Miconazole', strength: '2%', form: 'CREAM', route: 'TOPICAL', categories: ['SKIN_CARE', 'ANTIFUNGALS'], purchase_type: 'OTC_GENERAL', manufacturer: 'Johnson & Johnson' },
  { name: 'Lamisil', generic_name: 'Terbinafine', strength: '1%', form: 'CREAM', route: 'TOPICAL', categories: ['SKIN_CARE', 'ANTIFUNGALS'], purchase_type: 'OTC_GENERAL', manufacturer: 'Novartis International AG' },
  { name: 'Hydrocortisone Cream', generic_name: 'Hydrocortisone', strength: '1%', form: 'CREAM', route: 'TOPICAL', categories: ['SKIN_CARE'], purchase_type: 'OTC_GENERAL', manufacturer: 'Johnson & Johnson' },
  { name: 'Calamine Lotion', generic_name: 'Calamine/Zinc Oxide', strength: '15%/5%', form: 'LOTION', route: 'TOPICAL', categories: ['SKIN_CARE'], purchase_type: 'OTC_GENERAL', manufacturer: 'Johnson & Johnson' },
  { name: 'Bepanthen', generic_name: 'Dexpanthenol', strength: '5%', form: 'CREAM', route: 'TOPICAL', categories: ['SKIN_CARE'], purchase_type: 'OTC_GENERAL', manufacturer: 'Bayer AG' },
  { name: 'Sudocrem', generic_name: 'Zinc Oxide/Lanolin', strength: '15.25%', form: 'CREAM', route: 'TOPICAL', categories: ['SKIN_CARE', 'CHILDREN_HEALTH'], purchase_type: 'OTC_GENERAL', manufacturer: 'Teva Pharmaceutical Industries' },
  { name: 'Betnovate', generic_name: 'Betamethasone Valerate', strength: '0.1%', form: 'CREAM', route: 'TOPICAL', categories: ['SKIN_CARE'], purchase_type: 'PRESCRIPTION_ONLY', manufacturer: 'GlaxoSmithKline' },
  { name: 'Betnovate', generic_name: 'Betamethasone Valerate', strength: '0.1%', form: 'OINTMENT', route: 'TOPICAL', categories: ['SKIN_CARE'], purchase_type: 'PRESCRIPTION_ONLY', manufacturer: 'GlaxoSmithKline' },
  { name: 'Fucidin', generic_name: 'Fusidic Acid', strength: '2%', form: 'CREAM', route: 'TOPICAL', categories: ['SKIN_CARE', 'ANTIBIOTICS'], purchase_type: 'PRESCRIPTION_ONLY', manufacturer: 'LEO Pharma' },

  // Eye care
  { name: 'Optrex Eye Drops', generic_name: 'Witch Hazel/Distilled Water', strength: '13%', form: 'DROPS', route: 'OPHTHALMIC', categories: ['EYE_CARE'], purchase_type: 'OTC_GENERAL', manufacturer: 'Reckitt Benckiser' },
  { name: 'Systane Ultra', generic_name: 'Polyethylene Glycol/Propylene Glycol', strength: '0.4%/0.3%', form: 'DROPS', route: 'OPHTHALMIC', categories: ['EYE_CARE'], purchase_type: 'OTC_GENERAL', manufacturer: 'Alcon' },
  { name: 'Visine', generic_name: 'Tetrahydrozoline', strength: '0.05%', form: 'DROPS', route: 'OPHTHALMIC', categories: ['EYE_CARE'], purchase_type: 'OTC_GENERAL', manufacturer: 'Johnson & Johnson' },

  // Ear care
  { name: 'Otex Ear Drops', generic_name: 'Urea Hydrogen Peroxide', strength: '5%', form: 'DROPS', route: 'OTIC', categories: ['EAR_CARE'], purchase_type: 'OTC_GENERAL', manufacturer: 'Diapharm' },
  { name: 'Sofradex', generic_name: 'Framycetin/Dexamethasone', strength: '5mg/0.5mg per ml', form: 'DROPS', route: 'OTIC', categories: ['EAR_CARE'], purchase_type: 'PRESCRIPTION_ONLY', manufacturer: 'Sanofi S.A.' },

  // Vitamins & Supplements
  { name: 'Vitamin C', generic_name: 'Ascorbic Acid', strength: '500mg', form: 'TABLET', route: 'ORAL', categories: ['VITAMINS_SUPPLEMENTS'], purchase_type: 'OTC_GENERAL', manufacturer: 'Various' },
  { name: 'Vitamin C', generic_name: 'Ascorbic Acid', strength: '1000mg', form: 'EFFERVESCENT', route: 'ORAL', categories: ['VITAMINS_SUPPLEMENTS'], purchase_type: 'OTC_GENERAL', manufacturer: 'Various' },
  { name: 'Vitamin D3', generic_name: 'Cholecalciferol', strength: '1000IU', form: 'TABLET', route: 'ORAL', categories: ['VITAMINS_SUPPLEMENTS'], purchase_type: 'OTC_GENERAL', manufacturer: 'Various' },
  { name: 'Vitamin D3', generic_name: 'Cholecalciferol', strength: '5000IU', form: 'CAPSULE', route: 'ORAL', categories: ['VITAMINS_SUPPLEMENTS'], purchase_type: 'OTC_GENERAL', manufacturer: 'Various' },
  { name: 'Vitamin B Complex', generic_name: 'B Vitamins', strength: 'Standard', form: 'TABLET', route: 'ORAL', categories: ['VITAMINS_SUPPLEMENTS'], purchase_type: 'OTC_GENERAL', manufacturer: 'Various' },
  { name: 'Vitamin B12', generic_name: 'Cyanocobalamin', strength: '1000mcg', form: 'TABLET', route: 'ORAL', categories: ['VITAMINS_SUPPLEMENTS'], purchase_type: 'OTC_GENERAL', manufacturer: 'Various' },
  { name: 'Vitamin E', generic_name: 'Alpha-Tocopherol', strength: '400IU', form: 'CAPSULE', route: 'ORAL', categories: ['VITAMINS_SUPPLEMENTS'], purchase_type: 'OTC_GENERAL', manufacturer: 'Various' },
  { name: 'Omega-3 Fish Oil', generic_name: 'EPA/DHA', strength: '1000mg', form: 'CAPSULE', route: 'ORAL', categories: ['VITAMINS_SUPPLEMENTS'], purchase_type: 'OTC_GENERAL', manufacturer: 'Various' },
  { name: 'Calcium + Vitamin D', generic_name: 'Calcium Carbonate/Cholecalciferol', strength: '500mg/400IU', form: 'TABLET', route: 'ORAL', categories: ['VITAMINS_SUPPLEMENTS'], purchase_type: 'OTC_GENERAL', manufacturer: 'Various' },
  { name: 'Magnesium', generic_name: 'Magnesium Citrate', strength: '200mg', form: 'TABLET', route: 'ORAL', categories: ['VITAMINS_SUPPLEMENTS'], purchase_type: 'OTC_GENERAL', manufacturer: 'Various' },
  { name: 'Iron + Folic Acid', generic_name: 'Ferrous Fumarate/Folic Acid', strength: '200mg/0.4mg', form: 'TABLET', route: 'ORAL', categories: ['VITAMINS_SUPPLEMENTS'], purchase_type: 'OTC_GENERAL', manufacturer: 'Various' },
  { name: 'Centrum Multivitamin', generic_name: 'Multivitamin/Mineral', strength: 'Complete', form: 'TABLET', route: 'ORAL', categories: ['VITAMINS_SUPPLEMENTS'], purchase_type: 'OTC_GENERAL', manufacturer: 'GlaxoSmithKline' },
  { name: 'Pregnacare', generic_name: 'Prenatal Vitamins', strength: 'Standard', form: 'TABLET', route: 'ORAL', categories: ['VITAMINS_SUPPLEMENTS', 'WOMENS_HEALTH'], purchase_type: 'OTC_GENERAL', manufacturer: 'Vitabiotics' },
  { name: 'Seven Seas Cod Liver Oil', generic_name: 'Cod Liver Oil', strength: '1000mg', form: 'CAPSULE', route: 'ORAL', categories: ['VITAMINS_SUPPLEMENTS'], purchase_type: 'OTC_GENERAL', manufacturer: 'Merck & Co.' },
  { name: 'Probiotics', generic_name: 'Lactobacillus/Bifidobacterium', strength: '10 Billion CFU', form: 'CAPSULE', route: 'ORAL', categories: ['VITAMINS_SUPPLEMENTS', 'DIGESTIVE_HEALTH'], purchase_type: 'OTC_GENERAL', manufacturer: 'Various' },
  { name: 'Glucosamine', generic_name: 'Glucosamine Sulfate', strength: '1500mg', form: 'TABLET', route: 'ORAL', categories: ['VITAMINS_SUPPLEMENTS'], purchase_type: 'OTC_GENERAL', manufacturer: 'Various' },
  { name: 'Coenzyme Q10', generic_name: 'Ubiquinone', strength: '100mg', form: 'CAPSULE', route: 'ORAL', categories: ['VITAMINS_SUPPLEMENTS'], purchase_type: 'OTC_GENERAL', manufacturer: 'Various' },
  { name: 'Turmeric Curcumin', generic_name: 'Curcumin', strength: '500mg', form: 'CAPSULE', route: 'ORAL', categories: ['VITAMINS_SUPPLEMENTS'], purchase_type: 'OTC_GENERAL', manufacturer: 'Various' },
  { name: 'Biotin', generic_name: 'Vitamin B7', strength: '5000mcg', form: 'TABLET', route: 'ORAL', categories: ['VITAMINS_SUPPLEMENTS'], purchase_type: 'OTC_GENERAL', manufacturer: 'Various' },

  // Oral care
  { name: 'Corsodyl Mouthwash', generic_name: 'Chlorhexidine', strength: '0.2%', form: 'SOLUTION', route: 'ORAL', categories: ['ORAL_CARE'], purchase_type: 'OTC_GENERAL', manufacturer: 'GlaxoSmithKline' },
  { name: 'Bonjela', generic_name: 'Choline Salicylate', strength: '8.7%', form: 'GEL', route: 'ORAL', categories: ['ORAL_CARE'], purchase_type: 'OTC_GENERAL', manufacturer: 'Reckitt Benckiser' },

  // Smoking cessation
  { name: 'Nicorette Gum', generic_name: 'Nicotine', strength: '2mg', form: 'LOZENGE', route: 'ORAL', categories: ['SMOKING_CESSATION'], purchase_type: 'OTC_GENERAL', manufacturer: 'Johnson & Johnson' },
  { name: 'Nicorette Gum', generic_name: 'Nicotine', strength: '4mg', form: 'LOZENGE', route: 'ORAL', categories: ['SMOKING_CESSATION'], purchase_type: 'OTC_GENERAL', manufacturer: 'Johnson & Johnson' },
  { name: 'Nicotine Patch', generic_name: 'Nicotine', strength: '21mg/24hr', form: 'PATCH', route: 'TRANSDERMAL', categories: ['SMOKING_CESSATION'], purchase_type: 'OTC_GENERAL', manufacturer: 'GlaxoSmithKline' },
  { name: 'Nicotine Patch', generic_name: 'Nicotine', strength: '14mg/24hr', form: 'PATCH', route: 'TRANSDERMAL', categories: ['SMOKING_CESSATION'], purchase_type: 'OTC_GENERAL', manufacturer: 'GlaxoSmithKline' },

  // First Aid
  { name: 'Savlon Cream', generic_name: 'Chlorhexidine/Cetrimide', strength: '0.1%/0.5%', form: 'CREAM', route: 'TOPICAL', categories: ['FIRST_AID'], purchase_type: 'OTC_GENERAL', manufacturer: 'Johnson & Johnson' },
  { name: 'Dettol Antiseptic', generic_name: 'Chloroxylenol', strength: '4.8%', form: 'SOLUTION', route: 'TOPICAL', categories: ['FIRST_AID'], purchase_type: 'OTC_GENERAL', manufacturer: 'Reckitt Benckiser' },
  { name: 'Burnol', generic_name: 'Aminacrine/Cetrimide', strength: '0.1%/0.5%', form: 'CREAM', route: 'TOPICAL', categories: ['FIRST_AID'], purchase_type: 'OTC_GENERAL', manufacturer: 'Dr. Morepen' },

  // Sexual Health
  { name: 'Postinor-2', generic_name: 'Levonorgestrel', strength: '0.75mg', form: 'TABLET', route: 'ORAL', categories: ['EMERGENCY_CONTRACEPTION', 'WOMENS_HEALTH'], purchase_type: 'OTC_RESTRICTED', manufacturer: 'Gedeon Richter' },
  { name: 'Microgynon 30', generic_name: 'Ethinylestradiol/Levonorgestrel', strength: '0.03mg/0.15mg', form: 'TABLET', route: 'ORAL', categories: ['WOMENS_HEALTH'], purchase_type: 'PRESCRIPTION_ONLY', manufacturer: 'Bayer AG' },

  // Sleep
  { name: 'Nytol', generic_name: 'Diphenhydramine', strength: '25mg', form: 'TABLET', route: 'ORAL', categories: ['SLEEP_AIDS'], purchase_type: 'OTC_GENERAL', manufacturer: 'GlaxoSmithKline' },
  { name: 'Melatonin', generic_name: 'Melatonin', strength: '3mg', form: 'TABLET', route: 'ORAL', categories: ['SLEEP_AIDS'], purchase_type: 'OTC_GENERAL', manufacturer: 'Various' },
  { name: 'Melatonin', generic_name: 'Melatonin', strength: '5mg', form: 'TABLET', route: 'ORAL', categories: ['SLEEP_AIDS'], purchase_type: 'OTC_GENERAL', manufacturer: 'Various' },

  // Weight management
  { name: 'Orlistat', generic_name: 'Orlistat', strength: '60mg', form: 'CAPSULE', route: 'ORAL', categories: ['WEIGHT_MANAGEMENT'], purchase_type: 'PHARMACY_ONLY', manufacturer: 'GlaxoSmithKline' },
  { name: 'Orlistat', generic_name: 'Orlistat', strength: '120mg', form: 'CAPSULE', route: 'ORAL', categories: ['WEIGHT_MANAGEMENT'], purchase_type: 'PRESCRIPTION_ONLY', manufacturer: 'Roche' },

  // Men's health
  { name: 'Viagra', generic_name: 'Sildenafil', strength: '50mg', form: 'TABLET', route: 'ORAL', categories: ['MENS_HEALTH', 'SEXUAL_HEALTH'], purchase_type: 'PRESCRIPTION_ONLY', manufacturer: 'Pfizer Inc.', atc_code: 'G04BE03' },
  { name: 'Viagra', generic_name: 'Sildenafil', strength: '100mg', form: 'TABLET', route: 'ORAL', categories: ['MENS_HEALTH', 'SEXUAL_HEALTH'], purchase_type: 'PRESCRIPTION_ONLY', manufacturer: 'Pfizer Inc.', atc_code: 'G04BE03' },
  { name: 'Cialis', generic_name: 'Tadalafil', strength: '10mg', form: 'TABLET', route: 'ORAL', categories: ['MENS_HEALTH', 'SEXUAL_HEALTH'], purchase_type: 'PRESCRIPTION_ONLY', manufacturer: 'Eli Lilly', atc_code: 'G04BE08' },
  { name: 'Cialis', generic_name: 'Tadalafil', strength: '20mg', form: 'TABLET', route: 'ORAL', categories: ['MENS_HEALTH', 'SEXUAL_HEALTH'], purchase_type: 'PRESCRIPTION_ONLY', manufacturer: 'Eli Lilly', atc_code: 'G04BE08' },
  { name: 'Finasteride', generic_name: 'Finasteride', strength: '1mg', form: 'TABLET', route: 'ORAL', categories: ['MENS_HEALTH'], purchase_type: 'PRESCRIPTION_ONLY', manufacturer: 'Merck & Co.', atc_code: 'D11AX10' },
  { name: 'Propecia', generic_name: 'Finasteride', strength: '1mg', form: 'TABLET', route: 'ORAL', categories: ['MENS_HEALTH'], purchase_type: 'PRESCRIPTION_ONLY', manufacturer: 'Merck & Co.', atc_code: 'D11AX10' },

  // Nigerian-popular drugs
  { name: 'Lonart', generic_name: 'Artemether/Lumefantrine', strength: '20mg/120mg', form: 'TABLET', route: 'ORAL', categories: ['ANTIBIOTICS'], purchase_type: 'PRESCRIPTION_ONLY', manufacturer: 'Bliss GVS Pharma' },
  { name: 'Coartem', generic_name: 'Artemether/Lumefantrine', strength: '20mg/120mg', form: 'TABLET', route: 'ORAL', categories: ['ANTIBIOTICS'], purchase_type: 'PRESCRIPTION_ONLY', manufacturer: 'Novartis International AG' },
  { name: 'Artesunate', generic_name: 'Artesunate', strength: '50mg', form: 'TABLET', route: 'ORAL', categories: ['ANTIBIOTICS'], purchase_type: 'PRESCRIPTION_ONLY', manufacturer: 'Emzor Pharmaceutical Industries' },
  { name: 'Fansidar', generic_name: 'Sulfadoxine/Pyrimethamine', strength: '500mg/25mg', form: 'TABLET', route: 'ORAL', categories: ['ANTIBIOTICS'], purchase_type: 'PRESCRIPTION_ONLY', manufacturer: 'Roche' },
  { name: 'Flagyl', generic_name: 'Metronidazole', strength: '200mg', form: 'TABLET', route: 'ORAL', categories: ['ANTIBIOTICS'], purchase_type: 'PRESCRIPTION_ONLY', manufacturer: 'Sanofi S.A.' },
  { name: 'Flagyl', generic_name: 'Metronidazole', strength: '400mg', form: 'TABLET', route: 'ORAL', categories: ['ANTIBIOTICS'], purchase_type: 'PRESCRIPTION_ONLY', manufacturer: 'Sanofi S.A.' },
  { name: 'Emzor Paracetamol', generic_name: 'Paracetamol', strength: '500mg', form: 'TABLET', route: 'ORAL', categories: ['PAIN_RELIEF'], purchase_type: 'OTC_GENERAL', manufacturer: 'Emzor Pharmaceutical Industries' },
  { name: 'M&B Paracetamol', generic_name: 'Paracetamol', strength: '500mg', form: 'TABLET', route: 'ORAL', categories: ['PAIN_RELIEF'], purchase_type: 'OTC_GENERAL', manufacturer: 'May & Baker Nigeria PLC' },
  { name: 'Gestid', generic_name: 'Aluminium Hydroxide/Magnesium Trisilicate', strength: '250mg/500mg', form: 'TABLET', route: 'ORAL', categories: ['DIGESTIVE_HEALTH'], purchase_type: 'OTC_GENERAL', manufacturer: 'GlaxoSmithKline Nigeria' },
];

// ╔══════════════════════════════════════════════════════════════════╗
// ║  SECTION 6: SAFETY DATA TEMPLATES BY CATEGORY                  ║
// ╚══════════════════════════════════════════════════════════════════╝

const SAFETY_TEMPLATES = {
  PAIN_RELIEF: {
    side_effects: ['Nausea', 'Headache', 'Dizziness', 'Stomach upset', 'Constipation'],
    contraindications: ['Known hypersensitivity to active ingredient', 'Severe hepatic impairment', 'Active GI bleeding'],
    warnings: ['Do not exceed recommended dose', 'Avoid alcohol consumption', 'May cause drowsiness'],
    precautions: ['Use with caution in elderly patients', 'Monitor renal function with prolonged use', 'Avoid in pregnancy unless clearly needed'],
  },
  ANTIBIOTICS: {
    side_effects: ['Nausea', 'Diarrhoea', 'Abdominal pain', 'Rash', 'Headache', 'Vomiting'],
    contraindications: ['Known hypersensitivity to drug class', 'History of severe allergic reaction to related antibiotics'],
    warnings: ['Complete full course of treatment', 'May reduce effectiveness of oral contraceptives', 'Risk of Clostridium difficile colitis'],
    precautions: ['Adjust dose in renal impairment', 'Monitor hepatic function', 'Use with caution in pregnancy'],
  },
  ANTIFUNGALS: {
    side_effects: ['Nausea', 'Abdominal pain', 'Headache', 'Skin rash', 'Elevated liver enzymes'],
    contraindications: ['Known hypersensitivity', 'Co-administration with certain CYP3A4 substrates', 'Severe hepatic disease'],
    warnings: ['Monitor liver function tests', 'Multiple drug interactions possible', 'Discontinue if signs of hepatotoxicity'],
    precautions: ['Adjust dose in renal impairment', 'Check for drug interactions', 'Use in pregnancy only if benefit outweighs risk'],
  },
  ANTIVIRALS: {
    side_effects: ['Nausea', 'Headache', 'Fatigue', 'Diarrhoea', 'Insomnia', 'Rash'],
    contraindications: ['Known hypersensitivity', 'Severe hepatic impairment'],
    warnings: ['Monitor for immune reconstitution syndrome', 'Check for drug interactions', 'Regular blood monitoring required'],
    precautions: ['Adjust dose in renal impairment', 'Monitor hepatic function', 'Ensure adequate hydration'],
  },
  CARDIOVASCULAR: {
    side_effects: ['Dizziness', 'Hypotension', 'Fatigue', 'Headache', 'Oedema', 'Bradycardia'],
    contraindications: ['Severe hypotension', 'Cardiogenic shock', 'Known hypersensitivity'],
    warnings: ['Do not discontinue abruptly', 'Monitor blood pressure regularly', 'May cause first-dose hypotension'],
    precautions: ['Adjust dose in renal impairment', 'Monitor electrolytes', 'Use caution in elderly patients'],
  },
  DIABETES: {
    side_effects: ['Hypoglycaemia', 'Nausea', 'Diarrhoea', 'Weight changes', 'Abdominal discomfort'],
    contraindications: ['Type 1 diabetes (for oral agents)', 'Diabetic ketoacidosis', 'Severe renal impairment'],
    warnings: ['Monitor blood glucose regularly', 'Risk of lactic acidosis (metformin)', 'Adjust dose during illness'],
    precautions: ['Take with food to reduce GI effects', 'Regular HbA1c monitoring', 'Adjust in hepatic/renal impairment'],
  },
  MENTAL_HEALTH: {
    side_effects: ['Drowsiness', 'Dry mouth', 'Weight gain', 'Dizziness', 'Nausea', 'Insomnia'],
    contraindications: ['Known hypersensitivity', 'Concurrent MAOI use', 'Uncontrolled epilepsy'],
    warnings: ['May increase suicidal thinking in young adults', 'Do not discontinue abruptly', 'Avoid alcohol'],
    precautions: ['Gradual dose titration recommended', 'Monitor mood and behaviour', 'Use caution in elderly'],
  },
  RESPIRATORY: {
    side_effects: ['Tremor', 'Headache', 'Tachycardia', 'Throat irritation', 'Cough'],
    contraindications: ['Known hypersensitivity to active ingredient'],
    warnings: ['Do not exceed recommended dose', 'Seek medical attention if symptoms worsen', 'Rinse mouth after inhaled corticosteroids'],
    precautions: ['Monitor heart rate', 'Use spacer device with inhalers where possible', 'Regular review of inhaler technique'],
  },
  DIGESTIVE_HEALTH: {
    side_effects: ['Nausea', 'Constipation', 'Diarrhoea', 'Abdominal pain', 'Flatulence', 'Headache'],
    contraindications: ['Known hypersensitivity', 'Bowel obstruction'],
    warnings: ['Long-term PPI use may increase fracture risk', 'May mask symptoms of gastric cancer'],
    precautions: ['Use lowest effective dose', 'Review need for continued treatment', 'Monitor magnesium levels with prolonged PPI use'],
  },
  ALLERGIES: {
    side_effects: ['Drowsiness', 'Dry mouth', 'Headache', 'Fatigue', 'Nausea'],
    contraindications: ['Known hypersensitivity', 'Severe hepatic impairment'],
    warnings: ['May impair ability to drive (first-generation)', 'Avoid alcohol', 'Use caution with CNS depressants'],
    precautions: ['Adjust dose in renal impairment', 'Use non-sedating antihistamines where possible', 'Avoid in glaucoma (some agents)'],
  },
  HORMONES: {
    side_effects: ['Weight gain', 'Mood changes', 'Fluid retention', 'Increased appetite', 'Insomnia'],
    contraindications: ['Known hypersensitivity', 'Systemic fungal infections (corticosteroids)', 'Undiagnosed vaginal bleeding'],
    warnings: ['Do not discontinue corticosteroids abruptly', 'May increase infection risk', 'Monitor blood glucose'],
    precautions: ['Gradual dose reduction when stopping', 'Regular bone density monitoring', 'Use lowest effective dose'],
  },
  SKIN_CARE: {
    side_effects: ['Local irritation', 'Burning sensation', 'Dryness', 'Redness', 'Itching'],
    contraindications: ['Known hypersensitivity to active ingredient', 'Application to infected/broken skin (corticosteroids)'],
    warnings: ['For external use only', 'Avoid contact with eyes', 'Do not use on large areas for prolonged periods'],
    precautions: ['Apply thinly to affected area', 'Wash hands after application', 'Monitor for skin thinning with corticosteroids'],
  },
  EYE_CARE: {
    side_effects: ['Transient stinging', 'Blurred vision', 'Eye irritation', 'Tearing'],
    contraindications: ['Known hypersensitivity', 'Soft contact lens wear (some preparations)'],
    warnings: ['Do not touch dropper tip to eye', 'Discard within 28 days of opening', 'Remove contact lenses before use'],
    precautions: ['Wait 5 minutes between different eye drops', 'Store as directed', 'Check expiry date before use'],
  },
  EAR_CARE: {
    side_effects: ['Local irritation', 'Temporary hearing changes', 'Dizziness'],
    contraindications: ['Perforated eardrum', 'Known hypersensitivity'],
    warnings: ['Do not use if ear is draining', 'Warm drops to body temperature before use'],
    precautions: ['Complete full course of treatment', 'Avoid getting water in ear during treatment'],
  },
  VITAMINS_SUPPLEMENTS: {
    side_effects: ['Nausea', 'Stomach upset', 'Constipation (iron)', 'Metallic taste'],
    contraindications: ['Known hypersensitivity', 'Hypercalcaemia (vitamin D)', 'Iron overload disorders (iron)'],
    warnings: ['Do not exceed recommended daily intake', 'Keep out of reach of children'],
    precautions: ['Take with food to reduce stomach upset', 'May interact with certain medications', 'Inform healthcare provider of all supplements'],
  },
  OTHER: {
    side_effects: ['Nausea', 'Headache', 'Dizziness', 'Fatigue'],
    contraindications: ['Known hypersensitivity to active ingredient'],
    warnings: ['Use as directed by healthcare professional', 'Report any unusual side effects'],
    precautions: ['Follow prescribed dose and duration', 'Inform doctor of all other medications'],
  },
  FIRST_AID: {
    side_effects: ['Local irritation', 'Skin sensitisation'],
    contraindications: ['Known hypersensitivity'],
    warnings: ['For external use only', 'Avoid contact with eyes and mucous membranes'],
    precautions: ['Clean wound before application', 'Seek medical attention for deep wounds'],
  },
  WOMENS_HEALTH: {
    side_effects: ['Nausea', 'Breast tenderness', 'Headache', 'Mood changes', 'Irregular bleeding'],
    contraindications: ['Known/suspected pregnancy', 'Undiagnosed vaginal bleeding', 'History of DVT/PE'],
    warnings: ['Increased risk of thromboembolism', 'Regular check-ups recommended'],
    precautions: ['Report unusual symptoms immediately', 'Discuss family history with healthcare provider'],
  },
  MENS_HEALTH: {
    side_effects: ['Headache', 'Flushing', 'Dyspepsia', 'Nasal congestion', 'Dizziness'],
    contraindications: ['Co-administration with nitrates', 'Severe cardiovascular disease', 'Known hypersensitivity'],
    warnings: ['Seek medical attention for prolonged erection', 'Not for use with recreational drugs'],
    precautions: ['Start with lowest effective dose', 'Report vision/hearing changes immediately'],
  },
  SLEEP_AIDS: {
    side_effects: ['Drowsiness', 'Dizziness', 'Headache', 'Dry mouth', 'Morning grogginess'],
    contraindications: ['Known hypersensitivity', 'Severe respiratory insufficiency', 'Sleep apnoea syndrome'],
    warnings: ['May impair next-day activities', 'Avoid alcohol', 'Risk of dependence with prolonged use'],
    precautions: ['Use lowest effective dose', 'Short-term use recommended', 'Avoid in elderly if possible'],
  },
  SMOKING_CESSATION: {
    side_effects: ['Mouth/throat irritation', 'Hiccups', 'Nausea', 'Headache', 'Skin irritation (patches)'],
    contraindications: ['Non-smokers', 'Recent cardiovascular event'],
    warnings: ['Continue to reduce nicotine dose', 'Do not smoke while using NRT'],
    precautions: ['Rotate patch site daily', 'Seek support for best results'],
  },
  WEIGHT_MANAGEMENT: {
    side_effects: ['Oily stools', 'Flatulence', 'Faecal urgency', 'Abdominal pain'],
    contraindications: ['Chronic malabsorption', 'Cholestasis', 'Pregnancy'],
    warnings: ['May reduce absorption of fat-soluble vitamins', 'Follow low-fat diet'],
    precautions: ['Take multivitamin supplement', 'Monitor for signs of liver injury'],
  },
  EMERGENCY_CONTRACEPTION: {
    side_effects: ['Nausea', 'Vomiting', 'Headache', 'Irregular bleeding', 'Fatigue'],
    contraindications: ['Known pregnancy', 'Known hypersensitivity'],
    warnings: ['Not for regular contraception', 'Less effective with increasing body weight', 'Does not protect against STIs'],
    precautions: ['Take as soon as possible after unprotected intercourse', 'Seek medical advice if vomiting within 2 hours'],
  },
  SEXUAL_HEALTH: {
    side_effects: ['Headache', 'Flushing', 'Dyspepsia', 'Nasal congestion'],
    contraindications: ['Co-administration with nitrates', 'Severe cardiovascular disease'],
    warnings: ['Seek immediate medical attention for priapism'],
    precautions: ['Start with lowest effective dose', 'Use caution in hepatic impairment'],
  },
  ORAL_CARE: {
    side_effects: ['Taste disturbance', 'Tongue discolouration', 'Mouth irritation'],
    contraindications: ['Known hypersensitivity'],
    warnings: ['Do not swallow mouthwash', 'For oral use only'],
    precautions: ['Use as directed', 'Dilute if recommended'],
  },
  CHILDREN_HEALTH: {
    side_effects: ['Nausea', 'Diarrhoea', 'Rash', 'Irritability'],
    contraindications: ['Known hypersensitivity', 'Age restrictions as specified'],
    warnings: ['Keep out of reach of children', 'Use age-appropriate formulations'],
    precautions: ['Verify dose for weight/age', 'Monitor for adverse reactions'],
  },
  MEDICAL_DEVICES: {
    side_effects: ['Local irritation'],
    contraindications: ['Known hypersensitivity to components'],
    warnings: ['For professional use only where specified'],
    precautions: ['Follow manufacturer instructions'],
  },
};

// ╔══════════════════════════════════════════════════════════════════╗
// ║  SECTION 7: PRICE GENERATION                                   ║
// ╚══════════════════════════════════════════════════════════════════╝

// Base price ranges by section type (NGN)
const PRICE_TIERS = {
  // Section prefix → { costMin, costMax, marginMin, marginMax }
  '1':    { costMin: 2000, costMax: 25000, marginMin: 1.3, marginMax: 1.8 },  // Anaesthetics
  '2':    { costMin: 100, costMax: 5000, marginMin: 1.3, marginMax: 2.0 },    // Analgesics
  '3':    { costMin: 200, costMax: 3000, marginMin: 1.3, marginMax: 1.8 },    // Anti-allergics
  '6.2':  { costMin: 300, costMax: 8000, marginMin: 1.3, marginMax: 1.7 },    // Antibacterials
  '6.3':  { costMin: 500, costMax: 10000, marginMin: 1.3, marginMax: 1.8 },   // Antifungals
  '6.4':  { costMin: 1000, costMax: 30000, marginMin: 1.2, marginMax: 1.5 },  // Antivirals
  '6.5':  { costMin: 200, costMax: 5000, marginMin: 1.3, marginMax: 1.8 },    // Antimalarials
  '9':    { costMin: 5000, costMax: 100000, marginMin: 1.15, marginMax: 1.4 }, // Antineoplastic
  '12':   { costMin: 300, costMax: 8000, marginMin: 1.3, marginMax: 1.7 },    // Cardiovascular
  '13':   { costMin: 200, costMax: 5000, marginMin: 1.4, marginMax: 2.0 },    // Dermatological
  '16':   { costMin: 200, costMax: 5000, marginMin: 1.3, marginMax: 1.7 },    // Diuretics
  '17':   { costMin: 200, costMax: 6000, marginMin: 1.3, marginMax: 1.8 },    // Gastrointestinal
  '18':   { costMin: 500, costMax: 15000, marginMin: 1.3, marginMax: 1.7 },   // Hormones
  '24':   { costMin: 300, costMax: 10000, marginMin: 1.3, marginMax: 1.7 },   // Psychotherapeutic
  '25':   { costMin: 300, costMax: 8000, marginMin: 1.3, marginMax: 1.8 },    // Respiratory
  '26':   { costMin: 100, costMax: 3000, marginMin: 1.4, marginMax: 2.5 },    // Vitamins
};
const DEFAULT_PRICE_TIER = { costMin: 300, costMax: 8000, marginMin: 1.3, marginMax: 1.7 };

// Simple seeded random for reproducibility
function seededRandom(seed) {
  let x = seed;
  return function() {
    x = (x * 1103515245 + 12345) & 0x7fffffff;
    return x / 0x7fffffff;
  };
}

function generatePrice(drugName, strength, sectionPrefix, isBrand) {
  const hash = (drugName + strength).split('').reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0);
  const rng = seededRandom(Math.abs(hash));

  const tier = PRICE_TIERS[sectionPrefix] || DEFAULT_PRICE_TIER;
  let cost = tier.costMin + rng() * (tier.costMax - tier.costMin);

  // Brands cost more
  if (isBrand) cost *= 1.3;

  // Generics are cheaper
  const margin = tier.marginMin + rng() * (tier.marginMax - tier.marginMin);
  let selling = cost * margin;

  // Round to nearest 10
  cost = Math.round(cost / 10) * 10;
  selling = Math.round(selling / 10) * 10;
  if (selling <= cost) selling = cost + 50;

  return { cost_price: cost, selling_price: selling };
}

// ╔══════════════════════════════════════════════════════════════════╗
// ║  SECTION 8: DRUG GENERATION ENGINE                             ║
// ╚══════════════════════════════════════════════════════════════════╝

function titleCase(str) {
  return str.replace(/\b\w/g, c => c.toUpperCase());
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

function buildDrugDoc(params, refData) {
  const {
    name, generic_name, strength, formCode, routeCode, categoryCodes,
    purchase_type, schedule_class, classificationCode,
    manufacturer, pregnancy_category, atc_code, sectionPrefix,
    isBrand, description, indication, list_type
  } = params;

  const formId = refData.forms[formCode];
  const routeId = refData.routes[routeCode];
  const classificationId = refData.classifications[classificationCode];
  if (!formId || !routeId) return null; // Skip if no mapping

  const categoryIds = categoryCodes
    .map(c => refData.categories[c])
    .filter(Boolean);
  if (categoryIds.length === 0) categoryIds.push(refData.categories['OTHER']);

  const primaryCategory = categoryCodes[0] || 'OTHER';
  const safety = SAFETY_TEMPLATES[primaryCategory] || SAFETY_TEMPLATES.OTHER;
  const prices = generatePrice(name, strength, sectionPrefix, isBrand);

  // Dosage guidance
  const dosageGuidance = {
    adult: { dose: 'As directed by healthcare professional', frequency: 'As prescribed', max_daily: 'Do not exceed prescribed dose', notes: '' },
    pediatric: { dose: 'As directed by healthcare professional', frequency: 'Weight/age-adjusted dosing', max_daily: 'Do not exceed prescribed dose', notes: 'Use age-appropriate formulation' },
    elderly: { dose: 'Start with lower dose', frequency: 'As prescribed', max_daily: 'Monitor closely', notes: 'Dose adjustment may be required' },
  };

  return {
    name,
    generic_name: generic_name || name,
    brand_name: isBrand ? name : null,
    manufacturer: manufacturer || null,
    description: description || `${name} ${strength} - ${titleCase(formCode.toLowerCase())} for ${routeCode.toLowerCase()} administration.`,
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
    atc_code: atc_code || null,
    cost_price: prices.cost_price,
    selling_price: prices.selling_price,
    quantity: generateQuantity(purchase_type),
    pack_size: formCode === 'TABLET' || formCode === 'CAPSULE' ? (purchase_type === 'OTC_GENERAL' ? 30 : 28) : 1,
    unit_of_measure: ['TABLET', 'CAPSULE', 'LOZENGE', 'CHEWABLE', 'EFFERVESCENT'].includes(formCode) ? 'tablets' :
                     ['SYRUP', 'SOLUTION', 'SUSPENSION'].includes(formCode) ? 'ml' :
                     ['CREAM', 'OINTMENT', 'GEL', 'LOTION'].includes(formCode) ? 'g' :
                     ['INJECTION'].includes(formCode) ? 'vials' :
                     ['DROPS', 'SPRAY'].includes(formCode) ? 'ml' :
                     ['PATCH'].includes(formCode) ? 'patches' :
                     ['INHALER', 'NEBULIZER'].includes(formCode) ? 'doses' : 'units',
    side_effects: safety.side_effects,
    contraindications: safety.contraindications,
    warnings: safety.warnings,
    precautions: safety.precautions,
    dosage_guidance: dosageGuidance,
    images: [],
    search_keywords: [
      name.toLowerCase(),
      (generic_name || '').toLowerCase(),
      (manufacturer || '').toLowerCase(),
      formCode.toLowerCase(),
      strength.toLowerCase(),
    ].filter(Boolean),
    symptoms_treated: indication ? [indication] : [],
    tags: [
      list_type === 'core' ? 'WHO Essential' : list_type === 'complementary' ? 'WHO Complementary' : '',
      isBrand ? 'Brand' : 'Generic',
      purchase_type.replace(/_/g, ' '),
    ].filter(Boolean),
    pharmacy_id: new ObjectId(CONFIG.pharmacyId),
    is_active: true,
    is_featured: false,
    created_at: new Date(),
    updated_at: new Date(),
  };
}

// ╔══════════════════════════════════════════════════════════════════╗
// ║  SECTION 9: IMAGE GENERATION (optional)                        ║
// ╚══════════════════════════════════════════════════════════════════╝

const CATEGORY_COLORS = {
  PAIN_RELIEF:       [{ bg: 'dc2626', text: 'ffffff' }, { bg: 'e85d04', text: 'ffffff' }, { bg: 'c2410c', text: 'ffffff' }],
  ANTIBIOTICS:       [{ bg: '16a34a', text: 'ffffff' }, { bg: '15803d', text: 'ffffff' }, { bg: '22863a', text: 'ffffff' }],
  ANTIFUNGALS:       [{ bg: '059669', text: 'ffffff' }, { bg: '0d9488', text: 'ffffff' }],
  ANTIVIRALS:        [{ bg: '7c3aed', text: 'ffffff' }, { bg: '6d28d9', text: 'ffffff' }],
  COLD_AND_FLU:      [{ bg: '0284c7', text: 'ffffff' }, { bg: '0369a1', text: 'ffffff' }],
  ALLERGIES:         [{ bg: '7c3aed', text: 'ffffff' }, { bg: '8b5cf6', text: 'ffffff' }],
  DIGESTIVE_HEALTH:  [{ bg: '0d9488', text: 'ffffff' }, { bg: '0f766e', text: 'ffffff' }],
  VITAMINS_SUPPLEMENTS:[{ bg: 'f59e0b', text: '000000' }, { bg: 'd97706', text: 'ffffff' }],
  CARDIOVASCULAR:    [{ bg: '3b82f6', text: 'ffffff' }, { bg: '4f46e5', text: 'ffffff' }, { bg: '2563eb', text: 'ffffff' }],
  DIABETES:          [{ bg: '0ea5e9', text: 'ffffff' }, { bg: '0284c7', text: 'ffffff' }],
  MENTAL_HEALTH:     [{ bg: '8b5cf6', text: 'ffffff' }, { bg: '6366f1', text: 'ffffff' }],
  RESPIRATORY:       [{ bg: '06b6d4', text: 'ffffff' }, { bg: '0891b2', text: 'ffffff' }],
  EYE_CARE:          [{ bg: '22d3ee', text: '000000' }, { bg: '06b6d4', text: 'ffffff' }],
  EAR_CARE:          [{ bg: '14b8a6', text: 'ffffff' }, { bg: '0d9488', text: 'ffffff' }],
  SKIN_CARE:         [{ bg: 'e11d48', text: 'ffffff' }, { bg: 'be185d', text: 'ffffff' }],
  ORAL_CARE:         [{ bg: '10b981', text: 'ffffff' }, { bg: '059669', text: 'ffffff' }],
  FIRST_AID:         [{ bg: 'ef4444', text: 'ffffff' }, { bg: 'dc2626', text: 'ffffff' }],
  HORMONES:          [{ bg: 'ec4899', text: 'ffffff' }, { bg: 'db2777', text: 'ffffff' }],
  WOMENS_HEALTH:     [{ bg: 'db2777', text: 'ffffff' }, { bg: 'be185d', text: 'ffffff' }],
  MENS_HEALTH:       [{ bg: '475569', text: 'ffffff' }, { bg: '334155', text: 'ffffff' }],
  CHILDREN_HEALTH:   [{ bg: 'f97316', text: 'ffffff' }, { bg: 'ea580c', text: 'ffffff' }],
  SEXUAL_HEALTH:     [{ bg: 'f43f5e', text: 'ffffff' }, { bg: 'e11d48', text: 'ffffff' }],
  SLEEP_AIDS:        [{ bg: '312e81', text: 'ffffff' }, { bg: '3730a3', text: 'ffffff' }],
  WEIGHT_MANAGEMENT: [{ bg: '059669', text: 'ffffff' }, { bg: '047857', text: 'ffffff' }],
  SMOKING_CESSATION: [{ bg: '047857', text: 'ffffff' }, { bg: '065f46', text: 'ffffff' }],
  EMERGENCY_CONTRACEPTION:[{ bg: 'be185d', text: 'ffffff' }],
  MEDICAL_DEVICES:   [{ bg: '6b7280', text: 'ffffff' }],
  OTHER:             [{ bg: '6b7280', text: 'ffffff' }, { bg: '4b5563', text: 'ffffff' }],
  AGBO_JEDIJEDI:     [{ bg: '92400e', text: 'ffffff' }],
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
  if (drug.manufacturer) text += `\n${drug.manufacturer}`;
  const url = `https://placehold.co/600x600/${colors.bg}/${colors.text}/png?text=${encodeURIComponent(text)}&font=roboto`;

  const buffer = await downloadImage(url);
  const filename = `pharmacy/drugs/${Date.now()}-${drug.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.png`;
  const result = await s3.upload({
    Bucket: CONFIG.aws.bucket,
    Key: filename,
    Body: buffer,
    ContentType: 'image/png'
  }).promise();

  return {
    url: result.Location,
    is_primary: true,
    alt_text: `${drug.name} ${drug.strength || ''} ${drug.manufacturer || ''}`.trim()
  };
}

// ╔══════════════════════════════════════════════════════════════════╗
// ║  SECTION 10: MAIN EXECUTION                                    ║
// ╚══════════════════════════════════════════════════════════════════╝

async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  const skipImages = process.argv.includes('--skip-images');
  const limitArg = process.argv.indexOf('--limit');
  const limit = limitArg >= 0 ? parseInt(process.argv[limitArg + 1]) : Infinity;

  console.log(`\n${'='.repeat(60)}`);
  console.log(`  WHO EML + Brand Drug Seeder`);
  console.log(`  Mode: ${isDryRun ? 'DRY RUN' : 'LIVE INSERT'}`);
  console.log(`  Images: ${skipImages ? 'SKIP' : 'GENERATE'}`);
  console.log(`  Limit: ${limit === Infinity ? 'none' : limit}`);
  console.log(`${'='.repeat(60)}\n`);

  const client = new MongoClient(CONFIG.mongoUrl);

  try {
    await client.connect();
    console.log('Connected to MongoDB\n');
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

    console.log(`Reference data loaded: ${forms.length} forms, ${routes.length} routes, ${cats.length} categories, ${classifs.length} classifications\n`);

    // ─── Load existing drugs for dedup ───
    const existing = await drugsCollection.find({}, {
      projection: { name: 1, strength: 1, dosage_form: 1 }
    }).toArray();
    const existingKeys = new Set(
      existing.map(d => `${(d.name || '').toLowerCase()}|${(d.strength || '').toLowerCase()}|${d.dosage_form?.toString() || ''}`)
    );
    console.log(`Existing drugs: ${existing.length} (for dedup)\n`);

    // ─── Load WHO EML data ───
    const whoEml = require(path.resolve(__dirname, '../src/modules/pharmacy/data/who-eml-drugs.json'));
    console.log(`WHO EML: ${whoEml.medicines.length} medicines, generating drugs...\n`);

    // ─── Generate all drug documents ───
    const allDrugs = [];

    // Pass 1: WHO EML generics
    for (const medicine of whoEml.medicines) {
      const sectionPrefix = getSectionPrefix(medicine.section);
      const categoryCodes = SECTION_CATEGORY_MAP[sectionPrefix] || ['OTHER'];
      const { purchase_type, schedule_class, classification: classCode } = classifyDrug(medicine.inn, sectionPrefix);
      const pregCat = getPregnancyCategory(sectionPrefix, medicine.inn);
      const indication = medicine.indications[0]?.indication || '';

      // Deduplicate formulations within a medicine
      const seenFormulations = new Set();

      for (const ind of medicine.indications) {
        for (const f of ind.formulations) {
          const formCode = FORM_MAP[f.form];
          if (!formCode) continue; // Skip unmappable forms

          const routeCode = resolveRoute(f.route, f.form);
          const formKey = `${f.form}|${f.route}|${f.strength}`;
          if (seenFormulations.has(formKey)) continue;
          seenFormulations.add(formKey);

          const genericName = titleCase(medicine.inn);

          // 1a: Plain generic
          const doc = buildDrugDoc({
            name: genericName,
            generic_name: genericName,
            strength: f.strength,
            formCode, routeCode, categoryCodes,
            purchase_type, schedule_class, classificationCode: classCode,
            manufacturer: null,
            pregnancy_category: pregCat,
            atc_code: medicine.atc_code,
            sectionPrefix,
            isBrand: false,
            indication,
            list_type: medicine.list_type,
          }, refData);
          if (doc) allDrugs.push({ doc, primaryCategory: categoryCodes[0] });

          // 1b: Brand name entries
          const brands = BRAND_DB[medicine.inn.toLowerCase()] || [];
          for (const brand of brands) {
            const brandDoc = buildDrugDoc({
              name: brand.b,
              generic_name: genericName,
              strength: f.strength,
              formCode, routeCode, categoryCodes,
              purchase_type, schedule_class, classificationCode: classCode,
              manufacturer: brand.m,
              pregnancy_category: pregCat,
              atc_code: medicine.atc_code,
              sectionPrefix,
              isBrand: true,
              indication,
              list_type: medicine.list_type,
            }, refData);
            if (brandDoc) allDrugs.push({ doc: brandDoc, primaryCategory: categoryCodes[0] });
          }

          // 1c: Manufacturer generics (for primary formulation only — first strength per form)
          const mfrCount = getManufacturerCount(sectionPrefix, f.form, medicine.inn);
          const mfrs = pickManufacturers(medicine.inn, mfrCount);
          for (const mfr of mfrs) {
            const mfrDoc = buildDrugDoc({
              name: `${genericName} (${mfr.code})`,
              generic_name: genericName,
              strength: f.strength,
              formCode, routeCode, categoryCodes,
              purchase_type, schedule_class, classificationCode: classCode,
              manufacturer: mfr.name,
              pregnancy_category: pregCat,
              atc_code: medicine.atc_code,
              sectionPrefix,
              isBrand: false,
              indication,
              list_type: medicine.list_type,
            }, refData);
            if (mfrDoc) allDrugs.push({ doc: mfrDoc, primaryCategory: categoryCodes[0] });
          }
        }
      }
    }

    // Pass 2: Supplementary OTC & supplement drugs
    for (const supp of SUPPLEMENTARY_DRUGS) {
      const formCode = supp.form;
      const routeCode = supp.route;
      const classCode = supp.purchase_type === 'CONTROLLED' ? 'SCHEDULE_II' :
                        supp.purchase_type === 'PRESCRIPTION_ONLY' ? 'PRESCRIPTION_ONLY' :
                        supp.purchase_type === 'PHARMACY_ONLY' ? 'PHARMACY_ONLY' : 'OTC_GENERAL';
      const schedClass = supp.purchase_type === 'CONTROLLED' ? 'SCHEDULE_II' :
                         supp.purchase_type === 'PRESCRIPTION_ONLY' ? 'RX_ONLY' : 'OTC';

      const doc = buildDrugDoc({
        name: supp.name,
        generic_name: supp.generic_name,
        strength: supp.strength,
        formCode, routeCode,
        categoryCodes: supp.categories,
        purchase_type: supp.purchase_type,
        schedule_class: schedClass,
        classificationCode: classCode,
        manufacturer: supp.manufacturer,
        pregnancy_category: supp.pregnancy_category || 'C',
        atc_code: supp.atc_code || null,
        sectionPrefix: '0',
        isBrand: true,
        indication: '',
        list_type: null,
      }, refData);
      if (doc) allDrugs.push({ doc, primaryCategory: supp.categories[0] });
    }

    console.log(`Generated ${allDrugs.length} drug entries (before dedup)\n`);

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
    console.log(`Will insert: ${toInsert.length} drugs\n`);

    if (isDryRun) {
      console.log('DRY RUN — no documents inserted.');
      // Show category breakdown
      const catCounts = {};
      toInsert.forEach(({ primaryCategory }) => {
        catCounts[primaryCategory] = (catCounts[primaryCategory] || 0) + 1;
      });
      console.log('\nCategory breakdown:');
      Object.entries(catCounts).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
        console.log(`  ${cat}: ${count}`);
      });

      // Show type breakdown
      let brands = 0, generics = 0, mfrGenerics = 0;
      toInsert.forEach(({ doc }) => {
        if (doc.brand_name) brands++;
        else if (doc.name.includes('(')) mfrGenerics++;
        else generics++;
      });
      console.log(`\nType breakdown: ${generics} generics, ${brands} brands, ${mfrGenerics} manufacturer generics`);
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
            // Rate limiting
            if (j % 10 === 9) await new Promise(r => setTimeout(r, 100));
          } catch (err) {
            imgFailed++;
            // Continue without image
          }
          // Progress
          if ((inserted + j + 1) % 100 === 0) {
            console.log(`  Progress: ${inserted + j + 1}/${toInsert.length} drugs processed...`);
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
    console.log(`  SEEDING COMPLETE`);
    console.log(`  New drugs inserted: ${inserted}`);
    console.log(`  Duplicates skipped: ${dupSkipped}`);
    if (!skipImages) console.log(`  Images: ${imgSuccess} success, ${imgFailed} failed`);
    console.log(`  Total drugs in DB: ${finalCount}`);
    console.log(`${'='.repeat(60)}\n`);

  } finally {
    await client.close();
  }
}

main().catch(console.error);
