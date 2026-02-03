<template>
  <div class="book-appointment-page">
    <!-- Header -->
    <header class="booking-header">
      <button class="back-button" @click="goBack">
        <v-icon name="hi-arrow-left" scale="1" />
      </button>
      <h1 class="booking-title">{{ state.pageTitle }}</h1>
    </header>

    <!-- Stepper -->
    <booking-stepper
      :currentStep="state.currentStep"
      :minStep="state.minStep"
    />

    <!-- Step Content -->
    <div class="step-content">
      <transition name="step-slide" mode="out-in">
        <specialty-step v-if="state.currentStep === 1" key="step-1" />
        <specialist-step v-else-if="state.currentStep === 2" key="step-2" />
        <schedule-step v-else-if="state.currentStep === 3" key="step-3" />
        <confirm-step v-else-if="state.currentStep === 4" key="step-4" />
      </transition>
    </div>

    <!-- Bottom Navigation -->
    <div class="step-navigation">
      <button
        v-if="state.currentStep > state.minStep"
        class="nav-btn nav-btn-back"
        @click="state.prevStep()"
      >
        <v-icon name="hi-arrow-left" scale="0.85" />
        <span>Back</span>
      </button>
      <div v-else class="nav-spacer"></div>

      <button
        class="nav-btn nav-btn-next"
        :disabled="!state.canProceed || isSubmitting"
        @click="handleNext"
      >
        <span>{{ nextButtonLabel }}</span>
        <loader v-if="isSubmitting" :useOverlay="false" style="position: relative; width: 20px; height: 20px;" />
        <v-icon v-else-if="state.currentStep < state.totalSteps" name="hi-arrow-right" scale="0.85" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, provide, inject, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'vue-toast-notification';
import { useBookingState } from './composables/useBookingState';
import BookingStepper from './BookingStepper.vue';
import SpecialtyStep from './steps/SpecialtyStep.vue';
import SpecialistStep from './steps/SpecialistStep.vue';
import ScheduleStep from './steps/ScheduleStep.vue';
import ConfirmStep from './steps/ConfirmStep.vue';
import Loader from '@/components/Loader/main-loader.vue';

const route = useRoute();
const router = useRouter();
const $toast = useToast();
const $http = inject('$_HTTP');

const state = reactive(useBookingState(route));
const isSubmitting = ref(false);

// Provide booking state to child components
provide('bookingState', state);

const nextButtonLabel = computed(() => {
  if (state.currentStep === state.totalSteps) {
    if (state.mode === 'reschedule') return 'Reschedule';
    return 'Confirm & Book';
  }
  return 'Next';
});

onMounted(async () => {
  // If coming from health check, load the stored data
  if (state.fromHealthCheck || route.query.from_health_check === 'true') {
    state.loadHealthCheckFromSession();
  }

  // If followup or reschedule mode, pre-fetch specialist info
  if ((state.mode === 'followup' || state.mode === 'reschedule') && route.query.specialistId) {
    try {
      const { data } = await $http.$_getOneUser(route.query.specialistId);
      if (data?.data) {
        state.setSpecialist({
          id: data.data._id || data.data.id,
          full_name: data.data.full_name,
          profile: data.data.profile,
          average_rating: data.data.average_rating,
          professional_practice: data.data.professional_practice,
        });
      }
    } catch (error) {
      console.error('Error fetching specialist:', error);
    }
  }

  // If category is provided (followup), set specialty
  if (route.query.category) {
    state.setSpecialty({ professional_category: route.query.category });
  }
});

const goBack = () => {
  if (state.currentStep > state.minStep) {
    state.prevStep();
  } else {
    router.back();
  }
};

const handleNext = async () => {
  if (state.currentStep < state.totalSteps) {
    state.nextStep();
  } else {
    await submitBooking();
  }
};

const submitBooking = async () => {
  isSubmitting.value = true;

  try {
    if (state.mode === 'reschedule') {
      await $http.$_rescheduleAppointments(state.reschedulePayload);
      $toast.success('Appointment rescheduled successfully!');
    } else {
      await $http.$_createAppointments(state.bookingPayload);
      $toast.success('Appointment booked successfully!');
    }
    router.push({ name: 'Appointments' });
  } catch (error) {
    const msg = error?.response?.data?.message || error?.message || 'Something went wrong';
    $toast.error(msg);
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped lang="scss">
.book-appointment-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f9fafb;
  overflow: hidden;
}

.booking-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  background: white;
  border-bottom: 1px solid #f3f4f6;
  flex-shrink: 0;

  @media (max-width: 600px) {
    padding: 16px;
  }
}

.back-button {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: #f3f4f6;
  border-radius: 10px;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #e5e7eb;
  }
}

.booking-title {
  font-size: 22px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;

  @media (max-width: 600px) {
    font-size: 18px;
  }
}

.step-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;

  &::-webkit-scrollbar {
    display: none;
  }
}

.step-navigation {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: white;
  border-top: 1px solid #f3f4f6;
  flex-shrink: 0;
  gap: 12px;

  @media (max-width: 600px) {
    padding: 12px 16px;
  }
}

.nav-spacer {
  flex: 1;
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  @media (max-width: 600px) {
    padding: 12px 16px;
    font-size: 14px;
  }
}

.nav-btn-back {
  background: #f3f4f6;
  color: #6b7280;

  &:hover {
    background: #e5e7eb;
    color: #374151;
  }
}

.nav-btn-next {
  background: linear-gradient(135deg, #0EAEC4 0%, #0891b2 100%);
  color: white;
  margin-left: auto;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(14, 174, 196, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  @media (max-width: 600px) {
    flex: 1;
    justify-content: center;
  }
}

// Step transition
.step-slide-enter-active,
.step-slide-leave-active {
  transition: all 0.25s ease;
}

.step-slide-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.step-slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>
