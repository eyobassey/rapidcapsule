<template>
  <div class="medical-history-tab">
    <!-- Allergies Alert Section -->
    <div v-if="medicalHistory.allergies?.length" class="allergies-alert">
      <div class="allergies-alert__header">
        <div class="allergies-alert__icon">
          <v-icon name="hi-exclamation" scale="1" />
        </div>
        <div class="allergies-alert__title">
          <h3>Known Allergies</h3>
          <span>{{ medicalHistory.allergies.length }} allergies recorded - Review before prescribing</span>
        </div>
      </div>
      <div class="allergies-alert__tags">
        <span v-for="allergy in medicalHistory.allergies" :key="allergy" class="allergy-tag">
          <v-icon name="hi-x-circle" scale="0.55" />
          {{ allergy }}
        </span>
      </div>
    </div>

    <!-- No Allergies Notice -->
    <div v-else class="no-allergies-notice">
      <v-icon name="hi-shield-check" scale="0.9" />
      <span>No known allergies recorded</span>
    </div>

    <!-- Conditions Section -->
    <div class="section-card">
      <div class="section-card__header">
        <div class="section-card__icon section-card__icon--sky">
          <v-icon name="hi-clipboard-list" scale="0.9" />
        </div>
        <div class="section-card__title">
          <h3>Pre-existing Conditions</h3>
          <p>{{ medicalHistory.conditions?.length || 0 }} conditions recorded</p>
        </div>
      </div>
      <div class="section-card__body">
        <div v-if="medicalHistory.conditions?.length" class="conditions-grid">
          <div
            v-for="(condition, index) in medicalHistory.conditions"
            :key="condition"
            class="condition-chip"
            :style="{ animationDelay: `${index * 0.05}s` }"
          >
            <span class="condition-chip__dot" />
            <span class="condition-chip__text">{{ condition }}</span>
          </div>
        </div>
        <div v-else class="empty-inline">
          <v-icon name="hi-check-circle" scale="0.9" />
          <span>No pre-existing conditions recorded</span>
        </div>
      </div>
    </div>

    <!-- Risk Factors Section -->
    <div class="section-card">
      <div class="section-card__header">
        <div class="section-card__icon section-card__icon--amber">
          <v-icon name="hi-exclamation-circle" scale="0.9" />
        </div>
        <div class="section-card__title">
          <h3>Health Risk Factors</h3>
          <p>Lifestyle and medical risk assessment</p>
        </div>
      </div>
      <div class="section-card__body">
        <div v-if="hasRiskFactors" class="risk-grid">
          <div
            v-for="(value, key) in medicalHistory.risk_factors"
            :key="key"
            class="risk-card"
          >
            <div class="risk-card__header">
              <v-icon :name="getRiskIcon(key)" scale="0.75" />
              <span class="risk-card__label">{{ formatRiskLabel(key) }}</span>
            </div>
            <div class="risk-card__value">
              <span :class="['value-badge', `value-badge--${getRiskLevel(key, value)}`]">
                {{ formatRiskValue(value) }}
              </span>
            </div>
          </div>
        </div>
        <div v-else class="empty-inline">
          <v-icon name="hi-check-circle" scale="0.9" />
          <span>No health risk factors recorded</span>
        </div>
      </div>
    </div>

    <!-- Additional Medical History -->
    <div v-if="hasAdditionalHistory" class="section-card">
      <div class="section-card__header">
        <div class="section-card__icon section-card__icon--violet">
          <v-icon name="hi-document-text" scale="0.9" />
        </div>
        <div class="section-card__title">
          <h3>Additional Information</h3>
          <p>Other medical history details</p>
        </div>
      </div>
      <div class="section-card__body">
        <div class="additional-grid">
          <div v-if="medicalHistory.height" class="additional-item">
            <span class="additional-item__label">Height</span>
            <span class="additional-item__value measurement">
              <v-icon name="bi-rulers" scale="0.8" />
              {{ medicalHistory.height }}
            </span>
          </div>
          <div v-if="medicalHistory.weight" class="additional-item">
            <span class="additional-item__label">Weight</span>
            <span class="additional-item__value measurement">
              <v-icon name="hi-scale" scale="0.8" />
              {{ medicalHistory.weight }}
            </span>
          </div>
          <div v-if="medicalHistory.blood_type" class="additional-item">
            <span class="additional-item__label">Blood Type</span>
            <span class="additional-item__value blood-type">{{ medicalHistory.blood_type }}</span>
          </div>
          <div v-if="medicalHistory.medications?.length" class="additional-item additional-item--wide">
            <span class="additional-item__label">Current Medications</span>
            <div class="medication-list">
              <span v-for="med in medicalHistory.medications" :key="med" class="medication-tag">
                <v-icon name="ri-capsule-line" scale="0.6" />
                {{ med }}
              </span>
            </div>
          </div>
          <div v-if="medicalHistory.surgeries?.length" class="additional-item additional-item--wide">
            <span class="additional-item__label">Past Surgeries</span>
            <div class="surgery-list">
              <span v-for="surgery in medicalHistory.surgeries" :key="surgery" class="surgery-tag">
                {{ surgery }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  medicalHistory: { type: Object, default: () => ({}) },
});

const hasRiskFactors = computed(() => {
  return Object.keys(props.medicalHistory.risk_factors || {}).length > 0;
});

const hasAdditionalHistory = computed(() => {
  return props.medicalHistory.blood_type ||
    props.medicalHistory.height ||
    props.medicalHistory.weight ||
    props.medicalHistory.medications?.length ||
    props.medicalHistory.surgeries?.length;
});

function formatRiskLabel(key) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function formatRiskValue(value) {
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  if (value === null || value === undefined) return 'Not specified';
  return value;
}

function getRiskIcon(key) {
  const icons = {
    smoking: 'bi-lungs',
    alcohol: 'gi-wine-glass',
    exercise: 'md-directions-run',
    diet: 'gi-meal',
    stress: 'gi-brain',
    sleep: 'fa-bed',
    family_history: 'hi-users',
    diabetes: 'io-water-outline',
    hypertension: 'hi-heart',
    obesity: 'hi-scale',
  };
  return icons[key.toLowerCase()] || 'hi-information-circle';
}

function getRiskLevel(key, value) {
  if (value === true) return 'warning';
  if (value === false) return 'safe';
  if (typeof value === 'string') {
    const lower = value.toLowerCase();
    if (lower.includes('high') || lower.includes('heavy') || lower.includes('yes')) return 'warning';
    if (lower.includes('low') || lower.includes('none') || lower.includes('no')) return 'safe';
  }
  return 'neutral';
}
</script>

<style scoped lang="scss">
$sky: #4FC3F7;
$sky-light: #E1F5FE;
$sky-dark: #0288D1;
$emerald: #10B981;
$emerald-light: #D1FAE5;
$amber: #F59E0B;
$amber-light: #FEF3C7;
$violet: #8B5CF6;
$violet-light: #EDE9FE;
$rose: #F43F5E;
$rose-light: #FFE4E6;

.medical-history-tab {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

// Allergies Alert
.allergies-alert {
  background: rgba($rose, 0.04);
  border: 1px solid rgba($rose, 0.2);
  border-left: 4px solid $rose;
  border-radius: 16px;
  padding: 20px;

  &__header {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 16px;
  }

  &__icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: rgba($rose, 0.15);
    color: $rose;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: pulse-alert 2s ease-in-out infinite;
  }

  &__title {
    h3 {
      font-size: 16px;
      font-weight: 700;
      color: $rose;
      margin-bottom: 3px;
    }

    span {
      font-size: 12px;
      color: darken($rose, 10%);
    }
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
}

@keyframes pulse-alert {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.allergy-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba($rose, 0.1);
  border: 1px solid rgba($rose, 0.2);
  border-radius: 24px;
  font-size: 14px;
  font-weight: 600;
  color: $rose;
}

.no-allergies-notice {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 18px;
  background: rgba($emerald, 0.06);
  border: 1px solid rgba($emerald, 0.15);
  border-radius: 12px;

  svg {
    color: $emerald;
  }

  span {
    font-size: 14px;
    font-weight: 500;
    color: darken($emerald, 10%);
  }
}

.section-card {
  background: rgba(255, 255, 255, 0.6);
  border-radius: 16px;
  border: 1px solid rgba($color-g-92, 0.5);
  overflow: hidden;

  &__header {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 18px 20px;
    border-bottom: 1px solid rgba($color-g-92, 0.5);
    background: rgba(255, 255, 255, 0.5);
  }

  &__icon {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &--sky {
      background: linear-gradient(135deg, $sky-light 0%, rgba($sky, 0.2) 100%);
      color: $sky-dark;
    }

    &--amber {
      background: linear-gradient(135deg, $amber-light 0%, rgba($amber, 0.2) 100%);
      color: darken($amber, 10%);
    }

    &--violet {
      background: linear-gradient(135deg, $violet-light 0%, rgba($violet, 0.2) 100%);
      color: $violet;
    }
  }

  &__title {
    h3 {
      font-size: 15px;
      font-weight: 600;
      color: $color-g-21;
      margin-bottom: 2px;
    }

    p {
      font-size: 12px;
      color: $color-g-54;
    }
  }

  &__body {
    padding: 20px;
  }
}

.conditions-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.condition-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: linear-gradient(135deg, rgba($sky, 0.08) 0%, rgba($sky-dark, 0.04) 100%);
  border: 1px solid rgba($sky, 0.15);
  border-radius: 24px;
  animation: fadeIn 0.3s ease forwards;
  opacity: 0;

  &__dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: $sky-dark;
  }

  &__text {
    font-size: 13px;
    font-weight: 500;
    color: $sky-dark;
  }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.risk-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.risk-card {
  padding: 16px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba($color-g-92, 0.6);
  border-radius: 14px;
  transition: all 0.2s ease;

  &:hover {
    border-color: rgba($amber, 0.3);
    background: rgba($amber-light, 0.2);
  }

  &__header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;

    svg {
      color: $color-g-54;
    }
  }

  &__label {
    font-size: 12px;
    color: $color-g-54;
    font-weight: 500;
  }

  &__value {
    display: flex;
  }
}

.value-badge {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;

  &--safe {
    background: rgba($emerald, 0.1);
    color: darken($emerald, 10%);
  }

  &--warning {
    background: rgba($amber, 0.12);
    color: darken($amber, 15%);
  }

  &--neutral {
    background: rgba($color-g-67, 0.1);
    color: $color-g-44;
  }
}

.additional-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 14px;
}

.additional-item {
  padding: 16px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba($color-g-92, 0.5);
  border-radius: 12px;

  &--wide {
    grid-column: span 2;

    @media (max-width: 600px) {
      grid-column: span 1;
    }
  }

  &__label {
    display: block;
    font-size: 11px;
    color: $color-g-54;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    margin-bottom: 8px;
  }

  &__value {
    font-size: 18px;
    font-weight: 700;
    color: $color-g-21;

    &.blood-type {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, $rose-light 0%, rgba($rose, 0.1) 100%);
      border-radius: 12px;
      color: $rose;
      font-size: 16px;
    }

    &.measurement {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      background: linear-gradient(135deg, $sky-light 0%, rgba($sky, 0.1) 100%);
      border-radius: 12px;
      color: $sky-dark;
      font-size: 16px;

      svg {
        color: $sky-dark;
      }
    }
  }
}

.medication-list, .surgery-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.medication-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  background: rgba($violet, 0.08);
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
  color: $violet;
}

.surgery-tag {
  padding: 6px 12px;
  background: rgba($color-g-67, 0.08);
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
  color: $color-g-44;
}

.empty-inline {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px;
  background: rgba($emerald, 0.04);
  border: 1px solid rgba($emerald, 0.1);
  border-radius: 12px;

  svg {
    color: $emerald;
  }

  span {
    font-size: 14px;
    color: darken($emerald, 10%);
    font-weight: 500;
  }
}
</style>
