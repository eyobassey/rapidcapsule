import { ref } from 'vue';
import apiFactory from '@/services/apiFactory';
import { formatCurrency } from '@/utilities/currency';

// ============ Formatters ============

export function formatAlertType(type) {
  const types = {
    allergy: 'Allergy',
    interaction: 'Drug Interaction',
    contraindication: 'Contraindication',
    dosage: 'Dosage Issue',
    age: 'Age Concern',
    pregnancy: 'Pregnancy Risk',
  };
  return types[type] || type;
}

export function formatPrice(price) {
  if (!price && price !== 0) return '—';
  return formatCurrency(price);
}

export function formatRiskLevel(level) {
  const labels = {
    low: 'Low Risk',
    moderate: 'Moderate Risk',
    high: 'High Risk',
    critical: 'Critical',
  };
  return labels[level] || level;
}

export function getRiskClass(level) {
  const classes = {
    low: 'risk--low',
    moderate: 'risk--moderate',
    high: 'risk--high',
    critical: 'risk--critical',
  };
  return classes[level] || '';
}

export function getRiskBadgeClass(level) {
  const classes = {
    low: 'badge--success',
    moderate: 'badge--warning',
    high: 'badge--danger',
    critical: 'badge--critical',
  };
  return classes[level] || 'badge--default';
}

export function getRiskIcon(level) {
  const icons = {
    low: 'hi-shield-check',
    moderate: 'hi-exclamation-circle',
    high: 'hi-exclamation',
    critical: 'co-warning',
  };
  return icons[level] || 'hi-information-circle';
}

export function getAlertIcon(type) {
  const icons = {
    allergy: 'hi-exclamation',
    interaction: 'gi-medicines',
    contraindication: 'hi-ban',
    dosage: 'hi-scale',
    age: 'hi-user',
    pregnancy: 'hi-heart',
  };
  return icons[type] || 'hi-information-circle';
}

export function hasVerificationInfo(med) {
  return !!(
    med.verification ||
    med.evidence_confidence ||
    med.dosage_validation ||
    med.nice_compliance ||
    med.bnf_info ||
    med.pubmed_citations?.citations?.length
  );
}

export function formatEvidenceLevel(level) {
  const labels = {
    very_high: 'Very High',
    high: 'High',
    moderate: 'Moderate',
    low: 'Low',
    very_low: 'Very Low',
  };
  return labels[level] || level;
}

export function formatSourceName(source) {
  const names = {
    local_inventory: 'Inventory',
    openfda: 'FDA',
    pubmed: 'PubMed',
    nice: 'NICE',
    bnf: 'BNF',
    fda_approved: 'FDA Approved',
    nice_recommended: 'NICE Recommended',
    pubmed_high_quality: 'PubMed (High Quality)',
  };
  return names[source] || source;
}

export function formatComplianceLevel(level) {
  const labels = {
    full: 'Fully Compliant',
    partial: 'Partially Compliant',
    none: 'Non-Compliant',
    unknown: 'Unknown',
  };
  return labels[level] || level;
}

export function formatRecommendationType(type) {
  const labels = {
    recommended: 'Recommended',
    consider: 'Consider',
    do_not_offer: 'Do Not Offer',
    caution: 'Use with Caution',
  };
  return labels[type] || type;
}

export function formatLineOfTreatment(line) {
  const labels = {
    first_line: '1st Line',
    second_line: '2nd Line',
    third_line: '3rd Line',
    adjunct: 'Adjunct',
  };
  return labels[line] || line;
}

export function formatHallucinationStatus(status) {
  const labels = {
    safe: 'Verified Safe',
    review_required: 'Review Needed',
    reject: 'Flagged',
  };
  return labels[status] || status;
}

export function getHallucinationIcon(status) {
  const icons = {
    safe: 'hi-shield-check',
    review_required: 'hi-exclamation-circle',
    reject: 'hi-exclamation',
  };
  return icons[status] || 'hi-question-mark-circle';
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatPriority(priority) {
  const labels = {
    primary: 'Primary',
    alternative: 'Alternative',
    supplementary: 'Supplementary',
  };
  return labels[priority] || priority;
}

export function getPriorityClass(priority) {
  const classes = {
    primary: 'priority--primary',
    alternative: 'priority--alternative',
    supplementary: 'priority--supplementary',
  };
  return classes[priority] || '';
}

// ============ Composable Hook ============

export function useRxGPT() {
  const credits = ref(null);
  const settings = ref(null);
  const isLoadingCredits = ref(false);

  async function fetchCreditsAndSettings() {
    isLoadingCredits.value = true;
    try {
      const [creditsRes, settingsRes] = await Promise.all([
        apiFactory.$_getRxGPTCredits(),
        apiFactory.$_getRxGPTSettings(),
      ]);
      credits.value = creditsRes.data?.data || creditsRes.data;
      settings.value = settingsRes.data?.data || settingsRes.data;
    } catch (e) {
      console.error('Failed to load RxGPT credits/settings:', e);
    } finally {
      isLoadingCredits.value = false;
    }
  }

  return {
    credits,
    settings,
    isLoadingCredits,
    fetchCreditsAndSettings,
  };
}
