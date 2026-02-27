<template>
  <div class="exercise-history">
    <div v-if="!showReportOverlay" class="exercise-history__content">
      <!-- Hero Section -->
      <section class="hero">
        <div class="hero__content">
          <button class="back-link" @click="$emit('back')">
            <v-icon name="hi-arrow-left" scale="0.85" />
            <span>Back</span>
          </button>
          <div class="hero__badge">
            <v-icon name="ri-heart-pulse-line" />
            <span>{{ wellnessLabel }}</span>
          </div>
          <h1 class="hero__title">
            Exercise<br/>
            <span class="hero__title-accent">History</span>
          </h1>
          <p class="hero__subtitle">{{ heroSubtitle }}</p>

          <div class="hero__actions">
            <button class="hero__cta" @click="goToEkaExercise()">
              <v-icon name="ri-heart-pulse-line" scale="0.85" />
              <span>Try an Exercise</span>
            </button>
            <div v-if="stats" class="hero__stats">
              <div class="hero-stat">
                <span class="hero-stat__value">{{ stats.total || 0 }}</span>
                <span class="hero-stat__label">Sessions</span>
              </div>
              <div class="hero-stat__divider"></div>
              <div class="hero-stat">
                <span class="hero-stat__value">{{ stats.completion_rate || 0 }}%</span>
                <span class="hero-stat__label">Completed</span>
              </div>
              <div class="hero-stat__divider"></div>
              <div class="hero-stat">
                <span class="hero-stat__value">{{ stats.current_streak || 0 }}</span>
                <span class="hero-stat__label">Day Streak</span>
              </div>
              <div class="hero-stat__divider"></div>
              <div class="hero-stat">
                <span class="hero-stat__value">{{ stats.wellness_score || 0 }}</span>
                <span class="hero-stat__label">Wellness</span>
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
              <v-icon name="ri-heart-pulse-line" scale="2" />
            </div>
          </div>
          <div class="floating-icons">
            <div class="float-icon float-icon--1"><v-icon name="fa-brain" /></div>
            <div class="float-icon float-icon--2"><v-icon name="hi-sparkles" /></div>
            <div class="float-icon float-icon--3"><v-icon name="hi-shield-check" /></div>
          </div>
        </div>
      </section>

      <!-- Bento Grid -->
      <section v-if="!loading && stats" class="bento-grid">
        <!-- Wellness Score Gauge -->
        <div class="bento-card bento-card--wellness">
          <div class="bento-card__header">
            <h3>Wellness Score</h3>
            <span class="bento-card__badge" :class="`bento-card__badge--${wellnessLevel}`">{{ wellnessLabel }}</span>
          </div>
          <div class="wellness-gauge-wrap">
            <svg viewBox="0 0 120 120" class="wellness-gauge">
              <defs>
                <linearGradient id="wellness-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#10B981" />
                  <stop offset="100%" stop-color="#0288D1" />
                </linearGradient>
              </defs>
              <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(0,0,0,0.06)" stroke-width="10" />
              <circle cx="60" cy="60" r="50" fill="none" stroke="url(#wellness-grad)" stroke-width="10"
                stroke-linecap="round"
                :stroke-dasharray="314"
                :stroke-dashoffset="314 - (314 * (stats.wellness_score || 0) / 100)"
                transform="rotate(-90 60 60)"
                style="transition: stroke-dashoffset 1s ease;" />
              <text x="60" y="55" text-anchor="middle" font-size="28" font-weight="800" fill="#0F172A">{{ stats.wellness_score || 0 }}</text>
              <text x="60" y="72" text-anchor="middle" font-size="10" fill="#64748B">/ 100</text>
            </svg>
          </div>
          <div class="wellness-breakdown">
            <div class="wellness-breakdown__item">
              <span class="wellness-breakdown__label">Frequency</span>
              <div class="wellness-breakdown__bar">
                <div class="wellness-breakdown__fill" :style="{ width: Math.min((stats.exercises_last_14_days || 0) / 14 * 100, 100) + '%', background: '#10B981' }"></div>
              </div>
            </div>
            <div class="wellness-breakdown__item">
              <span class="wellness-breakdown__label">Completion</span>
              <div class="wellness-breakdown__bar">
                <div class="wellness-breakdown__fill" :style="{ width: (stats.completion_rate || 0) + '%', background: '#0288D1' }"></div>
              </div>
            </div>
            <div class="wellness-breakdown__item">
              <span class="wellness-breakdown__label">Diversity</span>
              <div class="wellness-breakdown__bar">
                <div class="wellness-breakdown__fill" :style="{ width: Math.min((stats.unique_categories || 0) / 6 * 100, 100) + '%', background: '#8B5CF6' }"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Activity Chart -->
        <div class="bento-card bento-card--chart">
          <div class="bento-card__header">
            <h3>Activity</h3>
            <span class="bento-card__period">Last 30 days</span>
          </div>
          <div class="bento-card__chart-area">
            <canvas ref="activityChartRef"></canvas>
          </div>
          <p v-if="!stats.time_series || !stats.time_series.length" class="bento-card__empty">Complete exercises to see your activity trend</p>
        </div>

        <!-- Category Distribution Doughnut -->
        <div class="bento-card">
          <div class="bento-card__header">
            <h3>Categories</h3>
            <span class="bento-card__period">Distribution</span>
          </div>
          <div class="bento-card__chart-area bento-card__chart-area--doughnut">
            <canvas ref="categoryChartRef"></canvas>
          </div>
          <p v-if="!stats.category_distribution || !stats.category_distribution.length" class="bento-card__empty">Your category mix will appear here</p>
        </div>

        <!-- Most Active Category highlight -->
        <div class="bento-card bento-card--highlight">
          <div class="highlight-icon" :style="{ background: mostUsedCategoryData.bgColor, color: mostUsedCategoryData.color }">
            <v-icon :name="mostUsedCategoryData.icon" scale="1.4" />
          </div>
          <div class="highlight-info">
            <span class="highlight-label">Most Practiced</span>
            <h4 class="highlight-name">{{ mostUsedCategoryData.name }}</h4>
            <p class="highlight-count">{{ stats.by_category?.[stats.most_used_category] || 0 }} sessions</p>
          </div>
        </div>
      </section>

      <!-- Category Cards -->
      <section v-if="!loading" class="category-section">
        <h2 class="section-title">Exercise Categories</h2>
        <p class="section-subtitle">Explore evidence-based therapeutic exercises across different modalities</p>
        <div class="category-grid">
          <div
            v-for="cat in categoryList"
            :key="cat.key"
            class="category-card"
            :class="{ 'category-card--active': activeTab === cat.key }"
            @click="activeTab = cat.key"
          >
            <div class="category-card__icon" :style="{ background: cat.bgColor, color: cat.color }">
              <v-icon :name="cat.icon" scale="1.1" />
            </div>
            <div class="category-card__body">
              <h4>{{ cat.name }}</h4>
              <p>{{ cat.description }}</p>
            </div>
            <div class="category-card__footer">
              <span class="category-card__count">{{ stats?.by_category?.[cat.key] || 0 }} sessions</span>
              <button class="category-card__try" @click.stop="goToEkaExercise(null, cat.key)">
                <v-icon name="hi-play" scale="0.55" /> Try
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Tab Filter -->
      <section v-if="!loading" class="filter-section">
        <h2 class="section-title">Exercise Sessions</h2>
        <div class="tab-filter">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            class="tab-filter__btn"
            :class="{ 'tab-filter__btn--active': activeTab === tab.key }"
            @click="activeTab = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>
      </section>

      <!-- Exercise List -->
      <div v-if="!loading && filteredExercises.length" class="exercise-list">
        <div
          v-for="s in filteredExercises"
          :key="s._id"
          class="exercise-card"
          @click="toggleExpand(s._id)"
        >
          <div class="exercise-card__top">
            <div class="exercise-card__info">
              <h4 class="exercise-card__name">{{ s.name }}</h4>
              <span class="exercise-card__date">{{ formatDate(s.created_at) }}</span>
            </div>
            <span class="exercise-card__category" :class="`cat--${categoryClass(s.category)}`">
              {{ categoryFullName(s.category) }}
            </span>
          </div>

          <div class="exercise-card__meta-row">
            <span v-if="s.estimated_minutes" class="exercise-card__duration">
              <v-icon name="hi-clock" scale="0.6" /> {{ s.estimated_minutes }} min
            </span>
            <span class="exercise-card__steps-count" v-if="s.steps && s.steps.length">
              {{ s.steps.length }} steps
            </span>
            <span v-if="s.completed" class="exercise-card__completed-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px;"><polyline points="20 6 9 17 4 12" /></svg>
              Completed
            </span>
          </div>

          <p v-if="s.description && expandedId !== s._id" class="exercise-card__preview">
            {{ truncate(s.description, 100) }}
          </p>

          <!-- Expanded Details -->
          <div v-if="expandedId === s._id" class="exercise-card__details">
            <!-- Completion Outcome -->
            <div v-if="s.completed && s.outcome" class="exercise-card__outcome-block">
              <div class="exercise-card__outcome-header">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;color:#10B981;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                <span>Exercise Completed</span>
                <span v-if="s.completed_at" class="exercise-card__outcome-time">{{ formatDate(s.completed_at) }}</span>
              </div>
              <p class="exercise-card__outcome-text">{{ s.outcome }}</p>
            </div>

            <div v-if="s.description" class="exercise-card__detail-block">
              <h5>Description</h5>
              <p>{{ s.description }}</p>
            </div>

            <div v-if="s.steps && s.steps.length" class="exercise-card__detail-block">
              <h5>Steps</h5>
              <ol class="exercise-card__steps-list">
                <li v-for="(step, i) in s.steps" :key="i">{{ step }}</li>
              </ol>
            </div>

            <div v-if="s.evidence_base" class="exercise-card__detail-block exercise-card__detail-block--evidence">
              <h5>Evidence Base</h5>
              <p>{{ s.evidence_base }}</p>
            </div>

            <!-- Patient Responses preview -->
            <div v-if="s.responses && s.responses.length" class="exercise-card__detail-block">
              <h5>Patient Responses</h5>
              <div class="exercise-card__responses-preview">
                <div
                  v-for="(msg, idx) in s.responses.slice(0, 4)"
                  :key="idx"
                  class="exercise-card__response-preview-item"
                  :class="{ 'exercise-card__response-preview-item--eka': msg.role === 'assistant' }"
                >
                  <span class="exercise-card__response-preview-role">{{ msg.role === 'assistant' ? 'Eka' : 'You' }}:</span>
                  {{ truncate(msg.content, 120) }}
                </div>
                <p v-if="s.responses.length > 4" class="exercise-card__responses-more">
                  + {{ s.responses.length - 4 }} more messages — View Full Report for complete conversation
                </p>
              </div>
            </div>

            <button
              class="exercise-card__view-report"
              @click.stop="openFullReport(s)"
            >
              <v-icon name="ri-heart-pulse-line" scale="0.7" />
              View Full Report
            </button>
          </div>

          <div class="exercise-card__expand-hint">
            <v-icon :name="expandedId === s._id ? 'hi-chevron-up' : 'hi-chevron-down'" scale="0.6" />
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="!loading && !filteredExercises.length" class="empty-state">
        <div class="empty-state__icon">
          <v-icon name="ri-heart-pulse-line" scale="2.5" />
        </div>
        <h3>{{ activeTab === 'all' ? 'No exercises yet' : 'No ' + categoryFullName(activeTab) + ' exercises' }}</h3>
        <p>Try your first coping exercise with Eka to start building healthy coping skills.</p>
        <button class="empty-state__btn" @click="goToEkaExercise()">
          <v-icon name="hi-play" scale="0.7" />
          Try an Exercise
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading your exercise history...</p>
      </div>
    </div>

    <!-- Full Report Overlay -->
    <div v-if="showReportOverlay && reportData" class="report-overlay">
      <div class="report-overlay__body">
        <section class="report-hero">
          <div class="report-hero__content">
            <button class="report-back-link" @click="showReportOverlay = false">
              <v-icon name="hi-arrow-left" scale="0.85" />
              <span>Back</span>
            </button>
            <div class="report-hero__badge">
              <v-icon name="ri-heart-pulse-line" />
              <span>{{ reportData.category || 'Exercise' }}</span>
            </div>
            <h1 class="report-hero__title">
              {{ reportData.name || 'Coping Exercise' }}<br/>
              <span class="report-hero__title-accent">Report</span>
            </h1>
            <p class="report-hero__subtitle">
              {{ reportData.completed ? 'Completed' : 'In progress' }}
              {{ reportData.completed_at ? ' on ' + new Date(reportData.completed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '' }}
              {{ reportData.estimated_minutes ? ' · ~' + reportData.estimated_minutes + ' min' : '' }}
            </p>
          </div>
          <div class="report-hero__visual">
            <div class="recovery-orb recovery-orb--report">
              <div class="orb-ring orb-ring--1"></div>
              <div class="orb-ring orb-ring--2"></div>
              <div class="orb-ring orb-ring--3"></div>
              <div class="orb-core orb-core--report">
                <v-icon name="ri-heart-pulse-line" scale="2" />
              </div>
            </div>
          </div>
        </section>

        <EkaCopingExercise :data="reportData" :patient="patientInfo" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted, watch, nextTick } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toast-notification";
import Chart from "chart.js/auto";
import EkaCopingExercise from "@/components/EkaChat/EkaCopingExercise.vue";
import { mapGetters } from "@/utilities/utilityStore";

const emit = defineEmits(["back"]);
const $http = inject("$http");
const $toast = useToast();
const router = useRouter();
const { userprofile } = mapGetters();

const patientInfo = computed(() => {
  const p = userprofile.value?.profile;
  if (!p) return null;
  const name = [p.first_name, p.last_name].filter(Boolean).join(" ");
  const dob = p.date_of_birth
    ? new Date(p.date_of_birth).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : null;
  return name || dob ? { name: name || null, dob } : null;
});

const loading = ref(true);
const exercises = ref([]);
const stats = ref(null);
const activeTab = ref("all");
const expandedId = ref(null);

const showReportOverlay = ref(false);
const reportData = ref(null);

// Chart refs
const activityChartRef = ref(null);
const categoryChartRef = ref(null);
let activityChartInstance = null;
let categoryChartInstance = null;

// Category data
const CATEGORIES = {
  cbt: {
    name: 'Cognitive Behavioural Therapy',
    shortName: 'CBT',
    icon: 'fa-brain',
    color: '#10B981',
    bgColor: '#D1FAE5',
    description: 'Identifies and restructures negative thought patterns to change emotional responses and behaviours.',
  },
  dbt: {
    name: 'Dialectical Behaviour Therapy',
    shortName: 'DBT',
    icon: 'hi-scale',
    color: '#0288D1',
    bgColor: '#E1F5FE',
    description: 'Builds skills for emotional regulation, distress tolerance, and interpersonal effectiveness.',
  },
  mindfulness: {
    name: 'Mindfulness',
    shortName: 'Mindfulness',
    icon: 'hi-sparkles',
    color: '#8B5CF6',
    bgColor: '#EDE9FE',
    description: 'Cultivates present-moment awareness through meditation and focused attention to reduce stress.',
  },
  grounding: {
    name: 'Grounding Techniques',
    shortName: 'Grounding',
    icon: 'hi-hand',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    description: 'Uses sensory awareness to reconnect with the present moment during anxiety or dissociation.',
  },
  relapse_prevention: {
    name: 'Relapse Prevention',
    shortName: 'Relapse Prevention',
    icon: 'hi-shield-check',
    color: '#F43F5E',
    bgColor: '#FFE4E6',
    description: 'Develops safety plans and strategies to identify triggers and prevent substance use relapse.',
  },
  motivational_interviewing: {
    name: 'Motivational Interviewing',
    shortName: 'Motivational',
    icon: 'hi-light-bulb',
    color: '#3B82F6',
    bgColor: '#DBEAFE',
    description: 'Explores ambivalence about change and strengthens internal motivation for recovery.',
  },
};

const categoryList = computed(() =>
  Object.entries(CATEGORIES).map(([key, cat]) => ({ key, ...cat }))
);

const tabs = [
  { key: "all", label: "All" },
  { key: "cbt", label: "CBT" },
  { key: "dbt", label: "DBT" },
  { key: "mindfulness", label: "Mindfulness" },
  { key: "grounding", label: "Grounding" },
  { key: "motivational_interviewing", label: "Motivational" },
  { key: "relapse_prevention", label: "Relapse Prevention" },
];

const filteredExercises = computed(() => {
  if (activeTab.value === "all") return exercises.value;
  return exercises.value.filter((e) => e.category === activeTab.value);
});

const wellnessLevel = computed(() => {
  const score = stats.value?.wellness_score || 0;
  if (score >= 76) return 'excellent';
  if (score >= 51) return 'good';
  if (score >= 26) return 'building';
  return 'starting';
});

const wellnessLabel = computed(() => {
  const map = { excellent: 'Excellent', good: 'Good', building: 'Building', starting: 'Getting Started' };
  return map[wellnessLevel.value] || 'Getting Started';
});

const heroSubtitle = computed(() => {
  if (!stats.value || stats.value.total === 0) {
    return 'Start your wellness journey with evidence-based coping exercises guided by Eka.';
  }
  const cats = stats.value.unique_categories || 0;
  const total = stats.value.total || 0;
  const streak = stats.value.current_streak || 0;
  let msg = `You've completed ${total} exercise${total !== 1 ? 's' : ''} across ${cats} categor${cats !== 1 ? 'ies' : 'y'}.`;
  if (streak >= 7) msg += ' Amazing consistency!';
  else if (streak >= 3) msg += ' Great streak going!';
  else if (total >= 10) msg += ' Keep building healthy habits.';
  return msg;
});

const mostUsedCategoryData = computed(() => {
  const key = stats.value?.most_used_category;
  if (key && CATEGORIES[key]) return { ...CATEGORIES[key], key };
  return { name: 'None yet', icon: 'ri-heart-pulse-line', color: '#64748B', bgColor: '#F1F5F9', key: null };
});

function categoryFullName(cat) {
  return CATEGORIES[cat]?.shortName || cat;
}

function formatDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function truncate(text, len) {
  if (!text) return "";
  return text.length > len ? text.slice(0, len) + "..." : text;
}

function categoryClass(cat) {
  const map = {
    cbt: "cbt",
    dbt: "dbt",
    mindfulness: "mind",
    grounding: "ground",
    relapse_prevention: "relapse",
    motivational_interviewing: "motiv",
    safety: "safety",
  };
  return map[cat] || "default";
}

function toggleExpand(id) {
  expandedId.value = expandedId.value === id ? null : id;
}

function openFullReport(session) {
  reportData.value = {
    exercise_id: session.exercise_id,
    name: session.name,
    category: session.category,
    description: session.description,
    estimated_minutes: session.estimated_minutes,
    steps: session.steps || [],
    evidence_base: session.evidence_base,
    completed: session.completed || false,
    completed_steps: session.completed_steps || [],
    outcome: session.outcome || null,
    completed_at: session.completed_at || null,
    responses: session.responses || [],
  };
  showReportOverlay.value = true;
}

function goToEkaExercise(exerciseName, categoryKey) {
  const categoryLabels = { cbt: 'CBT', dbt: 'DBT', mindfulness: 'mindfulness', grounding: 'grounding', relapse_prevention: 'relapse prevention', motivational_interviewing: 'motivational' };
  let prompt = 'I want to try a coping exercise';
  if (exerciseName) {
    prompt = `I want to try the ${exerciseName} exercise`;
  } else if (categoryKey && categoryKey !== 'all') {
    const label = categoryLabels[categoryKey] || categoryKey;
    prompt = `I want to try a ${label} coping exercise`;
  } else if (activeTab.value !== 'all') {
    const label = categoryLabels[activeTab.value] || activeTab.value;
    prompt = `I want to try a ${label} coping exercise`;
  }
  router.push({ path: "/app/patient/eka", query: { prompt } });
}

// Charts
function renderActivityChart() {
  if (!activityChartRef.value || !stats.value?.time_series?.length) return;
  if (activityChartInstance) activityChartInstance.destroy();

  const ts = stats.value.time_series;
  const labels = ts.map((d) => {
    const date = new Date(d.date);
    return `${date.getDate()}/${date.getMonth() + 1}`;
  });

  activityChartInstance = new Chart(activityChartRef.value, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Exercises",
          data: ts.map((d) => d.count),
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
          label: "Completed",
          data: ts.map((d) => d.completed),
          borderColor: "#10B981",
          backgroundColor: "rgba(16, 185, 129, 0.1)",
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
        tooltip: { backgroundColor: "rgba(15, 23, 42, 0.9)", cornerRadius: 8, titleFont: { size: 12 }, bodyFont: { size: 12 }, padding: 10 },
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: "#64748B", font: { size: 11 }, maxRotation: 45 } },
        y: { beginAtZero: true, grid: { color: "rgba(0,0,0,0.04)" }, ticks: { color: "#64748B", stepSize: 1, font: { size: 11 } } },
      },
    },
  });
}

function renderCategoryChart() {
  if (!categoryChartRef.value || !stats.value?.category_distribution?.length) return;
  if (categoryChartInstance) categoryChartInstance.destroy();

  const dist = stats.value.category_distribution;
  const colors = {
    cbt: '#10B981',
    dbt: '#0288D1',
    mindfulness: '#8B5CF6',
    grounding: '#F59E0B',
    relapse_prevention: '#F43F5E',
    motivational_interviewing: '#3B82F6',
  };

  categoryChartInstance = new Chart(categoryChartRef.value, {
    type: "doughnut",
    data: {
      labels: dist.map((c) => CATEGORIES[c.category]?.shortName || c.category),
      datasets: [{
        data: dist.map((c) => c.count),
        backgroundColor: dist.map((c) => colors[c.category] || '#94A3B8'),
        borderWidth: 0,
        spacing: 2,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: { position: "bottom", labels: { usePointStyle: true, padding: 14, font: { size: 11, weight: '500' } } },
        tooltip: { backgroundColor: "rgba(15, 23, 42, 0.9)", cornerRadius: 8, padding: 10 },
      },
    },
  });
}

async function fetchData() {
  loading.value = true;
  try {
    const [historyRes, statsRes] = await Promise.all([
      $http.$_getExerciseHistory({ limit: 50 }),
      $http.$_getExerciseStats(),
    ]);
    exercises.value = historyRes?.data?.data?.docs || [];
    stats.value = statsRes?.data?.data || null;
  } catch (err) {
    $toast.error("Failed to load exercise history");
  } finally {
    loading.value = false;
    await nextTick();
    renderActivityChart();
    renderCategoryChart();
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
$violet: #8B5CF6;
$violet-light: #EDE9FE;

@mixin glass-card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);
}

// ─── Page ──────────────────────────────────────────────────────────
.exercise-history {
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
  background: linear-gradient(135deg, $emerald 0%, $sky-dark 50%, $sky-darker 100%);
  border-radius: 28px;
  min-height: 340px;
  color: $white;
  margin-bottom: 20px;
  box-shadow: 0 20px 60px rgba(2, 136, 209, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1) inset;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    padding: 24px 20px 32px;
    text-align: center;
    min-height: auto;
  }

  &__content {
    display: flex;
    flex-direction: column;
  }

  &__badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(10px);
    border-radius: 24px;
    width: fit-content;
    margin-bottom: 20px;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    @media (max-width: 768px) { margin: 0 auto 16px; }
  }

  &__title {
    font-size: 48px;
    font-weight: 800;
    line-height: 1.1;
    letter-spacing: -1px;
    margin: 0 0 16px;
    @media (max-width: 768px) { font-size: 28px; }
  }

  &__title-accent {
    background: linear-gradient(180deg, #fff 0%, rgba(255,255,255,0.7) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  &__subtitle {
    font-size: 16px;
    opacity: 0.95;
    line-height: 1.6;
    margin: 0 0 28px;
    max-width: 480px;
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
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 16px 20px;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    width: fit-content;
    @media (max-width: 768px) { width: 100%; justify-content: space-around; gap: 10px; padding: 12px 14px; }
  }

  &__visual {
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    @media (max-width: 768px) { display: none; }
  }
}

.hero-stat {
  display: flex;
  flex-direction: column;
  align-items: center;

  &__value {
    font-size: 24px;
    font-weight: 700;
    line-height: 1;
    @media (max-width: 768px) { font-size: 18px; }
  }

  &__label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    opacity: 0.7;
    margin-top: 4px;
    @media (max-width: 768px) { font-size: 9px; }
  }

  &__divider {
    width: 1px;
    height: 32px;
    background: rgba(255, 255, 255, 0.2);
  }
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  padding: 0;
  margin-bottom: 16px;
  transition: color 0.2s;
  &:hover { color: #fff; }
  @media (max-width: 768px) { margin: 0 auto 12px; }
}

// ─── Animated Orb ────────────────────────────────────────────────
.recovery-orb {
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
  border: 2px solid rgba(255, 255, 255, 0.2);

  &--1 { width: 100%; height: 100%; animation: spin-slow 20s linear infinite; }
  &--2 { width: 80%; height: 80%; animation: spin-slow 15s linear infinite reverse; }
  &--3 { width: 60%; height: 60%; animation: spin-slow 10s linear infinite; }
}

.orb-core {
  width: 100px;
  height: 100px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(20px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $white;
  box-shadow: 0 0 40px rgba(255, 255, 255, 0.3), 0 0 80px rgba(79, 195, 247, 0.3);
  animation: pulse-glow 3s ease-in-out infinite;
}

.floating-icons {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.float-icon {
  position: absolute;
  width: 44px;
  height: 44px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $white;
  animation: float 3s ease-in-out infinite;

  &--1 { top: 10%; right: 10%; animation-delay: 0s; }
  &--2 { bottom: 20%; right: 5%; animation-delay: 1s; }
  &--3 { bottom: 10%; left: 10%; animation-delay: 2s; }
}

// ─── Bento Grid ─────────────────────────────────────────────────
.bento-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 20px;
  padding: 24px 0 0;

  @media (max-width: 1024px) { grid-template-columns: repeat(6, 1fr); }
  @media (max-width: 640px) { grid-template-columns: 1fr; gap: 16px; }
}

.bento-card {
  @include glass-card;
  border-radius: 20px;
  padding: 20px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  grid-column: span 6;

  @media (max-width: 640px) { grid-column: span 1; padding: 16px; border-radius: 16px; }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.04);
  }

  &--wellness { grid-column: span 4; @media (max-width: 1024px) { grid-column: span 6; } @media (max-width: 640px) { grid-column: span 1; } }
  &--chart { grid-column: span 8; @media (max-width: 1024px) { grid-column: span 6; } @media (max-width: 640px) { grid-column: span 1; } }
  &--highlight { grid-column: span 6; display: flex; align-items: center; gap: 16px; @media (max-width: 640px) { grid-column: span 1; } }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    h3 { font-size: 14px; font-weight: 600; color: $navy; margin: 0; }
  }

  &__period {
    font-size: 11px;
    color: $gray;
    background: rgba(0, 0, 0, 0.04);
    padding: 3px 8px;
    border-radius: 6px;
  }

  &__badge {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 3px 10px;
    border-radius: 8px;

    &--excellent { background: $emerald-light; color: $emerald-dark; }
    &--good { background: $sky-light; color: $sky-dark; }
    &--building { background: $amber-light; color: darken($amber, 10%); }
    &--starting { background: #F1F5F9; color: $gray; }
  }

  &__chart-area {
    height: 220px;
    position: relative;
    @media (max-width: 640px) { height: 180px; }

    &--doughnut { height: 200px; @media (max-width: 640px) { height: 170px; } }
  }

  &__empty {
    font-size: 13px;
    color: $light-gray;
    font-style: italic;
    text-align: center;
    margin: 0;
    padding: 20px 0;
  }
}

// ─── Wellness Gauge ──────────────────────────────────────────────
.wellness-gauge-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}

.wellness-gauge {
  width: 120px;
  height: 120px;
}

.wellness-breakdown {
  display: flex;
  flex-direction: column;
  gap: 8px;

  &__item {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__label {
    font-size: 11px;
    font-weight: 500;
    color: $gray;
    width: 80px;
    flex-shrink: 0;
  }

  &__bar {
    flex: 1;
    height: 6px;
    background: rgba(0, 0, 0, 0.06);
    border-radius: 3px;
    overflow: hidden;
  }

  &__fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.8s ease;
  }
}

// ─── Highlight Card ──────────────────────────────────────────────
.highlight-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.highlight-info {
  flex: 1;
  min-width: 0;
}

.highlight-label {
  font-size: 11px;
  font-weight: 500;
  color: $light-gray;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.highlight-name {
  font-size: 16px;
  font-weight: 700;
  color: $navy;
  margin: 4px 0 2px;
}

.highlight-count {
  font-size: 13px;
  color: $gray;
  margin: 0;
}

// ─── Category Section ────────────────────────────────────────────
.category-section {
  padding: 32px 0 0;
}

.section-title {
  font-size: 20px;
  font-weight: 700;
  color: $navy;
  margin: 0 0 4px;
}

.section-subtitle {
  font-size: 14px;
  color: $gray;
  margin: 0 0 20px;
  line-height: 1.5;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;

  @media (max-width: 1024px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 640px) { grid-template-columns: 1fr; gap: 12px; }
}

.category-card {
  @include glass-card;
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08);
  }

  &--active {
    border-color: $sky-dark;
    box-shadow: 0 0 0 2px rgba($sky-dark, 0.2), 0 4px 24px rgba(0, 0, 0, 0.06);
  }

  &__icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 12px;
  }

  &__body {
    margin-bottom: 12px;

    h4 {
      font-size: 14px;
      font-weight: 700;
      color: $navy;
      margin: 0 0 4px;
    }

    p {
      font-size: 12px;
      color: $gray;
      line-height: 1.5;
      margin: 0;
    }
  }

  &__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__count {
    font-size: 12px;
    font-weight: 600;
    color: $light-gray;
  }

  &__try {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 6px 12px;
    border-radius: 8px;
    border: 1px solid rgba($sky-dark, 0.2);
    background: rgba($sky-dark, 0.05);
    color: $sky-dark;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: rgba($sky-dark, 0.15);
      border-color: $sky-dark;
    }
  }
}

// ─── Filter Section ──────────────────────────────────────────────
.filter-section {
  padding: 32px 0 0;
}

.tab-filter {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding: 4px;
  margin-top: 12px;
  background: $white;
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar { display: none; }

  &__btn {
    padding: 10px 18px;
    border-radius: 10px;
    border: none;
    background: transparent;
    color: $gray;
    font-size: 13px;
    font-weight: 600;
    white-space: nowrap;
    cursor: pointer;
    transition: all 0.2s;

    &--active {
      background: linear-gradient(135deg, $sky-dark, $sky-darker);
      color: $white;
      box-shadow: 0 2px 8px rgba($sky-dark, 0.3);
    }

    &:not(&--active):hover {
      background: rgba(0, 0, 0, 0.04);
    }
  }
}

// ─── Exercise List ───────────────────────────────────────────────
.exercise-list {
  padding: 20px 0 0;
}

.exercise-card {
  @include glass-card;
  border-radius: 16px;
  padding: 18px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  }

  &__top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 10px;
    margin-bottom: 6px;
  }

  &__info {
    flex: 1;
    min-width: 0;
  }

  &__name {
    font-size: 15px;
    font-weight: 700;
    color: $navy;
    margin: 0 0 2px;
  }

  &__date {
    font-size: 11px;
    color: $light-gray;
  }

  &__category {
    font-size: 10px;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: 12px;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    white-space: nowrap;
  }

  &__meta-row {
    display: flex;
    gap: 12px;
    margin-bottom: 6px;
  }

  &__duration,
  &__steps-count {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: $gray;
    font-weight: 500;
  }

  &__completed-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    font-weight: 600;
    color: $emerald-dark;
    background: $emerald-light;
    padding: 2px 8px;
    border-radius: 10px;
    border: 1px solid #A7F3D0;
  }

  &__outcome-block {
    background: linear-gradient(135deg, #ECFDF5, $emerald-light);
    border: 1px solid #A7F3D0;
    border-radius: 12px;
    padding: 12px;
    margin-bottom: 12px;
  }

  &__outcome-header {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 700;
    color: $emerald-dark;
    margin-bottom: 6px;
  }

  &__outcome-time {
    font-size: 11px;
    font-weight: 400;
    color: $gray;
    margin-left: auto;
  }

  &__outcome-text {
    font-size: 13px;
    color: $slate;
    line-height: 1.6;
    margin: 0;
  }

  &__preview {
    font-size: 12px;
    color: $gray;
    line-height: 1.5;
    margin: 0;
  }

  &__details {
    margin-top: 12px;
    border-top: 1px solid #F1F5F9;
    padding-top: 12px;
  }

  &__detail-block {
    margin-bottom: 12px;

    h5 {
      font-size: 12px;
      font-weight: 700;
      color: $sky-darker;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      margin: 0 0 6px;
    }

    p {
      font-size: 13px;
      color: $slate;
      line-height: 1.6;
      margin: 0;
    }

    &--evidence {
      background: $bg;
      border: 1px solid #E2E8F0;
      border-radius: 10px;
      padding: 10px;

      p { font-size: 12px; color: $gray; }
    }
  }

  &__steps-list {
    margin: 0;
    padding: 0 0 0 20px;

    li {
      font-size: 13px;
      color: $slate;
      line-height: 1.6;
      margin-bottom: 4px;
    }
  }

  &__responses-preview {
    border-radius: 8px;
    overflow: hidden;
  }

  &__response-preview-item {
    padding: 6px 10px;
    font-size: 12px;
    line-height: 1.5;
    color: $slate;
    border-bottom: 1px solid #F1F5F9;

    &:last-child { border-bottom: none; }
    &--eka { background: #F0F7FF; }
  }

  &__response-preview-role {
    font-weight: 600;
    color: $gray;
    margin-right: 4px;
  }

  &__responses-more {
    font-size: 11px;
    color: $light-gray;
    font-style: italic;
    margin: 6px 0 0;
    text-align: center;
  }

  &__view-report {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 16px;
    border-radius: 10px;
    border: 1px solid $sky-darker;
    background: transparent;
    color: $sky-darker;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    width: 100%;
    justify-content: center;
    margin-top: 8px;

    &:hover { background: $sky-light; }
  }

  &__expand-hint {
    text-align: center;
    color: #CBD5E1;
    margin-top: 4px;
  }
}

/* Category colors */
.cat--cbt { background: $emerald-light; color: $emerald-dark; }
.cat--dbt { background: $sky-light; color: $sky-dark; }
.cat--mind { background: $violet-light; color: darken($violet, 10%); }
.cat--ground { background: $amber-light; color: darken($amber, 10%); }
.cat--relapse { background: $rose-light; color: $rose; }
.cat--motiv { background: #DBEAFE; color: #2563EB; }
.cat--safety { background: #FEF3C7; color: #B45309; }
.cat--default { background: $sky-light; color: $sky-dark; }

// ─── Empty State ─────────────────────────────────────────────────
.empty-state {
  text-align: center;
  padding: 48px 0;

  &__icon {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    background: linear-gradient(135deg, $emerald-light, $sky-light);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 20px;
    color: $sky-dark;
  }

  h3 {
    font-size: 18px;
    font-weight: 700;
    color: $navy;
    margin: 0 0 8px;
  }

  p {
    font-size: 14px;
    color: $gray;
    line-height: 1.5;
    margin: 0 0 24px;
    max-width: 360px;
    margin-left: auto;
    margin-right: auto;
  }

  &__btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 14px 28px;
    border-radius: 14px;
    background: linear-gradient(135deg, $emerald, $sky-dark);
    color: $white;
    font-size: 15px;
    font-weight: 600;
    border: none;
    cursor: pointer;
    transition: all 0.25s;
    box-shadow: 0 4px 16px rgba($sky-dark, 0.3);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 28px rgba($sky-dark, 0.4);
    }
  }
}

// ─── Loading ─────────────────────────────────────────────────────
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 16px;
  color: $gray;
  font-size: 14px;
}

.loading-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid rgba($sky, 0.2);
  border-top-color: $sky;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

// ─── Report Overlay ──────────────────────────────────────────────
.report-overlay {
  width: 100%;
  min-height: 100%;
  background: $bg;

  &__body {
    max-width: 1400px;
    margin: 0 auto;
    padding: 24px 32px 100px;
    width: 100%;
    @media (max-width: 768px) { padding: 16px 16px 120px; }
  }
}

// ─── Report Hero ──────────────────────────────────────────────
.report-hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  align-items: center;
  padding: 48px 40px 56px;
  background: linear-gradient(135deg, $emerald 0%, $sky-dark 50%, $sky-darker 100%);
  border-radius: 28px;
  min-height: 280px;
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
    font-size: 16px; opacity: 0.95; line-height: 1.6; margin: 0; max-width: 480px;
    @media (max-width: 768px) { font-size: 14px; max-width: none; }
  }

  &__visual {
    display: flex; justify-content: center; align-items: center; position: relative;
    @media (max-width: 768px) { display: none; }
  }
}

.report-back-link {
  display: inline-flex; align-items: center; gap: 6px;
  background: none; border: none; color: rgba(255, 255, 255, 0.7);
  font-size: 13px; font-weight: 500; cursor: pointer; padding: 0; margin-bottom: 16px;
  transition: color 0.2s; &:hover { color: #fff; }
  @media (max-width: 768px) { margin: 0 auto 12px; }
}

.recovery-orb--report { position: relative; width: 200px; height: 200px; display: flex; align-items: center; justify-content: center; }
.orb-core--report {
  box-shadow: 0 0 40px rgba(255, 255, 255, 0.3), 0 0 80px rgba(16, 185, 129, 0.3);
}

// ─── Animations ──────────────────────────────────────────────────
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 40px rgba(255, 255, 255, 0.3), 0 0 80px rgba(79, 195, 247, 0.3); }
  50% { box-shadow: 0 0 60px rgba(255, 255, 255, 0.4), 0 0 100px rgba(79, 195, 247, 0.4); }
}
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
</style>
