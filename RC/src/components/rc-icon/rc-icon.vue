<template>
  <button
    :class="['icon-button', sizeModifier, { 'icon-button-disabled': disabled }]"
    :disabled="disabled"
    :title="title"
    @click="!disabled && emit('click')"
    :style="sx"
  >
    <svg class="icon" :viewBox="viewBox">
      <use :xlink:href="`${sprite}#${iconName || icon}`"></use>
    </svg>
  </button>
</template>

<script setup>
import { ref, computed } from 'vue';
import sprite from '@/assets/sprite.svg';

const emit = defineEmits(['click']);
const props = defineProps({
  size: { type: String, default: 'md', validator: (value) => ['sm', 'md', 'xs', 'lg'].includes(value) },
  iconName: { type: String, required: false },
  icon: { type: String, required: false },
  disabled: { type: Boolean, default: false },
  title: { type: String, default: '' },
  viewBox: { type: String, default: '0 0 24 24' },
  sx: { type: Object, default: () => ({}) }
});

const sizeModifier = computed(() => `icon-button-${props.size}`);

</script>

<style scoped lang="scss">
.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  background-color: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  outline: none;

  &.icon-button-sm {
    padding: 4px;
  }

  &.icon-button-md {
    padding: 8px;
  }

  &.icon-button-xs {
    padding: 2px;
  }

  &.icon-button-lg {
    padding: 12px;
  }

  &.icon-button-disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .icon {
    width: 16px;
    height: 16px;
    fill: currentColor;
  }
}
</style>
