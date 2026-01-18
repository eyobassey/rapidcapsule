<template>
  <div class="page-content">
    <top-bar
      type="title-with-back"
      title="Search Medications"
      @open-side-nav="$emit('openSideNav')"
      @go-back="$router.back()"
    />

    <div class="page-content__body">
      <div class="search-page">
        <!-- Search Input -->
        <div class="search-section">
          <div class="search-input">
            <RCIcon name="search" />
            <input
              ref="searchInput"
              type="text"
              v-model="searchQuery"
              placeholder="Search by name, brand, or generic..."
              @input="debouncedSearch"
              @keyup.enter="performSearch"
            />
            <button v-if="searchQuery" class="clear-btn" @click="clearSearch">
              <RCIcon name="close" />
            </button>
          </div>
        </div>

        <!-- Recent Searches -->
        <div class="recent-section" v-if="!searchQuery && recentSearches.length > 0">
          <div class="section-header">
            <h3>Recent Searches</h3>
            <button @click="clearRecentSearches">Clear All</button>
          </div>
          <div class="recent-list">
            <button
              v-for="(search, index) in recentSearches"
              :key="index"
              class="recent-item"
              @click="searchFromHistory(search)"
            >
              <RCIcon name="clock" />
              <span>{{ search }}</span>
            </button>
          </div>
        </div>

        <!-- Popular Searches -->
        <div class="popular-section" v-if="!searchQuery">
          <h3>Popular Searches</h3>
          <div class="popular-tags">
            <button
              v-for="(tag, index) in popularSearches"
              :key="index"
              class="popular-tag"
              @click="searchFromHistory(tag)"
            >
              {{ tag }}
            </button>
          </div>
        </div>

        <!-- Search Results -->
        <div v-if="searchQuery" class="results-section">
          <div class="results-header" v-if="!loading">
            <span>{{ searchResults.length }} results for "{{ searchQuery }}"</span>
          </div>

          <!-- Results Grid -->
          <div class="results-grid" v-if="!loading && searchResults.length > 0">
            <DrugCard
              v-for="drug in searchResults"
              :key="drug._id"
              :drug="drug"
              @add-to-cart="addToCart"
              @view-details="viewDrugDetails"
            />
          </div>

          <!-- No Results -->
          <div v-if="!loading && searchResults.length === 0 && hasSearched" class="no-results">
            <RCIcon name="search" />
            <h3>No medications found</h3>
            <p>Try different keywords or check the spelling</p>
            <div class="suggestions">
              <p>Suggestions:</p>
              <ul>
                <li>Check for typos or misspellings</li>
                <li>Try using generic drug names</li>
                <li>Search by category instead</li>
              </ul>
            </div>
          </div>

          <!-- Loading -->
          <div class="loader-container" v-if="loading">
            <Loader :useOverlay="false" :rounded="true" />
          </div>
        </div>

        <!-- Browse Categories -->
        <div class="categories-section" v-if="!searchQuery">
          <h3>Browse by Category</h3>
          <div class="categories-grid">
            <div
              v-for="category in categories"
              :key="category.slug"
              class="category-card"
              @click="goToCategory(category.slug)"
            >
              <RCIcon :name="category.icon" />
              <span>{{ category.name }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Floating Cart Button -->
    <div class="floating-cart" v-if="cartItemCount > 0" @click="goToCart">
      <RCIcon name="cart" />
      <span class="cart-badge">{{ cartItemCount }}</span>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import TopBar from "@/components/Navigation/top-bar";
import RcButton from "@/components/buttons/button-primary";
import Loader from "@/components/Loader/main-loader.vue";
import RCIcon from "@/components/RCIcon/RCIcon.vue";
import DrugCard from "./components/DrugCard.vue";
import {
  mapActions as useMapActions,
  mapGetters as useMapGetters,
} from "@/utilities/utilityStore";
import { debounce } from "lodash";

export default {
  name: "DrugSearch",
  components: {
    TopBar,
    RcButton,
    Loader,
    RCIcon,
    DrugCard,
  },
  emits: ["openSideNav"],
  setup() {
    const router = useRouter();
    const searchInput = ref(null);
    const searchQuery = ref("");
    const hasSearched = ref(false);
    const recentSearches = ref([]);

    const popularSearches = [
      "Paracetamol",
      "Ibuprofen",
      "Vitamin C",
      "Amoxicillin",
      "Omeprazole",
      "Cetirizine",
    ];

    const categories = [
      { name: "Pain Relief", slug: "pain-relief", icon: "pill" },
      { name: "Cold & Flu", slug: "cold-flu", icon: "thermometer" },
      { name: "Digestive Health", slug: "digestive", icon: "stomach" },
      { name: "Allergy", slug: "allergy", icon: "flower" },
      { name: "Skin Care", slug: "skin-care", icon: "droplet" },
      { name: "Vitamins", slug: "vitamins", icon: "sun" },
      { name: "First Aid", slug: "first-aid", icon: "plus-circle" },
      { name: "Eye Care", slug: "eye-care", icon: "eye" },
    ];

    const {
      "pharmacy/searchDrugs": searchDrugsAction,
      "pharmacy/addToCart": addToCartAction,
    } = useMapActions();

    const {
      "pharmacy/getSearchResults": searchResults,
      "pharmacy/getLoading": isLoading,
      "pharmacy/getCartItemCount": cartItemCount,
    } = useMapGetters();

    const loading = computed(() => isLoading.value);

    const loadRecentSearches = () => {
      const saved = localStorage.getItem("pharmacy_recent_searches");
      if (saved) {
        recentSearches.value = JSON.parse(saved);
      }
    };

    const saveRecentSearch = (query) => {
      if (!query.trim()) return;

      const searches = recentSearches.value.filter((s) => s !== query);
      searches.unshift(query);
      recentSearches.value = searches.slice(0, 5);
      localStorage.setItem(
        "pharmacy_recent_searches",
        JSON.stringify(recentSearches.value)
      );
    };

    const clearRecentSearches = () => {
      recentSearches.value = [];
      localStorage.removeItem("pharmacy_recent_searches");
    };

    const performSearch = async () => {
      if (!searchQuery.value.trim()) return;

      hasSearched.value = true;
      saveRecentSearch(searchQuery.value);
      await searchDrugsAction({
        query: searchQuery.value,
        page: 1,
        limit: 50,
      });
    };

    const debouncedSearch = debounce(() => {
      if (searchQuery.value.length >= 2) {
        performSearch();
      }
    }, 300);

    const clearSearch = () => {
      searchQuery.value = "";
      hasSearched.value = false;
    };

    const searchFromHistory = (query) => {
      searchQuery.value = query;
      performSearch();
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
        imageUrl: drug.image_url,
      });
    };

    const viewDrugDetails = (drugId) => {
      router.push(`/app/patient/pharmacy/drug/${drugId}`);
    };

    const goToCategory = (slug) => {
      router.push(`/app/patient/pharmacy/category/${slug}`);
    };

    const goToCart = () => {
      router.push("/app/patient/pharmacy/cart");
    };

    onMounted(() => {
      loadRecentSearches();
      if (searchInput.value) {
        searchInput.value.focus();
      }
    });

    return {
      searchInput,
      searchQuery,
      hasSearched,
      recentSearches,
      popularSearches,
      categories,
      searchResults,
      loading,
      cartItemCount,
      debouncedSearch,
      performSearch,
      clearSearch,
      clearRecentSearches,
      searchFromHistory,
      addToCart,
      viewDrugDetails,
      goToCategory,
      goToCart,
    };
  },
};
</script>

<style scoped lang="scss">
.search-page {
  padding: $size-16;

  .search-section {
    margin-bottom: $size-24;

    .search-input {
      display: flex;
      align-items: center;
      background: $color-white;
      border-radius: $size-12;
      padding: $size-14 $size-16;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

      svg {
        width: $size-22;
        height: $size-22;
        color: $color-g-67;
        margin-right: $size-12;
      }

      input {
        flex: 1;
        border: none;
        outline: none;
        font-size: $size-16;
        background: transparent;

        &::placeholder {
          color: $color-g-67;
        }
      }

      .clear-btn {
        padding: $size-4;
        border: none;
        background: transparent;
        cursor: pointer;

        svg {
          width: $size-18;
          height: $size-18;
          margin-right: 0;
        }
      }
    }
  }

  .recent-section {
    margin-bottom: $size-24;

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: $size-12;

      h3 {
        font-size: $size-16;
        font-weight: 600;
        color: $color-g-21;
      }

      button {
        font-size: $size-14;
        color: $color-pri;
        background: none;
        border: none;
        cursor: pointer;
      }
    }

    .recent-list {
      display: flex;
      flex-direction: column;
      gap: $size-8;

      .recent-item {
        display: flex;
        align-items: center;
        gap: $size-12;
        padding: $size-12;
        background: $color-white;
        border: none;
        border-radius: $size-8;
        cursor: pointer;
        text-align: left;

        svg {
          width: $size-18;
          height: $size-18;
          color: $color-g-67;
        }

        span {
          font-size: $size-14;
          color: $color-g-44;
        }

        &:hover {
          background: $color-g-95;
        }
      }
    }
  }

  .popular-section {
    margin-bottom: $size-24;

    h3 {
      font-size: $size-16;
      font-weight: 600;
      color: $color-g-21;
      margin-bottom: $size-12;
    }

    .popular-tags {
      display: flex;
      flex-wrap: wrap;
      gap: $size-8;

      .popular-tag {
        padding: $size-8 $size-16;
        background: $color-white;
        border: 1px solid $color-g-85;
        border-radius: $size-20;
        font-size: $size-14;
        color: $color-g-44;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          border-color: $color-pri;
          color: $color-pri;
        }
      }
    }
  }

  .results-section {
    .results-header {
      margin-bottom: $size-16;
      font-size: $size-14;
      color: $color-g-44;
    }

    .results-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: $size-16;

      @include responsive(tablet) {
        grid-template-columns: repeat(3, 1fr);
      }

      @include responsive(desktop) {
        grid-template-columns: repeat(4, 1fr);
      }
    }

    .no-results {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: $size-48;
      text-align: center;

      svg {
        width: $size-64;
        height: $size-64;
        color: $color-g-67;
        margin-bottom: $size-16;
      }

      h3 {
        font-size: $size-20;
        font-weight: 600;
        margin-bottom: $size-8;
      }

      p {
        color: $color-g-67;
        margin-bottom: $size-16;
      }

      .suggestions {
        text-align: left;
        background: $color-g-95;
        padding: $size-16;
        border-radius: $size-8;
        width: 100%;
        max-width: 300px;

        p {
          font-size: $size-14;
          font-weight: 500;
          color: $color-g-44;
          margin-bottom: $size-8;
        }

        ul {
          margin: 0;
          padding-left: $size-20;

          li {
            font-size: $size-14;
            color: $color-g-67;
            margin-bottom: $size-4;
          }
        }
      }
    }
  }

  .categories-section {
    h3 {
      font-size: $size-16;
      font-weight: 600;
      color: $color-g-21;
      margin-bottom: $size-16;
    }

    .categories-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: $size-12;

      @include responsive(tablet) {
        grid-template-columns: repeat(4, 1fr);
      }

      .category-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: $size-20;
        background: $color-white;
        border-radius: $size-12;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        }

        svg {
          width: $size-32;
          height: $size-32;
          color: $color-pri;
          margin-bottom: $size-8;
        }

        span {
          font-size: $size-14;
          font-weight: 500;
          color: $color-g-44;
          text-align: center;
        }
      }
    }
  }
}

.floating-cart {
  position: fixed;
  bottom: $size-24;
  right: $size-24;
  width: $size-56;
  height: $size-56;
  background: $color-pri;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  z-index: 100;

  svg {
    width: $size-24;
    height: $size-24;
    color: white;
  }

  .cart-badge {
    position: absolute;
    top: -$size-4;
    right: -$size-4;
    width: $size-22;
    height: $size-22;
    background: $color-denote-red;
    color: white;
    border-radius: 50%;
    font-size: $size-12;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.loader-container {
  display: flex;
  justify-content: center;
  padding: $size-48;
}
</style>
