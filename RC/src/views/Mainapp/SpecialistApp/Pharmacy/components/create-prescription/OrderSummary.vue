<template>
  <div :class="['order-summary', { final: isFinal }]">
    <div class="summary-header">
      <div class="summary-header__icon">
        <v-icon name="hi-receipt-tax" scale="0.9" />
      </div>
      <h3>{{ isFinal ? 'Final Summary' : 'Order Summary' }}</h3>
    </div>

    <div class="summary-details">
      <!-- Patient (final only) -->
      <div v-if="isFinal && patientName" class="summary-item">
        <span class="label">Patient</span>
        <span class="value">{{ patientName }}</span>
      </div>

      <!-- Items count -->
      <div class="summary-item">
        <span class="label">{{ isFinal ? 'Medications' : `Items (${itemCount})` }}</span>
        <span class="value">{{ isFinal ? `${itemCount} items` : `NGN ${formatCurrency(total)}` }}</span>
      </div>

      <!-- Payment Method (final only) -->
      <div v-if="isFinal && paymentMethodLabel" class="summary-item">
        <span class="label">Payment Method</span>
        <span class="value">{{ paymentMethodLabel }}</span>
      </div>

      <!-- Delivery (final only) -->
      <div v-if="isFinal && deliveryTypeLabel" class="summary-item">
        <span class="label">Delivery</span>
        <span class="value">{{ deliveryTypeLabel }}</span>
      </div>

      <!-- Delivery Address (final only) -->
      <div v-if="isFinal && deliveryAddress" class="summary-item address">
        <span class="label">{{ deliveryType === 'PICKUP_CENTER' ? 'Pickup Center' : 'Delivery Address' }}</span>
        <div class="value address-preview">
          <p v-if="deliveryAddress.name">{{ deliveryAddress.name }}</p>
          <p v-if="deliveryAddress.recipient_name">{{ deliveryAddress.recipient_name }}</p>
          <p v-if="deliveryAddress.street">{{ deliveryAddress.street }}</p>
          <p v-if="deliveryAddress.city || deliveryAddress.state">
            {{ [deliveryAddress.city, deliveryAddress.state].filter(Boolean).join(', ') }}
          </p>
          <p v-if="deliveryAddress.phone">{{ deliveryAddress.phone }}</p>
        </div>
      </div>

      <!-- Total -->
      <div class="summary-item total">
        <span class="label">Total Amount</span>
        <span class="value">NGN {{ formatCurrency(total) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { usePharmacy } from '../../composables/usePharmacy';

const { formatCurrency } = usePharmacy();

defineProps({
  isFinal: { type: Boolean, default: false },
  total: { type: Number, default: 0 },
  itemCount: { type: Number, default: 0 },
  patientName: { type: String, default: '' },
  paymentMethodLabel: { type: String, default: '' },
  deliveryTypeLabel: { type: String, default: '' },
  deliveryType: { type: String, default: '' },
  deliveryAddress: { type: Object, default: null },
});
</script>

<style scoped lang="scss">
// Design Tokens
$sky: #4FC3F7;
$sky-light: #E1F5FE;
$sky-dark: #0288D1;
$navy: #0F172A;
$slate: #334155;
$gray: #64748B;
$bg: #F8FAFC;
$emerald: #10B981;
$emerald-light: #D1FAE5;

.order-summary {
  margin-top: 24px;
  padding: 20px;
  background: $bg;
  border-radius: 16px;
  border: 2px solid #E2E8F0;

  &.final {
    background: linear-gradient(135deg, $sky-light, lighten($sky-light, 3%));
    border-color: rgba($sky, 0.3);
  }
}

.summary-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;

  &__icon {
    width: 36px;
    height: 36px;
    background: rgba($sky-dark, 0.1);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $sky-dark;

    .final & {
      background: $sky-dark;
      color: white;
    }
  }

  h3 {
    font-size: 16px;
    font-weight: 700;
    color: $navy;
    margin: 0;
  }
}

.summary-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;

  .label {
    color: $gray;
    font-weight: 500;
  }

  .value {
    font-weight: 600;
    color: $navy;
  }

  &.total {
    border-top: 2px solid rgba($sky, 0.2);
    padding-top: 14px;
    margin-top: 4px;
    font-size: 16px;

    .label {
      color: $slate;
      font-weight: 600;
    }

    .value {
      font-weight: 800;
      color: $sky-dark;
      font-size: 18px;
    }

    .final & {
      border-top-color: $sky;

      .value {
        color: $sky-dark;
      }
    }
  }

  &.address {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;

    .address-preview {
      font-weight: normal;
      padding: 10px 14px;
      background: rgba(255, 255, 255, 0.6);
      border-radius: 10px;
      width: 100%;

      p {
        font-size: 13px;
        line-height: 1.5;
        color: $slate;
        margin: 0;
      }
    }
  }
}
</style>
