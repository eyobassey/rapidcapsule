<template>
  <div class="recovery-overview">
    <!-- Profile Summary Row -->
    <div class="summary-grid">
      <div class="summary-card">
        <div class="summary-card__icon summary-card__icon--sky">
          <v-icon name="hi-calendar" scale="1" />
        </div>
        <div class="summary-card__info">
          <span class="summary-card__value">{{ data?.profile_summary?.sobriety_days || 0 }}</span>
          <span class="summary-card__label">Sobriety Days</span>
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-card__icon summary-card__icon--emerald">
          <v-icon name="hi-trending-up" scale="1" />
        </div>
        <div class="summary-card__info">
          <span class="summary-card__value">{{ data?.profile_summary?.longest_streak || 0 }}</span>
          <span class="summary-card__label">Longest Streak</span>
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-card__icon summary-card__icon--amber">
          <v-icon name="hi-exclamation" scale="1" />
        </div>
        <div class="summary-card__info">
          <span class="summary-card__value">{{ data?.profile_summary?.total_relapses || 0 }}</span>
          <span class="summary-card__label">Total Relapses</span>
        </div>
      </div>
      <div class="summary-card">
        <div :class="['summary-card__icon', `summary-card__icon--${riskColor}`]">
          <v-icon name="hi-shield-exclamation" scale="1" />
        </div>
        <div class="summary-card__info">
          <span class="summary-card__value">{{ data?.risk?.score ?? 0 }}/100</span>
          <span class="summary-card__label">Risk Score ({{ capitalise(data?.risk?.level || 'low') }})</span>
        </div>
      </div>
    </div>

    <!-- Profile Details Row -->
    <div class="details-row">
      <div class="detail-chip" v-if="data?.profile_summary?.primary_substance">
        <v-icon name="hi-beaker" scale="0.7" />
        <span>{{ data.profile_summary.primary_substance }}</span>
      </div>
      <div class="detail-chip" v-if="data?.profile_summary?.care_level">
        <v-icon name="hi-clipboard-check" scale="0.7" />
        <span>{{ formatCareLevel(data.profile_summary.care_level) }}</span>
      </div>
      <div class="detail-chip" v-if="data?.profile_summary?.status">
        <v-icon name="hi-status-online" scale="0.7" />
        <span>{{ capitalise(data.profile_summary.status) }}</span>
      </div>
    </div>

    <!-- Risk Gauge -->
    <div class="section-block">
      <h4 class="section-title">
        <v-icon name="hi-shield-exclamation" scale="0.8" />
        Current Risk Level
      </h4>
      <div class="risk-gauge-container">
        <svg viewBox="0 0 200 120" class="risk-gauge">
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#E2E8F0" stroke-width="12" stroke-linecap="round" />
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" :stroke="riskGaugeColor" stroke-width="12" stroke-linecap="round" :stroke-dasharray="gaugeArc" :stroke-dashoffset="0" />
          <text x="100" y="85" text-anchor="middle" :fill="riskGaugeColor" font-size="28" font-weight="700">{{ data?.risk?.score ?? 0 }}</text>
          <text x="100" y="102" text-anchor="middle" fill="#64748B" font-size="11">/100</text>
        </svg>
        <div :class="['risk-level-badge', `risk-level-badge--${data?.risk?.level || 'low'}`]">
          {{ capitalise(data?.risk?.level || 'low') }}
        </div>
      </div>
    </div>

    <!-- 30-Day Mood Trend -->
    <div v-if="data?.mood_trend_30d?.length" class="section-block">
      <h4 class="section-title">
        <v-icon name="hi-trending-up" scale="0.8" />
        30-Day Mood &amp; Craving Trend
      </h4>
      <div class="chart-container">
        <canvas ref="moodChartRef" />
      </div>
    </div>

    <!-- Quick Stats Row -->
    <div class="section-block">
      <h4 class="section-title">
        <v-icon name="hi-chart-bar" scale="0.8" />
        Recovery Activity
      </h4>
      <div class="quick-stats">
        <div class="quick-stat">
          <span class="quick-stat__value">{{ data?.counts?.screenings || 0 }}</span>
          <span class="quick-stat__label">Screenings</span>
        </div>
        <div class="quick-stat">
          <span class="quick-stat__value">{{ data?.counts?.exercises || 0 }}</span>
          <span class="quick-stat__label">Exercises</span>
        </div>
        <div class="quick-stat">
          <span class="quick-stat__value">{{ data?.counts?.risk_assessments || 0 }}</span>
          <span class="quick-stat__label">Risk Reports</span>
        </div>
        <div class="quick-stat">
          <span class="quick-stat__value">{{ data?.counts?.milestones || 0 }}</span>
          <span class="quick-stat__label">Milestones</span>
        </div>
      </div>
    </div>

    <!-- Recovery Plan -->
    <div v-if="data?.recovery_plan" class="section-block">
      <h4 class="section-title">
        <v-icon name="hi-clipboard-list" scale="0.8" />
        Active Recovery Plan
      </h4>
      <div class="plan-card">
        <div class="plan-detail" v-if="data.recovery_plan.stage_of_change">
          <span class="plan-detail__label">Stage of Change</span>
          <span class="plan-detail__value">{{ formatCareLevel(data.recovery_plan.stage_of_change) }}</span>
        </div>
        <div v-if="data.recovery_plan.goals?.length" class="plan-detail">
          <span class="plan-detail__label">Goals</span>
          <div class="plan-tags">
            <span v-for="(goal, i) in data.recovery_plan.goals.slice(0, 5)" :key="i" class="plan-tag plan-tag--emerald">
              {{ typeof goal === 'string' ? goal : goal.description || goal.title || 'Goal' }}
            </span>
          </div>
        </div>
        <div v-if="data.recovery_plan.triggers?.length" class="plan-detail">
          <span class="plan-detail__label">Known Triggers</span>
          <div class="plan-tags">
            <span v-for="(trigger, i) in data.recovery_plan.triggers.slice(0, 5)" :key="i" class="plan-tag plan-tag--rose">
              {{ typeof trigger === 'string' ? trigger : trigger.name || trigger }}
            </span>
          </div>
        </div>
        <div v-if="data.recovery_plan.coping_strategies?.length" class="plan-detail">
          <span class="plan-detail__label">Coping Strategies</span>
          <div class="plan-tags">
            <span v-for="(s, i) in data.recovery_plan.coping_strategies.slice(0, 5)" :key="i" class="plan-tag plan-tag--sky">
              {{ typeof s === 'string' ? s : s.name || s }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Crisis Events -->
    <div v-if="data?.crisis_events?.length" class="section-block">
      <h4 class="section-title">
        <v-icon name="hi-exclamation-circle" scale="0.8" />
        Recent Crisis Events
      </h4>
      <div class="crisis-list">
        <div v-for="(event, i) in data.crisis_events" :key="i" class="crisis-item">
          <div :class="['crisis-dot', `crisis-dot--${event.severity || 'moderate'}`]" />
          <div class="crisis-info">
            <span class="crisis-type">{{ capitalise(event.type || 'Crisis') }}</span>
            <span class="crisis-meta">
              {{ formatDate(event.date) }}
              <span :class="['crisis-severity', `crisis-severity--${event.severity}`]">{{ capitalise(event.severity || 'unknown') }}</span>
              <span v-if="event.resolved" class="crisis-resolved">Resolved</span>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Check-ins Preview -->
    <div v-if="data?.recent_logs?.length" class="section-block">
      <h4 class="section-title">
        <v-icon name="hi-clipboard-check" scale="0.8" />
        Recent Check-ins (Last 7 Days)
      </h4>
      <div class="checkin-preview">
        <div v-for="(log, i) in data.recent_logs" :key="i" class="checkin-mini">
          <span class="checkin-mini__date">{{ formatDateShort(log.date) }}</span>
          <span :class="['checkin-mini__sober', log.sober_today ? 'checkin-mini__sober--yes' : 'checkin-mini__sober--no']">
            {{ log.sober_today ? 'Sober' : 'Relapse' }}
          </span>
          <div class="checkin-mini__mood">
            <div class="mood-bar">
              <div class="mood-bar__fill" :style="{ width: `${(log.mood_score || 0) * 10}%` }" />
            </div>
            <span class="mood-bar__label">{{ log.mood_score || '-' }}</span>
          </div>
          <span class="checkin-mini__craving" v-if="log.craving_intensity != null">
            Craving: {{ log.craving_intensity }}/10
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import Chart from 'chart.js/auto';

const props = defineProps({
  data: { type: Object, default: null },
});

const moodChartRef = ref(null);
let chartInstance = null;

const riskColor = computed(() => {
  const level = props.data?.risk?.level || 'low';
  return { low: 'emerald', moderate: 'amber', high: 'rose', critical: 'rose' }[level] || 'emerald';
});

const riskGaugeColor = computed(() => {
  const level = props.data?.risk?.level || 'low';
  return { low: '#10B981', moderate: '#F59E0B', high: '#F43F5E', critical: '#DC2626' }[level] || '#10B981';
});

const gaugeArc = computed(() => {
  const score = props.data?.risk?.score ?? 0;
  const totalArc = 251; // approximate arc length for 180deg with radius 80
  const filled = (score / 100) * totalArc;
  return `${filled} ${totalArc}`;
});

function capitalise(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');
}

function formatCareLevel(level) {
  if (!level) return '';
  return level.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateShort(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function renderChart() {
  if (!moodChartRef.value || !props.data?.mood_trend_30d?.length) return;
  if (chartInstance) chartInstance.destroy();

  const labels = props.data.mood_trend_30d.map((d) => {
    const dt = new Date(d.date);
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });
  const moodData = props.data.mood_trend_30d.map((d) => d.mood);
  const cravingData = props.data.mood_trend_30d.map((d) => d.craving);

  chartInstance = new Chart(moodChartRef.value, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Mood',
          data: moodData,
          borderColor: '#0288D1',
          backgroundColor: 'rgba(2, 136, 209, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointBackgroundColor: '#0288D1',
        },
        {
          label: 'Craving',
          data: cravingData,
          borderColor: '#F43F5E',
          backgroundColor: 'rgba(244, 63, 94, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointBackgroundColor: '#F43F5E',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: { usePointStyle: true, pointStyle: 'circle', padding: 16 } },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 10,
          grid: { color: 'rgba(0,0,0,0.05)' },
          ticks: { stepSize: 2 },
        },
        x: {
          grid: { display: false },
          ticks: { maxRotation: 45, font: { size: 10 } },
        },
      },
    },
  });
}

onMounted(() => {
  nextTick(() => renderChart());
});

watch(() => props.data, () => {
  nextTick(() => renderChart());
}, { deep: true });
</script>

<style scoped lang="scss">
$sky: #4FC3F7;
$sky-light: #E1F5FE;
$sky-dark: #0288D1;
$emerald: #10B981;
$emerald-light: #D1FAE5;
$amber: #F59E0B;
$amber-light: #FEF3C7;
$rose: #F43F5E;
$rose-light: #FFE4E6;

.recovery-overview {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

// Summary Grid
.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;

  @media (max-width: 900px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 500px) { grid-template-columns: 1fr; }
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba($color-g-92, 0.5);
  border-radius: 16px;

  &__icon {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &--sky { background: linear-gradient(135deg, $sky-light, rgba($sky, 0.2)); color: $sky-dark; }
    &--emerald { background: linear-gradient(135deg, $emerald-light, rgba($emerald, 0.2)); color: $emerald; }
    &--amber { background: linear-gradient(135deg, $amber-light, rgba($amber, 0.2)); color: $amber; }
    &--rose { background: linear-gradient(135deg, $rose-light, rgba($rose, 0.2)); color: $rose; }
  }

  &__info { display: flex; flex-direction: column; gap: 2px; }
  &__value { font-size: 20px; font-weight: 700; color: $color-g-21; }
  &__label { font-size: 12px; color: $color-g-54; font-weight: 500; }
}

// Details Row
.details-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.detail-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: rgba($sky, 0.08);
  border: 1px solid rgba($sky, 0.15);
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  color: $sky-dark;
}

// Sections
.section-block {
  padding: 20px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba($color-g-92, 0.5);
  border-radius: 16px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 700;
  color: $color-g-21;
  margin-bottom: 16px;

  svg { color: $sky-dark; }
}

// Risk Gauge
.risk-gauge-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.risk-gauge {
  width: 180px;
  height: 110px;
}

.risk-level-badge {
  display: inline-flex;
  padding: 6px 18px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 700;
  margin-top: 8px;

  &--low { background: rgba($emerald, 0.1); color: $emerald; }
  &--moderate { background: rgba($amber, 0.1); color: darken($amber, 10%); }
  &--high { background: rgba($rose, 0.1); color: $rose; }
  &--critical { background: rgba(#DC2626, 0.1); color: #DC2626; }
}

// Chart
.chart-container {
  height: 220px;
  position: relative;

  canvas {
    width: 100% !important;
    height: 100% !important;
  }
}

// Quick Stats
.quick-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;

  @media (max-width: 600px) { grid-template-columns: repeat(2, 1fr); }
}

.quick-stat {
  text-align: center;
  padding: 16px;
  background: rgba($sky-light, 0.4);
  border-radius: 12px;

  &__value { display: block; font-size: 24px; font-weight: 700; color: $sky-dark; }
  &__label { display: block; font-size: 11px; color: $color-g-54; font-weight: 500; margin-top: 4px; }
}

// Recovery Plan
.plan-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.plan-detail {
  &__label { display: block; font-size: 11px; font-weight: 600; color: $color-g-54; text-transform: uppercase; letter-spacing: 0.3px; margin-bottom: 6px; }
  &__value { font-size: 15px; font-weight: 600; color: $color-g-21; }
}

.plan-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.plan-tag {
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;

  &--emerald { background: rgba($emerald, 0.1); color: darken($emerald, 10%); }
  &--rose { background: rgba($rose, 0.1); color: $rose; }
  &--sky { background: rgba($sky, 0.1); color: $sky-dark; }
}

// Crisis Events
.crisis-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.crisis-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.crisis-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-top: 5px;
  flex-shrink: 0;

  &--low { background: $emerald; }
  &--moderate { background: $amber; }
  &--high, &--critical { background: $rose; }
}

.crisis-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.crisis-type {
  font-size: 14px;
  font-weight: 600;
  color: $color-g-21;
}

.crisis-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: $color-g-54;
}

.crisis-severity {
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;

  &--low { background: rgba($emerald, 0.1); color: $emerald; }
  &--moderate { background: rgba($amber, 0.1); color: darken($amber, 10%); }
  &--high { background: rgba($rose, 0.1); color: $rose; }
  &--critical { background: rgba(#DC2626, 0.1); color: #DC2626; }
}

.crisis-resolved {
  padding: 2px 8px;
  background: rgba($emerald, 0.1);
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
  color: $emerald;
}

// Check-in Preview
.checkin-preview {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.checkin-mini {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba($color-g-92, 0.4);
  border-radius: 10px;

  &__date {
    font-size: 13px;
    font-weight: 600;
    color: $color-g-36;
    min-width: 60px;
  }

  &__sober {
    font-size: 11px;
    font-weight: 700;
    padding: 3px 10px;
    border-radius: 8px;

    &--yes { background: rgba($emerald, 0.1); color: $emerald; }
    &--no { background: rgba($rose, 0.1); color: $rose; }
  }

  &__mood {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__craving {
    font-size: 12px;
    color: $color-g-54;
    white-space: nowrap;
  }
}

.mood-bar {
  flex: 1;
  height: 6px;
  background: rgba($color-g-92, 0.5);
  border-radius: 3px;
  overflow: hidden;

  &__fill {
    height: 100%;
    background: linear-gradient(90deg, $rose 0%, $amber 40%, $emerald 100%);
    border-radius: 3px;
    transition: width 0.3s ease;
  }

  &__label {
    font-size: 12px;
    font-weight: 600;
    color: $color-g-36;
    min-width: 16px;
  }
}
</style>
