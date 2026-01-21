<template>
  <div class="checkup-detail">
    <!-- Hero Banner -->
    <div class="hero-banner">
      <div class="hero-background">
        <div class="hero-pattern"></div>
      </div>
      <div class="hero-content">
        <div class="hero-top">
          <button @click="goBack" class="back-link">
            <v-icon name="hi-arrow-left" scale="0.9" />
            {{ appointmentId === 'dashboard' ? 'Back to Patient' : 'Back to Appointment' }}
          </button>
        </div>
        <div class="hero-main">
          <div class="hero-text">
            <div class="hero-badge">
              <v-icon name="hi-clipboard-check" scale="0.9" />
              <span>Patient Health Checkup</span>
            </div>
            <h1>Health Assessment Results</h1>
            <p class="hero-subtitle">AI-powered symptom analysis from the patient's self-diagnosis session.</p>
          </div>
          <div class="hero-date" v-if="checkup">
            <v-icon name="hi-calendar" scale="1" />
            <span>{{ formatDate(checkup.created_at) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading health checkup...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <v-icon name="hi-exclamation-circle" scale="2" />
      <p>{{ error }}</p>
      <button @click="fetchCheckup" class="retry-btn">Try Again</button>
    </div>

    <!-- Content -->
    <div v-else-if="checkup" class="checkup-content">
      <!-- Patient Info Card -->
      <div class="patient-info-card" v-if="patientName">
        <div class="patient-avatar">
          <v-icon name="hi-user-circle" scale="2" />
        </div>
        <div class="patient-details">
          <h3>{{ patientName }}</h3>
          <span class="patient-meta">
            {{ patientInfo?.gender || 'N/A' }} | {{ patientInfo?.age || 'N/A' }} years
          </span>
        </div>
      </div>

      <!-- Triage Banner -->
      <div v-if="triageConfig" class="triage-banner" :class="triageConfig.level">
        <div class="triage-icon">
          <v-icon :name="triageConfig.icon" scale="1.2" />
        </div>
        <div class="triage-content">
          <h3>{{ triageConfig.title }}</h3>
          <p>{{ triageConfig.description }}</p>
        </div>
      </div>

      <!-- Results Section -->
      <div class="results-section">
        <h2 class="section-title">
          <v-icon name="hi-document-text" scale="1" />
          Possible Conditions
        </h2>
        <p class="section-description">
          The following conditions are listed based on the patient's reported symptoms, arranged by probability.
          This is for informational purposes only and is not a qualified medical diagnosis.
        </p>

        <div v-if="conditions.length > 0" class="conditions-list">
          <!-- More Likely Conditions -->
          <div v-for="condition in moreLikelyConditions" :key="condition.id" class="condition-card" :class="getEvidenceClass(condition.category)">
            <div class="condition-info">
              <h4>{{ condition.common_name }}</h4>
              <span class="evidence-badge" :class="getEvidenceClass(condition.category)">
                {{ getEvidenceLabel(condition.category) }}
              </span>
            </div>
            <div class="condition-probability">
              <div class="prob-bar">
                <div class="prob-fill" :style="{ width: (condition.probability * 100) + '%' }"></div>
              </div>
              <span class="prob-value">{{ Math.round(condition.probability * 100) }}%</span>
            </div>
          </div>

          <!-- Less Likely Conditions (expandable) -->
          <div v-if="lessLikelyConditions.length > 0" class="less-likely-section">
            <button @click="showLessLikely = !showLessLikely" class="toggle-btn">
              <v-icon :name="showLessLikely ? 'hi-chevron-up' : 'hi-chevron-down'" scale="0.8" />
              {{ showLessLikely ? 'Hide' : 'Show' }} less likely conditions ({{ lessLikelyConditions.length }})
            </button>
            <div v-if="showLessLikely" class="less-likely-list">
              <div v-for="condition in lessLikelyConditions" :key="condition.id" class="condition-card minor" :class="getEvidenceClass(condition.category)">
                <div class="condition-info">
                  <h4>{{ condition.common_name }}</h4>
                  <span class="evidence-badge" :class="getEvidenceClass(condition.category)">
                    {{ getEvidenceLabel(condition.category) }}
                  </span>
                </div>
                <div class="condition-probability">
                  <div class="prob-bar">
                    <div class="prob-fill" :style="{ width: (condition.probability * 100) + '%' }"></div>
                  </div>
                  <span class="prob-value">{{ Math.round(condition.probability * 100) }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="no-conditions">
          <v-icon name="hi-check-circle" scale="2" />
          <h4>No conditions detected</h4>
          <p>Based on the patient's responses, no specific conditions were identified.</p>
        </div>
      </div>

      <!-- Symptoms Summary -->
      <div class="symptoms-section">
        <h2 class="section-title">
          <v-icon name="hi-clipboard-list" scale="1" />
          Reported Symptoms
        </h2>
        <div v-if="symptoms.length > 0" class="symptoms-list">
          <div v-for="symptom in symptoms" :key="symptom.id" class="symptom-item" :class="symptom.choice_id">
            <v-icon :name="getSymptomIcon(symptom.choice_id)" scale="0.8" />
            <span class="symptom-name">{{ symptom.name || symptom.common_name }}</span>
            <span v-if="symptom.duration" class="symptom-duration">{{ formatDuration(symptom.duration) }}</span>
          </div>
        </div>
        <div v-else class="no-symptoms">
          <p>No symptoms recorded for this checkup.</p>
        </div>
      </div>

      <!-- Summary Statistics -->
      <div class="summary-section">
        <h2 class="section-title">
          <v-icon name="hi-chart-bar" scale="1" />
          Assessment Summary
        </h2>
        <div class="summary-grid">
          <div class="summary-item">
            <span class="summary-label">Conditions Analyzed</span>
            <span class="summary-value">{{ conditions.length }}+</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Symptoms Reported</span>
            <span class="summary-value">{{ symptoms.filter(s => s.choice_id === 'present').length }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Assessment Date</span>
            <span class="summary-value">{{ formatDateShort(checkup.created_at) }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Urgency Level</span>
            <span class="summary-value urgency" :class="triageConfig?.level">{{ triageConfig?.title || 'N/A' }}</span>
          </div>
        </div>
      </div>

      <!-- Disclaimer -->
      <div class="disclaimer">
        <v-icon name="hi-information-circle" scale="1" />
        <p>This assessment is for informational purposes only and does not constitute a medical diagnosis. Clinical judgment should be applied to all patient care decisions.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { format } from 'date-fns';
import apiFactory from '@/services/apiFactory';

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const error = ref(null);
const checkup = ref(null);
const patientName = ref('');
const patientInfo = ref(null);
const showLessLikely = ref(false);

const checkupId = computed(() => route.params.checkupId);
const appointmentId = computed(() => route.params.appointmentId);

const conditions = computed(() => {
  if (!checkup.value?.response?.data?.conditions) return [];
  return [...checkup.value.response.data.conditions].sort((a, b) => b.probability - a.probability);
});

const moreLikelyConditions = computed(() => {
  const total = conditions.value.length;
  if (total === 0) return [];
  return conditions.value.slice(0, Math.ceil(total / 2)).map((c, i) => ({
    ...c,
    category: i < total / 3 ? 0 : 1
  }));
});

const lessLikelyConditions = computed(() => {
  const total = conditions.value.length;
  if (total === 0) return [];
  return conditions.value.slice(Math.ceil(total / 2)).map(c => ({
    ...c,
    category: 2
  }));
});

const symptoms = computed(() => {
  if (!checkup.value?.request?.evidence) return [];
  return checkup.value.request.evidence.filter(e => e.source === 'initial' || e.choice_id === 'present');
});

const triageConfig = computed(() => {
  const level = checkup.value?.response?.data?.triage_level;
  if (!level) return null;

  const configs = {
    emergency: {
      level: 'emergency',
      icon: 'hi-exclamation',
      title: 'Emergency',
      description: 'Patient requires immediate medical attention.'
    },
    emergency_ambulance: {
      level: 'emergency',
      icon: 'hi-exclamation',
      title: 'Emergency - Call Ambulance',
      description: 'Patient requires immediate emergency services.'
    },
    consultation_24: {
      level: 'urgent',
      icon: 'hi-clock',
      title: 'Urgent Consultation',
      description: 'Patient should see a doctor within 24 hours.'
    },
    consultation: {
      level: 'moderate',
      icon: 'hi-calendar',
      title: 'Schedule Consultation',
      description: 'Patient should schedule a doctor visit soon.'
    },
    self_care: {
      level: 'low',
      icon: 'hi-check-circle',
      title: 'Self Care',
      description: 'Symptoms may be managed with self-care measures.'
    }
  };

  return configs[level] || configs.consultation;
});

onMounted(async () => {
  await fetchCheckup();
});

async function fetchCheckup() {
  loading.value = true;
  error.value = null;

  try {
    // Try to get the checkup data from the route state first
    if (route.params.checkupData) {
      checkup.value = JSON.parse(route.params.checkupData);
    } else if (checkupId.value) {
      // Fetch by checkup ID
      const response = await apiFactory.$_getHealthCheckupById(checkupId.value);
      checkup.value = response.data?.data || response.data;
    }

    // Get patient info if available
    if (route.query.patientName) {
      patientName.value = route.query.patientName;
    }
    if (route.query.patientGender || route.query.patientAge) {
      patientInfo.value = {
        gender: route.query.patientGender,
        age: route.query.patientAge
      };
    }
  } catch (err) {
    console.error('Error fetching checkup:', err);
    error.value = 'Unable to load health checkup details. Please try again.';
  } finally {
    loading.value = false;
  }
}

function goBack() {
  if (appointmentId.value === 'dashboard' && route.query.patientId) {
    // Came from patient dashboard, go back there
    router.push(`/app/specialist/patients/${route.query.patientId}`);
  } else if (appointmentId.value && appointmentId.value !== 'dashboard') {
    // Include appointment_status query param required by AppointmentDetails.vue
    router.push({
      path: `/app/specialist/specialist-appointments/details/${appointmentId.value}`,
      query: { appointment_status: 'upcoming' }
    });
  } else {
    router.back();
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return format(new Date(dateStr), 'MMMM dd, yyyy \'at\' hh:mm a');
}

function formatDateShort(dateStr) {
  if (!dateStr) return '';
  return format(new Date(dateStr), 'MMM dd, yyyy');
}

function getEvidenceClass(category) {
  if (category === 0) return 'strong';
  if (category === 1) return 'moderate';
  return 'weak';
}

function getEvidenceLabel(category) {
  if (category === 0) return 'Strong evidence';
  if (category === 1) return 'Moderate evidence';
  return 'Weak evidence';
}

function getSymptomIcon(choiceId) {
  if (choiceId === 'present') return 'hi-check-circle';
  if (choiceId === 'absent') return 'hi-x-circle';
  return 'hi-question-mark-circle';
}

function formatDuration(duration) {
  if (!duration) return '';
  const { value, unit } = duration;
  if (!value || !unit) return '';
  return `${value} ${unit}${value > 1 ? 's' : ''}`;
}
</script>

<style lang="scss" scoped>
.checkup-detail {
  padding: $size-20;
  max-width: 900px;
  margin: 0 auto;
  min-height: 100vh;
  height: 100%;
  background: $color-g-97;
  overflow-y: auto;
  padding-bottom: 100px;

  @media (max-width: 480px) {
    padding: $size-16;
    padding-bottom: 80px;
  }
}

// Hero Banner
.hero-banner {
  position: relative;
  background: linear-gradient(135deg, #0EAEC4 0%, #0891b2 50%, #0e7490 100%);
  border-radius: $size-20;
  padding: $size-24;
  margin-bottom: $size-24;
  overflow: hidden;

  @media (max-width: 480px) {
    padding: $size-20 $size-16;
    border-radius: $size-16;
    margin-bottom: $size-20;
  }
}

.hero-background {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;

  .hero-pattern {
    position: absolute;
    inset: 0;
    background-image: radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 1px, transparent 1px),
                      radial-gradient(circle at 80% 20%, rgba(255,255,255,0.08) 1px, transparent 1px);
    background-size: 50px 50px, 70px 70px;
  }
}

.hero-content {
  position: relative;
  z-index: 1;
}

.hero-top {
  margin-bottom: $size-16;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: $size-6;
  color: rgba(255, 255, 255, 0.9);
  background: none;
  border: none;
  font-size: $size-14;
  font-weight: $fw-medium;
  cursor: pointer;
  transition: all 0.2s;
  padding: $size-6 0;

  &:hover {
    color: white;
  }
}

.hero-main {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: $size-20;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: flex-start;
    gap: $size-16;
  }
}

.hero-text {
  flex: 1;

  h1 {
    font-size: $size-24;
    font-weight: $fw-bold;
    color: white;
    margin: 0 0 $size-8;
    line-height: 1.2;

    @media (max-width: 480px) {
      font-size: $size-20;
    }
  }
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: $size-6;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  padding: $size-5 $size-12;
  border-radius: $size-16;
  font-size: $size-12;
  font-weight: $fw-semi-bold;
  color: white;
  margin-bottom: $size-12;
}

.hero-subtitle {
  font-size: $size-14;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.5;
  margin: 0;
  max-width: 450px;
}

.hero-date {
  display: flex;
  align-items: center;
  gap: $size-8;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  padding: $size-10 $size-16;
  border-radius: $size-10;
  color: white;
  font-size: $size-14;
  font-weight: $fw-medium;
  flex-shrink: 0;
}

// Loading & Error States
.loading-state, .error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $size-80 $size-20;
  text-align: center;
}

.spinner {
  width: $size-48;
  height: $size-48;
  border: 3px solid #e5e7eb;
  border-top-color: #0EAEC4;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-state {
  color: #ef4444;

  p { margin: $size-16 0; color: $color-g-54; }

  .retry-btn {
    padding: $size-10 $size-20;
    background: #0EAEC4;
    color: white;
    border: none;
    border-radius: $size-8;
    cursor: pointer;

    &:hover { background: #0d9eb3; }
  }
}

// Content
.checkup-content {
  display: flex;
  flex-direction: column;
  gap: $size-24;
}

// Patient Info Card
.patient-info-card {
  display: flex;
  align-items: center;
  gap: $size-16;
  background: white;
  padding: $size-20;
  border-radius: $size-16;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.patient-avatar {
  width: $size-48;
  height: $size-48;
  color: #0EAEC4;
}

.patient-details {
  h3 {
    font-size: $size-18;
    font-weight: $fw-semi-bold;
    color: $color-g-21;
    margin: 0 0 $size-4;
    text-transform: capitalize;
  }

  .patient-meta {
    font-size: $size-13;
    color: $color-g-54;
  }
}

// Triage Banner
.triage-banner {
  display: flex;
  align-items: flex-start;
  gap: $size-16;
  padding: $size-20;
  border-radius: $size-16;
  background: white;
  border-left: 4px solid;

  &.emergency {
    border-color: #dc2626;
    background: #fef2f2;

    .triage-icon { color: #dc2626; }
    h3 { color: #991b1b; }
  }

  &.urgent {
    border-color: #f97316;
    background: #fff7ed;

    .triage-icon { color: #f97316; }
    h3 { color: #c2410c; }
  }

  &.moderate {
    border-color: #f59e0b;
    background: #fffbeb;

    .triage-icon { color: #f59e0b; }
    h3 { color: #b45309; }
  }

  &.low {
    border-color: #10b981;
    background: #f0fdf4;

    .triage-icon { color: #10b981; }
    h3 { color: #166534; }
  }
}

.triage-content {
  flex: 1;

  h3 {
    font-size: $size-16;
    font-weight: $fw-semi-bold;
    margin: 0 0 $size-4;
  }

  p {
    font-size: $size-14;
    color: $color-g-44;
    margin: 0;
  }
}

// Sections
.results-section, .symptoms-section, .summary-section {
  background: white;
  border-radius: $size-16;
  padding: $size-24;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.section-title {
  display: flex;
  align-items: center;
  gap: $size-8;
  font-size: $size-18;
  font-weight: $fw-semi-bold;
  color: $color-g-21;
  margin: 0 0 $size-12;

  svg { color: #0EAEC4; }
}

.section-description {
  font-size: $size-14;
  color: $color-g-54;
  margin: 0 0 $size-20;
  line-height: 1.5;
}

// Conditions
.conditions-list {
  display: flex;
  flex-direction: column;
  gap: $size-12;
}

.condition-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $size-16;
  border: 1px solid #e5e7eb;
  border-radius: $size-12;
  background: white;
  border-left: 4px solid;

  &.strong { border-left-color: #f97316; }
  &.moderate { border-left-color: #f59e0b; }
  &.weak { border-left-color: #9ca3af; }

  &.minor {
    padding: $size-12;
    background: $color-g-97;
  }

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: flex-start;
    gap: $size-12;
  }
}

.condition-info {
  flex: 1;

  h4 {
    font-size: $size-15;
    font-weight: $fw-semi-bold;
    color: $color-g-21;
    margin: 0 0 $size-6;
  }
}

.evidence-badge {
  display: inline-block;
  padding: $size-2 $size-8;
  border-radius: $size-4;
  font-size: $size-11;
  font-weight: $fw-medium;

  &.strong { background: #ffedd5; color: #c2410c; }
  &.moderate { background: #fef3c7; color: #b45309; }
  &.weak { background: #f3f4f6; color: #6b7280; }
}

.condition-probability {
  display: flex;
  align-items: center;
  gap: $size-12;
  min-width: 150px;

  @media (max-width: 480px) {
    width: 100%;
  }
}

.prob-bar {
  flex: 1;
  height: 8px;
  background: #e5e7eb;
  border-radius: $size-4;
  overflow: hidden;
}

.prob-fill {
  height: 100%;
  background: linear-gradient(90deg, #0EAEC4, #0891b2);
  border-radius: $size-4;
  transition: width 0.3s ease;
}

.prob-value {
  font-size: $size-14;
  font-weight: $fw-semi-bold;
  color: $color-g-21;
  min-width: 45px;
  text-align: right;
}

.less-likely-section {
  margin-top: $size-16;
  padding-top: $size-16;
  border-top: 1px solid #e5e7eb;
}

.toggle-btn {
  display: flex;
  align-items: center;
  gap: $size-6;
  background: none;
  border: none;
  color: #0EAEC4;
  font-size: $size-14;
  font-weight: $fw-medium;
  cursor: pointer;
  padding: $size-8 0;

  &:hover { color: #0891b2; }
}

.less-likely-list {
  display: flex;
  flex-direction: column;
  gap: $size-8;
  margin-top: $size-12;
}

.no-conditions {
  text-align: center;
  padding: $size-32;
  color: #10b981;

  svg { margin-bottom: $size-12; }

  h4 {
    font-size: $size-16;
    font-weight: $fw-semi-bold;
    margin: 0 0 $size-8;
  }

  p {
    font-size: $size-14;
    color: $color-g-54;
    margin: 0;
  }
}

// Symptoms
.symptoms-list {
  display: flex;
  flex-wrap: wrap;
  gap: $size-10;
}

.symptom-item {
  display: flex;
  align-items: center;
  gap: $size-8;
  padding: $size-10 $size-14;
  background: $color-g-97;
  border-radius: $size-8;
  font-size: $size-13;

  &.present {
    background: rgba(16, 185, 129, 0.1);
    svg { color: #10b981; }
  }

  &.absent {
    background: rgba(239, 68, 68, 0.1);
    svg { color: #ef4444; }
  }
}

.symptom-name {
  color: $color-g-21;
  font-weight: $fw-medium;
}

.symptom-duration {
  font-size: $size-11;
  color: $color-g-54;
  background: rgba(0, 0, 0, 0.05);
  padding: $size-2 $size-6;
  border-radius: $size-4;
}

.no-symptoms {
  padding: $size-20;
  text-align: center;
  color: $color-g-54;
}

// Summary
.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $size-16;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: $size-6;
  padding: $size-16;
  background: $color-g-97;
  border-radius: $size-10;
}

.summary-label {
  font-size: $size-12;
  color: $color-g-54;
}

.summary-value {
  font-size: $size-18;
  font-weight: $fw-semi-bold;
  color: $color-g-21;

  &.urgency {
    font-size: $size-14;
    padding: $size-4 $size-10;
    border-radius: $size-6;
    display: inline-block;
    width: fit-content;

    &.emergency { background: #fef2f2; color: #dc2626; }
    &.urgent { background: #fff7ed; color: #f97316; }
    &.moderate { background: #fffbeb; color: #f59e0b; }
    &.low { background: #f0fdf4; color: #10b981; }
  }
}

// Disclaimer
.disclaimer {
  display: flex;
  align-items: flex-start;
  gap: $size-12;
  padding: $size-16;
  background: #f8fafc;
  border-radius: $size-12;
  border: 1px solid #e2e8f0;

  svg {
    color: $color-g-54;
    flex-shrink: 0;
    margin-top: $size-2;
  }

  p {
    font-size: $size-13;
    color: $color-g-54;
    line-height: 1.5;
    margin: 0;
  }
}
</style>
