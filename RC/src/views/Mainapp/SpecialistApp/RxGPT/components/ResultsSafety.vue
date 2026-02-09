<template>
  <div class="results-safety">
    <!-- Safety Alerts -->
    <div v-if="criticalAlerts.length || warningAlerts.length || infoAlerts.length" class="safety-alerts">
      <!-- Critical Alerts -->
      <div v-if="criticalAlerts.length" class="alerts-group">
        <div class="alerts-group__header alerts-group__header--critical">
          <v-icon name="hi-exclamation" scale="0.9" />
          <span>Critical Alerts ({{ criticalAlerts.length }})</span>
        </div>
        <div class="alerts-group__list">
          <div
            v-for="(alert, index) in criticalAlerts"
            :key="`critical-${index}`"
            class="alert-card alert-card--critical"
          >
            <div class="alert-card__header">
              <div class="alert-card__type">
                <v-icon :name="getAlertIcon(alert.type)" scale="0.75" />
                <span>{{ formatAlertType(alert.type) }}</span>
              </div>
              <span class="alert-card__drug">{{ alert.drug_name }}</span>
            </div>
            <p class="alert-card__message">{{ alert.message }}</p>
            <p v-if="alert.reasoning" class="alert-card__reasoning">{{ alert.reasoning }}</p>
            <p v-if="alert.action_required" class="alert-card__action">
              <v-icon name="hi-arrow-right" scale="0.7" />
              {{ alert.action_required }}
            </p>
          </div>
        </div>
      </div>

      <!-- Warning Alerts -->
      <div v-if="warningAlerts.length" class="alerts-group">
        <div class="alerts-group__header alerts-group__header--warning">
          <v-icon name="hi-exclamation-circle" scale="0.9" />
          <span>Warnings ({{ warningAlerts.length }})</span>
        </div>
        <div class="alerts-group__list">
          <div
            v-for="(alert, index) in warningAlerts"
            :key="`warning-${index}`"
            class="alert-card alert-card--warning"
          >
            <div class="alert-card__header">
              <div class="alert-card__type">
                <v-icon :name="getAlertIcon(alert.type)" scale="0.75" />
                <span>{{ formatAlertType(alert.type) }}</span>
              </div>
              <span class="alert-card__drug">{{ alert.drug_name }}</span>
            </div>
            <p class="alert-card__message">{{ alert.message }}</p>
            <p v-if="alert.action_required" class="alert-card__action">
              <v-icon name="hi-arrow-right" scale="0.7" />
              {{ alert.action_required }}
            </p>
          </div>
        </div>
      </div>

      <!-- Info Alerts -->
      <div v-if="infoAlerts.length" class="alerts-group">
        <div class="alerts-group__header alerts-group__header--info">
          <v-icon name="hi-information-circle" scale="0.9" />
          <span>Information ({{ infoAlerts.length }})</span>
        </div>
        <div class="alerts-group__list">
          <div
            v-for="(alert, index) in infoAlerts"
            :key="`info-${index}`"
            class="alert-card alert-card--info"
          >
            <div class="alert-card__header">
              <div class="alert-card__type">
                <v-icon :name="getAlertIcon(alert.type)" scale="0.75" />
                <span>{{ formatAlertType(alert.type) }}</span>
              </div>
              <span class="alert-card__drug">{{ alert.drug_name }}</span>
            </div>
            <p class="alert-card__message">{{ alert.message }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- No Alerts State -->
    <div v-else class="no-alerts">
      <div class="no-alerts__icon">
        <v-icon name="hi-shield-check" scale="1.4" />
      </div>
      <p class="no-alerts__title">No safety alerts detected</p>
      <p class="no-alerts__text">The analysis did not identify any drug interactions, allergies, or contraindications.</p>
    </div>

    <!-- Clinical Summary -->
    <div v-if="result.clinical_summary" class="clinical-summary glass-card">
      <div class="section-header">
        <div class="section-header__icon section-header__icon--indigo">
          <v-icon name="hi-document-text" scale="0.85" />
        </div>
        <h3 class="section-header__title">Clinical Summary</h3>
      </div>
      <div class="clinical-summary__body">
        <p>{{ result.clinical_summary }}</p>
      </div>
    </div>

    <!-- Patient Considerations -->
    <div v-if="hasPatientConsiderations" class="patient-considerations glass-card">
      <div class="section-header">
        <div class="section-header__icon section-header__icon--emerald">
          <v-icon name="hi-user" scale="0.85" />
        </div>
        <h3 class="section-header__title">Patient Considerations</h3>
      </div>
      <div class="patient-considerations__body">
        <!-- Demographics -->
        <div v-if="considerations.age || considerations.gender" class="consideration-row">
          <span v-if="considerations.age" class="consideration-tag consideration-tag--neutral">
            <v-icon name="hi-user" scale="0.65" />
            {{ considerations.age }} years old
          </span>
          <span v-if="considerations.gender" class="consideration-tag consideration-tag--neutral">
            <v-icon name="hi-identification" scale="0.65" />
            {{ considerations.gender }}
          </span>
        </div>

        <!-- Allergies -->
        <div v-if="considerations.allergies?.length" class="consideration-group">
          <span class="consideration-group__label">Allergies</span>
          <div class="consideration-row">
            <span
              v-for="(allergy, i) in considerations.allergies"
              :key="`allergy-${i}`"
              class="consideration-tag consideration-tag--danger"
            >
              <v-icon name="hi-exclamation" scale="0.6" />
              {{ allergy }}
            </span>
          </div>
        </div>

        <!-- Current Medications -->
        <div v-if="considerations.current_medications?.length" class="consideration-group">
          <span class="consideration-group__label">Current Medications</span>
          <div class="consideration-row">
            <span
              v-for="(med, i) in considerations.current_medications"
              :key="`med-${i}`"
              class="consideration-tag consideration-tag--indigo"
            >
              <v-icon name="ri-capsule-line" scale="0.6" />
              {{ med }}
            </span>
          </div>
        </div>

        <!-- Chronic Conditions -->
        <div v-if="considerations.chronic_conditions?.length" class="consideration-group">
          <span class="consideration-group__label">Chronic Conditions</span>
          <div class="consideration-row">
            <span
              v-for="(cond, i) in considerations.chronic_conditions"
              :key="`cond-${i}`"
              class="consideration-tag consideration-tag--amber"
            >
              <v-icon name="hi-clipboard-list" scale="0.6" />
              {{ cond }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Disclaimer -->
    <div v-if="result.disclaimer" class="disclaimer">
      <v-icon name="hi-information-circle" scale="0.8" />
      <p>{{ result.disclaimer }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { formatAlertType, getAlertIcon, formatDate } from '../composables/useRxGPT';

const props = defineProps({
  result: {
    type: Object,
    required: true,
  },
});

// Computed: split alerts by severity
const allAlerts = computed(() => props.result.alerts || []);

const criticalAlerts = computed(() =>
  allAlerts.value.filter((a) => a.severity === 'critical')
);

const warningAlerts = computed(() =>
  allAlerts.value.filter((a) => a.severity === 'warning')
);

const infoAlerts = computed(() =>
  allAlerts.value.filter((a) => a.severity === 'info')
);

// Patient considerations
const considerations = computed(() => props.result.patient_considerations || {});

const hasPatientConsiderations = computed(() => {
  const c = considerations.value;
  return !!(
    c.age ||
    c.gender ||
    c.allergies?.length ||
    c.current_medications?.length ||
    c.chronic_conditions?.length
  );
});
</script>

<style lang="scss" scoped>
// ============ Design Tokens ============
$sky: #4FC3F7;
$sky-light: #E1F5FE;
$sky-dark: #0288D1;
$sky-darker: #01579B;
$emerald: #10b981;
$amber: #f59e0b;
$red: #ef4444;
$blue: #3b82f6;
$navy: #0F172A;
$slate: #334155;
$gray: #64748B;
$bg: #F8FAFC;
$gray-light: #9ca3af;

// ============ Glass-morphism base ============
.glass-card {
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 18px;
  padding: 22px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.07);
  }
}

// ============ Layout ============
.results-safety {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

// ============ Section Header ============
.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.section-header__icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.section-header__icon--indigo {
  background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
}

.section-header__icon--emerald {
  background: linear-gradient(135deg, $emerald, darken($emerald, 8%));
}

.section-header__title {
  font-size: 15px;
  font-weight: 700;
  color: $navy;
  margin: 0;
}

// ============ Safety Alerts ============
.safety-alerts {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.alerts-group__header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 10px;
  padding: 8px 14px;
  border-radius: 10px;
}

.alerts-group__header--critical {
  background: rgba($red, 0.08);
  color: $red;
}

.alerts-group__header--warning {
  background: rgba($amber, 0.08);
  color: darken($amber, 10%);
}

.alerts-group__header--info {
  background: rgba($blue, 0.08);
  color: $blue;
}

.alerts-group__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

// ============ Alert Cards (Glass) ============
.alert-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 14px;
  padding: 16px;
  border-left: 4px solid;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.06);
  }
}

.alert-card--critical {
  border-left-color: $red;
}

.alert-card--warning {
  border-left-color: $amber;
}

.alert-card--info {
  border-left-color: $blue;
}

.alert-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  gap: 8px;
  flex-wrap: wrap;
}

.alert-card__type {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  color: $gray;
}

.alert-card__drug {
  font-size: 12px;
  font-weight: 600;
  color: $navy;
  background: rgba(0, 0, 0, 0.04);
  padding: 3px 10px;
  border-radius: 8px;
  white-space: nowrap;
}

.alert-card__message {
  font-size: 14px;
  font-weight: 500;
  color: $navy;
  margin: 0 0 8px;
  line-height: 1.5;
}

.alert-card__reasoning {
  font-size: 13px;
  color: $slate;
  margin: 0 0 8px;
  padding: 10px 12px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
  line-height: 1.5;
}

.alert-card__action {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  margin: 0;
  line-height: 1.4;

  .alert-card--critical & {
    color: $red;
  }

  .alert-card--warning & {
    color: darken($amber, 12%);
  }

  .alert-card--info & {
    color: $blue;
  }
}

// ============ No Alerts ============
.no-alerts {
  text-align: center;
  padding: 32px 20px;
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 18px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
}

.no-alerts__icon {
  width: 56px;
  height: 56px;
  margin: 0 auto 14px;
  background: linear-gradient(135deg, rgba($emerald, 0.12), rgba($emerald, 0.06));
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $emerald;
}

.no-alerts__title {
  font-size: 15px;
  font-weight: 700;
  color: $navy;
  margin: 0 0 6px;
}

.no-alerts__text {
  font-size: 13px;
  color: $gray;
  margin: 0;
  max-width: 340px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.5;
}

// ============ Clinical Summary ============
.clinical-summary__body {
  background: rgba($sky-dark, 0.04);
  border-left: 4px solid $sky-dark;
  border-radius: 0 10px 10px 0;
  padding: 14px 16px;

  p {
    font-size: 14px;
    color: $slate;
    margin: 0;
    line-height: 1.65;
  }
}

// ============ Patient Considerations ============
.patient-considerations__body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.consideration-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.consideration-group__label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: $gray-light;
}

.consideration-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.consideration-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  transition: transform 0.15s ease;

  &:hover {
    transform: scale(1.03);
  }
}

.consideration-tag--neutral {
  background: rgba(0, 0, 0, 0.04);
  color: $slate;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.consideration-tag--danger {
  background: rgba($red, 0.08);
  color: darken($red, 10%);
  border: 1px solid rgba($red, 0.15);
}

.consideration-tag--indigo {
  background: rgba($sky-dark, 0.08);
  color: darken($sky-dark, 8%);
  border: 1px solid rgba($sky-dark, 0.15);
}

.consideration-tag--amber {
  background: rgba($amber, 0.08);
  color: darken($amber, 14%);
  border: 1px solid rgba($amber, 0.15);
}

// ============ Disclaimer ============
.disclaimer {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px 16px;
  background: rgba(0, 0, 0, 0.025);
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 12px;
  color: $gray;

  > svg,
  > .ov-icon {
    flex-shrink: 0;
    margin-top: 1px;
    opacity: 0.6;
  }

  p {
    font-size: 12px;
    margin: 0;
    line-height: 1.55;
    color: $gray;
  }
}

// ============ Responsive ============
@media (max-width: 600px) {
  .glass-card {
    padding: 16px;
    border-radius: 14px;
  }

  .alert-card {
    padding: 12px;
    border-radius: 12px;
  }

  .alert-card__header {
    flex-direction: column;
    align-items: flex-start;
  }

  .clinical-summary__body {
    padding: 12px 14px;
  }

  .consideration-tag {
    font-size: 11px;
    padding: 4px 10px;
  }
}
</style>
