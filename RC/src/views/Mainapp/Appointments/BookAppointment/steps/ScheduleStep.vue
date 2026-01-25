<template>
  <div class="schedule-step">
    <!-- Hero Banner -->
    <div class="booking-hero">
      <div class="hero-icon-wrapper">
        <v-icon name="hi-calendar" scale="1.8" class="hero-icon" />
      </div>
      <div class="hero-text">
        <h2 class="hero-title">Pick a Date &amp; Time</h2>
        <p class="hero-desc">Select your preferred date, time slot, and meeting channel for your consultation.</p>
      </div>
    </div>

    <!-- Reschedule header -->
    <div v-if="booking.mode === 'reschedule'" class="reschedule-header">
      <v-icon name="hi-refresh" scale="0.9" />
      <span>Rescheduling with <strong>{{ booking.specialist.full_name }}</strong></span>
    </div>

    <div class="schedule-layout">
      <!-- Left: Calendar + Timezone -->
      <div class="schedule-left">
        <h4 class="section-label">Select Date</h4>
        <div class="calendar-wrapper">
          <rc-calendar
            v-model="selectedDate"
            :minDate="today"
            :multiple="false"
            :expanded="true"
          />
        </div>

        <div class="timezone-section">
          <label class="timezone-label">Timezone</label>
          <select v-model="booking.schedule.timezone" class="timezone-select">
            <option v-for="tz in timezones" :key="tz.timezone" :value="tz.timezone">
              {{ tz.name }}
            </option>
          </select>
        </div>
      </div>

      <!-- Right: Channel + Time Slots -->
      <div class="schedule-right">
        <meeting-channel-picker v-model="booking.schedule.meeting_channel" />
        <time-slot-grid
          :slots="availableSlots"
          v-model="booking.schedule.time"
          :loading="isLoadingSlots"
          :emptyMessage="slotEmptyMessage"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, inject, computed, watch } from 'vue';
import { format } from 'date-fns';
import RcCalendar from '@/components/RCCalendar/RCCalendar.vue';
import Timezones from '../../../Appointments/helpers/timezones';
import MeetingChannelPicker from '../components/MeetingChannelPicker.vue';
import TimeSlotGrid from '../components/TimeSlotGrid.vue';

const $http = inject('$_HTTP');
const booking = inject('bookingState');

const selectedDate = ref(null);
const availableSlots = ref([]);
const isLoadingSlots = ref(false);
const today = new Date();
const timezones = Timezones;

const slotEmptyMessage = computed(() => {
  if (!selectedDate.value) return 'Select a date to view available times';
  return 'No available time slots for this date';
});

// Watch for calendar date selection (v-model updates with date string)
watch(selectedDate, (val) => {
  if (!val) return;
  const dateObj = val instanceof Date ? val : new Date(val);
  if (isNaN(dateObj.getTime())) return;
  booking.schedule.date = format(dateObj, 'yyyy-MM-dd');
  booking.schedule.time = '';
  fetchAvailableSlots();
});

watch(() => booking.schedule.timezone, () => {
  if (selectedDate.value) {
    fetchAvailableSlots();
  }
});

const fetchAvailableSlots = async () => {
  if (!selectedDate.value) return;
  isLoadingSlots.value = true;
  availableSlots.value = [];

  try {
    const payload = {
      preferredDates: [{ date: booking.schedule.date }],
      specialist: booking.specialist.id,
      timezone: booking.schedule.timezone,
    };
    const { data } = await $http.$_getAvailableTimes(payload);
    // API may return { data: { availableTimes: [...] } } or { data: [...] }
    const times = data?.data?.availableTimes || data?.data || data?.availableTimes || [];
    if (Array.isArray(times)) {
      availableSlots.value = times;
    } else if (typeof times === 'object') {
      // Could be keyed by date
      const dateKey = booking.schedule.date;
      availableSlots.value = times[dateKey] || Object.values(times).flat();
    }
  } catch (error) {
    console.error('Error fetching available times:', error);
    availableSlots.value = [];
  } finally {
    isLoadingSlots.value = false;
  }
};
</script>

<style scoped lang="scss">
.schedule-step {
  padding: 16px 24px 32px;

  @media (max-width: 600px) {
    padding: 16px;
  }
}

.booking-hero {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px 28px;
  background: linear-gradient(135deg, #0EAEC4 0%, #0891b2 60%, #0e7490 100%);
  border-radius: 16px;
  margin-bottom: 24px;
  box-shadow: 0 6px 24px rgba(14, 174, 196, 0.18);

  @media (max-width: 600px) {
    flex-direction: column;
    text-align: center;
    padding: 20px 18px;
    gap: 12px;
  }
}

.hero-icon-wrapper {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 14px;
  flex-shrink: 0;
}

.hero-icon {
  color: white;
}

.hero-text {
  flex: 1;
}

.hero-title {
  font-size: 18px;
  font-weight: 700;
  color: white;
  margin: 0 0 4px;
}

.hero-desc {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.85);
  margin: 0;
  line-height: 1.5;
}

.reschedule-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(14, 174, 196, 0.08);
  border: 1px solid rgba(14, 174, 196, 0.2);
  border-radius: 10px;
  margin-bottom: 20px;
  font-size: 14px;
  color: #0891b2;

  strong {
    font-weight: 600;
  }
}

.schedule-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 24px;
  }
}

.schedule-left,
.schedule-right {
  display: flex;
  flex-direction: column;
}

.section-label {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 12px;
}

.calendar-wrapper {
  margin-bottom: 20px;

  :deep(.calendar) {
    width: 100%;
  }
}

.timezone-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.timezone-label {
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
}

.timezone-select {
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  font-size: 14px;
  color: #374151;
  background: white;
  cursor: pointer;
  width: 100%;

  &:focus {
    outline: none;
    border-color: #0EAEC4;
  }
}
</style>
