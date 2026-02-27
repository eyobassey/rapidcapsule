<template>
  <div class="daily-log">
    <div class="daily-log__content">
      <!-- Hero Section -->
      <section class="hero">
        <div class="hero__content">
          <button class="back-link" @click="$emit('back')">
            <v-icon name="hi-arrow-left" scale="0.85" />
            <span>Back</span>
          </button>
          <div class="hero__badge">
            <v-icon name="hi-pencil-alt" />
            <span>{{ greetingText }}</span>
          </div>
          <h1 class="hero__title">
            Daily<br/>
            <span class="hero__title-accent">Check-in</span>
          </h1>
          <p class="hero__subtitle">
            {{ new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }) }}
            &middot; Take a moment to reflect on your day
          </p>
        </div>
        <div class="hero__visual">
          <div class="recovery-orb">
            <div class="orb-ring orb-ring--1"></div>
            <div class="orb-ring orb-ring--2"></div>
            <div class="orb-ring orb-ring--3"></div>
            <div class="orb-core">
              <v-icon name="hi-pencil-alt" scale="2" />
            </div>
          </div>
        </div>
      </section>

      <!-- Form Sections (narrower for readability) -->
      <div class="daily-log__form">
        <!-- Sobriety Check -->
        <section class="log-section">
          <label class="log-section__label">Were you sober today?</label>
          <div class="toggle-group">
            <button
              class="toggle-btn"
              :class="{ 'toggle-btn--active-green': form.sober_today === true }"
              @click="form.sober_today = true"
            >
              <v-icon name="hi-check-circle" scale="1" />
              Yes
            </button>
            <button
              class="toggle-btn"
              :class="{ 'toggle-btn--active-rose': form.sober_today === false }"
              @click="form.sober_today = false"
            >
              <v-icon name="hi-x-circle" scale="1" />
              No
            </button>
          </div>
        </section>

        <!-- Relapse Details (only if sober_today === false) -->
        <section v-if="form.sober_today === false" class="log-section relapse-section">
          <p class="relapse-section__support">
            It's okay — setbacks are part of recovery. What matters is that you're here.
          </p>
          <div class="form-row">
            <div class="form-group">
              <label>What substance?</label>
              <select v-model="form.relapse_details.substance" class="form-select">
                <option value="">Select...</option>
                <option v-for="s in substances" :key="s" :value="s">{{ formatSubstance(s) }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>What triggered it?</label>
              <input v-model="form.relapse_details.trigger" class="form-input" placeholder="e.g. stress, social event..." />
            </div>
          </div>
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="form.relapse_details.sought_help_after" />
              <span class="checkbox-box"><v-icon name="hi-check" scale="0.6" /></span>
              I reached out for help afterwards
            </label>
          </div>
        </section>

        <!-- Mood Score -->
        <section class="log-section">
          <label class="log-section__label">
            How is your mood?
            <span class="log-section__value">{{ form.mood_score }}/10</span>
          </label>
          <div class="mood-faces">
            <button
              v-for="n in 10"
              :key="n"
              class="mood-face"
              :class="{ 'mood-face--active': form.mood_score === n }"
              @click="form.mood_score = n"
            >
              <span class="mood-face__emoji">{{ moodEmojis[n - 1] }}</span>
              <span class="mood-face__num">{{ n }}</span>
            </button>
          </div>
        </section>

        <!-- Craving Intensity -->
        <section class="log-section">
          <label class="log-section__label">
            Craving intensity
            <span class="log-section__value">{{ form.craving_intensity }}/10</span>
          </label>
          <input
            type="range"
            min="0"
            max="10"
            v-model.number="form.craving_intensity"
            class="range-slider"
            :style="{ '--val': form.craving_intensity }"
          />
          <div class="range-labels">
            <span>None</span>
            <span>Severe</span>
          </div>
        </section>

        <!-- Sleep -->
        <section class="log-section">
          <label class="log-section__label">
            Sleep quality
            <span class="log-section__value">{{ sleepLabel }}</span>
          </label>
          <div class="pill-group">
            <button
              v-for="n in 5"
              :key="n"
              class="pill-btn"
              :class="{ 'pill-btn--active': form.sleep_quality === n }"
              @click="form.sleep_quality = n"
            >{{ n }}</button>
          </div>
          <div class="form-group form-group--inline">
            <label>Hours slept</label>
            <input type="number" v-model.number="form.sleep_hours" class="form-input form-input--small" min="0" max="24" step="0.5" />
          </div>
        </section>

        <!-- Quick Toggles -->
        <section class="log-section">
          <label class="log-section__label">Today I...</label>
          <div class="quick-toggles">
            <label class="quick-toggle">
              <input type="checkbox" v-model="form.exercised" />
              <span class="quick-toggle__box">
                <v-icon name="fa-running" scale="0.9" />
                <span>Exercised</span>
              </span>
            </label>
            <label class="quick-toggle">
              <input type="checkbox" v-model="form.attended_meeting_or_session" />
              <span class="quick-toggle__box">
                <v-icon name="hi-user-group" scale="0.9" />
                <span>Attended session</span>
              </span>
            </label>
          </div>
        </section>

        <!-- Triggers -->
        <section class="log-section">
          <label class="log-section__label">Triggers encountered (optional)</label>
          <div class="tag-input">
            <div class="tag-input__tags">
              <span v-for="(t, i) in form.triggers_encountered" :key="i" class="tag">
                {{ t }}
                <button @click="form.triggers_encountered.splice(i, 1)"><v-icon name="hi-x" scale="0.5" /></button>
              </span>
            </div>
            <input
              v-model="triggerInput"
              @keydown.enter.prevent="addTrigger"
              class="tag-input__field"
              placeholder="Type and press Enter..."
            />
          </div>
        </section>

        <!-- Coping Strategies -->
        <section class="log-section">
          <label class="log-section__label">Coping strategies used (optional)</label>
          <div class="chip-selector">
            <button
              v-for="strategy in copingOptions"
              :key="strategy"
              class="chip"
              :class="{ 'chip--active': form.coping_strategies_used.includes(strategy) }"
              @click="toggleCoping(strategy)"
            >{{ strategy }}</button>
          </div>
        </section>

        <!-- Gratitude -->
        <section class="log-section">
          <label class="log-section__label">One thing I'm grateful for (optional)</label>
          <textarea
            v-model="form.gratitude_note"
            class="form-textarea"
            rows="2"
            placeholder="Even small things count..."
          ></textarea>
        </section>

        <!-- Submit (inline at end of form) -->
        <div class="daily-log__submit">
          <button
            class="submit-btn"
            @click="submitLog"
            :disabled="form.sober_today === null || submitting"
          >
            <span v-if="submitting" class="btn-spinner"></span>
            <span v-else>Save Today's Check-in</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Floating Submit Button (always visible while scrolling) -->
    <div class="floating-submit">
      <button
        class="floating-submit__btn"
        @click="submitLog"
        :disabled="form.sober_today === null || submitting"
      >
        <span v-if="submitting" class="btn-spinner btn-spinner--light"></span>
        <template v-else>
          <v-icon name="hi-check" scale="0.85" />
          <span>Save Check-in</span>
        </template>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject } from "vue";
import { useToast } from "vue-toast-notification";

const emit = defineEmits(["back"]);
const $http = inject("$http");
const $toast = useToast();

const submitting = ref(false);
const triggerInput = ref("");

const form = ref({
  sober_today: null,
  mood_score: 5,
  craving_intensity: 3,
  energy_level: 5,
  sleep_quality: 3,
  sleep_hours: 7,
  anxiety_level: 3,
  triggers_encountered: [],
  coping_strategies_used: [],
  exercised: false,
  attended_meeting_or_session: false,
  gratitude_note: "",
  relapse_details: {
    substance: "",
    trigger: "",
    sought_help_after: false,
  },
});

const moodEmojis = ["😞", "😔", "😟", "😐", "🙂", "😊", "😄", "😁", "🥳", "🌟"];
const substances = ["alcohol", "opioids", "cannabis", "cocaine", "amphetamines", "benzodiazepines", "tobacco", "prescription_drugs", "other"];
const copingOptions = ["Deep breathing", "Exercise", "Called someone", "Journaling", "Meditation", "Walked away", "Grounding exercise", "Distraction", "Prayer"];

const greetingText = computed(() => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
});

const sleepLabel = computed(() => {
  const labels = { 1: "Very poor", 2: "Poor", 3: "Fair", 4: "Good", 5: "Excellent" };
  return labels[form.value.sleep_quality] || "Fair";
});

function formatSubstance(s) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

function addTrigger() {
  const val = triggerInput.value.trim();
  if (val && !form.value.triggers_encountered.includes(val)) {
    form.value.triggers_encountered.push(val);
  }
  triggerInput.value = "";
}

function toggleCoping(strategy) {
  const idx = form.value.coping_strategies_used.indexOf(strategy);
  if (idx > -1) form.value.coping_strategies_used.splice(idx, 1);
  else form.value.coping_strategies_used.push(strategy);
}

async function submitLog() {
  submitting.value = true;
  try {
    const payload = { ...form.value };
    // Only include relapse_details if not sober
    if (payload.sober_today) {
      delete payload.relapse_details;
    }
    await $http.$_logSobriety(payload);
    $toast.success("Check-in saved. Well done for showing up today.");
    emit("back");
  } catch (error) {
    $toast.error(error.response?.data?.message || "Failed to save check-in");
  } finally {
    submitting.value = false;
  }
}
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

@mixin glass-card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);
}

// ─── Page ──────────────────────────────────────────────────────────
.daily-log {
  width: 100%;
  min-height: 100%;
  background: $bg;

  &__content {
    max-width: 1400px;
    margin: 0 auto;
    padding: 24px 32px 100px;
    @media (max-width: 768px) { padding: 16px 16px 120px; }
  }

  &__form {
    width: 100%;
  }

  &__submit { margin-top: 32px; }
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
  box-shadow: 0 0 40px rgba(255, 255, 255, 0.3), 0 0 80px rgba(16, 185, 129, 0.3);
  animation: pulse-glow 3s ease-in-out infinite;
}

// ─── Form Sections ─────────────────────────────────────────────
.log-section {
  @include glass-card;
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 12px;

  &__label {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 14px;
    font-weight: 600;
    color: $navy;
    margin-bottom: 14px;
  }

  &__value {
    font-size: 13px;
    font-weight: 700;
    color: $sky-dark;
    background: $sky-light;
    padding: 2px 10px;
    border-radius: 8px;
  }
}

// ─── Sobriety Toggle ────────────────────────────────────────────
.toggle-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  border: 2px solid rgba(0, 0, 0, 0.08);
  border-radius: 14px;
  background: $white;
  font-size: 15px;
  font-weight: 600;
  color: $slate;
  cursor: pointer;
  transition: all 0.2s;

  &:hover { border-color: rgba(0, 0, 0, 0.15); }

  &--active-green {
    border-color: $emerald;
    background: $emerald-light;
    color: $emerald-dark;
  }

  &--active-rose {
    border-color: $rose;
    background: $rose-light;
    color: $rose;
  }
}

// ─── Relapse ────────────────────────────────────────────────────
.relapse-section {
  background: rgba($rose, 0.02);
  border-color: rgba($rose, 0.1);

  &__support {
    font-size: 14px;
    color: $gray;
    line-height: 1.6;
    margin: 0 0 16px;
    font-style: italic;
  }
}

// ─── Mood Faces ─────────────────────────────────────────────────
.mood-faces {
  display: flex;
  gap: 4px;
  justify-content: space-between;
}

.mood-face {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 4px;
  border: 2px solid transparent;
  border-radius: 12px;
  background: none;
  cursor: pointer;
  transition: all 0.2s;
  flex: 1;

  &:hover { background: rgba(0, 0, 0, 0.02); }

  &--active {
    border-color: $sky;
    background: $sky-light;
  }

  &__emoji { font-size: 22px; }
  &__num { font-size: 10px; font-weight: 600; color: $gray; }
}

// ─── Range Slider ───────────────────────────────────────────────
.range-slider {
  width: 100%;
  -webkit-appearance: none;
  height: 6px;
  background: linear-gradient(to right, $sky calc(var(--val) * 10%), rgba(0, 0, 0, 0.08) calc(var(--val) * 10%));
  border-radius: 3px;
  outline: none;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: $white;
    border: 3px solid $sky;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
}

.range-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
  font-size: 11px;
  color: $light-gray;
}

// ─── Pill Group ─────────────────────────────────────────────────
.pill-group {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
}

.pill-btn {
  flex: 1;
  padding: 10px;
  border: 2px solid rgba(0, 0, 0, 0.06);
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.02);
  font-size: 14px;
  font-weight: 600;
  color: $slate;
  cursor: pointer;
  transition: all 0.2s;

  &:hover { border-color: rgba($sky, 0.3); }
  &--active { border-color: $sky; background: $sky-light; color: $sky-dark; }
}

// ─── Quick Toggles ──────────────────────────────────────────────
.quick-toggles {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.quick-toggle {
  cursor: pointer;
  input { display: none; }

  &__box {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 14px 16px;
    border: 2px solid rgba(0, 0, 0, 0.06);
    border-radius: 12px;
    background: rgba(0, 0, 0, 0.02);
    font-size: 13px;
    font-weight: 500;
    color: $slate;
    transition: all 0.2s;
  }

  input:checked + &__box {
    border-color: $sky;
    background: $sky-light;
    color: $sky-dark;
  }
}

// ─── Tag Input ──────────────────────────────────────────────────
.tag-input {
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.02);

  &__tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 4px; }
  &__field {
    border: none; background: transparent; outline: none;
    font-size: 14px; color: $navy; width: 100%; padding: 4px 0;
    &::placeholder { color: $light-gray; }
  }
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: $sky-light;
  color: $sky-dark;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;

  button {
    border: none; background: none; cursor: pointer; padding: 0;
    color: $sky-dark; display: flex;
  }
}

// ─── Chip Selector ──────────────────────────────────────────────
.chip-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  padding: 8px 14px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  background: $white;
  color: $slate;
  cursor: pointer;
  transition: all 0.2s;

  &:hover { border-color: rgba($sky, 0.3); }
  &--active { background: $sky; color: $white; border-color: $sky; }
}

// ─── Form Elements ──────────────────────────────────────────────
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; @media (max-width: 480px) { grid-template-columns: 1fr; } }
.form-group {
  &--inline { display: flex; align-items: center; gap: 12px; label { font-size: 13px; color: $gray; white-space: nowrap; margin: 0; } }
  label { display: block; font-size: 13px; font-weight: 500; color: $navy; margin-bottom: 6px; }
}

.form-input, .form-select {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  font-size: 14px;
  color: $navy;
  background: $white;
  outline: none;
  &:focus { border-color: $sky-dark; box-shadow: 0 0 0 3px rgba($sky, 0.15); }
}

.form-input--small { width: 80px; }

.form-textarea {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  font-size: 14px;
  color: $navy;
  background: rgba(0, 0, 0, 0.02);
  resize: vertical;
  outline: none;
  font-family: inherit;
  &:focus { border-color: $sky-dark; box-shadow: 0 0 0 3px rgba($sky, 0.15); }
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-size: 14px;
  color: $slate;

  input { display: none; }
}

.checkbox-box {
  width: 22px;
  height: 22px;
  border: 2px solid rgba(0, 0, 0, 0.15);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: transparent;
  transition: all 0.2s;
  flex-shrink: 0;
}

input:checked + .checkbox-box {
  background: $sky;
  border-color: $sky;
  color: $white;
}

.submit-btn {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, $sky, $sky-dark);
  color: $white;
  border: none;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 24px rgba($sky, 0.3); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.btn-spinner {
  width: 20px; height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: $white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

// ─── Floating Submit ──────────────────────────────────────────
.floating-submit {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 510;

  @media (max-width: 768px) {
    bottom: 16px;
    left: 16px;
    right: 16px;
    transform: none;
  }

  &__btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 14px 36px;
    border-radius: 28px;
    background: linear-gradient(135deg, $sky, $sky-dark);
    color: $white;
    font-size: 15px;
    font-weight: 700;
    border: none;
    cursor: pointer;
    box-shadow: 0 4px 20px rgba($sky-dark, 0.35), 0 0 0 4px rgba($sky, 0.1);
    transition: all 0.25s;
    white-space: nowrap;

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 32px rgba($sky-dark, 0.45), 0 0 0 4px rgba($sky, 0.15);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    @media (max-width: 768px) {
      width: 100%;
      padding: 16px 28px;
    }
  }
}

// ─── Animations ────────────────────────────────────────────────
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 40px rgba(255, 255, 255, 0.3), 0 0 80px rgba(16, 185, 129, 0.3); }
  50% { box-shadow: 0 0 60px rgba(255, 255, 255, 0.4), 0 0 100px rgba(16, 185, 129, 0.4); }
}
</style>
