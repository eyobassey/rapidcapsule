<template>
  <div class="sa-analytics">
    <!-- Mobile Page Header -->
    <div class="mobile-page-header">
      <router-link to="/app/specialist/appointments-v2" class="back-btn">
        <v-icon name="hi-arrow-left" scale="1" />
      </router-link>
      <h1>Analytics</h1>
      <div class="header-spacer"></div>
    </div>

    <!-- Desktop Header -->
    <div class="analytics-header desktop-header">
      <div class="header-left">
        <h1 class="page-title">Analytics</h1>
        <p class="page-subtitle">Track your appointment performance</p>
      </div>
      <div class="header-actions">
        <select v-model="selectedPeriod" class="period-select" @change="fetchAnalytics">
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
          <option value="1y">Last Year</option>
        </select>
        <button class="btn-export" @click="exportData">
          <v-icon name="hi-download" scale="0.9" />
          <span>Export</span>
        </button>
      </div>
    </div>

    <!-- Mobile Filter Row -->
    <div class="mobile-filter-row">
      <select v-model="selectedPeriod" class="period-select" @change="fetchAnalytics">
        <option value="7d">Last 7 Days</option>
        <option value="30d">Last 30 Days</option>
        <option value="90d">Last 90 Days</option>
        <option value="1y">Last Year</option>
      </select>
      <button class="btn-export-icon" @click="exportData">
        <v-icon name="hi-download" scale="1" />
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading analytics...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <v-icon name="hi-exclamation-circle" scale="2" />
      <p>{{ error }}</p>
      <button class="btn-retry" @click="fetchAnalytics">Try Again</button>
    </div>

    <!-- Analytics Content -->
    <template v-else>
      <!-- Stats Overview -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon appointments">
            <v-icon name="hi-calendar" scale="1.2" />
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats.totalAppointments }}</span>
            <span class="stat-label">Total Appointments</span>
          </div>
          <div class="stat-trend" :class="stats.trends.appointments.direction">
            <v-icon :name="getTrendIcon(stats.trends.appointments.direction)" scale="0.7" />
            <span>{{ formatTrend(stats.trends.appointments) }}</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon completed">
            <v-icon name="hi-check-circle" scale="1.2" />
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats.completedRate }}%</span>
            <span class="stat-label">Completion Rate</span>
          </div>
          <div class="stat-trend" :class="stats.trends.completion.direction">
            <v-icon :name="getTrendIcon(stats.trends.completion.direction)" scale="0.7" />
            <span>{{ formatTrend(stats.trends.completion) }}</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon revenue">
            <v-icon name="hi-currency-dollar" scale="1.2" />
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ formatCurrency(stats.revenue) }}</span>
            <span class="stat-label">Revenue</span>
          </div>
          <div class="stat-trend" :class="stats.trends.revenue.direction">
            <v-icon :name="getTrendIcon(stats.trends.revenue.direction)" scale="0.7" />
            <span>{{ formatTrend(stats.trends.revenue) }}</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon patients">
            <v-icon name="hi-user-group" scale="1.2" />
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats.uniquePatients }}</span>
            <span class="stat-label">Unique Patients</span>
          </div>
          <div class="stat-trend" :class="stats.trends.patients.direction">
            <v-icon :name="getTrendIcon(stats.trends.patients.direction)" scale="0.7" />
            <span>{{ formatTrend(stats.trends.patients) }}</span>
          </div>
        </div>
      </div>

      <!-- Charts Section - Row 1 -->
      <div class="charts-grid">
        <!-- Appointments Over Time -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>Appointments Over Time</h3>
            <div class="chart-legend">
              <span class="legend-item"><span class="dot completed"></span> Completed</span>
              <span class="legend-item"><span class="dot cancelled"></span> Cancelled</span>
            </div>
          </div>
          <div class="chart-container" ref="dailyChartContainer">
            <svg v-if="charts.dailyTrend.length" class="bar-chart" :viewBox="`0 0 ${chartWidth} ${chartHeight}`" preserveAspectRatio="xMidYMid meet">
              <!-- Y-axis lines -->
              <line v-for="(tick, i) in yAxisTicks" :key="'y-' + i"
                :x1="40" :y1="tick.y" :x2="chartWidth - 10" :y2="tick.y"
                stroke="#E2E8F0" stroke-dasharray="4"/>
              <text v-for="(tick, i) in yAxisTicks" :key="'yt-' + i"
                :x="35" :y="tick.y + 4" text-anchor="end" fill="#94A3B8" font-size="10">{{ tick.label }}</text>

              <!-- Bars with hover areas -->
              <g v-for="(day, i) in charts.dailyTrend" :key="'bar-' + i" class="bar-group">
                <!-- Invisible hover area -->
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
                <!-- Completed bar -->
                <rect
                  :x="getBarX(i)"
                  :y="getBarY(day.completed)"
                  :width="barWidth"
                  :height="getBarHeight(day.completed)"
                  fill="#22C55E"
                  rx="2"
                  class="chart-bar"
                />
                <!-- Cancelled bar -->
                <rect
                  :x="getBarX(i) + barWidth + 2"
                  :y="getBarY(day.cancelled)"
                  :width="barWidth"
                  :height="getBarHeight(day.cancelled)"
                  fill="#EF4444"
                  rx="2"
                  class="chart-bar"
                />
                <!-- X-axis label -->
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
        <div class="chart-card">
          <div class="chart-header">
            <h3>Revenue by Channel</h3>
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

      <!-- Charts Section - Row 2 -->
      <div class="charts-grid">
        <!-- Peak Hours Chart -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>Peak Hours</h3>
            <span class="chart-subtitle">Busiest appointment times</span>
          </div>
          <div class="chart-container">
            <svg v-if="charts.peakHours.length" class="peak-chart" :viewBox="`0 0 ${chartWidth} 180`" preserveAspectRatio="xMidYMid meet">
              <!-- Hour bars -->
              <g v-for="(hour, i) in peakHoursFiltered" :key="'peak-' + i" class="bar-group">
                <!-- Hover area -->
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
        <div class="chart-card">
          <div class="chart-header">
            <h3>Monthly Trends</h3>
            <span class="chart-subtitle">6-month overview</span>
          </div>
          <div class="chart-container">
            <svg v-if="charts.monthlyTrend.length" class="line-chart" :viewBox="`0 0 ${chartWidth} 180`" preserveAspectRatio="xMidYMid meet">
              <!-- Grid lines -->
              <line v-for="(tick, i) in monthlyYTicks" :key="'my-' + i"
                :x1="40" :y1="tick.y" :x2="chartWidth - 10" :y2="tick.y"
                stroke="#E2E8F0" stroke-dasharray="4"/>
              <text v-for="(tick, i) in monthlyYTicks" :key="'myt-' + i"
                :x="35" :y="tick.y + 4" text-anchor="end" fill="#94A3B8" font-size="10">{{ tick.label }}</text>

              <!-- Line path for total -->
              <polyline
                :points="monthlyTotalPoints"
                fill="none"
                stroke="#4FC3F7"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <!-- Line path for completed -->
              <polyline
                :points="monthlyCompletedPoints"
                fill="none"
                stroke="#22C55E"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />

              <!-- Data points with hover -->
              <g v-for="(month, i) in charts.monthlyTrend" :key="'mp-' + i" class="point-group">
                <!-- Hover area -->
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

      <!-- Breakdown Tables -->
      <div class="tables-grid">
        <!-- By Status -->
        <div class="table-card">
          <h3>By Status</h3>
          <div class="breakdown-list">
            <div class="breakdown-item">
              <span class="breakdown-label">
                <span class="dot completed"></span>
                Completed
              </span>
              <span class="breakdown-value">{{ byStatus.completed }}</span>
              <span class="breakdown-percent">{{ getPercent(byStatus.completed) }}%</span>
            </div>
            <div class="breakdown-item">
              <span class="breakdown-label">
                <span class="dot confirmed"></span>
                Confirmed
              </span>
              <span class="breakdown-value">{{ byStatus.confirmed }}</span>
              <span class="breakdown-percent">{{ getPercent(byStatus.confirmed) }}%</span>
            </div>
            <div class="breakdown-item">
              <span class="breakdown-label">
                <span class="dot pending"></span>
                Pending
              </span>
              <span class="breakdown-value">{{ byStatus.pending }}</span>
              <span class="breakdown-percent">{{ getPercent(byStatus.pending) }}%</span>
            </div>
            <div class="breakdown-item">
              <span class="breakdown-label">
                <span class="dot cancelled"></span>
                Cancelled
              </span>
              <span class="breakdown-value">{{ byStatus.cancelled }}</span>
              <span class="breakdown-percent">{{ getPercent(byStatus.cancelled) }}%</span>
            </div>
            <div class="breakdown-item">
              <span class="breakdown-label">
                <span class="dot no-show"></span>
                No Show
              </span>
              <span class="breakdown-value">{{ byStatus.no_show }}</span>
              <span class="breakdown-percent">{{ getPercent(byStatus.no_show) }}%</span>
            </div>
          </div>
        </div>

        <!-- By Channel -->
        <div class="table-card">
          <h3>By Channel</h3>
          <div class="breakdown-list">
            <div class="breakdown-item">
              <span class="breakdown-label">
                <v-icon name="hi-video-camera" scale="0.8" />
                Video
              </span>
              <span class="breakdown-value">{{ byChannel.video }}</span>
              <span class="breakdown-percent">{{ getChannelPercent(byChannel.video) }}%</span>
            </div>
            <div class="breakdown-item">
              <span class="breakdown-label">
                <v-icon name="hi-phone" scale="0.8" />
                Audio
              </span>
              <span class="breakdown-value">{{ byChannel.audio }}</span>
              <span class="breakdown-percent">{{ getChannelPercent(byChannel.audio) }}%</span>
            </div>
            <div class="breakdown-item">
              <span class="breakdown-label">
                <v-icon name="hi-office-building" scale="0.8" />
                In-Person
              </span>
              <span class="breakdown-value">{{ byChannel.in_person }}</span>
              <span class="breakdown-percent">{{ getChannelPercent(byChannel.in_person) }}%</span>
            </div>
          </div>
        </div>

        <!-- Top Appointment Types -->
        <div class="table-card">
          <h3>Top Appointment Types</h3>
          <div class="breakdown-list">
            <div v-for="(count, type) in byType" :key="type" class="breakdown-item">
              <span class="breakdown-label">{{ type }}</span>
              <span class="breakdown-value">{{ count }}</span>
              <span class="breakdown-percent">{{ getTypePercent(count) }}%</span>
            </div>
            <div v-if="Object.keys(byType).length === 0" class="empty-types">
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
@import './styles/sa-variables';

.sa-analytics {
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
}

// Mobile Page Header
.mobile-page-header {
  display: none;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 0;
  margin-bottom: 1rem;
  border-bottom: 1px solid #E2E8F0;

  h1 {
    font-size: 1.125rem;
    font-weight: 600;
    color: $sa-navy;
    margin: 0;
  }

  .back-btn {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #F1F5F9;
    border-radius: 8px;
    color: $sa-navy;
    text-decoration: none;

    &:active {
      background: #E2E8F0;
    }
  }

  .header-spacer {
    width: 36px;
  }
}

// Desktop Header
.desktop-header {
  display: flex;
}

.analytics-header {
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: $sa-navy;
  margin: 0;
}

.page-subtitle {
  font-size: 0.875rem;
  color: $sa-text-secondary;
  margin: 0.25rem 0 0;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

// Mobile Filter Row
.mobile-filter-row {
  display: none;
  gap: 0.75rem;
  margin-bottom: 1rem;

  .period-select {
    flex: 1;
  }
}

.btn-export-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 0.5rem;
  color: $sa-text-secondary;
  cursor: pointer;

  &:active {
    background: #F1F5F9;
  }
}

.period-select {
  padding: 0.625rem 1rem;
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  color: $sa-navy;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: $sa-sky;
  }
}

.btn-export {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 0.5rem;
  color: $sa-text-secondary;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: $sa-sky;
    color: $sa-sky;
  }
}

// Loading & Error States
.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 0.75rem;

  p {
    margin: 1rem 0 0;
    color: $sa-text-secondary;
  }
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #E2E8F0;
  border-top-color: $sa-sky;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-state svg {
  color: #EF4444;
}

.btn-retry {
  margin-top: 1rem;
  padding: 0.5rem 1.5rem;
  background: $sa-sky;
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 500;

  &:hover {
    background: darken($sa-sky, 10%);
  }
}

// Stats Grid
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 0.75rem;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &.appointments {
    background: $sa-sky-light;
    color: $sa-sky;
  }

  &.completed {
    background: #DCFCE7;
    color: #166534;
  }

  &.revenue {
    background: #FEF3C7;
    color: #92400E;
  }

  &.patients {
    background: #F3E8FF;
    color: #7C3AED;
  }
}

.stat-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: $sa-navy;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stat-label {
  font-size: 0.8125rem;
  color: $sa-text-secondary;
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  flex-shrink: 0;

  &.up { color: #16A34A; }
  &.down { color: #DC2626; }
  &.flat { color: #94A3B8; }
}

// Charts Grid
.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.chart-card {
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 0.75rem;
  padding: 1.25rem;
}

.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 0.5rem;

  h3 {
    font-size: 1rem;
    font-weight: 600;
    color: $sa-navy;
    margin: 0;
  }
}

.chart-subtitle {
  font-size: 0.75rem;
  color: $sa-text-secondary;
}

.chart-legend,
.line-legend {
  display: flex;
  gap: 1rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  color: $sa-text-secondary;

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;

    &.completed { background: #22C55E; }
    &.cancelled { background: #EF4444; }
  }
}

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
  color: $sa-text-secondary;

  svg {
    margin-bottom: 0.5rem;
    opacity: 0.5;
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

// Chart interactions
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

// Donut chart
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
  border-radius: 3px;
  flex-shrink: 0;
}

.legend-text {
  font-size: 0.8125rem;
  color: $sa-text-secondary;
  min-width: 60px;
}

.legend-value {
  font-size: 0.8125rem;
  font-weight: 600;
  color: $sa-navy;
}

// Tooltip
.chart-tooltip {
  position: fixed;
  z-index: 1000;
  pointer-events: none;
  transform: translate(-50%, -100%);
}

.tooltip-content {
  background: $sa-navy;
  color: white;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 140px;

  &::after {
    content: '';
    position: absolute;
    bottom: -6px;
    left: 50%;
    transform: translateX(-50%);
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-top: 6px solid $sa-navy;
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

// Tables Grid
.tables-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.table-card {
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 0.75rem;
  padding: 1.25rem;

  h3 {
    font-size: 1rem;
    font-weight: 600;
    color: $sa-navy;
    margin: 0 0 1rem;
  }
}

.breakdown-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.breakdown-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.breakdown-label {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: $sa-text-secondary;

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;

    &.completed { background: #22C55E; }
    &.confirmed { background: #4FC3F7; }
    &.pending { background: #F59E0B; }
    &.cancelled { background: #EF4444; }
    &.no-show { background: #8B5CF6; }
  }

  svg {
    color: $sa-sky;
  }
}

.breakdown-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: $sa-navy;
  min-width: 40px;
  text-align: right;
}

.breakdown-percent {
  font-size: 0.75rem;
  color: $sa-text-secondary;
  min-width: 40px;
  text-align: right;
}

.empty-types {
  padding: 1rem;
  text-align: center;
  color: $sa-text-secondary;
  font-size: 0.875rem;
}

// Responsive
@media (max-width: 1023px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .charts-grid {
    grid-template-columns: 1fr;
  }

  .tables-grid {
    grid-template-columns: 1fr;
  }

  .desktop-header {
    display: none;
  }

  .mobile-page-header {
    display: flex;
  }

  .mobile-filter-row {
    display: flex;
  }

  .donut-container {
    flex-direction: column;
  }
}

@media (max-width: 640px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .stat-card {
    padding: 1rem;
  }

  .stat-icon {
    width: 40px;
    height: 40px;
  }

  .stat-value {
    font-size: 1.25rem;
  }

  .chart-card {
    padding: 1rem;
  }

  .chart-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .chart-legend {
    margin-top: 0.5rem;
  }
}
</style>
