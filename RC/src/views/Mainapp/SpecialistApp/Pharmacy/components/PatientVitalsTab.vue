<template>
  <div class="vitals-tab">
    <!-- Skeleton Loading -->
    <div v-if="loading" class="vitals-skeleton">
      <div v-for="i in 6" :key="i" class="skeleton-vital" />
    </div>

    <!-- Vitals Grid -->
    <div v-else-if="vitals.length" class="vitals-grid">
      <div
        v-for="vital in vitals"
        :key="vital._id"
        class="vital-card"
      >
        <div :class="['vital-card__icon', `vital-card__icon--${getVitalColor(vital.type)}`]">
          <v-icon :name="getVitalIcon(vital.type)" scale="1.1" />
        </div>
        <div class="vital-card__info">
          <h4>{{ formatVitalType(vital.type) }}</h4>
          <p class="vital-value">{{ vital.value }} <span class="unit">{{ vital.unit }}</span></p>
          <p class="vital-date">
            <v-icon name="hi-clock" scale="0.55" />
            {{ formatDate(vital.recorded_at) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <div class="empty-state__icon">
        <v-icon name="hi-heart" scale="1.8" />
      </div>
      <h3>No vital signs recorded</h3>
      <p>No vital sign measurements have been recorded for this patient</p>
    </div>
  </div>
</template>

<script setup>
import { usePharmacy } from '../composables/usePharmacy';

const { formatDate } = usePharmacy();

defineProps({
  vitals: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
});

function formatVitalType(type) {
  const types = {
    blood_pressure: 'Blood Pressure',
    heart_rate: 'Heart Rate',
    temperature: 'Temperature',
    weight: 'Weight',
    height: 'Height',
    blood_sugar: 'Blood Sugar',
    oxygen_saturation: 'Oxygen Saturation',
  };
  return types[type] || type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
}

function getVitalIcon(type) {
  const icons = {
    blood_pressure: 'hi-heart',
    heart_rate: 'hi-heart',
    temperature: 'fa-thermometer-half',
    weight: 'hi-scale',
    height: 'bi-rulers',
    blood_sugar: 'io-water-outline',
    oxygen_saturation: 'bi-lungs',
  };
  return icons[type] || 'hi-heart';
}

function getVitalColor(type) {
  const colors = {
    blood_pressure: 'red',
    heart_rate: 'pink',
    temperature: 'orange',
    weight: 'blue',
    height: 'purple',
    blood_sugar: 'amber',
    oxygen_saturation: 'teal',
  };
  return colors[type] || 'default';
}
</script>

<style scoped lang="scss">
.vitals-skeleton {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $size-14;

  @include responsive(tab-landscape) {
    grid-template-columns: repeat(2, 1fr);
  }

  @include responsive(phone) {
    grid-template-columns: 1fr;
  }
}

.skeleton-vital {
  height: 110px;
  border-radius: $size-16;
  background: linear-gradient(90deg, $color-g-92 25%, $color-g-97 50%, $color-g-92 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.vitals-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $size-14;

  @include responsive(tab-landscape) {
    grid-template-columns: repeat(2, 1fr);
  }

  @include responsive(phone) {
    grid-template-columns: 1fr;
  }
}

.vital-card {
  display: flex;
  gap: $size-14;
  background: $color-white;
  padding: $size-16;
  border-radius: $size-16;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    transform: translateY(-1px);
  }

  &__icon {
    width: $size-48;
    height: $size-48;
    border-radius: $size-12;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &--red {
      background: rgba(#ef4444, 0.08);
      color: #ef4444;
    }

    &--pink {
      background: rgba(#ec4899, 0.08);
      color: #ec4899;
    }

    &--orange {
      background: rgba(#f97316, 0.08);
      color: #f97316;
    }

    &--blue {
      background: rgba(#3b82f6, 0.08);
      color: #3b82f6;
    }

    &--purple {
      background: rgba(#8b5cf6, 0.08);
      color: #8b5cf6;
    }

    &--amber {
      background: rgba(#f59e0b, 0.08);
      color: #f59e0b;
    }

    &--teal {
      background: rgba(#0EAEC4, 0.08);
      color: #0EAEC4;
    }

    &--default {
      background: rgba(#0EAEC4, 0.08);
      color: #0EAEC4;
    }
  }

  &__info {
    flex: 1;
    min-width: 0;

    h4 {
      font-size: $size-12;
      font-weight: $fw-medium;
      color: $color-g-54;
      margin-bottom: $size-4;
    }

    .vital-value {
      font-size: $size-20;
      font-weight: $fw-bold;
      color: $color-g-21;

      .unit {
        font-size: $size-12;
        font-weight: $fw-medium;
        color: $color-g-54;
      }
    }

    .vital-date {
      display: flex;
      align-items: center;
      gap: $size-4;
      font-size: $size-11;
      color: $color-g-67;
      margin-top: $size-6;

      svg {
        color: $color-g-67;
      }
    }
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
