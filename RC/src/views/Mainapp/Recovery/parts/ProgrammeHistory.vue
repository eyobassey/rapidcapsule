<template>
  <div class="programme-history">
    <div class="programme-history__content">
      <!-- Hero Section -->
      <section class="hero">
        <div class="hero__content">
          <button class="back-link" @click="$emit('back')">
            <v-icon name="hi-arrow-left" scale="0.85" />
            <span>Back</span>
          </button>
          <div class="hero__badge">
            <v-icon name="hi-collection" />
            <span>Archive</span>
          </div>
          <h1 class="hero__title">
            Programme<br/>
            <span class="hero__title-accent">History</span>
          </h1>
          <p class="hero__subtitle">
            {{ programmes.length ? `${programmes.length} archived programme${programmes.length !== 1 ? 's' : ''} with all history preserved.` : 'Your archived recovery programmes and their outcomes will appear here.' }}
          </p>
        </div>

        <div class="hero__visual">
          <div class="recovery-orb">
            <div class="orb-ring orb-ring--1"></div>
            <div class="orb-ring orb-ring--2"></div>
            <div class="orb-ring orb-ring--3"></div>
            <div class="orb-core">
              <v-icon name="hi-collection" scale="2" />
            </div>
          </div>
        </div>
      </section>

      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading programme history...</p>
      </div>

      <!-- Programme List -->
      <div v-if="!loading && programmes.length" class="programme-list">
        <div
          v-for="(p, idx) in programmes"
          :key="p._id"
          class="programme-card"
        >
          <div class="programme-card__timeline">
            <div class="programme-card__dot"></div>
            <div v-if="idx < programmes.length - 1" class="programme-card__line"></div>
          </div>

          <div class="programme-card__body">
            <div class="programme-card__top">
              <div class="programme-card__dates">
                <span class="programme-card__date-range">
                  {{ formatDate(p.enrolled_at || p.created_at) }} — {{ formatDate(p.archived_at) }}
                </span>
              </div>
              <span class="programme-card__badge">Archived</span>
            </div>

            <div class="programme-card__substances">
              <span
                v-for="sub in p.substances"
                :key="sub.substance"
                class="programme-card__substance"
                :class="{ 'programme-card__substance--primary': sub.is_primary }"
              >
                {{ formatSubstance(sub.substance) }}
              </span>
            </div>

            <div class="programme-card__stats">
              <div class="programme-card__stat">
                <span class="programme-card__stat-value">{{ p.days_in_program || 0 }}</span>
                <span class="programme-card__stat-label">Days</span>
              </div>
              <div class="programme-card__stat-divider"></div>
              <div class="programme-card__stat">
                <span class="programme-card__stat-value">{{ p.final_sobriety_days || 0 }}</span>
                <span class="programme-card__stat-label">Sober Days</span>
              </div>
              <div class="programme-card__stat-divider"></div>
              <div class="programme-card__stat">
                <span class="programme-card__stat-value">{{ p.milestones_achieved || 0 }}</span>
                <span class="programme-card__stat-label">Milestones</span>
              </div>
            </div>

            <div v-if="p.risk_level_at_archive" class="programme-card__risk">
              <span class="programme-card__risk-badge" :class="`risk--${p.risk_level_at_archive}`">
                {{ p.risk_level_at_archive }} risk at archive
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="!loading && !programmes.length" class="empty-state">
        <div class="empty-state__icon">
          <v-icon name="hi-collection" scale="2.5" />
        </div>
        <h3>No Previous Programmes</h3>
        <p>When you start a new programme, your current one will be archived here with all its history preserved.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, inject, onMounted } from "vue";
import { useToast } from "vue-toast-notification";

const emit = defineEmits(["back"]);
const $http = inject("$http");
const $toast = useToast();

const loading = ref(true);
const programmes = ref([]);

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatSubstance(s) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

async function fetchProgrammes() {
  try {
    loading.value = true;
    const { data } = await $http.$_getPastProgrammes();
    programmes.value = data.data || [];
  } catch {
    $toast.error("Failed to load programme history");
  } finally {
    loading.value = false;
  }
}

onMounted(fetchProgrammes);
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
.programme-history {
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
  background: linear-gradient(135deg, $violet 0%, #7C3AED 50%, #6D28D9 100%);
  border-radius: 28px;
  min-height: 300px;
  color: $white;
  margin-bottom: 20px;
  box-shadow: 0 20px 60px rgba(139, 92, 246, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1) inset;

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
  box-shadow: 0 0 40px rgba(255, 255, 255, 0.3), 0 0 80px rgba(139, 92, 246, 0.3);
  animation: pulse-glow 3s ease-in-out infinite;
}

// ─── Programme List ──────────────────────────────────────────
.programme-list {
  display: flex;
  flex-direction: column;
  padding: 24px 32px 0;
  @media (max-width: 768px) { padding: 20px 16px 0; }
}

.programme-card {
  display: flex;
  gap: 16px;

  &__timeline {
    display: flex; flex-direction: column; align-items: center;
    padding-top: 6px; flex-shrink: 0; width: 20px;
  }

  &__dot {
    width: 12px; height: 12px; border-radius: 50%;
    background: $violet; border: 3px solid $violet-light; flex-shrink: 0;
  }

  &__line { width: 2px; flex: 1; background: rgba($violet, 0.2); margin: 4px 0; }

  &__body {
    @include glass-card;
    flex: 1; border-radius: 20px; padding: 20px; margin-bottom: 16px;
  }

  &__top {
    display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;
  }

  &__date-range { font-size: 13px; font-weight: 500; color: $slate; }

  &__badge {
    font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px;
    padding: 3px 10px; border-radius: 8px; background: rgba($gray, 0.1); color: $gray;
  }

  &__substances { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px; }

  &__substance {
    font-size: 12px; font-weight: 500; padding: 4px 12px; border-radius: 16px;
    background: $bg; color: $slate;
    &--primary { background: $violet-light; color: darken($violet, 10%); font-weight: 600; }
  }

  &__stats {
    display: flex; align-items: center; gap: 16px;
    padding: 12px 14px; background: $bg; border-radius: 12px;
  }

  &__stat { display: flex; flex-direction: column; align-items: center; flex: 1; }
  &__stat-value { font-size: 20px; font-weight: 700; color: $navy; line-height: 1; }
  &__stat-label { font-size: 10px; color: $gray; text-transform: uppercase; letter-spacing: 0.3px; margin-top: 2px; }
  &__stat-divider { width: 1px; height: 28px; background: rgba(0, 0, 0, 0.08); }
  &__risk { margin-top: 12px; }

  &__risk-badge {
    font-size: 11px; font-weight: 600; text-transform: capitalize;
    padding: 4px 12px; border-radius: 8px;
  }
}

// ─── Risk Badges ──────────────────────────────────────────────
.risk--low { background: $emerald-light; color: $emerald-dark; }
.risk--moderate { background: $amber-light; color: darken($amber, 10%); }
.risk--high { background: #FED7AA; color: #C2410C; }
.risk--severe, .risk--critical { background: $rose-light; color: $rose; }

// ─── Empty State ──────────────────────────────────────────────
.empty-state {
  text-align: center; padding: 48px 32px;

  &__icon {
    width: 72px; height: 72px; border-radius: 50%;
    background: linear-gradient(135deg, $violet-light, rgba($violet, 0.15));
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 20px; color: $violet;
  }

  h3 { font-size: 18px; font-weight: 700; color: $navy; margin: 0 0 8px; }
  p { font-size: 14px; color: $gray; line-height: 1.6; max-width: 360px; margin: 0 auto; }
}

// ─── Loading ──────────────────────────────────────────────────
.loading-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  min-height: 400px; gap: 16px; color: $gray; font-size: 14px;
}
.loading-spinner {
  width: 36px; height: 36px; border: 3px solid rgba($violet, 0.2);
  border-top-color: $violet; border-radius: 50%; animation: spin 0.8s linear infinite;
}

// ─── Animations ──────────────────────────────────────────────────
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 40px rgba(255, 255, 255, 0.3), 0 0 80px rgba(139, 92, 246, 0.3); }
  50% { box-shadow: 0 0 60px rgba(255, 255, 255, 0.4), 0 0 100px rgba(139, 92, 246, 0.4); }
}
</style>
