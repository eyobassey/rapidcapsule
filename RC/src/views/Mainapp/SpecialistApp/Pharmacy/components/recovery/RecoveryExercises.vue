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
          :style="{ animationDelay: `${idx * 0.06}s` }"
        >
          <div class="exercise-card__header">
            <div class="exercise-card__icon">
              <v-icon name="hi-sparkles" scale="1" />
            </div>
            <div class="exercise-card__info">
              <span class="exercise-name">{{ e.name }}</span>
              <span class="exercise-meta">
                {{ capitalise(e.category) }} &middot; {{ formatDate(e.date) }}
              </span>
            </div>
            <span :class="['completion-badge', e.completed ? 'completion-badge--done' : 'completion-badge--partial']">
              {{ e.completed ? 'Completed' : 'Partial' }}
            </span>
          </div>

          <!-- Details Row -->
          <div class="exercise-card__details">
            <div v-if="e.duration_minutes" class="detail-item">
              <v-icon name="hi-clock" scale="0.6" />
              <span>{{ e.duration_minutes }} min</span>
            </div>
            <div v-if="e.mood_before != null" class="detail-item">
              <span class="detail-label">Mood Before:</span>
              <span class="detail-value">{{ e.mood_before }}/10</span>
            </div>
            <div v-if="e.mood_after != null" class="detail-item">
              <span class="detail-label">Mood After:</span>
              <span :class="['detail-value', moodImproved(e) ? 'detail-value--up' : '']">
                {{ e.mood_after }}/10
                <span v-if="moodImproved(e)" class="mood-arrow">&#x2191;</span>
              </span>
            </div>
          </div>

          <!-- Description -->
          <div v-if="e.description" class="exercise-card__desc">
            {{ e.description }}
          </div>

          <!-- Notes -->
          <div v-if="e.notes" class="exercise-card__notes">
            <v-icon name="hi-annotation" scale="0.65" />
            <span>{{ e.notes }}</span>
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
import { ref, computed, onMounted, watch } from 'vue';
import apiFactory from '@/services/apiFactory';
import { useToast } from 'vue-toast-notification';

const props = defineProps({
  patientId: { type: String, required: true },
});

const $toast = useToast();
const loading = ref(false);
const exercises = ref([]);
const pagination = ref({ page: 1, limit: 10, total: 0, pages: 0 });

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

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function capitalise(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');
}

function moodImproved(e) {
  return e.mood_after != null && e.mood_before != null && e.mood_after > e.mood_before;
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
  padding: 18px;
  background: rgba(255,255,255,0.9);
  border: 1px solid rgba($color-g-92, 0.5);
  border-radius: 16px;
  animation: fadeSlideUp 0.4s ease forwards;
  opacity: 0;

  &__header {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: linear-gradient(135deg, rgba(#8B5CF6, 0.1), rgba(#8B5CF6, 0.2));
    display: flex;
    align-items: center;
    justify-content: center;
    color: #8B5CF6;
    flex-shrink: 0;
  }

  &__info {
    flex: 1;
  }

  &__details {
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
    margin-top: 14px;
    padding: 12px;
    background: rgba($color-g-92, 0.1);
    border-radius: 10px;
  }

  &__desc {
    margin-top: 10px;
    font-size: 13px;
    color: $color-g-54;
    line-height: 1.5;
  }

  &__notes {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    margin-top: 10px;
    padding: 10px 14px;
    background: rgba($sky-light, 0.4);
    border-radius: 10px;
    font-size: 13px;
    color: $color-g-36;
    svg { color: $color-g-67; flex-shrink: 0; margin-top: 2px; }
  }
}

.exercise-name {
  display: block;
  font-size: 15px;
  font-weight: 700;
  color: $color-g-21;
}

.exercise-meta {
  display: block;
  font-size: 12px;
  color: $color-g-54;
}

.completion-badge {
  padding: 4px 12px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 700;

  &--done { background: rgba($emerald, 0.1); color: $emerald; }
  &--partial { background: rgba($amber, 0.1); color: darken($amber, 10%); }
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: $color-g-36;

  svg { color: $color-g-54; }
}

.detail-label { color: $color-g-54; font-weight: 500; }
.detail-value { font-weight: 600; &--up { color: $emerald; } }
.mood-arrow { font-size: 14px; }

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
  .empty-icon { color: rgba(#8B5CF6, 0.3); margin-bottom: 16px; }
  h3 { font-size: 18px; font-weight: 700; color: $color-g-21; margin-bottom: 8px; }
  p { font-size: 14px; color: $color-g-54; }
}

@keyframes spin { to { transform: rotate(360deg); } }
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
