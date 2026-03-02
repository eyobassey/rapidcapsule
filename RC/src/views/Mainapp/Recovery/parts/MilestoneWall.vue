<template>
  <div class="milestone-wall">
    <div class="milestone-wall__content">
      <!-- Hero Section -->
      <section class="hero">
        <div class="hero__content">
          <button class="back-link" @click="$emit('back')">
            <v-icon name="hi-arrow-left" scale="0.85" />
            <span>Back</span>
          </button>
          <div class="hero__badge">
            <v-icon name="hi-star" />
            <span>{{ totalPoints }} Points</span>
          </div>
          <h1 class="hero__title">
            Milestone<br/>
            <span class="hero__title-accent">Wall</span>
          </h1>
          <p class="hero__subtitle">
            {{ milestones.length ? `${stats.total_milestones || milestones.length} milestones earned. ${stats.current_streak || 0} day streak going strong.` : 'Keep showing up every day. Your first milestone is just around the corner.' }}
          </p>

          <div class="hero__stats">
            <div class="hero-stat">
              <span class="hero-stat__value">{{ stats.total_milestones || 0 }}</span>
              <span class="hero-stat__label">Earned</span>
            </div>
            <div class="hero-stat__divider"></div>
            <div class="hero-stat">
              <span class="hero-stat__value">{{ totalPoints }}</span>
              <span class="hero-stat__label">Points</span>
            </div>
            <div class="hero-stat__divider"></div>
            <div class="hero-stat">
              <span class="hero-stat__value">{{ stats.current_streak || 0 }}</span>
              <span class="hero-stat__label">Day Streak</span>
            </div>
          </div>
        </div>

        <div class="hero__visual">
          <div class="recovery-orb">
            <div class="orb-ring orb-ring--1"></div>
            <div class="orb-ring orb-ring--2"></div>
            <div class="orb-ring orb-ring--3"></div>
            <div class="orb-core">
              <v-icon name="hi-star" scale="2" />
            </div>
          </div>
        </div>
      </section>

      <!-- Next Milestone -->
      <div v-if="stats.next_milestone" class="next-milestone">
        <div class="next-milestone__progress">
          <svg viewBox="0 0 60 60" class="next-milestone__ring">
            <circle cx="30" cy="30" r="26" fill="none" stroke="rgba(245,158,11,0.15)" stroke-width="5" />
            <circle
              cx="30" cy="30" r="26"
              fill="none" stroke="#F59E0B" stroke-width="5"
              stroke-linecap="round"
              :stroke-dasharray="nextCircumference"
              :stroke-dashoffset="nextOffset"
              transform="rotate(-90 30 30)"
            />
          </svg>
          <v-icon name="hi-star" scale="1" class="next-milestone__icon" />
        </div>
        <div class="next-milestone__info">
          <span class="next-milestone__label">Next Milestone</span>
          <span class="next-milestone__name">{{ stats.next_milestone.milestone_name }}</span>
          <span class="next-milestone__days">{{ stats.next_milestone.days_remaining }} days to go</span>
        </div>
        <span class="next-milestone__points">+{{ stats.next_milestone.reward_points }} pts</span>
      </div>

      <!-- Tab Filter -->
      <div class="filter-section">
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
      </div>

      <!-- Milestones Grid -->
      <div v-if="!loading && filteredMilestones.length" class="milestones-grid">
        <div
          v-for="m in filteredMilestones"
          :key="m._id"
          class="milestone-tile"
          :class="{ 'milestone-tile--celebrated': m.celebrated }"
        >
          <div class="milestone-tile__badge" :class="badgeClass(m)">
            <v-icon :name="badgeIcon(m)" scale="1.2" />
          </div>
          <h4 class="milestone-tile__name">{{ m.milestone_name }}</h4>
          <span class="milestone-tile__date">{{ formatDate(m.achieved_at) }}</span>
          <span class="milestone-tile__points">+{{ m.reward_points }} pts</span>

          <button
            v-if="!m.celebrated"
            class="milestone-tile__celebrate"
            @click="celebrate(m._id)"
          >
            Celebrate!
          </button>
          <div v-else class="milestone-tile__celebrated-badge">
            <v-icon name="hi-check-circle" scale="0.7" />
            Celebrated
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="!loading && !filteredMilestones.length" class="empty-state">
        <div class="empty-state__icon">
          <v-icon name="hi-star" scale="2.5" />
        </div>
        <h3>{{ activeTab === 'all' ? 'No milestones yet' : 'No milestones in this category' }}</h3>
        <p>Keep showing up every day. Your first milestone is just around the corner.</p>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading your milestones...</p>
      </div>
    </div>

    <!-- Celebration Overlay -->
    <transition name="celebrate">
      <div v-if="showCelebration" class="celebration-overlay" @click="showCelebration = false">
        <div class="celebration-content">
          <div class="confetti" v-for="n in 20" :key="n" :style="confettiStyle(n)"></div>
          <v-icon name="hi-star" scale="3" class="celebration-star" />
          <h2>Well Done!</h2>
          <p>Keep going, you're amazing.</p>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted } from "vue";
import { useToast } from "vue-toast-notification";

const emit = defineEmits(["back"]);
const $http = inject("$http");
const $toast = useToast();

const loading = ref(true);
const milestones = ref([]);
const stats = ref({});
const activeTab = ref("all");
const showCelebration = ref(false);

const tabs = [
  { key: "all", label: "All" },
  { key: "sobriety", label: "Sobriety" },
  { key: "engagement", label: "Engagement" },
];

const totalPoints = computed(() =>
  milestones.value.reduce((sum, m) => sum + (m.reward_points || 0), 0)
);

const sobrietyTypes = ["sobriety_days"];
const engagementTypes = [
  "screening_improvement",
  "goals_achieved",
  "journal_streak",
  "appointment_streak",
  "companion_sessions",
  "exercise_streak",
  "custom",
];

const filteredMilestones = computed(() => {
  if (activeTab.value === "all") return milestones.value;
  if (activeTab.value === "sobriety")
    return milestones.value.filter((m) => sobrietyTypes.includes(m.milestone_type));
  if (activeTab.value === "engagement")
    return milestones.value.filter((m) => engagementTypes.includes(m.milestone_type));
  return milestones.value;
});

const nextCircumference = 2 * Math.PI * 26;
const nextOffset = computed(() => {
  if (!stats.value.next_milestone) return nextCircumference;
  const { days_required, days_remaining } = stats.value.next_milestone;
  const progress = (days_required - days_remaining) / days_required;
  return nextCircumference * (1 - Math.min(progress, 1));
});

function badgeClass(m) {
  const levels = {
    "24 Hours": "badge--bronze",
    "One Week": "badge--bronze",
    "Two Weeks": "badge--silver",
    "One Month": "badge--silver",
    "90 Days": "badge--gold",
    "Six Months": "badge--gold",
    "One Year": "badge--platinum",
  };
  return levels[m.milestone_name] || "badge--bronze";
}

function badgeIcon(m) {
  if (m.milestone_type === "engagement") return "hi-badge-check";
  return "hi-star";
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

async function celebrate(milestoneId) {
  try {
    await $http.$_celebrateMilestone(milestoneId);
    const m = milestones.value.find((x) => x._id === milestoneId);
    if (m) m.celebrated = true;
    showCelebration.value = true;
    setTimeout(() => (showCelebration.value = false), 3000);
  } catch {
    $toast.error("Failed to celebrate milestone");
  }
}

function confettiStyle(n) {
  const colors = ["#10B981", "#F59E0B", "#8B5CF6", "#F43F5E", "#3B82F6", "#EC4899"];
  return {
    left: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 0.5}s`,
    background: colors[n % colors.length],
    width: `${6 + Math.random() * 8}px`,
    height: `${6 + Math.random() * 8}px`,
  };
}

async function fetchData() {
  loading.value = true;
  try {
    const [milestonesRes, statsRes] = await Promise.all([
      $http.$_getMilestones(),
      $http.$_getSobrietyStats(),
    ]);
    milestones.value = milestonesRes.data.data || [];
    stats.value = statsRes.data.data || {};
  } catch {
    $toast.error("Failed to load milestones");
  } finally {
    loading.value = false;
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
.milestone-wall {
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
  background: linear-gradient(135deg, $amber 0%, #F97316 50%, #EA580C 100%);
  border-radius: 28px;
  min-height: 320px;
  color: $white;
  margin-bottom: 20px;
  box-shadow: 0 20px 60px rgba(245, 158, 11, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1) inset;

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
    display: flex; justify-content: center; align-items: center; position: relative;
    @media (max-width: 768px) { display: none; }
  }
}

.hero-stat {
  display: flex; flex-direction: column; align-items: center;
  &__value { font-size: 24px; font-weight: 700; line-height: 1; @media (max-width: 768px) { font-size: 18px; } }
  &__label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.7; margin-top: 4px; }
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
  box-shadow: 0 0 40px rgba(255, 255, 255, 0.3), 0 0 80px rgba(245, 158, 11, 0.3);
  animation: pulse-glow 3s ease-in-out infinite;
}

// ─── Next Milestone ─────────────────────────────────────────────
.next-milestone {
  @include glass-card;
  display: flex; align-items: center; gap: 16px;
  padding: 20px; border-radius: 20px;
  margin: 24px 32px 0;
  @media (max-width: 768px) { margin: 20px 16px 0; }

  &__progress { position: relative; width: 60px; height: 60px; flex-shrink: 0; }
  &__ring { width: 100%; height: 100%; }
  &__icon {
    position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
    color: $amber;
  }

  &__info { flex: 1; }
  &__label { display: block; font-size: 11px; color: $gray; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
  &__name { display: block; font-size: 15px; font-weight: 600; color: $navy; }
  &__days { display: block; font-size: 13px; color: $amber; }

  &__points {
    font-size: 14px; font-weight: 700; color: darken($amber, 10%);
    background: $amber-light; padding: 6px 14px;
    border-radius: 10px; white-space: nowrap;
  }
}

// ─── Filter Section ──────────────────────────────────────────────
.filter-section {
  padding: 24px 32px 0;
  @media (max-width: 768px) { padding: 20px 16px 0; }
}

.tab-filter {
  display: flex; gap: 6px;
  background: $white; border-radius: 14px; padding: 4px;
  border: 1px solid rgba(0, 0, 0, 0.05);

  &__btn {
    flex: 1; padding: 10px; border: none; border-radius: 10px;
    font-size: 13px; font-weight: 600; color: $gray;
    background: transparent; cursor: pointer; transition: all 0.2s;
    &:hover { color: $navy; }
    &--active {
      background: linear-gradient(135deg, $amber, #F97316);
      color: $white;
      box-shadow: 0 2px 8px rgba($amber, 0.3);
    }
  }
}

// ─── Milestones Grid ────────────────────────────────────────────
.milestones-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  padding: 24px 32px 0;
  @media (max-width: 768px) { padding: 20px 16px 0; }
  @media (max-width: 480px) { grid-template-columns: 1fr; }
}

.milestone-tile {
  @include glass-card;
  border-radius: 20px;
  padding: 24px 20px;
  text-align: center;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08); }
  &--celebrated { border-color: rgba($amber, 0.3); }

  &__badge {
    width: 56px; height: 56px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 14px;

    &.badge--bronze { background: linear-gradient(135deg, #FED7AA, #FDBA74); color: #C2410C; }
    &.badge--silver { background: linear-gradient(135deg, #E2E8F0, #CBD5E1); color: #475569; }
    &.badge--gold { background: linear-gradient(135deg, $amber-light, #FCD34D); color: #B45309; }
    &.badge--platinum { background: linear-gradient(135deg, $violet-light, #C4B5FD); color: $violet; }
  }

  &__name { font-size: 15px; font-weight: 600; color: $navy; margin: 0 0 4px; display: block; }
  &__date { font-size: 12px; color: $light-gray; display: block; margin-bottom: 8px; }
  &__points { font-size: 13px; font-weight: 700; color: $emerald; display: block; margin-bottom: 12px; }

  &__celebrate {
    padding: 8px 20px; border: none; border-radius: 10px;
    background: linear-gradient(135deg, $amber-light, rgba($amber, 0.2));
    color: darken($amber, 15%); font-size: 13px; font-weight: 600;
    cursor: pointer; transition: all 0.2s;
    &:hover { background: linear-gradient(135deg, #FDE68A, rgba($amber, 0.3)); }
  }

  &__celebrated-badge {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 12px; color: $emerald; font-weight: 600;
  }
}

// ─── Empty State ────────────────────────────────────────────────
.empty-state {
  text-align: center; padding: 48px 32px;

  &__icon {
    width: 72px; height: 72px; border-radius: 50%;
    background: linear-gradient(135deg, $amber-light, rgba($amber, 0.15));
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 20px; color: $amber;
  }

  h3 { font-size: 18px; font-weight: 700; color: $navy; margin: 0 0 8px; }
  p { font-size: 14px; color: $gray; margin: 0; line-height: 1.5; }
}

// ─── Loading ─────────────────────────────────────────────────────
.loading-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  min-height: 400px; gap: 16px; color: $gray; font-size: 14px;
}
.loading-spinner {
  width: 36px; height: 36px; border: 3px solid rgba($amber, 0.2);
  border-top-color: $amber; border-radius: 50%; animation: spin 0.8s linear infinite;
}

// ─── Celebration Overlay ────────────────────────────────────────
.celebration-overlay {
  position: fixed; inset: 0; background: rgba(0, 0, 0, 0.6);
  display: flex; align-items: center; justify-content: center; z-index: 1100;
}
.celebration-content {
  text-align: center; color: $white; position: relative;
  h2 { font-size: 32px; font-weight: 800; margin: 16px 0 8px; }
  p { font-size: 16px; opacity: 0.8; }
}
.celebration-star { color: $amber; animation: star-pulse 0.6s ease-out; }
.confetti {
  position: absolute; border-radius: 2px;
  animation: confetti-fall 2s ease-out forwards;
}

.celebrate-enter-active { animation: celebrate-in 0.3s ease-out; }
.celebrate-leave-active { animation: celebrate-in 0.3s reverse; }

// ─── Animations ──────────────────────────────────────────────────
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 40px rgba(255, 255, 255, 0.3), 0 0 80px rgba(245, 158, 11, 0.3); }
  50% { box-shadow: 0 0 60px rgba(255, 255, 255, 0.4), 0 0 100px rgba(245, 158, 11, 0.4); }
}
@keyframes star-pulse { 0% { transform: scale(0); } 50% { transform: scale(1.3); } 100% { transform: scale(1); } }
@keyframes confetti-fall { 0% { transform: translateY(0) rotate(0deg); opacity: 1; } 100% { transform: translateY(200px) rotate(720deg); opacity: 0; } }
@keyframes celebrate-in { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
</style>
