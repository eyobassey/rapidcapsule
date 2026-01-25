<template>
  <div class="timeslot-grid">
    <h4 class="grid-title">Available Times</h4>
    <div v-if="loading" class="slots-loading">
      <loader :useOverlay="false" style="position: relative" />
    </div>
    <div v-else-if="slots.length" class="slots-container">
      <button
        v-for="slot in slots"
        :key="slot"
        class="time-slot"
        :class="{ selected: modelValue === slot }"
        @click="$emit('update:modelValue', slot)"
      >
        {{ formatTime(slot) }}
      </button>
    </div>
    <div v-else class="slots-empty">
      <v-icon name="hi-clock" scale="1.5" class="empty-icon" />
      <p>{{ emptyMessage }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import Loader from '@/components/Loader/main-loader.vue';

const props = defineProps({
  slots: { type: Array, default: () => [] },
  modelValue: { type: String, default: '' },
  loading: { type: Boolean, default: false },
  emptyMessage: { type: String, default: 'Select a date to view available times' },
});

defineEmits(['update:modelValue']);

const formatTime = (timeStr) => {
  if (!timeStr) return '';
  // If already formatted (e.g., "10:00 AM"), return as-is
  if (timeStr.includes('AM') || timeStr.includes('PM')) return timeStr;
  // Parse HH:mm format
  const [hours, minutes] = timeStr.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
};
</script>

<style scoped lang="scss">
.timeslot-grid {
  margin-top: 16px;
}

.grid-title {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 12px;
}

.slots-loading {
  display: flex;
  justify-content: center;
  padding: 24px 0;
}

.slots-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;

  @media (max-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.time-slot {
  padding: 12px 8px;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  background: white;
  color: #374151;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;

  &:hover {
    border-color: #0EAEC4;
    color: #0EAEC4;
  }

  &.selected {
    background: #0EAEC4;
    border-color: #0EAEC4;
    color: white;
    font-weight: 600;
  }
}

.slots-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px 16px;
  text-align: center;

  .empty-icon {
    color: #d1d5db;
  }

  p {
    font-size: 14px;
    color: #9ca3af;
    margin: 0;
  }
}
</style>
