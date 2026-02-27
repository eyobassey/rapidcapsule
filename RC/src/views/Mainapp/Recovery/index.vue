<template>
  <div class="recovery-page">
    <template v-if="!activeView && !showProgrammeSettings && !showReenrol">
    <!-- Mobile Header -->
    <header class="mobile-header">
      <button class="menu-btn" @click="$emit('openSideNav')">
        <v-icon name="hi-menu-alt-2" scale="1.2" />
      </button>
      <div class="header-logo">
        <img src="/RapidCapsule_Logo.png" alt="Rapid Capsule" />
      </div>
      <button class="notification-btn">
        <v-icon name="hi-bell" scale="1.1" />
      </button>
    </header>

    <div class="page-content">
      <!-- Enrolment Gate -->
      <div v-if="!loading && !enrolled" class="enrol-section">
        <EnrolHero @enrol="showEnrolModal = true" />
      </div>

      <!-- Dashboard -->
      <div v-if="!loading && enrolled" class="dashboard">
        <!-- Hero Section -->
        <section class="hero">
          <div class="hero__content">
            <button class="back-link desktop-only" @click="$router.push('/app/patient/dashboard')">
              <v-icon name="hi-arrow-left" scale="0.85" />
              <span>Dashboard</span>
            </button>
            <div class="hero__badge">
              <div class="badge-pulse" :class="`badge-pulse--${dashboard.profile?.risk_level || 'low'}`"></div>
              <v-icon name="hi-heart" />
              <span>{{ riskLabel }}</span>
            </div>
            <h1 class="hero__title">
              Recovery<br/>
              <span class="hero__title-accent">Journey</span>
            </h1>
            <p class="hero__subtitle">
              Track your progress, log daily check-ins, and access coping tools — all in one place. Day {{ dashboard.profile?.sobriety_days || 0 }}: {{ sobrietyMessage }}
            </p>

            <div class="hero__stats">
              <div class="hero-stat">
                <span class="hero-stat__value">{{ dashboard.profile?.sobriety_days || 0 }}</span>
                <span class="hero-stat__label">Sober Days</span>
              </div>
              <div class="hero-stat__divider"></div>
              <div class="hero-stat">
                <span class="hero-stat__value">{{ dashboard.profile?.log_streak || 0 }}</span>
                <span class="hero-stat__label">Day Streak</span>
              </div>
              <div class="hero-stat__divider"></div>
              <div class="hero-stat">
                <span class="hero-stat__value">{{ dashboard.milestones?.total || 0 }}</span>
                <span class="hero-stat__label">Milestones</span>
              </div>
              <div class="hero-stat__divider"></div>
              <div class="hero-stat">
                <span class="hero-stat__value">{{ dashboard.profile?.days_in_program || 0 }}</span>
                <span class="hero-stat__label">In Programme</span>
              </div>
            </div>
          </div>

          <div class="hero__visual">
            <div class="recovery-orb">
              <div class="orb-ring orb-ring--1"></div>
              <div class="orb-ring orb-ring--2"></div>
              <div class="orb-ring orb-ring--3"></div>
              <div class="orb-core">
                <v-icon name="hi-heart" scale="2" />
              </div>
            </div>
            <div class="floating-icons">
              <div class="float-icon float-icon--1"><v-icon name="hi-shield-check" /></div>
              <div class="float-icon float-icon--2"><v-icon name="hi-chart-bar" /></div>
              <div class="float-icon float-icon--3"><v-icon name="hi-sparkles" /></div>
            </div>
          </div>
        </section>

        <!-- Today's Check-in CTA -->
        <section v-if="!dashboard.today?.logged" class="checkin-cta" @click="navigateToEka('checkin')">
          <div class="checkin-cta__icon">
            <v-icon name="hi-pencil-alt" scale="1.3" />
          </div>
          <div class="checkin-cta__text">
            <h3>Daily Check-in</h3>
            <p>How are you feeling today? Take a moment to reflect.</p>
          </div>
          <v-icon name="hi-chevron-right" scale="1.2" class="checkin-cta__arrow" />
        </section>

        <section v-else class="checkin-done">
          <v-icon name="hi-check-circle" scale="1.2" class="checkin-done__icon" />
          <span>Today's check-in complete</span>
          <span class="checkin-done__mood" v-if="dashboard.today?.log?.mood_score">
            Mood: {{ dashboard.today.log.mood_score }}/10
          </span>
        </section>

        <!-- Bento Grid -->
        <section class="bento-grid">
          <!-- Mood Trend Card -->
          <div class="bento-card bento-card--full-width" @click="navigateTo('checkin-history')">
            <div class="bento-card__header">
              <h3>Mood Trend</h3>
              <span class="bento-card__period">Last 14 days</span>
            </div>
            <div class="bento-card__chart" ref="moodChartContainer">
              <canvas ref="moodChart"></canvas>
            </div>
          </div>

          <!-- Screening Card -->
          <div class="bento-card" @click="navigateTo('screening-history')">
            <div class="bento-card__header">
              <h3>Screening</h3>
              <span v-if="latestScreening" class="bento-card__badge" :class="`bento-card__badge--${latestScreening.risk_level}`">
                {{ latestScreening.risk_level }}
              </span>
            </div>
            <div class="bento-card__content">
              <template v-if="latestScreening">
                <p class="bento-card__score">{{ latestScreening.total_score }}</p>
                <p class="bento-card__label">{{ screeningInstrumentName }}</p>
              </template>
              <template v-else>
                <p class="bento-card__empty">Take your first assessment</p>
              </template>
            </div>
            <v-icon name="hi-arrow-right" scale="1" class="bento-card__nav" />
          </div>

          <!-- Coping Exercises Card -->
          <div class="bento-card" @click="navigateTo('exercise-history')">
            <div class="bento-card__header">
              <h3>Exercises</h3>
              <span class="bento-card__period">Coping</span>
            </div>
            <div class="bento-card__content">
              <template v-if="exerciseStats && exerciseStats.total > 0">
                <p class="bento-card__score">{{ exerciseStats.total }}</p>
                <p class="bento-card__label">Sessions completed</p>
              </template>
              <template v-else>
                <p class="bento-card__empty">Try your first exercise</p>
              </template>
            </div>
            <v-icon name="hi-arrow-right" scale="1" class="bento-card__nav" />
          </div>

          <!-- Talk to Eka Card -->
          <div class="bento-card bento-card--accent bento-card--eka">
            <div class="bento-card__header">
              <h3>Talk to Eka</h3>
              <span class="bento-card__period">AI Companion</span>
            </div>
            <div class="bento-card__content">
              <p class="bento-card__desc">24/7 recovery support — coping tools, exercises, and check-ins powered by EkaGPT.</p>
            </div>
            <div class="eka-context-buttons">
              <button
                v-for="ctx in ekaContextOptions"
                :key="ctx.value"
                class="eka-context-btn"
                @click.stop="navigateToEka(ctx.value)"
              >
                <v-icon :name="ctx.icon" scale="0.7" />
                <span>{{ ctx.label }}</span>
              </button>
            </div>
          </div>

          <!-- Milestones Card -->
          <div class="bento-card" @click="navigateTo('milestones')">
            <div class="bento-card__header">
              <h3>Milestones</h3>
            </div>
            <div class="bento-card__milestones">
              <div
                v-for="milestone in recentMilestones"
                :key="milestone._id"
                class="bento-card__milestone"
              >
                <div class="bento-card__milestone-icon">
                  <v-icon name="hi-star" scale="0.8" />
                </div>
                <div class="bento-card__milestone-info">
                  <span class="bento-card__milestone-name">{{ milestone.milestone_name }}</span>
                  <span class="bento-card__milestone-points">+{{ milestone.reward_points }} pts</span>
                </div>
              </div>
              <p v-if="!recentMilestones.length" class="bento-card__empty">Your milestones will appear here</p>
            </div>
          </div>

          <!-- Programme Settings Card -->
          <div class="bento-card" @click="showProgrammeSettings = true">
            <div class="bento-card__header">
              <h3>Programme</h3>
              <span class="bento-card__period">Settings</span>
            </div>
            <div class="bento-card__content">
              <p class="bento-card__score" v-if="profileSubstances.length">{{ profileSubstances.length }}</p>
              <p class="bento-card__label" v-if="profileSubstances.length">Substance{{ profileSubstances.length > 1 ? 's' : '' }} tracked</p>
              <p class="bento-card__empty" v-else>Manage your programme</p>
            </div>
            <v-icon name="hi-cog" scale="1" class="bento-card__nav" />
          </div>

          <!-- Recent Eka Recovery Conversations -->
          <div v-if="recentEkaConversations.length" class="bento-card bento-card--full-width bento-card--eka-recent">
            <div class="bento-card__header">
              <h3>Recent Recovery Conversations</h3>
              <span class="bento-card__period bento-card__period--link" @click="router.push('/app/patient/eka')">View all</span>
            </div>
            <div class="eka-recent-list">
              <div
                v-for="conv in recentEkaConversations"
                :key="conv._id"
                class="eka-recent-item"
                @click="openEkaConversation(conv._id)"
              >
                <div class="eka-recent-item__info">
                  <span class="eka-recent-item__title">{{ conv.title || 'Untitled' }}</span>
                  <span class="eka-recent-item__preview">{{ conv.last_message || '' }}</span>
                </div>
                <span class="eka-recent-item__date">{{ formatEkaDate(conv.updated_at || conv.created_at) }}</span>
              </div>
            </div>
          </div>

          <!-- Crisis Button -->
          <div class="bento-card bento-card--full-width bento-card--crisis" @click="showCrisis = true">
            <div class="bento-card__crisis-content">
              <v-icon name="hi-phone" scale="1.4" />
              <div>
                <h3>Need Help Now?</h3>
                <p>Samaritans: 116 123 &middot; FRANK: 0300 123 6600 &middot; NHS 111</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="loading-state__spinner"></div>
        <p>Loading your recovery dashboard...</p>
      </div>
    </div>
    </template>

    <!-- Sub-views (step navigator) -->
    <ScreeningFlow
      v-if="activeView === 'screening'"
      @back="activeView = null"
    />
    <DailyLog
      v-if="activeView === 'daily-log'"
      @back="activeView = null; fetchDashboard()"
    />
    <CompanionChat
      v-if="activeView === 'companion'"
      @back="activeView = null"
    />
    <MilestoneWall
      v-if="activeView === 'milestones'"
      @back="activeView = null"
    />
    <CheckinHistory
      v-if="activeView === 'checkin-history'"
      @back="activeView = null"
    />
    <ScreeningHistory
      v-if="activeView === 'screening-history'"
      @back="activeView = null"
    />
    <ExerciseHistory
      v-if="activeView === 'exercise-history'"
      @back="activeView = null"
    />
    <ProgrammeHistory
      v-if="activeView === 'programme-history'"
      @back="activeView = null"
    />

    <!-- Programme Settings Overlay -->
    <ProgrammeSettings
      v-if="showProgrammeSettings"
      :substances="profileSubstances"
      @back="showProgrammeSettings = false"
      @updated="showProgrammeSettings = false; fetchDashboard()"
      @view-history="showProgrammeSettings = false; activeView = 'programme-history'"
      @start-new="showProgrammeSettings = false; showReenrol = true"
    />

    <!-- Re-enrolment Flow -->
    <EnrolHero
      v-if="showReenrol"
      mode="reenrol"
      @reenrolled="handleReenrolled"
      @close="showReenrol = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted, watch, nextTick } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "vuex";
import { useToast } from "vue-toast-notification";
import { mapGetters } from "@/utilities/utilityStore";
import Chart from "chart.js/auto";

// Lazy-loaded sub-views
import ScreeningFlow from "./parts/ScreeningFlow.vue";
import DailyLog from "./parts/DailyLog.vue";
import CompanionChat from "./parts/CompanionChat.vue";
import MilestoneWall from "./parts/MilestoneWall.vue";
import CheckinHistory from "./parts/CheckinHistory.vue";
import ScreeningHistory from "./parts/ScreeningHistory.vue";
import ExerciseHistory from "./parts/ExerciseHistory.vue";
import ProgrammeHistory from "./parts/ProgrammeHistory.vue";
import EnrolHero from "./parts/components/EnrolHero.vue";
import ProgrammeSettings from "./parts/components/ProgrammeSettings.vue";

const $http = inject("$http");
const $toast = useToast();
const router = useRouter();
const store = useStore();
const { userprofile } = mapGetters();

const loading = ref(true);
const enrolled = ref(false);
const dashboard = ref({});
const activeView = ref(null);
const showEnrolModal = ref(false);
const showCrisis = ref(false);
const showProgrammeSettings = ref(false);
const showReenrol = ref(false);

// Eka deep linking
const recentEkaConversations = ref([]);

const ekaContextPrompts = {
  craving: "I'm experiencing strong cravings right now and need help",
  anxiety: "I'm feeling really anxious, can you help me with some grounding?",
  coping: "Show me some coping strategies I can use right now",
  motivation: "I need some motivation to stay on my recovery path",
  sleep: "I'm having trouble sleeping. Check my sleep vitals from connected devices and help me improve my sleep",
  general: "I just want to talk about how I'm feeling today",
  checkin: "I want to do my daily check-in",
};

const ekaContextOptions = [
  { value: "craving", label: "Craving Support", icon: "hi-lightning-bolt", bg: "rgba(244, 63, 94, 0.1)" },
  { value: "anxiety", label: "Feeling Anxious", icon: "hi-exclamation", bg: "rgba(245, 158, 11, 0.1)" },
  { value: "coping", label: "Coping Strategies", icon: "hi-shield-check", bg: "rgba(16, 185, 129, 0.1)" },
  { value: "motivation", label: "Motivation", icon: "hi-sparkles", bg: "rgba(139, 92, 246, 0.1)" },
  { value: "sleep", label: "Sleep Issues", icon: "hi-moon", bg: "rgba(99, 102, 241, 0.1)" },
  { value: "general", label: "Just Talk", icon: "hi-chat", bg: "rgba(100, 116, 139, 0.1)" },
];

// Chart refs
const moodChart = ref(null);
let moodChartInstance = null;

const nextMilestone = computed(() => dashboard.value.milestones?.next);

const sobrietyMessage = computed(() => {
  const days = dashboard.value.profile?.sobriety_days || 0;
  if (days === 0) return "Today is the first day of the rest of your life.";
  if (days === 1) return "One day at a time. You've got this.";
  if (days < 7) return "Every day is a victory. Keep going.";
  if (days < 30) return "You're building something extraordinary.";
  if (days < 90) return "Your strength inspires those around you.";
  if (days < 365) return "Recovery is becoming your way of life.";
  return "You are living proof that recovery is possible.";
});

const riskLabel = computed(() => {
  const levels = { low: "Low Risk", moderate: "Moderate", high: "High Risk", critical: "Critical" };
  return levels[dashboard.value.profile?.risk_level] || "Low Risk";
});

const latestScreening = computed(() => dashboard.value.screenings?.latest);
const screeningInstrumentName = computed(() => {
  const names = { audit: "AUDIT", dast10: "DAST-10", cage: "CAGE", assist: "ASSIST" };
  return names[latestScreening.value?.instrument] || "";
});
const recentMilestones = computed(() => dashboard.value.milestones?.recent || []);
const profileSubstances = computed(() => dashboard.value.profile?.substance_use_history || []);
const exerciseStats = ref(null);

// ─── Methods ────────────────────────────────────────────────────────

async function fetchDashboard() {
  try {
    loading.value = true;
    const { data } = await $http.$_getRecoveryDashboard();
    const result = data.data;
    enrolled.value = result.enrolled;
    dashboard.value = result;
  } catch (error) {
    if (error.response?.status === 404) {
      enrolled.value = false;
    } else {
      $toast.error("Failed to load recovery dashboard");
    }
  } finally {
    loading.value = false;
    await nextTick();
    if (enrolled.value) renderMoodChart();
  }
}

function navigateTo(view) {
  activeView.value = view;
}

function navigateToEka(context) {
  const prompt = ekaContextPrompts[context] || ekaContextPrompts.general;
  router.push({
    path: "/app/patient/eka",
    query: { prompt, tags: "recovery" },
  });
}

function openEkaConversation(conversationId) {
  router.push({
    path: "/app/patient/eka",
    query: { conversation: conversationId },
  });
}

async function fetchRecentEkaConversations() {
  try {
    const result = await store.dispatch("eka/fetchConversationsByTag", "recovery");
    recentEkaConversations.value = (result || []).slice(0, 5);
  } catch {
    recentEkaConversations.value = [];
  }
}

function formatEkaDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function renderMoodChart() {
  if (!moodChart.value || !dashboard.value.mood_trend?.length) return;
  if (moodChartInstance) moodChartInstance.destroy();

  const labels = dashboard.value.mood_trend.map((d) => {
    const date = new Date(d.log_date);
    return `${date.getDate()}/${date.getMonth() + 1}`;
  });
  const moodData = dashboard.value.mood_trend.map((d) => d.mood_score);
  const cravingData = dashboard.value.mood_trend.map((d) => d.craving_intensity);

  moodChartInstance = new Chart(moodChart.value, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Mood",
          data: moodData,
          borderColor: "#4FC3F7",
          backgroundColor: "rgba(79, 195, 247, 0.1)",
          fill: true,
          tension: 0.4,
          borderWidth: 2.5,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBackgroundColor: "#fff",
          pointBorderWidth: 2.5,
        },
        {
          label: "Craving",
          data: cravingData,
          borderColor: "#F43F5E",
          backgroundColor: "rgba(244, 63, 94, 0.1)",
          fill: true,
          tension: 0.4,
          borderWidth: 2.5,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBackgroundColor: "#fff",
          pointBorderWidth: 2.5,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: "index" },
      plugins: {
        legend: { display: true, position: "bottom", labels: { usePointStyle: true, padding: 20, font: { size: 13, weight: '500' } } },
        tooltip: { backgroundColor: "rgba(15, 23, 42, 0.9)", cornerRadius: 8, titleFont: { size: 13 }, bodyFont: { size: 13 }, padding: 12 },
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: "#64748B", font: { size: 12 } } },
        y: { min: 0, max: 10, grid: { color: "rgba(0,0,0,0.04)" }, ticks: { color: "#64748B", stepSize: 2, font: { size: 12 } } },
      },
    },
  });
}

function handleReenrolled() {
  showReenrol.value = false;
  fetchDashboard();
}

async function fetchExerciseStats() {
  try {
    const { data } = await $http.$_getExerciseStats();
    exerciseStats.value = data.data;
  } catch {
    // silent — stats card just stays empty
  }
}

onMounted(() => {
  fetchDashboard();
  fetchRecentEkaConversations();
  fetchExerciseStats();
});
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

// ─── Page Wrapper (full-page scroll) ─────────────────────────────
.recovery-page {
  width: 100%;
  min-height: 100vh;
  background: $bg;
}

// ─── Mobile Header ───────────────────────────────────────────────
.mobile-header {
  display: none;
  position: sticky;
  top: 0;
  z-index: 100;
  padding: 12px 16px;
  background: $white;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #F1F5F9;

  @media (max-width: 768px) { display: flex; }

  .menu-btn,
  .notification-btn {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    border: none;
    background: $bg;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $slate;
    cursor: pointer;
    transition: background 0.2s;
    &:hover { background: darken($bg, 3%); }
  }

  .header-logo {
    display: flex;
    align-items: center;
    img { height: 28px; }
  }
}

.page-content {
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
  min-height: 360px;
  color: $white;
  margin-bottom: 20px;
  box-shadow: 0 20px 60px rgba(2, 136, 209, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1) inset;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    padding: 24px 20px;
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
    margin-bottom: 16px;
    @media (max-width: 768px) { font-size: 28px; }
  }

  &__title-accent {
    background: linear-gradient(180deg, #fff 0%, rgba(255,255,255,0.7) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  &__subtitle {
    font-size: 18px;
    opacity: 0.95;
    line-height: 1.6;
    margin-bottom: 28px;
    max-width: 480px;
    @media (max-width: 768px) { font-size: 14px; max-width: none; }
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
    @media (max-width: 768px) { width: 100%; justify-content: space-around; }
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
  }

  &__label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    opacity: 0.7;
    margin-top: 4px;
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
}

.desktop-only {
  @media (max-width: 768px) { display: none; }
}

.badge-pulse {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #86EFAC;
  &--low { background: #86EFAC; }
  &--moderate { background: $amber; }
  &--high { background: #FB923C; animation: pulse 1.5s infinite; }
  &--critical { background: $rose; animation: pulse 1.5s infinite; }
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

  &--1 {
    width: 100%;
    height: 100%;
    animation: spin-slow 20s linear infinite;
  }
  &--2 {
    width: 80%;
    height: 80%;
    animation: spin-slow 15s linear infinite reverse;
  }
  &--3 {
    width: 60%;
    height: 60%;
    animation: spin-slow 10s linear infinite;
  }
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

// ─── Check-in CTA ──────────────────────────────────────────────────
.checkin-cta {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  background: $white;
  border: 2px dashed rgba($sky, 0.3);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.25s ease;
  margin-bottom: 20px;

  &:hover {
    border-color: $sky;
    background: $sky-light;
    transform: translateY(-1px);
  }

  &__icon {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    background: linear-gradient(135deg, $sky-light, rgba($sky, 0.15));
    display: flex;
    align-items: center;
    justify-content: center;
    color: $sky-dark;
    flex-shrink: 0;
  }

  &__text {
    flex: 1;
    h3 { font-size: 15px; font-weight: 600; color: $navy; margin: 0 0 2px; }
    p { font-size: 13px; color: $gray; margin: 0; }
  }

  &__arrow { color: $light-gray; }
}

.checkin-done {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 20px;
  background: $emerald-light;
  border-radius: 12px;
  font-size: 14px;
  color: $emerald-dark;
  font-weight: 500;
  margin-bottom: 20px;

  &__icon { color: $emerald; }
  &__mood {
    margin-left: auto;
    font-size: 12px;
    background: rgba($emerald-dark, 0.1);
    padding: 4px 10px;
    border-radius: 8px;
  }
}

// ─── Bento Grid ────────────────────────────────────────────────────
.bento-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 20px;

  @media (max-width: 1024px) { grid-template-columns: repeat(6, 1fr); }
  @media (max-width: 640px) { grid-template-columns: 1fr; gap: 16px; }
}

.bento-card {
  @include glass-card;
  border-radius: 20px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  grid-column: span 6;

  @media (max-width: 640px) {
    grid-column: span 1;
    padding: 16px;
    border-radius: 16px;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.04);
  }

  &--full-width { grid-column: span 12; @media (max-width: 640px) { grid-column: span 1; } }

  &--accent {
    background: linear-gradient(135deg, $violet-light 0%, rgba($violet, 0.08) 100%);
    border-color: rgba($violet, 0.15);
  }

  &--crisis {
    background: $white;
    border: 1px solid rgba($rose, 0.2);
    &:hover { border-color: $rose; background: $rose-light; }
  }

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

    &--low { background: $emerald-light; color: $emerald-dark; }
    &--moderate { background: $amber-light; color: darken($amber, 10%); }
    &--high { background: #FED7AA; color: #C2410C; }
    &--severe { background: $rose-light; color: $rose; }
  }

  &__chart {
    height: 280px;
    position: relative;
    @media (max-width: 640px) { height: 220px; }
  }

  &__content {
    min-height: 80px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  &__score {
    font-size: 36px;
    font-weight: 800;
    color: $navy;
    margin: 0;
    line-height: 1;
  }

  &__label {
    font-size: 12px;
    color: $gray;
    margin: 4px 0 0;
  }

  &__desc {
    font-size: 13px;
    color: $slate;
    line-height: 1.6;
    margin: 0;
  }

  &__action {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 16px;
    font-size: 13px;
    font-weight: 600;
    color: $violet;
    background: rgba($violet, 0.1);
    padding: 8px 16px;
    border-radius: 10px;
    transition: background 0.2s;
    &:hover { background: rgba($violet, 0.2); }
  }

  &__empty {
    font-size: 13px;
    color: $light-gray;
    font-style: italic;
    margin: 0;
  }

  &__nav {
    position: absolute;
    right: 20px;
    bottom: 20px;
    color: $light-gray;
  }

  // Milestones list
  &__milestones {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__milestone {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__milestone-icon {
    width: 32px;
    height: 32px;
    border-radius: 10px;
    background: linear-gradient(135deg, $amber-light, rgba($amber, 0.2));
    display: flex;
    align-items: center;
    justify-content: center;
    color: darken($amber, 10%);
    flex-shrink: 0;
  }

  &__milestone-info {
    display: flex;
    flex-direction: column;
  }

  &__milestone-name {
    font-size: 13px;
    font-weight: 500;
    color: $navy;
  }

  &__milestone-points {
    font-size: 11px;
    color: $emerald;
    font-weight: 600;
  }

  // Crisis card
  &__crisis-content {
    display: flex;
    align-items: center;
    gap: 16px;
    color: $rose;
    h3 { font-size: 15px; font-weight: 600; color: $navy; margin: 0 0 4px; }
    p { font-size: 13px; color: $gray; margin: 0; }
  }

  // Eka card
  &--eka {
    grid-column: span 12;
    @media (max-width: 640px) { grid-column: span 1; }
    cursor: default;
    &:hover { transform: none; }
  }

  // Recent conversations card
  &--eka-recent {
    cursor: default;
    &:hover { transform: none; }
  }

  &__period--link {
    cursor: pointer;
    color: $sky-dark;
    &:hover { text-decoration: underline; }
  }
}

// ─── Eka Context Buttons ──────────────────────────────────────────
.eka-context-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.eka-context-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 8px 14px;
  background: rgba($violet, 0.08);
  border: 1px solid rgba($violet, 0.12);
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
  color: $violet;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba($violet, 0.18);
    border-color: rgba($violet, 0.3);
    transform: translateY(-1px);
  }
}

// ─── Recent Eka Conversations ─────────────────────────────────────
.eka-recent-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.eka-recent-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  background: $bg;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover { background: rgba($sky, 0.06); }

  &__info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 0;
  }

  &__title {
    font-size: 14px;
    font-weight: 500;
    color: $navy;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__preview {
    font-size: 12px;
    color: $gray;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__date {
    font-size: 11px;
    color: $light-gray;
    flex-shrink: 0;
    margin-left: 12px;
  }
}

// ─── Loading ───────────────────────────────────────────────────────
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 16px;
  color: $gray;

  &__spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba($sky, 0.2);
    border-top-color: $sky;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
}

// ─── Animations ──────────────────────────────────────────────────
@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 40px rgba(255, 255, 255, 0.3), 0 0 80px rgba(79, 195, 247, 0.3); }
  50% { box-shadow: 0 0 60px rgba(255, 255, 255, 0.4), 0 0 100px rgba(79, 195, 247, 0.4); }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
</style>
