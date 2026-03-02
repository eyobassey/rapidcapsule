<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRecoveryStore } from '@/stores/recovery'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

const route = useRoute()
const router = useRouter()
const recoveryStore = useRecoveryStore()

const patientId = computed(() => route.params.id)
const pageLoading = ref(true)
const profile = ref(null)
const selectedTab = ref(0)

// Tab data
const riskHistory = ref([])
const sobrietyTimeline = ref([])
const treatmentProgress = ref(null)
const screenings = ref([])
const crises = ref([])
const reportData = ref(null)
const reportLoading = ref(false)

// Charts
const riskChartCanvas = ref(null)
let riskChartInstance = null

// Status
const statusDialog = ref(false)
const newStatus = ref('')
const statusReason = ref('')
const statusUpdating = ref(false)

// Report filters
const reportActivityFilter = ref('all')
const reportSpecialistFilter = ref('all')

const riskColors = { low: 'success', mild: 'lime', moderate: 'warning', moderately_severe: 'deep-orange', high: 'error', severe: 'error', critical: 'deep-purple' }
const statusColors = { active: 'success', paused: 'warning', completed: 'info', discharged: 'primary', withdrawn: 'error', archived: 'secondary' }
const severityColors = { low: 'info', medium: 'warning', high: 'error', life_threatening: 'deep-purple' }
const crisisStatusColors = { active: 'error', responding: 'warning', escalated_external: 'deep-purple', resolved: 'success', stabilized: 'info' }
const activityIcons = {
  check_in: 'mdi-calendar-check',
  screening: 'mdi-file-document',
  exercise: 'mdi-meditation',
  milestone: 'mdi-trophy',
  companion_session: 'mdi-robot',
  appointment: 'mdi-calendar-clock',
  crisis_response: 'mdi-alert',
  risk_assessment: 'mdi-chart-line',
}
const activityColors = {
  check_in: 'success',
  screening: 'info',
  exercise: 'purple',
  milestone: 'warning',
  companion_session: 'teal',
  appointment: 'primary',
  crisis_response: 'error',
  risk_assessment: 'orange',
}

const statusOptions = ['active', 'paused', 'completed', 'discharged', 'withdrawn', 'archived']

const screeningMaxScore = (instrument) => {
  const scores = { audit: 40, dast10: 10, cage: 4, assist: 39, cows: 48, ciwa_ar: 67 }
  return scores[instrument] || null
}

const getPatientName = (user) => {
  if (!user?.profile) return 'Unknown'
  return `${user.profile.first_name || ''} ${user.profile.last_name || ''}`.trim() || 'Unknown'
}

const formatDate = (date) => {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

const formatDateTime = (date) => {
  if (!date) return '—'
  return new Date(date).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const tabs = [
  { title: 'Overview', icon: 'mdi-view-dashboard' },
  { title: 'Risk History', icon: 'mdi-chart-line' },
  { title: 'Sobriety', icon: 'mdi-calendar-check' },
  { title: 'Treatment', icon: 'mdi-clipboard-text' },
  { title: 'Screenings', icon: 'mdi-file-document' },
  { title: 'Crises', icon: 'mdi-alert' },
  { title: 'Reports', icon: 'mdi-file-chart' },
]

const fetchProfile = async () => {
  pageLoading.value = true
  try {
    const result = await recoveryStore.fetchPatientProfile(patientId.value)
    if (result && result !== 'error') profile.value = result
  } finally {
    pageLoading.value = false
  }
}

const fetchTabData = async (tabIndex) => {
  switch (tabIndex) {
    case 1: {
      const result = await recoveryStore.fetchPatientRiskHistory(patientId.value)
      if (result && result !== 'error') {
        riskHistory.value = result.data || []
        await initRiskChart()
      }
      break
    }
    case 2: {
      const result = await recoveryStore.fetchPatientSobrietyTimeline(patientId.value)
      if (result && result !== 'error') sobrietyTimeline.value = result?.data || []
      break
    }
    case 3: {
      const result = await recoveryStore.fetchPatientTreatmentProgress(patientId.value)
      if (result && result !== 'error') treatmentProgress.value = result
      break
    }
    case 4: {
      const result = await recoveryStore.fetchPatientScreenings(patientId.value)
      if (result && result !== 'error') screenings.value = result?.data || []
      break
    }
    case 5: {
      const result = await recoveryStore.fetchPatientCrises(patientId.value)
      if (result && result !== 'error') crises.value = result?.data || []
      break
    }
    case 6: {
      if (!reportData.value) {
        reportLoading.value = true
        const result = await recoveryStore.fetchPatientReport(patientId.value)
        if (result && result !== 'error') reportData.value = result
        reportLoading.value = false
      }
      break
    }
  }
}

const initRiskChart = async () => {
  await nextTick()
  if (!riskChartCanvas.value || riskHistory.value.length === 0) return
  if (riskChartInstance) riskChartInstance.destroy()

  const sorted = [...riskHistory.value].reverse().slice(-30)
  const ctx = riskChartCanvas.value.getContext('2d')
  riskChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: sorted.map(r => new Date(r.calculated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })),
      datasets: [{
        label: 'Risk Score',
        data: sorted.map(r => r.score),
        borderColor: '#F44336',
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
        fill: true,
        tension: 0.3,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { beginAtZero: true, max: 100, title: { display: true, text: 'Score' } } },
      plugins: { legend: { display: false } },
    },
  })
}

const openStatusDialog = () => {
  newStatus.value = profile.value?.status || 'active'
  statusReason.value = ''
  statusDialog.value = true
}

const submitStatusUpdate = async () => {
  if (!newStatus.value) return
  statusUpdating.value = true
  try {
    const result = await recoveryStore.updatePatientStatus(
      patientId.value,
      newStatus.value,
      statusReason.value,
    )
    if (result !== 'error') {
      statusDialog.value = false
      await fetchProfile()
    }
  } finally {
    statusUpdating.value = false
  }
}

// Filtered activities for Reports tab
const filteredPatientActivities = computed(() => {
  if (!reportData.value?.patient_activities) return []
  if (reportActivityFilter.value === 'all') return reportData.value.patient_activities
  return reportData.value.patient_activities.filter(a => a.type === reportActivityFilter.value)
})

const filteredSpecialistActivities = computed(() => {
  if (!reportData.value?.specialist_activities) return []
  if (reportSpecialistFilter.value === 'all') return reportData.value.specialist_activities
  return reportData.value.specialist_activities.filter(a => a.type === reportSpecialistFilter.value)
})

// PDF download
const downloadPDF = () => {
  if (!reportData.value) return
  const r = reportData.value
  const p = r.profile
  const s = r.summary

  let html = `
    <html><head><style>
      body { font-family: Arial, sans-serif; padding: 30px; color: #333; font-size: 12px; }
      h1 { color: #1976D2; border-bottom: 2px solid #1976D2; padding-bottom: 8px; }
      h2 { color: #333; margin-top: 24px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
      h3 { color: #555; margin-top: 16px; }
      .kpi-row { display: flex; flex-wrap: wrap; gap: 12px; margin: 12px 0; }
      .kpi { background: #f5f5f5; padding: 12px 16px; border-radius: 8px; text-align: center; min-width: 120px; }
      .kpi .value { font-size: 24px; font-weight: bold; color: #1976D2; }
      .kpi .label { font-size: 11px; color: #666; margin-top: 4px; }
      table { width: 100%; border-collapse: collapse; margin: 8px 0; }
      th, td { padding: 6px 8px; border: 1px solid #ddd; text-align: left; font-size: 11px; }
      th { background: #f5f5f5; font-weight: bold; }
      .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 10px; color: white; }
      .badge-success { background: #4CAF50; }
      .badge-warning { background: #FF9800; }
      .badge-error { background: #F44336; }
      .badge-info { background: #2196F3; }
      .footer { margin-top: 40px; border-top: 1px solid #ddd; padding-top: 8px; font-size: 10px; color: #999; }
      .stage-card { border: 1px solid #ddd; border-radius: 8px; padding: 12px; margin: 8px 0; }
      .goal-row { padding: 4px 0; border-bottom: 1px solid #eee; }
      @media print { body { padding: 10px; } }
    </style></head><body>
    <h1>Recovery Activity Report</h1>
    <p><strong>${p.name}</strong> | ${p.email} | Status: ${p.status} | Care Level: ${p.care_level || '—'}</p>
    <p>Risk: ${p.risk_level} (${p.risk_score}/100) | Enrolled: ${formatDate(p.enrolled_at)} | Sobriety Start: ${formatDate(p.sobriety_start_date)}</p>
    <p><em>Generated: ${formatDateTime(r.generated_at)}</em></p>

    <h2>Summary</h2>
    <div class="kpi-row">
      <div class="kpi"><div class="value">${s.total_check_ins}</div><div class="label">Check-ins</div></div>
      <div class="kpi"><div class="value">${s.sober_days}/${s.total_check_ins}</div><div class="label">Sober Days (${s.sobriety_rate}%)</div></div>
      <div class="kpi"><div class="value">${s.total_screenings}</div><div class="label">Screenings</div></div>
      <div class="kpi"><div class="value">${s.completed_exercises}/${s.total_exercises}</div><div class="label">Exercises Done</div></div>
      <div class="kpi"><div class="value">${s.total_milestones}</div><div class="label">Milestones</div></div>
      <div class="kpi"><div class="value">${s.total_crises}</div><div class="label">Crises</div></div>
      <div class="kpi"><div class="value">${s.total_appointments}</div><div class="label">Appointments</div></div>
      <div class="kpi"><div class="value">${s.total_companion_sessions}</div><div class="label">Eka Sessions</div></div>
      <div class="kpi"><div class="value">${s.avg_mood ?? '—'}</div><div class="label">Avg Mood</div></div>
      <div class="kpi"><div class="value">${s.avg_craving ?? '—'}</div><div class="label">Avg Craving</div></div>
    </div>`

  // Recovery Plans
  if (r.plans?.length) {
    html += '<h2>Recovery Plans</h2>'
    r.plans.forEach(plan => {
      html += `<h3>${plan.plan_name} (${plan.status})</h3>`
      plan.stages?.forEach(stage => {
        const completed = stage.goals.filter(g => g.status === 'completed').length
        html += `<div class="stage-card"><strong>${stage.name}</strong> — ${stage.status} (${completed}/${stage.goals.length} goals)`
        stage.goals.forEach(g => {
          const badge = g.status === 'completed' ? 'badge-success' : g.status === 'in_progress' ? 'badge-warning' : 'badge-info'
          html += `<div class="goal-row">${g.description} <span class="badge ${badge}">${g.status}</span>${g.achieved_at ? ` (${formatDate(g.achieved_at)})` : ''}</div>`
        })
        html += '</div>'
      })
    })
  }

  // Patient Activities
  html += '<h2>Patient Activities</h2>'
  html += '<table><thead><tr><th>Date</th><th>Type</th><th>Activity</th><th>Detail</th></tr></thead><tbody>'
  r.patient_activities.slice(0, 100).forEach(a => {
    html += `<tr><td>${formatDateTime(a.date)}</td><td>${a.type.replace(/_/g, ' ')}</td><td>${a.label}</td><td>${a.detail}</td></tr>`
  })
  html += '</tbody></table>'

  // Specialist Activities
  html += '<h2>Specialist & System Activities</h2>'
  html += '<table><thead><tr><th>Date</th><th>Type</th><th>Activity</th><th>Detail</th></tr></thead><tbody>'
  r.specialist_activities.slice(0, 100).forEach(a => {
    html += `<tr><td>${formatDateTime(a.date)}</td><td>${a.type.replace(/_/g, ' ')}</td><td>${a.label}</td><td>${a.detail}</td></tr>`
  })
  html += '</tbody></table>'

  html += `<div class="footer">RapidCapsule Recovery Report | ${p.name} | ${formatDateTime(r.generated_at)}</div></body></html>`

  const blob = new Blob([html], { type: 'text/html' })
  const printWindow = window.open('', '_blank')
  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.onload = () => {
    printWindow.print()
  }
}

// Goal status helpers
const goalStatusColor = (status) => {
  switch (status) {
    case 'completed': return 'success'
    case 'in_progress': return 'warning'
    default: return 'secondary'
  }
}

const goalStatusIcon = (status) => {
  switch (status) {
    case 'completed': return 'mdi-check-circle'
    case 'in_progress': return 'mdi-progress-clock'
    default: return 'mdi-circle-outline'
  }
}

const stageStatusColor = (status) => {
  switch (status) {
    case 'completed': return 'success'
    case 'in_progress': return 'primary'
    default: return 'secondary'
  }
}

watch(selectedTab, (newTab) => fetchTabData(newTab))

onMounted(fetchProfile)
</script>

<template>
  <div>
    <!-- Back Button -->
    <VBtn variant="text" prepend-icon="mdi-arrow-left" class="mb-4" @click="router.push('/recovery/cohort')">
      Back to Cohort
    </VBtn>

    <!-- Loading -->
    <template v-if="pageLoading">
      <VSkeletonLoader type="card" class="mb-4" />
      <VSkeletonLoader type="card" />
    </template>

    <!-- No Profile -->
    <template v-else-if="!profile">
      <VAlert type="warning" variant="tonal">
        No recovery profile found for this patient.
      </VAlert>
    </template>

    <template v-else>
      <!-- Profile Header -->
      <VCard class="mb-6">
        <VCardText class="d-flex align-center flex-wrap ga-4">
          <VAvatar size="64" color="primary">
            <span class="text-h5 text-white">{{ getPatientName(profile.user)?.charAt(0) }}</span>
          </VAvatar>
          <div class="flex-grow-1">
            <h2 class="text-h5 font-weight-bold">{{ getPatientName(profile.user) }}</h2>
            <p class="text-subtitle-2 text-medium-emphasis mb-1">{{ profile.user?.email || '' }}</p>
            <div class="d-flex flex-wrap ga-2">
              <VChip :color="statusColors[profile.status]" size="small">{{ profile.status }}</VChip>
              <VChip :color="riskColors[profile.current_risk_level]" size="small">
                Risk: {{ profile.current_risk_level }} ({{ profile.current_risk_score }}/100)
              </VChip>
              <VChip v-if="profile.care_level" color="info" size="small">{{ profile.care_level }}</VChip>
            </div>
          </div>
          <div class="text-center">
            <div class="text-h3 font-weight-bold text-success">{{ profile.current_sobriety_days || 0 }}</div>
            <div class="text-caption text-medium-emphasis">Days Sober</div>
          </div>
          <VBtn color="primary" variant="outlined" size="small" @click="openStatusDialog">
            Change Status
          </VBtn>
        </VCardText>
      </VCard>

      <!-- Quick Stats -->
      <VRow class="mb-6">
        <VCol cols="6" sm="4" md="2">
          <VCard class="text-center pa-3">
            <div class="text-h5 font-weight-bold">{{ profile.counts?.screenings || 0 }}</div>
            <div class="text-caption">Screenings</div>
          </VCard>
        </VCol>
        <VCol cols="6" sm="4" md="2">
          <VCard class="text-center pa-3">
            <div class="text-h5 font-weight-bold">{{ profile.counts?.milestones || 0 }}</div>
            <div class="text-caption">Milestones</div>
          </VCard>
        </VCol>
        <VCol cols="6" sm="4" md="2">
          <VCard class="text-center pa-3">
            <div class="text-h5 font-weight-bold">{{ profile.counts?.crises || 0 }}</div>
            <div class="text-caption">Crises</div>
          </VCard>
        </VCol>
        <VCol cols="6" sm="4" md="2">
          <VCard class="text-center pa-3">
            <div class="text-h5 font-weight-bold">{{ profile.counts?.check_ins || 0 }}</div>
            <div class="text-caption">Check-ins</div>
          </VCard>
        </VCol>
        <VCol cols="6" sm="4" md="2">
          <VCard class="text-center pa-3">
            <div class="text-h5 font-weight-bold">{{ profile.counts?.exercises_completed || 0 }}</div>
            <div class="text-caption">Exercises</div>
          </VCard>
        </VCol>
        <VCol cols="6" sm="4" md="2">
          <VCard class="text-center pa-3">
            <div class="text-h5 font-weight-bold">{{ profile.total_relapse_count || 0 }}</div>
            <div class="text-caption">Relapses</div>
          </VCard>
        </VCol>
      </VRow>

      <!-- Tabs -->
      <VCard>
        <VTabs v-model="selectedTab" show-arrows>
          <VTab v-for="(tab, i) in tabs" :key="i" :value="i">
            <VIcon size="18" class="me-1">{{ tab.icon }}</VIcon>
            {{ tab.title }}
          </VTab>
        </VTabs>

        <VWindow v-model="selectedTab" class="pa-4">
          <!-- Tab 0: Overview -->
          <VWindowItem :value="0" eager>
            <VRow>
              <VCol cols="12" md="6">
                <h4 class="text-subtitle-1 font-weight-bold mb-3">Substance Use History</h4>
                <VList v-if="profile.substance_use_history?.length">
                  <VListItem v-for="(sub, i) in profile.substance_use_history" :key="i" class="px-0">
                    <VListItemTitle>
                      {{ sub.substance }}
                      <VChip v-if="sub.is_primary" size="x-small" color="primary" class="ms-1">Primary</VChip>
                    </VListItemTitle>
                    <VListItemSubtitle>
                      {{ sub.years_of_use ? `${sub.years_of_use} years` : '' }}
                      {{ sub.last_use_date ? `| Last use: ${formatDate(sub.last_use_date)}` : '' }}
                    </VListItemSubtitle>
                  </VListItem>
                </VList>
                <div v-else class="text-medium-emphasis">No substance history recorded</div>
              </VCol>
              <VCol cols="12" md="6">
                <h4 class="text-subtitle-1 font-weight-bold mb-3">Care Team</h4>
                <VList v-if="profile.care_team?.length">
                  <VListItem v-for="(member, i) in profile.care_team" :key="i" class="px-0">
                    <template #prepend>
                      <VAvatar size="32" :color="member.is_active ? 'success' : 'grey'">
                        <VIcon size="18" color="white">mdi-doctor</VIcon>
                      </VAvatar>
                    </template>
                    <VListItemTitle>{{ getPatientName(member.user) || member.user }}</VListItemTitle>
                    <VListItemSubtitle>{{ member.role?.replace(/_/g, ' ') }}</VListItemSubtitle>
                    <template #append>
                      <VChip :color="member.is_active ? 'success' : 'secondary'" size="x-small">
                        {{ member.is_active ? 'Active' : 'Inactive' }}
                      </VChip>
                    </template>
                  </VListItem>
                </VList>
                <div v-else class="text-medium-emphasis">No care team assigned</div>
              </VCol>
            </VRow>

            <VDivider class="my-4" />

            <VRow>
              <VCol cols="12" md="6">
                <h4 class="text-subtitle-1 font-weight-bold mb-3">Consent</h4>
                <div v-if="profile.consent" class="d-flex flex-wrap ga-2">
                  <VChip
                    v-for="(consent, key) in profile.consent"
                    :key="key"
                    :color="consent?.given ? 'success' : 'error'"
                    size="small"
                  >
                    {{ key.replace(/_/g, ' ').replace(' consent', '') }}:
                    {{ consent?.given ? 'Yes' : 'No' }}
                  </VChip>
                </div>
              </VCol>
              <VCol cols="12" md="6">
                <h4 class="text-subtitle-1 font-weight-bold mb-3">Programme Outcomes</h4>
                <div v-if="profile.outcomes">
                  <p>Appointments attended: {{ profile.outcomes.appointments_attended || 0 }}</p>
                  <p>Appointments missed: {{ profile.outcomes.appointments_missed || 0 }}</p>
                  <p>Journal entries: {{ profile.outcomes.journal_entries_count || 0 }}</p>
                  <p>Companion sessions: {{ profile.outcomes.companion_sessions_count || 0 }}</p>
                </div>
              </VCol>
            </VRow>
          </VWindowItem>

          <!-- Tab 1: Risk History -->
          <VWindowItem :value="1">
            <div v-if="riskHistory.length" style="height: 250px; position: relative;">
              <canvas ref="riskChartCanvas"></canvas>
            </div>
            <VAlert v-else type="info" variant="tonal" class="mb-4">No risk history data</VAlert>

            <VTable v-if="riskHistory.length" class="mt-4" density="compact">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Score</th>
                  <th>Level</th>
                  <th>Direction</th>
                  <th>Trigger</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="entry in riskHistory.slice(0, 20)" :key="entry._id">
                  <td>{{ formatDate(entry.calculated_at) }}</td>
                  <td>{{ entry.score }}/100</td>
                  <td><VChip :color="riskColors[entry.level]" size="x-small">{{ entry.level }}</VChip></td>
                  <td>
                    <VIcon v-if="entry.direction === 'up' || entry.direction === 'increasing'" color="error" size="18">mdi-arrow-up</VIcon>
                    <VIcon v-else-if="entry.direction === 'down' || entry.direction === 'decreasing'" color="success" size="18">mdi-arrow-down</VIcon>
                    <VIcon v-else color="grey" size="18">mdi-minus</VIcon>
                  </td>
                  <td>{{ entry.trigger_event || '—' }}</td>
                </tr>
              </tbody>
            </VTable>
          </VWindowItem>

          <!-- Tab 2: Sobriety -->
          <VWindowItem :value="2">
            <VAlert v-if="sobrietyTimeline.length === 0" type="info" variant="tonal">No sobriety logs</VAlert>
            <VTable v-else density="compact">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Sober</th>
                  <th>Relapse</th>
                  <th>Craving</th>
                  <th>Mood</th>
                  <th>Triggers</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="log in sobrietyTimeline" :key="log._id" :class="log.is_relapse ? 'bg-error-lighten-5' : ''">
                  <td>{{ formatDate(log.date) }}</td>
                  <td>
                    <VIcon :color="log.maintained_sobriety ? 'success' : 'error'" size="18">
                      {{ log.maintained_sobriety ? 'mdi-check-circle' : 'mdi-close-circle' }}
                    </VIcon>
                  </td>
                  <td>
                    <VChip v-if="log.is_relapse" color="error" size="x-small">Relapse</VChip>
                    <span v-else>—</span>
                  </td>
                  <td>{{ log.craving_level ?? '—' }}/10</td>
                  <td>{{ log.mood_score ?? '—' }}/10</td>
                  <td>
                    <VChip v-for="t in (log.triggers_encountered || []).slice(0, 2)" :key="t" size="x-small" class="me-1">{{ t }}</VChip>
                  </td>
                </tr>
              </tbody>
            </VTable>
          </VWindowItem>

          <!-- Tab 3: Treatment (Enhanced with Goals) -->
          <VWindowItem :value="3">
            <template v-if="treatmentProgress">
              <!-- 30-day engagement -->
              <h4 class="text-subtitle-1 font-weight-bold mb-3">30-Day Engagement</h4>
              <VRow class="mb-4">
                <VCol cols="6" md="3">
                  <VCard variant="tonal" class="text-center pa-3">
                    <div class="text-h5 font-weight-bold">{{ treatmentProgress.engagement_30d?.check_ins || 0 }}</div>
                    <div class="text-caption">Check-ins</div>
                  </VCard>
                </VCol>
                <VCol cols="6" md="3">
                  <VCard variant="tonal" class="text-center pa-3">
                    <div class="text-h5 font-weight-bold">{{ treatmentProgress.engagement_30d?.avg_craving ?? '—' }}</div>
                    <div class="text-caption">Avg Craving</div>
                  </VCard>
                </VCol>
                <VCol cols="6" md="3">
                  <VCard variant="tonal" class="text-center pa-3">
                    <div class="text-h5 font-weight-bold">{{ treatmentProgress.engagement_30d?.avg_mood ?? '—' }}</div>
                    <div class="text-caption">Avg Mood</div>
                  </VCard>
                </VCol>
                <VCol cols="6" md="3">
                  <VCard variant="tonal" class="text-center pa-3">
                    <div class="text-h5 font-weight-bold text-error">{{ treatmentProgress.engagement_30d?.relapses || 0 }}</div>
                    <div class="text-caption">Relapses</div>
                  </VCard>
                </VCol>
              </VRow>

              <!-- Recovery Plans with Stages & Goals -->
              <h4 class="text-subtitle-1 font-weight-bold mb-3">Recovery Plans</h4>
              <template v-if="treatmentProgress.plans?.length">
                <VCard v-for="plan in treatmentProgress.plans" :key="plan._id" variant="outlined" class="mb-4">
                  <VCardTitle class="d-flex align-center justify-space-between">
                    <span>{{ plan.plan_name || 'Unnamed Plan' }}</span>
                    <div class="d-flex align-center ga-2">
                      <VChip size="small" :color="plan.status === 'active' ? 'success' : 'secondary'">{{ plan.status }}</VChip>
                      <VChip size="small" color="primary" variant="tonal">
                        {{ plan.completed_goals || 0 }}/{{ plan.total_goals || 0 }} goals
                      </VChip>
                    </div>
                  </VCardTitle>
                  <VCardText v-if="plan.overall_progress_pct != null">
                    <VProgressLinear
                      :model-value="plan.overall_progress_pct"
                      color="primary"
                      height="20"
                      rounded
                      class="mb-4"
                    >
                      <template #default>
                        <span class="text-caption font-weight-bold white--text">{{ plan.overall_progress_pct }}%</span>
                      </template>
                    </VProgressLinear>
                  </VCardText>

                  <!-- Stages -->
                  <VExpansionPanels variant="accordion" class="mx-4 mb-4">
                    <VExpansionPanel v-for="stage in plan.stages" :key="stage._id || stage.stage_id">
                      <VExpansionPanelTitle>
                        <div class="d-flex align-center ga-2 flex-grow-1">
                          <VChip :color="stageStatusColor(stage.status)" size="x-small" variant="flat">
                            {{ stage.status?.replace(/_/g, ' ') }}
                          </VChip>
                          <span class="font-weight-medium">{{ stage.display_name || stage.name }}</span>
                          <VSpacer />
                          <span class="text-caption text-medium-emphasis me-2">
                            {{ stage.completed_goals }}/{{ stage.total_goals }} goals
                          </span>
                          <VProgressLinear
                            :model-value="stage.progress_pct"
                            :color="stageStatusColor(stage.status)"
                            height="14"
                            rounded
                            style="min-width: 140px; max-width: 180px;"
                          >
                            <template #default>
                              <span style="font-size: 10px; font-weight: bold;">{{ stage.progress_pct }}%</span>
                            </template>
                          </VProgressLinear>
                        </div>
                      </VExpansionPanelTitle>
                      <VExpansionPanelText>
                        <VList v-if="stage.goals?.length" density="compact">
                          <VListItem
                            v-for="goal in stage.goals"
                            :key="goal.goal_id || goal._id"
                            class="px-0"
                          >
                            <template #prepend>
                              <VIcon
                                :color="goalStatusColor(goal.status)"
                                size="20"
                                class="me-2"
                              >
                                {{ goalStatusIcon(goal.status) }}
                              </VIcon>
                            </template>
                            <VListItemTitle class="text-body-2">
                              {{ goal.title || goal.description }}
                            </VListItemTitle>
                            <VListItemSubtitle v-if="goal.measurable_target" class="text-caption">
                              Target: {{ goal.measurable_target }}
                            </VListItemSubtitle>
                            <VListItemSubtitle v-if="goal.target_date" class="text-caption">
                              Due: {{ formatDate(goal.target_date) }}
                            </VListItemSubtitle>
                            <template #append>
                              <div class="d-flex align-center ga-1">
                                <VChip :color="goalStatusColor(goal.status)" size="x-small">
                                  {{ goal.status?.replace(/_/g, ' ') }}
                                </VChip>
                                <span v-if="goal.achieved_at" class="text-caption text-success">
                                  {{ formatDate(goal.achieved_at) }}
                                </span>
                              </div>
                            </template>
                          </VListItem>
                        </VList>

                        <!-- Interventions -->
                        <div v-if="stage.interventions?.length" class="mt-3">
                          <div class="text-caption font-weight-bold text-medium-emphasis mb-1">Interventions</div>
                          <VChip
                            v-for="intervention in stage.interventions"
                            :key="intervention._id"
                            size="small"
                            variant="tonal"
                            color="info"
                            class="me-1 mb-1"
                          >
                            {{ intervention.type?.replace(/_/g, ' ') }} ({{ intervention.frequency }})
                          </VChip>
                        </div>
                      </VExpansionPanelText>
                    </VExpansionPanel>
                  </VExpansionPanels>
                </VCard>
              </template>
              <div v-else class="text-medium-emphasis mb-4">No recovery plans</div>

              <!-- Milestones -->
              <h4 class="text-subtitle-1 font-weight-bold mb-3">Milestones</h4>
              <div v-if="treatmentProgress.milestones?.length" class="d-flex flex-wrap ga-2">
                <VChip
                  v-for="milestone in treatmentProgress.milestones"
                  :key="milestone._id"
                  color="warning"
                  size="small"
                  prepend-icon="mdi-trophy"
                >
                  {{ milestone.title || milestone.milestone_type }} — {{ formatDate(milestone.achieved_at) }}
                </VChip>
              </div>
              <div v-else class="text-medium-emphasis">No milestones achieved yet</div>
            </template>
            <VAlert v-else type="info" variant="tonal">Loading treatment data...</VAlert>
          </VWindowItem>

          <!-- Tab 4: Screenings -->
          <VWindowItem :value="4">
            <VAlert v-if="screenings.length === 0" type="info" variant="tonal">No screenings</VAlert>
            <VTable v-else density="compact">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Score</th>
                  <th>Risk Level</th>
                  <th>Baseline</th>
                  <th>Completed</th>
                  <th>Administered By</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="screening in screenings" :key="screening._id">
                  <td>
                    <VChip
                      v-if="screening.instrument === 'cows' || screening.instrument === 'ciwa_ar'"
                      :color="screening.instrument === 'cows' ? 'blue' : 'orange'"
                      size="small"
                      variant="flat"
                    >
                      {{ screening.screening_type }}
                    </VChip>
                    <span v-else>{{ screening.screening_type }}</span>
                  </td>
                  <td>
                    <span class="font-weight-bold">{{ screening.total_score }}</span><span
                      v-if="screeningMaxScore(screening.instrument)"
                      class="text-medium-emphasis"
                    >/{{ screeningMaxScore(screening.instrument) }}</span>
                  </td>
                  <td>
                    <VChip :color="riskColors[screening.risk_level] || 'secondary'" size="x-small">
                      {{ screening.risk_level?.replace(/_/g, ' ') }}
                    </VChip>
                  </td>
                  <td>
                    <VIcon v-if="screening.is_baseline" color="primary" size="18">mdi-star</VIcon>
                    <span v-else>—</span>
                  </td>
                  <td>{{ formatDate(screening.completed_at) }}</td>
                  <td>{{ screening.administered_by || 'self' }}</td>
                </tr>
              </tbody>
            </VTable>
          </VWindowItem>

          <!-- Tab 5: Crises -->
          <VWindowItem :value="5">
            <VAlert v-if="crises.length === 0" type="info" variant="tonal">No crisis events</VAlert>
            <VTable v-else density="compact">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Source</th>
                  <th>Date</th>
                  <th>Resolved By</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="crisis in crises" :key="crisis._id">
                  <td>{{ crisis.crisis_type?.replace(/_/g, ' ') }}</td>
                  <td>
                    <VChip :color="severityColors[crisis.severity]" size="x-small">{{ crisis.severity?.replace('_', ' ') }}</VChip>
                  </td>
                  <td>
                    <VChip :color="crisisStatusColors[crisis.status]" size="small">{{ crisis.status }}</VChip>
                  </td>
                  <td>{{ crisis.trigger_source }}</td>
                  <td>{{ formatDate(crisis.created_at) }}</td>
                  <td>{{ crisis.resolved_by ? getPatientName(crisis.resolved_by) : '—' }}</td>
                </tr>
              </tbody>
            </VTable>
          </VWindowItem>

          <!-- Tab 6: Reports -->
          <VWindowItem :value="6">
            <template v-if="reportLoading">
              <div class="text-center py-8">
                <VProgressCircular indeterminate color="primary" size="48" />
                <p class="text-subtitle-2 mt-3">Generating activity report...</p>
              </div>
            </template>

            <template v-else-if="reportData">
              <!-- Report Header + Download -->
              <div class="d-flex justify-space-between align-center mb-4">
                <div>
                  <h4 class="text-subtitle-1 font-weight-bold">Patient Activity Report</h4>
                  <p class="text-caption text-medium-emphasis">
                    Generated: {{ formatDateTime(reportData.generated_at) }}
                  </p>
                </div>
                <VBtn color="primary" prepend-icon="mdi-file-pdf-box" @click="downloadPDF">
                  Download PDF
                </VBtn>
              </div>

              <!-- Summary Cards -->
              <VRow class="mb-4">
                <VCol cols="6" sm="4" md="2">
                  <VCard variant="tonal" class="text-center pa-2">
                    <div class="text-h6 font-weight-bold">{{ reportData.summary.total_check_ins }}</div>
                    <div class="text-caption">Check-ins</div>
                  </VCard>
                </VCol>
                <VCol cols="6" sm="4" md="2">
                  <VCard variant="tonal" class="text-center pa-2">
                    <div class="text-h6 font-weight-bold text-success">{{ reportData.summary.sobriety_rate }}%</div>
                    <div class="text-caption">Sobriety Rate</div>
                  </VCard>
                </VCol>
                <VCol cols="6" sm="4" md="2">
                  <VCard variant="tonal" class="text-center pa-2">
                    <div class="text-h6 font-weight-bold">{{ reportData.summary.completed_exercises }}/{{ reportData.summary.total_exercises }}</div>
                    <div class="text-caption">Exercises</div>
                  </VCard>
                </VCol>
                <VCol cols="6" sm="4" md="2">
                  <VCard variant="tonal" class="text-center pa-2">
                    <div class="text-h6 font-weight-bold">{{ reportData.summary.total_appointments }}</div>
                    <div class="text-caption">Appointments</div>
                  </VCard>
                </VCol>
                <VCol cols="6" sm="4" md="2">
                  <VCard variant="tonal" class="text-center pa-2">
                    <div class="text-h6 font-weight-bold">{{ reportData.summary.avg_mood ?? '—' }}</div>
                    <div class="text-caption">Avg Mood</div>
                  </VCard>
                </VCol>
                <VCol cols="6" sm="4" md="2">
                  <VCard variant="tonal" class="text-center pa-2">
                    <div class="text-h6 font-weight-bold">{{ reportData.summary.avg_craving ?? '—' }}</div>
                    <div class="text-caption">Avg Craving</div>
                  </VCard>
                </VCol>
              </VRow>

              <!-- Patient Activities -->
              <VCard variant="outlined" class="mb-4">
                <VCardTitle class="d-flex align-center justify-space-between">
                  <span>Patient Activities</span>
                  <VSelect
                    v-model="reportActivityFilter"
                    :items="[
                      { title: 'All Activities', value: 'all' },
                      { title: 'Check-ins', value: 'check_in' },
                      { title: 'Screenings', value: 'screening' },
                      { title: 'Exercises', value: 'exercise' },
                      { title: 'Milestones', value: 'milestone' },
                      { title: 'Companion Sessions', value: 'companion_session' },
                    ]"
                    variant="outlined"
                    density="compact"
                    hide-details
                    style="max-width: 200px;"
                  />
                </VCardTitle>
                <VCardText>
                  <VTimeline
                    v-if="filteredPatientActivities.length"
                    side="end"
                    density="compact"
                    truncate-line="both"
                  >
                    <VTimelineItem
                      v-for="(activity, i) in filteredPatientActivities.slice(0, 50)"
                      :key="i"
                      :dot-color="activityColors[activity.type] || 'grey'"
                      :icon="activityIcons[activity.type] || 'mdi-circle'"
                      size="small"
                    >
                      <div class="d-flex align-center justify-space-between">
                        <div>
                          <span class="font-weight-medium text-body-2">{{ activity.label }}</span>
                          <div class="text-caption text-medium-emphasis">{{ activity.detail }}</div>
                        </div>
                        <span class="text-caption text-medium-emphasis ms-2 text-no-wrap">{{ formatDateTime(activity.date) }}</span>
                      </div>
                    </VTimelineItem>
                  </VTimeline>
                  <VAlert v-else type="info" variant="tonal">No patient activities recorded</VAlert>
                </VCardText>
              </VCard>

              <!-- Specialist / System Activities -->
              <VCard variant="outlined">
                <VCardTitle class="d-flex align-center justify-space-between">
                  <span>Specialist &amp; System Activities</span>
                  <VSelect
                    v-model="reportSpecialistFilter"
                    :items="[
                      { title: 'All Activities', value: 'all' },
                      { title: 'Appointments', value: 'appointment' },
                      { title: 'Risk Assessments', value: 'risk_assessment' },
                      { title: 'Crisis Responses', value: 'crisis_response' },
                    ]"
                    variant="outlined"
                    density="compact"
                    hide-details
                    style="max-width: 200px;"
                  />
                </VCardTitle>
                <VCardText>
                  <VTimeline
                    v-if="filteredSpecialistActivities.length"
                    side="end"
                    density="compact"
                    truncate-line="both"
                  >
                    <VTimelineItem
                      v-for="(activity, i) in filteredSpecialistActivities.slice(0, 50)"
                      :key="i"
                      :dot-color="activityColors[activity.type] || 'grey'"
                      :icon="activityIcons[activity.type] || 'mdi-circle'"
                      size="small"
                    >
                      <div class="d-flex align-center justify-space-between">
                        <div>
                          <span class="font-weight-medium text-body-2">{{ activity.label }}</span>
                          <div class="text-caption text-medium-emphasis">{{ activity.detail }}</div>
                        </div>
                        <span class="text-caption text-medium-emphasis ms-2 text-no-wrap">{{ formatDateTime(activity.date) }}</span>
                      </div>
                    </VTimelineItem>
                  </VTimeline>
                  <VAlert v-else type="info" variant="tonal">No specialist activities recorded</VAlert>
                </VCardText>
              </VCard>
            </template>

            <VAlert v-else type="info" variant="tonal">
              Click on this tab to generate the patient activity report.
            </VAlert>
          </VWindowItem>
        </VWindow>
      </VCard>
    </template>

    <!-- Status Change Dialog -->
    <VDialog v-model="statusDialog" width="400">
      <VCard>
        <VCardTitle>Update Recovery Status</VCardTitle>
        <VCardText>
          <VSelect
            v-model="newStatus"
            :items="statusOptions"
            label="New Status"
            variant="outlined"
            class="mb-4"
          />
          <VTextarea
            v-model="statusReason"
            label="Reason (optional)"
            variant="outlined"
            rows="2"
          />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="statusDialog = false">Cancel</VBtn>
          <VBtn color="primary" :loading="statusUpdating" @click="submitStatusUpdate">Update</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>
