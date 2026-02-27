<template>
  <div class="programme-settings">
    <div class="programme-settings__content">
      <!-- Hero Section -->
      <section class="hero">
        <div class="hero__content">
          <button class="back-link" @click="$emit('back')">
            <v-icon name="hi-arrow-left" scale="0.85" />
            <span>Back</span>
          </button>
          <div class="hero__badge">
            <v-icon name="hi-cog" />
            <span>Recovery</span>
          </div>
          <h1 class="hero__title">
            Programme<br/>
            <span class="hero__title-accent">Settings</span>
          </h1>
          <p class="hero__subtitle">
            Manage your substances, view past programmes, and adjust your recovery plan.
          </p>
        </div>
        <div class="hero__visual">
          <div class="recovery-orb">
            <div class="orb-ring orb-ring--1"></div>
            <div class="orb-ring orb-ring--2"></div>
            <div class="orb-ring orb-ring--3"></div>
            <div class="orb-core">
              <v-icon name="hi-cog" scale="2" />
            </div>
          </div>
        </div>
      </section>

      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
      </div>

      <template v-if="!loading">
        <!-- Section 1: Your Substances -->
        <section class="settings-section">
          <div class="settings-section__header">
            <h3>Your Substances</h3>
            <button
              v-if="!showAddForm"
              class="settings-section__action"
              @click="showAddForm = true"
            >
              <v-icon name="hi-plus" scale="0.7" />
              Add Substance
            </button>
          </div>

          <div v-if="substances.length" class="substance-list">
            <div
              v-for="s in substances"
              :key="s.substance"
              class="substance-item"
            >
              <div class="substance-item__info">
                <span class="substance-item__name">{{ formatSubstance(s.substance) }}</span>
                <span v-if="s.is_primary" class="substance-item__primary">Primary</span>
              </div>
              <div class="substance-item__meta">
                <span v-if="s.frequency_at_peak" class="substance-item__freq">{{ formatFrequency(s.frequency_at_peak) }}</span>
                <span v-if="s.years_of_use" class="substance-item__years">{{ s.years_of_use }}yr{{ s.years_of_use > 1 ? 's' : '' }}</span>
              </div>
            </div>
          </div>
          <p v-else class="settings-section__empty">No substances recorded yet.</p>

          <!-- Add Substance Form -->
          <div v-if="showAddForm" class="add-substance-form">
            <div class="form-group">
              <label>Select substance(s) to add</label>
              <div class="substance-chips">
                <button
                  v-for="opt in availableSubstances"
                  :key="opt.value"
                  class="substance-chip"
                  :class="{ 'substance-chip--active': newSubstances.some(d => d.substance === opt.value) }"
                  @click="toggleNewSubstance(opt.value)"
                >
                  {{ opt.label }}
                </button>
              </div>
              <p v-if="!availableSubstances.length" class="form-hint">All substances are already in your programme.</p>
            </div>

            <div v-for="detail in newSubstances" :key="detail.substance" class="substance-detail">
              <h4 class="substance-detail__title">{{ formatSubstance(detail.substance) }}</h4>
              <div class="form-row">
                <div class="form-group">
                  <label>Age of first use</label>
                  <input type="number" v-model.number="detail.age_of_first_use" class="form-input" min="0" max="100" placeholder="e.g. 16" />
                </div>
                <div class="form-group">
                  <label>Years of use</label>
                  <input type="number" v-model.number="detail.years_of_use" class="form-input" min="0" max="80" placeholder="e.g. 5" />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Last use date</label>
                  <input type="date" v-model="detail.last_use_date" class="form-input" :max="todayStr" />
                </div>
                <div class="form-group">
                  <label>Frequency at peak</label>
                  <select v-model="detail.frequency_at_peak" class="form-select">
                    <option value="">Select...</option>
                    <option value="daily">Daily</option>
                    <option value="several_times_weekly">Several times a week</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="occasional">Occasional</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="add-substance-form__actions">
              <button class="btn-secondary" @click="cancelAdd">Cancel</button>
              <button
                class="btn-primary"
                :disabled="!newSubstances.length || saving"
                @click="saveSubstances"
              >
                <span v-if="saving" class="btn-spinner"></span>
                <span v-else>Save</span>
              </button>
            </div>
          </div>
        </section>

        <!-- Section 2: Programme History -->
        <section class="settings-section">
          <div class="settings-section__header">
            <h3>Programme History</h3>
          </div>
          <div class="history-link" @click="$emit('view-history')">
            <div class="history-link__icon">
              <v-icon name="hi-collection" scale="1" />
            </div>
            <div class="history-link__text">
              <span class="history-link__title">View Past Programmes</span>
              <span class="history-link__desc">See your archived recovery programmes and progress</span>
            </div>
            <v-icon name="hi-chevron-right" scale="1" class="history-link__arrow" />
          </div>
        </section>

        <!-- Section 3: Start New Programme -->
        <section class="settings-section settings-section--danger">
          <div class="settings-section__header">
            <h3>Start New Programme</h3>
          </div>
          <div class="danger-notice">
            <v-icon name="hi-information-circle" scale="0.85" />
            <p>This will archive your current programme. All past data, milestones, and check-ins are preserved and can be viewed in Programme History.</p>
          </div>
          <button class="btn-danger" @click="$emit('start-new')">
            <v-icon name="hi-refresh" scale="0.85" />
            Start New Programme
          </button>
        </section>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted } from "vue";
import { useToast } from "vue-toast-notification";

const props = defineProps({
  substances: { type: Array, default: () => [] },
});
const emit = defineEmits(["back", "updated", "view-history", "start-new"]);
const $http = inject("$http");
const $toast = useToast();

const loading = ref(false);
const showAddForm = ref(false);
const saving = ref(false);
const newSubstances = ref([]);
const todayStr = new Date().toISOString().split("T")[0];

const allSubstanceOptions = [
  { value: "alcohol", label: "Alcohol" },
  { value: "opioids", label: "Opioids" },
  { value: "cannabis", label: "Cannabis" },
  { value: "cocaine", label: "Cocaine" },
  { value: "amphetamines", label: "Amphetamines" },
  { value: "benzodiazepines", label: "Benzodiazepines" },
  { value: "tobacco", label: "Tobacco" },
  { value: "other", label: "Other" },
];

const availableSubstances = computed(() => {
  const existing = (props.substances || []).map((s) => s.substance);
  return allSubstanceOptions.filter((o) => !existing.includes(o.value));
});

function formatSubstance(s) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

function formatFrequency(freq) {
  const labels = {
    daily: "Daily",
    several_times_weekly: "Several/week",
    weekly: "Weekly",
    monthly: "Monthly",
    occasional: "Occasional",
  };
  return labels[freq] || freq;
}

function toggleNewSubstance(value) {
  const idx = newSubstances.value.findIndex((d) => d.substance === value);
  if (idx > -1) {
    newSubstances.value.splice(idx, 1);
  } else {
    newSubstances.value.push({
      substance: value,
      is_primary: false,
      age_of_first_use: null,
      years_of_use: null,
      last_use_date: "",
      frequency_at_peak: "",
    });
  }
}

function cancelAdd() {
  showAddForm.value = false;
  newSubstances.value = [];
}

async function saveSubstances() {
  saving.value = true;
  try {
    const substances = newSubstances.value.map((d) => {
      const entry = { substance: d.substance, is_primary: false };
      if (d.age_of_first_use) entry.age_of_first_use = d.age_of_first_use;
      if (d.years_of_use) entry.years_of_use = d.years_of_use;
      if (d.last_use_date) entry.last_use_date = d.last_use_date;
      if (d.frequency_at_peak) entry.frequency_at_peak = d.frequency_at_peak;
      return entry;
    });
    await $http.$_addRecoverySubstances({ substances });
    $toast.success("Substances added to your programme");
    showAddForm.value = false;
    newSubstances.value = [];
    emit("updated");
  } catch (error) {
    $toast.error(error.response?.data?.message || "Failed to add substances");
  } finally {
    saving.value = false;
  }
}
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

@mixin glass-card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);
}

.programme-settings {
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
  background: linear-gradient(135deg, $sky 0%, $sky-dark 50%, $sky-darker 100%);
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
  box-shadow: 0 0 40px rgba(255, 255, 255, 0.3), 0 0 80px rgba(79, 195, 247, 0.3);
  animation: pulse-glow 3s ease-in-out infinite;
}

// ─── Settings Sections ────────────────────────────────────────
.settings-section {
  @include glass-card;
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 16px;

  &--danger {
    border-color: rgba($rose, 0.15);
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    h3 { font-size: 15px; font-weight: 600; color: $navy; margin: 0; }
  }

  &__action {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 6px 14px;
    border: 1px solid rgba($sky, 0.3);
    border-radius: 10px;
    background: rgba($sky, 0.06);
    color: $sky-dark;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    &:hover { background: rgba($sky, 0.12); border-color: $sky; }
  }

  &__empty {
    font-size: 13px;
    color: $light-gray;
    font-style: italic;
    margin: 0;
  }
}

// ─── Substance List ──────────────────────────────────────────
.substance-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.substance-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 12px;

  &__info {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__name {
    font-size: 14px;
    font-weight: 500;
    color: $navy;
  }

  &__primary {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    padding: 2px 8px;
    border-radius: 6px;
    background: $sky-light;
    color: $sky-dark;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__freq, &__years {
    font-size: 12px;
    color: $gray;
    background: rgba(0, 0, 0, 0.04);
    padding: 3px 8px;
    border-radius: 6px;
  }
}

// ─── Add Substance Form ──────────────────────────────────────
.add-substance-form {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);

  &__actions {
    display: flex;
    gap: 10px;
    margin-top: 20px;
  }
}

.substance-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.substance-chip {
  padding: 8px 16px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 20px;
  background: $white;
  font-size: 13px;
  font-weight: 500;
  color: $slate;
  cursor: pointer;
  transition: all 0.2s;

  &:hover { border-color: $sky; color: $sky-dark; }

  &--active {
    background: linear-gradient(135deg, $sky, $sky-dark);
    color: $white;
    border-color: $sky;
  }
}

.substance-detail {
  margin-top: 16px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 14px;

  &__title {
    font-size: 14px;
    font-weight: 600;
    color: $navy;
    margin: 0 0 12px;
  }
}

.form-group {
  margin-bottom: 12px;
  label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: $slate;
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  @media (max-width: 480px) { grid-template-columns: 1fr; }
}

.form-input, .form-select {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  font-size: 14px;
  color: $navy;
  background: $white;
  transition: border-color 0.2s;
  &:focus { outline: none; border-color: $sky; }
}

.form-hint {
  font-size: 12px;
  color: $light-gray;
  margin-top: 4px;
}

// ─── History Link ────────────────────────────────────────────
.history-link {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover { background: rgba($sky, 0.06); }

  &__icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: linear-gradient(135deg, $sky-light, rgba($sky, 0.15));
    display: flex;
    align-items: center;
    justify-content: center;
    color: $sky-dark;
    flex-shrink: 0;
  }

  &__text {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__title {
    font-size: 14px;
    font-weight: 500;
    color: $navy;
  }

  &__desc {
    font-size: 12px;
    color: $gray;
  }

  &__arrow { color: $light-gray; }
}

// ─── Danger Section ──────────────────────────────────────────
.danger-notice {
  display: flex;
  gap: 10px;
  padding: 14px;
  background: rgba($amber, 0.06);
  border-radius: 12px;
  margin-bottom: 16px;
  color: darken($amber, 10%);

  p { font-size: 13px; line-height: 1.5; margin: 0; color: $slate; }
}

// ─── Buttons ──────────────────────────────────────────────────
.btn-primary {
  flex: 1;
  padding: 12px 20px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, $sky, $sky-dark);
  color: $white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover { opacity: 0.9; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.btn-secondary {
  padding: 12px 20px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  background: $white;
  color: $slate;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
  &:hover { background: $bg; }
}

.btn-danger {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border: 1px solid rgba($rose, 0.3);
  border-radius: 12px;
  background: rgba($rose, 0.06);
  color: $rose;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  &:hover { background: rgba($rose, 0.12); border-color: $rose; }
}

.btn-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: $white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

// ─── Loading ──────────────────────────────────────────────────
.loading-state {
  display: flex;
  justify-content: center;
  padding: 60px 0;
}

.loading-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid rgba($sky, 0.2);
  border-top-color: $sky;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

// ─── Animations ────────────────────────────────────────────────
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 40px rgba(255, 255, 255, 0.3), 0 0 80px rgba(79, 195, 247, 0.3); }
  50% { box-shadow: 0 0 60px rgba(255, 255, 255, 0.4), 0 0 100px rgba(79, 195, 247, 0.4); }
}
</style>
