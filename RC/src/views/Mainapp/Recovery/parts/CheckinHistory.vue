<template>
  <div class="checkin-history">
    <div class="checkin-history__content">
      <!-- Hero Section -->
      <section class="hero">
        <div class="hero__content">
          <button class="back-link" @click="$emit('back')">
            <v-icon name="hi-arrow-left" scale="0.85" />
            <span>Back</span>
          </button>
          <div class="hero__badge">
            <v-icon name="hi-pencil-alt" />
            <span>{{ stats.current_streak || 0 }} Day Streak</span>
          </div>
          <h1 class="hero__title">
            Check-in<br/>
            <span class="hero__title-accent">History</span>
          </h1>
          <p class="hero__subtitle">
            {{ logs.length ? `${logs.length} check-ins logged. Average mood: ${avgMood}/10.` : 'Start tracking your daily mood, cravings, and recovery progress.' }}
          </p>

          <div class="hero__actions">
            <button class="hero__cta" @click="goToEkaCheckin">
              <v-icon name="hi-chat" scale="0.85" />
              <span>Check in with Eka</span>
            </button>
            <div v-if="logs.length" class="hero__stats">
              <div class="hero-stat">
                <span class="hero-stat__value">{{ stats.current_streak || 0 }}</span>
                <span class="hero-stat__label">Streak</span>
              </div>
              <div class="hero-stat__divider"></div>
              <div class="hero-stat">
                <span class="hero-stat__value">{{ logs.length }}</span>
                <span class="hero-stat__label">Check-ins</span>
              </div>
              <div class="hero-stat__divider"></div>
              <div class="hero-stat">
                <span class="hero-stat__value">{{ avgMood }}</span>
                <span class="hero-stat__label">Avg Mood</span>
              </div>
              <div class="hero-stat__divider"></div>
              <div class="hero-stat">
                <span class="hero-stat__value">{{ avgCraving }}</span>
                <span class="hero-stat__label">Avg Craving</span>
              </div>
            </div>
          </div>
        </div>

        <div class="hero__visual">
          <div class="recovery-orb">
            <div class="orb-ring orb-ring--1"></div>
            <div class="orb-ring orb-ring--2"></div>
            <div class="orb-ring orb-ring--3"></div>
            <div class="orb-core">
              <v-icon name="hi-pencil-alt" scale="2" />
            </div>
          </div>
        </div>
      </section>

      <!-- Mood Trend Chart -->
      <div v-if="!loading && moodTrendData.length >= 2" class="trend-chart-card">
        <div class="trend-chart-card__header">
          <h4>Mood & Craving Trend</h4>
          <span class="trend-chart-card__sub">Last {{ moodTrendData.length }} check-ins</span>
        </div>
        <div class="trend-chart-card__canvas">
          <canvas ref="moodChartRef"></canvas>
        </div>
      </div>

      <!-- Log List -->
      <div v-if="!loading && logs.length" class="log-list">
        <div
          v-for="log in logs"
          :key="log._id"
          class="log-card"
          :class="{ 'log-card--relapse': !log.sober_today }"
          @click="toggleExpand(log._id)"
        >
          <div class="log-card__top">
            <div class="log-card__date-col">
              <span class="log-card__day">{{ formatDay(log.log_date) }}</span>
              <span class="log-card__date">{{ formatDate(log.log_date) }}</span>
            </div>
            <span class="log-card__badge" :class="log.sober_today ? 'log-card__badge--sober' : 'log-card__badge--relapse'">
              {{ log.sober_today ? 'Sober' : 'Relapse' }}
            </span>
          </div>

          <div class="log-card__metrics">
            <div class="log-card__metric" v-if="log.mood_score != null">
              <span class="log-card__metric-icon" :class="moodColor(log.mood_score)">{{ moodEmoji(log.mood_score) }}</span>
              <div class="log-card__metric-info">
                <span class="log-card__metric-label">Mood</span>
                <span class="log-card__metric-value">{{ log.mood_score }}/10</span>
              </div>
              <div class="log-card__metric-bar">
                <div class="log-card__metric-fill" :class="moodColor(log.mood_score)" :style="{ width: (log.mood_score * 10) + '%' }"></div>
              </div>
            </div>
            <div class="log-card__metric" v-if="log.craving_intensity != null">
              <span class="log-card__metric-icon log-card__metric-icon--craving">🔥</span>
              <div class="log-card__metric-info">
                <span class="log-card__metric-label">Craving</span>
                <span class="log-card__metric-value">{{ log.craving_intensity }}/10</span>
              </div>
              <div class="log-card__metric-bar">
                <div class="log-card__metric-fill log-card__metric-fill--craving" :style="{ width: (log.craving_intensity * 10) + '%' }"></div>
              </div>
            </div>
          </div>

          <!-- Expanded details -->
          <div v-if="expandedId === log._id" class="log-card__details">
            <div v-if="log.sleep_quality || log.sleep_hours" class="log-card__detail-row">
              <v-icon name="hi-moon" scale="0.7" />
              <span>Sleep: {{ log.sleep_quality ? log.sleep_quality + '/10 quality' : '' }}{{ log.sleep_quality && log.sleep_hours ? ' · ' : '' }}{{ log.sleep_hours ? log.sleep_hours + 'h' : '' }}</span>
            </div>
            <div v-if="log.anxiety_level" class="log-card__detail-row">
              <v-icon name="hi-exclamation" scale="0.7" />
              <span>Anxiety: {{ log.anxiety_level }}/10</span>
            </div>
            <div v-if="log.triggers_encountered && log.triggers_encountered.length" class="log-card__detail-row">
              <v-icon name="hi-lightning-bolt" scale="0.7" />
              <span>Triggers:</span>
              <div class="log-card__pills">
                <span v-for="t in log.triggers_encountered" :key="t" class="log-card__pill log-card__pill--trigger">{{ t }}</span>
              </div>
            </div>
            <div v-if="log.coping_strategies_used && log.coping_strategies_used.length" class="log-card__detail-row">
              <v-icon name="hi-shield-check" scale="0.7" />
              <span>Coping:</span>
              <div class="log-card__pills">
                <span v-for="c in log.coping_strategies_used" :key="c" class="log-card__pill log-card__pill--coping">{{ c }}</span>
              </div>
            </div>
            <div v-if="log.gratitude_note" class="log-card__detail-row log-card__detail-row--gratitude">
              <v-icon name="hi-heart" scale="0.7" />
              <span>{{ log.gratitude_note }}</span>
            </div>
            <div v-if="!log.sober_today && log.relapse_details" class="log-card__relapse-details">
              <h5>Relapse Details</h5>
              <p v-if="log.relapse_details.substance"><strong>Substance:</strong> {{ log.relapse_details.substance }}</p>
              <p v-if="log.relapse_details.trigger"><strong>Trigger:</strong> {{ log.relapse_details.trigger }}</p>
              <p v-if="log.relapse_details.sought_help_after != null"><strong>Sought help:</strong> {{ log.relapse_details.sought_help_after ? 'Yes' : 'No' }}</p>
              <p v-if="log.relapse_details.notes"><strong>Notes:</strong> {{ log.relapse_details.notes }}</p>
            </div>
          </div>

          <div class="log-card__expand-hint">
            <v-icon :name="expandedId === log._id ? 'hi-chevron-up' : 'hi-chevron-down'" scale="0.6" />
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="!loading && !logs.length" class="empty-state">
        <div class="empty-state__icon">
          <v-icon name="hi-pencil-alt" scale="2.5" />
        </div>
        <h3>No check-ins yet</h3>
        <p>Start your first daily check-in with Eka to track your mood, cravings, and recovery progress.</p>
        <button class="empty-state__btn" @click="goToEkaCheckin">
          <v-icon name="hi-chat" scale="0.7" />
          Check in with Eka
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading your check-in history...</p>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted, nextTick } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toast-notification";
import Chart from "chart.js/auto";

const emit = defineEmits(["back"]);
const $http = inject("$http");
const $toast = useToast();
const router = useRouter();

const loading = ref(true);
const logs = ref([]);
const stats = ref({});
const expandedId = ref(null);

// Chart refs
const moodChartRef = ref(null);
let moodChartInstance = null;

const avgMood = computed(() => {
  const withMood = logs.value.filter((l) => l.mood_score != null);
  if (!withMood.length) return "—";
  return (withMood.reduce((s, l) => s + l.mood_score, 0) / withMood.length).toFixed(1);
});

const avgCraving = computed(() => {
  const withCraving = logs.value.filter((l) => l.craving_intensity != null);
  if (!withCraving.length) return "—";
  return (withCraving.reduce((s, l) => s + l.craving_intensity, 0) / withCraving.length).toFixed(1);
});

const moodTrendData = computed(() => {
  return [...logs.value].reverse().filter((l) => l.mood_score != null);
});

function toggleExpand(id) {
  expandedId.value = expandedId.value === id ? null : id;
}

function moodEmoji(score) {
  if (score <= 2) return "😢";
  if (score <= 4) return "😔";
  if (score <= 6) return "😐";
  if (score <= 8) return "🙂";
  return "😊";
}

function moodColor(score) {
  if (score <= 3) return "mood--low";
  if (score <= 5) return "mood--mid";
  if (score <= 7) return "mood--ok";
  return "mood--good";
}

function formatDay(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-GB", { weekday: "short" });
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function goToEkaCheckin() {
  router.push({
    path: "/app/patient/eka",
    query: { prompt: "I want to do my daily check-in", tags: "recovery" },
  });
}

function renderMoodChart() {
  if (!moodChartRef.value || moodTrendData.value.length < 2) return;
  if (moodChartInstance) moodChartInstance.destroy();

  const data = moodTrendData.value;
  const labels = data.map((d) => {
    const date = new Date(d.log_date);
    return `${date.getDate()}/${date.getMonth() + 1}`;
  });

  moodChartInstance = new Chart(moodChartRef.value, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Mood",
          data: data.map((d) => d.mood_score),
          borderColor: "#4FC3F7",
          backgroundColor: "rgba(79, 195, 247, 0.1)",
          fill: true,
          tension: 0.4,
          borderWidth: 2.5,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: "#fff",
          pointBorderWidth: 2,
        },
        {
          label: "Craving",
          data: data.map((d) => d.craving_intensity),
          borderColor: "#F43F5E",
          backgroundColor: "rgba(244, 63, 94, 0.1)",
          fill: true,
          tension: 0.4,
          borderWidth: 2.5,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: "#fff",
          pointBorderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: "index" },
      plugins: {
        legend: { display: true, position: "bottom", labels: { usePointStyle: true, padding: 16, font: { size: 12, weight: '500' } } },
        tooltip: { backgroundColor: "rgba(15, 23, 42, 0.9)", cornerRadius: 8, padding: 10 },
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: "#64748B", font: { size: 11 } } },
        y: { min: 0, max: 10, grid: { color: "rgba(0,0,0,0.04)" }, ticks: { color: "#64748B", stepSize: 2, font: { size: 11 } } },
      },
    },
  });
}

async function fetchData() {
  loading.value = true;
  try {
    const [logsRes, statsRes] = await Promise.all([
      $http.$_getSobrietyLogs({ limit: 50 }),
      $http.$_getSobrietyStats(),
    ]);
    logs.value = logsRes.data.data || [];
    stats.value = statsRes.data.data || {};
  } catch {
    $toast.error("Failed to load check-in history");
  } finally {
    loading.value = false;
    await nextTick();
    renderMoodChart();
  }
}

onMounted(fetchData);
</script>

<style scoped lang="scss">
// ─── Design Tokens ────────────────────────────────────────────────
$sky: #4FC3F7;
$sky-light: #E1F5FE;
$sky-dark: #0288D1;
$sky-darker: #01579B;
$emerald: #10B981;
$emerald-light: #D1FAE5;
$emerald-dark: #059669;
$navy: #0F172A;
$slate: #334155;
$gray: #64748B;
$light-gray: #94A3B8;
$bg: #F8FAFC;
$white: #FFFFFF;
$rose: #F43F5E;
$rose-light: #FFE4E6;
$amber: #F59E0B;
$amber-light: #FEF3C7;

@mixin glass-card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);
}

// ─── Page ──────────────────────────────────────────────────────────
.checkin-history {
  width: 100%;
  min-height: 100%;
  background: $bg;

  &__content {
    max-width: 1400px;
    margin: 0 auto;
    padding: 24px 32px 100px;
    @media (max-width: 768px) { padding: 16px 16px 120px; }
  }
}

// ─── Hero ──────────────────────────────────────────────────────────
.hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  align-items: center;
  padding: 48px 40px 56px;
  background: linear-gradient(135deg, $sky 0%, $sky-dark 50%, $sky-darker 100%);
  border-radius: 28px;
  min-height: 320px;
  color: $white;
  margin-bottom: 20px;
  box-shadow: 0 20px 60px rgba(2, 136, 209, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1) inset;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    padding: 24px 20px 32px;
    text-align: center;
    min-height: auto;
  }

  &__content { display: flex; flex-direction: column; }

  &__badge {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 8px 16px; background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(10px); border-radius: 24px;
    width: fit-content; margin-bottom: 20px;
    font-size: 12px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase;
    @media (max-width: 768px) { margin: 0 auto 16px; }
  }

  &__title {
    font-size: 48px; font-weight: 800; line-height: 1.1; letter-spacing: -1px; margin: 0 0 16px;
    @media (max-width: 768px) { font-size: 28px; }
  }

  &__title-accent {
    background: linear-gradient(180deg, #fff 0%, rgba(255,255,255,0.7) 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }

  &__subtitle {
    font-size: 16px; opacity: 0.95; line-height: 1.6; margin: 0 0 28px; max-width: 480px;
    @media (max-width: 768px) { font-size: 14px; max-width: none; }
  }

  &__actions {
    display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
    @media (max-width: 768px) { flex-direction: column; gap: 12px; }
  }

  &__cta {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 14px 28px; border-radius: 16px;
    background: rgba(255, 255, 255, 0.95); color: $sky-darker;
    font-size: 15px; font-weight: 700; border: none; cursor: pointer;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    transition: all 0.25s;
    &:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(0, 0, 0, 0.2); background: #fff; }
    @media (max-width: 768px) { width: 100%; justify-content: center; }
  }

  &__stats {
    display: flex; align-items: center; gap: 20px;
    padding: 16px 20px; background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px); border-radius: 16px; width: fit-content;
    @media (max-width: 768px) { width: 100%; justify-content: space-around; gap: 10px; padding: 12px 14px; }
  }

  &__visual {
    display: flex; justify-content: center; align-items: center; position: relative;
    @media (max-width: 768px) { display: none; }
  }
}

.hero-stat {
  display: flex; flex-direction: column; align-items: center;
  &__value { font-size: 24px; font-weight: 700; line-height: 1; @media (max-width: 768px) { font-size: 18px; } }
  &__label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.7; margin-top: 4px; @media (max-width: 768px) { font-size: 9px; } }
  &__divider { width: 1px; height: 32px; background: rgba(255, 255, 255, 0.2); }
}

.back-link {
  display: inline-flex; align-items: center; gap: 6px;
  background: none; border: none; color: rgba(255, 255, 255, 0.7);
  font-size: 13px; font-weight: 500; cursor: pointer; padding: 0; margin-bottom: 16px;
  transition: color 0.2s; &:hover { color: #fff; }
  @media (max-width: 768px) { margin: 0 auto 12px; }
}

// ─── Animated Orb ────────────────────────────────────────────────
.recovery-orb { position: relative; width: 200px; height: 200px; display: flex; align-items: center; justify-content: center; }
.orb-ring {
  position: absolute; border-radius: 50%; border: 2px solid rgba(255, 255, 255, 0.2);
  &--1 { width: 100%; height: 100%; animation: spin-slow 20s linear infinite; }
  &--2 { width: 80%; height: 80%; animation: spin-slow 15s linear infinite reverse; }
  &--3 { width: 60%; height: 60%; animation: spin-slow 10s linear infinite; }
}
.orb-core {
  width: 100px; height: 100px; background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(20px); border-radius: 50%;
  display: flex; align-items: center; justify-content: center; color: $white;
  box-shadow: 0 0 40px rgba(255, 255, 255, 0.3), 0 0 80px rgba(79, 195, 247, 0.3);
  animation: pulse-glow 3s ease-in-out infinite;
}

// ─── Mood Trend Chart ────────────────────────────────────────────
.trend-chart-card {
  @include glass-card;
  border-radius: 20px;
  padding: 20px;
  margin: 24px 0 0;

  &__header {
    display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;
    h4 { font-size: 14px; font-weight: 600; color: $navy; margin: 0; }
  }

  &__sub {
    font-size: 11px; color: $gray; background: rgba(0, 0, 0, 0.04);
    padding: 3px 8px; border-radius: 6px;
  }

  &__canvas {
    height: 220px; position: relative;
    @media (max-width: 640px) { height: 180px; }
  }
}

// ─── Log List ───────────────────────────────────────────────────
.log-list {
  display: flex; flex-direction: column; gap: 10px;
  padding: 24px 0 0;
}

.log-card {
  @include glass-card;
  border-radius: 16px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover { transform: translateY(-1px); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08); }
  &--relapse { border-left: 3px solid $rose; }

  &__top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
  &__date-col { display: flex; flex-direction: column; }
  &__day { font-size: 12px; color: $gray; text-transform: uppercase; letter-spacing: 0.3px; }
  &__date { font-size: 15px; font-weight: 600; color: $navy; }

  &__badge {
    font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 8px;
    text-transform: uppercase; letter-spacing: 0.3px;
    &--sober { background: $emerald-light; color: $emerald-dark; }
    &--relapse { background: $rose-light; color: $rose; }
  }

  &__metrics { display: flex; flex-direction: column; gap: 8px; }

  &__metric { display: flex; align-items: center; gap: 10px; }
  &__metric-icon { font-size: 16px; width: 24px; text-align: center; flex-shrink: 0; }
  &__metric-info { display: flex; flex-direction: column; min-width: 60px; }
  &__metric-label { font-size: 10px; color: $gray; text-transform: uppercase; letter-spacing: 0.3px; }
  &__metric-value { font-size: 13px; font-weight: 600; color: $navy; }
  &__metric-bar { flex: 1; height: 6px; background: rgba(0, 0, 0, 0.06); border-radius: 3px; overflow: hidden; }
  &__metric-fill {
    height: 100%; border-radius: 3px; transition: width 0.3s;
    &.mood--low { background: $rose; } &.mood--mid { background: $amber; }
    &.mood--ok { background: $sky; } &.mood--good { background: $emerald; }
    &--craving { background: linear-gradient(90deg, $amber, $rose); }
  }

  &__details {
    margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(0, 0, 0, 0.06);
    display: flex; flex-direction: column; gap: 10px;
  }

  &__detail-row {
    display: flex; align-items: flex-start; gap: 8px; font-size: 13px; color: $slate; flex-wrap: wrap;
    svg { color: $gray; margin-top: 2px; flex-shrink: 0; }
    &--gratitude { font-style: italic; color: $gray; svg { color: $rose; } }
  }

  &__pills { display: flex; flex-wrap: wrap; gap: 4px; }
  &__pill {
    font-size: 11px; font-weight: 500; padding: 2px 8px; border-radius: 6px;
    &--trigger { background: $rose-light; color: $rose; }
    &--coping { background: $emerald-light; color: $emerald-dark; }
  }

  &__relapse-details {
    background: rgba($rose, 0.04); border: 1px solid rgba($rose, 0.1);
    border-radius: 10px; padding: 12px; margin-top: 4px;
    h5 { font-size: 12px; font-weight: 700; color: $rose; text-transform: uppercase; letter-spacing: 0.3px; margin: 0 0 8px; }
    p { font-size: 13px; color: $slate; margin: 0 0 4px; &:last-child { margin: 0; } }
    strong { color: $navy; }
  }

  &__expand-hint { display: flex; justify-content: center; margin-top: 8px; color: $light-gray; }
}

// ─── Empty State ────────────────────────────────────────────────
.empty-state {
  text-align: center; padding: 48px 0;

  &__icon {
    width: 72px; height: 72px; border-radius: 50%;
    background: linear-gradient(135deg, $sky-light, rgba($sky, 0.15));
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 20px; color: $sky-dark;
  }

  h3 { font-size: 18px; font-weight: 700; color: $navy; margin: 0 0 8px; }
  p { font-size: 14px; color: $gray; margin: 0 0 24px; line-height: 1.5; max-width: 360px; margin-left: auto; margin-right: auto; }

  &__btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 14px 28px; border-radius: 14px;
    background: linear-gradient(135deg, $sky, $sky-dark);
    color: $white; font-size: 15px; font-weight: 600; border: none; cursor: pointer;
    box-shadow: 0 4px 16px rgba($sky-dark, 0.3); transition: all 0.25s;
    &:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba($sky-dark, 0.4); }
  }
}

// ─── Loading ─────────────────────────────────────────────────────
.loading-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  min-height: 400px; gap: 16px; color: $gray; font-size: 14px;
}
.loading-spinner {
  width: 36px; height: 36px; border: 3px solid rgba($sky, 0.2);
  border-top-color: $sky; border-radius: 50%; animation: spin 0.8s linear infinite;
}

// ─── Animations ──────────────────────────────────────────────────
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 40px rgba(255, 255, 255, 0.3), 0 0 80px rgba(79, 195, 247, 0.3); }
  50% { box-shadow: 0 0 60px rgba(255, 255, 255, 0.4), 0 0 100px rgba(79, 195, 247, 0.4); }
}
</style>
