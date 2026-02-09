<template>
  <div class="rxgpt-page">
    <!-- Mobile Header -->
    <header class="mobile-header">
      <button class="menu-btn" @click="$emit('openSideNav')">
        <v-icon name="hi-menu-alt-2" scale="1.2" />
      </button>
      <div class="header-logo">
        <v-icon name="bi-robot" scale="1" />
        <span>RxGPT AI</span>
      </div>
      <div></div>
    </header>

    <!-- Page Content -->
    <div class="page-content">
      <!-- Loading State -->
      <div v-if="isPageLoading" class="loading-state">
        <div class="loading-spinner">
          <div class="spinner-ring"></div>
          <v-icon name="bi-robot" scale="1.2" class="spinner-icon" />
        </div>
        <p>Loading RxGPT AI...</p>
      </div>

      <template v-else>
        <!-- Hero Section -->
        <section class="hero">
          <div class="hero__content">
            <router-link to="/app/specialist/specialist-dashboard" class="back-link desktop-only">
              <v-icon name="hi-arrow-left" scale="0.85" />
              <span>Dashboard</span>
            </router-link>
            <div class="hero__badge">
              <div class="badge-pulse"></div>
              <v-icon name="bi-robot" />
              <span>AI Clinical Decision Support</span>
            </div>
            <h1 class="hero__title">
              RxGPT<br/>
              <span class="hero__title-accent">Quick Analysis</span>
            </h1>
            <p class="hero__subtitle">
              AI-powered medication safety analysis and evidence-based recommendations.
            </p>
            <div class="hero__stats">
              <div class="hero-stat">
                <span class="hero-stat__value">{{ stats.total_analyses || 0 }}</span>
                <span class="hero-stat__label">Analyses</span>
              </div>
              <div class="hero-stat__divider"></div>
              <div class="hero-stat">
                <span class="hero-stat__value hero-stat__value--success">{{ stats.safe_prescriptions || 0 }}</span>
                <span class="hero-stat__label">Safe</span>
              </div>
              <div class="hero-stat__divider"></div>
              <div class="hero-stat">
                <span class="hero-stat__value hero-stat__value--accent">{{ credits?.available ?? '—' }}</span>
                <span class="hero-stat__label">Credits</span>
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
        <section class="bento">
          <!-- Quick Analysis Form -->
          <div class="bento__card bento__card--form">
            <div class="card-header">
              <div class="card-header__icon card-header__icon--indigo">
                <v-icon name="bi-robot" scale="0.9" />
              </div>
              <div>
                <h3 class="card-header__title">New Analysis</h3>
                <p class="card-header__subtitle">Enter a diagnosis to get AI-powered medication recommendations</p>
              </div>
            </div>
            <QuickAnalysisForm :isSubmitting="isAnalyzing" @submit="runAnalysis" />
          </div>

          <!-- Right Column -->
          <div class="bento__side">
            <!-- Recent Analyses -->
            <div class="bento__card bento__card--recent">
              <div class="card-header">
                <div class="card-header__icon card-header__icon--emerald">
                  <v-icon name="hi-clock" scale="0.9" />
                </div>
                <h3 class="card-header__title">Recent Analyses</h3>
              </div>
              <div v-if="recentAnalyses.length" class="recent-list">
                <div
                  v-for="item in recentAnalyses"
                  :key="item._id"
                  class="recent-item"
                  @click="viewAnalysis(item._id)"
                >
                  <div class="recent-item__info">
                    <span class="recent-item__diagnosis">{{ item.patient_name || item.standalone_context?.diagnosis || 'Analysis' }}</span>
                    <span class="recent-item__summary" v-if="item.clinical_summary">{{ truncateText(item.clinical_summary, 60) }}</span>
                    <span class="recent-item__date">{{ formatDate(item.created_at || item.createdAt) }}</span>
                  </div>
                  <span class="recent-item__badge" :class="getRiskBadgeClass(item.overall_risk_level)">
                    {{ item.overall_risk_level || 'safe' }}
                  </span>
                </div>
              </div>
              <div v-else class="empty-state-sm">
                <v-icon name="hi-clipboard-list" scale="1.5" class="empty-icon" />
                <p>No analyses yet</p>
              </div>
              <router-link to="/app/specialist/rxgpt/history" class="card-link">
                View All <v-icon name="hi-arrow-right" scale="0.7" />
              </router-link>
            </div>

            <!-- Credits Card -->
            <div class="bento__card bento__card--credits">
              <div class="card-header">
                <div class="card-header__icon card-header__icon--amber">
                  <v-icon name="bi-coin" scale="0.9" />
                </div>
                <h3 class="card-header__title">Credits</h3>
              </div>
              <div class="credits-display">
                <div class="credits-number">{{ credits?.available ?? '—' }}</div>
                <div class="credits-label">available</div>
                <div class="credits-meta" v-if="credits">
                  <span>{{ (stats.this_month || 0) * (settings?.credits_per_analysis || 1) }} used this month</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import apiFactory from '@/services/apiFactory';
import QuickAnalysisForm from './components/QuickAnalysisForm.vue';
import { useRxGPT, formatDate, getRiskBadgeClass } from './composables/useRxGPT';

const router = useRouter();
const { credits, settings, fetchCreditsAndSettings } = useRxGPT();

const isPageLoading = ref(true);
const isAnalyzing = ref(false);
const stats = ref({});
const recentAnalyses = ref([]);

onMounted(async () => {
  try {
    await Promise.all([
      fetchCreditsAndSettings(),
      fetchStats(),
      fetchRecentAnalyses(),
    ]);
  } finally {
    isPageLoading.value = false;
  }
});

async function fetchStats() {
  try {
    const res = await apiFactory.$_getRxGPTStats();
    stats.value = res.data?.data || res.data || {};
  } catch (e) {
    console.error('Failed to fetch stats:', e);
  }
}

async function fetchRecentAnalyses() {
  try {
    const res = await apiFactory.$_getRxGPTHistory({ page: 1, limit: 5 });
    const data = res.data?.data || res.data;
    recentAnalyses.value = data?.analyses || data?.data || [];
  } catch (e) {
    console.error('Failed to fetch recent analyses:', e);
  }
}

async function runAnalysis(payload) {
  isAnalyzing.value = true;
  try {
    const res = await apiFactory.$_rxgptStandaloneAnalyze(payload);
    const data = res.data?.data || res.data;

    // If the response has an _id, navigate to the results page
    if (data?._id) {
      router.push(`/app/specialist/rxgpt/results/${data._id}`);
    } else {
      // Store result in sessionStorage and navigate with temp key
      const key = `rxgpt_result_${Date.now()}`;
      sessionStorage.setItem(key, JSON.stringify(data));
      router.push({ name: 'RxGPTResults', params: { id: key } });
    }
  } catch (e) {
    const msg = e.response?.data?.message || 'Analysis failed. Please try again.';
    alert(msg);
  } finally {
    isAnalyzing.value = false;
  }
}

function truncateText(text, maxLen = 60) {
  if (!text || text.length <= maxLen) return text;
  const trimmed = text.substring(0, maxLen);
  const lastSpace = trimmed.lastIndexOf(' ');
  return (lastSpace > maxLen * 0.5 ? trimmed.substring(0, lastSpace) : trimmed) + '...';
}

function viewAnalysis(id) {
  router.push(`/app/specialist/rxgpt/results/${id}`);
}
</script>

<style lang="scss" scoped>
// Design Tokens (matching Pharmacy)
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

.rxgpt-page {
  width: 100%;
  min-height: 100vh;
  background: $bg;
}

// Mobile header
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

.menu-btn, .action-btn {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: none;
  background: $bg;
  color: $slate;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  &:active { background: #E2E8F0; }
}

.header-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: $navy;

  svg { color: $sky-dark; }
}

// Page content
.page-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px 32px 100px;

  @media (max-width: 768px) { padding: 16px 16px 120px; }
}

// Loading
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 16px;

  p { color: $gray; font-size: 14px; }
}

.loading-spinner {
  position: relative;
  width: 64px;
  height: 64px;
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
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: $sky;
}

@keyframes spin { to { transform: rotate(360deg); } }

// ============================================
// HERO SECTION (matches Pharmacy exactly)
// ============================================
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
  box-shadow:
    0 20px 60px rgba(2, 136, 209, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;

  @media (max-width: 768px) {
    display: flex;
    flex-direction: column;
    padding: 28px 20px 24px;
    gap: 0;
    text-align: center;
    min-height: unset;
    height: auto;
    border-radius: 20px;
    margin-bottom: 16px;
    overflow: visible;
  }

  @media (max-width: 480px) {
    padding: 24px 16px 20px;
    border-radius: 16px;
  }
}

.hero__content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  z-index: 2;

  @media (max-width: 768px) {
    width: 100%;
    align-items: center;
  }
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: none;
  border-radius: 12px;
  padding: 10px 16px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  margin-bottom: 20px;
  width: fit-content;
  text-decoration: none;
  transition: all 0.2s ease;

  &:hover { background: rgba(255, 255, 255, 0.25); }
}

.desktop-only {
  @media (max-width: 768px) { display: none !important; }
}

.hero__badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  width: fit-content;
  margin-bottom: 20px;
  position: relative;

  @media (max-width: 768px) {
    margin: 0 auto 16px;
    padding: 8px 16px;
  }

  @media (max-width: 480px) {
    padding: 6px 14px;
    margin: 0 auto 12px;
  }

  svg {
    width: 16px;
    height: 16px;
    color: white;
    margin-left: 12px;

    @media (max-width: 768px) {
      width: 14px;
      height: 14px;
      margin-left: 10px;
    }
  }

  span {
    font-size: 13px;
    font-weight: 600;
    color: white;
    letter-spacing: 0.3px;

    @media (max-width: 768px) { font-size: 12px; }
  }
}

.badge-pulse {
  position: absolute;
  left: 12px;
  width: 8px;
  height: 8px;
  background: $emerald;
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;

  &::after {
    content: '';
    position: absolute;
    inset: -4px;
    background: rgba($emerald, 0.4);
    border-radius: 50%;
    animation: pulse-ring 2s ease-out infinite;
  }

  @media (max-width: 768px) {
    left: 10px;
    width: 6px;
    height: 6px;
  }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
}

@keyframes pulse-ring {
  0% { transform: scale(1); opacity: 0.8; }
  100% { transform: scale(2.5); opacity: 0; }
}

.hero__title {
  font-size: 48px;
  font-weight: 800;
  color: white;
  line-height: 1.1;
  margin: 0 0 16px;
  letter-spacing: -1px;

  @media (max-width: 768px) {
    font-size: 32px;
    margin: 0 0 12px;
    letter-spacing: -0.5px;
    br { display: none; }
  }

  @media (max-width: 480px) {
    font-size: 28px;
    margin: 0 0 8px;
  }
}

.hero__title-accent {
  background: linear-gradient(90deg, #fff 0%, rgba(255,255,255,0.7) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;

  @media (max-width: 768px) {
    display: inline;
    margin-left: 6px;
  }
}

.hero__subtitle {
  font-size: 18px;
  color: white;
  line-height: 1.6;
  margin: 0 0 24px;
  max-width: 400px;
  opacity: 0.95;

  @media (max-width: 768px) {
    font-size: 15px;
    max-width: 100%;
    margin: 0 0 20px;
    opacity: 0.9;
    line-height: 1.5;
  }

  @media (max-width: 480px) {
    font-size: 14px;
    margin: 0 0 16px;
  }
}

.hero__stats {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  width: fit-content;

  @media (max-width: 768px) {
    width: 100%;
    justify-content: space-around;
    padding: 16px;
    gap: 8px;
    border-radius: 14px;
  }

  @media (max-width: 480px) {
    padding: 14px 12px;
    gap: 4px;
    border-radius: 12px;
  }
}

.hero-stat {
  text-align: center;
  flex: 1;

  @media (max-width: 768px) { padding: 0 4px; }
}

.hero-stat__value {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: white;
  line-height: 1;

  @media (max-width: 768px) { font-size: 22px; }
  @media (max-width: 480px) { font-size: 20px; }

  &--success { color: $emerald-light; }
  &--warning { color: $amber-light; }
  &--accent { color: rgba(255,255,255,0.9); }
}

.hero-stat__label {
  display: block;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  @media (max-width: 768px) { font-size: 11px; letter-spacing: 0.3px; }
  @media (max-width: 480px) { font-size: 10px; }
}

.hero-stat__divider {
  width: 1px;
  height: 32px;
  background: rgba(255, 255, 255, 0.2);
  flex-shrink: 0;

  @media (max-width: 768px) { height: 28px; }
}

// Hero Visual
.hero__visual {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;

  @media (max-width: 768px) { display: none; }
}

.ai-orb {
  position: relative;
  width: 200px;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.orb-ring {
  position: absolute;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.2);

  &--1 { width: 100%; height: 100%; animation: spin-slow 20s linear infinite; }
  &--2 { width: 80%; height: 80%; animation: spin-slow 15s linear infinite reverse; }
  &--3 { width: 60%; height: 60%; animation: spin-slow 10s linear infinite; }
}

.orb-core {
  width: 100px;
  height: 100px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(20px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 0 40px rgba(255, 255, 255, 0.3),
    0 0 80px rgba(79, 195, 247, 0.3);
  animation: pulse-glow 3s ease-in-out infinite;

  svg { width: 48px; height: 48px; color: white; }
}

.floating-icons {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.float-icon {
  position: absolute;
  width: 44px;
  height: 44px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: float 3s ease-in-out infinite;

  svg { width: 20px; height: 20px; color: white; }

  &--1 { top: 10%; right: 10%; animation-delay: 0s; }
  &--2 { bottom: 20%; right: 5%; animation-delay: 1s; }
  &--3 { bottom: 10%; left: 10%; animation-delay: 2s; }
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 40px rgba(255, 255, 255, 0.3), 0 0 80px rgba(79, 195, 247, 0.3); }
  50% { box-shadow: 0 0 60px rgba(255, 255, 255, 0.4), 0 0 100px rgba(79, 195, 247, 0.4); }
}

@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

// ============================================
// BENTO GRID
// ============================================
.bento {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 20px;

  @media (max-width: 900px) { grid-template-columns: 1fr; }
  @media (max-width: 768px) { gap: 16px; }
}

.bento__side {
  display: flex;
  flex-direction: column;
  gap: 20px;

  @media (max-width: 768px) { gap: 16px; }
}

.bento__card {
  @include glass-card;
  border-radius: 20px;
  padding: 20px;

  @media (max-width: 768px) {
    padding: 16px;
    border-radius: 16px;
  }
}

// Card Header
.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;

  @media (max-width: 768px) { margin-bottom: 12px; }
}

.card-header__icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-header__icon--indigo {
  background: linear-gradient(135deg, $sky-light 0%, rgba($sky, 0.2) 100%);
  color: $sky-dark;
}

.card-header__icon--emerald {
  background: linear-gradient(135deg, $emerald-light 0%, rgba($emerald, 0.2) 100%);
  color: $emerald;
}

.card-header__icon--amber {
  background: linear-gradient(135deg, $amber-light 0%, rgba($amber, 0.2) 100%);
  color: $amber;
}

.card-header__title {
  font-size: 15px;
  font-weight: 600;
  color: $navy;
  margin: 0;
}

.card-header__subtitle {
  font-size: 12px;
  color: $gray;
  margin-top: 2px;
}

// Recent analyses
.recent-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.recent-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-radius: 14px;
  background: $bg;
  border: 1px solid #E2E8F0;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: white;
    border-color: $sky-light;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
    transform: translateX(4px);
  }
}

.recent-item__info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
  overflow: hidden;
}

.recent-item__diagnosis {
  font-size: 13px;
  font-weight: 600;
  color: $navy;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.recent-item__summary {
  font-size: 11px;
  color: $gray;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.recent-item__date {
  font-size: 10px;
  color: $light-gray;
}

.recent-item__badge {
  font-size: 10px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 20px;
  text-transform: capitalize;
  flex-shrink: 0;
}

.badge--success { background: $emerald-light; color: $emerald; }
.badge--warning { background: $amber-light; color: $amber; }
.badge--danger { background: $rose-light; color: $rose; }
.badge--critical { background: $rose-light; color: darken($rose, 10%); }
.badge--default { background: #F1F5F9; color: $slate; }

.empty-state-sm {
  text-align: center;
  padding: 24px 0;
  color: $gray;

  .empty-icon { opacity: 0.3; margin-bottom: 8px; }
  p { font-size: 13px; }
}

.card-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  color: $sky-dark;
  text-decoration: none;
  padding-top: 12px;
  border-top: 1px solid #F1F5F9;

  &:hover { color: $sky-darker; }
}

// Credits
.credits-display {
  text-align: center;
  padding: 12px 0;
}

.credits-number {
  font-size: 48px;
  font-weight: 700;
  color: $navy;
}

.credits-label {
  font-size: 13px;
  color: $gray;
  font-weight: 500;
  margin-bottom: 8px;
}

.credits-meta {
  font-size: 11px;
  color: $light-gray;
}
</style>
