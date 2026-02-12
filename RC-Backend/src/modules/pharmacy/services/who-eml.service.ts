import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import {
  WHOEMLMedicine,
  WHOEMLData,
  WHOEMLValidationResult,
  WHOEMLComplianceSummary,
  WHOEMLFormulation,
} from '../dto/who-eml.dto';

/**
 * WHO Essential Medicines List (EML) Service
 *
 * Validates drug suggestions against the WHO Model List of Essential Medicines.
 * Contains 667 unique medicines with 1,417 recommendations including INN names,
 * ATC codes, ICD-11 codes, formulations, list types (Core/Complementary),
 * indications, and age groups.
 *
 * Particularly valuable for the Nigerian/African specialist user base
 * where WHO guidelines are the primary clinical reference.
 */
@Injectable()
export class WHOEMLService {
  private readonly logger = new Logger(WHOEMLService.name);

  // In-memory indices for fast lookups
  private DRUG_INDEX: Map<string, WHOEMLMedicine> = new Map();
  private ATC_INDEX: Map<string, WHOEMLMedicine[]> = new Map();
  private DRUG_NAMES: Set<string> = new Set();
  private emlData: WHOEMLData | null = null;

  // Common drug name synonyms: brand/alternative name → INN
  private readonly DRUG_SYNONYMS: Map<string, string> = new Map([
    // Analgesics
    ['acetaminophen', 'paracetamol'],
    ['tylenol', 'paracetamol'],
    ['panadol', 'paracetamol'],
    ['aspirin', 'acetylsalicylic acid'],
    ['disprin', 'acetylsalicylic acid'],
    ['brufen', 'ibuprofen'],
    ['advil', 'ibuprofen'],
    ['nurofen', 'ibuprofen'],
    ['motrin', 'ibuprofen'],

    // Respiratory
    ['albuterol', 'salbutamol'],
    ['ventolin', 'salbutamol'],
    ['proventil', 'salbutamol'],
    ['proair', 'salbutamol'],
    ['atrovent', 'ipratropium bromide'],
    ['spiriva', 'tiotropium'],
    ['singulair', 'montelukast'],
    ['pulmicort', 'budesonide'],
    ['qvar', 'beclometasone'],

    // Antibiotics
    ['augmentin', 'amoxicillin + clavulanic acid'],
    ['co-amoxiclav', 'amoxicillin + clavulanic acid'],
    ['amoxyclav', 'amoxicillin + clavulanic acid'],
    ['amoklavin', 'amoxicillin + clavulanic acid'],
    ['zithromax', 'azithromycin'],
    ['z-pack', 'azithromycin'],
    ['cipro', 'ciprofloxacin'],
    ['flagyl', 'metronidazole'],
    ['bactrim', 'sulfamethoxazole + trimethoprim'],
    ['septrin', 'sulfamethoxazole + trimethoprim'],
    ['co-trimoxazole', 'sulfamethoxazole + trimethoprim'],
    ['cotrimoxazole', 'sulfamethoxazole + trimethoprim'],
    ['macrobid', 'nitrofurantoin'],
    ['klacid', 'clarithromycin'],
    ['biaxin', 'clarithromycin'],
    ['erythrocin', 'erythromycin'],
    ['vibramycin', 'doxycycline'],
    ['dalacin', 'clindamycin'],
    ['cleocin', 'clindamycin'],
    ['rocephin', 'ceftriaxone'],
    ['vancocin', 'vancomycin'],
    ['zyvox', 'linezolid'],

    // Cardiovascular
    ['norvasc', 'amlodipine'],
    ['tenormin', 'bisoprolol'],
    ['concor', 'bisoprolol'],
    ['zestril', 'lisinopril'],
    ['prinivil', 'lisinopril'],
    ['vasotec', 'enalapril'],
    ['cozaar', 'losartan'],
    ['hyzaar', 'losartan'],
    ['lipitor', 'atorvastatin'],
    ['zocor', 'simvastatin'],
    ['lasix', 'furosemide'],
    ['frusemide', 'furosemide'],
    ['aldactone', 'spironolactone'],
    ['lanoxin', 'digoxin'],
    ['cordarone', 'amiodarone'],
    ['plavix', 'clopidogrel'],
    ['coumadin', 'warfarin'],
    ['marevan', 'warfarin'],
    ['clexane', 'enoxaparin'],
    ['lovenox', 'enoxaparin'],
    ['pradaxa', 'dabigatran'],
    ['xarelto', 'rivaroxaban'],
    ['eliquis', 'apixaban'],
    ['entresto', 'sacubitril + valsartan'],
    ['coreg', 'carvedilol'],
    ['aldomet', 'methyldopa'],

    // Diabetes
    ['glucophage', 'metformin'],
    ['humulin', 'insulin injection'],
    ['novolin', 'insulin injection'],
    ['lantus', 'long-acting insulin'],
    ['levemir', 'long-acting insulin'],
    ['nph insulin', 'intermediate-acting insulin'],

    // GI
    ['prilosec', 'omeprazole'],
    ['losec', 'omeprazole'],
    ['zantac', 'ranitidine'],
    ['maxolon', 'metoclopramide'],
    ['zofran', 'ondansetron'],
    ['imodium', 'loperamide'],

    // Psychotropic
    ['prozac', 'fluoxetine'],
    ['zoloft', 'sertraline'],
    ['lustral', 'sertraline'],
    ['elavil', 'amitriptyline'],
    ['tryptizol', 'amitriptyline'],
    ['haldol', 'haloperidol'],
    ['serenace', 'haloperidol'],
    ['largactil', 'chlorpromazine'],
    ['thorazine', 'chlorpromazine'],
    ['risperdal', 'risperidone'],
    ['clozaril', 'clozapine'],
    ['valium', 'diazepam'],
    ['ritalin', 'methylphenidate'],
    ['concerta', 'methylphenidate'],
    ['suboxone', 'buprenorphine'],
    ['tegretol', 'carbamazepine'],
    ['epilim', 'valproic acid'],
    ['depakote', 'valproic acid'],
    ['lamictal', 'lamotrigine'],
    ['keppra', 'levetiracetam'],
    ['dilantin', 'phenytoin'],

    // Corticosteroids
    ['decadron', 'dexamethasone'],
    ['solu-cortef', 'hydrocortisone'],
    ['pred', 'prednisolone'],
    ['deltasone', 'prednisolone'],

    // Antivirals
    ['zovirax', 'aciclovir'],
    ['valtrex', 'valaciclovir'],
    ['tamiflu', 'oseltamivir'],

    // Antifungals
    ['diflucan', 'fluconazole'],
    ['canesten', 'clotrimazole'],
    ['sporanox', 'itraconazole'],
    ['vfend', 'voriconazole'],

    // Antimalarials
    ['coartem', 'artemether + lumefantrine'],
    ['arinate', 'artesunate'],
    ['chloroquine phosphate', 'chloroquine'],
    ['nivaquine', 'chloroquine'],
    ['lariam', 'mefloquine'],
    ['primaquine phosphate', 'primaquine'],
    ['fansidar', 'sulfadoxine + pyrimethamine'],

    // Anti-TB
    ['myambutol', 'ethambutol'],
    ['rifadin', 'rifampicin'],
    ['rimactane', 'rifampicin'],
    ['sirturo', 'bedaquiline'],

    // Immunosuppressants/oncology
    ['imuran', 'azathioprine'],
    ['sandimmun', 'ciclosporin'],
    ['neoral', 'ciclosporin'],
    ['cellcept', 'mycophenolate mofetil'],
    ['gleevec', 'imatinib'],
    ['glivec', 'imatinib'],
    ['herceptin', 'trastuzumab'],
    ['rituxan', 'rituximab'],
    ['mabthera', 'rituximab'],
    ['keytruda', 'pembrolizumab'],
    ['opdivo', 'nivolumab'],
    ['nolvadex', 'tamoxifen'],
    ['arimidex', 'anastrozole'],
    ['casodex', 'bicalutamide'],
    ['zytiga', 'abiraterone'],
    ['xtandi', 'enzalutamide'],
    ['lupron', 'leuprorelin'],
    ['revlimid', 'lenalidomide'],
    ['velcade', 'bortezomib'],
    ['tarceva', 'erlotinib'],
    ['tagrisso', 'osimertinib'],
    ['imbruvica', 'ibrutinib'],
    ['avastin', 'bevacizumab'],
    ['adcetris', 'brentuximab vedotin'],
    ['sprycel', 'dasatinib'],
    ['tasigna', 'nilotinib'],

    // Thyroid
    ['synthroid', 'levothyroxine'],
    ['eltroxin', 'levothyroxine'],

    // Hormones
    ['premarin', 'estrogen'],
    ['depo-provera', 'medroxyprogesterone acetate'],
    ['implanon', 'etonogestrel-releasing implant'],
    ['nexplanon', 'etonogestrel-releasing implant'],
    ['mirena', 'levonorgestrel-releasing intrauterine system'],
    ['clomid', 'clomifene'],
    ['serophene', 'clomifene'],

    // Anaesthetics
    ['xylocaine', 'lidocaine'],
    ['lignocaine', 'lidocaine'],
    ['marcaine', 'bupivacaine'],
    ['diprivan', 'propofol'],
    ['dormicum', 'midazolam'],
    ['versed', 'midazolam'],

    // Antidotes
    ['narcan', 'naloxone'],
    ['mucomyst', 'acetylcysteine'],

    // Dermatological
    ['betnovate', 'betamethasone valerate'],
    ['lamisil', 'terbinafine'],
    ['daktarin', 'miconazole'],
    ['bactroban', 'mupirocin'],

    // Ophthalmic
    ['timoptol', 'timolol'],
    ['xalatan', 'latanoprost'],
    ['diamox', 'acetazolamide'],

    // Reproductive
    ['pitocin', 'oxytocin'],
    ['syntocinon', 'oxytocin'],
    ['cytotec', 'misoprostol'],
    ['mifegyne', 'mifepristone'],

    // Others
    ['zyloprim', 'allopurinol'],
    ['plaquenil', 'hydroxychloroquine'],
    ['colcrys', 'colchicine'],
    ['neulasta', 'filgrastim'],
    ['neupogen', 'filgrastim'],
    ['epogen', 'erythropoietin'],
    ['eprex', 'erythropoietin'],
    ['adalat', 'nifedipine'],
    ['procardia', 'nifedipine'],
    ['atenolol', 'bisoprolol'],
    ['metoprolol', 'bisoprolol'],
  ]);

  constructor() {
    this.loadEMLData();
  }

  /**
   * Load WHO EML data from JSON file into memory indices
   */
  private loadEMLData(): void {
    try {
      const dataPath = path.join(__dirname, '..', 'data', 'who-eml-drugs.json');
      const rawData = fs.readFileSync(dataPath, 'utf-8');
      this.emlData = JSON.parse(rawData) as WHOEMLData;

      // Build DRUG_INDEX: lowercase INN → medicine
      for (const medicine of this.emlData.medicines) {
        const key = medicine.inn.toLowerCase().trim();
        this.DRUG_INDEX.set(key, medicine);
        this.DRUG_NAMES.add(key);

        // Build ATC_INDEX
        if (medicine.atc_code) {
          const atcKey = medicine.atc_code.toUpperCase();
          if (!this.ATC_INDEX.has(atcKey)) {
            this.ATC_INDEX.set(atcKey, []);
          }
          this.ATC_INDEX.get(atcKey)!.push(medicine);
        }
      }

      this.logger.log(
        `WHO EML data loaded: ${this.DRUG_INDEX.size} medicines, ${this.ATC_INDEX.size} ATC codes`,
      );
    } catch (error) {
      this.logger.error('Failed to load WHO EML data:', error.message);
      this.emlData = null;
    }
  }

  /**
   * Get full medicine info by drug name (multi-level matching)
   * 1. Direct INN match
   * 2. Synonym lookup
   * 3. Partial match
   * 4. Component split for combination drugs
   */
  getMedicineInfo(drugName: string): WHOEMLMedicine | null {
    if (!drugName) return null;

    const normalized = drugName.toLowerCase().trim();

    // 1. Direct INN match
    if (this.DRUG_INDEX.has(normalized)) {
      return this.DRUG_INDEX.get(normalized)!;
    }

    // 2. Synonym lookup
    const synonym = this.DRUG_SYNONYMS.get(normalized);
    if (synonym && this.DRUG_INDEX.has(synonym)) {
      return this.DRUG_INDEX.get(synonym)!;
    }

    // 3. Partial match — check if drug name contains or is contained by a known INN
    for (const [inn, medicine] of this.DRUG_INDEX) {
      if (normalized.includes(inn) || inn.includes(normalized)) {
        return medicine;
      }
    }

    // 4. Component split for combination drugs (e.g., "amoxicillin/clavulanate")
    const separators = [' + ', '/', ' and ', '-'];
    for (const sep of separators) {
      if (normalized.includes(sep)) {
        const components = normalized.split(sep).map((c) => c.trim());
        for (const component of components) {
          const match = this.DRUG_INDEX.get(component);
          if (match) return match;

          const synMatch = this.DRUG_SYNONYMS.get(component);
          if (synMatch && this.DRUG_INDEX.has(synMatch)) {
            return this.DRUG_INDEX.get(synMatch)!;
          }
        }
      }
    }

    return null;
  }

  /**
   * Quick check if a drug is in the WHO EML
   */
  isInEML(drugName: string): boolean {
    return this.getMedicineInfo(drugName) !== null;
  }

  /**
   * Validate a single drug against the WHO EML
   */
  validateDrug(
    drugName: string,
    indication?: string,
    ageGroup?: string,
  ): WHOEMLValidationResult {
    const medicine = this.getMedicineInfo(drugName);

    if (!medicine) {
      return {
        drug_name: drugName,
        found_in_eml: false,
        matching_indications: [],
        formulations: [],
        age_group_appropriate: true, // Can't determine, default to true
        validation_timestamp: new Date(),
      };
    }

    // Find matching indications
    const matchingIndications: string[] = [];
    const matchingFormulations: WHOEMLFormulation[] = [];
    let ageGroupAppropriate = true;

    for (const ind of medicine.indications) {
      // Check indication match
      if (indication) {
        const indicationLower = indication.toLowerCase();
        const indNameLower = ind.indication.toLowerCase();

        if (
          indicationLower.includes(indNameLower) ||
          indNameLower.includes(indicationLower) ||
          this.indicationsRelated(indicationLower, indNameLower)
        ) {
          matchingIndications.push(ind.indication);
          matchingFormulations.push(...ind.formulations);
        }
      } else {
        // No specific indication to match — include all
        if (ind.indication) {
          matchingIndications.push(ind.indication);
        }
        matchingFormulations.push(...ind.formulations);
      }

      // Check age group appropriateness
      if (ageGroup && ind.age_group !== 'all') {
        const normalizedAge = ageGroup.toLowerCase();
        if (
          (normalizedAge === 'child' || normalizedAge === 'pediatric') &&
          ind.age_group === 'adult'
        ) {
          ageGroupAppropriate = false;
        }
      }
    }

    // Deduplicate formulations
    const uniqueFormulations = this.deduplicateFormulations(matchingFormulations);

    return {
      drug_name: drugName,
      found_in_eml: true,
      list_type: medicine.list_type,
      atc_code: medicine.atc_code,
      section: medicine.section,
      category: medicine.category,
      matching_indications: [...new Set(matchingIndications)],
      formulations: uniqueFormulations,
      age_group_appropriate: ageGroupAppropriate,
      validation_timestamp: new Date(),
    };
  }

  /**
   * Build aggregate compliance summary from multiple validation results
   */
  buildComplianceSummary(
    results: WHOEMLValidationResult[],
  ): WHOEMLComplianceSummary {
    if (!results || results.length === 0) {
      return {
        total_drugs_checked: 0,
        eml_listed_count: 0,
        core_count: 0,
        complementary_count: 0,
        not_in_eml: [],
        has_eml_issues: false,
      };
    }

    const found = results.filter((r) => r.found_in_eml);
    const notFound = results.filter((r) => !r.found_in_eml);
    const core = found.filter((r) => r.list_type === 'core');
    const complementary = found.filter((r) => r.list_type === 'complementary');

    const hasIssues = notFound.length > 0;
    let warning: string | undefined;

    if (notFound.length > 0) {
      const names = notFound.map((r) => r.drug_name).join(', ');
      warning = `${notFound.length} drug${notFound.length !== 1 ? 's' : ''} not in WHO Essential Medicines List: ${names}`;
    }

    return {
      total_drugs_checked: results.length,
      eml_listed_count: found.length,
      core_count: core.length,
      complementary_count: complementary.length,
      not_in_eml: notFound.map((r) => r.drug_name),
      has_eml_issues: hasIssues,
      warning,
    };
  }

  /**
   * Get version info about the loaded EML data
   */
  getVersion(): string {
    return this.emlData?.version || 'Unknown';
  }

  /**
   * Get total number of medicines in the database
   */
  getTotalMedicines(): number {
    return this.DRUG_INDEX.size;
  }

  /**
   * Get all available drug names
   */
  getAvailableDrugs(): string[] {
    return Array.from(this.DRUG_NAMES);
  }

  /**
   * Look up medicines by ATC code
   */
  getMedicinesByATCCode(atcCode: string): WHOEMLMedicine[] {
    return this.ATC_INDEX.get(atcCode.toUpperCase()) || [];
  }

  // ========== Private Helpers ==========

  /**
   * Check if two indication strings are related
   * Handles common variations: "Type 2 diabetes" ↔ "diabetes mellitus"
   */
  private indicationsRelated(a: string, b: string): boolean {
    const relatedTerms: [string, string[]][] = [
      ['diabetes', ['diabetes mellitus', 'type 2 diabetes', 'type 1 diabetes', 'hyperglycemia', 'hyperglycaemia']],
      ['hypertension', ['high blood pressure', 'elevated blood pressure', 'essential hypertension']],
      ['pneumonia', ['lower respiratory tract infection', 'community-acquired pneumonia', 'bacterial pneumonia']],
      ['malaria', ['plasmodium falciparum', 'plasmodium vivax', 'uncomplicated malaria', 'severe malaria']],
      ['tuberculosis', ['tb', 'pulmonary tuberculosis', 'extrapulmonary tuberculosis']],
      ['hiv', ['hiv/aids', 'hiv infection', 'human immunodeficiency virus']],
      ['depression', ['major depressive disorder', 'depressive disorder', 'major depression']],
      ['epilepsy', ['seizure', 'seizure disorder', 'convulsions']],
      ['asthma', ['bronchial asthma', 'reactive airway disease', 'bronchospasm']],
      ['pain', ['acute pain', 'chronic pain', 'nociceptive pain', 'moderate pain', 'severe pain']],
      ['infection', ['bacterial infection', 'acute infection']],
      ['heart failure', ['congestive heart failure', 'cardiac failure', 'chf']],
      ['anxiety', ['anxiety disorder', 'generalised anxiety', 'generalized anxiety']],
      ['cancer', ['malignancy', 'neoplasm', 'carcinoma', 'tumour', 'tumor']],
    ];

    for (const [key, variants] of relatedTerms) {
      const aMatch = a.includes(key) || variants.some((v) => a.includes(v));
      const bMatch = b.includes(key) || variants.some((v) => b.includes(v));
      if (aMatch && bMatch) return true;
    }

    return false;
  }

  /**
   * Deduplicate formulations by route + form + strength
   */
  private deduplicateFormulations(
    formulations: WHOEMLFormulation[],
  ): WHOEMLFormulation[] {
    const seen = new Set<string>();
    const unique: WHOEMLFormulation[] = [];

    for (const f of formulations) {
      const key = `${f.route}|${f.form}|${f.strength}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(f);
      }
    }

    return unique;
  }
}
