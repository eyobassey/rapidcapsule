<template>
  <div class="results-page">
    <!-- Mobile Header -->
    <header class="mobile-header">
      <button class="back-btn" @click="$router.push('/app/specialist/rxgpt')">
        <v-icon name="hi-arrow-left" scale="1.1" />
      </button>
      <h1 class="mobile-title">Analysis Results</h1>
      <button class="menu-btn" @click="$emit('openSideNav')">
        <v-icon name="hi-menu-alt-2" scale="1.1" />
      </button>
    </header>

    <!-- Page Content -->
    <div class="page-content">
      <!-- Breadcrumbs -->
      <nav class="breadcrumbs desktop-only">
        <router-link to="/app/specialist" class="breadcrumb-item">
          <v-icon name="hi-home" scale="0.7" /> Home
        </router-link>
        <span class="breadcrumb-sep">/</span>
        <router-link to="/app/specialist/rxgpt" class="breadcrumb-item">RxGPT AI</router-link>
        <span class="breadcrumb-sep">/</span>
        <span class="breadcrumb-current">Results</span>
      </nav>

      <!-- Loading State -->
      <div v-if="isLoading" class="loading-state">
        <div class="loading-spinner">
          <div class="spinner-ring"></div>
          <v-icon name="bi-robot" scale="1.2" class="spinner-icon" />
        </div>
        <p>{{ loadingMessage }}</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <v-icon name="hi-exclamation-circle" scale="2" class="error-icon" />
        <h3>Failed to load analysis</h3>
        <p>{{ error }}</p>
        <button class="btn-primary" @click="$router.push('/app/specialist/rxgpt')">
          <v-icon name="hi-arrow-left" scale="0.8" /> Back to Dashboard
        </button>
      </div>

      <!-- Results Content -->
      <template v-else-if="result">
        <!-- Results Header -->
        <div class="results-header">
          <div class="results-header__left">
            <router-link to="/app/specialist/rxgpt" class="back-link desktop-only">
              <v-icon name="hi-arrow-left" scale="0.8" />
              <span>Back to Dashboard</span>
            </router-link>
            <h2 class="results-header__title">Analysis Complete</h2>
            <p class="results-header__meta">
              <span v-if="result.clinical_context?.diagnosis" class="meta-diagnosis">
                {{ result.clinical_context.diagnosis }}
              </span>
              <span class="meta-date">{{ formatDateTime(result.generated_at) }}</span>
              <span v-if="result.version_number > 1 || versions.length > 1" class="meta-version">
                v{{ result.version_number }}
              </span>
            </p>
            <!-- Version Switcher -->
            <div v-if="versions.length > 1" class="version-switcher">
              <button
                v-for="v in versions"
                :key="v._id"
                class="version-pill"
                :class="{ 'version-pill--active': v._id === result._id }"
                @click="switchVersion(v._id)"
              >
                <span class="version-pill__label">v{{ v.version_number }}</span>
                <span class="version-pill__score">{{ Math.round(v.confidence_score) }}%</span>
              </button>
            </div>
          </div>
          <div class="results-header__actions">
            <button class="btn-pdf" @click="generateAnalysisPDF(result)">
              <v-icon name="hi-document-download" scale="0.8" /> Download PDF
            </button>
            <button
              v-if="result.analysis_type === 'standalone'"
              class="btn-rerun"
              :disabled="isRerunning"
              @click="confirmRerun"
            >
              <v-icon v-if="!isRerunning" name="hi-refresh" scale="0.8" />
              <span v-if="isRerunning" class="rerun-spinner"></span>
              {{ isRerunning ? 'Re-running...' : 'Re-run Analysis' }}
            </button>
            <button class="btn-secondary" @click="$router.push('/app/specialist/rxgpt')">
              <v-icon name="hi-plus" scale="0.8" /> New Analysis
            </button>
          </div>
        </div>

        <!-- Overall Confidence Card -->
        <div class="confidence-card" v-if="result.confidence_score">
          <div class="confidence-score">
            <span class="confidence-number">{{ Math.round(result.confidence_score) }}</span>
            <span class="confidence-percent">%</span>
          </div>
          <div class="confidence-info">
            <div class="confidence-label">Overall Confidence Score</div>
            <div class="confidence-bar">
              <div class="confidence-bar__fill" :style="{ width: result.confidence_score + '%' }" :class="confidenceClass"></div>
            </div>
            <div class="confidence-meta">
              Based on {{ result.evidence_summary?.evidence_sources_used?.join(', ') || 'AI analysis' }}
              <span v-if="result.credits_used"> &middot; {{ result.credits_used }} credit{{ result.credits_used !== 1 ? 's' : '' }} used</span>
            </div>
          </div>
        </div>

        <!-- Evidence Summary Cards -->
        <ResultsEvidence :result="result" />

        <!-- Medication Suggestions -->
        <div class="section" v-if="result.suggestions?.length">
          <h3 class="section-title">
            <v-icon name="ri-capsule-line" scale="0.9" />
            Recommended Medications
            <span class="count-badge">{{ result.suggestions.length }}</span>
          </h3>
          <ResultsMedications :suggestions="result.suggestions" />
        </div>

        <!-- Safety & Clinical Info -->
        <div class="section">
          <h3 class="section-title">
            <v-icon name="hi-shield-check" scale="0.9" />
            Clinical Summary & Safety
          </h3>
          <ResultsSafety :result="result" />
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import apiFactory from '@/services/apiFactory';
import ResultsEvidence from './components/ResultsEvidence.vue';
import ResultsMedications from './components/ResultsMedications.vue';
import ResultsSafety from './components/ResultsSafety.vue';
import { formatDateTime } from './composables/useRxGPT';
import { generateAnalysisPDF } from './composables/useRxGPTPdf';

const route = useRoute();
const router = useRouter();

const result = ref(null);
const isLoading = ref(true);
const loadingMessage = ref('Loading analysis results...');
const error = ref(null);
const versions = ref([]);
const isRerunning = ref(false);

const confidenceClass = computed(() => {
  const score = result.value?.confidence_score || 0;
  if (score >= 80) return 'confidence--high';
  if (score >= 50) return 'confidence--medium';
  return 'confidence--low';
});

const loadVersions = (data) => {
  if (data.versions?.length) {
    versions.value = data.versions;
  } else if (data.version_group) {
    apiFactory.$_getRxGPTVersions(data.version_group)
      .then(res => { versions.value = res.data?.data || []; })
      .catch(() => {});
  }
};

const fetchAnalysis = async (id) => {
  if (!id) {
    error.value = 'No analysis ID provided';
    isLoading.value = false;
    return;
  }

  result.value = null;
  error.value = null;
  isLoading.value = true;

  // Check if it's a sessionStorage key (for direct analysis results)
  if (id.startsWith('rxgpt_result_')) {
    try {
      const stored = sessionStorage.getItem(id);
      if (stored) {
        result.value = JSON.parse(stored);
        sessionStorage.removeItem(id);
        loadVersions(result.value);
        isLoading.value = false;
        return;
      }
    } catch (e) {
      // Fall through to API fetch
    }
  }

  // Fetch from API
  try {
    const res = await apiFactory.$_getRxGPTAnalysisById(id);
    result.value = res.data?.data || res.data;
    loadVersions(result.value);
  } catch (e) {
    error.value = e.response?.data?.message || 'Failed to load analysis results.';
  } finally {
    isLoading.value = false;
  }
};

const switchVersion = (id) => {
  if (id !== result.value?._id) {
    router.push(`/app/specialist/rxgpt/results/${id}`);
  }
};

const confirmRerun = async () => {
  if (!confirm('Re-run this analysis with the same inputs? This will use 1 credit.')) return;

  isRerunning.value = true;
  try {
    const res = await apiFactory.$_rxgptRerunAnalysis(result.value._id);
    const data = res.data?.data || res.data;
    // Navigate to the new analysis by its real _id
    if (data._id) {
      router.push(`/app/specialist/rxgpt/results/${data._id}`);
    } else {
      // Fallback: set result directly
      result.value = data;
      loadVersions(data);
    }
  } catch (e) {
    alert(e.response?.data?.message || 'Failed to re-run analysis. Please try again.');
  } finally {
    isRerunning.value = false;
  }
};

// Watch for route param changes (version switching, re-run navigation)
watch(() => route.params.id, (newId) => {
  if (newId) fetchAnalysis(newId);
});

onMounted(() => fetchAnalysis(route.params.id));
</script>

<style lang="scss" scoped>
$sky: #4FC3F7;
$sky-light: #E1F5FE;
$sky-dark: #0288D1;
$sky-darker: #01579B;
$navy: #0F172A;
$slate: #334155;
$gray: #64748B;
$bg: #F8FAFC;
$emerald: #10b981;

.results-page {
  min-height: 100vh;
  background: $bg;
}

// Mobile header
.mobile-header {
  display: none;
  position: sticky;
  top: 0;
  z-index: 50;
  padding: 14px 16px;
  background: white;
  border-bottom: 1px solid #F1F5F9;
  align-items: center;
  justify-content: space-between;
  @media (max-width: 768px) { display: flex; }
}

.back-btn, .menu-btn {
  background: none;
  border: none;
  padding: 8px;
  border-radius: 10px;
  color: $slate;
  cursor: pointer;
}

.mobile-title {
  font-size: 16px;
  font-weight: 700;
  color: $navy;
}

// Page content
.page-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px 32px 48px;
  @media (max-width: 768px) { padding: 16px 16px 32px; }
}

.desktop-only {
  @media (max-width: 768px) { display: none !important; }
}

// Breadcrumbs
.breadcrumbs {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
  font-size: 13px;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  gap: 4px;
  color: $gray;
  text-decoration: none;
  &:hover { color: $sky-dark; }
}

.breadcrumb-sep { color: #d1d5db; }
.breadcrumb-current { color: $slate; font-weight: 600; }

// Loading
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  gap: 16px;
  p { color: $gray; font-size: 14px; }
}

.loading-spinner {
  position: relative;
  width: 56px;
  height: 56px;
}

.spinner-ring {
  position: absolute;
  inset: 0;
  border: 3px solid #e5e7eb;
  border-top-color: $sky-dark;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.spinner-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: $sky-dark;
}

@keyframes spin { to { transform: rotate(360deg); } }

// Error
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 40vh;
  gap: 12px;
  text-align: center;

  .error-icon { color: #ef4444; opacity: 0.5; }
  h3 { font-size: 18px; color: $slate; }
  p { font-size: 14px; color: $gray; max-width: 400px; }
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 8px;
}

// Results Header
.results-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
  gap: 16px;

  @media (max-width: 768px) { flex-direction: column; }
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: $gray;
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 8px;
  &:hover { color: $sky-dark; }
}

.results-header__title {
  font-size: 28px;
  font-weight: 800;
  color: $navy;

  @media (max-width: 768px) { font-size: 22px; }
}

.results-header__meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 4px;
  font-size: 13px;
  color: $gray;
}

.meta-diagnosis {
  background: rgba($sky-dark, 0.08);
  color: $sky-dark;
  padding: 3px 12px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 12px;
}

.meta-version {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  background: rgba($sky-dark, 0.1);
  color: $sky-dark;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.3px;
}

.version-switcher {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.version-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 12px;
  background: white;
  border: 1.5px solid #e5e7eb;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  color: $gray;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: $sky;
    color: $sky-dark;
  }

  &--active {
    background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
    color: white;
    border-color: transparent;

    .version-pill__score { opacity: 0.85; }
  }
}

.version-pill__label { font-weight: 700; }
.version-pill__score { font-weight: 500; opacity: 0.7; }

.btn-rerun {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: white;
  color: $sky-dark;
  border: 1.5px solid $sky-dark;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: rgba($sky-dark, 0.05);
    transform: translateY(-2px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.rerun-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba($sky-dark, 0.2);
  border-top-color: $sky-dark;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.btn-pdf {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba($sky, 0.3);
  }
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: white;
  color: $slate;
  border: 1.5px solid #e5e7eb;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: $sky-dark;
    color: $sky-dark;
  }
}

// Confidence Card
.confidence-card {
  display: flex;
  align-items: center;
  gap: 24px;
  background: rgba(255,255,255,0.75);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.6);
  border-radius: 20px;
  padding: 24px 32px;
  margin-bottom: 24px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.04);

  @media (max-width: 768px) { padding: 20px; gap: 16px; }
}

.confidence-score {
  display: flex;
  align-items: baseline;
  flex-shrink: 0;
}

.confidence-number {
  font-size: 56px;
  font-weight: 800;
  background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;

  @media (max-width: 768px) { font-size: 42px; }
}

.confidence-percent {
  font-size: 24px;
  font-weight: 700;
  color: $gray;
}

.confidence-info {
  flex: 1;
}

.confidence-label {
  font-size: 14px;
  font-weight: 700;
  color: $slate;
  margin-bottom: 8px;
}

.confidence-bar {
  height: 8px;
  background: #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 8px;
}

.confidence-bar__fill {
  height: 100%;
  border-radius: 10px;
  transition: width 0.8s ease;
}

.confidence--high { background: linear-gradient(90deg, $emerald, #059669); }
.confidence--medium { background: linear-gradient(90deg, #f59e0b, #d97706); }
.confidence--low { background: linear-gradient(90deg, #ef4444, #dc2626); }

.confidence-meta {
  font-size: 12px;
  color: $gray;
}

// Sections
.section {
  margin-top: 32px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 700;
  color: $navy;
  margin-bottom: 16px;
}

.count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 8px;
  background: rgba($sky, 0.1);
  color: $sky-dark;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
}
</style>
