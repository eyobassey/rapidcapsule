<template>
  <div class="rates-page">
    <!-- Loading State -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner">
        <v-icon name="hi-refresh" scale="2" class="spin" />
        <span>Loading your rates...</span>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else class="page-scroll">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-left">
          <h1 class="page-title">Service Pricing Configuration</h1>
          <p class="page-subtitle">Set your consultation fees. Our AI recommends rates based on your specialization and region.</p>
        </div>
        <div class="header-actions">
          <!-- Currency Toggle -->
          <div class="currency-toggle">
            <button
              :class="{ active: currency === 'NGN' }"
              @click="currency = 'NGN'"
            >
              NGN (₦)
            </button>
            <button
              :class="{ active: currency === 'USD' }"
              @click="currency = 'USD'"
            >
              USD ($)
            </button>
          </div>
          <button class="bulk-edit-btn" @click="showBulkEditModal = true">
            <v-icon name="hi-adjustments" scale="0.9" />
            Bulk Edit
          </button>
        </div>
      </div>

      <!-- Content Area -->
      <div class="content-area">
        <!-- Left Column: Dynamic Rate Cards -->
        <div class="rates-column">
          <!-- Dynamic Service Cards -->
          <div
            v-for="service in consultationServices"
            :key="service._id"
            class="rate-card"
            :class="{
              inactive: !getServiceRate(service.slug).enabled,
              incomplete: !service.is_default && !getServiceRate(service.slug).enabled
            }"
          >
            <!-- Setup Ribbon for non-default inactive services -->
            <div v-if="!service.is_default && !getServiceRate(service.slug).enabled" class="setup-ribbon">
              <span>SETUP</span>
            </div>

            <div class="card-header">
              <div class="card-info">
                <div class="card-icon" :style="getIconStyle(service)">
                  <v-icon :name="service.icon || 'hi-medical-bag'" scale="1.2" />
                </div>
                <div class="card-text">
                  <div class="card-title-row">
                    <h3>{{ service.name }}</h3>
                    <span class="status-badge" :class="getServiceRate(service.slug).enabled ? 'active' : ''">
                      {{ getServiceRate(service.slug).enabled ? 'Active' : 'Inactive' }}
                    </span>
                  </div>
                  <p>{{ service.description }}</p>
                </div>
              </div>
              <label class="toggle-switch">
                <input
                  type="checkbox"
                  :checked="getServiceRate(service.slug).enabled"
                  @change="toggleService(service.slug, $event.target.checked)"
                />
                <span class="toggle-slider"></span>
              </label>
            </div>

            <div class="card-body" v-if="getServiceRate(service.slug).enabled">
              <!-- Routine + Urgent pricing -->
              <div v-if="service.pricing_type === 'routine_urgent'" class="rate-inputs-grid">
                <div class="rate-input-group">
                  <label class="input-label">
                    Routine Rate
                    <span class="min-hint">Min: {{ currencySymbol }}{{ service.min_rate?.toLocaleString() }}</span>
                  </label>
                  <div class="rate-input-wrapper">
                    <span class="currency-prefix">{{ currencySymbol }}</span>
                    <input
                      :value="getServiceRate(service.slug).routine_rate"
                      @input="updateServiceRate(service.slug, 'routine_rate', $event.target.value)"
                      type="number"
                      :placeholder="(service.min_rate * 2)?.toString()"
                    />
                    <v-icon
                      v-if="getServiceRate(service.slug).routine_rate >= service.min_rate"
                      name="hi-check-circle"
                      class="check-icon"
                    />
                  </div>
                  <p class="earning-hint">
                    You earn: <strong>{{ currencySymbol }}{{ formatEarning(getServiceRate(service.slug).routine_rate) }}</strong>
                    (after {{ platformFeePercent }}% platform fee)
                  </p>
                </div>

                <div class="rate-input-group urgent-group">
                  <label class="input-label urgent">
                    <span>Urgent Rate <v-icon name="hi-lightning-bolt" scale="0.6" /></span>
                    <span v-if="service.show_ai_badge" class="ai-badge">AI Triage</span>
                  </label>
                  <div class="rate-input-wrapper urgent">
                    <span class="currency-prefix">{{ currencySymbol }}</span>
                    <input
                      :value="getServiceRate(service.slug).urgent_rate"
                      @input="updateServiceRate(service.slug, 'urgent_rate', $event.target.value)"
                      type="number"
                      :placeholder="(service.min_rate * 3)?.toString()"
                    />
                  </div>
                  <p class="earning-hint urgent">Premium for priority slots</p>
                </div>
              </div>

              <!-- Flat rate pricing -->
              <div v-else class="rate-inputs-grid half">
                <div class="rate-input-group">
                  <label class="input-label">
                    Flat Rate
                    <span class="min-hint">Min: {{ currencySymbol }}{{ service.min_rate?.toLocaleString() }}</span>
                  </label>
                  <div class="rate-input-wrapper">
                    <span class="currency-prefix">{{ currencySymbol }}</span>
                    <input
                      :value="getServiceRate(service.slug).flat_rate"
                      @input="updateServiceRate(service.slug, 'flat_rate', $event.target.value)"
                      type="number"
                      :placeholder="(service.min_rate * 2)?.toString()"
                    />
                  </div>
                </div>
                <div v-if="service.info_text" class="info-box">
                  <v-icon name="hi-information-circle" scale="0.9" />
                  <span>{{ service.info_text }}</span>
                </div>
              </div>
            </div>

            <!-- Inactive Overlay for non-default services -->
            <div v-if="!service.is_default && !getServiceRate(service.slug).enabled" class="inactive-overlay">
              <button class="configure-btn" @click="toggleService(service.slug, true)">
                <v-icon name="hi-plus" scale="0.8" />
                Configure Pricing
              </button>
            </div>
          </div>

          <!-- Empty State -->
          <div v-if="consultationServices.length === 0" class="empty-state">
            <v-icon name="hi-exclamation-circle" scale="2" />
            <p>No consultation services available. Please contact admin.</p>
          </div>
        </div>

        <!-- Right Column: Summary Sidebar -->
        <aside class="summary-sidebar">
          <!-- Projected Earnings Card -->
          <div class="earnings-card">
            <div class="earnings-bg-icon">
              <v-icon name="hi-credit-card" scale="4" />
            </div>
            <h3 class="earnings-label">Projected Monthly Earnings</h3>
            <div class="earnings-value">{{ currencySymbol }} {{ formattedEarnings }}</div>

            <div class="earnings-details">
              <div class="detail-row">
                <span>Based on availability:</span>
                <span class="detail-value">{{ availabilityHours }} hrs/week</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: earningsProgress + '%' }"></div>
              </div>
              <p class="earnings-note">
                Top specialists in <strong>{{ specialty }}</strong> earn up to {{ currencySymbol }}650,000/mo on Rapid Capsule.
              </p>
            </div>
          </div>

          <!-- Fee Breakdown Card -->
          <div class="fee-card">
            <h3 class="fee-title">
              <v-icon name="hi-scale" scale="0.9" />
              Fee Breakdown
            </h3>
            <div class="fee-list">
              <div class="fee-item">
                <div class="fee-info">
                  <span class="fee-name">Platform Fee</span>
                  <span class="fee-desc">Tech, Marketing & Support</span>
                </div>
                <span class="fee-value">{{ platformFeePercent }}%</span>
              </div>
              <div class="fee-item">
                <div class="fee-info">
                  <span class="fee-name">Payment Processing</span>
                  <span class="fee-desc">Paystack / Stripe secure</span>
                </div>
                <span class="fee-value">{{ paymentProcessingPercent }}% + {{ currencySymbol }}{{ paymentProcessingFixed }}</span>
              </div>
            </div>
            <div class="fee-divider"></div>
            <div class="net-earning-box">
              <div class="net-label">{{ primaryServiceName }} ({{ currencySymbol }}{{ primaryServiceRate.toLocaleString() }})</div>
              <div class="net-row">
                <span>Net Earning</span>
                <span class="net-value">{{ currencySymbol }}{{ formatNetEarning(primaryServiceRate) }}</span>
              </div>
            </div>
          </div>

          <!-- Pricing Tip Card -->
          <div class="tip-card">
            <div class="tip-icon">
              <v-icon name="hi-light-bulb" scale="0.9" />
            </div>
            <div class="tip-content">
              <h4>Pricing Tip</h4>
              <p>Specialists with <strong>Urgent Rates</strong> below {{ currencySymbol }}30,000 get 40% more triage matches in your region.</p>
            </div>
          </div>
        </aside>
      </div>
    </div>

    <!-- Sticky Footer -->
    <div class="sticky-footer">
      <div class="sticky-footer-inner">
        <button class="draft-btn" @click="saveDraft" :disabled="isSaving">
          {{ isSaving ? 'Saving...' : 'Save as Draft' }}
        </button>
        <div class="footer-right">
          <span v-if="!isOnboardingComplete" class="next-hint">Next: Identity Verification</span>
          <button class="continue-btn" @click="saveAndContinue" :disabled="isSaving">
            <v-icon v-if="isSaving" name="hi-refresh" scale="0.8" class="spin" />
            {{ isSaving ? 'Saving...' : (isOnboardingComplete ? 'Save Changes' : 'Save Rates & Continue') }}
            <v-icon v-if="!isSaving && !isOnboardingComplete" name="hi-arrow-right" scale="0.8" />
          </button>
        </div>
      </div>
    </div>

    <!-- Bulk Edit Modal -->
    <div v-if="showBulkEditModal" class="modal-overlay" @click.self="showBulkEditModal = false">
      <div class="bulk-edit-modal">
        <div class="modal-header">
          <h2>Bulk Edit Rates</h2>
          <button class="modal-close" @click="showBulkEditModal = false">
            <v-icon name="hi-x" scale="1" />
          </button>
        </div>

        <div class="modal-body">
          <p class="modal-desc">Quickly adjust all rates by a percentage or fixed amount.</p>

          <div class="bulk-edit-options">
            <div class="edit-option">
              <label>Adjustment Type</label>
              <div class="radio-group">
                <label class="radio-label">
                  <input type="radio" v-model="bulkEdit.type" value="percentage" />
                  <span>Percentage (%)</span>
                </label>
                <label class="radio-label">
                  <input type="radio" v-model="bulkEdit.type" value="fixed" />
                  <span>Fixed Amount ({{ currencySymbol }})</span>
                </label>
              </div>
            </div>

            <div class="edit-option">
              <label>Direction</label>
              <div class="radio-group">
                <label class="radio-label">
                  <input type="radio" v-model="bulkEdit.direction" value="increase" />
                  <span>Increase</span>
                </label>
                <label class="radio-label">
                  <input type="radio" v-model="bulkEdit.direction" value="decrease" />
                  <span>Decrease</span>
                </label>
              </div>
            </div>

            <div class="edit-option">
              <label>Value</label>
              <div class="bulk-input-wrapper">
                <span v-if="bulkEdit.type === 'fixed'" class="currency-prefix">{{ currencySymbol }}</span>
                <input
                  v-model.number="bulkEdit.value"
                  type="number"
                  :placeholder="bulkEdit.type === 'percentage' ? '10' : '1000'"
                />
                <span v-if="bulkEdit.type === 'percentage'" class="suffix">%</span>
              </div>
            </div>

            <div class="edit-option">
              <label>Apply To</label>
              <div class="checkbox-group">
                <label v-for="service in consultationServices" :key="service._id" class="checkbox-label">
                  <input type="checkbox" v-model="bulkEdit.applyTo[service.slug]" />
                  <span>{{ service.name }}</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="modal-cancel" @click="showBulkEditModal = false">Cancel</button>
          <button class="modal-apply" @click="applyBulkEdit" :disabled="!bulkEdit.value">
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toast-notification';
import apiFactory from '@/services/apiFactory';
import { useOnboardingState } from './composables/useOnboardingState';

const store = useStore();
const router = useRouter();
const toast = useToast();
const { completeStep, goToStep, progressPercent, stepCompletion } = useOnboardingState();

// Check if onboarding is complete (editing mode)
const isOnboardingComplete = computed(() => {
  return progressPercent.value >= 100 || stepCompletion.review;
});

const isLoading = ref(true);
const isSaving = ref(false);
const showBulkEditModal = ref(false);

// Currency
const currency = ref('NGN');

// Consultation services from API
const consultationServices = ref([]);

// Service rates - keyed by slug
// Structure: { [slug]: { enabled, routine_rate, urgent_rate, flat_rate } }
const serviceRates = reactive({});

// Fee configuration
const platformFeePercent = ref(10);
const paymentProcessingPercent = ref(1.5);
const paymentProcessingFixed = ref(100);

// Availability data from DB
const availabilityData = ref(null);

// Bulk edit state
const bulkEdit = reactive({
  type: 'percentage',
  direction: 'increase',
  value: null,
  applyTo: {},
});

// Computed values
const currencySymbol = computed(() => currency.value === 'NGN' ? '₦' : '$');

const availabilityHours = computed(() => {
  if (!availabilityData.value?.time_availability) return 0;

  const slots = availabilityData.value.time_availability;
  let totalMinutes = 0;

  function parseTimeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const isPM = timeStr.toLowerCase().includes('pm');
    const isAM = timeStr.toLowerCase().includes('am');
    const cleanTime = timeStr.replace(/[ap]m/gi, '').trim();
    const parts = cleanTime.split(':');
    let hours = parseInt(parts[0]) || 0;
    const minutes = parseInt(parts[1]) || 0;
    if (isPM && hours < 12) hours += 12;
    if (isAM && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }

  slots.forEach(slot => {
    if (slot.slot_type === 'break') return;
    const startMinutes = parseTimeToMinutes(slot.start_time);
    const endMinutes = parseTimeToMinutes(slot.end_time);
    if (endMinutes > startMinutes) {
      totalMinutes += (endMinutes - startMinutes);
    }
  });

  return Math.round(totalMinutes / 60);
});

const specialty = computed(() => {
  const profile = store.getters.getUserProfile;
  return profile?.professional_practice?.area_of_specialty || 'your specialty';
});

// Get primary service for fee breakdown display
const primaryServiceName = computed(() => {
  const videoService = consultationServices.value.find(s => s.slug === 'video_consultation');
  return videoService?.name || 'Video Consultation';
});

const primaryServiceRate = computed(() => {
  const videoRate = serviceRates['video_consultation']?.routine_rate;
  if (videoRate) return videoRate;

  // Fall back to first enabled service
  for (const service of consultationServices.value) {
    const rate = serviceRates[service.slug];
    if (rate?.enabled) {
      return rate.routine_rate || rate.flat_rate || 15000;
    }
  }
  return 15000;
});

// Calculate projected monthly earnings
const projectedEarnings = computed(() => {
  const hours = availabilityHours.value || 32;
  const utilizationRate = 0.6;
  const weeksPerMonth = 4;
  const slotsPerHour = 2;

  let avgRate = primaryServiceRate.value;
  const earnings = hours * weeksPerMonth * slotsPerHour * avgRate * utilizationRate;
  const netEarnings = earnings * (1 - platformFeePercent.value / 100);

  return Math.round(netEarnings);
});

const formattedEarnings = computed(() => projectedEarnings.value.toLocaleString());

const earningsProgress = computed(() => {
  const topEarnerBenchmark = 650000;
  const progress = (projectedEarnings.value / topEarnerBenchmark) * 100;
  return Math.min(progress, 100);
});

// Helper functions
function getServiceRate(slug) {
  return serviceRates[slug] || { enabled: false, routine_rate: null, urgent_rate: null, flat_rate: null };
}

function toggleService(slug, enabled) {
  if (!serviceRates[slug]) {
    serviceRates[slug] = { enabled: false, routine_rate: null, urgent_rate: null, flat_rate: null };
  }
  serviceRates[slug].enabled = enabled;
}

function updateServiceRate(slug, field, value) {
  if (!serviceRates[slug]) {
    serviceRates[slug] = { enabled: true, routine_rate: null, urgent_rate: null, flat_rate: null };
  }
  serviceRates[slug][field] = value ? Number(value) : null;
}

function getIconStyle(service) {
  return {
    background: service.icon_bg_color || '#E3F2FD',
    color: service.icon_color || '#1976D2',
  };
}

function formatEarning(amount) {
  if (!amount) return '0';
  const net = Math.round(amount * (1 - platformFeePercent.value / 100));
  return net.toLocaleString();
}

function formatNetEarning(amount) {
  if (!amount) return '0';
  const platformFee = amount * (platformFeePercent.value / 100);
  const processingFee = (amount * (paymentProcessingPercent.value / 100)) + paymentProcessingFixed.value;
  const net = amount - platformFee - processingFee;
  return Math.round(net).toLocaleString();
}

function calculateBulkValue(currentValue) {
  if (!currentValue || !bulkEdit.value) return currentValue;

  let newValue;
  if (bulkEdit.type === 'percentage') {
    const multiplier = bulkEdit.direction === 'increase'
      ? 1 + (bulkEdit.value / 100)
      : 1 - (bulkEdit.value / 100);
    newValue = Math.round(currentValue * multiplier);
  } else {
    newValue = bulkEdit.direction === 'increase'
      ? currentValue + bulkEdit.value
      : currentValue - bulkEdit.value;
  }

  return Math.max(0, newValue);
}

function applyBulkEdit() {
  if (!bulkEdit.value) return;

  consultationServices.value.forEach(service => {
    if (bulkEdit.applyTo[service.slug] && serviceRates[service.slug]?.enabled) {
      const rate = serviceRates[service.slug];

      if (service.pricing_type === 'routine_urgent') {
        if (rate.routine_rate) {
          rate.routine_rate = calculateBulkValue(rate.routine_rate);
        }
        if (rate.urgent_rate) {
          rate.urgent_rate = calculateBulkValue(rate.urgent_rate);
        }
      } else {
        if (rate.flat_rate) {
          rate.flat_rate = calculateBulkValue(rate.flat_rate);
        }
      }
    }
  });

  toast.success('Rates updated successfully');
  showBulkEditModal.value = false;
  bulkEdit.value = null;
}

// API Functions
async function loadData() {
  isLoading.value = true;
  try {
    // Load consultation services from API
    const servicesResponse = await apiFactory.$_getConsultationServices();
    consultationServices.value = servicesResponse.data?.data || [];

    // Initialize bulk edit apply checkboxes
    consultationServices.value.forEach(service => {
      bulkEdit.applyTo[service.slug] = true;
    });

    // Load specialist preferences (availability + rates)
    const prefsResponse = await apiFactory.$_getSpecialistAvailability();
    const prefsData = prefsResponse.data?.data;

    if (prefsData) {
      availabilityData.value = prefsData;

      // Load saved service rates if exists
      if (prefsData.service_rates) {
        Object.keys(prefsData.service_rates).forEach(slug => {
          serviceRates[slug] = { ...prefsData.service_rates[slug] };
        });
      }

      // Also check for legacy rate_cards format and migrate
      if (prefsData.rate_cards && !prefsData.service_rates) {
        migrateLegacyRateCards(prefsData.rate_cards);
      }

      // Load fee configuration
      if (prefsData.rate_cards?.platform_fee_percent) {
        platformFeePercent.value = prefsData.rate_cards.platform_fee_percent;
      }
      if (prefsData.rate_cards?.payment_processing_percent) {
        paymentProcessingPercent.value = prefsData.rate_cards.payment_processing_percent;
      }
      if (prefsData.rate_cards?.payment_processing_fixed) {
        paymentProcessingFixed.value = prefsData.rate_cards.payment_processing_fixed;
      }
    }

    // Initialize default services with enabled state
    consultationServices.value.forEach(service => {
      if (!serviceRates[service.slug]) {
        serviceRates[service.slug] = {
          enabled: service.is_default,
          routine_rate: null,
          urgent_rate: null,
          flat_rate: null,
        };
      }
    });

  } catch (error) {
    console.error('Failed to load data:', error);
    toast.error('Failed to load rates. Please try again.');
  } finally {
    isLoading.value = false;
  }
}

function migrateLegacyRateCards(legacyRates) {
  // Migrate old rate_cards format to new service_rates format
  const legacyMapping = {
    video_consultation: legacyRates.video_consultation,
    audio_consultation: legacyRates.audio_consultation,
    chat_consultation: legacyRates.chat_consultation,
    prescription_review: legacyRates.prescription_review,
  };

  Object.keys(legacyMapping).forEach(slug => {
    const legacy = legacyMapping[slug];
    if (legacy) {
      serviceRates[slug] = {
        enabled: legacy.enabled !== false,
        routine_rate: legacy.routine_rate || null,
        urgent_rate: legacy.urgent_rate || null,
        flat_rate: legacy.flat_rate || legacy.review_fee || null,
      };
    }
  });
}

async function saveRates() {
  isSaving.value = true;
  try {
    // Build payload with both new and legacy formats for backward compatibility
    const payload = {
      service_rates: { ...serviceRates },
      rate_cards: {
        currency: currency.value,
        platform_fee_percent: platformFeePercent.value,
        payment_processing_percent: paymentProcessingPercent.value,
        payment_processing_fixed: paymentProcessingFixed.value,
        // Legacy format for backward compatibility
        video_consultation: serviceRates['video_consultation'] || { enabled: false },
        audio_consultation: serviceRates['audio_consultation'] || { enabled: false },
        chat_consultation: serviceRates['chat_consultation'] || { enabled: false },
        prescription_review: {
          enabled: serviceRates['prescription_review']?.enabled || false,
          review_fee: serviceRates['prescription_review']?.flat_rate || null,
        },
      },
    };

    await apiFactory.$_specialistPreference(payload);
    return true;
  } catch (error) {
    console.error('Failed to save rates:', error);
    throw error;
  } finally {
    isSaving.value = false;
  }
}

const saveDraft = async () => {
  try {
    await saveRates();
    toast.success('Draft saved successfully');
  } catch (error) {
    toast.error('Failed to save draft');
  }
};

const saveAndContinue = async () => {
  // Validate at least one service has a rate
  const hasAnyRate = consultationServices.value.some(service => {
    const rate = serviceRates[service.slug];
    if (!rate?.enabled) return false;
    if (service.pricing_type === 'routine_urgent') {
      return rate.routine_rate > 0;
    }
    return rate.flat_rate > 0;
  });

  if (!hasAnyRate) {
    toast.warning('Please set at least one consultation rate');
    return;
  }

  try {
    await saveRates();
    completeStep('rateCards');
    toast.success('Rates saved successfully');

    // If onboarding is complete, stay on page. Otherwise, continue to next step.
    if (!isOnboardingComplete.value) {
      router.push({ name: 'SpecialistVerification' });
    }
  } catch (error) {
    toast.error('Failed to save rates');
  }
};

// Load data on mount
onMounted(() => {
  loadData();
});
</script>

<style scoped lang="scss">
.rates-page {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #F8FAFC;
  width: 100%;
  align-items: center;
}

.loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(248, 250, 252, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: #64748B;
}

.page-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
  padding-bottom: 6rem;
  width: 100%;
  max-width: 1400px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
  width: 100%;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1A365D;
  margin: 0 0 0.25rem 0;
}

.page-subtitle {
  font-size: 0.875rem;
  color: #64748B;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.currency-toggle {
  display: flex;
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 0.5rem;
  padding: 0.25rem;

  button {
    padding: 0.5rem 0.75rem;
    border: none;
    background: none;
    font-size: 0.75rem;
    font-weight: 500;
    color: #64748B;
    cursor: pointer;
    border-radius: 0.375rem;
    transition: all 0.2s;

    &.active {
      background: #E1F5FE;
      color: #0288D1;
      font-weight: 700;
    }
  }
}

.bulk-edit-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #F8FAFC;
  }
}

.content-area {
  display: flex;
  gap: 1.5rem;
  width: 100%;
}

.rates-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  min-width: 0;
}

.rate-card {
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  transition: all 0.2s;
  position: relative;

  &:hover {
    border-color: rgba(79, 195, 247, 0.3);
  }

  &.inactive .card-body {
    opacity: 0.5;
    pointer-events: none;
  }

  &.incomplete:not(.inactive) {
    border-color: #FF9800;
    background: #FFFBF5;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.25rem 1.5rem;
  background: rgba(248, 250, 252, 0.5);
  border-bottom: 1px solid #F1F5F9;
}

.card-info {
  display: flex;
  gap: 1rem;
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-text {
  flex: 1;
}

.card-title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;

  h3 {
    font-size: 1rem;
    font-weight: 700;
    color: #1A365D;
    margin: 0;
  }
}

.status-badge {
  padding: 0.125rem 0.5rem;
  background: #F1F5F9;
  color: #64748B;
  font-size: 0.625rem;
  font-weight: 700;
  border-radius: 9999px;

  &.active {
    background: #DCFCE7;
    color: #16A34A;
  }
}

.card-text p {
  font-size: 0.75rem;
  color: #64748B;
  margin: 0;
}

.toggle-switch {
  position: relative;
  width: 44px;
  height: 24px;
  flex-shrink: 0;

  input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .toggle-slider {
    position: absolute;
    cursor: pointer;
    inset: 0;
    background: #CBD5E1;
    border-radius: 24px;
    transition: 0.3s;

    &::before {
      content: '';
      position: absolute;
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background: white;
      border-radius: 50%;
      transition: 0.3s;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    }
  }

  input:checked + .toggle-slider {
    background: #4FC3F7;
  }

  input:checked + .toggle-slider::before {
    transform: translateX(20px);
  }
}

.card-body {
  padding: 1.5rem;
}

.rate-inputs-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;

  &.half {
    grid-template-columns: 1fr 1fr;
  }
}

.rate-input-group {
  &.urgent-group {
    background: rgba(255, 152, 0, 0.05);
    padding: 0.75rem;
    margin: -0.75rem;
    border-radius: 0.75rem;
    border: 1px solid rgba(255, 152, 0, 0.1);
  }
}

.input-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  font-weight: 700;
  color: #475569;
  margin-bottom: 0.5rem;

  &.urgent {
    color: #C2410C;

    span:first-child {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    svg {
      color: #FF9800;
    }
  }

  .min-hint {
    font-size: 0.625rem;
    font-weight: 400;
    color: #94A3B8;
  }

  .ai-badge {
    padding: 0.125rem 0.375rem;
    background: #FFF3E0;
    color: #F57C00;
    font-size: 0.625rem;
    font-weight: 600;
    border-radius: 0.25rem;
  }
}

.rate-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 0.5rem;
  overflow: hidden;
  transition: all 0.2s;

  &:focus-within {
    border-color: #4FC3F7;
    box-shadow: 0 0 0 4px rgba(79, 195, 247, 0.1);
  }

  &.urgent {
    border-color: #FFCC80;

    &:focus-within {
      border-color: #FF9800;
      box-shadow: 0 0 0 4px rgba(255, 152, 0, 0.1);
    }

    .currency-prefix {
      color: #F57C00;
    }
  }

  .currency-prefix {
    padding: 0 0.75rem;
    font-weight: 500;
    color: #94A3B8;
  }

  input {
    flex: 1;
    padding: 0.75rem 0.75rem 0.75rem 0;
    border: none;
    background: transparent;
    font-size: 0.9375rem;
    font-weight: 700;
    color: #1A365D;

    &:focus {
      outline: none;
    }

    &::placeholder {
      color: #CBD5E1;
      font-weight: 400;
    }
  }

  .check-icon {
    position: absolute;
    right: 0.75rem;
    color: #22C55E;
  }
}

.earning-hint {
  font-size: 0.625rem;
  color: #94A3B8;
  margin: 0.375rem 0 0 0;

  strong {
    color: #475569;
  }

  &.urgent {
    color: #C2410C;
    opacity: 0.7;
  }
}

.info-box {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  color: #64748B;

  svg {
    color: #4FC3F7;
    flex-shrink: 0;
    margin-top: 0.125rem;
  }
}

.setup-ribbon {
  position: absolute;
  top: 0;
  right: 0;
  width: 64px;
  height: 64px;
  overflow: hidden;
  z-index: 10;

  span {
    display: block;
    position: absolute;
    top: 12px;
    right: -24px;
    width: 100px;
    padding: 0.25rem 0;
    background: #FF9800;
    color: white;
    font-size: 0.625rem;
    font-weight: 700;
    text-align: center;
    transform: rotate(45deg);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
}

.inactive-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(1px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
}

.configure-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.5rem;
  background: white;
  border: 2px solid #FF9800;
  border-radius: 9999px;
  color: #F57C00;
  font-size: 0.875rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(255, 152, 0, 0.2);
  transition: all 0.2s;
  animation: pulse-orange 2s infinite;

  &:hover {
    background: #FFF3E0;
  }
}

@keyframes pulse-orange {
  0% { box-shadow: 0 0 0 0 rgba(255, 152, 0, 0.4); }
  70% { box-shadow: 0 0 0 8px rgba(255, 152, 0, 0); }
  100% { box-shadow: 0 0 0 0 rgba(255, 152, 0, 0); }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  background: white;
  border-radius: 1rem;
  border: 1px solid #E2E8F0;
  color: #64748B;

  svg {
    margin-bottom: 1rem;
    color: #94A3B8;
  }
}

.summary-sidebar {
  width: 320px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.earnings-card {
  background: linear-gradient(135deg, #1A365D 0%, #0F172A 100%);
  border-radius: 1rem;
  padding: 1.5rem;
  color: white;
  position: relative;
  overflow: hidden;
}

.earnings-bg-icon {
  position: absolute;
  top: 0;
  right: 0;
  padding: 1rem;
  opacity: 0.1;
  color: white;
}

.earnings-label {
  font-size: 0.6875rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.7) !important;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 0.25rem 0;
}

.earnings-value {
  font-size: 1.875rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: white !important;
}

.earnings-details {
  position: relative;
  z-index: 1;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.8) !important;
  margin-bottom: 0.75rem;

  span {
    color: rgba(255, 255, 255, 0.8) !important;
  }

  .detail-value {
    font-weight: 700;
    color: white !important;
  }
}

.progress-bar {
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  margin-bottom: 0.75rem;
}

.progress-fill {
  height: 100%;
  background: #4FC3F7;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.earnings-note {
  font-size: 0.625rem;
  color: rgba(255, 255, 255, 0.6) !important;
  line-height: 1.5;
  margin: 0;

  strong {
    color: white !important;
  }
}

.fee-card {
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 1rem;
  padding: 1.25rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.fee-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 700;
  color: #1A365D;
  margin: 0 0 1rem 0;

  svg {
    color: #4FC3F7;
  }
}

.fee-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.fee-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.fee-info {
  display: flex;
  flex-direction: column;
}

.fee-name {
  font-size: 0.75rem;
  font-weight: 700;
  color: #334155;
}

.fee-desc {
  font-size: 0.625rem;
  color: #94A3B8;
}

.fee-value {
  font-size: 0.75rem;
  font-weight: 700;
  color: #1A365D;
}

.fee-divider {
  height: 1px;
  background: #E2E8F0;
  margin: 1rem 0;
}

.net-earning-box {
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 0.5rem;
  padding: 0.75rem;
}

.net-label {
  font-size: 0.6875rem;
  color: #64748B;
  margin-bottom: 0.25rem;
}

.net-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  font-weight: 700;

  span:first-child {
    color: #475569;
  }

  .net-value {
    color: #22C55E;
  }
}

.tip-card {
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(79, 195, 247, 0.1);
  border: 1px solid rgba(79, 195, 247, 0.2);
  border-radius: 1rem;
}

.tip-icon {
  width: 32px;
  height: 32px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  svg {
    color: #4FC3F7;
  }
}

.tip-content {
  h4 {
    font-size: 0.875rem;
    font-weight: 700;
    color: #1A365D;
    margin: 0 0 0.25rem 0;
  }

  p {
    font-size: 0.75rem;
    color: #475569;
    line-height: 1.5;
    margin: 0;

    strong {
      color: #1A365D;
    }
  }
}

.sticky-footer {
  position: fixed;
  bottom: 0;
  left: 260px; // Account for sidebar width
  right: 0;
  display: flex;
  justify-content: center; // Center the inner content
  align-items: center;
  padding: 1rem 2rem;
  background: white;
  border-top: 1px solid #E2E8F0;
  z-index: 50;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.05);
}

.sticky-footer-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 1400px;
}

.draft-btn {
  padding: 0.625rem 1rem;
  background: none;
  border: none;
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748B;
  cursor: pointer;
  border-radius: 0.5rem;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    color: #1A365D;
    background: #F8FAFC;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.footer-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.next-hint {
  font-size: 0.75rem;
  color: #94A3B8;
}

.continue-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 2rem;
  background: #FF9800;
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #F57C00;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.bulk-edit-modal {
  background: white;
  border-radius: 1rem;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #E2E8F0;

  h2 {
    font-size: 1.125rem;
    font-weight: 700;
    color: #1A365D;
    margin: 0;
  }
}

.modal-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: #64748B;
  cursor: pointer;
  border-radius: 0.5rem;
  transition: all 0.2s;

  &:hover {
    background: #F1F5F9;
    color: #1A365D;
  }
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
}

.modal-desc {
  font-size: 0.875rem;
  color: #64748B;
  margin: 0 0 1.5rem 0;
}

.bulk-edit-options {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.edit-option {
  label:first-child {
    display: block;
    font-size: 0.75rem;
    font-weight: 700;
    color: #1A365D;
    margin-bottom: 0.5rem;
  }
}

.radio-group {
  display: flex;
  gap: 1rem;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #475569;
  cursor: pointer;

  input[type="radio"] {
    width: 16px;
    height: 16px;
    accent-color: #4FC3F7;
  }
}

.checkbox-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  color: #475569;
  cursor: pointer;

  input[type="checkbox"] {
    width: 16px;
    height: 16px;
    accent-color: #4FC3F7;
  }
}

.bulk-input-wrapper {
  display: flex;
  align-items: center;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 0.5rem;
  overflow: hidden;

  .currency-prefix,
  .suffix {
    padding: 0 0.75rem;
    font-weight: 500;
    color: #64748B;
    background: #F1F5F9;
  }

  input {
    flex: 1;
    padding: 0.75rem;
    border: none;
    background: transparent;
    font-size: 0.9375rem;
    font-weight: 600;
    color: #1A365D;

    &:focus {
      outline: none;
    }
  }
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #E2E8F0;
}

.modal-cancel {
  padding: 0.625rem 1.25rem;
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748B;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #F8FAFC;
  }
}

.modal-apply {
  padding: 0.625rem 1.25rem;
  background: #4FC3F7;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 700;
  color: white;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #0288D1;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.spin {
  animation: spin 1s linear infinite;
}

@media (max-width: 1024px) {
  .content-area {
    flex-direction: column;
  }

  .summary-sidebar {
    width: 100%;
    flex-direction: row;
    flex-wrap: wrap;

    > * {
      flex: 1;
      min-width: 280px;
    }
  }
}

@media (max-width: 768px) {
  .page-scroll {
    padding: 0;
    padding-bottom: 8rem;
  }

  .page-header {
    flex-direction: column;
    gap: 0;
    margin-bottom: 0;
    background: white;
    border-bottom: 1px solid #F1F5F9;
    padding: 1rem;
  }

  .header-left {
    margin-bottom: 0.75rem;
  }

  .page-title {
    font-size: 1.125rem;
    margin-bottom: 0.25rem;
  }

  .page-subtitle {
    font-size: 0.75rem;
    line-height: 1.5;
  }

  .header-actions {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 0.75rem;
  }

  .currency-toggle {
    padding: 0.125rem;

    button {
      padding: 0.375rem 0.625rem;
      font-size: 0.625rem;
    }
  }

  .bulk-edit-btn {
    padding: 0.5rem 0.75rem;
    font-size: 0.75rem;

    svg {
      transform: scale(0.85);
    }
  }

  .content-area {
    padding: 1rem;
  }

  .rates-column {
    gap: 1rem;
  }

  .rate-card {
    border-radius: 0.75rem;
  }

  .card-header {
    padding: 1rem;
    background: rgba(248, 250, 252, 0.5);
  }

  .card-info {
    gap: 0.75rem;
  }

  .card-icon {
    width: 40px;
    height: 40px;
    border-radius: 0.5rem;

    svg {
      transform: scale(0.9);
    }
  }

  .card-title-row {
    flex-wrap: wrap;
    gap: 0.375rem;

    h3 {
      font-size: 0.875rem;
    }
  }

  .status-badge {
    font-size: 0.5625rem;
    padding: 0.125rem 0.375rem;
  }

  .card-text p {
    font-size: 0.6875rem;
  }

  .toggle-switch {
    width: 40px;
    height: 22px;

    .toggle-slider::before {
      height: 16px;
      width: 16px;
    }

    input:checked + .toggle-slider::before {
      transform: translateX(18px);
    }
  }

  .card-body {
    padding: 1rem;
  }

  .rate-inputs-grid {
    grid-template-columns: 1fr;
    gap: 1rem;

    &.half {
      grid-template-columns: 1fr;
    }
  }

  .rate-input-group {
    &.urgent-group {
      margin: 0;
      padding: 0.75rem;
      border-radius: 0.5rem;
    }
  }

  .input-label {
    font-size: 0.6875rem;
    margin-bottom: 0.5rem;

    .min-hint {
      font-size: 0.5625rem;
    }

    .ai-badge {
      font-size: 0.5625rem;
      padding: 0.125rem 0.375rem;
    }
  }

  .rate-input-wrapper {
    border-radius: 0.5rem;

    .currency-prefix {
      padding: 0 0.75rem;
      font-size: 0.875rem;
    }

    input {
      padding: 0.625rem 0.625rem 0.625rem 0;
      font-size: 0.875rem;
    }

    .check-icon {
      right: 0.75rem;
      transform: scale(0.85);
    }
  }

  .earning-hint {
    font-size: 0.625rem;
    margin-top: 0.375rem;
  }

  .info-box {
    padding: 0.75rem;
    font-size: 0.6875rem;
    border-radius: 0.5rem;

    svg {
      transform: scale(0.85);
    }
  }

  .setup-ribbon {
    width: 48px;
    height: 48px;

    span {
      top: 10px;
      right: -20px;
      width: 80px;
      font-size: 0.5rem;
      padding: 0.125rem 0;
    }
  }

  .configure-btn {
    padding: 0.5rem 1.25rem;
    font-size: 0.75rem;
    gap: 0.375rem;

    svg {
      transform: scale(0.85);
    }
  }

  .summary-sidebar {
    flex-direction: column;
    gap: 1rem;
    margin-top: 0;

    > * {
      min-width: 100%;
    }
  }

  .earnings-card {
    border-radius: 0.75rem;
    padding: 1.25rem;
  }

  .earnings-bg-icon {
    svg {
      transform: scale(0.75);
    }
  }

  .earnings-label {
    font-size: 0.625rem;
  }

  .earnings-value {
    font-size: 1.5rem;
    margin-bottom: 0.75rem;
  }

  .detail-row {
    font-size: 0.6875rem;
    margin-bottom: 0.5rem;
  }

  .progress-bar {
    height: 6px;
    margin-bottom: 0.5rem;
  }

  .earnings-note {
    font-size: 0.625rem;
  }

  .fee-card {
    border-radius: 0.75rem;
    padding: 1rem;
  }

  .fee-title {
    font-size: 0.875rem;
    margin-bottom: 0.75rem;

    svg {
      transform: scale(0.85);
    }
  }

  .fee-list {
    gap: 0.75rem;
  }

  .fee-name {
    font-size: 0.6875rem;
  }

  .fee-desc {
    font-size: 0.625rem;
  }

  .fee-value {
    font-size: 0.625rem;
  }

  .fee-divider {
    margin: 0.5rem 0;
  }

  .net-earning-box {
    padding: 0.75rem;
    border-radius: 0.5rem;
  }

  .net-label {
    font-size: 0.6875rem;
  }

  .net-row {
    font-size: 0.875rem;
  }

  .tip-card {
    padding: 1rem;
    gap: 0.75rem;
    border-radius: 0.75rem;
  }

  .tip-icon {
    width: 32px;
    height: 32px;

    svg {
      transform: scale(0.85);
    }
  }

  .tip-content {
    h4 {
      font-size: 0.875rem;
    }

    p {
      font-size: 0.6875rem;
    }
  }

  .sticky-footer {
    left: 0;
    padding: 0.75rem 1rem;
  }

  .sticky-footer-inner {
    flex-direction: column;
    gap: 0.5rem;
  }

  .footer-right {
    width: 100%;
    flex-direction: column;
    gap: 0.5rem;
  }

  .next-hint {
    display: none;
  }

  .draft-btn {
    width: 100%;
    order: 2;
    padding: 0.5rem;
    font-size: 0.75rem;
  }

  .continue-btn {
    width: 100%;
    order: 1;
    justify-content: center;
    padding: 0.875rem 1.5rem;
    border-radius: 0.75rem;
    font-size: 0.875rem;
  }

  .bulk-edit-modal {
    margin: 1rem;
    max-height: calc(100vh - 2rem);
    border-radius: 0.75rem;
  }

  .modal-header {
    padding: 1rem;

    h2 {
      font-size: 1rem;
    }
  }

  .modal-body {
    padding: 1rem;
  }

  .modal-desc {
    font-size: 0.75rem;
    margin-bottom: 1rem;
  }

  .bulk-edit-options {
    gap: 1rem;
  }

  .edit-option {
    label:first-child {
      font-size: 0.6875rem;
    }
  }

  .radio-group {
    flex-direction: column;
    gap: 0.5rem;
  }

  .radio-label {
    font-size: 0.8125rem;
  }

  .checkbox-group {
    grid-template-columns: 1fr;
    gap: 0.375rem;
  }

  .checkbox-label {
    font-size: 0.75rem;
  }

  .bulk-input-wrapper {
    input {
      padding: 0.625rem;
      font-size: 0.875rem;
    }
  }

  .modal-footer {
    padding: 0.75rem 1rem;
    flex-direction: column-reverse;
    gap: 0.5rem;
  }

  .modal-cancel,
  .modal-apply {
    width: 100%;
    justify-content: center;
    padding: 0.75rem 1rem;
  }
}
</style>
