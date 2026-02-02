<template>
  <div class="page-header">
    <div class="page-header__left">
      <button class="back-btn" @click="handleBack">
        <v-icon name="hi-arrow-left" scale="0.9" />
      </button>
      <div class="header-text">
        <h1>{{ title }}</h1>
        <p v-if="subtitle">{{ subtitle }}</p>
      </div>
    </div>
    <div v-if="$slots.action" class="page-header__action">
      <slot name="action" />
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const props = defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  backTo: { type: String, default: '' },
});

const router = useRouter();

function handleBack() {
  if (props.backTo) {
    router.push(props.backTo);
  } else {
    router.back();
  }
}
</script>

<style scoped lang="scss">
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $size-24;

  &__left {
    display: flex;
    align-items: center;
    gap: $size-16;
  }

  .back-btn {
    width: $size-40;
    height: $size-40;
    border-radius: 50%;
    border: none;
    background: $color-white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    transition: background 0.2s ease;

    &:hover {
      background: $color-g-95;
    }
  }

  .header-text {
    h1 {
      font-size: $size-22;
      font-weight: $fw-semi-bold;
      color: $color-g-21;
    }

    p {
      font-size: $size-14;
      color: $color-g-54;
      margin-top: $size-2;
    }
  }
}
</style>
