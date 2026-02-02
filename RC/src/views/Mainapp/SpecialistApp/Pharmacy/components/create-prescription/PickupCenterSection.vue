<template>
  <div class="pickup-center-section">
    <!-- Search -->
    <div class="pickup-search">
      <div class="search-input-wrapper">
        <v-icon name="hi-search" scale="0.8" class="search-icon" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search pickup centers by city or state..."
          @input="onSearch"
        />
      </div>
      <button
        class="location-btn"
        type="button"
        :disabled="loadingCenters"
        @click="useLocation"
      >
        <v-icon name="hi-location-marker" scale="0.8" />
        <span>Near Me</span>
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loadingCenters" class="loading-state">
      <div class="spinner" />
      <span>Finding pickup centers...</span>
    </div>

    <!-- Pickup Centers List -->
    <div v-else-if="centers.length" class="centers-list">
      <div
        v-for="center in centers"
        :key="center._id"
        :class="['center-option', { selected: selectedCenterId === center._id }]"
        @click="selectCenter(center)"
      >
        <div class="center-icon">
          <v-icon name="hi-office-building" scale="0.9" />
        </div>
        <div class="center-info">
          <p class="center-name">{{ center.name }}</p>
          <p class="center-address">{{ formatAddress(center.address) }}</p>
          <div class="center-meta">
            <span v-if="center.distance" class="distance">
              <v-icon name="hi-location-marker" scale="0.6" />
              {{ formatDistance(center.distance) }}
            </span>
            <span v-if="center.pickup_center_settings?.handling_fee" class="fee">
              Fee: NGN {{ formatCurrency(center.pickup_center_settings.handling_fee) }}
            </span>
          </div>
        </div>
        <v-icon v-if="selectedCenterId === center._id" name="hi-check-circle" scale="1" class="selected-check" />
      </div>
    </div>

    <!-- No Results -->
    <div v-else-if="searchQuery" class="no-results">
      <v-icon name="hi-location-marker" scale="1.5" />
      <p>No pickup centers found</p>
      <span>Try searching in a different location</span>
    </div>

    <!-- Selected Center Summary -->
    <div v-if="selectedCenter" class="selected-summary">
      <div class="summary-header">
        <h4>
          <v-icon name="hi-check-circle" scale="0.8" />
          Selected Pickup Center
        </h4>
        <button class="change-btn" @click="clearSelection">Change</button>
      </div>
      <div class="summary-details">
        <p class="pharmacy-name">{{ selectedCenter.name }}</p>
        <p class="pharmacy-address">{{ formatAddress(selectedCenter.address) }}</p>
        <p v-if="selectedCenter.contact?.phone" class="pharmacy-phone">
          <v-icon name="hi-phone" scale="0.6" />
          {{ selectedCenter.contact.phone }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useToast } from 'vue-toast-notification';
import { debounce } from 'lodash';
import apiFactory from '@/services/apiFactory';
import { usePharmacy } from '../../composables/usePharmacy';

const { formatCurrency } = usePharmacy();
const $toast = useToast();

const props = defineProps({
  selectedCenter: { type: Object, default: null },
  selectedCenterId: { type: String, default: null },
});

const emit = defineEmits(['select', 'clear']);

const searchQuery = ref('');
const centers = ref([]);
const loadingCenters = ref(false);

const debouncedSearch = debounce(searchCenters, 300);

function onSearch() {
  debouncedSearch();
}

async function searchCenters() {
  if (!searchQuery.value || searchQuery.value.length < 2) return;

  loadingCenters.value = true;
  try {
    const response = await apiFactory.$_getPickupCenters({
      city: searchQuery.value,
      state: searchQuery.value,
      limit: 20,
    });
    centers.value = response.data?.data?.pickup_centers || [];
  } catch (err) {
    console.error('Error searching pickup centers:', err);
    centers.value = [];
  } finally {
    loadingCenters.value = false;
  }
}

async function useLocation() {
  if (!navigator.geolocation) {
    $toast.error('Geolocation is not supported by your browser');
    return;
  }

  loadingCenters.value = true;
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        const response = await apiFactory.$_recommendPickupCenters({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          limit: 10,
        });
        centers.value = response.data?.data || [];
      } catch (err) {
        console.error('Error fetching nearby centers:', err);
        $toast.error('Failed to find nearby pickup centers');
      } finally {
        loadingCenters.value = false;
      }
    },
    () => {
      $toast.error('Unable to get your location. Please search manually.');
      loadingCenters.value = false;
    }
  );
}

function selectCenter(center) {
  emit('select', center);
}

function clearSelection() {
  emit('clear');
}

function formatAddress(address) {
  if (!address) return 'Address not available';
  const parts = [address.street, address.city, address.state].filter(Boolean);
  return parts.join(', ') || 'Address not available';
}

function formatDistance(distance) {
  if (!distance) return '';
  if (distance < 1) return `${Math.round(distance * 1000)}m`;
  return `${distance.toFixed(1)}km`;
}
</script>

<style scoped lang="scss">
.pickup-center-section {
  margin-top: $size-16;
}

.pickup-search {
  display: flex;
  gap: $size-12;
  margin-bottom: $size-16;

  @include responsive(phone) {
    flex-direction: column;
  }

  .search-input-wrapper {
    flex: 1;
    position: relative;

    input {
      width: 100%;
      padding: $size-12 $size-16 $size-12 $size-40;
      border: 1px solid $color-g-85;
      border-radius: $size-10;
      font-size: $size-14;
      transition: border-color 0.2s ease;

      &:focus {
        outline: none;
        border-color: $color-pri;
      }

      &::placeholder {
        color: $color-g-67;
      }
    }

    .search-icon {
      position: absolute;
      left: $size-12;
      top: 50%;
      transform: translateY(-50%);
      color: $color-g-54;
    }
  }

  .location-btn {
    display: flex;
    align-items: center;
    gap: $size-6;
    padding: $size-12 $size-16;
    background: rgba($color-pri, 0.1);
    color: $color-pri;
    border: none;
    border-radius: $size-10;
    font-size: $size-14;
    font-weight: $fw-medium;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s ease;

    &:hover:not(:disabled) {
      background: rgba($color-pri, 0.15);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
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
  font-size: $size-14;

  .spinner {
    width: 20px;
    height: 20px;
    border: 2px solid $color-g-85;
    border-top-color: $color-pri;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
}

.centers-list {
  display: flex;
  flex-direction: column;
  gap: $size-12;
  max-height: 300px;
  overflow-y: auto;
  padding-right: $size-4;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: $color-g-95;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: $color-g-77;
    border-radius: 3px;
  }
}

.center-option {
  display: flex;
  align-items: flex-start;
  gap: $size-12;
  padding: $size-16;
  border: 2px solid $color-g-90;
  border-radius: $size-12;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: $color-g-77;
    background: $color-g-97;
  }

  &.selected {
    border-color: #10b981;
    background: rgba(#10b981, 0.03);
  }

  .center-icon {
    width: $size-40;
    height: $size-40;
    border-radius: $size-10;
    background: rgba(#10b981, 0.1);
    color: #10b981;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .center-info {
    flex: 1;
    min-width: 0;

    .center-name {
      font-size: $size-15;
      font-weight: $fw-semi-bold;
      color: $color-g-21;
      margin-bottom: $size-4;
    }

    .center-address {
      font-size: $size-13;
      color: $color-g-54;
      line-height: 1.4;
      margin-bottom: $size-6;
    }

    .center-meta {
      display: flex;
      align-items: center;
      gap: $size-12;
      font-size: $size-12;
      color: $color-g-67;

      .distance {
        display: flex;
        align-items: center;
        gap: $size-4;
        color: #10b981;
        font-weight: $fw-medium;
      }

      .fee {
        color: $color-g-54;
      }
    }
  }

  .selected-check {
    color: #10b981;
    flex-shrink: 0;
  }
}

.no-results {
  text-align: center;
  padding: $size-32;
  color: $color-g-54;

  p {
    font-size: $size-14;
    margin-top: $size-12;
    font-weight: $fw-medium;
  }

  span {
    font-size: $size-12;
    color: $color-g-67;
  }
}

.selected-summary {
  padding: $size-16;
  background: rgba(#10b981, 0.05);
  border: 1px solid rgba(#10b981, 0.2);
  border-radius: $size-12;
  margin-top: $size-16;

  .summary-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $size-12;

    h4 {
      font-size: $size-14;
      font-weight: $fw-semi-bold;
      color: #10b981;
      display: flex;
      align-items: center;
      gap: $size-6;
    }

    .change-btn {
      font-size: $size-13;
      color: $color-pri;
      background: none;
      border: none;
      cursor: pointer;
      font-weight: $fw-medium;

      &:hover {
        text-decoration: underline;
      }
    }
  }

  .summary-details {
    .pharmacy-name {
      font-size: $size-15;
      font-weight: $fw-medium;
      color: $color-g-21;
      margin-bottom: $size-4;
    }

    .pharmacy-address {
      font-size: $size-13;
      color: $color-g-54;
      line-height: 1.4;
    }

    .pharmacy-phone {
      font-size: $size-12;
      color: $color-g-67;
      margin-top: $size-8;
      display: flex;
      align-items: center;
      gap: $size-6;
    }
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
