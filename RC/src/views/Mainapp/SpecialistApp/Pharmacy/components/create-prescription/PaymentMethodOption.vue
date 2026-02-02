<template>
  <div
    :class="['payment-option', { selected: isSelected, disabled: disabled }]"
    @click="handleClick"
  >
    <div :class="['option-icon', iconClass]">
      <v-icon :name="icon" scale="1.1" />
    </div>
    <div class="option-info">
      <h4>{{ title }}</h4>
      <p class="description">{{ description }}</p>
      <slot name="details" />
    </div>
    <div v-if="isSelected" class="option-check">
      <v-icon name="hi-check-circle" scale="1.1" />
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  title: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, default: 'bi-wallet2' },
  iconClass: { type: String, default: '' },
  isSelected: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
});

const emit = defineEmits(['select']);

function handleClick() {
  if (!props.disabled) {
    emit('select');
  }
}
</script>

<style scoped lang="scss">
.payment-option {
  display: flex;
  align-items: center;
  gap: $size-16;
  padding: $size-16;
  border: 2px solid $color-g-90;
  border-radius: $size-12;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(.disabled) {
    border-color: $color-g-77;
  }

  &.selected {
    border-color: $color-pri;
    background: rgba($color-pri, 0.03);
  }

  &.disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .option-icon {
    width: $size-48;
    height: $size-48;
    border-radius: $size-12;
    background: $color-g-95;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $color-g-44;
    flex-shrink: 0;

    &.patient-wallet {
      background: rgba(#10b981, 0.1);
      color: #10b981;
    }

    &.self-service {
      background: rgba(#8b5cf6, 0.1);
      color: #8b5cf6;
    }
  }

  .option-info {
    flex: 1;
    min-width: 0;

    h4 {
      font-size: $size-15;
      font-weight: $fw-medium;
      color: $color-g-21;
      margin-bottom: $size-2;
    }

    .description {
      font-size: $size-12;
      color: $color-g-54;
    }
  }

  .option-check {
    color: $color-pri;
    flex-shrink: 0;
  }
}
</style>
