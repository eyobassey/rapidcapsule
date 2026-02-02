<template>
  <div class="prescriptions-tab">
    <!-- Skeleton Loading -->
    <div v-if="loading" class="prescriptions-skeleton">
      <div v-for="i in 4" :key="i" class="skeleton-card" />
    </div>

    <!-- Prescriptions List -->
    <div v-else-if="prescriptions.length" class="prescriptions-list">
      <div
        v-for="prescription in prescriptions"
        :key="prescription._id"
        class="prescription-card"
        @click="$emit('view-prescription', prescription._id)"
      >
        <div class="prescription-card__accent" />
        <div class="prescription-card__body">
          <div class="prescription-card__header">
            <span class="prescription-number">{{ prescription.prescription_number }}</span>
            <PharmacyStatusBadge :status="prescription.status" />
          </div>
          <div class="prescription-card__content">
            <p class="items-count">
              <v-icon name="ri-capsule-line" scale="0.7" />
              {{ prescription.items?.length || 0 }} medications
            </p>
            <p class="prescription-date">
              <v-icon name="hi-calendar" scale="0.65" />
              {{ formatDate(prescription.created_at) }}
            </p>
          </div>
          <div class="prescription-card__footer">
            <span class="amount">NGN {{ formatCurrency(prescription.total_amount) }}</span>
            <v-icon name="hi-chevron-right" scale="0.8" class="arrow" />
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <div class="empty-state__icon">
        <v-icon name="ri-capsule-line" scale="1.8" />
      </div>
      <h3>No prescriptions found</h3>
      <p>No prescriptions have been created for this patient yet</p>
      <button class="empty-state__action" @click="$emit('create-prescription')">
        <v-icon name="hi-plus" scale="0.8" />
        Create Prescription
      </button>
    </div>
  </div>
</template>

<script setup>
import PharmacyStatusBadge from './PharmacyStatusBadge.vue';
import { usePharmacy } from '../composables/usePharmacy';

const { formatCurrency, formatDate } = usePharmacy();

defineProps({
  prescriptions: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
});

defineEmits(['view-prescription', 'create-prescription']);
</script>

<style scoped lang="scss">
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

.prescriptions-list {
  display: flex;
  flex-direction: column;
  gap: $size-12;
}

.prescription-card {
  display: flex;
  border-radius: $size-16;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  background: $color-white;

  &:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    transform: translateY(-2px);
  }

  &__accent {
    width: 4px;
    background: #0EAEC4;
    flex-shrink: 0;
  }

  &__body {
    flex: 1;
    padding: $size-16 $size-20;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $size-12;

    .prescription-number {
      font-size: $size-15;
      font-weight: $fw-semi-bold;
      color: $color-g-21;
    }
  }

  &__content {
    margin-bottom: $size-12;

    .items-count {
      display: flex;
      align-items: center;
      gap: $size-6;
      font-size: $size-13;
      color: $color-g-44;

      svg {
        color: #0EAEC4;
      }
    }

    .prescription-date {
      display: flex;
      align-items: center;
      gap: $size-6;
      font-size: $size-12;
      color: $color-g-54;
      margin-top: $size-4;

      svg {
        color: $color-g-67;
      }
    }
  }

  &__footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: $size-12;
    border-top: 1px solid $color-g-92;

    .amount {
      font-size: $size-16;
      font-weight: $fw-bold;
      color: #0EAEC4;
    }

    .arrow {
      color: $color-g-67;
      transition: transform 0.2s ease;
    }
  }

  &:hover .arrow {
    transform: translateX(3px);
    color: #0EAEC4;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $size-48 $size-24;
  text-align: center;

  &__icon {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    background: rgba(#0EAEC4, 0.08);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: $size-16;

    svg {
      color: #0EAEC4;
    }
  }

  h3 {
    font-size: $size-16;
    font-weight: $fw-semi-bold;
    color: $color-g-36;
    margin-bottom: $size-6;
  }

  p {
    font-size: $size-14;
    color: $color-g-54;
    margin-bottom: $size-20;
  }

  &__action {
    display: flex;
    align-items: center;
    gap: $size-6;
    padding: $size-10 $size-20;
    background: rgba(14, 174, 196, 0.1);
    color: #0EAEC4;
    border: none;
    border-radius: $size-10;
    font-size: $size-14;
    font-weight: $fw-semi-bold;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(14, 174, 196, 0.18);
    }
  }
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
