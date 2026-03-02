<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRecoveryStore } from '@/stores/recovery'
import { useRouter } from 'vue-router'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

const router = useRouter()
const recoveryStore = useRecoveryStore()

const pageLoading = ref(true)
const outcomes = ref(null)
const screeningTrends = ref(null)
const exporting = ref(false)

const substanceChartCanvas = ref(null)
const trendChartCanvas = ref(null)
let substanceChart = null
let trendChart = null

const fetchData = async () => {
  pageLoading.value = true
  try {
    const [outcomeResult, trendResult] = await Promise.all([
      recoveryStore.fetchOutcomeMetrics(),
      recoveryStore.fetchScreeningTrends(),
    ])
    outcomes.value = outcomeResult && outcomeResult !== 'error' ? outcomeResult : null
    screeningTrends.value = trendResult && trendResult !== 'error' ? trendResult : null
  } finally {
    pageLoading.value = false
  }

  // Charts must init after pageLoading=false so canvas refs exist in DOM
  await nextTick()
  await initCharts()
}

const initCharts = async () => {
  await nextTick()

  // Substance breakdown chart
  if (substanceChartCanvas.value && outcomes.value?.substances?.length) {
    if (substanceChart) substanceChart.destroy()
    const ctx = substanceChartCanvas.value.getContext('2d')
    substanceChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: outcomes.value.substances.map(s => s._id || 'Unknown'),
        datasets: [{
          label: 'Patients',
          data: outcomes.value.substances.map(s => s.count),
          backgroundColor: [
            '#1976D2', '#388E3C', '#F57C00', '#D32F2F',
            '#7B1FA2', '#00796B', '#455A64', '#C2185B',
          ],
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
      },
    })
  }

  // Screening trend chart
  if (trendChartCanvas.value && screeningTrends.value?.completions_by_week?.length) {
    if (trendChart) trendChart.destroy()
    const ctx = trendChartCanvas.value.getContext('2d')
    trendChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: screeningTrends.value.completions_by_week.map(w => w._id),
        datasets: [
          {
            label: 'Completions',
            data: screeningTrends.value.completions_by_week.map(w => w.count),
            borderColor: '#1976D2',
            backgroundColor: 'rgba(25, 118, 210, 0.1)',
            fill: true,
            tension: 0.3,
          },
          {
            label: 'Avg Score',
            data: screeningTrends.value.completions_by_week.map(w => Math.round(w.avg_score || 0)),
            borderColor: '#F57C00',
            borderDash: [5, 5],
            tension: 0.3,
            yAxisID: 'y1',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top' } },
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'Completions' } },
          y1: { position: 'right', beginAtZero: true, title: { display: true, text: 'Avg Score' }, grid: { drawOnChartArea: false } },
        },
      },
    })
  }
}

const handleExport = async (format) => {
  exporting.value = true
  try {
    await recoveryStore.exportOutcomes(format)
  } finally {
    exporting.value = false
  }
}

onMounted(fetchData)
</script>

<template>
  <div>
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">Recovery Outcomes</h1>
        <p class="text-subtitle-1 text-medium-emphasis">Aggregated metrics for grant reporting and analysis</p>
      </div>
      <div class="d-flex ga-2">
        <VBtn
          variant="outlined"
          prepend-icon="mdi-download"
          :loading="exporting"
          @click="handleExport('csv')"
        >
          Export CSV
        </VBtn>
        <VBtn variant="outlined" prepend-icon="mdi-arrow-left" @click="router.push('/recovery')">
          Back
        </VBtn>
      </div>
    </div>

    <template v-if="pageLoading">
      <VRow>
        <VCol v-for="n in 4" :key="n" cols="12" md="3">
          <VSkeletonLoader type="card" />
        </VCol>
      </VRow>
    </template>

    <template v-else-if="outcomes">
      <!-- Enrolment KPIs -->
      <VRow class="mb-6">
        <VCol cols="12" sm="6" lg="3">
          <VCard class="text-center pa-4">
            <div class="text-h3 font-weight-bold text-primary">{{ outcomes.enrollment?.total || 0 }}</div>
            <div class="text-subtitle-2">Total Enrolled</div>
          </VCard>
        </VCol>
        <VCol cols="12" sm="6" lg="3">
          <VCard class="text-center pa-4">
            <div class="text-h3 font-weight-bold text-success">{{ outcomes.enrollment?.completed || 0 }}</div>
            <div class="text-subtitle-2">Completed Programme</div>
          </VCard>
        </VCol>
        <VCol cols="12" sm="6" lg="3">
          <VCard class="text-center pa-4">
            <div class="text-h3 font-weight-bold text-info">{{ outcomes.enrollment?.graduated || 0 }}</div>
            <div class="text-subtitle-2">Graduated / Discharged</div>
          </VCard>
        </VCol>
        <VCol cols="12" sm="6" lg="3">
          <VCard class="text-center pa-4">
            <div class="text-h3 font-weight-bold text-warning">{{ outcomes.enrollment?.avg_days_in_program || 0 }}</div>
            <div class="text-subtitle-2">Avg Days in Programme</div>
          </VCard>
        </VCol>
      </VRow>

      <!-- Risk Improvement + Substance Breakdown -->
      <VRow class="mb-6">
        <VCol cols="12" md="4">
          <VCard class="pa-4">
            <VCardTitle>Risk Improvement</VCardTitle>
            <VCardText class="text-center">
              <div class="text-h2 font-weight-bold text-success">
                {{ outcomes.risk_improvement?.improvement_rate || 0 }}%
              </div>
              <div class="text-subtitle-2 text-medium-emphasis mb-2">
                of tracked patients improved
              </div>
              <div class="text-caption">
                {{ outcomes.risk_improvement?.improved || 0 }} of {{ outcomes.risk_improvement?.total_tracked || 0 }} patients
              </div>
              <div
                v-if="outcomes.risk_improvement?.avg_first_score != null"
                class="text-caption text-medium-emphasis mt-2"
              >
                Avg screening: {{ outcomes.risk_improvement.avg_first_score }} → {{ outcomes.risk_improvement.avg_latest_score }}
              </div>
              <div
                v-if="outcomes.risk_improvement?.total_tracked === 0"
                class="text-caption text-medium-emphasis mt-2"
              >
                Requires 2+ screenings per patient to track
              </div>
            </VCardText>
          </VCard>
        </VCol>
        <VCol cols="12" md="8">
          <VCard>
            <VCardTitle>Substance Distribution</VCardTitle>
            <VCardText>
              <div style="height: 220px; position: relative;">
                <canvas ref="substanceChartCanvas"></canvas>
              </div>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <!-- Screening Trends -->
      <VCard class="mb-6">
        <VCardTitle>Screening Trends (90 Days)</VCardTitle>
        <VCardText>
          <div style="height: 250px; position: relative;">
            <canvas ref="trendChartCanvas"></canvas>
          </div>
        </VCardText>
      </VCard>

      <!-- Exercise Engagement + Peer Assignments -->
      <VRow class="mb-6">
        <VCol cols="12" md="6">
          <VCard>
            <VCardTitle>Coping Exercise Engagement</VCardTitle>
            <VCardText>
              <template v-if="outcomes.exercise_engagement?.length">
                <VList>
                  <VListItem
                    v-for="exercise in outcomes.exercise_engagement"
                    :key="exercise._id"
                    class="px-0"
                  >
                    <VListItemTitle>{{ exercise._id?.replace(/_/g, ' ') || 'Unknown' }}</VListItemTitle>
                    <VListItemSubtitle>
                      {{ exercise.count }} sessions |
                      Avg effectiveness: {{ exercise.avg_effectiveness ? Math.round(exercise.avg_effectiveness * 10) / 10 : '—' }}/10
                    </VListItemSubtitle>
                    <template #append>
                      <VChip size="small" color="primary">{{ exercise.count }}</VChip>
                    </template>
                  </VListItem>
                </VList>
              </template>
              <VAlert v-else type="info" variant="tonal">No exercise data yet</VAlert>
            </VCardText>
          </VCard>
        </VCol>
        <VCol cols="12" md="6">
          <VCard>
            <VCardTitle>Peer Support Assignments</VCardTitle>
            <VCardText>
              <div v-if="Object.keys(outcomes.peer_assignments || {}).length" class="d-flex flex-wrap ga-2">
                <VChip
                  v-for="(count, status) in outcomes.peer_assignments"
                  :key="status"
                  :color="status === 'active' ? 'success' : status === 'ended' ? 'secondary' : 'info'"
                  size="large"
                >
                  {{ status }}: {{ count }}
                </VChip>
              </div>
              <VAlert v-else type="info" variant="tonal">No peer assignments yet</VAlert>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <!-- Screening Score Distribution -->
      <VCard v-if="screeningTrends" class="mb-6">
        <VCardTitle>Screening Results Distribution</VCardTitle>
        <VCardText>
          <div class="d-flex flex-wrap ga-2 mb-4">
            <VChip
              v-for="(count, level) in screeningTrends.score_distribution"
              :key="level"
              :color="level === 'high' ? 'error' : level === 'moderate' ? 'warning' : level === 'low' ? 'success' : 'info'"
              size="large"
            >
              {{ level }}: {{ count }}
            </VChip>
          </div>
          <div v-if="screeningTrends.avg_score_by_type?.length">
            <h4 class="text-subtitle-1 font-weight-bold mb-2">Average Score by Type</h4>
            <VTable density="compact">
              <thead>
                <tr>
                  <th>Screening Type</th>
                  <th>Avg Score</th>
                  <th>Min</th>
                  <th>Max</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="type in screeningTrends.avg_score_by_type" :key="type._id">
                  <td>{{ type._id }}</td>
                  <td>{{ Math.round(type.avg_score * 10) / 10 }}</td>
                  <td>{{ type.min_score }}</td>
                  <td>{{ type.max_score }}</td>
                </tr>
              </tbody>
            </VTable>
          </div>
        </VCardText>
      </VCard>
    </template>
  </div>
</template>
