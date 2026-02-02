<template>
  <div class="category-step">
    <!-- Mobile Filter Drawer -->
    <div class="filter-overlay" :class="{ open: showMobileFilters }" @click="showMobileFilters = false"></div>
    <div class="filter-drawer" :class="{ open: showMobileFilters }">
      <div class="drawer-header">
        <h3 class="drawer-title">Filters</h3>
        <button class="drawer-close" @click="showMobileFilters = false">
          <v-icon name="hi-x" scale="1" />
        </button>
      </div>
      <div class="drawer-content">
        <!-- Search -->
        <div class="filter-group">
          <div class="search-wrapper">
            <v-icon name="hi-search" scale="0.8" class="search-icon" />
            <input
              type="text"
              v-model="searchQuery"
              placeholder="Search specialty..."
              class="search-input"
            />
          </div>
        </div>

        <!-- Gender -->
        <div class="filter-group">
          <label class="filter-label">Doctor Gender</label>
          <div class="radio-group">
            <label class="radio-item">
              <input type="radio" v-model="filters.gender" value="" />
              <span>No Preference</span>
            </label>
            <label class="radio-item">
              <input type="radio" v-model="filters.gender" value="female" />
              <span>Female</span>
            </label>
            <label class="radio-item">
              <input type="radio" v-model="filters.gender" value="male" />
              <span>Male</span>
            </label>
          </div>
        </div>

        <!-- Language -->
        <div class="filter-group">
          <label class="filter-label">Language</label>
          <div class="chip-group">
            <button
              v-for="lang in languages"
              :key="lang"
              class="filter-chip"
              :class="{ active: filters.language === lang }"
              @click="filters.language = filters.language === lang ? '' : lang"
            >
              {{ lang }}
            </button>
          </div>
        </div>

        <!-- Diaspora Toggle -->
        <div class="filter-group">
          <label class="toggle-row">
            <div class="toggle-info">
              <span class="toggle-title">Diaspora Doctors</span>
              <span class="toggle-desc">International specialists</span>
            </div>
            <div class="toggle-switch" :class="{ active: filters.diaspora }" @click.stop="filters.diaspora = !filters.diaspora">
              <div class="toggle-thumb"></div>
            </div>
          </label>
        </div>

        <!-- Price Range -->
        <div class="filter-group">
          <div class="price-header">
            <label class="filter-label">Consultation Fee</label>
            <span class="price-value">₦{{ filters.priceMin.toLocaleString() }} - ₦{{ filters.priceMax.toLocaleString() }}</span>
          </div>
          <input
            type="range"
            v-model="filters.priceMax"
            min="5000"
            max="50000"
            step="1000"
            class="price-slider"
          />
          <div class="price-range-labels">
            <span>₦5,000</span>
            <span>₦50,000+</span>
          </div>
        </div>

        <button class="apply-filters-btn" @click="showMobileFilters = false">
          Apply Filters
        </button>
      </div>
    </div>

    <div class="category-layout">
      <!-- Filters Panel (Desktop Only) -->
      <aside class="filters-panel">
        <div class="filters-header">
          <h3 class="filters-title">Filters</h3>
          <button class="reset-btn" @click="resetFilters">Reset All</button>
        </div>

        <!-- Search -->
        <div class="filter-group">
          <div class="search-wrapper">
            <v-icon name="hi-search" scale="0.8" class="search-icon" />
            <input
              type="text"
              v-model="searchQuery"
              placeholder="Search specialty..."
              class="search-input"
            />
          </div>
        </div>

        <!-- Gender -->
        <div class="filter-group">
          <label class="filter-label">Doctor Gender</label>
          <div class="radio-group">
            <label class="radio-item">
              <input type="radio" v-model="filters.gender" value="" />
              <span>No Preference</span>
            </label>
            <label class="radio-item">
              <input type="radio" v-model="filters.gender" value="female" />
              <span>Female</span>
            </label>
            <label class="radio-item">
              <input type="radio" v-model="filters.gender" value="male" />
              <span>Male</span>
            </label>
          </div>
        </div>

        <!-- Language -->
        <div class="filter-group">
          <label class="filter-label">Language</label>
          <div class="chip-group">
            <button
              v-for="lang in languages"
              :key="lang"
              class="filter-chip"
              :class="{ active: filters.language === lang }"
              @click="filters.language = filters.language === lang ? '' : lang"
            >
              {{ lang }}
            </button>
          </div>
        </div>

        <!-- Diaspora Toggle -->
        <div class="filter-group">
          <label class="toggle-row">
            <div class="toggle-info">
              <span class="toggle-title">Diaspora Doctors</span>
              <span class="toggle-desc">International specialists</span>
            </div>
            <div class="toggle-switch" :class="{ active: filters.diaspora }" @click="filters.diaspora = !filters.diaspora">
              <div class="toggle-thumb"></div>
            </div>
          </label>
        </div>

        <!-- Price Range -->
        <div class="filter-group">
          <div class="price-header">
            <label class="filter-label">Consultation Fee</label>
            <span class="price-value">₦{{ filters.priceMin.toLocaleString() }} - ₦{{ filters.priceMax.toLocaleString() }}</span>
          </div>
          <input
            type="range"
            v-model="filters.priceMax"
            min="5000"
            max="50000"
            step="1000"
            class="price-slider"
          />
          <div class="price-range-labels">
            <span>₦5,000</span>
            <span>₦50,000+</span>
          </div>
        </div>
      </aside>

      <!-- Main Content -->
      <div class="categories-content">
        <!-- AI Suggestion Banner (Mobile) -->
        <div class="ai-suggestion mobile-only">
          <div class="ai-icon">
            <v-icon name="fa-magic" scale="0.8" />
          </div>
          <div class="ai-content">
            <h4 class="ai-title">AI Suggestion</h4>
            <p class="ai-text">
              Based on your symptoms, we recommend <strong>General Practice</strong>
            </p>
            <button class="ai-select-btn" @click="selectCategory(popularCategories[0])">
              Select <v-icon name="hi-arrow-right" scale="0.6" />
            </button>
          </div>
        </div>

        <!-- Popular Categories -->
        <section class="category-section">
          <h2 class="section-title">
            <v-icon name="hi-star" scale="0.9" class="star-icon" />
            Popular Categories
          </h2>

          <!-- Loading State -->
          <div v-if="loadingCategories" class="loading-grid desktop-only">
            <div v-for="n in 6" :key="n" class="skeleton-card">
              <div class="skeleton-icon"></div>
              <div class="skeleton-title"></div>
              <div class="skeleton-desc"></div>
              <div class="skeleton-meta"></div>
            </div>
          </div>
          <div v-if="loadingCategories" class="loading-list mobile-only">
            <div v-for="n in 4" :key="n" class="skeleton-mobile-card">
              <div class="skeleton-icon-sm"></div>
              <div class="skeleton-content">
                <div class="skeleton-title"></div>
                <div class="skeleton-desc"></div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else-if="popularCategories.length === 0" class="empty-state">
            <v-icon name="hi-folder-open" scale="2" class="empty-icon" />
            <p class="empty-text">No popular categories available</p>
          </div>

          <!-- Categories Content (both desktop and mobile) -->
          <template v-else>
            <!-- Desktop Grid -->
            <div class="popular-grid desktop-only">
              <div
                v-for="cat in popularCategories"
                :key="cat.value"
                class="specialty-card"
                :class="{ selected: booking.category.specialist_category === cat.value }"
                @click="selectCategory(cat)"
              >
                <div class="card-radio">
                  <div class="radio-inner" v-if="booking.category.specialist_category === cat.value"></div>
                </div>
                <div class="card-icon" :style="{ background: cat.bgColor, color: cat.color }">
                  <v-icon :name="cat.icon" scale="1.2" />
                </div>
                <h3 class="card-title">{{ cat.label }}</h3>
                <p class="card-desc">{{ cat.description }}</p>
                <div class="card-meta">
                  <span class="doctor-count">
                    <v-icon name="hi-users" scale="0.6" /> {{ cat.doctorCount }}+
                  </span>
                  <span class="meta-dot"></span>
                  <span class="availability" :class="cat.availabilityClass">{{ cat.availability }}</span>
                </div>
              </div>
            </div>

            <!-- Mobile Cards (Horizontal Layout) -->
            <div class="popular-list mobile-only">
            <div
              v-for="cat in popularCategories"
              :key="cat.value"
              class="mobile-specialty-card"
              :class="{ selected: booking.category.specialist_category === cat.value }"
              @click="selectCategory(cat)"
            >
              <div class="mobile-card-radio">
                <div class="mobile-radio-inner" v-if="booking.category.specialist_category === cat.value"></div>
              </div>
              <div class="mobile-card-icon" :style="{ background: cat.bgColor, color: cat.color }">
                <v-icon :name="cat.icon" scale="1.1" />
              </div>
              <div class="mobile-card-content">
                <h3 class="mobile-card-title">{{ cat.label }}</h3>
                <p class="mobile-card-desc">{{ cat.description }}</p>
                <div class="mobile-card-meta">
                  <span class="doctor-count">
                    <v-icon name="hi-users" scale="0.5" /> {{ cat.doctorCount }}+
                  </span>
                  <span class="meta-dot"></span>
                  <span class="availability" :class="cat.availabilityClass">{{ cat.availability }}</span>
                </div>
              </div>
            </div>
          </div>
          </template>
        </section>

        <!-- Other Categories -->
        <section class="category-section" v-if="!loadingCategories && apiCategories.others.length > 0">
          <h2 class="section-title-plain">Other Categories</h2>
          <div class="other-list">
            <div
              v-for="cat in otherCategories"
              :key="cat.value"
              class="other-item"
              :class="{ selected: booking.category.specialist_category === cat.value }"
              @click="selectCategory(cat)"
            >
              <div class="other-icon" :class="{ active: booking.category.specialist_category === cat.value }">
                <v-icon :name="cat.icon" scale="0.9" />
              </div>
              <div class="other-content">
                <h4 class="other-title">{{ cat.label }}</h4>
                <p class="other-desc">{{ cat.description }}</p>
              </div>
              <v-icon name="hi-chevron-right" scale="0.8" class="other-arrow" />
            </div>
          </div>
          <button class="show-all-btn" v-if="!showAllCategories && apiCategories.others.length > 4" @click="showAllCategories = true">
            Show All {{ totalCategories }} Categories
            <v-icon name="hi-chevron-down" scale="0.7" />
          </button>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted } from 'vue';
import apiFactory from '@/services/apiFactory';

const booking = inject('bookingStateV2');

const searchQuery = ref('');
const showAllCategories = ref(false);
const showMobileFilters = ref(false);
const loadingCategories = ref(true);
const loadingLanguages = ref(true);

const filters = ref({
  gender: '',
  language: 'English',
  diaspora: false,
  priceMin: 5000,
  priceMax: 25000,
});

// API-driven data
const languages = ref([]);
const apiCategories = ref({ popular: [], others: [] });

// Color mappings for category icons based on icon name
const categoryColorMap = {
  'fa-user-md': { color: '#3B82F6', bgColor: '#EFF6FF' },
  'fa-baby': { color: '#EC4899', bgColor: '#FCE7F3' },
  'fa-allergies': { color: '#8B5CF6', bgColor: '#EDE9FE' },
  'fa-heartbeat': { color: '#EF4444', bgColor: '#FEF2F2' },
  'fa-female': { color: '#F43F5E', bgColor: '#FFE4E6' },
  'fa-brain': { color: '#14B8A6', bgColor: '#CCFBF1' },
  'fa-bone': { color: '#F59E0B', bgColor: '#FEF3C7' },
  'fa-pills': { color: '#6366F1', bgColor: '#E0E7FF' },
  'fa-lungs': { color: '#06B6D4', bgColor: '#CFFAFE' },
  'fa-eye': { color: '#10B981', bgColor: '#D1FAE5' },
  'fa-prescription-bottle-alt': { color: '#8B5CF6', bgColor: '#EDE9FE' },
  'fa-comments': { color: '#3B82F6', bgColor: '#DBEAFE' },
  'fa-stethoscope': { color: '#059669', bgColor: '#D1FAE5' },
  'hi-hand': { color: '#8B5CF6', bgColor: '#EDE9FE' },
  'hi-eye': { color: '#10B981', bgColor: '#D1FAE5' },
  'hi-beaker': { color: '#6366F1', bgColor: '#E0E7FF' },
  'fa-assistive-listening-systems': { color: '#F97316', bgColor: '#FFF7ED' },
  'fa-apple-alt': { color: '#22C55E', bgColor: '#F0FDF4' },
};

// Default colors
const defaultColors = { color: '#64748B', bgColor: '#F1F5F9' };

// Map API category to card format
const mapCategoryToCard = (cat, index) => {
  const colors = categoryColorMap[cat.icon] || defaultColors;
  return {
    value: cat.name,
    label: cat.name,
    description: cat.description || `Consult with ${cat.name} specialists`,
    icon: cat.icon || 'fa-user-md',
    color: colors.color,
    bgColor: colors.bgColor,
    doctorCount: 20 + (index * 5), // Placeholder count
    availability: index % 3 === 0 ? 'High Demand' : 'Available',
    availabilityClass: index % 3 === 0 ? 'high-demand' : 'available',
    professional_category: cat.professional_category,
    _id: cat._id,
  };
};

// Computed categories from API data
const popularCategories = computed(() => {
  return apiCategories.value.popular.map((cat, index) => mapCategoryToCard(cat, index));
});

const otherCategories = computed(() => {
  const mapped = apiCategories.value.others.map((cat, index) => mapCategoryToCard(cat, index));
  return showAllCategories.value ? mapped : mapped.slice(0, 4);
});

const totalCategories = computed(() => {
  return apiCategories.value.popular.length + apiCategories.value.others.length;
});

// Fetch categories from API
const fetchCategories = async () => {
  loadingCategories.value = true;
  try {
    const response = await apiFactory.$_getSpecialistCategories();
    // Backend returns { statusCode, message, data: { all, popular, others } }
    const result = response.data?.data || response.data?.result || response.data;
    if (result) {
      apiCategories.value = {
        popular: result.popular || [],
        others: result.others || [],
      };
    }
  } catch (error) {
    console.error('Failed to fetch specialist categories:', error);
    // Fallback to empty arrays if API fails
    apiCategories.value = { popular: [], others: [] };
  } finally {
    loadingCategories.value = false;
  }
};

// Fetch languages from API
const fetchLanguages = async () => {
  loadingLanguages.value = true;
  try {
    const response = await apiFactory.$_getLanguages();
    // Backend returns { statusCode, message, data: [...] }
    const result = response.data?.data || response.data?.result || response.data;
    if (result && Array.isArray(result)) {
      languages.value = result.map(lang => lang.name);
    }
  } catch (error) {
    console.error('Failed to fetch languages:', error);
    // Fallback to default languages if API fails
    languages.value = ['English', 'French', 'Yoruba', 'Hausa', 'Swahili'];
  } finally {
    loadingLanguages.value = false;
  }
};

// Fetch data on mount
onMounted(async () => {
  await fetchCategories();
  fetchLanguages();

  // Auto-select category if coming from "Book Again"
  if (booking.preSelectedCategory) {
    const allCats = [...popularCategories.value, ...otherCategories.value];
    const preSelected = allCats.find(cat =>
      cat.value === booking.preSelectedCategory ||
      cat.label === booking.preSelectedCategory ||
      cat.value?.toLowerCase() === booking.preSelectedCategory?.toLowerCase()
    );
    if (preSelected) {
      selectCategory(preSelected);
    }
  }
});

// Expose filter toggle for parent component
defineExpose({ showMobileFilters });

const resetFilters = () => {
  filters.value = {
    gender: '',
    language: languages.value.length > 0 ? languages.value[0] : 'English',
    diaspora: false,
    priceMin: 5000,
    priceMax: 25000,
  };
  searchQuery.value = '';
};

const selectCategory = (cat) => {
  booking.category.professional_category = cat.professional_category || 'Medical Doctor';
  booking.category.specialist_category = cat.value;
  booking.category.category_id = cat._id;
};
</script>

<style scoped lang="scss">
$v2-sky: #4FC3F7;
$v2-sky-light: #E1F5FE;
$v2-sky-dark: #0288D1;
$v2-orange: #FF9800;
$v2-orange-light: #FFF3E0;
$v2-navy: #1A365D;
$v2-success: #22C55E;

.category-step {
  height: 100%;
  overflow: hidden;
  position: relative;
}

// Responsive utilities
.mobile-only {
  display: none;
  @media (max-width: 768px) {
    display: block;
  }
}

.desktop-only {
  display: grid;
  @media (max-width: 768px) {
    display: none;
  }
}

// ==========================================
// MOBILE FILTER DRAWER
// ==========================================
.filter-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 100;
  opacity: 0;
  transition: opacity 0.3s ease;

  @media (max-width: 1024px) {
    &.open {
      display: block;
      opacity: 1;
    }
  }
}

.filter-drawer {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 320px;
  max-width: 85vw;
  background: white;
  z-index: 101;
  transform: translateX(-100%);
  transition: transform 0.3s ease;
  display: flex;
  flex-direction: column;
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.15);

  &.open {
    transform: translateX(0);
  }

  @media (min-width: 1025px) {
    display: none;
  }
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.drawer-title {
  font-size: 16px;
  font-weight: 700;
  color: $v2-navy;
  margin: 0;
}

.drawer-close {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
  border: none;
  border-radius: 8px;
  color: #64748b;
  cursor: pointer;
}

.drawer-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.apply-filters-btn {
  width: 100%;
  padding: 14px;
  background: $v2-sky;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  margin-top: 16px;

  &:active {
    background: $v2-sky-dark;
  }
}

// ==========================================
// AI SUGGESTION BANNER (Mobile)
// ==========================================
.ai-suggestion {
  margin: 16px;
  padding: 16px;
  background: rgba($v2-sky-light, 0.4);
  border: 1px solid rgba($v2-sky, 0.3);
  border-radius: 12px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.ai-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: $v2-sky;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ai-content {
  flex: 1;
  min-width: 0;
}

.ai-title {
  font-size: 11px;
  font-weight: 700;
  color: $v2-navy;
  margin: 0 0 4px;
}

.ai-text {
  font-size: 11px;
  color: #64748b;
  line-height: 1.5;
  margin: 0 0 10px;

  strong {
    color: $v2-navy;
  }
}

.ai-select-btn {
  width: 100%;
  padding: 8px 12px;
  background: white;
  border: 1px solid rgba($v2-sky, 0.4);
  border-radius: 8px;
  font-size: 11px;
  font-weight: 700;
  color: $v2-sky;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;

  &:active {
    background: $v2-sky;
    color: white;
  }
}

// ==========================================
// LAYOUT
// ==========================================
.category-layout {
  display: flex;
  height: 100%;
  overflow: hidden;
}

// ==========================================
// FILTERS PANEL (Desktop)
// ==========================================
.filters-panel {
  width: 280px;
  background: white;
  border-right: 1px solid #e2e8f0;
  padding: 24px;
  overflow-y: auto;
  flex-shrink: 0;

  @media (max-width: 1024px) {
    display: none;
  }
}

.filters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.filters-title {
  font-size: 15px;
  font-weight: 700;
  color: $v2-navy;
  margin: 0;
}

.reset-btn {
  font-size: 12px;
  color: $v2-sky;
  background: none;
  border: none;
  cursor: pointer;
  font-weight: 600;

  &:hover {
    text-decoration: underline;
  }
}

.filter-group {
  margin-bottom: 24px;
}

.filter-label {
  display: block;
  font-size: 10px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
}

.search-wrapper {
  position: relative;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
}

.search-input {
  width: 100%;
  padding: 10px 12px 10px 36px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  background: #f8fafc;

  &:focus {
    outline: none;
    border-color: $v2-sky;
    background: white;
  }
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.radio-item {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-size: 13px;
  color: #475569;

  input {
    accent-color: $v2-sky;
  }

  &:hover span {
    color: $v2-navy;
  }
}

.chip-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-chip {
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
  background: white;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #cbd5e1;
  }

  &.active {
    background: $v2-sky;
    border-color: $v2-sky;
    color: white;
  }
}

.toggle-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}

.toggle-info {
  display: flex;
  flex-direction: column;
}

.toggle-title {
  font-size: 13px;
  font-weight: 700;
  color: $v2-navy;
}

.toggle-desc {
  font-size: 11px;
  color: #64748b;
}

.toggle-switch {
  width: 44px;
  height: 24px;
  background: #e2e8f0;
  border-radius: 12px;
  position: relative;
  transition: all 0.2s;

  &.active {
    background: $v2-sky;

    .toggle-thumb {
      transform: translateX(20px);
    }
  }
}

.toggle-thumb {
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

.price-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.price-value {
  font-size: 12px;
  font-weight: 700;
  color: $v2-sky;
}

.price-slider {
  width: 100%;
  height: 4px;
  -webkit-appearance: none;
  background: #e2e8f0;
  border-radius: 2px;
  outline: none;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 14px;
    height: 14px;
    background: $v2-sky;
    border-radius: 50%;
    cursor: pointer;
    margin-top: -5px;
  }

  &::-webkit-slider-runnable-track {
    height: 4px;
    background: #e2e8f0;
    border-radius: 2px;
  }
}

.price-range-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
  font-size: 10px;
  color: #94a3b8;
}

// ==========================================
// MAIN CONTENT
// ==========================================
.categories-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background: #f8fafc;

  @media (max-width: 768px) {
    padding: 0;
  }
}

.category-section {
  margin-bottom: 32px;

  @media (max-width: 768px) {
    padding: 0 16px;
    margin-bottom: 20px;
  }
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 700;
  color: $v2-navy;
  margin: 0 0 16px;

  .star-icon {
    color: $v2-orange;
  }

  @media (max-width: 768px) {
    font-size: 13px;
    margin-bottom: 12px;
  }
}

.section-title-plain {
  font-size: 14px;
  font-weight: 700;
  color: $v2-navy;
  margin: 0 0 16px;

  @media (max-width: 768px) {
    font-size: 13px;
    margin-bottom: 12px;
  }
}

// ==========================================
// DESKTOP CARDS GRID
// ==========================================
.popular-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.specialty-card {
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 14px;
  padding: 20px;
  cursor: pointer;
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: translateY(-4px);
    border-color: $v2-sky;
    box-shadow: 0 12px 24px -8px rgba(79, 195, 247, 0.25);
  }

  &.selected {
    border-color: $v2-sky;
    background: $v2-sky-light;
    box-shadow: 0 0 0 2px $v2-sky;

    .card-radio {
      border-color: $v2-sky;
    }

    .radio-inner {
      display: block;
    }
  }
}

.card-radio {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 20px;
  height: 20px;
  border: 2px solid #d1d5db;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.radio-inner {
  width: 10px;
  height: 10px;
  background: $v2-sky;
  border-radius: 50%;
  display: none;
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;
}

.card-title {
  font-size: 15px;
  font-weight: 700;
  color: $v2-navy;
  margin: 0 0 6px;
}

.card-desc {
  font-size: 12px;
  color: #64748b;
  line-height: 1.5;
  margin: 0 0 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: #94a3b8;
}

.doctor-count {
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
}

.meta-dot {
  width: 4px;
  height: 4px;
  background: #cbd5e1;
  border-radius: 50%;
}

.availability {
  font-weight: 600;

  &.available {
    color: $v2-success;
  }

  &.high-demand {
    color: $v2-orange;
  }
}

// ==========================================
// MOBILE CARDS (Horizontal Layout)
// ==========================================
.popular-list {
  display: none;
  flex-direction: column;
  gap: 12px;

  @media (max-width: 768px) {
    display: flex;
  }
}

.mobile-specialty-card {
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;

  &.selected {
    border-color: $v2-sky;
    background: $v2-sky-light;
    box-shadow: 0 0 0 2px $v2-sky;

    .mobile-card-radio {
      border-color: $v2-sky;
    }

    .mobile-radio-inner {
      display: block;
    }
  }
}

.mobile-card-radio {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 20px;
  height: 20px;
  border: 2px solid #d1d5db;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.mobile-radio-inner {
  width: 10px;
  height: 10px;
  background: $v2-sky;
  border-radius: 50%;
  display: none;
}

.mobile-card-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.mobile-card-content {
  flex: 1;
  min-width: 0;
  padding-right: 24px;
}

.mobile-card-title {
  font-size: 14px;
  font-weight: 700;
  color: $v2-navy;
  margin: 0 0 4px;
}

.mobile-card-desc {
  font-size: 11px;
  color: #64748b;
  line-height: 1.4;
  margin: 0 0 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.mobile-card-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  color: #94a3b8;
}

// ==========================================
// OTHER CATEGORIES LIST
// ==========================================
.other-list {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  overflow: hidden;

  @media (max-width: 768px) {
    border-radius: 12px;
  }
}

.other-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
  transition: all 0.2s;

  @media (max-width: 768px) {
    padding: 12px;
    gap: 12px;
  }

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: #f8fafc;

    .other-icon {
      background: $v2-sky-light;
      color: $v2-sky;
    }

    .other-arrow {
      color: $v2-sky;
    }
  }

  &.selected {
    background: $v2-sky-light;

    .other-icon {
      background: $v2-sky;
      color: white;
    }
  }
}

.other-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #f1f5f9;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;

  @media (max-width: 768px) {
    width: 36px;
    height: 36px;
  }

  &.active {
    background: $v2-sky;
    color: white;
  }
}

.other-content {
  flex: 1;
  min-width: 0;
}

.other-title {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 2px;

  @media (max-width: 768px) {
    font-size: 12px;
  }
}

.other-desc {
  font-size: 12px;
  color: #64748b;
  margin: 0;

  @media (max-width: 768px) {
    font-size: 10px;
  }
}

.other-arrow {
  color: #cbd5e1;
  flex-shrink: 0;
  transition: all 0.2s;
}

.show-all-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  margin-top: 16px;
  padding: 12px;
  background: none;
  border: none;
  font-size: 12px;
  font-weight: 700;
  color: $v2-sky;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: $v2-navy;
  }
}

// ==========================================
// LOADING SKELETONS
// ==========================================
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.skeleton-shimmer {
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.loading-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.loading-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 20px;
}

.skeleton-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  margin-bottom: 14px;
  @extend .skeleton-shimmer;
}

.skeleton-title {
  height: 18px;
  width: 70%;
  border-radius: 4px;
  margin-bottom: 8px;
  @extend .skeleton-shimmer;
}

.skeleton-desc {
  height: 14px;
  width: 100%;
  border-radius: 4px;
  margin-bottom: 12px;
  @extend .skeleton-shimmer;
}

.skeleton-meta {
  height: 12px;
  width: 50%;
  border-radius: 4px;
  @extend .skeleton-shimmer;
}

.skeleton-mobile-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.skeleton-icon-sm {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  flex-shrink: 0;
  @extend .skeleton-shimmer;
}

.skeleton-content {
  flex: 1;
  min-width: 0;

  .skeleton-title {
    height: 16px;
    margin-bottom: 6px;
  }

  .skeleton-desc {
    height: 12px;
    width: 80%;
    margin-bottom: 0;
  }
}

// ==========================================
// EMPTY STATE
// ==========================================
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
}

.empty-icon {
  color: #cbd5e1;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}
</style>
