<template>
  <div class="page-content">
    <TopBar showButtons type="title-only" title="Pharmacy / Drug Catalog" @open-side-nav="$emit('openSideNav')" />
    <div class="page-content__body">
      <div class="drugs-container">
        <!-- Hero Section -->
        <div class="hero-section">
          <div class="hero-content">
            <button class="hero-back" @click="router.push('/app/specialist/pharmacy')">
              <v-icon name="hi-arrow-left" scale="0.75" />
              Pharmacy
            </button>
            <h1 class="hero-title">
              <v-icon name="ri-capsule-line" scale="1" />
              Drug Catalog
            </h1>
            <p class="hero-subtitle">Browse and search available medications</p>
          </div>
          <div v-if="pagination.total" class="hero-stat-pill">
            <span class="hero-stat-pill__value">{{ pagination.total }}</span>
            <span class="hero-stat-pill__label">Medications</span>
          </div>
        </div>

        <!-- Search & Filters -->
        <div class="filters-card">
          <div class="search-input-wrapper">
            <v-icon name="hi-search" scale="0.9" class="search-icon" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search medications..."
              @input="handleSearch"
            />
            <button v-if="searchQuery" class="clear-btn" @click="clearSearch">
              <v-icon name="hi-x" scale="0.8" />
            </button>
          </div>
          <div class="filters-row">
            <div class="filter-group">
              <label>Category</label>
              <select v-model="selectedCategory" @change="applyFilters">
                <option value="">All Categories</option>
                <option v-for="category in categories" :key="category._id" :value="category._id">
                  {{ category.name }}
                </option>
              </select>
            </div>
            <div class="filter-group">
              <label>Manufacturer</label>
              <select v-model="selectedManufacturer" @change="applyFilters">
                <option value="">All Manufacturers</option>
                <option v-for="manufacturer in manufacturers" :key="manufacturer._id" :value="manufacturer.name">
                  {{ manufacturer.name }}
                </option>
              </select>
            </div>
            <div class="filter-group">
              <label>Stock</label>
              <select v-model="stockStatus" @change="applyFilters">
                <option value="all">All</option>
                <option value="in_stock">In Stock</option>
                <option value="low_stock">Low Stock</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </div>
            <div class="filter-group">
              <label>Sort</label>
              <select v-model="sortBy" @change="applyFilters">
                <option value="name">Name (A-Z)</option>
                <option value="-name">Name (Z-A)</option>
                <option value="selling_price">Price (Low-High)</option>
                <option value="-selling_price">Price (High-Low)</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Shimmer Loading -->
        <template v-if="isLoading">
          <div class="skeleton-card" v-for="i in 6" :key="i" />
        </template>

        <!-- Results -->
        <template v-else>
          <p v-if="drugs.length" class="results-count">
            Showing {{ drugs.length }} of {{ pagination.total }} medications
          </p>

          <div v-if="drugs.length" class="drugs-list">
            <div
              v-for="drug in drugs"
              :key="drug.batch_id ? `${drug._id}-${drug.batch_id}` : drug._id"
              class="drug-card"
              @click="viewDrug(drug._id, drug.batch_id)"
            >
              <div class="drug-card__image">
                <img v-if="drug.primary_image" :src="drug.primary_image" :alt="drug.name" />
                <div v-else class="drug-placeholder">
                  <v-icon name="ri-capsule-line" scale="1.3" />
                </div>
                <span v-if="drug.requires_prescription" class="rx-badge">Rx</span>
              </div>
              <div class="drug-card__content">
                <h3>{{ drug.name }}</h3>
                <p class="generic-name">{{ drug.generic_name }}</p>
                <p class="drug-details">{{ drug.strength }} | {{ drug.dosage_form }}</p>
                <div class="drug-card__footer">
                  <div class="price">
                    <span class="currency">NGN</span>
                    <span class="amount">{{ formatCurrency(drug.selling_price) }}</span>
                  </div>
                  <PharmacyStatusBadge :status="getStockClass(drug)" :label="getStockLabel(drug)" />
                </div>
              </div>
              <button
                class="prescribe-btn"
                :disabled="drug.is_out_of_stock || drug.quantity === 0"
                @click.stop="prescribeDrug(drug)"
              >
                <v-icon name="ri-capsule-line" scale="0.7" />
                Prescribe
              </button>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="empty-section">
            <div class="empty-section__icon">
              <v-icon name="ri-capsule-line" scale="1.8" />
            </div>
            <h3>No medications found</h3>
            <p>Try adjusting your search or filter criteria</p>
          </div>
        </template>

        <PharmacyPagination
          :current-page="pagination.page"
          :total-pages="pagination.totalPages"
          @page-change="handlePageChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toast-notification';
import TopBar from '@/components/Navigation/top-bar';
import apiFactory from '@/services/apiFactory';
import PharmacyStatusBadge from './components/PharmacyStatusBadge.vue';
import PharmacyPagination from './components/PharmacyPagination.vue';
import { usePharmacy } from './composables/usePharmacy';

const router = useRouter();
const $toast = useToast();
const { formatCurrency, getStockClass, getStockLabel } = usePharmacy();

const isLoading = ref(false);
const searchQuery = ref('');
const selectedCategory = ref('');
const selectedManufacturer = ref('');
const stockStatus = ref('all');
const sortBy = ref('name');
const drugs = ref([]);
const categories = ref([]);
const manufacturers = ref([]);
const pagination = ref({ page: 1, limit: 20, total: 0, totalPages: 0 });
let debounceTimer = null;

function handleSearch() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    pagination.value.page = 1;
    searchDrugs();
  }, 300);
}

function clearSearch() {
  searchQuery.value = '';
  pagination.value.page = 1;
  searchDrugs();
}

function applyFilters() {
  pagination.value.page = 1;
  searchDrugs();
}

function handlePageChange(page) {
  pagination.value.page = page;
  searchDrugs();
}

function viewDrug(drugId, batchId = null) {
  const route = `/app/specialist/pharmacy/drugs/${drugId}`;
  if (batchId) {
    router.push({ path: route, query: { batch: batchId } });
  } else {
    router.push(route);
  }
}

function prescribeDrug(drug) {
  const query = { drug: drug._id };
  if (drug.batch_id) {
    query.batch = drug.batch_id;
  }
  router.push({ path: '/app/specialist/pharmacy/prescriptions/create', query });
}

async function searchDrugs() {
  try {
    isLoading.value = true;
    const params = {
      search: searchQuery.value || undefined,
      category: selectedCategory.value || undefined,
      manufacturer: selectedManufacturer.value || undefined,
      stock_status: stockStatus.value !== 'all' ? stockStatus.value : undefined,
      sort_by: sortBy.value.replace('-', ''),
      sort_order: sortBy.value.startsWith('-') ? 'desc' : 'asc',
      page: pagination.value.page,
      limit: pagination.value.limit,
    };
    const response = await apiFactory.$_searchPharmacyDrugs(params);
    const result = response.data?.data || response.data?.result;
    if (result) {
      drugs.value = result.docs || [];
      pagination.value.total = result.total || 0;
      pagination.value.totalPages = result.pages || 0;
    }
  } catch (error) {
    console.error('Error searching drugs:', error);
    $toast.error('Failed to load medications');
  } finally {
    isLoading.value = false;
  }
}

async function fetchCategories() {
  try {
    const response = await apiFactory.$_getPharmacyDrugCategories();
    const result = response.data?.data || response.data?.result;
    if (result) categories.value = result || [];
  } catch (error) {
    console.error('Error fetching categories:', error);
  }
}

async function fetchManufacturers() {
  try {
    const response = await apiFactory.$_getPharmacyManufacturers();
    const result = response.data?.data || response.data?.result;
    if (result) manufacturers.value = result || [];
  } catch (error) {
    console.error('Error fetching manufacturers:', error);
  }
}

onMounted(() => {
  Promise.all([fetchCategories(), fetchManufacturers(), searchDrugs()]);
});
</script>

<style scoped lang="scss">
.page-content {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  padding: 0 128px;

  @include responsive(tab-portrait) {
    padding: 0;
  }

  @include responsive(phone) {
    padding: 0;
  }

  &__body {
    width: 100%;
    padding: $size-24 $size-32;
    overflow-y: auto;

    @include responsive(phone) {
      padding: $size-16;
    }

    &::-webkit-scrollbar {
      display: none;
    }
  }
}

.drugs-container {
  width: 100%;
  max-width: 700px;
  display: flex;
  flex-direction: column;
  gap: $size-24;
  padding-bottom: $size-32;
}

// Hero Section
.hero-section {
  background: linear-gradient(135deg, #0EAEC4 0%, #0891b2 50%, #0e7490 100%);
  border-radius: $size-20;
  padding: $size-24 $size-28;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(14, 174, 196, 0.25);
  color: white;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -10%;
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.08) 0%, transparent 70%);
    pointer-events: none;
  }

  @include responsive(tab-portrait) {
    flex-direction: column;
    align-items: flex-start;
    gap: $size-16;
    padding: $size-20;
    border-radius: $size-16;
  }

  @include responsive(phone) {
    padding: $size-16;
    border-radius: $size-12;
  }

  .hero-content {
    z-index: 1;

    .hero-back {
      display: inline-flex;
      align-items: center;
      gap: $size-4;
      background: rgba(255, 255, 255, 0.15);
      border: none;
      color: white;
      font-size: $size-12;
      font-weight: $fw-medium;
      padding: $size-4 $size-10;
      border-radius: $size-8;
      cursor: pointer;
      margin-bottom: $size-12;
      transition: background 0.2s;

      &:hover {
        background: rgba(255, 255, 255, 0.25);
      }
    }

    .hero-title {
      display: flex;
      align-items: center;
      gap: $size-8;
      font-size: $size-20;
      font-weight: $fw-bold;
      margin-bottom: $size-4;
    }

    .hero-subtitle {
      font-size: $size-13;
      opacity: 0.85;
    }
  }

  .hero-stat-pill {
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    background: rgba(255, 255, 255, 0.15);
    padding: $size-12 $size-20;
    border-radius: $size-12;

    &__value {
      font-size: $size-24;
      font-weight: $fw-bold;
      line-height: 1.2;
    }

    &__label {
      font-size: $size-11;
      opacity: 0.85;
      font-weight: $fw-medium;
    }
  }
}

// Filters Card
.filters-card {
  background: white;
  border-radius: $size-16;
  padding: $size-20;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  gap: $size-12;
  padding: $size-12 $size-16;
  background: $color-g-97;
  border-radius: $size-10;
  margin-bottom: $size-14;
  transition: background 0.2s ease;

  &:focus-within {
    background: rgba(14, 174, 196, 0.04);
  }

  .search-icon {
    color: $color-g-54;
  }

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

  .clear-btn {
    background: $color-g-92;
    border: none;
    cursor: pointer;
    padding: $size-4 $size-6;
    color: $color-g-54;
    border-radius: $size-4;

    &:hover {
      background: $color-g-85;
      color: $color-g-36;
    }
  }
}

.filters-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $size-12;

  @include responsive(tab-portrait) {
    grid-template-columns: repeat(2, 1fr);
  }

  @include responsive(phone) {
    grid-template-columns: 1fr;
  }
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: $size-4;

  label {
    font-size: $size-12;
    font-weight: $fw-medium;
    color: $color-g-54;
  }

  select {
    padding: $size-10 $size-12;
    border: 1px solid $color-g-85;
    border-radius: $size-8;
    font-size: $size-13;
    color: $color-g-36;
    background: white;
    cursor: pointer;

    &:focus {
      outline: none;
      border-color: #0EAEC4;
    }
  }
}

// Results Count
.results-count {
  font-size: $size-13;
  color: $color-g-54;
  font-weight: $fw-medium;
}

// Drugs List
.drugs-list {
  display: flex;
  flex-direction: column;
  gap: $size-12;
}

.drug-card {
  display: flex;
  align-items: center;
  gap: $size-16;
  background: white;
  border-radius: $size-16;
  padding: $size-16;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12);
  }

  @include responsive(phone) {
    flex-wrap: wrap;
  }

  &__image {
    position: relative;
    width: 64px;
    height: 64px;
    border-radius: $size-12;
    overflow: hidden;
    background: $color-g-97;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .drug-placeholder {
      color: $color-g-77;
    }

    .rx-badge {
      position: absolute;
      top: $size-4;
      right: $size-4;
      background: #0EAEC4;
      color: white;
      font-size: 9px;
      font-weight: $fw-bold;
      padding: 2px $size-6;
      border-radius: $size-4;
    }
  }

  &__content {
    flex: 1;
    min-width: 0;

    h3 {
      font-size: $size-14;
      font-weight: $fw-semi-bold;
      color: $color-g-21;
      margin-bottom: $size-2;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .generic-name {
      font-size: $size-12;
      color: #0EAEC4;
      font-style: italic;
      font-weight: $fw-medium;
      margin-bottom: $size-2;
    }

    .drug-details {
      font-size: $size-12;
      color: $color-g-54;
      margin-bottom: $size-8;
    }
  }

  &__footer {
    display: flex;
    align-items: center;
    gap: $size-12;

    .price {
      .currency {
        font-size: $size-11;
        color: $color-g-54;
      }

      .amount {
        font-size: $size-15;
        font-weight: $fw-bold;
        color: $color-g-21;
        margin-left: $size-2;
      }
    }
  }
}

.prescribe-btn {
  display: flex;
  align-items: center;
  gap: $size-6;
  padding: $size-8 $size-14;
  background: rgba(14, 174, 196, 0.1);
  color: #0EAEC4;
  border: none;
  border-radius: $size-8;
  font-size: $size-12;
  font-weight: $fw-semi-bold;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  flex-shrink: 0;

  &:hover:not(:disabled) {
    background: rgba(14, 174, 196, 0.18);
  }

  &:disabled {
    background: $color-g-97;
    color: $color-g-67;
    cursor: not-allowed;
  }
}

// Empty State
.empty-section {
  text-align: center;
  padding: $size-32 $size-20;
  background: $color-g-97;
  border-radius: $size-12;

  &__icon {
    width: 64px;
    height: 64px;
    margin: 0 auto $size-14;
    border-radius: 50%;
    background: rgba(14, 174, 196, 0.08);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #0EAEC4;
  }

  h3 {
    font-size: $size-15;
    font-weight: $fw-semi-bold;
    color: $color-g-21;
    margin-bottom: $size-6;
  }

  p {
    font-size: $size-13;
    color: $color-g-54;
  }
}

// Skeleton
.skeleton-card {
  height: 90px;
  border-radius: $size-16;
  background: linear-gradient(90deg, $color-g-92 25%, $color-g-97 50%, $color-g-92 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
</style>
