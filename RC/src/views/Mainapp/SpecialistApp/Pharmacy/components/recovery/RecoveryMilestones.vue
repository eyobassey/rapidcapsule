<template>
  <div class="milestones-section">
    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner" />
      <span>Loading milestones...</span>
    </div>

    <!-- Content -->
    <template v-else-if="milestones.length">
      <div class="milestone-timeline">
        <div
          v-for="(m, idx) in milestones"
          :key="m.id"
          class="milestone-card"
          :style="{ animationDelay: `${idx * 0.06}s` }"
        >
          <!-- Timeline Connector -->
          <div class="milestone-card__timeline">
            <div :class="['milestone-dot', m.celebrated ? 'milestone-dot--celebrated' : 'milestone-dot--pending']">
              <v-icon :name="milestoneIcon(m.type)" scale="0.6" />
            </div>
            <div v-if="idx < milestones.length - 1" class="timeline-line" />
          </div>

          <!-- Card Content -->
          <div class="milestone-card__content">
            <div class="milestone-card__header">
              <div>
                <span class="milestone-title">{{ m.title || formatType(m.type) }}</span>
                <span class="milestone-date">{{ formatDate(m.date) }}</span>
              </div>
              <div class="milestone-card__badges">
                <span v-if="m.celebrated" class="celebrated-badge">
                  <v-icon name="hi-star" scale="0.55" /> Celebrated
                </span>
                <span class="type-badge">{{ formatType(m.type) }}</span>
              </div>
            </div>

            <div v-if="m.description" class="milestone-card__desc">
              {{ m.description }}
            </div>

            <div class="milestone-card__details">
              <div v-if="m.value != null" class="detail-item">
                <span class="detail-label">Achieved</span>
                <span class="detail-value">{{ m.value }}</span>
              </div>
              <div v-if="m.target_value != null" class="detail-item">
                <span class="detail-label">Target</span>
                <span class="detail-value">{{ m.target_value }}</span>
              </div>
              <div v-if="m.celebrated_at" class="detail-item">
                <span class="detail-label">Celebrated</span>
                <span class="detail-value">{{ formatDate(m.celebrated_at) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <v-icon name="hi-star" scale="2.5" class="empty-icon" />
      <h3>No Milestones Yet</h3>
      <p>Recovery milestones will appear here as the patient achieves them</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import apiFactory from '@/services/apiFactory';
import { useToast } from 'vue-toast-notification';

const props = defineProps({
  patientId: { type: String, required: true },
});

const $toast = useToast();
const loading = ref(false);
const milestones = ref([]);

onMounted(() => fetchMilestones());
watch(() => props.patientId, () => fetchMilestones());

async function fetchMilestones() {
  loading.value = true;
  try {
    const res = await apiFactory.$_getPatientMilestones(props.patientId);
    const result = res.data?.data || res.data?.result || res.data;
    milestones.value = result?.data || [];
  } catch (err) {
    console.error('Error fetching milestones:', err);
    $toast.error('Failed to load milestones');
  } finally {
    loading.value = false;
  }
}

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatType(type) {
  if (!type) return 'Milestone';
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function milestoneIcon(type) {
  const icons = {
    sobriety_days: 'hi-calendar',
    screening_improvement: 'hi-trending-up',
    goals_achieved: 'hi-check-circle',
    journal_streak: 'hi-pencil',
    appointment_streak: 'hi-video-camera',
    companion_sessions: 'hi-heart',
    exercise_streak: 'hi-lightning-bolt',
    custom: 'hi-star',
  };
  return icons[type] || 'hi-star';
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

.milestones-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

// Timeline
.milestone-timeline {
  display: flex;
  flex-direction: column;
}

.milestone-card {
  display: flex;
  gap: 16px;
  animation: fadeSlideUp 0.4s ease forwards;
  opacity: 0;

  &__timeline {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 20px;
    min-width: 36px;
  }

  &__content {
    flex: 1;
    padding: 18px;
    background: rgba(255,255,255,0.9);
    border: 1px solid rgba($color-g-92, 0.5);
    border-radius: 16px;
    margin-bottom: 12px;
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 8px 24px rgba(0,0,0,0.06);
      transform: translateY(-1px);
    }
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    flex-wrap: wrap;
  }

  &__badges {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  &__desc {
    margin-top: 10px;
    font-size: 13px;
    color: $color-g-54;
    line-height: 1.5;
  }

  &__details {
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
    margin-top: 12px;
    padding: 12px;
    background: rgba($color-g-92, 0.1);
    border-radius: 10px;
  }
}

.milestone-dot {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &--celebrated {
    background: linear-gradient(135deg, $amber-light, rgba($amber, 0.3));
    color: darken($amber, 10%);
    box-shadow: 0 4px 12px rgba($amber, 0.3);
  }

  &--pending {
    background: rgba($color-g-92, 0.3);
    color: $color-g-54;
  }
}

.timeline-line {
  width: 2px;
  flex: 1;
  min-height: 20px;
  background: linear-gradient(180deg, rgba($color-g-92, 0.6) 0%, rgba($color-g-92, 0.2) 100%);
}

.milestone-title {
  display: block;
  font-size: 16px;
  font-weight: 700;
  color: $color-g-21;
}

.milestone-date {
  display: block;
  font-size: 12px;
  color: $color-g-54;
  margin-top: 2px;
}

.celebrated-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: rgba($amber, 0.1);
  border-radius: 10px;
  font-size: 11px;
  font-weight: 700;
  color: darken($amber, 10%);
}

.type-badge {
  padding: 4px 10px;
  background: rgba($sky, 0.08);
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  color: $sky-dark;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.detail-label { font-size: 11px; color: $color-g-54; font-weight: 500; }
.detail-value { font-size: 15px; font-weight: 700; color: $color-g-21; }

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
  .empty-icon { color: rgba($amber, 0.3); margin-bottom: 16px; }
  h3 { font-size: 18px; font-weight: 700; color: $color-g-21; margin-bottom: 8px; }
  p { font-size: 14px; color: $color-g-54; }
}

@keyframes spin { to { transform: rotate(360deg); } }
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
