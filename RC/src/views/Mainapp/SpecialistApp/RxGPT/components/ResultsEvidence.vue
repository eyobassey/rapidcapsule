<template>
  <div class="results-evidence">
    <!-- Summary Cards Grid -->
    <div class="evidence-grid">

      <!-- 1. Evidence Confidence -->
      <div class="evidence-card evidence-card--indigo" v-if="result.evidence_summary">
        <div class="evidence-card__header">
          <div class="evidence-card__icon evidence-card__icon--indigo">
            <v-icon name="hi-academic-cap" scale="0.9" />
          </div>
          <div class="evidence-card__title">Evidence Confidence</div>
        </div>
        <div class="evidence-card__value">
          {{ Math.round(result.evidence_summary.overall_evidence_score) }}<span class="value-unit">%</span>
        </div>
        <div class="evidence-card__details">
          <span
            class="evidence-badge"
            :class="evidenceLevelClass(result.evidence_summary.overall_evidence_level)"
          >
            {{ formatEvidenceLevel(result.evidence_summary.overall_evidence_level) }}
          </span>
          <div class="evidence-card__meta">
            <span class="meta-item meta-item--success">
              <v-icon name="hi-check-circle" scale="0.6" />
              {{ result.evidence_summary.drugs_with_strong_evidence }} strong
            </span>
            <span class="meta-item meta-item--warning">
              <v-icon name="hi-exclamation-circle" scale="0.6" />
              {{ result.evidence_summary.drugs_with_weak_evidence }} weak
            </span>
          </div>
        </div>
        <div class="evidence-card__footer" v-if="result.evidence_summary.off_label_count > 0">
          {{ result.evidence_summary.off_label_count }} off-label use{{ result.evidence_summary.off_label_count !== 1 ? 's' : '' }} detected
        </div>
      </div>

      <!-- 2. FDA Verification -->
      <div
        class="evidence-card"
        :class="fdaCardClass"
        v-if="result.verification_summary"
      >
        <div class="evidence-card__header">
          <div class="evidence-card__icon" :class="fdaIconClass">
            <v-icon name="hi-shield-check" scale="0.9" />
          </div>
          <div class="evidence-card__title">FDA Verification</div>
        </div>
        <div class="evidence-card__value">
          {{ result.verification_summary.verified_count }}<span class="value-separator">/</span><span class="value-total">{{ result.verification_summary.total_suggestions }}</span>
        </div>
        <div class="evidence-card__details">
          <span class="detail-text">verified in trusted databases</span>
          <div class="evidence-card__meta" v-if="result.verification_summary.fda_approved_count">
            <span class="meta-item meta-item--success">
              <v-icon name="hi-badge-check" scale="0.6" />
              {{ result.verification_summary.fda_approved_count }} FDA approved
            </span>
          </div>
        </div>
        <div
          class="evidence-card__footer evidence-card__footer--warn"
          v-if="result.verification_summary.has_unverified_drugs"
        >
          <v-icon name="hi-exclamation" scale="0.65" />
          {{ result.verification_summary.warning || `${result.verification_summary.unverified_count} unverified drug(s)` }}
        </div>
      </div>

      <!-- 3. Dosage Check -->
      <div
        class="evidence-card"
        :class="dosageCardClass"
        v-if="result.dosage_validation_summary"
      >
        <div class="evidence-card__header">
          <div class="evidence-card__icon" :class="dosageIconClass">
            <v-icon name="hi-scale" scale="0.9" />
          </div>
          <div class="evidence-card__title">Dosage Check</div>
        </div>
        <div class="evidence-card__value">
          <span :class="dosageStatusTextClass">{{ dosageStatusLabel }}</span>
        </div>
        <div class="evidence-card__details">
          <div class="evidence-card__meta">
            <span class="meta-item meta-item--success">
              <v-icon name="hi-check-circle" scale="0.6" />
              {{ result.dosage_validation_summary.safe_count }} safe
            </span>
            <span class="meta-item meta-item--warning" v-if="result.dosage_validation_summary.warning_count">
              <v-icon name="hi-exclamation-circle" scale="0.6" />
              {{ result.dosage_validation_summary.warning_count }} warning{{ result.dosage_validation_summary.warning_count !== 1 ? 's' : '' }}
            </span>
            <span class="meta-item meta-item--danger" v-if="result.dosage_validation_summary.danger_count">
              <v-icon name="hi-x-circle" scale="0.6" />
              {{ result.dosage_validation_summary.danger_count }} danger
            </span>
          </div>
        </div>
        <div
          class="evidence-card__footer evidence-card__footer--warn"
          v-if="result.dosage_validation_summary.warning"
        >
          <v-icon name="hi-exclamation" scale="0.65" />
          {{ result.dosage_validation_summary.warning }}
        </div>
      </div>

      <!-- 4. NICE UK Guidelines -->
      <div class="evidence-card evidence-card--blue" v-if="result.nice_compliance_summary">
        <div class="evidence-card__header">
          <div class="evidence-card__icon evidence-card__icon--blue">
            <v-icon name="hi-clipboard-check" scale="0.9" />
          </div>
          <div class="evidence-card__title">NICE UK Guidelines</div>
        </div>
        <div class="evidence-card__value">
          {{ result.nice_compliance_summary.fully_compliant }}<span class="value-separator">/</span><span class="value-total">{{ result.nice_compliance_summary.total_drugs_checked }}</span>
        </div>
        <div class="evidence-card__details">
          <span class="detail-text">fully compliant</span>
          <div class="evidence-card__meta">
            <span class="meta-item meta-item--info" v-if="result.nice_compliance_summary.partially_compliant">
              {{ result.nice_compliance_summary.partially_compliant }} partial
            </span>
            <span class="meta-item meta-item--warning" v-if="result.nice_compliance_summary.non_compliant">
              {{ result.nice_compliance_summary.non_compliant }} non-compliant
            </span>
            <span class="meta-item meta-item--muted" v-if="result.nice_compliance_summary.no_guidance_available">
              {{ result.nice_compliance_summary.no_guidance_available }} no guidance
            </span>
          </div>
        </div>
        <div
          class="evidence-card__footer evidence-card__footer--warn"
          v-if="result.nice_compliance_summary.has_compliance_issues"
        >
          <v-icon name="hi-exclamation" scale="0.65" />
          {{ result.nice_compliance_summary.warning || 'Compliance issues detected' }}
        </div>
      </div>

      <!-- 5. BNF UK Prescribing -->
      <div class="evidence-card evidence-card--purple" v-if="result.bnf_compliance_summary">
        <div class="evidence-card__header">
          <div class="evidence-card__icon evidence-card__icon--purple">
            <v-icon name="hi-book-open" scale="0.9" />
          </div>
          <div class="evidence-card__title">BNF UK Prescribing</div>
        </div>
        <div class="evidence-card__value">
          {{ result.bnf_compliance_summary.uk_approved_count }}<span class="value-separator">/</span><span class="value-total">{{ result.bnf_compliance_summary.total_drugs_checked }}</span>
        </div>
        <div class="evidence-card__details">
          <span class="detail-text">UK approved</span>
          <div class="evidence-card__meta">
            <span class="meta-item meta-item--warning" v-if="result.bnf_compliance_summary.dosage_warnings_count">
              {{ result.bnf_compliance_summary.dosage_warnings_count }} dosage warning{{ result.bnf_compliance_summary.dosage_warnings_count !== 1 ? 's' : '' }}
            </span>
            <span class="meta-item meta-item--danger" v-if="result.bnf_compliance_summary.interaction_alerts_count">
              {{ result.bnf_compliance_summary.interaction_alerts_count }} interaction{{ result.bnf_compliance_summary.interaction_alerts_count !== 1 ? 's' : '' }}
            </span>
          </div>
        </div>
        <div
          class="evidence-card__footer evidence-card__footer--warn"
          v-if="result.bnf_compliance_summary.has_uk_compliance_issues"
        >
          <v-icon name="hi-exclamation" scale="0.65" />
          {{ result.bnf_compliance_summary.warning || 'UK compliance issues detected' }}
        </div>
      </div>

      <!-- 6. AI Verification / Hallucination Check -->
      <div
        class="evidence-card"
        :class="hallucinationCardClass"
        v-if="result.hallucination_check"
      >
        <div class="evidence-card__header">
          <div class="evidence-card__icon" :class="hallucinationIconClass">
            <v-icon :name="getHallucinationIcon(result.hallucination_check.recommendation)" scale="0.9" />
          </div>
          <div class="evidence-card__title">AI Verification</div>
        </div>
        <div class="evidence-card__value">
          <span
            class="hallucination-badge"
            :class="hallucinationBadgeClass"
          >
            {{ formatHallucinationStatus(result.hallucination_check.recommendation) }}
          </span>
        </div>
        <div class="evidence-card__details">
          <div class="evidence-card__meta">
            <span class="meta-item meta-item--danger" v-if="result.hallucination_check.critical_count">
              {{ result.hallucination_check.critical_count }} critical
            </span>
            <span class="meta-item meta-item--warning" v-if="result.hallucination_check.high_count">
              {{ result.hallucination_check.high_count }} high
            </span>
            <span class="meta-item meta-item--info" v-if="result.hallucination_check.medium_count">
              {{ result.hallucination_check.medium_count }} medium
            </span>
            <span class="meta-item meta-item--muted" v-if="result.hallucination_check.low_count">
              {{ result.hallucination_check.low_count }} low
            </span>
          </div>
          <span class="detail-text">
            {{ result.hallucination_check.total_flags }} flag{{ result.hallucination_check.total_flags !== 1 ? 's' : '' }} detected
          </span>
        </div>
        <div class="evidence-card__footer" v-if="result.hallucination_check.suspicion_score > 0">
          Suspicion score: {{ result.hallucination_check.suspicion_score }}%
        </div>
      </div>

      <!-- 7. PubMed Evidence -->
      <div class="evidence-card evidence-card--teal" v-if="result.pubmed_evidence_summary">
        <div class="evidence-card__header">
          <div class="evidence-card__icon evidence-card__icon--teal">
            <v-icon name="hi-document-text" scale="0.9" />
          </div>
          <div class="evidence-card__title">PubMed Evidence</div>
        </div>
        <div class="evidence-card__value">
          {{ result.pubmed_evidence_summary.total_citations }}
          <span class="value-unit">citation{{ result.pubmed_evidence_summary.total_citations !== 1 ? 's' : '' }}</span>
        </div>
        <div class="evidence-card__details">
          <div class="evidence-card__meta">
            <span class="meta-item meta-item--success" v-if="result.pubmed_evidence_summary.high_quality_evidence_count">
              <v-icon name="hi-star" scale="0.6" />
              {{ result.pubmed_evidence_summary.high_quality_evidence_count }} high quality
            </span>
            <span class="meta-item meta-item--info">
              {{ result.pubmed_evidence_summary.total_drugs_with_evidence }} drug{{ result.pubmed_evidence_summary.total_drugs_with_evidence !== 1 ? 's' : '' }} with evidence
            </span>
          </div>
        </div>
        <div
          class="evidence-card__footer evidence-card__footer--warn"
          v-if="result.pubmed_evidence_summary.drugs_without_evidence?.length"
        >
          <v-icon name="hi-exclamation" scale="0.65" />
          No evidence: {{ result.pubmed_evidence_summary.drugs_without_evidence.join(', ') }}
        </div>
      </div>
    </div>

    <!-- Hallucination Warning Alert -->
    <div
      v-if="showHallucinationWarning"
      class="hallucination-alert"
      :class="hallucinationAlertClass"
    >
      <div class="hallucination-alert__icon">
        <v-icon
          :name="result.hallucination_check.recommendation === 'reject' ? 'hi-x-circle' : 'hi-exclamation'"
          scale="1.1"
        />
      </div>
      <div class="hallucination-alert__content">
        <div class="hallucination-alert__title">
          {{ result.hallucination_check.recommendation === 'reject'
            ? 'AI Output Flagged -- Manual Review Required'
            : 'AI Output Requires Review'
          }}
        </div>
        <p class="hallucination-alert__text">
          {{ result.hallucination_check.summary }}
        </p>
        <div class="hallucination-alert__drugs" v-if="result.hallucination_check.flagged_drugs?.length">
          <div
            v-for="(drug, idx) in result.hallucination_check.flagged_drugs"
            :key="idx"
            class="flagged-drug"
          >
            <span class="flagged-drug__name">{{ drug.drug_name }}</span>
            <span
              v-for="(issue, iIdx) in drug.issues"
              :key="iIdx"
              class="flagged-drug__issue"
              :class="`flagged-drug__issue--${issue.severity}`"
            >
              {{ issue.reason }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import {
  formatEvidenceLevel,
  formatHallucinationStatus,
  getHallucinationIcon,
} from '../composables/useRxGPT';

const props = defineProps({
  result: {
    type: Object,
    required: true,
  },
});

// --- Evidence level badge class ---
function evidenceLevelClass(level) {
  const map = {
    very_high: 'evidence-badge--very-high',
    high: 'evidence-badge--high',
    moderate: 'evidence-badge--moderate',
    low: 'evidence-badge--low',
    very_low: 'evidence-badge--very-low',
  };
  return map[level] || 'evidence-badge--moderate';
}

// --- FDA Verification card ---
const fdaCardClass = computed(() => {
  const vs = props.result.verification_summary;
  if (!vs) return '';
  return vs.has_unverified_drugs ? 'evidence-card--amber' : 'evidence-card--green';
});

const fdaIconClass = computed(() => {
  const vs = props.result.verification_summary;
  if (!vs) return '';
  return vs.has_unverified_drugs ? 'evidence-card__icon--amber' : 'evidence-card__icon--green';
});

// --- Dosage Check card ---
const dosageCardClass = computed(() => {
  const ds = props.result.dosage_validation_summary;
  if (!ds) return '';
  if (ds.danger_count > 0) return 'evidence-card--red';
  if (ds.warning_count > 0) return 'evidence-card--amber';
  return 'evidence-card--green';
});

const dosageIconClass = computed(() => {
  const ds = props.result.dosage_validation_summary;
  if (!ds) return '';
  if (ds.danger_count > 0) return 'evidence-card__icon--red';
  if (ds.warning_count > 0) return 'evidence-card__icon--amber';
  return 'evidence-card__icon--green';
});

const dosageStatusLabel = computed(() => {
  const ds = props.result.dosage_validation_summary;
  if (!ds) return '';
  if (ds.danger_count > 0) return 'Danger';
  if (ds.warning_count > 0) return 'Warning';
  return 'Safe';
});

const dosageStatusTextClass = computed(() => {
  const ds = props.result.dosage_validation_summary;
  if (!ds) return '';
  if (ds.danger_count > 0) return 'status-text--danger';
  if (ds.warning_count > 0) return 'status-text--warning';
  return 'status-text--safe';
});

// --- Hallucination Check card ---
const hallucinationCardClass = computed(() => {
  const hc = props.result.hallucination_check;
  if (!hc) return '';
  const map = {
    safe: 'evidence-card--green',
    review_required: 'evidence-card--amber',
    reject: 'evidence-card--red',
  };
  return map[hc.recommendation] || '';
});

const hallucinationIconClass = computed(() => {
  const hc = props.result.hallucination_check;
  if (!hc) return '';
  const map = {
    safe: 'evidence-card__icon--green',
    review_required: 'evidence-card__icon--amber',
    reject: 'evidence-card__icon--red',
  };
  return map[hc.recommendation] || '';
});

const hallucinationBadgeClass = computed(() => {
  const hc = props.result.hallucination_check;
  if (!hc) return '';
  const map = {
    safe: 'hallucination-badge--safe',
    review_required: 'hallucination-badge--review',
    reject: 'hallucination-badge--reject',
  };
  return map[hc.recommendation] || '';
});

// --- Hallucination Warning Alert ---
const showHallucinationWarning = computed(() => {
  const hc = props.result.hallucination_check;
  return hc && (hc.recommendation === 'reject' || hc.recommendation === 'review_required');
});

const hallucinationAlertClass = computed(() => {
  const hc = props.result.hallucination_check;
  if (!hc) return '';
  return hc.recommendation === 'reject'
    ? 'hallucination-alert--reject'
    : 'hallucination-alert--review';
});
</script>

<style lang="scss" scoped>
// ============ Color Variables ============
$sky: #4FC3F7;
$sky-light: #E1F5FE;
$sky-dark: #0288D1;
$sky-darker: #01579B;
$navy: #0F172A;
$slate: #334155;
$gray: #64748B;
$bg: #F8FAFC;
$green: #10b981;
$amber: #f59e0b;
$red: #ef4444;
$blue: #3b82f6;
$purple: #8b5cf6;
$teal: #14b8a6;

// ============ Grid Layout ============
.results-evidence {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.evidence-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
}

// ============ Glass Card Base ============
.evidence-card {
  position: relative;
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  overflow: hidden;

  // Left colored border (pseudo-element)
  &::before {
    content: '';
    position: absolute;
    top: 12px;
    bottom: 12px;
    left: 0;
    width: 3px;
    border-radius: 0 3px 3px 0;
    background: #d1d5db;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  }

  // Color modifiers for left border
  &--indigo::before { background: $sky-dark; }
  &--green::before { background: $green; }
  &--amber::before { background: $amber; }
  &--red::before { background: $red; }
  &--blue::before { background: $blue; }
  &--purple::before { background: $purple; }
  &--teal::before { background: $teal; }
}

// ============ Card Header ============
.evidence-card__header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.evidence-card__icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;

  &--indigo { background: linear-gradient(135deg, $sky 0%, $sky-dark 100%); }
  &--green { background: linear-gradient(135deg, $green, darken($green, 10%)); }
  &--amber { background: linear-gradient(135deg, $amber, darken($amber, 10%)); }
  &--red { background: linear-gradient(135deg, $red, darken($red, 10%)); }
  &--blue { background: linear-gradient(135deg, $blue, darken($blue, 10%)); }
  &--purple { background: linear-gradient(135deg, $purple, darken($purple, 10%)); }
  &--teal { background: linear-gradient(135deg, $teal, darken($teal, 10%)); }
}

.evidence-card__title {
  font-size: 13px;
  font-weight: 700;
  color: $slate;
  letter-spacing: -0.01em;
}

// ============ Card Value ============
.evidence-card__value {
  font-size: 32px;
  font-weight: 800;
  color: $navy;
  line-height: 1.1;
  margin-bottom: 10px;
}

.value-unit {
  font-size: 16px;
  font-weight: 600;
  color: $gray;
  margin-left: 2px;
}

.value-separator {
  font-size: 22px;
  font-weight: 400;
  color: #d1d5db;
  margin: 0 2px;
}

.value-total {
  font-size: 22px;
  font-weight: 600;
  color: #9ca3af;
}

// ============ Status text ============
.status-text--safe {
  color: $green;
  font-size: 24px;
}

.status-text--warning {
  color: $amber;
  font-size: 24px;
}

.status-text--danger {
  color: $red;
  font-size: 24px;
}

// ============ Card Details ============
.evidence-card__details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-text {
  font-size: 12px;
  color: $gray;
}

.evidence-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;

  &--success { color: #059669; }
  &--warning { color: #d97706; }
  &--danger { color: #dc2626; }
  &--info { color: #2563eb; }
  &--muted { color: #9ca3af; }
}

// ============ Evidence Level Badge ============
.evidence-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.3px;

  &--very-high { background: #d1fae5; color: #065f46; }
  &--high { background: #dbeafe; color: #1e40af; }
  &--moderate { background: #fef3c7; color: #92400e; }
  &--low { background: #fed7aa; color: #9a3412; }
  &--very-low { background: #fee2e2; color: #991b1b; }
}

// ============ Hallucination Badge ============
.hallucination-badge {
  display: inline-block;
  padding: 5px 14px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 700;

  &--safe { background: #d1fae5; color: #065f46; }
  &--review { background: #fef3c7; color: #92400e; }
  &--reject { background: #fee2e2; color: #991b1b; }
}

// ============ Card Footer ============
.evidence-card__footer {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  font-size: 11px;
  color: $gray;

  &--warn {
    display: flex;
    align-items: flex-start;
    gap: 4px;
    color: #d97706;
    font-weight: 500;
  }
}

// ============ Hallucination Warning Alert ============
.hallucination-alert {
  display: flex;
  gap: 16px;
  padding: 20px 24px;
  border-radius: 16px;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);

  &--review {
    background: rgba(255, 237, 213, 0.7);
    border: 1.5px solid rgba(245, 158, 11, 0.3);
  }

  &--reject {
    background: rgba(254, 226, 226, 0.7);
    border: 1.5px solid rgba(239, 68, 68, 0.3);
  }
}

.hallucination-alert__icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;

  .hallucination-alert--review & {
    background: rgba(245, 158, 11, 0.15);
    color: #d97706;
  }

  .hallucination-alert--reject & {
    background: rgba(239, 68, 68, 0.15);
    color: #dc2626;
  }
}

.hallucination-alert__content {
  flex: 1;
  min-width: 0;
}

.hallucination-alert__title {
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 6px;

  .hallucination-alert--review & { color: #92400e; }
  .hallucination-alert--reject & { color: #991b1b; }
}

.hallucination-alert__text {
  font-size: 13px;
  line-height: 1.55;
  margin: 0 0 12px;

  .hallucination-alert--review & { color: #78350f; }
  .hallucination-alert--reject & { color: #7f1d1d; }
}

.hallucination-alert__drugs {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.flagged-drug {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.flagged-drug__name {
  font-size: 12px;
  font-weight: 700;
  color: $slate;
  background: rgba(255, 255, 255, 0.6);
  padding: 2px 10px;
  border-radius: 6px;
}

.flagged-drug__issue {
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 6px;

  &--critical {
    background: rgba(239, 68, 68, 0.12);
    color: #dc2626;
  }

  &--high {
    background: rgba(239, 68, 68, 0.08);
    color: #b91c1c;
  }

  &--medium {
    background: rgba(245, 158, 11, 0.12);
    color: #d97706;
  }

  &--low {
    background: rgba(107, 114, 128, 0.1);
    color: $gray;
  }
}
</style>
