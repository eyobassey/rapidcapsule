<template>
  <div class="pharmacy-prescriptions">
    <!-- Ambient Background -->
    <div class="ambient-bg">
      <div class="orb orb--1" />
      <div class="orb orb--2" />
      <div class="orb orb--3" />
    </div>

    <!-- Mobile Header -->
    <header class="mobile-header">
      <button class="menu-btn" @click="$emit('openSideNav')">
        <v-icon name="hi-menu-alt-2" scale="1.1" />
      </button>
      <h1 class="mobile-title">Prescriptions</h1>
      <button class="action-btn" @click="createPrescription">
        <v-icon name="hi-plus" scale="1" />
      </button>
    </header>

    <!-- Page Container -->
    <div class="page-container">
      <!-- Breadcrumbs -->
      <nav class="breadcrumbs">
        <router-link to="/app/specialist" class="breadcrumb-item">
          <v-icon name="hi-home" scale="0.7" />
          Home
        </router-link>
        <span class="breadcrumb-separator">/</span>
        <router-link to="/app/specialist/pharmacy" class="breadcrumb-item">
          Pharmacy
        </router-link>
        <span class="breadcrumb-separator">/</span>
        <span class="breadcrumb-current">Prescriptions</span>
      </nav>

      <!-- Hero Section -->
      <section class="hero">
        <div class="hero__content">
          <button class="back-link desktop-only" @click="$router.push('/app/specialist/pharmacy')">
            <v-icon name="hi-arrow-left" scale="0.8" />
            <span>Back to Pharmacy</span>
          </button>
          <div class="hero__badge">
            <div class="badge-pulse"></div>
            <v-icon name="hi-clipboard-list" />
            <span>Prescription Management</span>
          </div>
          <h1 class="hero__title">
            All<br/>
            <span class="hero__title-accent">Prescriptions</span>
          </h1>
          <p class="hero__subtitle">View, manage and track all your prescriptions</p>
          <div class="hero__stats">
            <div class="hero-stat">
              <span class="hero-stat__value">{{ stats.total || 0 }}</span>
              <span class="hero-stat__label">Total</span>
            </div>
            <div class="hero-stat">
              <span class="hero-stat__value">{{ stats.pending_payment || 0 }}</span>
              <span class="hero-stat__label">Pending</span>
            </div>
            <div class="hero-stat">
              <span class="hero-stat__value">{{ stats.delivered || 0 }}</span>
              <span class="hero-stat__label">Delivered</span>
            </div>
          </div>
        </div>
        <div class="hero__visual">
          <div class="prescriptions-orb">
            <div class="orb-glow"></div>
            <div class="orb-ring orb-ring--1"></div>
            <div class="orb-ring orb-ring--2"></div>
            <div class="orb-ring orb-ring--3"></div>
            <div class="orb-center">
              <v-icon name="ri-capsule-line" scale="2.5" />
            </div>
          </div>
          <div class="floating-icons">
            <div class="float-icon float-icon--1">
              <v-icon name="hi-document-text" scale="1" />
            </div>
            <div class="float-icon float-icon--2">
              <v-icon name="hi-check-circle" scale="0.9" />
            </div>
            <div class="float-icon float-icon--3">
              <v-icon name="hi-truck" scale="0.85" />
            </div>
          </div>
        </div>
      </section>

      <!-- Bento Grid: Actions & Search -->
      <section class="bento-grid bento-grid--controls">
        <!-- Create New Card -->
        <div class="bento-card bento-card--create" @click="createPrescription">
          <div class="create-card__icon">
            <v-icon name="hi-plus" scale="1.2" />
          </div>
          <div class="create-card__content">
            <h4>New Prescription</h4>
            <p>Create a prescription for a patient</p>
          </div>
          <v-icon name="hi-arrow-right" scale="0.9" class="create-card__arrow" />
        </div>

        <!-- Search Card -->
        <div class="bento-card bento-card--search">
          <div class="search-wrapper">
            <div class="search-icon">
              <v-icon name="hi-search" scale="0.9" />
            </div>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search prescriptions..."
              class="search-input"
              @input="handleSearch"
            />
            <button v-if="searchQuery" class="clear-btn" @click="clearSearch">
              <v-icon name="hi-x" scale="0.75" />
            </button>
          </div>
        </div>

        <!-- Quick Stats Row -->
        <div class="bento-card bento-card--mini-stats">
          <div class="mini-stat" :class="{ active: statusFilter === 'pending_payment' }" @click="setStatusFilter('pending_payment')">
            <div class="mini-stat__icon mini-stat__icon--warning">
              <v-icon name="hi-clock" scale="0.8" />
            </div>
            <div class="mini-stat__info">
              <span class="mini-stat__value">{{ stats.pending_payment || 0 }}</span>
              <span class="mini-stat__label">Pending</span>
            </div>
          </div>
          <div class="mini-stat" :class="{ active: statusFilter === 'paid' }" @click="setStatusFilter('paid')">
            <div class="mini-stat__icon mini-stat__icon--info">
              <v-icon name="hi-check" scale="0.8" />
            </div>
            <div class="mini-stat__info">
              <span class="mini-stat__value">{{ stats.paid || 0 }}</span>
              <span class="mini-stat__label">Paid</span>
            </div>
          </div>
          <div class="mini-stat" :class="{ active: statusFilter === 'shipped' }" @click="setStatusFilter('shipped')">
            <div class="mini-stat__icon mini-stat__icon--violet">
              <v-icon name="hi-truck" scale="0.8" />
            </div>
            <div class="mini-stat__info">
              <span class="mini-stat__value">{{ stats.shipped || 0 }}</span>
              <span class="mini-stat__label">Shipped</span>
            </div>
          </div>
          <div class="mini-stat" :class="{ active: statusFilter === 'delivered' }" @click="setStatusFilter('delivered')">
            <div class="mini-stat__icon mini-stat__icon--success">
              <v-icon name="hi-check-circle" scale="0.8" />
            </div>
            <div class="mini-stat__info">
              <span class="mini-stat__value">{{ stats.delivered || 0 }}</span>
              <span class="mini-stat__label">Delivered</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Filter Pills -->
      <div class="filter-pills">
        <button
          v-for="tab in statusTabs"
          :key="tab.value"
          :class="['filter-pill', { active: statusFilter === tab.value }]"
          @click="setStatusFilter(tab.value)"
        >
          {{ tab.label }}
          <span v-if="getTabCount(tab.value)" class="pill-count">{{ getTabCount(tab.value) }}</span>
        </button>
      </div>

      <!-- Results Header -->
      <div v-if="!isLoading && prescriptions.length" class="results-header">
        <p class="results-count">
          <v-icon name="ri-capsule-line" scale="0.8" />
          <span>Showing <strong>{{ prescriptions.length }}</strong> of <strong>{{ pagination.total }}</strong> prescriptions</span>
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="prescriptions-list">
        <div v-for="i in 5" :key="i" class="skeleton-item">
          <div class="skeleton-left">
            <div class="skeleton-avatar" />
            <div class="skeleton-info">
              <div class="skeleton-line skeleton-line--medium" />
              <div class="skeleton-line skeleton-line--short" />
            </div>
          </div>
          <div class="skeleton-right">
            <div class="skeleton-line skeleton-line--amount" />
          </div>
        </div>
      </div>

      <!-- Prescriptions List -->
      <div v-else-if="prescriptions.length" class="prescriptions-list">
        <div
          v-for="prescription in prescriptions"
          :key="prescription._id"
          class="prescription-item"
          @click="viewPrescription(prescription._id)"
        >
          <div class="prescription-item__left">
            <div class="prescription-avatar" :class="getStatusClass(prescription.status)">
              <v-icon :name="getStatusIcon(prescription.status)" scale="1" />
            </div>
            <div class="prescription-info">
              <div class="prescription-header">
                <span class="prescription-number">{{ prescription.prescription_number }}</span>
                <span :class="['status-badge', getStatusBadgeClass(prescription.status)]">
                  {{ formatStatusLabel(prescription.status) }}
                </span>
                <span
                  v-if="prescription.linked_appointments?.length || prescription.linked_clinical_notes?.length"
                  class="linked-badge"
                >
                  <v-icon name="hi-link" scale="0.55" />
                  Linked
                </span>
              </div>
              <p class="patient-name">{{ prescription.patient?.full_name || 'Unknown Patient' }}</p>
              <div class="medication-tags">
                <span
                  v-for="(item, index) in prescription.items?.slice(0, 2)"
                  :key="index"
                  class="medication-tag"
                >
                  {{ item.drug_name }}
                </span>
                <span v-if="prescription.items?.length > 2" class="more-tag">
                  +{{ prescription.items.length - 2 }}
                </span>
              </div>
            </div>
          </div>
          <div class="prescription-item__right">
            <span class="prescription-date">{{ formatDateTime(prescription.created_at) }}</span>
            <div class="prescription-amount">
              <span class="currency">NGN</span>
              <span class="amount">{{ formatCurrency(prescription.total_amount) }}</span>
            </div>
            <v-icon name="hi-chevron-right" scale="0.9" class="chevron" />
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="bento-card bento-card--empty">
        <div class="empty-visual">
          <div class="empty-orb">
            <div class="empty-orb__ring" />
            <div class="empty-orb__ring empty-orb__ring--2" />
            <div class="empty-orb__center">
              <v-icon name="ri-capsule-line" scale="2" />
            </div>
          </div>
        </div>
        <h3 class="empty-title">
          {{ searchQuery || statusFilter !== 'all' ? 'No prescriptions found' : 'No prescriptions yet' }}
        </h3>
        <p class="empty-description">
          {{ searchQuery || statusFilter !== 'all'
            ? 'Try adjusting your search or filter criteria'
            : 'Create your first prescription to get started' }}
        </p>
        <button class="empty-action" @click="createPrescription">
          <v-icon name="hi-plus" scale="0.85" />
          Create Prescription
        </button>
      </div>

      <!-- Pagination -->
      <PharmacyPagination
        v-if="pagination.totalPages > 1"
        :current-page="pagination.page"
        :total-pages="pagination.totalPages"
        @page-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toast-notification';
import apiFactory from '@/services/apiFactory';
import PharmacyPagination from './components/PharmacyPagination.vue';
import { usePharmacy } from './composables/usePharmacy';

const router = useRouter();
const $toast = useToast();
const { formatCurrency, formatDateTime, formatPaymentMethod, formatPaymentStatus } = usePharmacy();

const isLoading = ref(false);
const searchQuery = ref('');
const statusFilter = ref('all');
const prescriptions = ref([]);
const stats = ref({});
const pagination = ref({ page: 1, limit: 20, total: 0, totalPages: 0 });
let debounceTimer = null;

const statusTabs = [
  { label: 'All', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Pending', value: 'pending_payment' },
  { label: 'Paid', value: 'paid' },
  { label: 'Processing', value: 'processing' },
  { label: 'Dispensed', value: 'dispensed' },
  { label: 'Shipped', value: 'shipped' },
  { label: 'Delivered', value: 'delivered' },
];

function getPatientInitials(name) {
  if (!name) return '?';
  const parts = name.split(' ').filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0]?.[0]?.toUpperCase() || '?';
}

function getFirstName(name) {
  if (!name) return '';
  return name.split(' ')[0] || '';
}

function getLastName(name) {
  if (!name) return '';
  const parts = name.split(' ');
  return parts.length > 1 ? parts[parts.length - 1] : '';
}

function getLinkedCount(prescription) {
  return (prescription.linked_appointments?.length || 0) + (prescription.linked_clinical_notes?.length || 0);
}

function getTabCount(tabValue) {
  if (tabValue === 'all') return stats.value.total || 0;
  return stats.value[tabValue] || 0;
}

function handleSearch() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    pagination.value.page = 1;
    fetchPrescriptions();
  }, 300);
}

function clearSearch() {
  searchQuery.value = '';
  pagination.value.page = 1;
  fetchPrescriptions();
}

function setStatusFilter(status) {
  statusFilter.value = status;
  pagination.value.page = 1;
  fetchPrescriptions();
}

function handlePageChange(page) {
  pagination.value.page = page;
  fetchPrescriptions();
}

function createPrescription() {
  router.push('/app/specialist/pharmacy/prescriptions/create');
}

function viewPrescription(id) {
  router.push(`/app/specialist/pharmacy/prescriptions/${id}`);
}

function getPaymentStatusClass(status) {
  if (!status) return 'draft';
  const normalized = status.toUpperCase();
  if (normalized === 'COMPLETED' || normalized === 'PAID') return 'delivered';
  if (normalized === 'PENDING') return 'pending_payment';
  if (normalized === 'FAILED') return 'cancelled';
  if (normalized === 'PROCESSING') return 'processing';
  return 'draft';
}

function getStatusClass(status) {
  const s = status?.toLowerCase();
  if (s === 'delivered') return 'status--success';
  if (s === 'cancelled') return 'status--error';
  if (s === 'paid' || s === 'processing' || s === 'dispensed' || s === 'shipped') return 'status--info';
  if (s === 'pending_payment') return 'status--warning';
  return 'status--default';
}

function getStatusIcon(status) {
  const s = status?.toLowerCase();
  if (s === 'delivered') return 'hi-check-circle';
  if (s === 'cancelled') return 'hi-x-circle';
  if (s === 'shipped') return 'hi-truck';
  if (s === 'dispensed') return 'hi-clipboard-check';
  if (s === 'paid' || s === 'processing') return 'hi-refresh';
  if (s === 'pending_payment') return 'hi-clock';
  return 'ri-capsule-line';
}

function getStatusBadgeClass(status) {
  const s = status?.toLowerCase();
  if (s === 'delivered') return 'badge--success';
  if (s === 'cancelled') return 'badge--error';
  if (s === 'paid' || s === 'processing' || s === 'dispensed' || s === 'shipped') return 'badge--info';
  if (s === 'pending_payment') return 'badge--warning';
  return 'badge--default';
}

function formatStatusLabel(status) {
  if (!status) return 'Draft';
  return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

async function fetchPrescriptions() {
  try {
    isLoading.value = true;
    const params = {
      search: searchQuery.value || undefined,
      status: statusFilter.value !== 'all' ? statusFilter.value : undefined,
      page: pagination.value.page,
      limit: pagination.value.limit,
    };
    const response = await apiFactory.$_getSpecialistPrescriptions(params);
    const result = response.data?.data || response.data?.result;
    if (result) {
      prescriptions.value = result.docs || [];
      pagination.value.total = result.total || 0;
      pagination.value.totalPages = result.pages || 0;
    }
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    $toast.error('Failed to load prescriptions');
  } finally {
    isLoading.value = false;
  }
}

async function fetchStats() {
  try {
    const response = await apiFactory.$_getSpecialistPrescriptionStats();
    const result = response.data?.data || response.data?.result;
    if (result) {
      stats.value = result;
    }
  } catch (error) {
    console.error('Error fetching stats:', error);
  }
}

onMounted(() => {
  Promise.all([fetchPrescriptions(), fetchStats()]);
});
</script>

<style scoped lang="scss">
// Design System Tokens
$sky: #4FC3F7;
$sky-light: #E1F5FE;
$sky-dark: #0288D1;
$sky-darker: #01579B;
$emerald: #10B981;
$emerald-light: #D1FAE5;
$amber: #F59E0B;
$amber-light: #FEF3C7;
$violet: #8B5CF6;
$violet-light: #EDE9FE;
$rose: #F43F5E;
$rose-light: #FFE4E6;

// Base Layout
.pharmacy-prescriptions {
  position: relative;
  min-height: 100vh;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  overflow-x: hidden;
}

// Ambient Background
.ambient-bg {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.5;
  animation: float 20s ease-in-out infinite;

  &--1 {
    width: 400px;
    height: 400px;
    background: $sky-light;
    top: -100px;
    right: -100px;
    animation-delay: 0s;
  }

  &--2 {
    width: 300px;
    height: 300px;
    background: rgba($emerald, 0.15);
    bottom: 20%;
    left: -80px;
    animation-delay: -7s;
  }

  &--3 {
    width: 250px;
    height: 250px;
    background: rgba($violet, 0.12);
    top: 40%;
    right: 10%;
    animation-delay: -14s;
  }
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(20px, -20px) scale(1.05); }
  50% { transform: translate(-10px, 15px) scale(0.95); }
  75% { transform: translate(15px, 10px) scale(1.02); }
}

// Mobile Header
.mobile-header {
  display: none;
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  padding: $size-12 $size-16;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  align-items: center;
  justify-content: space-between;

  @include responsive(tab-portrait) {
    display: flex;
  }

  .menu-btn, .action-btn {
    width: 40px;
    height: 40px;
    border: none;
    background: transparent;
    border-radius: $size-10;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $color-g-36;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: rgba($sky, 0.1);
      color: $sky-dark;
    }
  }

  .action-btn {
    background: $sky;
    color: white;

    &:hover {
      background: $sky-dark;
    }
  }

  .mobile-title {
    font-size: $size-16;
    font-weight: $fw-semi-bold;
    color: $color-g-21;
  }
}

// Page Container
.page-container {
  position: relative;
  z-index: 1;
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px 32px 100px;

  @media (max-width: 768px) {
    padding: 16px 16px 100px;
  }
}

// Breadcrumbs
.breadcrumbs {
  display: flex;
  align-items: center;
  gap: $size-8;
  margin-bottom: $size-20;
  font-size: $size-13;

  @include responsive(tab-portrait) {
    display: none;
  }

  .breadcrumb-item {
    display: flex;
    align-items: center;
    gap: $size-4;
    color: $color-g-54;
    text-decoration: none;
    transition: color 0.2s;

    &:hover {
      color: $sky-dark;
    }
  }

  .breadcrumb-separator {
    color: $color-g-67;
  }

  .breadcrumb-current {
    color: $color-g-21;
    font-weight: $fw-medium;
  }
}

// Hero Section
.hero {
  background: linear-gradient(135deg, $sky 0%, $sky-dark 50%, $sky-darker 100%);
  border-radius: 32px;
  padding: 48px 56px;
  margin-bottom: 32px;
  position: relative;
  overflow: hidden;
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 48px;
  align-items: center;
  min-height: 320px;
  box-shadow:
    0 25px 80px rgba($sky-dark, 0.35),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;

  &::before {
    content: '';
    position: absolute;
    top: -60%;
    right: -20%;
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%);
    pointer-events: none;
  }

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 32px;
    padding: 36px 32px;
    min-height: auto;
  }

  @media (max-width: 768px) {
    padding: 28px 24px;
    border-radius: 24px;
  }
}

.hero__content {
  position: relative;
  z-index: 2;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 20px;

  &:hover {
    background: rgba(255, 255, 255, 0.25);
    transform: translateX(-4px);
  }

  &.desktop-only {
    @media (max-width: 768px) {
      display: none;
    }
  }
}

.hero__badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(12px);
  padding: 8px 16px;
  border-radius: 24px;
  font-size: 13px;
  font-weight: 600;
  color: white;
  margin-bottom: 16px;

  .badge-pulse {
    width: 8px;
    height: 8px;
    background: #4ade80;
    border-radius: 50%;
    animation: pulse-glow 2s ease-in-out infinite;
  }
}

@keyframes pulse-glow {
  0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.4); }
  50% { opacity: 0.8; box-shadow: 0 0 0 8px rgba(74, 222, 128, 0); }
}

.hero__title {
  font-size: 56px;
  font-weight: 800;
  color: white;
  line-height: 1.05;
  letter-spacing: -0.03em;
  margin-bottom: 16px;

  @media (max-width: 1024px) {
    font-size: 44px;
  }

  @media (max-width: 768px) {
    font-size: 36px;
  }
}

.hero__title-accent {
  background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 50%, #7dd3fc 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero__subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
  max-width: 320px;
  line-height: 1.5;
  margin-bottom: 24px;

  @media (max-width: 1024px) {
    max-width: 100%;
  }
}

.hero__stats {
  display: flex;
  gap: 24px;

  @media (max-width: 768px) {
    gap: 16px;
  }
}

.hero-stat {
  display: flex;
  flex-direction: column;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);

  &__value {
    font-size: 28px;
    font-weight: 700;
    color: white;
    line-height: 1.1;

    @media (max-width: 768px) {
      font-size: 22px;
    }
  }

  &__label {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.7);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-top: 4px;
  }
}

.hero__visual {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 240px;

  @media (max-width: 1024px) {
    display: none;
  }
}

.prescriptions-orb {
  position: relative;
  width: 180px;
  height: 180px;
}

.orb-glow {
  position: absolute;
  inset: -20px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
  border-radius: 50%;
  animation: pulse 3s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.1); opacity: 0.4; }
}

.orb-ring {
  position: absolute;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.2);

  &--1 {
    inset: 0;
    animation: spin-slow 20s linear infinite;
  }

  &--2 {
    inset: 15px;
    border-style: dashed;
    animation: spin-slow 15s linear infinite reverse;
  }

  &--3 {
    inset: 30px;
    animation: spin-slow 25s linear infinite;
  }
}

@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.orb-center {
  position: absolute;
  inset: 45px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(12px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.floating-icons {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.float-icon {
  position: absolute;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(8px);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  animation: float 6s ease-in-out infinite;

  &--1 {
    width: 52px;
    height: 52px;
    top: 0;
    left: 0;
    animation-delay: 0s;
  }

  &--2 {
    width: 46px;
    height: 46px;
    top: 20px;
    right: -10px;
    animation-delay: -2s;
  }

  &--3 {
    width: 44px;
    height: 44px;
    bottom: 10px;
    left: 10px;
    animation-delay: -4s;
  }
}

@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-8px) rotate(3deg); }
  75% { transform: translateY(6px) rotate(-2deg); }
}

// Glass Card Mixin
.glass-card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: $size-16;
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.06),
    0 1px 2px rgba(0, 0, 0, 0.04);
}

// Filters Card
.filters-card {
  padding: $size-20;
  margin-bottom: $size-20;
}

.search-wrapper {
  display: flex;
  align-items: center;
  gap: $size-12;
  background: rgba($color-g-97, 0.8);
  border-radius: $size-12;
  padding: $size-12 $size-16;
  margin-bottom: $size-16;
  transition: all 0.2s;
  border: 1px solid transparent;

  &:focus-within {
    background: rgba($sky, 0.05);
    border-color: rgba($sky, 0.2);
  }
}

.search-icon {
  color: $color-g-54;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: $size-14;
  color: $color-g-21;
  background: transparent;

  &::placeholder {
    color: $color-g-67;
  }
}

.clear-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $color-g-85;
  border: none;
  border-radius: $size-6;
  color: $color-g-54;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: $color-g-67;
    color: $color-g-36;
  }
}

.filter-tabs {
  display: flex;
  gap: $size-8;
  overflow-x: auto;
  padding-bottom: $size-4;

  &::-webkit-scrollbar { display: none; }
}

.filter-tab {
  display: flex;
  align-items: center;
  gap: $size-6;
  padding: $size-8 $size-14;
  border-radius: $size-8;
  border: none;
  background: rgba($color-g-97, 0.7);
  font-size: $size-12;
  font-weight: $fw-medium;
  color: $color-g-44;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;

  &:hover {
    color: $sky-dark;
    background: rgba($sky, 0.08);
  }

  &.active {
    background: rgba($sky, 0.12);
    color: $sky-dark;
  }

  .tab-count {
    background: rgba($sky, 0.15);
    padding: 2px $size-6;
    border-radius: $size-4;
    font-size: $size-10;
  }
}

// Skeleton Loading
.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: $size-12;
}

.skeleton-card {
  display: flex;
  background: rgba(255, 255, 255, 0.8);
  border-radius: $size-16;
  overflow: hidden;
}

.skeleton-accent {
  width: 4px;
  background: linear-gradient(180deg, $color-g-85, $color-g-92);
}

.skeleton-body {
  flex: 1;
  padding: $size-20;
}

.skeleton-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: $size-16;
}

.skeleton-patient {
  display: flex;
  align-items: center;
  gap: $size-12;
  margin-bottom: $size-16;
}

.skeleton-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(90deg, $color-g-92 25%, $color-g-97 50%, $color-g-92 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $size-6;
}

.skeleton-footer {
  display: flex;
  justify-content: space-between;
  padding-top: $size-14;
  border-top: 1px solid $color-g-92;
}

.skeleton-line {
  height: 14px;
  border-radius: $size-4;
  background: linear-gradient(90deg, $color-g-92 25%, $color-g-97 50%, $color-g-92 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;

  &--medium { width: 120px; }
  &--badge { width: 60px; }
  &--name { width: 140px; }
  &--email { width: 180px; height: 12px; }
  &--short { width: 80px; }
  &--amount { width: 100px; height: 18px; }
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

// Results Header
.results-header {
  margin-bottom: $size-16;
}

.results-count {
  display: flex;
  align-items: center;
  gap: $size-8;
  font-size: $size-13;
  color: $color-g-54;

  svg { color: $sky-dark; }

  strong {
    color: $color-g-21;
    font-weight: $fw-semi-bold;
  }
}

// Prescriptions List
.prescriptions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

// Prescription Item (matching order-item style)
.prescription-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);

    .chevron {
      color: $sky-dark;
      transform: translateX(3px);
    }
  }

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    padding: 14px 16px;
  }

  &__left {
    display: flex;
    align-items: center;
    gap: 14px;
    flex: 1;
    min-width: 0;
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
      border-top: 1px solid rgba(0, 0, 0, 0.06);
    }
  }
}

.prescription-avatar {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &.status--success {
    background: linear-gradient(135deg, rgba($emerald, 0.15), rgba($emerald, 0.08));
    color: $emerald;
  }

  &.status--error {
    background: linear-gradient(135deg, rgba($rose, 0.15), rgba($rose, 0.08));
    color: $rose;
  }

  &.status--warning {
    background: linear-gradient(135deg, rgba($amber, 0.15), rgba($amber, 0.08));
    color: $amber;
  }

  &.status--info {
    background: linear-gradient(135deg, rgba($sky, 0.15), rgba($sky, 0.08));
    color: $sky-dark;
  }

  &.status--default {
    background: linear-gradient(135deg, rgba($violet, 0.15), rgba($violet, 0.08));
    color: $violet;
  }
}

.prescription-info {
  flex: 1;
  min-width: 0;
}

.prescription-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  flex-wrap: wrap;
}

.prescription-number {
  font-size: 15px;
  font-weight: 600;
  color: $color-g-21;
}

.status-badge {
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 6px;
  text-transform: capitalize;

  &.badge--success {
    background: rgba($emerald, 0.12);
    color: $emerald;
  }

  &.badge--error {
    background: rgba($rose, 0.12);
    color: $rose;
  }

  &.badge--warning {
    background: rgba($amber, 0.12);
    color: darken($amber, 10%);
  }

  &.badge--info {
    background: rgba($sky, 0.12);
    color: $sky-dark;
  }

  &.badge--default {
    background: rgba($violet, 0.12);
    color: $violet;
  }
}

.linked-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  font-weight: 500;
  color: $sky-dark;
  background: rgba($sky, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
}

.patient-name {
  font-size: 13px;
  color: $color-g-54;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.medication-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.medication-tag {
  font-size: 12px;
  font-weight: 500;
  color: $sky-dark;
  background: rgba($sky, 0.08);
  padding: 3px 8px;
  border-radius: 6px;
  white-space: nowrap;
}

.more-tag {
  font-size: 12px;
  font-weight: 500;
  color: $color-g-54;
  background: $color-g-97;
  padding: 3px 8px;
  border-radius: 6px;
}

.prescription-date {
  font-size: 12px;
  color: $color-g-54;
  white-space: nowrap;
}

.prescription-amount {
  display: flex;
  align-items: baseline;
  gap: 4px;

  .currency {
    font-size: 11px;
    font-weight: 500;
    color: $color-g-54;
  }

  .amount {
    font-size: 16px;
    font-weight: 700;
    color: $color-g-21;
  }
}

.chevron {
  color: $color-g-67;
  transition: all 0.2s;

  @media (max-width: 768px) {
    display: none;
  }
}

// Empty State
.empty-state {
  text-align: center;
  padding: $size-48 $size-24;
}

.empty-icon {
  position: relative;
  width: 80px;
  height: 80px;
  margin: 0 auto $size-20;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $sky-dark;
}

.empty-icon-bg {
  position: absolute;
  inset: 0;
  background: rgba($sky, 0.1);
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.7; }
}

.empty-title {
  font-size: $size-18;
  font-weight: $fw-semi-bold;
  color: $color-g-21;
  margin-bottom: $size-8;
}

.empty-description {
  font-size: $size-14;
  color: $color-g-54;
  margin-bottom: $size-24;
  max-width: 300px;
  margin-left: auto;
  margin-right: auto;
}

.empty-action {
  display: inline-flex;
  align-items: center;
  gap: $size-8;
  background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
  color: white;
  border: none;
  border-radius: $size-10;
  padding: $size-12 $size-24;
  font-size: $size-14;
  font-weight: $fw-semi-bold;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba($sky-dark, 0.3);
  }
}

// ======================
// Bento Grid Controls
// ======================
.bento-grid--controls {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 16px;
  margin-bottom: 24px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.bento-card {
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.05),
    0 1px 2px rgba(0, 0, 0, 0.03);
  transition: all 0.3s ease;
}

// Create Prescription Card
.bento-card--create {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  cursor: pointer;
  background: linear-gradient(135deg, rgba($sky, 0.08) 0%, rgba($sky-dark, 0.04) 100%);
  border-color: rgba($sky, 0.2);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 32px rgba($sky-dark, 0.15);
    border-color: rgba($sky, 0.35);

    .create-card__icon {
      transform: scale(1.1) rotate(90deg);
      background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
    }

    .create-card__arrow {
      transform: translateX(4px);
      opacity: 1;
    }
  }

  .create-card__icon {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba($sky, 0.15);
    border-radius: 14px;
    color: $sky-dark;
    transition: all 0.3s ease;
  }

  .create-card__content {
    flex: 1;

    h4 {
      font-size: 16px;
      font-weight: 600;
      color: $color-g-21;
      margin-bottom: 4px;
    }

    p {
      font-size: 13px;
      color: $color-g-54;
    }
  }

  .create-card__arrow {
    color: $sky-dark;
    opacity: 0.5;
    transition: all 0.3s ease;
  }
}

// Search Card
.bento-card--search {
  padding: 16px 20px;
  display: flex;
  align-items: center;

  .search-wrapper {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    margin-bottom: 0;
    background: rgba($color-g-97, 0.6);
    border-radius: 12px;
    padding: 12px 16px;
    border: 1px solid transparent;
    transition: all 0.2s;

    &:focus-within {
      background: rgba(255, 255, 255, 0.9);
      border-color: rgba($sky, 0.3);
      box-shadow: 0 4px 16px rgba($sky-dark, 0.08);
    }
  }
}

// Mini Stats Card
.bento-card--mini-stats {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  padding: 16px 20px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.mini-stat {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba($color-g-97, 0.5);
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.25s ease;
  border: 1px solid transparent;

  &:hover {
    background: rgba(255, 255, 255, 0.9);
    transform: translateY(-2px);
  }

  &.active {
    background: rgba(255, 255, 255, 0.95);
    border-color: rgba($sky, 0.3);
    box-shadow: 0 4px 16px rgba($sky-dark, 0.1);

    .mini-stat__value {
      color: $sky-dark;
    }
  }

  &__icon {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    flex-shrink: 0;

    &--warning {
      background: rgba($amber, 0.12);
      color: darken($amber, 5%);
    }

    &--info {
      background: rgba($sky, 0.12);
      color: $sky-dark;
    }

    &--violet {
      background: rgba($violet, 0.12);
      color: $violet;
    }

    &--success {
      background: rgba($emerald, 0.12);
      color: $emerald;
    }
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__value {
    font-size: 20px;
    font-weight: 700;
    color: $color-g-21;
    line-height: 1.1;
  }

  &__label {
    font-size: 12px;
    font-weight: 500;
    color: $color-g-54;
  }
}

// Filter Pills
.filter-pills {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  overflow-x: auto;
  padding-bottom: 4px;

  &::-webkit-scrollbar {
    display: none;
  }
}

.filter-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: none;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  font-weight: 500;
  color: $color-g-44;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);

  &:hover {
    background: rgba(255, 255, 255, 0.9);
    color: $sky-dark;
  }

  &.active {
    background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
    color: white;
    box-shadow: 0 4px 12px rgba($sky-dark, 0.25);

    .pill-count {
      background: rgba(255, 255, 255, 0.25);
      color: white;
    }
  }

  .pill-count {
    background: rgba($sky, 0.12);
    padding: 2px 6px;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 600;
    color: $sky-dark;
    transition: all 0.2s;
  }
}

// Prescriptions List (matching pharmacy index style)
.prescriptions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 32px;
}

// Skeleton Loading Items
.skeleton-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 16px;

  .skeleton-left {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .skeleton-right {
    display: flex;
    align-items: center;
  }

  .skeleton-avatar {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: linear-gradient(90deg, $color-g-92 25%, $color-g-97 50%, $color-g-92 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }

  .skeleton-info {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .skeleton-line {
    height: 14px;
    border-radius: 4px;
    background: linear-gradient(90deg, $color-g-92 25%, $color-g-97 50%, $color-g-92 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;

    &--medium { width: 180px; }
    &--short { width: 100px; }
    &--amount { width: 90px; height: 18px; }
  }
}

// Prescription List Item
.prescription-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);

    .chevron {
      color: $sky-dark;
      transform: translateX(3px);
    }
  }

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    padding: 14px 16px;
  }

  &__left {
    display: flex;
    align-items: center;
    gap: 14px;
    flex: 1;
    min-width: 0;
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
      border-top: 1px solid rgba(0, 0, 0, 0.06);
    }
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

  &.status--success {
    background: linear-gradient(135deg, rgba($emerald, 0.15), rgba($emerald, 0.08));
    color: $emerald;
  }

  &.status--error {
    background: linear-gradient(135deg, rgba($rose, 0.15), rgba($rose, 0.08));
    color: $rose;
  }

  &.status--warning {
    background: linear-gradient(135deg, rgba($amber, 0.15), rgba($amber, 0.08));
    color: $amber;
  }

  &.status--info {
    background: linear-gradient(135deg, rgba($sky, 0.15), rgba($sky, 0.08));
    color: $sky-dark;
  }

  &.status--default {
    background: linear-gradient(135deg, rgba($violet, 0.15), rgba($violet, 0.08));
    color: $violet;
  }
}

.prescription-info {
  flex: 1;
  min-width: 0;
}

.prescription-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  flex-wrap: wrap;
}

.prescription-number {
  font-size: 15px;
  font-weight: 600;
  color: $color-g-21;
}

.status-badge {
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 6px;
  text-transform: capitalize;

  &.badge--success {
    background: rgba($emerald, 0.12);
    color: $emerald;
  }

  &.badge--error {
    background: rgba($rose, 0.12);
    color: $rose;
  }

  &.badge--warning {
    background: rgba($amber, 0.12);
    color: darken($amber, 10%);
  }

  &.badge--info {
    background: rgba($sky, 0.12);
    color: $sky-dark;
  }

  &.badge--default {
    background: rgba($violet, 0.12);
    color: $violet;
  }
}

.linked-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  font-weight: 500;
  color: $sky-dark;
  background: rgba($sky, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
}

.patient-name {
  font-size: 13px;
  color: $color-g-54;
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.medication-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.medication-tag {
  font-size: 12px;
  font-weight: 500;
  color: $sky-dark;
  background: rgba($sky, 0.08);
  padding: 3px 8px;
  border-radius: 6px;
  white-space: nowrap;
}

.more-tag {
  font-size: 12px;
  font-weight: 500;
  color: $color-g-54;
  background: $color-g-97;
  padding: 3px 8px;
  border-radius: 6px;
}

.prescription-date {
  font-size: 12px;
  color: $color-g-54;
  white-space: nowrap;
}

.prescription-amount {
  display: flex;
  align-items: baseline;
  gap: 4px;

  .currency {
    font-size: 11px;
    font-weight: 500;
    color: $color-g-54;
  }

  .amount {
    font-size: 16px;
    font-weight: 700;
    color: $color-g-21;
  }
}

.chevron {
  color: $color-g-67;
  transition: all 0.2s;

  @media (max-width: 768px) {
    display: none;
  }
}

// Empty State Card
.bento-card--empty {
  grid-column: 1 / -1;
  text-align: center;
  padding: 60px 24px;
}

.empty-visual {
  margin-bottom: 24px;
}

.empty-orb {
  position: relative;
  width: 100px;
  height: 100px;
  margin: 0 auto;

  &__ring {
    position: absolute;
    inset: 0;
    border: 2px dashed rgba($sky, 0.25);
    border-radius: 50%;
    animation: spin-slow 20s linear infinite;

    &--2 {
      inset: 12px;
      animation-direction: reverse;
      animation-duration: 15s;
    }
  }

  &__center {
    position: absolute;
    inset: 24px;
    background: rgba($sky, 0.08);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $sky-dark;
  }
}

.empty-title {
  font-size: 20px;
  font-weight: 600;
  color: $color-g-21;
  margin-bottom: 8px;
}

.empty-description {
  font-size: 14px;
  color: $color-g-54;
  max-width: 280px;
  margin: 0 auto 24px;
  line-height: 1.5;
}
</style>
