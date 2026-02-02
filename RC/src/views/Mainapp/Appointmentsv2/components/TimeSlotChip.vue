<template>
  <button
    class="time-slot-chip"
    :class="{
      selected: isSelected,
      limited: availability === 'limited',
      unavailable: availability === 'unavailable',
      'just-booked': showJustBooked,
    }"
    :disabled="availability === 'unavailable'"
    @click="$emit('select')"
  >
    <span class="slot-time">{{ time }}</span>
    <span class="slot-indicator" v-if="availability !== 'unavailable'">
      <span class="dot" :class="availability"></span>
      <span class="availability-text" v-if="availability === 'limited'">Few left</span>
    </span>
    <span class="just-booked-flash" v-if="showJustBooked">Just Booked</span>
  </button>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  time: { type: String, required: true },
  availability: { type: String, default: 'available' }, // available, limited, unavailable
  isSelected: { type: Boolean, default: false },
  justBooked: { type: Boolean, default: false },
});

defineEmits(['select']);

const showJustBooked = ref(false);

let flashTimeout = null;

onMounted(() => {
  if (props.justBooked) {
    showJustBooked.value = true;
    flashTimeout = setTimeout(() => {
      showJustBooked.value = false;
    }, 3000);
  }
});

onUnmounted(() => {
  if (flashTimeout) {
    clearTimeout(flashTimeout);
  }
});
</script>

<style scoped lang="scss">
$v2-sky: #4FC3F7;
$v2-sky-light: #E1F5FE;
$v2-sky-dark: #0288D1;
$v2-success: #4CAF50;
$v2-orange: #FF9800;
$v2-orange-light: #FFF3E0;

.time-slot-chip {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 14px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 90px;

  &:hover:not(:disabled) {
    border-color: $v2-sky;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(79, 195, 247, 0.12);
  }

  &.selected {
    border-color: $v2-sky;
    background: $v2-sky-light;

    .slot-time {
      color: $v2-sky-dark;
      font-weight: 700;
    }
  }

  &.limited {
    border-color: rgba($v2-orange, 0.3);

    &:hover:not(:disabled) {
      border-color: $v2-orange;
    }

    &.selected {
      background: $v2-orange-light;
      border-color: $v2-orange;

      .slot-time {
        color: $v2-orange;
      }
    }
  }

  &.unavailable {
    opacity: 0.5;
    cursor: not-allowed;
    background: #f9fafb;

    .slot-time {
      text-decoration: line-through;
      color: #9ca3af;
    }
  }

  &.just-booked {
    animation: flash-orange 0.5s ease 3;
  }
}

.slot-time {
  font-size: 15px;
  font-weight: 600;
  color: #374151;
  transition: all 0.2s ease;
}

.slot-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;

  &.available {
    background: $v2-success;
  }

  &.limited {
    background: $v2-orange;
  }
}

.availability-text {
  font-size: 10px;
  color: $v2-orange;
  font-weight: 500;
}

.just-booked-flash {
  position: absolute;
  top: -8px;
  right: -8px;
  padding: 3px 8px;
  background: $v2-orange;
  color: white;
  font-size: 9px;
  font-weight: 700;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  animation: pulse-badge 1s ease infinite;
}

@keyframes flash-orange {
  0%, 100% {
    border-color: #e5e7eb;
  }
  50% {
    border-color: $v2-orange;
    background: $v2-orange-light;
  }
}

@keyframes pulse-badge {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}
</style>
