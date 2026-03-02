<template>
  <div class="screenings-section">
    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner" />
      <span>Loading screenings...</span>
    </div>

    <!-- Content -->
    <template v-else-if="screenings.length">
      <div class="screening-list">
        <div
          v-for="(s, idx) in screenings"
          :key="s.id"
          class="screening-card"
          :style="{ animationDelay: `${idx * 0.06}s` }"
        >
          <!-- Header -->
          <div class="screening-card__header">
            <div class="screening-card__instrument">
              <div class="instrument-icon">
                <v-icon name="hi-document-report" scale="1" />
              </div>
              <div>
                <span class="instrument-name">{{ s.instrument }}</span>
                <span class="screening-date">{{ formatDate(s.date) }}</span>
              </div>
            </div>
            <div class="screening-card__score-block">
              <span class="score-value">{{ s.total_score }}<span v-if="s.max_score" class="score-max">/{{ s.max_score }}</span></span>
              <span :class="['risk-badge', `risk-badge--${s.risk_level}`]">{{ capitalise(s.risk_level || 'unknown') }}</span>
            </div>
          </div>

          <!-- Risk Zone Label -->
          <div v-if="s.risk_zone_label" class="screening-card__zone">
            {{ s.risk_zone_label }}
          </div>

          <!-- Expand/Collapse -->
          <button class="expand-btn" @click="toggleExpand(s.id)">
            <v-icon :name="expanded[s.id] ? 'hi-chevron-up' : 'hi-chevron-down'" scale="0.7" />
            {{ expanded[s.id] ? 'Hide Details' : 'View Details' }}
          </button>

          <!-- Expanded Content -->
          <div v-if="expanded[s.id]" class="screening-card__details">
            <!-- Answers -->
            <div v-if="s.answers?.length" class="answers-section">
              <h5 class="detail-heading">Responses</h5>
              <div v-for="(a, i) in s.answers" :key="i" class="answer-item">
                <span class="answer-q">{{ a.question || `Q${i + 1}` }}</span>
                <span class="answer-a">{{ a.answer ?? a.score ?? '-' }}</span>
              </div>
            </div>

            <!-- AI Interpretation -->
            <div v-if="s.ai_interpretation" class="ai-section">
              <h5 class="detail-heading">
                <v-icon name="hi-sparkles" scale="0.7" /> AI Interpretation
              </h5>
              <p class="ai-text">{{ s.ai_interpretation }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="pagination.pages > 1" class="pagination">
        <button class="pagination-btn" :disabled="pagination.page <= 1" @click="fetchScreenings(pagination.page - 1)">
          <v-icon name="hi-chevron-left" scale="0.8" /> Previous
        </button>
        <span class="pagination-info">Page {{ pagination.page }} of {{ pagination.pages }}</span>
        <button class="pagination-btn" :disabled="pagination.page >= pagination.pages" @click="fetchScreenings(pagination.page + 1)">
          Next <v-icon name="hi-chevron-right" scale="0.8" />
        </button>
      </div>
    </template>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <v-icon name="hi-document-report" scale="2.5" class="empty-icon" />
      <h3>No Screenings Yet</h3>
      <p>Addiction screening reports will appear here when completed</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue';
import apiFactory from '@/services/apiFactory';
import { useToast } from 'vue-toast-notification';

const props = defineProps({
  patientId: { type: String, required: true },
});

const $toast = useToast();
const loading = ref(false);
const screenings = ref([]);
const pagination = ref({ page: 1, limit: 10, total: 0, pages: 0 });
const expanded = reactive({});

onMounted(() => fetchScreenings(1));
watch(() => props.patientId, () => fetchScreenings(1));

async function fetchScreenings(page = 1) {
  loading.value = true;
  try {
    const res = await apiFactory.$_getPatientScreeningHistory(props.patientId, { page, limit: 10 });
    const result = res.data?.data || res.data?.result || res.data;
    screenings.value = result?.data || [];
    pagination.value = result?.pagination || { page: 1, limit: 10, total: 0, pages: 0 };
  } catch (err) {
    console.error('Error fetching screenings:', err);
    $toast.error('Failed to load screenings');
  } finally {
    loading.value = false;
  }
}

function toggleExpand(id) {
  expanded[id] = !expanded[id];
}

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function capitalise(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');
}
</script>

<style scoped lang="scss">
$sky: #4FC3F7;
$sky-light: #E1F5FE;
$sky-dark: #0288D1;
$emerald: #10B981;
$emerald-light: #D1FAE5;
$amber: #F59E0B;
$amber-light: #FEF3C7;
$rose: #F43F5E;
$rose-light: #FFE4E6;

.screenings-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.screening-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.screening-card {
  padding: 20px;
  background: rgba(255,255,255,0.9);
  border: 1px solid rgba($color-g-92, 0.5);
  border-radius: 16px;
  animation: fadeSlideUp 0.4s ease forwards;
  opacity: 0;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    flex-wrap: wrap;
  }

  &__instrument {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__score-block {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
  }

  &__zone {
    margin-top: 10px;
    padding: 8px 14px;
    background: rgba($sky-light, 0.5);
    border-radius: 10px;
    font-size: 13px;
    color: $color-g-36;
    font-weight: 500;
  }

  &__details {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid rgba($color-g-92, 0.5);
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
}

.instrument-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, $sky-light, rgba($sky, 0.2));
  display: flex;
  align-items: center;
  justify-content: center;
  color: $sky-dark;
}

.instrument-name {
  display: block;
  font-size: 16px;
  font-weight: 700;
  color: $color-g-21;
}

.screening-date {
  display: block;
  font-size: 12px;
  color: $color-g-54;
}

.score-value {
  font-size: 24px;
  font-weight: 700;
  color: $color-g-21;

  .score-max {
    font-size: 14px;
    font-weight: 500;
    color: $color-g-67;
  }
}

.risk-badge {
  padding: 4px 12px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 700;

  &--low { background: rgba($emerald, 0.1); color: $emerald; }
  &--moderate { background: rgba($amber, 0.1); color: darken($amber, 10%); }
  &--high { background: rgba($rose, 0.1); color: $rose; }
  &--critical { background: rgba(#DC2626, 0.1); color: #DC2626; }
  &--unknown { background: rgba($color-g-67, 0.1); color: $color-g-54; }
}

.expand-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  padding: 8px 14px;
  background: rgba($sky, 0.06);
  border: none;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  color: $sky-dark;
  cursor: pointer;
  transition: background 0.2s;

  &:hover { background: rgba($sky, 0.12); }
}

// Detail sections
.detail-heading {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: $color-g-21;
  margin-bottom: 10px;
  svg { color: $sky-dark; }
}

.answers-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.answer-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  padding: 8px 12px;
  background: rgba($color-g-92, 0.15);
  border-radius: 8px;

  &:nth-child(odd) { background: rgba($color-g-92, 0.08); }
}

.answer-q { font-size: 13px; color: $color-g-36; flex: 1; }
.answer-a { font-size: 13px; font-weight: 600; color: $color-g-21; text-align: right; }

.ai-section {
  padding: 14px;
  background: linear-gradient(135deg, rgba($sky-light, 0.5), rgba($sky, 0.05));
  border: 1px solid rgba($sky, 0.15);
  border-radius: 12px;
}

.ai-text {
  font-size: 13px;
  line-height: 1.6;
  color: $color-g-36;
  white-space: pre-wrap;
}

// Pagination
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba($color-g-92, 0.5);
}

.pagination-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: rgba(255,255,255,0.9);
  border: 1px solid rgba($color-g-92, 0.6);
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  color: $color-g-36;
  cursor: pointer;
  transition: all 0.2s;
  &:hover:not(:disabled) { border-color: $sky-dark; color: $sky-dark; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.pagination-info { font-size: 13px; color: $color-g-54; }

// Loading & Empty
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 20px;
  gap: 16px;
  span { font-size: 14px; color: $color-g-54; }
}

.loading-spinner {
  width: 36px; height: 36px;
  border: 3px solid rgba($sky, 0.2);
  border-top-color: $sky-dark;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 24px;
  text-align: center;
  .empty-icon { color: rgba($sky-dark, 0.3); margin-bottom: 16px; }
  h3 { font-size: 18px; font-weight: 700; color: $color-g-21; margin-bottom: 8px; }
  p { font-size: 14px; color: $color-g-54; }
}

@keyframes spin { to { transform: rotate(360deg); } }
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
