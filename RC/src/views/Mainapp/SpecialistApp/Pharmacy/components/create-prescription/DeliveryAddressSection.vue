<template>
  <div class="delivery-address-section">
    <!-- Saved Addresses -->
    <div v-if="savedAddresses.length > 0 || profileAddress" class="saved-addresses">
      <label>Select an Address</label>
      <div class="address-options">
        <!-- Profile Address -->
        <div
          v-if="profileAddress"
          :class="['address-option', { selected: selectedAddressId === 'profile_address' }]"
          @click="selectExistingAddress(profileAddress)"
        >
          <div class="address-option__header">
            <span class="address-label">{{ profileAddress.label || 'Profile' }}</span>
            <span class="profile-badge">From Profile</span>
          </div>
          <div class="address-option__details">
            <p class="recipient">{{ profileAddress.recipient_name }}</p>
            <p class="address-line">{{ profileAddress.street }}</p>
            <p class="address-line">{{ formatAddressLine(profileAddress) }}</p>
            <p v-if="profileAddress.phone" class="phone">{{ profileAddress.phone }}</p>
          </div>
          <v-icon v-if="selectedAddressId === 'profile_address'" name="hi-check-circle" scale="0.9" class="selected-check" />
        </div>

        <!-- Saved Addresses -->
        <div
          v-for="address in savedAddresses"
          :key="address._id"
          :class="['address-option', { selected: selectedAddressId === address._id }]"
          @click="selectExistingAddress(address)"
        >
          <div class="address-option__header">
            <span class="address-label">{{ address.label }}</span>
            <span v-if="address.is_default" class="default-badge">Default</span>
          </div>
          <div class="address-option__details">
            <p class="recipient">{{ address.recipient_name }}</p>
            <p class="address-line">{{ address.street }}</p>
            <p class="address-line">{{ formatAddressLine(address) }}</p>
            <p v-if="address.phone" class="phone">{{ address.phone }}</p>
          </div>
          <v-icon v-if="selectedAddressId === address._id" name="hi-check-circle" scale="0.9" class="selected-check" />
        </div>

        <!-- Add New -->
        <div
          :class="['address-option add-new', { selected: selectedAddressId === 'new' }]"
          @click="selectNew"
        >
          <v-icon name="hi-plus" scale="1.2" />
          <span>Add New Address</span>
        </div>
      </div>
    </div>

    <!-- New Address Form -->
    <div v-if="showNewForm" class="new-address-form">
      <h4>{{ savedAddresses.length || profileAddress ? 'New Delivery Address' : 'Delivery Address' }}</h4>

      <div class="form-row">
        <div class="form-group">
          <label>Address Label *</label>
          <select :value="newAddress.label" @change="updateField('label', $event.target.value)">
            <option value="">Select label</option>
            <option value="Home">Home</option>
            <option value="Office">Office</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div class="form-group flex-2">
          <label>Recipient Name *</label>
          <input
            :value="newAddress.recipient_name"
            type="text"
            placeholder="Full name of person receiving delivery"
            @input="updateField('recipient_name', $event.target.value)"
          />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group flex-2">
          <label>Phone Number *</label>
          <input
            :value="newAddress.phone"
            type="tel"
            placeholder="e.g., 08012345678"
            @input="updateField('phone', $event.target.value)"
          />
        </div>
      </div>

      <div class="form-group">
        <label>Street Address *</label>
        <input
          :value="newAddress.street"
          type="text"
          placeholder="House number, street name, landmark"
          @input="updateField('street', $event.target.value)"
        />
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>City *</label>
          <input
            :value="newAddress.city"
            type="text"
            placeholder="City"
            @input="updateField('city', $event.target.value)"
          />
        </div>
        <div class="form-group">
          <label>State *</label>
          <select :value="newAddress.state" @change="updateField('state', $event.target.value)">
            <option value="">Select state</option>
            <option v-for="state in nigerianStates" :key="state" :value="state">{{ state }}</option>
          </select>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Postal Code</label>
          <input
            :value="newAddress.postal_code"
            type="text"
            placeholder="Optional"
            @input="updateField('postal_code', $event.target.value)"
          />
        </div>
        <div class="form-group flex-2">
          <label>Additional Info</label>
          <input
            :value="newAddress.additional_info"
            type="text"
            placeholder="e.g., Gate code, building color"
            @input="updateField('additional_info', $event.target.value)"
          />
        </div>
      </div>

      <div v-if="savedAddresses.length > 0 || profileAddress" class="checkbox-group">
        <label class="checkbox-label">
          <input
            type="checkbox"
            :checked="saveAddress"
            @change="$emit('update:saveAddress', $event.target.checked)"
          />
          <span>Save this address for future use</span>
        </label>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  savedAddresses: { type: Array, default: () => [] },
  profileAddress: { type: Object, default: null },
  selectedAddressId: { type: String, default: null },
  newAddress: { type: Object, required: true },
  saveAddress: { type: Boolean, default: true },
});

const emit = defineEmits(['select-address', 'select-new', 'update-address-field', 'update:saveAddress']);

const nigerianStates = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
  'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau',
  'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
];

const showNewForm = computed(() => {
  return props.selectedAddressId === 'new' || (!props.savedAddresses.length && !props.profileAddress);
});

function selectExistingAddress(address) {
  emit('select-address', address);
}

function selectNew() {
  emit('select-new');
}

function updateField(field, value) {
  emit('update-address-field', { field, value });
}

function formatAddressLine(address) {
  if (!address) return '';
  const parts = [];
  if (address.city) parts.push(address.city);
  if (address.state && address.state !== address.city) parts.push(address.state);
  if (address.postal_code) parts.push(address.postal_code);
  if (address.country) parts.push(address.country);
  return parts.join(', ');
}
</script>

<style scoped lang="scss">
.delivery-address-section {
  margin-top: $size-16;
}

.saved-addresses {
  > label {
    font-size: $size-14;
    font-weight: $fw-medium;
    color: $color-g-36;
    margin-bottom: $size-12;
    display: block;
  }
}

.address-options {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: $size-12;
  margin-bottom: $size-16;
}

.address-option {
  padding: $size-16;
  border: 2px solid $color-g-90;
  border-radius: $size-12;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;

  &:hover {
    border-color: $color-g-77;
  }

  &.selected {
    border-color: $color-pri;
    background: rgba($color-pri, 0.03);
  }

  &.add-new {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: $size-12;
    min-height: 140px;
    color: $color-g-54;
    border-style: dashed;

    &:hover {
      color: $color-pri;
      border-color: $color-pri;
    }
  }

  .selected-check {
    position: absolute;
    top: $size-12;
    right: $size-12;
    color: $color-pri;
  }

  &__header {
    display: flex;
    align-items: center;
    gap: $size-8;
    margin-bottom: $size-8;

    .address-label {
      font-size: $size-14;
      font-weight: $fw-semi-bold;
      color: $color-g-21;
    }

    .default-badge,
    .profile-badge {
      font-size: $size-11;
      padding: $size-2 $size-8;
      border-radius: $size-12;
      font-weight: $fw-medium;
    }

    .default-badge {
      background: rgba(#10b981, 0.1);
      color: #10b981;
    }

    .profile-badge {
      background: rgba($color-pri, 0.1);
      color: $color-pri;
    }
  }

  &__details {
    .recipient {
      font-size: $size-14;
      font-weight: $fw-medium;
      color: $color-g-21;
      margin-bottom: $size-4;
    }

    .address-line {
      font-size: $size-12;
      color: $color-g-54;
      line-height: 1.4;
    }

    .phone {
      font-size: $size-12;
      color: $color-g-44;
      margin-top: $size-6;
    }
  }
}

.new-address-form {
  background: $color-g-97;
  padding: $size-20;
  border-radius: $size-12;

  h4 {
    font-size: $size-16;
    font-weight: $fw-semi-bold;
    color: $color-g-21;
    margin-bottom: $size-16;
  }
}

.form-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $size-12;
  margin-bottom: $size-12;

  @include responsive(phone) {
    grid-template-columns: 1fr;
  }

  .flex-2 {
    grid-column: span 1;
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: $size-6;
  margin-bottom: $size-12;

  label {
    font-size: $size-12;
    font-weight: $fw-medium;
    color: $color-g-44;
  }

  input,
  select {
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
}

.checkbox-group {
  margin-top: $size-12;

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: $size-10;
    cursor: pointer;
    font-size: $size-14;
    color: $color-g-44;

    input[type='checkbox'] {
      width: $size-18;
      height: $size-18;
      accent-color: $color-pri;
      cursor: pointer;
    }
  }
}
</style>
