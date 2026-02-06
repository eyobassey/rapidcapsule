<template>
  <div class="pharmacy-page">
    <!-- Mobile Header -->
    <header class="mobile-header">
      <button class="menu-btn" @click="$emit('openSideNav')">
        <v-icon name="hi-menu-alt-2" scale="1.2" />
      </button>
      <div class="header-logo">
        <img src="/RapidCapsule_Logo.png" alt="Rapid Capsule" />
      </div>
      <button class="cart-btn" @click="goToCart">
        <v-icon name="hi-shopping-cart" scale="1.1" />
        <span v-if="cartItemCount > 0" class="cart-count">{{ cartItemCount }}</span>
      </button>
    </header>

    <!-- Page Content -->
    <div class="page-content">
      <!-- Loading State -->
      <div v-if="initialLoading" class="loading-state">
        <div class="loading-spinner">
          <div class="spinner-ring"></div>
          <v-icon name="hi-shopping-bag" scale="1.2" class="spinner-icon" />
        </div>
        <p>Loading pharmacy...</p>
      </div>

      <template v-else>
        <!-- Hero Section -->
        <section class="hero">
          <div class="hero__content">
            <button class="back-link desktop-only" @click="$router.push('/app/patient/dashboard')">
              <v-icon name="hi-arrow-left" scale="0.85" />
              <span>Dashboard</span>
            </button>
            <div class="hero__badge">
              <div class="badge-pulse"></div>
              <v-icon name="hi-shopping-bag" />
              <span>Online Pharmacy</span>
            </div>
            <h1 class="hero__title">
              Your Health,<br/>
              <span class="hero__title-accent">Delivered</span>
            </h1>
            <p class="hero__subtitle">
              Browse thousands of genuine medications and healthcare products with fast delivery.
            </p>
            <div class="hero__stats">
              <div class="hero-stat">
                <span class="hero-stat__value">{{ totalProducts || '1000+' }}</span>
                <span class="hero-stat__label">Products</span>
              </div>
              <div class="hero-stat__divider"></div>
              <div class="hero-stat">
                <span class="hero-stat__value hero-stat__value--success">{{ categories.length || '8' }}</span>
                <span class="hero-stat__label">Categories</span>
              </div>
              <div class="hero-stat__divider"></div>
              <div class="hero-stat">
                <span class="hero-stat__value hero-stat__value--info">24h</span>
                <span class="hero-stat__label">Delivery</span>
              </div>
            </div>
          </div>
          <div class="hero__visual">
            <div class="pharmacy-orb">
              <div class="orb-ring orb-ring--1"></div>
              <div class="orb-ring orb-ring--2"></div>
              <div class="orb-ring orb-ring--3"></div>
              <div class="orb-core">
                <v-icon name="hi-shopping-bag" />
              </div>
            </div>
            <div class="floating-icons">
              <div class="float-icon float-icon--1"><v-icon name="ri-capsule-line" /></div>
              <div class="float-icon float-icon--2"><v-icon name="hi-shield-check" /></div>
              <div class="float-icon float-icon--3"><v-icon name="bi-truck" /></div>
            </div>
          </div>
        </section>

        <!-- Bento Grid -->
        <section class="bento-grid">
          <!-- Search Card -->
          <div class="bento-card search-card">
            <div class="card-header">
              <h3>Search Products</h3>
              <span class="results-count" v-if="searchQuery && !loading">{{ totalProducts }} results</span>
            </div>
            <div class="search-wrapper">
              <div class="search-bar">
                <v-icon name="hi-search" scale="0.9" class="search-icon" />
                <input
                  type="text"
                  v-model="searchQuery"
                  placeholder="Search medications, vitamins, health products..."
                  @keyup.enter="handleSearch"
                  @input="handleSearchInput"
                  @focus="onSearchFocus"
                />
                <button v-if="searchQuery" class="clear-btn" @click="clearSearch">
                  <v-icon name="hi-x" scale="0.8" />
                </button>
                <button class="search-submit" @click="handleSearch">
                  <v-icon name="hi-arrow-right" scale="0.9" />
                </button>
              </div>
              <!-- Search Suggestions Dropdown -->
              <transition name="dropdown">
                <div class="search-suggestions" v-if="showSuggestions && searchSuggestions.length > 0">
                  <div
                    v-for="(suggestion, index) in searchSuggestions"
                    :key="suggestion.batch_id || suggestion._id + '-' + index"
                    class="suggestion-item"
                    @click="selectSuggestion(suggestion)"
                  >
                    <div class="suggestion-icon">
                      <v-icon name="ri-capsule-line" scale="0.9" />
                    </div>
                    <div class="suggestion-info">
                      <span class="suggestion-name">{{ suggestion.name }}</span>
                      <span class="suggestion-details">
                        {{ suggestion.strength }}{{ suggestion.dosage_form ? ' • ' + suggestion.dosage_form : '' }}
                      </span>
                    </div>
                    <span class="suggestion-price">₦{{ formatCurrency(suggestion.selling_price) }}</span>
                  </div>
                </div>
              </transition>
            </div>
          </div>

          <!-- Quick Actions Card -->
          <div class="bento-card actions-card">
            <div class="card-header">
              <h3>Quick Actions</h3>
            </div>
            <div class="actions-row">
              <button class="action-btn" @click="showCategoriesModal = true">
                <div class="action-icon sky">
                  <v-icon name="hi-view-grid" scale="1.1" />
                </div>
                <span>Categories</span>
              </button>
              <button class="action-btn" @click="goToCart">
                <div class="action-icon emerald">
                  <v-icon name="hi-shopping-cart" scale="1.1" />
                </div>
                <span>Cart{{ cartItemCount > 0 ? ` (${cartItemCount})` : '' }}</span>
              </button>
              <button class="action-btn" @click="$router.push('/app/patient/orders')">
                <div class="action-icon violet">
                  <v-icon name="hi-clipboard-list" scale="1.1" />
                </div>
                <span>My Orders</span>
              </button>
              <button class="action-btn" @click="$router.push('/app/patient/prescriptions')">
                <div class="action-icon amber">
                  <v-icon name="ri-capsule-line" scale="1.1" />
                </div>
                <span>Prescriptions</span>
              </button>
            </div>
          </div>

          <!-- Categories Card - Grid Layout -->
          <div class="bento-card categories-card">
            <div class="card-header">
              <h3>Browse Categories</h3>
              <button class="view-all" @click="showCategoriesModal = true">
                View All ({{ categories.length }})
                <v-icon name="hi-arrow-right" scale="0.75" />
              </button>
            </div>
            <div class="categories-grid">
              <button
                :class="['category-card', { active: selectedCategory === null && !searchQuery }]"
                @click="selectCategory(null)"
              >
                <div class="category-image all-products">
                  <v-icon name="hi-sparkles" scale="1.4" />
                </div>
                <span>All Products</span>
              </button>
              <button
                v-for="category in displayedCategories"
                :key="category.id"
                :class="['category-card', { active: selectedCategory === category.slug }]"
                @click="selectCategory(category.slug)"
              >
                <div class="category-image">
                  <img
                    v-if="category.image_url"
                    :src="category.image_url"
                    :alt="category.name"
                    @error="handleImageError($event, category)"
                  />
                  <v-icon v-else name="ri-capsule-line" scale="1.4" />
                </div>
                <span>{{ category.name }}</span>
              </button>
            </div>
            <!-- Show More/Less Toggle -->
            <button
              v-if="categories.length > 7"
              class="toggle-categories"
              @click="showAllCategories = !showAllCategories"
            >
              <span>{{ showAllCategories ? 'Show Less' : `Show All (${categories.length})` }}</span>
              <v-icon :name="showAllCategories ? 'hi-chevron-up' : 'hi-chevron-down'" scale="0.8" />
            </button>
          </div>

          <!-- Filters Bar -->
          <div class="bento-card filters-card">
            <div class="filters-row">
              <span class="results-info">
                <strong>{{ totalProducts }}</strong> products{{ selectedCategory ? ` in ${formatCategoryName(selectedCategory)}` : '' }}
              </span>
              <div class="filters-actions">
                <div class="sort-select">
                  <v-icon name="hi-sort-ascending" scale="0.85" />
                  <select v-model="sortBy" @change="applyFilters">
                    <option value="name_asc">Name: A-Z</option>
                    <option value="name_desc">Name: Z-A</option>
                    <option value="price_low">Price: Low to High</option>
                    <option value="price_high">Price: High to Low</option>
                    <option value="newest">Newest First</option>
                  </select>
                </div>
                <button class="filter-btn" @click="showFiltersModal = true">
                  <v-icon name="hi-adjustments" scale="0.9" />
                  <span>Filters</span>
                  <span v-if="activeFiltersCount > 0" class="filter-badge">{{ activeFiltersCount }}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Products Grid Card -->
          <div class="bento-card products-card">
            <div class="card-header">
              <h3>{{ selectedCategory ? formatCategoryName(selectedCategory) : 'All Products' }}</h3>
              <button v-if="selectedCategory || searchQuery || activeFiltersCount > 0" class="clear-filter" @click="clearAllFilters">
                Clear filters
                <v-icon name="hi-x" scale="0.7" />
              </button>
            </div>

            <!-- Products Skeleton Loading -->
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

            <!-- Products Grid -->
            <div v-else-if="products.length > 0" class="products-grid">
              <DrugCard
                v-for="drug in products"
                :key="drug._id"
                :drug="drug"
                @add-to-cart="addToCart"
                @view-details="viewDrugDetails"
              />
            </div>

            <!-- Empty State -->
            <div v-else class="empty-state">
              <div class="empty-icon">
                <v-icon name="hi-search" scale="2" />
              </div>
              <h3>No products found</h3>
              <p>Try adjusting your search or filters</p>
              <button class="empty-action" @click="clearAllFilters">
                <v-icon name="hi-refresh" scale="0.9" />
                Clear Filters
              </button>
            </div>

            <!-- Pagination -->
            <div class="pagination" v-if="products.length > 0 && totalPages > 1">
              <div class="pagination-info">
                Showing {{ showingFrom }}-{{ showingTo }} of {{ totalProducts }}
              </div>
              <div class="pagination-controls">
                <button
                  class="page-btn"
                  :disabled="currentPage === 1"
                  @click="goToPage(currentPage - 1)"
                >
                  <v-icon name="hi-chevron-left" scale="0.8" />
                  <span class="btn-text">Prev</span>
                </button>
                <div class="page-numbers">
                  <button
                    v-for="page in visiblePages"
                    :key="page"
                    :class="['page-num', { active: page === currentPage, ellipsis: page === '...' }]"
                    :disabled="page === '...'"
                    @click="page !== '...' && goToPage(page)"
                  >
                    {{ page }}
                  </button>
                </div>
                <button
                  class="page-btn"
                  :disabled="currentPage === totalPages"
                  @click="goToPage(currentPage + 1)"
                >
                  <span class="btn-text">Next</span>
                  <v-icon name="hi-chevron-right" scale="0.8" />
                </button>
              </div>
            </div>
          </div>

          <!-- Features Banner -->
          <div class="bento-card features-card">
            <div class="features-grid">
              <div class="feature-item">
                <div class="feature-icon emerald">
                  <v-icon name="bi-truck" scale="1.1" />
                </div>
                <div class="feature-text">
                  <strong>Free Delivery</strong>
                  <span>Orders over ₦10,000</span>
                </div>
              </div>
              <div class="feature-item">
                <div class="feature-icon sky">
                  <v-icon name="hi-shield-check" scale="1.1" />
                </div>
                <div class="feature-text">
                  <strong>100% Genuine</strong>
                  <span>Authentic products</span>
                </div>
              </div>
              <div class="feature-item">
                <div class="feature-icon violet">
                  <v-icon name="hi-clock" scale="1.1" />
                </div>
                <div class="feature-text">
                  <strong>Fast Delivery</strong>
                  <span>Same day in Lagos</span>
                </div>
              </div>
              <div class="feature-item">
                <div class="feature-icon amber">
                  <v-icon name="hi-support" scale="1.1" />
                </div>
                <div class="feature-text">
                  <strong>24/7 Support</strong>
                  <span>Always available</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </template>
    </div>

    <!-- Floating Cart Button -->
    <button class="fab" @click="goToCart" v-if="cartItemCount > 0">
      <v-icon name="hi-shopping-cart" scale="1.2" />
      <span class="fab-badge">{{ cartItemCount }}</span>
    </button>

    <!-- Categories Modal -->
    <Teleport to="body">
      <transition name="modal">
        <div v-if="showCategoriesModal" class="modal-overlay" @click="showCategoriesModal = false">
          <div class="modal-content categories-modal" @click.stop>
            <div class="modal-header">
              <h3>All Categories</h3>
              <button class="close-btn" @click="showCategoriesModal = false">
                <v-icon name="hi-x" scale="1" />
              </button>
            </div>
            <div class="modal-body">
              <div class="categories-modal-grid">
                <button
                  :class="['category-modal-item', { active: selectedCategory === null }]"
                  @click="selectCategoryAndClose(null)"
                >
                  <div class="category-modal-image all-products">
                    <v-icon name="hi-sparkles" scale="1.5" />
                  </div>
                  <span>All Products</span>
                </button>
                <button
                  v-for="category in categories"
                  :key="category.id"
                  :class="['category-modal-item', { active: selectedCategory === category.slug }]"
                  @click="selectCategoryAndClose(category.slug)"
                >
                  <div class="category-modal-image">
                    <img
                      v-if="category.image_url"
                      :src="category.image_url"
                      :alt="category.name"
                      @error="handleImageError($event, category)"
                    />
                    <v-icon v-else name="ri-capsule-line" scale="1.5" />
                  </div>
                  <span>{{ category.name }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>

    <!-- Filters Modal -->
    <Teleport to="body">
      <transition name="modal">
        <div v-if="showFiltersModal" class="modal-overlay" @click="showFiltersModal = false">
          <div class="modal-content" @click.stop>
            <div class="modal-header">
              <h3>Filter Products</h3>
              <button class="close-btn" @click="showFiltersModal = false">
                <v-icon name="hi-x" scale="1" />
              </button>
            </div>
            <div class="modal-body">
              <!-- Price Range -->
              <div class="filter-section">
                <h4>Price Range</h4>
                <div class="price-inputs">
                  <div class="price-input">
                    <label>Min (₦)</label>
                    <input type="number" v-model.number="filters.minPrice" placeholder="0" />
                  </div>
                  <span class="price-separator">—</span>
                  <div class="price-input">
                    <label>Max (₦)</label>
                    <input type="number" v-model.number="filters.maxPrice" placeholder="Any" />
                  </div>
                </div>
              </div>

              <!-- Availability -->
              <div class="filter-section">
                <h4>Availability</h4>
                <label class="checkbox-label">
                  <input type="checkbox" v-model="filters.inStockOnly" />
                  <span class="checkbox-custom"></span>
                  <span class="checkbox-text">In Stock Only</span>
                </label>
              </div>

              <!-- Product Type -->
              <div class="filter-section">
                <h4>Product Type</h4>
                <div class="radio-group">
                  <label class="radio-label">
                    <input type="radio" v-model="filters.prescriptionType" value="all" />
                    <span class="radio-custom"></span>
                    <span class="radio-text">All Products</span>
                  </label>
                  <label class="radio-label">
                    <input type="radio" v-model="filters.prescriptionType" value="otc" />
                    <span class="radio-custom"></span>
                    <span class="radio-text">Over-the-Counter (OTC)</span>
                  </label>
                  <label class="radio-label">
                    <input type="radio" v-model="filters.prescriptionType" value="rx" />
                    <span class="radio-custom"></span>
                    <span class="radio-text">Prescription Only</span>
                  </label>
                </div>
              </div>

              <!-- Dosage Form -->
              <div class="filter-section">
                <h4>Dosage Form</h4>
                <div class="dosage-chips">
                  <button
                    v-for="form in dosageForms"
                    :key="form"
                    :class="['dosage-chip', { active: filters.dosageForms.includes(form) }]"
                    @click="toggleDosageForm(form)"
                  >
                    {{ form }}
                  </button>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-secondary" @click="resetFilters">
                Reset All
              </button>
              <button class="btn-primary" @click="applyFiltersAndClose">
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useStore } from "vuex";
import DrugCard from "./components/DrugCard.vue";
import axios from "@/services/http";

export default {
  name: "PharmacyIndex",
  components: {
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
    const initialLoading = ref(true);
    const loading = ref(false);
    const products = ref([]);
    const totalProducts = ref(0);
    const currentPage = ref(1);
    const itemsPerPage = 12;
    const categories = ref([]);
    const showFiltersModal = ref(false);
    const showCategoriesModal = ref(false);
    const showAllCategories = ref(false);

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

    // Vuex
    const addToCartAction = (payload) => store.dispatch("pharmacy/addToCart", payload);
    const loadCartFromStorage = () => store.dispatch("pharmacy/loadCartFromStorage");
    const cartItemCount = computed(() => store.getters["pharmacy/getCartItemCount"] || 0);

    // Category icon mapping
    const categoryIconMap = {
      'pill': 'ri-capsule-line',
      'thermometer': 'fa-thermometer-half',
      'vitamin': 'gi-pill',
      'bandage': 'gi-bandage-roll',
      'stomach': 'gi-stomach',
      'skincare': 'gi-face-to-face',
      'eye': 'hi-eye',
      'lungs': 'gi-lungs',
      'heart-beat': 'hi-heart',
      'brain': 'gi-brain',
    };

    const getCategoryIcon = (icon) => {
      return categoryIconMap[icon] || 'ri-capsule-line';
    };

    // Displayed categories (limited or all)
    const displayedCategories = computed(() => {
      if (showAllCategories.value) {
        return categories.value;
      }
      return categories.value.slice(0, 7);
    });

    // Pagination computed
    const totalPages = computed(() => {
      return Math.ceil(totalProducts.value / itemsPerPage);
    });

    const showingFrom = computed(() => {
      if (totalProducts.value === 0) return 0;
      return (currentPage.value - 1) * itemsPerPage + 1;
    });

    const showingTo = computed(() => {
      const end = currentPage.value * itemsPerPage;
      return Math.min(end, totalProducts.value);
    });

    const visiblePages = computed(() => {
      const pages = [];
      const total = totalPages.value;
      const current = currentPage.value;

      if (total <= 7) {
        for (let i = 1; i <= total; i++) {
          pages.push(i);
        }
      } else {
        // Always show first page
        pages.push(1);

        if (current > 3) {
          pages.push('...');
        }

        // Show pages around current
        const start = Math.max(2, current - 1);
        const end = Math.min(total - 1, current + 1);

        for (let i = start; i <= end; i++) {
          if (!pages.includes(i)) {
            pages.push(i);
          }
        }

        if (current < total - 2) {
          pages.push('...');
        }

        // Always show last page
        if (!pages.includes(total)) {
          pages.push(total);
        }
      }

      return pages;
    });

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
            icon: getIconForCategory(cat.code),
            image_url: cat.image_url || null,
          }));
        } else {
          setDefaultCategories();
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        setDefaultCategories();
      }
    };

    const handleImageError = (event, category) => {
      // Hide the broken image and let the fallback icon show
      event.target.style.display = 'none';
      category.image_url = null;
    };

    const getIconForCategory = (code) => {
      const iconMap = {
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
      return iconMap[code] || "pill";
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

    const fetchProducts = async (page = 1) => {
      loading.value = true;
      currentPage.value = page;

      try {
        const params = {
          page: page,
          limit: itemsPerPage,
        };

        if (searchQuery.value) {
          params.query = searchQuery.value;
        }

        if (selectedCategory.value) {
          params.category = selectedCategory.value;
        }

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

        const response = await axios.get("/pharmacy/drugs/search", { params });
        const data = response.data?.result || response.data?.data;

        if (data) {
          const newProducts = data.drugs || data.items || data;
          products.value = Array.isArray(newProducts) ? newProducts : [];
          totalProducts.value = data.total || data.totalCount || products.value.length;
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        loading.value = false;
        initialLoading.value = false;
      }
    };

    const goToPage = (page) => {
      if (page >= 1 && page <= totalPages.value) {
        fetchProducts(page);
        // Scroll to products section
        const productsCard = document.querySelector('.products-card');
        if (productsCard) {
          productsCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    };

    let searchDebounceTimer = null;

    const handleSearchInput = () => {
      if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer);
      }

      if (searchQuery.value.length >= 2) {
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

    const onSearchFocus = () => {
      if (searchSuggestions.value.length > 0) {
        showSuggestions.value = true;
      }
    };

    const handleSearch = () => {
      showSuggestions.value = false;
      currentPage.value = 1;
      fetchProducts(1);
    };

    const clearSearch = () => {
      searchQuery.value = "";
      showSuggestions.value = false;
      searchSuggestions.value = [];
      currentPage.value = 1;
      fetchProducts(1);
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
      currentPage.value = 1;
      fetchProducts(1);
    };

    const selectCategoryAndClose = (slug) => {
      showCategoriesModal.value = false;
      selectCategory(slug);
    };

    const goToAllCategories = () => {
      router.push("/app/patient/pharmacy/categories");
    };

    const applyFilters = () => {
      currentPage.value = 1;
      fetchProducts(1);
    };

    const applyFiltersAndClose = () => {
      showFiltersModal.value = false;
      currentPage.value = 1;
      fetchProducts(1);
    };

    const resetFilters = () => {
      filters.value = {
        minPrice: null,
        maxPrice: null,
        inStockOnly: false,
        prescriptionType: "all",
        dosageForms: [],
      };
    };

    const clearAllFilters = () => {
      resetFilters();
      selectedCategory.value = null;
      searchQuery.value = "";
      sortBy.value = "name_asc";
      showFiltersModal.value = false;
      currentPage.value = 1;
      fetchProducts(1);
    };

    const toggleDosageForm = (form) => {
      const index = filters.value.dosageForms.indexOf(form);
      if (index > -1) {
        filters.value.dosageForms.splice(index, 1);
      } else {
        filters.value.dosageForms.push(form);
      }
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

    const handleClickOutside = (event) => {
      const searchWrapper = document.querySelector(".search-wrapper");
      if (searchWrapper && !searchWrapper.contains(event.target)) {
        showSuggestions.value = false;
      }
    };

    onMounted(async () => {
      loadCartFromStorage();
      document.addEventListener("click", handleClickOutside);

      if (route.query.category) {
        selectedCategory.value = route.query.category;
      }

      await Promise.all([fetchCategories(), fetchProducts(1)]);
    });

    onUnmounted(() => {
      document.removeEventListener("click", handleClickOutside);
    });

    return {
      searchQuery,
      showSuggestions,
      searchSuggestions,
      selectedCategory,
      sortBy,
      initialLoading,
      loading,
      products,
      totalProducts,
      currentPage,
      totalPages,
      showingFrom,
      showingTo,
      visiblePages,
      categories,
      displayedCategories,
      showFiltersModal,
      showCategoriesModal,
      showAllCategories,
      filters,
      dosageForms,
      cartItemCount,
      activeFiltersCount,
      formatCurrency,
      formatCategoryName,
      getCategoryIcon,
      handleImageError,
      handleSearchInput,
      onSearchFocus,
      handleSearch,
      clearSearch,
      selectSuggestion,
      selectCategory,
      selectCategoryAndClose,
      goToAllCategories,
      applyFilters,
      applyFiltersAndClose,
      resetFilters,
      clearAllFilters,
      toggleDosageForm,
      goToPage,
      addToCart,
      viewDrugDetails,
      goToCart,
    };
  },
};
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
$amber: #F59E0B;
$amber-light: #FEF3C7;
$rose: #F43F5E;
$rose-light: #FFE4E6;
$violet: #8B5CF6;
$violet-light: #EDE9FE;

@mixin glass-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);
}

.pharmacy-page {
  width: 100%;
  min-height: 100vh;
  background: $bg;
}

// Mobile Header
.mobile-header {
  display: none;
  position: sticky;
  top: 0;
  z-index: 100;
  padding: 12px 16px;
  background: white;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #F1F5F9;

  @media (max-width: 768px) {
    display: flex;
  }

  .menu-btn, .cart-btn {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    border: none;
    background: $bg;
    color: $slate;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    position: relative;

    &:active {
      background: #E2E8F0;
    }
  }

  .cart-btn {
    .cart-count {
      position: absolute;
      top: -4px;
      right: -4px;
      min-width: 18px;
      height: 18px;
      background: $rose;
      color: white;
      font-size: 10px;
      font-weight: 700;
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 4px;
    }
  }

  .header-logo {
    img {
      height: 28px;
      width: auto;
    }
  }
}

// Page Content
.page-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px 32px 100px;

  @media (max-width: 768px) {
    padding: 16px 16px 120px;
  }
}

// Loading State
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 16px;

  .loading-spinner {
    position: relative;
    width: 64px;
    height: 64px;

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

  p {
    color: $gray;
    font-size: 14px;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

// ============================================
// HERO SECTION
// ============================================
.hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  padding: 48px 40px 56px;
  background: linear-gradient(135deg, $sky 0%, $sky-dark 50%, $sky-darker 100%);
  border-radius: 28px;
  position: relative;
  overflow: hidden;
  min-height: 460px;
  margin-bottom: 24px;
  box-shadow:
    0 20px 60px rgba(2, 136, 209, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    padding: 24px 20px;
    gap: 0;
    text-align: center;
    min-height: auto;
    border-radius: 20px;
    margin-bottom: 16px;
  }

  .hero__content {
    display: flex;
    flex-direction: column;
    justify-content: center;
    z-index: 2;
  }

  .hero__badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(10px);
    border-radius: 24px;
    width: fit-content;
    margin-bottom: 20px;
    position: relative;

    @media (max-width: 768px) {
      margin: 0 auto 12px;
      padding: 6px 14px;
    }

    .badge-pulse {
      position: absolute;
      left: 12px;
      width: 8px;
      height: 8px;
      background: $emerald;
      border-radius: 50%;
      animation: pulse 2s ease-in-out infinite;

      &::after {
        content: '';
        position: absolute;
        inset: -4px;
        background: rgba($emerald, 0.4);
        border-radius: 50%;
        animation: pulse-ring 2s ease-out infinite;
      }

      @media (max-width: 768px) {
        left: 10px;
        width: 6px;
        height: 6px;
      }
    }

    svg {
      width: 16px;
      height: 16px;
      color: white;
      margin-left: 12px;

      @media (max-width: 768px) {
        width: 14px;
        height: 14px;
        margin-left: 10px;
      }
    }

    span {
      font-size: 13px;
      font-weight: 600;
      color: white;
      letter-spacing: 0.3px;

      @media (max-width: 768px) {
        font-size: 12px;
      }
    }
  }

  .hero__title {
    font-size: 48px;
    font-weight: 800;
    color: white;
    line-height: 1.1;
    margin: 0 0 16px;
    letter-spacing: -1px;

    @media (max-width: 768px) {
      font-size: 28px;
      margin: 0 0 8px;
      letter-spacing: -0.5px;

      br {
        display: none;
      }
    }

    .hero__title-accent {
      background: linear-gradient(90deg, #fff 0%, rgba(255,255,255,0.7) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;

      @media (max-width: 768px) {
        display: inline;
        margin-left: 6px;
      }
    }
  }

  .hero__subtitle {
    font-size: 18px;
    color: white;
    line-height: 1.6;
    margin: 0 0 24px;
    max-width: 400px;
    opacity: 0.95;

    @media (max-width: 768px) {
      font-size: 14px;
      max-width: 100%;
      margin: 0 0 16px;
      opacity: 0.9;
    }
  }

  .hero__stats {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 16px 20px;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    width: fit-content;

    @media (max-width: 768px) {
      width: 100%;
      justify-content: space-around;
      padding: 14px 16px;
      gap: 0;
      border-radius: 12px;
    }
  }

  .hero__visual {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;

    @media (max-width: 768px) {
      display: none;
    }
  }
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: none;
  border-radius: 12px;
  padding: 10px 16px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  margin-bottom: 20px;
  width: fit-content;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.25);
  }
}

.desktop-only {
  @media (max-width: 768px) {
    display: none !important;
  }
}

.hero-stat {
  text-align: center;

  &__value {
    display: block;
    font-size: 24px;
    font-weight: 700;
    color: white;
    line-height: 1;

    @media (max-width: 768px) {
      font-size: 20px;
    }

    &--warning {
      color: $amber-light;
    }

    &--info {
      color: $sky-light;
    }

    &--success {
      color: $emerald-light;
    }
  }

  &__label {
    display: block;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.7);
    margin-top: 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;

    @media (max-width: 768px) {
      font-size: 10px;
    }
  }

  &__divider {
    width: 1px;
    height: 32px;
    background: rgba(255, 255, 255, 0.2);

    @media (max-width: 768px) {
      height: 28px;
    }
  }
}

// Orb Animation
.pharmacy-orb {
  position: relative;
  width: 200px;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.orb-ring {
  position: absolute;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.2);

  &--1 {
    width: 100%;
    height: 100%;
    animation: spin-slow 20s linear infinite;
  }

  &--2 {
    width: 80%;
    height: 80%;
    animation: spin-slow 15s linear infinite reverse;
  }

  &--3 {
    width: 60%;
    height: 60%;
    animation: spin-slow 10s linear infinite;
  }
}

.orb-core {
  width: 100px;
  height: 100px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(20px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 0 40px rgba(255, 255, 255, 0.3),
    0 0 80px rgba(79, 195, 247, 0.3);
  animation: pulse-glow 3s ease-in-out infinite;

  svg {
    width: 48px;
    height: 48px;
    color: white;
  }
}

.floating-icons {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.float-icon {
  position: absolute;
  width: 44px;
  height: 44px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: float 3s ease-in-out infinite;

  svg {
    width: 20px;
    height: 20px;
    color: white;
  }

  &--1 {
    top: 10%;
    right: 10%;
    animation-delay: 0s;
  }

  &--2 {
    bottom: 20%;
    right: 5%;
    animation-delay: 1s;
  }

  &--3 {
    bottom: 10%;
    left: 10%;
    animation-delay: 2s;
  }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
}

@keyframes pulse-ring {
  0% { transform: scale(1); opacity: 0.8; }
  100% { transform: scale(2.5); opacity: 0; }
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 40px rgba(255, 255, 255, 0.3), 0 0 80px rgba(79, 195, 247, 0.3); }
  50% { box-shadow: 0 0 60px rgba(255, 255, 255, 0.4), 0 0 100px rgba(79, 195, 247, 0.4); }
}

@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

// ============================================
// BENTO GRID
// ============================================
.bento-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 20px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(6, 1fr);
  }

  @media (max-width: 768px) {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
}

.bento-card {
  @include glass-card;
  border-radius: 20px;
  padding: 20px;

  @media (max-width: 768px) {
    padding: 16px;
    border-radius: 16px;
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;

    @media (max-width: 768px) {
      margin-bottom: 12px;
    }

    h3 {
      font-size: 15px;
      font-weight: 600;
      color: $navy;
      margin: 0;
    }

    .results-count {
      font-size: 13px;
      color: $gray;
    }

    .view-all {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      color: $sky-dark;
      font-weight: 500;
      background: none;
      border: none;
      cursor: pointer;

      &:hover {
        color: $sky-darker;
      }
    }

    .clear-filter {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      color: $sky-dark;
      font-weight: 500;
      background: none;
      border: none;
      cursor: pointer;

      &:hover {
        color: $rose;
      }
    }
  }
}

// Search Card
.search-card {
  grid-column: span 8;

  @media (max-width: 1024px) {
    grid-column: span 6;
  }

  .search-wrapper {
    position: relative;
  }

  .search-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    background: $bg;
    padding: 12px 16px;
    border-radius: 14px;
    border: 1px solid #E2E8F0;
    transition: all 0.2s;

    &:focus-within {
      border-color: $sky;
      box-shadow: 0 0 0 3px rgba($sky, 0.1);
    }

    .search-icon {
      color: $gray;
      flex-shrink: 0;
    }

    input {
      flex: 1;
      border: none;
      outline: none;
      font-size: 14px;
      color: $navy;
      background: transparent;
      min-width: 0;

      &::placeholder {
        color: $light-gray;
      }
    }

    .clear-btn {
      width: 28px;
      height: 28px;
      border-radius: 8px;
      border: none;
      background: #E2E8F0;
      color: $gray;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      &:hover {
        background: $rose-light;
        color: $rose;
      }
    }

    .search-submit {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      border: none;
      background: linear-gradient(135deg, $sky, $sky-dark);
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: all 0.2s;

      &:hover {
        transform: translateX(2px);
        box-shadow: 0 4px 12px rgba($sky, 0.3);
      }
    }
  }

  .search-suggestions {
    position: absolute;
    top: calc(100% + 8px);
    left: 0;
    right: 0;
    background: white;
    border-radius: 16px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
    overflow: hidden;
    z-index: 1000;
    max-height: 400px;
    overflow-y: auto;

    .suggestion-item {
      display: flex;
      align-items: center;
      padding: 14px 16px;
      cursor: pointer;
      transition: background 0.15s;
      gap: 12px;

      &:hover {
        background: $bg;
      }

      &:not(:last-child) {
        border-bottom: 1px solid #F1F5F9;
      }

      .suggestion-icon {
        width: 40px;
        height: 40px;
        background: $sky-light;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: $sky-dark;
        flex-shrink: 0;
      }

      .suggestion-info {
        flex: 1;
        min-width: 0;

        .suggestion-name {
          display: block;
          font-weight: 600;
          color: $navy;
          font-size: 14px;
          margin-bottom: 2px;
        }

        .suggestion-details {
          font-size: 12px;
          color: $gray;
        }
      }

      .suggestion-price {
        font-weight: 700;
        color: $sky-dark;
        font-size: 14px;
        flex-shrink: 0;
      }
    }
  }
}

// Dropdown animation
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

// Actions Card
.actions-card {
  grid-column: span 4;

  @media (max-width: 1024px) {
    grid-column: span 6;
  }

  @media (max-width: 768px) {
    display: none;
  }

  .actions-row {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .action-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 16px 12px;
    background: $bg;
    border: 1px solid #E2E8F0;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: white;
      border-color: $sky;
      box-shadow: 0 4px 12px rgba($sky, 0.15);
      transform: translateY(-2px);
    }

    span {
      font-size: 12px;
      font-weight: 500;
      color: $slate;
    }
  }

  .action-icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;

    &.sky { background: $sky-light; color: $sky-dark; }
    &.emerald { background: $emerald-light; color: $emerald; }
    &.violet { background: $violet-light; color: $violet; }
    &.amber { background: $amber-light; color: $amber; }
  }
}

// Categories Card - Grid Layout
.categories-card {
  grid-column: span 12;

  .categories-grid {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 12px;

    @media (max-width: 1200px) {
      grid-template-columns: repeat(6, 1fr);
    }

    @media (max-width: 1024px) {
      grid-template-columns: repeat(4, 1fr);
    }

    @media (max-width: 768px) {
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
    }

    @media (max-width: 480px) {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  .category-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 14px 10px;
    background: white;
    border: 1px solid #E2E8F0;
    border-radius: 14px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      border-color: $sky;
      box-shadow: 0 4px 12px rgba($sky, 0.15);
      transform: translateY(-2px);

      .category-image {
        transform: scale(1.05);
      }
    }

    &.active {
      background: linear-gradient(135deg, $sky, $sky-dark);
      border-color: transparent;
      color: white;

      .category-image {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);

        &.all-products {
          background: rgba(255, 255, 255, 0.25);
          color: white;
        }
      }

      span {
        color: white;
      }
    }

    .category-image {
      width: 56px;
      height: 56px;
      border-radius: 14px;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      &.all-products {
        background: linear-gradient(135deg, $sky-light, lighten($sky, 25%));
        color: $sky-dark;
      }
    }

    span {
      font-size: 11px;
      font-weight: 600;
      color: $slate;
      text-align: center;
      line-height: 1.2;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .toggle-categories {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    width: 100%;
    margin-top: 16px;
    padding: 12px;
    background: $bg;
    border: 1px dashed #CBD5E1;
    border-radius: 12px;
    font-size: 13px;
    font-weight: 500;
    color: $sky-dark;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: $sky-light;
      border-color: $sky;
    }
  }
}

// Filters Card
.filters-card {
  grid-column: span 12;
  padding: 14px 20px;

  .filters-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
  }

  .results-info {
    font-size: 14px;
    color: $gray;

    strong {
      color: $navy;
    }
  }

  .filters-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .sort-select {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: $bg;
    border-radius: 10px;
    color: $gray;

    select {
      border: none;
      outline: none;
      background: transparent;
      font-size: 13px;
      color: $slate;
      cursor: pointer;
      padding-right: 4px;
    }
  }

  .filter-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    background: white;
    border: 1px solid #E2E8F0;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 500;
    color: $slate;
    cursor: pointer;
    position: relative;
    transition: all 0.2s;

    &:hover {
      border-color: $sky;
      color: $sky-dark;
    }

    .filter-badge {
      position: absolute;
      top: -6px;
      right: -6px;
      min-width: 18px;
      height: 18px;
      background: $sky;
      color: white;
      font-size: 10px;
      font-weight: 700;
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
}

// Products Card
.products-card {
  grid-column: span 12;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
}

.products-skeleton {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.skeleton-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;

  .skeleton-image {
    height: 140px;
    background: linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }

  .skeleton-content {
    padding: 14px;
  }

  .skeleton-line {
    height: 12px;
    background: linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 6px;
    margin-bottom: 10px;

    &.short {
      width: 60%;
    }
  }
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

// Empty State
.empty-state {
  text-align: center;
  padding: 48px 24px;

  .empty-icon {
    width: 80px;
    height: 80px;
    background: $sky-light;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 20px;
    color: $sky;
  }

  h3 {
    font-size: 18px;
    font-weight: 600;
    color: $navy;
    margin: 0 0 8px;
  }

  p {
    font-size: 14px;
    color: $gray;
    margin: 0 0 20px;
  }

  .empty-action {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    background: linear-gradient(135deg, $sky, $sky-dark);
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba($sky, 0.3);
    }
  }
}

// Pagination
.pagination {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #E2E8F0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.pagination-info {
  font-size: 13px;
  color: $gray;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 10px 16px;
  border: 1px solid #E2E8F0;
  background: white;
  border-radius: 10px;
  cursor: pointer;
  color: $slate;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;

  .btn-text {
    @media (max-width: 480px) {
      display: none;
    }
  }

  &:hover:not(:disabled) {
    border-color: $sky;
    color: $sky-dark;
    background: $sky-light;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.page-numbers {
  display: flex;
  gap: 4px;
}

.page-num {
  min-width: 40px;
  height: 40px;
  border: 1px solid #E2E8F0;
  background: white;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  color: $slate;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

  @media (max-width: 480px) {
    min-width: 36px;
    height: 36px;
    font-size: 13px;
  }

  &:hover:not(.active):not(.ellipsis) {
    border-color: $sky;
    color: $sky-dark;
  }

  &.active {
    background: linear-gradient(135deg, $sky, $sky-dark);
    border-color: transparent;
    color: white;
  }

  &.ellipsis {
    border: none;
    background: none;
    cursor: default;
    color: $gray;
  }
}

// Features Card
.features-card {
  grid-column: span 12;
  background: linear-gradient(135deg, #FFFFFF 0%, $sky-light 100%);

  .features-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;

    @media (max-width: 1024px) {
      grid-template-columns: repeat(2, 1fr);
    }

    @media (max-width: 480px) {
      grid-template-columns: 1fr;
    }
  }

  .feature-item {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px;
    background: white;
    border-radius: 14px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  }

  .feature-icon {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &.emerald { background: $emerald-light; color: $emerald; }
    &.sky { background: $sky-light; color: $sky-dark; }
    &.violet { background: $violet-light; color: $violet; }
    &.amber { background: $amber-light; color: $amber; }
  }

  .feature-text {
    strong {
      display: block;
      font-size: 14px;
      font-weight: 600;
      color: $navy;
      margin-bottom: 2px;
    }

    span {
      font-size: 12px;
      color: $gray;
    }
  }
}

// Floating Action Button
.fab {
  display: none;
  position: fixed;
  bottom: 90px;
  right: 20px;
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, $emerald, darken($emerald, 10%));
  color: white;
  border: none;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba($emerald, 0.4);
  cursor: pointer;
  z-index: 50;
  transition: all 0.2s;
  align-items: center;
  justify-content: center;

  @media (max-width: 768px) {
    display: flex;
  }

  &:active {
    transform: scale(0.95);
  }

  .fab-badge {
    position: absolute;
    top: -6px;
    right: -6px;
    min-width: 22px;
    height: 22px;
    background: $rose;
    color: white;
    font-size: 11px;
    font-weight: 700;
    border-radius: 11px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 4px;
    border: 2px solid white;
  }
}

// ============================================
// MODAL STYLES
// ============================================
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;

  @media (max-width: 768px) {
    align-items: flex-end;
    padding: 0;
  }
}

.modal-content {
  background: white;
  border-radius: 24px;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  animation: modal-in 0.3s ease;
  overflow: hidden;

  @media (max-width: 768px) {
    border-radius: 24px 24px 0 0;
    max-height: 85vh;
    animation: modal-slide-up 0.3s ease;
  }

  &.categories-modal {
    max-width: 600px;
  }
}

@keyframes modal-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes modal-slide-up {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #F1F5F9;

  h3 {
    font-size: 18px;
    font-weight: 600;
    color: $navy;
    margin: 0;
  }

  .close-btn {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    border: none;
    background: $bg;
    color: $gray;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background: $rose-light;
      color: $rose;
    }
  }
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #F1F5F9;

  .btn-secondary, .btn-primary {
    flex: 1;
    padding: 14px 20px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-secondary {
    background: $bg;
    border: 1px solid #E2E8F0;
    color: $slate;

    &:hover {
      background: #E2E8F0;
    }
  }

  .btn-primary {
    background: linear-gradient(135deg, $sky, $sky-dark);
    border: none;
    color: white;

    &:hover {
      box-shadow: 0 4px 12px rgba($sky, 0.3);
      transform: translateY(-1px);
    }
  }
}

// Categories Modal Grid
.categories-modal-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;

  @media (max-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.category-modal-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 16px 12px;
  background: $bg;
  border: 1px solid #E2E8F0;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: $sky;
    background: white;
    box-shadow: 0 4px 12px rgba($sky, 0.15);

    .category-modal-image {
      transform: scale(1.05);
    }
  }

  &.active {
    background: linear-gradient(135deg, $sky, $sky-dark);
    border-color: transparent;

    .category-modal-image {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);

      &.all-products {
        background: rgba(255, 255, 255, 0.25);
        color: white;
      }
    }

    span {
      color: white;
    }
  }

  .category-modal-image {
    width: 64px;
    height: 64px;
    border-radius: 16px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    &.all-products {
      background: linear-gradient(135deg, $sky-light, lighten($sky, 25%));
      color: $sky-dark;
    }
  }

  span {
    font-size: 13px;
    font-weight: 600;
    color: $slate;
    text-align: center;
    line-height: 1.3;
  }
}

.filter-section {
  margin-bottom: 28px;

  &:last-child {
    margin-bottom: 0;
  }

  h4 {
    font-size: 14px;
    font-weight: 600;
    color: $navy;
    margin: 0 0 14px;
  }
}

.price-inputs {
  display: flex;
  align-items: flex-end;
  gap: 12px;
}

.price-input {
  flex: 1;

  label {
    display: block;
    font-size: 12px;
    color: $gray;
    margin-bottom: 6px;
  }

  input {
    width: 100%;
    padding: 12px 14px;
    border: 1px solid #E2E8F0;
    border-radius: 10px;
    font-size: 14px;
    color: $navy;

    &:focus {
      outline: none;
      border-color: $sky;
      box-shadow: 0 0 0 3px rgba($sky, 0.1);
    }
  }
}

.price-separator {
  color: $light-gray;
  padding-bottom: 12px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 10px 0;

  input[type="checkbox"] {
    display: none;
  }

  .checkbox-custom {
    width: 22px;
    height: 22px;
    border: 2px solid #E2E8F0;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;

    &::after {
      content: '✓';
      color: white;
      font-size: 12px;
      opacity: 0;
      transform: scale(0.5);
      transition: all 0.2s;
    }
  }

  input:checked + .checkbox-custom {
    background: $sky;
    border-color: $sky;

    &::after {
      opacity: 1;
      transform: scale(1);
    }
  }

  .checkbox-text {
    font-size: 14px;
    color: $slate;
  }
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 10px 0;

  input[type="radio"] {
    display: none;
  }

  .radio-custom {
    width: 22px;
    height: 22px;
    border: 2px solid #E2E8F0;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;

    &::after {
      content: '';
      width: 10px;
      height: 10px;
      background: $sky;
      border-radius: 50%;
      opacity: 0;
      transform: scale(0.5);
      transition: all 0.2s;
    }
  }

  input:checked + .radio-custom {
    border-color: $sky;

    &::after {
      opacity: 1;
      transform: scale(1);
    }
  }

  .radio-text {
    font-size: 14px;
    color: $slate;
  }
}

.dosage-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  .dosage-chip {
    padding: 8px 16px;
    background: white;
    border: 1px solid #E2E8F0;
    border-radius: 20px;
    font-size: 13px;
    color: $slate;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      border-color: $sky;
      color: $sky-dark;
    }

    &.active {
      background: $sky-light;
      border-color: $sky;
      color: $sky-dark;
    }
  }
}

// Modal Transitions
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
    transform: scale(0.95);

    @media (max-width: 768px) {
      transform: translateY(100%);
    }
  }
}
</style>
