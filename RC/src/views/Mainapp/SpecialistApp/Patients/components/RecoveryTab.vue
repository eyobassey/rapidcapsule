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

      <!-- Quick Actions Bar -->
      <div class="quick-actions">
        <button v-if="!data.recovery_plan" class="btn-action btn-action--primary btn-action--lg" @click="showPlanBuilder = true; scrollToPlanBuilder()">
          <span class="btn-icon">+</span> Create Recovery Plan
        </button>
        <button v-else class="btn-action btn-action--outline btn-action--lg" @click="showPlanBuilder = true; scrollToPlanBuilder()">
          <span class="btn-icon">&#9998;</span> Revise Recovery Plan
        </button>
        <span v-if="data.recovery_plan" class="quick-actions__status">
          Plan: <strong>{{ data.recovery_plan.plan_name || 'Active' }}</strong>
          <span class="plan-status" :class="'plan-status--' + (data.recovery_plan.status || 'active')">{{ data.recovery_plan.status || 'active' }}</span>
        </span>
        <span v-else class="quick-actions__hint">No recovery plan set — create one to guide this patient's treatment</span>
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
      <div class="section">
        <h3 class="section__title">
          Recovery Plan
          <button v-if="!showPlanBuilder && !data.recovery_plan" class="btn-action btn-action--primary" @click="showPlanBuilder = true">
            + Create Plan
          </button>
          <button v-if="data.recovery_plan && !showPlanBuilder" class="btn-action btn-action--outline" @click="showPlanBuilder = true">
            Revise Plan
          </button>
        </h3>

        <!-- Existing Plan Display -->
        <div v-if="data.recovery_plan && !showPlanBuilder" class="plan-card">
          <div class="plan-card__header">
            <span class="plan-card__name">{{ data.recovery_plan.plan_name || 'Recovery Plan' }}</span>
            <span class="plan-status" :class="'plan-status--' + (data.recovery_plan.status || 'active')">
              {{ data.recovery_plan.status || 'active' }}
            </span>
          </div>
          <p v-if="data.recovery_plan.stage_of_change"><strong>Stage:</strong> {{ data.recovery_plan.stage_of_change }}</p>

          <!-- Stages -->
          <div v-if="data.recovery_plan.stages?.length" class="plan-stages">
            <div v-for="(stage, si) in data.recovery_plan.stages" :key="si" class="plan-stage">
              <div class="plan-stage__header">
                <span class="plan-stage__name">{{ formatStageName(stage.name) }}</span>
                <span class="plan-stage__status" :class="'plan-stage__status--' + (stage.status || 'pending')">
                  {{ stage.status || 'pending' }}
                </span>
              </div>
              <div v-if="stage.goals?.length" class="plan-stage__goals">
                <div v-for="(goal, gi) in stage.goals" :key="gi" class="plan-goal">
                  <span class="plan-goal__check" :class="{ 'plan-goal__check--done': goal.status === 'completed' }">
                    {{ goal.status === 'completed' ? '&#10003;' : '&#9675;' }}
                  </span>
                  <span class="plan-goal__text">{{ goal.description }}</span>
                </div>
              </div>
            </div>
          </div>

          <div v-if="data.recovery_plan.goals?.length && !data.recovery_plan.stages?.length">
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
          <div v-if="data.recovery_plan.relapse_prevention" class="plan-relapse-section">
            <div v-if="data.recovery_plan.relapse_prevention.personal_triggers?.length">
              <strong>Known Triggers:</strong>
              <div class="tag-list">
                <span v-for="(t, i) in data.recovery_plan.relapse_prevention.personal_triggers" :key="i" class="tag tag--amber">{{ t }}</span>
              </div>
            </div>
            <div v-if="data.recovery_plan.relapse_prevention.coping_strategies?.length" class="mt-8">
              <strong>Coping Strategies:</strong>
              <div class="tag-list">
                <span v-for="(s, i) in data.recovery_plan.relapse_prevention.coping_strategies" :key="i" class="tag tag--green">{{ s }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Plan Builder -->
        <div v-if="showPlanBuilder" class="plan-builder">
          <div class="plan-builder__header">
            <h4>{{ data.recovery_plan ? 'Revise Recovery Plan' : 'Create Recovery Plan' }}</h4>
            <button class="btn-action btn-action--ghost" @click="closePlanBuilder">Cancel</button>
          </div>

          <div class="plan-builder__field">
            <label>Plan Name</label>
            <input v-model="planForm.plan_name" type="text" placeholder="e.g. 12-Week Opioid Recovery Plan" />
          </div>

          <div class="plan-builder__field">
            <label>Next Review Date</label>
            <input v-model="planForm.next_review_date" type="date" />
          </div>

          <!-- Stages -->
          <div class="plan-builder__stages">
            <div class="plan-builder__stages-header">
              <label>Stages</label>
              <button class="btn-action btn-action--small" @click="addStage">+ Add Stage</button>
            </div>

            <div v-for="(stage, si) in planForm.stages" :key="si" class="stage-block">
              <div class="stage-block__top">
                <select v-model="stage.name">
                  <option value="" disabled>Select stage...</option>
                  <option v-for="sn in stageNames" :key="sn" :value="sn">{{ formatStageName(sn) }}</option>
                </select>
                <input v-model.number="stage.estimated_duration_weeks" type="number" min="1" placeholder="Weeks" class="stage-block__weeks" />
                <button class="btn-action btn-action--danger-small" @click="removeStage(si)">&times;</button>
              </div>

              <!-- Goals for this stage -->
              <div class="stage-block__goals">
                <div v-for="(goal, gi) in stage.goals" :key="gi" class="goal-row">
                  <input v-model="goal.description" type="text" placeholder="Goal description" class="goal-row__desc" />
                  <input v-model="goal.measurable_target" type="text" placeholder="Target measure" class="goal-row__target" />
                  <input v-model="goal.target_date" type="date" class="goal-row__date" />
                  <button class="btn-action btn-action--danger-small" @click="removeGoal(si, gi)">&times;</button>
                </div>
                <button class="btn-action btn-action--small btn-action--outline" @click="addGoal(si)">+ Goal</button>
              </div>

              <!-- Interventions for this stage -->
              <div class="stage-block__interventions">
                <div v-for="(intv, ii) in stage.interventions" :key="ii" class="intervention-row">
                  <select v-model="intv.type" class="intervention-row__type">
                    <option value="" disabled>Type...</option>
                    <option v-for="it in interventionTypes" :key="it" :value="it">{{ formatInterventionType(it) }}</option>
                  </select>
                  <input v-model="intv.description" type="text" placeholder="Description" class="intervention-row__desc" />
                  <input v-model="intv.frequency" type="text" placeholder="Frequency" class="intervention-row__freq" />
                  <button class="btn-action btn-action--danger-small" @click="removeIntervention(si, ii)">&times;</button>
                </div>
                <button class="btn-action btn-action--small btn-action--outline" @click="addIntervention(si)">+ Intervention</button>
              </div>
            </div>
          </div>

          <!-- Relapse Prevention -->
          <div class="plan-builder__relapse">
            <label>Relapse Prevention</label>

            <div class="plan-builder__field">
              <label class="plan-builder__sublabel">Personal Triggers</label>
              <div class="tag-input">
                <div class="tag-list">
                  <span v-for="(t, i) in planForm.relapse_prevention.personal_triggers" :key="i" class="tag tag--removable">
                    {{ t }} <button @click="planForm.relapse_prevention.personal_triggers.splice(i, 1)">&times;</button>
                  </span>
                </div>
                <input v-model="triggerInput" type="text" placeholder="Type and press Enter" @keydown.enter.prevent="addTrigger" />
              </div>
            </div>

            <div class="plan-builder__field">
              <label class="plan-builder__sublabel">Warning Signs</label>
              <div class="tag-input">
                <div class="tag-list">
                  <span v-for="(w, i) in planForm.relapse_prevention.warning_signs" :key="i" class="tag tag--removable">
                    {{ w }} <button @click="planForm.relapse_prevention.warning_signs.splice(i, 1)">&times;</button>
                  </span>
                </div>
                <input v-model="warningInput" type="text" placeholder="Type and press Enter" @keydown.enter.prevent="addWarning" />
              </div>
            </div>

            <div class="plan-builder__field">
              <label class="plan-builder__sublabel">Coping Strategies</label>
              <div class="tag-input">
                <div class="tag-list">
                  <span v-for="(c, i) in planForm.relapse_prevention.coping_strategies" :key="i" class="tag tag--removable">
                    {{ c }} <button @click="planForm.relapse_prevention.coping_strategies.splice(i, 1)">&times;</button>
                  </span>
                </div>
                <input v-model="copingInput" type="text" placeholder="Type and press Enter" @keydown.enter.prevent="addCoping" />
              </div>
            </div>

            <div class="plan-builder__field">
              <label class="plan-builder__sublabel">Emergency Plan</label>
              <textarea v-model="planForm.relapse_prevention.emergency_plan" rows="3" placeholder="Describe the emergency plan for crisis situations..."></textarea>
            </div>
          </div>

          <!-- Submit -->
          <div class="plan-builder__actions">
            <button class="btn-action btn-action--outline" @click="closePlanBuilder">Cancel</button>
            <button class="btn-action btn-action--primary" :disabled="planSaving || !planForm.plan_name.trim()" @click="submitPlan">
              {{ planSaving ? 'Saving...' : (data.recovery_plan ? 'Create Revised Plan' : 'Create Plan') }}
            </button>
          </div>
        </div>

        <!-- No plan yet -->
        <div v-if="!data.recovery_plan && !showPlanBuilder" class="plan-card plan-card--empty">
          <p>No recovery plan created yet for this patient.</p>
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

// Plan Builder State
const showPlanBuilder = ref(false)
const planSaving = ref(false)
const triggerInput = ref('')
const warningInput = ref('')
const copingInput = ref('')

const stageNames = ['assessment', 'detox', 'stabilization', 'active_treatment', 'maintenance', 'aftercare']
const interventionTypes = ['individual_therapy', 'group_therapy', 'medication', 'peer_support', 'family_therapy', 'psychoeducation', 'harm_reduction']

const createEmptyPlanForm = () => ({
  plan_name: '',
  next_review_date: '',
  stages: [],
  relapse_prevention: {
    personal_triggers: [],
    warning_signs: [],
    coping_strategies: [],
    safe_activities: [],
    emergency_plan: '',
    high_risk_situations: [],
  },
})

const planForm = ref(createEmptyPlanForm())

let stageCounter = 0
let goalCounter = 0

function addStage() {
  stageCounter++
  planForm.value.stages.push({
    stage_id: `stage_${stageCounter}_${Date.now()}`,
    name: '',
    order: planForm.value.stages.length + 1,
    estimated_duration_weeks: null,
    goals: [],
    interventions: [],
  })
}

function removeStage(idx) {
  planForm.value.stages.splice(idx, 1)
}

function addGoal(stageIdx) {
  goalCounter++
  planForm.value.stages[stageIdx].goals.push({
    goal_id: `goal_${goalCounter}_${Date.now()}`,
    description: '',
    measurable_target: '',
    target_date: '',
  })
}

function removeGoal(stageIdx, goalIdx) {
  planForm.value.stages[stageIdx].goals.splice(goalIdx, 1)
}

function addIntervention(stageIdx) {
  planForm.value.stages[stageIdx].interventions.push({
    type: '',
    description: '',
    frequency: '',
  })
}

function removeIntervention(stageIdx, intvIdx) {
  planForm.value.stages[stageIdx].interventions.splice(intvIdx, 1)
}

function addTrigger() {
  const val = triggerInput.value.trim()
  if (val) {
    planForm.value.relapse_prevention.personal_triggers.push(val)
    triggerInput.value = ''
  }
}

function addWarning() {
  const val = warningInput.value.trim()
  if (val) {
    planForm.value.relapse_prevention.warning_signs.push(val)
    warningInput.value = ''
  }
}

function addCoping() {
  const val = copingInput.value.trim()
  if (val) {
    planForm.value.relapse_prevention.coping_strategies.push(val)
    copingInput.value = ''
  }
}

function formatStageName(name) {
  if (!name) return ''
  return name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function formatInterventionType(type) {
  if (!type) return ''
  return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function scrollToPlanBuilder() {
  setTimeout(() => {
    const el = document.querySelector('.plan-builder')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, 100)
}

function closePlanBuilder() {
  showPlanBuilder.value = false
  planForm.value = createEmptyPlanForm()
  triggerInput.value = ''
  warningInput.value = ''
  copingInput.value = ''
}

async function submitPlan() {
  if (!planForm.value.plan_name.trim()) return
  planSaving.value = true
  try {
    const payload = {
      patient_id: props.patientId,
      plan_name: planForm.value.plan_name,
      stages: planForm.value.stages.filter(s => s.name).map(s => ({
        ...s,
        goals: s.goals.filter(g => g.description.trim()),
        interventions: s.interventions.filter(i => i.type && i.description.trim()),
      })),
      relapse_prevention: planForm.value.relapse_prevention,
    }
    if (planForm.value.next_review_date) {
      payload.next_review_date = planForm.value.next_review_date
    }
    await $http.$_createPlanForPatient(payload)
    closePlanBuilder()
    await fetchData()
  } catch (err) {
    console.error('Error creating recovery plan:', err)
  } finally {
    planSaving.value = false
  }
}

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

.quick-actions {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  background: linear-gradient(135deg, #EEF2FF 0%, #F8FAFC 100%);
  border-radius: 12px;
  border: 1px solid #C7D2FE;

  &__status {
    font-size: 13px;
    color: #475569;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  &__hint {
    font-size: 13px;
    color: #94A3B8;
    font-style: italic;
  }
}

.btn-icon {
  font-size: 16px;
  margin-right: 4px;
}

.btn-action {
  font-size: 12px;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: all 0.15s;

  &--primary {
    background: #6366F1;
    color: #FFF;
    &:hover { background: #4F46E5; }
    &:disabled { background: #C7D2FE; cursor: not-allowed; }
  }
  &--outline {
    background: transparent;
    border: 1px solid #CBD5E1;
    color: #475569;
    &:hover { background: #F1F5F9; }
  }
  &--ghost {
    background: transparent;
    color: #64748B;
    &:hover { color: #1E293B; }
  }
  &--lg {
    font-size: 14px;
    padding: 10px 20px;
    border-radius: 10px;
    font-weight: 700;
    white-space: nowrap;
  }
  &--small {
    font-size: 11px;
    padding: 4px 10px;
    border-radius: 6px;
    background: #6366F1;
    color: #FFF;
    &:hover { background: #4F46E5; }
  }
  &--danger-small {
    font-size: 14px;
    padding: 2px 8px;
    border-radius: 6px;
    background: transparent;
    color: #EF4444;
    &:hover { background: #FEE2E2; }
  }
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

  &--empty {
    text-align: center;
    color: #94A3B8;
    padding: 24px;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }
  &__name {
    font-size: 15px;
    font-weight: 700;
    color: #1E293B;
  }
}

.plan-status {
  font-size: 10px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 10px;
  text-transform: uppercase;

  &--draft { background: #E2E8F0; color: #475569; }
  &--active { background: #D1FAE5; color: #065F46; }
  &--completed { background: #DBEAFE; color: #1E40AF; }
  &--revised { background: #FEF3C7; color: #92400E; }
  &--abandoned { background: #FEE2E2; color: #991B1B; }
}

.plan-stages {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 8px 0;
}

.plan-stage {
  padding: 10px 12px;
  background: #FFF;
  border-radius: 8px;
  border: 1px solid #E2E8F0;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }
  &__name {
    font-weight: 600;
    color: #1E293B;
    text-transform: capitalize;
  }
  &__status {
    font-size: 10px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 6px;

    &--pending { background: #E2E8F0; color: #64748B; }
    &--in_progress { background: #DBEAFE; color: #1E40AF; }
    &--completed { background: #D1FAE5; color: #065F46; }
    &--skipped { background: #F1F5F9; color: #94A3B8; }
  }
  &__goals { display: flex; flex-direction: column; gap: 4px; }
}

.plan-goal {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;

  &__check {
    color: #94A3B8;
    font-size: 14px;
    &--done { color: #10B981; }
  }
  &__text { color: #475569; }
}

.plan-relapse-section {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #E2E8F0;
}

.mt-8 { margin-top: 8px; }

.tag--amber { background: #FEF3C7; color: #92400E; }
.tag--green { background: #D1FAE5; color: #065F46; }

.plan-builder {
  padding: 20px;
  background: #F8FAFC;
  border-radius: 12px;
  border: 1px solid #E2E8F0;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h4 { font-size: 16px; font-weight: 700; color: #1E293B; margin: 0; }
  }

  &__field {
    margin-bottom: 14px;

    label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: #475569;
      margin-bottom: 4px;
    }

    input[type="text"],
    input[type="date"],
    textarea {
      width: 100%;
      padding: 8px 12px;
      font-size: 13px;
      border: 1px solid #CBD5E1;
      border-radius: 8px;
      background: #FFF;
      color: #1E293B;
      outline: none;
      &:focus { border-color: #6366F1; box-shadow: 0 0 0 2px rgba(99,102,241,.15); }
    }
    textarea { resize: vertical; font-family: inherit; }
  }

  &__sublabel {
    font-size: 11px !important;
    color: #64748B !important;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  &__stages {
    margin-bottom: 20px;
  }

  &__stages-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;

    label { font-size: 13px; font-weight: 600; color: #1E293B; }
  }

  &__relapse {
    padding-top: 16px;
    border-top: 1px solid #E2E8F0;
    margin-bottom: 16px;

    > label {
      font-size: 14px;
      font-weight: 700;
      color: #1E293B;
      display: block;
      margin-bottom: 12px;
    }
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding-top: 16px;
    border-top: 1px solid #E2E8F0;
  }
}

.stage-block {
  background: #FFF;
  border: 1px solid #E2E8F0;
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 10px;

  &__top {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-bottom: 10px;

    select {
      flex: 1;
      padding: 8px 12px;
      font-size: 13px;
      border: 1px solid #CBD5E1;
      border-radius: 8px;
      background: #FFF;
      color: #1E293B;
      outline: none;
      &:focus { border-color: #6366F1; }
    }
  }

  &__weeks {
    width: 80px;
    padding: 8px 10px;
    font-size: 13px;
    border: 1px solid #CBD5E1;
    border-radius: 8px;
    background: #FFF;
    outline: none;
    &:focus { border-color: #6366F1; }
  }

  &__goals,
  &__interventions {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px dashed #E2E8F0;
  }
}

.goal-row {
  display: flex;
  gap: 6px;
  align-items: center;
  margin-bottom: 6px;

  input {
    padding: 6px 10px;
    font-size: 12px;
    border: 1px solid #CBD5E1;
    border-radius: 6px;
    background: #FFF;
    outline: none;
    &:focus { border-color: #6366F1; }
  }

  &__desc { flex: 2; }
  &__target { flex: 1; }
  &__date { width: 130px; }
}

.intervention-row {
  display: flex;
  gap: 6px;
  align-items: center;
  margin-bottom: 6px;

  select, input {
    padding: 6px 10px;
    font-size: 12px;
    border: 1px solid #CBD5E1;
    border-radius: 6px;
    background: #FFF;
    outline: none;
    &:focus { border-color: #6366F1; }
  }

  &__type { width: 150px; }
  &__desc { flex: 1; }
  &__freq { width: 120px; }
}

.tag-input {
  input {
    width: 100%;
    padding: 6px 10px;
    font-size: 12px;
    border: 1px solid #CBD5E1;
    border-radius: 6px;
    background: #FFF;
    margin-top: 6px;
    outline: none;
    &:focus { border-color: #6366F1; }
  }
}

.tag--removable {
  display: inline-flex;
  align-items: center;
  gap: 4px;

  button {
    background: none;
    border: none;
    color: inherit;
    cursor: pointer;
    font-size: 14px;
    padding: 0;
    opacity: 0.7;
    &:hover { opacity: 1; }
  }
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
