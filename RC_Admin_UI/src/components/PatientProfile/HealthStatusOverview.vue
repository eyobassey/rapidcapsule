<template>
  <VCard>
    <VCardText>
      <h6 class="text-h6 mb-4">
        Health Status Overview
      </h6>

      <!-- Health Scores Comparison -->
      <VRow class="mb-4">
        <!-- Basic Score -->
        <VCol cols="12" md="6">
          <VCard variant="outlined" class="health-score-card basic-card h-100">
            <VCardText>
              <div class="score-header">
                <VChip color="info" variant="flat" size="small">
                  <VIcon icon="bx-calculator" size="14" class="mr-1" />
                  Basic Score
                </VChip>
                <span class="text-caption text-medium-emphasis">Real-time calculation</span>
              </div>
              <div class="score-display">
                <div class="score-circle" :class="getHealthScoreClass()">
                  <span class="score-value">{{ healthScore }}</span>
                </div>
                <div class="score-info">
                  <span class="score-status" :class="getHealthScoreClass()">{{ getHealthStatus(healthScore) }}</span>
                  <p class="score-description text-body-2 text-medium-emphasis mb-0">
                    {{ getHealthScoreDescription() }}
                  </p>
                </div>
              </div>
              <div class="score-basis mt-3">
                <p class="text-caption text-medium-emphasis mb-0">
                  <VIcon icon="bx-info-circle" size="14" class="mr-1" />
                  Based on BMI, vitals, and health profile
                </p>
              </div>
            </VCardText>
          </VCard>
        </VCol>

        <!-- Premium Score -->
        <VCol cols="12" md="6">
          <VCard variant="outlined" class="health-score-card premium-card h-100" :class="{ 'no-premium': !latestPremiumAssessment }">
            <VCardText>
              <div class="score-header">
                <VChip color="warning" variant="flat" size="small">
                  <VIcon icon="bx-star" size="14" class="mr-1" />
                  Premium Score
                </VChip>
                <span v-if="latestPremiumAssessment" class="text-caption text-medium-emphasis">
                  {{ formatDate(latestPremiumAssessment.created_at) }}
                </span>
                <span v-else class="text-caption text-medium-emphasis">AI-Powered Analysis</span>
              </div>

              <template v-if="latestPremiumAssessment">
                <div class="score-display">
                  <div class="score-circle premium" :class="getPremiumScoreClass(latestPremiumAssessment.report?.overall_score)">
                    <span class="score-value">{{ latestPremiumAssessment.report?.overall_score || '--' }}</span>
                  </div>
                  <div class="score-info">
                    <span class="score-status" :class="getPremiumScoreClass(latestPremiumAssessment.report?.overall_score)">
                      {{ latestPremiumAssessment.report?.overall_status || 'Processing' }}
                    </span>
                    <p class="score-description text-body-2 text-medium-emphasis mb-0">
                      {{ truncateText(latestPremiumAssessment.report?.overall_summary, 100) || 'Comprehensive AI health analysis' }}
                    </p>
                  </div>
                </div>
                <div class="score-basis mt-3 d-flex justify-space-between align-center">
                  <p class="text-caption text-medium-emphasis mb-0">
                    <VIcon icon="bx-analyse" size="14" class="mr-1" />
                    6 health domains analyzed
                  </p>
                  <VBtn
                    size="small"
                    variant="tonal"
                    color="warning"
                    @click="viewPremiumReport(latestPremiumAssessment._id)"
                  >
                    View Report
                  </VBtn>
                </div>
              </template>

              <template v-else>
                <div class="no-premium-content">
                  <VIcon icon="bx-star" size="48" class="text-disabled mb-2" />
                  <p class="text-body-2 text-medium-emphasis mb-2">No premium assessment yet</p>
                  <p class="text-caption text-disabled mb-0">
                    Patient can take a premium assessment for comprehensive AI-powered health analysis
                  </p>
                </div>
              </template>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <!-- Premium Domain Scores -->
      <VRow v-if="latestPremiumAssessment?.report?.domain_scores" class="mb-4">
        <VCol cols="12">
          <VCard variant="outlined">
            <VCardText>
              <div class="d-flex justify-space-between align-center mb-3">
                <h6 class="text-subtitle-1 mb-0">
                  <VIcon icon="bx-grid-alt" class="mr-2" />
                  Health Domain Scores
                </h6>
                <VChip size="x-small" color="warning" variant="tonal">
                  Premium Analysis
                </VChip>
              </div>
              <VRow>
                <VCol
                  v-for="domain in latestPremiumAssessment.report.domain_scores"
                  :key="domain.domain"
                  cols="6"
                  sm="4"
                  md="2"
                >
                  <div class="domain-card" :class="getDomainStatusClass(domain.status)">
                    <VIcon :icon="getDomainIcon(domain.domain)" size="24" class="domain-icon" />
                    <div class="domain-score">{{ domain.score }}</div>
                    <div class="domain-name">{{ getDomainLabel(domain.domain) }}</div>
                    <VChip
                      :color="getDomainChipColor(domain.status)"
                      variant="tonal"
                      size="x-small"
                    >
                      {{ domain.status }}
                    </VChip>
                  </div>
                </VCol>
              </VRow>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <!-- AI Insights & Recommendations -->
      <VRow v-if="latestPremiumAssessment?.report" class="mb-4">
        <VCol cols="12" md="6">
          <VCard variant="outlined" class="h-100">
            <VCardText>
              <h6 class="text-subtitle-1 mb-3">
                <VIcon icon="bx-bulb" class="mr-2 text-warning" />
                Priority Actions
              </h6>
              <div v-if="latestPremiumAssessment.report.priority_actions?.length">
                <div
                  v-for="(action, index) in latestPremiumAssessment.report.priority_actions.slice(0, 4)"
                  :key="index"
                  class="priority-action-item mb-2"
                >
                  <VChip
                    :color="getPriorityColor(action.priority)"
                    variant="flat"
                    size="x-small"
                    class="mr-2"
                  >
                    {{ action.priority }}
                  </VChip>
                  <span class="text-body-2">{{ action.action }}</span>
                </div>
              </div>
              <div v-else class="text-center py-4">
                <VIcon icon="bx-check-circle" size="32" class="text-success mb-2" />
                <p class="text-body-2 text-medium-emphasis mb-0">No priority actions identified</p>
              </div>
            </VCardText>
          </VCard>
        </VCol>

        <VCol cols="12" md="6">
          <VCard variant="outlined" class="h-100">
            <VCardText>
              <h6 class="text-subtitle-1 mb-3">
                <VIcon icon="bx-heart" class="mr-2 text-error" />
                When to See a Doctor
              </h6>
              <div v-if="latestPremiumAssessment.report.when_to_see_doctor?.length">
                <div
                  v-for="(item, index) in latestPremiumAssessment.report.when_to_see_doctor.slice(0, 4)"
                  :key="index"
                  class="doctor-alert-item mb-2"
                >
                  <VIcon icon="bx-error-circle" size="16" class="text-warning mr-2" />
                  <span class="text-body-2">{{ item }}</span>
                </div>
              </div>
              <div v-else class="text-center py-4">
                <VIcon icon="bx-shield-check" size="32" class="text-success mb-2" />
                <p class="text-body-2 text-medium-emphasis mb-0">No immediate doctor visits recommended</p>
              </div>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <!-- Lifestyle Tips (if available) -->
      <VRow v-if="latestPremiumAssessment?.report?.lifestyle_tips?.length" class="mb-4">
        <VCol cols="12">
          <VCard variant="outlined">
            <VCardText>
              <h6 class="text-subtitle-1 mb-3">
                <VIcon icon="bx-run" class="mr-2 text-success" />
                Lifestyle Recommendations
              </h6>
              <VRow>
                <VCol
                  v-for="(tip, index) in latestPremiumAssessment.report.lifestyle_tips.slice(0, 6)"
                  :key="index"
                  cols="12"
                  sm="6"
                  md="4"
                >
                  <div class="lifestyle-tip d-flex align-start">
                    <VIcon icon="bx-check" size="18" class="text-success mr-2 mt-1" />
                    <span class="text-body-2">{{ tip }}</span>
                  </div>
                </VCol>
              </VRow>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <!-- Assessment History -->
      <VRow class="mb-4">
        <VCol cols="12">
          <VCard variant="outlined">
            <VCardText>
              <div class="d-flex justify-space-between align-center mb-3">
                <h6 class="text-subtitle-1 mb-0">
                  <VIcon icon="bx-history" class="mr-2" />
                  Assessment History
                </h6>
                <VSelect
                  v-model="historyFilter"
                  :items="historyFilterOptions"
                  variant="outlined"
                  density="compact"
                  hide-details
                  style="max-width: 140px;"
                />
              </div>

              <div v-if="loadingHistory" class="text-center py-4">
                <VProgressCircular indeterminate color="primary" />
              </div>

              <div v-else-if="filteredAssessmentHistory.length" class="assessment-history-list">
                <div
                  v-for="assessment in filteredAssessmentHistory"
                  :key="assessment.id"
                  class="assessment-history-item"
                  :class="{ 'premium': assessment.type === 'premium' }"
                  @click="assessment.type === 'premium' ? viewPremiumReport(assessment.id) : null"
                >
                  <div class="assessment-icon">
                    <VIcon
                      :icon="assessment.type === 'premium' ? 'bx-star' : 'bx-calculator'"
                      :color="assessment.type === 'premium' ? 'warning' : 'info'"
                    />
                  </div>
                  <div class="assessment-details flex-grow-1">
                    <div class="d-flex align-center gap-2">
                      <span class="assessment-title text-body-2 font-weight-medium">
                        {{ assessment.type === 'premium' ? 'Premium Assessment' : 'Basic Calculation' }}
                      </span>
                      <VChip
                        v-if="assessment.type === 'premium'"
                        color="warning"
                        variant="tonal"
                        size="x-small"
                      >
                        AI-Powered
                      </VChip>
                    </div>
                    <div class="assessment-meta text-caption text-medium-emphasis">
                      {{ formatDate(assessment.date) }}
                      <span v-if="assessment.credits_used" class="ml-2">
                        • {{ assessment.credits_used }} credits used
                      </span>
                    </div>
                  </div>
                  <div class="assessment-score">
                    <div class="score-badge" :class="getScoreBadgeClass(assessment.score)">
                      {{ assessment.score }}
                    </div>
                    <div class="score-status text-caption" :class="getScoreBadgeClass(assessment.score)">
                      {{ assessment.status }}
                    </div>
                  </div>
                  <VIcon
                    v-if="assessment.type === 'premium'"
                    icon="bx-chevron-right"
                    class="text-medium-emphasis"
                  />
                </div>
              </div>

              <div v-else class="text-center py-6">
                <VIcon icon="bx-clipboard" size="48" class="text-disabled mb-2" />
                <p class="text-body-2 text-medium-emphasis mb-0">No assessments found</p>
              </div>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <!-- Key Health Metrics -->
      <VRow class="mb-4">
        <VCol cols="6" md="3">
          <VCard variant="outlined" class="metric-card">
            <VCardText class="text-center pa-3">
              <VIcon icon="bx-heart" size="24" class="text-error mb-2" />
              <div class="metric-value text-h6">{{ vitals.heart_rate || vitals.pulse_rate || '--' }}</div>
              <div class="metric-label text-caption">Heart Rate</div>
              <div class="metric-unit text-caption text-medium-emphasis">bpm</div>
            </VCardText>
          </VCard>
        </VCol>

        <VCol cols="6" md="3">
          <VCard variant="outlined" class="metric-card">
            <VCardText class="text-center pa-3">
              <VIcon icon="bx-activity" size="24" class="text-info mb-2" />
              <div class="metric-value text-h6">{{ vitals.blood_pressure || '--' }}</div>
              <div class="metric-label text-caption">Blood Pressure</div>
              <div class="metric-unit text-caption text-medium-emphasis">mmHg</div>
            </VCardText>
          </VCard>
        </VCol>

        <VCol cols="6" md="3">
          <VCard variant="outlined" class="metric-card">
            <VCardText class="text-center pa-3">
              <VIcon icon="bx-body" size="24" class="text-success mb-2" />
              <div class="metric-value text-h6">{{ bmi || '--' }}</div>
              <div class="metric-label text-caption">BMI</div>
              <div class="metric-unit text-caption text-medium-emphasis">kg/m²</div>
            </VCardText>
          </VCard>
        </VCol>

        <VCol cols="6" md="3">
          <VCard variant="outlined" class="metric-card">
            <VCardText class="text-center pa-3">
              <VIcon icon="bx-thermometer" size="24" class="text-warning mb-2" />
              <div class="metric-value text-h6">{{ displayTemperature || '--' }}</div>
              <div class="metric-label text-caption">Temperature</div>
              <div class="metric-unit text-caption text-medium-emphasis">°C</div>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <!-- Risk Factors & Health Alerts -->
      <VRow class="mb-4">
        <VCol cols="12" md="6">
          <VCard variant="outlined">
            <VCardText>
              <h6 class="text-subtitle-1 mb-3">Risk Factors</h6>
              <div v-if="riskFactors.length">
                <VChip
                  v-for="risk in riskFactors"
                  :key="risk.name"
                  :color="getRiskColor(risk.level)"
                  variant="tonal"
                  size="small"
                  class="mr-2 mb-2"
                >
                  {{ risk.name }}
                </VChip>
              </div>
              <div v-else class="text-center py-4">
                <VIcon icon="bx-shield-check" size="32" class="text-success mb-2" />
                <p class="text-body-2 text-medium-emphasis mb-0">No identified risk factors</p>
              </div>
            </VCardText>
          </VCard>
        </VCol>

        <VCol cols="12" md="6">
          <VCard variant="outlined">
            <VCardText>
              <h6 class="text-subtitle-1 mb-3">Recent Health Activity</h6>
              <div v-if="recentActivity.length">
                <div
                  v-for="activity in recentActivity.slice(0, 3)"
                  :key="activity.id"
                  class="d-flex align-center mb-3"
                >
                  <VIcon
                    :icon="getActivityIcon(activity.type)"
                    size="20"
                    :class="getActivityColor(activity.type)"
                    class="mr-3"
                  />
                  <div class="flex-grow-1">
                    <p class="text-body-2 mb-0">{{ activity.title }}</p>
                    <p class="text-caption text-medium-emphasis mb-0">{{ formatDate(activity.timestamp) }}</p>
                  </div>
                </div>
              </div>
              <div v-else class="text-center py-4">
                <VIcon icon="bx-history" size="32" class="text-disabled mb-2" />
                <p class="text-body-2 text-medium-emphasis mb-0">No recent activity</p>
              </div>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <!-- Health Alerts -->
      <VRow v-if="healthAlerts.length">
        <VCol cols="12">
          <VCard variant="outlined" class="border-warning">
            <VCardText>
              <h6 class="text-subtitle-1 mb-3 text-warning">
                <VIcon icon="bx-error" class="mr-2" />
                Health Alerts
              </h6>
              <VAlert
                v-for="alert in healthAlerts"
                :key="alert.id"
                :type="alert.severity"
                variant="tonal"
                class="mb-2"
              >
                <div class="d-flex justify-space-between align-center">
                  <div>
                    <strong>{{ alert.title }}</strong>
                    <p class="mb-0 mt-1">{{ alert.description }}</p>
                  </div>
                  <VChip size="x-small" :color="alert.severity">
                    {{ alert.severity.toUpperCase() }}
                  </VChip>
                </div>
              </VAlert>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>
    </VCardText>

    <!-- Premium Report Dialog -->
    <VDialog v-model="showReportDialog" max-width="900" scrollable>
      <VCard v-if="selectedReport">
        <VCardTitle class="d-flex justify-space-between align-center pa-4 bg-warning">
          <div class="d-flex align-center gap-2 text-white">
            <VIcon icon="bx-star" />
            <span>Premium Health Report</span>
          </div>
          <VBtn icon variant="text" color="white" @click="showReportDialog = false">
            <VIcon icon="bx-x" />
          </VBtn>
        </VCardTitle>
        <VCardText class="pa-4">
          <!-- Report Header -->
          <div class="report-header mb-4">
            <div class="d-flex align-center gap-4">
              <div class="report-score-circle" :class="getPremiumScoreClass(selectedReport.report?.overall_score)">
                <span class="score-value">{{ selectedReport.report?.overall_score }}</span>
              </div>
              <div>
                <h3 class="mb-1">{{ selectedReport.report?.overall_status }}</h3>
                <p class="text-body-2 text-medium-emphasis mb-0">{{ selectedReport.report?.overall_summary }}</p>
              </div>
            </div>
          </div>

          <VDivider class="mb-4" />

          <!-- Domain Scores -->
          <h6 class="text-subtitle-1 mb-3">Domain Scores</h6>
          <VRow class="mb-4">
            <VCol
              v-for="domain in selectedReport.report?.domain_scores"
              :key="domain.domain"
              cols="6"
              md="4"
            >
              <VCard variant="outlined" class="pa-3">
                <div class="d-flex align-center gap-2 mb-2">
                  <VIcon :icon="getDomainIcon(domain.domain)" :color="getDomainChipColor(domain.status)" />
                  <span class="font-weight-medium">{{ domain.domain_label }}</span>
                </div>
                <div class="d-flex align-center justify-space-between">
                  <span class="text-h5 font-weight-bold">{{ domain.score }}</span>
                  <VChip :color="getDomainChipColor(domain.status)" size="small">{{ domain.status }}</VChip>
                </div>
                <p class="text-caption text-medium-emphasis mt-2 mb-0">{{ domain.insights }}</p>
              </VCard>
            </VCol>
          </VRow>

          <!-- Detailed Analysis -->
          <h6 class="text-subtitle-1 mb-3">Detailed Analysis</h6>
          <VCard variant="outlined" class="mb-4 pa-3">
            <p class="text-body-2 mb-0" style="white-space: pre-line;">{{ selectedReport.report?.detailed_analysis }}</p>
          </VCard>

          <!-- Priority Actions -->
          <h6 class="text-subtitle-1 mb-3">Priority Actions</h6>
          <div class="mb-4">
            <div
              v-for="(action, index) in selectedReport.report?.priority_actions"
              :key="index"
              class="d-flex align-start gap-2 mb-2"
            >
              <VChip :color="getPriorityColor(action.priority)" size="small" class="mt-1">
                {{ action.priority }}
              </VChip>
              <div>
                <p class="text-body-2 font-weight-medium mb-0">{{ action.action }}</p>
                <p class="text-caption text-medium-emphasis mb-0">{{ action.reason }}</p>
              </div>
            </div>
          </div>

          <!-- Metadata -->
          <VDivider class="mb-3" />
          <div class="d-flex gap-4 text-caption text-medium-emphasis">
            <span><strong>Date:</strong> {{ formatDate(selectedReport.created_at) }}</span>
            <span><strong>Credits Used:</strong> {{ selectedReport.credits_used }}</span>
            <span><strong>AI Model:</strong> {{ selectedReport.ai_model || 'Claude' }}</span>
          </div>
        </VCardText>
      </VCard>
    </VDialog>
  </VCard>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import moment from 'moment'
import axios from '@axios'
import {
  calculateHealthScore,
  getHealthScoreClass as getScoreClass,
  getHealthScoreDescription as getScoreDescription,
} from '@/utils/health-score-calculator'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL

const props = defineProps({
  userData: {
    type: Object,
    required: true
  }
})

// Health data
const vitals = ref({})
const healthCheckups = ref([])
const premiumAssessments = ref([])
const loadingHistory = ref(false)

// UI state
const loading = ref(true)
const historyFilter = ref('all')
const showReportDialog = ref(false)
const selectedReport = ref(null)

// Filter options
const historyFilterOptions = [
  { title: 'All', value: 'all' },
  { title: 'Premium', value: 'premium' },
  { title: 'Basic', value: 'basic' }
]

// Domain configuration
const domainConfig = {
  cardiovascular: { icon: 'bx-heart', label: 'Cardiovascular' },
  metabolic: { icon: 'bx-pulse', label: 'Metabolic' },
  mental_wellbeing: { icon: 'bx-brain', label: 'Mental' },
  lifestyle: { icon: 'bx-run', label: 'Lifestyle' },
  physical_symptoms: { icon: 'bx-body', label: 'Physical' },
  preventive_care: { icon: 'bx-shield-check', label: 'Preventive' }
}

// Computed: BMI calculation
const bmi = computed(() => {
  if (vitals.value.weight && vitals.value.height) {
    const heightInMeters = parseFloat(vitals.value.height) / 100
    const weight = parseFloat(vitals.value.weight)
    return Math.round((weight / (heightInMeters * heightInMeters)) * 10) / 10
  }

  const healthInfo = props.userData?.profile?.basic_health_info
  if (healthInfo?.height?.value && healthInfo?.weight?.value) {
    const heightInMeters = healthInfo.height.unit === 'cm'
      ? healthInfo.height.value / 100
      : healthInfo.height.value
    return Math.round((healthInfo.weight.value / (heightInMeters * heightInMeters)) * 10) / 10
  }

  return null
})

// Computed: Temperature normalization
const normalizeTemperature = (tempValue, tempUnit) => {
  if (!tempValue) return { value: null, unit: '°C' }
  const val = parseFloat(tempValue)
  const isFahrenheit = (tempUnit || '').toUpperCase().includes('F') || val > 50
  if (isFahrenheit) {
    return { value: ((val - 32) * 5 / 9).toFixed(1), unit: '°C' }
  }
  return { value: String(val), unit: '°C' }
}

const displayTemperature = computed(() => {
  return normalizeTemperature(vitals.value?.temperature, vitals.value?.temperature_unit).value
})

// Computed: Health score calculation
const healthScoreData = computed(() => {
  const normalizedTemp = normalizeTemperature(vitals.value?.temperature, vitals.value?.temperature_unit)

  const vitalsForCalc = {
    blood_pressure: vitals.value?.blood_pressure ? { value: vitals.value.blood_pressure } : null,
    pulse_rate: vitals.value?.heart_rate ? { value: vitals.value.heart_rate } : null,
    body_temp: normalizedTemp.value ? { value: normalizedTemp.value, unit: normalizedTemp.unit } : null,
    blood_sugar_level: vitals.value?.blood_sugar ? { value: vitals.value.blood_sugar } : null,
  }

  return calculateHealthScore({
    bmi: bmi.value,
    vitals: vitalsForCalc,
    healthCheckups: healthCheckups.value,
    profile: props.userData?.profile
  })
})

const healthScore = computed(() => healthScoreData.value.score)

// Computed: Latest premium assessment
const latestPremiumAssessment = computed(() => {
  if (!premiumAssessments.value.length) return null
  return premiumAssessments.value.find(a => a.status === 'completed') || premiumAssessments.value[0]
})

// Computed: Assessment history (combined)
const assessmentHistory = computed(() => {
  const history = []

  // Add premium assessments
  premiumAssessments.value.forEach(assessment => {
    history.push({
      id: assessment._id,
      type: 'premium',
      score: assessment.report?.overall_score || '--',
      status: assessment.report?.overall_status || 'Processing',
      date: assessment.created_at,
      credits_used: assessment.credits_used
    })
  })

  // Add a basic score entry (current calculation)
  if (healthScore.value) {
    history.push({
      id: 'basic-current',
      type: 'basic',
      score: healthScore.value,
      status: getHealthStatus(healthScore.value),
      date: new Date().toISOString()
    })
  }

  return history.sort((a, b) => new Date(b.date) - new Date(a.date))
})

const filteredAssessmentHistory = computed(() => {
  if (historyFilter.value === 'all') return assessmentHistory.value
  return assessmentHistory.value.filter(a => a.type === historyFilter.value)
})

// Computed: Risk factors
const riskFactors = computed(() => {
  const factors = []
  const calculatedRiskFactors = healthScoreData.value?.breakdown?.riskFactors?.factors || []
  factors.push(...calculatedRiskFactors)

  if (vitals.value.blood_pressure) {
    const [systolic] = vitals.value.blood_pressure.split('/').map(Number)
    if (systolic >= 140) factors.push({ name: 'Hypertension', level: 'high' })
    else if (systolic >= 130) factors.push({ name: 'Elevated BP', level: 'medium' })
  }

  return factors
})

// Computed: Recent activity
const recentActivity = computed(() => {
  const activities = []

  if (vitals.value && Object.keys(vitals.value).length > 0) {
    activities.push({
      id: 'vitals-recent',
      type: 'vitals',
      title: 'Vital signs recorded',
      timestamp: vitals.value.recorded_at || vitals.value.created_at || new Date()
    })
  }

  if (latestPremiumAssessment.value) {
    activities.push({
      id: 'premium-assessment',
      type: 'health_checkup',
      title: 'Premium health assessment completed',
      timestamp: latestPremiumAssessment.value.created_at
    })
  }

  if (props.userData?.updated_at) {
    activities.push({
      id: 'profile-update',
      type: 'profile',
      title: 'Profile updated',
      timestamp: props.userData.updated_at
    })
  }

  return activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
})

// Computed: Health alerts
const healthAlerts = computed(() => {
  const alerts = []

  if (vitals.value.blood_pressure) {
    const [systolic, diastolic] = vitals.value.blood_pressure.split('/').map(Number)
    if (systolic >= 180 || diastolic >= 110) {
      alerts.push({
        id: 'bp-critical',
        severity: 'error',
        title: 'Critical Blood Pressure',
        description: 'Blood pressure reading indicates hypertensive crisis. Immediate medical attention required.'
      })
    } else if (systolic >= 140 || diastolic >= 90) {
      alerts.push({
        id: 'bp-high',
        severity: 'warning',
        title: 'Elevated Blood Pressure',
        description: 'Blood pressure is consistently elevated. Consider lifestyle changes or medication.'
      })
    }
  }

  if (bmi.value) {
    const bmiNum = parseFloat(bmi.value)
    if (bmiNum >= 35) {
      alerts.push({
        id: 'bmi-severe',
        severity: 'error',
        title: 'Severe Obesity',
        description: 'BMI indicates severe obesity. High risk for health complications.'
      })
    } else if (bmiNum >= 30) {
      alerts.push({
        id: 'bmi-obese',
        severity: 'warning',
        title: 'Obesity',
        description: 'BMI indicates obesity. Consider weight management program.'
      })
    }
  }

  return alerts
})

// Methods
const fetchHealthData = async () => {
  try {
    loading.value = true
    const token = JSON.parse(localStorage.getItem('accessToken') || '{}')

    if (!token?.access_token) return

    // Fetch vitals
    const vitalsResponse = await fetch(`${apiBaseUrl}/dashboard/patient/${props.userData._id}/vitals`, {
      headers: { 'Authorization': `Bearer ${token.access_token}` }
    })

    if (vitalsResponse.ok) {
      const vitalsResult = await vitalsResponse.json()
      if (vitalsResult.statusCode === 200 && vitalsResult.data?.length > 0) {
        vitals.value = vitalsResult.data[0]
      }
    }

    // Fetch health checkups
    const checkupsResponse = await fetch(`${apiBaseUrl}/dashboard/patient/${props.userData._id}/health-checkups`, {
      headers: { 'Authorization': `Bearer ${token.access_token}` }
    })

    if (checkupsResponse.ok) {
      const checkupsResult = await checkupsResponse.json()
      if (checkupsResult.statusCode === 200 && checkupsResult.data) {
        healthCheckups.value = checkupsResult.data
      }
    }

  } catch (error) {
    console.error('Error fetching health data:', error)
  } finally {
    loading.value = false
  }
}

const fetchPremiumAssessments = async () => {
  try {
    loadingHistory.value = true
    const token = JSON.parse(localStorage.getItem('accessToken') || '{}')

    if (!token?.access_token) return

    const response = await axios.get(
      `${apiBaseUrl}/advanced-health-score/patient/${props.userData._id}/assessments?limit=20`,
      { headers: { 'Authorization': `Bearer ${token.access_token}` } }
    )

    if (response.status === 200 && response.data?.data) {
      premiumAssessments.value = response.data.data.assessments || []
    }
  } catch (error) {
    console.error('Error fetching premium assessments:', error)
  } finally {
    loadingHistory.value = false
  }
}

const viewPremiumReport = async (assessmentId) => {
  try {
    const token = JSON.parse(localStorage.getItem('accessToken') || '{}')

    const response = await axios.get(
      `${apiBaseUrl}/advanced-health-score/assessments/${assessmentId}`,
      { headers: { 'Authorization': `Bearer ${token.access_token}` } }
    )

    if (response.status === 200 && response.data?.data) {
      selectedReport.value = response.data.data
      showReportDialog.value = true
    }
  } catch (error) {
    console.error('Error fetching report:', error)
  }
}

// Helper methods
const getHealthScoreClass = () => getScoreClass(healthScore.value)
const getHealthScoreDescription = () => getScoreDescription(healthScore.value)

const getHealthStatus = (score) => {
  if (score >= 80) return 'Excellent'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Fair'
  if (score >= 20) return 'Needs Attention'
  return 'Poor'
}

const getPremiumScoreClass = (score) => {
  if (!score) return 'score-default'
  if (score >= 80) return 'score-excellent'
  if (score >= 60) return 'score-good'
  if (score >= 40) return 'score-fair'
  if (score >= 20) return 'score-attention'
  return 'score-poor'
}

const getScoreBadgeClass = (score) => {
  if (!score || score === '--') return 'score-default'
  const numScore = parseInt(score)
  if (numScore >= 80) return 'score-excellent'
  if (numScore >= 60) return 'score-good'
  if (numScore >= 40) return 'score-fair'
  if (numScore >= 20) return 'score-attention'
  return 'score-poor'
}

const getDomainStatusClass = (status) => {
  const map = {
    'Excellent': 'domain-excellent',
    'Good': 'domain-good',
    'Fair': 'domain-fair',
    'Needs Attention': 'domain-attention',
    'Poor': 'domain-poor'
  }
  return map[status] || 'domain-default'
}

const getDomainChipColor = (status) => {
  const map = {
    'Excellent': 'success',
    'Good': 'info',
    'Fair': 'warning',
    'Needs Attention': 'orange',
    'Poor': 'error'
  }
  return map[status] || 'default'
}

const getDomainIcon = (domain) => domainConfig[domain]?.icon || 'bx-chart'
const getDomainLabel = (domain) => domainConfig[domain]?.label || domain

const getPriorityColor = (priority) => {
  const map = { high: 'error', medium: 'warning', low: 'info' }
  return map[priority] || 'default'
}

const getRiskColor = (level) => {
  const map = { high: 'error', medium: 'warning', low: 'info' }
  return map[level] || 'default'
}

const getActivityIcon = (type) => {
  const map = {
    health_checkup: 'bx-health',
    vitals: 'bx-heart',
    appointment: 'bx-calendar',
    profile: 'bx-user',
    account: 'bx-user-plus',
    login: 'bx-log-in'
  }
  return map[type] || 'bx-time'
}

const getActivityColor = (type) => {
  const map = {
    health_checkup: 'text-primary',
    vitals: 'text-error',
    appointment: 'text-success',
    profile: 'text-info'
  }
  return map[type] || 'text-info'
}

const formatDate = (date) => {
  if (!date) return ''
  return moment(date).format('MMM DD, YYYY [at] h:mm A')
}

const truncateText = (text, length) => {
  if (!text) return ''
  return text.length > length ? text.substring(0, length) + '...' : text
}

// Lifecycle
onMounted(() => {
  fetchHealthData()
  fetchPremiumAssessments()
})

watch(() => props.userData, () => {
  if (props.userData?._id) {
    fetchHealthData()
    fetchPremiumAssessments()
  }
}, { deep: true })
</script>

<style scoped>
/* Score Cards */
.health-score-card {
  transition: all 0.3s ease;
}

.premium-card {
  border-color: rgba(255, 152, 0, 0.3);
  background: linear-gradient(135deg, rgba(255, 152, 0, 0.05) 0%, rgba(255, 193, 7, 0.05) 100%);
}

.premium-card.no-premium {
  background: rgba(var(--v-theme-surface), 1);
  border-color: rgba(var(--v-border-color), var(--v-border-opacity));
}

.basic-card {
  border-color: rgba(33, 150, 243, 0.3);
  background: linear-gradient(135deg, rgba(33, 150, 243, 0.05) 0%, rgba(3, 169, 244, 0.05) 100%);
}

.score-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.score-display {
  display: flex;
  align-items: center;
  gap: 16px;
}

.score-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4px solid;
  flex-shrink: 0;
}

.score-circle .score-value {
  font-size: 1.75rem;
  font-weight: 700;
}

.score-info {
  flex: 1;
}

.score-status {
  font-size: 1.1rem;
  font-weight: 600;
  display: block;
  margin-bottom: 4px;
}

/* Score classes */
.health-excellent, .score-excellent { border-color: #4CAF50; background-color: rgba(76, 175, 80, 0.1); color: #4CAF50; }
.health-good, .score-good { border-color: #2196F3; background-color: rgba(33, 150, 243, 0.1); color: #2196F3; }
.health-fair, .score-fair { border-color: #FF9800; background-color: rgba(255, 152, 0, 0.1); color: #FF9800; }
.health-poor, .score-attention { border-color: #FF5722; background-color: rgba(255, 87, 34, 0.1); color: #FF5722; }
.score-poor { border-color: #F44336; background-color: rgba(244, 67, 54, 0.1); color: #F44336; }
.score-default { border-color: #9E9E9E; background-color: rgba(158, 158, 158, 0.1); color: #9E9E9E; }

/* No premium content */
.no-premium-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 0;
  text-align: center;
}

/* Domain cards */
.domain-card {
  text-align: center;
  padding: 16px 8px;
  border-radius: 12px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  transition: all 0.2s ease;
}

.domain-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.domain-icon {
  margin-bottom: 8px;
}

.domain-score {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 4px;
}

.domain-name {
  font-size: 0.75rem;
  color: rgba(var(--v-theme-on-surface), 0.7);
  margin-bottom: 8px;
}

.domain-excellent { background: rgba(76, 175, 80, 0.1); border-color: rgba(76, 175, 80, 0.3); }
.domain-excellent .domain-icon, .domain-excellent .domain-score { color: #4CAF50; }

.domain-good { background: rgba(33, 150, 243, 0.1); border-color: rgba(33, 150, 243, 0.3); }
.domain-good .domain-icon, .domain-good .domain-score { color: #2196F3; }

.domain-fair { background: rgba(255, 152, 0, 0.1); border-color: rgba(255, 152, 0, 0.3); }
.domain-fair .domain-icon, .domain-fair .domain-score { color: #FF9800; }

.domain-attention { background: rgba(255, 87, 34, 0.1); border-color: rgba(255, 87, 34, 0.3); }
.domain-attention .domain-icon, .domain-attention .domain-score { color: #FF5722; }

.domain-poor { background: rgba(244, 67, 54, 0.1); border-color: rgba(244, 67, 54, 0.3); }
.domain-poor .domain-icon, .domain-poor .domain-score { color: #F44336; }

/* Assessment history */
.assessment-history-list {
  max-height: 300px;
  overflow-y: auto;
}

.assessment-history-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  margin-bottom: 8px;
  transition: all 0.2s ease;
}

.assessment-history-item.premium {
  cursor: pointer;
  border-color: rgba(255, 152, 0, 0.3);
}

.assessment-history-item.premium:hover {
  background: rgba(255, 152, 0, 0.05);
  border-color: rgba(255, 152, 0, 0.5);
}

.assessment-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--v-theme-surface-variant), 0.5);
}

.assessment-score {
  text-align: center;
}

.score-badge {
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1;
}

/* Priority actions */
.priority-action-item {
  display: flex;
  align-items: flex-start;
}

.doctor-alert-item {
  display: flex;
  align-items: flex-start;
}

.lifestyle-tip {
  padding: 8px 0;
}

/* Metric cards */
.metric-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.metric-value {
  font-weight: 600;
}

/* Report dialog */
.report-header {
  padding: 16px;
  background: rgba(var(--v-theme-surface-variant), 0.3);
  border-radius: 12px;
}

.report-score-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4px solid;
  flex-shrink: 0;
}

.report-score-circle .score-value {
  font-size: 1.75rem;
  font-weight: 700;
}
</style>
