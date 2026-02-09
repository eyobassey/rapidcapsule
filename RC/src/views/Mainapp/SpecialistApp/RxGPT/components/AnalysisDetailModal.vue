<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
        <div class="modal-container">
          <div class="modal-header">
            <div class="modal-header__left">
              <div class="modal-icon" :class="getRiskClass(analysis?.overall_risk_level)">
                <v-icon name="bi-robot" scale="1.2" />
              </div>
              <div class="modal-title">
                <h2>AI Analysis Details</h2>
                <span class="modal-date">{{ formatDateTime(analysis?.created_at) }}</span>
              </div>
            </div>
            <button class="close-btn" @click="$emit('close')">
              <v-icon name="hi-x" scale="1" />
            </button>
          </div>

          <div class="modal-content" v-if="analysis">
            <!-- Risk Summary -->
            <div :class="['risk-card', `risk-card--${analysis.overall_risk_level}`]">
              <div class="risk-card__icon">
                <v-icon :name="getRiskIcon(analysis.overall_risk_level)" scale="1.5" />
              </div>
              <div class="risk-card__content">
                <span class="risk-card__label">Overall Risk Assessment</span>
                <span class="risk-card__level">{{ formatRiskLevel(analysis.overall_risk_level) }}</span>
                <span class="risk-card__confidence">
                  {{ Math.round(analysis.confidence_score * 100) }}% confidence
                </span>
              </div>
              <div v-if="analysis.is_safe" class="safe-badge">
                <v-icon name="hi-check-circle" scale="0.7" />
                Safe to Prescribe
              </div>
            </div>

            <!-- Clinical Summary -->
            <div v-if="analysis.clinical_summary" class="section-card">
              <div class="section-card__header">
                <v-icon name="hi-document-text" scale="0.9" />
                <h3>Clinical Summary</h3>
              </div>
              <p class="clinical-text">{{ analysis.clinical_summary }}</p>
            </div>

            <!-- Alerts -->
            <div v-if="sortedAlerts.length" class="section-card section-card--alerts">
              <div class="section-card__header">
                <v-icon name="hi-exclamation-circle" scale="0.9" />
                <h3>Alerts</h3>
                <span class="count-badge">{{ sortedAlerts.length }}</span>
              </div>
              <div class="alerts-list">
                <div
                  v-for="(alert, index) in sortedAlerts"
                  :key="index"
                  :class="['alert-item', `alert-item--${alert.severity}`]"
                >
                  <div class="alert-item__icon">
                    <v-icon :name="getAlertIcon(alert.severity)" scale="0.8" />
                  </div>
                  <div class="alert-item__content">
                    <span class="alert-item__type">{{ formatAlertType(alert.type) }}</span>
                    <span class="alert-item__drug">{{ alert.drug_name }}</span>
                    <p class="alert-item__message">{{ alert.message }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Medications Analyzed -->
            <div v-if="analysis.drugs_analyzed?.length" class="section-card">
              <div class="section-card__header">
                <v-icon name="ri-capsule-line" scale="0.9" />
                <h3>Medications Analyzed</h3>
                <span class="count-badge">{{ analysis.drugs_analyzed.length }}</span>
              </div>
              <div class="drugs-grid">
                <div
                  v-for="(drug, index) in analysis.drugs_analyzed"
                  :key="index"
                  :class="['drug-item', { 'drug-item--appropriate': drug.is_appropriate }]"
                >
                  <div class="drug-item__icon">
                    <v-icon v-if="drug.is_appropriate" name="hi-check-circle" scale="0.8" />
                    <v-icon v-else name="hi-exclamation" scale="0.8" />
                  </div>
                  <div class="drug-item__info">
                    <span class="drug-item__name">{{ drug.drug_name }}</span>
                    <span class="drug-item__strength">{{ drug.strength }}</span>
                    <span class="drug-item__dosage">{{ drug.dosage }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Linked Prescription -->
            <div v-if="analysis.prescription_id" class="section-card section-card--linked">
              <div class="section-card__header">
                <v-icon name="hi-link" scale="0.9" />
                <h3>Linked Prescription</h3>
              </div>
              <button class="view-prescription-btn" @click="$emit('close'); $router.push(`/app/specialist/pharmacy/prescriptions/${analysis.prescription_id}`)">
                <v-icon name="hi-document-text" scale="0.8" />
                View Prescription
                <v-icon name="hi-arrow-right" scale="0.7" />
              </button>
            </div>

            <!-- View Full Results -->
            <button class="view-results-btn" @click="$emit('viewResults', analysis._id)">
              <v-icon name="bi-robot" scale="0.9" />
              View Full Results
              <v-icon name="hi-arrow-right" scale="0.8" />
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue';
import {
  formatRiskLevel,
  getRiskClass,
  getRiskIcon,
  getAlertIcon,
  formatAlertType,
  formatDateTime,
} from '../composables/useRxGPT';

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  analysis: {
    type: Object,
    default: null,
  },
});

defineEmits(['close', 'viewResults']);

const severityOrder = { critical: 0, warning: 1, info: 2 };

const sortedAlerts = computed(() => {
  if (!props.analysis?.alerts?.length) return [];
  return [...props.analysis.alerts].sort(
    (a, b) => (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3)
  );
});
</script>

<style scoped lang="scss">
// Colors - sky accent scheme (Pharmacy design system)
$sky: #4FC3F7;
$sky-light: #E1F5FE;
$sky-dark: #0288D1;
$sky-darker: #01579B;
$navy: #0F172A;
$slate-dark: #334155;
$gray: #64748B;
$bg: #F8FAFC;
$emerald: #10b981;
$emerald-light: #d1fae5;
$amber: #f59e0b;
$amber-light: #fef3c7;
$violet: #8b5cf6;
$violet-light: #ede9fe;
$rose: #f43f5e;
$rose-light: #ffe4e6;
$slate: #64748b;

// Grayscale
$color-g-21: #21262d;
$color-g-36: #363b44;
$color-g-54: #545961;
$color-g-67: #676c75;
$color-g-92: #e8e9eb;
$color-g-97: #f5f6f7;

// Modal Overlay
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

// Modal Container
.modal-container {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(24px);
  border-radius: 24px;
  width: 100%;
  max-width: 700px;
  max-height: 85vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.6);
}

// Modal Header
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba($color-g-92, 0.5);
  background: linear-gradient(135deg, rgba($sky, 0.05) 0%, rgba($sky-dark, 0.05) 100%);

  &__left {
    display: flex;
    align-items: center;
    gap: 14px;
  }
}

.modal-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;

  &.risk--low {
    background: linear-gradient(135deg, $emerald-light 0%, rgba($emerald, 0.2) 100%);
    color: $emerald;
  }

  &.risk--moderate {
    background: linear-gradient(135deg, rgba($sky-dark, 0.1) 0%, rgba($sky-dark, 0.2) 100%);
    color: $sky-dark;
  }

  &.risk--high {
    background: linear-gradient(135deg, $amber-light 0%, rgba($amber, 0.2) 100%);
    color: $amber;
  }

  &.risk--critical {
    background: linear-gradient(135deg, $rose-light 0%, rgba($rose, 0.2) 100%);
    color: $rose;
  }
}

.modal-title {
  h2 {
    font-size: 18px;
    font-weight: 700;
    color: $color-g-21;
    margin-bottom: 2px;
  }
}

.modal-date {
  font-size: 13px;
  color: $color-g-54;
}

.close-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: rgba($color-g-92, 0.5);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $color-g-54;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba($sky-dark, 0.1);
    color: $sky-dark;
  }
}

// Modal Content
.modal-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

// Risk Card
.risk-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border-radius: 16px;
  position: relative;

  &--low {
    background: linear-gradient(135deg, $emerald-light 0%, rgba($emerald, 0.15) 100%);
    border: 1px solid rgba($emerald, 0.2);
    .risk-card__icon { background: rgba($emerald, 0.15); color: $emerald; }
    .risk-card__level { color: $emerald; }
  }

  &--moderate {
    background: linear-gradient(135deg, rgba($sky, 0.08) 0%, rgba($sky-dark, 0.1) 100%);
    border: 1px solid rgba($sky-dark, 0.2);
    .risk-card__icon { background: rgba($sky-dark, 0.15); color: $sky-dark; }
    .risk-card__level { color: $sky-dark; }
  }

  &--high {
    background: linear-gradient(135deg, $amber-light 0%, rgba($amber, 0.15) 100%);
    border: 1px solid rgba($amber, 0.2);
    .risk-card__icon { background: rgba($amber, 0.15); color: $amber; }
    .risk-card__level { color: darken($amber, 10%); }
  }

  &--critical {
    background: linear-gradient(135deg, $rose-light 0%, rgba($rose, 0.15) 100%);
    border: 1px solid rgba($rose, 0.2);
    .risk-card__icon { background: rgba($rose, 0.15); color: $rose; }
    .risk-card__level { color: $rose; }
  }

  &__icon {
    width: 56px;
    height: 56px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__content {
    flex: 1;
  }

  &__label {
    display: block;
    font-size: 11px;
    color: $color-g-54;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    margin-bottom: 4px;
  }

  &__level {
    display: block;
    font-size: 18px;
    font-weight: 700;
    margin-bottom: 4px;
  }

  &__confidence {
    font-size: 13px;
    color: $color-g-54;
  }
}

.safe-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: $emerald;
  color: white;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

// Section Card
.section-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  border: 1px solid rgba($color-g-92, 0.5);
  border-radius: 16px;
  padding: 20px;

  &__header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;

    svg {
      color: $sky-dark;
    }

    h3 {
      font-size: 15px;
      font-weight: 600;
      color: $color-g-21;
      flex: 1;
    }
  }

  &--linked {
    border-color: rgba($violet, 0.2);
    background: rgba($violet, 0.03);

    .section-card__header svg {
      color: $violet;
    }
  }
}

.count-badge {
  padding: 4px 10px;
  background: rgba($sky-dark, 0.1);
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  color: $sky-dark;
}

.clinical-text {
  font-size: 14px;
  line-height: 1.6;
  color: $color-g-36;
}

// Alerts List
.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.alert-item {
  display: flex;
  gap: 12px;
  padding: 14px;
  border-radius: 12px;

  &--critical {
    background: rgba($rose, 0.08);
    border: 1px solid rgba($rose, 0.15);
    .alert-item__icon { color: $rose; }
    .alert-item__type { color: $rose; }
  }

  &--warning {
    background: rgba($amber, 0.08);
    border: 1px solid rgba($amber, 0.15);
    .alert-item__icon { color: $amber; }
    .alert-item__type { color: darken($amber, 10%); }
  }

  &--info {
    background: rgba($sky-dark, 0.06);
    border: 1px solid rgba($sky-dark, 0.12);
    .alert-item__icon { color: $sky-dark; }
    .alert-item__type { color: $sky-dark; }
  }

  &__icon {
    flex-shrink: 0;
    margin-top: 2px;
  }

  &__content {
    flex: 1;
  }

  &__type {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  &__drug {
    display: block;
    font-size: 14px;
    font-weight: 600;
    color: $color-g-21;
    margin: 4px 0;
  }

  &__message {
    font-size: 13px;
    line-height: 1.5;
    color: $color-g-54;
    margin: 0;
  }
}

// Drugs Grid
.drugs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.drug-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: $color-g-97;
  border-radius: 12px;
  border: 1px solid transparent;

  &--appropriate {
    border-color: rgba($emerald, 0.2);
    background: rgba($emerald, 0.05);

    .drug-item__icon {
      color: $emerald;
    }
  }

  &__icon {
    color: $amber;
    flex-shrink: 0;
  }

  &__info {
    flex: 1;
    min-width: 0;
  }

  &__name {
    display: block;
    font-size: 14px;
    font-weight: 600;
    color: $color-g-21;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__strength {
    display: block;
    font-size: 12px;
    color: $sky-dark;
  }

  &__dosage {
    display: block;
    font-size: 11px;
    color: $slate;
  }
}

// View Prescription Button
.view-prescription-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: linear-gradient(135deg, $violet-light 0%, rgba($violet, 0.2) 100%);
  color: $violet;
  border: 1px solid rgba($violet, 0.2);
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba($violet, 0.15);
  }
}

// View Full Results Button
.view-results-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 16px 24px;
  background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
  color: white;
  border: none;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: 0 4px 16px rgba($sky-dark, 0.3);
  letter-spacing: 0.2px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba($sky-dark, 0.4);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba($sky-dark, 0.3);
  }
}

// Modal Transition
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: all 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;

  .modal-container {
    transform: scale(0.95) translateY(20px);
  }
}

// Responsive
@media (max-width: 600px) {
  .modal-overlay {
    padding: 12px;
  }

  .modal-container {
    max-height: 90vh;
    border-radius: 20px;
  }

  .modal-header {
    padding: 16px 18px;
  }

  .modal-content {
    padding: 18px;
    gap: 16px;
  }

  .risk-card {
    flex-wrap: wrap;
    padding: 16px;
  }

  .safe-badge {
    position: static;
    margin-top: 8px;
    width: fit-content;
  }

  .drugs-grid {
    grid-template-columns: 1fr;
  }
}
</style>
