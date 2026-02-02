<template>
  <div class="v2-wizard-stepper">
    <!-- Progress Track -->
    <div class="progress-track">
      <div class="progress-fill" :style="{ width: progressWidth }"></div>
    </div>

    <!-- Step Items -->
    <div class="steps-container">
      <div
        v-for="step in steps"
        :key="step.number"
        class="step-item"
        :class="{
          active: step.number === currentStep,
          completed: step.number < currentStep,
        }"
        @click="$emit('step-click', step.number)"
      >
        <div class="step-circle">
          <v-icon v-if="step.number < currentStep" name="hi-check" scale="0.75" />
          <span v-else>{{ step.number }}</span>
        </div>
        <span class="step-label">{{ step.label }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  currentStep: { type: Number, required: true },
  steps: { type: Array, required: true },
});

defineEmits(['step-click']);

const progressWidth = computed(() => {
  // Calculate progress based on current step
  // Step 1 = 0%, Step 2 = 20%, ..., Step 6 = 100%
  const totalSteps = props.steps.length;
  if (props.currentStep === 1) return '0%';
  const percentage = ((props.currentStep - 1) / (totalSteps - 1)) * 100;
  return `${percentage}%`;
});
</script>

<style scoped lang="scss">
// V2 Colors
$v2-sky: #4FC3F7;
$v2-sky-light: #E1F5FE;
$v2-sky-dark: #0288D1;
$v2-success: #4CAF50;
$v2-navy: #1A365D;

.v2-wizard-stepper {
  position: relative;
  padding: 24px 32px;
  background: white;
  border-bottom: 1px solid #f1f5f9;

  @media (max-width: 768px) {
    padding: 16px 20px;
  }

  @media (max-width: 480px) {
    padding: 12px 16px;
  }
}

.progress-track {
  position: absolute;
  top: 16px; // Center of step circle (32px / 2)
  left: 48px; // Start after first circle
  right: 48px; // End before last circle
  height: 4px;
  background: #e2e8f0;
  border-radius: 2px;
  z-index: 0;

  @media (max-width: 768px) {
    left: 32px;
    right: 32px;
    top: 14px;
    height: 3px;
  }
}

.progress-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: linear-gradient(90deg, $v2-sky 0%, $v2-sky-dark 100%);
  border-radius: 2px;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.steps-container {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  width: 100%;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(.completed):not(.active) {
    .step-circle {
      border-color: $v2-sky;
    }
    .step-label {
      color: $v2-navy;
    }
  }
}

.step-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  background: white;
  border: 2px solid #e2e8f0;
  color: #94a3b8;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;

  .active & {
    background: $v2-sky;
    border-color: $v2-sky;
    color: white;
    box-shadow: 0 0 0 4px $v2-sky-light, 0 4px 12px rgba(79, 195, 247, 0.3);
  }

  .completed & {
    background: $v2-success;
    border-color: $v2-success;
    color: white;
  }

  @media (max-width: 480px) {
    width: 28px;
    height: 28px;
    font-size: 11px;
  }
}

.step-label {
  font-size: 10px;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
  transition: color 0.2s ease;

  .active & {
    color: $v2-sky-dark;
    font-weight: 700;
  }

  .completed & {
    color: $v2-success;
  }

  @media (max-width: 768px) {
    display: none;
  }
}
</style>
