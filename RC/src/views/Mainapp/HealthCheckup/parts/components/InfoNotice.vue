<template>
  <div class="info-notice" :class="'info-notice--' + type">
    <div class="info-notice__icon">
      <v-icon :name="iconName" />
    </div>
    <div class="info-notice__content">
      <p v-if="title" class="info-notice__title">{{ title }}</p>
      <p class="info-notice__text">
        <slot>{{ text }}</slot>
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  type: {
    type: String,
    default: 'info', // info, warning, success, ai
    validator: (value) => ['info', 'warning', 'success', 'ai'].includes(value)
  },
  title: {
    type: String,
    default: ''
  },
  text: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: ''
  }
});

const iconName = computed(() => {
  if (props.icon) return props.icon;

  const icons = {
    info: 'hi-information-circle',
    warning: 'hi-exclamation',
    success: 'hi-check-circle',
    ai: 'hi-light-bulb'
  };
  return icons[props.type] || icons.info;
});
</script>

<style scoped lang="scss">
.info-notice {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 18px;
  border-radius: 16px;
  border: 1px solid;

  @media (max-width: 640px) {
    padding: 14px;
    gap: 12px;
    border-radius: 14px;
  }

  &__icon {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;

    @media (max-width: 640px) {
      width: 36px;
      height: 36px;
      border-radius: 10px;
    }

    svg {
      width: 22px;
      height: 22px;

      @media (max-width: 640px) {
        width: 20px;
        height: 20px;
      }
    }
  }

  &__content {
    flex: 1;
    min-width: 0;
  }

  &__title {
    font-size: 15px;
    font-weight: 600;
    margin: 0 0 4px 0;

    @media (max-width: 640px) {
      font-size: 14px;
    }
  }

  &__text {
    font-size: 13px;
    margin: 0;
    line-height: 1.5;

    @media (max-width: 640px) {
      font-size: 12px;
    }
  }

  // Type variants
  &--info {
    background: linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%);
    border-color: #BAE6FD;

    .info-notice__icon {
      background: linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%);

      svg {
        color: white;
      }
    }

    .info-notice__title {
      color: #0369A1;
    }

    .info-notice__text {
      color: #0C4A6E;
    }
  }

  &--warning {
    background: linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%);
    border-color: #FDE047;

    .info-notice__icon {
      background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);

      svg {
        color: white;
      }
    }

    .info-notice__title {
      color: #B45309;
    }

    .info-notice__text {
      color: #78350F;
    }
  }

  &--success {
    background: linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%);
    border-color: #86EFAC;

    .info-notice__icon {
      background: linear-gradient(135deg, #10B981 0%, #059669 100%);

      svg {
        color: white;
      }
    }

    .info-notice__title {
      color: #047857;
    }

    .info-notice__text {
      color: #064E3B;
    }
  }

  &--ai {
    background: linear-gradient(135deg, #FAF5FF 0%, #F3E8FF 100%);
    border-color: #D8B4FE;

    .info-notice__icon {
      background: linear-gradient(135deg, #A855F7 0%, #9333EA 100%);

      svg {
        color: white;
      }
    }

    .info-notice__title {
      color: #7C3AED;
    }

    .info-notice__text {
      color: #6B21A8;
    }
  }
}
</style>
