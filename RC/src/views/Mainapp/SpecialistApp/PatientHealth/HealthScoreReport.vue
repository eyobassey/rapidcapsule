<template>
  <div class="health-report">
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
              <v-icon name="hi-document-report" scale="0.9" />
              <span>Patient Health Report</span>
            </div>
            <h1>{{ scoreType === 'basic' ? 'Basic Health Score' : 'Advanced Health Analysis' }}</h1>
            <p class="hero-subtitle">{{ scoreType === 'basic' ? 'Score calculated from recent vital measurements.' : 'AI-powered comprehensive health assessment with personalized insights.' }}</p>
          </div>
          <div class="hero-date" v-if="report?.created_at">
            <v-icon name="hi-calendar" scale="1" />
            <span>{{ formatDate(report.created_at) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading health report...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <v-icon name="hi-exclamation-circle" scale="2" />
      <p>{{ error }}</p>
      <button @click="fetchReport" class="retry-btn">Try Again</button>
    </div>

    <!-- Basic Score Content -->
    <div v-else-if="scoreType === 'basic'" class="report-content">
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

      <!-- Overall Score Card -->
      <div class="overall-score-card">
        <div class="score-circle" :class="getStatusClass(basicScore)">
          <span class="score-value">{{ basicScore || '-' }}</span>
          <span class="score-label">/ 100</span>
        </div>
        <div class="score-info">
          <h2>Basic Health Score</h2>
          <span class="status-badge" :class="getStatusClass(basicScore)">
            {{ getScoreLabel(basicScore) }}
          </span>
          <p class="summary">This score is calculated based on the patient's recent vital readings including blood pressure, pulse rate, blood sugar levels, body temperature, and BMI measurements.</p>
        </div>
      </div>

      <!-- Vitals Breakdown -->
      <div class="section" v-if="vitals">
        <h2 class="section-title">
          <v-icon name="hi-heart" scale="1.2" />
          Vitals Breakdown
        </h2>
        <div class="vitals-grid">
          <div class="vital-card" v-if="vitals.blood_pressure?.length">
            <div class="vital-icon bp">
              <v-icon name="hi-heart" scale="1" />
            </div>
            <div class="vital-info">
              <span class="vital-label">Blood Pressure</span>
              <span class="vital-value">{{ vitals.blood_pressure[0]?.value }} {{ vitals.blood_pressure[0]?.unit }}</span>
            </div>
          </div>
          <div class="vital-card" v-if="vitals.pulse_rate?.length">
            <div class="vital-icon pulse">
              <v-icon name="fa-heartbeat" scale="1" />
            </div>
            <div class="vital-info">
              <span class="vital-label">Pulse Rate</span>
              <span class="vital-value">{{ vitals.pulse_rate[0]?.value }} {{ vitals.pulse_rate[0]?.unit }}</span>
            </div>
          </div>
          <div class="vital-card" v-if="vitals.blood_sugar_level?.length">
            <div class="vital-icon sugar">
              <v-icon name="bi-droplet-fill" scale="1" />
            </div>
            <div class="vital-info">
              <span class="vital-label">Blood Sugar</span>
              <span class="vital-value">{{ vitals.blood_sugar_level[0]?.value }} {{ vitals.blood_sugar_level[0]?.unit }}</span>
            </div>
          </div>
          <div class="vital-card" v-if="vitals.body_temp?.length">
            <div class="vital-icon temp">
              <v-icon name="fa-thermometer-half" scale="1" />
            </div>
            <div class="vital-info">
              <span class="vital-label">Temperature</span>
              <span class="vital-value">{{ vitals.body_temp[0]?.value }} {{ vitals.body_temp[0]?.unit }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Score Interpretation -->
      <div class="section">
        <h2 class="section-title">
          <v-icon name="hi-information-circle" scale="1.2" />
          Score Interpretation
        </h2>
        <div class="interpretation-content">
          <div class="interpretation-item">
            <span class="score-range excellent">80-100</span>
            <span class="range-label">Excellent - Vitals are within optimal ranges</span>
          </div>
          <div class="interpretation-item">
            <span class="score-range good">60-79</span>
            <span class="range-label">Good - Most vitals are in healthy ranges</span>
          </div>
          <div class="interpretation-item">
            <span class="score-range fair">40-59</span>
            <span class="range-label">Fair - Some vitals may need attention</span>
          </div>
          <div class="interpretation-item">
            <span class="score-range poor">0-39</span>
            <span class="range-label">Needs Attention - Vitals require review</span>
          </div>
        </div>
      </div>

      <!-- Disclaimer -->
      <div class="disclaimer">
        <v-icon name="hi-information-circle" scale="1" />
        <p>This basic health score is calculated from available vital measurements. It provides a general overview and should be considered alongside clinical observations.</p>
      </div>
    </div>

    <!-- Advanced Score Content -->
    <div v-else-if="report" class="report-content">
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

      <!-- Overall Score Card -->
      <div class="overall-score-card">
        <div class="score-circle" :class="getStatusClass(reportData?.overall_score)">
          <span class="score-value">{{ reportData?.overall_score || '-' }}</span>
          <span class="score-label">/ 100</span>
        </div>
        <div class="score-info">
          <h2>Advanced Health Score</h2>
          <span class="status-badge" :class="getStatusClass(reportData?.overall_score)">
            {{ reportData?.overall_status || getScoreLabel(reportData?.overall_score) }}
          </span>
          <p class="summary">{{ reportData?.overall_summary }}</p>
        </div>
      </div>

      <!-- Confidence Level -->
      <div v-if="reportData?.confidence_level" class="confidence-banner" :class="reportData.confidence_level">
        <v-icon name="hi-information-circle" scale="1" />
        <span>
          Analysis confidence: <strong>{{ reportData.confidence_level }}</strong>
          <template v-if="reportData?.data_sources_used">
            (Based on {{ reportData.data_sources_used.join(', ') }})
          </template>
        </span>
      </div>

      <!-- Domain Scores -->
      <div v-if="reportData?.domain_scores?.length" class="section">
        <h2 class="section-title">
          <v-icon name="hi-chart-pie" scale="1.2" />
          Health Domain Scores
        </h2>
        <div class="domain-scores">
          <div
            v-for="domain in reportData.domain_scores"
            :key="domain.domain"
            class="domain-card"
            :class="getStatusClass(domain.score)"
          >
            <div class="domain-header">
              <span class="domain-icon">{{ getDomainIcon(domain.domain) }}</span>
              <h3>{{ domain.domain_label }}</h3>
            </div>
            <div class="domain-score">
              <div class="score-bar-bg">
                <div class="score-bar-fill" :style="{ width: domain.score + '%' }" :class="getStatusClass(domain.score)"></div>
              </div>
              <span class="score-text">{{ domain.score }}/100</span>
            </div>
            <p class="domain-insights">{{ domain.insights }}</p>
            <div v-if="domain.recommendations?.length" class="domain-recommendations">
              <strong>Recommendations:</strong>
              <ul>
                <li v-for="(rec, idx) in domain.recommendations" :key="idx">{{ rec }}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Priority Actions -->
      <div v-if="reportData?.priority_actions?.length" class="section">
        <h2 class="section-title">
          <v-icon name="hi-flag" scale="1.2" />
          Priority Actions
        </h2>
        <div class="priority-actions">
          <div v-for="(action, idx) in reportData.priority_actions" :key="idx" class="action-card" :class="action.priority">
            <div class="action-priority">
              <span class="priority-badge" :class="action.priority">{{ action.priority }}</span>
            </div>
            <div class="action-content">
              <h4>{{ action.action }}</h4>
              <p>{{ action.reason }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Detailed Analysis -->
      <div v-if="reportData?.detailed_analysis" class="section">
        <h2 class="section-title">
          <v-icon name="hi-document-text" scale="1.2" />
          Detailed Analysis
        </h2>
        <div class="analysis-content">
          <p>{{ reportData.detailed_analysis }}</p>
        </div>
      </div>

      <!-- Lifestyle Tips -->
      <div v-if="reportData?.lifestyle_tips?.length" class="section">
        <h2 class="section-title">
          <v-icon name="hi-light-bulb" scale="1.2" />
          Lifestyle Tips
        </h2>
        <div class="tips-list">
          <div v-for="(tip, idx) in reportData.lifestyle_tips" :key="idx" class="tip-item">
            <v-icon name="hi-check-circle" scale="1" />
            <span>{{ tip }}</span>
          </div>
        </div>
      </div>

      <!-- When to See a Doctor -->
      <div v-if="reportData?.when_to_see_doctor?.length" class="section warning-section">
        <h2 class="section-title">
          <v-icon name="hi-exclamation" scale="1.2" />
          When to See a Doctor
        </h2>
        <div class="doctor-alerts">
          <div v-for="(alert, idx) in reportData.when_to_see_doctor" :key="idx" class="alert-item">
            <v-icon name="hi-exclamation-circle" scale="1" />
            <span>{{ alert }}</span>
          </div>
        </div>
      </div>

      <!-- Disclaimer -->
      <div class="disclaimer">
        <v-icon name="hi-information-circle" scale="1" />
        <p>{{ reportData?.disclaimer || defaultDisclaimer }}</p>
      </div>

      <!-- Report Metadata -->
      <div class="report-meta">
        <p>Report generated on {{ formatDate(report.created_at) }}</p>
        <p v-if="report.credits_used">Credits used: {{ report.credits_used }}</p>
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
const report = ref(null);
const basicScore = ref(null);
const vitals = ref(null);
const patientName = ref('');
const patientInfo = ref(null);

const defaultDisclaimer = 'This health assessment is for informational purposes only and does not constitute medical advice. Always consult with a qualified healthcare provider for medical decisions.';

const scoreType = computed(() => route.params.type || 'advanced');
const scoreId = computed(() => route.params.scoreId);
const appointmentId = computed(() => route.params.appointmentId);

// Computed to normalize report structure - handle both direct report and nested report.report structures
const reportData = computed(() => {
  if (!report.value) return null;
  // If report has a nested report object, use it directly
  if (report.value.report) return report.value.report;
  // Otherwise, the report value IS the report data
  return report.value;
});

onMounted(async () => {
  await fetchReport();
});

async function fetchReport() {
  loading.value = true;
  error.value = null;

  try {
    // Get patient info from query params if available
    if (route.query.patientName) {
      patientName.value = route.query.patientName;
    }
    if (route.query.patientGender || route.query.patientAge) {
      patientInfo.value = {
        gender: route.query.patientGender,
        age: route.query.patientAge
      };
    }

    if (scoreType.value === 'basic') {
      // Basic score: fetch from appointment details to avoid long URLs
      if (appointmentId.value) {
        const response = await apiFactory.$_getAppointmentDetailsForSpecialist(appointmentId.value);
        const data = response.data?.data || response.data;

        // Extract patient info - response structure has 'patient' object
        if (data?.patient) {
          const patient = data.patient;
          patientName.value = patientName.value || `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || patient.full_name;
          patientInfo.value = patientInfo.value || {
            gender: patient.gender,
            age: patient.age
          };
        }

        // Extract health scores and vitals - they're at top level in response
        basicScore.value = data?.health_scores?.basic ?? null;
        vitals.value = data?.vitals || null;
      } else if (route.query.vitalsData) {
        // Fallback: use query params if no appointment ID
        basicScore.value = route.query.score ? parseInt(route.query.score) : null;
        vitals.value = JSON.parse(route.query.vitalsData);
      }
    } else {
      // Fetch advanced score report (use specialist endpoint)
      if (scoreId.value) {
        const response = await apiFactory.$_getAdvancedHealthScoreByIdForSpecialist(scoreId.value);
        report.value = response.data?.data || response.data;
      } else if (route.query.reportData) {
        report.value = JSON.parse(route.query.reportData);
      } else if (route.query.score) {
        // Fallback: we have only the score value, create a minimal report
        report.value = {
          report: {
            overall_score: parseInt(route.query.score),
            overall_status: getScoreLabel(parseInt(route.query.score)),
            overall_summary: 'This comprehensive health score is calculated using AI-powered assessment of the patient\'s health data, lifestyle factors, and risk indicators.'
          },
          created_at: new Date().toISOString()
        };
      }
    }
  } catch (err) {
    console.error('Error fetching report:', err);
    error.value = 'Unable to load health report. Please try again.';
  } finally {
    loading.value = false;
  }
}

function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null;
  const today = new Date();
  const birth = new Date(dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function goBack() {
  // If coming from patient dashboard (appointmentId = 'dashboard'), navigate back to patient
  if (appointmentId.value === 'dashboard' && route.query.patientId) {
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

function getStatusClass(score) {
  if (score === null || score === undefined) return 'none';
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fair';
  return 'poor';
}

function getScoreLabel(score) {
  if (score === null || score === undefined) return 'N/A';
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Needs Attention';
}

function getDomainIcon(domain) {
  const icons = {
    cardiovascular: '❤️',
    metabolic: '⚡',
    mental_wellbeing: '🧠',
    lifestyle: '🏃',
    physical_symptoms: '🩺',
    preventive_care: '🛡️',
  };
  return icons[domain] || '📊';
}
</script>

<style lang="scss" scoped>
.health-report {
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

  &:hover { color: white; }
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

// Loading & Error
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
.report-content {
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

// Overall Score Card
.overall-score-card {
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: $size-16;
  padding: $size-32;
  display: flex;
  align-items: center;
  gap: $size-32;

  @media (max-width: 600px) {
    flex-direction: column;
    text-align: center;
    padding: $size-24 $size-20;
    gap: $size-20;
  }

  .score-circle {
    width: 140px;
    height: 140px;
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    @media (max-width: 480px) {
      width: 120px;
      height: 120px;
    }

    &.excellent { background: linear-gradient(135deg, #10b981, #059669); }
    &.good { background: linear-gradient(135deg, #0EAEC4, #0891b2); }
    &.fair { background: linear-gradient(135deg, #f59e0b, #d97706); }
    &.poor { background: linear-gradient(135deg, #ef4444, #dc2626); }
    &.none { background: #a1a1aa; }

    .score-value {
      font-size: $size-48;
      font-weight: $fw-bold;
      color: white;
      line-height: 1;

      @media (max-width: 480px) { font-size: $size-40; }
    }

    .score-label {
      font-size: $size-16;
      color: rgba(255, 255, 255, 0.8);
    }
  }

  .score-info {
    flex: 1;

    h2 {
      font-size: $size-24;
      color: $color-g-21;
      margin: 0 0 $size-8;

      @media (max-width: 480px) { font-size: $size-20; }
    }

    .status-badge {
      display: inline-block;
      padding: $size-4 $size-12;
      border-radius: $size-16;
      font-size: $size-14;
      font-weight: $fw-medium;
      margin-bottom: $size-12;

      &.excellent { background: #d1fae5; color: #059669; }
      &.good { background: #e0f7fa; color: #0891b2; }
      &.fair { background: #fef3c7; color: #d97706; }
      &.poor { background: #fee2e2; color: #dc2626; }
    }

    .summary {
      color: $color-g-54;
      margin: 0;
      line-height: 1.6;
    }
  }
}

// Confidence Banner
.confidence-banner {
  display: flex;
  align-items: center;
  gap: $size-8;
  padding: $size-12 $size-16;
  border-radius: $size-8;
  font-size: $size-14;

  &.high { background: #d1fae5; color: #059669; }
  &.medium { background: #fef3c7; color: #92400e; }
  &.low { background: #fee2e2; color: #dc2626; }
}

// Sections
.section {
  background: white;
  border-radius: $size-16;
  padding: $size-24;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);

  &.warning-section .section-title { color: #dc2626; }
}

.section-title {
  display: flex;
  align-items: center;
  gap: $size-8;
  font-size: $size-18;
  color: $color-g-21;
  margin: 0 0 $size-16;

  svg { color: #0EAEC4; }
}

// Vitals Grid
.vitals-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $size-16;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
}

.vital-card {
  display: flex;
  align-items: center;
  gap: $size-16;
  padding: $size-16;
  background: $color-g-97;
  border-radius: $size-12;
}

.vital-icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;

  &.bp { background: linear-gradient(135deg, #ef4444, #dc2626); }
  &.pulse { background: linear-gradient(135deg, #f97316, #ea580c); }
  &.sugar { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }
  &.temp { background: linear-gradient(135deg, #0EAEC4, #0891b2); }
}

.vital-info {
  display: flex;
  flex-direction: column;
  gap: $size-4;

  .vital-label {
    font-size: $size-12;
    color: $color-g-54;
  }

  .vital-value {
    font-size: $size-18;
    font-weight: $fw-semi-bold;
    color: $color-g-21;
  }
}

// Interpretation
.interpretation-content {
  display: flex;
  flex-direction: column;
  gap: $size-12;
}

.interpretation-item {
  display: flex;
  align-items: center;
  gap: $size-12;
  padding: $size-12;
  background: $color-g-97;
  border-radius: $size-8;
}

.score-range {
  padding: $size-4 $size-12;
  border-radius: $size-6;
  font-size: $size-13;
  font-weight: $fw-semi-bold;
  min-width: 60px;
  text-align: center;

  &.excellent { background: #d1fae5; color: #059669; }
  &.good { background: #e0f7fa; color: #0891b2; }
  &.fair { background: #fef3c7; color: #d97706; }
  &.poor { background: #fee2e2; color: #dc2626; }
}

.range-label {
  font-size: $size-14;
  color: $color-g-44;
}

// Domain Scores
.domain-scores {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $size-16;

  @media (max-width: 700px) { grid-template-columns: 1fr; }
}

.domain-card {
  background: $color-g-97;
  border: 1px solid #e5e7eb;
  border-radius: $size-12;
  padding: $size-20;

  &.excellent { border-left: 4px solid #10b981; }
  &.good { border-left: 4px solid #0EAEC4; }
  &.fair { border-left: 4px solid #f59e0b; }
  &.poor { border-left: 4px solid #ef4444; }
}

.domain-header {
  display: flex;
  align-items: center;
  gap: $size-8;
  margin-bottom: $size-12;

  .domain-icon { font-size: $size-20; }

  h3 {
    font-size: $size-15;
    color: $color-g-21;
    margin: 0;
  }
}

.domain-score {
  display: flex;
  align-items: center;
  gap: $size-12;
  margin-bottom: $size-12;
}

.score-bar-bg {
  flex: 1;
  height: 8px;
  background: #e5e7eb;
  border-radius: $size-4;
  overflow: hidden;
}

.score-bar-fill {
  height: 100%;
  border-radius: $size-4;
  transition: width 0.5s ease;

  &.excellent { background: #10b981; }
  &.good { background: #0EAEC4; }
  &.fair { background: #f59e0b; }
  &.poor { background: #ef4444; }
}

.score-text {
  font-size: $size-14;
  font-weight: $fw-semi-bold;
  color: $color-g-21;
  min-width: 60px;
}

.domain-insights {
  color: $color-g-54;
  font-size: $size-14;
  margin: 0 0 $size-12;
  line-height: 1.5;
}

.domain-recommendations {
  font-size: $size-13;

  strong { color: $color-g-44; }

  ul {
    margin: $size-8 0 0;
    padding-left: $size-18;

    li {
      color: $color-g-54;
      margin-bottom: $size-4;
    }
  }
}

// Priority Actions
.priority-actions {
  display: flex;
  flex-direction: column;
  gap: $size-12;
}

.action-card {
  display: flex;
  gap: $size-16;
  background: $color-g-97;
  border: 1px solid #e5e7eb;
  border-radius: $size-12;
  padding: $size-16;

  &.high { border-left: 4px solid #ef4444; }
  &.medium { border-left: 4px solid #f59e0b; }
  &.low { border-left: 4px solid #0EAEC4; }
}

.priority-badge {
  display: inline-block;
  padding: $size-4 $size-8;
  border-radius: $size-4;
  font-size: $size-11;
  font-weight: $fw-semi-bold;
  text-transform: uppercase;

  &.high { background: #fee2e2; color: #dc2626; }
  &.medium { background: #fef3c7; color: #d97706; }
  &.low { background: #e0f7fa; color: #0891b2; }
}

.action-content {
  flex: 1;

  h4 {
    font-size: $size-15;
    color: $color-g-21;
    margin: 0 0 $size-4;
  }

  p {
    font-size: $size-14;
    color: $color-g-54;
    margin: 0;
  }
}

// Analysis & Tips
.analysis-content {
  background: $color-g-97;
  border-radius: $size-12;
  padding: $size-20;

  p {
    color: $color-g-44;
    line-height: 1.7;
    margin: 0;
    white-space: pre-line;
  }
}

.tips-list {
  display: flex;
  flex-direction: column;
  gap: $size-8;
}

.tip-item {
  display: flex;
  align-items: flex-start;
  gap: $size-12;
  padding: $size-12;
  background: #f0fdf4;
  border-radius: $size-8;
  border: 1px solid #bbf7d0;

  svg { color: #10b981; flex-shrink: 0; margin-top: $size-2; }
  span { font-size: $size-14; color: #166534; }
}

.doctor-alerts {
  display: flex;
  flex-direction: column;
  gap: $size-8;
}

.alert-item {
  display: flex;
  align-items: flex-start;
  gap: $size-12;
  padding: $size-12;
  background: #fef2f2;
  border-radius: $size-8;
  border: 1px solid #fecaca;

  svg { color: #dc2626; flex-shrink: 0; margin-top: $size-2; }
  span { font-size: $size-14; color: #991b1b; }
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

// Report Meta
.report-meta {
  text-align: center;
  color: $color-g-54;
  font-size: $size-12;

  p { margin: $size-4 0; }
}
</style>
