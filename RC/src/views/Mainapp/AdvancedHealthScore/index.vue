<template>
  <div class="advanced-health-score">
    <!-- Hero Banner -->
    <div class="hero-banner">
      <div class="hero-background">
        <div class="hero-pattern"></div>
        <div class="hero-glow"></div>
      </div>
      <div class="hero-content">
        <div class="hero-badge">
          <v-icon name="hi-sparkles" scale="0.9" />
          <span>AI-Powered Analysis</span>
        </div>
        <h1>Advanced Health Score</h1>
        <p class="hero-subtitle">Get a comprehensive, personalized health assessment powered by advanced AI. Understand your health across 6 key domains with actionable insights.</p>
        <div class="hero-stats">
          <div class="stat">
            <span class="stat-value">6</span>
            <span class="stat-label">Health Domains</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat">
            <span class="stat-value">25</span>
            <span class="stat-label">Questions</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat">
            <span class="stat-value">~5</span>
            <span class="stat-label">Minutes</span>
          </div>
        </div>
        <router-link to="/app/patient/advanced-health-score/history" class="history-link">
          <v-icon name="hi-clock" scale="0.9" />
          View Past Assessments
        </router-link>
      </div>
      <div class="hero-illustration">
        <div class="floating-card card-1">
          <v-icon name="hi-heart" scale="1.2" />
        </div>
        <div class="floating-card card-2">
          <v-icon name="hi-chart-bar" scale="1.2" />
        </div>
        <div class="floating-card card-3">
          <v-icon name="hi-shield-check" scale="1.2" />
        </div>
        <div class="score-preview">
          <svg viewBox="0 0 100 100" class="score-ring">
            <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="8"/>
            <circle cx="50" cy="50" r="45" fill="none" stroke="white" stroke-width="8"
                    stroke-dasharray="220" stroke-dashoffset="55" stroke-linecap="round"
                    transform="rotate(-90 50 50)"/>
          </svg>
          <div class="score-value">85</div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <v-icon name="hi-exclamation-circle" scale="2" />
      <p>{{ error }}</p>
      <button @click="checkCanStart" class="retry-btn">Try Again</button>
    </div>

    <!-- Cannot Start State -->
    <div v-else-if="!canStart && !loading" class="cannot-start-state">
      <div class="credit-card">
        <v-icon name="hi-currency-dollar" scale="2" />
        <h3>Insufficient Credits</h3>
        <p>You need <strong>{{ creditsRequired }}</strong> AI credits to start an assessment.</p>
        <p class="credits-available">You have: <strong>{{ creditsAvailable }}</strong> credits</p>
        <button @click="openCreditsModal" class="purchase-btn">
          Purchase Credits
        </button>
      </div>
    </div>

    <!-- Credits Purchase Modal -->
    <div v-if="showCreditsModal" class="modal-overlay" @click.self="closeCreditsModal">
      <div class="credits-modal">
        <div class="modal-header">
          <div class="header-icon">
            <v-icon name="hi-sparkles" scale="1.2" />
          </div>
          <div class="header-text">
            <h3>AI Health Summary Credits</h3>
            <p>Unlock AI-powered health insights</p>
          </div>
          <button class="close-btn" @click="closeCreditsModal">
            <v-icon name="hi-x" scale="1" />
          </button>
        </div>

        <div class="modal-body">
          <!-- Current Credits -->
          <div class="current-credits">
            <div class="credits-icon">
              <v-icon name="bi-wallet2" scale="1" />
            </div>
            <div class="credits-info">
              <span class="label">Your Current Credits</span>
              <span class="value">{{ creditsAvailable }} credits</span>
            </div>
          </div>

          <!-- Needed Credits -->
          <div class="needed-info">
            <v-icon name="hi-information-circle" scale="1" />
            <span>You need <strong>{{ creditsRequired }}</strong> credits for this assessment</span>
          </div>

          <!-- Plans -->
          <div v-if="loadingPlans" class="plans-loading">
            <div class="spinner small"></div>
            <span>Loading plans...</span>
          </div>

          <div v-else class="plans-grid">
            <div
              v-for="plan in creditPlans"
              :key="plan._id"
              class="plan-card"
              :class="{ selected: selectedPlan?._id === plan._id, subscription: plan.type === 'subscription' }"
              @click="selectPlan(plan)"
            >
              <div class="plan-badge" v-if="plan.type === 'subscription'">
                <v-icon name="hi-lightning-bolt" scale="0.8" />
                Unlimited
              </div>
              <div class="plan-credits" v-else>
                <span class="number">{{ plan.credits }}</span>
                <span class="label">credits</span>
              </div>
              <div class="plan-name">{{ plan.name }}</div>
              <div class="plan-price">{{ formatPrice(plan.price) }}</div>
              <div class="plan-desc" v-if="plan.type === 'subscription'">
                {{ plan.duration_days || 30 }} days unlimited
              </div>
            </div>
          </div>

          <!-- Wallet Balance -->
          <div v-if="selectedPlan" class="wallet-section">
            <div class="wallet-balance">
              <span class="label">Wallet Balance:</span>
              <span class="value">{{ formatPrice(walletBalance) }}</span>
            </div>
            <div v-if="walletBalance < selectedPlan.price" class="insufficient-warning">
              <v-icon name="hi-exclamation-circle" scale="1" />
              <span>Insufficient balance. You need {{ formatPrice(selectedPlan.price - walletBalance) }} more.</span>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" @click="closeCreditsModal">Cancel</button>
          <button
            v-if="selectedPlan && walletBalance < selectedPlan.price"
            class="btn-topup"
            @click="goToWallet"
          >
            <v-icon name="hi-plus" scale="0.9" />
            Top Up Wallet
          </button>
          <button
            v-else-if="selectedPlan"
            class="btn-purchase"
            :disabled="purchasingPlan"
            @click="purchasePlan"
          >
            {{ purchasingPlan ? 'Processing...' : 'Purchase Now' }}
          </button>
          <button v-else class="btn-purchase" disabled>
            Select a Plan
          </button>
        </div>
      </div>
    </div>

    <!-- Ready State - Can Start Assessment -->
    <div v-else class="ready-state">
      <div class="intro-card">
        <div class="intro-icon">
          <v-icon name="hi-clipboard-check" scale="2.5" />
        </div>
        <h2>Comprehensive Health Analysis</h2>
        <p>Answer questions about your health across 6 key domains and receive a detailed AI-powered health report.</p>

        <div class="features">
          <div class="feature">
            <v-icon name="hi-heart" scale="1.2" />
            <span>Cardiovascular Health</span>
          </div>
          <div class="feature">
            <v-icon name="hi-chart-bar" scale="1.2" />
            <span>Metabolic Health</span>
          </div>
          <div class="feature">
            <v-icon name="hi-emoji-happy" scale="1.2" />
            <span>Mental Wellbeing</span>
          </div>
          <div class="feature">
            <v-icon name="hi-sun" scale="1.2" />
            <span>Lifestyle Factors</span>
          </div>
          <div class="feature">
            <v-icon name="hi-user" scale="1.2" />
            <span>Physical Symptoms</span>
          </div>
          <div class="feature">
            <v-icon name="hi-shield-check" scale="1.2" />
            <span>Preventive Care</span>
          </div>
        </div>

        <div class="credit-info">
          <v-icon name="hi-information-circle" scale="1" />
          <span>This assessment uses <strong>{{ creditsRequired }}</strong> AI credits</span>
        </div>

        <router-link to="/app/patient/advanced-health-score/assessment" class="start-btn">
          <v-icon name="hi-play" scale="1" />
          Start Assessment
        </router-link>
      </div>

      <!-- Upload Documents Section -->
      <div class="docs-info">
        <h3>Supporting Documents (Optional)</h3>
        <p>You can upload lab results, medical reports, or other health documents during the assessment for a more accurate analysis.</p>
        <ul>
          <li>PDF, JPEG, PNG formats accepted</li>
          <li>Up to {{ maxDocuments }} documents</li>
          <li>Max {{ maxFileSize }}MB per file</li>
          <li>Documents must contain your name for verification</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import apiFactory from "@/services/apiFactory";
import http from "@/services/http";

export default {
  name: "AdvancedHealthScoreIndex",
  data() {
    return {
      loading: true,
      error: null,
      canStart: false,
      creditsRequired: 3,
      creditsAvailable: 0,
      creditSource: "",
      maxDocuments: 5,
      maxFileSize: 10,
      // Credits modal
      showCreditsModal: false,
      creditPlans: [],
      loadingPlans: false,
      selectedPlan: null,
      walletBalance: 0,
      purchasingPlan: false,
    };
  },
  async mounted() {
    await this.checkCanStart();
  },
  methods: {
    async checkCanStart() {
      this.loading = true;
      this.error = null;
      try {
        const response = await apiFactory.$_canStartAdvancedHealthScore();
        const data = response.data?.data || response.data;

        this.canStart = data.can_start;
        this.creditsRequired = data.credits_required || 3;
        this.creditsAvailable = data.credits_available || 0;
        this.creditSource = data.credit_source || "";
        this.maxDocuments = data.max_documents || 5;
        this.maxFileSize = data.max_file_size_mb || 10;

        if (!data.can_start && data.reason) {
          // Feature is disabled
          if (data.reason.includes("disabled")) {
            this.error = data.reason;
          }
        }
      } catch (err) {
        console.error("Error checking can start:", err);
        this.error = "Unable to check assessment availability. Please try again.";
      } finally {
        this.loading = false;
      }
    },

    // Credits Modal Methods
    async openCreditsModal() {
      this.showCreditsModal = true;
      this.selectedPlan = null;
      await Promise.all([
        this.fetchCreditPlans(),
        this.fetchWalletBalance()
      ]);
    },

    closeCreditsModal() {
      this.showCreditsModal = false;
      this.selectedPlan = null;
    },

    async fetchCreditPlans() {
      this.loadingPlans = true;
      try {
        const res = await http.get("claude-summary/plans");
        if (res.status === 200) {
          this.creditPlans = res.data?.data || res.data || [];
        }
      } catch (e) {
        console.error("Error fetching credit plans:", e);
      }
      this.loadingPlans = false;
    },

    async fetchWalletBalance() {
      try {
        const res = await http.get("wallets/balance");
        if (res.status === 200) {
          const data = res.data?.data || res.data;
          this.walletBalance = data?.currentBalance || data?.balance || 0;
        }
      } catch (e) {
        console.error("Error fetching wallet balance:", e);
      }
    },

    selectPlan(plan) {
      this.selectedPlan = plan;
    },

    async purchasePlan() {
      if (!this.selectedPlan) return;

      this.purchasingPlan = true;
      try {
        const res = await http.post("claude-summary/purchase", { plan_id: this.selectedPlan._id });
        if (res.status === 200 || res.status === 201) {
          this.$toast.success("Credits purchased successfully!");
          this.closeCreditsModal();
          // Refresh the can-start check to update credit balance
          await this.checkCanStart();
        }
      } catch (e) {
        console.error("Error purchasing plan:", e);
        this.$toast.error(e.response?.data?.message || "Failed to purchase credits");
      }
      this.purchasingPlan = false;
    },

    formatPrice(price) {
      return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
      }).format(price || 0);
    },

    goToWallet() {
      this.closeCreditsModal();
      this.$router.push("/app/patient/wallet");
    },
  },
};
</script>

<style scoped lang="scss">
.advanced-health-score {
  padding: 20px;
  max-width: 900px;
  margin: 0 auto;

  @media (max-width: 480px) {
    padding: 16px;
  }
}

// Hero Banner Styles
.hero-banner {
  position: relative;
  background: linear-gradient(135deg, #0EAEC4 0%, #0891b2 50%, #0e7490 100%);
  border-radius: 24px;
  padding: 40px;
  margin-bottom: 24px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 280px;

  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
    padding: 32px 24px;
    min-height: auto;
  }

  @media (max-width: 480px) {
    padding: 24px 20px;
    border-radius: 16px;
  }
}

.hero-background {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;

  .hero-pattern {
    position: absolute;
    inset: 0;
    background-image: radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 1px, transparent 1px),
                      radial-gradient(circle at 80% 20%, rgba(255,255,255,0.08) 1px, transparent 1px);
    background-size: 60px 60px, 80px 80px;
  }

  .hero-glow {
    position: absolute;
    top: -50%;
    right: -20%;
    width: 60%;
    height: 200%;
    background: radial-gradient(ellipse, rgba(255,255,255,0.15) 0%, transparent 70%);
  }
}

.hero-content {
  position: relative;
  z-index: 1;
  flex: 1;
  max-width: 500px;

  @media (max-width: 768px) {
    max-width: 100%;
    margin-bottom: 32px;
  }

  h1 {
    font-size: 32px;
    font-weight: 800;
    color: white;
    margin: 0 0 12px;
    line-height: 1.2;

    @media (max-width: 480px) {
      font-size: 26px;
    }
  }
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  color: white;
  margin-bottom: 16px;

  @media (max-width: 480px) {
    font-size: 12px;
    padding: 5px 12px;
  }
}

.hero-subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.6;
  margin: 0 0 24px;

  @media (max-width: 480px) {
    font-size: 14px;
    margin-bottom: 20px;
  }
}

.hero-stats {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;

  @media (max-width: 768px) {
    justify-content: center;
  }

  @media (max-width: 480px) {
    gap: 16px;
  }

  .stat {
    text-align: left;

    @media (max-width: 768px) {
      text-align: center;
    }
  }

  .stat-value {
    display: block;
    font-size: 28px;
    font-weight: 800;
    color: white;
    line-height: 1;

    @media (max-width: 480px) {
      font-size: 24px;
    }
  }

  .stat-label {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.8);
    text-transform: uppercase;
    letter-spacing: 0.5px;

    @media (max-width: 480px) {
      font-size: 11px;
    }
  }

  .stat-divider {
    width: 1px;
    height: 40px;
    background: rgba(255, 255, 255, 0.3);

    @media (max-width: 480px) {
      height: 32px;
    }
  }
}

.history-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  text-decoration: none;
  transition: all 0.2s;

  &:hover {
    color: white;
    text-decoration: underline;
  }

  @media (max-width: 480px) {
    font-size: 13px;
  }
}

.hero-illustration {
  position: relative;
  width: 220px;
  height: 220px;
  flex-shrink: 0;

  @media (max-width: 768px) {
    width: 180px;
    height: 180px;
  }

  @media (max-width: 480px) {
    width: 150px;
    height: 150px;
  }
}

.floating-card {
  position: absolute;
  background: white;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  color: #0EAEC4;
  animation: float 3s ease-in-out infinite;

  @media (max-width: 480px) {
    padding: 8px;
    border-radius: 8px;
  }

  &.card-1 {
    top: 0;
    left: 0;
    animation-delay: 0s;
  }

  &.card-2 {
    top: 20%;
    right: 0;
    animation-delay: 0.5s;
  }

  &.card-3 {
    bottom: 10%;
    left: 10%;
    animation-delay: 1s;
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.score-preview {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 120px;
  height: 120px;

  @media (max-width: 768px) {
    width: 100px;
    height: 100px;
  }

  @media (max-width: 480px) {
    width: 80px;
    height: 80px;
  }

  .score-ring {
    width: 100%;
    height: 100%;
  }

  .score-value {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 32px;
    font-weight: 800;
    color: white;

    @media (max-width: 768px) {
      font-size: 28px;
    }

    @media (max-width: 480px) {
      font-size: 22px;
    }
  }
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-top-color: #0EAEC4;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-state {
  color: #ef4444;

  p {
    margin: 16px 0;
    color: #6b7280;
  }

  .retry-btn {
    padding: 10px 20px;
    background: #0EAEC4;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;

    &:hover {
      background: #0d9eb3;
    }
  }
}

.cannot-start-state {
  .credit-card {
    background: white;
    border: 2px solid #e5e7eb;
    border-radius: 16px;
    padding: 40px;
    text-align: center;

    h3 {
      font-size: 20px;
      margin: 16px 0 8px;
      color: #111827;
    }

    p {
      color: #6b7280;
      margin: 0 0 8px;
    }

    .credits-available {
      color: #ef4444;
      margin-bottom: 24px;
    }

    .purchase-btn {
      display: inline-block;
      padding: 12px 24px;
      background: #0EAEC4;
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 500;

      &:hover {
        background: #0d9eb3;
      }
    }
  }
}

.ready-state {
  .intro-card {
    background: white;
    border: 2px solid #e5e7eb;
    border-radius: 16px;
    padding: 32px;
    text-align: center;
    margin-bottom: 20px;

    @media (max-width: 480px) {
      padding: 20px;
      border-radius: 12px;
    }

    .intro-icon {
      width: 64px;
      height: 64px;
      background: rgba(14, 174, 196, 0.1);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
      color: #0EAEC4;

      @media (max-width: 480px) {
        width: 56px;
        height: 56px;
      }
    }

    h2 {
      font-size: 22px;
      color: #111827;
      margin: 0 0 8px;

      @media (max-width: 480px) {
        font-size: 18px;
      }
    }

    > p {
      color: #6b7280;
      margin: 0 0 24px;
      max-width: 500px;
      margin-left: auto;
      margin-right: auto;

      @media (max-width: 480px) {
        font-size: 14px;
        margin-bottom: 20px;
      }
    }
  }

  .features {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 24px;

    @media (max-width: 600px) {
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }

    .feature {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: #f9fafb;
      border-radius: 8px;
      font-size: 13px;
      color: #374151;

      @media (max-width: 480px) {
        padding: 10px;
        font-size: 12px;
        gap: 6px;
      }
    }
  }

  .credit-info {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px;
    background: #fef3c7;
    border-radius: 8px;
    color: #92400e;
    font-size: 14px;
    margin-bottom: 24px;

    @media (max-width: 480px) {
      font-size: 13px;
      padding: 10px;
    }
  }

  .start-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 14px 32px;
    background: #0EAEC4;
    color: white;
    text-decoration: none;
    border-radius: 10px;
    font-weight: 600;
    font-size: 16px;
    transition: all 0.2s;

    @media (max-width: 480px) {
      width: 100%;
      justify-content: center;
      padding: 14px 24px;
    }

    &:hover {
      background: #0d9eb3;
      transform: translateY(-1px);
    }
  }

  .docs-info {
    background: #f9fafb;
    border-radius: 12px;
    padding: 20px;

    @media (max-width: 480px) {
      padding: 16px;
    }

    h3 {
      font-size: 16px;
      color: #111827;
      margin: 0 0 8px;

      @media (max-width: 480px) {
        font-size: 15px;
      }
    }

    p {
      color: #6b7280;
      font-size: 14px;
      margin: 0 0 12px;

      @media (max-width: 480px) {
        font-size: 13px;
      }
    }

    ul {
      margin: 0;
      padding-left: 20px;

      li {
        color: #6b7280;
        font-size: 13px;
        margin-bottom: 4px;

        @media (max-width: 480px) {
          font-size: 12px;
        }
      }
    }
  }
}

// Credits Modal Styles
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;

  @media (max-width: 480px) {
    padding: 16px;
    align-items: flex-end;
  }
}

.credits-modal {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: modalSlideUp 0.3s ease-out;

  @media (max-width: 480px) {
    border-radius: 16px 16px 0 0;
    max-height: 85vh;
  }
}

@keyframes modalSlideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;

  @media (max-width: 480px) {
    padding: 16px;
  }

  .header-icon {
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, #0EAEC4 0%, #0891b2 100%);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;

    @media (max-width: 480px) {
      width: 40px;
      height: 40px;
    }
  }

  .header-text {
    flex: 1;

    h3 {
      font-size: 18px;
      font-weight: 600;
      color: #111827;
      margin: 0;

      @media (max-width: 480px) {
        font-size: 16px;
      }
    }

    p {
      font-size: 13px;
      color: #6b7280;
      margin: 2px 0 0;
    }
  }

  .close-btn {
    width: 32px;
    height: 32px;
    border: none;
    background: #f3f4f6;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #6b7280;
    transition: all 0.2s;

    &:hover {
      background: #e5e7eb;
      color: #374151;
    }
  }
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;

  @media (max-width: 480px) {
    padding: 16px;
  }
}

.current-credits {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: #f0fdfa;
  border-radius: 10px;
  margin-bottom: 12px;

  .credits-icon {
    width: 40px;
    height: 40px;
    background: #0EAEC4;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }

  .credits-info {
    display: flex;
    flex-direction: column;

    .label {
      font-size: 12px;
      color: #6b7280;
    }

    .value {
      font-size: 16px;
      font-weight: 600;
      color: #0EAEC4;
    }
  }
}

.needed-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #fef3c7;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 13px;
  color: #92400e;
}

.plans-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 40px;
  color: #6b7280;

  .spinner.small {
    width: 20px;
    height: 20px;
    border-width: 2px;
  }
}

.plans-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 16px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 10px;
  }
}

.plan-card {
  position: relative;
  padding: 16px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;

  &:hover {
    border-color: #0EAEC4;
  }

  &.selected {
    border-color: #0EAEC4;
    background: #f0fdfa;
  }

  &.subscription {
    background: linear-gradient(135deg, #f0fdfa 0%, #e0f7fa 100%);

    &.selected {
      background: linear-gradient(135deg, #d0f4f7 0%, #c0eff5 100%);
    }
  }

  .plan-badge {
    position: absolute;
    top: -8px;
    left: 50%;
    transform: translateX(-50%);
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    background: linear-gradient(135deg, #0EAEC4 0%, #0891b2 100%);
    color: white;
    font-size: 11px;
    font-weight: 600;
    border-radius: 20px;
    white-space: nowrap;
  }

  .plan-credits {
    margin-bottom: 8px;

    .number {
      font-size: 32px;
      font-weight: 700;
      color: #0EAEC4;
      line-height: 1;
    }

    .label {
      display: block;
      font-size: 12px;
      color: #6b7280;
    }
  }

  .plan-name {
    font-size: 14px;
    font-weight: 600;
    color: #374151;
    margin-bottom: 4px;
  }

  .plan-price {
    font-size: 18px;
    font-weight: 700;
    color: #111827;
  }

  .plan-desc {
    font-size: 12px;
    color: #6b7280;
    margin-top: 4px;
  }
}

.wallet-section {
  padding: 14px;
  background: #f9fafb;
  border-radius: 10px;

  .wallet-balance {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .label {
      font-size: 14px;
      color: #6b7280;
    }

    .value {
      font-size: 16px;
      font-weight: 600;
      color: #111827;
    }
  }

  .insufficient-warning {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 12px;
    padding: 10px;
    background: #fef2f2;
    border-radius: 8px;
    font-size: 13px;
    color: #dc2626;
  }
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #e5e7eb;

  @media (max-width: 480px) {
    padding: 16px;
  }

  button {
    flex: 1;
    padding: 12px 20px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  .btn-cancel {
    background: #f3f4f6;
    border: none;
    color: #374151;

    &:hover:not(:disabled) {
      background: #e5e7eb;
    }
  }

  .btn-purchase {
    background: #0EAEC4;
    border: none;
    color: white;

    &:hover:not(:disabled) {
      background: #0d9eb3;
    }
  }

  .btn-topup {
    background: #0EAEC4;
    border: none;
    color: white;

    &:hover:not(:disabled) {
      background: #0d9eb3;
    }
  }
}
</style>
