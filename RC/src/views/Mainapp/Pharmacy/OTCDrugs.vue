<template>
  <div class="page-content">
    <top-bar
      type="title-with-back"
      title="Over-the-Counter Drugs"
      @open-side-nav="$emit('openSideNav')"
      @go-back="$router.back()"
    />

    <div class="page-content__body">
      <div class="otc-page">
        <!-- Search Bar -->
        <div class="search-section">
          <div class="search-input">
            <RCIcon name="search" />
            <input
              type="text"
              v-model="searchQuery"
              placeholder="Search OTC medications..."
              @input="debouncedSearch"
            />
            <button v-if="searchQuery" class="clear-btn" @click="clearSearch">
              <RCIcon name="close" />
            </button>
          </div>
        </div>

        <!-- Filters -->
        <div class="filters-section">
          <div class="filter-chips">
            <button
              v-for="category in categories"
              :key="category.value"
              :class="['filter-chip', { active: selectedCategory === category.value }]"
              @click="selectCategory(category.value)"
            >
              {{ category.label }}
            </button>
          </div>
          <button class="sort-btn" @click="toggleSort">
            <RCIcon name="sort" />
            {{ sortLabel }}
          </button>
        </div>

        <!-- Results Count -->
        <div class="results-info" v-if="!loading">
          <span>{{ totalDrugs }} medications found</span>
        </div>

        <!-- Drug Grid -->
        <div class="drugs-grid" v-if="!loading && drugs.length > 0">
          <DrugCard
            v-for="drug in drugs"
            :key="drug._id"
            :drug="drug"
            @add-to-cart="addToCart"
            @view-details="viewDrugDetails"
          />
        </div>

        <!-- Empty State -->
        <div v-if="!loading && drugs.length === 0" class="empty-state">
          <RCIcon name="pill" />
          <h3>No medications found</h3>
          <p>Try adjusting your search or filters</p>
          <rc-button
            type="secondary"
            label="Clear Filters"
            @click="clearFilters"
          />
        </div>

        <!-- Load More -->
        <div v-if="hasMore && drugs.length > 0" class="load-more">
          <rc-button
            type="secondary"
            label="Load More"
            :loading="loadingMore"
            @click="loadMore"
          />
        </div>

        <!-- Loader -->
        <div class="loader-container" v-if="loading">
          <Loader :useOverlay="false" :rounded="true" />
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
import { ref, computed, onMounted, watch } from "vue";
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
  name: "OTCDrugs",
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
    const searchQuery = ref("");
    const selectedCategory = ref("all");
    const sortBy = ref("name");
    const sortOrder = ref("asc");
    const page = ref(1);
    const loadingMore = ref(false);

    const categories = [
      { label: "All", value: "all" },
      { label: "Pain Relief", value: "pain_relief" },
      { label: "Cold & Flu", value: "cold_flu" },
      { label: "Digestive", value: "digestive" },
      { label: "Allergy", value: "allergy" },
      { label: "Skin Care", value: "skin_care" },
      { label: "Vitamins", value: "vitamins" },
    ];

    const {
      "pharmacy/fetchOTCDrugs": fetchOTCDrugs,
      "pharmacy/searchDrugs": searchDrugs,
      "pharmacy/addToCart": addToCartAction,
    } = useMapActions();

    const {
      "pharmacy/getOTCDrugs": otcDrugs,
      "pharmacy/getLoading": isLoading,
      "pharmacy/getCartItemCount": cartItemCount,
      "pharmacy/getTotalDrugs": totalDrugs,
    } = useMapGetters();

    const loading = computed(() => isLoading.value);
    const drugs = computed(() => otcDrugs.value || []);
    const hasMore = computed(() => drugs.value.length < totalDrugs.value);

    const sortLabel = computed(() => {
      const labels = {
        name: "Name",
        price_asc: "Price: Low to High",
        price_desc: "Price: High to Low",
        popular: "Popular",
      };
      return labels[sortBy.value] || "Sort";
    });

    const fetchDrugs = async (reset = false) => {
      if (reset) {
        page.value = 1;
      }

      const params = {
        page: page.value,
        limit: 20,
        sort: sortBy.value,
        order: sortOrder.value,
      };

      if (selectedCategory.value !== "all") {
        params.category = selectedCategory.value;
      }

      if (searchQuery.value) {
        await searchDrugs({ query: searchQuery.value, ...params });
      } else {
        await fetchOTCDrugs(params);
      }
    };

    const debouncedSearch = debounce(() => {
      fetchDrugs(true);
    }, 300);

    const clearSearch = () => {
      searchQuery.value = "";
      fetchDrugs(true);
    };

    const selectCategory = (category) => {
      selectedCategory.value = category;
      fetchDrugs(true);
    };

    const toggleSort = () => {
      const sortOptions = ["name", "price_asc", "price_desc", "popular"];
      const currentIndex = sortOptions.indexOf(sortBy.value);
      const nextIndex = (currentIndex + 1) % sortOptions.length;
      sortBy.value = sortOptions[nextIndex];

      if (sortBy.value === "price_asc") {
        sortOrder.value = "asc";
      } else if (sortBy.value === "price_desc") {
        sortOrder.value = "desc";
      }

      fetchDrugs(true);
    };

    const clearFilters = () => {
      searchQuery.value = "";
      selectedCategory.value = "all";
      sortBy.value = "name";
      sortOrder.value = "asc";
      fetchDrugs(true);
    };

    const loadMore = async () => {
      loadingMore.value = true;
      page.value += 1;
      await fetchDrugs();
      loadingMore.value = false;
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

    const goToCart = () => {
      router.push("/app/patient/pharmacy/cart");
    };

    onMounted(() => {
      fetchDrugs(true);
    });

    return {
      searchQuery,
      selectedCategory,
      sortBy,
      categories,
      drugs,
      loading,
      loadingMore,
      totalDrugs,
      hasMore,
      sortLabel,
      cartItemCount,
      debouncedSearch,
      clearSearch,
      selectCategory,
      toggleSort,
      clearFilters,
      loadMore,
      addToCart,
      viewDrugDetails,
      goToCart,
    };
  },
};
</script>

<style scoped lang="scss">
.otc-page {
  padding: $size-16;

  .search-section {
    margin-bottom: $size-16;

    .search-input {
      display: flex;
      align-items: center;
      background: $color-white;
      border-radius: $size-12;
      padding: $size-12 $size-16;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

      svg {
        width: $size-20;
        height: $size-20;
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
          width: $size-16;
          height: $size-16;
          margin-right: 0;
        }
      }
    }
  }

  .filters-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $size-16;
    gap: $size-12;

    .filter-chips {
      display: flex;
      gap: $size-8;
      overflow-x: auto;
      padding-bottom: $size-4;
      flex: 1;

      &::-webkit-scrollbar {
        display: none;
      }

      .filter-chip {
        padding: $size-8 $size-16;
        border: 1px solid $color-g-85;
        border-radius: $size-20;
        background: $color-white;
        font-size: $size-14;
        white-space: nowrap;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          border-color: $color-pri;
        }

        &.active {
          background: $color-pri;
          border-color: $color-pri;
          color: white;
        }
      }
    }

    .sort-btn {
      display: flex;
      align-items: center;
      gap: $size-6;
      padding: $size-8 $size-12;
      border: 1px solid $color-g-85;
      border-radius: $size-8;
      background: $color-white;
      font-size: $size-14;
      cursor: pointer;
      white-space: nowrap;

      svg {
        width: $size-16;
        height: $size-16;
      }

      &:hover {
        border-color: $color-pri;
      }
    }
  }

  .results-info {
    margin-bottom: $size-16;
    font-size: $size-14;
    color: $color-g-44;
  }

  .drugs-grid {
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

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
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
      margin-bottom: $size-24;
    }
  }

  .load-more {
    display: flex;
    justify-content: center;
    margin-top: $size-24;
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
