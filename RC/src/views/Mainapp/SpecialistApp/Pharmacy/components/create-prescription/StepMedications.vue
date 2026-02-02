<template>
  <div class="step-medications">
    <div class="medications-header">
      <h2>Add Medications</h2>
      <button class="btn btn-secondary" @click="showDrugSearch = true">
        <v-icon name="hi-plus" scale="0.8" />
        Add Drug
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
    <div v-else class="empty-medications">
      <v-icon name="ri-capsule-line" scale="2" />
      <p>No medications added yet</p>
      <button class="btn btn-primary" @click="showDrugSearch = true">
        <v-icon name="hi-plus" scale="0.8" />
        Add First Medication
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
.step-medications {
  background: $color-white;
  padding: $size-24;
  border-radius: $size-12;
}

.medications-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $size-20;

  h2 {
    font-size: $size-20;
    font-weight: $fw-semi-bold;
    color: $color-g-21;
  }
}

.medications-list {
  display: flex;
  flex-direction: column;
  gap: $size-16;
}

.empty-medications {
  text-align: center;
  padding: $size-48 $size-24;
  color: $color-g-54;

  p {
    margin: $size-16 0;
    font-size: $size-15;
  }
}

.btn {
  padding: $size-10 $size-20;
  border-radius: $size-8;
  font-size: $size-14;
  font-weight: $fw-medium;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: $size-6;

  &-primary {
    background: $color-pri;
    color: $color-white;

    &:hover {
      background: darken($color-pri, 10%);
    }
  }

  &-secondary {
    background: $color-g-92;
    color: $color-g-36;

    &:hover {
      background: $color-g-85;
    }
  }
}
</style>
