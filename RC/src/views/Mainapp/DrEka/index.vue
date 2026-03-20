<template>
  <div class="dr-eka-page">
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-bg">
        <div class="hero-gradient"></div>
        <div class="hero-pattern"></div>
      </div>
      <div class="hero-content">
        <button class="back-btn" @click="goBack">
          <v-icon name="hi-arrow-left" scale="1" />
        </button>
        <div class="hero-info">
          <div class="doctor-avatar">
            <div class="avatar-ring"></div>
            <div class="avatar-inner">
              <v-icon name="gi-stethoscope" scale="1.8" />
            </div>
            <div class="avatar-pulse"></div>
          </div>
          <div class="doctor-details">
            <h1>Dr. Eka</h1>
            <p class="subtitle">Your Personal AI Physician</p>
            <p v-if="todaySummary" class="summary-text">{{ todaySummary }}</p>
            <p v-else class="summary-text">Monitoring your health around the clock</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Tab Bar -->
    <section class="tab-section">
      <div class="tab-bar">
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'today' }"
          @click="activeTab = 'today'"
        >
          <v-icon name="hi-sun" scale="0.85" />
          Today's Digest
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'history' }"
          @click="switchToHistory"
        >
          <v-icon name="hi-clock" scale="0.85" />
          History
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'weekly' }"
          @click="switchToWeekly"
        >
          <v-icon name="hi-chart-bar" scale="0.85" />
          Weekly Reports
        </button>
      </div>
    </section>

    <!-- TODAY'S DIGEST TAB -->
    <section v-if="activeTab === 'today'" class="tab-content">
      <!-- Loading State -->
      <div v-if="loadingDigest" class="loading-state">
        <div class="shimmer-card" v-for="i in 3" :key="i">
          <div class="shimmer-bar shimmer-short"></div>
          <div class="shimmer-bar shimmer-long"></div>
          <div class="shimmer-bar shimmer-medium"></div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="!todayDigest || !todayDigest.items || todayDigest.items.length === 0" class="empty-state">
        <div class="empty-icon">
          <v-icon name="gi-stethoscope" scale="3" />
        </div>
        <h3>No Digest for Today</h3>
        <p>Dr. Eka hasn't prepared your daily health digest yet. Generate one now to get personalized insights.</p>
        <button class="generate-btn" @click="generateDigest" :disabled="generating">
          <v-icon name="hi-sparkles" scale="0.9" />
          {{ generating ? 'Generating...' : 'Generate Digest' }}
        </button>
      </div>

      <!-- Digest Items -->
      <div v-else class="digest-content">
        <div
          v-for="(item, index) in todayDigest.items"
          :key="index"
          class="digest-card"
          :class="[`priority-${item.priority || 'medium'}`]"
        >
          <div class="digest-card-accent" :class="`accent-${item.priority || 'medium'}`"></div>
          <div class="digest-card-body">
            <div class="digest-card-header">
              <span class="type-badge" :class="`badge-${item.type || 'observation'}`">
                <v-icon :name="getTypeIcon(item.type)" scale="0.7" />
                {{ formatType(item.type) }}
              </span>
              <span v-if="item.priority" class="priority-indicator" :class="`priority-${item.priority}`">
                {{ item.priority }}
              </span>
            </div>
            <h3 class="digest-card-title">{{ item.title }}</h3>
            <p class="digest-card-content">{{ item.content }}</p>
            <button
              v-if="item.action_text && item.action_url"
              class="action-btn"
              @click="handleAction(item)"
            >
              {{ item.action_text }}
              <v-icon name="hi-arrow-right" scale="0.7" />
            </button>
          </div>
        </div>

        <!-- Health Joke -->
        <div v-if="todayDigest.health_joke" class="joke-card">
          <div class="joke-icon">
            <v-icon name="hi-emoji-happy" scale="1.3" />
          </div>
          <div class="joke-content">
            <span class="joke-label">Dr. Eka's Health Humor</span>
            <p class="joke-text">{{ todayDigest.health_joke }}</p>
          </div>
        </div>

        <!-- Digest Meta -->
        <div v-if="todayDigest.generated_at" class="digest-meta">
          <v-icon name="hi-clock" scale="0.7" />
          <span>Generated {{ formatTimeAgo(todayDigest.generated_at) }}</span>
        </div>
      </div>
    </section>

    <!-- HISTORY TAB -->
    <section v-if="activeTab === 'history'" class="tab-content">
      <div v-if="loadingHistory" class="loading-state">
        <div class="shimmer-card" v-for="i in 3" :key="i">
          <div class="shimmer-bar shimmer-short"></div>
          <div class="shimmer-bar shimmer-long"></div>
        </div>
      </div>

      <div v-else-if="digestHistory.length === 0" class="empty-state">
        <div class="empty-icon">
          <v-icon name="hi-clock" scale="3" />
        </div>
        <h3>No Past Digests</h3>
        <p>Your digest history will appear here once Dr. Eka starts preparing your daily reports.</p>
      </div>

      <div v-else class="history-content">
        <div
          v-for="digest in digestHistory"
          :key="digest._id"
          class="history-card"
          :class="{ expanded: expandedDigestId === digest._id }"
        >
          <button class="history-card-header" @click="toggleDigest(digest._id)">
            <div class="history-date-badge">
              <v-icon name="hi-calendar" scale="0.85" />
              <span>{{ formatDate(digest.date || digest.generated_at || digest.created_at) }}</span>
            </div>
            <div class="history-card-meta">
              <span class="item-count">{{ digest.items?.length || 0 }} items</span>
              <v-icon
                name="hi-chevron-down"
                scale="0.8"
                class="expand-icon"
                :class="{ rotated: expandedDigestId === digest._id }"
              />
            </div>
          </button>

          <div v-if="expandedDigestId === digest._id" class="history-card-body">
            <div
              v-for="(item, idx) in digest.items"
              :key="idx"
              class="history-item"
              :class="`priority-${item.priority || 'medium'}`"
            >
              <div class="history-item-dot" :class="`dot-${item.priority || 'medium'}`"></div>
              <div class="history-item-content">
                <span class="history-item-type">{{ formatType(item.type) }}</span>
                <h4>{{ item.title }}</h4>
                <p>{{ item.content }}</p>
              </div>
            </div>

            <div v-if="digest.health_joke" class="history-joke">
              <v-icon name="hi-emoji-happy" scale="0.8" />
              <span>{{ digest.health_joke }}</span>
            </div>
          </div>
        </div>

        <!-- Load More -->
        <div v-if="historyHasMore" class="load-more">
          <button class="load-more-btn" @click="loadMoreHistory" :disabled="loadingMoreHistory">
            {{ loadingMoreHistory ? 'Loading...' : 'Load More' }}
          </button>
        </div>
      </div>
    </section>

    <!-- WEEKLY REPORTS TAB -->
    <section v-if="activeTab === 'weekly'" class="tab-content">
      <div v-if="loadingWeekly" class="loading-state">
        <div class="shimmer-card" v-for="i in 2" :key="i">
          <div class="shimmer-bar shimmer-short"></div>
          <div class="shimmer-bar shimmer-long"></div>
          <div class="shimmer-bar shimmer-medium"></div>
        </div>
      </div>

      <div v-else-if="weeklyReports.length === 0" class="empty-state">
        <div class="empty-icon">
          <v-icon name="hi-chart-bar" scale="3" />
        </div>
        <h3>No Weekly Reports</h3>
        <p>Dr. Eka will compile your weekly health reports here. Generate one to get started.</p>
        <button class="generate-btn" @click="generateWeeklyReport" :disabled="generatingWeekly">
          <v-icon name="hi-sparkles" scale="0.9" />
          {{ generatingWeekly ? 'Generating...' : 'Generate Weekly Report' }}
        </button>
      </div>

      <div v-else class="weekly-content">
        <div
          v-for="report in weeklyReports"
          :key="report._id"
          class="weekly-card"
          :class="{ expanded: expandedReportId === report._id }"
        >
          <button class="weekly-card-header" @click="toggleReport(report._id)">
            <div class="weekly-header-left">
              <div class="weekly-date">
                <v-icon name="hi-calendar" scale="0.85" />
                <span>{{ formatWeekRange(report) }}</span>
              </div>
              <div v-if="report.health_score !== undefined && report.health_score !== null" class="weekly-score" :class="getScoreClass(report.health_score)">
                <span class="score-value">{{ report.health_score }}</span>
                <span class="score-label">Score</span>
              </div>
            </div>
            <v-icon
              name="hi-chevron-down"
              scale="0.8"
              class="expand-icon"
              :class="{ rotated: expandedReportId === report._id }"
            />
          </button>

          <div v-if="expandedReportId === report._id" class="weekly-card-body">
            <!-- Summary Narrative -->
            <div v-if="report.summary" class="weekly-section">
              <h4 class="section-title">
                <v-icon name="hi-document-text" scale="0.85" />
                Summary
              </h4>
              <p class="narrative-text">{{ report.summary }}</p>
            </div>

            <!-- Health Score Detail -->
            <div v-if="report.health_score !== undefined && report.health_score !== null" class="weekly-section">
              <h4 class="section-title">
                <v-icon name="hi-heart" scale="0.85" />
                Health Score
              </h4>
              <div class="score-display">
                <div class="score-ring" :class="getScoreClass(report.health_score)">
                  <span>{{ report.health_score }}</span>
                </div>
                <div class="score-details">
                  <span class="score-status">{{ getScoreLabel(report.health_score) }}</span>
                  <p v-if="report.score_explanation">{{ report.score_explanation }}</p>
                </div>
              </div>
            </div>

            <!-- Medications Section -->
            <div v-if="report.medications && report.medications.length > 0" class="weekly-section">
              <h4 class="section-title">
                <v-icon name="ri-capsule-line" scale="0.85" />
                Medications
              </h4>
              <div class="medications-list">
                <div v-for="(med, idx) in report.medications" :key="idx" class="medication-item">
                  <div class="med-icon">
                    <v-icon name="ri-capsule-line" scale="0.75" />
                  </div>
                  <div class="med-details">
                    <span class="med-name">{{ med.name }}</span>
                    <span v-if="med.dosage" class="med-dosage">{{ med.dosage }}</span>
                    <span v-if="med.note" class="med-note">{{ med.note }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Recommendations -->
            <div v-if="report.recommendations && report.recommendations.length > 0" class="weekly-section">
              <h4 class="section-title">
                <v-icon name="hi-light-bulb" scale="0.85" />
                Recommendations
              </h4>
              <div class="recommendations-list">
                <div v-for="(rec, idx) in report.recommendations" :key="idx" class="rec-item">
                  <div class="rec-content">
                    <h5>{{ rec.title || rec.text }}</h5>
                    <p v-if="rec.description">{{ rec.description }}</p>
                  </div>
                  <button
                    v-if="rec.action_text && rec.action_url"
                    class="rec-action"
                    @click="handleAction(rec)"
                  >
                    {{ rec.action_text }}
                    <v-icon name="hi-arrow-right" scale="0.65" />
                  </button>
                </div>
              </div>
            </div>

            <!-- Health News -->
            <div v-if="report.health_news && report.health_news.length > 0" class="weekly-section">
              <h4 class="section-title">
                <v-icon name="hi-globe" scale="0.85" />
                Health News
              </h4>
              <div class="news-list">
                <div v-for="(news, idx) in report.health_news" :key="idx" class="news-item">
                  <h5>{{ news.title || news.headline }}</h5>
                  <p v-if="news.summary">{{ news.summary }}</p>
                  <span v-if="news.relevance" class="news-relevance">
                    <v-icon name="hi-information-circle" scale="0.65" />
                    {{ news.relevance }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Doctor's Note -->
            <div v-if="report.doctors_note" class="doctors-note">
              <div class="note-header">
                <div class="note-avatar">
                  <v-icon name="gi-stethoscope" scale="1" />
                </div>
                <div>
                  <span class="note-label">Dr. Eka's Note</span>
                  <span class="note-date">{{ formatDate(report.generated_at || report.created_at) }}</span>
                </div>
              </div>
              <p class="note-text">{{ report.doctors_note }}</p>
              <div class="note-signature">
                <span>-- Dr. Eka, AI Physician</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Load More -->
        <div v-if="weeklyHasMore" class="load-more">
          <button class="load-more-btn" @click="loadMoreWeekly" :disabled="loadingMoreWeekly">
            {{ loadingMoreWeekly ? 'Loading...' : 'Load More' }}
          </button>
        </div>
      </div>
    </section>

    <!-- Medical Disclaimer -->
    <section class="disclaimer-section">
      <v-icon name="hi-information-circle" scale="0.9" />
      <p>Dr. Eka provides AI-generated health insights for informational purposes only. These do not constitute medical advice. Always consult a qualified healthcare professional for medical decisions.</p>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const $http = inject('$_HTTP');

// State
const activeTab = ref('today');
const loadingDigest = ref(true);
const loadingHistory = ref(false);
const loadingWeekly = ref(false);
const loadingMoreHistory = ref(false);
const loadingMoreWeekly = ref(false);
const generating = ref(false);
const generatingWeekly = ref(false);

const todayDigest = ref(null);
const digestHistory = ref([]);
const weeklyReports = ref([]);
const expandedDigestId = ref(null);
const expandedReportId = ref(null);
const historyPage = ref(1);
const weeklyPage = ref(1);
const historyHasMore = ref(false);
const weeklyHasMore = ref(false);

// Computed
const todaySummary = computed(() => {
  if (!todayDigest.value) return '';
  if (todayDigest.value.summary) return todayDigest.value.summary;
  if (todayDigest.value.items?.length > 0) {
    return `${todayDigest.value.items.length} health insights for you today`;
  }
  return '';
});

// Type helpers
const getTypeIcon = (type) => {
  const iconMap = {
    observation: 'hi-eye',
    recommendation: 'hi-light-bulb',
    medication: 'ri-capsule-line',
    reminder: 'hi-bell',
    alert: 'hi-exclamation',
    milestone: 'hi-star',
    vital: 'hi-heart',
    lifestyle: 'fa-sun',
    nutrition: 'fa-apple-alt',
    fitness: 'hi-lightning-bolt',
    mental_health: 'hi-emoji-happy',
  };
  return iconMap[type] || 'hi-clipboard-list';
};

const formatType = (type) => {
  if (!type) return 'Insight';
  const typeMap = {
    observation: 'Observation',
    recommendation: 'Recommendation',
    medication: 'Medication',
    reminder: 'Reminder',
    alert: 'Alert',
    milestone: 'Milestone',
    vital: 'Vital Sign',
    lifestyle: 'Lifestyle',
    nutrition: 'Nutrition',
    fitness: 'Fitness',
    mental_health: 'Mental Health',
  };
  return typeMap[type] || type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ');
};

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateStr);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatWeekRange = (report) => {
  if (report.week_start && report.week_end) {
    const start = new Date(report.week_start);
    const end = new Date(report.week_end);
    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${startStr} - ${endStr}`;
  }
  return formatDate(report.generated_at || report.created_at);
};

const getScoreClass = (score) => {
  if (score >= 80) return 'score-excellent';
  if (score >= 60) return 'score-good';
  if (score >= 40) return 'score-fair';
  return 'score-low';
};

const getScoreLabel = (score) => {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Needs Attention';
};

// Data fetching
const loadTodayDigest = async () => {
  loadingDigest.value = true;
  try {
    const res = await $http.$_getDrEkaDigest();
    const data = res?.data?.data || res?.data;
    todayDigest.value = data || null;
  } catch (error) {
    console.error('Error loading today\'s digest:', error);
    todayDigest.value = null;
  } finally {
    loadingDigest.value = false;
  }
};

const generateDigest = async () => {
  generating.value = true;
  try {
    await $http.$_generateDrEkaDigest();
    await loadTodayDigest();
  } catch (error) {
    console.error('Error generating digest:', error);
  } finally {
    generating.value = false;
  }
};

const loadDigestHistory = async () => {
  loadingHistory.value = true;
  historyPage.value = 1;
  try {
    const res = await $http.$_getDrEkaDigestHistory({ page: 1, limit: 10 });
    const data = res?.data?.data || res?.data;
    digestHistory.value = data?.digests || data?.items || (Array.isArray(data) ? data : []);
    historyHasMore.value = (data?.page < data?.pages) || (data?.page < data?.totalPages) || false;
  } catch (error) {
    console.error('Error loading digest history:', error);
    digestHistory.value = [];
  } finally {
    loadingHistory.value = false;
  }
};

const loadMoreHistory = async () => {
  loadingMoreHistory.value = true;
  try {
    historyPage.value++;
    const res = await $http.$_getDrEkaDigestHistory({ page: historyPage.value, limit: 10 });
    const data = res?.data?.data || res?.data;
    const newItems = data?.digests || data?.items || (Array.isArray(data) ? data : []);
    digestHistory.value = [...digestHistory.value, ...newItems];
    historyHasMore.value = (data?.page < data?.pages) || (data?.page < data?.totalPages) || false;
  } catch (error) {
    console.error('Error loading more history:', error);
  } finally {
    loadingMoreHistory.value = false;
  }
};

const loadWeeklyReports = async () => {
  loadingWeekly.value = true;
  weeklyPage.value = 1;
  try {
    const res = await $http.$_getDrEkaWeeklyReports({ page: 1, limit: 10 });
    const data = res?.data?.data || res?.data;
    weeklyReports.value = data?.reports || data?.items || (Array.isArray(data) ? data : []);
    weeklyHasMore.value = (data?.page < data?.pages) || (data?.page < data?.totalPages) || false;
  } catch (error) {
    console.error('Error loading weekly reports:', error);
    weeklyReports.value = [];
  } finally {
    loadingWeekly.value = false;
  }
};

const loadMoreWeekly = async () => {
  loadingMoreWeekly.value = true;
  try {
    weeklyPage.value++;
    const res = await $http.$_getDrEkaWeeklyReports({ page: weeklyPage.value, limit: 10 });
    const data = res?.data?.data || res?.data;
    const newItems = data?.reports || data?.items || (Array.isArray(data) ? data : []);
    weeklyReports.value = [...weeklyReports.value, ...newItems];
    weeklyHasMore.value = (data?.page < data?.pages) || (data?.page < data?.totalPages) || false;
  } catch (error) {
    console.error('Error loading more weekly reports:', error);
  } finally {
    loadingMoreWeekly.value = false;
  }
};

const generateWeeklyReport = async () => {
  generatingWeekly.value = true;
  try {
    await $http.$_generateDrEkaWeeklyReport();
    await loadWeeklyReports();
  } catch (error) {
    console.error('Error generating weekly report:', error);
  } finally {
    generatingWeekly.value = false;
  }
};

// Toggle expand
const toggleDigest = (id) => {
  expandedDigestId.value = expandedDigestId.value === id ? null : id;
};

const toggleReport = (id) => {
  expandedReportId.value = expandedReportId.value === id ? null : id;
};

// Tab switching
const switchToHistory = () => {
  activeTab.value = 'history';
  if (digestHistory.value.length === 0) {
    loadDigestHistory();
  }
};

const switchToWeekly = () => {
  activeTab.value = 'weekly';
  if (weeklyReports.value.length === 0) {
    loadWeeklyReports();
  }
};

// Actions
const handleAction = (item) => {
  if (item.action_url) {
    // If it's a relative URL, use router; otherwise open externally
    if (item.action_url.startsWith('/')) {
      router.push(item.action_url);
    } else {
      window.open(item.action_url, '_blank');
    }
  }
};

const goBack = () => {
  router.back();
};

// Lifecycle
onMounted(() => {
  loadTodayDigest();
});
</script>

<style scoped lang="scss">
// Design Tokens
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
$indigo: #6366F1;
$indigo-light: #E0E7FF;

$radius-sm: 10px;
$radius-md: 16px;
$radius-lg: 20px;
$radius-xl: 24px;

.dr-eka-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 0 100px;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background: $bg;
  min-height: 100vh;
}

// ==========================================
// Hero Section
// ==========================================
.hero-section {
  position: relative;
  padding: 32px 24px 40px;
  overflow: hidden;
}

.hero-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.hero-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #0F4C81 0%, #0288D1 40%, #4FC3F7 75%, #B3E5FC 100%);
}

.hero-pattern {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle at 20% 80%, rgba(255,255,255,0.08) 0%, transparent 50%),
                     radial-gradient(circle at 80% 20%, rgba(255,255,255,0.06) 0%, transparent 50%);
}

.hero-content {
  position: relative;
  z-index: 1;
}

.back-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  margin-bottom: 24px;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.25);
  }
}

.hero-info {
  display: flex;
  align-items: center;
  gap: 20px;

  @media (max-width: 480px) {
    flex-direction: column;
    text-align: center;
  }
}

.doctor-avatar {
  position: relative;
  width: 88px;
  height: 88px;
  flex-shrink: 0;
}

.avatar-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.3);
  animation: pulse-ring 3s ease-in-out infinite;
}

.avatar-inner {
  position: absolute;
  inset: 6px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(255,255,255,0.25), rgba(255,255,255,0.1));
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.4);
}

.avatar-pulse {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.15);
  animation: pulse-ring 3s ease-in-out infinite 1.5s;
}

@keyframes pulse-ring {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.5; }
}

.doctor-details {
  flex: 1;

  h1 {
    font-size: 28px;
    font-weight: 800;
    color: white;
    margin: 0 0 4px;
    letter-spacing: -0.02em;
  }

  .subtitle {
    font-size: 14px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.8);
    margin: 0 0 10px;
  }

  .summary-text {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.7);
    margin: 0;
    line-height: 1.5;
    max-width: 360px;
  }
}

// ==========================================
// Tab Section
// ==========================================
.tab-section {
  padding: 0 24px;
  margin-top: -16px;
  position: relative;
  z-index: 2;
}

.tab-bar {
  display: flex;
  gap: 6px;
  background: white;
  border-radius: $radius-md;
  padding: 5px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px 8px;
  border: none;
  background: transparent;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
  color: $gray;
  cursor: pointer;
  transition: all 0.25s;
  white-space: nowrap;

  &:hover {
    color: $sky-dark;
    background: $sky-light;
  }

  &.active {
    background: linear-gradient(135deg, $sky-dark, $sky);
    color: white;
    box-shadow: 0 2px 10px rgba($sky-dark, 0.3);
  }
}

// ==========================================
// Tab Content
// ==========================================
.tab-content {
  padding: 24px;
}

// ==========================================
// Loading & Empty States
// ==========================================
.loading-state {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.shimmer-card {
  background: white;
  border-radius: $radius-md;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.shimmer-bar {
  height: 14px;
  border-radius: 7px;
  background: linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

.shimmer-short { width: 30%; }
.shimmer-medium { width: 60%; }
.shimmer-long { width: 90%; }

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: $radius-lg;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.empty-icon {
  width: 96px;
  height: 96px;
  background: linear-gradient(135deg, $sky-light, #B3E5FC);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  color: $sky-dark;
}

.empty-state {
  h3 {
    font-size: 20px;
    font-weight: 700;
    color: $navy;
    margin: 0 0 8px;
  }

  p {
    font-size: 14px;
    color: $gray;
    margin: 0 0 28px;
    max-width: 400px;
    margin-left: auto;
    margin-right: auto;
    line-height: 1.6;
  }
}

.generate-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  background: linear-gradient(135deg, $sky-dark, $indigo);
  color: white;
  border: none;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba($sky-dark, 0.35);
  }

  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }
}

// ==========================================
// Digest Cards
// ==========================================
.digest-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.digest-card {
  display: flex;
  background: white;
  border-radius: $radius-lg;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  transition: all 0.25s;

  &:hover {
    box-shadow: 0 8px 28px rgba(0, 0, 0, 0.08);
    transform: translateY(-1px);
  }
}

.digest-card-accent {
  width: 5px;
  flex-shrink: 0;

  &.accent-urgent { background: linear-gradient(180deg, $rose, #FB7185); }
  &.accent-high { background: linear-gradient(180deg, $amber, #FBBF24); }
  &.accent-medium { background: linear-gradient(180deg, $sky, #7DD3FC); }
  &.accent-low { background: linear-gradient(180deg, $emerald, #6EE7B7); }
}

.digest-card-body {
  flex: 1;
  padding: 20px;
}

.digest-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.type-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;

  &.badge-observation { background: $sky-light; color: $sky-dark; }
  &.badge-recommendation { background: $violet-light; color: $violet; }
  &.badge-medication { background: $indigo-light; color: $indigo; }
  &.badge-reminder { background: $amber-light; color: $amber; }
  &.badge-alert { background: $rose-light; color: $rose; }
  &.badge-milestone { background: $emerald-light; color: $emerald; }
  &.badge-vital { background: $rose-light; color: $rose; }
  &.badge-lifestyle { background: $amber-light; color: $amber; }
  &.badge-nutrition { background: $emerald-light; color: $emerald; }
  &.badge-fitness { background: $sky-light; color: $sky-dark; }
  &.badge-mental_health { background: $violet-light; color: $violet; }
}

.priority-indicator {
  font-size: 10px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 6px;
  text-transform: uppercase;

  &.priority-urgent { background: $rose-light; color: $rose; }
  &.priority-high { background: $amber-light; color: $amber; }
  &.priority-medium { background: $sky-light; color: $sky-dark; }
  &.priority-low { background: $emerald-light; color: $emerald; }
}

.digest-card-title {
  font-size: 16px;
  font-weight: 650;
  color: $navy;
  margin: 0 0 8px;
  line-height: 1.4;
}

.digest-card-content {
  font-size: 14px;
  color: $slate;
  line-height: 1.65;
  margin: 0 0 14px;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 18px;
  background: $sky;
  color: white;
  border: none;
  border-radius: $radius-sm;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: $sky-dark;
    transform: translateX(2px);
  }
}

// ==========================================
// Joke Card
// ==========================================
.joke-card {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
  background: linear-gradient(135deg, #FFF9E6, #FFFBF0);
  border-radius: $radius-lg;
  border: 1px solid #FDE68A;
}

.joke-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: $amber-light;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $amber;
  flex-shrink: 0;
}

.joke-content {
  flex: 1;
}

.joke-label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: $amber;
  margin-bottom: 6px;
}

.joke-text {
  font-size: 14px;
  color: $slate;
  line-height: 1.6;
  margin: 0;
  font-style: italic;
}

// ==========================================
// Digest Meta
// ==========================================
.digest-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  justify-content: center;
  padding-top: 8px;
  color: $light-gray;
  font-size: 12px;
}

// ==========================================
// History Tab
// ==========================================
.history-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-card {
  background: white;
  border-radius: $radius-md;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
  transition: all 0.2s;
}

.history-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 18px 20px;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #FAFBFC;
  }
}

.history-date-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  color: $navy;
  font-weight: 600;
  font-size: 14px;

  svg { color: $sky-dark; }
}

.history-card-meta {
  display: flex;
  align-items: center;
  gap: 10px;
}

.item-count {
  font-size: 12px;
  color: $gray;
  background: #F1F5F9;
  padding: 3px 10px;
  border-radius: 8px;
}

.expand-icon {
  transition: transform 0.25s;
  color: $gray;

  &.rotated {
    transform: rotate(180deg);
  }
}

.history-card-body {
  padding: 0 20px 20px;
  border-top: 1px solid #F1F5F9;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-top: 16px;
}

.history-item {
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

.history-item-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-top: 5px;
  flex-shrink: 0;

  &.dot-urgent { background: $rose; }
  &.dot-high { background: $amber; }
  &.dot-medium { background: $sky; }
  &.dot-low { background: $emerald; }
}

.history-item-content {
  flex: 1;

  .history-item-type {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    color: $gray;
    letter-spacing: 0.04em;
  }

  h4 {
    font-size: 14px;
    font-weight: 600;
    color: $navy;
    margin: 2px 0 4px;
  }

  p {
    font-size: 13px;
    color: $slate;
    line-height: 1.5;
    margin: 0;
  }
}

.history-joke {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px;
  background: #FFFBF0;
  border-radius: 10px;
  font-size: 13px;
  color: $slate;
  font-style: italic;

  svg { color: $amber; flex-shrink: 0; margin-top: 2px; }
}

// ==========================================
// Weekly Reports Tab
// ==========================================
.weekly-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.weekly-card {
  background: white;
  border-radius: $radius-lg;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.weekly-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 20px;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #FAFBFC;
  }
}

.weekly-header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.weekly-date {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 14px;
  color: $navy;

  svg { color: $sky-dark; }
}

.weekly-score {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border-radius: 10px;
  font-weight: 700;

  .score-value { font-size: 16px; }
  .score-label { font-size: 10px; font-weight: 500; opacity: 0.8; }

  &.score-excellent { background: $emerald-light; color: $emerald; }
  &.score-good { background: $sky-light; color: $sky-dark; }
  &.score-fair { background: $amber-light; color: $amber; }
  &.score-low { background: $rose-light; color: $rose; }
}

.weekly-card-body {
  padding: 0 20px 24px;
  border-top: 1px solid #F1F5F9;
}

.weekly-section {
  padding-top: 20px;

  & + .weekly-section {
    border-top: 1px solid #F8FAFC;
    margin-top: 4px;
  }
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 650;
  color: $navy;
  margin: 0 0 14px;

  svg { color: $sky-dark; }
}

.narrative-text {
  font-size: 14px;
  color: $slate;
  line-height: 1.7;
  margin: 0;
}

// Score Display
.score-display {
  display: flex;
  align-items: center;
  gap: 20px;
}

.score-ring {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 24px;
  font-weight: 800;

  &.score-excellent { background: $emerald-light; color: $emerald; border: 3px solid $emerald; }
  &.score-good { background: $sky-light; color: $sky-dark; border: 3px solid $sky; }
  &.score-fair { background: $amber-light; color: $amber; border: 3px solid $amber; }
  &.score-low { background: $rose-light; color: $rose; border: 3px solid $rose; }
}

.score-details {
  .score-status {
    display: block;
    font-size: 15px;
    font-weight: 700;
    color: $navy;
    margin-bottom: 4px;
  }

  p {
    font-size: 13px;
    color: $gray;
    line-height: 1.5;
    margin: 0;
  }
}

// Medications
.medications-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.medication-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: #F8FAFC;
  border-radius: 12px;
}

.med-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: $violet-light;
  color: $violet;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.med-details {
  display: flex;
  flex-direction: column;
  gap: 2px;

  .med-name {
    font-size: 14px;
    font-weight: 600;
    color: $navy;
  }

  .med-dosage {
    font-size: 12px;
    color: $gray;
  }

  .med-note {
    font-size: 12px;
    color: $light-gray;
    font-style: italic;
  }
}

// Recommendations
.recommendations-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rec-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px;
  background: #F8FAFC;
  border-radius: 12px;

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: stretch;
  }
}

.rec-content {
  flex: 1;

  h5 {
    font-size: 14px;
    font-weight: 600;
    color: $navy;
    margin: 0 0 2px;
  }

  p {
    font-size: 12px;
    color: $gray;
    margin: 0;
    line-height: 1.4;
  }
}

.rec-action {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 8px 14px;
  background: $sky;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;

  &:hover { background: $sky-dark; }
}

// Health News
.news-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.news-item {
  padding: 14px;
  background: #F8FAFC;
  border-radius: 12px;

  h5 {
    font-size: 14px;
    font-weight: 600;
    color: $navy;
    margin: 0 0 4px;
  }

  p {
    font-size: 13px;
    color: $slate;
    line-height: 1.5;
    margin: 0 0 6px;
  }
}

.news-relevance {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: $sky-dark;
  font-weight: 500;

  svg { color: $sky; }
}

// Doctor's Note
.doctors-note {
  margin-top: 20px;
  padding: 24px;
  background: linear-gradient(135deg, #F0F7FF, #F5F3FF);
  border-radius: $radius-lg;
  border: 1px solid #E0E7FF;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: linear-gradient(180deg, $sky-dark, $indigo);
  }
}

.note-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.note-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, $sky-dark, $indigo);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.note-label {
  display: block;
  font-size: 14px;
  font-weight: 700;
  color: $navy;
}

.note-date {
  display: block;
  font-size: 11px;
  color: $gray;
}

.note-text {
  font-size: 14px;
  color: $slate;
  line-height: 1.7;
  margin: 0 0 16px;
  padding-left: 12px;
  border-left: 2px solid rgba($indigo, 0.15);
}

.note-signature {
  text-align: right;
  font-size: 12px;
  font-weight: 600;
  color: $indigo;
  font-style: italic;
}

// ==========================================
// Load More
// ==========================================
.load-more {
  text-align: center;
  margin-top: 8px;
}

.load-more-btn {
  padding: 12px 32px;
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  color: $slate;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    border-color: $sky;
    color: $sky-dark;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

// ==========================================
// Disclaimer
// ==========================================
.disclaimer-section {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin: 32px 24px 0;
  padding: 16px;
  background: white;
  border-radius: 12px;
  border: 1px solid #E2E8F0;

  svg {
    color: $light-gray;
    flex-shrink: 0;
    margin-top: 1px;
  }

  p {
    font-size: 12px;
    color: $gray;
    line-height: 1.5;
    margin: 0;
  }
}

// ==========================================
// Mobile Responsive
// ==========================================
@media (max-width: 768px) {
  .hero-section {
    padding: 20px 16px 32px;
  }

  .back-btn {
    width: 36px;
    height: 36px;
    margin-bottom: 16px;
  }

  .doctor-avatar {
    width: 72px;
    height: 72px;
  }

  .doctor-details {
    h1 { font-size: 22px; }
    .subtitle { font-size: 13px; }
    .summary-text { font-size: 12px; }
  }

  .tab-section {
    padding: 0 16px;
    margin-top: -12px;
  }

  .tab-btn {
    padding: 10px 6px;
    font-size: 12px;
    gap: 4px;
  }

  .tab-content {
    padding: 20px 16px;
  }

  .digest-card-body {
    padding: 16px;
  }

  .digest-card-title {
    font-size: 14px;
  }

  .digest-card-content {
    font-size: 13px;
  }

  .joke-card {
    flex-direction: column;
    gap: 12px;
  }

  .joke-icon {
    width: 40px;
    height: 40px;
  }

  .weekly-card-header {
    padding: 16px;
  }

  .weekly-header-left {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .weekly-card-body {
    padding: 0 16px 20px;
  }

  .score-display {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .score-ring {
    width: 60px;
    height: 60px;
    font-size: 20px;
  }

  .doctors-note {
    padding: 18px;
  }

  .disclaimer-section {
    margin: 24px 16px 0;
    padding: 12px;

    p { font-size: 11px; }
  }
}

@media (max-width: 380px) {
  .tab-btn {
    font-size: 11px;
    padding: 8px 4px;

    svg { display: none; }
  }

  .hero-info {
    gap: 14px;
  }

  .doctor-avatar {
    width: 60px;
    height: 60px;
  }

  .doctor-details h1 {
    font-size: 20px;
  }
}
</style>
