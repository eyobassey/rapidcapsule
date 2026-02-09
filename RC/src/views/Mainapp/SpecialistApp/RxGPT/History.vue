<template>
  <div class="rxgpt-history-page">
    <!-- Ambient Background -->
    <div class="ambient-bg">
      <div class="orb orb--1" />
      <div class="orb orb--2" />
      <div class="orb orb--3" />
    </div>

    <!-- Mobile Header -->
    <header class="mobile-header">
      <button class="back-btn" @click="$router.push('/app/specialist/rxgpt')">
        <v-icon name="hi-arrow-left" scale="1.1" />
      </button>
      <h1 class="mobile-title">My Analyses</h1>
      <button class="menu-btn" @click="$emit('openSideNav')">
        <v-icon name="hi-menu-alt-2" scale="1.1" />
      </button>
    </header>

    <!-- Page Container -->
    <div class="page-container">
      <!-- Breadcrumbs -->
      <nav class="breadcrumbs">
        <router-link to="/app/specialist" class="breadcrumb-item">
          <v-icon name="hi-home" scale="0.7" />
          Home
        </router-link>
        <span class="breadcrumb-separator">/</span>
        <router-link to="/app/specialist/rxgpt" class="breadcrumb-item">
          RxGPT AI
        </router-link>
        <span class="breadcrumb-separator">/</span>
        <span class="breadcrumb-current">My Analyses</span>
      </nav>

      <!-- Loading State -->
      <div v-if="isLoading" class="loading-state">
        <div class="loading-spinner">
          <div class="spinner-ring"></div>
          <v-icon name="bi-robot" scale="1.2" class="spinner-icon" />
        </div>
        <p>Loading AI analysis history...</p>
      </div>

      <template v-else>
        <!-- Hero Section -->
        <section class="hero">
          <div class="hero__content">
            <router-link to="/app/specialist/rxgpt" class="back-link desktop-only">
              <v-icon name="hi-arrow-left" scale="0.8" />
              <span>Back to RxGPT</span>
            </router-link>
            <div class="hero__badge">
              <div class="badge-pulse"></div>
              <v-icon name="bi-robot" />
              <span>AI-Powered Analysis</span>
            </div>
            <h1 class="hero__title">
              My Analyses<br/>
              <span class="hero__title-accent">AI History</span>
            </h1>
            <p class="hero__subtitle">
              View and manage all your AI-assisted medication analyses and safety checks.
            </p>
            <div class="hero__stats">
              <div class="hero-stat">
                <span class="hero-stat__value">{{ stats.total_analyses || 0 }}</span>
                <span class="hero-stat__label">Total Analyses</span>
              </div>
              <div class="hero-stat__divider"></div>
              <div class="hero-stat">
                <span class="hero-stat__value hero-stat__value--success">{{ stats.safe_prescriptions || 0 }}</span>
                <span class="hero-stat__label">Safe</span>
              </div>
              <div class="hero-stat__divider"></div>
              <div class="hero-stat">
                <span class="hero-stat__value hero-stat__value--warning">{{ stats.alerts_issued || 0 }}</span>
                <span class="hero-stat__label">Alerts</span>
              </div>
            </div>
          </div>
          <div class="hero__visual">
            <div class="ai-orb">
              <div class="orb-ring orb-ring--1"></div>
              <div class="orb-ring orb-ring--2"></div>
              <div class="orb-ring orb-ring--3"></div>
              <div class="orb-core">
                <v-icon name="bi-robot" />
              </div>
            </div>
            <div class="floating-icons">
              <div class="float-icon float-icon--1"><v-icon name="hi-shield-check" /></div>
              <div class="float-icon float-icon--2"><v-icon name="ri-capsule-line" /></div>
              <div class="float-icon float-icon--3"><v-icon name="hi-clipboard-list" /></div>
            </div>
          </div>
        </section>

        <!-- Bento Grid -->
        <section class="bento-grid">
          <!-- Stats Cards Row -->
          <div class="bento-card stats-card stats-card--safe">
            <div class="stats-card__icon">
              <v-icon name="hi-shield-check" scale="1.2" />
            </div>
            <div class="stats-card__content">
              <span class="stats-card__value">{{ stats.safe_prescriptions || 0 }}</span>
              <span class="stats-card__label">Safe Prescriptions</span>
            </div>
          </div>

          <div class="bento-card stats-card stats-card--warning">
            <div class="stats-card__icon">
              <v-icon name="hi-exclamation" scale="1.2" />
            </div>
            <div class="stats-card__content">
              <span class="stats-card__value">{{ stats.warnings_count || 0 }}</span>
              <span class="stats-card__label">Warnings Issued</span>
            </div>
          </div>

          <div class="bento-card stats-card stats-card--critical">
            <div class="stats-card__icon">
              <v-icon name="hi-exclamation-circle" scale="1.2" />
            </div>
            <div class="stats-card__content">
              <span class="stats-card__value">{{ stats.critical_alerts || 0 }}</span>
              <span class="stats-card__label">Critical Alerts</span>
            </div>
          </div>

          <div class="bento-card stats-card stats-card--credits">
            <div class="stats-card__icon">
              <v-icon name="hi-sparkles" scale="1.2" />
            </div>
            <div class="stats-card__content">
              <span class="stats-card__value">{{ stats.credits_remaining || 0 }}</span>
              <span class="stats-card__label">Credits Left</span>
            </div>
          </div>

          <!-- Analysis History Card (Full Width) -->
          <div class="bento-card history-card bento-card--full">
            <div class="card-header">
              <div class="card-header__left">
                <div class="card-header__icon card-header__icon--indigo">
                  <v-icon name="hi-clock" scale="0.9" />
                </div>
                <h3>Analysis History</h3>
              </div>
              <div class="card-header__actions">
                <select v-model="filters.risk_level" class="filter-select" @change="fetchHistory">
                  <option value="">All Risk Levels</option>
                  <option value="low">Low Risk</option>
                  <option value="moderate">Moderate Risk</option>
                  <option value="high">High Risk</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <!-- Empty State -->
            <div v-if="!analyses.length" class="empty-state">
              <div class="empty-state__icon">
                <v-icon name="bi-robot" scale="2" />
              </div>
              <h4>No AI analyses yet</h4>
              <p>AI analyses will appear here when you use RxGPT to analyze medications.</p>
              <button class="primary-btn" @click="$router.push('/app/specialist/rxgpt')">
                <v-icon name="hi-plus" scale="0.8" />
                Start New Analysis
              </button>
            </div>

            <!-- Analysis List -->
            <div v-else class="analysis-list">
              <div
                v-for="analysis in analyses"
                :key="analysis._id"
                class="analysis-item"
                @click="viewAnalysisDetails(analysis)"
              >
                <div class="analysis-item__left">
                  <div class="analysis-avatar" :class="getRiskClass(analysis.overall_risk_level)">
                    <v-icon :name="getRiskIcon(analysis.overall_risk_level)" scale="1" />
                  </div>
                  <div class="analysis-info">
                    <div class="analysis-header">
                      <span class="analysis-patient">
                        {{ analysis.standalone_context?.subject_name || analysis.clinical_context?.diagnosis || analysis.patient_name || 'Standalone Analysis' }}
                      </span>
                      <span :class="['risk-badge', getRiskBadgeClass(analysis.overall_risk_level)]">
                        {{ formatRiskLevel(analysis.overall_risk_level) }}
                      </span>
                    </div>
                    <p class="analysis-summary">
                      {{ analysis.drugs_analyzed?.length || 0 }} medications analyzed
                      <span v-if="analysis.total_alerts > 0" class="alert-count">
                        &bull; {{ analysis.total_alerts }} alert{{ analysis.total_alerts > 1 ? 's' : '' }}
                      </span>
                    </p>
                    <div class="analysis-tags">
                      <span v-if="analysis.is_safe" class="tag tag--safe">
                        <v-icon name="hi-check-circle" scale="0.6" />
                        Safe
                      </span>
                      <span v-if="analysis.critical_alerts > 0" class="tag tag--critical">
                        <v-icon name="hi-exclamation-circle" scale="0.6" />
                        {{ analysis.critical_alerts }} Critical
                      </span>
                      <span v-if="analysis.warning_alerts > 0" class="tag tag--warning">
                        <v-icon name="hi-exclamation" scale="0.6" />
                        {{ analysis.warning_alerts }} Warning
                      </span>
                      <span v-if="analysis.analysis_type === 'standalone'" class="tag tag--standalone">
                        <v-icon name="bi-robot" scale="0.6" />
                        Standalone
                      </span>
                      <span v-else-if="analysis.prescription_id" class="tag tag--linked">
                        <v-icon name="hi-link" scale="0.6" />
                        Prescription
                      </span>
                    </div>
                  </div>
                </div>
                <div class="analysis-item__right">
                  <span class="analysis-date">{{ formatDate(analysis.created_at) }}</span>
                  <span class="analysis-time">{{ formatTime(analysis.created_at) }}</span>
                  <v-icon name="hi-chevron-right" scale="0.8" class="chevron" />
                </div>
              </div>
            </div>

            <!-- Pagination -->
            <div v-if="pagination.total_pages > 1" class="pagination">
              <button
                class="pagination-btn"
                :disabled="pagination.current_page === 1"
                @click="changePage(pagination.current_page - 1)"
              >
                <v-icon name="hi-chevron-left" scale="0.8" />
              </button>
              <span class="pagination-info">
                Page {{ pagination.current_page }} of {{ pagination.total_pages }}
              </span>
              <button
                class="pagination-btn"
                :disabled="pagination.current_page === pagination.total_pages"
                @click="changePage(pagination.current_page + 1)"
              >
                <v-icon name="hi-chevron-right" scale="0.8" />
              </button>
            </div>
          </div>
        </section>
      </template>
    </div>

    <!-- Analysis Details Modal -->
    <AnalysisDetailModal
      :show="showDetailsModal"
      :analysis="selectedAnalysis"
      @close="showDetailsModal = false"
      @viewResults="goToResults"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toast-notification';
import apiFactory from '@/services/apiFactory';
import AnalysisDetailModal from './components/AnalysisDetailModal.vue';
import {
  formatDate,
  formatDateTime,
  formatRiskLevel,
  getRiskClass,
  getRiskIcon,
  getRiskBadgeClass,
  getAlertIcon,
  formatAlertType,
} from './composables/useRxGPT';

const router = useRouter();
const $toast = useToast();

const isLoading = ref(true);
const analyses = ref([]);
const stats = ref({});
const pagination = ref({
  current_page: 1,
  total_pages: 1,
  total: 0,
});
const filters = ref({
  risk_level: '',
});

const showDetailsModal = ref(false);
const selectedAnalysis = ref(null);

onMounted(() => {
  fetchStats();
  fetchHistory();
});

async function fetchStats() {
  try {
    const response = await apiFactory.$_getRxGPTStats();
    const result = response.data?.data || response.data?.result || response.data;
    stats.value = result || {};
  } catch (error) {
    console.error('Error fetching RxGPT stats:', error);
  }
}

async function fetchHistory() {
  try {
    isLoading.value = true;
    const params = {
      page: pagination.value.current_page,
      limit: 10,
      ...(filters.value.risk_level && { risk_level: filters.value.risk_level }),
    };

    const response = await apiFactory.$_getRxGPTHistory(params);
    const result = response.data?.data || response.data?.result || response.data;

    if (result) {
      analyses.value = result.analyses || result.history || [];
      pagination.value = {
        current_page: result.pagination?.current_page || 1,
        total_pages: result.pagination?.total_pages || 1,
        total: result.pagination?.total || analyses.value.length,
      };
    }
  } catch (error) {
    console.error('Error fetching RxGPT history:', error);
    $toast.error('Failed to load analysis history');
  } finally {
    isLoading.value = false;
  }
}

function changePage(page) {
  pagination.value.current_page = page;
  fetchHistory();
}

function viewAnalysisDetails(analysis) {
  selectedAnalysis.value = analysis;
  showDetailsModal.value = true;
}

function goToResults(id) {
  showDetailsModal.value = false;
  router.push(`/app/specialist/rxgpt/results/${id}`);
}

function formatTime(date) {
  if (!date) return '';
  return new Date(date).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
}
</script>

<style scoped lang="scss">
// Colors - Pharmacy Design System
$sky: #4FC3F7;
$sky-light: #E1F5FE;
$sky-dark: #0288D1;
$sky-darker: #01579B;
$navy: #0F172A;
$slate: #334155;
$gray: #64748B;
$bg: #F8FAFC;
$emerald: #10B981;
$emerald-light: #D1FAE5;
$amber: #F59E0B;
$amber-light: #FEF3C7;
$rose: #F43F5E;
$rose-light: #FFE4E6;
$violet: #8B5CF6;
$violet-light: #EDE9FE;

// Grayscale
$color-g-21: #21262D;
$color-g-36: #363B44;
$color-g-54: #545961;
$color-g-67: #676C75;
$color-g-92: #E8E9EB;
$color-g-97: #F5F6F7;

.rxgpt-history-page {
  min-height: 100vh;
  background: $bg;
  position: relative;
  overflow-x: hidden;
}

// Ambient Background
.ambient-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;

  .orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.15;

    &--1 {
      width: 400px;
      height: 400px;
      background: $sky;
      top: -100px;
      right: -100px;
      animation: float1 20s ease-in-out infinite;
    }

    &--2 {
      width: 300px;
      height: 300px;
      background: $sky-dark;
      bottom: 20%;
      left: -80px;
      animation: float2 25s ease-in-out infinite;
    }

    &--3 {
      width: 250px;
      height: 250px;
      background: $sky;
      top: 50%;
      right: 10%;
      animation: float3 22s ease-in-out infinite;
    }
  }
}

@keyframes float1 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(-30px, 30px) scale(1.1); }
}

@keyframes float2 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(20px, -20px) scale(1.05); }
}

@keyframes float3 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(-15px, 15px) scale(1.08); }
}

// Mobile Header
.mobile-header {
  display: none;
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  padding: 16px 20px;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba($color-g-92, 0.5);

  @media (max-width: 768px) {
    display: flex;
  }

  .back-btn, .menu-btn {
    width: 40px;
    height: 40px;
    border: none;
    background: rgba($color-g-92, 0.5);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $color-g-54;
    cursor: pointer;
  }

  .mobile-title {
    font-size: 17px;
    font-weight: 600;
    color: $color-g-21;
  }
}

// Page Container
.page-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px 32px;
  position: relative;
  z-index: 1;

  @media (max-width: 768px) {
    padding: 20px 16px;
  }
}

// Breadcrumbs
.breadcrumbs {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 32px;
  font-size: 14px;

  @media (max-width: 768px) {
    display: none;
  }

  .breadcrumb-item {
    display: flex;
    align-items: center;
    gap: 6px;
    color: $slate;
    text-decoration: none;
    transition: color 0.2s;

    &:hover {
      color: $sky-dark;
    }
  }

  .breadcrumb-separator {
    color: $color-g-67;
  }

  .breadcrumb-current {
    color: $color-g-21;
    font-weight: 500;
  }
}

// Loading State
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 24px;

  .loading-spinner {
    position: relative;
    width: 80px;
    height: 80px;
  }

  .spinner-ring {
    position: absolute;
    inset: 0;
    border: 3px solid $sky-light;
    border-top-color: $sky-dark;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .spinner-icon {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $sky-dark;
  }

  p {
    font-size: 15px;
    color: $slate;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

// Hero Section
.hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 40px;
  margin-bottom: 40px;
  padding: 40px;
  background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%);
  backdrop-filter: blur(20px);
  border-radius: 32px;
  border: 1px solid rgba(255,255,255,0.8);
  box-shadow: 0 20px 60px rgba(0,0,0,0.06);

  @media (max-width: 900px) {
    flex-direction: column;
    text-align: center;
    padding: 32px 24px;
  }

  &__content {
    flex: 1;
  }

  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: $slate;
    font-size: 14px;
    font-weight: 500;
    text-decoration: none;
    margin-bottom: 20px;
    transition: color 0.2s;

    &:hover {
      color: $sky-dark;
    }
  }

  .desktop-only {
    @media (max-width: 768px) {
      display: none;
    }
  }

  &__badge {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 10px 18px;
    background: linear-gradient(135deg, $sky-light 0%, rgba($sky-dark, 0.2) 100%);
    border-radius: 50px;
    font-size: 13px;
    font-weight: 600;
    color: $sky-dark;
    margin-bottom: 20px;

    .badge-pulse {
      width: 8px;
      height: 8px;
      background: $sky-dark;
      border-radius: 50%;
      animation: pulse 2s ease-in-out infinite;
    }
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(1.2); }
  }

  &__title {
    font-size: 48px;
    font-weight: 800;
    line-height: 1.1;
    color: $color-g-21;
    margin-bottom: 16px;

    @media (max-width: 768px) {
      font-size: 36px;
    }
  }

  &__title-accent {
    background: linear-gradient(135deg, $sky-dark 0%, $sky-darker 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  &__subtitle {
    font-size: 16px;
    color: $slate;
    margin-bottom: 28px;
    max-width: 400px;

    @media (max-width: 900px) {
      margin-left: auto;
      margin-right: auto;
    }
  }

  &__stats {
    display: flex;
    align-items: center;
    gap: 24px;

    @media (max-width: 900px) {
      justify-content: center;
    }
  }

  .hero-stat {
    text-align: center;

    &__value {
      display: block;
      font-size: 28px;
      font-weight: 700;
      color: $color-g-21;

      &--success { color: $emerald; }
      &--warning { color: $amber; }
    }

    &__label {
      font-size: 13px;
      color: $slate;
    }

    &__divider {
      width: 1px;
      height: 40px;
      background: $color-g-92;
    }
  }

  &__visual {
    position: relative;
    width: 280px;
    height: 280px;
    flex-shrink: 0;

    @media (max-width: 900px) {
      width: 200px;
      height: 200px;
    }
  }
}

// AI Orb
.ai-orb {
  position: absolute;
  inset: 20px;

  .orb-ring {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    border: 2px solid transparent;

    &--1 {
      border-color: rgba($sky-dark, 0.3);
      animation: orbit1 8s linear infinite;
    }

    &--2 {
      inset: 15px;
      border-color: rgba($sky-darker, 0.3);
      animation: orbit2 12s linear infinite reverse;
    }

    &--3 {
      inset: 30px;
      border-color: rgba($sky-dark, 0.3);
      animation: orbit1 10s linear infinite;
    }
  }

  .orb-core {
    position: absolute;
    inset: 45px;
    background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    box-shadow: 0 10px 40px rgba($sky, 0.4);
  }
}

@keyframes orbit1 {
  to { transform: rotate(360deg); }
}

@keyframes orbit2 {
  to { transform: rotate(-360deg); }
}

// Floating Icons
.floating-icons {
  position: absolute;
  inset: 0;

  .float-icon {
    position: absolute;
    width: 48px;
    height: 48px;
    background: white;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8px 24px rgba(0,0,0,0.1);

    &--1 {
      top: 10px;
      right: 20px;
      color: $emerald;
      animation: floatIcon1 4s ease-in-out infinite;
    }

    &--2 {
      bottom: 40px;
      left: 0;
      color: $sky-dark;
      animation: floatIcon2 5s ease-in-out infinite;
    }

    &--3 {
      top: 50%;
      right: 0;
      color: $sky-darker;
      animation: floatIcon3 4.5s ease-in-out infinite;
    }
  }
}

@keyframes floatIcon1 {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes floatIcon2 {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

@keyframes floatIcon3 {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}

// Bento Grid
.bento-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;

  @media (max-width: 1100px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
}

// Bento Card
.bento-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.04);
  padding: 24px;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
  }

  &--full {
    grid-column: 1 / -1;
  }
}

// Stats Cards
.stats-card {
  display: flex;
  align-items: center;
  gap: 16px;

  &__icon {
    width: 56px;
    height: 56px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__content {
    flex: 1;
  }

  &__value {
    display: block;
    font-size: 28px;
    font-weight: 700;
    color: $color-g-21;
  }

  &__label {
    font-size: 13px;
    color: $slate;
  }

  &--safe {
    .stats-card__icon {
      background: linear-gradient(135deg, $emerald-light 0%, rgba($emerald, 0.2) 100%);
      color: $emerald;
    }
  }

  &--warning {
    .stats-card__icon {
      background: linear-gradient(135deg, $amber-light 0%, rgba($amber, 0.2) 100%);
      color: $amber;
    }
  }

  &--critical {
    .stats-card__icon {
      background: linear-gradient(135deg, $rose-light 0%, rgba($rose, 0.2) 100%);
      color: $rose;
    }
  }

  &--credits {
    .stats-card__icon {
      background: linear-gradient(135deg, $violet-light 0%, rgba($violet, 0.2) 100%);
      color: $violet;
    }
  }
}

// Card Header
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  &__left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;

    &--indigo {
      background: $sky-light;
      color: $sky-dark;
    }
  }

  h3 {
    font-size: 16px;
    font-weight: 600;
    color: $color-g-21;
  }
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid $color-g-92;
  border-radius: 10px;
  font-size: 13px;
  color: $color-g-54;
  background: white;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: $sky-dark;
  }
}

// Empty State
.empty-state {
  text-align: center;
  padding: 60px 20px;

  &__icon {
    width: 80px;
    height: 80px;
    background: linear-gradient(135deg, $sky-light 0%, rgba($sky-dark, 0.2) 100%);
    border-radius: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 20px;
    color: $sky-dark;
  }

  h4 {
    font-size: 18px;
    font-weight: 600;
    color: $color-g-21;
    margin-bottom: 8px;
  }

  p {
    font-size: 14px;
    color: $slate;
    margin-bottom: 24px;
  }
}

.primary-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba($sky-dark, 0.3);
  }
}

// Analysis List
.analysis-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.analysis-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: $color-g-97;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba($sky-dark, 0.05);
    transform: translateX(4px);

    .chevron {
      color: $sky-dark;
    }
  }

  &__left {
    display: flex;
    align-items: center;
    gap: 16px;
    flex: 1;
    min-width: 0;
  }

  &__right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
    flex-shrink: 0;
    margin-left: 16px;
  }
}

.analysis-avatar {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &.risk--low {
    background: linear-gradient(135deg, $emerald-light 0%, rgba($emerald, 0.2) 100%);
    color: $emerald;
  }

  &.risk--moderate {
    background: linear-gradient(135deg, $sky-light 0%, rgba($sky-dark, 0.2) 100%);
    color: $sky-dark;
  }

  &.risk--high {
    background: linear-gradient(135deg, $amber-light 0%, rgba($amber, 0.2) 100%);
    color: $amber;
  }

  &.risk--critical {
    background: linear-gradient(135deg, $rose-light 0%, rgba($rose, 0.2) 100%);
    color: $rose;
  }
}

.analysis-info {
  flex: 1;
  min-width: 0;
}

.analysis-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
  flex-wrap: wrap;
}

.analysis-patient {
  font-size: 15px;
  font-weight: 600;
  color: $color-g-21;
}

.risk-badge {
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;

  &--success {
    background: rgba($emerald, 0.1);
    color: $emerald;
  }

  &--warning {
    background: rgba($amber, 0.1);
    color: $amber;
  }

  &--danger {
    background: rgba($rose, 0.1);
    color: $rose;
  }

  &--critical {
    background: rgba($rose, 0.15);
    color: darken($rose, 5%);
  }

  &--default {
    background: rgba($slate, 0.1);
    color: $slate;
  }
}

.analysis-summary {
  font-size: 13px;
  color: $slate;
  margin-bottom: 8px;

  .alert-count {
    color: $amber;
    font-weight: 500;
  }
}

.analysis-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;

  &--safe {
    background: rgba($emerald, 0.1);
    color: $emerald;
  }

  &--critical {
    background: rgba($rose, 0.1);
    color: $rose;
  }

  &--warning {
    background: rgba($amber, 0.1);
    color: $amber;
  }

  &--standalone {
    background: rgba($sky-dark, 0.1);
    color: $sky-dark;
  }

  &--linked {
    background: rgba($violet, 0.1);
    color: $violet;
  }
}

.analysis-date {
  font-size: 13px;
  font-weight: 500;
  color: $color-g-36;
}

.analysis-time {
  font-size: 12px;
  color: $slate;
}

.chevron {
  color: $color-g-67;
  transition: color 0.2s;
}

// Pagination
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid $color-g-92;
}

.pagination-btn {
  width: 36px;
  height: 36px;
  border: 1px solid $color-g-92;
  background: white;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $color-g-54;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    border-color: $sky-dark;
    color: $sky-dark;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.pagination-info {
  font-size: 13px;
  color: $slate;
}
</style>
