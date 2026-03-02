<template>
  <div class="peer-support">
    <div class="peer-support__content">
      <!-- Hero Section -->
      <section class="hero">
        <div class="hero__content">
          <button class="back-link" @click="$emit('back')">
            <v-icon name="hi-arrow-left" scale="0.85" />
            <span>Back</span>
          </button>
          <div class="hero__badge">
            <v-icon name="hi-users" />
            <span>Peer Support</span>
          </div>
          <h1 class="hero__title">
            Peer<br/>
            <span class="hero__title-accent">Support</span>
          </h1>
          <p class="hero__subtitle">
            Connect with someone who understands your journey. Peer support builds accountability and shared strength.
          </p>

          <div v-if="activeAssignment" class="hero__stats">
            <div class="hero-stat">
              <span class="hero-stat__value">{{ getPeerName(activeAssignment) }}</span>
              <span class="hero-stat__label">Your Peer</span>
            </div>
            <div class="hero-stat__divider"></div>
            <div class="hero-stat">
              <span class="hero-stat__value">{{ activeAssignment.check_ins?.length || 0 }}</span>
              <span class="hero-stat__label">Check-ins</span>
            </div>
          </div>
        </div>

        <div class="hero__visual">
          <div class="recovery-orb">
            <div class="orb-ring orb-ring--1"></div>
            <div class="orb-ring orb-ring--2"></div>
            <div class="orb-ring orb-ring--3"></div>
            <div class="orb-core">
              <v-icon name="hi-users" scale="2" />
            </div>
          </div>
        </div>
      </section>

      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        <div class="loading-state__spinner"></div>
        <p>Loading peer support...</p>
      </div>

      <!-- No Assignment -->
      <div v-else-if="!activeAssignment && !pendingAssignment" class="empty-state">
        <div class="empty-state__icon">
          <v-icon name="hi-users" scale="2" />
        </div>
        <h3>No Peer Assigned Yet</h3>
        <p>Your care team will match you with a peer supporter based on shared experiences and recovery goals. Check back soon.</p>
      </div>

      <!-- Pending Consent -->
      <div v-else-if="pendingAssignment" class="consent-card">
        <div class="consent-card__icon">
          <v-icon name="hi-user-add" scale="1.5" />
        </div>
        <h3>Peer Match Found</h3>
        <p>You've been matched with a peer supporter. Review and accept to start your peer support journey.</p>
        <div class="consent-card__match-info" v-if="pendingAssignment.match_criteria">
          <div v-if="pendingAssignment.match_criteria.match_score" class="consent-card__score">
            Match Score: {{ pendingAssignment.match_criteria.match_score }}%
          </div>
          <div class="consent-card__criteria">
            <span v-if="pendingAssignment.match_criteria.shared_substance" class="consent-card__tag">Shared Substance</span>
            <span v-if="pendingAssignment.match_criteria.gender_match" class="consent-card__tag">Gender Match</span>
            <span v-if="pendingAssignment.match_criteria.age_proximity" class="consent-card__tag">Similar Age</span>
          </div>
        </div>
        <div class="consent-card__actions">
          <button class="btn btn--primary" @click="handleConsent" :disabled="actionLoading">
            Accept Match
          </button>
        </div>
      </div>

      <!-- Active Assignment -->
      <template v-if="activeAssignment">
        <!-- Peer Profile Card -->
        <div class="peer-profile-card">
          <div class="peer-profile-card__avatar">
            <v-icon name="hi-user" scale="1.5" />
          </div>
          <div class="peer-profile-card__info">
            <h3>{{ getPeerName(activeAssignment) }}</h3>
            <span class="peer-profile-card__since">
              Peer since {{ formatDate(activeAssignment.patient_consent_at || activeAssignment.created_at) }}
            </span>
          </div>
          <div class="peer-profile-card__status">
            <span class="status-badge status-badge--active">Active</span>
          </div>
        </div>

        <!-- Check-in Schedule -->
        <div v-if="activeAssignment.check_in_schedule" class="schedule-card">
          <div class="schedule-card__header">
            <h4>Check-in Schedule</h4>
          </div>
          <div class="schedule-card__info">
            <div class="schedule-card__item">
              <v-icon name="hi-calendar" scale="0.7" />
              <span>{{ activeAssignment.check_in_schedule.frequency || 'Weekly' }}</span>
            </div>
            <div v-if="activeAssignment.check_in_schedule.preferred_day" class="schedule-card__item">
              <v-icon name="hi-clock" scale="0.7" />
              <span>{{ activeAssignment.check_in_schedule.preferred_day }}s</span>
            </div>
          </div>
        </div>

        <!-- Log Check-in -->
        <div class="checkin-section">
          <h3 class="section-title">Log a Check-in</h3>
          <div class="checkin-form">
            <textarea
              v-model="checkInNote"
              class="checkin-form__textarea"
              placeholder="How did your peer check-in go? Share any notes..."
              rows="3"
            ></textarea>
            <div class="checkin-form__mood">
              <span class="checkin-form__mood-label">Mood after check-in:</span>
              <div class="mood-buttons">
                <button
                  v-for="n in 5"
                  :key="n"
                  class="mood-btn"
                  :class="{ 'mood-btn--active': checkInMood === n * 2 }"
                  @click="checkInMood = n * 2"
                >
                  {{ ['😞','😕','😐','🙂','😊'][n - 1] }}
                </button>
              </div>
            </div>
            <button
              class="btn btn--primary"
              @click="handleCheckIn"
              :disabled="actionLoading || !checkInNote.trim()"
            >
              Log Check-in
            </button>
          </div>
        </div>

        <!-- Check-in History -->
        <div v-if="checkIns.length" class="checkin-history">
          <h3 class="section-title">Recent Check-ins</h3>
          <div
            v-for="(ci, idx) in checkIns"
            :key="idx"
            class="checkin-item"
          >
            <div class="checkin-item__header">
              <span class="checkin-item__date">{{ formatDate(ci.date || ci.created_at) }}</span>
              <span v-if="ci.mood_score" class="checkin-item__mood">
                Mood: {{ ci.mood_score }}/10
              </span>
            </div>
            <p v-if="ci.notes" class="checkin-item__notes">{{ ci.notes }}</p>
          </div>
        </div>

        <!-- End Assignment -->
        <div class="end-section">
          <button class="btn btn--danger-outline" @click="showEndConfirm = true">
            End Peer Assignment
          </button>
        </div>
      </template>

      <!-- End Confirm -->
      <div v-if="showEndConfirm" class="overlay" @click.self="showEndConfirm = false">
        <div class="confirm-dialog">
          <h3>End Peer Assignment?</h3>
          <p>This will end your peer support connection. You can be reassigned later by your care team.</p>
          <div class="confirm-dialog__actions">
            <button class="btn btn--outline" @click="showEndConfirm = false">Cancel</button>
            <button class="btn btn--danger" @click="handleEnd" :disabled="actionLoading">End Assignment</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted } from "vue";
import { useToast } from "vue-toast-notification";

const $http = inject("$http");
const $toast = useToast();

const loading = ref(true);
const actionLoading = ref(false);
const assignments = ref([]);
const checkInNote = ref("");
const checkInMood = ref(6);
const showEndConfirm = ref(false);

const activeAssignment = computed(() => assignments.value.find(a => a.status === "active"));
const pendingAssignment = computed(() => assignments.value.find(a => a.status === "pending" || a.status === "awaiting_consent"));
const checkIns = computed(() => activeAssignment.value?.check_ins?.slice().reverse() || []);

function getPeerName(assignment) {
  const peer = assignment.peer_supporter;
  if (!peer?.profile) return "Your Peer";
  return `${peer.profile.first_name || ""} ${peer.profile.last_name || ""}`.trim() || "Your Peer";
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

async function fetchAssignments() {
  loading.value = true;
  try {
    const { data } = await $http.$_getPeerAssignments({ status: "active,pending,awaiting_consent" });
    assignments.value = data.data || [];
  } catch {
    // silent
  } finally {
    loading.value = false;
  }
}

async function handleConsent() {
  if (!pendingAssignment.value) return;
  actionLoading.value = true;
  try {
    await $http.$_consentPeerAssignment(pendingAssignment.value._id);
    $toast.success("Peer match accepted!");
    await fetchAssignments();
  } catch (err) {
    $toast.error(err.response?.data?.message || "Failed to accept");
  } finally {
    actionLoading.value = false;
  }
}

async function handleCheckIn() {
  if (!activeAssignment.value || !checkInNote.value.trim()) return;
  actionLoading.value = true;
  try {
    await $http.$_logPeerCheckIn({
      id: activeAssignment.value._id,
      payload: { notes: checkInNote.value.trim(), mood_score: checkInMood.value },
    });
    $toast.success("Check-in logged");
    checkInNote.value = "";
    checkInMood.value = 6;
    await fetchAssignments();
  } catch (err) {
    $toast.error(err.response?.data?.message || "Failed to log check-in");
  } finally {
    actionLoading.value = false;
  }
}

async function handleEnd() {
  if (!activeAssignment.value) return;
  actionLoading.value = true;
  try {
    await $http.$_endPeerAssignment(activeAssignment.value._id);
    $toast.success("Peer assignment ended");
    showEndConfirm.value = false;
    await fetchAssignments();
  } catch (err) {
    $toast.error(err.response?.data?.message || "Failed to end assignment");
  } finally {
    actionLoading.value = false;
  }
}

onMounted(fetchAssignments);
</script>

<style scoped lang="scss">
$sky: #4FC3F7;
$sky-light: #E1F5FE;
$sky-dark: #0288D1;
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
$indigo: #6366F1;
$indigo-light: #E0E7FF;

@mixin glass-card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);
}

.peer-support {
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
  background: linear-gradient(135deg, $indigo 0%, darken($indigo, 15%) 50%, darken($indigo, 25%) 100%);
  border-radius: 28px;
  min-height: 280px;
  color: $white;
  margin-bottom: 24px;

  @media (max-width: 768px) { grid-template-columns: 1fr; padding: 24px 20px; text-align: center; min-height: auto; }
  &__content { display: flex; flex-direction: column; }
  &__badge { display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; background: rgba(255,255,255,0.15); backdrop-filter: blur(10px); border-radius: 24px; width: fit-content; margin-bottom: 20px; font-size: 12px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; @media (max-width: 768px) { margin: 0 auto 16px; } }
  &__title { font-size: 48px; font-weight: 800; line-height: 1.1; letter-spacing: -1px; margin-bottom: 16px; @media (max-width: 768px) { font-size: 28px; } }
  &__title-accent { background: linear-gradient(180deg, #fff 0%, rgba(255,255,255,0.7) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  &__subtitle { font-size: 18px; opacity: 0.95; line-height: 1.6; margin-bottom: 28px; max-width: 480px; @media (max-width: 768px) { font-size: 14px; max-width: none; } }
  &__stats { display: flex; align-items: center; gap: 20px; padding: 16px 20px; background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); border-radius: 16px; width: fit-content; @media (max-width: 768px) { width: 100%; justify-content: space-around; } }
  &__visual { display: flex; justify-content: center; align-items: center; @media (max-width: 768px) { display: none; } }
}

.hero-stat { display: flex; flex-direction: column; align-items: center; &__value { font-size: 24px; font-weight: 700; line-height: 1; } &__label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.7; margin-top: 4px; } &__divider { width: 1px; height: 32px; background: rgba(255,255,255,0.2); } }
.back-link { display: inline-flex; align-items: center; gap: 6px; background: none; border: none; color: rgba(255,255,255,0.7); font-size: 13px; font-weight: 500; cursor: pointer; padding: 0; margin-bottom: 16px; transition: color 0.2s; &:hover { color: #fff; } }

.recovery-orb { position: relative; width: 180px; height: 180px; display: flex; align-items: center; justify-content: center; }
.orb-ring { position: absolute; border-radius: 50%; border: 2px solid rgba(255,255,255,0.2); &--1 { width: 100%; height: 100%; animation: spin-slow 20s linear infinite; } &--2 { width: 80%; height: 80%; animation: spin-slow 15s linear infinite reverse; } &--3 { width: 60%; height: 60%; animation: spin-slow 10s linear infinite; } }
.orb-core { width: 80px; height: 80px; background: rgba(255,255,255,0.2); backdrop-filter: blur(20px); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: $white; }

// Peer Profile Card
.peer-profile-card {
  @include glass-card;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;

  &__avatar { width: 52px; height: 52px; border-radius: 16px; background: $indigo-light; display: flex; align-items: center; justify-content: center; color: $indigo; flex-shrink: 0; }
  &__info { flex: 1; h3 { font-size: 16px; font-weight: 600; color: $navy; margin: 0 0 4px; } }
  &__since { font-size: 12px; color: $light-gray; }
  &__status { flex-shrink: 0; }
}

.status-badge {
  font-size: 11px; font-weight: 600; text-transform: uppercase; padding: 4px 12px; border-radius: 8px;
  &--active { background: $emerald-light; color: $emerald-dark; }
}

// Schedule Card
.schedule-card {
  @include glass-card;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
  &__header { margin-bottom: 12px; h4 { font-size: 14px; font-weight: 600; color: $navy; margin: 0; } }
  &__info { display: flex; gap: 20px; }
  &__item { display: flex; align-items: center; gap: 6px; font-size: 13px; color: $gray; }
}

// Consent Card
.consent-card {
  @include glass-card;
  border-radius: 20px;
  padding: 32px;
  text-align: center;
  border: 2px dashed rgba($indigo, 0.3);

  &__icon { width: 64px; height: 64px; border-radius: 20px; background: $indigo-light; display: flex; align-items: center; justify-content: center; color: $indigo; margin: 0 auto 20px; }
  h3 { font-size: 18px; font-weight: 600; color: $navy; margin: 0 0 8px; }
  p { font-size: 14px; color: $gray; line-height: 1.6; max-width: 400px; margin: 0 auto 20px; }
  &__match-info { margin-bottom: 20px; }
  &__score { font-size: 16px; font-weight: 700; color: $indigo; margin-bottom: 10px; }
  &__criteria { display: flex; justify-content: center; gap: 8px; flex-wrap: wrap; }
  &__tag { font-size: 11px; font-weight: 600; background: $indigo-light; color: $indigo; padding: 4px 10px; border-radius: 6px; }
  &__actions { margin-top: 20px; }
}

// Check-in Section
.section-title { font-size: 16px; font-weight: 700; color: $navy; margin: 0 0 16px; }

.checkin-section { margin-bottom: 32px; }

.checkin-form {
  @include glass-card;
  border-radius: 16px;
  padding: 20px;

  &__textarea {
    width: 100%;
    border: 1px solid rgba(0,0,0,0.1);
    border-radius: 12px;
    padding: 14px;
    font-size: 14px;
    font-family: inherit;
    resize: none;
    outline: none;
    margin-bottom: 14px;
    &:focus { border-color: $indigo; }
  }

  &__mood {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 14px;
    flex-wrap: wrap;
  }

  &__mood-label { font-size: 13px; font-weight: 500; color: $slate; }
}

.mood-buttons { display: flex; gap: 6px; }

.mood-btn {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: 2px solid rgba(0,0,0,0.08);
  background: $white;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

  &--active { border-color: $indigo; background: $indigo-light; transform: scale(1.1); }
  &:hover:not(&--active) { border-color: rgba($indigo, 0.3); }
}

// Check-in History
.checkin-history { margin-bottom: 32px; }

.checkin-item {
  @include glass-card;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 8px;

  &__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  &__date { font-size: 12px; color: $light-gray; }
  &__mood { font-size: 12px; font-weight: 600; color: $indigo; background: $indigo-light; padding: 3px 10px; border-radius: 6px; }
  &__notes { font-size: 13px; color: $slate; line-height: 1.5; margin: 0; }
}

// End Section
.end-section { text-align: center; padding: 20px 0; }

// Buttons
.btn {
  padding: 10px 20px; border-radius: 10px; font-size: 13px; font-weight: 600; border: none; cursor: pointer; transition: all 0.2s;
  &:disabled { opacity: 0.5; cursor: default; }
  &--primary { background: $indigo; color: $white; &:hover:not(:disabled) { background: darken($indigo, 8%); } }
  &--outline { background: none; border: 1px solid rgba(0,0,0,0.15); color: $gray; &:hover { background: $bg; } }
  &--danger { background: $rose; color: $white; &:hover:not(:disabled) { background: darken($rose, 8%); } }
  &--danger-outline { background: none; border: 1px solid rgba($rose, 0.3); color: $rose; &:hover:not(:disabled) { background: $rose-light; } }
}

// Overlay
.overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px;
}

.confirm-dialog {
  background: $white; border-radius: 20px; padding: 32px; max-width: 400px; width: 100%; text-align: center;
  h3 { font-size: 18px; font-weight: 600; color: $navy; margin: 0 0 8px; }
  p { font-size: 14px; color: $gray; line-height: 1.5; margin: 0 0 24px; }
  &__actions { display: flex; justify-content: center; gap: 12px; }
}

// Empty + Loading
.empty-state {
  text-align: center; padding: 60px 20px;
  &__icon { width: 64px; height: 64px; border-radius: 20px; background: $indigo-light; display: flex; align-items: center; justify-content: center; color: $indigo; margin: 0 auto 20px; }
  h3 { font-size: 18px; font-weight: 600; color: $navy; margin: 0 0 8px; }
  p { font-size: 14px; color: $gray; line-height: 1.6; max-width: 400px; margin: 0 auto; }
}

.loading-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 300px; gap: 16px; color: $gray;
  &__spinner { width: 40px; height: 40px; border: 3px solid rgba($indigo, 0.2); border-top-color: $indigo; border-radius: 50%; animation: spin 0.8s linear infinite; }
}

@keyframes spin { to { transform: rotate(360deg); } }
@keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>
