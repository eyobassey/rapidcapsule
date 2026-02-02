<template>
  <div class="checkups-tab">
    <!-- Skeleton Loading -->
    <div v-if="loading" class="checkups-skeleton">
      <div v-for="i in 3" :key="i" class="skeleton-checkup" />
    </div>

    <!-- Checkups List -->
    <div v-else-if="checkups.length" class="checkups-list">
      <div
        v-for="checkup in checkups"
        :key="checkup._id"
        class="checkup-card"
      >
        <div class="checkup-card__accent" />
        <div class="checkup-card__body">
          <div class="checkup-card__header">
            <span class="checkup-date">
              <v-icon name="hi-calendar" scale="0.65" />
              {{ formatDate(checkup.created_at) }}
            </span>
            <span :class="['triage-badge', `triage-badge--${getTriageClass(checkup.triage_level)}`]">
              {{ formatTriageLevel(checkup.triage_level) }}
            </span>
          </div>

          <div class="checkup-card__content">
            <span class="condition-label">Primary Condition</span>
            <p class="condition-name">{{ checkup.primary_condition || 'No diagnosis' }}</p>
          </div>

          <div v-if="checkup.symptoms?.length" class="checkup-card__symptoms">
            <span class="symptoms-label">Symptoms</span>
            <div class="symptoms-tags">
              <span
                v-for="symptom in getVisibleSymptoms(checkup)"
                :key="symptom.id || symptom.name"
                class="symptom-tag"
              >
                {{ symptom.name }}
              </span>
              <button
                v-if="checkup.symptoms.length > 3"
                class="more-tag"
                @click="toggleSymptoms(checkup._id)"
              >
                {{ isExpanded(checkup._id) ? 'Show less' : `+${checkup.symptoms.length - 3} more` }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <div class="empty-state__icon">
        <v-icon name="hi-shield-check" scale="1.8" />
      </div>
      <h3>No health checkups recorded</h3>
      <p>No AI health checkups have been performed for this patient</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { usePharmacy } from '../composables/usePharmacy';

const { formatDate } = usePharmacy();

defineProps({
  checkups: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
});

const expandedCheckups = ref({});

function isExpanded(checkupId) {
  return expandedCheckups.value[checkupId] || false;
}

function toggleSymptoms(checkupId) {
  expandedCheckups.value = {
    ...expandedCheckups.value,
    [checkupId]: !expandedCheckups.value[checkupId],
  };
}

function getVisibleSymptoms(checkup) {
  if (isExpanded(checkup._id)) return checkup.symptoms;
  return checkup.symptoms.slice(0, 3);
}

function getTriageClass(level) {
  if (!level) return 'unknown';
  const l = level.toLowerCase();
  if (l.includes('emergency')) return 'emergency';
  if (l.includes('24')) return 'urgent';
  if (l.includes('consultation')) return 'consultation';
  if (l.includes('self')) return 'self-care';
  return 'unknown';
}

function formatTriageLevel(level) {
  if (!level) return 'N/A';
  return level.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}
</script>

<style scoped lang="scss">
.checkups-skeleton {
  display: flex;
  flex-direction: column;
  gap: $size-14;
}

.skeleton-checkup {
  height: 160px;
  border-radius: $size-16;
  background: linear-gradient(90deg, $color-g-92 25%, $color-g-97 50%, $color-g-92 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.checkups-list {
  display: flex;
  flex-direction: column;
  gap: $size-14;
}

.checkup-card {
  display: flex;
  border-radius: $size-16;
  overflow: hidden;
  background: $color-white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }

  &__accent {
    width: 4px;
    background: #0EAEC4;
    flex-shrink: 0;
  }

  &__body {
    flex: 1;
    padding: $size-20;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $size-14;

    .checkup-date {
      display: flex;
      align-items: center;
      gap: $size-6;
      font-size: $size-13;
      color: $color-g-54;

      svg {
        color: $color-g-67;
      }
    }
  }

  &__content {
    margin-bottom: $size-14;

    .condition-label {
      font-size: $size-11;
      color: $color-g-54;
      font-weight: $fw-medium;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: block;
      margin-bottom: $size-4;
    }

    .condition-name {
      font-size: $size-16;
      font-weight: $fw-semi-bold;
      color: $color-g-21;
    }
  }

  &__symptoms {
    padding-top: $size-14;
    border-top: 1px solid $color-g-92;

    .symptoms-label {
      font-size: $size-11;
      color: $color-g-54;
      font-weight: $fw-medium;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: block;
      margin-bottom: $size-8;
    }

    .symptoms-tags {
      display: flex;
      flex-wrap: wrap;
      gap: $size-6;
    }

    .symptom-tag {
      font-size: $size-12;
      padding: $size-4 $size-12;
      background: rgba(#0EAEC4, 0.06);
      border-radius: $size-16;
      color: #0891b2;
      font-weight: $fw-medium;
    }

    .more-tag {
      font-size: $size-12;
      padding: $size-4 $size-12;
      background: $color-g-92;
      border-radius: $size-16;
      color: $color-g-44;
      border: none;
      cursor: pointer;
      font-weight: $fw-medium;
      transition: all 0.2s ease;

      &:hover {
        background: rgba(14, 174, 196, 0.1);
        color: #0EAEC4;
      }
    }
  }
}

.triage-badge {
  font-size: $size-11;
  padding: $size-4 $size-12;
  border-radius: $size-16;
  font-weight: $fw-semi-bold;

  &--emergency {
    background: rgba(#ef4444, 0.08);
    color: #dc2626;
  }

  &--urgent {
    background: rgba(#f59e0b, 0.08);
    color: #d97706;
  }

  &--consultation {
    background: rgba(#3b82f6, 0.08);
    color: #2563eb;
  }

  &--self-care {
    background: rgba(#10b981, 0.08);
    color: #059669;
  }

  &--unknown {
    background: $color-g-92;
    color: $color-g-54;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $size-48 $size-24;
  text-align: center;

  &__icon {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    background: rgba(#0EAEC4, 0.08);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: $size-16;

    svg {
      color: #0EAEC4;
    }
  }

  h3 {
    font-size: $size-16;
    font-weight: $fw-semi-bold;
    color: $color-g-36;
    margin-bottom: $size-6;
  }

  p {
    font-size: $size-14;
    color: $color-g-54;
  }
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
