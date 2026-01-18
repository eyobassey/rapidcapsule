<template>
  <div class="date-picker-container">
    <label v-if="label" class="date-picker-label">{{ label }}</label>
    <DatePicker
      v-model="internalValue"
      :mode="mode"
      :min-date="minDate"
      :max-date="maxDate"
      :is-expanded="expanded"
      :expanded="expanded"
      :attributes="attributes"
      borderless
      transparent
    />
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { DatePicker } from 'v-calendar'
import 'v-calendar/style.css'

const props = defineProps({
  modelValue: { type: [Date, String], default: null },
  label: { type: String, default: '' },
  mode: { type: String, default: 'date' },
  minDate: { type: Date, default: null },
  maxDate: { type: Date, default: null },
  expanded: { type: Boolean, default: true },
  appointmentDates: { type: Array, default: () => [] }
})

const emit = defineEmits(['update:modelValue'])

const internalValue = ref(props.modelValue)

// Create attributes for dates with appointments with popover
const attributes = computed(() => {
  if (!props.appointmentDates || props.appointmentDates.length === 0) {
    return []
  }

  // Group dates by day to count appointments per day
  const dateGroups = props.appointmentDates.reduce((acc, date) => {
    const dateStr = new Date(date).toDateString()
    if (!acc[dateStr]) {
      acc[dateStr] = []
    }
    acc[dateStr].push(date)
    return acc
  }, {})

  // Create attributes with popovers
  return Object.entries(dateGroups).map(([dateStr, dates]) => ({
    dot: {
      color: 'blue',
      class: 'appointment-dot'
    },
    popover: {
      label: dates.length === 1
        ? '1 appointment scheduled'
        : `${dates.length} appointments scheduled`,
      visibility: 'hover',
      hideIndicator: false
    },
    dates: new Date(dateStr)
  }))
})

watch(() => props.modelValue, (newValue) => {
  internalValue.value = newValue
})

watch(internalValue, (newValue) => {
  emit('update:modelValue', newValue)
})
</script>

<style scoped>
.date-picker-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  background: #fff;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 6px;
}

.date-picker-label {
  font-size: 14px;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  margin-bottom: 4px;
}

/* V-Calendar custom styling */
:deep(.vc-container) {
  border: none;
  font-family: inherit;
}

:deep(.vc-header) {
  padding: 8px 0;
}

:deep(.vc-weeks) {
  padding: 0;
}

:deep(.vc-day) {
  min-height: 32px;
}

:deep(.vc-highlights) {
  z-index: 0;
}

/* Make selected date highlight transparent so date number is visible */
:deep(.vc-highlight) {
  background-color: rgba(var(--v-theme-primary), 0.3) !important;
}

/* Today's date border */
:deep(.vc-day.is-today) {
  .vc-day-content {
    border: 1px solid rgb(var(--v-theme-primary));
  }
}

/* Ensure day content text is visible on highlighted dates */
:deep(.vc-day-content) {
  color: rgb(var(--v-theme-on-surface));
  font-weight: 500;
}

/* Style the appointment indicator dots */
:deep(.vc-dot) {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #2196F3;
}

/* Position dots below the date number */
:deep(.vc-dots) {
  display: flex;
  justify-content: center;
  gap: 2px;
  margin-top: 2px;
}

/* Hover effect for dates */
:deep(.vc-day:hover .vc-day-content) {
  background-color: rgba(var(--v-theme-primary), 0.1);
  border-radius: 4px;
}

/* Hover effect for dates with dots */
:deep(.vc-day:has(.vc-dots):hover) {
  .vc-dot {
    transform: scale(1.3);
    transition: transform 0.2s ease;
  }
}

/* Popover styling */
:deep(.vc-popover-content) {
  background-color: rgba(33, 33, 33, 0.95) !important;
  color: white !important;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

:deep(.vc-popover-content *) {
  color: white !important;
}

:deep(.vc-popover-caret) {
  display: none;
}
</style>
