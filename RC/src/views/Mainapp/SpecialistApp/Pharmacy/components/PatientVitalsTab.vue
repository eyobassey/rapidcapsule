<template>
  <div class="vitals-tab">
    <!-- Skeleton Loading -->
    <div v-if="loading" class="vitals-skeleton">
      <div v-for="i in 6" :key="i" class="skeleton-vital">
        <div class="skeleton-shimmer" />
      </div>
    </div>

    <!-- Vitals Content -->
    <div v-else-if="vitals.length" class="vitals-content">
      <!-- Stats Bar -->
      <div class="vitals-stats">
        <div class="stats-item">
          <span class="stats-value">{{ vitals.length }}</span>
          <span class="stats-label">Total Readings</span>
        </div>
        <div class="stats-item">
          <span class="stats-value">{{ getUniqueTypes }}</span>
          <span class="stats-label">Vital Types</span>
        </div>
        <div class="stats-item stats-item--highlight">
          <span class="stats-value">{{ getLatestDate }}</span>
          <span class="stats-label">Last Recorded</span>
        </div>
      </div>

      <!-- Vitals Grid -->
      <div class="vitals-grid">
        <div
          v-for="(vital, index) in vitals"
          :key="vital._id"
          :class="['vital-card', `vital-card--${getVitalColor(vital.type)}`, 'vital-card--clickable']"
          :style="{ animationDelay: `${index * 0.05}s` }"
          @click="handleVitalClick(vital)"
        >
          <div class="vital-card__header">
            <div class="vital-card__icon">
              <v-icon :name="getVitalIcon(vital.type)" scale="1.1" />
            </div>
            <div class="vital-card__actions">
              <div class="vital-card__badge">
                <v-icon name="hi-clock" scale="0.5" />
                {{ formatRelativeTime(vital.recorded_at) }}
              </div>
              <div class="vital-card__view-history" title="View history">
                <v-icon name="hi-chart-bar" scale="0.7" />
              </div>
            </div>
          </div>
          <div class="vital-card__body">
            <span class="vital-card__type">{{ formatVitalType(vital.type) }}</span>
            <div class="vital-card__value-container">
              <span class="vital-card__value">{{ vital.value }}</span>
              <span class="vital-card__unit">{{ vital.unit }}</span>
            </div>
          </div>
          <div class="vital-card__footer">
            <span class="vital-card__date">{{ formatDate(vital.recorded_at) }}</span>
            <span class="vital-card__trend-hint">
              <v-icon name="hi-trending-up" scale="0.6" />
              View trend
            </span>
          </div>
          <div class="vital-card__glow" />
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <div class="empty-state__visual">
        <div class="pulse-container">
          <div class="pulse-wave pulse-wave--1" />
          <div class="pulse-wave pulse-wave--2" />
          <div class="pulse-wave pulse-wave--3" />
          <div class="pulse-center">
            <v-icon name="hi-heart" scale="2" />
          </div>
        </div>
      </div>
      <div class="empty-state__content">
        <h3>No Vital Signs Recorded</h3>
        <p>Vital measurements will appear here when recorded</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { usePharmacy } from '../composables/usePharmacy';

const { formatDate } = usePharmacy();

const props = defineProps({
  vitals: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
});

const emit = defineEmits(['view-vital-history']);

const getUniqueTypes = computed(() => {
  const types = new Set(props.vitals.map(v => v.type));
  return types.size;
});

const getLatestDate = computed(() => {
  if (!props.vitals.length) return 'N/A';
  const sorted = [...props.vitals].sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at));
  return formatRelativeTime(sorted[0].recorded_at);
});

function handleVitalClick(vital) {
  emit('view-vital-history', vital.type);
}

function formatVitalType(type) {
  const types = {
    blood_pressure: 'Blood Pressure',
    heart_rate: 'Heart Rate',
    temperature: 'Temperature',
    weight: 'Weight',
    height: 'Height',
    blood_sugar: 'Blood Sugar',
    oxygen_saturation: 'SpO2',
    bmi: 'BMI',
    respiratory_rate: 'Resp. Rate',
  };
  return types[type] || type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
}

function getVitalIcon(type) {
  const icons = {
    blood_pressure: 'hi-heart',
    heart_rate: 'ri-pulse-line',
    temperature: 'fa-thermometer-half',
    weight: 'hi-scale',
    height: 'bi-rulers',
    blood_sugar: 'io-water-outline',
    oxygen_saturation: 'bi-lungs',
    bmi: 'hi-calculator',
    respiratory_rate: 'bi-lungs',
  };
  return icons[type] || 'hi-heart';
}

function getVitalColor(type) {
  const colors = {
    blood_pressure: 'rose',
    heart_rate: 'pink',
    temperature: 'orange',
    weight: 'blue',
    height: 'violet',
    blood_sugar: 'amber',
    oxygen_saturation: 'teal',
    bmi: 'indigo',
    respiratory_rate: 'cyan',
  };
  return colors[type] || 'sky';
}

function formatRelativeTime(date) {
  if (!date) return 'Unknown';
  const now = new Date();
  const recordedDate = new Date(date);
  const diffMs = now - recordedDate;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}
</script>

<style scoped lang="scss">
$sky: #4FC3F7;
$sky-light: #E1F5FE;
$sky-dark: #0288D1;
$emerald: #10B981;
$amber: #F59E0B;
$violet: #8B5CF6;
$rose: #F43F5E;
$rose-light: #FFE4E6;
$pink: #EC4899;
$orange: #F97316;
$blue: #3B82F6;
$indigo: #6366F1;
$teal: #14B8A6;
$cyan: #06B6D4;

.vitals-tab {
  min-height: 200px;
}

.vitals-skeleton {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
}

.skeleton-vital {
  height: 160px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba($color-g-92, 0.5);
  overflow: hidden;
  position: relative;
}

.skeleton-shimmer {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent 0%, rgba($sky, 0.08) 50%, transparent 100%);
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.vitals-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.vitals-stats {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba($color-g-92, 0.5);
  border-radius: 14px;
  overflow-x: auto;

  &::-webkit-scrollbar { display: none; }
}

.stats-item {
  display: flex;
  flex-direction: column;
  padding: 10px 20px;
  min-width: 120px;
  border-right: 1px solid rgba($color-g-92, 0.5);

  &:last-child {
    border-right: none;
  }

  .stats-value {
    font-size: 22px;
    font-weight: 700;
    color: $color-g-21;
  }

  .stats-label {
    font-size: 11px;
    color: $color-g-54;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  &--highlight {
    .stats-value {
      color: $sky-dark;
    }
  }
}

.vitals-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
}

.vital-card {
  position: relative;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba($color-g-92, 0.5);
  border-radius: 18px;
  padding: 20px;
  overflow: hidden;
  transition: all 0.3s ease;
  animation: fadeSlideUp 0.4s ease forwards;
  opacity: 0;

  &--clickable {
    cursor: pointer;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);

      .vital-card__glow {
        opacity: 1;
      }

      .vital-card__view-history {
        opacity: 1;
        transform: translateX(0);
      }

      .vital-card__trend-hint {
        opacity: 1;
      }
    }
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 14px;
  }

  &__icon {
    width: 44px;
    height: 44px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__badge {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    background: rgba($color-g-67, 0.08);
    border-radius: 12px;
    font-size: 10px;
    font-weight: 600;
    color: $color-g-54;
  }

  &__view-history {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: rgba($sky, 0.1);
    border-radius: 8px;
    color: $sky-dark;
    opacity: 0;
    transform: translateX(8px);
    transition: all 0.2s ease;
  }

  &__body {
    margin-bottom: 14px;
  }

  &__type {
    display: block;
    font-size: 12px;
    color: $color-g-54;
    font-weight: 500;
    margin-bottom: 6px;
  }

  &__value-container {
    display: flex;
    align-items: baseline;
    gap: 6px;
  }

  &__value {
    font-size: 28px;
    font-weight: 800;
    color: $color-g-21;
    line-height: 1;
  }

  &__unit {
    font-size: 13px;
    font-weight: 600;
    color: $color-g-54;
  }

  &__footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 12px;
    border-top: 1px solid rgba($color-g-92, 0.5);
  }

  &__date {
    font-size: 11px;
    color: $color-g-54;
  }

  &__trend-hint {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    font-weight: 500;
    color: $sky-dark;
    opacity: 0;
    transition: opacity 0.2s ease;

    svg {
      color: $sky-dark;
    }
  }

  &__glow {
    position: absolute;
    top: 0;
    right: 0;
    width: 120px;
    height: 120px;
    border-radius: 50%;
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
  }

  // Color variants
  &--rose {
    border-left: 4px solid $rose;
    .vital-card__icon { background: rgba($rose, 0.1); color: $rose; }
    .vital-card__glow { background: radial-gradient(circle, rgba($rose, 0.15) 0%, transparent 70%); }
  }

  &--pink {
    border-left: 4px solid $pink;
    .vital-card__icon { background: rgba($pink, 0.1); color: $pink; }
    .vital-card__glow { background: radial-gradient(circle, rgba($pink, 0.15) 0%, transparent 70%); }
  }

  &--orange {
    border-left: 4px solid $orange;
    .vital-card__icon { background: rgba($orange, 0.1); color: $orange; }
    .vital-card__glow { background: radial-gradient(circle, rgba($orange, 0.15) 0%, transparent 70%); }
  }

  &--blue {
    border-left: 4px solid $blue;
    .vital-card__icon { background: rgba($blue, 0.1); color: $blue; }
    .vital-card__glow { background: radial-gradient(circle, rgba($blue, 0.15) 0%, transparent 70%); }
  }

  &--violet {
    border-left: 4px solid $violet;
    .vital-card__icon { background: rgba($violet, 0.1); color: $violet; }
    .vital-card__glow { background: radial-gradient(circle, rgba($violet, 0.15) 0%, transparent 70%); }
  }

  &--amber {
    border-left: 4px solid $amber;
    .vital-card__icon { background: rgba($amber, 0.1); color: $amber; }
    .vital-card__glow { background: radial-gradient(circle, rgba($amber, 0.15) 0%, transparent 70%); }
  }

  &--teal {
    border-left: 4px solid $teal;
    .vital-card__icon { background: rgba($teal, 0.1); color: $teal; }
    .vital-card__glow { background: radial-gradient(circle, rgba($teal, 0.15) 0%, transparent 70%); }
  }

  &--indigo {
    border-left: 4px solid $indigo;
    .vital-card__icon { background: rgba($indigo, 0.1); color: $indigo; }
    .vital-card__glow { background: radial-gradient(circle, rgba($indigo, 0.15) 0%, transparent 70%); }
  }

  &--cyan {
    border-left: 4px solid $cyan;
    .vital-card__icon { background: rgba($cyan, 0.1); color: $cyan; }
    .vital-card__glow { background: radial-gradient(circle, rgba($cyan, 0.15) 0%, transparent 70%); }
  }

  &--sky {
    border-left: 4px solid $sky;
    .vital-card__icon { background: rgba($sky, 0.1); color: $sky-dark; }
    .vital-card__glow { background: radial-gradient(circle, rgba($sky, 0.15) 0%, transparent 70%); }
  }
}

@keyframes fadeSlideUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// Empty State
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 24px;
  text-align: center;

  &__visual {
    margin-bottom: 24px;
  }

  &__content {
    h3 {
      font-size: 18px;
      font-weight: 700;
      color: $color-g-21;
      margin-bottom: 8px;
    }

    p {
      font-size: 14px;
      color: $color-g-54;
    }
  }
}

.pulse-container {
  position: relative;
  width: 100px;
  height: 100px;
}

.pulse-wave {
  position: absolute;
  inset: 0;
  border: 2px solid $rose;
  border-radius: 50%;
  animation: pulse-wave 2s ease-out infinite;

  &--1 { animation-delay: 0s; }
  &--2 { animation-delay: 0.5s; }
  &--3 { animation-delay: 1s; }
}

.pulse-center {
  position: absolute;
  inset: 24px;
  background: linear-gradient(135deg, $rose-light 0%, rgba($rose, 0.15) 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $rose;
}

@keyframes pulse-wave {
  0% {
    transform: scale(0.5);
    opacity: 1;
  }
  100% {
    transform: scale(1.2);
    opacity: 0;
  }
}
</style>
