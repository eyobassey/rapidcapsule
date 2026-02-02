<template>
  <div class="step-patient-select">
    <h2>Select Patient</h2>

    <!-- Patient Search -->
    <div class="search-bar">
      <v-icon name="hi-search" scale="0.9" />
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search by name, email, or phone..."
        @input="onSearch"
      />
    </div>

    <!-- Searching State -->
    <div v-if="searching" class="loading-state">
      <div class="spinner" />
      <span>Searching patients...</span>
    </div>

    <!-- Search Results -->
    <div v-else-if="results.length" class="patient-results">
      <div
        v-for="patient in results"
        :key="patient._id"
        :class="['patient-option', { selected: selectedPatient?._id === patient._id }]"
        @click="selectPatient(patient)"
      >
        <RcAvatar
          :firstName="patient.full_name?.split(' ')[0]"
          :lastName="patient.full_name?.split(' ')[1]"
          :modelValue="patient.profile_image"
          size="sm"
        />
        <div class="patient-info">
          <p class="patient-name">{{ patient.full_name }}</p>
          <p class="patient-email">{{ patient.email }}</p>
        </div>
        <v-icon v-if="selectedPatient?._id === patient._id" name="hi-check-circle" scale="1" class="check-icon" />
      </div>
    </div>

    <!-- No Results -->
    <p v-else-if="searchQuery && !searching" class="no-results">
      No patients found
    </p>

    <!-- Selected Patient Card -->
    <div v-if="selectedPatient" class="selected-patient-card">
      <h3>Selected Patient</h3>
      <div class="patient-details">
        <RcAvatar
          :firstName="selectedPatient.full_name?.split(' ')[0]"
          :lastName="selectedPatient.full_name?.split(' ')[1]"
          :modelValue="selectedPatient.profile_image"
          size="md"
        />
        <div class="patient-info">
          <p class="patient-name">{{ selectedPatient.full_name }}</p>
          <p class="patient-email">{{ selectedPatient.email }}</p>
          <p class="patient-phone">{{ selectedPatient.phone || 'No phone' }}</p>
        </div>
      </div>
    </div>

    <!-- Pre-selected Drug Indicator -->
    <div v-if="preSelectedDrug" class="preselected-drug-card">
      <h3>
        <v-icon name="ri-capsule-line" scale="0.8" />
        Pre-selected Medication
      </h3>
      <div class="drug-preview">
        <div class="drug-image">
          <img v-if="preSelectedDrug.primary_image" :src="preSelectedDrug.primary_image" :alt="preSelectedDrug.name" />
          <v-icon v-else name="ri-capsule-line" scale="1.2" />
        </div>
        <div class="drug-info">
          <p class="drug-name">{{ preSelectedDrug.name }}</p>
          <p class="drug-details">{{ preSelectedDrug.generic_name }} | {{ preSelectedDrug.strength }}</p>
          <p class="drug-price">NGN {{ formatCurrency(preSelectedDrug.selling_price) }}</p>
        </div>
      </div>
      <p class="drug-note">This medication will be automatically added when you proceed to the next step.</p>
    </div>

    <!-- Loading Pre-selected Drug -->
    <div v-if="loadingPreSelectedDrug" class="loading-state">
      <div class="spinner" />
      <span>Loading medication...</span>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { debounce } from 'lodash';
import RcAvatar from '@/components/RCAvatar';
import apiFactory from '@/services/apiFactory';
import { usePharmacy } from '../../composables/usePharmacy';

const { formatCurrency } = usePharmacy();

const props = defineProps({
  selectedPatient: { type: Object, default: null },
  preSelectedDrug: { type: Object, default: null },
  loadingPreSelectedDrug: { type: Boolean, default: false },
});

const emit = defineEmits(['select-patient']);

const searchQuery = ref('');
const searching = ref(false);
const results = ref([]);

const debouncedSearch = debounce(fetchPatients, 300);

function onSearch() {
  debouncedSearch();
}

async function fetchPatients() {
  if (!searchQuery.value) {
    results.value = [];
    return;
  }
  try {
    searching.value = true;
    const response = await apiFactory.$_searchPharmacyPatients({
      search: searchQuery.value,
      type: 'all',
      limit: 10,
    });
    const result = response.data?.data || response.data?.result;
    results.value = result?.docs || [];
  } catch (error) {
    console.error('Error searching patients:', error);
    results.value = [];
  } finally {
    searching.value = false;
  }
}

function selectPatient(patient) {
  emit('select-patient', patient);
  searchQuery.value = '';
  results.value = [];
}
</script>

<style scoped lang="scss">
.step-patient-select {
  background: $color-white;
  padding: $size-24;
  border-radius: $size-12;

  h2 {
    font-size: $size-20;
    font-weight: $fw-semi-bold;
    color: $color-g-21;
    margin-bottom: $size-20;
  }
}

.search-bar {
  display: flex;
  align-items: center;
  gap: $size-10;
  background: $color-g-97;
  padding: $size-12 $size-16;
  border-radius: $size-10;
  margin-bottom: $size-16;

  input {
    flex: 1;
    border: none;
    outline: none;
    font-size: $size-14;
    color: $color-g-21;
    background: transparent;

    &::placeholder {
      color: $color-g-67;
    }
  }
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $size-12;
  padding: $size-24;
  color: $color-g-54;

  .spinner {
    width: 20px;
    height: 20px;
    border: 2px solid $color-g-85;
    border-top-color: $color-pri;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
}

.patient-results {
  max-height: 300px;
  overflow-y: auto;
}

.patient-option {
  display: flex;
  align-items: center;
  gap: $size-12;
  padding: $size-12;
  border-radius: $size-8;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: $color-g-97;
  }

  &.selected {
    background: rgba($color-pri, 0.08);
  }

  .patient-info {
    flex: 1;

    .patient-name {
      font-size: $size-15;
      font-weight: $fw-medium;
      color: $color-g-21;
    }

    .patient-email {
      font-size: $size-12;
      color: $color-g-54;
    }
  }

  .check-icon {
    color: $color-pri;
  }
}

.no-results {
  text-align: center;
  padding: $size-16;
  color: $color-g-54;
  font-size: $size-14;
}

.selected-patient-card {
  margin-top: $size-24;
  padding: $size-20;
  background: rgba($color-pri, 0.05);
  border: 1px solid rgba($color-pri, 0.2);
  border-radius: $size-12;

  h3 {
    font-size: $size-14;
    font-weight: $fw-medium;
    color: $color-g-54;
    margin-bottom: $size-12;
  }

  .patient-details {
    display: flex;
    align-items: center;
    gap: $size-16;

    .patient-info {
      .patient-name {
        font-size: $size-16;
        font-weight: $fw-semi-bold;
        color: $color-g-21;
      }

      .patient-email {
        font-size: $size-13;
        color: $color-g-54;
        margin-top: $size-2;
      }

      .patient-phone {
        font-size: $size-13;
        color: $color-g-54;
        margin-top: $size-2;
      }
    }
  }
}

.preselected-drug-card {
  margin-top: $size-16;
  padding: $size-20;
  background: rgba(#10b981, 0.05);
  border: 1px solid rgba(#10b981, 0.2);
  border-radius: $size-12;

  h3 {
    font-size: $size-15;
    font-weight: $fw-medium;
    color: #059669;
    margin-bottom: $size-12;
    display: flex;
    align-items: center;
    gap: $size-8;
  }

  .drug-preview {
    display: flex;
    align-items: center;
    gap: $size-12;

    .drug-image {
      width: $size-56;
      height: $size-56;
      border-radius: $size-8;
      background: $color-white;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      flex-shrink: 0;
      border: 1px solid rgba(#10b981, 0.2);
      color: #059669;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .drug-info {
      flex: 1;

      .drug-name {
        font-size: $size-15;
        font-weight: $fw-semi-bold;
        color: $color-g-21;
      }

      .drug-details {
        font-size: $size-12;
        color: $color-g-54;
        margin-top: $size-2;
      }

      .drug-price {
        font-size: $size-15;
        font-weight: $fw-semi-bold;
        color: #059669;
        margin-top: $size-4;
      }
    }
  }

  .drug-note {
    font-size: $size-12;
    color: $color-g-54;
    margin-top: $size-12;
    font-style: italic;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
