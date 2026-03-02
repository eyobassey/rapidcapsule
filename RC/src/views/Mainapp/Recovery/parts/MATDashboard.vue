<template>
  <div class="mat-dashboard">
    <div class="mat-dashboard__content">
      <!-- Hero Section -->
      <section class="hero">
        <div class="hero__content">
          <button class="back-link" @click="$emit('back')">
            <v-icon name="hi-arrow-left" scale="0.85" />
            <span>Back</span>
          </button>
          <div class="hero__badge">
            <v-icon name="ri-capsule-line" />
            <span>MAT Programme</span>
          </div>
          <h1 class="hero__title">
            Medication<br/>
            <span class="hero__title-accent">Treatment</span>
          </h1>
          <p class="hero__subtitle">
            Track your Medication-Assisted Treatment, view compliance status, and stay on top of your medication schedule.
          </p>

          <div v-if="compliance" class="hero__stats">
            <div class="hero-stat">
              <span class="hero-stat__value">{{ medications.length }}</span>
              <span class="hero-stat__label">Medications</span>
            </div>
            <div class="hero-stat__divider"></div>
            <div class="hero-stat">
              <span class="hero-stat__value">{{ compliance.check_in_rate_30d || 0 }}%</span>
              <span class="hero-stat__label">Check-in Rate</span>
            </div>
            <div class="hero-stat__divider"></div>
            <div class="hero-stat">
              <span class="hero-stat__value">{{ compliance.screenings_30d || 0 }}</span>
              <span class="hero-stat__label">Screenings</span>
            </div>
          </div>
        </div>

        <div class="hero__visual">
          <div class="recovery-orb">
            <div class="orb-ring orb-ring--1"></div>
            <div class="orb-ring orb-ring--2"></div>
            <div class="orb-ring orb-ring--3"></div>
            <div class="orb-core">
              <v-icon name="ri-capsule-line" scale="2" />
            </div>
          </div>
        </div>
      </section>

      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        <div class="loading-state__spinner"></div>
        <p>Loading MAT data...</p>
      </div>

      <!-- No MAT -->
      <div v-else-if="!medications.length" class="empty-state">
        <div class="empty-state__icon">
          <v-icon name="ri-capsule-line" scale="2" />
        </div>
        <h3>No MAT Medications</h3>
        <p>You are not currently enrolled in Medication-Assisted Treatment. If you believe this is an error, contact your specialist.</p>
      </div>

      <!-- MAT Content -->
      <template v-else>
        <!-- Compliance Card -->
        <div v-if="compliance" class="compliance-card">
          <div class="compliance-card__header">
            <h4>30-Day Compliance</h4>
            <span
              class="compliance-card__badge"
              :class="`compliance-card__badge--${complianceLevel}`"
            >
              {{ complianceLevel }}
            </span>
          </div>
          <div class="compliance-card__bars">
            <div class="compliance-bar">
              <div class="compliance-bar__label">
                <span>Check-in Rate</span>
                <span class="compliance-bar__value">{{ compliance.check_in_rate_30d || 0 }}%</span>
              </div>
              <div class="compliance-bar__track">
                <div class="compliance-bar__fill" :style="{ width: (compliance.check_in_rate_30d || 0) + '%', background: barColor(compliance.check_in_rate_30d) }"></div>
              </div>
            </div>
            <div class="compliance-bar">
              <div class="compliance-bar__label">
                <span>Screenings</span>
                <span class="compliance-bar__value">{{ compliance.screenings_30d || 0 }}</span>
              </div>
              <div class="compliance-bar__track">
                <div class="compliance-bar__fill" :style="{ width: Math.min((compliance.screenings_30d || 0) / 4 * 100, 100) + '%', background: barColor(Math.min((compliance.screenings_30d || 0) / 4 * 100, 100)) }"></div>
              </div>
            </div>
          </div>
          <div v-if="compliance.risk_level" class="compliance-card__risk">
            <span>Risk Level:</span>
            <span class="compliance-card__risk-badge" :class="`risk--${compliance.risk_level}`">
              {{ compliance.risk_level }}
            </span>
          </div>
        </div>

        <!-- Medications List -->
        <h3 class="section-title">Current Medications</h3>
        <div class="medication-list">
          <div
            v-for="med in medications"
            :key="med._id || med.drug_id"
            class="medication-card"
            @click="toggleMed(med._id || med.drug_id)"
          >
            <div class="medication-card__header">
              <div class="medication-card__icon">
                <v-icon name="ri-capsule-line" scale="0.9" />
              </div>
              <div class="medication-card__info">
                <h4>{{ med.name || med.drug_name || 'Unknown' }}</h4>
                <span class="medication-card__dosage">{{ med.dosage || med.current_dose || '' }}</span>
              </div>
              <v-icon
                :name="expandedMed === (med._id || med.drug_id) ? 'hi-chevron-up' : 'hi-chevron-down'"
                scale="0.8"
                class="medication-card__chevron"
              />
            </div>

            <!-- Expanded Protocol Info -->
            <div v-if="expandedMed === (med._id || med.drug_id)" class="medication-card__details">
              <div v-if="med.frequency" class="detail-row">
                <v-icon name="hi-clock" scale="0.6" />
                <span>Frequency: {{ med.frequency }}</span>
              </div>
              <div v-if="med.prescribing_specialist" class="detail-row">
                <v-icon name="hi-user" scale="0.6" />
                <span>Prescribed by: {{ getSpecialistName(med.prescribing_specialist) }}</span>
              </div>
              <div v-if="med.start_date" class="detail-row">
                <v-icon name="hi-calendar" scale="0.6" />
                <span>Started: {{ formatDate(med.start_date) }}</span>
              </div>

              <!-- Protocol (fetched on expand) -->
              <div v-if="protocolData[med._id || med.drug_id]" class="protocol-section">
                <h5>Treatment Protocol</h5>
                <div v-if="protocolData[med._id || med.drug_id].monitoring_requirements?.length" class="protocol-item">
                  <span class="protocol-item__label">Monitoring:</span>
                  <div class="protocol-tags">
                    <span v-for="req in protocolData[med._id || med.drug_id].monitoring_requirements" :key="req" class="protocol-tag">{{ req }}</span>
                  </div>
                </div>
                <div v-if="protocolData[med._id || med.drug_id].tapering_schedule?.length" class="protocol-item">
                  <span class="protocol-item__label">Tapering Schedule:</span>
                  <div class="tapering-steps">
                    <div v-for="(step, idx) in protocolData[med._id || med.drug_id].tapering_schedule" :key="idx" class="tapering-step">
                      <span class="tapering-step__week">Week {{ step.week || idx + 1 }}</span>
                      <span class="tapering-step__dose">{{ step.dose || step }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <button v-if="!protocolData[med._id || med.drug_id] && med.drug_id" class="btn btn--outline btn--sm" @click.stop="fetchProtocol(med.drug_id, med._id || med.drug_id)">
                View Protocol
              </button>
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
const medications = ref([]);
const compliance = ref(null);
const expandedMed = ref(null);
const protocolData = ref({});

const complianceLevel = computed(() => {
  const rate = compliance.value?.check_in_rate_30d || 0;
  if (rate >= 80) return "good";
  if (rate >= 50) return "moderate";
  return "low";
});

function barColor(pct) {
  if (pct >= 80) return "#10B981";
  if (pct >= 50) return "#F59E0B";
  return "#F43F5E";
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function getSpecialistName(specialist) {
  if (!specialist?.profile) return "Specialist";
  return `Dr. ${specialist.profile.first_name || ""} ${specialist.profile.last_name || ""}`.trim();
}

function toggleMed(id) {
  expandedMed.value = expandedMed.value === id ? null : id;
}

async function fetchProtocol(drugId, key) {
  try {
    const { data } = await $http.$_getMATProtocol(drugId);
    protocolData.value[key] = data.data || {};
  } catch {
    $toast.error("Failed to load protocol");
  }
}

async function fetchData() {
  loading.value = true;
  try {
    const [medRes, compRes] = await Promise.allSettled([
      $http.$_getMATMedications(),
      $http.$_getMATCompliance(),
    ]);
    medications.value = medRes.status === "fulfilled" ? (medRes.value.data.data || []) : [];
    compliance.value = compRes.status === "fulfilled" ? (compRes.value.data.data || null) : null;
  } finally {
    loading.value = false;
  }
}

onMounted(fetchData);
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
$blue: #3B82F6;
$blue-light: #DBEAFE;

@mixin glass-card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);
}

.mat-dashboard {
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
  background: linear-gradient(135deg, $blue 0%, darken($blue, 15%) 50%, darken($blue, 25%) 100%);
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

// Compliance Card
.compliance-card {
  @include glass-card;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;

  &__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; h4 { font-size: 15px; font-weight: 600; color: $navy; margin: 0; } }
  &__badge {
    font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 4px 12px; border-radius: 8px;
    &--good { background: $emerald-light; color: $emerald-dark; }
    &--moderate { background: $amber-light; color: darken($amber, 10%); }
    &--low { background: $rose-light; color: $rose; }
  }
  &__bars { display: flex; flex-direction: column; gap: 16px; }
  &__risk { display: flex; align-items: center; gap: 8px; margin-top: 16px; font-size: 13px; color: $slate; }
  &__risk-badge { font-size: 11px; font-weight: 600; text-transform: uppercase; padding: 3px 10px; border-radius: 6px; }
}

.compliance-bar {
  &__label { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; font-size: 13px; color: $slate; }
  &__value { font-weight: 600; color: $navy; }
  &__track { height: 8px; background: rgba(0,0,0,0.06); border-radius: 4px; overflow: hidden; }
  &__fill { height: 100%; border-radius: 4px; transition: width 0.6s ease; }
}

.risk {
  &--low { background: $emerald-light; color: $emerald-dark; }
  &--moderate { background: $amber-light; color: darken($amber, 10%); }
  &--high { background: #FED7AA; color: #C2410C; }
  &--critical { background: $rose-light; color: $rose; }
}

// Section Title
.section-title { font-size: 16px; font-weight: 700; color: $navy; margin: 0 0 16px; }

// Medication Cards
.medication-list { display: flex; flex-direction: column; gap: 12px; }

.medication-card {
  @include glass-card;
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.25s ease;

  &:hover { transform: translateY(-1px); box-shadow: 0 8px 30px rgba(0,0,0,0.06); }

  &__header { display: flex; align-items: center; gap: 14px; }
  &__icon { width: 44px; height: 44px; border-radius: 14px; background: $blue-light; display: flex; align-items: center; justify-content: center; color: $blue; flex-shrink: 0; }
  &__info { flex: 1; h4 { font-size: 15px; font-weight: 600; color: $navy; margin: 0; } }
  &__dosage { font-size: 12px; color: $gray; }
  &__chevron { color: $light-gray; flex-shrink: 0; }

  &__details {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid rgba(0,0,0,0.06);
  }
}

.detail-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: $gray;
  margin-bottom: 8px;
}

.protocol-section {
  margin-top: 16px;
  padding: 16px;
  background: $bg;
  border-radius: 12px;

  h5 { font-size: 13px; font-weight: 600; color: $navy; margin: 0 0 12px; }
}

.protocol-item {
  margin-bottom: 12px;
  &__label { font-size: 12px; font-weight: 600; color: $slate; display: block; margin-bottom: 6px; }
}

.protocol-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.protocol-tag { font-size: 11px; background: $blue-light; color: $blue; padding: 4px 10px; border-radius: 6px; }

.tapering-steps { display: flex; flex-direction: column; gap: 6px; }
.tapering-step {
  display: flex; justify-content: space-between; padding: 8px 12px; background: $white; border-radius: 8px; font-size: 12px;
  &__week { font-weight: 600; color: $navy; }
  &__dose { color: $gray; }
}

// Buttons
.btn {
  padding: 10px 20px; border-radius: 10px; font-size: 13px; font-weight: 600; border: none; cursor: pointer; transition: all 0.2s;
  &--outline { background: none; border: 1px solid rgba(0,0,0,0.15); color: $gray; &:hover { background: $bg; } }
  &--sm { padding: 8px 14px; font-size: 12px; }
}

// Empty + Loading
.empty-state {
  text-align: center; padding: 60px 20px;
  &__icon { width: 64px; height: 64px; border-radius: 20px; background: $blue-light; display: flex; align-items: center; justify-content: center; color: $blue; margin: 0 auto 20px; }
  h3 { font-size: 18px; font-weight: 600; color: $navy; margin: 0 0 8px; }
  p { font-size: 14px; color: $gray; line-height: 1.6; max-width: 400px; margin: 0 auto; }
}

.loading-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 300px; gap: 16px; color: $gray;
  &__spinner { width: 40px; height: 40px; border: 3px solid rgba($blue, 0.2); border-top-color: $blue; border-radius: 50%; animation: spin 0.8s linear infinite; }
}

@keyframes spin { to { transform: rotate(360deg); } }
@keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>
