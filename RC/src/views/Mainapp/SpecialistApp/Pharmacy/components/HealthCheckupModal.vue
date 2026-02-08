<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="isOpen" class="modal-overlay" @click.self="$emit('close')">
        <div class="modal-container">
          <!-- Header -->
          <div class="modal-header">
            <div class="modal-header__left">
              <div class="modal-icon">
                <v-icon name="hi-shield-check" scale="1.2" />
              </div>
              <div class="modal-title">
                <h2>Health Checkup Details</h2>
                <span v-if="checkup" class="modal-date">{{ formatDate(checkup.created_at) }}</span>
              </div>
            </div>
            <button class="close-btn" @click="$emit('close')">
              <v-icon name="hi-x" scale="1" />
            </button>
          </div>

          <!-- Loading State -->
          <div v-if="loading" class="modal-loading">
            <div class="loading-spinner" />
            <p>Loading checkup details...</p>
          </div>

          <!-- Content -->
          <div v-else-if="checkup" class="modal-content">
            <!-- Triage Assessment Card -->
            <div :class="['triage-card', `triage-card--${getTriageClass(checkup.triage_level)}`]">
              <div class="triage-card__icon">
                <v-icon :name="getTriageIcon(checkup.triage_level)" scale="1.5" />
              </div>
              <div class="triage-card__content">
                <span class="triage-card__label">AI Triage Assessment</span>
                <span class="triage-card__level">{{ formatTriageLevel(checkup.triage_level) }}</span>
                <span v-if="checkup.triage_details?.description" class="triage-card__desc">
                  {{ checkup.triage_details.description }}
                </span>
              </div>
              <div v-if="checkup.has_emergency_evidence" class="emergency-badge">
                <v-icon name="hi-exclamation" scale="0.7" />
                Emergency Evidence
              </div>
            </div>

            <!-- Primary Diagnosis -->
            <div v-if="checkup.primary_condition" class="section-card">
              <div class="section-card__header">
                <v-icon name="hi-clipboard-list" scale="0.9" />
                <h3>Primary Diagnosis</h3>
              </div>
              <div class="diagnosis-content">
                <div class="diagnosis-main">
                  <span class="diagnosis-name">{{ checkup.primary_condition.name }}</span>
                  <div class="diagnosis-meta">
                    <span v-if="checkup.primary_condition.probability" class="probability-badge">
                      {{ Math.round(checkup.primary_condition.probability * 100) }}% probability
                    </span>
                    <span v-if="checkup.primary_condition.acuity" class="acuity-badge">
                      {{ checkup.primary_condition.acuity }}
                    </span>
                  </div>
                </div>
                <div v-if="checkup.primary_condition.icd10" class="diagnosis-icd">
                  <span class="icd-label">ICD-10:</span>
                  <span class="icd-code">{{ checkup.primary_condition.icd10 }}</span>
                </div>
              </div>
            </div>

            <!-- All Conditions (AI Assessment) -->
            <div v-if="checkup.conditions?.length > 1" class="section-card">
              <div class="section-card__header">
                <v-icon name="bi-robot" scale="0.9" />
                <h3>AI Differential Diagnosis</h3>
                <span class="count-badge">{{ checkup.conditions.length }} conditions</span>
              </div>
              <div class="conditions-list">
                <div
                  v-for="(condition, index) in checkup.conditions"
                  :key="condition.id || index"
                  class="condition-item"
                >
                  <div class="condition-item__rank">{{ index + 1 }}</div>
                  <div class="condition-item__info">
                    <span class="condition-item__name">{{ condition.name }}</span>
                    <div class="condition-item__meta">
                      <span v-if="condition.icd10" class="meta-icd">{{ condition.icd10 }}</span>
                      <span v-if="condition.acuity" class="meta-acuity">{{ condition.acuity }}</span>
                    </div>
                  </div>
                  <div class="condition-item__probability">
                    <div class="probability-bar">
                      <div
                        class="probability-bar__fill"
                        :style="{ width: `${Math.round(condition.probability * 100)}%` }"
                      />
                    </div>
                    <span class="probability-value">{{ Math.round(condition.probability * 100) }}%</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Symptoms Reported -->
            <div v-if="checkup.symptoms?.length" class="section-card">
              <div class="section-card__header">
                <v-icon name="hi-annotation" scale="0.9" />
                <h3>Reported Symptoms</h3>
                <span class="count-badge">{{ checkup.symptoms_count || checkup.symptoms.length }}</span>
              </div>
              <div class="symptoms-list">
                <div
                  v-for="symptom in checkup.symptoms"
                  :key="symptom.id"
                  class="symptom-item"
                >
                  <v-icon name="hi-check-circle" scale="0.7" />
                  <span class="symptom-name">{{ symptom.name }}</span>
                  <span v-if="symptom.duration" class="symptom-duration">
                    {{ formatDuration(symptom.duration) }}
                  </span>
                  <span v-if="symptom.source === 'initial'" class="symptom-source symptom-source--initial">Initial</span>
                  <span v-else-if="symptom.source === 'interview'" class="symptom-source symptom-source--interview">Interview</span>
                </div>
              </div>
            </div>

            <!-- Risk Factors -->
            <div v-if="checkup.risk_factors?.length" class="section-card">
              <div class="section-card__header">
                <v-icon name="hi-shield-exclamation" scale="0.9" />
                <h3>Risk Factors</h3>
              </div>
              <div class="risk-factors-grid">
                <span
                  v-for="factor in checkup.risk_factors"
                  :key="factor.id"
                  class="risk-factor-chip"
                >
                  {{ factor.name }}
                </span>
              </div>
            </div>

            <!-- Specialist Recommendations -->
            <div v-if="checkup.specialist_recommendations?.length" class="section-card">
              <div class="section-card__header">
                <v-icon name="hi-light-bulb" scale="0.9" />
                <h3>Recommended Specialists</h3>
              </div>
              <div class="specialists-list">
                <div
                  v-for="spec in checkup.specialist_recommendations"
                  :key="spec.id || spec.name"
                  class="specialist-item"
                >
                  <v-icon name="hi-user-circle" scale="0.8" />
                  <span>{{ spec.name || spec }}</span>
                </div>
              </div>
            </div>

            <!-- AI Summary (Claude-generated) -->
            <div v-if="checkup.ai_summary" class="section-card section-card--ai">
              <div class="section-card__header section-card__header--ai">
                <div class="ai-badge">
                  <v-icon name="bi-robot" scale="0.8" />
                  <span>AI Summary</span>
                </div>
                <span v-if="checkup.ai_summary.model" class="model-badge">
                  {{ formatModelName(checkup.ai_summary.model) }}
                </span>
              </div>

              <!-- Overview -->
              <div v-if="checkup.ai_summary.overview" class="ai-overview">
                <p>{{ checkup.ai_summary.overview }}</p>
              </div>

              <!-- Key Findings -->
              <div v-if="checkup.ai_summary.key_findings?.length" class="ai-section">
                <h4>
                  <v-icon name="hi-search" scale="0.7" />
                  Key Findings
                </h4>
                <ul class="ai-list">
                  <li v-for="(finding, idx) in checkup.ai_summary.key_findings" :key="idx">
                    {{ finding }}
                  </li>
                </ul>
              </div>

              <!-- Possible Conditions Explained -->
              <div v-if="checkup.ai_summary.possible_conditions_explained?.length" class="ai-section">
                <h4>
                  <v-icon name="hi-clipboard-list" scale="0.7" />
                  Conditions Explained
                </h4>
                <div class="conditions-explained">
                  <div
                    v-for="(cond, idx) in checkup.ai_summary.possible_conditions_explained"
                    :key="idx"
                    class="condition-explained"
                  >
                    <div class="condition-explained__header">
                      <span class="condition-explained__name">{{ cond.condition }}</span>
                      <span
                        v-if="cond.urgency"
                        :class="['urgency-badge', `urgency-badge--${cond.urgency}`]"
                      >
                        {{ cond.urgency }}
                      </span>
                    </div>
                    <p class="condition-explained__text">{{ cond.explanation }}</p>
                  </div>
                </div>
              </div>

              <!-- Recommendations -->
              <div v-if="checkup.ai_summary.recommendations?.length" class="ai-section">
                <h4>
                  <v-icon name="hi-check-circle" scale="0.7" />
                  Recommendations
                </h4>
                <ul class="ai-list ai-list--recommendations">
                  <li v-for="(rec, idx) in checkup.ai_summary.recommendations" :key="idx">
                    {{ rec }}
                  </li>
                </ul>
              </div>

              <!-- When to Seek Care -->
              <div v-if="checkup.ai_summary.when_to_seek_care" class="ai-section ai-section--urgent">
                <h4>
                  <v-icon name="hi-exclamation" scale="0.7" />
                  When to Seek Care
                </h4>
                <p class="care-warning">{{ checkup.ai_summary.when_to_seek_care }}</p>
              </div>

              <!-- Lifestyle Tips -->
              <div v-if="checkup.ai_summary.lifestyle_tips?.length" class="ai-section">
                <h4>
                  <v-icon name="hi-heart" scale="0.7" />
                  Lifestyle Tips
                </h4>
                <ul class="ai-list ai-list--tips">
                  <li v-for="(tip, idx) in checkup.ai_summary.lifestyle_tips" :key="idx">
                    {{ tip }}
                  </li>
                </ul>
              </div>
            </div>

            <!-- Patient Info -->
            <div v-if="checkup.patient_info" class="section-card section-card--muted">
              <div class="section-card__header">
                <v-icon name="hi-user" scale="0.9" />
                <h3>Patient Info at Checkup</h3>
              </div>
              <div class="patient-info-grid">
                <div v-if="checkup.patient_info.age" class="info-item">
                  <span class="info-label">Age</span>
                  <span class="info-value">{{ checkup.patient_info.age }} years</span>
                </div>
                <div v-if="checkup.patient_info.gender" class="info-item">
                  <span class="info-label">Gender</span>
                  <span class="info-value">{{ checkup.patient_info.gender }}</span>
                </div>
                <div v-if="checkup.health_check_for" class="info-item">
                  <span class="info-label">Checkup For</span>
                  <span class="info-value">{{ formatCheckupFor(checkup.health_check_for) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Error State -->
          <div v-else class="modal-error">
            <v-icon name="hi-exclamation-circle" scale="2" />
            <p>Failed to load checkup details</p>
            <button class="retry-btn" @click="fetchCheckupDetails">Try Again</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue';
import apiFactory from '@/services/apiFactory';
import { usePharmacy } from '../composables/usePharmacy';

const { formatDate } = usePharmacy();

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  checkupId: { type: String, default: null },
});

defineEmits(['close']);

const loading = ref(false);
const checkup = ref(null);

watch(() => props.isOpen, (isOpen) => {
  if (isOpen && props.checkupId) {
    fetchCheckupDetails();
  }
});

watch(() => props.checkupId, (newId) => {
  if (props.isOpen && newId) {
    fetchCheckupDetails();
  }
});

async function fetchCheckupDetails() {
  if (!props.checkupId) return;

  loading.value = true;
  checkup.value = null;

  try {
    const response = await apiFactory.$_getPharmacyHealthCheckupDetails(props.checkupId);
    const result = response.data?.data || response.data?.result || response.data;
    if (result) {
      checkup.value = result;
    }
  } catch (error) {
    console.error('Error fetching checkup details:', error);
  } finally {
    loading.value = false;
  }
}

function getTriageClass(level) {
  if (!level) return 'unknown';
  const l = level.toLowerCase();
  if (l.includes('emergency')) return 'emergency';
  if (l.includes('24')) return 'urgent';
  if (l.includes('consultation')) return 'consultation';
  if (l.includes('self')) return 'self-care';
  return 'unknown';
}

function getTriageIcon(level) {
  const triageClass = getTriageClass(level);
  const icons = {
    emergency: 'hi-exclamation',
    urgent: 'hi-clock',
    consultation: 'hi-user',
    'self-care': 'hi-home',
    unknown: 'hi-question-mark-circle',
  };
  return icons[triageClass] || 'hi-question-mark-circle';
}

function formatTriageLevel(level) {
  if (!level) return 'N/A';
  const l = level.toLowerCase();
  if (l.includes('emergency')) return 'Emergency - Seek Immediate Care';
  if (l.includes('24')) return 'Urgent - See Doctor Within 24 Hours';
  if (l.includes('consultation')) return 'Consultation Recommended';
  if (l.includes('self')) return 'Self-Care Appropriate';
  return level.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function formatDuration(duration) {
  if (!duration) return '';
  if (typeof duration === 'string') return duration;
  if (duration.value && duration.unit) {
    return `${duration.value} ${duration.unit}`;
  }
  return '';
}

function formatCheckupFor(value) {
  if (!value) return 'Self';
  const map = {
    myself: 'Self',
    self: 'Self',
    someone_else: 'Someone Else',
    child: 'Child',
    dependent: 'Dependent',
  };
  return map[value.toLowerCase()] || value;
}

function formatModelName(model) {
  if (!model) return '';
  if (model.includes('claude-sonnet')) return 'Claude Sonnet';
  if (model.includes('claude-opus')) return 'Claude Opus';
  if (model.includes('claude')) return 'Claude';
  return model.split('-')[0];
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
$amber-dark: #D97706;
$rose: #F43F5E;
$rose-light: #FFE4E6;
$blue: #3B82F6;
$violet: #8B5CF6;

// Grayscale colors
$color-g-21: #21262D;
$color-g-30: #303540;
$color-g-40: #40454D;
$color-g-50: #50555D;
$color-g-54: #545961;
$color-g-92: #E8E9EB;

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

.modal-container {
  background: #fff;
  border-radius: 24px;
  width: 100%;
  max-width: 700px;
  max-height: 85vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba($color-g-92, 0.5);
  background: linear-gradient(135deg, rgba($emerald, 0.05) 0%, rgba($sky, 0.05) 100%);

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
  background: linear-gradient(135deg, $emerald-light 0%, rgba($emerald, 0.2) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: $emerald;
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
    background: rgba($rose, 0.1);
    color: $rose;
  }
}

.modal-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.modal-loading {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 60px;

  p {
    font-size: 14px;
    color: $color-g-54;
  }
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba($emerald, 0.2);
  border-top-color: $emerald;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

// Triage Card
.triage-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border-radius: 16px;
  position: relative;

  &--emergency {
    background: linear-gradient(135deg, $rose-light 0%, rgba($rose, 0.15) 100%);
    border: 1px solid rgba($rose, 0.2);
    .triage-card__icon { background: rgba($rose, 0.15); color: $rose; }
    .triage-card__level { color: $rose; }
  }

  &--urgent {
    background: linear-gradient(135deg, $amber-light 0%, rgba($amber, 0.15) 100%);
    border: 1px solid rgba($amber, 0.2);
    .triage-card__icon { background: rgba($amber, 0.15); color: $amber; }
    .triage-card__level { color: darken($amber, 10%); }
  }

  &--consultation {
    background: linear-gradient(135deg, rgba($blue, 0.08) 0%, rgba($blue, 0.15) 100%);
    border: 1px solid rgba($blue, 0.2);
    .triage-card__icon { background: rgba($blue, 0.15); color: $blue; }
    .triage-card__level { color: $blue; }
  }

  &--self-care {
    background: linear-gradient(135deg, $emerald-light 0%, rgba($emerald, 0.15) 100%);
    border: 1px solid rgba($emerald, 0.2);
    .triage-card__icon { background: rgba($emerald, 0.15); color: $emerald; }
    .triage-card__level { color: $emerald; }
  }

  &--unknown {
    background: rgba($color-g-92, 0.3);
    border: 1px solid rgba($color-g-92, 0.5);
    .triage-card__icon { background: rgba($color-g-67, 0.15); color: $color-g-54; }
    .triage-card__level { color: $color-g-54; }
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

  &__desc {
    font-size: 13px;
    color: $color-g-44;
  }
}

.emergency-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: $rose;
  color: white;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

// Section Card
.section-card {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba($color-g-92, 0.5);
  border-radius: 16px;
  padding: 20px;

  &--muted {
    background: rgba($color-g-97, 0.5);
  }

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
}

.count-badge {
  padding: 4px 10px;
  background: rgba($sky, 0.1);
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  color: $sky-dark;
}

// Diagnosis
.diagnosis-content {
  padding: 16px;
  background: rgba($sky-light, 0.4);
  border-radius: 12px;
}

.diagnosis-main {
  margin-bottom: 12px;
}

.diagnosis-name {
  display: block;
  font-size: 18px;
  font-weight: 700;
  color: $color-g-21;
  margin-bottom: 8px;
}

.diagnosis-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.probability-badge {
  padding: 4px 12px;
  background: rgba($emerald, 0.1);
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  color: $emerald;
}

.acuity-badge {
  padding: 4px 12px;
  background: rgba($violet, 0.1);
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  color: $violet;
}

.diagnosis-icd {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid rgba($color-g-92, 0.5);
}

.icd-label {
  font-size: 12px;
  color: $color-g-54;
}

.icd-code {
  font-size: 13px;
  font-weight: 600;
  color: $color-g-36;
  font-family: monospace;
}

// Conditions List
.conditions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.condition-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px;
  background: rgba($color-g-97, 0.5);
  border-radius: 12px;

  &__rank {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    background: rgba($sky, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 700;
    color: $sky-dark;
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
    margin-bottom: 4px;
  }

  &__meta {
    display: flex;
    gap: 8px;
  }

  &__probability {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
  }
}

.meta-icd, .meta-acuity {
  font-size: 11px;
  color: $color-g-54;
}

.probability-bar {
  width: 60px;
  height: 6px;
  background: rgba($color-g-92, 0.5);
  border-radius: 3px;
  overflow: hidden;

  &__fill {
    height: 100%;
    background: linear-gradient(90deg, $emerald 0%, $sky 100%);
    border-radius: 3px;
    transition: width 0.3s ease;
  }
}

.probability-value {
  font-size: 12px;
  font-weight: 600;
  color: $emerald;
  min-width: 36px;
  text-align: right;
}

// Symptoms List
.symptoms-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.symptom-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: rgba($sky-light, 0.4);
  border-radius: 10px;

  svg {
    color: $emerald;
    flex-shrink: 0;
  }
}

.symptom-name {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
  color: $color-g-36;
}

.symptom-duration {
  font-size: 11px;
  color: $color-g-54;
  padding: 2px 8px;
  background: rgba($color-g-92, 0.5);
  border-radius: 8px;
}

.symptom-source {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 8px;

  &--initial {
    background: rgba($violet, 0.1);
    color: $violet;
  }

  &--interview {
    background: rgba($sky, 0.1);
    color: $sky-dark;
  }
}

// Risk Factors
.risk-factors-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.risk-factor-chip {
  padding: 8px 14px;
  background: rgba($amber, 0.1);
  border: 1px solid rgba($amber, 0.15);
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  color: darken($amber, 10%);
}

// Specialists List
.specialists-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.specialist-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: rgba($emerald-light, 0.4);
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  color: $color-g-36;

  svg {
    color: $emerald;
  }
}

// Patient Info
.patient-info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;

  @media (max-width: 500px) {
    grid-template-columns: 1fr;
  }
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 11px;
  color: $color-g-54;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.info-value {
  font-size: 14px;
  font-weight: 600;
  color: $color-g-21;
}

// Error State
.modal-error {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 60px;

  svg {
    color: $rose;
  }

  p {
    font-size: 14px;
    color: $color-g-54;
  }
}

.retry-btn {
  padding: 10px 20px;
  background: $sky;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: $sky-dark;
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

.modal-fade-enter-to,
.modal-fade-leave-from {
  opacity: 1;

  .modal-container {
    transform: scale(1) translateY(0);
  }
}

// AI Summary Section Styles
.section-card--ai {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.05), rgba(59, 130, 246, 0.05));
  border: 1px solid rgba(139, 92, 246, 0.2);
}

.section-card__header--ai {
  .section-card__title {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

.ai-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  background: linear-gradient(135deg, $violet, $sky);
  color: white;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  svg {
    width: 12px;
    height: 12px;
  }
}

.model-badge {
  font-size: 11px;
  color: $color-g-54;
  font-weight: 500;
  margin-left: auto;
}

.ai-overview {
  background: rgba(139, 92, 246, 0.08);
  padding: 16px;
  border-radius: 10px;
  margin-bottom: 20px;
  border-left: 3px solid $violet;

  p {
    font-size: 14px;
    line-height: 1.6;
    color: $color-g-30;
    margin: 0;
  }
}

.ai-section {
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }

  h5 {
    font-size: 13px;
    font-weight: 600;
    color: $color-g-30;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;

    svg {
      width: 16px;
      height: 16px;
      color: $violet;
    }
  }
}

.ai-list {
  display: flex;
  flex-direction: column;
  gap: 8px;

  li {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    font-size: 13px;
    line-height: 1.5;
    color: $color-g-40;

    &::before {
      content: '';
      width: 6px;
      height: 6px;
      background: $violet;
      border-radius: 50%;
      margin-top: 6px;
      flex-shrink: 0;
    }
  }
}

.conditions-explained {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.condition-explained {
  background: white;
  border: 1px solid $color-g-92;
  border-radius: 10px;
  padding: 14px;

  .condition-explained__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;

    h6 {
      font-size: 13px;
      font-weight: 600;
      color: $color-g-30;
      margin: 0;
    }
  }

  .condition-explained__probability {
    font-size: 12px;
    font-weight: 600;
    color: $violet;
    background: rgba(139, 92, 246, 0.1);
    padding: 2px 8px;
    border-radius: 10px;
  }

  p {
    font-size: 13px;
    line-height: 1.5;
    color: $color-g-50;
    margin: 0;
  }
}

.urgency-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;

  svg {
    width: 14px;
    height: 14px;
  }

  &.urgency-badge--emergency,
  &.urgency-badge--urgent {
    background: rgba($rose, 0.1);
    color: $rose;
  }

  &.urgency-badge--consultation,
  &.urgency-badge--soon {
    background: rgba($amber, 0.1);
    color: $amber-dark;
  }

  &.urgency-badge--self_care,
  &.urgency-badge--routine {
    background: rgba($emerald, 0.1);
    color: $emerald;
  }
}

.care-warning {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: rgba($amber, 0.1);
  border: 1px solid rgba($amber, 0.3);
  padding: 14px;
  border-radius: 10px;

  svg {
    width: 20px;
    height: 20px;
    color: $amber-dark;
    flex-shrink: 0;
    margin-top: 2px;
  }

  p {
    font-size: 13px;
    line-height: 1.5;
    color: $color-g-30;
    margin: 0;
  }
}

.tips-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
}

.tip-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: rgba($emerald, 0.05);
  border: 1px solid rgba($emerald, 0.2);
  border-radius: 10px;
  font-size: 13px;
  color: $color-g-40;

  svg {
    width: 16px;
    height: 16px;
    color: $emerald;
    flex-shrink: 0;
  }
}
</style>
