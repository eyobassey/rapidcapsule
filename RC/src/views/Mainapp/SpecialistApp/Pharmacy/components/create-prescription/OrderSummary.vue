<template>
  <div :class="['order-summary', { final: isFinal }]">
    <h3>{{ isFinal ? 'Final Summary' : 'Order Summary' }}</h3>
    <div class="summary-details">
      <!-- Patient (final only) -->
      <div v-if="isFinal && patientName" class="summary-item">
        <span class="label">Patient</span>
        <span class="value">{{ patientName }}</span>
      </div>

      <!-- Items count -->
      <div class="summary-item">
        <span class="label">{{ isFinal ? 'Items' : `Subtotal (${itemCount} items)` }}</span>
        <span class="value">{{ isFinal ? `${itemCount} medications` : `NGN ${formatCurrency(total)}` }}</span>
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
.order-summary {
  margin-top: $size-24;
  padding: $size-20;
  background: $color-g-97;
  border-radius: $size-12;

  &.final {
    background: rgba($color-pri, 0.05);
    border: 1px solid rgba($color-pri, 0.2);
  }

  h3 {
    font-size: $size-16;
    font-weight: $fw-semi-bold;
    color: $color-g-21;
    margin-bottom: $size-16;
  }
}

.summary-details {
  display: flex;
  flex-direction: column;
  gap: $size-10;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: $size-15;

  .label {
    color: $color-g-54;
  }

  .value {
    font-weight: $fw-medium;
    color: $color-g-21;
  }

  &.total {
    border-top: 1px solid $color-g-85;
    padding-top: $size-12;
    margin-top: $size-8;
    font-size: $size-16;

    .value {
      font-weight: $fw-bold;
      color: $color-pri;
    }
  }

  &.address {
    flex-direction: column;
    align-items: flex-start;
    gap: $size-8;

    .address-preview {
      font-weight: normal;

      p {
        font-size: $size-14;
        line-height: 1.5;
        color: $color-g-44;
        margin: 0;
      }
    }
  }
}
</style>
