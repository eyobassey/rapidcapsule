<template>
  <div class="pharmacy-drugs">
    <!-- Ambient Background -->
    <div class="ambient-bg">
      <div class="orb orb--1" />
      <div class="orb orb--2" />
      <div class="orb orb--3" />
    </div>

    <!-- Mobile Header -->
    <header class="mobile-header">
      <button class="menu-btn" @click="$emit('openSideNav')">
        <v-icon name="hi-menu-alt-2" scale="1.1" />
      </button>
      <h1 class="mobile-title">Drug Catalog</h1>
      <button class="filter-toggle-btn" @click="showFilters = !showFilters">
        <v-icon name="hi-adjustments" scale="1" />
      </button>
    </header>

    <!-- Page Container -->
    <div class="page-container">
      <!-- Breadcrumbs -->
      <nav class="breadcrumbs">
        <router-link to="/app/specialist" class="breadcrumb-item">
          <v-icon name="hi-home" scale="0.7" />
          Home
        </router-link>
        <span class="breadcrumb-separator">/</span>
        <router-link to="/app/specialist/pharmacy" class="breadcrumb-item">
          Pharmacy
        </router-link>
        <span class="breadcrumb-separator">/</span>
        <span class="breadcrumb-current">Drug Catalog</span>
      </nav>

      <!-- Hero Section -->
      <section class="hero">
        <div class="hero__content">
          <button class="back-link desktop-only" @click="$router.push('/app/specialist/pharmacy')">
            <v-icon name="hi-arrow-left" scale="0.8" />
            <span>Back to Pharmacy</span>
          </button>
          <div class="hero__badge">
            <div class="badge-pulse"></div>
            <v-icon name="ri-capsule-line" />
            <span>Medication Database</span>
          </div>
          <h1 class="hero__title">
            Drug<br/>
            <span class="hero__title-accent">Catalog</span>
          </h1>
          <p class="hero__subtitle">Browse and search available medications for your patients</p>
          <div class="hero__stats">
            <div class="hero-stat">
              <span class="hero-stat__value">{{ pagination.total || 0 }}</span>
              <span class="hero-stat__label">Total</span>
            </div>
            <div class="hero-stat">
              <span class="hero-stat__value">{{ stockCounts.in_stock || 0 }}</span>
              <span class="hero-stat__label">In Stock</span>
            </div>
            <div class="hero-stat">
              <span class="hero-stat__value">{{ stockCounts.low_stock || 0 }}</span>
              <span class="hero-stat__label">Low Stock</span>
            </div>
          </div>
        </div>
        <div class="hero__visual">
          <div class="drugs-orb">
            <div class="orb-glow"></div>
            <div class="orb-ring orb-ring--1"></div>
            <div class="orb-ring orb-ring--2"></div>
            <div class="orb-ring orb-ring--3"></div>
            <div class="orb-center">
              <v-icon name="ri-capsule-line" scale="2.5" />
            </div>
          </div>
          <div class="floating-icons">
            <div class="float-icon float-icon--1">
              <v-icon name="hi-beaker" scale="1" />
            </div>
            <div class="float-icon float-icon--2">
              <v-icon name="hi-check-circle" scale="0.9" />
            </div>
            <div class="float-icon float-icon--3">
              <v-icon name="hi-search" scale="0.85" />
            </div>
          </div>
        </div>
      </section>

      <!-- Search & Filters Card -->
      <div class="filters-card glass-card" :class="{ 'filters-card--expanded': showFilters }">
        <div class="search-wrapper">
          <div class="search-icon">
            <v-icon name="hi-search" scale="0.9" />
          </div>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search medications by name or generic..."
            class="search-input"
            @input="handleSearch"
          />
          <button v-if="searchQuery" class="clear-btn" @click="clearSearch">
            <v-icon name="hi-x" scale="0.75" />
          </button>
        </div>

        <div class="filters-grid" :class="{ 'filters-grid--visible': showFilters }">
          <div class="filter-group">
            <label class="filter-label">
              <v-icon name="hi-collection" scale="0.7" />
              Category
            </label>
            <select v-model="selectedCategory" class="filter-select" @change="applyFilters">
              <option value="">All Categories</option>
              <option v-for="category in categories" :key="category._id" :value="category._id">
                {{ category.name }}
              </option>
            </select>
          </div>

          <div class="filter-group">
            <label class="filter-label">
              <v-icon name="hi-office-building" scale="0.7" />
              Manufacturer
            </label>
            <select v-model="selectedManufacturer" class="filter-select" @change="applyFilters">
              <option value="">All Manufacturers</option>
              <option v-for="manufacturer in manufacturers" :key="manufacturer._id" :value="manufacturer.name">
                {{ manufacturer.name }}
              </option>
            </select>
          </div>

          <div class="filter-group">
            <label class="filter-label">
              <v-icon name="hi-cube" scale="0.7" />
              Stock Status
            </label>
            <select v-model="stockStatus" class="filter-select" @change="applyFilters">
              <option value="all">All Stock</option>
              <option value="in_stock">In Stock</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>

          <div class="filter-group">
            <label class="filter-label">
              <v-icon name="hi-sort-ascending" scale="0.7" />
              Sort By
            </label>
            <select v-model="sortBy" class="filter-select" @change="applyFilters">
              <option value="name">Name (A-Z)</option>
              <option value="-name">Name (Z-A)</option>
              <option value="selling_price">Price (Low-High)</option>
              <option value="-selling_price">Price (High-Low)</option>
            </select>
          </div>
        </div>

        <button class="toggle-filters-btn" @click="showFilters = !showFilters">
          <v-icon :name="showFilters ? 'hi-chevron-up' : 'hi-chevron-down'" scale="0.8" />
          {{ showFilters ? 'Hide Filters' : 'Show Filters' }}
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="drugs-grid skeleton-mode">
        <div v-for="i in 8" :key="i" class="drug-card-skeleton">
          <div class="skeleton-image" />
          <div class="skeleton-content">
            <div class="skeleton-line skeleton-line--title" />
            <div class="skeleton-line skeleton-line--subtitle" />
            <div class="skeleton-line skeleton-line--details" />
            <div class="skeleton-footer">
              <div class="skeleton-line skeleton-line--price" />
              <div class="skeleton-line skeleton-line--badge" />
            </div>
          </div>
        </div>
      </div>

      <!-- Results -->
      <template v-else>
        <!-- Results Header -->
        <div v-if="drugs.length" class="results-header">
          <p class="results-count">
            <v-icon name="ri-capsule-line" scale="0.8" />
            <span>Showing <strong>{{ drugs.length }}</strong> of <strong>{{ pagination.total }}</strong> medications</span>
          </p>
          <div class="view-toggle">
            <button :class="['view-btn', { active: viewMode === 'grid' }]" @click="viewMode = 'grid'">
              <v-icon name="hi-view-grid" scale="0.85" />
            </button>
            <button :class="['view-btn', { active: viewMode === 'list' }]" @click="viewMode = 'list'">
              <v-icon name="hi-view-list" scale="0.85" />
            </button>
          </div>
        </div>

        <!-- Drugs Grid -->
        <div v-if="drugs.length" :class="['drugs-grid', `drugs-grid--${viewMode}`]">
          <div
            v-for="drug in drugs"
            :key="drug.batch_id ? `${drug._id}-${drug.batch_id}` : drug._id"
            class="drug-card glass-card"
            @click="viewDrug(drug._id, drug.batch_id)"
          >
            <!-- Drug Image -->
            <div class="drug-image">
              <img v-if="drug.primary_image" :src="drug.primary_image" :alt="drug.name" />
              <div v-else class="drug-placeholder">
                <v-icon name="ri-capsule-line" scale="1.5" />
              </div>
              <span v-if="drug.requires_prescription" class="rx-badge">
                <v-icon name="hi-clipboard-check" scale="0.6" />
                Rx
              </span>
              <div class="stock-indicator" :class="getStockClass(drug)" />
            </div>

            <!-- Drug Content -->
            <div class="drug-content">
              <h3 class="drug-name">{{ drug.name }}</h3>
              <p class="drug-generic">{{ drug.generic_name }}</p>
              <p class="drug-details">
                <span v-if="drug.strength">{{ drug.strength }}</span>
                <span v-if="drug.strength && drug.dosage_form" class="separator">•</span>
                <span v-if="drug.dosage_form">{{ drug.dosage_form }}</span>
              </p>

              <div class="drug-footer">
                <div class="drug-price">
                  <span class="currency">NGN</span>
                  <span class="amount">{{ formatCurrency(drug.selling_price) }}</span>
                </div>
                <PharmacyStatusBadge :status="getStockClass(drug)" :label="getStockLabel(drug)" size="sm" />
              </div>

              <button
                class="prescribe-btn"
                :disabled="drug.is_out_of_stock || drug.quantity === 0"
                @click.stop="prescribeDrug(drug)"
              >
                <v-icon name="hi-plus-circle" scale="0.8" />
                Prescribe
              </button>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="empty-state glass-card">
          <div class="empty-icon">
            <div class="empty-icon-bg" />
            <v-icon name="ri-capsule-line" scale="2" />
          </div>
          <h3 class="empty-title">No medications found</h3>
          <p class="empty-description">
            Try adjusting your search or filter criteria to find medications
          </p>
          <button v-if="hasActiveFilters" class="empty-action" @click="clearAllFilters">
            <v-icon name="hi-x" scale="0.85" />
            Clear All Filters
          </button>
        </div>
      </template>

      <!-- Pagination -->
      <PharmacyPagination
        v-if="pagination.totalPages > 1"
        :current-page="pagination.page"
        :total-pages="pagination.totalPages"
        @page-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toast-notification';
import apiFactory from '@/services/apiFactory';
import PharmacyStatusBadge from './components/PharmacyStatusBadge.vue';
import PharmacyPagination from './components/PharmacyPagination.vue';
import { usePharmacy } from './composables/usePharmacy';

const router = useRouter();
const $toast = useToast();
const { formatCurrency, getStockClass, getStockLabel } = usePharmacy();

const isLoading = ref(false);
const showFilters = ref(false);
const viewMode = ref('grid');
const searchQuery = ref('');
const selectedCategory = ref('');
const selectedManufacturer = ref('');
const stockStatus = ref('all');
const sortBy = ref('name');
const drugs = ref([]);
const categories = ref([]);
const manufacturers = ref([]);
const stockCounts = ref({ in_stock: 0, low_stock: 0, out_of_stock: 0 });
const pagination = ref({ page: 1, limit: 20, total: 0, totalPages: 0 });
let debounceTimer = null;

const hasActiveFilters = computed(() => {
  return searchQuery.value || selectedCategory.value || selectedManufacturer.value || stockStatus.value !== 'all';
});

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

function clearAllFilters() {
  searchQuery.value = '';
  selectedCategory.value = '';
  selectedManufacturer.value = '';
  stockStatus.value = 'all';
  sortBy.value = 'name';
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
      if (result.stock_counts) {
        stockCounts.value = result.stock_counts;
      }
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
// Design System Tokens
$sky: #4FC3F7;
$sky-light: #E1F5FE;
$sky-dark: #0288D1;
$sky-darker: #01579B;
$emerald: #10B981;
$emerald-light: #D1FAE5;
$amber: #F59E0B;
$amber-light: #FEF3C7;
$rose: #F43F5E;
$rose-light: #FFE4E6;
$violet: #8B5CF6;
$violet-light: #EDE9FE;

// Base Layout
.pharmacy-drugs {
  position: relative;
  min-height: 100vh;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  overflow-x: hidden;
}

// Ambient Background
.ambient-bg {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.5;
  animation: float 20s ease-in-out infinite;

  &--1 {
    width: 400px;
    height: 400px;
    background: $sky-light;
    top: -100px;
    right: -100px;
    animation-delay: 0s;
  }

  &--2 {
    width: 300px;
    height: 300px;
    background: rgba($emerald, 0.15);
    bottom: 20%;
    left: -80px;
    animation-delay: -7s;
  }

  &--3 {
    width: 250px;
    height: 250px;
    background: rgba($violet, 0.12);
    top: 50%;
    right: 15%;
    animation-delay: -14s;
  }
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(20px, -20px) scale(1.05); }
  50% { transform: translate(-10px, 15px) scale(0.95); }
  75% { transform: translate(15px, 10px) scale(1.02); }
}

// Mobile Header
.mobile-header {
  display: none;
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  padding: $size-12 $size-16;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  align-items: center;
  justify-content: space-between;

  @include responsive(tab-portrait) {
    display: flex;
  }

  .menu-btn, .filter-toggle-btn {
    width: 40px;
    height: 40px;
    border: none;
    background: transparent;
    border-radius: $size-10;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $color-g-36;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: rgba($sky, 0.1);
      color: $sky-dark;
    }
  }

  .mobile-title {
    font-size: $size-16;
    font-weight: $fw-semi-bold;
    color: $color-g-21;
  }
}

// Page Container
.page-container {
  position: relative;
  z-index: 1;
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px 32px 100px;

  @media (max-width: 768px) {
    padding: 16px 16px 100px;
  }
}

// Breadcrumbs
.breadcrumbs {
  display: flex;
  align-items: center;
  gap: $size-8;
  margin-bottom: $size-20;
  font-size: $size-13;

  @include responsive(tab-portrait) {
    display: none;
  }

  .breadcrumb-item {
    display: flex;
    align-items: center;
    gap: $size-4;
    color: $color-g-54;
    text-decoration: none;
    transition: color 0.2s;

    &:hover {
      color: $sky-dark;
    }
  }

  .breadcrumb-separator {
    color: $color-g-67;
  }

  .breadcrumb-current {
    color: $color-g-21;
    font-weight: $fw-medium;
  }
}

// Hero Section
.hero {
  background: linear-gradient(135deg, $sky 0%, $sky-dark 50%, $sky-darker 100%);
  border-radius: 32px;
  padding: 48px 56px;
  margin-bottom: 32px;
  position: relative;
  overflow: hidden;
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 48px;
  align-items: center;
  min-height: 320px;
  box-shadow:
    0 25px 80px rgba($sky-dark, 0.35),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;

  &::before {
    content: '';
    position: absolute;
    top: -60%;
    right: -20%;
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%);
    pointer-events: none;
  }

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 32px;
    padding: 36px 32px;
    min-height: auto;
  }

  @media (max-width: 768px) {
    padding: 28px 24px;
    border-radius: 24px;
  }
}

.hero__content {
  position: relative;
  z-index: 2;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 20px;

  &:hover {
    background: rgba(255, 255, 255, 0.25);
    transform: translateX(-4px);
  }

  &.desktop-only {
    @media (max-width: 768px) {
      display: none;
    }
  }
}

.hero__badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(12px);
  padding: 8px 16px;
  border-radius: 24px;
  font-size: 13px;
  font-weight: 600;
  color: white;
  margin-bottom: 16px;

  .badge-pulse {
    width: 8px;
    height: 8px;
    background: #4ade80;
    border-radius: 50%;
    animation: pulse-glow 2s ease-in-out infinite;
  }
}

@keyframes pulse-glow {
  0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.4); }
  50% { opacity: 0.8; box-shadow: 0 0 0 8px rgba(74, 222, 128, 0); }
}

.hero__title {
  font-size: 56px;
  font-weight: 800;
  color: white;
  line-height: 1.05;
  letter-spacing: -0.03em;
  margin-bottom: 16px;

  @media (max-width: 1024px) {
    font-size: 44px;
  }

  @media (max-width: 768px) {
    font-size: 36px;
  }
}

.hero__title-accent {
  background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 50%, #7dd3fc 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero__subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
  max-width: 320px;
  line-height: 1.5;
  margin-bottom: 24px;

  @media (max-width: 1024px) {
    max-width: 100%;
  }
}

.hero__stats {
  display: flex;
  gap: 24px;

  @media (max-width: 768px) {
    gap: 16px;
  }
}

.hero-stat {
  display: flex;
  flex-direction: column;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);

  &__value {
    font-size: 28px;
    font-weight: 700;
    color: white;
    line-height: 1.1;

    @media (max-width: 768px) {
      font-size: 22px;
    }
  }

  &__label {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.7);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-top: 4px;
  }
}

.hero__visual {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 240px;

  @media (max-width: 1024px) {
    display: none;
  }
}

.drugs-orb {
  position: relative;
  width: 180px;
  height: 180px;
}

.orb-glow {
  position: absolute;
  inset: -20px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
  border-radius: 50%;
  animation: pulse 3s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.1); opacity: 0.4; }
}

.orb-ring {
  position: absolute;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.2);

  &--1 {
    inset: 0;
    animation: spin-slow 20s linear infinite;
  }

  &--2 {
    inset: 15px;
    border-style: dashed;
    animation: spin-slow 15s linear infinite reverse;
  }

  &--3 {
    inset: 30px;
    animation: spin-slow 25s linear infinite;
  }
}

@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.orb-center {
  position: absolute;
  inset: 45px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(12px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.floating-icons {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.float-icon {
  position: absolute;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(8px);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  animation: float 6s ease-in-out infinite;

  &--1 {
    width: 52px;
    height: 52px;
    top: 0;
    left: 0;
    animation-delay: 0s;
  }

  &--2 {
    width: 46px;
    height: 46px;
    top: 20px;
    right: -10px;
    animation-delay: -2s;
  }

  &--3 {
    width: 44px;
    height: 44px;
    bottom: 10px;
    left: 10px;
    animation-delay: -4s;
  }
}

@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-8px) rotate(3deg); }
  75% { transform: translateY(6px) rotate(-2deg); }
}

// Glass Card Mixin
.glass-card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: $size-16;
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.06),
    0 1px 2px rgba(0, 0, 0, 0.04);
}

// Filters Card
.filters-card {
  padding: $size-20;
  margin-bottom: $size-20;
}

.search-wrapper {
  display: flex;
  align-items: center;
  gap: $size-12;
  background: rgba($color-g-97, 0.8);
  border-radius: $size-12;
  padding: $size-12 $size-16;
  margin-bottom: $size-16;
  transition: all 0.2s;
  border: 1px solid transparent;

  &:focus-within {
    background: rgba($sky, 0.05);
    border-color: rgba($sky, 0.2);
  }
}

.search-icon {
  color: $color-g-54;
  flex-shrink: 0;
}

.search-input {
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
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $color-g-85;
  border: none;
  border-radius: $size-6;
  color: $color-g-54;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: $color-g-67;
    color: $color-g-36;
  }
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $size-14;
  margin-bottom: $size-14;

  @include responsive(tab-portrait) {
    display: none;
    grid-template-columns: repeat(2, 1fr);

    &--visible {
      display: grid;
    }
  }

  @include responsive(phone) {
    grid-template-columns: 1fr;
  }
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: $size-6;
}

.filter-label {
  display: flex;
  align-items: center;
  gap: $size-6;
  font-size: $size-12;
  font-weight: $fw-medium;
  color: $color-g-54;

  svg { color: $color-g-67; }
}

.filter-select {
  padding: $size-10 $size-14;
  border: 1px solid rgba($color-g-85, 0.8);
  border-radius: $size-10;
  font-size: $size-13;
  color: $color-g-36;
  background: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: $sky;
    box-shadow: 0 0 0 3px rgba($sky, 0.1);
  }
}

.toggle-filters-btn {
  display: none;
  width: 100%;
  align-items: center;
  justify-content: center;
  gap: $size-6;
  padding: $size-10;
  background: transparent;
  border: 1px dashed $color-g-85;
  border-radius: $size-8;
  font-size: $size-13;
  font-weight: $fw-medium;
  color: $color-g-54;
  cursor: pointer;
  transition: all 0.2s;

  @include responsive(tab-portrait) {
    display: flex;
  }

  &:hover {
    border-color: $sky;
    color: $sky-dark;
  }
}

// Results Header
.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $size-16;
}

.results-count {
  display: flex;
  align-items: center;
  gap: $size-8;
  font-size: $size-13;
  color: $color-g-54;

  svg { color: $sky-dark; }

  strong {
    color: $color-g-21;
    font-weight: $fw-semi-bold;
  }
}

.view-toggle {
  display: flex;
  gap: $size-4;
  background: rgba($color-g-97, 0.8);
  padding: $size-4;
  border-radius: $size-8;
}

.view-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: $size-6;
  color: $color-g-54;
  cursor: pointer;
  transition: all 0.2s;

  &.active {
    background: white;
    color: $sky-dark;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  &:hover:not(.active) {
    color: $color-g-36;
  }
}

// Drugs Grid
.drugs-grid {
  display: grid;
  gap: $size-16;

  &--grid {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));

    @include responsive(phone) {
      grid-template-columns: repeat(2, 1fr);
      gap: $size-12;
    }
  }

  &--list {
    grid-template-columns: 1fr;

    .drug-card {
      flex-direction: row;

      .drug-image {
        width: 80px;
        height: 80px;
        flex-shrink: 0;
      }

      .drug-content {
        flex: 1;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: $size-12;
      }

      .drug-name { flex: 1; min-width: 150px; }
      .drug-generic { display: none; }
      .drug-details { flex: 0 0 auto; margin-bottom: 0; }
      .drug-footer { flex: 0 0 auto; margin-top: 0; }
      .prescribe-btn { margin-top: 0; }
    }
  }
}

// Drug Card
.drug-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.25s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow:
      0 12px 40px rgba(0, 0, 0, 0.12),
      0 1px 2px rgba(0, 0, 0, 0.04);
  }
}

.drug-image {
  position: relative;
  width: 100%;
  height: 140px;
  background: linear-gradient(135deg, $color-g-97 0%, $color-g-92 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.drug-placeholder {
  color: $color-g-67;
}

.rx-badge {
  position: absolute;
  top: $size-10;
  left: $size-10;
  display: flex;
  align-items: center;
  gap: $size-4;
  background: rgba($sky-dark, 0.9);
  backdrop-filter: blur(8px);
  color: white;
  font-size: $size-10;
  font-weight: $fw-bold;
  padding: $size-4 $size-8;
  border-radius: $size-6;
}

.stock-indicator {
  position: absolute;
  top: $size-10;
  right: $size-10;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);

  &.delivered, &.in_stock { background: $emerald; }
  &.processing, &.low_stock { background: $amber; }
  &.cancelled, &.out_of_stock { background: $rose; }
}

.drug-content {
  padding: $size-16;
}

.drug-name {
  font-size: $size-14;
  font-weight: $fw-semi-bold;
  color: $color-g-21;
  margin-bottom: $size-4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.drug-generic {
  font-size: $size-12;
  color: $sky-dark;
  font-style: italic;
  font-weight: $fw-medium;
  margin-bottom: $size-4;
}

.drug-details {
  font-size: $size-12;
  color: $color-g-54;
  margin-bottom: $size-12;

  .separator {
    margin: 0 $size-6;
    color: $color-g-67;
  }
}

.drug-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $size-12;
}

.drug-price {
  display: flex;
  align-items: baseline;
  gap: $size-2;

  .currency {
    font-size: $size-11;
    color: $color-g-54;
  }

  .amount {
    font-size: $size-16;
    font-weight: $fw-bold;
    color: $color-g-21;
  }
}

.prescribe-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $size-8;
  padding: $size-10 $size-16;
  background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
  color: white;
  border: none;
  border-radius: $size-10;
  font-size: $size-13;
  font-weight: $fw-semi-bold;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba($sky-dark, 0.3);
  }

  &:disabled {
    background: $color-g-92;
    color: $color-g-67;
    cursor: not-allowed;
  }
}

// Skeleton Loading
.skeleton-mode {
  .drug-card-skeleton {
    background: rgba(255, 255, 255, 0.8);
    border-radius: $size-16;
    overflow: hidden;
  }
}

.skeleton-image {
  width: 100%;
  height: 140px;
  background: linear-gradient(90deg, $color-g-92 25%, $color-g-97 50%, $color-g-92 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-content {
  padding: $size-16;
}

.skeleton-line {
  height: 14px;
  border-radius: $size-4;
  background: linear-gradient(90deg, $color-g-92 25%, $color-g-97 50%, $color-g-92 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  margin-bottom: $size-8;

  &--title { width: 80%; height: 16px; }
  &--subtitle { width: 60%; }
  &--details { width: 50%; }
  &--price { width: 40%; height: 18px; }
  &--badge { width: 60px; height: 22px; border-radius: $size-6; }
}

.skeleton-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: $size-12;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

// Empty State
.empty-state {
  text-align: center;
  padding: $size-48 $size-24;
}

.empty-icon {
  position: relative;
  width: 80px;
  height: 80px;
  margin: 0 auto $size-20;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $sky-dark;
}

.empty-icon-bg {
  position: absolute;
  inset: 0;
  background: rgba($sky, 0.1);
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.7; }
}

.empty-title {
  font-size: $size-18;
  font-weight: $fw-semi-bold;
  color: $color-g-21;
  margin-bottom: $size-8;
}

.empty-description {
  font-size: $size-14;
  color: $color-g-54;
  margin-bottom: $size-24;
  max-width: 300px;
  margin-left: auto;
  margin-right: auto;
}

.empty-action {
  display: inline-flex;
  align-items: center;
  gap: $size-8;
  background: rgba($sky, 0.1);
  color: $sky-dark;
  border: none;
  border-radius: $size-10;
  padding: $size-12 $size-24;
  font-size: $size-14;
  font-weight: $fw-semi-bold;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba($sky, 0.15);
  }
}
</style>
