<template>
  <div class="step-hero">
    <div class="step-hero__content">
      <div class="step-hero__top">
        <button v-if="showBack" class="step-hero__back" @click="$emit('back')">
          <v-icon name="hi-arrow-left" />
        </button>
        <div v-if="step && totalSteps" class="step-hero__progress">
          <span class="step-hero__step">Step {{ step }} of {{ totalSteps }}</span>
          <div class="step-hero__bar">
            <div class="step-hero__fill" :style="{ width: progressPercent + '%' }"></div>
          </div>
        </div>
        <div v-else-if="badge" class="step-hero__badge">
          <v-icon :name="badgeIcon" />
          <span>{{ badge }}</span>
        </div>
      </div>
      <div class="step-hero__icon">
        <v-icon :name="icon" />
      </div>
      <h1 class="step-hero__title">{{ title }}</h1>
      <p class="step-hero__subtitle">{{ subtitle }}</p>
    </div>
    <div class="step-hero__decoration">
      <div class="decoration-circle decoration-circle--1"></div>
      <div class="decoration-circle decoration-circle--2"></div>
      <div class="decoration-circle decoration-circle--3"></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  step: {
    type: Number,
    default: null
  },
  totalSteps: {
    type: Number,
    default: 8
  },
  icon: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  subtitle: {
    type: String,
    default: ''
  },
  showBack: {
    type: Boolean,
    default: true
  },
  badge: {
    type: String,
    default: ''
  },
  badgeIcon: {
    type: String,
    default: 'hi-shield-check'
  }
});

defineEmits(['back']);

const progressPercent = computed(() => {
  if (!props.step || !props.totalSteps) return 0;
  return (props.step / props.totalSteps) * 100;
});
</script>

<style scoped lang="scss">
// Design System Colors
$sky: #4FC3F7;
$sky-light: #E1F5FE;
$sky-dark: #0288D1;
$sky-darker: #01579B;

.step-hero {
  position: relative;
  background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
  border-radius: 24px;
  padding: 24px 32px 32px;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(79, 195, 247, 0.3);

  @media (max-width: 640px) {
    padding: 20px 20px 28px;
    border-radius: 20px;
  }

  &__content {
    position: relative;
    z-index: 2;
  }

  &__top {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 20px;
  }

  &__back {
    width: 44px;
    height: 44px;
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
    border: none;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    flex-shrink: 0;

    @media (max-width: 640px) {
      width: 40px;
      height: 40px;
      border-radius: 12px;
    }

    &:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: translateX(-2px);
    }

    &:active {
      transform: scale(0.95);
    }

    svg {
      width: 22px;
      height: 22px;
      color: white;

      @media (max-width: 640px) {
        width: 20px;
        height: 20px;
      }
    }
  }

  &__progress {
    flex: 1;
  }

  &__step {
    font-size: 13px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.9);
    margin-bottom: 8px;
    display: block;
  }

  &__bar {
    height: 6px;
    background: rgba(255, 255, 255, 0.25);
    border-radius: 3px;
    overflow: hidden;
  }

  &__fill {
    height: 100%;
    background: white;
    border-radius: 3px;
    transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  }

  &__badge {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
    border-radius: 20px;
    margin-left: auto;

    svg {
      width: 16px;
      height: 16px;
      color: white;
    }

    span {
      font-size: 13px;
      font-weight: 600;
      color: white;
    }
  }

  &__icon {
    width: 80px;
    height: 80px;
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
    border-radius: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 20px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);

    @media (max-width: 640px) {
      width: 68px;
      height: 68px;
      border-radius: 20px;
    }

    svg {
      width: 40px;
      height: 40px;
      color: white;

      @media (max-width: 640px) {
        width: 34px;
        height: 34px;
      }
    }
  }

  &__title {
    font-size: 28px;
    font-weight: 700;
    color: white;
    margin: 0 0 8px 0;
    text-align: center;
    letter-spacing: -0.5px;

    @media (max-width: 640px) {
      font-size: 24px;
    }
  }

  &__subtitle {
    font-size: 15px;
    color: rgba(255, 255, 255, 0.9);
    margin: 0;
    text-align: center;
    max-width: 400px;
    margin: 0 auto;
    line-height: 1.5;

    @media (max-width: 640px) {
      font-size: 14px;
    }
  }

  &__decoration {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    overflow: hidden;
  }
}

.decoration-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);

  &--1 {
    width: 200px;
    height: 200px;
    top: -60px;
    right: -40px;
  }

  &--2 {
    width: 150px;
    height: 150px;
    bottom: -40px;
    left: -30px;
  }

  &--3 {
    width: 80px;
    height: 80px;
    top: 40%;
    right: 15%;
  }
}
</style>
