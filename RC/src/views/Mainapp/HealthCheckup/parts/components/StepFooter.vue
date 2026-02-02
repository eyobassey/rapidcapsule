<template>
  <div class="step-footer">
    <button
      v-if="showBack"
      class="step-footer__btn step-footer__btn--back"
      @click="$emit('back')"
    >
      <v-icon name="hi-arrow-left" />
      <span>{{ backLabel }}</span>
    </button>
    <div v-else class="step-footer__spacer"></div>

    <button
      class="step-footer__btn step-footer__btn--next"
      :class="{ 'step-footer__btn--disabled': disabled, 'step-footer__btn--loading': loading }"
      :disabled="disabled || loading"
      @click="$emit('next')"
    >
      <span v-if="loading" class="step-footer__spinner"></span>
      <span v-else>{{ nextLabel }}</span>
      <v-icon v-if="!loading" name="hi-arrow-right" />
    </button>
  </div>
</template>

<script setup>
defineProps({
  showBack: {
    type: Boolean,
    default: true
  },
  backLabel: {
    type: String,
    default: 'Back'
  },
  nextLabel: {
    type: String,
    default: 'Continue'
  },
  disabled: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  }
});

defineEmits(['back', 'next']);
</script>

<style scoped lang="scss">
// Design System Colors
$sky: #4FC3F7;
$sky-dark: #0288D1;
$gray: #64748B;
$light-gray: #94A3B8;
$bg: #F8FAFC;

.step-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 16px 48px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  z-index: 100;

  @media (max-width: 768px) {
    padding: 16px 24px;
  }

  @media (max-width: 640px) {
    padding: 14px 16px;
  }

  &__spacer {
    flex: 1;
  }

  &__btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 14px 28px;
    border-radius: 14px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    @media (max-width: 640px) {
      padding: 12px 20px;
      font-size: 14px;
      border-radius: 12px;
    }

    svg {
      width: 18px;
      height: 18px;

      @media (max-width: 640px) {
        width: 16px;
        height: 16px;
      }
    }

    &--back {
      background: transparent;
      border: 2px solid rgba(0, 0, 0, 0.12);
      color: $gray;

      &:hover {
        border-color: rgba(0, 0, 0, 0.2);
        background: $bg;
        color: #334155;
      }

      &:active {
        transform: scale(0.98);
      }
    }

    &--next {
      background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
      border: none;
      color: white;
      box-shadow: 0 4px 14px rgba(79, 195, 247, 0.4);
      min-width: 140px;

      &:hover:not(:disabled) {
        box-shadow: 0 6px 20px rgba(79, 195, 247, 0.5);
        transform: translateY(-2px);
      }

      &:active:not(:disabled) {
        transform: scale(0.98);
      }
    }

    &--disabled {
      opacity: 0.5;
      cursor: not-allowed;
      box-shadow: none;

      &:hover {
        transform: none;
        box-shadow: none;
      }
    }

    &--loading {
      pointer-events: none;
    }
  }

  &__spinner {
    width: 18px;
    height: 18px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
