<template>
  <Teleport to="body">
    <div class="drug-search-modal">
      <div class="modal-overlay" @click="$emit('close')" />
      <div class="modal-content">
        <div class="modal-header">
          <h3>Search Medications</h3>
          <button class="close-btn" @click="$emit('close')">
            <v-icon name="hi-x" scale="1.1" />
          </button>
        </div>

        <div class="modal-body">
          <!-- Search Bar -->
          <div class="search-bar">
            <v-icon name="hi-search" scale="0.9" />
            <input
              ref="searchInput"
              v-model="searchQuery"
              type="text"
              placeholder="Search by drug name..."
              @input="onSearch"
            />
          </div>

          <!-- Category Filter -->
          <div class="category-filter">
            <select
              v-model="selectedCategory"
              class="category-select"
              @change="onCategoryChange"
              :disabled="loadingCategories"
            >
              <option :value="null">All Categories</option>
              <option
                v-for="category in categories"
                :key="category._id"
                :value="category._id"
              >
                {{ category.name }}
              </option>
            </select>
            <button
              v-if="selectedCategory"
              class="clear-filter"
              @click="clearCategory"
            >
              <v-icon name="hi-x" scale="0.7" />
              Clear
            </button>
          </div>

          <!-- Results Label -->
          <div v-if="selectedCategory || searchQuery" class="results-label">
            <span>{{ resultsLabel }}</span>
          </div>

          <!-- Loading -->
          <div v-if="searching" class="loading-state">
            <div class="spinner" />
            <span>Searching...</span>
          </div>

          <!-- Drug Results -->
          <div v-else-if="results.length" class="drug-results">
            <div
              v-for="drug in results"
              :key="drug.batch_id || drug._id"
              class="drug-option"
              @click="selectDrug(drug)"
            >
              <div class="drug-image">
                <img v-if="drug.primary_image" :src="drug.primary_image" :alt="drug.name" />
                <v-icon v-else name="ri-capsule-line" scale="1.2" />
              </div>
              <div class="drug-info">
                <p class="drug-name">{{ drug.name }}</p>
                <p class="drug-details">{{ drug.generic_name }} | {{ drug.strength }}</p>
                <p v-if="drug.manufacturer" class="drug-manufacturer">{{ drug.manufacturer }}</p>
                <p v-if="drug.batch_number" class="drug-batch">
                  Batch: {{ drug.batch_number }}
                  <span v-if="drug.expiry_date" :class="['expiry-tag', getExpiryClass(drug.expiry_date)]">
                    Exp: {{ formatExpiryDate(drug.expiry_date) }}
                  </span>
                </p>
                <p class="drug-price">NGN {{ formatCurrency(drug.selling_price) }}</p>
              </div>
              <span :class="['stock-badge', drug.quantity > 0 ? 'in-stock' : 'out-of-stock']">
                {{ drug.quantity > 0 ? `${drug.quantity} in stock` : 'Out of stock' }}
              </span>
            </div>
          </div>

          <!-- No Results -->
          <div v-else-if="searchQuery || selectedCategory" class="no-results">
            <v-icon name="ri-capsule-line" scale="1.5" />
            <p>No medications found</p>
          </div>

          <!-- Initial State -->
          <div v-else class="initial-state">
            <v-icon name="hi-search" scale="1.5" />
            <p>Search for medications or select a category</p>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import { debounce } from 'lodash';
import apiFactory from '@/services/apiFactory';
import { usePharmacy } from '../../composables/usePharmacy';

const { formatCurrency } = usePharmacy();

const emit = defineEmits(['close', 'select']);

const searchInput = ref(null);
const searchQuery = ref('');
const searching = ref(false);
const results = ref([]);
const categories = ref([]);
const selectedCategory = ref(null);
const loadingCategories = ref(false);

const resultsLabel = computed(() => {
  if (selectedCategory.value && searchQuery.value) {
    const cat = categories.value.find(c => c._id === selectedCategory.value);
    return `Results in "${cat?.name || 'Category'}"`;
  }
  if (selectedCategory.value) {
    const cat = categories.value.find(c => c._id === selectedCategory.value);
    return `Showing "${cat?.name || 'Category'}"`;
  }
  return 'Search Results';
});

onMounted(async () => {
  await fetchCategories();
  await nextTick();
  searchInput.value?.focus();
});

async function fetchCategories() {
  if (categories.value.length > 0) return;
  try {
    loadingCategories.value = true;
    const response = await apiFactory.$_getPharmacyDrugCategories();
    const result = response.data?.data || response.data?.result;
    categories.value = result || [];
  } catch (error) {
    console.error('Error fetching categories:', error);
  } finally {
    loadingCategories.value = false;
  }
}

const debouncedFetch = debounce(fetchDrugs, 300);

function onSearch() {
  debouncedFetch();
}

function onCategoryChange() {
  fetchDrugs();
}

function clearCategory() {
  selectedCategory.value = null;
  fetchDrugs();
}

async function fetchDrugs() {
  if (!searchQuery.value && !selectedCategory.value) {
    results.value = [];
    return;
  }
  try {
    searching.value = true;
    const params = { stock_status: 'in_stock', limit: 20 };
    if (searchQuery.value) params.search = searchQuery.value;
    if (selectedCategory.value) params.category = selectedCategory.value;

    const response = await apiFactory.$_searchPharmacyDrugs(params);
    const result = response.data?.data || response.data?.result;
    results.value = result?.docs || [];
  } catch (error) {
    console.error('Error searching drugs:', error);
    results.value = [];
  } finally {
    searching.value = false;
  }
}

function selectDrug(drug) {
  if (drug.quantity <= 0) return;
  emit('select', drug);
}

function formatExpiryDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
}

function getExpiryClass(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const expiry = new Date(dateStr);
  const monthsUntilExpiry = (expiry - now) / (1000 * 60 * 60 * 24 * 30);
  if (monthsUntilExpiry <= 1) return 'critical';
  if (monthsUntilExpiry <= 3) return 'warning';
  return '';
}
</script>

<style scoped lang="scss">
.drug-search-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $size-16;

  .modal-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
  }

  .modal-content {
    position: relative;
    width: 100%;
    max-width: 520px;
    max-height: 80vh;
    background: $color-white;
    border-radius: $size-16;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $size-16 $size-20;
    border-bottom: 1px solid $color-g-92;
    flex-shrink: 0;

    h3 {
      font-size: $size-18;
      font-weight: $fw-semi-bold;
      color: $color-g-21;
    }

    .close-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: $size-6;
      color: $color-g-54;
      border-radius: $size-6;

      &:hover {
        color: $color-g-36;
        background: $color-g-95;
      }
    }
  }

  .modal-body {
    padding: $size-20;
    overflow-y: auto;
    flex: 1;
  }
}

.search-bar {
  display: flex;
  align-items: center;
  gap: $size-10;
  background: $color-g-97;
  padding: $size-12 $size-16;
  border-radius: $size-10;
  margin-bottom: $size-12;

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

.category-filter {
  display: flex;
  align-items: center;
  gap: $size-10;
  margin-bottom: $size-12;

  .category-select {
    flex: 1;
    padding: $size-10 $size-12;
    border: 1px solid $color-g-85;
    border-radius: $size-8;
    font-size: $size-14;
    color: $color-g-21;
    background: $color-white;
    cursor: pointer;

    &:focus {
      outline: none;
      border-color: $color-pri;
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  .clear-filter {
    display: flex;
    align-items: center;
    gap: $size-4;
    font-size: $size-12;
    color: $color-g-54;
    cursor: pointer;
    padding: $size-6 $size-10;
    border-radius: $size-6;
    border: none;
    background: none;
    transition: all 0.2s ease;

    &:hover {
      color: $color-pri;
      background: rgba($color-pri, 0.1);
    }
  }
}

.results-label {
  display: flex;
  align-items: center;
  margin-bottom: $size-12;

  span {
    font-size: $size-12;
    font-weight: $fw-medium;
    color: $color-g-54;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: $color-g-90;
    margin-left: $size-12;
  }
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $size-12;
  padding: $size-32;
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

.drug-results {
  max-height: 400px;
  overflow-y: auto;
}

.drug-option {
  display: flex;
  align-items: center;
  gap: $size-12;
  padding: $size-12;
  border-radius: $size-8;
  cursor: pointer;
  transition: background 0.2s ease;
  border-bottom: 1px solid $color-g-95;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: $color-g-97;
  }

  .drug-image {
    width: $size-48;
    height: $size-48;
    border-radius: $size-8;
    background: $color-g-97;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    flex-shrink: 0;
    color: $color-g-54;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .drug-info {
    flex: 1;
    min-width: 0;

    .drug-name {
      font-size: $size-14;
      font-weight: $fw-medium;
      color: $color-g-21;
    }

    .drug-details {
      font-size: $size-12;
      color: $color-g-54;
      margin-top: $size-2;
    }

    .drug-manufacturer {
      font-size: $size-11;
      color: $color-g-67;
      margin-top: $size-2;
    }

    .drug-batch {
      font-size: $size-11;
      color: $color-g-54;
      margin-top: $size-2;
      display: flex;
      align-items: center;
      gap: $size-8;

      .expiry-tag {
        font-size: $size-10;
        padding: 2px 6px;
        border-radius: 4px;
        background: $color-g-95;
        color: $color-g-54;

        &.warning {
          background: #fef3c7;
          color: #d97706;
        }

        &.critical {
          background: #fee2e2;
          color: #dc2626;
        }
      }
    }

    .drug-price {
      font-size: $size-14;
      font-weight: $fw-semi-bold;
      color: $color-pri;
      margin-top: $size-4;
    }
  }
}

.stock-badge {
  font-size: $size-11;
  padding: $size-4 $size-8;
  border-radius: $size-12;
  white-space: nowrap;
  flex-shrink: 0;

  &.in-stock {
    background: rgba(#10b981, 0.1);
    color: #059669;
  }

  &.out-of-stock {
    background: rgba(#ef4444, 0.1);
    color: #dc2626;
  }
}

.no-results,
.initial-state {
  text-align: center;
  padding: $size-32;
  color: $color-g-54;

  p {
    margin-top: $size-12;
    font-size: $size-14;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
