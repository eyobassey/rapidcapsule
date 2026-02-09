<template>
  <div class="results-medications">
    <div
      v-for="(med, index) in suggestions"
      :key="index"
      class="med-card"
      :class="[getPriorityClass(med.priority)]"
    >
      <!-- Card Header -->
      <div class="med-card__header">
        <div class="med-card__title-row">
          <span class="priority-badge" :class="med.priority">
            {{ formatPriority(med.priority) }}
          </span>
          <h4 class="med-card__name">{{ med.drug_name }}</h4>
          <span v-if="med.generic_name" class="med-card__generic">({{ med.generic_name }})</span>
        </div>
        <div class="med-card__inventory">
          <span v-if="med.is_in_inventory" class="inventory-badge" :class="med.inventory_status">
            <v-icon :name="med.inventory_status === 'out_of_stock' ? 'hi-exclamation-circle' : 'hi-check-circle'" scale="0.7" />
            {{ inventoryLabel(med) }}
          </span>
          <span v-else class="inventory-badge external">
            <v-icon name="hi-external-link" scale="0.7" />
            External
          </span>
        </div>
      </div>

      <!-- Detail Grid -->
      <div class="med-card__details">
        <div class="detail-cell">
          <span class="detail-cell__label">Strength</span>
          <span class="detail-cell__value">{{ med.strength }}</span>
        </div>
        <div class="detail-cell">
          <span class="detail-cell__label">Form</span>
          <span class="detail-cell__value">{{ med.dosage_form }}</span>
        </div>
        <div class="detail-cell">
          <span class="detail-cell__label">Dosage</span>
          <span class="detail-cell__value">{{ med.suggested_dosage }}</span>
        </div>
        <div class="detail-cell">
          <span class="detail-cell__label">Frequency</span>
          <span class="detail-cell__value">{{ med.suggested_frequency }}</span>
        </div>
        <div class="detail-cell">
          <span class="detail-cell__label">Duration</span>
          <span class="detail-cell__value">{{ med.suggested_duration || '---' }}</span>
        </div>
        <div class="detail-cell">
          <span class="detail-cell__label">Quantity</span>
          <span class="detail-cell__value">{{ med.suggested_quantity }}</span>
        </div>
        <div v-if="med.unit_price" class="detail-cell">
          <span class="detail-cell__label">Price</span>
          <span class="detail-cell__value detail-cell__value--price">
            {{ med.currency || '\u20A6' }}{{ formatPrice(med.unit_price) }}/unit
          </span>
        </div>
      </div>

      <!-- Reasoning Box -->
      <div v-if="med.reasoning" class="med-card__reasoning">
        <v-icon name="hi-light-bulb" scale="0.75" class="reasoning-icon" />
        <p>{{ med.reasoning }}</p>
      </div>

      <!-- Instructions Box -->
      <div v-if="med.instructions" class="med-card__instructions">
        <v-icon name="hi-information-circle" scale="0.75" class="instructions-icon" />
        <p>{{ med.instructions }}</p>
      </div>

      <!-- Confidence Bar -->
      <div class="med-card__confidence">
        <div class="confidence-track">
          <div
            class="confidence-fill"
            :class="confidenceClass(med.confidence)"
            :style="{ width: `${med.confidence}%` }"
          ></div>
        </div>
        <span class="confidence-pct" :class="confidenceClass(med.confidence)">
          {{ med.confidence }}%
        </span>
      </div>

      <!-- Safety Alerts -->
      <div v-if="med.safety_alerts?.length" class="med-card__alerts">
        <div v-for="(alert, aIdx) in med.safety_alerts" :key="aIdx" class="alert-item" :class="alert.severity">
          <v-icon :name="getAlertIcon(alert.type)" scale="0.75" />
          <div class="alert-item__body">
            <span class="alert-item__type">{{ formatAlertType(alert.type) }}</span>
            <span class="alert-item__msg">{{ alert.message }}</span>
          </div>
          <span class="alert-item__severity">{{ alert.severity }}</span>
        </div>
      </div>

      <!-- Contraindication Warnings -->
      <div v-if="med.contraindication_check?.warnings?.length" class="med-card__contra-warnings">
        <v-icon name="hi-exclamation-circle" scale="0.75" />
        <span>{{ med.contraindication_check.warnings.join('; ') }}</span>
      </div>

      <!-- Collapsible Verification & Evidence Section -->
      <div v-if="hasVerificationInfo(med)" class="med-card__verification">
        <button class="verification-toggle" @click="toggle(index)">
          <v-icon :name="isExpanded(index) ? 'hi-chevron-up' : 'hi-chevron-down'" scale="0.75" />
          <span>Verification &amp; Evidence</span>
          <div class="verification-toggle__badges">
            <span v-if="med.verification?.fda_approved" class="mini-badge mini-badge--fda">
              <v-icon name="hi-shield-check" scale="0.55" /> FDA
            </span>
            <span v-else-if="med.verification && !med.verification.is_verified" class="mini-badge mini-badge--unverified">
              <v-icon name="hi-exclamation-triangle" scale="0.55" /> Unverified
            </span>
            <span v-if="med.nice_compliance?.is_compliant" class="mini-badge mini-badge--nice">NICE</span>
            <span v-if="med.bnf_info?.uk_approved" class="mini-badge mini-badge--bnf">BNF</span>
            <span v-if="med.pubmed_citations?.total_found > 0" class="mini-badge mini-badge--pubmed">
              {{ med.pubmed_citations.total_found }} refs
            </span>
          </div>
        </button>

        <transition name="expand">
          <div v-if="isExpanded(index)" class="verification-body">
            <!-- Evidence Confidence Breakdown -->
            <div v-if="med.evidence_confidence" class="v-section v-section--evidence">
              <div class="v-section__header">
                <span class="v-section__icon v-section__icon--violet">
                  <v-icon name="hi-beaker" scale="0.7" />
                </span>
                <span class="v-section__title">Evidence-Based Confidence</span>
                <span class="level-tag" :class="med.evidence_confidence.evidence_level">
                  {{ formatEvidenceLevel(med.evidence_confidence.evidence_level) }}
                </span>
              </div>
              <div class="evidence-bar">
                <div class="evidence-fill" :style="{ width: `${med.evidence_confidence.final_score}%` }"></div>
              </div>
              <div class="evidence-scores">
                <span>Final: <strong>{{ med.evidence_confidence.final_score }}%</strong></span>
                <span>Base: {{ med.evidence_confidence.base_score }}%</span>
              </div>
              <p v-if="med.evidence_confidence.evidence_summary" class="v-section__text">
                {{ med.evidence_confidence.evidence_summary }}
              </p>
              <div v-if="med.evidence_confidence.is_off_label" class="off-label-flag">
                <v-icon name="hi-information-circle" scale="0.6" />
                <span>Off-label use</span>
              </div>
              <!-- Adjustments Table -->
              <div v-if="med.evidence_confidence.adjustments?.length" class="adjustments-table">
                <div class="adj-row adj-row--header">
                  <span>Source</span>
                  <span>Adj.</span>
                  <span>Reason</span>
                </div>
                <div v-for="(adj, adjIdx) in med.evidence_confidence.adjustments" :key="adjIdx" class="adj-row">
                  <span class="adj-source">{{ formatSourceName(adj.source) }}</span>
                  <span class="adj-value" :class="adj.adjustment >= 0 ? 'positive' : 'negative'">
                    {{ adj.adjustment >= 0 ? '+' : '' }}{{ adj.adjustment }}
                  </span>
                  <span class="adj-reason">{{ adj.reason }}</span>
                </div>
              </div>
            </div>

            <!-- FDA Verification -->
            <div v-if="med.verification" class="v-section v-section--fda">
              <div class="v-section__header">
                <span class="v-section__icon v-section__icon--emerald">
                  <v-icon name="hi-shield-check" scale="0.7" />
                </span>
                <span class="v-section__title">FDA Verification</span>
                <span class="status-tag" :class="med.verification.is_verified ? 'verified' : 'unverified'">
                  {{ med.verification.is_verified ? 'Verified' : 'Unverified' }}
                </span>
              </div>
              <div v-if="med.verification.verified_sources?.length" class="source-list">
                <span class="source-list__label">Sources:</span>
                <span v-for="(src, sIdx) in med.verification.verified_sources" :key="sIdx" class="source-tag">
                  {{ formatSourceName(src) }}
                </span>
              </div>
              <div v-if="med.verification.verification_warnings?.length" class="warning-list">
                <div v-for="(warn, wIdx) in med.verification.verification_warnings" :key="wIdx" class="warning-item">
                  <v-icon name="hi-exclamation-triangle" scale="0.6" />
                  {{ warn }}
                </div>
              </div>
            </div>

            <!-- Dosage Validation -->
            <div v-if="med.dosage_validation" class="v-section v-section--dosage">
              <div class="v-section__header">
                <span class="v-section__icon" :class="dosageIconClass(med.dosage_validation.status)">
                  <v-icon name="bi-capsule" scale="0.7" />
                </span>
                <span class="v-section__title">Dosage Validation</span>
                <span class="status-tag" :class="med.dosage_validation.status">
                  {{ dosageStatusLabel(med.dosage_validation.status) }}
                </span>
              </div>
              <!-- FDA Dosage Ranges -->
              <div v-if="med.dosage_validation.fda_dosage_info" class="fda-ranges">
                <div v-if="med.dosage_validation.fda_dosage_info.adult" class="fda-range-row">
                  <span class="fda-range-row__label">Adult Range:</span>
                  <span class="fda-range-row__value">
                    {{ med.dosage_validation.fda_dosage_info.adult.min_dose || '?' }}
                    &ndash;
                    {{ med.dosage_validation.fda_dosage_info.adult.max_dose || '?' }}
                    <template v-if="med.dosage_validation.fda_dosage_info.adult.max_daily_dose">
                      (max {{ med.dosage_validation.fda_dosage_info.adult.max_daily_dose }}/day)
                    </template>
                  </span>
                </div>
                <div v-if="med.dosage_validation.fda_dosage_info.pediatric" class="fda-range-row">
                  <span class="fda-range-row__label">Pediatric Range:</span>
                  <span class="fda-range-row__value">
                    {{ med.dosage_validation.fda_dosage_info.pediatric.min_dose || '?' }}
                    &ndash;
                    {{ med.dosage_validation.fda_dosage_info.pediatric.max_dose || '?' }}
                    <template v-if="med.dosage_validation.fda_dosage_info.pediatric.dose_per_kg">
                      ({{ med.dosage_validation.fda_dosage_info.pediatric.dose_per_kg }}/kg)
                    </template>
                  </span>
                </div>
                <div v-if="med.dosage_validation.fda_dosage_info.geriatric" class="fda-range-row">
                  <span class="fda-range-row__label">Geriatric Range:</span>
                  <span class="fda-range-row__value">
                    {{ med.dosage_validation.fda_dosage_info.geriatric.min_dose || '?' }}
                    &ndash;
                    {{ med.dosage_validation.fda_dosage_info.geriatric.max_dose || '?' }}
                  </span>
                </div>
              </div>
              <div v-if="med.dosage_validation.validated_for_patient" class="dosage-patient-ctx">
                Validated for: {{ med.dosage_validation.validated_for_patient.population }}
                (age {{ med.dosage_validation.validated_for_patient.age }}<template v-if="med.dosage_validation.validated_for_patient.weight">, {{ med.dosage_validation.validated_for_patient.weight }}kg</template>)
              </div>
              <div v-if="med.dosage_validation.warnings?.length" class="warning-list">
                <div v-for="(warn, wIdx) in med.dosage_validation.warnings" :key="wIdx" class="warning-item">
                  <v-icon name="hi-exclamation-circle" scale="0.6" />
                  {{ warn }}
                </div>
              </div>
            </div>

            <!-- NICE Compliance -->
            <div v-if="med.nice_compliance" class="v-section v-section--nice">
              <div class="v-section__header">
                <span class="v-section__icon v-section__icon--nice">NICE</span>
                <span class="v-section__title">UK Guidelines Compliance</span>
                <span class="status-tag" :class="med.nice_compliance.compliance_level">
                  {{ formatComplianceLevel(med.nice_compliance.compliance_level) }}
                </span>
              </div>
              <div v-if="med.nice_compliance.recommendation_type" class="nice-rec-row">
                <span class="nice-rec-row__label">Recommendation:</span>
                <span class="rec-type-tag" :class="med.nice_compliance.recommendation_type">
                  {{ formatRecommendationType(med.nice_compliance.recommendation_type) }}
                </span>
                <span v-if="med.nice_compliance.line_of_treatment" class="line-tag">
                  {{ formatLineOfTreatment(med.nice_compliance.line_of_treatment) }}
                </span>
              </div>
              <p v-if="med.nice_compliance.recommendation_text" class="v-section__text">
                {{ med.nice_compliance.recommendation_text }}
              </p>
              <div v-if="med.nice_compliance.guideline_references?.length" class="guideline-links">
                <a
                  v-for="(ref, rIdx) in med.nice_compliance.guideline_references"
                  :key="rIdx"
                  :href="ref.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="guideline-link"
                >
                  <v-icon name="hi-external-link" scale="0.6" />
                  {{ ref.title }}
                </a>
              </div>
              <div v-if="med.nice_compliance.warnings?.length" class="warning-list">
                <div v-for="(warn, wIdx) in med.nice_compliance.warnings" :key="wIdx" class="warning-item">
                  {{ warn }}
                </div>
              </div>
            </div>

            <!-- BNF Information -->
            <div v-if="med.bnf_info" class="v-section v-section--bnf">
              <div class="v-section__header">
                <span class="v-section__icon v-section__icon--bnf">BNF</span>
                <span class="v-section__title">UK Prescribing</span>
                <span class="status-tag" :class="med.bnf_info.uk_approved ? 'verified' : 'unverified'">
                  {{ med.bnf_info.uk_approved ? 'UK Approved' : 'Not UK Approved' }}
                </span>
              </div>
              <div v-if="med.bnf_info.drug_class" class="bnf-meta-row">
                <span class="bnf-meta-row__label">Class:</span>
                <span>{{ med.bnf_info.drug_class }}</span>
              </div>
              <div v-if="med.bnf_info.indications?.length" class="bnf-meta-row">
                <span class="bnf-meta-row__label">Indications:</span>
                <span>{{ med.bnf_info.indications.join(', ') }}</span>
                <span v-if="med.bnf_info.indication_match" class="match-badge">
                  <v-icon name="hi-check" scale="0.5" /> Match
                </span>
              </div>
              <div v-if="med.bnf_info.cautions?.length" class="bnf-cautions">
                <span class="bnf-meta-row__label">Cautions:</span>
                <span v-for="(caution, cIdx) in med.bnf_info.cautions.slice(0, 4)" :key="cIdx" class="caution-chip">
                  {{ caution }}
                </span>
              </div>
              <!-- Interactions -->
              <div v-if="med.bnf_info.interactions?.length" class="bnf-interactions">
                <span class="bnf-meta-row__label">Interactions:</span>
                <div v-for="(inter, iIdx) in med.bnf_info.interactions.slice(0, 4)" :key="iIdx" class="interaction-row">
                  <span class="interaction-severity" :class="inter.severity">{{ inter.severity }}</span>
                  <span class="interaction-detail">{{ inter.drug }}: {{ inter.effect }}</span>
                </div>
              </div>
              <a v-if="med.bnf_info.bnf_url" :href="med.bnf_info.bnf_url" target="_blank" rel="noopener noreferrer" class="ext-link">
                <v-icon name="hi-external-link" scale="0.6" />
                View in BNF
              </a>
            </div>

            <!-- PubMed Citations -->
            <div v-if="med.pubmed_citations?.citations?.length" class="v-section v-section--pubmed">
              <div class="v-section__header">
                <span class="v-section__icon v-section__icon--pubmed">
                  <v-icon name="bi-journal-medical" scale="0.7" />
                </span>
                <span class="v-section__title">Clinical Evidence ({{ med.pubmed_citations.total_found }} articles)</span>
              </div>
              <div v-if="med.pubmed_citations.evidence_summary" class="evidence-quality-row">
                <span class="eq-tag eq-tag--high">{{ med.pubmed_citations.evidence_summary.high_quality_count }} high</span>
                <span class="eq-tag eq-tag--moderate">{{ med.pubmed_citations.evidence_summary.moderate_quality_count }} moderate</span>
                <span class="eq-tag eq-tag--low">{{ med.pubmed_citations.evidence_summary.low_quality_count }} low</span>
              </div>
              <div class="citations-list">
                <a
                  v-for="(cit, cIdx) in med.pubmed_citations.citations.slice(0, 5)"
                  :key="cIdx"
                  :href="cit.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="citation-card"
                >
                  <div class="citation-card__top">
                    <span class="evidence-level-tag" :class="cit.evidence_level">{{ cit.evidence_level }}</span>
                    <span class="citation-year">{{ cit.year }}</span>
                  </div>
                  <div class="citation-card__title">{{ cit.title }}</div>
                  <div class="citation-card__meta">{{ cit.authors_short }} - {{ cit.journal }}</div>
                </a>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!suggestions?.length" class="empty-state">
      <v-icon name="ri-capsule-line" scale="2" class="empty-state__icon" />
      <p>No medication suggestions available.</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import {
  formatEvidenceLevel,
  formatSourceName,
  formatComplianceLevel,
  formatRecommendationType,
  formatLineOfTreatment,
  formatPrice,
  formatPriority,
  getPriorityClass,
  hasVerificationInfo,
  formatAlertType,
  getAlertIcon,
} from '../composables/useRxGPT';

defineProps({
  suggestions: {
    type: Array,
    default: () => [],
  },
});

// Track expanded verification sections
const expandedIndexes = ref([]);

function isExpanded(index) {
  return expandedIndexes.value.includes(index);
}

function toggle(index) {
  const pos = expandedIndexes.value.indexOf(index);
  if (pos > -1) {
    expandedIndexes.value.splice(pos, 1);
  } else {
    expandedIndexes.value.push(index);
  }
}

function inventoryLabel(med) {
  if (med.inventory_status === 'out_of_stock') return 'Out of Stock';
  if (med.inventory_status === 'low_stock') return 'Low Stock';
  return 'In Stock';
}

function confidenceClass(value) {
  if (value >= 80) return 'confidence--high';
  if (value >= 50) return 'confidence--moderate';
  return 'confidence--low';
}

function dosageStatusLabel(status) {
  const labels = { safe: 'Safe', warning: 'Caution', danger: 'Unsafe' };
  return labels[status] || status;
}

function dosageIconClass(status) {
  const classes = { safe: 'v-section__icon--emerald', warning: 'v-section__icon--amber', danger: 'v-section__icon--red' };
  return classes[status] || 'v-section__icon--amber';
}
</script>

<style lang="scss" scoped>
// ---- Design Tokens ----
$sky: #4FC3F7;
$sky-light: #E1F5FE;
$sky-dark: #0288D1;
$sky-darker: #01579B;
$emerald: #10b981;
$emerald-light: #d1fae5;
$amber: #f59e0b;
$amber-light: #fef3c7;
$red: #ef4444;
$red-light: #fee2e2;
$violet: #8b5cf6;
$violet-light: #ede9fe;
$navy: #0F172A;
$slate: #334155;
$gray: #64748B;
$border: #e2e8f0;
$bg-subtle: #F8FAFC;

.results-medications {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

// ---- Medication Card ----
.med-card {
  position: relative;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 18px;
  padding: 24px;
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow:
      0 8px 32px rgba(0, 0, 0, 0.08),
      inset 0 1px 0 rgba(255, 255, 255, 0.6);
  }

  // Priority accent line
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 24px;
    right: 24px;
    height: 3px;
    border-radius: 0 0 3px 3px;
  }

  &.priority--primary::before {
    background: linear-gradient(90deg, $emerald, #34d399);
  }

  &.priority--alternative::before {
    background: linear-gradient(90deg, #3b82f6, #60a5fa);
  }

  &.priority--supplementary::before {
    background: linear-gradient(90deg, $violet, #a78bfa);
  }

  @media (max-width: 640px) {
    padding: 18px 16px;
    border-radius: 14px;
  }
}

// ---- Card Header ----
.med-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;

  @media (max-width: 480px) {
    flex-direction: column;
    gap: 8px;
  }
}

.med-card__title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  min-width: 0;
}

.med-card__name {
  font-size: 16px;
  font-weight: 700;
  color: $navy;
  margin: 0;
}

.med-card__generic {
  font-size: 13px;
  color: $gray;
  font-weight: 400;
}

.priority-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  white-space: nowrap;

  &.primary {
    background: linear-gradient(135deg, $emerald, #34d399);
    color: #fff;
  }

  &.alternative {
    background: linear-gradient(135deg, #3b82f6, #60a5fa);
    color: #fff;
  }

  &.supplementary {
    background: linear-gradient(135deg, $violet, #a78bfa);
    color: #fff;
  }
}

.inventory-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;

  &.available,
  &.low_stock {
    background: $emerald-light;
    color: darken($emerald, 12%);
  }

  &.low_stock {
    background: $amber-light;
    color: darken($amber, 10%);
  }

  &.out_of_stock {
    background: $red-light;
    color: $red;
  }

  &.external {
    background: $violet-light;
    color: $violet;
  }
}

// ---- Detail Grid ----
.med-card__details {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 16px;

  @media (max-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.detail-cell {
  padding: 10px 12px;
  background: rgba($bg-subtle, 0.8);
  border-radius: 10px;
  border: 1px solid rgba($border, 0.5);
}

.detail-cell__label {
  display: block;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: $gray;
  margin-bottom: 3px;
}

.detail-cell__value {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: $navy;

  &--price {
    color: $emerald;
  }
}

// ---- Reasoning & Instructions ----
.med-card__reasoning,
.med-card__instructions {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 10px;
  font-size: 13px;
  color: $slate;
  line-height: 1.55;
  margin-bottom: 12px;

  p {
    margin: 0;
    flex: 1;
  }
}

.med-card__reasoning {
  background: rgba($violet, 0.05);
  border: 1px solid rgba($violet, 0.12);

  .reasoning-icon {
    color: $violet;
    flex-shrink: 0;
    margin-top: 1px;
  }
}

.med-card__instructions {
  background: rgba(#3b82f6, 0.05);
  border: 1px solid rgba(#3b82f6, 0.12);

  .instructions-icon {
    color: #3b82f6;
    flex-shrink: 0;
    margin-top: 1px;
  }
}

// ---- Confidence Bar ----
.med-card__confidence {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.confidence-track {
  flex: 1;
  height: 7px;
  background: $border;
  border-radius: 4px;
  overflow: hidden;
}

.confidence-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.6s ease;

  &.confidence--high {
    background: linear-gradient(90deg, $emerald, #34d399);
  }

  &.confidence--moderate {
    background: linear-gradient(90deg, $amber, #fbbf24);
  }

  &.confidence--low {
    background: linear-gradient(90deg, $red, #f87171);
  }
}

.confidence-pct {
  font-size: 13px;
  font-weight: 700;
  min-width: 40px;
  text-align: right;

  &.confidence--high { color: $emerald; }
  &.confidence--moderate { color: $amber; }
  &.confidence--low { color: $red; }
}

// ---- Safety Alerts ----
.med-card__alerts {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.alert-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 12px;

  &.critical {
    background: rgba($red, 0.08);
    border: 1px solid rgba($red, 0.2);
    color: darken($red, 8%);
  }

  &.warning {
    background: rgba($amber, 0.08);
    border: 1px solid rgba($amber, 0.2);
    color: darken($amber, 10%);
  }

  &.info {
    background: rgba(#3b82f6, 0.06);
    border: 1px solid rgba(#3b82f6, 0.15);
    color: #1d4ed8;
  }
}

.alert-item__body {
  flex: 1;
  min-width: 0;
}

.alert-item__type {
  font-weight: 700;
  text-transform: uppercase;
  font-size: 10px;
  letter-spacing: 0.3px;
  display: block;
  margin-bottom: 2px;
}

.alert-item__msg {
  line-height: 1.4;
}

.alert-item__severity {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  white-space: nowrap;
  flex-shrink: 0;

  .critical & { background: rgba($red, 0.15); color: $red; }
  .warning & { background: rgba($amber, 0.15); color: darken($amber, 10%); }
  .info & { background: rgba(#3b82f6, 0.1); color: #2563eb; }
}

// ---- Contraindication Warnings ----
.med-card__contra-warnings {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 10px 12px;
  background: rgba($amber, 0.08);
  border: 1px solid rgba($amber, 0.18);
  border-radius: 10px;
  font-size: 12px;
  color: darken($amber, 12%);
  margin-bottom: 12px;
  line-height: 1.4;
}

// ---- Verification Section ----
.med-card__verification {
  border-top: 1px solid rgba($border, 0.7);
  padding-top: 14px;
  margin-top: 4px;
}

.verification-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: rgba($bg-subtle, 0.8);
  border: 1px solid rgba($border, 0.5);
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  color: $slate;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba($sky-dark, 0.04);
    border-color: rgba($sky-dark, 0.2);
  }

  > span {
    flex: 1;
    text-align: left;
  }
}

.verification-toggle__badges {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.mini-badge {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px 7px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;

  &--fda { background: $emerald-light; color: darken($emerald, 12%); }
  &--unverified { background: $amber-light; color: darken($amber, 10%); }
  &--nice { background: #1e3a5f; color: white; }
  &--bnf { background: #004080; color: white; }
  &--pubmed { background: #326599; color: white; }
}

// Expand transition
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}
.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
}

.verification-body {
  margin-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

// ---- Verification Sub-sections ----
.v-section {
  padding: 14px;
  background: rgba($bg-subtle, 0.7);
  border: 1px solid rgba($border, 0.5);
  border-radius: 12px;
}

.v-section__header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  font-size: 12px;
  font-weight: 600;
  color: $slate;
}

.v-section__icon {
  width: 28px;
  height: 28px;
  min-width: 28px;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;

  &--violet { background: linear-gradient(135deg, $violet, #a78bfa); }
  &--emerald { background: linear-gradient(135deg, $emerald, #34d399); }
  &--amber { background: linear-gradient(135deg, $amber, #fbbf24); }
  &--red { background: linear-gradient(135deg, $red, #f87171); }

  &--nice {
    background: #1e3a5f;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: -0.5px;
  }

  &--bnf {
    background: #004080;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: -0.5px;
  }

  &--pubmed { background: #326599; }
}

.v-section__title {
  flex: 1;
  min-width: 0;
}

.v-section__text {
  font-size: 12px;
  color: $gray;
  line-height: 1.45;
  margin: 0 0 8px 0;
}

// Status & Level Tags
.status-tag,
.level-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  white-space: nowrap;
  margin-left: auto;

  &.verified,
  &.safe { background: $emerald-light; color: darken($emerald, 12%); }
  &.unverified { background: $amber-light; color: darken($amber, 10%); }
  &.warning { background: $amber-light; color: darken($amber, 10%); }
  &.danger { background: $red-light; color: $red; }
  &.full { background: $emerald-light; color: darken($emerald, 12%); }
  &.partial { background: $amber-light; color: darken($amber, 10%); }
  &.none { background: $red-light; color: $red; }
  &.unknown { background: #e2e8f0; color: $gray; }
  &.very_high,
  &.high { background: $emerald-light; color: darken($emerald, 12%); }
  &.moderate { background: $amber-light; color: darken($amber, 10%); }
  &.low,
  &.very_low { background: $red-light; color: $red; }
}

// ---- Evidence Confidence Subsection ----
.evidence-bar {
  height: 8px;
  background: $border;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 6px;
}

.evidence-fill {
  height: 100%;
  background: linear-gradient(90deg, $sky-dark, $violet);
  border-radius: 4px;
  transition: width 0.5s ease;
}

.evidence-scores {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: $gray;
  margin-bottom: 8px;

  strong {
    color: $navy;
  }
}

.off-label-flag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: $amber-light;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  color: darken($amber, 12%);
  margin-bottom: 8px;
}

// Adjustments Table
.adjustments-table {
  margin-top: 8px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba($border, 0.7);
}

.adj-row {
  display: grid;
  grid-template-columns: 100px 50px 1fr;
  gap: 8px;
  padding: 6px 10px;
  font-size: 11px;
  align-items: center;
  background: white;

  &:nth-child(even) {
    background: rgba($bg-subtle, 0.6);
  }

  &--header {
    background: rgba($sky-dark, 0.06) !important;
    font-weight: 700;
    color: $slate;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  @media (max-width: 480px) {
    grid-template-columns: 80px 40px 1fr;
    font-size: 10px;
  }
}

.adj-source {
  font-weight: 600;
  color: $slate;
}

.adj-value {
  font-weight: 700;
  text-align: center;

  &.positive { color: $emerald; }
  &.negative { color: $red; }
}

.adj-reason {
  color: $gray;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

// ---- FDA Verification Subsection ----
.source-list {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  font-size: 12px;
  margin-bottom: 8px;
}

.source-list__label {
  color: $gray;
}

.source-tag {
  padding: 2px 8px;
  background: rgba($sky-dark, 0.08);
  color: $sky-dark;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
}

// Shared warning list
.warning-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 8px;
}

.warning-item {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  font-size: 11px;
  color: darken($amber, 12%);
  padding: 5px 8px;
  background: rgba($amber, 0.08);
  border-radius: 6px;
  line-height: 1.3;
}

// ---- Dosage Validation ----
.fda-ranges {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
}

.fda-range-row {
  font-size: 12px;
  color: $slate;
  display: flex;
  gap: 6px;
  align-items: baseline;

  &__label {
    color: $gray;
    font-weight: 500;
    white-space: nowrap;
  }

  &__value {
    font-weight: 600;
  }
}

.dosage-patient-ctx {
  font-size: 11px;
  color: $gray;
  padding: 4px 8px;
  background: rgba($border, 0.4);
  border-radius: 6px;
  display: inline-block;
  margin-bottom: 4px;
}

// ---- NICE Compliance ----
.nice-rec-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  margin-bottom: 8px;

  &__label {
    color: $gray;
  }
}

.rec-type-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 11px;

  &.recommended { background: $emerald-light; color: darken($emerald, 12%); }
  &.consider { background: $amber-light; color: darken($amber, 10%); }
  &.do_not_offer { background: $red-light; color: $red; }
  &.caution { background: $amber-light; color: darken($amber, 10%); }
}

.line-tag {
  font-size: 11px;
  color: $gray;
  font-weight: 500;
}

.guideline-links {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 8px;
}

.guideline-link,
.ext-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: $sky-dark;
  text-decoration: none;
  padding: 5px 10px;
  background: rgba($sky-dark, 0.06);
  border-radius: 6px;
  transition: background 0.2s;
  width: fit-content;

  &:hover {
    background: rgba($sky-dark, 0.12);
  }
}

// ---- BNF Information ----
.bnf-meta-row {
  font-size: 12px;
  color: $slate;
  margin-bottom: 6px;
  display: flex;
  align-items: baseline;
  gap: 6px;
  flex-wrap: wrap;

  &__label {
    color: $gray;
    font-weight: 500;
    white-space: nowrap;
  }
}

.match-badge {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 1px 6px;
  background: $emerald-light;
  color: darken($emerald, 12%);
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
}

.bnf-cautions {
  font-size: 12px;
  margin-bottom: 6px;
  display: flex;
  align-items: baseline;
  gap: 6px;
  flex-wrap: wrap;
}

.caution-chip {
  display: inline-block;
  padding: 2px 8px;
  background: $amber-light;
  color: darken($amber, 12%);
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
}

.bnf-interactions {
  font-size: 12px;
  margin-bottom: 8px;

  .bnf-meta-row__label {
    display: block;
    margin-bottom: 4px;
  }
}

.interaction-row {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 5px 8px;
  background: white;
  border-radius: 6px;
  margin-bottom: 4px;
  font-size: 11px;
}

.interaction-severity {
  padding: 1px 5px;
  border-radius: 3px;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  white-space: nowrap;

  &.severe { background: $red-light; color: $red; }
  &.moderate { background: $amber-light; color: darken($amber, 10%); }
  &.mild { background: #e2e8f0; color: $gray; }
  &.unknown { background: #e2e8f0; color: $gray; }
}

.interaction-detail {
  color: $slate;
  flex: 1;
  line-height: 1.3;
}

// ---- PubMed Citations ----
.evidence-quality-row {
  display: flex;
  gap: 6px;
  margin-bottom: 10px;
}

.eq-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;

  &--high { background: $emerald-light; color: darken($emerald, 12%); }
  &--moderate { background: $amber-light; color: darken($amber, 10%); }
  &--low { background: #e2e8f0; color: $gray; }
}

.citations-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.citation-card {
  display: block;
  padding: 10px 12px;
  background: white;
  border: 1px solid rgba($border, 0.7);
  border-radius: 8px;
  text-decoration: none;
  transition: all 0.2s ease;

  &:hover {
    border-color: $sky-dark;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }
}

.citation-card__top {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.evidence-level-tag {
  padding: 1px 5px;
  border-radius: 3px;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;

  &.high { background: $emerald-light; color: darken($emerald, 12%); }
  &.moderate { background: $amber-light; color: darken($amber, 10%); }
  &.low { background: #e2e8f0; color: $gray; }
  &.unknown { background: #e2e8f0; color: $gray; }
}

.citation-year {
  font-size: 11px;
  color: $gray;
}

.citation-card__title {
  font-size: 12px;
  font-weight: 500;
  color: $navy;
  line-height: 1.35;
  margin-bottom: 4px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.citation-card__meta {
  font-size: 11px;
  color: $gray;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

// ---- Empty State ----
.empty-state {
  text-align: center;
  padding: 48px 24px;
  color: $gray;

  &__icon {
    opacity: 0.25;
    margin-bottom: 12px;
  }

  p {
    font-size: 14px;
    margin: 0;
  }
}
</style>
