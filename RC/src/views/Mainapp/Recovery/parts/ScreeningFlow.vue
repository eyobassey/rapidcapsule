<template>
  <div class="screening-flow">
    <!-- Step 1: Choose Instrument -->
    <div v-if="phase === 'choose'" class="screening-flow__content">
      <section class="hero">
        <div class="hero__content">
          <button class="back-link" @click="$emit('back')">
            <v-icon name="hi-arrow-left" scale="0.85" />
            <span>Back</span>
          </button>
          <div class="hero__badge">
            <v-icon name="hi-clipboard-check" />
            <span>Mental Health</span>
          </div>
          <h1 class="hero__title">
            Screening<br/>
            <span class="hero__title-accent">Assessment</span>
          </h1>
          <p class="hero__subtitle">
            {{ history.length
              ? `${history.length} assessment${history.length !== 1 ? 's' : ''} completed. Choose a clinically-validated screening tool.`
              : 'Choose a clinically-validated screening tool based on your situation.' }}
          </p>
          <div v-if="history.length" class="hero__stats">
            <div class="hero-stat">
              <span class="hero-stat__value">{{ history.length }}</span>
              <span class="hero-stat__label">Total</span>
            </div>
            <div class="hero-stat__divider"></div>
            <div class="hero-stat">
              <span class="hero-stat__value">{{ history[0] ? history[0].total_score : '—' }}</span>
              <span class="hero-stat__label">Latest Score</span>
            </div>
            <div class="hero-stat__divider"></div>
            <div class="hero-stat">
              <span class="hero-stat__value" style="text-transform: capitalize;">{{ history[0] ? history[0].risk_level : '—' }}</span>
              <span class="hero-stat__label">Risk Level</span>
            </div>
          </div>
        </div>
        <div class="hero__visual">
          <div class="recovery-orb">
            <div class="orb-ring orb-ring--1"></div>
            <div class="orb-ring orb-ring--2"></div>
            <div class="orb-ring orb-ring--3"></div>
            <div class="orb-core">
              <v-icon name="hi-clipboard-check" scale="2" />
            </div>
          </div>
        </div>
      </section>

      <div v-if="recommended" class="recommended-banner" @click="selectInstrument(recommended)">
        <v-icon name="hi-sparkles" scale="0.9" class="recommended-banner__icon" />
        <div class="recommended-banner__text">
          <span class="recommended-banner__label">Recommended for you</span>
          <span class="recommended-banner__name">{{ instrumentMeta[recommended]?.name }}</span>
        </div>
        <v-icon name="hi-arrow-right" scale="0.9" />
      </div>

      <div class="instrument-cards">
        <div
          v-for="inst in instruments"
          :key="inst.key"
          class="instrument-card"
          @click="selectInstrument(inst.key)"
        >
          <div class="instrument-card__top">
            <span class="instrument-card__badge">{{ inst.questions }} questions</span>
            <span class="instrument-card__time">~{{ inst.time }} min</span>
          </div>
          <h4>{{ inst.name }}</h4>
          <p>{{ inst.desc }}</p>
          <div class="instrument-card__focus">{{ inst.focus }}</div>
        </div>
      </div>
    </div>

    <!-- Step 2: Answer Questions -->
    <div v-if="phase === 'questions'" class="screening-flow__content">
      <div class="questions-inner">
        <button class="questions-back" @click="phase = 'choose'">
          <v-icon name="hi-arrow-left" scale="0.8" />
          <span>Back to instruments</span>
        </button>

        <div class="question-progress">
          <div class="question-progress__bar">
            <div class="question-progress__fill" :style="{ width: progressPct + '%' }"></div>
          </div>
          <span class="question-progress__text">{{ currentIndex + 1 }} / {{ questions.length }}</span>
        </div>

        <div class="question-card" :key="currentIndex">
          <span class="question-card__number">Question {{ currentIndex + 1 }}</span>
          <h3 class="question-card__text">{{ currentQuestion.text }}</h3>

          <div class="answer-options">
            <button
              v-for="option in currentQuestion.options"
              :key="option.value"
              class="answer-option"
              :class="{
                'answer-option--selected': answers[currentQuestion.id] === option.value,
              }"
              @click="selectAnswer(currentQuestion.id, option.value)"
            >
              <span class="answer-option__label">{{ option.label }}</span>
              <span v-if="option.description" class="answer-option__desc">{{ option.description }}</span>
            </button>
          </div>
        </div>

        <div class="question-nav">
          <button
            v-if="currentIndex > 0"
            class="question-nav__prev"
            @click="currentIndex--"
          >
            <v-icon name="hi-arrow-left" scale="0.8" />
            Previous
          </button>
          <div v-else></div>
          <button
            v-if="currentIndex < questions.length - 1"
            class="question-nav__next"
            :disabled="answers[currentQuestion.id] === undefined"
            @click="currentIndex++"
          >
            Next
            <v-icon name="hi-arrow-right" scale="0.8" />
          </button>
          <button
            v-else
            class="question-nav__submit"
            :disabled="!allAnswered || submitting"
            @click="submitScreening"
          >
            <span v-if="submitting" class="btn-spinner"></span>
            <span v-else>Submit Assessment</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Step 3: Results -->
    <div v-if="phase === 'results'" class="screening-flow__content">
      <div class="results-inner">
        <div class="result-card">
          <div class="result-card__score-section">
            <div class="result-card__score-ring" :class="`result-card__score-ring--${result.risk_level}`">
              <span class="result-card__score-value">{{ result.total_score }}</span>
            </div>
            <div class="result-card__score-info">
              <span class="result-card__risk-badge" :class="`result-card__risk-badge--${result.risk_level}`">
                {{ result.risk_zone_label }}
              </span>
              <span class="result-card__instrument">{{ instrumentMeta[selectedInstrument]?.name }}</span>
            </div>
          </div>

          <!-- AI Interpretation -->
          <div v-if="aiInterpretation" class="result-card__ai">
            <div class="result-card__ai-header">
              <v-icon name="hi-sparkles" scale="0.9" />
              <span>AI Clinical Interpretation</span>
            </div>
            <p class="result-card__ai-summary">{{ aiInterpretation.summary }}</p>

            <div v-if="aiInterpretation.recommended_interventions?.length" class="result-card__interventions">
              <h4>Recommended Next Steps</h4>
              <div v-for="(item, i) in aiInterpretation.recommended_interventions" :key="i" class="result-card__intervention">
                <v-icon name="hi-check-circle" scale="0.7" />
                <span>{{ item }}</span>
              </div>
            </div>

            <p v-if="aiInterpretation.motivational_message" class="result-card__motivation">
              "{{ aiInterpretation.motivational_message }}"
            </p>
          </div>

          <div v-else-if="loadingAI" class="result-card__ai-loading">
            <div class="btn-spinner btn-spinner--sky"></div>
            <span>Generating clinical interpretation...</span>
          </div>

          <div class="result-card__actions">
            <button class="result-card__action-primary" @click="phase = 'choose'">
              Take Another Assessment
            </button>
            <button class="result-card__action-secondary" @click="$emit('back')">
              Back to Dashboard
            </button>
          </div>
        </div>

        <!-- History -->
        <div v-if="history.length > 1" class="screening-history">
          <h3>Previous Assessments</h3>
          <div class="screening-history__list">
            <div v-for="h in history.slice(1)" :key="h._id" class="screening-history__item">
              <div class="screening-history__left">
                <span class="screening-history__instrument">{{ instrumentMeta[h.instrument]?.name || h.instrument }}</span>
                <span class="screening-history__date">{{ formatDate(h.created_at) }}</span>
              </div>
              <div class="screening-history__right">
                <span class="screening-history__score">{{ h.total_score }}</span>
                <span class="screening-history__badge" :class="`screening-history__badge--${h.risk_level}`">
                  {{ h.risk_level }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted } from "vue";
import { useToast } from "vue-toast-notification";

const emit = defineEmits(["back"]);
const $http = inject("$http");
const $toast = useToast();

const phase = ref("choose");
const recommended = ref(null);
const selectedInstrument = ref(null);
const questions = ref([]);
const answers = ref({});
const currentIndex = ref(0);
const submitting = ref(false);
const result = ref(null);
const aiInterpretation = ref(null);
const loadingAI = ref(false);
const history = ref([]);
const startTime = ref(null);

const instrumentMeta = {
  audit: { name: "AUDIT", desc: "Alcohol Use Disorders Identification Test", questions: 10, time: 3, focus: "Alcohol" },
  dast10: { name: "DAST-10", desc: "Drug Abuse Screening Test", questions: 10, time: 3, focus: "Drugs" },
  cage: { name: "CAGE", desc: "Quick alcohol dependence screen", questions: 4, time: 1, focus: "Alcohol" },
  assist: { name: "WHO ASSIST", desc: "Alcohol, Smoking and Substance Involvement Screening", questions: 8, time: 5, focus: "Multi-substance" },
};

const instruments = Object.entries(instrumentMeta).map(([key, val]) => ({ key, ...val }));

const currentQuestion = computed(() => questions.value[currentIndex.value]);
const progressPct = computed(() => ((currentIndex.value + 1) / questions.value.length) * 100);
const allAnswered = computed(() => questions.value.every((q) => answers.value[q.id] !== undefined));

async function selectInstrument(key) {
  selectedInstrument.value = key;
  try {
    const { data } = await $http.$_beginScreening({ instrument: key, screening_type: "self" });
    const screening = data.data;
    questions.value = screening.questions;
    answers.value = {};
    currentIndex.value = 0;
    startTime.value = Date.now();
    phase.value = "questions";
  } catch (error) {
    $toast.error("Failed to load screening questions");
  }
}

function selectAnswer(questionId, value) {
  answers.value[questionId] = value;
  // Auto-advance after short delay
  if (currentIndex.value < questions.value.length - 1) {
    setTimeout(() => currentIndex.value++, 300);
  }
}

async function submitScreening() {
  submitting.value = true;
  try {
    const duration = Date.now() - startTime.value;
    const { data } = await $http.$_submitScreening({
      instrument: selectedInstrument.value,
      payload: { answers: answers.value, duration_ms: duration },
    });
    result.value = data.data;
    phase.value = "results";
    fetchAIInterpretation(result.value._id);
    fetchHistory();
  } catch (error) {
    $toast.error("Failed to submit screening");
  } finally {
    submitting.value = false;
  }
}

async function fetchAIInterpretation(screeningId) {
  loadingAI.value = true;
  try {
    const { data } = await $http.$_getScreeningAIInterpretation(screeningId);
    aiInterpretation.value = data.data.ai_interpretation;
  } catch {
    // AI interpretation is optional, don't block results
  } finally {
    loadingAI.value = false;
  }
}

async function fetchHistory() {
  try {
    const { data } = await $http.$_getScreeningHistory({ limit: 10 });
    history.value = data.data;
  } catch {}
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

onMounted(async () => {
  try {
    const { data } = await $http.$_getRecommendedScreening();
    recommended.value = data.data?.recommended;
  } catch {}
  fetchHistory();
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

// ─── Page ──────────────────────────────────────────────────────────
.screening-flow {
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
  min-height: 320px;
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
  box-shadow: 0 0 40px rgba(255, 255, 255, 0.3), 0 0 80px rgba(79, 195, 247, 0.3);
  animation: pulse-glow 3s ease-in-out infinite;
}

// ─── Recommended Banner ────────────────────────────────────────
.recommended-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: linear-gradient(135deg, $violet-light 0%, rgba($violet, 0.08) 100%);
  border: 1px solid rgba($violet, 0.15);
  border-radius: 16px;
  cursor: pointer;
  margin-bottom: 20px;
  transition: all 0.2s;

  &:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba($violet, 0.15); }

  &__icon { color: $violet; }
  &__text { flex: 1; display: flex; flex-direction: column; }
  &__label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: $violet; font-weight: 600; }
  &__name { font-size: 16px; font-weight: 600; color: $navy; }
}

// ─── Instrument Cards ──────────────────────────────────────────
.instrument-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  @media (max-width: 480px) { grid-template-columns: 1fr; }
}

.instrument-card {
  @include glass-card;
  padding: 20px;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.25s;

  &:hover { border-color: $sky; box-shadow: 0 8px 32px rgba($sky, 0.12); transform: translateY(-2px); }

  &__top { display: flex; justify-content: space-between; margin-bottom: 12px; }
  &__badge {
    font-size: 11px; font-weight: 600; color: $sky-dark;
    background: $sky-light; padding: 3px 8px; border-radius: 6px;
  }
  &__time { font-size: 11px; color: $light-gray; }

  h4 { font-size: 16px; font-weight: 700; color: $navy; margin: 0 0 6px; }
  p { font-size: 12px; color: $gray; margin: 0 0 12px; line-height: 1.5; }

  &__focus {
    font-size: 11px; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.5px; color: $gray;
    padding: 4px 10px; background: rgba(0, 0, 0, 0.03); border-radius: 6px; display: inline-block;
  }
}

// ─── Questions Phase ───────────────────────────────────────────
.questions-inner {
  width: 100%;
}

.questions-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  color: $gray;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  padding: 0;
  margin-bottom: 20px;
  transition: color 0.2s;
  &:hover { color: $navy; }
}

.question-progress {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 32px;

  &__bar {
    flex: 1;
    height: 6px;
    background: rgba(0, 0, 0, 0.06);
    border-radius: 3px;
    overflow: hidden;
  }

  &__fill {
    height: 100%;
    background: linear-gradient(90deg, $sky, $sky-dark);
    border-radius: 3px;
    transition: width 0.4s ease;
  }

  &__text { font-size: 13px; font-weight: 600; color: $gray; white-space: nowrap; }
}

.question-card {
  @include glass-card;
  border-radius: 20px;
  padding: 32px 28px;
  margin-bottom: 24px;

  &__number {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: $sky-dark;
    font-weight: 600;
    display: block;
    margin-bottom: 12px;
  }

  &__text {
    font-size: 18px;
    font-weight: 600;
    color: $navy;
    line-height: 1.5;
    margin: 0 0 24px;
  }
}

.answer-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.answer-option {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 14px 18px;
  background: rgba(0, 0, 0, 0.02);
  border: 2px solid transparent;
  border-radius: 14px;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s;

  &:hover { background: $sky-light; border-color: rgba($sky, 0.2); }

  &--selected {
    background: $sky-light;
    border-color: $sky;
  }

  &__label { font-size: 14px; font-weight: 600; color: $navy; }
  &__desc { font-size: 12px; color: $gray; }
}

.question-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;

  &__prev, &__next, &__submit {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 12px 20px;
    border: none;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    &:disabled { opacity: 0.5; cursor: not-allowed; }
  }

  &__prev {
    background: $white;
    border: 1px solid rgba(0, 0, 0, 0.1);
    color: $slate;
    &:hover { background: $bg; }
  }

  &__next {
    background: linear-gradient(135deg, $sky, $sky-dark);
    color: $white;
    &:hover:not(:disabled) { background: $sky-dark; }
  }

  &__submit {
    background: linear-gradient(135deg, $sky, $sky-dark);
    color: $white;
    padding: 14px 28px;
    &:hover:not(:disabled) { box-shadow: 0 4px 16px rgba($sky, 0.3); }
  }
}

// ─── Results Phase ─────────────────────────────────────────────
.results-inner {
  width: 100%;
}

.result-card {
  @include glass-card;
  border-radius: 24px;
  padding: 32px;
  margin-bottom: 24px;

  &__score-section {
    display: flex;
    align-items: center;
    gap: 24px;
    margin-bottom: 28px;
    padding-bottom: 28px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  }

  &__score-ring {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &--low { background: $emerald-light; }
    &--moderate { background: $amber-light; }
    &--high { background: #FED7AA; }
    &--severe, &--critical { background: $rose-light; }
  }

  &__score-value {
    font-size: 28px;
    font-weight: 800;
    color: $navy;
  }

  &__score-info { display: flex; flex-direction: column; gap: 6px; }
  &__instrument { font-size: 14px; color: $gray; }

  &__risk-badge {
    display: inline-block;
    font-size: 13px;
    font-weight: 700;
    padding: 5px 14px;
    border-radius: 8px;

    &--low { background: $emerald-light; color: $emerald-dark; }
    &--moderate { background: $amber-light; color: darken($amber, 10%); }
    &--high { background: #FED7AA; color: #C2410C; }
    &--severe, &--critical { background: $rose-light; color: $rose; }
  }

  &__ai {
    background: linear-gradient(135deg, rgba($violet, 0.04) 0%, rgba($emerald, 0.04) 100%);
    border: 1px solid rgba($violet, 0.1);
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 24px;
  }

  &__ai-header {
    display: flex;
    align-items: center;
    gap: 8px;
    color: $violet;
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 12px;
  }

  &__ai-summary {
    font-size: 14px;
    color: $slate;
    line-height: 1.7;
    margin: 0 0 16px;
  }

  &__interventions {
    h4 { font-size: 13px; font-weight: 600; color: $navy; margin: 0 0 10px; }
  }

  &__intervention {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin-bottom: 8px;
    font-size: 13px;
    color: $slate;
    line-height: 1.5;
    svg { color: $emerald; flex-shrink: 0; margin-top: 2px; }
  }

  &__motivation {
    font-size: 14px;
    font-style: italic;
    color: $violet;
    line-height: 1.6;
    margin: 16px 0 0;
    padding-top: 16px;
    border-top: 1px solid rgba($violet, 0.1);
  }

  &__ai-loading {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 20px;
    background: rgba(0, 0, 0, 0.02);
    border-radius: 12px;
    margin-bottom: 24px;
    font-size: 13px;
    color: $gray;
  }

  &__actions {
    display: flex;
    gap: 12px;
    @media (max-width: 480px) { flex-direction: column; }
  }

  &__action-primary {
    flex: 1;
    padding: 14px;
    background: linear-gradient(135deg, $sky, $sky-dark);
    color: $white;
    border: none;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    &:hover { box-shadow: 0 6px 20px rgba($sky, 0.3); }
  }

  &__action-secondary {
    flex: 1;
    padding: 14px;
    background: $white;
    color: $slate;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    &:hover { background: $bg; }
  }
}

// ─── History ────────────────────────────────────────────────────
.screening-history {
  h3 { font-size: 16px; font-weight: 600; color: $navy; margin: 0 0 12px; }

  &__list { display: flex; flex-direction: column; gap: 8px; }

  &__item {
    @include glass-card;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 18px;
    border-radius: 14px;
  }

  &__left { display: flex; flex-direction: column; gap: 2px; }
  &__instrument { font-size: 14px; font-weight: 600; color: $navy; }
  &__date { font-size: 12px; color: $gray; }

  &__right { display: flex; align-items: center; gap: 10px; }
  &__score { font-size: 20px; font-weight: 700; color: $navy; }

  &__badge {
    font-size: 10px; font-weight: 700; text-transform: uppercase;
    padding: 3px 8px; border-radius: 6px;

    &--low { background: $emerald-light; color: $emerald-dark; }
    &--moderate { background: $amber-light; color: darken($amber, 10%); }
    &--high { background: #FED7AA; color: #C2410C; }
    &--severe, &--critical { background: $rose-light; color: $rose; }
  }
}

// ─── Utilities ──────────────────────────────────────────────────
.btn-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: $white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;

  &--sky {
    border-color: rgba($sky, 0.2);
    border-top-color: $sky;
  }
}

// ─── Animations ────────────────────────────────────────────────
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 40px rgba(255, 255, 255, 0.3), 0 0 80px rgba(79, 195, 247, 0.3); }
  50% { box-shadow: 0 0 60px rgba(255, 255, 255, 0.4), 0 0 100px rgba(79, 195, 247, 0.4); }
}
</style>
