<template>
  <div class="booking-stepper">
    <div
      v-for="step in steps"
      :key="step.number"
      class="stepper-item"
      :class="{
        active: step.number === currentStep,
        completed: step.number < currentStep,
        disabled: step.number < minStep,
      }"
    >
      <div class="stepper-circle">
        <v-icon v-if="step.number < currentStep" name="hi-check" scale="0.8" />
        <span v-else>{{ step.number }}</span>
      </div>
      <span class="stepper-label">{{ step.label }}</span>
      <div v-if="step.number < 4" class="stepper-connector" :class="{ filled: step.number < currentStep }" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  currentStep: { type: Number, required: true },
  minStep: { type: Number, default: 1 },
});

const steps = computed(() => [
  { number: 1, label: 'Specialty' },
  { number: 2, label: 'Specialist' },
  { number: 3, label: 'Schedule' },
  { number: 4, label: 'Confirm' },
]);
</script>

<style scoped lang="scss">
.booking-stepper {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  gap: 0;
}

.stepper-item {
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;

  &.disabled {
    opacity: 0.4;
    pointer-events: none;
  }
}

.stepper-circle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  background: #e5e7eb;
  color: #6b7280;
  transition: all 0.3s ease;
  flex-shrink: 0;

  .active & {
    background: #0EAEC4;
    color: white;
    box-shadow: 0 4px 12px rgba(14, 174, 196, 0.3);
  }

  .completed & {
    background: #10b981;
    color: white;
  }

  @media (max-width: 480px) {
    width: 30px;
    height: 30px;
    font-size: 12px;
  }
}

.stepper-label {
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  white-space: nowrap;

  .active & {
    color: #0EAEC4;
    font-weight: 600;
  }

  .completed & {
    color: #10b981;
  }

  @media (max-width: 600px) {
    display: none;
  }
}

.stepper-connector {
  width: 40px;
  height: 2px;
  background: #e5e7eb;
  margin: 0 8px;
  transition: background 0.3s ease;

  &.filled {
    background: #10b981;
  }

  @media (max-width: 600px) {
    width: 24px;
    margin: 0 4px;
  }

  @media (max-width: 400px) {
    width: 16px;
  }
}
</style>
