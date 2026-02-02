<template>
  <div class="step-progress">
    <div class="step-progress-container">
      <div
        v-for="(step, index) in steps"
        :key="step.key"
        class="step"
        :class="{
          completed: stepCompletion[step.key],
          current: isCurrentStep(step.key),
          clickable: true,
        }"
        @click="navigateToStep(step.stepNumber)"
      >
        <!-- Connector Line (before step, except first) -->
        <div
          v-if="index > 0"
          class="step-connector"
          :class="{ completed: isStepCompleted(index - 1) }"
        />

        <!-- Step Circle -->
        <div class="step-circle">
          <v-icon v-if="stepCompletion[step.key]" name="fa-check" scale="0.5" />
          <div v-else-if="isCurrentStep(step.key)" class="current-dot" />
          <span v-else class="step-number">{{ index + 1 }}</span>
        </div>

        <!-- Step Label (show on desktop, hide on mobile) -->
        <span class="step-label">{{ step.shortLabel || step.label }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { usePatientOnboardingState } from '../composables/usePatientOnboardingState';

const { stepCompletion, goToStep } = usePatientOnboardingState();

const steps = [
  { key: 'personalDetails', label: 'Personal Details', shortLabel: 'Personal', stepNumber: 2 },
  { key: 'addressEmergency', label: 'Address & Emergency', shortLabel: 'Address', stepNumber: 3 },
  { key: 'dependants', label: 'Dependants', shortLabel: 'Family', stepNumber: 4 },
  { key: 'vitalsMetrics', label: 'Vitals & Metrics', shortLabel: 'Vitals', stepNumber: 5 },
  { key: 'allergies', label: 'Allergies', shortLabel: 'Allergies', stepNumber: 6 },
  { key: 'medicalHistory', label: 'Medical History', shortLabel: 'History', stepNumber: 7 },
  { key: 'deviceIntegration', label: 'Devices & Apps', shortLabel: 'Devices', stepNumber: 8 },
  { key: 'walletCredits', label: 'Wallet & Credits', shortLabel: 'Credits', stepNumber: 9 },
];

const isCurrentStep = (key) => {
  for (const step of steps) {
    if (!stepCompletion[step.key]) {
      return step.key === key;
    }
  }
  return false;
};

const isStepCompleted = (index) => {
  return stepCompletion[steps[index].key];
};

const navigateToStep = (stepNumber) => {
  goToStep(stepNumber);
};
</script>

<style scoped lang="scss">
.step-progress {
  background: white;
  border-bottom: 1px solid #E2E8F0;
  padding: 1rem 2rem;

  @media (max-width: 1024px) {
    display: none; // Hide on mobile, use header drawer instead
  }
}

.step-progress-container {
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 900px;
  margin: 0 auto;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  flex: 1;
  cursor: pointer;

  &:hover {
    .step-circle {
      transform: scale(1.1);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .step-label {
      color: #1A365D;
    }
  }

  // Completed state
  &.completed {
    .step-circle {
      background: #10B981;
      border-color: #10B981;
      color: white;
    }

    .step-label {
      color: #10B981;
    }
  }

  // Current state
  &.current {
    .step-circle {
      background: white;
      border-color: #4FC3F7;
      box-shadow: 0 0 0 4px rgba(79, 195, 247, 0.2);
    }

    .step-label {
      font-weight: 700;
      color: #0288D1;
    }
  }
}

.step-connector {
  position: absolute;
  top: 14px;
  right: 50%;
  width: 100%;
  height: 2px;
  background: #E2E8F0;
  z-index: 0;
  transition: background 0.3s ease;

  &.completed {
    background: #10B981;
  }
}

.step-circle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #F8FAFC;
  border: 2px solid #E2E8F0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  transition: all 0.2s ease;
}

.step-number {
  font-size: 0.6875rem;
  font-weight: 700;
  color: #94A3B8;
}

.current-dot {
  width: 10px;
  height: 10px;
  background: #4FC3F7;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.7;
  }
}

.step-label {
  margin-top: 0.5rem;
  font-size: 0.6875rem;
  font-weight: 500;
  color: #94A3B8;
  text-align: center;
  white-space: nowrap;
  transition: color 0.2s;

  @media (max-width: 1200px) {
    font-size: 0.625rem;
  }
}
</style>
