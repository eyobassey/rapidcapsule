<template>
  <div class="step-patient-select">
    <!-- Section Header -->
    <div class="section-header">
      <div class="section-header__icon sky">
        <v-icon name="hi-user-circle" scale="1.1" />
      </div>
      <div class="section-header__content">
        <h2>Select Patient</h2>
        <p>Search and select the patient for this prescription</p>
      </div>
    </div>

    <!-- Patient Search -->
    <div class="search-container">
      <div class="search-bar">
        <v-icon name="hi-search" scale="0.95" class="search-icon" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by name, email, or phone..."
          @input="onSearch"
        />
        <div v-if="searching" class="search-spinner">
          <div class="spinner-ring"></div>
        </div>
      </div>
    </div>

    <!-- Search Results -->
    <div v-if="results.length" class="patient-results">
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
          <p class="patient-meta">
            <span>{{ patient.email }}</span>
            <span v-if="patient.phone" class="meta-dot"></span>
            <span v-if="patient.phone">{{ patient.phone }}</span>
          </p>
        </div>
        <div class="patient-check">
          <v-icon v-if="selectedPatient?._id === patient._id" name="hi-check-circle" scale="1.1" />
          <div v-else class="check-circle"></div>
        </div>
      </div>
    </div>

    <!-- No Results -->
    <div v-else-if="searchQuery && !searching" class="empty-state">
      <div class="empty-state__icon">
        <v-icon name="hi-search" scale="1.5" />
      </div>
      <p class="empty-state__title">No patients found</p>
      <p class="empty-state__text">Try a different search term</p>
    </div>

    <!-- Initial State -->
    <div v-else-if="!searchQuery && !selectedPatient" class="empty-state">
      <div class="empty-state__icon emerald">
        <v-icon name="hi-user-group" scale="1.5" />
      </div>
      <p class="empty-state__title">Search for a patient</p>
      <p class="empty-state__text">Enter a name, email, or phone number to find patients</p>
    </div>

    <!-- Selected Patient Card -->
    <div v-if="selectedPatient" class="selected-patient-card">
      <div class="selected-card__header">
        <div class="selected-card__badge">
          <v-icon name="hi-check-circle" scale="0.75" />
          <span>Selected Patient</span>
        </div>
        <button class="change-btn" @click="clearSelection">
          <v-icon name="hi-switch-horizontal" scale="0.75" />
          <span>Change</span>
        </button>
      </div>
      <div class="selected-card__content">
        <RcAvatar
          :firstName="selectedPatient.full_name?.split(' ')[0]"
          :lastName="selectedPatient.full_name?.split(' ')[1]"
          :modelValue="selectedPatient.profile_image"
          size="lg"
        />
        <div class="selected-card__info">
          <p class="selected-card__name">{{ selectedPatient.full_name }}</p>
          <div class="selected-card__details">
            <span class="detail-item">
              <v-icon name="hi-mail" scale="0.7" />
              {{ selectedPatient.email }}
            </span>
            <span v-if="selectedPatient.phone" class="detail-item">
              <v-icon name="hi-phone" scale="0.7" />
              {{ selectedPatient.phone }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Pre-selected Drug Indicator -->
    <div v-if="preSelectedDrug" class="preselected-drug-card">
      <div class="drug-card__header">
        <div class="drug-card__badge">
          <v-icon name="ri-capsule-line" scale="0.75" />
          <span>Pre-selected Medication</span>
        </div>
      </div>
      <div class="drug-card__content">
        <div class="drug-image">
          <img v-if="preSelectedDrug.primary_image" :src="preSelectedDrug.primary_image" :alt="preSelectedDrug.name" />
          <v-icon v-else name="ri-capsule-line" scale="1.4" />
        </div>
        <div class="drug-info">
          <p class="drug-name">{{ preSelectedDrug.name }}</p>
          <p class="drug-details">{{ preSelectedDrug.generic_name }} | {{ preSelectedDrug.strength }}</p>
          <p class="drug-price">NGN {{ formatCurrency(preSelectedDrug.selling_price) }}</p>
        </div>
      </div>
      <p class="drug-card__note">
        <v-icon name="hi-information-circle" scale="0.7" />
        This medication will be automatically added when you proceed
      </p>
    </div>

    <!-- Loading Pre-selected Drug -->
    <div v-if="loadingPreSelectedDrug" class="loading-state">
      <div class="loading-spinner">
        <div class="spinner-ring"></div>
        <v-icon name="ri-capsule-line" scale="1" class="spinner-icon" />
      </div>
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

function clearSelection() {
  emit('select-patient', null);
  searchQuery.value = '';
}
</script>

<style scoped lang="scss">
// Design Tokens
$sky: #4FC3F7;
$sky-light: #E1F5FE;
$sky-dark: #0288D1;
$sky-darker: #01579B;
$navy: #0F172A;
$slate: #334155;
$gray: #64748B;
$light-gray: #94A3B8;
$bg: #F8FAFC;
$emerald: #10B981;
$emerald-light: #D1FAE5;

.step-patient-select {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

// Section Header
.section-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;

  &__icon {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &.sky { background: $sky-light; color: $sky-dark; }
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

// Search Container
.search-container {
  position: relative;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  background: $bg;
  padding: 14px 18px;
  border-radius: 14px;
  border: 2px solid transparent;
  transition: all 0.2s;

  &:focus-within {
    border-color: $sky;
    background: white;
    box-shadow: 0 0 0 4px rgba($sky, 0.1);
  }

  .search-icon {
    color: $gray;
    flex-shrink: 0;
  }

  input {
    flex: 1;
    border: none;
    outline: none;
    font-size: 15px;
    color: $navy;
    background: transparent;

    &::placeholder {
      color: $light-gray;
    }
  }

  .search-spinner {
    .spinner-ring {
      width: 18px;
      height: 18px;
      border: 2px solid $sky-light;
      border-top-color: $sky;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

// Patient Results
.patient-results {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 320px;
  overflow-y: auto;
  padding: 4px;
  margin: -4px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: #E2E8F0;
    border-radius: 3px;
  }
}

.patient-option {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  background: $bg;
  border: 2px solid transparent;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: white;
    border-color: $sky-light;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  }

  &.selected {
    background: $sky-light;
    border-color: $sky;

    .patient-check svg {
      color: $sky-dark;
    }
  }

  .patient-info {
    flex: 1;
    min-width: 0;

    .patient-name {
      font-size: 15px;
      font-weight: 600;
      color: $navy;
      margin: 0 0 4px;
    }

    .patient-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: $gray;
      margin: 0;

      .meta-dot {
        width: 3px;
        height: 3px;
        background: $light-gray;
        border-radius: 50%;
      }
    }
  }

  .patient-check {
    .check-circle {
      width: 24px;
      height: 24px;
      border: 2px solid #E2E8F0;
      border-radius: 50%;
    }

    svg {
      color: $emerald;
    }
  }
}

// Empty State
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 40px 20px;

  &__icon {
    width: 64px;
    height: 64px;
    border-radius: 20px;
    background: $bg;
    color: $gray;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 16px;

    &.emerald {
      background: $emerald-light;
      color: $emerald;
    }
  }

  &__title {
    font-size: 16px;
    font-weight: 600;
    color: $navy;
    margin: 0 0 4px;
  }

  &__text {
    font-size: 14px;
    color: $gray;
    margin: 0;
  }
}

// Selected Patient Card
.selected-patient-card {
  background: linear-gradient(135deg, $sky-light, lighten($sky-light, 3%));
  border: 1px solid rgba($sky, 0.2);
  border-radius: 18px;
  padding: 20px;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.selected-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.selected-card__badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: $sky-dark;
  color: white;
  font-size: 12px;
  font-weight: 600;
  border-radius: 8px;
}

.change-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: rgba($sky-dark, 0.1);
  color: $sky-darker;
  font-size: 12px;
  font-weight: 500;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba($sky-dark, 0.2);
  }
}

.selected-card__content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.selected-card__info {
  flex: 1;
  min-width: 0;

  .selected-card__name {
    font-size: 18px;
    font-weight: 700;
    color: $navy;
    margin: 0 0 8px;
  }

  .selected-card__details {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;

    .detail-item {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      color: $sky-darker;
    }
  }
}

// Pre-selected Drug Card
.preselected-drug-card {
  background: linear-gradient(135deg, $emerald-light, lighten($emerald-light, 3%));
  border: 1px solid rgba($emerald, 0.2);
  border-radius: 18px;
  padding: 20px;
}

.drug-card__header {
  margin-bottom: 16px;
}

.drug-card__badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: $emerald;
  color: white;
  font-size: 12px;
  font-weight: 600;
  border-radius: 8px;
}

.drug-card__content {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;

  .drug-image {
    width: 72px;
    height: 72px;
    border-radius: 14px;
    background: white;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    flex-shrink: 0;
    border: 1px solid rgba($emerald, 0.15);
    color: $emerald;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .drug-info {
    flex: 1;

    .drug-name {
      font-size: 16px;
      font-weight: 700;
      color: $navy;
      margin: 0 0 4px;
    }

    .drug-details {
      font-size: 13px;
      color: darken($emerald, 15%);
      margin: 0 0 6px;
    }

    .drug-price {
      font-size: 16px;
      font-weight: 700;
      color: $emerald;
      margin: 0;
    }
  }
}

.drug-card__note {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: darken($emerald, 15%);
  margin: 0;
  padding: 10px 12px;
  background: rgba(white, 0.5);
  border-radius: 8px;
}

// Loading State
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 32px;
  color: $gray;
  font-size: 14px;

  .loading-spinner {
    position: relative;
    width: 48px;
    height: 48px;

    .spinner-ring {
      position: absolute;
      inset: 0;
      border: 3px solid $sky-light;
      border-top-color: $sky;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .spinner-icon {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: $sky;
    }
  }
}
</style>
