<template>
  <div class="step-medications">
    <!-- Section Header -->
    <div class="section-header">
      <div class="section-header__left">
        <div class="section-header__icon emerald">
          <v-icon name="ri-capsule-line" scale="1.1" />
        </div>
        <div class="section-header__content">
          <h2>Add Medications</h2>
          <p>Add drugs with dosage and frequency instructions</p>
        </div>
      </div>
      <button class="add-drug-btn" @click="showDrugSearch = true">
        <v-icon name="hi-plus" scale="0.9" />
        <span>Add Drug</span>
      </button>
    </div>

    <!-- Medications List -->
    <div v-if="items.length" class="medications-list">
      <MedicationItemCard
        v-for="(item, index) in items"
        :key="`${item.drug_id}-${item.batch_id || index}`"
        :item="item"
        @remove="$emit('remove-drug', index)"
        @update="$emit('update-drug', { index, item: $event })"
      />
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <div class="empty-state__visual">
        <div class="empty-orb">
          <div class="orb-ring"></div>
          <div class="orb-core">
            <v-icon name="ri-capsule-line" scale="1.5" />
          </div>
        </div>
      </div>
      <p class="empty-state__title">No medications added yet</p>
      <p class="empty-state__text">Start by adding drugs to the prescription</p>
      <button class="add-drug-btn add-drug-btn--primary" @click="showDrugSearch = true">
        <v-icon name="hi-plus" scale="0.9" />
        <span>Add First Medication</span>
      </button>
    </div>

    <!-- Order Summary -->
    <OrderSummary
      v-if="items.length"
      :total="subtotal"
      :itemCount="items.length"
    />

    <!-- Drug Search Modal -->
    <DrugSearchModal
      v-if="showDrugSearch"
      @close="showDrugSearch = false"
      @select="onDrugSelect"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useToast } from 'vue-toast-notification';
import MedicationItemCard from './MedicationItemCard.vue';
import DrugSearchModal from './DrugSearchModal.vue';
import OrderSummary from './OrderSummary.vue';

const $toast = useToast();

const props = defineProps({
  items: { type: Array, default: () => [] },
  subtotal: { type: Number, default: 0 },
});

const emit = defineEmits(['add-drug', 'remove-drug', 'update-drug']);

const showDrugSearch = ref(false);

function onDrugSelect(drug) {
  // Check for duplicate (same drug + same batch)
  const duplicateKey = drug.batch_id ? `${drug._id}-${drug.batch_id}` : drug._id;
  const exists = props.items.find(item => {
    const itemKey = item.batch_id ? `${item.drug_id}-${item.batch_id}` : item.drug_id;
    return itemKey === duplicateKey;
  });

  if (exists) {
    $toast.warning('This medication batch is already in the list');
    return;
  }

  emit('add-drug', {
    drug_id: drug._id,
    batch_id: drug.batch_id || null,
    batch_number: drug.batch_number || null,
    drug_name: drug.name,
    generic_name: drug.generic_name,
    strength: drug.strength,
    dosage_form: drug.dosage_form,
    manufacturer: drug.manufacturer || null,
    unit_price: drug.selling_price,
    quantity: 1,
    available_quantity: drug.quantity,
    expiry_date: drug.expiry_date || null,
    dosage: '',
    frequency: '',
    duration: '',
    notes: '',
  });

  showDrugSearch.value = false;
}
</script>

<style scoped lang="scss">
// Design Tokens
$sky: #4FC3F7;
$sky-light: #E1F5FE;
$sky-dark: #0288D1;
$navy: #0F172A;
$slate: #334155;
$gray: #64748B;
$light-gray: #94A3B8;
$bg: #F8FAFC;
$emerald: #10B981;
$emerald-light: #D1FAE5;

.step-medications {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

// Section Header
.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;

  &__left {
    display: flex;
    align-items: flex-start;
    gap: 16px;
  }

  &__icon {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &.emerald { background: $emerald-light; color: $emerald; }
  }

  &__content {
    h2 {
      font-size: 20px;
      font-weight: 700;
      color: $navy;
      margin: 0 0 4px;
    }

    p {
      font-size: 14px;
      color: $gray;
      margin: 0;
    }
  }
}

// Add Drug Button
.add-drug-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: $bg;
  border: 2px solid #E2E8F0;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  color: $slate;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: white;
    border-color: $emerald;
    color: $emerald;
    box-shadow: 0 4px 12px rgba($emerald, 0.15);
  }

  &--primary {
    background: linear-gradient(135deg, $emerald, darken($emerald, 8%));
    border: none;
    color: white;
    box-shadow: 0 4px 15px rgba($emerald, 0.3);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba($emerald, 0.4);
      color: white;
    }
  }
}

// Medications List
.medications-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

// Empty State
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 48px 24px;

  &__visual {
    margin-bottom: 24px;
  }

  &__title {
    font-size: 18px;
    font-weight: 600;
    color: $navy;
    margin: 0 0 8px;
  }

  &__text {
    font-size: 14px;
    color: $gray;
    margin: 0 0 24px;
  }
}

.empty-orb {
  position: relative;
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;

  .orb-ring {
    position: absolute;
    inset: 0;
    border: 2px solid $emerald-light;
    border-radius: 50%;
    animation: spin-slow 20s linear infinite;
  }

  .orb-core {
    width: 64px;
    height: 64px;
    background: $emerald-light;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $emerald;
  }
}

@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
