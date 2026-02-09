<template>
  <div class="interaction-page">
    <!-- Mobile Header -->
    <header class="mobile-header">
      <button class="menu-btn" @click="$emit('openSideNav')">
        <v-icon name="hi-menu-alt-2" scale="1.2" />
      </button>
      <div class="header-logo">
        <v-icon name="gi-medicines" scale="1" />
        <span>Interaction Checker</span>
      </div>
      <div></div>
    </header>

    <!-- Page Content -->
    <div class="page-content">
      <!-- Hero Section -->
      <section class="hero">
        <div class="hero__content">
          <router-link to="/app/specialist/rxgpt" class="back-link desktop-only">
            <v-icon name="hi-arrow-left" scale="0.85" />
            <span>RxGPT Dashboard</span>
          </router-link>
          <div class="hero__badge">
            <div class="badge-pulse"></div>
            <v-icon name="gi-medicines" />
            <span>Drug Interaction Analysis</span>
          </div>
          <h1 class="hero__title">
            Interaction<br/>
            <span class="hero__title-accent">Checker</span>
          </h1>
          <p class="hero__subtitle">
            Check for drug-drug interactions, contraindications, and clinical significance instantly.
          </p>
          <div class="hero__stats">
            <div class="hero-stat">
              <span class="hero-stat__value">{{ drugs.filter(d => d.name).length }}</span>
              <span class="hero-stat__label">Drugs</span>
            </div>
            <div class="hero-stat__divider"></div>
            <div class="hero-stat">
              <span class="hero-stat__value hero-stat__value--accent">{{ credits?.available ?? '—' }}</span>
              <span class="hero-stat__label">Credits</span>
            </div>
            <div class="hero-stat__divider"></div>
            <div class="hero-stat">
              <span class="hero-stat__value" :class="results ? (results.hasInteractions ? 'hero-stat__value--warning' : 'hero-stat__value--success') : ''">
                {{ results ? results.interactions.length : '—' }}
              </span>
              <span class="hero-stat__label">Found</span>
            </div>
          </div>
        </div>
        <div class="hero__visual">
          <div class="ai-orb">
            <div class="orb-ring orb-ring--1"></div>
            <div class="orb-ring orb-ring--2"></div>
            <div class="orb-ring orb-ring--3"></div>
            <div class="orb-core">
              <v-icon name="gi-medicines" />
            </div>
          </div>
          <div class="floating-icons">
            <div class="float-icon float-icon--1"><v-icon name="hi-shield-check" /></div>
            <div class="float-icon float-icon--2"><v-icon name="ri-capsule-line" /></div>
            <div class="float-icon float-icon--3"><v-icon name="hi-exclamation" /></div>
          </div>
        </div>
      </section>

      <!-- Drug Picker Section -->
      <section class="bento drug-picker-section">
        <div
          v-for="(drug, idx) in drugs"
          :key="idx"
          class="bento__card drug-card"
          :class="{ 'drug-card--optional': idx >= 2 && !drug.name }"
        >
          <div class="card-header">
            <div class="card-header__icon" :class="drugIconClass(idx)">
              <v-icon :name="idx < 2 ? 'ri-capsule-line' : 'hi-plus'" scale="0.9" />
            </div>
            <div class="card-header__text">
              <h3 class="card-header__title">Drug {{ String.fromCharCode(65 + idx) }}</h3>
              <p class="card-header__subtitle" v-if="idx >= 2">Optional</p>
            </div>
            <button
              v-if="idx >= 2"
              class="drug-card__remove"
              @click="removeDrug(idx)"
              title="Remove"
            >
              <v-icon name="hi-x" scale="0.8" />
            </button>
          </div>
          <div class="drug-card__fields">
            <div class="form-group">
              <label class="form-label-sm">Drug Name <span v-if="idx < 2" class="required">*</span></label>
              <input
                v-model="drug.name"
                type="text"
                class="form-input"
                :placeholder="idx === 0 ? 'e.g., Amlodipine' : idx === 1 ? 'e.g., Simvastatin' : 'Add medication...'"
              />
            </div>
            <div class="form-row">
              <div class="form-group form-group--half">
                <label class="form-label-sm">Dose</label>
                <input v-model="drug.dose" type="text" class="form-input form-input--sm" placeholder="e.g., 10 mg" />
              </div>
              <div class="form-group form-group--half">
                <label class="form-label-sm">Route</label>
                <select v-model="drug.route" class="form-input form-input--sm">
                  <option value="Oral">Oral</option>
                  <option value="IV">IV</option>
                  <option value="IM">IM</option>
                  <option value="Subcutaneous">Subcutaneous</option>
                  <option value="Topical">Topical</option>
                  <option value="Inhalation">Inhalation</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- Add Drug Button -->
        <button
          v-if="drugs.length < 5"
          class="bento__card add-drug-btn"
          @click="addDrug"
        >
          <v-icon name="hi-plus-circle" scale="1.5" />
          <span>Add Another Drug</span>
        </button>
      </section>

      <!-- Action Buttons -->
      <section class="action-bar">
        <button class="btn btn--outline" @click="clearAll" :disabled="isChecking">
          <v-icon name="hi-refresh" scale="0.85" />
          <span>Clear All</span>
        </button>
        <button
          class="btn btn--primary"
          @click="checkInteractions"
          :disabled="!canCheck || isChecking"
        >
          <v-icon :name="isChecking ? 'hi-refresh' : 'gi-medicines'" scale="0.9" :class="{ 'spin': isChecking }" />
          <span>{{ isChecking ? 'Analyzing...' : 'Check Interactions (1 Credit)' }}</span>
        </button>
      </section>

      <!-- Loading State -->
      <section v-if="isChecking" class="loading-card">
        <div class="loading-spinner">
          <div class="spinner-ring"></div>
          <v-icon name="gi-medicines" scale="1.2" class="spinner-icon" />
        </div>
        <p class="loading-title">Analyzing Drug Interactions...</p>
        <p class="loading-subtitle">Checking against FDA, NICE, BNF, and clinical databases</p>
      </section>

      <!-- Results Section -->
      <template v-if="results && !isChecking">
        <!-- No Interactions Found -->
        <section v-if="!results.hasInteractions" class="bento__card result-safe">
          <div class="result-safe__icon">
            <v-icon name="hi-shield-check" scale="2" />
          </div>
          <h2 class="result-safe__title">No Interactions Found</h2>
          <p class="result-safe__text">{{ results.summary || 'No clinically significant interactions identified between these medications.' }}</p>
        </section>

        <!-- Interactions Found -->
        <template v-else>
          <!-- Per-Interaction Results -->
          <section
            v-for="(interaction, iIdx) in results.interactions"
            :key="iIdx"
            class="interaction-result"
          >
            <!-- Severity Card -->
            <div class="bento__card severity-card" :class="'severity-card--' + interaction.severity">
              <div class="severity-card__header">
                <div class="severity-card__icon" :class="'severity-icon--' + interaction.severity">
                  <v-icon :name="getSeverityIcon(interaction.severity)" scale="1.5" />
                </div>
                <div class="severity-card__info">
                  <h2 class="severity-card__title">{{ formatSeverity(interaction.severity) }} Interaction Detected</h2>
                  <p class="severity-card__drugs">{{ interaction.drug1 }} + {{ interaction.drug2 }}</p>
                  <p class="severity-card__desc">{{ interaction.description }}</p>
                  <div class="severity-card__badges">
                    <span class="severity-badge" :class="'severity-badge--' + interaction.severity">
                      {{ formatSeverity(interaction.severity) }}
                    </span>
                    <span v-if="interaction.enzyme_involved" class="mechanism-badge">
                      {{ interaction.enzyme_involved }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Management Guidance -->
            <div v-if="interaction.management?.length" class="bento__card management-card">
              <div class="card-header">
                <div class="card-header__icon card-header__icon--emerald">
                  <v-icon name="hi-clipboard-check" scale="0.9" />
                </div>
                <h3 class="card-header__title">Management Guidance</h3>
              </div>
              <div class="management-list">
                <div
                  v-for="(mg, mIdx) in interaction.management"
                  :key="mIdx"
                  class="management-item"
                  :class="'management-item--' + mg.type"
                >
                  <v-icon :name="getManagementIcon(mg.type)" scale="0.9" class="management-item__icon" />
                  <div>
                    <p class="management-item__title">{{ mg.title }}</p>
                    <p class="management-item__detail">{{ mg.detail }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Bento Detail Grid -->
            <div class="bento detail-grid">
              <!-- Mechanism -->
              <div class="bento__card detail-card">
                <div class="card-header">
                  <div class="card-header__icon card-header__icon--violet">
                    <v-icon name="hi-beaker" scale="0.9" />
                  </div>
                  <h3 class="card-header__title">Mechanism</h3>
                </div>
                <p class="detail-card__text">{{ interaction.mechanism || 'Mechanism details not available.' }}</p>
                <div v-if="interaction.enzyme_involved" class="detail-card__tag">
                  <span class="tag-label">Enzyme Involved</span>
                  <span class="tag-value">{{ interaction.enzyme_involved }}</span>
                </div>
              </div>

              <!-- Clinical Significance -->
              <div class="bento__card detail-card">
                <div class="card-header">
                  <div class="card-header__icon card-header__icon--rose">
                    <v-icon name="hi-trending-up" scale="0.9" />
                  </div>
                  <h3 class="card-header__title">Clinical Significance</h3>
                </div>
                <div class="significance-rows">
                  <div class="significance-row">
                    <span class="significance-label">Risk Level</span>
                    <span class="severity-badge" :class="'severity-badge--' + interaction.clinical_significance?.risk_level">
                      {{ formatSeverity(interaction.clinical_significance?.risk_level) }}
                    </span>
                  </div>
                  <div class="significance-row">
                    <span class="significance-label">Onset</span>
                    <span class="significance-value">{{ interaction.clinical_significance?.onset || '—' }}</span>
                  </div>
                  <div class="significance-row">
                    <span class="significance-label">Documentation</span>
                    <span class="significance-value">{{ interaction.clinical_significance?.documentation || '—' }}</span>
                  </div>
                </div>
                <div v-if="interaction.clinical_significance?.primary_risk" class="detail-card__warning">
                  <strong>Primary Risk:</strong> {{ interaction.clinical_significance.primary_risk }}
                </div>
              </div>

              <!-- Monitoring -->
              <div class="bento__card detail-card">
                <div class="card-header">
                  <div class="card-header__icon card-header__icon--sky">
                    <v-icon name="hi-eye" scale="0.9" />
                  </div>
                  <h3 class="card-header__title">Monitoring</h3>
                </div>
                <div v-if="interaction.monitoring?.length" class="monitoring-list">
                  <div v-for="(mon, monIdx) in interaction.monitoring" :key="monIdx" class="monitoring-item">
                    <v-icon name="hi-clipboard-list" scale="0.75" class="monitoring-item__icon" />
                    <div>
                      <p class="monitoring-item__test">{{ mon.test }}</p>
                      <p class="monitoring-item__detail">{{ mon.detail }}</p>
                    </div>
                  </div>
                </div>
                <p v-else class="detail-card__text detail-card__text--muted">Standard monitoring applies.</p>
              </div>

              <!-- Alternatives -->
              <div class="bento__card detail-card">
                <div class="card-header">
                  <div class="card-header__icon card-header__icon--amber">
                    <v-icon name="hi-light-bulb" scale="0.9" />
                  </div>
                  <h3 class="card-header__title">Alternatives</h3>
                </div>
                <div v-if="interaction.alternatives?.length" class="alternatives-list">
                  <div v-for="(alt, altIdx) in interaction.alternatives" :key="altIdx" class="alternative-item">
                    <p class="alternative-item__suggestion">{{ alt.suggestion }}</p>
                    <p class="alternative-item__detail">{{ alt.detail }}</p>
                  </div>
                </div>
                <p v-else class="detail-card__text detail-card__text--muted">No specific alternatives suggested.</p>
              </div>
            </div>
          </section>

          <!-- Overall Summary -->
          <section v-if="results.summary" class="bento__card summary-card">
            <div class="card-header">
              <div class="card-header__icon card-header__icon--sky">
                <v-icon name="hi-document-text" scale="0.9" />
              </div>
              <h3 class="card-header__title">Clinical Summary</h3>
            </div>
            <p class="summary-card__text">{{ results.summary }}</p>
          </section>
        </template>

        <!-- Disclaimer -->
        <p class="disclaimer">
          This information is for clinical reference only. Always exercise professional judgement and consult current guidelines before making prescribing decisions.
        </p>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import apiFactory from '@/services/apiFactory';
import { useRxGPT } from './composables/useRxGPT';

const { credits, fetchCreditsAndSettings } = useRxGPT();

const drugs = ref([
  { name: '', dose: '', route: 'Oral' },
  { name: '', dose: '', route: 'Oral' },
]);

const isChecking = ref(false);
const results = ref(null);

onMounted(() => {
  fetchCreditsAndSettings();
});

const canCheck = computed(() => {
  const filledDrugs = drugs.value.filter(d => d.name.trim());
  return filledDrugs.length >= 2;
});

function addDrug() {
  if (drugs.value.length < 5) {
    drugs.value.push({ name: '', dose: '', route: 'Oral' });
  }
}

function removeDrug(idx) {
  if (idx >= 2) {
    drugs.value.splice(idx, 1);
  }
}

function clearAll() {
  drugs.value = [
    { name: '', dose: '', route: 'Oral' },
    { name: '', dose: '', route: 'Oral' },
  ];
  results.value = null;
}

async function checkInteractions() {
  if (!canCheck.value) return;
  isChecking.value = true;
  results.value = null;

  try {
    const filledDrugs = drugs.value
      .filter(d => d.name.trim())
      .map(d => ({
        name: d.name.trim(),
        dose: d.dose.trim() || undefined,
        route: d.route || undefined,
      }));

    const res = await apiFactory.$_rxgptCheckInteractions({ drugs: filledDrugs });
    results.value = res.data?.data || res.data;

    // Update credits display after successful check
    if (results.value?.credits_remaining !== undefined) {
      credits.value = { ...credits.value, available: results.value.credits_remaining };
    } else {
      fetchCreditsAndSettings();
    }
  } catch (e) {
    const msg = e.response?.data?.message || 'Interaction check failed. Please try again.';
    alert(msg);
  } finally {
    isChecking.value = false;
  }
}

function drugIconClass(idx) {
  const classes = ['card-header__icon--sky', 'card-header__icon--violet', 'card-header__icon--amber', 'card-header__icon--emerald', 'card-header__icon--rose'];
  return classes[idx] || 'card-header__icon--sky';
}

function getSeverityIcon(severity) {
  const icons = { major: 'hi-exclamation', moderate: 'hi-exclamation-circle', minor: 'hi-information-circle' };
  return icons[severity] || 'hi-exclamation-circle';
}

function formatSeverity(level) {
  const labels = { major: 'Major', moderate: 'Moderate', minor: 'Minor' };
  return labels[level] || level;
}

function getManagementIcon(type) {
  const icons = {
    dose_adjustment: 'hi-adjustments',
    monitoring: 'hi-eye',
    patient_education: 'hi-user',
    alternative: 'hi-light-bulb',
    general: 'hi-clipboard-check',
  };
  return icons[type] || 'hi-clipboard-check';
}
</script>

<style lang="scss" scoped>
// Design Tokens (matching RxGPT index.vue exactly)
$sky: #4FC3F7;
$sky-light: #E1F5FE;
$sky-dark: #0288D1;
$sky-darker: #01579B;
$navy: #0F172A;
$slate: #334155;
$gray: #64748B;
$light-gray: #94A3B8;
$bg: #F8FAFC;
$emerald: #10B981;
$emerald-light: #D1FAE5;
$amber: #F59E0B;
$amber-light: #FEF3C7;
$rose: #F43F5E;
$rose-light: #FFE4E6;
$violet: #8B5CF6;
$violet-light: #EDE9FE;

@mixin glass-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);
}

.interaction-page {
  width: 100%;
  min-height: 100vh;
  background: $bg;
}

// ====== Mobile header ======
.mobile-header {
  display: none;
  position: sticky;
  top: 0;
  z-index: 100;
  padding: 12px 16px;
  background: white;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #F1F5F9;
  @media (max-width: 768px) { display: flex; }
}

.menu-btn {
  width: 40px; height: 40px; border-radius: 12px; border: none;
  background: $bg; color: $slate; display: flex; align-items: center; justify-content: center; cursor: pointer;
  &:active { background: #E2E8F0; }
}

.header-logo {
  display: flex; align-items: center; gap: 8px;
  font-size: 16px; font-weight: 600; color: $navy;
  svg { color: $sky-dark; }
}

// ====== Page content ======
.page-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px 32px 100px;
  @media (max-width: 768px) { padding: 16px 16px 120px; }
}

// ====== HERO (exact copy from index.vue) ======
.hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  padding: 48px 40px 56px;
  background: linear-gradient(135deg, $sky 0%, $sky-dark 50%, $sky-darker 100%);
  border-radius: 28px;
  position: relative;
  overflow: visible;
  min-height: 460px;
  margin-bottom: 24px;
  box-shadow: 0 20px 60px rgba(2, 136, 209, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1) inset;

  @media (max-width: 768px) {
    display: flex; flex-direction: column; padding: 28px 20px 24px; gap: 0;
    text-align: center; min-height: unset; border-radius: 20px; margin-bottom: 16px;
  }
  @media (max-width: 480px) { padding: 24px 16px 20px; border-radius: 16px; }
}

.hero__content {
  display: flex; flex-direction: column; justify-content: center; z-index: 2;
  @media (max-width: 768px) { width: 100%; align-items: center; }
}

.back-link {
  display: inline-flex; align-items: center; gap: 8px;
  background: rgba(255,255,255,0.15); backdrop-filter: blur(10px);
  border: none; border-radius: 12px; padding: 10px 16px;
  color: white; font-size: 14px; font-weight: 500; cursor: pointer;
  margin-bottom: 20px; width: fit-content; text-decoration: none;
  transition: all 0.2s ease;
  &:hover { background: rgba(255,255,255,0.25); }
}

.desktop-only { @media (max-width: 768px) { display: none !important; } }

.hero__badge {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 8px 16px; background: rgba(255,255,255,0.15); backdrop-filter: blur(10px);
  border-radius: 24px; width: fit-content; margin-bottom: 20px; position: relative;
  @media (max-width: 768px) { margin: 0 auto 16px; }
  svg { width: 16px; height: 16px; color: white; margin-left: 12px; }
  span { font-size: 13px; font-weight: 600; color: white; letter-spacing: 0.3px; }
}

.badge-pulse {
  position: absolute; left: 12px; width: 8px; height: 8px;
  background: $emerald; border-radius: 50%; animation: pulse 2s ease-in-out infinite;
  &::after {
    content: ''; position: absolute; inset: -4px;
    background: rgba($emerald, 0.4); border-radius: 50%;
    animation: pulse-ring 2s ease-out infinite;
  }
}

.hero__title {
  font-size: 48px; font-weight: 800; color: white; line-height: 1.1; margin: 0 0 16px; letter-spacing: -1px;
  @media (max-width: 768px) { font-size: 32px; margin: 0 0 12px; br { display: none; } }
  @media (max-width: 480px) { font-size: 28px; }
}

.hero__title-accent {
  background: linear-gradient(90deg, #fff 0%, rgba(255,255,255,0.7) 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}

.hero__subtitle {
  font-size: 18px; color: white; line-height: 1.6; margin: 0 0 24px; max-width: 400px; opacity: 0.95;
  @media (max-width: 768px) { font-size: 15px; max-width: 100%; margin: 0 0 20px; }
}

.hero__stats {
  display: flex; align-items: center; gap: 20px; padding: 16px 20px;
  background: rgba(255,255,255,0.1); backdrop-filter: blur(10px);
  border-radius: 16px; width: fit-content;
  @media (max-width: 768px) { width: 100%; justify-content: space-around; padding: 16px; gap: 8px; }
}

.hero-stat { text-align: center; flex: 1; }
.hero-stat__value {
  display: block; font-size: 24px; font-weight: 700; color: white; line-height: 1;
  &--success { color: $emerald-light; }
  &--warning { color: $amber-light; }
  &--accent { color: rgba(255,255,255,0.9); }
}
.hero-stat__label {
  display: block; font-size: 12px; color: rgba(255,255,255,0.7); margin-top: 4px;
  text-transform: uppercase; letter-spacing: 0.5px;
}
.hero-stat__divider { width: 1px; height: 32px; background: rgba(255,255,255,0.2); flex-shrink: 0; }

// Hero Visual
.hero__visual {
  display: flex; align-items: center; justify-content: center; position: relative;
  @media (max-width: 768px) { display: none; }
}

.ai-orb { position: relative; width: 200px; height: 200px; display: flex; align-items: center; justify-content: center; }
.orb-ring {
  position: absolute; border-radius: 50%; border: 2px solid rgba(255,255,255,0.2);
  &--1 { width: 100%; height: 100%; animation: spin-slow 20s linear infinite; }
  &--2 { width: 80%; height: 80%; animation: spin-slow 15s linear infinite reverse; }
  &--3 { width: 60%; height: 60%; animation: spin-slow 10s linear infinite; }
}

.orb-core {
  width: 100px; height: 100px;
  background: rgba(255,255,255,0.2); backdrop-filter: blur(20px);
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  box-shadow: 0 0 40px rgba(255,255,255,0.3), 0 0 80px rgba(79,195,247,0.3);
  animation: pulse-glow 3s ease-in-out infinite;
  svg { width: 48px; height: 48px; color: white; }
}

.floating-icons { position: absolute; inset: 0; pointer-events: none; }
.float-icon {
  position: absolute; width: 44px; height: 44px;
  background: rgba(255,255,255,0.15); backdrop-filter: blur(10px);
  border-radius: 12px; display: flex; align-items: center; justify-content: center;
  animation: float 3s ease-in-out infinite;
  svg { width: 20px; height: 20px; color: white; }
  &--1 { top: 10%; right: 10%; animation-delay: 0s; }
  &--2 { bottom: 20%; right: 5%; animation-delay: 1s; }
  &--3 { bottom: 10%; left: 10%; animation-delay: 2s; }
}

@keyframes pulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.1); opacity: 0.8; } }
@keyframes pulse-ring { 0% { transform: scale(1); opacity: 0.8; } 100% { transform: scale(2.5); opacity: 0; } }
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 40px rgba(255,255,255,0.3), 0 0 80px rgba(79,195,247,0.3); }
  50% { box-shadow: 0 0 60px rgba(255,255,255,0.4), 0 0 100px rgba(79,195,247,0.4); }
}
@keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }

// ====== BENTO GRID ======
.bento {
  display: grid;
  gap: 20px;
  @media (max-width: 768px) { gap: 16px; }
}

.bento__card {
  @include glass-card;
  border-radius: 20px;
  padding: 20px;
  @media (max-width: 768px) { padding: 16px; border-radius: 16px; }
}

.card-header {
  display: flex; align-items: center; gap: 12px; margin-bottom: 16px;
  @media (max-width: 768px) { margin-bottom: 12px; }
}

.card-header__icon {
  width: 40px; height: 40px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}

.card-header__icon--sky { background: linear-gradient(135deg, $sky-light 0%, rgba($sky, 0.2) 100%); color: $sky-dark; }
.card-header__icon--emerald { background: linear-gradient(135deg, $emerald-light 0%, rgba($emerald, 0.2) 100%); color: $emerald; }
.card-header__icon--amber { background: linear-gradient(135deg, $amber-light 0%, rgba($amber, 0.2) 100%); color: $amber; }
.card-header__icon--violet { background: linear-gradient(135deg, $violet-light 0%, rgba($violet, 0.2) 100%); color: $violet; }
.card-header__icon--rose { background: linear-gradient(135deg, $rose-light 0%, rgba($rose, 0.2) 100%); color: $rose; }

.card-header__title { font-size: 15px; font-weight: 600; color: $navy; margin: 0; }
.card-header__subtitle { font-size: 12px; color: $gray; margin-top: 2px; }
.card-header__text { flex: 1; }

// ====== Drug Picker ======
.drug-picker-section {
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  margin-bottom: 20px;
  @media (max-width: 768px) { grid-template-columns: 1fr; }
}

.drug-card {
  transition: all 0.2s ease;
  &:hover { box-shadow: 0 8px 28px rgba(0,0,0,0.07); }
  &--optional { opacity: 0.7; border-style: dashed; &:hover { opacity: 1; } }
}

.drug-card__remove {
  width: 32px; height: 32px; border-radius: 8px; border: none;
  background: $rose-light; color: $rose; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
  &:hover { background: $rose; color: white; }
}

.drug-card__fields { display: flex; flex-direction: column; gap: 12px; }

// ====== Form Elements ======
.form-group { display: flex; flex-direction: column; gap: 4px; }
.form-group--half { flex: 1; min-width: 0; }
.form-row { display: flex; gap: 12px; }

.form-label-sm { font-size: 12px; font-weight: 600; color: $slate; }
.required { color: $rose; }

.form-input {
  width: 100%;
  padding: 10px 14px;
  border: 1.5px solid #E2E8F0;
  border-radius: 12px;
  font-size: 14px;
  color: $navy;
  background: white;
  transition: all 0.2s;
  outline: none;

  &::placeholder { color: $light-gray; }
  &:focus { border-color: $sky; box-shadow: 0 0 0 3px rgba($sky, 0.1); }
  &--sm { padding: 8px 12px; font-size: 13px; }
}

select.form-input { cursor: pointer; }

// ====== Add Drug Button ======
.add-drug-btn {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 8px; min-height: 180px; border: 2px dashed #CBD5E1; background: transparent;
  color: $gray; cursor: pointer; transition: all 0.2s; font-size: 14px; font-weight: 500;

  &:hover { border-color: $sky; color: $sky-dark; background: rgba($sky, 0.03); }
  svg { opacity: 0.5; }
}

// ====== Action Bar ======
.action-bar {
  display: flex; align-items: center; justify-content: center; gap: 16px;
  margin-bottom: 24px;
  @media (max-width: 480px) { flex-direction: column; gap: 10px; }
}

.btn {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 14px 28px; border-radius: 14px; font-size: 15px; font-weight: 600;
  cursor: pointer; transition: all 0.2s; border: none;

  &:disabled { opacity: 0.5; cursor: not-allowed; }

  &--primary {
    background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
    color: white;
    box-shadow: 0 4px 16px rgba(2, 136, 209, 0.3);
    &:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(2, 136, 209, 0.4); }
  }

  &--outline {
    background: white; color: $slate;
    border: 2px solid #E2E8F0;
    &:hover:not(:disabled) { border-color: $sky; color: $sky-dark; }
  }
}

.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

// ====== Loading ======
.loading-card {
  @include glass-card;
  border-radius: 20px; padding: 48px 20px;
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  margin-bottom: 24px;
}

.loading-spinner { position: relative; width: 64px; height: 64px; }
.spinner-ring {
  position: absolute; inset: 0; border: 3px solid $sky-light;
  border-top-color: $sky; border-radius: 50%; animation: spin 1s linear infinite;
}
.spinner-icon { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: $sky; }
.loading-title { font-size: 16px; font-weight: 600; color: $navy; }
.loading-subtitle { font-size: 13px; color: $gray; }

// ====== No Interactions / Safe ======
.result-safe {
  text-align: center; padding: 48px 20px; margin-bottom: 24px;
  border: 2px solid $emerald-light;
}

.result-safe__icon {
  width: 72px; height: 72px; border-radius: 50%; margin: 0 auto 16px;
  background: linear-gradient(135deg, $emerald-light 0%, rgba($emerald, 0.15) 100%);
  display: flex; align-items: center; justify-content: center; color: $emerald;
}

.result-safe__title { font-size: 22px; font-weight: 700; color: $navy; margin: 0 0 8px; }
.result-safe__text { font-size: 14px; color: $gray; max-width: 500px; margin: 0 auto; line-height: 1.6; }

// ====== Interaction Results ======
.interaction-result { margin-bottom: 32px; display: flex; flex-direction: column; gap: 20px; }

// Severity Card
.severity-card {
  border-left: 4px solid $gray;

  &--major { border-left-color: $rose; }
  &--moderate { border-left-color: $amber; }
  &--minor { border-left-color: $sky; }
}

.severity-card__header { display: flex; gap: 16px; align-items: flex-start; }

.severity-card__icon {
  width: 56px; height: 56px; border-radius: 16px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; color: white;
}

.severity-icon--major { background: linear-gradient(135deg, $rose 0%, darken($rose, 10%) 100%); }
.severity-icon--moderate { background: linear-gradient(135deg, $amber 0%, darken($amber, 10%) 100%); }
.severity-icon--minor { background: linear-gradient(135deg, $sky 0%, $sky-dark 100%); }

.severity-card__info { flex: 1; }
.severity-card__title { font-size: 20px; font-weight: 700; color: $navy; margin: 0 0 4px; }
.severity-card__drugs { font-size: 14px; font-weight: 600; color: $sky-dark; margin: 0 0 8px; }
.severity-card__desc { font-size: 14px; color: $gray; line-height: 1.5; margin: 0 0 12px; }

.severity-card__badges { display: flex; gap: 8px; flex-wrap: wrap; }

.severity-badge {
  display: inline-flex; padding: 4px 12px; border-radius: 20px;
  font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;

  &--major { background: $rose; color: white; }
  &--moderate { background: $amber; color: white; }
  &--minor { background: $sky; color: white; }
}

.mechanism-badge {
  display: inline-flex; padding: 4px 12px; border-radius: 20px;
  font-size: 11px; font-weight: 600; background: #F1F5F9; color: $slate;
}

// Management Card
.management-card { }
.management-list { display: flex; flex-direction: column; gap: 10px; }

.management-item {
  display: flex; gap: 12px; padding: 14px; border-radius: 14px; align-items: flex-start;

  &--dose_adjustment { background: rgba($emerald, 0.06); }
  &--monitoring { background: rgba($sky, 0.06); }
  &--patient_education { background: rgba($violet, 0.06); }
  &--alternative { background: rgba($amber, 0.06); }
  &--general { background: $bg; }
}

.management-item__icon { flex-shrink: 0; margin-top: 2px; color: $sky-dark; }
.management-item--dose_adjustment .management-item__icon { color: $emerald; }
.management-item--monitoring .management-item__icon { color: $sky-dark; }
.management-item--patient_education .management-item__icon { color: $violet; }
.management-item--alternative .management-item__icon { color: $amber; }

.management-item__title { font-size: 14px; font-weight: 600; color: $navy; margin: 0 0 2px; }
.management-item__detail { font-size: 13px; color: $gray; line-height: 1.5; margin: 0; }

// Detail Grid
.detail-grid {
  grid-template-columns: 1fr 1fr;
  @media (max-width: 768px) { grid-template-columns: 1fr; }
}

.detail-card__text {
  font-size: 13px; color: $slate; line-height: 1.6;
  &--muted { color: $light-gray; font-style: italic; }
}

.detail-card__tag {
  margin-top: 12px; padding: 10px 14px; border-radius: 10px;
  background: rgba($violet, 0.05); display: flex; justify-content: space-between; align-items: center;
}

.tag-label { font-size: 12px; font-weight: 600; color: $gray; }
.tag-value { font-size: 13px; font-weight: 700; color: $violet; }

.detail-card__warning {
  margin-top: 12px; padding: 10px 14px; border-radius: 10px;
  background: rgba($rose, 0.05); border-left: 3px solid $rose;
  font-size: 12px; color: $slate; line-height: 1.5;
  strong { color: $navy; }
}

// Clinical Significance
.significance-rows { display: flex; flex-direction: column; gap: 8px; }
.significance-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 12px; border-radius: 10px; background: $bg;
}
.significance-label { font-size: 13px; font-weight: 600; color: $gray; }
.significance-value { font-size: 13px; color: $navy; }

// Monitoring
.monitoring-list { display: flex; flex-direction: column; gap: 10px; }
.monitoring-item {
  display: flex; gap: 10px; padding: 10px 14px; border-radius: 10px;
  background: rgba($sky, 0.05); align-items: flex-start;
}
.monitoring-item__icon { flex-shrink: 0; color: $sky-dark; margin-top: 2px; }
.monitoring-item__test { font-size: 13px; font-weight: 600; color: $navy; margin: 0 0 2px; }
.monitoring-item__detail { font-size: 12px; color: $gray; margin: 0; }

// Alternatives
.alternatives-list { display: flex; flex-direction: column; gap: 10px; }
.alternative-item {
  padding: 10px 14px; border-radius: 10px;
  background: rgba($amber, 0.05); border-left: 3px solid $amber;
}
.alternative-item__suggestion { font-size: 13px; font-weight: 600; color: $navy; margin: 0 0 2px; }
.alternative-item__detail { font-size: 12px; color: $gray; margin: 0; line-height: 1.5; }

// Summary Card
.summary-card { margin-bottom: 16px; }
.summary-card__text { font-size: 14px; color: $slate; line-height: 1.7; }

// Disclaimer
.disclaimer {
  text-align: center; font-size: 12px; color: $light-gray; padding: 16px 0;
  border-top: 1px solid #F1F5F9; margin-top: 8px;
}
</style>
