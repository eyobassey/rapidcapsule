<template>
  <div class="prescriptions-tab">
    <!-- Skeleton Loading -->
    <div v-if="loading" class="prescriptions-skeleton">
      <div v-for="i in 4" :key="i" class="skeleton-card">
        <div class="skeleton-shimmer" />
      </div>
    </div>

    <!-- Prescriptions List -->
    <div v-else-if="prescriptions.length" class="prescriptions-content">
      <div class="prescriptions-header">
        <div class="prescriptions-count">
          <span class="count-number">{{ pagination.total || 0 }}</span>
          <span class="count-label">Prescriptions</span>
        </div>
        <button class="create-btn" @click="$emit('create-prescription')">
          <v-icon name="hi-plus" scale="0.8" />
          <span>New Prescription</span>
        </button>
      </div>

      <div class="prescriptions-list">
        <div
          v-for="(prescription, index) in prescriptions"
          :key="prescription._id"
          class="prescription-item"
          :style="{ animationDelay: `${index * 0.05}s` }"
          @click="$emit('view-prescription', prescription._id)"
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
              <span
                v-if="prescription.is_own_prescription"
                class="own-badge"
                title="Your prescription"
              >
                <v-icon name="hi-check" scale="0.5" />
              </span>
            </div>

            <div class="prescription-info">
              <div class="prescription-header">
                <span class="prescription-number">{{ getPrescriptionNumber(prescription) }}</span>
                <span :class="['status-badge', getStatusBadgeClass(prescription.status)]">
                  {{ formatStatus(prescription.status) }}
                </span>
              </div>
              <p class="specialist-name-inline">
                <v-icon name="hi-user" scale="0.6" />
                Dr. {{ prescription.specialist_name || 'Unknown Specialist' }}
              </p>
              <p class="prescription-date-inline">
                <v-icon name="hi-calendar" scale="0.6" />
                {{ formatDate(prescription.created_at) }}
              </p>
              <div class="medication-tags" v-if="prescription.items?.length">
                <span
                  v-for="(item, idx) in prescription.items?.slice(0, 2)"
                  :key="idx"
                  class="med-tag"
                >
                  {{ item.drug?.name || item.drug_name || item.name || 'Medication' }}
                </span>
                <span v-if="prescription.items?.length > 2" class="med-tag med-tag--more">
                  +{{ prescription.items.length - 2 }}
                </span>
              </div>
            </div>
          </div>

          <div class="prescription-item__right">
            <div class="prescription-amount" v-if="prescription.total_amount">
              <span class="currency">NGN</span>
              <span class="amount">{{ formatCurrency(prescription.total_amount) }}</span>
            </div>
            <v-icon name="hi-chevron-right" scale="0.9" class="chevron" />
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="pagination.totalPages > 1" class="pagination">
        <button
          class="pagination-btn"
          :disabled="!pagination.hasPrevPage"
          @click="fetchPrescriptions(pagination.page - 1)"
        >
          <v-icon name="hi-chevron-left" scale="0.8" />
          Previous
        </button>
        <span class="pagination-info">
          Page {{ pagination.page }} of {{ pagination.totalPages }}
        </span>
        <button
          class="pagination-btn"
          :disabled="!pagination.hasNextPage"
          @click="fetchPrescriptions(pagination.page + 1)"
        >
          Next
          <v-icon name="hi-chevron-right" scale="0.8" />
        </button>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <div class="empty-state__visual">
        <div class="empty-icon">
          <v-icon name="ri-capsule-line" scale="2" />
        </div>
      </div>
      <div class="empty-state__content">
        <h3>No Prescriptions Yet</h3>
        <p>Create the first prescription for this patient</p>
        <button class="empty-action" @click="$emit('create-prescription')">
          <v-icon name="hi-plus" scale="0.9" />
          Create Prescription
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import apiFactory from '@/services/apiFactory';
import { useToast } from 'vue-toast-notification';
import { usePharmacy } from '../composables/usePharmacy';

const { formatCurrency, formatDate } = usePharmacy();

const props = defineProps({
  patientId: { type: String, required: true },
});

defineEmits(['view-prescription', 'create-prescription']);

const $toast = useToast();
const loading = ref(false);
const prescriptions = ref([]);
const pagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPrevPage: false,
});

onMounted(() => {
  fetchPrescriptions(1);
});

watch(() => props.patientId, () => {
  fetchPrescriptions(1);
});

async function fetchPrescriptions(page = 1) {
  loading.value = true;
  try {
    const response = await apiFactory.$_getPharmacyPatientPrescriptions(props.patientId, {
      page,
      limit: 10,
    });
    const result = response.data?.data || response.data?.result || response.data;
    if (result) {
      prescriptions.value = result.docs || [];
      // Handle different pagination formats from API
      const currentPage = result.page || result.currentPage || 1;
      const totalPages = result.totalPages || result.pages || 1;
      const pageNum = typeof currentPage === 'string' ? parseInt(currentPage) : currentPage;
      const pagesNum = typeof totalPages === 'string' ? parseInt(totalPages) : totalPages;
      pagination.value = {
        page: pageNum,
        limit: result.limit || result.perPage || 10,
        total: result.total || 0,
        totalPages: pagesNum,
        hasNextPage: result.hasNextPage !== undefined ? result.hasNextPage : (pageNum < pagesNum),
        hasPrevPage: result.hasPrevPage !== undefined ? result.hasPrevPage : (pageNum > 1),
      };
    }
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    $toast.error('Failed to load prescriptions');
  } finally {
    loading.value = false;
  }
}

function getPrescriptionNumber(prescription) {
  if (prescription.prescription_number) {
    return prescription.prescription_number;
  }
  return 'RX-' + (prescription._id?.slice(-6) || '---');
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
  return statusMap[status] || status || 'Unknown';
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

function getStatusIcon(status) {
  const iconMap = {
    PENDING_PAYMENT: 'hi-clock',
    PENDING: 'hi-clock',
    PAID: 'hi-check',
    CONFIRMED: 'hi-check-circle',
    PROCESSING: 'hi-refresh',
    READY_FOR_PICKUP: 'hi-inbox-in',
    OUT_FOR_DELIVERY: 'hi-truck',
    DISPENSED: 'hi-badge-check',
    DELIVERED: 'hi-badge-check',
    COMPLETED: 'hi-badge-check',
    CANCELLED: 'hi-x-circle',
  };
  return iconMap[status] || 'ri-capsule-line';
}
</script>

<style scoped lang="scss">
$sky: #4FC3F7;
$sky-light: #E1F5FE;
$sky-dark: #0288D1;
$sky-darker: #01579B;
$emerald: #10B981;
$emerald-light: #D1FAE5;
$amber: #F59E0B;
$amber-light: #FEF3C7;
$rose: #F43F5E;
$rose-light: #FFE4E6;
$violet: #8B5CF6;
$violet-light: #EDE9FE;
$navy: #1E293B;
$slate: #64748B;
$gray: #94A3B8;
$light-gray: #CBD5E1;
$bg: #F8FAFC;

.prescriptions-tab {
  min-height: 200px;
}

.prescriptions-skeleton {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-card {
  height: 100px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba($color-g-92, 0.5);
  overflow: hidden;
  position: relative;
}

.skeleton-shimmer {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent 0%, rgba($sky, 0.08) 50%, transparent 100%);
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.prescriptions-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.prescriptions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.prescriptions-count {
  display: flex;
  align-items: baseline;
  gap: 8px;

  .count-number {
    font-size: 28px;
    font-weight: 700;
    color: $sky-dark;
  }

  .count-label {
    font-size: 14px;
    color: $color-g-54;
    font-weight: 500;
  }
}

.create-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba($sky-dark, 0.25);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba($sky-dark, 0.35);
  }

  @media (max-width: 500px) {
    span { display: none; }
    padding: 10px 12px;
  }
}

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
  animation: slideUp 0.4s ease forwards;
  opacity: 0;

  @media (max-width: 600px) {
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

    .chevron {
      transform: translateX(3px);
      color: $sky-dark;
    }
  }

  &__left {
    display: flex;
    align-items: center;
    gap: 14px;
    flex: 1;
    min-width: 0;

    @media (max-width: 600px) { width: 100%; }
  }

  &__right {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-shrink: 0;

    @media (max-width: 600px) {
      width: 100%;
      justify-content: space-between;
      padding-top: 12px;
      border-top: 1px solid #E2E8F0;
    }

    .chevron {
      color: $light-gray;
      transition: all 0.2s ease;

      @media (max-width: 600px) { display: none; }
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

.own-badge {
  position: absolute;
  bottom: -4px;
  right: -4px;
  width: 18px;
  height: 18px;
  background: $emerald;
  border: 2px solid white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.specialist-name-inline {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  color: $navy;
  font-weight: 500;
  margin: 0 0 4px;

  svg {
    color: $sky;
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

  .prescription-date-inline {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    color: $gray;
    margin: 0 0 8px;

    svg {
      color: $light-gray;
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

// Pagination
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  padding-top: 20px;
  border-top: 1px solid rgba($color-g-92, 0.5);
}

.pagination-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba($color-g-92, 0.6);
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  color: $color-g-36;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    border-color: $sky;
    color: $sky-dark;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.pagination-info {
  font-size: 13px;
  color: $color-g-54;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// Empty State
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 24px;
  text-align: center;

  &__visual {
    margin-bottom: 20px;
  }

  &__content {
    h3 {
      font-size: 18px;
      font-weight: 700;
      color: $navy;
      margin-bottom: 8px;
    }

    p {
      font-size: 14px;
      color: $gray;
      margin-bottom: 20px;
    }
  }
}

.empty-icon {
  width: 80px;
  height: 80px;
  background: $sky-light;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $sky;
}

.empty-action {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
  border: none;
  border-radius: 14px;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba($sky-dark, 0.25);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba($sky-dark, 0.35);
  }
}
</style>
