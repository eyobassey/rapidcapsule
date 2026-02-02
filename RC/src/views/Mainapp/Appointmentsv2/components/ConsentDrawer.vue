<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="isOpen" class="consent-drawer-overlay" @click.self="$emit('close')">
        <div class="consent-drawer">
          <div class="drawer-header">
            <h3 class="drawer-title">{{ title }}</h3>
            <button class="close-btn" @click="$emit('close')">
              <v-icon name="hi-x" scale="1" />
            </button>
          </div>
          <div class="drawer-content">
            <slot></slot>
          </div>
          <div class="drawer-footer">
            <button class="accept-btn" @click="$emit('accept')">
              I Understand & Accept
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
defineProps({
  isOpen: { type: Boolean, default: false },
  title: { type: String, default: '' },
});

defineEmits(['close', 'accept']);
</script>

<style scoped lang="scss">
$v2-sky: #4FC3F7;
$v2-sky-dark: #0288D1;

.consent-drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
  padding: 0;

  @media (min-width: 768px) {
    align-items: center;
    padding: 20px;
  }
}

.consent-drawer {
  width: 100%;
  max-width: 600px;
  max-height: 85vh;
  background: white;
  border-radius: 20px 20px 0 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  @media (min-width: 768px) {
    border-radius: 20px;
    max-height: 80vh;
  }
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #f3f4f6;
  flex-shrink: 0;
}

.drawer-title {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.close-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: #f3f4f6;
  border-radius: 10px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #e5e7eb;
    color: #1f2937;
  }
}

.drawer-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  font-size: 14px;
  color: #4b5563;
  line-height: 1.7;

  :deep(h4) {
    font-size: 16px;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 12px;
  }

  :deep(p) {
    margin: 0 0 16px;
  }

  :deep(ul) {
    margin: 0 0 16px;
    padding-left: 24px;

    li {
      margin-bottom: 8px;
    }
  }
}

.drawer-footer {
  padding: 16px 24px;
  border-top: 1px solid #f3f4f6;
  flex-shrink: 0;
}

.accept-btn {
  width: 100%;
  padding: 14px 24px;
  background: linear-gradient(135deg, $v2-sky 0%, $v2-sky-dark 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(79, 195, 247, 0.35);
  }
}

// Transitions
.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 0.3s ease;

  .consent-drawer {
    transition: transform 0.3s ease;
  }
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;

  .consent-drawer {
    transform: translateY(100%);

    @media (min-width: 768px) {
      transform: translateY(20px) scale(0.95);
    }
  }
}
</style>
