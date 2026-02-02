<template>
  <Teleport to="body">
    <div v-if="modelValue" class="dialog-overlay" @click.self="close">
      <div class="dialog">
        <h3>{{ title }}</h3>
        <p v-if="message">{{ message }}</p>

        <slot />

        <div class="dialog__actions">
          <button class="btn btn-secondary" :disabled="loading" @click="close">
            {{ cancelLabel }}
          </button>
          <button
            :class="['btn', `btn-${confirmVariant}`]"
            :disabled="loading || confirmDisabled"
            @click="$emit('confirm')"
          >
            <span v-if="loading" class="spinner" />
            {{ confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: 'Confirm Action' },
  message: { type: String, default: '' },
  confirmLabel: { type: String, default: 'Confirm' },
  cancelLabel: { type: String, default: 'Cancel' },
  confirmVariant: { type: String, default: 'primary' },
  loading: { type: Boolean, default: false },
  confirmDisabled: { type: Boolean, default: false },
});

const emit = defineEmits(['update:modelValue', 'confirm']);

function close() {
  emit('update:modelValue', false);
}
</script>

<style scoped lang="scss">
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.15s ease;
}

.dialog {
  background: $color-white;
  padding: $size-24;
  border-radius: $size-16;
  max-width: 420px;
  width: 90%;
  animation: slideUp 0.2s ease;

  h3 {
    font-size: $size-18;
    font-weight: $fw-semi-bold;
    color: $color-g-21;
    margin-bottom: $size-8;
  }

  > p {
    font-size: $size-14;
    color: $color-g-54;
    margin-bottom: $size-20;
    line-height: 1.5;
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: $size-12;
    margin-top: $size-20;
  }
}

.btn {
  padding: $size-10 $size-20;
  border-radius: $size-8;
  font-size: $size-14;
  font-weight: $fw-medium;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: $size-8;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &-primary {
    background: $color-pri;
    color: $color-white;

    &:hover:not(:disabled) {
      background: darken($color-pri, 10%);
    }
  }

  &-secondary {
    background: $color-g-92;
    color: $color-g-36;

    &:hover:not(:disabled) {
      background: $color-g-85;
    }
  }

  &-danger {
    background: #ef4444;
    color: $color-white;

    &:hover:not(:disabled) {
      background: darken(#ef4444, 10%);
    }
  }
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
