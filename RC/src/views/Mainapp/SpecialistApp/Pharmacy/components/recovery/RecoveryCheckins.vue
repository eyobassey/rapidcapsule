<template>
  <div class="checkins-section">
    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner" />
      <span>Loading check-ins...</span>
    </div>

    <!-- Content -->
    <template v-else-if="checkins.length">
      <!-- Mood & Craving Mini Chart (last 14) -->
      <div v-if="checkins.length >= 3" class="chart-block">
        <h4 class="section-title">
          <v-icon name="hi-trending-up" scale="0.8" />
          Mood &amp; Craving Trend
        </h4>
        <div class="chart-container">
          <canvas ref="trendChartRef" />
        </div>
      </div>

      <!-- Check-in Cards -->
      <div class="checkin-list">
        <div
          v-for="(log, idx) in checkins"
          :key="log.id"
          class="checkin-card"
          :style="{ animationDelay: `${idx * 0.06}s` }"
        >
          <!-- Header -->
          <div class="checkin-card__header">
            <div class="checkin-card__date">
              <v-icon name="hi-calendar" scale="0.65" />
              <span>{{ formatDate(log.date) }}</span>
            </div>
            <span :class="['sober-badge', log.sober_today ? 'sober-badge--yes' : 'sober-badge--no']">
              {{ log.sober_today ? 'Sober' : 'Relapse' }}
            </span>
          </div>

          <!-- Metrics Grid -->
          <div class="metrics-grid">
            <div class="metric" v-if="log.mood_score != null">
              <span class="metric__label">Mood</span>
              <div class="metric__bar-wrap">
                <div class="metric__bar" :style="{ width: `${log.mood_score * 10}%`, background: moodColor(log.mood_score) }" />
              </div>
              <span class="metric__value">{{ log.mood_score }}/10</span>
            </div>
            <div class="metric" v-if="log.craving_intensity != null">
              <span class="metric__label">Craving</span>
              <div class="metric__bar-wrap">
                <div class="metric__bar" :style="{ width: `${log.craving_intensity * 10}%`, background: cravingColor(log.craving_intensity) }" />
              </div>
              <span class="metric__value">{{ log.craving_intensity }}/10</span>
            </div>
            <div class="metric" v-if="log.anxiety_level != null">
              <span class="metric__label">Anxiety</span>
              <div class="metric__bar-wrap">
                <div class="metric__bar" :style="{ width: `${log.anxiety_level * 10}%`, background: cravingColor(log.anxiety_level) }" />
              </div>
              <span class="metric__value">{{ log.anxiety_level }}/10</span>
            </div>
            <div class="metric" v-if="log.sleep_quality != null">
              <span class="metric__label">Sleep Quality</span>
              <div class="metric__bar-wrap">
                <div class="metric__bar" :style="{ width: `${log.sleep_quality * 10}%`, background: moodColor(log.sleep_quality) }" />
              </div>
              <span class="metric__value">{{ log.sleep_quality }}/10</span>
            </div>
            <div class="metric" v-if="log.sleep_hours != null">
              <span class="metric__label">Sleep Hours</span>
              <span class="metric__value metric__value--lg">{{ log.sleep_hours }}h</span>
            </div>
            <div class="metric" v-if="log.energy_level != null">
              <span class="metric__label">Energy</span>
              <div class="metric__bar-wrap">
                <div class="metric__bar" :style="{ width: `${log.energy_level * 10}%`, background: moodColor(log.energy_level) }" />
              </div>
              <span class="metric__value">{{ log.energy_level }}/10</span>
            </div>
          </div>

          <!-- Triggers -->
          <div v-if="log.triggers_encountered?.length" class="checkin-card__triggers">
            <span class="triggers-label">Triggers:</span>
            <span v-for="(t, i) in log.triggers_encountered" :key="i" class="trigger-chip">{{ t }}</span>
          </div>

          <!-- Substances Craved -->
          <div v-if="log.substances_craved?.length" class="checkin-card__triggers">
            <span class="triggers-label">Craved:</span>
            <span v-for="(s, i) in log.substances_craved" :key="i" class="trigger-chip trigger-chip--rose">{{ s }}</span>
          </div>

          <!-- Extras -->
          <div class="checkin-card__extras">
            <span v-if="log.attended_meeting" class="extra-chip extra-chip--emerald">
              <v-icon name="hi-check-circle" scale="0.6" /> Meeting Attended
            </span>
            <span v-if="log.exercised" class="extra-chip extra-chip--sky">
              <v-icon name="hi-lightning-bolt" scale="0.6" /> Exercised
            </span>
            <span v-if="log.medications_taken" class="extra-chip extra-chip--violet">
              <v-icon name="ri-capsule-line" scale="0.6" /> Meds Taken
            </span>
          </div>

          <!-- Notes -->
          <div v-if="log.notes" class="checkin-card__notes">
            <v-icon name="hi-annotation" scale="0.65" />
            <span>{{ log.notes }}</span>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="pagination.pages > 1" class="pagination">
        <button class="pagination-btn" :disabled="pagination.page <= 1" @click="fetchCheckins(pagination.page - 1)">
          <v-icon name="hi-chevron-left" scale="0.8" /> Previous
        </button>
        <span class="pagination-info">Page {{ pagination.page }} of {{ pagination.pages }}</span>
        <button class="pagination-btn" :disabled="pagination.page >= pagination.pages" @click="fetchCheckins(pagination.page + 1)">
          Next <v-icon name="hi-chevron-right" scale="0.8" />
        </button>
      </div>
    </template>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <v-icon name="hi-clipboard-check" scale="2.5" class="empty-icon" />
      <h3>No Check-ins Yet</h3>
      <p>Daily check-in logs will appear here when the patient starts logging</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue';
import apiFactory from '@/services/apiFactory';
import { useToast } from 'vue-toast-notification';
import Chart from 'chart.js/auto';

const props = defineProps({
  patientId: { type: String, required: true },
});

const $toast = useToast();
const loading = ref(false);
const checkins = ref([]);
const pagination = ref({ page: 1, limit: 14, total: 0, pages: 0 });
const trendChartRef = ref(null);
let chartInstance = null;

onMounted(() => fetchCheckins(1));
watch(() => props.patientId, () => fetchCheckins(1));

async function fetchCheckins(page = 1) {
  loading.value = true;
  try {
    const res = await apiFactory.$_getPatientCheckinHistory(props.patientId, { page, limit: 14 });
    const result = res.data?.data || res.data?.result || res.data;
    checkins.value = result?.data || [];
    pagination.value = result?.pagination || { page: 1, limit: 14, total: 0, pages: 0 };
    nextTick(() => renderChart());
  } catch (err) {
    console.error('Error fetching check-ins:', err);
    $toast.error('Failed to load check-ins');
  } finally {
    loading.value = false;
  }
}

function renderChart() {
  if (!trendChartRef.value || checkins.value.length < 3) return;
  if (chartInstance) chartInstance.destroy();

  const sorted = [...checkins.value].sort((a, b) => new Date(a.date) - new Date(b.date));
  const labels = sorted.map((d) => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));

  chartInstance = new Chart(trendChartRef.value, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Mood', data: sorted.map((d) => d.mood_score), borderColor: '#0288D1', backgroundColor: 'rgba(2,136,209,0.1)', fill: true, tension: 0.4, pointRadius: 3 },
        { label: 'Craving', data: sorted.map((d) => d.craving_intensity), borderColor: '#F43F5E', backgroundColor: 'rgba(244,63,94,0.1)', fill: true, tension: 0.4, pointRadius: 3 },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'top', labels: { usePointStyle: true, pointStyle: 'circle', padding: 16 } } },
      scales: {
        y: { beginAtZero: true, max: 10, grid: { color: 'rgba(0,0,0,0.05)' } },
        x: { grid: { display: false }, ticks: { maxRotation: 45, font: { size: 10 } } },
      },
    },
  });
}

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function moodColor(val) {
  if (val >= 7) return '#10B981';
  if (val >= 4) return '#F59E0B';
  return '#F43F5E';
}

function cravingColor(val) {
  if (val <= 3) return '#10B981';
  if (val <= 6) return '#F59E0B';
  return '#F43F5E';
}
</script>

<style scoped lang="scss">
$sky: #4FC3F7;
$sky-light: #E1F5FE;
$sky-dark: #0288D1;
$emerald: #10B981;
$emerald-light: #D1FAE5;
$amber: #F59E0B;
$rose: #F43F5E;
$rose-light: #FFE4E6;
$violet: #8B5CF6;

.checkins-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
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

.chart-block {
  padding: 20px;
  background: rgba(255,255,255,0.7);
  border: 1px solid rgba($color-g-92, 0.5);
  border-radius: 16px;
}

.chart-container {
  height: 200px;
  position: relative;

  canvas {
    width: 100% !important;
    height: 100% !important;
  }
}

// Check-in Cards
.checkin-list { display: flex; flex-direction: column; gap: 12px; }

.checkin-card {
  padding: 18px;
  background: rgba(255,255,255,0.9);
  border: 1px solid rgba($color-g-92, 0.5);
  border-radius: 16px;
  animation: fadeSlideUp 0.4s ease forwards;
  opacity: 0;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 14px;
  }

  &__date {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: $color-g-54;
  }

  &__triggers {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    margin-top: 12px;
  }

  &__extras {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 12px;
  }

  &__notes {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    margin-top: 12px;
    padding: 10px 14px;
    background: rgba($sky-light, 0.4);
    border-radius: 10px;
    font-size: 13px;
    color: $color-g-36;
    svg { color: $color-g-67; flex-shrink: 0; margin-top: 2px; }
  }
}

.sober-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 10px;

  &--yes { background: rgba($emerald, 0.1); color: $emerald; }
  &--no { background: rgba($rose, 0.1); color: $rose; }
}

// Metrics Grid
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;

  @media (max-width: 600px) { grid-template-columns: repeat(2, 1fr); }
}

.metric {
  display: flex;
  flex-direction: column;
  gap: 4px;

  &__label { font-size: 11px; color: $color-g-54; font-weight: 500; }
  &__bar-wrap { height: 6px; background: rgba($color-g-92, 0.5); border-radius: 3px; overflow: hidden; }
  &__bar { height: 100%; border-radius: 3px; transition: width 0.3s ease; }
  &__value { font-size: 12px; font-weight: 600; color: $color-g-36; }
  &__value--lg { font-size: 18px; font-weight: 700; color: $color-g-21; }
}

// Chips
.triggers-label { font-size: 11px; color: $color-g-54; font-weight: 600; }

.trigger-chip {
  padding: 3px 10px;
  background: rgba($amber, 0.1);
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  color: darken($amber, 15%);

  &--rose { background: rgba($rose, 0.1); color: $rose; }
}

.extra-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;

  &--emerald { background: rgba($emerald, 0.1); color: $emerald; }
  &--sky { background: rgba($sky, 0.1); color: $sky-dark; }
  &--violet { background: rgba($violet, 0.1); color: $violet; }
}

// Pagination
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba($color-g-92, 0.5);
}

.pagination-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: rgba(255,255,255,0.9);
  border: 1px solid rgba($color-g-92, 0.6);
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  color: $color-g-36;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) { border-color: $sky-dark; color: $sky-dark; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.pagination-info { font-size: 13px; color: $color-g-54; }

// Loading & Empty
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 20px;
  gap: 16px;
  span { font-size: 14px; color: $color-g-54; }
}

.loading-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid rgba($sky, 0.2);
  border-top-color: $sky-dark;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 24px;
  text-align: center;

  .empty-icon { color: rgba($sky-dark, 0.3); margin-bottom: 16px; }
  h3 { font-size: 18px; font-weight: 700; color: $color-g-21; margin-bottom: 8px; }
  p { font-size: 14px; color: $color-g-54; }
}

@keyframes spin { to { transform: rotate(360deg); } }
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
