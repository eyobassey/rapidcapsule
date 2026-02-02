<template>
  <div class="page-content">
    <TopBar showButtons type="title-only" title="Pharmacy / Prescriptions" @open-side-nav="$emit('openSideNav')" />
    <div class="page-content__body">
      <div class="prescriptions-container">
        <!-- Hero Section -->
        <div class="hero-section">
          <div class="hero-content">
            <button class="hero-back" @click="router.push('/app/specialist/pharmacy')">
              <v-icon name="hi-arrow-left" scale="0.75" />
              Pharmacy
            </button>
            <h1 class="hero-title">
              <v-icon name="hi-clipboard-list" scale="1" />
              Prescriptions
            </h1>
            <p class="hero-subtitle">View and manage all prescriptions</p>
          </div>
          <div class="hero-right">
            <div class="hero-stats">
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
            <button class="hero-action-btn" @click="createPrescription">
              <v-icon name="hi-plus" scale="0.85" />
              New Prescription
            </button>
          </div>
        </div>

        <!-- Search & Filters -->
        <div class="filters-card">
          <div class="search-input-wrapper">
            <div class="search-icon">
              <v-icon name="hi-search" scale="0.9" />
            </div>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search by prescription number or patient..."
              @input="handleSearch"
            />
            <button v-if="searchQuery" class="clear-btn" @click="clearSearch">
              <v-icon name="hi-x" scale="0.8" />
            </button>
          </div>
          <div class="filter-tabs">
            <button
              v-for="tab in statusTabs"
              :key="tab.value"
              :class="['filter-tab', { active: statusFilter === tab.value }]"
              @click="setStatusFilter(tab.value)"
            >
              {{ tab.label }}
            </button>
          </div>
        </div>

        <!-- Shimmer Loading -->
        <div v-if="isLoading" class="prescriptions-skeleton">
          <div v-for="i in 4" :key="i" class="skeleton-card">
            <div class="skeleton-line skeleton-line--medium" />
            <div class="skeleton-line skeleton-line--long" style="margin-top: 12px;" />
            <div class="skeleton-line skeleton-line--short" style="margin-top: 8px;" />
            <div class="skeleton-footer">
              <div class="skeleton-line skeleton-line--short" />
              <div class="skeleton-line skeleton-line--short" />
            </div>
          </div>
        </div>

        <!-- Results -->
        <template v-else>
          <p v-if="prescriptions.length" class="results-count">
            <v-icon name="ri-capsule-line" scale="0.75" />
            Showing {{ prescriptions.length }} of {{ pagination.total }} prescriptions
          </p>

          <div v-if="prescriptions.length" class="prescriptions-list">
            <div
              v-for="prescription in prescriptions"
              :key="prescription._id"
              class="prescription-card"
              @click="viewPrescription(prescription._id)"
            >
              <div class="prescription-card__accent" />
              <div class="prescription-card__body">
                <div class="prescription-card__header">
                  <div class="prescription-info">
                    <span class="prescription-number">{{ prescription.prescription_number }}</span>
                    <PharmacyStatusBadge :status="prescription.status" />
                    <span
                      v-if="prescription.linked_appointments?.length || prescription.linked_clinical_notes?.length"
                      class="linked-badge"
                      :title="`Linked to ${getLinkedCount(prescription)} record(s)`"
                    >
                      <v-icon name="hi-link" scale="0.6" />
                      {{ getLinkedCount(prescription) }}
                    </span>
                  </div>
                  <span class="prescription-date">{{ formatDateTime(prescription.created_at) }}</span>
                </div>

                <div class="prescription-card__patient">
                  <RcAvatar
                    :model-value="prescription.patient?.profile_image"
                    :first-name="getFirstName(prescription.patient?.full_name)"
                    :last-name="getLastName(prescription.patient?.full_name)"
                    size="sm"
                  />
                  <div class="patient-info">
                    <p class="patient-name">{{ prescription.patient?.full_name || 'Unknown' }}</p>
                    <p class="patient-email">{{ prescription.patient?.email }}</p>
                  </div>
                  <div class="card-arrow">
                    <v-icon name="hi-chevron-right" scale="0.85" />
                  </div>
                </div>

                <div v-if="prescription.items?.length" class="prescription-card__items">
                  <span
                    v-for="(item, index) in prescription.items.slice(0, 3)"
                    :key="index"
                    class="item-tag"
                  >
                    <v-icon name="ri-capsule-line" scale="0.6" />
                    {{ item.drug_name }}
                  </span>
                  <span v-if="prescription.items.length > 3" class="more-items">
                    +{{ prescription.items.length - 3 }} more
                  </span>
                </div>

                <div class="prescription-card__footer">
                  <div class="payment-info">
                    <span class="payment-method">{{ formatPaymentMethod(prescription.payment_method) }}</span>
                    <PharmacyStatusBadge
                      :status="getPaymentStatusClass(prescription.payment_status)"
                      :label="formatPaymentStatus(prescription.payment_status)"
                      size="sm"
                    />
                  </div>
                  <div class="amount">
                    NGN {{ formatCurrency(prescription.total_amount) }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="empty-state-card">
            <div class="empty-state-icon">
              <v-icon name="ri-capsule-line" scale="2.5" />
            </div>
            <h3>{{ searchQuery || statusFilter !== 'all' ? 'No prescriptions found' : 'No prescriptions yet' }}</h3>
            <p>{{ searchQuery || statusFilter !== 'all' ? 'Try adjusting your search or filter criteria' : 'Create your first prescription to get started' }}</p>
            <button class="empty-state-action" @click="createPrescription">
              <v-icon name="hi-plus" scale="0.8" />
              Create Prescription
            </button>
          </div>
        </template>

        <PharmacyPagination
          :current-page="pagination.page"
          :total-pages="pagination.totalPages"
          @page-change="handlePageChange"
        />
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
  { label: 'Pending Payment', value: 'pending_payment' },
  { label: 'Paid', value: 'paid' },
  { label: 'Processing', value: 'processing' },
  { label: 'Dispensed', value: 'dispensed' },
  { label: 'Shipped', value: 'shipped' },
  { label: 'Delivered', value: 'delivered' },
];

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

.prescriptions-container {
  width: 100%;
  max-width: 700px;
  display: flex;
  flex-direction: column;
  gap: $size-24;
  padding-bottom: $size-32;
}

// Hero Section
.hero-section {
  background: linear-gradient(135deg, #0EAEC4 0%, #0891b2 50%, #0e7490 100%);
  border-radius: $size-20;
  padding: $size-24 $size-28;
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
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.08) 0%, transparent 70%);
    pointer-events: none;
  }

  @include responsive(tab-portrait) {
    flex-direction: column;
    gap: $size-20;
    padding: $size-20;
    border-radius: $size-16;
  }

  @include responsive(phone) {
    padding: $size-16;
    border-radius: $size-12;
  }

  .hero-content {
    z-index: 1;

    .hero-back {
      display: inline-flex;
      align-items: center;
      gap: $size-4;
      background: rgba(255, 255, 255, 0.15);
      border: none;
      color: white;
      font-size: $size-12;
      font-weight: $fw-medium;
      padding: $size-4 $size-10;
      border-radius: $size-8;
      cursor: pointer;
      margin-bottom: $size-12;
      transition: background 0.2s;

      &:hover {
        background: rgba(255, 255, 255, 0.25);
      }
    }

    .hero-title {
      display: flex;
      align-items: center;
      gap: $size-8;
      font-size: $size-20;
      font-weight: $fw-bold;
      margin-bottom: $size-4;
    }

    .hero-subtitle {
      font-size: $size-13;
      opacity: 0.85;
    }
  }

  .hero-right {
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: $size-14;

    @include responsive(tab-portrait) {
      align-items: flex-start;
      width: 100%;
    }
  }

  .hero-stats {
    display: flex;
    gap: $size-12;

    .hero-stat {
      display: flex;
      flex-direction: column;
      align-items: center;
      background: rgba(255, 255, 255, 0.15);
      padding: $size-10 $size-14;
      border-radius: $size-10;
      min-width: 64px;

      &__value {
        font-size: $size-20;
        font-weight: $fw-bold;
        line-height: 1.2;
      }

      &__label {
        font-size: $size-10;
        opacity: 0.85;
        font-weight: $fw-medium;
        margin-top: $size-2;
      }
    }
  }

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

// Filters
.filters-card {
  background: white;
  border-radius: $size-16;
  padding: $size-20;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  gap: $size-12;
  padding: $size-12 $size-16;
  background: $color-g-97;
  border-radius: $size-10;
  margin-bottom: $size-14;
  transition: background 0.2s ease;

  &:focus-within {
    background: rgba(14, 174, 196, 0.04);
  }

  .search-icon { color: $color-g-54; }

  input {
    flex: 1;
    border: none;
    outline: none;
    font-size: $size-14;
    color: $color-g-21;
    background: transparent;

    &::placeholder { color: $color-g-67; }
  }

  .clear-btn {
    background: $color-g-92;
    border: none;
    cursor: pointer;
    padding: $size-4 $size-6;
    color: $color-g-54;
    border-radius: $size-4;

    &:hover { background: $color-g-85; color: $color-g-36; }
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
  padding: $size-8 $size-14;
  border-radius: $size-8;
  border: none;
  background: $color-g-97;
  font-size: $size-12;
  font-weight: $fw-medium;
  color: $color-g-44;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;

  &:hover {
    color: #0EAEC4;
  }

  &.active {
    background: rgba(14, 174, 196, 0.1);
    color: #0EAEC4;
  }
}

// Results Count
.results-count {
  display: flex;
  align-items: center;
  gap: $size-6;
  font-size: $size-13;
  color: $color-g-54;
  font-weight: $fw-medium;

  svg { color: #0EAEC4; }
}

// Skeleton
.prescriptions-skeleton {
  display: flex;
  flex-direction: column;
  gap: $size-12;
}

.skeleton-card {
  height: 120px;
  border-radius: $size-16;
  background: linear-gradient(90deg, $color-g-92 25%, $color-g-97 50%, $color-g-92 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

// Prescriptions List
.prescriptions-list {
  display: flex;
  flex-direction: column;
  gap: $size-12;
}

.prescription-card {
  display: flex;
  background: white;
  border-radius: $size-16;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);

  &:hover {
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12);

    .card-arrow { color: #0EAEC4; transform: translateX(2px); }
  }

  &__accent {
    width: 4px;
    background: #0EAEC4;
    flex-shrink: 0;
  }

  &__body {
    flex: 1;
    padding: $size-20;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: $size-14;

    .prescription-info {
      display: flex;
      align-items: center;
      gap: $size-10;
    }

    .prescription-number {
      font-size: $size-15;
      font-weight: $fw-semi-bold;
      color: $color-g-21;
    }

    .linked-badge {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      font-size: $size-11;
      font-weight: $fw-medium;
      color: #0891b2;
      background: rgba(14, 174, 196, 0.08);
      padding: 2px $size-6;
      border-radius: $size-4;
    }

    .prescription-date {
      font-size: $size-12;
      color: $color-g-54;
    }
  }

  &__patient {
    display: flex;
    align-items: center;
    gap: $size-12;
    margin-bottom: $size-14;

    .patient-name {
      font-size: $size-14;
      font-weight: $fw-medium;
      color: $color-g-21;
    }

    .patient-email {
      font-size: $size-12;
      color: $color-g-54;
      margin-top: $size-2;
    }

    .patient-info { flex: 1; min-width: 0; }

    .card-arrow {
      color: $color-g-67;
      transition: all 0.2s ease;
    }
  }

  &__items {
    display: flex;
    flex-wrap: wrap;
    gap: $size-6;
    margin-bottom: $size-14;

    .item-tag {
      display: flex;
      align-items: center;
      gap: $size-4;
      font-size: $size-12;
      padding: $size-4 $size-10;
      background: rgba(14, 174, 196, 0.06);
      border-radius: $size-6;
      color: #0891b2;
      font-weight: $fw-medium;
    }

    .more-items {
      font-size: $size-12;
      padding: $size-4 $size-10;
      background: $color-g-97;
      border-radius: $size-6;
      color: $color-g-54;
    }
  }

  &__footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: $size-14;
    border-top: 1px solid $color-g-92;

    .payment-info {
      display: flex;
      align-items: center;
      gap: $size-10;

      .payment-method {
        font-size: $size-12;
        color: $color-g-54;
      }
    }

    .amount {
      font-size: $size-18;
      font-weight: $fw-bold;
      color: $color-g-21;
    }
  }
}

// Empty State
.empty-state-card {
  text-align: center;
  padding: $size-32 $size-20;
  background: $color-g-97;
  border-radius: $size-12;

  .empty-state-icon {
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
}

.empty-state-action {
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

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
</style>
