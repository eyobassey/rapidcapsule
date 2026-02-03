<template>
  <div class="v2-wizard-page">
    <!-- Mobile Header - matches the design -->
    <header class="mobile-header">
      <button class="mobile-menu-btn" @click="openSideNav">
        <v-icon name="hi-menu-alt-2" scale="1.2" />
      </button>
      <div class="mobile-logo">
        <img src="/RapidCapsule_Logo.png" alt="Rapid Capsule" class="logo-img" />
        <span class="logo-text">Rapid Capsule</span>
      </div>
      <div class="mobile-header-right">
        <!-- Filter button - only shows on Step 3 (Category) -->
        <button
          v-if="state.currentStep === 3"
          class="mobile-filter-btn"
          @click="openCategoryFilters"
        >
          <v-icon name="hi-cog" scale="1" />
        </button>
        <button class="mobile-bell-btn">
          <v-icon name="hi-bell" scale="1.1" />
          <span class="notification-dot"></span>
        </button>
      </div>
    </header>

    <!-- Mobile Drawer Overlay -->
    <div
      v-if="isMobileDrawerOpen"
      class="drawer-overlay"
      @click="closeMobileDrawer"
    ></div>

    <!-- Mobile Drawer - Health Summary -->
    <aside class="mobile-drawer" :class="{ open: isMobileDrawerOpen }">
      <div class="drawer-header">
        <div class="drawer-user">
          <img
            v-if="userProfile?.profile_photo"
            :src="userProfile.profile_photo"
            class="user-avatar-img"
            alt="Profile"
          />
          <div v-else class="user-avatar-fallback">
            {{ (userProfile?.first_name?.[0] || 'U') }}{{ (userProfile?.last_name?.[0] || '') }}
          </div>
          <div class="user-info">
            <div class="user-name">{{ userProfile?.first_name }} {{ userProfile?.last_name }}</div>
            <div class="user-id">ID: #RC-{{ userId?.slice(-4) || '0000' }}</div>
          </div>
        </div>
        <button class="drawer-close" @click="closeMobileDrawer">
          <v-icon name="hi-x" scale="1.1" />
        </button>
      </div>

      <nav class="drawer-nav">
        <router-link to="/app/patient/dashboard" class="drawer-link" @click="closeMobileDrawer">
          <v-icon name="hi-home" scale="1" />
          <span>Dashboard</span>
        </router-link>
        <a href="#" class="drawer-link active">
          <v-icon name="hi-calendar" scale="1" />
          <span>Book Appointment</span>
        </a>
        <router-link to="/app/patient/appointmentsv2" class="drawer-link" @click="closeMobileDrawer">
          <v-icon name="hi-calendar" scale="1" />
          <span>My Appointments</span>
        </router-link>
        <router-link to="/app/patient/prescriptions" class="drawer-link" @click="closeMobileDrawer">
          <v-icon name="gi-medicines" scale="1" />
          <span>Prescriptions</span>
        </router-link>
        <router-link to="/app/patient/account" class="drawer-link" @click="closeMobileDrawer">
          <v-icon name="hi-user" scale="1" />
          <span>Profile</span>
        </router-link>
      </nav>

      <!-- Health Summary in Drawer -->
      <div class="drawer-health">
        <h4 class="health-section-title">Health Summary</h4>

        <!-- Vitals Card - 2x2 Grid like design -->
        <div class="vitals-card-dark">
          <div class="vitals-header">
            <span class="vitals-label">Last Vitals</span>
            <span class="vitals-time" v-if="vitalsData.lastUpdated">{{ vitalsData.lastUpdated }}</span>
          </div>
          <div class="vitals-grid">
            <div class="vital-cell">
              <div class="vital-label">Heart Rate</div>
              <div class="vital-value">{{ vitalsData.heartRate || '--' }} <span class="vital-unit">bpm</span></div>
            </div>
            <div class="vital-cell">
              <div class="vital-label">BP</div>
              <div class="vital-value">{{ vitalsData.bloodPressure || '--' }}</div>
            </div>
            <div class="vital-cell">
              <div class="vital-label">Weight</div>
              <div class="vital-value">{{ vitalsData.weight || '--' }} <span class="vital-unit">kg</span></div>
            </div>
            <div class="vital-cell">
              <div class="vital-label">Temp</div>
              <div class="vital-value">{{ vitalsData.temperature || '--' }}<span class="vital-unit" v-if="vitalsData.temperature && vitalsData.temperature !== '--'">°C</span></div>
            </div>
          </div>
        </div>

        <!-- Last Checkup Card -->
        <div class="last-checkup-card">
          <div class="checkup-title">Last Checkup</div>
          <div class="checkup-content">
            <div class="checkup-icon">
              <v-icon name="fa-stethoscope" scale="0.7" />
            </div>
            <div class="checkup-info">
              <div class="checkup-type">General Consultation</div>
              <div class="checkup-meta">Dr. Amina • 2 weeks ago</div>
            </div>
          </div>
        </div>

        <!-- Support Card -->
        <div class="support-card">
          <v-icon name="hi-chat-alt-2" scale="0.9" class="support-icon" />
          <div class="support-content">
            <div class="support-title">Need Help?</div>
            <button class="support-link">Start Chat</button>
          </div>
        </div>
      </div>
    </aside>

    <!-- Left Sidebar (Desktop Only) -->
    <health-sidebar class="desktop-sidebar" />

    <!-- Main Content -->
    <main class="wizard-main">
      <!-- Progress Header Section -->
      <div class="wizard-progress-section">
        <div class="progress-header">
          <div class="progress-info">
            <h1 class="progress-title">{{ stepTitles[state.currentStep] }}</h1>
            <p class="progress-subtitle">Step {{ state.currentStep }} of {{ state.totalSteps }}</p>
          </div>
          <button class="close-btn" @click="closeWizard">
            <v-icon name="hi-x" scale="1.2" />
          </button>
        </div>

        <!-- Mobile Progress Steps (matches design) -->
        <div class="mobile-stepper">
          <div class="stepper-track">
            <div
              class="stepper-progress"
              :style="{ width: `${((state.currentStep - 1) / (state.totalSteps - 1)) * 100}%` }"
            ></div>
          </div>
          <div class="stepper-steps">
            <div
              v-for="step in state.totalSteps"
              :key="step"
              class="step-circle"
              :class="{
                active: step === state.currentStep,
                completed: step < state.currentStep
              }"
            >
              <span v-if="step < state.currentStep">
                <v-icon name="hi-check" scale="0.6" />
              </span>
              <span v-else>{{ step }}</span>
            </div>
          </div>
        </div>

        <!-- Desktop Stepper -->
        <wizard-stepper
          class="desktop-stepper"
          :currentStep="state.currentStep"
          :steps="state.stepLabels"
        />
      </div>

      <!-- Step Content -->
      <div class="step-content">
        <transition name="step-slide" mode="out-in">
          <service-type-step v-if="state.currentStep === 1" key="step-1" />
          <agreement-step v-else-if="state.currentStep === 2" key="step-2" />
          <category-step v-else-if="state.currentStep === 3" key="step-3" ref="categoryStepRef" />
          <schedule-step v-else-if="state.currentStep === 4" key="step-4" />
          <specialist-step v-else-if="state.currentStep === 5" key="step-5" />
          <confirm-step v-else-if="state.currentStep === 6" key="step-6" @edit="state.goToStep(1)" />
        </transition>
      </div>

      <!-- Desktop Footer -->
      <footer class="wizard-footer desktop-footer">
        <div class="footer-inner">
          <div class="footer-left">
            <button
              v-if="state.currentStep > 1"
              class="nav-btn nav-btn-back"
              @click="state.prevStep()"
            >
              <v-icon name="hi-arrow-left" scale="0.85" />
              <span>Back</span>
            </button>
            <button
              class="nav-btn nav-btn-cancel"
              @click="closeWizard"
            >
              Cancel Booking
            </button>
          </div>

          <div class="footer-right">
            <div class="cost-estimate">
              <span class="cost-label">Estimated Cost</span>
              <span class="cost-value">{{ formattedCostDisplay }}</span>
            </div>

            <button
              class="nav-btn nav-btn-next"
              :class="{ loading: isSubmitting }"
              :disabled="!state.canProceed || isSubmitting"
              @click="handleNext"
            >
              <span>{{ nextButtonLabel }}</span>
              <div v-if="isSubmitting" class="btn-spinner"></div>
              <v-icon v-else name="hi-arrow-right" scale="0.85" />
            </button>
          </div>
        </div>
      </footer>
    </main>

    <!-- Mobile Fixed Bottom Action Bar (matches design) -->
    <div class="mobile-action-bar">
      <div class="action-bar-info">
        <div class="cost-info">
          <span class="cost-label">Estimated Cost</span>
          <span class="cost-value">{{ formattedCostDisplay }}</span>
        </div>
        <button class="cancel-link" @click="closeWizard">Cancel</button>
      </div>
      <button
        class="next-btn"
        :class="{ loading: isSubmitting }"
        :disabled="!state.canProceed || isSubmitting"
        @click="handleNext"
      >
        <span>{{ nextButtonLabel }}</span>
        <div v-if="isSubmitting" class="btn-spinner"></div>
        <v-icon v-else name="hi-arrow-right" scale="0.85" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, provide, inject, computed, onMounted, defineEmits } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { useToast } from 'vue-toast-notification';
import { useBookingStateV2 } from './composables/useBookingStateV2';
import WizardStepper from './WizardStepper.vue';
import HealthSidebar from './HealthSidebar.vue';
import ServiceTypeStep from './steps/ServiceTypeStep.vue';
import AgreementStep from './steps/AgreementStep.vue';
import CategoryStep from './steps/CategoryStep.vue';
import ScheduleStep from './steps/ScheduleStep.vue';
import SpecialistStep from './steps/SpecialistStep.vue';
import ConfirmStep from './steps/ConfirmStep.vue';
import RCAvatar from '@/components/RCAvatar/RCAvatar.vue';

const route = useRoute();
const router = useRouter();
const store = useStore();
const $toast = useToast();
const $http = inject('$_HTTP');

const emit = defineEmits(['open-side-nav']);

const state = reactive(useBookingStateV2(route));
const isSubmitting = ref(false);
const isMobileDrawerOpen = ref(false);
const categoryStepRef = ref(null);

// Provide booking state to child components
provide('bookingStateV2', state);

// User profile from store
const userProfile = computed(() => store.getters.userprofile?.profile || {});
const userId = computed(() => store.getters.userprofile?._id || '');

// Vitals data
const vitalsData = ref({
  heartRate: '--',
  bloodPressure: '--',
  weight: '--',
  temperature: '--',
  bloodSugar: '--',
  lastUpdated: '',
});

const stepTitles = {
  1: 'Select Service Type',
  2: 'Agreement & Consent',
  3: 'Select Specialist Category',
  4: 'Choose Date & Time',
  5: 'Select Your Doctor',
  6: 'Review & Confirm',
};

const nextButtonLabel = computed(() => {
  if (state.currentStep === state.totalSteps) {
    return 'Confirm & Pay';
  }
  return 'Next Step';
});

const formatCurrency = (amount) => {
  if (!amount) return null;
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount || 0);
};

// Format cost display - shows range if available, otherwise single price
const formattedCostDisplay = computed(() => {
  // If we have a range (service selected but no specialist yet)
  if (state.estimatedCostRange) {
    const min = formatCurrency(state.estimatedCostRange.min);
    const max = formatCurrency(state.estimatedCostRange.max);
    return `${min} - ${max}`;
  }
  // Otherwise show the single estimated cost
  return formatCurrency(state.estimatedCost) || '₦5,000 - ₦15,000';
});

const openSideNav = () => {
  isMobileDrawerOpen.value = true;
};

const closeMobileDrawer = () => {
  isMobileDrawerOpen.value = false;
};

const openCategoryFilters = () => {
  if (categoryStepRef.value) {
    categoryStepRef.value.showMobileFilters = true;
  }
};

const closeWizard = () => {
  router.push({ name: 'Appointmentsv2' });
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
    // Build payload with all required fields
    const payload = {
      ...state.bookingPayload,
      // Ensure payment method is included
      paymentMethod: state.payment.method,
      ...(state.payment.method === 'card' && state.payment.selectedCard
        ? { cardId: state.payment.selectedCard }
        : {}),
    };

    // Create the appointment
    const response = await $http.$_createAppointments(payload);
    const appointmentData = response?.data?.data || response?.data || {};
    const appointmentId = appointmentData._id || appointmentData.id;

    if (!appointmentId) {
      throw new Error('Failed to create appointment');
    }

    // Upload any attached files
    const attachments = state.attachments?.value || state.attachments || [];
    if (attachments.length > 0) {
      try {
        for (const file of attachments) {
          const formData = new FormData();
          formData.append('file', file); // Backend expects 'file' field name

          await $http.$_uploadAppointmentDocument(appointmentId, formData);
        }
      } catch (uploadError) {
        console.error('Failed to upload some documents:', uploadError);
        // Continue anyway - appointment was created successfully
        $toast.warning('Some documents could not be uploaded. You can upload them later.');
      }
    }

    // Check if payment is required (card payment via Paystack)
    if (appointmentData.payment_required && appointmentData.authorization_url) {
      $toast.info('Redirecting to payment...');
      // Store appointment data for after payment
      localStorage.setItem('pending_appointment_id', appointmentId);
      localStorage.setItem('pending_appointment_reference', appointmentData.payment_reference || '');
      // Redirect to Paystack
      window.location.href = appointmentData.authorization_url;
      return;
    }

    $toast.success('Appointment booked successfully!');

    // Clear health check session data if present
    if (state.hasHealthCheckData) {
      state.clearHealthCheckSession();
    }

    // Navigate to confirmation page with appointment data
    router.push({
      name: 'Appointmentsv2Confirmation',
      params: { id: appointmentId },
      query: {
        data: encodeURIComponent(JSON.stringify({
          ...appointmentData,
          specialist: state.specialist,
          category: state.category.specialist_category,
          date: state.schedule.date,
          time: state.schedule.time,
          timezone: state.schedule.timezone,
          meeting_channel: state.serviceType.method === 'video' ? 'zoom' : state.serviceType.method,
        })),
      },
    });
  } catch (error) {
    const msg = error?.response?.data?.message || error?.message || 'Something went wrong';
    $toast.error(msg);
  } finally {
    isSubmitting.value = false;
  }
};

// Fetch vitals - same approach as HealthSidebar
const fetchVitals = async () => {
  try {
    const uid = userId.value || store.getters.userprofile?._id;
    if (!uid) return;

    const { data } = await $http.$_getOneUserVitals(uid);
    const vitalsRaw = data?.data || data;

    // Helper to get the latest value from an array of vitals readings
    const getLatestValue = (arr) => {
      if (!arr || !Array.isArray(arr) || arr.length === 0) return null;
      const sorted = [...arr].sort((a, b) =>
        new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
      );
      return sorted[0]?.value || null;
    };

    // Helper to get the latest date from vitals arrays
    const getLatestDate = (vitalsObj) => {
      const dates = [];
      ['blood_pressure', 'pulse_rate', 'body_weight', 'body_temp', 'blood_sugar_level'].forEach(key => {
        if (vitalsObj[key] && Array.isArray(vitalsObj[key]) && vitalsObj[key].length > 0) {
          const latestEntry = vitalsObj[key][vitalsObj[key].length - 1];
          if (latestEntry?.updatedAt) {
            dates.push(new Date(latestEntry.updatedAt));
          }
        }
      });
      if (dates.length === 0) return null;
      return new Date(Math.max(...dates));
    };

    // Handle array of vitals records (multiple records)
    if (Array.isArray(vitalsRaw) && vitalsRaw.length > 0) {
      const sorted = vitalsRaw.sort((a, b) =>
        new Date(b.createdAt || b.created_at || b.date || 0) - new Date(a.createdAt || a.created_at || a.date || 0)
      );
      const recent = sorted[0];

      vitalsData.value = {
        heartRate: getLatestValue(recent.pulse_rate) || '--',
        bloodPressure: getLatestValue(recent.blood_pressure) || '--',
        weight: getLatestValue(recent.body_weight) || '--',
        temperature: getLatestValue(recent.body_temp) || '--',
        bloodSugar: getLatestValue(recent.blood_sugar_level) || '--',
        lastUpdated: calculateAgo(getLatestDate(recent)),
      };
    } else if (vitalsRaw && typeof vitalsRaw === 'object' && !Array.isArray(vitalsRaw)) {
      // Single vitals object
      vitalsData.value = {
        heartRate: getLatestValue(vitalsRaw.pulse_rate) || '--',
        bloodPressure: getLatestValue(vitalsRaw.blood_pressure) || '--',
        weight: getLatestValue(vitalsRaw.body_weight) || '--',
        temperature: getLatestValue(vitalsRaw.body_temp) || '--',
        bloodSugar: getLatestValue(vitalsRaw.blood_sugar_level) || '--',
        lastUpdated: calculateAgo(getLatestDate(vitalsRaw)),
      };
    }
  } catch (e) {
    console.error('Error fetching vitals:', e);
  }
};

const calculateAgo = (date) => {
  if (!date) return '';
  const now = new Date();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return `${Math.floor(diffDays / 7)}w ago`;
};

onMounted(() => {
  fetchVitals();

  // Initialize from route query params (for "Book Again" flow or health check)
  if (route.query.specialistId || route.query.category || route.query.from_health_check) {
    state.initFromRoute(route.query);
  }
});
</script>

<style scoped lang="scss">
// V2 Colors
$v2-sky: #4FC3F7;
$v2-sky-light: #E1F5FE;
$v2-sky-dark: #0288D1;
$v2-orange: #FF9800;
$v2-orange-light: #FFF3E0;
$v2-orange-dark: #F57C00;
$v2-navy: #1A365D;
$v2-success: #4CAF50;
$v2-gray-bg: #F5F9FF;

.v2-wizard-page {
  display: flex;
  height: 100vh;
  background: $v2-gray-bg;
  overflow: hidden;
  position: relative;
}

// ===========================================
// MOBILE HEADER (matches design)
// ===========================================
.mobile-header {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 40;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #f1f5f9;
  height: 56px;
  padding: 0 16px;
  align-items: center;
  justify-content: space-between;

  @media (max-width: 1024px) {
    display: flex;
  }
}

.mobile-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mobile-menu-btn,
.mobile-bell-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: #64748b;
  cursor: pointer;
  border-radius: 10px;

  &:active {
    background: #f1f5f9;
  }
}

.mobile-bell-btn {
  position: relative;
  border: 1px solid #e2e8f0;
  border-radius: 50%;
}

.notification-dot {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 6px;
  height: 6px;
  background: $v2-orange;
  border-radius: 50%;
  border: 1.5px solid white;
}

.mobile-filter-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: white;
  color: #64748b;
  cursor: pointer;

  &:active {
    background: #f1f5f9;
  }
}

.mobile-logo {
  display: flex;
  align-items: center;
  gap: 8px;

  .logo-img {
    width: 32px;
    height: 32px;
    object-fit: contain;
  }

  .logo-text {
    font-size: 16px;
    font-weight: 700;
    color: $v2-navy;
    font-family: 'Poppins', system-ui, sans-serif;
  }
}

// ===========================================
// MOBILE DRAWER (matches design)
// ===========================================
.drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 45;
}

.mobile-drawer {
  position: fixed;
  top: 0;
  left: 0;
  width: 288px;
  height: 100%;
  background: white;
  z-index: 50;
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.15);
  transform: translateX(-100%);
  transition: transform 0.3s ease;
  overflow-y: auto;
  display: none;

  @media (max-width: 1024px) {
    display: block;
  }

  &.open {
    transform: translateX(0);
  }
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #f1f5f9;
}

.drawer-user {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar-img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid $v2-sky;
  flex-shrink: 0;
}

.user-avatar-fallback {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, $v2-sky, $v2-sky-dark);
  border: 2px solid $v2-sky;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}

.user-name {
  font-size: 14px;
  font-weight: 700;
  color: $v2-navy;
}

.user-id {
  font-size: 12px;
  color: #64748b;
}

.drawer-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
}

.drawer-nav {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.drawer-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  text-decoration: none;
  border-radius: 10px;
  transition: all 0.2s ease;

  &:hover,
  &:active {
    background: #f8fafc;
  }

  &.active {
    background: rgba($v2-sky-light, 0.5);
    color: $v2-sky;
    font-weight: 700;
  }
}

.drawer-health {
  padding: 16px;
  border-top: 1px solid #f1f5f9;
  margin-top: 16px;
}

.health-section-title {
  font-size: 12px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 12px;
}

.vitals-card-dark {
  background: linear-gradient(135deg, $v2-navy, #2d3748);
  border-radius: 12px;
  padding: 16px;
  color: white;
  margin-bottom: 12px;
}

.vitals-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.vitals-label {
  font-size: 12px;
  font-weight: 500;
  opacity: 0.8;
  color: white;
}

.vitals-time {
  font-size: 10px;
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 8px;
  border-radius: 4px;
  color: white;
}

// Vitals 2x2 Grid (matches design)
.vitals-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.vital-cell {
  .vital-label {
    font-size: 10px;
    color: rgba(255, 255, 255, 0.6);
    margin-bottom: 4px;
  }

  .vital-value {
    font-size: 18px;
    font-weight: 700;
    color: white;
    line-height: 1.2;

    .vital-unit {
      font-size: 12px;
      font-weight: 400;
      opacity: 0.6;
    }
  }
}

// Last Checkup Card
.last-checkup-card {
  background: #f8fafc;
  border: 1px solid #f1f5f9;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 12px;

  .checkup-title {
    font-size: 12px;
    font-weight: 700;
    color: $v2-navy;
    margin-bottom: 8px;
  }

  .checkup-content {
    display: flex;
    gap: 10px;
  }

  .checkup-icon {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #dbeafe;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #2563eb;
    flex-shrink: 0;
  }

  .checkup-info {
    flex: 1;
  }

  .checkup-type {
    font-size: 12px;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 2px;
  }

  .checkup-meta {
    font-size: 10px;
    color: #64748b;
  }
}

.support-card {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: $v2-orange-light;
  border-radius: 12px;
  padding: 12px;

  .support-icon {
    color: $v2-orange-dark;
    margin-top: 2px;
  }

  .support-title {
    font-size: 12px;
    font-weight: 700;
    color: $v2-orange-dark;
    margin-bottom: 4px;
  }

  .support-link {
    background: transparent;
    border: none;
    font-size: 11px;
    font-weight: 700;
    color: $v2-navy;
    text-decoration: underline;
    cursor: pointer;
    padding: 0;
  }
}

// ===========================================
// DESKTOP SIDEBAR
// ===========================================
.desktop-sidebar {
  @media (max-width: 1024px) {
    display: none;
  }
}

// ===========================================
// MAIN CONTENT
// ===========================================
.wizard-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: #f8fafc;

  @media (max-width: 1024px) {
    padding-top: 56px; // Account for mobile header
  }
}

// ===========================================
// PROGRESS SECTION
// ===========================================
.wizard-progress-section {
  flex-shrink: 0;
  background: white;
  border-bottom: 1px solid #f1f5f9;
  padding: 16px;

  @media (min-width: 1025px) {
    padding: 24px 32px;
  }
}

.progress-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 16px;
}

.progress-info {
  flex: 1;
}

.progress-title {
  font-size: 18px;
  font-weight: 700;
  color: $v2-navy;
  margin: 0 0 4px;
  font-family: 'Poppins', system-ui, sans-serif;

  @media (min-width: 1025px) {
    font-size: 24px;
  }
}

.progress-subtitle {
  font-size: 12px;
  color: #64748b;
  margin: 0;

  @media (min-width: 1025px) {
    font-size: 14px;
  }
}

.close-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  border-radius: 8px;

  &:hover,
  &:active {
    background: #f1f5f9;
    color: #475569;
  }
}

// ===========================================
// MOBILE STEPPER (matches design)
// ===========================================
.mobile-stepper {
  position: relative;

  @media (min-width: 1025px) {
    display: none;
  }
}

.stepper-track {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 2px;
  background: #e2e8f0;
  transform: translateY(-50%);
  border-radius: 2px;
}

.stepper-progress {
  height: 100%;
  background: $v2-sky;
  border-radius: 2px;
  transition: width 0.5s ease;
}

.stepper-steps {
  position: relative;
  display: flex;
  justify-content: space-between;
}

.step-circle {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: white;
  border: 2px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  color: #94a3b8;
  transition: all 0.3s ease;

  &.active {
    background: $v2-sky;
    border-color: $v2-sky;
    color: white;
    box-shadow: 0 0 0 3px $v2-sky-light;
  }

  &.completed {
    background: $v2-sky;
    border-color: $v2-sky;
    color: white;
  }
}

// Desktop stepper
.desktop-stepper {
  display: none;

  @media (min-width: 1025px) {
    display: block;
  }
}

// ===========================================
// STEP CONTENT
// ===========================================
.step-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding-bottom: 140px;

  @media (min-width: 1025px) {
    padding-bottom: 100px;
  }

  &::-webkit-scrollbar {
    display: none;
  }
}

// ===========================================
// DESKTOP FOOTER
// ===========================================
.desktop-footer {
  display: none;

  @media (min-width: 1025px) {
    display: block;
    position: fixed;
    bottom: 0;
    left: 320px;
    right: 0;
    background: white;
    border-top: 1px solid #e2e8f0;
    padding: 16px 32px;
    z-index: 100;
  }
}

.footer-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.footer-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.footer-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.cost-estimate {
  text-align: right;
}

.cost-label {
  display: block;
  font-size: 11px;
  font-weight: 500;
  color: #64748b;
  margin-bottom: 2px;
}

.cost-value {
  font-size: 16px;
  font-weight: 700;
  color: $v2-orange;
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.nav-btn-back {
  background: #f1f5f9;
  color: #64748b;

  &:hover {
    background: #e2e8f0;
    color: #475569;
  }
}

.nav-btn-cancel {
  background: transparent;
  color: #64748b;

  &:hover {
    background: #f1f5f9;
  }
}

.nav-btn-next {
  background: $v2-orange;
  color: white;
  padding: 12px 32px;
  box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);

  &:hover:not(:disabled) {
    background: $v2-orange-dark;
  }

  &:disabled {
    background: #cbd5e1;
    cursor: not-allowed;
    box-shadow: none;
  }
}

// ===========================================
// MOBILE ACTION BAR (matches design)
// ===========================================
.mobile-action-bar {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid #e2e8f0;
  padding: 16px;
  z-index: 30;

  @media (max-width: 1024px) {
    display: block;
  }
}

.action-bar-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.cost-info {
  .cost-label {
    display: block;
    font-size: 10px;
    color: #64748b;
    margin-bottom: 2px;
  }

  .cost-value {
    font-size: 14px;
    font-weight: 700;
    color: $v2-navy;
  }
}

.cancel-link {
  background: transparent;
  border: none;
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;

  &:active {
    background: #f1f5f9;
  }
}

.next-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 24px;
  background: $v2-orange;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
  min-height: 48px;
  transition: all 0.2s ease;

  &:active:not(:disabled) {
    background: $v2-orange-dark;
  }

  &:disabled {
    background: #cbd5e1;
    cursor: not-allowed;
    box-shadow: none;
  }
}

.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
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
