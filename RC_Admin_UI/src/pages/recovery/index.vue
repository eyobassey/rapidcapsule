<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRecoveryStore } from '@/stores/recovery'
import { useRouter } from 'vue-router'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

const router = useRouter()
const recoveryStore = useRecoveryStore()

const pageLoading = ref(true)
const metrics = ref(null)
const riskOverview = ref(null)
const activeCrises = ref([])
const recentMilestones = ref([])

const riskChartCanvas = ref(null)
let riskChartInstance = null

const statusColors = {
  active: 'success',
  paused: 'warning',
  completed: 'info',
  discharged: 'primary',
  withdrawn: 'error',
  archived: 'secondary',
}

const riskColors = {
  low: 'success',
  moderate: 'warning',
  high: 'error',
  critical: 'deep-purple',
}

const severityColors = {
  low: 'info',
  medium: 'warning',
  high: 'error',
  life_threatening: 'deep-purple',
}

const crisisStatusColors = {
  active: 'error',
  responding: 'warning',
  escalated_external: 'deep-purple',
  resolved: 'success',
  stabilized: 'info',
}

const formatDate = (date) => {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const formatTimeAgo = (date) => {
  if (!date) return '—'
  const ms = Date.now() - new Date(date).getTime()
  const mins = Math.floor(ms / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

const getPatientName = (user) => {
  if (!user?.profile) return 'Unknown'
  return `${user.profile.first_name || ''} ${user.profile.last_name || ''}`.trim() || 'Unknown'
}

const initRiskChart = async () => {
  await nextTick()
  if (!riskChartCanvas.value || !riskOverview.value) return

  if (riskChartInstance) {
    riskChartInstance.destroy()
    riskChartInstance = null
  }

  const dist = riskOverview.value.risk_distribution || {}
  const ctx = riskChartCanvas.value.getContext('2d')

  riskChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Low', 'Moderate', 'High', 'Critical'],
      datasets: [
        {
          data: [dist.low || 0, dist.moderate || 0, dist.high || 0, dist.critical || 0],
          backgroundColor: ['#4CAF50', '#FF9800', '#F44336', '#7B1FA2'],
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' },
      },
    },
  })
}

const fetchData = async () => {
  pageLoading.value = true
  try {
    const [metricsResult, riskResult, crisisResult, milestoneResult] = await Promise.all([
      recoveryStore.fetchMetrics(),
      recoveryStore.fetchRiskOverview(),
      recoveryStore.fetchActiveCrises(),
      recoveryStore.fetchRecentMilestones(10),
    ])

    metrics.value = metricsResult && metricsResult !== 'error' ? metricsResult : null
    riskOverview.value = riskResult && riskResult !== 'error' ? riskResult : null
    activeCrises.value = crisisResult && crisisResult !== 'error' ? (Array.isArray(crisisResult) ? crisisResult : []) : []
    recentMilestones.value = milestoneResult && milestoneResult !== 'error' ? (Array.isArray(milestoneResult) ? milestoneResult : []) : []
  } finally {
    pageLoading.value = false
  }

  // Chart must init after pageLoading=false so canvas refs exist in DOM
  await nextTick()
  await initRiskChart()
}

onMounted(fetchData)
</script>

<template>
  <div>
    <!-- Header -->
    <VCard class="mb-6" color="primary" variant="tonal">
      <VCardText class="d-flex align-center">
        <div class="flex-grow-1">
          <h2 class="text-h4 font-weight-bold mb-2">Recovery Programme</h2>
          <p class="text-subtitle-1 mb-0">
            Addiction recovery management, risk monitoring, and crisis intervention
          </p>
        </div>
        <VIcon size="60" class="text-primary">mdi-heart-pulse</VIcon>
      </VCardText>
    </VCard>

    <!-- Loading -->
    <template v-if="pageLoading">
      <VRow>
        <VCol v-for="n in 4" :key="n" cols="12" md="3">
          <VSkeletonLoader type="card" />
        </VCol>
      </VRow>
    </template>

    <template v-else-if="metrics">
      <!-- KPI Cards -->
      <VRow class="mb-6">
        <VCol cols="12" sm="6" lg="3">
          <VCard class="text-center pa-4">
            <VIcon size="40" color="primary" class="mb-2">mdi-account-group</VIcon>
            <div class="text-h3 font-weight-bold">{{ metrics.total_enrolled }}</div>
            <div class="text-subtitle-2 text-medium-emphasis">Total Enrolled</div>
            <VChip v-if="metrics.recent_enrollments_30d" size="small" color="success" class="mt-2">
              +{{ metrics.recent_enrollments_30d }} this month
            </VChip>
          </VCard>
        </VCol>
        <VCol cols="12" sm="6" lg="3">
          <VCard class="text-center pa-4">
            <VIcon size="40" color="success" class="mb-2">mdi-check-circle</VIcon>
            <div class="text-h3 font-weight-bold">{{ metrics.active }}</div>
            <div class="text-subtitle-2 text-medium-emphasis">Active Patients</div>
            <VChip size="small" color="info" class="mt-2">
              {{ metrics.avg_sobriety_days }}d avg sobriety
            </VChip>
          </VCard>
        </VCol>
        <VCol cols="12" sm="6" lg="3">
          <VCard class="text-center pa-4">
            <VIcon size="40" color="error" class="mb-2">mdi-alert-circle</VIcon>
            <div class="text-h3 font-weight-bold">{{ metrics.active_crises }}</div>
            <div class="text-subtitle-2 text-medium-emphasis">Active Crises</div>
            <VBtn
              v-if="metrics.active_crises > 0"
              size="small"
              color="error"
              variant="text"
              class="mt-1"
              @click="router.push('/recovery/crisis')"
            >
              View All
            </VBtn>
          </VCard>
        </VCol>
        <VCol cols="12" sm="6" lg="3">
          <VCard class="text-center pa-4">
            <VIcon size="40" color="warning" class="mb-2">mdi-trophy</VIcon>
            <div class="text-h3 font-weight-bold">{{ metrics.total_milestones_achieved }}</div>
            <div class="text-subtitle-2 text-medium-emphasis">Milestones Achieved</div>
            <VChip size="small" color="primary" class="mt-2">
              {{ metrics.total_screenings_completed }} screenings
            </VChip>
          </VCard>
        </VCol>
      </VRow>

      <!-- Status Breakdown + Risk Distribution -->
      <VRow class="mb-6">
        <VCol cols="12" md="6">
          <VCard>
            <VCardTitle>Enrolment Status</VCardTitle>
            <VCardText>
              <div class="d-flex flex-wrap ga-2">
                <VChip
                  v-for="(count, status) in metrics.status_breakdown"
                  :key="status"
                  :color="statusColors[status] || 'secondary'"
                  size="large"
                >
                  {{ status }}: {{ count }}
                </VChip>
              </div>
              <div class="mt-4 text-subtitle-2 text-medium-emphasis">
                Total relapses recorded: {{ metrics.total_relapses }}
              </div>
            </VCardText>
          </VCard>
        </VCol>
        <VCol cols="12" md="6">
          <VCard>
            <VCardTitle>Risk Level Distribution</VCardTitle>
            <VCardText>
              <div style="height: 200px; position: relative;">
                <canvas ref="riskChartCanvas"></canvas>
              </div>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <!-- Active Crises + Recent Milestones -->
      <VRow class="mb-6">
        <VCol cols="12" md="6">
          <VCard>
            <VCardTitle class="d-flex align-center">
              <VIcon color="error" class="me-2">mdi-alert</VIcon>
              Active Crises
              <VSpacer />
              <VBtn
                size="small"
                variant="text"
                color="primary"
                @click="router.push('/recovery/crisis')"
              >
                View All
              </VBtn>
            </VCardTitle>
            <VCardText>
              <template v-if="activeCrises.length === 0">
                <VAlert type="success" variant="tonal" class="mb-0">
                  No active crisis events
                </VAlert>
              </template>
              <VList v-else>
                <VListItem
                  v-for="crisis in activeCrises.slice(0, 5)"
                  :key="crisis._id"
                  class="px-0"
                >
                  <template #prepend>
                    <VAvatar :color="crisisStatusColors[crisis.status] || 'error'" size="36">
                      <VIcon size="20" color="white">mdi-alert-circle</VIcon>
                    </VAvatar>
                  </template>
                  <VListItemTitle>
                    {{ getPatientName(crisis.user) }}
                    <VChip :color="severityColors[crisis.severity]" size="x-small" class="ms-2">
                      {{ crisis.severity?.replace('_', ' ') }}
                    </VChip>
                  </VListItemTitle>
                  <VListItemSubtitle>
                    {{ crisis.crisis_type?.replace(/_/g, ' ') }} — {{ formatTimeAgo(crisis.created_at) }}
                  </VListItemSubtitle>
                  <template #append>
                    <VChip :color="crisisStatusColors[crisis.status]" size="small">
                      {{ crisis.status }}
                    </VChip>
                  </template>
                </VListItem>
              </VList>
            </VCardText>
          </VCard>
        </VCol>
        <VCol cols="12" md="6">
          <VCard>
            <VCardTitle class="d-flex align-center">
              <VIcon color="warning" class="me-2">mdi-trophy</VIcon>
              Recent Milestones
            </VCardTitle>
            <VCardText>
              <template v-if="recentMilestones.length === 0">
                <VAlert type="info" variant="tonal" class="mb-0">
                  No milestones achieved yet
                </VAlert>
              </template>
              <VList v-else>
                <VListItem
                  v-for="milestone in recentMilestones.slice(0, 5)"
                  :key="milestone._id"
                  class="px-0"
                >
                  <template #prepend>
                    <VAvatar color="warning" size="36">
                      <VIcon size="20" color="white">mdi-star</VIcon>
                    </VAvatar>
                  </template>
                  <VListItemTitle>{{ milestone.title || milestone.milestone_type }}</VListItemTitle>
                  <VListItemSubtitle>
                    {{ getPatientName(milestone.user) }} — {{ formatDate(milestone.achieved_at) }}
                  </VListItemSubtitle>
                </VListItem>
              </VList>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <!-- Quick Links -->
      <VRow>
        <VCol cols="12" sm="6" md="3">
          <VCard
            class="text-center pa-4 cursor-pointer"
            hover
            @click="router.push('/recovery/cohort')"
          >
            <VIcon size="32" color="primary" class="mb-2">mdi-account-search</VIcon>
            <div class="text-subtitle-1 font-weight-bold">Patient Cohort</div>
            <div class="text-caption text-medium-emphasis">Browse & filter patients</div>
          </VCard>
        </VCol>
        <VCol cols="12" sm="6" md="3">
          <VCard
            class="text-center pa-4 cursor-pointer"
            hover
            @click="router.push('/recovery/mat')"
          >
            <VIcon size="32" color="info" class="mb-2">mdi-pill</VIcon>
            <div class="text-subtitle-1 font-weight-bold">MAT Compliance</div>
            <div class="text-caption text-medium-emphasis">Medication adherence</div>
          </VCard>
        </VCol>
        <VCol cols="12" sm="6" md="3">
          <VCard
            class="text-center pa-4 cursor-pointer"
            hover
            @click="router.push('/recovery/crisis')"
          >
            <VIcon size="32" color="error" class="mb-2">mdi-alert-octagon</VIcon>
            <div class="text-subtitle-1 font-weight-bold">Crisis Events</div>
            <div class="text-caption text-medium-emphasis">Monitor & manage</div>
          </VCard>
        </VCol>
        <VCol cols="12" sm="6" md="3">
          <VCard
            class="text-center pa-4 cursor-pointer"
            hover
            @click="router.push('/recovery/outcomes')"
          >
            <VIcon size="32" color="success" class="mb-2">mdi-chart-bar</VIcon>
            <div class="text-subtitle-1 font-weight-bold">Outcomes</div>
            <div class="text-caption text-medium-emphasis">Reporting & export</div>
          </VCard>
        </VCol>
      </VRow>
    </template>
  </div>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>
