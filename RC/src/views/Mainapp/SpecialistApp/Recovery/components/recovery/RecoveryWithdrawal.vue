<template>
  <div class="withdrawal-section">
    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner" />
      <span>Loading withdrawal assessments...</span>
    </div>

    <template v-else>
      <!-- Action Bar -->
      <div class="action-bar">
        <h3 class="section-title">
          <v-icon name="gi-medicine-pills" scale="0.9" />
          Withdrawal Assessments
        </h3>
        <button class="new-assessment-btn" @click="showScaleSelector = true" :disabled="assessingInProgress">
          <v-icon name="hi-plus" scale="0.8" />
          New Assessment
        </button>
      </div>

      <!-- ═══ Scale Selector Modal ═══ -->
      <div v-if="showScaleSelector && !selectedScale" class="modal-overlay" @click.self="closeAssessment">
        <div class="modal-panel scale-selector-panel">
          <div class="modal-header">
            <h3>Select Withdrawal Scale</h3>
            <button class="close-btn" @click="closeAssessment">
              <v-icon name="hi-x" scale="1" />
            </button>
          </div>
          <div class="scale-cards">
            <div
              v-for="scale in availableScales"
              :key="scale.id"
              class="scale-card"
              @click="selectScale(scale.id)"
            >
              <div class="scale-card__icon" :class="`scale-card__icon--${scale.id}`">
                <v-icon :name="scale.id === 'cows' ? 'gi-medicine-pills' : 'gi-glass-celebration'" scale="1.4" />
              </div>
              <div class="scale-card__info">
                <h4>{{ scale.short_name }}</h4>
                <p class="scale-card__name">{{ scale.name }}</p>
                <p class="scale-card__desc">{{ scale.description }}</p>
                <div class="scale-card__meta">
                  <span><v-icon name="hi-clock" scale="0.6" /> ~{{ scale.estimated_minutes }} min</span>
                  <span><v-icon name="hi-clipboard-list" scale="0.6" /> {{ scale.item_count }} items</span>
                  <span><v-icon name="hi-calculator" scale="0.6" /> Max {{ scale.max_total_score }}</span>
                </div>
                <div class="scale-card__substances">
                  <span v-for="sub in scale.target_substances.slice(0, 4)" :key="sub" class="substance-tag">{{ sub }}</span>
                  <span v-if="scale.target_substances.length > 4" class="substance-tag substance-tag--more">+{{ scale.target_substances.length - 4 }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══ Assessment Form Modal ═══ -->
      <div v-if="selectedScale" class="modal-overlay" @click.self="confirmClose">
        <div class="modal-panel assessment-form-panel">
          <div class="modal-header">
            <div>
              <h3>{{ scaleDefinition.short_name }} Assessment</h3>
              <p class="modal-subtitle">{{ scaleDefinition.name }}</p>
            </div>
            <button class="close-btn" @click="confirmClose">
              <v-icon name="hi-x" scale="1" />
            </button>
          </div>

          <!-- Progress Bar -->
          <div class="form-progress">
            <div class="form-progress__bar">
              <div class="form-progress__fill" :style="{ width: progressPercent + '%' }" />
            </div>
            <span class="form-progress__text">{{ answeredCount }} / {{ scaleDefinition.items.length }} items</span>
          </div>

          <!-- Items -->
          <div class="form-items">
            <div
              v-for="(item, idx) in scaleDefinition.items"
              :key="item.id"
              :class="['form-item', { 'form-item--answered': responses[item.id] != null }]"
            >
              <div class="form-item__header">
                <span class="form-item__number">{{ idx + 1 }}</span>
                <div>
                  <h4 class="form-item__name">{{ item.name }}</h4>
                  <p class="form-item__description">{{ item.description }}</p>
                </div>
                <span v-if="responses[item.id] != null" class="form-item__score">
                  {{ responses[item.id] }}<span class="score-max">/{{ item.max_score }}</span>
                </span>
              </div>
              <div class="form-item__options">
                <label
                  v-for="option in item.options"
                  :key="option.value"
                  :class="['option-label', { 'option-label--selected': responses[item.id] === option.value }]"
                >
                  <input
                    type="radio"
                    :name="item.id"
                    :value="option.value"
                    v-model="responses[item.id]"
                    class="option-radio"
                  />
                  <span class="option-value">{{ option.value }}</span>
                  <span class="option-text">{{ option.label }}</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Running Total + Submit -->
          <div class="form-footer">
            <div class="running-total">
              <span class="running-total__label">Running Total</span>
              <span class="running-total__value" :class="currentSeverityClass">
                {{ runningTotal }} <span class="score-max">/ {{ scaleDefinition.max_total_score }}</span>
              </span>
              <span v-if="currentSeverity" :class="['severity-badge', `severity-badge--${currentSeverity.severity}`]">
                {{ currentSeverity.label }}
              </span>
            </div>
            <div class="form-actions">
              <button class="cancel-btn" @click="confirmClose">Cancel</button>
              <button
                class="submit-btn"
                :disabled="!allAnswered || submitting"
                @click="submitAssessment"
              >
                <div v-if="submitting" class="btn-spinner" />
                <template v-else>
                  <v-icon name="hi-check" scale="0.8" />
                  Submit Assessment
                </template>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══ Results Modal ═══ -->
      <div v-if="assessmentResult" class="modal-overlay" @click.self="closeResult">
        <div class="modal-panel result-panel">
          <div class="result-header">
            <div :class="['result-icon', `result-icon--${assessmentResult.severity?.severity}`]">
              <v-icon :name="resultIcon" scale="2" />
            </div>
            <h3>Assessment Complete</h3>
            <p class="result-scale">{{ assessmentResult.scale }}</p>
          </div>

          <div class="result-score-block">
            <div class="result-score">
              {{ assessmentResult.total_score }}<span class="score-max">/{{ assessmentResult.max_possible_score }}</span>
            </div>
            <span :class="['severity-badge severity-badge--lg', `severity-badge--${assessmentResult.severity?.severity}`]">
              {{ assessmentResult.severity?.label }}
            </span>
          </div>

          <!-- Clinical Action -->
          <div v-if="assessmentResult.severity?.clinical_action" class="clinical-action">
            <h4><v-icon name="hi-exclamation" scale="0.8" /> Clinical Action</h4>
            <p>{{ assessmentResult.severity.clinical_action }}</p>
          </div>

          <!-- Item Breakdown -->
          <div v-if="assessmentResult.item_breakdown?.length" class="item-breakdown">
            <h4>Item Breakdown</h4>
            <div v-for="item in assessmentResult.item_breakdown" :key="item.item_id" class="breakdown-row">
              <span class="breakdown-name">{{ item.name }}</span>
              <div class="breakdown-bar-wrapper">
                <div class="breakdown-bar">
                  <div
                    class="breakdown-bar__fill"
                    :style="{ width: (item.value / item.max_score * 100) + '%' }"
                    :class="barClass(item.value, item.max_score)"
                  />
                </div>
                <span class="breakdown-score">{{ item.value }}/{{ item.max_score }}</span>
              </div>
            </div>
          </div>

          <div class="result-actions">
            <button class="submit-btn" @click="closeResult">
              <v-icon name="hi-check" scale="0.8" /> Done
            </button>
          </div>
        </div>
      </div>

      <!-- ═══ Assessment History ═══ -->
      <template v-if="history.length">
        <div class="history-list">
          <div
            v-for="(a, idx) in history"
            :key="a._id"
            class="screening-card"
            :style="{ animationDelay: `${idx * 0.06}s` }"
          >
            <div class="screening-card__header">
              <div class="screening-card__instrument">
                <div :class="['instrument-icon', `instrument-icon--${a.instrument}`]">
                  <v-icon :name="a.instrument === 'cows' ? 'gi-medicine-pills' : 'gi-glass-celebration'" scale="1" />
                </div>
                <div>
                  <span class="instrument-name">{{ a.instrument_name || a.instrument?.toUpperCase() }}</span>
                  <span class="screening-date">{{ formatDate(a.completed_at || a.created_at) }}</span>
                  <span v-if="a.administered_by" class="administered-by">
                    by {{ a.administered_by?.profile?.first_name || '' }} {{ a.administered_by?.profile?.last_name || '' }}
                  </span>
                </div>
              </div>
              <div class="screening-card__score-block">
                <span class="score-value">{{ a.total_score }}<span class="score-max">/{{ a.max_possible_score }}</span></span>
                <span :class="['risk-badge', `risk-badge--${a.risk_level}`]">{{ capitalise(a.risk_level) }}</span>
              </div>
            </div>

            <div v-if="a.risk_label" class="screening-card__zone">
              {{ a.risk_label }}
            </div>

            <div v-if="a.clinical_notes" class="clinical-note">
              <v-icon name="hi-exclamation" scale="0.65" />
              {{ a.clinical_notes }}
            </div>

            <button class="expand-btn" @click="toggleExpand(a._id)">
              <v-icon :name="expanded[a._id] ? 'hi-chevron-up' : 'hi-chevron-down'" scale="0.7" />
              {{ expanded[a._id] ? 'Hide Details' : 'View Details' }}
            </button>

            <div v-if="expanded[a._id]" class="screening-card__details">
              <div v-if="a.responses?.length" class="answers-section">
                <h5 class="detail-heading">Item Responses</h5>
                <div v-for="(r, i) in a.responses" :key="i" class="answer-item">
                  <span class="answer-q">{{ formatItemId(r.question_id) }}</span>
                  <span class="answer-a">{{ r.answer_value }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="historyPagination.pages > 1" class="pagination">
          <button class="pagination-btn" :disabled="historyPagination.page <= 1" @click="fetchHistory(historyPagination.page - 1)">
            <v-icon name="hi-chevron-left" scale="0.8" /> Previous
          </button>
          <span class="pagination-info">Page {{ historyPagination.page }} of {{ historyPagination.pages }}</span>
          <button class="pagination-btn" :disabled="historyPagination.page >= historyPagination.pages" @click="fetchHistory(historyPagination.page + 1)">
            Next <v-icon name="hi-chevron-right" scale="0.8" />
          </button>
        </div>
      </template>

      <!-- Empty State -->
      <div v-else-if="!loading" class="empty-state">
        <v-icon name="gi-medicine-pills" scale="2.5" class="empty-icon" />
        <h3>No Withdrawal Assessments</h3>
        <p>Use the "New Assessment" button to administer a COWS or CIWA-Ar scale</p>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import apiFactory from '@/services/apiFactory';
import { useToast } from 'vue-toast-notification';

const props = defineProps({
  patientId: { type: String, required: true },
});

const emit = defineEmits(['assessment-completed']);

const $toast = useToast();
const loading = ref(false);
const submitting = ref(false);
const assessingInProgress = ref(false);

// Scale selection
const showScaleSelector = ref(false);
const availableScales = ref([]);
const selectedScale = ref(null);
const scaleDefinition = ref(null);
const responses = reactive({});

// Results
const assessmentResult = ref(null);

// History
const history = ref([]);
const historyPagination = ref({ page: 1, limit: 10, total: 0, pages: 0 });
const expanded = reactive({});

// Computed
const answeredCount = computed(() => {
  if (!scaleDefinition.value) return 0;
  return scaleDefinition.value.items.filter(item => responses[item.id] != null).length;
});

const progressPercent = computed(() => {
  if (!scaleDefinition.value) return 0;
  return Math.round((answeredCount.value / scaleDefinition.value.items.length) * 100);
});

const allAnswered = computed(() => {
  if (!scaleDefinition.value) return false;
  return scaleDefinition.value.items.every(item => responses[item.id] != null);
});

const runningTotal = computed(() => {
  return Object.values(responses).reduce((sum, val) => sum + (val || 0), 0);
});

const currentSeverity = computed(() => {
  if (!scaleDefinition.value || answeredCount.value === 0) return null;
  return scaleDefinition.value.severity_zones.find(
    z => runningTotal.value >= z.min_score && runningTotal.value <= z.max_score
  ) || null;
});

const currentSeverityClass = computed(() => {
  if (!currentSeverity.value) return '';
  return `severity-text--${currentSeverity.value.severity}`;
});

const resultIcon = computed(() => {
  const severity = assessmentResult.value?.severity?.severity;
  if (severity === 'severe') return 'hi-exclamation-circle';
  if (severity === 'moderately_severe') return 'hi-exclamation';
  if (severity === 'moderate') return 'hi-information-circle';
  return 'hi-check-circle';
});

// Methods
onMounted(async () => {
  await Promise.all([fetchScales(), fetchHistory(1)]);
});

watch(() => props.patientId, () => {
  fetchHistory(1);
});

async function fetchScales() {
  try {
    const res = await apiFactory.$_getWithdrawalScales();
    const result = res.data?.data || res.data?.result || res.data;
    availableScales.value = Array.isArray(result) ? result : [];
  } catch (err) {
    console.error('Error fetching withdrawal scales:', err);
  }
}

async function selectScale(scaleId) {
  showScaleSelector.value = false;
  assessingInProgress.value = true;
  try {
    const res = await apiFactory.$_getWithdrawalScale(scaleId);
    const result = res.data?.data || res.data?.result || res.data;
    scaleDefinition.value = result;
    selectedScale.value = scaleId;
    // Clear responses
    Object.keys(responses).forEach(k => delete responses[k]);
  } catch (err) {
    console.error('Error fetching scale definition:', err);
    $toast.error('Failed to load scale');
    assessingInProgress.value = false;
  }
}

async function submitAssessment() {
  if (!allAnswered.value || submitting.value) return;
  submitting.value = true;
  try {
    const responseArray = scaleDefinition.value.items.map(item => ({
      item_id: item.id,
      value: responses[item.id],
    }));

    const res = await apiFactory.$_administerWithdrawalAssessment({
      patient_id: props.patientId,
      scale_id: selectedScale.value,
      responses: responseArray,
    });

    const result = res.data?.data || res.data?.result || res.data;
    assessmentResult.value = result;

    // Close form, show result
    selectedScale.value = null;
    scaleDefinition.value = null;
    assessingInProgress.value = false;
    Object.keys(responses).forEach(k => delete responses[k]);

    // Refresh history
    await fetchHistory(1);
    emit('assessment-completed');

    $toast.success('Assessment submitted successfully');
  } catch (err) {
    console.error('Error submitting assessment:', err);
    const msg = err.response?.data?.message || 'Failed to submit assessment';
    $toast.error(msg);
  } finally {
    submitting.value = false;
  }
}

async function fetchHistory(page = 1) {
  loading.value = history.value.length === 0;
  try {
    const res = await apiFactory.$_getWithdrawalHistory(props.patientId, { page, limit: 10 });
    const result = res.data?.data || res.data?.result || res.data;
    history.value = result?.data || [];
    historyPagination.value = result?.pagination || { page: 1, limit: 10, total: 0, pages: 0 };
  } catch (err) {
    console.error('Error fetching withdrawal history:', err);
  } finally {
    loading.value = false;
  }
}

function closeAssessment() {
  showScaleSelector.value = false;
  selectedScale.value = null;
  scaleDefinition.value = null;
  assessingInProgress.value = false;
  Object.keys(responses).forEach(k => delete responses[k]);
}

function confirmClose() {
  if (answeredCount.value > 0) {
    if (!window.confirm('Discard this assessment? All responses will be lost.')) return;
  }
  closeAssessment();
}

function closeResult() {
  assessmentResult.value = null;
}

function toggleExpand(id) {
  expanded[id] = !expanded[id];
}

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function capitalise(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');
}

function formatItemId(id) {
  if (!id) return '';
  return id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function barClass(value, max) {
  const pct = (value / max) * 100;
  if (pct >= 75) return 'bar--severe';
  if (pct >= 50) return 'bar--moderate';
  if (pct >= 25) return 'bar--mild';
  return 'bar--low';
}
</script>

<style scoped lang="scss">
$sky: #4FC3F7;
$sky-light: #E1F5FE;
$sky-dark: #0288D1;
$sky-darker: #01579B;
$emerald: #10B981;
$emerald-light: #D1FAE5;
$amber: #F59E0B;
$amber-light: #FEF3C7;
$rose: #F43F5E;
$rose-light: #FFE4E6;

.withdrawal-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

// ─── Action Bar ───────────────────────────────────────
.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 700;
  color: $color-g-21;
  svg { color: $sky-dark; }
}

.new-assessment-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  background: linear-gradient(135deg, $sky-dark 0%, $sky-darker 100%);
  border: none;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba($sky-dark, 0.3);

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba($sky-dark, 0.4);
  }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

// ─── Modal ────────────────────────────────────────────
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

.modal-panel {
  background: white;
  border-radius: 20px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 24px 28px 16px;
  border-bottom: 1px solid rgba($color-g-92, 0.3);
  position: sticky;
  top: 0;
  background: white;
  border-radius: 20px 20px 0 0;
  z-index: 2;

  h3 {
    font-size: 20px;
    font-weight: 700;
    color: $color-g-21;
  }
}

.modal-subtitle {
  font-size: 13px;
  color: $color-g-54;
  margin-top: 2px;
}

.close-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid rgba($color-g-92, 0.5);
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: $color-g-54;
  transition: all 0.2s;
  flex-shrink: 0;
  &:hover { background: rgba($rose, 0.05); color: $rose; border-color: rgba($rose, 0.3); }
}

// ─── Scale Selector ───────────────────────────────────
.scale-selector-panel {
  max-width: 680px;
}

.scale-cards {
  padding: 24px 28px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.scale-card {
  display: flex;
  gap: 20px;
  padding: 24px;
  border: 2px solid rgba($color-g-92, 0.4);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.25s ease;

  &:hover {
    border-color: $sky-dark;
    background: rgba($sky-light, 0.3);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba($sky-dark, 0.12);
  }

  &__icon {
    width: 64px;
    height: 64px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &--cows {
      background: linear-gradient(135deg, #FEE2E2, #FECACA);
      color: #DC2626;
    }
    &--ciwa_ar {
      background: linear-gradient(135deg, $amber-light, #FDE68A);
      color: #D97706;
    }
  }

  &__info {
    flex: 1;

    h4 {
      font-size: 20px;
      font-weight: 700;
      color: $color-g-21;
      margin-bottom: 2px;
    }
  }

  &__name {
    font-size: 13px;
    color: $color-g-54;
    margin-bottom: 8px;
  }

  &__desc {
    font-size: 13px;
    line-height: 1.5;
    color: $color-g-36;
    margin-bottom: 12px;
  }

  &__meta {
    display: flex;
    gap: 16px;
    margin-bottom: 10px;

    span {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      font-weight: 500;
      color: $color-g-54;
      svg { color: $sky-dark; }
    }
  }

  &__substances {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
}

.substance-tag {
  padding: 3px 10px;
  background: rgba($sky, 0.08);
  border-radius: 8px;
  font-size: 11px;
  font-weight: 500;
  color: $sky-dark;
  text-transform: capitalize;

  &--more {
    background: rgba($color-g-67, 0.1);
    color: $color-g-54;
  }
}

// ─── Assessment Form ──────────────────────────────────
.assessment-form-panel {
  max-width: 760px;
}

.form-progress {
  padding: 16px 28px;
  display: flex;
  align-items: center;
  gap: 14px;
  border-bottom: 1px solid rgba($color-g-92, 0.2);
  position: sticky;
  top: 64px;
  background: white;
  z-index: 1;

  &__bar {
    flex: 1;
    height: 6px;
    background: rgba($color-g-92, 0.2);
    border-radius: 3px;
    overflow: hidden;
  }

  &__fill {
    height: 100%;
    background: linear-gradient(90deg, $sky-dark, $emerald);
    border-radius: 3px;
    transition: width 0.3s ease;
  }

  &__text {
    font-size: 13px;
    font-weight: 600;
    color: $color-g-54;
    white-space: nowrap;
  }
}

.form-items {
  padding: 20px 28px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-item {
  padding: 20px;
  border: 1px solid rgba($color-g-92, 0.4);
  border-radius: 16px;
  transition: all 0.2s;

  &--answered {
    border-color: rgba($emerald, 0.3);
    background: rgba($emerald, 0.02);
  }

  &__header {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 14px;
  }

  &__number {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    background: rgba($sky, 0.1);
    color: $sky-dark;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 700;
    flex-shrink: 0;
  }

  &__name {
    font-size: 15px;
    font-weight: 700;
    color: $color-g-21;
    margin-bottom: 2px;
  }

  &__description {
    font-size: 13px;
    color: $color-g-54;
    line-height: 1.4;
    font-style: italic;
  }

  &__score {
    margin-left: auto;
    font-size: 18px;
    font-weight: 700;
    color: $sky-dark;
    flex-shrink: 0;
  }

  &__options {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
}

.option-label {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 14px;
  border: 1px solid rgba($color-g-92, 0.3);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: rgba($sky, 0.4);
    background: rgba($sky, 0.03);
  }

  &--selected {
    border-color: $sky-dark;
    background: rgba($sky, 0.06);
    box-shadow: 0 0 0 1px rgba($sky-dark, 0.15);
  }
}

.option-radio {
  display: none;
}

.option-value {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  background: rgba($color-g-92, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  color: $color-g-36;
  flex-shrink: 0;

  .option-label--selected & {
    background: $sky-dark;
    color: white;
  }
}

.option-text {
  font-size: 13px;
  color: $color-g-36;
  line-height: 1.4;
  padding-top: 3px;
}

// ─── Form Footer ──────────────────────────────────────
.form-footer {
  padding: 20px 28px;
  border-top: 1px solid rgba($color-g-92, 0.3);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  position: sticky;
  bottom: 0;
  background: white;
  border-radius: 0 0 20px 20px;
  z-index: 2;
}

.running-total {
  display: flex;
  align-items: center;
  gap: 10px;

  &__label {
    font-size: 13px;
    font-weight: 500;
    color: $color-g-54;
  }

  &__value {
    font-size: 22px;
    font-weight: 700;
    color: $color-g-21;
  }
}

.severity-text {
  &--mild { color: $amber; }
  &--moderate { color: #F97316; }
  &--moderately_severe { color: #EF4444; }
  &--severe { color: #DC2626; }
}

.severity-badge {
  padding: 4px 12px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 700;

  &--mild { background: $amber-light; color: darken($amber, 10%); }
  &--moderate { background: #FFEDD5; color: #C2410C; }
  &--moderately_severe { background: #FEE2E2; color: #DC2626; }
  &--severe { background: #FCA5A5; color: #991B1B; }

  &--lg {
    padding: 6px 16px;
    font-size: 14px;
    border-radius: 12px;
  }
}

.form-actions {
  display: flex;
  gap: 10px;
}

.cancel-btn {
  padding: 10px 20px;
  background: white;
  border: 1px solid rgba($color-g-92, 0.5);
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
  color: $color-g-54;
  cursor: pointer;
  transition: all 0.2s;
  &:hover { border-color: $rose; color: $rose; }
}

.submit-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 24px;
  background: linear-gradient(135deg, $emerald 0%, darken($emerald, 8%) 100%);
  border: none;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba($emerald, 0.3);

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba($emerald, 0.4);
  }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.btn-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

// ─── Result Panel ─────────────────────────────────────
.result-panel {
  max-width: 560px;
  padding: 32px;
}

.result-header {
  text-align: center;
  margin-bottom: 24px;

  h3 {
    font-size: 20px;
    font-weight: 700;
    color: $color-g-21;
    margin-bottom: 4px;
  }
}

.result-scale {
  font-size: 14px;
  color: $color-g-54;
}

.result-icon {
  width: 72px;
  height: 72px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;

  &--mild { background: $amber-light; color: $amber; }
  &--moderate { background: #FFEDD5; color: #F97316; }
  &--moderately_severe { background: #FEE2E2; color: #EF4444; }
  &--severe { background: #FCA5A5; color: #991B1B; }
}

.result-score-block {
  text-align: center;
  margin-bottom: 24px;
}

.result-score {
  font-size: 48px;
  font-weight: 700;
  color: $color-g-21;
  line-height: 1;
  margin-bottom: 8px;
}

.score-max {
  font-size: 0.5em;
  font-weight: 500;
  color: $color-g-67;
}

.clinical-action {
  padding: 16px;
  background: rgba($amber, 0.06);
  border: 1px solid rgba($amber, 0.2);
  border-radius: 12px;
  margin-bottom: 24px;

  h4 {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    font-weight: 700;
    color: darken($amber, 15%);
    margin-bottom: 8px;
    svg { color: $amber; }
  }

  p {
    font-size: 14px;
    line-height: 1.5;
    color: $color-g-36;
  }
}

.item-breakdown {
  margin-bottom: 24px;

  h4 {
    font-size: 14px;
    font-weight: 700;
    color: $color-g-21;
    margin-bottom: 12px;
  }
}

.breakdown-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid rgba($color-g-92, 0.15);

  &:last-child { border-bottom: none; }
}

.breakdown-name {
  font-size: 13px;
  color: $color-g-36;
  min-width: 140px;
  flex-shrink: 0;
}

.breakdown-bar-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
}

.breakdown-bar {
  flex: 1;
  height: 8px;
  background: rgba($color-g-92, 0.15);
  border-radius: 4px;
  overflow: hidden;

  &__fill {
    height: 100%;
    border-radius: 4px;
    transition: width 0.3s ease;
  }
}

.bar--low { background: $emerald; }
.bar--mild { background: $amber; }
.bar--moderate { background: #F97316; }
.bar--severe { background: $rose; }

.breakdown-score {
  font-size: 12px;
  font-weight: 600;
  color: $color-g-54;
  min-width: 36px;
  text-align: right;
}

.result-actions {
  display: flex;
  justify-content: center;
}

// ─── History Cards (matching RecoveryScreenings pattern) ──
.history-list {
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
  display: flex;
  align-items: center;
  justify-content: center;

  &--cows {
    background: linear-gradient(135deg, #FEE2E2, rgba(#DC2626, 0.15));
    color: #DC2626;
  }
  &--ciwa_ar {
    background: linear-gradient(135deg, $amber-light, rgba($amber, 0.2));
    color: #D97706;
  }
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

.administered-by {
  display: block;
  font-size: 11px;
  color: $color-g-67;
  font-style: italic;
}

.score-value {
  font-size: 24px;
  font-weight: 700;
  color: $color-g-21;
}

.risk-badge {
  padding: 4px 12px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 700;

  &--mild { background: rgba($amber, 0.1); color: darken($amber, 10%); }
  &--moderate { background: rgba(#F97316, 0.1); color: #C2410C; }
  &--moderately_severe { background: rgba($rose, 0.1); color: #DC2626; }
  &--severe { background: rgba(#DC2626, 0.1); color: #991B1B; }
}

.clinical-note {
  margin-top: 8px;
  padding: 8px 12px;
  background: rgba($amber, 0.06);
  border: 1px solid rgba($amber, 0.15);
  border-radius: 8px;
  font-size: 12px;
  color: $color-g-36;
  display: flex;
  align-items: flex-start;
  gap: 6px;
  svg { color: $amber; flex-shrink: 0; margin-top: 1px; }
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

.detail-heading {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: $color-g-21;
  margin-bottom: 10px;
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

// ─── Pagination ───────────────────────────────────────
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

// ─── Loading & Empty ──────────────────────────────────
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 20px;
  gap: 16px;
  span { font-size: 14px; color: $color-g-54; }
}

.loading-spinner {
  width: 36px;
  height: 36px;
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
  p { font-size: 14px; color: $color-g-54; max-width: 360px; }
}

@keyframes spin { to { transform: rotate(360deg); } }
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
