<template>
  <div class="empty-state">
    <div class="empty-state__icon">
      <v-icon :name="icon" scale="2" />
    </div>
    <h3>{{ title }}</h3>
    <p v-if="message">{{ message }}</p>
    <button v-if="actionLabel" class="empty-state__action" @click="$emit('action')">
      <v-icon v-if="actionIcon" :name="actionIcon" scale="0.8" />
      {{ actionLabel }}
    </button>
  </div>
</template>

<script setup>
defineProps({
  icon: { type: String, default: 'hi-clipboard-list' },
  title: { type: String, default: 'No data found' },
  message: { type: String, default: '' },
  actionLabel: { type: String, default: '' },
  actionIcon: { type: String, default: '' },
});

defineEmits(['action']);
</script>

<style scoped lang="scss">
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $size-48 $size-24;
  text-align: center;

  &__icon {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    background: $color-g-95;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: $size-16;
    color: $color-g-54;
  }

  h3 {
    font-size: $size-18;
    font-weight: $fw-semi-bold;
    color: $color-g-36;
    margin-bottom: $size-8;
  }

  p {
    font-size: $size-14;
    color: $color-g-54;
    max-width: 300px;
  }

  &__action {
    margin-top: $size-20;
    padding: $size-10 $size-20;
    background: $color-pri;
    color: $color-white;
    border: none;
    border-radius: $size-8;
    font-size: $size-14;
    font-weight: $fw-medium;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: $size-8;
    transition: background 0.2s ease;

    &:hover {
      background: darken($color-pri, 10%);
    }
  }
}
</style>
