import { Injectable, NotFoundException } from '@nestjs/common';
import {
  HARM_REDUCTION_CONTENT,
  OPIOID_OVERDOSE_RESPONSE,
  ALCOHOL_OVERDOSE_RESPONSE,
  STIMULANT_OVERDOSE_RESPONSE,
  FENTANYL_TEST_STRIP_INFO,
  UK_EMERGENCY_RESOURCES,
  NEEDLE_EXCHANGE_INFO,
  DRUG_CHECKING_INFO,
  SafeUseGuidance,
  OverdoseResponseStep,
} from '../constants/harm-reduction-content';

@Injectable()
export class HarmReductionService {
  /**
   * Get safer use guidance for a specific substance.
   */
  getSafeUseGuidance(substance: string): SafeUseGuidance {
    const key = substance.toLowerCase().replace(/\s+/g, '_');
    const content = HARM_REDUCTION_CONTENT[key];
    if (!content) {
      throw new NotFoundException(
        `No harm reduction guidance found for "${substance}". Available: ${Object.keys(HARM_REDUCTION_CONTENT).join(', ')}`,
      );
    }
    return content;
  }

  /**
   * Get all available substance guidance topics.
   */
  getAvailableSubstances() {
    return Object.entries(HARM_REDUCTION_CONTENT).map(([key, value]) => ({
      key,
      display_name: value.display_name,
    }));
  }

  /**
   * Get overdose response guide for a substance category.
   */
  getOverdoseResponseGuide(substance: string): {
    substance: string;
    steps: OverdoseResponseStep[];
    key_message: string;
  } {
    const key = substance.toLowerCase();

    if (key.includes('opioid') || key.includes('heroin') || key.includes('fentanyl')) {
      return {
        substance: 'Opioids',
        steps: OPIOID_OVERDOSE_RESPONSE,
        key_message:
          'Administer naloxone immediately if available. Call 999. Give rescue breaths. You will NOT get in trouble for calling for help.',
      };
    }

    if (key.includes('alcohol')) {
      return {
        substance: 'Alcohol',
        steps: ALCOHOL_OVERDOSE_RESPONSE,
        key_message:
          'Place in recovery position to prevent choking. Call 999. Keep warm. Do NOT leave them alone.',
      };
    }

    if (
      key.includes('stimulant') ||
      key.includes('cocaine') ||
      key.includes('amphetamine') ||
      key.includes('mdma')
    ) {
      return {
        substance: 'Stimulants',
        steps: STIMULANT_OVERDOSE_RESPONSE,
        key_message:
          'Call 999. Cool them down. Keep calm. If seizure: clear area, do not restrain, time it.',
      };
    }

    // Generic guide
    return {
      substance: substance,
      steps: [
        {
          step: 1,
          action: 'CALL 999 immediately',
          detail: 'Describe the symptoms and what substance was taken if known.',
        },
        {
          step: 2,
          action: 'Place in RECOVERY POSITION if unconscious',
          detail:
            'Roll onto their side, tilt head back, bend top knee forward.',
        },
        {
          step: 3,
          action: 'STAY with them',
          detail:
            'Monitor breathing. If breathing stops, start CPR if trained.',
        },
      ],
      key_message:
        'Always call 999 in a suspected overdose. You will not get in trouble. Staying with the person saves lives.',
    };
  }

  /**
   * Get UK emergency resources and helplines.
   */
  getEmergencyResources() {
    return UK_EMERGENCY_RESOURCES;
  }

  /**
   * Get fentanyl test strip information.
   */
  getFentanylTestStripInfo() {
    return FENTANYL_TEST_STRIP_INFO;
  }

  /**
   * Get needle exchange / syringe service information.
   */
  getNeedleExchangeInfo() {
    return NEEDLE_EXCHANGE_INFO;
  }

  /**
   * Get drug checking service information.
   */
  getDrugCheckingInfo() {
    return DRUG_CHECKING_INFO;
  }

  /**
   * Get comprehensive harm reduction package for a substance.
   * Combines all relevant information into a single response.
   */
  getComprehensiveGuide(substance: string) {
    const guidance = this.getSafeUseGuidance(substance);
    const overdoseGuide = this.getOverdoseResponseGuide(substance);

    return {
      guidance,
      overdose_response: overdoseGuide,
      emergency_resources: UK_EMERGENCY_RESOURCES.slice(0, 5), // Top 5
      fentanyl_testing:
        substance.toLowerCase().includes('opioid') ||
        substance.toLowerCase().includes('stimulant')
          ? FENTANYL_TEST_STRIP_INFO
          : undefined,
      needle_exchange:
        substance.toLowerCase().includes('opioid') ||
        substance.toLowerCase().includes('stimulant')
          ? NEEDLE_EXCHANGE_INFO
          : undefined,
    };
  }
}
