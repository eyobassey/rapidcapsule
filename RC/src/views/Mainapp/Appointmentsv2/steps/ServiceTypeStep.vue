<template>
  <div class="service-type-step">
    <!-- AI Recommendation Banner (Mobile Only) -->
    <div class="ai-banner mobile-only">
      <div class="ai-icon">
        <v-icon name="hi-sparkles" scale="0.9" />
      </div>
      <div class="ai-content">
        <h4 class="ai-title">AI Recommendation</h4>
        <p class="ai-text">
          Based on your <strong>mild fever</strong>, we suggest a
          <span class="highlight">Video Consultation</span>.
        </p>
        <button class="ai-btn" @click="applySuggestion">Apply Suggestion</button>
      </div>
    </div>

    <!-- Appointment Type Selection -->
    <section class="step-section">
      <label class="section-label">What type of appointment is this?</label>

      <!-- Loading State -->
      <div v-if="isLoadingTypes" class="loading-state">
        <div class="loading-spinner"></div>
        <span>Loading appointment types...</span>
      </div>

      <!-- Appointment Types Grid -->
      <div v-else class="appointment-type-grid">
        <div
          v-for="service in consultationServices"
          :key="service._id || service.slug"
          class="type-card"
          :class="{ selected: booking.appointmentType === service.name }"
          @click="selectAppointmentType(service)"
        >
          <div class="type-radio">
            <div class="radio-inner" v-if="booking.appointmentType === service.name"></div>
          </div>
          <div
            class="type-icon"
            :style="{
              backgroundColor: service.icon_bg_color || '#E0F2FE',
              color: service.icon_color || '#0284C7'
            }"
          >
            <v-icon :name="service.icon || 'hi-calendar'" scale="1" />
          </div>
          <div class="type-content">
            <h4 class="type-title">{{ service.name }}</h4>
            <p class="type-desc">{{ service.description }}</p>
            <span v-if="service.show_ai_badge" class="ai-match-badge">
              <v-icon name="hi-sparkles" scale="0.5" />
              AI Match
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- Urgency Selection -->
    <section class="step-section">
      <label class="section-label">How urgent is this appointment?</label>
      <div class="urgency-grid">
        <!-- Routine Checkup Card -->
        <div
          class="urgency-card"
          :class="{ selected: booking.serviceType.urgency === 'routine' }"
          @click="booking.serviceType.urgency = 'routine'"
        >
          <div class="urgency-icon blue">
            <v-icon name="hi-clipboard-check" scale="1.2" />
          </div>
          <div class="urgency-content">
            <h4 class="urgency-title">Routine Checkup</h4>
            <p class="urgency-desc">Regular follow-ups, non-urgent symptoms, or general health inquiries. Schedule at your convenience.</p>
          </div>
          <div class="urgency-check">
            <div class="check-circle" :class="{ checked: booking.serviceType.urgency === 'routine' }">
              <v-icon v-if="booking.serviceType.urgency === 'routine'" name="hi-check" scale="0.6" />
            </div>
          </div>
        </div>

        <!-- Urgent Care Card -->
        <div
          class="urgency-card"
          :class="{ selected: booking.serviceType.urgency === 'urgent' }"
          @click="booking.serviceType.urgency = 'urgent'"
        >
          <div class="urgency-icon red">
            <v-icon name="hi-truck" scale="1.2" />
          </div>
          <div class="urgency-content">
            <div class="urgency-title-row">
              <h4 class="urgency-title">Urgent Care</h4>
              <span class="priority-badge">High Priority</span>
            </div>
            <p class="urgency-desc">Sudden symptoms needing quick attention. We'll prioritize matching you with available doctors.</p>
          </div>
          <div class="urgency-check">
            <div class="check-circle" :class="{ checked: booking.serviceType.urgency === 'urgent' }">
              <v-icon v-if="booking.serviceType.urgency === 'urgent'" name="hi-check" scale="0.6" />
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Method Selection -->
    <section class="step-section">
      <label class="section-label">Choose Consultation Method</label>
      <div class="method-grid">
        <!-- Video Call Card -->
        <div
          class="method-card"
          :class="{ selected: booking.serviceType.method === 'video' }"
          @click="booking.serviceType.method = 'video'"
        >
          <div class="method-top-bar"></div>
          <span class="recommended-badge">Recommended</span>
          <div class="method-icon sky">
            <v-icon name="hi-video-camera" scale="1.4" />
          </div>
          <h4 class="method-title">Video Call</h4>
          <p class="method-desc">Face-to-face consultation via secure HD video. Best for physical symptoms examination.</p>
          <div class="method-info">
            <v-icon name="hi-globe-alt" scale="0.6" />
            <span>Requires stable internet</span>
          </div>
        </div>

        <!-- Audio Call Card -->
        <div
          class="method-card"
          :class="{ selected: booking.serviceType.method === 'audio' }"
          @click="booking.serviceType.method = 'audio'"
        >
          <div class="method-icon orange">
            <v-icon name="hi-phone" scale="1.4" />
          </div>
          <h4 class="method-title">Audio Call</h4>
          <p class="method-desc">Voice-only consultation. Good for follow-ups, mental health, or low bandwidth areas.</p>
          <div class="method-info">
            <v-icon name="hi-chart-bar" scale="0.6" />
            <span>Low data usage</span>
          </div>
        </div>

        <!-- Chat Consultation Card -->
        <div
          class="method-card"
          :class="{ selected: booking.serviceType.method === 'chat' }"
          @click="booking.serviceType.method = 'chat'"
        >
          <div class="method-icon pink">
            <v-icon name="hi-chat-alt-2" scale="1.4" />
          </div>
          <h4 class="method-title">Chat Consultation</h4>
          <p class="method-desc">Asynchronous text messaging. Send photos and describe symptoms at your own pace.</p>
          <div class="method-info">
            <v-icon name="hi-clock" scale="0.6" />
            <span>Reply within 2 hrs</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { inject, ref, onMounted } from 'vue';

const booking = inject('bookingStateV2');
const $http = inject('$_HTTP');

// State for consultation services
const consultationServices = ref([]);
const isLoadingTypes = ref(true);

// Default fallback services if API fails or returns empty
const defaultServices = [
  {
    _id: 'initial',
    name: 'Initial Appointment',
    slug: 'initial-appointment',
    description: 'First time seeing this specialist',
    icon: 'hi-user-add',
    icon_color: '#0284C7',
    icon_bg_color: '#E0F2FE',
  },
  {
    _id: 'followup',
    name: 'Follow-up Appointment',
    slug: 'follow-up-appointment',
    description: 'Continuing care with a specialist',
    icon: 'hi-refresh',
    icon_color: '#16A34A',
    icon_bg_color: '#F0FDF4',
  }
];

// Load consultation services from API
const loadConsultationServices = async () => {
  isLoadingTypes.value = true;
  try {
    const response = await $http.$_getConsultationServices();
    if (response.data?.data && response.data.data.length > 0) {
      consultationServices.value = response.data.data;
    } else {
      // Use fallback if no data from API
      consultationServices.value = defaultServices;
    }
  } catch (error) {
    console.error('Failed to load consultation services:', error);
    // Use fallback on error
    consultationServices.value = defaultServices;
  } finally {
    isLoadingTypes.value = false;
  }
};

// Select appointment type
const selectAppointmentType = (service) => {
  booking.appointmentType = service.name;
  // Store the full service object for later use (pricing, etc.)
  booking.selectedService = service;
};

const applySuggestion = () => {
  booking.serviceType.method = 'video';
};

// Load services on mount
onMounted(() => {
  loadConsultationServices();
});
</script>

<style scoped lang="scss">
// V2 Colors
$v2-sky: #4FC3F7;
$v2-sky-light: #E1F5FE;
$v2-sky-dark: #0288D1;
$v2-navy: #1A365D;
$v2-orange: #FF9800;
$v2-orange-light: #FFF3E0;

.service-type-step {
  padding: 16px;
  max-width: 1000px;
  margin: 0 auto;

  @media (min-width: 1025px) {
    padding: 24px 32px;
  }
}

// Mobile only utility
.mobile-only {
  @media (min-width: 1025px) {
    display: none !important;
  }
}

// AI Recommendation Banner
.ai-banner {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: rgba($v2-sky-light, 0.4);
  border: 1px solid rgba($v2-sky, 0.2);
  border-radius: 12px;
  margin-bottom: 24px;
}

.ai-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: $v2-sky;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ai-content {
  flex: 1;
}

.ai-title {
  font-size: 12px;
  font-weight: 700;
  color: $v2-navy;
  margin: 0 0 4px;
}

.ai-text {
  font-size: 12px;
  color: #64748b;
  line-height: 1.5;
  margin: 0 0 12px;

  strong {
    color: #1e293b;
  }

  .highlight {
    font-weight: 600;
    color: $v2-sky-dark;
  }
}

.ai-btn {
  width: 100%;
  padding: 10px 16px;
  background: white;
  border: 1px solid rgba($v2-sky, 0.3);
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  color: $v2-sky-dark;
  cursor: pointer;
  transition: all 0.2s ease;

  &:active {
    background: $v2-sky;
    color: white;
  }
}

// Sections
.step-section {
  margin-bottom: 28px;

  &:last-child {
    margin-bottom: 0;
  }
}

.section-label {
  display: block;
  font-size: 15px;
  font-weight: 700;
  color: $v2-navy;
  margin-bottom: 16px;
}

// Loading State
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px 20px;
  background: #f8fafc;
  border-radius: 12px;
  color: #64748b;
  font-size: 14px;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #e2e8f0;
  border-top-color: $v2-sky;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

// ==========================================
// APPOINTMENT TYPE CARDS
// ==========================================
.appointment-type-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
}

.type-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #cbd5e1;
  }

  &.selected {
    border-color: $v2-sky;
    background: #F0F9FF;
  }
}

.type-radio {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid #d1d5db;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  .type-card.selected & {
    border-color: $v2-sky;
  }

  .radio-inner {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: $v2-sky;
  }
}

.type-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &.initial {
    background: #E0F2FE;
    color: #0284C7;
  }

  &.followup {
    background: #F0FDF4;
    color: #16A34A;
  }
}

.type-content {
  flex: 1;
  min-width: 0;
}

.type-title {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 2px;
}

.type-desc {
  font-size: 12px;
  color: #64748b;
  margin: 0;
}

.ai-match-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 6px;
  padding: 3px 8px;
  background: linear-gradient(135deg, #4FC3F7, #0288D1);
  color: white;
  font-size: 10px;
  font-weight: 600;
  border-radius: 10px;

  svg {
    color: white;
  }
}

// ==========================================
// URGENCY CARDS - Horizontal layout
// ==========================================
.urgency-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;

  @media (min-width: 768px) {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
}

.urgency-card {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 18px;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #cbd5e1;
  }

  &.selected {
    border-color: $v2-sky;
    background: #F0F9FF;
  }
}

.urgency-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &.blue {
    background: #EFF6FF;
    color: #3B82F6;
  }

  &.red {
    background: #FEF2F2;
    color: #EF4444;
  }
}

.urgency-content {
  flex: 1;
  min-width: 0;
}

.urgency-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 4px;
}

.urgency-title {
  font-size: 15px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 4px;
}

.priority-badge {
  font-size: 10px;
  font-weight: 700;
  background: #FEE2E2;
  color: #DC2626;
  padding: 3px 10px;
  border-radius: 12px;
}

.urgency-desc {
  font-size: 13px;
  color: #64748b;
  line-height: 1.5;
  margin: 0;
}

.urgency-check {
  flex-shrink: 0;
  padding-top: 4px;
}

.check-circle {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid #d1d5db;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &.checked {
    background: $v2-sky;
    border-color: $v2-sky;
    color: white;
  }
}

// ==========================================
// METHOD CARDS - Vertical layout with icon on top
// ==========================================
.method-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;

  @media (min-width: 768px) {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
}

.method-card {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 24px 20px 18px;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  overflow: hidden;

  &:hover {
    border-color: #cbd5e1;
  }

  &.selected {
    border-color: $v2-sky;
    background: #F0F9FF;
  }

  .method-top-bar {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: $v2-sky;
  }

  .recommended-badge {
    position: absolute;
    top: 12px;
    right: 12px;
    font-size: 10px;
    font-weight: 700;
    background: linear-gradient(135deg, #F97316, #EA580C);
    color: white;
    padding: 4px 10px;
    border-radius: 6px;
  }
}

.method-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;

  &.sky {
    background: $v2-sky-light;
    color: $v2-sky-dark;
  }

  &.orange {
    background: $v2-orange-light;
    color: $v2-orange;
  }

  &.pink {
    background: #FCE7F3;
    color: #EC4899;
  }
}

.method-title {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px;
}

.method-desc {
  font-size: 13px;
  color: #64748b;
  line-height: 1.5;
  margin: 0 0 14px;
  flex: 1;
}

.method-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: #f8fafc;
  border-radius: 8px;
  font-size: 12px;
  color: #64748b;

  svg {
    color: #94a3b8;
  }
}
</style>
