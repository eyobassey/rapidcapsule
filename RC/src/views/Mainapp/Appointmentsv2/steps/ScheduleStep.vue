<template>
  <div class="schedule-step">
    <!-- Hero Banner -->
    <div class="step-hero">
      <div class="hero-icon-wrapper">
        <v-icon name="hi-calendar" scale="1.8" class="hero-icon" />
      </div>
      <div class="hero-text">
        <h2 class="hero-title">Select Date & Time</h2>
        <p class="hero-desc">Choose a convenient date and time for your appointment. Times shown are in your local timezone.</p>
      </div>
    </div>

    <div class="schedule-layout">
      <!-- Left Column: Calendar -->
      <div class="calendar-section">
        <div class="section-card">
          <h3 class="section-title">
            <v-icon name="hi-calendar" scale="0.9" />
            Select a Date
          </h3>
          <rc-calendar
            v-model="selectedDate"
            :minDate="minDate"
            :maxDate="maxDate"
            :disabledDates="disabledDates"
            @update:modelValue="onDateChange"
          />

          <!-- Timezone Selector -->
          <div class="timezone-row">
            <v-icon name="hi-globe-alt" scale="0.85" />
            <span class="timezone-label">Timezone:</span>
            <select v-model="booking.schedule.timezone" class="timezone-select">
              <option v-for="tz in timezones" :key="tz.value" :value="tz.value">
                {{ tz.label }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- Right Column: Time Slots -->
      <div class="timeslots-section">
        <div class="section-card">
          <h3 class="section-title">
            <v-icon name="hi-clock" scale="0.9" />
            Available Times
            <span class="selected-date-label" v-if="selectedDate">
              for {{ formattedSelectedDate }}
            </span>
          </h3>

          <div v-if="isLoadingSlots" class="loading-slots">
            <loader :useOverlay="false" style="position: relative" />
            <span>Loading available times...</span>
          </div>

          <div v-else-if="!selectedDate" class="no-date-selected">
            <v-icon name="hi-calendar" scale="1.5" />
            <p>Please select a date to view available times</p>
          </div>

          <div v-else-if="timeSlots.length === 0" class="no-slots">
            <v-icon name="hi-exclamation-circle" scale="1.5" />
            <p>No available times for this date</p>
            <span>Please select another date</span>
          </div>

          <div v-else class="timeslots-grid">
            <time-slot-chip
              v-for="slot in timeSlots"
              :key="slot.time"
              :time="slot.displayTime"
              :availability="slot.availability"
              :isSelected="booking.schedule.time === slot.time"
              :justBooked="slot.justBooked"
              @select="selectTimeSlot(slot)"
            />
          </div>

          <!-- Slot Legend -->
          <div class="slot-legend" v-if="timeSlots.length > 0">
            <div class="legend-item">
              <span class="legend-dot available"></span>
              <span>Available</span>
            </div>
            <div class="legend-item">
              <span class="legend-dot limited"></span>
              <span>Limited</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject, watch, onMounted } from 'vue';
import { format, addDays, parseISO, isBefore, startOfDay } from 'date-fns';
import RcCalendar from '@/components/RCCalendar/RCCalendar.vue';
import TimeSlotChip from '../components/TimeSlotChip.vue';
import Loader from '@/components/Loader/main-loader.vue';

const $http = inject('$_HTTP');
const booking = inject('bookingStateV2');

const selectedDate = ref(null);
const timeSlots = ref([]);
const isLoadingSlots = ref(false);

const minDate = computed(() => startOfDay(new Date()));
const maxDate = computed(() => addDays(new Date(), 60));
const disabledDates = computed(() => []);

const timezones = [
  { value: 'Africa/Lagos', label: 'Lagos (WAT)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'America/New_York', label: 'New York (EST/EDT)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PST/PDT)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
];

const formattedSelectedDate = computed(() => {
  if (!selectedDate.value) return '';
  try {
    const date = typeof selectedDate.value === 'string'
      ? parseISO(selectedDate.value)
      : selectedDate.value;
    return format(date, 'EEEE, MMMM d');
  } catch {
    return '';
  }
});

const formatTimeDisplay = (time) => {
  if (!time) return '';
  if (time.includes('AM') || time.includes('PM')) return time;
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
};

const onDateChange = (date) => {
  booking.schedule.time = '';
  if (date) {
    const formattedDate = typeof date === 'string'
      ? date
      : format(date, 'yyyy-MM-dd');
    booking.schedule.date = formattedDate;
    fetchTimeSlots(formattedDate);
  }
};

const fetchTimeSlots = async (date) => {
  isLoadingSlots.value = true;
  timeSlots.value = [];

  // Skip API call if required data is missing
  if (!booking.category.professional_category || !date) {
    generateMockTimeSlots();
    isLoadingSlots.value = false;
    return;
  }

  try {
    // Parse the date - handle both ISO format and toDateString() format like "Tue Jan 27 2026"
    let dateObj;
    if (typeof date === 'string') {
      // Try to parse the date string
      dateObj = date.match(/^\d{4}-\d{2}-\d{2}$/) ? new Date(date) : new Date(date);
    } else {
      dateObj = date;
    }

    // Format to YYYY-MM-DD for the API
    const formattedDate = format(dateObj, 'yyyy-MM-dd');

    const payload = {
      preferredDates: [{ date: new Date(formattedDate) }],
    };

    const { data } = await $http.$_getAvailableTimes(payload);
    // Backend returns { message, result } where result is { "YYYY-MM-DD": ["HH:mm", ...] }
    const result = data?.result || data?.data || data || {};

    // Extract times array for the selected date
    // Backend returns { "YYYY-MM-DD": { available: [...], booked: [...] } }
    let timesArray = [];
    if (Array.isArray(result)) {
      timesArray = result;
    } else if (typeof result === 'object' && result !== null) {
      const dateResult = result[formattedDate];
      if (dateResult) {
        // New format: { available: [...], booked: [...] }
        if (dateResult.available && Array.isArray(dateResult.available)) {
          timesArray = dateResult.available;
        } else if (Array.isArray(dateResult)) {
          // Old format: direct array of times
          timesArray = dateResult;
        }
      } else {
        // Try to get from first available date
        const firstDate = Object.keys(result)[0];
        if (firstDate && result[firstDate]) {
          const firstResult = result[firstDate];
          timesArray = firstResult.available || (Array.isArray(firstResult) ? firstResult : []);
        }
      }
    }

    // Ensure timesArray is always an array
    if (!Array.isArray(timesArray)) {
      console.warn('timesArray is not an array, using empty array. Result:', result);
      timesArray = [];
    }

    timeSlots.value = timesArray.map((slot) => {
      const time = typeof slot === 'string' ? slot : slot.time;
      const available = typeof slot === 'object' ? slot.available : true;
      const count = typeof slot === 'object' ? slot.count : 5;

      return {
        time,
        displayTime: formatTimeDisplay(time),
        availability: !available ? 'unavailable' : count <= 2 ? 'limited' : 'available',
        justBooked: false,
      };
    });
  } catch (error) {
    console.error('Error fetching time slots:', error);
    // Generate mock time slots for demo
    generateMockTimeSlots();
  } finally {
    isLoadingSlots.value = false;
  }
};

const generateMockTimeSlots = () => {
  const slots = [];
  for (let hour = 9; hour <= 17; hour++) {
    const time = `${String(hour).padStart(2, '0')}:00`;
    const availability = Math.random() > 0.2 ? (Math.random() > 0.7 ? 'limited' : 'available') : 'unavailable';
    slots.push({
      time,
      displayTime: formatTimeDisplay(time),
      availability,
      justBooked: false,
    });
    // Add half hour slots
    if (hour < 17) {
      const halfTime = `${String(hour).padStart(2, '0')}:30`;
      const halfAvailability = Math.random() > 0.2 ? (Math.random() > 0.7 ? 'limited' : 'available') : 'unavailable';
      slots.push({
        time: halfTime,
        displayTime: formatTimeDisplay(halfTime),
        availability: halfAvailability,
        justBooked: false,
      });
    }
  }
  timeSlots.value = slots;
};

const selectTimeSlot = (slot) => {
  if (slot.availability !== 'unavailable') {
    booking.schedule.time = slot.time;
  }
};

watch(() => booking.schedule.timezone, () => {
  if (selectedDate.value) {
    const formattedDate = typeof selectedDate.value === 'string'
      ? selectedDate.value
      : format(selectedDate.value, 'yyyy-MM-dd');
    fetchTimeSlots(formattedDate);
  }
});

onMounted(() => {
  // Set default timezone if not set
  if (!booking.schedule.timezone) {
    booking.schedule.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  }
});
</script>

<style scoped lang="scss">
$v2-sky: #4FC3F7;
$v2-sky-light: #E1F5FE;
$v2-sky-dark: #0288D1;
$v2-success: #4CAF50;
$v2-orange: #FF9800;

.schedule-step {
  padding: 20px 24px 40px;
  max-width: 1000px;
  margin: 0 auto;

  @media (max-width: 600px) {
    padding: 16px 16px 32px;
  }
}

.step-hero {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 28px 32px;
  background: linear-gradient(135deg, $v2-sky 0%, $v2-sky-dark 100%);
  border-radius: 18px;
  margin-bottom: 28px;
  box-shadow: 0 8px 32px rgba(79, 195, 247, 0.25);

  @media (max-width: 600px) {
    flex-direction: column;
    text-align: center;
    padding: 24px 20px;
    gap: 14px;
  }
}

.hero-icon-wrapper {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  flex-shrink: 0;
  backdrop-filter: blur(8px);
}

.hero-icon {
  color: white;
}

.hero-text {
  flex: 1;
}

.hero-title {
  font-size: 22px;
  font-weight: 700;
  color: white;
  margin: 0 0 6px;
}

.hero-desc {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  line-height: 1.5;
}

.schedule-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
}

.section-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 20px;

  svg {
    color: $v2-sky;
  }
}

.selected-date-label {
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
  margin-left: auto;
}

.timezone-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 20px;
  margin-top: 20px;
  border-top: 1px solid #f3f4f6;

  svg {
    color: #6b7280;
  }
}

.timezone-label {
  font-size: 13px;
  color: #6b7280;
}

.timezone-select {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 13px;
  color: #374151;
  background: white;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: $v2-sky;
  }
}

.loading-slots,
.no-date-selected,
.no-slots {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  color: #9ca3af;

  svg {
    color: #d1d5db;
    margin-bottom: 12px;
  }

  p {
    font-size: 14px;
    font-weight: 500;
    margin: 0;
    color: #6b7280;
  }

  span {
    font-size: 13px;
    margin-top: 4px;
  }
}

.loading-slots {
  span {
    margin-top: 12px;
  }
}

.timeslots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 10px;
}

.slot-legend {
  display: flex;
  align-items: center;
  gap: 20px;
  padding-top: 20px;
  margin-top: 20px;
  border-top: 1px solid #f3f4f6;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #6b7280;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;

  &.available {
    background: $v2-success;
  }

  &.limited {
    background: $v2-orange;
  }
}
</style>
