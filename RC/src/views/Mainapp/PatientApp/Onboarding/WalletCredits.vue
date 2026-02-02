<template>
  <div class="step-container">
    <div class="step-scroll">
      <div class="step-content">
        <div class="step-header">
          <button class="back-btn" @click="goBack">
            <v-icon name="hi-arrow-left" scale="0.9" />
            <span>Back</span>
          </button>
          <div class="step-info">
            <span class="step-badge optional">Step 9 of 9 - Optional</span>
            <h1 class="step-title">AI Health Summary Credits</h1>
            <p class="step-description">
              Fund your wallet and purchase AI credits to get personalized health summaries and insights.
            </p>
          </div>
        </div>

        <div class="form-sections">
          <!-- Wallet Balance Section -->
          <div class="form-section wallet-section">
            <div class="wallet-balance-card">
              <div class="balance-card-inner">
                <div class="card-header">
                  <span class="balance-label">Wallet Balance</span>
                  <div class="wallet-icon">
                    <v-icon name="bi-wallet2" scale="1.4" />
                  </div>
                </div>

                <div class="balance-amount">
                  <span class="currency">&#8358;</span>
                  <span class="amount">{{ formattedBalance }}</span>
                </div>

                <button class="add-funds-btn" @click="showTopUpModal = true">
                  <v-icon name="hi-plus" scale="0.9" />
                  Add Funds
                </button>
              </div>
              <div class="card-decoration circle-1"></div>
              <div class="card-decoration circle-2"></div>
            </div>
          </div>

          <!-- Health Credits Section -->
          <div class="form-section credits-section">
            <div class="credits-card">
              <div class="credits-header">
                <div class="credits-icon">
                  <v-icon name="hi-sparkles" scale="1.1" />
                </div>
                <div class="credits-text">
                  <h3>AI Health Summary Credits</h3>
                  <p>Generate detailed health reports powered by AI</p>
                </div>
              </div>

              <div class="credits-display">
                <div class="credits-main">
                  <span class="credits-number">{{ totalCredits }}</span>
                  <span class="credits-label">credits remaining</span>
                </div>

                <div class="credits-progress">
                  <div class="progress-bar">
                    <div class="progress-fill" :style="{ width: progressWidth + '%' }"></div>
                  </div>
                </div>

                <div class="credits-breakdown">
                  <div class="breakdown-item">
                    <span class="item-value free">{{ healthCredits.free_remaining }}/{{ healthCredits.free_total }}</span>
                    <span class="item-label">Free</span>
                  </div>
                  <div class="breakdown-divider"></div>
                  <div class="breakdown-item">
                    <span class="item-value purchased">{{ healthCredits.purchased }}</span>
                    <span class="item-label">Purchased</span>
                  </div>
                  <div class="breakdown-divider"></div>
                  <div class="breakdown-item">
                    <span class="item-value gifted">{{ healthCredits.gifted }}</span>
                    <span class="item-label">Gifted</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Credit Plans Section -->
          <div class="form-section plans-section">
            <h2 class="section-title">Purchase AI Credits</h2>
            <p class="section-description">Choose a plan that works for you</p>

            <div v-if="loadingPlans" class="loading-state">
              <div class="spinner"></div>
              <span>Loading plans...</span>
            </div>

            <div v-else-if="healthPlans.length === 0" class="empty-plans">
              <v-icon name="hi-ticket" scale="2" />
              <p>No plans available at the moment</p>
            </div>

            <div v-else class="plans-grid">
              <div
                v-for="plan in sortedPlans"
                :key="plan._id"
                class="plan-card"
                :class="{ featured: plan.is_popular || plan.featured }"
              >
                <div v-if="plan.is_popular || plan.featured" class="popular-badge">
                  <v-icon name="bi-star-fill" scale="0.7" />
                  Popular
                </div>

                <div class="plan-header">
                  <h4 class="plan-name">{{ plan.name }}</h4>
                  <p class="plan-credits">{{ plan.credits }} Credits</p>
                </div>

                <div class="plan-price">
                  <span class="currency">&#8358;</span>
                  <span class="amount">{{ formatPrice(plan.price) }}</span>
                </div>

                <ul class="plan-features">
                  <li v-for="(feature, idx) in getFeatures(plan)" :key="idx">
                    <v-icon name="hi-check" scale="0.8" />
                    {{ feature }}
                  </li>
                </ul>

                <button
                  class="plan-btn"
                  @click="selectPlan(plan)"
                  :disabled="purchasing"
                >
                  Purchase
                </button>
              </div>
            </div>
          </div>

          <!-- Info Section -->
          <div class="form-section info-section">
            <div class="info-card">
              <v-icon name="hi-light-bulb" scale="1.2" />
              <div class="info-content">
                <h4>What are AI Health Summary Credits?</h4>
                <p>
                  AI Health Summary Credits allow you to generate personalized health reports based on your
                  health checkups and vitals. Each credit generates one comprehensive health summary with
                  actionable recommendations.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="step-footer">
          <button class="btn-skip" @click="skipStep">
            Skip for now
          </button>
          <div class="footer-actions">
            <button class="btn-secondary" @click="saveAndExit">
              Save & Exit
            </button>
            <button class="btn-primary" @click="completeOnboarding">
              <span>Complete Setup</span>
              <v-icon name="hi-check" scale="0.8" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Top Up Modal -->
    <div v-if="showTopUpModal" class="modal-overlay" @click.self="showTopUpModal = false">
      <div class="top-up-modal">
        <div class="modal-header">
          <h3>Add Funds to Wallet</h3>
          <button class="close-btn" @click="showTopUpModal = false">
            <v-icon name="hi-x" scale="1" />
          </button>
        </div>
        <p class="modal-subtitle">Enter the amount you want to add</p>

        <div class="amount-input-wrapper">
          <span class="currency-symbol">&#8358;</span>
          <input
            type="number"
            v-model.number="topUpAmount"
            placeholder="0.00"
            min="100"
            step="100"
          />
        </div>

        <div class="quick-amounts">
          <button
            v-for="amount in quickAmounts"
            :key="amount"
            @click="topUpAmount = amount"
            :class="{ active: topUpAmount === amount }"
          >
            {{ formatPrice(amount) }}
          </button>
        </div>

        <div class="modal-actions">
          <button
            class="btn-primary full-width"
            @click="initiateTopUp"
            :disabled="!topUpAmount || topUpAmount < 100 || topUpLoading"
          >
            {{ topUpLoading ? 'Processing...' : 'Continue to Payment' }}
          </button>
          <button class="btn-secondary full-width" @click="showTopUpModal = false">
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- Purchase Confirmation Modal -->
    <div v-if="showPurchaseModal" class="modal-overlay" @click.self="closePurchaseModal">
      <div class="purchase-modal">
        <div class="modal-header">
          <div class="header-icon">
            <v-icon name="hi-sparkles" scale="1.2" />
          </div>
          <h3>Purchase AI Credits</h3>
          <button class="close-btn" @click="closePurchaseModal">
            <v-icon name="hi-x" scale="1" />
          </button>
        </div>

        <div class="purchase-details">
          <div class="plan-summary">
            <h4>{{ selectedPlan?.name }}</h4>
            <p>{{ selectedPlan?.credits }} AI Health Summary Credits</p>
          </div>

          <div class="price-summary">
            <div class="summary-row">
              <span>Plan Price</span>
              <span>&#8358;{{ formatPrice(selectedPlan?.price || 0) }}</span>
            </div>
            <div class="summary-row">
              <span>Wallet Balance</span>
              <span>&#8358;{{ formattedBalance }}</span>
            </div>
            <div class="summary-divider"></div>
            <div class="summary-row total" :class="{ insufficient: walletBalance < (selectedPlan?.price || 0) }">
              <span>After Purchase</span>
              <span>&#8358;{{ formatPrice(Math.max(0, walletBalance - (selectedPlan?.price || 0))) }}</span>
            </div>
          </div>

          <div v-if="walletBalance < (selectedPlan?.price || 0)" class="insufficient-alert">
            <v-icon name="hi-exclamation-circle" scale="1" />
            <div>
              <strong>Insufficient Balance</strong>
              <p>You need &#8358;{{ formatPrice((selectedPlan?.price || 0) - walletBalance) }} more. Please top up your wallet first.</p>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button
            class="btn-primary full-width"
            @click="confirmPurchase"
            :disabled="walletBalance < (selectedPlan?.price || 0) || purchasing"
          >
            {{ purchasing ? 'Processing...' : 'Confirm Purchase' }}
          </button>
          <button
            v-if="walletBalance < (selectedPlan?.price || 0)"
            class="btn-secondary full-width"
            @click="closePurchaseModal(); showTopUpModal = true;"
          >
            Top Up Wallet
          </button>
          <button class="btn-text" @click="closePurchaseModal">
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue';
import { useRouter } from 'vue-router';
import http from '@/services/http';
import { usePatientOnboardingState } from './composables/usePatientOnboardingState';

const router = useRouter();
const $api = inject('$http'); // apiFactory with named methods
const { completeStep, saveProgress, goToStep } = usePatientOnboardingState();

// State
const walletBalance = ref(0);
const healthCredits = ref({
  free_remaining: 0,
  free_total: 5,
  purchased: 0,
  gifted: 0,
});
const healthPlans = ref([]);
const loadingPlans = ref(true);

// Modal states
const showTopUpModal = ref(false);
const showPurchaseModal = ref(false);
const selectedPlan = ref(null);
const topUpAmount = ref(null);
const topUpLoading = ref(false);
const purchasing = ref(false);

const quickAmounts = [1000, 2000, 5000, 10000];

// Computed
const formattedBalance = computed(() => {
  return new Intl.NumberFormat('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(walletBalance.value || 0);
});

const totalCredits = computed(() => {
  return (healthCredits.value.free_remaining || 0) +
         (healthCredits.value.purchased || 0) +
         (healthCredits.value.gifted || 0);
});

const progressWidth = computed(() => {
  const total = (healthCredits.value.free_total || 5) +
               (healthCredits.value.purchased || 0) +
               (healthCredits.value.gifted || 0);
  if (total === 0) return 0;
  return Math.min((totalCredits.value / Math.max(total, 10)) * 100, 100);
});

const sortedPlans = computed(() => {
  return [...healthPlans.value].sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'bundle' ? -1 : 1;
    }
    return (a.price || 0) - (b.price || 0);
  });
});

// Methods
const formatPrice = (price) => {
  return new Intl.NumberFormat('en-NG').format(price || 0);
};

const getFeatures = (plan) => {
  if (plan.features && plan.features.length) {
    return plan.features;
  }
  return [
    `${plan.credits} AI health summaries`,
    'Never expires',
    'Use anytime',
  ];
};

const goBack = () => goToStep(8);

// API calls using apiFactory methods
const fetchWalletBalance = async () => {
  try {
    const res = await $api.$_getWalletBalance();
    const data = res.data?.data || res.data;
    walletBalance.value = data?.currentBalance || data?.balance || 0;
  } catch (e) {
    console.error('Error fetching wallet balance:', e);
  }
};

const fetchHealthCredits = async () => {
  try {
    const res = await $api.$_getClaudeSummaryCredits();
    const data = res.data?.data || res.data;
    healthCredits.value = {
      free_remaining: data.free_credits_remaining || 0,
      free_total: 5,
      purchased: data.purchased_credits || 0,
      gifted: data.gifted_credits || 0,
    };
  } catch (e) {
    console.error('Error fetching health credits:', e);
  }
};

const fetchHealthPlans = async () => {
  loadingPlans.value = true;
  try {
    const res = await $api.$_getClaudeSummaryPlans();
    if (res.status === 200) {
      const plans = res.data?.data || res.data || [];
      healthPlans.value = Array.isArray(plans) ? plans : [];
      console.log('Fetched health plans:', healthPlans.value);
    }
  } catch (e) {
    console.error('Error fetching health plans:', e);
    healthPlans.value = [];
  }
  loadingPlans.value = false;
};

const initiateTopUp = async () => {
  if (!topUpAmount.value || topUpAmount.value < 100) return;
  topUpLoading.value = true;
  try {
    // Use http directly for wallet fund (no apiFactory method available)
    const res = await http.post('wallets/fund', { amount: topUpAmount.value });
    const data = res.data?.data || res.data?.result || res.data;
    if (data.authorization_url || data.paymentUrl) {
      window.location.href = data.authorization_url || data.paymentUrl;
    } else {
      await fetchWalletBalance();
      showTopUpModal.value = false;
      topUpAmount.value = null;
    }
  } catch (e) {
    console.error('Error initiating top up:', e);
    alert(e.response?.data?.message || 'Failed to initiate payment');
  }
  topUpLoading.value = false;
};

const selectPlan = (plan) => {
  selectedPlan.value = plan;
  showPurchaseModal.value = true;
};

const closePurchaseModal = () => {
  showPurchaseModal.value = false;
  selectedPlan.value = null;
};

const confirmPurchase = async () => {
  if (!selectedPlan.value || walletBalance.value < selectedPlan.value.price) return;

  purchasing.value = true;
  try {
    await $api.$_purchaseClaudeSummaryPlan(selectedPlan.value._id);

    // Refresh data
    await Promise.all([fetchWalletBalance(), fetchHealthCredits()]);
    closePurchaseModal();

    // Mark step as complete
    completeStep('walletCredits');
    saveProgress();
  } catch (e) {
    console.error('Error purchasing plan:', e);
    alert(e.response?.data?.message || 'Failed to purchase credits');
  }
  purchasing.value = false;
};

const skipStep = () => {
  saveProgress();
  router.push({ name: 'Patient Dashboard' });
};

const saveAndExit = () => {
  saveProgress();
  router.push({ name: 'Patient Dashboard' });
};

const completeOnboarding = () => {
  saveProgress();
  // Clear onboarding state from localStorage as setup is complete
  localStorage.removeItem('patient_onboarding_state');
  router.push({ name: 'Patient Dashboard' });
};

// Check if user has existing credits/wallet and mark step complete
const checkAndMarkComplete = () => {
  const hasWalletBalance = walletBalance.value > 0;
  const hasCredits = totalCredits.value > 0;

  if (hasWalletBalance || hasCredits) {
    completeStep('walletCredits');
    saveProgress();
  }
};

// Init
onMounted(async () => {
  await Promise.all([
    fetchWalletBalance(),
    fetchHealthCredits(),
    fetchHealthPlans(),
  ]);

  // Auto-mark step as complete if user already has funds or credits
  checkAndMarkComplete();
});
</script>

<style scoped lang="scss">
@import './styles/step-common.scss';

.wallet-section {
  padding: 0 !important;
  border: none !important;
  background: transparent !important;
}

.wallet-balance-card {
  position: relative;
  background: linear-gradient(135deg, #4FC3F7 0%, #0288D1 100%);
  border-radius: 1rem;
  padding: 1.5rem;
  color: white;
  overflow: hidden;

  .balance-card-inner {
    position: relative;
    z-index: 1;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;

    .balance-label {
      font-size: 0.875rem;
      opacity: 0.9;
      font-weight: 500;
    }

    .wallet-icon {
      width: 44px;
      height: 44px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .balance-amount {
    margin-bottom: 1.5rem;

    .currency {
      font-size: 1.5rem;
      font-weight: 600;
      margin-right: 0.25rem;
    }

    .amount {
      font-size: 2.5rem;
      font-weight: 700;
      letter-spacing: -1px;
    }
  }

  .add-funds-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    width: 100%;
    padding: 0.875rem;
    background: white;
    border: none;
    border-radius: 0.625rem;
    font-size: 0.9375rem;
    font-weight: 600;
    color: #0288D1;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: rgba(255, 255, 255, 0.95);
      transform: translateY(-1px);
    }
  }

  .card-decoration {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);

    &.circle-1 {
      width: 200px;
      height: 200px;
      top: -80px;
      right: -60px;
    }

    &.circle-2 {
      width: 150px;
      height: 150px;
      bottom: -60px;
      left: -40px;
    }
  }
}

.credits-section {
  padding: 0 !important;
  border: none !important;
  background: transparent !important;
}

.credits-card {
  background: white;
  border: 2px solid #E2E8F0;
  border-radius: 1rem;
  padding: 1.5rem;
  transition: all 0.3s ease;

  &:hover {
    border-color: transparent;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  }

  .credits-header {
    display: flex;
    gap: 1rem;
    align-items: flex-start;
    margin-bottom: 1.5rem;

    .credits-icon {
      width: 44px;
      height: 44px;
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(234, 179, 8, 0.1) 100%);
      border-radius: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #f59e0b;
      flex-shrink: 0;
    }

    .credits-text {
      h3 {
        font-size: 1.0625rem;
        font-weight: 700;
        color: #1A365D;
        margin: 0 0 0.25rem 0;
      }

      p {
        font-size: 0.8125rem;
        color: #64748B;
        margin: 0;
      }
    }
  }

  .credits-display {
    .credits-main {
      display: flex;
      align-items: baseline;
      gap: 0.5rem;
      margin-bottom: 0.75rem;

      .credits-number {
        font-size: 2.25rem;
        font-weight: 700;
        color: #1A365D;
      }

      .credits-label {
        font-size: 0.875rem;
        color: #64748B;
      }
    }

    .credits-progress {
      margin-bottom: 1rem;

      .progress-bar {
        height: 8px;
        background: #F1F5F9;
        border-radius: 4px;
        overflow: hidden;

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #4FC3F7 0%, #0288D1 100%);
          border-radius: 4px;
          transition: width 0.3s ease;
        }
      }
    }

    .credits-breakdown {
      display: flex;
      align-items: center;
      gap: 1rem;

      .breakdown-item {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;

        .item-value {
          font-size: 1rem;
          font-weight: 700;

          &.free { color: #10B981; }
          &.purchased { color: #0288D1; }
          &.gifted { color: #8B5CF6; }
        }

        .item-label {
          font-size: 0.6875rem;
          color: #9CA3AF;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
      }

      .breakdown-divider {
        width: 1px;
        height: 32px;
        background: #E5E7EB;
      }
    }
  }
}

.plans-section {
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 3rem;
    color: #64748B;

    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid #E2E8F0;
      border-top-color: #4FC3F7;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
  }

  .empty-plans {
    text-align: center;
    padding: 3rem;
    color: #64748B;

    svg {
      margin-bottom: 1rem;
      opacity: 0.5;
    }
  }

  .plans-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 1.25rem;
    margin-top: 1.5rem;
  }

  .plan-card {
    position: relative;
    background: white;
    border-radius: 1rem;
    border: 2px solid #E5E7EB;
    padding: 1.5rem;
    transition: all 0.3s ease;

    &:hover {
      border-color: transparent;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }

    &.featured {
      border-color: #4FC3F7;
      box-shadow: 0 4px 16px rgba(79, 195, 247, 0.15);

      &:hover {
        border-color: #4FC3F7;
        box-shadow: 0 8px 24px rgba(79, 195, 247, 0.25);
      }
    }

    .popular-badge {
      position: absolute;
      top: -10px;
      right: 20px;
      display: flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem 0.75rem;
      background: linear-gradient(135deg, #4FC3F7 0%, #0288D1 100%);
      color: white;
      border-radius: 0.75rem;
      font-size: 0.6875rem;
      font-weight: 700;
    }

    .plan-header {
      margin-bottom: 1rem;

      .plan-name {
        font-size: 1.125rem;
        font-weight: 700;
        color: #1A365D;
        margin: 0 0 0.25rem 0;
      }

      .plan-credits {
        font-size: 0.875rem;
        color: #64748B;
        margin: 0;
      }
    }

    .plan-price {
      margin-bottom: 0.75rem;

      .currency {
        font-size: 1.125rem;
        font-weight: 600;
        color: #374151;
      }

      .amount {
        font-size: 2rem;
        font-weight: 700;
        color: #1A365D;
      }
    }

    .plan-features {
      list-style: none;
      padding: 0;
      margin: 0 0 1.25rem 0;

      li {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 0;
        font-size: 0.8125rem;
        color: #4B5563;
        border-bottom: 1px solid #F3F4F6;

        &:last-child {
          border-bottom: none;
        }

        svg {
          color: #10B981;
          flex-shrink: 0;
        }
      }
    }

    .plan-btn {
      width: 100%;
      padding: 0.875rem 1.25rem;
      background: linear-gradient(135deg, #4FC3F7 0%, #0288D1 100%);
      border: none;
      border-radius: 0.625rem;
      font-size: 0.9375rem;
      font-weight: 600;
      color: white;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(79, 195, 247, 0.3);
      }

      &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }
    }
  }
}

.info-section {
  padding: 0 !important;
  border: none !important;
  background: transparent !important;
}

.info-card {
  display: flex;
  gap: 1rem;
  padding: 1.25rem;
  background: #F0F9FF;
  border: 1px solid #BAE6FD;
  border-radius: 0.75rem;

  svg {
    color: #0288D1;
    flex-shrink: 0;
  }

  .info-content {
    h4 {
      font-size: 0.9375rem;
      font-weight: 600;
      color: #1A365D;
      margin: 0 0 0.5rem 0;
    }

    p {
      font-size: 0.875rem;
      color: #64748B;
      margin: 0;
      line-height: 1.5;
    }
  }
}

// Modal Styles
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.top-up-modal,
.purchase-modal {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;

    h3 {
      font-size: 1.25rem;
      font-weight: 700;
      color: #1A365D;
      margin: 0;
    }

    .header-icon {
      width: 44px;
      height: 44px;
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(234, 179, 8, 0.1) 100%);
      border-radius: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #f59e0b;
    }

    .close-btn {
      padding: 0.5rem;
      background: transparent;
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
  }

  .modal-subtitle {
    font-size: 0.875rem;
    color: #64748B;
    margin: 0 0 1.5rem 0;
  }
}

.amount-input-wrapper {
  display: flex;
  align-items: center;
  background: #F8FAFC;
  border: 2px solid #E2E8F0;
  border-radius: 0.75rem;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  transition: all 0.2s;

  &:focus-within {
    border-color: #4FC3F7;
    box-shadow: 0 0 0 3px rgba(79, 195, 247, 0.1);
  }

  .currency-symbol {
    font-size: 1.5rem;
    font-weight: 600;
    color: #64748B;
    margin-right: 0.5rem;
  }

  input {
    flex: 1;
    background: transparent;
    border: none;
    font-size: 1.5rem;
    font-weight: 600;
    color: #1A365D;
    outline: none;

    &::placeholder {
      color: #CBD5E1;
    }
  }
}

.quick-amounts {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
  margin-bottom: 1.5rem;

  button {
    padding: 0.625rem;
    background: #F8FAFC;
    border: 1px solid #E2E8F0;
    border-radius: 0.5rem;
    font-size: 0.8125rem;
    font-weight: 600;
    color: #64748B;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: #F1F5F9;
      border-color: #CBD5E1;
    }

    &.active {
      background: #E0F7FA;
      border-color: #4FC3F7;
      color: #0288D1;
    }
  }
}

.modal-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.btn-primary.full-width,
.btn-secondary.full-width {
  width: 100%;
  justify-content: center;
}

.btn-text {
  background: transparent;
  border: none;
  font-size: 0.875rem;
  font-weight: 600;
  color: #64748B;
  cursor: pointer;
  padding: 0.75rem;

  &:hover {
    color: #4FC3F7;
  }
}

.purchase-details {
  .plan-summary {
    text-align: center;
    padding: 1.5rem;
    background: #F8FAFC;
    border-radius: 0.75rem;
    margin-bottom: 1rem;

    h4 {
      font-size: 1.125rem;
      font-weight: 700;
      color: #1A365D;
      margin: 0 0 0.25rem 0;
    }

    p {
      font-size: 0.875rem;
      color: #64748B;
      margin: 0;
    }
  }

  .price-summary {
    padding: 1rem;
    background: #F8FAFC;
    border-radius: 0.75rem;
    margin-bottom: 1rem;

    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      font-size: 0.875rem;
      color: #64748B;

      &.total {
        font-weight: 600;
        color: #1A365D;
      }

      &.insufficient {
        color: #DC2626;
      }
    }

    .summary-divider {
      height: 1px;
      background: #E2E8F0;
      margin: 0.5rem 0;
    }
  }

  .insufficient-alert {
    display: flex;
    gap: 0.75rem;
    padding: 1rem;
    background: #FEF2F2;
    border: 1px solid #FECACA;
    border-radius: 0.75rem;
    margin-bottom: 1rem;

    svg {
      color: #DC2626;
      flex-shrink: 0;
    }

    strong {
      display: block;
      font-size: 0.875rem;
      color: #DC2626;
      margin-bottom: 0.25rem;
    }

    p {
      font-size: 0.8125rem;
      color: #7F1D1D;
      margin: 0;
    }
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 640px) {
  .wallet-balance-card {
    .balance-amount {
      .currency {
        font-size: 1.25rem;
      }

      .amount {
        font-size: 2rem;
      }
    }

    .card-decoration {
      &.circle-1 {
        width: 120px;
        height: 120px;
        top: -40px;
        right: -30px;
      }

      &.circle-2 {
        width: 100px;
        height: 100px;
        bottom: -40px;
        left: -30px;
      }
    }
  }

  .credits-card {
    .credits-display {
      .credits-main .credits-number {
        font-size: 1.75rem;
      }

      .credits-breakdown {
        flex-wrap: wrap;
        gap: 0.75rem;
      }
    }
  }

  .plans-grid {
    grid-template-columns: 1fr !important;
  }

  .quick-amounts {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
