<template>
  <div class="group-sessions">
    <div class="group-sessions__content">
      <!-- Hero Section -->
      <section class="hero">
        <div class="hero__content">
          <button class="back-link" @click="$emit('back')">
            <v-icon name="hi-arrow-left" scale="0.85" />
            <span>Back</span>
          </button>
          <div class="hero__badge">
            <v-icon name="hi-user-group" />
            <span>Group Therapy</span>
          </div>
          <h1 class="hero__title">
            Group<br/>
            <span class="hero__title-accent">Sessions</span>
          </h1>
          <p class="hero__subtitle">
            Join peer-led and facilitator-guided group sessions. Connection and shared experience are powerful tools for recovery.
          </p>

          <div class="hero__stats">
            <div class="hero-stat">
              <span class="hero-stat__value">{{ mySessions.length }}</span>
              <span class="hero-stat__label">Enrolled</span>
            </div>
            <div class="hero-stat__divider"></div>
            <div class="hero-stat">
              <span class="hero-stat__value">{{ availableSessions.length }}</span>
              <span class="hero-stat__label">Available</span>
            </div>
          </div>
        </div>

        <div class="hero__visual">
          <div class="recovery-orb">
            <div class="orb-ring orb-ring--1"></div>
            <div class="orb-ring orb-ring--2"></div>
            <div class="orb-ring orb-ring--3"></div>
            <div class="orb-core">
              <v-icon name="hi-user-group" scale="2" />
            </div>
          </div>
        </div>
      </section>

      <!-- Tab Filter -->
      <div class="tab-section">
        <div class="tab-filter">
          <button
            class="tab-filter__btn"
            :class="{ 'tab-filter__btn--active': activeTab === 'my' }"
            @click="activeTab = 'my'"
          >
            My Sessions
          </button>
          <button
            class="tab-filter__btn"
            :class="{ 'tab-filter__btn--active': activeTab === 'available' }"
            @click="activeTab = 'available'"
          >
            Available
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        <div class="loading-state__spinner"></div>
        <p>Loading sessions...</p>
      </div>

      <!-- My Sessions -->
      <template v-if="!loading && activeTab === 'my'">
        <div v-if="mySessions.length === 0" class="empty-state">
          <div class="empty-state__icon">
            <v-icon name="hi-user-group" scale="2" />
          </div>
          <h3>No Enrolled Sessions</h3>
          <p>Browse available sessions and join one to connect with others in recovery.</p>
          <button class="empty-state__cta" @click="activeTab = 'available'">
            Browse Sessions
          </button>
        </div>

        <div v-else class="session-list">
          <div
            v-for="session in mySessions"
            :key="session._id"
            class="session-card session-card--enrolled"
          >
            <div class="session-card__header">
              <div class="session-card__type-badge">
                {{ formatCategory(session.session_category) }}
              </div>
              <span class="session-card__status" :class="`session-card__status--${session.status}`">
                {{ session.status }}
              </span>
            </div>
            <h3 class="session-card__name">{{ session.session_name }}</h3>
            <div class="session-card__meta">
              <div class="session-card__meta-item">
                <v-icon name="hi-calendar" scale="0.65" />
                <span>{{ formatDate(session.next_session_at || session.start_date) }}</span>
              </div>
              <div class="session-card__meta-item">
                <v-icon name="hi-user-group" scale="0.65" />
                <span>{{ session.enrolled_count || 0 }}/{{ session.max_participants || '?' }}</span>
              </div>
            </div>
            <div class="session-card__facilitator" v-if="session.facilitator">
              <v-icon name="hi-user" scale="0.6" />
              <span>{{ getFacilitatorName(session.facilitator) }}</span>
            </div>
            <div class="session-card__actions">
              <button class="btn btn--danger-outline" @click="handleLeave(session._id)" :disabled="actionLoading">
                Leave Session
              </button>
            </div>
          </div>
        </div>
      </template>

      <!-- Available Sessions -->
      <template v-if="!loading && activeTab === 'available'">
        <div v-if="availableSessions.length === 0" class="empty-state">
          <div class="empty-state__icon">
            <v-icon name="hi-search" scale="2" />
          </div>
          <h3>No Sessions Available</h3>
          <p>Check back later for upcoming group sessions.</p>
        </div>

        <div v-else class="session-list">
          <div
            v-for="session in availableSessions"
            :key="session._id"
            class="session-card"
          >
            <div class="session-card__header">
              <div class="session-card__type-badge">
                {{ formatCategory(session.session_category) }}
              </div>
              <span class="session-card__group-type">{{ session.group_type || 'open' }}</span>
            </div>
            <h3 class="session-card__name">{{ session.session_name }}</h3>
            <p v-if="session.description" class="session-card__desc">{{ session.description }}</p>
            <div class="session-card__meta">
              <div class="session-card__meta-item">
                <v-icon name="hi-calendar" scale="0.65" />
                <span>{{ formatDate(session.next_session_at || session.start_date) }}</span>
              </div>
              <div class="session-card__meta-item">
                <v-icon name="hi-user-group" scale="0.65" />
                <span>{{ session.enrolled_count || 0 }}/{{ session.max_participants || '?' }} spots</span>
              </div>
            </div>
            <div class="session-card__facilitator" v-if="session.facilitator">
              <v-icon name="hi-user" scale="0.6" />
              <span>{{ getFacilitatorName(session.facilitator) }}</span>
            </div>
            <div class="session-card__actions">
              <button
                class="btn btn--primary"
                @click="handleJoin(session._id)"
                :disabled="actionLoading || isFull(session)"
              >
                {{ isFull(session) ? 'Full' : 'Join Session' }}
              </button>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, inject } from "vue";
import { useToast } from "vue-toast-notification";

const $http = inject("$http");
const $toast = useToast();

const loading = ref(true);
const actionLoading = ref(false);
const activeTab = ref("my");
const mySessions = ref([]);
const availableSessions = ref([]);

function formatCategory(cat) {
  if (!cat) return "General";
  return cat.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function formatDate(dateStr) {
  if (!dateStr) return "TBC";
  return new Date(dateStr).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function getFacilitatorName(f) {
  if (!f?.profile) return "Facilitator";
  return `${f.profile.first_name || ""} ${f.profile.last_name || ""}`.trim() || "Facilitator";
}

function isFull(session) {
  if (!session.max_participants) return false;
  return (session.enrolled_count || 0) >= session.max_participants;
}

async function fetchData() {
  loading.value = true;
  try {
    const [myRes, allRes] = await Promise.allSettled([
      $http.$_getMyGroupSessions(),
      $http.$_getGroupSessions({ status: "active" }),
    ]);
    mySessions.value = myRes.status === "fulfilled" ? (myRes.value.data.data || []) : [];
    availableSessions.value = allRes.status === "fulfilled" ? (allRes.value.data.data || []) : [];
  } finally {
    loading.value = false;
  }
}

async function handleJoin(sessionId) {
  actionLoading.value = true;
  try {
    await $http.$_joinGroupSession(sessionId);
    $toast.success("Joined session successfully");
    await fetchData();
  } catch (err) {
    $toast.error(err.response?.data?.message || "Failed to join session");
  } finally {
    actionLoading.value = false;
  }
}

async function handleLeave(sessionId) {
  actionLoading.value = true;
  try {
    await $http.$_leaveGroupSession(sessionId);
    $toast.success("Left session");
    await fetchData();
  } catch (err) {
    $toast.error(err.response?.data?.message || "Failed to leave session");
  } finally {
    actionLoading.value = false;
  }
}

onMounted(fetchData);
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
$rose: #F43F5E;
$rose-light: #FFE4E6;
$amber: #F59E0B;
$amber-light: #FEF3C7;
$teal: #14B8A6;
$teal-light: #CCFBF1;

@mixin glass-card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);
}

.group-sessions {
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

.hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  align-items: center;
  padding: 48px 40px 56px;
  background: linear-gradient(135deg, $teal 0%, darken($teal, 15%) 50%, darken($teal, 25%) 100%);
  border-radius: 28px;
  min-height: 280px;
  color: $white;
  margin-bottom: 24px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    padding: 24px 20px;
    text-align: center;
    min-height: auto;
  }

  &__content { display: flex; flex-direction: column; }
  &__badge { display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; background: rgba(255,255,255,0.15); backdrop-filter: blur(10px); border-radius: 24px; width: fit-content; margin-bottom: 20px; font-size: 12px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; @media (max-width: 768px) { margin: 0 auto 16px; } }
  &__title { font-size: 48px; font-weight: 800; line-height: 1.1; letter-spacing: -1px; margin-bottom: 16px; @media (max-width: 768px) { font-size: 28px; } }
  &__title-accent { background: linear-gradient(180deg, #fff 0%, rgba(255,255,255,0.7) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  &__subtitle { font-size: 18px; opacity: 0.95; line-height: 1.6; margin-bottom: 28px; max-width: 480px; @media (max-width: 768px) { font-size: 14px; max-width: none; } }
  &__stats { display: flex; align-items: center; gap: 20px; padding: 16px 20px; background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); border-radius: 16px; width: fit-content; @media (max-width: 768px) { width: 100%; justify-content: space-around; } }
  &__visual { display: flex; justify-content: center; align-items: center; @media (max-width: 768px) { display: none; } }
}

.hero-stat {
  display: flex; flex-direction: column; align-items: center;
  &__value { font-size: 24px; font-weight: 700; line-height: 1; }
  &__label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.7; margin-top: 4px; }
  &__divider { width: 1px; height: 32px; background: rgba(255,255,255,0.2); }
}

.back-link { display: inline-flex; align-items: center; gap: 6px; background: none; border: none; color: rgba(255,255,255,0.7); font-size: 13px; font-weight: 500; cursor: pointer; padding: 0; margin-bottom: 16px; transition: color 0.2s; &:hover { color: #fff; } }

.recovery-orb { position: relative; width: 180px; height: 180px; display: flex; align-items: center; justify-content: center; }
.orb-ring { position: absolute; border-radius: 50%; border: 2px solid rgba(255,255,255,0.2); &--1 { width: 100%; height: 100%; animation: spin-slow 20s linear infinite; } &--2 { width: 80%; height: 80%; animation: spin-slow 15s linear infinite reverse; } &--3 { width: 60%; height: 60%; animation: spin-slow 10s linear infinite; } }
.orb-core { width: 80px; height: 80px; background: rgba(255,255,255,0.2); backdrop-filter: blur(20px); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: $white; }

// Tabs
.tab-section { margin-bottom: 20px; }
.tab-filter {
  display: inline-flex;
  background: $white;
  border-radius: 12px;
  padding: 4px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);

  &__btn {
    padding: 10px 20px;
    border: none;
    background: none;
    font-size: 13px;
    font-weight: 600;
    color: $gray;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s;

    &--active { background: $teal; color: $white; }
    &:hover:not(&--active) { color: $navy; }
  }
}

// Session Cards
.session-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.session-card {
  @include glass-card;
  border-radius: 16px;
  padding: 20px;
  transition: all 0.25s ease;

  &:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(0,0,0,0.08); }

  &--enrolled { border-left: 4px solid $teal; }

  &__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }

  &__type-badge {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 4px 10px;
    background: $teal-light;
    color: darken($teal, 15%);
    border-radius: 6px;
  }

  &__status {
    font-size: 11px; font-weight: 600; text-transform: uppercase;
    &--active { color: $emerald; }
    &--scheduled { color: $sky-dark; }
    &--completed { color: $gray; }
  }

  &__group-type { font-size: 11px; color: $light-gray; text-transform: capitalize; }

  &__name { font-size: 16px; font-weight: 600; color: $navy; margin: 0 0 8px; }
  &__desc { font-size: 13px; color: $gray; line-height: 1.5; margin: 0 0 12px; }

  &__meta { display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 10px; }
  &__meta-item { display: flex; align-items: center; gap: 5px; font-size: 12px; color: $gray; }

  &__facilitator { display: flex; align-items: center; gap: 6px; font-size: 12px; color: $light-gray; margin-bottom: 14px; }

  &__actions { display: flex; gap: 8px; }
}

// Buttons
.btn {
  padding: 10px 20px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s;

  &:disabled { opacity: 0.5; cursor: default; }

  &--primary {
    background: $teal;
    color: $white;
    &:hover:not(:disabled) { background: darken($teal, 8%); }
  }

  &--danger-outline {
    background: none;
    border: 1px solid rgba($rose, 0.3);
    color: $rose;
    &:hover:not(:disabled) { background: $rose-light; border-color: $rose; }
  }
}

// Empty + Loading
.empty-state {
  text-align: center;
  padding: 60px 20px;
  &__icon { width: 64px; height: 64px; border-radius: 20px; background: $teal-light; display: flex; align-items: center; justify-content: center; color: $teal; margin: 0 auto 20px; }
  h3 { font-size: 18px; font-weight: 600; color: $navy; margin: 0 0 8px; }
  p { font-size: 14px; color: $gray; line-height: 1.6; max-width: 400px; margin: 0 auto 20px; }
  &__cta { padding: 12px 24px; background: $teal; color: $white; border: none; border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.2s; &:hover { background: darken($teal, 8%); } }
}

.loading-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 300px; gap: 16px; color: $gray;
  &__spinner { width: 40px; height: 40px; border: 3px solid rgba($teal, 0.2); border-top-color: $teal; border-radius: 50%; animation: spin 0.8s linear infinite; }
}

@keyframes spin { to { transform: rotate(360deg); } }
@keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>
