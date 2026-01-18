<template>
  <div class="page-content pharmacy-ecommerce">
    <top-bar
      type="title-only"
      title="Pharmacy"
      @open-side-nav="$emit('openSideNav')"
    />

    <div class="page-content__body">
      <!-- Hero Section with Search -->
      <div class="hero-section">
        <div class="hero-content">
          <h1>Your Health, Delivered</h1>
          <p>Browse thousands of medications and healthcare products</p>
          <div class="hero-search">
            <RCIcon icon="search" class="search-icon" />
            <input
              type="text"
              v-model="searchQuery"
              placeholder="Search medications, vitamins, health products..."
              @keyup.enter="handleSearch"
              @input="handleSearchInput"
            />
            <button v-if="searchQuery" class="clear-btn" @click="clearSearch">
              <RCIcon icon="close" />
            </button>
            <button class="search-btn" @click="handleSearch">
              Search
            </button>
          </div>
          <!-- Search Suggestions -->
          <div class="search-suggestions" v-if="showSuggestions && searchSuggestions.length > 0">
            <div
              v-for="(suggestion, index) in searchSuggestions"
              :key="suggestion.batch_id || suggestion._id + '-' + index"
              class="suggestion-item"
              @click="selectSuggestion(suggestion)"
            >
              <RCIcon icon="pill" class="suggestion-icon" />
              <div class="suggestion-info">
                <span class="suggestion-name">{{ suggestion.name }}</span>
                <span class="suggestion-details">
                  {{ suggestion.strength }}{{ suggestion.dosage_form ? ' | ' + suggestion.dosage_form : '' }}{{ suggestion.manufacturer ? ' | ' + suggestion.manufacturer : '' }}
                </span>
              </div>
              <span class="suggestion-price">NGN {{ formatCurrency(suggestion.selling_price) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Category Pills (Horizontal Scroll) -->
      <div class="category-pills-section">
        <div class="category-pills-wrapper">
          <button
            :class="['category-pill', { active: selectedCategory === null }]"
            @click="selectCategory(null)"
          >
            All Products
          </button>
          <button
            v-for="category in categories"
            :key="category.id"
            class="category-pill"
            @click="goToCategory(category.slug)"
          >
            {{ category.name }}
          </button>
        </div>
      </div>

      <!-- Filters Bar -->
      <div class="filters-bar">
        <div class="filters-left">
          <span class="results-count" v-if="!loading">
            {{ totalProducts }} products{{ selectedCategory ? ` in ${formatCategoryName(selectedCategory)}` : '' }}
          </span>
        </div>
        <div class="filters-right">
          <button class="categories-btn" @click="goToAllCategories">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
            </svg>
            <span>Categories</span>
          </button>
          <div class="filter-group">
            <label>Sort by:</label>
            <select v-model="sortBy" @change="applyFilters">
              <option value="name_asc">Name: A-Z</option>
              <option value="name_desc">Name: Z-A</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="newest">Newest First</option>
            </select>
          </div>
          <button class="filter-btn" @click="showFiltersModal = true">
            <RCIcon icon="filter" />
            <span>Filters</span>
            <span v-if="activeFiltersCount > 0" class="filter-badge">{{ activeFiltersCount }}</span>
          </button>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="main-content">
        <!-- Products Grid -->
        <div class="products-section">
          <div v-if="loading" class="products-skeleton">
            <div v-for="i in 8" :key="i" class="skeleton-card">
              <div class="skeleton-image"></div>
              <div class="skeleton-content">
                <div class="skeleton-line"></div>
                <div class="skeleton-line short"></div>
                <div class="skeleton-line"></div>
              </div>
            </div>
          </div>

          <div v-else-if="products.length > 0" class="products-grid">
            <DrugCard
              v-for="drug in products"
              :key="drug._id"
              :drug="drug"
              @add-to-cart="addToCart"
              @view-details="viewDrugDetails"
            />
          </div>

          <div v-else class="no-products">
            <RCIcon icon="pill" class="no-products-icon" />
            <h3>No products found</h3>
            <p>Try adjusting your filters or search terms</p>
            <rc-button
              type="secondary"
              label="Clear Filters"
              @click="clearAllFilters"
            />
          </div>

          <!-- Load More / Pagination -->
          <div class="pagination-section" v-if="products.length > 0 && hasMoreProducts">
            <rc-button
              type="secondary"
              :label="loadingMore ? 'Loading...' : 'Load More Products'"
              :disabled="loadingMore"
              @click="loadMoreProducts"
            />
          </div>
        </div>
      </div>

      <!-- Quick Stats Banner -->
      <div class="stats-banner" v-if="!loading && products.length > 0">
        <div class="stat-item">
          <RCIcon icon="truck" />
          <div class="stat-text">
            <strong>Free Delivery</strong>
            <span>Orders over NGN 10,000</span>
          </div>
        </div>
        <div class="stat-item">
          <RCIcon icon="shield-check" />
          <div class="stat-text">
            <strong>Genuine Products</strong>
            <span>100% Authentic</span>
          </div>
        </div>
        <div class="stat-item">
          <RCIcon icon="icons-time" />
          <div class="stat-text">
            <strong>Fast Delivery</strong>
            <span>Same day in Lagos</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Floating Cart Button -->
    <button class="fab fab-primary" @click="goToCart" v-if="cartItemCount > 0" title="View Cart">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
        <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
      </svg>
      <span class="cart-badge">{{ cartItemCount }}</span>
    </button>

    <!-- Filters Modal -->
    <transition name="modal">
      <div v-if="showFiltersModal" class="modal-overlay" @click="showFiltersModal = false">
        <div class="modal-content filters-modal" @click.stop>
          <div class="modal-header">
            <h3>Filter Products</h3>
            <button class="close-btn" @click="showFiltersModal = false">
              <RCIcon icon="close" />
            </button>
          </div>
          <div class="modal-body">
            <!-- Price Range -->
            <div class="filter-section">
              <h4>Price Range</h4>
              <div class="price-inputs">
                <div class="price-input">
                  <label>Min</label>
                  <input type="number" v-model.number="filters.minPrice" placeholder="0" />
                </div>
                <span class="price-separator">-</span>
                <div class="price-input">
                  <label>Max</label>
                  <input type="number" v-model.number="filters.maxPrice" placeholder="Any" />
                </div>
              </div>
            </div>

            <!-- Availability -->
            <div class="filter-section">
              <h4>Availability</h4>
              <label class="checkbox-label">
                <input type="checkbox" v-model="filters.inStockOnly" />
                <span>In Stock Only</span>
              </label>
            </div>

            <!-- Prescription Type -->
            <div class="filter-section">
              <h4>Product Type</h4>
              <div class="radio-group">
                <label class="radio-label">
                  <input type="radio" v-model="filters.prescriptionType" value="all" />
                  <span>All Products</span>
                </label>
                <label class="radio-label">
                  <input type="radio" v-model="filters.prescriptionType" value="otc" />
                  <span>Over-the-Counter (OTC)</span>
                </label>
                <label class="radio-label">
                  <input type="radio" v-model="filters.prescriptionType" value="rx" />
                  <span>Prescription Only</span>
                </label>
              </div>
            </div>

            <!-- Dosage Form -->
            <div class="filter-section">
              <h4>Dosage Form</h4>
              <div class="checkbox-group">
                <label v-for="form in dosageForms" :key="form" class="checkbox-label">
                  <input type="checkbox" :value="form" v-model="filters.dosageForms" />
                  <span>{{ form }}</span>
                </label>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <rc-button
              type="secondary"
              label="Clear All"
              @click="clearAllFilters"
            />
            <rc-button
              type="primary"
              label="Apply Filters"
              @click="applyFiltersAndClose"
            />
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useStore } from "vuex";
import TopBar from "@/components/Navigation/top-bar";
import RcButton from "@/components/buttons/button-primary";
import RCIcon from "@/components/RCIcon/RCIcon.vue";
import DrugCard from "./components/DrugCard.vue";
import axios from "@/services/http";

export default {
  name: "PharmacyIndex",
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
    const store = useStore();

    // State
    const searchQuery = ref("");
    const showSuggestions = ref(false);
    const searchSuggestions = ref([]);
    const selectedCategory = ref(null);
    const sortBy = ref("name_asc");
    const loading = ref(false);
    const loadingMore = ref(false);
    const products = ref([]);
    const totalProducts = ref(0);
    const currentPage = ref(1);
    const hasMoreProducts = ref(false);
    const categories = ref([]);
    const showFiltersModal = ref(false);

    // Filters
    const filters = ref({
      minPrice: null,
      maxPrice: null,
      inStockOnly: false,
      prescriptionType: "all",
      dosageForms: [],
    });

    const dosageForms = ref([
      "Tablet",
      "Capsule",
      "Syrup",
      "Injection",
      "Cream",
      "Ointment",
      "Drops",
      "Inhaler",
    ]);

    // Vuex actions & getters using store directly
    const addToCartAction = (payload) => store.dispatch("pharmacy/addToCart", payload);
    const loadCartFromStorage = () => store.dispatch("pharmacy/loadCartFromStorage");
    const cartItemCount = computed(() => store.getters["pharmacy/getCartItemCount"] || 0);

    // Category icon mapping
    const categoryIcons = {
      PAIN_RELIEF: "pill",
      COLD_AND_FLU: "thermometer",
      VITAMINS_SUPPLEMENTS: "vitamin",
      FIRST_AID: "bandage",
      DIGESTIVE_HEALTH: "stomach",
      SKIN_CARE: "skincare",
      ALLERGIES: "pill",
      EYE_CARE: "eye",
      RESPIRATORY: "lungs",
      CARDIOVASCULAR: "heart-beat",
      DIABETES: "pill",
      ANTIBIOTICS: "pill",
      MENTAL_HEALTH: "brain",
      WOMENS_HEALTH: "pill",
      MENS_HEALTH: "pill",
      CHILDREN_HEALTH: "pill",
      OTHER: "pill",
    };

    // Computed
    const activeFiltersCount = computed(() => {
      let count = 0;
      if (filters.value.minPrice) count++;
      if (filters.value.maxPrice) count++;
      if (filters.value.inStockOnly) count++;
      if (filters.value.prescriptionType !== "all") count++;
      if (filters.value.dosageForms.length > 0) count++;
      return count;
    });

    // Methods
    const formatCurrency = (amount) => {
      if (!amount) return "0.00";
      return Number(amount).toLocaleString("en-NG", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    };

    const formatCategoryName = (slug) => {
      if (!slug) return "";
      return slug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
    };

    const fetchCategories = async () => {
      try {
        const response = await axios.get("/pharmacy/drugs/categories");
        const data = response.data?.result || response.data?.data;
        if (data && data.length > 0) {
          categories.value = data.map((cat) => ({
            id: cat._id,
            name: cat.name,
            slug: cat.slug || cat.code?.toLowerCase().replace(/_/g, "-"),
            icon: categoryIcons[cat.code] || "pill",
          }));
        } else {
          setDefaultCategories();
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        setDefaultCategories();
      }
    };

    const setDefaultCategories = () => {
      categories.value = [
        { id: "PAIN_RELIEF", name: "Pain Relief", slug: "pain-relief", icon: "pill" },
        { id: "COLD_AND_FLU", name: "Cold & Flu", slug: "cold-and-flu", icon: "thermometer" },
        { id: "VITAMINS_SUPPLEMENTS", name: "Vitamins", slug: "vitamins-supplements", icon: "vitamin" },
        { id: "FIRST_AID", name: "First Aid", slug: "first-aid", icon: "bandage" },
        { id: "DIGESTIVE_HEALTH", name: "Digestive", slug: "digestive-health", icon: "stomach" },
        { id: "SKIN_CARE", name: "Skin Care", slug: "skin-care", icon: "skincare" },
        { id: "ALLERGIES", name: "Allergies", slug: "allergies", icon: "pill" },
        { id: "EYE_CARE", name: "Eye Care", slug: "eye-care", icon: "eye" },
      ];
    };

    const fetchProducts = async (reset = true) => {
      if (reset) {
        loading.value = true;
        currentPage.value = 1;
        products.value = [];
      } else {
        loadingMore.value = true;
      }

      try {
        const params = {
          page: currentPage.value,
          limit: 12,
        };

        // Add search (public endpoint uses 'query' parameter)
        if (searchQuery.value) {
          params.query = searchQuery.value;
        }

        // Add category filter
        if (selectedCategory.value) {
          params.category = selectedCategory.value;
        }

        // Add sort (use snake_case for specialist API)
        switch (sortBy.value) {
          case "price_low":
            params.sort_by = "selling_price";
            params.sort_order = "asc";
            break;
          case "price_high":
            params.sort_by = "selling_price";
            params.sort_order = "desc";
            break;
          case "name_asc":
            params.sort_by = "name";
            params.sort_order = "asc";
            break;
          case "name_desc":
            params.sort_by = "name";
            params.sort_order = "desc";
            break;
          case "newest":
            params.sort_by = "created_at";
            params.sort_order = "desc";
            break;
          default:
            params.sort_by = "name";
            params.sort_order = "asc";
            break;
        }

        // Add filters
        if (filters.value.minPrice) {
          params.min_price = filters.value.minPrice;
        }
        if (filters.value.maxPrice) {
          params.max_price = filters.value.maxPrice;
        }
        if (filters.value.inStockOnly) {
          params.is_available = true;
        }
        if (filters.value.prescriptionType === "otc") {
          params.is_otc = true;
        } else if (filters.value.prescriptionType === "rx") {
          params.requires_prescription = true;
        }
        // Note: dosage form filter would require backend support

        // Use public pharmacy search API which properly resolves dosage forms
        const response = await axios.get("/pharmacy/drugs/search", { params });
        const data = response.data?.result || response.data?.data;

        if (data) {
          const newProducts = data.drugs || data.items || data;
          if (reset) {
            products.value = Array.isArray(newProducts) ? newProducts : [];
          } else {
            products.value = [...products.value, ...(Array.isArray(newProducts) ? newProducts : [])];
          }
          totalProducts.value = data.total || data.totalCount || products.value.length;
          hasMoreProducts.value = products.value.length < totalProducts.value;
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        loading.value = false;
        loadingMore.value = false;
      }
    };

    const loadMoreProducts = async () => {
      currentPage.value++;
      await fetchProducts(false);
    };

    // Debounce timer for search
    let searchDebounceTimer = null;

    const handleSearchInput = () => {
      // Clear previous timer
      if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer);
      }

      if (searchQuery.value.length >= 2) {
        // Debounce: wait 300ms after user stops typing
        searchDebounceTimer = setTimeout(async () => {
          try {
            const response = await axios.get("/pharmacy/drugs/search", {
              params: { query: searchQuery.value, limit: 8 },
            });
            const data = response.data?.data;
            searchSuggestions.value = data?.drugs || [];
            showSuggestions.value = searchSuggestions.value.length > 0;
          } catch (error) {
            console.error("Error searching:", error);
            searchSuggestions.value = [];
            showSuggestions.value = false;
          }
        }, 300);
      } else {
        showSuggestions.value = false;
        searchSuggestions.value = [];
      }
    };

    const handleSearch = () => {
      showSuggestions.value = false;
      if (searchQuery.value.length >= 2) {
        fetchProducts();
      }
    };

    const clearSearch = () => {
      searchQuery.value = "";
      showSuggestions.value = false;
      searchSuggestions.value = [];
      fetchProducts();
    };

    const selectSuggestion = (drug) => {
      showSuggestions.value = false;
      searchQuery.value = drug.name;
      const path = `/app/patient/pharmacy/drug/${drug._id}`;
      if (drug.batch_id) {
        router.push({ path, query: { batch: drug.batch_id } });
      } else {
        router.push(path);
      }
    };

    const selectCategory = (slug) => {
      selectedCategory.value = slug;
      fetchProducts();
    };

    const goToCategory = (slug) => {
      router.push(`/app/patient/pharmacy/category/${slug}`);
    };

    const goToAllCategories = () => {
      router.push("/app/patient/pharmacy/categories");
    };

    const applyFilters = () => {
      fetchProducts();
    };

    const applyFiltersAndClose = () => {
      showFiltersModal.value = false;
      fetchProducts();
    };

    const clearAllFilters = () => {
      filters.value = {
        minPrice: null,
        maxPrice: null,
        inStockOnly: false,
        prescriptionType: "all",
        dosageForms: [],
      };
      selectedCategory.value = null;
      searchQuery.value = "";
      sortBy.value = "name_asc";
      showFiltersModal.value = false;
      fetchProducts();
    };

    const addToCart = (drug) => {
      addToCartAction({
        drugId: drug._id,
        batchId: drug.batch_id || null,
        batchNumber: drug.batch_number || null,
        name: drug.name,
        strength: drug.strength,
        dosageForm: drug.dosage_form,
        route: drug.route,
        routeAbbreviation: drug.route_abbreviation,
        manufacturer: drug.manufacturer,
        price: drug.selling_price,
        quantity: 1,
        imageUrl: drug.image_url,
        pharmacyId: null,
      });
    };

    const viewDrugDetails = (drugId, batchId) => {
      const path = `/app/patient/pharmacy/drug/${drugId}`;
      if (batchId) {
        router.push({ path, query: { batch: batchId } });
      } else {
        router.push(path);
      }
    };

    const goToCart = () => {
      router.push("/app/patient/pharmacy/cart");
    };

    // Watch for clicks outside search suggestions
    const handleClickOutside = (event) => {
      const heroSearch = document.querySelector(".hero-search");
      const suggestions = document.querySelector(".search-suggestions");
      if (heroSearch && suggestions) {
        if (!heroSearch.contains(event.target) && !suggestions.contains(event.target)) {
          showSuggestions.value = false;
        }
      }
    };

    onMounted(async () => {
      loadCartFromStorage();
      document.addEventListener("click", handleClickOutside);

      // Check for category in route
      if (route.query.category) {
        selectedCategory.value = route.query.category;
      }

      await Promise.all([fetchCategories(), fetchProducts()]);
    });

    return {
      searchQuery,
      showSuggestions,
      searchSuggestions,
      selectedCategory,
      sortBy,
      loading,
      loadingMore,
      products,
      totalProducts,
      hasMoreProducts,
      categories,
      showFiltersModal,
      filters,
      dosageForms,
      cartItemCount,
      activeFiltersCount,
      formatCurrency,
      formatCategoryName,
      handleSearchInput,
      handleSearch,
      clearSearch,
      selectSuggestion,
      selectCategory,
      goToCategory,
      goToAllCategories,
      applyFilters,
      applyFiltersAndClose,
      clearAllFilters,
      loadMoreProducts,
      addToCart,
      viewDrugDetails,
      goToCart,
    };
  },
};
</script>

<style scoped lang="scss">
.pharmacy-ecommerce {
  background: #f8fafc;
  min-height: 100vh;
}

:deep(.page-content__body) {
  padding: 0 !important;
  overflow-y: auto !important;
  overflow-x: hidden !important;
  height: auto !important;
  max-height: none !important;

  // Constrain width to 80% and center
  max-width: 80%;
  margin: 0 auto;

  @media (max-width: 1024px) {
    max-width: 95%; // More width on tablets
  }

  @media (max-width: 768px) {
    max-width: 100%; // Full width on mobile
  }
}

// Hero Section
.hero-section {
  background: linear-gradient(135deg, $color-pri 0%, darken($color-pri, 15%) 100%);
  padding: $size-32 $size-20 $size-48;
  position: relative;
  border-radius: 0 0 $size-24 $size-24;
}

.hero-content {
  text-align: center;
  position: relative;

  h1 {
    color: white;
    font-size: $size-28;
    font-weight: 700;
    margin-bottom: $size-8;
  }

  p {
    color: rgba(white, 0.85);
    font-size: $size-14;
    margin-bottom: $size-24;
  }
}

.hero-search {
  display: flex;
  align-items: center;
  background: white;
  border-radius: $size-12;
  padding: $size-8 $size-8 $size-8 $size-16;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  position: relative;

  .search-icon {
    color: $color-g-54;
    flex-shrink: 0;
    width: $size-20;
    height: $size-20;
  }

  input {
    flex: 1;
    border: none;
    outline: none;
    font-size: $size-15;
    padding: $size-8 $size-12;
    min-width: 0;

    &::placeholder {
      color: $color-g-67;
    }
  }

  .clear-btn {
    background: transparent;
    border: none;
    padding: $size-8;
    cursor: pointer;
    color: $color-g-54;

    svg {
      width: $size-16;
      height: $size-16;
    }
  }

  .search-btn {
    background: $color-pri;
    color: white;
    border: none;
    padding: $size-10 $size-20;
    border-radius: $size-8;
    font-weight: 600;
    font-size: $size-14;
    cursor: pointer;
    transition: background 0.2s;

    &:hover {
      background: darken($color-pri, 10%);
    }
  }
}

.search-suggestions {
  position: absolute;
  top: calc(100% + $size-8);
  left: 0;
  right: 0;
  background: white;
  border-radius: $size-12;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  z-index: 100;

  .suggestion-item {
    display: flex;
    align-items: center;
    padding: $size-12 $size-16;
    cursor: pointer;
    transition: background 0.15s;

    &:hover {
      background: $color-g-97;
    }

    .suggestion-icon {
      color: $color-pri;
      width: $size-20;
      height: $size-20;
      margin-right: $size-12;
    }

    .suggestion-info {
      flex: 1;
      min-width: 0;

      .suggestion-name {
        display: block;
        font-weight: 500;
        color: $color-g-21;
        font-size: $size-14;
      }

      .suggestion-details {
        font-size: $size-12;
        color: $color-g-54;
      }
    }

    .suggestion-price {
      font-weight: 600;
      color: $color-pri;
      font-size: $size-13;
    }
  }
}

// Category Pills
.category-pills-section {
  padding: $size-24 $size-16 $size-16;
  background: #f8fafc;
}

.category-pills-wrapper {
  display: flex;
  gap: $size-8;
  overflow-x: auto;
  padding-bottom: $size-8;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.category-pill {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $size-6;
  padding: $size-10 $size-20;
  background: white;
  border: 1px solid $color-g-90;
  border-radius: $size-20;
  font-size: $size-13;
  font-weight: 500;
  color: $color-g-44;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;

  &:hover {
    border-color: $color-pri;
    color: $color-pri;
  }

  &.active {
    background: $color-pri;
    border-color: $color-pri;
    color: white;

    .pill-icon {
      color: white;
    }
  }

  &.view-all {
    background: $color-pri;
    border-color: $color-pri;
    color: white;

    svg {
      width: $size-14;
      height: $size-14;
    }

    &:hover {
      background: darken($color-pri, 10%);
      border-color: darken($color-pri, 10%);
      color: white;
    }
  }

  .pill-icon {
    width: $size-16;
    height: $size-16;
    color: $color-g-54;
  }
}

// Filters Bar
.filters-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $size-12 $size-16;
  background: white;
  border-bottom: 1px solid $color-g-92;
  position: sticky;
  top: 0;
  z-index: 50;
}

.filters-left {
  .results-count {
    font-size: $size-13;
    color: $color-g-54;
  }
}

.filters-right {
  display: flex;
  align-items: center;
  gap: $size-12;
}

.categories-btn {
  display: flex;
  align-items: center;
  gap: $size-6;
  padding: $size-8 $size-12;
  background: $color-pri;
  color: white;
  border: none;
  border-radius: $size-8;
  font-size: $size-13;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  svg {
    width: $size-14;
    height: $size-14;
  }

  &:hover {
    background: darken($color-pri, 10%);
  }
}

.filter-group {
  display: flex;
  align-items: center;
  gap: $size-8;

  label {
    font-size: $size-13;
    color: $color-g-54;
  }

  select {
    padding: $size-8 $size-12;
    border: 1px solid $color-g-90;
    border-radius: $size-8;
    font-size: $size-13;
    color: $color-g-21;
    background: white;
    cursor: pointer;

    &:focus {
      outline: none;
      border-color: $color-pri;
    }
  }
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: $size-6;
  padding: $size-8 $size-12;
  background: white;
  border: 1px solid $color-g-90;
  border-radius: $size-8;
  font-size: $size-13;
  font-weight: 500;
  color: $color-g-44;
  cursor: pointer;
  position: relative;

  svg {
    width: $size-16;
    height: $size-16;
  }

  .filter-badge {
    position: absolute;
    top: -$size-6;
    right: -$size-6;
    background: $color-pri;
    color: white;
    font-size: $size-10;
    font-weight: 600;
    min-width: $size-18;
    height: $size-18;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

// Products Section
.main-content {
  padding: $size-16;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $size-16;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: $size-12;
  }
}

.products-skeleton {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $size-16;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.skeleton-card {
  background: white;
  border-radius: $size-12;
  overflow: hidden;

  .skeleton-image {
    height: 140px;
    background: linear-gradient(90deg, $color-g-95 25%, $color-g-92 50%, $color-g-95 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }

  .skeleton-content {
    padding: $size-12;
  }

  .skeleton-line {
    height: $size-12;
    background: linear-gradient(90deg, $color-g-95 25%, $color-g-92 50%, $color-g-95 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: $size-4;
    margin-bottom: $size-8;

    &.short {
      width: 60%;
    }
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

.no-products {
  text-align: center;
  padding: $size-48;

  .no-products-icon {
    width: $size-64;
    height: $size-64;
    color: $color-g-77;
    margin-bottom: $size-16;
  }

  h3 {
    font-size: $size-18;
    color: $color-g-44;
    margin-bottom: $size-8;
  }

  p {
    font-size: $size-14;
    color: $color-g-67;
    margin-bottom: $size-24;
  }
}

.pagination-section {
  display: flex;
  justify-content: center;
  margin-top: $size-32;
}

// Stats Banner
.stats-banner {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $size-16;
  padding: $size-24 $size-16;
  background: white;
  margin-top: $size-24;
  border-top: 1px solid $color-g-92;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: $size-12;
  }
}

.stat-item {
  display: flex;
  align-items: center;
  gap: $size-12;
  padding: $size-16;
  background: $color-g-97;
  border-radius: $size-12;

  svg {
    width: $size-32;
    height: $size-32;
    color: $color-pri;
  }

  .stat-text {
    strong {
      display: block;
      font-size: $size-14;
      color: $color-g-21;
    }

    span {
      font-size: $size-12;
      color: $color-g-54;
    }
  }
}

// Floating Cart Button
.fab {
  position: fixed;
  bottom: $size-24;
  right: $size-24;
  z-index: 100;
  width: $size-56;
  height: $size-56;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  transition: all 0.2s;
  position: relative;

  &:hover {
    transform: scale(1.05);
  }

  svg {
    width: $size-24;
    height: $size-24;
  }

  &.fab-primary {
    background: $color-pri;
    color: white;
  }

  .cart-badge {
    position: absolute;
    top: -$size-4;
    right: -$size-4;
    background: $color-denote-red;
    color: white;
    font-size: $size-12;
    font-weight: 600;
    min-width: $size-22;
    height: $size-22;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

// Modal
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $size-16;
}

.modal-content {
  background: white;
  border-radius: $size-16;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  animation: fadeInUp 0.3s ease;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $size-20;
  border-bottom: 1px solid $color-g-92;

  h3 {
    font-size: $size-18;
    font-weight: 600;
    margin: 0;
  }

  .close-btn {
    background: transparent;
    border: none;
    padding: $size-8;
    cursor: pointer;
    color: $color-g-54;

    svg {
      width: $size-20;
      height: $size-20;
    }
  }
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: $size-20;
}

.modal-footer {
  display: flex;
  gap: $size-12;
  padding: $size-16 $size-20;
  border-top: 1px solid $color-g-92;

  > * {
    flex: 1;
  }
}

.filter-section {
  margin-bottom: $size-24;

  h4 {
    font-size: $size-14;
    font-weight: 600;
    color: $color-g-21;
    margin-bottom: $size-12;
  }
}

.price-inputs {
  display: flex;
  align-items: center;
  gap: $size-12;
}

.price-input {
  flex: 1;

  label {
    display: block;
    font-size: $size-12;
    color: $color-g-54;
    margin-bottom: $size-4;
  }

  input {
    width: 100%;
    padding: $size-10 $size-12;
    border: 1px solid $color-g-90;
    border-radius: $size-8;
    font-size: $size-14;

    &:focus {
      outline: none;
      border-color: $color-pri;
    }
  }
}

.price-separator {
  color: $color-g-54;
  padding-top: $size-20;
}

.checkbox-label,
.radio-label {
  display: flex;
  align-items: center;
  gap: $size-8;
  cursor: pointer;
  padding: $size-8 0;

  input {
    width: $size-18;
    height: $size-18;
    accent-color: $color-pri;
  }

  span {
    font-size: $size-14;
    color: $color-g-44;
  }
}

.radio-group,
.checkbox-group {
  display: flex;
  flex-direction: column;
}

// Transitions
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;

  .modal-content {
    transition: transform 0.3s ease;
  }
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;

  .modal-content {
    transform: translateY(20px);
  }
}
</style>
