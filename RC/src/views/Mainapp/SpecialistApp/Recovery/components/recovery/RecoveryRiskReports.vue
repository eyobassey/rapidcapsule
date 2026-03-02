<template>
  <div class="risk-reports-section">
    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner" />
      <span>Loading risk reports...</span>
    </div>

    <!-- Content -->
    <template v-else-if="reports.length">
      <!-- Score Trend Chart -->
      <div v-if="reports.length >= 2" class="chart-block">
        <h4 class="section-title">
          <v-icon name="hi-trending-up" scale="0.8" />
          Risk Score Trend
        </h4>
        <div class="chart-container">
          <canvas ref="trendChartRef" />
        </div>
      </div>

      <!-- Report Cards -->
      <div class="report-list">
        <div
          v-for="(r, idx) in reports"
          :key="r.id"
          class="report-card"
          :style="{ animationDelay: `${idx * 0.06}s` }"
        >
          <!-- Header -->
          <div class="report-card__header">
            <div class="report-card__date">
              <v-icon name="hi-calendar" scale="0.65" />
              <span>{{ formatDate(r.date) }}</span>
            </div>
            <div class="report-card__score-block">
              <span class="score-value">{{ r.score }}<span class="score-max">/100</span></span>
              <span :class="['level-badge', `level-badge--${r.level}`]">{{ capitalise(r.level) }}</span>
            </div>
          </div>

          <!-- Score Change -->
          <div v-if="r.previous_score != null" class="report-card__change">
            <span :class="['change-indicator', r.score > r.previous_score ? 'change-indicator--up' : r.score < r.previous_score ? 'change-indicator--down' : 'change-indicator--same']">
              {{ r.score > r.previous_score ? '&#x2191;' : r.score < r.previous_score ? '&#x2193;' : '&#x2192;' }}
              {{ Math.abs(r.score - r.previous_score) }} pts from {{ r.previous_score }}
            </span>
          </div>

          <!-- Context Summary -->
          <div v-if="r.context_summary" class="report-card__summary">
            {{ r.context_summary }}
          </div>

          <!-- Expand/Collapse -->
          <button class="expand-btn" @click="toggleExpand(r.id)">
            <v-icon :name="expanded[r.id] ? 'hi-chevron-up' : 'hi-chevron-down'" scale="0.7" />
            {{ expanded[r.id] ? 'Hide Details' : 'View Details' }}
          </button>

          <!-- Expanded Content -->
          <div v-if="expanded[r.id]" class="report-card__details">
            <!-- Category Breakdown -->
            <div v-if="r.categories" class="categories-section">
              <h5 class="detail-heading">Signal Categories</h5>
              <div v-for="(cat, key) in r.categories" :key="key" class="category-row">
                <div class="category-row__header">
                  <span class="category-name">{{ formatCategory(key) }}</span>
                  <span class="category-score">{{ cat.score ?? cat.weighted_score ?? 0 }}%</span>
                </div>
                <div class="category-bar">
                  <div class="category-bar__fill" :style="{ width: `${cat.score ?? cat.weighted_score ?? 0}%`, background: barColor(cat.score ?? cat.weighted_score ?? 0) }" />
                </div>
                <div v-if="cat.signals?.length" class="category-signals">
                  <span v-for="(sig, si) in cat.signals.slice(0, 4)" :key="si" class="signal-chip">
                    {{ sig.label || sig.signal || sig }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Top Factors -->
            <div v-if="r.top_factors?.length" class="factors-section">
              <h5 class="detail-heading">Top Contributing Factors</h5>
              <div v-for="(f, fi) in r.top_factors" :key="fi" class="factor-item">
                <div class="factor-item__header">
                  <span class="factor-label">{{ f.label || f.signal }}</span>
                  <span class="factor-contribution">{{ f.contribution }}%</span>
                </div>
                <div v-if="f.recommendation" class="factor-rec">
                  <v-icon name="hi-light-bulb" scale="0.6" />
                  {{ f.recommendation }}
                </div>
              </div>
            </div>

            <!-- Trend Data -->
            <div v-if="r.trend" class="trend-section">
              <h5 class="detail-heading">Trend</h5>
              <div class="trend-chips">
                <span class="trend-chip">Direction: {{ capitalise(r.trend.direction || 'stable') }}</span>
                <span v-if="r.trend.change_7d != null" class="trend-chip">7-day: {{ r.trend.change_7d > 0 ? '+' : '' }}{{ r.trend.change_7d }}</span>
                <span v-if="r.trend.change_30d != null" class="trend-chip">30-day: {{ r.trend.change_30d > 0 ? '+' : '' }}{{ r.trend.change_30d }}</span>
              </div>
            </div>

            <!-- Suggestions -->
            <div v-if="r.suggestions?.length" class="suggestions-section">
              <h5 class="detail-heading">Suggestions</h5>
              <div v-for="(s, si) in r.suggestions" :key="si" class="suggestion-item">
                <v-icon name="hi-light-bulb" scale="0.65" />
                <span>{{ s.text || s }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="pagination.pages > 1" class="pagination">
        <button class="pagination-btn" :disabled="pagination.page <= 1" @click="fetchReports(pagination.page - 1)">
          <v-icon name="hi-chevron-left" scale="0.8" /> Previous
        </button>
        <span class="pagination-info">Page {{ pagination.page }} of {{ pagination.pages }}</span>
        <button class="pagination-btn" :disabled="pagination.page >= pagination.pages" @click="fetchReports(pagination.page + 1)">
          Next <v-icon name="hi-chevron-right" scale="0.8" />
        </button>
      </div>
    </template>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <v-icon name="hi-shield-exclamation" scale="2.5" class="empty-icon" />
      <h3>No Risk Reports Yet</h3>
      <p>Risk assessment reports will appear here when generated by Eka</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch, nextTick } from 'vue';
import apiFactory from '@/services/apiFactory';
import { useToast } from 'vue-toast-notification';
import Chart from 'chart.js/auto';

const props = defineProps({
  patientId: { type: String, required: true },
});

const $toast = useToast();
const loading = ref(false);
const reports = ref([]);
const pagination = ref({ page: 1, limit: 10, total: 0, pages: 0 });
const expanded = reactive({});
const trendChartRef = ref(null);
let chartInstance = null;

onMounted(() => fetchReports(1));
watch(() => props.patientId, () => fetchReports(1));

async function fetchReports(page = 1) {
  loading.value = true;
  try {
    const res = await apiFactory.$_getPatientRiskAssessments(props.patientId, { page, limit: 10 });
    const result = res.data?.data || res.data?.result || res.data;
    reports.value = result?.data || [];
    pagination.value = result?.pagination || { page: 1, limit: 10, total: 0, pages: 0 };
  } catch (err) {
    console.error('Error fetching risk reports:', err);
    $toast.error('Failed to load risk reports');
  } finally {
    loading.value = false;
    await nextTick();
    renderChart();
  }
}

function renderChart() {
  if (!trendChartRef.value || reports.value.length < 2) return;
  if (chartInstance) chartInstance.destroy();

  const sorted = [...reports.value].sort((a, b) => new Date(a.date) - new Date(b.date));
  const labels = sorted.map((r) => new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
  const scores = sorted.map((r) => r.score);
  const colors = sorted.map((r) => levelColor(r.level));

  chartInstance = new Chart(trendChartRef.value, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Risk Score',
        data: scores,
        borderColor: '#0288D1',
        backgroundColor: 'rgba(2,136,209,0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointBackgroundColor: colors,
        pointBorderColor: colors,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, max: 100, grid: { color: 'rgba(0,0,0,0.05)' } },
        x: { grid: { display: false }, ticks: { maxRotation: 45, font: { size: 10 } } },
      },
    },
  });
}

function toggleExpand(id) {
  expanded[id] = !expanded[id];
}

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function capitalise(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');
}

function formatCategory(key) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function levelColor(level) {
  return { low: '#10B981', moderate: '#F59E0B', high: '#F43F5E', critical: '#DC2626' }[level] || '#94A3B8';
}

function barColor(score) {
  if (score <= 30) return '#10B981';
  if (score <= 60) return '#F59E0B';
  return '#F43F5E';
}
</script>

<style scoped lang="scss">
$sky: #4FC3F7;
$sky-light: #E1F5FE;
$sky-dark: #0288D1;
$emerald: #10B981;
$amber: #F59E0B;
$rose: #F43F5E;

.risk-reports-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
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

// Report Cards
.report-list { display: flex; flex-direction: column; gap: 12px; }

.report-card {
  padding: 20px;
  background: rgba(255,255,255,0.9);
  border: 1px solid rgba($color-g-92, 0.5);
  border-radius: 16px;
  animation: fadeSlideUp 0.4s ease forwards;
  opacity: 0;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
  }

  &__date {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: $color-g-54;
  }

  &__score-block {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
  }

  &__change {
    margin-top: 8px;
  }

  &__summary {
    margin-top: 10px;
    padding: 10px 14px;
    background: rgba($sky-light, 0.4);
    border-radius: 10px;
    font-size: 13px;
    color: $color-g-36;
    line-height: 1.5;
  }

  &__details {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid rgba($color-g-92, 0.5);
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
}

.score-value {
  font-size: 24px;
  font-weight: 700;
  color: $color-g-21;
  .score-max { font-size: 14px; font-weight: 500; color: $color-g-67; }
}

.level-badge {
  padding: 4px 12px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 700;

  &--low { background: rgba($emerald, 0.1); color: $emerald; }
  &--moderate { background: rgba($amber, 0.1); color: darken($amber, 10%); }
  &--high { background: rgba($rose, 0.1); color: $rose; }
  &--critical { background: rgba(#DC2626, 0.1); color: #DC2626; }
}

.change-indicator {
  font-size: 12px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 8px;

  &--up { background: rgba($rose, 0.1); color: $rose; }
  &--down { background: rgba($emerald, 0.1); color: $emerald; }
  &--same { background: rgba($color-g-67, 0.1); color: $color-g-54; }
}

.expand-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  padding: 8px 14px;
  background: rgba($sky, 0.06);
  border: none;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  color: $sky-dark;
  cursor: pointer;
  transition: background 0.2s;
  &:hover { background: rgba($sky, 0.12); }
}

.detail-heading {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: $color-g-21;
  margin-bottom: 10px;
  svg { color: $sky-dark; }
}

// Categories
.category-row {
  margin-bottom: 12px;

  &__header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 4px;
  }
}

.category-name { font-size: 13px; font-weight: 600; color: $color-g-36; }
.category-score { font-size: 13px; font-weight: 700; color: $color-g-21; }

.category-bar {
  height: 6px;
  background: rgba($color-g-92, 0.4);
  border-radius: 3px;
  overflow: hidden;

  &__fill { height: 100%; border-radius: 3px; transition: width 0.3s ease; }
}

.category-signals {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
}

.signal-chip {
  padding: 2px 8px;
  background: rgba($color-g-92, 0.2);
  border-radius: 8px;
  font-size: 11px;
  color: $color-g-54;
}

// Factors
.factor-item {
  padding: 10px 14px;
  background: rgba($color-g-92, 0.1);
  border-radius: 10px;
  margin-bottom: 8px;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}

.factor-label { font-size: 13px; font-weight: 600; color: $color-g-21; }
.factor-contribution { font-size: 13px; font-weight: 700; color: $sky-dark; }

.factor-rec {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin-top: 6px;
  font-size: 12px;
  color: $color-g-54;
  svg { color: $amber; flex-shrink: 0; margin-top: 2px; }
}

// Trend
.trend-chips { display: flex; flex-wrap: wrap; gap: 8px; }

.trend-chip {
  padding: 4px 12px;
  background: rgba($sky, 0.08);
  border-radius: 10px;
  font-size: 12px;
  color: $sky-dark;
  font-weight: 500;
}

// Suggestions
.suggestion-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 0;
  font-size: 13px;
  color: $color-g-36;
  svg { color: $amber; flex-shrink: 0; margin-top: 2px; }
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
  width: 36px; height: 36px;
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
