<template>
  <div class="page-content">
    <top-bar
      type="title-with-back"
      title="Categories"
      @open-side-nav="$emit('openSideNav')"
      @go-back="$router.back()"
    />

    <div class="page-content__body">
      <div class="categories-page">
        <!-- Breadcrumb -->
        <nav class="breadcrumb">
          <router-link to="/app/patient/pharmacy" class="breadcrumb-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            Pharmacy
          </router-link>
          <span class="breadcrumb-separator">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </span>
          <span class="breadcrumb-current">Categories</span>
        </nav>

        <!-- Hero Section -->
        <div class="hero-section">
          <div class="hero-content">
            <h1>Browse Categories</h1>
            <p>Find medications organized by health condition</p>
          </div>
          <div class="hero-pattern"></div>
        </div>

        <!-- Search Section -->
        <div class="search-section">
          <div class="search-box">
            <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              type="text"
              v-model="searchQuery"
              placeholder="Search categories..."
              @input="filterCategories"
            />
            <button v-if="searchQuery" class="clear-btn" @click="clearSearch">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div class="category-count" v-if="!loading">
            {{ filteredCategories.length }} {{ filteredCategories.length === 1 ? 'category' : 'categories' }}
          </div>
        </div>

        <!-- Skeleton Loading -->
        <div v-if="loading" class="categories-grid">
          <div v-for="n in 8" :key="n" class="category-card skeleton">
            <div class="skeleton-icon"></div>
            <div class="skeleton-content">
              <div class="skeleton-line title"></div>
              <div class="skeleton-line desc"></div>
            </div>
          </div>
        </div>

        <!-- Categories Grid -->
        <div v-else-if="filteredCategories.length > 0" class="categories-grid">
          <div
            v-for="(category, index) in filteredCategories"
            :key="category._id || category.id"
            :class="['category-card', `color-${index % 6}`]"
            @click="goToCategory(category)"
          >
            <div class="card-header">
              <div class="category-icon" :class="{ 'has-image': category.image_url }">
                <!-- Use image from database if available -->
                <img
                  v-if="category.image_url"
                  :src="category.image_url"
                  :alt="category.name"
                  class="category-image"
                  @error="handleImageError($event, category)"
                />
                <!-- Fallback to SVG icon -->
                <component v-else :is="getCategoryIconComponent(category.code)" />
              </div>
              <div class="product-badge" v-if="category.drug_count">
                {{ category.drug_count }} items
              </div>
            </div>
            <div class="card-body">
              <h3>{{ category.name }}</h3>
              <p v-if="getCategoryDescription(category)">{{ truncateText(getCategoryDescription(category), 60) }}</p>
            </div>
            <div class="card-footer">
              <span class="browse-text">Browse</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="empty-state">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
          </div>
          <h3>No categories found</h3>
          <p v-if="searchQuery">No results for "{{ searchQuery }}". Try a different search term.</p>
          <p v-else>No drug categories available at the moment.</p>
          <button v-if="searchQuery" class="clear-search-btn" @click="clearSearch">
            Clear Search
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, h } from "vue";
import { useRouter } from "vue-router";
import TopBar from "@/components/Navigation/top-bar";
import axios from "@/services/http";

export default {
  name: "PharmacyCategories",
  components: {
    TopBar,
  },
  emits: ["openSideNav"],
  setup() {
    const router = useRouter();
    const searchQuery = ref("");
    const categories = ref([]);
    const loading = ref(true);

    // SVG icon components for each category
    const categoryIcons = {
      PAIN_RELIEF: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
        h('path', { d: 'M10.5 20.5L3.5 13.5C1.5 11.5 1.5 8.5 3.5 6.5C5.5 4.5 8.5 4.5 10.5 6.5L17.5 13.5C19.5 15.5 19.5 18.5 17.5 20.5C15.5 22.5 12.5 22.5 10.5 20.5Z' }),
        h('line', { x1: '12', y1: '12', x2: '7', y2: '7' })
      ]),
      COLD_AND_FLU: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
        h('path', { d: 'M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z' })
      ]),
      VITAMINS_SUPPLEMENTS: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
        h('circle', { cx: '12', cy: '12', r: '5' }),
        h('path', { d: 'M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42' })
      ]),
      FIRST_AID: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
        h('path', { d: 'M22 12h-4l-3 9L9 3l-3 9H2' })
      ]),
      DIGESTIVE_HEALTH: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
        h('path', { d: 'M12 2C8 2 4 6 4 10c0 4 2 6 4 8s4 4 4 4 2-2 4-4 4-4 4-8c0-4-4-8-8-8z' })
      ]),
      SKIN_CARE: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
        h('path', { d: 'M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z' })
      ]),
      ALLERGIES: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
        h('path', { d: 'M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5' }),
        h('path', { d: 'M8.5 8.5v.01M16 15.5v.01M12 12v.01M11 17v.01M7 14v.01' })
      ]),
      EYE_CARE: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
        h('path', { d: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z' }),
        h('circle', { cx: '12', cy: '12', r: '3' })
      ]),
      RESPIRATORY: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
        h('path', { d: 'M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2' }),
        h('path', { d: 'M9.6 4.6A2 2 0 1 1 11 8H2' }),
        h('path', { d: 'M12.6 19.4A2 2 0 1 0 14 16H2' })
      ]),
      CARDIOVASCULAR: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
        h('path', { d: 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z' })
      ]),
      DIABETES: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
        h('path', { d: 'M22 12h-4l-3 9L9 3l-3 9H2' })
      ]),
      ANTIBIOTICS: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
        h('path', { d: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10' })
      ]),
      MENTAL_HEALTH: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
        h('path', { d: 'M12 2a8 8 0 0 0-8 8c0 6 8 12 8 12s8-6 8-12a8 8 0 0 0-8-8z' }),
        h('circle', { cx: '12', cy: '10', r: '3' })
      ]),
      WOMENS_HEALTH: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
        h('circle', { cx: '12', cy: '8', r: '6' }),
        h('path', { d: 'M12 14v8M9 18h6' })
      ]),
      MENS_HEALTH: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
        h('circle', { cx: '10', cy: '14', r: '6' }),
        h('path', { d: 'M21 3l-6.5 6.5M21 3h-5M21 3v5' })
      ]),
      CHILDREN_HEALTH: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
        h('path', { d: 'M9 12h.01M15 12h.01M10 16c.5.3 1.5.5 2 .5s1.5-.2 2-.5' }),
        h('path', { d: 'M19 6.3a9 9 0 0 1 1.8 3.9 2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5s-.9 2.5-2 2.5c-.8 0-1.5-.4-1.5-1' })
      ]),
    };

    const defaultIcon = () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
      h('path', { d: 'M10.5 20.5L3.5 13.5C1.5 11.5 1.5 8.5 3.5 6.5C5.5 4.5 8.5 4.5 10.5 6.5L17.5 13.5C19.5 15.5 19.5 18.5 17.5 20.5C15.5 22.5 12.5 22.5 10.5 20.5Z' }),
      h('line', { x1: '12', y1: '12', x2: '7', y2: '7' })
    ]);

    // Category descriptions mapping by slug
    const categoryDescriptions = {
      "pain-relief": "Analgesics and pain management medications",
      "cold-and-flu": "Medications for cold, flu, and respiratory symptoms",
      "digestive-health": "Antacids, laxatives, and digestive aids",
      "allergies": "Antihistamines and allergy relief medications",
      "skin-care": "Topical treatments, creams, and dermatological products",
      "vitamins-supplements": "Nutritional supplements, multivitamins, and minerals",
      "first-aid": "First aid supplies, bandages, and wound care",
      "eye-care": "Eye drops, contact lens solutions, and ophthalmic products",
      "ear-care": "Ear drops and ear care products",
      "oral-care": "Dental and oral hygiene products",
      "antibiotics": "Prescription antibiotics for bacterial infections",
      "antifungals": "Medications for fungal infections",
      "antivirals": "Medications for viral infections",
      "mental-health": "Medications for anxiety, depression, and mental wellness",
      "cardiovascular": "Heart health and blood pressure medications",
      "diabetes": "Insulin, glucose monitoring, and diabetes management",
      "respiratory": "Inhalers, nebulizers, and breathing medications",
      "womens-health": "Feminine care, contraceptives, and women's medications",
      "mens-health": "Men's wellness and health products",
      "children-health": "Pediatric medications and child-safe formulations",
      "hormones": "Hormone therapy and endocrine medications",
      "sexual-health": "Sexual wellness and reproductive health products",
      "sleep-aids": "Sleep support and insomnia medications",
      "weight-management": "Weight loss and appetite control products",
      "smoking-cessation": "Quit smoking aids and nicotine alternatives",
      "emergency-contraception": "Emergency contraceptive options",
      "medical-devices": "Medical equipment and health devices",
      "agbo-jedijedi": "Traditional herbal remedies",
    };

    const getCategoryIconComponent = (code) => {
      return categoryIcons[code] || defaultIcon;
    };

    const getCategoryDescription = (category) => {
      // First check if description exists in API data
      if (category.description) return category.description;
      // Then check our mapping by slug
      const slug = category.slug || category.code?.toLowerCase().replace(/_/g, '-');
      return categoryDescriptions[slug] || '';
    };

    const truncateText = (text, maxLength) => {
      if (!text) return '';
      return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    };

    const filteredCategories = computed(() => {
      if (!searchQuery.value) return categories.value;
      const query = searchQuery.value.toLowerCase();
      return categories.value.filter(cat =>
        cat.name.toLowerCase().includes(query) ||
        (cat.description && cat.description.toLowerCase().includes(query))
      );
    });

    const fetchCategories = async () => {
      try {
        loading.value = true;
        const response = await axios.get("/pharmacy/drugs/categories");
        const data = response.data?.data || response.data?.result || response.data;
        categories.value = Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Error fetching categories:", error);
        categories.value = [];
      } finally {
        loading.value = false;
      }
    };

    const goToCategory = (category) => {
      const slug = category.slug || category.code?.toLowerCase().replace(/_/g, '-');
      router.push(`/app/patient/pharmacy/category/${slug}`);
    };

    const filterCategories = () => {
      // Filter happens via computed property
    };

    const clearSearch = () => {
      searchQuery.value = "";
    };

    const handleImageError = (event, category) => {
      // Hide the broken image and let the SVG fallback show
      event.target.style.display = 'none';
      // Clear image_url to trigger SVG fallback
      category.image_url = null;
    };

    onMounted(() => {
      fetchCategories();
    });

    return {
      searchQuery,
      categories,
      filteredCategories,
      loading,
      getCategoryIconComponent,
      getCategoryDescription,
      truncateText,
      goToCategory,
      filterCategories,
      clearSearch,
      handleImageError,
    };
  },
};
</script>

<style scoped lang="scss">
.categories-page {
  max-width: 1200px;
  margin: 0 auto;
}

// Breadcrumb
.breadcrumb {
  display: flex;
  align-items: center;
  gap: $size-8;
  padding: $size-16 $size-16;
  margin-bottom: $size-8;
  font-size: $size-14;

  .breadcrumb-link {
    display: flex;
    align-items: center;
    gap: $size-6;
    color: $color-pri;
    text-decoration: none;
    font-weight: 500;
    transition: color 0.2s;

    svg {
      width: $size-16;
      height: $size-16;
    }

    &:hover {
      color: darken($color-pri, 10%);
    }
  }

  .breadcrumb-separator {
    color: $color-g-67;

    svg {
      width: $size-14;
      height: $size-14;
    }
  }

  .breadcrumb-current {
    color: $color-g-54;
    font-weight: 500;
  }
}

// Hero Section
.hero-section {
  position: relative;
  background: linear-gradient(135deg, $color-pri 0%, darken($color-pri, 15%) 100%);
  border-radius: 0 0 $size-24 $size-24;
  padding: $size-32 $size-24;
  margin: 0 0 $size-24 0;
  overflow: hidden;

  .hero-content {
    position: relative;
    z-index: 2;
    text-align: center;
    color: white;

    h1 {
      font-size: $size-28;
      font-weight: 700;
      margin: 0 0 $size-8 0;
    }

    p {
      font-size: $size-15;
      opacity: 0.9;
      margin: 0;
    }
  }

  .hero-pattern {
    position: absolute;
    inset: 0;
    background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    z-index: 1;
  }
}

// Search Section
.search-section {
  padding: 0 $size-16;
  margin-bottom: $size-24;

  .search-box {
    display: flex;
    align-items: center;
    background: $color-white;
    border: 2px solid $color-g-90;
    border-radius: $size-12;
    padding: $size-12 $size-16;
    transition: all 0.2s;

    &:focus-within {
      border-color: $color-pri;
      box-shadow: 0 0 0 3px rgba($color-pri, 0.1);
    }

    .search-icon {
      width: $size-20;
      height: $size-20;
      color: $color-g-54;
      margin-right: $size-12;
      flex-shrink: 0;
    }

    input {
      flex: 1;
      border: none;
      outline: none;
      font-size: $size-15;
      background: transparent;

      &::placeholder {
        color: $color-g-67;
      }
    }

    .clear-btn {
      width: $size-28;
      height: $size-28;
      display: flex;
      align-items: center;
      justify-content: center;
      background: $color-g-92;
      border: none;
      border-radius: 50%;
      cursor: pointer;
      transition: background 0.2s;

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

  .category-count {
    margin-top: $size-12;
    font-size: $size-13;
    color: $color-g-54;
    text-align: center;
  }
}

// Categories Grid
.categories-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $size-16;
  padding: 0 $size-16 $size-24;

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 540px) {
    grid-template-columns: 1fr;
  }
}

// Category Card
.category-card {
  background: $color-white;
  border-radius: $size-16;
  padding: $size-20;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid $color-g-92;
  display: flex;
  flex-direction: column;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);

    .card-footer svg {
      transform: translateX(4px);
    }
  }

  // Color variations
  &.color-0 .category-icon { background: rgba(#6366f1, 0.12); color: #6366f1; }
  &.color-1 .category-icon { background: rgba(#ec4899, 0.12); color: #ec4899; }
  &.color-2 .category-icon { background: rgba(#14b8a6, 0.12); color: #14b8a6; }
  &.color-3 .category-icon { background: rgba(#f59e0b, 0.12); color: #f59e0b; }
  &.color-4 .category-icon { background: rgba(#8b5cf6, 0.12); color: #8b5cf6; }
  &.color-5 .category-icon { background: rgba(#06b6d4, 0.12); color: #06b6d4; }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: $size-16;
  }

  .category-icon {
    width: $size-56;
    height: $size-56;
    border-radius: $size-14;
    display: flex;
    align-items: center;
    justify-content: center;
    background: $color-pri-t4;
    color: $color-pri;
    overflow: hidden;

    svg {
      width: $size-28;
      height: $size-28;
    }

    &.has-image {
      background: transparent;
      border: 1px solid $color-g-92;
    }

    .category-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .product-badge {
    background: $color-g-95;
    padding: $size-4 $size-10;
    border-radius: $size-12;
    font-size: $size-11;
    font-weight: 600;
    color: $color-g-44;
  }

  .card-body {
    flex: 1;
    margin-bottom: $size-16;

    h3 {
      font-size: $size-18;
      font-weight: 600;
      color: $color-g-21;
      margin: 0 0 $size-6 0;
    }

    p {
      font-size: $size-13;
      color: $color-g-54;
      line-height: 1.5;
      margin: 0;
    }
  }

  .card-footer {
    display: flex;
    align-items: center;
    gap: $size-6;
    color: $color-pri;
    font-size: $size-14;
    font-weight: 500;

    svg {
      width: $size-16;
      height: $size-16;
      transition: transform 0.2s;
    }
  }
}

// Skeleton Loading
.category-card.skeleton {
  pointer-events: none;

  .skeleton-icon {
    width: $size-56;
    height: $size-56;
    border-radius: $size-14;
    background: linear-gradient(90deg, $color-g-95 25%, $color-g-90 50%, $color-g-95 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }

  .skeleton-content {
    margin-top: $size-16;
  }

  .skeleton-line {
    border-radius: $size-4;
    background: linear-gradient(90deg, $color-g-95 25%, $color-g-90 50%, $color-g-95 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;

    &.title {
      height: $size-20;
      width: 70%;
      margin-bottom: $size-8;
    }

    &.desc {
      height: $size-14;
      width: 90%;
    }
  }
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

// Empty State
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $size-48 $size-24;
  text-align: center;

  .empty-icon {
    width: $size-80;
    height: $size-80;
    background: $color-g-95;
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
    margin: 0 0 $size-8 0;
  }

  p {
    font-size: $size-14;
    color: $color-g-54;
    margin: 0 0 $size-20 0;
    max-width: 300px;
  }

  .clear-search-btn {
    padding: $size-10 $size-20;
    background: $color-pri;
    color: white;
    border: none;
    border-radius: $size-8;
    font-size: $size-14;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;

    &:hover {
      background: darken($color-pri, 10%);
    }
  }
}
</style>
