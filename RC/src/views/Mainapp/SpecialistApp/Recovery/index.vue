<template>
  <div class="recovery-overview">
    <!-- Hero Section -->
    <section v-if="!selectedPatientId" class="hero">
      <div class="hero__content">
        <div class="hero__badge">
          <div class="badge-pulse" :class="`badge-pulse--${alertLevel}`"></div>
          <v-icon name="hi-heart" />
          <span>Recovery Programme</span>
        </div>
        <h1 class="hero__title">
          Recovery<br/>
          <span class="hero__title-accent">Overview</span>
        </h1>
        <p class="hero__subtitle">
          Monitor all recovery patients, track risk levels, and identify patients needing attention.
        </p>
        <div class="hero__stats" v-if="overview.stats">
          <div class="hero-stat">
            <span class="hero-stat__value">{{ overview.stats.total }}</span>
            <span class="hero-stat__label">Patients</span>
          </div>
          <div class="hero-stat__divider"></div>
          <div class="hero-stat">
            <span class="hero-stat__value hero-stat__value--warning">{{ overview.stats.high_risk }}</span>
            <span class="hero-stat__label">High Risk</span>
          </div>
          <div class="hero-stat__divider"></div>
          <div class="hero-stat">
            <span class="hero-stat__value hero-stat__value--danger">{{ overview.stats.critical }}</span>
            <span class="hero-stat__label">Critical</span>
          </div>
          <div class="hero-stat__divider"></div>
          <div class="hero-stat">
            <span class="hero-stat__value">{{ overview.stats.avg_score }}<small>/100</small></span>
            <span class="hero-stat__label">Avg Score</span>
          </div>
          <div class="hero-stat__divider"></div>
          <div class="hero-stat">
            <span class="hero-stat__value hero-stat__value--success">{{ overview.stats.checkin_rate }}%</span>
            <span class="hero-stat__label">Check-in</span>
          </div>
        </div>
      </div>
      <div class="hero__visual">
        <div class="dashboard-orb">
          <div class="orb-ring orb-ring--1"></div>
          <div class="orb-ring orb-ring--2"></div>
          <div class="orb-ring orb-ring--3"></div>
          <div class="orb-core">
            <v-icon name="hi-heart" scale="2" />
          </div>
        </div>
      </div>
    </section>

    <!-- Alert Banner -->
    <div v-if="!selectedPatientId && overduePatients.length" class="alert-banner">
      <v-icon name="hi-exclamation-circle" scale="1.1" />
      <div class="alert-banner__text">
        <strong>{{ overduePatients.length }} patient{{ overduePatients.length !== 1 ? 's' : '' }}</strong>
        {{ overduePatients.length !== 1 ? 'have' : 'has' }} not checked in for 3+ days.
        <span v-if="criticalOverdue.length" class="alert-banner__critical">
          {{ criticalOverdue.length }} at critical/high risk.
        </span>
      </div>
    </div>

    <!-- Distribution + Filters Row -->
    <div v-if="!selectedPatientId" class="controls-row">
      <!-- Risk Distribution Chart -->
      <div class="bento-card distribution-card" v-if="overview.distribution">
        <div class="distribution-card__header">
          <h3>Risk Distribution</h3>
        </div>
        <div class="distribution-card__chart">
          <canvas ref="donutCanvas"></canvas>
        </div>
        <div class="distribution-card__legend">
          <div class="legend-item" v-for="item in distributionLegend" :key="item.label">
            <span class="legend-dot" :style="{ background: item.color }"></span>
            <span class="legend-label">{{ item.label }}</span>
            <span class="legend-count">{{ item.count }}</span>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="bento-card filter-card">
        <div class="filter-card__header">
          <h3>Filters</h3>
          <button v-if="hasActiveFilter" class="filter-card__clear" @click="clearFilters">Clear all</button>
        </div>
        <div class="filter-group">
          <label>Risk Level</label>
          <div class="filter-chips">
            <button
              v-for="level in riskLevels"
              :key="level.value"
              class="filter-chip"
              :class="{ 'filter-chip--active': activeRiskLevel === level.value, [`filter-chip--${level.value}`]: activeRiskLevel === level.value }"
              @click="toggleRiskLevel(level.value)"
            >
              {{ level.label }}
            </button>
          </div>
        </div>
        <div class="filter-group">
          <label>Check-in Status</label>
          <div class="filter-chips">
            <button
              v-for="status in checkinStatuses"
              :key="status.value"
              class="filter-chip"
              :class="{ 'filter-chip--active': activeCheckinStatus === status.value }"
              @click="toggleCheckinStatus(status.value)"
            >
              {{ status.label }}
            </button>
          </div>
        </div>
        <div class="filter-group">
          <label>Search</label>
          <div class="search-input-wrapper">
            <v-icon name="hi-search" scale="0.8" class="search-icon" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search by name..."
              @input="debouncedSearch"
            />
            <button v-if="searchQuery" class="clear-btn" @click="searchQuery = ''; fetchData()">
              <v-icon name="hi-x" scale="0.7" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Patient List -->
    <div v-if="!loading && !selectedPatientId && filteredPatients.length" class="patient-list">
      <div class="patient-list__header">
        <h3>Recovery Patients</h3>
        <span class="patient-list__count">{{ filteredPatients.length }} patient{{ filteredPatients.length !== 1 ? 's' : '' }}</span>
      </div>
      <div class="patient-grid">
        <div
          v-for="patient in filteredPatients"
          :key="patient.user_id"
          class="patient-card"
          @click="selectPatient(patient)"
        >
          <div class="patient-card__top">
            <div class="patient-card__avatar">
              <img v-if="patient.avatar" :src="patient.avatar" :alt="patient.name" />
              <v-icon v-else name="hi-user-circle" scale="2" />
            </div>
            <div class="patient-card__info">
              <span class="patient-card__name">{{ patient.name }}</span>
              <span class="patient-card__substance" v-if="patient.primary_substance">{{ patient.primary_substance }}</span>
            </div>
            <div class="patient-card__risk-gauge">
              <div class="mini-gauge" :class="`mini-gauge--${patient.risk_level}`">
                <span class="mini-gauge__score">{{ patient.risk_score }}</span>
              </div>
              <span class="patient-card__risk-badge" :class="`risk--${patient.risk_level}`">
                {{ patient.risk_level }}
              </span>
            </div>
          </div>

          <div class="patient-card__metrics">
            <div class="metric">
              <v-icon name="hi-calendar" scale="0.65" />
              <span>{{ patient.sobriety_days }}d sober</span>
            </div>
            <div class="metric" :class="{ 'metric--overdue': isOverdue(patient) }">
              <v-icon name="hi-clock" scale="0.65" />
              <span>{{ checkinLabel(patient) }}</span>
            </div>
            <div class="metric" v-if="patient.last_checkin_mood">
              <v-icon name="hi-emoji-happy" scale="0.65" />
              <span>Mood {{ patient.last_checkin_mood }}/10</span>
            </div>
          </div>

          <div class="patient-card__footer">
            <span class="patient-card__care-level" v-if="patient.care_level">{{ patient.care_level }}</span>
            <span v-if="patient.last_screening_risk" class="patient-card__screening">
              {{ (patient.last_screening_instrument || '').toUpperCase() }}: {{ patient.last_screening_risk }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Patient Detail Panel (inline) -->
    <div v-if="selectedPatientId" class="patient-detail-panel">
      <div class="detail-panel__header">
        <button class="detail-panel__back" @click="deselectPatient">
          <v-icon name="hi-arrow-left" scale="0.9" />
          <span>Back to Patient List</span>
        </button>
        <div class="detail-panel__patient-info">
          <div class="detail-panel__avatar">
            <img v-if="selectedPatientAvatar" :src="selectedPatientAvatar" :alt="selectedPatientName" />
            <v-icon v-else name="hi-user-circle" scale="1.8" />
          </div>
          <div>
            <h3 class="detail-panel__name">{{ selectedPatientName }}</h3>
            <div class="detail-panel__meta">
              <span v-if="selectedPatientRisk" :class="['detail-panel__risk-badge', `risk--${selectedPatientRisk.level}`]">
                {{ selectedPatientRisk.level }} &middot; {{ selectedPatientRisk.score }}/100
              </span>
              <button class="detail-panel__full-profile" @click="viewFullProfile(selectedPatientId)">
                <v-icon name="hi-external-link" scale="0.65" />
                Full Profile
              </button>
            </div>
          </div>
        </div>
      </div>
      <div class="detail-panel__content">
        <PatientRecoveryTab :patient-id="selectedPatientId" :key="selectedPatientId" />
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!loading && !selectedPatientId && !filteredPatients.length" class="empty-state">
      <div class="empty-state__icon">
        <v-icon name="hi-heart" scale="2.5" />
      </div>
      <h3>{{ hasActiveFilter ? 'No matching patients' : 'No recovery patients yet' }}</h3>
      <p>{{ hasActiveFilter ? 'Try adjusting your filters to see more results.' : 'When your patients enrol in the recovery programme, they\'ll appear here.' }}</p>
      <button v-if="hasActiveFilter" class="empty-state__btn" @click="clearFilters">
        <v-icon name="hi-refresh" scale="0.7" />
        Clear Filters
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="loading-state__spinner"></div>
      <p>Loading recovery overview...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted, nextTick } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toast-notification";
import Chart from "chart.js/auto";
import PatientRecoveryTab from "@/views/Mainapp/SpecialistApp/Pharmacy/components/PatientRecoveryTab.vue";

const $http = inject("$http");
const $toast = useToast();
const router = useRouter();

const loading = ref(true);
const overview = ref({ stats: null, distribution: null, patients: [] });
const donutCanvas = ref(null);
let donutChart = null;

const activeRiskLevel = ref("");
const activeCheckinStatus = ref("");
const searchQuery = ref("");
let searchTimeout = null;

// Selected patient for inline detail view
const selectedPatientId = ref(null);
const selectedPatientName = ref("");
const selectedPatientAvatar = ref(null);
const selectedPatientRisk = ref(null);

const riskLevels = [
  { value: "low", label: "Low" },
  { value: "moderate", label: "Moderate" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

const checkinStatuses = [
  { value: "today", label: "Today" },
  { value: "this_week", label: "This Week" },
  { value: "overdue", label: "Overdue" },
];

const filteredPatients = computed(() => overview.value.patients || []);

const hasActiveFilter = computed(() =>
  activeRiskLevel.value || activeCheckinStatus.value || searchQuery.value
);

const alertLevel = computed(() => {
  if (overview.value.stats?.critical > 0) return "critical";
  if (overview.value.stats?.high_risk > 0) return "high";
  return "low";
});

const overduePatients = computed(() => {
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  return (overview.value.patients || []).filter((p) => {
    if (!p.last_checkin) return true;
    return new Date(p.last_checkin) < threeDaysAgo;
  });
});

const criticalOverdue = computed(() =>
  overduePatients.value.filter((p) => p.risk_level === "critical" || p.risk_level === "high")
);

const distributionLegend = computed(() => {
  const d = overview.value.distribution;
  if (!d) return [];
  return [
    { label: "Low", count: d.low, color: "#10B981" },
    { label: "Moderate", count: d.moderate, color: "#F59E0B" },
    { label: "High", count: d.high, color: "#FB923C" },
    { label: "Critical", count: d.critical, color: "#F43F5E" },
  ];
});

function toggleRiskLevel(level) {
  activeRiskLevel.value = activeRiskLevel.value === level ? "" : level;
  fetchData();
}

function toggleCheckinStatus(status) {
  activeCheckinStatus.value = activeCheckinStatus.value === status ? "" : status;
  fetchData();
}

function clearFilters() {
  activeRiskLevel.value = "";
  activeCheckinStatus.value = "";
  searchQuery.value = "";
  fetchData();
}

function debouncedSearch() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => fetchData(), 400);
}

function isOverdue(patient) {
  if (!patient.last_checkin) return true;
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  return new Date(patient.last_checkin) < threeDaysAgo;
}

function checkinLabel(patient) {
  if (!patient.last_checkin) return "No check-in";
  const d = new Date(patient.last_checkin);
  const now = new Date();
  const diffMs = now - d;
  const diffH = Math.floor(diffMs / 3600000);
  if (diffH < 24) return diffH < 1 ? "Just now" : `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  return diffD === 1 ? "Yesterday" : `${diffD}d ago`;
}

function selectPatient(patient) {
  selectedPatientId.value = patient.user_id;
  selectedPatientName.value = patient.name;
  selectedPatientAvatar.value = patient.avatar;
  selectedPatientRisk.value = { score: patient.risk_score, level: patient.risk_level };
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deselectPatient() {
  selectedPatientId.value = null;
  selectedPatientName.value = "";
  selectedPatientAvatar.value = null;
  selectedPatientRisk.value = null;
}

function viewFullProfile(userId) {
  router.push(`/app/specialist/pharmacy/patients/${userId}?tab=recovery`);
}

function renderDonut() {
  if (!donutCanvas.value || !overview.value.distribution) return;
  if (donutChart) donutChart.destroy();

  const d = overview.value.distribution;
  const data = [d.low, d.moderate, d.high, d.critical];
  const total = data.reduce((a, b) => a + b, 0);
  if (total === 0) return;

  donutChart = new Chart(donutCanvas.value, {
    type: "doughnut",
    data: {
      labels: ["Low", "Moderate", "High", "Critical"],
      datasets: [{
        data,
        backgroundColor: ["#10B981", "#F59E0B", "#FB923C", "#F43F5E"],
        borderWidth: 2,
        borderColor: "#fff",
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "65%",
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(15, 23, 42, 0.9)",
          cornerRadius: 8,
          titleFont: { size: 13 },
          bodyFont: { size: 13 },
          padding: 12,
          callbacks: {
            label: (ctx) => `${ctx.label}: ${ctx.raw} patient${ctx.raw !== 1 ? 's' : ''} (${Math.round(ctx.raw / total * 100)}%)`,
          },
        },
      },
    },
  });
}

async function fetchData() {
  loading.value = true;
  try {
    const params = {};
    if (activeRiskLevel.value) params.risk_level = activeRiskLevel.value;
    if (activeCheckinStatus.value) params.checkin_status = activeCheckinStatus.value;
    if (searchQuery.value?.trim()) params.search = searchQuery.value.trim();

    const { data } = await $http.$_getSpecialistRecoveryOverview(params);
    overview.value = data.data;
  } catch {
    $toast.error("Failed to load recovery overview");
  } finally {
    loading.value = false;
    await nextTick();
    renderDonut();
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
$orange: #FB923C;
$violet: #8B5CF6;

@mixin glass-card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);
}

// ─── Page ──────────────────────────────────────────────────────────
.recovery-overview {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px 32px 100px;
  @media (max-width: 768px) { padding: 16px 16px 120px; }
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
  box-shadow: 0 20px 60px rgba($sky-dark, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1) inset;

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

  &__stats {
    display: flex; align-items: center; gap: 20px;
    padding: 16px 20px; background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px); border-radius: 16px; width: fit-content;
    @media (max-width: 768px) { width: 100%; justify-content: space-around; gap: 10px; padding: 12px 14px; }
  }

  &__visual {
    display: flex; justify-content: center; align-items: center;
    @media (max-width: 768px) { display: none; }
  }
}

.hero-stat {
  display: flex; flex-direction: column; align-items: center;
  &__value {
    font-size: 24px; font-weight: 700; line-height: 1;
    small { font-size: 13px; font-weight: 500; opacity: 0.6; }
    &--success { color: #A7F3D0; }
    &--warning { color: #FDE68A; }
    &--danger { color: #FECACA; }
    @media (max-width: 768px) { font-size: 18px; }
  }
  &__label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.7; margin-top: 4px; }
  &__divider { width: 1px; height: 32px; background: rgba(255, 255, 255, 0.2); }
}

.badge-pulse {
  width: 8px; height: 8px; border-radius: 50%; background: #86EFAC;
  &--low { background: #86EFAC; }
  &--moderate { background: $amber; }
  &--high { background: $orange; animation: pulse 1.5s infinite; }
  &--critical { background: $rose; animation: pulse 1.5s infinite; }
}

// ─── Orb ──────────────────────────────────────────────────────────
.dashboard-orb { position: relative; width: 200px; height: 200px; display: flex; align-items: center; justify-content: center; }
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
  box-shadow: 0 0 40px rgba(255, 255, 255, 0.3), 0 0 80px rgba($sky, 0.3);
  animation: pulse-glow 3s ease-in-out infinite;
}

// ─── Alert Banner ─────────────────────────────────────────────────
.alert-banner {
  display: flex; align-items: center; gap: 12px;
  padding: 16px 20px; margin-bottom: 20px;
  background: $rose-light; border: 1px solid rgba($rose, 0.2);
  border-radius: 14px; color: $rose;

  &__text {
    font-size: 14px; color: $slate;
    strong { color: $rose; }
  }

  &__critical { font-weight: 600; color: $rose; }
}

// ─── Controls Row ─────────────────────────────────────────────────
.controls-row {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 20px;
  margin-bottom: 20px;

  @media (max-width: 900px) { grid-template-columns: 1fr; }
}

.bento-card {
  @include glass-card;
  border-radius: 20px;
  padding: 20px;
}

// ─── Distribution Card ───────────────────────────────────────────
.distribution-card {
  &__header {
    h3 { font-size: 14px; font-weight: 600; color: $navy; margin: 0 0 16px; }
  }
  &__chart {
    height: 160px; position: relative; margin-bottom: 16px;

    canvas {
      width: 100% !important;
      height: 100% !important;
    }
  }
  &__legend {
    display: flex; flex-direction: column; gap: 8px;
  }
}

.legend-item {
  display: flex; align-items: center; gap: 8px; font-size: 13px;
}
.legend-dot {
  width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
}
.legend-label { flex: 1; color: $slate; }
.legend-count { font-weight: 700; color: $navy; }

// ─── Filter Card ─────────────────────────────────────────────────
.filter-card {
  &__header {
    display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;
    h3 { font-size: 14px; font-weight: 600; color: $navy; margin: 0; }
  }
  &__clear {
    font-size: 12px; color: $sky-dark; background: none; border: none; cursor: pointer;
    font-weight: 500; &:hover { text-decoration: underline; }
  }
}

.filter-group {
  margin-bottom: 14px;
  label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; color: $gray; margin-bottom: 6px; display: block; }
}

.filter-chips {
  display: flex; gap: 6px; flex-wrap: wrap;
}

.filter-chip {
  padding: 6px 14px; border-radius: 10px; font-size: 12px; font-weight: 600;
  border: 1px solid rgba(0, 0, 0, 0.08); background: $white; color: $gray;
  cursor: pointer; transition: all 0.2s;

  &:hover { border-color: $sky; color: $sky-dark; }

  &--active {
    background: $sky-light; border-color: $sky; color: $sky-dark;
    &.filter-chip--low { background: $emerald-light; border-color: $emerald; color: $emerald-dark; }
    &.filter-chip--moderate { background: $amber-light; border-color: $amber; color: darken($amber, 10%); }
    &.filter-chip--high { background: #FED7AA; border-color: $orange; color: #C2410C; }
    &.filter-chip--critical { background: $rose-light; border-color: $rose; color: $rose; }
  }
}

.search-input-wrapper {
  position: relative; display: flex; align-items: center;

  .search-icon {
    position: absolute; left: 12px; color: $light-gray; pointer-events: none;
  }

  input {
    width: 100%; padding: 10px 36px 10px 36px; border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 12px; font-size: 13px; color: $navy; background: $white;
    transition: border-color 0.2s;
    &:focus { outline: none; border-color: $sky; }
    &::placeholder { color: $light-gray; }
  }

  .clear-btn {
    position: absolute; right: 8px; width: 24px; height: 24px;
    border: none; background: rgba(0, 0, 0, 0.04); border-radius: 6px;
    display: flex; align-items: center; justify-content: center;
    color: $gray; cursor: pointer; &:hover { background: rgba(0, 0, 0, 0.08); }
  }
}

// ─── Patient List ─────────────────────────────────────────────────
.patient-list {
  &__header {
    display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;
    h3 { font-size: 16px; font-weight: 600; color: $navy; margin: 0; }
  }
  &__count { font-size: 13px; color: $gray; }
}

.patient-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 16px;
  @media (max-width: 640px) { grid-template-columns: 1fr; }
}

.patient-card {
  @include glass-card;
  border-radius: 16px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08); }

  &__top { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }

  &__avatar {
    width: 44px; height: 44px; border-radius: 50%; overflow: hidden;
    background: $bg; display: flex; align-items: center; justify-content: center; color: $light-gray; flex-shrink: 0;
    img { width: 100%; height: 100%; object-fit: cover; }
  }

  &__info { flex: 1; min-width: 0; }
  &__name { display: block; font-size: 15px; font-weight: 600; color: $navy; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  &__substance { display: block; font-size: 12px; color: $gray; text-transform: capitalize; }

  &__risk-gauge { display: flex; flex-direction: column; align-items: center; gap: 4px; }

  &__risk-badge {
    font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px;
    padding: 2px 8px; border-radius: 5px;
  }

  &__metrics {
    display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 10px;
  }

  &__footer {
    display: flex; align-items: center; gap: 8px; justify-content: space-between;
  }

  &__care-level {
    font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px;
    padding: 3px 8px; border-radius: 5px; background: rgba($violet, 0.1); color: $violet;
  }

  &__screening {
    font-size: 11px; color: $gray;
  }
}

.metric {
  display: flex; align-items: center; gap: 4px; font-size: 12px; color: $slate;
  &--overdue { color: $rose; font-weight: 600; }
}

.mini-gauge {
  width: 44px; height: 44px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-weight: 800; font-size: 14px;

  &--low { background: $emerald-light; color: $emerald-dark; }
  &--moderate { background: $amber-light; color: darken($amber, 10%); }
  &--high { background: #FED7AA; color: #C2410C; }
  &--critical { background: $rose-light; color: $rose; }

  &__score { line-height: 1; }
}

// ─── Risk Level Badges ──────────────────────────────────────────
.risk--low { background: $emerald-light; color: $emerald-dark; }
.risk--moderate { background: $amber-light; color: darken($amber, 10%); }
.risk--high { background: #FED7AA; color: #C2410C; }
.risk--critical { background: $rose-light; color: $rose; }

// ─── Patient Detail Panel ────────────────────────────────────────
.patient-detail-panel {
  animation: fadeSlideUp 0.3s ease;
}

.detail-panel {
  &__header {
    @include glass-card;
    border-radius: 20px;
    padding: 20px 24px;
    margin-bottom: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__back {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: rgba($sky, 0.08);
    border: 1px solid rgba($sky, 0.15);
    border-radius: 10px;
    font-size: 13px;
    font-weight: 600;
    color: $sky-dark;
    cursor: pointer;
    transition: all 0.2s;
    width: fit-content;

    &:hover {
      background: rgba($sky, 0.15);
      border-color: $sky;
    }
  }

  &__patient-info {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  &__avatar {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    overflow: hidden;
    background: $bg;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $light-gray;
    flex-shrink: 0;

    img { width: 100%; height: 100%; object-fit: cover; }
  }

  &__name {
    font-size: 20px;
    font-weight: 700;
    color: $navy;
    margin: 0;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 4px;
  }

  &__risk-badge {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    padding: 3px 10px;
    border-radius: 6px;
  }

  &__full-profile {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: none;
    border: none;
    font-size: 12px;
    font-weight: 600;
    color: $sky-dark;
    cursor: pointer;

    &:hover { text-decoration: underline; }
  }

  &__content {
    @include glass-card;
    border-radius: 20px;
    padding: 24px;
  }
}

@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

// ─── Empty State ────────────────────────────────────────────────
.empty-state {
  text-align: center; padding: 60px 0;

  &__icon {
    width: 72px; height: 72px; border-radius: 50%;
    background: linear-gradient(135deg, $sky-light, rgba($sky, 0.15));
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 20px; color: $sky-dark;
  }

  h3 { font-size: 18px; font-weight: 700; color: $navy; margin: 0 0 8px; }
  p { font-size: 14px; color: $gray; margin: 0 0 24px; line-height: 1.5; max-width: 400px; margin-left: auto; margin-right: auto; }

  &__btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 12px 24px; border-radius: 12px;
    background: $white; border: 1px solid rgba(0, 0, 0, 0.1);
    color: $sky-dark; font-size: 14px; font-weight: 600; cursor: pointer;
    transition: all 0.2s;
    &:hover { background: $sky-light; border-color: $sky; }
  }
}

// ─── Loading ─────────────────────────────────────────────────────
.loading-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  min-height: 400px; gap: 16px; color: $gray; font-size: 14px;

  &__spinner {
    width: 40px; height: 40px; border: 3px solid rgba($sky, 0.2);
    border-top-color: $sky; border-radius: 50%; animation: spin 0.8s linear infinite;
  }
}

// ─── Animations ──────────────────────────────────────────────────
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 40px rgba(255, 255, 255, 0.3), 0 0 80px rgba($sky, 0.3); }
  50% { box-shadow: 0 0 60px rgba(255, 255, 255, 0.4), 0 0 100px rgba($sky, 0.4); }
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
</style>
