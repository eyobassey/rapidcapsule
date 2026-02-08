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
      <button class="back-btn" @click="$router.push('/app/specialist/pharmacy')">
        <v-icon name="hi-arrow-left" scale="1.1" />
      </button>
      <h1 class="mobile-title">RxGPT History</h1>
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
        <router-link to="/app/specialist/pharmacy" class="breadcrumb-item">
          Pharmacy
        </router-link>
        <span class="breadcrumb-separator">/</span>
        <span class="breadcrumb-current">RxGPT AI History</span>
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
            <router-link to="/app/specialist/pharmacy" class="back-link desktop-only">
              <v-icon name="hi-arrow-left" scale="0.8" />
              <span>Back to Pharmacy</span>
            </router-link>
            <div class="hero__badge">
              <div class="badge-pulse"></div>
              <v-icon name="bi-robot" />
              <span>AI-Powered Analysis</span>
            </div>
            <h1 class="hero__title">
              RxGPT<br/>
              <span class="hero__title-accent">AI History</span>
            </h1>
            <p class="hero__subtitle">
              View all AI-assisted medication analyses and safety checks.
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
                <div class="card-header__icon card-header__icon--sky">
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
              <p>AI analyses will appear here when you use RxGPT to verify prescriptions.</p>
              <button class="primary-btn" @click="$router.push('/app/specialist/pharmacy/prescriptions/new')">
                <v-icon name="hi-plus" scale="0.8" />
                Create Prescription
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
                      <span class="analysis-patient">{{ analysis.patient_name || 'Unknown Patient' }}</span>
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
                      <span v-if="analysis.prescription_id" class="tag tag--linked">
                        <v-icon name="hi-link" scale="0.6" />
                        Linked
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
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showDetailsModal" class="modal-overlay" @click.self="showDetailsModal = false">
          <div class="modal-container">
            <div class="modal-header">
              <div class="modal-header__left">
                <div class="modal-icon" :class="getRiskClass(selectedAnalysis?.overall_risk_level)">
                  <v-icon name="bi-robot" scale="1.2" />
                </div>
                <div class="modal-title">
                  <h2>AI Analysis Details</h2>
                  <span class="modal-date">{{ formatDateTime(selectedAnalysis?.created_at) }}</span>
                </div>
              </div>
              <button class="close-btn" @click="showDetailsModal = false">
                <v-icon name="hi-x" scale="1" />
              </button>
            </div>

            <div class="modal-content" v-if="selectedAnalysis">
              <!-- Risk Summary -->
              <div :class="['risk-card', `risk-card--${selectedAnalysis.overall_risk_level}`]">
                <div class="risk-card__icon">
                  <v-icon :name="getRiskIcon(selectedAnalysis.overall_risk_level)" scale="1.5" />
                </div>
                <div class="risk-card__content">
                  <span class="risk-card__label">Overall Risk Assessment</span>
                  <span class="risk-card__level">{{ formatRiskLevel(selectedAnalysis.overall_risk_level) }}</span>
                  <span class="risk-card__confidence">
                    {{ Math.round(selectedAnalysis.confidence_score * 100) }}% confidence
                  </span>
                </div>
                <div v-if="selectedAnalysis.is_safe" class="safe-badge">
                  <v-icon name="hi-check-circle" scale="0.7" />
                  Safe to Prescribe
                </div>
              </div>

              <!-- Clinical Summary -->
              <div v-if="selectedAnalysis.clinical_summary" class="section-card">
                <div class="section-card__header">
                  <v-icon name="hi-document-text" scale="0.9" />
                  <h3>Clinical Summary</h3>
                </div>
                <p class="clinical-text">{{ selectedAnalysis.clinical_summary }}</p>
              </div>

              <!-- Alerts -->
              <div v-if="selectedAnalysis.alerts?.length" class="section-card section-card--alerts">
                <div class="section-card__header">
                  <v-icon name="hi-exclamation-circle" scale="0.9" />
                  <h3>Alerts</h3>
                  <span class="count-badge">{{ selectedAnalysis.alerts.length }}</span>
                </div>
                <div class="alerts-list">
                  <div
                    v-for="(alert, index) in selectedAnalysis.alerts"
                    :key="index"
                    :class="['alert-item', `alert-item--${alert.severity}`]"
                  >
                    <div class="alert-item__icon">
                      <v-icon :name="getAlertIcon(alert.severity)" scale="0.8" />
                    </div>
                    <div class="alert-item__content">
                      <span class="alert-item__type">{{ formatAlertType(alert.type) }}</span>
                      <span class="alert-item__drug">{{ alert.drug_name }}</span>
                      <p class="alert-item__message">{{ alert.message }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Medications Analyzed -->
              <div v-if="selectedAnalysis.drugs_analyzed?.length" class="section-card">
                <div class="section-card__header">
                  <v-icon name="ri-capsule-line" scale="0.9" />
                  <h3>Medications Analyzed</h3>
                  <span class="count-badge">{{ selectedAnalysis.drugs_analyzed.length }}</span>
                </div>
                <div class="drugs-grid">
                  <div
                    v-for="(drug, index) in selectedAnalysis.drugs_analyzed"
                    :key="index"
                    :class="['drug-item', { 'drug-item--appropriate': drug.is_appropriate }]"
                  >
                    <div class="drug-item__icon">
                      <v-icon v-if="drug.is_appropriate" name="hi-check-circle" scale="0.8" />
                      <v-icon v-else name="hi-exclamation" scale="0.8" />
                    </div>
                    <div class="drug-item__info">
                      <span class="drug-item__name">{{ drug.drug_name }}</span>
                      <span class="drug-item__strength">{{ drug.strength }}</span>
                      <span class="drug-item__dosage">{{ drug.dosage }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Linked Prescription -->
              <div v-if="selectedAnalysis.prescription_id" class="section-card section-card--linked">
                <div class="section-card__header">
                  <v-icon name="hi-link" scale="0.9" />
                  <h3>Linked Prescription</h3>
                </div>
                <button class="view-prescription-btn" @click="viewLinkedPrescription(selectedAnalysis.prescription_id)">
                  <v-icon name="hi-document-text" scale="0.8" />
                  View Prescription
                  <v-icon name="hi-arrow-right" scale="0.7" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toast-notification';
import apiFactory from '@/services/apiFactory';

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

function viewLinkedPrescription(prescriptionId) {
  showDetailsModal.value = false;
  router.push(`/app/specialist/pharmacy/prescriptions/${prescriptionId}`);
}

function getRiskClass(level) {
  if (!level) return 'unknown';
  const l = level.toLowerCase();
  if (l === 'critical') return 'critical';
  if (l === 'high') return 'high';
  if (l === 'moderate') return 'moderate';
  return 'low';
}

function getRiskBadgeClass(level) {
  return `risk-badge--${getRiskClass(level)}`;
}

function getRiskIcon(level) {
  const riskClass = getRiskClass(level);
  const icons = {
    critical: 'hi-exclamation-circle',
    high: 'hi-exclamation',
    moderate: 'hi-information-circle',
    low: 'hi-shield-check',
    unknown: 'hi-question-mark-circle',
  };
  return icons[riskClass] || 'hi-shield-check';
}

function formatRiskLevel(level) {
  if (!level) return 'Unknown';
  return level.charAt(0).toUpperCase() + level.slice(1) + ' Risk';
}

function getAlertIcon(severity) {
  const icons = {
    critical: 'hi-exclamation-circle',
    warning: 'hi-exclamation',
    info: 'hi-information-circle',
  };
  return icons[severity] || 'hi-information-circle';
}

function formatAlertType(type) {
  if (!type) return 'Alert';
  const types = {
    allergy: 'Allergy Alert',
    interaction: 'Drug Interaction',
    contraindication: 'Contraindication',
    dosage: 'Dosage Warning',
    age: 'Age-Related',
    pregnancy: 'Pregnancy Warning',
  };
  return types[type] || type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function formatDate(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(date) {
  if (!date) return '';
  return new Date(date).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateTime(date) {
  if (!date) return '';
  return `${formatDate(date)} at ${formatTime(date)}`;
}
</script>

<style scoped lang="scss">
// Colors
$sky: #4FC3F7;
$sky-light: #E1F5FE;
$sky-dark: #0288D1;
$emerald: #10B981;
$emerald-light: #D1FAE5;
$amber: #F59E0B;
$amber-light: #FEF3C7;
$violet: #8B5CF6;
$violet-light: #EDE9FE;
$rose: #F43F5E;
$rose-light: #FFE4E6;
$slate: #64748B;

// Grayscale
$color-g-21: #21262D;
$color-g-36: #363B44;
$color-g-54: #545961;
$color-g-67: #676C75;
$color-g-92: #E8E9EB;
$color-g-97: #F5F6F7;

.rxgpt-history-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #fafbfc 0%, #f0f4f8 100%);
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
    opacity: 0.4;

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
      background: $violet;
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
    border-top-color: $sky;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .spinner-icon {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $sky;
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
    background: linear-gradient(135deg, $sky-light 0%, rgba($sky, 0.2) 100%);
    border-radius: 50px;
    font-size: 13px;
    font-weight: 600;
    color: $sky-dark;
    margin-bottom: 20px;

    .badge-pulse {
      width: 8px;
      height: 8px;
      background: $sky;
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
    background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
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
      border-color: rgba($sky, 0.3);
      animation: orbit1 8s linear infinite;
    }

    &--2 {
      inset: 15px;
      border-color: rgba($violet, 0.3);
      animation: orbit2 12s linear infinite reverse;
    }

    &--3 {
      inset: 30px;
      border-color: rgba($sky, 0.3);
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
      color: $sky;
      animation: floatIcon2 5s ease-in-out infinite;
    }

    &--3 {
      top: 50%;
      right: 0;
      color: $violet;
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

    &--sky {
      background: linear-gradient(135deg, $sky-light 0%, rgba($sky, 0.2) 100%);
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
    border-color: $sky;
  }
}

// Empty State
.empty-state {
  text-align: center;
  padding: 60px 20px;

  &__icon {
    width: 80px;
    height: 80px;
    background: linear-gradient(135deg, $sky-light 0%, rgba($sky, 0.2) 100%);
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
    box-shadow: 0 8px 24px rgba($sky, 0.3);
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
    background: rgba($sky, 0.05);
    transform: translateX(4px);

    .chevron {
      color: $sky-dark;
    }
  }

  &__left {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  &__right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
  }
}

.analysis-avatar {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;

  &.low {
    background: linear-gradient(135deg, $emerald-light 0%, rgba($emerald, 0.2) 100%);
    color: $emerald;
  }

  &.moderate {
    background: linear-gradient(135deg, $sky-light 0%, rgba($sky, 0.2) 100%);
    color: $sky-dark;
  }

  &.high {
    background: linear-gradient(135deg, $amber-light 0%, rgba($amber, 0.2) 100%);
    color: $amber;
  }

  &.critical {
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

  &--low {
    background: rgba($emerald, 0.1);
    color: $emerald;
  }

  &--moderate {
    background: rgba($sky, 0.1);
    color: $sky-dark;
  }

  &--high {
    background: rgba($amber, 0.1);
    color: $amber;
  }

  &--critical {
    background: rgba($rose, 0.1);
    color: $rose;
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
    border-color: $sky;
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

// Modal Styles
.modal-overlay {
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

.modal-container {
  background: #fff;
  border-radius: 24px;
  width: 100%;
  max-width: 700px;
  max-height: 85vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba($color-g-92, 0.5);
  background: linear-gradient(135deg, rgba($sky, 0.05) 0%, rgba($sky-dark, 0.05) 100%);

  &__left {
    display: flex;
    align-items: center;
    gap: 14px;
  }
}

.modal-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;

  &.low {
    background: linear-gradient(135deg, $emerald-light 0%, rgba($emerald, 0.2) 100%);
    color: $emerald;
  }

  &.moderate {
    background: linear-gradient(135deg, $sky-light 0%, rgba($sky, 0.2) 100%);
    color: $sky-dark;
  }

  &.high {
    background: linear-gradient(135deg, $amber-light 0%, rgba($amber, 0.2) 100%);
    color: $amber;
  }

  &.critical {
    background: linear-gradient(135deg, $rose-light 0%, rgba($rose, 0.2) 100%);
    color: $rose;
  }
}

.modal-title {
  h2 {
    font-size: 18px;
    font-weight: 700;
    color: $color-g-21;
    margin-bottom: 2px;
  }
}

.modal-date {
  font-size: 13px;
  color: $color-g-54;
}

.close-btn {
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
  transition: all 0.2s;

  &:hover {
    background: rgba($sky, 0.1);
    color: $sky-dark;
  }
}

.modal-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

// Risk Card
.risk-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border-radius: 16px;
  position: relative;

  &--low {
    background: linear-gradient(135deg, $emerald-light 0%, rgba($emerald, 0.15) 100%);
    border: 1px solid rgba($emerald, 0.2);
    .risk-card__icon { background: rgba($emerald, 0.15); color: $emerald; }
    .risk-card__level { color: $emerald; }
  }

  &--moderate {
    background: linear-gradient(135deg, $sky-light 0%, rgba($sky, 0.15) 100%);
    border: 1px solid rgba($sky, 0.2);
    .risk-card__icon { background: rgba($sky, 0.15); color: $sky-dark; }
    .risk-card__level { color: $sky-dark; }
  }

  &--high {
    background: linear-gradient(135deg, $amber-light 0%, rgba($amber, 0.15) 100%);
    border: 1px solid rgba($amber, 0.2);
    .risk-card__icon { background: rgba($amber, 0.15); color: $amber; }
    .risk-card__level { color: darken($amber, 10%); }
  }

  &--critical {
    background: linear-gradient(135deg, $rose-light 0%, rgba($rose, 0.15) 100%);
    border: 1px solid rgba($rose, 0.2);
    .risk-card__icon { background: rgba($rose, 0.15); color: $rose; }
    .risk-card__level { color: $rose; }
  }

  &__icon {
    width: 56px;
    height: 56px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__content {
    flex: 1;
  }

  &__label {
    display: block;
    font-size: 11px;
    color: $color-g-54;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    margin-bottom: 4px;
  }

  &__level {
    display: block;
    font-size: 18px;
    font-weight: 700;
    margin-bottom: 4px;
  }

  &__confidence {
    font-size: 13px;
    color: $color-g-54;
  }
}

.safe-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: $emerald;
  color: white;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

// Section Card
.section-card {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba($color-g-92, 0.5);
  border-radius: 16px;
  padding: 20px;

  &__header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;

    svg {
      color: $sky-dark;
    }

    h3 {
      font-size: 15px;
      font-weight: 600;
      color: $color-g-21;
      flex: 1;
    }
  }
}

.count-badge {
  padding: 4px 10px;
  background: rgba($sky, 0.1);
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  color: $sky-dark;
}

.clinical-text {
  font-size: 14px;
  line-height: 1.6;
  color: $color-g-36;
}

// Alerts List
.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.alert-item {
  display: flex;
  gap: 12px;
  padding: 14px;
  border-radius: 12px;

  &--critical {
    background: rgba($rose, 0.08);
    border: 1px solid rgba($rose, 0.15);
    .alert-item__icon { color: $rose; }
    .alert-item__type { color: $rose; }
  }

  &--warning {
    background: rgba($amber, 0.08);
    border: 1px solid rgba($amber, 0.15);
    .alert-item__icon { color: $amber; }
    .alert-item__type { color: darken($amber, 10%); }
  }

  &--info {
    background: rgba($sky, 0.08);
    border: 1px solid rgba($sky, 0.15);
    .alert-item__icon { color: $sky-dark; }
    .alert-item__type { color: $sky-dark; }
  }

  &__icon {
    flex-shrink: 0;
    margin-top: 2px;
  }

  &__content {
    flex: 1;
  }

  &__type {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  &__drug {
    display: block;
    font-size: 14px;
    font-weight: 600;
    color: $color-g-21;
    margin: 4px 0;
  }

  &__message {
    font-size: 13px;
    line-height: 1.5;
    color: $color-g-54;
    margin: 0;
  }
}

// Drugs Grid
.drugs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.drug-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: $color-g-97;
  border-radius: 12px;
  border: 1px solid transparent;

  &--appropriate {
    border-color: rgba($emerald, 0.2);
    background: rgba($emerald, 0.05);

    .drug-item__icon {
      color: $emerald;
    }
  }

  &__icon {
    color: $amber;
  }

  &__info {
    flex: 1;
    min-width: 0;
  }

  &__name {
    display: block;
    font-size: 14px;
    font-weight: 600;
    color: $color-g-21;
  }

  &__strength {
    display: block;
    font-size: 12px;
    color: $sky-dark;
  }

  &__dosage {
    display: block;
    font-size: 11px;
    color: $slate;
  }
}

.view-prescription-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: linear-gradient(135deg, $violet-light 0%, rgba($violet, 0.2) 100%);
  color: $violet;
  border: 1px solid rgba($violet, 0.2);
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba($violet, 0.15);
  }
}

// Modal Transition
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: all 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;

  .modal-container {
    transform: scale(0.95) translateY(20px);
  }
}
</style>
