<template>
  <div class="medication-card">
    <div class="medication-card__header">
      <div class="drug-info">
        <h4>{{ item.drug_name }}</h4>
        <p class="drug-details">{{ item.generic_name }} | {{ item.strength }}</p>
        <p v-if="item.manufacturer || item.batch_number" class="drug-meta">
          <span v-if="item.manufacturer" class="mfr">{{ item.manufacturer }}</span>
          <span v-if="item.batch_number" class="batch">Batch: {{ item.batch_number }}</span>
        </p>
      </div>
      <button class="remove-btn" @click="$emit('remove')">
        <v-icon name="hi-trash" scale="0.9" />
      </button>
    </div>

    <div class="medication-card__form">
      <div class="form-row">
        <div class="form-group">
          <label>Quantity *</label>
          <input
            :value="item.quantity"
            type="number"
            min="1"
            :max="item.available_quantity"
            @input="$emit('update', { ...item, quantity: Number($event.target.value) })"
          />
          <span class="help-text">Available: {{ item.available_quantity }}</span>
        </div>
        <div class="form-group">
          <label>Unit Price</label>
          <input
            :value="`NGN ${formatCurrency(item.unit_price)}`"
            type="text"
            disabled
          />
        </div>
        <div class="form-group">
          <label>Subtotal</label>
          <input
            :value="`NGN ${formatCurrency(item.quantity * item.unit_price)}`"
            type="text"
            disabled
          />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Dosage *</label>
          <input
            :value="item.dosage"
            type="text"
            placeholder="e.g., 1 tablet, 5ml"
            @input="$emit('update', { ...item, dosage: $event.target.value })"
          />
        </div>
        <div class="form-group">
          <label>Frequency *</label>
          <input
            :value="item.frequency"
            type="text"
            placeholder="e.g., twice daily"
            @input="$emit('update', { ...item, frequency: $event.target.value })"
          />
        </div>
        <div class="form-group">
          <label>Duration *</label>
          <input
            :value="item.duration"
            type="text"
            placeholder="e.g., 7 days"
            @input="$emit('update', { ...item, duration: $event.target.value })"
          />
        </div>
      </div>
      <div class="form-group full-width">
        <label>Additional Notes</label>
        <textarea
          :value="item.notes"
          rows="2"
          placeholder="Any special instructions..."
          @input="$emit('update', { ...item, notes: $event.target.value })"
        ></textarea>
      </div>
    </div>
  </div>
</template>

<script setup>
import { usePharmacy } from '../../composables/usePharmacy';

const { formatCurrency } = usePharmacy();

defineProps({
  item: { type: Object, required: true },
});

defineEmits(['remove', 'update']);
</script>

<style scoped lang="scss">
.medication-card {
  padding: $size-20;
  background: $color-g-97;
  border-radius: $size-12;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: $size-16;

    .drug-info {
      flex: 1;

      h4 {
        font-size: $size-16;
        font-weight: $fw-semi-bold;
        color: $color-g-21;
        margin-bottom: $size-4;
      }

      .drug-details {
        font-size: $size-13;
        color: $color-g-54;
      }

      .drug-meta {
        font-size: $size-12;
        color: $color-g-67;
        margin-top: $size-4;
        display: flex;
        gap: $size-12;

        .mfr { font-weight: $fw-medium; }
        .batch { color: $color-g-54; }
      }
    }

    .remove-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: #ef4444;
      padding: $size-6;
      border-radius: $size-6;
      transition: background 0.2s ease;

      &:hover {
        background: rgba(#ef4444, 0.1);
      }
    }
  }

  &__form {
    .form-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: $size-12;
      margin-bottom: $size-12;

      @include responsive(phone) {
        grid-template-columns: 1fr;
      }
    }

    .full-width {
      margin-top: $size-4;
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

  input,
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

    &:disabled {
      background: $color-g-92;
      color: $color-g-54;
    }

    &::placeholder {
      color: $color-g-67;
    }
  }

  textarea {
    resize: vertical;
  }

  .help-text {
    font-size: $size-11;
    color: $color-g-54;
  }
}
</style>
