<template>
  <div class="crisis-screen">
    <div class="crisis-screen__content">
      <!-- Hero Section -->
      <section class="hero">
        <div class="hero__content">
          <button class="back-link" @click="$emit('back')">
            <v-icon name="hi-arrow-left" scale="0.85" />
            <span>Back</span>
          </button>
          <div class="hero__badge">
            <div class="badge-pulse"></div>
            <v-icon name="hi-phone" />
            <span>Crisis Support</span>
          </div>
          <h1 class="hero__title">
            Need Help<br/>
            <span class="hero__title-accent">Right Now?</span>
          </h1>
          <p class="hero__subtitle">
            You are not alone. Trained professionals are available 24/7. Reach out — it's okay to ask for help.
          </p>
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
        </div>
      </section>

      <!-- Emergency Call Buttons -->
      <div class="emergency-actions">
        <a href="tel:999" class="emergency-btn emergency-btn--critical">
          <v-icon name="hi-phone" scale="1.3" />
          <div class="emergency-btn__info">
            <strong>Call 999</strong>
            <span>Life-threatening emergency</span>
          </div>
        </a>
        <a href="tel:116123" class="emergency-btn">
          <v-icon name="hi-phone" scale="1.1" />
          <div class="emergency-btn__info">
            <strong>Samaritans: 116 123</strong>
            <span>24/7 emotional support</span>
          </div>
        </a>
        <a href="tel:03001236600" class="emergency-btn">
          <v-icon name="hi-phone" scale="1.1" />
          <div class="emergency-btn__info">
            <strong>FRANK: 0300 123 6600</strong>
            <span>Drug advice line</span>
          </div>
        </a>
        <a href="tel:111" class="emergency-btn">
          <v-icon name="hi-phone" scale="1.1" />
          <div class="emergency-btn__info">
            <strong>NHS 111</strong>
            <span>Medical advice</span>
          </div>
        </a>
      </div>

      <!-- Notify Care Team -->
      <div class="notify-section">
        <h3 class="section-title">Notify Your Care Team</h3>
        <p class="section-desc">Let your care team know you need support. They will be notified immediately.</p>

        <div class="notify-form">
          <div class="crisis-type-selector">
            <button
              v-for="ct in crisisTypes"
              :key="ct.value"
              class="crisis-type-btn"
              :class="{ 'crisis-type-btn--active': selectedType === ct.value }"
              @click="selectedType = ct.value"
            >
              <v-icon :name="ct.icon" scale="0.75" />
              <span>{{ ct.label }}</span>
            </button>
          </div>

          <textarea
            v-model="crisisMessage"
            class="notify-form__textarea"
            placeholder="Tell us what's happening (optional)..."
            rows="3"
          ></textarea>

          <button
            class="notify-btn"
            :disabled="!selectedType || sending"
            @click="sendCrisisAlert"
          >
            <v-icon name="hi-bell" scale="0.9" />
            <span>{{ sending ? 'Sending...' : 'Send Crisis Alert' }}</span>
          </button>
        </div>
      </div>

      <!-- Sent Confirmation -->
      <div v-if="alertSent" class="sent-confirmation">
        <v-icon name="hi-check-circle" scale="1.5" />
        <h3>Alert Sent</h3>
        <p>Your care team has been notified and will respond as soon as possible. Stay safe.</p>
      </div>

      <!-- Grounding Exercise -->
      <div class="grounding-section">
        <h3 class="section-title">While You Wait</h3>
        <div class="grounding-card">
          <h4>5-4-3-2-1 Grounding</h4>
          <p>Use your senses to ground yourself in the present moment:</p>
          <div class="grounding-steps">
            <div class="grounding-step"><span class="grounding-step__num">5</span> things you can <strong>see</strong></div>
            <div class="grounding-step"><span class="grounding-step__num">4</span> things you can <strong>touch</strong></div>
            <div class="grounding-step"><span class="grounding-step__num">3</span> things you can <strong>hear</strong></div>
            <div class="grounding-step"><span class="grounding-step__num">2</span> things you can <strong>smell</strong></div>
            <div class="grounding-step"><span class="grounding-step__num">1</span> thing you can <strong>taste</strong></div>
          </div>
        </div>

        <button class="talk-btn" @click="navigateToEka">
          <v-icon name="hi-chat" scale="0.9" />
          <span>Talk to Eka Now</span>
        </button>
      </div>

      <!-- Crisis History -->
      <div v-if="crisisHistory.length" class="history-section">
        <h3 class="section-title">Recent Crisis Events</h3>
        <div
          v-for="event in crisisHistory"
          :key="event._id"
          class="history-item"
        >
          <div class="history-item__header">
            <span class="history-item__type">{{ formatType(event.crisis_type) }}</span>
            <span class="history-item__status" :class="`status--${event.status}`">{{ event.status }}</span>
          </div>
          <div class="history-item__meta">
            <span>{{ formatDate(event.created_at) }}</span>
            <span v-if="event.resolved_at">&middot; Resolved {{ formatDate(event.resolved_at) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, inject, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toast-notification";

const $http = inject("$http");
const $toast = useToast();
const router = useRouter();

const selectedType = ref("");
const crisisMessage = ref("");
const sending = ref(false);
const alertSent = ref(false);
const crisisHistory = ref([]);

const crisisTypes = [
  { value: "suicidal_ideation", label: "Suicidal Thoughts", icon: "hi-exclamation" },
  { value: "overdose_suspected", label: "Overdose", icon: "hi-exclamation-circle" },
  { value: "severe_withdrawal", label: "Severe Withdrawal", icon: "hi-lightning-bolt" },
  { value: "relapse_with_danger", label: "Dangerous Relapse", icon: "hi-fire" },
  { value: "self_harm", label: "Self Harm", icon: "hi-hand" },
  { value: "patient_initiated", label: "Other / General", icon: "hi-phone" },
];

function formatType(type) {
  if (!type) return "";
  return type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

async function sendCrisisAlert() {
  if (!selectedType.value || sending.value) return;
  sending.value = true;
  try {
    await $http.$_triggerCrisisEmergency({
      crisis_type: selectedType.value,
      message: crisisMessage.value.trim() || undefined,
    });
    alertSent.value = true;
    $toast.success("Crisis alert sent to your care team");
  } catch (err) {
    $toast.error(err.response?.data?.message || "Failed to send alert. Please call emergency services.");
  } finally {
    sending.value = false;
  }
}

function navigateToEka() {
  router.push({
    path: "/app/patient/eka",
    query: { prompt: "I'm in crisis right now and need immediate support", tags: "recovery,crisis" },
  });
}

async function fetchHistory() {
  try {
    const { data } = await $http.$_getCrisisHistory({ limit: 5 });
    crisisHistory.value = data.data || [];
  } catch {
    // silent
  }
}

onMounted(fetchHistory);
</script>

<style scoped lang="scss">
$sky: #4FC3F7;
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
$rose-dark: #BE123C;
$amber: #F59E0B;
$amber-light: #FEF3C7;
$violet: #8B5CF6;

@mixin glass-card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);
}

.crisis-screen {
  width: 100%;
  min-height: 100vh;
  background: $bg;

  &__content {
    max-width: 800px;
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
  background: linear-gradient(135deg, $rose 0%, $rose-dark 50%, darken($rose-dark, 10%) 100%);
  border-radius: 28px;
  min-height: 280px;
  color: $white;
  margin-bottom: 24px;

  @media (max-width: 768px) { grid-template-columns: 1fr; padding: 24px 20px; text-align: center; min-height: auto; }
  &__content { display: flex; flex-direction: column; }
  &__badge { display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; background: rgba(255,255,255,0.15); backdrop-filter: blur(10px); border-radius: 24px; width: fit-content; margin-bottom: 20px; font-size: 12px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; @media (max-width: 768px) { margin: 0 auto 16px; } }
  &__title { font-size: 48px; font-weight: 800; line-height: 1.1; letter-spacing: -1px; margin-bottom: 16px; @media (max-width: 768px) { font-size: 28px; } }
  &__title-accent { background: linear-gradient(180deg, #fff 0%, rgba(255,255,255,0.7) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  &__subtitle { font-size: 18px; opacity: 0.95; line-height: 1.6; max-width: 480px; @media (max-width: 768px) { font-size: 14px; max-width: none; } }
  &__visual { display: flex; justify-content: center; align-items: center; @media (max-width: 768px) { display: none; } }
}

.back-link { display: inline-flex; align-items: center; gap: 6px; background: none; border: none; color: rgba(255,255,255,0.7); font-size: 13px; font-weight: 500; cursor: pointer; padding: 0; margin-bottom: 16px; transition: color 0.2s; &:hover { color: #fff; } }

.badge-pulse { width: 8px; height: 8px; border-radius: 50%; background: $white; animation: pulse 1.5s infinite; }

.recovery-orb { position: relative; width: 180px; height: 180px; display: flex; align-items: center; justify-content: center; }
.orb-ring { position: absolute; border-radius: 50%; border: 2px solid rgba(255,255,255,0.2); &--1 { width: 100%; height: 100%; animation: spin-slow 20s linear infinite; } &--2 { width: 80%; height: 80%; animation: spin-slow 15s linear infinite reverse; } &--3 { width: 60%; height: 60%; animation: spin-slow 10s linear infinite; } }
.orb-core { width: 80px; height: 80px; background: rgba(255,255,255,0.2); backdrop-filter: blur(20px); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: $white; }

// Emergency Actions
.emergency-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 32px;
}

.emergency-btn {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 20px;
  background: $white;
  border: 1px solid rgba(0,0,0,0.08);
  border-radius: 16px;
  text-decoration: none;
  transition: all 0.25s ease;
  color: $emerald-dark;

  &:hover { transform: translateY(-1px); box-shadow: 0 8px 30px rgba(0,0,0,0.06); }

  &--critical {
    background: $rose;
    border-color: $rose;
    color: $white;

    .emergency-btn__info {
      strong { color: $white; }
      span { color: rgba(255,255,255,0.85); }
    }

    &:hover { background: $rose-dark; }
  }

  &__info {
    flex: 1;
    strong { display: block; font-size: 15px; font-weight: 600; color: $navy; }
    span { font-size: 12px; color: $gray; }
  }
}

// Notify Section
.notify-section {
  margin-bottom: 32px;
}

.section-title { font-size: 16px; font-weight: 700; color: $navy; margin: 0 0 8px; }
.section-desc { font-size: 14px; color: $gray; margin: 0 0 16px; line-height: 1.5; }

.notify-form {
  @include glass-card;
  border-radius: 16px;
  padding: 20px;
}

.crisis-type-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}

.crisis-type-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 8px 14px;
  background: $bg;
  border: 1px solid rgba(0,0,0,0.08);
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
  color: $slate;
  cursor: pointer;
  transition: all 0.2s;

  &--active {
    background: $rose;
    border-color: $rose;
    color: $white;
  }

  &:hover:not(&--active) { border-color: $rose; color: $rose; }
}

.notify-form__textarea {
  width: 100%;
  border: 1px solid rgba(0,0,0,0.1);
  border-radius: 12px;
  padding: 14px;
  font-size: 14px;
  font-family: inherit;
  resize: none;
  outline: none;
  margin-bottom: 14px;
  &:focus { border-color: $rose; }
}

.notify-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 14px;
  background: $rose;
  color: $white;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;

  &:hover:not(:disabled) { background: $rose-dark; }
  &:disabled { opacity: 0.5; cursor: default; }
}

// Sent Confirmation
.sent-confirmation {
  text-align: center;
  padding: 32px 20px;
  @include glass-card;
  border-radius: 16px;
  margin-bottom: 32px;
  border: 2px solid $emerald;
  color: $emerald-dark;

  h3 { font-size: 18px; font-weight: 600; color: $navy; margin: 12px 0 8px; }
  p { font-size: 14px; color: $gray; line-height: 1.5; margin: 0; }
}

// Grounding Section
.grounding-section { margin-bottom: 32px; }

.grounding-card {
  @include glass-card;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 16px;

  h4 { font-size: 16px; font-weight: 600; color: $navy; margin: 0 0 8px; }
  p { font-size: 13px; color: $gray; line-height: 1.5; margin: 0 0 16px; }
}

.grounding-steps {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.grounding-step {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: $bg;
  border-radius: 12px;
  font-size: 14px;
  color: $slate;

  &__num {
    width: 32px;
    height: 32px;
    border-radius: 10px;
    background: rgba($sky, 0.15);
    color: darken($sky, 15%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    font-weight: 700;
    flex-shrink: 0;
  }
}

.talk-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 14px;
  background: $violet;
  color: $white;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;

  &:hover { background: darken($violet, 8%); }
}

// Crisis History
.history-section { margin-bottom: 32px; }

.history-item {
  @include glass-card;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 8px;

  &__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
  &__type { font-size: 14px; font-weight: 600; color: $navy; }
  &__status {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    padding: 3px 10px;
    border-radius: 6px;
  }
  &__meta { font-size: 12px; color: $light-gray; display: flex; gap: 6px; }
}

.status {
  &--active { background: $rose-light; color: $rose; }
  &--responding { background: $amber-light; color: darken($amber, 10%); }
  &--resolved { background: $emerald-light; color: $emerald-dark; }
  &--stabilized { background: rgba($sky, 0.15); color: darken($sky, 15%); }
}

@keyframes spin { to { transform: rotate(360deg); } }
@keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
</style>
