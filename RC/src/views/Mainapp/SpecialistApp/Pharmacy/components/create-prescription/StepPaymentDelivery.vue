<template>
  <div class="step-payment-delivery">
    <h2>Payment & Delivery</h2>

    <!-- Payment Method -->
    <div class="section-card">
      <h3>Payment Method</h3>
      <div class="payment-options">
        <!-- Specialist Wallet -->
        <PaymentMethodOption
          title="Pay from Wallet"
          description="Use your pharmacy wallet balance"
          icon="bi-wallet2"
          :isSelected="paymentMethod === 'specialist_wallet'"
          @select="$emit('update:paymentMethod', 'specialist_wallet')"
        >
          <template #details>
            <p class="wallet-balance">Balance: NGN {{ formatCurrency(walletBalance) }}</p>
          </template>
        </PaymentMethodOption>

        <!-- Patient Wallet -->
        <PaymentMethodOption
          title="Charge Patient Wallet"
          description="Deduct from patient's wallet balance"
          icon="bi-wallet2"
          iconClass="patient-wallet"
          :isSelected="paymentMethod === 'patient_wallet'"
          :disabled="!allowPatientWalletCharge || patientWalletBalance === 0"
          @select="onPatientWalletSelect"
        >
          <template #details>
            <div v-if="loadingPatientWallet" class="loading-inline">
              <div class="spinner-small" />
            </div>
            <template v-else>
              <p v-if="!allowPatientWalletCharge" class="warning-text muted">
                Patient has disabled wallet charges
              </p>
              <template v-else>
                <p class="wallet-balance patient">Balance: NGN {{ formatCurrency(patientWalletBalance) }}</p>
                <p v-if="patientWalletBalance < subtotal && patientWalletBalance > 0" class="warning-text amber">
                  Partial payment - NGN {{ formatCurrency(subtotal - patientWalletBalance) }} remaining
                </p>
                <p v-if="patientWalletBalance === 0" class="warning-text red">
                  Patient has no wallet balance
                </p>
              </template>
            </template>
          </template>
        </PaymentMethodOption>

        <!-- Remaining Payment Method (for partial payments) -->
        <div v-if="paymentMethod === 'patient_wallet' && patientWalletBalance > 0 && patientWalletBalance < subtotal" class="remaining-payment">
          <label>How should the remaining amount be collected?</label>
          <div class="remaining-options">
            <div
              :class="['remaining-option', { selected: remainingPaymentMethod === 'online' }]"
              @click="$emit('update:remainingPaymentMethod', 'online')"
            >
              <v-icon name="hi-credit-card" scale="0.8" />
              <span>Online Payment</span>
            </div>
            <div
              :class="['remaining-option', { selected: remainingPaymentMethod === 'cash' }]"
              @click="$emit('update:remainingPaymentMethod', 'cash')"
            >
              <v-icon name="bi-cash" scale="0.8" />
              <span>Cash on Delivery</span>
            </div>
          </div>
        </div>

        <!-- Patient Online -->
        <PaymentMethodOption
          title="Patient Online Payment"
          description="Send payment link to patient"
          icon="hi-credit-card"
          :isSelected="paymentMethod === 'patient_online'"
          @select="$emit('update:paymentMethod', 'patient_online')"
        />

        <!-- Cash Payment -->
        <PaymentMethodOption
          title="Cash Payment"
          description="Patient pays in cash on delivery/pickup"
          icon="bi-cash"
          :isSelected="paymentMethod === 'patient_cash'"
          @select="$emit('update:paymentMethod', 'patient_cash')"
        />

        <!-- Send to Patient -->
        <PaymentMethodOption
          title="Send to Patient"
          description="Patient reviews, accepts, and pays themselves"
          icon="hi-paper-airplane"
          iconClass="self-service"
          :isSelected="paymentMethod === 'send_to_patient'"
          @select="$emit('update:paymentMethod', 'send_to_patient')"
        >
          <template #details>
            <p class="note-text purple">PDF generated, 48h validity</p>
          </template>
        </PaymentMethodOption>
      </div>
    </div>

    <!-- Delivery Information -->
    <div class="section-card">
      <h3>Delivery Information</h3>
      <div class="form-group">
        <label>Delivery Type</label>
        <select :value="deliveryType" @change="$emit('update:deliveryType', $event.target.value)">
          <option value="PICKUP">Pickup at Clinic</option>
          <option value="DELIVERY">Home Delivery</option>
          <option value="PICKUP_CENTER">Pickup at Pharmacy</option>
        </select>
      </div>

      <!-- Pickup Center Selection -->
      <PickupCenterSection
        v-if="deliveryType === 'PICKUP_CENTER'"
        :selectedCenter="selectedPickupCenter"
        :selectedCenterId="selectedPickupCenterId"
        @select="$emit('select-pickup-center', $event)"
        @clear="$emit('clear-pickup-center')"
      />

      <!-- Delivery Address -->
      <DeliveryAddressSection
        v-if="deliveryType === 'DELIVERY'"
        :savedAddresses="savedAddresses"
        :profileAddress="profileAddress"
        :selectedAddressId="selectedAddressId"
        :newAddress="newAddress"
        :saveAddress="saveNewAddress"
        @select-address="$emit('select-address', $event)"
        @select-new="$emit('select-new-address')"
        @update-address-field="$emit('update-address-field', $event)"
        @update:saveAddress="$emit('update:saveNewAddress', $event)"
      />
    </div>

    <!-- Notes -->
    <div class="section-card">
      <h3>Prescription Notes</h3>
      <div class="form-group">
        <label>Notes for Patient (Optional)</label>
        <textarea
          :value="prescriptionNotes"
          rows="3"
          placeholder="Any additional notes for the patient..."
          @input="$emit('update:prescriptionNotes', $event.target.value)"
        ></textarea>
      </div>
    </div>

    <!-- Final Summary -->
    <OrderSummary
      :isFinal="true"
      :total="subtotal"
      :itemCount="itemCount"
      :patientName="patientName"
      :paymentMethodLabel="paymentMethodLabel"
      :deliveryTypeLabel="deliveryTypeLabel"
      :deliveryType="deliveryType"
      :deliveryAddress="deliveryAddressForSummary"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useToast } from 'vue-toast-notification';
import PaymentMethodOption from './PaymentMethodOption.vue';
import DeliveryAddressSection from './DeliveryAddressSection.vue';
import PickupCenterSection from './PickupCenterSection.vue';
import OrderSummary from './OrderSummary.vue';
import { usePharmacy } from '../../composables/usePharmacy';

const { formatCurrency } = usePharmacy();
const $toast = useToast();

const props = defineProps({
  paymentMethod: { type: String, default: 'specialist_wallet' },
  deliveryType: { type: String, default: 'PICKUP' },
  prescriptionNotes: { type: String, default: '' },
  walletBalance: { type: Number, default: 0 },
  patientWalletBalance: { type: Number, default: 0 },
  loadingPatientWallet: { type: Boolean, default: false },
  allowPatientWalletCharge: { type: Boolean, default: true },
  remainingPaymentMethod: { type: String, default: 'online' },
  subtotal: { type: Number, default: 0 },
  itemCount: { type: Number, default: 0 },
  patientName: { type: String, default: '' },
  // Delivery
  savedAddresses: { type: Array, default: () => [] },
  profileAddress: { type: Object, default: null },
  selectedAddressId: { type: String, default: null },
  selectedAddress: { type: Object, default: null },
  newAddress: { type: Object, default: () => ({}) },
  saveNewAddress: { type: Boolean, default: true },
  // Pickup
  selectedPickupCenter: { type: Object, default: null },
  selectedPickupCenterId: { type: String, default: null },
});

const emit = defineEmits([
  'update:paymentMethod',
  'update:deliveryType',
  'update:prescriptionNotes',
  'update:remainingPaymentMethod',
  'update:saveNewAddress',
  'select-address',
  'select-new-address',
  'update-address-field',
  'select-pickup-center',
  'clear-pickup-center',
]);

const PAYMENT_METHODS = {
  specialist_wallet: 'Pay from Wallet',
  patient_wallet: 'Charge Patient Wallet',
  patient_online: 'Patient Online Payment',
  patient_cash: 'Cash Payment',
  send_to_patient: 'Send to Patient',
};

const DELIVERY_TYPES = {
  PICKUP: 'Pickup at Clinic',
  DELIVERY: 'Home Delivery',
  PICKUP_CENTER: 'Pickup at Pharmacy',
};

const paymentMethodLabel = computed(() => PAYMENT_METHODS[props.paymentMethod] || props.paymentMethod);
const deliveryTypeLabel = computed(() => DELIVERY_TYPES[props.deliveryType] || props.deliveryType);

const deliveryAddressForSummary = computed(() => {
  if (props.deliveryType === 'DELIVERY') {
    if (props.selectedAddressId === 'new' || (!props.savedAddresses.length && !props.profileAddress)) {
      return props.newAddress;
    }
    return props.selectedAddress;
  }
  if (props.deliveryType === 'PICKUP_CENTER' && props.selectedPickupCenter) {
    return {
      name: props.selectedPickupCenter.name,
      street: props.selectedPickupCenter.address?.street,
      city: props.selectedPickupCenter.address?.city,
      state: props.selectedPickupCenter.address?.state,
      phone: props.selectedPickupCenter.contact?.phone,
    };
  }
  return null;
});

function onPatientWalletSelect() {
  if (!props.allowPatientWalletCharge) {
    $toast.warning('Patient has disabled specialist wallet charges');
    return;
  }
  if (props.patientWalletBalance === 0) {
    $toast.warning('Patient has no wallet balance');
    return;
  }
  emit('update:paymentMethod', 'patient_wallet');
}
</script>

<style scoped lang="scss">
.step-payment-delivery {
  h2 {
    font-size: $size-20;
    font-weight: $fw-semi-bold;
    color: $color-g-21;
    margin-bottom: $size-20;
  }
}

.section-card {
  background: $color-white;
  padding: $size-20;
  border-radius: $size-12;
  margin-bottom: $size-16;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);

  h3 {
    font-size: $size-16;
    font-weight: $fw-semi-bold;
    color: $color-g-21;
    margin-bottom: $size-16;
  }
}

.payment-options {
  display: flex;
  flex-direction: column;
  gap: $size-12;
}

.wallet-balance {
  margin-top: $size-4;
  font-size: $size-15;
  font-weight: $fw-semi-bold;
  color: $color-pri;

  &.patient {
    color: #10b981;
  }
}

.warning-text {
  font-size: $size-11;
  margin-top: $size-4;
  font-weight: $fw-medium;

  &.amber { color: #f59e0b; }
  &.red { color: #ef4444; }
  &.muted {
    color: #6b7280;
    font-style: italic;
  }
}

.note-text {
  font-size: $size-11;
  margin-top: $size-4;
  font-weight: $fw-medium;

  &.purple { color: #8b5cf6; }
}

.loading-inline {
  margin-top: $size-4;

  .spinner-small {
    width: 14px;
    height: 14px;
    border: 2px solid $color-g-85;
    border-top-color: $color-pri;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
}

.remaining-payment {
  padding: $size-16;
  background: $color-g-97;
  border-radius: $size-10;

  > label {
    font-size: $size-13;
    font-weight: $fw-medium;
    color: $color-g-36;
    display: block;
    margin-bottom: $size-12;
  }

  .remaining-options {
    display: flex;
    gap: $size-12;
  }

  .remaining-option {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $size-8;
    padding: $size-12;
    border: 2px solid $color-g-85;
    border-radius: $size-8;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: $size-13;
    color: $color-g-44;

    &:hover {
      border-color: $color-g-67;
    }

    &.selected {
      border-color: $color-pri;
      background: rgba($color-pri, 0.05);
      color: $color-pri;
    }
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: $size-6;

  label {
    font-size: $size-12;
    font-weight: $fw-medium;
    color: $color-g-44;
  }

  select,
  textarea {
    padding: $size-10 $size-12;
    border: 1px solid $color-g-85;
    border-radius: $size-8;
    font-size: $size-14;
    color: $color-g-21;
    background: $color-white;

    &:focus {
      outline: none;
      border-color: $color-pri;
    }

    &::placeholder {
      color: $color-g-67;
    }
  }

  select {
    cursor: pointer;
  }

  textarea {
    resize: vertical;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
