<template>
  <div class="page-content">
    <TopBar showButtons type="avatar" @open-side-nav="$emit('openSideNav')" />
    <div class="page-content__body">
      <div class="drugs-container">
        <!-- Header -->
        <div class="page-header">
          <div class="page-header__back">
            <button class="back-btn" @click="$router.back()">
              <rc-icon icon-name="arrow-left" size="sm" />
            </button>
            <div>
              <h1>Drug Catalog</h1>
              <p>Browse available medications and check stock</p>
            </div>
          </div>
        </div>

        <!-- Search & Filters -->
        <div class="filters-section">
          <div class="search-bar">
            <rc-icon icon-name="search" size="sm" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search medications..."
              @input="debouncedSearch"
            />
            <button v-if="searchQuery" class="clear-btn" @click="clearSearch">
              <rc-icon icon-name="close" size="xs" />
            </button>
          </div>
          <div class="filters-row">
            <div class="filter-group">
              <label>Category</label>
              <select v-model="selectedCategory" @change="applyFilters">
                <option value="">All Categories</option>
                <option
                  v-for="category in categories"
                  :key="category._id"
                  :value="category._id"
                >
                  {{ category.name }}
                </option>
              </select>
            </div>
            <div class="filter-group">
              <label>Manufacturer</label>
              <select v-model="selectedManufacturer" @change="applyFilters">
                <option value="">All Manufacturers</option>
                <option
                  v-for="manufacturer in manufacturers"
                  :key="manufacturer"
                  :value="manufacturer"
                >
                  {{ manufacturer }}
                </option>
              </select>
            </div>
            <div class="filter-group">
              <label>Stock Status</label>
              <select v-model="stockStatus" @change="applyFilters">
                <option value="all">All</option>
                <option value="in_stock">In Stock</option>
                <option value="low_stock">Low Stock</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </div>
            <div class="filter-group">
              <label>Sort By</label>
              <select v-model="sortBy" @change="applyFilters">
                <option value="name">Name (A-Z)</option>
                <option value="-name">Name (Z-A)</option>
                <option value="selling_price">Price (Low-High)</option>
                <option value="-selling_price">Price (High-Low)</option>
                <option value="quantity">Stock (Low-High)</option>
                <option value="-quantity">Stock (High-Low)</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <loader v-if="isLoading" :useOverlay="false" />

        <!-- Results -->
        <div v-else class="results-section">
          <p class="results-count" v-if="drugs.length">
            Showing {{ drugs.length }} of {{ pagination.total }} medications
          </p>

          <div class="drugs-grid" v-if="drugs.length">
            <div
              v-for="drug in drugs"
              :key="drug.batch_id ? `${drug._id}-${drug.batch_id}` : drug._id"
              class="drug-card"
              @click="viewDrug(drug._id, drug.batch_id)"
            >
              <div class="drug-card__image">
                <img
                  v-if="drug.primary_image"
                  :src="drug.primary_image"
                  :alt="drug.name"
                />
                <div v-else class="drug-placeholder">
                  <rc-icon icon-name="pill" size="lg" />
                </div>
                <span
                  v-if="drug.requires_prescription"
                  class="rx-badge"
                  title="Requires Prescription"
                >
                  Rx
                </span>
              </div>
              <div class="drug-card__content">
                <h3>{{ drug.name }}</h3>
                <p class="generic-name">{{ drug.generic_name }}</p>
                <p class="drug-details">
                  {{ drug.strength }} | {{ drug.dosage_form }}
                </p>
                <p class="manufacturer">{{ drug.manufacturer }}</p>
                <div class="drug-card__footer">
                  <div class="price">
                    <span class="currency">NGN</span>
                    <span class="amount">{{ formatCurrency(drug.selling_price) }}</span>
                  </div>
                  <div :class="['stock-status', getStockClass(drug)]">
                    {{ getStockText(drug) }}
                  </div>
                </div>
                <div class="drug-card__actions">
                  <button
                    class="prescribe-btn"
                    @click.stop="prescribeDrug(drug)"
                    :disabled="drug.is_out_of_stock || drug.quantity === 0"
                    title="Create prescription with this medication"
                  >
                    <rc-icon icon-name="prescription" size="sm" />
                    Prescribe
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="empty-state">
            <rc-icon icon-name="pill" size="xl" />
            <h3>No medications found</h3>
            <p>Try adjusting your search or filter criteria</p>
          </div>

          <!-- Pagination -->
          <div v-if="pagination.totalPages > 1" class="pagination">
            <button
              class="pagination-btn"
              :disabled="pagination.page === 1"
              @click="goToPage(pagination.page - 1)"
            >
              <rc-icon icon-name="chevron-left" size="sm" />
            </button>
            <span class="pagination-info">
              Page {{ pagination.page }} of {{ pagination.totalPages }}
            </span>
            <button
              class="pagination-btn"
              :disabled="pagination.page === pagination.totalPages"
              @click="goToPage(pagination.page + 1)"
            >
              <rc-icon icon-name="chevron-right" size="sm" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import TopBar from "@/components/Navigation/top-bar";
import Loader from "@/components/Loader/main-loader";
import RcIcon from "@/components/RCIcon";
import apiFactory from "@/services/apiFactory";
import { debounce } from "lodash";

export default {
  name: "PharmacyDrugs",
  components: {
    TopBar,
    Loader,
    RcIcon,
  },
  data() {
    return {
      isLoading: false,
      searchQuery: "",
      selectedCategory: "",
      selectedManufacturer: "",
      stockStatus: "all",
      sortBy: "name",
      drugs: [],
      categories: [],
      manufacturers: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      },
    };
  },
  created() {
    this.debouncedSearch = debounce(this.searchDrugs, 300);
  },
  async mounted() {
    await Promise.all([
      this.fetchCategories(),
      this.fetchManufacturers(),
      this.searchDrugs(),
    ]);
  },
  methods: {
    async searchDrugs() {
      try {
        this.isLoading = true;
        const params = {
          search: this.searchQuery || undefined,
          category: this.selectedCategory || undefined,
          manufacturer: this.selectedManufacturer || undefined,
          stock_status: this.stockStatus !== "all" ? this.stockStatus : undefined,
          sort_by: this.sortBy.replace("-", ""),
          sort_order: this.sortBy.startsWith("-") ? "desc" : "asc",
          page: this.pagination.page,
          limit: this.pagination.limit,
        };
        const response = await apiFactory.$_searchPharmacyDrugs(params);
        // Backend returns: { statusCode, message, data: { total, docs, pages, perPage, currentPage } }
        const result = response.data?.data || response.data?.result;
        if (result) {
          this.drugs = result.docs || [];
          this.pagination = {
            ...this.pagination,
            total: result.total || 0,
            totalPages: result.pages || 0,
          };
        }
      } catch (error) {
        console.error("Error searching drugs:", error);
        this.$toast.error("Failed to load medications");
      } finally {
        this.isLoading = false;
      }
    },
    async fetchCategories() {
      try {
        const response = await apiFactory.$_getPharmacyDrugCategories();
        const result = response.data?.data || response.data?.result;
        if (result) {
          this.categories = result || [];
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    },
    async fetchManufacturers() {
      try {
        const response = await apiFactory.$_getPharmacyManufacturers();
        const result = response.data?.data || response.data?.result;
        if (result) {
          this.manufacturers = result || [];
        }
      } catch (error) {
        console.error("Error fetching manufacturers:", error);
      }
    },
    applyFilters() {
      this.pagination.page = 1;
      this.searchDrugs();
    },
    clearSearch() {
      this.searchQuery = "";
      this.pagination.page = 1;
      this.searchDrugs();
    },
    goToPage(page) {
      this.pagination.page = page;
      this.searchDrugs();
    },
    viewDrug(drugId, batchId = null) {
      const route = `/app/specialist/pharmacy/drugs/${drugId}`;
      if (batchId) {
        this.$router.push({ path: route, query: { batch: batchId } });
      } else {
        this.$router.push(route);
      }
    },
    formatCurrency(amount) {
      if (!amount) return "0.00";
      return Number(amount).toLocaleString("en-NG", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    },
    getStockClass(drug) {
      if (drug.is_out_of_stock || drug.quantity === 0) return "out-of-stock";
      if (drug.is_low_stock || drug.quantity <= drug.reorder_level) return "low-stock";
      return "in-stock";
    },
    getStockText(drug) {
      if (drug.is_out_of_stock || drug.quantity === 0) return "Out of Stock";
      if (drug.is_low_stock || drug.quantity <= drug.reorder_level) {
        return `Low Stock (${drug.quantity})`;
      }
      return `In Stock (${drug.quantity})`;
    },
    prescribeDrug(drug) {
      // Navigate to create prescription page with drug pre-selected
      const query = { drug: drug._id };
      if (drug.batch_id) {
        query.batch = drug.batch_id;
      }
      this.$router.push({
        path: '/app/specialist/pharmacy/prescriptions/create',
        query,
      });
    },
  },
};
</script>

<style scoped lang="scss">
.page-content {
  @include flexItem(vertical) {
    width: 100%;
    height: 100%;
    background-color: $color-g-97;
  }

  &__body {
    flex-grow: 1;
    overflow-y: auto;
    padding: $size-24;

    @include responsive(tab-portrait) {
      padding: $size-16;
    }
  }
}

.drugs-container {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: $size-24;

  &__back {
    display: flex;
    align-items: center;
    gap: $size-16;

    .back-btn {
      width: $size-40;
      height: $size-40;
      border-radius: 50%;
      border: none;
      background: $color-white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

      &:hover {
        background: $color-g-95;
      }
    }

    h1 {
      font-size: $size-24;
      font-weight: $fw-semi-bold;
      color: $color-g-21;
      margin-bottom: $size-4;
    }

    p {
      font-size: $size-15;
      color: $color-g-54;
    }
  }
}

.filters-section {
  margin-bottom: $size-24;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: $size-12;
  background: $color-white;
  padding: $size-12 $size-16;
  border-radius: $size-12;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  margin-bottom: $size-16;

  input {
    flex: 1;
    border: none;
    outline: none;
    font-size: $size-15;
    color: $color-g-21;

    &::placeholder {
      color: $color-g-67;
    }
  }

  .clear-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: $size-4;
    color: $color-g-54;

    &:hover {
      color: $color-g-36;
    }
  }
}

.filters-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $size-12;

  @include responsive(tab-landscape) {
    grid-template-columns: repeat(2, 1fr);
  }

  @include responsive(phone) {
    grid-template-columns: 1fr;
  }
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: $size-6;

  label {
    font-size: $size-12;
    font-weight: $fw-medium;
    color: $color-g-54;
  }

  select {
    padding: $size-10 $size-12;
    border: 1px solid $color-g-85;
    border-radius: $size-8;
    font-size: $size-15;
    color: $color-g-36;
    background: $color-white;
    cursor: pointer;

    &:focus {
      outline: none;
      border-color: $color-pri;
    }
  }
}

.results-section {
  min-height: 200px;
}

.results-count {
  font-size: $size-15;
  color: $color-g-54;
  margin-bottom: $size-16;
}

.drugs-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $size-16;

  @include responsive(tab-landscape) {
    grid-template-columns: repeat(3, 1fr);
  }

  @include responsive(tab-portrait) {
    grid-template-columns: repeat(2, 1fr);
  }

  @include responsive(phone) {
    grid-template-columns: 1fr;
  }
}

.drug-card {
  background: $color-white;
  border-radius: $size-12;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  }

  &__image {
    position: relative;
    height: 140px;
    background: $color-g-97;
    display: flex;
    align-items: center;
    justify-content: center;

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
      top: $size-8;
      right: $size-8;
      background: $color-pri;
      color: $color-white;
      font-size: $size-10;
      font-weight: $fw-bold;
      padding: $size-4 $size-8;
      border-radius: $size-4;
    }
  }

  &__content {
    padding: $size-16;

    h3 {
      font-size: $size-15;
      font-weight: $fw-semi-bold;
      color: $color-g-21;
      margin-bottom: $size-4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .generic-name {
      font-size: $size-12;
      color: $color-pri;
      margin-bottom: $size-4;
      font-style: italic;
    }

    .drug-details {
      font-size: $size-12;
      color: $color-g-54;
      margin-bottom: $size-4;
    }

    .manufacturer {
      font-size: $size-12;
      color: $color-g-67;
      margin-bottom: $size-12;
    }
  }

  &__footer {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .price {
      .currency {
        font-size: $size-12;
        color: $color-g-54;
      }

      .amount {
        font-size: $size-16;
        font-weight: $fw-bold;
        color: $color-g-21;
        margin-left: $size-2;
      }
    }

    .stock-status {
      font-size: $size-11;
      padding: $size-4 $size-8;
      border-radius: $size-12;
      font-weight: $fw-medium;

      &.in-stock {
        background: rgba(#10b981, 0.1);
        color: #059669;
      }

      &.low-stock {
        background: rgba(#f59e0b, 0.1);
        color: #d97706;
      }

      &.out-of-stock {
        background: rgba(#ef4444, 0.1);
        color: #dc2626;
      }
    }
  }

  &__actions {
    margin-top: $size-12;
    padding-top: $size-12;
    border-top: 1px solid $color-g-92;

    .prescribe-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: $size-8;
      padding: $size-10 $size-12;
      background: $color-pri;
      color: $color-white;
      border: none;
      border-radius: $size-8;
      font-size: $size-14;
      font-weight: $fw-medium;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover:not(:disabled) {
        background: darken($color-pri, 8%);
      }

      &:disabled {
        background: $color-g-85;
        color: $color-g-54;
        cursor: not-allowed;
      }
    }
  }
}

.empty-state {
  text-align: center;
  padding: $size-64 $size-24;
  color: $color-g-54;

  h3 {
    font-size: $size-18;
    font-weight: $fw-semi-bold;
    color: $color-g-44;
    margin: $size-16 0 $size-8;
  }

  p {
    font-size: $size-15;
  }
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: $size-16;
  margin-top: $size-24;

  &-btn {
    width: $size-40;
    height: $size-40;
    border-radius: $size-8;
    border: 1px solid $color-g-85;
    background: $color-white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover:not(:disabled) {
      border-color: $color-pri;
      color: $color-pri;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  &-info {
    font-size: $size-15;
    color: $color-g-54;
  }
}
</style>
