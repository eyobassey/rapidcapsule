<template>
  <div class="tooltip-wrapper" @mouseenter="showTooltip" @mouseleave="hideTooltip">
    <slot></slot>
    <div v-if="visible" class="tooltip-content" :class="position">
      {{ text }}
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';

export default {
  name: 'Tooltip',
  props: {
    text: {
      type: String,
      required: true
    },
    position: {
      type: String,
      default: 'top',
      validator: (value) => ['top', 'bottom', 'left', 'right'].includes(value)
    }
  },
  setup() {
    const visible = ref(false);

    const showTooltip = () => {
      visible.value = true;
    };

    const hideTooltip = () => {
      visible.value = false;
    };

    return {
      visible,
      showTooltip,
      hideTooltip
    };
  }
};
</script>

<style scoped lang="scss">
.tooltip-wrapper {
  position: relative;
  display: inline-block;
}

.tooltip-content {
  position: absolute;
  z-index: 1000;
  background-color: $color-g-21;
  color: $color-white;
  padding: $size-8 $size-12;
  border-radius: $size-4;
  font-size: $size-12;
  white-space: normal;
  max-width: 250px;
  line-height: 1.4;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  pointer-events: none;

  @media (max-width: 768px) {
    max-width: 200px;
    font-size: $size-11;
    padding: $size-6 $size-10;
  }

  @media (max-width: 480px) {
    max-width: 150px;
    font-size: $size-10;
  }

  &.top {
    bottom: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%);

    &::after {
      content: '';
      position: absolute;
      top: 100%;
      left: 50%;
      margin-left: -5px;
      border-width: 5px;
      border-style: solid;
      border-color: $color-g-21 transparent transparent transparent;
    }
  }

  &.bottom {
    top: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%);

    &::after {
      content: '';
      position: absolute;
      bottom: 100%;
      left: 50%;
      margin-left: -5px;
      border-width: 5px;
      border-style: solid;
      border-color: transparent transparent $color-g-21 transparent;
    }
  }

  &.right {
    left: calc(100% + 8px);
    top: 50%;
    transform: translateY(-50%);

    &::after {
      content: '';
      position: absolute;
      right: 100%;
      top: 50%;
      margin-top: -5px;
      border-width: 5px;
      border-style: solid;
      border-color: transparent $color-g-21 transparent transparent;
    }
  }

  &.left {
    right: calc(100% + 8px);
    top: 50%;
    transform: translateY(-50%);

    &::after {
      content: '';
      position: absolute;
      left: 100%;
      top: 50%;
      margin-top: -5px;
      border-width: 5px;
      border-style: solid;
      border-color: transparent transparent transparent $color-g-21;
    }
  }
}
</style>
