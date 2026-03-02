<template>
  <div class="plan-overview">
    <div class="plan-overview__content">
      <!-- Hero Section -->
      <section class="hero">
        <div class="hero__content">
          <button class="back-link" @click="$emit('back')">
            <v-icon name="hi-arrow-left" scale="0.85" />
            <span>Back</span>
          </button>
          <div class="hero__badge">
            <v-icon name="hi-map" />
            <span>{{ activePlan ? currentStageName : 'Recovery Plan' }}</span>
          </div>
          <h1 class="hero__title">
            Recovery<br/>
            <span class="hero__title-accent">Plan</span>
          </h1>
          <p class="hero__subtitle">
            {{ activePlan ? `Stage ${currentStageIndex + 1} of ${activePlan.stages?.length || 0} — ${planProgress}% complete` : 'Your personalised recovery plan will appear here once created by your care team.' }}
          </p>

          <div v-if="activePlan" class="hero__stats">
            <div class="hero-stat">
              <span class="hero-stat__value">{{ activePlan.stages?.length || 0 }}</span>
              <span class="hero-stat__label">Stages</span>
            </div>
            <div class="hero-stat__divider"></div>
            <div class="hero-stat">
              <span class="hero-stat__value">{{ totalGoals }}</span>
              <span class="hero-stat__label">Goals</span>
            </div>
            <div class="hero-stat__divider"></div>
            <div class="hero-stat">
              <span class="hero-stat__value">{{ completedGoals }}</span>
              <span class="hero-stat__label">Done</span>
            </div>
            <div class="hero-stat__divider"></div>
            <div class="hero-stat">
              <span class="hero-stat__value">{{ planProgress }}%</span>
              <span class="hero-stat__label">Progress</span>
            </div>
          </div>
        </div>

        <div class="hero__visual">
          <div class="recovery-orb">
            <div class="orb-ring orb-ring--1"></div>
            <div class="orb-ring orb-ring--2"></div>
            <div class="orb-ring orb-ring--3"></div>
            <div class="orb-core">
              <v-icon name="hi-map" scale="2" />
            </div>
          </div>
        </div>
      </section>

      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        <div class="loading-state__spinner"></div>
        <p>Loading your recovery plan...</p>
      </div>

      <!-- No Plan -->
      <div v-else-if="!activePlan" class="empty-state">
        <div class="empty-state__icon">
          <v-icon name="hi-map" scale="2" />
        </div>
        <h3>No Active Plan</h3>
        <p>Your specialist will create a personalised recovery plan for you. This will include treatment stages, goals, and milestones.</p>
      </div>

      <!-- Plan Content -->
      <template v-else>
        <!-- Overall Progress Bar -->
        <div class="progress-bar-card">
          <div class="progress-bar-card__header">
            <h4>Overall Progress</h4>
            <span class="progress-bar-card__pct">{{ planProgress }}%</span>
          </div>
          <div class="progress-bar-card__track">
            <div class="progress-bar-card__fill" :style="{ width: planProgress + '%' }"></div>
          </div>
        </div>

        <!-- Stage Cards -->
        <div class="stages-list">
          <div
            v-for="(stage, idx) in activePlan.stages"
            :key="stage._id || idx"
            class="stage-card"
            :class="{
              'stage-card--active': stage.status === 'in_progress',
              'stage-card--completed': stage.status === 'completed',
              'stage-card--locked': stage.status === 'pending' && idx > currentStageIndex + 1,
            }"
            @click="toggleStage(idx)"
          >
            <div class="stage-card__header">
              <div class="stage-card__number">
                <template v-if="stage.status === 'completed'">
                  <v-icon name="hi-check" scale="0.75" />
                </template>
                <template v-else>{{ idx + 1 }}</template>
              </div>
              <div class="stage-card__info">
                <h3 class="stage-card__name">{{ stage.stage_name || formatStageName(stage.name) || `Stage ${idx + 1}` }}</h3>
                <span class="stage-card__status" :class="`stage-card__status--${stage.status}`">
                  {{ stageStatusLabel(stage.status) }}
                </span>
              </div>
              <v-icon
                :name="expandedStage === idx ? 'hi-chevron-up' : 'hi-chevron-down'"
                scale="0.85"
                class="stage-card__chevron"
              />
            </div>

            <p v-if="stage.description" class="stage-card__description">{{ stage.description }}</p>

            <!-- Duration -->
            <div v-if="stage.duration_weeks || stage.estimated_duration_weeks" class="stage-card__meta">
              <v-icon name="hi-clock" scale="0.65" />
              <span>{{ stage.duration_weeks || stage.estimated_duration_weeks }} weeks</span>
            </div>

            <!-- Goals (expanded) -->
            <div v-if="expandedStage === idx && stage.goals?.length" class="goals-list">
              <div
                v-for="goal in stage.goals"
                :key="goal.goal_id || goal._id"
                class="goal-item"
                :class="{ 'goal-item--done': goal.status === 'completed' }"
              >
                <button
                  class="goal-item__check"
                  :class="{ 'goal-item__check--done': goal.status === 'completed' }"
                  @click.stop="toggleGoal(stage, goal)"
                  :disabled="stage.status !== 'in_progress'"
                >
                  <v-icon v-if="goal.status === 'completed'" name="hi-check" scale="0.6" />
                </button>
                <div class="goal-item__info">
                  <span class="goal-item__title">{{ goal.title || goal.description }}</span>
                  <span v-if="goal.measurable_target" class="goal-item__target">{{ goal.measurable_target }}</span>
                  <span v-if="goal.target_date" class="goal-item__date">
                    Due {{ formatDate(goal.target_date) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- No goals -->
            <p v-if="expandedStage === idx && !stage.goals?.length" class="stage-card__no-goals">
              No goals defined for this stage yet.
            </p>
          </div>
        </div>

        <!-- Past Plans -->
        <div v-if="pastPlans.length" class="past-plans-section">
          <h3 class="section-title">Past Plans</h3>
          <div
            v-for="plan in pastPlans"
            :key="plan._id"
            class="past-plan-card"
          >
            <div class="past-plan-card__header">
              <span class="past-plan-card__name">{{ plan.plan_name || 'Recovery Plan' }}</span>
              <span class="past-plan-card__status" :class="`past-plan-card__status--${plan.status}`">
                {{ plan.status }}
              </span>
            </div>
            <div class="past-plan-card__meta">
              <span>{{ plan.stages?.length || 0 }} stages</span>
              <span>&middot;</span>
              <span>{{ formatDate(plan.created_at) }}</span>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted } from "vue";
import { useToast } from "vue-toast-notification";

const $http = inject("$http");
const $toast = useToast();

const loading = ref(true);
const activePlan = ref(null);
const pastPlans = ref([]);
const expandedStage = ref(null);

const currentStageIndex = computed(() => {
  if (!activePlan.value?.stages) return 0;
  const idx = activePlan.value.stages.findIndex(s => s.status === "in_progress");
  return idx >= 0 ? idx : 0;
});

const currentStageName = computed(() => {
  if (!activePlan.value?.stages) return "";
  return activePlan.value.stages[currentStageIndex.value]?.stage_name || "";
});

const totalGoals = computed(() => {
  if (!activePlan.value?.stages) return 0;
  return activePlan.value.stages.reduce((sum, s) => sum + (s.goals?.length || 0), 0);
});

const completedGoals = computed(() => {
  if (!activePlan.value?.stages) return 0;
  return activePlan.value.stages.reduce(
    (sum, s) => sum + (s.goals?.filter(g => g.status === "completed").length || 0),
    0,
  );
});

const planProgress = computed(() => {
  if (totalGoals.value === 0) return 0;
  return Math.round((completedGoals.value / totalGoals.value) * 100);
});

function formatStageName(name) {
  if (!name) return '';
  return name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function stageStatusLabel(status) {
  const labels = { pending: "Upcoming", in_progress: "In Progress", completed: "Completed", skipped: "Skipped" };
  return labels[status] || status;
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function toggleStage(idx) {
  expandedStage.value = expandedStage.value === idx ? null : idx;
}

async function toggleGoal(stage, goal) {
  if (stage.status !== "in_progress") return;
  const newStatus = goal.status === "completed" ? "in_progress" : "completed";
  try {
    await $http.$_updateGoalStatus({
      stageId: stage.stage_id || stage._id,
      goalId: goal.goal_id || goal._id,
      payload: { status: newStatus },
    });
    goal.status = newStatus;
    $toast.success(newStatus === "completed" ? "Goal completed!" : "Goal reopened");
  } catch {
    $toast.error("Failed to update goal");
  }
}

async function fetchPlan() {
  loading.value = true;
  try {
    const { data } = await $http.$_getActivePlan();
    activePlan.value = data.data || null;
    if (activePlan.value) {
      expandedStage.value = currentStageIndex.value;
    }
  } catch (err) {
    if (err.response?.status !== 404) {
      $toast.error("Failed to load recovery plan");
    }
  }

  try {
    const { data } = await $http.$_getPlanHistory({ limit: 5 });
    pastPlans.value = data.data || [];
  } catch {
    // silent
  }

  loading.value = false;
}

onMounted(fetchPlan);
</script>

<style scoped lang="scss">
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

.plan-overview {
  width: 100%;
  min-height: 100vh;
  background: $bg;

  &__content {
    max-width: 1400px;
    margin: 0 auto;
    padding: 24px 32px 100px;
    @media (max-width: 768px) { padding: 16px 16px 120px; }
  }
}

// Hero
.hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  align-items: center;
  padding: 48px 40px 56px;
  background: linear-gradient(135deg, $violet 0%, darken($violet, 15%) 50%, darken($violet, 25%) 100%);
  border-radius: 28px;
  min-height: 300px;
  color: $white;
  margin-bottom: 24px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    padding: 24px 20px;
    text-align: center;
    min-height: auto;
  }

  &__content { display: flex; flex-direction: column; }

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
    @media (max-width: 768px) { display: none; }
  }
}

.hero-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  &__value { font-size: 24px; font-weight: 700; line-height: 1; }
  &__label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.7; margin-top: 4px; }
  &__divider { width: 1px; height: 32px; background: rgba(255, 255, 255, 0.2); }
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

.recovery-orb {
  position: relative;
  width: 180px;
  height: 180px;
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
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(20px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $white;
}

// Progress Bar
.progress-bar-card {
  @include glass-card;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    h4 { font-size: 14px; font-weight: 600; color: $navy; margin: 0; }
  }

  &__pct { font-size: 14px; font-weight: 700; color: $violet; }

  &__track {
    height: 8px;
    background: rgba(0, 0, 0, 0.06);
    border-radius: 4px;
    overflow: hidden;
  }

  &__fill {
    height: 100%;
    background: linear-gradient(90deg, $violet, $sky);
    border-radius: 4px;
    transition: width 0.6s ease;
  }
}

// Stages
.stages-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 32px;
}

.stage-card {
  @include glass-card;
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.25s ease;

  &:hover { transform: translateY(-1px); box-shadow: 0 8px 30px rgba(0, 0, 0, 0.06); }

  &--active { border-left: 4px solid $violet; }
  &--completed { opacity: 0.8; }
  &--locked { opacity: 0.5; }

  &__header {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  &__number {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: rgba($violet, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 700;
    color: $violet;
    flex-shrink: 0;

    .stage-card--completed & { background: $emerald-light; color: $emerald-dark; }
  }

  &__info { flex: 1; }

  &__name { font-size: 15px; font-weight: 600; color: $navy; margin: 0; }

  &__status {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;

    &--pending { color: $light-gray; }
    &--in_progress { color: $violet; }
    &--completed { color: $emerald; }
    &--skipped { color: $gray; }
  }

  &__chevron { color: $light-gray; flex-shrink: 0; }

  &__description {
    font-size: 13px;
    color: $gray;
    line-height: 1.5;
    margin: 12px 0 0;
    padding-left: 50px;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: $light-gray;
    margin-top: 8px;
    padding-left: 50px;
  }

  &__no-goals {
    font-size: 13px;
    color: $light-gray;
    font-style: italic;
    margin: 12px 0 0;
    padding-left: 50px;
  }
}

// Goals
.goals-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 16px;
  padding-left: 50px;
}

.goal-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: $bg;
  border-radius: 12px;
  transition: background 0.2s;

  &--done { opacity: 0.6; }

  &__check {
    width: 24px;
    height: 24px;
    border-radius: 8px;
    border: 2px solid rgba($violet, 0.3);
    background: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all 0.2s;
    color: $white;

    &--done {
      background: $emerald;
      border-color: $emerald;
    }

    &:hover:not(:disabled) { border-color: $violet; }
    &:disabled { cursor: default; opacity: 0.5; }
  }

  &__info { display: flex; flex-direction: column; gap: 2px; }
  &__title { font-size: 13px; font-weight: 500; color: $navy; .goal-item--done & { text-decoration: line-through; } }
  &__target { font-size: 11px; color: $sky-dark; font-weight: 500; }
  &__date { font-size: 11px; color: $light-gray; }
}

// Past Plans
.past-plans-section { margin-top: 32px; }

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: $navy;
  margin: 0 0 16px;
}

.past-plan-card {
  @include glass-card;
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 8px;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__name { font-size: 14px; font-weight: 600; color: $navy; }

  &__status {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    padding: 3px 10px;
    border-radius: 6px;
    &--completed { background: $emerald-light; color: $emerald-dark; }
    &--archived { background: rgba(0,0,0,0.06); color: $gray; }
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: $light-gray;
    margin-top: 6px;
  }
}

// Empty + Loading
.empty-state {
  text-align: center;
  padding: 60px 20px;
  &__icon { width: 64px; height: 64px; border-radius: 20px; background: $violet-light; display: flex; align-items: center; justify-content: center; color: $violet; margin: 0 auto 20px; }
  h3 { font-size: 18px; font-weight: 600; color: $navy; margin: 0 0 8px; }
  p { font-size: 14px; color: $gray; line-height: 1.6; max-width: 400px; margin: 0 auto; }
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  gap: 16px;
  color: $gray;
  &__spinner { width: 40px; height: 40px; border: 3px solid rgba($violet, 0.2); border-top-color: $violet; border-radius: 50%; animation: spin 0.8s linear infinite; }
}

@keyframes spin { to { transform: rotate(360deg); } }
@keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>
