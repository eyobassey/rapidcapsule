<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="vital-history-modal" @click.self="$emit('close')">
        <div class="modal-content">
          <!-- Header -->
          <div class="modal-header">
            <div class="header-left">
              <div :class="['header-icon', `header-icon--${getVitalColor(vitalType)}`]">
                <v-icon :name="getVitalIcon(vitalType)" scale="1.2" />
              </div>
              <div class="header-info">
                <h2>{{ formatVitalType(vitalType) }}</h2>
                <p v-if="historyData">{{ historyData.count }} readings</p>
              </div>
            </div>
            <button class="close-btn" @click="$emit('close')">
              <v-icon name="hi-x" scale="1.1" />
            </button>
          </div>

          <!-- Loading State -->
          <div v-if="loading" class="modal-loading">
            <div class="loading-spinner" />
            <p>Loading vital history...</p>
          </div>

          <!-- Content -->
          <div v-else-if="historyData" class="modal-body">
            <!-- Stats Row -->
            <div v-if="historyData.stats" class="stats-row">
              <div class="stat-card">
                <span class="stat-label">Latest</span>
                <span class="stat-value">{{ historyData.stats.latest }}</span>
              </div>
              <div class="stat-card">
                <span class="stat-label">Average</span>
                <span class="stat-value">{{ historyData.stats.average }}</span>
              </div>
              <div class="stat-card">
                <span class="stat-label">Min</span>
                <span class="stat-value stat-value--min">{{ historyData.stats.min }}</span>
              </div>
              <div class="stat-card">
                <span class="stat-label">Max</span>
                <span class="stat-value stat-value--max">{{ historyData.stats.max }}</span>
              </div>
              <div v-if="historyData.stats.trend" class="stat-card stat-card--trend">
                <span class="stat-label">Trend</span>
                <span :class="['trend-indicator', `trend-indicator--${historyData.stats.trend}`]">
                  <v-icon
                    :name="historyData.stats.trend === 'up' ? 'hi-trending-up' :
                           historyData.stats.trend === 'down' ? 'hi-trending-down' : 'hi-minus'"
                    scale="0.8"
                  />
                  {{ historyData.stats.trend === 'up' ? 'Rising' :
                     historyData.stats.trend === 'down' ? 'Falling' : 'Stable' }}
                </span>
              </div>
            </div>

            <!-- Readings List -->
            <div class="readings-section">
              <h3>Reading History</h3>
              <div class="readings-list">
                <div
                  v-for="(reading, index) in historyData.readings"
                  :key="reading._id || index"
                  class="reading-item"
                  :style="{ animationDelay: `${index * 0.03}s` }"
                >
                  <div class="reading-left">
                    <div :class="['reading-dot', `reading-dot--${getVitalColor(vitalType)}`]" />
                    <div class="reading-info">
                      <span class="reading-value">{{ reading.value }} <small>{{ reading.unit }}</small></span>
                      <span class="reading-date">{{ formatFullDate(reading.recorded_at) }}</span>
                    </div>
                  </div>
                  <div class="reading-right">
                    <span class="reading-time">{{ formatTime(reading.recorded_at) }}</span>
                    <span class="reading-relative">{{ formatRelativeTime(reading.recorded_at) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="modal-empty">
            <div class="empty-icon">
              <v-icon name="hi-chart-bar" scale="2" />
            </div>
            <h3>No History Available</h3>
            <p>No readings found for this vital type</p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue';
import apiFactory from '@/services/apiFactory';
import { useToast } from 'vue-toast-notification';

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  vitalType: { type: String, default: '' },
  patientId: { type: String, default: '' },
});

defineEmits(['close']);

const $toast = useToast();
const loading = ref(false);
const historyData = ref(null);

watch(
  () => [props.isOpen, props.vitalType, props.patientId],
  async ([isOpen, vitalType, patientId]) => {
    if (isOpen && vitalType && patientId) {
      await fetchVitalHistory();
    }
  },
  { immediate: true }
);

async function fetchVitalHistory() {
  loading.value = true;
  historyData.value = null;

  try {
    const response = await apiFactory.$_getPharmacyPatientVitalsHistory(
      props.patientId,
      props.vitalType,
      30
    );
    const result = response.data?.data || response.data?.result || response.data;
    if (result) {
      historyData.value = result;
    }
  } catch (error) {
    console.error('Error fetching vital history:', error);
    $toast.error('Failed to load vital history');
  } finally {
    loading.value = false;
  }
}

function formatVitalType(type) {
  const types = {
    blood_pressure: 'Blood Pressure',
    heart_rate: 'Heart Rate',
    temperature: 'Temperature',
    weight: 'Weight',
    height: 'Height',
    blood_sugar: 'Blood Sugar',
    oxygen_saturation: 'SpO2',
    bmi: 'BMI',
    respiratory_rate: 'Respiratory Rate',
  };
  return types[type] || type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
}

function getVitalIcon(type) {
  const icons = {
    blood_pressure: 'hi-heart',
    heart_rate: 'ri-pulse-line',
    temperature: 'fa-thermometer-half',
    weight: 'hi-scale',
    height: 'bi-rulers',
    blood_sugar: 'io-water-outline',
    oxygen_saturation: 'bi-lungs',
    bmi: 'hi-calculator',
    respiratory_rate: 'bi-lungs',
  };
  return icons[type] || 'hi-heart';
}

function getVitalColor(type) {
  const colors = {
    blood_pressure: 'rose',
    heart_rate: 'pink',
    temperature: 'orange',
    weight: 'blue',
    height: 'violet',
    blood_sugar: 'amber',
    oxygen_saturation: 'teal',
    bmi: 'indigo',
    respiratory_rate: 'cyan',
  };
  return colors[type] || 'sky';
}

function formatFullDate(date) {
  if (!date) return 'Unknown';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatRelativeTime(date) {
  if (!date) return '';
  const now = new Date();
  const recordedDate = new Date(date);
  const diffMs = now - recordedDate;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}
</script>

<style scoped lang="scss">
$sky: #4FC3F7;
$sky-light: #E1F5FE;
$sky-dark: #0288D1;
$emerald: #10B981;
$amber: #F59E0B;
$violet: #8B5CF6;
$rose: #F43F5E;
$rose-light: #FFE4E6;
$pink: #EC4899;
$orange: #F97316;
$blue: #3B82F6;
$indigo: #6366F1;
$teal: #14B8A6;
$cyan: #06B6D4;

.vital-history-modal {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.modal-content {
  width: 100%;
  max-width: 600px;
  max-height: 80vh;
  background: white;
  border-radius: 24px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid rgba($color-g-92, 0.5);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-icon {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;

  &--rose { background: rgba($rose, 0.1); color: $rose; }
  &--pink { background: rgba($pink, 0.1); color: $pink; }
  &--orange { background: rgba($orange, 0.1); color: $orange; }
  &--blue { background: rgba($blue, 0.1); color: $blue; }
  &--violet { background: rgba($violet, 0.1); color: $violet; }
  &--amber { background: rgba($amber, 0.1); color: $amber; }
  &--teal { background: rgba($teal, 0.1); color: $teal; }
  &--indigo { background: rgba($indigo, 0.1); color: $indigo; }
  &--cyan { background: rgba($cyan, 0.1); color: $cyan; }
  &--sky { background: rgba($sky, 0.1); color: $sky-dark; }
}

.header-info {
  h2 {
    font-size: 20px;
    font-weight: 700;
    color: $color-g-21;
    margin: 0 0 4px;
  }

  p {
    font-size: 13px;
    color: $color-g-54;
    margin: 0;
  }
}

.close-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: rgba($color-g-67, 0.1);
  border-radius: 12px;
  cursor: pointer;
  color: $color-g-54;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: rgba($color-g-67, 0.2);
    color: $color-g-21;
  }
}

.modal-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 24px;
  gap: 16px;

  p {
    font-size: 14px;
    color: $color-g-54;
  }
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba($sky, 0.2);
  border-top-color: $sky-dark;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}

.stat-card {
  background: rgba($color-g-92, 0.1);
  border-radius: 14px;
  padding: 16px;
  text-align: center;

  .stat-label {
    display: block;
    font-size: 11px;
    font-weight: 500;
    color: $color-g-54;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    margin-bottom: 6px;
  }

  .stat-value {
    display: block;
    font-size: 20px;
    font-weight: 700;
    color: $color-g-21;

    &--min { color: $teal; }
    &--max { color: $rose; }
  }

  &--trend {
    background: rgba($sky, 0.1);
  }
}

.trend-indicator {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;

  &--up { color: $rose; }
  &--down { color: $teal; }
  &--stable { color: $emerald; }
}

.readings-section {
  h3 {
    font-size: 15px;
    font-weight: 600;
    color: $color-g-21;
    margin: 0 0 16px;
  }
}

.readings-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.reading-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba($color-g-92, 0.5);
  border-radius: 12px;
  animation: fadeIn 0.3s ease forwards;
  opacity: 0;

  &:hover {
    background: white;
    border-color: rgba($sky, 0.3);
  }
}

.reading-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.reading-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;

  &--rose { background: $rose; }
  &--pink { background: $pink; }
  &--orange { background: $orange; }
  &--blue { background: $blue; }
  &--violet { background: $violet; }
  &--amber { background: $amber; }
  &--teal { background: $teal; }
  &--indigo { background: $indigo; }
  &--cyan { background: $cyan; }
  &--sky { background: $sky-dark; }
}

.reading-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.reading-value {
  font-size: 16px;
  font-weight: 700;
  color: $color-g-21;

  small {
    font-size: 12px;
    font-weight: 500;
    color: $color-g-54;
  }
}

.reading-date {
  font-size: 12px;
  color: $color-g-54;
}

.reading-right {
  text-align: right;
}

.reading-time {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: $color-g-44;
}

.reading-relative {
  display: block;
  font-size: 11px;
  color: $color-g-67;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 24px;
  text-align: center;

  .empty-icon {
    width: 72px;
    height: 72px;
    background: rgba($color-g-67, 0.1);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $color-g-67;
    margin-bottom: 16px;
  }

  h3 {
    font-size: 18px;
    font-weight: 700;
    color: $color-g-21;
    margin: 0 0 8px;
  }

  p {
    font-size: 14px;
    color: $color-g-54;
    margin: 0;
  }
}

// Transitions
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;

  .modal-content {
    transition: transform 0.3s ease;
  }
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;

  .modal-content {
    transform: scale(0.95) translateY(20px);
  }
}
</style>
