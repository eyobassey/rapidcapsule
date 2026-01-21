<template>
  <div class="page-content">
    <top-bar
      type="title-only"
      title="Appointments"
      @open-side-nav="$emit('openSideNav')"
    />
    <div class="page-content__body">
      <!-- Hero Banner -->
      <div class="hero-banner">
        <div class="hero-content">
          <div class="hero-text">
            <h1 class="hero-title">Your Appointments</h1>
            <p class="hero-subtitle">Manage your healthcare consultations with ease</p>
          </div>
          <div class="hero-actions desktop-visible">
            <button class="hero-cta" @click="isOpen = true">
              <v-icon name="hi-plus" scale="0.9" />
              <span>Book Appointment</span>
            </button>
          </div>
        </div>
        <div class="hero-stats">
          <div class="stat-item">
            <span class="stat-value">{{ stats.total }}</span>
            <span class="stat-label">Total</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ stats.upcoming }}</span>
            <span class="stat-label">Upcoming</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ stats.completed }}</span>
            <span class="stat-label">Completed</span>
          </div>
          <div class="stat-item" v-if="stats.missed > 0">
            <span class="stat-value missed">{{ stats.missed }}</span>
            <span class="stat-label">Missed</span>
          </div>
        </div>
      </div>

      <!-- Mobile Book Button -->
      <div class="button-floating mobile-visible">
        <rc-iconbutton
          @click="isOpen = true"
          icon="icon-plus-solid"
          size="lg"
          :sx="{
            background: '#0EAEC4',
            stroke: '#FFFFFF',
            fill: '#FFFFFF',
            borderRadius: '50%',
          }"
        />
      </div>

      <!-- Content Section -->
      <div class="content-container">
        <div class="tabs-container">
          <!-- Pill-style Tabs -->
          <div class="pill-tabs">
            <button
              class="pill-tab"
              :class="{ 'pill-tab--active': currentTab === 'upcoming' }"
              @click="currentTab = 'upcoming'"
            >
              <v-icon name="hi-calendar" scale="0.85" />
              <span>Upcoming</span>
              <span v-if="stats.upcoming > 0" class="pill-badge">{{ stats.upcoming }}</span>
            </button>
            <button
              class="pill-tab"
              :class="{ 'pill-tab--active': currentTab === 'history' }"
              @click="currentTab = 'history'"
            >
              <v-icon name="hi-clock" scale="0.85" />
              <span>History</span>
            </button>
            <button
              class="pill-tab"
              :class="{ 'pill-tab--active': currentTab === 'missed' }"
              @click="currentTab = 'missed'"
            >
              <v-icon name="hi-exclamation-circle" scale="0.85" />
              <span>Missed</span>
              <span v-if="stats.missed > 0" class="pill-badge missed">{{ stats.missed }}</span>
            </button>
          </div>

          <div class="tabs_content">
            <template v-if="currentTab === 'upcoming'">
              <upcoming-appointments
                @create="isOpen = true"
                @stats-updated="updateStats"
                :key="upcomingAppointmentsKey"
              />
            </template>
            <template v-if="currentTab === 'history'">
              <appointment-history
                @create="isOpen = true"
                @stats-updated="updateStats"
                :key="upcomingAppointmentsKey"
              />
            </template>
            <template v-if="currentTab === 'missed'">
              <missed-appointments
                @create="isOpen = true"
                @stats-updated="updateStats"
                :key="upcomingAppointmentsKey"
              />
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- Booking Modal -->
    <dialog-modal
      v-if="isOpen"
      @closeModal="onClose"
      :has-footer="bookingInfo.hasFooter"
      :title="bookingInfo.heading"
    >
      <template v-slot:body>
        <entry v-if="bookingInfo.current === 0" />
        <agreement v-if="bookingInfo.current === 1" />
        <category v-if="bookingInfo.current === 2" />
        <booking v-if="bookingInfo.current === 3" />
        <professionals v-if="bookingInfo.current === 4" />
        <bookingsummary v-if="bookingInfo.current === 5" />
      </template>
      <template v-slot:foot>
        <div
          v-if="bookingInfo.current === 0"
          class="action-button health-actions"
        >
          <rc-button
            label="Take Health Checkup"
            type="secondary"
            size="medium"
            @click="goToHealthCheckup"
          />
          <rc-button
            label="Continue to Booking"
            type="primary"
            size="medium"
            @click="useBookingInfo({ current: 2 })"
          />
        </div>
        <div v-if="bookingInfo.current === 1" class="action-button">
          <rc-button
            label="Accept & Proceed"
            type="primary"
            size="medium"
            @click="useBookingInfo({ current: 2 })"
          />
        </div>
        <div
          v-if="bookingInfo.current === 3"
          class="action-button btn-float-right"
        >
          <rc-button
            label="Next"
            type="primary"
            size="medium"
            :disabled="!bookingInfo.proceed"
            @click="useBookingInfo({ current: 4 })"
          />
        </div>
        <div v-if="bookingInfo.current === 5" class="action-button">
          <rc-button
            label="Book Appointment"
            type="primary"
            size="medium"
            :disabled="!bookingInfo.proceed || isSubmitting"
            :loading="isSubmitting"
            @click="onSubmitBooking"
          />
        </div>
      </template>
    </dialog-modal>
  </div>
</template>

<script setup>
import { uniqueId } from "lodash";
import { useToast } from "vue-toast-notification";
import { ref, inject, provide, watch, onMounted } from "vue";
import TopBar from "@/components/Navigation/top-bar";
import RcButton from "@/components/buttons/button-primary";
import RcTab from "@/components/RCTab";
import RcModal from "@/components/RCModal";
import RcIconbutton from "@/components/RCIconButton";
import DialogModal from "@/components/modals/dialog-modal";

import UpcomingAppointments from "./UpcomingAppointments";
import AppointmentHistory from "./AppointmentHistory";
import MissedAppointments from "./MissedAppointments";

import Entry from "./entry";
import Agreement from "./agreement";
import Category from "./category";
import Booking from "./booking";
import Professionals from "./professionals";
import Bookingsummary from "./summary";

const $toast = useToast();
const $http = inject("$_HTTP");

// Stats
const stats = ref({
  total: 0,
  upcoming: 0,
  completed: 0,
  missed: 0,
});

const bookingInfo = ref({ current: 0 });
const navigator = ref({ from: null, to: null, current: 3 });
const useBookingInfo = (payload) =>
  (bookingInfo.value = { ...bookingInfo.value, ...payload });
const useNavigator = ({ current, from, to }) =>
  (navigator.value = { current: to, from, to: null });
provide("$_BOOKING_INFO", { bookingInfo, useBookingInfo });
provide("$_NAVIGATOR", { navigator, useNavigator });

watch(bookingInfo, (value) => {
  console.log("bookingInfo", bookingInfo.value);
});

const currentTab = ref("upcoming");
const upcomingAppointmentsKey = ref(uniqueId(Math.random()));
const isOpen = ref(false);
const isSubmitting = ref(false);

// Fetch appointment stats
const fetchStats = async () => {
  try {
    // Fetch upcoming appointments count
    const upcomingRes = await $http.$_getPatientAppointments({
      currentPage: 1,
      pageLimit: 1,
      status: 'OPEN'
    });

    // Fetch completed appointments count
    const completedRes = await $http.$_getPatientAppointments({
      currentPage: 1,
      pageLimit: 1,
      status: 'COMPLETED'
    });

    // Fetch missed appointments count
    const missedRes = await $http.$_getPatientAppointments({
      currentPage: 1,
      pageLimit: 1,
      status: 'MISSED'
    });

    const upcomingCount = upcomingRes?.data?.total || upcomingRes?.data?.data?.length || 0;
    const completedCount = completedRes?.data?.total || completedRes?.data?.data?.length || 0;
    const missedCount = missedRes?.data?.total || missedRes?.data?.data?.length || 0;

    stats.value = {
      total: upcomingCount + completedCount + missedCount,
      upcoming: upcomingCount,
      completed: completedCount,
      missed: missedCount,
    };
  } catch (error) {
    console.error("Error fetching stats:", error);
  }
};

// Update stats from child components
const updateStats = (newStats) => {
  if (newStats) {
    stats.value = { ...stats.value, ...newStats };
  }
};

onMounted(() => {
  fetchStats();
});

const goToHealthCheckup = () => {
  isOpen.value = false;
  bookingInfo.value.current = 0;
  // Navigate to health checkup
  window.location.href = '/app/patient/health-checkup';
};

const onClose = () => {
  isOpen.value = false;
  bookingInfo.value.current = 0;
  // Refresh stats after closing modal (in case a booking was made)
  fetchStats();
  upcomingAppointmentsKey.value = uniqueId(Math.random());
};

const onSubmitBooking = async () => {
  isSubmitting.value = true;

  const payload = {
    category: bookingInfo.value.payload.professional_category,
    date: bookingInfo.value.payload.selectedDate,
    time: bookingInfo.value.payload.selectedTime,
    timezone: bookingInfo.value.payload.time_zone,
    appointment_type: "Initial Appointment",
    specialist: bookingInfo.value.payload.id,
    meeting_channel: bookingInfo.value.payload.meeting_channel_value || 'zoom',
  };

  await $http
    .$_createAppointments(payload)
    .then(({ data }) => {
      $toast.success("Appointment booked successfully!");
      isSubmitting.value = false;
      onClose();
    })
    .catch((error) => {
      $toast.error(error.message);
      isSubmitting.value = false;
    });
};
</script>

<style scoped lang="scss">
.page-content {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  box-sizing: border-box;

  &__body {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    box-sizing: border-box;

    &::-webkit-scrollbar {
      display: none;
    }
  }
}

// Hero Banner
.hero-banner {
  background: linear-gradient(135deg, #0EAEC4 0%, #0891b2 50%, #0e7490 100%);
  border-radius: $size-24;
  padding: $size-32 $size-48;
  margin: $size-24 $size-48 $size-24;
  color: white;
  box-shadow: 0 10px 40px rgba(14, 174, 196, 0.3);
  box-sizing: border-box;

  @media (max-width: 768px) {
    margin: $size-16;
    padding: $size-24 $size-20;
    border-radius: $size-16;
  }

  @media (max-width: 480px) {
    margin: $size-12;
    padding: $size-20 $size-16;
    border-radius: $size-12;
  }
}

.hero-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: $size-24;
  gap: $size-16;

  @media (max-width: 768px) {
    flex-direction: column;
    margin-bottom: $size-20;
  }
}

.hero-text {
  flex: 1;
}

.hero-title {
  font-size: $size-32;
  font-weight: $fw-bold;
  margin: 0 0 $size-8 0;
  line-height: 1.2;

  @media (max-width: 768px) {
    font-size: $size-24;
  }

  @media (max-width: 480px) {
    font-size: $size-20;
  }
}

.hero-subtitle {
  font-size: $size-16;
  opacity: 0.9;
  margin: 0;
  line-height: 1.4;

  @media (max-width: 768px) {
    font-size: $size-14;
  }
}

.hero-actions {
  flex-shrink: 0;
}

.hero-cta {
  background: white;
  color: #0EAEC4;
  border: none;
  border-radius: $size-12;
  padding: $size-12 $size-24;
  font-weight: $fw-semi-bold;
  font-size: $size-14;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: $size-8;
  transition: all 0.3s ease;
  font-family: inherit;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: translateY(0);
  }
}

.hero-stats {
  display: flex;
  gap: $size-16;
  flex-wrap: wrap;

  @media (max-width: 480px) {
    gap: $size-12;
  }
}

.stat-item {
  text-align: center;
  background: rgba(255, 255, 255, 0.15);
  padding: $size-16 $size-24;
  border-radius: $size-12;
  min-width: 90px;
  backdrop-filter: blur(10px);

  @media (max-width: 768px) {
    padding: $size-12 $size-20;
    min-width: 80px;
  }

  @media (max-width: 480px) {
    flex: 1;
    min-width: calc(33.333% - $size-8);
    padding: $size-12 $size-8;
  }
}

.stat-value {
  display: block;
  font-size: $size-28;
  font-weight: $fw-bold;
  line-height: 1.2;

  @media (max-width: 768px) {
    font-size: $size-24;
  }

  @media (max-width: 480px) {
    font-size: $size-20;
  }

  &.missed {
    color: #fbbf24;
  }
}

.stat-label {
  font-size: $size-14;
  opacity: 0.9;
  margin-top: $size-4;
  display: block;

  @media (max-width: 480px) {
    font-size: $size-12;
  }
}

// Content Container
.content-container {
  padding: 0 $size-48 $size-24;
  flex: 1;
  overflow: hidden;
  box-sizing: border-box;

  @media (max-width: 768px) {
    padding: 0 $size-16 $size-24;
  }
}

.tabs-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;

  .tabs_content {
    flex: 1;
    overflow: hidden;
  }
}

// Pill Tabs
.pill-tabs {
  display: flex;
  gap: $size-12;
  margin-bottom: $size-24;
  flex-wrap: wrap;

  @media (max-width: 480px) {
    gap: $size-8;
    margin-bottom: $size-16;
  }
}

.pill-tab {
  display: flex;
  align-items: center;
  gap: $size-8;
  padding: $size-12 $size-20;
  border: 2px solid #e5e7eb;
  border-radius: $size-32;
  background: white;
  color: $color-g-44;
  font-size: $size-14;
  font-weight: $fw-medium;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: inherit;

  &:hover {
    border-color: #0EAEC4;
    color: #0EAEC4;
  }

  &--active {
    background: #0EAEC4;
    border-color: #0EAEC4;
    color: white;

    &:hover {
      background: #0891b2;
      border-color: #0891b2;
      color: white;
    }
  }

  @media (max-width: 480px) {
    padding: $size-10 $size-16;
    font-size: $size-13;
    gap: $size-6;
  }
}

.pill-badge {
  background: rgba(255, 255, 255, 0.3);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: $size-12;
  font-weight: $fw-semi-bold;

  .pill-tab:not(.pill-tab--active) & {
    background: #0EAEC4;
    color: white;
  }

  &.missed {
    .pill-tab:not(.pill-tab--active) & {
      background: #f97316;
      color: white;
    }
  }
}

// Floating Button
.button-floating {
  position: fixed !important;
  bottom: 24px;
  right: 24px;
  z-index: 100;
}

// Modal Styles
:deep(.modal) {
  max-width: 100% !important;
  max-height: 100% !important;

  @include responsive(tab-portrait) {
    min-width: 90% !important;
    max-width: 90% !important;
  }
  @include responsive(tab-landscape) {
    min-width: 90% !important;
    max-width: 90% !important;
  }
  @include responsive(phone) {
    min-width: 100% !important;
    max-width: 100% !important;
  }
}

:deep(.modal__body) {
  padding: 0 !important;
}

:deep(.modal__footer) {
  position: relative !important;
  display: flex;
  justify-content: center !important;
  align-items: center;
}

// Action Buttons
.action-button {
  display: flex;
  justify-content: space-between;
  position: relative;

  @include responsive(phone) {
    flex-direction: column;
    margin: 0;
    gap: $size-16;
    width: 100%;
  }
}

.multiple-btn {
  width: 100%;
}

.health-actions {
  width: 100%;
  gap: $size-16;
  justify-content: center;

  @include responsive(phone) {
    flex-direction: column-reverse;
  }
}

.btn-float-right {
  justify-content: flex-end;
  width: 100%;
}

// Visibility Classes
.desktop-visible {
  display: flex;

  @include responsive(phone) {
    display: none !important;
  }
}

.mobile-visible {
  display: none !important;

  @include responsive(phone) {
    display: flex !important;
  }
}
</style>
