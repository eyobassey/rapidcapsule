<template>
  <div class="harm-reduction">
    <div class="harm-reduction__content">
      <!-- Hero Section -->
      <section class="hero">
        <div class="hero__content">
          <button class="back-link" @click="$emit('back')">
            <v-icon name="hi-arrow-left" scale="0.85" />
            <span>Back</span>
          </button>
          <div class="hero__badge">
            <v-icon name="hi-shield-check" />
            <span>Harm Reduction</span>
          </div>
          <h1 class="hero__title">
            Harm<br/>
            <span class="hero__title-accent">Reduction</span>
          </h1>
          <p class="hero__subtitle">
            Evidence-based guidance for safer use, overdose prevention, and emergency resources. Knowledge saves lives.
          </p>
        </div>

        <div class="hero__visual">
          <div class="recovery-orb">
            <div class="orb-ring orb-ring--1"></div>
            <div class="orb-ring orb-ring--2"></div>
            <div class="orb-ring orb-ring--3"></div>
            <div class="orb-core">
              <v-icon name="hi-shield-check" scale="2" />
            </div>
          </div>
        </div>
      </section>

      <!-- Emergency Resources Banner -->
      <div class="emergency-banner" @click="showEmergencyResources = true">
        <v-icon name="hi-phone" scale="1.2" />
        <div class="emergency-banner__text">
          <strong>Emergency Resources</strong>
          <span>Samaritans: 116 123 &middot; FRANK: 0300 123 6600 &middot; NHS 111</span>
        </div>
        <v-icon name="hi-chevron-right" scale="0.9" />
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        <div class="loading-state__spinner"></div>
        <p>Loading harm reduction resources...</p>
      </div>

      <template v-else>
        <!-- Substance Selector -->
        <div class="substance-selector">
          <h3 class="section-title">Choose a Substance</h3>
          <div class="substance-grid">
            <button
              v-for="sub in substances"
              :key="sub"
              class="substance-btn"
              :class="{ 'substance-btn--active': selectedSubstance === sub }"
              @click="selectSubstance(sub)"
            >
              <v-icon :name="substanceIcon(sub)" scale="0.85" />
              <span>{{ formatSubstance(sub) }}</span>
            </button>
          </div>
        </div>

        <!-- Substance Guidance -->
        <template v-if="guidance">
          <!-- Safer Use Tips -->
          <div v-if="guidance.safer_use?.length" class="guidance-card">
            <div class="guidance-card__header">
              <v-icon name="hi-shield-check" scale="0.9" />
              <h4>Safer Use Tips</h4>
            </div>
            <ul class="guidance-list">
              <li v-for="(tip, idx) in guidance.safer_use" :key="idx">{{ tip }}</li>
            </ul>
          </div>

          <!-- Overdose Signs -->
          <div v-if="guidance.overdose_signs?.length" class="guidance-card guidance-card--warning">
            <div class="guidance-card__header">
              <v-icon name="hi-exclamation-circle" scale="0.9" />
              <h4>Overdose Signs</h4>
            </div>
            <ul class="guidance-list">
              <li v-for="(sign, idx) in guidance.overdose_signs" :key="idx">{{ sign }}</li>
            </ul>
          </div>

          <!-- Mixing Dangers -->
          <div v-if="guidance.mixing_dangers?.length" class="guidance-card guidance-card--danger">
            <div class="guidance-card__header">
              <v-icon name="hi-x-circle" scale="0.9" />
              <h4>Mixing Dangers</h4>
            </div>
            <ul class="guidance-list">
              <li v-for="(danger, idx) in guidance.mixing_dangers" :key="idx">{{ danger }}</li>
            </ul>
          </div>

          <!-- Withdrawal Warnings -->
          <div v-if="guidance.withdrawal_warnings?.length" class="guidance-card">
            <div class="guidance-card__header">
              <v-icon name="hi-information-circle" scale="0.9" />
              <h4>Withdrawal Warnings</h4>
            </div>
            <ul class="guidance-list">
              <li v-for="(warn, idx) in guidance.withdrawal_warnings" :key="idx">{{ warn }}</li>
            </ul>
          </div>
        </template>

        <!-- Overdose Response Guide -->
        <div v-if="overdoseGuide" class="response-card">
          <div class="response-card__header">
            <h4>Overdose Response Guide</h4>
            <span class="response-card__badge">{{ formatSubstance(selectedSubstance) }}</span>
          </div>
          <div class="response-steps">
            <div
              v-for="(step, idx) in overdoseGuide.steps || []"
              :key="idx"
              class="response-step"
            >
              <div class="response-step__number">{{ idx + 1 }}</div>
              <div class="response-step__content">
                <h5>{{ step.title || step.action || `Step ${idx + 1}` }}</h5>
                <p>{{ step.description || step.detail || step }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Access Cards -->
        <h3 class="section-title">Quick Access</h3>
        <div class="quick-grid">
          <div class="quick-card" @click="loadFentanylInfo">
            <v-icon name="hi-beaker" scale="1.1" />
            <span>Fentanyl Testing</span>
          </div>
          <div class="quick-card" @click="showEmergencyResources = true">
            <v-icon name="hi-phone" scale="1.1" />
            <span>Emergency Contacts</span>
          </div>
          <div class="quick-card" @click="navigateToEka">
            <v-icon name="hi-chat" scale="1.1" />
            <span>Ask Eka</span>
          </div>
        </div>
      </template>

      <!-- Fentanyl Info Overlay -->
      <div v-if="showFentanylInfo" class="overlay" @click.self="showFentanylInfo = false">
        <div class="overlay-card">
          <div class="overlay-card__header">
            <h3>Fentanyl Test Strips</h3>
            <button class="close-btn" @click="showFentanylInfo = false">
              <v-icon name="hi-x" scale="0.9" />
            </button>
          </div>
          <div class="overlay-card__body">
            <template v-if="fentanylInfo">
              <p v-if="fentanylInfo.overview" class="overlay-text">{{ fentanylInfo.overview }}</p>
              <div v-if="fentanylInfo.how_to_use?.length">
                <h4>How to Use</h4>
                <ol class="overlay-list">
                  <li v-for="(step, idx) in fentanylInfo.how_to_use" :key="idx">{{ step }}</li>
                </ol>
              </div>
              <div v-if="fentanylInfo.where_to_get?.length">
                <h4>Where to Get Them</h4>
                <ul class="overlay-list">
                  <li v-for="(loc, idx) in fentanylInfo.where_to_get" :key="idx">{{ loc }}</li>
                </ul>
              </div>
            </template>
            <p v-else class="overlay-text">Loading...</p>
          </div>
        </div>
      </div>

      <!-- Emergency Resources Overlay -->
      <div v-if="showEmergencyResources" class="overlay" @click.self="showEmergencyResources = false">
        <div class="overlay-card overlay-card--emergency">
          <div class="overlay-card__header">
            <h3>Emergency Resources</h3>
            <button class="close-btn" @click="showEmergencyResources = false">
              <v-icon name="hi-x" scale="0.9" />
            </button>
          </div>
          <div class="overlay-card__body">
            <template v-if="emergencyResources">
              <div v-for="(resource, idx) in emergencyResources.helplines || emergencyResources" :key="idx" class="emergency-item">
                <div class="emergency-item__info">
                  <h4>{{ resource.name }}</h4>
                  <p v-if="resource.description">{{ resource.description }}</p>
                </div>
                <a v-if="resource.phone" :href="`tel:${resource.phone}`" class="emergency-item__phone">
                  <v-icon name="hi-phone" scale="0.75" />
                  {{ resource.phone }}
                </a>
              </div>
            </template>
            <div class="emergency-static">
              <div class="emergency-item">
                <div class="emergency-item__info"><h4>Samaritans</h4><p>24/7 emotional support</p></div>
                <a href="tel:116123" class="emergency-item__phone"><v-icon name="hi-phone" scale="0.75" /> 116 123</a>
              </div>
              <div class="emergency-item">
                <div class="emergency-item__info"><h4>FRANK</h4><p>Drug advice and information</p></div>
                <a href="tel:03001236600" class="emergency-item__phone"><v-icon name="hi-phone" scale="0.75" /> 0300 123 6600</a>
              </div>
              <div class="emergency-item">
                <div class="emergency-item__info"><h4>NHS 111</h4><p>Medical advice and triage</p></div>
                <a href="tel:111" class="emergency-item__phone"><v-icon name="hi-phone" scale="0.75" /> 111</a>
              </div>
              <div class="emergency-item">
                <div class="emergency-item__info"><h4>Emergency Services</h4><p>Life-threatening emergencies</p></div>
                <a href="tel:999" class="emergency-item__phone emergency-item__phone--danger"><v-icon name="hi-phone" scale="0.75" /> 999</a>
              </div>
            </div>
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

const loading = ref(true);
const substances = ref([]);
const selectedSubstance = ref(null);
const guidance = ref(null);
const overdoseGuide = ref(null);
const fentanylInfo = ref(null);
const emergencyResources = ref(null);
const showFentanylInfo = ref(false);
const showEmergencyResources = ref(false);

const substanceIcons = {
  alcohol: "ri-goblet-line",
  opioids: "ri-capsule-line",
  cannabis: "ri-plant-line",
  cocaine: "hi-lightning-bolt",
  amphetamines: "hi-lightning-bolt",
  benzodiazepines: "ri-capsule-line",
  tobacco: "ri-cloud-line",
};

function substanceIcon(sub) {
  return substanceIcons[sub] || "ri-capsule-line";
}

function formatSubstance(sub) {
  if (!sub) return "";
  return sub.charAt(0).toUpperCase() + sub.slice(1);
}

async function fetchSubstances() {
  loading.value = true;
  try {
    const { data } = await $http.$_getHarmReductionSubstances();
    substances.value = data.data || [];
    if (substances.value.length) {
      await selectSubstance(substances.value[0]);
    }
  } catch {
    substances.value = ["alcohol", "opioids", "cannabis", "cocaine", "benzodiazepines", "tobacco"];
    await selectSubstance(substances.value[0]);
  } finally {
    loading.value = false;
  }
}

async function selectSubstance(sub) {
  selectedSubstance.value = sub;
  try {
    const [guidanceRes, overdoseRes] = await Promise.allSettled([
      $http.$_getSubstanceGuidance(sub),
      $http.$_getOverdoseResponse(sub),
    ]);
    guidance.value = guidanceRes.status === "fulfilled" ? (guidanceRes.value.data.data || null) : null;
    overdoseGuide.value = overdoseRes.status === "fulfilled" ? (overdoseRes.value.data.data || null) : null;
  } catch {
    // silent
  }
}

async function loadFentanylInfo() {
  showFentanylInfo.value = true;
  if (fentanylInfo.value) return;
  try {
    const { data } = await $http.$_getFentanylTestingInfo();
    fentanylInfo.value = data.data || {};
  } catch {
    // silent
  }
}

async function fetchEmergencyResources() {
  try {
    const { data } = await $http.$_getEmergencyResources();
    emergencyResources.value = data.data || null;
  } catch {
    // static fallback used
  }
}

function navigateToEka() {
  router.push({
    path: "/app/patient/eka",
    query: { prompt: `Tell me about harm reduction strategies for ${selectedSubstance.value || "substance use"}`, tags: "recovery" },
  });
}

onMounted(() => {
  fetchSubstances();
  fetchEmergencyResources();
});
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
$orange: #F97316;
$orange-light: #FFF7ED;

@mixin glass-card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);
}

.harm-reduction {
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
  background: linear-gradient(135deg, $emerald 0%, darken($emerald, 15%) 50%, darken($emerald, 25%) 100%);
  border-radius: 28px;
  min-height: 280px;
  color: $white;
  margin-bottom: 20px;

  @media (max-width: 768px) { grid-template-columns: 1fr; padding: 24px 20px; text-align: center; min-height: auto; }
  &__content { display: flex; flex-direction: column; }
  &__badge { display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; background: rgba(255,255,255,0.15); backdrop-filter: blur(10px); border-radius: 24px; width: fit-content; margin-bottom: 20px; font-size: 12px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; @media (max-width: 768px) { margin: 0 auto 16px; } }
  &__title { font-size: 48px; font-weight: 800; line-height: 1.1; letter-spacing: -1px; margin-bottom: 16px; @media (max-width: 768px) { font-size: 28px; } }
  &__title-accent { background: linear-gradient(180deg, #fff 0%, rgba(255,255,255,0.7) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  &__subtitle { font-size: 18px; opacity: 0.95; line-height: 1.6; margin-bottom: 28px; max-width: 480px; @media (max-width: 768px) { font-size: 14px; max-width: none; } }
  &__visual { display: flex; justify-content: center; align-items: center; @media (max-width: 768px) { display: none; } }
}

.back-link { display: inline-flex; align-items: center; gap: 6px; background: none; border: none; color: rgba(255,255,255,0.7); font-size: 13px; font-weight: 500; cursor: pointer; padding: 0; margin-bottom: 16px; transition: color 0.2s; &:hover { color: #fff; } }

.recovery-orb { position: relative; width: 180px; height: 180px; display: flex; align-items: center; justify-content: center; }
.orb-ring { position: absolute; border-radius: 50%; border: 2px solid rgba(255,255,255,0.2); &--1 { width: 100%; height: 100%; animation: spin-slow 20s linear infinite; } &--2 { width: 80%; height: 80%; animation: spin-slow 15s linear infinite reverse; } &--3 { width: 60%; height: 60%; animation: spin-slow 10s linear infinite; } }
.orb-core { width: 80px; height: 80px; background: rgba(255,255,255,0.2); backdrop-filter: blur(20px); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: $white; }

// Emergency Banner
.emergency-banner {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
  background: $white;
  border: 1px solid rgba($rose, 0.2);
  border-radius: 14px;
  cursor: pointer;
  margin-bottom: 24px;
  transition: all 0.2s;
  color: $rose;

  &:hover { border-color: $rose; background: $rose-light; }

  &__text {
    flex: 1;
    strong { display: block; font-size: 14px; color: $navy; }
    span { font-size: 12px; color: $gray; }
  }
}

// Substance Selector
.substance-selector { margin-bottom: 24px; }
.section-title { font-size: 16px; font-weight: 700; color: $navy; margin: 0 0 14px; }

.substance-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.substance-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: $white;
  border: 1px solid rgba(0,0,0,0.1);
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  color: $slate;
  cursor: pointer;
  transition: all 0.2s;

  &--active {
    background: $emerald;
    border-color: $emerald;
    color: $white;
  }

  &:hover:not(&--active) { border-color: $emerald; color: $emerald-dark; }
}

// Guidance Cards
.guidance-card {
  @include glass-card;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  border-left: 4px solid $emerald;

  &--warning { border-left-color: $amber; }
  &--danger { border-left-color: $rose; }

  &__header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 14px;
    color: $emerald;

    .guidance-card--warning & { color: $amber; }
    .guidance-card--danger & { color: $rose; }

    h4 { font-size: 15px; font-weight: 600; color: $navy; margin: 0; }
  }
}

.guidance-list {
  margin: 0;
  padding: 0 0 0 20px;

  li {
    font-size: 13px;
    color: $slate;
    line-height: 1.6;
    margin-bottom: 6px;
  }
}

// Overdose Response
.response-card {
  @include glass-card;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  border: 2px solid rgba($rose, 0.2);

  &__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; h4 { font-size: 16px; font-weight: 700; color: $navy; margin: 0; } }
  &__badge { font-size: 11px; font-weight: 600; background: $emerald-light; color: $emerald-dark; padding: 4px 10px; border-radius: 6px; }
}

.response-steps { display: flex; flex-direction: column; gap: 12px; }

.response-step {
  display: flex;
  gap: 14px;
  align-items: flex-start;

  &__number {
    width: 32px;
    height: 32px;
    border-radius: 10px;
    background: $rose-light;
    color: $rose;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 700;
    flex-shrink: 0;
  }

  &__content {
    h5 { font-size: 14px; font-weight: 600; color: $navy; margin: 0 0 4px; }
    p { font-size: 13px; color: $gray; line-height: 1.5; margin: 0; }
  }
}

// Quick Access
.quick-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 32px;
  @media (max-width: 640px) { grid-template-columns: 1fr; }
}

.quick-card {
  @include glass-card;
  border-radius: 14px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  color: $emerald-dark;

  &:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(0,0,0,0.06); }

  span { font-size: 13px; font-weight: 600; color: $navy; }
}

// Overlay
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 20px;

  @media (min-width: 769px) { align-items: center; }
}

.overlay-card {
  background: $white;
  border-radius: 24px 24px 0 0;
  max-width: 500px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;

  @media (min-width: 769px) { border-radius: 24px; }

  &--emergency { max-width: 460px; }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px 0;
    h3 { font-size: 18px; font-weight: 700; color: $navy; margin: 0; }
  }

  &__body { padding: 20px 24px 24px; }
}

.close-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: none;
  background: $bg;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $gray;
  cursor: pointer;
  &:hover { background: darken($bg, 3%); }
}

.overlay-text { font-size: 14px; color: $slate; line-height: 1.6; margin: 0 0 16px; }
.overlay-list { margin: 0 0 16px; padding: 0 0 0 20px; li { font-size: 13px; color: $slate; line-height: 1.6; margin-bottom: 6px; } }
.overlay-card h4 { font-size: 15px; font-weight: 600; color: $navy; margin: 16px 0 8px; }

// Emergency Items
.emergency-static { display: flex; flex-direction: column; gap: 10px; }

.emergency-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  background: $bg;
  border-radius: 12px;

  &__info {
    h4 { font-size: 14px; font-weight: 600; color: $navy; margin: 0 0 2px; }
    p { font-size: 12px; color: $gray; margin: 0; }
  }

  &__phone {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    background: $emerald-light;
    color: $emerald-dark;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;
    transition: background 0.2s;
    flex-shrink: 0;

    &:hover { background: darken($emerald-light, 5%); }
    &--danger { background: $rose-light; color: $rose; &:hover { background: darken($rose-light, 5%); } }
  }
}

// Loading
.loading-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 300px; gap: 16px; color: $gray;
  &__spinner { width: 40px; height: 40px; border: 3px solid rgba($emerald, 0.2); border-top-color: $emerald; border-radius: 50%; animation: spin 0.8s linear infinite; }
}

@keyframes spin { to { transform: rotate(360deg); } }
@keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>
