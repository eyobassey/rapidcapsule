<template>
  <aside class="onboarding-sidebar">
    <div class="sidebar-content">
      <!-- Main Menu -->
      <h3 class="section-title">Main Menu</h3>
      <nav class="main-nav">
        <a
          href="#"
          class="nav-item active"
          @click.prevent
        >
          <v-icon name="fa-rocket" scale="0.9" />
          Setup Dashboard
        </a>
        <a href="#" class="nav-item disabled" @click.prevent>
          <v-icon name="ri-calendar-check-line" scale="0.9" />
          Appointments
        </a>
        <a href="#" class="nav-item disabled" @click.prevent>
          <v-icon name="hi-user-group" scale="0.9" />
          Patient Queue
        </a>
        <a href="#" class="nav-item disabled" @click.prevent>
          <v-icon name="bi-wallet2" scale="0.9" />
          Earnings
        </a>
      </nav>

      <!-- Setup Steps -->
      <h3 class="section-title mt-8">Setup Steps</h3>
      <div class="steps-container">
        <div
          v-for="step in steps"
          :key="step.number"
          class="step-item"
          :class="{ 'is-last': step.number === steps.length }"
        >
          <!-- Connector line -->
          <div
            v-if="step.number < steps.length"
            class="step-connector"
            :class="{ completed: getStepStatus(step.number) === 'completed' }"
          />

          <!-- Step indicator -->
          <div
            class="step-indicator"
            :class="getIndicatorClass(step.number)"
            @click="handleStepClick(step.number)"
          >
            <v-icon
              v-if="getStepStatus(step.number) === 'completed'"
              name="fa-check"
              scale="0.5"
            />
            <span v-else-if="getStepStatus(step.number) === 'current'" class="current-dot" />
            <span v-else class="step-number">{{ step.number }}</span>
          </div>

          <!-- Step label -->
          <div
            class="step-label"
            :class="getLabelClass(step.number)"
            @click="handleStepClick(step.number)"
          >
            {{ step.name }}
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Actions -->
    <div class="sidebar-footer">
      <button class="settings-btn">
        <v-icon name="hi-cog" scale="0.9" />
        Settings
      </button>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue';
import { useOnboardingState } from '../composables/useOnboardingState';

const {
  currentStep,
  stepMeta,
  getStepStatus,
  isStepAccessible,
  goToStep,
} = useOnboardingState();

const steps = computed(() => {
  return Object.entries(stepMeta).map(([num, meta]) => ({
    number: parseInt(num),
    ...meta,
  }));
});

const getIndicatorClass = (stepNum) => {
  const status = getStepStatus(stepNum);
  return {
    completed: status === 'completed',
    current: status === 'current',
    pending: status === 'pending',
    locked: status === 'locked',
    clickable: isStepAccessible(stepNum),
  };
};

const getLabelClass = (stepNum) => {
  const status = getStepStatus(stepNum);
  return {
    'is-completed': status === 'completed',
    'is-current': status === 'current',
    'is-locked': status === 'locked',
    clickable: isStepAccessible(stepNum),
  };
};

const handleStepClick = (stepNum) => {
  if (isStepAccessible(stepNum)) {
    goToStep(stepNum);
  }
};
</script>

<style scoped lang="scss">
.onboarding-sidebar {
  width: 288px;
  background: white;
  border-right: 1px solid #E2E8F0;
  display: flex;
  flex-direction: column;
  height: 100%;
  flex-shrink: 0;
}

.sidebar-content {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
}

.section-title {
  font-size: 0.75rem;
  font-weight: 700;
  color: #94A3B8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 1rem;
  padding: 0 0.5rem;
}

.mt-8 {
  margin-top: 2rem;
}

.main-nav {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.75rem;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748B;
  text-decoration: none;
  transition: all 0.2s;
}

.nav-item:hover:not(.disabled) {
  background: #F8FAFC;
  color: #475569;
}

.nav-item.active {
  background: rgba(79, 195, 247, 0.1);
  color: #0288D1;
  font-weight: 700;
  border: 1px solid rgba(79, 195, 247, 0.2);
}

.nav-item.disabled {
  color: #94A3B8;
  opacity: 0.6;
  cursor: not-allowed;
}

.steps-container {
  position: relative;
  padding-left: 0.5rem;
}

.step-item {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding-bottom: 1.5rem;
  padding-left: 2rem;
}

.step-item.is-last {
  padding-bottom: 0;
}

.step-connector {
  position: absolute;
  top: 1.5rem;
  left: 0.9375rem;
  bottom: 0;
  width: 2px;
  background-color: #E2E8F0;
  z-index: 0;
}

.step-connector.completed {
  background-color: #4CAF50;
}

.step-indicator {
  position: absolute;
  left: 0;
  top: 0.125rem;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.625rem;
  font-weight: 700;
  z-index: 10;
  border: 2px solid white;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
}

.step-indicator.completed {
  background: #4CAF50;
  color: white;
}

.step-indicator.current {
  background: white;
  border: 2px solid #4FC3F7;
  color: #4FC3F7;
  box-shadow: 0 0 15px rgba(79, 195, 247, 0.3);
}

.step-indicator.pending {
  background: #F1F5F9;
  border: 2px solid #E2E8F0;
  color: #94A3B8;
}

.step-indicator.locked {
  background: #F1F5F9;
  border: 2px solid #E2E8F0;
  color: #94A3B8;
}

.step-indicator.clickable {
  cursor: pointer;
}

.step-indicator.clickable:hover:not(.current) {
  transform: scale(1.1);
}

.current-dot {
  width: 0.5rem;
  height: 0.5rem;
  background: #4FC3F7;
  border-radius: 50%;
}

.step-number {
  font-size: 0.625rem;
}

.step-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #94A3B8;
  transition: all 0.2s;
}

.step-label.is-completed {
  color: #64748B;
  text-decoration: line-through;
  font-weight: 700;
}

.step-label.is-current {
  color: #1A365D;
  font-weight: 700;
}

.step-label.is-locked {
  color: #94A3B8;
}

.step-label.clickable {
  cursor: pointer;
}

.step-label.clickable:hover {
  color: #1A365D;
}

.sidebar-footer {
  padding: 1.5rem;
  border-top: 1px solid #F1F5F9;
}

.settings-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 0.5rem;
  background: transparent;
  border: none;
  color: #64748B;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.settings-btn:hover {
  background: #F8FAFC;
  color: #1A365D;
}
</style>
