<template>
  <div class="confirm-step">
    <!-- Hero Banner -->
    <div class="booking-hero">
      <div class="hero-icon-wrapper">
        <v-icon name="hi-check-circle" scale="1.8" class="hero-icon" />
      </div>
      <div class="hero-text">
        <h2 class="hero-title">{{ booking.mode === 'reschedule' ? 'Confirm Reschedule' : 'Review & Confirm' }}</h2>
        <p class="hero-desc">{{ booking.mode === 'reschedule' ? 'Review your new appointment details and confirm the reschedule.' : 'Review your appointment details, select a payment method, and confirm your booking.' }}</p>
      </div>
    </div>

    <!-- Summary Card -->
    <div class="summary-card">
      <h3 class="summary-title">Appointment Summary</h3>

      <!-- Specialist Info -->
      <div class="summary-specialist">
        <rc-avatar
          size="lg"
          :firstName="booking.specialist.profile?.first_name || ''"
          :lastName="booking.specialist.profile?.last_name || ''"
          :modelValue="booking.specialist.profile?.profile_image"
        />
        <div class="specialist-details">
          <h4 class="specialist-name">{{ booking.specialist.full_name }}</h4>
          <p class="specialist-practice">{{ booking.specialist.professional_practice }}</p>
          <div class="specialist-rating" v-if="booking.specialist.average_rating">
            <v-icon name="bi-star-fill" scale="0.7" class="star-icon" />
            <span>{{ booking.specialist.average_rating?.toFixed(1) }}</span>
          </div>
        </div>
      </div>

      <!-- Appointment Details -->
      <div class="summary-details">
        <div class="detail-row">
          <div class="detail-icon"><v-icon name="hi-calendar" scale="0.9" /></div>
          <div class="detail-content">
            <span class="detail-label">Date</span>
            <span class="detail-value">{{ formattedDate }}</span>
          </div>
        </div>
        <div class="detail-row">
          <div class="detail-icon"><v-icon name="hi-clock" scale="0.9" /></div>
          <div class="detail-content">
            <span class="detail-label">Time</span>
            <span class="detail-value">{{ formattedTime }}</span>
          </div>
        </div>
        <div class="detail-row">
          <div class="detail-icon"><v-icon name="hi-globe-alt" scale="0.9" /></div>
          <div class="detail-content">
            <span class="detail-label">Timezone</span>
            <span class="detail-value">{{ booking.schedule.timezone }}</span>
          </div>
        </div>
        <div class="detail-row">
          <div class="detail-icon"><v-icon name="hi-video-camera" scale="0.9" /></div>
          <div class="detail-content">
            <span class="detail-label">Channel</span>
            <span class="detail-value">{{ formatChannel(booking.schedule.meeting_channel) }}</span>
          </div>
        </div>
        <div class="detail-row">
          <div class="detail-icon"><v-icon name="hi-tag" scale="0.9" /></div>
          <div class="detail-content">
            <span class="detail-label">Type</span>
            <span class="detail-value">{{ appointmentType }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Payment Section (hidden in reschedule mode) -->
    <div class="payment-section" v-if="booking.mode !== 'reschedule'">
      <h3 class="payment-title">Payment Method</h3>

      <div v-if="isLoadingPayment" class="cards-loading">
        <loader :useOverlay="false" style="position: relative" />
      </div>

      <div v-else>
        <!-- Wallet Option -->
        <label
          class="card-item wallet-item"
          :class="{ selected: paymentMethod === 'wallet' }"
        >
          <input
            type="radio"
            value="wallet"
            v-model="paymentMethod"
            class="card-radio"
          />
          <div class="card-info">
            <div class="wallet-icon-wrapper">
              <v-icon name="bi-wallet2" scale="1.1" class="wallet-icon" />
            </div>
            <div class="card-details">
              <span class="card-number">Wallet Balance</span>
              <span class="wallet-balance" :class="{ 'low-balance': walletBalance <= 0 }">
                {{ formatCurrency(walletBalance) }}
              </span>
            </div>
          </div>
          <div v-if="paymentMethod === 'wallet'" class="card-check">
            <v-icon name="hi-check-circle" scale="0.85" />
          </div>
        </label>

        <!-- Divider -->
        <div class="payment-divider">
          <span>or pay with card</span>
        </div>

        <!-- Saved Cards -->
        <div v-if="cards.length" class="cards-list">
          <label
            v-for="card in cards"
            :key="card._id || card.id"
            class="card-item"
            :class="{ selected: paymentMethod === 'card' && booking.payment.selectedCard === (card._id || card.id) }"
          >
            <input
              type="radio"
              value="card"
              v-model="paymentMethod"
              class="card-radio"
              @change="booking.payment.selectedCard = card._id || card.id"
            />
            <div class="card-info">
              <v-icon name="hi-credit-card" scale="1" class="card-icon" />
              <div class="card-details">
                <span class="card-number">**** **** **** {{ card.last4 || card.last_four }}</span>
                <span class="card-brand">{{ card.brand || card.card_type }}</span>
              </div>
            </div>
            <div v-if="paymentMethod === 'card' && booking.payment.selectedCard === (card._id || card.id)" class="card-check">
              <v-icon name="hi-check-circle" scale="0.85" />
            </div>
          </label>
        </div>

        <!-- Add Card Button -->
        <button class="add-card-btn" @click="addPaymentCard">
          <v-icon name="hi-plus" scale="0.85" />
          <span>Add Payment Card</span>
        </button>

        <p class="billing-note">
          <v-icon name="hi-information-circle" scale="0.8" />
          You will only be charged after the first 5 minutes of consultation.
        </p>
      </div>
    </div>

    <!-- Health Check Banner (when coming from health checkup) -->
    <div v-if="hasHealthCheckData" class="health-check-section">
      <div class="health-check-banner">
        <div class="health-check-icon">
          <v-icon name="hi-clipboard-check" scale="1.2" />
        </div>
        <div class="health-check-info">
          <h4>Health Assessment Linked</h4>
          <p>Your recent health checkup results will be shared with the specialist</p>
        </div>
        <a
          v-if="booking.healthCheckData.checkup_id"
          :href="`/app/patient/health-checkup/report/${booking.healthCheckData.checkup_id}`"
          target="_blank"
          class="view-results-link"
        >
          <v-icon name="hi-external-link" scale="0.85" />
          View Results
        </a>
      </div>

      <!-- Patient Notes Section -->
      <div class="patient-notes">
        <label class="notes-label">
          <v-icon name="hi-annotation" scale="0.9" />
          <span>Notes for the Specialist</span>
        </label>
        <textarea
          v-model="booking.patientNotes"
          class="notes-textarea"
          placeholder="Describe your symptoms or any additional information you'd like the specialist to know..."
          rows="5"
        ></textarea>
        <p class="notes-hint">
          <v-icon name="hi-information-circle" scale="0.8" />
          This note will be visible to the specialist before your appointment
        </p>
      </div>
    </div>

    <!-- Simple Notes Section (when not from health check) -->
    <div v-else-if="booking.mode !== 'reschedule'" class="simple-notes-section">
      <div class="patient-notes">
        <label class="notes-label">
          <v-icon name="hi-annotation" scale="0.9" />
          <span>Notes for the Specialist (Optional)</span>
        </label>
        <textarea
          v-model="booking.patientNotes"
          class="notes-textarea"
          placeholder="Describe your symptoms or reason for this appointment..."
          rows="4"
        ></textarea>
      </div>
    </div>

    <!-- Terms Checkbox -->
    <div class="terms-section" v-if="booking.mode !== 'reschedule'">
      <label class="terms-checkbox">
        <input type="checkbox" v-model="booking.payment.termsAccepted" />
        <span class="terms-text">
          I agree to the
          <a href="/terms-of-service" target="_blank">Terms of Service</a>
          and
          <a href="/privacy-policy" target="_blank">Privacy Policy</a>
        </span>
      </label>
    </div>
  </div>
</template>

<script setup>
import { ref, inject, onMounted, computed, watch } from 'vue';
import { format, parseISO } from 'date-fns';
import RcAvatar from '@/components/RCAvatar';
import Loader from '@/components/Loader/main-loader.vue';

const $http = inject('$_HTTP');
const booking = inject('bookingState');

const cards = ref([]);
const walletBalance = ref(0);
const paymentMethod = ref('wallet');
const isLoadingPayment = ref(false);

const hasHealthCheckData = computed(() => {
  return booking.fromHealthCheck || !!booking.healthCheckData?.checkup_id;
});

const formattedDate = computed(() => {
  if (!booking.schedule.date) return '';
  try {
    const date = typeof booking.schedule.date === 'string'
      ? parseISO(booking.schedule.date)
      : booking.schedule.date;
    return format(date, 'EEEE, MMMM dd, yyyy');
  } catch {
    return booking.schedule.date;
  }
});

const formattedTime = computed(() => {
  const time = booking.schedule.time;
  if (!time) return '';
  if (time.includes('AM') || time.includes('PM')) return time;
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
});

const appointmentType = computed(() => {
  if (booking.mode === 'followup') return 'Follow-up';
  if (booking.mode === 'reschedule') return 'Reschedule';
  return 'Initial Appointment';
});

const formatChannel = (channel) => {
  const map = { zoom: 'Zoom', google_meet: 'Google Meet', phone: 'Phone Call' };
  return map[channel] || channel || '-';
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount || 0);
};

onMounted(() => {
  if (booking.mode !== 'reschedule') {
    fetchPaymentData();
  }
});

const fetchPaymentData = async () => {
  isLoadingPayment.value = true;
  try {
    const [cardsRes, walletRes] = await Promise.allSettled([
      $http.$_getPaymentCards(),
      $http.$_getWalletBalance(),
    ]);
    if (cardsRes.status === 'fulfilled') {
      cards.value = cardsRes.value?.data?.data || cardsRes.value?.data || [];
      booking.payment.cards = cards.value;
    }
    if (walletRes.status === 'fulfilled') {
      const walletData = walletRes.value?.data?.data || walletRes.value?.data || {};
      walletBalance.value = walletData.currentBalance || walletData.balance || 0;
    }
  } catch (error) {
    console.error('Error fetching payment data:', error);
  } finally {
    isLoadingPayment.value = false;
  }
};

watch(paymentMethod, (val) => {
  booking.payment.paymentMethod = val;
  if (val === 'wallet') {
    booking.payment.selectedCard = null;
  }
});

const addPaymentCard = async () => {
  try {
    const { data } = await $http.$_addPaymentCard({});
    // Paystack returns an authorization_url for card tokenization
    if (data?.data?.authorization_url) {
      window.open(data.data.authorization_url, '_blank');
      // Refetch after some delay
      setTimeout(() => fetchPaymentData(), 5000);
    }
  } catch (error) {
    console.error('Error adding card:', error);
  }
};
</script>

<style scoped lang="scss">
.confirm-step {
  padding: 16px 24px 32px;
  max-width: 640px;
  margin: 0 auto;

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

.summary-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
}

.summary-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 20px;
}

.summary-specialist {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f3f4f6;
  margin-bottom: 20px;
}

.specialist-details {
  flex: 1;
}

.specialist-name {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 4px;
}

.specialist-practice {
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 6px;
}

.specialist-rating {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #6b7280;

  .star-icon {
    color: #fbbf24;
  }
}

.summary-details {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.detail-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.detail-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(14, 174, 196, 0.08);
  border-radius: 10px;
  color: #0EAEC4;
  flex-shrink: 0;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.detail-label {
  font-size: 12px;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-value {
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
}

// Payment Section
.payment-section {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
}

.payment-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 16px;
}

.cards-loading {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.cards-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}

.card-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #0EAEC4;
  }

  &.selected {
    border-color: #0EAEC4;
    background: rgba(14, 174, 196, 0.04);
  }
}

.card-radio {
  display: none;
}

.card-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.card-icon {
  color: #6b7280;
}

.card-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.card-number {
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
}

.card-brand {
  font-size: 12px;
  color: #9ca3af;
  text-transform: capitalize;
}

.card-check {
  color: #0EAEC4;
}

.add-card-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border: 2px dashed #e5e7eb;
  border-radius: 12px;
  background: transparent;
  color: #6b7280;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  width: 100%;
  transition: all 0.2s ease;

  &:hover {
    border-color: #0EAEC4;
    color: #0EAEC4;
  }
}

// Wallet
.wallet-item {
  margin-bottom: 12px;
}

.wallet-icon-wrapper {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(14, 174, 196, 0.1);
  border-radius: 10px;
  flex-shrink: 0;

  .wallet-icon {
    color: #0EAEC4;
  }
}

.wallet-balance {
  font-size: 14px;
  font-weight: 600;
  color: #0EAEC4;

  &.low-balance {
    color: #ef4444;
  }
}

.payment-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 16px 0;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #e5e7eb;
  }

  span {
    font-size: 12px;
    color: #9ca3af;
    white-space: nowrap;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
}

.billing-note {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #9ca3af;
  margin: 14px 0 0;
}

// Terms
.terms-section {
  margin-top: 4px;
}

.terms-checkbox {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  cursor: pointer;

  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    margin-top: 2px;
    accent-color: #0EAEC4;
    cursor: pointer;
  }
}

.terms-text {
  font-size: 14px;
  color: #6b7280;
  line-height: 1.5;

  a {
    color: #0EAEC4;
    text-decoration: none;
    font-weight: 500;

    &:hover {
      text-decoration: underline;
    }
  }
}

// Health Check Section
.health-check-section,
.simple-notes-section {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
}

.health-check-banner {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: linear-gradient(135deg, #e0f2fe 0%, #e1f5fe 100%);
  border: 1px solid #7dd3fc;
  border-radius: 12px;
  margin-bottom: 20px;

  @media (max-width: 600px) {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }
}

.health-check-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #4FC3F7 0%, #0288D1 100%);
  border-radius: 12px;
  color: white;
  flex-shrink: 0;
}

.health-check-info {
  flex: 1;

  h4 {
    font-size: 15px;
    font-weight: 600;
    color: #0c4a6e;
    margin: 0 0 4px;
  }

  p {
    font-size: 13px;
    color: #0369a1;
    margin: 0;
  }
}

.view-results-link {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: white;
  border: 1px solid #7dd3fc;
  border-radius: 10px;
  color: #0284c7;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s;
  white-space: nowrap;

  &:hover {
    background: #f0f9ff;
    border-color: #0284c7;
  }

  @media (max-width: 600px) {
    width: 100%;
    justify-content: center;
  }
}

.patient-notes {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.notes-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #374151;

  svg {
    color: #0EAEC4;
  }
}

.notes-textarea {
  width: 100%;
  padding: 14px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.6;
  color: #1f2937;
  resize: vertical;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #0EAEC4;
  }

  &::placeholder {
    color: #9ca3af;
  }
}

.notes-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #9ca3af;
  margin: 0;

  svg {
    flex-shrink: 0;
  }
}
</style>
