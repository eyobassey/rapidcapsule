<template>
  <div class="pharmacy-page">
    <!-- Mobile Header -->
    <header class="mobile-header">
      <button class="menu-btn" @click="$emit('openSideNav')">
        <v-icon name="hi-menu-alt-2" scale="1.2" />
      </button>
      <div class="header-logo">
        <v-icon name="ri-capsule-line" scale="1" />
        <span>Pharmacy</span>
      </div>
      <button class="action-btn" @click="createPrescription">
        <v-icon name="hi-plus" scale="1" />
      </button>
    </header>

    <!-- Page Content -->
    <div class="page-content">
      <!-- Loading State -->
      <div v-if="isLoading" class="loading-state">
        <div class="loading-spinner">
          <div class="spinner-ring"></div>
          <v-icon name="ri-capsule-line" scale="1.2" class="spinner-icon" />
        </div>
        <p>Loading pharmacy...</p>
      </div>

      <template v-else>
        <!-- Hero Section -->
        <section class="hero">
          <div class="hero__content">
            <button class="back-link desktop-only" @click="$router.push('/app/specialist/dashboard')">
              <v-icon name="hi-arrow-left" scale="0.85" />
              <span>Dashboard</span>
            </button>
            <div class="hero__badge">
              <div class="badge-pulse"></div>
              <v-icon name="ri-capsule-line" />
              <span>Pharmacy Portal</span>
            </div>
            <h1 class="hero__title">
              Pharmacy<br/>
              <span class="hero__title-accent">Dashboard</span>
            </h1>
            <p class="hero__subtitle">
              Manage prescriptions, patients, and medications all in one place.
            </p>
            <div class="hero__stats">
              <div class="hero-stat">
                <span class="hero-stat__value">{{ stats.total_prescriptions || 0 }}</span>
                <span class="hero-stat__label">Total Rx</span>
              </div>
              <div class="hero-stat__divider"></div>
              <div class="hero-stat">
                <span class="hero-stat__value hero-stat__value--warning">{{ stats.pending_payment || 0 }}</span>
                <span class="hero-stat__label">Pending</span>
              </div>
              <div class="hero-stat__divider"></div>
              <div class="hero-stat">
                <span class="hero-stat__value hero-stat__value--success">{{ stats.total_patients || 0 }}</span>
                <span class="hero-stat__label">Patients</span>
              </div>
            </div>
          </div>
          <div class="hero__visual">
            <div class="pharmacy-orb">
              <div class="orb-ring orb-ring--1"></div>
              <div class="orb-ring orb-ring--2"></div>
              <div class="orb-ring orb-ring--3"></div>
              <div class="orb-core">
                <v-icon name="ri-capsule-line" />
              </div>
            </div>
            <div class="floating-icons">
              <div class="float-icon float-icon--1"><v-icon name="hi-clipboard-list" /></div>
              <div class="float-icon float-icon--2"><v-icon name="hi-user-group" /></div>
              <div class="float-icon float-icon--3"><v-icon name="bi-wallet2" /></div>
            </div>
          </div>
        </section>

        <!-- Bento Grid -->
        <section class="bento-grid">
          <!-- Quick Actions Card -->
          <div class="bento-card actions-card">
            <div class="card-header">
              <h3>Quick Actions</h3>
            </div>
            <div class="actions-row">
              <button class="action-btn" @click="createPrescription">
                <div class="action-icon sky">
                  <v-icon name="hi-plus-circle" scale="1.1" />
                </div>
                <span>New Prescription</span>
              </button>
              <button class="action-btn" @click="$router.push('/app/specialist/pharmacy/patients')">
                <div class="action-icon violet">
                  <v-icon name="hi-user-group" scale="1.1" />
                </div>
                <span>Patients</span>
              </button>
              <button class="action-btn" @click="$router.push('/app/specialist/pharmacy/drugs')">
                <div class="action-icon emerald">
                  <v-icon name="ri-capsule-line" scale="1.1" />
                </div>
                <span>Drug Catalog</span>
              </button>
              <button class="action-btn" @click="$router.push('/app/specialist/specialist-account')">
                <div class="action-icon amber">
                  <v-icon name="bi-wallet2" scale="1.1" />
                </div>
                <span>Wallet</span>
              </button>
            </div>
          </div>

          <!-- Wallet Summary Card -->
          <div class="bento-card wallet-card">
            <div class="card-header">
              <h3>Wallet Balance</h3>
              <router-link to="/app/specialist/specialist-account" class="view-all">
                View Details
                <v-icon name="hi-arrow-right" scale="0.75" />
              </router-link>
            </div>
            <div class="wallet-content">
              <div class="wallet-balance">
                <span class="currency">NGN</span>
                <span class="amount">{{ formatCurrency(stats.wallet_balance || 0) }}</span>
              </div>
              <div class="wallet-meta">
                <div class="wallet-stat">
                  <span class="wallet-stat-value">{{ stats.pending_payment || 0 }}</span>
                  <span class="wallet-stat-label">Pending Payments</span>
                </div>
                <div class="wallet-stat">
                  <span class="wallet-stat-value">{{ stats.pending_dispensing || 0 }}</span>
                  <span class="wallet-stat-label">To Dispense</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Recent Prescriptions Card -->
          <div class="bento-card prescriptions-card">
            <div class="card-header">
              <h3>Recent Prescriptions</h3>
              <router-link to="/app/specialist/pharmacy/prescriptions" class="view-all">
                View All
                <v-icon name="hi-arrow-right" scale="0.75" />
              </router-link>
            </div>

            <!-- Prescription Items -->
            <div v-if="stats.recent_prescriptions?.length" class="prescriptions-list">
              <div
                v-for="prescription in stats.recent_prescriptions.slice(0, 5)"
                :key="prescription._id"
                class="prescription-item"
                @click="viewPrescription(prescription._id)"
              >
                <div class="prescription-item__left">
                  <div class="specialist-avatar-wrapper">
                    <img
                      v-if="prescription.specialist_avatar"
                      :src="prescription.specialist_avatar"
                      :alt="prescription.specialist_name"
                      class="specialist-avatar"
                    />
                    <div v-else class="specialist-avatar specialist-avatar--placeholder" :class="getStatusClass(prescription.status)">
                      <v-icon :name="getStatusIcon(prescription.status)" scale="1" />
                    </div>
                  </div>

                  <div class="prescription-info">
                    <div class="prescription-header">
                      <span class="prescription-number">{{ prescription.prescription_number || 'RX-' + prescription._id?.slice(-6) }}</span>
                      <span :class="['status-badge', getStatusBadgeClass(prescription.status)]">
                        {{ formatStatus(prescription.status) }}
                      </span>
                    </div>
                    <p class="patient-name">{{ prescription.patient_name || 'Unknown Patient' }}</p>
                    <p class="specialist-name" v-if="prescription.specialist_name">
                      <v-icon name="hi-user" scale="0.55" />
                      Dr. {{ prescription.specialist_name }}
                    </p>
                    <div class="medication-tags" v-if="prescription.items?.length">
                      <span
                        v-for="(item, index) in prescription.items?.slice(0, 2)"
                        :key="index"
                        class="med-tag"
                      >
                        {{ item.drug_name }}
                      </span>
                      <span v-if="prescription.items?.length > 2" class="med-tag med-tag--more">
                        +{{ prescription.items.length - 2 }}
                      </span>
                    </div>
                  </div>
                </div>

                <div class="prescription-item__right">
                  <span class="prescription-date">{{ formatDate(prescription.created_at) }}</span>
                  <div class="prescription-amount" v-if="prescription.total_amount">
                    <span class="currency">NGN</span>
                    <span class="amount">{{ formatCurrency(prescription.total_amount) }}</span>
                  </div>
                  <v-icon name="hi-chevron-right" scale="0.9" class="chevron" />
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div v-else class="empty-state">
              <div class="empty-icon">
                <v-icon name="ri-capsule-line" scale="2" />
              </div>
              <h3>No prescriptions yet</h3>
              <p>Create your first prescription to get started</p>
              <button class="empty-action" @click="createPrescription">
                <v-icon name="hi-plus" scale="0.9" />
                Create Prescription
              </button>
            </div>
          </div>
        </section>
      </template>
    </div>

    <!-- Mobile FAB -->
    <button class="fab" @click="createPrescription">
      <v-icon name="hi-plus" scale="1.2" />
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toast-notification';
import apiFactory from '@/services/apiFactory';
import { usePharmacy } from './composables/usePharmacy';
import moment from 'moment';

const router = useRouter();
const $toast = useToast();
const { formatCurrency } = usePharmacy();

const isLoading = ref(true);
const stats = ref({
  prescriptions_today: 0,
  prescriptions_this_week: 0,
  prescriptions_this_month: 0,
  pending_payment: 0,
  pending_dispensing: 0,
  total_prescriptions: 0,
  total_patients: 0,
  wallet_balance: 0,
  recent_prescriptions: [],
});

function formatDate(date) {
  if (!date) return '';
  return moment(date).format('MMM D, YYYY');
}

function formatStatus(status) {
  const statusMap = {
    PENDING_PAYMENT: 'Pending',
    PENDING: 'Pending',
    PAID: 'Paid',
    CONFIRMED: 'Confirmed',
    PROCESSING: 'Processing',
    READY_FOR_PICKUP: 'Ready',
    OUT_FOR_DELIVERY: 'Delivering',
    DISPENSED: 'Dispensed',
    DELIVERED: 'Delivered',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
  };
  return statusMap[status] || status;
}

function getStatusClass(status) {
  const classMap = {
    PENDING_PAYMENT: 'status--warning',
    PENDING: 'status--warning',
    PAID: 'status--info',
    CONFIRMED: 'status--info',
    PROCESSING: 'status--info',
    READY_FOR_PICKUP: 'status--info',
    OUT_FOR_DELIVERY: 'status--info',
    DISPENSED: 'status--success',
    DELIVERED: 'status--success',
    COMPLETED: 'status--success',
    CANCELLED: 'status--error',
  };
  return classMap[status] || 'status--default';
}

function getStatusBadgeClass(status) {
  return getStatusClass(status);
}

function getStatusIcon(status) {
  const iconMap = {
    PENDING_PAYMENT: 'hi-clock',
    PENDING: 'hi-clock',
    PAID: 'hi-check',
    CONFIRMED: 'hi-check',
    PROCESSING: 'hi-cog',
    READY_FOR_PICKUP: 'hi-cube',
    OUT_FOR_DELIVERY: 'hi-truck',
    DISPENSED: 'hi-check-circle',
    DELIVERED: 'hi-check-circle',
    COMPLETED: 'hi-check-circle',
    CANCELLED: 'hi-x-circle',
  };
  return iconMap[status] || 'ri-capsule-line';
}

function createPrescription() {
  router.push('/app/specialist/pharmacy/prescriptions/create');
}

function viewPrescription(id) {
  router.push(`/app/specialist/pharmacy/prescriptions/${id}`);
}

async function fetchDashboardData() {
  try {
    isLoading.value = true;
    const response = await apiFactory.$_getSpecialistPharmacyDashboard();
    const data = response.data?.data || response.data?.result;
    if (data) {
      stats.value = {
        ...stats.value,
        ...data,
      };
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    $toast.error('Failed to load dashboard data');
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  fetchDashboardData();
});
</script>

<style scoped lang="scss">
// Design Tokens
$sky: #4FC3F7;
$sky-light: #E1F5FE;
$sky-dark: #0288D1;
$sky-darker: #01579B;
$navy: #0F172A;
$slate: #334155;
$gray: #64748B;
$light-gray: #94A3B8;
$bg: #F8FAFC;
$emerald: #10B981;
$emerald-light: #D1FAE5;
$amber: #F59E0B;
$amber-light: #FEF3C7;
$rose: #F43F5E;
$rose-light: #FFE4E6;
$violet: #8B5CF6;
$violet-light: #EDE9FE;

@mixin glass-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);
}

// Page Container
.pharmacy-page {
  width: 100%;
  min-height: 100vh;
  background: $bg;
}

// Mobile Header
.mobile-header {
  display: none;
  position: sticky;
  top: 0;
  z-index: 100;
  padding: 12px 16px;
  background: white;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #F1F5F9;

  @media (max-width: 768px) {
    display: flex;
  }

  .menu-btn, .action-btn {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    border: none;
    background: $bg;
    color: $slate;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;

    &:active {
      background: #E2E8F0;
    }
  }

  .header-logo {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 600;
    color: $navy;

    svg {
      color: $sky-dark;
    }
  }
}

// Page Content
.page-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px 32px 100px;

  @media (max-width: 768px) {
    padding: 16px 16px 120px;
  }
}

// Loading State
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 16px;

  .loading-spinner {
    position: relative;
    width: 64px;
    height: 64px;

    .spinner-ring {
      position: absolute;
      inset: 0;
      border: 3px solid $sky-light;
      border-top-color: $sky;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .spinner-icon {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: $sky;
    }
  }

  p {
    color: $gray;
    font-size: 14px;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

// ============================================
// HERO SECTION
// ============================================
.hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  padding: 48px 40px 56px;
  background: linear-gradient(135deg, $sky 0%, $sky-dark 50%, $sky-darker 100%);
  border-radius: 28px;
  position: relative;
  overflow: visible;
  min-height: 460px;
  margin-bottom: 24px;
  box-shadow:
    0 20px 60px rgba(2, 136, 209, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;

  @media (max-width: 768px) {
    display: flex;
    flex-direction: column;
    padding: 28px 20px 24px;
    gap: 0;
    text-align: center;
    min-height: unset;
    height: auto;
    border-radius: 20px;
    margin-bottom: 16px;
    overflow: visible;
  }

  @media (max-width: 480px) {
    padding: 24px 16px 20px;
    border-radius: 16px;
  }
}

.hero__content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  z-index: 2;

  @media (max-width: 768px) {
    width: 100%;
    align-items: center;
  }
}

.hero__badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  width: fit-content;
  margin-bottom: 20px;
  position: relative;

  @media (max-width: 768px) {
    margin: 0 auto 16px;
    padding: 8px 16px;
  }

  @media (max-width: 480px) {
    padding: 6px 14px;
    margin: 0 auto 12px;
  }

  .badge-pulse {
    position: absolute;
    left: 12px;
    width: 8px;
    height: 8px;
    background: $emerald;
    border-radius: 50%;
    animation: pulse 2s ease-in-out infinite;

    &::after {
      content: '';
      position: absolute;
      inset: -4px;
      background: rgba($emerald, 0.4);
      border-radius: 50%;
      animation: pulse-ring 2s ease-out infinite;
    }

    @media (max-width: 768px) {
      left: 10px;
      width: 6px;
      height: 6px;
    }
  }

  svg {
    width: 16px;
    height: 16px;
    color: white;
    margin-left: 12px;

    @media (max-width: 768px) {
      width: 14px;
      height: 14px;
      margin-left: 10px;
    }
  }

  span {
    font-size: 13px;
    font-weight: 600;
    color: white;
    letter-spacing: 0.3px;

    @media (max-width: 768px) {
      font-size: 12px;
    }
  }
}

.hero__title {
  font-size: 48px;
  font-weight: 800;
  color: white;
  line-height: 1.1;
  margin: 0 0 16px;
  letter-spacing: -1px;

  @media (max-width: 768px) {
    font-size: 32px;
    margin: 0 0 12px;
    letter-spacing: -0.5px;

    br { display: none; }
  }

  @media (max-width: 480px) {
    font-size: 28px;
    margin: 0 0 8px;
  }

  .hero__title-accent {
    background: linear-gradient(90deg, #fff 0%, rgba(255,255,255,0.7) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;

    @media (max-width: 768px) {
      display: inline;
      margin-left: 6px;
    }
  }
}

.hero__subtitle {
  font-size: 18px;
  color: white;
  line-height: 1.6;
  margin: 0 0 24px;
  max-width: 400px;
  opacity: 0.95;

  @media (max-width: 768px) {
    font-size: 15px;
    max-width: 100%;
    margin: 0 0 20px;
    opacity: 0.9;
    line-height: 1.5;
  }

  @media (max-width: 480px) {
    font-size: 14px;
    margin: 0 0 16px;
  }
}

.hero__stats {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  width: fit-content;

  @media (max-width: 768px) {
    width: 100%;
    justify-content: space-around;
    padding: 16px;
    gap: 8px;
    border-radius: 14px;
  }

  @media (max-width: 480px) {
    padding: 14px 12px;
    gap: 4px;
    border-radius: 12px;
  }
}

.hero__visual {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;

  @media (max-width: 768px) {
    display: none;
  }
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: none;
  border-radius: 12px;
  padding: 10px 16px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  margin-bottom: 20px;
  width: fit-content;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.25);
  }
}

.desktop-only {
  @media (max-width: 768px) {
    display: none !important;
  }
}

.hero-stat {
  text-align: center;
  flex: 1;

  @media (max-width: 768px) {
    padding: 0 4px;
  }

  &__value {
    display: block;
    font-size: 24px;
    font-weight: 700;
    color: white;
    line-height: 1;

    @media (max-width: 768px) {
      font-size: 22px;
    }

    @media (max-width: 480px) {
      font-size: 20px;
    }

    &--warning { color: $amber-light; }
    &--success { color: $emerald-light; }
  }

  &__label {
    display: block;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.7);
    margin-top: 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;

    @media (max-width: 768px) {
      font-size: 11px;
      letter-spacing: 0.3px;
    }

    @media (max-width: 480px) {
      font-size: 10px;
    }
  }

  &__divider {
    width: 1px;
    height: 32px;
    background: rgba(255, 255, 255, 0.2);
    flex-shrink: 0;

    @media (max-width: 768px) {
      height: 28px;
    }
  }
}

// Orb Animation
.pharmacy-orb {
  position: relative;
  width: 200px;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.orb-ring {
  position: absolute;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.2);

  &--1 {
    width: 100%;
    height: 100%;
    animation: spin-slow 20s linear infinite;
  }

  &--2 {
    width: 80%;
    height: 80%;
    animation: spin-slow 15s linear infinite reverse;
  }

  &--3 {
    width: 60%;
    height: 60%;
    animation: spin-slow 10s linear infinite;
  }
}

.orb-core {
  width: 100px;
  height: 100px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(20px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 0 40px rgba(255, 255, 255, 0.3),
    0 0 80px rgba(79, 195, 247, 0.3);
  animation: pulse-glow 3s ease-in-out infinite;

  svg {
    width: 48px;
    height: 48px;
    color: white;
  }
}

.floating-icons {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.float-icon {
  position: absolute;
  width: 44px;
  height: 44px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: float 3s ease-in-out infinite;

  svg {
    width: 20px;
    height: 20px;
    color: white;
  }

  &--1 { top: 10%; right: 10%; animation-delay: 0s; }
  &--2 { bottom: 20%; right: 5%; animation-delay: 1s; }
  &--3 { bottom: 10%; left: 10%; animation-delay: 2s; }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
}

@keyframes pulse-ring {
  0% { transform: scale(1); opacity: 0.8; }
  100% { transform: scale(2.5); opacity: 0; }
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 40px rgba(255, 255, 255, 0.3), 0 0 80px rgba(79, 195, 247, 0.3); }
  50% { box-shadow: 0 0 60px rgba(255, 255, 255, 0.4), 0 0 100px rgba(79, 195, 247, 0.4); }
}

@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

// ============================================
// BENTO GRID
// ============================================
.bento-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;

  @media (max-width: 768px) {
    gap: 16px;
  }
}

.bento-card {
  @include glass-card;
  border-radius: 20px;
  padding: 20px;

  @media (max-width: 768px) {
    padding: 16px;
    border-radius: 16px;
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;

    @media (max-width: 768px) {
      margin-bottom: 12px;
    }

    h3 {
      font-size: 15px;
      font-weight: 600;
      color: $navy;
      margin: 0;
    }

    .view-all {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      color: $sky-dark;
      text-decoration: none;
      font-weight: 500;

      &:hover { color: $sky-darker; }
    }
  }
}

// Actions Card
.actions-card {
  .actions-row {
    display: flex;
    gap: 12px;

    @media (max-width: 768px) {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }

    @media (max-width: 400px) {
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }
  }

  .action-btn {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 20px 16px;
    background: $bg;
    border: 1px solid #E2E8F0;
    border-radius: 14px;
    cursor: pointer;
    transition: all 0.2s;

    @media (max-width: 768px) {
      padding: 16px 12px;
      gap: 8px;
      border-radius: 12px;
    }

    @media (max-width: 400px) {
      padding: 14px 10px;
    }

    &:hover {
      background: white;
      border-color: $sky;
      box-shadow: 0 4px 12px rgba($sky, 0.15);
      transform: translateY(-2px);
    }

    span {
      font-size: 13px;
      font-weight: 500;
      color: $slate;
    }
  }

  .action-icon {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;

    @media (max-width: 768px) {
      width: 44px;
      height: 44px;
      border-radius: 12px;
    }

    @media (max-width: 400px) {
      width: 40px;
      height: 40px;
    }

    &.sky { background: $sky-light; color: $sky-dark; }
    &.emerald { background: $emerald-light; color: $emerald; }
    &.violet { background: $violet-light; color: $violet; }
    &.amber { background: $amber-light; color: $amber; }
  }

  span {
    @media (max-width: 768px) {
      font-size: 12px;
    }

    @media (max-width: 400px) {
      font-size: 11px;
    }
  }
}

// Wallet Card
.wallet-card {
  .wallet-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;

    @media (max-width: 768px) {
      flex-direction: column;
      align-items: flex-start;
      gap: 16px;
    }
  }

  .wallet-balance {
    display: flex;
    align-items: baseline;
    gap: 8px;

    .currency {
      font-size: 14px;
      color: $gray;
      font-weight: 500;
    }

    .amount {
      font-size: 32px;
      font-weight: 700;
      color: $navy;

      @media (max-width: 768px) {
        font-size: 28px;
      }
    }
  }

  .wallet-meta {
    display: flex;
    gap: 24px;

    @media (max-width: 768px) {
      gap: 16px;
    }
  }

  .wallet-stat {
    text-align: center;

    .wallet-stat-value {
      display: block;
      font-size: 20px;
      font-weight: 700;
      color: $navy;
    }

    .wallet-stat-label {
      font-size: 12px;
      color: $gray;
    }
  }
}

// Prescriptions Card
.prescriptions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.prescription-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: $bg;
  border-radius: 14px;
  border: 1px solid #E2E8F0;
  cursor: pointer;
  transition: all 0.2s;

  @media (max-width: 768px) {
    padding: 14px;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  &:hover {
    background: white;
    border-color: $sky-light;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
    transform: translateX(4px);
  }

  &__left {
    display: flex;
    align-items: center;
    gap: 14px;
    flex: 1;
    min-width: 0;

    @media (max-width: 768px) { width: 100%; }
  }

  &__right {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-shrink: 0;

    @media (max-width: 768px) {
      width: 100%;
      justify-content: space-between;
      padding-top: 12px;
      border-top: 1px solid #E2E8F0;
    }

    .chevron {
      color: $light-gray;
      @media (max-width: 768px) { display: none; }
    }
  }
}

.specialist-avatar-wrapper {
  position: relative;
  flex-shrink: 0;
}

.specialist-avatar {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  object-fit: cover;

  &--placeholder {
    display: flex;
    align-items: center;
    justify-content: center;

    &.status--warning { background: $amber-light; color: $amber; }
    &.status--info { background: $sky-light; color: $sky-dark; }
    &.status--success { background: $emerald-light; color: $emerald; }
    &.status--error { background: $rose-light; color: $rose; }
    &.status--default { background: #F1F5F9; color: $slate; }
  }
}

.prescription-avatar {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &.status--warning { background: $amber-light; color: $amber; }
  &.status--info { background: $sky-light; color: $sky-dark; }
  &.status--success { background: $emerald-light; color: $emerald; }
  &.status--error { background: $rose-light; color: $rose; }
  &.status--default { background: #F1F5F9; color: $slate; }
}

.prescription-info {
  flex: 1;
  min-width: 0;

  .prescription-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 4px;
    flex-wrap: wrap;
  }

  .prescription-number {
    font-size: 15px;
    font-weight: 600;
    color: $navy;
  }

  .patient-name {
    font-size: 13px;
    color: $navy;
    font-weight: 500;
    margin: 0 0 4px;
  }

  .specialist-name {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: $sky-dark;
    margin: 0 0 6px;

    svg {
      color: $sky;
    }
  }
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;

  &.status--success { background: $emerald-light; color: $emerald; }
  &.status--warning { background: $amber-light; color: $amber; }
  &.status--info { background: $sky-light; color: $sky-dark; }
  &.status--error { background: $rose-light; color: $rose; }
  &.status--default { background: #F1F5F9; color: $slate; }
}

.medication-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;

  .med-tag {
    font-size: 11px;
    padding: 4px 10px;
    background: white;
    border: 1px solid #E2E8F0;
    border-radius: 8px;
    color: $slate;

    &--more {
      background: $sky-light;
      border-color: $sky-light;
      color: $sky-dark;
      font-weight: 500;
    }
  }
}

.prescription-date {
  font-size: 13px;
  color: $gray;
}

.prescription-amount {
  display: flex;
  align-items: baseline;
  gap: 4px;

  .currency {
    font-size: 12px;
    color: $gray;
  }

  .amount {
    font-size: 16px;
    font-weight: 700;
    color: $navy;
  }
}

// Empty State
.empty-state {
  text-align: center;
  padding: 48px 24px;

  .empty-icon {
    width: 80px;
    height: 80px;
    background: $sky-light;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 20px;
    color: $sky;
  }

  h3 {
    font-size: 18px;
    font-weight: 600;
    color: $navy;
    margin: 0 0 8px;
  }

  p {
    font-size: 14px;
    color: $gray;
    margin: 0 0 20px;
  }

  .empty-action {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    background: linear-gradient(135deg, $sky, $sky-dark);
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba($sky, 0.3);
    }
  }
}

// Mobile FAB
.fab {
  display: none;
  position: fixed;
  bottom: 90px;
  right: 20px;
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, $sky, $sky-dark);
  color: white;
  border: none;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba($sky, 0.4);
  cursor: pointer;
  z-index: 50;
  transition: all 0.2s;

  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &:active {
    transform: scale(0.95);
  }
}
</style>
