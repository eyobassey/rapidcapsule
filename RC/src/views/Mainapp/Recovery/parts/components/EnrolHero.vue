<template>
  <div class="enrol-hero">
    <div class="enrol-hero__visual">
      <div class="enrol-hero__circles">
        <div class="enrol-hero__circle enrol-hero__circle--1"></div>
        <div class="enrol-hero__circle enrol-hero__circle--2"></div>
        <div class="enrol-hero__circle enrol-hero__circle--3"></div>
      </div>
      <div class="enrol-hero__icon-group">
        <v-icon name="hi-heart" scale="3" class="enrol-hero__main-icon" />
      </div>
    </div>

    <h1 class="enrol-hero__title">Your Recovery Journey<br />Starts Here</h1>
    <p class="enrol-hero__subtitle">
      A safe, private, and clinically-guided programme to support your recovery.
      Track your progress, access AI-powered support, and celebrate every milestone.
    </p>

    <div class="enrol-hero__features">
      <div class="enrol-hero__feature" v-for="feature in features" :key="feature.title">
        <div class="enrol-hero__feature-icon">
          <v-icon :name="feature.icon" scale="0.9" />
        </div>
        <div class="enrol-hero__feature-text">
          <h3>{{ feature.title }}</h3>
          <p>{{ feature.desc }}</p>
        </div>
      </div>
    </div>

    <div class="enrol-hero__cta">
      <button class="enrol-hero__btn" @click="showConsent = true">
        Begin Your Journey
        <v-icon name="hi-arrow-right" scale="0.9" />
      </button>
      <p class="enrol-hero__privacy">
        <v-icon name="hi-shield-check" scale="0.7" />
        UK GDPR compliant. Your data stays private and secure.
      </p>
    </div>

    <!-- Consent & Enrol Modal -->
    <div v-if="showConsent" class="consent-overlay" @click.self="closeConsent">
      <div class="consent-modal">
        <div class="consent-modal__header">
          <h2>{{ props.mode === 'reenrol' ? 'Start New Programme' : 'Recovery Programme Enrolment' }}</h2>
          <button class="consent-modal__close" @click="closeConsent">
            <v-icon name="hi-x" scale="1" />
          </button>
        </div>

        <div class="consent-modal__body" v-if="step === 1">
          <p class="consent-modal__intro">
            Please tell us a bit about your situation so we can personalise your recovery plan.
          </p>

          <div class="form-group">
            <label>Primary substance(s) of concern</label>
            <div class="substance-chips">
              <button
                v-for="s in substanceOptions"
                :key="s.value"
                class="substance-chip"
                :class="{ 'substance-chip--active': substanceDetails.some(d => d.substance === s.value) }"
                @click="toggleSubstance(s.value)"
              >
                {{ s.label }}
              </button>
            </div>
          </div>

          <!-- Per-substance history details -->
          <div v-for="(detail, idx) in substanceDetails" :key="detail.substance" class="substance-detail">
            <h4 class="substance-detail__title">
              {{ formatSubstance(detail.substance) }}
              <span v-if="idx === 0" class="substance-detail__primary">Primary</span>
            </h4>
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

          <div class="form-group" v-if="substanceDetails.length">
            <label>When did your recovery / sobriety begin?</label>
            <input type="date" v-model="sobrietyDate" class="form-input" :max="todayStr" />
            <span class="form-hint">If you're just starting, leave as today's date.</span>
          </div>

          <div class="form-group">
            <label>Level of care</label>
            <div class="care-options">
              <button
                v-for="level in careLevels"
                :key="level.value"
                class="care-option"
                :class="{ 'care-option--active': careLevel === level.value }"
                @click="careLevel = level.value"
              >
                <span class="care-option__title">{{ level.label }}</span>
                <span class="care-option__desc">{{ level.desc }}</span>
              </button>
            </div>
          </div>

          <button
            class="consent-modal__next"
            @click="step = 2"
            :disabled="!substanceDetails.length"
          >
            Continue to Consent
            <v-icon name="hi-arrow-right" scale="0.8" />
          </button>
        </div>

        <div class="consent-modal__body" v-if="step === 2">
          <p class="consent-modal__intro">
            Your privacy is paramount. Please review and provide consent.
          </p>

          <div class="consent-items">
            <label class="consent-item" v-for="c in consentItems" :key="c.key">
              <input type="checkbox" v-model="consents[c.key]" />
              <div class="consent-item__check">
                <v-icon name="hi-check" scale="0.7" />
              </div>
              <div>
                <span class="consent-item__title">{{ c.title }}</span>
                <span class="consent-item__desc">{{ c.desc }}</span>
              </div>
            </label>
          </div>

          <div class="consent-modal__actions">
            <button class="consent-modal__back" @click="step = 1">
              <v-icon name="hi-arrow-left" scale="0.8" />
              Back
            </button>
            <button
              class="consent-modal__submit"
              @click="enrol"
              :disabled="!consents.treatment_consent || submitting"
            >
              <span v-if="submitting" class="btn-spinner"></span>
              <span v-else>Enrol in Programme</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted } from "vue";
import { useToast } from "vue-toast-notification";

const props = defineProps({
  mode: { type: String, default: "initial" }, // 'initial' | 'reenrol'
});
const emit = defineEmits(["enrol", "reenrolled", "close"]);
const $http = inject("$http");
const $toast = useToast();

const showConsent = ref(false);
const step = ref(1);
const submitting = ref(false);

const todayStr = new Date().toISOString().split("T")[0];
const sobrietyDate = ref(todayStr);
const careLevel = ref("outpatient");
const substanceDetails = ref([]);

const consents = ref({
  treatment_consent: false,
  data_sharing_consent: false,
  emergency_contact_consent: false,
  wearable_monitoring_consent: false,
  ai_companion_consent: false,
  research_consent: false,
});

const substanceOptions = [
  { value: "alcohol", label: "Alcohol" },
  { value: "opioids", label: "Opioids" },
  { value: "cannabis", label: "Cannabis" },
  { value: "cocaine", label: "Cocaine" },
  { value: "amphetamines", label: "Amphetamines" },
  { value: "benzodiazepines", label: "Benzodiazepines" },
  { value: "tobacco", label: "Tobacco" },
  { value: "other", label: "Other" },
];

const careLevels = [
  { value: "outpatient", label: "Outpatient", desc: "Regular appointments with a specialist" },
  { value: "intensive_outpatient", label: "Intensive Outpatient", desc: "Frequent structured sessions" },
  { value: "maintenance", label: "Maintenance", desc: "Ongoing self-guided recovery with check-ins" },
];

const consentItems = [
  { key: "treatment_consent", title: "Treatment Consent *", desc: "I consent to participate in this digital recovery programme." },
  { key: "data_sharing_consent", title: "Data Sharing", desc: "Allow anonymised data sharing with my care team." },
  { key: "emergency_contact_consent", title: "Emergency Contact", desc: "In a crisis, notify my emergency contacts." },
  { key: "ai_companion_consent", title: "AI Companion", desc: "I understand the AI companion is not a medical professional." },
  { key: "wearable_monitoring_consent", title: "Wearable Monitoring", desc: "Allow connected devices to share health data." },
  { key: "research_consent", title: "Research (Optional)", desc: "Contribute anonymised data to addiction research." },
];

const features = [
  { icon: "hi-clipboard-list", title: "Clinical Assessments", desc: "AUDIT, DAST-10, CAGE, and WHO ASSIST screenings" },
  { icon: "hi-chart-bar", title: "Daily Tracking", desc: "Monitor mood, cravings, sleep and triggers" },
  { icon: "bi-robot", title: "AI Recovery Companion", desc: "24/7 empathetic support and coping tools" },
  { icon: "hi-star", title: "Milestones & Rewards", desc: "Celebrate every step of your progress" },
];

function closeConsent() {
  if (props.mode === "reenrol") {
    emit("close");
  } else {
    showConsent.value = false;
  }
}

function toggleSubstance(value) {
  const idx = substanceDetails.value.findIndex((d) => d.substance === value);
  if (idx > -1) {
    substanceDetails.value.splice(idx, 1);
  } else {
    substanceDetails.value.push({
      substance: value,
      is_primary: substanceDetails.value.length === 0,
      age_of_first_use: null,
      years_of_use: null,
      last_use_date: "",
      frequency_at_peak: "",
    });
  }
}

function formatSubstance(s) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

onMounted(() => {
  if (props.mode === "reenrol") {
    showConsent.value = true;
  }
});

async function enrol() {
  submitting.value = true;
  try {
    const history = substanceDetails.value.map((d, i) => {
      const entry = { substance: d.substance, is_primary: i === 0 };
      if (d.age_of_first_use) entry.age_of_first_use = d.age_of_first_use;
      if (d.years_of_use) entry.years_of_use = d.years_of_use;
      if (d.last_use_date) entry.last_use_date = d.last_use_date;
      if (d.frequency_at_peak) entry.frequency_at_peak = d.frequency_at_peak;
      return entry;
    });
    const payload = {
      substance_use_history: history,
      sobriety_start_date: sobrietyDate.value,
      care_level: careLevel.value,
      consent: consents.value,
    };

    if (props.mode === "reenrol") {
      await $http.$_archiveAndReenrol(payload);
      $toast.success("New programme started. Your previous programme has been archived.");
      showConsent.value = false;
      emit("reenrolled");
    } else {
      await $http.$_createRecoveryProfile(payload);
      $toast.success("Welcome to your recovery journey");
      showConsent.value = false;
      emit("enrol");
    }
  } catch (error) {
    $toast.error(error.response?.data?.message || "Failed. Please try again.");
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
$violet: #8B5CF6;
$violet-light: #EDE9FE;
$rose: #F43F5E;

.enrol-hero {
  text-align: center;
  padding: 48px 24px 64px;

  &__visual {
    position: relative;
    width: 120px;
    height: 120px;
    margin: 0 auto 32px;
  }

  &__circles {
    position: absolute;
    inset: 0;
  }

  &__circle {
    position: absolute;
    border-radius: 50%;
    &--1 { inset: 0; background: $sky-light; animation: pulse-ring 3s ease-in-out infinite; }
    &--2 { inset: 15px; background: rgba($sky, 0.15); animation: pulse-ring 3s ease-in-out infinite 0.5s; }
    &--3 { inset: 30px; background: rgba($sky, 0.25); }
  }

  &__icon-group {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $sky-dark;
    z-index: 1;
  }

  &__title {
    font-size: 28px;
    font-weight: 800;
    color: $navy;
    line-height: 1.2;
    margin-bottom: 12px;
  }

  &__subtitle {
    font-size: 15px;
    color: $gray;
    line-height: 1.7;
    max-width: 500px;
    margin: 0 auto 40px;
  }

  &__features {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    max-width: 600px;
    margin: 0 auto 40px;
    text-align: left;

    @media (max-width: 640px) { grid-template-columns: 1fr; }
  }

  &__feature {
    display: flex;
    gap: 14px;
    padding: 16px;
    background: $white;
    border: 1px solid rgba(0, 0, 0, 0.06);
    border-radius: 16px;
    transition: box-shadow 0.2s;
    &:hover { box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06); }
  }

  &__feature-icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: $sky-light;
    color: $sky-dark;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__feature-text {
    h3 { font-size: 14px; font-weight: 600; color: $navy; margin: 0 0 2px; }
    p { font-size: 12px; color: $gray; margin: 0; line-height: 1.4; }
  }

  &__cta { margin-top: 8px; }

  &__btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 14px 32px;
    background: linear-gradient(135deg, $sky, $sky-dark);
    color: $white;
    border: none;
    border-radius: 14px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.25s;
    &:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba($sky, 0.3); }
  }

  &__privacy {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    margin-top: 14px;
    font-size: 12px;
    color: $light-gray;
  }
}

// ─── Consent Modal ────────────────────────────────────────────────
.consent-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.consent-modal {
  background: $white;
  border-radius: 24px;
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.2);

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px 28px 0;
    h2 { font-size: 20px; font-weight: 700; color: $navy; margin: 0; }
  }

  &__close {
    width: 36px;
    height: 36px;
    border: none;
    background: $bg;
    border-radius: 10px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $gray;
    &:hover { background: rgba($rose, 0.1); color: $rose; }
  }

  &__body { padding: 24px 28px 28px; }

  &__intro {
    font-size: 14px;
    color: $gray;
    line-height: 1.6;
    margin: 0 0 24px;
  }

  &__next, &__submit {
    width: 100%;
    padding: 14px;
    border: none;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-top: 24px;
    transition: all 0.2s;

    &:disabled { opacity: 0.5; cursor: not-allowed; }
  }

  &__next {
    background: linear-gradient(135deg, $sky, $sky-dark);
    color: $white;
    &:hover:not(:disabled) { background: $sky-dark; }
  }

  &__submit {
    background: linear-gradient(135deg, $sky, $sky-dark);
    color: $white;
    &:hover:not(:disabled) { box-shadow: 0 4px 16px rgba($sky, 0.3); }
  }

  &__actions {
    display: flex;
    gap: 12px;
    margin-top: 24px;
  }

  &__back {
    flex: 0 0 auto;
    padding: 14px 20px;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 12px;
    background: $white;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    color: $slate;
    &:hover { background: $bg; }
  }
}

// ─── Form Fields ──────────────────────────────────────────────────
.form-group {
  margin-bottom: 20px;
  label { display: block; font-size: 13px; font-weight: 600; color: $navy; margin-bottom: 8px; }
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  font-size: 14px;
  color: $navy;
  background: $bg;
  outline: none;
  &:focus { border-color: $sky-dark; box-shadow: 0 0 0 3px rgba($sky, 0.15); }
}

.substance-detail {
  background: $bg;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 16px;

  &__title {
    font-size: 14px;
    font-weight: 600;
    color: $navy;
    margin: 0 0 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__primary {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    background: $sky-light;
    color: $sky-dark;
    padding: 2px 8px;
    border-radius: 6px;
    font-weight: 700;
  }
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  @media (max-width: 480px) { grid-template-columns: 1fr; }
}

.form-select {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  font-size: 14px;
  color: $navy;
  background: $white;
  outline: none;
  &:focus { border-color: $sky-dark; box-shadow: 0 0 0 3px rgba($sky, 0.15); }
}

.form-hint {
  display: block;
  font-size: 12px;
  color: $light-gray;
  margin-top: 4px;
}

.substance-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.substance-chip {
  padding: 8px 16px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  background: $white;
  color: $slate;
  cursor: pointer;
  transition: all 0.2s;

  &:hover { border-color: $sky; }
  &--active {
    background: $sky;
    color: $white;
    border-color: $sky;
  }
}

.care-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.care-option {
  padding: 14px 16px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  background: $white;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s;

  &:hover { border-color: rgba($sky, 0.3); }
  &--active { border-color: $sky; background: $sky-light; }

  &__title { display: block; font-size: 14px; font-weight: 600; color: $navy; }
  &__desc { display: block; font-size: 12px; color: $gray; margin-top: 2px; }
}

.consent-items {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.consent-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover { background: $bg; }

  input[type="checkbox"] { display: none; }

  &__check {
    width: 24px;
    height: 24px;
    border: 2px solid rgba(0, 0, 0, 0.15);
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: transparent;
    transition: all 0.2s;
  }

  input:checked + &__check {
    background: $sky;
    border-color: $sky;
    color: $white;
  }

  &__title { display: block; font-size: 14px; font-weight: 600; color: $navy; }
  &__desc { display: block; font-size: 12px; color: $gray; margin-top: 2px; line-height: 1.4; }
}

.btn-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: $white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }
@keyframes pulse-ring {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.08); opacity: 0.7; }
}
</style>
