<template>
  <div class="page-content">
    <TopBar showButtons type="title-only" title="Pharmacy" @open-side-nav="$emit('openSideNav')" />
    <div class="page-content__body">
      <div class="pharmacy-container">
        <!-- Shimmer Loading -->
        <template v-if="isLoading">
          <div class="skeleton-hero" />
          <div class="skeleton-card skeleton-card--wallet" />
          <div class="skeleton-card skeleton-card--lg" />
          <div class="skeleton-card" />
        </template>

        <template v-else>
          <!-- Hero Section -->
          <div class="hero-section">
            <div class="hero-content">
              <div class="hero-text">
                <span class="hero-badge">
                  <v-icon name="ri-capsule-line" scale="0.8" />
                  Pharmacy
                </span>
                <h1 class="hero-title">Pharmacy Dashboard</h1>
                <p class="hero-subtitle">Manage prescriptions, patients, and drug inventory</p>
              </div>
              <div class="hero-stats">
                <div class="hero-stat">
                  <span class="hero-stat__value">{{ stats.prescriptions_today || 0 }}</span>
                  <span class="hero-stat__label">Today</span>
                </div>
                <div class="hero-stat">
                  <span class="hero-stat__value">{{ stats.prescriptions_this_week || 0 }}</span>
                  <span class="hero-stat__label">This Week</span>
                </div>
                <div class="hero-stat">
                  <span class="hero-stat__value">{{ stats.total_patients || 0 }}</span>
                  <span class="hero-stat__label">Patients</span>
                </div>
              </div>
            </div>
            <div class="hero-actions">
              <button class="hero-action-btn" @click="createPrescription">
                <v-icon name="hi-plus" scale="0.85" />
                New Prescription
              </button>
            </div>
          </div>

          <!-- Wallet Balance -->
          <div class="wallet-card">
            <div class="wallet-card__left">
              <div class="wallet-card__icon">
                <v-icon name="hi-credit-card" scale="1.2" />
              </div>
              <div class="wallet-card__info">
                <span class="wallet-card__title">Pharmacy Wallet</span>
                <span class="wallet-card__note">Available for prescription payments</span>
              </div>
            </div>
            <div class="wallet-card__right">
              <div class="wallet-card__balance">
                <span class="currency">NGN</span>
                <span class="amount">{{ formatCurrency(stats.wallet_balance || 0) }}</span>
              </div>
              <router-link to="/app/specialist/specialist-account" class="wallet-link">
                View Details
                <v-icon name="hi-chevron-right" scale="0.7" />
              </router-link>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="section-card">
            <div class="section-title">
              <v-icon name="hi-lightning-bolt" scale="0.9" />
              <h2>Quick Actions</h2>
            </div>
            <div class="actions-grid">
              <router-link to="/app/specialist/pharmacy/patients" class="action-link">
                <div class="action-link__icon action-link__icon--teal">
                  <v-icon name="hi-user-group" scale="1.2" />
                </div>
                <div class="action-link__text">
                  <h3>Search Patients</h3>
                  <p>Find and manage patient prescriptions</p>
                </div>
                <v-icon name="hi-chevron-right" scale="0.8" class="action-link__arrow" />
              </router-link>
              <router-link to="/app/specialist/pharmacy/drugs" class="action-link">
                <div class="action-link__icon action-link__icon--blue">
                  <v-icon name="ri-capsule-line" scale="1.2" />
                </div>
                <div class="action-link__text">
                  <h3>Drug Catalog</h3>
                  <p>Browse available medications</p>
                </div>
                <v-icon name="hi-chevron-right" scale="0.8" class="action-link__arrow" />
              </router-link>
              <router-link to="/app/specialist/pharmacy/prescriptions" class="action-link">
                <div class="action-link__icon action-link__icon--purple">
                  <v-icon name="hi-clipboard-list" scale="1.2" />
                </div>
                <div class="action-link__text">
                  <h3>Prescriptions</h3>
                  <p>View all prescription history</p>
                </div>
                <v-icon name="hi-chevron-right" scale="0.8" class="action-link__arrow" />
              </router-link>
              <router-link to="/app/specialist/pharmacy/prescriptions/create" class="action-link">
                <div class="action-link__icon action-link__icon--green">
                  <v-icon name="hi-plus" scale="1.2" />
                </div>
                <div class="action-link__text">
                  <h3>New Prescription</h3>
                  <p>Create a new prescription</p>
                </div>
                <v-icon name="hi-chevron-right" scale="0.8" class="action-link__arrow" />
              </router-link>
            </div>
          </div>

          <!-- Recent Prescriptions -->
          <div class="section-card">
            <div class="section-header">
              <div class="section-title">
                <v-icon name="ri-capsule-line" scale="0.9" />
                <h2>Recent Prescriptions</h2>
              </div>
              <router-link to="/app/specialist/pharmacy/prescriptions" class="view-all-link">
                View All
                <v-icon name="hi-chevron-right" scale="0.7" />
              </router-link>
            </div>

            <div v-if="stats.recent_prescriptions?.length" class="prescriptions-list">
              <div
                v-for="prescription in stats.recent_prescriptions"
                :key="prescription._id"
                class="prescription-item"
                @click="viewPrescription(prescription._id)"
              >
                <div class="prescription-item__left">
                  <RcAvatar
                    :model-value="prescription.patient_avatar"
                    :first-name="getFirstName(prescription.patient_name)"
                    :last-name="getLastName(prescription.patient_name)"
                    size="sm"
                  />
                  <div class="prescription-item__info">
                    <p class="patient-name">{{ prescription.patient_name || 'Unknown Patient' }}</p>
                    <p v-if="prescription.prescription_number" class="prescription-number">
                      {{ prescription.prescription_number }}
                    </p>
                    <p class="prescription-date">{{ formatDateTime(prescription.created_at) }}</p>
                  </div>
                </div>
                <div class="prescription-item__right">
                  <PharmacyStatusBadge :status="prescription.status" />
                  <p class="amount">NGN {{ formatCurrency(prescription.total_amount) }}</p>
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div v-else class="empty-section">
              <div class="empty-section__icon">
                <v-icon name="ri-capsule-line" scale="1.8" />
              </div>
              <h3>No recent prescriptions</h3>
              <p>Create your first prescription to get started</p>
              <button class="empty-section__action" @click="createPrescription">
                <v-icon name="hi-plus" scale="0.8" />
                Create Prescription
              </button>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toast-notification';
import TopBar from '@/components/Navigation/top-bar';
import RcAvatar from '@/components/RCAvatar';
import apiFactory from '@/services/apiFactory';
import PharmacyStatusBadge from './components/PharmacyStatusBadge.vue';
import { usePharmacy } from './composables/usePharmacy';

const router = useRouter();
const $toast = useToast();
const { formatCurrency, formatDateTime } = usePharmacy();

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

function getFirstName(name) {
  if (!name) return '';
  return name.split(' ')[0] || '';
}

function getLastName(name) {
  if (!name) return '';
  const parts = name.split(' ');
  return parts.length > 1 ? parts[parts.length - 1] : '';
}

function createPrescription() {
  router.push('/app/specialist/pharmacy/prescriptions/create');
}

function viewPrescription(id) {
  router.push(`/app/specialist/pharmacy/prescriptions/${id}`);
}

async function fetchDashboardStats() {
  try {
    isLoading.value = true;
    const response = await apiFactory.$_getSpecialistPharmacyDashboard();
    const result = response.data?.data || response.data?.result;
    if (result) {
      stats.value = result;
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    $toast.error('Failed to load dashboard data');
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  fetchDashboardStats();
});
</script>

<style scoped lang="scss">
.page-content {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  padding: 0 128px;

  @include responsive(tab-portrait) {
    padding: 0;
  }

  @include responsive(phone) {
    padding: 0;
  }

  &__body {
    width: 100%;
    padding: $size-24 $size-32;
    overflow-y: auto;

    @include responsive(phone) {
      padding: $size-16;
    }

    &::-webkit-scrollbar {
      display: none;
    }
  }
}

.pharmacy-container {
  width: 100%;
  max-width: 800px;
  display: flex;
  flex-direction: column;
  gap: $size-24;
  padding-bottom: $size-32;
}

// Hero Section
.hero-section {
  background: linear-gradient(135deg, #0EAEC4 0%, #0891b2 50%, #0e7490 100%);
  border-radius: $size-20;
  padding: $size-28 $size-32;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  position: relative;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(14, 174, 196, 0.25);
  color: white;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -10%;
    width: 350px;
    height: 350px;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.08) 0%, transparent 70%);
    pointer-events: none;
  }

  @include responsive(tab-portrait) {
    flex-direction: column;
    gap: $size-20;
    padding: $size-24;
    border-radius: $size-16;
  }

  @include responsive(phone) {
    padding: $size-20 $size-16;
    border-radius: $size-12;
  }

  .hero-content {
    z-index: 1;
  }

  .hero-text {
    margin-bottom: $size-20;

    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: $size-6;
      background: rgba(255, 255, 255, 0.2);
      padding: $size-4 $size-12;
      border-radius: $size-16;
      font-size: $size-12;
      font-weight: $fw-medium;
      margin-bottom: $size-12;
    }

    .hero-title {
      font-size: $size-22;
      font-weight: $fw-bold;
      margin-bottom: $size-4;
      line-height: 1.3;

      @include responsive(phone) {
        font-size: $size-20;
      }
    }

    .hero-subtitle {
      font-size: $size-14;
      opacity: 0.85;
      font-weight: $fw-regular;
    }
  }

  .hero-stats {
    display: flex;
    gap: $size-20;

    @include responsive(phone) {
      gap: $size-16;
    }

    .hero-stat {
      display: flex;
      flex-direction: column;
      align-items: center;
      background: rgba(255, 255, 255, 0.15);
      padding: $size-12 $size-16;
      border-radius: $size-12;
      min-width: 72px;

      &__value {
        font-size: $size-22;
        font-weight: $fw-bold;
        line-height: 1.2;
      }

      &__label {
        font-size: $size-11;
        opacity: 0.85;
        font-weight: $fw-medium;
        margin-top: $size-2;
      }
    }
  }

  .hero-actions {
    z-index: 1;
    flex-shrink: 0;

    .hero-action-btn {
      display: flex;
      align-items: center;
      gap: $size-8;
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: $size-10;
      padding: $size-10 $size-20;
      font-size: $size-14;
      font-weight: $fw-semi-bold;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;

      &:hover {
        background: rgba(255, 255, 255, 0.3);
      }
    }
  }
}

// Wallet Card
.wallet-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  border-radius: $size-16;
  padding: $size-24;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border-left: 4px solid #0EAEC4;

  @include responsive(phone) {
    flex-direction: column;
    align-items: flex-start;
    gap: $size-16;
  }

  &__left {
    display: flex;
    align-items: center;
    gap: $size-14;
  }

  &__icon {
    width: 48px;
    height: 48px;
    border-radius: $size-12;
    background: rgba(14, 174, 196, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #0EAEC4;
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: $size-2;
  }

  &__title {
    font-size: $size-15;
    font-weight: $fw-semi-bold;
    color: $color-g-21;
  }

  &__note {
    font-size: $size-12;
    color: $color-g-54;
  }

  &__right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: $size-6;

    @include responsive(phone) {
      align-items: flex-start;
    }
  }

  &__balance {
    display: flex;
    align-items: baseline;
    gap: $size-4;

    .currency {
      font-size: $size-14;
      font-weight: $fw-medium;
      color: $color-g-54;
    }

    .amount {
      font-size: $size-28;
      font-weight: $fw-bold;
      color: $color-g-21;
    }
  }
}

.wallet-link {
  display: flex;
  align-items: center;
  gap: $size-4;
  font-size: $size-13;
  color: #0EAEC4;
  text-decoration: none;
  font-weight: $fw-medium;

  &:hover {
    text-decoration: underline;
  }
}

// Section Card
.section-card {
  background: white;
  border-radius: $size-16;
  padding: $size-24;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $size-20;
}

.section-title {
  display: flex;
  align-items: center;
  gap: $size-8;
  margin-bottom: $size-20;

  svg {
    color: #0EAEC4;
  }

  h2 {
    font-size: $size-16;
    font-weight: $fw-semi-bold;
    color: $color-g-21;
    margin: 0;
  }

  .section-header & {
    margin-bottom: 0;
  }
}

.view-all-link {
  display: flex;
  align-items: center;
  gap: $size-4;
  font-size: $size-13;
  color: #0EAEC4;
  text-decoration: none;
  font-weight: $fw-medium;

  &:hover {
    text-decoration: underline;
  }
}

// Actions Grid
.actions-grid {
  display: flex;
  flex-direction: column;
  gap: $size-10;
}

.action-link {
  display: flex;
  align-items: center;
  gap: $size-14;
  padding: $size-14 $size-16;
  border-radius: $size-12;
  text-decoration: none;
  transition: all 0.2s ease;
  background: $color-g-97;

  &:hover {
    background: rgba(14, 174, 196, 0.06);

    .action-link__arrow {
      color: #0EAEC4;
      transform: translateX(2px);
    }
  }

  &__icon {
    width: 40px;
    height: 40px;
    border-radius: $size-10;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &--teal { background: rgba(14, 174, 196, 0.1); color: #0EAEC4; }
    &--blue { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
    &--purple { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
    &--green { background: rgba(16, 185, 129, 0.1); color: #10b981; }
  }

  &__text {
    flex: 1;

    h3 {
      font-size: $size-14;
      font-weight: $fw-semi-bold;
      color: $color-g-21;
      margin-bottom: $size-2;
    }

    p {
      font-size: $size-12;
      color: $color-g-54;
    }
  }

  &__arrow {
    color: $color-g-67;
    transition: all 0.2s ease;
  }
}

// Prescriptions List
.prescriptions-list {
  display: flex;
  flex-direction: column;
  gap: $size-8;
}

.prescription-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $size-14 $size-16;
  border-radius: $size-12;
  cursor: pointer;
  transition: all 0.2s ease;
  background: $color-g-97;
  border-left: 3px solid #0EAEC4;

  &:hover {
    background: rgba(14, 174, 196, 0.06);
  }

  &__left {
    display: flex;
    align-items: center;
    gap: $size-12;
    flex: 1;
    min-width: 0;
  }

  &__info {
    min-width: 0;

    .patient-name {
      font-size: $size-14;
      font-weight: $fw-semi-bold;
      color: $color-g-21;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .prescription-number {
      font-size: $size-11;
      color: #0EAEC4;
      font-weight: $fw-medium;
      margin-top: $size-2;
    }

    .prescription-date {
      font-size: $size-12;
      color: $color-g-54;
      margin-top: $size-2;
    }
  }

  &__right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: $size-6;
    flex-shrink: 0;

    .amount {
      font-size: $size-14;
      font-weight: $fw-semi-bold;
      color: $color-g-21;
    }
  }
}

// Empty Section
.empty-section {
  text-align: center;
  padding: $size-32 $size-20;
  background: $color-g-97;
  border-radius: $size-12;

  &__icon {
    width: 64px;
    height: 64px;
    margin: 0 auto $size-14;
    border-radius: 50%;
    background: rgba(14, 174, 196, 0.08);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #0EAEC4;
  }

  h3 {
    font-size: $size-15;
    font-weight: $fw-semi-bold;
    color: $color-g-21;
    margin-bottom: $size-6;
  }

  p {
    font-size: $size-13;
    color: $color-g-54;
    margin-bottom: $size-16;
  }

  &__action {
    display: inline-flex;
    align-items: center;
    gap: $size-6;
    background: rgba(14, 174, 196, 0.1);
    color: #0EAEC4;
    border: none;
    border-radius: $size-8;
    padding: $size-10 $size-18;
    font-size: $size-13;
    font-weight: $fw-semi-bold;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(14, 174, 196, 0.18);
    }
  }
}

// Skeleton Loading (Shimmer)
.skeleton-hero {
  border-radius: $size-20;
  background: linear-gradient(90deg, rgba(14, 174, 196, 0.15) 25%, rgba(14, 174, 196, 0.08) 50%, rgba(14, 174, 196, 0.15) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  height: 180px;
}

.skeleton-card {
  border-radius: $size-16;
  background: linear-gradient(90deg, $color-g-92 25%, $color-g-97 50%, $color-g-92 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  height: 160px;

  &--wallet { height: 100px; }
  &--lg { height: 240px; }
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
</style>
