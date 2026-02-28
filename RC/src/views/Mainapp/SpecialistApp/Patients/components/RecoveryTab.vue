<template>
  <div class="recovery-tab">
    <div v-if="loading" class="recovery-tab__loading">
      <div class="spinner"></div>
      <p>Loading recovery data...</p>
    </div>

    <div v-else-if="!data?.has_recovery_profile" class="tab-empty">
      <div class="empty-illustration">
        <v-icon name="hi-heart" scale="3" class="empty-icon" />
      </div>
      <h3>No Recovery Profile</h3>
      <p>This patient has not enrolled in the recovery programme.</p>
    </div>

    <div v-else class="recovery-tab__content">
      <!-- Risk Score Section -->
      <div class="risk-hero">
        <div class="risk-gauge">
          <svg viewBox="0 0 120 70" class="risk-gauge__svg">
            <path d="M 10 65 A 50 50 0 0 1 110 65" fill="none" stroke="#E2E8F0" stroke-width="10" stroke-linecap="round" />
            <path d="M 10 65 A 50 50 0 0 1 110 65" fill="none" :stroke="levelColor" stroke-width="10" stroke-linecap="round" :stroke-dasharray="arcDash" :stroke-dashoffset="arcOffset" />
            <text x="60" y="50" text-anchor="middle" :fill="levelColor" class="risk-gauge__score">{{ data.risk?.score ?? 0 }}</text>
            <text x="60" y="63" text-anchor="middle" fill="#94A3B8" class="risk-gauge__max">/100</text>
          </svg>
        </div>
        <div class="risk-info">
          <span class="risk-badge" :class="'risk-badge--' + (data.risk?.level || 'low')">
            {{ levelLabel }}
          </span>
          <span v-if="data.risk?.updated_at" class="risk-updated">
            Updated {{ timeAgo(data.risk.updated_at) }}
          </span>
        </div>
      </div>

      <!-- Profile Summary Cards -->
      <div class="summary-grid">
        <div class="summary-card">
          <span class="summary-card__value">{{ data.profile_summary?.sobriety_days ?? 0 }}</span>
          <span class="summary-card__label">Sober Days</span>
        </div>
        <div class="summary-card">
          <span class="summary-card__value">{{ data.profile_summary?.longest_streak ?? 0 }}</span>
          <span class="summary-card__label">Longest Streak</span>
        </div>
        <div class="summary-card">
          <span class="summary-card__value">{{ data.profile_summary?.total_relapses ?? 0 }}</span>
          <span class="summary-card__label">Total Relapses</span>
        </div>
        <div class="summary-card">
          <span class="summary-card__value">{{ data.profile_summary?.care_level || '--' }}</span>
          <span class="summary-card__label">Care Level</span>
        </div>
      </div>

      <!-- Risk History Chart -->
      <div v-if="riskHistory.length > 1" class="section">
        <h3 class="section__title">Risk History ({{ historyPeriod }})</h3>
        <div class="period-toggle">
          <button v-for="p in ['7d', '30d', '90d']" :key="p" :class="{ active: historyPeriod === p }" @click="fetchRiskHistory(p)">{{ p }}</button>
        </div>
        <svg class="risk-chart" :viewBox="`0 0 ${chartW} ${chartH}`">
          <rect v-for="(zone, i) in riskZones" :key="i" x="0" :y="zone.y" :width="chartW" :height="zone.h" :fill="zone.fill" :opacity="zone.opacity" />
          <polyline :points="chartPoints" fill="none" stroke="#6366F1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          <circle v-for="(pt, i) in chartDots" :key="i" :cx="pt.x" :cy="pt.y" r="3" :fill="dotColor(pt.score)" />
        </svg>
      </div>

      <!-- Recent Logs -->
      <div v-if="data.recent_logs?.length" class="section">
        <h3 class="section__title">Recent Check-ins (7 days)</h3>
        <div class="logs-table-wrap">
          <table class="logs-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Sober</th>
                <th>Mood</th>
                <th>Craving</th>
                <th>Sleep</th>
                <th>Anxiety</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="log in data.recent_logs" :key="log.date">
                <td>{{ formatShortDate(log.date) }}</td>
                <td>
                  <span class="status-dot" :class="log.sober_today ? 'status-dot--green' : 'status-dot--red'"></span>
                  {{ log.sober_today ? 'Yes' : 'No' }}
                </td>
                <td>{{ log.mood_score ?? '-' }}/10</td>
                <td>{{ log.craving_intensity ?? '-' }}/10</td>
                <td>{{ log.sleep_quality ? `${log.sleep_quality}/10` : '-' }}</td>
                <td>{{ log.anxiety_level ?? '-' }}/10</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Screening History -->
      <div v-if="data.recent_screenings?.length" class="section">
        <h3 class="section__title">Screening History</h3>
        <div class="screening-cards">
          <div v-for="s in data.recent_screenings" :key="s.id" class="screening-card">
            <div class="screening-card__header">
              <span class="screening-card__instrument">{{ s.instrument?.toUpperCase() }}</span>
              <span class="risk-badge risk-badge--sm" :class="'risk-badge--' + (s.risk_level || 'low')">{{ s.risk_level }}</span>
            </div>
            <div class="screening-card__score">{{ s.total_score }}</div>
            <span class="screening-card__label">{{ s.risk_zone_label }}</span>
            <span class="screening-card__date">{{ formatShortDate(s.date) }}</span>
          </div>
        </div>
      </div>

      <!-- Recovery Plan -->
      <div v-if="data.recovery_plan" class="section">
        <h3 class="section__title">Recovery Plan</h3>
        <div class="plan-card">
          <p v-if="data.recovery_plan.stage_of_change"><strong>Stage:</strong> {{ data.recovery_plan.stage_of_change }}</p>
          <div v-if="data.recovery_plan.goals?.length">
            <strong>Goals:</strong>
            <ul>
              <li v-for="(g, i) in data.recovery_plan.goals.slice(0, 5)" :key="i">{{ g.description || g }}</li>
            </ul>
          </div>
          <div v-if="data.recovery_plan.triggers?.length">
            <strong>Triggers:</strong>
            <div class="tag-list">
              <span v-for="(t, i) in data.recovery_plan.triggers.slice(0, 8)" :key="i" class="tag">{{ t }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Crisis Events -->
      <div v-if="data.crisis_events?.length" class="section">
        <h3 class="section__title">Crisis Events</h3>
        <div class="crisis-list">
          <div v-for="(e, i) in data.crisis_events" :key="i" class="crisis-item">
            <span class="crisis-item__severity" :class="'crisis-item__severity--' + (e.severity || 'low')">{{ e.severity }}</span>
            <span class="crisis-item__type">{{ e.type }}</span>
            <span class="crisis-item__date">{{ formatShortDate(e.date) }}</span>
            <span v-if="e.resolved" class="crisis-item__resolved">Resolved</span>
          </div>
        </div>
      </div>

      <!-- Relapse Timeline -->
      <div v-if="data.profile_summary?.relapse_dates?.length" class="section">
        <h3 class="section__title">Relapse Timeline</h3>
        <div class="relapse-timeline">
          <div v-for="(date, i) in data.profile_summary.relapse_dates.slice(-10).reverse()" :key="i" class="relapse-item">
            <span class="relapse-dot"></span>
            <span>{{ formatShortDate(date) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue'

const props = defineProps({
  patientId: { type: String, required: true },
})

const $http = inject('$_HTTP')
const loading = ref(true)
const data = ref(null)
const riskHistory = ref([])
const historyPeriod = ref('30d')

const chartW = 400
const chartH = 80
const chartPad = 6

const levelLabels = { low: 'Low Risk', moderate: 'Moderate', high: 'High Risk', critical: 'Critical' }
const levelColors = { low: '#10B981', moderate: '#F59E0B', high: '#F97316', critical: '#EF4444' }

const levelLabel = computed(() => levelLabels[data.value?.risk?.level] || 'Unknown')
const levelColor = computed(() => levelColors[data.value?.risk?.level] || '#94A3B8')

const arcDash = computed(() => '157 157')
const arcOffset = computed(() => {
  const pct = Math.min(100, Math.max(0, data.value?.risk?.score || 0)) / 100
  return 157 - pct * 157
})

const riskZones = [
  { y: 0, h: chartH * 0.25, fill: '#EF4444', opacity: 0.06 },
  { y: chartH * 0.25, h: chartH * 0.25, fill: '#F59E0B', opacity: 0.06 },
  { y: chartH * 0.5, h: chartH * 0.25, fill: '#F59E0B', opacity: 0.04 },
  { y: chartH * 0.75, h: chartH * 0.25, fill: '#10B981', opacity: 0.06 },
]

const chartPoints = computed(() => {
  if (riskHistory.value.length < 2) return ''
  const usableW = chartW - chartPad * 2
  const usableH = chartH - chartPad * 2
  const step = usableW / (riskHistory.value.length - 1)
  return riskHistory.value.map((pt, i) => {
    const x = chartPad + i * step
    const y = chartPad + usableH - (Math.min(100, pt.score || 0) / 100) * usableH
    return `${x},${y}`
  }).join(' ')
})

const chartDots = computed(() => {
  if (riskHistory.value.length < 2) return []
  const usableW = chartW - chartPad * 2
  const usableH = chartH - chartPad * 2
  const step = usableW / (riskHistory.value.length - 1)
  return riskHistory.value.map((pt, i) => ({
    x: chartPad + i * step,
    y: chartPad + usableH - (Math.min(100, pt.score || 0) / 100) * usableH,
    score: pt.score || 0,
  }))
})

function dotColor(score) {
  if (score >= 75) return '#EF4444'
  if (score >= 50) return '#F97316'
  if (score >= 25) return '#F59E0B'
  return '#10B981'
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function formatShortDate(dateStr) {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch { return '' }
}

async function fetchData() {
  loading.value = true
  try {
    const res = await $http.$_getPatientRecoveryData(props.patientId)
    data.value = res.data?.data || res.data
    riskHistory.value = data.value?.risk?.history || []
  } catch (err) {
    console.error('Error fetching recovery data:', err)
    data.value = { has_recovery_profile: false }
  } finally {
    loading.value = false
  }
}

async function fetchRiskHistory(period) {
  historyPeriod.value = period
  try {
    const res = await $http.$_getPatientRiskHistory(props.patientId, { period })
    const result = res.data?.data || res.data
    riskHistory.value = result.history || []
  } catch (err) {
    console.error('Error fetching risk history:', err)
  }
}

onMounted(fetchData)
</script>

<style lang="scss" scoped>
.recovery-tab {
  &__loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    color: #94A3B8;

    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid #E2E8F0;
      border-top-color: #6366F1;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    p { margin-top: 12px; font-size: 14px; }
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
}

.risk-hero {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
  background: #F8FAFC;
  border-radius: 12px;
  border: 1px solid #E2E8F0;
}

.risk-gauge {
  width: 130px;
  flex-shrink: 0;

  &__svg { width: 100%; }
  &__score { font-size: 28px; font-weight: 800; }
  &__max { font-size: 11px; }
}

.risk-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.risk-badge {
  display: inline-block;
  font-size: 12px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 12px;
  text-transform: uppercase;
  letter-spacing: 0.3px;

  &--sm { font-size: 10px; padding: 2px 8px; }
  &--low { background: #D1FAE5; color: #065F46; }
  &--moderate { background: #FEF3C7; color: #92400E; }
  &--high { background: #FEE2E2; color: #991B1B; }
  &--critical { background: #991B1B; color: #FFF; }
}

.risk-updated {
  font-size: 12px;
  color: #94A3B8;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;

  @media (max-width: 600px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.summary-card {
  text-align: center;
  padding: 16px 12px;
  background: #F8FAFC;
  border-radius: 10px;
  border: 1px solid #E2E8F0;

  &__value {
    display: block;
    font-size: 22px;
    font-weight: 700;
    color: #1E293B;
    text-transform: capitalize;
  }
  &__label {
    display: block;
    font-size: 11px;
    color: #94A3B8;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    margin-top: 4px;
  }
}

.section {
  &__title {
    font-size: 14px;
    font-weight: 600;
    color: #1E293B;
    margin: 0 0 12px 0;
    display: flex;
    align-items: center;
    gap: 10px;
  }
}

.period-toggle {
  display: flex;
  gap: 4px;
  margin-bottom: 10px;

  button {
    padding: 4px 12px;
    font-size: 11px;
    font-weight: 600;
    border: 1px solid #E2E8F0;
    border-radius: 6px;
    background: #FFF;
    color: #64748B;
    cursor: pointer;

    &.active {
      background: #6366F1;
      color: #FFF;
      border-color: #6366F1;
    }
  }
}

.risk-chart {
  width: 100%;
  height: 80px;
  background: #F8FAFC;
  border-radius: 8px;
  border: 1px solid #E2E8F0;
}

.logs-table-wrap {
  overflow-x: auto;
}

.logs-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;

  th {
    text-align: left;
    padding: 8px 10px;
    font-weight: 600;
    color: #64748B;
    border-bottom: 2px solid #E2E8F0;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  td {
    padding: 8px 10px;
    border-bottom: 1px solid #F1F5F9;
    color: #334155;
  }
}

.status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 4px;

  &--green { background: #10B981; }
  &--red { background: #EF4444; }
}

.screening-cards {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.screening-card {
  flex: 1;
  min-width: 140px;
  padding: 14px;
  background: #F8FAFC;
  border-radius: 10px;
  border: 1px solid #E2E8F0;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }
  &__instrument { font-size: 12px; font-weight: 700; color: #475569; }
  &__score { font-size: 28px; font-weight: 700; color: #1E293B; }
  &__label { display: block; font-size: 11px; color: #94A3B8; }
  &__date { display: block; font-size: 11px; color: #94A3B8; margin-top: 4px; }
}

.plan-card {
  padding: 16px;
  background: #F8FAFC;
  border-radius: 10px;
  border: 1px solid #E2E8F0;
  font-size: 13px;
  color: #334155;
  line-height: 1.6;

  ul { margin: 4px 0 8px 16px; }
  li { margin-bottom: 4px; }
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}

.tag {
  font-size: 11px;
  padding: 3px 10px;
  background: #E2E8F0;
  color: #475569;
  border-radius: 12px;
}

.crisis-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.crisis-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: #F8FAFC;
  border-radius: 8px;
  border: 1px solid #E2E8F0;
  font-size: 13px;

  &__severity {
    font-size: 10px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 8px;
    text-transform: uppercase;

    &--low { background: #D1FAE5; color: #065F46; }
    &--medium { background: #FEF3C7; color: #92400E; }
    &--high { background: #FEE2E2; color: #991B1B; }
    &--life_threatening { background: #991B1B; color: #FFF; }
  }
  &__type { color: #334155; flex: 1; text-transform: capitalize; }
  &__date { color: #94A3B8; font-size: 12px; }
  &__resolved { font-size: 10px; color: #10B981; font-weight: 600; }
}

.relapse-timeline {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-left: 12px;
  border-left: 2px solid #FCA5A5;
}

.relapse-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #64748B;
}

.relapse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #EF4444;
  flex-shrink: 0;
  margin-left: -16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
