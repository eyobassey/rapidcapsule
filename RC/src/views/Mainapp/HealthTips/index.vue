<template>
  <div class="health-tips-page">
    <!-- Page Header -->
    <section class="page-header">
      <div class="header-content">
        <button class="back-btn" @click="goBack">
          <v-icon name="hi-arrow-left" scale="1" />
        </button>
        <div class="header-text">
          <h1>Health Insights</h1>
          <p>Personalized tips based on your health profile</p>
        </div>
      </div>
      <button class="refresh-btn" @click="refreshTips" :disabled="loading">
        <v-icon name="hi-refresh" scale="1" :class="{ spinning: loading }" />
      </button>
    </section>

    <!-- Summary Cards -->
    <section class="summary-section">
      <div class="summary-card" v-for="stat in summaryStats" :key="stat.label">
        <div class="summary-icon" :class="stat.color">
          <v-icon :name="stat.icon" scale="1" />
        </div>
        <div class="summary-info">
          <span class="summary-value">{{ stat.value }}</span>
          <span class="summary-label">{{ stat.label }}</span>
        </div>
      </div>
    </section>

    <!-- Filters -->
    <section class="filters-section">
      <div class="filter-tabs">
        <button
          class="filter-tab"
          :class="{ active: activeFilter === 'all' }"
          @click="activeFilter = 'all'"
        >
          All
        </button>
        <button
          v-for="category in categories"
          :key="category.value"
          class="filter-tab"
          :class="{ active: activeFilter === category.value }"
          @click="activeFilter = category.value"
        >
          {{ category.label }}
        </button>
      </div>
      <div class="priority-filter">
        <select v-model="priorityFilter" class="priority-select">
          <option value="all">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>
    </section>

    <!-- Loading State -->
    <section v-if="loading" class="loading-section">
      <div class="loading-spinner"></div>
      <p>Loading your health insights...</p>
    </section>

    <!-- Empty State -->
    <section v-else-if="filteredTips.length === 0" class="empty-section">
      <div class="empty-icon">
        <v-icon name="hi-light-bulb" scale="3" />
      </div>
      <h3>No Health Tips Yet</h3>
      <p>{{ emptyMessage }}</p>
      <button class="generate-btn" @click="generateTips" :disabled="generating">
        <v-icon name="hi-sparkles" scale="0.9" />
        {{ generating ? 'Generating...' : 'Generate Tips' }}
      </button>
    </section>

    <!-- Tips List -->
    <section v-else class="tips-section">
      <div
        v-for="tip in filteredTips"
        :key="tip._id"
        class="tip-card"
        :class="[`priority-${tip.priority}`, { dismissed: tip.status === 'dismissed' }]"
      >
        <div class="tip-header">
          <div class="tip-icon" :class="getCategoryClass(tip.category)">
            <v-icon :name="getCategoryIcon(tip.category)" scale="1.1" />
          </div>
          <div class="tip-meta">
            <span class="tip-category">{{ formatCategory(tip.category) }}</span>
            <span class="tip-priority" :class="`priority-${tip.priority}`">
              {{ tip.priority }}
            </span>
          </div>
          <button class="dismiss-btn" @click="dismissTip(tip._id)" title="Dismiss">
            <v-icon name="hi-x" scale="0.8" />
          </button>
        </div>

        <h3 class="tip-title">{{ tip.title }}</h3>
        <p class="tip-content">{{ tip.content }}</p>

        <div class="tip-footer">
          <div class="tip-tags">
            <span v-for="tag in (tip.tags || []).slice(0, 3)" :key="tag" class="tip-tag">
              {{ tag }}
            </span>
          </div>
          <button
            v-if="tip.action_text && tip.action_route"
            class="tip-action"
            @click="handleAction(tip)"
          >
            {{ tip.action_text }}
            <v-icon name="hi-arrow-right" scale="0.7" />
          </button>
        </div>

        <div v-if="tip.source === 'ai_generated'" class="ai-indicator">
          <v-icon name="hi-sparkles" scale="0.6" />
          AI Generated
        </div>
      </div>
    </section>

    <!-- Load More -->
    <section v-if="hasMore && !loading" class="load-more-section">
      <button class="load-more-btn" @click="loadMore" :disabled="loadingMore">
        {{ loadingMore ? 'Loading...' : 'Load More Tips' }}
      </button>
    </section>

    <!-- Medical Disclaimer -->
    <section class="disclaimer-section">
      <v-icon name="hi-information-circle" scale="0.9" />
      <p>These insights are for informational purposes only and do not constitute medical advice. Always consult with a healthcare professional for medical decisions.</p>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const $http = inject('$_HTTP');

// State
const loading = ref(true);
const generating = ref(false);
const loadingMore = ref(false);
const tips = ref([]);
const summary = ref(null);
const activeFilter = ref('all');
const priorityFilter = ref('all');
const currentPage = ref(1);
const totalPages = ref(1);

// Categories
const categories = [
  { value: 'vitals', label: 'Vitals' },
  { value: 'lifestyle', label: 'Lifestyle' },
  { value: 'nutrition', label: 'Nutrition' },
  { value: 'fitness', label: 'Fitness' },
  { value: 'mental_health', label: 'Mental Health' },
  { value: 'preventive_care', label: 'Preventive' },
  { value: 'chronic_condition', label: 'Chronic' },
  { value: 'sleep', label: 'Sleep' },
];

// Computed
const filteredTips = computed(() => {
  let filtered = tips.value;

  if (activeFilter.value !== 'all') {
    filtered = filtered.filter(t => t.category === activeFilter.value);
  }

  if (priorityFilter.value !== 'all') {
    filtered = filtered.filter(t => t.priority === priorityFilter.value);
  }

  // Sort by priority (urgent first)
  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
  return filtered.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
});

const summaryStats = computed(() => {
  const s = summary.value;
  if (!s) return [];

  return [
    { label: 'Total Tips', value: s.total || tips.value.length, icon: 'hi-light-bulb', color: 'sky' },
    { label: 'Urgent', value: s.by_priority?.urgent || 0, icon: 'hi-exclamation', color: 'rose' },
    { label: 'High Priority', value: s.by_priority?.high || 0, icon: 'hi-arrow-up', color: 'amber' },
    { label: 'Acted Upon', value: s.acted_upon || 0, icon: 'hi-check-circle', color: 'emerald' },
  ];
});

const hasMore = computed(() => currentPage.value < totalPages.value);

const emptyMessage = computed(() => {
  if (activeFilter.value !== 'all' || priorityFilter.value !== 'all') {
    return 'No tips match your current filters. Try adjusting the filters or generate new tips.';
  }
  return 'Complete your health profile and log your vitals to receive personalized health tips.';
});

// Methods
const getCategoryIcon = (category) => {
  const iconMap = {
    vitals: 'hi-heart',
    lifestyle: 'fa-sun',
    nutrition: 'fa-apple-alt',
    fitness: 'hi-lightning-bolt',
    mental_health: 'hi-emoji-happy',
    preventive_care: 'hi-shield-check',
    chronic_condition: 'hi-clipboard-list',
    medication: 'ri-capsule-line',
    sleep: 'hi-moon',
    hydration: 'hi-beaker',
  };
  return iconMap[category] || 'hi-light-bulb';
};

const getCategoryClass = (category) => {
  const classMap = {
    vitals: 'rose',
    lifestyle: 'amber',
    nutrition: 'emerald',
    fitness: 'sky',
    mental_health: 'violet',
    preventive_care: 'sky',
    chronic_condition: 'rose',
    medication: 'violet',
    sleep: 'indigo',
    hydration: 'sky',
  };
  return classMap[category] || 'sky';
};

const formatCategory = (category) => {
  const labels = {
    vitals: 'Vitals',
    lifestyle: 'Lifestyle',
    nutrition: 'Nutrition',
    fitness: 'Fitness',
    mental_health: 'Mental Health',
    preventive_care: 'Preventive Care',
    chronic_condition: 'Chronic Condition',
    medication: 'Medication',
    sleep: 'Sleep',
    hydration: 'Hydration',
  };
  return labels[category] || category;
};

const loadTips = async () => {
  loading.value = true;
  try {
    const [tipsRes, summaryRes] = await Promise.all([
      $http.$_getHealthTips({ limit: 20, include_dismissed: false }),
      $http.$_getHealthTipsSummary(),
    ]);

    if (tipsRes?.data?.data?.tips) {
      tips.value = tipsRes.data.data.tips;
    } else if (tipsRes?.data?.tips) {
      tips.value = tipsRes.data.tips;
    }

    if (summaryRes?.data?.data) {
      summary.value = summaryRes.data.data;
    } else if (summaryRes?.data) {
      summary.value = summaryRes.data;
    }
  } catch (error) {
    console.error('Error loading health tips:', error);
  } finally {
    loading.value = false;
  }
};

const refreshTips = async () => {
  await loadTips();
};

const generateTips = async () => {
  generating.value = true;
  try {
    await $http.$_generateHealthTips();
    await loadTips();
  } catch (error) {
    console.error('Error generating tips:', error);
  } finally {
    generating.value = false;
  }
};

const dismissTip = async (tipId) => {
  try {
    await $http.$_dismissHealthTip(tipId);
    tips.value = tips.value.filter(t => t._id !== tipId);
  } catch (error) {
    console.error('Error dismissing tip:', error);
  }
};

const handleAction = (tip) => {
  if (tip.action_route) {
    // Track that user acted on tip
    $http.$_markHealthTipActed?.(tip._id).catch(() => {});
    router.push(tip.action_route);
  }
};

const loadMore = async () => {
  loadingMore.value = true;
  try {
    const res = await $http.$_getHealthTips({
      page: currentPage.value + 1,
      limit: 20,
      include_dismissed: false
    });

    if (res?.data?.data?.tips) {
      tips.value = [...tips.value, ...res.data.data.tips];
      currentPage.value++;
      totalPages.value = res.data.data.pages || 1;
    }
  } catch (error) {
    console.error('Error loading more tips:', error);
  } finally {
    loadingMore.value = false;
  }
};

const goBack = () => {
  router.back();
};

// Lifecycle
onMounted(() => {
  loadTips();
});
</script>

<style scoped lang="scss">
// Design Tokens
$sky: #4FC3F7;
$sky-light: #E1F5FE;
$sky-dark: #0288D1;
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

.health-tips-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem 2rem 100px;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  overflow-x: hidden;

  @media (max-width: 768px) {
    padding: 20px 16px 100px;
  }
}

// Page Header
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: white;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $slate;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.2s;

  &:hover {
    background: $sky-light;
    color: $sky-dark;
  }
}

.header-text {
  h1 {
    font-size: 24px;
    font-weight: 700;
    color: $navy;
    margin: 0 0 4px;
  }

  p {
    font-size: 14px;
    color: $gray;
    margin: 0;
  }
}

.refresh-btn {
  width: 44px;
  height: 44px;
  border: none;
  background: white;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $sky-dark;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: $sky-light;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .spinning {
    animation: spin 1s linear infinite;
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

// Summary Section
.summary-section {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
}

.summary-card {
  background: white;
  border-radius: 16px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.summary-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &.sky { background: $sky-light; color: $sky-dark; }
  &.rose { background: $rose-light; color: $rose; }
  &.amber { background: $amber-light; color: $amber; }
  &.emerald { background: $emerald-light; color: $emerald; }
}

.summary-info {
  display: flex;
  flex-direction: column;
}

.summary-value {
  font-size: 20px;
  font-weight: 700;
  color: $navy;
  line-height: 1.2;
}

.summary-label {
  font-size: 12px;
  color: $gray;
}

// Filters Section
.filters-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
  width: 100%;
  overflow: hidden;
}

.filter-tabs {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
  -webkit-overflow-scrolling: touch;
  max-width: 100%;
  flex-shrink: 0;

  &::-webkit-scrollbar {
    display: none;
  }
}

.filter-tab {
  padding: 8px 16px;
  border: 1px solid #E2E8F0;
  background: white;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  color: $slate;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;

  &:hover {
    border-color: $sky;
    color: $sky-dark;
  }

  &.active {
    background: $sky;
    border-color: $sky;
    color: white;
  }
}

.priority-select {
  padding: 8px 32px 8px 12px;
  border: 1px solid #E2E8F0;
  border-radius: 10px;
  font-size: 13px;
  color: $slate;
  background: white url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E") no-repeat right 10px center;
  appearance: none;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: $sky;
  }
}

// Loading State
.loading-section {
  text-align: center;
  padding: 60px 20px;

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid $sky-light;
    border-top-color: $sky;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 16px;
  }

  p {
    color: $gray;
    font-size: 14px;
  }
}

// Empty State
.empty-section {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

  .empty-icon {
    width: 80px;
    height: 80px;
    background: $sky-light;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 20px;
    color: $sky;
  }

  h3 {
    font-size: 18px;
    font-weight: 600;
    color: $navy;
    margin: 0 0 8px;
  }

  p {
    font-size: 14px;
    color: $gray;
    margin: 0 0 24px;
    max-width: 400px;
    margin-left: auto;
    margin-right: auto;
  }

  .generate-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    background: linear-gradient(135deg, $violet, $sky-dark);
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    &:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba($violet, 0.3);
    }

    &:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
  }
}

// Tips Section
.tips-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  overflow: hidden;
}

.tip-card {
  background: white;
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border-left: 4px solid $sky;
  position: relative;
  transition: all 0.2s;
  overflow: hidden;
  width: 100%;
  box-sizing: border-box;

  &:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  }

  &.priority-urgent {
    border-left-color: $rose;
    background: linear-gradient(135deg, #FFF5F5 0%, white 20%);
  }

  &.priority-high {
    border-left-color: $amber;
    background: linear-gradient(135deg, #FFFBEB 0%, white 20%);
  }

  &.priority-medium {
    border-left-color: $sky;
  }

  &.priority-low {
    border-left-color: $emerald;
  }

  &.dismissed {
    opacity: 0.6;
  }
}

.tip-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.tip-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &.sky { background: $sky-light; color: $sky-dark; }
  &.rose { background: $rose-light; color: $rose; }
  &.amber { background: $amber-light; color: $amber; }
  &.emerald { background: $emerald-light; color: $emerald; }
  &.violet { background: $violet-light; color: $violet; }
  &.indigo { background: $indigo-light; color: $indigo; }
}

.tip-meta {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tip-category {
  font-size: 12px;
  font-weight: 500;
  color: $gray;
}

.tip-priority {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
  text-transform: uppercase;

  &.priority-urgent {
    background: $rose-light;
    color: $rose;
  }

  &.priority-high {
    background: $amber-light;
    color: $amber;
  }

  &.priority-medium {
    background: $sky-light;
    color: $sky-dark;
  }

  &.priority-low {
    background: $emerald-light;
    color: $emerald;
  }
}

.dismiss-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $light-gray;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #F1F5F9;
    color: $slate;
  }
}

.tip-title {
  font-size: 16px;
  font-weight: 600;
  color: $navy;
  margin: 0 0 8px;
  line-height: 1.4;
}

.tip-content {
  font-size: 14px;
  color: $slate;
  line-height: 1.6;
  margin: 0 0 16px;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.tip-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.tip-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.tip-tag {
  font-size: 11px;
  padding: 4px 10px;
  background: #F1F5F9;
  border-radius: 6px;
  color: $gray;
}

.tip-action {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: $sky;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: $sky-dark;
  }
}

.ai-indicator {
  position: absolute;
  top: 16px;
  right: 52px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  font-weight: 500;
  color: $violet;
  background: $violet-light;
  padding: 3px 8px;
  border-radius: 6px;
}

// Load More
.load-more-section {
  text-align: center;
  margin-top: 24px;
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

// Disclaimer
.disclaimer-section {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-top: 32px;
  padding: 16px;
  background: #F8FAFC;
  border-radius: 12px;
  border: 1px solid #E2E8F0;

  svg {
    color: $light-gray;
    flex-shrink: 0;
    margin-top: 2px;
  }

  p {
    font-size: 12px;
    color: $gray;
    line-height: 1.5;
    margin: 0;
  }
}

// Mobile adjustments
@media (max-width: 768px) {
  .health-tips-page {
    padding: 16px 16px 100px;
  }

  .page-header {
    flex-direction: row;
    align-items: center;
    margin-bottom: 20px;
  }

  .header-content {
    flex: 1;
    gap: 12px;
  }

  .back-btn {
    width: 36px;
    height: 36px;
    border-radius: 10px;
  }

  .header-text {
    h1 {
      font-size: 18px;
      margin-bottom: 2px;
    }

    p {
      font-size: 12px;
      display: none;
    }
  }

  .refresh-btn {
    width: 36px;
    height: 36px;
    border-radius: 10px;
  }

  .summary-section {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    margin-bottom: 20px;
  }

  .summary-card {
    padding: 12px;
    border-radius: 12px;
    gap: 10px;
  }

  .summary-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
  }

  .summary-value {
    font-size: 16px;
  }

  .summary-label {
    font-size: 11px;
  }

  .filters-section {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    margin-bottom: 20px;
  }

  .filter-tabs {
    width: 100%;
    padding-bottom: 8px;
    margin-bottom: 0;
  }

  .filter-tab {
    padding: 6px 12px;
    font-size: 12px;
  }

  .priority-select {
    width: 100%;
    padding: 10px 32px 10px 12px;
  }

  .loading-section,
  .empty-section {
    padding: 40px 16px;
  }

  .empty-section {
    border-radius: 16px;

    .empty-icon {
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
    }

    h3 {
      font-size: 16px;
    }

    p {
      font-size: 13px;
      margin-bottom: 20px;
    }

    .generate-btn {
      padding: 10px 20px;
      font-size: 13px;
      width: 100%;
      justify-content: center;
    }
  }

  .tips-section {
    gap: 12px;
  }

  .tip-card {
    padding: 16px;
    border-radius: 16px;
    border-left-width: 3px;
  }

  .tip-header {
    gap: 10px;
    margin-bottom: 10px;
  }

  .tip-icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
  }

  .tip-meta {
    flex-wrap: wrap;
    gap: 6px;
  }

  .tip-category {
    font-size: 11px;
  }

  .tip-priority {
    font-size: 9px;
    padding: 2px 6px;
  }

  .dismiss-btn {
    width: 28px;
    height: 28px;
  }

  .tip-title {
    font-size: 14px;
    margin-bottom: 6px;
  }

  .tip-content {
    font-size: 13px;
    line-height: 1.5;
    margin-bottom: 12px;
  }

  .tip-footer {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .tip-tags {
    gap: 4px;
  }

  .tip-tag {
    font-size: 10px;
    padding: 3px 8px;
  }

  .tip-action {
    width: 100%;
    justify-content: center;
    padding: 10px 16px;
    font-size: 13px;
  }

  .ai-indicator {
    position: static;
    margin-top: 10px;
    align-self: flex-start;
  }

  .load-more-section {
    margin-top: 20px;
  }

  .load-more-btn {
    width: 100%;
    padding: 12px 24px;
  }

  .disclaimer-section {
    margin-top: 24px;
    padding: 12px;
    border-radius: 10px;

    p {
      font-size: 11px;
    }
  }
}

// Extra small screens
@media (max-width: 380px) {
  .summary-section {
    grid-template-columns: 1fr;
  }

  .header-text h1 {
    font-size: 16px;
  }

  .filter-tab {
    padding: 5px 10px;
    font-size: 11px;
  }
}
</style>
