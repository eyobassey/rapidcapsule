import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  HallucinationType,
  HallucinationSeverity,
  HallucinationFlag,
  DrugHallucinationCheck,
  HallucinationReport,
  HallucinationLogEntry,
} from '../dto/hallucination.dto';
import { SuggestedMedicationDto } from '../dto/rxgpt.dto';
import { BNFService } from './bnf.service';

/**
 * Hallucination Detector Service
 * Identifies potential AI hallucinations in RxGPT responses before returning to users
 *
 * Detection patterns:
 * - Unknown drug names (not in any database)
 * - Implausible dosages (outside physiological ranges)
 * - Invented drug classes
 * - Fake drug interactions
 * - Impossible dosing frequencies
 * - Made-up medical terminology
 */
@Injectable()
export class HallucinationDetectorService {
  private readonly logger = new Logger(HallucinationDetectorService.name);

  // ============ KNOWN VALID DRUG CLASSES ============
  private readonly VALID_DRUG_CLASSES = new Set([
    // Cardiovascular
    'ace inhibitors', 'arbs', 'angiotensin receptor blockers', 'beta-blockers',
    'calcium channel blockers', 'diuretics', 'statins', 'anticoagulants',
    'antiplatelets', 'nitrates', 'cardiac glycosides', 'antiarrhythmics',

    // CNS
    'ssris', 'snris', 'tricyclic antidepressants', 'tcas', 'maois',
    'benzodiazepines', 'antipsychotics', 'anticonvulsants', 'opioids',
    'opioid analgesics', 'barbiturates', 'anxiolytics', 'hypnotics',
    'mood stabilizers', 'stimulants', 'antidepressants',

    // Anti-infectives
    'penicillins', 'cephalosporins', 'macrolides', 'fluoroquinolones',
    'tetracyclines', 'aminoglycosides', 'sulfonamides', 'antifungals',
    'antivirals', 'antibiotics', 'antimalarials', 'antiparasitics',

    // Endocrine
    'biguanides', 'sulfonylureas', 'insulin', 'thiazolidinediones',
    'dpp-4 inhibitors', 'sglt2 inhibitors', 'glp-1 agonists',
    'corticosteroids', 'thyroid hormones', 'antithyroid drugs',

    // Respiratory
    'bronchodilators', 'beta2 agonists', 'anticholinergics',
    'inhaled corticosteroids', 'leukotriene inhibitors', 'antihistamines',
    'decongestants', 'mucolytics', 'antitussives',

    // GI
    'proton pump inhibitors', 'ppis', 'h2 blockers', 'antacids',
    'antiemetics', 'laxatives', 'antidiarrheals', 'prokinetics',

    // Pain/Inflammation
    'nsaids', 'non-opioid analgesics', 'cox-2 inhibitors',
    'muscle relaxants', 'local anesthetics', 'dmards',

    // Other common classes
    'immunosuppressants', 'biologics', 'monoclonal antibodies',
    'antihistamines', 'antineoplastics', 'hormones', 'vitamins',
    'minerals', 'supplements', 'bisphosphonates',
  ]);

  // ============ MAXIMUM PHYSIOLOGICAL DOSES (mg/day) ============
  private readonly MAX_DAILY_DOSES: Record<string, number> = {
    // Pain/Fever
    'paracetamol': 4000,
    'acetaminophen': 4000,
    'ibuprofen': 3200,
    'naproxen': 1500,
    'aspirin': 4000,
    'diclofenac': 150,
    'codeine': 240,
    'tramadol': 400,
    'morphine': 200, // Oral, higher for tolerant patients

    // Cardiovascular
    'amlodipine': 10,
    'lisinopril': 80,
    'ramipril': 10,
    'losartan': 100,
    'atorvastatin': 80,
    'simvastatin': 80,
    'bisoprolol': 20,
    'metoprolol': 400,
    'furosemide': 600,
    'warfarin': 15,

    // Diabetes
    'metformin': 3000,
    'gliclazide': 320,
    'glipizide': 40,
    'sitagliptin': 100,
    'empagliflozin': 25,

    // Mental Health
    'sertraline': 200,
    'fluoxetine': 80,
    'citalopram': 40,
    'escitalopram': 20,
    'venlafaxine': 375,
    'mirtazapine': 45,
    'amitriptyline': 150,
    'quetiapine': 800,
    'olanzapine': 20,
    'risperidone': 16,
    'diazepam': 40,
    'lorazepam': 10,

    // Respiratory
    'salbutamol': 32, // mg inhaled
    'montelukast': 10,
    'prednisolone': 60,

    // GI
    'omeprazole': 40,
    'lansoprazole': 30,
    'pantoprazole': 80,
    'ranitidine': 600,

    // Antibiotics
    'amoxicillin': 3000,
    'azithromycin': 500,
    'ciprofloxacin': 1500,
    'doxycycline': 200,
    'metronidazole': 2000,
    'nitrofurantoin': 400,
    'trimethoprim': 400,
  };

  // ============ VALID DOSING FREQUENCIES ============
  private readonly VALID_FREQUENCIES = [
    // Standard frequencies
    'once daily', 'twice daily', 'three times daily', 'four times daily',
    'once a day', 'twice a day', 'three times a day', 'four times a day',
    'every day', 'daily', 'bd', 'tds', 'qds', 'od',
    'every 4 hours', 'every 6 hours', 'every 8 hours', 'every 12 hours',
    'every 24 hours', 'q4h', 'q6h', 'q8h', 'q12h', 'q24h',
    'at night', 'at bedtime', 'in the morning', 'with meals',
    'before meals', 'after meals', 'on empty stomach',
    'as needed', 'as required', 'prn', 'when required',
    'every other day', 'alternate days', 'weekly', 'once weekly',
    'twice weekly', 'monthly', 'once monthly',
    'stat', 'immediately', 'loading dose',
    // Latin abbreviations
    'bis in die', 'ter in die', 'quater in die', 'omni die',
  ];

  // ============ SUSPICIOUS PATTERNS ============
  private readonly SUSPICIOUS_NAME_PATTERNS = [
    // Names that look made up (unlikely pharmaceutical naming)
    /^[A-Z][a-z]{15,}$/, // Very long single-word names
    /[0-9]{4,}/, // Too many numbers
    /(.)\1{3,}/, // Repeated characters (aaaa)
    /^(super|mega|ultra|hyper|turbo)/i, // Marketing prefixes
    /(max|plus|pro|ultra|extreme|supreme)$/i, // Marketing suffixes
    /[^a-zA-Z0-9\s\-]/, // Special characters (except hyphen)
  ];

  private readonly SUSPICIOUS_TERMINOLOGY = [
    // Made-up medical terms
    'mega-absorption', 'super-bioavailable', 'ultra-release',
    'quantum effect', 'nano-delivery', 'hyper-potent',
    'cellular regeneration', 'dna repair', 'cellular detox',
    'toxin elimination', 'immune boosting', 'metabolism maximizer',
  ];

  constructor(
    @InjectModel('User') private readonly userModel: Model<any>,
    private readonly bnfService: BNFService,
  ) {}

  /**
   * Main detection method - checks suggestions for hallucinations
   */
  async detectHallucinations(
    suggestions: SuggestedMedicationDto[],
    specialistId?: string,
    patientId?: string,
  ): Promise<HallucinationReport> {
    this.logger.log(`[Hallucination Detector] Checking ${suggestions.length} suggestions`);

    const drugChecks: DrugHallucinationCheck[] = [];
    let criticalCount = 0;
    let highCount = 0;
    let mediumCount = 0;
    let lowCount = 0;

    for (const suggestion of suggestions) {
      const check = await this.checkDrugForHallucinations(suggestion);
      drugChecks.push(check);

      // Count by severity
      for (const flag of check.flags) {
        switch (flag.severity) {
          case HallucinationSeverity.CRITICAL: criticalCount++; break;
          case HallucinationSeverity.HIGH: highCount++; break;
          case HallucinationSeverity.MEDIUM: mediumCount++; break;
          case HallucinationSeverity.LOW: lowCount++; break;
        }
      }
    }

    // Calculate overall suspicion score
    const totalFlags = criticalCount + highCount + mediumCount + lowCount;
    const weightedScore = (criticalCount * 100 + highCount * 70 + mediumCount * 40 + lowCount * 20) /
      Math.max(suggestions.length, 1);
    const overallScore = Math.min(100, Math.round(weightedScore));

    // Determine recommendation
    let recommendation: 'safe' | 'review_required' | 'reject';
    if (criticalCount > 0) {
      recommendation = 'reject';
    } else if (highCount > 0 || overallScore > 50) {
      recommendation = 'review_required';
    } else {
      recommendation = 'safe';
    }

    const report: HallucinationReport = {
      timestamp: new Date(),
      total_items_checked: suggestions.length,
      hallucinations_detected: totalFlags,
      critical_count: criticalCount,
      high_count: highCount,
      medium_count: mediumCount,
      low_count: lowCount,
      drug_checks: drugChecks,
      overall_suspicion_score: overallScore,
      recommendation,
      summary: this.buildReportSummary(criticalCount, highCount, mediumCount, lowCount, recommendation),
    };

    // Log if hallucinations detected
    if (totalFlags > 0) {
      await this.logHallucinationDetection(report, specialistId, patientId);
    }

    return report;
  }

  /**
   * Check a single drug suggestion for hallucinations
   */
  private async checkDrugForHallucinations(
    suggestion: SuggestedMedicationDto,
  ): Promise<DrugHallucinationCheck> {
    const flags: HallucinationFlag[] = [];
    const verifiedSources: string[] = [];

    const drugName = suggestion.drug_name;
    const genericName = suggestion.generic_name || drugName;

    // 1. Check if drug exists in any database
    const existsFlags = this.checkDrugExists(suggestion, verifiedSources);
    flags.push(...existsFlags);

    // 2. Check for suspicious drug name patterns
    const nameFlags = this.checkSuspiciousDrugName(drugName, genericName);
    flags.push(...nameFlags);

    // 3. Check for implausible dosage
    const dosageFlags = this.checkDosagePlausibility(suggestion);
    flags.push(...dosageFlags);

    // 4. Check for invalid drug class
    const classFlags = this.checkDrugClass(suggestion);
    flags.push(...classFlags);

    // 5. Check for implausible frequency
    const frequencyFlags = this.checkFrequencyPlausibility(suggestion);
    flags.push(...frequencyFlags);

    // 6. Check for invented terminology in reasoning
    const terminologyFlags = this.checkForInventedTerminology(suggestion);
    flags.push(...terminologyFlags);

    // 7. Check for inconsistent claims
    const inconsistencyFlags = this.checkForInconsistencies(suggestion);
    flags.push(...inconsistencyFlags);

    // Calculate suspicion score
    const suspicionScore = this.calculateSuspicionScore(flags);

    // Determine recommendation
    let recommendation: 'approve' | 'review' | 'reject';
    if (flags.some(f => f.severity === HallucinationSeverity.CRITICAL)) {
      recommendation = 'reject';
    } else if (flags.some(f => f.severity === HallucinationSeverity.HIGH) || suspicionScore > 60) {
      recommendation = 'review';
    } else {
      recommendation = 'approve';
    }

    return {
      drug_name: drugName,
      flags,
      is_suspicious: flags.length > 0,
      suspicion_score: suspicionScore,
      verified_in_sources: verifiedSources,
      recommendation,
    };
  }

  /**
   * Check if drug exists in databases
   */
  private checkDrugExists(
    suggestion: SuggestedMedicationDto,
    verifiedSources: string[],
  ): HallucinationFlag[] {
    const flags: HallucinationFlag[] = [];

    // Check verification status from fact-check layer
    if (suggestion.verification?.is_verified) {
      verifiedSources.push(...(suggestion.verification.verified_sources || []));
    }

    if (suggestion.verification?.fda_approved) {
      verifiedSources.push('FDA');
    }

    // Check BNF
    if (suggestion.bnf_info?.found_in_bnf) {
      verifiedSources.push('BNF');
    }

    // Check NICE
    if ((suggestion.nice_compliance?.guideline_references?.length ?? 0) > 0) {
      verifiedSources.push('NICE');
    }

    // If drug not found in any database
    if (verifiedSources.length === 0 && !suggestion.verification?.is_verified) {
      // Check if it's at least in our local BNF database
      const inBNF = this.bnfService.isInBNF(suggestion.generic_name || suggestion.drug_name);

      if (!inBNF) {
        flags.push({
          type: HallucinationType.UNKNOWN_DRUG,
          severity: HallucinationSeverity.HIGH,
          field: 'drug_name',
          value: suggestion.drug_name,
          reason: `Drug "${suggestion.drug_name}" not found in FDA, BNF, NICE, or local databases`,
          suggestion: 'Verify drug name spelling or check if this is a valid medication',
          confidence: 85,
        });
      }
    }

    return flags;
  }

  /**
   * Check for suspicious drug name patterns
   */
  private checkSuspiciousDrugName(drugName: string, genericName: string): HallucinationFlag[] {
    const flags: HallucinationFlag[] = [];

    for (const pattern of this.SUSPICIOUS_NAME_PATTERNS) {
      if (pattern.test(drugName)) {
        flags.push({
          type: HallucinationType.UNKNOWN_DRUG,
          severity: HallucinationSeverity.MEDIUM,
          field: 'drug_name',
          value: drugName,
          reason: `Drug name "${drugName}" matches suspicious pattern (may be fabricated)`,
          confidence: 60,
        });
        break; // Only one flag per name
      }
    }

    // Check if generic name is suspiciously different from brand
    if (genericName && drugName !== genericName) {
      // Legitimate generics usually have recognizable stems
      const hasPharmaStem = /(?:olol|pril|sartan|statin|prazole|tidine|azole|cillin|mycin|oxacin|pine|pam|lam|done|tine|mab|nib|tinib)/i.test(genericName);

      if (!hasPharmaStem && genericName.length > 12) {
        flags.push({
          type: HallucinationType.UNKNOWN_DRUG,
          severity: HallucinationSeverity.LOW,
          field: 'generic_name',
          value: genericName,
          reason: `Generic name "${genericName}" lacks typical pharmaceutical naming conventions`,
          confidence: 40,
        });
      }
    }

    return flags;
  }

  /**
   * Check dosage plausibility
   */
  private checkDosagePlausibility(suggestion: SuggestedMedicationDto): HallucinationFlag[] {
    const flags: HallucinationFlag[] = [];
    const dosage = suggestion.suggested_dosage || '';
    const drugName = (suggestion.generic_name || suggestion.drug_name).toLowerCase();

    // Extract numeric dose
    const doseMatch = dosage.match(/(\d+(?:\.\d+)?)\s*(mg|g|mcg|µg|ml)/i);
    if (!doseMatch) return flags;

    let doseValue = parseFloat(doseMatch[1]);
    const unit = doseMatch[2].toLowerCase();

    // Convert to mg for comparison
    if (unit === 'g') doseValue *= 1000;
    if (unit === 'mcg' || unit === 'µg') doseValue /= 1000;

    // Check against known maximums
    const maxDose = this.MAX_DAILY_DOSES[drugName];
    if (maxDose) {
      // Single dose shouldn't exceed daily max (usually)
      if (doseValue > maxDose) {
        flags.push({
          type: HallucinationType.IMPLAUSIBLE_DOSAGE,
          severity: HallucinationSeverity.CRITICAL,
          field: 'suggested_dosage',
          value: dosage,
          reason: `Single dose ${dosage} exceeds maximum daily dose of ${maxDose}mg for ${drugName}`,
          suggestion: `Review dosage - maximum daily dose is ${maxDose}mg`,
          confidence: 95,
        });
      } else if (doseValue > maxDose * 0.5) {
        // Single dose > 50% of daily max is concerning
        flags.push({
          type: HallucinationType.IMPLAUSIBLE_DOSAGE,
          severity: HallucinationSeverity.MEDIUM,
          field: 'suggested_dosage',
          value: dosage,
          reason: `Single dose ${dosage} is high (>${Math.round(maxDose * 0.5)}mg) for ${drugName}`,
          confidence: 60,
        });
      }
    }

    // General sanity checks
    if (doseValue > 10000) { // > 10g single dose
      flags.push({
        type: HallucinationType.IMPLAUSIBLE_DOSAGE,
        severity: HallucinationSeverity.CRITICAL,
        field: 'suggested_dosage',
        value: dosage,
        reason: `Dosage ${dosage} is implausibly high (>10g single dose)`,
        confidence: 98,
      });
    }

    if (doseValue < 0.0001) { // < 0.1mcg
      flags.push({
        type: HallucinationType.IMPLAUSIBLE_DOSAGE,
        severity: HallucinationSeverity.HIGH,
        field: 'suggested_dosage',
        value: dosage,
        reason: `Dosage ${dosage} is implausibly low (<0.1mcg)`,
        confidence: 90,
      });
    }

    return flags;
  }

  /**
   * Check drug class validity
   */
  private checkDrugClass(suggestion: SuggestedMedicationDto): HallucinationFlag[] {
    const flags: HallucinationFlag[] = [];

    // Check BNF drug class if available
    const drugClass = suggestion.bnf_info?.drug_class?.toLowerCase();

    if (drugClass && !this.isValidDrugClass(drugClass)) {
      flags.push({
        type: HallucinationType.INVENTED_DRUG_CLASS,
        severity: HallucinationSeverity.MEDIUM,
        field: 'drug_class',
        value: drugClass,
        reason: `Drug class "${drugClass}" is not a recognized pharmaceutical class`,
        confidence: 70,
      });
    }

    return flags;
  }

  /**
   * Check if drug class is valid
   */
  private isValidDrugClass(drugClass: string): boolean {
    const normalized = drugClass.toLowerCase().trim();

    // Direct match
    if (this.VALID_DRUG_CLASSES.has(normalized)) return true;

    // Partial match (class might be more specific)
    for (const validClass of this.VALID_DRUG_CLASSES) {
      if (normalized.includes(validClass) || validClass.includes(normalized)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check frequency plausibility
   */
  private checkFrequencyPlausibility(suggestion: SuggestedMedicationDto): HallucinationFlag[] {
    const flags: HallucinationFlag[] = [];
    const frequency = (suggestion.suggested_frequency || '').toLowerCase();

    if (!frequency) return flags;

    // Check against valid frequencies
    const isValid = this.VALID_FREQUENCIES.some(f =>
      frequency.includes(f.toLowerCase()) || f.toLowerCase().includes(frequency)
    );

    if (!isValid) {
      // Check for implausible frequencies
      const implausiblePatterns = [
        /every\s+\d+\s*minutes?/i,     // Every X minutes (usually not valid)
        /\d{2,}\s*times?\s*(a|per)\s*day/i, // 10+ times a day
        /continuously/i,
        /non-?stop/i,
        /every\s+second/i,
      ];

      for (const pattern of implausiblePatterns) {
        if (pattern.test(frequency)) {
          flags.push({
            type: HallucinationType.IMPLAUSIBLE_FREQUENCY,
            severity: HallucinationSeverity.HIGH,
            field: 'suggested_frequency',
            value: frequency,
            reason: `Dosing frequency "${frequency}" is not a standard pharmaceutical frequency`,
            suggestion: 'Use standard frequencies like "once daily", "twice daily", "every 8 hours"',
            confidence: 85,
          });
          break;
        }
      }
    }

    return flags;
  }

  /**
   * Check for invented medical terminology
   */
  private checkForInventedTerminology(suggestion: SuggestedMedicationDto): HallucinationFlag[] {
    const flags: HallucinationFlag[] = [];
    const reasoning = (suggestion.reasoning || '').toLowerCase();
    const instructions = (suggestion.instructions || '').toLowerCase();
    const textToCheck = `${reasoning} ${instructions}`;

    for (const term of this.SUSPICIOUS_TERMINOLOGY) {
      if (textToCheck.includes(term.toLowerCase())) {
        flags.push({
          type: HallucinationType.INVENTED_TERMINOLOGY,
          severity: HallucinationSeverity.MEDIUM,
          field: 'reasoning',
          value: term,
          reason: `Contains non-medical marketing terminology: "${term}"`,
          confidence: 75,
        });
      }
    }

    return flags;
  }

  /**
   * Check for inconsistent claims
   */
  private checkForInconsistencies(suggestion: SuggestedMedicationDto): HallucinationFlag[] {
    const flags: HallucinationFlag[] = [];

    // Check if marked as safe but has critical alerts
    if (suggestion.contraindication_check?.is_safe &&
        suggestion.safety_alerts?.some(a => a.severity === 'critical')) {
      flags.push({
        type: HallucinationType.INCONSISTENT_CLAIM,
        severity: HallucinationSeverity.HIGH,
        field: 'safety_assessment',
        value: 'safe with critical alerts',
        reason: 'Drug marked as safe but has critical safety alerts - inconsistent assessment',
        confidence: 90,
      });
    }

    // Check if dosage validation danger but high confidence
    if (suggestion.dosage_validation?.status === 'danger' &&
        (suggestion.confidence || 0) > 80) {
      flags.push({
        type: HallucinationType.INCONSISTENT_CLAIM,
        severity: HallucinationSeverity.MEDIUM,
        field: 'confidence',
        value: `${suggestion.confidence}% with danger dosage`,
        reason: 'High confidence score despite dangerous dosage flagged',
        confidence: 70,
      });
    }

    return flags;
  }

  /**
   * Calculate overall suspicion score
   */
  private calculateSuspicionScore(flags: HallucinationFlag[]): number {
    if (flags.length === 0) return 0;

    let score = 0;
    for (const flag of flags) {
      const weight = flag.confidence / 100;
      switch (flag.severity) {
        case HallucinationSeverity.CRITICAL:
          score += 40 * weight;
          break;
        case HallucinationSeverity.HIGH:
          score += 25 * weight;
          break;
        case HallucinationSeverity.MEDIUM:
          score += 15 * weight;
          break;
        case HallucinationSeverity.LOW:
          score += 5 * weight;
          break;
      }
    }

    return Math.min(100, Math.round(score));
  }

  /**
   * Build report summary
   */
  private buildReportSummary(
    critical: number,
    high: number,
    medium: number,
    low: number,
    recommendation: 'safe' | 'review_required' | 'reject',
  ): string {
    const total = critical + high + medium + low;

    if (total === 0) {
      return 'No hallucination patterns detected. AI response appears reliable.';
    }

    let summary = `Detected ${total} potential issue(s): `;
    const parts: string[] = [];

    if (critical > 0) parts.push(`${critical} critical`);
    if (high > 0) parts.push(`${high} high severity`);
    if (medium > 0) parts.push(`${medium} medium`);
    if (low > 0) parts.push(`${low} low`);

    summary += parts.join(', ') + '. ';

    switch (recommendation) {
      case 'reject':
        summary += 'RECOMMENDATION: Do not use this response without significant review and correction.';
        break;
      case 'review_required':
        summary += 'RECOMMENDATION: Review flagged items before accepting suggestions.';
        break;
      case 'safe':
        summary += 'RECOMMENDATION: Minor concerns only - proceed with normal clinical judgment.';
        break;
    }

    return summary;
  }

  /**
   * Log hallucination detection for analysis
   */
  private async logHallucinationDetection(
    report: HallucinationReport,
    specialistId?: string,
    patientId?: string,
  ): Promise<void> {
    const allFlags: HallucinationFlag[] = [];
    for (const check of report.drug_checks) {
      allFlags.push(...check.flags);
    }

    const logEntry: HallucinationLogEntry = {
      timestamp: new Date(),
      specialist_id: specialistId,
      patient_id: patientId,
      flags: allFlags,
      ai_model: 'claude',
      was_blocked: report.recommendation === 'reject',
      was_modified: false,
    };

    this.logger.warn(
      `[Hallucination Detector] Detected ${report.hallucinations_detected} issues ` +
      `(${report.critical_count} critical, ${report.high_count} high). ` +
      `Recommendation: ${report.recommendation}`
    );

    // Could store in database for pattern analysis
    // await this.hallucinationLogModel.create(logEntry);
  }

  /**
   * Quick check if a drug name looks suspicious
   */
  isNameSuspicious(drugName: string): boolean {
    for (const pattern of this.SUSPICIOUS_NAME_PATTERNS) {
      if (pattern.test(drugName)) return true;
    }
    return false;
  }

  /**
   * Get maximum known dose for a drug
   */
  getMaxDose(drugName: string): number | null {
    const normalized = drugName.toLowerCase();
    return this.MAX_DAILY_DOSES[normalized] || null;
  }
}
