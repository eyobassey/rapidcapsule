<template>
  <div class="sa-analytics">
    <!-- Hero Section -->
    <section class="hero">
      <div class="hero__content">
        <div class="hero__badge">
          <span class="hero__badge-dot"></span>
          <v-icon name="hi-chart-bar" scale="0.7" />
          <span>Analytics</span>
        </div>
        <h1 class="hero__title">
          Performance
          <span class="hero__title-accent">Analytics</span>
        </h1>
        <p class="hero__subtitle">Track your appointment metrics, revenue trends, and practice performance.</p>

        <!-- Actions Row (period select + export) -->
        <div class="hero__actions">
          <select v-model="selectedPeriod" class="hero-select" @change="fetchAnalytics">
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
          </select>
          <button class="hero-export-btn" @click="exportData">
            <v-icon name="hi-download" scale="0.85" />
            <span>Export CSV</span>
          </button>
        </div>

        <!-- Stats Bar -->
        <div class="hero__stats" v-if="!loading">
          <div class="hero-stat">
            <span class="hero-stat__value">{{ stats.totalAppointments }}</span>
            <span class="hero-stat__label">Total Appts</span>
            <span class="hero-stat__trend" :class="stats.trends.appointments.direction">
              <v-icon :name="getTrendIcon(stats.trends.appointments.direction)" scale="0.55" />
              {{ formatTrend(stats.trends.appointments) }}
            </span>
          </div>
          <div class="hero-stat__divider"></div>
          <div class="hero-stat">
            <span class="hero-stat__value">{{ stats.completedRate }}%</span>
            <span class="hero-stat__label">Completion</span>
            <span class="hero-stat__trend" :class="stats.trends.completion.direction">
              <v-icon :name="getTrendIcon(stats.trends.completion.direction)" scale="0.55" />
              {{ formatTrend(stats.trends.completion) }}
            </span>
          </div>
          <div class="hero-stat__divider"></div>
          <div class="hero-stat">
            <span class="hero-stat__value">{{ formatCurrencyShort(stats.revenue) }}</span>
            <span class="hero-stat__label">Revenue</span>
            <span class="hero-stat__trend" :class="stats.trends.revenue.direction">
              <v-icon :name="getTrendIcon(stats.trends.revenue.direction)" scale="0.55" />
              {{ formatTrend(stats.trends.revenue) }}
            </span>
          </div>
          <div class="hero-stat__divider"></div>
          <div class="hero-stat">
            <span class="hero-stat__value">{{ stats.uniquePatients }}</span>
            <span class="hero-stat__label">Patients</span>
            <span class="hero-stat__trend" :class="stats.trends.patients.direction">
              <v-icon :name="getTrendIcon(stats.trends.patients.direction)" scale="0.55" />
              {{ formatTrend(stats.trends.patients) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Hero Visual -->
      <div class="hero__visual">
        <div class="dashboard-orb">
          <div class="orb-ring orb-ring--1"></div>
          <div class="orb-ring orb-ring--2"></div>
          <div class="orb-ring orb-ring--3"></div>
          <div class="orb-core">
            <v-icon name="hi-chart-bar" scale="2" />
          </div>
        </div>
        <div class="floating-icon floating-icon--1">
          <v-icon name="hi-trending-up" scale="0.9" />
        </div>
        <div class="floating-icon floating-icon--2">
          <v-icon name="hi-currency-dollar" scale="0.9" />
        </div>
        <div class="floating-icon floating-icon--3">
          <v-icon name="hi-user-group" scale="0.9" />
        </div>
      </div>
    </section>

    <!-- Loading State -->
    <div v-if="loading" class="bento-card loading-card">
      <div class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading analytics...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bento-card error-card">
      <div class="error-state">
        <v-icon name="hi-exclamation-circle" scale="2" />
        <p>{{ error }}</p>
        <button class="btn-retry" @click="fetchAnalytics">Try Again</button>
      </div>
    </div>

    <!-- Analytics Content -->
    <template v-else>
      <!-- Charts Row 1 -->
      <div class="bento-row bento-row--charts">
        <!-- Appointments Over Time -->
        <div class="bento-card chart-card">
          <div class="card-header">
            <div class="card-header__left">
              <div class="card-icon card-icon--sky">
                <v-icon name="hi-chart-bar" scale="0.9" />
              </div>
              <h3>Appointments Over Time</h3>
            </div>
            <div class="chart-legend">
              <span class="legend-item"><span class="dot dot--completed"></span> Completed</span>
              <span class="legend-item"><span class="dot dot--cancelled"></span> Cancelled</span>
            </div>
          </div>
          <div class="chart-container" ref="dailyChartContainer">
            <svg v-if="charts.dailyTrend.length" class="bar-chart" :viewBox="`0 0 ${chartWidth} ${chartHeight}`" preserveAspectRatio="xMidYMid meet">
              <line v-for="(tick, i) in yAxisTicks" :key="'y-' + i"
                :x1="40" :y1="tick.y" :x2="chartWidth - 10" :y2="tick.y"
                stroke="#E2E8F0" stroke-dasharray="4"/>
              <text v-for="(tick, i) in yAxisTicks" :key="'yt-' + i"
                :x="35" :y="tick.y + 4" text-anchor="end" fill="#94A3B8" font-size="10">{{ tick.label }}</text>

              <g v-for="(day, i) in charts.dailyTrend" :key="'bar-' + i" class="bar-group">
                <rect
                  :x="getBarX(i) - 5"
                  :y="20"
                  :width="barWidth * 2 + 12"
                  :height="chartHeight - 50"
                  fill="transparent"
                  class="hover-area"
                  @mouseenter="showTooltip($event, 'daily', day)"
                  @mouseleave="hideTooltip"
                />
                <rect
                  :x="getBarX(i)"
                  :y="getBarY(day.completed)"
                  :width="barWidth"
                  :height="getBarHeight(day.completed)"
                  fill="#22C55E"
                  rx="2"
                  class="chart-bar"
                />
                <rect
                  :x="getBarX(i) + barWidth + 2"
                  :y="getBarY(day.cancelled)"
                  :width="barWidth"
                  :height="getBarHeight(day.cancelled)"
                  fill="#EF4444"
                  rx="2"
                  class="chart-bar"
                />
                <text
                  :x="getBarX(i) + barWidth"
                  :y="chartHeight - 5"
                  text-anchor="middle"
                  fill="#94A3B8"
                  font-size="9"
                >{{ formatDateLabel(day.date) }}</text>
              </g>
            </svg>
            <div v-else class="chart-empty">
              <v-icon name="hi-chart-bar" scale="1.5" />
              <p>No appointment data for this period</p>
            </div>
          </div>
        </div>

        <!-- Revenue by Channel -->
        <div class="bento-card chart-card">
          <div class="card-header">
            <div class="card-header__left">
              <div class="card-icon card-icon--amber">
                <v-icon name="hi-currency-dollar" scale="0.9" />
              </div>
              <h3>Revenue by Channel</h3>
            </div>
          </div>
          <div class="chart-container donut-container">
            <div class="donut-wrapper" @mouseenter="showTooltip($event, 'revenue', null)" @mouseleave="hideTooltip">
              <svg v-if="hasRevenueData" class="donut-chart" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="70" fill="none" stroke="#E2E8F0" stroke-width="30"/>
                <circle v-for="(segment, i) in revenueSegments" :key="'rev-' + i"
                  cx="100" cy="100" r="70"
                  fill="none"
                  :stroke="segment.color"
                  stroke-width="30"
                  :stroke-dasharray="segment.dashArray"
                  :stroke-dashoffset="segment.offset"
                  transform="rotate(-90 100 100)"
                  class="donut-segment"
                />
                <text x="100" y="95" text-anchor="middle" fill="#1E293B" font-size="20" font-weight="700">
                  {{ formatCurrencyShort(stats.revenue) }}
                </text>
                <text x="100" y="115" text-anchor="middle" fill="#94A3B8" font-size="12">Total</text>
              </svg>
              <div v-else class="chart-empty">
                <v-icon name="hi-chart-pie" scale="1.5" />
                <p>No revenue data for this period</p>
              </div>
            </div>
            <div class="donut-legend">
              <div class="legend-row">
                <span class="legend-color" style="background: #4FC3F7"></span>
                <span class="legend-text">Video</span>
                <span class="legend-value">{{ formatCurrency(charts.revenueByChannel.video) }}</span>
              </div>
              <div class="legend-row">
                <span class="legend-color" style="background: #81C784"></span>
                <span class="legend-text">Audio</span>
                <span class="legend-value">{{ formatCurrency(charts.revenueByChannel.audio) }}</span>
              </div>
              <div class="legend-row">
                <span class="legend-color" style="background: #FFB74D"></span>
                <span class="legend-text">In-Person</span>
                <span class="legend-value">{{ formatCurrency(charts.revenueByChannel.in_person) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Charts Row 2 -->
      <div class="bento-row bento-row--charts">
        <!-- Peak Hours Chart -->
        <div class="bento-card chart-card">
          <div class="card-header">
            <div class="card-header__left">
              <div class="card-icon card-icon--violet">
                <v-icon name="hi-clock" scale="0.9" />
              </div>
              <h3>Peak Hours</h3>
            </div>
            <span class="card-subtitle">Busiest appointment times</span>
          </div>
          <div class="chart-container">
            <svg v-if="charts.peakHours.length" class="peak-chart" :viewBox="`0 0 ${chartWidth} 180`" preserveAspectRatio="xMidYMid meet">
              <g v-for="(hour, i) in peakHoursFiltered" :key="'peak-' + i" class="bar-group">
                <rect
                  :x="getPeakBarX(i) - 2"
                  :y="10"
                  :width="peakBarWidth + 4"
                  :height="155"
                  fill="transparent"
                  class="hover-area"
                  @mouseenter="showTooltip($event, 'peak', hour)"
                  @mouseleave="hideTooltip"
                />
                <rect
                  :x="getPeakBarX(i)"
                  :y="getPeakBarY(hour.count)"
                  :width="peakBarWidth"
                  :height="getPeakBarHeight(hour.count)"
                  :fill="getPeakBarColor(hour.count)"
                  rx="3"
                  class="chart-bar"
                />
                <text
                  :x="getPeakBarX(i) + peakBarWidth / 2"
                  :y="165"
                  text-anchor="middle"
                  fill="#94A3B8"
                  font-size="9"
                >{{ hour.label }}</text>
              </g>
            </svg>
            <div v-else class="chart-empty">
              <v-icon name="hi-clock" scale="1.5" />
              <p>No peak hours data</p>
            </div>
          </div>
        </div>

        <!-- Monthly Trends Chart -->
        <div class="bento-card chart-card">
          <div class="card-header">
            <div class="card-header__left">
              <div class="card-icon card-icon--emerald">
                <v-icon name="hi-presentation-chart-line" scale="0.9" />
              </div>
              <h3>Monthly Trends</h3>
            </div>
            <span class="card-subtitle">6-month overview</span>
          </div>
          <div class="chart-container">
            <svg v-if="charts.monthlyTrend.length" class="line-chart" :viewBox="`0 0 ${chartWidth} 180`" preserveAspectRatio="xMidYMid meet">
              <line v-for="(tick, i) in monthlyYTicks" :key="'my-' + i"
                :x1="40" :y1="tick.y" :x2="chartWidth - 10" :y2="tick.y"
                stroke="#E2E8F0" stroke-dasharray="4"/>
              <text v-for="(tick, i) in monthlyYTicks" :key="'myt-' + i"
                :x="35" :y="tick.y + 4" text-anchor="end" fill="#94A3B8" font-size="10">{{ tick.label }}</text>

              <polyline
                :points="monthlyTotalPoints"
                fill="none"
                stroke="#4FC3F7"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <polyline
                :points="monthlyCompletedPoints"
                fill="none"
                stroke="#22C55E"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />

              <g v-for="(month, i) in charts.monthlyTrend" :key="'mp-' + i" class="point-group">
                <circle
                  :cx="getMonthX(i)"
                  :cy="getMonthY(month.total)"
                  r="15"
                  fill="transparent"
                  class="hover-area"
                  @mouseenter="showTooltip($event, 'monthly', month)"
                  @mouseleave="hideTooltip"
                />
                <circle :cx="getMonthX(i)" :cy="getMonthY(month.total)" r="4" fill="#4FC3F7" class="data-point"/>
                <circle :cx="getMonthX(i)" :cy="getMonthY(month.completed)" r="4" fill="#22C55E" class="data-point"/>
                <text
                  :x="getMonthX(i)"
                  :y="165"
                  text-anchor="middle"
                  fill="#94A3B8"
                  font-size="9"
                >{{ month.label.split(' ')[0] }}</text>
              </g>
            </svg>
            <div v-else class="chart-empty">
              <v-icon name="hi-presentation-chart-line" scale="1.5" />
              <p>No monthly trend data</p>
            </div>
            <div class="line-legend">
              <span class="legend-item"><span class="dot" style="background: #4FC3F7"></span> Total</span>
              <span class="legend-item"><span class="dot" style="background: #22C55E"></span> Completed</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Breakdown Tables Row -->
      <div class="bento-row bento-row--tables">
        <!-- By Status -->
        <div class="bento-card table-card">
          <div class="card-header">
            <div class="card-header__left">
              <div class="card-icon card-icon--sky">
                <v-icon name="hi-clipboard-check" scale="0.9" />
              </div>
              <h3>By Status</h3>
            </div>
          </div>
          <div class="breakdown-list">
            <div class="breakdown-item">
              <span class="breakdown-label">
                <span class="breakdown-dot" style="background: #22C55E"></span>
                Completed
              </span>
              <span class="breakdown-value">{{ byStatus.completed }}</span>
              <span class="breakdown-bar-wrap">
                <span class="breakdown-bar" :style="{ width: getPercent(byStatus.completed) + '%', background: '#22C55E' }"></span>
              </span>
              <span class="breakdown-percent">{{ getPercent(byStatus.completed) }}%</span>
            </div>
            <div class="breakdown-item">
              <span class="breakdown-label">
                <span class="breakdown-dot" style="background: #4FC3F7"></span>
                Confirmed
              </span>
              <span class="breakdown-value">{{ byStatus.confirmed }}</span>
              <span class="breakdown-bar-wrap">
                <span class="breakdown-bar" :style="{ width: getPercent(byStatus.confirmed) + '%', background: '#4FC3F7' }"></span>
              </span>
              <span class="breakdown-percent">{{ getPercent(byStatus.confirmed) }}%</span>
            </div>
            <div class="breakdown-item">
              <span class="breakdown-label">
                <span class="breakdown-dot" style="background: #F59E0B"></span>
                Pending
              </span>
              <span class="breakdown-value">{{ byStatus.pending }}</span>
              <span class="breakdown-bar-wrap">
                <span class="breakdown-bar" :style="{ width: getPercent(byStatus.pending) + '%', background: '#F59E0B' }"></span>
              </span>
              <span class="breakdown-percent">{{ getPercent(byStatus.pending) }}%</span>
            </div>
            <div class="breakdown-item">
              <span class="breakdown-label">
                <span class="breakdown-dot" style="background: #EF4444"></span>
                Cancelled
              </span>
              <span class="breakdown-value">{{ byStatus.cancelled }}</span>
              <span class="breakdown-bar-wrap">
                <span class="breakdown-bar" :style="{ width: getPercent(byStatus.cancelled) + '%', background: '#EF4444' }"></span>
              </span>
              <span class="breakdown-percent">{{ getPercent(byStatus.cancelled) }}%</span>
            </div>
            <div class="breakdown-item">
              <span class="breakdown-label">
                <span class="breakdown-dot" style="background: #8B5CF6"></span>
                No Show
              </span>
              <span class="breakdown-value">{{ byStatus.no_show }}</span>
              <span class="breakdown-bar-wrap">
                <span class="breakdown-bar" :style="{ width: getPercent(byStatus.no_show) + '%', background: '#8B5CF6' }"></span>
              </span>
              <span class="breakdown-percent">{{ getPercent(byStatus.no_show) }}%</span>
            </div>
          </div>
        </div>

        <!-- By Channel -->
        <div class="bento-card table-card">
          <div class="card-header">
            <div class="card-header__left">
              <div class="card-icon card-icon--emerald">
                <v-icon name="hi-video-camera" scale="0.9" />
              </div>
              <h3>By Channel</h3>
            </div>
          </div>
          <div class="breakdown-list">
            <div class="breakdown-item">
              <span class="breakdown-label">
                <v-icon name="hi-video-camera" scale="0.8" />
                Video
              </span>
              <span class="breakdown-value">{{ byChannel.video }}</span>
              <span class="breakdown-bar-wrap">
                <span class="breakdown-bar" :style="{ width: getChannelPercent(byChannel.video) + '%', background: '#4FC3F7' }"></span>
              </span>
              <span class="breakdown-percent">{{ getChannelPercent(byChannel.video) }}%</span>
            </div>
            <div class="breakdown-item">
              <span class="breakdown-label">
                <v-icon name="hi-phone" scale="0.8" />
                Audio
              </span>
              <span class="breakdown-value">{{ byChannel.audio }}</span>
              <span class="breakdown-bar-wrap">
                <span class="breakdown-bar" :style="{ width: getChannelPercent(byChannel.audio) + '%', background: '#81C784' }"></span>
              </span>
              <span class="breakdown-percent">{{ getChannelPercent(byChannel.audio) }}%</span>
            </div>
            <div class="breakdown-item">
              <span class="breakdown-label">
                <v-icon name="hi-office-building" scale="0.8" />
                In-Person
              </span>
              <span class="breakdown-value">{{ byChannel.in_person }}</span>
              <span class="breakdown-bar-wrap">
                <span class="breakdown-bar" :style="{ width: getChannelPercent(byChannel.in_person) + '%', background: '#FFB74D' }"></span>
              </span>
              <span class="breakdown-percent">{{ getChannelPercent(byChannel.in_person) }}%</span>
            </div>
          </div>
        </div>

        <!-- Top Appointment Types -->
        <div class="bento-card table-card">
          <div class="card-header">
            <div class="card-header__left">
              <div class="card-icon card-icon--rose">
                <v-icon name="hi-tag" scale="0.9" />
              </div>
              <h3>Top Appointment Types</h3>
            </div>
          </div>
          <div class="breakdown-list">
            <div v-for="(count, type) in byType" :key="type" class="breakdown-item">
              <span class="breakdown-label">{{ type }}</span>
              <span class="breakdown-value">{{ count }}</span>
              <span class="breakdown-bar-wrap">
                <span class="breakdown-bar" :style="{ width: getTypePercent(count) + '%', background: '#8B5CF6' }"></span>
              </span>
              <span class="breakdown-percent">{{ getTypePercent(count) }}%</span>
            </div>
            <div v-if="Object.keys(byType).length === 0" class="empty-types">
              <v-icon name="hi-tag" scale="1" />
              <p>No appointment types data</p>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Tooltip -->
    <div
      v-if="tooltip.visible"
      class="chart-tooltip"
      :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
    >
      <div class="tooltip-content">
        <div class="tooltip-title">{{ tooltip.title }}</div>
        <div v-for="(item, i) in tooltip.items" :key="i" class="tooltip-item">
          <span class="tooltip-dot" :style="{ background: item.color }"></span>
          <span class="tooltip-label">{{ item.label }}:</span>
          <span class="tooltip-value">{{ item.value }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import apiFactory from '@/services/apiFactory';

const selectedPeriod = ref('30d');
const loading = ref(true);
const error = ref(null);

// Chart dimensions
const chartWidth = 500;
const chartHeight = 220;
const barWidth = 12;
const peakBarWidth = 18;

// Tooltip state
const tooltip = reactive({
  visible: false,
  x: 0,
  y: 0,
  title: '',
  items: [],
});

// Stats data
const stats = reactive({
  totalAppointments: 0,
  completedRate: 0,
  revenue: 0,
  uniquePatients: 0,
  trends: {
    appointments: { value: 0, direction: 'flat' },
    completion: { value: 0, direction: 'flat' },
    revenue: { value: 0, direction: 'flat' },
    patients: { value: 0, direction: 'flat' },
  },
});

// Breakdown data
const byStatus = reactive({
  completed: 0,
  confirmed: 0,
  pending: 0,
  cancelled: 0,
  no_show: 0,
});

const byChannel = reactive({
  video: 0,
  audio: 0,
  in_person: 0,
});

const byType = reactive({});

// Chart data
const charts = reactive({
  dailyTrend: [],
  peakHours: [],
  monthlyTrend: [],
  revenueByChannel: { video: 0, audio: 0, in_person: 0 },
});

// Computed values
const totalStatus = computed(() => {
  return Object.values(byStatus).reduce((a, b) => a + b, 0);
});

const totalChannel = computed(() => {
  return Object.values(byChannel).reduce((a, b) => a + b, 0);
});

const totalType = computed(() => {
  return Object.values(byType).reduce((a, b) => a + b, 0);
});

const maxDailyValue = computed(() => {
  if (!charts.dailyTrend.length) return 10;
  const max = Math.max(...charts.dailyTrend.map(d => Math.max(d.completed, d.cancelled, d.total)));
  return Math.max(max, 5);
});

const maxPeakValue = computed(() => {
  if (!charts.peakHours.length) return 10;
  const max = Math.max(...charts.peakHours.map(h => h.count));
  return Math.max(max, 5);
});

const maxMonthlyValue = computed(() => {
  if (!charts.monthlyTrend.length) return 10;
  const max = Math.max(...charts.monthlyTrend.map(m => m.total));
  return Math.max(max, 5);
});

const yAxisTicks = computed(() => {
  const max = maxDailyValue.value;
  const step = Math.ceil(max / 4);
  return [0, step, step * 2, step * 3, step * 4].map((val) => ({
    label: val,
    y: chartHeight - 30 - ((val / (step * 4)) * (chartHeight - 60)),
  }));
});

const monthlyYTicks = computed(() => {
  const max = maxMonthlyValue.value;
  const step = Math.ceil(max / 4);
  return [0, step, step * 2, step * 3, step * 4].map((val) => ({
    label: val,
    y: 150 - ((val / (step * 4)) * 120),
  }));
});

const peakHoursFiltered = computed(() => {
  return charts.peakHours.filter(h => h.hour >= 6 && h.hour <= 22);
});

const hasRevenueData = computed(() => {
  return stats.revenue > 0;
});

const revenueSegments = computed(() => {
  const total = stats.revenue || 1;
  const circumference = 2 * Math.PI * 70;
  let offset = 0;

  const segments = [
    { value: charts.revenueByChannel.video, color: '#4FC3F7' },
    { value: charts.revenueByChannel.audio, color: '#81C784' },
    { value: charts.revenueByChannel.in_person, color: '#FFB74D' },
  ];

  return segments.map((seg) => {
    const percent = seg.value / total;
    const dashArray = `${percent * circumference} ${circumference}`;
    const currentOffset = offset;
    offset -= percent * circumference;
    return {
      ...seg,
      dashArray,
      offset: currentOffset,
    };
  });
});

const monthlyTotalPoints = computed(() => {
  return charts.monthlyTrend.map((m, i) => `${getMonthX(i)},${getMonthY(m.total)}`).join(' ');
});

const monthlyCompletedPoints = computed(() => {
  return charts.monthlyTrend.map((m, i) => `${getMonthX(i)},${getMonthY(m.completed)}`).join(' ');
});

// Methods
function getTrendIcon(direction) {
  if (direction === 'up') return 'hi-trending-up';
  if (direction === 'down') return 'hi-trending-down';
  return 'hi-minus';
}

function formatTrend(trend) {
  if (trend.direction === 'flat') return '-';
  return `${trend.value}%`;
}

function getPercent(value) {
  return totalStatus.value ? Math.round((value / totalStatus.value) * 100) : 0;
}

function getChannelPercent(value) {
  return totalChannel.value ? Math.round((value / totalChannel.value) * 100) : 0;
}

function getTypePercent(value) {
  return totalType.value ? Math.round((value / totalType.value) * 100) : 0;
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatCurrencyShort(amount) {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}K`;
  }
  return amount.toString();
}

function formatDateLabel(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}

// Tooltip functions
function showTooltip(event, type, data) {
  const rect = event.target.getBoundingClientRect();
  tooltip.x = rect.left + rect.width / 2;
  tooltip.y = rect.top - 10;

  if (type === 'daily' && data) {
    tooltip.title = formatDateLabel(data.date);
    tooltip.items = [
      { label: 'Total', value: data.total, color: '#64748B' },
      { label: 'Completed', value: data.completed, color: '#22C55E' },
      { label: 'Cancelled', value: data.cancelled, color: '#EF4444' },
    ];
  } else if (type === 'peak' && data) {
    tooltip.title = data.label;
    tooltip.items = [
      { label: 'Appointments', value: data.count, color: getPeakBarColor(data.count) },
    ];
  } else if (type === 'monthly' && data) {
    tooltip.title = data.label;
    tooltip.items = [
      { label: 'Total', value: data.total, color: '#4FC3F7' },
      { label: 'Completed', value: data.completed, color: '#22C55E' },
    ];
  } else if (type === 'revenue') {
    tooltip.title = 'Revenue Breakdown';
    tooltip.items = [
      { label: 'Video', value: formatCurrency(charts.revenueByChannel.video), color: '#4FC3F7' },
      { label: 'Audio', value: formatCurrency(charts.revenueByChannel.audio), color: '#81C784' },
      { label: 'In-Person', value: formatCurrency(charts.revenueByChannel.in_person), color: '#FFB74D' },
    ];
  }

  tooltip.visible = true;
}

function hideTooltip() {
  tooltip.visible = false;
}

// Bar chart helpers
function getBarX(index) {
  const totalBars = charts.dailyTrend.length;
  const totalWidth = chartWidth - 60;
  const groupWidth = totalWidth / totalBars;
  return 50 + (index * groupWidth);
}

function getBarY(value) {
  const max = maxDailyValue.value;
  const height = chartHeight - 60;
  return chartHeight - 30 - ((value / max) * height);
}

function getBarHeight(value) {
  const max = maxDailyValue.value;
  const height = chartHeight - 60;
  return Math.max((value / max) * height, 0);
}

// Peak hours chart helpers
function getPeakBarX(index) {
  const totalBars = peakHoursFiltered.value.length;
  const totalWidth = chartWidth - 60;
  const barSpacing = totalWidth / totalBars;
  return 45 + (index * barSpacing);
}

function getPeakBarY(value) {
  const max = maxPeakValue.value;
  return 140 - ((value / max) * 110);
}

function getPeakBarHeight(value) {
  const max = maxPeakValue.value;
  return Math.max((value / max) * 110, 0);
}

function getPeakBarColor(count) {
  const max = maxPeakValue.value;
  const intensity = count / max;
  if (intensity > 0.7) return '#EF4444';
  if (intensity > 0.4) return '#F59E0B';
  return '#4FC3F7';
}

// Monthly trend helpers
function getMonthX(index) {
  const totalPoints = charts.monthlyTrend.length;
  const width = chartWidth - 80;
  return 50 + (index * (width / Math.max(totalPoints - 1, 1)));
}

function getMonthY(value) {
  const max = maxMonthlyValue.value;
  return 150 - ((value / max) * 120);
}

// Fetch analytics data
async function fetchAnalytics() {
  loading.value = true;
  error.value = null;

  try {
    const response = await apiFactory.$_getSpecialistAnalytics(selectedPeriod.value);
    const data = response.data?.data;

    if (data) {
      stats.totalAppointments = data.summary?.totalAppointments || 0;
      stats.completedRate = data.summary?.completedRate || 0;
      stats.revenue = data.summary?.revenue || 0;
      stats.uniquePatients = data.summary?.uniquePatients || 0;

      if (data.summary?.trends) {
        stats.trends.appointments = data.summary.trends.appointments || { value: 0, direction: 'flat' };
        stats.trends.completion = data.summary.trends.completion || { value: 0, direction: 'flat' };
        stats.trends.revenue = data.summary.trends.revenue || { value: 0, direction: 'flat' };
        stats.trends.patients = data.summary.trends.patients || { value: 0, direction: 'flat' };
      }

      Object.assign(byStatus, data.byStatus || {});
      Object.assign(byChannel, data.byChannel || {});

      Object.keys(byType).forEach(key => delete byType[key]);
      Object.assign(byType, data.byType || {});

      charts.dailyTrend = data.charts?.dailyTrend || [];
      charts.peakHours = data.charts?.peakHours || [];
      charts.monthlyTrend = data.charts?.monthlyTrend || [];
      charts.revenueByChannel = data.charts?.revenueByChannel || { video: 0, audio: 0, in_person: 0 };
    }
  } catch (err) {
    console.error('Failed to fetch analytics:', err);
    error.value = 'Failed to load analytics data. Please try again.';
  } finally {
    loading.value = false;
  }
}

function exportData() {
  const csvRows = [
    ['Metric', 'Value'],
    ['Total Appointments', stats.totalAppointments],
    ['Completion Rate', `${stats.completedRate}%`],
    ['Revenue', stats.revenue],
    ['Unique Patients', stats.uniquePatients],
    [''],
    ['Status', 'Count'],
    ['Completed', byStatus.completed],
    ['Confirmed', byStatus.confirmed],
    ['Pending', byStatus.pending],
    ['Cancelled', byStatus.cancelled],
    ['No Show', byStatus.no_show],
    [''],
    ['Channel', 'Count'],
    ['Video', byChannel.video],
    ['Audio', byChannel.audio],
    ['In-Person', byChannel.in_person],
  ];

  const csvContent = csvRows.map(row => row.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `analytics-${selectedPeriod.value}-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

onMounted(() => {
  fetchAnalytics();
});
</script>

<style scoped lang="scss">
// ─── Design Tokens ─────────────────────────────────────
$sky: #4FC3F7;
$sky-light: #E1F5FE;
$sky-dark: #0288D1;
$sky-darker: #01579B;
$navy: #0F172A;
$slate: #334155;
$gray: #64748B;
$light-gray: #94A3B8;
$bg: #F8FAFC;
$emerald: #10B981;
$emerald-light: #D1FAE5;
$amber: #F59E0B;
$amber-light: #FEF3C7;
$rose: #F43F5E;
$rose-light: #FFE4E6;
$violet: #8B5CF6;
$violet-light: #EDE9FE;

@mixin glass-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);
}

// ─── Page Container ────────────────────────────────────
.sa-analytics {
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
}

// ─── Hero Section ──────────────────────────────────────
.hero {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 340px;
  align-items: center;
  background: linear-gradient(135deg, $sky 0%, $sky-dark 50%, $sky-darker 100%);
  border-radius: 28px;
  padding: 48px;
  margin-bottom: 24px;
  overflow: hidden;
  min-height: 380px;
  box-shadow:
    0 20px 60px rgba(2, 136, 209, 0.3),
    0 4px 20px rgba(0, 0, 0, 0.1);
}

.hero__content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hero__badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 24px;
  padding: 6px 16px;
  width: fit-content;
  color: white;
  font-size: 0.8125rem;
  font-weight: 500;
  letter-spacing: 0.3px;
}

.hero__badge-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: $emerald;
  animation: pulse 2s ease-in-out infinite;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    inset: -3px;
    border-radius: 50%;
    border: 1.5px solid rgba($emerald, 0.5);
    animation: pulse-ring 2s ease-in-out infinite;
  }
}

.hero__title {
  font-family: 'Poppins', system-ui, sans-serif;
  font-size: 2.75rem;
  font-weight: 800;
  color: white;
  line-height: 1.1;
  letter-spacing: -0.03em;
  margin: 0;
}

.hero__title-accent {
  display: block;
  background: linear-gradient(135deg, #ffffff 0%, rgba(255, 255, 255, 0.7) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero__subtitle {
  font-size: 1.0625rem;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.5;
  max-width: 440px;
  margin: 0;
}

// Hero Actions
.hero__actions {
  display: flex;
  gap: 10px;
  margin-top: 4px;
}

.hero-select {
  padding: 8px 14px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 10px;
  font-size: 0.8125rem;
  font-weight: 500;
  color: white;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 32px;
  transition: all 0.2s;

  option {
    background: $navy;
    color: white;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.25);
  }

  &:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.5);
  }
}

.hero-export-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 10px;
  font-size: 0.8125rem;
  font-weight: 500;
  color: white;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.25);
  }
}

// Hero Stats Bar
.hero__stats {
  display: flex;
  align-items: center;
  gap: 0;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  padding: 14px 8px;
  margin-top: 8px;
}

.hero-stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 0 12px;

  &__value {
    font-size: 1.5rem;
    font-weight: 800;
    color: white;
    letter-spacing: -0.02em;
    font-family: 'Poppins', system-ui, sans-serif;
  }

  &__label {
    font-size: 0.6875rem;
    color: rgba(255, 255, 255, 0.7);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 500;
  }

  &__trend {
    display: flex;
    align-items: center;
    gap: 3px;
    font-size: 0.6875rem;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 8px;
    margin-top: 2px;

    &.up {
      color: #86EFAC;
      background: rgba(134, 239, 172, 0.15);
    }

    &.down {
      color: #FCA5A5;
      background: rgba(252, 165, 165, 0.15);
    }

    &.flat {
      color: rgba(255, 255, 255, 0.5);
      background: rgba(255, 255, 255, 0.08);
    }
  }

  &__divider {
    width: 1px;
    height: 48px;
    background: rgba(255, 255, 255, 0.15);
    flex-shrink: 0;
  }
}

// Hero Visual (Orb)
.hero__visual {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 280px;
}

.dashboard-orb {
  position: relative;
  width: 200px;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.orb-ring {
  position: absolute;
  border-radius: 50%;
  border: 1.5px solid rgba(255, 255, 255, 0.15);

  &--1 {
    width: 200px;
    height: 200px;
    animation: spin-slow 20s linear infinite;
    border-style: dashed;
  }

  &--2 {
    width: 160px;
    height: 160px;
    animation: spin-slow 15s linear infinite reverse;
    border-color: rgba(255, 255, 255, 0.1);
  }

  &--3 {
    width: 120px;
    height: 120px;
    animation: spin-slow 10s linear infinite;
    border-color: rgba(255, 255, 255, 0.2);
    border-style: dotted;
  }
}

.orb-core {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  z-index: 2;
  animation: pulse-glow 3s ease-in-out infinite;
}

.floating-icon {
  position: absolute;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  animation: float 6s ease-in-out infinite;

  &--1 {
    top: 10px;
    right: 40px;
    animation-delay: 0s;
  }

  &--2 {
    bottom: 20px;
    left: 20px;
    animation-delay: -2s;
  }

  &--3 {
    top: 50%;
    right: 10px;
    animation-delay: -4s;
  }
}

// ─── Animations ────────────────────────────────────────
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.1); }
}

@keyframes pulse-ring {
  0% { transform: scale(1); opacity: 0.6; }
  100% { transform: scale(2.5); opacity: 0; }
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 20px rgba(255, 255, 255, 0.2); }
  50% { box-shadow: 0 0 40px rgba(255, 255, 255, 0.4); }
}

@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

// ─── Bento Grid ────────────────────────────────────────
.bento-row {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;

  &--charts {
    > .bento-card {
      flex: 1;
      min-width: 0;
    }
  }

  &--tables {
    > .bento-card {
      flex: 1;
      min-width: 0;
    }
  }
}

.bento-card {
  @include glass-card;
  border-radius: 20px;
  padding: 24px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04);
  }
}

// ─── Card Header ───────────────────────────────────────
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 8px;

  &__left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  h3 {
    font-size: 1rem;
    font-weight: 700;
    color: $navy;
    margin: 0;
    font-family: 'Poppins', system-ui, sans-serif;
  }
}

.card-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &--sky {
    background: $sky-light;
    color: $sky-dark;
  }

  &--emerald {
    background: $emerald-light;
    color: $emerald;
  }

  &--amber {
    background: $amber-light;
    color: $amber;
  }

  &--violet {
    background: $violet-light;
    color: $violet;
  }

  &--rose {
    background: $rose-light;
    color: $rose;
  }
}

.card-subtitle {
  font-size: 0.75rem;
  color: $light-gray;
  font-weight: 500;
}

// ─── Loading / Error States ────────────────────────────
.loading-card,
.error-card {
  margin-bottom: 20px;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;

  p {
    margin: 1rem 0 0;
    color: $gray;
    font-size: 0.9375rem;
  }
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #E2E8F0;
  border-top-color: $sky;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.error-state svg {
  color: $rose;
}

.btn-retry {
  margin-top: 1rem;
  padding: 0.625rem 1.75rem;
  background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.875rem;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba($sky-dark, 0.3);
  }
}

// ─── Chart Containers ──────────────────────────────────
.chart-container {
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: $light-gray;

  svg {
    margin-bottom: 0.5rem;
    opacity: 0.4;
  }

  p {
    font-size: 0.875rem;
    margin: 0;
  }
}

.bar-chart,
.peak-chart,
.line-chart {
  width: 100%;
  height: auto;
}

// ─── Chart Interactions ────────────────────────────────
.bar-group,
.point-group {
  .chart-bar,
  .data-point {
    transition: opacity 0.2s;
  }

  &:hover {
    .chart-bar,
    .data-point {
      opacity: 0.8;
    }
  }
}

.hover-area {
  cursor: pointer;
}

// ─── Chart Legend ───────────────────────────────────────
.chart-legend,
.line-legend {
  display: flex;
  gap: 1rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: $gray;
  font-weight: 500;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;

  &--completed { background: #22C55E; }
  &--cancelled { background: #EF4444; }
}

.line-legend {
  margin-top: 12px;
  justify-content: center;
}

// ─── Donut Chart ───────────────────────────────────────
.donut-container {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.donut-wrapper {
  flex-shrink: 0;
}

.donut-chart {
  width: 160px;
  height: 160px;
}

.donut-segment {
  transition: opacity 0.2s;
  cursor: pointer;

  &:hover {
    opacity: 0.8;
  }
}

.donut-legend {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.legend-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 4px;
  flex-shrink: 0;
}

.legend-text {
  font-size: 0.8125rem;
  color: $gray;
  min-width: 60px;
}

.legend-value {
  font-size: 0.8125rem;
  font-weight: 700;
  color: $navy;
}

// ─── Tooltip ───────────────────────────────────────────
.chart-tooltip {
  position: fixed;
  z-index: 1000;
  pointer-events: none;
  transform: translate(-50%, -100%);
}

.tooltip-content {
  background: $navy;
  color: white;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  min-width: 140px;

  &::after {
    content: '';
    position: absolute;
    bottom: -6px;
    left: 50%;
    transform: translateX(-50%);
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-top: 6px solid $navy;
  }
}

.tooltip-title {
  font-size: 0.75rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: rgba(255, 255, 255, 0.8);
}

.tooltip-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  margin-top: 0.25rem;
}

.tooltip-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.tooltip-label {
  color: rgba(255, 255, 255, 0.7);
}

.tooltip-value {
  font-weight: 600;
  margin-left: auto;
}

// ─── Breakdown Tables ──────────────────────────────────
.table-card {
  .card-header {
    margin-bottom: 16px;
  }
}

.breakdown-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.breakdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.breakdown-label {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8125rem;
  color: $slate;
  font-weight: 500;
  min-width: 0;

  svg {
    color: $sky;
    flex-shrink: 0;
  }
}

.breakdown-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.breakdown-value {
  font-size: 0.875rem;
  font-weight: 700;
  color: $navy;
  min-width: 32px;
  text-align: right;
}

.breakdown-bar-wrap {
  width: 60px;
  height: 6px;
  background: #F1F5F9;
  border-radius: 3px;
  overflow: hidden;
  flex-shrink: 0;
}

.breakdown-bar {
  height: 100%;
  border-radius: 3px;
  transition: width 0.6s ease;
  min-width: 2px;
}

.breakdown-percent {
  font-size: 0.75rem;
  color: $light-gray;
  min-width: 36px;
  text-align: right;
  font-weight: 500;
}

.empty-types {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.5rem;
  text-align: center;
  color: $light-gray;

  svg {
    opacity: 0.4;
    margin-bottom: 0.5rem;
  }

  p {
    font-size: 0.875rem;
    margin: 0;
  }
}

// ─── Responsive ────────────────────────────────────────
@media (max-width: 1023px) {
  .hero {
    grid-template-columns: 1fr;
    padding: 32px 24px;
    min-height: auto;
    border-radius: 20px;
  }

  .hero__visual {
    display: none;
  }

  .hero__title {
    font-size: 2rem;
  }

  .hero__stats {
    flex-wrap: wrap;
    gap: 0;
  }

  .hero-stat {
    flex: 0 0 50%;
    padding: 10px 8px;

    &__divider {
      display: none;
    }
  }

  .bento-row {
    flex-direction: column;

    &--charts,
    &--tables {
      > .bento-card {
        flex: none;
      }
    }
  }

  .donut-container {
    flex-direction: column;
  }
}

@media (max-width: 640px) {
  .hero {
    padding: 24px 20px;
    border-radius: 16px;
    margin-bottom: 16px;
  }

  .hero__title {
    font-size: 1.625rem;
  }

  .hero__subtitle {
    font-size: 0.9375rem;
  }

  .hero__actions {
    flex-direction: column;
    gap: 8px;
  }

  .hero-select,
  .hero-export-btn {
    width: 100%;
    justify-content: center;
  }

  .hero-stat {
    flex: 0 0 50%;

    &__value {
      font-size: 1.125rem;
    }
  }

  .bento-card {
    padding: 16px;
    border-radius: 16px;
  }

  .bento-row {
    gap: 12px;
    margin-bottom: 12px;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .chart-legend {
    margin-top: 0;
  }

  .breakdown-bar-wrap {
    display: none;
  }
}

@media (max-width: 480px) {
  .hero__title {
    font-size: 1.375rem;
  }

  .hero-stat__value {
    font-size: 1rem;
  }

  .hero-stat__label {
    font-size: 0.625rem;
  }
}
</style>
