<template>
  <div class="confirm-step">
    <div class="confirm-grid">
      <!-- Left Column: Review Details -->
      <div class="review-column">
        <!-- Appointment Summary Card -->
        <section class="summary-card">
          <div class="card-header">
            <h2 class="card-title">Appointment Summary</h2>
            <button class="edit-btn" @click="handleEdit">Edit Details</button>
          </div>

          <div class="card-body">
            <!-- Doctor Info -->
            <div class="doctor-info">
              <div class="doctor-avatar-wrapper">
                <img
                  v-if="booking.specialist.profile?.profile_photo"
                  :src="booking.specialist.profile.profile_photo"
                  :alt="booking.specialist.full_name"
                  class="doctor-avatar"
                />
                <div v-else class="doctor-avatar-placeholder">
                  {{ getInitials(booking.specialist) }}
                </div>
              </div>
              <div class="doctor-details">
                <h3 class="doctor-name">{{ booking.specialist.full_name }}</h3>
                <p class="doctor-specialty">
                  {{ booking.specialist.professional_practice?.area_of_specialty || booking.category.specialist_category }}
                </p>
                <div class="doctor-badges">
                  <span class="badge badge-sky">
                    <v-icon :name="methodIcon" scale="0.7" />
                    {{ methodLabel }}
                  </span>
                  <span class="badge badge-gray">30 Mins</span>
                  <span v-if="booking.serviceType.urgency" :class="['badge', booking.serviceType.urgency === 'urgent' ? 'badge-urgent' : 'badge-routine']">
                    <v-icon :name="booking.serviceType.urgency === 'urgent' ? 'hi-lightning-bolt' : 'hi-clipboard-check'" scale="0.7" />
                    {{ booking.serviceType.urgency === 'urgent' ? 'Urgent Care' : 'Routine' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Date & Time Grid -->
            <div class="datetime-grid">
              <div class="datetime-item">
                <div class="datetime-icon sky">
                  <v-icon name="hi-calendar" scale="1" />
                </div>
                <div class="datetime-content">
                  <span class="datetime-label">Date</span>
                  <span class="datetime-value">{{ formattedDate }}</span>
                </div>
              </div>
              <div class="datetime-item">
                <div class="datetime-icon orange">
                  <v-icon name="hi-clock" scale="1" />
                </div>
                <div class="datetime-content">
                  <span class="datetime-label">Time</span>
                  <span class="datetime-value">{{ formattedTime }} ({{ timezoneShort }})</span>
                </div>
              </div>
            </div>

            <!-- Consent Status -->
            <div class="consent-status">
              <v-icon name="hi-check-circle" scale="0.85" class="consent-icon" />
              <span>Patient consent and telemedicine agreement signed.</span>
            </div>
          </div>
        </section>

        <!-- Pre-Visit Notes -->
        <section class="notes-section">
          <h2 class="section-title">
            <v-icon name="hi-clipboard-list" scale="0.9" />
            Add Symptoms or Notes
          </h2>
          <div class="notes-input-wrapper">
            <textarea
              v-model="patientNotes"
              class="notes-textarea"
              placeholder="Briefly describe your symptoms, recent vitals, or any questions for the doctor..."
            ></textarea>
            <div class="notes-actions">
              <input
                type="file"
                ref="fileInput"
                @change="handleFileSelect"
                accept="image/*,.pdf,.doc,.docx"
                multiple
                class="hidden-file-input"
              />
              <button class="attach-btn" @click="triggerFileInput" title="Attach File">
                <v-icon name="hi-paper-clip" scale="0.85" />
              </button>
            </div>
          </div>

          <!-- Attached Files List -->
          <div class="attached-files" v-if="attachedFiles.length > 0">
            <div class="file-item" v-for="(file, index) in attachedFiles" :key="index">
              <div class="file-icon">
                <v-icon :name="getFileIcon(file)" scale="0.85" />
              </div>
              <div class="file-info">
                <span class="file-name">{{ file.name }}</span>
                <span class="file-size">{{ formatFileSize(file.size) }}</span>
              </div>
              <button class="remove-file-btn" @click="removeFile(index)">
                <v-icon name="hi-x" scale="0.7" />
              </button>
            </div>
          </div>

          <p class="notes-hint">Visible only to you and your doctor.</p>
        </section>

        <!-- Cancellation Policy -->
        <div class="policy-reminder">
          <v-icon name="hi-information-circle" scale="0.9" class="policy-icon" />
          <div class="policy-text">
            <strong>Cancellation Policy:</strong> Free cancellation up to 24 hours before the appointment. Late cancellations may incur a 50% fee.
          </div>
        </div>
      </div>

      <!-- Right Column: Payment -->
      <div class="payment-column">
        <div class="payment-card">
          <div class="payment-header">
            <h2 class="payment-title">Payment Details</h2>
          </div>

          <div class="payment-body">
            <div v-if="isLoadingPayment" class="loading-payment">
              <loader :useOverlay="false" style="position: relative" />
            </div>

            <div v-else>
              <!-- Cost Breakdown -->
              <div class="cost-breakdown">
                <div class="cost-row">
                  <span>Consultation Fee</span>
                  <span class="cost-value">{{ formatCurrency(consultationFee) }}</span>
                </div>
                <div class="cost-row">
                  <span>Platform Service Fee</span>
                  <span class="cost-value">{{ formatCurrency(serviceFee) }}</span>
                </div>
                <div class="cost-row discount" v-if="discount > 0">
                  <span>Discount (First Booking)</span>
                  <span class="cost-value">- {{ formatCurrency(discount) }}</span>
                </div>
                <div class="cost-divider"></div>
                <div class="cost-row total">
                  <span>Total Payable</span>
                  <span class="cost-total">{{ formatCurrency(totalAmount) }}</span>
                </div>
              </div>

              <!-- Escrow Protection -->
              <div class="escrow-box">
                <v-icon name="hi-shield-check" scale="0.85" class="escrow-icon" />
                <p class="escrow-text">
                  <strong>Escrow Protection:</strong> Your funds are held securely and only released to the doctor after your consultation is successfully completed.
                </p>
              </div>

              <!-- Payment Method -->
              <div class="payment-methods">
                <label class="method-label">Select Payment Method</label>

                <!-- Paystack Option -->
                <label
                  class="payment-option paystack-option"
                  :class="{ selected: booking.payment.method === 'card' }"
                >
                  <input
                    type="radio"
                    value="card"
                    v-model="booking.payment.method"
                    class="payment-radio"
                  />
                  <div class="option-main">
                    <div class="option-info">
                      <span class="option-title">Pay with Paystack</span>
                      <div class="card-icons">
                        <v-icon name="bi-credit-card-2-back" scale="1.1" />
                      </div>
                    </div>
                    <p class="option-desc">Secure checkout using Card, Bank Transfer, or USSD.</p>
                  </div>
                  <div class="secure-badge" v-if="booking.payment.method === 'card'">SECURE</div>
                </label>

                <!-- Wallet Option -->
                <label
                  class="payment-option wallet-option"
                  :class="{
                    selected: booking.payment.method === 'wallet',
                    insufficient: walletBalance < totalAmount
                  }"
                >
                  <input
                    type="radio"
                    value="wallet"
                    v-model="booking.payment.method"
                    class="payment-radio"
                  />
                  <div class="option-main">
                    <div class="option-info">
                      <span class="option-title">Rapid Wallet</span>
                      <v-icon name="bi-wallet2" scale="1" class="wallet-icon" />
                    </div>
                    <p class="option-desc" :class="{ 'insufficient-text': walletBalance < totalAmount }">
                      Balance: {{ formatCurrency(walletBalance) }}
                      <span v-if="walletBalance < totalAmount">(Insufficient)</span>
                    </p>
                  </div>
                </label>
              </div>

              <!-- Security Badges -->
              <div class="security-badges">
                <div class="badge-item">
                  <v-icon name="hi-lock-closed" scale="0.7" />
                  <span>SSL Secure</span>
                </div>
                <div class="badge-divider"></div>
                <div class="badge-item">
                  <v-icon name="hi-shield-check" scale="0.7" />
                  <span>Verified</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Terms Checkbox -->
        <div class="terms-section">
          <label class="terms-checkbox">
            <input type="checkbox" v-model="booking.payment.termsAccepted" />
            <span class="checkbox-custom">
              <v-icon v-if="booking.payment.termsAccepted" name="hi-check" scale="0.7" />
            </span>
            <span class="terms-text">
              I agree to the
              <a href="/terms-of-service" target="_blank">Terms of Service</a>
              and
              <a href="/privacy-policy" target="_blank">Privacy Policy</a>
            </span>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted, isRef, defineEmits } from 'vue';
import { format } from 'date-fns';
import Loader from '@/components/Loader/main-loader.vue';

const emit = defineEmits(['edit']);
const $http = inject('$_HTTP');
const booking = inject('bookingStateV2');

// Handle edit button click
const handleEdit = () => {
  emit('edit');
};

const walletBalance = ref(0);
const isLoadingPayment = ref(false);
const fileInput = ref(null);

// Local state for notes and attachments (synced with booking state)
const localNotes = ref('');
const localAttachments = ref([]);

// Initialize notes and attachments from booking state
const initNotesAndAttachments = () => {
  if (isRef(booking.patientNotes)) {
    localNotes.value = booking.patientNotes.value || '';
  } else {
    localNotes.value = booking.patientNotes || '';
  }

  if (isRef(booking.attachments)) {
    localAttachments.value = [...(booking.attachments.value || [])];
  } else {
    localAttachments.value = [...(booking.attachments || [])];
  }
};
initNotesAndAttachments();

// Computed for v-model that syncs with booking state
const patientNotes = computed({
  get: () => localNotes.value,
  set: (val) => {
    localNotes.value = val;
    // Sync back to booking state
    if (isRef(booking.patientNotes)) {
      booking.patientNotes.value = val;
    }
  }
});

const attachedFiles = computed(() => localAttachments.value);

// File handling
const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileSelect = (event) => {
  const files = Array.from(event.target.files || []);
  const maxSize = 10 * 1024 * 1024; // 10MB limit

  files.forEach(file => {
    if (file.size > maxSize) {
      alert(`File "${file.name}" exceeds 10MB limit`);
      return;
    }
    if (localAttachments.value.length >= 5) {
      alert('Maximum 5 files allowed');
      return;
    }
    localAttachments.value.push(file);
  });

  // Sync to booking state
  if (isRef(booking.attachments)) {
    booking.attachments.value = [...localAttachments.value];
  }

  // Reset input
  event.target.value = '';
};

const removeFile = (index) => {
  localAttachments.value.splice(index, 1);
  // Sync to booking state
  if (isRef(booking.attachments)) {
    booking.attachments.value = [...localAttachments.value];
  }
};

const getFileIcon = (file) => {
  if (file.type.startsWith('image/')) return 'hi-photograph';
  if (file.type.includes('pdf')) return 'hi-document';
  return 'hi-document-text';
};

const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

// Fee calculations
const consultationFee = computed(() => booking.specialist.price || booking.estimatedCost || 10000);
const serviceFee = computed(() => 500);
const discount = computed(() => 0); // Can be set based on user's first booking status
const totalAmount = computed(() => consultationFee.value + serviceFee.value - discount.value);

// Method icon and label
const methodIcon = computed(() => {
  switch (booking.serviceType.method) {
    case 'video': return 'hi-video-camera';
    case 'audio': return 'hi-phone';
    case 'chat': return 'hi-chat';
    default: return 'hi-video-camera';
  }
});

const methodLabel = computed(() => {
  switch (booking.serviceType.method) {
    case 'video': return 'Video Consultation';
    case 'audio': return 'Audio Call';
    case 'chat': return 'Chat';
    default: return 'Video Consultation';
  }
});

// Date formatting
const formattedDate = computed(() => {
  if (!booking.schedule.date) return 'Date TBD';
  try {
    const date = typeof booking.schedule.date === 'string'
      ? new Date(booking.schedule.date)
      : booking.schedule.date;
    return format(date, 'MMM d, yyyy');
  } catch {
    return booking.schedule.date;
  }
});

const formattedTime = computed(() => {
  const time = booking.schedule.time;
  if (!time) return 'Time TBD';
  if (time.includes('AM') || time.includes('PM')) return time;
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
});

const timezoneShort = computed(() => {
  const tz = booking.schedule.timezone || 'Africa/Lagos';
  // Return a short version
  if (tz.includes('Lagos') || tz.includes('Africa')) return 'WAT';
  if (tz.includes('London') || tz.includes('Europe')) return 'GMT';
  return tz.split('/').pop()?.substring(0, 3) || 'WAT';
});

const getInitials = (specialist) => {
  if (!specialist?.profile) return 'DR';
  const first = specialist.profile.first_name?.charAt(0) || '';
  const last = specialist.profile.last_name?.charAt(0) || '';
  return (first + last).toUpperCase() || 'DR';
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
  }).format(amount || 0);
};

onMounted(() => {
  fetchPaymentData();
});

const fetchPaymentData = async () => {
  isLoadingPayment.value = true;

  try {
    const walletRes = await $http.$_getWalletBalance();
    const walletData = walletRes?.data?.result || walletRes?.data?.data || walletRes?.data || {};
    walletBalance.value = walletData.currentBalance || walletData.balance || 0;
    booking.payment.walletBalance = walletBalance.value;
  } catch (error) {
    console.error('Error fetching payment data:', error);
  } finally {
    isLoadingPayment.value = false;
  }
};
</script>

<style scoped lang="scss">
$v2-sky: #4FC3F7;
$v2-sky-light: #E1F5FE;
$v2-sky-dark: #0288D1;
$v2-orange: #FF9800;
$v2-orange-light: #FFF3E0;
$v2-success: #4CAF50;
$v2-success-light: #E8F5E9;
$v2-navy: #1A365D;
$v2-error: #EF4444;

.confirm-step {
  padding: 20px 24px 40px;

  @media (max-width: 768px) {
    padding: 16px 16px 32px;
  }
}

.confirm-grid {
  display: grid;
  grid-template-columns: 7fr 5fr;
  gap: 24px;
  max-width: 1100px;
  margin: 0 auto;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
}

// Left Column
.review-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

// Summary Card
.summary-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.04);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: #f9fafb;
  border-bottom: 1px solid #f3f4f6;
}

.card-title {
  font-size: 13px;
  font-weight: 700;
  color: $v2-navy;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0;
}

.edit-btn {
  font-size: 12px;
  font-weight: 600;
  color: $v2-sky-dark;
  background: none;
  border: none;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
}

.card-body {
  padding: 20px;
}

.doctor-info {
  display: flex;
  gap: 16px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f3f4f6;
  margin-bottom: 20px;
}

.doctor-avatar-wrapper {
  flex-shrink: 0;
}

.doctor-avatar {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  object-fit: cover;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.doctor-avatar-placeholder {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  background: $v2-sky-light;
  color: $v2-sky-dark;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
}

.doctor-details {
  flex: 1;
}

.doctor-name {
  font-size: 18px;
  font-weight: 700;
  color: $v2-navy;
  margin: 0 0 4px;
}

.doctor-specialty {
  font-size: 13px;
  color: #6b7280;
  margin: 0 0 10px;
}

.doctor-badges {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 50px;
  font-size: 10px;
  font-weight: 700;

  &.badge-sky {
    background: $v2-sky-light;
    color: $v2-sky-dark;
  }

  &.badge-gray {
    background: #f3f4f6;
    color: #6b7280;
  }

  &.badge-urgent {
    background: #FEE2E2;
    color: #DC2626;
  }

  &.badge-routine {
    background: #E0F2FE;
    color: #0284C7;
  }
}

// Date Time Grid
.datetime-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 20px;
}

.datetime-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: #f9fafb;
  border: 1px solid #f3f4f6;
  border-radius: 12px;
}

.datetime-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);

  &.sky { color: $v2-sky-dark; }
  &.orange { color: $v2-orange; }
}

.datetime-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.datetime-label {
  font-size: 10px;
  font-weight: 700;
  color: #9ca3af;
  text-transform: uppercase;
}

.datetime-value {
  font-size: 14px;
  font-weight: 700;
  color: $v2-navy;
}

// Consent Status
.consent-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #6b7280;

  .consent-icon {
    color: $v2-success;
  }
}

// Notes Section
.notes-section {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 700;
  color: $v2-navy;
  margin: 0 0 14px;

  svg {
    color: $v2-sky-dark;
  }
}

.notes-input-wrapper {
  position: relative;
}

.notes-textarea {
  width: 100%;
  min-height: 120px;
  padding: 14px;
  padding-right: 50px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  font-size: 14px;
  color: #374151;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: $v2-sky;
    box-shadow: 0 0 0 3px rgba($v2-sky, 0.1);
  }

  &::placeholder {
    color: #9ca3af;
  }
}

.notes-actions {
  position: absolute;
  bottom: 12px;
  right: 12px;
}

.attach-btn {
  padding: 6px 10px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  color: #6b7280;
  cursor: pointer;

  &:hover {
    background: #f3f4f6;
    color: $v2-sky-dark;
  }
}

.notes-hint {
  font-size: 10px;
  color: #9ca3af;
  text-align: right;
  margin: 8px 0 0;
}

.hidden-file-input {
  display: none;
}

// Attached Files
.attached-files {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f3f4f6;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.file-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 6px;
  color: $v2-sky-dark;
  flex-shrink: 0;
}

.file-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.file-name {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-size {
  font-size: 11px;
  color: #9ca3af;
}

.remove-file-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 50%;
  color: #9ca3af;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s;

  &:hover {
    background: #fee2e2;
    border-color: #fecaca;
    color: $v2-error;
  }
}

// Policy Reminder
.policy-reminder {
  display: flex;
  gap: 12px;
  padding: 14px 16px;
  background: rgba($v2-sky-light, 0.5);
  border: 1px solid rgba($v2-sky, 0.2);
  border-radius: 12px;

  .policy-icon {
    color: $v2-sky-dark;
    flex-shrink: 0;
    margin-top: 1px;
  }

  .policy-text {
    font-size: 12px;
    color: #4b5563;
    line-height: 1.5;

    strong {
      color: $v2-navy;
    }
  }
}

// Right Column - Payment
.payment-column {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.payment-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.04);
  position: sticky;
  top: 20px;
}

.payment-header {
  padding: 16px 20px;
  background: #f9fafb;
  border-bottom: 1px solid #f3f4f6;
}

.payment-title {
  font-size: 18px;
  font-weight: 700;
  color: $v2-navy;
  margin: 0;
}

.payment-body {
  padding: 20px;
}

.loading-payment {
  display: flex;
  justify-content: center;
  padding: 30px 0;
}

// Cost Breakdown
.cost-breakdown {
  margin-bottom: 20px;
}

.cost-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 10px;

  &.discount {
    color: $v2-success;
  }

  &.total {
    margin-bottom: 0;

    span:first-child {
      font-weight: 700;
      color: $v2-navy;
    }
  }
}

.cost-value {
  font-weight: 500;
}

.cost-total {
  font-size: 24px;
  font-weight: 700;
  color: $v2-navy;
}

.cost-divider {
  height: 1px;
  background: #f3f4f6;
  margin: 14px 0;
}

// Escrow Box
.escrow-box {
  display: flex;
  gap: 10px;
  padding: 12px 14px;
  background: rgba($v2-sky-light, 0.3);
  border: 1px solid rgba($v2-sky, 0.1);
  border-radius: 10px;
  margin-bottom: 20px;

  .escrow-icon {
    color: $v2-sky-dark;
    flex-shrink: 0;
    margin-top: 1px;
  }

  .escrow-text {
    font-size: 10px;
    color: #6b7280;
    line-height: 1.5;
    margin: 0;

    strong {
      color: $v2-navy;
    }
  }
}

// Payment Methods
.payment-methods {
  margin-bottom: 20px;
}

.method-label {
  display: block;
  font-size: 11px;
  font-weight: 700;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
}

.payment-option {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 12px;
  position: relative;

  &:hover {
    border-color: $v2-sky;
  }

  &.selected {
    border-color: $v2-sky;
    background: rgba($v2-sky-light, 0.1);
  }

  &.insufficient {
    opacity: 0.7;
  }
}

.payment-radio {
  margin-top: 4px;
  accent-color: $v2-sky-dark;
}

.option-main {
  flex: 1;
}

.option-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.option-title {
  font-size: 14px;
  font-weight: 700;
  color: $v2-navy;
}

.card-icons {
  display: flex;
  gap: 4px;
  color: #6b7280;
}

.wallet-icon {
  color: #9ca3af;
}

.option-desc {
  font-size: 10px;
  color: #6b7280;
  margin: 0;

  &.insufficient-text {
    color: $v2-error;
  }
}

.secure-badge {
  position: absolute;
  top: 0;
  right: 0;
  padding: 3px 8px;
  background: $v2-sky;
  color: white;
  font-size: 9px;
  font-weight: 700;
  border-radius: 0 10px 0 8px;
}

// Security Badges
.security-badges {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding-top: 8px;
  opacity: 0.5;
}

.badge-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  font-weight: 700;
  color: #6b7280;
}

.badge-divider {
  width: 1px;
  height: 12px;
  background: #d1d5db;
}

// Terms Section
.terms-section {
  margin-top: 4px;
}

.terms-checkbox {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  cursor: pointer;

  input[type="checkbox"] {
    display: none;
  }

  .checkbox-custom {
    width: 20px;
    height: 20px;
    border: 2px solid #d1d5db;
    border-radius: 5px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all 0.2s;
    margin-top: 1px;
  }

  input:checked + .checkbox-custom {
    background: $v2-sky;
    border-color: $v2-sky;
    color: white;
  }
}

.terms-text {
  font-size: 13px;
  color: #6b7280;
  line-height: 1.5;

  a {
    color: $v2-sky-dark;
    text-decoration: none;
    font-weight: 500;

    &:hover {
      text-decoration: underline;
    }
  }
}

// Mobile Responsive
@media (max-width: 1024px) {
  .confirm-step {
    padding: 16px 16px 120px; // Extra padding for mobile nav
  }

  .confirm-grid {
    gap: 16px;
  }
}

@media (max-width: 600px) {
  .confirm-step {
    padding: 12px 12px 140px;
  }

  .datetime-grid {
    grid-template-columns: 1fr;
  }

  .doctor-info {
    flex-direction: column;
    text-align: center;

    .doctor-badges {
      justify-content: center;
    }
  }

  .doctor-avatar-wrapper {
    margin: 0 auto;
  }

  .card-header {
    flex-direction: column;
    gap: 8px;
    text-align: center;
    padding: 14px 16px;
  }

  .card-title {
    font-size: 12px;
  }

  .edit-btn {
    align-self: center;
    padding: 8px 16px;
    background: rgba($v2-sky, 0.1);
    border-radius: 8px;
  }

  .card-body {
    padding: 16px;
  }

  .notes-section {
    padding: 16px;
  }

  .section-title {
    font-size: 13px;
  }

  .notes-textarea {
    min-height: 100px;
    font-size: 14px;
  }

  .policy-reminder {
    padding: 12px 14px;
    flex-direction: column;
    gap: 8px;
    text-align: center;

    .policy-icon {
      margin: 0 auto;
    }

    .policy-text {
      font-size: 11px;
    }
  }

  // Payment column mobile
  .payment-card {
    position: static; // Remove sticky on mobile
  }

  .payment-header {
    padding: 14px 16px;
  }

  .payment-title {
    font-size: 16px;
  }

  .payment-body {
    padding: 16px;
  }

  .cost-total {
    font-size: 20px;
  }

  .escrow-box {
    flex-direction: column;
    text-align: center;
    gap: 8px;

    .escrow-icon {
      margin: 0 auto;
    }

    .escrow-text {
      font-size: 11px;
    }
  }

  .payment-option {
    padding: 14px;
  }

  .option-title {
    font-size: 13px;
  }

  .option-desc {
    font-size: 11px;
  }

  // Terms section mobile - critical fix
  .terms-section {
    margin-top: 12px;
    padding: 16px;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
  }

  .terms-checkbox {
    gap: 12px;
    min-height: 48px; // Ensure tap target

    .checkbox-custom {
      width: 24px;
      height: 24px;
      min-width: 24px;
      min-height: 24px;
      border-radius: 6px;
    }
  }

  .terms-text {
    font-size: 12px;
    line-height: 1.6;

    a {
      display: inline;
    }
  }
}
</style>
