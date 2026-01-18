<template>
  <div class="page-content">
    <top-bar
      type="title-with-back"
      :title="categoryTitle"
      @open-side-nav="$emit('openSideNav')"
      @go-back="$router.back()"
    />

    <div class="page-content__body">
      <div class="category-page">
        <!-- Breadcrumbs -->
        <nav class="breadcrumbs">
          <router-link to="/app/patient/pharmacy" class="breadcrumb-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            Pharmacy
          </router-link>
          <span class="breadcrumb-separator">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </span>
          <router-link to="/app/patient/pharmacy/categories" class="breadcrumb-link">
            Categories
          </router-link>
          <span class="breadcrumb-separator">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </span>
          <span class="breadcrumb-current">{{ categoryTitle }}</span>
        </nav>

        <!-- Category Header -->
        <div class="category-header">
          <div class="category-header__bg"></div>
          <div class="category-header__content">
            <div class="category-icon" :class="{ 'has-image': categoryImageUrl }">
              <!-- Use image from database if available -->
              <img
                v-if="categoryImageUrl"
                :src="categoryImageUrl"
                :alt="categoryTitle"
                class="category-image"
                @error="handleCategoryImageError"
              />
              <!-- Fallback to icon -->
              <RCIcon v-else :icon="categoryIcon" />
            </div>
            <div class="category-info">
              <h1>{{ categoryTitle }}</h1>
              <p>{{ categoryDescription }}</p>
              <div class="category-stats" v-if="!loading">
                <div class="stat">
                  <span class="stat-value">{{ totalDrugs }}</span>
                  <span class="stat-label">Products</span>
                </div>
                <div class="stat-divider"></div>
                <div class="stat" v-if="priceRange.min !== null">
                  <span class="stat-value">₦{{ formatNumber(priceRange.min) }} - ₦{{ formatNumber(priceRange.max) }}</span>
                  <span class="stat-label">Price Range</span>
                </div>
                <div class="stat-divider" v-if="inStockCount > 0"></div>
                <div class="stat" v-if="inStockCount > 0">
                  <span class="stat-value">{{ inStockCount }}</span>
                  <span class="stat-label">In Stock</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Search Bar -->
        <div class="search-section">
          <div class="search-input-wrapper">
            <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              type="text"
              v-model="searchQuery"
              :placeholder="`Search in ${categoryTitle}...`"
              class="search-input"
              @input="debouncedSearch"
            />
            <button v-if="searchQuery" class="search-clear" @click="clearSearch">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Filters Section -->
        <div class="filters-section">
          <!-- Quick Filters -->
          <div class="quick-filters">
            <button
              :class="['filter-chip', { active: !showOnlyAvailable && !showOnlyOTC && !showOnlyPrescription }]"
              @click="clearQuickFilters"
            >
              All
            </button>
            <button
              :class="['filter-chip', { active: showOnlyAvailable }]"
              @click="toggleFilter('available')"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              In Stock
            </button>
            <button
              :class="['filter-chip', { active: showOnlyOTC }]"
              @click="toggleFilter('otc')"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
              </svg>
              OTC Only
            </button>
            <button
              :class="['filter-chip', { active: showOnlyPrescription }]"
              @click="toggleFilter('prescription')"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
              Rx Only
            </button>
          </div>

          <!-- Sort & View Controls -->
          <div class="controls-row">
            <div class="sort-controls">
              <label class="sort-label">Sort by:</label>
              <div class="sort-buttons">
                <button
                  v-for="option in sortOptions"
                  :key="option.value"
                  :class="['sort-btn', { active: sortBy === option.value }]"
                  @click="setSortBy(option.value)"
                >
                  {{ option.label }}
                </button>
              </div>
            </div>
            <div class="view-toggle">
              <button
                :class="['view-btn', { active: viewMode === 'grid' }]"
                @click="viewMode = 'grid'"
                title="Grid View"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="7" height="7"/>
                  <rect x="14" y="3" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/>
                </svg>
              </button>
              <button
                :class="['view-btn', { active: viewMode === 'list' }]"
                @click="viewMode = 'list'"
                title="List View"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="8" y1="6" x2="21" y2="6"/>
                  <line x1="8" y1="12" x2="21" y2="12"/>
                  <line x1="8" y1="18" x2="21" y2="18"/>
                  <line x1="3" y1="6" x2="3.01" y2="6"/>
                  <line x1="3" y1="12" x2="3.01" y2="12"/>
                  <line x1="3" y1="18" x2="3.01" y2="18"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Price Range Filter -->
          <div class="price-filter" v-if="showPriceFilter">
            <label>Price Range:</label>
            <div class="price-inputs">
              <div class="price-input-group">
                <span class="currency">₦</span>
                <input
                  type="number"
                  v-model.number="minPrice"
                  placeholder="Min"
                  @change="applyPriceFilter"
                />
              </div>
              <span class="price-separator">-</span>
              <div class="price-input-group">
                <span class="currency">₦</span>
                <input
                  type="number"
                  v-model.number="maxPrice"
                  placeholder="Max"
                  @change="applyPriceFilter"
                />
              </div>
              <button class="price-apply-btn" @click="applyPriceFilter">Apply</button>
            </div>
          </div>
        </div>

        <!-- Results Info -->
        <div class="results-info" v-if="!loading">
          <span class="results-count">
            Showing {{ drugs.length }} of {{ totalDrugs }} medications
            <span v-if="searchQuery"> for "{{ searchQuery }}"</span>
          </span>
          <button
            v-if="hasActiveFilters"
            class="clear-filters-btn"
            @click="clearAllFilters"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
            Clear Filters
          </button>
        </div>

        <!-- Skeleton Loading -->
        <div v-if="loading" :class="['drugs-grid', viewMode]">
          <div v-for="n in 8" :key="n" class="drug-skeleton">
            <div class="skeleton-image"></div>
            <div class="skeleton-content">
              <div class="skeleton-line title"></div>
              <div class="skeleton-line subtitle"></div>
              <div class="skeleton-line details"></div>
            </div>
            <div class="skeleton-footer">
              <div class="skeleton-line price"></div>
              <div class="skeleton-line stock"></div>
            </div>
            <div class="skeleton-button"></div>
          </div>
        </div>

        <!-- Drugs Grid/List -->
        <div v-else-if="drugs.length > 0" :class="['drugs-grid', viewMode]">
          <DrugCard
            v-for="drug in drugs"
            :key="drug._id"
            :drug="drug"
            :view-mode="viewMode"
            @add-to-cart="addToCart"
            @view-details="viewDrugDetails"
          />
        </div>

        <!-- Empty State -->
        <div v-else-if="!loading && drugs.length === 0" class="empty-state">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </div>
          <h3>No medications found</h3>
          <p v-if="searchQuery">
            No results for "{{ searchQuery }}" in {{ categoryTitle }}.
            <br />Try a different search term or browse all medications.
          </p>
          <p v-else>
            This category doesn't have any available medications yet.
          </p>
          <div class="empty-actions">
            <rc-button
              v-if="searchQuery || hasActiveFilters"
              type="secondary"
              label="Clear Filters"
              @click="clearAllFilters"
            />
            <rc-button
              type="primary"
              label="Browse All Medications"
              @click="$router.push('/app/patient/pharmacy/otc')"
            />
          </div>
        </div>

        <!-- Load More -->
        <div v-if="hasMore && drugs.length > 0 && !loading" class="load-more">
          <rc-button
            type="secondary"
            :label="loadingMore ? 'Loading...' : `Load More (${drugs.length} of ${totalDrugs})`"
            :loading="loadingMore"
            @click="loadMore"
          />
        </div>
      </div>
    </div>

    <!-- Floating Cart Button -->
    <div class="floating-cart" v-if="cartItemCount > 0" @click="goToCart">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="9" cy="21" r="1"/>
        <circle cx="20" cy="21" r="1"/>
        <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
      </svg>
      <span class="cart-badge">{{ cartItemCount }}</span>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import TopBar from "@/components/Navigation/top-bar";
import RcButton from "@/components/buttons/button-primary";
import RCIcon from "@/components/RCIcon/RCIcon.vue";
import DrugCard from "./components/DrugCard.vue";
import {
  mapActions as useMapActions,
  mapGetters as useMapGetters,
} from "@/utilities/utilityStore";

export default {
  name: "DrugCategory",
  components: {
    TopBar,
    RcButton,
    RCIcon,
    DrugCard,
  },
  emits: ["openSideNav"],
  setup() {
    const router = useRouter();
    const route = useRoute();

    // State
    const sortBy = ref("name");
    const showOnlyAvailable = ref(false);
    const showOnlyOTC = ref(false);
    const showOnlyPrescription = ref(false);
    const searchQuery = ref("");
    const viewMode = ref("grid");
    const page = ref(1);
    const loadingMore = ref(false);
    const minPrice = ref(null);
    const maxPrice = ref(null);
    const showPriceFilter = ref(false);

    let searchTimeout = null;

    const sortOptions = [
      { value: "name", label: "Name" },
      { value: "price_asc", label: "Price ↑" },
      { value: "price_desc", label: "Price ↓" },
      { value: "popular", label: "Popular" },
    ];

    const categoryData = {
      "pain-relief": {
        title: "Pain Relief",
        description: "Analgesics and pain management medications for headaches, muscle pain, and more",
        icon: "pill",
      },
      "cold-flu": {
        title: "Cold & Flu",
        description: "Medications for cold, flu, cough, and respiratory symptoms",
        icon: "thermometer",
      },
      digestive: {
        title: "Digestive Health",
        description: "Antacids, laxatives, anti-diarrheal, and digestive aids",
        icon: "stomach",
      },
      allergy: {
        title: "Allergy & Sinus",
        description: "Antihistamines and allergy relief medications",
        icon: "flower",
      },
      allergies: {
        title: "Allergy & Sinus",
        description: "Antihistamines and allergy relief medications",
        icon: "flower",
      },
      "skin-care": {
        title: "Skin Care",
        description: "Topical treatments, creams, and dermatological products",
        icon: "droplet",
      },
      vitamins: {
        title: "Vitamins & Supplements",
        description: "Nutritional supplements, multivitamins, and minerals",
        icon: "sun",
      },
      "vitamins-supplements": {
        title: "Vitamins & Supplements",
        description: "Nutritional supplements, multivitamins, and minerals",
        icon: "sun",
      },
      "first-aid": {
        title: "First Aid",
        description: "First aid supplies, bandages, and wound care products",
        icon: "plus-circle",
      },
      "eye-care": {
        title: "Eye Care",
        description: "Eye drops, contact lens solutions, and ophthalmic products",
        icon: "eye",
      },
      antibiotics: {
        title: "Antibiotics",
        description: "Prescription antibiotics for bacterial infections",
        icon: "shield",
      },
      "mental-health": {
        title: "Mental Health",
        description: "Medications for anxiety, depression, and mental wellness",
        icon: "brain",
      },
      cardiovascular: {
        title: "Cardiovascular",
        description: "Heart health and blood pressure medications",
        icon: "heart",
      },
      diabetes: {
        title: "Diabetes Care",
        description: "Insulin, glucose monitoring, and diabetes management",
        icon: "activity",
      },
      respiratory: {
        title: "Respiratory",
        description: "Inhalers, nebulizers, and breathing medications",
        icon: "wind",
      },
      "womens-health": {
        title: "Women's Health",
        description: "Feminine care, contraceptives, and women's medications",
        icon: "heart",
      },
      "mens-health": {
        title: "Men's Health",
        description: "Men's wellness and health products",
        icon: "user",
      },
    };

    const {
      "pharmacy/fetchDrugsByCategory": fetchDrugsByCategory,
      "pharmacy/addToCart": addToCartAction,
      "pharmacy/fetchDrugCategories": fetchDrugCategories,
    } = useMapActions();

    const {
      "pharmacy/getCategoryDrugs": categoryDrugs,
      "pharmacy/getLoading": isLoading,
      "pharmacy/getCartItemCount": cartItemCount,
      "pharmacy/getTotalDrugs": totalDrugs,
      "pharmacy/getCurrentCategoryName": currentCategoryName,
      "pharmacy/getDrugCategories": drugCategories,
    } = useMapGetters();

    const loading = computed(() => isLoading.value);
    const drugs = computed(() => categoryDrugs.value || []);
    const hasMore = computed(() => drugs.value.length < totalDrugs.value);

    // Calculate price range from loaded drugs
    const priceRange = computed(() => {
      if (!drugs.value.length) return { min: null, max: null };
      const prices = drugs.value.map(d => d.selling_price).filter(p => p > 0);
      return {
        min: Math.min(...prices),
        max: Math.max(...prices),
      };
    });

    // Count in-stock items
    const inStockCount = computed(() => {
      return drugs.value.filter(d => d.is_available !== false && (d.quantity_in_stock ?? d.quantity ?? 0) > 0).length;
    });

    // Check if any filters are active
    const hasActiveFilters = computed(() => {
      return searchQuery.value || showOnlyAvailable.value || showOnlyOTC.value ||
             showOnlyPrescription.value || minPrice.value || maxPrice.value;
    });

    const currentCategory = computed(() => {
      const slug = route.params.slug?.toLowerCase();

      // First, try to find category from API data (Vuex store)
      const apiCategory = drugCategories.value?.find(c => c.slug === slug);
      if (apiCategory) {
        return {
          title: apiCategory.name,
          description: apiCategory.description || categoryData[slug]?.description || `Browse ${apiCategory.name} medications`,
          icon: categoryData[slug]?.icon || "pill",
          image_url: apiCategory.image_url || null,
        };
      }

      // Fallback to hardcoded data
      if (categoryData[slug]) {
        return { ...categoryData[slug], image_url: null };
      }
      if (currentCategoryName.value) {
        return {
          title: currentCategoryName.value,
          description: `Browse ${currentCategoryName.value} medications`,
          icon: "pill",
          image_url: null,
        };
      }
      return {
        title: slug ? slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : "Category",
        description: "Browse medications in this category",
        icon: "pill",
        image_url: null,
      };
    });

    const categoryTitle = computed(() => currentCategory.value.title);
    const categoryDescription = computed(() => currentCategory.value.description);
    const categoryIcon = computed(() => currentCategory.value.icon);
    const categoryImageUrl = ref(null);

    // Update categoryImageUrl when currentCategory changes
    watch(() => currentCategory.value.image_url, (newUrl) => {
      categoryImageUrl.value = newUrl;
    }, { immediate: true });

    const handleCategoryImageError = () => {
      // Hide broken image and let the icon fallback show
      categoryImageUrl.value = null;
    };

    const formatNumber = (num) => {
      if (!num) return "0";
      return Number(num).toLocaleString("en-NG");
    };

    const fetchCategoryDrugs = async (reset = false) => {
      if (reset) {
        page.value = 1;
      }

      await fetchDrugsByCategory({
        category: route.params.slug,
        page: page.value,
        limit: 20,
        sort: sortBy.value,
        available_only: showOnlyAvailable.value,
        search: searchQuery.value || undefined,
        otc_only: showOnlyOTC.value || undefined,
        prescription_only: showOnlyPrescription.value || undefined,
        min_price: minPrice.value || undefined,
        max_price: maxPrice.value || undefined,
      });
    };

    const loadMore = async () => {
      loadingMore.value = true;
      page.value += 1;
      await fetchCategoryDrugs();
      loadingMore.value = false;
    };

    const debouncedSearch = () => {
      if (searchTimeout) clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        fetchCategoryDrugs(true);
      }, 300);
    };

    const clearSearch = () => {
      searchQuery.value = "";
      fetchCategoryDrugs(true);
    };

    const setSortBy = (value) => {
      sortBy.value = value;
      fetchCategoryDrugs(true);
    };

    const toggleFilter = (filter) => {
      if (filter === "available") {
        showOnlyAvailable.value = !showOnlyAvailable.value;
        showOnlyOTC.value = false;
        showOnlyPrescription.value = false;
      } else if (filter === "otc") {
        showOnlyOTC.value = !showOnlyOTC.value;
        showOnlyAvailable.value = false;
        showOnlyPrescription.value = false;
      } else if (filter === "prescription") {
        showOnlyPrescription.value = !showOnlyPrescription.value;
        showOnlyAvailable.value = false;
        showOnlyOTC.value = false;
      }
      fetchCategoryDrugs(true);
    };

    const clearQuickFilters = () => {
      showOnlyAvailable.value = false;
      showOnlyOTC.value = false;
      showOnlyPrescription.value = false;
      fetchCategoryDrugs(true);
    };

    const applyPriceFilter = () => {
      fetchCategoryDrugs(true);
    };

    const clearAllFilters = () => {
      searchQuery.value = "";
      showOnlyAvailable.value = false;
      showOnlyOTC.value = false;
      showOnlyPrescription.value = false;
      minPrice.value = null;
      maxPrice.value = null;
      sortBy.value = "name";
      fetchCategoryDrugs(true);
    };

    const addToCart = (drug) => {
      addToCartAction({
        drugId: drug._id,
        name: drug.name,
        strength: drug.strength,
        dosageForm: drug.dosage_form,
        route: drug.route,
        routeAbbreviation: drug.route_abbreviation,
        manufacturer: drug.manufacturer,
        price: drug.selling_price,
        quantity: 1,
        imageUrl: drug.image_url || drug.primary_image,
      });
    };

    const viewDrugDetails = (drugId) => {
      router.push(`/app/patient/pharmacy/drug/${drugId}`);
    };

    const goToCart = () => {
      router.push("/app/patient/pharmacy/cart");
    };

    watch(
      () => route.params.slug,
      () => {
        clearAllFilters();
      }
    );

    onMounted(() => {
      fetchDrugCategories(); // Fetch categories to get descriptions from DB
      fetchCategoryDrugs(true);
    });

    return {
      sortBy,
      sortOptions,
      showOnlyAvailable,
      showOnlyOTC,
      showOnlyPrescription,
      searchQuery,
      viewMode,
      minPrice,
      maxPrice,
      showPriceFilter,
      drugs,
      loading,
      loadingMore,
      totalDrugs,
      hasMore,
      hasActiveFilters,
      priceRange,
      inStockCount,
      categoryTitle,
      categoryDescription,
      categoryIcon,
      categoryImageUrl,
      cartItemCount,
      formatNumber,
      fetchCategoryDrugs,
      loadMore,
      debouncedSearch,
      clearSearch,
      setSortBy,
      toggleFilter,
      clearQuickFilters,
      applyPriceFilter,
      clearAllFilters,
      addToCart,
      viewDrugDetails,
      goToCart,
      handleCategoryImageError,
    };
  },
};
</script>

<style scoped lang="scss">
.category-page {
  padding: $size-16;
  max-width: 1400px;
  margin: 0 auto;

  // Breadcrumbs
  .breadcrumbs {
    display: flex;
    align-items: center;
    gap: $size-8;
    margin-bottom: $size-20;
    font-size: $size-13;
    flex-wrap: wrap;

    .breadcrumb-link {
      display: flex;
      align-items: center;
      gap: $size-4;
      color: $color-g-54;
      text-decoration: none;
      transition: color 0.2s;

      &:hover {
        color: $color-pri;
      }

      svg {
        width: $size-14;
        height: $size-14;
      }
    }

    .breadcrumb-separator {
      color: $color-g-77;

      svg {
        width: $size-14;
        height: $size-14;
      }
    }

    .breadcrumb-current {
      color: $color-g-21;
      font-weight: 500;
    }
  }

  // Category Header
  .category-header {
    position: relative;
    border-radius: $size-16;
    overflow: hidden;
    margin-bottom: $size-24;

    &__bg {
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, $color-pri 0%, darken($color-pri, 20%) 100%);

      &::after {
        content: "";
        position: absolute;
        inset: 0;
        background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
      }
    }

    &__content {
      position: relative;
      display: flex;
      align-items: center;
      gap: $size-20;
      padding: $size-24 $size-24;
      color: white;

      @include responsive(phone) {
        flex-direction: column;
        text-align: center;
        padding: $size-20;
      }
    }

    .category-icon {
      width: $size-72;
      height: $size-72;
      min-width: $size-72;
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px);
      border-radius: $size-16;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;

      :deep(svg) {
        width: $size-36;
        height: $size-36;
        color: white;
      }

      &.has-image {
        background: white;
        backdrop-filter: none;
        border: 2px solid rgba(255, 255, 255, 0.3);
      }

      .category-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      @include responsive(phone) {
        width: $size-56;
        height: $size-56;
        min-width: $size-56;

        :deep(svg) {
          width: $size-28;
          height: $size-28;
        }
      }
    }

    .category-info {
      flex: 1;

      h1 {
        font-size: $size-28;
        font-weight: 700;
        margin-bottom: $size-6;

        @include responsive(phone) {
          font-size: $size-22;
        }
      }

      p {
        font-size: $size-14;
        opacity: 0.9;
        margin-bottom: $size-12;
      }

      .category-stats {
        display: flex;
        align-items: center;
        gap: $size-16;
        margin-top: $size-12;
        flex-wrap: wrap;

        @include responsive(phone) {
          justify-content: center;
        }

        .stat {
          display: flex;
          flex-direction: column;

          .stat-value {
            font-size: $size-18;
            font-weight: 700;
          }

          .stat-label {
            font-size: $size-11;
            opacity: 0.8;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
        }

        .stat-divider {
          width: 1px;
          height: $size-32;
          background: rgba(255, 255, 255, 0.3);
        }
      }
    }
  }

  // Search Section
  .search-section {
    margin-bottom: $size-16;

    .search-input-wrapper {
      position: relative;
      display: flex;
      align-items: center;

      .search-icon {
        position: absolute;
        left: $size-14;
        width: $size-20;
        height: $size-20;
        color: $color-g-67;
        pointer-events: none;
      }

      .search-input {
        width: 100%;
        padding: $size-14 $size-44 $size-14 $size-44;
        border: 2px solid $color-g-90;
        border-radius: $size-12;
        font-size: $size-15;
        transition: all 0.2s;
        background: $color-white;

        &:focus {
          outline: none;
          border-color: $color-pri;
          box-shadow: 0 0 0 3px rgba($color-pri, 0.1);
        }

        &::placeholder {
          color: $color-g-67;
        }
      }

      .search-clear {
        position: absolute;
        right: $size-12;
        width: $size-28;
        height: $size-28;
        display: flex;
        align-items: center;
        justify-content: center;
        background: $color-g-92;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        transition: all 0.2s;

        svg {
          width: $size-14;
          height: $size-14;
          color: $color-g-54;
        }

        &:hover {
          background: $color-g-85;
        }
      }
    }
  }

  // Filters Section
  .filters-section {
    margin-bottom: $size-20;

    .quick-filters {
      display: flex;
      flex-wrap: wrap;
      gap: $size-8;
      margin-bottom: $size-16;

      .filter-chip {
        display: flex;
        align-items: center;
        gap: $size-6;
        padding: $size-8 $size-16;
        border: 1.5px solid $color-g-85;
        border-radius: $size-20;
        background: $color-white;
        font-size: $size-13;
        font-weight: 500;
        color: $color-g-44;
        cursor: pointer;
        transition: all 0.2s;

        svg {
          width: $size-14;
          height: $size-14;
        }

        &:hover {
          border-color: $color-pri;
          color: $color-pri;
        }

        &.active {
          background: $color-pri;
          border-color: $color-pri;
          color: white;
        }
      }
    }

    .controls-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: $size-16;
      flex-wrap: wrap;

      @include responsive(phone) {
        flex-direction: column;
        align-items: stretch;
      }

      .sort-controls {
        display: flex;
        align-items: center;
        gap: $size-10;

        .sort-label {
          font-size: $size-13;
          color: $color-g-54;
          white-space: nowrap;
        }

        .sort-buttons {
          display: flex;
          background: $color-g-95;
          border-radius: $size-8;
          padding: $size-4;

          .sort-btn {
            padding: $size-8 $size-12;
            border: none;
            background: transparent;
            font-size: $size-12;
            font-weight: 500;
            color: $color-g-54;
            cursor: pointer;
            border-radius: $size-6;
            transition: all 0.2s;
            white-space: nowrap;

            &:hover {
              color: $color-g-21;
            }

            &.active {
              background: $color-white;
              color: $color-pri;
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            }
          }
        }
      }

      .view-toggle {
        display: flex;
        background: $color-g-95;
        border-radius: $size-8;
        padding: $size-4;

        .view-btn {
          width: $size-36;
          height: $size-36;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          background: transparent;
          border-radius: $size-6;
          cursor: pointer;
          transition: all 0.2s;

          svg {
            width: $size-18;
            height: $size-18;
            color: $color-g-54;
          }

          &:hover svg {
            color: $color-g-21;
          }

          &.active {
            background: $color-white;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

            svg {
              color: $color-pri;
            }
          }
        }
      }
    }

    .price-filter {
      display: flex;
      align-items: center;
      gap: $size-12;
      margin-top: $size-16;
      padding: $size-12;
      background: $color-g-97;
      border-radius: $size-8;

      label {
        font-size: $size-13;
        color: $color-g-44;
        white-space: nowrap;
      }

      .price-inputs {
        display: flex;
        align-items: center;
        gap: $size-8;
        flex: 1;

        .price-input-group {
          display: flex;
          align-items: center;
          background: $color-white;
          border: 1px solid $color-g-85;
          border-radius: $size-6;
          overflow: hidden;

          .currency {
            padding: $size-8;
            background: $color-g-95;
            font-size: $size-12;
            color: $color-g-54;
          }

          input {
            width: 80px;
            padding: $size-8;
            border: none;
            font-size: $size-13;

            &:focus {
              outline: none;
            }
          }
        }

        .price-separator {
          color: $color-g-67;
        }

        .price-apply-btn {
          padding: $size-8 $size-16;
          background: $color-pri;
          color: white;
          border: none;
          border-radius: $size-6;
          font-size: $size-13;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;

          &:hover {
            background: darken($color-pri, 10%);
          }
        }
      }
    }
  }

  // Results Info
  .results-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $size-16;
    padding-bottom: $size-12;
    border-bottom: 1px solid $color-g-92;

    .results-count {
      font-size: $size-14;
      color: $color-g-44;
    }

    .clear-filters-btn {
      display: flex;
      align-items: center;
      gap: $size-6;
      padding: $size-6 $size-12;
      background: transparent;
      border: 1px solid $color-denote-red;
      color: $color-denote-red;
      border-radius: $size-6;
      font-size: $size-12;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;

      svg {
        width: $size-14;
        height: $size-14;
      }

      &:hover {
        background: $color-denote-red;
        color: white;
      }
    }
  }

  // Drugs Grid
  .drugs-grid {
    display: grid;
    gap: $size-16;

    &.grid {
      grid-template-columns: repeat(4, 1fr);

      @include responsive(tab-landscape) {
        grid-template-columns: repeat(3, 1fr);
      }

      @include responsive(tab-portrait) {
        grid-template-columns: repeat(2, 1fr);
      }

      @include responsive(phone) {
        grid-template-columns: repeat(2, 1fr);
        gap: $size-12;
      }
    }

    &.list {
      grid-template-columns: 1fr;
      gap: $size-12;
    }
  }

  // Skeleton Loading
  .drug-skeleton {
    background: $color-white;
    border-radius: $size-12;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);

    .skeleton-image {
      height: 180px;
      background: linear-gradient(90deg, $color-g-95 25%, $color-g-90 50%, $color-g-95 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }

    .skeleton-content {
      padding: $size-12;

      .skeleton-line {
        height: $size-12;
        background: linear-gradient(90deg, $color-g-95 25%, $color-g-90 50%, $color-g-95 75%);
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
        border-radius: $size-4;
        margin-bottom: $size-8;

        &.title {
          width: 80%;
          height: $size-14;
        }

        &.subtitle {
          width: 60%;
        }

        &.details {
          width: 50%;
        }
      }
    }

    .skeleton-footer {
      display: flex;
      justify-content: space-between;
      padding: $size-8 $size-12;

      .skeleton-line {
        height: $size-16;
        background: linear-gradient(90deg, $color-g-95 25%, $color-g-90 50%, $color-g-95 75%);
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
        border-radius: $size-4;

        &.price {
          width: 60px;
        }

        &.stock {
          width: 50px;
        }
      }
    }

    .skeleton-button {
      margin: $size-8 $size-12 $size-12;
      height: $size-40;
      background: linear-gradient(90deg, $color-g-95 25%, $color-g-90 50%, $color-g-95 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: $size-8;
    }
  }

  @keyframes shimmer {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }

  // Empty State
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: $size-48 $size-24;
    text-align: center;
    background: $color-g-97;
    border-radius: $size-16;

    .empty-icon {
      width: $size-80;
      height: $size-80;
      background: $color-g-92;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: $size-20;

      svg {
        width: $size-40;
        height: $size-40;
        color: $color-g-67;
      }
    }

    h3 {
      font-size: $size-20;
      font-weight: 600;
      color: $color-g-21;
      margin-bottom: $size-8;
    }

    p {
      color: $color-g-54;
      margin-bottom: $size-24;
      max-width: 400px;
      line-height: 1.5;
    }

    .empty-actions {
      display: flex;
      gap: $size-12;
      flex-wrap: wrap;
      justify-content: center;
    }
  }

  // Load More
  .load-more {
    display: flex;
    justify-content: center;
    margin-top: $size-32;
  }
}

// Floating Cart
.floating-cart {
  position: fixed;
  bottom: $size-24;
  right: $size-24;
  width: $size-60;
  height: $size-60;
  background: $color-pri;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba($color-pri, 0.4);
  z-index: 100;
  transition: all 0.3s;

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 24px rgba($color-pri, 0.5);
  }

  svg {
    width: $size-26;
    height: $size-26;
    color: white;
  }

  .cart-badge {
    position: absolute;
    top: -$size-4;
    right: -$size-4;
    min-width: $size-24;
    height: $size-24;
    padding: 0 $size-6;
    background: $color-denote-red;
    color: white;
    border-radius: $size-12;
    font-size: $size-12;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid white;
  }

  @include responsive(phone) {
    bottom: $size-16;
    right: $size-16;
    width: $size-48;
    height: $size-48;

    svg {
      width: $size-20;
      height: $size-20;
    }
  }
}
</style>
