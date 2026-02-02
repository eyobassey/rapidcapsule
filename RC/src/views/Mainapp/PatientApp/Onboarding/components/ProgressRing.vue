<template>
  <div class="progress-ring-container" :style="containerStyle">
    <svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`">
      <!-- Background circle -->
      <circle
        :cx="center"
        :cy="center"
        :r="radius"
        :stroke="bgColor"
        :stroke-width="strokeWidth"
        fill="transparent"
      />
      <!-- Progress circle -->
      <circle
        class="progress-ring__circle"
        :cx="center"
        :cy="center"
        :r="radius"
        :stroke="progressColor"
        :stroke-width="strokeWidth"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="offset"
        stroke-linecap="round"
        fill="transparent"
      />
    </svg>
    <!-- Center content -->
    <div class="progress-ring-content">
      <slot>
        <span class="progress-value">{{ percent }}%</span>
      </slot>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  percent: {
    type: Number,
    default: 0,
    validator: (val) => val >= 0 && val <= 100,
  },
  size: {
    type: Number,
    default: 48,
  },
  strokeWidth: {
    type: Number,
    default: 6,
  },
  bgColor: {
    type: String,
    default: 'rgba(255, 255, 255, 0.2)',
  },
  progressColor: {
    type: String,
    default: '#ffffff',
  },
});

const center = computed(() => props.size / 2);
const radius = computed(() => (props.size - props.strokeWidth) / 2);
const circumference = computed(() => 2 * Math.PI * radius.value);
const offset = computed(() => {
  const progress = Math.min(100, Math.max(0, props.percent));
  return circumference.value - (progress / 100) * circumference.value;
});

const containerStyle = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
}));
</script>

<style scoped lang="scss">
.progress-ring-container {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.progress-ring__circle {
  transition: stroke-dashoffset 0.35s ease;
  transform: rotate(-90deg);
  transform-origin: 50% 50%;
}

.progress-ring-content {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.progress-value {
  font-size: 0.625rem;
  font-weight: 700;
  color: #1A365D;
}
</style>
