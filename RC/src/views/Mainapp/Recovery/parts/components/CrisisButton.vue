<template>
  <Teleport to="body">
    <button
      class="crisis-fab"
      :class="{ 'crisis-fab--expanded': expanded }"
      @click="handleClick"
      @mouseenter="expanded = true"
      @mouseleave="expanded = false"
    >
      <div class="crisis-fab__pulse"></div>
      <v-icon name="hi-phone" :scale="expanded ? 1.1 : 1" />
      <span v-if="expanded" class="crisis-fab__label">Need Help Now?</span>
    </button>
  </Teleport>
</template>

<script setup>
import { ref } from "vue";

const emit = defineEmits(["activate"]);
const expanded = ref(false);

function handleClick() {
  emit("activate");
}
</script>

<style scoped lang="scss">
$rose: #F43F5E;
$rose-dark: #BE123C;
$white: #FFFFFF;

.crisis-fab {
  position: fixed;
  bottom: 90px;
  right: 20px;
  z-index: 900;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px;
  background: $rose;
  color: $white;
  border: none;
  border-radius: 16px;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba($rose, 0.4), 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  @media (min-width: 769px) {
    bottom: 32px;
    right: 32px;
  }

  &:hover {
    background: $rose-dark;
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.98);
  }

  &--expanded {
    padding: 14px 20px;
    border-radius: 16px;
  }

  &__pulse {
    position: absolute;
    inset: -4px;
    border-radius: 20px;
    border: 2px solid rgba($rose, 0.4);
    animation: fab-pulse 2s ease-in-out infinite;
    pointer-events: none;
  }

  &__label {
    font-size: 13px;
    font-weight: 600;
    white-space: nowrap;
    animation: fade-in 0.2s ease;
  }
}

@keyframes fab-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0; transform: scale(1.3); }
}

@keyframes fade-in {
  from { opacity: 0; transform: translateX(-4px); }
  to { opacity: 1; transform: translateX(0); }
}
</style>
