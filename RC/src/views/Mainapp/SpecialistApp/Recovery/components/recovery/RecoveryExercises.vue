<template>
  <div class="exercises-section">
    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner" />
      <span>Loading exercises...</span>
    </div>

    <!-- Content -->
    <template v-else-if="exercises.length">
      <!-- Stats Header -->
      <div class="stats-row">
        <div class="stat-chip">
          <v-icon name="hi-sparkles" scale="0.7" />
          <span><strong>{{ pagination.total }}</strong> Sessions</span>
        </div>
        <div class="stat-chip">
          <v-icon name="hi-check-circle" scale="0.7" />
          <span><strong>{{ completedCount }}</strong> Completed</span>
        </div>
        <div v-if="favoriteCategory" class="stat-chip">
          <v-icon name="hi-star" scale="0.7" />
          <span>Favorite: <strong>{{ capitalise(favoriteCategory) }}</strong></span>
        </div>
      </div>

      <!-- Exercise Cards -->
      <div class="exercise-list">
        <div
          v-for="(e, idx) in exercises"
          :key="e.id"
          class="exercise-card"
          :class="{ 'exercise-card--expanded': expanded[e.id] }"
          :style="{ animationDelay: `${idx * 0.06}s` }"
        >
          <!-- Card Header (clickable) -->
          <div class="exercise-card__header" @click="toggleExpand(e.id)">
            <div class="exercise-card__icon">
              <v-icon name="hi-sparkles" scale="1" />
            </div>
            <div class="exercise-card__info">
              <span class="exercise-name">{{ e.name }}</span>
              <span class="exercise-meta">
                {{ capitalise(e.category) }} &middot; {{ formatDate(e.date) }}
                <span v-if="e.estimated_minutes"> &middot; {{ e.estimated_minutes }} min</span>
              </span>
            </div>
            <span :class="['completion-badge', e.completed ? 'completion-badge--done' : 'completion-badge--partial']">
              {{ e.completed ? 'Completed' : 'Partial' }}
            </span>
            <div class="exercise-card__chevron">
              <v-icon :name="expanded[e.id] ? 'hi-chevron-up' : 'hi-chevron-down'" scale="0.8" />
            </div>
          </div>

          <!-- Collapsed Preview -->
          <div v-if="!expanded[e.id] && e.description" class="exercise-card__preview">
            {{ truncate(e.description, 120) }}
          </div>

          <!-- Expanded Report -->
          <div v-if="expanded[e.id]" class="exercise-card__report">
            <!-- Description -->
            <div v-if="e.description" class="report-section">
              <h5 class="report-heading">Description</h5>
              <p class="report-text">{{ e.description }}</p>
            </div>

            <!-- Steps -->
            <div v-if="e.steps?.length" class="report-section">
              <h5 class="report-heading">Steps</h5>
              <div class="steps-list">
                <div
                  v-for="(step, si) in e.steps"
                  :key="si"
                  :class="['step-item', isStepCompleted(e, si) ? 'step-item--done' : '']"
                >
                  <div class="step-item__num">
                    <v-icon v-if="isStepCompleted(e, si)" name="hi-check" scale="0.6" />
                    <span v-else>{{ si + 1 }}</span>
                  </div>
                  <span class="step-item__text">{{ step }}</span>
                </div>
              </div>
            </div>

            <!-- Outcome -->
            <div v-if="e.outcome" class="report-section">
              <h5 class="report-heading">Outcome</h5>
              <p class="report-text">{{ e.outcome }}</p>
            </div>

            <!-- Evidence Base -->
            <div v-if="e.evidence_base" class="report-section">
              <h5 class="report-heading">Evidence Base</h5>
              <p class="report-text report-text--muted">{{ e.evidence_base }}</p>
            </div>

            <!-- Conversation / Responses -->
            <div v-if="e.responses?.length" class="report-section">
              <h5 class="report-heading">Exercise Conversation</h5>
              <div class="conversation">
                <div
                  v-for="(msg, mi) in e.responses"
                  :key="mi"
                  :class="['message', `message--${msg.role}`]"
                >
                  <div class="message__label">
                    {{ msg.role === 'assistant' ? 'Eka' : 'Patient' }}
                  </div>
                  <div class="message__content">{{ msg.content }}</div>
                </div>
              </div>
            </div>

            <!-- Footer Meta -->
            <div class="report-meta">
              <span v-if="e.source" class="report-meta__item">
                Source: <strong>{{ capitalise(e.source) }}</strong>
              </span>
              <span v-if="e.completed_at" class="report-meta__item">
                Completed: <strong>{{ formatDate(e.completed_at) }}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="pagination.pages > 1" class="pagination">
        <button class="pagination-btn" :disabled="pagination.page <= 1" @click="fetchExercises(pagination.page - 1)">
          <v-icon name="hi-chevron-left" scale="0.8" /> Previous
        </button>
        <span class="pagination-info">Page {{ pagination.page }} of {{ pagination.pages }}</span>
        <button class="pagination-btn" :disabled="pagination.page >= pagination.pages" @click="fetchExercises(pagination.page + 1)">
          Next <v-icon name="hi-chevron-right" scale="0.8" />
        </button>
      </div>
    </template>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <v-icon name="hi-sparkles" scale="2.5" class="empty-icon" />
      <h3>No Exercises Yet</h3>
      <p>Coping exercise sessions will appear here when completed</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import apiFactory from '@/services/apiFactory';
import { useToast } from 'vue-toast-notification';

const props = defineProps({
  patientId: { type: String, required: true },
});

const $toast = useToast();
const loading = ref(false);
const exercises = ref([]);
const pagination = ref({ page: 1, limit: 10, total: 0, pages: 0 });
const expanded = reactive({});

onMounted(() => fetchExercises(1));
watch(() => props.patientId, () => fetchExercises(1));

const completedCount = computed(() => exercises.value.filter((e) => e.completed).length);

const favoriteCategory = computed(() => {
  if (!exercises.value.length) return null;
  const counts = {};
  exercises.value.forEach((e) => {
    if (e.category) counts[e.category] = (counts[e.category] || 0) + 1;
  });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] || null;
});

async function fetchExercises(page = 1) {
  loading.value = true;
  try {
    const res = await apiFactory.$_getPatientExerciseHistory(props.patientId, { page, limit: 10 });
    const result = res.data?.data || res.data?.result || res.data;
    exercises.value = result?.data || [];
    pagination.value = result?.pagination || { page: 1, limit: 10, total: 0, pages: 0 };
  } catch (err) {
    console.error('Error fetching exercises:', err);
    $toast.error('Failed to load exercises');
  } finally {
    loading.value = false;
  }
}

function toggleExpand(id) {
  expanded[id] = !expanded[id];
}

function isStepCompleted(exercise, stepIndex) {
  return exercise.completed_steps?.includes(stepIndex);
}

function truncate(str, len) {
  if (!str) return '';
  return str.length > len ? str.slice(0, len) + '...' : str;
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
$rose: #F43F5E;
$violet: #8B5CF6;

.exercises-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

// Stats Row
.stats-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.stat-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba($sky-light, 0.6);
  border: 1px solid rgba($sky, 0.15);
  border-radius: 12px;
  font-size: 13px;
  color: $color-g-36;

  svg { color: $sky-dark; }
  strong { color: $sky-dark; font-weight: 700; }
}

// Exercise Cards
.exercise-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.exercise-card {
  background: rgba(255,255,255,0.9);
  border: 1px solid rgba($color-g-92, 0.5);
  border-radius: 16px;
  animation: fadeSlideUp 0.4s ease forwards;
  opacity: 0;
  overflow: hidden;
  transition: border-color 0.2s, box-shadow 0.2s;

  &:hover {
    border-color: rgba($violet, 0.25);
  }

  &--expanded {
    border-color: rgba($violet, 0.3);
    box-shadow: 0 4px 20px rgba($violet, 0.08);
  }

  &__header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 18px;
    cursor: pointer;
    transition: background 0.15s;

    &:hover { background: rgba($violet, 0.02); }
  }

  &__icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: linear-gradient(135deg, rgba($violet, 0.1), rgba($violet, 0.2));
    display: flex;
    align-items: center;
    justify-content: center;
    color: $violet;
    flex-shrink: 0;
  }

  &__info {
    flex: 1;
    min-width: 0;
  }

  &__chevron {
    color: $color-g-67;
    flex-shrink: 0;
    transition: transform 0.2s;
  }

  &__preview {
    padding: 0 18px 14px;
    font-size: 13px;
    color: $color-g-54;
    line-height: 1.5;
  }

  &__report {
    padding: 0 18px 18px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    border-top: 1px solid rgba($color-g-92, 0.4);
    padding-top: 16px;
    margin: 0 18px 18px;
    padding: 16px 0 0;
  }
}

.exercise-name {
  display: block;
  font-size: 15px;
  font-weight: 700;
  color: $color-g-21;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.exercise-meta {
  display: block;
  font-size: 12px;
  color: $color-g-54;
  margin-top: 2px;
}

.completion-badge {
  padding: 4px 12px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;

  &--done { background: rgba($emerald, 0.1); color: $emerald; }
  &--partial { background: rgba($amber, 0.1); color: darken($amber, 10%); }
}

// Report Sections
.report-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.report-heading {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: $color-g-54;
  margin: 0;
}

.report-text {
  font-size: 14px;
  color: $color-g-36;
  line-height: 1.6;
  margin: 0;

  &--muted {
    font-size: 13px;
    color: $color-g-54;
    font-style: italic;
  }
}

// Steps List
.steps-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.step-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 14px;
  background: rgba($color-g-92, 0.08);
  border-radius: 10px;
  transition: background 0.2s;

  &--done {
    background: rgba($emerald, 0.06);
    .step-item__num { background: $emerald; color: #fff; }
    .step-item__text { color: $color-g-36; }
  }

  &__num {
    width: 24px;
    height: 24px;
    border-radius: 8px;
    background: rgba($color-g-67, 0.15);
    color: $color-g-54;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
    flex-shrink: 0;
  }

  &__text {
    font-size: 13px;
    color: $color-g-54;
    line-height: 1.5;
    padding-top: 2px;
  }
}

// Conversation
.conversation {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 400px;
  overflow-y: auto;
  padding: 4px;
}

.message {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 16px;
  border-radius: 14px;
  max-width: 90%;

  &--assistant {
    background: rgba($sky-light, 0.6);
    border: 1px solid rgba($sky, 0.12);
    align-self: flex-start;
  }

  &--user {
    background: rgba($violet, 0.06);
    border: 1px solid rgba($violet, 0.1);
    align-self: flex-end;
  }

  &__label {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    color: $color-g-67;
  }

  &__content {
    font-size: 13px;
    color: $color-g-21;
    line-height: 1.6;
    white-space: pre-wrap;
  }
}

// Report Meta
.report-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding-top: 12px;
  border-top: 1px solid rgba($color-g-92, 0.3);

  &__item {
    font-size: 12px;
    color: $color-g-54;
    strong { color: $color-g-36; }
  }
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
  .empty-icon { color: rgba($violet, 0.3); margin-bottom: 16px; }
  h3 { font-size: 18px; font-weight: 700; color: $color-g-21; margin-bottom: 8px; }
  p { font-size: 14px; color: $color-g-54; }
}

@keyframes spin { to { transform: rotate(360deg); } }
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
