<template>
  <div :class="['stat-card', { clickable }]" @click="clickable && $emit('click')">
    <div v-if="icon" :class="['stat-card__icon', `stat-card__icon--${variant}`]">
      <v-icon :name="icon" scale="0.9" />
    </div>
    <div class="stat-card__content">
      <span :class="['stat-card__value', `stat-card__value--${variant}`]">{{ value }}</span>
      <span class="stat-card__label">{{ label }}</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  value: { type: [String, Number], default: 0 },
  label: { type: String, default: '' },
  icon: { type: String, default: '' },
  variant: { type: String, default: 'default' },
  clickable: { type: Boolean, default: false },
});

defineEmits(['click']);
</script>

<style scoped lang="scss">
.stat-card {
  background: $color-white;
  padding: $size-16 $size-20;
  border-radius: $size-12;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: $size-14;
  transition: box-shadow 0.2s ease;

  &.clickable {
    cursor: pointer;

    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    }
  }

  &__icon {
    width: $size-40;
    height: $size-40;
    border-radius: $size-10;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &--default {
      background: rgba($color-pri, 0.1);
      color: $color-pri;
    }

    &--warning {
      background: rgba(#f59e0b, 0.1);
      color: #d97706;
    }

    &--info {
      background: rgba(#3b82f6, 0.1);
      color: #2563eb;
    }

    &--success {
      background: rgba(#10b981, 0.1);
      color: #059669;
    }

    &--danger {
      background: rgba(#ef4444, 0.1);
      color: #dc2626;
    }
  }

  &__content {
    display: flex;
    flex-direction: column;
  }

  &__value {
    font-size: $size-22;
    font-weight: $fw-bold;
    color: $color-g-21;

    &--warning { color: #d97706; }
    &--info { color: #2563eb; }
    &--success { color: #059669; }
    &--danger { color: #dc2626; }
  }

  &__label {
    font-size: $size-12;
    color: $color-g-54;
    margin-top: $size-2;
  }
}
</style>
