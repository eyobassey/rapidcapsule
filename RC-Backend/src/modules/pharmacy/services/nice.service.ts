import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  NICESearchParams,
  NICEGuideline,
  NICEGuidelineType,
  NICETreatmentRecommendation,
  NICEEvidenceStrength,
  NICEValidationResult,
  NICEConditionGuidance,
  NICEComplianceSummary,
  NICESearchResponse,
} from '../dto/nice.dto';

/**
 * NICE Guidelines Service
 * Validates treatments against UK National Institute for Health and Care Excellence guidelines
 *
 * NICE provides evidence-based guidance for healthcare in England and Wales.
 * This service searches NICE guidelines and validates drug recommendations.
 *
 * API Documentation: https://developer.nice.org.uk/
 */
@Injectable()
export class NICEService {
  private readonly logger = new Logger(NICEService.name);
  private readonly BASE_URL = 'https://www.nice.org.uk';
  private readonly SEARCH_API = 'https://www.nice.org.uk/api/search';
  private readonly CACHE_DURATION_HOURS = 48; // Cache guidelines for 48 hours
  private readonly REQUEST_DELAY_MS = 500; // Rate limiting
  private lastRequestTime = 0;

  // In-memory cache for guidelines
  private guidelineCache: Map<string, { data: any; expires: Date }> = new Map();

  // Common condition-to-guideline mappings for faster lookups
  private readonly CONDITION_GUIDELINE_MAP: Record<string, string[]> = {
    // Cardiovascular
    'hypertension': ['NG136', 'CG127'],
    'high blood pressure': ['NG136', 'CG127'],
    'heart failure': ['NG106', 'CG108'],
    'atrial fibrillation': ['NG196', 'CG180'],
    'chest pain': ['CG95'],
    'acute coronary syndrome': ['NG185'],

    // Diabetes
    'type 2 diabetes': ['NG28', 'NG87'],
    'type 1 diabetes': ['NG17', 'NG18'],
    'diabetes': ['NG28', 'NG17'],

    // Respiratory
    'asthma': ['NG80', 'BTS/SIGN'],
    'copd': ['NG115'],
    'chronic obstructive pulmonary disease': ['NG115'],

    // Mental Health
    'depression': ['NG222', 'CG90'],
    'anxiety': ['CG113'],
    'bipolar disorder': ['CG185'],
    'schizophrenia': ['CG178'],

    // Infections
    'urinary tract infection': ['NG109', 'NG113'],
    'uti': ['NG109', 'NG113'],
    'respiratory tract infection': ['NG120'],
    'sinusitis': ['NG79'],
    'acute sinusitis': ['NG79'],
    'acute bacterial sinusitis': ['NG79'],
    'skin infection': ['NG141'],
    'otitis media': ['NG91'],
    'sore throat': ['NG84'],
    'acute pharyngitis': ['NG84'],
    'pneumonia': ['CG191'],
    'cellulitis': ['NG141'],

    // Pain
    'chronic pain': ['NG193'],
    'neuropathic pain': ['CG173'],
    'back pain': ['NG59'],
    'headache': ['CG150'],
    'migraine': ['CG150'],

    // Gastrointestinal
    'gerd': ['CG184'],
    'gastroesophageal reflux': ['CG184'],
    'ibs': ['CG61'],
    'irritable bowel syndrome': ['CG61'],

    // Rheumatology
    'rheumatoid arthritis': ['NG100'],
    'osteoarthritis': ['CG177'],
    'gout': ['CG166'],

    // Other
    'epilepsy': ['CG137'],
    'osteoporosis': ['CG146'],
    'dementia': ['NG97'],
    'pregnancy': ['CG62', 'NG121'],
  };

  // Known drug-condition recommendations from NICE
  private readonly DRUG_RECOMMENDATIONS: Record<string, {
    conditions: string[];
    recommendation: 'recommended' | 'consider' | 'do_not_offer' | 'caution';
    line?: 'first_line' | 'second_line' | 'third_line';
    notes?: string;
    guideline?: string;
  }[]> = {
    // Hypertension
    'amlodipine': [
      { conditions: ['hypertension'], recommendation: 'recommended', line: 'first_line', guideline: 'NG136' },
    ],
    'lisinopril': [
      { conditions: ['hypertension'], recommendation: 'recommended', line: 'first_line', guideline: 'NG136' },
      { conditions: ['heart failure'], recommendation: 'recommended', line: 'first_line', guideline: 'NG106' },
    ],
    'ramipril': [
      { conditions: ['hypertension'], recommendation: 'recommended', line: 'first_line', guideline: 'NG136' },
      { conditions: ['heart failure'], recommendation: 'recommended', line: 'first_line', guideline: 'NG106' },
    ],
    'losartan': [
      { conditions: ['hypertension'], recommendation: 'recommended', line: 'first_line', guideline: 'NG136' },
    ],

    // Diabetes
    'metformin': [
      { conditions: ['type 2 diabetes', 'diabetes'], recommendation: 'recommended', line: 'first_line', guideline: 'NG28' },
    ],
    'gliclazide': [
      { conditions: ['type 2 diabetes'], recommendation: 'consider', line: 'second_line', guideline: 'NG28' },
    ],
    'sitagliptin': [
      { conditions: ['type 2 diabetes'], recommendation: 'consider', line: 'second_line', guideline: 'NG28' },
    ],
    'empagliflozin': [
      { conditions: ['type 2 diabetes'], recommendation: 'recommended', line: 'first_line', notes: 'If CVD or high risk', guideline: 'NG28' },
      { conditions: ['heart failure'], recommendation: 'recommended', line: 'first_line', guideline: 'NG106' },
    ],
    'dapagliflozin': [
      { conditions: ['type 2 diabetes'], recommendation: 'recommended', line: 'first_line', notes: 'If CVD or high risk', guideline: 'NG28' },
      { conditions: ['heart failure'], recommendation: 'recommended', line: 'first_line', guideline: 'NG106' },
    ],

    // Respiratory
    'salbutamol': [
      { conditions: ['asthma', 'copd'], recommendation: 'recommended', line: 'first_line', notes: 'Reliever', guideline: 'NG80' },
    ],
    'beclometasone': [
      { conditions: ['asthma'], recommendation: 'recommended', line: 'first_line', notes: 'Preventer', guideline: 'NG80' },
    ],
    'fluticasone': [
      { conditions: ['asthma', 'copd'], recommendation: 'recommended', guideline: 'NG80' },
    ],

    // Mental Health
    'sertraline': [
      { conditions: ['depression', 'anxiety'], recommendation: 'recommended', line: 'first_line', guideline: 'NG222' },
    ],
    'fluoxetine': [
      { conditions: ['depression'], recommendation: 'recommended', line: 'first_line', guideline: 'NG222' },
    ],
    'citalopram': [
      { conditions: ['depression', 'anxiety'], recommendation: 'recommended', line: 'first_line', guideline: 'NG222' },
    ],
    'mirtazapine': [
      { conditions: ['depression'], recommendation: 'consider', line: 'second_line', guideline: 'NG222' },
    ],

    // Pain
    'paracetamol': [
      { conditions: ['chronic pain', 'back pain'], recommendation: 'recommended', line: 'first_line', guideline: 'NG193' },
    ],
    'ibuprofen': [
      { conditions: ['chronic pain', 'back pain'], recommendation: 'consider', notes: 'Short-term use', guideline: 'NG193' },
      { conditions: ['osteoarthritis'], recommendation: 'consider', notes: 'Topical or oral short-term', guideline: 'CG177' },
      { conditions: ['headache', 'migraine'], recommendation: 'consider', notes: 'Acute treatment', guideline: 'CG150' },
    ],
    'naproxen': [
      { conditions: ['chronic pain', 'gout'], recommendation: 'consider', guideline: 'NG193' },
    ],
    'amitriptyline': [
      { conditions: ['neuropathic pain', 'chronic pain'], recommendation: 'recommended', line: 'first_line', guideline: 'CG173' },
    ],
    'gabapentin': [
      { conditions: ['neuropathic pain'], recommendation: 'recommended', line: 'first_line', guideline: 'CG173' },
    ],
    'pregabalin': [
      { conditions: ['neuropathic pain'], recommendation: 'recommended', line: 'first_line', guideline: 'CG173' },
    ],

    // GI
    'omeprazole': [
      { conditions: ['gerd', 'gastroesophageal reflux'], recommendation: 'recommended', line: 'first_line', guideline: 'CG184' },
    ],
    'lansoprazole': [
      { conditions: ['gerd'], recommendation: 'recommended', line: 'first_line', guideline: 'CG184' },
    ],

    // Antibiotics
    'amoxicillin': [
      { conditions: ['respiratory tract infection'], recommendation: 'recommended', line: 'first_line', guideline: 'NG120' },
      { conditions: ['sinusitis', 'acute sinusitis', 'acute bacterial sinusitis'], recommendation: 'recommended', line: 'first_line', notes: 'If antibiotics indicated', guideline: 'NG79' },
      { conditions: ['otitis media'], recommendation: 'recommended', line: 'first_line', guideline: 'NG91' },
      { conditions: ['pneumonia'], recommendation: 'recommended', line: 'first_line', guideline: 'CG191' },
    ],
    'nitrofurantoin': [
      { conditions: ['urinary tract infection', 'uti'], recommendation: 'recommended', line: 'first_line', guideline: 'NG109' },
    ],
    'trimethoprim': [
      { conditions: ['urinary tract infection', 'uti'], recommendation: 'consider', line: 'first_line', notes: 'Check local resistance', guideline: 'NG109' },
    ],

    // Corticosteroids
    'prednisolone': [
      { conditions: ['asthma'], recommendation: 'recommended', notes: 'Acute exacerbation', guideline: 'NG80' },
      { conditions: ['copd'], recommendation: 'recommended', notes: 'Acute exacerbation', guideline: 'NG115' },
      { conditions: ['rheumatoid arthritis'], recommendation: 'consider', notes: 'Short-term bridging therapy', guideline: 'NG100' },
      { conditions: ['gout'], recommendation: 'consider', notes: 'If NSAIDs contraindicated', guideline: 'CG166' },
    ],

    // Combination antibiotics
    'co-amoxiclav': [
      { conditions: ['respiratory tract infection'], recommendation: 'consider', line: 'second_line', notes: 'When amoxicillin-resistant or severe', guideline: 'NG120' },
      { conditions: ['sinusitis', 'acute sinusitis', 'acute bacterial sinusitis'], recommendation: 'consider', line: 'second_line', notes: 'If first-line fails', guideline: 'NG79' },
      { conditions: ['urinary tract infection', 'uti'], recommendation: 'consider', line: 'second_line', guideline: 'NG109' },
      { conditions: ['skin infection', 'cellulitis'], recommendation: 'recommended', line: 'first_line', guideline: 'NG141' },
    ],
    'amoxicillin-clavulanic acid': [
      { conditions: ['respiratory tract infection'], recommendation: 'consider', line: 'second_line', notes: 'When amoxicillin-resistant or severe', guideline: 'NG120' },
      { conditions: ['sinusitis', 'acute sinusitis', 'acute bacterial sinusitis'], recommendation: 'consider', line: 'second_line', notes: 'If first-line fails', guideline: 'NG79' },
      { conditions: ['skin infection', 'cellulitis'], recommendation: 'recommended', line: 'first_line', guideline: 'NG141' },
    ],

    // Statins
    'atorvastatin': [
      { conditions: ['cardiovascular prevention'], recommendation: 'recommended', line: 'first_line', guideline: 'CG181' },
    ],

    // Drugs to avoid/caution
    'codeine': [
      { conditions: ['chronic pain'], recommendation: 'do_not_offer', notes: 'NICE advises against for chronic primary pain', guideline: 'NG193' },
    ],
    'tramadol': [
      { conditions: ['chronic pain'], recommendation: 'caution', notes: 'Consider alternatives first', guideline: 'NG193' },
    ],
  };

  constructor(
    @InjectModel('User') private readonly userModel: Model<any>,
  ) {}

  /**
   * Validate a drug against NICE guidelines for a given condition
   */
  async validateDrugForCondition(
    drugName: string,
    condition?: string,
  ): Promise<NICEValidationResult> {
    const drugNameLower = drugName.toLowerCase();
    const conditionLower = condition?.toLowerCase();

    this.logger.log(`[NICE] Validating ${drugName} for condition: ${condition || 'general'}`);

    const guidelines: NICEGuideline[] = [];
    const recommendations: NICETreatmentRecommendation[] = [];
    const warnings: string[] = [];
    let complianceLevel: 'full' | 'partial' | 'none' | 'unknown' = 'unknown';
    let isCompliant = true;

    // Check our known drug recommendations
    const drugRecs = this.DRUG_RECOMMENDATIONS[drugNameLower];

    // Split multi-condition input (e.g., "Acute thyroiditis, Acute bacterial sinusitis")
    const inputConditions = conditionLower
      ? conditionLower.split(/[,;]+/).map(c => c.trim()).filter(Boolean)
      : [];

    if (drugRecs) {
      for (const rec of drugRecs) {
        // Check if this recommendation applies to any of the input conditions
        const conditionMatches = !conditionLower ||
          rec.conditions.some(c =>
            inputConditions.some(ic =>
              ic.includes(c) || c.includes(ic) ||
              // Match key terms (e.g., "sinusitis" in "acute bacterial sinusitis")
              c.split(/\s+/).some(word => word.length > 4 && ic.includes(word)) ||
              ic.split(/\s+/).some(word => word.length > 4 && c.includes(word))
            )
          );

        if (conditionMatches) {
          const guideline = rec.guideline ? this.buildGuidelineReference(rec.guideline) : null;
          if (guideline) {
            guidelines.push(guideline);
          }

          recommendations.push({
            drug_name: drugName,
            recommendation_type: rec.recommendation,
            line_of_treatment: rec.line,
            conditions: rec.conditions,
            evidence_strength: rec.recommendation === 'recommended'
              ? NICEEvidenceStrength.STRONG
              : rec.recommendation === 'consider'
                ? NICEEvidenceStrength.CONDITIONAL
                : NICEEvidenceStrength.NOT_RECOMMENDED,
            recommendation_text: this.buildRecommendationText(drugName, rec),
            guideline_reference: guideline ? {
              id: guideline.id,
              title: guideline.title,
              url: guideline.url,
            } : {
              id: 'unknown',
              title: 'NICE Guidelines',
              url: this.BASE_URL,
            },
            special_considerations: rec.notes ? [rec.notes] : undefined,
          });

          // Determine compliance
          if (rec.recommendation === 'do_not_offer') {
            isCompliant = false;
            complianceLevel = 'none';
            warnings.push(`NICE recommends AGAINST using ${drugName} for ${rec.conditions.join(', ')}`);
          } else if (rec.recommendation === 'caution') {
            if (complianceLevel !== 'none') complianceLevel = 'partial';
            warnings.push(`NICE advises CAUTION when using ${drugName}: ${rec.notes || 'Review guidelines'}`);
          } else if (rec.recommendation === 'recommended') {
            if (complianceLevel === 'unknown') complianceLevel = 'full';
          } else if (rec.recommendation === 'consider') {
            if (complianceLevel === 'unknown') complianceLevel = 'partial';
          }
        }
      }
    }

    // If we found specific guidance
    if (recommendations.length > 0) {
      return {
        drug_name: drugName,
        condition,
        is_nice_compliant: isCompliant,
        compliance_level: complianceLevel,
        guidelines_checked: guidelines,
        recommendations,
        warnings,
        validation_timestamp: new Date(),
      };
    }

    // Try to find related guidelines for the condition
    if (conditionLower) {
      const relatedGuidelineIds = this.findGuidelinesForCondition(conditionLower);
      for (const id of relatedGuidelineIds) {
        const guideline = this.buildGuidelineReference(id);
        if (guideline) {
          guidelines.push(guideline);
        }
      }
    }

    // No specific guidance found — build informative messaging
    const fallbackWarnings: string[] = [];

    if (drugRecs) {
      // Drug IS in our NICE database, but not for this specific condition
      const coveredConditions = drugRecs.flatMap(r => r.conditions);
      const uniqueConditions = [...new Set(coveredConditions)];
      const conditionList = uniqueConditions.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(', ');

      fallbackWarnings.push(
        `${drugName} has NICE guidance for: ${conditionList}. ` +
        `No specific guidance exists for "${condition || 'this condition'}", ` +
        `but this does not indicate the drug is inappropriate — ` +
        `clinical judgement applies.`
      );
    } else if (guidelines.length > 0) {
      // No drug data but we found condition-related guidelines
      fallbackWarnings.push(
        `${drugName} is not specifically referenced in NICE guidelines for "${condition}". ` +
        `Related guidelines exist for this condition — review for alternative recommendations.`
      );
    } else {
      // Neither drug nor condition found in our database
      fallbackWarnings.push(
        `No specific NICE guidance found for ${drugName} with "${condition || 'this condition'}". ` +
        `This is common for many safe, established medications. ` +
        `Prescribe based on clinical judgement and BNF recommendations.`
      );
    }

    return {
      drug_name: drugName,
      condition,
      is_nice_compliant: true, // Assume compliant if no contra-indication found
      compliance_level: drugRecs ? 'partial' : 'unknown',
      guidelines_checked: guidelines,
      recommendations: drugRecs ? [{
        drug_name: drugName,
        recommendation_type: 'consider' as const,
        conditions: drugRecs.flatMap(r => r.conditions),
        evidence_strength: NICEEvidenceStrength.CONDITIONAL,
        recommendation_text: `${drugName} is recognised by NICE for other indications. No specific guidance for "${condition || 'this condition'}".`,
        guideline_reference: {
          id: 'general',
          title: 'NICE Clinical Guidelines',
          url: this.BASE_URL,
        },
      }] : [],
      warnings: fallbackWarnings,
      validation_timestamp: new Date(),
    };
  }

  /**
   * Validate multiple drugs for a condition
   */
  async validateDrugsForCondition(
    drugs: string[],
    condition?: string,
  ): Promise<Map<string, NICEValidationResult>> {
    const results = new Map<string, NICEValidationResult>();

    for (const drug of drugs) {
      const result = await this.validateDrugForCondition(drug, condition);
      results.set(drug, result);
    }

    return results;
  }

  /**
   * Get condition guidance from NICE
   */
  async getConditionGuidance(condition: string): Promise<NICEConditionGuidance | null> {
    const conditionLower = condition.toLowerCase();
    const guidelineIds = this.findGuidelinesForCondition(conditionLower);

    if (guidelineIds.length === 0) {
      return null;
    }

    const guidelines: NICEGuideline[] = [];
    for (const id of guidelineIds) {
      const guideline = this.buildGuidelineReference(id);
      if (guideline) {
        guidelines.push(guideline);
      }
    }

    // Find drugs recommended for this condition
    const firstLineDrugs: string[] = [];
    const secondLineDrugs: string[] = [];
    const drugsToAvoid: string[] = [];

    for (const [drug, recs] of Object.entries(this.DRUG_RECOMMENDATIONS)) {
      for (const rec of recs) {
        if (rec.conditions.some(c => conditionLower.includes(c) || c.includes(conditionLower))) {
          if (rec.recommendation === 'recommended' && rec.line === 'first_line') {
            firstLineDrugs.push(drug);
          } else if (rec.recommendation === 'consider' || rec.line === 'second_line') {
            secondLineDrugs.push(drug);
          } else if (rec.recommendation === 'do_not_offer') {
            drugsToAvoid.push(drug);
          }
        }
      }
    }

    return {
      condition,
      condition_aliases: this.findConditionAliases(conditionLower),
      primary_guideline: guidelines[0],
      related_guidelines: guidelines.slice(1),
      first_line_treatments: [...new Set(firstLineDrugs)],
      second_line_treatments: [...new Set(secondLineDrugs)],
      drugs_to_avoid: [...new Set(drugsToAvoid)],
      special_populations: [],
      last_updated: new Date(),
    };
  }

  /**
   * Build compliance summary for RxGPT response
   */
  buildComplianceSummary(validationResults: NICEValidationResult[]): NICEComplianceSummary {
    const fullyCompliant = validationResults.filter(r => r.compliance_level === 'full').length;
    const partiallyCompliant = validationResults.filter(r => r.compliance_level === 'partial').length;
    const nonCompliant = validationResults.filter(r => r.compliance_level === 'none').length;
    const noGuidance = validationResults.filter(r => r.compliance_level === 'unknown').length;

    const hasIssues = nonCompliant > 0 || partiallyCompliant > 0;

    // Collect unique guidelines
    const guidelinesMap = new Map<string, { id: string; title: string; url: string }>();
    for (const result of validationResults) {
      for (const guideline of result.guidelines_checked) {
        guidelinesMap.set(guideline.id, {
          id: guideline.id,
          title: guideline.title,
          url: guideline.url,
        });
      }
    }

    let warning: string | undefined;
    if (nonCompliant > 0) {
      const nonCompliantDrugs = validationResults
        .filter(r => r.compliance_level === 'none')
        .map(r => r.drug_name)
        .join(', ');
      warning = `${nonCompliant} drug(s) are NOT recommended by NICE guidelines: ${nonCompliantDrugs}. Review before prescribing.`;
    } else if (partiallyCompliant > 0 && noGuidance === 0) {
      warning = `${partiallyCompliant} drug(s) have conditional NICE recommendations. Review guidelines for specific patient considerations.`;
    } else if (partiallyCompliant > 0 && noGuidance > 0) {
      warning = `${partiallyCompliant} drug(s) have conditional recommendations; ${noGuidance} not specifically covered by NICE for this condition. Clinical judgement applies.`;
    } else if (noGuidance > 0 && noGuidance === validationResults.length) {
      warning = `NICE does not have specific guidance for these drugs with the given condition. This is common — prescribe based on clinical judgement and BNF recommendations.`;
    } else if (noGuidance > 0) {
      warning = `${noGuidance} drug(s) not specifically covered by NICE for this condition. This does not indicate they are inappropriate.`;
    }

    return {
      total_drugs_checked: validationResults.length,
      fully_compliant: fullyCompliant,
      partially_compliant: partiallyCompliant,
      non_compliant: nonCompliant,
      no_guidance_available: noGuidance,
      has_compliance_issues: hasIssues,
      warning,
      guidelines_referenced: Array.from(guidelinesMap.values()),
    };
  }

  /**
   * Find guideline IDs for a condition
   */
  private findGuidelinesForCondition(condition: string): string[] {
    const conditionLower = condition.toLowerCase();
    const allGuidelines: Set<string> = new Set();

    // Split multi-condition input
    const conditions = conditionLower.split(/[,;]+/).map(c => c.trim()).filter(Boolean);
    if (conditions.length === 0) conditions.push(conditionLower);

    for (const cond of conditions) {
      // Direct lookup
      if (this.CONDITION_GUIDELINE_MAP[cond]) {
        this.CONDITION_GUIDELINE_MAP[cond].forEach(g => allGuidelines.add(g));
        continue;
      }

      // Partial match
      for (const [key, guidelines] of Object.entries(this.CONDITION_GUIDELINE_MAP)) {
        if (cond.includes(key) || key.includes(cond)) {
          guidelines.forEach(g => allGuidelines.add(g));
        }
      }
    }

    return Array.from(allGuidelines);
  }

  /**
   * Find aliases for a condition
   */
  private findConditionAliases(condition: string): string[] {
    const aliases: string[] = [];
    const conditionLower = condition.toLowerCase();

    // Find related conditions that map to the same guidelines
    const conditionGuidelines = this.findGuidelinesForCondition(conditionLower);

    for (const [key, guidelines] of Object.entries(this.CONDITION_GUIDELINE_MAP)) {
      if (key !== conditionLower &&
          guidelines.some(g => conditionGuidelines.includes(g))) {
        aliases.push(key);
      }
    }

    return aliases;
  }

  /**
   * Build guideline reference from ID
   */
  private buildGuidelineReference(id: string): NICEGuideline | null {
    // Determine guideline type from ID prefix
    let type: NICEGuidelineType;
    if (id.startsWith('NG')) type = NICEGuidelineType.NG;
    else if (id.startsWith('CG')) type = NICEGuidelineType.CG;
    else if (id.startsWith('TA')) type = NICEGuidelineType.TA;
    else if (id.startsWith('MTG')) type = NICEGuidelineType.MTG;
    else if (id.startsWith('QS')) type = NICEGuidelineType.QS;
    else type = NICEGuidelineType.NG;

    // Build title from known guidelines
    const titles: Record<string, string> = {
      'NG136': 'Hypertension in adults: diagnosis and management',
      'CG127': 'Hypertension in adults (2011)',
      'NG106': 'Chronic heart failure in adults: diagnosis and management',
      'CG108': 'Chronic heart failure (2010)',
      'NG196': 'Atrial fibrillation: diagnosis and management',
      'NG28': 'Type 2 diabetes in adults: management',
      'NG17': 'Type 1 diabetes in adults: diagnosis and management',
      'NG18': 'Diabetes (type 1 and type 2) in children and young people',
      'NG87': 'Type 2 diabetes: prevention in people at high risk',
      'NG80': 'Asthma: diagnosis, monitoring and chronic asthma management',
      'NG115': 'Chronic obstructive pulmonary disease in over 16s',
      'NG222': 'Depression in adults: treatment and management',
      'CG90': 'Depression in adults (2009)',
      'CG113': 'Generalised anxiety disorder and panic disorder in adults',
      'NG193': 'Chronic pain (primary and secondary) in over 16s',
      'CG173': 'Neuropathic pain in adults',
      'NG59': 'Low back pain and sciatica in over 16s',
      'CG150': 'Headaches in over 12s: diagnosis and management',
      'CG184': 'Gastro-oesophageal reflux disease and dyspepsia in adults',
      'CG61': 'Irritable bowel syndrome in adults',
      'NG109': 'Urinary tract infection (lower): antimicrobial prescribing',
      'NG113': 'Urinary tract infection (recurrent): antimicrobial prescribing',
      'NG120': 'Acute respiratory tract infections: prescribing antibiotics',
      'NG100': 'Rheumatoid arthritis in adults: management',
      'CG177': 'Osteoarthritis: care and management',
      'CG166': 'Gout: diagnosis and management',
      'CG181': 'Cardiovascular disease: risk assessment and reduction',
      'NG79': 'Sinusitis (acute): antimicrobial prescribing',
      'NG84': 'Sore throat (acute): antimicrobial prescribing',
      'NG91': 'Otitis media (acute): antimicrobial prescribing',
      'CG191': 'Pneumonia in adults: diagnosis and management',
      'NG141': 'Skin and soft tissue infections: antimicrobial prescribing',
    };

    return {
      id,
      title: titles[id] || `NICE Guideline ${id}`,
      url: `${this.BASE_URL}/guidance/${id.toLowerCase()}`,
      type,
      published_date: 'See guideline',
      status: 'published',
    };
  }

  /**
   * Build recommendation text
   */
  private buildRecommendationText(
    drugName: string,
    rec: { recommendation: string; line?: string; notes?: string; conditions: string[] },
  ): string {
    let text = '';

    switch (rec.recommendation) {
      case 'recommended':
        text = `${drugName} is recommended`;
        if (rec.line === 'first_line') text += ' as first-line treatment';
        break;
      case 'consider':
        text = `Consider ${drugName}`;
        if (rec.line === 'second_line') text += ' as second-line treatment';
        break;
      case 'do_not_offer':
        text = `Do not offer ${drugName}`;
        break;
      case 'caution':
        text = `Use ${drugName} with caution`;
        break;
    }

    text += ` for ${rec.conditions.join(', ')}`;

    if (rec.notes) {
      text += `. ${rec.notes}`;
    }

    return text;
  }

  /**
   * Search NICE website for guidelines (fallback)
   */
  async searchGuidelines(params: NICESearchParams): Promise<NICEGuideline[]> {
    await this.respectRateLimit();

    const searchTerms: string[] = [];
    if (params.drug_name) searchTerms.push(params.drug_name);
    if (params.condition) searchTerms.push(params.condition);

    if (searchTerms.length === 0) {
      return [];
    }

    const query = searchTerms.join(' ');
    const cacheKey = `nice:search:${query}`;

    // Check cache
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Note: NICE's public API may require registration
      // This is a simplified search using their website
      const url = `${this.BASE_URL}/search?q=${encodeURIComponent(query)}&ps=10&sp=on`;

      this.logger.log(`[NICE] Searching guidelines for: ${query}`);

      // For now, return based on our local mappings
      const guidelines: NICEGuideline[] = [];

      if (params.condition) {
        const ids = this.findGuidelinesForCondition(params.condition);
        for (const id of ids) {
          const guideline = this.buildGuidelineReference(id);
          if (guideline) guidelines.push(guideline);
        }
      }

      this.setCache(cacheKey, guidelines);
      return guidelines;
    } catch (error) {
      this.logger.error(`[NICE] Search failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Rate limiting
   */
  private async respectRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.REQUEST_DELAY_MS) {
      await new Promise(resolve => setTimeout(resolve, this.REQUEST_DELAY_MS - timeSinceLastRequest));
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Cache helpers
   */
  private getFromCache(key: string): any | null {
    const cached = this.guidelineCache.get(key);
    if (!cached) return null;

    if (new Date() > cached.expires) {
      this.guidelineCache.delete(key);
      return null;
    }

    return cached.data;
  }

  private setCache(key: string, data: any): void {
    const expires = new Date(Date.now() + this.CACHE_DURATION_HOURS * 60 * 60 * 1000);
    this.guidelineCache.set(key, { data, expires });
  }
}
