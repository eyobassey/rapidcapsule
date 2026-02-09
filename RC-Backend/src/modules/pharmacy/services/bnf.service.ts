import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import {
  BNFDrugInfo,
  BNFDosage,
  BNFIndication,
  BNFInteraction,
  BNFInteractionSeverity,
  BNFSideEffects,
  BNFValidationResult,
  BNFComplianceSummary,
  BNFFDAComparison,
} from '../dto/bnf.dto';

/**
 * NHS BNF (British National Formulary) Service
 * Provides UK-specific drug prescribing information
 *
 * The BNF is the standard pharmaceutical reference for NHS healthcare professionals.
 * This service provides UK-approved indications, dosages, interactions, and cautions.
 *
 * Note: Full BNF API requires NHS subscription. This service uses a curated local
 * database of common medications that can be extended with API integration.
 */
@Injectable()
export class BNFService {
  private readonly logger = new Logger(BNFService.name);
  private readonly BNF_BASE_URL = 'https://bnf.nice.org.uk/drugs';

  // Comprehensive BNF drug database for common medications
  private readonly DRUG_DATABASE: Record<string, BNFDrugInfo> = {
    // ============ CARDIOVASCULAR ============
    'amlodipine': {
      drug_name: 'Amlodipine',
      generic_name: 'amlodipine',
      drug_class: 'Calcium-channel blockers',
      bnf_url: 'https://bnf.nice.org.uk/drugs/amlodipine/',
      indications: [
        { condition: 'Hypertension', adult: true, child: true },
        { condition: 'Prophylaxis of angina', adult: true, child: false },
      ],
      dosages: [
        {
          population: 'adult',
          route: 'oral',
          dose: '5 mg',
          frequency: 'once daily',
          max_dose: '10 mg once daily',
          notes: 'Initially 5 mg once daily; increased if necessary to max 10 mg once daily',
        },
        {
          population: 'elderly',
          route: 'oral',
          dose: '2.5 mg',
          frequency: 'once daily',
          max_dose: '10 mg once daily',
          notes: 'Start with lower dose in elderly',
        },
        {
          population: 'child',
          route: 'oral',
          dose: '0.1-0.2 mg/kg',
          frequency: 'once daily',
          max_dose: '5 mg once daily',
          age_range: { min_age: '1 month', max_age: '17 years' },
        },
      ],
      contraindications: [
        'Cardiogenic shock',
        'Unstable angina',
        'Significant aortic stenosis',
      ],
      cautions: [
        'Hepatic impairment',
        'Heart failure',
        'Elderly',
      ],
      hepatic_impairment: {
        severity_levels: {
          mild: 'Use with caution',
          moderate: 'Reduce dose',
          severe: 'Avoid or use with extreme caution',
        },
        dose_adjustment: 'Start with 2.5 mg daily',
      },
      pregnancy: {
        category: 'avoid',
        notes: 'May inhibit labour; risk of hypotension; manufacturer advises avoid',
      },
      breastfeeding: {
        recommendation: 'present_in_milk',
        notes: 'Present in milk in small amounts; manufacturer advises avoid',
      },
      side_effects: {
        very_common: ['Oedema', 'Flushing'],
        common: ['Headache', 'Dizziness', 'Fatigue', 'Nausea', 'Abdominal pain', 'Palpitations'],
        uncommon: ['Mood changes', 'Tremor', 'Dyspepsia', 'Arthralgia', 'Myalgia'],
        rare: ['Confusion', 'Hepatitis', 'Jaundice'],
      },
      interactions: [
        {
          interacting_drug: 'Simvastatin',
          severity: BNFInteractionSeverity.MODERATE,
          effect: 'Increased risk of myopathy',
          action: 'Max simvastatin dose 20 mg daily',
          evidence: 'study',
        },
        {
          interacting_drug: 'Grapefruit juice',
          severity: BNFInteractionSeverity.MODERATE,
          effect: 'Increased plasma concentration',
          action: 'Avoid grapefruit juice',
          evidence: 'study',
        },
      ],
    },

    'lisinopril': {
      drug_name: 'Lisinopril',
      generic_name: 'lisinopril',
      drug_class: 'ACE inhibitors',
      bnf_url: 'https://bnf.nice.org.uk/drugs/lisinopril/',
      indications: [
        { condition: 'Hypertension', adult: true, child: true },
        { condition: 'Heart failure', adult: true, child: false },
        { condition: 'Diabetic nephropathy', adult: true, child: false },
        { condition: 'Post myocardial infarction', adult: true, child: false },
      ],
      dosages: [
        {
          indication: 'Hypertension',
          population: 'adult',
          route: 'oral',
          dose: '10 mg',
          frequency: 'once daily',
          max_dose: '80 mg once daily',
          notes: 'Initially 10 mg once daily; usual maintenance 20 mg once daily',
        },
        {
          indication: 'Heart failure',
          population: 'adult',
          route: 'oral',
          dose: '2.5 mg',
          frequency: 'once daily',
          max_dose: '35 mg once daily',
          notes: 'Start low and titrate up over 2-4 weeks',
        },
      ],
      contraindications: [
        'Angioedema associated with previous ACE inhibitor use',
        'Hereditary or idiopathic angioedema',
        'Pregnancy',
        'Concomitant use with sacubitril',
      ],
      cautions: [
        'First-dose hypotension (especially in heart failure)',
        'Renal impairment',
        'Aortic stenosis',
        'Hypertrophic cardiomyopathy',
        'Afro-Caribbean patients (less effective)',
      ],
      renal_impairment: {
        severity_levels: {
          mild: 'Use with caution',
          moderate: 'Reduce dose; max 40 mg daily',
          severe: 'Reduce dose; max 20 mg daily',
        },
        monitoring: 'Monitor renal function and potassium',
      },
      pregnancy: {
        category: 'avoid',
        trimester_specific: {
          first: 'Avoid - toxicity in animal studies',
          second: 'Avoid - fetotoxicity reported',
          third: 'Avoid - oligohydramnios, neonatal renal failure',
        },
        notes: 'CONTRAINDICATED in pregnancy - risk of fetal abnormalities',
      },
      breastfeeding: {
        recommendation: 'avoid',
        notes: 'Avoid - no information available',
      },
      side_effects: {
        common: ['Dizziness', 'Headache', 'Cough', 'Diarrhoea', 'Vomiting', 'Fatigue'],
        uncommon: ['Mood changes', 'Paraesthesia', 'Vertigo', 'Taste disturbance'],
        rare: ['Angioedema', 'Bronchospasm', 'Hepatitis'],
      },
      interactions: [
        {
          interacting_drug: 'Potassium supplements',
          severity: BNFInteractionSeverity.SEVERE,
          effect: 'Increased risk of hyperkalaemia',
          action: 'Avoid concomitant use or monitor potassium closely',
          evidence: 'study',
        },
        {
          interacting_drug: 'NSAIDs',
          severity: BNFInteractionSeverity.MODERATE,
          effect: 'Reduced antihypertensive effect; increased risk of renal impairment',
          action: 'Monitor blood pressure and renal function',
          evidence: 'study',
        },
        {
          interacting_drug: 'Lithium',
          severity: BNFInteractionSeverity.SEVERE,
          effect: 'Increased lithium concentration',
          action: 'Avoid combination or monitor lithium levels closely',
          evidence: 'study',
        },
      ],
      monitoring: [
        'Renal function before and during treatment',
        'Serum potassium',
        'Blood pressure',
      ],
    },

    'atorvastatin': {
      drug_name: 'Atorvastatin',
      generic_name: 'atorvastatin',
      drug_class: 'Statins',
      bnf_url: 'https://bnf.nice.org.uk/drugs/atorvastatin/',
      indications: [
        { condition: 'Primary hypercholesterolaemia', adult: true, child: true },
        { condition: 'Prevention of cardiovascular events', adult: true, child: false },
      ],
      dosages: [
        {
          indication: 'Primary prevention',
          population: 'adult',
          route: 'oral',
          dose: '20 mg',
          frequency: 'once daily',
          max_dose: '80 mg once daily',
        },
        {
          indication: 'Secondary prevention',
          population: 'adult',
          route: 'oral',
          dose: '80 mg',
          frequency: 'once daily',
        },
      ],
      contraindications: [
        'Active liver disease',
        'Pregnancy',
        'Breastfeeding',
      ],
      cautions: [
        'History of liver disease',
        'High alcohol intake',
        'Risk factors for myopathy',
        'Hypothyroidism',
      ],
      hepatic_impairment: {
        severity_levels: {
          mild: 'Use with caution',
          moderate: 'Avoid',
          severe: 'Avoid',
        },
        avoid: true,
        notes: 'Avoid in active liver disease or unexplained persistent elevations in serum transaminases',
      },
      pregnancy: {
        category: 'avoid',
        notes: 'CONTRAINDICATED - congenital anomalies reported; discontinue 3 months before attempting conception',
      },
      breastfeeding: {
        recommendation: 'avoid',
        notes: 'Manufacturer advises avoid - present in milk in animal studies',
      },
      side_effects: {
        common: ['Nasopharyngitis', 'Hyperglycaemia', 'Headache', 'GI disturbances', 'Myalgia', 'Arthralgia'],
        uncommon: ['Nausea', 'Insomnia', 'Dizziness', 'Paraesthesia', 'Alopecia', 'Rash'],
        rare: ['Myopathy', 'Rhabdomyolysis', 'Hepatitis', 'Peripheral neuropathy'],
      },
      interactions: [
        {
          interacting_drug: 'Clarithromycin',
          severity: BNFInteractionSeverity.SEVERE,
          effect: 'Increased risk of myopathy',
          action: 'Avoid combination or limit atorvastatin to 20 mg daily',
          evidence: 'study',
        },
        {
          interacting_drug: 'Ciclosporin',
          severity: BNFInteractionSeverity.SEVERE,
          effect: 'Significantly increased atorvastatin levels',
          action: 'Avoid combination',
          evidence: 'study',
        },
        {
          interacting_drug: 'Warfarin',
          severity: BNFInteractionSeverity.MODERATE,
          effect: 'May enhance anticoagulant effect',
          action: 'Monitor INR when starting or stopping',
          evidence: 'study',
        },
        {
          interacting_drug: 'Grapefruit juice',
          severity: BNFInteractionSeverity.MODERATE,
          effect: 'Increased plasma concentration',
          action: 'Avoid large quantities',
          evidence: 'study',
        },
      ],
      monitoring: [
        'Liver function before treatment and if symptoms of liver disease',
        'Creatine kinase if myopathy suspected',
      ],
    },

    'bisoprolol': {
      drug_name: 'Bisoprolol',
      generic_name: 'bisoprolol',
      drug_class: 'Beta-blockers',
      bnf_url: 'https://bnf.nice.org.uk/drugs/bisoprolol-fumarate/',
      indications: [
        { condition: 'Hypertension', adult: true, child: false },
        { condition: 'Angina', adult: true, child: false },
        { condition: 'Heart failure', adult: true, child: false },
      ],
      dosages: [
        {
          indication: 'Hypertension/Angina',
          population: 'adult',
          route: 'oral',
          dose: '5-10 mg',
          frequency: 'once daily',
          max_dose: '20 mg once daily',
        },
        {
          indication: 'Heart failure',
          population: 'adult',
          route: 'oral',
          dose: '1.25 mg',
          frequency: 'once daily',
          max_dose: '10 mg once daily',
          notes: 'Start low and titrate slowly over weeks',
        },
      ],
      contraindications: [
        'Asthma',
        'Uncontrolled heart failure',
        'Severe bradycardia',
        'Sick sinus syndrome',
        'Second or third degree AV block',
        'Phaeochromocytoma (without alpha-blocker)',
      ],
      cautions: [
        'First-degree AV block',
        'Diabetes (may mask hypoglycaemia symptoms)',
        'COPD',
        'Peripheral vascular disease',
        'Psoriasis',
      ],
      renal_impairment: {
        severity_levels: {
          mild: 'No dose adjustment required',
          moderate: 'No dose adjustment required',
          severe: 'Max 10 mg daily',
        },
      },
      hepatic_impairment: {
        severity_levels: {
          mild: 'No dose adjustment required',
          moderate: 'No dose adjustment required',
          severe: 'Max 10 mg daily',
        },
      },
      pregnancy: {
        category: 'caution',
        notes: 'May cause bradycardia, hypoglycaemia and hypotension in neonate; use only if benefit outweighs risk',
      },
      breastfeeding: {
        recommendation: 'caution',
        notes: 'Amount probably too small to be harmful but monitor infant',
      },
      side_effects: {
        common: ['Fatigue', 'Headache', 'Dizziness', 'Cold extremities', 'GI disturbances'],
        uncommon: ['Sleep disturbances', 'Depression', 'Bradycardia', 'Hypotension'],
        rare: ['Bronchospasm', 'Exacerbation of psoriasis'],
      },
      interactions: [
        {
          interacting_drug: 'Verapamil',
          severity: BNFInteractionSeverity.SEVERE,
          effect: 'Increased risk of bradycardia and AV block',
          action: 'Avoid combination',
          evidence: 'study',
        },
        {
          interacting_drug: 'Diltiazem',
          severity: BNFInteractionSeverity.MODERATE,
          effect: 'Increased risk of bradycardia and AV block',
          action: 'Use with caution',
          evidence: 'study',
        },
      ],
      prescribing_notes: [
        'Do not stop abruptly - reduce dose gradually over 1-2 weeks',
      ],
    },

    // ============ DIABETES ============
    'metformin': {
      drug_name: 'Metformin',
      generic_name: 'metformin',
      drug_class: 'Biguanides',
      bnf_url: 'https://bnf.nice.org.uk/drugs/metformin-hydrochloride/',
      indications: [
        { condition: 'Type 2 diabetes mellitus', adult: true, child: true },
        { condition: 'Polycystic ovary syndrome', adult: true, child: false, notes: 'Unlicensed indication' },
      ],
      dosages: [
        {
          population: 'adult',
          route: 'oral',
          dose: '500 mg',
          frequency: 'with breakfast initially, then 500 mg with each meal',
          max_dose: '2 g daily in 2-3 divided doses (3 g in some cases)',
          notes: 'Increase gradually to minimise GI side effects',
        },
        {
          population: 'child',
          route: 'oral',
          dose: '200-500 mg',
          frequency: 'with or after meals',
          max_dose: '2 g daily',
          age_range: { min_age: '10 years' },
        },
      ],
      contraindications: [
        'Diabetic ketoacidosis',
        'Severe renal impairment (eGFR <30)',
        'Acute conditions with potential for tissue hypoxia',
        'Alcohol intoxication',
      ],
      cautions: [
        'Renal impairment (monitor eGFR)',
        'Risk factors for lactic acidosis',
        'Elderly',
        'Withhold before iodinated contrast procedures',
      ],
      renal_impairment: {
        severity_levels: {
          mild: 'Review dose at eGFR 45',
          moderate: 'Reduce dose; avoid if eGFR <30',
          severe: 'AVOID',
        },
        monitoring: 'Monitor eGFR before treatment and at least annually',
        notes: 'Risk of lactic acidosis increases with renal impairment',
      },
      pregnancy: {
        category: 'benefit_outweighs_risk',
        notes: 'Can be used in pregnancy for gestational diabetes when diet alone inadequate',
      },
      breastfeeding: {
        recommendation: 'amount_too_small',
        notes: 'Present in milk but amount too small to be harmful',
      },
      side_effects: {
        very_common: ['Nausea', 'Vomiting', 'Diarrhoea', 'Abdominal pain', 'Loss of appetite'],
        common: ['Taste disturbance'],
        rare: ['Lactic acidosis', 'Vitamin B12 deficiency', 'Hepatitis'],
      },
      interactions: [
        {
          interacting_drug: 'Iodinated contrast media',
          severity: BNFInteractionSeverity.SEVERE,
          effect: 'Risk of lactic acidosis and acute kidney injury',
          action: 'Withhold metformin before procedure; restart 48 hours after if renal function stable',
          evidence: 'study',
        },
        {
          interacting_drug: 'Alcohol',
          severity: BNFInteractionSeverity.MODERATE,
          effect: 'Increased risk of lactic acidosis',
          action: 'Avoid excessive alcohol',
          evidence: 'study',
        },
      ],
      monitoring: [
        'Renal function (eGFR) before and during treatment',
        'Vitamin B12 levels if long-term use',
      ],
    },

    'gliclazide': {
      drug_name: 'Gliclazide',
      generic_name: 'gliclazide',
      drug_class: 'Sulfonylureas',
      bnf_url: 'https://bnf.nice.org.uk/drugs/gliclazide/',
      indications: [
        { condition: 'Type 2 diabetes mellitus', adult: true, child: false },
      ],
      dosages: [
        {
          population: 'adult',
          route: 'oral',
          dose: '40-80 mg',
          frequency: 'once daily with breakfast',
          max_dose: '320 mg daily',
          notes: 'Modified-release: 30 mg once daily, max 120 mg daily',
        },
      ],
      contraindications: [
        'Diabetic ketoacidosis',
        'Type 1 diabetes',
        'Severe hepatic impairment',
        'Severe renal impairment',
      ],
      cautions: [
        'Elderly (increased risk of hypoglycaemia)',
        'G6PD deficiency',
        'Porphyria',
      ],
      renal_impairment: {
        severity_levels: {
          mild: 'Use with caution',
          moderate: 'Use with caution; monitor closely',
          severe: 'Avoid',
        },
        notes: 'Increased risk of hypoglycaemia',
      },
      hepatic_impairment: {
        severity_levels: {
          mild: 'Use with caution',
          moderate: 'Avoid',
          severe: 'Avoid',
        },
      },
      pregnancy: {
        category: 'avoid',
        notes: 'Avoid - insulin is the drug of choice in pregnancy',
      },
      breastfeeding: {
        recommendation: 'avoid',
        notes: 'Avoid - theoretical risk of neonatal hypoglycaemia',
      },
      side_effects: {
        common: ['Hypoglycaemia'],
        uncommon: ['GI disturbances', 'Rash'],
        rare: ['Blood disorders', 'Hepatic disorders'],
      },
      interactions: [
        {
          interacting_drug: 'Fluconazole',
          severity: BNFInteractionSeverity.MODERATE,
          effect: 'Increased hypoglycaemic effect',
          action: 'Monitor blood glucose and reduce dose if necessary',
          evidence: 'study',
        },
      ],
    },

    // ============ RESPIRATORY ============
    'salbutamol': {
      drug_name: 'Salbutamol',
      generic_name: 'salbutamol',
      drug_class: 'Beta2 agonists (short-acting)',
      bnf_url: 'https://bnf.nice.org.uk/drugs/salbutamol/',
      indications: [
        { condition: 'Acute asthma', adult: true, child: true },
        { condition: 'Chronic asthma', adult: true, child: true },
        { condition: 'COPD', adult: true, child: false },
        { condition: 'Premature labour', adult: true, child: false, notes: 'IV use' },
      ],
      dosages: [
        {
          indication: 'Acute bronchospasm',
          population: 'adult',
          route: 'inhaled',
          dose: '100-200 micrograms',
          frequency: 'as required',
          max_dose: '800 micrograms in 24 hours (regular use indicates poor control)',
        },
        {
          indication: 'Acute bronchospasm',
          population: 'child',
          route: 'inhaled',
          dose: '100-200 micrograms',
          frequency: 'as required',
        },
        {
          indication: 'Acute severe asthma',
          population: 'adult',
          route: 'inhaled',
          dose: '5 mg',
          frequency: 'via nebuliser, repeat as necessary',
        },
      ],
      contraindications: [],
      cautions: [
        'Hyperthyroidism',
        'Cardiovascular disease',
        'Arrhythmias',
        'Susceptibility to QT prolongation',
        'Diabetes (monitor blood glucose)',
      ],
      pregnancy: {
        category: 'no_known_harm',
        notes: 'Inhaled drugs can be taken as normal during pregnancy',
      },
      breastfeeding: {
        recommendation: 'no_information',
        notes: 'Inhaled drugs can be taken as normal during breastfeeding',
      },
      side_effects: {
        common: ['Tremor', 'Headache', 'Palpitations', 'Muscle cramps'],
        uncommon: ['Tachycardia', 'Arrhythmias', 'Hypokalaemia'],
        rare: ['Paradoxical bronchospasm'],
      },
      interactions: [
        {
          interacting_drug: 'Beta-blockers',
          severity: BNFInteractionSeverity.SEVERE,
          effect: 'Antagonism of bronchodilator effect',
          action: 'Avoid non-selective beta-blockers in asthma',
          evidence: 'study',
        },
      ],
      prescribing_notes: [
        'High usage indicates poor asthma control - review preventer therapy',
        'Consider spacer device for inhaler technique',
      ],
    },

    // ============ MENTAL HEALTH ============
    'sertraline': {
      drug_name: 'Sertraline',
      generic_name: 'sertraline',
      drug_class: 'SSRIs',
      bnf_url: 'https://bnf.nice.org.uk/drugs/sertraline/',
      indications: [
        { condition: 'Depression', adult: true, child: true },
        { condition: 'Obsessive-compulsive disorder', adult: true, child: true },
        { condition: 'Panic disorder', adult: true, child: false },
        { condition: 'PTSD', adult: true, child: false },
        { condition: 'Social anxiety disorder', adult: true, child: false },
      ],
      dosages: [
        {
          indication: 'Depression',
          population: 'adult',
          route: 'oral',
          dose: '50 mg',
          frequency: 'once daily',
          max_dose: '200 mg once daily',
          notes: 'Increase in 50 mg increments at intervals of at least 1 week',
        },
        {
          indication: 'OCD',
          population: 'child',
          route: 'oral',
          dose: '25 mg',
          frequency: 'once daily',
          max_dose: '200 mg once daily',
          age_range: { min_age: '6 years' },
        },
      ],
      contraindications: [
        'Poorly controlled epilepsy',
        'Mania',
        'Concurrent use with MAOIs',
      ],
      cautions: [
        'Epilepsy',
        'Cardiac disease',
        'Diabetes',
        'History of mania',
        'Bleeding disorders',
        'Angle-closure glaucoma',
        'Young adults (increased suicide risk initially)',
      ],
      hepatic_impairment: {
        severity_levels: {
          mild: 'Use with caution; use lower dose',
          moderate: 'Use with caution; use lower dose',
          severe: 'Avoid',
        },
      },
      pregnancy: {
        category: 'caution',
        trimester_specific: {
          first: 'Weigh risks vs benefits',
          third: 'Risk of neonatal withdrawal; pulmonary hypertension reported',
        },
        notes: 'Use only if benefit outweighs risk; neonatal effects reported in third trimester',
      },
      breastfeeding: {
        recommendation: 'caution',
        notes: 'Present in milk but amount usually too small to be harmful',
      },
      side_effects: {
        very_common: ['Nausea', 'Headache', 'Diarrhoea', 'Insomnia'],
        common: ['Dizziness', 'Fatigue', 'Tremor', 'Dry mouth', 'Sweating', 'Sexual dysfunction'],
        uncommon: ['Bleeding disorders', 'Hyponatraemia'],
        rare: ['Serotonin syndrome', 'Suicidal ideation'],
      },
      interactions: [
        {
          interacting_drug: 'MAOIs',
          severity: BNFInteractionSeverity.SEVERE,
          effect: 'Risk of serotonin syndrome',
          action: 'CONTRAINDICATED - allow 2-week washout period',
          evidence: 'study',
        },
        {
          interacting_drug: 'Tramadol',
          severity: BNFInteractionSeverity.MODERATE,
          effect: 'Increased risk of serotonin syndrome and seizures',
          action: 'Use with caution',
          evidence: 'study',
        },
        {
          interacting_drug: 'Warfarin',
          severity: BNFInteractionSeverity.MODERATE,
          effect: 'Increased bleeding risk',
          action: 'Monitor INR closely',
          evidence: 'study',
        },
      ],
      prescribing_notes: [
        'Discontinue gradually over 4 weeks to avoid withdrawal symptoms',
        'Monitor for suicidal ideation, especially in young adults',
      ],
    },

    // ============ PAIN ============
    'paracetamol': {
      drug_name: 'Paracetamol',
      generic_name: 'paracetamol',
      drug_class: 'Non-opioid analgesics',
      bnf_url: 'https://bnf.nice.org.uk/drugs/paracetamol/',
      indications: [
        { condition: 'Mild to moderate pain', adult: true, child: true },
        { condition: 'Pyrexia', adult: true, child: true },
      ],
      dosages: [
        {
          population: 'adult',
          route: 'oral',
          dose: '0.5-1 g',
          frequency: 'every 4-6 hours',
          max_dose: '4 g in 24 hours',
          notes: 'Max 4 doses in 24 hours; leave at least 4 hours between doses',
        },
        {
          population: 'child',
          route: 'oral',
          dose: '15 mg/kg',
          frequency: 'every 4-6 hours',
          max_dose: '60 mg/kg daily (max 4 g)',
          weight_based: { dose_per_kg: '15 mg', max_dose: '1 g per dose' },
        },
      ],
      contraindications: [],
      cautions: [
        'Hepatic impairment',
        'Chronic alcohol consumption',
        'Chronic malnutrition',
        'Glutathione depletion',
        'Low body weight (<50 kg)',
      ],
      hepatic_impairment: {
        severity_levels: {
          mild: 'Use with caution',
          moderate: 'Reduce dose or increase dosing interval',
          severe: 'Avoid or use reduced dose',
        },
        dose_adjustment: 'Consider max 3 g daily in hepatic impairment',
        notes: 'Risk of hepatotoxicity increased',
      },
      pregnancy: {
        category: 'no_known_harm',
        notes: 'First choice analgesic in pregnancy',
      },
      breastfeeding: {
        recommendation: 'amount_too_small',
        notes: 'Amount too small to be harmful',
      },
      side_effects: {
        rare: ['Thrombocytopenia', 'Leucopenia', 'Hepatotoxicity (with overdose)', 'Rash'],
      },
      interactions: [
        {
          interacting_drug: 'Warfarin',
          severity: BNFInteractionSeverity.MODERATE,
          effect: 'Regular use may enhance anticoagulant effect',
          action: 'Monitor INR with regular paracetamol use',
          evidence: 'study',
        },
      ],
      prescribing_notes: [
        'OVERDOSE: Hepatotoxic - refer to toxbase for management',
        'Check for paracetamol content in compound preparations to avoid exceeding max dose',
      ],
    },

    'ibuprofen': {
      drug_name: 'Ibuprofen',
      generic_name: 'ibuprofen',
      drug_class: 'NSAIDs',
      bnf_url: 'https://bnf.nice.org.uk/drugs/ibuprofen/',
      indications: [
        { condition: 'Mild to moderate pain', adult: true, child: true },
        { condition: 'Inflammation', adult: true, child: true },
        { condition: 'Pyrexia', adult: true, child: true },
        { condition: 'Dysmenorrhoea', adult: true, child: false },
      ],
      dosages: [
        {
          population: 'adult',
          route: 'oral',
          dose: '200-400 mg',
          frequency: '3-4 times daily',
          max_dose: '2.4 g daily',
          notes: 'Take with or after food',
        },
        {
          population: 'child',
          route: 'oral',
          dose: '5-10 mg/kg',
          frequency: '3-4 times daily',
          max_dose: '30 mg/kg daily (max 2.4 g)',
          age_range: { min_age: '3 months' },
        },
      ],
      contraindications: [
        'Active peptic ulcer disease',
        'History of GI bleeding with NSAIDs',
        'Severe heart failure',
        'Severe hepatic impairment',
        'Severe renal impairment (eGFR <15)',
        'Third trimester of pregnancy',
      ],
      cautions: [
        'Elderly',
        'Allergic disorders',
        'Coagulation defects',
        'Crohn\'s disease or ulcerative colitis',
        'Cardiovascular disease',
        'Renal impairment',
        'Hepatic impairment',
      ],
      renal_impairment: {
        severity_levels: {
          mild: 'Use with caution; lowest effective dose for shortest duration',
          moderate: 'Use with caution; monitor renal function',
          severe: 'Avoid',
        },
        notes: 'NSAIDs may cause deterioration in renal function',
      },
      hepatic_impairment: {
        severity_levels: {
          mild: 'Use with caution',
          moderate: 'Use with caution',
          severe: 'Avoid',
        },
      },
      pregnancy: {
        category: 'avoid',
        trimester_specific: {
          first: 'Avoid unless essential',
          second: 'Avoid unless essential',
          third: 'AVOID - risk of closure of ductus arteriosus, oligohydramnios',
        },
        notes: 'AVOID in third trimester',
      },
      breastfeeding: {
        recommendation: 'amount_too_small',
        notes: 'Amount too small to be harmful',
      },
      side_effects: {
        common: ['GI discomfort', 'Nausea', 'Diarrhoea', 'Dyspepsia'],
        uncommon: ['Headache', 'Dizziness', 'Rash', 'Fluid retention'],
        rare: ['GI bleeding', 'GI ulceration', 'Hepatic damage', 'Renal failure', 'Cardiovascular events'],
      },
      interactions: [
        {
          interacting_drug: 'ACE inhibitors',
          severity: BNFInteractionSeverity.MODERATE,
          effect: 'Reduced antihypertensive effect; increased risk of renal impairment',
          action: 'Monitor blood pressure and renal function',
          evidence: 'study',
        },
        {
          interacting_drug: 'Warfarin',
          severity: BNFInteractionSeverity.MODERATE,
          effect: 'Increased bleeding risk',
          action: 'Avoid combination if possible; monitor INR',
          evidence: 'study',
        },
        {
          interacting_drug: 'SSRIs',
          severity: BNFInteractionSeverity.MODERATE,
          effect: 'Increased risk of GI bleeding',
          action: 'Consider gastroprotection',
          evidence: 'study',
        },
        {
          interacting_drug: 'Lithium',
          severity: BNFInteractionSeverity.MODERATE,
          effect: 'Increased lithium levels',
          action: 'Monitor lithium levels',
          evidence: 'study',
        },
      ],
      prescribing_notes: [
        'Use lowest effective dose for shortest duration',
        'Consider gastroprotection in at-risk patients',
        'Review cardiovascular risk before prescribing',
      ],
    },

    // ============ ANTIBIOTICS ============
    'amoxicillin': {
      drug_name: 'Amoxicillin',
      generic_name: 'amoxicillin',
      drug_class: 'Penicillins',
      bnf_url: 'https://bnf.nice.org.uk/drugs/amoxicillin/',
      indications: [
        { condition: 'Respiratory tract infections', adult: true, child: true },
        { condition: 'Otitis media', adult: true, child: true },
        { condition: 'Urinary tract infections', adult: true, child: true },
        { condition: 'H. pylori eradication', adult: true, child: false },
        { condition: 'Dental infections', adult: true, child: true },
        { condition: 'Lyme disease', adult: true, child: true },
      ],
      dosages: [
        {
          indication: 'General infections',
          population: 'adult',
          route: 'oral',
          dose: '250-500 mg',
          frequency: 'three times daily',
          notes: 'Higher doses for severe infections',
        },
        {
          indication: 'General infections',
          population: 'child',
          route: 'oral',
          dose: '20-25 mg/kg',
          frequency: 'three times daily',
          max_dose: '500 mg three times daily',
        },
        {
          indication: 'Community-acquired pneumonia',
          population: 'adult',
          route: 'oral',
          dose: '500 mg-1 g',
          frequency: 'three times daily',
        },
      ],
      contraindications: [
        'Penicillin hypersensitivity',
      ],
      cautions: [
        'History of allergy',
        'Glandular fever (risk of rash)',
        'Lymphatic leukaemia (risk of rash)',
      ],
      renal_impairment: {
        severity_levels: {
          mild: 'No dose adjustment',
          moderate: 'No dose adjustment',
          severe: 'Reduce dose or extend interval; max 500 mg every 8 hours if eGFR <10',
        },
      },
      pregnancy: {
        category: 'no_known_harm',
        notes: 'Not known to be harmful',
      },
      breastfeeding: {
        recommendation: 'amount_too_small',
        notes: 'Trace amounts in milk but appropriate to use',
      },
      side_effects: {
        common: ['Nausea', 'Diarrhoea', 'Rash'],
        uncommon: ['Vomiting', 'Pruritus', 'Urticaria'],
        rare: ['Antibiotic-associated colitis', 'Anaphylaxis', 'Hepatitis'],
      },
      interactions: [
        {
          interacting_drug: 'Methotrexate',
          severity: BNFInteractionSeverity.MODERATE,
          effect: 'Reduced excretion of methotrexate',
          action: 'Monitor for methotrexate toxicity',
          evidence: 'study',
        },
        {
          interacting_drug: 'Warfarin',
          severity: BNFInteractionSeverity.MILD,
          effect: 'Possible increase in INR',
          action: 'Monitor INR during concurrent use',
          evidence: 'anecdotal',
        },
      ],
    },

    'nitrofurantoin': {
      drug_name: 'Nitrofurantoin',
      generic_name: 'nitrofurantoin',
      drug_class: 'Urinary tract anti-infectives',
      bnf_url: 'https://bnf.nice.org.uk/drugs/nitrofurantoin/',
      indications: [
        { condition: 'Lower urinary tract infection', adult: true, child: true },
        { condition: 'Prophylaxis of recurrent UTI', adult: true, child: true },
      ],
      dosages: [
        {
          indication: 'Acute uncomplicated UTI',
          population: 'adult',
          route: 'oral',
          dose: '50 mg',
          frequency: 'four times daily for 3 days',
          notes: 'Or 100 mg modified-release twice daily for 3 days',
        },
        {
          indication: 'Prophylaxis',
          population: 'adult',
          route: 'oral',
          dose: '50-100 mg',
          frequency: 'at night',
        },
      ],
      contraindications: [
        'G6PD deficiency',
        'Acute porphyria',
        'Renal impairment (eGFR <45)',
        'Infants less than 3 months',
      ],
      cautions: [
        'Anaemia',
        'Diabetes mellitus',
        'Electrolyte imbalance',
        'Vitamin B deficiency',
        'Pulmonary disease',
        'Hepatic impairment',
        'Elderly (risk of pulmonary reactions)',
      ],
      renal_impairment: {
        severity_levels: {
          mild: 'Use with caution; may be ineffective',
          moderate: 'Avoid if eGFR <45 - risk of peripheral neuropathy and ineffective',
          severe: 'CONTRAINDICATED',
        },
        notes: 'Antibacterial efficacy reduced in renal impairment',
      },
      pregnancy: {
        category: 'caution',
        trimester_specific: {
          third: 'Avoid at term - may cause neonatal haemolysis',
        },
        notes: 'Avoid at term; use in first and second trimester only if benefit outweighs risk',
      },
      breastfeeding: {
        recommendation: 'avoid',
        notes: 'Avoid - small amount present but could be harmful if infant has G6PD deficiency',
      },
      side_effects: {
        common: ['Nausea', 'Vomiting', 'Anorexia'],
        uncommon: ['Diarrhoea', 'Headache', 'Dizziness'],
        rare: ['Pulmonary reactions', 'Peripheral neuropathy', 'Hepatitis', 'Pancreatitis'],
      },
      interactions: [],
      prescribing_notes: [
        'Take with food to improve absorption and reduce GI side effects',
        'Monitor for pulmonary reactions with long-term use',
      ],
    },

    // ============ GI ============
    'omeprazole': {
      drug_name: 'Omeprazole',
      generic_name: 'omeprazole',
      drug_class: 'Proton pump inhibitors',
      bnf_url: 'https://bnf.nice.org.uk/drugs/omeprazole/',
      indications: [
        { condition: 'GORD', adult: true, child: true },
        { condition: 'Peptic ulcer disease', adult: true, child: true },
        { condition: 'H. pylori eradication', adult: true, child: false },
        { condition: 'Zollinger-Ellison syndrome', adult: true, child: false },
        { condition: 'NSAID-associated ulcer prophylaxis', adult: true, child: false },
      ],
      dosages: [
        {
          indication: 'GORD',
          population: 'adult',
          route: 'oral',
          dose: '20 mg',
          frequency: 'once daily for 4 weeks',
          max_dose: '40 mg once daily',
        },
        {
          indication: 'Peptic ulcer',
          population: 'adult',
          route: 'oral',
          dose: '20-40 mg',
          frequency: 'once daily',
          duration: '4-8 weeks',
        },
      ],
      contraindications: [],
      cautions: [
        'Risk of fractures with long-term use',
        'May mask symptoms of gastric cancer',
        'Risk of C. difficile infection',
        'Hypomagnesaemia with prolonged use',
      ],
      hepatic_impairment: {
        severity_levels: {
          mild: 'No dose adjustment',
          moderate: 'No dose adjustment; max 20 mg daily',
          severe: 'Max 20 mg daily',
        },
      },
      pregnancy: {
        category: 'no_known_harm',
        notes: 'Not known to be harmful',
      },
      breastfeeding: {
        recommendation: 'present_in_milk',
        notes: 'Present in milk but amount not known to be harmful',
      },
      side_effects: {
        common: ['Headache', 'GI disturbances', 'Abdominal pain'],
        uncommon: ['Dizziness', 'Insomnia', 'Rash', 'Peripheral oedema'],
        rare: ['Hypomagnesaemia', 'Bone fractures', 'C. difficile infection', 'Interstitial nephritis'],
      },
      interactions: [
        {
          interacting_drug: 'Clopidogrel',
          severity: BNFInteractionSeverity.MODERATE,
          effect: 'Reduced antiplatelet effect',
          action: 'Consider alternative PPI (pantoprazole, lansoprazole)',
          evidence: 'study',
        },
        {
          interacting_drug: 'Methotrexate',
          severity: BNFInteractionSeverity.MODERATE,
          effect: 'Increased methotrexate levels',
          action: 'Consider withholding PPI with high-dose methotrexate',
          evidence: 'study',
        },
      ],
      prescribing_notes: [
        'Review need for long-term PPI therapy regularly',
        'Consider step-down to lowest effective dose',
      ],
    },
    // ============ CORTICOSTEROIDS ============
    'prednisolone': {
      drug_name: 'Prednisolone',
      generic_name: 'prednisolone',
      drug_class: 'Corticosteroids',
      bnf_url: 'https://bnf.nice.org.uk/drugs/prednisolone/',
      indications: [
        { condition: 'Inflammatory and allergic disorders', adult: true, child: true },
        { condition: 'Asthma', adult: true, child: true },
        { condition: 'Autoimmune disease', adult: true, child: false },
        { condition: 'Rheumatic disease', adult: true, child: false },
        { condition: 'Inflammatory bowel disease', adult: true, child: true },
        { condition: 'Nephrotic syndrome', adult: true, child: true },
      ],
      dosages: [
        {
          population: 'adult',
          route: 'oral',
          dose: '10-20 mg',
          frequency: 'once daily',
          max_dose: '60 mg daily',
          notes: 'Dose depends on condition severity; taper gradually on withdrawal',
        },
        {
          population: 'adult',
          route: 'oral',
          dose: '40-50 mg',
          frequency: 'once daily',
          indication: 'Acute asthma exacerbation',
          duration: '5-7 days',
          notes: 'Short course; no need to taper if <3 weeks',
        },
        {
          population: 'child',
          route: 'oral',
          dose: '1-2 mg/kg',
          frequency: 'once daily',
          max_dose: '40 mg daily',
          notes: 'Use lowest effective dose for shortest period',
        },
      ],
      contraindications: [
        'Systemic infection (unless specific anti-infective therapy given)',
        'Live vaccines in immunosuppressed patients',
      ],
      cautions: [
        'Diabetes mellitus',
        'Hypertension',
        'Osteoporosis',
        'Peptic ulcer disease',
        'Glaucoma',
        'Psychiatric reactions',
        'Adrenal suppression with prolonged use',
        'Avoid abrupt withdrawal after prolonged use',
      ],
      hepatic_impairment: {
        severity_levels: {
          mild: 'Use with caution',
          moderate: 'Use with caution; dose adjustment may be needed',
          severe: 'Use with caution',
        },
      },
      pregnancy: {
        category: 'benefit_outweighs_risk',
        notes: 'Risk of intra-uterine growth restriction with prolonged/repeated use; monitor neonate for adrenal suppression',
      },
      breastfeeding: {
        recommendation: 'present_in_milk',
        notes: 'Unlikely to affect infant at doses up to 40 mg daily; monitor for adrenal suppression with higher doses',
      },
      side_effects: {
        common: ['Weight gain', 'Insomnia', 'Mood changes', 'Dyspepsia', 'Increased appetite'],
        uncommon: ['Hyperglycaemia', 'Osteoporosis', 'Muscle weakness', 'Skin thinning'],
        rare: ['Adrenal crisis on withdrawal', 'Avascular necrosis', 'Pancreatitis'],
      },
      interactions: [
        {
          interacting_drug: 'NSAIDs',
          severity: BNFInteractionSeverity.MODERATE,
          effect: 'Increased risk of GI bleeding and ulceration',
          action: 'Use gastroprotective agent if co-prescribed',
          evidence: 'study',
        },
        {
          interacting_drug: 'Warfarin',
          severity: BNFInteractionSeverity.MODERATE,
          effect: 'Enhanced anticoagulant effect',
          action: 'Monitor INR closely',
          evidence: 'study',
        },
      ],
      prescribing_notes: [
        'Withdraw gradually if taken for >3 weeks',
        'Consider bone protection with long-term use',
        'Carry steroid treatment card',
      ],
    },

    // ============ ANTIBIOTICS (COMBINATION) ============
    'co-amoxiclav': {
      drug_name: 'Co-amoxiclav',
      generic_name: 'amoxicillin with clavulanic acid',
      drug_class: 'Penicillins (broad-spectrum with beta-lactamase inhibitor)',
      bnf_url: 'https://bnf.nice.org.uk/drugs/co-amoxiclav/',
      indications: [
        { condition: 'Infections due to beta-lactamase-producing strains', adult: true, child: true },
        { condition: 'Urinary tract infections', adult: true, child: true },
        { condition: 'Upper respiratory tract infections', adult: true, child: true },
        { condition: 'Lower respiratory tract infections', adult: true, child: true },
        { condition: 'Skin and soft tissue infections', adult: true, child: true },
        { condition: 'Dental infections', adult: true, child: false },
        { condition: 'Bone and joint infections', adult: true, child: false },
      ],
      dosages: [
        {
          population: 'adult',
          route: 'oral',
          dose: '250/125 mg or 500/125 mg',
          frequency: 'three times daily',
          max_dose: '500/125 mg three times daily',
          notes: 'Dose expressed as co-amoxiclav (amoxicillin/clavulanic acid)',
        },
        {
          population: 'child',
          route: 'oral',
          dose: '0.25 ml/kg of 125/31 suspension',
          frequency: 'three times daily',
          age_range: { min_age: '1 month', max_age: '11 years' },
          notes: 'Doses expressed in terms of co-amoxiclav; use lower dose for mild infections',
        },
      ],
      contraindications: [
        'Penicillin hypersensitivity',
        'History of co-amoxiclav-associated jaundice or hepatic dysfunction',
      ],
      cautions: [
        'History of allergy',
        'Hepatic impairment (monitor liver function)',
        'Renal impairment (dose adjustment required)',
        'Erythematous rashes common in glandular fever',
        'Maintain adequate hydration with high doses',
      ],
      hepatic_impairment: {
        severity_levels: {
          mild: 'Monitor liver function',
          moderate: 'Monitor liver function; caution',
          severe: 'Use with caution; monitor liver function; cholestatic jaundice reported',
        },
      },
      renal_impairment: {
        severity_levels: {
          mild: 'No adjustment usually required',
          moderate: 'Use 250/125 or 500/125 twice daily if eGFR 10-30',
          severe: 'Use 250/125 or 500/125 once daily if eGFR <10',
        },
        dose_adjustment: 'Reduce dose frequency in severe renal impairment',
      },
      pregnancy: {
        category: 'no_known_harm',
        notes: 'Not known to be harmful; can be used in pregnancy when clearly indicated',
      },
      breastfeeding: {
        recommendation: 'amount_too_small',
        notes: 'Trace amounts in milk; appropriate to use',
      },
      side_effects: {
        common: ['Diarrhoea', 'Nausea', 'Vomiting', 'Candidiasis', 'Skin rashes'],
        uncommon: ['Dizziness', 'Headache', 'Urticaria', 'Pruritus'],
        rare: ['Hepatitis', 'Cholestatic jaundice', 'Stevens-Johnson syndrome', 'Antibiotic-associated colitis'],
      },
      interactions: [
        {
          interacting_drug: 'Warfarin',
          severity: BNFInteractionSeverity.MODERATE,
          effect: 'Enhanced anticoagulant effect',
          action: 'Monitor INR',
          evidence: 'anecdotal',
        },
        {
          interacting_drug: 'Methotrexate',
          severity: BNFInteractionSeverity.SEVERE,
          effect: 'Reduced excretion of methotrexate; increased toxicity risk',
          action: 'Avoid combination if possible',
          evidence: 'study',
        },
      ],
      prescribing_notes: [
        'Courses should not usually exceed 14 days',
        'Review treatment at 48-72 hours',
      ],
    },
  };

  // ============ DRUG SYNONYMS & ALIASES ============
  // Maps alternative names to the canonical key in DRUG_DATABASE
  private readonly DRUG_SYNONYMS: Record<string, string> = {
    'amoxicillin-clavulanic acid': 'co-amoxiclav',
    'amoxicillin/clavulanic acid': 'co-amoxiclav',
    'amoxicillin clavulanate': 'co-amoxiclav',
    'augmentin': 'co-amoxiclav',
    'amoxiclav': 'co-amoxiclav',
    'prednisolone sodium phosphate': 'prednisolone',
    'deltacortril': 'prednisolone',
    'brufen': 'ibuprofen',
    'nurofen': 'ibuprofen',
    'panadol': 'paracetamol',
    'calpol': 'paracetamol',
    'zithromax': 'azithromycin',
    'losec': 'omeprazole',
    'norvasc': 'amlodipine',
    'lipitor': 'atorvastatin',
    'zestril': 'lisinopril',
    'glucophage': 'metformin',
    'lustral': 'sertraline',
    'zoloft': 'sertraline',
    'ventolin': 'salbutamol',
    'diamicron': 'gliclazide',
    'macrobid': 'nitrofurantoin',
    'macrodantin': 'nitrofurantoin',
    'cardicor': 'bisoprolol',
  };

  // ============ KNOWN BNF DRUGS (loaded from NHS BNF SNOMED Mapping Data) ============
  // Contains 3000+ VTM (Virtual Therapeutic Moiety) names — every drug in the BNF.
  // Update with: node scripts/extract-bnf-drugs.js "path/to/new-BNF-SNOMED-file.xlsx"
  private readonly KNOWN_BNF_DRUGS: string[];
  private bnfDataVersion: string = 'unknown';

  constructor(
    @InjectModel('User') private readonly userModel: Model<any>,
  ) {
    // Load BNF VTM drug names from JSON (extracted from NHS BNF SNOMED Mapping Data)
    try {
      const dataPath = path.join(__dirname, '..', 'data', 'bnf-vtm-names.json');
      const rawData = fs.readFileSync(dataPath, 'utf-8');
      const parsed = JSON.parse(rawData);
      this.KNOWN_BNF_DRUGS = (parsed.drugs || []).map((d: string) => d.toLowerCase());
      this.bnfDataVersion = parsed.version || 'unknown';
      this.logger.log(`[BNF] Loaded ${this.KNOWN_BNF_DRUGS.length} VTM drug names (version: ${this.bnfDataVersion})`);
    } catch (e) {
      this.logger.warn('[BNF] Failed to load bnf-vtm-names.json — using empty list. Run: node scripts/extract-bnf-drugs.js');
      this.KNOWN_BNF_DRUGS = [];
    }
  }

  /**
   * Get comprehensive BNF drug information
   * Uses multi-level matching: exact → synonym → partial/fuzzy
   */
  getDrugInfo(drugName: string): BNFDrugInfo | null {
    const drugNameLower = drugName.toLowerCase().trim();

    // 1. Direct lookup by key
    if (this.DRUG_DATABASE[drugNameLower]) {
      return this.DRUG_DATABASE[drugNameLower];
    }

    // 2. Check synonym/alias map
    const synonym = this.DRUG_SYNONYMS[drugNameLower];
    if (synonym && this.DRUG_DATABASE[synonym]) {
      return this.DRUG_DATABASE[synonym];
    }

    // 3. Match by generic_name or drug_name in database entries
    for (const drug of Object.values(this.DRUG_DATABASE)) {
      if (drug.generic_name.toLowerCase() === drugNameLower ||
          drug.drug_name.toLowerCase() === drugNameLower) {
        return drug;
      }
    }

    // 4. Partial match - check if search term contains a known drug name or vice versa
    // Handles cases like "Amoxicillin-Clavulanic acid" matching "co-amoxiclav"
    for (const [key, drug] of Object.entries(this.DRUG_DATABASE)) {
      const genericLower = drug.generic_name.toLowerCase();
      if (drugNameLower.includes(key) || key.includes(drugNameLower) ||
          drugNameLower.includes(genericLower) || genericLower.includes(drugNameLower)) {
        return drug;
      }
    }

    // 5. Check synonyms with partial matching
    for (const [alias, canonical] of Object.entries(this.DRUG_SYNONYMS)) {
      if (drugNameLower.includes(alias) || alias.includes(drugNameLower)) {
        if (this.DRUG_DATABASE[canonical]) {
          return this.DRUG_DATABASE[canonical];
        }
      }
    }

    // 6. Component matching - split by hyphens/spaces and check individual components
    const components = drugNameLower.split(/[\s\-\/\+]+/).filter(c => c.length > 3);
    for (const component of components) {
      if (this.DRUG_DATABASE[component]) {
        return this.DRUG_DATABASE[component];
      }
      for (const drug of Object.values(this.DRUG_DATABASE)) {
        if (drug.generic_name.toLowerCase().includes(component) && component.length > 4) {
          return drug;
        }
      }
    }

    return null;
  }

  /**
   * Check if a drug is known to be listed in the BNF, even without full data
   */
  isKnownBNFDrug(drugName: string): boolean {
    const lower = drugName.toLowerCase().trim();

    // Check full database first
    if (this.getDrugInfo(drugName)) return true;

    // Check known drugs list with flexible matching
    return this.KNOWN_BNF_DRUGS.some(d =>
      d === lower ||
      lower.includes(d) ||
      d.includes(lower) ||
      lower.split(/[\s\-\/\+]+/).some(part => part.length > 3 && d.includes(part))
    );
  }

  /**
   * Validate a drug prescription against BNF guidelines
   */
  async validateDrug(
    drugName: string,
    indication?: string,
    dosage?: string,
    population?: 'adult' | 'child' | 'elderly',
  ): Promise<BNFValidationResult> {
    this.logger.log(`[BNF] Validating ${drugName} for ${indication || 'general use'}`);

    const drugInfo = this.getDrugInfo(drugName);

    if (!drugInfo) {
      // Check if drug is known to be in BNF even without full prescribing data
      const isKnown = this.isKnownBNFDrug(drugName);
      if (isKnown) {
        this.logger.log(`[BNF] ${drugName}: Recognised as BNF-listed drug (limited validation data available)`);
      }
      return {
        drug_name: drugName,
        found_in_bnf: isKnown,
        uk_approved: isKnown,
        indications_checked: [],
        indication_match: false,
        dosage_appropriate: true, // Can't validate without detailed data
        dosage_warnings: isKnown ? [] : [`${drugName} not found in our BNF database. Manual verification recommended.`],
        cautions: [],
        contraindication_flags: [],
        interaction_alerts: [],
        special_population_warnings: [],
        bnf_url: isKnown ? `https://bnf.nice.org.uk/drugs/${drugName.toLowerCase().replace(/\s+/g, '-')}/` : undefined,
        validation_timestamp: new Date(),
      };
    }

    const warnings: string[] = [];
    const cautions: string[] = [...drugInfo.cautions];
    const contraindications: string[] = [];
    const specialWarnings: string[] = [];
    let indicationMatch = false;
    let dosageAppropriate = true;

    // Check indication
    if (indication) {
      const indicationLower = indication.toLowerCase();
      for (const ind of drugInfo.indications) {
        if (ind.condition.toLowerCase().includes(indicationLower) ||
            indicationLower.includes(ind.condition.toLowerCase())) {
          indicationMatch = true;
          if (ind.specialist_only) {
            warnings.push(`${ind.condition}: Specialist supervision recommended`);
          }
          break;
        }
      }

      if (!indicationMatch) {
        warnings.push(`${drugName} is not typically indicated for ${indication} in BNF`);
      }
    }

    // Check dosage
    if (dosage) {
      const dosageMatch = dosage.match(/(\d+(?:\.\d+)?)\s*(mg|mcg|g|ml)/i);
      if (dosageMatch) {
        const doseValue = parseFloat(dosageMatch[1]);
        const relevantDosages = drugInfo.dosages.filter(d =>
          !population || d.population === population || d.population === 'adult'
        );

        for (const bnfDosage of relevantDosages) {
          if (bnfDosage.max_dose) {
            const maxMatch = bnfDosage.max_dose.match(/(\d+(?:\.\d+)?)/);
            if (maxMatch && doseValue > parseFloat(maxMatch[1])) {
              dosageAppropriate = false;
              warnings.push(`Dose ${dosage} exceeds BNF maximum: ${bnfDosage.max_dose}`);
            }
          }
        }
      }
    }

    // Population-specific warnings
    if (population === 'elderly') {
      if (drugInfo.cautions.some(c => c.toLowerCase().includes('elderly'))) {
        specialWarnings.push('Use with caution in elderly patients');
      }
      if (drugInfo.dosages.some(d => d.population === 'elderly')) {
        const elderlyDosage = drugInfo.dosages.find(d => d.population === 'elderly');
        if (elderlyDosage) {
          specialWarnings.push(`Elderly dosing: ${elderlyDosage.dose} ${elderlyDosage.frequency}`);
        }
      }
    }

    if (population === 'child') {
      const childIndications = drugInfo.indications.filter(i => i.child);
      if (childIndications.length === 0) {
        specialWarnings.push(`${drugName} may not be suitable for children - check BNF for Children`);
      }
    }

    return {
      drug_name: drugName,
      found_in_bnf: true,
      uk_approved: true,
      indications_checked: drugInfo.indications.map(i => i.condition),
      indication_match: indicationMatch || !indication,
      dosage_appropriate: dosageAppropriate,
      dosage_warnings: warnings,
      cautions,
      contraindication_flags: drugInfo.contraindications,
      interaction_alerts: drugInfo.interactions,
      special_population_warnings: specialWarnings,
      bnf_url: drugInfo.bnf_url,
      validation_timestamp: new Date(),
    };
  }

  /**
   * Check drug interactions
   */
  checkInteractions(drugName: string, otherDrugs: string[]): BNFInteraction[] {
    const drugInfo = this.getDrugInfo(drugName);
    if (!drugInfo) return [];

    const alerts: BNFInteraction[] = [];

    for (const otherDrug of otherDrugs) {
      const otherLower = otherDrug.toLowerCase();
      for (const interaction of drugInfo.interactions) {
        if (interaction.interacting_drug.toLowerCase().includes(otherLower) ||
            otherLower.includes(interaction.interacting_drug.toLowerCase())) {
          alerts.push(interaction);
        }
      }
    }

    return alerts;
  }

  /**
   * Get pregnancy/breastfeeding information
   */
  getReproductiveInfo(drugName: string): {
    pregnancy?: BNFDrugInfo['pregnancy'];
    breastfeeding?: BNFDrugInfo['breastfeeding'];
  } | null {
    const drugInfo = this.getDrugInfo(drugName);
    if (!drugInfo) return null;

    return {
      pregnancy: drugInfo.pregnancy,
      breastfeeding: drugInfo.breastfeeding,
    };
  }

  /**
   * Get organ impairment guidance
   */
  getOrganImpairmentGuidance(drugName: string, organ: 'renal' | 'hepatic'): {
    guidance: BNFDrugInfo['renal_impairment'] | BNFDrugInfo['hepatic_impairment'];
    found: boolean;
  } {
    const drugInfo = this.getDrugInfo(drugName);
    if (!drugInfo) {
      return { guidance: undefined, found: false };
    }

    const guidance = organ === 'renal' ? drugInfo.renal_impairment : drugInfo.hepatic_impairment;
    return { guidance, found: !!guidance };
  }

  /**
   * Get side effects by frequency
   */
  getSideEffects(drugName: string): BNFSideEffects | null {
    const drugInfo = this.getDrugInfo(drugName);
    return drugInfo?.side_effects || null;
  }

  /**
   * Build compliance summary for multiple drugs
   */
  buildComplianceSummary(validationResults: BNFValidationResult[]): BNFComplianceSummary {
    const ukApproved = validationResults.filter(r => r.uk_approved).length;
    const notApproved = validationResults.filter(r => !r.found_in_bnf).map(r => r.drug_name);
    const dosageWarnings = validationResults.reduce((sum, r) => sum + r.dosage_warnings.length, 0);
    const cautionFlags = validationResults.reduce((sum, r) => sum + r.cautions.length, 0);
    const interactionAlerts = validationResults.reduce((sum, r) => sum + r.interaction_alerts.length, 0);

    const hasIssues = notApproved.length > 0 || dosageWarnings > 0 ||
      validationResults.some(r => r.interaction_alerts.some(i => i.severity === BNFInteractionSeverity.SEVERE));

    let warning: string | undefined;
    if (notApproved.length > 0) {
      warning = `${notApproved.length} drug(s) not in our BNF database: ${notApproved.join(', ')}. Manual BNF verification recommended.`;
    } else if (dosageWarnings > 0) {
      warning = `${dosageWarnings} dosage warning(s) identified. Review against BNF recommendations.`;
    }

    return {
      total_drugs_checked: validationResults.length,
      uk_approved_count: ukApproved,
      not_uk_approved: notApproved,
      dosage_warnings_count: dosageWarnings,
      caution_flags_count: cautionFlags,
      interaction_alerts_count: interactionAlerts,
      has_uk_compliance_issues: hasIssues,
      warning,
    };
  }

  /**
   * Compare FDA and BNF data for a drug
   */
  compareFDABNF(drugName: string, fdaData?: any): BNFFDAComparison {
    const bnfInfo = this.getDrugInfo(drugName);

    return {
      drug_name: drugName,
      fda_approved: !!fdaData,
      bnf_approved: !!bnfInfo,
      indication_differences: {
        fda_only: [],
        bnf_only: bnfInfo?.indications.map(i => i.condition) || [],
        both: [],
      },
      dosage_differences: [],
      additional_bnf_cautions: bnfInfo?.cautions || [],
      additional_bnf_interactions: bnfInfo?.interactions.map(i => `${i.interacting_drug}: ${i.effect}`) || [],
    };
  }

  /**
   * Get all available drugs in the database
   */
  getAvailableDrugs(): string[] {
    return Object.keys(this.DRUG_DATABASE);
  }

  /**
   * Check if drug is in BNF database
   */
  isInBNF(drugName: string): boolean {
    return !!this.getDrugInfo(drugName);
  }
}
