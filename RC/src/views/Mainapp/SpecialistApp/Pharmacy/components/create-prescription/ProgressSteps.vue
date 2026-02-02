<template>
  <div class="progress-steps">
    <div
      v-for="(step, index) in steps"
      :key="step.id"
      :class="['step', { active: currentStep === index, completed: currentStep > index }]"
    >
      <div class="step-number">
        <v-icon v-if="currentStep > index" name="hi-check" scale="0.8" />
        <span v-else>{{ index + 1 }}</span>
      </div>
      <span class="step-label">{{ step.label }}</span>
    </div>
    <div
      v-for="index in steps.length - 1"
      :key="`connector-${index}`"
      :class="['step-connector', { completed: currentStep >= index }]"
      :style="{ order: index * 2 - 1 }"
    />
  </div>
</template>

<script setup>
defineProps({
  steps: { type: Array, required: true },
  currentStep: { type: Number, default: 0 },
});
</script>

<style scoped lang="scss">
.progress-steps {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $size-12;
  padding: $size-20 $size-24;
  background: $color-white;
  border-radius: $size-12;
  margin-bottom: $size-24;

  @include responsive(phone) {
    gap: $size-8;
    padding: $size-16;
  }
}

.step {
  display: flex;
  align-items: center;
  gap: $size-10;

  .step-number {
    width: $size-32;
    height: $size-32;
    border-radius: 50%;
    background: $color-g-90;
    color: $color-g-54;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: $size-14;
    font-weight: $fw-semi-bold;
    transition: all 0.3s ease;
    flex-shrink: 0;
  }

  .step-label {
    font-size: $size-14;
    color: $color-g-54;
    white-space: nowrap;

    @include responsive(phone) {
      display: none;
    }
  }

  &.active .step-number {
    background: $color-pri;
    color: $color-white;
    box-shadow: 0 2px 8px rgba($color-pri, 0.3);
  }

  &.completed .step-number {
    background: #10b981;
    color: $color-white;
  }

  &.active .step-label,
  &.completed .step-label {
    color: $color-g-21;
    font-weight: $fw-medium;
  }
}

.step-connector {
  flex: 1;
  height: 2px;
  background: $color-g-85;
  max-width: 60px;
  transition: background 0.3s ease;

  &.completed {
    background: #10b981;
  }

  @include responsive(phone) {
    max-width: 24px;
  }
}
</style>
